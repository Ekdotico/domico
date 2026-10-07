'use client';

import { useEffect, useId, useRef, type ReactNode } from 'react';

/**
 * The statement of a fault at the head of a form.
 *
 *   {state.faults.length > 0 ? (
 *     <FormFault
 *       title="The form has two faults"
 *       faults={[
 *         { fieldId: 'email', message: 'Enter an email address' },
 *         { fieldId: 'password', message: 'Enter a password' },
 *       ]}
 *       focusKey={state.attempt}
 *     />
 *   ) : null}
 *
 *   <FormFault title="The email address or the password is incorrect">
 *     <p>Check both and enter them again.</p>
 *   </FormFault>
 *
 * Render it when there is a fault and not before: it is `role="alert"`, and an
 * alert that is present from the first paint announces nothing.
 *
 * It is the one announcement a failed submission makes. The messages under the
 * fields are not alerts; each is read when its field is reached, and each link
 * here goes to one. A link moves focus into the field it names, rather than
 * scrolling to it and leaving focus on the link, which is what a fragment
 * alone does in some engines.
 *
 * Focus moves to the statement when it appears, and again whenever `focusKey`
 * changes — pass the attempt count, so a second failed submission is met from
 * the statement and not from wherever the button was. It is `tabIndex={-1}`: a
 * place focus is sent, not a stop in the Tab order. `autoFocus={false}` leaves
 * focus where it is, for a fault that arrives while the reader is typing.
 *
 * The title is a heading, `h2` unless `headingLevel` says otherwise, so the
 * statement can be found by heading as well as heard once. A fault that is not
 * about one field — a refused sign-in, a failed request — takes `children` and
 * no list.
 *
 * Styles ship in `@ekdotico/domico/styles/form.css`.
 */
export interface FormFaultItem {
  /** The id of the control at fault. The first radio of a `RadioGroup` carries the group's `id`. */
  fieldId: string;
  /** What is at fault, in the words the field's own message uses. */
  message: ReactNode;
}

export function FormFault({
  title,
  faults,
  children,
  headingLevel = 2,
  focusKey,
  autoFocus = true,
  id,
  className,
}: {
  /** What happened, as a heading. It names the statement. */
  title: ReactNode;
  /** The fields at fault, in the order they appear in the form. */
  faults?: readonly FormFaultItem[];
  /** What to do next, where the list does not say it. */
  children?: ReactNode;
  headingLevel?: 2 | 3 | 4;
  /** Moves focus to the statement again whenever it changes. Pass the attempt. */
  focusKey?: unknown;
  /** Whether focus moves to the statement at all. */
  autoFocus?: boolean;
  id?: string;
  className?: string;
}) {
  const titleId = useId();
  const ref = useRef<HTMLDivElement>(null);
  const Heading = `h${headingLevel}` as 'h2';

  useEffect(() => {
    if (autoFocus) ref.current?.focus();
  }, [autoFocus, focusKey]);

  return (
    <div
      ref={ref}
      id={id}
      className={['ekd-fault', className].filter(Boolean).join(' ')}
      role="alert"
      aria-labelledby={titleId}
      tabIndex={-1}
    >
      <Heading id={titleId} className="ekd-fault-title">
        {title}
      </Heading>
      {children != null ? <div className="ekd-fault-body">{children}</div> : null}
      {faults != null && faults.length > 0 ? (
        <ul className="ekd-fault-list">
          {faults.map((fault, index) => (
            // One field can have two faults, so its id alone is not a key.
            <li key={`${index}-${fault.fieldId}`}>
              <a
                href={`#${fault.fieldId}`}
                onClick={(event) => {
                  const field = document.getElementById(fault.fieldId);
                  if (!field) return;
                  field.focus();
                  // Where the target could not take focus, the fragment still
                  // scrolls to it, which is better than a link that does nothing.
                  if (field.ownerDocument.activeElement === field) event.preventDefault();
                }}
              >
                {fault.message}
              </a>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
