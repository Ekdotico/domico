'use client';

import {
  cloneElement,
  isValidElement,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';
import { describedBy } from './Field.js';

/**
 * A short explanation of one control or one mark, shown on hover and on focus.
 *
 *   <Tooltip content="This document was created without provenance recording and cannot be sealed.">
 *     Not recorded
 *   </Tooltip>
 *
 *   <Tooltip content="Opens the list of past versions">
 *     <Button variant="quiet">History</Button>
 *   </Tooltip>
 *
 * WCAG 2.2 SC 1.4.13 asks three things of content that appears on hover or
 * focus, and each is a decision here:
 *
 * - Dismissible. Escape hides it without moving the pointer or focus, and it
 *   stays hidden until the pointer or focus arrives again. The key is taken
 *   only while the tooltip is showing, and is then kept from an enclosing
 *   dialog, so the first Escape hides the tooltip and the second closes the
 *   dialog.
 * - Hoverable. The content is inside the element the pointer is tracked on,
 *   and the gap between it and the trigger is bridged, so the pointer can move
 *   onto the text — to read it magnified — without it closing.
 * - Persistent. It stays until the pointer leaves, focus leaves, or Escape.
 *   Nothing times it out.
 *
 * Focus opens it only where the browser would draw a focus ring, which is to
 * say for a keyboard. A control that is pressed with a mouse keeps focus
 * afterwards, and a tooltip that opened on that focus would sit over the page
 * until the reader pressed somewhere else.
 *
 * The content is tied to the trigger by `aria-describedby`, so it is read with
 * the control whether or not it is showing, and it is `role="tooltip"`. It is
 * text: a link or a button inside it could not be reached by the keyboard, and
 * `ekdotico-check a11y` reports one. An explanation that needs a link belongs
 * in the page.
 *
 * The trigger has to take focus, or the tooltip does not exist for a keyboard.
 * Pass one element that does — a `Button`, a link — and it is described in
 * place. Pass text and the package renders the trigger: a button, because a
 * mark such as "Not recorded" is not otherwise a Tab stop. A press on that
 * button shows the tooltip and a second press hides it, which is what a touch
 * has in place of a hover; a press anywhere else hides it too. An element of
 * the application's own keeps its own press and is not given this one.
 *
 * Mouse events rather than pointer events: a touch ends its pointer the moment
 * the finger lifts, which would close the tooltip as it opened.
 *
 * Closed, the content is not laid out, so it widens nothing. Open, it is never
 * wider than the viewport less a margin, and it is moved sideways by as much
 * as keeps it inside: a page must not scroll in two directions at 320 CSS
 * pixels because an explanation opened (SC 1.4.10).
 *
 * Styles ship in `@ekdotico/domico/styles/tooltip.css`.
 */

/** The least distance kept between the tooltip and the viewport's edge, in CSS pixels. `--sp-4`. */
const EDGE_MARGIN_PX = 16;

// The layout effect, so the box is moved before it is painted and the page is
// never one frame too wide. On the server there is no layout and React 18
// warns about the hook there, so the plain effect stands in, and does nothing.
const useBeforePaint = typeof window === 'undefined' ? useEffect : useLayoutEffect;

export function Tooltip({
  content,
  children,
  placement = 'bottom',
  id,
  className,
}: {
  /** The explanation. Text, with no control inside it. */
  content: ReactNode;
  /** One focusable element to describe, or the text of a trigger the package renders. */
  children: ReactNode;
  /** Which side of the trigger the tooltip opens on. */
  placement?: 'top' | 'bottom';
  id?: string;
  className?: string;
}) {
  const ownId = useId();
  const tipId = id ?? ownId;
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const contentRef = useRef<HTMLSpanElement>(null);

  // Three ways it is held open, and one way it is put away.
  const held = useRef({ hover: false, focus: false, pinned: false });
  const [active, setActive] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const open = active && !dismissed;

  const hold = (patch: Partial<typeof held.current>) => {
    Object.assign(held.current, patch);
    setActive(held.current.hover || held.current.focus || held.current.pinned);
    // Arriving again, by any route, is what brings a dismissed tooltip back.
    if (patch.hover || patch.focus || patch.pinned) setDismissed(false);
  };

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      held.current.pinned = false;
      setDismissed(true);
    };
    // A press elsewhere releases a pinned tooltip. A touch leaves no hover to
    // end and, in some engines, moves no focus, so nothing else would.
    const onPointerDown = (event: Event) => {
      if (event.target instanceof Node && wrapperRef.current?.contains(event.target)) return;
      hold({ pinned: false });
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
    };
    // `hold` reads a ref and sets state, so the one from this render does not go stale.
  }, [open]);

  // Keep it inside the viewport. Measured where the stylesheet puts it, at the
  // trigger's inline-start edge, then moved by the overhang. The offset is
  // written to the same inset the stylesheet sets, and not to a transform: a
  // transformed box still counts where it would have been towards the page's
  // scrollable width, so the scrollbar this exists to prevent would remain.
  useBeforePaint(() => {
    const box = contentRef.current;
    if (!open || !box) return;
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
  }, [open, content]);

  const trigger = isValidElement(children) ? (
    cloneElement(children as ReactElement<{ 'aria-describedby'?: string }>, {
      'aria-describedby': describedBy(
        (children as ReactElement<{ 'aria-describedby'?: string }>).props['aria-describedby'],
        tipId,
      ),
    })
  ) : (
    <button
      type="button"
      className="ekd-tooltip-trigger"
      aria-describedby={tipId}
      onClick={() => {
        // The first press pins it open and the second puts it away, as Escape
        // does. Decided on the pin and not on whether it is showing: a touch
        // sends a hover just before its press, so by the time the press
        // arrives the tooltip is already up, and a press that closed whatever
        // was showing would close it on the tap that opened it.
        if (held.current.pinned) {
          held.current.pinned = false;
          setDismissed(true);
        } else {
          hold({ pinned: true });
        }
      }}
    >
      {children}
    </button>
  );

  return (
    <span
      ref={wrapperRef}
      className={['ekd-tooltip', className].filter(Boolean).join(' ')}
      data-open={open || undefined}
      data-placement={placement}
      onMouseEnter={() => hold({ hover: true })}
      onMouseLeave={() => hold({ hover: false })}
      onFocus={(event) => {
        if (event.target.matches(':focus-visible')) hold({ focus: true });
      }}
      onBlur={() => hold({ focus: false, pinned: false })}
    >
      {trigger}
      <span ref={contentRef} id={tipId} role="tooltip" className="ekd-tooltip-content">
        {content}
      </span>
    </span>
  );
}
