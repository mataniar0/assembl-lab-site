"""Independent serialized-DXF/STEP/GLB replay; no option generator imported."""
from pathlib import Path
import json,hashlib,itertools,math
import numpy as np,ezdxf,cadquery as cq,trimesh
from OCP.gp import gp_Trsf
from shapely.geometry import Polygon,LineString
from pygltflib import GLTF2
P=Path(__file__).parent;ROOT=P.resolve().parents[1];OUT=P/'artifacts';EPS=1e-6

def load(p):
 d=ezdxf.readfile(p);assert d.units==4
 es=list(d.modelspace());assert all(e.dxftype()=='LWPOLYLINE' and e.closed and e.dxf.layer=='V31_CANDIDATE_CUT' for e in es)
 ps=[Polygon([(float(q[0]),float(q[1])) for q in e.get_points()]) for e in es];assert all(p.is_valid for p in ps)
 o=max(ps,key=lambda p:p.area);p=o
 for q in ps:
  if q is not o:p=p.difference(q)
 assert p.is_valid and p.geom_type=='Polygon'
 # Reconstruct with a separate Workplane/extrude/cut path.
 s=cq.Workplane('XY').polyline(list(p.exterior.coords)[:-1]).close().extrude(6).val()
 for h in p.interiors:s=s.cut(cq.Workplane('XY').polyline(list(h.coords)[:-1]).close().extrude(6).val())
 assert s.isValid() and len(s.Solids())==1 and abs(s.Volume()-p.area*6)<1e-5
 return p,s

def move(s,m):
 t=gp_Trsf();t.SetValues(*m[:3,:].reshape(-1).tolist());return s.moved(cq.Location(t))
def roof_area(s,rect,z):
 return sum(rect.intersect(f).Area() for f in s.Faces() if f.geomType()=='PLANE' and abs(abs(f.normalAt().z)-1)<1e-8 and abs(f.Center().z-z)<EPS)
def feature_face(lo,hi,v):
 return cq.Face.makeFromWires(cq.Wire.makePolygon([cq.Vector(x,v,t) for x,t in [(lo,0),(hi,0),(hi,6),(lo,6)]],close=True))
reports=[]
for option in ['R_RAIL_REINDEX','L_LEG_BASE']:
 folder=OUT/option;bom=json.loads((folder/'bom-and-delta.json').read_text());meta=json.loads((folder/'transforms.json').read_text());rows=meta['instances'];polys={};solids={};world={}
 for r in bom:polys[r['profile']],solids[r['profile']]=load(folder/r['dxf'])
 for r in rows:
  m=np.array(r['matrix']);assert np.isfinite(m).all() and np.allclose(m[:3,:3].T@m[:3,:3],np.eye(3)) and abs(np.linalg.det(m[:3,:3])-1)<1e-9
  world[r['name']]=move(solids[r['profile']],m)
 pairs=[]
 for a,b in itertools.combinations(world,2):
  sa,sb=world[a],world[b];ba,bb=sa.BoundingBox(),sb.BoundingBox();separated=any(getattr(ba,k+'max')<getattr(bb,k+'min')-EPS or getattr(bb,k+'max')<getattr(ba,k+'min')-EPS for k in 'xyz')
  if separated:vol=0.;proof='DISJOINT_REBUILT_DXF_BOUNDS'
  else:
   common=sa.intersect(sb);vol=common.Volume() if common.Solids() else 0.;proof='REBUILT_DXF_OCCT_COMMON'
  pairs.append(dict(a=a,b=b,overlap_mm3=vol,proof=proof));assert vol<1e-5,(option,a,b,vol)
 assert len(pairs)==171
 upper=[];lower=[];foot_centres={}
 for r in rows:
  if r['role']!='leg':continue
  p=polys[r['profile']];pts=list(p.exterior.coords);tabs=sorted([sorted([a[0],b[0]]) for a,b in zip(pts,pts[1:]) if abs(a[1]-396)<EPS and abs(b[1]-396)<EPS and abs(abs(a[0]-b[0])-20)<EPS]);assert len(tabs)==4
  m=np.array(r['matrix']);rail=world[r['mating_rail']]
  for lo,hi in tabs:
   prism=move(cq.Solid.makeBox(20,6,6,cq.Vector(lo,390,0)),m)
   in_leg=prism.intersect(world[r['name']]).Volume();common=prism.intersect(rail);clash=common.Volume() if common.Solids() else 0.;face=move(feature_face(lo,hi,396),m);contact=roof_area(rail,face,386)
   assert abs(in_leg-720)<1e-5 and clash<1e-5 and abs(contact-120)<1e-5,(r['name'],in_leg,clash,contact)
   upper.append(dict(leg=r['name'],tab_u_mm=[lo,hi],tab_volume_mm3=in_leg,roof_contact_mm2=contact,overlap_with_rail_mm3=clash))
  # Original lower slot roof remains the same6mm edge in both strategies.
  slots=[]
  for a,b in zip(pts,pts[1:]):
   if abs(a[1]-16)<EPS and abs(b[1]-16)<EPS and abs(abs(a[0]-b[0])-6)<EPS:slots.append(sorted([a[0],b[0]]))
  assert len(slots)==1
  lo,hi=slots[0];base=world[r['corner']+'_BASE'];prism=move(cq.Solid.makeBox(6,6,6,cq.Vector(lo,10,0)),m);material=base.intersect(prism).Volume();void=world[r['name']].intersect(prism);v=void.Volume() if void.Solids() else 0.;face=move(feature_face(lo,hi,16),m);contact=roof_area(base,face,6)
  assert abs(material-216)<1e-5 and v<1e-5 and abs(contact-36)<1e-5,(r['name'],material,v,contact)
  centre=(m@np.array([(lo+hi)/2,13,3,1]))[:3];foot_centres[r['name']]=centre.tolist();lower.append(dict(leg=r['name'],tongue_occupation_mm3=material,receiver_void_overlap_mm3=v,roof_contact_mm2=contact,receiver_centre_mm=centre.tolist()))
 assert len(upper)==32 and len(lower)==8
 bp=polys['TRI_BASE_ROUNDED'];pts=list(bp.exterior.coords);xs=[sorted([a[0],b[0]]) for a,b in zip(pts,pts[1:]) if abs(a[1]+6)<EPS and abs(b[1]+6)<EPS and abs(abs(a[0]-b[0])-6)<EPS];ys=[sorted([a[1],b[1]]) for a,b in zip(pts,pts[1:]) if abs(a[0]+6)<EPS and abs(b[0]+6)<EPS and abs(abs(a[1]-b[1])-6)<EPS];assert len(xs)==len(ys)==1
 source_centres=np.array([[sum(xs[0])/2,-3,3,1],[-3,sum(ys[0])/2,3,1]])
 basefits=[]
 for c in ['SW','SE','NW','NE']:
  m=np.array(next(r['matrix'] for r in rows if r['name']==c+'_BASE'));bc=(m@source_centres.T).T[:,:3];fc=np.array([foot_centres[c+'_LEG_A'],foot_centres[c+'_LEG_B']]);res=min(float(abs(bc[list(order)]-fc).max()) for order in [[0,1],[1,0]]);assert res<EPS
  basefits.append(dict(corner=c,centre_residual_mm=res,centre_distance_mm=float(np.linalg.norm(fc[1]-fc[0]))))
 # Independent spine integration from serialized planar DXF sections. This
 # excludes horizontal step contact, which can exist in a disconnected variant.
 spine=[]
 def intervals(poly,z,offset):
  x=poly.intersection(LineString([(-1000,z+10),(1000,z+10)]));gs=[x] if x.geom_type=='LineString' else list(x.geoms)
  return [(g.bounds[0]+offset,g.bounds[2]+offset) for g in gs if g.length>1e-9]
 def overlap_length(xs):return sum(max(0,min(b,6)-max(a,0)) for a,b in xs)
 for c in ['SW','SE','NW','NE']:
  ar=next(r for r in rows if r['name']==c+'_LEG_A');br=next(r for r in rows if r['name']==c+'_LEG_B')
  ref=np.eye(4)
  if c in ['SE','NE']:ref[0,0]=-1;ref[0,3]=860
  if c in ['NW','NE']:ref[1,1]=-1;ref[1,3]=480
  am=ref@np.array(ar['matrix']);bm=ref@np.array(br['matrix']);ap=polys[ar['profile']];bp=polys[br['profile']]
  breaks=sorted({0.,380.,*[float(y-10) for p in [ap,bp] for ring in [p.exterior,*p.interiors] for x,y in ring.coords if 10<y<390]})
  area=0.
  for lo,hi in zip(breaks,breaks[1:]):
   ai=intervals(ap,(lo+hi)/2,am[0,3]);bi=intervals(bp,(lo+hi)/2,bm[1,3]);length=0.
   length+=sum(overlap_length(bi) for a,b in ai if abs(a-6)<EPS or abs(b)<EPS)
   length+=sum(overlap_length(ai) for a,b in bi if abs(a-6)<EPS or abs(b)<EPS)
   assert min(abs(length),abs(length-6))<EPS
   area+=length*(hi-lo)
  expected=2280 if option=='R_RAIL_REINDEX' else 2244
  assert abs(area-expected)<1e-5,(option,c,area,expected)
  spine.append(dict(corner=c,vertical_spine_contact_mm2=area,expected_mm2=expected,method='Independent piecewise planar-section integration; horizontal contact excluded'))
 name='FLOW_V31_CANDIDATE_FULL_19_DESIGN_ONLY';rt=cq.importers.importStep(str(folder/(name+'.step'))).val();assert rt.isValid() and len(rt.Solids())==19
 assert abs(sum(s.Volume() for s in rt.Solids())-sum(s.Volume() for s in world.values()))<1e-3
 bounds=[rt.BoundingBox().xlen,rt.BoundingBox().ylen,rt.BoundingBox().zlen];assert np.allclose(bounds,[860,480,450],atol=1e-6)
 scene=trimesh.load(folder/(name+'.glb'),force='scene');gl=GLTF2().load(str(folder/(name+'.glb')));assert len(scene.geometry)==19 and sum(n.mesh is not None for n in gl.nodes)==19
 for mesh in scene.geometry.values():assert mesh.is_watertight and mesh.is_winding_consistent and mesh.volume>0 and np.isfinite(mesh.vertices).all() and mesh.faces.max()<len(mesh.vertices)
 assert np.allclose(scene.extents,[.86,.45,.48],atol=1e-7) and (folder/(name+'.glb')).stat().st_size<3_000_000
 result=dict(option=option,status='PASS_INDEPENDENT_SERIALIZED_REPLAY',pairs=171,collision_failures=0,upper_tabs=32,lower_receivers=8,bases=4,step_valid_solids=19,glb_mesh_nodes=19,glb_bytes=(folder/(name+'.glb')).stat().st_size,bounds_mm=bounds,upper_checks=upper,lower_checks=lower,base_centre_checks=basefits,spine_checks=spine,pair_checks=pairs,production_authorized=False)
 (folder/'independent-qc.json').write_text(json.dumps(result,indent=2)+'\n');reports.append({k:v for k,v in result.items() if not isinstance(v,list)})
 print(option,'PASS independent DXF ->19 solids ->171 pairs ->32 top tabs ->8 foot slots ->19 STEP/GLB bodies',flush=True)
for f,sha in json.loads((ROOT/'engineering/flow-v3/artifacts/source-hashes.json').read_text()).items():assert hashlib.sha256((ROOT/f).read_bytes()).hexdigest()==sha
(OUT/'independent-qc.json').write_text(json.dumps(dict(status='PASS',source_v3_hashes='UNCHANGED',options=reports),indent=2)+'\n')
