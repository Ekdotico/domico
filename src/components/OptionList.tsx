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
 *   // The cursor moved, by a key of the text's or by a press: the query is
 *   // read again, so the list closes where the cursor has left it, and the
 *   // move in the list is over. A move never opens the list.
 *   useEffect(() => {
 *     const onCursorMove = () => {
 *       const next = queryAtCursor();
 *       setQuery((shown) => (shown === null ? null : next));
 *       setNavigating(false);
 *     };
 *     document.addEventListener('selectionchange', onCursorMove);
 *     return () => document.removeEventListener('selectionchange', onCursorMove);
 *   }, []);
 *
 *   <div contentEditable role="textbox" aria-multiline="true" aria-label="Document"
 *     {...optionListAttributes(SLASH, { open, options: shown, activeId, navigating })}
 *     onInput={() => {
 *       setQuery(queryAtCursor());
 *       setNavigating(false);
 *       setActiveId(null);
 *     }}
 *     onKeyDown={(event) => {
 *       const result = open ? optionListKey(event, { options: shown, activeId }) : null;
 *       setNavigating(optionListNavigating(event, result, navigating));
 *       if (!result) return;
 *       event.preventDefault();
 *       if ('activeId' in result) setActiveId(result.activeId);
 *       else if ('select' in result) insert(result.select);
 *       else dismiss();
 *     }}
 *     onBlur={dismiss} />
 *   <OptionList id={SLASH} label="Blocks" open={open} options={shown}
 *     activeId={activeId} onActiveChange={setActiveId} onSelect={insert}
 *     onDismiss={dismiss} anchor={cursorRectangle}
 *     empty="No block matches."
 *     status={shown[0] ? `${shown.length} blocks. ${shown[0].label} first.` : ''} />
 *
 * `open` is derived: there is a query at the caret and the writer has not
 * dismissed it. The query is read again when the text changes and when the
 * caret moves, and not from `input` alone. Home, End, Left and Right are the
 * text's keys and fire no `input`, so a list that followed `input` alone
 * stayed open after the caret had left the query, was placed again at the
 * caret, went on taking Up, Down and Enter, and Enter replaced text the caret
 * was not in. The README has the whole of it, with `dismiss` and `insert`.
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
 * **A press outside** is a mouse button going down, or a finger or a pen
 * lifting from where it went down. A touch that becomes a pan or a pinch is
 * a reader moving the page to see the list, and the browser ends that touch
 * with `pointercancel` and no `pointerup`, so it dismisses nothing. Held by
 * synthetic events; not yet run on a device.
 *
 * **It handles no key**, because it is never focused. Escape is the
 * application's key like the rest, and `optionListKey` answers it.
 *
 * **A press does not move focus.** The default of `pointerdown` and of
 * `mousedown` is prevented over the whole list, so the text keeps its focus,
 * its selection and, on a phone, its keyboard. The option is chosen on the
 * click that follows, so a finger that scrolls the list chooses nothing.
 * The list's own text cannot be selected (`user-select: none` in the
 * stylesheet): a right-click, a Control-click or a long press selects the
 * word under it where text can be selected, and the page has one selection,
 * so that took the cursor out of the text while focus stayed. The context
 * menu itself is left to the browser.
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
 * Enter chooses the first match from the moment the list opens, and a writer
 * who cannot see the list has not been told which option that is. So `status`
 * names it with the count, "3 blocks. Heading 1 first.", unless
 * `announceActive` is on and says it.
 *
 * **The active option, said by the region: off unless asked for.** With
 * `announceActive` the same region is also given that function's words for
 * the active option. One text at a time. On opening: the count and the
 * active option as one text, the count first. On a move in the list: the
 * active option, 150 milliseconds after the move, so a held key says where
 * it stopped. On a change of filter, once it has settled: the count where it
 * changed and the active option where that changed, as one text where both
 * did. A move made while a count is waiting does not drop the count: the two
 * are one text, the count first. The two are one write and not two because a
 * polite region that is given a second text before the first was spoken is
 * not certain to speak the first. Whether a given screen reader speaks the
 * whole of the one text has not been tested. A screen reader that follows
 * `aria-activedescendant` says the option by itself, and with this on says it
 * twice, so a product turns it on for what its own testing with screen
 * readers finds, and the README has the script for that.
 *
 * `anchor` is where the cursor is: a rectangle in viewport coordinates, or a
 * function that returns one. Pass the function. The list is placed again
 * when the page scrolls, the window changes size, or the visual viewport
 * does, as when an on-screen keyboard comes up; only a function can say
 * where the cursor has gone, and a rectangle is placed where it was. A
 * function that returns `null`, for a cursor that is no longer in the
 * document, leaves a placed list where it is. A list that has not been
 * placed yet is put at the start of the top of the viewport and not left
 * hidden: hidden, it would still take the keys and still be named by the
 * text region, with nothing to see or hear. It is not dismissed for that, because a cursor
 * with no rectangle is the application's to fix and not a choice the writer
 * made. `placeOptionList` has the rules: under the cursor, above it where
 * there is no room, held inside the viewport both ways.
 *
 * It is `position: fixed`, and where the browser has the Popover API it is
 * shown as a manual popover, in the top layer. So an ancestor that clips its
 * overflow does not clip the list, and in the top layer neither does one with
 * a transform. A manual popover takes no focus and is not dismissed by the
 * browser. The top layer does not lift it out of an inert page: a list
 * rendered outside a modal `<dialog>` cannot be pressed, so it is rendered
 * inside the dialog that holds the text.
 *
 * Closed, it renders nothing. On the server an open list renders unplaced
 * and not visible, and is placed before the first paint after hydration.
 *
 * Nothing warns of misuse. The package has no development-only branch
 * anywhere, and this control does not add the first. Two mistakes are silent
 * and are the application's to test for: an option `id` that holds white
 * space, and a list that is open while no element carries `aria-controls`
 * naming it.
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
  /**
   * A press landed outside the list: a mouse button went down, or a finger or
   * a pen lifted that had not become a pan or a pinch. Escape is the
   * application's key.
   */
  onDismiss: (reason: OptionListDismissReason) => void;
  /** The text cursor, in viewport coordinates, or a function that reads it. */
  anchor: OptionListAnchor | (() => OptionListAnchor | null);
  /** How many rows show before the list scrolls. 8 unless given. */
  maxVisible?: number;
  /** Shown, and announced, where there are no options. */
  empty: string;
  /**
   * The count of options in words, announced once it has settled, with the
   * option Enter would choose: "3 blocks. Heading 1 first.". With
   * `announceActive` the count alone, ending in a full stop: "3 blocks.".
   */
  status: string;
  /** How long the announcement waits for the text to stop changing, in milliseconds. */
  announceAfterMs?: number;
  /**
   * Off unless given. The words for the active option, which the status
   * region then says when the active option changes: "Heading 1, 2 of 12".
   * `index` counts from 0. For a screen reader that does not follow
   * `aria-activedescendant` out of an editable region; one that does follow
   * it says the option twice.
   */
  announceActive?: (option: OptionListItem, index: number, count: number) => string;
  /**
   * Whether an option's `detail` is part of its accessible name. True unless
   * given: "Heading 1 /h1". False puts `aria-hidden` on the detail, and the
   * name is the label alone.
   */
  detailInName?: boolean;
  className?: string;
}

/**
 * How long the active option's line waits before the status region is given
 * it, in milliseconds, after a move in the list. A constant and not a prop.
 * It is long enough that a held arrow key says the option it stops on, and
 * nothing has yet shown a product needing another.
 */
const ACTIVE_SETTLE_MS = 150;

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
  announceActive,
  detailInName = true,
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
    const view = box.ownerDocument.defaultView;
    const root = box.ownerDocument.documentElement;
    // What a person can see: the visual viewport where the browser has one,
    // which an on-screen keyboard shortens and a pinch moves inside the layout
    // viewport. Its offsets are in the layout viewport's coordinates, which
    // are the anchor's and those of a fixed box. Without one, the layout
    // viewport, as before.
    const visual = view?.visualViewport;
    const viewport = visual
      ? { x: visual.offsetLeft, y: visual.offsetTop, width: visual.width, height: visual.height }
      : { x: 0, y: 0, width: root.clientWidth, height: root.clientHeight };
    const rtl = view?.getComputedStyle(box).direction === 'rtl';
    const { anchor: given } = latest.current;
    let rect = typeof given === 'function' ? given() : given;
    if (!rect) {
      // No cursor to place by. A list that has a place keeps it. One that has
      // none yet would stay hidden by the stylesheet, open for the
      // application and its keys and present for nobody, while the text
      // region still names it. So it is put at the start of the top of the
      // viewport, where it can be seen and used, until the anchor returns a
      // rectangle.
      if (box.dataset.placement) return;
      rect = { x: rtl ? viewport.x + viewport.width : viewport.x, y: viewport.y, width: 0, height: 0 };
    }
    // Measured without the height the last placement held it to. Lifting that
    // lets the browser clamp the list's scroll position, so it is put back.
    const list = listRef.current;
    const scrolled = list?.scrollTop ?? 0;
    box.style.maxBlockSize = '';
    const size = box.getBoundingClientRect();
    const placed = placeOptionList({
      anchor: rect,
      size: { width: size.width, height: size.height },
      viewport,
      rtl,
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
    // A press outside. A mouse dismisses as it goes down. A finger or a pen
    // that goes down may be the start of a pan or a pinch, which is a reader
    // moving the page to see the list and not a press: it dismisses when it
    // lifts, and not at all where the browser took the gesture for itself,
    // which it says with `pointercancel`. A pointer of no stated type is
    // taken as a mouse.
    const waiting = new Set<number>();
    const onPointerDown = (event: PointerEvent) => {
      if (inside(event)) {
        // An id left by a touch whose lift was never reported is not this press.
        waiting.delete(event.pointerId);
        return;
      }
      if (event.pointerType === 'touch' || event.pointerType === 'pen') waiting.add(event.pointerId);
      else latest.current.onDismiss('press-outside');
    };
    const onPointerUp = (event: PointerEvent) => {
      if (waiting.delete(event.pointerId)) latest.current.onDismiss('press-outside');
    };
    const onPointerCancel = (event: PointerEvent) => {
      waiting.delete(event.pointerId);
    };
    // Any scroll, of the page or of a container the text is in: scroll events
    // do not bubble, so they are caught on the way down. The list's own
    // scrolling moves nothing.
    const onScroll = (event: Event) => {
      if (!inside(event)) place();
    };
    // Captured, so an editor that stops the event still lets the list close.
    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('pointerup', onPointerUp, true);
    document.addEventListener('pointercancel', onPointerCancel, true);
    window.addEventListener('scroll', onScroll, { capture: true, passive: true });
    window.addEventListener('resize', place);
    // An on-screen keyboard coming up, and a pinch or a pan of a zoomed page,
    // change the visual viewport and fire nothing on the window.
    const visual = window.visualViewport;
    visual?.addEventListener('resize', place);
    visual?.addEventListener('scroll', place);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true);
      document.removeEventListener('pointerup', onPointerUp, true);
      document.removeEventListener('pointercancel', onPointerCancel, true);
      window.removeEventListener('scroll', onScroll, { capture: true });
      window.removeEventListener('resize', place);
      visual?.removeEventListener('resize', place);
      visual?.removeEventListener('scroll', place);
    };
    // `place` and the handlers read refs, so the ones from this render do not go stale.
  }, [open]);

  // What a screen reader is given: one region, one text at a time. The count
  // follows the text once the text has stood for `announceAfterMs`. With
  // `announceActive`, the active option's line follows a move in the list
  // after `ACTIVE_SETTLE_MS`. Where the count and the option are both due,
  // the region is given the two as one text, the count first, in one write:
  // a polite region whose text is replaced before it was spoken is not
  // certain to have the first text spoken at all, so two writes close
  // together could lose the count. What was last said of each is kept, so
  // neither is said twice running, and both are forgotten on closing so that
  // the same count is news again the next time the list opens.
  const text = options.length === 0 ? empty : status;
  const at = announceActive ? options.findIndex((option) => option.id === activeId) : -1;
  const activeKey = at >= 0 ? options[at]!.id : '';
  const activeLine = announceActive && at >= 0 ? announceActive(options[at]!, at, options.length) : '';
  // Which options are shown, as one string: an id holds no white space. A
  // filter can change the options and leave their number as it was.
  const shown = announceActive ? options.map((option) => option.id).join(' ') : '';
  const [announced, setAnnounced] = useState('');
  const said = useRef({ count: '', active: '', shown: '' });
  useEffect(() => {
    if (!open) {
      setAnnounced('');
      said.current = { count: '', active: '', shown: '' };
      return;
    }
    const memo = said.current;
    const filtered = text !== memo.count || shown !== memo.shown;
    const timer = setTimeout(
      () => {
        const due: string[] = [];
        if (text !== memo.count) due.push(text);
        // By the option and not by its line: a filter that leaves the active
        // option where it was changes "1 of 3" to "1 of 2", and the count
        // says that.
        if (activeKey !== memo.active && activeLine) due.push(activeLine);
        memo.shown = shown;
        memo.count = text;
        memo.active = activeKey;
        // One write. The two are joined by a space and nothing else: the
        // words and their punctuation are the application's.
        if (due.length > 0) setAnnounced(due.join(' '));
      },
      filtered ? announceAfterMs : ACTIVE_SETTLE_MS,
    );
    return () => clearTimeout(timer);
  }, [open, text, shown, activeKey, activeLine, announceAfterMs]);

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
          // The one length that depends on a prop: `rows` rows. A row is
          // `--sp-7` at its least, and otherwise one line of its text with the
          // row's padding and its two borders, which is what grows when a
          // reader raises the text size alone (WCAG 1.4.4). `--sp-7` is 32px
          // and does not grow, so a cap counted in it alone would show five
          // rows of eight at 200%. A browser without the `lh` unit drops the
          // declaration, and the surface's own height is then the cap.
          style={{ maxBlockSize: `calc(${rows} * max(var(--sp-7), 1lh + 2 * var(--sp-1) + 2px))` }}
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
              {option.detail != null && (
                <span className="ekd-option-detail" aria-hidden={detailInName ? undefined : true}>
                  {option.detail}
                </span>
              )}
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
