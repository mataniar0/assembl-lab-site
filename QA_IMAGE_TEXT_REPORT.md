# Image text cleanup — 2026-10-08

Explanatory labels previously baked into product images now appear as website text in Hebrew and English. Sixteen clean image variants replace the corresponding homepage, product gallery, carousel and full-size-image references. Product engraving, dimension markings and technical part identifiers remain in the images. Source images are preserved, including an archived copy of the previously embedded Driller planning image.

New external captions cover the Geometric process montage, Workbench and Etrog overview sheets, the Crib cutting plan, and the Megillah rendering and engineering details. Carousel descriptions identify the parts in each language. The Crib planning note previously embedded in its image is preserved in the bilingual caption.

## Verification

- The existing full browser suite passed 124 cases with no failures across all ten pages in both languages at widths 320, 390, 844 and 1440 pixels. This included 376 touch and keyboard carousel transitions, language persistence, product inquiry links and intercepted form responses. No real form submissions were sent.
- An independent image-reference suite passed 40 cases across all ten pages in Hebrew and English at mobile and desktop widths. All sixteen clean assets loaded; full-size links and carousel stages used the correct images.
- Seven lossless engineering PNGs retain the original dimensions and pixel-identical colored contour geometry. Text cleanup uses localized regions so drawing lines and arrows remain intact.
- After the final callout cleanup, four targeted Megillah cases passed in both languages at 320 and 1440 pixels, including twenty actual full-size-image popup actions. All seven contour comparisons passed again.
- The Kids Shelf sprite retains pixel-identical later photographic panels. The carousel still displays five stages and ends at the 80% sprite position; the upside-down sixth panel remains excluded.
- The original image files remain unchanged. Image aspect ratios, Hebrew as the default language, saved language preference and the inquiry configuration are preserved.

## Attempts

Image cleanup required 18 image-generation calls, including four corrective rounds: Driller dimensions, ambiguous Megillah dimension annotations, an Etrog wood-background patch, and remaining English callout words in three Megillah CAD images. Routine encoding and verification runs are excluded from the correction count.
