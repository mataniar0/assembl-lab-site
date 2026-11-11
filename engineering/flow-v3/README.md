# Flow V3 — partial engineering handoff for #33

**Overall: BLOCKED / NOT COMPLETE. DESIGN_ONLY. No merge or deployment authorization.**

The supplied V3 files support seven unique part shapes (19 physical instances), but contain no tabletop profile or authoritative full 3D placement contract. This package reconstructs and validates the **seven-body frame only**, plus all seven unique solid parts as an explicitly unassembled library. It is not a complete table, a release model, or a physical fit/strength approval. Nothing is integrated into the site viewer.

## Review artifacts

- [Partial frame STEP](artifacts/Flow_V3_PARTIAL_FRAME_DESIGN_ONLY.step), [partial frame GLB](artifacts/Flow_V3_PARTIAL_FRAME_DESIGN_ONLY.glb).
- [Seven-part CAD library, NOT ASSEMBLED](artifacts/Flow_V3_PART_LIBRARY_NOT_ASSEMBLED.step), [library GLB](artifacts/Flow_V3_PART_LIBRARY_NOT_ASSEMBLED.glb). Grid coordinates are display layout, not assembly placements.
- [Front](artifacts/front.png), [side](artifacts/side.png), [underside](artifacts/underside.png), [poster](artifacts/poster.webp). These show the partial frame only.
- [Source hashes and measured geometry](artifacts/inventory.json), [full history search](artifacts/source-search.json), [transforms and unplaced groups](artifacts/transforms.json), [21 pair checks](artifacts/frame-pairs.json), [local joint checks](artifacts/local-joints.json), [validation](artifacts/validation.json), [browser](artifacts/browser.json).

## Source recovery and revision boundary

Site baseline: `2a0fe67d742dec79421a03a9dd10076aba427aa5`. Engineering read-only baseline: `548133b0462909e63c41d29d5bef859ce8fbc60c`. Fetched all advertised branches and the site's historical baseline tag. Search evidence covers **271 reachable site commits / 20 local refs**, **287 engineering commits / 67 refs**, and every historical Flow-named Git object. Engineering has no Flow-designated historical path. The site's previous AL-016 audit in `origin/feature/al-016-coffee-table-3d:docs/3d/AL-016_SOURCE_AUDIT.md` also records missing V3 top and placements. Existing `flowgen/verification_V3.json`, Hebrew verification report and README establish local joint intent, quantities and nominal 6 mm thickness, not a full assembly.

The only recovered top is `TOP_PLATE_860x480_t6_option2_smooth_top_tri_base_rev2.dxf` in the **Option 2 / TRI_BASE REV2** ZIP. That revision explicitly uses 34×34 mm bases with 12×6 mm tabs and different rails; V3 uses 21.5×21.5 mm rounded bases with 6×6 mm tabs. REV2 cannot establish the V3 tabletop shape. Both historical archive blobs were examined: one is not a ZIP, the later archive contains a CRC-invalid WIDTH_OUTER entry. Per-member CRC results are retained in `source-search.json`. No legacy member is imported by the build. Unreachable/deleted refs, expired remote workflow artifacts and owner-local CAD are not available through this search; absence here is not proof that the owner has no additional source.

## BOM and coordinate contract

| V3 part | Quantity | Envelope mm | 3D placement |
|---|---:|---|---|
| LENGTH_OUTER_L | 2 | 860×70×6 | Measured frame candidate |
| WIDTH_OUTER_W | 2 | 480×70×6 | Measured frame candidate |
| LENGTH_CENTER_LC | 1 | 860×70×6 | Measured frame candidate |
| CROSS_BEAM_C | 2 | 480×70×6 | Measured frame candidate |
| LEG_A | 4 | 156×386×6 | BLOCKED; individual solid exported |
| LEG_B | 4 | 156×386×6 | BLOCKED; individual solid exported |
| TRI_BASE_ROUNDED | 4 | 21.5×21.5×6 | BLOCKED; individual solid exported |
| Tabletop | 1 required | UNKNOWN in V3 | BLOCKED; no solid invented |

All DXF positions and thicknesses are millimetres. The raw modern LWPOLYLINE records have group 70=1 (closed) and CUT layers, but no HEADER/ACADVER. The reader supplies an **in-memory AC1015 header** to preserve those existing flags rather than letting ezdxf assume R12. No coordinates, closure segments, thicknesses, arcs or source DXFs are changed. Boundary-touching slot rectangles are subtracted from the largest closed outer loop, with enclosed loops becoming holes. The source curves are sampled straight segments with zero bulges; no spline smoothing is introduced.

Frame CAD uses right-handed X-length / Y-width / Z-up with (0,0,0) at the frame's lower southwest corner. **This is not floor level.** The 10 mm DXF drafting margin is removed by explicit transforms. Outer frame thickness planes are Y=0..6 /474..480 and X=0..6 /854..860. LC is at Y=237..243, measured from WIDTH slots. Cross beams occupy X=283.666667..289.666667 and 570.333333..576.333333, measured from LENGTH slots (not rounded report numbers). The half-laps meet at Z=35. These are derived rigid placements validated against V3 geometry, not recovered owner-approved assembly matrices. `transforms.json` records every matrix, reference frame and evidence. GLB uses metres and right-handed Y-up: `(X,Z,-Y)/1000`.

## PASS / FAIL / BLOCKED gates

| Criterion | Result | Evidence / limit |
|---|---|---|
| Seven source profiles closed, valid, nominal6 mm | PASS | 18 polylines; original flags preserved; seven valid one-solid STEP exports; volume = planar area ×6; seven watertight meshes |
| Available part count and hashes | PASS | Seven types /19 instances; inventory includes SHA256 per source |
| Complete table parts | FAIL — BLOCKED | V3 tabletop source absent |
| Complete floor-relative placements | FAIL — BLOCKED | Eight leg and four base transforms absent; no invented full assembly |
| Frame dimensional consistency | PASS | STEP roundtrip valid; 7 solids; 860×480×70 mm |
| Frame mating | PASS | All12 expected contacts, no unexpected contacts: four corners, six beam ends, two half-laps |
| Frame collision | PASS | All21 pairs; common volume <1e-5 mm³; contact tolerance1e-7 mm |
| Collision test sensitivity | PASS | C_1 deliberately shifted1 mm intersects LC by210 mm³; test rejects it |
| Local leg finger complement | PASS, limited |19 samples; xA+xB=26 mm in raw DXF coordinates; local2D evidence only |
| Local left LEG_A to L/W rail | PASS, limited | Measured offsets(-6,-380) mm; zero planar overlap and zero separation; no global placement claim |
| All legs / tri-bases / top mating and collisions | BLOCKED | Existing report claims retained as inherited evidence, not newly verified full3D |
| GLB2.0 validity | PASS | Both GLBs: Khronos validator0 errors /0 warnings; frame15 and library14 nonblocking missing bufferView.target hints |
| Scale / finite geometry / visible surfaces | PASS, partial | CAD mm→GLB m; frame bounds0.860×0.070×0.480 m in display axes;7 visible mesh instances, valid indices and finite vertices |
| Performance | PASS | Frame51,636 bytes; library104,464 bytes; each below3 MB |
| Three browser viewpoints | PASS, partial | Chromium software WebGL; front/side/underside saved and inspected |
| Full intended-table viewpoint match | BLOCKED | No complete same-revision reference; screenshots do not certify a full Flow table |
| Site checks | PASS |66 PASS /0 FAIL /0 real submissions; no site product files changed |
| Physical fit / kerf / load strength | NOT PERFORMED | Nominal zero-clearance digital design only; source has no kerf compensation |

## Correction cycles

**Two implementation correction cycles; zero design-geometry corrections.**

1. Initial import asserted closed profiles and failed because ezdxf interpreted headerless modern entities as R12 and discarded closure flags. Inspected raw group70=1 and fixed the reader with an in-memory AC1015 header. No polyline was manually closed or edited.
2. First rigid CAD transform attempt failed with `gp_GTrsf::Trsf() - non-orthogonal GTrsf` from CadQuery's general matrix conversion. Replaced it with `gp_Trsf.SetValues` / `cq.Location` rigid transforms. The intended orthogonal matrices and source geometry were unchanged. Subsequent collision and roundtrip checks pass.

A rounded slot coordinate was replaced by the six-decimal source value before collision testing. Tooling setup initially hit an unwritable default npm cache; retry used `/workspace/work/npm-cache`. This is not counted as a geometry correction. No computational geometry failure is hidden or converted into an all-table PASS.

## Smallest owner input to unblock

Provide either **one authoritative complete Flow V3 assembly CAD**, including top and placements, or both:

1. **Full-size V3 tabletop DXF/STEP**: exact closed perimeter, every perimeter finger/notch, thickness, underside datum, and explicit revision compatibility with these seven hashed V3 parts. A rectangle dimension or REV2 top is insufficient.
2. **Dimensioned V3 assembly datum/one-corner section plus corner map**: floor-to-frame-bottom height; signed XYZ and panel-normal directions for LEG_A, LEG_B and rounded TRI_BASE at a named corner; how that corner is oriented at the other three corners; tabletop's XYZ datum relative to frame. The local report's ±X offsets alone do not define the perpendicular panel's thickness side, floor Z, tri-base rotation or mirroring.

Once supplied, insert those source-backed transforms and top, run all pair/interference and joint checks over the complete BOM, export the full candidate, and replace the blocked gates only after evidence passes. Issue #33 remains open for PM review.

## Reproduce

From the repository root, in the managed workspace:

```sh
python -m venv /workspace/work/venv-cad
/workspace/work/venv-cad/bin/pip install -r engineering/flow-v3/requirements.lock
/workspace/work/venv-cad/bin/python engineering/flow-v3/build.py
/workspace/work/venv-cad/bin/python engineering/flow-v3/audit_sources.py /workspace/work/engineering
npm install --cache /workspace/work/npm-cache --prefix /workspace/work/flow-browser three@0.187.0 gltf-validator@2.0.0-dev.3.10
node engineering/flow-v3/validate_glb.cjs
/workspace/work/venv-cad/bin/python engineering/flow-v3/check_exports.py
python -m http.server 8765 --directory /workspace
# In a second terminal, with Playwright installed and system Chromium:
python engineering/flow-v3/browser_check.py
python scripts/check_site.py
```

The browser harness is a review tool with explicit workspace import paths; it is not a site integration or deployment. `build.py` always rebuilds from V3, never from the display library or legacy ZIP. SHA manifest covers all final artifacts. PM should independently review the exact branch commit and treat full-model acceptance as HOLD.
