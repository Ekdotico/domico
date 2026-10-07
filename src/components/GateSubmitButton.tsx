'use client';

import type { ReactNode } from 'react';
import { PendingButton } from './Button.js';

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
 * The behaviour is `Button`'s, which was generalised from this one: the
 * `aria-disabled` click guard that keeps focus where it was, the polite live
 * label, and `pending` read from `useFormStatus` under React 19 or passed in.
 * `Button` records the reasons. What stays here is the gate's: the class
 * `access-gate.css` styles, so an application that imports the gate's
 * stylesheet alone still gets its button, and the two default labels.
 */
export function GateSubmitButton({
  children = 'Unlock',
  pendingLabel = 'Checking the code…',
  pending,
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
  return (
    <PendingButton
      type="submit"
      className={['unlock-button', className].filter(Boolean).join(' ')}
      pendingLabel={pendingLabel}
      pending={pending}
    >
      {children}
    </PendingButton>
  );
}
