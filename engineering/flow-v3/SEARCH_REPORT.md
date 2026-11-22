# Flow V3 — systematic source-constrained assembly search

**Result: UNSAT within the source-contact contract below; full19-part assembly remains BLOCKED.** Flow has **no tabletop**. No DXF was changed, no V2 geometry was imported, no design change was authorized or performed. This report supersedes the earlier two-candidate study as the current search evidence; the earlier failures remain in Git and `artifacts/corner-study.json`.

## Reproducible evidence and deliverables

- [Machine-readable summary](artifacts/search/summary.json), [formal constraint certificate](artifacts/search/unsat-certificate.json), [source features/hashes](artifacts/search/features.json).
- [Every upper-interface candidate, matrices and face corners](artifacts/search/upper-pose-enumeration.json); [every corner pair, OCCT volumes and residuals](artifacts/search/corner-enumeration.json); [every base orientation/correspondence and matrix](artifacts/search/base-enumeration.json).
- [Independent certificate replay, positive/negative controls and32 frame configurations](artifacts/search/replay-checks.json).
- [Verified partial-frame STEP](artifacts/Flow_V3_PARTIAL_FRAME_DESIGN_ONLY.step) and [GLB](artifacts/Flow_V3_PARTIAL_FRAME_DESIGN_ONLY.glb), [front](artifacts/front.png), [side](artifacts/side.png), [underside](artifacts/underside.png).
- Clearly **REJECTED five-body diagnostic**: [STEP](artifacts/search/REJECTED_SW_CORNER_DESIGN_ONLY.step), [GLB](artifacts/search/REJECTED_SW_CORNER_DESIGN_ONLY.glb), [front](artifacts/search/rejected-front.png), [side](artifacts/search/rejected-side.png), [underside](artifacts/search/rejected-underside.png), [ten pair checks and source transforms](artifacts/search/witness.json). This is two rails, A/B and one base at a failed reference corner, **not a complete table**.
- [Dimensioned constraint plan PNG](artifacts/search/constraint-plan.png) / [SVG](artifacts/search/constraint-plan.svg). The graphic shows actual source receiver/tongue footprints, not replacement geometry.

## Source contract and completeness boundary

The frozen seven V3 DXFs describe19 required instances: L×2, W×2, LC×1, C×2, A×4, B×4, rounded base×4. The SHA256 of every DXF is asserted before reconstruction. Profiles retain their source vertices,18 original closed polylines, source holes and nominal6mm extrusion. Headerless modern DXF records are read with the previously documented in-memory AC1015 declaration. No smoothing, kerf, outline correction or hidden scale is applied.

The following is the intended interface contract in the supplied V3 verification report, now tested together rather than as unrelated local2D assertions:

1. Each leg's four20mm-wide,6mm-deep upper tenons fully engage one matching four-notch rail group. The panel and receiving rail occupy the same nominal6mm thickness slab. Each of the four tab prisms is720mm³; its three intended mating faces total192mm² (768mm² across four). Source polygons explicitly confirm full tab material and empty receiver interiors. Full face alignment is tested using edges, thickness faces and exact XYZ corners, not only a zero solid distance.
2. A and B at a corner connect adjacent length/width rails. Their original lower6×6mm cutouts receive the two base tongues. All feet share floor Z0; the rounded base lies horizontally with its lower face at that floor.
3. The seven-body frame remains a level assembly with its source beam-end/corner joints:860×480×70mm. Global translation/rotation is a coordinate gauge. Outer-rail thickness positions follow the860mm LC and480mm C ends and six-mm receiving material; they are not freely shifted to conceal a corner failure.

This certificate applies to that contract. It is not an assertion that no arrangement of loose parts, partial-depth engagement, altered interface topology or redesigned geometry could exist. A reference drawing could establish a different intended interface contract; it must explain the measured source conflict.

## Deterministic enumeration

**No continuous translation grid is used to decide feasibility.** Full engagement of the source faces fixes the translations analytically; additional ±6mm placements are diagnostic signed-datum tests.

- Enumerate all24 proper orthogonal rotations; [768 explicit orientation-filter records](artifacts/search/orientation-audit.json) retain the accepted and rejected axes. Floor position and the four collinear upper tenons restrict a viable panel to local v along +Z and local u along ±the rail direction. Downward, horizontal or oblique placements cannot preserve both the floor cutout and all four parallel rectangular tab/slot face matches.
- Include sheet-face inversion and mirrored handedness. Each of the24 improper signed representations has an identical **proper rigid** prism pose after local t→6−t, because these are uniform6mm through-cut parts. The exported matrices all have determinant+1. Both face representations are canonicalized; no outline reflection is silently substituted for a source part.
- Independently turn each of four outer rails end-for-end **and vertically**:256 rail U/V combinations. A level frame with all feet on the same floor reduces these to32 height-consistent combinations. A downward-facing source receiver fixes frame bottom at Z380mm; an upward receiver fixes it at Z316mm. Mixed vertical rail flips demand both heights at once and are rejected with a64mm residual. Both uniform-height alternatives are tested, not assumed away.
- Examine all70 four-notch subsets per rail class. Exactly two groups reproduce the source four-tab spacing35mm. For each group, independently solve A/B translations and both u directions; swap A/B rail assignments. Test ±6mm u and normal offsets and both panel-face representations.
- This gives **2,304 face representations /1,152 leg–rail interface candidates** (576 distinct world leg poses; vertical rail states change the target rail, not the leg pose), of which **128 align all upper faces**. Only64 of those also avoid interference with their own rail; inverted-rail receivers fail the body-clearance check despite tab-face coincidence. Geometrically equivalent volumes are cached by the exact source-pair relative rigid transform; cache sizes are reported.
- Combine independently solved panels at **all four corners** and all local U/V rail orientations: **512 corner/rail-state combinations (128 distinct A/B world-pose pairs)**. For each, use all eight D4 base orientations, both tongue-to-slot correspondences, and the translation that makes the first tongue/slot exact: **8,192 base tests (2,048 after deduplicating repeated vertical rail states)**. A zero-residual solution must appear in this enumeration because it must satisfy that first equality. Each base matrix is independently derived, not copied from a panel shift.
- Also solve the continuous translation minimax problem for every base orientation/correspondence. This checks the best balanced near-miss without accepting it.

The face tolerance is1e-6mm; the collision tolerance is1e-5mm³. No numerical near-miss is labelled a valid joint.

## Results and independent contradiction

| Criterion | PASS/FAIL | Measured result |
|---|---|---|
| Frozen source hashes, unchanged DXFs/BOM | PASS |7 unique shapes /19 required instances; no tabletop |
| Upper tenon full material / empty receivers | PASS |4 rectangular tenons and4 matching notch faces per candidate |
| Enumerated upper-face matches | PASS, limited |128 surface-aligned candidates;64 also clear own rail |
| Corner A/B interlock and clearance | FAIL |All512 pairs have positive overlap; minimum0.245243391mm³, well above1e-5mm³ |
| Two base tongues simultaneously mate both floor slots | FAIL |0 of8,192; best anchored coordinate residual6mm |
| Best continuous base translation | FAIL |Minimum maximum coordinate error3mm; this is not rounding tolerance |
| Rigid-distance invariant | FAIL |Smallest centre-distance mismatch8.485281374mm; independent of base translation, yaw, mirror or OCCT |
| Frame U/V alternatives | PASS, frame only |32 height-consistent7-body configurations,672 frame-pair checks;12 expected contacts each |
| Full19-body assembly /171 pairs | BLOCKED / NOT RUN |No corner passes; a failed or loose19-body layout is not a validated assembly |
| Partial and diagnostic STEP/GLB serialization/render | PASS, serialization only |Separate export/browser JSON; diagnostic assembly acceptance remains FAIL |
| Physical fit, kerf, strength | NOT PERFORMED |No physical approval claimed |

The base has source tongue centres **(9,−3)** and **(−3,9)**mm. Its centre difference is **(−12,+12)**mm and its rigid distance is **12√2=16.970562748mm**. Every fully upper-aligned corner has a required floor-slot-centre distance in the finite set recorded in the certificate; the closest is **6√2=8.485281374mm**, not12√2. The minimal distance mismatch is therefore8.485281374mm. This alone makes simultaneous full engagement impossible within the contract, even if one ignored all A/B clashes and permitted arbitrary base yaw.

For the unflipped SW example, both upper matches independently require raw-u translation−16mm. The panel thickness slabs are Y0..6 and X0..6; floor v10 maps to Z0. The lower-slot centres become **(9,3)** and **(3,9)**mm. Translating the base by(0,+6) engages the first tongue exactly but leaves the second displaced by(−6,+6)mm. The best balanced translation(3,3) still misses both centres by3mm in each coordinate. A↔B overlap is13,680mm³. These values are not inferred from screenshots.

Other source-compatible upper orientations, receiver-group reversals, independent A/B assignments and rail flips were tested; none supplies the base's fixed centre separation. The certificate's unsatisfied core is **four full upper engagements + original floor-slot positions + two rigid base tongues + adjacent-rail corner topology**. The collision result provides an additional independent rejection, rather than being the sole evidence.

## Independent replay and controls

`verify_search.py` reads serialized outputs, independently recomputes every required centre distance, verifies hashes and rigid matrices, and confirms candidate counts. An isolated known-valid base placement, translated(+6,+6)mm, yields a0mm residual; the tab-aligned SW slot pair is rejected at6mm. Thus the search does not simply reject every base target. It also reconstructs all32 height-consistent frames from individual STEP solids, checking672 pairs and expected contacts with OCCT. Source-hash and invariant replay PASS means the **failed-assembly certificate is reproducible**, not that the assembly passes.

## Minimal owner input and design-change boundary

The smallest useful new input is **one named-corner plan and vertical section**, or native assembly CAD of the original revision, showing:

- Which four-notch rail group receives each A/B upper-tab set, and whether the intended engagement is the full coplanar6mm joint stated in the source report.
- Signed A/B material-thickness faces and both lower6×6 receiver-centre coordinates in the same L/W rail frame.
- Which base tongue mates which lower cutout, their required12mm X/Y centre difference, the floor/frame datum, and how the reference corner is oriented at the other corners.

The drawing must identify which constraint differs from this contract; a generic instruction to try another6mm offset cannot resolve the rigid centre-distance mismatch. If the drawing confirms the same interfaces, an **explicit PM-approved coherent design revision** is needed. Original DXFs remain frozen until that approval. No tabletop source is needed or requested.

## Correction cycles and reproducibility

Cumulative implementation correction cycles: **4** (the earlier DXF-version loader and rigid CAD transform fixes, plus NumPy-boolean JSON serialization and diagnostic visualization corrections in this stage). Source-geometry corrections: **0**.512 rejected corner candidates are tests, not512 repair cycles. The failed serialization log is retained; its repair changes serialization only. A stale preview-server process returned an empty HTTP response and was restarted; this is a runtime issue, not a CAD correction.

Run from repository root using the existing pinned dependencies and workspace preview server:

```sh
/workspace/work/venv-cad/bin/python engineering/flow-v3/search_assembly.py
/workspace/work/venv-cad/bin/python engineering/flow-v3/verify_search.py
/workspace/work/venv-cad/bin/python engineering/flow-v3/export_search_witness.py
/workspace/work/venv-cad/bin/python engineering/flow-v3/make_search_certificate.py
node engineering/flow-v3/validate_glb.cjs
/workspace/work/venv-cad/bin/python engineering/flow-v3/check_exports.py
python -m http.server 8765 --directory /workspace
# In another terminal:
python engineering/flow-v3/browser_check.py
python scripts/check_site.py
```

The original `build.py` regenerates the source-preserving partial frame and individual parts if needed. `requirements.lock` pins Python CAD dependencies; the workspace Three/gltf-validator setup is unchanged. All artifacts, including recursive search evidence, are hashed in SHA256SUMS. The branch remains review-only; no merge or deployment.
