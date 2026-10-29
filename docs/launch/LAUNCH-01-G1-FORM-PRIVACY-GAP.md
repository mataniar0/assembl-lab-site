# LAUNCH-01 — G1 privacy placement and public-path blocking audit
Date: 2026-10-29 | Status: DEVELOPMENT REMEDIATION REQUIRED; NO-GO

## Verified on main, source inspection only
ASSEMBL LAB `inquiry/index.html` line 327: static form action uses real Formspree endpoint. Line 338: send button initially hidden, and `inquiry/inquiry.js` reveals sending when endpoint is valid, without an equivalent privacy-approved flag in config. No visible privacy-policy / collection notice in inspected form markup. Therefore existing submission route must be reviewed for compliant notice and safe test controls; this is an identified P0 gap, not proven unlawful processing. Do not silently disable public site without owner decision.

WOOD U LIKE `inquiry/index.html` lines 502-504 displays privacy copy in preview while sending blocked; line 538 loads contact-config. `inquiry/contact-config.js` on main still sets formDestinationApproved=false, privacyApproved=false, contactDetailsApproved=false. Current copy and static HTML must be reconciled to approved HE/EN final legal disclosure and full policies prior to activation.

## Implementation acceptance tasks
1. Verify individual legal controller identity, correct brand spelling and exact policies; obtain appropriate approval. Existing drafts contain placeholders and are NOT publishable.
2. For ASSEMBL LAB, ensure clear HE/EN Section 11 notice on the actual form, link to complete policies, and safe test/activation mechanism matching owner approvals while preserving existing inquiry user experience.
3. For WOOD U LIKE, update both HE/EN config and no-JS fallback after owner approval, retaining all fail-closed flags until separate public activation.
4. Link final policies from every form in accessible visible text, test RTL/LTR keyboard, mobile and no-JS behavior.
5. Current-sha mocked POST assertions, a11y and responsive review, independent QA >=90, only then approved merge.
6. Separate owner-approved controlled live submissions and another separate public activation gate.

No code modifications or real transmissions in this audit.
