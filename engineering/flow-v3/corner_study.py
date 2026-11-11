"""Reject inconsistent reference-corner interpretations; never change source geometry.
Run after build.py. Read serialized STEP solids, not builder state.
"""
from pathlib import Path
import json,itertools
import cadquery as cq
from OCP.gp import gp_Trsf
P=Path(__file__).parent/'artifacts'
def pose(s,rows):
 tr=gp_Trsf();tr.SetValues(*[n for row in rows for n in row]);return s.moved(cq.Location(tr))
def vol(a,b):
 s=a.intersect(b);return s.Volume() if s.Solids() else 0
parts={k:cq.importers.importStep(str(P/(k+'.step'))).val() for k in ['LEG_A','LEG_B','TRI_BASE_ROUNDED','LENGTH_OUTER_L','WIDTH_OUTER_W']}
rails={
'L':pose(parts['LENGTH_OUTER_L'],[[1,0,0,-10],[0,0,-1,6],[0,1,0,370]]),
'W':pose(parts['WIDTH_OUTER_W'],[[0,0,1,0],[1,0,0,-10],[0,1,0,370]])}
results=[]
for label,offset,base_origin in [('rail_tabs_aligned',-16,0),('leg_corner_and_base_aligned',-10,6)]:
 bodies=dict(rails)
 bodies['A']=pose(parts['LEG_A'],[[1,0,0,offset],[0,0,-1,6],[0,1,0,-10]])
 bodies['B']=pose(parts['LEG_B'],[[0,0,1,0],[1,0,0,offset],[0,1,0,-10]])
 bodies['BASE']=pose(parts['TRI_BASE_ROUNDED'],[[1,0,0,base_origin],[0,1,0,base_origin],[0,0,1,0]])
 pairs=[dict(a=a,b=b,intersection_mm3=vol(bodies[a],bodies[b])) for a,b in itertools.combinations(bodies,2)]
 results.append(dict(candidate=label,status='REJECTED',leg_profile_u_offset_mm=offset,frame_bottom_from_floor_mm=380,base_xy_mm=[base_origin]*2,pairs=pairs,collisions=[p for p in pairs if p['intersection_mm3']>1e-5]))
a,b=results
assert next(p['intersection_mm3'] for p in a['pairs'] if (p['a'],p['b'])==('A','B'))>13000
assert all(p['intersection_mm3']<1e-5 for p in a['pairs'] if p['a'] in ['L','W'] and p['b'] in ['A','B'])
assert next(p['intersection_mm3'] for p in b['pairs'] if (p['a'],p['b'])==('A','B'))<1e-5
assert sum(p['intersection_mm3'] for p in b['collisions'] if p['a'] in ['L','W'] and p['b'] in ['A','B'])>1000
report={'status':'FAIL_CANDIDATES_NOT_APPROVED_ASSEMBLY','scope':'SW reference-corner interpretations only; not proof that every possible assembly fails','geometry_changes':0,'sources':['V3 DXF via individually exported STEP','verification report: left profile X offset -6mm; floor notch0..6mm;19 complementary spine segments'],'interpretation':'Raw u,v are DXF coordinates; nominal t6mm. Leg floor v=10. Frame bottom Z380 inferred from six-mm upper tabs. Rail/base alignment interpretation is diagnostic, not authoritative recovered placement.','candidates':results,'remaining_input':'Confirm intended signed A/B/tri-base and rail datum at one named corner and orientation at other corners, or supply authoritative topless assembly CAD. Tabletop is excluded by owner and is not requested.'}
(P/'corner-study.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({r['candidate']:r['collisions'] for r in results}))
