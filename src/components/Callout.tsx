import { useId, type ReactNode } from 'react';

// Callout — editorial aside with semantic tone. Six types, each mapped
// to a token pair (--*-soft for the wash, --* for the hairline border
// and the label).
//
//   <Callout type="warn" title="Caution">…</Callout>
//
// Authors compose in MDX. The component itself is intentionally
// minimal — the per-type styling lives in the package stylesheet under a
// `[data-type=…]` selector, mirroring the kv-row tone pattern. Take it
// from `@ekdotico/domico/styles/callout.css` if the whole component layer
// is more than the application wants.
//
// Every type is `role="note"`, and it used to be only warn and danger. The
// others rendered a bare `<aside>`, which is a complementary landmark: a page
// with six notes put six unnamed "complementary" entries in the landmark list,
// beside the real one a sidebar is, and a reader navigating by landmark could
// not tell a tip from the navigation. A callout is subordinate to the text it
// sits in, which is what `note` says. None of the six is `alert`: the content
// is part of the page, present on load, and an alert would announce it over
// whatever the reader was doing.
//
// The title names the note through `aria-labelledby`, so a screen reader
// announces "Caution, note" rather than "note" and then the title as the first
// line of its content. The title stays a `<p>`, not a heading: a callout is not
// a section, and a heading per callout would put every tip in the outline.
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
  const titleId = useId();
  return (
    <aside className="callout" data-type={type} role="note" aria-labelledby={title ? titleId : undefined}>
      {title && (
        <p className="callout-title" id={titleId}>
          {title}
        </p>
      )}
      <div className="callout-body">{children}</div>
    </aside>
  );
}
