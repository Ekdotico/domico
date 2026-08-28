---
'@ekdotico/domico': minor
---

Accessibility guards, and the diagram text-alternative measures behind them.

Rule 18 joins the visual ruleset: a diagram is an image, and an image whose
subtree is pruned owes a text alternative that conveys what it conveys. The
rule was established by a documentation site on which twelve Mermaid diagrams
across five pages reached a screen reader as the single word `Diagram`, because
`role="img"` prunes everything inside it and no call site passed a title.

**New exports**

- `@ekdotico/domico/mermaid/accessibility` — `extractAccessibility(chart)`
  reads Mermaid's own `accTitle:` and `accDescr:` directives out of a diagram
  source and returns them beside a `source` string with the directive lines
  blanked in place. Blanked rather than deleted, so every line number a parser
  reports still matches the fence the author is reading, and so `accDescr {`
  is not counted as structure by a grammar check.
- `@ekdotico/domico/svg` — `annotateSvg(svg, idBase, title, descr)` writes
  `<title>` and `<desc>` into a detached SVG, in that order, ahead of the drawn
  content. It sets `role="img"` only when there is a title: the role with
  nothing to name it prunes the shapes and puts nothing in their place. It
  mutates the node it is given, so callers pass a clone.

**New guard**

`ekdotico-check a11y` audits a consuming repository for six failure classes:
a Mermaid diagram with no text alternative, one element holding both a
non-operable role and `tabIndex`, `aria-modal` with no focus trap, an aria
reference resolving to no element, an outline removed with no `:focus-visible`
ring, and an icon-only button with no accessible name. The diagram check is
scoped to the routed tree, so a fence in an archived plan is not reported.

**Figure**

`Figure` takes an optional `description`, rendered visually hidden and
referenced by `aria-describedby`. An `alt` string cannot carry a graph. The id
is derived from the source and the description rather than from `useId`, so the
component stays renderable on the server.
