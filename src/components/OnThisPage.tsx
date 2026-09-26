'use client';

import { useEffect, useId, useState } from 'react';

/**
 * The on-this-page rail: a list of the page's headings, with the one being
 * read marked as the reader scrolls.
 *
 *   <OnThisPage root=".content-inner" rescanKey={pathname} />
 *
 * Chrome, not information architecture. The headings are the page's and the
 * rail only reads them, so the same component serves any page that has
 * headings — which is why it sits beside the drawer rather than with the
 * sidebar that stays in each application. The documentation site and deree's
 * research area carried it as two copies, the second ported from the first and
 * then left behind by three fixes. This is the documentation site's, which had
 * them:
 *
 * - The entry being read carries `aria-current="location"`, not a class alone,
 *   so the position it marks exists for a screen reader too (WCAG 1.3.1).
 * - A heading's own id is read, never replaced. One without an id is given a
 *   slug, and the slug is de-duplicated against every id in the document with
 *   the suffixes a Markdown slugger writes (`-1`, `-2`), so two headings with
 *   the same text no longer share an id and light up together.
 * - A badge inside a heading keeps its classes in the rail and leaves the
 *   accessible name alone: the link is named by the heading's text in full,
 *   and the badge's copy is hidden rather than read twice.
 *
 * The rail is a `<nav>` named by its visible label; the copies used an
 * `<aside>`, a complementary landmark, for what is a set of links. It renders
 * nothing until it has found at least one heading.
 *
 * Headings are read shortly after mount and again whenever `rescanKey` changes.
 * Pass the route: a client-side navigation swaps the page without remounting
 * the layout the rail sits in, and the copies re-read on `usePathname()`, an
 * import a package may not make. `rootMargin` is the observer's; the default
 * counts a heading as read once it clears a top bar of `--topbar-h`'s default
 * and until it reaches the top 30% of the viewport.
 *
 * Styles ship in `@ekdotico/domico/styles/on-this-page.css`. Where the rail
 * sits in a layout, and the width below which it is hidden, are the
 * application's.
 */

type Segment = { kind: 'text'; value: string } | { kind: 'badge'; className: string; text: string };

type Entry = { id: string; level: number; segments: Segment[]; text: string };

/** The same shape a Markdown slugger writes, so a made-up id reads like a real one. */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function readSegments(heading: HTMLElement, badgeSelector: string): Segment[] {
  const segments: Segment[] = [];
  heading.childNodes.forEach((child) => {
    if (child.nodeType === 3) {
      const value = (child.textContent ?? '').replace(/\s+/g, ' ');
      if (value) segments.push({ kind: 'text', value });
      return;
    }
    if (child.nodeType !== 1) return;
    const el = child as HTMLElement;
    const text = (el.textContent ?? '').trim();
    if (!text) return;
    if (badgeSelector && el.matches(badgeSelector)) {
      segments.push({ kind: 'badge', className: el.className, text });
    } else {
      segments.push({ kind: 'text', value: text });
    }
  });
  return segments;
}

function scan(rootSelector: string | undefined, selector: string, badgeSelector: string): Entry[] {
  const root: ParentNode | null = rootSelector ? document.querySelector(rootSelector) : document;
  if (!root) return [];
  const entries: Entry[] = [];
  root.querySelectorAll<HTMLElement>(selector).forEach((heading) => {
    const text = (heading.textContent ?? '').replace(/\s+/g, ' ').trim();
    if (!text) return;
    if (!heading.id) {
      const base = slugify(text) || 'section';
      let candidate = base;
      for (let n = 1; document.getElementById(candidate); n += 1) candidate = `${base}-${n}`;
      heading.id = candidate;
    }
    const level = /^H([1-6])$/.exec(heading.tagName)?.[1];
    entries.push({
      id: heading.id,
      level: level ? Number(level) : 2,
      segments: readSegments(heading, badgeSelector),
      text,
    });
  });
  return entries;
}

export function OnThisPage({
  selector = 'h2, h3',
  root,
  label = 'On this page',
  rescanKey,
  rootMargin = '-80px 0px -70% 0px',
  badgeSelector = '.badge',
}: {
  /** Which headings to list. */
  selector?: string;
  /** A selector for the element the headings are read from. Defaults to the document. */
  root?: string;
  /** The rail's visible label, which also names it. */
  label?: string;
  /** Re-reads the headings whenever it changes. Pass the route. */
  rescanKey?: unknown;
  /** The IntersectionObserver's root margin, deciding which heading is being read. */
  rootMargin?: string;
  /** Children of a heading drawn as a badge in the rail. An empty string turns it off. */
  badgeSelector?: string;
}) {
  const labelId = useId();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  // A short delay, so the page the route just rendered is in the document.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setEntries(scan(root, selector, badgeSelector));
      setActiveId(null);
    }, 30);
    return () => window.clearTimeout(timer);
  }, [rescanKey, root, selector, badgeSelector]);

  useEffect(() => {
    if (entries.length === 0 || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      (records) => {
        const visible = records
          .filter((r) => r.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin, threshold: 0 },
    );
    for (const { id } of entries) {
      const heading = document.getElementById(id);
      if (heading) observer.observe(heading);
    }
    return () => observer.disconnect();
  }, [entries, rootMargin]);

  if (entries.length === 0) return null;

  // The shallowest level listed is the outline's top, whatever tag it is.
  const top = Math.min(...entries.map((e) => e.level));

  return (
    <nav className="on-this-page" aria-labelledby={labelId}>
      <p className="otp-eyebrow" id={labelId}>
        {label}
      </p>
      <ul className="otp-list">
        {entries.map((entry) => {
          const current = activeId === entry.id;
          const hasBadge = entry.segments.some((s) => s.kind === 'badge');
          return (
            <li
              key={entry.id}
              className={`otp-l${entry.level - top + 2}${current ? ' active' : ''}`}
            >
              <a
                href={`#${entry.id}`}
                aria-current={current ? 'location' : undefined}
                aria-label={hasBadge ? entry.text : undefined}
              >
                {entry.segments.map((segment, i) =>
                  segment.kind === 'text' ? (
                    <span key={i}>{segment.value}</span>
                  ) : (
                    <span key={i} className={segment.className} aria-hidden="true">
                      {segment.text}
                    </span>
                  ),
                )}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
