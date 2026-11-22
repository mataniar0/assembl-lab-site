"""Collect acceptance evidence for the separate rounded research candidate."""
from pathlib import Path
import hashlib, json
from model import option_profiles, instances, FEATURES
from shoulder import candidate

P = Path(__file__).parent; OUT = P/'artifacts/R_ROUNDED_SHOULDERS'
old, profiles, _ = option_profiles('R_RAIL_REINDEX')
_, _, _, details = candidate(old, profiles, instances('R_RAIL_REINDEX'), FEATURES)
def read(name): return json.loads((OUT/name).read_text())
summary = read('summary.json'); replay = read('independent-qc.json')
shoulder = read('shoulder-qc.json'); gltf = read('gltf-validation.json'); browser = read('browser-qc.json')
assert summary['status'] == 'CAD_COMPUTED_PASS' and summary['collision_failures'] == summary['joint_failures'] == 0
assert replay['pairs'] == 171 and replay['collision_failures'] == 0
for file, sha in replay['input_sha256'].items():
    assert hashlib.sha256((OUT/file).read_bytes()).hexdigest() == sha, ('Stale independent replay', file)
assert shoulder['status'] == browser['status'] == 'PASS'
assert gltf['issues']['numErrors'] == gltf['issues']['numWarnings'] == 0
summary['connected_components'] = shoulder['connected_components']
summary['glb_bytes'] = replay['glb_bytes']
summary['shoulder_refinement'] = 'PASS'
(OUT/'summary.json').write_text(json.dumps(summary, indent=2)+'\n')
study = dict(status='CAD_COMPUTED_PASS', option='R_ROUNDED_SHOULDERS',
    parent_design_sha='d252377e9a929578f75d8ae121e2d21bbd029c05',
    baseline_v3_sha='7b5af4725fdd4eccd4ae623fb031cc5a796b6df1',
    user_request='Implement the displayed rounded upper-leg shoulder proposal',
    branch='feature/al-016-flow-v31-options', tabletop=False,
    geometry_design_revision_cycles=1, geometry_failure_correction_cycles=1,
    script_repair_cycles=0, inherited_study_script_repairs=2,
    source_v3_hashes='UNCHANGED', earlier_R_L_artifacts='PRESERVED',
    nominal_thickness_mm=6, designed_clearance_mm=0, kerf_compensated=False,
    manufacturing_approval=False, physical_validation='NOT_PERFORMED',
    method='Rail-following local addition and sampled tangent cubic transition; not a constant-radius fillet',
    shoulder_patch_local_uv_mm=[156,386,220,410],
    correction=dict(cause='Uniform shoulder stations bridged source rail facets; 0.000245569 mm gap exceeded 0.0002 mm criterion',
                    fix='Include every original rail vertex station; keep original threshold',
                    evidence='attempts/01-rail-sampling-gap/failure.json'),
    detail_parameters=details, summary=summary)
(OUT/'study.json').write_text(json.dumps(study, indent=2)+'\n')
(OUT/'dxf/NOT_FOR_PRODUCTION.txt').write_text(
    'V3.1 R_ROUNDED_SHOULDERS / CANDIDATE / DESIGN_ONLY / NOT_FOR_PRODUCTION\n'
    'Use this complete coherent set, with distinct A/B NEAR/FAR rounded legs.\n'
    'Nominal 6 mm; no kerf, fit, load or production-cut authorization.\n')
qa = json.loads((P.resolve().parents[1]/'.qa-reports/latest.json').read_text())
assert qa['passed'] == 66 and qa['failed'] == qa['real_posts'] == 0
(OUT/'site-smoke.json').write_text(json.dumps({k:qa[k] for k in ['passed','failed','real_posts']}, indent=2)+'\n')
for root in [OUT, P/'artifacts']:
    (root/'SHA256SUMS').write_text(''.join(hashlib.sha256(f.read_bytes()).hexdigest()+'  '+f.relative_to(root).as_posix()+'\n'
        for f in sorted(root.rglob('*')) if f.is_file() and f.name != 'SHA256SUMS'))
print('PASS: rounded candidate evidence, revision ledger and SHA256 manifest finalized')
