# AL-017-D / G3 — source-grounded corner and arch assembly gate
**Date:** 2026-11-12  | **Executor:** ChatGPT only (no Codex) | **Owner-confirmed plywood:** 4.0 mm.

**STATUS:** NATIVE V364 FAIL; virtual connection-change **G3 16-part collision-only PASS**, **not a production-approved or full 31-part assembly**. Parent #41 remains OPEN.

## Source constraint solution
- Source 7 classes / 31 total instances; original V364 DXF files **unchanged**.
- Exact V364 arch puzzle head spacing **290 mm**. Native vertical Rail A receiving centers coincide at **X=40,330 mm** only with corner origins symmetrically inset **8 mm** from a 370mm outer panel; corresponding symmetric inset applies to Y, for a **354×354mm** outer corner-frame envelope.
- Re-tested a 16-part G3 subassembly: 8 vertical A/B strips, 4 arches, 4 top perimeters. Correct 4mm material, 2 arches per front/back at socket centers 275/540mm, perimeters aligned at nominal 826mm puzzle center (source-local top origin Z=809mm).
- A/B edge alternation independent cross-section control: sampled **1700** height ticks, **1692** with exactly one 4mm mating tab, **0** with both tab profiles filled, and 8 without a tab in the terminal top 4mm, a pending TP1 engineering condition.
- Arch-to-A at nominated locations: **0 planar overlap**; 0.5mm positive-offset control reveals penetration (1.79 / 19.23mm² at left/right ends), proving collision test sensitivity.

## Exact original-vs-virtual CAD results
- **V364 original top-perimeter profile:** **8** positive overlap joints across **120** unique pairs; **20** exact OCC intersections after broadphase. Each upper connection intrudes approximately **60.61mm³** under 4mm plywood. All corner/arch pair clashes are eliminated by correct symmetric corner pose, but top-perimeter puzzle ends remain mechanically inconsistent.
- Minimal **virtual source-aligned profile proposal**, no original DXF edit: subtract only intersecting puzzle-head material from native Top Perimeter with nominal **0.03mm** visualization allowance. Removes **31.60294mm²** from a **11877.84801mm²** original profile (0.266%); retains a single connected solid and the center profile body region x=18.1..287.9mm unchanged. It **is not kerf-engineered and is not an authorized V365**.
- Rechecked virtual G3: **120/120 pair screens; 20 exact OCC booleans; 0 positive collisions.** Matings' mechanical load/contact insertion and glued-fit NOT proven.
- Independent STEP reimport native and proposed: **16/16 valid solids each**. GLB reimport: **16/16 watertight meshes each**, Y-up/metres, envelope **354×354×853mm**.

## Important gate beyond G3
The proposal is **NOT the full product**. When adding original TP1 in a *candidate* position with underside at Z=849mm, independently checked 17 bodies / 136 pairs and found **12 additional collisions**: 8 vertical rails/TP1, 4 top perimeters/TP1. That candidate pose is blocked; an alternate placement/connection design must be established from source rather than guessed. Shelves/supports/slats are also outside this 16-body G3 stage. **No site release or production approval**.

**Iterations this G3:** 1 corrected symmetric corner placement (prior 16 clashes → 8 in G3), 1 non-destructive virtual top-perimeter geometry proposal (G3 8 → 0). Native DXF corrections: **0**. The previous global candidates 42 and 16 overlaps are historical, distinct 31-part hypotheses.

## Owner deliverables (local ChatGPT conversation)
`AL017_D_G3_4MM_CORNER_ARCH_CONSTRAINT_QA_2026-11-12.zip`: original source archive, both 16-body STEP/GLB alternatives, actual four-view CAD renders, source-vs-virtual closeup, independent reimport/negative-control QA JSON and reproducible Python. ZIP SHA256: `9439893983389073c5f5f7fad32a448e453116253a781a603054fee644c16c60`. **Binaries are not added to the site repository**.

## Next authorized gate
G4: freeze actual TP1 insertion/fastening against inner upper frame, then full 31-part source-consistent contacts/collisions and candidate V365 scope if necessary. Any modification to production DXFs requires a separate owner Go/No-Go. No merge/deploy.
