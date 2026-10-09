'use client';

import { useEffect, useRef, useState } from 'react';
import {
  optionListOptionId,
  placeOptionList,
  type OptionListAnchor,
  type OptionListItem,
} from './optionListHelpers.js';
import { useBeforePaint } from './viewport.js';

/**
 * A list of options at the text cursor, filtered by what is typed, that never
 * takes focus.
 *
 *   const SLASH = 'slash-commands';
 *   const shown = commands.filter(matches(query));
 *
 *   <div contentEditable role="textbox" aria-multiline="true" aria-label="Document"
 *     {...optionListAttributes(SLASH, { open, options: shown, activeId })}
 *     onKeyDown={(event) => {
 *       if (!open) return;
 *       const result = optionListKey(event, { options: shown, activeId });
 *       if (!result) return;
 *       event.preventDefault();
 *       if ('activeId' in result) setActiveId(result.activeId);
 *       else if ('select' in result) insert(result.select);
 *       else setOpen(false);
 *     }} />
 *   <OptionList id={SLASH} label="Blocks" open={open} options={shown}
 *     activeId={activeId} onActiveChange={setActiveId} onSelect={insert}
 *     onDismiss={() => setOpen(false)} anchor={cursorRectangle}
 *     empty="No block matches." status={`${shown.length} blocks`} />
 *
 * The list an editor opens on "/", and the same control for a mention or a
 * citation key. It is `role="listbox"` with `role="option"` children, and it
 * is the half of that pattern a package can own. Focus stays in the text, so
 * the keys and the attributes of the focused element are the application's,
 * and two helpers give every application the same ones: `optionListKey` reads
 * a key, and `optionListAttributes` returns what the text region carries.
 *
 * **Fully controlled.** The application holds `open`, `options` and
 * `activeId`, and filters. The control draws what it is given and reports
 * three things: `onActiveChange` when the pointer moves onto an option,
 * `onSelect` when one is pressed, and `onDismiss` for a press outside. It
 * does not open itself, filter, or remember.
 *
 * **It handles no key**, because it is never focused. Escape is the
 * application's key like the rest, and `optionListKey` answers it.
 *
 * **A press does not move focus.** The default of `pointerdown` and of
 * `mousedown` is prevented over the whole list, so the text keeps its focus,
 * its selection and, on a phone, its keyboard. The option is chosen on the
 * click that follows, so a finger that scrolls the list chooses nothing.
 *
 * The active option is the one `aria-selected="true"`; the others are
 * `"false"`. Each option's element id is `optionListOptionId(id, option.id)`,
 * the same on every render, which is what `aria-activedescendant` names. The
 * list shows `maxVisible` rows, 8 unless given, and scrolls, and the active
 * option is scrolled into view when it changes. The pointer changes the
 * active option when it moves and not when the list scrolls under it.
 *
 * With no options the listbox is not rendered, since a listbox owes at least
 * one option, and `empty` is shown in its place.
 *
 * **Announced when it settles.** A polite status region inside the control
 * says `status`, or `empty` when there are no options, `announceAfterMs`
 * after the text last changed: 500 unless given. A person typing quickly
 * hears the count they stopped on and not each one on the way, and a count
 * that did not change is not said again. Closing empties the region, so the
 * next opening is announced. Both texts are the application's.
 *
 * `anchor` is where the cursor is: a rectangle in viewport coordinates, or a
 * function that returns one. Pass the function. The list is placed again
 * when the page scrolls or the window changes size, and only a function can
 * say where the cursor has gone; a rectangle is placed where it was. A
 * function that returns `null`, for a cursor that is no longer in the
 * document, leaves the list where it is. `placeOptionList` has the rules:
 * under the cursor, above it where there is no room, held inside the
 * viewport both ways.
 *
 * It is `position: fixed`, and where the browser has the Popover API it is
 * shown as a manual popover, in the top layer. So an ancestor that clips its
 * overflow does not clip the list, and in the top layer neither does one with
 * a transform. A manual popover takes no focus and is not dismissed by the
 * browser.
 *
 * Closed, it renders nothing. On the server an open list renders unplaced
 * and not visible, and is placed before the first paint after hydration.
 *
 * Styles ship in `@ekdotico/domico/styles/option-list.css`.
 */
export type OptionListDismissReason = 'press-outside';

export interface OptionListProps {
  /** The id of the listbox: what `aria-controls` on the text region names. */
  id: string;
  /** The name of the list for a screen reader: what the options are. "Blocks". */
  label: string;
  open: boolean;
  options: readonly OptionListItem[];
  /** The `id` of the active option, or `null` for none. */
  activeId: string | null;
  /** The pointer moved onto an option that is not the active one. */
  onActiveChange: (id: string) => void;
  /** An option was pressed. */
  onSelect: (id: string) => void;
  /** A press landed outside the list. Escape is the application's key. */
  onDismiss: (reason: OptionListDismissReason) => void;
  /** The text cursor, in viewport coordinates, or a function that reads it. */
  anchor: OptionListAnchor | (() => OptionListAnchor | null);
  /** How many rows show before the list scrolls. 8 unless given. */
  maxVisible?: number;
  /** Shown, and announced, where there are no options. */
  empty: string;
  /** The count of options in words, announced once it has settled: "3 blocks". */
  status: string;
  /** How long the announcement waits for the text to stop changing, in milliseconds. */
  announceAfterMs?: number;
  className?: string;
}

export function OptionList({
  id,
  label,
  open,
  options,
  activeId,
  onActiveChange,
  onSelect,
  onDismiss,
  anchor,
  maxVisible = 8,
  empty,
  status,
  announceAfterMs = 500,
  className,
}: OptionListProps) {
  const boxRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  // Read by listeners that outlive a render, so each sees the latest.
  const latest = useRef({ anchor, onDismiss });
  latest.current = { anchor, onDismiss };

  const place = () => {
    const box = boxRef.current;
    if (!box) return;
    const { anchor: given } = latest.current;
    const rect = typeof given === 'function' ? given() : given;
    if (!rect) return;
    // Measured without the height the last placement held it to. Lifting that
    // lets the browser clamp the list's scroll position, so it is put back.
    const list = listRef.current;
    const scrolled = list?.scrollTop ?? 0;
    box.style.maxBlockSize = '';
    const size = box.getBoundingClientRect();
    const root = box.ownerDocument.documentElement;
    const placed = placeOptionList({
      anchor: rect,
      size: { width: size.width, height: size.height },
      viewport: { width: root.clientWidth, height: root.clientHeight },
      rtl: box.ownerDocument.defaultView?.getComputedStyle(box).direction === 'rtl',
    });
    // Written to the element and not through React, as `keepInViewport` does:
    // a scroll places the list again without a render. These are style
    // properties set by script, which a policy against inline style elements
    // does not stop.
    box.style.left = `${placed.x}px`;
    box.style.top = `${placed.y}px`;
    box.style.maxBlockSize = placed.maxHeight == null ? '' : `${placed.maxHeight}px`;
    box.dataset.placement = placed.placement;
    if (list) list.scrollTop = scrolled;
  };

  // Before paint, on every render while open: the options, the anchor and the
  // empty text each change the box. Into the top layer first, where there is
  // one, so the box is measured where it will be drawn.
  useBeforePaint(() => {
    const box = boxRef.current as (HTMLDivElement & { showPopover?: () => void }) | null;
    if (!open || !box) return;
    if (typeof box.showPopover === 'function' && !box.matches(':popover-open')) box.showPopover();
    place();
  });

  // The active option into view. By the list's own scroll position and not
  // `scrollIntoView`, which would scroll the page under the reader as well.
  useBeforePaint(() => {
    const list = listRef.current;
    if (!open || !list || activeId == null) return;
    const row = list.ownerDocument.getElementById(optionListOptionId(id, activeId));
    if (!row || !list.contains(row)) return;
    const frame = list.getBoundingClientRect();
    const at = row.getBoundingClientRect();
    if (at.top < frame.top) list.scrollTop -= frame.top - at.top;
    else if (at.bottom > frame.bottom) list.scrollTop += at.bottom - frame.bottom;
  }, [open, id, activeId, options]);

  useEffect(() => {
    if (!open) return;
    const inside = (event: Event) => event.target instanceof Node && boxRef.current?.contains(event.target);
    const onPointerDown = (event: Event) => {
      if (!inside(event)) latest.current.onDismiss('press-outside');
    };
    // Any scroll, of the page or of a container the text is in: scroll events
    // do not bubble, so they are caught on the way down. The list's own
    // scrolling moves nothing.
    const onScroll = (event: Event) => {
      if (!inside(event)) place();
    };
    // Captured, so an editor that stops the event still lets the list close.
    document.addEventListener('pointerdown', onPointerDown, true);
    window.addEventListener('scroll', onScroll, { capture: true, passive: true });
    window.addEventListener('resize', place);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true);
      window.removeEventListener('scroll', onScroll, { capture: true });
      window.removeEventListener('resize', place);
    };
    // `place` and the handlers read refs, so the ones from this render do not go stale.
  }, [open]);

  // What a screen reader is given. It follows the text once the text has
  // stood for the interval, and is emptied on closing so that the same count
  // is news again the next time the list opens.
  const text = options.length === 0 ? empty : status;
  const [announced, setAnnounced] = useState('');
  useEffect(() => {
    if (!open) {
      setAnnounced('');
      return;
    }
    const timer = setTimeout(() => setAnnounced(text), announceAfterMs);
    return () => clearTimeout(timer);
  }, [open, text, announceAfterMs]);

  if (!open) return null;

  const rows = Math.max(1, Math.floor(maxVisible));
  // The attribute as a string, which React 18 writes as given. Not
  // in its types until 19.
  const popover = { popover: 'manual' };

  return (
    <div
      {...popover}
      ref={boxRef}
      className={['ekd-option-list', className].filter(Boolean).join(' ')}
      // The press that would take focus out of the text, and its selection
      // with it. Both events: an engine moves focus on `mousedown` whatever
      // was done to `pointerdown`.
      onPointerDown={(event) => event.preventDefault()}
      onMouseDown={(event) => event.preventDefault()}
    >
      {options.length > 0 ? (
        <div
          ref={listRef}
          id={id}
          role="listbox"
          aria-label={label}
          className="ekd-option-list-options"
          // The one length that depends on a prop. A row is `--sp-7` high.
          style={{ maxBlockSize: `calc(${rows} * var(--sp-7))` }}
        >
          {options.map((option) => (
            <div
              key={option.id}
              id={optionListOptionId(id, option.id)}
              role="option"
              aria-selected={option.id === activeId}
              className="ekd-option"
              onPointerMove={() => {
                if (option.id !== activeId) onActiveChange(option.id);
              }}
              onClick={() => onSelect(option.id)}
            >
              <span className="ekd-option-label">{option.label}</span>
              {option.detail != null && <span className="ekd-option-detail">{option.detail}</span>}
            </div>
          ))}
        </div>
      ) : (
        <p className="ekd-option-list-empty">{empty}</p>
      )}
      <span className="ekd-option-list-announce" role="status">
        {announced}
      </span>
    </div>
  );
}
