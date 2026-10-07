'use client';

import {
  cloneElement,
  isValidElement,
  useEffect,
  useId,
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
 * The content is tied to the trigger by `aria-describedby`, so it is read with
 * the control whether or not it is showing, and it is `role="tooltip"`. It is
 * text: a link or a button inside it could not be reached by the keyboard, and
 * `ekdotico-check a11y` reports one. An explanation that needs a link belongs
 * in the page.
 *
 * The trigger has to take focus, or the tooltip does not exist for a keyboard.
 * Pass one element that does — a `Button`, a link — and it is described in
 * place. Pass text and the package renders the trigger: a button, because a
 * mark such as "Not recorded" is not otherwise a Tab stop, and on a phone a
 * press on it is the only hover there is.
 *
 * Mouse events rather than pointer events: a touch ends its pointer the moment
 * the finger lifts, which would close the tooltip as it opened.
 *
 * Styles ship in `@ekdotico/domico/styles/tooltip.css`.
 */
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

  const held = useRef({ hover: false, focus: false });
  const [active, setActive] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const open = active && !dismissed;

  const hold = (patch: { hover?: boolean; focus?: boolean }) => {
    Object.assign(held.current, patch);
    setActive(held.current.hover || held.current.focus);
    // Arriving again, by either route, is what brings a dismissed tooltip back.
    if (patch.hover || patch.focus) setDismissed(false);
  };

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      setDismissed(true);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  const trigger = isValidElement(children) ? (
    cloneElement(children as ReactElement<{ 'aria-describedby'?: string }>, {
      'aria-describedby': describedBy(
        (children as ReactElement<{ 'aria-describedby'?: string }>).props['aria-describedby'],
        tipId,
      ),
    })
  ) : (
    <button type="button" className="ekd-tooltip-trigger" aria-describedby={tipId}>
      {children}
    </button>
  );

  return (
    <span
      className={['ekd-tooltip', className].filter(Boolean).join(' ')}
      data-open={open || undefined}
      data-placement={placement}
      onMouseEnter={() => hold({ hover: true })}
      onMouseLeave={() => hold({ hover: false })}
      onFocus={() => hold({ focus: true })}
      onBlur={() => hold({ focus: false })}
    >
      {trigger}
      <span id={tipId} role="tooltip" className="ekd-tooltip-content">
        {content}
      </span>
    </span>
  );
}
