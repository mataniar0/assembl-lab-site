# Etrog Box — V6.2 Final Validated

Production source package for the V6.2 wooden etrog box.

## Status
- Digital validation: **PASS**
- Connection interfaces: **30/30 PASS**
- Lid rotation: **0°–110°**, no detected collision
- Corner laminations: **96 pieces** total
- Material design basis: **6 mm**

## Repository contents
- `production_sheets/20_production_sheet_A_900x600.dxf`
- `production_sheets/21_production_sheet_B_corners_900x600.dxf`
- `previews/V6_corner_connection_exact.png`
- `previews/V6_exact_parts_preview.png`
- `previews/V6_hinge_rotation_check.png`
- `source_archive_parts/` — verified reconstructed source archive containing all 16 individual DXF source files, the V6.2 validation report, DXF audit, and package README.
- `SHA256SUMS` — integrity hashes for the source archive, archive chunks, production sheets, and previews.

## Individual DXF source geometry
The source archive contains the fit coupon, four body panels, 96 corner lamination pieces, bottom, lid parts, hinge parts, and cradle parts.

Reconstruct the source archive with:

```sh
cat source_archive_parts/etrog_box_v6_2_SOURCE_DXF_REPORTS.tar.xz.part* > etrog_box_v6_2_SOURCE_DXF_REPORTS.tar.xz
sha256sum -c SHA256SUMS
tar -xJf etrog_box_v6_2_SOURCE_DXF_REPORTS.tar.xz
```

## Before full cutting
Cut `dxf/00_fit_coupon_slots_5p8_to_6p2.dxf` from the reconstructed source archive first and choose the final slot width according to the actual plywood thickness and laser kerf before cutting the full production sheets.
