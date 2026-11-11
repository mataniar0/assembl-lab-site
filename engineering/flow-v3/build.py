"""Source-preserving V3 reconstruction; never imports other design revisions.
CAD millimetres, right-handed Z-up. GLB metres, Y-up: (X,Z,-Y).
"""
from pathlib import Path
import json, hashlib, itertools, re, io
import numpy as np
import ezdxf, cadquery as cq, trimesh
from OCP.gp import gp_Trsf
from shapely.geometry import Polygon
ROOT=Path(__file__).resolve().parents[2]
OUT=Path(__file__).resolve().parent/'artifacts'
OUT.mkdir(exist_ok=True)
def write(name,data): (OUT/name).write_text(json.dumps(data,indent=2)+'\n')
def profile(p):
    raw=p.read_text(); assert 'HEADER' not in raw
    # Headerless files contain modern LWPOLYLINE subclasses and 70=1.
    # Declare AC1015 in memory so ezdxf does not discard their closure/layer tags as R12.
    doc=ezdxf.read(io.StringIO('0\nSECTION\n2\nHEADER\n9\n$ACADVER\n1\nAC1015\n0\nENDSEC\n'+raw)); es=list(doc.modelspace())
    assert all(e.dxftype()=='LWPOLYLINE' and e.closed for e in es)
    assert all(not b for e in es for x,y,a,c,b in e.get_points()), 'Curves need exact arc handling'
    ps=[Polygon([(float(x),float(y)) for x,y,*_ in e.get_points()]) for e in es]
    assert all(p.is_valid for p in ps)
    outer=max(ps,key=lambda p:p.area); cuts=[p for p in ps if p is not outer]
    result=outer
    for cut in cuts: result=result.difference(cut)
    assert result.is_valid and result.geom_type=='Polygon'
    return result,ps,doc

def solid(poly):
    wire=lambda pts:cq.Wire.makePolygon([cq.Vector(x,y,0) for x,y in pts],close=True)
    return cq.Solid.extrudeLinear(wire(poly.exterior.coords),[wire(r.coords) for r in poly.interiors],cq.Vector(0,0,6))

def moved(s,M):
    tr=gp_Trsf(); tr.SetValues(*M[:3,:].reshape(-1).tolist()); return s.moved(cq.Location(tr))

def xf(u,v,t,origin):
    M=np.eye(4); M[:3,:3]=np.array([u,v,t]).T; M[:3,3]=origin; return M

parts={};inventory=[]
for p in sorted((ROOT/'flowgen').glob('*V3*.dxf')):
    key=re.sub(r'_x\d.*','',p.stem.removeprefix('Flow_'));poly,ps,doc=profile(p)
    s=solid(poly); assert s.isValid() and len(s.Solids())==1
    assert abs(s.Volume()-poly.area*6)<1e-5
    cq.exporters.export(s,str(OUT/(key+'.step')))
    vs,fs=s.tessellate(.05);mesh=trimesh.Trimesh(vertices=[v.toTuple() for v in vs],faces=fs,process=True)
    assert mesh.is_watertight and mesh.is_winding_consistent
    parts[key]=(s,mesh,poly)
    inventory.append(dict(part=key,file=str(p.relative_to(ROOT)),sha256=hashlib.sha256(p.read_bytes()).hexdigest(),quantity=int(re.search(r'_x(\d+)',p.name)[1]),units='mm',thickness_mm=6,source_bbox=list(poly.bounds),closed=True,valid=True,area_mm2=poly.area,volume_mm3=s.Volume(),solid_count=1,watertight=True,units_header=doc.header.get('$INSUNITS',0)))
write('inventory.json',inventory)

# Coordinate values are derived exclusively from receiving V3 slots and complementary ends.
# Remove the common DXF drafting margin (10,10); frame origin is its lower SW corner,
# not the floor. Normal axis t is the nominal 6 mm material thickness.
instances=[]
def add(key,name,M,evidence):
    s,m,p=parts[key];world=moved(s,M);mm=m.copy();mm.apply_transform(M)
    assert world.isValid()
    instances.append(dict(name=name,part=key,matrix=M.tolist(),evidence=evidence,solid=world,mesh=mm))
add('LENGTH_OUTER_L','L_south',xf((1,0,0),(0,0,1),(0,-1,0),(-10,6,-10)),'V3 860mm rail ends, width 480mm; corner fingers at 0..6 and 854..860')
add('LENGTH_OUTER_L','L_north',xf((1,0,0),(0,0,1),(0,-1,0),(-10,480,-10)),'Opposite identical rail: 480-6=474 inner plane')
add('WIDTH_OUTER_W','W_west',xf((0,1,0),(0,0,1),(1,0,0),(0,-10,-10)),'V3 480mm width rail; complementary corner ends')
add('WIDTH_OUTER_W','W_east',xf((0,1,0),(0,0,1),(1,0,0),(854,-10,-10)),'Opposite identical rail: 860-6=854 inner plane')
add('LENGTH_CENTER_LC','LC',xf((1,0,0),(0,0,1),(0,-1,0),(-10,243,-10)),'WIDTH receiver x=247..253 minus 10 => Y=237..243')
for idx,x in enumerate((283.666667,570.333333)):
    add('CROSS_BEAM_C',f'C_{idx+1}',xf((0,1,0),(0,0,1),(1,0,0),(x,-10,-10)),'LENGTH receiver x=293.667..299.667 /580.333..586.333 minus 10; C slot at Y=237..243')

pairs=[]
for a,b in itertools.combinations(instances,2):
    intersection=a['solid'].intersect(b['solid']); vol=intersection.Volume() if intersection.Solids() else 0
    dist=a['solid'].distance(b['solid'])
    pairs.append(dict(a=a['name'],b=b['name'],intersection_mm3=vol,distance_mm=dist,status='PASS' if vol<1e-5 else 'FAIL'))
write('frame-pairs.json',pairs)
expected_contacts={frozenset(p) for p in [('L_south','W_west'),('L_south','W_east'),('L_north','W_west'),('L_north','W_east'),('L_south','C_1'),('L_south','C_2'),('L_north','C_1'),('L_north','C_2'),('W_west','LC'),('W_east','LC'),('LC','C_1'),('LC','C_2')]}
actual_contacts={frozenset((p['a'],p['b'])) for p in pairs if p['distance_mm']<1e-7}
assert actual_contacts==expected_contacts and all(p['status']=='PASS' for p in pairs)
# Negative control: a 1 mm misplaced C must collide with the centre half-lap.
byname={i['name']:i for i in instances}
bad=byname['C_1']['solid'].translate((1,0,0)).intersect(byname['LC']['solid']).Volume()
assert bad>1, 'Collision detector failed negative control'
# Independent local profile checks, not an assertion of world placements.
from shapely.geometry import LineString
from shapely.affinity import translate
A=parts['LEG_A'][2];B=parts['LEG_B'][2];L=parts['LENGTH_OUTER_L'][2];W=parts['WIDTH_OUTER_W'][2]
fingers=[]
for y in range(20,400,20):
    line=LineString([(-100,y),(200,y)])
    a=A.intersection(line).bounds[0]; b=B.intersection(line).bounds[0]
    fingers.append(dict(y_mm=y,xA_mm=a,xB_mm=b,sum_mm=a+b))
assert len(fingers)==19 and all(abs(p['sum_mm']-26)<1e-7 for p in fingers)
local=[]
for name,rail in [('LENGTH_OUTER_L',L),('WIDTH_OUTER_W',W)]:
    moved_leg=translate(A,xoff=-6,yoff=-380)
    overlap=moved_leg.intersection(rail).area; distance=moved_leg.distance(rail)
    local.append(dict(interface='LEG_A left ↔ '+name,offset_mm=[-6,-380],overlap_mm2=overlap,distance_mm=distance,status='PASS' if overlap<1e-6 and distance<1e-7 else 'FAIL'))
write('local-joints.json',dict(finger_samples=fingers,left_leg_rail=local,scope='2D local mating only; right mirrors, world leg placements and tri-base orientation BLOCKED',negative_control_shifted_C_mm3=bad))

assembly=cq.Assembly(name='Flow_V3_PARTIAL_FRAME_DESIGN_ONLY')
scene=trimesh.Scene()
display=np.array([[.001,0,0,0],[0,0,.001,0],[0,-.001,0,0],[0,0,0,1]])
for i in instances:
    assembly.add(i['solid'],name=i['name'],color=cq.Color(.66,.47,.27))
    mesh=i['mesh'].copy();mesh.apply_transform(display);mesh.visual=trimesh.visual.ColorVisuals(mesh,vertex_colors=[178,137,85,255]);scene.add_geometry(mesh,node_name=i['name'],geom_name=i['name'])
assembly.export(str(OUT/'Flow_V3_PARTIAL_FRAME_DESIGN_ONLY.step'))
roundtrip=cq.importers.importStep(str(OUT/'Flow_V3_PARTIAL_FRAME_DESIGN_ONLY.step')).val()
assert roundtrip.isValid() and len(roundtrip.Solids())==7
assert all(abs(a-b)<1e-6 for a,b in zip((roundtrip.BoundingBox().xlen,roundtrip.BoundingBox().ylen,roundtrip.BoundingBox().zlen),(860,480,70)))
scene.metadata={'status':'DESIGN_ONLY_PARTIAL','missing':'tabletop; authoritative floor-relative leg and tri-base placements','units':'metres','axes':'Y-up; X=CAD X; Z=-CAD Y'}
scene.export(str(OUT/'Flow_V3_PARTIAL_FRAME_DESIGN_ONLY.glb'))
write('transforms.json',dict(frame='mm Z-up; frame lower SW corner, NOT floor',dxf_local='u,v,t = DXF x,DXF y,thickness 0..6',glb_axes='m Y-up: (X,Z,-Y)/1000',instances=[{k:v for k,v in i.items() if k not in ('solid','mesh')} for i in instances],unplaced=[dict(part=k,quantity=next(x['quantity'] for x in inventory if x['part']==k),transform=None,status='BLOCKED: floor-relative XYZ/orientation contract not recovered') for k in ('LEG_A','LEG_B','TRI_BASE_ROUNDED')],tabletop=dict(source=None,transform=None,status='BLOCKED: no V3 profile')))
# Library is explicitly a layout of seven UNIQUE parts, never an assembled table.
lib=cq.Assembly(name='Flow_V3_UNPLACED_PART_LIBRARY_DESIGN_ONLY');libs=trimesh.Scene()
for idx,(k,(s,m,p)) in enumerate(parts.items()):
    M=np.eye(4);M[:3,3]=[(idx%2)*950,(idx//2)*450,0]
    lib.add(moved(s,M),name=k)
    mesh=m.copy();mesh.apply_transform(M);mesh.apply_transform(display);libs.add_geometry(mesh,node_name=k)
lib.export(str(OUT/'Flow_V3_PART_LIBRARY_NOT_ASSEMBLED.step'))
libs.metadata={'status':'UNPLACED_PART_LIBRARY_NOT_ASSEMBLED','layout':'arbitrary display grid, not assembly coordinates'}
libs.export(str(OUT/'Flow_V3_PART_LIBRARY_NOT_ASSEMBLED.glb'))
loaded=trimesh.load(OUT/'Flow_V3_PARTIAL_FRAME_DESIGN_ONLY.glb',force='scene')
assert len(loaded.geometry)==7 and all(np.isfinite(m.vertices).all() for m in loaded.geometry.values())
write('validation.json',dict(status='BLOCKED_FULL_ASSEMBLY',profiles='PASS',unique_parts=7,available_instances=19,placed_frame_instances=7,unplaced_instances=12,missing_tabletop=True,pair_checks=len(pairs),collision_failures=sum(p['status']=='FAIL' for p in pairs),frame_bounds_mm=[[0,0,0],[860,480,70]],expected_contacts=12,negative_control_collision_mm3=bad,step_roundtrip='PASS',glb_meshes=len(loaded.geometry),glb_bytes=(OUT/'Flow_V3_PARTIAL_FRAME_DESIGN_ONLY.glb').stat().st_size,physical_validation='NOT_PERFORMED'))
print(json.dumps({'pairs':len(pairs),'collisions':[p for p in pairs if p['status']=='FAIL']}))
