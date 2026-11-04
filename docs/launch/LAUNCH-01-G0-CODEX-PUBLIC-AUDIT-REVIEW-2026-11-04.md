# LAUNCH-01 — PM review of Codex G0 public privacy audit delivery
Date: 2026-11-04
**Decision: PROVISIONAL NO-GO for policy publication and form activation. Evidence review INCOMPLETE.**

## Owner-provided Codex delivery summary
- Source SHAs reviewed: ASSEMBL LAB `2a0fe67d742dec79421a03a9dd10076aba427aa5`; WOOD U LIKE `3a5b855b4bf3b96ad2c8eea28d9d1dbc25caa2d7`.
- 29 code pages and four policy drafts reportedly reviewed.
- Reported outcomes: 16 PASS / 5 FAIL / 10 BLOCKED; 4 P1 and 2 P2 issues.
- Public browser inspection blocked by environment network access; deployed SHA unknown.
- Reported gaps include missing full privacy-policy links and legacy ASSEMBL LAB direct form submission without privacy gate.
- Local branch `qa/launch-01-g0-public-privacy-audit-01`, local commit `e9baae2`, no PR due GitHub network restriction and protected pre-push synthetic request checks.
- No site changes, live form submissions, merges, or deployment reported.

## Independent PM evidence availability
Attempted direct GitHub file fetch by branch and local commit SHA: both returned 404 / no such remote ref. The report at `/workspace/assembl-lab-site/docs/review/launch-01/g0-public-privacy-audit-01/REPORT_HE.md` and local ZIP at `/workspace/assembl-lab-site/.qa-reports/launch-01-g0-public-privacy-audit-01/LAUNCH-01-G0-PUBLIC-PRIVACY-AUDIT-01.zip` are **not independently accessible** in this session. The summary was provided by the owner, not verified line-by-line from report artifacts. Do not claim an independent full QA pass.

## Interpretation / de-duplication
The direct POST path in original ASSEMBL LAB baseline is a known prior issue. PR #21 feature candidate introduced fail-closed approval gates, but until a policy link and integration are verified against the candidate SHA this cannot be accepted as a closed issue. Avoid rerunning baseline suites already covered; target missing links, gate enforcement, and exact-SHA policy integration only.
Do not bypass pre-push protections, fabricate successful public browser evidence, or use real submissions.

## Next steps
1. Obtain report and evidence ZIP as ChatGPT attachments or publish the read-only QA report on an accessible remote review branch via the approved repository workflow, **without bypassing safety hooks**.
2. Map five FAIL cases and blockers to PR #21 and the four latest policy candidates; open a narrow implementation work item for approved HE/EN full policy pages/links with form gates still OFF.
3. Repeat public network/browser verification only from a functioning environment; keep BLOCKED until actually observed.
4. Verify processor and international-transfer terms, versioned owner policy approval, Formspree 2FA before live real data, then G1 current-SHA verification; separate G2/G3 approval.

**Status:** G0 remains NOT APPROVED. No merge/deploy/forms enabled by this review.

## PM follow-up — full Codex REPORT_HE.md text provided, 2026-11-04
The owner supplied the complete `REPORT_HE.md` **as chat text**, rather than just an excerpt. The referenced `CHECKS.json`, `STATIC_INVENTORY.json`, `POLICY_GAP_MATRIX.md`, screenshots and evidence ZIP remain **unavailable for independent inspection**. Maintain a *report-level review* rather than claim comprehensive evidence QA.

**Audited baseline:** ASSEMBL LAB main `2a0fe67d742dec79421a03a9dd10076aba427aa5`; WUL main `3a5b855b4bf3b96ad2c8eea28d9d1dbc25caa2d7`; policy docs base `881d98ba19fec1e797c72bd3d701df7f2a024a20` (older than the updated owner-review candidate). 31 checks: 16 PASS / 5 FAIL / 10 BLOCKED; 4 P1 / 2 P2 findings. 29 statically reviewed pages, only two attempted public page navigations, both blocked. Do not conflate main baseline with subsequent PR #21 or policy docs changes.

**Evidence-based triage of six findings (from report, not ZIP):**
- ENV-01 P1: public browser blocked by `ERR_TUNNEL_CONNECTION_FAILED`; environment-only audit blocker; requires functioning network to close, not a site code fix.
- SITE-01 P1: no published full-policy pages/links in audited main; **OPEN**. Integration work required after policy review.
- SITE-02 P1: ungated direct POST in ASSEMBL LAB main; **OPEN on main**, **MITIGATED IN UNMERGED PR #21 candidate**: direct file inspection on branch `feature/launch-01-g1-form-privacy` confirms `inquiry/contact-config.js` three flags `false` and `inquiry/inquiry.js` requires all three true and valid endpoint before fetch; `inquiry/index.html` action is `#`. This does not prove deployment, final integrated exact-SHA behavior, or public safety.
- SITE-03 P1: short notice absent from audited ASSEMBL main; **OPEN on main**, **PARTIALLY FIXED IN UNMERGED PR #21**, in `inquiry/index.html` and bilingual dictionary. Short notice still lacks approved full policy link and must be checked against controller identity and rights disclosure.
- COPY-01 P2: older WUL marketing/authorized-access wording; **TEXT REVISED IN G0 owner-review draft** based on explicit owner statement of no marketing, updated full 4-policy candidate commit `838bfe060159a4620f6b8b43d8bc271b0459d90b` and updated short notices doc commit `76dbf03ca05fe38cdd371ceb268975bfc9c0676b`. WUL live code **NOT CHANGED**, so mismatch remains for implementation.
- COPY-02 P2: WUL submit payload source/language/UTM/submission-date fields not explicitly described; **OPEN for narrow disclosure review**. Ensure any disclosure accurately describes metadata sent *with inquiry* rather than just browser-stored attributes; verify exact field names against current source before editing policies.

**GO/NO-GO:** NO-GO for publishing full policies and enabling real inquiry submissions. Status of report intake = ACCEPTED AS DOCUMENTARY TRIAGE, NOT INDEPENDENT EVIDENCE-QA PASS. No real submissions/merge/deploy.

**Minimum next implementation:** revise canonical four full policies to clarify WUL inquiry metadata, reconcile short HE/EN notices at site code level, add approved full-policy pages and links, keep Formspree send flags false. On completion, test only the affected candidate paths on exact SHA. Public network audit and service processor terms separate blockers.
