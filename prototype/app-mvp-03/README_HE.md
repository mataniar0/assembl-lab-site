# MVP-03 — Synthetic Provider POC

**Status:** development scaffold, not deployed, not a real image-generation service.

Provider-neutral room-image editing contract based on the approved nightstand Design Intent.

- Validate nightstand dimensions and material fields.
- Build text instructions for editing a *supplied* room photograph without altering the entire room.
- Reject a real-user photo source without explicit consent.
- Never include an API key or send images to a provider.
- Expose a clearly marked *illustrative output-token-only* cost estimate for Gemini Flash Lite.

Run `node prototype/app-mvp-03/contract.test.mjs` from the repository. The test uses only a synthetic fixture and no external services.

**Next:** connect Supabase (or equivalent) and a real image-edit API *only after* private storage, user access control, upload consent, rate limits and cost caps are implemented. A generated image is not CAD or a manufacturing proof.
