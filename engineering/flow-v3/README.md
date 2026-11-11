# Flow V3 — no tabletop; source-constrained CAD search for #33

**Current result: full assembly BLOCKED by incompatible source-contact constraints.** Seven V3 classes supply all19 required instances. No tabletop is included or requested. Source DXFs remain unchanged.

The requested systematic search is now complete within the explicit full-face joint contract: **1,152 leg–rail candidates,512 corner/rail-state combinations (128 distinct A/B pose pairs) and8,192 base orientation/correspondence tests**. It includes panel handedness, signed6mm offsets, independent translations, both A/B assignments, all four corners, outer-rail U/V flips and continuous translation residual bounds. No reference corner passes; no failed19-body layout is presented as complete.

Read the [full search report, coverage boundary, PASS/FAIL and minimal drawing request](SEARCH_REPORT.md) and the [machine-readable unsatisfied-constraint certificate](artifacts/search/unsat-certificate.json). [Hebrew PM handoff](HANDOFF_HE.md).

| Deliverable | Scope |
|---|---|
| [Frame STEP](artifacts/Flow_V3_PARTIAL_FRAME_DESIGN_ONLY.step), [GLB](artifacts/Flow_V3_PARTIAL_FRAME_DESIGN_ONLY.glb) | Verified7-body partial frame, DESIGN_ONLY |
| [Frame front](artifacts/front.png), [side](artifacts/side.png), [underside](artifacts/underside.png) | Partial frame only |
| [Seven unique parts STEP](artifacts/Flow_V3_PART_LIBRARY_NOT_ASSEMBLED.step), [GLB](artifacts/Flow_V3_PART_LIBRARY_NOT_ASSEMBLED.glb) | Unassembled display grid, not assembly transforms |
| [Rejected corner STEP](artifacts/search/REJECTED_SW_CORNER_DESIGN_ONLY.step), [GLB](artifacts/search/REJECTED_SW_CORNER_DESIGN_ONLY.glb) | Five-body failure witness, explicitly FAIL |
| [Rejected front](artifacts/search/rejected-front.png), [side](artifacts/search/rejected-side.png), [underside](artifacts/search/rejected-underside.png) | Diagnostic only, not a completed table |
| [Constraint plan](artifacts/search/constraint-plan.svg) | Source6×6 tongue/receiver footprints and centre-distance conflict |
| [Search summary](artifacts/search/summary.json), [replay](artifacts/search/replay-checks.json) | Reproducible enumeration and32 seven-body frame orientations /672 pair checks |

The rigid base tongue-centre distance is12√2mm. The closest source-upper-aligned floor-slot-centre distance is6√2mm, leaving8.485281374mm distance mismatch. Even the best balanced base translation leaves3mm coordinate error, versus1e-6mm tolerance. All512 A/B pairs also overlap; smallest overlap0.245243391mm³ exceeds the1e-5mm³ threshold. These results apply to the report's stated joint topology; they do not claim that every conceivable altered interface arrangement fails.

The minimal next input is one dimensioned named-corner plan/section identifying the intended A/B thickness faces, four-tab rail mapping, lower receiver centres and base tongue mapping in the same datum, plus the other corners' orientation map. It must resolve or explicitly revise the conflicting interface contract. Original DXF edits require PM design-change approval.

BOM: L×2, W×2, LC×1, C×2, LEG_A×4, LEG_B×4, rounded base×4. CAD uses mm, X-length/Y-width/Z-up. Accepted partial-frame origin is its lower SW corner, not floor level; GLB is metres/Y-up `(X,Z,-Y)/1000`. Diagnostic corner floor is Z0. [Source hashes](artifacts/source-hashes.json), [part inventory](artifacts/inventory.json), [frame transforms](artifacts/transforms.json), [scope](artifacts/scope.json), [historical source search](artifacts/source-search.json). The older REV2 archive is not imported.

Cumulative implementation correction cycles: **4**, source-geometry changes: **0**. Full19-body mating,171-pair scan and completed-design rendering remain **NOT RUN / BLOCKED** because no corner is feasible under the tested source constraints. Site smoke is a separate software check. No physical fit, kerf or strength approval. Branch `feature/33-flow-v3-cad`, Draft PR #34; exact SHA is in the PM handoff comment. No merge/deploy.
