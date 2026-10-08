# Product pages and inquiry — batch 2

Prepared on `clean-light-site` after `8de0f3f`. Only this review branch may be pushed; no main merge or live deployment.

## Changes

- Nine model/product pages share a light opening with one product name, short Hebrew/English introduction, visible inquiry CTA and existing central image (Flow retains its no-photo placeholder). Product images precede specification tables and long explanations on mobile.
- Native `details`/`summary` disclosures collect specifications, original versions, longer descriptions, customization and engineering sections. Existing information, source images and full-size links remain available. Existing product titles with version/dimension information are retained in specifications, rather than repeated in the opening.
- Development statuses remain visible. The crib's original mattress-fit and infant-safety validation wording is also visible outside the collapsed plan section.
- Carousels remain visible, with their original arrows, stages, touch and keyboard behavior. Language changes preserve active stages. Kids shelf retains exactly five stages with the approved fifth at `80%`; the sixth panel is not reintroduced.
- Geometric uses the existing finished-table image in its opening. Geometric and shoe-rack opening images link to their full-size sources.
- Inquiry opening is shorter; ordering explanation is collapsed. Product, name, contact and quantity remain the primary fields. Dimensions and note are optional in a native disclosure. Invalid optional controls reopen the disclosure so errors remain reachable.
- All copy changes are bilingual. Formspree stays `https://formspree.io/f/xwlvlbno`, email stays `labassemble@gmail.com`, email-app drafts remain available and WhatsApp stays hidden without a configured number. No external service, payment or cart added.

## Validation

Commands ran from `/workspace/assembl-lab-site`, using local HTTP servers and Chromium. Sandbox permission was required to start the local server/browser. Every inquiry request was intercepted; zero real submissions.

| Check | Final result |
| --- | --- |
| `python scripts/check_site.py` | 61 passed, 0 failed |
| `python tests/language_site_smoke.py --report /tmp/batch2-language-final.json` | 140 passed, 0 failed; layouts at 320, 390, 844 and 1440 in Hebrew/English; inquiry errors, busy/success states and email drafts |
| `python tests/mobile_site_smoke.py` | 126 page/viewport checks and 224 carousel-stage checks passed |
| `python tests/carousel_mobile_smoke.py` | 36 page/viewport checks and 396 touch/keyboard transitions passed |
| `python tests/table_models_smoke.py` | 6 model-navigation journeys passed |
| `python tests/product_disclosures_smoke.py --output /workspace/review-products-batch2` | 40 cases: nine product/model pages plus inquiry, both languages at 390 and 1440; keyboard disclosure/focus, language state, optional draft, approved shelf stage, crib safety note, image/layout and full-size asset links |
| Accessible reference audit | All `aria-labelledby`/`aria-describedby` targets resolve on every site page |
| `git diff --check` | Passed |

The tracked pre-push hook is enabled. Normal push validates an isolated snapshot of the outgoing commit and stores its report in ignored `.qa-reports/pre-push-<SHA>.json`. No hook bypass is permitted.

## Correction rounds: 2

1. Initial generic/mobile/language/carousel runs detected Geometric's new opening image exceeding the viewport, also interfering with language-button activation. Added responsive width/height rules and reran affected suites successfully.
2. Accessible-reference audit found that replacing four product headings removed their `product-title` IDs. Restored the IDs, added the reference assertion to disclosure tests, reran all 40 disclosure cases and the generic gate successfully.

Language-suite tests now open the optional-fields disclosure before entering dimensions or notes; existing validation assertions were not removed.

## Review artifacts

`/workspace/review-products-batch2/` contains JSON reports and 16 full-page screenshots: Geometric, kids shelf, crib and inquiry in Hebrew/English at 390px and 1440px. Filenames follow `geometric-he-390.png`, `shelf-kids-en-1440.png`, `crib-en-390.png`, `inquiry-he-390.png`, etc. Visual inspection covered Hebrew Geometric mobile, Hebrew inquiry mobile and English crib mobile. Original image files and the Git backup tag were not changed.
