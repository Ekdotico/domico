'use client';

import * as ReactDOM from 'react-dom';
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ComponentType, ReactElement, ReactNode } from 'react';
import type { IconProps } from './icons.js';
import { Tooltip } from './Tooltip.js';

/**
 * A button, in four variants, which can report an operation in flight.
 *
 *   <Button variant="primary" type="submit" pendingLabel="Signing in…">Sign in</Button>
 *   <Button onClick={close}>Cancel</Button>
 *   <Button variant="destructive" onClick={remove}>Delete account</Button>
 *
 * A native `<button>`; its attributes pass through. `type` defaults to
 * `button`, not to the platform's `submit`, so a button dropped into a form
 * does not submit it by accident.
 *
 * - `primary` is the accent, and there is one per view.
 * - `secondary`, the default, is a hairline at control contrast.
 * - `quiet` has no boundary at rest, for an action beside the main ones.
 * - `destructive` takes the danger hairline. Its label names what is removed:
 *   "Delete account", not "Delete".
 *
 * `edge="start"` or `edge="end"` (quiet only) sets the button's text on the edge
 * of the column when it leads or ends a row, by a negative margin of the
 * padding and the border: the box, the press area and the focus ring are
 * unchanged and reach that far outside the column, so the container must not
 * clip them. Not for an icon-only button.
 *
 * The pending state is the one `GateSubmitButton` has always had, moved here
 * so that button is this one with the gate's class and defaults.
 *
 * `aria-disabled` and a click guard rather than `disabled`, from praktico's
 * gate. The button holds focus at the moment it is pressed, and disabling a
 * focused element drops focus to <body> in every engine: the reader lost their
 * place, and met the refusal message from the top of the document (WCAG 2.4.3).
 * The click guard also catches implicit submission: Enter in a field dispatches
 * a click on the form's submit button, and the guard cancels it.
 *
 * With a `pendingLabel` the label names the operation in progress, and the
 * button is `aria-live="polite"`, because a label changing on the focused
 * control is not reliably announced on its own. Without one the label stays
 * and the button is `aria-busy` alone.
 *
 * `pending` is read from `useFormStatus` where the installed React has it (19
 * and later), for a `type="submit"` button only: a Cancel button inside the
 * same form is not waiting on anything. Pass `pending` to override it — for a
 * form the button is not inside, for an operation that is not a form action,
 * or under React 18, where the hook does not exist.
 *
 * `disabled` still passes through, for an action that is unavailable rather
 * than in flight. Prefer saying why beside the button to disabling it.
 *
 * Navigation is `ButtonLink`, below; an action is `Button`.
 *
 * Styles ship in `@ekdotico/domico/styles/button.css`.
 */

type FormStatus = { pending: boolean };

// Read once, at module scope, so every render calls the same hook — or none.
// `import * as` rather than a named import: under React 18 the name is absent,
// and a named import of a missing binding is an error in a strict ES module.
const useFormStatus: () => FormStatus =
  (ReactDOM as unknown as { useFormStatus?: () => FormStatus }).useFormStatus ??
  (() => ({ pending: false }));

export type ButtonVariant = 'primary' | 'secondary' | 'quiet' | 'destructive';

/**
 * The edge of a row a quiet button leads or ends: its text then stands on the
 * edge of the column, and its box, press area and focus ring reach past it.
 */
export type ButtonEdge = 'start' | 'end';

/** `edge` is for the quiet variant alone: no other variant has an edge to give up. */
type ButtonShape =
  | { variant: 'quiet'; edge?: ButtonEdge }
  | { variant?: Exclude<ButtonVariant, 'quiet'>; edge?: never };

type PendingButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-disabled' | 'aria-busy'> & {
  /** The label while the operation is in flight: the operation, named. */
  pendingLabel?: ReactNode;
  /** Overrides the form status. */
  pending?: boolean;
};

/**
 * The behaviour without the skin. Internal: `Button` and `GateSubmitButton`
 * are this with a class each, so the pending state is written once.
 */
export function PendingButton({
  type = 'button',
  pendingLabel,
  pending: pendingOverride,
  onClick,
  children,
  ...button
}: PendingButtonProps) {
  const status = useFormStatus();
  const pending = pendingOverride ?? (type === 'submit' && status.pending);
  return (
    <button
      // Before the spread, so an `aria-live` the application sets is kept.
      aria-live={pendingLabel != null ? 'polite' : undefined}
      {...button}
      type={type}
      aria-disabled={pending || undefined}
      aria-busy={pending || undefined}
      onClick={(event) => {
        if (pending) {
          event.preventDefault();
          return;
        }
        onClick?.(event);
      }}
    >
      {pending && pendingLabel != null ? pendingLabel : children}
    </button>
  );
}

/** A domico icon component, as `icons` exports them: `SearchIcon`, not `<SearchIcon />`. */
export type ButtonIcon = ComponentType<IconProps>;

/**
 * The icon drawn before a label: 16px, decorative (the label names the
 * control), with the button's own gap between them.
 */
function withIcon(Icon: ButtonIcon | undefined, children: ReactNode): ReactNode {
  return Icon ? (
    <>
      <Icon />
      {children}
    </>
  ) : (
    children
  );
}

/**
 * The two shapes a button with an icon takes.
 *
 * With children, the icon sits before them and the children name the control.
 * With an icon and no children the button is icon-only, and then `label` is
 * required: it is the accessible name (`aria-label`) and the text of a
 * `Tooltip` on hover and on keyboard focus, so the two are identical
 * (Expression Guidelines §5.1 rule 13). TypeScript refuses the nameless form.
 * `label` is `never` beside children: the children are the name.
 *
 * An icon-only button is a 20×20 box with a 16×16 glyph, and its pointer target is 24×24 (a transparent ::after)
 * (WCAG 2.5.8). It takes the same variants as a labelled one. Write the label
 * as the term a labelled button would carry, naming its object where the
 * target is ambiguous: "Delete document", not "Delete". A touch has no hover,
 * so where width allows, prefer a visible word. The tooltip needs
 * `@ekdotico/domico/styles/tooltip.css` as well as `button.css`.
 *
 * The union is the whole guard, and a type is not a runtime check. Its known
 * gap: children that are only `undefined` or `null` at run time, such as
 * `{maybeText}`, type as the first shape, so a labelless icon-only button can
 * still be built that way. Write the icon-only form with no children at all.
 */
export type ButtonContent =
  | {
      children: ReactNode;
      /** An icon drawn before the label, at 16px. It is lost while a `pendingLabel` shows. */
      icon?: ButtonIcon;
      label?: never;
    }
  | {
      children?: undefined;
      /** With no children, the button is icon-only. */
      icon: ButtonIcon;
      /** The accessible name and the tooltip text. Required when there are no children. */
      label: string;
    };

/** Wraps an icon-only control in the tooltip that repeats its name. */
function named(iconOnly: boolean, label: string | undefined, control: ReactElement): ReactElement {
  return iconOnly && label ? <Tooltip content={label}>{control}</Tooltip> : control;
}

export function Button({
  variant = 'secondary',
  edge,
  className,
  icon,
  label,
  children,
  ...button
}: Omit<PendingButtonProps, 'children'> & ButtonShape & ButtonContent) {
  const iconOnly = icon != null && children == null;
  return named(
    iconOnly,
    label,
    <PendingButton
      {...button}
      aria-label={iconOnly ? label : button['aria-label']}
      className={['ekd-button', className].filter(Boolean).join(' ')}
      data-variant={variant}
      data-edge={variant === 'quiet' ? edge : undefined}
      data-icon-only={iconOnly ? '' : undefined}
    >
      {withIcon(icon, children)}
    </PendingButton>,
  );
}

/**
 * A link that looks like a button: for navigation, not for an action.
 *
 *   <ButtonLink variant="primary" href="/apply">Apply</ButtonLink>
 *   <ButtonLink href="https://example.org/form" target="_blank" rel="noreferrer">Open the form</ButtonLink>
 *
 * A native `<a>`; its attributes pass through, and `href` is required. It takes
 * the same four variants and the same `.ekd-button` skin as `Button`, so the
 * two sit side by side at one height. If the control changes state on the page
 * (saves, deletes, opens a dialog), use `Button`: a link that does that is
 * announced as a link and does not respond to Space.
 *
 * There is no pending or disabled state: a link that is not available is not
 * rendered, or is text with the reason beside it.
 *
 * The stylesheet keeps the colour, background, border and no-underline of the
 * skin in every state (`:link`, `:visited`, `:hover`, `:active`,
 * `:focus-visible`) against an application's own link rules, up to a
 * specificity of (0,2,1) and without `!important`. Do not put `.ekd-button` on
 * an `<a>` yourself; use this.
 *
 * Height is the same as `Button`'s, about 40px. WCAG 2.5.8 asks for 24px; an
 * application that wants 44px adds `padding-block` to its own class.
 *
 * Styles ship in `@ekdotico/domico/styles/button.css`.
 */
export function ButtonLink({
  variant = 'secondary',
  edge,
  className,
  icon,
  label,
  children,
  ...link
}: Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'children'> & {
  href: string;
} & ButtonShape &
  ButtonContent) {
  const iconOnly = icon != null && children == null;
  return named(
    iconOnly,
    label,
    <a
      {...link}
      aria-label={iconOnly ? label : link['aria-label']}
      className={['ekd-button', className].filter(Boolean).join(' ')}
      data-variant={variant}
      data-edge={variant === 'quiet' ? edge : undefined}
      data-icon-only={iconOnly ? '' : undefined}
    >
      {withIcon(icon, children)}
    </a>,
  );
}
