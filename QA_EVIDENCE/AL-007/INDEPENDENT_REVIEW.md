# AL-007 independent acceptance review

Task: Issue #5, align catalog lifecycle statuses and media provenance.
Reviewer: `al007_acceptance`; implementation: coordinating Codex agent plus `al007_product_labels`.
Branch: `feature/al-007-product-status`.
First integrated application submission reviewed: **`086adef5477a615c2abc2b3ccc907e644648d731`**.
Baseline: `be50dc06467b252929ae59a9703fefce0ab616df`.

**Local acceptance passed. Ready for project-manager PR review; this does not authorize merge or publication.**

## Results and reproducible evidence

- Independent baseline: **110/110** page cases passed on an isolated `git archive` of the baseline, covering homepage, table hub and nine product pages at 320/390/768/1024/1440px in Hebrew/English. No baseline failures were excluded. See `baseline-checks.json` and `.log`.
- Integrated candidate: **200/200** cases passed: **110** page cases plus **90** genuine homepage-card/model/inquiry navigation journeys. Page checks include language/direction, header fit, visible status label fit, complete images and CSS backgrounds, image geometry, horizontal overflow, console/network errors, language switching and existing carousel controls (touch/click and Space/Enter). Journeys validate destination, persisted language, product prefill and planning notice classification. **160 carousel transitions** succeeded. See `acceptance-first.json` and `.log`.
- Final observational-caption repair: **20/20** cases passed, kids stage 5 and drill stage 4 at every required width/language, selecting the actual stage and switching languages without losing state. Exact final captions, translations, layout, image geometry/resources and console were checked. See `final-captions.json` and `.log`.
- Direct browser-observed status consistency: **90/90** home/hub-to-product lifecycle comparisons matched at all widths/languages. See `status-matrix.json`; the readable matrix covers **all eight homepage cards, both table model cards and all nine product pages** in Hebrew/English.
- Preservation: **112/112 existing image files are byte-identical**. Across all 12 existing HTML pages, image references/srcsets/dimensions/styles, carousel step codes/layout/order, arrow attributes, all links, form actions/methods and non-JSON script bodies are unchanged. Formspree URL set is unchanged. See `preservation.json`.
- Coordinator's `.qa-reports/al007/generic-working.json` inspected independently: **61 passed, 0 failed, 0 real posts**. This is a working-tree report (`checked_commit: null`); the normal exact-commit pre-push gate remains the coordinator's final publishing-branch check. Coordinator also reports six passing table-model journeys; retain that command log with the handoff.
- All browser write requests were intercepted; **zero real inquiries/posts**. No payment, WOOD U LIKE or endpoint change was found in the eight-file application diff.

The main 200-case run began before the final two descriptive captions were corrected. Those changes did not alter status labels, DOM geometry, navigation or scripts. The separate 20 final-caption cases record SHA-256 values for the corrected source files; both exactly match the reviewed commit. `final-commit-binding.json` also confirms all eight application files match that commit. Do not describe the earlier 200-case run as an exact-commit snapshot run.

Commands (helpers stay outside maintained tests):

```sh
.venv-qa/bin/python /tmp/al007-qa/acceptance.py --root /tmp/al007-baseline-site --baseline --output /tmp/al007-qa/baseline-checks.json
.venv-qa/bin/python /tmp/al007-qa/acceptance.py --output /tmp/al007-qa/acceptance-first.json
.venv-qa/bin/python /tmp/al007-qa/final_captions.py
.venv-qa/bin/python /tmp/al007-qa/preservation.py
.venv-qa/bin/python /tmp/al007-qa/make_matrix.py
```

## Content and visual findings

Shoe-rack card now states the assembled raw/pre-finish lifecycle while explicitly identifying the unchanged card rendering; its product page retains six real pre-finish photographs and separate planning. No finished/painted photo was created or claimed. Flow is explicitly in planning on its hub/card/page, retains its no-photo placeholder, and its inquiry selection uses the existing planning notice. Geometric, kids shelf and drill stand have built statuses and correctly identified photographs; planning/render boards remain distinguishable from photographs. The other four development products retain accurate lifecycle and existing render/planning labels.

The reviewer inspected the English desktop catalog and table hub, Hebrew mobile catalog/Flow/Geometric, English desktop shoe page, and final kids/drill stage screenshots. Status text is readable and wraps; styling and existing image framing are preserved. Evidence contains **8 before PNGs and 20 after PNGs**, including the exact four final-stage captures. `screenshots-manifest.json` identifies dimensions and SHA-256 values.

## Score and correction accounting

First integrated submission: **100/100** under `AGENT_REVIEW.md`: requirements **35/35**, validation **25/25**, presentation/accessibility **20/20**, change quality **10/10**, evidence/handoff **10/10**. No categories excluded. No application finding remains open. The score covers the reviewed application plus supplied local evidence; remote publication remains an operational step, not an inferred successful action.

Before first integrated submission, coordinator review requested **one** factual-copy correction from the delegated label agent: replace unsupported process/readiness claims with direct observational captions. It was implemented by that agent, with zero reviewer-authored application repairs. No numerical score was assigned to the uncommitted subtask draft. **Zero** repair cycles followed the first integrated commit reviewed here.

What went well: exact image/script/link preservation, complete bilingual lifecycle consistency, honest treatment of missing Flow/finished shoe photography, and independently inspectable results.

Next delivery improvements: prefer observable image descriptions before making process/readiness claims; record application hashes before a long browser run so evidence binding is immediate.

Limitations: this is local Chromium validation, not a remote GitHub Actions result or live-site verification. PR creation, remote check status, final pre-push result, and any merge/publication are reported separately by the coordinator. No merge or deployment was performed by this reviewer.
