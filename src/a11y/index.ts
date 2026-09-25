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
 */

export { inertOutside } from './inertOutside.js';
export {
  useModalSurface,
  tabbableWithin,
  type ElementRef,
  type ModalSurfaceOptions,
} from './useModalSurface.js';
export { isShortcut, shortcutLabel, type ShortcutLabel } from './shortcut.js';
