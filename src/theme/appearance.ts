/**
 * Appearance vocabulary and resolution.
 *
 * Everything about the reader's theme and mode choice that is not React: the
 * two vocabularies, the storage keys, the guards that stop a corrupted stored
 * value from being applied, and the rule that turns a stored mode plus an
 * operating system preference into the mode actually on screen.
 *
 * Deliberately free of browser globals, so the resolution rule can be tested
 * without a DOM and the bootstrap string can be built during a server render.
 * The parts that touch the document live in `useAppearance.ts`.
 *
 * The theme vocabulary is not declared here. It comes from the generated token
 * export, which is generated from `tokens/source/`, so adding a theme to the
 * token source updates the guard, the switcher and the bootstrap at once —
 * there is no second list to keep in step.
 */

import { themeNames, type ThemeName } from '../../tokens/generated/tokens.js';

export type Theme = ThemeName;

export const MODES = ['light', 'auto', 'dark'] as const;
export type Mode = (typeof MODES)[number];

/** The mode a reader is actually looking at. Auto has already resolved. */
export type RenderedMode = 'light' | 'dark';

export const DEFAULT_THEME: Theme = 'parchment';
export const DEFAULT_MODE: Mode = 'auto';

/**
 * Storage keys, unprefixed and shared by every Ekdotico surface.
 *
 * A reader who sets Sepia in one application should not meet Parchment in the
 * next. Unprefixed keys mean that follows them between applications without
 * any of them needing to know the others exist, and a new one needs no
 * coordination to join.
 */
export const THEME_STORAGE_KEY = 'ekd-theme';
export const MODE_STORAGE_KEY = 'ekd-mode';

/** Sentence case, per the Expression Guidelines. */
export const THEME_LABELS: Record<Theme, string> = {
  parchment: 'Parchment',
  library: 'Library',
  sepia: 'Sepia',
  mono: 'Mono',
};

/**
 * "Follow the system" rather than "Auto".
 *
 * Auto names the mechanism; the reader cares what it will do. Instructional
 * register rule 4 asks for no assumed knowledge, and "Auto" assumes the reader
 * knows what it is automatic with respect to. It is three words against one,
 * which the Functional register permits at its ceiling.
 */
export const MODE_LABELS: Record<Mode, string> = {
  light: 'Light',
  auto: 'Follow the system',
  dark: 'Dark',
};

export function isTheme(value: unknown): value is Theme {
  return typeof value === 'string' && (themeNames as readonly string[]).includes(value);
}

export function isMode(value: unknown): value is Mode {
  return typeof value === 'string' && (MODES as readonly string[]).includes(value);
}

/**
 * Resolve what the reader is actually seeing.
 *
 * `dataMode` is the `data-mode` attribute, which is absent under Auto. That
 * absence is the whole mechanism: `[data-theme=…]:not([data-mode])` in the
 * stylesheet is what lets the `prefers-color-scheme` block apply. An explicit
 * choice always wins over the operating system, in both directions.
 */
export function resolveRenderedMode(
  dataMode: string | null,
  prefersDark: boolean,
): RenderedMode {
  if (dataMode === 'light') return 'light';
  if (dataMode === 'dark') return 'dark';
  return prefersDark ? 'dark' : 'light';
}

/**
 * One year. The choice is a reading accommodation rather than a session
 * preference, so it should outlast any plausible gap between visits.
 */
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/**
 * Persist a choice where the server can read it back.
 *
 * A cookie rather than localStorage, because the server renders the restored
 * theme into the markup and localStorage is not available to it. See
 * `server.ts` for why that matters — in short, reading from localStorage
 * forces an inline script and therefore a Content-Security-Policy concession.
 *
 * Not HttpOnly: the switcher writes it. SameSite=Lax because it is read on
 * ordinary top-level navigation and nothing else. Secure on https only, so
 * that local development over http still works.
 *
 * localStorage is written too, and only for as long as the init script is
 * still in use anywhere — it is the fallback path for static exports and the
 * migration path for readers whose choice predates the cookie.
 */
function persist(key: string, value: string): void {
  const secure = location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${key}=${encodeURIComponent(value)}; Path=/; Max-Age=${COOKIE_MAX_AGE}; SameSite=Lax${secure}`;

  try {
    localStorage.setItem(key, value);
  } catch {
    // Private browsing, or a blocked storage partition. The cookie above is
    // the one that matters; this is the compatibility path.
  }
}

/** Write the theme to the document and remember it. */
export function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute('data-theme', theme);
  persist(THEME_STORAGE_KEY, theme);
}

/** Write the mode to the document and remember it. Auto removes the attribute. */
export function applyMode(mode: Mode): void {
  if (mode === 'auto') {
    document.documentElement.removeAttribute('data-mode');
  } else {
    document.documentElement.setAttribute('data-mode', mode);
  }
  persist(MODE_STORAGE_KEY, mode);
}
