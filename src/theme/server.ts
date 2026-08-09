/**
 * Server-rendered appearance.
 *
 * The reader's theme is restored on the server, from a cookie, and written
 * straight onto the <html> element in the markup. No inline script runs, so
 * there is nothing for a Content-Security-Policy to make an exception for.
 *
 * This replaces the blocking init script as the preferred mechanism, and the
 * reason is security rather than tidiness. Restoring from localStorage
 * requires JavaScript, before first paint, inline — which forces every
 * consumer to either mint a per-request nonce or admit 'unsafe-inline' into
 * `script-src`. One application already admitted it, and recorded the
 * concession, because its hosting could not produce a request-scoped nonce.
 * A cookie is readable during the render that produces the markup, so the
 * question does not arise.
 *
 *   // app/layout.tsx
 *   import { cookies } from 'next/headers';
 *   import { appearanceAttributes } from '@ekdotico/design-system/theme/server';
 *
 *   export default async function RootLayout({ children }) {
 *     return (
 *       <html lang="en" {...appearanceAttributes(await cookies())}>
 *         <body>{children}</body>
 *       </html>
 *     );
 *   }
 *
 * Auto is still resolved by CSS rather than on the server, and deliberately.
 * The server cannot know the reader's operating system preference, but it does
 * not need to: Auto is the *absence* of `data-mode`, and the stylesheet's
 * `[data-theme=…]:not([data-mode])` block hands the decision to
 * `prefers-color-scheme` at paint time. No script, no flash, no round trip.
 *
 * `themeInitScript()` remains for applications with no server render — a
 * static export has no request in which to read a cookie — and as a migration
 * shim for readers whose choice is still in localStorage.
 */

import { MODE_STORAGE_KEY, THEME_STORAGE_KEY, isMode, isTheme } from './appearance.js';

/**
 * The shape of `cookies()` from `next/headers`, reduced to what is used here.
 * Typed structurally rather than imported so the package takes no dependency
 * on a framework, and so any cookie store with this shape works.
 */
export interface CookieStore {
  get(name: string): { value: string } | undefined;
}

export interface AppearanceAttributes {
  'data-theme'?: string;
  'data-mode'?: string;
}

/**
 * Attributes to spread onto <html>.
 *
 * A stored value outside the vocabulary is dropped rather than applied, so a
 * corrupted or stale cookie yields the default theme rather than an unstyled
 * document. `data-mode` is omitted entirely for Auto, since its absence is
 * what re-arms the prefers-color-scheme block.
 */
export function appearanceAttributes(cookies: CookieStore): AppearanceAttributes {
  const attributes: AppearanceAttributes = {};

  const theme = cookies.get(THEME_STORAGE_KEY)?.value;
  if (isTheme(theme)) attributes['data-theme'] = theme;

  const mode = cookies.get(MODE_STORAGE_KEY)?.value;
  if (isMode(mode) && mode !== 'auto') attributes['data-mode'] = mode;

  return attributes;
}
