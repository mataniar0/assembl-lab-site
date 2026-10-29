# LAUNCH-01 / G1 — PR #21 verification and open blockers
Date: 2026-10-29. Scope: `feature/launch-01-g1-form-privacy`, commit `4346f184e690a1a0492c959a46194a42514c45ce`.

## Evidence
- GitHub Actions run https://github.com/mataniar0/assembl-lab-site/actions/runs/40911738456 reports `Site smoke` SUCCESS, completed; no failed steps.
- Branch adds HE/EN form notice to `inquiry/index.html`. This is code-level implementation but not finalized legal copy.
- No endpoint, form activation logic, Formspree flags, customer submissions, payment or deployment were changed.
- No independent browser/visual accessibility inspection was completed here; do not infer 90/100 score from CI.

## Blocking review findings
1. **P0:** Site lacks approved full HE/EN privacy policy linked visibly from inquiry. Draft document has unresolved placeholders and should not be published as-is.
2. **P0:** Exact individual legal data controller identification remains unverified; ASSEMBLE LAB trade name may not alone suffice. Must reconcile requested brand display with mandatory identity.
3. **P0:** Existing ASSEMBL LAB Formspree flow can POST without equivalent explicit approval flag; review exposure and privacy before any launch authorization.
4. **P1:** Manual HE/EN/RTL/no-JS/mobile and screen-reader spot checks not evidenced on this new change.
5. **P0:** WOOD U LIKE still needs reviewed final legal copy and a separately authorized controlled test; its approval flags must stay false.

## Decision
CI PASS on known commit, **independent QA / merge recommendation BLOCKED**, no numeric QA score assigned without full evidence. PR remains Draft. Separate G2 real POST and G3 owner go-live approvals remain mandatory. No merge/deploy authorized by this review.
