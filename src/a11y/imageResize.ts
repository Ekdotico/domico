/**
 * The width of an image block, by a handle: `attachImageResize`.
 *
 * `styles/editor.css` draws the block (`ekd-image`) and its handle
 * (`ekd-image-resize`). This is what makes the handle work, and it is the one
 * thing in that stylesheet's contract that is behaviour. It is framework-neutral
 * and knows no editor: it is given two elements, and what it reads and writes
 * is the DOM. A node view in ProseMirror, a React component and a plain page
 * call it the same way.
 *
 * The handle is a slider (WAI-ARIA `role="slider"`), because that is what it
 * is: one number, 10 to 100, set by moving along a line. So it has two ways to
 * be moved, and neither is the only one.
 *
 *   Pointer   press the handle and drag toward the end of the line. Mouse,
 *             touch and pen, through pointer capture, so the drag follows the
 *             pointer off the handle and off the page. Escape puts the width
 *             back. The page is not scrolled by a touch that starts on the
 *             handle (`touch-action: none` in the stylesheet).
 *   Keyboard  Right and Up widen, Left and Down narrow, by 5; Page Up and
 *             Page Down by 25; Home and End go to 10 and to 100. In a right to
 *             left block Left widens and Right narrows, as a native range
 *             input does. A key lands on a multiple of the step, so a width
 *             of 53 goes to 55 and not to 58.
 *
 * Dragging is the one way in this block that WCAG 2.5.7 (Dragging Movements)
 * asks a single-pointer alternative for, and the keys are not that
 * alternative: they are for a keyboard. The alternative for a pointer is a
 * `Select` of widths in the block's own controls, which is the application's
 * to draw. The README says so.
 *
 * Events. Each change is announced on the handle as an `ekd-image-resize`
 * CustomEvent that bubbles, with `detail` of `{ width, phase, source }`.
 *
 *   phase   `move`    during a drag: the width is shown and nothing is
 *                     decided. Do not write it to the document.
 *           `commit`  the width is final and differs from the one before:
 *                     one per key, one at the end of a drag. Write it.
 *           `cancel`  a drag ended where it began, or was abandoned (Escape,
 *                     the pointer was taken away). The width has been put
 *                     back. Write nothing.
 *   source  `pointer` or `keyboard`.
 *
 * The width is drawn by the stylesheet from `--ekd-image-width` on the frame,
 * and the helper keeps that property, `aria-valuenow` and `aria-valuetext` in
 * step with it. It sets no `aria-label`: what the handle is called is the
 * application's words, and an unnamed slider is a fault the application
 * answers for.
 *
 * Nothing here touches the document when the module is loaded, so it is safe
 * to import from a server module. Call `attachImageResize` from an effect, or
 * from a node view's constructor.
 */

/** The name of the event the handle sends. */
export const IMAGE_RESIZE_EVENT = 'ekd-image-resize';
/** The custom property on the frame that the stylesheet reads the width from. */
export const IMAGE_WIDTH_PROPERTY = '--ekd-image-width';
/** The narrowest and the widest an image is, as a percentage of the text column. */
export const IMAGE_WIDTH_MIN = 10;
export const IMAGE_WIDTH_MAX = 100;
/** What an arrow key, and Page Up and Page Down, change the width by. */
export const IMAGE_WIDTH_STEP = 5;
export const IMAGE_WIDTH_PAGE_STEP = 25;

export interface ImageWidthLimits {
  /** Default 10. */
  min?: number;
  /** Default 100. */
  max?: number;
  /** What an arrow key changes the width by. Default 5. */
  step?: number;
  /** What Page Up and Page Down change it by. Default 25. */
  pageStep?: number;
}

export interface ImageResizeDetail {
  /** A whole number between the limits. */
  width: number;
  phase: 'move' | 'commit' | 'cancel';
  source: 'pointer' | 'keyboard';
}

/** The event on the handle: `handle.addEventListener(IMAGE_RESIZE_EVENT, (e) => …)` with `e as ImageResizeEvent`. */
export type ImageResizeEvent = CustomEvent<ImageResizeDetail>;

export interface ImageResizeOptions extends ImageWidthLimits {
  /** The element with `class="ekd-image-resize"`. It is given `role="slider"` and the value attributes. */
  handle: HTMLElement;
  /** The element with `class="ekd-image-frame"`. Its parent is the text column that the width is a part of. */
  frame: HTMLElement;
  /** The width now, as a percentage of the text column. */
  width: number;
  /** What a screen reader hears for the value. Default: the number and a percent sign. */
  valueText?: (width: number) => string;
}

export interface ImageResizeControl {
  /** The document has a width: show it. A drag in progress is not interrupted by it. */
  update(width: number): void;
  /** Remove every listener. The attributes stay, because the elements may stay. */
  destroy(): void;
}

const resolve = (limits: ImageWidthLimits = {}) => {
  const min = limits.min ?? IMAGE_WIDTH_MIN;
  const max = limits.max ?? IMAGE_WIDTH_MAX;
  const step = limits.step ?? IMAGE_WIDTH_STEP;
  const pageStep = limits.pageStep ?? IMAGE_WIDTH_PAGE_STEP;
  if (!(Number.isFinite(min) && Number.isFinite(max) && min >= 1 && max <= 100 && min < max)) {
    throw new RangeError(`An image width runs from 1 to 100 percent, and min must be below max: got ${min} to ${max}`);
  }
  if (!(step > 0 && pageStep > 0)) throw new RangeError('The steps of an image width are above zero');
  return { min, max, step, pageStep };
};

/** The nearest whole number inside the limits. A width that is not a number is a fault in the caller. */
export function clampImageWidth(width: number, limits?: ImageWidthLimits): number {
  const { min, max } = resolve(limits);
  if (!Number.isFinite(width)) throw new RangeError(`An image width is a number: got ${String(width)}`);
  return Math.min(max, Math.max(min, Math.round(width)));
}

const KEYS: Record<string, { direction: 1 | -1 | 0; page?: boolean; edge?: 'min' | 'max'; flips?: boolean }> = {
  ArrowRight: { direction: 1, flips: true },
  ArrowLeft: { direction: -1, flips: true },
  ArrowUp: { direction: 1 },
  ArrowDown: { direction: -1 },
  PageUp: { direction: 1, page: true },
  PageDown: { direction: -1, page: true },
  Home: { direction: 0, edge: 'min' },
  End: { direction: 0, edge: 'max' },
};

/**
 * The width a key gives, or `null` for a key that is not the slider's. A key
 * that changes nothing, such as Right at 100, gives the width it was given:
 * the key is the slider's and is still spent.
 */
export function imageWidthForKey(
  key: string,
  width: number,
  options: ImageWidthLimits & { rtl?: boolean } = {},
): number | null {
  const entry = KEYS[key];
  if (!entry) return null;
  const limits = resolve(options);
  const current = clampImageWidth(width, limits);
  if (entry.edge) return entry.edge === 'min' ? limits.min : limits.max;
  const direction = entry.flips && options.rtl ? -entry.direction : entry.direction;
  const step = entry.page ? limits.pageStep : limits.step;
  // To the next multiple of the step in the direction asked, so that a width
  // a drag left at 53 goes to 55 and then 60, and not to 58 and 63.
  const target = direction > 0 ? (Math.floor(current / step) + 1) * step : (Math.ceil(current / step) - 1) * step;
  return clampImageWidth(target, limits);
}

/**
 * The width after a drag of `deltaPx` along the line of text. `columnPx` is
 * the width of the text column that the percentage is a part of. In a right
 * to left block the end of the line is on the left, and a drag to the left
 * widens.
 */
export function imageWidthForDrag(
  startWidth: number,
  deltaPx: number,
  columnPx: number,
  options: ImageWidthLimits & { rtl?: boolean } = {},
): number {
  if (!(columnPx > 0)) throw new RangeError(`A column has a width: got ${columnPx}`);
  const along = options.rtl ? -deltaPx : deltaPx;
  return clampImageWidth(startWidth + (along / columnPx) * 100, options);
}

interface Drag {
  pointerId: number;
  startX: number;
  startWidth: number;
  columnPx: number;
  rtl: boolean;
}

export function attachImageResize(options: ImageResizeOptions): ImageResizeControl {
  const { handle, frame } = options;
  const limits = resolve(options);
  const valueText = options.valueText ?? ((w: number) => `${w}%`);
  let width = clampImageWidth(options.width, limits);
  let drag: Drag | null = null;

  const isRtl = () => (handle.ownerDocument.defaultView ?? window).getComputedStyle(handle).direction === 'rtl';

  const show = (next: number) => {
    width = next;
    frame.style.setProperty(IMAGE_WIDTH_PROPERTY, `${next}%`);
    handle.setAttribute('aria-valuenow', String(next));
    handle.setAttribute('aria-valuetext', valueText(next));
  };

  const send = (detail: ImageResizeDetail) => {
    const View = handle.ownerDocument.defaultView ?? window;
    handle.dispatchEvent(new View.CustomEvent<ImageResizeDetail>(IMAGE_RESIZE_EVENT, { bubbles: true, detail }));
  };

  handle.setAttribute('role', 'slider');
  handle.setAttribute('aria-orientation', 'horizontal');
  handle.setAttribute('aria-valuemin', String(limits.min));
  handle.setAttribute('aria-valuemax', String(limits.max));
  if (!handle.hasAttribute('tabindex')) handle.setAttribute('tabindex', '0');
  show(width);

  const endDrag = (id: number) => {
    frame.removeAttribute('data-resizing');
    if (handle.hasPointerCapture?.(id)) handle.releasePointerCapture(id);
    drag = null;
  };

  /** Finish a drag. `keep` is whether the width it reached is the one wanted. */
  const finish = (keep: boolean) => {
    if (!drag) return;
    const { startWidth, pointerId } = drag;
    const reached = width;
    endDrag(pointerId);
    if (keep && reached !== startWidth) {
      send({ width: reached, phase: 'commit', source: 'pointer' });
      return;
    }
    if (reached !== startWidth) show(startWidth);
    send({ width: startWidth, phase: 'cancel', source: 'pointer' });
  };

  const onPointerDown = (event: PointerEvent) => {
    if (drag || event.button !== 0 || event.isPrimary === false) return;
    const columnPx = frame.parentElement?.clientWidth ?? 0;
    // A column that is not laid out has no width to be a percentage of.
    if (!(columnPx > 0)) return;
    // Focus is taken by hand: the press is not allowed to select text.
    event.preventDefault();
    handle.focus({ preventScroll: true });
    handle.setPointerCapture?.(event.pointerId);
    drag = { pointerId: event.pointerId, startX: event.clientX, startWidth: width, columnPx, rtl: isRtl() };
    frame.setAttribute('data-resizing', '');
  };

  const onPointerMove = (event: PointerEvent) => {
    if (!drag || event.pointerId !== drag.pointerId) return;
    const next = imageWidthForDrag(drag.startWidth, event.clientX - drag.startX, drag.columnPx, { ...limits, rtl: drag.rtl });
    if (next === width) return;
    show(next);
    send({ width: next, phase: 'move', source: 'pointer' });
  };

  const onPointerUp = (event: PointerEvent) => {
    if (drag && event.pointerId === drag.pointerId) finish(true);
  };

  const onPointerCancel = (event: PointerEvent) => {
    if (drag && event.pointerId === drag.pointerId) finish(false);
  };

  // The pointer was taken away without a pointerup or a pointercancel.
  const onLostCapture = (event: PointerEvent) => {
    if (drag && event.pointerId === drag.pointerId) finish(false);
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.key === 'Escape' && drag) {
      event.preventDefault();
      event.stopPropagation();
      finish(false);
      return;
    }
    const next = imageWidthForKey(event.key, width, { ...limits, rtl: isRtl() });
    if (next === null) return;
    // The key is the slider's, so an editor round it does not move its caret.
    event.preventDefault();
    event.stopPropagation();
    if (drag || next === width) return;
    show(next);
    send({ width: next, phase: 'commit', source: 'keyboard' });
  };

  handle.addEventListener('pointerdown', onPointerDown);
  handle.addEventListener('pointermove', onPointerMove);
  handle.addEventListener('pointerup', onPointerUp);
  handle.addEventListener('pointercancel', onPointerCancel);
  handle.addEventListener('lostpointercapture', onLostCapture);
  handle.addEventListener('keydown', onKeyDown);

  return {
    update(next) {
      if (drag) return;
      show(clampImageWidth(next, limits));
    },
    destroy() {
      if (drag) endDrag(drag.pointerId);
      handle.removeEventListener('pointerdown', onPointerDown);
      handle.removeEventListener('pointermove', onPointerMove);
      handle.removeEventListener('pointerup', onPointerUp);
      handle.removeEventListener('pointercancel', onPointerCancel);
      handle.removeEventListener('lostpointercapture', onLostCapture);
      handle.removeEventListener('keydown', onKeyDown);
    },
  };
}
