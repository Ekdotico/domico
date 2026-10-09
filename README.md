# Domico

`@ekdotico/domico` — the Ekdotico house style, in one versioned package: the
visual layer and the linguistic layer together.

Domico is the design system's own name. Ekdotico is the company whose house
style it holds, and remains the scope on the package, the `ekd-` prefix on the
appearance cookie and the `.ekd-` class prefix, and the word that appears in the
products. Renaming the system did not rename the company.

The visual layer is the design tokens, the four themes, the base stylesheet,
the shared components, and the brand assets. The linguistic layer is the
Ekdotico Expression Guidelines, with the controlled vocabulary and the
prohibited terms as machine-readable data.

The two ship together because they always change together. Splitting them
would recreate, at the package level, the drift problem this package exists to
solve. Subpath exports mean a consumer takes only what it needs: `deree` and
`internal` can depend on the expression layer for copy linting without pulling
a stylesheet or a component into a browser bundle.

Consumed by `docs`, `deree`, and `internal`. Each keeps its own repository, its
own deployment cadence, and its own dependencies.

---

## Installation

The package is private and published to GitHub Packages, so npm needs to know
where to find the `@ekdotico` scope and how to authenticate.

Add an `.npmrc` at the root of the consuming repository:

```
@ekdotico:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}
```

Set `NODE_AUTH_TOKEN` in the environment rather than writing a token into the
file. Locally that means a personal access token with the `read:packages`
scope, exported from a shell profile or a `.env` file that is not committed:

```bash
export NODE_AUTH_TOKEN=ghp_your_token_here
```

In GitHub Actions the built-in token is sufficient:

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: 24
    registry-url: https://npm.pkg.github.com
- run: pnpm install --frozen-lockfile
  env:
    NODE_AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

On Vercel, add `NODE_AUTH_TOKEN` as an environment variable for every
environment that runs a build, and commit the `.npmrc` above.

Then install:

```bash
pnpm add @ekdotico/domico
```

If `pnpm` reports that it could not replace `${NODE_AUTH_TOKEN}`, the variable
is not set in the current shell. The warning is harmless when only public
packages are being installed, and fatal when this one is.

---

## What each subpath gives you

| Import | Contents |
|---|---|
| `@ekdotico/domico/tokens.css` | Every custom property, for all four themes across both modes |
| `@ekdotico/domico/tokens` | The same values, typed, for use outside a stylesheet, and `collaboratorSlots` with `collaboratorSlot(index)` for assigning a collaborator colour |
| `@ekdotico/domico/styles.css` | The base layer and the shared component styles |
| `@ekdotico/domico/styles/base.css` | The reset and the semantic type utilities |
| `@ekdotico/domico/styles/reset.css` | The reset, document defaults, accessibility primitives, scrollbars |
| `@ekdotico/domico/styles/type.css` | The semantic type utilities alone |
| `@ekdotico/domico/styles/components.css` | The layout primitives, the appearance controls, and the shared components |
| `@ekdotico/domico/styles/appearance.css` | The appearance controls alone: the two switchers, the header row, and the menu |
| `@ekdotico/domico/styles/primitives.css` | The layout primitives alone — Container, Stack, and Cluster |
| `@ekdotico/domico/styles/badge.css` | One entry per component. The rest are `callout.css`, `figure.css`, `keyvalue.css`, `logo.css`, `section-rule.css`, `stat.css`, `table.css`, `tabs.css`, `access-gate.css`, `nav-drawer.css`, `on-this-page.css`, `doc-meta.css`, `opening-sequence.css`, `button.css`, `form.css`, `dialog.css`, `tooltip.css`, `page-heading.css`, `toolbar.css`, `menu.css`, `option-list.css`, `sync-status.css`, `editor.css`, and `code.css` |
| `@ekdotico/domico/components` | The shared React components |
| `@ekdotico/domico/icons` | The icon set: Lucide, vendored, at the house stroke weight |
| `@ekdotico/domico/theme` | Theme and mode switching, and the first-paint init script |
| `@ekdotico/domico/a11y` | `useModalSurface` and `inertOutside` for a modal surface, and `isShortcut` and `shortcutLabel` for a ⌘/Ctrl chord |
| `@ekdotico/domico/fonts` | Font loading configuration for the three locked families |
| `@ekdotico/domico/mermaid` | Mermaid `themeVariables` for all eight palettes |
| `@ekdotico/domico/mermaid/accessibility` | Reads `accTitle` and `accDescr` out of a diagram source, and blanks the directive lines in place |
| `@ekdotico/domico/svg` | `annotateSvg` — writes `<title>` and `<desc>` into a detached SVG so a downloaded file names itself |
| `@ekdotico/domico/expression` | The vocabulary and the prohibited terms, typed |
| `@ekdotico/domico/expression/guidelines.md` | The Expression Guidelines, canonical copy |

---

## Consuming the package

### docs

The documentation site takes the whole package. It keeps its own MDX
components, navigation, search, and page layouts; those are documentation
structure, not house style.

```ts
// app/layout.tsx
import '@ekdotico/domico/tokens.css';
import '@ekdotico/domico/styles.css';

import { Crimson_Pro, Commissioner, Fira_Code } from 'next/font/google';
import { themeInitScript } from '@ekdotico/domico/theme';

// next/font accepts only literal options, so these restate `fontConfig` from
// @ekdotico/domico/fonts rather than passing it; passing it fails the build.
const serif = Crimson_Pro({
  subsets: ['latin'], display: 'swap',
  variable: '--font-crimson-pro', style: ['normal', 'italic'],
});
const sans = Commissioner({
  subsets: ['latin'], display: 'swap', variable: '--font-commissioner',
});
const mono = Fira_Code({
  subsets: ['latin'], display: 'swap', variable: '--font-fira-code',
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      data-theme="parchment"
      className={`${serif.variable} ${sans.variable} ${mono.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript() }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

The documentation site pins its sticky table headers below its top bar. Set the
offset token once, in the application's own stylesheet:

```css
:root {
  --table-sticky-offset: var(--topbar-h);
}
```

Below 920px a wide table scrolls inside its card, which stops a native sticky
header from sticking to the page. Render `StickyTableHead` once in the root
layout and it mirrors each table's header at the same offset while the reader
scrolls; pass the route as `rescanKey` so a client-side navigation rebuilds the
mirrors. Its styles are in `styles/table.css`.

```tsx
import { SkipLink, StickyTableHead } from '@ekdotico/domico/components';

<SkipLink />              {/* → #main-content, "Skip to main content" */}
<StickyTableHead rescanKey={pathname} />
```

A document with a version of its own states it with `DocMeta`, under its title.
The application supplies both values; `updated` is an ISO date and is rendered
as written. A missing or malformed value is shown as "unset" or "unknown" in a
bordered strip rather than hidden. Its styles are in `styles/doc-meta.css`.

```tsx
import { DocMeta } from '@ekdotico/domico/components';
import '@ekdotico/domico/styles/doc-meta.css';

<DocMeta version="1.2" updated="2026-09-30" />
{/* → Version 1.2 · Last updated 2026-09-30 */}
```

### deree

The institutional site takes the visual layer and the brand assets. Its content
has not been audited against the Expression Guidelines, so adopt the linter in
warning mode first and read the output before enforcing anything.

```ts
import '@ekdotico/domico/tokens.css';
import '@ekdotico/domico/styles.css';
import { Logo, Callout } from '@ekdotico/domico/components';
```

### internal

The internal tool suite is deployed under `internal.ekdoti.co` behind
path-based routing. Take the tokens, and take the base layer only if the tools
should read as Ekdotico surfaces rather than as utilities. The shared
components are optional.

An internal tool whose conventions forbid a global class layer can still render
the appearance controls: `styles/appearance.css` is exactly the markup
`ThemeSwitcher`, `ModeSwitcher`, and `AppearanceMenu` emit and carries nothing
else.

The same holds for the shared components. Each has its own entry, so a tool
that renders three of them imports three stylesheets rather than a component
layer holding a dozen classes it never uses. A global component layer was the
one thing standing between the internal tools and the shared components, and
`styles/components.css` remains for consumers that want the whole set.

```ts
import '@ekdotico/domico/tokens.css';
import '@ekdotico/domico/styles/reset.css';
import '@ekdotico/domico/styles/appearance.css';
import '@ekdotico/domico/styles/callout.css';
import '@ekdotico/domico/styles/table.css';
import { resolveTokens } from '@ekdotico/domico/tokens';

// Values are available outside CSS, for canvas rendering, chart libraries,
// or a theme-colour meta tag.
const { 'bg-canvas': canvas, accent } = resolveTokens('library', 'dark');
```

---

## Applying a theme

Two attributes on the document element, and nothing else:

```html
<html data-theme="parchment" data-mode="dark">
```

`data-theme` is one of `parchment`, `library`, `sepia`, or `mono`. Parchment is
the default and is applied when the attribute is absent.

`data-mode` is `light` or `dark`. **Leave it off to follow the operating
system.** An absent `data-mode` is not an error state; it is the third,
default option, and the stylesheet handles it through `prefers-color-scheme`.

All four themes share identical token names. A consumer switches theme by
switching values, never by switching names, so no component needs to know which
theme is active.

Ship the switchers rather than reimplementing them, so behaviour stays
consistent across the three applications:

```tsx
import { ThemeSwitcher, ModeSwitcher } from '@ekdotico/domico/theme';
```

Where the chrome has no room for the pair laid out, `AppearanceMenu` puts both
behind one 36px button:

```tsx
import { AppearanceMenu } from '@ekdotico/domico/theme';

<AppearanceMenu />;
```

It is a disclosure button and a non-modal popover, and neither a menu nor a
dialog. A reader picks a theme by comparing each candidate against the page, so
the surface stays open through every activation and never seals off the page it
is being judged against. Escape closes it and returns focus to the button, a
press outside closes it, and Tab leaves. On opening, focus lands on the theme
already selected rather than on the first option, because the theme switcher is
one tab stop parked on the active choice.

Both properties are optional: `label` is the row label inside the panel, which
defaults to "Theme" and is also the accessible name of the theme group beneath
it, and `triggerLabel` is the accessible name on the button, which defaults to
"Appearance". Its styles ship in `styles/appearance.css` alongside the two
controls it composes, and that entry carries its own forced-colours and
reduced-motion rules, so it holds when it is the only package stylesheet an
application takes.

Add `themeInitScript()` to `<head>` as a blocking script. Without it the page
renders one frame in Parchment light before the stored theme applies, which is
a full-page colour flash. Under a strict Content-Security-Policy the script tag
needs the request nonce.

---

## Modal surfaces and shortcuts

A surface that claims `aria-modal="true"` owes four things: everything outside
it inert, Tab and Shift+Tab cycling inside it, Escape closing it, and focus
returned to its trigger on close — after the page is released, because an inert
trigger cannot take focus. `useModalSurface` keeps all four, which is why it
exists: the applications each wrote their own and each kept a different subset.

```tsx
import { useModalSurface } from '@ekdotico/domico/a11y';

useModalSurface({ open, surfaceRef, triggerRef, onClose: () => setOpen(false) });
```

`inertOutside` is the inert half on its own, for a surface that manages the
rest itself. `isShortcut(event, 'k')` answers to ⌘K on Apple platforms and
Ctrl+K elsewhere — never both, so Ctrl+K is left to a macOS text field — and
`shortcutLabel('k')` gives the same chord for the screen and for
`aria-keyshortcuts`. All four read the document or the platform, so call them
from an effect or an event handler, not during render.

---

## Form controls, the dialog, and the tooltip

The controls an application signs a person in with, takes a message with, and
asks for a confirmation with, and the heading of the page they sit on. Each is
the platform's own element, drawn from
tokens: a native `<input>`, `<textarea>`, `<button>`, `<fieldset>`, and
`<dialog>`. The keyboard, the form value, and the browser's own validation are
the platform's, and every attribute the native element takes passes through.

| Component | What it is | Stylesheet |
|---|---|---|
| `Button` | Four variants, `primary`, `secondary`, `quiet`, and `destructive`, and a pending state | `styles/button.css` |
| `TextField` | A single-line field with a label, a hint, and a message | `styles/form.css` |
| `PasswordField` | A password field with a button that shows what is typed | `styles/form.css` |
| `OneTimeCodeField` | One field for a numeric code, six digits unless told otherwise | `styles/form.css` |
| `TextArea` | A multi-line field, with a count against a maximum | `styles/form.css` |
| `RadioGroup` | A fieldset of native radios, named by its legend | `styles/form.css` |
| `Checkbox` | One native checkbox, inside its label | `styles/form.css` |
| `Select` | The native select, for one choice from a list | `styles/form.css` |
| `FormFault` | The statement of a fault, at the head of a form or anywhere else on a page | `styles/form.css` |
| `Dialog` | A modal dialog, on the native element | `styles/dialog.css` |
| `Tooltip` | An explanation shown on hover and on focus | `styles/tooltip.css` |
| `PageHeading` | The heading of an application page, an `h1` unless told otherwise | `styles/page-heading.css` |
| `QrCode` | A QR code as an inline SVG, dark on light in every theme | None. It needs `tokens.css` alone |

```tsx
import {
  Button, Checkbox, Dialog, FormFault, OneTimeCodeField, PageHeading,
  PasswordField, QrCode, RadioGroup, TextArea, TextField, Tooltip,
} from '@ekdotico/domico/components';
import '@ekdotico/domico/styles/button.css';
import '@ekdotico/domico/styles/form.css';
import '@ekdotico/domico/styles/dialog.css';
import '@ekdotico/domico/styles/tooltip.css';
import '@ekdotico/domico/styles/page-heading.css';
```

All five entries are in `styles.css` and `styles/components.css` already. Each
expects the reset, which draws the focus ring and supplies `.sr-only`.

### A form

```tsx
<form action={signIn} noValidate>
  {state.faults.length > 0 ? (
    <FormFault
      title="The form has two faults"
      faults={state.faults}          // [{ fieldId: 'email', message: 'Enter an email address' }, …]
      focusKey={state.attempt}
    />
  ) : null}

  <TextField id="email" name="email" type="email" label="Email address"
    autoComplete="username" required error={state.fault.email} />
  <PasswordField id="password" name="password" label="Password"
    toggleLabel="Show password" autoComplete="current-password" required
    error={state.fault.password} />

  <Button variant="primary" type="submit" pendingLabel="Signing in…">Sign in</Button>
</form>
```

Every word is the application's. The package supplies no label for any of these
controls, and none has a default: `label`, `toggleLabel`, `legend`,
`closeLabel`, and the wording of the count are all passed in.

A field's `error` marks it `aria-invalid`, and the field is described by its
hint and its message through `aria-describedby`. The message is not an alert.
`FormFault` is the one announcement a failed submission makes: it is
`role="alert"`, it takes focus when it appears and again whenever `focusKey`
changes, and each of its links moves focus into the field it names. Render it
when there is a fault and not before. It also states a fault where there is no
form, as described under "A fault outside a form".

The package draws no asterisk and takes no placeholder. Say that a field is
required in its label or its hint, and put an example in the hint, where it is
still there after the first keystroke.

`PasswordField` requires `autoComplete`, as `current-password` or
`new-password`. Its toggle is a button beside the field with `aria-pressed`,
and `toggleLabel` is its name in both states. The field goes back to hidden
when its form is submitted.

`OneTimeCodeField` is one input with `inputMode="numeric"` and
`autoComplete="one-time-code"`, so a phone offers the code it has received.
`digits` defaults to 6. It sets no `maxlength`, and its `pattern` allows one
space or hyphen between each two digits, so a code copied as "123 456" is
pasted whole and passes the browser's own check. The value arrives as typed:
the server strips the separators before it compares.

`TextArea` takes `maximum` and `remainingLabel`, a function from the number
remaining to the words for it. The count on screen follows every keystroke; a
polite live region follows a second after typing stops. `maximum` does not set
`maxlength`, which would truncate a paste without saying so: past the maximum
the field is marked invalid and the number goes negative. Because
`remainingLabel` is a function, a counted `TextArea` is rendered from a client
component; a Server Component cannot pass it one.

`TextField`, `PasswordField`, `OneTimeCodeField`, `TextArea`, and `Checkbox`
each hand their native element to a `ref`.

```tsx
<RadioGroup id="kind" name="kind" legend="Kind of feedback" required
  options={[
    { value: 'problem', label: 'Problem' },
    { value: 'idea', label: 'Idea' },
    { value: 'other', label: 'Other' },
  ]} />
<TextArea id="message" name="message" label="Message" rows={6} maximum={4000}
  remainingLabel={(n) => (n >= 0 ? `${n} characters remaining` : `${-n} characters over the limit`)} />
<Checkbox name="rename" label="Editors can rename the document" />
```

No radio is selected unless `defaultValue` or `value` says so. The first radio
carries the group's `id`, so a `FormFault` link to the group lands on a control.

```tsx
<Select id="language" name="language" label="Language of the document"
  hint="Sets the dictionary." defaultValue="en-GB">
  <option value="en-GB">English (United Kingdom)</option>
  <option value="el">Greek</option>
</Select>
```

`Select` is the native `<select>`, with the label, the hint, and the message of
every other field. Its options are `<option>` and `<optgroup>` children. The
list is the platform's own, so it is a wheel on a phone, it is searched by
typing, and it needs no script. `labelHidden` keeps the label for a screen
reader and takes it off the page, and `size="small"` is the size for the header
of a block; both are for a select whose position already says what it chooses.

Use a `Select` for a long list, or for a short one where there is no room. Use
a `RadioGroup` for two to five answers a person should see at once.

### The width of a form

`--form-w` is the widest a column of fields runs, `28rem`. Set it as
`max-inline-size` on the form or on the column it sits in. It is in `rem`, so
the column widens with a reader's own font size.

### A read-only field

```tsx
<TextField id="email" type="email" label="Email address"
  hint="The invitation was sent to this address. It cannot be changed here."
  autoComplete="username" value={email} readOnly />
```

`readOnly` is the native attribute, and the field has a presentation for it: a
value to read and copy, not one to type. The field gives up the inset ground,
which means "type here", and takes the surface the form sits on; its boundary
stays at control contrast and is dashed. The value stays in `--fg-1`. The field
stays in the Tab order, its text can be selected, and it is submitted with the
form. A screen reader states the read-only state from the attribute.

It is not `disabled`. A disabled field leaves the Tab order and the submitted
form, and is drawn on the sunken surface in `--fg-3`. Use `readOnly` for a
value the person needs and cannot change here, and say why in the hint.
`PasswordField`, `OneTimeCodeField`, and `TextArea` draw the state the same
way. A field that is both read-only and disabled is drawn as disabled.

### A fault outside a form

`FormFault` is the control for any stated fault, with a form or without one:
a sign-out that did not complete, an acknowledgement that was refused, a page
that states one fixed fault in place of its form. Outside a form it takes
`children` and no list.

```tsx
{fault ? (
  <FormFault title="Sign-out did not complete" autoFocus={false}>
    <p>You are still signed in. Select Sign out again.</p>
  </FormFault>
) : null}

<FormFault announce="off" title="This invitation is not open">
  <p>Ask the Ekdotico team for a new one.</p>
</FormFault>
```

`announce` sets how a screen reader comes to hear the statement.

| `announce` | Role | Use it for |
|---|---|---|
| `assertive`, the default | `role="alert"` | A fault that follows an action the person took. Render it when the fault occurs and not before |
| `polite` | `role="status"` | A fault the person did not ask about and need not act on at once, such as a save in the background that did not complete |
| `off` | none | A statement that is part of the page as it was served. It is read in its place and found by its heading |

A statement that is on the page from the first render takes `announce="off"`.
An alert that is present from the first paint announces nothing in most screen
readers, and a page should not open by interrupting its own title. Where the
same statement replaces a form after a submission, leave `announce` at its
default, so that it is announced.

Focus moves to an assertive statement when it appears. A polite statement and
one that is not announced leave focus where it is. `autoFocus` overrides either
default: pass `autoFocus={false}` for a fault stated beside a button that keeps
focus.

`tone` sets what the statement is, and is separate from how it is heard.
`danger`, the default, is a fault, on the danger wash. `neutral` is a statement
that is part of a page and is not a fault, on the sunken surface inside a plain
hairline. A statement of one sentence can leave out `title`: the children are
then the statement, at the body's weight, with no heading.

```tsx
<FormFault announce="off" tone="neutral">
  <p>Sign-up is by invitation. Ask the Ekdotico team for one.</p>
</FormFault>
```

Give a title to anything longer than a sentence, so that it can be found by
its heading. With no `tone` and a `title` the component renders what it
rendered at 0.26.0.

### The page heading

```tsx
<PageHeading>Account settings</PageHeading>
<PageHeading ref={heading} tabIndex={-1}>{notice.title}</PageHeading>
```

`PageHeading` is the heading of an application page: an `h1` in the reading
serif at `--fs-2xl`, the size of the `AccessGate` title. `level` takes `1`, `2`,
or `3` and changes the element and not the size. It is not `.display`, which is
the title of a document or a landing page.

A Greek run in the heading is set in `--font-sans` by the component. The
reading serif has no Greek (rule 4), so the component wraps each run of Greek
letters in a span that takes the sans. Pass the title as a plain string, and
add no span and no class for it. The component also reads the text inside an
HTML element passed as a child. It does not read the text that a component of
the application renders.

The run is also set at `--serif-fit`, `0.84em`. The sans is the larger face at
one font size, so a Greek letter at the heading's own size stood taller than
the word before it. At `0.84em` its lowercase is the height of the serif's, and
"Closed α" reads as one line of type.

The span sets the face and the size and nothing else. A title in Greek still takes `lang`,
which passes through to the heading with every other attribute. `ref` reaches
the heading, for a page that moves focus to its title when it is shown. The
component holds no state, so a server component renders it. The heading has no
margin: the space under it is the layout's.

### The QR code

```tsx
<QrCode value={otpauthUri} label="QR code for your authenticator app" />
```

`QrCode` draws `value` as a QR code, in an inline `<svg role="img">`. `label`
is its accessible name and has no default: a screen reader is given the name
and nothing inside the image, and what the code is for is the application's to
say. Show the same value as text beside the code, for a person who cannot use
a camera.

The code is dark on light in every theme. A phone reads dark modules on a
light ground and cannot read the reverse, so the two colours are `--scan-ink`
and `--scan-plate`, which are the same in all eight palettes, and the code
stands on a light plate on a dark page. They measure 12.76:1. The plate
includes the quiet zone, four modules on each side, which a reader needs to
find the code: do not crop it or round its corners into it. The colours are
set on the image itself, so the control has no stylesheet entry, and they are
kept where a reader has forced a palette.

`size` is the width and the height in CSS pixels, quiet zone included, and is
200 unless the application says otherwise. Keep 3 pixels a module or more. A
value of 200 bytes makes a code 65 modules across with its quiet zone, which
is a little over 3 at 200, so raise `size` for a longer value. `className` and
every other attribute pass through to the `<svg>`.

The component has no state and no hook, so a server component renders it, and
a secret is encoded on the server and is not sent to the browser a second time
as a string. The encoder is the package's own, in `src/components/qr.ts`, and
the package still has no runtime dependency. It writes byte mode at
error-correction level M, in the smallest version that holds the value, with
the mask the standard's penalty rules score lowest. Text outside ASCII is
written as UTF-8. A value over 2331 bytes fits no version, and the component
throws a `RangeError` when it renders: that is a fault in the application and
not a message for a reader.

### The button

`type` defaults to `button`, so a button inside a form submits it only when it
says `type="submit"`. A submit button reads the form's status from React 19 and,
while the action is in flight, is marked `aria-disabled`, refuses a second
press, and keeps focus; pass `pending` to drive it yourself. This is the
behaviour `GateSubmitButton` has always had, and that component is now this one
with the gate's class and its two default labels.

The `destructive` variant is a danger hairline and not a filled button, because
no ink holds on `--danger` in all eight palettes. Its label names what is
removed.

### The dialog

```tsx
const [open, setOpen] = useState(false);

<Button onClick={() => setOpen(true)}>Send feedback</Button>
<Dialog open={open} onClose={() => setOpen(false)} title="Send feedback" closeLabel="Close">
  …
</Dialog>
```

The native `<dialog>`, opened with `showModal()`. The platform makes the page
behind it inert, keeps Tab inside, and returns focus to the control that opened
it; the component adds no focus trap of its own and no `aria-modal`. It is named
by its heading.

The application holds `open`, and the dialog on screen follows it. Escape and
the close button call `onClose`, and the dialog closes when `open` becomes
false, so `onClose` is expected to set it. Where `open` stays true, the dialog
stays: one the browser has closed regardless, as Chromium does on a second
Escape, is shown again. A press outside the dialog does not close it. The
children stay mounted while it is closed, so give a form a `key` to clear it
once it is sent.

`closeLabel` renders the close button and names it. Leave it out for a
confirmation, and give the dialog a button of its own that calls `onClose`.
`initialFocusRef` chooses where focus lands on opening, and `aria-describedby`
passes through for a sentence that should be read with the dialog's name.

### The tooltip

```tsx
<Tooltip content="This document was created without provenance recording and cannot be sealed.">
  Not recorded
</Tooltip>
```

Shown on hover and on keyboard focus, and tied to its trigger by
`aria-describedby`. It meets WCAG 2.2 success criterion 1.4.13: Escape dismisses
it without moving the pointer or focus, the pointer can move onto the content,
and nothing times it out. While it is showing, Escape is the tooltip's and does
not reach a dialog behind it.

Focus shows it only where the browser would draw a focus ring, so a control
pressed with a mouse does not keep its tooltip up after the pointer has gone.

Pass one focusable element and it is described in place. Pass text and the
package renders a button for it, so the tooltip exists for a keyboard and for a
touch: a press on that button shows the tooltip, and a second press, or a press
anywhere else, hides it. The content is text: a link inside a tooltip cannot be
reached.

It opens under the start edge of its trigger, or over it with
`placement="top"`. Closed, it takes no space. Open, it is no wider than the
viewport less a margin and is moved sideways to stay inside it, so it adds no
horizontal scroll at a narrow width. It does not flip to the other side of its
trigger when there is no room.

### Which ink on which surface

A dialog and a tooltip sit on `--bg-raised`, and three inks used as text
elsewhere do not hold there: `--fg-3` measures 4.40:1 in sepia dark, `--accent`
4.42:1 and `--danger` 4.27:1 in parchment dark. These controls therefore set
text in `--fg-1` and `--fg-2`, and use `--accent` and `--danger` for boundaries
and marks, where 3:1 is owed. A field's message is `--fg-1` on the danger wash
inside a danger hairline. A read-only field has no ground of its own, so its
value is `--fg-1` and its boundary `--rule-control` on whichever of
`--bg-canvas`, `--bg-surface`, `--bg-surface-2`, and `--bg-raised` the form
sits on. `pnpm check:contrast` measures each of those pairs.

---

## The editor

What an application needs to build a document editor without writing a colour,
a size, or a control of its own. There are two halves, and they are different
kinds of thing.

The controls round the document are React components. The document is not: it
is whatever markup the application's editor produces, and the package styles
that markup by class name and attribute. The package imports no editor and
depends on none.

| Component | What it is | Stylesheet |
|---|---|---|
| `Toolbar` | A row of controls with one Tab stop, inline or floating | `styles/toolbar.css` |
| `ToggleButton` | A button with a pressed state, for a mark | `styles/toolbar.css` |
| `ToolbarSeparator` | A hairline between two groups in a toolbar | `styles/toolbar.css` |
| `MenuButton` | A button that opens a list of actions | `styles/menu.css` and `styles/button.css` |
| `Select` | The native select, for the language of a code block | `styles/form.css` |
| `OptionList` | A list of options at the text cursor, filtered by typing, with focus left in the text | `styles/option-list.css` |
| `SyncStatus` | Whether the document on screen is the document on the server | `styles/sync-status.css` |
| `Callout` | The note, the warning, and the tip, each with its icon | `styles/callout.css` |

| Stylesheet | What it styles |
|---|---|
| `styles/editor.css` | The document surface: prose, the nine marks, lists, a table, a page break, a table of contents |
| `styles/code.css` | A code block, its header, and the syntax colours |

```tsx
import {
  Button, Callout, MenuButton, OptionList, Select, SyncStatus, ToggleButton, Toolbar,
  ToolbarSeparator, Tooltip,
} from '@ekdotico/domico/components';
import { BoldIcon, ItalicIcon, LinkIcon } from '@ekdotico/domico/icons';
import '@ekdotico/domico/styles/editor.css';
import '@ekdotico/domico/styles/code.css';
import '@ekdotico/domico/styles/callout.css';
import '@ekdotico/domico/styles/toolbar.css';
import '@ekdotico/domico/styles/menu.css';
import '@ekdotico/domico/styles/option-list.css';
import '@ekdotico/domico/styles/sync-status.css';
```

All of them are in `styles.css` and `styles/components.css` already.

### The toolbar and the toggle button

```tsx
<Toolbar label="Formatting" floating>
  <Tooltip content={`Bold, ${shortcutLabel('b').label}`}>
    <ToggleButton label="Bold" pressed={marks.bold} onClick={toggleBold}>
      <BoldIcon />
    </ToggleButton>
  </Tooltip>
  <Tooltip content={`Link, ${shortcutLabel('k').label}`}>
    <ToggleButton label="Link" pressed={marks.link} onClick={editLink}>
      <LinkIcon />
    </ToggleButton>
  </Tooltip>
</Toolbar>
```

`Toolbar` is `role="toolbar"`, named by `label`. It is one stop in the Tab
order. Left and Right move between its controls and wrap at the ends, Home and
End go to the first and the last, and Tab returns to the control that last had
focus. The controls are whatever is inside it, found in the document, so a
control inside a `Tooltip` is found too.

A `Select` in a toolbar keeps Up and Down and gives the row Left and Right. A
text field needs all of those keys for its caret: put a text field beside a
toolbar, not in one.

`floating` draws the row as a raised surface, for a toolbar shown over a
selection. The application places it and decides when it is shown. The
application also owes two things the package cannot supply: a key that moves
focus from the text to the toolbar, and Escape to return it. Without
`floating` the row has no surface and sits in the header of a block.

`ToggleButton` is a native button with `aria-pressed`. `label` is its name, and
the name is the same in both states. The application holds `pressed`: a press
calls `onClick` and changes nothing by itself, because what is pressed in an
editor follows the selection. A pressed toggle is drawn with a boundary and a
wash together, so the state does not depend on telling two hues apart.

The icons for the nine marks are `BoldIcon`, `ItalicIcon`, `UnderlineIcon`,
`StrikethroughIcon`, `CodeIcon`, `SuperscriptIcon`, `SubscriptIcon`, `LinkIcon`,
and `HighlighterIcon`. An icon has no visible name, so wrap each toggle in a
`Tooltip`, which also has room for the shortcut.

### The menu button

```tsx
<MenuButton
  label="Table"
  items={[
    { label: 'Add row above', onSelect: addRowAbove },
    { label: 'Add row below', onSelect: addRowBelow },
    { label: 'Delete row', onSelect: deleteRow, separatorBefore: true },
    { label: 'Split cell', onSelect: splitCell, disabled: !canSplit },
  ]}
/>
```

A button that opens a list of actions, on the WAI-ARIA menu button pattern.
Enter, Space, and Down on the button open the list on its first action, and Up
opens it on its last. In the list, Down and Up move and wrap, and Home and End
go to the ends. Escape closes the list and returns focus to the button. So
does choosing an action, before the action runs. Tab closes the list and moves
on, and a press outside closes it. It does not find an action by its first
letter.

A menu holds actions, and nothing in it stays selected. A value chosen from a
list is a `Select`.

An action with `disabled` stays in the list and takes focus, with
`aria-disabled`, so the list is the same list each time. The button is a
`Button`, `secondary` unless `variant` says otherwise, and its other attributes
pass through.

### The sync status

```tsx
<SyncStatus state="synced" label="Saved" onClick={verify} />
<SyncStatus state="syncing" label="Reconnecting. Your changes are kept." onClick={verify} />
<SyncStatus state="error" label="Not connected. Editing is paused." onClick={verify} />
```

Three states, `synced`, `syncing`, and `error`. Each is a mark and words
together, and the words are the application's: `label` has no default. A
connection being restored is `syncing` with words that say so. With `onClick`
the indicator is a button, and without one it is text.

The words on screen follow the state at once. A screen reader is told
separately, through a polite status region, once the label has stood for
`announceAfterMs`, which is 1500 unless the application says otherwise. A
document that is being typed in changes state at every pause, and a save that
completes inside that interval is never announced. A connection that stays
lost is announced, and so is its return. Nothing is announced when the page
loads.

Syncing fades the mark in and out and moves nothing. A reader who asks for
reduced motion gets the mark at rest.

### The option list

The list an editor opens at the text cursor when a writer types `/`, and the
same control for a mention or a citation key. What is typed after the `/`
filters it, the arrow keys move through it, Enter chooses, and Escape or a
press outside closes it. Focus stays in the text throughout.

That last sentence decides the design. The list never has focus, so it takes
no key and can set no attribute on the element that does. The package
therefore ships the control in two parts: the component, which draws the list,
and the functions the application calls from its own text region.

| Export | What it is |
|---|---|
| `OptionList` | The list: a `role="listbox"` with `role="option"` children, placed at the cursor |
| `optionListKey` | Reads a `keydown` in the text and returns what it means for the list |
| `optionListNavigating` | Says of that result whether the writer is moving in the list |
| `optionListAttributes` | Returns the ARIA attributes the text region carries, open and closed |
| `optionListOptionId` | The element id of one option, for an application that writes `aria-activedescendant` itself |
| `placeOptionList` | The placement arithmetic, exported so it is tested and can be reused |

The whole of a slash palette on a text region:

```tsx
'use client';

import { useState, type FormEvent, type KeyboardEvent } from 'react';
import {
  OptionList, optionListAttributes, optionListKey, optionListNavigating, type OptionListItem,
} from '@ekdotico/domico/components';
import '@ekdotico/domico/styles/option-list.css';

const LIST_ID = 'slash-commands';

const COMMANDS: (OptionListItem & { aliases: string[] })[] = [
  { id: 'text', label: 'Text', detail: '/text', aliases: ['p', 'paragraph'] },
  { id: 'h1', label: 'Heading 1', detail: '/h1', aliases: ['heading1'] },
  { id: 'bullet', label: 'Bulleted list', detail: '/bullet', aliases: ['ul', 'unordered'] },
  // and the rest
];

/** What stands between a "/" that starts a word and the cursor, or null. */
function queryAtCursor(): string | null {
  const selection = window.getSelection();
  const node = selection?.focusNode;
  if (!selection?.isCollapsed || node?.nodeType !== Node.TEXT_NODE) return null;
  const before = (node.textContent ?? '').slice(0, selection.focusOffset);
  return /(?:^|\s)\/(\S*)$/.exec(before)?.[1] ?? null;
}

/** The cursor, in viewport coordinates. An editor has its own function for this. */
function cursorRectangle(): DOMRect | null {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return null;
  const range = selection.getRangeAt(0);
  const rect = range.getClientRects()[0] ?? range.getBoundingClientRect();
  if (rect.width > 0 || rect.height > 0) return rect;
  // A collapsed range in an empty block has no rectangle, and its bounding
  // rectangle is all zeros, which is the corner of the viewport and not the
  // cursor. The block that holds the cursor has a box.
  const holder = range.startContainer;
  const block = holder instanceof Element ? holder : holder.parentElement;
  return block?.getBoundingClientRect() ?? null;
}

export function Editor() {
  // What stands after the "/" at the cursor, or null where there is none.
  const [query, setQuery] = useState<string | null>(null);
  // The writer closed the list on this "/". It stays as text, and stays closed.
  const [dismissed, setDismissed] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  // Whether the last key was a move in the list.
  const [navigating, setNavigating] = useState(false);

  const open = query !== null && !dismissed;
  const options = open
    ? COMMANDS.filter((command) =>
        [command.id, ...command.aliases].some((name) => name.startsWith(query.toLowerCase())),
      )
    : [];
  // The first match is marked unless the writer has moved to another that is still shown.
  const active = options.some((option) => option.id === activeId) ? activeId : (options[0]?.id ?? null);

  const dismiss = () => {
    setDismissed(true);
    setActiveId(null);
  };
  const insert = (id: string) => {
    setQuery(null);
    setActiveId(null);
    // Replace the "/" and the query with the block `id` names.
  };

  const onInput = (event: FormEvent<HTMLDivElement>) => {
    const next = queryAtCursor();
    setQuery(next);
    // A "/" typed now is a new request, and so is the first after the last one went.
    // `includes`, because one input can carry more than one character.
    const typed = (event.nativeEvent as InputEvent).data ?? '';
    if (typed.includes('/') || next === null) setDismissed(false);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const result = open ? optionListKey(event, { options, activeId: active }) : null;
    // For every key, the list's or the text's, open or closed.
    setNavigating(optionListNavigating(result));
    if (!result) return; // The text's own key: a letter, Backspace, Left, Home, Tab.
    event.preventDefault(); // The list's key. The caret stays where it is.
    if ('activeId' in result) setActiveId(result.activeId);
    else if ('select' in result) insert(result.select);
    else dismiss();
  };

  return (
    <>
      <div
        className="ekd-editor"
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label="Document"
        {...optionListAttributes(LIST_ID, { open, options, activeId: active, navigating })}
        onInput={onInput}
        onKeyDown={onKeyDown}
        onBlur={dismiss}
      />
      <OptionList
        id={LIST_ID}
        label="Blocks"
        open={open}
        options={options}
        activeId={active}
        onActiveChange={setActiveId}
        onSelect={insert}
        onDismiss={dismiss}
        anchor={cursorRectangle}
        empty="No block matches. Delete a letter to see more."
        status={options.length === 1 ? '1 block' : `${options.length} blocks`}
      />
    </>
  );
}
```

**The component is fully controlled.** The application holds `open`, `options`
and `activeId`, and does the filtering. `OptionList` draws what it is given
and reports three things: `onActiveChange` when the pointer moves onto an
option, `onSelect` when one is pressed, and `onDismiss` for a press outside
the list. Each option is `{ id, label, detail }`. `detail` is optional, and is
a second and quieter text at the end of the row, such as the command that
inserts the block. An option's `id` becomes part of an element id, so it holds
no white space and is unique in the list.

**The keys are the application's**, and `optionListKey` reads them the same way
for every product. It returns one of four things and changes nothing by
itself. It does not prevent the default: the application does, when the result
is not `null`.

| Key | Result | Meaning |
|---|---|---|
| Down, Up | `{ activeId }` | The next or the previous option. At an end, the option that was already active |
| Page Down, Page Up | `{ activeId }` | `maxVisible` options on, or back, stopping at the ends |
| Enter | `{ select }` | The active option is chosen. With none active, `null` |
| Escape | `{ dismiss: true }` | The list closes |
| Any other key | `null` | The text's key: letters, Backspace, Left, Right, Home, End, and Tab |

Down and Up stop at the ends and do not wrap. The WAI-ARIA Authoring Practices
say of a listbox popup that on the last option Down "either returns focus to
the combobox or does nothing", and focus is already in the text. With no
option active, Down and Page Down go to the first option, and Up and Page Up
to the last. The Authoring Practices give a listbox popup no Page keys. The
rule they do give for entering the popup from the text is that Down goes to
the first option and Up to the last, and the Page keys follow it.

Home and End are the text's. A document has lines, and a writer who cannot go
to the start or the end of the line while a list is open has lost more than
the list gives. The Authoring Practices mark both keys "(Optional)" for a
listbox popup.

The result is `null` in three more cases, so that the key reaches the text.
While an input method is composing, Enter commits its candidate and the arrows
move through its own window; the function reads `isComposing`, on the event or
on React's `nativeEvent`, and `keyCode` 229. With Alt, Control, Meta or Shift
held, the key is a selection or a chord of the platform. With no options in
the list, every key except Escape is the text's.

**The attributes on the text region** come from `optionListAttributes`, and
are spread onto the element that has focus. There are two.

| Attribute | While the list shows at least one option | Closed, or open and empty |
|---|---|---|
| `aria-controls` | the `id` of the list | removed |
| `aria-activedescendant` | the id of the active option, while the writer is moving in the list | removed |

The function returns both keys every time, as a value or as `undefined`, so a
spread in React takes off what the last render put on. An application that
writes attributes by another route removes the same two.

These two are the whole of what WAI-ARIA 1.2 gives a `textbox` for a list it
does not hold, and each rests on a sentence of that specification.

- `aria-activedescendant`. The section "aria-activedescendant property" allows
  it under two sets of conditions, and the second is this one: "The element
  with DOM focus is a combobox, textbox or searchbox with aria-controls
  referring to an element that supports aria-activedescendant, and the value
  of aria-activedescendant refers to an owned element of the controlled
  element." A `listbox` supports `aria-activedescendant` and the options are
  its children. So `aria-controls` is what makes the other attribute valid,
  and the two are set and removed together.
- `aria-controls`. The section "aria-controls property" lists it for every
  element: "Identifies the element (or elements) whose contents or presence
  are controlled by the current element."

Three attributes that a list of suggestions often carries are left out, and
the same specification says why.

- `aria-autocomplete`. The section "aria-autocomplete property" says: "The
  aria-autocomplete property is not intended to indicate the presence of a
  completion suggestion, and authors SHOULD NOT dynamically change its value
  in order to communicate the presence of a suggestion." Setting it while the
  list shows and removing it afterwards is that. A text region that offers
  completions for as long as it is edited may carry `aria-autocomplete="list"`
  as a fixed attribute of its own. A document that opens a list of blocks on
  one character is not that.
- `aria-expanded`. The same section continues: "authors SHOULD use the
  aria-expanded state to communicate whether the element that presents the
  suggestion collection is displayed." The section "aria-expanded state" lists
  the roles the state is used in, and `textbox` is not one of them. So a
  textbox has no attribute that says a list is open, and the opening of the
  list is said by the announcement below.
- `aria-haspopup`. The section "aria-autocomplete property" asks for it of an
  element whose `aria-autocomplete` is `list`: "a value for aria-haspopup that
  matches the role of the element that contains the collection of suggested
  values." With no `aria-autocomplete` it is not owed.

The region keeps `role="textbox"` with `aria-multiline="true"`, which the
application sets. It is not given `role="combobox"`: the value of a combobox
is one line of text, and a document is not.

**While the query is typed, no option is named.** The first match is marked
as active from the moment the list opens, because that is the option Enter
chooses. A screen reader that follows `aria-activedescendant` would say that
option again over each character of the query, and would say it in place of
the character when the writer reads the query back with Left and Right. So
`optionListAttributes` sets `aria-activedescendant` only where `navigating` is
true, and `optionListNavigating` says what it is: true after Down, Up, Page
Down or Page Up, and false after every other key. The application calls it for
every `keydown`, as the example does, with `null` while the list is closed.
The mark on the row does not depend on it.

Enter with nothing moved chooses the marked first match. That is what a
writer who sees the list expects. A writer who hears it has been told the
count and not the first option, unless `announceActive` is on, and can press
Down and then Up to hear it.

**The announcement.** `OptionList` holds a polite status region and gives it
`status`, or `empty` when there are no options. The region follows the text
`announceAfterMs` after it last changed, which is 500 unless the application
says otherwise. A writer who types three letters one after another hears the
count they stopped on, and a key that leaves the count unchanged is not announced.
Closing empties the region, so the next opening is announced again.

Both texts are the application's, and the Expression Guidelines apply to them
as to any copy. `status` is the count and what is counted, in sentence case and
with a singular form: "1 block", "3 blocks". `empty` follows the formula for an
empty state, which is what the space is for and how to start: "No block
matches. Delete a letter to see more." It does not say that the writer did
something wrong.

**The active option, said by the status region.** This is off unless the
application passes `announceActive`, a function from the option, its index
from 0 and the count to the words to say:

```tsx
<OptionList
  announceActive={(option, index, count) => `${option.label}, ${index + 1} of ${count}`}
  …
/>
```

It is for a screen reader that does not follow `aria-activedescendant` out of
an editable region, where a writer would otherwise hear the count and then
nothing as they press Down. The same region is given one text at a time, in
this order.

| What happened | What the region is given |
|---|---|
| The list opened | The count once it has settled, and the active option 150 milliseconds after it |
| A move in the list | The active option, 150 milliseconds after the move. A held key says where it stopped |
| The filter changed | The count once it has settled, where it changed. Then the active option, where it changed |
| A move while a count is waiting | The count first, once it has settled, and the option after it. Neither is dropped |

The 150 milliseconds are a constant of the component and not a prop. An option
that is active again after the count, and was the last one said, is not said
again.

With `announceActive` on, a screen reader that does follow
`aria-activedescendant` says each option twice: once from the attribute and
once from the region. The package cannot tell which kind of reader is running,
and no browser says. So a product turns this on according to what a person
finds with the screen readers it supports, by the script under "What to test
with a screen reader before shipping" below, and not by default.

**A press does not move focus.** The default of `pointerdown` and of
`mousedown` is prevented over the whole list, so the text keeps its focus and
its selection, and a phone keeps its keyboard up. The option is chosen on the
click that follows, so a finger that scrolls the list chooses nothing. The
pointer makes an option active when it moves onto it, and not when the list
scrolls under a pointer that is still.

The text of the list cannot be selected: the stylesheet sets `user-select:
none` on it. A page has one selection. A right-click, a Control-click or a
long press selects the word under it wherever text can be selected, and on an
option that took the selection out of the text being written while focus
stayed there. The context menu itself is not prevented. It does no harm once
there is nothing to select, and it holds what the browser and its extensions
put there.

**Placement.** `anchor` is the cursor: a rectangle `{ x, y, width, height }` in
viewport coordinates, or a function that returns one. Pass the function. The
list is placed again when the page or any container scrolls, when the window
changes size, and when the visual viewport changes, and only a function can
say where the cursor has gone. A function that returns the rectangle of the
`/`, and not of the caret, keeps the list still while the query is typed.

A function that returns `null`, for a cursor no longer in the document, leaves
a placed list where it is. A list that has not been placed yet is put at the
start of the top of the viewport, 16 pixels in, and moves to the cursor at the
next placement that has one. It is not left unplaced, because the stylesheet
hides an unplaced list and the keys and the text region's attributes would go
on as if it were there. It is not dismissed either: a cursor with no
rectangle is a fault in the application's function and not a choice the
writer made, and a list in the corner is a fault that can be seen.

There is one trap in reading the cursor, and `cursorRectangle` above steps
round it. A collapsed range in an empty block has no client rectangles, and
its bounding rectangle is all zeros. That is a rectangle and not `null`, so a
function that returns it sends the list to the top left corner of the
viewport. Return the rectangle of the block that holds the cursor in that
case.

The list opens under the cursor. Where the whole of it does not fit there it
opens above. Where it fits on neither side, as at 200% zoom, it takes the side
with more room and is held to that room, so the line being typed in is not
covered and the list scrolls. Sideways it starts at the cursor and is moved in
to stay 16 pixels from each edge of the viewport. It is 20rem wide, or the
viewport less those margins where that is less, which is 288 pixels at a width
of 320. A label that does not fit wraps and is not cut short.

The viewport here is the visual viewport, where the browser has
`window.visualViewport`: the part of the page a person can see. An on-screen
keyboard makes it shorter than the layout viewport in Safari on iOS, and in
Chrome on Android as that browser is set by default, and a pinch-zoomed page
shows a part of the layout viewport that starts somewhere inside it. The list
is placed inside what shows, and again when the keyboard comes or goes. In a
browser without `visualViewport` it is placed in the layout viewport.
`placeOptionList` takes the viewport as a rectangle, `{ x, y, width, height }`
in the anchor's coordinates, with `x` and `y` at 0 unless given.

The list is `position: fixed`, and where the browser has the Popover API the
component also shows it as a manual popover, in the top layer. An ancestor that
clips its overflow does not clip the list. In a browser without the Popover
API, an ancestor with a `transform`, a `filter`, or `contain` still positions
and clips a fixed box, so render the list outside such an ancestor there. The
position is written to the element's `style` by script. No stylesheet is
injected.

The top layer does not lift the list out of an inert page. A modal `<dialog>`
makes everything outside itself inert, a popover included, so render the list
inside the dialog that holds the text.

**Rows.** The list shows `maxVisible` rows, 8 unless given, and scrolls. The
active option is scrolled into view when it changes. A row is 32 pixels high
at its least and grows with its text. The height the list is held to is
counted in rows that grow the same way, so a reader who has raised the text
size alone still sees `maxVisible` rows, where the viewport has room for them
(WCAG 1.4.4). The active row is marked by a boundary in `--accent` and the
accent wash together, and by the system's selection colours in forced colours.
Nothing in the list moves or fades.

**What Escape leaves behind.** A dismissed list leaves the `/` and the query
in the document as text. The list then stays closed for that `/`: the next
letter typed after it does not open it again. An application that derives
`open` from "there is a `/` before the cursor" alone reopens the list at every
letter, and a writer who uses a screen reader, and pressed Escape to get back
to the text, is put back in the list each time. So the application remembers
the dismissal until the trigger character is typed again, as `dismissed` does
in the example, and a press outside and a blur are remembered the same way.

Inside a modal surface, one Escape closes the list and the next closes the
surface. `useModalSurface` ignores an Escape whose default was prevented, and
the application prevents it for every key `optionListKey` answers.

**What it does not do.** It does not open itself, filter, or remember what was
chosen. It handles no key. It does not group options or draw icons. It does not
choose an option on Tab, and an application that wants that reads Tab in its
own handler. It does not close when focus leaves the text: the application
closes it, as `onBlur` does above. Closed, it renders nothing, so no part of a
closed list is in the accessibility tree.

It does not warn of misuse. The package has no development-only code path, and
this control does not add the first one. Two mistakes are silent, and are the
application's to test for: an option `id` that holds white space, which is not
a valid element id, and a list that is open while no element in the page
carries `aria-controls` naming it, which is a text region that was not given
`optionListAttributes`.

#### What to test with a screen reader before shipping

The list has not been heard in a screen reader. Support for
`aria-activedescendant` on an editable region differs between screen readers,
and two decisions are left to a person who can listen: whether `announceActive`
is on, and whether an option's `detail` belongs in its name. Run this with each
pair of screen reader and browser the product supports, with `announceActive`
off and `detailInName` as it is by default.

1. Put the cursor in the text and type the trigger character. Expect the
   character, and then the count: "12 blocks". Expect no option to be said.
2. Type two letters of a query without a pause. Expect each letter, and then
   one count, of the options left. Expect no option to be said over a letter.
3. Press Left, then Right. Expect the character the cursor passes, as in any
   text. An option said here is a defect in the application's `navigating`.
4. Press Down. Expect the second option to be said, and the cursor to stay
   where it is. If nothing is said, or the line of text is said, this screen
   reader does not follow `aria-activedescendant` from an editable region:
   pass `announceActive` and start again from step 1.
5. Press Down three times without a pause, then Up. Expect the option each
   press stops on, once. With `announceActive` on, an option said twice means
   this screen reader does follow the attribute, and is better off without it.
6. Listen to an option that has a detail: "Heading 1 /h1". Decide whether the
   detail helps or delays. If it delays, pass `detailInName={false}`, which
   takes the detail out of the name and leaves it on the page, and listen again.
7. Type one more letter. Expect the letter, then the new count after a pause.
   With `announceActive` on, expect the first match after the count.
8. Type until nothing matches. Expect the `empty` text, once.
9. Press Escape. Expect the list to close and the cursor to be where it was.
   Type a letter: expect the letter and no list. Read the line: expect the `/`
   and the query as text. Type the trigger character again: expect step 1.
10. Open the list and press Enter: expect the first option to be inserted.
    Then, with a touch screen reader, move to an option by touch and
    double-tap it: expect it to be chosen and the keyboard to stay up.

Not covered by any test in the package: a screen reader, Firefox, Safari, a
touch device, and an input method that composes.

### The callout, in the editor

```tsx
<Callout type="warning" icon label="Warning">…</Callout>
```

`icon` draws the type's own icon, and `label` is the type in the application's
words. With no title the label names the note. With a title the label is the
icon's text alternative. `warning` is the same type as `warn`, under the name
the editor uses. A callout that passes neither `icon` nor `label` renders what
it rendered at 0.26.0.

An editor that renders the callout's markup itself, so that its body can be
edited, writes the same classes:

```html
<aside class="callout" data-type="warning" data-icon role="note" aria-label="Warning">
  <span class="callout-icon"><!-- TriangleAlertIcon --></span>
  <div class="callout-body">…</div>
</aside>
```

The three icons are `StickyNoteIcon` for a note, `TriangleAlertIcon` for a
warning, and `LightbulbIcon` for a tip.

For the type of a callout and for the depth of a table of contents, three
answers each, use a `RadioGroup`. A person sees all three at once.

### The code block

```tsx
<div className="ekd-code">
  <div className="ekd-code-header">
    <Select label="Language" labelHidden size="small" value={language} onChange={setLanguage}>
      {languages.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
    </Select>
    <Button variant="quiet" onClick={copy}>Copy</Button>
  </div>
  <pre><code className="hljs language-typescript">…</code></pre>
</div>
```

The header is a row with two Tab stops and is not a toolbar. The code scrolls
inside the block. Outside an editor, where no caret reaches it, give the `pre`
`tabIndex={0}`, a role, and a name, so that a keyboard can scroll it.

The colours answer to the class names highlight.js writes, which lowlight
writes too. Six tokens carry them, `--syntax-keyword`, `--syntax-string`,
`--syntax-number`, `--syntax-title`, `--syntax-attr`, and `--syntax-comment`,
each held at 4.5:1 on the block's surface in all eight palettes. A keyword is
also a step heavier and a comment is also italic.

| Token | highlight.js classes |
|---|---|
| `--syntax-keyword` | `hljs-keyword`, `hljs-selector-tag`, `hljs-name`, `hljs-doctag`, `hljs-variable.language_` |
| `--syntax-string` | `hljs-string`, `hljs-regexp` |
| `--syntax-number` | `hljs-number`, `hljs-literal`, `hljs-symbol`, `hljs-bullet`, `hljs-char.escape_` |
| `--syntax-title` | `hljs-title` with its sub-scopes, `hljs-section`, `hljs-selector-id`, `hljs-selector-class` |
| `--syntax-attr` | `hljs-attr`, `hljs-attribute`, `hljs-variable`, `hljs-template-variable`, `hljs-template-tag`, `hljs-type`, `hljs-built_in`, `hljs-property`, `hljs-selector-attr`, `hljs-selector-pseudo` |
| `--syntax-comment` | `hljs-comment`, `hljs-quote`, `hljs-meta` |

`hljs-emphasis`, `hljs-strong`, and `hljs-link` are drawn italic, bold, and
underlined. `hljs-addition` and `hljs-deletion` take the success wash and the
danger wash. `hljs-operator`, `hljs-punctuation`, `hljs-params`, `hljs-subst`,
`hljs-tag`, `hljs-formula`, and `hljs-code` are left in the ink of the code.

### The document surface

`ekd-editor` goes on the editable root. Under it, the blocks and the marks are
styled by element, so an editor that writes plain HTML needs no class for
them.

- Prose is the reading serif at `--fs-md` with `--lh-prose`. Running text is
  capped at `--measure`; a table, a code block, and a callout take the width
  of the column the application gives the editor.
- Headings 1 to 3 are `--fs-2xl`, `--fs-xl`, and `--fs-lg`.
- The nine marks are `strong`, `em`, `u`, `s`, `code`, `sup`, `sub`, `a`, and
  `mark`. A link is the accent, underlined, and a step heavier, so that it
  differs from underlined text by more than a hue. A highlight is `--hl-mark`.
- The caret is `--fg-1`, and the selection is the reset's. A selection across
  a highlight is drawn in the accent, so that it can be seen.
- Focus on the root draws the reset's focus ring. The stylesheet does not
  remove it.
- A document or a block marked `lang="el"` is set in the sans, because the
  serif has no Greek. A Greek phrase inside a document in another language is
  not caught and is drawn in a substituted face.

A table scrolls inside its own wrapper at every width. Its styles are not
`styles/table.css`, which draws a card with a sticky header and expects `thead`
and `tbody`: an editor's table has header cells in any row and any column.

This is the contract. An application's editor writes these names, and the
package styles them.

| The editor writes | On | What it is |
|---|---|---|
| `class="ekd-editor"` | The editable root | The document surface |
| `lang="el"` | The root, or any block or span | Text in Greek, set in the sans |
| `h1`, `h2`, `h3`, `p`, `ul`, `ol`, `li`, `blockquote`, `hr` | Elements | The blocks, with no class |
| `strong`, `em`, `u`, `s`, `code`, `sup`, `sub`, `a`, `mark` | Elements | The nine marks, with no class |
| `data-placeholder="…"` | A block, while it is empty | The prompt shown in it |
| `data-node-selected` | A block selected as a whole | An outline in the accent. `ProseMirror-selectednode` is answered too |
| `class="ekd-table-wrap"` | The element round a `table` | The scroll container. `tableWrapper` is answered too |
| `th`, `td` | Table cells | A header cell and a cell, in any row or column |
| `data-cell-selected` | A `th` or `td` | A selected cell, and each cell of a selected range. `selectedCell` is answered too |
| `class="ekd-column-resize"` | An element inside a cell | The handle on the column's edge. `column-resize-handle` is answered too |
| `data-column-resizing` | The root, while a column is dragged | The resize cursor. `resize-cursor` is answered too |
| `class="ekd-table-caption"` | A `figcaption` or `p` after the wrapper | The caption under a table |
| `class="ekd-page-break"` | A block, with the label as its text | A page break |
| `class="ekd-toc"` | A `nav`, named by its title | The table of contents |
| `class="ekd-toc-title"` | A `p` or a heading in it | Its title |
| `class="ekd-toc-list"` | An `ol` in it | The entries |
| `data-level="1"`, `"2"`, `"3"` | Each `li` of that list, holding one `a` | The depth of an entry |
| `class="ekd-code"` | The element round a header and a `pre` | A code block |
| `class="ekd-code-header"` | The first element in it | The row for the language and the copy button |
| `class="hljs-…"` | Spans in `pre code` | The syntax scopes of highlight.js |
| `class="callout"`, `data-type`, `data-icon` | An `aside` with `role="note"` | A callout. `data-type` is `note`, `warning`, or `tip` |
| `class="callout-icon"`, `class="callout-body"` | Its two children | The icon and the text |

The names in the second sentence of a row are the ones one widely used table
plugin and its editor write, and they cannot be changed from an application.
The package's own name comes first and is the one to use where there is a
choice.

Three things are the application's and not here: where a floating toolbar is
placed, a collaborator's caret and selection, which take the `--collab-N`
tokens, and the white-space handling its editor needs on the root.

---

## Application chrome

Chrome that every application had written for itself, two or three times
over, and that had already drifted apart. Each takes its words from
the application and imports no router: where a copy read the route from
`next/navigation`, the component takes the route as a key instead.

### The access gate

`AccessGate` is the passcode page a pre-release site shows in place of itself.
It holds no state, so a server component renders it with a server action, and
its one client piece is the submit button.

```tsx
import { AccessGate } from '@ekdotico/domico/components';
import '@ekdotico/domico/styles/access-gate.css';

<AccessGate
  eyebrow="Ekdotico"
  title="Enter the access code"
  lede="This site is restricted while it is in development. Enter the four-digit access code to continue."
  contact={<>If you do not have a code, write to <a href="mailto:…">…</a>.</>}
  digits={4}
  action={submitPasscode}
  error={wrong ? 'The access code is incorrect. Check the code and enter it again.' : undefined}
  notice={limited ? `The limit of five attempts in fifteen minutes has been reached. Try again ${retryIn}.` : undefined}
  from={from}
/>
```

The gate is the page, so it renders the `<main>` landmark and no dialog role;
render it outside any layout that has a `<main>` of its own. `error` marks the
field invalid and `notice` does not, because a rate limit says nothing about
the code, and the field is described by whichever message is on screen. The
field takes a one-time code from the phone's keyboard, offers the numeric
keypad, and expects exactly `digits` digits.

The submit button is `GateSubmitButton`, exported on its own for a form laid out
differently. While the action is in flight it is marked `aria-disabled` and
refuses a second press, and it keeps focus, which `disabled` would drop to the
top of the document. It reads the form's status from React 19; pass `pending`
to drive it yourself. The package supplies three defaults, the ones all three
gates shared: "Access code", "Unlock", and "Checking the code…". Everything
else on the screen is the application's to write.

### The navigation drawer

`NavDrawer` is the slide-in navigation for viewports of 920px and narrower. The
navigation inside it is the application's own, passed as children.

```tsx
import { NavDrawer } from '@ekdotico/domico/components';
import '@ekdotico/domico/styles/nav-drawer.css';

<NavDrawer label="Site navigation" closeKey={pathname}>
  <Sidebar idPrefix="drawer" />
</NavDrawer>
```

It keeps the whole modal promise through `useModalSurface`, and it closes
whenever `closeKey` changes. A swipe in from the start edge opens it, and a
swipe back across it closes it. `open` and `onOpenChange` put it under outside
control, for a shortcut that opens it on its search field, which
`initialFocusRef` then names. The trigger renders where the component is
placed, shows at 920px and below, and is the application's to position.

### The on-this-page rail

`OnThisPage` lists the page's headings and marks the one being read with
`aria-current="location"`. It reads a heading's own id and gives one only to a
heading that has none, de-duplicated against every id in the document.

```tsx
import { OnThisPage } from '@ekdotico/domico/components';
import '@ekdotico/domico/styles/on-this-page.css';

<OnThisPage root=".content-inner" rescanKey={pathname} />
```

`selector` defaults to `h2, h3` and `label` to "On this page", which is both
the visible label and the name of the `<nav>`. A child of a heading matching
`badgeSelector`, `.badge` by default, keeps its classes in the rail. Where the
rail sits in a layout, and the width below which it is hidden, are the
application's.

### The opening sequence

`OpeningSequence` draws the mark, fades in the wordmark, and lifts, once per
session under a key every surface shares. A reader who asks for reduced motion
never sees it. It never takes a press, the page beneath it is inert while it
covers it, and it waits at most 400ms for webfonts before starting.

```tsx
import { OpeningSequence } from '@ekdotico/domico/components';
import '@ekdotico/domico/styles/opening-sequence.css';

<OpeningSequence />   {/* first in the body; sessionKey defaults to ekd:intro-shown */}
```

---

## The expression layer

The Expression Guidelines govern all copy produced under the Ekdotico name,
across the product interface, the documentation, marketing materials, and
institutional surfaces. The canonical copy lives here, at
`expression/guidelines.md`, and is versioned and released with the package.

A copy held inside a consuming repository is stale by definition. That is the
point: the guidelines previously existed twice, both copies labelled version
0.2, and they had already diverged on the controlled vocabulary.

The controlled vocabulary and the prohibited terms are also structured data:

```ts
import { vocabulary, prohibited, rulesFor, canonicalFor } from '@ekdotico/domico/expression';

// Only the rules that apply within one register. A prohibition scoped to the
// provenance/institutional register is never fired against marketing copy.
const rules = rulesFor('marketing-awareness');

// Resolve a non-canonical term to the one that should be used instead.
canonicalFor('tasks tab'); // -> { canonical: 'Task tracker', ... }
```

Every prohibition carries its reason and its replacement. A finding that says a
term is prohibited without saying what to use instead is an incomplete error
message, which is itself a System Feedback register violation.

### The copy linter

`ekdotico-lint` reads the structured data and holds no copy of the rules, so
changing a prohibited term means editing one file.

```bash
pnpm add -D @ekdotico/domico
pnpm exec ekdotico-lint "app/**/*.mdx"
```

Configure it in `.ekdotico-lint.json`:

```json
{
  "files": ["app/**/*.mdx", "components/**/*.tsx"],
  "failOn": "substantive",
  "registers": {
    "app/vision/**": "marketing-awareness",
    "app/design/**": "instructional",
    "components/CommandPalette.tsx": ["functional", "system-feedback"]
  },
  "overrides": [
    {
      "files": "app/legal/**",
      "rules": ["controlling-obligation"],
      "reason": "Statutory wording, reviewed by counsel 2026-08-01."
    }
  ]
}
```

`--warn-only` reports findings and exits 0. Use it for a first run against
content that has never been linted, so the size of the problem is visible
before anything blocks.

`registers` maps a path to the register its copy is in. **Register-scoped rules
run only where a register is declared.** The linter does not infer one, and it
reports how many rules it skipped for want of one — a wrong register would fire
provenance rules at marketing copy, which is worse than not firing them.

A path may declare a **list** of registers. This is not a hedge; it is the case
§5.6 Step 4 describes as ordinary, where one file carries copy from several
registers at once. A command palette is Functional in its labels and System
Feedback in its empty and error states, and declaring only the first means the
three blocking System Feedback rules never run against the error copy they were
written for. Every declared register's rules run, so a list only ever widens
what is checked.

The one combination to avoid is pairing `provenance-institutional` with any
other register in the same file. That register is defined by what it forbids —
second person, hedging — rather than by what it names, so pairing it with
Instructional copy flags every legitimate "you". If a file genuinely holds both,
§5.6 Step 4.4 already classifies that as a structural problem to resolve by
splitting the file, not by tuning the linter.

First match wins, so order entries from most specific to least. A trailing
`"app/**"` catch-all is worth keeping: an undeclared file silently skips nine
rules, and the report counts them but does not name the file.

Findings are written in the System Feedback register, because that is the
register they belong to. Each states what was found, where, why it is a
violation, and what to use instead:

```
  app/vision/page.mdx:22:67  blocking  [vocabulary/pdf-reader]
    Found: "PDF annotator"
    Why:   "PDF annotator" is a non-canonical term for the PDF reading and
           annotation surface. Every concept has exactly one canonical term.
    Use:   Use "PDF reader".
```

<!-- eg:cite -->
Some findings carry `Note: This pattern is not conclusive on its own.` Those
are variants that are also ordinary English — "faculty", "works cited",
"paper". They report as substantive and ask for confirmation rather than
blocking, because a faculty dashboard is a faculty dashboard.

### Overrides

The failsafe process permits an override with recorded rationale. It does not
permit a bare suppression, so **an override without a reason fails the build**,
and it fails louder than the finding it was silencing. A silent suppression is
worse than an unfixed violation, because it removes the evidence that anything
was ever wrong.

Inline, for one occurrence:

```html
<!-- ekd-lint-disable-next-line controlling-obligation — statutory wording, reviewed by counsel 2026-08-01 -->
```

Or by path, in the `overrides` block above. Both forms require a rationale of
at least eight characters, and overridden findings stay visible in reports so
they can be audited rather than forgotten.

### What is exempt automatically

A prohibited term inside a code fence, an inline code span, a prohibited-terms
table, or a quoted counter-example is data, not copy. Those are exempt
structurally, along with frontmatter, URLs, and the allowlisted identifiers
(`SHA-256`, `Ed25519`, DOIs, requirement IDs, `Chicago Notes-Bibliography`).

A quoted span is exempt only when its line also carries a contrast marker —
"not", "never", "rather than", "instead of". `The button reads "Please wait"`
is still a finding.

For anything else quoted as an example, mark it:

```html
<!-- eg:cite -->
```

### What the linter does not check

Stated plainly, because a linter that implies full coverage produces false
confidence, which is worse than no linter.

Mechanically checkable: prohibited terms, non-canonical vocabulary where a
canonical term is defined, product name spelling, emoji, exclamation marks,
contractions, hyphens where a dash is required, and unsubstantiated
superlatives.

**Not checkable, and never claimed:**

- Register classification. This needs judgement that pattern matching cannot
  supply, and a classifier that appears to work while being wrong is worse than
  no classifier.
- Evaluative inference. "Relevant results" and "ranked results" are lexically
  near-identical; only one of them is evaluative.
- Comparative inference beyond a handful of fixed phrases.
- Deficit framing.
- Anthropomorphism. "The research workspace searches" is correct; "Ekdotico
  learns your preferences" is not.
- Error message completeness, and the confirmation dialog formula.
- Whether a claim can be substantiated by the product or the provenance record.
- Factual currency, meaning whether copy describes an architecture that still
  exists.

These remain the responsibility of the failsafe agent and of human review. The
full list is machine-readable under `notEnforced` in
`expression/prohibited.json`, and the register diagnostic framework the agent
works from is at `expression/registers.md`.

### Quoted examples

The guidelines necessarily contain every term they prohibit, always as cited
counter-examples. Those citations are data, not copy. The linter exempts them
structurally, and any other document quoting a prohibited term for the same
reason marks it with `<!-- eg:cite -->`.

---

## Proposing a change

### A token change

1. Confirm no existing token covers the need. Search `tokens/source/` end to
   end.
2. Open a proposal stating the name, the value for every theme and mode,
   when to use it, when not to use it, and the related tokens considered.
3. Wait for core team approval. A new design need becomes a new token, never a
   literal in a component.
4. Add it to `tokens/source/`, across all eight combinations for a colour
   token.
5. Run `pnpm build:tokens`. Never edit anything under `tokens/generated/` by
   hand — `pnpm check:generated` rebuilds and compares, and a hand edit fails
   the build.
6. Add a changeset: `pnpm exec changeset`.
7. Verify visually at all four themes across both modes.

Colour values are authored in OKLCH. Convert exactly rather than by eye, and
keep the accessible value where a contrast remediation has already been
applied; `--gilt` is darker than the original brand value for exactly that
reason.

### Typography

The three families are Crimson Pro, Commissioner, and Fira Code, wired through
the `--font-serif`, `--font-sans`, and `--font-mono` tokens.

Reference the token, never the family. This applies to prose rules as much as
to stylesheets: the Expression Guidelines rule requiring a monospace face for
cryptographic identifiers names `--font-mono`, so it survives a change of face.
It previously named a family, and that put a language rule in conflict with the
design system the moment typography was revisited.

### A vocabulary addition

The process is in the guidelines at §7.5. In short:

1. Propose the term with a one-sentence rationale.
2. The core team reviews it against four criteria: unambiguous in the Ekdotico
   product context, not overlapping an existing term, compliant with the
   applicable register rule, and not a metaphor.
3. On approval, add it to `expression/vocabulary.json` with its rationale, its
   known non-canonical variants, and the version introducing it.
4. Run `pnpm build:expression`. The prose table in the guidelines and the
   linter rule set regenerate together, so they cannot fall out of sync.
5. Add a changeset.

If a concept recurs in the content but has no canonical term, that is a gap in
the guidelines, not a failure of the content. Record it under `gaps` in
`expression/vocabulary.json` rather than inventing a rule. Gaps route to the
core team.

---

## Working on this package

```bash
pnpm install
pnpm build          # tokens, expression, types, styles
pnpm check          # drift gates and type check
```

| Command | Purpose |
|---|---|
| `pnpm build:tokens` | Regenerate the token artefacts from `tokens/source/` |
| `pnpm build:expression` | Regenerate the guidelines tables and `registers.md` from the JSON |
| `pnpm check:generated` | Fail if a generated token artefact was edited by hand |
| `pnpm check:expression` | Fail if the prose and the structured data disagree |
| `pnpm check:consumers` | Report which repositories in the organisation are behind the published version |

`check:consumers` is deliberately outside the `pnpm check` aggregate. It reads
the GitHub API rather than this working tree, so it needs a network and a token
that can see the organisation — `EKDOTICO_SUITE_TOKEN`, with Metadata and
Contents read across the organisation's repositories. Putting it in the
aggregate would make every pull request depend on an external service to
answer a question that has nothing to do with the change under review.

It runs on its own in `.github/workflows/consumers.yml`, on every published
release and monthly as a backstop, and opens one reused issue when a consumer
is behind. **It does not open a pull request bumping anybody's pin, and that is
the point rather than a limitation.** Every consumer pins exactly so that an
unreviewed visual change cannot reach an application through a routine install,
and their specifications require an upgrade to be reviewed across four themes in
both modes. A bot that bumps the pin automates past the gate the exact pin
exists to hold. The issue is the notification; a person does the review and
raises the bump.

A pin carrying a caret or a tilde is reported more urgently than one that is
behind: a range means the next install in that repository moves the design
system with nobody deciding to.

### Running the guards from a consuming repository

The drift gates were unavailable outside this repository, so no consuming
application could make any of them a blocking check. `ekdotico-check` exposes
them:

```bash
pnpm exec ekdotico-check              # every guard a consumer can run, except decay
pnpm exec ekdotico-check contrast
pnpm exec ekdotico-check decay        # the monthly audit, on its own clock
pnpm exec ekdotico-check --list
```

A command rather than a documented path into `node_modules`. A consumer
invoking a script file by path depends on this package's internal layout, which
then cannot change without breaking every pipeline that was never told it was
coupled to it.

**The no-argument form is derived from the guard table, not listed.** It named
`contrast`, `styles` and `appearance` while this section claimed it ran
everything a consumer could, so the shortest invocation was also the one that
checked the least — neither `discipline` nor `a11y`, the two guards written for
consumers, was in it. Deriving it is what makes a guard added here arm itself in
every application at its next pin bump, rather than waiting for a workflow edit
in each that nobody remembers is owed. Run `--list` for the set, which prints it
from the same table rather than restating it.

`decay` is the one guard a consumer can run that the no-argument form leaves
out. It reads instruction documents, which do not change on most commits, so it
belongs to a monthly audit workflow; running it per-change makes it noise, and
noise is how a gate stops being read.

Six guards run only here, and say so rather than failing on a missing import:
`generated` rebuilds the tokens, `expression` validates the authoring schemas,
`exports` packs this package, `svg` builds a DOM with jsdom, `components`
renders the shared components and the accessibility helpers into jsdom, and
`icons` compares against `lucide-static`. Each needs a development dependency that is
never published. `icons` was the odd one out until the default set stopped being
a hand-written list — it noted the dependency in its description and nowhere
else, which was survivable while nothing picked it up automatically and would
have been a red pipeline in three applications the moment something did.

The guards that audit the calling repository rather than this one are
`discipline`, `a11y`, `copy`, `styles` and `decay`, so each takes a directory —
though every one of them defaults to the working directory, which is the form
with nothing to get wrong:

```bash
pnpm exec ekdotico-check a11y .
```

`copy` wraps the `ekdotico-lint` binary, so the copy check reaches a consumer
from the same place as every other gate. Where a repository ships no
`.ekdotico-lint.json` it says on stdout that it checked nothing and exits 0: a
skip nobody can see in the log is the fails-green shape this CLI refuses
elsewhere.


Everything under `tokens/generated/` and both generated regions of
`expression/guidelines.md` are build output. They are committed so a consumer
can read them without building, and both drift gates run in CI.

`pnpm check:expression` also fails when `vocabulary.json`, `prohibited.json`,
and the guidelines header do not declare the same version. That check exists
because the specific failure that prompted this package was two documents
claiming the same version number while saying different things.

---

## Licence

Copyright © 2026 Ekdotico.

GNU Affero General Public License, version 3 only (`AGPL-3.0-only`). The full
text is in [LICENSE](./LICENSE), which ships in the tarball. Versions up to and
including 0.23.1 were published under the proprietary licence they carry, and
stay under those terms.

The licence covers copyright and grants no rights in trade marks. The Ekdotico
name, the Ekdotico logo mark, and the Ekdotico wordmarks are trade marks of
Ekdotico, and [TRADEMARKS.md](./TRADEMARKS.md) says what that means for the
files under `assets/logo`.

Third-party material keeps its own licence. The three typefaces are each
licensed under the SIL Open Font License 1.1, and the package ships loading
configuration, not font files. The icons are Lucide, vendored, under the ISC
licence. [THIRD-PARTY-NOTICES.md](./THIRD-PARTY-NOTICES.md) carries the
notices.
