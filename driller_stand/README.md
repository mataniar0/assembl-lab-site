# Driller Stand — V364

Production-approved baseline for the laser-cut driller stand.

## Version
- **V364 / V3.6.4**
- Overall stand: 370 × 370 × 850 mm
- Nominal material thickness: 4 mm
- Production sheet size: **900 × 440 mm**
- No kerf compensation is included.

## Production package
The complete verified DXF production package is stored in:

`V364_CUT_FILES_900x440_PRODUCTION.tar.xz`

It contains the individual V364 parts and the three production cutting sheets:

1. Rail A ×4 + Rail B ×4
2. TP1 ×1 + Shelf Slat ×10
3. Shelf Support LS ×4 + Top Perimeter ×4 + Decorative Arch ×4

The package also includes the three-sheet MASTER DXF and the production README.

## Approved V364 geometry
- TP1 has no small corner finger joints.
- Rail A / Rail B top-panel fingers are uniform, 32.2222 mm wide.
- Top Perimeter has circular puzzle side connections and no center neck.
- Decorative Arch uses circular puzzle head + neck connections.
- Corrected Shelf Support LS matches Rail B.
- Cutting sheets were checked for 900 × 440 mm bounds, BOM quantities, and part overlap.

## Extract
```bash
tar -xJf V364_CUT_FILES_900x440_PRODUCTION.tar.xz
```

## Integrity
SHA-256:
`bd43a612d20c631680f416cab1cef8f62f0e0e832c50792f583f10bb8afe937e`
