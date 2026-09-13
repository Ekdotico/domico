import type { HTMLAttributes, TableHTMLAttributes } from 'react';

export interface TableProps extends TableHTMLAttributes<HTMLTableElement> {
  /**
   * Accessible name for the scrollable wrapper, announced when the tab stop
   * lands on it. Pass the table's caption or subject; defaults to "Table".
   */
  label?: string;
}

export function Table({ children, className, label = 'Table', ...rest }: TableProps) {
  return (
    // `tabIndex={0}` because `.tbl-wrap` scrolls below 920px in every
    // consumer. A container with `overflow-x: auto` and no tab stop can be
    // scrolled by a mouse wheel, a trackpad and a touch drag, and by nothing a
    // keyboard offers: the columns past the right edge hold content —
    // requirement text, risk severities — that a keyboard-only reader has no
    // gesture to reach (WCAG 2.1.1). Focus is the scroll handle, and arrow
    // keys move it once the element can hold focus. The tab stop is
    // unconditional rather than measured, because the measurement is a
    // client-side one and this component renders on the server; a redundant
    // stop on a table that happens to fit is a smaller cost than unreachable
    // content on one that does not. The ring comes from the package's own
    // `:focus-visible` in base.css, so nothing is added here.
    //
    // A tab stop is a user interface component, and one owes a role and a
    // name (WCAG 4.1.2). Without them a screen reader lands on the wrapper
    // and says nothing before the table itself is read. `group` rather than
    // `region`: a landmark per table would put eighty entries named "Table"
    // in the documentation site's landmark list, which is worse than none.
    <div className="tbl-wrap" tabIndex={0} role="group" aria-label={label}>
      <table className={className} {...rest}>
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
