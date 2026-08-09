'use client';

/**
 * Appearance state, read from the document rather than held in React.
 *
 * The `data-theme` and `data-mode` attributes on the document element are the
 * state. They have to be: the bootstrap script from `init.ts` writes them
 * before React exists, so a React copy initialised to a default would start
 * out stale — the page would already be Sepia while the control still reported
 * Parchment, for one frame on every load.
 *
 * `useSyncExternalStore` is the primitive for exactly this: an external store
 * with a subscription, a client snapshot, and a server snapshot. It also
 * settles the server render honestly, since there is no document during SSR.
 *
 * That third snapshot used to be a constant, which made the server render
 * honest but wrong: the reader's cookie had already put the right theme on
 * <html>, and these hooks reported the default anyway. It now comes from
 * `AppearanceProvider`, which carries the cookie the server read. An
 * application that installs no provider gets the old constants, so nothing
 * that worked before needs to change.
 */

import { useSyncExternalStore } from 'react';
import { useServerAppearance } from './AppearanceProvider.js';
import {
  DEFAULT_MODE,
  DEFAULT_THEME,
  isTheme,
  resolveRenderedMode,
  type Mode,
  type RenderedMode,
  type Theme,
} from './appearance.js';

/** Subscribe to the document element attributes. */
function subscribeToDocument(onStoreChange: () => void): () => void {
  const observer = new MutationObserver(onStoreChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme', 'data-mode'],
  });
  return () => observer.disconnect();
}

/** The document attributes, and the operating system preference. */
function subscribeToAppearance(onStoreChange: () => void): () => void {
  const unobserve = subscribeToDocument(onStoreChange);
  const query = darkQuery();
  query.addEventListener('change', onStoreChange);
  return () => {
    unobserve();
    query.removeEventListener('change', onStoreChange);
  };
}

let cachedQuery: MediaQueryList | undefined;

function darkQuery(): MediaQueryList {
  cachedQuery ??= window.matchMedia('(prefers-color-scheme: dark)');
  return cachedQuery;
}

/**
 * The selected theme. Falls back to the default when the attribute is absent
 * or holds something outside the vocabulary.
 */
export function useTheme(): Theme {
  const { theme } = useServerAppearance();

  return useSyncExternalStore(
    subscribeToDocument,
    () => {
      const value = document.documentElement.getAttribute('data-theme');
      return isTheme(value) ? value : DEFAULT_THEME;
    },
    () => theme,
  );
}

/**
 * The selected mode. Auto is the absence of the attribute, so anything that is
 * not an explicit light or dark reads as Auto.
 */
export function useMode(): Mode {
  const { mode } = useServerAppearance();

  return useSyncExternalStore(
    subscribeToDocument,
    () => {
      const value = document.documentElement.getAttribute('data-mode');
      return value === 'light' || value === 'dark' ? value : DEFAULT_MODE;
    },
    () => mode,
  );
}

/**
 * The mode the reader is actually looking at, with Auto already resolved.
 * Tracks both flip paths: the control writing or removing `data-mode`, and the
 * operating system preference changing while the reader is on Auto.
 *
 * This is the one hook the server can only partly answer. An explicit Light or
 * Dark is in the cookie and is honoured. Auto is not a value the server holds:
 * it is a deferral to a preference that lives on the reader's machine and is
 * never sent with the request. Light is the assumption, and a reader on Auto
 * with a dark system still sees one frame of light-mode swatches before
 * hydration resolves it.
 *
 * Resolving that properly needs the `Sec-CH-Prefers-Color-Scheme` client hint,
 * which is Chromium-only and absent on the first visit of a session — or it
 * needs the affected surfaces to stop asking this question and let CSS answer
 * it, which is the better end state and a larger change than this one.
 */
export function useRenderedMode(): RenderedMode {
  const { mode } = useServerAppearance();

  return useSyncExternalStore(
    subscribeToAppearance,
    () =>
      resolveRenderedMode(
        document.documentElement.getAttribute('data-mode'),
        darkQuery().matches,
      ),
    () => (mode === 'auto' ? 'light' : mode),
  );
}
