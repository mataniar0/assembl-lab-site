# Clean light homepage review

Branch: `clean-light-site`. Prepared for review only; no push to main or live deployment.

## Changes

- Uniform warm white background, fewer borders, no gray card panels, lighter contact and footer sections; orange restricted to logo and custom inquiry link.
- Smaller hero title and one short bilingual description including custom dimensions. Primary product CTA and quiet secondary custom CTA.
- Existing four-stage Geometric collage unchanged, including the assembled frame without its tabletop; one short bilingual stage explanation.
- Products immediately follow the hero. Custom dimensions section follows the collection and links directly to the custom inquiry form.
- Eight equal cards in the existing order, four columns above 1100px, two at 641–1100px, one up to 640px. The first card remains the Tables family link for Geometric/Flow.
- Uniform 4:3 media frames; no duplicate numbers, versions, repeated custom-size badges or redundant opening links. Development labels sit below images.
- Focused CSS viewports of existing render panels for shoe rack, workbench, etrog box and scroll case; final assembled shelf photo selected. Sources, geometry, engravings and product-page drawings unchanged. Renderings remain explicitly labeled in both languages.
- Grid test expectations updated. Existing accessibility, image, contrast, navigation and inquiry assertions retained. Added a repeatable bilingual review test covering all requested widths, card order, development labels, media aspect ratios, keyboard focus and image availability.

## Validation

All commands ran from `/workspace/assembl-lab-site` with Chromium and local HTTP servers.

| Command | Outcome |
| --- | --- |
| `python3 tests/homepage_smoke.py --report /tmp/clean-homepage.json` | 16/16 viewports; 128 touch/keyboard navigations; zero failures |
| `python3 tests/language_site_smoke.py --report /tmp/clean-language.json` | 140 passed; zero failures; zero real Formspree posts |
| `python3 tests/mobile_site_smoke.py` | 126 page/viewport checks; 224 carousel stages; passed |
| `python3 tests/carousel_mobile_smoke.py` | 36 page/viewport checks; 396 tap/keyboard transitions; passed |
| `python3 tests/table_models_smoke.py` | Six bilingual navigation journeys; passed |
| `python3 tests/clean_light_homepage_smoke.py --output /workspace/review-clean-light-site` | Eight cases: Hebrew/English at 320, 390, 844 and 1440; passed |
| `git diff --check` | Passed |

Screenshots and JSON results: `/workspace/review-clean-light-site/`. Full-page screenshots: `home-he-390.png`, `home-en-390.png`, `home-he-1440.png`, `home-en-1440.png`. Visually inspected Hebrew desktop and mobile and English mobile; screenshots regenerated after final refinements without transient focus outlines.

## Correction rounds: 2

1. Automated tests found that the generic header link display rule overrode hiding About on mobile. Fixed CSS specificity, stopped the initial homepage run, then reran the full suite successfully.
2. Visual review found the shelf card selected a workshop stage instead of the final assembled shelf. Selected the final panel and tightened rendering viewports to exclude neighboring planning panels. Revalidated the requested bilingual widths and regenerated screenshots.

The existing remote backup tag `baseline-before-language-switch-2026-10-07` remains at tag object `72d280b6292c03d7db80729907dc8997e1848dfe`; no tag writes were performed. No external inquiries were sent and no live site publication was performed.
