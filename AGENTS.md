# Domico — instructions for an agent working in a consuming repository

This file ships inside `@ekdotico/domico`. If you are an AI agent editing a
repository that depends on this package, these are the rules that govern
anything you write which renders — every `.css`, `.module.css`, `.tsx`, and
every SVG or font decision.

Read it before your first styling edit, not after.

From a consuming repository this file is at:

```
node_modules/@ekdotico/domico/AGENTS.md
```

and the two documents it sends you to are:

```
node_modules/@ekdotico/domico/docs/design-tokens.md    the token catalogue
node_modules/@ekdotico/domico/docs/visual-ruleset.md   the eighteen rules, with the failures behind them
```

**Read the copy in `node_modules`, never a copy in the repository you are
editing.** If the repository has its own token catalogue or its own restatement
of these rules, that file is a fork and it is wrong to trust it — see rule 15
below, which exists because this exact thing happened in three repositories at
once.

## Why this ships in the package rather than in each repository

Because every previous arrangement drifted. Three applications migrated onto
this package; not one updated its own written account of the design system
afterwards. The written accounts then told agents to read deleted files, cite
guards that never existed, and default to the architecture that had just been
replaced. The most likely "corrective" action an agent could take was to undo
the correct code.

A document that travels with the version of the package it describes cannot
drift from it. That is the whole design. It is also why you must not copy this
file into the repository you are working on: a copy is a snapshot, and a
snapshot is the defect.

## The four hard rules

**1 — Read the catalogue before writing a style.** `docs/design-tokens.md` is
the authoritative list of every custom property that exists, with when-to-use
and when-not-to-use notes. Values live in `@ekdotico/domico/tokens.css`,
imported once per application.

**2 — Tokens only, for every design property.** Colour, type, spacing, radius,
shadow, and motion come from custom properties. Never a literal.

```css
/* wrong */                      /* right */
color: #5a4a7a;                  color: var(--accent);
border-radius: 10px;             border-radius: var(--radius-lg);
font-size: 15px;                 font-size: var(--fs-base);
transition: 140ms ease;          transition: var(--dur-fast) var(--ease-crisp);
```

A `px` font size is a defect on its own terms: the scale is `rem` so that a
reader who raised their browser font size scales the whole interface with it.

Type that grows with the viewport takes a fluid token: `--fs-display` for a
page's display heading (a marketing hero's title) and `--fs-lede` for the
paragraph under it, and `--fs-title` for a site's name on its title page.
Never write a `clamp()` for a font size in an application. A size the three do
not cover is a new fluid token, proposed under rule 4.

**3 — Never declare a token in an application.** A custom property defined in
an app stylesheet shadows the package in one theme and not the others, so it
resolves correctly in the palette you tested and silently wrongly in the other
seven. There are eight. The one exception is the three chrome dimensions,
`--sidebar-w`, `--topbar-h` and `--table-sticky-offset`, which an application
re-declares on `:root` and nothing else (see the catalogue). A property the
package documents as an optional hook, which no palette defines and which has
no value to shadow, is set as the README says: `--ekd-editor-placeholder-offset`
on the editor, for a prompt that starts after a control.

**4 — Stop and recommend; do not improvise.** If a change cannot be made with
the tokens that exist: stop, name the closest existing token, and recommend
exactly one of — extend an existing pattern, reimplement with a different
documented one, or add a token with a one-paragraph proposal (name, value in all
eight palettes, when to use, when not to, tokens considered). **Then wait.** A
token is added to this package, by proposal, and released before an application
can consume it. That is slower on purpose. Most design-system damage arrives as
a small fix that improvised one value.

## The ten things an agent breaks first

Each of these has been broken at least once, in real code, by someone who had
read the rules. They are listed because knowing the rule has not been enough.

**Auto is the absence of `data-mode`, not a value of it.** `:not([data-mode])`
is what arms the `prefers-color-scheme` block, and what stops a dark operating
system from overriding an explicit Light choice. Writing `data-mode="auto"`
breaks both directions at once.

**Never write a fallback into `var()`.** `var(--sp-12, 4rem)` is a second source
of truth with nothing keeping it honest, and it is worse than it looks: `var()`
reaches its fallback only when the property is **unset**, and the token layer
sets all of them. So a stale fallback never renders — it is a false statement
about the design system that no pixel is able to contradict, waiting to become
true the day a token is renamed. Reference the token alone. Font stacks belong
in the token definition, where they are authored once.

**Greek glyphs never come from `--font-serif`.** Crimson Pro publishes no Greek
subset, so Greek set in the serif does not fail loudly — it falls through to
whatever the operating system substitutes, which is a different face on macOS,
Windows, and Linux. Use `--font-sans`; Commissioner ships Greek, as does Fira
Code. This binds Greek in prose, in headings, and in any product-name
derivation. It is not licence to mix roles elsewhere.

**Reduced motion is a flat `transition: none` prohibition, not a `0.01ms`
duration ceiling.** The ceiling is the common idiom and it is wrong here: it
sets how long a transition takes but does not stop an animation already running,
so a blinking caret freezes at whatever opacity the frame caught. **Nothing may
gate an unmount on `transitionend`** — under the prohibition it never fires, so
the element is stranded on screen, for exactly the readers least able to work
around it. Keep the surface mounted and toggle a class.

**Never transition `visibility` with a duration.** `visibility` is a discrete
property: under a transition it does not interpolate, it flips when the easing
output passes 0.5 — roughly 15ms into a 220ms `--ease-soft` transition, inside
the first frame. Anything that runs on open, `focus()` above all, runs while the
element still computes `visibility: hidden`, and is silently ignored. Use
`visibility 0s linear var(--dur-base)` closing and `visibility 0s linear 0s`
opening.

**No coloured edge stripe, by any mechanism.** The prohibition is on the
pattern, not on the property: a 3px tinted `::before` evades the letter of a ban
written about `border-left` while being precisely what the ban exists to
prevent. A card that needs to signal tone gets a full hairline and a background
wash.

**Contrast is owed by all eight palettes, not the default one.** A check that
samples the default theme, or only the light modes, will report one failure
where three exist. And never differentiate text by transparency on a saturated
field — composite an opacity onto an accent and it fails in every palette at
once. Differentiate by size and weight.

**Case is authored, never applied.** `text-transform` is the one design property
that overwrites copy: it changes what the string says, not merely how it looks,
and it does so in a layer no copy guard reads. The Expression Guidelines require
sentence case for every label and heading, universally, and give `"PROVENANCE
RECORD"` as the counter-example — which is precisely what `uppercase` produces
from a correctly authored string. All three values are refused; the property has
no compliant value here. A label is already carried by size, weight, tracking,
and a receding foreground. Small caps are not the escape route: no house family
ships `smcp`, so the browser scales capitals and you have traded a copy defect
for rule 5's typographic one.

**A component used twice comes from the package.** Every shared component with
styles of its own ships a stylesheet entry, so an application imports only the
CSS for what it renders, and two more ride on entries it already takes:
`SkipLink` on the reset, `StickyTableHead` on the table. Reimplementing one
locally is a defect, not a shortcut — and that includes the appearance control,
which is one shared component and not three, and the skip link, which the three
applications once wrote three different ways. It includes the chrome, too: the
passcode page is `AccessGate`, the mobile drawer `NavDrawer`, the heading rail
`OnThisPage`, and the intro `OpeningSequence`. Each takes its copy from you and
imports no router, so pass the route as `closeKey` or `rescanKey` rather than
writing a wrapper that reads it. `ekdotico-check discipline` reports a local
copy under the name it had before, not only under the package's.

**`role="img"` prunes everything inside it from the accessibility tree.** A
diagram wrapped in that role reaches a screen reader as its `aria-label` and
nothing else — twelve diagrams across five pages once arrived as the single word
`Diagram`, because no call site passed a title. Put the text alternative on the
wrapper, through `aria-label` and `aria-describedby`, and author it in the fence
with Mermaid's own `accTitle:` and `accDescr:` so it travels with the diagram.
Never put `tabIndex` on a non-operable role: keep the pan surface a
`role="group"` wrapping the `role="img"` stage.

## The appearance control

One trigger, top right, disclosing the full optionset: `AppearanceMenu` from
`@ekdotico/domico/theme`, with `@ekdotico/domico/styles/appearance.css`.

It is a **disclosure**, not a menu and not a dialog. A reader picks a theme by
comparing it against the page, so the panel stays open through every activation
and never seals the page off behind a focus trap. Accordingly it takes no
`aria-modal` and no focus trap. The inverse holds for anything that *does*
claim `aria-modal="true"`: it owes a Tab cycle and an inert background, both,
every time. Claiming the role without keeping its promise is worse than not
claiming it. `useModalSurface` from `@ekdotico/domico/a11y` keeps both, with
Escape and the focus return, so a modal surface does not need its own.

Do not pass `label` or `triggerLabel`, and do not wrap it — an application
supplies placement and nothing else. Two instances on one page means two
elements claiming the same accessible name.

## Rule 15, stated plainly, because it is the one that compounds

**Documentation that contradicts the code is a defect with a severity.** It
ranks above a wrong colour, because enforcement hooks feed these files to agents
on every edit, so a stale document does not merely mislead a reader — it
instructs a machine to reintroduce the fault.

Two obligations follow, and they are yours:

- When you change behaviour the documents describe, change the documents in the
  same commit. Not afterwards.
- When a document in the repository you are editing disagrees with this file,
  **this file is newer and the code is the authority.** Do not act on the local
  document. Report the contradiction.

## Verify, do not assert

The package ships its own guards and they run from a consuming repository:

```bash
pnpm exec ekdotico-check              # every guard a consumer can run, except decay
pnpm exec ekdotico-check discipline   # literals, var() fallbacks, Greek in the serif, local reimplementation
pnpm exec ekdotico-check --list       # the full set, and which one the bare command runs
```

The guards that audit your repository (`discipline`, `a11y`, `copy`, `styles`
and `decay`) default to the working directory; the rest, `contrast` and
`appearance` among them, check the package's own tokens and components, so a
pass there says nothing about colours you set. Run the bare command
before you report a styling or copy change as complete: it is derived from the
guard table, so it covers whatever this version ships rather than whatever a
document once listed. A passing guard is not proof of good design, but a failing
one is proof of a defect, and it is cheaper than a review.

`decay` is the exception and takes its own invocation. It reads instruction
documents, which do not change on most commits, so it belongs to a scheduled
audit rather than to every change.

Where a rule here says a value was measured, it was measured. Do the same:
read contrast off resolved colours in all eight palettes rather than reasoning
about them, and read styling off painted pixels rather than off serialised
markup — emitted SVG in particular retains presentation attributes that a
stylesheet overrides and that never render.
