# Hebrew and English language release

All ten pages now offer Hebrew and English. Hebrew is the default even when
the browser language is English. The selector stores the preference across
pages and visits, synchronizes open tabs, and reconciles pages restored through
the browser's back/forward cache. Hebrew uses RTL; English uses LTR.

Page copy, metadata, accessible names, carousel captions, inquiry options,
validation, submission states and email drafts are translated. Switching
language retains the current slide and any entered form values. Original
product images, dimensions, stage positions, quote links and contact settings
are preserved; annotations embedded in source images retain their original
language.

## Completed local validation

- Independent regression: 124 cases passed, zero failures.
- All ten pages in both languages at 320, 390, 844 landscape and 1440 pixels.
- 32 carousel cases, including 376 touch/keyboard transitions; arrows remain
  reachable and named. The single-image Shoe Rack arrows remain disabled with
  a translated explanation.
- Sixteen product-to-inquiry taps preserve the selected product and language.
- Default language, reload, real back/forward cache restores, blocked storage,
  two-tab changes and draft/slide retention passed.
- Inquiry states and mail drafts were tested using intercepted submissions;
  no real inquiry was sent.
- Additional homepage regression: 18 cases at layout/header breakpoints in
  both languages, 144 touch/keyboard link activations and 712 contrast checks.
- Source-image URLs, including embedded image data, match the saved baseline.

Three repair rounds addressed translation/event integration and focus
contrast; untranslated planning-page links; and cache persistence, selector
screen-reader names and remaining Hebrew technical prose. The final regression
ran after these corrections.

## Reproduce

With Python Playwright and Chromium installed:

```sh
python3 tests/language_site_smoke.py --report /tmp/language-report.json
python3 tests/homepage_smoke.py
```

For the published site, the language test also accepts `--base-url` and
`--quick` to exercise 320-pixel and desktop views with the same assertions.
All Formspree requests in the language test are intercepted.

The pre-language baseline remains the annotated Git tag
`baseline-before-language-switch-2026-10-07`, pointing to
`0302cc1cd008bb182cee4ac353b99889c65fb68e`.
