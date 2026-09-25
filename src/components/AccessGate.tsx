import type { ReactNode } from 'react';
import { GateSubmitButton } from './GateSubmitButton.js';

/**
 * The passcode form a pre-release site shows in place of itself.
 *
 *   <AccessGate
 *     eyebrow="Ekdotico"
 *     title="Enter the access code"
 *     lede="This site is restricted while it is in development."
 *     contact={<>If you do not have a code, write to <a href="mailto:…">…</a>.</>}
 *     digits={4}
 *     action={submitPasscode}
 *     error={wrong ? 'The access code is incorrect. Check the code and enter it again.' : undefined}
 *     from={from}
 *   />
 *
 * Presentational and server-safe: it holds no state and calls no hook, so a
 * server component renders it with a server action. The one client piece is
 * `GateSubmitButton`, which it renders. A client component driving the form
 * with `useActionState` passes the dispatch as `action` and the state's message
 * as `error`.
 *
 * Every word on the screen is the application's. The package supplies three
 * defaults, each shared by all three gates it replaces — the field label
 * "Access code", and the button's "Unlock" and "Checking the code…" — and
 * nothing else, because the terms of access, the contact, and the refusal
 * wording are the application's to state.
 *
 * Built from deree's two gates and praktico's:
 *
 * - The page's own `<main>`, not a dialog. Nothing opened the gate and nothing
 *   dismisses it, so a dialog role would be a promise about the keyboard with
 *   nothing to be true about. The gate is the page, so it renders the landmark,
 *   and an application renders it outside any layout that has one of its own.
 * - Top-aligned with an auto block margin, so a card taller than the viewport —
 *   200% zoom, a large default font, a phone with the keyboard open — grows
 *   into scroll rather than off the top edge.
 * - `aria-describedby` names the message actually on screen, whichever it is.
 *   The copies it replaces named the error only, so the rate-limit refusal was
 *   rendered and described nothing.
 * - `error` marks the field invalid. `notice` is for a refusal that is not a
 *   judgement on what was typed — a rate limit — so it is announced but the
 *   field is not marked invalid. When both are passed only `notice` renders: a
 *   code that was never checked was not incorrect.
 * - `autoComplete="one-time-code"`, so a phone offers a code it has just
 *   received, and `inputMode="numeric"` with a `pattern` of exactly `digits`
 *   digits for the keypad. The form is `noValidate`: the server decides.
 *
 * Styles ship in `@ekdotico/domico/styles/access-gate.css`.
 */
export function AccessGate({
  eyebrow,
  title,
  lede,
  contact,
  label = 'Access code',
  digits = 4,
  action,
  error,
  notice,
  from,
  idPrefix = 'access',
  submitLabel,
  pendingLabel,
  pending,
}: {
  /** A short line above the title, naming the site or the area. */
  eyebrow?: ReactNode;
  /** The page's one heading. */
  title: ReactNode;
  /** What is restricted and what the code does. */
  lede: ReactNode;
  /** Who to write to for a code. Its own paragraph, under the lede. */
  contact?: ReactNode;
  /** The field's label. */
  label?: string;
  /** How many digits the code has. */
  digits?: number;
  /** The form action: a server action, or a `useActionState` dispatch. */
  action: string | ((formData: FormData) => void | Promise<void>);
  /** The refusal of a wrong code. Marks the field invalid. */
  error?: ReactNode;
  /** A refusal that says nothing about the code, such as a rate limit. */
  notice?: ReactNode;
  /** Where to return after unlocking. Sent as the hidden field `from`. */
  from?: string;
  /** Prefixes the field's and the message's ids, for two gates in one tree. */
  idPrefix?: string;
  /** The button's label at rest. Defaults to "Unlock". */
  submitLabel?: ReactNode;
  /** The button's label in flight. Defaults to "Checking the code…". */
  pendingLabel?: ReactNode;
  /** Overrides the button's reading of the form status. */
  pending?: boolean;
}) {
  const fieldId = `${idPrefix}-code`;
  const messageId = `${idPrefix}-message`;
  const count = Number.isInteger(digits) && digits > 0 ? digits : 4;

  const message = notice ?? error;
  const invalid = notice == null && error != null;

  return (
    <div className="unlock-overlay">
      <main className="unlock-card">
        {eyebrow != null ? <p className="unlock-eyebrow">{eyebrow}</p> : null}
        <h1 className="unlock-title">{title}</h1>
        <p className="unlock-lede">{lede}</p>
        {contact != null ? <p className="unlock-lede unlock-contact">{contact}</p> : null}

        {/* The cast is for React 18's types, which predate function actions;
            React 19, which every application here runs, accepts both. */}
        <form action={action as string} className="unlock-form" noValidate>
          {from !== undefined ? <input type="hidden" name="from" value={from} /> : null}
          <label htmlFor={fieldId} className="unlock-label">
            {label}
          </label>
          <input
            id={fieldId}
            name="code"
            type="text"
            inputMode="numeric"
            pattern={`[0-9]{${count}}`}
            maxLength={count}
            autoComplete="one-time-code"
            spellCheck={false}
            autoFocus
            required
            aria-invalid={invalid || undefined}
            aria-describedby={message != null ? messageId : undefined}
            className="unlock-input"
          />
          {message != null ? (
            <p id={messageId} className="unlock-error" role="alert">
              {message}
            </p>
          ) : null}
          <GateSubmitButton pendingLabel={pendingLabel} pending={pending}>
            {submitLabel}
          </GateSubmitButton>
        </form>
      </main>
    </div>
  );
}
