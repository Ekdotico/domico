---
"@ekdotico/domico": patch
---

**Fixed: the arrow on links in running text no longer needs an image.** Since 0.35.0 the box and arrow were a `mask` over an inline `data:` SVG, so an application whose Content Security Policy `img-src` leaves out `data:` (the Ekdotico application allows only itself and its image store) blocked it: the arrow did not draw and the browser reported a violation on every page with such a link. Requested by the owner, 2026-10-25.

The box is now the pseudo-element's own border and each stroke of the arrow is a gradient, all `currentColor`, so there is no `url()` of any kind. Nothing visible changes: the same box (0.6417em, corner 0.175em), the same stroke weight, the link's colour at rest and the accent on hover and focus, the same direction by `href` and `data-link-direction`, and `LinkText` in forced colours. No export, class, token or prop is added, renamed or removed.

**Added: a guard.** `check:styles` now fails on a `url()`, an `image-set()` or an `@import` in any stylesheet the package ships. It is a package check only; a consuming repository's own `url()` is not a finding. The only `url()` the package shipped was this one.
