'use client';

import {
  forwardRef,
  useEffect,
  useRef,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type KeyboardEvent,
} from 'react';

/**
 * Toolbar, ToolbarSeparator and ToggleButton: a row of controls with one Tab
 * stop, and the control that row is mostly made of.
 *
 *   <Toolbar label="Formatting" floating>
 *     <Tooltip content={`Bold, ${shortcutLabel('b').label}`}>
 *       <ToggleButton label="Bold" pressed={marks.bold} onClick={toggleBold}>
 *         <BoldIcon />
 *       </ToggleButton>
 *     </Tooltip>
 *     <Tooltip content={`Italic, ${shortcutLabel('i').label}`}>
 *       <ToggleButton label="Italic" pressed={marks.italic} onClick={toggleItalic}>
 *         <ItalicIcon />
 *       </ToggleButton>
 *     </Tooltip>
 *     <ToolbarSeparator />
 *     <MenuButton label="Table" items={tableActions} />
 *   </Toolbar>
 *
 * `role="toolbar"`, named by `label`. The WAI-ARIA toolbar pattern: the row is
 * one stop in the Tab order, and the arrow keys move between its controls, so
 * a keyboard reader passes nine buttons with one press and not nine. Left and
 * Right move and wrap at the ends, Home and End go to the first and the last,
 * and the row remembers which control had focus, so Tab returns to it. In a
 * right-to-left line the two arrows are exchanged.
 *
 * The controls are whatever is inside: `ToggleButton`, `Button`, the button of
 * a `MenuButton`, a link, a `Select`. They are found in the document and not
 * registered, so a control wrapped in a `Tooltip` is found too. Two limits
 * follow from the keys:
 *
 * - A `Select` keeps Up and Down, which change its value, and gives the row
 *   Left and Right. Home and End stay the select's.
 * - A text field needs every one of those keys for its own caret, and a row
 *   that left them alone could not be left by keyboard once focus was in the
 *   field. Put a text field beside a toolbar, not in one.
 *
 * `floating` gives the row a surface of its own: the raised ground, a hairline
 * and a shadow, for a toolbar shown over a selection. **The application
 * places it**, and owns when it is shown, because the package cannot see the
 * editor's pointer state. Over a text selection it opens once the selection is
 * complete. While a pointer button is held down to drag a selection the toolbar
 * stays hidden, and it opens when the button is released, wherever that
 * happens. A selection made by keyboard shows it at once. A toolbar that
 * appeared and moved during the drag would cover the text being selected and
 * pull the eye away. The application also owes two things the package
 * cannot supply. A way to reach the toolbar from the text by keyboard, since
 * the toolbar is not in the text's Tab order while the caret is in a document:
 * every mark also has its own shortcut, and a key that moves focus to the
 * toolbar covers the rest. And Escape, to return focus to the text. Without
 * `floating` the row has no surface and sits in a block's header.
 *
 * Before the page is interactive every control is a Tab stop; the single stop
 * is set when the component mounts.
 *
 * Styles ship in `@ekdotico/domico/styles/toolbar.css`.
 */

const CONTROL = 'button, select, a[href]';

/** The controls of a toolbar, in document order. Not the items of a menu that is open inside it. */
function controls(root: HTMLElement): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>(CONTROL)].filter(
    (el) => !el.closest('[role="menu"]') && !el.matches(':disabled'),
  );
}

export function Toolbar({
  label,
  floating = false,
  className,
  children,
  onKeyDown,
  onFocus,
  ...toolbar
}: Omit<HTMLAttributes<HTMLDivElement>, 'role' | 'aria-label'> & {
  /** What the row is for. It names the toolbar. */
  label: string;
  /** Draws the row as a raised surface, for a toolbar placed over a selection. Show it once the selection is complete, not during a drag. */
  floating?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // The control Tab returns to. An element and not an index: the controls can
  // change between renders, and the one that had focus is still the one.
  const current = useRef<HTMLElement | null>(null);

  const rove = (to?: HTMLElement) => {
    const root = ref.current;
    if (!root) return;
    const list = controls(root);
    if (to) current.current = to;
    if (!current.current || !list.includes(current.current)) current.current = list[0] ?? null;
    for (const el of list) el.tabIndex = el === current.current ? 0 : -1;
  };

  // After every render, with no dependencies: the controls are the
  // application's children, and one may have arrived, gone, or been disabled.
  useEffect(() => rove());

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);
    const root = ref.current;
    const target = event.target as HTMLElement;
    if (event.defaultPrevented || !root || event.altKey || event.ctrlKey || event.metaKey) return;
    // An open menu inside the row has the arrow keys while focus is in it.
    if (target.closest('[role="menu"]')) return;
    const select = target.tagName === 'SELECT';
    const list = controls(root);
    const at = list.indexOf(target);
    if (at < 0) return;
    const rtl = getComputedStyle(root).direction === 'rtl';
    let next: HTMLElement | undefined;
    if (event.key === (rtl ? 'ArrowLeft' : 'ArrowRight')) next = list[(at + 1) % list.length];
    else if (event.key === (rtl ? 'ArrowRight' : 'ArrowLeft')) next = list[(at - 1 + list.length) % list.length];
    else if (event.key === 'Home' && !select) next = list[0];
    else if (event.key === 'End' && !select) next = list[list.length - 1];
    if (!next) return;
    // Also keeps Left and Right from changing a select's value on the way out.
    event.preventDefault();
    rove(next);
    next.focus();
  };

  return (
    <div
      {...toolbar}
      ref={ref}
      role="toolbar"
      aria-label={label}
      className={['ekd-toolbar', className].filter(Boolean).join(' ')}
      data-floating={floating ? '' : undefined}
      onKeyDown={handleKeyDown}
      onFocus={(event) => {
        onFocus?.(event);
        // Focus that arrived by a press makes that control the row's stop.
        const root = ref.current;
        if (root && controls(root).includes(event.target as HTMLElement)) rove(event.target as HTMLElement);
      }}
    >
      {children}
    </div>
  );
}

/** A hairline between two groups of controls in a toolbar. */
export function ToolbarSeparator() {
  return <span className="ekd-toolbar-separator" role="separator" aria-orientation="vertical" />;
}

/**
 * A button that is on or off: bold, italic, a header row.
 *
 *   <ToggleButton label="Bold" pressed={marks.bold} onClick={toggleBold}>
 *     <BoldIcon />
 *   </ToggleButton>
 *
 * A native `<button type="button">` with `aria-pressed`, which is what tells a
 * screen reader it is a toggle and which way it is set. `label` is its name,
 * and it is the same name in both states: the state is `aria-pressed`'s to
 * say, and a name that changed with it would say it twice or, read alone, the
 * wrong way round. Leave `label` out where the button's own text names it.
 *
 * The application holds `pressed`; a press calls `onClick` and changes
 * nothing by itself, because what is pressed in an editor follows the
 * selection and not the button. Every attribute of the button passes through,
 * so a toolbar that must not take the selection from the text can cancel
 * `onMouseDown`. `ref` reaches the button.
 *
 * Pressed is drawn as a boundary and a wash together, so it does not rest on
 * hue. An icon alone has no visible name: wrap the button in a `Tooltip`, as
 * above, which also has room for the shortcut.
 *
 * Styles ship in `@ekdotico/domico/styles/toolbar.css`.
 */
export const ToggleButton = forwardRef<
  HTMLButtonElement,
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type' | 'aria-pressed' | 'aria-label'> & {
    /** Whether it is on. */
    pressed: boolean;
    /** The button's name, the same in both states. For a button whose only content is an icon. */
    label?: string;
  }
>(function ToggleButton({ pressed, label, className, ...button }, ref) {
  return (
    <button
      {...button}
      ref={ref}
      type="button"
      className={['ekd-toggle', className].filter(Boolean).join(' ')}
      aria-pressed={pressed}
      aria-label={label}
    />
  );
});
