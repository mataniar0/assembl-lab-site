# P0 | AL-016-GEO — complete validated Geometric 3D assembly + GLB

Tracks #30 and Draft PR #31. **P0 — ACTIVE SOURCE / MODEL COMPLETION. This is the first priority before PR #31 viewer release.**

## Objective
Produce an independently verifiable **assembled 3D GLB** of the real Geometric coffee table at `geometric/index.html`, not an arbitrary decorative approximation and not the unrelated `CTB-01/parts/P01/variants/GEOMETRIC` leg profile.

## Engineering execution (perform as much as possible before reporting a blocker)
1. Search approved project repos and their reachable branches/history for Geometric STEP/GLB/FCStd/OBJ, parametric CAD scripts, BOM, assembly documentation, table top and leg profiles. Check the site’s product source assets, `assets/geometric-leg-drawing.svg`, photos and any dimensioned drawings.
2. Create **source-to-part traceability**: table top, leg sets, cross-members, joinery and assembly placements, with source URL/path/revision and any measured vs assumed dimension identified.
3. Where all geometry and placement is grounded, build a complete CAD assembly using a reproducible script (prefer source geometry/STEP), confirm each part and global orientation, contact/fit/collision and bounding dimensions. Iterate model/verification until computable gates PASS; count corrections. No physical load/strength approval is implied.
4. Export optimized **public display GLB** (no production-sensitive exact cut files or joinery measurements), with correct units / axes, glTF validation, front-side-underside previews and faithful comparison with site photographs. Also keep a private/source CAD representation in the engineering work product where permission allows.
5. If source geometry/placement is genuinely absent after complete research, **do not fabricate a PASS**. Deliver the largest validated intermediate assembly and a **precise owner input request** (which missing CAD file/measurement for which component), plus reproducible next step, and flag BLOCKED only for the unresolved gate.

## Evidence and acceptance
- Versioned CAD & export scripts, original source provenance/hash, list of parts and transforms, dimensions and photos comparison.
- PASS/FAIL per criterion: source completeness, 3D assembly, joint alignment, collision, scale/orientation, GLB validity and browser render.
- Explain any unverified physical fit/load, no production certification.
- Commit to a dedicated branch for #32, tests and screenshots, and open PR or send branch/SHA if GitHub API Forbidden.
- **Do not modify `main`, merge/publish, touch forms, or alter WOOD U LIKE.** Wait for manager review; integration into the shared viewer occurs only after verified geometric data is ready.

## Workflow
Recommended performer: Codex for CAD/model reconstruction; ChatGPT manager reviews drawings, mesh and tests. Work on this issue now, in parallel with #33 if agents are available.
