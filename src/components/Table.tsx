import type { HTMLAttributes, TableHTMLAttributes } from 'react';

export function Table({ children, className, ...rest }: TableHTMLAttributes<HTMLTableElement>) {
  return (
    // `tabIndex={0}` because `.tbl-wrap` scrolls. A container with
    // `overflow-x: auto` and no tab stop can be scrolled by a mouse wheel, a
    // trackpad and a touch drag, and by nothing a keyboard offers: the columns
    // past the right edge hold content — requirement text, risk severities —
    // that a keyboard-only reader has no gesture to reach (WCAG 2.1.1). Focus
    // is the scroll handle, and arrow keys move it once the element can hold
    // focus. The tab stop is unconditional rather than measured, because the
    // measurement is a client-side one and this component renders on the
    // server; a redundant stop on a table that happens to fit is a smaller
    // cost than unreachable content on one that does not. The ring comes from
    // the package's own `:focus-visible` in base.css, so nothing is added here.
    <div className="tbl-wrap" tabIndex={0}>
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
