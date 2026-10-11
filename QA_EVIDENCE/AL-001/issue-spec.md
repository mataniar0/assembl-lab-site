# AL-001 | Add mandatory CI checks for pull requests

Source: https://github.com/mataniar0/assembl-lab-site/issues/4
Read: 2026-10-11; comments: 0

## Objective
Add a remote, repeatable QA gate to pull requests without changing live site content.

## Scope
- Work from updated main on `feature/al-001-ci`.
- Add GitHub Actions workflow on PR to main and push to main, reusing `scripts/check_site.py`.
- Provision Python/Playwright/Chromium reliably, retain test reports as artifacts even on failure.
- Form tests must intercept requests; no live Formspree inquiry.
- Document setup and limitations. Do not modify WOOD U LIKE.

## Acceptance criteria
- Green run on a known-good candidate.
- Controlled broken asset causes red CI run with evidence.
- Failure blocks merge once branch-protection is enabled (protection is a separate task).
- No credentials or customer data exposed; no visible site changes.
- Record commands, URLs to workflow runs, artifacts, exact commit SHA and correction count.

## Handoff / publishing
Open PR linked to issue, report results and screenshots/logs. **Do not merge or publish until manager APPROVED** (score ≥90/100; no blockers).
