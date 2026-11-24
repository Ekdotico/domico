'use client';

import { forwardRef, useId, useState, type ChangeEvent, type KeyboardEvent } from 'react';
import { describedBy, errorId } from './Field.js';
import { PageHeading, containsGreek, setGreek } from './PageHeading.js';

/**
 * The title of a page, edited where it stands: the name of a document.
 *
 *   <EditableTitle
 *     label="Title"
 *     value={document.title}
 *     onSave={(title) => rename(document.id, title)}
 *     pending={renaming}
 *     error={renameError}
 *   />
 *
 * It looks like `PageHeading` and is the page's one main heading: an `<h1>`
 * that holds the field, so the outline still lists the title and a screen
 * reader that lists headings reads the title as it stands. No box is drawn.
 * A hairline appears on hover, the focus ring on focus, and a danger hairline
 * when `error` is set; each is a border, so each survives forced colours.
 *
 * **The field is a `<textarea>`, not an `<input>`.** An input is one line and
 * scrolls sideways, so a long title would be cut off at the edge of the column
 * where `PageHeading` wraps it. The textarea is as tall as its text and grows
 * as it wraps: a mirror of the value in the same grid cell sets the height, so
 * there is no script that measures and no flash on the server. Enter saves and
 * does not break the line, and a line break that arrives in a paste is turned
 * into a space, so the title stays one paragraph.
 *
 * **`value` is the saved title, and the draft is the component's.** It is not
 * controlled in the sense of `TextField`: there is no `onChange`, because the
 * application has nothing to do until the title is final. `onSave(draft)` is
 * called on Enter and when focus leaves, and only when the draft differs from
 * `value`. Escape puts `value` back and does not save. When `value` changes
 * (the application took the new title, or another person renamed the page) the
 * draft is replaced by it.
 *
 * **There are no words of its own.** `label` is the accessible name and is
 * required, with no default; there is no placeholder and no status text.
 * `error` is the application's message, drawn as a field message under the
 * heading and named by `aria-describedby`, with `aria-invalid` on the field.
 * It is not an alert: say it where the page announces its faults.
 *
 * `pending` does not disable the field. It sets `aria-busy` and
 * `aria-disabled`, as `Button` does, and ignores typing, Enter and Escape, so
 * the field keeps focus and a reader is not thrown out of it while a title
 * saves. Leaving the field while pending saves nothing.
 *
 * `readOnly` draws a `PageHeading` and nothing else: the same `<h1>`, the same
 * Greek handling, no field. `maxLength` is the browser's own, and so stops
 * a paste at the limit without a word: say the limit in the page, or leave it
 * to the server and pass its refusal as `error`.
 *
 * **Not for a field that needs a visible label.** The label here is for a
 * screen reader alone: the heading is what a sighted reader sees, and it
 * names itself. A field whose purpose is not plain from where it stands is a
 * `TextField`.
 *
 * Greek: while it is edited the text is the textarea's, and a textarea cannot
 * set one run of its text in another face, so the Greek run is not set in the
 * sans that `PageHeading` gives it. Read-only, it is.
 *
 * Styles ship in `@ekdotico/domico/styles/page-heading.css` and
 * `@ekdotico/domico/styles/form.css` (the message).
 */
export interface EditableTitleProps {
  /** The saved title. The draft starts as it and is replaced by it when it changes. */
  value: string;
  /** The field's accessible name, in the application's words. There is no default. */
  label: string;
  /** Called with the new title on Enter and when focus leaves, if it changed. */
  onSave: (value: string) => void | Promise<void>;
  /** A save is in flight. The field stays focusable and ignores input. */
  pending?: boolean;
  /** What went wrong and what to do next. Marks the field invalid. */
  error?: string;
  /** The most characters the field takes, as the browser counts them. */
  maxLength?: number;
  /** Draw a `PageHeading`: the title as text, with no field. */
  readOnly?: boolean;
  id?: string;
  className?: string;
}

export const EditableTitle = forwardRef<HTMLTextAreaElement, EditableTitleProps>(function EditableTitle(
  { value, label, onSave, pending = false, error, maxLength, readOnly = false, id, className },
  ref,
) {
  // The message of a refusal is tied to the field by an id of its own where the caller gives none.
  const ownId = useId();
  const [draft, setDraft] = useState(value);
  const [seen, setSeen] = useState(value);
  if (value !== seen) {
    setSeen(value);
    setDraft(value);
  }

  if (readOnly) {
    return (
      <PageHeading id={id} className={className}>
        {value}
      </PageHeading>
    );
  }

  const save = () => {
    if (!pending && draft !== value) void onSave(draft);
  };

  const onChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    if (pending) return;
    setDraft(event.target.value.replace(/\r\n|\r|\n/g, ' '));
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      // Composing text confirms a candidate with Enter, which is not a save.
      if (!event.nativeEvent.isComposing) save();
    } else if (event.key === 'Escape' && !pending) {
      setDraft(value);
    }
  };

  const fieldId = id ?? ownId;
  const messageId = errorId(fieldId);
  const hasError = error != null;
  const greek = containsGreek(draft);

  return (
    <>
      <h1 className={['ekd-page-heading', 'ekd-editable-title', className].filter(Boolean).join(' ')}>
        <span
          className="ekd-editable-title-box"
          data-value={draft}
          // While the field is edited it has one face: the sans where the title holds a Greek letter, by the heading's
          // own test. At rest the field shows the heading's look, a Greek run in the sans, through the view below.
          data-greek={greek || undefined}
        >
          <textarea
            ref={ref}
            id={fieldId}
            className="ekd-editable-title-input"
            rows={1}
            value={draft}
            maxLength={maxLength}
            aria-label={label}
            aria-invalid={hasError || undefined}
            aria-busy={pending || undefined}
            aria-disabled={pending || undefined}
            aria-describedby={describedBy(hasError && messageId)}
            spellCheck
            onChange={onChange}
            onKeyDown={onKeyDown}
            onBlur={save}
          />
          {greek ? (
            <span className="ekd-editable-title-view" aria-hidden="true">
              {setGreek(draft)}
            </span>
          ) : null}
        </span>
      </h1>
      {hasError ? (
        <p id={messageId} className="ekd-field-error ekd-editable-title-error">
          {error}
        </p>
      ) : null}
    </>
  );
});
