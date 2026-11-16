# ASSEMBL LAB — APP MVP-09 / Development entrypoint

**Date:** 2026-11-15  
**State:** APP DEVELOPMENT RESUMED — isolated synthetic prototype, not production-ready.  
**Issue:** https://github.com/mataniar0/assembl-lab-site/issues/63  
**Branch:** `feature/app-mvp-09-synthetic-room-review` (created from current main after AL-WB-3D-001 / PR #60).

## What has been implemented
- `app/preview-lab.html`: standalone RTL/HE+EN mobile-friendly staging UI, not linked to the published app.
- `app/preview-lab.css`: purely synthetic illustrated room, nightstand + shadows; no photograph.
- `app/preview-state.mjs`: strict whitelisted, bounded review state for 3 sample scenes (SC-01, SC-02, SC-04).
- `app/preview-lab.mjs`: before/after mode, scene selection, finish, drawers, placement and scale, accessible status.
- `app/preview-state.test.mjs`: 11 offline tests including synthetic-only data whitelisting and no-network policy.
- `.github/workflows/app-visual-review.yml`: CI runs Node 22 syntax and isolated offline tests on feature branch.

## Limitations and explicit exclusions
- Visual only; this is a **schematic render**, not an AI-generated or photographically realistic edit.
- No customer room images, no face/person/EXIF, no notes, no storage, no authentication or Supabase requests, no real AI call, no API keys, no charges.
- Default sample nightstand is only illustrative: 6 mm birch, 1–2 drawers, three finishes. It is **not** manufacturing CAD or structurally approved.
- Existing `/app/` remains untouched, including Android-installed PWA and service worker.
- The original MVP-07 10 PNG fixture images are available in a separate unmerged PR #58, not linked to this standalone preview scaffold.

## Tests (current)
- Source/syntax/unit tests run in GitHub Actions and PASS.
- Real browser interactions, screenshots, detailed accessibility tests and 10-scene fixture comparison are **not yet completed**; don't claim full G2/G3/G4 or request merge yet.
- No live Auth E2E; that is a separate rollout gate in Issue #62 and PR #61.

## Next development iteration — APP MVP-09-B (ChatGPT)
1. Add automated Chromium mobile+desktop interactive tests (scene, before/after, scale/position, language, keyboard focus).
2. Compare the prototype to the 10 synthetic room fixtures from MVP-07 and integrate verified fixture assets only as needed; never use client photos.
3. Improve visual correctness: scale ratios vs available space, floor grounding, responsive clipping, one/two drawer rendering.
4. Capture QA evidence and correction cycle counts; target >=90/100 with zero blockers.
5. After independent review, present PR for explicit approval. Only then consider merging and updating deployed PWA.

## Parallel release-only gate — APP MVP-08-GATE
- [Issue #62](https://github.com/mataniar0/assembl-lab-site/issues/62) holds Supabase Auth settings, two-user real-JWT tests and release approval.
- [PR #61](https://github.com/mataniar0/assembl-lab-site/pull/61) remains open and not merged.
- These gates **do not block local MVP-09 synthetic app development**, but they do block public cloud account features and production image upload.
