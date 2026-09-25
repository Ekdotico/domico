---
'@ekdotico/domico': minor
---

An accessibility subpath, two components moved in from the applications,
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
