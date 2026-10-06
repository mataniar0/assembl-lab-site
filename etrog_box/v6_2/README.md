# Etrog Box — V6.2 Final Validated

Production source package for the V6.2 wooden etrog box.

## Status
- Digital validation: **PASS**
- Connection interfaces: **30/30 PASS**
- Lid rotation: **0°–110°**, no detected collision
- Corner laminations: **96 pieces** total
- Material design basis: **6 mm**

## Source package
The reconstructed source archive contains all 16 individual DXF source files, including the fit coupon, panels, corner slices, lid, hinge parts, and cradle parts, plus:
- V6.2 final validation report
- individual DXF audit
- package README

The compact source archive does **not** include the two pre-arranged 900×600 production-sheet DXFs or PNG previews. All individual source geometry is included.

Because the connector transfer layer is text-oriented, the archive is stored as verified binary chunks. Reconstruct it with:

```sh
cat source_archive_parts/etrog_box_v6_2_SOURCE_DXF_REPORTS.tar.xz.part* > etrog_box_v6_2_SOURCE_DXF_REPORTS.tar.xz
sha256sum -c SHA256SUMS
tar -xJf etrog_box_v6_2_SOURCE_DXF_REPORTS.tar.xz
```

## Before full cutting
Cut `dxf/00_fit_coupon_slots_5p8_to_6p2.dxf` first and select the final slot size according to the actual plywood thickness and laser kerf before cutting the full project.
