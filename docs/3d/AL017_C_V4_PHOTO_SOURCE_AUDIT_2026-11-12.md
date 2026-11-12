# AL-017-C / Issue #40 — V4-700 photo/source version reconciliation
Date: 2026-11-12
Status: **DESIGN_ONLY STEP+GLB NOMINAL PASS; VISUAL VERSION MATCH SUPPORTED; METRIC AS-BUILT MEASUREMENT PENDING; SITE 3D INTEGRATION HOLD**.

## Governing source and photography
- Product page: `shoe_rack/index.html`, current main published spec **800 mm**, originally authored for V3-S6.
- Source candidate: user Library `shoe_bench_V4_700_VERSION_A_DXF.zip`, SHA256 `3e7ee4476b4b884058c883a8439f0ab6a8ed9f559cd0c44867f9a33d63c78652`. This source defines **700 × 320 × 520 mm**, 6mm plywood, six 800×440mm cutting sheets and 7 slats per shelf (21 total).
- Historical alternative: `shoe_bench_V3_S6_VERSION_A_EXACT_DXF.zip`, **800 × 320 × 520 mm**, 8 slats per shelf (24 total); different cutting-sheet generation. Do **not** mix V3/V4.
- Site photos reviewed in GitHub main:
  - `shoe_rack/media/production/05-front-view-full.webp`: three visible shelf levels, **7 slats on each** by manual visual count; seven front-rail slot patterns corroborate.
  - `shoe_rack/media/production/04-assembled-angled-full.webp`: Version A decorative side pattern, three slatted shelves, double top.
  - `shoe_rack/media/production/03-mid-assembly-full.webp`: source-compatible rack assembly motif, side panels and slatted shelf modules.
  - `shoe_rack/media/production/02-parts-layout-full.webp`: 3 slatted shelf subassemblies, each visually consistent with **7 slats**, plus double top and side profiles.
- **Conclusion:** strong visual evidence supports the V4-700 component generation (7-per-shelf) over V3-S6 (8-per-shelf). The photograph has no reference scale or verified tape measurement, so its exact physical width **cannot be proven by counting slats alone**. Treat 700mm as **V4 nominal design width**, not physically measured as-built width.
- Product owner's prior discussion explicitly chose the 700mm revision after considering 800mm; this preference is consistent with V4, but is not a calibrated measurement of the pictured item.

## Nominal engineering assembly delivered previously
- V4 assembly has 36 source-based CAD solids: sides ×2, upper side reinforcements ×2, lower top ×1, upper top ×1, top beams ×3, shelf rails ×6, shelf slats ×21.
- Existing independent detailed CAD report: **630 unique part pairs**, 69 exact volumetric intersections, **0 positive collisions** above 0.0001mm³, **79 actual touching pairs**, one connected assembly contact graph. These are reported previously in Issue #40 and original owner delivery; full pairwise booleans were **not re-run in the 2026-11-12 source/photo follow-up**.
- Fresh re-import in this pass: **36/36 valid STEP solids**, bounds **700 × 320 × 520 mm**; GLB **36/36 watertight meshes**, 3,808 triangles, viewer extent **0.700 × 0.520 × 0.320 m** (Y up).
- Fresh DXF hash audit: 7/7 unique source-part SHA256 match immutable V4 source archive.
- STEP SHA256: `01cbe984f5a300084950d8db3b59be8d0dd4346c81bb203b3859f5832b52b3cf`.
- GLB SHA256: `84fbf1bef9a264c399ac800333a899e818a1fdf68c956d6eabdb4a896fa49445`.
- Current pass: **zero redesign cycles**, **zero code fixes**; older 4 QA/tool/render correction cycles were reported in the preceding CAD milestone (not counted again).

## Website change staged for review
The Draft PR changes **only the base-width display**, from 800mm to **700mm (V4 design nominal)**, and labels the width as a *design dimension* in HE/EN. It does not assert that the photographed piece was measured or certified. Do not merge this copy adjustment until the owner reviews the nominated variant and the actual unit width, or explicitly elects to display V4 nominal design dimensions.
- No GLB is uploaded in this branch; shared viewer baseline PR #31 remains Draft.
- Actual 3D viewer, poster, accessibility QA, browser CI and site publication remain **HOLD**.
- No original production DXF/STEP/GLB modified in this branch.
- No claims of physical fit, glue/kerf, durability, structural load, stability, or safe sitting.

## Next gates
1. **Owner physical check or authoritative as-built record:** is the pictured built product 700mm wide? If not, inspect full drawing/version history rather than forcing a 700mm description.
2. After the variant is accepted, upload the exact GLB and CAD poster with hashes to a feature branch, based on the accepted #31 viewer, not main without viewer files.
3. Targeted bilingual HE/EN, poster lazy-load, WebGL fallback, touch, keyboard, all responsive breakpoints, CI, 0 real inquiry posts, independent ChatGPT QA.
4. Site merge/deploy requires independent explicit project-manager approval. CAD pass is **not** product-use or manufacturing approval.

## Source-of-truth owner deliverable
`AL017_SHOE_RACK_ISSUE40_CAD_QA_HANDOFF.zip`: full CAD STEP/GLB, 5 actual CAD renders, original V4 DXFs, scripted reproducibility, independent QA and manifest. The binary GLB remains in the owner's ChatGPT file delivery, **not in GitHub**.

**Assignment:** ChatGPT only; Codex is not used.
