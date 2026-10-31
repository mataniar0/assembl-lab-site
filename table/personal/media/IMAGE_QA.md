# AL-015 — mandatory image improvement QA

Date: 2026-10-31. Product: **שולחן קפה אישי / Personal Coffee Table**. [Issue #22](https://github.com/mataniar0/assembl-lab-site/issues/22).

All seven supplied photographs were inspected individually, copied without changing source bytes, and enhanced with ordinary deterministic photographic editing before any new product HTML integration. This is a reviewable image phase, not an approval to merge or publish. No generated product image, invented finish, simulated studio background, erased object, geometry warping, paint replacement, retouching of construction marks, or aggressive sharpening is used.

## Mandatory before/after evidence

- [Seven-row BEFORE_AFTER_CONTACT_SHEET.jpg](../../../QA_EVIDENCE/AL-015/images/BEFORE_AFTER_CONTACT_SHEET.jpg): each full original is on the left and the actual enhanced full WebP is on the right.
- Seven individually reviewable 1600×1200 comparison JPEGs are linked in the per-image table below. Neutral margins belong to the comparison canvas, not to the website photographs.
- [PROVENANCE.json](PROVENANCE.json) records source SHA-256 values, observed roles, crop coordinates, tone/RGB parameters, output dimensions/quality/bytes and export hashes.
- [Reproduction proof](../../../QA_EVIDENCE/AL-015/images/ASSET_REPRODUCTION.json) records original verification and exact independent export regeneration.

## Source accuracy and approved exception

Originals under `sources/` are byte-for-byte copies of the uploaded ZIP originals. Their hashes match the unchanged [PHOTO_MANIFEST.json](sources/PHOTO_MANIFEST.json): **7/7**. The source manifest and handoff README are preserved rather than silently rewritten.

Two source filenames/manifest role descriptions do not match the actual photographed state:

1. `02_finished_front.jpeg` actually shows **unfinished workshop assembly with clamps and the leg/ring structure**. Its website caption must describe that visible state, never a finished front view.
2. `06_leg_structure.jpeg` shows the **finished table from the front, including the legs and ring**. It is not an unfinished structural-only photograph.

The original seven-file order is retained; factual website captions take precedence over misleading filename words. Images 01 and 06 show the warm wooden top and black finished legs; image 03 remains the pale, unfinished prototype. No dimensions, load capacity, finish chemistry, availability or seating/safety rating is inferred from any image.

The finished photographs include the original **Wood you like** plaque on the tabletop. A crop that removed the plaque would also cut away product features. The user explicitly approved keeping the original plaque: **“לאשר שימוש בצילום המקורי עם השלט”**. This exception permits the authentic photographed plaque in hero/card imagery; the plaque itself and WOOD U LIKE site/content are not altered. It is retained visibly, not erased, blurred, repainted or replaced.

## Per-image optimization matrix

Full export byte reduction is relative to that source JPEG. Actual responsive choices vary with viewport and device density. Full output dimensions never exceed the native edited crop.

| # | Preserved original | Truthful observed role | Original pixels / bytes | Full WebP pixels / bytes | Reduction | Visual evidence |
| --- | --- | --- | --- | --- | --- | --- |
| 01 | `01_hero_finished_angled.jpeg` | Finished product, angled view | 1500×2000 / 262,784 B | 1000×1300 / 156,100 B | 40.6% | [Before/after](../../../QA_EVIDENCE/AL-015/images/01_BEFORE_AFTER.jpg) |
| 02 | `02_finished_front.jpeg` | Workshop assembly and leg structure, unfinished | 1200×1600 / 202,939 B | 1110×1380 / 174,994 B | 13.8% | [Before/after](../../../QA_EVIDENCE/AL-015/images/02_BEFORE_AFTER.jpg) |
| 03 | `03_prototype_before_finish.jpeg` | Assembled prototype before finish | 1152×2048 / 111,623 B | 940×1170 / 56,468 B | 49.4% | [Before/after](../../../QA_EVIDENCE/AL-015/images/03_BEFORE_AFTER.jpg) |
| 04 | `04_assembly_clamped.jpeg` | Clamped assembly | 1500×2000 / 357,934 B | 1440×1267 / 264,784 B | 26.0% | [Before/after](../../../QA_EVIDENCE/AL-015/images/04_BEFORE_AFTER.jpg) |
| 05 | `05_underside_structure.jpeg` | Underside and radial supports | 1500×2000 / 297,108 B | 1400×1560 / 228,194 B | 23.2% | [Before/after](../../../QA_EVIDENCE/AL-015/images/05_BEFORE_AFTER.jpg) |
| 06 | `06_leg_structure.jpeg` | Finished front view and leg structure | 1500×2000 / 227,287 B | 1120×1430 / 146,700 B | 35.5% | [Before/after](../../../QA_EVIDENCE/AL-015/images/06_BEFORE_AFTER.jpg) |
| 07 | `07_laser_cutting.jpeg` | Laser cutting | 1500×2000 / 320,021 B | 1440×1920 / 290,148 B | 9.3% | [Before/after](../../../QA_EVIDENCE/AL-015/images/07_BEFORE_AFTER.jpg) |

## Per-image edits and fidelity checks

### 01 — Finished product, angled view

- Source: `sources/01_hero_finished_angled.jpeg`; SHA-256 `bfb1099e1bdb54600741ca33a43137f4e53ec36691089f418eb5c70f63276756` — verified unchanged.
- Crop: `1000x1300+300+500`; native edited pixels: `1000×1300`.
- Mild ImageMagick brightness/contrast: `3x1`; RGB matrix: `0.995 0 0 0 1 0 0 0 1.018`. Channel multipliers remain within 0.995–1.018; they gently reduce casts without turning warm wood neutral or black legs gray.
- Composition/accuracy: Entire tabletop, feet, joinery and original plaque retained; excess wall/floor cropped.
- Visual check: the original visible joints, cut edges, surface grain, marks and shadows remain. No perspective rectification or rotation was needed; the natural three-dimensional camera perspective is retained.
- Exports:

| File | Pixels | Bytes | WebP quality | Source reduction |
| --- | --- | ---: | ---: | ---: |
| `01-hero-finished-angled-480.webp` | 480×624 | 35,400 | 86 | 86.5% |
| `01-hero-finished-angled-768.webp` | 768×998 | 87,080 | 86 | 66.9% |
| `01-hero-finished-angled-960.webp` | 960×1248 | 122,958 | 86 | 53.2% |
| `01-hero-finished-angled-full.webp` | 1000×1300 | 156,100 | 88 | 40.6% |

### 02 — Workshop assembly and leg structure, unfinished

- Source: `sources/02_finished_front.jpeg`; SHA-256 `490b98bf4117616488357ef7540a1b34fc2da96e8cf018390113d1372db1d510` — verified unchanged.
- Crop: `1110x1380+90+220`; native edited pixels: `1110×1380`.
- Mild ImageMagick brightness/contrast: `4x2`; RGB matrix: `1.005 0 0 0 0.995 0 0 0 1.015`. Channel multipliers remain within 0.995–1.018; they gently reduce casts without turning warm wood neutral or black legs gray.
- Composition/accuracy: Manifest role is incorrect: source is an unfinished workshop assembly, not a finished front photograph. Preserve clamps and structure.
- Visual check: the original visible joints, cut edges, surface grain, marks and shadows remain. No perspective rectification or rotation was needed; the natural three-dimensional camera perspective is retained.
- Exports:

| File | Pixels | Bytes | WebP quality | Source reduction |
| --- | --- | ---: | ---: | ---: |
| `02-finished-front-480.webp` | 480×597 | 52,958 | 86 | 73.9% |
| `02-finished-front-768.webp` | 768×955 | 108,746 | 86 | 46.4% |
| `02-finished-front-960.webp` | 960×1194 | 149,854 | 86 | 26.2% |
| `02-finished-front-full.webp` | 1110×1380 | 174,994 | 84 | 13.8% |

### 03 — Assembled prototype before finish

- Source: `sources/03_prototype_before_finish.jpeg`; SHA-256 `66e6d477023a072acec43ecee567dc038084605298a101dbfbb31773bb97aeb2` — verified unchanged.
- Crop: `940x1170+150+390`; native edited pixels: `940×1170`.
- Mild ImageMagick brightness/contrast: `4x2`; RGB matrix: `0.995 0 0 0 1 0 0 0 1.018`. Channel multipliers remain within 0.995–1.018; they gently reduce casts without turning warm wood neutral or black legs gray.
- Composition/accuracy: Crop excess room/floor while retaining complete tabletop and feet; preserve the pale prototype top and natural unfinished legs.
- Visual check: the original visible joints, cut edges, surface grain, marks and shadows remain. No perspective rectification or rotation was needed; the natural three-dimensional camera perspective is retained.
- Exports:

| File | Pixels | Bytes | WebP quality | Source reduction |
| --- | --- | ---: | ---: | ---: |
| `03-prototype-before-finish-480.webp` | 480×597 | 22,270 | 86 | 80.0% |
| `03-prototype-before-finish-768.webp` | 768×956 | 39,816 | 86 | 64.3% |
| `03-prototype-before-finish-full.webp` | 940×1170 | 56,468 | 88 | 49.4% |

### 04 — Clamped assembly

- Source: `sources/04_assembly_clamped.jpeg`; SHA-256 `6fe15fb722d357db64c327d96145d25dab8785ba3c3f6303d302cc35e0ffeada` — verified unchanged.
- Crop: `1500x1320+0+440`; native edited pixels: `1500×1320`.
- Mild ImageMagick brightness/contrast: `3x2`; RGB matrix: `1.005 0 0 0 0.995 0 0 0 1.012`. Channel multipliers remain within 0.995–1.018; they gently reduce casts without turning warm wood neutral or black legs gray.
- Composition/accuracy: Crop upper shelf and foreground clutter, retaining table structure and visible clamp supports. No joints/tools erased.
- Visual check: the original visible joints, cut edges, surface grain, marks and shadows remain. No perspective rectification or rotation was needed; the natural three-dimensional camera perspective is retained.
- Exports:

| File | Pixels | Bytes | WebP quality | Source reduction |
| --- | --- | ---: | ---: | ---: |
| `04-assembly-clamped-480.webp` | 480×422 | 47,164 | 86 | 86.8% |
| `04-assembly-clamped-768.webp` | 768×676 | 100,490 | 86 | 71.9% |
| `04-assembly-clamped-960.webp` | 960×845 | 141,024 | 86 | 60.6% |
| `04-assembly-clamped-full.webp` | 1440×1267 | 264,784 | 86 | 26.0% |

### 05 — Underside and radial supports

- Source: `sources/05_underside_structure.jpeg`; SHA-256 `8e184f8d067c7113ca31fe0dd7d0228d1c6b8f6ce1b7f9cae0294e476815833d` — verified unchanged.
- Crop: `1400x1560+50+180`; native edited pixels: `1400×1560`.
- Mild ImageMagick brightness/contrast: `3x2`; RGB matrix: `1.005 0 0 0 0.995 0 0 0 1.012`. Channel multipliers remain within 0.995–1.018; they gently reduce casts without turning warm wood neutral or black legs gray.
- Composition/accuracy: Tighter view retains the full circular structure, radial supports, tabs, cut edges and technical marks.
- Visual check: the original visible joints, cut edges, surface grain, marks and shadows remain. No perspective rectification or rotation was needed; the natural three-dimensional camera perspective is retained.
- Exports:

| File | Pixels | Bytes | WebP quality | Source reduction |
| --- | --- | ---: | ---: | ---: |
| `05-underside-structure-480.webp` | 480×535 | 45,532 | 86 | 84.7% |
| `05-underside-structure-768.webp` | 768×856 | 93,054 | 86 | 68.7% |
| `05-underside-structure-960.webp` | 960×1070 | 131,188 | 86 | 55.8% |
| `05-underside-structure-full.webp` | 1400×1560 | 228,194 | 86 | 23.2% |

### 06 — Finished front view and leg structure

- Source: `sources/06_leg_structure.jpeg`; SHA-256 `28384266059e081e59a61b7eb28478894720fba0772e6b2d07d7e8d4f5fa8b10` — verified unchanged.
- Crop: `1120x1430+220+410`; native edited pixels: `1120×1430`.
- Mild ImageMagick brightness/contrast: `2x1`; RGB matrix: `0.995 0 0 0 1 0 0 0 1.018`. Channel multipliers remain within 0.995–1.018; they gently reduce casts without turning warm wood neutral or black legs gray.
- Composition/accuracy: Manifest role is incomplete: source shows the finished table from the front. Warm top, black legs, complete feet and original plaque retained.
- Visual check: the original visible joints, cut edges, surface grain, marks and shadows remain. No perspective rectification or rotation was needed; the natural three-dimensional camera perspective is retained.
- Exports:

| File | Pixels | Bytes | WebP quality | Source reduction |
| --- | --- | ---: | ---: | ---: |
| `06-leg-structure-480.webp` | 480×613 | 30,394 | 86 | 86.6% |
| `06-leg-structure-768.webp` | 768×981 | 68,238 | 86 | 70.0% |
| `06-leg-structure-960.webp` | 960×1226 | 99,434 | 86 | 56.3% |
| `06-leg-structure-full.webp` | 1120×1430 | 146,700 | 88 | 35.5% |

### 07 — Laser cutting

- Source: `sources/07_laser_cutting.jpeg`; SHA-256 `1e63807cc2e61b66285e144fdab5129a72b4c4968d8fe3c8066adf03e98de9e3` — verified unchanged.
- Crop: `none — full original frame retained`; native edited pixels: `1500×2000`.
- Mild ImageMagick brightness/contrast: `3x2`; RGB matrix: `1.005 0 0 0 1 0 0 0 1.012`. Channel multipliers remain within 0.995–1.018; they gently reduce casts without turning warm wood neutral or black legs gray.
- Composition/accuracy: Full source frame retained to avoid losing the laser head or cut geometry; mild tonal correction improves line/shadow readability.
- Visual check: the original visible joints, cut edges, surface grain, marks and shadows remain. No perspective rectification or rotation was needed; the natural three-dimensional camera perspective is retained.
- Exports:

| File | Pixels | Bytes | WebP quality | Source reduction |
| --- | --- | ---: | ---: | ---: |
| `07-laser-cutting-480.webp` | 480×640 | 33,196 | 86 | 89.6% |
| `07-laser-cutting-768.webp` | 768×1024 | 94,636 | 86 | 70.4% |
| `07-laser-cutting-960.webp` | 960×1280 | 153,596 | 86 | 52.0% |
| `07-laser-cutting-full.webp` | 1440×1920 | 290,148 | 84 | 9.3% |

## Card assets and responsive behavior

The tables card uses separate `personal-card-480.webp` and `personal-card-960.webp` exports of the accepted finished image 01. They retain the complete tabletop, feet and original plaque. Their faithful portrait crop must use `object-fit: contain` inside the existing 4:3 model-card viewport; cover-cropping would remove parts of the photographed product. No fake studio padding is baked into either photo.

| Card file | Actual pixels | Bytes | Quality |
| --- | --- | ---: | ---: |
| `personal-card-480.webp` | 480×624 | 35,400 | 86 |
| `personal-card-960.webp` | 960×1248 | 122,958 | 86 |

There are **27 gallery WebPs plus 2 card WebPs**. Gallery variants are 480/768/960/full where the native crop permits; image 03 has 480/768/full only because its native crop is 940px wide. No export is enlarged. Full variants are at most 1440px wide, with smaller native crops retained at native width. HTML must use the actual width descriptors from PROVENANCE, hero eager loading and deferred gallery loading. A separate JPEG fallback is unnecessary for the project's modern browser targets; original JPEGs remain available in the source archive.

Seven original JPEGs total **1,779,696 bytes**. The seven full WebPs total **1,317,388 bytes (26.0% smaller)**; the 768 set totals **592,060 bytes (66.7% smaller)**; the 480 set totals **266,914 bytes (85.0% smaller)**. All gallery variants together total 2,974,416 bytes on disk; card variants total 158,358 bytes. Those variant-set totals are not a per-visit network payload.

## Reproduction and correction count

The recipe for each image is:

```sh
convert sources/ORIGINAL.jpeg -auto-orient -crop CROP +repage \
  -brightness-contrast BRIGHTNESSxCONTRAST -color-matrix 'RGB_MATRIX' \
  -strip /tmp/al015-master.miff
convert /tmp/al015-master.miff -resize 'WIDTHx>' -strip \
  -quality QUALITY -define webp:method=6 OUTPUT.webp
```

Omit `-crop ... +repage` only for image 07, whose whole cutting frame is preserved. Replace parameters with the recorded per-image/variant values. `WIDTHx>` prevents upscaling; the full output uses a 1440px maximum. All output metadata is stripped. The retained reproduction helper regenerates every gallery/card asset from the preserved original plus recorded recipe and requires exact SHA-256 matches.

**One accepted photographic enhancement pass and one internal crop/compression revision before image-phase handoff.** The revision expanded image 05 upward to retain the complete support tab and adjusted full-image compression for high-entropy workshop/cutting photos after reviewing draft bytes and pixels. These are disclosed; no generative trial was made and no product geometry or finish was changed. QA repairs after image-phase handoff: **0** at the time of this report. Final manager approval remains pending.
