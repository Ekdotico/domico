'use client';

/**
 * Keyboard behaviour for a radio group.
 *
 * `role="radiogroup"` is a promise about the keyboard, and both switchers were
 * making it without keeping it: every option was its own tab stop, and the
 * arrow keys did nothing. A reader navigating by keyboard met seven tab stops
 * across the two controls where the pattern calls for two, and the arrows they
 * would reasonably try were inert.
 *
 * The ARIA radio group pattern is a single tab stop with roving focus: Tab
 * enters the group at the selected option, the arrows move between options and
 * select as they go, and Tab leaves. Home and End jump to the ends. Selecting
 * on arrow is correct here because every option is applied instantly and is
 * reversible — there is nothing to confirm and nothing to lose.
 *
 * Both directions of arrow are accepted regardless of the control's axis. A
 * reader cannot see which axis the author had in mind, and offering only one
 * makes the other feel broken.
 */

import { useCallback, useRef, type KeyboardEvent, type RefObject } from 'react';

export interface RadioGroupOptions<T> {
  /** The full option list, in rendered order. */
  values: readonly T[];
  /** The currently selected value. */
  selected: T;
  /** Apply a value. Called on click and on arrow. */
  onSelect: (value: T) => void;
}

export interface RadioGroupBindings<T> {
  /** Spread on the element carrying `role="radiogroup"`. */
  containerProps: {
    ref: RefObject<HTMLDivElement>;
    onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void;
  };
  /** Spread on each element carrying `role="radio"`. */
  radioProps: (value: T) => {
    role: 'radio';
    'aria-checked': boolean;
    tabIndex: 0 | -1;
    onClick: () => void;
  };
}

export function useRadioGroup<T>({
  values,
  selected,
  onSelect,
}: RadioGroupOptions<T>): RadioGroupBindings<T> {
  const container = useRef<HTMLDivElement>(null);

  const move = useCallback(
    (nextIndex: number) => {
      const next = values[nextIndex];
      if (next === undefined) return;
      onSelect(next);

      // Focus follows selection, or the group would keep focus on the option
      // the reader just moved away from and the next arrow would jump from the
      // wrong place.
      const radios = container.current?.querySelectorAll<HTMLElement>('[role="radio"]');
      radios?.[nextIndex]?.focus();
    },
    [values, onSelect],
  );

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      const current = values.indexOf(selected);
      if (current === -1) return;
      const last = values.length - 1;

      switch (event.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          event.preventDefault();
          move(current === last ? 0 : current + 1);
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          event.preventDefault();
          move(current === 0 ? last : current - 1);
          break;
        case 'Home':
          event.preventDefault();
          move(0);
          break;
        case 'End':
          event.preventDefault();
          move(last);
          break;
        default:
      }
    },
    [values, selected, move],
  );

  return {
    containerProps: { ref: container, onKeyDown },
    radioProps: (value: T) => ({
      role: 'radio',
      'aria-checked': value === selected,
      // The roving tab stop. Exactly one option is reachable by Tab, which is
      // what makes the group one stop rather than one per option.
      tabIndex: value === selected ? 0 : -1,
      onClick: () => onSelect(value),
    }),
  };
}
