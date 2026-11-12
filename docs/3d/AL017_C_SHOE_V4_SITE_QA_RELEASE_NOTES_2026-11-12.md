# AL-017-C — Shoe Rack V4 700 — website 3D viewer release notes
Date: 2026-11-12. Executor: ChatGPT only. Status: candidate; requires exact-head CI review before merge.

## Source and photo caveat
- New model `shoe_rack/media/shoe-rack-v4-700-design-only.glb`, SHA256 `84fbf1bef9a264c399ac800333a899e818a1fdf68c956d6eabdb4a896fa49445`, Git blob `922de6aa237dca1d90126607f8019d987d741b33`.
- Model: 36 source-derived CAD meshes in metres, Y-up; all mesh primitives have original warm wood `COLOR_0` vertex colours; nominal 700×320×520 mm; 6 mm plywood.
- Poster `shoe_rack/media/shoe-rack-v4-700-design-only-poster.webp`, SHA256 `8f0bd4d0d48a07065a2733dd330173bec236446f369acdcf1740490cb7bb1813`, Git blob `054bddc1e36e1d62afe2327eeb8ac771fcf04d06`.
- Model source is V4; source project previously reported STEP 36/36 valid and 630/630 pair checks with 0 substantive interference. These CAD checks were performed in prior milestone; not re-run as part of this website-only release.
- Original website photographs show a pattern consistent with V4, including 7 slats per shelf versus 8 in historical V3 source, **but no calibrated as-built width measurement is available**.
- Page width display changed from 800 mm to `700 mm / V4 DESIGN WIDTH` expressly for the proposed V4 preview. This is **nominal design size, not measured physical product dimension**; original 800mm historical display not claimed as a measured property. Depth 320mm, height 520mm, material 6mm unchanged.

## Website
- Self-hosted click-to-load existing shared `model-viewer`, no new CDN, no new forms.
- Camera orbit, zoom, reset, close, HE/EN translations, accessibility labels, no-JS/WebGL fallback.
- Seven-photo production gallery and all original product photos preserved; other product pages unchanged.
- Expanded existing exact-head six-product asset QA: SHA, GLB mesh count, all shoe primitives use COLOR_0, poster is WebP, correct page path.
- Expanded browser QA: six routes × HE/EN × 5 widths = 60 cases; plus two negative controls for fallback. Site smoke remains 66 cases.
- No real form submissions permitted in tests. No manufacture, weight-bearing, real-world fit or seat-use safety claim.

## Release
- Feature branch `feature/al-017-c-shoe-v4-3d-viewer`.
- The earlier [Draft PR #48](https://github.com/mataniar0/assembl-lab-site/pull/48) also proposes V4 nominal width text; this integration supersedes that staged copy change. Do not merge both.
- Treat as design-only presentation until physical/as-built size checked and use-specific engineering approval separately provided.
- CI / independent QA release review: pending at authoring, to be updated against actual commit. Do not assume deployed without successful merge, Pages and live inspection.
