# Shoe Rack cutting photograph — implementation QA

Implementation agent: `/root/shoe_photo_implementation`.
Work branch: `shoe-rack-cutting-photo`, based on `main` at `d0cd68a`.
Publication scope: work branch only. The coordinating reviewer owns independent review, scoring, merging and live-site verification.

## Delivered change

The Shoe Rack gallery now has two real stages: **01 Planning / תכנון**, **02 Cutting / חיתוך**. The second stage uses the user's real workshop photograph of the machine cutting the parts. Descriptions, alt text, badge, counter, stage selection and full-size image link follow the active stage and selected language. The selected stage survives language changes.

The planning hero, homepage card, product dimensions, development status, contact destinations, other products and backup tag were preserved. Text that promised future cutting photos or described disabled single-image navigation was replaced; assembly and finishing remain future stages.

Both arrows are active, adjacent in keyboard order, at least 44 × 44 pixels, and have translated accessible names and visible focus. The gallery supports native button Enter/Space, Left/Right keys, taps and horizontal touch gestures; vertical gestures keep the current stage. Exactly one stage is `aria-pressed=true`; inactive images are excluded from the accessibility tree.

The cutting image is requested only after selecting stage 02. The viewer reserves the portrait frame before the request completes; the complete photograph fits within it without cropping. A visible full-size link opens the untouched original JPEG. With JavaScript disabled, both planning and cutting images and their full-size links remain accessible; inactive navigation controls stay disabled.

## Media integrity

| Asset | Dimensions | Bytes |
| --- | --- | ---: |
| `shoe_rack/media/shoe-rack-cutting-original.jpeg` | 1080 × 1920 | 113,952 |
| `shoe_rack/media/shoe-rack-cutting-540.webp` | 540 × 960 | 26,572 |
| `shoe_rack/media/shoe-rack-cutting-1080.webp` | 1080 × 1920 | 70,388 |

Original SHA256: `0a192c1bdf9d603978c3c8eacef2301d4473cc99a7035cb88df77ee5dcc0084e`.

The repository JPEG is byte-identical to the uploaded photograph. WebP preparation only converted/resized the full frame; no crop, upscaling, retouching, color changes or generated details were applied. The responsive image's source selection is promoted together with the deferred source when stage 02 is selected.

## Validation

All browser tests intercepted non-read requests. **No real inquiry, email or Formspree submission was sent.**

| Check | Result | Evidence |
| --- | --- | --- |
| `python scripts/setup_checks.py` | Installed successfully; tracked hook preserved/enabled | Installer output |
| `python scripts/check_site.py` | Initial generic gate: 61 passed, 0 failed | `.qa-reports/latest.json` |
| `.venv-qa/bin/python tests/carousel_mobile_smoke.py` | 36 page/viewport cases, 486 tap/keyboard/gesture transitions; 0 failures | `/tmp/shoe-carousel-tests-final.log` |
| `.venv-qa/bin/python tests/language_site_smoke.py --report .qa-reports/shoe-rack-language-final.json` | 140 passed, 0 failed | `.qa-reports/shoe-rack-language-final.json` |
| `.venv-qa/bin/python tests/language_stability_smoke.py --paths shoe_rack/ --widths 320 390 844 1440 --report .qa-reports/shoe-rack-language-stability-guard-final.json` | 21 passed, 0 failed | `.qa-reports/shoe-rack-language-stability-guard-final.json` |
| Focused post-guard rerun using the existing language carousel and mobile carousel functions | 12 passed, 0 failed: both languages at 320/390/844/1440, plus four mobile carousel cases | `.qa-reports/shoe-rack-post-guard.json` |
| Focused media/content/deferred/gesture/no-JS probe | 10 passed, 0 failed; 8 bilingual viewport cases, delayed image frame case, no-JS case | `/tmp/shoe-rack-implementation-qa/focused-report.json` |
| `git diff --check` and Python syntax checks | Passed | Command output |

The full carousel and bilingual matrices finished around the final first-paint CSS correction. The 12 post-guard focused cases reran the complete relevant carousel assertions against the final Shoe Rack code; other pages were unchanged. The 21-case language stability suite and 10-case image probe also ran after that correction. Normal branch push additionally runs the generic gate on the immutable outgoing commit; its exact SHA/report and outcome are included in the coordinating handoff.

The original single-image exemptions were removed from both carousel suites. They now explicitly require two Shoe Rack stages while preserving Geometric=6, Kids Shelf=5 and Driller Stand=5. The language suite waits for the genuinely deferred active image to decode before retaining all strict image/layout assertions, checks the stage-specific original link and counter, and checks translated captions/alt text. The paused-body regression now checks actual active image visibility, catching a child that could paint through the saved-English hidden-body guard. Generic pre-push assertions were unchanged.

## Visual evidence

Artifacts: `/tmp/shoe-rack-implementation-qa/`.

- Full-page screenshots for both stages in Hebrew and English at 320, 390, 844 and 1440 pixels: `shoe-{he|en}-{width}-stage{1|2}.png`.
- Eight viewport screenshots of the cutting stage: `shoe-{he|en}-{width}-stage2-viewport.png`.
- No-JS fallback: `shoe-no-js-390.png`.

The implementation agent personally inspected Hebrew 320, Hebrew 390, English 844 and English 1440 screenshots. At 390px the complete portrait, machine head and cut parts remain visible above the controls. The 844×390 landscape viewport requires normal vertical scrolling to see the bottom controls; hit testing confirms both arrows remain reachable. Full-page screenshots can show the sticky header in the middle after scrolling; the viewport screenshots document the normal visible header position.

## Correction count and limitations

- **Self-review corrections before handoff: 1.** At 390px, the initial responsive `sizes` understated the drawn portrait width. The strict source-resolution check detected it in both languages (initial language run: 138 passed, 2 failed); `sizes` now reserves the full possible 350px image width. Final checks pass without weakening the assertion.
- **Root preflight correction before first ready handoff: 1.** Explicit active-slide `visibility:visible` could bypass the saved-English body guard. A new paused-body image assertion reproduced the defect; slides now use `display:none/grid` and inherit the body visibility. The strengthened suite passes.
- **Revisions after formal review: 0. Root-authored code repairs: 0.** There are two application correction rounds before the first ready handoff, with their sources separated above.
- A temporary touch-event probe initially omitted the native Touch identifier. Its test payload was corrected; this was a test-harness correction, not an application failure. Native arrow taps, keyboard operations and browser-constructed touch-handler gestures are covered; no physical-device test was performed.
- The product remains in development. This addition documents cutting and does not claim that assembly or finishing is complete.
