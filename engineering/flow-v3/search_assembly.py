"""Finite source-constrained assembly search, original V3 geometry only.
Full engagement of all four upper tenons fixes continuous translations and axes;
D4 base placements are independently solved from the two floor-slot faces.
See SEARCH_REPORT.md for the completeness boundary (not an arbitrary pose grid).
"""
from pathlib import Path
import io,itertools,json,hashlib,math,time
from collections import Counter
import numpy as np
import ezdxf,cadquery as cq,trimesh
from shapely.geometry import Polygon,LineString,box
from shapely.affinity import affine_transform
from OCP.gp import gp_Trsf
ROOT=Path(__file__).resolve().parents[2];P=Path(__file__).parent/'artifacts';Q=P/'search';Q.mkdir(exist_ok=True)
T=6.;EPS=1e-6;VTOL=1e-5
start=time.time()
def dump(name,data):(Q/name).write_text(json.dumps(data,indent=2,default=lambda x:x.item() if isinstance(x,np.generic) else str(x))+'\n')
def load(p):
 raw=p.read_text();doc=ezdxf.read(io.StringIO('0\nSECTION\n2\nHEADER\n9\n$ACADVER\n1\nAC1015\n0\nENDSEC\n'+raw))
 es=list(doc.modelspace());assert all(e.closed and e.dxftype()=='LWPOLYLINE' for e in es)
 ps=[Polygon([(float(x),float(y)) for x,y,*_ in e.get_points()]) for e in es];o=max(ps,key=lambda p:p.area);s=o
 for c in ps:
  if c is not o:s=s.difference(c)
 assert s.is_valid and s.geom_type=='Polygon'
 wire=lambda pts:cq.Wire.makePolygon([cq.Vector(x,y,0) for x,y in pts],close=True)
 solid=cq.Solid.extrudeLinear(wire(s.exterior.coords),[wire(r.coords) for r in s.interiors],cq.Vector(0,0,T))
 assert solid.isValid() and abs(solid.Volume()-s.area*T)<VTOL
 return s,o,solid
inventory=json.loads((P/'inventory.json').read_text());parts={};sources=[]
for item in inventory:
 path=ROOT/item['file'];sha=hashlib.sha256(path.read_bytes()).hexdigest();assert sha==item['sha256']
 parts[item['part']]=load(path);sources.append(dict(file=item['file'],sha256=sha))
def mat(u,v,n,origin):
 m=np.eye(4);m[:3,:3]=np.array([u,v,n]).T;m[:3,3]=origin;return m
def canonical(m):
 # The prism is invariant under t -> 6-t, so a reflected-normal representation
 # has an exactly equivalent proper rigid transform. Never reflect the outline.
 m=m.copy()
 if np.linalg.det(m[:3,:3])<0:m[:3,3]+=T*m[:3,2];m[:3,2]*=-1
 assert abs(np.linalg.det(m[:3,:3])-1)<EPS
 return m
def move(s,m):
 tr=gp_Trsf();tr.SetValues(*m[:3,:].reshape(-1).tolist());return s.moved(cq.Location(tr))
def line_intervals(poly,y):
 cut=poly.intersection(LineString([(-10000,y),(10000,y)]));geoms=[cut] if cut.geom_type=='LineString' else list(cut.geoms)
 return sorted([[g.bounds[0],g.bounds[2]] for g in geoms if g.length>EPS])
def level_edges(poly,y,length):
 pts=list(poly.exterior.coords);edges=[]
 for a,b in zip(pts,pts[1:]):
  if abs(a[1]-y)<EPS and abs(b[1]-y)<EPS and abs(abs(a[0]-b[0])-length)<EPS:edges.append(sorted([a[0],b[0]]))
 return sorted(edges)
features={}
for k in ['LEG_A','LEG_B']:
 s,o,_=parts[k];floor=o.bounds[1];top=o.bounds[3];tabs=level_edges(o,top,20)
 assert len(tabs)==4
 for a,b in tabs:assert abs(s.intersection(box(a,top-T,b,top)).area-20*T)<EPS
 notches=[]
 for lo,hi in level_edges(o,floor+T,T):
  if s.intersection(box(lo,floor,hi,floor+T)).area<EPS:notches.append([lo,hi])
 assert len(notches)==1
 features[k]=dict(floor=floor,tab_z=[top-T,top],tabs=tabs,floor_slot=dict(u=notches[0],v=[floor,floor+T]))
for k in ['LENGTH_OUTER_L','WIDTH_OUTER_W']:
 s,o,_=parts[k];bottom=o.bounds[1];notches=level_edges(o,bottom+T,20)
 assert len(notches)==8
 for a,b in notches:assert s.intersection(box(a,bottom,b,bottom+T)).area<EPS
 pattern=np.diff([x[0] for x in features['LEG_A']['tabs']])
 groups=[list(g) for g in itertools.combinations(notches,4) if np.allclose(np.diff([x[0] for x in g]),pattern,atol=EPS,rtol=0)]
 assert groups==[notches[:4],notches[4:]]
 features[k]=dict(bounds=list(o.bounds),receiver_subsets_examined=math.comb(8,4),upper_leg_receivers=groups,v=[bottom,bottom+T])
bs,bo,_=parts['TRI_BASE_ROUNDED'];xmin,ymin,xmax,ymax=bo.bounds
xtongues=level_edges(bo,ymin,T);assert len(xtongues)==1
# Tongues project6mm outside the positive quadrant. Derive both from bbox edges.
ytongues=[]
pts=list(bo.exterior.coords)
for a,b in zip(pts,pts[1:]):
 if abs(a[0]-xmin)<EPS and abs(b[0]-xmin)<EPS and abs(abs(a[1]-b[1])-T)<EPS:ytongues.append(sorted([a[1],b[1]]))
assert len(ytongues)==1
base_rects=[box(xtongues[0][0],ymin,xtongues[0][1],ymin+T),box(xmin,ytongues[0][0],xmin+T,ytongues[0][1])]
assert all(abs(bs.intersection(b).area-T*T)<EPS for b in base_rects)
base_centres=np.array([[b.centroid.x,b.centroid.y] for b in base_rects]);features['TRI_BASE_ROUNDED']=dict(tongue_rectangles=[list(b.bounds) for b in base_rects],centres=base_centres.tolist(),centre_distance_mm=float(np.linalg.norm(base_centres[1]-base_centres[0])))
dump('features.json',dict(sources=sources,features=features))
# All proper orthogonal signed permutations. The other24 signed permutations
# are identical prism poses after normal inversion/translation (canonical()).
rotations=[]
for perm in itertools.permutations(range(3)):
 for signs in itertools.product([-1,1],repeat=3):
  r=np.zeros((3,3));r[list(perm),range(3)]=signs
  if np.linalg.det(r)>.5:rotations.append(r)
assert len(rotations)==24
# Receiver-bearing rails may each be turned end-for-end without changing part shape.
# Full frame end-finger/beam contacts are separately checked in frame_symmetries.py.
frame=json.loads((P/'transforms.json').read_text())['instances'];rail_defs={i['name']:i for i in frame if i['part'] in ['LENGTH_OUTER_L','WIDTH_OUTER_W']}
rail_records=[];poses=[];representation_count=0
for name,i in rail_defs.items():
 base=np.array(i['matrix'])
 key=i['part'];axis=0 if key=='LENGTH_OUTER_L' else 1;normal=1-axis
 for flip,vflip in itertools.product([False,True],repeat=2):
  rm=base.copy()
  if flip:
   f=np.eye(4);f[0,0]=-1;f[0,3]=sum(features[key]['bounds'][::2]);rm=canonical(base@f)
  if vflip:
   f=np.eye(4);f[1,1]=-1;f[1,3]=features[key]['bounds'][1]+features[key]['bounds'][3];rm=canonical(rm@f)
  receiver_z=sorted([float((rm@np.array([10,v,0,1]))[2]) for v in features[key]['v']])
  frame_height=380-receiver_z[0];rm[2,3]+=frame_height
  slab=sorted([rm[normal,3],rm[normal,3]+T*rm[normal,2]])
  groups=[]
  for rawgroup in features[key]['upper_leg_receivers']:
   intervals=sorted([sorted([float((rm@np.array([u,10,0,1]))[axis]) for u in ab]) for ab in rawgroup]);groups.append(intervals)
  groups.sort(key=lambda x:x[0][0])
  rr=dict(id=f'{name}_u{int(flip)}_v{int(vflip)}',rail=name,part=key,flip=flip,vertical_flip=vflip,frame_bottom_z_mm=frame_height,matrix=rm.tolist(),axis=axis,normal=normal,slab=slab,groups=groups)
  rail_records.append(rr)
  for group_idx,receiver in enumerate(groups):
   for leg in ['LEG_A','LEG_B']:
    for direction in [-1,1]:
     raw=features[leg]['tabs'];oriented=sorted([sorted([direction*u for u in ab]) for ab in raw]);shift=receiver[0][0]-oriented[0][0]
     for du,dn in itertools.product([-T,0,T],repeat=2):
      for face in [-1,1]:
       representation_count+=1
       u=np.zeros(3);u[axis]=direction;v=np.array([0,0,1]);n=np.zeros(3);n[normal]=face
       origin=np.zeros(3);origin[axis]=shift+du;origin[normal]=slab[0]+dn+(T if face<0 else 0);origin[2]=-features[leg]['floor']
       m=canonical(mat(u,v,n,origin));poseid=f'{rr["id"]}_end{group_idx}_{leg}_u{direction}_du{int(du)}_dn{int(dn)}'
       if face>0:continue # Both faces were explicitly canonicalized; retain one world-volume pose.
       mapped=[[a+shift+du,b+shift+du] for a,b in oriented];res=max(abs(a-b) for p,q in zip(mapped,receiver) for a,b in zip(p,q))
       occupied=[slab[0]+dn,slab[1]+dn];normal_res=max(abs(a-b) for a,b in zip(occupied,slab));fit=res<EPS and normal_res<EPS
       floor_z=float((m@np.array([0,features[leg]['floor'],0,1]))[2]);vertical_res=abs(floor_z)
       # World receiver-face rectangles including every source tab, not mere zero-distance.
       actual_tabs=[];target_slots=[]
       for a,b in raw:
        actual_tabs.append([(m@np.array([x,z,t,1]))[:3].tolist() for x,z,t in itertools.product([a,b],features[leg]['tab_z'],[0,T])])
       for a,b in receiver:
        target_slots.append([[a if axis==0 else n,a if axis==1 else n,z] for a,z,n in itertools.product([a,b],[380,386],slab)])
       slot=features[leg]['floor_slot'];centre=(m@np.array([sum(slot['u'])/2,sum(slot['v'])/2,T/2,1]))[:3]
       poses.append(dict(id=poseid,leg=leg,rail=rr['id'],rail_name=name,group=group_idx,axis=axis,direction=direction,du_mm=du,dn_mm=dn,matrix=m.tolist(),floor_residual_mm=vertical_res,tab_edge_residual_mm=res,normal_face_residual_mm=normal_res,upper_fit=fit,frame_bottom_z_mm=frame_height,source_four_tenon_volume_mm3=4*20*T*T,nominal_mating_face_area_mm2=4*(20+2*T)*T,floor_slot_centre=centre.tolist(),actual_tab_corners=actual_tabs,receiver_corners=target_slots))
assert len(poses)==1152 and representation_count==2304
eligible=[p for p in poses if p['upper_fit']];assert len(eligible)==128
rrby={r['id']:r for r in rail_records}
joint_cache={}
for p in eligible:
 rm=np.array(rrby[p['rail']]['matrix']);lm=np.array(p['matrix']);rel=np.linalg.inv(lm)@rm
 ck=(p['leg'],rrby[p['rail']]['part'],tuple(np.round(rel,6).reshape(-1)))
 if ck not in joint_cache:
  common=parts[p['leg']][2].intersect(move(parts[rrby[p['rail']]['part']][2],rel))
  joint_cache[ck]=common.Volume() if common.Solids() else 0.
 p['own_rail_overlap_mm3']=joint_cache[ck]
 p['upper_joint_body_pass']=joint_cache[ck]<VTOL
dump('upper-pose-enumeration.json',dict(rotations_24=[r.tolist() for r in rotations],raw_normal_representations=representation_count,unique_rigid_poses=len(poses),exact_upper_fit=len(eligible),rejected=len(poses)-len(eligible),rails=rail_records,poses=poses))
# D4 horizontal maps, represented as proper3D rotations, including turning sheet over.
d4=[]
for p in itertools.permutations(range(2)):
 for signs in itertools.product([-1,1],repeat=2):
  r=np.zeros((2,2));r[list(p),range(2)]=signs;d4.append(r)
assert len(d4)==8
corner_specs=[('SW','L_south',0,'W_west',0),('SE','L_south',1,'W_east',0),('NW','L_north',0,'W_west',1),('NE','L_north',1,'W_east',1)]
corner_results=[];base_results=[];volume_cache={};kernel_calls=0
solids={k:p[2] for k,p in parts.items()}
def overlap(pa,pb):
 global kernel_calls
 # Reuse only exactly equal A-relative-B rigid transforms; volume is invariant.
 if pa['leg']=='LEG_B':pa,pb=pb,pa
 ma,mb=np.array(pa['matrix']),np.array(pb['matrix']);rel=np.linalg.inv(ma)@mb
 ck=tuple(np.round(rel,6).reshape(-1))
 if ck not in volume_cache:
  a=solids[pa['leg']];b=move(solids[pb['leg']],rel);inter=a.intersect(b);volume_cache[ck]=inter.Volume() if inter.Solids() else 0.;kernel_calls+=1
 return float(volume_cache[ck])
for corner,lname,lgroup,wname,wgroup in corner_specs:
 for lf,wf,lv,wv in itertools.product([0,1],repeat=4):
  lr=f'{lname}_u{lf}_v{lv}';wr=f'{wname}_u{wf}_v{wv}'
  for lclass,wclass in [('LEG_A','LEG_B'),('LEG_B','LEG_A')]:
   lp=[p for p in eligible if p['rail']==lr and p['group']==lgroup and p['leg']==lclass]
   wp=[p for p in eligible if p['rail']==wr and p['group']==wgroup and p['leg']==wclass]
   assert len(lp)==len(wp)==2
   for la,lb in itertools.product(lp,wp):
    cid=f'{corner}_lu{lf}_wu{wf}_lv{lv}_wv{wv}_{lclass}_u{la["direction"]}_u{lb["direction"]}'
    targets=np.array([la['floor_slot_centre'][:2],lb['floor_slot_centre'][:2]])
    dist=float(np.linalg.norm(targets[1]-targets[0]));a_b_volume=overlap(la,lb)
    base_ids=[]
    for oid,r in enumerate(d4):
     mapped=(r@base_centres.T).T
     for order in [[0,1],[1,0]]:
      trans=targets[0]-mapped[order[0]];after=mapped[order]+trans;delta=after-targets;res=float(np.abs(delta).max())
      balanced_trans=(targets-mapped[order]).mean(axis=0)
      minimax_res=float(np.abs(mapped[order]+balanced_trans-targets).max())
      m=np.eye(4);m[:2,:2]=r;m[2,2]=round(np.linalg.det(r));m[:2,3]=trans;m[2,3]=0 if m[2,2]>0 else T
      assert abs(np.linalg.det(m[:3,:3])-1)<EPS
      bid=f'{cid}_base{oid}_order{order[0]}'
      base_ids.append(bid)
      base_results.append(dict(id=bid,corner_candidate=cid,matrix=m.tolist(),tongue_to_slot_order=order,first_tongue_residual_mm=np.abs(delta[0]).tolist(),second_tongue_residual_mm=np.abs(delta[1]).tolist(),max_axis_residual_mm=res,continuous_translation_minimax_residual_mm=minimax_res,balanced_translation_xy_mm=balanced_trans.tolist(),full_face_fit=res<EPS,floor_residual_mm=0.))
    br=[b for b in base_results if b['id'] in base_ids];best=min(br,key=lambda b:b['max_axis_residual_mm'])
    corner_results.append(dict(id=cid,corner=corner,rails=[lr,wr],leg_poses=[la['id'],lb['id']],leg_classes=[la['leg'],lb['leg']],leg_matrices=[la['matrix'],lb['matrix']],floor_slot_centres_mm=targets.tolist(),required_tongue_centre_distance_mm=dist,source_tongue_centre_distance_mm=features['TRI_BASE_ROUNDED']['centre_distance_mm'],distance_invariant_residual_mm=abs(dist-features['TRI_BASE_ROUNDED']['centre_distance_mm']),leg_leg_overlap_mm3=a_b_volume,frame_height_residual_mm=abs(la['frame_bottom_z_mm']-lb['frame_bottom_z_mm']),own_rail_overlap_mm3=[la['own_rail_overlap_mm3'],lb['own_rail_overlap_mm3']],best_base_candidate=best['id'],best_base_axis_residual_mm=best['max_axis_residual_mm'],base_fit_count=sum(b['full_face_fit'] for b in br),status='PASS' if a_b_volume<VTOL and la['upper_joint_body_pass'] and lb['upper_joint_body_pass'] and abs(la['frame_bottom_z_mm']-lb['frame_bottom_z_mm'])<EPS and any(b['full_face_fit'] for b in br) else 'REJECTED'))
 print(corner,'complete',flush=True)
assert len(corner_results)==512 and len(base_results)==8192
passing=[c for c in corner_results if c['status']=='PASS']
dump('base-enumeration.json',dict(orientations=8,assignments=2,translation_rule='First tongue centre equals first floor-slot centre; second independently tested; source square faces6x6mm',candidates=base_results))
dump('corner-enumeration.json',dict(candidates=corner_results,occt_unique_relative_pair_calls=kernel_calls,volume_cache_entries=len(volume_cache)))
orientation_audit=[]
for rr in rail_records:
 for leg in ['LEG_A','LEG_B']:
  for idx,r in enumerate(rotations):
   floor_axis_residual=float(np.linalg.norm(r[:,1]-np.array([0,0,1])))
   rail_axis_residual=float(abs(abs(r[rr['axis'],0])-1)+abs(r[rr['normal'],0])+abs(r[2,0]))
   orientation_audit.append(dict(rail=rr['id'],leg=leg,rotation_index=idx,rotation=r.tolist(),floor_axis_residual=floor_axis_residual,upper_tab_axis_residual=rail_axis_residual,eligible=floor_axis_residual<EPS and rail_axis_residual<EPS))
assert len(orientation_audit)==768 and sum(r['eligible'] for r in orientation_audit)==64
dump('orientation-audit.json',dict(proper_rotation_count=24,tests=orientation_audit,accepted=64,rejected=704,nonorthogonal_exclusion='Full rectangular tab/slot face equality fixes localu to rail direction and localv to vertical; no oblique rotation can preserve those faces.'))
summary=dict(status='FEASIBLE_CORNERS_FOUND' if passing else 'UNSAT_WITHIN_SOURCE_CONTACT_CONTRACT',scope='Full engagement of four20x6 upper tenons per panel; coplanar nominal6mm rail/panel planes; original6x6 floor receivers; base horizontal on floor; original V3 profiles; all256 external-rail U/V orientations covered locally; mixed vertical flips require inconsistent frame heights',tabletop_required=False,sources=sources,orthogonal_proper_rotations=24,orientation_filter_tests=768,reflected_normal_representations_equivalent=24,external_rail_orientation_configurations=256,uniform_floor_height_configurations=32,independent_local_rail_orientation_pairs=16,raw_normal_representations=representation_count,unique_upper_poses=len(poses),distinct_world_leg_poses=len({(p['leg'],str(p['matrix'])) for p in poses}),distinct_world_corner_pairs=len({str(sorted(zip(c['leg_classes'],c['leg_matrices']))) for c in corner_results}),upper_fit_poses=len(eligible),corner_pair_candidates=len(corner_results),base_candidates=len(base_results),passing_corners=len(passing),own_rail_body_pass_poses=sum(p['upper_joint_body_pass'] for p in eligible),own_rail_kernel_cache_entries=len(joint_cache),base_exact_fit_candidates=sum(b['full_face_fit'] for b in base_results),minimum_base_axis_residual_mm=min(b['max_axis_residual_mm'] for b in base_results),minimum_continuous_minimax_axis_residual_mm=min(b['continuous_translation_minimax_residual_mm'] for b in base_results),minimum_leg_leg_overlap_mm3=min(c['leg_leg_overlap_mm3'] for c in corner_results),minimum_distance_invariant_residual_mm=min(c['distance_invariant_residual_mm'] for c in corner_results),collision_free_leg_pairs=sum(c['leg_leg_overlap_mm3']<VTOL for c in corner_results),occt_unique_relative_pair_calls=kernel_calls,full19_assembly_gate='NOT_RUN_NO_VALID_CORNER' if not passing else 'REQUIRED',collision_tolerance_mm3=VTOL,face_tolerance_mm=EPS,geometry_corrections=0,elapsed_seconds=round(time.time()-start,3))
dump('summary.json',summary)
v=json.loads((P/'validation.json').read_text());v['status']='BLOCKED_SOURCE_CONTACT_CONSTRAINTS'
v['assembly_search']={k:summary[k] for k in ['status','unique_upper_poses','distinct_world_leg_poses','distinct_world_corner_pairs','corner_pair_candidates','base_candidates','passing_corners','minimum_continuous_minimax_axis_residual_mm','minimum_distance_invariant_residual_mm']}
v['assembly_search'].update(certificate='search/unsat-certificate.json',summary='search/summary.json',full19_pair_scan='NOT_RUN_NO_FEASIBLE_CORNER')
(P/'validation.json').write_text(json.dumps(v,indent=2)+'\n')
print(json.dumps(summary,indent=2))
