# AL-017-F — Workbench V5.3 — independent F1 and partial F2 diagnostic
**2026-11-12 | ChatGPT only | Partial CAD, NO complete L-node PASS.**

## Source audit independently repeated
- Native DXF SHA256 `3319c2ca4b20a411eb942a163bdc2c6d6a8891fa0bbfffc4d0dd8959d7b7dc45`.
- 17 cutting sheets of 950×440mm.
- **662 valid closed CUT contours = exactly 162 labeled part outlines + 500 internal openings**. All 162 text position-to-parent polygon matches and 162 named BOM rows validated 1-to-1.
- Original DXF unchanged; 6mm nominal, slot 6.15mm provisional; separate tabletop not modeled.

## Partial 3D constructed
- Actual source polygons `FL_COL_WIDE_RECV`, `FL_COL_WIDE_PLAIN`, `FL_COL_NARROW_SIDE_RECV`, `FL_COL_NARROW_PLAIN` reconstructed as **one four-skin FL column** (90×90×900mm envelope).
- **4/4 STEP valid solids**, **4/4 GLB watertight meshes**, all source-borne receiver openings retained.
- **6/6** pair intersections: **0 positive overlaps**, **4 touching pairs**. Negative control: shift one narrow face +1mm in Y -> **5,400mm³ actual material overlap**.
- 0 source geometry changes, 0 CAD transform redesigns, 1 renderer script correction.

## Critical F2 gate
**BLOCKED:** no verified top L-node containing incoming horizontal male-finger beam, dual node backers, diaphragms and insertion trajectory. The 4-wall column alone does not prove those interfaces. DO NOT proceed to 162-part virtual assembled frame based on this partial PASS. No table GLB, structural load or manufacturing approval.

## Owner delivery
`AL017_F_WORKBENCH_V53_COLUMN_SOURCE_QA_PARTIAL_2026-11-12.zip`: exact source handoff ZIP, partial 4-body GLB+STEP, render, scripts, QA JSON. **Not committed to GitHub**, site unchanged.

**Verdict:** F1 source verified, F2 four skins only PASS; F2 node and F3 full workbench remain **BLOCKED/NOT DONE**. No merge/deploy.