'use client';

import { useEffect } from 'react';

/**
 * Points the arrow on an in-page link up or down, towards its target.
 *
 *   <InPageLinkDirection rescanKey={pathname} />
 *
 * The reset draws an arrow after every link in running text, and gives a
 * fragment link (`href="#…"`) a down arrow. Whether the target is above or
 * below the link is a question about the document, which CSS cannot ask, so
 * this component asks it: every fragment link in the document is given
 * `data-link-direction`, `up` when its target comes before it, `down` when
 * after. Before it runs, and on a page without it, the arrow stays down.
 *
 * Order is document order, not position on screen, so the answer does not
 * change as the reader scrolls and costs nothing to keep. A target that holds
 * the link, a section linking to its own top, is above it. An empty fragment
 * and `#top` with no element of that id go to the top of the page, which is
 * up. A fragment whose target is missing loses the attribute and keeps the
 * reset's default.
 *
 * Links are read shortly after mount and again whenever `rescanKey` changes.
 * Pass the route, for the reason `OnThisPage` takes one: a client-side
 * navigation swaps the page without remounting the layout this sits in.
 * Renders nothing.
 */

export interface InPageLinkDirectionProps {
  /** Change it to read the links again, after a client-side navigation. */
  rescanKey?: unknown;
}

function findTarget(fragment: string): Element | null {
  const byId = document.getElementById(fragment);
  if (byId) return byId;
  try {
    return document.getElementById(decodeURIComponent(fragment));
  } catch {
    return null;
  }
}

/** `up`, `down`, or null when the fragment names nothing. */
function inPageLinkDirection(link: Element): 'up' | 'down' | null {
  const fragment = (link.getAttribute('href') ?? '').slice(1);
  const target = fragment === '' ? null : findTarget(fragment);
  if (!target) return fragment === '' || fragment.toLowerCase() === 'top' ? 'up' : null;
  return target.compareDocumentPosition(link) & Node.DOCUMENT_POSITION_FOLLOWING ? 'up' : 'down';
}

export function InPageLinkDirection({ rescanKey }: InPageLinkDirectionProps) {
  useEffect(() => {
    const timer = window.setTimeout(() => {
      for (const link of document.querySelectorAll('a[href^="#"]')) {
        const direction = inPageLinkDirection(link);
        if (direction) link.setAttribute('data-link-direction', direction);
        else link.removeAttribute('data-link-direction');
      }
    }, 30);
    return () => window.clearTimeout(timer);
  }, [rescanKey]);

  return null;
}
