# AL-001 — Remote pull-request QA gate

Date: 2026-10-11. Issue: [#4](https://github.com/mataniar0/assembl-lab-site/issues/4).

**Status: implementation and local validation complete; linked PR and actual GitHub Actions acceptance runs blocked by cloud API access. No merge or publication authorized or performed.**

Branch: `feature/al-001-ci`, created from updated `main` at `32aaa325a751a1f7862e5a47076378629e9e0052`.

Implementation commit tested: **`80ffdda9983194ce9994e3276d76249ae71805f8`**. The later evidence commit adds this report and recorded artifacts; the final handoff identifies its SHA separately. No application code changed between them.

## Changes

- Added `.github/workflows/site-checks.yml`: PRs targeting `main` and pushes to `main`; Ubuntu 24.04, Python 3.12, pinned Playwright and its matching Chromium; exact-commit checking through the unchanged `scripts/check_site.py`.
- GitHub Actions pinned to verified official full commit SHAs; `contents: read`, checkout credentials not persisted, no secrets or `pull_request_target`.
- Logs and reports uploaded with `always()` and hidden-file inclusion; 14-day retention. Nonzero checker exits remain failures through `pipefail`.
- Added remote setup, evidence, controlled-failure and branch-protection limitations to `QA_CHECKS.md`.
- Recorded local test evidence and unchanged-site captures in `QA_EVIDENCE/AL-001/`.

## Verifiable local results

| Check | Result | Evidence |
| --- | --- | --- |
| Official `actionlint` 1.7.7 | Exit 0 | [Version, command, authoritative checksum and archive verification](QA_EVIDENCE/AL-001/actionlint-result.json) |
| YAML configuration and all three shell steps | Passed; `bash -n` exit 0 | [Structural and shell results](QA_EVIDENCE/AL-001/workflow-static.json) |
| Generic checker on the exact implementation commit | **61 passed, 0 failed, 0 real posts** | [Individual results](QA_EVIDENCE/AL-001/good-candidate.json), [complete log](QA_EVIDENCE/AL-001/good-candidate.log) |
| Existing pre-push integration proof | **5 passed, 0 failed, 0 real posts** | [Results and complete command/stdout/stderr transcript](QA_EVIDENCE/AL-001/pre-push-integration.json), [log](QA_EVIDENCE/AL-001/pre-push-integration.log) |
| Existing application files | **216 preserved byte-for-byte** | [Baseline hashes and changed-path proof](QA_EVIDENCE/AL-001/scope-proof.json) |

Commands executed:

```sh
python scripts/setup_checks.py
/tmp/al001-actionlint/actionlint -color .github/workflows/site-checks.yml
python scripts/check_site.py --commit HEAD --browser /usr/bin/chromium --report .qa-reports/al-001/good-candidate.json
python /tmp/run_al001_integration.py
```

The last command invokes the existing `tests/pre_push_integration.py` CLI and assertions, with an observer that copies each fixture report after the original `report_for` checks pass. The observer returns the original report unchanged and preserves the runner's exit code; [its complete source](QA_EVIDENCE/AL-001/report-retention-observer.txt) is retained. This allows inspection of the negative JSON after the original test cleans up its temporary repositories. The ordinary uninstrumented reproduction command is:

```sh
python tests/pre_push_integration.py --browser /usr/bin/chromium --report .qa-reports/al-001/pre-push-integration.json
```

## Controlled failure evidence

The existing integration test creates an isolated clone and a **local bare Git remote**. It deliberately commits a reference to nonexistent `assets/pre-push-integration-missing.webp`, repairs only the working file and attempts a normal push. The hook checks the broken committed snapshot, reports the exact missing asset and refuses the push. The local remote remains unchanged. Committing the fixture repair permits the next normal push.

| Fixture revision | Checker result | Full report |
| --- | --- | --- |
| Good implementation `80ffdda9983194ce9994e3276d76249ae71805f8` | 61 passed / 0 failed | [Good fixture](QA_EVIDENCE/AL-001/fixture-reports/80ffdda9983194ce9994e3276d76249ae71805f8.json) |
| Deliberately broken **local-only** commit `3619c5a40beba319cdba49b3a268ce822ca49888` | 46 passed / **15 failed**, rejected push, 0 real posts | [Missing-asset failures](QA_EVIDENCE/AL-001/fixture-reports/3619c5a40beba319cdba49b3a268ce822ca49888.json) |
| Repaired **local-only** commit `b8912b4920a7f3853463c9b76d26afd7c53c494a` | 61 passed / 0 failed, ordinary push accepted | [Repaired fixture](QA_EVIDENCE/AL-001/fixture-reports/b8912b4920a7f3853463c9b76d26afd7c53c494a.json) |

The transcript also proves branch/tag deduplication, deletion-only checks and cleanup with the original HEAD preserved. No broken asset was committed to the development branch or sent to GitHub. This proves the local checker and hook; **it does not substitute for the requested red GitHub Actions run**.

## Screenshots and unchanged scope

Actual local Chromium captures, taken with the existing browser request guard and no real submissions:

- [Hebrew homepage, 390×844 viewport](QA_EVIDENCE/AL-001/screenshots/home-he-390.png).
- [English homepage, 1440×900 viewport](QA_EVIDENCE/AL-001/screenshots/home-en-1440.png).
- [Capture metadata](QA_EVIDENCE/AL-001/screenshots.json).

These are site screenshots, not screenshots of GitHub Actions. The coordinating developer inspected both. The source hash proof shows that all existing files except the QA documentation remain unchanged. `main`, the live site and WOOD U LIKE were not modified.

## Independent review and correction count

Read-only reviewer `/root/al001_ci_review` checked the issue, existing checker, workflow and documentation. It found no implementation defect and confirmed exact-commit checking, explicit matching-browser selection, failure propagation, permissions, request interception and retained evidence. It identified actual remote runs and the linked PR as outstanding acceptance requirements. No numerical full-acceptance score is claimed while those requirements are blocked; the manager reviews the submission.

**Implementation correction cycles: 0.** Review-requested code fixes: 0. The deliberate broken/repair fixture is a test scenario, not a development correction. Network/tool provisioning attempts are environment diagnosis and are recorded separately.

## Blockers and acceptance status

[Network evidence](QA_EVIDENCE/AL-001/network-status.json), [bundled-browser download log](QA_EVIDENCE/AL-001/browser-install.log), [full issue specification read](QA_EVIDENCE/AL-001/issue-spec.md).

- Native Git and the complete public issue page are accessible. GitHub API operations fail with **403 Forbidden during the HTTPS tunnel to `api.github.com`**, including a supported elevated-execution retry. This occurs before GitHub can answer the API request; it is not evidence of rejected repository permissions.
- The cloud environment also blocks `cdn.playwright.dev`. Local tests used installed **Chromium 151.0.7922.173**. The workflow selects Playwright's bundled browser, but its provisioning and execution on an actual GitHub runner remain unverified.
- Required environment action: add `api.github.com` to the cloud environment's allowed domains, preserving existing entries. Add `cdn.playwright.dev` if matching bundled-browser validation is also required locally. Existing authentication is present; no credential value is included or requested in this report. No unknown network allowlist was overwritten.

| Acceptance criterion | Status |
| --- | --- |
| Workflow reuses the existing checker; no visible site changes | Implemented; local evidence supplied |
| Known-good **GitHub Actions** run and artifact URL | **Not run — API/PR blocker** |
| Controlled missing asset produces **red GitHub Actions** run and retained artifact | **Not run — API/PR blocker**; local controlled failure demonstrated |
| Failure blocks merge when branch protection is enabled | Protection is a separate task; not enabled or claimed here |
| No live inquiries or credentials/customer data in evidence | Local form requests intercepted; public/synthetic test evidence only |
| Linked pull request | **Pending API access** |
| Merge or publication | Await manager `APPROVED`; not performed |

After API access is restored: open the linked PR, retain a known-good run and artifact, execute a controlled missing-asset proof in an isolated temporary CI fixture without bypassing the local hook, restore the clean candidate and record the final run/head/checked-merge SHAs. Hand off the actual run/artifact links before requesting approval.
