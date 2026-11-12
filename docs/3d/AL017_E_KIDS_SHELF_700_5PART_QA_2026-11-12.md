# AL-017-E — Kids Shelf 700×220 — source-derived full 5-part digital CAD
**2026-11-12 | ChatGPT only | DESIGN_ONLY / not as-built certified.**

## Authoritative geometry
- Original 700×220mm, nominal 6mm: `01_top_panel_700x220.dxf`, `02_rear_wall_beam_700x110_keyholes.dxf`, `03_front_beam_700x40.dxf` from `shelf_70x22_for_existing_side_brackets_6mm_laser_files.zip`.
- Matched independently available 220×146mm standalone `02_side_bracket_left.dxf` and `03_side_bracket_right.dxf` using **exact geometrical joinery positions**, not filename inference. Other frontbeam40 and MR bracket variants were **not substituted**.
- All five native contours and internal decorative cutouts retained. Four wall keyholes retained; no mounting hardware or wall anchorage modeled.
- Model envelope **700×220×146mm**, 6mm stock.

## Fresh independent QA
- Exact source-based STEP **5/5 valid solids**, GLB **5/5 watertight meshes**, metre units with Y-up.
- All **10 unique part pairs** tested; **0 volumetric clashes**, **8 CAD touching pairs**, all five bodies in **one connected contact graph**.
- Negative control: shift left bracket +1mm along Y; detects **108mm³ penetration against the top panel** and **120mm³ against front beam**.
- Full original DXF geometry unchanged; 0 geometry and 0 placement correction cycles. One QA API correction and one renderer-shading correction.

## Photo/version gate
Website `shelf/kids/index.html` advertises 700×220mm, but the archived site photo montage explicitly contains historical **800×350mm** drawings; the photographed physical shelf is **not established** to be the 700mm candidate. The accurate 700mm CAD is **DESIGN_ONLY**; do not call it an as-built photogrammetric replica. Physical wall anchors, load capacity and cut/kerf were not tested.

## Deliverable
Owner local `AL017_E_KIDS_SHELF_700_5PART_CAD_QA_2026-11-12.zip`: precise STEP, GLB, VTK CAD 4-view poster, original 5 DXFs, reproducibility scripts, QA JSON, source manifest. SHA256: STEP `fd9415a39ea465812ed2cd7a39d9b1244022800b5cc46ea560a57be7f5bf34ec`, GLB `d06a7c058c4b0eacf7296e7c76f0b9f7427874db31f58aee355e925a587f976f`.

**Model CAD gate PASS; photo/as-built identity, production strength and site publication remain HOLD.** New binaries **not committed to GitHub**. No merge/deploy.