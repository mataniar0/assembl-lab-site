# APP-MOBILE-001 — Android PWA and QR installation handoff

**Date:** 2026-11-13  
**Status:** CANDIDATE PREPARED LOCALLY / NOT DEPLOYED / ANDROID INSTALL UNVERIFIED  
**Branch:** `feature/app-mobile-001-android-pwa`  
**Deployment URL intended for future install:** https://mataniar0.github.io/assembl-lab-site/app/

## Goal
A reusable QR code opens the fixed HTTPS installation URL of the ASSEMBL LAB PWA. On Android, a visitor opens Chrome and uses "Install app" or "Add to Home screen" as available. This is not an APK and is not a one-click forced installation.

## Current output
Local candidate bundle generated in ChatGPT: `ASSEMBL_LAB_ANDROID_PWA_V0_1_CANDIDATE.zip`. It contains `app/index.html`, `app/manifest.webmanifest`, `app/sw.js`, PNG icons at 192px and 512px, and an Android installation QR pointing to the intended URL. The bundle is **not** hosted at that URL yet. The QR scans to the exact intended URL but **cannot install an unpublished app**.

The candidate is based on the APP-UX-002 schematic nightstand prototype. It adds camera permission and live preview with fallback to gallery/device capture, local-only image handling, standalone display and a service worker caching application shell but not room pictures.

## Validation
- QR PNG was decoded successfully to the intended HTTPS URL using a QR detector.
- HTML DOM interaction test: **30/30 PASS**, including stage 1, versioning, gate 1 and fallback when the camera is unavailable.
- Manifest JSON, icon dimensions and Content Security Policy hashes checked locally.
- **Not validated:** actual Chrome Android install, live camera on physical device, end-to-end HTTPS navigation, real Service Worker update, privacy deployment, independent release QA.
- Attempting localhost URL automation was blocked by a browser environment administrator rule; it is **not** evidence of site failure or success.

## Publication requirements
1. Review and add files from the candidate bundle to the `app/` path in a feature PR. No direct change to existing site or forms.
2. Run independent QA and existing site regression before merge.
3. Approve and deploy the `app/` path through GitHub Pages or another HTTPS host.
4. Verify public HTTP status 200 and installable manifest/icons/service worker.
5. Test on a physical Android phone: scan QR, open Chrome, grant camera permission, capture, gallery fallback, create revision, approve Gate 1, install to home screen.
6. Test update delivery without reinstalling by publishing a new app version.
7. Mark QR **ACTIVE** only when the public URL and install flow are verified.

## Security
No real customer photos should be uploaded in the proof build. Keep photos browser-local and not saved in the Service Worker cache. No engineering file production, external API, user login or personal-data backend in this milestone.

## Next
Add candidate PWA files to branch; review and publish only after QA. The long-term QR URL should stay fixed so printed QR material does not need replacing after each app update.
