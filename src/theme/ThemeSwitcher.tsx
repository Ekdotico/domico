'use client';

import type { CSSProperties } from 'react';
import { palettes, themeNames } from '../../tokens/generated/tokens.js';
import { THEME_LABELS, applyTheme, type Theme } from './appearance.js';
import { useTheme } from './useAppearance.js';
import { useRadioGroup } from './useRadioGroup.js';

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
 *
 * Which of the two the reader sees is a question for CSS, not for JavaScript.
 * Each swatch carries both its light and its dark canvas as custom properties
 * and the stylesheet picks, through the same cascade that decides every other
 * colour on the page. Asking a hook instead meant asking what the server
 * cannot know — Auto defers to a preference that never leaves the reader's
 * machine — so the swatches rendered light on a dark page until hydration.
 * The rule in `components.css` has no such gap: `prefers-color-scheme` is
 * evaluated at paint, before the first frame, with no script involved.
 */

/** Canvas colour per theme and mode, resolved through the same cascade as CSS. */
function canvas(theme: Theme, mode: 'light' | 'dark'): string {
  const layer = palettes[theme][mode] as Record<string, string | undefined>;
  return layer['bg-canvas'] ?? palettes.parchment.light['bg-canvas'];
}

/**
 * Both candidates, for the stylesheet to choose between. Typed through
 * CSSProperties because custom properties are not in React's style map.
 */
function swatchColours(theme: Theme): CSSProperties {
  return {
    '--swatch-light': canvas(theme, 'light'),
    '--swatch-dark': canvas(theme, 'dark'),
  } as CSSProperties;
}

export interface ThemeSwitcherProps {
  /**
   * The id of a visible label for the group. When given, the group is named by
   * that element through `aria-labelledby` rather than by its own
   * `aria-label`, so the name a screen reader announces is the word a sighted
   * reader sees beside it. `AppearanceMenu` passes its "Theme" label this way.
   * Standalone, the group names itself "Colour theme".
   */
  labelledBy?: string;
}

export function ThemeSwitcher({ labelledBy }: ThemeSwitcherProps = {}) {
  const theme = useTheme();
  const { containerProps, radioProps } = useRadioGroup<Theme>({
    values: themeNames,
    selected: theme,
    onSelect: applyTheme,
  });

  return (
    <div
      className="theme-switcher"
      role="radiogroup"
      {...(labelledBy ? { 'aria-labelledby': labelledBy } : { 'aria-label': 'Colour theme' })}
      {...containerProps}
    >
      {themeNames.map((key) => {
        const active = theme === key;
        return (
          <button
            key={key}
            type="button"
            className={`theme-btn ${active ? 'active' : ''}`}
            {...radioProps(key)}
          >
            <span className="theme-swatch" aria-hidden="true" style={swatchColours(key)} />
            <span className="theme-name">{THEME_LABELS[key]}</span>
          </button>
        );
      })}
    </div>
  );
}
