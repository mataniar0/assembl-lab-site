# Flow V3 → V3.1 candidate source changes

**Rounded refinement:** [ROUNDING.md](ROUNDING.md) documents the later separate `R_ROUNDED_SHOULDERS` candidate. Its four rounded A/B NEAR/FAR leg patterns add a strictly local shoulder edit to R; R's rails, all base/inner-frame geometry and every placement matrix stay identical. The original R/L deltas below are retained, not recomputed or overwritten.

**Immutable baseline:** `7b5af4725fdd4eccd4ae623fb031cc5a796b6df1`. All seven original `flowgen/*V3*.dxf` hashes are verified before building and after independent replay. No file under `engineering/flow-v3/` or `flowgen/` is changed. The entire proposal is isolated under `engineering/flow-v31/`.

Candidate DXFs are separate modernR2013 files with millimetre units, closed LWPOLYLINE outlines, layer `V31_CANDIDATE_CUT`, and `V31_CANDIDATE` filenames. Their byte hashes differ even for copied geometry because headers, units and entity ordering are explicit. Geometric reuse is measured by polygon symmetric difference, not byte equality. Every candidate DXF is reread and checked against its intended polygon. These are nominal study profiles, not approved manufacturing files.

## R_RAIL_REINDEX

| Source part | Qty | Added mm²/part | Removed mm²/part | Symmetric delta mm²/part | Action |
|---|---:|---:|---:|---:|---|
| LENGTH_OUTER_L |2|408.000000|391.439315|799.439315|Fill old pockets; shift near+6/far-11 |
| WIDTH_OUTER_W |2|408.000000|389.999548|797.999548|Same offset rule |
| LEG_A |4|0|0|0|Exact geometry retained |
| LEG_B |4|0|0|0|Exact geometry retained |
| TRI_BASE_ROUNDED |4|0|0|0|Exact geometry retained |
| LENGTH_CENTER_LC |1|0|0|0|Exact geometry retained |
| CROSS_BEAM_C |2|0|0|0|Exact geometry retained |

Near-end receiving intervals change `[25,45]→[31,51]`, `[60,80]→[66,86]`, `[95,115]→[101,121]`, `[130,150]→[136,156]` in source U. The source V10..16 pocket depth stays6mm; width stays20mm.

Far-end LENGTH intervals become `[724,744]`, `[759,779]`, `[794,814]`, `[829,849]`; far-end WIDTH intervals become `[344,364]`, `[379,399]`, `[414,434]`, `[449,469]`. These derive from mirroring unchanged original leg tabs in the860/480mm installed frame and include the original5mm end asymmetry.

Changes are asserted to lie entirely in the union of old/new rectangular receiver masks. Existing upper/centre slots, frame-end fingers, curves and holes outside those masks remain exact. The amount removed is slightly below408mm² because part of a moved pocket lies in pre-existing free space along a source curved lower edge. This is preserved and measured rather than filling the free curve into an invented rectangle. Independent QC confirms all32 tab solids are fully clear of rail material and each20×6mm top contact is120mm².

Quantity-weighted delta3194.877726mm². Maximum profile Hausdorff change6mm, confined to receiver features. Seven pattern classes /19 instances; two changed patterns and four replacement pieces. The installed frame and intended external table envelope remain860×480×450mm with no tabletop.

## L_LEG_BASE

| Candidate profile (source) | Qty | Added mm²/part | Removed mm²/part | Delta mm²/part |
|---|---:|---:|---:|---:|
| LEG_A_NEAR (LEG_A) |2|0|2280|2280|
| LEG_A_FAR (LEG_A) |2|120|2400|2520|
| LEG_B_NEAR (LEG_B) |2|0|2280|2280|
| LEG_B_FAR (LEG_B) |2|120|2400|2520|
| TRI_BASE_ROUNDED |4|72|189.791101|261.791101|
| All four frame pattern classes |7 pieces|0|0|0|

- Each of19 original complementary20mm-high spine segments is trimmed6mm inward, from its measured original alternating boundary U10/16 to U16/22. No full-outline scaling is used. Leg inner apertures and original curved vertices are unchanged in part coordinates.
- FAR upper tabs shift-5mm at V390..396; NEAR tabs remain source. There are two stencils per leg class, clearly named, two instances each. The installed raw-U translation remains-16mm; curved leg contours sit6mm toward their respective corners compared with R.
- Original lower6×6 receiver coordinates U22..28 /V10..16 remain. The B receiver becomes edge-open at the trimmed spine. Its contact loss and weakened local ligament are explicitly included in the tradeoff and measured contact gates.
- Base ears are independently6×6mm, relocated from U6..12 to U0..6 and symmetrically in Y. The sampled quarter-circle radius changes15.5→9.5mm. The source sampling topology is retained; no6mm ear is scaled. Body support area reduces45.19%; the2.5mm source-intent foot-envelope margin is maintained.

Quantity-weighted delta20247.164403mm². Profile Hausdorff change is6mm for A and about8.485281mm for B because the lower receiver joins the new open edge. Base Hausdorff change is approximately6mm. Every original hole in both leg classes is checked unchanged. Nine unique patterns /19 instances; five changed patterns and12 replacement pieces. Overall envelope still860×480×450mm.

## Datums and compatibility

Per-instance homogeneous matrices in each `transforms.json` map source local `(U,V,t)` directly to right-handed CAD millimetres. Floor is Z0; base thickness Z0..6; leg shoulder Z380; top tabs Z380..386; frame Z380..450. Far-corner reflection is converted to an equivalent proper rigid transform through the source's uniform6mm thickness symmetry. All matrix determinants are+1. GLB uses metres with axes `(X,Z,-Y)/1000`.

R keeps the source leg/base family and requires its two new rail patterns. L keeps original rails but requires its four leg profiles and compact base. Candidate sets must not be mixed. Neither option is a claim that frozen V3 had a valid complete assembly. Original source datums, hashes, layer interpretation and earlier failure certificate remain available unchanged at the baseline.

[Per-profile exact deltas R](artifacts/R_RAIL_REINDEX/bom-and-delta.json), [L](artifacts/L_LEG_BASE/bom-and-delta.json), [color overlays](artifacts/joint-overlays.svg), [corner comparison](artifacts/corner-comparison.svg), [study and recommendation](OPTIONS.md).
