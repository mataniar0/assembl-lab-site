# ASSEMBL LAB — Marketing Demo V1: Cloudflare Pages

Status: GitHub deployment package prepared, not yet a live Cloudflare deployment.

## Frozen revision
- Source branch: release/marketing-demo-2026-11-18
- Source SHA: d05830451a918f00dc484acf985c794443dc36f9
- Deployment branch: deploy/marketing-demo-2026-11-18
- The deployment branch has only packaging and test files added to the frozen source. Ordinary changes on main cannot alter the demo.

## One-time setup
1. Open https://dash.cloudflare.com/ and select Workers & Pages > Create > Pages > Connect to Git.
2. Authorize GitHub repository mataniar0/assembl-lab-site (if prompted, authorize only this repository).
3. Choose repository mataniar0/assembl-lab-site and configure a *separate* Pages project.
4. Set production branch to deploy/marketing-demo-2026-11-18, NOT main.
5. Set framework preset to None / No framework, root directory /, build command to: python3 scripts/build_marketing_demo.py, build output directory to: dist.
6. Project name suggestion: assembl-lab-marketing-demo (the provider must confirm availability). No environment variables or secrets required.
7. Limit preview branch builds to none if available; don't build from main.
8. Click Save and Deploy. Obtain the actual pages.dev project URL from Cloudflare; the app entry path is /app/.

## What gets deployed
Exact V1 application JS/CSS, photorealistic coffee demo, synthetic room, Geometric intro, fixed Personal Coffee GLB after approval and the same-origin offline service-worker shell. / redirects to /app/. Demo includes Geometric reference product page. Unavailable catalogue pages and inquiry route display an INACTIVE demo notice (no real form submission).
Build excludes source QA reports, connected accounts, test code, engineering archives, and private backend tooling. No new external APIs or provider calls.
Search engines are asked not to index this demo. IMPORTANT: the pages.dev address is publicly reachable to anyone with the URL. Add Cloudflare Access if a true access restriction is needed.

## Test after Cloudflare has deployed
- Open the real deployment URL and /app/ on desktop and mobile, in Hebrew and English.
- Check Geometric photo and frame-only 3D. Check exact disclaimer (frame without top).
- Open the demo room: fixed photorealistic coffee image appears with the default preset. Change base or diameter and confirm the empty photorealistic room + dynamic round schematic appears.
- Approve the plan; returned 3D is the original Personal Coffee fixed GLB, not a parametric custom model.
- Test offline reopen after first successful online load, and no-WebGL fallback photo.
- Check /inquiry/ does not send a real inquiry.
- Check /demo-version.json has the exact source SHA listed above.

## Next development version
Keep working in feature branches and main. For an approved future demo, create a new immutable release branch; update the deployment branch only when QA passes. Cloudflare then publishes to the same project URL. Retain V1 as rollback. The release branch is not auto-updated.

## Rollback
Use Cloudflare Pages project > Deployments > previous production deployment > Roll back (if shown). The original V1 SHA remains in GitHub.
