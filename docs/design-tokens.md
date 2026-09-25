# Design tokens

This is the authoritative catalogue of every CSS custom property the design
system defines. A token that is not listed here does not exist, and a `var()`
naming one that does not exist resolves to nothing and renders as the property's
initial value, silently.

The values live in **`@ekdotico/domico/tokens.css`**, which resolves to
`node_modules/@ekdotico/domico/tokens/generated/tokens.css`. It is imported
**once per application**, at the root, ahead of anything that reads a token.
That file is generated from `tokens/source/*.json` and is not edited by hand:
`pnpm check:generated` regenerates into a temporary directory and fails on any
difference, so a hand edit is rejected rather than surviving as invisible drift.

**No application declares a token of its own.** A custom property defined in an
app stylesheet shadows the package in the palette you tested and silently
nowhere else — there are eight palettes, and a value that only exists in one of
them is worse than a missing one, because it renders correctly during review.
Three tokens are deliberate exceptions and they are named in
[Layout](#layout); they are overrides of an existing token's value, never a new
name.

This document says what each token is for and, more usefully, when not to reach
for it. Read it before writing a style, not after.

---

## The palette model

Four themes × two modes = **eight palettes**, one set of token names.

A consumer switches theme by switching values, never by switching names. There
is no `--accent-parchment`; there is `--accent`, and it is plum under parchment
and forest under library.

| Layer               | Selector                                                                  | What it is                                                          |
| ------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Structural fallback | `:root`                                                                   | Shares its block with parchment light. Applies before any attribute is set. |
| Theme               | `[data-theme="parchment" \| "library" \| "sepia" \| "mono"]`               | Parchment is the default.                                           |
| Mode, explicit      | `[data-theme=…][data-mode="dark"]`                                        | The reader chose dark.                                              |
| Mode, automatic     | `@media (prefers-color-scheme: dark)` + `[data-theme=…]:not([data-mode])` | The reader chose Auto, or has never chosen.                         |

**44 tokens resolve under all eight palettes** — 39 colours and five shadow
composites. Each of the twelve theme blocks declares the complete set of 44
rather than inheriting part of it from another theme.

**72 tokens are theme-invariant scales**, declared once under `:root`: the type
scale, spacing, radius, optical offsets, motion, layout geometry, three named
shadows, and the four brand values. They take no theme or mode override.

That is **116 tokens** in total, and every one of them is in a table below.

### Auto is the absence of `data-mode`, not a value of it

There is no `data-mode="auto"`. Auto is what you get when the attribute is not
present at all, and the absence is the whole mechanism:

- `:not([data-mode])` is what **arms** the `prefers-color-scheme` block. Set the
  attribute to anything, including the string `auto`, and the selector stops
  matching, so the automatic dark palette can never apply.
- The same selector is what **stops a dark operating system overriding an
  explicit Light choice**. A reader who picked Light carries `data-mode="light"`,
  which fails `:not([data-mode])`, so the media query does not reach them.

Writing `data-mode="auto"` breaks both directions at once, and it breaks them
quietly: the attribute looks correct in the markup and the palette is simply
never right.

### Dark is calibrated per theme, not shared

There is no single dark palette. Each theme has its own, for two reasons that
both bite if they are undone:

- Light shadows use alpha tinted to the theme's own canvas — warm brown under
  parchment, green under library, red-brown under sepia, neutral under mono —
  and that disappears against a dark canvas. Dark replaces the whole set with
  higher-alpha neutral shadows over a white hairline.
- Accents were recalibrated to hold their contrast obligation against their own
  `--accent-soft` grounds in dark. Do not lighten a dark accent back toward its
  light-mode hue to make the two "match"; they are not meant to.

The explicit-dark blocks and the automatic-dark blocks are byte-for-byte
duplicates, because CSS cannot alias an attribute selector to a media-query
selector. They are **not hand-maintained twins**. Both are emitted from one
entry in the token source, so they cannot drift from each other by
construction.

### Contrast is owed by all eight palettes

`pnpm check:contrast` resolves each palette through the same cascade the
stylesheet uses and measures a fixed list of foreground-on-surface pairs, so
what is checked is what a reader sees rather than what one source file declares.
A check that samples only the default theme, or only the light modes, will
report one failure where three exist.

Two consequences for anything written against these tokens. Never differentiate
text by transparency on a saturated field — composite an opacity onto an accent
and it fails in every palette at once; differentiate by size and weight instead.
And where a colour pair is not on the checked list, no guard can catch it, which
is exactly the situation the two foreground notes in [Foreground](#foreground)
describe.

### How to reference a token

`var(--sp-12)`. Never `var(--sp-12, 4rem)`.

A fallback inside `var()` is a second source of truth with nothing keeping it
honest, and it is worse than it looks: `var()` reaches its fallback only when
the property is **unset**, and the token layer sets all of them. So a stale
fallback never renders. It is a false statement about the design system that no
pixel is able to contradict, waiting to become true the day a token is renamed.

Font stacks are the same case and are already handled: the fallback chain lives
inside the token definition, authored once. `font-family: var(--font-sans)` with
nothing after it is the complete correct form.

---

## Surface

Six grounds, from the page backward and forward.

| Token            | Role                                                              |
| ---------------- | ----------------------------------------------------------------- |
| `--bg-canvas`    | The page itself.                                                  |
| `--bg-surface`   | A card, panel, or table — a thing sitting on the page.            |
| `--bg-surface-2` | The subtle step between canvas and surface.                       |
| `--bg-raised`    | The elevated layer: a popover, a modal, a menu panel.             |
| `--bg-inset`     | The recessed layer: an input well, a code block.                  |
| `--bg-elevated`  | Alias, declared as `var(--bg-surface-2)`.                         |

`--bg-elevated` is not a sixth step in the stack. It resolves to exactly
`--bg-surface-2` in all eight palettes and exists so that an interactive surface
inside a panel — an input, a `kbd`, an inline code span, a hover or active row —
can be named for what it is rather than for its position: "subtly distinct from
the panel it sits in", not "darker than the page". Reach for it when the surface
belongs to a panel; reach for `--bg-surface-2` when you mean the step.

**When not to.** Do not stack surfaces to imply depth that the elevation set
already carries; a raised surface takes `--bg-raised` and a shadow, not three
nested backgrounds. Do not use `--bg-inset` for a disabled control — recession
means editable-and-empty here, not unavailable. And do not draw text on a
surface without checking the pair: the two foreground tokens below pass on
`--bg-canvas` and not on `--bg-surface-2`.

## Foreground

Five inks, descending prominence. Only the first three are text colours in all
positions.

| Token    | Role                                                     |
| -------- | -------------------------------------------------------- |
| `--fg-1` | Body text, headings, primary ink.                        |
| `--fg-2` | Secondary text.                                          |
| `--fg-3` | Meta: timestamps, counts, captions.                      |
| `--fg-4` | Labels — and icons, dividers, and decoration on a tinted surface. |
| `--fg-5` | Decoration only. Not a text colour anywhere.              |

**`--fg-4` and `--fg-5` are not general text colours, and this is the constraint
most easily broken by reading the names as a simple ramp.**

`--fg-4` measures 4.20:1 to 4.36:1 on `--bg-surface-2` across the four light
palettes, under the 4.5:1 any text pair needs. On that surface it is for icons,
dividers, and decoration, where the 3:1 non-text threshold applies. The guard
measures it against `--bg-canvas`, where the lowest ratio is 4.55:1 — so it
passes the check and still fails on the tinted surface below it. No guard can
catch a foreground used on a surface nobody declared it against, which is why
the rule is written here.

`--fg-5` does not approach a text threshold on any surface, at 1.41:1 to 2.01:1
across the eight palettes. Decorative separators, disabled glyphs, and
watermarks. Never a label, never placeholder text, never "muted" body copy.

`--fg-3` is the quietest ink that is text on the tinted surface as well, and
the guard measures it there: the table header row, the table caption, and two
badges set it on `--bg-surface-2`, where the lowest ratio across the eight
palettes is 4.60:1, in sepia light. That palette's `--fg-3` was moved down 1.6
points of lightness to get there, from 4.32:1, keeping its hue and chroma.

**When not to.** Do not reach down the scale to de-emphasise text; use size and
weight. Text that must be quieter than `--fg-3` is text that should be shorter.

## Rule

| Token            | Role                                                       |
| ---------------- | ---------------------------------------------------------- |
| `--rule-control` | The boundary of a control: a text field, a quiet button.   |
| `--rule-strong`  | A prominent divider: a masthead, a section boundary.       |
| `--rule`         | A component border.                                        |
| `--rule-soft`    | An internal separator: rows in a list, cells in a table.   |

Always `1px`. The house treatment is a hairline, and a rule at 2px reads as a
frame, which is a different visual claim.

`--rule-control` is the one rule that is not a hairline in contrast, only in
width. A divider may sit at 1.6:1; the visible edge of a text field or a button
may not (WCAG 2.2 SC 1.4.11 asks 3:1), and the three hairlines measure 1.6:1
to 1.9:1 on every canvas. Each palette sets it at the lightness that first
clears 3.3:1 against its worst surface — the darkest light surface, the
lightest dark one — so it holds on the canvas, a card, a sunken field, and a
raised sheet alike. Use it for a boundary that identifies a control and for
nothing else; a divider drawn with it reads as a frame.

**When not to.** Do not use a rule token as a text or icon colour; it is
calibrated for a 1px line against its own canvas and nothing else. Do not
substitute `--fg-5` for a rule, or a rule for `--fg-5`, even where the values
look close in one palette — they diverge across the other seven.

## Accent

| Token            | Role                                                   |
| ---------------- | ------------------------------------------------------ |
| `--accent`       | The one interactive colour: links, primary action, focus ring, selected state. |
| `--accent-hover` | Its hover and active value.                            |
| `--accent-soft`  | Its wash, for a filled ground behind accent text.      |
| `--accent-ink`   | The ink that sits **on** `--accent`.                   |

Plum under parchment, forest under library, burnt orange under sepia. Under mono
the accent is ink in light mode and paper in dark, with no chroma at all — mono
is the palette defined by having no hue, and anything that hard-codes a
"coloured" accent breaks there first.

**`--accent-ink` is not white.** It is white in all four light palettes and a
dark, accent-tinted ink in all four dark ones, because every dark accent is
light enough that white ink on it fails as normal text. Parchment dark shipped
white there once, at 3.22:1, and was corrected to 5.43:1. Write
`color: var(--accent-ink)` on any accent-filled surface and the palette resolves
it; write `color: white` and it fails in four of eight.

**When not to.** One accent per interface. Do not introduce a second interactive
colour from the editorial or state groups — a gilt button reads as a warning and
a burgundy one as a deletion. Do not use `--accent` for a cross-reference; that
distinction is the point of the next group. Do not use `--accent-hover` as a
static "darker accent" — under dark palettes it is *lighter* than `--accent`,
because hover moves toward the reader rather than toward black.

## Cross-reference

| Token           | Role                                                        |
| --------------- | ----------------------------------------------------------- |
| `--accent-xref` | Cross-reference tint: the underline, rule, or marker.       |
| `--fg-xref`     | Cross-reference text.                                       |

Blue-tinted in every palette and deliberately distinct from `--accent`, so that
a reference to another document reads differently from a control that acts. The
two are separate tokens because the text needs a different value from the
underline to hold contrast on the canvas; `--fg-xref` is the one measured
against `--bg-canvas`.

**When not to.** Do not use these for a control. A cross-reference navigates or
discloses provenance; anything that mutates state is `--accent`, whatever it
looks like. Do not use `--accent-xref` as a general blue — there is no general
blue, and `--info` is the semantic one.

## Editorial

| Token             | Role                                                     |
| ----------------- | -------------------------------------------------------- |
| `--gilt`          | Marginalia, decorative section rules, editorial emphasis.|
| `--gilt-soft`     | Its wash.                                                |
| `--burgundy`      | Quotation accents, attribution marks.                    |
| `--burgundy-soft` | Its wash.                                                |

Gilt is earth gold, never browser yellow. It ships darker than the original
brand value because the original failed as small text; where an accessible value
and a locked brand specification conflict here, the contrast is kept and the
specification is amended. Gilt is checked both on `--bg-canvas` and on
`--gilt-soft`, because gilt text on its own wash is a real pattern and a
consumer that once forked a darker gilt to pass that pair then failed on every
dark palette.

Burgundy is muted. It is not red, and it is **not `--danger`** — a pull quote is
not an error, and the two tokens hold different values in every palette
precisely so that the distinction survives.

**When not to.** These are editorial, not semantic. Do not signal state with
gilt or burgundy, and do not use them for interactive affordances. Do not treat
`--gilt-soft` as a highlight for running text; that is what the highlight group
is calibrated for.

## State

| Token       | Role                          | Wash          |
| ----------- | ----------------------------- | ------------- |
| `--ok`      | Success, valid, complete.     | `--ok-soft`   |
| `--warn`    | Caution, needs attention.     | `--warn-soft` |
| `--danger`  | Error, destructive, expired.  | `--danger-soft` |
| `--info`    | Neutral information.          | `--info-soft` |

Earth-toned: forest green, gilt gold, muted burgundy, oxford blue. **Never a
saturated browser green, yellow, red, or blue.** Each of the four is measured
against `--bg-canvas` in all eight palettes.

The `-soft` value is a ground, not an ink. Pair the solid token as text or icon
with its own `-soft` as the fill behind it.

**When not to.** Do not colour a whole row or card in a state value; the house
treatment for a toned surface is a full hairline in the type's hue over the
type's wash. A coloured left-hand edge stripe is prohibited **by any
mechanism** — a 3px tinted `::before` and an inset `box-shadow` draw the same
card as a `border-left` and are covered by the same rule. Do not use `--warn`
and `--gilt` interchangeably even where they resolve close: one is a state and
one is decoration, and a reader learning the interface learns the difference.

## Highlight

| Token           | Role                                                    |
| --------------- | ------------------------------------------------------- |
| `--hl-quote`    | Quotation wash. Also the `::selection` background.      |
| `--hl-citation` | Citation wash.                                          |
| `--hl-warn`     | Caution wash under text.                                |
| `--hl-danger`   | Error wash under text.                                  |
| `--hl-ai`       | Machine-generated or machine-assisted content.          |

These are the only colours calibrated to sit **behind body text** and stay
readable. They are desaturated for that reason, and they are the answer whenever
a passage of prose needs a tone.

**When not to.** Do not use a highlight as a surface for a whole component; they
are washes over the canvas, not grounds in the surface stack. Do not use a
`-soft` state value where a `--hl-*` belongs, or the reverse: the state washes
are calibrated behind a hairline, the highlight washes behind running text. Do
not stack two highlights on overlapping ranges — they composite into a third
colour that is in no palette.

## Elevation

| Token                  | Value or role                                                     |
| ---------------------- | ----------------------------------------------------------------- |
| `--shadow-0`           | A hairline ring, no drop. `0 0 0 1px` in a palette-tinted alpha.  |
| `--shadow-1`           | Resting card: 1px offset, 2px blur, plus the ring.                |
| `--shadow-2`           | Lifted: 2px offset, 6px blur, plus the ring.                      |
| `--shadow-3`           | Overlay: 8px offset, 24px blur, plus the ring.                    |
| `--shadow-inset`       | Recession inside a well.                                          |
| `--shadow-swatch-ring` | `inset 0 0 0 1px rgba(60, 45, 20, 0.04)` — the inset hairline ring on a colour swatch. |
| `--shadow-drawer`      | `1px 0 0 0 var(--rule-soft), 8px 0 24px -8px rgba(60, 45, 20, 0.12)` — rightward, for a slide-out drawer. |
| `--shadow-chat-panel`  | `-8px 0 24px -16px rgba(0, 0, 0, 0.25)` — leftward, for a right-hand rail. |
| `--overlay-scrim`      | The backdrop behind a modal or drawer.                            |

`--shadow-0` through `--shadow-3`, `--shadow-inset`, and `--overlay-scrim` are
per-palette. Elevation reads as light falling on the page, so its colour comes
from the same place the page does; in dark palettes the whole set becomes
higher-alpha neutral over a white hairline, and the scrim becomes a neutral
black alpha.

The three named shadows are **declared once and are not per-palette.** Each
belongs to one surface and is not a step in the scale:

- `--shadow-swatch-ring` carries a fixed warm-brown alpha and does **not**
  re-tint per theme, unlike `--shadow-0`. It is deliberate at this alpha, on a
  swatch whose whole job is to show a colour truthfully.
- `--shadow-drawer` composes `var(--rule-soft)`, so its hairline does follow the
  theme while its blur does not. It is directional: it assumes the drawer enters
  from the left.
- `--shadow-chat-panel` assumes the opposite edge. Its alpha is neutral black in
  every palette.

**When not to.** Shadows belong on raised and overlay surfaces only. **A flat
surface takes a rule, not a shadow** — a card at rest is a hairline and at most
`--shadow-1`, never `--shadow-2` to look important. Never a pure-black shadow in
a light palette; the tinted alpha is the reason elevation reads as paper rather
than as a dashboard. Do not reach for one of the three named shadows to shadow
something else because its geometry happens to suit: they are single-purpose,
and a general need is a general step. Do not compose your own scrim — one
canonical `--overlay-scrim` is what makes every full-screen overlay match.

## Font family

| Token          | Family        | Role                                                        |
| -------------- | ------------- | ----------------------------------------------------------- |
| `--font-serif` | Crimson Pro   | Display and reading: page titles, headings, blockquotes, prose. |
| `--font-sans`  | Commissioner  | Interface and labels: buttons, menus, form fields, metadata. |
| `--font-mono`  | Fira Code     | Identifiers, hashes, timestamps, and code.                  |

Each token points at a CSS variable the consuming application defines when it
loads the family, followed by a metric-sympathetic fallback stack so a swap
during font load does not reflow the reading column. The stack lives in the
token definition; do not restate it at the use site.

Roles are fixed and never mixed: serif reads, sans labels, mono identifies. All
cryptographic identifiers, hashes, public keys, timestamps, participant
identifiers, and checksums take `--font-mono` — the token, not the family name,
so the rule follows the role rather than breaking when the family changes.

**Greek glyphs never come from `--font-serif`.** Crimson Pro publishes no Greek
subset — latin, latin-ext, and vietnamese only, none covering U+0370–03FF — so
Greek set in the reading serif does not fail loudly. It falls through to whatever
face the operating system substitutes, which is a different face at a different
weight sitting beside Latin text in the real one, and it differs across macOS,
Windows, and Linux with nothing reported anywhere. Use `--font-sans`;
Commissioner ships Greek, as does Fira Code. Where the letterforms have to be
exact and cannot depend on a font being present at all, use outlined paths. This
is the one place where referencing the token is not sufficient: the token is
correct and the family behind it cannot render the script.

One consequence to carry with that rule, because it looks like a hole and is
not: an application requesting `subsets: ['latin']` does not preload
Commissioner's Greek face, but it still resolves — a font loader emits an
`@font-face` per published subset and lets `unicode-range` decide, so the Greek
arrives on demand. The cost is a possible flash on first paint, not a
substituted face. Where Greek is more than an incidental gloss, add it to that
family's subsets so it preloads with the Latin.

**When not to.** Do not use mono as decoration — it marks a string as an
identifier, and using it for emphasis makes every real identifier ambiguous. Do
not set body prose in sans, and do not set a heading in sans to make it "feel
like interface", the Greek exception aside. Never write a family name in CSS.

## Size

Thirteen steps, in `rem`.

| Token        | Value       | At a 16px root |
| ------------ | ----------- | -------------- |
| `--fs-3xs`   | `0.625rem`  | 10px           |
| `--fs-2xs`   | `0.6875rem` | 11px           |
| `--fs-xs`    | `0.75rem`   | 12px           |
| `--fs-sm`    | `0.8125rem` | 13px           |
| `--fs-base`  | `0.9375rem` | 15px           |
| `--fs-md`    | `1.0625rem` | 17px           |
| `--fs-lg`    | `1.25rem`   | 20px           |
| `--fs-xl`    | `1.5rem`    | 24px           |
| `--fs-2xl`   | `1.875rem`  | 30px           |
| `--fs-3xl`   | `2.375rem`  | 38px           |
| `--fs-4xl`   | `3rem`      | 48px           |
| `--fs-5xl`   | `3.75rem`   | 60px           |
| `--fs-6xl`   | `4.75rem`   | 76px           |

**The unit is `rem`, and that is not cosmetic.** A `px` font size ignores a
reader who has raised their browser's default font size — the interface stays
small for exactly the person who asked for it not to be. A `px` font size is
therefore a defect on its own terms, independently of the tokens-only rule.

The two micro steps exist so that badges, eyebrows, and keyboard chips stay on
the scale instead of dropping to a literal below it. They are small enough that
they are label sizes and not text sizes.

**When not to.** Do not interpolate between steps, and do not scale a token with
`calc()` to reach a size the scale does not offer. Do not use `--fs-3xs` or
`--fs-2xs` for anything a reader has to read as a sentence.

## Line height

| Token         | Value  | Use                                              |
| ------------- | ------ | ------------------------------------------------ |
| `--lh-tight`  | `1.12` | Display type and large headings.                 |
| `--lh-snug`   | `1.28` | Smaller headings, single-line labels.            |
| `--lh-normal` | `1.5`  | Interface default.                               |
| `--lh-prose`  | `1.65` | Running prose in the reading column.             |
| `--lh-loose`  | `1.8`  | Wide or sparse text where the measure runs long. |

Unitless, so they multiply the element's own font size and survive a change of
step.

**When not to.** Do not set `--lh-tight` on anything that wraps to more than two
lines; it is calibrated for display type where the ascenders and descenders do
not meet. Do not use `--lh-normal` for the reading column — `--lh-prose` exists
because a 72-character measure needs the extra leading to keep the eye on the
right line at the return sweep. Do not give a line height a unit.

## Tracking

| Token          | Value      | Use                                                   |
| -------------- | ---------- | ----------------------------------------------------- |
| `--tr-tighter` | `-0.025em` | Large display type, where default spacing looks loose.|
| `--tr-tight`   | `-0.012em` | Headings.                                             |
| `--tr-normal`  | `0`        | Body and interface text.                              |
| `--tr-wide`    | `0.02em`   | Slight opening, for short emphasised strings.          |
| `--tr-wider`   | `0.08em`   | Small caps and wide labels.                            |
| `--tr-label`   | `0.12em`   | Uppercase micro-labels at `--fs-3xs` and `--fs-2xs`.  |
| `--tr-widest`  | `0.18em`   | The widest step, for very short display strings.      |

`--tr-label` is named for a role rather than a position on the scale, and
deliberately: the value was already load-bearing in four separate component
rules — table headers, table captions, key/value terms, and a panel row label —
with nothing to call it, which is how a scale acquires an unnamed sixth step. It
sits between `--tr-wider` and `--tr-widest` and has no free scale name, and the
role is what the four sites actually have in common.

**When not to.** Tracking opens as type gets smaller and closes as it gets
larger; the scale runs that way and applying it backwards is the common error.
Do not track body prose — `--tr-normal` is the correct value and is a token so
that it can be stated rather than omitted. Do not use `--tr-label` at a reading
size; it is calibrated for the two micro steps.

## Weight

| Token         | Value | Use                                    |
| ------------- | ----- | -------------------------------------- |
| `--fw-regular`| `400` | Body text.                             |
| `--fw-medium` | `500` | Labels, quiet emphasis.                |
| `--fw-semi`   | `600` | Headings, active states.               |
| `--fw-bold`   | `700` | Strong emphasis, display.              |

**When not to.** Do not use weight to carry state on its own — a bold row and a
regular row differ for a sighted reader scanning and for nobody else. Do not
request a weight the loaded axis does not cover; a browser asked for a weight it
does not have will synthesise one, and a faked bold is visibly not the family's
own. Every axis a rendered role uses must actually be loaded.

## Spacing

Thirteen steps, in `px`.

| Token    | Value   | Token    | Value   |
| -------- | ------- | -------- | ------- |
| `--sp-0` | `0`     | `--sp-7` | `32px`  |
| `--sp-1` | `4px`   | `--sp-8` | `40px`  |
| `--sp-2` | `8px`   | `--sp-9` | `56px`  |
| `--sp-3` | `12px`  | `--sp-10`| `72px`  |
| `--sp-4` | `16px`  | `--sp-11`| `96px`  |
| `--sp-5` | `20px`  | `--sp-12`| `128px` |
| `--sp-6` | `24px`  |          |         |

For `margin`, `padding`, and `gap`. Reach for the nearest step and take it; the
rhythm of the page comes from a small set of repeated distances, and a value
between two steps costs that rhythm to buy a few pixels nobody asked for.

**When not to.** Do not interpolate, and do not `calc()` your way off the scale.
Do not use a spacing step for a structural inset — `--gutter` is the page's
outside inset and exists as its own token for that reason. Do not use spacing
for a border width or an optical offset; those have their own tokens below.

## Radius

| Token           | Value   | Use                                                       |
| --------------- | ------- | --------------------------------------------------------- |
| `--radius-xs`   | `2px`   | Inline code, and the focus ring. Almost square, referencing the monospaced tradition. |
| `--radius-sm`   | `4px`   | Small controls and inputs.                                |
| `--radius-md`   | `6px`   | Buttons, triggers, menu panels, toned rows.               |
| `--radius-lg`   | `10px`  | Cards, modals, tables, tab panels.                        |
| `--radius-xl`   | `14px`  | The widest cornered step, for a large panel where `--radius-lg` reads tight. |
| `--radius-pill` | `999px` | Tags, badges, chips, verification keys.                   |

**When not to.** Do not soften a hairline-bordered surface past the step it
needs; a large radius stops the rule reading as a printed edge, which is the
effect the whole treatment is for. Do not use `--radius-pill` on anything
containing more than a few words — a fixed pill has no width to constrain it, so
a longer label, or a translation of one, wraps to two lines and the shape is
lost. Do not mix two radii on one element's corners.

## Optical

| Token              | Value    | Use                                                     |
| ------------------ | -------- | ------------------------------------------------------- |
| `--badge-cap-rise` | `-0.3em` | Vertical lift for an inline badge beside heading text.  |
| `--badge-cap-gap`  | `0.4em`  | Left margin between the heading word and the badge.     |

Both are `em`-relative, so they track the parent heading's font size rather than
needing a value per step. That is the whole reason they are not spacing tokens.

**When not to.** These are for a badge inside a heading and nothing else. An
inline badge in body text sits on the baseline already and needs neither. Do not
reuse them as a general optical nudge; a one-off alignment problem is usually a
layout problem.

## Motion

| Token          | Value                            | Use                                                     |
| -------------- | -------------------------------- | ------------------------------------------------------- |
| `--dur-fast`   | `140ms`                          | Hovers and small interface shifts.                      |
| `--dur-base`   | `220ms`                          | The default. Fades and panel transitions.               |
| `--dur-slow`   | `380ms`                          | Large reveals, and surfaces entering or leaving the viewport. |
| `--ease-soft`  | `cubic-bezier(0.22,1,0.36,1)`    | Default soft-out easing: fades, hovers, popover drifts. |
| `--ease-crisp` | `cubic-bezier(0.4,0,0.2,1)`      | Sharper standard easing, for mechanical movement.       |

**The house rule is fades**: opacity transitions at `--dur-base` with
`--ease-soft`. Transform motion is permitted **only where a surface enters or
leaves the viewport** — a drawer sliding in, a command palette rising on open —
because that movement tells the reader where the surface came from. It is
prohibited on any surface already on screen: no movement on hover, focus,
selection, or state change. No bounce, spring, scale, or blur in any context.

**Reduced motion is a flat `transition: none` prohibition, not a `0.01ms`
ceiling.** The package reset implements it document-wide. The ceiling is the
common idiom and it is the wrong one here. It exists to keep `transitionend` and
`animationend` firing so that a script waiting on one is not stranded — a real
concern, and not one this system has, since nothing registers either event. What
the ceiling brings instead is a failure mode: it sets duration and iteration
count, which does not stop an animation already running, so a blinking caret or
a pulsing indicator freezes at whatever opacity the frame caught rather than
resting visible.

Two consequences bind anything written against these tokens:

- Anything that genuinely needs the event to fire states its **own** transition
  inside the `prefers-reduced-motion` query, rather than making every element
  pay for it.
- **Nothing may gate an unmount on `transitionend`.** Under the prohibition the
  event never fires and the element is stranded on screen, for exactly the
  readers least able to work around it. Keep the surface mounted and toggle a
  class, or drive removal from state.

**Never transition `visibility` with a duration.** `visibility` is a discrete
property: under a transition it does not interpolate, it flips when the easing
output passes 0.5 — roughly 15ms into a 220ms `--ease-soft` transition, inside
the first frame. Anything that runs on open, `focus()` above all, runs while the
element still computes `visibility: hidden`, and is silently ignored. Use
`visibility 0s linear var(--dur-base)` closing and `visibility 0s linear 0s`
opening.

**When not to.** Do not animate a colour change through a state token; fade
opacity or swap the value. Do not use `--dur-slow` for anything a reader
triggers and waits on.

## Layout

Theme-invariant structural geometry. Takes no theme or mode override.

| Token                   | Value    | Use                                                        |
| ----------------------- | -------- | ---------------------------------------------------------- |
| `--page-w`              | `1180px` | Maximum page width, including any rails.                   |
| `--content-w`           | `760px`  | The content column.                                        |
| `--measure`             | `72ch`   | Prose line-length cap, 72 characters.                      |
| `--gutter`              | `24px`   | Horizontal inset between the content column and the viewport edge at narrow widths. |
| `--sidebar-w`           | `260px`  | Navigation rail width. A default.                          |
| `--topbar-h`            | `56px`   | Fixed top bar height. A default.                           |
| `--table-sticky-offset` | `0px`    | How far below the viewport top a sticky table header parks. A default. |

**`--measure` is `72ch`.** It caps running prose only; the column itself stays
at `--content-w`, so a table, a code block, a diagram, or a transcript can use
the full width while the prose inside it stays readable. This is an
inclusive-design constraint rather than a stylistic preference: long lines cost
re-reading effort for every reader and disproportionately for dyslexic readers.
It is the reason this set ships with the package instead of being left to each
application. Any document stating 68ch is stale — the value was corrected, and
the published system and the accessibility rationale had both specified 72 all
along.

`--content-w` is wider than the 760px a pure reading column would need, so that
full-width content has somewhere to go. Do not narrow it to match `--measure`;
they are two different constraints and collapsing them removes the one that lets
tables breathe.

**Three of these are consumer-overridable defaults, and they are the only
exception to the no-app-declares-a-token rule.** `--sidebar-w`, `--topbar-h`,
and `--table-sticky-offset` describe application chrome, which the package
cannot know. An application with a different rail, a different bar, or fixed
chrome above a table re-declares those values on `:root` and touches nothing
else. `--table-sticky-offset` defaults to `0px` because the package cannot know
whether a consumer has fixed chrome at all; an application with a top bar sets
it to that bar's height, which is usually `--topbar-h`.

`--topbar-h` also sets `scroll-padding-block-start` on the document, in
`styles/reset.css`, so an anchor target or a field reached by Tab scrolls into
view below a pinned bar rather than underneath it with its focus ring hidden
(WCAG 2.4.11). An application with a taller bar gets the right padding by
overriding the token it already overrides for its layout, and needs no rule of
its own.

That is an override of an existing token's value in every palette at once. It is
not licence to introduce a name.

**When not to.** Do not use `--gutter` as a spacing step or a spacing step as
the gutter — it is a structural inset that happens to equal `--sp-6`, and the
two drift the moment either is retuned. Do not override `--page-w`,
`--content-w`, `--measure`, or `--gutter`; those are house reading geometry, and
`--measure` in particular is an accessibility obligation. Where a single surface
needs a sticky header to park somewhere unusual, set the offset on that surface
rather than editing the token.

## Brand

| Token                   | Use                                              |
| ----------------------- | ------------------------------------------------ |
| `--logo-tile-dark-bg`   | Deep plum tile, used when the mark sits on a light canvas. |
| `--logo-tile-dark-ink`  | Cream stroke on the dark tile.                   |
| `--logo-tile-light-bg`  | Parchment tile, used when the mark sits on a dark canvas. |
| `--logo-tile-light-ink` | Primary ink stroke on the light tile.            |

**These four deliberately do not follow the theme.** Unlike every other colour
token in the system they are identical across all eight palettes: the logo tile
has to read as the same mark on any canvas, so it carries its own contrast pair
rather than inheriting the palette. The `dark`/`light` in each name describes the
**tile**, not the mode — the dark tile is the one to use on a light page.

**When not to.** Use these only for the mark. Anything else needing a surface or
an ink colour uses the theme tokens, and a brand value borrowed as a general
plum or a general cream will be wrong in seven palettes out of eight while
looking correct in the one you tested. Do not recolour the mark outside these
four, and do not tint it to match an accent.

## Diagram

| Token             | Use                          |
| ----------------- | ---------------------------- |
| `--diagram-edge`  | Edges, arrows, and connectors in a rendered diagram. |

Per-palette, and per-theme by design: gilt under parchment, the accent under
library and mono, and its own lighter terracotta under sepia. One colour across
all four would put a warm gold arrow on the mono canvas, which is the one
palette defined by having no hue.

A diagram edge is a graphical object rather than text, so the 3:1 non-text
threshold applies rather than 4.5:1, and it is measured on `--bg-surface` — the
ground a diagram is drawn against. Four separate hues, each of which has to stay
visible on its own canvas, is exactly the shape of thing that passes on the
theme it was picked against and fails on one of the other three, which is why
it is on the checked list.

**When not to.** Do not use `--diagram-edge` for a rule, a border, or a text
colour; it is calibrated to a non-text threshold and is not a text-safe value
everywhere. Do not substitute `--rule` for a diagram edge — a hairline
calibrated for a 1px divider disappears as an arrow. Where a diagram renderer
does colour arithmetic on the values it is handed rather than accepting OKLCH,
the projection to another notation belongs in the package, not at the use site.

---

## Adding a token

A new design need is a **new token in `tokens/source`**, added to this package
by proposal and released. It is never a literal in an application, and never a
custom property declared in an application's own stylesheet.

1. Search this document end to end and confirm nothing already covers the need.
   Almost always something does; the groups above overlap deliberately at the
   edges, and the closest existing token is usually correct.
2. Write a proposal: the name, the value in each of the eight palettes, when to
   use it, when **not** to, and which existing tokens you considered and
   rejected. If it is a scale token, say why the existing steps do not reach it.
3. Wait for approval. This is not a formality — most design-system damage
   arrives as a small fix that improvised one value.
4. Add it to `tokens/source/*.json` with a `$description` carrying any usage
   constraint, and regenerate with `pnpm build:tokens`. Never edit
   `tokens/generated/tokens.css` by hand: it is generated, `pnpm check:generated`
   fails on any hand edit, and all eight palettes including both dark variants
   are emitted from the source, so there is no set of blocks to keep in step
   manually.
5. Run the guards. `pnpm check:contrast` measures the palettes,
   `pnpm check:appearance` covers the mode-resolution rule, and
   `pnpm exec ekdotico-check discipline` audits a consuming repository for
   literals, `var()` fallbacks, and local reimplementation.
6. Release the package and raise the pin in each consumer. The token does not
   exist for an application until its pin moves.
7. Document it here, in the group it belongs to, with both the when-to-use and
   the when-not-to-use note.

Step 6 is why this is slower than editing a local file, and the slowness is the
point: the same token then reaches every surface that wears the house style,
rather than one of them growing a value the others do not have.

If a change cannot be made with the tokens that exist, stop. Name the closest
existing token and recommend exactly one of — extend an existing pattern,
reimplement with a different documented one, or propose the token as above. Then
wait.
