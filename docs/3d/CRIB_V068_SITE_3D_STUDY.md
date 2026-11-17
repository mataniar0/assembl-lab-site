# AL-CRIB-3D · V0.6.8 website concept update

**Release scope:** a CAD design-study preview on the existing bilingual /crib/ product page and home product card. **No sale, quote, infant use, manufacturing release, or physical safety claim.**

## Source and provenance
- Source technical model: `mataniar0/assembl-lab-engineering`, branch `feature/crib-v068-design-only-3d-20261117`, commit `1585cc3e4eaec86038ac1f3361f92faada5b771e`.
- Measured mattress 1200×600×150 mm, overall height 880 mm.
- Three-side model: unoccupied display prototype ONLY.
- Four-side model: future conceptual crib, not approved for sleeping.
- Existing historical images and V0.5 layout are labeled as previous/outdated design and **not approved for cutting**.

## Website files
- `crib/media/crib-v068-three-sides-web.glb` (meter-scale browser adaptation, source CAD mm geometry × 0.001).
- `crib/media/crib-v068-four-sides-web.glb` (meter-scale browser adaptation; includes illustrative mattress).
- `crib/media/crib-v068-design-study.webp` (combined rendering).
- `crib/media/crib-v068-three-poster.webp`, `crib/media/crib-v068-four-poster.webp` (model-derived posters).
- `crib/index.html`: bilingual explanatory copy, 2 opt-in interactive viewers using pre-existing `assets/three-preview.js`, explicit `DESIGN_ONLY / NO_INFANT_USE` disclosures and no inquiry CTA.
- `index.html`: refreshed crib card image, caption and status.

## QA performed by author (NOT independent QA)
- 12 static integration checks passed (translations JSON parses, 2 viewer instances, unique ids, shared script loads once, paths used, no crib inquiry CTA, historical cut plan labeling, unaffected other catalog card).
- Web GLBs reopened via trimesh: exact extents **1.344 × 0.744 × 0.880 meters**.
- Source GLBs in engineering repo remain **1344 × 744 × 880 millimeter** coordinate extents.
- No browser screenshot/keyboard/cross-device run or external QA yet: `NOT_RUN`.
- No physical, structural, safety or release testing: `NOT_RUN`.

## QA and rollout gate
This PR must not be merged or deployed until independent website QA confirms bilingual copy, responsive layout, viewer open/close/keyboard/error flows, actual GLB loading, privacy/contact flow regression, and asset integrity. Project lead applies site QA score >=90/100 with no blockers. Do not interpret web viewer success as crib safety certification.

See engineering [CRIB-066 #41](https://github.com/mataniar0/assembl-lab-engineering/issues/41) and [CRIB-068 #42](https://github.com/mataniar0/assembl-lab-engineering/issues/42).
