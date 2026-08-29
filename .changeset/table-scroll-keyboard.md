---
'@ekdotico/domico': patch
---

`Table` gives its scroll container a tab stop.

`.tbl-wrap` is `overflow-x: auto`, so a table wider than the reading column
scrolls sideways. It did so for a wheel, a trackpad and a touch drag, and for
nothing a keyboard offers — the wrapper held no focus, and the columns past the
right edge were unreachable without a pointer (WCAG 2.1.1). `tabIndex={0}` makes
the container focusable, which is what lets the arrow keys scroll it.

The stop is unconditional rather than measured. Whether a given table overflows
is a client-side measurement and this component renders on the server, so the
choice is between a redundant tab stop on a table that fits and unreachable
content on one that does not. The focus ring is the package's existing
`:focus-visible` rule in `base.css`; no styling is added.

Consumers that build the wrapper by hand rather than through this component need
the same attribute — `docs` carries it on `RequirementTable`, `RiskTable`,
`StakeholderTable` and `Compare`.
