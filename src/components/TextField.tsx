import { useId, type InputHTMLAttributes } from 'react';
import { FieldShell, describedBy, errorId, hintId, type FieldProps } from './Field.js';

/**
 * A single-line field with a visible label, an optional hint, and a message.
 *
 *   <TextField
 *     id="email"
 *     name="email"
 *     type="email"
 *     label="Email address"
 *     autoComplete="username"
 *     required
 *     error={fault.email}
 *   />
 *
 * A native `<input>`, and every attribute it takes passes through: `name`,
 * `type`, `autoComplete`, `required`, `disabled`, `defaultValue`, `value` with
 * `onChange`. Server-safe: it holds no state, so a server component renders it
 * inside a form with a server action.
 *
 * `error` marks the field `aria-invalid` and is named by `aria-describedby`,
 * with the hint, so both are read when the field takes focus. Pass `id` where a
 * `FormFault` links to the field; without one the field makes its own.
 *
 * `className` lands on the wrapper, which is what an application places.
 *
 * Styles ship in `@ekdotico/domico/styles/form.css`.
 */
export type TextFieldProps = FieldProps &
  Omit<InputHTMLAttributes<HTMLInputElement>, 'placeholder' | 'aria-invalid' | 'children'>;

export function TextField({
  label,
  hint,
  error,
  id,
  className,
  'aria-describedby': describedby,
  ...input
}: TextFieldProps) {
  const ownId = useId();
  const fieldId = id ?? ownId;
  return (
    <FieldShell id={fieldId} label={label} hint={hint} error={error} className={className}>
      <input
        type="text"
        {...input}
        id={fieldId}
        className="ekd-field-input"
        aria-invalid={error != null || undefined}
        aria-describedby={describedBy(
          hint != null && hintId(fieldId),
          error != null && errorId(fieldId),
          describedby,
        )}
      />
    </FieldShell>
  );
}

/**
 * The field for a one-time code: the second step of a sign-in, a confirmation.
 *
 *   <OneTimeCodeField id="code" name="code" label="Six-digit code" error={fault.code} />
 *
 * One input, not a box per digit. A row of boxes is six fields to a screen
 * reader and breaks paste, the phone's own code suggestion, and a password
 * manager, each of which hands over the whole code at once.
 *
 * `autoComplete="one-time-code"` lets a phone offer the code it has just
 * received, `inputMode="numeric"` asks for the keypad, and the `pattern` is
 * exactly `digits` digits. The same three `AccessGate` sets on its own field.
 * The server decides whether the code is right; put `noValidate` on the form if
 * the browser's own bubble is not wanted.
 */
export function OneTimeCodeField({
  digits = 6,
  ...field
}: Omit<TextFieldProps, 'type' | 'inputMode' | 'pattern' | 'maxLength' | 'autoComplete'> & {
  /** How many digits the code has. */
  digits?: number;
}) {
  const count = Number.isInteger(digits) && digits > 0 ? digits : 6;
  return (
    <TextField
      {...field}
      type="text"
      inputMode="numeric"
      autoComplete="one-time-code"
      pattern={`[0-9]{${count}}`}
      maxLength={count}
      spellCheck={false}
      data-code=""
    />
  );
}
