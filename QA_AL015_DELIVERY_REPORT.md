# AL-015 — Personal Coffee Table

Issue: https://github.com/mataniar0/assembl-lab-site/issues/22
Branch: `feature/al-015-personal-coffee-table`.
Base: `ebeefe308efaf80329e16e42a84d51557878fd58`.
Date: 2026-10-31. No merge or publication authorized.

The new bilingual product page is `table/personal/`, reached through the existing homepage Tables category and a third model card alongside Geometric and Flow. Its quote link prefills `personal-coffee-table` in the existing inquiry form. Existing contact configuration, form endpoint, scripts, other products and image assets are preserved. Only the category description/status, tables listing and inquiry option were extended.

## Mandatory image approval evidence

- [IMAGE_QA.md](table/personal/media/IMAGE_QA.md): all seven change logs, source hashes, optimization dimensions/bytes/reductions and fidelity review.
- [BEFORE_AFTER_CONTACT_SHEET.jpg](QA_EVIDENCE/AL-015/images/BEFORE_AFTER_CONTACT_SHEET.jpg): all seven originals beside their actual edited versions.
- [Seven individual comparisons and chronology](QA_EVIDENCE/AL-015/images/IMAGE_PHASE_COMPLETE.json).
- [Export provenance](table/personal/media/PROVENANCE.json) and [independent reproduction](QA_EVIDENCE/AL-015/images/ASSET_REPRODUCTION.json): 7/7 original hashes and 29/29 regenerated exports match.

This phase was completed and visually reviewed before HTML integration. Original JPEGs and the supplied manifest remain byte-identical in `table/personal/media/sources/`. Ordinary photographic editing only: restrained tonal/white-balance correction and crops; no synthetic background, altered geometry, erased construction marks or changed finish. All full-size tabletop/feet remain visible in finished-product photos. Outputs: 27 responsive gallery WebPs plus two card variants, without upscaling. The seven full versions total 1,317,388 bytes, 26.0% below the original JPEG set; the 480 set is 85.0% smaller. Combined stored responsive variants are not a per-visit download total.

### Factual source corrections and explicit user exception

The manifest's filename `02_finished_front.jpeg` actually depicts unfinished workshop assembly with clamps. Photo 06 shows the finished frontal view and leg/ring structure. The original seven-file order is retained, but bilingual captions describe the real photographed states. These discrepancies are documented rather than silently treating file02 as finished.

The user explicitly approved keeping the original WOOD YOU LIKE plaque in the authentic hero/card photograph: “לאשר שימוש בצילום המקורי עם השלט”. It remains visible and unaltered. This user-approved exception overrides only Issue22's no-cross-brand-sign-in-hero restriction; no WOOD U LIKE website/content was changed.

No dimensions, load capacity, coating chemistry, stock, prices, certification or suitability for seating is claimed. The owner-defined coffee-table name is preserved.

## Verification

- Exact baseline: 61 passed / 0 failed on the base SHA.
- Working candidate generic site gate: 66 passed / 0 failed, including the newly discovered thirteenth page and its inquiry route.
- Focused functional browser QA: 10/10 language/viewport cases at320/390/768/1024/1440 in Hebrew and English. Each exercises all seven slides, responsive image decoding, full-size links, arrow target size/hit testing, wrap, keyboard, swipe, language/state preservation, layout, console and the complete home → tables → personal → prefilled inquiry route.
- Two additional personal-product form journeys use mocked Formspree success, required-field validation and draft preservation; two additional keyboard/visible-focus/Space cases pass. Zero real inquiries.
- Image proof: 7 originals preserved and 29 exports independently reproduced. Existing images and executable scripts are checked byte-for-byte in [preservation.json](QA_EVIDENCE/AL-015/preservation.json).

The first focused run was9/10 because full-page screenshot capture canceled alternate responsive candidates in one Chromium context. Strict functional sessions now run without screenshot operations, retaining the original health assertions; all10 then pass. Screenshots use separate contexts. No application assertion was disabled, and the first failed report is retained. This capture issue does not represent missing image assets.

Commands:

```sh
python scripts/setup_checks.py
python scripts/check_site.py --commit ebeefe308efaf80329e16e42a84d51557878fd58 --report .qa-reports/al015/baseline.json
python scripts/check_site.py --report .qa-reports/al015/generic-working.json
python /tmp/al015_qa.py
```

The normal push hook checks the exact outgoing commit. Its final report/SHA and PR-creation outcome are in the external handoff. Existing GitHub Actions `Site smoke` runs when a PR is opened; local checks are not presented as a remote CI run. If API access is Forbidden, the manager opens the pushed branch PR as authorized in Issue22; remote CI remains pending until then.

## Screenshots and reports

[Browser evidence](QA_EVIDENCE/AL-015/browser/) includes homepage category, three-model table listing, personal product at Hebrew320/390 and English1440. [HE390 product](QA_EVIDENCE/AL-015/browser/personal-he-390.png), [EN1440 product](QA_EVIDENCE/AL-015/browser/personal-en-1440.png), [HE320 product](QA_EVIDENCE/AL-015/browser/personal-he-320.png).

Structured test results are retained in `QA_EVIDENCE/AL-015/`; full photo export metadata and per-image comparisons are linked above. Browser scope is Linux Chromium emulation, not physical Safari/iOS or Firefox. Finish/color fidelity is based on visual comparison to the originals, not a calibrated color measurement.

## Correction accounting and review ownership

Three meaningful revision cycles: (1) internal photo crop/compression revision to retain an underside tab and reduce high-entropy export bytes; (2) pre-integration page-template revision to match shared product CSS; (3) QA capture-session correction after responsive screenshot cancellations. No application repair was required after the functional product checks. Source02/06 role corrections and the plaque exception are recorded separately as input clarification.

The project manager performs final QA, assigns the score and merges only the approved immutable SHA after APPROVED. No numerical approval score is claimed by the implementing agent.
