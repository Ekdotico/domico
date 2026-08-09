import type { ReactNode } from 'react';

// Stat + StatGrid — single load-bearing number with label and an
// optional italic sub-line. Pair with <StatGrid> to lay out two,
// three, or four stats in a responsive row.
//
//   <Stat value="3,200" label="reviewers" sub="2024 cohort" />
//
//   <StatGrid columns={3}>
//     <Stat value="3,200" label="reviewers" sub="2024 cohort" />
//     <Stat value="48"    label="universities" />
//     <Stat value="92%"   label="retention" sub="year over year" />
//   </StatGrid>
//
// Use for scannable headline numbers — market analysis, milestones,
// use-case impact. For long lists of numbers prefer KeyValueList; for
// tabular data prefer Table.

export function Stat({
  value,
  label,
  sub,
}: {
  // Numeric or short symbolic value. Pre-format the string (commas,
  // percent signs, currency) — the component does not localize.
  value: ReactNode;
  // Small uppercase sans label that sits beneath the value.
  label: string;
  // Optional italic serif gloss line — context, vintage, or unit.
  sub?: string;
}) {
  return (
    <div className="stat">
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}

export function StatGrid({
  columns = 3,
  children,
}: {
  // 2, 3, or 4 columns at widths >= 760px. Below 760px collapses to
  // 2 columns; below 480px collapses to 1.
  columns?: 2 | 3 | 4;
  children: ReactNode;
}) {
  return (
    <div className="stat-grid" data-columns={columns}>
      {children}
    </div>
  );
}
