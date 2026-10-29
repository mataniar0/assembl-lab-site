# LAUNCH-01 G1 implementation handoff — 2026-10-29

## Completed on Draft PR #21
- Bilingual HE/EN draft collection notice rendered before submission controls on ASSEMBL LAB inquiry form.
- Removed real Formspree destination from HTML form `action`, replacing with local fragment action `#` while retaining configured JavaScript `fetch` behavior. This reduces risk of native fallback third-party POST without JS, but other no-JS behavior remains to be browser-tested.
- Existing WOOD U LIKE public form configuration retained all three false flags; no service settings changed.
- No customer submissions, payments, public activation, merges or deployments executed.

## CI evidence
- `4346f184` CI success.
- `6244dfb` superseded/cancelled, `920478d` was in progress when checked.
- Current form patch `7ef1a62f0cc17086c95d85c9401d3f1291fccaff`: GitHub Actions run https://github.com/mataniar0/assembl-lab-site/actions/runs/40912904494 pending at documentation time. Do not claim PASS for this patch without completed run.

## Blockers
P0 Final accurate legal controller identification, owner-approved HE/EN privacy notice and full policies, live processing/retention disclosures. Current notice is a draft, not a final legally reviewed policy. Full policy link not yet embedded.
P0 Browser verify no-JS, Enter submit, JS error handling, RTL/LTR 320/390/768/1024/1440 viewport, keyboard and screen-reader.
P0 Current-head CI, independent QA at least 90/100 with no blocking bugs before merge.
P0 WUL controlled live test and public activation are separate later gates requiring validated G0/G1 and specific evidence.
P0 Payments, merchant tax eligibility, invoicing, terms and shipping remain unverified.

## Status
G1 code patch created, not yet independently accepted. PR #21 stays Draft. Overall NO-GO, notwithstanding broad owner approval, because independent external facts remain unverified.
