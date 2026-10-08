'use client';

import {
  useEffect,
  useId,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { Button, type ButtonVariant } from './Button.js';
import { ChevronDownIcon } from './icons.js';
import { keepInViewport, useBeforePaint } from './viewport.js';

/**
 * A button that opens a list of actions.
 *
 *   <MenuButton
 *     label="Table"
 *     items={[
 *       { label: 'Add row above', onSelect: addRowAbove },
 *       { label: 'Add row below', onSelect: addRowBelow },
 *       { label: 'Delete row', onSelect: deleteRow, separatorBefore: true },
 *       { label: 'Split cell', onSelect: splitCell, disabled: !canSplit },
 *     ]}
 *   />
 *
 * The WAI-ARIA menu button pattern, and the one place in the package that
 * claims `role="menu"`. The role is a promise about the keyboard, and this
 * keeps it:
 *
 * - On the button, Enter, Space and Down open the list with focus on the first
 *   action, and Up opens it with focus on the last.
 * - In the list, Down and Up move and wrap at the ends, and Home and End go to
 *   the first and the last. Enter or Space runs the action.
 * - Escape closes the list and returns focus to the button. So does running an
 *   action, before the action runs, so a dialog the action opens returns focus
 *   to the button when it closes.
 * - Tab closes the list and moves on. A press outside closes it.
 *
 * It does not find an action by its first letter. Nine actions are few enough
 * to walk; add it if a menu grows past a screen.
 *
 * **Actions, not a choice.** Nothing in the list stays selected, and it closes
 * on every activation. A value chosen from a list is a `Select`, and a setting
 * a reader compares against the page is a disclosure, as the appearance
 * control is.
 *
 * `disabled` on an action keeps it in the list, and able to take focus, with
 * `aria-disabled`: the list is then the same list every time, and a screen
 * reader hears that the action exists and is unavailable. An action that never
 * applies in this place is left out of `items`.
 *
 * The button is `Button`, `secondary` unless `variant` says otherwise, with a
 * chevron after its label; its other attributes pass through. Where the label
 * is an icon alone, give the button its name with `aria-label`.
 *
 * Closed, the list is not laid out. Open, it is under the start edge of the
 * button, no wider than the viewport less a margin, and moved sideways to stay
 * inside. It does not open upwards where there is no room below.
 *
 * Styles ship in `@ekdotico/domico/styles/menu.css`, and the button's in
 * `styles/button.css`.
 */
export interface MenuButtonItem {
  /** The action, as a verb and what it acts on: "Delete row". */
  label: ReactNode;
  /** Runs after the list has closed and focus is back on the button. */
  onSelect: () => void;
  /** Shown, and able to take focus, but not run. */
  disabled?: boolean;
  /** Draws a hairline above this action, where a new group starts. */
  separatorBefore?: boolean;
}

export function MenuButton({
  label,
  items,
  variant = 'secondary',
  className,
  id,
  onClick,
  onKeyDown,
  ...button
}: Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'type' | 'aria-haspopup' | 'aria-expanded' | 'aria-controls' | 'aria-disabled' | 'aria-busy'
> & {
  /** The button's words: what the actions act on. */
  label: ReactNode;
  items: readonly MenuButtonItem[];
  variant?: ButtonVariant;
}) {
  const ownId = useId();
  const buttonId = id ?? ownId;
  const listId = `${buttonId}-menu`;
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  // Which action takes focus when the list opens.
  const enterAt = useRef<'first' | 'last'>('first');
  const [open, setOpen] = useState(false);

  const trigger = () => wrapperRef.current?.querySelector<HTMLButtonElement>(':scope > button');
  const actions = () => [...(listRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]') ?? [])];

  const show = (at: 'first' | 'last') => {
    enterAt.current = at;
    setOpen(true);
  };
  const close = (returnFocus: boolean) => {
    setOpen(false);
    if (returnFocus) trigger()?.focus();
  };

  // Before paint: the list is placed, then focus moves into it, so it is
  // never seen in the wrong place or with focus still on the button.
  useBeforePaint(() => {
    if (!open || !listRef.current) return;
    keepInViewport(listRef.current);
    const list = actions();
    (enterAt.current === 'last' ? list[list.length - 1] : list[0])?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: Event) => {
      if (event.target instanceof Node && wrapperRef.current?.contains(event.target)) return;
      setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  const onListKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const list = actions();
    const at = list.indexOf(event.target as HTMLButtonElement);
    let next: HTMLButtonElement | undefined;
    switch (event.key) {
      case 'ArrowDown':
        next = list[(at + 1) % list.length];
        break;
      case 'ArrowUp':
        next = list[(at - 1 + list.length) % list.length];
        break;
      case 'Home':
        next = list[0];
        break;
      case 'End':
        next = list[list.length - 1];
        break;
      case 'Escape':
        // The list's, and not an enclosing dialog's: one press closes one thing.
        event.preventDefault();
        event.stopPropagation();
        close(true);
        return;
      case 'Tab':
        // Not prevented. Focus moves on from here, and the list goes.
        setOpen(false);
        return;
      default:
        return;
    }
    event.preventDefault();
    // Kept from a toolbar the menu sits in, which has its own use for Home and End.
    event.stopPropagation();
    next?.focus();
  };

  return (
    <span
      ref={wrapperRef}
      className={['ekd-menu', className].filter(Boolean).join(' ')}
      data-open={open || undefined}
      onBlur={(event) => {
        // Focus that went to something outside the button and the list. Where
        // it went nowhere there is no related target, and that is not taken
        // for leaving: an engine that does not focus a button on a press
        // reports exactly that between the press and the click on an action,
        // and closing then would take the action away from under the pointer.
        const to = event.relatedTarget;
        if (to instanceof Node && !wrapperRef.current?.contains(to)) setOpen(false);
      }}
    >
      <Button
        {...button}
        id={buttonId}
        variant={variant}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={listId}
        onClick={(event) => {
          onClick?.(event);
          if (event.defaultPrevented) return;
          if (open) close(false);
          else show('first');
        }}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (event.defaultPrevented) return;
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            show(event.key === 'ArrowUp' ? 'last' : 'first');
          }
        }}
      >
        {label}
        <ChevronDownIcon />
      </Button>
      <div ref={listRef} id={listId} role="menu" aria-labelledby={buttonId} className="ekd-menu-list" onKeyDown={onListKeyDown}>
        {items.map((item, index) => [
          item.separatorBefore && index > 0 ? (
            <div key={`separator-${index}`} role="separator" className="ekd-menu-separator" />
          ) : null,
          <button
            key={index}
            type="button"
            role="menuitem"
            tabIndex={-1}
            className="ekd-menu-item"
            aria-disabled={item.disabled || undefined}
            onClick={() => {
              if (item.disabled) return;
              close(true);
              item.onSelect();
            }}
          >
            {item.label}
          </button>,
        ])}
      </div>
    </span>
  );
}
