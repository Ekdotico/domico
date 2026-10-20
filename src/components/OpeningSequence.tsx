'use client';

import { useEffect, useRef, useState } from 'react';
import { inertOutside } from '../a11y/inertOutside.js';
import { LogoMark } from './Logo.js';

/**
 * The opening sequence: the Ekdotico mark fades in and settles, the wordmark
 * fades in over the tail of it, a short hold, and the overlay fades away.
 *
 *   <OpeningSequence />          // once, first in the layout's body
 *
 * The three applications each carried one — two driving it with GSAP and one
 * with two CSS keyframes — and this is built from deree's and praktico's:
 *
 * - **Reduced motion first.** A reader who has asked for no motion never sees
 *   the overlay and never waits for anything; the check comes before the font
 *   wait, not inside it, which is where the documentation site's copy once had
 *   it. The reset disables animation outright under that query, so an overlay
 *   left waiting for one would sit on the page.
 * - **Once per session**, under `sessionKey`. Every surface uses the same key,
 *   so a reader who has come from another Ekdotico surface in this session has
 *   already sat through it. Storage refused by policy costs a replay, nothing
 *   more.
 * - **Never takes a press.** Server-rendered, the overlay exists before any
 *   script has decided whether it should play, transparent and top-most — and
 *   without JavaScript, permanently. `pointer-events: none` at every stage, from
 *   deree, is what keeps it from swallowing every click on the page beneath.
 * - **The page beneath is inert while it is covered**, from praktico and deree,
 *   so a keyboard reader does not tab through a page they cannot see. The
 *   overlay is `aria-hidden`: it says nothing the page does not say in text a
 *   moment later.
 * - **Removed through React state**, never `remove()`, which desynchronises
 *   the reconciler on the next render.
 * - **Starts when the fonts are ready or after 400ms**, whichever is first, so
 *   a cold cache cannot hold the page behind the overlay.
 * - **No animation library.** The stylesheet fades the mark in with one
 *   keyframe and nothing to measure. It used to trace the arch on as a stroke;
 *   the epsilon is a filled shape with no line to trace, so it fades. The
 *   length of the sequence is read back off the computed animation rather
 *   than restated here.
 *
 * Styles ship in `@ekdotico/domico/styles/opening-sequence.css`, and every
 * duration there is derived from `--dur-slow`.
 */

/** The key every Ekdotico surface shares, so the intro plays once per session across them. */
const DEFAULT_SESSION_KEY = 'ekd:intro-shown';

/** The longest the sequence waits for webfonts before starting anyway. */
const FONTS_WAIT_MS = 400;

/**
 * Used only when the computed timing cannot be read. Longer than the sequence
 * on purpose: an overlay removed mid-fade is the worse mistake.
 */
const FALLBACK_TOTAL_MS = 2000;

/** A computed time, in either unit, as milliseconds. The longest of a list. */
function toMs(value: string): number {
  let longest = 0;
  for (const part of value.split(',')) {
    const parsed = Number.parseFloat(part);
    if (!Number.isFinite(parsed)) continue;
    longest = Math.max(longest, part.trim().endsWith('ms') ? parsed : parsed * 1000);
  }
  return longest;
}

export function OpeningSequence({ sessionKey = DEFAULT_SESSION_KEY }: { sessionKey?: string } = {}) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;

    const prefersReduced =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let alreadyShown = false;
    try {
      alreadyShown = window.sessionStorage.getItem(sessionKey) === '1';
    } catch {
      // Storage refused. Play the sequence.
    }

    if (prefersReduced || alreadyShown) {
      setHidden(true);
      return;
    }

    try {
      window.sessionStorage.setItem(sessionKey, '1');
    } catch {
      // Not remembering costs a replay, which is not worth failing over.
    }

    // Once only: the timer and the unmount both release, and by the unmount
    // another surface — an open drawer — may have inerted the same elements.
    const restore = inertOutside(overlay);
    let released = false;
    const release = () => {
      if (released) return;
      released = true;
      restore();
    };
    overlay.classList.add('is-covering');

    let cancelled = false;
    let started = false;
    let endTimer = 0;

    const start = () => {
      if (started || cancelled) return;
      started = true;
      overlay.classList.add('is-playing');
      const computed = window.getComputedStyle(overlay);
      const total = toMs(computed.animationDelay) + toMs(computed.animationDuration);
      endTimer = window.setTimeout(
        () => {
          release();
          setHidden(true);
        },
        total > 0 ? total : FALLBACK_TOTAL_MS,
      );
    };

    const fontsTimer = window.setTimeout(start, FONTS_WAIT_MS);
    document.fonts?.ready.then(start, start);

    return () => {
      cancelled = true;
      window.clearTimeout(fontsTimer);
      window.clearTimeout(endTimer);
      release();
    };
  }, [sessionKey]);

  if (hidden) return null;

  return (
    <div ref={overlayRef} className="opening-sequence" aria-hidden="true">
      <LogoMark size={160} title="" className="opening-sequence-mark" />
      <div className="opening-sequence-wordmark">Ekdotico</div>
    </div>
  );
}
