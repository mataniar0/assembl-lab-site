# Site checks

This is a static bilingual website. Keep Hebrew as the default and preserve the inquiry and carousel behavior.

In each new checkout or agent environment, run `python scripts/setup_checks.py` to install the small QA environment and enable the tracked pre-push hook. Preserve any existing custom Git hooks as directed by the installer.

During editing, run `python scripts/check_site.py` for the generic functioning checks. Normal `git push` checks the exact outgoing commit automatically; commit a repair before retrying a failed push. Do not bypass a failed check. Reports are in the ignored `.qa-reports/` directory.

Keep the generic smoke checks independent of colors, titles, grid columns and intentional image crops. Add or update a meaningful check when functionality changes. Design review and the existing comprehensive suites are separate from the minimal gate.

Form tests must intercept requests and must never send a real inquiry or email.
