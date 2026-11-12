# AL-017-F — V5.4 proposed 15-part FL L-node: independent source and CAD follow-up
**Date:** 2026-11-12. **Status:** LOCAL NODE CAD PASS; **full 162-part frame STILL BLOCKED**. ChatGPT-only, DESIGN_ONLY.

## Newly recovered source from owner's Library
`WB_V5_4_MINIMAL_INDEPENDENT_QA_HANDOFF.zip`, with original V5.3 nested DXF, candidate V5.4 slot-rotation DXF, correct 15-part FL L-node STEP and prior 14-step insertion scripts. This candidate was **existing in Library**, not newly invented in this task. All native source files preserved.

## New independent checks
- Original nested V5.3 vs V5.4 proposed: all **662 CUT outlines valid**, exactly **80 receiver holes rotated 90°** in **20 column skin files**, hole centers unchanged and every hole area preserved; **582 other CUT contours unmodified**. Original hole: **20.2mm vertical × 6.15mm horizontal**, candidate: **6.15mm vertical × 20.2mm horizontal**.
- Candidate DXF SHA256 `c0896b929a62ef2e04f06732fadf1201a24e480ba58bc1730442eae973b5b30e`.
- Re-imported existing source-derived **15-body L-node STEP**: **15/15 valid solids**; exact clash testing: **105/105 unique pair broadphase**, **25 OCC 3D Booleans**, **0 positive intersections**. Original uncorrected local assembly returns **16 overlaps** of **498.6mm³ each**, verifying the root problem.
- Discrete insertion checks independently sampled at **21 poses per each of 14 source-described stages** (not a continuous sweep): **2,205** moving-static pair screens, **49 OCC Boolean candidate intersections**, **0 sampled collisions**.
- **QA caveat discovered:** previous archived `WB_V5_3_LNODE_path_checks.json` stored mutable list references for static-member inventories, so early steps falsely list members not yet installed. Independent checker reconstructs the intended sequence of installed members from the original procedure rather than using this stale JSON; the resulting 14/14 sampled paths pass. This is a QA metadata bug, not a source-cut change. Continuous swept path certification still needs separate independent evidence.
- Exported new **15/15 watertight named GLB** from the reimported STEP (metres/Y-up); 4 true VTK CAD angles. STEP SHA256 `dcf49fd956258dac50a6d047beb954845cfa37be92a7cfb356963f103eff1bea`, GLB SHA256 `b0fb517c064ac57792f14b7b40d708dfa34706c0e2e3172b728a5ba283ea327f`.

## Scope limits
The 15-part proof concerns ONLY the FL corner L-node and a partial incoming horizontal module; **147 other source bodies not assembled**. Other node families (T, cross/rear, diagonal intersections), all 162-body 3D, real structural load, assembly of whole beam, kerf/adhesive and original user's physical proof remain OPEN. V5.4 slot rotation is **not a manufacturing-authorized revision**. No website binary commit, merge or deploy.

## Owner delivery
`AL017_F_WORKBENCH_V54_15PART_LNODE_INDEPENDENT_QA_2026-11-12.zip` contains source handoff archive, 15-part STEP and GLB, true renderings, independent 2D / 3D / sampled-motion QA JSON, scripts, README. ZIP SHA256 `689e15454a3754e21081bb04d40bbbeddbbe626ef624e0d11b35fbef6ee8efec`.

**Gate:** local V5.4 candidate final CAD and sampled insertions PASS; independent continuous path and 162-body frame still BLOCKED. Original V5.3 unchanged.
