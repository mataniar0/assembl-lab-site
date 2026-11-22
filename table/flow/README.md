# Flow Coffee Table — current preview and historical REV2 archive

The current website preview is **Flow V3.1 R_ROUNDED_SHOULDERS**, without a tabletop:
`media/flow-v31-rounded-design-only.glb`. It is copied byte-for-byte from the
validated CAD candidate at `b4c5797865627b78fc3182a6e89b33a8182b85f2`, merged into
the engineering branch by PR #121. See [source and QA handoff](../../docs/3d/FLOW_ROUNDED_SITE_UPDATE.md).

The ZIP below is an unchanged **historical Option 2 / TRI_BASE REV2 archive**.
Its specifications describe that older design, not the V3.1 preview. Do not mix
the archive's parts with the displayed assembly. Neither is a production-cut
approval for the rounded candidate. Historical archive description follows.

## Design
- Material thickness: 6 mm
- Top plate: 860 × 480 mm
- Smooth top: no internal slots/cutouts
- Perimeter finger joints only on the top plate
- Symmetric LENGTH_OUTER and WIDTH_OUTER geometry
- LEG_A + LEG_B form a 90° L-leg
- TRI_BASE: 34 × 34 mm right-isosceles base, 6 mm thick
- TRI_BASE has two 12 × 6 mm tabs
- LEG_A and LEG_B each have one matching 12 × 6 mm bottom notch
- Existing vertical LEG_A ↔ LEG_B finger joint is retained
- Inner cross/center beams support the underside without penetrating the top

## DXF package
The archive contains the latest unique DXF parts with quantities encoded in filenames.

Important: the TRI_BASE sits below the existing leg and adds 6 mm to finished table height unless the leg height is compensated.

Kerf compensation is not included. Perform a 6 mm test-fit before production cutting.
