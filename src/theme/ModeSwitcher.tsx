'use client';

import { useEffect, useState } from 'react';
import { MonitorIcon, MoonIcon, SunIcon } from '../components/icons.js';

type Mode = 'light' | 'dark' | 'auto';

const MODES: { key: Mode; label: string }[] = [
  { key: 'light', label: 'Light' },
  { key: 'auto', label: 'Auto' },
  { key: 'dark', label: 'Dark' },
];

function applyMode(mode: Mode) {
  if (mode === 'auto') {
    document.documentElement.removeAttribute('data-mode');
  } else {
    document.documentElement.setAttribute('data-mode', mode);
  }
  try {
    localStorage.setItem('ekd-mode', mode);
  } catch {
    /* localStorage unavailable */
  }
}

export function ModeSwitcher() {
  const [mode, setMode] = useState<Mode>('auto');

  useEffect(() => {
    try {
      const stored = localStorage.getItem('ekd-mode');
      if (stored === 'light' || stored === 'dark' || stored === 'auto') {
        setMode(stored);
      }
    } catch {
      /* localStorage unavailable */
    }
  }, []);

  const choose = (next: Mode) => {
    setMode(next);
    applyMode(next);
  };

  return (
    <div className="mode-switcher" role="radiogroup" aria-label="Color mode">
      {MODES.map((m) => {
        const isActive = mode === m.key;
        return (
          <button
            key={m.key}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-label={m.label}
            className={`mode-btn ${isActive ? 'active' : ''}`}
            onClick={() => choose(m.key)}
          >
            {m.key === 'light' && <SunIcon size={14} />}
            {m.key === 'auto' && <MonitorIcon size={14} />}
            {m.key === 'dark' && <MoonIcon size={14} />}
          </button>
        );
      })}
    </div>
  );
}
