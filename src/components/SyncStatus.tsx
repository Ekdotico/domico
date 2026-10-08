'use client';

import { useEffect, useRef, useState, type HTMLAttributes, type MouseEventHandler } from 'react';
import { CircleAlertIcon, CircleCheckIcon, RefreshCwIcon } from './icons.js';

/**
 * Whether the document on screen is the document on the server.
 *
 *   <SyncStatus state="synced" label="Saved" onClick={verify} />
 *   <SyncStatus state="syncing" label="Saving…" onClick={verify} />
 *   <SyncStatus state="syncing" label="Reconnecting. Your changes are kept and are sent when the connection returns." onClick={verify} />
 *   <SyncStatus state="error" label="Not connected. Editing is paused." onClick={verify} />
 *
 * Exactly three states, `synced`, `syncing` and `error`, and each is a mark
 * and words together. `label` is the words and the application writes them:
 * the package has no default, because what a state means to a writer — that
 * unsent changes are lost if the tab is closed, that the editor is read-only —
 * is the application's to say. A connection being restored is `syncing` with
 * words that say so. The mark's shape says the state a second time, and the
 * colour a third; no state is carried by colour alone.
 *
 * With `onClick` it is a button, named by its label, for an application that
 * lets a person press the indicator to check the working version against the
 * server. Without one it is text. Its other attributes pass through to that
 * element, so a `Tooltip` can describe it.
 *
 * **It is announced when it settles, not when it changes.** A document that
 * is being typed in goes from synced to syncing and back with every pause, and
 * a live region that followed it would speak over the writer at each one. So
 * the words on screen follow the state at once, and a separate polite status
 * region follows `announceAfterMs` after the label last changed, and only if
 * the label is then different from the last one a screen reader was given. A
 * save that completes inside that interval is never spoken. A connection that
 * stays lost is, and so is its return. Nothing is announced when the page
 * loads: the state a document opens in is not news.
 *
 * `announceAfterMs` is 1500 unless the application says otherwise. Raise it
 * if a slow connection makes an ordinary save outlast it.
 *
 * Syncing pulses the mark, by opacity; nothing moves. A reader who asks for
 * reduced motion gets the mark at rest.
 *
 * Styles ship in `@ekdotico/domico/styles/sync-status.css`.
 */
export type SyncState = 'synced' | 'syncing' | 'error';

const MARK = { synced: CircleCheckIcon, syncing: RefreshCwIcon, error: CircleAlertIcon } as const;

export function SyncStatus({
  state,
  label,
  onClick,
  announceAfterMs = 1500,
  className,
  ...control
}: Omit<HTMLAttributes<HTMLElement>, 'children' | 'role' | 'aria-live' | 'onClick'> & {
  state: SyncState;
  /** The state in words. Shown beside the mark, and announced once it has settled. */
  label: string;
  /** Makes the indicator a button. */
  onClick?: MouseEventHandler<HTMLButtonElement>;
  /** How long the label must stand before a screen reader is told, in milliseconds. */
  announceAfterMs?: number;
}) {
  // What a screen reader was last given. The label the page opened with
  // counts: it is read in its place and is not announced.
  const said = useRef(label);
  const [announced, setAnnounced] = useState('');

  useEffect(() => {
    if (label === said.current) return;
    const timer = setTimeout(() => {
      said.current = label;
      setAnnounced(label);
    }, announceAfterMs);
    return () => clearTimeout(timer);
  }, [label, announceAfterMs]);

  const Mark = MARK[state];
  const content = (
    <>
      <span className="ekd-sync-mark">
        <Mark />
      </span>
      <span className="ekd-sync-label">{label}</span>
    </>
  );

  return (
    <span className={['ekd-sync', className].filter(Boolean).join(' ')} data-state={state}>
      {onClick ? (
        <button {...(control as HTMLAttributes<HTMLButtonElement>)} type="button" className="ekd-sync-control" onClick={onClick}>
          {content}
        </button>
      ) : (
        <span {...control} className="ekd-sync-control">
          {content}
        </span>
      )}
      <span className="ekd-sync-announce" role="status">
        {announced}
      </span>
    </span>
  );
}
