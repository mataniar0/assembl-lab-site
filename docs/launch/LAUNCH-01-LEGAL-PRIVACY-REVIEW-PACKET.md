# LAUNCH-01 — Legal privacy review handoff / חבילת מסירה לביקורת משפטית
**Date:** 2026-10-29
**Status:** DRAFT FOR COUNSEL — NOT APPROVED FOR PUBLICATION
**Brands:** ASSEMBL LAB (public website branding; reported registered business/trade name ASSEMBLE LAB), WOOD U LIKE.

## Owner-verified inputs / עובדות שנמסרו כעת
- **Privacy-rights contact:** labassemble@gmail.com — explicitly approved by owner for privacy-related requests.
- **Legal proprietor name:** owner confirms the name appearing in current drafts, **מתניה רוזנצויג**, is correct, **subject to checking against formal registration**. Do not mark formal identity verification complete; attorney to validate name in HE/EN, legal controller classification and appropriate display.
- **Tax/business registration status:** **NOT YET VERIFIED** (עוסק פטור / עוסק מורשה unknown). Do not advertise status or provide unconfirmed tax representations.
- Both brands operate the same shared Formspree destination xwlvlbno; notification account owner confirms receipt of past notification emails.

## Documents provided for review (same PR branch)
1. `LAUNCH-01-FULL-PRIVACY-HE-EN-DRAFT.md` — full privacy policies HE/EN for both brands; placeholders throughout remain unresolved.
2. `LAUNCH-01-G0-PRIVACY-REVIEW.md` — short collection notices HE/EN.
3. `LAUNCH-01-G0-PRIVACY-TECHNICAL-AUDIT.md` — code-observed processing/storage; not a substitute for network audit.
4. `LAUNCH-01-DATA-RETENTION-AND-RIGHTS-SOP.md` — proposed retention and access/correction/deletion SOP; no final retention period chosen.
5. `LAUNCH-01-WUL-CONTROLLED-TEST-READINESS.md` — technical service and test gates.
6. `LAUNCH-01-G1-FORM-PRIVACY-GAP.md` — outstanding collection notice and code-related issues.

## Counsel decisions requested — actionable checklist
- [ ] Confirm legal controller/proprietor identity, registered status, trade names, and site-specific legally sufficient disclosures; exclude ID numbers from public GitHub.
- [ ] Confirm collection notices for Section 11 requirements: identity and contact, purposes, voluntary/mandatory nature, consequences of refusal, recipients/purposes, access/correction/deletion as applicable, transparent link to full privacy policy.
- [ ] Review HE and EN texts and synchronize wording, especially right-to-delete nuance and international transfers.
- [ ] Review Formspree role as external processor, contractual safeguards, transfers, subprocessors, security, deletion and retention; whether email notifications create additional storage copies.
- [ ] Approve practical retention periods by inquiry/transaction type, legal preservation exceptions and rights-request handling timetable; do not imply backup deletion without proof.
- [ ] Assess browser storage (language in localStorage; marketing attribution sessionStorage), cookies/analytics after live browser audit, and any additional vendors.
- [ ] Check whether extra protections apply if inquiries from minors or child products are handled.
- [ ] Approve final privacy wording independently of business/tax, payment, shipping, returns and product safety launch readiness.

## Deliverable and sign-off requested from attorney
- Approved HE/EN privacy policy and concise notices for both sites, OR annotated change requests;
- effective date, document version, lawyer/reviewer name and review date;
- clear list of vendor confirmations required before go-live;
- privacy rights channel confirmed as labassemble@gmail.com, unless counsel identifies need for modification;
- explicit designation APPROVED / CONDITIONALLY APPROVED / NOT APPROVED for publication.

## Current technical safeguards
- WOOD U LIKE main public sending flags remain all false.
- ASSEMBL LAB draft PR #21 adds HE/EN privacy notice and removes direct Formspree HTML action; JS submission path remains configured. No publication of these changes.
- Earlier Formspree owner screenshots: enabled form and archive, one email workflow action, empty domain restriction, delete/export buttons; **NOT** proof of backup deletion, vendor retention or sole user access.
- No new live inquiry, payment, merge or deploy as part of this handoff.

## Official legal reference (for counsel, not a legal conclusion)
- Israeli Privacy Protection Authority, Section 11 duty to inform: https://www.gov.il/BlobFolder/legalinfo/duty_to_notify/he/notify13.pdf
- PPA, consent / Section 11: https://www.gov.il/BlobFolder/legalinfo/consent-2026/he/cpncent-2025.pdf
- PPA, Amendment 13 FAQ: https://www.gov.il/he/pages/tikun13_qa?chapterIndex=6
