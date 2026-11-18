import type { ReactNode } from 'react';
import { Badge } from './Badge.js';
import { MarginNote } from './MarginNote.js';
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from './Table.js';

// RequirementTable: a table of requirements. An identifier, the requirement,
// and a MoSCoW priority where any row has one. It is `Table` and its parts with
// the columns decided, and it draws nothing they do not.
//
// The words of a requirement arrive as strings, because they are data: a page
// of them is generated from a specification. What a string becomes is the
// application's to say, once, through `renderText`: the documentation site
// passes the function that turns `**bold**`, `code` and a requirement code into
// markup and links. The component does not import one, since it cannot know
// what an application links to, and a table of ready-made nodes would have to
// be built by every caller, block by block. Without `renderText` a string is
// shown as it is.
//
// `blocks` follow the lead-in text of a requirement, in order:
//   - `kind: 'p'`      a further paragraph.
//   - `kind: 'list'`   sub-items; `ordered` draws them lettered.
//   - `kind: 'table'`  a matrix the requirement itself defines, drawn compact
//                      and without the card, so it reads as part of the cell.
//
// `notes` are the margin notes of the row: an amendment, mostly. They are given
// to the cell that holds the requirement, so they are read with it, and the
// table stylesheet says where they stand (see `TableCell`).

export type RequirementBlock =
  | { kind: 'p'; text: string }
  | { kind: 'list'; ordered: boolean; items: string[] }
  | {
      kind: 'table';
      headers: string[];
      rows: string[][];
      align?: ('left' | 'center' | 'right')[];
    };

export interface RequirementNote {
  /** A short line above the note. It names the note. */
  label?: string;
  text: string;
}

export interface Requirement {
  id: string;
  text: string;
  blocks?: RequirementBlock[];
  priority?: 'M' | 'S' | 'C';
  notes?: RequirementNote[];
}

/**
 * The words the table writes itself. Each default is a word the documentation
 * site showed when the table was its own; an application with other words, or
 * another language, passes its own.
 *
 * `noPriority` has no default, because no application has yet given the dash a
 * word. Until one is passed, the dash is all a row without a priority shows.
 */
export interface RequirementTableLabels {
  /** The header of the identifier column. Default "ID". */
  id?: string;
  /** The header of the requirement column. Default "Requirement". */
  requirement?: string;
  /** The header of the priority column, as it is read aloud. Default "Priority". */
  priority?: string;
  /** The same header as it is drawn, in a column 60px wide. Default "P". */
  priorityShort?: string;
  /** The name of the scroll area where there is no caption. Default "Requirements". */
  name?: string;
  /** What each letter stands for. Defaults "Must have", "Should have", "Could have". */
  priorities?: Partial<Record<'M' | 'S' | 'C', string>>;
  /** What the dash stands for, in a row with no priority. No default. */
  noPriority?: string;
}

export interface RequirementTableProps {
  requirements: Requirement[];
  /** A caption row above the table, and the name of its scroll area. */
  caption?: string;
  /** What a string of the data becomes. The default shows it as it is. */
  renderText?: (text: string) => ReactNode;
  /** The words the table writes itself. */
  labels?: RequirementTableLabels;
}

// The legend of the documentation site's requirement pages, word for word.
const PRIORITY_WORDS = { M: 'Must have', S: 'Should have', C: 'Could have' } as const;

// A letter or a dash for the eye and a word for a screen reader. The drawn
// form is hidden from the reader so that it hears "Must have" and not
// "M, Must have". A visually hidden word and not `<abbr title>`: a title is
// read by some screen readers, in some settings, and by none on a touch
// screen, and a header cell's `abbr` attribute is for the short form of a long
// header, which is the reverse of this.
function spoken(drawn: string, word: string | undefined) {
  if (!word || word === drawn) return drawn;
  return (
    <span className="req-drawn">
      <span aria-hidden="true">{drawn}</span>
      <span className="req-spoken">{word}</span>
    </span>
  );
}

type Render = (text: string) => ReactNode;

// A function and a switch, so that the compiler reports a kind of block that
// was added without a branch here.
function renderBlock(b: RequirementBlock, i: number, render: Render) {
  switch (b.kind) {
    case 'p':
      return (
        <p key={i} className="req-p">
          {render(b.text)}
        </p>
      );
    case 'list': {
      const items = b.items.map((t, j) => <li key={j}>{render(t)}</li>);
      return b.ordered ? (
        <ol key={i} className="req-list" type="a">
          {items}
        </ol>
      ) : (
        <ul key={i} className="req-list">
          {items}
        </ul>
      );
    }
    case 'table':
      return (
        <table key={i} className="req-subtable">
          <thead>
            <tr>
              {b.headers.map((h, j) => (
                <th key={j} scope="col" data-align={b.align?.[j]}>
                  {render(h)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {b.rows.map((row, k) => (
              <tr key={k}>
                {row.map((cell, j) => (
                  <td key={j} data-align={b.align?.[j]}>
                    {render(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      );
  }
}

export function RequirementTable({ requirements, caption, renderText, labels = {} }: RequirementTableProps) {
  const render: Render = renderText ?? ((text) => text);
  const priorityWords = { ...PRIORITY_WORDS, ...labels.priorities };
  // The column is drawn only where a row has a priority. A specification
  // written to "shall" has none, and an empty column would say it had.
  const showPriority = requirements.some((r) => r.priority !== undefined);

  return (
    <Table caption={caption || undefined} label={caption ? undefined : (labels.name ?? 'Requirements')}>
      <TableHead>
        <TableRow>
          <TableHeaderCell scope="col" className="col-id">{labels.id ?? 'ID'}</TableHeaderCell>
          <TableHeaderCell scope="col">{labels.requirement ?? 'Requirement'}</TableHeaderCell>
          {showPriority && (
            <TableHeaderCell scope="col" className="col-priority">
              {spoken(labels.priorityShort ?? 'P', labels.priority ?? 'Priority')}
            </TableHeaderCell>
          )}
        </TableRow>
      </TableHead>
      <TableBody>
        {requirements.map((r) => (
          <TableRow key={r.id} id={r.id.toLowerCase()}>
            <TableCell className="td-id">{r.id}</TableCell>
            <TableCell
              className="req-text"
              note={
                r.notes?.length
                  ? r.notes.map((n, i) => (
                      <MarginNote key={i} label={n.label}>
                        {render(n.text)}
                      </MarginNote>
                    ))
                  : undefined
              }
            >
              {render(r.text)}
              {r.blocks?.map((b, i) => renderBlock(b, i, render))}
            </TableCell>
            {showPriority && (
              <TableCell>
                {r.priority ? (
                  <Badge variant={r.priority}>{spoken(r.priority, priorityWords[r.priority])}</Badge>
                ) : (
                  <span className="req-none">{spoken('—', labels.noPriority)}</span>
                )}
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
