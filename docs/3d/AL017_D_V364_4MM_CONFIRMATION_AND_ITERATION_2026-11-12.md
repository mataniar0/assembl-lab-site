# AL-017-D — Owner 4mm material confirmation and second 31-part CAD iteration
**Date:** 2026-11-12
**Execution:** ChatGPT only; no Codex.
**Verdict:** Material resolved **4.0mm PASS**; diagnostic 31-part assembly **FAIL (16 volumetric clashes)**; source geometry unchanged; no site publication.

## Authoritative owner input
The product owner explicitly confirmed: **V3.6.4 material thickness = 4mm**. This supersedes earlier Issue text suggesting 6mm. Original native DXF includes 4.2mm openings, yielding a nominal +0.2mm slot allowance (not physical kerf tolerance approval). No other design revision was authorized.

## Independent iteration
- Original immutable source archive `V364_CUT_FILES_900x440_PRODUCTION.zip` SHA256 `f21223fbd6a3c34f90f1d6482422312685e93902347614cc2d5abe266ee5313b`. Seven family outlines; 31 source part instances, unaffected.
- Earlier placement hypothesis contained **42** positive volumetric overlaps among 465 possible pairs.
- **One new placement cycle**, exploring 4mm source-derived shelf notch pairing and level locations, reduces the number of positive volume overlaps to **16**. A broadphase screened **465** distinct pairs, exact OCC Boolean evaluated **60** candidate pairs. Residual overlap categories:
  - Rail A ↔ curved Arch: **8**
  - Rail A ↔ Top Perimeter: **4**
  - Rail B ↔ Top Perimeter: **4**
- Latest STEP reimport: **31/31 valid solids**, envelope **370×370×850mm**.
- Latest GLB reimport: **31/31 watertight meshes**, **0.370×0.850×0.370 metres**, Y-up.
- Candidate STEP SHA256 `505ac68a58ee1c13e56f9b7043a6bb36b099baa4bc9a1426e1d456b118e763c0`; GLB SHA256 `c88b8bfd235c4d63f4159387afd1a997d1db3ca9b54d0ebd83745d8158f2bf28`.
- **No native DXF profile modifications**; no geometry manufacturing revisions.
- Delivered in the user's ChatGPT conversation: `AL017_D_V364_4MM_CONFIRMED_CAD_REASSEMBLY_QA.zip` (approx 2.66 MB), containing original source ZIP, scripts, new 31-part candidate STEP/GLB, collision JSON and five genuine CAD renders, including a prominently marked NOT APPROVED contact sheet.

## Critical limitation
This is **not** evidence that 26 of the previous 42 clashes were physically corrected. It is a *different candidate placement hypothesis*, and alignment/kinematic fit of all puzzle and finger joints is not established. The 16 remaining volume clashes and unverified joint/contact graph prohibit a complete-assembly PASS. Do not attempt to massage translations solely to obtain zero volume if the source mates then disconnect. Retain source immutable.

## Next gates
1. Map the exact 3D rigid transforms of both corner L-skins, arc puzzle-neck receivers, 4 shelf supports, 10 slat end tongues, four top-perimeter joints and TP1 profile.
2. Verify original slot/tongue complementarity, contact/adjacency graph and insertion sequence, not only 465 pair Boolean volumes.
3. If the actual source geometry cannot realize all these mates without collision, produce an explicit failing fit matrix and propose an owner-reviewable **separate design revision**, without modifying V364 production originals.
4. Only after pass, integrate into website shared viewer with bilingual display, source hash, browser+CI and independent approval.

**Disposition:** Issue #41 stays OPEN; Draft PR #49 remains documentation-only. No merge/deploy/physical load approval.
