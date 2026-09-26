'use client';

import * as ReactDOM from 'react-dom';
import type { ReactNode } from 'react';

/**
 * The submit button of an `AccessGate`, which reports its own in-flight state.
 *
 *   <GateSubmitButton />                                   // "Unlock", then "Checking the code…"
 *   <GateSubmitButton pendingLabel="Checking the code…">Continue</GateSubmitButton>
 *
 * The one client boundary in the gate, so the rest of it can render on the
 * server. While the form's action is in flight the label names the operation
 * in progress — the check, not the unlock, which is what happens if the check
 * passes — and the button refuses a second press.
 *
 * `aria-disabled` and a click guard rather than `disabled`, from praktico's
 * gate. The button holds focus at the moment it is pressed, and disabling a
 * focused element drops focus to <body> in every engine: the reader lost their
 * place, and met the refusal message from the top of the document (WCAG 2.4.3).
 * The documentation site and deree used `disabled` and patched the announcement
 * back with a live region; keeping focus where it was makes the patch a
 * reinforcement rather than the only thing speaking. The click guard also
 * catches implicit submission: Enter in the field dispatches a click on this
 * button, and the guard cancels it.
 *
 * `aria-live="polite"` stays, from the public sites. A label changing on the
 * focused control is not reliably announced on its own.
 *
 * `pending` is read from `useFormStatus` where the installed React has it (19
 * and later), which covers a server action and a `useActionState` dispatch
 * alike. Pass `pending` to override it — for a form the button is not inside,
 * or under React 18, where the hook does not exist and the button otherwise
 * never reports a pending state.
 */

type FormStatus = { pending: boolean };

// Read once, at module scope, so every render calls the same hook — or none.
// `import * as` rather than a named import: under React 18 the name is absent,
// and a named import of a missing binding is an error in a strict ES module.
const useFormStatus: () => FormStatus =
  (ReactDOM as unknown as { useFormStatus?: () => FormStatus }).useFormStatus ??
  (() => ({ pending: false }));

export function GateSubmitButton({
  children = 'Unlock',
  pendingLabel = 'Checking the code…',
  pending: pendingOverride,
  className,
}: {
  /** The label at rest. */
  children?: ReactNode;
  /** The label while the action is in flight: the operation, named. */
  pendingLabel?: ReactNode;
  /** Overrides the form status. */
  pending?: boolean;
  className?: string;
}) {
  const status = useFormStatus();
  const pending = pendingOverride ?? status.pending;
  return (
    <button
      type="submit"
      className={['unlock-button', className].filter(Boolean).join(' ')}
      aria-disabled={pending || undefined}
      aria-busy={pending || undefined}
      aria-live="polite"
      onClick={(event) => {
        if (pending) event.preventDefault();
      }}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}
