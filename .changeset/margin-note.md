---
'@ekdotico/domico': minor
---

feat: a margin note, and a table row that carries one

`MarginNote` is the marginalia the documentation site drew for itself: a small
italic aside with a hairline rule and an optional label, in
`styles/margin-note.css`. It is `role="note"`, named by its label, and writes
no word of its own.

`TableCell` takes `note`. The notes of a row go to its last cell and are
rendered inside it, so the table keeps its columns and a screen reader reads
the note with its row. With no gutter they sit under the cell's content.

The application says where there is a gutter by setting
`--ekd-margin-gutter: on` on an ancestor of the text column, and `off` where it
closes. A note then floats into the gutter at the start of the column, and the
notes of a table row stand in the same gutter, level with the row. The row is
as tall as its notes, so many notes neither meet nor move away from their
rows. Unset, in print, and in a browser without container style queries, there
is no gutter.

Nothing that existed changes: a `TableCell` without `note` renders the `<td>`
it rendered.
