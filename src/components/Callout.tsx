import type { ReactNode } from 'react';

// Callout — editorial aside with semantic tone. Six types, each mapped
// to a token pair (--*-soft for the wash, --* for the stripe and label).
//
//   <Callout type="warn" title="Caution">…</Callout>
//
// Authors compose in MDX. The component itself is intentionally
// minimal — the per-type styling lives in app/globals.css under a
// `[data-type=…]` selector, mirroring the kv-row tone pattern.
//
// "quote" is for editorial pull-quotes. Source quotations should still
// use the native <blockquote> element, which has its own styling.

export type CalloutType = 'note' | 'info' | 'tip' | 'warn' | 'danger' | 'quote';

export function Callout({
  type = 'note',
  title,
  children,
}: {
  type?: CalloutType;
  title?: string;
  children: ReactNode;
}) {
  return (
    <aside className="callout" data-type={type} role={type === 'danger' || type === 'warn' ? 'note' : undefined}>
      {title && <p className="callout-title">{title}</p>}
      <div className="callout-body">{children}</div>
    </aside>
  );
}
