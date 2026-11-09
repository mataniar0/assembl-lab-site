# LAUNCH-01 — Formspree vendor verification update (2026-10-29)
Status: documentary evidence; NOT full supplier legal/security approval.

## Public vendor sources verified
- https://help.formspree.io/articles/account-management/account-limits/ (updated 2025-12-22): Free plan stores 30 days of submission **history** and allows 50 submissions/month, with account notifications at 50%, 75%, 90% and over limit.
- https://formspree.io/plans : free plan described as 50 submissions/month; submission archive 30 days; AJAX supported and domain restriction available.

## Precise interpretation
The 30-day history window refers to availability of submission history in the plan's dashboard. It is NOT evidence that the vendor fully deletes all personal information, backups, email notifications, logs or downstream copies after 30 days. Formspree supplier retention/deletion details, subprocessors, transfers and contractual safeguards require further documentary verification.

## Draft disclosures should say
'Your inquiry is processed using Formspree and may also be delivered to the business email inbox. The availability period of records in Formspree's free dashboard is 30 days; email copies and legally required business records may be retained separately as needed under a documented retention practice. No unconditional backup-deletion time is promised.'
For site-facing text, confirm exact records processing, actual plan, links and final owner-approved retention practice first.

## Already owner-confirmed
Privacy mailbox labassemble@gmail.com approved. Name appearing in drafts confirmed by owner subject to formal registration check; taxpayer status unverified. No lawyer signature per se is an automatic gate. Owner compliance review required.

## Remaining gates
[ ] Vendor retention, privacy terms, DPA and international transfer records verified.
[ ] Confirm actual free plan and any account-specific overrides; distinguish archive availability from storage retention.
[ ] Map deletion of copies in Gmail and offline exports; adopt practical retention schedule.
[ ] Final HE/EN notices checked and approved, no claims beyond evidence.
[ ] Live network verification, G1 QA, G2 controlled test and G3 go-live separate.

No real submissions, merges, deployments or Formspree settings changes were performed.

## Independent vendor-check update — 2026-11-01

Verified against **Formspree** documentation (not similarly named providers):
- Free plan: 50 submissions/month, up to 2 linked notification emails, 30 days submission **history**: https://help.formspree.io/articles/account-management/account-limits/
- Domain restriction available on all plans and configured at project Settings; **caution:** uses Referer header and may mark legitimate users as spam when referer is suppressed (including some Brave setups); do NOT enable unilaterally. https://help.formspree.io/articles/form-and-project-settings/restrict-to-domain
- Over-limit records may remain in an Over Limit folder without notification email or plugins. Reprocessing counts against available monthly quota; manual check required to avoid missed leads. https://help.formspree.io/articles/form-and-project-settings/over-limit-submissions
- CSV/JSON export documented for Personal/Professional/Business plans, NOT Free. https://help.formspree.io/articles/form-and-project-settings/exporting-submissions/
- Team member invitations documented on Professional/Business plans. Free-plan team access features and actual account roles require checking. https://help.formspree.io/articles/account-management/adding-team-members/
- Provider states SOC2 Type II and reliance on SCCs as processor; these are provider assertions, not an account-specific DPA or evidence of exact subprocessor/retention conditions. https://formspree.io/security/

Owner-supplied account evidence from earlier screenshots: shared form enabled, past notifications received at approved `labassemble@gmail.com`, no additional workflow integrations shown, archive and manual delete controls visible, domain restriction not enabled, 50/month observed. Screenshots do not establish all account roles, retention after deletion, backups, cross-border paths, or rights-handling process.

**No-go facts:** Do not claim 30-day full deletion; do not rely on CSV/JSON export for Free plan; do not claim live origin cookie inventory; do not enable Restrict to Domain without explicit operational validation (could affect legitimate submitters).

**Remaining owner-only checks:** roles/login protection (including 2FA), notification recipient list, all workflow integrations, exact plan, inbox/spam/over-limit usage, manual deletion behavior and mailbox copies. Provider terms/subprocessors/DPA and backup handling may require direct supplier response rather than dashboard observation.

**User-approved operational policy:** review inquiries once every three months; delete records no longer necessary subject to legal obligations, across Formspree + email/private exports where practicable. This is not a 90-day automatic destruction promise.

No account access or setting changes were made during this verification.
