import { useId, type ReactNode } from 'react';
import {
  InfoIcon,
  LightbulbIcon,
  OctagonAlertIcon,
  QuoteIcon,
  StickyNoteIcon,
  TriangleAlertIcon,
  type IconProps,
} from './icons.js';

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

//
// `warning` is `warn` under the name the editor's requirement gives it (note,
// warning, tip). Both are accepted and drawn alike; the attribute carries
// whichever was passed.
//
// `icon` draws the type's own icon beside the text, and `label` is the type in
// the application's words: "Note", "Warning", "Tip". Together they are what
// keeps the type from resting on the colour of the wash (WCAG 1.4.1). The
// editor's three callouts take both:
//
//   <Callout type="warning" icon label="Warning">…</Callout>
//
// With no title the label names the note, so a screen reader announces
// "Warning, note", and the icon is decoration beside words that already say
// it. With a title the title names the note, as before, and the label is the
// icon's text alternative, read once inside it. Neither is on by default: a
// callout that passes neither renders what it rendered before there were any.

export type CalloutType = 'note' | 'info' | 'tip' | 'warn' | 'warning' | 'danger' | 'quote';

const ICON: Record<CalloutType, (props: IconProps) => ReactNode> = {
  note: StickyNoteIcon,
  info: InfoIcon,
  tip: LightbulbIcon,
  warn: TriangleAlertIcon,
  warning: TriangleAlertIcon,
  danger: OctagonAlertIcon,
  quote: QuoteIcon,
};

export function Callout({
  type = 'note',
  title,
  icon = false,
  label,
  children,
}: {
  type?: CalloutType;
  title?: string;
  /** Draws the type's icon beside the text. */
  icon?: boolean;
  /** The type in words. Names the note where there is no title, and is the icon's text alternative where there is one. */
  label?: string;
  children: ReactNode;
}) {
  const titleId = useId();
  const TypeIcon = ICON[type];
  return (
    <aside
      className="callout"
      data-type={type}
      data-icon={icon ? '' : undefined}
      role="note"
      aria-labelledby={title ? titleId : undefined}
      aria-label={title ? undefined : label}
    >
      {icon ? (
        <span className="callout-icon">
          <TypeIcon title={title ? label : undefined} />
        </span>
      ) : null}
      {title && (
        <p className="callout-title" id={titleId}>
          {title}
        </p>
      )}
      <div className="callout-body">{children}</div>
    </aside>
  );
}
