"""Summarize the exact constraint contradiction and plot the source-based witness."""
from pathlib import Path
import json,math,hashlib,os
os.environ.setdefault("MPLCONFIGDIR",str(Path(__file__).resolve().parents[3]/"work/flow-search/mpl-cache"))
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import Rectangle
P=Path(__file__).parent/'artifacts';Q=P/'search'
def read(n):return json.loads((Q/n).read_text())
s=read('summary.json');c=read('corner-enumeration.json')['candidates'];b=read('base-enumeration.json')['candidates'];f=read('features.json')['features']
assert s['passing_corners']==0 and s['base_exact_fit_candidates']==0
example=next(x for x in c if x['id']=='SW_lu0_wu0_lv0_wv0_LEG_A_u1_u1')
distances=sorted(set(round(x['required_tongue_centre_distance_mm'],9) for x in c))
certificate=dict(status='UNSAT_SOURCE_CONTACT_CONTRACT',scope='Original profiles, specified full-face interfaces, level frame, all feet/base on one floor, orthogonal nominal6mm assembly. Not an unrestricted proof for altered joint topology or redesigned parts.',assumptions=[{'id':'C1','constraint':'All four source20x6 upper tabs fully engage matching four rail notches; same6mm thickness slab','source':'features.json; upper-pose-enumeration.json'},{'id':'C2','constraint':'Original leg6x6 lower notch is the base-tongue receiver; v=10 floor datum; no part profile change','source':'V3 DXFs and inherited verification report; features.json'},{'id':'C3','constraint':'Both original base6x6 tongues engage both foot slots simultaneously; base horizontal, lower faceZ0','source':'V3 tri-base DXF; features.json'},{'id':'C4','constraint':'A/B at each corner connect adjacent L/W rails; all19 parts and indicated interface topology','source':'V3 verification report connection summary'},{'id':'C5','constraint':'One level frame with coplanar rails and all four corner feet on the floor','source':'Rigid seven-body frame, V3 floor and corner statements'}],unsat_core=['C1','C2','C3','C4'],fixed_base_centre_vector_mm=[-12,12],fixed_base_centre_distance_mm=math.sqrt(288),all_required_slot_centre_distances_mm=distances,min_distance_invariant_residual_mm=s['minimum_distance_invariant_residual_mm'],continuous_base_translation_minimax_axis_residual_mm=3.,axis_face_tolerance_mm=1e-6,canonical_SW_example=example,additional_failures=dict(all512_leg_pairs_overlap=True,minimum_overlap_mm3=s['minimum_leg_leg_overlap_mm3'],vertical_rail_inversion='Upper tab faces can coincide but own-rail body clashes; mixed rail vertical flips demand frame Z316 and380 simultaneously'),coverage=dict(upper_interface_candidates=s['unique_upper_poses'],exact_upper_surface_candidates=s['upper_fit_poses'],corner_pairs=len(c),base_orientation_correspondences=len(b),all_receiver_subsets_per_rail_class=70,compatible_receiver_groups=2,proper_panel_rotations=24,prismatic_mirror_equivalence=True,external_rail_UV_configs=256,height_consistent_frame_configs=32),minimal_owner_input={'drawing':'One dimensioned named-corner plan plus vertical section, or native assembly with original-profile revision identity','must_resolve':['Which L/W rail notch group receives each four-tab set and whether full6mm coplanar engagement is intended','Signed A/B material-thickness planes and coordinate of each lower6x6 receiver centre in that same frame','Which6x6 base tongue mates which receiver; source tongue-centre difference is12mm along each axis','Floor-to-frame datum and how the reference corner is oriented at all four corners'],'tabletop_requested':False,'if_same_contract_confirmed':'PM-authorized design revision is necessary to resolve the incompatible source interfaces; do not edit source DXFs silently'},full19_gate='BLOCKED_NOT_RUN_NO_FEASIBLE_CORNER',source_geometry_changes=0)
(Q/'unsat-certificate.json').write_text(json.dumps(certificate,indent=2)+'\n')
# Dimensioned plan view of the canonical contradiction; feature rectangles are
# actual source receiver/tongue footprints. Translation of base is diagnostic.
fig,ax=plt.subplots(figsize=(9,7));ax.set_aspect('equal');ax.set_xlim(-10,30);ax.set_ylim(-7,33)
for xy,label,color in [((6,0),'A receiver (9,3)',(0.2,.45,.8)),((0,6),'B receiver (3,9)',(1,.5,.15))]:
 ax.add_patch(Rectangle(xy,6,6,fill=False,edgecolor=color,linewidth=3));ax.text(xy[0]+7,xy[1]+1,label,color=color,fontsize=11)
centres=np.array(f['TRI_BASE_ROUNDED']['centres'])+np.array([0,6]);targets=np.array([[9,3],[3,9]])
for rect in f['TRI_BASE_ROUNDED']['tongue_rectangles']:
 x0,y0,x1,y1=rect;ax.add_patch(Rectangle((x0,y0+6),x1-x0,y1-y0,facecolor='#ba2b49',alpha=.3,edgecolor='#ba2b49',hatch='///'))
ax.plot(*targets.T,'o-',label='Receiver centres: distance 6 sqrt(2) mm',color='#333333');ax.plot(*centres.T,'s--',label='Base tongue centres: distance 12 sqrt(2) mm',color='#ba2b49')
# Centre coordinates are formatted in the receiver labels, not NumPy reprs.
ax.annotate('Second tongue error = (-6,+6) mm',centres[1],xytext=(1,24),arrowprops={'arrowstyle':'->'},fontsize=11)
ax.set_xlabel('CAD X (mm)');ax.set_ylabel('CAD Y (mm)');ax.set_title('Flow V3 | REJECTED SW corner | source-derived constraints\nBase translated (0,+6) mm to engage A; B cannot engage')
ax.grid(alpha=.2);ax.legend(loc='lower right',fontsize=10);fig.tight_layout();fig.savefig(Q/'constraint-plan.png',dpi=150);fig.savefig(Q/'constraint-plan.svg');plt.close(fig)
svg=Q/'constraint-plan.svg';svg.write_text('\n'.join(line.rstrip() for line in svg.read_text().splitlines())+'\n')
print({'certificate':'UNSAT_SOURCE_CONTACT_CONTRACT','distances':distances,'minimum_residual_mm':s['minimum_distance_invariant_residual_mm']})
