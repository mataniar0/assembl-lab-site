# Homepage display derivatives

These WebP files select exactly the display areas used by the approved homepage. Existing source files and full-size product links are preserved. Encoding uses WebP quality 88, Lanczos resizing, and widths of 480 and up to 960 pixels (never upscaling the source crop).

| Card | Source | Pixel crop (left, top, right, bottom) |
| --- | --- | --- |
| Tables | `assets/geometric-hero.webp` | Full image |
| Kids shelf | `shelf/kids/kids_shelf_story_clean.webp` | `(0,3000,1000,3750)`, approved fifth sprite panel |
| Drill stand | `driller_stand/driller_story_v2.jpg` | `(0,2250,1000,3000)`, final panel |
| Shoe rack | `shoe_rack/shoe-rack-planning-clean.webp` | `(0,66,690,459)` |
| Workbench | `workbench/workbench-planning-clean.webp` | `(0,0,749,445)` |
| Crib | `crib/crib-hero.png` | Full image |
| Etrog box | `etrog_box/media/planning-decorated-clean.webp` | `(0,81,630,454)` |
| Scroll case | `megillat_esther_box/media/product-render-clean.webp` | `(0,0,960,495)` |

Rendering crops reproduce the previous CSS viewports and retain their existing inset space. Do not substitute a different source panel or change product geometry/engraving. The kids shelf regression test pins the source and both derivatives and checks the five-stage carousel; the rejected sixth panel must not be used.

The filename `-960` identifies the larger variant, which may be narrower when the source crop is below 960px. HTML `srcset` descriptors declare its actual pixel width. All 16 card files are between 18,518 and 109,412 bytes.
