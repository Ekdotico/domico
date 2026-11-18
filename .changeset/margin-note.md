---
'@ekdotico/domico': minor
---

feat: a margin note, a requirement table, and a table row that carries a note

`MarginNote` is the marginalia the documentation site drew for itself: a small
italic aside with a hairline rule and an optional label, in
`styles/margin-note.css`. It is `role="note"`, named by its label, and writes
no word of its own.

`RequirementTable` is the documentation site's requirement table, built from
`Table` and its parts: an identifier, the requirement, and a priority column
where a row has one. The data is strings, and the application passes
`renderText` to say what a string becomes. Each requirement takes `notes`.
Its styles, the `.req-*` classes and the two column widths, are in
`styles/table.css`.

`TableCell` takes `note`. The notes of a row are rendered inside the cell, so
the table keeps its columns and a screen reader reads the note with its row.
With no gutter they sit under the cell's content.

The application says where there is a gutter by setting
`--ekd-margin-gutter: on` on an ancestor of the text column, and `off` where it
closes. A note then floats into the gutter at the start of the column, and the
notes of a table row stand in the same gutter, level with the row: those of a
row's last cell, and those of a requirement. The row is as tall as its notes,
so many notes neither meet nor move away from their rows. Unset, in print, and
in a browser without container style queries, there is no gutter.

Nothing that existed changes: a `TableCell` without `note` renders the `<td>`
it rendered.
