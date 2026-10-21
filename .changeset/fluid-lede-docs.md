---
'@ekdotico/domico': patch
---

**Fixed: the fluid sizes in `docs/design-tokens.md`.** `--fs-lede` is 20px at 1000px, not 17px: its ramp reaches its ceiling near 800px, not 1600px. The table and the note on slopes now give the measured values, and the note says to check a new slope at 375, 1000 and 1600px. No token changes.
