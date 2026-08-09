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
 */

import { useSyncExternalStore } from 'react';
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
  return useSyncExternalStore(
    subscribeToDocument,
    () => {
      const value = document.documentElement.getAttribute('data-theme');
      return isTheme(value) ? value : DEFAULT_THEME;
    },
    () => DEFAULT_THEME,
  );
}

/**
 * The selected mode. Auto is the absence of the attribute, so anything that is
 * not an explicit light or dark reads as Auto.
 */
export function useMode(): Mode {
  return useSyncExternalStore(
    subscribeToDocument,
    () => {
      const value = document.documentElement.getAttribute('data-mode');
      return value === 'light' || value === 'dark' ? value : DEFAULT_MODE;
    },
    () => DEFAULT_MODE,
  );
}

/**
 * The mode the reader is actually looking at, with Auto already resolved.
 * Tracks both flip paths: the control writing or removing `data-mode`, and the
 * operating system preference changing while the reader is on Auto.
 */
export function useRenderedMode(): RenderedMode {
  return useSyncExternalStore(
    subscribeToAppearance,
    () =>
      resolveRenderedMode(
        document.documentElement.getAttribute('data-mode'),
        darkQuery().matches,
      ),
    () => 'light',
  );
}
