# Batch 5: stable language loading

Baseline: `6e15f2985f82b10a338d7e5d85454491d3971f84` on `main`.

The mobile header originally grew from 64px to 112px after `DOMContentLoaded`, moving the main content by 48px. A frozen baseline and a deliberately delayed readiness script reproduced the problem in both languages. The new regression test fails on that baseline.

## Changes and correction rounds

1. Added the existing language controls directly to all 12 page headers. Their space is reserved immediately; the shared initializer binds and enables them. The fallback for older markup remains. Mobile anchor offsets have a 112px CSS fallback before the existing precise header measurement.
2. Matched the inquiry page's initial Hebrew heading and introduction to its existing translations. This removes a separate shift caused by replacing the old two-line heading and longer introduction during initialization.
3. Translate each completed document before delayed readiness, so saved English is already rendered in the chosen language. The existing readiness event continues to bind controls and synchronize carousels and forms.
4. Added a first-paint guard for initially saved English until that early translation completes. This prevents an intermittent flash of differently sized Hebrew fallback text. Default Hebrew and browsing without JavaScript stay visible. Later language changes do not enable the guard.

**Application correction rounds: 4.** An initial scroll test sampled an unfinished smooth scroll; its fixed delay was replaced with an explicit settled-scroll wait. Two independent review failures attempted to click the intentionally hidden mobile About link; direct fragment navigation was verified separately. These test-diagnosis adjustments are separate from the four application corrections.

## Validation

| Check | Result |
| --- | --- |
| Generic functioning checks after early-translation changes | 61 passed, 0 failed |
| Delayed readiness, early translation, language switching, slow bootstrap and state/scroll journeys | 153 passed, 0 failed |
| Paused body parsing / English first-paint guard | 4 passed, 0 failed |
| Bilingual functionality at 320/1440px, including storage, history, carousels and mocked form responses | 76 passed, 0 failed |
| Independent final delayed-loading review | 28 passed, 0 failed |
| No-JavaScript and blocked-storage fallback checks | 6 passed, 0 failed |
| Existing responsive image/deferred-stage checks | 2 passed, 0 failed |
| Whitespace validation | Passed |

The 153-case run covers every page in Hebrew and English at 320, 390, 780, 781, 844 and 1440px, including both sides of the header breakpoint. Four additional paused-parser cases exercise the final first-paint guard. The current full standalone suite contains all 157 cases. It is documented in `QA_CHECKS.md` and remains separate from the minimal automatic pre-push gate.

Final independent measurements at 390px show CLS 0 on all 12 pages in both languages under delayed readiness, with no change in header/main position. English homepage checks at 320/1440px and inquiry at 320px also show CLS 0. Inquiry at 1440px retains a small CLS of approximately 0.00151 from the existing deferred email button's horizontal movement; language loading does not move the header or content boundary.

Representative Hebrew/English mobile and desktop screenshots were reviewed. Form tests intercept writes; **0 real inquiries or emails were sent**. The carousel stages, current draft handling, product links, imagery, translations and backup tag remain intact.

Local artifacts are in `/tmp/assemble-batch5-*.json` and `/tmp/assemble-batch5-review/`. A normal push checks the exact outgoing commit; publication is subsequently verified against live page and shared-asset bytes and fresh browser checks.
