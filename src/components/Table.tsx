import type { HTMLAttributes, TableHTMLAttributes } from 'react';

export function Table({ children, className, ...rest }: TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="tbl-wrap">
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
