# LAUNCH — Cross-brand commercial launch readiness and acceptance gates

**Date:** 2026-10-29  
**Owner project:** LAUNCH-01 / #18  
**Status:** NO-GO (unverified prerequisites)  
**Scope:** ASSEMBL LAB (site name) / ASSEMBLE LAB (reported registered business name), and WOOD U LIKE.  
**Execution model:** LEAN TASK PLANNING v1.1 — ChatGPT prepares/audits, Codex only when reliable implementation/testing requires it. This document is not a legal opinion or proof that external systems are configured.

## Current evidenced baseline
- Two GitHub repositories, with existing quote-request interfaces; a shared Formspree destination exists in public configuration.
- WOOD U LIKE public delivery is blocked with three false approval flags; maintain the fail-closed design.
- ASSEMBL LAB JS has a real Formspree POST path when a valid endpoint is configured; reception into the owner's inbox has NOT been verified.
- HE/EN short notices and full-policy **drafts only** exist in this branch; registered proprietor legal identity and exact business spelling require confirmation.
- Source review found language preference in localStorage in both sites and WUL campaign context in sessionStorage. A live network/cookie and all-pages audit remains outstanding.
- Live GitHub Pages URLs were not accessible with the current read-only web fetch mechanism; live desktop/mobile validation is NOT VERIFIED.
- This document does not attest to a Formspree login, account check, real POST, Grow onboarding, payment, tax status, shipping arrangement, or legal approval.

## P0 — G0 Identity, privacy and consent
Owner / qualified adviser:
- [ ] Confirm actual current taxpayer status (exempt/authorized), registration, and whether engineering/design activity requires a particular classification.
- [ ] Confirm registered proprietor's legal name/identification disclosure and whether business name ASSEMBLE LAB may be used alongside it. Do not place identity numbers or residential details in GitHub.
- [ ] Verify proposed privacy contact mailbox ownership and ability to receive/respond.
- [ ] Verify Formspree shared account, form ownership, permission lists, restriction-to-domain, spam, automated forwarding, notifications, quota, processor terms, location, retention and deletion.
- [ ] Audit all live pages/network for cookies and external scripts, and revise policies to match facts.
- [ ] Review and explicitly approve exact HE/EN short notices and full policies, legal identity, rights contact, retention and international transfer language.
**Acceptance:** approved written text and operational verification from authorized owner; no placeholders remain in published policies.

## P0 — G1 Site and inquiry verification (mocked)
ChatGPT prepares + Codex only if browser/automation integration is required:
- [ ] ASSEMBL LAB LEADS-AS-01/02/03/04 QA and actual integration status; avoid assuming issue closure implies live delivery.
- [ ] WUL-006 checks including guarded form and shared inbox brand attribution.
- [ ] Product links -> inquiry forms; product IDs; availability vs development-stage labels; bilingual HE/EN and RTL/LTR.
- [ ] Desktop/mobile at 320/390/768/1024/1440; accessibility keyboard/focus, broken images/links, 404s, CORS, failure/timeout/duplicate handling, honeypot.
- [ ] Mocked POST interception with 0 real outgoing submissions; check exact brand, product, and source.
- [ ] Independently review against >=90/100 QA threshold, no blockers.
**Acceptance:** traceable test results on exact SHA; no real POST.

## P0 — G2 Owner-scoped live delivery validation
- [ ] Owner separately approves **one** controlled synthetic inquiry for each brand after G0/G1.
- [ ] One POST per approved test, no automatic retry; confirm actual records, correct brand/subject/product, notifications and spam folder in owner's Formspree account.
- [ ] Do not store contact names, emails or inbox screenshots with PII in GitHub.
**Acceptance:** real receipt evidence for each brand; response HTTP success alone is insufficient.

## P0 — G3 Commercial operations
- [ ] Verify real business registration, bookkeeping / receipt or invoice issuance appropriate to dealer classification (consult accountant or tax adviser).
- [ ] Establish approved price quotation: product/configuration, scope, currency, tax handling, shipping, time estimate, proof/engraving approval, payment conditions, revisions, and any deposits.
- [ ] Verify a compliant payment provider / payment link owned by the registered business and an authorized test; do not assume Grow account exists.
- [ ] Customer-facing terms: distance selling, cancellation / customized goods exceptions as applicable, returns and warranty, shipping or pickup, complaints/accessibility/contact.
- [ ] Confirm ability to manufacture and fulfill only safety-validated products; especially do not offer baby products, load-bearing furniture or other high-safety-risk products as approved production without appropriate engineering, safety and regulatory assessment.
- [ ] Establish restricted private lead/order tracker with IDs and stages; separate quoted value, paid revenue and fulfilled orders. No customer PII in public repo.
- [ ] Controlled end-to-end order flow from inquiry to quotation, customer approval, test payment verification, proper tax document and fulfillment status.
**Acceptance:** owner confirms ability to deliver and comply, and verifies external service/financial account. No actual client charge without separate authorization.

## P0 — G4 Launch approval (separate decision)
- [ ] Written owner GO for each brand after G0–G3.
- [ ] Reviewed merge/deploy only after approved QA; preserve operational rollback.
- [ ] Verify final public sites desktop/mobile, privacy link, inquiry completion and actual inbox reception after deployment.
- [ ] Confirm who monitors inbox and customer response process.
**Acceptance:** documented GO with evidence, date and scope; otherwise NO-GO.

## Priority and recommended execution
| ID | Priority | Executor | Current state |
|---|---|---|---|
| LAUNCH-01 G0 | P0 | ChatGPT + owner / legal reviewer | DRAFT / OWNER VERIFICATION PENDING |
| LAUNCH-01 G1 | P0 | ChatGPT, Codex for required browser/implementation | PARTIAL |
| LAUNCH-01 G2 | P0 | Owner-authorized controlled test | NOT AUTHORIZED |
| LAUNCH-02 Pricing + quote template | P0 | ChatGPT | TEMPLATE TO PREPARE |
| LAUNCH-03 Payments/tax readiness | P0 | Owner + accountant/provider; ChatGPT docs | PENDING |
| LAUNCH-04 Terms/fulfillment | P0 | ChatGPT + owner/legal | PENDING |
| LAUNCH-05 QA/GO decision | P0 | ChatGPT independent review + owner | NO-GO |

## Blocking evidence (as of 2026-10-29)
1. Verified owner/controller identity, dealer status and exact public legal notices.
2. Access to and verification of Formspree inbox/account behavior.
3. Owner authorization for controlled live inquiry tests; verified results.
4. Tax document issuance / provider / payment arrangements and legal commercial terms.
5. Live-site visual/network QA and final independent QA/owner GO.

**Prohibitions:** no changes to WUL flags, no public activation, no real POST, no payments/charges, no merge/deploy under this documentation task. A general instruction to continue work is not a specific approval of any of these actions.


## Owner-verified Formspree account checks — 2026-10-29
- Owner found form `xwlvlbno` in account.
- Owner confirmed notification destination `labassemble@gmail.com` and receipt of earlier Formspree email notifications.
- Screenshot: Form Enabled and Submission Archive both on.
- Screenshot: project Restrict to Domain input blank (no domain value configured).
- Screenshot: multiple ASSEMBL LAB-subject submissions visible in Inbox, Spam count 0 at observation. Existing records do not establish new WUL end-to-end delivery.
- Owner reports plan allowance 50 submissions/month; usage count not verified.
- Remaining account checks: role/permission list, automated workflow/forwarding, actual retention/deletion and vendors. No sensitive submission screenshots should be committed.
- This does not authorize a fresh live POST, changing shared settings, deploying or enabling WUL approval flags.
