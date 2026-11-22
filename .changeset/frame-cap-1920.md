---
'@ekdotico/domico': patch
---

The wide-screen frame now caps the page at 1920px instead of 1440px. The sheet,
its darker ground and the one-pixel rule on each side come in above a 1920px
window, so a page fills any screen up to that width. Only the value moves; the
stylesheet, its import path and `--frame-zoom` are unchanged.
