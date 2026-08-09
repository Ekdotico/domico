'use client';

import { MonitorIcon, MoonIcon, SunIcon } from '../components/icons.js';
import { MODES, MODE_LABELS, applyMode, type Mode } from './appearance.js';
import { useMode } from './useAppearance.js';
import { useRadioGroup } from './useRadioGroup.js';

/**
 * Light, Auto, Dark. Writes `data-mode` on the document element, or removes it
 * for Auto, and remembers the choice in localStorage under `ekd-mode`.
 *
 * The absence of `data-mode` is what Auto is, not a placeholder for it: the
 * stylesheet's `[data-theme=…]:not([data-mode])` selector is what lets the
 * `prefers-color-scheme` block apply.
 *
 * The active mode is read from the document, for the same reason as the theme
 * — see ThemeSwitcher. The previous version additionally read the stored mode
 * in an effect and then did nothing with it, which was invisible only because
 * the bootstrap had already applied it.
 */

const ICONS: Record<Mode, typeof SunIcon> = {
  light: SunIcon,
  auto: MonitorIcon,
  dark: MoonIcon,
};

export function ModeSwitcher() {
  const mode = useMode();
  const { containerProps, radioProps } = useRadioGroup<Mode>({
    values: MODES,
    selected: mode,
    onSelect: applyMode,
  });

  return (
    <div className="mode-switcher" role="radiogroup" aria-label="Colour mode" {...containerProps}>
      {MODES.map((key) => {
        const active = mode === key;
        const Icon = ICONS[key];
        return (
          <button
            key={key}
            type="button"
            aria-label={MODE_LABELS[key]}
            className={`mode-btn ${active ? 'active' : ''}`}
            {...radioProps(key)}
          >
            <Icon size={14} />
          </button>
        );
      })}
    </div>
  );
}
