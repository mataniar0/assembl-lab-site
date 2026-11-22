"""Mark experimental outputs and hash the review package; no release approval."""
from pathlib import Path
from collections import defaultdict
import json,hashlib,shutil
import ezdxf
P=Path(__file__).parent;ROOT=P.resolve().parents[1];OUT=P/'artifacts'
BASELINE='7b5af4725fdd4eccd4ae623fb031cc5a796b6df1'
for path,sha in json.loads((ROOT/'engineering/flow-v3/artifacts/source-hashes.json').read_text()).items():assert hashlib.sha256((ROOT/path).read_bytes()).hexdigest()==sha
options=json.loads((OUT/'summary.json').read_text());replay=json.loads((OUT/'independent-qc.json').read_text());assert replay['status']=='PASS'
for r in options:
 assert r['status']=='CAD_COMPUTED_PASS' and r['pairs']==171 and r['collision_failures']==r['joint_failures']==0
 folder=OUT/r['option'];edges=json.loads((folder/'joints-32.json').read_text());adj=defaultdict(set)
 for e in edges:
  assert e['status']=='PASS';adj[e['a']].add(e['b']);adj[e['b']].add(e['a'])
 seen=set();todo=['L_south']
 while todo:
  x=todo.pop()
  if x not in seen:seen.add(x);todo.extend(adj[x]-seen)
 assert len(seen)==19
 r['connected_components']=1
 for dxf in (folder/'dxf').glob('*.dxf'):
  def signature(p):
   d=ezdxf.readfile(p);return (d.units,[(e.closed,e.dxf.layer,[tuple(map(float,q)) for q in e.get_points()]) for e in d.modelspace()])
  before=signature(dxf);text=dxf.read_text()
  if not text.startswith('999\nV31_CANDIDATE'):dxf.write_text('999\nV31_CANDIDATE DESIGN_ONLY NOT_FOR_PRODUCTION NOMINAL_6MM NO_KERF\n'+text)
  assert before==signature(dxf)
 (folder/'dxf'/'NOT_FOR_PRODUCTION.txt').write_text('V3.1 CANDIDATE / DESIGN_ONLY / NO PRODUCTION CUT APPROVAL\nNominal6mm. No kerf or physical fit validation. Use only as coherent option set for PM research review.\n')
 g=json.loads((folder/'gltf-validation.json').read_text());assert g['issues']['numErrors']==g['issues']['numWarnings']==0
 r['glb_bytes']=next(x['glb_bytes'] for x in replay['options'] if x['option']==r['option'])
 (folder/'summary.json').write_text(json.dumps(r,indent=2)+'\n')
(OUT/'summary.json').write_text(json.dumps(options,indent=2)+'\n')
source=json.loads((ROOT/'engineering/flow-v3/artifacts/inventory.json').read_text())
study=dict(issue=36,baseline_sha=BASELINE,branch='feature/al-016-flow-v31-options',study_date='2026-11-22',source_dxfs=[{k:r[k] for k in ['part','file','sha256','quantity']} for r in source],recommended='R_RAIL_REINDEX',scope='Two separate V3.1 research candidates; no tabletop; nominal6mm; original V3 frozen',production_cut_authorized=False,physical_approval=False,merge_authorized=False,deploy_authorized=False,geometry_initial_iterations_per_option=1,geometry_correction_cycles=0,script_repair_cycles=2,script_repairs=[dict(id=1,issue='G gap control initially expected no face contact; actual horizontal steps touch450mm² despite zero vertical interlock',repair='Separate vertical X/Y contact from horizontal Z contact; reject zero vertical joint',log='attempts/script-failure-01-gap-control.log'),dict(id=2,issue='Drawing helper attempted polygon recursion on zero-area LineString contact',repair='Ignore zero-area intersections for penetration fill; preserve actual contact in CAD QC',log='attempts/script-failure-02-empty-area.log')],performance_iterations=1,performance_note='Initial R-positive reference run stopped during slow full scan; added disjoint-box proofs and exact through-cut prism symmetry caching. No geometry change.',options=options)
(OUT/'study.json').write_text(json.dumps(study,indent=2)+'\n')
attempts=OUT/'attempts';attempts.mkdir(exist_ok=True)
for name in ['script-failure-01-gap-control.log','script-failure-02-empty-area.log','build-01.log']:
 src=Path('/workspace/work/flow-v31')/name
 if src.exists():(attempts/name).write_text('\n'.join(line.rstrip() for line in src.read_text().splitlines())+'\n')
qa=ROOT/'.qa-reports/latest.json'
if qa.exists():
 q=json.loads(qa.read_text());assert q['passed']==66 and q['failed']==q['real_posts']==0
 (OUT/'site-smoke.json').write_text(json.dumps(dict(passed=66,failed=0,real_posts=0,report_sha256=hashlib.sha256(qa.read_bytes()).hexdigest(),scope='Software smoke only; normal pre-push checks exact committed candidate'),indent=2)+'\n')
(OUT/'SHA256SUMS').write_text(''.join(hashlib.sha256(f.read_bytes()).hexdigest()+'  '+f.relative_to(OUT).as_posix()+'\n' for f in sorted(OUT.rglob('*')) if f.is_file() and f.name!='SHA256SUMS'))
print('PASS: two CAD candidates; connected19-part graphs; no-production DXFs; frozen V3; recursive output SHA256')
