# Mobile carousel arrow verification

Correction rounds: **1**, affecting the four product pages. This counts batches
of application changes, rather than individual files or verification-script edits.

At the 390px baseline, Driller Stand's viewer was 950px wide and Kids Shelf's
viewer was 1140px wide, putting both arrows outside the screen. Shoe Rack's
single-image arrows were marked `aria-disabled` but remained enabled buttons.

The correction constrains the gallery grid and panel widths, keeps the thumbnail
strip scrolling horizontally without scrolling the page, and adds visible
keyboard focus rings. Shoe Rack retains its two arrows with native disabled
semantics and a visible explanation that it has one image.

Final verification passed:

- 36 page/viewport combinations across all four product pages at 320×568,
  360×640, 390×844, 414×896, 560×800, 640×900, 900×1100, 844×390, and 1440×900.
- 414 real tap and keyboard transitions, cycling every active carousel in both
  directions and checking both arrows after each slide change.
- Both arrows fit the viewport, avoid the sticky header, pass hit testing,
  have accessible Hebrew names, and have targets of at least 44×44px.
- Tab order, visible focus, Enter, Space, and left/right keyboard navigation.
- Correct disabled semantics and linked explanation for the single-image page.
- No page JavaScript errors or failed HTTP resource responses.
- Independent checks at 320, 390, and 900px: 102 taps verified arrows without
  unwanted page scrolling; 51 additional taps verified selected thumbnails stay
  visible in both RTL and LTR strips.

Run the repeatable check from the repository root:

```sh
python3 tests/carousel_mobile_smoke.py
```

It requires Python Playwright and Chromium, already available in the prepared
cloud environment. Use `--browser /path/to/chromium` to override the executable.
The test starts its own temporary local HTTP server and does not alter site files.
This report records local validation before publication. Deployment status is tracked by the repository's GitHub Pages workflow.
