---
'@ekdotico/domico': minor
---

**Changed: `Logo`.** The tile is now the wordmark's E: the lockup reads as the epsilon tile followed by "kdotico", set tight against it, in place of a tile, a gap and "Ekdotico". Requested by the owner from the icai header.

The tile is sized to one em of the wordmark and aligned on its baseline, so it scales with the letters. `.logo` now carries the wordmark's font family and size, so an application that sets `font-size` on `.logo` scales the whole lockup; one that set it on `.logo-wordmark` alone now scales the letters without the tile. The `size` prop no longer sets the rendered size; it is only the width the SVG claims before the stylesheet loads.

A screen reader still hears "Ekdotico", once: the tile and the visible "kdotico" are hidden from it, and a visually hidden span carries the name.

`OpeningSequence` is unchanged: its mark stands above the wordmark rather than beside it, so it keeps "Ekdotico" in full.
