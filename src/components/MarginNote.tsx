import { useId, type ReactNode } from 'react';

// MarginNote: marginalia. A small italic aside with a hairline rule and an
// optional gilt label above it.
//
//   <MarginNote label="Amendment — October 2026">…</MarginNote>
//   <p>The passage the note is about.</p>
//
// It has two forms and the stylesheet chooses between them. With no gutter it
// is a block in the text column, the rule on its start edge. Where the
// application has said there is a gutter, by setting `--ekd-margin-gutter: on`
// on an ancestor (the README says how), it floats into the gutter at the start
// of the text column, clear of the text, and the rule moves to the edge that
// faces the text. Place it directly before the paragraph it is about: a float
// sits beside what follows it.
//
// In a table it is passed to the last cell of its row, `<TableCell note={…}>`,
// and the table section of the stylesheet places it. Do not put one in a cell
// any other way: a float inside a cell has no gutter to reach.
//
// `role="note"`, as every Callout is, and for the same reason: a bare `<aside>`
// is a complementary landmark, and a page of forty notes would put forty
// unnamed entries in the landmark list. The label names the note through
// `aria-labelledby`, so a screen reader announces "Amendment — October 2026,
// note" and then the text. The label is a `<p>`, not a heading: a note is not
// a section of the page.
//
// The component writes no word of its own. The label and the text are the
// application's.

export interface MarginNoteProps {
  /** A short line above the note, in the label type. It names the note. */
  label?: ReactNode;
  children: ReactNode;
}

export function MarginNote({ label, children }: MarginNoteProps) {
  const labelId = useId();
  const labelled = label != null && label !== false && label !== '';
  return (
    <aside className="ekd-margin-note" role="note" aria-labelledby={labelled ? labelId : undefined}>
      {labelled && (
        <p className="ekd-margin-note-label" id={labelId}>
          {label}
        </p>
      )}
      <div className="ekd-margin-note-body">{children}</div>
    </aside>
  );
}
