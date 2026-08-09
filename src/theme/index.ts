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
 */

export { ThemeSwitcher, applyTheme } from './ThemeSwitcher.js';
export { ModeSwitcher } from './ModeSwitcher.js';
export { useRenderedMode, type RenderedMode } from './useRenderedMode.js';
export { themeInitScript } from './init.js';
