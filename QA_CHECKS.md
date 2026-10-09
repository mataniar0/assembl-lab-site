# Checks before pushing

The generic smoke checks verify page and asset loading, navigation, language switching, carousel arrows, an intercepted inquiry submission, and horizontal overflow on mobile and desktop. They discover site pages automatically and do not enforce colors, grid columns, image crops or particular product names.

## One-time setup in each checkout

Python 3.10+ and Git are required. Run:

```sh
python scripts/setup_checks.py
```

This creates an ignored `.venv-qa` environment, installs the pinned Python Playwright dependency, uses system Chromium when available or downloads Chromium into `.qa-browsers`, and enables the tracked `.githooks/pre-push` hook for this checkout. Linux environments without Chromium may also need Playwright's documented system browser dependencies. The installer preserves an existing custom hook configuration by stopping with instructions instead of replacing it.

## Run manually

```sh
python scripts/check_site.py
```

This checks the current working files, starts and stops a temporary local HTTP server and browser, and writes `.qa-reports/latest.json`. All inquiry requests are intercepted; the checks never send a real inquiry or email. To select a Chromium executable, use `--browser /path/to/chromium` or set `ASSEMBLE_BROWSER`.

To check exactly what is committed:

```sh
python scripts/check_site.py --commit HEAD
```

## Normal pushes

After setup, `git push` runs the same smoke checks on a temporary snapshot of each outgoing commit. Failed checks stop the push and name the failing checks. Reports appear in `.qa-reports/pre-push-<commit>.json`.

Uncommitted changes do not affect this check: a repaired working file cannot hide a failure in the outgoing commit. Multiple refs to the same commit are checked once; deleting a remote ref has no outgoing site to check. Fix a failure, commit the fix and retry the push.

The hook's code is tracked in Git; enabling it is a local setting that must be repeated in each new checkout or agent environment. Local hooks can be bypassed, so this is not a GitHub branch protection rule. GitHub Actions and mandatory PR checks can run the same command when that remote guard is added.

These are basic functioning checks. Visual review and the existing comprehensive language/mobile suites remain useful for changes to design or behavior. Intentional design changes do not require updating this generic smoke suite's visual expectations.

## Language loading and layout stability

For changes to language initialization or header layout, also run:

```sh
python tests/language_stability_smoke.py --report .qa-reports/language-stability.json
```

This separate regression suite deliberately delays `DOMContentLoaded` so the body paints before the remaining initialization. It checks reserved language controls, translation of the saved language before initialization, stable header/content boundaries and accessible language switching on all 12 pages at 320, 390, 780, 781, 844 and 1440px. Additional cases pause body parsing to check the saved-English first-paint guard, delay the language script and exercise scrolling, anchor visibility, carousel/open-section state and inquiry drafts. Every non-read request is intercepted; no real inquiry is sent.

This is separate from the small automatic pre-push gate. `--base-url`, `--widths`, `--paths`, `--languages` and `--loading-only` allow focused diagnosis without weakening assertions. Saved-language text is translated at the end of each document, before delayed readiness; the regular readiness handler still connects the controls and synchronizes other components.

## Verify the hook itself

For changes to the QA tooling, run the separate integration proof after committing the changes:

```sh
python tests/pre_push_integration.py
```

This uses a temporary clone and a local bare Git remote. It proves that a good commit can be pushed, a broken committed image blocks a push even when the working file is repaired, and committing the repair permits the next push. It also checks duplicate commit refs and deletion-only pushes. It takes about two minutes, writes `.qa-reports/pre-push-integration.json`, and never pushes to GitHub. This proof is not part of the minimal check on every push.
