'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { useModalSurface, type ElementRef } from '../a11y/useModalSurface.js';
import { MenuIcon, XIcon } from './icons.js';

/**
 * The navigation drawer for narrow viewports: a trigger, a backdrop, and a
 * panel that slides in from the start edge holding whatever navigation the
 * application renders into it.
 *
 *   <NavDrawer label="Site navigation" closeKey={pathname}>
 *     <Sidebar idPrefix="drawer" />
 *   </NavDrawer>
 *
 * The drawer is chrome, and the navigation inside it is not. The documentation
 * site and deree's research area each carried a copy of this component, the
 * second ported from the first, and the two differed only in the sidebar they
 * wrapped and in how much of the modal promise each kept. The sidebar stays
 * the application's; the drawer is one component.
 *
 * It keeps the whole promise `aria-modal="true"` makes, through
 * `useModalSurface`: the page behind is inert, Tab cycles inside, Escape
 * closes, the page scroll is locked, and focus returns to the trigger after the
 * page is released. The backdrop is exempt from the inert background, because
 * a press on it is how the drawer closes.
 *
 * Closed, the panel is inert and hidden by `visibility`, which the stylesheet
 * delays by the length of the slide so it does not vanish mid-motion. It stays
 * mounted either way: under reduced motion `transitionend` never fires, so
 * nothing here waits on it.
 *
 * Touch, not mouse: a swipe in from the start edge opens it below 921px, and a
 * swipe back across the panel closes it. The thresholds are the ones both
 * copies used — a start within 24px of the edge, 50px of travel, and a path at
 * least 1.6 times as horizontal as it is vertical, so a vertical scroll never
 * opens it.
 *
 * Routing is the application's. Pass the route as `closeKey` and the drawer
 * closes whenever it changes, which is what the copies did by importing
 * `next/navigation` — something a package that no application's router owns
 * may not do. For control from outside — a shortcut that opens the drawer on
 * its search field — pass `open` and `onOpenChange`, and `initialFocusRef` for
 * where focus lands.
 *
 * The trigger renders where the component is placed; the application positions
 * it. Below 921px it shows, and above it does not, the breakpoint at which the
 * shared table stylesheet stops scrolling tables in their cards. Styles ship in
 * `@ekdotico/domico/styles/nav-drawer.css`.
 */

const EDGE_TRIGGER_PX = 24;
const SWIPE_DISTANCE_PX = 50;
const SWIPE_RATIO = 1.6;
/** Vertical travel past which a gesture is a scroll and stops being tracked. */
const SCROLL_ABANDON_PX = 24;
const NARROW_QUERY = '(max-width: 920px)';

type Direction = 'open' | 'close';

/**
 * Track one touch or pen gesture on `target`, and call `onSwipe` once when it
 * travels far enough, horizontally enough, in `direction`.
 */
function trackSwipe(
  target: Window | HTMLElement,
  direction: Direction,
  onSwipe: () => void,
): () => void {
  let startX = 0;
  let startY = 0;
  let tracking = false;

  const onStart = (event: Event) => {
    const e = event as PointerEvent;
    if (e.pointerType === 'mouse') return;
    if (direction === 'open' && e.clientX > EDGE_TRIGGER_PX) return;
    startX = e.clientX;
    startY = e.clientY;
    tracking = true;
  };
  const onMove = (event: Event) => {
    if (!tracking) return;
    const e = event as PointerEvent;
    const dx = direction === 'open' ? e.clientX - startX : startX - e.clientX;
    const dy = Math.abs(e.clientY - startY);
    if (dx > SWIPE_DISTANCE_PX && dx > dy * SWIPE_RATIO) {
      tracking = false;
      onSwipe();
    } else if (dy > SCROLL_ABANDON_PX && dy > dx) {
      tracking = false;
    }
  };
  const onEnd = () => {
    tracking = false;
  };

  const options = { passive: true } as const;
  target.addEventListener('pointerdown', onStart, options);
  target.addEventListener('pointermove', onMove, options);
  target.addEventListener('pointerup', onEnd, options);
  target.addEventListener('pointercancel', onEnd, options);
  return () => {
    target.removeEventListener('pointerdown', onStart);
    target.removeEventListener('pointermove', onMove);
    target.removeEventListener('pointerup', onEnd);
    target.removeEventListener('pointercancel', onEnd);
  };
}

export function NavDrawer({
  label,
  triggerLabel = 'Open navigation menu',
  closeLabel = 'Close navigation menu',
  children,
  open: openProp,
  onOpenChange,
  closeKey,
  initialFocusRef,
  id = 'nav-drawer',
}: {
  /** The drawer's accessible name, such as "Site navigation". */
  label: string;
  /** The trigger's accessible name. The trigger shows an icon alone. */
  triggerLabel?: string;
  /** The close button's accessible name. */
  closeLabel?: string;
  /** The navigation. */
  children: ReactNode;
  /** Controls the drawer from outside. Leave unset for the drawer to hold its own state. */
  open?: boolean;
  /** Called with the next state whenever the drawer opens or closes. */
  onOpenChange?: (open: boolean) => void;
  /** Closes the drawer whenever it changes. Pass the route. */
  closeKey?: unknown;
  /** Where focus lands on opening. Defaults to the first control inside. */
  initialFocusRef?: ElementRef<HTMLElement>;
  /** The panel's id, which the trigger's `aria-controls` names. */
  id?: string;
}) {
  const [ownOpen, setOwnOpen] = useState(false);
  const open = openProp ?? ownOpen;
  const controlled = openProp !== undefined;

  const drawerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  // The latest callback, so `setOpen` keeps one identity for the effects below.
  const latest = useRef({ controlled, onOpenChange });
  useEffect(() => {
    latest.current = { controlled, onOpenChange };
  });
  const setOpen = useCallback((next: boolean) => {
    if (!latest.current.controlled) setOwnOpen(next);
    latest.current.onOpenChange?.(next);
  }, []);
  const close = useCallback(() => setOpen(false), [setOpen]);

  // Closed, the panel is inert. Declared before useModalSurface so that on
  // opening the panel is live again before focus is moved into it.
  useEffect(() => {
    drawerRef.current?.toggleAttribute('inert', !open);
  }, [open]);

  useModalSurface({
    open,
    surfaceRef: drawerRef,
    triggerRef,
    initialFocusRef,
    onClose: close,
    keep: [backdropRef],
    lockScroll: true,
  });

  // A completed navigation must not leave the drawer open over the new page.
  // The first run is skipped: mounting is not a change of route.
  const firstKey = useRef(true);
  useEffect(() => {
    if (firstKey.current) {
      firstKey.current = false;
      return;
    }
    close();
  }, [closeKey, close]);

  // Swipe in from the start edge to open, at narrow widths only.
  useEffect(() => {
    if (open || typeof window.matchMedia !== 'function') return;
    if (!window.matchMedia(NARROW_QUERY).matches) return;
    return trackSwipe(window, 'open', () => setOpen(true));
  }, [open, setOpen]);

  // Swipe back across the panel to close.
  useEffect(() => {
    const drawer = drawerRef.current;
    if (!open || !drawer) return;
    return trackSwipe(drawer, 'close', close);
  }, [open, close]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="mobile-nav-trigger"
        aria-label={triggerLabel}
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen(true)}
      >
        <MenuIcon size={20} />
      </button>

      <div
        ref={backdropRef}
        className={`mobile-nav-backdrop${open ? ' is-open' : ''}`}
        onClick={close}
        aria-hidden="true"
      />

      <div
        ref={drawerRef}
        id={id}
        className={`mobile-nav-drawer${open ? ' is-open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
      >
        <button type="button" className="mobile-nav-close" aria-label={closeLabel} onClick={close}>
          <XIcon size={18} />
        </button>
        <div className="mobile-nav-body">{children}</div>
      </div>
    </>
  );
}
