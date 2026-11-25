# @ekdotico/domico

## 0.51.1

### Patch Changes

- 536864f: Selected text shows in dark mode: the selection is the accent mixed 40% into the page, 1.8:1 to 3.0:1 from it in all eight themes (the quotation wash was 1.1:1 to 1.2:1), with the text on it at 6.0:1 or more. The footnotes rule runs the width of the block, as a table or a divider does, and the notes keep the measure. The sizing copy of EditableTitle has an empty alternative text, so a screen reader reads the title once.

## 0.51.0

### Minor Changes

- 3533bdc: `EditableTitle`, a page title that is edited where it stands. It looks like `PageHeading`, is the page's one `<h1>` with a textarea inside it, and wraps and grows with a long title. `label` is its accessible name and has no default; Enter or leaving the field calls `onSave(value)` when the title changed, and Escape puts the saved title back. `pending` sets `aria-busy` and ignores input without disabling the field, `error` draws a field message linked by `aria-describedby`, and `readOnly` draws a `PageHeading`. Its styles are in `styles/page-heading.css`.
- 7a49c9c: The editor stylesheet styles a heading by `data-level="1"`, `"2"` or `"3"` when the editor sets one, on any heading tag, so an application can draw the text's headings as `h2`, `h3` and `h4` and keep their look. The tag rules stay: an `h1`, `h2` or `h3` with no level looks as it did. One thing changes for a consumer that has one: an `h4`, `h5` or `h6` inside `.ekd-editor` with no `data-level` loses the browser's default margin, because the editor's margin reset now names `h1` to `h6`.

## 0.50.0

### Minor Changes

- f04d97c: `Button` and `ButtonLink` take `edge`, `'start'` or `'end'`, for the quiet variant alone (TypeScript refuses it on the others). A quiet button that leads or ends a row sets its text on the edge of the column, so a row of text and quiet buttons has one left edge. It is a negative inline margin of the button's padding and border, so the box, the 24px press area and the focus ring keep their size and reach that far outside the column: the container must not clip them. Logical, so it holds in a right-to-left row. Not for an icon-only button. Left out, nothing changes.

## 0.49.0

### Minor Changes

- 5204adf: `TextArea` takes `count`, a function from the value to its number, for a field whose server counts otherwise than in
  UTF-16 units: code points, or after trimming white space. The remaining number, the invalid state and the announcement
  follow it. Left out, the count is the length of the string as before, so nothing changes for a field that does not pass it.
  It is read only together with `maximum`.

## 0.48.3

### Patch Changes

- 0f3149e: Guidelines: every external link, `mailto:` and `tel:` included, opens in a new tab with `rel="noopener noreferrer"` and a screen-reader "(opens in a new tab)". The rule is in `AGENTS.md` and `docs/visual-ruleset.md`.

## 0.48.2

### Patch Changes

- 3825e3c: The wide-screen frame now caps the page at 1920px instead of 1440px. The sheet,
  its darker ground and the one-pixel rule on each side come in above a 1920px
  window, so a page fills any screen up to that width. Only the value moves; the
  stylesheet, its import path and `--frame-zoom` are unchanged.

## 0.48.1

### Patch Changes

- 1e50108: docs: a floating toolbar over a text selection opens once the selection is complete

  The guidance for `Toolbar` with `floating`, in its JSDoc and in the README's
  "The toolbar and the toggle button", now says when an application shows it.
  While a pointer button is held down to drag a selection the toolbar stays
  hidden, and it opens when the button is released, wherever that happens. A
  selection made by keyboard shows it at once. A toolbar that appeared and moved
  during the drag would cover the text being selected and pull the eye away. The
  application still places the toolbar and owns showing it, because the package
  cannot see the editor's pointer state. No behaviour, prop or style changes.

## 0.48.0

### Minor Changes

- 7444e5f: Numbered shortcuts for a navigation. `useNavShortcuts(ref, { enabled, items, delay })` and `attachNavShortcuts(element, options)`, from `@ekdotico/domico/a11y`, number the first nine items of the application's own navigation: Shift and a digit follows the item, and holding Shift alone for 400 ms shows each number as a badge at the end of its row. The badge is drawn by the new `@ekdotico/domico/styles/nav-shortcuts.css` from `data-nav-shortcut` on the item and `data-nav-shortcuts="visible"` on the navigation; each numbered item also carries `aria-keyshortcuts`.

  Nothing happens while focus is in a text field, a textarea, a select or an editable region, or with Ctrl, Alt or Meta held, and the digit is matched by its physical key so every keyboard layout answers. WCAG 2.1.4 applies to a shortcut that types a character, so an application that turns this on offers a setting that turns it off and passes it as `enabled`.

  Nothing existing changes, and nothing is on until an application calls the hook.

## 0.47.0

### Minor Changes

- 361d957: A wide-screen frame, as a stylesheet an application takes by importing it:
  `@ekdotico/domico/styles/frame.css`.

  Above 1440 CSS pixels the body is capped at 1440px at the interface scale and
  centred, with a one-pixel rule on each side. The ground beside it is the
  theme's page colour under a 3% layer of black. It is not part of `styles.css`,
  so nothing changes for an application that does not import it. An application
  that enlarges its page with `zoom` on body sets `--frame-zoom` to that factor.

## 0.46.1

### Patch Changes

- 34db332: docs: a label above a title is avoided as common practice

  The owner decided on 2026-11-19 that a heading stands without a small label
  above it. Nothing is removed: the `.eyebrow` role and the `eyebrow` prop of
  `AccessGate` remain for the rare case with a stated reason. `AGENTS.md` gains
  "Labels above titles", the role and the prop say to avoid them, and the
  `AccessGate` examples no longer pass the prop.

## 0.46.0

### Minor Changes

- fab9da7: Add `--scale`, the interface scale. It is one factor, 1 by default, that an application sets on `:root` (for example `:root { --scale: 1.5 }` under a media query) for an interface half as large again on a very wide screen. It replaces `zoom`, which displaced the positions scripts write from `getBoundingClientRect`.

  The factor applies to:

  - the type, spacing, radius and layout tokens, including the fluid middle term of `--fs-display` and `--fs-lede`;
  - every `rem` length in the stylesheets, and every `px` length above 3px that is not a line or a shadow;
  - icons, through a new reset rule and an `--ekd-icon-size` custom property each icon writes.

  Icon props are unchanged. An icon given its own `width` or `height` does not take the factor.

  At 1, every computed value is unchanged; `check:scale` holds the sources, tokens and icons to that. Shadows, hairlines and breakpoints do not take the factor.

## 0.45.0

### Minor Changes

- 443704a: feat: a margin note, a requirement table, and a table row that carries a note

  `MarginNote` is the marginalia the documentation site drew for itself: a small
  italic aside with a hairline rule and an optional label, in
  `styles/margin-note.css`. It is `role="note"`, named by its label, and writes
  no word of its own.

  `RequirementTable` is the documentation site's requirement table, built from
  `Table` and its parts: an identifier, the requirement, and a priority column
  where a row has one. The data is strings, and the application passes
  `renderText` to say what a string becomes. Each requirement takes `notes`.
  The words the table writes are in `labels`, with the site's own as defaults;
  a priority letter is read as its word ("Must have"), and the dash has a word
  only when `noPriority` is passed. Its styles, the `.req-*` classes and the two column widths, are in
  `styles/table.css`.

  `TableCell` takes `note`. The notes of a row are rendered inside the cell, so
  the table keeps its columns and a screen reader reads the note with its row.
  With no gutter they sit under the cell's content. A `note` that holds nothing
  (`null`, a boolean, `''`, `0`, an empty array) is no note.

  The application says where there is a gutter by setting
  `--ekd-margin-gutter: on` on an ancestor of the text column, and `off` where it
  closes. A note then floats into the gutter at the start of the column, and the
  notes of a table row stand in the same gutter, level with the row: those of a
  row's last cell, and those of a requirement. The row is as tall as its notes,
  so many notes neither meet nor move away from their rows. A row's notes take
  the gutter only above 920px, where the table's card does not scroll, and the
  table needs 216px free at its start. Unset, in print, and
  in a browser without container style queries, there is no gutter.

  Nothing that existed changes: a `TableCell` without `note` renders the `<td>`
  it rendered.

## 0.44.2

### Patch Changes

- 3c02902: fix: an empty block grows to hold a prompt that wraps

  The editor's prompt was a float with no height, so on a narrow editor or with a
  wide `--ekd-editor-placeholder-offset` its second line was drawn outside the
  block and over what came after. It is now an inline box as wide as the line,
  whose end margin takes that width back, and as tall as its text: a prompt that
  wraps makes its line, and so its block, as tall as the wrapped text, whether
  `data-placeholder` is on the block or on an element inside it. A prompt of one
  line, the caret at the start of the line and the offset are unchanged.

## 0.44.1

### Patch Changes

- 05eb8fd: fix: an icon with no `size` is 16×16 again, not `1em`

  0.44.0 made the default `1em`, so an icon followed the font size of its
  control: a 15px editor control drew 15×15, and a 13px toolbar button drew
  13×13. The default is a fixed 16×16 whatever the font size around it. Pass
  `size` to scale one deliberately. Icon-only `Button` and `ButtonLink` are
  unchanged: a 20×20 box, a 16×16 glyph, a 24×24 pointer target.

## 0.44.0

### Minor Changes

- ebd685c: feat: twelve icons, and an `icon` on Button and ButtonLink

  `@ekdotico/domico/icons` gains twelve Tabler outline icons, copied verbatim and
  recorded in `scripts/icon-sources.json`: `PilcrowIcon`, `Heading1Icon`,
  `Heading2Icon`, `Heading3Icon`, `ListIcon`, `ListNumbersIcon`, `PhotoIcon`,
  `CopyIcon`, `UsersIcon`, `TrashIcon`, `BellIcon` and `SettingsIcon`.

  `Button` and `ButtonLink` take an optional `icon`, a domico icon component,
  drawn at `1em` before the label. With an icon and no children the control is
  icon-only: a 20×20 box holding a 16×16 glyph, with a 24×24 pointer target (a
  transparent `::after` reaching 2px past the box), that takes a required `label`, which is its
  `aria-label` and the text of a `Tooltip` shown on hover and on keyboard focus.
  The props are a union, so an icon-only button with no `label` does not
  compile; beside children, `label` is refused. `children` on `Button` and
  `ButtonLink` is now a required key in the labelled shape (a button with no
  children and no icon no longer type-checks). Icon-only needs
  `styles/tooltip.css` as well as `styles/button.css`. No token is added.

  **Icon size rule, which changes a shipped default.** An icon with no `size` is
  now `1em`, the font size of where it sits, where it was a fixed 16px. At 16px
  text nothing moves; in 15px (`--fs-base`) text it is 15px and in 13px
  (`--fs-sm`) text it is 13px, so every unsized icon in an application (a
  callout's, a select's or menu's chevron, the sync mark, a toolbar's) follows
  its context. Pass `size` to keep a fixed pixel size; the package's own dialog
  and drawer icons do.

  The editor's empty-line prompt can start after a leading control: set the
  optional property `--ekd-editor-placeholder-offset` on the editor (or an
  ancestor) and `.ekd-editor [data-placeholder]::before` takes it as
  `padding-inline-start`, so it holds in right-to-left. It is a new public
  property, not a token, and unset it is `0`: nothing moves.

  Controls that belong to one block can rest faint: put `data-dim-at-rest` on the
  container, and set `data-active` on it while the caret is in that block. Inside
  it the secondary, quiet and destructive Button and ButtonLink, the MenuButton
  trigger and the code block header rest in `--fg-3` (a colour change, not
  opacity) and return on the container's `:hover` and `:focus-within`, and under
  `data-active`. Always full strength under `hover: none`, `prefers-contrast:
more` and forced colours; the fade is `--dur-fast` and drops under reduced
  motion. No token is added.

### Patch Changes

- a4347b3: fix: the default theme is always on `<html>`, so dark mode applies on a first visit

  The dark tokens are keyed on `[data-theme="…"][data-mode="dark"]` and, for
  Auto, `[data-theme="…"]:not([data-mode])` inside `prefers-color-scheme`. With
  no `ekd-theme` cookie `<html>` had no `data-theme`, so neither matched: choosing
  Dark in the menu, or a dark operating system with Auto, still rendered light.
  `appearanceAttributes` now returns `data-theme="parchment"` (`DEFAULT_THEME`)
  when there is no valid cookie, and `themeInitScript` writes it when the
  document has none, so server and client agree. A consumer will notice
  `data-theme="parchment"` on `<html>` for a reader who has chosen nothing, where
  the attribute was absent; a selector or test that expected it absent needs
  updating. `AppearanceAttributes['data-theme']` is now a required key.

## 0.43.2

### Patch Changes

- 2f173fc: The logo files are no longer under the AGPL

  The files under `assets/logo/`, the mark's path data in `src/components/Logo.tsx`, and the four `--logo-tile-*` brand tokens (and their built copies under `dist/`) are now all rights reserved, with permission to show and redistribute them unchanged when naming Ekdotico and inside copies of the package. The rest of the package stays under `AGPL-3.0-only`. Versions 0.24.0 to 0.43.1 shipped them under the AGPL and keep that licence for those copies.

  New files ship with the package: `NOTICE` names the copyright holder and lists the carved-out files, and `TRADEMARKS.md` is rewritten. `CONTRIBUTING.md` and the README say that outside pull requests are not accepted yet and that issues are welcome. `package.json` names the holder as `author`.

## 0.43.1

### Patch Changes

- bc9733b: fix(lint): a pluralised variant or prohibited term no longer slips past the copy linter

  Controlled-vocabulary variants and `word` and `phrase` prohibitions now match
  their regular English plural as well as the form written in the data: "writing
  records" is blocking like "writing record", "polishes" like "polish", and
  "faculties" is confirmable like "faculty". Before this, three uses of "writing
  records" passed the linter in a single proposal. `regex` and `unicode-range`
  rules are unchanged. Irregular plurals (analysis, analyses) are not matched;
  list them as variants in their own right.

  Two generated plurals that ordinarily mean something else are listed under
  their term's `notDetectable`, which the linter now honours: "docs"
  (documentation, and the name of a repository) and "cites" (a verb). Expect new
  findings in consuming repositories where prose already used plurals of
  non-canonical terms, such as "paid tiers" or "reviewers".

## 0.43.0

### Minor Changes

- 8815ee5: Adds `ButtonLink`, the button's skin on an `<a>`, for navigation. It takes the four `Button` variants and passes anchor attributes through (`href` is required); it has no pending or disabled state. Use `Button` for an action and `ButtonLink` for a control that goes somewhere, rather than putting `.ekd-button` on your own `<a>`.

  The skin on an anchor now holds against an application's link rules. `a.ekd-button[data-variant]` states colour, background, all four border sides and `text-decoration: none` in `:link`, `:visited`, `:hover`, `:active` and `:focus-visible`, at specificity (0,3,1), so rules such as `.content-inner a:hover` (0,2,1) no longer turn a primary label into its own fill. The primary variant's hover now also sets its colour. `<button>` rendering is unchanged.

  Height stays about 40px for `Button` and `ButtonLink`; an application that needs a 44px target adds `padding-block` to its own class.

## 0.42.1

### Patch Changes

- 1578a87: Type is now consistent across components. Values change; no class or token is added or removed.

  What a reader will see:

  - **Key-value values and callout bodies are larger.** `.kv-val` and `.callout-body` (and a paragraph inside one) move from 13px to 17px (`--fs-md`), the serif reading size, so a fact or a note reads at the size of the page's long-form text. `KeyValueList` cards and inline lists wrap onto more lines; both still fit at 360px.
  - **Data labels share one style.** Table headers and captions, `KeyValue` keys, `Stat` labels, `Callout` titles and `.badge` are all 11px (`--fs-2xs`), semibold, at `--tr-label`. Table headers and captions grew from 10px; stat labels shrank from 13px; callout titles and badges changed tracking (callout titles `--tr-wider` to `--tr-label`, badges `--tr-wide` to `--tr-label`, medium to semibold).
  - **Section eyebrows share one style.** `.eyebrow` was already 13px, `--tr-widest`, medium; the `OnThisPage` eyebrow now matches it (it was 10px).
  - **Inline `code`, `kbd` and `samp` outside a code block are set at `--serif-fit`** (0.84em), so mono beside serif no longer looks oversized. Code blocks (`pre`) are unchanged.
  - Table cell and badge line-heights use `--lh-normal` (1.5) instead of 1.45 and 1.4. The key-value card padding and bottom margin, and the row gap, use space tokens where one matches.

  `Stat` sub-lines stay 13px: they are a short italic caption, not running text.

## 0.42.0

### Minor Changes

- 0e65a7e: **Added: `@ekdotico/domico/color`, the package's OKLCH and sRGB maths.** It exports `oklchToHex`, `hexToOklch`, `parseOklch`, `luminance`, and `contrast`. These are the functions that already generate the Mermaid palette and back `check:contrast` and `check:collaborators`, now with types.

  It is for a surface that takes no CSS custom properties and cannot paint `oklch()`. The first is the alpha site's Open Graph image, which Satori draws to SVG and resvg paints. That site had begun to carry its own copy of the conversion, the drift this package exists to end. With this export, an application converts a token's value (`oklchToHex(palettes.parchment.light['bg-canvas'])`) and never writes a hex colour of its own.

  Nothing changes for an existing consumer.

## 0.41.3

### Patch Changes

- ac6f701: **Fixed: a field hint fills the width of its control on iPhone.** `.ekd-field-hint` inherited `text-wrap: pretty` from the reset, and WebKit's pretty evens the rag over the whole paragraph rather than only its last line. Under a full-width field every line of a hint therefore ended well short of the field's edge, and the hint read as narrower than its own control: on the alpha site, "Optional. Once you confirm your address…" under the user-testing box. Reported by the owner, 2026-11-02.

  The hint now sets `text-wrap: wrap`, so its lines fill the column. Paragraphs elsewhere keep `pretty`. This affects every hint rendered by `TextField`, `TextArea`, `Select`, `PasswordField`, and `Choice`. Nothing is added, renamed or removed, and a consumer has to change nothing.

## 0.41.2

### Patch Changes

- f404064: The icon set is now domico's own, built on Tabler, in place of Lucide. Every export of `@ekdotico/domico/icons` keeps its name and props; only the drawings change.

  - 28 icons are Tabler outline icons, copied unchanged from `@tabler/icons`.
  - `MonitorIcon`, `MoonIcon`, `PaletteIcon`, `SearchIcon`, `CircleQuestionMarkIcon`, `HighlighterIcon` and `LightbulbIcon` are Phosphor regular icons redrawn as strokes on Tabler's 24-unit grid, Phosphor's design kept.
  - `QuoteIcon` is drawn after MingCute's `quote-left-line` with the heads filled.

  The house stroke stays 1.5 on the 24-unit grid, one pixel at the 16px default. `scripts/icon-sources.json` records each icon's source, and `check:icons` now holds every Tabler icon to `@tabler/icons` and requires the others to name what they were drawn from. `@tabler/icons` replaces `lucide-static` as the development dependency the check reads. THIRD-PARTY-NOTICES.md carries the MIT notices for Tabler and Phosphor and the Apache 2.0 licence for MingCute. The link arrow drawn by `reset.css` is unchanged.

## 0.41.1

### Patch Changes

- 480b16a: **Fixed: a link's underline no longer breaks around descenders.** The browser's default, `text-decoration-skip-ink: auto`, lifts the underline wherever a letter drops below the line, so at the package's 0.15em offset every g, j, p, q and y cut it: on the alpha site "How your address is kept" was underlined in three pieces and read as clipped. Reported by the owner, 2026-10-28.

  Every link underline the package draws now sets `text-decoration-skip-ink: none` and runs unbroken from the first letter to the last: the unclassed link in the reset, `.ekd-fault-list a`, a link in `.ekd-editor`, `.ekd-toc-list a:hover` and `.ekd-footnote-ref`. The offset, thickness, colour and arrow are unchanged. Nothing is added, renamed or removed, and a consumer has to change nothing.

## 0.41.0

### Minor Changes

- 7a9d608: **Changed: the arrow on a link appears in reading text only.** Since 0.35.0 every link without a class had one, which put it on navigation links, on the titles in a list of documents, on the entries of a table of contents and on links inside the text a writer is editing. Decided by the owner, 2026-10-26.

  - **A link has the arrow when it is inside a paragraph or a quotation** (`p`, `blockquote`): a link in a sentence of ordinary page copy, as before, in the same box and the same direction by `href`.
  - **A link has no arrow** when it is a navigation link, an entry in a list of titles, a table of contents entry (`.ekd-toc`), a link in a table cell or a heading, anything inside a `nav`, or anything inside an editable surface (`[contenteditable="true"]` and its descendants), even where a paragraph surrounds it.

  The underline, the colour on hover and focus, and the direction rules are unchanged; only the box is drawn in fewer places. Nothing is added, renamed or removed, and a consumer has to change nothing: a link in a paragraph keeps its arrow. A link in bare text outside any `p` (a list item or a `div` of prose) no longer has one; wrap the text in a `p` if it should.

  **Changed: the footnote marker no longer draws an enlarged target.** `.ekd-footnote-ref::after`, the invisible 24 by 24 square centred on the number, is removed, along with the `position: relative` it needed. In an editor it caught clicks 4 to 8px beside the number that were meant for the text. A marker is inside a sentence, which WCAG 2.2 SC 2.5.8 exempts from the 24px minimum (the Inline exception). The marker is still a link, keeps its colour, underline and focus ring, and takes no room in the line. A consumer that styled `.ekd-footnote-ref::after` itself should drop that rule.

## 0.40.1

### Patch Changes

- 5de4b61: **Fixed: the arrow on links in running text no longer needs an image.** Since 0.35.0 the box and arrow were a `mask` over an inline `data:` SVG, so an application whose Content Security Policy `img-src` leaves out `data:` (the Ekdotico application allows only itself and its image store) blocked it: the arrow did not draw and the browser reported a violation on every page with such a link. Requested by the owner, 2026-10-25.

  The box is now the pseudo-element's own border and each stroke of the arrow is a gradient, all `currentColor`, so there is no `url()` of any kind. Nothing visible changes: the same box (0.6417em, corner 0.175em), the same stroke weight, the link's colour at rest and the accent on hover and focus, the same direction by `href` and `data-link-direction`, and `LinkText` in forced colours. No export, class, token or prop is added, renamed or removed.

  **Added: a guard.** `check:styles` now fails on a `url()`, an `image-set()` or an `@import` in any stylesheet the package ships. It is a package check only; a consuming repository's own `url()` is not a finding. The only `url()` the package shipped was this one.

## 0.40.0

### Minor Changes

- 4c18796: **Changed: the arrow on links in running text says where the link goes.** Requested by the owner.

  - A link to another site (a full address, `//host`, `mailto:`, `tel:`) keeps the diagonal arrow, unchanged.
  - A link to a page on the site (a rooted or relative path, `/guide`, `./next`) shows an arrow pointing right.
  - A link to a place on the page (`#terms`) shows an arrow pointing down, or up when the target is above the link.

  **Added: `InPageLinkDirection`**, a component that renders nothing and sets `data-link-direction="up"` or `"down"` on every fragment link, from the document order of the link and its target. CSS cannot compare the two, so without it every fragment link points down. Render it once in the layout with `rescanKey={pathname}`.

  An absolute address on the site's own origin cannot be told from another site in CSS and keeps the diagonal; write such links rooted. All three arrows are the same `currentColor` mask in the same box, and forced colours still paint them `LinkText`.

## 0.39.0

### Minor Changes

- 9238744: Proposed for the docs title page, and approved by the owner on 2026-10-22.

  **Added: `--fs-title`.** It is `clamp(var(--fs-4xl), 7vw + 0.375rem, var(--fs-6xl))`, and is used for a site's name at title-page scale. It is 48px up to 600px, grows to 76px at 1000px and holds there. It replaces the docs site's own `clamp(var(--fs-4xl), 8vw, var(--fs-6xl))`, the last font-size `clamp()` left in an application. `docs/design-tokens.md` lists it under "Fluid sizes", and `AGENTS.md` rule 2 names it.

## 0.38.0

### Minor Changes

- d41831e: Footnotes in the document surface: four names, all styles, in `styles/editor.css`. Requested by the Ekdotico application (register row S20-1, slice 20). Nothing is renamed, removed or changed in meaning: three classes, one attribute, no token, no component, no export and no new subpath.

  - **`ekd-footnote-ref`** on the `a` in a `sup`, with the number as its text. It reads as a link (the accent, underlined, a step heavier, a heavier underline under the pointer) and takes the ink of the text inside a highlight. It adds nothing to the line: the `sup` rule gives it no height, and its target is a 24 by 24 CSS pixel square (`--sp-6`, WCAG 2.5.8) drawn as an out-of-flow `::after` centred on the number, in any writing direction and at any text size. The focus ring is the system's, the accent at 2px offset 2px, written on the marker so that it does not depend on the reset being loaded.
  - **`ekd-footnotes`** on the `section` at the end of the document, holding an `ol`. It is set off by a rule in `--rule-strong` and space above, a size down (`--fs-base`). The numbers are the `ol`'s own, decimal, so the Nth note carries the number the Nth marker says: give the `ol` no `start`, `type` or `reversed`.
  - **`ekd-footnote`** on each `li`. Editable text with its line breaks kept as written (`white-space: pre-wrap`), and an address in it wraps and does not widen the page.
  - **`data-footnote-target`** on the note a reader has just jumped to, for the moment the application leaves it there: a wash in `--accent-soft` (`--fg-1` over it holds 4.5:1, measured by `check:contrast`) that fades over `--dur-slow`. Reduced motion: no fade. Forced colours: a 2px `Highlight` outline, since a wash is not drawn.

  Not in the package, and owed by the application: the numbering and order of the markers, the `id` and `href` that join a marker to its note, a name for the marker ("Footnote 1"; the number alone does not give one), moving the reader to the note, a way back, and removing `data-footnote-target` a moment after the jump. Two markers side by side share their squares, and a separator between them is the writer's.

  **Checked.** `check:components` reads the stylesheet for each of the above: the square and how it is centred, that the marker is given no box that can open the line, the ring and that nothing removes it, the rule and the decimal numbering, the line breaks, the wash and the two media queries, the absence of any colour, length, fallback or physical side outside the hairline and the 2px ring, the three contrast pairs the footnotes draw, that `base.css` and `components.css` carry the same rules as `editor.css`, and that the README and the visual ruleset name the four. Looked at in Chromium: the marker's hit area (a point 11px from its centre in each direction presses it and one 13px away does not, in a left to right and a right to left line), the height of a line with a marker and without one (the same, 28.05px), the focus ring from Tab, the list at 320px with no horizontal scroll and a long address wrapping in a note, and the four palettes in dark. Forced colours and a touch device were not looked at: the stylesheet's rules for the first are held by name only.

## 0.37.1

### Patch Changes

- ea36ce6: **Fixed: the fluid sizes in `docs/design-tokens.md`.** `--fs-lede` is 20px at 1000px, not 17px: its ramp reaches its ceiling near 800px, not 1600px. The table and the note on slopes now give the measured values, and the note says to check a new slope at 375, 1000 and 1600px. No token changes.

## 0.37.0

### Minor Changes

- 582cb26: Requested by the owner after the alpha site's hero was retuned.

  **Added: fluid type tokens.** `--fs-display` is `clamp(var(--fs-xl), 1.6vw + 0.9rem, var(--fs-4xl))`, about 24px at 375px, 30px at 1000px and 40px at 1600px, for a page's one display heading. `--fs-lede` is `clamp(var(--fs-md), 1vw + 0.75rem, var(--fs-lg))`, for the paragraph under it. Both ends of each are steps of the scale.

  **Documented.** `docs/design-tokens.md` documents how a fluid size is built and how to add one. `AGENTS.md` rule 2 now says that an application never writes a `clamp()` for a font size.

  **Changed: `--fs-xs` is 13px (`0.8125rem`), was 12px.** It now equals `--fs-sm`. Every badge, eyebrow, caption and chip that uses it grows a pixel, in this package and in every application.

## 0.36.1

### Patch Changes

- 8c6c48b: **Changed: the arrow on links in running text.** It sits in a small rounded box and takes the link's own colour again: the paragraph's at rest, the accent on hover and focus. Requested by the owner, who reversed the always-accent arrow of 0.36.0. Box and arrow are one `currentColor` mask at `0.7em`, and forced colours still paint it `LinkText`. Nothing is added or removed.

## 0.36.0

### Minor Changes

- f2b0fa6: **Changed: the arrow on links in running text.** It is now always the theme's primary colour (`--accent`), at rest as well as on hover, instead of following the link's text colour. Requested by the owner. The text itself is unchanged: the paragraph's colour at rest, `--accent` on hover and focus. Forced colours still paint the arrow `LinkText`.

## 0.35.0

### Minor Changes

- c910d74: **Changed: links in running text.** An unclassed anchor, the one an author writes in copy, now:

  - turns the theme's primary colour (`--accent`) on hover and on keyboard focus;
  - gets a heavier underline on hover and focus, `from-font` at rest and `0.12em` on hover, so the cue is not colour alone;
  - carries a small diagonal arrow at its top-right corner, Lucide's arrow-up-right drawn as a `currentColor` mask, so it reads as a link before the pointer reaches it.

  Requested by the owner. The arrow follows the link's colour through hover and every theme, takes `LinkText` in forced colours, is not read aloud, and is not underlined.

  A link with a class is untouched, as before: navigation, buttons, the table of contents and an application's own styled links keep their look. An application that wants the arrow off a particular unclassed link gives it a class.

## 0.34.0

### Minor Changes

- 7a5d954: **Changed: `Logo`.** The tile is now the wordmark's E: the lockup reads as the epsilon tile followed by "kdotico", set tight against it, in place of a tile, a gap and "Ekdotico". Requested by the owner from the icai header.

  The tile is sized to one em of the wordmark and aligned on its baseline, so it scales with the letters. `.logo` now carries the wordmark's font family and size, so an application that sets `font-size` on `.logo` scales the whole lockup; one that set it on `.logo-wordmark` alone now scales the letters without the tile. The `size` prop no longer sets the rendered size; it is only the width the SVG claims before the stylesheet loads.

  A screen reader still hears "Ekdotico", once: the tile and the visible "kdotico" are hidden from it, and a visually hidden span carries the name.

  `OpeningSequence` is unchanged: its mark stands above the wordmark rather than beside it, so it keeps "Ekdotico" in full.

## 0.33.0

### Minor Changes

- ef70905: The mark is now the epsilon from the Logo & Iconography Figma file (node 91:22), replacing the stroked arch. Requested by the owner when the icai site asked for the new logo; the package is where the mark lives, so it changes here and every application takes it on the pin bump.

  **Changed: `LogoMark`.** One filled path in a 360×360 viewBox, in place of three stroked subpaths in 512×512. `ink`, `solid`, `dark-solid` and `light-solid` keep their meaning and their tokens, now as the glyph's fill rather than a stroke. The tile colours were already the Figma "Light" and "Dark" pairs, so no token value moves; two token descriptions now say "glyph" instead of "stroke".

  **Removed: `variant="draw"` and `pathRef`.** They existed so the opening sequence could trace the arch on as one stroke, and the epsilon is a filled shape with no line to trace. Neither appears outside this package in deree, docs, praktico or icai. An application that passes either will fail to type-check, which is the intended signal.

  **Changed: `OpeningSequence`.** The mark fades in and settles a step upward instead of being drawn. Every duration is unchanged (the mark's entrance keeps `--intro-draw`), so the wordmark, the hold and the fade land where they did, and a reader who asks for reduced motion still sees nothing.

  **Changed: `assets/logo`.** All 84 sized files (SVG and PNG, seven sizes, `original`, `dark` and `branded`, solid and transparent) and the two standalone marks are regenerated from the component's path, in the same colours and under the same names. `check:icons` now asserts that every SVG of the mark carries the component's path exactly, in place of the check that the arch's two spellings agreed.

  Applications keep their own favicons (`app/icon.svg`, `apple-icon.png`); those are not in the package and change in each application.

## 0.32.0

### Minor Changes

- 96aa769: The image block: styles for a picture in the document with a caption and a width, and `attachImageResize`, which makes the handle on its end edge work. Requested by the Ekdotico application (register row S19-8, FR-ED-08, "resizing via a drag handle"), which found no handle for the width of a block in 0.31.0 and stopped rather than improvise one. Nothing is renamed, removed or changed in meaning: nine classes, one helper, no token, no component and no new subpath.

  **Added: the block, in `styles/editor.css`.** `ekd-image` on a `figure`, holding an `ekd-image-frame` (the picture's box and the handle's), an `ekd-image-img`, an optional `ekd-image-status`, an `ekd-image-resize`, and an `ekd-image-caption` after the frame. The caption is drawn as a table's caption, in one rule with it.

  - **The width** is a share of the text column, 10 to 100, set as `--ekd-image-width` on the frame and clamped by the stylesheet: never below a tenth of the column or `--sp-7`, never past the column, whatever a document says. Unset, the block fills the column, and there is no fallback written into the `var()`.
  - **Two states with no picture:** `data-state="uploading"` and `data-state="unavailable"` on the block. The `img` is not drawn in either; the status says why, in the application's words. A solid edge while it arrives and a dashed one when it will not come, so the two are not told apart by colour alone.
  - **Selected** is the outline every block has (`data-node-selected`, or `ProseMirror-selectednode`). A frame being dragged has `data-resizing`: an outline in the accent, and the handle held down.
  - **The handle** sits inside the frame at its inline-end edge, in logical properties, so it adds nothing to the width of the page at the full width and holds at 320px. It is `--sp-6` wide and `--sp-7` tall (WCAG 2.5.8), on `--bg-raised` with a `--rule-control` boundary so that it shows on any picture, with a grip of two lines. The focus ring is two rings, the accent and the ground between it and the handle, so one of the two edges holds against a picture of any colour. `touch-action: none`, so a touch that starts on it is a drag. Forced colours: `Canvas`, `ButtonText`, and a `Highlight` ring. Reduced motion: no fade. Not printed.

  **Added: `attachImageResize`, from `@ekdotico/domico/a11y`.** Framework-neutral and headless: given the handle and the frame, it makes the handle a `role="slider"` (`aria-valuemin`, `aria-valuemax`, `aria-valuenow`, `aria-valuetext`, a Tab stop where there is none) and keeps `--ekd-image-width` on the frame in step with it. Not given a Tiptap or ProseMirror dependency, and the package has none: a node view calls it.

  - **Pointer:** press and drag toward the end of the line, by pointer capture, for mouse, touch and pen. The width is the share of the column the pointer has moved, whole percent, clamped. Escape, `pointercancel` and a lost capture put the width back. A right button, a second finger, and a column with no width do not begin a drag. In a right to left block the drag runs the other way.
  - **Keyboard:** Right and Up widen by 5, Left and Down narrow by 5, Page Up and Page Down by 25, Home and End go to 10 and 100. A key lands on a multiple of the step. In a right to left block Left widens and Right narrows, as a native range input does. The key goes no further than the handle, so the editor round it does not move its caret.
  - **Events:** an `ekd-image-resize` CustomEvent on the handle, bubbling, with `{ width, phase, source }` (`ImageResizeDetail`). `phase` is `move` during a drag (shown, not decided: do not write it to the document), `commit` when the width is final and differs (one per key, one at the end of a drag: write it), and `cancel` when a drag ended where it began or was abandoned (write nothing). `source` is `pointer` or `keyboard`.
  - **Returns** `{ update(width), destroy() }`. `update` shows a width from elsewhere and does not interrupt a drag. Options: `handle`, `frame`, `width`, `min`, `max`, `step`, `pageStep`, `valueText`.
  - **It names nothing.** It sets no `aria-label`: what the handle is called is the application's words. `valueText` defaults to the number and a percent sign.
  - Also exported: `clampImageWidth`, `imageWidthForKey`, `imageWidthForDrag` (the arithmetic with no element in it), and `IMAGE_RESIZE_EVENT`, `IMAGE_WIDTH_PROPERTY`, `IMAGE_WIDTH_MIN`, `IMAGE_WIDTH_MAX`, `IMAGE_WIDTH_STEP`, `IMAGE_WIDTH_PAGE_STEP`, and the types. The module touches nothing when it is loaded, so a server module may import it.

  **What the handle is not.** WCAG 2.5.7 (Dragging Movements) asks for a way to set the width with a single pointer and no drag. The keys are for a keyboard and are not that. The block's own controls supply it: a `Select` of widths beside the alt text and the caption. The README says so, and says what else the application owes: a name on the handle, `contenteditable="false"` on the frame, no handle for a reader who cannot edit, `aria-busy` and a `role="status"` for the states.

  **Checked.** `check:components` runs the helper in jsdom against a column of a given width (the keys in both directions and at both ends, a drag and each way it ends, Escape, `pointercancel`, a lost capture, a second pointer, the events and their order, `update` during a drag, `destroy`), loads the entry with no `window` or `document`, compiles `scripts/fixtures/image-resize-types.ts` against the built declarations, and reads the stylesheet for the target, the ring, the states, the logical sides, the three media queries and the absence of any literal, and `check:contrast` for each pair the block draws (all were already measured; no new pair). Reverting any one of them fails a case. Looked at in Chromium: laid out at 320px (the page is 320px wide with no horizontal scroll, the handle 24 by 32 inside the frame at every width, the unavailable status wrapping beside it), dragged with a real pointer and moved by the keys at desktop width, in the light and dark palettes it was tried in. Forced colours and a touch device were not looked at: the stylesheet's rules for them are held by name only.

  **Not changed:** `.ekd-column-resize` and `data-column-resizing` are as they were. The block is not a component and not a node: how an application stores the width, the alt text and the picture is its own.

## 0.31.0

### Minor Changes

- fcbbe77: `Avatar` and `AvatarStack`: a person's picture, and the people who have a document open as a row of them. Requested by the Ekdotico application (register row PR-1, Ekdotico/ekdotico#49). Nothing is renamed, removed or changed in meaning: two components, one helper, one stylesheet entry and no token.

  **Added: `Avatar`.** The picture is the person's initials on their collaborator colour, `--collab-N` with `--collab-N-ink`, so one person is one colour in the caret, the selection and the header. An image path is ready and nothing uploads: `src` is drawn over the letters, with no alternative text of its own, and the letters are what is left if it fails to load.

  - Props: `collaboratorSlot` (1 to 10, required; anything else is a `RangeError` at render), `name` or `initials` (one is required), `label` or `decorative` (one is required, not both), `src`, `size` (`'sm' | 'md' | 'lg'`, 24, 32 and 40 pixels at least: `--sp-6`, `--sp-7`, `--sp-8`).
  - **Every call says whether the picture is named.** `label` makes it an image with that name, for an avatar that stands alone. `decorative` hides it from a screen reader, for one beside the person's name or in a stack. There is no default and the types refuse a call that gives neither, because an unnamed picture draws exactly as a named one.
  - **Initials are cut by grapheme.** `avatarInitials(name)` is exported: the first grapheme of the first and of the last word, capitalised with `toUpperCase` (locale-independent, so the server and the browser agree). `Μαρία Παπαδοπούλου` is `ΜΠ`; an accent, a combining mark, a letter outside the BMP, a flag and a joined emoji are each one character. `initials`, where passed, are drawn as given, cut to two graphemes. The letters are `--font-sans`, which has Greek.
  - The circle is a minimum (`min-inline-size`, `aspect-ratio: 1`) and grows with its letters, so a larger text size is a larger picture and not clipped letters (WCAG 1.4.4). At the default size every picture in a row is the same size.
  - The ring is a 2px border in `--bg-surface`, not a shadow, so forced colours keep it; there it is `CanvasText`.

  **Added: `AvatarStack`.** A `<ul role="list">` named by `label`. Each person is an item holding the picture (`aria-hidden`) and a line of text, hidden from the page and kept inside the item, that reads the name, the `you` words in parentheses and then the role: "Maria Papadopoulou (you), Editor". The item is `position: relative`, so the hidden words cannot escape a scroll container (the 0.30.0 lesson); the stylesheet carries its own copy of the technique.

  - Props: `label`, `people` (`{ id, name, collaboratorSlot, role?, initials?, src?, you? }`), `max` (people drawn, 4 unless set), `more` (`(hidden: number) => string`, required, called only when someone is left out), `size`. Every word a screen reader hears is the application's: the package has no default for `label`, `more`, `you` or `role`.
  - Past `max`, one more item counts the rest. It draws `+3` (`aria-hidden`) and reads `more(3)`, "and 3 more people" in the application's words. It is the one picture with no person's colour: `--fg-1` on `--bg-surface-2`.
  - **Not focusable, deliberately.** A person in the stack has nothing to do today, and a Tab stop that does nothing is one the reader must pass and a control that is not one (WCAG 4.1.2). It is read in reading order, as a list. When a person gets an action it is a new prop and a button in the item; the stylesheet already raises an item with focus above its neighbours, so the overlap will not hide its ring.
  - A person with `you` has a ring in `--fg-1` as well as the words. Colour is never the only signal: the name is text in the item.
  - Each picture overlaps the one before by 4px (2px at `sm`), short of the second letter; the row wraps, so ten large pictures at 320px are two lines and not a horizontal scroll bar. Nothing moves, so there is no motion to reduce.

  **Added: `@ekdotico/domico/styles/avatar.css`**, sliced from `components.css` like the other entries and carried by `styles.css` and `styles/components.css`. Classes: `ekd-avatar`, `ekd-avatar--sm`, `ekd-avatar--lg`, `ekd-avatar-slot-1` to `-10`, `ekd-avatar-letters`, `ekd-avatar-image`, `ekd-avatar-stack`, `ekd-avatar-stack--sm`, `ekd-avatar-stack-item`, `ekd-avatar-text`. `build:styles` now writes thirty-three entries.

  **Contrast.** `check:contrast` lists, for each of the ten slots, `--collab-N-ink` on `--collab-N` at 4.5:1 and `--collab-N` on `--bg-surface` and on `--bg-canvas` at 3:1, in all eight palettes (240 measurements more; 704 in all). The worst initials are 4.68:1 (light) and 5.22:1 (dark); the worst edge against the ring 4.37:1 and against the canvas 4.15:1. `check-contrast.mjs --pairs` prints the list.

  **Documentation.** The README has a new section, The avatar and the avatar stack, and the subpath table lists `avatar.css`; `docs/visual-ruleset.md` and the Collaborator section of `docs/design-tokens.md` say what the picture is and how it is measured.

  `check:components` holds each part: the letters of Greek, accented, combining, astral and emoji names; `label` and `decorative` and the `RangeError`; the image replacing and then yielding to the letters; the list's role, name, order, hidden words inside their items, the count and its words, `max`, `you`, and that nothing in it is focusable; the types by compiling `scripts/fixtures/avatar-types.tsx` against the built declarations; and `dist/styles/avatar.css`, for the slot-to-token mapping of each of the ten slots, the pairs `check:contrast` measures for them, the minimum size, the sans, the border ring, the wrap, the positioned item, the focus raise and the absence of motion. Each fails if its part is reverted.

## 0.30.0

### Minor Changes

- 358a2bc: Row headers in a table, `scope` on header cells, and a `Checkbox` whose label only a screen reader hears. Found while building a permissions table in the Ekdotico application (register row S16-8). No export, class or token is renamed or removed, and no prop changes its meaning. One optional prop is added, `labelHidden`, and two props types are widened.

  **Added: a header cell in `TableBody` is drawn as the header of its row.** `table.css` styled `tbody td` and nothing else, so a `TableHeaderCell` placed in a body row got the browser's default: centred, unpadded and unruled, in a card whose cells were all three.

  - A `th` in `tbody` now takes every rule a body cell takes — the padding, the bottom rule, the side outline and the rounded corners of the last row, the wrapping that keeps the table in its column, and the hover wash — through `:is(td, th)` on those selectors.
  - It then differs from a body cell in three things: `font-weight: var(--fw-semi)`, `color: var(--fg-1)` (the ink of `.td-strong`) and `text-align: start`. It does not take the column header's label treatment: the sunken ground, the small tracked type, `nowrap` and the sticky position remain on `thead th` alone.
  - No token is added. A header cell in `thead` and a body cell are drawn as before. A table that already put a `th` in `tbody` and styled it itself should check that its rule still wins: the package's rule has the specificity of one class and two elements.

  **Changed: `TableHeaderCell` is typed with the attributes of a `<th>`, and `TableCell` with those of a `<td>`.** Both were `HTMLAttributes`, so `scope`, `colSpan`, `rowSpan`, `headers` and `abbr` were refused by the compiler although they always reached the element. This widens a type; nothing that compiled stops compiling.

  - **`scope` is not defaulted.** The same component is a column header in `TableHead` and a row header in `TableBody`, and it cannot tell which. Pass `scope="col"` or `scope="row"`. A browser infers the scope of a table with one header row or one header column, so leaving it off there is not a fault; a table with both, or a row header past the first column, needs it (WCAG 1.3.1, technique H63).

  **Added: `Checkbox` takes `labelHidden`.** `labelHidden?: boolean`, the name `Select` already uses. The label is kept for a screen reader and is not drawn. It is still required, since it is the box's name, and the box still sits inside its `<label>`.

  - The hidden words take `.sr-only` from the reset, as `Select`'s do. The label gets the class `ekd-choice--bare`, which positions it (`position: relative`), so the words are contained by their own label. A bare `.sr-only` in a table cell lays out against the nearest positioned ancestor, which a cell is not, and escaped the table's scroll container: the application's permissions table overflowed sideways by 475px at 320px until a cell was positioned.
  - The same class shrinks the label to the box (`inline-size: fit-content`), so the empty line beside the box does not toggle it, and gives it a 24px minimum width (`min-inline-size: var(--sp-6)`, WCAG 2.5.8). A `Checkbox` without `labelHidden` is drawn and marked up as before.
  - The class is new in `styles/form.css`, which `styles.css` and `styles/components.css` also carry.

  **Fixed: `docs/design-tokens.md` said that border widths have their own tokens.** None exists. The Spacing section now says so: a rule is a literal `1px`, and the 2px outline of a table is drawn in `table.css`. A border-width token would be a token proposal, and none is made here.

  `check:components` holds each change: the `scope` attribute and the absence of a default, the `<th>`, `<td>` and `labelHidden` types by compiling `scripts/fixtures/table-types.tsx` against the built declarations, the row-header rules in `dist/styles/table.css`, and the `labelHidden` markup and the positioned label in `dist/styles/form.css`. Each fails if its change is reverted. The README has a new section, The table.

## 0.29.0

### Minor Changes

- 391ac95: Three accessibility fixes, to `OptionList` and to the document surface, each found by a review of a consuming application's slash palette. No export, class or token is renamed or removed, and no prop changes its meaning. One optional prop is added, `closed`, and the markup of `OptionList` changes in one place, said under the first fix.

  **Fixed: nothing was announced when the option list closed.** A screen reader was told when the list opened and as its count changed, and was told nothing when it went without a choice: after Escape, after the cursor left the query, after a letter that ended the command. The status region was part of the list and left the page with it, so it could not say so.

  - The status region is now the element after the list and not a child of it, and it stays in the page while the list is closed. It is the same element open and closed. When `open` becomes false it is given `closed`, 150 milliseconds later.
  - `closed` is a new optional prop. Its default is "List closed.", which the owner approved on 12 October 2026. It is read on the one render in which `open` becomes false. A `closed` given on a later render is not read. An empty string says nothing.
  - Two closings are silent. A list whose opening was never announced, because it closed before its count settled, closes unannounced: a writer who types ` /usr/` is not told that a list they never heard of has closed. A list that opens again inside the 150 milliseconds says nothing of having closed, and if it then closes again before its count has settled a second time, that closing is said: the writer was told of the list and not that it went.
  - **`closed` is the word for a closing, and not a way to announce a choice.** Enter is the application's key, and a choice and a dismissal both reach the component as `open` becoming false. So with `closed` left alone, "List closed." follows a choice as it follows Escape, where the opening was announced, and nothing follows it where the writer chose before the count had settled. A sentence that names the chosen block, passed as `closed`, would be lost in that second case. An application that confirms a choice says so in a status region of its own, and passes `closed=""` on the render that closes the list after a choice, so that the two are not said one over the other. Whether a product needs that is for a person with a screen reader to hear, and step 12 of the README's script asks it.
  - The text stays in the region until the list opens again, as the last label stays in the region of `SyncStatus`. Opening empties it.
  - **What changes in the markup.** A closed `OptionList` rendered nothing, and now renders one empty `<span class="ekd-option-list-announce" role="status">`, which is not drawn. An open one has that `span` after `.ekd-option-list` and not inside it. A selector or a test that reads the region as a descendant of `.ekd-option-list`, or that expects a closed list to leave no element, changes. An application that renders `OptionList` only while the list is open takes the region out with the list and hears no closing: keep it in the page and change `open`.
  - `check:components` holds that the region is one element through opening and closing, each of the closings above, that a render of the closed list does not take back a closing that is waiting to be said, that a `closed` given a render late is not read, and that a list closed before its opening was said says nothing whatever `closed` is.

  **Fixed: the prompt of an empty block was read as its text.** `.ekd-editor [data-placeholder]::before` draws the prompt with `content: attr(data-placeholder)`, and text a stylesheet generates is part of the element's text for a screen reader. An empty paragraph was read as if the prompt were written in it.

  - A second rule, after the plain one and with its selector, declares `content: attr(data-placeholder) / ""` inside `@supports (content: "a" / "")`. The empty alternative text takes the prompt out of what is read (CSS Generated Content Level 3). A browser that does not have the `/` keeps the plain rule: the prompt is drawn there, and is read as before.
  - It is a rule inside `@supports` and not a second declaration in the plain rule. Where `attr()` is a substitution function, a declaration that holds it is kept whatever else it holds, and fails only when the value is computed. A browser that had that `attr()` and not the `/` would let the second declaration win and draw no prompt. The query asks about a string, which is parsed at once.
  - In forced colours the prompt is `GrayText`. Every text colour is forced to one ink there, and the prompt was drawn in the ink of the writer's text.
  - No token changes. The prompt is `--fg-3`. Measured in the eight palettes it is 5.03:1 at its least on `--bg-canvas`, 5.12:1 on `--bg-surface` and 4.60:1 on `--bg-surface-2`, where WCAG 1.4.3 asks 4.5:1, and `check:contrast` already holds those three pairs.
  - **The prompt's ink is short of 4.5:1 on some grounds the package itself draws inside the surface.** The rule is not scoped to a kind of block, so a prompt can stand on any of them. Measured with the package's colour library: `--bg-inset`, a code block, 4.36 in sepia light. The callout grounds: `--info-soft` 4.29 in sepia light and 4.33 in mono light; `--ok-soft` 4.45 in sepia light; `--warn-soft` 4.34 in sepia light and 4.48 in mono light; `--danger-soft` 4.46 in parchment light, 4.08 in sepia light and 4.24 in mono light; `--burgundy-soft` 4.07 in sepia light and 4.26 in mono light. `--accent-soft`, a selected table cell, 4.18 in sepia light and 4.44 in sepia dark. This was so before this release and is not changed by it. An application that draws a prompt in a code block, in a callout or in a selected cell gives it another ink there; `--fg-2` is 6.23:1 at its least on all seven. No check holds this.
  - A prompt that is no longer read has to be said somewhere else. The application says it in the description of the text region, or in `aria-placeholder` on it.

  **Fixed: the prompt of a table's caption was read as the caption.** An editor puts `data-placeholder="Caption"` on the empty `ekd-table-caption`, and the rule above draws it, so the same fault made a screen reader read an empty caption as "Caption". It is cured by the same declaration, and the caption has no rule of its own to cure.

  - An empty caption is now an empty caption to a screen reader: the word "Caption" is not read as its text. A caption that has text is read once, as its text, and has no prompt, since the editor takes the attribute off at the first character.
  - A writer who cannot see the page is then not told by the prompt that the empty line under a table is its caption. What tells them is the element: a `figcaption` in a `figure`, where a screen reader says so. Whether each does has not been heard. Step 17 of the README's script is where to hear it, and where nothing names the caption the application says in the description of the text region that a table has a caption under it.
  - `check:components` holds the plain rule with the plain declaration alone, the rule inside `@supports (content: "a" / "")` with the empty alternative text, that it comes after the plain one, that no third rule draws a prompt from `data-placeholder`, that the caption draws none of its own, and the colour in forced colours, in `styles/editor.css` and in the two entries that carry it.

  Not tested: no screen reader was run, for any of the three. That a polite region kept in the page speaks a text written to it, and that an empty alternative text takes generated content out of what is read, are read from the specifications and not heard. Chromium 152 was given the built stylesheet: it answers the `@supports` query yes, computes `"Caption" / ""` for an empty caption and no generated content for a filled one, and draws the prompt in `--fg-3`. What it then hands a screen reader was not read. Which other browsers have the `/`, and from which version, was not checked, and no browser without it was run, so the plain rule drawing the prompt there rests on how `@supports` is specified. Forced colours were not turned on. Firefox and Safari were not run. jsdom has no generated content and no accessibility tree, so the checks hold the markup, the timing, and the declarations by name.

## 0.28.1

### Patch Changes

- b4d59a7: Two fixes, one to `OptionList` and one to the document surface. No export, class or token is added, renamed or removed.

  **Fixed: `OptionList` was a Tab stop once it scrolled.** The listbox has `overflow-y: auto`, and it scrolls when it holds more options than `maxVisible`, which is 8 unless given. Chromium and Firefox put a box that scrolls, with nothing in it that takes focus, in the Tab order by themselves. So with more than `maxVisible` options, Tab from the text moved focus into the list, although the control's contract is that it never has focus. With the documented pattern the text's `onBlur` then closed the list, and focus was left on nothing. An accessibility review of a consuming application found it.

  - The listbox now carries `tabindex="-1"`, in the server's markup as well as after hydration. Tab from the text goes to the control after the text and Shift+Tab to the one before it, with the list open as with it closed. The surface round the listbox does not scroll (`overflow: hidden`) and is given no `tabindex`.
  - A press is as it was. `tabindex="-1"` also makes the listbox a box that a press can focus, its scrollbar included, which a box with no `tabindex` is not. The default of `pointerdown` and of `mousedown` was already prevented over the whole list, and that is what stops it: nothing was added for it.
  - Read in Chromium 153 with 13 options and `maxVisible` 8, real keys and a real mouse. Before: Tab from the text left focus on the listbox, or on nothing once the text's `onBlur` had closed the list. After: Tab goes to the button after the text and Shift+Tab to the button before it, and from the button after, Shift+Tab goes to the text. A press on the surface's padding, on the scrollbar, and on an option each leave focus and the selection in the text; a press on an option still chooses it; the wheel and a drag of the scrollbar's thumb still scroll the list.
  - `check:components` now holds the attribute on the listbox and nowhere else in the list, in the server's markup too, and that the default of `pointerdown` and `mousedown` is prevented on every element of the list, the listbox itself among them. jsdom has no Tab order, so where Tab goes is not held by a check.

  **Fixed: a long run of text with no space in it froze the editor.** On the document surface a run with no break in it wraps wherever the line ends (`overflow-wrap: break-word`, and `anywhere` in a table cell). With kerning on, Chromium lays such a run out in time that grows with the square of its length, at every key. A security review of the application found it with a paragraph of 100,000 asterisks.

  - `.ekd-editor` now declares `font-kerning: none`. It is on the root, so every block under it inherits it: paragraphs, headings, list items, quotations, table cells, captions, callouts, and the table of contents. Nothing else on the surface changes: ligatures and the other font features are as they were, and no line of ordinary prose in the page that was compared broke at a different place. Words are wider or narrower by what their kerning pairs were: "AVATAR" in the serif at `--fs-md` is 57.4 pixels wide where it was 55.2.
  - It is this surface only. The reset still sets `text-rendering: optimizeLegibility` on `body`, and a page that is read and not typed into keeps its kerning. A paragraph outside the surface that wraps a long run the same way is as slow as before.
  - Measured in Chromium 153 with the built stylesheets and the application's own font files, one paragraph of one character, in milliseconds to lay out. Before: 27 at 8,000 asterisks, 106 at 16,000, 427 at 32,000 and 1,371 at 100,000, and the same again for each character typed after. After: 0.3, 0.5, 1.1 and 4.6. Underscores: 20, 80, 323 and 1,032 before, and 0.3, 0.5, 1.0 and 3.5 after.
  - It is not the asterisk and the underscore alone, and not the serif alone. Of 124 characters and short patterns at 16,000 characters, 24 took 20 milliseconds or more in the serif, "w", "C", "3" and the quotation marks among them, and 13 in the sans, which is the face of a table cell: "f", "s", "3" and the brackets among them. With `font-kerning: none` none does, in either face. The mono was never slow.
  - `font-kerning: none` is the smallest declaration that removes the cost. `text-rendering: optimizeSpeed` and `text-rendering: auto` change nothing in Chromium, and neither does turning ligatures off with kerning left on. `font-feature-settings: "kern" 0` removes it too, and replaces the features the reset sets. Ligatures do not need to go.
  - `check:components` now holds `font-kerning: none` on the root rule of `styles/editor.css`, that `styles.css` and `styles/components.css` carry the same rule, and that no rule in the entry sets `font-kerning` again, sets the `kern` feature by hand, or sets `text-rendering`.

  Not tested: Firefox and Safari, for both fixes. The list has still not been heard in a screen reader, and step 13 of the README's script, "What to test with a screen reader before shipping", is the one that covers Tab. The layout times are Chromium's alone; whether Firefox or Safari have the same cost with kerning on was not measured.

## 0.28.0

### Minor Changes

- 6660181: `OptionList`, a list of options at the text cursor that is filtered by what is typed and never takes focus: the list an editor opens when a writer types `/`, and the same control for a mention or a citation key. Until now the package had no drawn listbox. `@ekdotico/domico/components` now exports `OptionList` and five functions, `optionListKey`, `optionListNavigating`, `optionListAttributes`, `optionListOptionId` and `placeOptionList`, with the types `OptionListProps`, `OptionListItem`, `OptionListAnchor`, `OptionListDismissReason`, `OptionListKeyEvent`, `OptionListKeyResult`, `OptionListTextAttributes` and `OptionListPlacement`. One stylesheet entry is new, `styles/option-list.css`, which is also in `styles.css` and `styles/components.css`. No export, class or token is renamed or removed, **no token is added**, and the package still has no runtime dependency.

  The list never has focus, so the control is in two parts.

  - `OptionList` is `role="listbox"`, named by `label`, with `role="option"` children. It is fully controlled: the application holds `open`, `options` and `activeId` and does the filtering. Each option is `{ id, label, detail }`, with `detail` an optional second text at the end of the row. The active option is `aria-selected="true"` and the others `"false"`. An option's element id is `optionListOptionId(id, option.id)`, which is `id`, `-option-` and the option's id, the same on every render. With no options the listbox is not rendered and `empty` is shown in its place. Closed, it renders nothing, so no part of a closed list is in the accessibility tree.
  - A press on an option calls `onSelect` and does not move focus: the default of `pointerdown` and of `mousedown` is prevented over the whole list, and the option is chosen on the click. The pointer moving onto an option calls `onActiveChange`. A press outside calls `onDismiss('press-outside')`: for a mouse when the button goes down, and for a finger or a pen when it lifts, and not at all where the browser ended the touch with `pointercancel` because it had become a pan or a pinch. A reader who drags or pinches the page to see the list has pressed nothing. This is held by synthetic pointer events and has not been run on a touch device. The control handles no key.
  - The list's text cannot be selected: `user-select: none`, with `-webkit-user-select` and `-webkit-touch-callout`. A right-click, a Control-click or a long press selects the word under it wherever text can be selected, which on an option took the page's one selection out of the text being written while focus stayed in it. The context menu is not prevented.
  - `optionListKey(event, { options, activeId, maxVisible })` reads a `keydown` in the text and returns `{ activeId }`, `{ select }`, `{ dismiss: true }` or `null`. Down and Up move by one and stop at the ends without wrapping, as the WAI-ARIA Authoring Practices describe for a listbox popup. Page Down and Page Up move by `maxVisible`. With no option active, Down and Page Down go to the first option and Up and Page Up to the last. Enter chooses the active option, and Escape dismisses. Every other key is `null`, Home and End among them: a document has lines, and those keys stay the text's. So is every key while an input method is composing, with a modifier held, or, Escape apart, with no options. It does not prevent the default; the application does when the result is not `null`.
  - `optionListAttributes(id, { open, options, activeId, navigating })` returns what the focused text region carries, which is two attributes. While the list shows at least one option: `aria-controls` and, while the writer is moving in the list, `aria-activedescendant`. Otherwise both are `undefined`, which removes them. WAI-ARIA 1.2 allows the second on a textbox where "The element with DOM focus is a combobox, textbox or searchbox with aria-controls referring to an element that supports aria-activedescendant, and the value of aria-activedescendant refers to an owned element of the controlled element" (section "aria-activedescendant property"). `aria-autocomplete` and `aria-haspopup` are both supported on a `textbox` in WAI-ARIA 1.2, and neither is set, because here each would be set while the list shows and removed after it. Of `aria-autocomplete` the same specification says "authors SHOULD NOT dynamically change its value in order to communicate the presence of a suggestion" (section "aria-autocomplete property"), and `aria-haspopup` is owed only to an element that carries `aria-autocomplete`, and set here it would be the same changing value under another name. `aria-expanded` is the one of the three that is not set because the role does not support it: the section "aria-expanded state" does not list `textbox` among the roles it is used in. The region keeps `role="textbox"` and is not given `role="combobox"`.
  - `navigating` is what `optionListNavigating(event, result, previous)` says of the last key: true after a key that moved the active option, `previous` after a modifier pressed by itself, false after every other. The first match is marked from the moment the list opens, and without this a screen reader that follows `aria-activedescendant` would say it over each character of the query and in place of the character under Left and Right. A modifier by itself keeps the value because Control is the key that silences a screen reader and CapsLock is one that begins its commands, and neither takes the writer off the option. The function takes the last value and does not return `null` for "no change", so the call is one line with no branch. The application also sets `navigating` to false on `input` and on `selectionchange`, for text that arrives with no key and for a cursor moved by a press.
  - The pattern the README and the component's comment give reads the query again when the selection changes, and not on `input` alone. Home, End, Left and Right fire no `input`, and a list that followed `input` alone stayed open after the cursor had left the query, still took Up, Down and Enter, and Enter replaced text the cursor was not in. The listener refilters or closes an open list and never opens one.
  - A polite status region inside the control is given `status`, or `empty` when there are no options, once the text has stood for `announceAfterMs`, 500 by default. A count passed through while typing is not announced, and neither is one that did not change. Both texts are the application's. Enter with nothing moved chooses the marked first match, so the documented `status` names that option with the count, "3 blocks. Heading 1 first.", and a writer who cannot see the mark is told what Enter does. No prop is added for this.
  - `announceActive`, off unless given, is a function from the option, its index and the count to words, and the same region then says the active option: 150 milliseconds after a move in the list, and with the count, as one text written once and the count first, on opening and on a change of filter. The two are one write because a polite region that is given a second text before the first was spoken is not certain to speak the first. Whether each screen reader speaks the whole of the one text is not known: it has not been tested with one. The two are joined by a space, so with this on `status` is the count alone and ends in a full stop. It is for a screen reader that does not follow `aria-activedescendant` out of an editable region. One that does follow it says each option twice with this on, so a product turns it on by what its own testing finds. The README has the script, "What to test with a screen reader before shipping".
  - `detailInName`, true unless given, says whether an option's `detail` is part of its accessible name. False puts `aria-hidden` on the detail and leaves it on the page. Which is better is left to a person with a screen reader, and neither answer needs a release.
  - `anchor` is the cursor, as a rectangle in viewport coordinates or a function that returns one. The list opens under it, above it where it does not fit below, and on the side with more room, held to that room, where it fits on neither. It is kept 16 pixels from each edge of the viewport, and is placed again on a scroll and on a resize, which is why a function is the form to pass. A function that returns `null` leaves a placed list where it is; a list not yet placed is put at the start of the top of the viewport and is never left open and hidden. `placeOptionList` is that arithmetic as a pure function.
  - The viewport is the visual viewport where the browser has `window.visualViewport`, so the list is not placed behind an on-screen keyboard or outside the part of a pinch-zoomed page that shows, and it is placed again on that viewport's `resize` and `scroll`. `placeOptionList` takes the viewport as a rectangle, `{ x, y, width, height }`, with `x` and `y` at 0 unless given.
  - The list is `position: fixed`, and is shown as a manual popover, in the top layer, where the browser has the Popover API. Its position is written to the element's `style` by script, and its row limit is a `style` attribute; no stylesheet is injected. In a browser without the Popover API an ancestor with a transform still positions and clips it. The top layer does not lift it out of an inert page: with the text in a modal `<dialog>`, the list is rendered inside that dialog.
  - It shows `maxVisible` rows, 8 by default, and scrolls, keeping the active option in view. The height it is held to is counted in rows of `--sp-7` or one line of text with the row's padding and borders, whichever is more, so it follows a text size the reader has raised. It is 20rem wide, or the viewport less 16 pixels each side where that is less. A label that does not fit wraps, and so does a `detail`: it is as wide as its text up to half the row and wraps inside that, so a long one, such as a citation key, leaves the label the other half and the list does not scroll sideways at a 320 pixel viewport (WCAG 1.4.10). The label and the detail each take their direction from their own text (`unicode-bidi: plaintext`), so `/h1` is not drawn as `h1/` in a page that reads right to left. A row is `--sp-7` high at its least.
  - The active option is drawn with a boundary in `--accent`, two pixels wide, and the ground `--accent-soft` together, on `--bg-raised`, and with the system colours `Highlight` and `HighlightText` in forced colours. The second pixel is an inset shadow, so the row is the same size active and at rest. The list has no transition and no animation.
  - Nothing warns of misuse, because the package has no development-only code path. An option `id` with white space in it, and an open list that no element names with `aria-controls`, are silent and are the application's to test for.

  **Fixed: `useModalSurface` no longer calls `onClose` for an Escape whose default was already prevented.** A control inside a modal surface that closes on Escape, such as `MenuButton` or a list at the text cursor, prevents the default, and one Escape now closes that control alone; the next closes the surface. Before, both closed on the one key. The contract for anything inside a surface that reads Escape is now written down, in the hook's comment and in the README: prevent the default when the key was used, and only then. The hook also no longer calls `onClose` for an Escape pressed while an input method is composing (`isComposing`, or `keyCode` 229), which cancels the composition; before, it closed the surface under the writer. `NavDrawer`, the one component built on the hook, is otherwise unchanged. `Tooltip` listens for Escape on the document as the hook does, so for a tooltip inside a surface the order of the two listeners still decides, and that is not changed here.

  It uses existing tokens alone: `--bg-raised`, `--rule`, `--radius-md`, `--radius-sm`, `--shadow-2`, `--accent`, `--accent-soft`, `--fg-1`, `--fg-2`, `--font-sans`, `--font-mono`, `--fs-sm`, `--fs-xs`, and the spacing steps.

  `check:contrast` gains two pairs: `--fg-2` on `--accent-soft` at 4.5:1, for the detail on the active row, where the lowest is 6.40:1 in sepia light, and `--accent` on `--accent-soft` at 3:1, for the boundary of the active row against its own ground, where the lowest is 4.57:1 in parchment dark. `check:components` gains nine cases, and its `useModalSurface` case holds the fix above.

  `keepInViewport`'s margin, `EDGE_MARGIN_PX`, is now exported from the internal `viewport.ts` so the placement shares it. It is not part of the public barrel.

  For a consumer: `ekdotico-check discipline` derives its list from the barrel, so from this version a local `OptionList`, `optionListKey`, `optionListNavigating`, `optionListAttributes`, `optionListOptionId` or `placeOptionList` is reported as a reimplementation.

  Not tested, and to be done before a product ships the list: it has not been heard in VoiceOver, NVDA, JAWS or TalkBack, and support for `aria-activedescendant` on an editable region differs between them. Nor has it been run in Firefox or Safari, on a touch device, with an on-screen keyboard, in forced colours, or with an input method that composes. The stylesheet was read in Chromium at a width of 320 pixels, left to right and right to left. The README's script, "What to test with a screen reader before shipping", has the setup for each screen reader, how to record a run, and sixteen steps.

## 0.27.0

### Minor Changes

- 57af2fe: The controls, the styles and the tokens a document editor needs, added before the Ekdotico application builds its editor so that it draws none of its own. `@ekdotico/domico/components` now exports `Select`, `Toolbar`, `ToolbarSeparator`, `ToggleButton`, `MenuButton` and `SyncStatus`, with the types `SelectProps`, `MenuButtonItem`, `SyncState` and `FormFaultTone`, and `QrCode`, which is for signing in and not for the editor. Five stylesheet entries are new: `styles/toolbar.css`, `styles/menu.css`, `styles/sync-status.css`, `styles/editor.css` and `styles/code.css`. All five are also in `styles.css` and `styles/components.css`. `@ekdotico/domico/icons` gains eighteen icons. Eleven tokens are added. No export, class or token is renamed or removed, and the package still has no runtime dependency and imports no editor.

  The document is not a component. `styles/editor.css` and `styles/code.css` style the markup an application's editor produces, by class name and attribute, and the README tables that contract.

  - `styles/editor.css` styles everything under the class `ekd-editor`: headings 1 to 3, paragraphs, ordered, unordered and nested lists, a blockquote, a horizontal rule, and the nine marks as the elements `strong`, `em`, `u`, `s`, `code`, `sup`, `sub`, `a` and `mark`. Prose is the reading serif at `--fs-md` with `--lh-prose`, and running text is capped at `--measure`. A link is the accent, underlined, and a step heavier, so that it differs from underlined text by more than a hue. The caret is `--fg-1`. A block with `data-placeholder` shows that text while it is empty. A table scrolls inside `ekd-table-wrap` at every width, with header cells in any row or column, a selected cell or range marked `data-cell-selected`, a column handle `ekd-column-resize`, and a caption `ekd-table-caption`. `ekd-page-break` is a dashed line with its label in the middle. `ekd-toc`, `ekd-toc-title` and `ekd-toc-list` are a table of contents, with `data-level` 1 to 3 on each entry. A document or a block marked `lang="el"` is set in `--font-sans`, because the reading serif has no Greek.
  - `styles/code.css` styles `ekd-code`, a code block on `--bg-inset`, with `ekd-code-header` for its language and its copy button, and colours the class names highlight.js and lowlight write. A keyword is also a step heavier and a comment is also italic.
  - `Toolbar` is `role="toolbar"`, named by `label`, and one stop in the Tab order: Left and Right move between its controls and wrap, Home and End go to the ends, and Tab returns to the control that last had focus. `floating` draws it as a raised surface for a toolbar an application places over a selection. `ToggleButton` is a native button with `aria-pressed` and one name in both states; pressed is drawn as a boundary and a wash together. The application holds `pressed`.
  - `MenuButton` opens a list of actions on the WAI-ARIA menu button pattern: Enter, Space and Down open it on the first action and Up on the last, Down and Up move and wrap, Home and End go to the ends, Escape and choosing an action return focus to the button, and Tab or a press outside closes it. A disabled action stays in the list with `aria-disabled`. It does not find an action by its first letter. It is the one place the package claims `role="menu"`.
  - `Select` is the native `<select>` with the label, the hint and the message of the other fields. `labelHidden` and `size="small"` are for a select in the header of a block. Its styles are in `styles/form.css`.
  - `SyncStatus` has three states, `synced`, `syncing` and `error`, each a mark and words together; `label` is the application's and has no default. With `onClick` it is a button. A polite status region is updated once the label has stood for `announceAfterMs`, 1500 by default, so a save that completes while a person types is not announced and a lost connection is. The mark of the syncing state fades in and out and does not move, and is at rest under reduced motion.
  - `Callout` takes `icon`, which draws the type's own icon, and `label`, the type in words, which names the note where there is no title. `type` also accepts `warning`, drawn as `warn`. With neither option a callout renders what it rendered at 0.26.0.
  - `QrCode` draws `value` as a QR code in an inline `<svg role="img">`, named by `label`, which has no default. It is for the secret of a second sign-in factor, which the Ekdotico application shows as a code and as text. It is dark on light in every theme, with a quiet zone of four modules inside its plate, because a phone does not read a code drawn light on dark. `size` is the width and the height in CSS pixels, 200 by default, and `className` and the other attributes pass through. It has no hook and no client boundary, so a server component renders it. It has no stylesheet entry: the two colours are set on the image and need `tokens.css` alone. The encoder is the package's own, in `src/components/qr.ts`: byte mode, error-correction level M, the smallest version that holds the value, and the mask the standard's penalty rules score lowest. A value over 2331 bytes of UTF-8 throws a `RangeError` at render.
  - The new icons are `BoldIcon`, `ItalicIcon`, `UnderlineIcon`, `StrikethroughIcon`, `CodeIcon`, `SuperscriptIcon`, `SubscriptIcon`, `LinkIcon` and `HighlighterIcon` for the nine marks, `StickyNoteIcon`, `LightbulbIcon`, `TriangleAlertIcon`, `InfoIcon`, `OctagonAlertIcon` and `QuoteIcon` for the six types of callout, and `CircleCheckIcon`, `RefreshCwIcon` and `CircleAlertIcon` for the sync status. Each is Lucide, vendored, and held to its original by `check:icons`.

  The tokens:

  - `--hl-mark`, in all eight palettes, is the highlight a writer applies. It is `oklch(90.5% 0.07 96)` in the four light palettes and `oklch(33% 0.055 96)` in the four dark. None of the five existing highlights serves: each says what a passage is, and `--hl-quote` is also the selection. `--accent` does not hold on it in the dark palettes, at 3.79:1 in parchment dark, so a link inside a highlight takes the ink of the text and keeps its underline.
  - `--syntax-keyword`, `--syntax-string`, `--syntax-number`, `--syntax-title`, `--syntax-attr` and `--syntax-comment`, in all eight palettes. **Each is an alias** of an existing ink, in that order `--burgundy`, `--ok`, `--warn`, `--info`, `--accent` and `--fg-2`, so the group adds six names and no colour. All six hold 4.5:1 on `--bg-inset`, the lowest being 4.64:1.
  - `--form-w`, `28rem`, is the widest a column of form fields runs.
  - `--serif-fit`, `0.84em`, is the font size of a run of `--font-sans` or `--font-mono` set inside a line of `--font-serif`.
  - `--scan-plate`, `oklch(95.877% 0.0127 86.83)`, and `--scan-ink`, `oklch(28.427% 0.0036 106.63)`, are the ground and the modules of a QR code. They are declared once and are the same in all eight palettes, as the four brand values are, from a new source file `tokens/source/scan.json`. No existing token serves: every surface and every ink follows the mode, so a code drawn in `--fg-1` on `--bg-canvas` is light on dark in four palettes, and the brand values are for the mark alone. The values are those of the light logo tile, declared again and not aliased. They measure 12.76:1. `scales.scan` in `@ekdotico/domico/tokens` holds the two.

  Three changes answer what the Ekdotico application reported on 0.26.0.

  - `FormFault` takes `tone`. `danger`, the default, is as before. `neutral` draws a statement that is not a fault on `--bg-surface-2` inside a hairline in `--rule`. `title` is now optional: with none, the children are the statement and there is no heading.
  - **A Greek run in `PageHeading` changes size at this version and needs no change in code.** It is set at `--serif-fit`. Commissioner's lowercase stands 0.51 of its font size and Crimson Pro's 0.43, read from the two faces, so "Closed α" had a letter a fifth taller than the word before it.
  - `--form-w` replaces the literal the application carried.

  `check:contrast` gains nineteen pairs and now follows an alias to the token it names; before, a token declared as `var()` of another would have passed any pair without being measured. The nineteenth is `--scan-ink` on `--scan-plate`, held at 7:1. `check:components` gains nine cases. Two are the QR code: its matrix is held, module for module, to three symbols that another encoder wrote and two more agreed on, in `scripts/fixtures/qr-code.json`.

  For a consumer: `ekdotico-check discipline` derives its list of reimplemented components from the barrel, so from this version a local component exported as `Select`, `Toolbar`, `ToolbarSeparator`, `ToggleButton`, `MenuButton`, `SyncStatus` or `QrCode` is reported. The documentation site, deree, praktico and the Ekdotico application export none today.

  Not settled here, and the core team's to decide: a Greek phrase inside a document written in another language is still drawn in a substituted face, because a writer's text cannot be wrapped run by run; and `fontConfig` still requests the Latin subset alone for Commissioner, so a Greek letter can arrive a moment after the Latin beside it.

## 0.26.0

### Minor Changes

- 14c2728: A page heading, a read-only state for the fields, and a fault stated outside a form: three gaps the Ekdotico application met while building its sign-in, sign-up, notice and settings pages from this package. `@ekdotico/domico/components` now exports `PageHeading`, with the types `PageHeadingProps` and `FormFaultAnnounce`, and one stylesheet entry carries the heading: `styles/page-heading.css`, which is also in `styles.css` and `styles/components.css`. No export, class or token is renamed or removed, and no token is added.

  - `PageHeading` is the heading of an application page: an `h1` in the reading serif at `--fs-2xl`, the size of the `AccessGate` title, with no margin. `level` takes `1`, `2` or `3` and changes the element and not the size. Every attribute of the heading passes through, `className` is added to its own, and `ref` reaches it, for a page that moves focus to its title. A Greek run in the text is wrapped by the component in a span that takes `--font-sans`, because the reading serif has no Greek (rule 4), so an application passes the title as a plain string and writes no span and no class for it. The text inside an HTML element passed as a child is read too; the text a component of the application renders is not. It holds no state, so a server component renders it. The new classes are `ekd-page-heading` and `ekd-page-heading-greek`.
  - `TextField`, `PasswordField`, `OneTimeCodeField` and `TextArea` have a read-only presentation, driven by the native `readOnly` attribute. A read-only field gives up the inset ground, which means editable, and sits on the surface the form is on; its boundary stays `--rule-control` and is dashed, so the state has a shape and does not rest on a tint, and it holds in forced colours. The value stays `--fg-1`. The field stays in the Tab order, its text can be selected, and it is submitted with the form. It is distinct from `disabled`, which is the sunken surface in `--fg-3`; a field that is both is drawn as disabled. **A field that already passes `readOnly` changes appearance at this version and needs no change in code.** Until now it was drawn as an editable field.
  - `FormFault` is documented as the control for any stated fault, with a form or without one, and takes `announce`: `assertive`, the default, is `role="alert"` as before; `polite` is `role="status"`; `off` is no live region and no role, for a statement that is part of the page as it was served and should not be announced as an interruption on load. Focus moves to an assertive statement when it appears, as before, and a polite statement or one that is not announced leaves focus where it is; `autoFocus` overrides either. With no `announce` the component renders exactly what it rendered at 0.25.0. The component keeps its name: a second, neutral name would be two names for one control, and `Fault` is already the name of the application's own type for a refused request.

  `check:contrast` gains three pairs for the boundary of a read-only field that has focus or is invalid: `--accent` on `--bg-surface` and on `--bg-surface-2`, and `--danger` on `--bg-surface-2`, each at 3:1. The value and the boundary at rest were measured already on all four surfaces. `check:components` gains four cases.

  For a consumer: `ekdotico-check discipline` derives its list of reimplemented components from the barrel, so from this version a local component exported as `PageHeading` is reported. The documentation site, deree, praktico and the Ekdotico application export none today.

## 0.25.0

### Minor Changes

- 1cd353a: Form controls, a dialog and a tooltip: the controls the Ekdotico application builds its sign-in pages, account settings, feedback form and confirmations from. `@ekdotico/domico/components` now exports `Button`, `TextField`, `PasswordField`, `OneTimeCodeField`, `TextArea`, `RadioGroup`, `Checkbox`, `FormFault`, `Dialog` and `Tooltip`, with the types `ButtonVariant`, `TextFieldProps`, `RadioOption` and `FormFaultItem`. Four stylesheet entries carry them: `styles/button.css`, `styles/form.css` (the fields, the choices and the form fault together), `styles/dialog.css` and `styles/tooltip.css`. All four are also in `styles.css` and `styles/components.css`. The new classes are prefixed `ekd-`, so nothing an application already styles is renamed or restyled.

  Each control is the platform's own element drawn from tokens, and takes its words from the application; none has a default label.

  - `Button` has four variants (`primary`, `secondary`, `quiet`, `destructive`), defaults to `type="button"`, and carries the pending state `GateSubmitButton` had: `aria-disabled` with a click guard, so focus stays on the button while the action is in flight. `GateSubmitButton` is now this component with the gate's class and its two default labels. Its props, its markup and its stylesheet are unchanged.
  - `TextField`, `PasswordField`, `OneTimeCodeField` and `TextArea` share a visible label, an optional hint and a message. `error` marks the control `aria-invalid`, and the control is described by its hint and message through `aria-describedby`. `PasswordField` has a show-and-hide button with `aria-pressed` and one name in both states, requires `autoComplete`, and hides the password again when its form is submitted. `OneTimeCodeField` is one input with `inputMode="numeric"` and `autoComplete="one-time-code"`, six digits by default; it sets no `maxlength` and its `pattern` allows a space or a hyphen between digits, so a code pasted as "123 456" arrives whole, and the server strips the separators. `TextArea` counts against `maximum` in words the application supplies, and announces the count politely a second after typing stops; because the wording is a function, a counted `TextArea` is rendered from a client component. None of the four takes a placeholder. All four, and `Checkbox`, hand their native element to a `ref`.
  - `RadioGroup` is a fieldset named by its legend with native radios and none preselected. `Checkbox` is a native checkbox inside its label.
  - `FormFault` is the statement of a fault at the head of a form: `role="alert"`, focused when it appears and whenever `focusKey` changes, with links that move focus into the fields at fault.
  - `Dialog` is the native `<dialog>` opened with `showModal()`, named by its heading. The application holds `open` and the dialog follows it: Escape and the close button call `onClose`, which is expected to set `open` to false, and a dialog the browser closed while `open` is still true is shown again. Focus returns to the control that opened it.
  - `Tooltip` is shown on hover and on keyboard focus, tied to its trigger by `aria-describedby`, and meets WCAG 2.2 success criterion 1.4.13: Escape dismisses it without moving the pointer or focus, the pointer can move onto it, and nothing times it out. Given text instead of an element it renders its own trigger button, which a press toggles, for a touch. Closed, it takes no space; open, it is kept inside the viewport, so it adds no horizontal scroll at a narrow width. It does not flip to the other side of its trigger.

  No token is added. A dialog and a tooltip sit on `--bg-raised`, where `--fg-3` (4.40:1, sepia dark), `--accent` (4.42:1, parchment dark) and `--danger` (4.27:1, parchment dark) do not hold as text, so these controls set text in `--fg-1` and `--fg-2` and use `--accent` and `--danger` as boundaries and marks. `check:contrast` gains seven pairs for it, and `check:components` gains nine cases.

  For a consumer: `ekdotico-check discipline` derives its list of reimplemented components from this barrel, so from this version a local component exported as `Button`, `Dialog`, `Tooltip`, `Checkbox`, `TextField`, `TextArea`, `RadioGroup`, `PasswordField`, `OneTimeCodeField` or `FormFault` is reported. The documentation site, deree and praktico export none of those today.

## 0.24.1

### Patch Changes

- 26b1215: The collaborator selection wash is stronger in the four dark palettes. `--collab-N-soft` there moves from `oklch(72% 0.09 H / 0.24)` to `oklch(66% 0.13 H / 0.36)`: more chroma and more alpha, at a lower lightness so the text over it keeps its contrast. Teal stops at a chroma of 0.107, the most sRGB holds at that lightness. Sepia dark takes an alpha of 0.3 instead of 0.36, because its `--fg-2` over the wash on `--bg-raised` measured 4.22:1 at 0.36 and the floor is 4.5:1. The light palettes, the solids and the inks are unchanged, and so is every threshold in `check:collaborators`.

  Worst-case body text over the wash is now 5.03:1 in parchment dark, 4.89:1 in library dark, 4.67:1 in sepia dark and 5.33:1 in mono dark.

## 0.24.0

### Minor Changes

- 38aaf65: The package is licensed under the GNU Affero General Public License, version 3 only. `LICENSE` is the standard text and `package.json` declares `AGPL-3.0-only`. Versions up to and including 0.23.1 stay under the proprietary licence they were published with.

  Two files ship beside it. `TRADEMARKS.md` says the licence grants no rights in the Ekdotico name, logo mark or wordmarks as marks, and names the files that carry them. `THIRD-PARTY-NOTICES.md` carries the ISC and MIT notices for the vendored Lucide icons, which had shipped without them, and states that the three typefaces remain under the SIL Open Font License 1.1 and are loaded, not bundled.

- 38aaf65: Collaborator colours: ten slots for the other people in a shared document, in all eight palettes. Each slot is three tokens — `--collab-N` (the caret and the presence label's ground), `--collab-N-ink` (the name on it) and `--collab-N-soft` (a translucent selection wash) — with `N` from 1 to 10 in assignment order. `@ekdotico/domico/tokens` exports `collaboratorSlots` and `collaboratorSlot(index)`, which cycles.

  Ten because a document holds at most ten connections. The hues are the house earth tones on three lightness tiers, so that every pair stays apart under simulated protanopia and deuteranopia as well as for typical vision, and slots 1 to 4 are the four furthest apart. The label carries the person's name; colour is never the only signal.

  `ekdotico-check collaborators` (`pnpm check:collaborators` here) is new and is in the no-argument set. It measures, per palette: the ink on its solid at 4.5:1; the solid on each of the five grounds at 3:1; `--fg-1` and `--fg-2` over the wash on each ground at 4.5:1; and the OKLab distance between every pair of solids under three visions. `luminance` and `contrast` moved into `tokens/lib/color.mjs`, where both contrast guards read them.

  The catalogue has a Collaborator section with the measured table. Its token totals also now count `--overlay-scrim`, which they had left out: 75 per palette and 147 in all.

- 38aaf65: `engines.node` is `>=24 <27`, from `>=22`. The package is built and published on Node 26, which `.nvmrc` now pins, and stays supported on 24 because deree and the documentation site deploy on Vercel, which offers 24 at most. No consumer runs it on 22. CI verifies on both 24 and 26; the publish, audit and consumers jobs read `.nvmrc`.

## 0.23.1

### Patch Changes

- 768c8ad: The `LogoVariant` documentation now gives the colours the logo files actually draw: `original` is the mark in ink (#2a2a28), not oxford plum; `dark` is in cream (#f0ead8), not white; and `branded` is in plum (#5a4a7a). Each solid tile's colour is stated too. Documentation only; no file changed.

## 0.23.0

### Minor Changes

- f9cedf7: `DocMeta` in `@ekdotico/domico/components`, with `styles/doc-meta.css`: a document's version and last-updated date on one line ("Version 1.2 · Last updated 2026-09-30"). The application supplies both values. A missing value, or a date that is not YYYY-MM-DD, is shown as "unset" or "unknown" in a bordered strip instead of being hidden. Below 360px the words "Last updated" leave the visual line and stay in the accessible name.

## 0.22.0

### Minor Changes

- 477cbe3: An accessibility subpath, two components moved in from the applications,
  corrections to five existing ones, and five more checks in the accessibility
  guard, from a WCAG 2.2 AA audit of docs, deree and praktico.

  **`@ekdotico/domico/a11y` is new.** `useModalSurface({ open, surfaceRef,
triggerRef?, initialFocusRef?, onClose, keep?, lockScroll? })` keeps the whole
  promise `aria-modal="true"` makes: everything outside the surface inert, a Tab
  cycle inside it, Escape to close, and focus returned to the trigger after the
  page is released. `inertOutside(node, keep?)` is the inert half alone, and
  `tabbableWithin(root)` the stops the cycle visits. `isShortcut(event, key)` and
  `shortcutLabel(key)` give a chord that is ⌘ on Apple platforms and Ctrl
  elsewhere, never both. Each was ported from the most complete of the
  applications' copies. `ekdotico-check discipline` now counts this barrel, so a
  local copy of any of them is reported as a reimplementation.

  **`SkipLink` and `StickyTableHead` join `@ekdotico/domico/components`.**
  `SkipLink` renders the reset's `.skip-link`, defaulting to "Skip to main
  content" and `#main-content`; the applications had three versions. The two
  identical copies of `StickyTableHead` move here, drop their Next.js import for
  an optional `rescanKey`, and park the mirrored header at
  `--table-sticky-offset`, which the native sticky header already reads. Its
  styles are in `styles/table.css`.

  **Corrections.**

  - `styles/reset.css` underlines an unclassed link, so a link in prose is not
    identified by colour alone (1.4.1). It sets `scroll-padding-block-start` to
    `--topbar-h`, so focus is not scrolled under a pinned bar (2.4.11), and adds
    `.sr-only-focusable`.
  - Sepia light `--fg-3` moves from 53.362% to 51.8% lightness, to 4.60:1 on
    `--bg-surface-2`, where the table header, the caption and two badges draw it.
    It was 4.32:1. `check:contrast` now lists the pair.
  - `Callout` is `role="note"` for every type and is named by its title. Four
    types rendered an unnamed complementary landmark.
  - `Table` takes a `caption`, which draws the caption row and names the scrolling
    wrapper. Without one the name comes from `label`, then from an `aria-label`
    passed for the table, which moves to the wrapper rather than being read
    twice. "Table" is now the last resort, not the default. `styles/table.css`
    now ships the narrow-viewport horizontal scroll that the wrapper's tab stop
    depends on.
  - `Tabs` takes an optional `label` for its tab list.
  - `AppearanceMenu` names the theme group by the "Theme" label beside it,
    through a new optional `labelledBy` on `ThemeSwitcher`. `styles/appearance.css`
    shows the checked mode as Highlight under forced colours and keeps the
    swatches' own colours, and states its own reduced-motion rule.

  **`ekdotico-check a11y` is stricter, and can fail where it passed.**
  `unnamedcontrol` missed every icon-only button with an arrow-function handler,
  because the `>` in `=>` ended its tag match. `focusring` now requires an
  outline — `2px solid transparent` beside a box-shadow ring is enough — because
  a shadow or a tint is repainted away under forced colours. Its in-block test
  also read `outline: none` as restoring an outline. New checks: `inputring`,
  `placeholder` (`--fg-4` or `--fg-5`), `controlborder` (a hairline on a form
  control), `tooltipcontent` (a link or a button in `role="tooltip"`), and
  `menukeys` (advisory: `role="menu"` without arrow keys). At this release docs,
  deree and praktico pass all twelve. The new exports do add `dupes` findings in
  `discipline`, for the local helpers this release replaces.

  A development-only guard, `components`, renders the helpers and components
  into jsdom and asserts their names, roles, inertness and focus.

- d1b6001: Four pieces of application chrome move into `@ekdotico/domico/components`, each
  with a stylesheet entry of its own, from the two or three copies the
  applications carried of each. None imports a router: a client-side router passes
  the route as `closeKey` or `rescanKey`.

  - **`AccessGate`** and **`GateSubmitButton`**, the passcode page, with
    `styles/access-gate.css`. `<AccessGate eyebrow? title lede contact? label?
digits? action error? notice? from? idPrefix? submitLabel? pendingLabel?
pending? />` holds no state, so a server component renders it with a server
    action. It renders the page's `<main>`, not a dialog; the field is described
    by whichever message is on screen — `error` marks it invalid, `notice` (a
    rate limit) does not — and takes `one-time-code`, the numeric keypad, and a
    pattern of exactly `digits` digits. The button is `aria-disabled` with a
    click guard while in flight, so it keeps focus, and reads the form status
    from React 19 or a `pending` prop.
  - **`NavDrawer`**, the slide-in navigation for 920px and narrower, with
    `styles/nav-drawer.css`. `<NavDrawer label triggerLabel? closeLabel? open?
onOpenChange? closeKey? initialFocusRef? id?>{sidebar}</NavDrawer>` keeps the
    whole modal promise through `useModalSurface`, keeps the edge-swipe
    thresholds both copies used, and is inert while closed.
  - **`OnThisPage`**, the heading rail, with `styles/on-this-page.css`.
    `<OnThisPage selector? root? label? rescanKey? rootMargin? badgeSelector? />`
    marks the heading being read with `aria-current="location"`, reads real ids,
    de-duplicates made-up ones against the document, and is a `<nav>` named by
    its visible label.
  - **`OpeningSequence`**, the intro, with `styles/opening-sequence.css`.
    `<OpeningSequence sessionKey? />` plays once per session under
    `ekd:intro-shown`, never under reduced motion, never takes a press, inerts the
    page it covers, waits at most 400ms for fonts, and draws the mark with two CSS
    keyframes rather than an animation library.

  The class names are the ones the applications already style around —
  `.unlock-*`, `.mobile-nav-*`, `.on-this-page` and `.otp-*` — so a placement
  rule an application keeps still finds its element; delete the rest of the local
  rules with the local component.

  `ekdotico-check discipline` now reads `@supersedes` in the components barrel,
  so a copy left under its old name is reported: `UnlockScreen`,
  `ResearchUnlockScreen`, `UnlockSubmitButton`, `MobileNav`, `ResearchMobileNav`
  and `PageLoader`, beside `AccessGate` and `OnThisPage` under their own. Expect
  the guard to find these on the pin bump.

### Patch Changes

- f1412ba: The Document entry's rationale no longer calls FR-AU's "project" a residue awaiting amendment: FR-AU now says document. "Project" stays confirmable because it is also an ordinary English word.

## 0.21.3

### Patch Changes

- c416846: `LICENSE` clause 4 names the three typefaces the package actually references: Crimson Pro, Commissioner, and Fira Code. It still named Source Serif 4, Inter Tight, and JetBrains Mono, the families the 2026-08-09 amendment retired. That amendment reached the tokens, `src/fonts`, and the Expression Guidelines, and did not reach the licence, so the one document that states what third-party components the software depends on described a font set the package had not loaded for six weeks.

  All three canonical families are under the SIL Open Font License 1.1, as the three they replaced were, so the rest of the clause stands unchanged. The remaining mentions of the retired names in `src/fonts/index.ts`, `tokens/source/font.json`, and `expression/guidelines.md` are history, written in the past tense, and are left alone.

  Found from Praktico, whose specification carried the same stale name in FR-AR-11 and FR-AU-16 until its amendment 1.12.

## 0.21.2

### Patch Changes

- 518680b: `ekdotico-check decay` no longer reports a URL as one that "no longer answers" when
  the host answered by refusing the anonymous probe. A 401, 403, 407, or 429 means the
  page is behind a login, a bot challenge, or a rate limit, each of which the estate
  runs on purpose; the first run after deree switched on Attack Challenge Mode read the
  site's own address as a dead link and went red. Only a 4xx that describes the request,
  such as 404 or 410, is a finding now. A 5xx is recorded as inconclusive rather than as
  a finding, because the origin failing at the moment of the probe is what the monthly
  re-run exists to see again.

## 0.21.1

### Patch Changes

- 6665f6f: The agent hook stays inside the project and fails closed; the linter bounds its
  work; the installer refuses to write through a symlink.

  **The PostToolUse hook runs only the project's own linter.** It walked up from
  the edited file to the filesystem root and ran whatever `ekdotico-lint` it found
  beside the first `.ekdotico-lint.json` it met. That is a program chosen by the
  directory a file sits in: an agent asked to fix a typo in a checkout under
  `/tmp`, or in a repository vendored under the project, ran that checkout's
  binary or committed `dist/` with the developer's privileges and fed its output
  back into the model. The hook now resolves `CLAUDE_PROJECT_DIR`, exits at once
  for a file whose real path lies outside it, and stops the walk at the project
  root — never above it. The walk itself stays, because the estate is several
  repositories under one parent and a session opened at the parent must still
  find each repository's own config.

  **The hook reports a linter that did not run.** Its exit status and stderr were
  discarded, so a crash, a malformed config, a `files` glob matching nothing, or
  the hook timeout all passed the edit in silence. Exit 0 and exit 1 from the
  linter mean it ran; any other status is reported on stderr as "did not run"
  with the captured output, and the hook exits 2. A linter that is not installed
  still exits 0, since a consumer that has not installed the package yet must be
  able to, but now says so on stderr. `ekdotico-lint` itself now reports a config
  it cannot parse and exits 2 rather than throwing.

  **The linter bounds two paths that grew with the file.** The file-path
  exemption's regular expression had no length bound on either side of the `/`,
  which is quadratic on a long run of dotted identifiers; both sides are capped.
  `vocabularyFindings` lowercased the whole source once per vocabulary hit per
  canonical phrase; it does so once per file. A file over 1 MiB is skipped and
  the skip is reported on stderr, since no copy surface is that large and the
  hook has a timeout to keep.

  **The installer never writes through a symlink and never throws.** A
  `.claude` or `.claude/hooks` that is a symbolic link, or a hook destination that
  is one, is reported on stderr and left alone. A write that fails is reported the
  same way. Both exit 0, as the contract states: the install path never fails a
  consumer's install over a hook. `--target` with no value is now a message rather
  than a stack trace.

## 0.21.0

### Minor Changes

- cd2f5c1: A control-grade rule token, three component corrections, and a seventh
  accessibility check, from a WCAG 2.2 AA review across the consuming
  applications.

  **`--rule-control` is the border for a control.** Every hairline in the rule
  family measures between 1.6:1 and 1.9:1 against the canvas, which is what a
  divider wants and what a boundary may not have: WCAG 1.4.11 asks 3:1 of the
  visible edge of a text field or a button, and a hairline input was invisible
  as an input in every palette. The new token keeps each palette's rule hue and
  chroma at the lightness that first clears 3.3:1 against the palette's worst
  surface for it — the darkest light surface, the lightest dark one — so it
  holds on the canvas, a card, a sunken field, and a raised sheet alike. It is
  for the boundary of a control and nothing else; dividers keep `--rule-strong`,
  `--rule`, and `--rule-soft`. `check:contrast` lists it at 3:1 against all four
  surfaces. `AppearanceMenu`'s trigger takes it.

  **`Table` names its tab stop.** The `.tbl-wrap` wrapper carries `tabIndex={0}`
  so a keyboard reader can scroll a wide table at narrow viewports, and that was
  correct; but a tab stop is a user interface component, and one owes a role and a
  name (WCAG 4.1.2). A screen reader landed on the wrapper and announced nothing
  before the table itself was read. The wrapper is now `role="group"` with an
  `aria-label`, and `Table` takes an optional `label` prop for it, defaulting to
  "Table". `group` rather than `region`: a landmark per table would put eighty
  entries named "Table" in the documentation site's landmark list.

  **`AppearanceMenu` closes when focus leaves it.** Escape and a pointer press
  outside both dismissed the panel; Tab did not. A keyboard reader who tabbed past
  the last theme left an open popover sitting over whatever they focused next
  (WCAG 2.4.11), with no pointer to dismiss it. The wrapper now closes on a blur
  whose `relatedTarget` is outside it. A null `relatedTarget` — a click on the
  panel's own label, a window blur — is ignored, because neither is the reader
  leaving.

  **`Logo` marks its mark decorative.** The lockup renders the mark beside the
  wordmark, and the mark carried its default name, so every header announced the
  brand twice: "Ekdotico mark, image, Ekdotico". The mark inside `Logo` now
  passes `title=""`; `LogoMark` on its own still defaults to a named image.

  **`ekdotico-check a11y` gains a seventh check, `unnamedfocus`.** A generic
  element — `div`, `span`, `section`, `article` — given a literal non-negative
  `tabIndex` with no role, or a role that names nothing from content and no
  `aria-label`, is reported. Five table wrappers across two applications shipped
  that way. A `-1`, an expression, a spread that may carry the name, and a role
  named from its content are all left alone, so the check under-reports rather
  than guesses.

  **`check:contrast` lists four more pairs the consumers draw text on** — a typed
  value in an inset field, the in-flight submit button, an error inside a card,
  and a hovered primary action. All pass today; listed so they stay checked. The
  review also measured two that do not, and these are recorded rather than
  listed, because listing them would fail the build: `--fg-4` as placeholder text
  on `--bg-inset` sits at 4.00:1 to 4.13:1 in every light palette, and
  `--rule-strong` as a control border on `--bg-canvas` sits at 1.6:1 to 1.9:1
  against the 3:1 that WCAG 1.4.11 asks of a visible boundary. The consumers were
  corrected per control (`--fg-2` placeholders, `--fg-4` borders); whether the
  hairline tokens themselves should carry a control-grade step is a design
  decision this release does not make.

### Patch Changes

- a690e30: Table body cells wrap long unbreakable tokens instead of widening the table past its column.

  `.tbl-wrap tbody td` set `overflow-wrap: normal`, which opted every cell out of
  breaking a token that has no spaces in it — a regex, a route path, a DOI. Such a
  token contributes its full width to the column's min-content size, and
  `table-layout: auto` will not draw a table narrower than the sum of those, so
  `width: 100%` loses to it. `.tbl-wrap` carries no overflow at desktop by design,
  because that would break the sticky header, and so the surplus had nothing to
  scroll or clip it: it painted over whatever the host page keeps beside the
  content column.

  Measured in the documentation site, whose right gutter holds the page index: one
  70-character regex produced a 679px min-content cell inside a 648px column and
  pushed its table 186px into the index, over the text. Across the 80 tables there,
  5 overflowed, the worst by 186px. With `overflow-wrap: anywhere`, none do.

  `break-word` does not fix this. It wraps the token visually but contributes no
  break opportunities to intrinsic sizing, so the column stays wide and the table
  still overflows; only `anywhere` reaches the figure the layout algorithm reads.

  Column proportions improve as a side effect, and no per-table tuning is needed to
  get it: freed of the false constraint, auto-layout distributes the surplus by
  max-content, which tracks content volume, so prose columns widen and code columns
  narrow on their own. On the API table the description column went from 98px to
  254px and became the widest, having been the narrowest. Explicit column caps and
  `table-layout: fixed` were both measured against this and both did worse, because
  they flatten every column toward the same width.

  Cells that already fit are untouched: a break is taken only where the content
  would otherwise overflow. `word-break` stays `normal`.

## 0.20.0

### Minor Changes

- b473db4: Add `CircleQuestionMarkIcon` to the vendored icon set.

  The set had no glyph for "there is more to say about this", so a consumer
  wanting one had two options, both of which `icons.tsx` exists to prevent: draw
  an `<svg>` locally, or fall back to a `?` typed as text. The documentation site
  reached the second while building the disclosure that carries a chat failure's
  error code — a control that is an icon in every respect except that the set
  could not supply one.

  Named for `circle-question-mark` rather than the shorter `help-circle`. Lucide
  ships `help-circle`, `circle-help` and `circle-question-mark` with identical
  geometry, but only the last appears in `tags.json`; the other two are
  back-compatibility files kept from earlier renames. `check:icons` resolves the
  Lucide file from the component name, so an icon named for an alias fails the
  guard the day lucide-static drops it — and every other icon here is already
  named for a current name, so the alias would have been the only one.

  Geometry is `circle-question-mark.svg` verbatim, at the set's 1.5 stroke on the
  shared `Icon` wrapper. `check:icons` covers 18 icons now rather than 17.

## 0.19.0

### Minor Changes

- 11fb2e1: Expression Guidelines 0.4. Three concepts that the specification and the
  documentation site named inconsistently now have canonical terms, and the
  Session rationale follows the requirement that governs it.

  **Research workspace assistant** — the fifth AI surface. It carried three
  labels: "research workspace assistant" in FR-AU-40, "AI-powered query
  assistance" in FR-RW-22, and "research assistant" in this document's own §6.2.
  The vocabulary held no entry for it, which is how a concept ends up with one
  name per module. FR-AU-40 enumerates the five surfaces an institutional AI
  policy governs, so its label is the one a policy screen will carry, and it is
  the one adopted. §6.2 is corrected in the same change.

  **Auto-add** — the highest-confidence tier in task extraction. The tier was
  called auto-complete while the task it creates is assigned status "open", so
  the name described the opposite of the behaviour, and four pages disagreed
  about what the tier does. Renamed by the September 2026 documentation audit;
  this records the name.

  **Document over project.** FR-AU calls the unit an institution gains read
  access to a project; every other module calls it the document, and the data
  model has no Project entity. Document is canonical for the concept. FR-AU's
  wording is a known residue whose amendment is a specification change rather
  than a vocabulary one, so this entry records the decision rather than
  pre-empting it.

  All three non-canonical forms are `ambiguousVariants` — substantive, asking for
  human confirmation — rather than blocking. Each is also correct in a
  neighbouring sense: a research assistant is a person, a project is an ordinary
  English word, and FR-TK-10 genuinely auto-completes tasks it reassesses, so
  "auto-completed tasks" is right there and wrong as a tier name. A rule that
  cannot tell the senses apart reports the correct use as often as the wrong one,
  and the `copy` precedent on the branch entry is the same judgement.

  **Session** — the rationale said a session begins when a document is opened in
  a tab with focus. FR-PR-02 requires a qualifying interaction and records
  nothing without one; FR-PR-03 adds a 60-second reconnection grace the rationale
  omitted. The rationale now follows the requirement and cites it instead of
  restating its values, so the two documents cannot drift into disagreeing about
  a threshold.

  Consumers should expect new substantive findings from `lint:copy` where these
  forms appear. That is the point of the release: the queue was previously
  invisible.

### Patch Changes

- d1d66de: Two corrections to the Expression Guidelines, both about a claim the cited
  source does not carry.

  **The `special needs` prohibition attributed its reason too widely.** The rule
  said the term is "perceived as patronising by autistic and disabled
  communities (Bottema-Beutel et al., 2021)". The paper is _Avoiding ableist
  language: Suggestions for autism researchers_, and its full text says "many
  autistic people find terms such as 'special interests' and 'special needs'
  patronizing". It reports on autistic people; it does not speak for disabled
  communities generally. The reason now reads "perceived as patronising by many
  autistic people", which is what the citation supports. The prohibition itself
  is unchanged: the term stays blocking in every register, with the same
  replacement.

  **P6's grounding named a work that cannot be resolved.** The principle cited
  "Frontiers in Education (2023); Eaton (2025)". No Frontiers in Education
  article matching the claim was located during the September 2026 documentation
  audit — the citation carried no author, title, or DOI, and searching the
  journal produced no candidate. The grounding is now "Eaton (2025)" alone, which
  is verifiable and sufficient for the principle. The documentation site removed
  the same citation from its copy of P6; this brings the canonical copy into
  agreement.

  The change is to `expression/prohibited.json` and the hand-written prose of
  `expression/guidelines.md`. Section 8's table is a generated region, so
  `pnpm build:expression` regenerated it from the data; prose and data still
  agree and the build-time check passes.

## 0.18.1

### Patch Changes

- 7596e7e: `check:consumers` refuses a credential that cannot see what it was asked about,
  instead of reporting one as a clean bill of health.

  `api()` mapped every 404 to `null`. That is correct on the contents endpoint,
  where a repository without a `package.json` is an answer rather than a failure.
  It was applied unchanged to `/orgs/{org}/repos`, where the same value means the
  opposite, and the script walked zero repositories, printed
  `0 consumer(s), 0 needing attention` and exited 0. `consumers.yml` reads an
  absent report as every consumer being current, so the run closed the tracking
  issue with the comment "Every consumer is on the published version." That is the
  outcome this script's own docstring says it exits to avoid.

  Three guards, because there are three doors and the obvious one is not the one
  this organisation opens:

  - **The organisation cannot be listed.** GitHub answers 404, not 403, for an
    organisation a credential is not allowed to know exists. The first page is no
    longer allowed to be `null`.
  - **The organisation lists no repositories.** Measured against the live
    endpoint: `Ekdotico` is publicly visible while every repository in it is
    private, so a credential without access to those repositories is answered
    `200` with an empty array rather than 404. This is the door a personal-account
    token or a revoked organisation approval actually opens, and the 404 guard
    alone does not close it. An expired token is the safe case — that is 401, and
    `api()` already threw on it.
  - **No `package.json` can be read.** Contents (read) is a separate permission
    from listing the organisation, and without it every `manifest()` 404s, which
    is indistinguishable from repositories that have no manifest. Every repository
    in this organisation is a Node project, so none being readable is a permission
    rather than a fact.

  The run now states how many repositories were listed and how many manifests were
  read, which is the number that makes a report of no consumers believable. Each
  guard was verified by driving the unmodified script against a stubbed endpoint
  before and after: exit 0 with a clean report before, exit 1 naming the cause
  after, with the healthy run unchanged at exit 0.

- 9f4675a: `install-agent-hooks` reports on stderr, so it cannot corrupt the tarball
  manifest it is printed in front of.

  The installer announced its work on stdout. It runs as `prepare`, and `npm pack`
  runs `prepare` before it prints — so with `--json` that one line was emitted
  into the middle of the manifest, and `check:exports`, which parses that manifest,
  died on it:

      SyntaxError: Unexpected token 'i', "install-ag"... is not valid JSON

  The line is only printed when a hook is actually written, which is the tell that
  made this hard to see. On a fresh clone `.claude/hooks/` is absent — it is
  gitignored, being a build output — so the first `pnpm check` installed the hook,
  said so, and failed; the second had nothing to write, said nothing, and passed.
  CI never saw it because `pnpm install` runs `prepare` before `pnpm check` does,
  so the write was already spent by the time anything packed. It waits for the
  next path that packs before installing.

  Fixed at the installer rather than at the parse: any consumer of
  `npm pack --json` in this repository shares the exposure, and stdout is the
  manifest's channel while a progress note is a diagnostic. `pnpm install` still
  shows the line. The parse now carries a comment saying whose channel it is, so
  the next lifecycle script prints on the right one.

  Verified by driving `check:exports` against the state that produced it — the
  hooks directory moved aside, so the install genuinely happens — before and
  after: `SyntaxError` before, a parsed manifest after.

## 0.18.0

### Minor Changes

- 797effb: Ship the Expression Guidelines PostToolUse hook with the package, and install it into consumers.

  `scripts/agent-hooks/expression-check.sh` runs `ekdotico-lint` over the file an agent has just written, in whichever application owns it, and reports that file's findings against the `failOn` threshold in its own `.ekdotico-lint.json`. `scripts/install-agent-hooks.mjs` copies it into `<consumer>/.claude/hooks/` from the consumer's postinstall; the installed file is a build output, gitignored and rewritten on every install, so a hook is changed here and carried by the pin bump.

  It lived as four hand-maintained copies for a day, which is three too many and the same shape as the token catalogue that drifted 388 lines from its twin. A hook also has to agree with the version of the guidelines installed beside it: distributed separately it can enforce this release's rules against last release's package, which is Rule 15 with an exit code.

- 797effb: `ekdotico-check` with no arguments now runs every guard a consumer can run, and the copy linter is one of them.

  The no-argument set was the literal `contrast, styles, appearance`, while this file's own docstring said it ran everything a consumer could. Both `discipline` and `a11y` — the two guards written specifically for consumers — were outside it, so the shortest invocation was also the one that checked the least. It is now derived from the guard table, which means a guard added here arms itself in every application at its next pin bump rather than waiting for three workflow edits that nobody remembers are owed.

  `copy` is a new guard, wrapping the `ekdotico-lint` binary through `scripts/check-copy.mjs`. The wrapper exists because the two take their target differently: every guard reads an application directory from argv, and the linter is driven by `process.cwd()` and reads a positional argument as a glob, so handing it a directory would have linted one path instead of the configured set. Where a repository ships no `.ekdotico-lint.json` the guard says on stdout that it checked nothing and exits 0 — a skip nobody can see in the log is the fails-green shape this CLI already refuses elsewhere.

  `icons` is now marked `developmentOnly`. It compares against `lucide-static`, a devDependency only this repository installs, and exits 2 without it. That was survivable while the default set was a hand-written list and stopped mattering the moment the list was derived: a guard that cannot run outside this repository, and does not declare it, becomes a red pipeline in three applications as soon as it is picked up automatically.

  Two exclusions remain from the no-argument set. `developmentOnly` guards, structurally. And `decay`, because it reads instruction documents, which do not change on most commits — it belongs to the monthly audit workflow, and running it per-change would make it noise.

## 0.17.0

### Minor Changes

- 6fdbbf3: `check:styles` audits a consuming repository's own stylesheets, and the
  Expression Guidelines stop contradicting themselves about their own version.

  **The style guard now targets consumers.** `ekdotico-check styles .` reads the
  calling repository's `.css` and `.module.css` files instead of this package's,
  the way `discipline`, `a11y` and `decay` already did. Without a directory
  argument it behaves exactly as before.

  This is the second half of rule 17. The package removed `text-transform` from
  every label role in 0.15.0 and added the guard in the same release — and every
  consumer went on shipping the declaration, because the guard read `dist/styles`
  whatever directory it was invoked from. An application running it got a passing
  result about somebody else's CSS. Thirty-five declarations survived that way
  across two applications, rendering `PRE-LAUNCH`, `ACCESS CODE`, `THE PLATFORM`
  and every section eyebrow from strings that were authored in sentence case. The
  gap rule 17 names — a copy linter that never opens a stylesheet, a style guard
  with no string to compare against, and nothing joining the two — had a second
  instance one level up, across the package boundary, and closing the first did
  not close the second.

  The parse checks stay package-only: a consumer's stylesheet is compiled by its
  own bundler, which reports a syntax error better than this does. What a consumer
  gets from here are the three house rules a bundler has no opinion about — no
  0.01ms motion ceiling, no coloured edge stripe, no case transform.

  **Rule 13's blockquote exception is now the guard's exception**, with its
  ceiling where the code can hold it. The rule permitted "a bare `blockquote` rule
  with no card surface" and warned that an unwritten exception is how a ban
  erodes; the guard could not see the distinction and would have failed two
  correct blockquote rules on the first consumer it audited. A rule whose selector
  names `blockquote` and which declares no `background`, `box-shadow` or
  `border-radius` is bare and passes. Any of the three makes it a card, and a card
  signalling tone with a coloured edge is the banned pattern whatever the selector
  is called.

  **`check:expression` now checks the closing line as well as the header.**
  `guidelines.md` opened at 0.3 and closed at `*End of Expression Guidelines
v0.2*` for the whole of 0.3 — the single canonical copy contradicting itself, in
  the one file whose purpose is to be the copy that cannot. The version check read
  the header and stopped, so the footer sat outside the only guard built to
  prevent exactly this. A version stated twice is now checked twice.

  Both new assertions were mutation-tested by reintroducing the defect and
  confirming the failure.

### Patch Changes

- 6fdbbf3: `Table` gives its scroll container a tab stop.

  `.tbl-wrap` is `overflow-x: auto`, so a table wider than the reading column
  scrolls sideways. It did so for a wheel, a trackpad and a touch drag, and for
  nothing a keyboard offers — the wrapper held no focus, and the columns past the
  right edge were unreachable without a pointer (WCAG 2.1.1). `tabIndex={0}` makes
  the container focusable, which is what lets the arrow keys scroll it.

  The stop is unconditional rather than measured. Whether a given table overflows
  is a client-side measurement and this component renders on the server, so the
  choice is between a redundant tab stop on a table that fits and unreachable
  content on one that does not. The focus ring is the package's existing
  `:focus-visible` rule in `base.css`; no styling is added.

  Consumers that build the wrapper by hand rather than through this component need
  the same attribute — `docs` carries it on `RequirementTable`, `RiskTable`,
  `StakeholderTable` and `Compare`.

## 0.16.1

### Patch Changes

- 73c2f9e: `check-a11y`'s focus-ring check no longer accepts a selector that merely shares
  a prefix with the one it is looking for.

  `hasFocusReplacement` asked whether any focus-styled selector in the repository
  _contained_ the base as a substring. So a rule for `.cmdk-input-row` cleared the
  finding for `.cmdk-input`, and a rule for `.icon-button` cleared it for a bare
  `button` — different elements that happen to share a prefix or a suffix. The
  failure is in the direction that matters: a control whose ring really was
  removed, reported as fine because of an unrelated rule elsewhere in the sheet.
  It was found on a consumer where the coincidence went the other way and the
  guard passed for the right reason by accident.

  The base must now appear as a whole token: the character after it cannot
  continue the identifier, and for a base that is not class- or id-prefixed
  neither can the character before it. Compound (`.a.b`), descendant (`.a .b`)
  and `:has()` forms still count.

  Where an ancestor carries the indicator, name the descendant so the
  relationship is legible to a reader and checkable here — `.row:has(.field:focus)`
  rather than a bare `.row:focus-within`, which says nothing about which control
  it stands in for.

## 0.16.0

### Minor Changes

- 76f67e0: Accessibility guards, and the diagram text-alternative measures behind them.

  Rule 18 joins the visual ruleset: a diagram is an image, and an image whose
  subtree is pruned owes a text alternative that conveys what it conveys. The
  rule was established by a documentation site on which twelve Mermaid diagrams
  across five pages reached a screen reader as the single word `Diagram`, because
  `role="img"` prunes everything inside it and no call site passed a title.

  **New exports**

  - `@ekdotico/domico/mermaid/accessibility` — `extractAccessibility(chart)`
    reads Mermaid's own `accTitle:` and `accDescr:` directives out of a diagram
    source and returns them beside a `source` string with the directive lines
    blanked in place. Blanked rather than deleted, so every line number a parser
    reports still matches the fence the author is reading, and so `accDescr {`
    is not counted as structure by a grammar check.
  - `@ekdotico/domico/svg` — `annotateSvg(svg, idBase, title, descr)` writes
    `<title>` and `<desc>` into a detached SVG, in that order, ahead of the drawn
    content. It sets `role="img"` only when there is a title: the role with
    nothing to name it prunes the shapes and puts nothing in their place. It
    mutates the node it is given, so callers pass a clone.

  **New guard**

  `ekdotico-check a11y` audits a consuming repository for six failure classes:
  a Mermaid diagram with no text alternative, one element holding both a
  non-operable role and `tabIndex`, `aria-modal` with no focus trap, an aria
  reference resolving to no element, an outline removed with no `:focus-visible`
  ring, and an icon-only button with no accessible name. The diagram check is
  scoped to the routed tree, so a fence in an archived plan is not reported.

  **Figure**

  `Figure` takes an optional `description`, rendered visually hidden and
  referenced by `aria-describedby`. An `alt` string cannot carry a graph. The id
  is derived from the source and the description rather than from `useId`, so the
  component stays renderable on the server.

## 0.15.0

### Minor Changes

- c97236f: Labels render in the case they are authored in. `text-transform: uppercase` is
  removed from every label role, and rule 17 now forbids the property outright.

  Ten declarations applied case: `.theme-header-label` in `styles/appearance.css`;
  `.eyebrow` in `styles/type.css`; `.tbl-wrap thead th`, `.tbl-caption`, `.kv-key`,
  `.callout-title`, and `.stat-label` in `styles/components.css`; and three more in
  the visual ruleset's own stylesheet, which set its labels in capitals while
  stating the rule that forbids them.

  **This is a visible change on every surface that renders a label.** `Theme` reads
  `Theme` rather than `THEME`, and a table header reads `Participant` rather than
  `PARTICIPANT`. Nothing else moves: size, weight, tracking, and colour are
  untouched, and they are what carried the label role in the first place — case was
  the fifth signal on a label that was not struggling to be read as one. Review
  across the four themes in both modes before adopting, per rule 14.

  Why it is a defect rather than a preference. The Expression Guidelines require
  sentence case for every label, heading, and piece of interface copy; §4 states
  that rule as universal — "regardless of register", "any copy submitted for
  Ekdotico, in any context" — and offers `"PROVENANCE RECORD"` as its
  counter-example. Applying `uppercase` in a stylesheet produces that
  counter-example from a string that was authored correctly, which is why it
  survived: `ekdotico-lint` reads authored strings and never opens a stylesheet,
  the style guards read stylesheets and have no string to compare against, and
  nothing joined the two. It shipped on three surfaces for fourteen minor versions
  in the gap between them.

  Two guards close that gap, both mutation-tested by reintroducing the declaration:
  `check:styles` fails on `text-transform` in any shipped stylesheet, and
  `check:ruleset` holds the ruleset document's own stylesheet to the same
  prohibition. All three values are refused, not only `uppercase` — `lowercase`
  erases a proper noun and `capitalize` forces title case onto a label the
  guidelines require in sentence case, so the property has no compliant value here.

  `.smallcaps` is unchanged and is not the alternative. It preserves the authored
  casing, but no house family ships the glyphs — Commissioner, Crimson Pro, and Fira
  Code all lack `smcp` and `c2sc`, read from the `woff2` a browser is served — so a
  browser scales capitals instead, which is rule 5's synthesis failure in a second
  costume. The role is retained as a correct instruction that renders properly the
  day `--font-sans` carries the feature, and it now says so where it is defined.

  Also in this release: the ruleset's `.theme-header-label` stated `0.12em`
  directly where `--tr-label` holds that value, which is rule 1 in the document
  that states rule 1. It takes the token. The `check:styles` failure header said
  the stylesheets "do not parse" for findings that had nothing to do with parsing;
  it now says what it means.

  Raised from `praktico` as a rule 4 item rather than worked around locally. The
  consuming repository could not fix it — overriding a package global breaks the
  CSS-Modules rule, restating the styling locally is the defect NFR-Q-04 names, and
  rule 6 forbids passing a `label` prop — so it stopped, recommended one change,
  and waited. That is the route the rule exists to produce.

## 0.14.1

### Patch Changes

- a24af67: `decay` no longer reports a path that is gitignored.

  A path git is told to ignore is **expected** to be absent from a checkout, so a
  document naming one is correct. `.vercel/project.json` exists on every developer's
  machine and in no clone.

  Found the right way: the check passed on four repositories locally and failed in CI
  on exactly that file, which is what a second environment is for. Local-only artefacts
  are invisible to a guard that only asks the filesystem, and no amount of running it
  in one place would have surfaced it.

  git is asked rather than `.gitignore` parsed, because git handles nested ignore files
  and negations and a hand-rolled matcher would not. One `git check-ignore --stdin` call
  covers every candidate. If git is unavailable or the directory is not a work tree,
  every candidate is reported: the check degrades to its previous behaviour rather than
  silently passing, because a guard that goes quiet when a tool is missing is worse than
  one that is noisy.

  Mutation-tested both ways: a path under an ignored directory is exempt, and a
  genuinely missing source file beside it is still reported.

## 0.14.0

### Minor Changes

- 1ef20f9: Add `ekdotico-check decay` — the drift a commit-triggered gate cannot see.

  `discipline` catches what a change introduces. This catches what rots without one:
  a path that was correct until a file moved, a URL that was live until DNS changed, a
  version that was current until a release. **No pull request causes any of those, so
  no per-pull-request gate can find them.** A dead apex domain sat in this estate for
  weeks, feeding every canonical URL and every link-unfurl image, and every character
  of the sentence naming it still parsed.

  Five checks, chosen because they would have caught roughly twenty of the thirty
  findings in the audit that prompted this:

  | Check     | What it reads                                                           |
  | --------- | ----------------------------------------------------------------------- |
  | `paths`   | a file path named in an instruction file that does not exist            |
  | `scripts` | a `pnpm <script>` named in a document that `package.json` lacks         |
  | `guards`  | an `ekdotico-check <guard>` named in a document that does not exist     |
  | `urls`    | an `http(s)` URL in a document that no longer answers                   |
  | `version` | `@ekdotico/domico` not pinned exactly, or out of step with the lockfile |

  It reads instruction files — `CLAUDE.md`, `AGENTS.md`, `README.md`, `.impeccable.md`,
  and `.claude/{commands,hooks,agents,skills,rules}/` — and skips dated records, for
  the same reason `discipline` does: a path that was correct in May is not a defect in
  August, and rewriting a record to satisfy a guard falsifies the history it keeps.

  ### Four exemptions, every one of them found by running it

  The first pass reported 27 findings in this package alone and every one was wrong.
  Each exemption below is a distinction the guard has to make and could not make
  naively:

  - **A package specifier is not a path.** `@ekdotico/domico/tokens.css` resolves
    through an exports map; no such file sits at a repository root. Export subpaths are
    read from the manifest — the calling repository's and its installed dependencies' —
    so the list stays current without this guard hardcoding what the package ships.
  - **A fenced block illustrates; prose asserts.** An example config naming
    `components/CommandPalette.tsx` describes somebody else's tree.
  - **Prose asserting a file is ABSENT is correct documentation.** "There is no
    `src/styles/base.css`" is true and useful. The window spans the line before and
    after, because the negation lands after the reference as often as before it — one
    sentence put the cue on the following line and the two-line version reported
    correct documentation as a stale path.
  - **`pnpm` in prose is not an invocation.** "pnpm never installs it transitively"
    and "`pnpm deploy` is a built-in pnpm command" produced findings for scripts named
    `never` and `command`. Only code spans are read now.

  Both halves are mutation-tested: a genuinely stale path and a genuinely missing
  script are still reported.

  **It is deliberately not in `pnpm check`.** The URL half needs the network, and a
  gate that goes red when a runner's DNS hiccups gets switched off — network failures
  are reported as inconclusive rather than as findings for the same reason. Run it on a
  schedule and on a batch of commits, which is what the `audit.yml` workflow added
  alongside this does.

  And what it cannot do is worth stating plainly, because the gap is where the next
  failure will live: **it finds a reference that does not resolve; it cannot find a
  sentence that is false.** "The production site is `https://ekdoti.co`" needs a
  reader.

## 0.13.1

### Patch Changes

- 25459ad: `docfork` no longer reports a hook that states the correct path and the history together.

  Two exemptions, both found by running the guard against the repositories it governs
  rather than by reasoning about it.

  **A glob that also matches the package path.** `*/docs/design-tokens.md` is how a
  hook matcher is written and documented, and it resolves against `node_modules` as
  readily as against a local copy.

  **A bare mention on a line that already gives the correct path for the same
  document.** Then the reference is contextual prose — in practice a sentence saying
  the local copy is deleted and naming what to read instead — rather than a direction
  to a local file.

  The second exemption is deliberately narrower than the one it replaces. An earlier
  version allowed any line mentioning `@ekdotico/domico`, which was too loose: the
  original defect's payload named the package's token _stylesheet_ while sending the
  agent to a local _catalogue_, and passed. Keying on the package path for that
  specific document keeps the original failing — verified by reconstructing it — while
  letting a payload that states both the right path and the history through.

## 0.13.0

### Minor Changes

- 3e67c6d: Make the guards match the rules, and teach `docfork` to read hooks.

  An audit of the estate against the documents 0.12.1 shipped found that the
  document defining rule 15 broke rule 15: three rules cited `check:styles` as their
  guard and `check:styles` checked none of them. It proved the shipped stylesheets
  parse and nothing more. The claims are now true rather than softened.

  `check:styles` additionally rejects:

  - **A `0.01ms` motion ceiling** anywhere in the shipped stylesheets. Comments are
    stripped first, because `reset.css` carries a long note explaining why the
    ceiling is wrong, and a guard that cannot tell an explanation from a declaration
    would fail on the one file that gets this right.
  - **A coloured edge stripe** — an inline border above 1px whose colour does not come
    from the rule scale. The adjective is the test, and finding that took two
    attempts. One-sidedness was the first, and it failed on six legitimate
    declarations: the table component draws a four-sided outline cell by cell, because
    a table cannot take a border with rounded corners cleanly, and the symmetry lives
    across sibling selectors rather than within one rule. What separates the banned
    pattern from that outline is that a stripe signals tone with an accent while an
    outline is a hairline in `--rule`.

  Both were mutation-tested.

  ### `docfork` now reads hooks, under the opposite rule

  The check walked markdown only, and both consuming applications' PreToolUse hooks
  were still injecting the deleted local catalogue path into an agent on every
  styling edit. One opened with "Read the catalogue first — docs/design-tokens.md,
  end to end" for a file that had been deleted. The guard was silent.

  Hooks now get their own arm, and the rule there is inverted deliberately. A
  document waits to be read, so a sentence naming a deleted file is usually history
  and stays exempt. A hook injects its text on every matching edit, so it is never
  history: it is an instruction being given now, and a local path is wrong whichever
  way it resolves — a fork if the file exists, a dangling instruction if it does not.

  Two refinements came from running it. A shell `case` arm is a pattern deciding
  whether the hook fires, not text handed to a model, so document names there are
  matchers and are exempt — the first version flagged two and would have left the
  hook unfixable. And the test is per match rather than per line, because a hook's
  payload is one enormous single-line JSON string carrying the correct package
  reference and the stale local one at once; a line-level allowance let the real
  defect through while still reporting the comments above it.

  ### `ekdotico-check` forwards flags

  `ekdotico-check discipline --quiet` exited 2 with "no guard named --quiet" while
  every check underneath it passed. Same fails-green shape as reading a trailing `.`
  as a guard name, and just as bad in a pipeline: the gate goes red with nothing
  wrong. Unrecognised `--flags` are forwarded to the guard, which owns them.

  ### Documents
  - `AGENTS.md` pointed twice at "rule 14" for the documentation-contradiction rule.
    That is rule 15; rule 14 is contrast. An agent following the pointer landed on
    the wrong rule.
  - `docs/visual-ruleset.md` is re-stamped to 0.12.1, and its Current state section is
    down to one finding. Two of the three it shipped with were closed within hours by
    the same work that shipped it, which is recorded there as the argument for keeping
    state out of the rules.
  - The Latin wordmark sets **one** node in live `<text>`, not two. The second grep
    hit was the file's own comment.
  - Three dead references to the deleted Greek wordmark are gone: the ruleset template
    described it in the present tense, and `logo-wordmark.svg` pointed at a longer note
    inside it. That reasoning is now recorded in `logo-wordmark.svg` itself.

## 0.12.1

### Patch Changes

- d757226: `docfork` no longer reports a reference to a local catalogue that does not exist.

  The prose half of the check now runs only where a local copy is actually present,
  and that condition is the rule rather than an optimisation: a reference cannot
  send anyone to a stale catalogue that is not there. With the file deleted, naming
  it is either a dead link or — far more often — a sentence explaining that it was
  removed and what to read instead. Documenting a removal is exactly what an
  instruction file should do, and the first two attempts at this check forbade it.

  Attempt one looked back 60 characters from each match for the package path. It
  failed on the first sentence written to satisfy it: one that points at
  `node_modules` and then names the old path while explaining why it went. Attempt
  two allowed any line mentioning the package, and failed on wrapped markdown, where
  the package path and the filename land on different lines. Both were guesses at
  intent from surrounding text. Whether the file exists is not a guess.

  Mutation-tested: reintroducing a local copy fires the file finding and both prose
  references, and removing it returns to a pass — so the prose findings reactivate
  precisely when they mean something.

## 0.12.0

### Minor Changes

- 88184e2: Ship the house style as documents consumers receive, and guard the one rule that had no guard.

  The package owned the tokens and shipped no catalogue. Two consumers each kept
  their own, and they had drifted until 388 of 452 lines differed — two independent
  documents describing one token set, neither updated when its application migrated
  onto the package. That is the drift that matters most, because enforcement hooks
  feed those files to agents on every edit, so a stale copy does not merely mislead
  a reader: it instructs a machine to reintroduce the fault it describes.

  Three documents now ship, added to `files` and addressable through `exports`:

  - `AGENTS.md` — the short form, for an agent about to make an edit. The four hard
    rules, and the eight things that get broken first by someone who has read them.
  - `docs/design-tokens.md` — the canonical catalogue. 116 tokens, every value
    verified character-for-character against `tokens/generated/tokens.css`, with the
    when-not-to-use notes that were the most valuable content in either consumer
    copy. Colour values are pointed at rather than transcribed, so the document
    cannot disagree with the palettes.
  - `docs/visual-ruleset.md` — the sixteen rules, each naming the guard that
    enforces it.

  **Rules and state are now separated, and that is the substantive change rather
  than a formatting one.** The first edition interleaved them: every rule carried
  the file and line of the violation that motivated it, in the present tense. All
  twenty of its factual claims were re-verified a day later and seventeen had been
  fixed. A document that reports state inside its rules obliges a reader to
  re-verify every rule before trusting any of it. Rules are now timeless; the three
  surviving findings sit in one dated section.

  Two claims the first edition got wrong are corrected rather than carried:

  - The dark twins were described as hand-maintained. They are generated from one
    source, and `check:generated` byte-compares the output, so a hand edit is
    already rejected.
  - Taking `fontConfig` from this package without restating it was presented as the
    fix for the italic axis. It cannot be done: `next/font` is a compile-time
    transform that requires explicitly written literals, so both the spread and the
    bare object fail the build while passing typecheck. The rule now says to guard
    the restatement instead of pretending it is removable.

  ### Rule 15 is now enforced

  `ekdotico-check discipline` gains a `docfork` check: a consuming repository fails
  if it keeps a local copy of a document this package ships, or if an instruction
  file sends an agent to a local catalogue rather than the one in `node_modules`.
  It was the only rule in the set with no mechanical enforcement, which is why it
  was the one every repository broke.

  ### Removed: the Greek wordmark

  `assets/logo/logo-wordmark-greek.svg` is deleted, and `brandAssets.wordmarkGreek`
  goes with it. **This removes a public export**, which in 0.x lands in a minor.
  Verified unused: no consumer references either the key or the file.

  There is one logo and it is the hand-drawn mark, which is paths throughout. The
  Greek wordmark set its letterforms in live `<text>`, so what it drew depended on a
  webfont resolving in whatever context it was placed — a rendering of a name rather
  than a mark. It was marked `UNFINISHED` in the asset itself and outlining it needed
  tooling this repository does not have, so it was deleted rather than carried as a
  permanent open finding.

  The Latin wordmark has the same fault in two nodes and is kept for now. It is
  recorded as the one remaining finding under rule 4 rather than left implicit.

  ### Also
  - `check:contrast` now states two token constraints instead of omitting them. It
    checks `--fg-4` on `--bg-surface-2` at the 3:1 non-text threshold, which is
    where it measures 4.20:1–4.36:1 in the light palettes and is permitted only
    because its single use is icons — an absence could not distinguish "checked and
    permitted" from "never considered". `--fg-5` is recorded as decorative-only in a
    comment for the same reason. 136 pairs now measured across eight palettes.
  - `ruleset/` carries the visual edition's source, so the artifact is versioned
    with the tokens it documents. `pnpm build:ruleset` builds it, `pnpm check:ruleset`
    holds it to its own rules and is now part of `pnpm check`.
  - The ruleset build derives its typefaces from the docs font output rather than
    from a hand-written table of content hashes. The table had the Crimson Pro
    roman and italic transposed, so every upright serif glyph in the published
    document was drawn from the italic binary — and the document's own twenty-five
    compliance checks passed, because they check CSS patterns rather than which
    file a face resolves to.

## 0.11.0

### Minor Changes

- bd74a44: One stylesheet entry per component, the appearance controls behind one button, and the guards runnable from a consuming repository.

  ### An entry per component

  `styles/components.css` shipped the layout primitives, the appearance controls, and every shared component as one global layer. praktico's `conventions/visual` Rule 3 mandates CSS Modules and forbids a global component layer, so of roughly ten shared components it could render the two whose styles it could import without the other eight. That was the blocker on component sharing, and it is gone.

  Ten new entries, so an application imports what it renders and nothing else:

  - `styles/primitives.css` — Container, Stack, and Cluster
  - `styles/badge.css`, `styles/callout.css`, `styles/figure.css`, `styles/keyvalue.css`, `styles/logo.css`, `styles/section-rule.css`, `styles/stat.css`, `styles/table.css`, `styles/tabs.css`

  The entries are sliced from `src/styles/components.css` at the section banners the file already carried, rather than authored as ten new files. A component's styles still live in one place, and `styles.css`, `styles/base.css`, `styles/reset.css`, `styles/type.css`, `styles/components.css`, and `styles/appearance.css` are byte-identical to their previous output, because they are assembled from the same unsliced text they always were. `build:styles` fails if the slices stop accounting for every byte of the source, so a reformatted banner cannot silently drop a section into the wrong entry.

  ### The appearance header row moved

  `.theme-header` and `.theme-header-label` were in `components.css`, held back from `appearance.css` on the reasoning that the row is markup an application writes itself. An application importing only `styles/appearance.css` — which is the entire reason that entry exists — therefore could not reach the row, and its label and mode pill stacked where docs' sat on one line. That was praktico's only visible divergence from docs, and one import boundary was the whole cause. The row is now in `styles/appearance.css` with the controls it lays out.

  ### `AppearanceMenu`

  Both switchers behind one 36px button, for chrome with no room for the pair laid out. A disclosure button and a non-modal popover, composing `ThemeSwitcher` and `ModeSwitcher` rather than restating them.

  A reader picks a theme by comparing each candidate against the page, which is what decides the pattern: the surface has to survive activation, ruling out `role="menu"`, and must not seal off the page being judged, ruling out `aria-modal` and a focus trap. Escape closes it and returns focus to the trigger, a press outside closes it, and Tab leaves.

  Focus lands on the **checked** theme radio on open, not the first. The group is a single tab stop parked on the selected option, so opening onto the first button would misreport the active theme and make the next arrow press move from the wrong place. Server-rendered correctly: the checked state comes from `AppearanceProvider`, so a reader with a theme cookie gets their own theme before any JavaScript runs.

  The panel is never unmounted on `transitionend`. `reset.css` sets `transition: none !important` under `prefers-reduced-motion`, so that event never fires for those readers and anything gating removal on it hangs for ever.

  Its styles are in `styles/appearance.css`, so praktico's narrow import gets them. `PaletteIcon` joins the vendored icon set, matching `lucide-static` verbatim.

  ### Callout, re-treated

  The 3px tinted `::before` down the left edge of every non-`note` variant is retired. The house style prohibits coloured left-border accent cards, and drawing the accent as a pseudo-element evaded the letter of that ban while being the treatment it names. Each type now pairs its `--*-soft` wash with a full hairline border in its own hue — the border previously restated the wash, so it was there and invisible. All six types stay distinguishable, and warn and danger still carry `role="note"` and a title, so no tone was ever signalled by colour alone. Left padding drops from 22px to 18px, matching the right, since the extra space existed only to clear the stripe.

  ### Per-theme diagram edges

  `--diagram-edge` is new, across all eight palettes: gilt under Parchment, forest under Library, terracotta under Sepia, and ink or paper under Mono. The Mermaid projection read `lineColor` from `--gilt`, which flattened all four themes to the same warm gold — a gilt arrow on the Mono canvas, the one palette defined by having no hue. A token rather than a branch in the generator, so the value is available to CSS as well.

  `check:contrast` gains `--diagram-edge` on `--bg-surface` at the 3:1 non-text threshold, and now covers 128 pairs across the eight palettes.

  ### Token discipline in `styles/appearance.css`
  - Three `140ms cubic-bezier(0.22, 1, 0.36, 1)` literals on `.mode-btn` become `var(--dur-fast) var(--ease-soft)`. They are numerically equal today, which is exactly why they would have forked silently on the next retune of the motion scale.
  - `.theme-switcher` reads `repeat(var(--theme-count, 4), 1fr)` rather than `repeat(4, 1fr)`. Everything else about the control is driven by the generated `themeNames`, so a fifth theme would have wrapped its button onto a second row.
  - `.theme-btn` gains its own focus ring at `outline-offset: 1px`. The global ring sits at 2px, which on a four-column grid with a 2px gap draws inside the neighbouring cell.

  ### `ekdotico-check`

  The drift gates were unavailable outside this repository, so no consuming application could make one a blocking check. `pnpm exec ekdotico-check` runs `contrast`, `styles`, and `appearance`; `--list` shows all seven. A command rather than a documented path into `node_modules`, so a consumer is not coupled to this package's internal layout. `generated`, `expression`, and `exports` refuse with their reason, since each needs a development dependency that is never published.

  `files` gains `src`, `tokens/source`, `tokens/lib`, and `scripts`. The guards read the authoring inputs, not only the built output, and shipping `src` also makes the existing source maps resolve for a consumer.

  ### `check:appearance`

  Now also asserts that every class the three appearance controls render resolves in `styles/appearance.css` — the promise that entry exists to make, and the one that was broken twice — that nothing in `src/theme` waits on a transition or animation event, and that the menu declares neither `aria-modal` nor a menu or dialog role.

## 0.5.0 – 0.10.0

**No entries. Six versions were published without a changeset and without a git
tag**, and this note exists so the gap is explicit rather than silent. Tags stop
at `v0.2.0`; the entries below stop at 0.4.1; `package.json` reached 0.10.0.

Nothing is reconstructed here beyond what the commit history states, because a
changelog that invents what a release contained is worse than one that admits it
does not know. What the version bumps in `package.json` are attached to, for
anyone tracing a change to a release:

| Version | Commit subject                                                                      |
| ------- | ----------------------------------------------------------------------------------- |
| 0.5.0   | `feat(icons): add plus, minus, and arrow-up-right, and a draw variant for the mark` |
| 0.6.0   | `feat(icons): add pencil, for the rename affordance`                                |
| 0.7.0   | `feat(styles): split the base layer, absorb four gaps, and prohibit motion flatly`  |
| 0.8.0   | `feat(styles): ship the appearance controls as their own entry`                     |
| 0.9.0   | `feat(styles): move td-strong here, so the table cell pair lives in one place`      |
| 0.10.0  | `chore: rename the package and repository to Domico`                                |

Three of those are load-bearing for consumers and were never announced anywhere
a consumer reads: `styles/reset.css` and `styles/type.css` became separate
entries at 0.7.0, `styles/appearance.css` at 0.8.0, and the package was renamed
from `@ekdotico/design-system` to `@ekdotico/domico` at 0.10.0.

The missing tags are not recreated. Tagging six commits retrospectively would
assert that each was the published tree, which nothing here can confirm.

## 0.4.1

### Patch Changes

- Repair `components.css`, which has not parsed since 0.1.0.

  The extraction script replaced each original banner comment with its own header but kept the banner's body and closing delimiter, so ten blocks had prose sitting in CSS statement position followed by a stray `*/`. The file also ended with a banner opener and no content, which made every parser read the tail as a comment.

  Four releases shipped it and nothing noticed, because no consumer had ever imported the file — docs takes only the tokens. Splitting the stylesheet in 0.4.0 gave deree a reason to import it, and the build refused.

  `check:styles` now validates every shipped stylesheet for balanced comments and braces, in `pnpm check` and in CI. A stylesheet nobody imports is a stylesheet nobody validates, so the package validates its own.

## 0.4.0

### Minor Changes

- Ship the stylesheet in three entries rather than one, so a consumer can take the component styles without a second reset.

  - `styles.css` — unchanged in name and contents: base layer, primitives and components.
  - `styles/base.css` — the base layer alone: reset, focus ring, skip link, screen-reader utility, reduced motion, scrollbars, type utilities.
  - `styles/components.css` — primitives and shared components alone.

  Whole-stylesheet adoption is the wrong granularity for a site that already has its own reset. deree needed the theme switcher and nothing else: importing the combined file would have layered a second reset over its own, and copying the six rules it needed into its globals would have recreated exactly the duplication this package exists to remove.

## 0.3.0

### Minor Changes

- 603c6a8: The server tells its components what it told the document.

  `appearanceAttributes()` restored the reader's theme onto `<html>` and stopped there. Every appearance-aware component still server-rendered the default, because the hooks in `useAppearance.ts` read the document and there is no document during a server render — their third `useSyncExternalStore` snapshot was a constant. The page was Sepia and the control said Parchment, which is the disagreement 0.2.0 claimed to have closed and had only moved from the client to the server.

  It was not only cosmetic. `ThemeSwitcher` puts its single tab stop on the selected option, so a reader arriving by keyboard before hydration was placed on Parchment rather than on the theme they had chosen.

  **`appearanceState()`** joins `appearanceAttributes()` on the `/theme/server` subpath. Same cookies, returned as values rather than attributes. Both fall back to the same defaults, so a corrupted cookie leaves the page and the control agreeing rather than disagreeing in opposite directions.

  **`AppearanceProvider`** carries that pair into the client tree, and the hooks take their server snapshot from it. A provider rather than a prop on each component, because the consumers are not only the switchers — a logo choosing a variant and a diagram choosing a palette ask the same question, and one of those is injected into MDX where no prop can reach it.

  Nothing needs to adopt it. The context default is the pair the hooks previously hardcoded, so an application that installs no provider behaves exactly as before, which is what a static export with no request to read a cookie from requires.

  **The swatches ask CSS instead.** `ThemeSwitcher` chose its swatch colours through `useRenderedMode`, which is the one question no server can answer: Auto defers to a preference that lives on the reader's machine and is never sent with the request. Each swatch now carries both candidates as `--swatch-light` and `--swatch-dark`, and three rules in `components.css` pick between them under `[data-mode="dark"]` and `prefers-color-scheme`. That resolves at paint, before the first frame, and closes the Auto gap rather than narrowing it — a reader on Auto with a dark system no longer meets light swatches at all. It also takes the last inline colour out of the control.

  The colours still come from the generated token export, so there is no second copy to drift; only the choice between them moved. `useRenderedMode` keeps its place for values that must exist in JavaScript — a library configured through an object of colour strings, which no stylesheet can reach — and its server snapshot is now cookie-backed for an explicit Light or Dark.

  **`LogoMark` gains a `solid` variant**, which wears whichever tile contrasts with the canvas under it, chosen by the stylesheet from `--logo-tile-bg` and `--logo-tile-ink`. `Logo` used to pick between `dark-solid` and `light-solid` from `useRenderedMode` and had the same Auto gap as the swatches. The two pinned variants remain, for surfaces whose mode is fixed regardless of the reader's — an Open Graph image, a print template.

  **`.logo` was not being styled at all.** The banner comment above it opened with `/* ===…` and closed on its own first line, leaving `LOGO LOCKUP` as bare CSS. That made the selector invalid, and an invalid selector takes its whole block with it, so the rule was dropped by the parser in both `components.css` and the built `base.css`. It shipped that way in 0.2.0 and no consumer had noticed, because none of them load the stylesheet yet.

  `check:appearance` covers the new function: every generated theme and every mode round-trips, junk degrades to the defaults in both directions at once, and the attributes and the state are asserted to agree across every valid combination.

## 0.2.0

### Minor Changes

- Server-rendered appearance, and the accessibility and colour fixes found while auditing the three consuming applications against this package.

  **Appearance is restored on the server.** `appearanceAttributes()` on the new `/theme/server` subpath reads the theme and mode cookies and returns the attributes to spread onto `<html>`. No inline script runs, so there is nothing for a Content-Security-Policy to make an exception for. This is the preferred mechanism; `themeInitScript()` remains for applications with no server render, and as the migration path for readers whose choice is still in localStorage.

  The reason is security rather than tidiness. Restoring from localStorage cannot happen without JavaScript, before first paint, inline — which forces every consumer to either mint a per-request nonce or admit `'unsafe-inline'` into `script-src`. One consumer had already recorded that concession because its hosting cannot produce a request-scoped nonce.

  Auto remains a CSS decision. The server cannot know the reader's operating system preference and does not need to: Auto is the absence of `data-mode`, and `[data-theme=…]:not([data-mode])` hands the decision to `prefers-color-scheme` at paint time.

  **The switchers read the document instead of copying it.** Both held React state initialised to a default and corrected it in an effect, so a reader with a stored theme saw the page in Sepia with Parchment shown as selected for one frame on every load. State now comes from the document attributes through `useSyncExternalStore`. `useTheme` and `useMode` join `useRenderedMode`, and the appearance vocabulary moves to a browser-free module so `resolveRenderedMode` can be asserted without a DOM.

  **The radio groups keep the promise their role makes.** Both declared `role="radiogroup"` and implemented neither half of the pattern: every option was its own tab stop and the arrow keys did nothing. `useRadioGroup` supplies a single tab stop with roving focus, arrows that move and select, and Home and End.

  **Colour and elevation.**

  - `--accent-ink` on Parchment dark was white on a light lavender accent, 3.22:1 against the 4.5:1 a button label needs. Parchment was the only dark palette still doing this. Now 5.43:1.
  - Every light palette declares its own complete shadow set. Library and Sepia tinted their three elevation shadows while their ring and inset inherited Parchment, and Mono declared none at all, putting a warm-brown hairline on a monochrome canvas.
  - `check:contrast` measures 112 foreground and surface pairs across all eight palettes in CI.

  **Icons.** `ModeSwitcher` carried its own hand-drawn sun, monitor and moon alongside the verbatim Lucide ones already in `icons.tsx`, at different radii and rectangles. It now uses the vendored set. `TableIcon` and `MaximizeIcon` are added, and `check:icons` verifies every vendored icon against `lucide-static`, failing on a redrawn coordinate or an inline SVG reappearing outside the icon module.

  **Portability.** `useRadioGroup` returns a callback ref rather than a `RefObject`: React 19 changed the variance of `RefObject`, so a hook exporting one types cleanly under exactly one React major while `peerDependencies` admits both.

  `engines.node` moves to `>=22`, which the linter CLI already required through `fs/promises.glob`.

## 0.1.0

### Minor Changes

- 6aee9a0: Initial extraction of the Ekdotico house style from the `docs` repository.

  **Visual layer**

  - Design tokens authored once, in `tokens/source/*.json`, with every consumable artefact generated from that source: CSS custom properties for four themes across two modes, a typed TypeScript export, and a Mermaid palette map. Hand-maintaining parallel definitions was the failure this extraction exists to end.
  - All colour values are OKLCH. The conversion from the previous hex values is exact, and 288 colours are verified to survive an OKLCH-to-hex-to-OKLCH round trip on every build.
  - The base layer ships the reset, the document defaults, the focus and skip-link primitives, the scrollbar theming, and the semantic type utilities. Layout geometry stays with each application.
  - Nine shared components: `Badge`, `Callout`, `Figure`, `KeyValue`, `Logo`, `SectionRule`, `Stat`, `Table`, and `Tabs`. Documentation-specific components were deliberately left behind.
  - The theme mechanism ships with the package rather than being reimplemented per repository, including a blocking init script that removes the first-paint colour flash.

  **Specification amendments**

  Two conflicts between the locked specification and the implementation were resolved in favour of the implementation, on core team decision. In both cases the specification was amended rather than the code reverted.

  - **Typefaces.** The specification named Source Serif 4, Inter Tight, and JetBrains Mono. The canonical families are Crimson Pro (`--font-serif`), Commissioner (`--font-sans`), and Fira Code (`--font-mono`). Amended in the published design system page, the design brief, and the design brief's skill entry point.
  - **`--gilt`.** The specification named `#8b6f3a`. The canonical value is `oklch(47.298% 0.0739 84.45)` — darker, and meeting the WCAG 4.5:1 threshold, consistent with remediation already applied to `--fg-4`, `--warn`, and the Sepia accent. Shipping the original would have knowingly regressed contrast in three repositories.
  - **`--measure`.** Corrected from `68ch` to `72ch`. The published design system and the accessibility rationale both specified 72 characters; the implementation was the outlier, and the reading measure is an inclusive-design constraint rather than a preference.

  Expression Guidelines §5.4 rule 5 was amended in the same decision. It named JetBrains Mono directly, which would have put a language rule in permanent conflict with the design system it depends on. It now names the `--font-mono` role token. The general principle: where the Expression Guidelines depend on the design system, they reference tokens, never values.

  **Corrections applied during extraction**

  - **Mermaid diagram colours corrected.** The docs site carried 216 hard-coded hex literals duplicating all eight palettes, and they had already fallen out of sync — the parchment rule colour rendered `#8b6f3a` against a stylesheet value of `#6f5826`, so diagram rules were visibly a different gold from page rules. The palette is now generated from the token source.
  - **Logo tile colours became brand tokens.** They were hex literals inside the component.
  - **Theme swatches read from the token export** rather than from a hand-maintained mirror of eight canvas colours.
  - **The table sticky-header offset became `--table-sticky-offset`**, defaulting to no offset. It previously assumed the documentation site's top bar height.

  **Expression layer**

  - The Expression Guidelines move into the package as the single canonical copy, at version 0.3. Two copies previously existed, both labelled 0.2, disagreeing on section 7. The reconciliation adopts the newer model, which the specification content already used: **provenance record** names the captured data, **provenance report** names its human-readable rendering.
  - The controlled vocabulary (32 terms) and the prohibited terms (33 rules) ship as structured, machine-readable data. Each prohibition carries its reason, its replacement, and its register scope, so a rule that applies only to the provenance/institutional register is never fired against marketing copy.
  - The prose tables in the guidelines are generated from that data, and a build-time check fails if they diverge — including the case where both files claim the same version while saying different things.
  - The register diagnostic framework ships as reference documentation for the failsafe agent, not as an automated classifier. Register classification needs judgement that pattern matching cannot supply.
  - Rules the tooling cannot check are recorded explicitly under `notEnforced`, and eight vocabulary gaps found during the audit are recorded against the additions process.

  **Copy linter**

  - `ekdotico-lint`, shipped as a binary and as a library on the `/lint` subpath. It reads the structured expression data and holds no copy of the rules, so changing a prohibited term means editing one file.
  - Findings are written in the System Feedback register: what was found, where, why it is a violation, and what to use instead. A rule identifier alone is never emitted.
  - Overrides are supported inline and by path, and both require a recorded rationale. An override without a reason fails the build and does not suppress its finding — a silent suppression removes the evidence that anything was wrong.
  - Structural exemptions cover code fences, inline code, prohibited-terms and vocabulary tables, quoted counter-examples, frontmatter, URLs, and allowlisted identifiers. A quoted span is exempt only where its line carries a contrast marker, so a genuine UI string in quotes is still checked.
  - Register-scoped rules run only where a register is declared. The linter does not infer one and reports how many rules it skipped for want of one.
  - Variants that are also ordinary English report as substantive and ask for confirmation rather than blocking. `copy` is not tracked at all: it is the house term for prose, and matching it would produce noise on a scale that trains reviewers to ignore the tool.
  - A regression test asserts both directions — that the linter catches what it should, and stays quiet where it should. The package lints its own guidelines and README clean in CI.

  **Design system completeness**

  - Layout geometry ships as tokens: `--page-w`, `--content-w`, `--measure`, `--gutter`, `--sidebar-w`, `--topbar-h`, and `--table-sticky-offset`. The reading measure is an inclusive-design decision rather than a preference, which is why it belongs to the house style rather than to each application.
  - Three layout primitives — `Container`, `Stack`, and `Cluster` — address spacing by scale step rather than by value, so an off-scale gap cannot be introduced by accident.
  - An icon set on the `/icons` subpath: eleven Lucide icons, vendored from `lucide-static` rather than installed, at 1.5 stroke on a 24×24 viewBox. Vendoring avoids shipping two thousand glyphs to serve eleven; putting them in one module is how the resulting conformance cost is paid, since an icon can no longer drift in a single consumer unnoticed.
  - Brand assets are addressable through a typed manifest on the `/assets` subpath, covering three variants across two fills and seven sizes in both SVG and PNG, the two wordmarks including the Greek lockup, and the usage rules for the mark.
