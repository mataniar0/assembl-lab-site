# ASSEMBL LAB — Image & Carousel QA Report

Date: 2026-10-06  
Scope: Product Gallery V2 — Home, Geometric, Kids Shelf / 700, Driller Stand / V364

## Final result

**PASS — all requested tasks pass.**

The QA process required **4 full review rounds** before every task reached a passing state at the same time.

## Task status — before vs after

| Task | Before changes | Changes applied | After changes | Result |
|---|---|---|---|---|
| 1. Restore Geometric carousel images | The V2 Geometric page contained only 3 slides; the original six-stage Build Story was no longer present. | Restored the original PLAN, LASER CUT, COMPONENTS, ASSEMBLE and FINISH images from the verified V1 source, plus the final OBJECT image. Final correction embeds the five original JPEG payloads directly in the Geometric page so the page does not depend on a binary transfer step. | 6/6 stages present: PLAN, LASER CUT, COMPONENTS, ASSEMBLE, FINISH, OBJECT. Five restored source images are unique. | **PASS** |
| 2. Validate and fix image quality/sizing for desktop + mobile | Geometric used crop-oriented fitting; the home Geometric card used a very wide 16:7 crop. Kids Shelf and Driller Stand used 4:3 sprite frames inside a 1:1 mobile Hero, which could expose/crop adjacent sprite content. Several carousel stages also used zoom transforms that intentionally cropped edges. | Geometric carousel uses `object-fit: contain`; home featured Geometric card changed to 16:9 desktop and 4:3 mobile with contain fitting. Kids and Driller Hero containers are forced to 4:3 at all breakpoints. Carousel zoom transforms are neutralized to preserve the full frame. Driller's original-workshop section now uses the actual 1200×1600 source photo with contain fitting. | Visible product imagery is matched to its source aspect ratio and stays within source-resolution budget at the audited desktop/mobile layouts. | **PASS** |
| 3. Arrows on every product carousel | Geometric, Kids Shelf and Driller Stand already had arrow controls in the current product pages, but they required regression verification after the image/layout changes. | Retained and verified two arrow buttons on every carousel, with accessible labels, click handlers, keyboard navigation and touch-swipe support. Mobile arrow targets remain 46×46 px. | Geometric: 2 arrows; Kids Shelf: 2 arrows; Driller Stand: 2 arrows. | **PASS** |
| 4. Produce before/after QA report | No consolidated report existed. | Created this report with baseline status, applied fixes, final state, test evidence and review-round history. | Report committed to the repository. | **PASS** |
| 5. Count repeated review passes | No iteration count was tracked. | Every QA cycle was logged until all tasks passed simultaneously. | 4 full QA rounds. | **PASS** |

## Image-size audit

### Geometric
Restored carousel source dimensions:
- PLAN: 1122×1402
- LASER CUT: 1125×1500
- COMPONENTS: 1125×1500
- ASSEMBLE: 1125×1500
- FINISH: 844×1500
- OBJECT / final: 1672×941

The carousel viewer remains 4:3 and the images use `object-fit: contain`. The portrait build images are therefore downscaled by height rather than enlarged/cropped.

### Kids Shelf / 700
- Sprite: 1000×4500
- 6 stages
- Effective frame: **1000×750 (4:3)**

Hero and carousel viewer are both 4:3 after the fix. Mobile 1:1 Hero framing was removed. Stage zoom cropping is disabled.

### Driller Stand / V364
- Build Story sprite: 1000×3000
- 4 stages
- Effective frame: **1000×750 (4:3)**
- Original workshop photo: **1200×1600**

Hero and carousel viewer are both 4:3 after the fix. The original-workshop section uses the original photo file directly with `object-fit: contain`.

### Home product gallery
- Geometric final image: 1672×941; 16:9 desktop card, 4:3 mobile card, contain fitting.
- Kids Shelf and Driller Stand product cards remain 4:3, matching their effective 1000×750 final sprite frames.

## Carousel-control audit

| Product | Slides / stages | Previous arrow | Next arrow | Keyboard | Swipe | Result |
|---|---:|---|---|---|---|---|
| Geometric | 6 | Yes | Yes | Yes | Yes | PASS |
| Kids Shelf / 700 | 6 | Yes | Yes | Yes | Yes | PASS |
| Driller Stand / V364 | 4 | Yes | Yes | Yes | Yes | PASS |

## QA rounds

### Round 1 — baseline audit
- Task 1: **FAIL** — original Geometric Build Story images missing from V2 carousel.
- Task 2: **FAIL** — mobile 1:1 Hero mismatch for 4:3 sprite frames; crop/zoom issues identified.
- Task 3: **PASS** — arrow controls existed on all three current product carousels.
- Overall: **FAIL**.

### Round 2 — local corrected-state audit
- Task 1: **PASS locally** — six-stage Geometric structure restored.
- Task 2: **PASS locally** — aspect-ratio/fitting rules corrected.
- Task 3: **PASS** — arrow controls and interaction code retained.
- JavaScript syntax check: **PASS** for all three product pages.
- Overall: **PASS locally**, pending deployed-artifact verification.

### Round 3 — GitHub Pages build-artifact audit
- Task 1: **FAIL** — QA detected an image-mapping error: stage 02 duplicated stage 01 and the FINISH photo had been omitted from the binary mapping.
- Task 2: **PASS**.
- Task 3: **PASS**.
- Overall: **FAIL**. The release was not accepted.

### Round 4 — corrected-source + regression audit
- Restored Geometric images were remapped by explicit `data-code`, then embedded from the verified original V1 JPEG payloads.
- Five restored Geometric payloads verified as unique.
- Geometric structure verified at 6 slides / 6 steps.
- Responsive image rules rechecked.
- Arrow controls, labels, click handlers and swipe handlers rechecked.
- Concurrent repository commits were compared against the site-fix commit; unrelated changes affected Etrog Box files only and did not alter the four site pages.
- Overall: **PASS**.

## Verification methods

- GitHub repository/branch comparison.
- GitHub Pages build-artifact inspection.
- Source raster dimension inspection.
- HTML/CSS breakpoint and aspect-ratio audit.
- Carousel DOM/selectors and interaction-handler audit.
- JavaScript syntax validation using Node.js.
- Regression check after unrelated concurrent commits.

Note: automated local Chromium navigation was blocked by the execution sandbox, so acceptance is based on source-dimension checks, DOM/CSS/JS validation and inspection of the exact GitHub Pages build artifact rather than a local browser screenshot.

## Commits

- Responsive/media restoration package: `26c2e4d749b95197c51f992b1bd3721ab90c20e6`
- Verified original Geometric image embedding correction: `0f6a90ea5bd24dfb50637b5f7239e566674cdeee`

