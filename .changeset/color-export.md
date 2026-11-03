---
'@ekdotico/domico': minor
---

**Added: `@ekdotico/domico/color`, the package's OKLCH and sRGB maths.** It exports `oklchToHex`, `hexToOklch`, `parseOklch`, `luminance`, and `contrast`. These are the functions that already generate the Mermaid palette and back `check:contrast` and `check:collaborators`, now with types.

It is for a surface that takes no CSS custom properties and cannot paint `oklch()`. The first is the alpha site's Open Graph image, which Satori draws to SVG and resvg paints. That site had begun to carry its own copy of the conversion, the drift this package exists to end. With this export, an application converts a token's value (`oklchToHex(palettes.parchment.light['bg-canvas'])`) and never writes a hex colour of its own.

Nothing changes for an existing consumer.
