---
'@ekdotico/domico': patch
---

Table body cells wrap long unbreakable tokens instead of widening the table past its column.

`.tbl-wrap tbody td` set `overflow-wrap: normal`, which opted every cell out of
breaking a token that has no spaces in it — a regex, a route path, a DOI. Such a
token contributes its full width to the column's min-content size, and
`table-layout: auto` will not draw a table narrower than the sum of those, so
`width: 100%` loses to it. `.tbl-wrap` carries no overflow at desktop by design,
because that would break the sticky header, and so the surplus had nothing to
scroll or clip it: it painted over whatever the host page keeps beside the
content column.

Measured in the documentation site, whose right gutter holds the page index: one
70-character regex produced a 679px min-content cell inside a 648px column and
pushed its table 186px into the index, over the text. Across the 80 tables there,
5 overflowed, the worst by 186px. With `overflow-wrap: anywhere`, none do.

`break-word` does not fix this. It wraps the token visually but contributes no
break opportunities to intrinsic sizing, so the column stays wide and the table
still overflows; only `anywhere` reaches the figure the layout algorithm reads.

Column proportions improve as a side effect, and no per-table tuning is needed to
get it: freed of the false constraint, auto-layout distributes the surplus by
max-content, which tracks content volume, so prose columns widen and code columns
narrow on their own. On the API table the description column went from 98px to
254px and became the widest, having been the narrowest. Explicit column caps and
`table-layout: fixed` were both measured against this and both did worse, because
they flatten every column toward the same width.

Cells that already fit are untouched: a break is taken only where the content
would otherwise overflow. `word-break` stays `normal`.
