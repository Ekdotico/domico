/**
 * The parts of `OptionList` that are arithmetic and not a component: the id of
 * an option, the keys, the attributes the text region carries, and where the
 * list goes. Pure functions, with no hook and no client boundary, so the
 * application calls them from its own key handler and they are tested without
 * a document.
 *
 * `OptionList.tsx` says what the control is. This file says what the
 * application owes it, because the control never has focus and so can take no
 * key and set no attribute on the element that does.
 */

import { EDGE_MARGIN_PX } from './viewport.js';

export interface OptionListItem {
  /**
   * The application's name for the option. It is part of an element id, so it
   * holds no white space, and it is unique in the list.
   */
  id: string;
  /** What the option is, in words: "Heading 1". */
  label: string;
  /** A second, quieter text beside the label: the command that inserts it, "/h1". */
  detail?: string;
}

/** A rectangle in viewport coordinates, in CSS pixels. A `DOMRect` is one. */
export interface OptionListAnchor {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * The element id of one option: what `aria-activedescendant` names. Derived
 * from the list's id and the option's, so it is the same on every render and
 * on the server.
 */
export const optionListOptionId = (listId: string, optionId: string): string => `${listId}-option-${optionId}`;

// --- the keys ----------------------------------------------------------------

/** What a key means for the list. `null` is "not the list's key". */
export type OptionListKeyResult = { activeId: string } | { select: string } | { dismiss: true } | null;

/**
 * A `keydown`, as the DOM or React gives it. React's event keeps `isComposing`
 * on `nativeEvent`, so both places are read.
 */
export interface OptionListKeyEvent {
  key: string;
  keyCode?: number;
  isComposing?: boolean;
  altKey?: boolean;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  nativeEvent?: { isComposing?: boolean };
}

/**
 * What a key pressed in the text means while the list is open.
 *
 *   const result = optionListKey(event, { options, activeId });
 *   if (!result) return;            // the text's own key: a letter, Left, Tab
 *   event.preventDefault();         // the list's key: the caret stays put
 *   if ('activeId' in result) setActiveId(result.activeId);
 *   else if ('select' in result) run(result.select);
 *   else close();
 *
 * Call it only while the list is open. It does not prevent the default and
 * does not stop the event; the application does, when the result is not null.
 *
 * - Down and Up move by one and stop at the ends. They do not wrap: the
 *   WAI-ARIA Authoring Practices say of a listbox popup that on the last
 *   option Down "either returns focus to the combobox or does nothing", and
 *   focus is already in the text. At an end the key is still the list's, and
 *   the result names the option that was already active.
 * - With no active option, Down goes to the first and Up to the last.
 * - Home and End go to the first and the last option.
 * - Page Down and Page Up move by `maxVisible`, 8 unless given, and stop at
 *   the ends.
 * - Enter chooses the active option. With none active it is the text's.
 * - Escape dismisses.
 * - Every other key is `null`: letters, Backspace, Left and Right, and Tab
 *   reach the text, which is what filters the list.
 *
 * `null` too while an input method is composing, when Enter and the arrows
 * belong to its candidate window, and with Alt, Control, Meta or Shift held,
 * which leaves Shift+Down to the selection and the platform's chords alone.
 * With no options every key but Escape is the text's.
 */
export function optionListKey(
  event: OptionListKeyEvent,
  state: { options: readonly OptionListItem[]; activeId: string | null; maxVisible?: number },
): OptionListKeyResult {
  // 229 is what a keydown reports during composition in engines that fire it
  // before `compositionstart` has set the flag.
  if (event.isComposing || event.nativeEvent?.isComposing || event.keyCode === 229) return null;
  if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return null;
  if (event.key === 'Escape') return { dismiss: true };

  const { options, activeId } = state;
  const count = options.length;
  if (count === 0) return null;
  const page = Math.max(1, Math.floor(state.maxVisible ?? 8));
  const at = options.findIndex((option) => option.id === activeId);
  const to = (index: number): OptionListKeyResult => {
    const option = options[Math.min(count - 1, Math.max(0, index))];
    return option ? { activeId: option.id } : null;
  };

  switch (event.key) {
    case 'ArrowDown':
      return to(at + 1);
    case 'ArrowUp':
      return to(at < 0 ? count - 1 : at - 1);
    case 'Home':
      return to(0);
    case 'End':
      return to(count - 1);
    case 'PageDown':
      return to(at < 0 ? page - 1 : at + page);
    case 'PageUp':
      return to(at < 0 ? count - page : at - page);
    case 'Enter':
      return at < 0 ? null : { select: options[at]!.id };
    default:
      return null;
  }
}

// --- the text region's attributes --------------------------------------------

/** The four attributes, each present or `undefined`. Spread them onto the text region. */
export interface OptionListTextAttributes {
  'aria-autocomplete': 'list' | undefined;
  'aria-haspopup': 'listbox' | undefined;
  'aria-controls': string | undefined;
  'aria-activedescendant': string | undefined;
}

/**
 * The attributes the focused text region carries for the list `id`.
 *
 *   <div contentEditable role="textbox" aria-multiline="true" aria-label="Document"
 *     {...optionListAttributes('slash', { open, options, activeId })} />
 *
 * While the list is showing at least one option: `aria-autocomplete="list"`,
 * `aria-haspopup="listbox"`, `aria-controls` naming the list, and
 * `aria-activedescendant` naming the active option where there is one.
 * Closed, or open with nothing in it, all four are `undefined`, which removes
 * them: there is then no listbox in the document for them to point at. Every
 * key is always in the result, so a spread takes off what the last one put on.
 * An application that writes attributes itself removes the four the same way.
 *
 * The region's own role stays `textbox`, with `aria-multiline`. It is not a
 * `combobox`: that role's value is one line of text, and a document is not.
 * `aria-expanded` is not set, because WAI-ARIA 1.2 does not support it on
 * `textbox`. That the list has opened is said by the announcement.
 *
 * WAI-ARIA 1.2 allows each of the four on `textbox`, and asks for them
 * together: with `aria-autocomplete="list"`, `aria-controls` refers to the
 * element holding the suggestions and `aria-haspopup` matches its role; and
 * `aria-activedescendant` on a textbox refers to a descendant of the element
 * it controls.
 */
export function optionListAttributes(
  id: string,
  state: { open: boolean; options: readonly OptionListItem[]; activeId: string | null },
): OptionListTextAttributes {
  const showing = state.open && state.options.length > 0;
  const active = showing && state.options.some((option) => option.id === state.activeId);
  return {
    'aria-autocomplete': showing ? 'list' : undefined,
    'aria-haspopup': showing ? 'listbox' : undefined,
    'aria-controls': showing ? id : undefined,
    'aria-activedescendant': active ? optionListOptionId(id, state.activeId!) : undefined,
  };
}

// --- placement ----------------------------------------------------------------

export interface OptionListPlacement {
  /** The left edge of the list, in viewport coordinates. */
  x: number;
  /** The top edge of the list, in viewport coordinates. */
  y: number;
  /** Which side of the anchor the list is on. */
  placement: 'below' | 'above';
  /** The height the list is held to where neither side has room for all of it, or `null`. */
  maxHeight: number | null;
}

/**
 * Where a list of `size` goes for an `anchor`, inside a `viewport`.
 *
 * Under the anchor where the whole list fits there, and otherwise above it
 * where it fits there. Where it fits on neither side it takes the side with
 * more room and `maxHeight` holds it to that room, so the line being typed in
 * is not covered and the list scrolls. Where that room is under `minHeight`
 * the list takes the height of the viewport and covers the anchor, since
 * two rows is the least that reads as a list. Sideways it starts at the anchor's
 * start edge and is moved in by as much as keeps it `gutter` from each edge.
 *
 * An anchor outside the viewport is treated as sitting on the nearest edge,
 * so the list stays on screen when the line it belongs to has scrolled away.
 *
 * `gutter` is the least distance to the viewport's edge, 16 unless given,
 * and `gap` the distance to the anchor, 4 unless given: `--sp-4` and
 * `--sp-1`. The stylesheet holds the list's width to the viewport less two
 * gutters, so a `size` wider than that is not expected; given one, the start
 * edge wins.
 */
export function placeOptionList({
  anchor,
  size,
  viewport,
  rtl = false,
  gutter = EDGE_MARGIN_PX,
  gap = 4,
  minHeight = 64,
}: {
  anchor: OptionListAnchor;
  size: { width: number; height: number };
  viewport: { width: number; height: number };
  /** The list's line runs right to left, so it ends at the anchor and does not start there. */
  rtl?: boolean;
  gutter?: number;
  gap?: number;
  /** The least height worth showing beside the anchor, two rows unless given. */
  minHeight?: number;
}): OptionListPlacement {
  const clamp = (value: number, low: number, high: number) => Math.max(low, Math.min(high, value));

  const floor = gutter;
  const ceiling = Math.max(floor, viewport.height - gutter);
  const anchorTop = clamp(anchor.y, floor, ceiling);
  const anchorBottom = clamp(anchor.y + anchor.height, floor, ceiling);
  const roomBelow = Math.max(0, ceiling - (anchorBottom + gap));
  const roomAbove = Math.max(0, anchorTop - gap - floor);

  const placement: 'below' | 'above' =
    size.height <= roomBelow ? 'below' : size.height <= roomAbove ? 'above' : roomBelow >= roomAbove ? 'below' : 'above';
  const room = placement === 'below' ? roomBelow : roomAbove;
  // Less room than `minHeight` on the better side: a viewport a few lines
  // tall. A list too short to read is no list, so it takes what the viewport
  // has and covers the anchor.
  const cramped = room < Math.min(size.height, minHeight);
  const height = Math.min(size.height, cramped ? ceiling - floor : room);
  const beside = placement === 'below' ? anchorBottom + gap : anchorTop - gap - height;
  const y = clamp(beside, floor, Math.max(floor, ceiling - height));

  const start = rtl ? anchor.x + anchor.width - size.width : anchor.x;
  const x = clamp(start, gutter, Math.max(gutter, viewport.width - gutter - size.width));

  return { x, y, placement, maxHeight: height < size.height ? height : null };
}
