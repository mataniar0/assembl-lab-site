# Batch 4: disclosure titles and Flow heading

Branch: `clean-light-site`, updated from origin and verified to include `c1562a75`. Read `AGENTS.md` and `QA_CHECKS.md`; existing pre-push hook remains enabled.

## Changes

- Replaced repeated generic disclosure titles with bilingual titles describing the actual content across all product pages: product description, custom dimensions, design/build stages, workshop construction, next fabrication stages, cutting layout, assembly principle and product-specific structure/joints.
- Geometric now distinguishes model/custom dimensions, design/build stages and assembly principle. Its existing Flow link is visible rather than enclosed in a disclosure containing only that link.
- Crib has distinct product description, structure/joints, cutting layout and custom dimensions disclosures.
- Flow uses the shared product heading rules in `assets/product-light.css`: 36px on narrow screens and a desktop maximum of 58px. Photos-coming-soon notice, downloads and Flow inquiry prefill remain intact.
- Extended the existing disclosure suite to optionally cover all four requested widths, check distinct titles, the visible Flow link and Flow heading size. Existing accessibility and state checks remain intact.

No homepage, image asset, carousel logic, form implementation, safety note or backup tag changes. An additional DOM comparison against the preceding commit confirmed all original paragraph text, image attributes, carousel controls and form fields were preserved.

## Validation

| Check | Result |
| --- | --- |
| `python scripts/check_site.py` | 61 passed, 0 failed |
| `python tests/language_site_smoke.py --report /workspace/review-batch4/language.json` | 140 passed, 0 failed |
| `python tests/product_disclosures_smoke.py --all-widths --output /workspace/review-batch4` | 80 passed, 0 failed |
| `git diff --check` | Passed |

Both languages tested at 320, 390, 844 and 1440px. Checks include keyboard disclosure activation, focus visibility, preserved open state after language changes, carousel arrows/touch/keyboard, five approved shelf stages, crib safety notice, product prefill, retained form drafts and intercepted form responses. No real Formspree requests were submitted.

Visual review of Hebrew and English screenshots at all four widths found no overflow, clipping or heading-size problems. Representative Geometric, crib, shelf, Flow and inquiry screenshots (40 total) and JSON test reports are saved in `/workspace/review-batch4/`.

Correction rounds following tests: **0**. All suites passed on their first run. A normal push will run the enabled pre-push checks against the exact committed revision; its result is reported in the delivery message. No merge to main or live publication.
