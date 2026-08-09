// Badge — priorities (M/S/C), severities (High/Medium/Low), criticality
// (critical/non-critical), status markers, and ad-hoc info pills.
//
// Read-only markers. A badge is never a button or a link: it reports a state,
// it does not offer an action.

export type BadgeVariant =
  | 'M'
  | 'S'
  | 'C'
  | 'High'
  | 'Medium'
  | 'Low'
  | 'critical'
  | 'non-critical'
  | 'info'
  | 'new'
  | 'verified'
  | 'review'
  | 'flagged'
  | 'ai'
  | 'draft'
  | 'unpublished';

export function Badge({
  variant,
  children,
}: {
  variant: BadgeVariant;
  children: React.ReactNode;
}) {
  return <span className={`badge badge-${variant}`}>{children}</span>;
}
