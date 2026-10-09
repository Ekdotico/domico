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
   * holds no white space, and it is unique in the list. Nothing checks this:
   * an id with a space in it still draws, it is not a valid element id, and
   * what `aria-activedescendant` then names is left to the browser.
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
 *   const result = open ? optionListKey(event, { options, activeId }) : null;
 *   setNavigating(optionListNavigating(event, result, navigating));  // every key, open or closed
 *   if (!result) return;            // the text's own key: a letter, Left, Home, Tab
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
 * - Page Down and Page Up move by `maxVisible`, 8 unless given, and stop at
 *   the ends. With no active option Page Down goes to the first and Page Up
 *   to the last, as Down and Up do. The Authoring Practices give a listbox
 *   popup no Page keys; their one rule for entering it from the text is that
 *   Down goes to the first option and Up to the last, and this follows it.
 * - Enter chooses the active option. With none active it is the text's.
 * - Escape dismisses.
 * - Every other key is `null`: letters, Backspace, Left and Right, Home and
 *   End, and Tab reach the text, which is what filters the list. Home and End
 *   are the text's because a document has lines, and a writer who loses the
 *   start and the end of the line while a list is open has lost more than the
 *   list gives. The Authoring Practices mark both "(Optional)" for a listbox
 *   popup, and allow that Home "returns focus to the combobox and places the
 *   cursor on the first character".
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
    case 'PageDown':
      return to(at < 0 ? 0 : at + page);
    case 'PageUp':
      return to(at < 0 ? count - 1 : at - page);
    case 'Enter':
      return at < 0 ? null : { select: options[at]!.id };
    default:
      return null;
  }
}

/**
 * The keys that are a modifier going down and nothing more, by their `key`
 * value in UI Events. `OS` is what Firefox called Meta before version 118.
 */
const MODIFIER_KEYS: ReadonlySet<string> = new Set([
  'Alt', 'AltGraph', 'CapsLock', 'Control', 'Fn', 'FnLock', 'Hyper', 'Meta',
  'NumLock', 'OS', 'ScrollLock', 'Shift', 'Super', 'Symbol', 'SymbolLock',
]);

/**
 * Whether the writer is moving in the list after the key `event`, whose
 * meaning for the list was `result`: true for a key that moved the active
 * option, `previous` for a modifier pressed by itself, false for every other.
 *
 *   const result = open ? optionListKey(event, { options, activeId }) : null;
 *   setNavigating(optionListNavigating(event, result, navigating));
 *
 * It is what `optionListAttributes` takes as `navigating`. Call it for every
 * `keydown` in the text, with `null` while the list is closed, and not only
 * for the list's keys: a letter, Backspace, Left or Right is what ends the
 * moving, and the key that opens the list is what stops a value left over
 * from the last time it was open.
 *
 * **A modifier by itself changes nothing**, so the function takes the value
 * it last returned and gives it back. Control is the key that silences a
 * screen reader, and CapsLock is one that begins its commands. A writer who
 * moves to an option, stops the speech and asks where they are is still on
 * that option, and the text region still names it. `previous` is an argument,
 * and the result is not `null` for "no change", so that the one line above
 * is the whole of the call and no application has a branch to forget.
 *
 * A keydown is not the only thing that ends the moving. Text that arrives
 * with no key, from a paste, from dictation or from an input method, and a
 * caret moved by a press, end it too, and the application sets `navigating`
 * to false on `input` and when the selection changes, as the README's
 * example does.
 */
export const optionListNavigating = (
  event: Pick<OptionListKeyEvent, 'key'>,
  result: OptionListKeyResult,
  previous: boolean,
): boolean => (MODIFIER_KEYS.has(event.key) ? previous : result !== null && 'activeId' in result);

// --- the text region's attributes --------------------------------------------

/** The two attributes, each present or `undefined`. Spread them onto the text region. */
export interface OptionListTextAttributes {
  'aria-controls': string | undefined;
  'aria-activedescendant': string | undefined;
}

/**
 * The attributes the focused text region carries for the list `id`.
 *
 *   <div contentEditable role="textbox" aria-multiline="true" aria-label="Document"
 *     {...optionListAttributes('slash', { open, options, activeId, navigating })} />
 *
 * While the list is showing at least one option: `aria-controls` naming the
 * list and, while the writer is moving in it, `aria-activedescendant` naming
 * the active option. Closed, or open with nothing in it, both are
 * `undefined`, which removes them: there is then no listbox in the document
 * for them to point at. Both keys are always in the result, so a spread takes
 * off what the last one put on. An application that writes attributes itself
 * removes the two the same way.
 *
 * **`navigating`** is whether the writer is moving in the list: the last key
 * was one that moved in it, and no text has arrived and the caret has not
 * moved since. `optionListNavigating` says the first of a key. Without it
 * `aria-activedescendant` is not set, whatever is active. An application
 * marks the first match as active from the moment the list opens, and a
 * screen reader that follows `aria-activedescendant` would then say that
 * option over each character of the query, and say it in place of the
 * character when the writer reads the query back with Left and Right. So the
 * attribute waits for Down, Up or a Page key, and goes again at the next
 * letter. The mark on the active row does not wait: it is drawn from
 * `activeId` on `OptionList`.
 *
 * These two are the whole of what the function sets for a list the textbox
 * does not hold, and each rests on a sentence of WAI-ARIA 1.2.
 *
 * - `aria-activedescendant` (section "aria-activedescendant property"): it is
 *   allowed where "The element with DOM focus is a combobox, textbox or
 *   searchbox with aria-controls referring to an element that supports
 *   aria-activedescendant, and the value of aria-activedescendant refers to
 *   an owned element of the controlled element." A `listbox` supports
 *   `aria-activedescendant`, and the options are its children. So
 *   `aria-controls` is what makes the second attribute valid, and the two
 *   are set and removed together.
 * - `aria-controls` (section "aria-controls property") is a global property:
 *   "Identifies the element (or elements) whose contents or presence are
 *   controlled by the current element."
 *
 * Three more are left out, and the same text says why. Two of the three,
 * `aria-autocomplete` and `aria-haspopup`, are supported on a `textbox` in
 * WAI-ARIA 1.2. They are left out because a value that is set while the list
 * shows and removed after is a value changed to say that a suggestion is
 * there, which the specification asks authors not to do. Only
 * `aria-expanded` is left out for not being supported on the role.
 *
 * - `aria-autocomplete` (section "aria-autocomplete property"): "The
 *   aria-autocomplete property is not intended to indicate the presence of a
 *   completion suggestion, and authors SHOULD NOT dynamically change its
 *   value in order to communicate the presence of a suggestion." Setting it
 *   while the list shows and removing it after is that. A text region that
 *   offers completions the whole time it is edited may carry
 *   `aria-autocomplete="list"` as a fixed attribute of its own; a document
 *   that opens a list of blocks on one character is not that.
 * - `aria-expanded`: the same section goes on, "authors SHOULD use the
 *   aria-expanded state to communicate whether the element that presents the
 *   suggestion collection is displayed", and the section "aria-expanded
 *   state" lists the roles it is used in, where `textbox` is not one. So a
 *   textbox has no attribute that says a list is open. That is said by the
 *   announcement in `OptionList`.
 * - `aria-haspopup`: the section "aria-autocomplete property" asks for it of
 *   an element with `aria-autocomplete` set to `list`, "a value for
 *   aria-haspopup that matches the role of the element that contains the
 *   collection of suggested values". With no `aria-autocomplete` it is not
 *   owed. Set only while the list shows, it would be the same changing value
 *   under another name, and a document is not a control that opens a popup.
 *
 * The region's own role stays `textbox`, with `aria-multiline`. It is not a
 * `combobox`: that role's value is one line of text, and a document is not.
 */
export function optionListAttributes(
  id: string,
  state: { open: boolean; options: readonly OptionListItem[]; activeId: string | null; navigating: boolean },
): OptionListTextAttributes {
  const showing = state.open && state.options.length > 0;
  const active = showing && state.navigating && state.options.some((option) => option.id === state.activeId);
  return {
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
 * `viewport` is a rectangle and not only a size. `OptionList` gives it
 * `window.visualViewport` where the browser has one: `offsetLeft`,
 * `offsetTop`, `width` and `height`. With an on-screen keyboard up, or the
 * page pinch-zoomed, that is smaller than the layout viewport and may start
 * part of the way into it, and a list placed by the layout viewport's height
 * would sit behind the keyboard. The result is in the anchor's coordinates,
 * which are the layout viewport's, and so is what `position: fixed` takes.
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
  /**
   * The part of the page a person can see, in the coordinates the anchor is
   * in. `x` and `y` are 0 unless given: they are where the visual viewport
   * starts inside the layout viewport, which is not 0 once the page is
   * pinch-zoomed or an on-screen keyboard has pushed it up.
   */
  viewport: { x?: number; y?: number; width: number; height: number };
  /** The list's line runs right to left, so it ends at the anchor and does not start there. */
  rtl?: boolean;
  gutter?: number;
  gap?: number;
  /** The least height worth showing beside the anchor, two rows unless given. */
  minHeight?: number;
}): OptionListPlacement {
  const clamp = (value: number, low: number, high: number) => Math.max(low, Math.min(high, value));
  const left = viewport.x ?? 0;
  const top = viewport.y ?? 0;

  const floor = top + gutter;
  const ceiling = Math.max(floor, top + viewport.height - gutter);
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
  const x = clamp(start, left + gutter, Math.max(left + gutter, left + viewport.width - gutter - size.width));

  return { x, y, placement, maxHeight: height < size.height ? height : null };
}
