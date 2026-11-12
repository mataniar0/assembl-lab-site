# APP-UX-002 / Phase 1 — Wireframes and visual design contract

**Version:** DRAFT 0.1, 2026-11-12  
**Scope:** Home, capture room niche, describe desired furniture, generate and approve in-room visual concept.  
**Target device:** Mobile first / HE RTL default / EN LTR.  
**Reference design:** Illustration generated in working session (not embedded in GitHub repository). It is *concept art only*, not running screenshots, and any checks or engineering claims depicted in it are NOT verified. This document is canonical for screen text, states and behavior.  
**Pilot:** small freestanding nightstand; exact dimensions/approved construction not yet set.  
**Stage:** APP-UX-002; no coding, backend, privacy approval or production release.

## A. Design language

Use site identity without duplicating its marketing layout:
- background \`#FCFAF7\`, text \`#20231F\`, accent \`#BA482D\` from home page design; dark-green accents in concept art are **provisional only** and require brand review before implementation.
- Clear typography, large photo area, step progress (1 / 3, 2 / 3, 3 / 3); primary CTA high contrast and at least 44×44 px targets.
- Status text and errors always visible without requiring 3D/WebGL.
- HE/EN labels, RTL/LTR layout, no mixed-direction truncation for dimensions.
- Product images in early mocks are illustrative; app implementation must not misrepresent them as customer-generated or measured physical objects.

## B. Screens

### U00 — Start
- Heading: "רהיט שמתאים בדיוק לחלל שלכם" / "Furniture designed for your space".
- Three step explainer: 1. צילום והדמיה, 2. תלת־ממד, 3. תכנון הנדסי לבדיקה.
- Primary: "התחל פרויקט חדש". Secondary: "איך זה עובד".
- Footer: privacy terms, product limitations, language.
- The word "ייצור" is not used to promise automatic approved fabrication.

### U10 — Camera / upload
- Title: "צלמו את הנישה" / "Photograph your space".
- Main area: live camera *only after user action and permission*, otherwise an upload control with sample framing graphic.
- Main controls: "צלם", "העלה תמונה", "צלם מחדש"; after preview: "השתמש בתמונה".
- Photo tips: wide perspective, adequate light, include floor/wall joints and a reference measure if available.
- Photo source is not automatically trusted for geometry or dimensions.
- Privacy link and explicit notice before remote upload; UI permits reducing/cropping photo and removing identifying details before uploading.
- Missing camera permission must offer upload without a dead end.
- File type/size and blur errors must have actionable guidance.

### U11 — Furniture intent
- Title: "איזה רהיט תרצו?" / "What would you like to add?"
- Pilot category: "שידת לילה" preselected; other categories visibly marked unavailable for pilot, not fake active options.
- Fields: free-text description, preferred style/finish, optional measured niche width/height/depth, optional constraints ("דלת נפתחת", "מעבר פנוי"), measured/estimated/unknown dimension confidence.
- Primary: "צור הדמיה". Secondary: "חזור לצילום".
- Confirmation before any remote image-generation call when costs/usage conditions apply. No payment promise or assumed free limits.
- Form checks: no nonpositive dimensions; reasonable upper bounds set later with engineering team; unmeasured dimensions are not declared exact.

### U12 — Rendering status
- Title: "מכינים הדמיה לחלל".
- Input summary (photo thumbnail + product intent); cancellable or resumable behavior only when actual backend supports it.
- Failure states: provider unavailable, missing image consent, daily quota exceeded, internet lost. Never display fabricated progress percentages.

### U13 — In-room visualization / Gate 1
- Title: "השידה בחלל שלכם" / "Your furniture in your space".
- Primary display is the original scene with generated furniture overlay as one image, plus saved version metadata and generation time.
- Controls: compare alternatives, request change, back to intent, magnify/crop and "אשר הדמיה והמשך ל־3D".
- Informational copy: "זו הדמיה חזותית. התאמה למידות החלל מחייבת מדידה ואימות".
- **Gate 1:** approval event binds project_id + selected_visual_version_id + snapshot of DesignIntent. Clear consent for progressing.
- Altering intent or image creates new version and invalidates dependent previous approvals.

## C. Cross-screen path
\`\`\`mermaid
flowchart TD
A[U00 התחלה] --> B[U10 צילום או העלאה]
B --> C[U11 הגדרת השידה]
C --> D[U12 יצירת הדמיה]
D -->|הצלחה| E[U13 בחירת הדמיה]
D -->|תקלה| C
E -->|שינוי| C
E -->|GATE 1 אישור| F[U20 הכנה למודל 3D]
F --> G[APP-3D-005 קונברטר תלת ממד - שלב עתידי]
\`\`\`

## D. Inter-module handoff — Gate 1 data
\`\`\`json
{
  "project_id": "<server generated>",
  "scene_asset_ref": "<private temporary asset reference>",
  "selected_visual_version_id": "<server generated>",
  "design_intent": {
    "furniture_type": "freestanding_nightstand",
    "description": "<user supplied>",
    "style": "<user supplied>",
    "finish": "<user supplied>",
    "dimensions_mm": {"width": null, "height": null, "depth": null},
    "measurement_status": "unknown"
  },
  "visualization_asset_ref": "<private generated asset reference>",
  "approval": {
    "gate": "VISUAL_APPROVED",
    "approved_version_id": "<selected_visual_version_id>",
    "approved_at": "<server timestamp>"
  }
}
\`\`\`
Illustrative schema for planning, NOT an implemented API. Assets must never be hosted as unrestricted public GitHub Pages paths.

## E. UX acceptance criteria / test cases (not yet performed)
1. A new user can identify the 3 stages and complete U00 → U13 with understandable controls.
2. A denied camera permission provides an upload fallback; no camera stream starts unprompted.
3. Photo upload requires an intelligible privacy notice and consent before transmission to a remote service.
4. Unknown dimensions are visually distinguished from measured values.
5. U13 supports approval of a precise version, not an unversioned gallery image.
6. Editing an approved version revokes approval of its downstream dependent model.
7. All screens have an offline/network failure state and no fabricated success.
8. HE/EN content and layout are meaningfully equivalent.
9. UI actions function by keyboard/screen reader where applicable, with touch targets ≥44 px.
10. User testing includes a person unfamiliar with ASSEMBL LAB; findings and correction counts recorded.
11. No backend, image generation, 3D, engineering or real inquiry is asserted as working until independently verified.

## F. Open decisions
- Shall app start directly in the camera or with an explanation/onboarding screen?
- What exact dimensions are required at which step?
- Image generation quotas and supplier policy, including retention of private room photographs.
- What alternate image/version editing interactions are feasible with chosen image provider?
- UI copy and actual persistence for guest projects, account and deletion.
- What specifically defines an acceptable freestanding nightstand in the initial MVP?

## G. Status
- [x] Screen descriptions and main CTA text drafted
- [x] Gate 1 handoff specified
- [x] Error/privacy states identified
- [x] Concept art generated in conversation, not part of committed GitHub assets
- [ ] Visual mockups reviewed and approved
- [ ] User testing performed
- [ ] Implementation started
- [ ] Functionality tested or deployed
