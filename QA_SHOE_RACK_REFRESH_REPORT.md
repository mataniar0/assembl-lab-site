# Shoe Rack photo refresh — delivery and QA

2026-10-14. The Shoe Rack page now uses six curated real production photos instead of a planning hero and a two-image gallery. The photos show raw plywood before painting or finishing. The original planning/render sheet remains separately labeled as the seventh gallery item. A final finished-product photo is still missing and has not been fabricated.

Branch: `feature/shoe-rack-photo-refresh`, based on main `a262c95399275f62d270f4e547154db5e2e52cc0`.
Initial implementation SHA: `5b59f8a30bf6a0a38d6390390034e0119cbddf24`.
Reviewed application SHA after repairs: `4048f37e2e54812ca10abfd1cd50f06132027864`.
A later evidence-only commit contains this report and the retained results; its branch-head SHA is in the handoff and normal pre-push report.

## Changed files and behavior

- `shoe_rack/index.html`: real photo hero and OG image, six-photo gallery in the requested order (06, 04, 05, 03, 02, 01), separate planning slide, accurate Hebrew/English descriptions/status/alt text and future-finish note; responsive contained images, seven stage buttons, accessible wraparound arrows, keyboard and swipe controls. The existing light design and inquiry link remain.
- `shoe_rack/media/production/`: 17 optimized WebPs, six original JPEGs, the original selection README, `PROVENANCE.json` and `EDITING.md`.
- `tests/carousel_mobile_smoke.py`, `tests/language_site_smoke.py`: update explicit Shoe Rack fixtures from two to seven stages, expected full-size paths and progress. Existing assertions are preserved.
- This QA report, `QA_EVIDENCE/SHOE-PHOTO-REFRESH/` and a review-history entry in `AGENT_REVIEWS.md`.

At the reviewed application SHA, 233 of 236 existing main files are byte-identical. The three intentional existing-file changes are the product page and two test fixtures. See [scope proof](QA_EVIDENCE/SHOE-PHOTO-REFRESH/scope-proof.json). No main push, merge, deployment or WOOD U LIKE change was made.

## Photo edits and optimization

The user explicitly selected ordinary photographic editing. ImageMagick applies crops and mild brightness/contrast changes; photo 06 also has a small white-balance adjustment. Actual product joints, shelves, slats, cutouts, raw wood and scene details remain. Camera perspective is retained; no geometric warping or invented objects/background is used. Two generative edit trials changed real details and were rejected; neither is shipped.

Originals are preserved byte-for-byte. All exports avoid upscaling and strip metadata. WebP quality is 84 for smaller variants and 86 for full variants. [Recipes and source/export hashes](shoe_rack/media/production/PROVENANCE.json) and [reproduction instructions](shoe_rack/media/production/EDITING.md) are retained. Independent regeneration matched all 17 export SHA256 hashes.

Each stem below is prefixed by `shoe_rack/media/production/` and suffixed by `-480.webp`, `-960.webp` or `-full.webp`. This table lists every exported asset.

| Stem, gallery order | 480 variant | 960 variant | Full variant |
| --- | --- | --- | --- |
| 06-interior-in-use | 480×521 / 25,478 B | — | 820×890 / 70,214 B |
| 04-assembled-angled | 480×385 / 32,096 B | 960×770 / 89,882 B | 1110×890 / 127,758 B |
| 05-front-view | 480×350 / 23,852 B | 960×701 / 67,612 B | 1110×810 / 94,834 B |
| 03-mid-assembly | 480×365 / 26,492 B | 960×730 / 73,522 B | 1280×974 / 124,434 B |
| 02-parts-layout | 480×398 / 23,852 B | 960×795 / 67,172 B | 1280×1061 / 111,158 B |
| 01-laser-cutting | 480×658 / 29,608 B | 960×1317 / 90,066 B | 1280×1755 / 166,170 B |

The six original JPEGs total 1,234,551 bytes. The six full exports total 694,568 bytes (43.7% smaller); the six 480 exports total 161,378 bytes (86.9% smaller). The fallback/default gallery choices total 458,468 bytes (62.9% smaller). Actual transfer depends on viewport, device density and selected slides; hidden photos are deferred. All 17 variants together total 1,244,200 bytes, which is an on-disk total rather than a per-visit payload. Modern Chromium supports WebP; no duplicate JPEG fallback is needed for the tested browser.

## Before/after screenshots

Native initial disclosures remain closed in these comparable full-page captures. Raw screenshots use the same language and viewport; the sticky header is reset to the top before capture.

| View | Before | After |
| --- | --- | --- |
| Hebrew, mobile 390×844 | [Before](QA_EVIDENCE/SHOE-PHOTO-REFRESH/before-he-390.png) | [After](QA_EVIDENCE/SHOE-PHOTO-REFRESH/after-he-390.png) |
| English, desktop 1440×900 | [Before](QA_EVIDENCE/SHOE-PHOTO-REFRESH/before-en-1440.png) | [After](QA_EVIDENCE/SHOE-PHOTO-REFRESH/after-en-1440.png) |

Additional raw gallery captures include the assembled angled photo, laser cutting and planning in each language. The [edited-photo contact sheet](QA_EVIDENCE/SHOE-PHOTO-REFRESH/edited-photos-contact-sheet.jpg) shows all six accepted edits.

## QA results and correction history

| Check | Result | Evidence |
| --- | --- | --- |
| Generic site gate, initial working implementation | 61 passed, 0 failed, 0 real POSTs | [JSON](QA_EVIDENCE/SHOE-PHOTO-REFRESH/generic-initial.json) |
| Focused acceptance, final reviewed app SHA | 24 passed, 0 failed; 648 transitions; 0 real POSTs | [JSON](QA_EVIDENCE/SHOE-PHOTO-REFRESH/focused-final.json), [log](QA_EVIDENCE/SHOE-PHOTO-REFRESH/focused-final.log), [runner](QA_EVIDENCE/SHOE-PHOTO-REFRESH/focused-check.py) |
| Existing carousel suite | 36 passed; 576 tap/keyboard transitions | [log](QA_EVIDENCE/SHOE-PHOTO-REFRESH/carousel.log) |
| Existing bilingual suite, `--quick` | 76 passed, 0 failed, 0 real POSTs | [JSON](QA_EVIDENCE/SHOE-PHOTO-REFRESH/language-quick.json), [log](QA_EVIDENCE/SHOE-PHOTO-REFRESH/language-quick.log) |
| Hero breakpoint self-check after repair | 18 passed, 0 failed | [JSON](QA_EVIDENCE/SHOE-PHOTO-REFRESH/hero-boundaries-revised.json) |
| Caption breakpoint self-check after repair | 84 passed, 0 failed | [JSON](QA_EVIDENCE/SHOE-PHOTO-REFRESH/caption-boundaries-revised.json) |
| No-JavaScript photo fallback | 2 passed: 320px and 1440px, all six photos | [JSON](QA_EVIDENCE/SHOE-PHOTO-REFRESH/no-javascript.json) |
| Existing pre-push integration on committed fixture changes | 5 passed, 0 failed | [JSON](QA_EVIDENCE/SHOE-PHOTO-REFRESH/pre-push-integration.json) |
| Independent original/export verification | 6 originals preserved; 17 exports match dimensions/hashes, no upscaling | [JSON](QA_EVIDENCE/SHOE-PHOTO-REFRESH/assets-independent-verification.json) |
| Asset recipe reproduction | 17/17 exact matches | [JSON](QA_EVIDENCE/SHOE-PHOTO-REFRESH/asset-reproduction.json) |

The final focused run covers Hebrew and English at widths 320, 390, 640, 844, 900, 901 and 1440, mobile landscape 844×390, plus desktop probes 1100, 1200, 1399 and 1400. It checks every slide, next/previous wraparound, stage selection, keyboard/focus, horizontal swipe and vertical-scroll preservation, translated active captions, image decoding, safe full-size links, hit testing and ≥44px targets, overflow and the Shoe Rack inquiry prefill. All non-read requests are intercepted; no real inquiry is sent. Browser scope is Chromium; Safari/Firefox and physical devices were not independently run.

The first independent run found an underestimated hero `sizes` hint at 901px (14 passed, 2 failed). The first repair fixed that hint. Expanded desktop probes then found the long English word “Assembled” overflowing the caption panel. The second repair reduced the English desktop caption font slightly, preserving whole words. The final 24-case functional run passes. Initial and intermediate failure reports remain in the evidence directory.

Screenshot capture itself caused Chromium to cancel some alternate responsive candidates with `net::ERR_ABORTED`; this was reproduced with request timing while the page remained on Shoe Rack, with no HTTP 404. Functional checks now use a separate screenshot-free context with the original strict health guard, and screenshots are captured after validation in a separate context. No application error is ignored and no tracked assertion is weakened. [Capture request diagnostic](QA_EVIDENCE/SHOE-PHOTO-REFRESH/screenshot-request-diagnostic.json).

Page-code correction rounds: **3 total — 1 internal metadata correction before submission and 2 repairs after independent review**. Root-authored code repairs: **0**. Photo editing: one accepted ordinary editing pass, with two rejected generative trials recorded separately. Two QA capture corrections (sticky-header position and responsive request churn) are separate from application repair counts.

## Review and delivery

Implementation agents: `/root/shoe_photo_page` (page), `/root/shoe_photo_assets` (assets). Independent QA: `/root/shoe_photo_qa`; root also inspected the six originals, edited photos and final mobile/desktop screenshots.

Review scores and actionable feedback are recorded in [AGENT_REVIEWS.md](AGENT_REVIEWS.md). A score is a review of this implementation and does not authorize merging or publication.

PR creation is currently blocked in this environment: GitHub API returns `Forbidden`, while native Git read/push works. The prepared PR body is supplied in the external handoff. After the branch push, a manager can open a PR at https://github.com/mataniar0/assembl-lab-site/pull/new/feature/shoe-rack-photo-refresh. This is a creation link, not an existing PR. No merge or publication is authorized until APPROVED.
