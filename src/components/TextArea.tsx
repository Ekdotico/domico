'use client';

import { forwardRef, useEffect, useId, useState, type ReactNode, type TextareaHTMLAttributes } from 'react';
import { FieldShell, describedBy, errorId, hintId, type FieldProps } from './Field.js';

/**
 * A multi-line field, with an optional count against a maximum.
 *
 *   <TextArea
 *     id="message"
 *     name="message"
 *     label="Message"
 *     rows={6}
 *     maximum={4000}
 *     remainingLabel={(n) =>
 *       n >= 0 ? `${n} characters remaining` : `${-n} characters over the limit`}
 *   />
 *
 * A native `<textarea>`; its attributes pass through. With `maximum`, the
 * number remaining is shown under the field, in the words `remainingLabel`
 * returns: the package counts and the application phrases, plural and all.
 *
 * The count is two elements. The one on screen changes with every keystroke
 * and is hidden from a screen reader, which would otherwise read a number per
 * character typed. The other is a polite live region that follows a second
 * after typing stops, and is what the field is described by, so the count is
 * also read when the field takes focus.
 *
 * `maximum` does not set `maxlength`. That attribute truncates a paste without
 * a word, at the moment a reader is least likely to notice what was lost. Past
 * the maximum the field is marked invalid and the count goes negative; the
 * application's `error` says what to do, and its server refuses the excess.
 *
 * **A counted field needs a client parent.** `remainingLabel` is a function,
 * and a Server Component cannot pass a function to a client one: render a
 * `TextArea` with `maximum` from a file that is itself `'use client'`. Without
 * `maximum` it takes nothing but serialisable props and renders from either.
 *
 * `ref` reaches the textarea.
 *
 * The count is the length of the value as the browser holds it. A server that
 * trims, or counts a line break as two characters, can differ by a few at the
 * boundary, and is the authority when it does.
 */
type CountProps =
  | {
      /** The most characters the field takes. */
      maximum: number;
      /** The count, in words. Called with the number remaining, negative when over. */
      remainingLabel: (remaining: number) => ReactNode;
    }
  | { maximum?: undefined; remainingLabel?: undefined };

/** How long typing has to stop before the count is announced. */
const ANNOUNCE_AFTER_MS = 1000;

export const TextArea = forwardRef<
  HTMLTextAreaElement,
  FieldProps &
    CountProps &
    Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'placeholder' | 'aria-invalid' | 'children' | 'maxLength'>
>(function TextArea(
  {
    label,
    hint,
    error,
    id,
    className,
    maximum,
    remainingLabel,
    onChange,
    'aria-describedby': describedby,
    ...textarea
  },
  ref,
) {
  const ownId = useId();
  const fieldId = id ?? ownId;
  const countId = `${fieldId}-count`;

  const { value, defaultValue } = textarea;
  const [ownLength, setOwnLength] = useState(typeof defaultValue === 'string' ? defaultValue.length : 0);
  const length = typeof value === 'string' ? value.length : ownLength;

  const [announced, setAnnounced] = useState(length);
  useEffect(() => {
    const timer = setTimeout(() => setAnnounced(length), ANNOUNCE_AFTER_MS);
    return () => clearTimeout(timer);
  }, [length]);

  const counted = maximum !== undefined;
  const over = counted && length > maximum;

  return (
    <FieldShell id={fieldId} label={label} hint={hint} error={error} className={className}>
      <textarea
        {...textarea}
        ref={ref}
        id={fieldId}
        className="ekd-field-input"
        aria-invalid={error != null || over || undefined}
        aria-describedby={describedBy(
          hint != null && hintId(fieldId),
          counted && countId,
          error != null && errorId(fieldId),
          describedby,
        )}
        onChange={(event) => {
          setOwnLength(event.target.value.length);
          onChange?.(event);
        }}
      />
      {counted ? (
        <>
          <p className="ekd-field-count" data-over={over || undefined} aria-hidden="true">
            {remainingLabel(maximum - length)}
          </p>
          <p id={countId} className="sr-only" aria-live="polite">
            {remainingLabel(maximum - announced)}
          </p>
        </>
      ) : null}
    </FieldShell>
  );
});
