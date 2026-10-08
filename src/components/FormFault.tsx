'use client';

import { useEffect, useId, useRef, type ReactNode } from 'react';

/**
 * The statement of a fault: at the head of a form, or anywhere else a page has
 * one to state.
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
 *   <FormFault announce="off" title="This invitation is not open">
 *     <p>Ask the Ekdotico team for a new one.</p>
 *   </FormFault>
 *
 * **It is the control for any stated fault, with a form or without one.** The
 * name records where it was first needed. A sign-out that did not complete, an
 * acknowledgement that was refused, a page that states one fixed fault in
 * place of its form: each is this component, with `children` and no list.
 *
 * `announce` says how a screen reader comes to hear the statement. There are
 * three values because a statement arrives in one of three ways:
 *
 * - `assertive`, the default, is `role="alert"`: read at once, over whatever
 *   was being read. For a fault that follows something the reader has just
 *   done. Render it when there is a fault and not before, because an alert
 *   that is present from the first paint announces nothing.
 * - `polite` is `role="status"`: read when the screen reader next falls
 *   silent. For a fault the reader did not ask about and need not act on at
 *   once, such as a save in the background that did not complete.
 * - `off` is no live region. For a statement that is part of the page as it
 *   was served: it is read in its place and found by its heading. An alert
 *   there announces nothing or, where a screen reader does read it, is read
 *   ahead of the page's own title.
 *
 * In a form it is the one announcement a failed submission makes. The messages
 * under the fields are not alerts; each is read when its field is reached, and
 * each link here goes to one. A link moves focus into the field it names,
 * rather than scrolling to it and leaving focus on the link, which is what a
 * fragment alone does in some engines.
 *
 * Focus moves to an assertive statement when it appears, and again whenever
 * `focusKey` changes — pass the attempt count, so a second failed submission
 * is met from the statement and not from wherever the button was. It is
 * `tabIndex={-1}`: a place focus is sent, not a stop in the Tab order.
 * `autoFocus={false}` leaves focus where it is, for a fault that arrives while
 * the reader is typing, or one stated beside a button that keeps focus. A
 * polite statement and one that is not announced leave focus where it is
 * unless `autoFocus` asks: neither is an interruption, and moving focus is
 * one.
 *
 * The title is a heading, `h2` unless `headingLevel` says otherwise, so the
 * statement can be found by heading as well as heard once. A fault that is not
 * about one field — a refused sign-in, a failed request — takes `children` and
 * no list.
 *
 * `tone` says what the statement is, where `announce` says how it is heard,
 * and the two are set separately. `danger`, the default, is a fault: the
 * danger wash inside a danger hairline. `neutral` is a statement that is part
 * of a page and is not a fault — "This invitation has been used", "Sign-up is
 * by invitation" — on the sunken surface inside a hairline in the rule
 * colour, so a page that only tells the reader something does not open on what
 * looks like an alert. It usually goes with `announce="off"`.
 *
 *   <FormFault announce="off" tone="neutral">
 *     <p>Sign-up is by invitation. Ask the Ekdotico team for one.</p>
 *   </FormFault>
 *
 * The title can be left out where the statement is one sentence: the children
 * are then the statement, in the body's own weight, and there is no heading. A
 * statement with a role and no title has no name, which a live region does not
 * need. Give a title to anything longer, so it can be found by heading.
 *
 * Styles ship in `@ekdotico/domico/styles/form.css`.
 */
export interface FormFaultItem {
  /** The id of the control at fault. The first radio of a `RadioGroup` carries the group's `id`. */
  fieldId: string;
  /** What is at fault, in the words the field's own message uses. */
  message: ReactNode;
}

/** How a screen reader comes to hear a `FormFault`. */
export type FormFaultAnnounce = 'assertive' | 'polite' | 'off';

/** What a `FormFault` states: a fault, or a statement that is not one. */
export type FormFaultTone = 'danger' | 'neutral';

const ROLE = { assertive: 'alert', polite: 'status', off: undefined } as const;

export function FormFault({
  title,
  faults,
  children,
  headingLevel = 2,
  announce = 'assertive',
  tone = 'danger',
  focusKey,
  autoFocus = announce === 'assertive',
  id,
  className,
}: {
  /** What happened, as a heading. It names the statement. Leave it out for one sentence given as `children`. */
  title?: ReactNode;
  /** The fields at fault, in the order they appear in the form. */
  faults?: readonly FormFaultItem[];
  /** What to do next, where the list does not say it. */
  children?: ReactNode;
  headingLevel?: 2 | 3 | 4;
  /**
   * `assertive` is `role="alert"`, for a fault that follows an action.
   * `polite` is `role="status"`. `off` is no live region, for a statement that
   * is part of the page as it was served.
   */
  announce?: FormFaultAnnounce;
  /** `danger` is a fault. `neutral` is a statement that is part of the page and is not a fault. */
  tone?: FormFaultTone;
  /** Moves focus to the statement again whenever it changes. Pass the attempt. */
  focusKey?: unknown;
  /** Whether focus moves to the statement. It does for an assertive one, unless this says otherwise. */
  autoFocus?: boolean;
  id?: string;
  className?: string;
}) {
  const titleId = useId();
  const ref = useRef<HTMLDivElement>(null);
  const Heading = `h${headingLevel}` as 'h2';
  const role = ROLE[announce];

  useEffect(() => {
    if (autoFocus) ref.current?.focus();
  }, [autoFocus, focusKey]);

  return (
    <div
      ref={ref}
      id={id}
      className={['ekd-fault', className].filter(Boolean).join(' ')}
      // Absent for a fault, so the markup of a statement that names no tone is
      // what it was before there was one.
      data-tone={tone === 'neutral' ? tone : undefined}
      role={role}
      // A name belongs to a role. With none this is a plain block, which takes
      // no name, and its heading is how it is found.
      aria-labelledby={role && title != null ? titleId : undefined}
      tabIndex={-1}
    >
      {title != null ? (
        <Heading id={titleId} className="ekd-fault-title">
          {title}
        </Heading>
      ) : null}
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
