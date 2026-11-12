# APP-UX-002 — Interactive Customer Prototype (Stage 1)

**Status:** functional UX prototype only; **not a production app**.

## Run
Download `prototype/app-ux-002/index.html` and open it in a current browser. This is a self-contained HTML file with inline CSS and JavaScript and a hash-based CSP. No external dependencies.

## Working interactions
- Start, choose an illustrated demo room or capture/upload a photo from the device.
- Configure a small freestanding nightstand: finish, drawer count, shelf, desired dimensions and visual size/position.
- Generate a **schematic SVG overlay**, create revisions, compare versions, change a selected version.
- Confirm **GATE 1** for a specific visual version. The approval refers to appearance only and does not initiate any backend or engineering process.
- Switch Hebrew/English and RTL/LTR. Photos remain local to the browser tab.

## Boundaries
- **No AI rendering**, image-to-3D conversion, CAD, nesting or production files.
- No network calls, tracking, persistent storage, or photo upload.
- Text notes are recorded locally but not interpreted by a generation engine.
- No physical dimensions can be established from the illustrative overlay.
- Stage 2 and Stage 3 are **not implemented**.

## QA
Local Playwright Chromium DOM verification: **29/29 PASS** at widths 320/390/768/1280, plus a local photo-selection test. The test environment blocks both `file://` and `localhost` navigation, so verification was done with the HTML/CSS/JS inserted into a page (and a separate standalone CSP smoke test); regular URL deployment, real devices, Safari and Firefox still require testing.

The runnable ZIP and editable 3-file source, screenshots and full QA report are attached in the ChatGPT handoff for this milestone. See `docs/app/APP-UX-002_PHASE1_REVISIONS_AND_APPROVAL_HE.md` for UX requirements.

**Branch:** `feature/app-ux-002-stage1-prototype` (based on docs branch). No merge/deploy.
