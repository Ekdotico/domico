---
'@ekdotico/domico': minor
---

Row headers in a table, `scope` on header cells, and a `Checkbox` whose label only a screen reader hears. Found while building a permissions table in the Ekdotico application (register row S16-8). No export, class or token is renamed or removed, and no prop changes its meaning. One optional prop is added, `labelHidden`, and two props types are widened.

**Added: a header cell in `TableBody` is drawn as the header of its row.** `table.css` styled `tbody td` and nothing else, so a `TableHeaderCell` placed in a body row got the browser's default: centred, unpadded and unruled, in a card whose cells were all three.

- A `th` in `tbody` now takes every rule a body cell takes — the padding, the bottom rule, the side outline and the rounded corners of the last row, the wrapping that keeps the table in its column, and the hover wash — through `:is(td, th)` on those selectors.
- It then differs from a body cell in three things: `font-weight: var(--fw-semi)`, `color: var(--fg-1)` (the ink of `.td-strong`) and `text-align: start`. It does not take the column header's label treatment: the sunken ground, the small tracked type, `nowrap` and the sticky position remain on `thead th` alone.
- No token is added. A header cell in `thead` and a body cell are drawn as before. A table that already put a `th` in `tbody` and styled it itself should check that its rule still wins: the package's rule has the specificity of one class and two elements.

**Changed: `TableHeaderCell` is typed with the attributes of a `<th>`, and `TableCell` with those of a `<td>`.** Both were `HTMLAttributes`, so `scope`, `colSpan`, `rowSpan`, `headers` and `abbr` were refused by the compiler although they always reached the element. This widens a type; nothing that compiled stops compiling.

- **`scope` is not defaulted.** The same component is a column header in `TableHead` and a row header in `TableBody`, and it cannot tell which. Pass `scope="col"` or `scope="row"`. A browser infers the scope of a table with one header row or one header column, so leaving it off there is not a fault; a table with both, or a row header past the first column, needs it (WCAG 1.3.1, technique H63).

**Added: `Checkbox` takes `labelHidden`.** `labelHidden?: boolean`, the name `Select` already uses. The label is kept for a screen reader and is not drawn. It is still required, since it is the box's name, and the box still sits inside its `<label>`.

- The hidden words take `.sr-only` from the reset, as `Select`'s do. The label gets the class `ekd-choice--bare`, which positions it (`position: relative`), so the words are contained by their own label. A bare `.sr-only` in a table cell lays out against the nearest positioned ancestor, which a cell is not, and escaped the table's scroll container: the application's permissions table overflowed sideways by 475px at 320px until a cell was positioned.
- The same class shrinks the label to the box (`inline-size: fit-content`), so the empty line beside the box does not toggle it, and gives it a 24px minimum width (`min-inline-size: var(--sp-6)`, WCAG 2.5.8). A `Checkbox` without `labelHidden` is drawn and marked up as before.
- The class is new in `styles/form.css`, which `styles.css` and `styles/components.css` also carry.

**Fixed: `docs/design-tokens.md` said that border widths have their own tokens.** None exists. The Spacing section now says so: a rule is a literal `1px`, and the 2px outline of a table is drawn in `table.css`. A border-width token would be a token proposal, and none is made here.

`check:components` holds each change: the `scope` attribute and the absence of a default, the `<th>`, `<td>` and `labelHidden` types by compiling `scripts/fixtures/table-types.tsx` against the built declarations, the row-header rules in `dist/styles/table.css`, and the `labelHidden` markup and the positioned label in `dist/styles/form.css`. Each fails if its change is reverted. The README has a new section, The table.
