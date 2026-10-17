# AL-007 — product status and media labels

Issue: [#5](https://github.com/mataniar0/assembl-lab-site/issues/5). Date: 2026-10-15.
Branch: `feature/al-007-product-status`.
Base/main: `be50dc06467b252929ae59a9703fefce0ab616df`.
Reviewed application SHA: `086adef5477a615c2abc2b3ccc907e644648d731`.
The subsequent evidence-only commit records this report, screenshots and review; its exact pushed SHA is supplied in the handoff and final pre-push report.

The catalog now distinguishes product lifecycle from the type of image shown. The Shoe Rack card states that the product is assembled in raw plywood before finishing while explicitly retaining its existing rendering. Flow is identified as a planning-stage model with no available product photographs. No finished product or photograph was fabricated.

## Scope and content changes

- All eight homepage cards have bilingual lifecycle labels. The tables family shows Geometric as built and Flow as planning, rather than assigning one lifecycle to both models.
- Geometric, Kids Shelf and Driller Stand pages identify built products and their product photographs. The mixed Geometric planning sheet is separately labeled planning/renderings with documentary process photographs.
- Unsupported finishing/process/readiness wording on the shelf and drill stand was replaced with direct descriptions of the assembled objects visible in the photographs. This does not assert painted or coated finishes.
- Flow's table-family card and detail page explicitly state that product photographs are not available. Its placeholder and DXF download remain. The existing inquiry planning notice is enabled for the Flow option; the option value, links, form action and scripts remain unchanged.
- The four existing development projects retain their planning/render notes, technical drawing labels and crib safety note. The Shoe Rack product page, all six production photographs and its separate planning slide are unchanged.

Application files changed: `index.html`, `table/index.html`, `table/flow/index.html`, `geometric/index.html`, `shelf/kids/index.html`, `driller_stand/index.html`, `inquiry/index.html` and `assets/tables.css`. The CSS change only provides legible wrapping for the new table-status text. No language initialization, header behavior, image framing, carousel script, payment code, WOOD U LIKE content or Formspree endpoint was changed.

## Complete before/after matrix

The [browser-observed bilingual matrix](QA_EVIDENCE/AL-007/status-matrix.md) lists every homepage card, both table-model cards and all nine linked product pages before and after the change. [Raw JSON](QA_EVIDENCE/AL-007/status-matrix.json) retains visible descriptions, status labels, image alternatives and media provenance. [Baseline audit](QA_EVIDENCE/AL-007/baseline-audit.md) records sources and uncertainties.

| Product/model | Resulting lifecycle | Media distinction |
| --- | --- | --- |
| Tables family | Geometric built; Flow planning | Card photograph is Geometric, not Flow |
| Geometric | Built | Product photograph; mixed planning/render sheet clearly identified |
| Kids Shelf | Built | Workshop photograph of the assembled shelf; no coating claim |
| Driller Stand | Built | Workshop/product photograph; no coating or readiness claim |
| Shoe Rack | Assembled raw plywood, before finishing | Existing homepage rendering; six authentic product-page photos and separate planning slide |
| Flow | In planning; product photographs unavailable | Existing no-photo placeholder and design files; no invented image |
| Workbench | In development / Planning | Rendering and planning drawings |
| Bedside Crib | In development / Rendering | Renders and cutting-layout drawing; existing safety note retained |
| Etrog Box | In development / Planning | Render and technical/planning drawings |
| Megillah Case | In development / Planning | Render and V8.2.2 planning drawings |

Lifecycle labels describe available project evidence, not stock, commercial availability, certification or an undocumented painted finish. Missing Flow photographs do not prove that no physical prototype exists.

## Validation and evidence

All five required widths were tested in Hebrew and English: **320, 390, 768, 1024 and 1440**. Browser scope is Linux Chromium with mobile emulation; physical Safari/iOS and Firefox were not tested. All non-read requests were intercepted; no real inquiry or email was sent.

| Check | Result | Evidence |
| --- | --- | --- |
| Independent baseline, isolated archive of base SHA | 110 passed, 0 failed | [JSON](QA_EVIDENCE/AL-007/baseline-checks.json), [log](QA_EVIDENCE/AL-007/baseline-checks.log) |
| Integrated status/layout/navigation checks | 200 passed, 0 failed; 110 page cases + 90 navigation journeys; 160 carousel transitions | [JSON](QA_EVIDENCE/AL-007/acceptance-first.json), [log](QA_EVIDENCE/AL-007/acceptance-first.log) |
| Final observational captions | 20 passed, 0 failed | [JSON](QA_EVIDENCE/AL-007/final-captions.json), [log](QA_EVIDENCE/AL-007/final-captions.log) |
| Direct lifecycle consistency comparisons | 90/90 match | [Matrix](QA_EVIDENCE/AL-007/status-matrix.md) |
| Generic site smoke | 61 passed, 0 failed, 0 real posts | [Working-tree JSON](QA_EVIDENCE/AL-007/generic-working.json) |
| Existing table-family journeys, download and inquiry prefill | 6 passed, 0 failed | [Recorded command result](QA_EVIDENCE/AL-007/table-model-journeys.json) |
| Image and behavior preservation | 112 existing images byte-identical; all 12 pages retain image references/geometry, carousel order/attributes, links, form methods/actions and executable scripts | [Proof](QA_EVIDENCE/AL-007/preservation.json) |
| Source binding to reviewed application SHA | All eight changed application files match; both corrected-caption sources match their final checks | [Binding](QA_EVIDENCE/AL-007/final-commit-binding.json) |

Checks include image decoding/CSS background loading, visible labels and font sizes, translated captions, language changes, console/network errors, header and horizontal fit, real card/model navigation, inquiry product prefill, planning-notice classification and existing carousel controls. No baseline failure was excluded.

The 200-case suite began before two descriptive captions were refined. Those changes did not alter statuses, geometry or behavior. The separate 20 cases validate the final exact caption content in both languages at every required width, with hashes matching the reviewed commit. The generic working-tree report is not presented as an exact-commit CI result. Normal `git push` runs the existing gate against the exact outgoing commit; its final report is included in the external delivery bundle. No maintained QA tooling or assertion was changed, so the hook integration suite was not rerun for this copy/markup change.

Commands used:

```sh
python scripts/setup_checks.py
python scripts/check_site.py --report .qa-reports/al007/generic-working.json
python tests/table_models_smoke.py
.venv-qa/bin/python /tmp/al007-qa/acceptance.py --root /tmp/al007-baseline-site --baseline --output /tmp/al007-qa/baseline-checks.json
.venv-qa/bin/python /tmp/al007-qa/acceptance.py --output /tmp/al007-qa/acceptance-first.json
.venv-qa/bin/python /tmp/al007-qa/final_captions.py
.venv-qa/bin/python /tmp/al007-qa/preservation.py
```

The task-specific assertion helpers are retained with the evidence; they use the workspace checkout's existing test guards and Playwright environment and are separate from the maintained generic gate.

## Screenshots

Raw screenshots reset scroll position before capture. [Manifest](QA_EVIDENCE/AL-007/screenshots-manifest.json) records file dimensions and hashes. Eight baseline and twenty after screenshots cover the catalog, table hub, Shoe Rack, Flow, the three built-product openings and final shelf/drill stages.

| View | Before | After |
| --- | --- | --- |
| Homepage, Hebrew 390 | [PNG](QA_EVIDENCE/AL-007/before/home-he-390.png) | [PNG](QA_EVIDENCE/AL-007/after/home-he-390.png) |
| Homepage, English 1440 | [PNG](QA_EVIDENCE/AL-007/before/home-en-1440.png) | [PNG](QA_EVIDENCE/AL-007/after/home-en-1440.png) |
| Tables, English 1440 | [PNG](QA_EVIDENCE/AL-007/before/tables-en-1440.png) | [PNG](QA_EVIDENCE/AL-007/after/tables-en-1440.png) |
| Flow, Hebrew 390 | [PNG](QA_EVIDENCE/AL-007/before/flow-he-390.png) | [PNG](QA_EVIDENCE/AL-007/after/flow-he-390.png) |

## Review, correction count and release control

Independent review: [AL-007 review](QA_EVIDENCE/AL-007/INDEPENDENT_REVIEW.md). First integrated committed submission: **100/100**, all rubric categories covered. This is a score for implementation and local evidence, not approval to merge or publish.

**One factual-copy correction before the first integrated submission** removed unsupported process/readiness wording from two delegated captions. It was authored by the label agent. **Zero corrections after the first integrated submission; zero coordinator-authored code repairs.** No numerical score was invented for the earlier uncommitted subtask draft.

Implementation: `/root` plus `/root/al007_product_labels`; baseline audit: `/root/al007_catalog_audit`; independent acceptance: `/root/al007_acceptance`. Prefer observable descriptions and capture application hashes before long browser runs in future submissions.

No merge or live publication has occurred. A PR must link Issue #5 and remain pending project-manager **APPROVED**. Native Git access works; prior GitHub API access was Forbidden. The handoff records the actual PR-creation result and any external action still required, rather than treating local tests as remote CI evidence.
