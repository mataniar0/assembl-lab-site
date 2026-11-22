# Flow V3.1 — two engineering candidates, Issue #36

**Subsequent owner-requested refinement:** [R_ROUNDED_SHOULDERS](ROUNDING.md) adds a separate rounded shoulder version of R. The original two-option comparison and artifacts below remain preserved. Prefer the rounded version for the requested appearance, with its explicit additional four handed leg patterns/eight replacement legs; original R remains the minimum-pattern option.

**Recommendation: R_RAIL_REINDEX for independent PM review. Both R and L achieve CAD-computed PASS; neither is physically approved or authorized for production cutting.** No tabletop. Original V3 remains frozen, and #33/#34 acceptance is not changed by this proposal.

Baseline: `7b5af4725fdd4eccd4ae623fb031cc5a796b6df1`. Branch: `feature/al-016-flow-v31-options`. The preceding source-constrained search is retained at `engineering/flow-v3/SEARCH_REPORT.md`. Issue #36's earlier comment reports an uncommitted Library-based rail candidate. R independently reproduces its +6/-11 strategy from the **pinned repository DXFs**; this study does not import that ZIP or assert Library/repository byte equality. L is a distinct, separately built strategy.

## The necessary correction

V3's near-end rail pockets `[25,45]`, `[60,80]`, `[95,115]`, `[130,150]` force raw leg U translation -16mm for upper fit. Two coplanar corner panels then have overlapping spine material; their floor-receiver centres are `(9,3)` and `(3,9)`mm. The base's original tongue centres differ by `(-12,+12)`mm, but those receivers differ by `(-6,+6)`mm.

A consistent natural L-corner instead puts original legs at raw U translation **-10mm**, with material thickness slabs X0..6 and Y0..6. Their complementary 19-step spine has2280mm² vertical mating area, and the lower receivers become `(15,3)` and `(3,15)`mm. The **original base translated (6,6,0)mm** fits exactly. The remaining freedom is to change either the upper rail pockets (R) or retain source-coupled upper positions and change the leg spine plus base (L).

The source far-end pockets have an additional5mm asymmetry relative to mirrored near-end geometry. Accordingly the far-end correction is **-11mm**, not -6mm. Every corner is reflected from a solved SW corner, with explicit proper rigid matrices and sheet-face equivalence, rather than applying the same signed global shift at all corners.

## Candidate R — move the rail receivers; retain legs and base

Only `LENGTH_OUTER_L` and `WIDTH_OUTER_W` change. Fill the original20×6mm open receiving pockets and subtract new20×6mm pockets at near-end **+6mm** / far-end **-11mm** in the original rail U coordinates. The original curved outline outside those old/new feature masks, upper beams, holes, frame-end fingers, LEG_A, LEG_B, TRI_BASE and inner leg apertures are retained exactly. This is a complete replacement candidate rail profile, not a retrofit operation on already-cut rails.

- Seven unique profiles /19 instances; **two new patterns /four changed physical pieces**. Fifteen existing pieces remain geometrically reusable.
- Frame860×480×70mm; frame bottom Z380mm; overall860×480×450mm, floor Z0. No tabletop.
- Source lower receivers and original rounded bases remain unchanged. Each base/leg has165mm² total face contact. A/B vertical spine contact2280mm², plus648mm² horizontal finger-step contact =2928mm² per corner.
- Total quantity-weighted symmetric profile difference: **3194.877726mm²**. No change outside the explicit receiver masks; no new holes or added fasteners.

## Candidate L — retain all frame profiles; trim spine and compact base

All seven frame pieces remain original. Keep the source-coupled leg U translation -16mm and the original lower receiver positions. Trim the two original complementary spine boundaries **+6mm locally** over the source19 vertical segments. This removes the leg/leg penetration without moving the source upper near-end tabs. Far-end leg versions shift the four upper tabs **-5mm in raw U** to account for the original rail end asymmetry.

The lower receivers stay at `(9,3)` /`(3,9)`mm. Move both base ear intervals from source6..12 to **0..6mm**, retaining their independent6×6mm dimensions. Their centre spacing becomes6√2mm. Reduce the sampled quarter-circle body radius15.5→**9.5mm**, preserving the original2.5mm footprint margin after the leg silhouette datum moves6mm toward the corner. The base lies at `(6,6,0)`mm. Merely moving the ears without reducing the body would protrude3.5mm beyond the reduced foot envelope.

- Nine unique profiles /19 instances: **five new patterns /12 changed pieces** (four handed leg profiles and the base). All seven frame pieces can be reused.
- Original curved leg vertices and internal apertures remain in each part's local frame; installed curves are translated6mm relative to R. The trimmed spine changes the outline locally. The two far-end tab versions are explicitly labelled; near/far parts are not interchangeable.
- The bottom6mm of one spine contact is interrupted by the now edge-open lower receiver. Vertical A/B contact is **2244mm²**, horizontal step contact648mm², total2892mm² per corner. Lower base contact is165mm² at A and93mm² at B. The smaller B receiver-side ligament is an additional prototype concern.
- Base planar area is142.870979mm² versus260.662080mm² original: **45.19% reduction**. Quantity-weighted profile difference **20247.164403mm²**.

## Measured comparison

| Criterion | R_RAIL_REINDEX | L_LEG_BASE |
|---|---:|---:|
| Reference corner: full mates /no penetrations | PASS | PASS |
| Full instance count |19|19|
| Pairwise interference checks |171 PASS /0 FAIL|171 PASS /0 FAIL|
| Required connectivity/face-contact joints |32 PASS|32 PASS|
| Independent exported-DXF upper checks |32 tabs;720mm³ occupation and120mm² roof contact each|Same |
| Independent lower-receiver checks |8;216mm³ tongue occupation and36mm² roof contact each|Same |
| Base centre mismatch |0mm at all four corners|0mm at all four corners|
| Independent spine vertical contact/corner |2280mm²|2244mm²|
| Changed patterns /physical pieces |2 /4|5 /12|
| Original base retained |Yes|No |
| Original leg silhouettes/holes retained |Yes|Curves/holes retained locally; spine trimmed |
| Total profile difference, physical quantities |3194.878mm²|20247.164mm²|
| Original base area retained |100%|54.81%|
| Overall installed envelope |860×480×450mm|860×480×450mm|
| STEP roundtrip /GLB |19 valid solids /19 watertight mesh nodes|Same |
| Khronos glTF validation |0 errors /0 warnings|0 errors /0 warnings|
| Four browser views, no clipping |PASS|PASS|
| Physical fit/kerf/load certification |NOT PERFORMED|NOT PERFORMED|
| Production-cut authorization |NO|NO|

The two GLBs are193,452 and248,484 bytes, below3MB. Khronos reports33/37 nonblocking bufferView.target hints; errors and warnings are zero.

All32 required joints have positive face contact and no material overlap. Spine acceptance additionally requires the derived **vertical** face-contact area; a positive horizontal contact alone is insufficient. Original source tolerance is nominal6mm; no clearance or kerf compensation is added. The collision threshold is1e-5mm³; geometric/centre tolerance1e-6mm. Disjoint bounding boxes prove zero interference for separated pairs; other pairs use OCCT common volume. Face contacts use actual coplanar face intersections. Exact proof methods and matrices are in each option's JSON.

## Parameter scan, sensitivity and failures retained

[128 constrained parameter combinations](artifacts/parameter-scan.json) examine20 rail-offset cases and108 spine/ear/radius/far-tab cases. Three satisfy the necessary exact equations: R(+6,-11), and L with spine+6/ear start0/far shift-5 at radius9.5 or12mm. Radius12 has zero footprint margin and is not selected;9.5 preserves2.5mm. These analytical filters are not full assembly certification of every scanned point: only the two exported selected candidates receive the complete CAD/replay tests.

The deliberately perturbed `G_GAP_CONTROL` uses upper offsets+7/-12 and a1mm inward leg shift. It has zero penetration **and450mm² horizontal step contact**, but **zero vertical spine contact**. It is rejected. This clarifies why collision-free models and generic positive contact are inadequate. A separate -1mm perturbation of the selected R/L leg produces1080mm³ penetration, demonstrating collision sensitivity.

Design iterations: **one coherent initial geometry per candidate; zero subsequent geometry correction cycles** in this study. Script repair cycles: **two**: correcting the negative-control assertion to distinguish vertical mating from horizontal contact; handling zero-area LineString intersections in the illustration. The first unoptimized slow full scan was stopped for performance, then replaced with bounding-box proofs and exact prism-symmetry caching; this is logged as a performance iteration, not a geometry correction. Earlier V3/Library task cycle counts are inherited history and are not credited to this study. Failure logs and cycle ledger are retained.

## Recommendation and remaining gates

Recommend **R**. It changes fewer patterns and pieces, has about6.34× less profile change, preserves the larger source bases, retains original leg shapes and all four complete lower receiver ligaments, and avoids handed replacement leg patterns. These are measured geometric/manufacturing-complexity advantages, not a load rating. L demonstrates a coherent alternative if replacing the original frame is undesirable, but its smaller base, edge-open foot detail and additional patterns make it less attractive.

Manager review, owner selection and explicit design approval remain open. Before production: verify actual material thickness/kerf with joint coupons, physically assemble a reference corner and complete prototype, check assembly sequence/tool access, stability and load capacity. No nesting/toolpath or production-cut approval is provided. The original V3 evidence and blocked original-source assembly are not overwritten.

## Artifacts and replay

Each option folder contains `FLOW_V31_CANDIDATE_FULL_19_DESIGN_ONLY.step`, `.glb`, individual candidate STEP parts, separate candidate DXFs, `pairs-171.json`, `joints-32.json`, `corner.json`, `transforms.json`, `bom-and-delta.json`, `independent-qc.json`, `gltf-validation.json` and front/side/underside/top PNGs. [Overlay](artifacts/joint-overlays.svg) and [before/after sections](artifacts/corner-comparison.svg) are source-derived dimensional drawings. [Exact source delta](SOURCE_DIFF.md).

```sh
python -m venv --system-site-packages /workspace/work/venv-cad
/workspace/work/venv-cad/bin/pip install -r engineering/flow-v31/requirements.txt
/workspace/work/venv-cad/bin/python engineering/flow-v31/parameter_scan.py
/workspace/work/venv-cad/bin/python engineering/flow-v31/build.py
/workspace/work/venv-cad/bin/python engineering/flow-v31/verify.py
/workspace/work/venv-cad/bin/python engineering/flow-v31/diagrams.py
npm install --cache /workspace/work/npm-cache --prefix /workspace/work/flow-v31/browser three@0.187.0 gltf-validator@2.0.0-dev.3.10
node engineering/flow-v31/validate_glb.cjs
python engineering/flow-v31/browser_check.py
python scripts/check_site.py
/workspace/work/venv-cad/bin/python engineering/flow-v31/finalize.py
```

`verify.py` imports no design generator: it reads exported DXFs, rebuilds using a separate Workplane path, rechecks171 pairs, actual tab/receiver volumes and contact roofs, base-centre fits, and integrates spine contact independently over source planar sections. It reopens STEP and GLB and checks dimensions, matrices, indices, finite values, mesh closure and scale. Browser tests use local Chromium/software WebGL, not physical devices. `SHA256SUMS` hashes the delivered artifacts. Exact branch SHA is supplied in the Draft PR and issue handoff; no merge/deploy.
