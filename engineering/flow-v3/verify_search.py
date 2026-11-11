"""Independent replay checks, frame orientations and positive/negative controls.
Uses serialized source-derived features and unchanged individual STEP exports.
"""
from pathlib import Path
import json,itertools,hashlib,math
import numpy as np
import cadquery as cq
from OCP.gp import gp_Trsf
P=Path(__file__).parent/'artifacts';Q=P/'search';ROOT=Path(__file__).resolve().parents[2]
def read(n):return json.loads((Q/n).read_text())
def move(s,m):
 t=gp_Trsf();t.SetValues(*m[:3,:].reshape(-1).tolist());return s.moved(cq.Location(t))
features=read('features.json')['features'];summary=read('summary.json')
for x in summary['sources']:assert hashlib.sha256((ROOT/x['file']).read_bytes()).hexdigest()==x['sha256']
poses=read('upper-pose-enumeration.json');corners=read('corner-enumeration.json')['candidates'];bases=read('base-enumeration.json')['candidates']
assert len(poses['poses'])==1152 and len(corners)==512 and len(bases)==8192
assert summary['distinct_world_leg_poses']==576 and summary['distinct_world_corner_pairs']==128
assert sum(p['upper_fit'] for p in poses['poses'])==128
orientation=read('orientation-audit.json');assert len(orientation['tests'])==768 and sum(r['eligible'] for r in orientation['tests'])==64
assert not any(c['status']=='PASS' for c in corners) and not any(b['full_face_fit'] for b in bases)
assert min(c['distance_invariant_residual_mm'] for c in corners)>8
assert min(b['continuous_translation_minimax_residual_mm'] for b in bases)==3
# Geometric invariant is independent of any kernel collision decision and base yaw.
base_distance=math.dist(*features['TRI_BASE_ROUNDED']['centres'])
for c in corners:
 d=math.dist(*c['floor_slot_centres_mm']);assert abs(d-c['required_tongue_centre_distance_mm'])<1e-9
 assert abs(abs(d-base_distance)-c['distance_invariant_residual_mm'])<1e-9
 assert abs(np.linalg.det(np.array(c['leg_matrices'][0])[:3,:3])-1)<1e-9
# Positive control: known exact source-tongue placement (+6,+6) must be solvable.
# Negative: the originally tab-aligned floor-slot centres must be rejected.
centres=np.array(features['TRI_BASE_ROUNDED']['centres']);controls=[]
for name,target in [('known_valid_base_only',centres+np.array([6,6])),('rail_aligned_base_reject',np.array([[9,3],[3,9]]))]:
 residuals=[]
 for perm in itertools.permutations(range(2)):
  for signs in itertools.product([-1,1],repeat=2):
   r=np.zeros((2,2));r[list(perm),range(2)]=signs
   for order in [[0,1],[1,0]]:
    m=(r@centres.T).T[order];translation=target[0]-m[0]
    residuals.append(float(np.abs(m+translation-target).max()))
 minimum=min(residuals);controls.append(dict(name=name,min_axis_residual_mm=minimum))
 assert (minimum<1e-6)==(name=='known_valid_base_only')
# Replay all32 floor-height-consistent outer-rail configurations; internal frame
# remains in its already validated half-lap orientation. Relative pair caching.
frame=json.loads((P/'transforms.json').read_text())['instances'];rr={r['id']:r for r in poses['rails']};outer=[i['name'] for i in frame if i['part'] in ['LENGTH_OUTER_L','WIDTH_OUTER_W']]
solids={k:cq.importers.importStep(str(P/(k+'.step'))).val() for k in ['LENGTH_OUTER_L','WIDTH_OUTER_W','LENGTH_CENTER_LC','CROSS_BEAM_C']}
cache={};configs=[]
expected={frozenset((x['a'],x['b'])) for x in json.loads((P/'frame-pairs.json').read_text()) if x['distance_mm']<1e-7}
for vf in [0,1]:
 for flips in itertools.product([0,1],repeat=4):
  instances=[];height=380 if vf==0 else 316
  for i in frame:
   if i['name'] in outer:m=np.array(rr[f'{i["name"]}_u{flips[outer.index(i["name"])]}_v{vf}']['matrix'])
   else:m=np.array(i['matrix']);m[2,3]+=height
   instances.append(dict(i,M=m))
  pairs=[]
  for a,b in itertools.combinations(instances,2):
   rel=np.linalg.inv(a['M'])@b['M'];ck=(a['part'],b['part'],tuple(np.round(rel,6).reshape(-1)))
   if ck not in cache:
    sa=solids[a['part']];sb=move(solids[b['part']],rel);common=sa.intersect(sb);volume=common.Volume() if common.Solids() else 0.
    cache[ck]=(volume,sa.distance(sb))
   v,d=cache[ck];pairs.append(dict(a=a['name'],b=b['name'],intersection_mm3=v,distance_mm=d))
  contacts={frozenset((p['a'],p['b'])) for p in pairs if p['distance_mm']<1e-6}
  passed=all(p['intersection_mm3']<1e-5 for p in pairs) and contacts==expected
  configs.append(dict(vertical_flip=vf,rail_u_flips=list(flips),frame_bottom_z_mm=height,status='PASS' if passed else 'FAIL',pairs=pairs))
assert all(c['status']=='PASS' for c in configs)
report=dict(status='PASS_REPLAY_OF_UNSAT_SEARCH',source_hashes='PASS',candidate_count='PASS',rigid_distance_certificate='PASS',min_distance_residual_mm=min(c['distance_invariant_residual_mm'] for c in corners),min_continuous_axis_residual_mm=3,controls=controls,frame_configurations=32,frame_pair_checks=32*21,occt_unique_frame_pair_calls=len(cache),configurations=configs,physical_scope='Original orthogonal source-contact contract, not a manufactured-article approval')
(Q/'replay-checks.json').write_text(json.dumps(report,indent=2)+'\n');print({k:v for k,v in report.items() if k!='configurations'})
