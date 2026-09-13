---
'@ekdotico/domico': minor
---

A control-grade rule token, three component corrections, and a seventh
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
