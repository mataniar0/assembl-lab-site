# AL-MEB033-3D-FIX-004 — V3 independent geometry review

- Source: `mataniar0/assembl-lab-engineering` MEB-033 (20 product parts + bending jig; nominal 4 mm stock).
- Owner reported: physical case successfully cut and assembled. This is user evidence, not a scan of the assembled product.
- Prior V1 issues: incorrect fascia rotation, omitted holes, invented parabolic roof and arbitrary hinge pins; addressed in V2 / PR #74.
- Current V2 QA discovery: `BODY_FRONT` vs `LID_FRONT_RAIL` occupied the same Z slab (−38.5..−34.5 mm) and shared Y 66.5..71 mm. Rasterized cross-section of actual source profiles showed simultaneous material at 22,174 of 23,220 quarter-mm grid cells (95.5% of the joint region), approx. 1,386 mm² section × 4 mm = 5,544 mm³ overlap.
- V3 change: front lid rail relocated −4.0 mm along Z. All other 19 component vertex coordinates unchanged. New rail Z interval −42.5..−38.5 mm; body front Z −38.5..−34.5 mm; thickness-slab overlap now zero (boundary contact only).
- Browser evidence: V3 loaded in site model-viewer on desktop; new poster is a direct screenshot of V3, not an older rendering.
- QA: generator determinism, 20 product meshes, original 10 inner holes, 22×4 R6 kerfs, poster PNG validity, bilingual view and no-JS fallback; GitHub CI evidence is attached to the PR.
- Status: digital-collision fix implemented. Full as-built assembly exactness **not verified** (no physical measurements/photos yet). No STEP verified assembly.

## Correction cycles

1. Historical V1 → V2: corrected orientation, openings, curve, hinge anchors.
2. Current V2 → V3: corrected front-lid-rail collision, added independent geometry audit and reproducible V3 geometry.

The change alters the browser model only; it does not modify production cutting files or assert physical manufacturing clearance.
