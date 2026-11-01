# Run history

Date: 2026-11-01. Source commits are fixed in REPORT_HE.md and audit JSON. No production repair was made.

1. Environment preparation: managed runtime was initially provisioning. Initial sandboxed proxy access and socket bind failed. The supported escalated execution path reached the existing Git HTTPS proxy and started the local server without disabling TLS. Cloned the second requested repository; installed isolated Playwright/axe and ran ASSEMBL's required setup installer, preserving hooks. Public HEAD returned proxy 403. GitHub issue HTML was readable; GitHub API requests were Forbidden.
2. Main audit run 1 completed. Guard self-test passed. Found two actual ASSEMBL source defects. The initial production-config assertion incorrectly expected mocked success for a deliberately blocked original POST; corrected to measure whether unapproved original configuration attempted transmission. Added console/pageerror evidence. No original POST escaped the guard.
3. Main audit run 2 completed. Eight screenshots were regenerated with privacy-copy and contact masking after evidence review identified public legal identity in the notice. Original unmasked screenshots were overwritten before staging. The no-JS predicate incorrectly equated visible inputs with an ability to submit. A focused real-browser rerun filled the WUL form and pressed Enter in all three relevant inputs; zero writes and zero query navigations. Controls stay available for reading while the disabled submit prevents ordinary implicit submission.
4. Schema validation identified that the validation message field named `status` overwrote the test outcome. Renamed it `statusText`; did not silently convert historical messages to PASS. Main audit run 3 reran the entire matrix, then focused bilingual/shared-origin and no-JS checks were rerun. Only the final results are used in the report.
5. Independent existing suites: ASSEMBL generic smoke: 66 passed, 0 failed; WUL guarded inquiry suite: 55 passed, 38 simulated POST attempts, 0 real inquiries. WUL guard records 32 fulfillments, excluding held pending/timeout requests. These are separate counters, not evidence of escaped requests.
6. Final evidence review: validate status enums, JSON, source file SHA-256, false WUL flags, no synthetic form draft in storage, screenshot masking, links and reports-only diff. Public deployment checks remain BLOCKED, not PASS. Delivery checks and exact branch are in DELIVERY.md.

**Correction accounting:** three pre-delivery harness correction cycles (production assertion/console evidence; screenshot/no-JS handling; result-schema collision), three complete main audit runs, plus focused reruns. No production-code correction; no reviewer-directed correction; no lead-reviewer correction.

## Reproduction

Use the existing isolated checkouts; do not create worktrees. Start the static server from `/workspace`:

```sh
python3 -m http.server 8001 --bind 127.0.0.1 --directory /workspace
```

In another shell, use the pinned isolated dependencies and run from the report directory:

```sh
export NODE_PATH=/workspace/.privacy-audit-tools/node_modules
node audit-runner.cjs
node supplement-runner.cjs
node nojs-runner.cjs
```

The main runner records observed failures as report data; a successful process exit is not an all-checks PASS. Inspect result status fields. Supplement/no-JS runners update their relevant records after fresh browser checks. Generated report enrichment, existing-suite attachments and delivery metadata are reviewed separately; runners do not create a PR or activate services. Full runs overwrite generated JSON/screenshots intentionally; use a disposable report copy if preserving this evidence.

Existing WUL suite (its built-in network guard must stay enabled):

```sh
cd /workspace/wood-u-like-site
NODE_PATH=/workspace/.privacy-audit-tools/node_modules WUL_CHROMIUM=/usr/bin/chromium WUL_REVIEW_DIR=/tmp/privacy-wul-inquiry node tools/check-inquiry.cjs
```

Existing ASSEMBL smoke: `cd /workspace/assembl-lab-site && python scripts/check_site.py`. Push retains the repository's pre-push checks; no bypass is authorized. Public probes need the inherited proxy and an effective domain allow rule. Do not change TLS verification or send real inquiries when retrying.
