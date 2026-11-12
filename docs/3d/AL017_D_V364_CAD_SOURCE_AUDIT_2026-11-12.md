# AL-017-D — V3.6.4 source-to-CAD independent QA (2026-11-12)

**Executor:** ChatGPT only. **Verdict:** 7/7 native source part profiles PASS; 31-body diagnostic STEP/GLB export PASS; **31-part assembled model FAIL** (42 confirmed overlaps in the hypothesized placements). **DO NOT PUBLISH OR MANUFACTURE** from this diagnostic.

## Immutable source and provenance
- Original user-owned file: `V364_CUT_FILES_900x440_PRODUCTION.zip`, SHA256 `f21223fbd6a3c34f90f1d6482422312685e93902347614cc2d5abe266ee5313b`.
- Three 900×440 DXF cut sheets with 10,912 + 436 + 6,012 = **17,360 CUT segments**, plus source master 17,360 segments. Exact unordered **segment multiset equality** (after the master sheet origins 0/920/1840mm are accounted for) proved **0 missing, 0 extra**. Each sheet has 4 non-cut SHEET_GUIDE lines; master has 12.
- 7 unique profiles, 31 expected members: Rail A 4, Rail B 4, TP1 1, shelf slats 10, LS shelf supports 4, top perimeters 4, decorative arches 4. Source geometry not altered. Only <=0.01mm display tessellation simplification, no kerf compensation.

## Corrective engineering evidence
**Material gauge conflict:** source edge finger depth **4.0 mm** and a slot height **4.2 mm** are consistent with nominal 4mm material (+0.2mm clearance); they are inconsistent with a nominal **6mm part through that slot** (−1.8mm clearance). Previous issue description assumed 6mm; do not treat that as independently verified source thickness. Source README does NOT explicitly specify plywood thickness. Material choice remains a gate.

A first full 31-part **placement hypothesis** was constructed from actual part outlines and photographs, with 4mm nominal extrusion. CAD imports are individually valid: **31/31 STEP solids valid; 31/31 GLB meshes watertight**, Y-up/metres, approximate candidate envelope 370×370×853mm. The pose is *not source-approved*.

AABB broadphase screened all **465** unique pairs; 405 excluded, **60 OCC Boolean intersections** ran (0 errors), **42 material overlap pairs** detected:
- Shelf Support ↔ Shelf Slat: **20**
- Rail ↔ Top Perimeter: **8**
- Rail ↔ Arch: **4**
- Rail ↔ Shelf Support: **4**
- Rail ↔ Top Plate: **4**
- Top Perimeter ↔ Top Plate: **2**

The overlaps demonstrate this **hypothesized pose is NOT a validated assembly**; they do not by themselves prove the immutable original DXFs irreparably inconsistent. Do not present the diagnostic viewer as the real product. Some locations/mates inferred from source are underdetermined without an approved assembly transform/dimension.

## Deliverables prepared locally for the owner (not in GitHub)
- `AL017_D_V364_31_PART_DIAGNOSTIC_CAD_QA_2026-11-12.zip` (~2.8MB): immutable original DXF ZIP, 31-body **failed diagnostic** STEP and GLB, 5 CAD renders, 4-view contact sheet with warning, independent QA JSON and Hebrew QA report, original profile map and reproducibility scripts.
- Diagnostic STEP SHA256 `d775aee7ecbfc06e26a62b5c11cd1d18459af6dbd366b7dc22f39abe1d4af0c0`
- Diagnostic GLB SHA256 `5bce34d86b3728b7bc2567f5c2f6f73636500548a683d9ae82fa3061b7439a46`
- No CAD binaries committed, no website 3D CTA activated, no merge/deploy or load-bearing/manufacturing approval.

## Next source/engineering gates
1. Confirm source V364 plywood thickness (4 vs 6mm) against approved cut/sample/engineering spec; do not substitute a default project thickness.
2. Resolve each candidate transform using exact arc mating, L-corner connections, slat end keyhole engagement, top perimeter fingers and top plate pockets; reproduce assembly sequence. Preserve old V364 production DXFs until a separately approved change request.
3. Compute 465 unique pair collision and contact graph gates; report fixes and iterations honestly; re-export final 31-body STEP+GLB and 3 independent true CAD views only after 0 unexplained clashes.
4. Integrate only model PASS into shared site viewer after PR #31 acceptance, with independent website QA, CI, owner approval.

**Fix cycles this turn:** 1 initial placement attempt; **0 source geometry modifications**, **0 unsupported position tweaks**; 42 failures reported rather than hidden. No Codex. **Issue #41 stays OPEN.**
