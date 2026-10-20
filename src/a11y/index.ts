/**
 * Accessibility helpers: `@ekdotico/domico/a11y`.
 *
 * Behaviour the three applications each wrote for themselves, and each got a
 * different part of right. They are not components — none renders anything —
 * so they live on their own subpath rather than in `/components`, and nothing
 * here imports a stylesheet, a token, or anything that touches the document
 * during render. Safe to import from a server module; call the functions from
 * an effect or an event handler.
 *
 *   inertOutside      the inert background a modal surface owes
 *   useModalSurface   the whole of the aria-modal promise: inert background,
 *                     Tab cycle, Escape, and focus returned in the right order
 *   isShortcut        a ⌘/Ctrl chord that means one thing on every platform
 *   shortcutLabel     the same chord, for the screen and aria-keyshortcuts
 *   attachImageResize the handle on an image block: a slider that is dragged
 *                     or moved by the keys, and says each width as an event
 */

export { inertOutside } from './inertOutside.js';
export {
  useModalSurface,
  tabbableWithin,
  type ElementRef,
  type ModalSurfaceOptions,
} from './useModalSurface.js';
export { isShortcut, shortcutLabel, type ShortcutLabel } from './shortcut.js';
export {
  attachImageResize,
  clampImageWidth,
  imageWidthForKey,
  imageWidthForDrag,
  IMAGE_RESIZE_EVENT,
  IMAGE_WIDTH_PROPERTY,
  IMAGE_WIDTH_MIN,
  IMAGE_WIDTH_MAX,
  IMAGE_WIDTH_STEP,
  IMAGE_WIDTH_PAGE_STEP,
  type ImageResizeControl,
  type ImageResizeDetail,
  type ImageResizeEvent,
  type ImageResizeOptions,
  type ImageWidthLimits,
} from './imageResize.js';
