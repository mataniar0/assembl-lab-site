# LAUNCH-01 / G0 — Public network & static source verification
Date: 2026-11-04
**Overall status: PARTIAL; LIVE NETWORK AUDIT BLOCKED (not PASS).**
**Scope:** Two deployed candidate home URLs and read-only GitHub main-branch source checks; no forms submitted, no browser storage altered, no deploy/merge.

## Requested public pages
- https://mataniar0.github.io/assembl-lab-site/
- https://mataniar0.github.io/wood-u-like-site/
Both URLs failed to open through the available web retrieval path (tool returned inaccessible/internal error); therefore real runtime requests, responses, cookie headers, third-party resources, redirects, cross-page navigation, actual Formspree POST behavior and live serving SHA were **not observed**. Do not infer absence of trackers or conclude compliance.

## Static GitHub main findings
### ASSEMBL LAB
- `index.html` is present on main and contains a direct home page; `assets/language.js` uses localStorage key `assemble-language`.
- The inspected home page references local `assets/language.css` and `assets/language.js`, an OG hero image at mataniar0.github.io, and a `#contact` anchor; no `<form>`, `formspree`, `fetch(`, `privacy` or `מדיניות` string was found **in this single home file**. This cannot establish behavior on all product/quote pages or active deployment.
- Source brand mentions ASSEMBLE LAB in title/logo while public marketing identity expected from owner is ASSEMBL LAB: branding/content consistency needs separate site-wide inspection.

### WOOD U LIKE
- `index.html` is present on main and references local stylesheets `assets/css/style.css`, `assets/css/event-wedding-feature.css`, and local scripts `assets/js/language.js`, `assets/js/attribution.js`, `assets/js/main.js`.
- `assets/js/language.js` uses localStorage key `wood-u-like-language`.
- `assets/js/attribution.js` uses sessionStorage key `wood-u-like-campaign` for `utm_source` / `utm_campaign`, validating allowed label patterns and rejecting certain potentially personal numeric values; this is source-level behavior, not proof of privacy outcome in production.
- The inspected WUL home file did not contain a `<form>` or Formspree text, but other WUL product/contact pages are **not covered** by this limited audit.

## Alignment with privacy candidate
- Local browser storage disclosures (language for both; temporary campaign attribution for WUL): **SUPPORTED BY STATIC SOURCE**.
- Sole operator, Formspree/Gmail inquiry storage, no marketing: **OWNER ATTESTATIONS**, not production observations.
- No third-party analytics/cookies/requests: **UNKNOWN**, cannot safely state absent.
- Full set of customer form fields, displayed HE/EN short notice, visible policy links and actual live submission destinations: **NOT VERIFIED**.
- Formspree processor terms, data transfers, backup deletion timelines: **OPEN**.
- Full public network QA: **BLOCKED**, not a pass.

## Next QA action (Codex/browser-capable environment recommended)
Run a read-only public-browser crawl of BOTH branded sites and all quote/contact/product form pages in both languages on mobile/desktop. Record runtime final URLs, request hosts and purposes, storage keys, response cookies, injected embeds/scripts, form field data classes and privacy notice links, and capture evidence with private/redacted data. Never click submit or send a real Formspree POST. Compare to four policies and four short HE/EN notices at exact SHA. Follow with current-SHA candidate tests in G1; retain owner authorization before G2/G3.

## Decision
G0 four-policy draft is ready for owner review; public live-network gate stays **BLOCKED**. No merge, deployment or form activation authorized by this report.
