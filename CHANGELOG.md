# @ekdotico/domico

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
