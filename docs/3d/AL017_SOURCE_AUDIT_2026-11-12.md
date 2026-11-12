# AL-017 — Source audit and engineering gates (2026-11-12)

**Scope:** remaining ASSEMBL LAB product 3D previews under #37. This document records CAD/source QA only. None of the new assets has been uploaded to GitHub or published on GitHub Pages. Product image galleries and inquiry forms are untouched.

| Issue | Product | Source audit and local CAD assets | Remaining release gate |
|---|---|---|---|
| #38 | Etrog C12 | 102-solid STEP and normalized closed/open GLB; 102/102 welded watertight meshes | **FAIL** 6 exact intersecting pairs in moving lid P07/P08/P09/P10, some up to 693 mm³; site version match not proven |
| #39 | Megillah MEB028 | 20/20 valid 4mm **flat source parts** STEP+GLB, 194 experimental kerf lines not modeled as true slits | **BLOCKED** full 20-piece body/lid/rectangular-hinge assembly, physical bending |
| #40 | Shoe Rack V4-700 | 36-part source-based CAD; 630 nominal pair tests from existing #40 report | **BLOCKED** page shows 800mm, source V4 700mm; owner version/as-built confirmation |
| #41 | Driller V364 | Source zip `V364_CUT_FILES_900x440_PRODUCTION.zip` yields 7 valid unique cut-part meshes, 31 total BOM instances | **BLOCKED** 31-piece assembled CAD transforms; part atlas is not full stand |
| #42 | Kids shelf 700 | 3/3 valid flat source CAD parts; candidate separate L/R 220×146mm brackets identified | **BLOCKED** version-matched brackets and assembly/mounting positions |
| #43 | Workbench V5.3 | Independent DXF audit: 162 BOM, 662 valid cut loops, 162 outer/500 inner, 17 sheets, source SHA `3319c2ca4b20a411eb942a163bdc2c6d6a8891fa0bbfffc4d0dd8959d7b7dc45` | **BLOCKED** G2a true 3D L-node and G2b 162-part assembly, unverified physical strength |
| #44 | Modular crib V0.6.7 | 33-body STEP base cassette converted to watertight partial GLB | **BLOCKED** four-sided assembly and safety/use; source is explicitly `NO_INFANT_USE` |
| #45 | Shared model QA | Local 9-entry status catalog, 8 GLBs, exact hashes/posters and negative-control verifier PASS | **BLOCKED** files not committed to repo, shared viewer #31 still DRAFT, cloud CI/browser test not run on new assets |
| #46 | Plant stand Ø230 | Independent STEP 22 solids, **231/231** pairwise check, zero volumetric clashes; watertight 22-mesh GLB | **HOLD** not an existing product page; nominal CAD only, physical load/stability unverified, separate owner GO for new page |

## Important independent finding
The original Etrog C12 report's sampled-motion clearance does NOT establish all-part nonintersection. This source audit found six clashes **between moving parts**. They must be resolved in the source design before claiming an assembled GLB PASS.

## Delivery scope and limitations
The actual new GLBs, source STEP/DXF archives, posters, verifier, negative test and detailed reports are preserved in the user's same-conversation local artifacts `AL017_REMAINING_MODELS_QA.zip` and `AL017_REMAINING_CAD_SOURCE_AUDIT.zip`. **These binaries are not in this GitHub branch.**

The site remains unchanged. Do not merge this audit as a model rollout or activate any blocked product viewer. Only true product-version-matched, fully sourced assembled CAD candidates can proceed to individually reviewed Draft PRs. No CAD-only result is a physical load/kerf/manufacturing or infant-safety approval.

All 3D preview models are in metres, Y-up. **Status:** eight local GLBs inspected, zero new products authorised for publication. Other than the previously completed #40, this audit created no final production or webpage model deployments.
