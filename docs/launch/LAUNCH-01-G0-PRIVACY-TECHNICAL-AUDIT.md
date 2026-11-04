# LAUNCH-01 G0 — Technical privacy readiness audit

**Date:** 2026-10-29  
**Scope:** code-only inspection of selected files in `main` for ASSEMBL LAB and WOOD U LIKE. Not a live browser/network audit, not a Formspree account audit, and not legal approval.

## Observed
| Topic | ASSEMBL LAB | WOOD U LIKE |
|---|---|---|
| Local browser storage | `assets/language.js`: reads/writes `localStorage` for language preference (lines 28, 86, 95) | `assets/js/language.js`: reads/writes `localStorage` for language (lines 719, 774) |
| Session browser storage | Not identified in inspected JS | `assets/js/attribution.js`: reads/writes/removes `sessionStorage` for campaign attribution (lines 16, 42-43) |
| Public form backend | `inquiry/contact-config.js` points to shared Formspree form; `inquiry/inquiry.js` contains real `fetch` POST path | `inquiry/contact-config.js` points to same Formspree endpoint, all approval flags false; `inquiry/inquiry.js` has guarded `fetch` path |
| Other external embeds/trackers | No evidence of analytics SDK in inspected home page/scripts | No evidence of analytics SDK in inspected home page/scripts |

**Limited scope:** source hits only from `index.html`, `assets/language.js`, `assets/media-loading.js` (AS), and `index.html`, `assets/js/main.js`, `assets/js/language.js`, `assets/js/attribution.js`, `inquiry/inquiry.js` (WUL). Other pages, external resources, server and hosted runtime still require inspection. Lack of a matching token is not proof of absence of cookies, trackers or provider processing.

## Policy revisions needed before publication
1. Explain that language preference is saved locally in the browser.
2. Explain WUL short-lived campaign attribution in session storage. Verify which fields are retained and how long.
3. Avoid asserting that no cookies, tracking, third-party calls, or international transfers occur until a full network audit and service review.
4. Explain shared Formspree destination and verify actual sender account, access rights, subprocessor arrangements, notification recipients, domain restrictions, spam and quotas.
5. Verify identity of the individual legal controller, exact registered business spelling **ASSEMBLE LAB** versus site **ASSEMBL LAB**, and proposed email address.
6. Carry out no live POST without separate G2 authorization; public activation requires distinct G3 authorization.

## Decision gate
G0 remains PENDING. G1 code audit PARTIAL. G2/G3 BLOCKED. No live submissions, customer PII, deployments, merges or changes to public flags.

Linked: LAUNCH-01 #18 and WUL-006 #9.
