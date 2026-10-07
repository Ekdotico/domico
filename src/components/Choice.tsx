import {
  forwardRef,
  useId,
  type FieldsetHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react';
import { describedBy, errorId, hintId, type FieldProps } from './Field.js';

/**
 * RadioGroup and Checkbox — the two native choices, each with its label.
 *
 *   <RadioGroup
 *     id="kind"
 *     name="kind"
 *     legend="Kind of feedback"
 *     options={[
 *       { value: 'problem', label: 'Problem' },
 *       { value: 'idea', label: 'Idea' },
 *       { value: 'other', label: 'Other' },
 *     ]}
 *     required
 *   />
 *
 *   <Checkbox name="rename" label="Editors can rename the document" defaultChecked />
 *
 * Both are the platform's own inputs, drawn from tokens. The arrow keys, the
 * single Tab stop of a radio group, Space, form submission and the browser's
 * own `required` check are the platform's, and nothing here restates them.
 * Server-safe: neither holds state.
 *
 * Styles ship in `@ekdotico/domico/styles/form.css`.
 */

export interface RadioOption {
  /** What the form submits. */
  value: string;
  label: ReactNode;
  disabled?: boolean;
}

/**
 * A `<fieldset>` named by its `<legend>`, which is how a screen reader comes
 * to say the question before each answer.
 *
 * None is selected unless `defaultValue` or `value` says so. A preselected
 * answer is one the reader did not give, and a form cannot tell it from one
 * they did.
 *
 * The hint and the message are named by the fieldset. `aria-invalid` is not a
 * state a group of native radios takes, so a fault is carried by the message,
 * by `required` on the inputs, and by `data-invalid` for the stylesheet.
 *
 * The first radio carries the group's `id` and the rest derive theirs from it,
 * so a `FormFault` link to the group lands on a control that can take focus.
 */
export function RadioGroup({
  legend,
  hint,
  error,
  name,
  options,
  defaultValue,
  value,
  onChange,
  required,
  disabled,
  id,
  className,
  'aria-describedby': describedby,
  ...fieldset
}: Omit<FieldProps, 'label'> &
  Omit<FieldsetHTMLAttributes<HTMLFieldSetElement>, 'onChange' | 'defaultValue' | 'children' | 'name'> & {
  /** The question. It names the group. */
  legend: ReactNode;
  /** The name the chosen value is submitted under. */
  name: string;
  options: readonly RadioOption[];
  /** The option selected at first, where there is a reason for one. */
  defaultValue?: string;
  /** The selected option, for a group the application controls. */
  value?: string;
  onChange?: (value: string) => void;
  required?: boolean;
  /** Disables every option. */
  disabled?: boolean;
  id?: string;
  className?: string;
}) {
  const ownId = useId();
  const groupId = id ?? ownId;
  return (
    <fieldset
      {...fieldset}
      className={['ekd-choice-group', className].filter(Boolean).join(' ')}
      data-invalid={error != null || undefined}
      aria-describedby={describedBy(
        hint != null && hintId(groupId),
        error != null && errorId(groupId),
        describedby,
      )}
    >
      <legend className="ekd-choice-legend">{legend}</legend>
      {hint != null ? (
        <p id={hintId(groupId)} className="ekd-field-hint">
          {hint}
        </p>
      ) : null}
      {options.map((option, index) => (
        <label key={option.value} className="ekd-choice">
          <input
            type="radio"
            id={index === 0 ? groupId : `${groupId}-${index}`}
            className="ekd-choice-input"
            name={name}
            value={option.value}
            required={required}
            disabled={disabled || option.disabled}
            {...(value !== undefined
              ? { checked: value === option.value }
              : { defaultChecked: defaultValue === option.value })}
            onChange={onChange ? () => onChange(option.value) : undefined}
          />
          <span className="ekd-choice-label">{option.label}</span>
        </label>
      ))}
      {error != null ? (
        <p id={errorId(groupId)} className="ekd-field-error">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}

/**
 * One checkbox, wrapped in its label, so the words are part of the target.
 *
 * A native `<input type="checkbox">`; its attributes pass through. The hint
 * and the message sit under the label and are named by `aria-describedby`;
 * `error` marks the box `aria-invalid`, which a checkbox does take. `ref`
 * reaches the input.
 */
export const Checkbox = forwardRef<
  HTMLInputElement,
  FieldProps & Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'placeholder' | 'aria-invalid' | 'children'>
>(function Checkbox({ label, hint, error, id, className, 'aria-describedby': describedby, ...input }, ref) {
  const ownId = useId();
  const fieldId = id ?? ownId;
  return (
    <div className={['ekd-choice-field', className].filter(Boolean).join(' ')}>
      <label className="ekd-choice">
        <input
          {...input}
          ref={ref}
          type="checkbox"
          id={fieldId}
          className="ekd-choice-input"
          aria-invalid={error != null || undefined}
          aria-describedby={describedBy(
            hint != null && hintId(fieldId),
            error != null && errorId(fieldId),
            describedby,
          )}
        />
        <span className="ekd-choice-label">{label}</span>
      </label>
      {hint != null ? (
        <p id={hintId(fieldId)} className="ekd-field-hint">
          {hint}
        </p>
      ) : null}
      {error != null ? (
        <p id={errorId(fieldId)} className="ekd-field-error">
          {error}
        </p>
      ) : null}
    </div>
  );
});
