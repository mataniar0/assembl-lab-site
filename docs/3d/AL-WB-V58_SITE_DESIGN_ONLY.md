# AL-WB-3D-001 — Workbench V5.8 3D design preview

**Scope:** website design-only preview, not a manufacturing release.

- Page: `workbench/index.html`
- Model: `workbench/media/workbench-v58-design-only.glb`
- Poster: `workbench/media/workbench-v58-design-only-poster.webp`
- Original engineering GLB SHA256 (millimetre units, not modified): `df73cbf5e694b5fe0078f1072a3199297399addcca1d26df9ab3579dbc12e4da`
- Site GLB SHA256 (vertex coordinates converted from millimetres to metres, same 161 meshes): `a8ab0fb20818f6de0c46e69216177fb5a7b2182d5cec081eebe0bada4c503309`
- Model content: 161 distinct named meshes, 161 physically modeled wood parts, nominal 6 mm material, frame envelope 1400 × 700 × 900 mm. The separate 1400 × 800 mm top is not included.
- Source is the real V5.8 GLB created from CAD part profiles, not AI-generated product artwork.
- **Known unresolved CAD defect:** 158 solid intersections remain in the *full table*, and no full assembly insertion proof or independent physical QA has passed.
- **Status:** `DESIGN_ONLY / G2b BLOCKED / G3 NOT_RUN / G4 BLOCKED`; do not promote model as build-tested, load-certified, or production ready.

## Implementation
Reuses existing `assets/three-preview.js` and `three-preview.css`. GLB not fetched until user activates the viewer. All content, controls and disclaimers bilingual; static CAD poster remains when JS/WebGL/model are absent.

## QA plan
- Extend seven-product asset checker: model hash, GLB header/mesh count, WebP, page binding and no critical disclaimer omissions.
- Extend browser regression to seven routes × 2 languages × 5 widths; test lazy loading, orbit/zoom/reset, language toggling, close and fallback.
- CI: `site-checks.yml` unchanged except the test step label.
- Existing product pages, galleries and inquiry flows unmodified. Browser QA and independent QA must pass before merge.
- No real inquiry submissions, no merge, no deployment from this commit.

Issue: https://github.com/mataniar0/assembl-lab-site/issues/59
