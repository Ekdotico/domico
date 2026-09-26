# @ekdotico/domico

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
