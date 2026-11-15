# Megillat Esther Box — corrected MEB-033 3D assembly V2

## Source and physical evidence
- MEB-033 source: [assembl-lab-engineering PR #113](https://github.com/mataniar0/assembl-lab-engineering/pull/113).
- Owner confirmed a successful physical cut and complete build on **15 November 2026**; photographs and measured joint dimensions were not supplied to this update.
- Nominal birch plywood stock: **4 mm**. Original nesting: **20 product components and one inverse-curve bending jig**. The glue jig is excluded from the product GLB.
- Drawing files for manufacturing dimensions remain the source DXF/SVG, not the display GLB.

## What was wrong with V1
1. V1 interpreted the nesting orientation of `OUTER_FASCIA_*` and `FASCIA_HIDDEN_BACKER_*` as the assembled orientation, rotating 102.434 × 84.1 mm end fascia through 90 degrees.
2. V1 filled internal openings of fascia/backer and lid-end source profiles, hiding real hinge holes and beam mortises.
3. V1 used an arbitrary parabolic roof which did not conserve the original 99.170854 mm bent-arc length over the 85.5 mm lid-end chord, and placed hinge pins from unrelated arbitrary coordinates.

## V2 implementation
- `media/meb033-assembly-v2.glb`: 20 source-named meshes, nominal 4 mm plywood, separate face and edge-grain materials; sizes in metres.
- **30 individual profile loops for 20 product parts**, including **10 true internal apertures**; one additional outline belongs to the separately excluded glue jig (31 total in the original cutting sheet).
- Correct fascia mounting: its source flat 102.43445568 mm width is the assembled vertical direction and its source 84.1 mm height is the assembled front/back direction.
- Hinge pivot from independent circular/slot references in fascia and lid ends: **Y 75 mm, Z 36.5 mm**, nominal center deviation **0 mm** when anchored.
- Bent lid uses a circular arc of length **99.17085434 mm** and chord **85.5 mm**, radius **53.356369 mm**, rise **21.429271 mm**; 22 rows and 88 slit segments from the R6 source, as actual display-width openings.
- Original material contours preserved by a scan-line polygon-with-holes extrusion algorithm. Independent profile-area comparison within 0.03 mm² per part (digital check, not manufacturing tolerance).
- `media/meb033-assembly-v2-poster.svg` is directly projected from the same V2 geometry/transforms; no longer uses the older design rendering in the interactive 3D preview.

## Validation and limitations
- CI checks GLB binary/mesh bounds, source metadata, 10 preserved through-holes, hinge-center alignment, cylindrical curvature, bilingual page and interactive HE/EN/mobile/desktop load.
- **Still a reconstruction**: although the owner confirms the built prototype works, measured physical part placements, surface finish, joint fit, motion path and strength have not been independently compared with the digital V2 assembly. No STEP/parametric-solid source is claimed.
- V1 file remains in the repository only for historical comparison; it is not referenced by the updated product viewer.
