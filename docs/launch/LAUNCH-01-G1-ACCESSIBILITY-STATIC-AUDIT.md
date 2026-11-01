# LAUNCH-01 / G1 — Static accessibility and no-JS audit
Date: 2026-10-29
Branch: feature/launch-01-g1-form-privacy

## Code-observed PASS (not browser-tested)
- The collection notice is in normal DOM flow before submission controls, as visible text in a paragraph, not aria-hidden.
- The notice has its own `data-i18n` key with explicit Hebrew and English translations.
- Shared language runtime `assets/language.js` translates all `[data-i18n]` text nodes using textContent and changes html lang/dir based on language. This makes the notice translatable without unsafe HTML insertion.
- Static HTML fallback is Hebrew: with JS unavailable, the collection notice remains visible in the rendered document.
- Existing `noscript` markup hides field controls and the submit button and offers email-only contact instructions.
- No actual submission was issued by this review.

## Open risks and checks
- Full privacy policy link and final legal identity are not yet present/verified, so G0 blocks publication.
- JavaScript-unavailable runtime failure and native browser form submit behavior (including Enter-key edge cases) require browser test. The markup still contains a Formspree action; an explicit no-JS fail-closed control is preferable before merge.
- Test at 320, 390, 768, 1024, 1440px in both languages and with screen-reader/keyboard access, visual overflow and contrast; exact current-head smoke CI should pass.
- Independent review score not awarded without hands-on evidence; do not merge this draft.
