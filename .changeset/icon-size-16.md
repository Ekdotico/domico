---
'@ekdotico/domico': patch
---

fix: an icon with no `size` is 16×16 again, not `1em`

0.44.0 made the default `1em`, so an icon followed the font size of its
control: a 15px editor control drew 15×15, and a 13px toolbar button drew
13×13. The default is a fixed 16×16 whatever the font size around it. Pass
`size` to scale one deliberately. Icon-only `Button` and `ButtonLink` are
unchanged: a 20×20 box, a 16×16 glyph, a 24×24 pointer target.
