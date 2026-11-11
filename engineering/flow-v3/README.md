# Flow V3 — without tabletop; engineering handoff for #33

**Owner clarification: the design has no tabletop.** A top is excluded from the BOM and is **not a missing input or acceptance blocker**. This clarification supersedes the tabletop requirement in the issue and first PR34 delivery. [Scope record](artifacts/scope.json).

**Overall assembly: still BLOCKED pending verified leg/base reference placement. DESIGN_ONLY.** The available seven V3 part classes account for all **19 required instances** of the topless design. The seven-body frame is verified; eight leg panels and four bases are exported as individual solids but remain unplaced in the accepted model. Two explicitly rejected corner interpretations now have measured interference evidence; neither is exported as an approved complete assembly. No source geometry is changed.

## Artifacts

- [Partial frame STEP](artifacts/Flow_V3_PARTIAL_FRAME_DESIGN_ONLY.step), [GLB](artifacts/Flow_V3_PARTIAL_FRAME_DESIGN_ONLY.glb).
- [Seven unique CAD parts, NOT ASSEMBLED](artifacts/Flow_V3_PART_LIBRARY_NOT_ASSEMBLED.step), [library GLB](artifacts/Flow_V3_PART_LIBRARY_NOT_ASSEMBLED.glb). The grid is a display layout, not assembly coordinates.
- [Front](artifacts/front.png), [side](artifacts/side.png), [underside](artifacts/underside.png), [poster](artifacts/poster.webp). These show the verified partial frame of the design without a tabletop.
- [Inventory](artifacts/inventory.json), [source hashes](artifacts/source-hashes.json), [transforms](artifacts/transforms.json), [frame pairs](artifacts/frame-pairs.json), [local2D checks](artifacts/local-joints.json), [rejected corner study](artifacts/corner-study.json), [STEP/GLB checks](artifacts/export-checks.json), [browser](artifacts/browser.json), [correction history](artifacts/correction-cycles.json).

## Remaining corner placement problem

The initial handoff treated absence of a top as a blocker. That conclusion is withdrawn. The clarification removes that gate, but it does not establish the leg/base transformations. To advance beyond the initial null placements, `corner_study.py` now tests two **diagnostic interpretations**, without changing source profiles:

1. Put both panels in the mating rail thickness planes, and apply the report's left horizontal offset -6mm. With raw DXF u shifted by -16mm and floor v=10mm mapped to Z0, the upper tabs clear the rails. However, the two leg panels overlap in3D. The report's sampled condition xA+xB=26mm alone does not validate this perpendicular placement.
2. Shift both panels6mm along their profile directions so that their vertical finger joint and the base can meet in the same thickness planes. This clears leg-to-leg interference but the upper tabs now collide with the rails.

The exact pair volumes and matrices' construction values are recorded in `corner-study.json`. These are **rejected candidates**, not a claim that every possible assembly is impossible. The earlier local2D PASS results remain limited to their specified offsets and cannot certify all joints at once.

**Smallest remaining input:** a dimensioned reference-corner section or authoritative assembly CAD for this **topless V3**, identifying the signed XYZ and panel-normal directions of LEG_A, LEG_B, TRI_BASE and their mating rails at a named corner, plus the other corners' orientation map. This must resolve the6mm datum conflict demonstrated by the two candidates. **No tabletop drawing, dimensions or file is requested.** Once the intended corner is established, apply its compatible transforms to all19 instances, fix verified failures coherently if required, and rerun all171 pair checks before claiming full-model PASS.

## BOM and coordinates

| V3 class | Qty | Envelope mm | Placement |
|---|---:|---|---|
| LENGTH_OUTER_L | 2 |860×70×6| Measured frame candidate, verified |
| WIDTH_OUTER_W | 2 |480×70×6| Measured frame candidate, verified |
| LENGTH_CENTER_LC | 1 |860×70×6| Measured frame candidate, verified |
| CROSS_BEAM_C | 2 |480×70×6| Measured frame candidate, verified |
| LEG_A | 4 |156×386×6| Individual solid; world placement BLOCKED |
| LEG_B | 4 |156×386×6| Individual solid; world placement BLOCKED |
| TRI_BASE_ROUNDED | 4 |21.5×21.5×6| Individual solid; world placement BLOCKED |

Tabletop quantity is **zero by owner instruction**. All available types match the required topless BOM; geometry completeness passes. Full assembly placement and collision acceptance do not yet pass.

CAD units are millimetres, X-length/Y-width/Z-up. The accepted partial frame origin is its lower southwest corner, **not floor level**. Receiving slots establish LC at Y237..243mm and C beams at X283.666667..289.666667 /570.333333..576.333333mm. Half-laps meet at Z35mm. The explicit matrices remove the10mm DXF drawing margin. These are source-measured, validated placements, not recovered owner-approved CAD assembly matrices. GLB uses metres/Y-up: `(X,Z,-Y)/1000`.

The diagnostic corner study uses floor Z0 and frame-bottom Z380mm, inferred from the source six-mm upper tabs; this floor datum has not been promoted into the accepted partial frame. No rejected candidate is silently published as the intended design.

## Source provenance

V3 sources are unchanged from site baseline `2a0fe67d742dec79421a03a9dd10076aba427aa5`. Engineering was inspected read-only at `548133b0462909e63c41d29d5bef859ce8fbc60c`. The original [history search](artifacts/source-search.json) is retained as a dated baseline search covering271 site commits/20 local refs and287 engineering commits/67 refs, all advertised branches and the site's historical tag. The prior tabletop conclusion is explicitly marked historical and superseded by owner clarification. The older Option2/REV2 ZIP is incompatible and never imported; per-member CRC results are preserved. No additional tabletop source search is needed for this design.

Headerless V3 DXFs contain modern LWPOLYLINE records, original group70=1 closure flags and CUT layers. The loader declares AC1015 **in memory**, preserving those tags rather than assuming R12. It does not edit any coordinate or manually close a profile. Slots are subtracted from the largest outline; interior rings are retained. Curves are the original sampled segments with zero bulges, without invented smoothing. Every source SHA256 is retained.

## PASS / FAIL / BLOCKED

| Gate | Status | Evidence / limit |
|---|---|---|
| Required topless part geometry/BOM | PASS |7 types/19 instances; no top required |
| Closed valid source profiles; nominal6mm | PASS |18 polylines, seven valid solids, planar area×6 equals solid volume |
| Complete19-instance placement | BLOCKED |12 leg/base transforms remain unapproved/null |
| Partial frame dimensions and STEP roundtrip | PASS |7 valid solids;860×480×70mm |
| Frame mating and collisions | PASS |12 expected contacts; all21 pairs free of volumetric interference, tolerance1e-5mm³ |
| Negative control | PASS |C shifted1mm collides with LC by210mm³ |
| Local leg geometry | PASS, limited |19 spine samples and two local left leg/rail planar fits; not full3D approval |
| Two reference-corner interpretations | FAIL, retained |Measured clashes in `corner-study.json`; no design-geometry repair or full assembly approval claimed |
| Whole19-body collisions/mating | BLOCKED |No accepted full placement;171-pair check must follow a valid placement |
| Khronos glTF2.0 | PASS |Both GLBs0 errors/0 warnings; nonblocking bufferView.target hints retained |
| Scale, finite transforms, visible surfaces | PASS, partial |7 mesh nodes per file; valid indices/finite geometry/watertight surfaces; frame0.860×0.070×0.480m in display axes |
| Browser and three views | PASS, partial |Chromium software WebGL; updated label explicitly says design without tabletop |
| Full intended-design view match | BLOCKED |Accepted model still excludes unplaced legs/bases |
| Performance | PASS |Both GLBs below3MB; exact current bytes in export-checks.json |
| Site smoke | PASS |66 cases/0 failed/0 real submissions; push hook validates outgoing commit |
| Physical fit/kerf/strength | NOT PERFORMED |Nominal zero-clearance design, no source kerf compensation |

## Correction and scope history

Two implementation correction cycles, zero source-geometry corrections: (1) preserve existing DXF tags via AC1015 reader declaration; (2) replace failing general-matrix conversion with rigid gp_Trsf/cq.Location. The first handoff is preserved in Git history. This follow-up records one owner scope clarification and two rejected reference-corner tests; it does not count the clarification as a geometry repair or convert the rejected candidates into PASS. The owner has not supplied new part geometry or corner matrices.

## Reproduce

From repository root, with the existing managed workspace dependencies:

```sh
/workspace/work/venv-cad/bin/python engineering/flow-v3/build.py
/workspace/work/venv-cad/bin/python engineering/flow-v3/corner_study.py
/workspace/work/venv-cad/bin/python engineering/flow-v3/check_exports.py
node engineering/flow-v3/validate_glb.cjs
python -m http.server 8765 --directory /workspace
# Separate terminal:
python engineering/flow-v3/browser_check.py
python scripts/check_site.py
```

For a fresh setup use `requirements.lock` in a project-local venv, Playwright with system Chromium, and `npm install --cache /workspace/work/npm-cache --prefix /workspace/work/flow-browser three@0.187.0 gltf-validator@2.0.0-dev.3.10`. The preview uses explicit workspace import paths and is a review harness, not a site integration. The history search script requires the read-only engineering checkout; rebuilding the model does not require a new history search. SHA256SUMS covers final artifacts. No merge/deployment; PM reviews the exact branch SHA independently.
