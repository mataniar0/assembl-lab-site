# LAUNCH-01 G1 — Mock QA acceptance review and release gap (2026-10-29)

**Result: G1 PARTIAL PASS / OVERALL NO-GO. No live POST, merge, deployment or change to production forms.**

## Evidence reviewed
- WOOD U LIKE `docs/review/wul-006/activation-readiness/QA_SUMMARY.json` generated 2026-10-19: 290 Chromium scenario records, all reported PASS in five suites; 224 intercepted mocked POST requests and 0 real submissions. Exact test environment and prior failed harness runs documented in the source. This is historical QA, NOT a new test or current-head proof.
- `docs/review/wul-006/activation-readiness/CONTROLLED_TEST_PLAN.json` explicitly marks liveExecutionAllowed=false, maximumAuthorizedPostsNow=0, and suggests a separately authorized one-POST test.
- `inquiry/contact-config.js` on WOOD U LIKE main still has `formDestinationApproved=false`, `privacyApproved=false`, `contactDetailsApproved=false`.
- ASSEMBL LAB `inquiry/contact-config.js` points to the shared Formspree endpoint with email fallback and no matching public approval flags. This is a code configuration observation, not proof of full site or live delivery.
- Owner reviewed Formspree screenshots and confirms shared endpoint, email notifications received in the past, 50 monthly submissions allowed, empty domain restriction input, archive on, delete visible, one email action. This verifies account basics, not a new WOOD U LIKE submission.

## Remaining G1 acceptance gates
1. Current-main regression for both repositories, with exact HEAD SHA, tests and browser evidence (past WUL suite is not current proof).
2. ASSEMBL LAB live-path privacy display and approval approach audited and corrected by reviewed PR as necessary, without silently disabling the existing contact route.
3. Verify actual public HE/EN/RTL/LTR UX, navigation, safety product labels, broken assets, 320/390/768/1024/1440 responsive behavior and accessibility. Mock all network writes.
4. Verify current WUL privacy text conforms to final legally approved HE/EN notice. Current main contains an individual proprietor name; prior owner preference for brand-facing labels does not authorize removal of mandatory controller identity.
5. Independently QA each implementation PR >=90/100 and with no blockers before merge.

## G2 and G3 remain separate
- G2: specific owner authorization for one synthetic live POST, after G0/G1 completion, then actual shared inbox / email check; no automatic retries.
- G3: separate explicit owner authorization to enable WOOD U LIKE public submission, plus reviewed implementation, deploy and verified reception.
- Commercial GO additionally needs verified business/tax documents, payment acceptance, refund/terms, fulfillment and safe product scope.

**Decision:** Continue preparations, do NOT activate.
