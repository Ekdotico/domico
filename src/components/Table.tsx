import { useId, type HTMLAttributes, type ReactNode, type TableHTMLAttributes } from 'react';

export interface TableProps extends TableHTMLAttributes<HTMLTableElement> {
  /**
   * A caption row above the table, drawn as `.tbl-caption`. When present it is
   * also the accessible name of the scrollable wrapper, so the tab stop is
   * announced by what the table is about.
   */
  caption?: ReactNode;
  /**
   * Accessible name for the scrollable wrapper, where no caption supplies one.
   * Overrides the caption when both are given.
   */
  label?: string;
}

export function Table({
  children,
  className,
  caption,
  label,
  'aria-label': ariaLabel,
  ...rest
}: TableProps) {
  const captionId = useId();

  // The wrapper's name, in order of preference: an explicit label, the
  // caption, an aria-label the caller put on the table, and only then the
  // generic word. It was always the generic word, so a page of eighty tables
  // announced eighty identical tab stops and the name distinguished nothing.
  //
  // An aria-label passed for the table is moved to the wrapper, not copied. On
  // both, a screen reader reads it twice in a row — "Risks, group; Risks,
  // table" — and the wrapper is the element that is reached by Tab, so it is
  // the one that needs it. The table inside a named group is already in
  // context. One that differs from the wrapper's name stays on the table.
  const named = label ?? (caption == null ? ariaLabel : undefined);
  const labelling = named != null
    ? { 'aria-label': named }
    : caption != null
      ? { 'aria-labelledby': captionId }
      : { 'aria-label': 'Table' };

  return (
    // `tabIndex={0}` because `.tbl-wrap` scrolls below 920px — the rule ships
    // in the package's own table stylesheet, beside the sticky header it has
    // to switch off. A container with `overflow-x: auto` and no tab stop can
    // be scrolled by a mouse wheel, a trackpad and a touch drag, and by
    // nothing a keyboard offers: the columns past the right edge hold content
    // — requirement text, risk severities — that a keyboard-only reader has
    // no gesture to reach (WCAG 2.1.1). Focus is the scroll handle, and arrow
    // keys move it once the element can hold focus. The tab stop is
    // unconditional rather than measured, because the measurement is a
    // client-side one and this component renders on the server; a redundant
    // stop on a table that happens to fit is a smaller cost than unreachable
    // content on one that does not. The ring comes from the package's own
    // `:focus-visible` in the reset, so nothing is added here.
    //
    // A tab stop is a user interface component, and one owes a role and a
    // name (WCAG 4.1.2). Without them a screen reader lands on the wrapper
    // and says nothing before the table itself is read. `group` rather than
    // `region`: a landmark per table would put eighty entries in the
    // documentation site's landmark list, which is worse than none.
    <div className="tbl-wrap" tabIndex={0} role="group" {...labelling}>
      {caption != null && (
        <div className="tbl-caption" id={captionId}>
          {caption}
        </div>
      )}
      <table className={className} aria-label={ariaLabel === named ? undefined : ariaLabel} {...rest}>
        {children}
      </table>
    </div>
  );
}

export function TableHead(props: HTMLAttributes<HTMLTableSectionElement>) {
  return <thead {...props} />;
}

export function TableBody(props: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody {...props} />;
}

export function TableRow(props: HTMLAttributes<HTMLTableRowElement>) {
  return <tr {...props} />;
}

export function TableHeaderCell(props: HTMLAttributes<HTMLTableCellElement>) {
  return <th {...props} />;
}

export function TableCell(props: HTMLAttributes<HTMLTableCellElement>) {
  return <td {...props} />;
}
