'use client';

import { useEffect } from 'react';
import type { ElementRef } from './useModalSurface.js';

/**
 * Numbered shortcuts for a navigation: Shift and a digit follows the item with
 * that number, and holding Shift alone shows the numbers.
 *
 *   const navRef = useRef<HTMLElement>(null);
 *   useNavShortcuts(navRef, { enabled: preferences.navShortcuts });
 *   <nav ref={navRef} aria-label="Site navigation">…links…</nav>
 *
 * The navigation stays the application's, as it does inside `NavDrawer`. This
 * numbers the first nine items in it, in document order, and renders nothing:
 * each numbered item is given `data-nav-shortcut="3"` and
 * `aria-keyshortcuts="Shift+3"`, and the container is given
 * `data-nav-shortcuts="visible"` while the numbers are shown. The stylesheet in
 * `@ekdotico/domico/styles/nav-shortcuts.css` draws the badge from those two
 * attributes, so no node is added to markup a framework owns.
 *
 * An item with no box, or inside an `inert` subtree, is not numbered: a link in
 * a collapsed group, or the copy of a sidebar in a closed drawer. The numbers
 * are worked out again whenever the navigation changes, and once more at the
 * moment they are shown or used.
 *
 * What it will not do, and each is a decision:
 *
 * - Nothing while focus is in a text field, a textarea, a select or an
 *   editable region. Shift and 1 types a character there, and Shift is held
 *   for every capital letter.
 * - No badges until Shift has been held alone for `delay` milliseconds, so a
 *   capital typed elsewhere does not flash them. They go on releasing Shift,
 *   on any other key or modifier, on a pointer press, and when the window
 *   loses focus. The shortcut itself does not wait for the badges.
 * - The digit is matched by its physical key (`event.code`), not by the
 *   character it types, which under Shift differs from one layout to the next.
 * - Nothing with Ctrl, Alt or Meta held, which belong to the browser and the
 *   platform, and nothing for a key another handler has already used.
 *
 * WCAG 2.1.4 applies: Shift and a digit types a character, so the shortcut is
 * one a person must be able to turn off. That is what `enabled` is for, and
 * the setting that drives it is the application's to offer and to remember.
 */

export interface NavShortcutsOptions {
  /** Which descendants of the container are navigation items. Defaults to `a[href]`. */
  items?: string;
  /** How long Shift is held alone before the numbers show, in milliseconds. Defaults to 400. */
  delay?: number;
}

const EDITABLE =
  'input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="textbox"]';
const ITEM_ATTRIBUTE = 'data-nav-shortcut';
const VISIBLE_ATTRIBUTE = 'data-nav-shortcuts';
const DIGIT = /^Digit([1-9])$/;

function isEditable(node: EventTarget | null): boolean {
  return node instanceof Element && node.closest(EDITABLE) !== null;
}

/**
 * Number the navigation items inside `container` and answer to Shift and a
 * digit until the returned function is called. Browser-only: call it from an
 * effect. To turn the shortcuts off, do not attach, or detach.
 */
export function attachNavShortcuts(
  container: HTMLElement,
  { items = 'a[href]', delay = 400 }: NavShortcutsOptions = {},
): () => void {
  const doc = container.ownerDocument;
  const view = doc.defaultView;
  let numbered: HTMLElement[] = [];
  let timer: ReturnType<typeof setTimeout> | undefined;

  const number = () => {
    const live = Array.from(container.querySelectorAll<HTMLElement>(items))
      .filter((item) => item.getClientRects().length > 0 && !item.closest('[inert]'))
      .slice(0, 9);
    for (const item of numbered) {
      if (live.includes(item)) continue;
      item.removeAttribute(ITEM_ATTRIBUTE);
      item.removeAttribute('aria-keyshortcuts');
    }
    live.forEach((item, index) => {
      const digit = String(index + 1);
      if (item.getAttribute(ITEM_ATTRIBUTE) === digit) return;
      item.setAttribute(ITEM_ATTRIBUTE, digit);
      item.setAttribute('aria-keyshortcuts', `Shift+${digit}`);
    });
    numbered = live;
  };

  const hide = () => {
    clearTimeout(timer);
    timer = undefined;
    container.removeAttribute(VISIBLE_ATTRIBUTE);
  };

  const onKeyDown = (event: KeyboardEvent) => {
    const otherModifier = event.ctrlKey || event.altKey || event.metaKey;

    if (event.key === 'Shift') {
      // A held key repeats; the timer or the badges are already there.
      if (event.repeat) return;
      hide();
      if (otherModifier || isEditable(doc.activeElement)) return;
      timer = setTimeout(() => {
        number();
        if (numbered.length > 0) container.setAttribute(VISIBLE_ATTRIBUTE, 'visible');
      }, delay);
      return;
    }

    // Any other key ends the showing: Shift was not held alone.
    hide();
    const digit = DIGIT.exec(event.code);
    if (!digit || !event.shiftKey || otherModifier) return;
    if (event.repeat || event.defaultPrevented || event.isComposing) return;
    if (isEditable(event.target) || isEditable(doc.activeElement)) return;

    number();
    const item = numbered[Number(digit[1]) - 1];
    if (!item) return;
    event.preventDefault();
    item.click();
  };

  const onKeyUp = (event: KeyboardEvent) => {
    // With both Shift keys down, releasing one leaves Shift held.
    if (event.key === 'Shift' && !event.shiftKey) hide();
  };

  const onFocusIn = (event: FocusEvent) => {
    if (isEditable(event.target)) hide();
  };

  // ponytail: an `inert` set on an ancestor of the container is outside what
  // is observed, so `aria-keyshortcuts` can be stale until the next press of
  // Shift, which numbers again. Observe the document if that ever matters.
  const observer = new MutationObserver(number);
  observer.observe(container, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['hidden', 'inert', 'class', 'href'],
  });

  number();
  doc.addEventListener('keydown', onKeyDown);
  doc.addEventListener('keyup', onKeyUp);
  doc.addEventListener('focusin', onFocusIn);
  doc.addEventListener('pointerdown', hide);
  view?.addEventListener('blur', hide);

  return () => {
    observer.disconnect();
    doc.removeEventListener('keydown', onKeyDown);
    doc.removeEventListener('keyup', onKeyUp);
    doc.removeEventListener('focusin', onFocusIn);
    doc.removeEventListener('pointerdown', hide);
    view?.removeEventListener('blur', hide);
    hide();
    for (const item of numbered) {
      item.removeAttribute(ITEM_ATTRIBUTE);
      item.removeAttribute('aria-keyshortcuts');
    }
    numbered = [];
  };
}

/**
 * `attachNavShortcuts` for the element in `ref`, for as long as `enabled` is
 * not false. Turned off, the items carry no number and no `aria-keyshortcuts`.
 */
export function useNavShortcuts(
  ref: ElementRef<HTMLElement>,
  { enabled = true, items, delay }: NavShortcutsOptions & { enabled?: boolean } = {},
): void {
  useEffect(() => {
    const container = ref.current;
    if (!enabled || !container) return;
    return attachNavShortcuts(container, { items, delay });
  }, [ref, enabled, items, delay]);
}
