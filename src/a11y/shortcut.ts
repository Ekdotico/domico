/**
 * A keyboard chord that means the same thing on every platform: ⌘ and the key
 * on Apple platforms, Ctrl and the key everywhere else.
 *
 *   useEffect(() => {
 *     const onKeyDown = (event: KeyboardEvent) => {
 *       if (isShortcut(event, 'k')) { event.preventDefault(); openSearch(); }
 *     };
 *     document.addEventListener('keydown', onKeyDown);
 *     return () => document.removeEventListener('keydown', onKeyDown);
 *   }, []);
 *
 *   const { label, aria } = shortcutLabel('k'); // "⌘K" / "Meta+K"
 *   <button aria-keyshortcuts={aria}>Search <kbd>{label}</kbd></button>
 *
 * Moved from deree's research search, where it was written against the
 * failures below; the documentation site binds the same chord to its own
 * search and had worked each of them out separately.
 *
 * Each platform answers to its own chord alone. Accepting both everywhere
 * would take Ctrl+K from macOS text fields, where it deletes to the end of the
 * line — a shortcut that steals an editing key is a keyboard trap in small.
 *
 * Browser-only: the platform is read from `navigator`, which a server render
 * does not have. Call both from an effect or an event handler. A label
 * computed during render would say "Ctrl+K" on the server and "⌘K" on a Mac,
 * and the hydration mismatch would be the least of it.
 */

export interface ShortcutLabel {
  /** As the reader sees it: "⌘K" or "Ctrl+K". */
  label: string;
  /** As `aria-keyshortcuts` spells it: "Meta+K" or "Control+K". */
  aria: string;
}

function isApple(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Mac|iPhone|iPad|iPod/.test(navigator.platform);
}

/**
 * Whether `event` is the platform's chord for `key`, a single character.
 *
 * The letter is matched where the layout types Latin letters, so AZERTY and
 * Dvorak answer to the key marked with it. Where it does not, the physical key
 * is the fallback: with a Greek layout active `key` for the K position is κ,
 * and this audience types Greek. Shift and Alt disqualify, so the chord does
 * not swallow a neighbouring shortcut an application or the browser owns.
 */
export function isShortcut(event: KeyboardEvent, key: string): boolean {
  if (event.altKey || event.shiftKey) return false;
  const want = key.toLowerCase();
  const got = event.key.toLowerCase();
  const letter = /^[a-z]$/.test(want);
  const matches =
    got === want || (letter && !/^[a-z]$/.test(got) && event.code === `Key${want.toUpperCase()}`);
  if (!matches) return false;
  return isApple() ? event.metaKey && !event.ctrlKey : event.ctrlKey && !event.metaKey;
}

/** The platform's chord for `key`, for the screen and for `aria-keyshortcuts`. */
export function shortcutLabel(key: string): ShortcutLabel {
  const shown = key.toUpperCase();
  return isApple()
    ? { label: `⌘${shown}`, aria: `Meta+${shown}` }
    : { label: `Ctrl+${shown}`, aria: `Control+${shown}` };
}
