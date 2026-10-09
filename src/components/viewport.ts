/**
 * Keeps an absolutely placed box inside the viewport, by moving it sideways.
 *
 * Internal. The tooltip and the menu both open at the inline-start edge of
 * their trigger, and a trigger near the end of a line would put either one
 * over the edge of the page: a horizontal scrollbar at 320 CSS pixels, because
 * an explanation or a list opened (WCAG 1.4.10).
 *
 * Measured where the stylesheet puts the box, then moved by the overhang. The
 * offset is written to the same inset the stylesheet sets, and not to a
 * transform: a transformed box still counts where it would have been towards
 * the page's scrollable width, so the scrollbar this exists to prevent would
 * remain.
 *
 * Call it before paint, from a layout effect, each time the box is shown.
 */

import { useEffect, useLayoutEffect } from 'react';

// The layout effect, so the box is moved before it is painted and the page is
// never one frame too wide. On the server there is no layout and React 18
// warns about the hook there, so the plain effect stands in, and does nothing.
export const useBeforePaint = typeof window === 'undefined' ? useEffect : useLayoutEffect;

/** The least distance kept between the box and the viewport's edge, in CSS pixels. `--sp-4`. */
export const EDGE_MARGIN_PX = 16;

export function keepInViewport(box: HTMLElement): void {
  box.style.insetInlineStart = '';
  const rect = box.getBoundingClientRect();
  const view = box.ownerDocument.defaultView;
  const width = box.ownerDocument.documentElement.clientWidth;
  let shift = 0;
  if (rect.right > width - EDGE_MARGIN_PX) shift = width - EDGE_MARGIN_PX - rect.right;
  if (rect.left + shift < EDGE_MARGIN_PX) shift = EDGE_MARGIN_PX - rect.left;
  if (shift === 0) return;
  // The inline-start edge is the right-hand one in a right-to-left line.
  const rtl = view?.getComputedStyle(box).direction === 'rtl';
  box.style.insetInlineStart = `${rtl ? -shift : shift}px`;
}
