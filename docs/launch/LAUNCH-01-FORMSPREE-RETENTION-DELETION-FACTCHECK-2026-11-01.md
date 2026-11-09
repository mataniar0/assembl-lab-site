# LAUNCH-01 — Formspree retention and deletion fact check
Date: 2026-11-01. Scope: vendor public documentation only. Status: PARTIAL / vendor clarification required.

## Verified official documentation
1. https://help.formspree.io/articles/account-management/account-limits/ — Free tier: 50 submissions/month and 30 days of **submission history**. This is not proof of complete erasure from production database/logs/backups.
2. https://help.formspree.io/articles/form-and-project-settings/over-limit-submissions/ — deleting an **over-limit** submission is described as permanent. Over-limit submissions follow the same retention rules as other submissions; no comprehensive backup-retention schedule is specified there.
3. https://formspree.io/security/ — Formspree states that it regularly backs up critical data systems, but the public page checked does not specify a maximum backup deletion period for individual submitted records.
4. https://help.formspree.io/articles/account-management/deleting-your-account/ — vendor says account deletion occurs within 24 hours. This is a different operation from deleting an individual inquiry and does **not** establish a submitted personal data backup purge deadline.
5. https://formspree.io/plans — Free account archive 30 days; export is not available on Free.

## Confirmed owner account facts
- Shared form notifications to labassemble@gmail.com only; no extra automated forwarding/integrations (owner attestation).
- Only owner has Formspree account access (owner attestation).
- Owner-managed inquiry records are in Formspree and Gmail only (owner attestation).
- Formspree Delete, Gmail Delete and Gmail Trash exist; **no end-to-end actual inquiry deletion performed**.
- Quarterly inquiry review and deletion if unnecessary subject to law approved.
- Formspree 2FA disabled and owner deferred activation: OPEN security task prior to public submissions.

## Open questions for Formspree (not answered by public sources)
- On deleting a normal Inbox submission: is it immediately inaccessible to staff and gone from active storage? Is it recoverable?
- How long until any deleted submission is purged from logs, disaster recovery backups and replicated systems? What are exceptions or legal preservation obligations?
- After 30 days Free-tier submission history, is content actually deleted, inaccessible but retained, or transferred to other storage?
- Which data processing terms/DPA, subprocessor list, processing countries and cross-border safeguards govern this account?
- How can controller request deletion/erasure confirmation for an individual's submission, including processor-held copies?

## Policy language until clarified
- HE: 'פניות שנשלחו דרך האתר מעובדות באמצעות Formspree, ובמקרים המתאימים נשלחות הודעות לתיבת הדוא״ל של העסק. אנו סוקרים את נחיצות השמירה של פניות אחת לשלושה חודשים, ומוחקים מידע שאין עוד צורך לשמור בכפוף לחובות הדין. משך השמירה והמחיקה אצל ספקי השירות, ובכלל זה גיבויים, כפוף למדיניותם ולהסדרים החלים עליהם.'
- EN: 'Inquiries submitted through the website are processed through Formspree and may generate notifications to the business email inbox. We review inquiry records every three months and delete records no longer needed, subject to applicable legal obligations. Retention and deletion by service providers, including backups, are subject to their applicable policies and arrangements.'
These are draft text for owner review, not public approval; avoid claiming 30-day universal deletion.

## Decision
Vendor documentation checked; outstanding P0-03 remains OPEN. Prepared focused supplier inquiry; not sent. No account login, real submissions, deletions, deploy or merge.
