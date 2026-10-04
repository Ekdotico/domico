---
'@ekdotico/domico': minor
---

Collaborator colours: ten slots for the other people in a shared document, in all eight palettes. Each slot is three tokens — `--collab-N` (the caret and the presence label's ground), `--collab-N-ink` (the name on it) and `--collab-N-soft` (a translucent selection wash) — with `N` from 1 to 10 in assignment order. `@ekdotico/domico/tokens` exports `collaboratorSlots` and `collaboratorSlot(index)`, which cycles.

Ten because a document holds at most ten connections. The hues are the house earth tones on three lightness tiers, so that every pair stays apart under simulated protanopia and deuteranopia as well as for typical vision, and slots 1 to 4 are the four furthest apart. The label carries the person's name; colour is never the only signal.

`ekdotico-check collaborators` (`pnpm check:collaborators` here) is new and is in the no-argument set. It measures, per palette: the ink on its solid at 4.5:1; the solid on each of the five grounds at 3:1; `--fg-1` and `--fg-2` over the wash on each ground at 4.5:1; and the OKLab distance between every pair of solids under three visions. `luminance` and `contrast` moved into `tokens/lib/color.mjs`, where both contrast guards read them.

The catalogue has a Collaborator section with the measured table. Its token totals also now count `--overlay-scrim`, which they had left out: 75 per palette and 147 in all.
