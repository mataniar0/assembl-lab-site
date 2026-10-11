# AL-001 isolated missing-image acceptance proof

This temporary proof branch must never be merged or deployed. PR #8 remains at
`ec28eea7647b6fcafcc5c1c2ac3a1fd82629fb77`; no application files change.

Open a separate draft pull request targeting main to trigger the existing
pull_request workflow. Its checkout, dependencies, permissions, exact-commit
checker, shell pipefail and always-upload artifact controls remain active.
Only the check command invokes a proof helper using the pinned QA interpreter.

The helper clones the checked revision into a disposable local directory,
removes `assets/cards/kids-480.webp`, commits that fixture locally, and runs the
unchanged checker against the exact fixture SHA. It records source SHA, fixture
SHA and missing asset in `missing-image-fixture.json`, and preserves the checker
JSON/log in the existing CI artifact. The checker nonzero exit is propagated to
GitHub Actions, so the run must be red. No fixture is pushed; the source image
and checkout SHA are verified intact before temporary directory cleanup.

Normal pre-push checks still validate every outgoing proof-branch commit. No
hooks, assertions, required checks or repository settings are disabled. This
requires no process exception. After collecting the red run, job log and artifact,
close the proof PR without merging and revalidate the unchanged PR #8 revision.

Acceptance requires an actual remote run with a missing-asset failure, valid
report, nonzero exit, zero real POSTs and a downloadable artifact. Local proof
alone does not satisfy acceptance. No merge/publication is authorized.
