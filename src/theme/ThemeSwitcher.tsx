'use client';

import { palettes, themeNames } from '../../tokens/generated/tokens.js';
import { THEME_LABELS, applyTheme, type Theme } from './appearance.js';
import { useRenderedMode, useTheme } from './useAppearance.js';

/**
 * Theme picker. Writes `data-theme` on the document element and remembers the
 * choice in localStorage under `ekd-theme`.
 *
 * The active theme is read from the document rather than held in React state.
 * The bootstrap script applies the stored theme before React exists, so React
 * state initialised to a default would disagree with the page for one frame on
 * every load — the reader would see Sepia rendered with Parchment selected.
 *
 * The swatches read their canvas colour from the generated token export rather
 * than from computed CSS. That is not an optimisation: only one `[data-theme]`
 * is active on the document at a time, so the computed value for an inactive
 * theme is not available to read. Sourcing from the token export keeps the
 * swatches correct without a hand-maintained mirror that would drift.
 */

/** Canvas colour per theme and mode, resolved through the same cascade as CSS. */
function canvas(theme: Theme, mode: 'light' | 'dark'): string {
  const layer = palettes[theme][mode] as Record<string, string | undefined>;
  return layer['bg-canvas'] ?? palettes.parchment.light['bg-canvas'];
}

export function ThemeSwitcher() {
  const theme = useTheme();
  const renderedMode = useRenderedMode();

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
            onClick={() => applyTheme(key)}
          >
            <span
              className="theme-swatch"
              aria-hidden="true"
              style={{ background: canvas(key, renderedMode) }}
            />
            <span className="theme-name">{THEME_LABELS[key]}</span>
          </button>
        );
      })}
    </div>
  );
}
