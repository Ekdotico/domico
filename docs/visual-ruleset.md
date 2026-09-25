# Staying true to Domico — the eighteen rules

The house style, as rules rather than as prose. Every rule here was established
by a defect that reached real code, and most are now enforced by a guard you can
run. Where a guard exists it is named, because a rule with a guard needs no
argument and a rule without one needs a reader who understands why.

Companion documents, both shipped in this package:

- [`AGENTS.md`](../AGENTS.md) — the short form, for an agent about to make an edit
- [`docs/design-tokens.md`](./design-tokens.md) — the token catalogue

## How to read this document

**The rules are timeless. The state is dated, and lives in one section at the
end.**

That separation is deliberate and it is the correction of a real failure. The
first version of this ruleset interleaved the two — each rule carried the file
and line of the violation that motivated it, in the present tense. Within a day
of publication seventeen of its twenty factual claims were stale, because the
estate fixed them. A document that reports state inside its rules obliges a
reader to re-verify every rule before trusting any of it, which is the same as
having no document.

So: a rule states what must hold and why the requirement exists. If a rule cites
an incident, the incident is provenance, not a bug report. Anything that is true
only today is in [Current state](#current-state), with a date on it.

---

## 1 · Tokens

Four themes, two modes, eight palettes. Values live in exactly one place —
`tokens/generated/tokens.css`, generated from `tokens/source/*.json`.

### Rule 1 — A new design need is a new token, never a literal

Colour, type, spacing, radius, shadow, and motion come from custom properties. A
literal in an application stylesheet forks the design system; a token added to
`tokens/source` resolves in all eight palettes at once.

A literal `px` font size is a defect on its own terms, independent of the
system: the scale is `rem` so that a reader who raised their browser font size
scales the whole interface with it.

*Enforced by* `ekdotico-check discipline`, which reads the token stylesheet to
decide what counts as a literal, so the guard cannot fall behind the scale.

### Rule 2 — Never write a fallback value into `var()`

`var(--sp-12, 4rem)` is a second source of truth with nothing keeping it honest.

Why it is worse than it looks, because the obvious reading is the wrong one:
`var()` reaches its fallback **only when the custom property is unset**, and the
token layer sets all of them. So a stale fallback was never rendering. Verified
by computing values in a running build, where `var(--sp-12, 4rem)` resolved to
`128px` and not `64px`; stripping the fallbacks moved nothing on screen.

That makes it worse, not milder. A wrong value that renders gets found. A wrong
value that *cannot* render sits in the stylesheet where no pixel is able to
contradict it, waiting to become true the day a token is renamed.

One precision, because the rule reads more strictly than it means. Token
definitions themselves carry full font stacks, and that is correct: the stack
belongs in the token, authored once. The prohibition is on a *consumer*
restating a value `var()` already knows.

*Enforced by* `ekdotico-check discipline`, which flags a fallback only when the
property is one this system defines.

### Rule 3 — Auto is the absence of `data-mode`, not a value of it

This is a mechanism, not a convention. `:not([data-mode])` is what arms the
`prefers-color-scheme` block, and what stops a dark operating system from
overriding an explicit Light choice. Writing `data-mode="auto"` breaks both
directions at once.

The explicit-dark and automatic-dark blocks are duplicated, because CSS cannot
alias an attribute selector to a media-query selector. **They are generated from
one source and are not hand-maintained.** Do not edit the generated stylesheet
to keep them in step; edit the source and rebuild.

*Enforced by* `check:generated`, which byte-compares the generated output
against a fresh build and so rejects any hand edit, and `check:appearance` over
the resolution rule itself.

---

## 2 · Typography

Three faces, three fixed roles, never mixed. Serif reads. Sans labels. Mono
identifies.

### Rule 4 — Greek glyphs never come from `--font-serif`

Crimson Pro publishes no Greek subset. It is a limitation of the face and not a
subsetting choice: a single font build emits six Crimson Pro faces — normal and
italic across latin, latin-ext, and vietnamese — and not one covers
`U+0370–03FF`, while Commissioner and Fira Code each got a Greek face from the
same tool in the same build.

The failure is silent. No error and no warning: Greek set in the serif falls
through to whatever the operating system substitutes, which is a different face
on macOS, Windows, and Linux. The word carrying the brand's own name is exactly
the word most likely to be affected.

Use `--font-sans`. This is a stated exception to the role rule, for glyphs the
serif cannot set at all, and it is not licence to mix roles elsewhere.

**A standalone asset is a second exception, in the other direction.** An SVG that
ships as a file has no cascade to read a custom property from, so naming a family
literally is the only thing that can work there. That is correct in a shipped
asset and nowhere else.

But prefer not to need the exception at all: **a mark whose letterforms depend on
a webfont resolving is not a mark.** Outline the glyphs to paths. There is one
logo and it is the hand-drawn mark, which is paths throughout; a Greek wordmark
that set its name in live `<text>` was deleted rather than finished, because what
it drew depended on the context it was placed in.

*Enforced by* `ekdotico-check discipline`, which fails on Greek codepoints in a
rule that resolves to `--font-serif`, and by the ruleset's own build, which fails
if a Crimson Pro face ever gains Greek coverage — because then this rule would
need rewriting rather than quietly contradicting.

### Rule 5 — Load the italic subset, or lose it silently

The package sets `font-style: italic` on `.lede` and on the selected theme's
name. A build that omits the italic axis renders those as browser-synthesised
oblique — a mechanical shear, visibly worse, and exactly the failure where an
individually tuned set stops reading as a set.

**Take the axis list from `fontConfig` in `@ekdotico/domico/fonts`, but expect to
restate it, because `next/font` will not accept anything else.** It is a
compile-time SWC transform that reads its argument out of the source, so
`Crimson_Pro(fontConfig.serif)` fails the build with "Font loader values must be
explicitly written literals" and spreading it fails with "Unexpected spread".
Both were tried. A written literal is the only argument the API accepts.

Since the restatement cannot be removed, guard it instead of conventionalising
it: a test that reads the layout source and fails if any option `fontConfig`
declares is missing from the call that should carry it, deriving both the option
set and the export name from the package so a new axis is covered the day it
lands.

*Enforced by* a consumer-side test. The package supplies `fontConfig`; it cannot
see how an application calls it.

---

## 3 · The appearance control

### Rule 6 — One trigger, top right, disclosing the full optionset

`AppearanceMenu` from `@ekdotico/domico/theme`, with
`@ekdotico/domico/styles/appearance.css`. A 36×36 trigger, and a panel holding
the label with the mode pill on one row and the four theme swatches below.

The requirement decides the ARIA pattern. A reader picks a theme by comparing it
against real content, so the surface must stay visible while choosing. That
makes it a **disclosure plus a non-modal popover** wrapping two existing
radiogroups — not a menu, because a menu closes on activation and would force a
re-open per comparison; and not a dialog, because focus-trapping a preference
with no confirm step hides the page the swatches are meant to preview.

Accordingly it takes no `aria-modal` and no focus trap. **The inverse rule holds
for anything that does claim `aria-modal="true"`: it owes a Tab cycle and an
inert background, both of them, every time.** Claiming the role without keeping
its promise is worse than not claiming it. Where an inert background is
genuinely wrong — a drawer nested inside the region the inert helper would
inert — decline it explicitly and record why, rather than leaving the absence to
look like an oversight. `useModalSurface` from `@ekdotico/domico/a11y` keeps the
whole promise, and its `inertOutside` spares the surface's own ancestors, which is
the usual reason an inert background looked wrong.

The same subpath carries `isShortcut` and `shortcutLabel`, for a
chord that means one thing per platform: ⌘ on Apple, Ctrl elsewhere, never both,
because Ctrl+K is an editing key in a macOS text field.

An application supplies placement and nothing else. Do not pass `label` or
`triggerLabel`, do not wrap it, and never render two instances on one page: two
elements would claim the same accessible name.

*Enforced by* `check:appearance` and `check:exports`.

### Rule 7 — Swatches carry both candidates; CSS picks

Only one `[data-theme]` is live at a time, so an inactive theme's canvas cannot
be read from computed CSS — and asking a hook would ask what no server can
answer, because Auto defers to a preference that never leaves the reader's
machine. Each swatch is therefore handed both its light and dark value and the
stylesheet resolves at paint.

`aria-hidden` on the swatch is correct rather than an oversight: it is
decorative, and the button takes its accessible name from the sibling label, so
colour is never the sole carrier of the choice.

*Enforced by* `check:appearance`.

---

## 4 · Components

Ten components ship in this package, each with its own stylesheet **export
entry** — `styles/badge.css`, `callout.css`, `figure.css`, `keyvalue.css`,
`logo.css`, `primitives.css`, `section-rule.css`, `stat.css`, `table.css`,
`tabs.css`. They are build outputs sliced from one source stylesheet; there is no
per-component source file, so do not cite one.

Two more components need no entry of their own. `SkipLink` is styled by the
reset's `.skip-link`, which every application takes, and `StickyTableHead` — the
viewport mirror of a table header at narrow widths — by `table.css`, beside the
table it mirrors.

### Rule 8 — A component used twice comes from the package

The split above is why this is possible rather than aspirational. Components
hardcode unprefixed global class names, which a CSS Module cannot own, so an
application that forbids a global component layer could once import nothing at
all. Shipping one stylesheet per component means an application imports only the
CSS for what it renders — the same factoring this package had already performed
twice, for `reset.css` at 0.7.0 and `appearance.css` at 0.8.0.

An import arrives with the first requirement that needs it. Shipping ten entries
is not licence to import ten.

*Enforced by* `ekdotico-check discipline`, which fails on a local
reimplementation of anything this package exports, deriving the export list from
the package barrels rather than from a hardcoded list.

### Rule 9 — Never fork a projection of the palette

The dangerous fork is not a rogue colour in a component. It is a second copy of
the whole palette projected into another format — a diagram theme, a chart
config, an email template — because it looks like configuration rather than like
design.

Such a fork is recognisable by its own diff: 202 of 216 values identical and 14
drifted is the signature of a copy that has diverged, not of an independent
design. The token pipeline generates these projections for exactly this reason;
`@ekdotico/domico/mermaid` is one, and its build fails if any colour drifts more
than 0.6 in lightness or chroma through the `oklch → hex → oklch` round trip.

When a fork turns out to be *better* than the package, promote it rather than
reverting it. Per-theme diagram edge colours were adopted that way, into
`tokens/source` as `--diagram-edge`, and are now measured by the contrast guard
at the 3:1 non-text threshold. Either way the local map is deleted and the import
taken.

And verify a swap of this kind **against painted pixels, not serialised
markup**. Emitted SVG retains presentation attributes that a stylesheet
overrides and that never render, so grepping the output finds fills and strokes
that are not on screen. Reading `fill`, `stroke`, and `color` back from the DOM
is the check that means something.

*Enforced by* `check:generated` and `ekdotico-check discipline`.

---

## 5 · Motion

### Rule 10 — Fades, at `--dur-base` with `--ease-soft`

Transform is permitted only where a surface enters or leaves the viewport — a
drawer sliding, a popover rising. It is prohibited on anything already on
screen: hover, focus, and state changes fade, they do not move.

No bounce, no spring, no elastic. Press should feel like paper pressing on a
soft surface, not a button bouncing. Timing lives in `--dur-fast` (140ms),
`--dur-base` (220ms), and `--dur-slow`, never as a literal — and a literal that
numerically equals a token today is not exempt, because it forks the moment
either moves.

*Enforced by* `ekdotico-check discipline`, which treats a duration and an easing
as design values and so fails on a literal one, and by `check:ruleset`, which
rejects a `cubic-bezier` with a control point outside `[0,1]` on the y axis.

### Rule 11 — Reduced motion is a flat prohibition, and nothing may wait on `transitionend`

The idiom is a `0.01ms` duration ceiling. It is wrong here, and this rule was
established by discovering that the written brief and the shipped code disagreed
and **the code was right**.

The ceiling exists to keep `transitionend` and `animationend` firing so a script
waiting on one is not stranded. What it brings instead is a failure mode: it sets
duration and iteration count, which does not stop an animation already running,
so a blinking caret or a pulsing indicator freezes at whatever opacity the frame
caught it instead of resting visible. The package therefore ships a universal
`animation: none !important; transition: none !important`.

The stated rationale for the ceiling was checked and did not hold: zero
`transitionend` or `animationend` listeners existed across the whole estate.
Anything that genuinely needs the event states its own transition inside the
query, rather than making every element pay for it.

Be precise about what a surviving ceiling is, because "two rules fighting" and
"one rule that never applied" call for different fixes. A `0.01ms` block
overrides `transition-duration` only, while the flat prohibition's shorthand
also sets `transition-property: none`. Nothing overrode that, so nothing
transitioned regardless of the duration the ceiling specified: it was dead code,
not a competing philosophy.

**Never gate an unmount on `transitionend`.** Under a flat prohibition the event
never fires, so the component hangs on screen permanently — for exactly the
readers least able to work around it. Keep the surface mounted and toggle a
class.

*Enforced by* `check:styles`, which rejects a `0.01ms` ceiling anywhere in the
shipped stylesheets — stripping comments first, so the long note in `reset.css`
explaining why the ceiling is wrong is not mistaken for the ceiling itself — and by
`check:ruleset`, which additionally requires the flat prohibition to be present.

### Rule 12 — Never transition `visibility` with a duration

This one was found by shipping it. The appearance panel is specified to focus the
reader's current theme when it opens. The effect and the selector were both
correct and it did not work — focus stayed on the trigger.

`visibility` is a **discrete** property. Under a transition it does not
interpolate: it flips when the easing output passes 0.5, which with `--ease-soft`
is roughly 15ms into a 220ms transition. That is inside the first frame, so the
effect ran while the panel still computed `visibility: hidden`, and `focus()` on
a hidden element is silently ignored. No error, no warning, and nothing in the
source that reads as wrong.

A duration on `visibility` also truncates the closing fade, so both halves need
stating:

```css
/* closing — hold visible through the fade */
transition: opacity var(--dur-base) var(--ease-soft), visibility 0s linear var(--dur-base);
/* opening — visible in the same frame, so the surface is focusable at once */
transition: opacity var(--dur-base) var(--ease-soft), visibility 0s linear 0s;
```

*Enforced by* `check:appearance`, which asserts that every transition mentioning
`visibility` specifies `visibility 0s`. The assertion was mutation-tested by
reintroducing the duration and confirming it fails.

---

## 6 · Prohibitions

These are the ones with teeth, because each has been violated at least once.

### Rule 13 — No coloured edge stripe, by any mechanism

**The rule is the pattern, not the property.** A 3px tinted `::before` evades the
letter of a ban written about `border-left` while being precisely what the ban
exists to prevent — and the component library itself was the offender, which is
how the rule came to be written this way.

A card that needs to signal tone gets a full hairline and a background wash; it
already carries a title and a role. A bare `blockquote` rule with no card
surface is typographic convention rather than decoration and is permitted — but
if that exception is house style, it belongs in writing with its ceiling named.
An unwritten exception is how a ban erodes.

*Enforced by* `check:styles`, in this package and — given a directory — in a
consuming repository, and the adjective is the test: it fails on an inline
border above 1px unless the colour comes from the rule scale. A thick border in
`--rule` is an outline, which the table component draws cell by cell because a
table cannot take a border with rounded corners cleanly; a thick border in an
accent or a state tint is the stripe. `check:ruleset` holds the ruleset document
itself to the stricter form, failing on any `border-inline-start` above 1px.

The blockquote exception above is now the guard's exception too, with its
ceiling stated where the code can hold it: a rule whose selector names
`blockquote` and which declares no `background`, `box-shadow`, or
`border-radius` is bare, and is permitted. Any of those three makes it a card,
and a card signalling tone with a coloured edge is the banned pattern whatever
the selector is called.

### Rule 14 — Contrast is owed by all eight palettes, not the default one

A check that samples the default theme, or only the light modes, will report one
failure where three exist.

Two traps that a naive check misses entirely:

**Tokens whose only current use is non-text.** A muted foreground can sit below
4.5:1 against a surface and not be a violation, because its one use is an icon
where the 3:1 threshold applies. It becomes a violation the first time someone
reads it as a muted *text* colour. Either raise it or mark it icon-only where it
is defined; leaving the constraint unrecorded is the defect.

**Opacity-derived colours, which sit outside a token checker altogether.** This
is where real failures live. Compositing an ink colour onto a saturated accent at
reduced opacity fails in every palette at once. The fix is not a tuned opacity —
it is no opacity. Differentiate text by size and weight, never by transparency on
a saturated field.

**And colour is never the only cue (WCAG 1.4.1).** A link in running prose
inherits its paragraph's colour, so contrast cannot identify it and something
else must. The reset draws every unclassed anchor underlined — `a:where(:not([class]))`,
at the specificity of a bare `a` — and leaves a classed one undecorated, on the
reading that a class means chrome whose position already says "link". An
application that gives a prose link a class takes the underline over with it.

*Enforced by* `check:contrast`, across all eight palettes, at 4.5:1 for text and
3:1 for non-text. The underline is carried by `styles/reset.css` rather than
checked: a guard cannot tell prose from chrome.

### Rule 15 — Documentation that contradicts the code is a defect with a severity

It ranks above a wrong colour. Enforcement hooks feed these files to agents on
every edit, so a stale document does not merely mislead a reader — **it
instructs a machine to reintroduce the fault it describes.** The most likely
"corrective" action becomes undoing the correct architecture.

The failure mode is specific and it has happened: every application in this
estate migrated onto this package, and not one updated its own written account of
it. Documents then pointed Rule 1 at a deleted stylesheet, cited a guard file
that had never existed, stated a token value that had changed, and described a
switcher as absent from a site that had rendered one since it landed.

Three obligations:

- When you change behaviour a document describes, change the document in the
  same commit. Not afterwards.
- **Do not restate this package's rules or its token catalogue inside a consuming
  repository.** Point at the copy in `node_modules`, which travels with the
  version it describes. A local copy is a snapshot, and a snapshot is the defect.
- When a local document disagrees with the package's, the package is newer and
  the code is the authority. Report the contradiction rather than acting on the
  local document.

*Enforced by* `ekdotico-check discipline`, which fails a consuming repository that
declares a local token catalogue authoritative.

### Rule 16 — A version you cannot read is a version you cannot adopt

A consumer cannot judge a bump it cannot inspect, which is the whole argument
against taking one. Every release carries a changeset, a changelog entry, and a
tag.

**Pin exactly.** A caret range on a design system is a latent fork that arms
itself the day the next minor publishes: an unreviewed visual change reaches the
application through a routine install, bypassing the four-theme review gate. An
upgrade is a deliberate act, reviewed across four themes in both modes.

*Enforced by* changesets and tags in this repository. **Not** enforced in
consumers — a caret in an application's manifest is caught by review only.

### Rule 17 — Case is authored, never applied

`text-transform` is the one design property that overwrites copy. Every other
declaration changes how a string looks; this one changes what it says.

The Expression Guidelines require sentence case for every label, heading, and
piece of interface copy. Section 4 states that rule as universal — "regardless
of register", "any copy submitted for Ekdotico, in any context" — and gives
`"PROVENANCE RECORD"` as its counter-example. A stylesheet that applies
`uppercase` produces exactly that counter-example from a string that was
authored correctly.

**The reason this is a rule and not a preference is where it hides.** The copy
linter reads authored strings out of source; it is handed `Theme`, and it passes,
correctly. The style guards read stylesheets; they see a declaration and have no
string to compare it against. Nothing joined the two, so the defect sat in the
gap between the two halves of the estate's own enforcement — which is how it came
to ship in seven declarations across three stylesheets, render on all three
surfaces, and survive every guard in the suite for fourteen minor versions. The
document you are reading set three of its own labels the same way while stating
the rule that forbids it.

All three values are refused, not only `uppercase`. `lowercase` erases a proper
noun, and `capitalize` forces title case onto a label the guidelines require in
sentence case. The property has no compliant value in this system.

A label does not need case to read as a label. It is already carried four ways —
`--fs-3xs` or `--fs-xs`, a heavier weight, `--tr-label` tracking, and a receding
`--fg-3` or `--fg-4` against body copy set in the serif. Case was the fifth
signal on a label that was not struggling.

**Small caps are not the alternative.** They preserve the authored casing and
would satisfy the guidelines, but no house family ships the glyphs — Commissioner,
Crimson Pro, and Fira Code all lack `smcp` and `c2sc` — so the browser scales
capitals instead, which is rule 5's failure in a second costume. `.smallcaps`
remains in `styles/type.css` as a correct instruction that renders properly the
day `--font-sans` carries the feature, and it says so where it is defined.
Reaching for it in the meantime trades a copy defect for a typographic one.

*Enforced by* `check:styles`, which fails on the property in any shipped
stylesheet **and, given a directory, in a consuming repository's own** —
`pnpm exec ekdotico-check styles .` — and by `check:ruleset`, which holds this
document's own stylesheet to the same prohibition. All three assertions were
mutation-tested by reintroducing the declaration and confirming the failure.

The consumer half was added after the package cleaned itself here and every
consumer went on shipping the declaration. The guard read `dist/styles`
whatever directory it was invoked from, so an application running it got a pass
about somebody else's CSS: thirty-five declarations survived that way across
two applications, rendering "PRE-LAUNCH", "ACCESS CODE" and "THE PLATFORM" from
strings that were authored correctly. The gap this rule describes — a copy
linter that never opens a stylesheet, a style guard with no string to compare
against — had a second instance one level up, across the package boundary, and
closing the first did not close the second.

---

## 7 · Diagrams

### Rule 18 — A diagram is an image, and an image owes a text alternative

`role="img"` prunes the element's entire subtree from the accessibility tree.
Every shape, label, and edge inside a rendered diagram becomes unreachable. The
role is correct for a diagram: the pruning is the defined behaviour of the role
and not a defect to route around.

What follows is the part that surprises. **The text alternative cannot live
inside the SVG on a page that wraps it in `role="img"`.** It belongs on the
wrapper's own elements, through `aria-label` and `aria-describedby`.

Mermaid publishes directives for exactly this — `accTitle:` for the short
accessible name, `accDescr:` or `accDescr { … }` for the long description. Take
the directives Mermaid already defines rather than inventing a prop, and a fence
carrying them stays valid Mermaid wherever it is pasted.

The rule was established by a documentation site on which every Mermaid diagram
reached a screen reader as the single word `Diagram`. Twelve diagrams across
five pages, twelve failures of WCAG 1.1.1. The wrapper carried `role="img"`, and
its `aria-label` fell back to the literal string `Diagram` because no call site
passed a title.

**The same element also carried `tabIndex`, and that is a second failure with
its own cause.** An element never takes both a non-operable role and `tabIndex`:
a keyboard reader is handed focus on something announced as a static image, with
nothing stating what the arrow keys do (WCAG 4.1.2). The shape that works is two
elements — an operable `role="group"` pan surface wrapping a `role="img"` stage.

Three thresholds, because a text alternative that exists is not yet one that
conveys anything: `accTitle` present and non-empty, `accDescr` present, and
`accDescr` at least 60 characters. The floor exists so the gate cannot be
satisfied with "A diagram." It was set against real content whose shortest
legitimate description ran to 572 characters, so the margin is wide and what it
catches is a placeholder rather than a terse description.

A downloaded diagram is the same obligation reached by a different route. A file
has no wrapper to carry the name, so it carries its own `<title>` and `<desc>`;
`annotateSvg` from `@ekdotico/domico/svg` writes them, and sets `role="img"`
only when there is a title to name the image with.

*Enforced by* `ekdotico-check a11y`, which reads the directives out of the fence
and additionally rejects any element carrying a non-operable role together with
`tabIndex`.

The same guard carries the other interaction failures this estate has shipped,
each read from source: a removed outline that nothing puts back *as an outline*
— a box-shadow ring or a tint is repainted away under forced colours, so
`outline: 2px solid transparent` goes beside one — an icon-only button with no
name, a tab stop with no role or name, placeholder text in `--fg-4` or `--fg-5`,
a form control bordered with a hairline, a link or a button inside
`role="tooltip"`, and a `role="menu"` with no arrow-key handling in its file.

---

## Current state

**Dated 2026-08-27, against `@ekdotico/domico@0.15.0`.** Everything above is a
rule; everything here is a fact with a shelf life. Paths are relative to the
estate root, one level above this package, since the findings concern sibling
repositories.

One finding survives, re-verified at this version rather than carried forward on
trust.

| # | Finding | Rule | Where |
| --- | --- | --- | --- |
| 1 | The Latin wordmark sets one node in live `<text>` rather than outlined paths | 4 | `domico/assets/logo/logo-wordmark.svg` |

It is what remains of a pair. The Greek wordmark had the same fault and was deleted
rather than outlined: there is one logo, the hand-drawn mark, and it is paths
throughout. The Latin wordmark is kept for now and carries the defect, so anything
that places it depends on a webfont resolving in that context.

**What 0.15.0 closed.** Ten declarations applied `text-transform: uppercase` to
label roles — seven in the shipped stylesheets, three in this document's own —
which the Expression Guidelines forbid in §4.1 and which no guard in the suite
could see. All ten are gone, rule 17 states the prohibition, and two guards now
assert it. The defect was reported from `praktico` as a rule 4 item rather than
worked around locally, which is the route that rule exists to produce.

### What the previous edition listed, and why it is gone

This section is now on its second correction in a day, which is the strongest
argument available for keeping state out of the rules.

The first edition made twenty factual claims interleaved with its rules;
re-verification found seventeen already fixed. This edition reduced those to three
findings — and two of the three were closed within hours of being written, by the
same work that shipped the document:

- `docs` and `deree` carried `^0.11.0` while only `praktico` pinned exactly. All
  three now pin `0.12.1`, and `save-exact=true` is in each `.npmrc` so the caret
  cannot return through a `pnpm add`.
- One consuming repository declared its own local token catalogue authoritative.
  Both local catalogues are deleted, every instruction file points at
  `node_modules`, and `docfork` now fails a repository that reintroduces one.

A third defect was found in the same pass and fixed rather than recorded: both
applications' PreToolUse hooks still injected the deleted local path into an agent
on every styling edit. The guard could not see it, because it walked only
markdown. It now reads hooks too, under the opposite rule — a document naming a
deleted file is usually history, but a hook naming one is an instruction being
given now, so there the reference is a defect whether the file exists or not.

## Provenance

Compiled against `@ekdotico/domico@0.12.1` as consumed by `docs`, `deree`, and
`internal/praktico`. Every colour, size, and duration named here is the token
value it names. Contrast figures are measured, not asserted. Where a rule cites a
mechanism, the mechanism was verified in a running build rather than reasoned
about — the `var()` fallback finding, the `visibility` discrete-property finding,
and the painted-pixel diagram check were each established that way, and each
contradicted the reading that source code alone supported.

Each guard named above was checked against what it actually asserts, not against
its name. Three rules cited `check:styles` for properties it never examined; the
assertions were added to the script rather than removed from the rules, and both
were mutation-tested.

The visual edition of this document is built by `ruleset/build.mjs` and checked
against its own rules by `ruleset/verify.mjs`.
