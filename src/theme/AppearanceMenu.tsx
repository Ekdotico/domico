'use client';

/**
 * The two appearance controls behind one button.
 *
 * A disclosure and a non-modal popover, not a menu and not a dialog, and the
 * reader's task is what decides that. Choosing a theme means comparing each
 * candidate against the page: the surface has to stay open while the page
 * behind it changes colour, and it must not close on activation the way a
 * `menu` is required to. A dialog would be worse still — `aria-modal` and a
 * focus trap would seal off the very page the reader is judging.
 *
 * So: `aria-expanded` on the trigger, `aria-controls` pointing at the panel,
 * Escape to close with focus returned, click outside to close, and Tab to
 * leave. No focus trap, no `aria-modal`, no `role="menu"`. The shape is the one
 * already proven by `MobileNav` in the documentation site; the difference is
 * that this one is deliberately non-modal.
 *
 * `ThemeSwitcher` and `ModeSwitcher` are composed rather than reimplemented.
 * They already keep the radio group contract — one tab stop, roving focus,
 * arrows that move and select — and a second control that looked the same and
 * behaved differently is the drift this package exists to end.
 *
 *   import { AppearanceMenu } from '@ekdotico/domico/theme';
 *   import '@ekdotico/domico/styles/appearance.css';
 *
 *   <AppearanceMenu />
 *
 * Server rendering needs nothing extra here. The panel is closed on the first
 * render, on the server and on the client alike, so there is nothing to
 * mismatch; and the checked option inside it comes from `AppearanceProvider`
 * by way of `useTheme` and `useMode`, which is what makes the roving tab stop
 * land on the reader's own theme rather than on Parchment. Wrap the tree in
 * `AppearanceProvider` with `appearanceState(await cookies())` and the panel is
 * correct before any JavaScript runs.
 */

import { useCallback, useEffect, useId, useRef, useState, type FocusEvent } from 'react';
import { PaletteIcon } from '../components/icons.js';
import { ModeSwitcher } from './ModeSwitcher.js';
import { ThemeSwitcher } from './ThemeSwitcher.js';

export interface AppearanceMenuProps {
  /**
   * The label on the header row inside the panel, beside the mode pill.
   * Defaults to "Theme", which is what docs and deree already write above the
   * same pair of controls.
   */
  label?: string;
  /** Accessible name for the trigger. Defaults to "Appearance". */
  triggerLabel?: string;
  /** Placement class for the wrapper, so an application can position it. */
  className?: string;
}

export function AppearanceMenu({
  label = 'Theme',
  triggerLabel = 'Appearance',
  className,
}: AppearanceMenuProps = {}) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const labelId = useId();
  const wrapper = useRef<HTMLDivElement | null>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const panel = useRef<HTMLDivElement | null>(null);

  /** Close, and put focus back where the reader left it. */
  const closeAndReturnFocus = useCallback(() => {
    setOpen(false);
    trigger.current?.focus();
  }, []);

  // Focus the CHECKED theme, not the first one. The group is a single tab stop
  // parked on the selected option, so opening onto the first button would both
  // misreport which theme is active and make the next arrow press move from the
  // wrong place. AppearanceProvider documents the same failure at the level of
  // the server render.
  useEffect(() => {
    if (!open) return;
    const checked = panel.current?.querySelector<HTMLElement>(
      '.theme-switcher [role="radio"][aria-checked="true"]',
    );
    (checked ?? panel.current?.querySelector<HTMLElement>('.theme-switcher [role="radio"]'))?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeAndReturnFocus();
    };
    // pointerdown rather than click: a reader who presses outside the panel has
    // already decided to dismiss it, and waiting for the release lets the panel
    // sit under the pointer through a drag.
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (target instanceof Node && wrapper.current?.contains(target)) return;
      // No focus return here. Focus belongs wherever the reader just pressed.
      setOpen(false);
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [open, closeAndReturnFocus]);

  // Tab out closes. A non-modal popover that stays open after focus has left
  // it sits over whatever the reader tabs to next (WCAG 2.4.11), and a
  // keyboard reader has no pointer to dismiss it with. `relatedTarget` is null
  // when focus goes to the body — a click on the panel's own label, a window
  // blur — and neither of those is the reader leaving, so null is ignored.
  const onBlur = (event: FocusEvent<HTMLDivElement>) => {
    const next = event.relatedTarget;
    if (!(next instanceof Node) || wrapper.current?.contains(next)) return;
    setOpen(false);
  };

  return (
    <div
      className={className ? `appearance-menu ${className}` : 'appearance-menu'}
      data-open={open ? 'true' : 'false'}
      ref={wrapper}
      onBlur={onBlur}
    >
      <button
        ref={trigger}
        type="button"
        className="appearance-trigger"
        aria-label={triggerLabel}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((wasOpen) => !wasOpen)}
      >
        <PaletteIcon size={18} />
      </button>

      {/* Mounted whether or not it is open, and never unmounted on a
          transition event. reset.css sets `transition: none !important` under
          prefers-reduced-motion, so transitionend never fires for those
          readers and anything waiting on it waits for ever. The open state is
          an attribute; CSS does the rest, and `visibility` is what takes the
          closed panel out of the tab order and the accessibility tree. */}
      <div ref={panel} id={panelId} className="appearance-panel">
        {/* The visible label names the theme group it sits above. Without the
            reference the group announced "Colour theme" from its own
            aria-label while the reader saw "Theme" — two names for one
            control, and a speech-input reader saying the one on screen
            would not reach it (WCAG 2.5.3). */}
        <div className="theme-header">
          <span className="theme-header-label" id={labelId}>
            {label}
          </span>
          <ModeSwitcher />
        </div>
        <ThemeSwitcher labelledBy={labelId} />
      </div>
    </div>
  );
}
