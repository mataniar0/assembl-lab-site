"""Flow V3.1 proposal geometry; frozen V3 inputs are never written."""
from pathlib import Path
import json,io,hashlib,itertools
import numpy as np
import ezdxf,cadquery as cq
from OCP.gp import gp_Trsf
from shapely.geometry import Polygon,box,LineString
ROOT=Path(__file__).resolve().parents[2];BASE=ROOT/'engineering/flow-v3';HERE=Path(__file__).parent
T=6.;EPS=1e-6;VTOL=1e-5
FEATURES=json.loads((BASE/'artifacts/search/features.json').read_text())['features']
INVENTORY=json.loads((BASE/'artifacts/inventory.json').read_text())
def write(p,data):p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(data,indent=2,default=lambda x:x.item() if isinstance(x,np.generic) else str(x))+'\n')
def load_dxf(p):
 raw=p.read_text()
 if 'HEADER' not in raw:raw='0\nSECTION\n2\nHEADER\n9\n$ACADVER\n1\nAC1015\n0\nENDSEC\n'+raw
 doc=ezdxf.read(io.StringIO(raw));es=list(doc.modelspace());assert all(e.dxftype()=='LWPOLYLINE' and e.closed for e in es)
 assert all(not q[4] for e in es for q in e.get_points())
 polys=[Polygon([(float(x),float(y)) for x,y,*_ in e.get_points()]) for e in es];assert all(p.is_valid for p in polys)
 outer=max(polys,key=lambda p:p.area);s=outer
 for p in polys:
  if p is not outer:s=s.difference(p)
 assert s.is_valid and s.geom_type=='Polygon';return s

def source():
 out={}
 for i in INVENTORY:
  p=ROOT/i['file'];assert hashlib.sha256(p.read_bytes()).hexdigest()==i['sha256'];out[i['part']]=load_dxf(p)
 return out

def solid(p):
 wire=lambda c:cq.Wire.makePolygon([cq.Vector(x,y,0) for x,y in c],close=True)
 s=cq.Solid.extrudeLinear(wire(p.exterior.coords),[wire(r.coords) for r in p.interiors],cq.Vector(0,0,T));assert s.isValid();return s

def canonical(m):
 m=m.copy()
 if np.linalg.det(m[:3,:3])<0:m[:3,3]+=T*m[:3,2];m[:3,2]*=-1
 assert abs(np.linalg.det(m[:3,:3])-1)<1e-9;return m

def moved(s,m):
 tr=gp_Trsf();tr.SetValues(*m[:3,:].reshape(-1).tolist());return s.moved(cq.Location(tr))
def matrix(u,v,n,o):
 m=np.eye(4);m[:3,:3]=np.array([u,v,n]).T;m[:3,3]=o;return canonical(m)
def reflect(corner):
 r=np.eye(4)
 if corner in ['SE','NE']:r[0,0]=-1;r[0,3]=860
 if corner in ['NW','NE']:r[1,1]=-1;r[1,3]=480
 return r

def rail_reindex(poly,key,near=6,far=-11):
 # Fill only old rectangular join pockets, then cut their new positions.
 # Original curves, holes, ends and every feature outside these masks are retained.
 out=poly
 groups=FEATURES[key]['upper_leg_receivers']
 for g in groups:
  for lo,hi in g:out=out.union(box(lo,10,hi,16))
 for g,shift in zip(groups,[near,far]):
  for lo,hi in g:out=out.difference(box(lo+shift,10,hi+shift,16))
 assert out.is_valid and out.geom_type=='Polygon';return out

def edit_leg(poly,key,spine_shift=6,tab_shift=0):
 out=poly
 # Complementary original19-segment spine is shifted internally, not guessed.
 for lo in range(10,390,20):
  section=poly.intersection(LineString([(-100,lo+10),(300,lo+10)]));edge=section.bounds[0]
  out=out.difference(box(-100,lo,edge+spine_shift,lo+20))
 if tab_shift:
  for lo,hi in FEATURES[key]['tabs']:out=out.difference(box(lo,390,hi,396))
  for lo,hi in FEATURES[key]['tabs']:out=out.union(box(lo+tab_shift,390,hi+tab_shift,396))
 assert out.is_valid and out.geom_type=='Polygon';return out

def compact_base(radius=9.5,tongue_start=0):
 # Retain the source's sampled quarter-circle topology; replace only radius and
 # the two tab intervals. Independent6mm tongue sizes are never scaled.
 source_points=list(source()['TRI_BASE_ROUNDED'].exterior.coords)
 arc=[(x*radius/15.5,y*radius/15.5) for x,y in source_points if x>=0 and y>=0 and abs((x*x+y*y)**.5-15.5)<.002]
 arc=sorted(set(arc),key=lambda p:np.arctan2(p[1],p[0]));assert len(arc)>40
 body=Polygon([(0,0)]+arc+[(0,0)])
 out=body.union(box(tongue_start,-6,tongue_start+6,0)).union(box(-6,tongue_start,0,tongue_start+6))
 assert out.is_valid and out.geom_type=='Polygon';return out

def option_profiles(option):
 orig=source();profiles=dict(orig);origin={k:k for k in profiles}
 if option=='R_RAIL_REINDEX':
  for k in ['LENGTH_OUTER_L','WIDTH_OUTER_W']:profiles[k]=rail_reindex(orig[k],k)
 elif option=='L_LEG_BASE':
  for k in ['LEG_A','LEG_B']:
   del profiles[k];del origin[k]
   for hand,shift in [('NEAR',0),('FAR',-5)]:profiles[k+'_'+hand]=edit_leg(orig[k],k,6,shift);origin[k+'_'+hand]=k
  profiles['TRI_BASE_ROUNDED']=compact_base()
 else:raise ValueError(option)
 return orig,profiles,origin

def instances(option):
 frame=json.loads((BASE/'artifacts/transforms.json').read_text())['instances'];rows=[]
 for r in frame:
  m=np.array(r['matrix']);m[2,3]+=380;rows.append(dict(name=r['name'],profile=r['part'],matrix=m.tolist(),role='frame'))
 # Near/far refers to local endpoint of the corresponding ORIGINAL rail.
 # Each corner is a reflected complete SW corner, not a copied global offset.
 for c in ['SW','SE','NW','NE']:
  origin=-10 if option=='R_RAIL_REINDEX' else -16
  a=matrix((1,0,0),(0,0,1),(0,-1,0),(origin,6,-10))
  b=matrix((0,1,0),(0,0,1),(1,0,0),(0,origin,-10))
  for key,m,far,rail in [('LEG_A',a,c in ['SE','NE'],'L_south' if c in ['SW','SE'] else 'L_north'),('LEG_B',b,c in ['NW','NE'],'W_west' if c in ['SW','NW'] else 'W_east')]:
   part=key if option=='R_RAIL_REINDEX' else key+('_FAR' if far else '_NEAR')
   rows.append(dict(name=c+'_'+key,profile=part,matrix=canonical(reflect(c)@m).tolist(),role='leg',corner=c,mating_rail=rail))
  base=np.eye(4);base[:2,3]=[6,6]
  rows.append(dict(name=c+'_BASE',profile='TRI_BASE_ROUNDED',matrix=canonical(reflect(c)@base).tolist(),role='base',corner=c))
 assert len(rows)==19;return rows

def contact_components(a,b):
 # Exact face-to-face OCCT common area. Axis-aligned source mating faces only;
 # nonaxis curved free edges are not designated mating interfaces.
 def faces(s):
  out={}
  for f in s.Faces():
   if f.geomType()!='PLANE':continue
   n=np.array(f.normalAt().toTuple());axis=int(np.argmax(abs(n)))
   if abs(abs(n[axis])-1)>1e-8:continue
   coord=f.Center().toTuple()[axis];key=(axis,round(coord,7),int(np.sign(n[axis])))
   out.setdefault(key,[]).append(f)
  return out
 fa,fb=faces(a),faces(b);areas=[0.,0.,0.]
 for (axis,coord,sign),aa in fa.items():
  for x in aa:
   for y in fb.get((axis,coord,-sign),[]):
    bx,by=x.BoundingBox(),y.BoundingBox()
    if any(min(getattr(bx,q+'max'),getattr(by,q+'max'))-max(getattr(bx,q+'min'),getattr(by,q+'min'))<-1e-7 for q in 'xyz'):continue
    areas[axis]+=x.intersect(y).Area()
 return dict(zip(['X','Y','Z'],areas))

def contact_area(a,b):return sum(contact_components(a,b).values())

def pairs_and_joints(world,rows):
 pairs=[];cache={};normal_flip=np.diag([1.,1.,-1.,1.]);normal_flip[2,3]=6
 rowby={r['name']:r for r in rows}
 for profile in {r['profile'] for r in rows}:
  # Caching axis-resolved areas is valid because equal profile instances
  # differ only by signed axis reflections, never by swapping world axes.
  axes={tuple(abs(np.array(r['matrix'])[:3,:3]).reshape(-1)) for r in rows if r['profile']==profile};assert len(axes)==1
 for a,b in itertools.combinations(world,2):
  aa,bb=world[a],world[b];ba,bc=aa.BoundingBox(),bb.BoundingBox()
  gaps=[max(0,getattr(ba,q+'min')-getattr(bc,q+'max'),getattr(bc,q+'min')-getattr(ba,q+'max')) for q in 'xyz'];sep=float(np.linalg.norm(gaps))
  if sep>1e-6:
   pairs.append(dict(a=a,b=b,overlap_mm3=0.,distance_mm=None,bbox_distance_lower_bound_mm=sep,face_contact_mm2=0.,contact_components_mm2=dict(X=0.,Y=0.,Z=0.),proof='DISJOINT_AABB',status='PASS'));continue
  ma,mb=np.array(rowby[a]['matrix']),np.array(rowby[b]['matrix']);relative=np.linalg.inv(ma)@mb
  # Reuse only source-profile-identical relative poses. Through-cut6mm prisms
  # have the exact t->6-t symmetry, including reversed sheet faces.
  keys=[tuple(np.round(fa@relative@fb,7).reshape(-1)) for fa in [np.eye(4),normal_flip] for fb in [np.eye(4),normal_flip]]
  ck=(rowby[a]['profile'],rowby[b]['profile'],min(keys))
  if ck in cache:v,d,components=cache[ck]
  else:
   common=aa.intersect(bb);v=common.Volume() if common.Solids() else 0.;d=aa.distance(bb)
   components=contact_components(aa,bb) if d<1e-6 and v<VTOL else dict(X=0.,Y=0.,Z=0.)
   # Cache total/vertical area under horizontal mirrors; axis names may swap
   # only when actual world rotations do, so retain world-component calculation.
   cache[ck]=(v,d,components)
  area=sum(components.values());pairs.append(dict(a=a,b=b,overlap_mm3=v,distance_mm=d,face_contact_mm2=area,contact_components_mm2=components,proof='OCCT_COMMON_AND_FACE_AREAS',status='PASS' if v<VTOL else 'FAIL'))
 byname={r['name']:r for r in rows};pd={frozenset((p['a'],p['b'])):p for p in pairs};joints=[]
 frame_pairs=json.loads((BASE/'artifacts/frame-pairs.json').read_text())
 expected=[(p['a'],p['b'],'frame') for p in frame_pairs if p['distance_mm']<1e-7]
 for c in ['SW','SE','NW','NE']:
  a,b=c+'_LEG_A',c+'_LEG_B';expected.extend([(a,byname[a]['mating_rail'],'upper'),(b,byname[b]['mating_rail'],'upper'),(a,b,'spine'),(a,c+'_BASE','lower'),(b,c+'_BASE','lower')])
 for a,b,kind in expected:
  p=pd[frozenset((a,b))];vertical=p['contact_components_mm2']['X']+p['contact_components_mm2']['Y'];required_vertical=(2244 if '_NEAR' in byname.get(a,{}).get('profile','') or '_FAR' in byname.get(a,{}).get('profile','') else 2280) if kind=='spine' else 0;mate_ok=abs(vertical-required_vertical)<1e-4 if kind=='spine' else True;joints.append(dict(a=a,b=b,kind=kind,contact_mm2=p['face_contact_mm2'],vertical_contact_mm2=vertical,required_vertical_contact_mm2=required_vertical,overlap_mm3=p['overlap_mm3'],status='PASS' if p['overlap_mm3']<VTOL and p['face_contact_mm2']>1e-4 and mate_ok else 'FAIL'))
 assert len(pairs)==171 and len(joints)==32
 return pairs,joints
