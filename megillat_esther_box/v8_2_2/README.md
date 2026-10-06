# Megillat Esther Box — V8.2.2

MEGILLAT ESTHER BOX V8.2.2 — FULL CONNECTION AUDIT
Exact internal cavity: 310 × 65 × 65 mm
Structure: 6 mm plywood; curved skin: 4 mm plywood

AUDIT RESULT: ALL CHECKS PASS
Geometry corrections in this audit: 3
Audit cycles: 3 (initial audit -> corrections -> re-audit -> audit-rule verification)

Correction 1 — BODY_RING mounting foot
Problem: Actual glue overlap was 72 mm² because the top corner finger notch removed half the assumed mounting area.
Fix: Foot extended inward; actual overlap now 192.0 mm².

Correction 2 — LID_CENTER_RIB ↔ beams
Problem: Center rib had full-depth clearance notches and could slide along both beams.
Fix: Changed to 5+5 mm half-laps at x=158..164 mm.

Correction 3 — LID_SKIN living-hinge layout
Problem: Right hinge cuts reached the skin edge and the solid center strip was shifted away from the center rib.
Fix: Recentered a 14 mm solid band at x=161 and added 12 mm solid margins at both ends.

No machine-specific kerf compensation is applied. Run the ring/pin calibration coupon before production.
Use a temporary ~0.3 mm axial shim while bonding LOCK_CAP to preserve free hinge rotation.


## Repository contents
- `per_part/` — individual DXF definitions
- `production/` — 6 mm and 4 mm production cut sheets
- `calibration/` — ring/pin fit coupon
- `V8_2_2_FULL_CONNECTION_AUDIT.csv` — 56-check audit
- `V8_2_2_CORRECTIONS.csv` — corrections made during the full audit

> DXFs in Git are compacted ASCII representations of the audited geometry: entity counts, layers, vertices, coordinates and closed states were verified unchanged from the generated V8.2.2 files.