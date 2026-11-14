# APP-ARCH-003 — Architecture outline: real in-room furniture visualization

**Status:** DRAFT for engineering review, 2026-11-14  
**Precondition:** Android V0.1 installed; camera verified by user.  
**Delivery objective:** Replace the current browser-only schematic furniture overlay with real, AI-produced visualization while preserving the original customer room image and the manufacturing-oriented design intent.

## 1. Proposed architecture
Android PWA (existing `/app/`) → secure authenticated-or-ephemeral API → guarded job queue → image edit/generation provider → private asset storage → versioned visualization results → user GATE 1 approval.

This is a *proposal*, not a deployed API. Neither model provider, hosting nor budget has been selected.

## 2. Rules
- Maintain the existing QR, PWA `id` and public `/app/` path.
- Do not place an API secret or private photo in HTML, JavaScript bundles, GitHub Pages or a public repository.
- PWA captures photo locally and shows preview before a deliberate consent-gated upload.
- Collect only the minimum necessary image and design instructions. Provide photo deletion and clarify retention and external processing before real upload.
- Stage 1 offers a limited first category: **small freestanding nightstand** with no human-support or infant-safety role.
- Keep original scene image separate from generated composite; preserve product prompt, dimension confidence and edit instruction in structured Design Intent.
- AI results are concept images, not measured geometry or validated manufacturable product.
- Reject or flag unsupported dimensions/requirements and clearly label unverified assumptions.
- Do not automatically call an AI provider on camera activation or on simple navigation.
- Usage limits, cost cap, rate limiting, upload limits, consent checks and job idempotency are required before a public pilot.

## 3. Client screens (V0.2 planned)
1. Existing camera capture → local preview → explicit image upload consent.
2. Nightstand preferences (style, construction-visible appearance, material and dimensions with measured/estimated labels).
3. Generate room visualization with real job state (pending, running, complete, failed, quota exceeded).
4. Compare original room vs generated scene; request targeted edits; store immutable versions.
5. GATE 1 approves a precise immutable result version and freezes its design intent snapshot.

## 4. Minimal server contract (planning, not an existing API)
- `POST /projects` creates a private project, receives opaque project ID.
- `POST /projects/{id}/scene` uploads an image with explicit consent; server validates type, size and ownership.
- `POST /projects/{id}/visualizations` creates idempotent AI generation job for structured Design Intent.
- `GET /projects/{id}/visualizations/{jobId}` returns status and access-limited result URL.
- `POST /projects/{id}/visualizations/{versionId}/approve` records GATE 1 approval.
- `DELETE /projects/{id}` requests deletion according to a published retention policy.
Endpoints are placeholders for architecture discussion; they must not be invoked as real URLs.

## 5. Candidate implementation order
**ARCH-1:** agree privacy, asset retention/deletion, account/guest security, provider and cost ceilings.  
**ARCH-2:** create private backend prototype with fake image fixture; no uploaded real room photographs.  
**VISION-1:** connect a licensed image-edit model behind the server and verify controlled preservation of source room with synthetic photos.  
**VISION-2:** connect Android PWA to API, manually consent-gated, with failure paths and per-user quotas.  
**VISION-3:** Android real-device QA; compare original and generated images, corrections and GATE 1.  
**RELEASE:** independent privacy/security QA, production rollout and test installed-PWA update path.

## 6. Acceptance criteria to advance
- No API keys in client or source repo.
- No non-consensual photo upload, and no public link to a room photo.
- User knows cost/credit impact before remote generations.
- Real image result is a separate immutable asset; original scene is retained only according to a clear, agreed policy.
- Comparison, revisions, return to prior version and exact GATE 1 approval work.
- Local and device QA, negative-path tests, and review report PASS before production.
- The 3D and engineering converters remain explicitly outside V0.2 scope.

## 7. Decisions awaiting review
- Select image provider and backend (cost, quality, privacy, retention, API reliability).
- Temporary guest projects or authenticated user accounts.
- Maximum photo dimensions, size and count; model-generation daily/project cap.
- Initial service cost/payment policy.
- Allowed upload retention and user-controlled deletion window.
