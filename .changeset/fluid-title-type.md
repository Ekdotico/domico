---
'@ekdotico/domico': minor
---

Proposed for the docs title page, and approved by the owner on 2026-10-22.

**Added: `--fs-title`.** It is `clamp(var(--fs-4xl), 7vw + 0.375rem, var(--fs-6xl))`, and is used for a site's name at title-page scale. It is 48px up to 600px, grows to 76px at 1000px and holds there. It replaces the docs site's own `clamp(var(--fs-4xl), 8vw, var(--fs-6xl))`, the last font-size `clamp()` left in an application. `docs/design-tokens.md` lists it under "Fluid sizes", and `AGENTS.md` rule 2 names it.
