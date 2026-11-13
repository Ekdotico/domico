'use client';

import * as ReactDOM from 'react-dom';
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';

/**
 * A button, in four variants, which can report an operation in flight.
 *
 *   <Button variant="primary" type="submit" pendingLabel="Signing in…">Sign in</Button>
 *   <Button onClick={close}>Cancel</Button>
 *   <Button variant="destructive" onClick={remove}>Delete account</Button>
 *
 * A native `<button>`; its attributes pass through. `type` defaults to
 * `button`, not to the platform's `submit`, so a button dropped into a form
 * does not submit it by accident.
 *
 * - `primary` is the accent, and there is one per view.
 * - `secondary`, the default, is a hairline at control contrast.
 * - `quiet` has no boundary at rest, for an action beside the main ones.
 * - `destructive` takes the danger hairline. Its label names what is removed:
 *   "Delete account", not "Delete".
 *
 * The pending state is the one `GateSubmitButton` has always had, moved here
 * so that button is this one with the gate's class and defaults.
 *
 * `aria-disabled` and a click guard rather than `disabled`, from praktico's
 * gate. The button holds focus at the moment it is pressed, and disabling a
 * focused element drops focus to <body> in every engine: the reader lost their
 * place, and met the refusal message from the top of the document (WCAG 2.4.3).
 * The click guard also catches implicit submission: Enter in a field dispatches
 * a click on the form's submit button, and the guard cancels it.
 *
 * With a `pendingLabel` the label names the operation in progress, and the
 * button is `aria-live="polite"`, because a label changing on the focused
 * control is not reliably announced on its own. Without one the label stays
 * and the button is `aria-busy` alone.
 *
 * `pending` is read from `useFormStatus` where the installed React has it (19
 * and later), for a `type="submit"` button only: a Cancel button inside the
 * same form is not waiting on anything. Pass `pending` to override it — for a
 * form the button is not inside, for an operation that is not a form action,
 * or under React 18, where the hook does not exist.
 *
 * `disabled` still passes through, for an action that is unavailable rather
 * than in flight. Prefer saying why beside the button to disabling it.
 *
 * Navigation is `ButtonLink`, below; an action is `Button`.
 *
 * Styles ship in `@ekdotico/domico/styles/button.css`.
 */

type FormStatus = { pending: boolean };

// Read once, at module scope, so every render calls the same hook — or none.
// `import * as` rather than a named import: under React 18 the name is absent,
// and a named import of a missing binding is an error in a strict ES module.
const useFormStatus: () => FormStatus =
  (ReactDOM as unknown as { useFormStatus?: () => FormStatus }).useFormStatus ??
  (() => ({ pending: false }));

export type ButtonVariant = 'primary' | 'secondary' | 'quiet' | 'destructive';

type PendingButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-disabled' | 'aria-busy'> & {
  /** The label while the operation is in flight: the operation, named. */
  pendingLabel?: ReactNode;
  /** Overrides the form status. */
  pending?: boolean;
};

/**
 * The behaviour without the skin. Internal: `Button` and `GateSubmitButton`
 * are this with a class each, so the pending state is written once.
 */
export function PendingButton({
  type = 'button',
  pendingLabel,
  pending: pendingOverride,
  onClick,
  children,
  ...button
}: PendingButtonProps) {
  const status = useFormStatus();
  const pending = pendingOverride ?? (type === 'submit' && status.pending);
  return (
    <button
      // Before the spread, so an `aria-live` the application sets is kept.
      aria-live={pendingLabel != null ? 'polite' : undefined}
      {...button}
      type={type}
      aria-disabled={pending || undefined}
      aria-busy={pending || undefined}
      onClick={(event) => {
        if (pending) {
          event.preventDefault();
          return;
        }
        onClick?.(event);
      }}
    >
      {pending && pendingLabel != null ? pendingLabel : children}
    </button>
  );
}

export function Button({
  variant = 'secondary',
  className,
  ...button
}: PendingButtonProps & {
  variant?: ButtonVariant;
}) {
  return (
    <PendingButton
      {...button}
      className={['ekd-button', className].filter(Boolean).join(' ')}
      data-variant={variant}
    />
  );
}

/**
 * A link that looks like a button: for navigation, not for an action.
 *
 *   <ButtonLink variant="primary" href="/apply">Apply</ButtonLink>
 *   <ButtonLink href="https://example.org/form" target="_blank" rel="noreferrer">Open the form</ButtonLink>
 *
 * A native `<a>`; its attributes pass through, and `href` is required. It takes
 * the same four variants and the same `.ekd-button` skin as `Button`, so the
 * two sit side by side at one height. If the control changes state on the page
 * (saves, deletes, opens a dialog), use `Button`: a link that does that is
 * announced as a link and does not respond to Space.
 *
 * There is no pending or disabled state: a link that is not available is not
 * rendered, or is text with the reason beside it.
 *
 * The stylesheet keeps the colour, background, border and no-underline of the
 * skin in every state (`:link`, `:visited`, `:hover`, `:active`,
 * `:focus-visible`) against an application's own link rules, up to a
 * specificity of (0,2,1) and without `!important`. Do not put `.ekd-button` on
 * an `<a>` yourself; use this.
 *
 * Height is the same as `Button`'s, about 40px. WCAG 2.5.8 asks for 24px; an
 * application that wants 44px adds `padding-block` to its own class.
 *
 * Styles ship in `@ekdotico/domico/styles/button.css`.
 */
export function ButtonLink({
  variant = 'secondary',
  className,
  ...link
}: AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  variant?: ButtonVariant;
}) {
  return (
    <a
      {...link}
      className={['ekd-button', className].filter(Boolean).join(' ')}
      data-variant={variant}
    />
  );
}
