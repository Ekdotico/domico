import { forwardRef, useId, type SelectHTMLAttributes } from 'react';
import { FieldShell, describedBy, errorId, hintId, type FieldProps } from './Field.js';
import { ChevronDownIcon } from './icons.js';

/**
 * A choice of one from a list, with a label, an optional hint, and a message.
 *
 *   <Select id="language" label="Language" labelHidden size="small"
 *     value={language} onChange={(event) => setLanguage(event.target.value)}>
 *     <option value="">Plain text</option>
 *     <option value="typescript">TypeScript</option>
 *     <option value="python">Python</option>
 *   </Select>
 *
 * The native `<select>`, and that is the whole design. The list is the
 * platform's: it opens as a wheel on a phone and as a list on a desktop, it is
 * searched by typing, it is read by every screen reader, and it needs no
 * script. A drawn listbox gives all of that up to control how the open list
 * looks, and a list of forty languages does not need to look like anything.
 * The options are `<option>` and `<optgroup>` children, and every attribute of
 * the element passes through. `ref` reaches it. Server-safe: it holds no state.
 *
 * **Which control for which choice.** A `Select` for a long list, or for a
 * short one where the row has no room: the language of a code block. A
 * `RadioGroup` for two to five answers a reader should see at once: the type
 * of a callout, the depth of a table of contents. A `MenuButton` is not a
 * choice at all. It holds actions, and nothing in it stays selected. An
 * `OptionList` is the one drawn listbox, for the one place a native select
 * cannot go: at the cursor of a text being typed in, with focus left there.
 *
 * The label is visible, as on every field. `labelHidden` keeps it for a screen
 * reader and takes it off the page, for a select in the header of a block
 * whose position already says what it chooses; the control is still named.
 * `size="small"` is the size for that header.
 *
 * The closed control is drawn from tokens and the open list is the
 * platform's, in the colours `color-scheme` gives it. In forced colours the
 * whole control is the platform's.
 *
 * Styles ship in `@ekdotico/domico/styles/form.css`.
 */
export type SelectProps = FieldProps &
  Omit<SelectHTMLAttributes<HTMLSelectElement>, 'aria-invalid' | 'size' | 'multiple'> & {
    /** Keeps the label for a screen reader and takes it off the page. */
    labelHidden?: boolean;
    /** `small` is the size of a control in the header of a block. */
    size?: 'small';
  };

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hint, error, id, className, labelHidden, size, children, 'aria-describedby': describedby, ...select },
  ref,
) {
  const ownId = useId();
  const fieldId = id ?? ownId;
  return (
    <FieldShell
      id={fieldId}
      label={label}
      hint={hint}
      error={error}
      className={className}
      labelHidden={labelHidden}
      size={size}
    >
      <span className="ekd-select">
        <select
          {...select}
          ref={ref}
          id={fieldId}
          className="ekd-field-input"
          aria-invalid={error != null || undefined}
          aria-describedby={describedBy(
            hint != null && hintId(fieldId),
            error != null && errorId(fieldId),
            describedby,
          )}
        >
          {children}
        </select>
        <span className="ekd-select-mark">
          <ChevronDownIcon />
        </span>
      </span>
    </FieldShell>
  );
});
