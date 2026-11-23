---
'@ekdotico/domico': minor
---

`Button` and `ButtonLink` take `edge`, `'start'` or `'end'`, for the quiet variant alone (TypeScript refuses it on the others). A quiet button that leads or ends a row sets its text on the edge of the column, so a row of text and quiet buttons has one left edge. It is a negative inline margin of the button's padding and border, so the box, the 24px press area and the focus ring keep their size and reach that far outside the column: the container must not clip them. Logical, so it holds in a right-to-left row. Not for an icon-only button. Left out, nothing changes.
