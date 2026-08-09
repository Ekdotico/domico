'use client';

import { useEffect, useState } from 'react';
import { palettes, themeNames, type ThemeName } from '../../tokens/generated/tokens.js';
import { useRenderedMode } from './useRenderedMode.js';

/**
 * Theme picker. Writes `data-theme` on the document element and remembers the
 * choice in localStorage under `ekd-theme`.
 *
 * The swatches read their canvas colour from the generated token export rather
 * than from computed CSS. That is not an optimisation: only one `[data-theme]`
 * is active on the document at a time, so the computed value for an inactive
 * theme is not available to read. Sourcing from the token export keeps the
 * swatches correct without a hand-maintained mirror that would drift.
 */

const STORAGE_KEY = 'ekd-theme';

const LABELS: Record<ThemeName, string> = {
  parchment: 'Parchment',
  library: 'Library',
  sepia: 'Sepia',
  mono: 'Mono',
};

/** Canvas colour per theme and mode, resolved through the same cascade as CSS. */
function canvas(theme: ThemeName, mode: 'light' | 'dark'): string {
  const layer = palettes[theme][mode] as Record<string, string | undefined>;
  return layer['bg-canvas'] ?? palettes.parchment.light['bg-canvas'];
}

function isThemeName(value: unknown): value is ThemeName {
  return typeof value === 'string' && (themeNames as readonly string[]).includes(value);
}

export function applyTheme(theme: ThemeName): void {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Private browsing or a blocked storage partition. The theme still applies
    // for this page; it simply will not survive a reload.
  }
}

export function ThemeSwitcher() {
  const [theme, setTheme] = useState<ThemeName>('parchment');
  const renderedMode = useRenderedMode();

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (isThemeName(stored)) {
        setTheme(stored);
        document.documentElement.dataset.theme = stored;
      }
    } catch {
      // See applyTheme.
    }
  }, []);

  const choose = (next: ThemeName) => {
    setTheme(next);
    applyTheme(next);
  };

  return (
    <div className="theme-switcher" role="radiogroup" aria-label="Colour theme">
      {themeNames.map((key) => {
        const active = theme === key;
        return (
          <button
            key={key}
            type="button"
            role="radio"
            aria-checked={active}
            className={`theme-btn ${active ? 'active' : ''}`}
            onClick={() => choose(key)}
          >
            <span
              className="theme-swatch"
              aria-hidden="true"
              style={{ background: canvas(key, renderedMode) }}
            />
            <span className="theme-name">{LABELS[key]}</span>
          </button>
        );
      })}
    </div>
  );
}
