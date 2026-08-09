import type { ReactNode } from 'react';

// KeyValue + KeyValueList — definition-list primitive for structured
// term/definition pairs (e.g. persona attributes, glossary entries,
// architecture decision metadata). Renders semantic <dl>/<dt>/<dd>.

export type KeyValueTone =
  | 'neutral'
  | 'info'
  | 'ok'
  | 'warn'
  | 'danger'
  | 'accent'
  | 'gilt';

export function KeyValueList({
  children,
  variant = 'card',
}: {
  children: ReactNode;
  // 'card'    — boxed surface with hairline + soft shadow (default).
  // 'inline'  — flush with prose, no surface; for tighter sections.
  variant?: 'card' | 'inline';
}) {
  return <dl className={`kv-list kv-list-${variant}`}>{children}</dl>;
}

export function KeyValue({
  label,
  tone = 'neutral',
  children,
}: {
  label: string;
  // Optional semantic color wash to distinguish categorical sections.
  // Common mapping: info = technical proficiency / capabilities,
  // ok = primary goals / positive outcomes, warn = constraints /
  // considerations, accent = access conditions / structural facts.
  // Defaults to 'neutral' (hairline-separated, no tint).
  tone?: KeyValueTone;
  children: ReactNode;
}) {
  return (
    <div className="kv-row" data-tone={tone}>
      <dt className="kv-key">{label}</dt>
      <dd className="kv-val">{children}</dd>
    </div>
  );
}
