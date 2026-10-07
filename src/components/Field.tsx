import type { ReactNode } from 'react';

/**
 * What every labelled control shares: the label, the hint, and the message.
 *
 * Internal. `TextField`, `PasswordField`, `OneTimeCodeField` and `TextArea` are
 * each this shell round a different native control, so the order on screen and
 * the ids the control is described by are decided once.
 *
 * - The label is visible and is a `<label for>`. There is no placeholder
 *   standing in for it: the field types leave `placeholder` out, because a
 *   placeholder is gone at the first keystroke and the only inks that pass on
 *   `--bg-inset` in all eight palettes are the ones a typed value uses.
 * - The hint sits between the label and the control, so it is read before the
 *   field is reached rather than discovered after it.
 * - The message sits under the control and is not `role="alert"`. The fault at
 *   the head of the form is the one announcement (`FormFault`); a form with
 *   three faults would otherwise speak four times. The control names the
 *   message through `aria-describedby`, so it is read when the field is.
 * - The package draws no asterisk. Whether a field is required is said in the
 *   label or the hint, in the application's words; `required` on the control
 *   says it to a screen reader.
 */
export interface FieldProps {
  /** The visible label. */
  label: ReactNode;
  /** What to enter, where the label alone does not say. Read before the field. */
  hint?: ReactNode;
  /** What is at fault and what to do next. Marks the control invalid. */
  error?: ReactNode;
}

/** The ids that exist, space-separated, or nothing: an empty attribute names no element. */
export function describedBy(...ids: Array<string | false | null | undefined>): string | undefined {
  return ids.filter(Boolean).join(' ') || undefined;
}

export const hintId = (id: string) => `${id}-hint`;
export const errorId = (id: string) => `${id}-error`;

export function FieldShell({
  id,
  label,
  hint,
  error,
  className,
  children,
}: FieldProps & {
  /** The control's id. The hint and the message derive theirs from it. */
  id: string;
  className?: string;
  /** The control, and anything that belongs directly under it. */
  children: ReactNode;
}) {
  return (
    <div className={['ekd-field', className].filter(Boolean).join(' ')}>
      <label htmlFor={id} className="ekd-field-label">
        {label}
      </label>
      {hint != null ? (
        <p id={hintId(id)} className="ekd-field-hint">
          {hint}
        </p>
      ) : null}
      {children}
      {error != null ? (
        <p id={errorId(id)} className="ekd-field-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
