"""Export a clearly REJECTED five-body SW-corner witness, not a complete table."""
from pathlib import Path
import json,itertools
import numpy as np,cadquery as cq,trimesh
from OCP.gp import gp_Trsf
P=Path(__file__).parent/'artifacts';Q=P/'search'
def read(n):return json.loads((Q/n).read_text())
def pose(s,m):
 t=gp_Trsf();t.SetValues(*m[:3,:].reshape(-1).tolist());return s.moved(cq.Location(t))
upper=read('upper-pose-enumeration.json');corners=read('corner-enumeration.json')['candidates'];bases=read('base-enumeration.json')['candidates']
c=next(c for c in corners if c['id']=='SW_lu0_wu0_lv0_wv0_LEG_A_u1_u1')
b=next(b for b in bases if b['corner_candidate']==c['id'] and b['tongue_to_slot_order']==[0,1] and np.allclose(np.array(b['matrix'])[:2,:2],np.eye(2)))
rr={r['id']:r for r in upper['rails']};pp={p['id']:p for p in upper['poses']}
items=[]
for i in c['rails']:
 r=rr[i];items.append(dict(name=r['rail'],part=r['part'],matrix=r['matrix'],color=[178,137,85,255]))
for i,color in zip(c['leg_poses'],[[60,125,200,255],[230,120,60,255]]):
 r=pp[i];items.append(dict(name=r['leg'],part=r['leg'],matrix=r['matrix'],color=color))
items.append(dict(name='TRI_BASE_REJECTED_POSITION',part='TRI_BASE_ROUNDED',matrix=b['matrix'],color=[200,40,65,255]))
assembly=cq.Assembly(name='REJECTED_SW_CORNER_DESIGN_ONLY');scene=trimesh.Scene();world={};display=np.array([[.001,0,0,0],[0,0,.001,0],[0,-.001,0,0],[0,0,0,1]])
for i in items:
 s=cq.importers.importStep(str(P/(i['part']+'.step'))).val();m=np.array(i['matrix']);s=pose(s,m);assert s.isValid();world[i['name']]=s
 assembly.add(s,name=i['name'],color=cq.Color(*[v/255 for v in i['color'][:3]]))
 vs,fs=s.tessellate(.05);mesh=trimesh.Trimesh(vertices=[v.toTuple() for v in vs],faces=fs,process=True);assert mesh.is_watertight
 mesh.apply_transform(display);mesh.visual=trimesh.visual.ColorVisuals(mesh,vertex_colors=i['color']);scene.add_geometry(mesh,node_name=i['name'],geom_name=i['name'])
scene.metadata={'status':'FAIL_REJECTED_REFERENCE_CORNER','complete_table':False,'tabletop_required':False,'corner_candidate':c['id'],'note':'Blue/orange panels clash; red base has unmatched tongue. Diagnostic only.'}
assembly.export(str(Q/'REJECTED_SW_CORNER_DESIGN_ONLY.step'));scene.export(str(Q/'REJECTED_SW_CORNER_DESIGN_ONLY.glb'))
roundtrip=cq.importers.importStep(str(Q/'REJECTED_SW_CORNER_DESIGN_ONLY.step')).val();assert roundtrip.isValid() and len(roundtrip.Solids())==5
pairs=[]
for a,bn in itertools.combinations(world,2):
 common=world[a].intersect(world[bn]);v=common.Volume() if common.Solids() else 0.;pairs.append(dict(a=a,b=bn,overlap_mm3=v,status='FAIL' if v>1e-5 else 'PASS'))
manifest=dict(status='REJECTED_NOT_ASSEMBLY',corner=c['id'],instances=items,pairs=pairs,base_fit=dict(max_axis_residual_mm=b['max_axis_residual_mm'],second_tongue_residual_mm=b['second_tongue_residual_mm']),step_roundtrip=True,solids=5,complete_table=False,tabletop_required=False)
(Q/'witness.json').write_text(json.dumps(manifest,indent=2)+'\n');print({'exported':'REJECTED_SW_CORNER','pairs':len(pairs),'failures':sum(p['status']=='FAIL' for p in pairs)})
