'use client';

import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import type { ElementRef } from '../a11y/useModalSurface.js';
import { XIcon } from './icons.js';

/**
 * A modal dialog over the current page.
 *
 *   const [open, setOpen] = useState(false);
 *
 *   <Button onClick={() => setOpen(true)}>Send feedback</Button>
 *   <Dialog open={open} onClose={() => setOpen(false)} title="Send feedback" closeLabel="Close">
 *     <form action={send}>…</form>
 *   </Dialog>
 *
 * The native `<dialog>`, opened with `showModal()`, and that is where the
 * modal promise is kept: the platform puts the dialog in the top layer, makes
 * everything outside it inert, keeps Tab inside, closes on Escape, and returns
 * focus to the element that held it. `useModalSurface` exists for a surface
 * that is not a `<dialog>` — the navigation drawer — and is not used here,
 * because two focus traps on one surface is one too many. No `aria-modal`
 * either: `showModal()` already says it.
 *
 * The application owns `open`, and the dialog on screen follows it. Escape,
 * the close button, and a `<form method="dialog">` inside all call `onClose`;
 * the dialog closes when `open` becomes false. `onClose` is expected to do
 * that. Where it does not — a dialog that asks before discarding unsent work —
 * the dialog stays, and one the platform has already closed is shown again,
 * because an engine may close on a second Escape whatever a page says, and a
 * dialog that is closed while its owner says open could never be opened.
 *
 * It is named by its heading, through `aria-labelledby`. The heading is an
 * `h2` unless `headingLevel` says otherwise. `aria-describedby` passes through,
 * for a confirmation whose one sentence should be read with the name.
 *
 * On opening, focus goes where the platform puts it: the first control inside.
 * Pass `initialFocusRef` to choose — the first field of a form, or the least
 * destructive button of a confirmation. On closing, focus returns to whatever
 * held it when the dialog opened. The platform does that for `close()`; the
 * component does it again for the cases the platform does not cover, an
 * unmount while open among them, and never moves focus the application has
 * already placed somewhere else.
 *
 * `closeLabel` renders a close button in the header, named by it. Leave it out
 * for a confirmation whose own buttons are the only ways forward; the dialog
 * then owes a button of its own that calls `onClose`, because Escape is not a
 * way out on a phone.
 *
 * The children stay mounted while the dialog is closed, so a message half
 * written survives an accidental Escape. Give the form a `key` to clear it
 * after it is sent.
 *
 * Nothing here closes on a press outside. A press that misses the dialog by a
 * few pixels would discard what was typed into it.
 *
 * Styles ship in `@ekdotico/domico/styles/dialog.css`.
 */
export function Dialog({
  open,
  onClose,
  title,
  children,
  closeLabel,
  headingLevel = 2,
  initialFocusRef,
  id,
  className,
  'aria-describedby': describedby,
}: {
  /** Whether the dialog is open. The application holds this. */
  open: boolean;
  /** Called when the reader asks to close: Escape, the close button, a `method="dialog"` form. Set `open` to false in it. */
  onClose: () => void;
  /** The heading. It names the dialog. */
  title: ReactNode;
  children: ReactNode;
  /** The close button's accessible name, such as "Close". Without it there is no close button. */
  closeLabel?: string;
  headingLevel?: 2 | 3 | 4;
  /** Where focus lands on opening. Defaults to the first control inside. */
  initialFocusRef?: ElementRef<HTMLElement>;
  id?: string;
  className?: string;
  /** The id of an element inside that describes the dialog. */
  'aria-describedby'?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const Heading = `h${headingLevel}` as 'h2';

  // Read when the dialog opens, not listed as a dependency: a ref written
  // inline is a new object every render, and re-running the effect for it
  // would close the dialog and open it again.
  const focusRef = useRef(initialFocusRef);
  useEffect(() => {
    focusRef.current = initialFocusRef;
  });

  // close() fires its `close` event from a queued task, so the event arrives
  // after the code that called it has moved on — after React has run the
  // effect again under StrictMode, with `open` true once more. Counting the
  // closes this component made is how the handler tells its own from the
  // platform's. A count and not a flag: two can be queued at once.
  const ownCloses = useRef(0);
  // Bumped when the platform closed a dialog whose owner still says open, to
  // run the effect again and show it.
  const [shown, setShown] = useState(0);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog || !open) return;
    const doc = dialog.ownerDocument;
    // Captured before showModal() moves focus, so it is the element the reader left.
    const opener = doc.activeElement instanceof HTMLElement ? doc.activeElement : null;
    if (!dialog.open) dialog.showModal();
    focusRef.current?.current?.focus();

    return () => {
      if (dialog.open) {
        ownCloses.current++;
        dialog.close();
      }
      const active = doc.activeElement;
      const stranded = !active || active === doc.body || dialog.contains(active);
      if (stranded && opener?.isConnected) opener.focus();
    };
  }, [open, shown]);

  return (
    <dialog
      ref={ref}
      id={id}
      className={['ekd-dialog', className].filter(Boolean).join(' ')}
      aria-labelledby={titleId}
      aria-describedby={describedby}
      onCancel={(event) => {
        // `cancel` bubbles in some engines, from a file picker or a dialog
        // nested inside. Only this dialog's own is its Escape.
        if (event.target !== event.currentTarget) return;
        // The application decides, so the platform's own close waits.
        event.preventDefault();
        onClose();
      }}
      onClose={(event) => {
        if (event.target !== event.currentTarget) return;
        if (ownCloses.current > 0) {
          ownCloses.current--;
          return;
        }
        if (!open) return;
        // The platform closed it. Ask, and then follow `open` whatever the
        // answer: if it is still true after this, the effect shows the dialog.
        onClose();
        setShown((count) => count + 1);
      }}
    >
      <div className="ekd-dialog-header">
        <Heading id={titleId} className="ekd-dialog-title">
          {title}
        </Heading>
        {closeLabel != null ? (
          <button type="button" className="ekd-dialog-close" aria-label={closeLabel} onClick={onClose}>
            <XIcon size={18} />
          </button>
        ) : null}
      </div>
      <div className="ekd-dialog-body">{children}</div>
    </dialog>
  );
}
