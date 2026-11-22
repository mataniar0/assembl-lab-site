"""Analytical constrained design scan + CAD-backed disconnected-joint control."""
from model import *
from itertools import product
OUT=HERE/'artifacts';rows=[]
for near,far in product([0,3,6,9],[-14,-11,-8,-6,0]):
 residual=max(abs(near-6),abs(far+11))
 rows.append(dict(strategy='R_RAIL_REINDEX',near_mm=near,far_mm=far,upper_face_axis_residual_mm=residual,status='FEASIBLE_ANALYTICAL' if residual<EPS else 'REJECTED'))
for spine,start,radius,far in product([0,3,6,9],[0,3,6],[9.5,12,15.5],[-5,0,5]):
 interlock=abs(spine-6);base=abs(start);upper=abs(far+5);envelope=max(0,6+radius-18)
 rows.append(dict(strategy='L_LEG_BASE',spine_shift_mm=spine,tongue_start_mm=start,radius_mm=radius,far_tab_shift_mm=far,spine_axis_residual_mm=interlock,base_axis_residual_mm=base,upper_axis_residual_mm=upper,base_overhang_mm=envelope,footprint_clearance_mm=18-(6+radius),status='FEASIBLE_ANALYTICAL' if max(interlock,base,upper,envelope)<EPS else 'REJECTED'))
# A near miss intentionally clears material but loses the vertical spine joint.
orig=source();a=matrix((1,0,0),(0,0,1),(0,-1,0),(-9,6,-10));b=matrix((0,1,0),(0,0,1),(1,0,0),(0,-9,-10))
sa=moved(solid(orig['LEG_A']),a);sb=moved(solid(orig['LEG_B']),b);common=sa.intersect(sb);volume=common.Volume() if common.Solids() else 0.;distance=sa.distance(sb);components=contact_components(sa,sb);area=sum(components.values());vertical=components['X']+components['Y']
assert volume<VTOL and vertical<EPS and abs(components['Z']-450)<EPS
write(OUT/'parameter-scan.json',dict(method='Necessary full-face equations derived from source datums; zero-residual candidates further checked as full CAD assemblies in their option folders.',parameters=rows,tested=len(rows),analytical_feasible=sum(r['status']=='FEASIBLE_ANALYTICAL' for r in rows),negative_control=dict(name='G_GAP_CONTROL',rail_near_shift_mm=7,rail_far_shift_mm=-12,base_tongue_start_mm=7,leg_translation_u_mm=-9,leg_leg_overlap_mm3=volume,leg_leg_distance_mm=distance,leg_leg_contact_mm2=area,vertical_spine_contact_mm2=vertical,horizontal_contact_mm2=components['Z'],vertical_spine_gap_mm=1,status='REJECTED_NO_SPINE_JOINT'),source_modified=False))
print({'tested':len(rows),'feasible':sum(r['status']=='FEASIBLE_ANALYTICAL' for r in rows),'gap_control_mm':distance})
