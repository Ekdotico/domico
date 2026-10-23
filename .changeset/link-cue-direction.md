---
"@ekdotico/domico": minor
---

**Changed: the arrow on links in running text says where the link goes.** Requested by the owner.

- A link to another site (a full address, `//host`, `mailto:`, `tel:`) keeps the diagonal arrow, unchanged.
- A link to a page on the site (a rooted or relative path, `/guide`, `./next`) shows an arrow pointing right.
- A link to a place on the page (`#terms`) shows an arrow pointing down, or up when the target is above the link.

**Added: `InPageLinkDirection`**, a component that renders nothing and sets `data-link-direction="up"` or `"down"` on every fragment link, from the document order of the link and its target. CSS cannot compare the two, so without it every fragment link points down. Render it once in the layout with `rescanKey={pathname}`.

An absolute address on the site's own origin cannot be told from another site in CSS and keeps the diagonal; write such links rooted. All three arrows are the same `currentColor` mask in the same box, and forced colours still paint them `LinkText`.
