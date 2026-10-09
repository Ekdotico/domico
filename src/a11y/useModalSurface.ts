'use client';

import { useEffect, useRef } from 'react';
import { inertOutside } from './inertOutside.js';

/**
 * Keep the promise `aria-modal="true"` makes, for as long as `open` is true.
 *
 *   const surface = useRef<HTMLDivElement>(null);
 *   const trigger = useRef<HTMLButtonElement>(null);
 *   useModalSurface({ open, surfaceRef: surface, triggerRef: trigger, onClose: () => setOpen(false) });
 *
 *   <button ref={trigger} aria-expanded={open} onClick={() => setOpen(true)}>Menu</button>
 *   <div ref={surface} role="dialog" aria-modal="true" aria-label="Menu" tabIndex={-1}>…</div>
 *
 * A modal surface owes four things, and the hand-written ones in the estate
 * each kept a different subset. The documentation site's mobile navigation
 * cycles Tab and leaves the page behind it reachable: its shell-level inert
 * helper would have inerted the drawer too, because the drawer is rendered
 * inside the shell. `inertOutside` walks up from the surface and spares its
 * own ancestors, which is exactly the case that helper could not serve.
 * deree's research drawer kept all four, in two helpers and an effect per
 * surface — the version this hook is built from.
 *
 *   1. Everything outside the surface is inert — `inertOutside`, which is what
 *      removes it from the Tab order, the pointer, and the accessibility tree.
 *   2. Tab and Shift+Tab cycle within the surface. `inert` alone would leave
 *      Tab falling off the end into the browser chrome, which for a keyboard
 *      reader is leaving the page.
 *   3. Escape calls `onClose`, unless its default was already prevented:
 *      a control inside the surface that closes on Escape prevents it, and
 *      one key then closes one thing. `MenuButton` does this. An Escape
 *      pressed while an input method is composing is not the surface's
 *      either: it cancels the composition, and the next one closes.
 *   4. On close, the page is released first and focus returns to the trigger
 *      second — in that order, because an inert element cannot take focus.
 *
 * **The contract for anything inside the surface that reads Escape: prevent
 * the default when the key was used, and only then.** The hook listens on
 * the document, so a handler inside the surface runs before it, and
 * `defaultPrevented` is the one thing it can read of what that handler did.
 * A handler that prevents every Escape it sees, used or not, leaves the
 * surface with no Escape and a keyboard reader with no way out. A handler
 * that closes something of its own and does not prevent the default closes
 * the surface under it with the same key. Stopping propagation is not the
 * signal: it would also keep the key from every other listener on the
 * document.
 *
 * Focus on open goes to `initialFocusRef`, else the first focusable element
 * inside the surface, else the surface itself, which should then carry
 * `tabIndex={-1}`. Without `triggerRef`, focus returns to whatever held it
 * when the surface opened.
 *
 * `keep` exempts elements outside the surface from the inert background — a
 * backdrop whose click dismisses it. `lockScroll` stops the page scrolling
 * under an overlay that covers it, and restores the previous value on close.
 *
 * It holds no visual state and waits on no transition event. A surface that
 * fades out stays mounted and is hidden by a class, for the reason the reset's
 * reduced-motion rule gives: under it `transitionend` never fires.
 */

/**
 * The shape of a ref, stated structurally. React 19 changed the variance of
 * `RefObject`, so a signature naming it types cleanly under one React major
 * and fails under the other; this package supports both through its peer
 * range. `useRadioGroup` records the same constraint.
 */
export interface ElementRef<T extends Element> {
  readonly current: T | null;
}

export interface ModalSurfaceOptions {
  /** Whether the surface is open. Everything below applies while it is. */
  open: boolean;
  /** The element carrying `role="dialog"` and `aria-modal="true"`. */
  surfaceRef: ElementRef<HTMLElement>;
  /** Where focus returns on close. Defaults to whatever held it on open. */
  triggerRef?: ElementRef<HTMLElement>;
  /** Where focus goes on open. Defaults to the first focusable element inside. */
  initialFocusRef?: ElementRef<HTMLElement>;
  /** Called on Escape. The caller decides what closing means. */
  onClose: () => void;
  /** Elements outside the surface that stay interactive, such as a backdrop. */
  keep?: readonly ElementRef<Element>[];
  /** Stop the page scrolling beneath the surface while it is open. */
  lockScroll?: boolean;
}

// deree's list, which already covered `summary` and the editable region.
const FOCUSABLE = [
  'a[href]',
  'area[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'iframe',
  'audio[controls]',
  'video[controls]',
  'summary',
  '[contenteditable]:not([contenteditable="false"])',
  '[tabindex]',
].join(',');

/**
 * The elements Tab would visit inside `root`, in document order. A negative
 * tabindex is a programmatic focus target and not a Tab stop; anything hidden,
 * inert, or aria-hidden is not reachable; and an element with no box is
 * skipped too. That last one is the documentation site's finding: a collapsed
 * navigation section is `display: none`, `querySelectorAll` still returns its
 * links, and focusing one is a no-op — so a cycle that counted it as the last
 * stop let Tab escape the surface.
 */
export function tabbableWithin(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) =>
      el.tabIndex >= 0 &&
      !el.closest('[inert], [hidden], [aria-hidden="true"]') &&
      el.getClientRects().length > 0,
  );
}

export function useModalSurface({
  open,
  surfaceRef,
  triggerRef,
  initialFocusRef,
  onClose,
  keep,
  lockScroll = false,
}: ModalSurfaceOptions): void {
  // The latest callbacks and exemptions, read when needed rather than listed
  // as dependencies. An inline `onClose` is a new function every render, and
  // re-running the effect for it would release and re-inert the page and move
  // focus back to the start on every keystroke inside the surface.
  const latest = useRef({ onClose, keep });
  useEffect(() => {
    latest.current = { onClose, keep };
  });

  useEffect(() => {
    if (!open) return;
    const surface = surfaceRef.current;
    if (!surface) return;
    const doc = surface.ownerDocument;

    // Captured before focus moves, so it is the element the reader left.
    const returnTo =
      triggerRef?.current ?? (doc.activeElement instanceof HTMLElement ? doc.activeElement : null);

    const release = inertOutside(surface, (latest.current.keep ?? []).map((ref) => ref.current));

    let unlock: (() => void) | null = null;
    if (lockScroll) {
      const body = doc.body;
      const previous = body.style.overflow;
      body.style.overflow = 'hidden';
      unlock = () => {
        body.style.overflow = previous;
      };
    }

    (initialFocusRef?.current ?? tabbableWithin(surface)[0] ?? surface).focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        // An input method is composing, and Escape cancels its candidate.
        // 229 is what a keydown reports in engines that fire it before
        // `compositionstart` has set the flag, as `optionListKey` reads it.
        if (event.isComposing || event.keyCode === 229) return;
        // An Escape something inside has already answered, and said so by
        // preventing the default: a menu, a tooltip, a list at the text
        // cursor. It closed that; the next one closes the surface.
        if (!event.defaultPrevented) latest.current.onClose();
        return;
      }
      // A chord with Tab in it belongs to the browser or the platform —
      // Ctrl+Tab switches browser tabs — and is not the reader moving focus.
      if (event.key !== 'Tab' || event.altKey || event.ctrlKey || event.metaKey) return;
      const stops = tabbableWithin(surface);
      const first = stops[0];
      const last = stops[stops.length - 1];
      if (!first || !last) {
        event.preventDefault();
        surface.focus();
        return;
      }
      const active = doc.activeElement;
      const inside = active instanceof Node && surface.contains(active);
      if (event.shiftKey && (active === first || !inside)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || !inside)) {
        event.preventDefault();
        first.focus();
      }
    };
    doc.addEventListener('keydown', onKeyDown);

    return () => {
      doc.removeEventListener('keydown', onKeyDown);
      unlock?.();
      // Release first: the trigger is outside the surface, so until the page
      // is released it is inert, and focus() on it does nothing.
      release();
      returnTo?.focus();
    };
  }, [open, surfaceRef, triggerRef, initialFocusRef, lockScroll]);
}
