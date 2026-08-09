'use client';

/**
 * The reader's choice, carried into the first client render.
 *
 * The document is the state, and on the server there is no document. Every
 * hook in `useAppearance.ts` therefore needs a third answer for the render
 * that produces the markup, and until now that answer was a constant: the
 * default theme, the default mode, light. The page was already correct —
 * `appearanceAttributes()` had written the reader's theme onto <html> — but
 * every component that asked *which* theme was told Parchment.
 *
 * The cost was not only cosmetic. `ThemeSwitcher` puts its single tab stop on
 * the selected option, so a reader arriving by keyboard before hydration
 * landed on Parchment rather than on the theme they had chosen.
 *
 * A provider rather than a prop on each component, for two reasons. The
 * consumers are not only the switchers — a logo picking a variant and a
 * diagram picking a palette ask the same question, and one of those is
 * injected into MDX where no prop can reach it. And a component's own API
 * should not have to grow a field every time a new surface needs the answer.
 *
 * Applications with no server render need none of this. The context default is
 * the same pair the hooks used to hardcode, so an unwrapped tree behaves
 * exactly as it did before.
 *
 *   // app/layout.tsx
 *   const store = await cookies();
 *   <html {...appearanceAttributes(store)}>
 *     <body>
 *       <AppearanceProvider value={appearanceState(store)}>{children}</AppearanceProvider>
 *     </body>
 *   </html>
 */

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { DEFAULT_MODE, DEFAULT_THEME, type AppearanceState } from './appearance.js';

/**
 * The defaults are the contract for an unwrapped tree: exactly what the hooks
 * returned from their server snapshot before this existed.
 */
const AppearanceContext = createContext<AppearanceState>({
  theme: DEFAULT_THEME,
  mode: DEFAULT_MODE,
});

export interface AppearanceProviderProps {
  /** Read on the server with `appearanceState()` from `theme/server`. */
  value: AppearanceState;
  children: ReactNode;
}

export function AppearanceProvider({
  value: { theme, mode },
  children,
}: AppearanceProviderProps) {
  // Rebuilt from the two primitives rather than passed straight through. The
  // value is fixed for the life of the document, so it should not acquire a
  // new identity when a parent re-renders and drag every consumer — including
  // Mermaid, which redraws — along with it.
  const appearance = useMemo(() => ({ theme, mode }), [theme, mode]);

  return <AppearanceContext.Provider value={appearance}>{children}</AppearanceContext.Provider>;
}

/**
 * What the server knew. Consulted only for the server snapshot: once hydrated,
 * the document is authoritative and this is never read again.
 */
export function useServerAppearance(): AppearanceState {
  return useContext(AppearanceContext);
}
