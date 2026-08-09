/**
 * Theme application.
 *
 * The theme mechanism is part of the house style, not an application detail.
 * If each repository implemented its own switching, the four themes would
 * diverge in behaviour even while sharing values — a document set to Sepia in
 * one tool and Parchment in another is the same drift problem in a different
 * costume.
 *
 * The contract:
 *   data-theme="parchment | library | sepia | mono"  on <html>
 *   data-mode="light | dark"                          on <html>, or absent
 *
 * An absent data-mode means "follow the system", which the stylesheet handles
 * through prefers-color-scheme. Persistence uses localStorage keys `ekd-theme`
 * and `ekd-mode`; both are shared across all three applications by design.
 *
 * The document is the state. Every hook here reads those attributes rather
 * than holding a copy, because the init script writes them before React runs
 * and a copy would start out stale.
 */

export { ThemeSwitcher } from './ThemeSwitcher.js';
export { ModeSwitcher } from './ModeSwitcher.js';
export { useRadioGroup } from './useRadioGroup.js';

/**
 * Restoring the theme on the server is the preferred mechanism; the init
 * script is the fallback for applications with no server render, and the
 * migration path for readers whose choice is still in localStorage. See
 * `server.ts`.
 */
export { appearanceAttributes, type CookieStore } from './server.js';
export { themeInitScript } from './init.js';

export {
  useTheme,
  useMode,
  useRenderedMode,
} from './useAppearance.js';

export {
  MODES,
  MODE_LABELS,
  THEME_LABELS,
  THEME_STORAGE_KEY,
  MODE_STORAGE_KEY,
  DEFAULT_THEME,
  DEFAULT_MODE,
  applyTheme,
  applyMode,
  isTheme,
  isMode,
  resolveRenderedMode,
  type Theme,
  type Mode,
  type RenderedMode,
} from './appearance.js';
