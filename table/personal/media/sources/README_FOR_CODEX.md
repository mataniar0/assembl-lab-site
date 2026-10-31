# AL-015 — Personal Coffee Table / שולחן קפה אישי
**GitHub Issue:** https://github.com/mataniar0/assembl-lab-site/issues/22
**Repository:** mataniar0/assembl-lab-site
**Priority:** P1
**Recommended performer:** Codex
**Final reviewer and merger:** ChatGPT project manager

## START HERE — Instructions for the implementing agent
1. Open and fully read GitHub Issue #22. The issue is the authoritative source of scope and acceptance criteria.
2. Use all seven **unaltered original** files under `selected_originals/` as the photo input, following `PHOTO_MANIFEST.json`. `SELECTED_CONTACT_SHEET.jpg` is a reference preview only.
3. New product: **שולחן קפה אישי / Personal Coffee Table**, a standalone page under the existing tables section, plus a model card in the Tables family.
4. **Photo improvement is a mandatory implementation subtask**, not just selecting or uploading images. For **each of the seven**:
   - Preserve the original intact, verify its SHA-256 against the manifest.
   - Make subtle exposure, white-balance and contrast corrections.
   - Crop/straighten for composition without cutting off important product features or changing dimensions/geometry.
   - Preserve real wood color, black legs, joinery, workshop detail and faithful finish.
   - Reduce distractions via cropping only. Do not generatively invent or remove physical features, manufacturing marks, painted surfaces, or fabricate a cleaned studio background.
   - Export appropriate WebP responsive sizes and record the actual output pixel widths and compression.
   - Create a **7-image before/after contact sheet** and a per-image `IMAGE_QA.md` log.
5. **Gallery order:** (1) finished hero angled; (2) finished front; (3) pre-finish prototype; (4) assembly clamped; (5) underside detail; (6) leg structure; (7) laser cutting. Each slide must be truthfully labeled in HE/EN.
6. **No false claims:** no guessed measurements, load capacities, materials beyond what the photos substantiate, paint formulations, stock availability, or safety ratings.
7. **Navigation:** homepage Tables category → model listing with Geometric / Flow / Personal Coffee Table → new product → inquiry form with prefilled product name. Preserve all existing products.
8. **QA:** GitHub Actions `Site smoke` green; visual/browser checks at 320,390,768,1024,1440px in both HE/EN; carousel/alt/keyboard/image loading/console and horizontal scrolling; 0 real form submissions. Provide screenshot evidence and image optimization matrix.
9. Push a feature branch and open a PR **without merge**. If API returns 403, provide pushed branch and exact SHA to the project manager, who will open the PR and perform QA/merge after approval. Provide correction round count.
10. Keep WOOD U LIKE, unrelated projects and all legal/contact/payment workflows unchanged.

## Why these photographs?
- `01_hero_finished_angled.jpeg`: best clean finished 3/4/front view, with naturally warm wooden top and painted black legs.
- `02_finished_front.jpeg`: clean alternate finished front view.
- `03_prototype_before_finish.jpeg`: suitable clear stage comparison before final finish.
- `04_assembly_clamped.jpeg`: assembly in progress and joints.
- `05_underside_structure.jpeg`: top / radial structure engineering detail.
- `06_leg_structure.jpeg`: structural curved leg geometry and center ring.
- `07_laser_cutting.jpeg`: laser-cut manufacturing stage.

**Important:** Files here are *unedited*. The implementing agent must produce edited web assets, visual comparisons and evidence as required. The final website must not reference source JPEG filenames by default without appropriate web optimization.
