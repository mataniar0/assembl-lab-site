# Shoe Rack cutting image — landscape display QA

Implementation agent: `/root/shoe_photo_implementation`.
Work branch: `shoe-rack-cutting-landscape`.
Base: `main` at `f56bb89eced121ead717d49ae15ca55bdd3d8cff`.
Scope: work branch only; independent review, scoring, merge and publication belong to the coordinating reviewer.

## Change

The workshop cutting photograph is displayed **90° counterclockwise** in a responsive 16:9 frame. The machine head appears at the upper left and the narrow cut components along the bottom. The complete image is displayed without stretching or cropping.

The source JPEG and both WebP derivatives remain byte-identical. The original full-size link still opens the original photograph. Planning stage, hero, homepage card, descriptions, dimensions, language initialization, contact destinations and all other products were unchanged.

The layout reserves the landscape aspect ratio before image loading. Stage 02 uses a 54px top band for the badge and a 66px bottom band for the counter/arrows; the machine head is not covered. The no-JavaScript fallback uses the same landscape frame and CSS rotation. Responsive `sizes` follows the unrotated image width, which becomes the displayed landscape height after rotation.

Two stages, translated captions and alt text, active-state preservation, native arrow buttons, visible keyboard focus and touch handlers are retained. The saved-English first-paint guard remains effective because slide display follows the previous `none/grid` behavior and does not override inherited visibility.

Selectors for review: `.slide.cutting > .landscape-frame > img`; no-JS `.no-script-photo > .landscape-frame > img`.

## Image integrity

| Unchanged file | SHA256 |
| --- | --- |
| `shoe_rack/media/shoe-rack-cutting-original.jpeg` | `0a192c1bdf9d603978c3c8eacef2301d4473cc99a7035cb88df77ee5dcc0084e` |
| `shoe_rack/media/shoe-rack-cutting-540.webp` | `7667a24dfa32987f469bda9515bc8db3a59b4e1fd4d75f40c661d7b389841dbd` |
| `shoe_rack/media/shoe-rack-cutting-1080.webp` | `4c8779d515ed88b54b994b44ba3ad98f01f1a4f430ced13cdf523f08a3e72ec3` |

No image file was edited, re-encoded or regenerated in this task.

## Meaningful image assertions

The shared `IMAGE_CHECK` previously compared a rotated image's post-transform bounding box with the source's unrotated natural axes. That could underestimate the drawn pixels, allowing rotated clipping or upscaling to pass unnoticed.

The quarter-turn path now calculates object-fit dimensions from the pre-transform CSS content box, includes transform scale in the resolution check, maps the drawn pixels through the actual transform matrix, and compares those transformed pixels with the frame and clipping ancestors. It rejects unsupported rotation/alignment/ancestor-transform assumptions explicitly. Existing unrotated geometry logic and strict clipping/resolution assertions were preserved. The generic pre-push gate was unchanged.

Seven synthetic probes validate the assertion itself:

- Contained quarter-turn and ordinary unrotated controls pass.
- A translated quarter-turn outside its frame fails both frame and clipping checks.
- A shrunken frame around the rotated image fails both frame and clipping checks.
- A rotated image displayed at 120% of source resolution fails the source-resolution check.
- An ordinary unrotated image displayed at 120% also fails that check.
- An unsupported 35° image rotation fails explicitly.

These probes use a synthetic 100×200 SVG fixture, independently of the website's wrapper dimensions or the user's photograph. Observed failures are recorded in the probe report; they are expected negative-test results, not product failures.

## Validation results

Every non-read test request was intercepted. **0 real inquiries, emails or Formspree posts were sent.**

| Check | Result | Evidence |
| --- | --- | --- |
| `python scripts/setup_checks.py` | Successful; tracked pre-push hook enabled | Installer output |
| `python scripts/check_site.py` | 61 passed, 0 failed | `.qa-reports/latest.json`; `/tmp/shoe-landscape-generic.log` |
| `.venv-qa/bin/python tests/language_site_smoke.py --report .qa-reports/shoe-rack-landscape-language.json` | 140 passed, 0 failed | `.qa-reports/shoe-rack-landscape-language.json` |
| Existing carousel functions, focused on Shoe Rack at 320/390/844/1440 in both languages | 12 passed, 0 failed: 8 language cases plus 4 native mobile cases; 112 transitions | `.qa-reports/shoe-rack-landscape-carousels.json` |
| Focused landscape/media/guard/assertion probe | 21 passed, 0 failed | `/tmp/shoe-rack-landscape-implementation-qa/landscape-probe-report.json` |
| Python syntax, `git diff --check`, baseline media byte comparison | Passed | Command output |

The 21 focused cases cover ten layout cases in Hebrew and English at 320×568, 390×844, 844×900, 1440×900 and 844×390; a held-image-request case proving the viewer/frame dimensions do not move on decode; the no-JS landscape fallback; Hebrew/English paused-body first-paint checks; and seven assertion controls/negative probes. Native taps, Enter/Space, arrow keys, programmatic touch-handler gestures, vertical gesture preservation and stage retention across language changes were exercised through the existing carousel functions.

Normal work-branch push also runs the generic gate on the immutable outgoing commit. The coordinating handoff provides the exact pushed SHA, hook report and outcome; no `--no-verify` bypass is permitted.

## Before/after visual evidence

Artifacts: `/tmp/shoe-rack-landscape-implementation-qa/`.

- Before: `before-portrait-he-390.png`, `before-portrait-en-390.png`.
- After: `after-landscape-{he|en}-{width}x{height}-viewport.png`, and matching `-full.png` at all five viewport sizes.
- No-JS: `after-landscape-no-js-390.png`.

The implementation agent personally viewed the Hebrew 390×844, English 1440×900 and English 844×390 screenshots. The complete source frame is visible; the machine head, cut components, badge and arrow band remain separated. A 390px mobile viewport now fits the entire photo, both arrows and most of the caption without the previous long portrait viewer. The 844×390 landscape viewport uses normal vertical scrolling to reach bottom controls; strict hit testing checks that both are reachable.

## New-task correction counts and limitations

- Self-review application correction rounds: **0**.
- Root preflight correction rounds: **0**.
- Revisions after formal review: **1** (no-JS DPR2 density cap, described below).
- Root-authored code repairs: **0**.
- Test-harness corrections in this task: **0**.

The two corrections recorded for the earlier photograph-addition task are not counted again. All original checks above ran against the first-ready landscape implementation before handoff; the targeted formal-revision validation is recorded below. Tests used Chromium rather than a physical mobile device. The full-size original intentionally retains its original file orientation; only website display orientation changed.

## Formal revision 1 — no-JS DPR2 source density

First-ready commit: `7b5fde839d4fbabb072aa865ab4120e28ee4cf0a`. The independent reviewer found that the uncapped no-JS fallback at 1440px rendered a 1296×729 frame. At DPR2 this requires 2592×1458 displayed pixels from a preserved 1920×1080 rotated source, about 35% enlargement. The normal JavaScript gallery and all other review cases passed.

The only application repair caps `.no-script-photo .landscape-frame` at **960px**, centered with automatic inline margins. Mobile width remains 100%, rotation and full-frame containment are unchanged, and all three image files remain untouched. The 960×540 fallback now requires exactly the available 1920×1080 source pixels at DPR2.

Targeted no-JS validation: **9 passed, 0 failed**, covering Hebrew-default 320×568, 390×844, 844×390 and 1440×900 at DPR1 and DPR2, plus an expected-negative regression proof. Each positive case checks actual transformed image bounds, 16:9 geometry, CCW90 orientation, centering, full-size link, disabled inactive controls, strict clipping/layout assertions and physical pixels against available source pixels. The negative case removes the cap only in browser memory and confirms that the same physical-pixel assertion rejects the old 1296×729 DPR2 fallback. No production code or asset was altered by that probe.

Evidence: `/tmp/shoe-rack-landscape-implementation-qa/nojs-density-revision/report.json`, matching `nojs-he-{width}x{height}-dpr{1|2}.png` screenshots and `/tmp/shoe-landscape-nojs-density-revision.log`. The implementation agent visually checked the final 1440px no-JS screenshot. **0 real submissions.**

New-task totals: self-review 0, root preflight 0, **formal revision 1**, root-authored code repairs 0, test-harness corrections 0. The previous photograph-addition task's correction counts remain separate. The unchanged JavaScript gallery/common helper did not require a full 140-case rerun; normal revised-commit push supplies the mandatory exact-commit 61-case gate, with SHA/outcome in the revised handoff. Root owns first-ready/revised scores and review metadata.
