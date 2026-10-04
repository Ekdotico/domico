---
'@ekdotico/domico': patch
---

The collaborator selection wash is stronger in the four dark palettes. `--collab-N-soft` there moves from `oklch(72% 0.09 H / 0.24)` to `oklch(66% 0.13 H / 0.36)`: more chroma and more alpha, at a lower lightness so the text over it keeps its contrast. Teal stops at a chroma of 0.107, the most sRGB holds at that lightness. Sepia dark takes an alpha of 0.3 instead of 0.36, because its `--fg-2` over the wash on `--bg-raised` measured 4.22:1 at 0.36 and the floor is 4.5:1. The light palettes, the solids and the inks are unchanged, and so is every threshold in `check:collaborators`.

Worst-case body text over the wash is now 5.03:1 in parchment dark, 4.89:1 in library dark, 4.67:1 in sepia dark and 5.33:1 in mono dark.
