'use client';

import { forwardRef, useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { FieldShell, describedBy, errorId, hintId } from './Field.js';
import type { TextFieldProps } from './TextField.js';

/**
 * A password field that can show what is typed.
 *
 *   <PasswordField
 *     id="password"
 *     name="password"
 *     label="Password"
 *     toggleLabel="Show password"
 *     autoComplete="current-password"
 *     required
 *   />
 *
 * The toggle is a real `<button type="button">` beside the field, after it in
 * the Tab order, with `aria-pressed` for its state. `toggleLabel` is its one
 * name and does not change when it is pressed: a control that is both renamed
 * and marked pressed is announced as "Hide password, pressed", which says the
 * opposite of what is on screen. The package has no default for it, because no
 * application had a field like this for one to be shared.
 *
 * `autoComplete` is required, and is one of the two values a password manager
 * acts on: `current-password` to fill, `new-password` to offer a generated one.
 *
 * The field goes back to hidden when its form is submitted, so a browser does
 * not keep a password it met as plain text among its remembered entries.
 *
 * `ref` reaches the input, as on `TextField`.
 */
export const PasswordField = forwardRef<
  HTMLInputElement,
  Omit<TextFieldProps, 'type' | 'autoComplete'> & {
    /** The toggle's name, such as "Show password". The same in both states. */
    toggleLabel: ReactNode;
    autoComplete: 'current-password' | 'new-password';
  }
>(function PasswordField(
  { label, hint, error, id, className, toggleLabel, 'aria-describedby': describedby, ...input },
  ref,
) {
  const ownId = useId();
  const fieldId = id ?? ownId;
  const [shown, setShown] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const form = inputRef.current?.form;
    if (!form) return;
    const hide = () => setShown(false);
    form.addEventListener('submit', hide);
    return () => form.removeEventListener('submit', hide);
  }, []);

  return (
    <FieldShell id={fieldId} label={label} hint={hint} error={error} className={className}>
      <div className="ekd-field-row">
        <input
          spellCheck={false}
          autoCapitalize="none"
          {...input}
          // One element, two holders: the field needs it to find its form, and
          // the application may have asked for it too.
          ref={(element) => {
            inputRef.current = element;
            if (typeof ref === 'function') ref(element);
            else if (ref) ref.current = element;
          }}
          id={fieldId}
          type={shown ? 'text' : 'password'}
          className="ekd-field-input"
          aria-invalid={error != null || undefined}
          aria-describedby={describedBy(
            hint != null && hintId(fieldId),
            error != null && errorId(fieldId),
            describedby,
          )}
        />
        <button
          type="button"
          className="ekd-field-toggle"
          aria-pressed={shown}
          aria-controls={fieldId}
          onClick={() => setShown((value) => !value)}
        >
          {toggleLabel}
        </button>
      </div>
    </FieldShell>
  );
});
