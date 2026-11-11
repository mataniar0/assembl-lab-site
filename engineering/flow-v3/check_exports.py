"""Independent serialized-export checks. Does not import or rerun the builder."""
from pathlib import Path
import json,hashlib
import numpy as np
import cadquery as cq,trimesh
from pygltflib import GLTF2
P=Path(__file__).parent/'artifacts';checks={}
for key,expected in [('Flow_V3_PARTIAL_FRAME_DESIGN_ONLY',7),('Flow_V3_PART_LIBRARY_NOT_ASSEMBLED',7)]:
 s=cq.importers.importStep(str(P/(key+'.step'))).val();assert s.isValid() and len(s.Solids())==expected
 scene=trimesh.load(P/(key+'.glb'),force='scene');g=GLTF2().load(str(P/(key+'.glb')))
 assert len(scene.geometry)==expected
 for m in scene.geometry.values():
  assert np.isfinite(m.vertices).all() and np.isfinite(m.vertex_normals).all()
  assert m.faces.min()>=0 and m.faces.max()<len(m.vertices) and m.is_watertight and m.volume>0
 for _,matrix in scene.graph.to_flattened().items():
  assert np.isfinite(matrix['transform']).all()
 assert (P/(key+'.glb')).stat().st_size<3_000_000
 checks[key]=dict(status='PASS',step_solids=len(s.Solids()),glb_nodes=len(g.nodes),glb_unique_meshes=len(g.meshes),glb_mesh_instances=len(scene.geometry),bounds_metres=scene.bounds.tolist(),bytes=(P/(key+'.glb')).stat().st_size,finite=True,watertight=True)
 if 'PARTIAL_FRAME' in key:assert np.allclose(scene.extents,[.86,.07,.48],atol=1e-7)
for item in json.loads((P/'inventory.json').read_text()):
 s=cq.importers.importStep(str(P/(item['part']+'.step'))).val();assert s.isValid() and len(s.Solids())==1
 assert abs(s.Volume()-item['volume_mm3'])<1e-4
(P/'export-checks.json').write_text(json.dumps(checks,indent=2)+'\n');print(json.dumps(checks))
