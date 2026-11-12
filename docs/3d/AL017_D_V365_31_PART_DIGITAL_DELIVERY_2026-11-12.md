# AL-017-D / G4-G5 — 31-part source-derived 3D model final delivery (DESIGN ONLY)

**Date:** 2026-11-12 | **Executor:** ChatGPT only | **Material:** 4mm birch, confirmed by owner.

## Computational milestone — completed
Produced a **complete digital 31-body assembly** proposal named `DRILLER_V365_31_PART_ASSEMBLY_DESIGN_ONLY`, derived from the seven source families of V364 without changing the original cutting DXFs.

### QA rerun on final proposal
- STEP independent re-import: **31/31 valid solids**.
- GLB independent re-import: **31/31 watertight named meshes**, metres/Y-up, 170,068 bytes.
- **465/465** distinct potential part pairs screened, **48** OCC exact volumetric intersections after AABB filtering; **0 positive volumetric collisions**, 0 Boolean failures.
- Positive-control test: deliberate 3mm slat displacement yields **3** significant collisions.
- Bounding envelope **370×370×857mm**; drill machine is not included.
- Full model generated via reproducible CadQuery/Shapely/Trimesh scripts; four real VTK CAD renders prepared.
- STEP SHA256: `ddf497af1208ba6e04af8bdbe891d5bb5e167d9b3d23c34eb5efacb28d173c36`
- GLB SHA256: `64d77807279c9afb647886062ddaf650a3500fd10d9aa9374721c7aef1360320`
- Owner local ZIP: `AL017_D_V365_31_PART_3D_DESIGN_DELIVERY.zip`, SHA256 `b8d19c34c165446616d81629b1ed9aec2606d447a0dfb5bc76123e2ce2efacfe`, ~1.79 MB; includes source files, STEP, GLB, 4 renders, full QA and scripts. **No model binaries uploaded to GitHub**.

### Precisely what was changed in this *virtual concept*
1. Source A/B rails ×8 and decorative arches ×4: original profile geometry preserved; corners X/Y inset 8mm to match puzzle sockets.
2. Top perimeters ×4: locally virtually clipped puzzle-head overlaps (~31.603mm² removal per unique source profile, before replication) and 0.03mm conceptual clearance; no source file changes.
3. Shelf supports LS ×4: original 306mm profile **shortened by 16mm**, distributed as **four 4mm cuts between the five pairs of slat slots**, retaining all 10 slots per support and both original male end interfaces.
4. Shelf slats ×10: original 370mm profile **shortened by 16mm** in the uninterrupted center body, retaining both end tabs, new 354mm concept.
5. Top panel TP1 ×1: original 370×370mm plate retained, **laid on top** with underside Z=853mm (butt/glue conceptual connection) instead of assuming a valid native TP1 finger-joint lock. Final overall height =857mm rather than the earlier nominal 850mm.

### Repair history, transparency
Earlier 31-body source pose trials: 42 collisions, then 16. G3 original 16-body frame: 8 clashes; virtual clipped-puzzle frame: 0. G4: native LS placement generated 8 clashes; 16mm LS one-strip cut was rejected (20 slat overlaps); 8+8 cut was rejected (4 slat overlaps); symmetric 4×4mm shortening resolved those overlaps; final top panel repositioning to Z=853 resolves the TP1 overlap. **All 465 pairwise checks now 0 collisions**, but only in the altered V365 digital concept. **Original V364 DXF changes = 0**.

## Critical blockers / exclusions
This is **not a manufacturing-approved CAD release**:
- Full insertion paths, physical joinery, glue area/strength, clearance/kerf, drilling vibration and stability are **not** proved by zero overlaps.
- TP1 is visualized as glued/butt-mounted rather than its native finger connection; needs an owner-approved engineering change and physical prototype.
- New V365 manufacturing DXFs have **not** been produced or accepted; original V364 cutting files remain immutable.
- Website public GLB viewer and binary commit are **not** complete. PR #31 shared viewer still awaiting review. No merge/deploy.

**Disposition:** Source/CAD 31-part 3D **DELIVERED / COMPUTATIONAL COLLISION PASS**. Production and website gates **OPEN/BLOCKED**. This is an owner-facing design proposal only.
