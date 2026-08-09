'use client';

import { useEffect, useState } from 'react';

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
            {m.key === 'light' && <SunIcon />}
            {m.key === 'auto' && <MonitorIcon />}
            {m.key === 'dark' && <MoonIcon />}
          </button>
        );
      })}
    </div>
  );
}

// Icons — 14×14, currentColor stroke, hand-drawn line aesthetic to
// match the LogoMark. Inline so we don't pull in an icon library.

function SunIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
      <g
        stroke="currentColor"
        fill="none"
        strokeWidth="1.5"
        strokeLinecap="round"
      >
        <circle cx="12" cy="12" r="3.5" />
        <path d="M12 3.5v2M12 18.5v2M3.5 12h2M18.5 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4l1.4-1.4M17 7l1.4-1.4" />
      </g>
    </svg>
  );
}

function MonitorIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
      <g
        stroke="currentColor"
        fill="none"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="4" width="18" height="13" rx="1.5" />
        <path d="M9 20.5h6M12 17v3.5" />
      </g>
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M19.5 14.5A8 8 0 1 1 9.5 4.5 6.5 6.5 0 0 0 19.5 14.5Z"
        stroke="currentColor"
        fill="none"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
