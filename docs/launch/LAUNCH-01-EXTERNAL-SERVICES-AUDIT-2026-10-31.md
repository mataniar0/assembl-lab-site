# LAUNCH-01 — External services & live site inspection evidence (2026-10-31)

## Sources checked
- Source code previously audited on both main branches: Formspree xwlvlbno, Gmail email notifications; localStorage language in both; sessionStorage transient campaign attribution in WOOD U LIKE. No claim that other cookies/analytics are absent.
- Public websites attempted via read-only web request on 2026-10-31:
  - https://mataniar0.github.io/assembl-lab-site/
  - https://mataniar0.github.io/wood-u-like-site/
  Both returned tool-access **Internal Error**. Live network audit therefore **NOT COMPLETED**; do not mark third-party/cookie inventory as confirmed.
- Formspree official account limits: https://help.formspree.io/articles/account-management/account-limits/ — free 50 submissions/month, 30 days of dashboard history; no inference of complete backup deletion.
- Formspree official over-limit policy (updated September 30, 2026): https://help.formspree.io/articles/form-and-project-settings/over-limit-submissions/ — over-limit submissions are retained in an Over Limit folder and notification emails/plugins are not executed until reprocessing; deleted over-limit records are permanently removed from that folder per documentation, but comprehensive backup lifecycle remains unverified.
- Formspree export docs: https://help.formspree.io/articles/form-and-project-settings/exporting-submissions/ — exports are documented for paid plans only, so a visible Export button does not prove that export is usable in the user's Free account.
- Formspree system limits: https://help.formspree.io/articles/form-and-project-settings/system-limits — API may return 429 under rate limit; handlers should report failure, not silently claim success.

## Implications for HE/EN policies
- Disclose use of Formspree and separate email notification copies, while avoiding claims about full or automatic deletion after 30 days.
- Browser preferences/campaign attribution are first-party browser storage; cookies and third-party network inventory remain a validation blocker.
- Owner-approved every-three-month inquiry review and deletion where no longer needed subject to legal duties is a review cadence, not a guarantee of automatic 90-day deletion.
- Verify vendor legal terms, international transfers, roles, account capabilities and actual retention beyond dashboard separately.

## Launch gates
G0 unapproved pending legal controller registration identity, genuine network inspection and vendor processing facts. G1 mock CI independent QA pending. G2 live synthetic checks and G3 activation/public merge still blocked. No submission/merge/deploy during this audit.
