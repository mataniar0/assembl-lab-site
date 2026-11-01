# LAUNCH-01 G1 — CI verification as of 2026-10-29

## Current production SHAs
- ASSEMBL LAB main `ebeefe308efaf80329e16e42a84d51557878fd58`, dated 2026-10-17.
- WOOD U LIKE main `600cf71236828040cb32f8a0b9d102e52c4c4412`, dated 2026-10-20.

## Verified GitHub Actions on 2026-10-29
- WOOD U LIKE scheduled Nightly `40815089310`, head exactly current main SHA, completed success. Browser inquiry/media/attribution jobs observed success, plus plan. https://github.com/mataniar0/wood-u-like-site/actions/runs/40815089310
- ASSEMBL LAB PR `40910058989`, head `c553b2fc938e62e826349d74b1397fac0eb70229`, completed success, `Site smoke` job success. This validates that PR commit, not the most recent PR head or external production service. https://github.com/mataniar0/assembl-lab-site/actions/runs/40910058989
- ASSEMBL LAB latest seen main push `39056094015` on 2026-10-17 completed success. No newer main commit observed. https://github.com/mataniar0/assembl-lab-site/actions/runs/39056094015

## Scope and gaps
- No new browser tests were launched by this review; it checked execution and success of existing CI jobs.
- A nightly test on WOOD U LIKE main offers current main technical QA evidence, but does not establish live inbox delivery, legal readiness, Safari/manual accessibility or public-site acceptance.
- ASSEMBL LAB PR has changed after the reviewed CI run; CI must be rechecked on the latest head before merge.
- No controlled live WOOD U LIKE POST is authorized. Formspree account screenshots/owner statements verified basic configuration and historic email delivery, not WUL end-to-end processing.
- Must verify exact current-sha public smoke, privacy policies/legal identity, payment/tax readiness and owner GO.

Decision: Technical CI evidence improved. G1 still partial, G2/G3 blocked, overall NO-GO. No merges, deployments, live POSTs or payments undertaken.
