"""Reproducible prototype studies; outputs are never production-cut approvals."""
from collections import Counter
import json,hashlib,itertools,shutil,sys
import numpy as np,trimesh,ezdxf,cadquery as cq
from shapely.geometry import Polygon,box
from shapely.ops import unary_union
from model import *
OUT=HERE/'artifacts';OUT.mkdir(exist_ok=True)
DISPLAY=np.array([[.001,0,0,0],[0,0,.001,0],[0,-.001,0,0],[0,0,0,1]])
results=[]
for option in (sys.argv[1:] or ['R_RAIL_REINDEX','L_LEG_BASE']):
 folder=OUT/option;folder.mkdir(exist_ok=True);dxfs=folder/'dxf';dxfs.mkdir(exist_ok=True)
 orig,profiles,origin=option_profiles(option);rows=instances(option);qty=Counter(r['profile'] for r in rows)
 solids={k:solid(p) for k,p in profiles.items()};world={r['name']:moved(solids[r['profile']],np.array(r['matrix'])) for r in rows}
 # Reference corner is validated before the 19-body pair scan.
 cnames=['L_south','W_west','SW_LEG_A','SW_LEG_B','SW_BASE'];cornerpairs=[]
 for a,b in itertools.combinations(cnames,2):
  common=world[a].intersect(world[b]);v=common.Volume() if common.Solids() else 0.;d=world[a].distance(world[b]);components=contact_components(world[a],world[b]) if d<1e-6 and v<VTOL else dict(X=0.,Y=0.,Z=0.);area=sum(components.values())
  cornerpairs.append(dict(a=a,b=b,overlap_mm3=v,distance_mm=d,face_contact_mm2=area,contact_components_mm2=components))
 required=[('L_south','W_west'),('L_south','SW_LEG_A'),('W_west','SW_LEG_B'),('SW_LEG_A','SW_LEG_B'),('SW_LEG_A','SW_BASE'),('SW_LEG_B','SW_BASE')]
 cp={frozenset((p['a'],p['b'])):p for p in cornerpairs}
 corner_pass=all(p['overlap_mm3']<VTOL for p in cornerpairs) and all(cp[frozenset(x)]['face_contact_mm2']>1e-4 for x in required)
 sp=cp[frozenset(('SW_LEG_A','SW_LEG_B'))];expected_vertical=2244 if option=='L_LEG_BASE' else 2280;corner_pass=corner_pass and abs(sp['contact_components_mm2']['X']+sp['contact_components_mm2']['Y']-expected_vertical)<1e-5
 write(folder/'corner.json',dict(status='PASS' if corner_pass else 'FAIL',pairs=cornerpairs,required_mates=required))
 print(option,'corner',corner_pass,[(p['a'],p['b'],round(p['overlap_mm3'],6),round(p['face_contact_mm2'],3)) for p in cornerpairs],flush=True)
 if not corner_pass:
  results.append(dict(option=option,status='FAIL_CORNER'));continue
 pairs,joints=pairs_and_joints(world,rows);passed=all(p['status']=='PASS' for p in pairs) and all(j['status']=='PASS' for j in joints)
 write(folder/'pairs-171.json',pairs);write(folder/'joints-32.json',joints)
 print(option,'full',passed,'collisions',[p for p in pairs if p['status']=='FAIL'],'bad joints',[j for j in joints if j['status']=='FAIL'],flush=True)
 bom=[]
 for k,p in profiles.items():
  old=orig[origin[k]];delta=p.symmetric_difference(old);aold=old.area
  if option in ['R_RAIL_REINDEX','R_ROUNDED_SHOULDERS'] and k in ['LENGTH_OUTER_L','WIDTH_OUTER_W']:
   regions=[]
   for group,shift in zip(FEATURES[k]['upper_leg_receivers'],[6,-11]):
    for lo,hi in group:regions.extend([box(lo,10,hi,16),box(lo+shift,10,hi+shift,16)])
   assert delta.difference(unary_union(regions)).area<1e-7
  if k.startswith('LEG_'):
   oldholes=unary_union([Polygon(r) for r in old.interiors]);newholes=unary_union([Polygon(r) for r in p.interiors]);assert oldholes.symmetric_difference(newholes).area<1e-7
  file=k+f'_x{qty[k]}_t6_V31_CANDIDATE_{option}.dxf';doc=ezdxf.new('R2013');doc.units=4;doc.layers.new('V31_CANDIDATE_CUT')
  for ring in [p.exterior,*p.interiors]:doc.modelspace().add_lwpolyline(list(ring.coords)[:-1],close=True,dxfattribs={'layer':'V31_CANDIDATE_CUT'})
  doc.saveas(dxfs/file);(dxfs/file).write_text('999\nV31_CANDIDATE DESIGN_ONLY NOT_FOR_PRODUCTION NOMINAL_6MM NO_KERF\n'+(dxfs/file).read_text());readback=load_dxf(dxfs/file);assert readback.symmetric_difference(p).area<1e-7
  cq.exporters.export(solids[k],str(folder/(k+'_V31_CANDIDATE.step')))
  bom.append(dict(profile=k,source_class=origin[k],quantity=qty[k],changed=delta.area>1e-7,source_area_mm2=aold,area_mm2=p.area,added_mm2=p.difference(old).area,removed_mm2=old.difference(p).area,symmetric_delta_mm2=delta.area,hausdorff_mm=p.hausdorff_distance(old),source_bbox_mm=list(old.bounds),candidate_bbox_mm=list(p.bounds),dxf='dxf/'+file,clearance_mm=0,kerf_compensated=False,production_authorized=False))
 write(folder/'bom-and-delta.json',bom);write(folder/'transforms.json',dict(axes='mm XYZ, right-handed Z-up, floor Z0; GLB metres (X,Z,-Y)/1000',instances=rows,tabletop=False,production_authorized=False))
 ass=cq.Assembly(name='FLOW_V31_CANDIDATE_FULL_19_DESIGN_ONLY_'+option);scene=trimesh.Scene()
 colors={'frame':[178,137,85,255],'leg':[155,118,73,255],'base':[100,120,102,255]}
 for r in rows:
  s=world[r['name']];color=colors[r['role']];ass.add(s,name=r['name'],color=cq.Color(*[x/255 for x in color[:3]]))
  v,f=s.tessellate(.05);mesh=trimesh.Trimesh(vertices=[x.toTuple() for x in v],faces=f,process=True);assert mesh.is_watertight and mesh.is_winding_consistent
  mesh.apply_transform(DISPLAY);mesh.visual=trimesh.visual.ColorVisuals(mesh,vertex_colors=color);scene.add_geometry(mesh,node_name=r['name'],geom_name=r['name'])
 name='FLOW_V31_CANDIDATE_FULL_19_DESIGN_ONLY';ass.export(str(folder/(name+'.step')))
 scene.metadata=dict(status='CAD_COMPUTED_PASS' if passed else 'FAIL',option=option,revision='V3.1_CANDIDATE',production_authorized=False,physical_fit_validated=False,tabletop=False)
 scene.export(str(folder/(name+'.glb')))
 rt=cq.importers.importStep(str(folder/(name+'.step'))).val();assert rt.isValid() and len(rt.Solids())==19
 bbox=rt.BoundingBox();bounds=[bbox.xlen,bbox.ylen,bbox.zlen]
 # A1mm disturbance must be detected; no tolerance broadening to hide failures.
 neg=world['SW_LEG_A'].translate((-1,0,0)).intersect(world['SW_LEG_B']);bad=neg.Volume() if neg.Solids() else 0.;assert bad>VTOL
 summary=dict(option=option,status='CAD_COMPUTED_PASS' if passed else 'FAIL',reference_corner='PASS',instances=19,pairs=171,collision_failures=sum(p['status']=='FAIL' for p in pairs),required_joints=32,joint_failures=sum(j['status']=='FAIL' for j in joints),bounds_mm=bounds,frame_height_mm=380,step_roundtrip_solids=19,changed_patterns=sum(b['changed'] for b in bom),changed_physical_pieces=sum(b['quantity'] for b in bom if b['changed']),physical_profile_delta_mm2=sum(b['quantity']*b['symmetric_delta_mm2'] for b in bom),base_area_mm2=profiles['TRI_BASE_ROUNDED'].area,original_base_area_mm2=orig['TRI_BASE_ROUNDED'].area,negative_control_overlap_mm3=bad,clearance_mm=0,kerf_compensated=False,production_authorized=False,physical_validation='NOT_PERFORMED')
 write(folder/'summary.json',summary);results.append(summary)
if not sys.argv[1:]:write(OUT/'summary.json',results)
print(json.dumps(results,indent=2))
