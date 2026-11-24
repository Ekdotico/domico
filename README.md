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
| `@ekdotico/domico/styles/frame.css` | The wide-screen frame: above 1920px the body is capped and centred on a slightly darker ground. Not in `styles.css`; taken by importing it |
| `@ekdotico/domico/styles/badge.css` | One entry per component. The rest are `callout.css`, `figure.css`, `keyvalue.css`, `logo.css`, `section-rule.css`, `stat.css`, `table.css`, `margin-note.css`, `tabs.css`, `access-gate.css`, `nav-drawer.css`, `nav-shortcuts.css`, `on-this-page.css`, `doc-meta.css`, `opening-sequence.css`, `button.css`, `form.css`, `dialog.css`, `tooltip.css`, `page-heading.css`, `toolbar.css`, `menu.css`, `option-list.css`, `sync-status.css`, `avatar.css`, `editor.css`, and `code.css` |
| `@ekdotico/domico/components` | The shared React components |
| `@ekdotico/domico/icons` | The icon set: domico's own, built on Tabler, vendored, at the house stroke weight |
| `@ekdotico/domico/theme` | Theme and mode switching, and the first-paint init script |
| `@ekdotico/domico/a11y` | `useModalSurface` and `inertOutside` for a modal surface, `isShortcut` and `shortcutLabel` for a ⌘/Ctrl chord, `useNavShortcuts` and `attachNavShortcuts` for numbered navigation shortcuts, and `attachImageResize` for the handle on an image block |
| `@ekdotico/domico/fonts` | Font loading configuration for the three locked families |
| `@ekdotico/domico/color` | `oklchToHex` and the rest of the package's OKLCH and sRGB maths, for a surface that cannot paint `oklch()`, such as an Open Graph image |
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
the default. Always write it: the dark tokens are keyed on `[data-theme=…]`, so
a document with no `data-theme` has no dark palette, whatever `data-mode` says.
`appearanceAttributes` and `themeInitScript` write `parchment` when the reader
has chosen nothing.

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

Escape has one rule for anything inside the surface that reads it: prevent the
default when the key was used, and only then. The hook listens on the
document, so a handler inside the surface runs first, and `defaultPrevented` is
all the hook can read of what that handler did. It does not call `onClose` for
an Escape whose default was prevented, so a menu or a list at the text cursor
closes on one Escape and the surface on the next. A handler that prevents
every Escape it sees leaves the surface with none, and a keyboard reader with
no way out. A handler that closes something of its own and prevents nothing
closes the surface with the same key. The hook also leaves an Escape pressed
while an input method is composing, which cancels the composition and nothing
else.

`inertOutside` is the inert half on its own, for a surface that manages the
rest itself. `isShortcut(event, 'k')` answers to ⌘K on Apple platforms and
Ctrl+K elsewhere — never both, so Ctrl+K is left to a macOS text field — and
`shortcutLabel('k')` gives the same chord for the screen and for
`aria-keyshortcuts`. All four read the document or the platform, so call them
from an effect or an event handler, not during render.

### Navigation shortcuts

`useNavShortcuts` numbers the first nine items of a navigation. Shift and a
digit follows the item with that number, as a click would, and holding Shift
alone shows each number as a badge at the end of its row.

```tsx
import { useNavShortcuts } from '@ekdotico/domico/a11y';
import '@ekdotico/domico/styles/nav-shortcuts.css';

const navRef = useRef<HTMLElement>(null);
useNavShortcuts(navRef, { enabled: preferences.navShortcuts });

<nav ref={navRef} aria-label="Site navigation">{links}</nav>
```

The navigation stays the application's. The hook renders nothing: it sets
`data-nav-shortcut` and `aria-keyshortcuts="Shift+3"` on each numbered item,
and `data-nav-shortcuts="visible"` on the navigation while the numbers are
shown, and the stylesheet draws the badge from those attributes. Items are
`a[href]` inside the navigation unless `items` gives another selector. An item
with no box, or inside an `inert` subtree, takes no number, so a link in a
collapsed group or in a closed drawer does not use one up.
`attachNavShortcuts(element, options)` is the same behaviour without React,
and returns the function that removes it.

| It does this | For this reason |
| --- | --- |
| Nothing while focus is in a text field, a textarea, a select or an editable region | Shift and a digit types a character there, and Shift is held for every capital letter |
| Shows the numbers only after Shift is held alone for `delay` milliseconds, 400 unless set | A capital typed elsewhere on the page does not flash them |
| Hides the numbers on releasing Shift, on any other key or modifier, on a pointer press, and when the window loses focus | The numbers are on screen only while they can be used |
| Matches the digit by its physical key | The character Shift and a digit types differs between keyboard layouts, Greek among them |
| Nothing with Ctrl, Alt or Meta held | Those chords belong to the browser and the platform |

The shortcut does not wait for the numbers: Shift and 3 works as soon as it is
pressed.

**An application that turns this on owes its readers a way to turn it off.**
Shift and a digit types a character, so WCAG 2.1.4 (Character Key Shortcuts)
applies, and a person who dictates text or presses keys by accident must be
able to switch the shortcut off. Offer that as a setting, remember it, and pass
it as `enabled`. Turned off, the items carry no number and no
`aria-keyshortcuts`.

The number is decorative. `aria-keyshortcuts` tells a screen reader the chord,
and the badge has an empty text alternative where the engine supports one. The
badge has no transition, and under forced colours its border keeps it a box.

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
| `Button` | Four variants, `primary`, `secondary`, `quiet`, and `destructive`, a pending state, and for `quiet` an `edge` (`start` or `end`) that sets its text on the edge of the column | `styles/button.css` |
| `ButtonLink` | The button's skin on an `<a>`, for navigation; the same four variants, no pending state | `styles/button.css` |
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
| `EditableTitle` | The page heading, edited where it stands, for the name of a document | `styles/page-heading.css` |
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

The count is the length of the string, in UTF-16 units. Where the server counts
otherwise, pass `count`, a function from the value to its number, and the
remaining number, the invalid state and the announcement all follow it:
`count={(text) => [...text.trim()].length}` counts code points after the white
space at both ends. It is called on every change, with the value as the browser
holds it, and is read only together with `maximum`.

`TextField`, `PasswordField`, `OneTimeCodeField`, `TextArea`, and `Checkbox`
each hand their native element to a `ref`. `Checkbox` takes `labelHidden`, for a
box in a row of a table, described under The table below.

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

### The editable title

```tsx
<EditableTitle
  label="Title"
  value={document.title}
  onSave={(title) => rename(document.id, title)}
  pending={renaming}
  error={renameError}
/>
```

`EditableTitle` is the page heading, edited where it stands: the name of a
document. It looks like `PageHeading` and has no box. A hairline shows on
hover, the focus ring on focus and a danger hairline when `error` is set. It is
the page's one `h1`, with the field inside it, so the heading outline holds. In
forced colours the field shows a border at rest, which is right: forced colours
exist to show where a control is. The hover colour is lost there, and the focus
ring and the danger border stay.

| Prop | |
|---|---|
| `value` | The saved title. The component holds the draft; a new `value` replaces it. |
| `label` | The accessible name. Required, with no default, and no placeholder or status text either. |
| `onSave(value)` | On Enter and when focus leaves, only if the draft differs from `value`. May return a promise. |
| `pending` | A save is in flight. Sets `aria-busy` and `aria-disabled`, ignores typing, Enter and Escape, and does not disable the field. |
| `error` | The message, under the heading, named by `aria-describedby`, with `aria-invalid` on the field. The tie holds with no `id` given: the component makes one of its own. |
| `maxLength` | The browser's own limit. |
| `readOnly` | Draws a `PageHeading`, the same `h1`, with no field. |
| `id`, `className` | `id` reaches the field, `className` the heading. |

It is a `textarea` so that a long title wraps as `PageHeading` wraps it; an
`input` is one line and scrolls sideways. A mirror of the value in the same grid
cell sets its height, so it needs no script to measure. A line break in a paste
becomes a space.

**Keyboard.** Enter saves and keeps focus. Escape puts `value` back and saves
nothing. Tab or a click away saves a change.

**Accessibility.** The name comes from `label` through `aria-label`, because a
visible label inside a heading would be read as part of the title. The field
is at least the height of its text, far over 24px. The message is not an alert;
state the fault where the page announces its faults. While a title is edited
the text is the textarea's, which cannot set a Greek run in the sans; in
`readOnly` it is `PageHeading`'s.

**When not to use it.** Not for a field that needs a visible label, a hint or a
place in a form: the heading names itself, and a field whose purpose is not
plain from where it stands is a `TextField`.

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

## The table

`Table`, `TableHead`, `TableBody`, `TableRow`, `TableHeaderCell` and `TableCell`
are the native elements in a card that scrolls at narrow widths, with the
styles in `styles/table.css`. `Table` takes a `caption` or a `label`, which
names the scroll area for a keyboard and a screen reader.

A header cell in `TableBody` is the header of its row. The stylesheet draws it
as one: the padding, the rules and the hover wash of a body cell, at the
heavier weight and the stronger ink, and without the small label type of a
column header.

```tsx
<Table caption="What each role may do">
  <TableHead>
    <TableRow>
      <TableHeaderCell scope="col">Role</TableHeaderCell>
      <TableHeaderCell scope="col">Rename</TableHeaderCell>
    </TableRow>
  </TableHead>
  <TableBody>
    <TableRow>
      <TableHeaderCell scope="row">Editors</TableHeaderCell>
      <TableCell>
        <Checkbox name="rename-editors" label="Editors can rename" labelHidden />
      </TableCell>
    </TableRow>
  </TableBody>
</Table>
```

`TableHeaderCell` takes the attributes of a `<th>`, and `TableCell` those of a
`<td>`, so `scope`, `colSpan`, `rowSpan` and `headers` type-check. **Nothing is
defaulted.** The same component is a column header in `TableHead` and a row
header in `TableBody`, and it cannot tell which, so it would guess wrong
somewhere. Say `scope="col"` or `scope="row"`. A browser works the scope out
for a table with a single header row or a single header column, so leaving it
off there is not a fault; a table with both, or with a row header past the
first column, needs it (WCAG 1.3.1, technique H63). Use `colgroup` or
`rowgroup` where one header covers several.

`TableCell` also takes `note`, for the margin notes of its row. The margin
note's section says where they are drawn.

`Checkbox` takes `labelHidden` for a box whose row header already says what it
is about. The label is kept for a screen reader and is not drawn, as `Select`
keeps its own, and it stays required: it is the box's name. The hidden words
are positioned against their own label, so they stay inside it and cannot lie
outside a scroll container that holds the box. A reset's `.sr-only` on a label
inside a table cell, where nothing is positioned, did not stay inside the
table's scroll area, and widened the page sideways. The label also shrinks to
the box, so the empty line beside it does not toggle it, and keeps a 24px
target (WCAG 2.5.8).

---

## The margin note

`MarginNote` is marginalia: a small italic aside with a hairline rule and an
optional label above it, with the styles in `styles/margin-note.css`. It is
for what belongs beside the text and not in it, such as an amendment.

```tsx
<MarginNote label={label}>{text}</MarginNote>
<p>The passage the note is about.</p>
```

It takes `label` and `children`, and writes no word of its own. It is an
`<aside role="note">` named by its label through `aria-labelledby`, as a
`Callout` is, so a page of notes adds nothing to the landmark list. The label
is a `<p class="ekd-margin-note-label">`, and the text is in a
`<div class="ekd-margin-note-body">`. It is text, so it is not a tab stop, and
it has no shadow.

The note has two forms. With no gutter it is a block in the text column, with
the rule on its start edge. Where there is a gutter it floats into the gutter
at the start of the text column, 200px wide, and the rule moves to the edge
that faces the text. Put it directly before the passage it is about.

The package cannot know whether a page has a gutter, so the application says
so. Set `--ekd-margin-gutter: on` on an ancestor of the text column, at the
widths where the gutter at the start of the column is at least 216px wide, and
set it to `off` wherever the gutter closes:

```css
@media (min-width: 1480px) {
  .content { --ekd-margin-gutter: on; }
  html[data-chat-open] .content { --ekd-margin-gutter: off; }
}
```

It is an optional property that the package reads and no palette defines, like
`--ekd-editor-placeholder-offset`: it is not a token, and unset there is no
gutter. The package reads it with a container style query. A browser without
style queries keeps the form with no gutter, and so does print.

### A note on a table row

Give the notes of a row to the **last cell** of the row, through `note`:

```tsx
<TableRow>
  <TableCell>{id}</TableCell>
  <TableCell note={<MarginNote label={label}>{amendment}</MarginNote>}>
    {requirement}
  </TableCell>
</TableRow>
```

`note` takes one `MarginNote` or several. They are rendered inside the cell,
after its content, so the table keeps its columns and its rows, and a screen
reader reads the note at the end of the row it belongs to:

```html
<td>
  <div class="tbl-noted">
    <div class="tbl-noted-text">…</div>
    <div class="tbl-notes"><aside class="ekd-margin-note" role="note">…</aside></div>
  </div>
</td>
```

With no gutter the notes are under the content of the cell. With a gutter they
stand in the same gutter as a note on a paragraph, at the start of the table
and level with the top of their row. The row is as tall as its notes, so the
notes of two rows never meet and none moves away from its row, however many a
table has.

The notes of a row take the gutter only above 920px. At 920px and below the
table scrolls inside its card, and a card that scrolls would clip a note moved
out of it, so there the notes stay under the content whatever the application
says of the gutter.

A declared gutter must be there. The notes are 200px wide and stand 16px from
the table, so the table needs 216px of free space at its start. The package
cannot see whether the space exists: an application that says there is a
gutter where there is none has its notes drawn over whatever is beside the
table, or off the page.

The table also needs a width from its parent. While there is a gutter the
wrapper of a table with notes is a size container, which takes no width from
its content. In a block parent, or as a flex or grid item that is stretched,
it is as wide as it was. In a parent that fits its content, such as a flex
item in a row, an inline-block, a float or a `max-content` grid track, it
falls to 480px, the least width of a table, and the notes are placed against
that. Give such a table a width, or a parent that has one.

Only the last cell can reach the gutter, because the stylesheet measures
across the table from its end edge. Notes given to any other cell stay under
its content at every width. The requirement table is the one exception, since
the width of its priority column is known.

## The requirement table

`RequirementTable` is `Table` with the columns decided: an identifier, the
requirement, and a MoSCoW priority where any row has one. Its styles are in
`styles/table.css`.

```tsx
<RequirementTable
  caption={caption}
  renderText={renderInlineWithRefs}
  requirements={[
    { id: 'FR-AA-01', text: '…', priority: 'M', notes: [{ label: '…', text: '…' }] },
    { id: 'FR-AA-02', text: '…', blocks: [{ kind: 'list', ordered: true, items: ['…'] }] },
  ]}
/>
```

| Prop | Type | |
| --- | --- | --- |
| `requirements` | `Requirement[]` | `id`, `text`, and optionally `blocks`, `priority` (`'M'`, `'S'` or `'C'`) and `notes` |
| `caption` | `string` | A caption row, and the name of the scroll area. Without one the area is named "Requirements" |
| `renderText` | `(text: string) => ReactNode` | What a string of the data becomes. Without one it is shown as it is |
| `labels` | `RequirementTableLabels` | The words the table writes itself. Each is optional |

| `labels` | Default | |
| --- | --- | --- |
| `id` | "ID" | Header of the identifier column |
| `requirement` | "Requirement" | Header of the requirement column |
| `priority` | "Priority" | Header of the priority column, as a screen reader reads it |
| `priorityShort` | "P" | The same header as it is drawn, in a column 60px wide |
| `name` | "Requirements" | Name of the scroll area where there is no `caption` |
| `priorities` | `{ M: 'Must have', S: 'Should have', C: 'Could have' }` | What each letter stands for, read in place of the letter |
| `noPriority` | none | What the dash stands for. Until it is passed, the dash is all there is |

A letter and a dash are drawn, and a screen reader is given the word instead:
the drawn form is `aria-hidden` and the word is beside it, hidden from the
page (`.req-drawn > .req-spoken`). The header cell has no `abbr` attribute,
which is for the short form of a long header, and no `<abbr title>`, which a
screen reader may not read and a touch screen cannot show. The defaults are
the words the documentation site shows. `noPriority` has none because no
application has given the dash a word, and the package does not choose one.

The words of a requirement are strings, because a page of them is generated
from a specification. The application says once what a string becomes:
`renderText` is called for the text of each requirement, for each paragraph,
list item and matrix cell in its `blocks`, and for the text of each note. The
package does not know what an application links a requirement code to, so it
imports no renderer. The component has no hook and is not a client module, so
a server component can pass it a function.

`blocks` follow the lead-in text in order: `{ kind: 'p', text }` is a further
paragraph, `{ kind: 'list', ordered, items }` is a list, lettered when
`ordered`, and `{ kind: 'table', headers, rows, align }` is a matrix the
requirement itself defines, drawn compact inside the cell.

`notes` are the margin notes of the row, each `{ label, text }` with the label
optional. They are given to the cell that holds the requirement and are placed
as the section above says: under the requirement with no gutter, and in the
gutter beside the row where there is one, with or without a priority column.

Each row takes its identifier in lower case as its `id`, so a link to
`#fr-aa-01` lands on the row. A row with no priority, in a table where another
row has one, shows a dash.

## The avatar and the avatar stack

`Avatar` is a person's picture. `AvatarStack` is a row of them for the people
who have a document open, placed at one position in the document header. Both
take their styles from `styles/avatar.css`, which `styles.css` and
`styles/components.css` also carry.

Until a person has a picture, the picture is their **initials on their
collaborator colour**: the slot of `--collab-N` for the ground and
`--collab-N-ink` for the letters, the same slot that colours their caret and
selection in the document. The component has an image path ready, `src`, and
builds no upload, no resizing and no fetching.

```tsx
import { Avatar, AvatarStack, avatarInitials } from '@ekdotico/domico/components';
import '@ekdotico/domico/styles/avatar.css';

<AvatarStack
  label="People in this document"
  people={[
    { id: 'u1', name: 'Maria Papadopoulou', role: 'Editor', collaboratorSlot: 1, you: 'you' },
    { id: 'u2', name: 'Nikos Georgiou', role: 'Viewer', collaboratorSlot: 2 },
  ]}
  max={4}
  more={(hidden) => (hidden === 1 ? 'and 1 more person' : `and ${hidden} more people`)}
/>

<Avatar name="Maria Papadopoulou" collaboratorSlot={1} label="Maria Papadopoulou" />
<Avatar name="Maria Papadopoulou" collaboratorSlot={1} decorative />
```

### Avatar

| Prop | Type | Meaning |
|---|---|---|
| `collaboratorSlot` | `1` to `10` | The person's colour. Required. Anything else is a `RangeError` at render, since a picture with no colour would be drawn |
| `name` or `initials` | `string` | One of them is required. `initials` are cut to two graphemes and drawn as given; otherwise the letters come from `name` |
| `label` or `decorative` | `string` or `true` | One of them is required, and not both |
| `src` | `string` | A picture, drawn over the letters. It has no alternative text of its own |
| `size` | `'sm' \| 'md' \| 'lg'` | 24, 32 or 40 pixels at least (`--sp-6`, `--sp-7`, `--sp-8`). `md` is the default |

Its other attributes pass through to the `<span>`. It is not a control and
takes no focus.

**Named or decorative: every call says which.** `label` makes the picture an
image with that name, for an avatar that stands alone. `decorative` hides it
from a screen reader, for one beside the person's name or in an `AvatarStack`,
where the name is text and the letters would be read as a second, shorter
name. There is no default, and the types refuse a call that gives neither: an
unnamed picture draws exactly as a named one, so the omission would otherwise
be silent.

**Initials are cut by grapheme.** `avatarInitials(name)` is the first
grapheme of the first word and of the last, capitalised, and of a single word
its first grapheme. A Greek name (`Μαρία Παπαδοπούλου` is `ΜΠ`), a letter with
an accent or a combining mark, a letter outside the Basic Multilingual Plane
and a joined emoji are each one character, never cut through. Capitalising
uses `toUpperCase`, the same in every locale, so the server and the browser
draw the same letters. The letters are set in `--font-sans`, which has Greek.

**An image replaces the letters.** `src` fills the circle over them, on a
ground of its own so a transparent image does not show them through. If it
fails to load, the component takes the image out and the letters are what is
left. Pass a new `src` and it is tried afresh.

**The circle is a minimum and grows with its letters.** A reader who raises
the text size gets a larger picture and not letters cut off at its edge (WCAG
1.4.4). At the default size the letters are narrower than the circle, so every
picture in a row is the same size.

### AvatarStack

| Prop | Type | Meaning |
|---|---|---|
| `label` | `string` | The name of the list: "People in this document". Required |
| `people` | `AvatarStackPerson[]` | In the order to draw them. An empty list renders nothing |
| `max` | `number` | The most people drawn before the rest are counted. 4 unless set |
| `more` | `(hidden: number) => string` | The words for the people not drawn. Required, and called only when someone is left out |
| `size` | `'sm' \| 'md' \| 'lg'` | As `Avatar` |

A person is `{ id, name, collaboratorSlot, role?, initials?, src?, you? }`.
`id` is the key. `role` is read after the name, in the application's words.
`you` is the application's word for the reader, set on the person who is the
reader. Every word a screen reader hears is passed in, so the application owns
its texts, in its own languages and with its own plurals. The package has no
default for `label`, `more`, `you` or `role`.

**What a screen reader reads.** A `<ul>` named by `label`, with `role="list"`
written out because Safari drops the list from the accessibility tree once its
markers are removed. Each person is a list item that holds the picture, which
is `aria-hidden`, and a line of text that reads the name, the `you` words in
parentheses if there are any, and then the role: "Maria Papadopoulou (you),
Editor". The items are named for the people and the list for itself, so
"People in this document, list, 3 items" is heard once and each name once. The
people who are not drawn are one more item, and it reads `more(hidden)`. Its
visible `+3` is `aria-hidden`.

**The text is hidden from the page and kept inside its item.** Each item is
`position: relative` and the words are `position: absolute` in it, so they lie
within their own item and cannot widen a scroll container the stack is placed
in, which is what a bare `.sr-only` did to a checkbox in a table cell in
0.30.0. The stylesheet carries its own copy of the technique, so
`styles/avatar.css` holds alone.

**The stack is not focusable, and that is a decision.** A person in it has
nothing to do in the application today. A Tab stop that does nothing is a stop
the reader has to pass and a control that is not one (WCAG 4.1.2), and a
screen reader reads every name in the list without it. So the stack is read in
reading order, as a list, and a keyboard has nothing to reach. The day a person
has an action, such as a link to their cursor, it is a new prop and a button
inside the item. The stylesheet already raises an item that holds focus above
its neighbours, so the overlap will not cover its ring.

**What is drawn.** `max` pictures in the order given, then one more with the
count (`+3`), in the sunken surface and the primary ink, the only picture with
no person's colour. Each picture overlaps the one before by 4px (2px at `sm`),
which stops short of the second letter. A person with `you` has a ring in
`--fg-1` as well as the words. Neither the ring nor the colour is the only
signal: the name is in the text. The row wraps, so ten large pictures at a
width of 320px are two lines and not a horizontal scroll bar.

A person's name is not shown on screen: the pictures are initials and a count.
An application that wants a name on hover or press builds that on its own
control, or waits for a prop that does it.

**Motion.** Nothing moves, so there is nothing to reduce. The stylesheet has no
transition and no animation, and `check:components` fails if one is added
without a `prefers-reduced-motion` rule.

**Forced colours.** The ring is a border and not a shadow, so it survives, and
in forced colours it is `CanvasText`, which gives the circle an edge when its
own ground is replaced.

### Contrast

The initials are `--collab-N-ink` on `--collab-N`, as text, at 4.5:1. The edge
of the picture is `--collab-N` against `--bg-surface`, which is the ring, and
against `--bg-canvas`, as a graphical object at 3:1 (SC 1.4.11). Both are listed
for all ten slots in `check:contrast`, and the worst of each, in the palette
that sets it:

| Palette | Initials | Against the ring | Against the canvas |
|---|---|---|---|
| parchment light | 4.68:1 | 4.37:1 | 4.15:1 |
| parchment dark | 5.22:1 | 4.76:1 | 5.08:1 |
| library light | 4.68:1 | 4.68:1 | 4.48:1 |
| library dark | 5.22:1 | 5.06:1 | 5.34:1 |
| sepia light | 4.68:1 | 4.42:1 | 4.23:1 |
| sepia dark | 5.22:1 | 4.88:1 | 5.20:1 |
| mono light | 4.68:1 | 4.68:1 | 4.68:1 |
| mono dark | 5.22:1 | 5.37:1 | 5.67:1 |

The count is `--fg-1` on `--bg-surface-2` (11.35:1 at the lowest) and the ring of
the reader is `--fg-1` on `--bg-surface` (12.33:1 at the lowest); both pairs were
already listed. The ring is `--bg-surface`, so the stack reads best on a header
that is a surface. On the canvas it is a faint halo, and the edge of each
picture still holds 3:1.

### Class names

`ekd-avatar`, `ekd-avatar--sm`, `ekd-avatar--lg`, `ekd-avatar-slot-1` to
`ekd-avatar-slot-10`, `ekd-avatar-letters`, `ekd-avatar-image`,
`ekd-avatar-stack`, `ekd-avatar-stack--sm`, `ekd-avatar-stack-item` and
`ekd-avatar-text`. They are for reading a page in a test and for an
application's own selector, not for restyling: the colours are the person's.

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
| `styles/editor.css` | The document surface: prose, the nine marks, lists, a table, an image block and its handle, footnotes, a page break, a table of contents |
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
selection. The application places it and decides when it is shown, because
the package cannot see the editor's pointer state. Over a text selection it
opens once the selection is complete. While a pointer button is held down to
drag a selection the toolbar stays hidden, and it opens when the button is
released, wherever that happens. A selection made by keyboard shows it at
once. A toolbar that appeared and moved during the drag would cover the text
being selected and pull the eye away. The application also owes two things the package cannot supply: a key that moves
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

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
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

/**
 * What stands between a "/" that starts a word and the cursor, or null. Null
 * too for a selection that is a range, and for one outside `text`.
 */
function queryAtCursor(text: HTMLElement | null): string | null {
  const selection = window.getSelection();
  const node = selection?.focusNode;
  if (!selection?.isCollapsed || node?.nodeType !== Node.TEXT_NODE || !text?.contains(node)) return null;
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
  const text = useRef<HTMLDivElement>(null);
  // What stands after the "/" at the cursor, or null where there is none.
  const [query, setQuery] = useState<string | null>(null);
  // The writer closed the list on this "/". It stays as text, and stays closed.
  const [dismissed, setDismissed] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  // Whether the writer is moving in the list: the last key was a move in it,
  // and no text has arrived and the cursor has not moved since.
  const [navigating, setNavigating] = useState(false);

  // The cursor moved: by Left, Right, Home or End, which are the text's keys
  // and fire no `input`, or by a press. The query is read again, so the list
  // closes when the cursor has left the query. A move never opens the list:
  // a cursor that arrives after a "/" already in the text is not a request.
  useEffect(() => {
    const onCursorMove = () => {
      const next = queryAtCursor(text.current);
      setQuery((shown) => (shown === null ? null : next));
      setNavigating(false);
    };
    document.addEventListener('selectionchange', onCursorMove);
    return () => document.removeEventListener('selectionchange', onCursorMove);
  }, []);

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
    const next = queryAtCursor(text.current);
    setQuery(next);
    // Text can arrive with no key: a paste, dictation, an input method.
    setNavigating(false);
    // A new filter starts at its first match, so that the status names the option Enter chooses.
    setActiveId(null);
    // A "/" typed now is a new request, and so is the first after the last one went.
    // `includes`, because one input can carry more than one character.
    const typed = (event.nativeEvent as InputEvent).data ?? '';
    if (typed.includes('/') || next === null) setDismissed(false);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const result = open ? optionListKey(event, { options, activeId: active }) : null;
    // For every key, the list's or the text's, open or closed. It is given
    // the value it last returned, which a modifier pressed by itself keeps.
    setNavigating(optionListNavigating(event, result, navigating));
    if (!result) return; // The text's own key: a letter, Backspace, Left, Home, Tab.
    event.preventDefault(); // The list's key. The caret stays where it is.
    if ('activeId' in result) setActiveId(result.activeId);
    else if ('select' in result) insert(result.select);
    else dismiss();
  };

  // The count, and the option Enter chooses while nothing has been moved.
  const count = options.length === 1 ? '1 block' : `${options.length} blocks`;
  const status = options[0] ? `${count}. ${options[0].label} first.` : '';

  return (
    <>
      <div
        ref={text}
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
        status={status}
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

These two are the whole of what the function sets for a list the text region
does not hold, and each rests on a sentence of WAI-ARIA 1.2.

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
the same specification says why. Two of the three, `aria-autocomplete` and
`aria-haspopup`, are supported on a `textbox` in WAI-ARIA 1.2. They are left
out because a value that is set while the list shows and removed afterwards is
a value changed to say that a suggestion is there, and the specification asks
authors not to do that. Only `aria-expanded` is left out because the role does
not support it.

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
  values." With no `aria-autocomplete` it is not owed. Set only while the list
  shows, it would be the same changing value under another name.

The region keeps `role="textbox"` with `aria-multiline="true"`, which the
application sets. It is not given `role="combobox"`: the value of a combobox
is one line of text, and a document is not.

**While the query is typed, no option is named.** The first match is marked
as active from the moment the list opens, because that is the option Enter
chooses. A screen reader that follows `aria-activedescendant` would say that
option again over each character of the query, and would say it in place of
the character when the writer reads the query back with Left and Right. So
`optionListAttributes` sets `aria-activedescendant` only where `navigating` is
true, and `optionListNavigating(event, result, previous)` says what it is
after a key: true after Down, Up, Page Down or Page Up, `previous` after a
modifier pressed by itself, and false after every other key. The application
calls it for every `keydown`, as the example does, with `null` as the result
while the list is closed. The mark on the row does not depend on it.

A modifier pressed by itself changes nothing, which is why the function takes
the value it last returned. Control is the key that silences a screen reader,
and CapsLock is one that begins its commands. A writer who moves to an option,
stops the speech and asks where they are is still on that option, and the text
region still names it. The function takes `previous` and does not return
`null` for "no change", so that one line is the whole of the call and no
application has a branch to forget.

A key is not all that ends the move. Text can arrive with no `keydown`, from a
paste, from dictation or from an input method, and a press in the text moves
the cursor with no key at all. The example sets `navigating` to false in
`onInput` and in its `selectionchange` listener for those.

**The cursor leaves the query, and the list closes.** Home, End, Left and
Right are the text's keys, and they fire no `input`. An application that reads
the query in `onInput` alone leaves the list open after Home: it is placed
again at the cursor, it still takes Up, Down and Enter, and Enter replaces
text the cursor is not in. So the example reads the query again on
`selectionchange`, which the browser fires on the document for every move of
the cursor, by a key or by a press. A selection that is a range has no query
either. The listener only refilters or closes a list that is open. It never
opens one: a cursor that arrives after a `/` already in the text is not a
request, and typing in that word is.

**Enter with nothing moved chooses the marked first match.** That is what a
writer who sees the list expects. A writer who hears it was once told the
count alone, and Enter then chose an option nobody had named. So the example's
`status` names it with the count: "3 blocks. Heading 1 first." It names the
first option and not the active one. The two are the same until the writer
moves, and a status that followed the active option would change at every
arrow and be announced again at every arrow. With `announceActive` on, the
region says the active option itself, and `status` is the count alone.

**The announcement.** `OptionList` holds a polite status region and gives it
`status`, or `empty` when there are no options. The region follows the text
`announceAfterMs` after it last changed, which is 500 unless the application
says otherwise. A writer who types three letters one after another hears the
count they stopped on, and a key that leaves the count unchanged is not announced.
Opening empties the region, so the next count is announced again.

**The closing is announced.** A writer who cannot see the list was told when
it opened and was not told when it went: after Escape, after the cursor left
the query, after a letter that ended the command. When `open` becomes false
the same region is given `closed`, 150 milliseconds later. The text is "List
closed." unless the application passes another.

| What happened | What the region is given |
|---|---|
| The list closed, and its opening had been announced | `closed`, 150 milliseconds after it closed |
| The list closed before its count had settled | Nothing. A writer who types ` /usr/` is not told that a list they never heard of has closed |
| The list closed and opened again inside the 150 milliseconds | Nothing about the closing, and then the count |
| That list then closed again, before its count had settled a second time | `closed`. The writer was told of this list and has not been told that it went |
| The list closed with `closed=""` | Nothing, and the region is emptied |

For this the region is not part of the list. It is the element after it, and
it stays in the page while the list is closed, empty until the first closing
that is announced. A region that left the page with the list could say nothing
of the list's going. So keep `OptionList` in the page and change `open`, as
the example does. An application that renders it only while the list is open
takes the region out with the list, and nothing is said. The text stays in the
region until the list opens again, as the last label stays in the region of
`SyncStatus`.

**`closed` is the word for a closing, and not a way to announce a choice.**
It is read on the one render in which `open` becomes false. A `closed` given
on a later render is not read. And it is not said at all for a list whose
opening was not said, so a writer who chooses before the count has settled
would hear nothing of a choice that was announced through it.

The component does not tell a choice from a dismissal: Enter is the
application's key, and both arrive as `open` becoming false. So with `closed`
left alone, a choice is followed by "List closed." as Escape is. What a writer
wants to hear after a choice is what was chosen. An application that confirms
a choice says so in a status region of its own, and passes an empty `closed`
on the render that closes the list after a choice, so that the two are not
said one over the other:

```tsx
const [chose, setChose] = useState(false);
// In `insert`: setChose(true), in the same update that closes the list.
// In `onInput`: setChose(false).
<OptionList closed={chose ? '' : undefined} … />
```

Step 12 of the script below is where to hear whether a product needs that.

All three texts are the application's, and the Expression Guidelines apply to them
as to any copy. `status` is the count and what is counted, in sentence case and
with a singular form, and then the option Enter chooses: "1 block. Text
first.", "3 blocks. Heading 1 first." `empty` follows the formula for an
empty state, which is what the space is for and how to start: "No block
matches. Delete a letter to see more." It does not say that the writer did
something wrong. `closed` is in the system feedback register: it describes
what is complete, in sentence case and with a full stop, as "Document sealed."
does. It is the one text here with a default, because it says the same thing
in every product.

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
nothing as they press Down. The same region is given one text at a time.

| What happened | What the region is given |
|---|---|
| The list opened | Once the count has settled, the count and the active option as one text: "3 blocks. Heading 1, 1 of 3" |
| A move in the list | The active option, 150 milliseconds after the move. A held key says where it stopped |
| The filter changed | Once it has settled, the count where it changed and the active option where it changed, as one text where both did |
| A move while a count is waiting | Once the count has settled, the count and the option as one text, the count first |

Where the count and the option are both due they are one text, written once,
and not two texts one after the other. A polite region that is given a second
text before the first was spoken is not certain to speak the first, so two
writes close together could lose the count. The component joins the two with a
space and adds no punctuation, so with `announceActive` on, pass the count
alone as `status` and end it with a full stop: "3 blocks." Whether each screen
reader speaks the whole of the one text has not been tested, and step 9 of the
script below is where to hear it.

The 150 milliseconds are a constant of the component and not a prop. An option
that is active again after a change of filter, and was the last one said, is
not said again.

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

**Tab does not stop on the list.** The listbox scrolls once it holds more
options than `maxVisible`. Chromium and Firefox put a box that scrolls, with
nothing in it that takes focus, in the Tab order by themselves, so Tab from
the text went into the list. The listbox carries `tabindex="-1"`, on the
server's markup too, and Tab and Shift+Tab from the text go to the control
after it and the control before it, with the list open as with it closed. The
attribute also makes the listbox a box that a press can focus, its scrollbar
included, and the prevented default above is what stops that. Read in Chromium
with 13 options and with a mouse; not in Firefox or Safari.

**A press outside closes the list**, through `onDismiss('press-outside')`. For
a mouse that is the button going down. For a finger or a pen it is the lift,
and only where the touch did not become a pan or a pinch: a reader who drags
the page to see the list, or pinches to enlarge it, has not pressed anything.
The browser ends such a touch with `pointercancel` and no `pointerup`, and the
component dismisses on `pointerup` alone. This is held by synthetic pointer
events in `check:components`. It has not been run on a touch device, and what
each browser sends for a pan is the thing to confirm there.

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
of 320. A label that does not fit wraps and is not cut short. So does a
`detail`: it is as wide as its text up to half the row and wraps inside that
half, so a long one, such as a citation key of forty characters, leaves the
label the other half and the list does not scroll sideways (WCAG 1.4.10).

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
(WCAG 1.4.4). The active row is marked by a boundary in `--accent`, two pixels
wide, and the accent wash together, and by the system's selection colours in
forced colours. Nothing in the list moves or fades.

In a page that reads right to left the row is mirrored: the label is at the
right and the detail at the left. The label and the detail each take their
direction from their own text, so a command such as `/h1` is drawn as `/h1`
there and not as `h1/`.

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
the application prevents it for every key `optionListKey` answers. Prevent it
for those keys and for no others. With the list closed, `optionListKey` is not
called, the result is `null`, and Escape is left for the surface. A handler
that prevented every Escape would leave the surface with none.

**What it does not do.** It does not open itself, filter, or remember what was
chosen. It handles no key. It does not group options or draw icons. It does not
choose an option on Tab, and an application that wants that reads Tab in its
own handler. It does not close when focus leaves the text: the application
closes it, as `onBlur` does above. Closed, it renders its status region and
nothing else, so no listbox, no option and no popover of a closed list is in
the accessibility tree. The region is one `span` that is not drawn, and it is
empty until a closing is announced.

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

**Before the first step.** The steps expect the screen reader to be editing
the text and to say each character as it is typed.

| Screen reader | The mode to be in | Typing echo |
|---|---|---|
| NVDA | Focus mode. NVDA enters it by itself when the cursor is in the text. If the arrow keys read the page and do not move the text cursor, press NVDA+Space | Characters: NVDA+2 until it says "speak typed characters on" |
| JAWS | Forms mode, with the virtual cursor off. JAWS enters it by itself in an editable region. If the arrow keys read the page, press Insert+Z | Characters: Insert+2 until it says "characters" |
| VoiceOver on macOS | Quick Nav off: press Left and Right together until it says "Quick Nav off" | VoiceOver Utility, Verbosity, Text, "While typing speak": Characters |
| VoiceOver on iOS, TalkBack | The on-screen keyboard, in its standard typing mode | Characters, in the screen reader's own settings |

**How to record it.** Keep one table for the run. Give it a row for each step
below and a column for each pair, headed with the screen reader and its
version and the browser and its version. In each cell write "pass" or "fail"
and the words that were heard, as they were heard and not as they were
expected. Write above the table what `announceActive` and `detailInName` were
set to. Where a step changes one of them, run the steps again from step 1 in a
new table. A step that cannot be run in a pair, such as step 15 with no touch
screen, is "not run" and not "pass".

1. Put the cursor in the text and type the trigger character. Expect the
   character, and then the count and the first option: "12 blocks. Text
   first." Expect no option to be said in any other way, such as "Text, 1 of
   12" or "Text, selected".
2. Type two letters of a query without a pause. Expect each letter, and then
   one status, for the options left. Expect no option to be said over a letter.
3. Press Left, then Right. Expect the character the cursor passes, as in any
   text. An option said here is a defect in the application's `navigating`.
4. Press Down. Expect the second option to be said, and the cursor to stay
   where it is. If nothing is said, or the line of text is said, this screen
   reader does not follow `aria-activedescendant` from an editable region:
   pass `announceActive`, pass the count alone as `status`, and start again
   from step 1. Record also whether the name of the list, "Blocks", was heard
   at this step or at any step before it. Some screen readers say the name of
   a listbox when the first option in it is said, and some never do. Where it
   is never heard, the count in `status` is the only place the writer learns
   what the options are, so it has to say it.
5. Straight after Down, press Left. Expect the character the cursor passes,
   and not the option again. Press Down, then type a letter straight after it.
   Expect the letter, and the status after a pause. An option said in place of
   the character or the letter is a defect: the move in the list did not end.
6. Press Down three times without a pause, then Up. Expect the option each
   press stops on, once. With `announceActive` on, an option said twice means
   this screen reader does follow the attribute, and is better off without it.
7. Press Down, and press Control while the option is being said, to stop the
   speech. Then ask where the focus is: NVDA+Tab in NVDA, Insert+Tab in JAWS,
   VO+F4 in VoiceOver on macOS. Expect the option, or the text region and the
   option. Then press Down once more and expect the next option. If the first
   answer is the text region alone and the second Down says the first option
   again, Control ended the move in the list, which is a defect in how the
   application calls `optionListNavigating`.
8. Listen to an option that has a detail: "Heading 1 /h1". Decide whether the
   detail helps or delays. If it delays, pass `detailInName={false}`, which
   takes the detail out of the name and leaves it on the page, and listen again.
9. Type one more letter. Expect the letter, then the new status after a pause.
   With `announceActive` on, expect the count and the first match together, as
   one announcement: "2 blocks. Heading 1, 1 of 2". A count with no option
   after it, or an option with no count before it, means this screen reader
   did not speak the whole of the one text. Record which part was lost.
10. Type until nothing matches. Expect the `empty` text, once. Then delete one
    letter, so that there are matches again. Expect the letter that was
    deleted, as the screen reader says any deletion, and then the status
    again. Silence after the deletion is a failure: the writer does not know
    the list is back.
11. Wait for the status, then press Escape. Expect the list to close, the
    cursor to be where it was, and "List closed." or the application's own
    `closed`, once. A screen reader may say the text region or the line as
    well. Silence is a failure: the writer does not know the list has gone.
    Type a letter: expect the letter and then silence. A count after that
    letter is a failure, because the list has opened again. Read the line:
    expect the `/` and the query as text. Type the trigger character again:
    expect step 1. Then type the trigger character and press Escape at once,
    before the status. Expect nothing about the list: a list that was not
    announced as open is not announced as closed.
12. Open the list and press Enter without moving. Expect the first option to
    be inserted, which is the one step 1 named. Open it again, press Down
    twice, and press Enter. Expect the third option. Record what is heard
    after each Enter, and in what order. Do it twice: once after the status
    has been heard, and once at speed, with Enter pressed before the status.
    With `closed` left alone the package says "List closed." after a choice
    as after Escape, where the status was heard, and nothing where it was not.
    Anything else that is heard is what the application's editor does with
    the cursor. If the editor says the new block, the two together may be
    more than is wanted: pass an empty `closed` on the render that closes the
    list after a choice. If the editor says nothing, "List closed." does not
    tell the writer that the block is there, and `closed` is not the place to
    say it, because it is silent at speed: the application owes a status
    message of its own for the choice, in a region of its own.
13. Open the list, wait for the status, and press Tab. Expect focus to go to
    the next control, and that control to be said. Record whether "List
    closed." is heard after it, and whether it is in the way. Press Shift+Tab.
    Expect the text region to be said, and no list. Type a letter: expect the
    letter and no list.
14. Where the text is inside a dialog or another modal surface: open the list
    and press Escape. Expect the list to close and the dialog to stay, with
    nothing said about the dialog. Press Escape again. Expect the dialog to
    close and its trigger to be said. A dialog that closes on the first
    Escape, or does not close on the second, is a defect in how the
    application prevents the default of the key.
15. With a screen reader for touch, type the trigger character on the
    on-screen keyboard. Expect the status. Then find the list by swiping right
    from the text region. Record how many swipes it takes to reach the first
    option, and whether the keys of the keyboard come before it. Expect each
    option to be said with its name. Double-tap one: expect it to be chosen,
    the keyboard to stay up, and the cursor to stay in the text. If the list
    cannot be reached by swiping, record whether it can be found by moving a
    finger over the screen. Then turn the screen reader off, open the list,
    and drag the page with one finger, and pinch it with two. Expect the list
    to stay open through both. Tap outside it: expect it to close.
16. Switch to an input method that composes, such as one for Japanese, for
    Chinese or for Korean. Open the list, then begin a word after the trigger
    character. While the input method shows its candidates, press Down, Up,
    Enter and Escape. Expect each to act on the candidates alone: the active
    option does not move, nothing is inserted from the list, the list does
    not close, and a dialog round the text does not close. Commit the word:
    expect the list to be filtered by it.
17. The prompts of the document surface, which are drawn and not read. Open
    an empty document and put the cursor in it. Expect the name and the
    description of the text region, and the empty line as the screen reader
    says any empty line. The prompt said as the first line of the document is
    a failure, and means this browser does not take the empty alternative
    text. Then insert a table and move the cursor into its empty caption,
    which shows "Caption". Expect the word not to be said as text. Record
    what is said on entering the caption: "figure", "caption", a blank line,
    or nothing. If nothing that is heard tells the writer that this line is
    the caption of the table, the application says so where a screen reader
    is told it, in the description of the text region: that a table has a
    caption under it. Type a caption, leave it and come back: expect its
    text, once.

Not covered by any test in the package: a screen reader, Firefox, Safari, a
touch device, forced colours, and an input method that composes. The
stylesheet was read in Chromium at a width of 320 pixels, in a page that reads
left to right and in one that reads right to left.

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

### The image block

A picture in the document, with a caption, a width, and a handle on its end
edge that sets the width. The stylesheet draws it and `attachImageResize` makes
the handle work. Nothing here uploads, loads, or stores a picture, and nothing
imports an editor: the block is markup that an editor's node view writes, and
the helper is given two elements.

```html
<figure class="ekd-image">
  <div class="ekd-image-frame" contenteditable="false" style="--ekd-image-width: 50%">
    <img class="ekd-image-img" src="…" width="1600" height="900" alt="Plate 3, the north front">
    <div class="ekd-image-resize" aria-label="Image width"></div>
  </div>
  <figcaption class="ekd-image-caption" data-placeholder="Caption (optional)">Plate 3</figcaption>
</figure>
```

| The editor writes | On | What it is |
|---|---|---|
| `class="ekd-image"` | A `figure` | The block. `data-node-selected` outlines it, as it does any block |
| `data-state="uploading"` or `data-state="unavailable"` | The block | A block with no picture in it, and why. The `img` is not drawn in either |
| `class="ekd-image-frame"` | The first child | The picture's box, and the handle's. Its width is the block's width |
| `--ekd-image-width: 50%` | The frame, in `style` | The width, as a percentage of the text column. `attachImageResize` writes it |
| `data-resizing` | The frame, while it is dragged | An outline round the frame, and the handle held down |
| `class="ekd-image-img"` | An `img` in the frame | The picture, with the card's hairline and radius |
| `class="ekd-image-status"` | An element in the frame | The words for the two states: "Uploading the image…", "This image is no longer available." The application's words |
| `class="ekd-image-resize"` | An element in the frame | The handle, at the end edge of the frame |
| `class="ekd-image-caption"` | A `figcaption` after the frame | The caption, drawn as a table's caption. `data-placeholder` is its prompt while it is empty |

**The width.** A share of the text column, whole numbers from 10 to 100. The
stylesheet reads it from `--ekd-image-width` and clamps it: never below a
tenth of the column, never below `--sp-7` (the room the handle needs), never
past the column, whatever a document says. Where the property is not set the
block fills the column. It is one property on one element and it is a value,
not a token; an application sets it and does not declare a token for it. The
frame starts at the start edge of the column, so the end edge follows a pointer
one to one. Give the `img` its `width` and `height` attributes: the picture
keeps its proportions and the page does not move when it loads.

**The handle is a slider.** One number, set by moving along a line, so it is
`role="slider"` with `aria-valuemin`, `aria-valuemax`, `aria-valuenow`,
`aria-valuetext`, and a Tab stop. It is drawn on its own ground
(`--bg-raised`) with a boundary in `--rule-control`, so it is seen on a
picture of any colour, and its grip is two lines, a shape and not a hue. It
is `--sp-6` wide and `--sp-7` tall, above the 24px of WCAG 2.5.8, and it is
inside the frame: at the full width it adds nothing to the width of the page,
which holds at 320px. The focus ring is two rings, the accent and the ground
between it and the handle, so that against a picture of any colour one of
the ring's two edges can be seen. There is no motion but a hover
colour, and a reader who asked for none gets that without the fade. In forced
colours the handle is `Canvas` and `ButtonText` and the ring is `Highlight`. It
is not printed.

```ts
import { attachImageResize, IMAGE_RESIZE_EVENT, type ImageResizeEvent } from '@ekdotico/domico/a11y';

// In a node view's constructor:
const resize = attachImageResize({ handle, frame, width: node.attrs.width });
handle.addEventListener(IMAGE_RESIZE_EVENT, (event) => {
  const { width, phase } = (event as ImageResizeEvent).detail;
  if (phase === 'commit') view.dispatch(view.state.tr.setNodeMarkup(getPos(), undefined, { ...node.attrs, width }));
});
// In its update(): resize.update(node.attrs.width). In its destroy(): resize.destroy().
```

`attachImageResize({ handle, frame, width, min?, max?, step?, pageStep?, valueText? })`
returns `{ update(width), destroy() }`. It sets `role`, `aria-orientation`,
the three value attributes and a `tabindex` where there is none, and it writes
`--ekd-image-width` on the frame. It sets no `aria-label`: what the handle is
called is the application's words, and a slider with no name is the
application's fault. `valueText` says the value to a screen reader and
defaults to the number and a percent sign. The width the frame is a share of
is the width of the frame's parent, read when a drag begins.

| Move | Result |
|---|---|
| Pointer: press the handle and drag toward the end of the line | The width follows the pointer, to the nearest whole percent, from 10 to 100. Mouse, touch and pen, by pointer capture, so the drag follows the pointer off the handle |
| Escape, while dragging | The width goes back and the drag ends |
| Right Arrow or Up Arrow | 5 wider. In a right to left block Left Arrow widens and Right Arrow narrows, as a native range input does |
| Left Arrow or Down Arrow | 5 narrower |
| Page Up and Page Down | 25 wider and 25 narrower |
| Home and End | 10 and 100 |

A key lands on a multiple of the step, so a width a drag left at 53 goes to
55. A key on the handle goes no further: the editor round it does not move
its caret.

Each change is an `ekd-image-resize` CustomEvent on the handle, which bubbles,
with a detail of type `ImageResizeDetail`: `{ width, phase, source }`.

| `phase` | When | What to do |
|---|---|---|
| `move` | During a drag | Nothing. The width is shown and is not decided. Writing it to the document at each move writes it to every collaborator at each move |
| `commit` | A key; the end of a drag that changed the width | Write `width` to the node |
| `cancel` | A drag ended where it began, or was abandoned: Escape, or the pointer taken away | Nothing. The width has been put back |

`source` is `pointer` or `keyboard`. Beside the helper, `clampImageWidth`,
`imageWidthForKey`, and `imageWidthForDrag` are the arithmetic with no element
in it, and `IMAGE_WIDTH_MIN`, `IMAGE_WIDTH_MAX`, `IMAGE_WIDTH_STEP`,
`IMAGE_WIDTH_PAGE_STEP`, `IMAGE_WIDTH_PROPERTY` and `IMAGE_RESIZE_EVENT` are
the numbers and the names. The module touches nothing when it is loaded, so a
server module may import it.

**Dragging is not the only way, and the keys are not the other.** WCAG 2.5.7
(Dragging Movements) asks for a way to set the width with a single pointer
and no drag, and the arrow keys are for a keyboard. The handle does not
supply that, and the block's own controls must: a `Select` of widths, 25, 50,
75, and 100, beside the alt text and the caption. It sets the same property
and writes the same attribute. A block that has the handle and no such
control fails 2.5.7.

What the application owes:

- A name on the handle, through `aria-label` or `aria-labelledby`, in its
  words: "Image width".
- `contenteditable="false"` on the frame, so that the handle and the picture
  are not text. Where the editor takes a key for itself, stop it at the handle.
- No handle for a reader who cannot change the document. The block without it
  is the same block.
- The alt text, which is a field of its own and not an attribute the reader
  never sees. An image with nothing to say has an empty `alt`, not a missing
  one.
- `aria-busy="true"` on the frame while the picture is on its way, and the
  status words in an element with `role="status"` that is in the page before
  they change. `data-state` is a drawing and says nothing to a screen reader.

The two states are told apart by the edge as well as the words: a solid edge
while the picture is on its way, and a dashed one when it will not come. Both
are the sunken surface with the status in `--fg-1`, which `check:contrast`
holds at 4.5:1, and neither moves.

### Footnotes

A marker in the running text and the list of notes at the end of the document.
Four names, all styles: nothing here numbers a note, links a marker to its
entry, or moves the reader, and nothing imports an editor. The editor writes the
markup and the stylesheet draws it.

```html
<p>The plate was cut in 1790<sup><a class="ekd-footnote-ref" href="#fn-1" id="fnref-1">1</a></sup>.</p>
<section class="ekd-footnotes">
  <ol>
    <li class="ekd-footnote" id="fn-1">Dated by the watermark.
Second line of the note.</li>
  </ol>
</section>
```

| The editor writes | On | What it is |
|---|---|---|
| `class="ekd-footnote-ref"` | An `a` inside a `sup`, with the number as its text | The marker, a link in the running text |
| `class="ekd-footnotes"` | A `section` at the end of the document, holding an `ol` | The notes, set apart from the body |
| `class="ekd-footnote"` | Each `li` of that `ol` | One note: editable text, its line breaks kept as written |
| `data-footnote-target` | A `li.ekd-footnote`, for a moment | The note the reader has jumped to |

**The marker** reads as a link: the accent, underlined, and a step heavier, as a
link in the document is, and a heavier underline under the pointer. Inside a
highlight it takes the ink of the text, as every link does. It is the
superscript's own size and adds nothing to the line: the `sup` rule gives it no
height. **It has no target beyond the number.** A marker sits inside a sentence,
and WCAG 2.2 SC 2.5.8 exempts a target in running text from the 24px minimum
(the Inline exception). Until 0.41.0 it drew an invisible 24 by 24 square around
the number, which in an editor caught a click 4 to 8px beside the number that
was meant for the text. A separator between two markers (a comma, a space) is
the writer's. The focus ring is the system's: the
accent, 2px, offset 2px, `--radius-xs`, written on the marker so that it does not
depend on the reset being loaded.

**The list** is set off by a rule in `--rule-strong`, the document's section
boundary, and by space above it, and is a size down (`--fs-base`) in the
document's face. The numbers are the `ol`'s own, decimal, so the Nth note is
numbered N and the marker whose text is N points at it: give the `ol` no `start`,
`type` or `reversed`, write the markers in the order of the notes, and keep the
notes in that order. A note keeps its line breaks as typed (`white-space:
pre-wrap`), whether they are `br` elements or newline characters in the text, and
an address in it wraps and does not widen the page.

**The target** is a wash in `--accent-soft` with `--fg-1` over it, which
`check:contrast` holds at 4.5:1 in the eight palettes. It fades in and out over
`--dur-slow` when the application sets and removes `data-footnote-target`, and
it is up to the application to remove it a moment after the jump. A reader who
asked for no motion gets the wash without the fade. In forced colours, where a
wash is not drawn, it is a 2px `Highlight` outline. Moving the reader to the
note and giving the marker a way back are the application's: so is the accessible
name of the marker ("Footnote 1"), which the number alone does not give, and
the `id` and `href` that join the two.

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
- Kerning is off on the surface (`font-kerning: none` on the root, which every
  block under it inherits). A run with no space in it wraps wherever the line
  ends, and with kerning on Chromium lays such a run out in time that grows
  with the square of its length: a paragraph of 32,000 asterisks took 430
  milliseconds at every key, and 100,000 took 1.4 seconds. With kerning off
  they take 1 and 4. Ligatures and the other font features are as they were.
  A page that is read and not typed into keeps its kerning, so do not copy
  the declaration to one, and do not set `font-kerning` or the `kern` feature
  on anything under the root.
- The prompt of an empty block is drawn and not said. It is text the
  stylesheet generates from `data-placeholder`, and a screen reader reads
  generated text as the text of the element, so an empty paragraph was read as
  if the prompt were written in it. The stylesheet now gives it an empty
  alternative text, `content: attr(data-placeholder) / ""`, in a rule of its
  own inside `@supports (content: "a" / "")`, after the plain
  `content: attr(data-placeholder)`. A browser that does not have the `/`
  keeps the plain rule: the prompt is drawn there and is read as it was. So
  the application says what the prompt says in a place a screen reader is
  told it: the description of the text region, or `aria-placeholder` on it.
  In forced colours the prompt is `GrayText`.
- The prompt can start after a control the application draws at the start of
  the line, such as an Insert button at the cursor. Set
  `--ekd-editor-placeholder-offset` on the editor, or any ancestor of it, to
  the control's width and its gap (a 20×20 control: `--sp-5` plus `--sp-2`), from tokens, and the prompt is indented by
  that much from the start of the line (the right, in a right-to-left
  document):

  ```css
  .document-editor {
    --ekd-editor-placeholder-offset: calc(var(--sp-5) + var(--sp-2));
  }
  ```

  It is an optional property that the package reads and no palette defines,
  like `--theme-count`: it is not a token, and unset it is `0`, so nothing
  moves. The caret stays at the start of the line. A prompt that wraps makes
  its empty block as tall as the wrapped text, so it does not draw outside the
  block; a prompt of one line is unchanged. This holds when `data-placeholder`
  is on the block and when it is on an element inside it, as an editor draws a
  prompt as a decoration.
- Controls that belong to one block can rest faint. Put `data-dim-at-rest` on
  the block's container (with `styles/button.css` and `styles/code.css`
  loaded), and the secondary, quiet and destructive `Button`, `ButtonLink`, the
  `MenuButton` trigger and the code block header's label and Copy rest in
  `--fg-3`. They return to their own ink while the pointer is over the
  container, focus is inside it, or the application has set `data-active` on
  it, as it does while the caret is in that block. It is a colour change, not
  opacity: hairlines, size and place do not move, and nothing is hidden. Touch,
  `prefers-contrast: more` and forced colours show every control at full
  strength, and reduced motion drops the fade. A primary button is never dimmed.
- The prompt is `--fg-3`, and that ink does not hold as text on every ground
  a block under the root can have. In the eight palettes it is 5.03:1 at its
  least on `--bg-canvas`, 5.12:1 on `--bg-surface` and 4.60:1 on
  `--bg-surface-2`, where text owes 4.5:1 (WCAG 1.4.3), and `check:contrast`
  holds those three pairs. The rule is not scoped to a kind of block, and on
  the grounds the package itself draws inside the surface the ink is short in
  some palettes:

  | Ground | Where it is | Short of 4.5:1 in |
  |---|---|---|
  | `--bg-inset` | A code block | Sepia light, 4.36 |
  | `--info-soft` | A callout of type `info` | Sepia light, 4.29. Mono light, 4.33 |
  | `--ok-soft` | A callout of type `tip` | Sepia light, 4.45 |
  | `--warn-soft` | A callout of type `warning` | Sepia light, 4.34. Mono light, 4.48 |
  | `--danger-soft` | A callout of type `danger` | Parchment light, 4.46. Sepia light, 4.08. Mono light, 4.24 |
  | `--burgundy-soft` | A callout of type `quote` | Sepia light, 4.07. Mono light, 4.26 |
  | `--accent-soft` | A selected table cell | Sepia light, 4.18. Sepia dark, 4.44 |

  So an application that draws a prompt in a code block, in a callout or in a
  selected cell gives it another ink there: `--fg-2` is 6.23:1 at its least on
  all seven. A callout with no type is on `--bg-surface-2`, where the prompt
  holds. No token was changed for this, and no check holds it:
  `check:contrast` does not list `--fg-3` on these grounds.
- The caption of a table takes its prompt the same way: `data-placeholder` on
  the `ekd-table-caption` while it is empty. An empty caption is then an
  empty caption to a screen reader, and not one whose text is "Caption". A
  caption that has text is read once, as its text.

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
| `data-placeholder="…"` | A block or a caption, while it is empty | The prompt shown in it. Drawn, and not read by a screen reader |
| `data-node-selected` | A block selected as a whole | An outline in the accent. `ProseMirror-selectednode` is answered too |
| `class="ekd-table-wrap"` | The element round a `table` | The scroll container. `tableWrapper` is answered too |
| `th`, `td` | Table cells | A header cell and a cell, in any row or column |
| `data-cell-selected` | A `th` or `td` | A selected cell, and each cell of a selected range. `selectedCell` is answered too |
| `class="ekd-column-resize"` | An element inside a cell | The handle on the column's edge. `column-resize-handle` is answered too |
| `data-column-resizing` | The root, while a column is dragged | The resize cursor. `resize-cursor` is answered too |
| `class="ekd-table-caption"` | A `figcaption` or `p` after the wrapper | The caption under a table |
| `class="ekd-image"`, `data-state` | A `figure` | An image block, and the two states it has no picture in. Its names are tabled in "The image block" |
| `class="ekd-image-resize"` | An element in the block's frame | The handle on the block's end edge, a slider that `attachImageResize` makes work |
| `class="ekd-footnote-ref"` | An `a` in a `sup`, with the number as its text | A footnote marker. Its names are tabled in "Footnotes" |
| `class="ekd-footnotes"`, `class="ekd-footnote"` | A `section` holding an `ol`, and each `li` of it | The notes at the end of the document, and one note |
| `data-footnote-target` | A `li.ekd-footnote`, for a moment | The note the reader has jumped to |
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
placed and when it opens (see "The toolbar and the toggle button"), a
collaborator's caret and selection, which take the `--collab-N` tokens, and
the white-space handling its editor needs on the root.

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

### The arrow on a link

The reset puts an arrow in a small box after a link in reading text, which is a
link inside a `p` or a `blockquote`, and the arrow says where the link goes. A
link that is not in reading text has none: a navigation link, an entry in a list
of titles, a table of contents entry (`.ekd-toc`), a link in a table cell or a
heading, anything inside a `nav`, and anything inside an editable surface
(`contenteditable="true"` and its descendants). Until 0.41.0 every link without
a class had one.

| `href` | Arrow |
|---|---|
| Another site: `https://…`, `//…`, `mailto:`, `tel:` | Diagonal, up and right |
| A page on this site: `/guide`, `./next`, `notes` | Right |
| A place on this page: `#terms` | Down, or up when the target is above the link |

CSS cannot tell whether a target is above or below its link, so a fragment link
points down until `InPageLinkDirection` has read the page. Render it once in
the layout, keyed on the route:

```tsx
import { InPageLinkDirection } from '@ekdotico/domico/components';

<InPageLinkDirection rescanKey={pathname} />
```

An absolute address on the site's own origin keeps the diagonal: write a link
to the site rooted, as `/guide`. A link with a class carries no arrow.

The box and the arrow are drawn with CSS alone, in the link's colour: a border
and gradients, with no image, no file and no `data:` address. A Content Security
Policy whose `img-src` leaves out `data:` therefore blocks nothing here, and no
stylesheet the package ships loads an image (`check:styles` fails on one). In
forced colours the arrow takes `LinkText`.

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
`icons` compares against `@tabler/icons`. Each needs a development dependency that is
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

## Contributing

Until the beta, Ekdotico is built by a small founding team, and we are not accepting pull requests from outside the team. Issues are very welcome: if you find a bug or have an idea, please open one. We will say here when that changes.

---

## Licence

The code is licensed under the GNU Affero General Public License, version 3 only (`AGPL-3.0-only`); see [LICENSE](LICENSE). [NOTICE](NOTICE) names the copyright holder and the logo files that are not under the AGPL. The Ekdotico name and marks are not licensed; see [TRADEMARKS.md](TRADEMARKS.md).

Versions up to and including 0.23.1 were published under the proprietary licence they carry, and stay under those terms.

Third-party material keeps its own licence. The three typefaces are each
licensed under the SIL Open Font License 1.1, and the package ships loading
configuration, not font files. The icons are domico's own set, vendored: Tabler
and Phosphor icons under the MIT License, and one adapted from MingCute under
the Apache License 2.0. [THIRD-PARTY-NOTICES.md](./THIRD-PARTY-NOTICES.md)
carries the notices.
