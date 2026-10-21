---
'@ekdotico/domico': minor
---

Requested by the owner after the alpha site's hero was retuned.

**Added: fluid type tokens.** `--fs-display` is `clamp(var(--fs-xl), 1.6vw + 0.9rem, var(--fs-4xl))`, about 24px at 375px, 30px at 1000px and 40px at 1600px, for a page's one display heading. `--fs-lede` is `clamp(var(--fs-md), 1vw + 0.75rem, var(--fs-lg))`, for the paragraph under it. Both ends of each are steps of the scale.

**Documented.** `docs/design-tokens.md` documents how a fluid size is built and how to add one. `AGENTS.md` rule 2 now says that an application never writes a `clamp()` for a font size.

**Changed: `--fs-xs` is 13px (`0.8125rem`), was 12px.** It now equals `--fs-sm`. Every badge, eyebrow, caption and chip that uses it grows a pixel, in this package and in every application.
