'use client';

import { useEffect, useId, useRef, type ReactNode } from 'react';
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
 * The application owns `open`. Escape, the close button, and a
 * `<form method="dialog">` inside all call `onClose` and close nothing
 * themselves, so a dialog holding unsent work can decline — or ask first — by
 * leaving `open` as it is. An engine that closes the dialog regardless (a
 * second Escape in a row, in Chromium) is followed: `onClose` is called then
 * too.
 *
 * It is named by its heading, through `aria-labelledby`. The heading is an
 * `h2` unless `headingLevel` says otherwise.
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
}: {
  /** Whether the dialog is open. The application holds this. */
  open: boolean;
  /** Called when the reader asks to close: Escape, the close button, a `method="dialog"` form. */
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
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const Heading = `h${headingLevel}` as 'h2';

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog || !open) return;
    const doc = dialog.ownerDocument;
    // Captured before showModal() moves focus, so it is the element the reader left.
    const opener = doc.activeElement instanceof HTMLElement ? doc.activeElement : null;
    if (!dialog.open) dialog.showModal();
    initialFocusRef?.current?.focus();

    return () => {
      if (dialog.open) dialog.close();
      const active = doc.activeElement;
      const stranded = !active || active === doc.body || dialog.contains(active);
      if (stranded && opener?.isConnected) opener.focus();
    };
  }, [open, initialFocusRef]);

  return (
    <dialog
      ref={ref}
      id={id}
      className={['ekd-dialog', className].filter(Boolean).join(' ')}
      aria-labelledby={titleId}
      onCancel={(event) => {
        // Escape. The application decides, so the platform's own close waits.
        event.preventDefault();
        onClose();
      }}
      onClose={() => {
        // The platform closed it anyway. `open` still says otherwise, so ask.
        if (open) onClose();
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
