---
'@ekdotico/domico': minor
---

The mark is now the epsilon from the Logo & Iconography Figma file (node 91:22), replacing the stroked arch. Requested by the owner when the icai site asked for the new logo; the package is where the mark lives, so it changes here and every application takes it on the pin bump.

**Changed: `LogoMark`.** One filled path in a 360×360 viewBox, in place of three stroked subpaths in 512×512. `ink`, `solid`, `dark-solid` and `light-solid` keep their meaning and their tokens, now as the glyph's fill rather than a stroke. The tile colours were already the Figma "Light" and "Dark" pairs, so no token value moves; two token descriptions now say "glyph" instead of "stroke".

**Removed: `variant="draw"` and `pathRef`.** They existed so the opening sequence could trace the arch on as one stroke, and the epsilon is a filled shape with no line to trace. Neither appears outside this package in deree, docs, praktico or icai. An application that passes either will fail to type-check, which is the intended signal.

**Changed: `OpeningSequence`.** The mark fades in and settles a step upward instead of being drawn. Every duration is unchanged (the mark's entrance keeps `--intro-draw`), so the wordmark, the hold and the fade land where they did, and a reader who asks for reduced motion still sees nothing.

**Changed: `assets/logo`.** All 84 sized files (SVG and PNG, seven sizes, `original`, `dark` and `branded`, solid and transparent) and the two standalone marks are regenerated from the component's path, in the same colours and under the same names. `check:icons` now asserts that every SVG of the mark carries the component's path exactly, in place of the check that the arch's two spellings agreed.

Applications keep their own favicons (`app/icon.svg`, `apple-icon.png`); those are not in the package and change in each application.
