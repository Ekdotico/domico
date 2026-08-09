'use client';

import { useEffect, useState } from 'react';

export type RenderedMode = 'light' | 'dark';

// Resolve what the user is actually seeing right now: data-mode="light"|"dark"
// wins; otherwise (Auto / new visitor) the OS preference decides.
function getRenderedMode(): RenderedMode {
  if (typeof document === 'undefined') return 'light';
  const m = document.documentElement.getAttribute('data-mode');
  if (m === 'light') return 'light';
  if (m === 'dark') return 'dark';
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

// React hook that tracks the rendered mode across every flip path:
// - the ModeSwitcher writing/removing data-mode on <html>
// - the OS preference flipping while in Auto
// SSR returns 'light' since there is no document; clients hydrate to the real
// value in a useEffect.
export function useRenderedMode(): RenderedMode {
  const [mode, setMode] = useState<RenderedMode>('light');

  useEffect(() => {
    setMode(getRenderedMode());

    const observer = new MutationObserver(() => setMode(getRenderedMode()));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-mode'],
    });

    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const onMqlChange = () => setMode(getRenderedMode());
    mql.addEventListener('change', onMqlChange);

    return () => {
      observer.disconnect();
      mql.removeEventListener('change', onMqlChange);
    };
  }, []);

  return mode;
}
