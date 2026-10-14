# Shoe-rack documentary photo assets

The six originals and the project manager's selection README are preserved in `sources/` byte-for-byte. All product photographs show raw, unfinished plywood. No finished or painted product photograph is available. No generated image is used by the site.

After the user explicitly approved ordinary photographic editing, the source photographs were cropped and given small deterministic brightness/contrast adjustments using ImageMagick. The entrance photograph also received a small white-balance adjustment. No object was added, removed, painted, rebuilt, or geometrically warped. Camera perspective is retained because these are photographs of a three-dimensional product.

Two image-generation trials were rejected because they altered real product/scene details. Their outputs are not part of this asset set or used by the website.

## Recipes

`PROVENANCE.json` records source/export SHA256 checksums, exact command arguments, dimensions and byte sizes. The images use these native crop recipes before export:

| Source stem | Crop width × height + x + y | Brightness × contrast | Optional RGB matrix |
| --- | --- | --- | --- |
| 01_laser_cutting | 1400x1920+50+40 | 3x2 | None |
| 02_parts_layout | 1400x1160+150+0 | 3x2 | None |
| 03_mid_assembly | 1380x1050+200+130 | 3x2 | None |
| 04_assembled_angled | 1110x890+460+150 | 2x1 | None |
| 05_front_view | 1110x810+360+180 | 2x1 | None |
| 06_interior_in_use | 820x890+280+590 | 7x3 | 0.995 0 0 / 0 1 0 / 0 0 1.025 |

Run from this directory, using the appropriate recipe row and slug. Temporary MIFF files preserve the intermediate pixels without additional JPEG compression:

```bash
convert "sources/04_assembled_angled.jpg" -auto-orient \
  -crop "1110x890+460+150" +repage -brightness-contrast "2x1" \
  -strip /tmp/shoe-04-master.miff

convert /tmp/shoe-04-master.miff -resize "480x>" -strip \
  -quality 84 -define webp:method=6 04-assembled-angled-480.webp
convert /tmp/shoe-04-master.miff -resize "960x>" -strip \
  -quality 84 -define webp:method=6 04-assembled-angled-960.webp
convert /tmp/shoe-04-master.miff -resize "1280x>" -strip \
  -quality 86 -define webp:method=6 04-assembled-angled-full.webp
```

For image 06, insert `-color-matrix '0.995 0 0 0 1 0 0 0 1.025'` after brightness/contrast. Its native crop is only 820 pixels wide, so export 480 and full only; there is no upscaled 960 version. `-resize '1280x>'` retains smaller native crops rather than enlarging them. Every full export is limited to 1280 pixels wide. Output metadata is stripped. The remaining slugs are the source stems with underscores replaced by hyphens.

The final set contains 17 WebP files. A separate reproduction check regenerated all 17 exports from the preserved sources using the recorded recipes and obtained identical SHA256 hashes for every export. All six originals were compared visually against the final images, including complete rack edges, shelf count, slats, geometric side cutouts, joints, cushion/shoes, cutting and assembly parts.
