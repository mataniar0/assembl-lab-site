# AL-016 — partial design-preview handoff

Issue: https://github.com/mataniar0/assembl-lab-site/issues/30  
Branch: `feature/al-016-coffee-table-3d`  
Base main: `2a0fe67d742dec79421a03a9dd10076aba427aa5`  
Read-only engineering source: `548133b0462909e63c41d29d5bef859ce8fbc60c`

**Scope review required: one digital design preview, two source blockers. This is not 3/3 completion or a verified replica of the manufactured Personal table. No merge/deployment authorized.** The coordinating manager owns independent source/visual QA, numerical score and APPROVED decision. This implementer's checks are self-QA, not an independent reviewer approval.

## Model decisions

| Product / tested route | Result | Reason / next required input |
|---|---|---|
| Geometric — `/geometric/` | **BLOCKED — missing complete 3D source** | Need the complete authoritative Geometric assembly CAD, parts and coordinate contract. The unrelated CTB-01 GEOMETRIC leg variant was not substituted. Existing gallery retained. |
| Flow — `/table/flow/` | **BLOCKED — missing complete assembly source** | Seven V3 nominal DXF classes do not supply a same-revision tabletop contour and validated XYZ assembly placements/intersections. Local tab/slot checks do not establish full assembly. Existing gallery retained. |
| Personal — `/table/personal/` | **PASS for DESIGN_ONLY preview; as-built match UNVERIFIED** | Reuses the existing complete digital prototype, with explicit bilingual design/finish/fit/strength limitations. Photos have different visible tabs/spacer treatment and finishing; no claim of identical manufactured geometry. |

[Source audit](AL-016_SOURCE_AUDIT.md) and [source inventory with exact paths/hashes](source-inventory.json) explain the gates. Source G3 deferred/G4 blocked status is inherited, never upgraded by this website task. No physical fit/load test or manufacturing release was performed. Engineering and WOOD U LIKE were not modified.

## Implementation and model integrity

Only the three table pages change. Shared `assets/three-preview.{js,css}` handles explicit activation, horizontal touch orbit, pinch/zoom, labeled keyboard-operable direction/zoom/reset controls, escape/back to the original gallery, live loading/error status and HE/EN changes without losing camera state. Buttons have at least 44px targets and visible focus. Vertical touch scroll remains available. Geometric/Flow have no activation button/model URL and no substitute GLB.

The versioned local `@google/model-viewer@4.1.0` bundle and Apache license are vendored in `assets/vendor/model-viewer-4.1.0/`. Registry metadata includes the verified package SHA512; the README records bundle SHA256 and reproduction. There is no runtime CDN or application build migration. No GLB/library download occurs until the visitor clicks; the actual model-rendered WebP poster is lazy-loaded. Existing photos, original gallery DOM/controls, inquiry links, translations, SEO metadata and unrelated products/configuration are preserved.

Personal export:

- Asset: `table/personal/media/personal-design-preview.glb`, **1,700,936 bytes**, SHA256 **`17da2aafb7f17182b940804c22cb2be8dc0430cad26f20c76ca78e08ae9b8841`**.
- Source GLB: **654,268 bytes**, SHA256 `285dabf36be7d7a26772d4ad9dba7442eb1c06704fe104aec929adf4c4a65bf4`.
- 32 meshes, 33 nodes, 41,234 indexed triangles. All 32 bodies have nonempty visible surfaces. The source includes **872 zero-area triangles**, retained rather than silently repairing the engineering geometry.
- Every indexed triangle position and vertex color is checked exactly against source. Only shading vertices/normals are split at 30-degree creases; no part is moved, remade, recolored or rescaled. The rigid root Rx(-90°) changes Z-up to display Y-up, preserving metres. Source height500mm and top diameter350mm agree with frozen parameters.
- Display bounds metres: x[-0.174999997, 0.261999995], y[0, 0.5], z[-0.233648658, 0.233648658]. Overall width/depth include projecting legs; they are not the tabletop diameter.
- Original tan vertex colors retained; no final black-paint representation fabricated. No external materials/UV/textures are required. Public mesh/node names sanitized; exact source-to-public32-part mapping in [personal-export.json](personal-export.json). No production DXF, annotated cut dimensions or manufacturing files embedded.
- Model is below the 3MB target without geometric decimation. Poster `personal-design-preview-poster.webp` is **9,176 bytes**, rendered from the exact model in Chromium.

## Reproducible tests and evidence

Run from repository root after normal `python scripts/setup_checks.py`:

```sh
python tests/three_model_assets_check.py --source /path/to/validated-candidate-DESIGN_ONLY.glb
.venv-qa/bin/python tests/three_preview_smoke.py
.venv-qa/bin/python tests/three_touch_smoke.py
python scripts/check_site.py --commit HEAD
python tests/pre_push_integration.py
```

The browser suite uses existing pinned QA Playwright and `/usr/bin/chromium`, with SwiftShader for headless WebGL. `--no-captures` skips only screenshot regeneration, not assertions. Baseline captures use immutable main SHA above. For model export, run `python docs/3d/export_personal_preview.py` in an environment with NumPy, alongside the read-only engineering checkout; the script rejects an unexpected source hash. For Khronos validation, install `gltf-validator@2.0.0-dev.3.10` with the committed lockfile into a disposable directory and run `NODE_PATH=/path/to/node_modules node docs/3d/validate_glb.cjs`.

| Check | Evidence / result |
|---|---|
| Khronos glTF validator2.0.0-dev.3.10 | [JSON](../../QA_EVIDENCE/AL-016/gltf-validation.json): **0 errors, 0 warnings, 0 hints** |
| Separate binary/source checks | [JSON](../../QA_EVIDENCE/AL-016/independent-asset-check.json): **3 passed, 0 failed**, including two genuinely corrupt GLBs rejected and exact source triangle/color comparison |
| Dedicated browser suite | [JSON](../../QA_EVIDENCE/AL-016/browser/results.json): **37 passed, 0 failed, 0 real posts** |
| Touch | [JSON](../../QA_EVIDENCE/AL-016/touch.json): **3 passed, 0 failed** — emulated drag orbit, pinch zoom and 150px vertical page scroll |
| Generic smoke | Working candidate: **66 passed, 0 failed, 0 real posts**. Exact committed/pre-push result attached at handoff. |
| Hook integration after commit | Pending final evidence attachment. Uses a temporary local bare remote only, never GitHub. |
| GitHub Actions | **Not yet evidenced**. Existing `Site checks / Site smoke` workflow remains intact and runs on a PR targeting main. Branch-only push does not trigger it. A local pass is not a remote CI run. |

The dedicated suite covers all3routes × HE/EN × 320/390/768/1024/1440 (**30 cases**), exact original gallery/SEO metadata/inquiry destinations, no initial heavy fetch, local-only post-activation resources, rotate360, zoom, reset via keyboard, focus, language changes retaining the viewer, back to original gallery and working next arrow. Seven isolated fallback cases cover GLB404, library404, unsupported WebGL, delayed model, close while loading, no JavaScript and blocked JavaScript. Expected failure logs are confined to those negative cases. All regular contexts reject unexpected console/network errors. All test writes are intercepted; **0 real inquiries**.

[60 before/after screenshots and three model angles](../../QA_EVIDENCE/AL-016/README.md) are indexed by page/language/width. Initial screenshots show the poster before activation; front/side/underside show the actual loaded model.

## Loading/performance

[Six cold local HTTP before/after pairs](../../QA_EVIDENCE/AL-016/performance.json), at390/1440 across all3routes, show **+6,832 initial transferred bytes** for the shared local JS/CSS including local HTTP overhead; **zero initial GLB/library requests**. The 979,139-byte pinned library and 1,700,936-byte GLB load only after activation; subsequent browser caching can reduce transfer. Local observed LCP samples are in the JSON, not a statistically valid production performance benchmark. No claim of improved production LCP. Slow-network coverage is a1s model delay plus timeout/fallback implementation, not a full bandwidth matrix.

## Correction history and limitations

**Three implementation self-correction cycles before handoff:** (1) bufferView targets removed55 validator hints (initially0errors/0warnings), (2) blocked-page wording and return-focus-to-gallery behavior, (3) visual review caught smoothed triangle shading on CAD flats; crease-aware normals corrected it while exact triangles/colors remained unchanged. No reviewer-authored repairs or post-review cycles.

During the shading cycle, a zero-area-face assertion exposed872 source degenerate triangles; retained them and used adjacent normals for their invisible surfaces. A QA-venv export attempt lacked NumPy; the documented system NumPy environment succeeded. These are recorded failed attempts, not new geometry. Separate tooling corrections: npm default cache failed (used writable `/tmp` cache), an initial one-off Node validator wrapper used a boolean exitCode (replaced with maintained numeric-exit wrapper), and a new gallery-preservation selector had an unquoted colon (corrected; [failed harness log](../../QA_EVIDENCE/AL-016/tooling-selector-failure.log)). This harness run was stopped and superseded by the final complete run. None were hidden by relaxing acceptance assertions or bypassing hooks.

Physical mobile devices, Safari/iOS, real-user GPU diversity and production network LCP were not tested. Source fit/strength, painted appearance and as-built exactness remain unverified. Source blockers require new authoritative artifacts, not extra retries. Manager scope approval and independent quality score remain pending; this report gives no numerical self-grade and authorizes no publication.
