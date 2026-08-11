# @ekdotico/domico

## 0.5.0 – 0.10.0

**No entries. Six versions were published without a changeset and without a git
tag**, and this note exists so the gap is explicit rather than silent. Tags stop
at `v0.2.0`; the entries below stop at 0.4.1; `package.json` reached 0.10.0.

Nothing is reconstructed here beyond what the commit history states, because a
changelog that invents what a release contained is worse than one that admits it
does not know. What the version bumps in `package.json` are attached to, for
anyone tracing a change to a release:

| Version | Commit subject |
|---|---|
| 0.5.0 | `feat(icons): add plus, minus, and arrow-up-right, and a draw variant for the mark` |
| 0.6.0 | `feat(icons): add pencil, for the rename affordance` |
| 0.7.0 | `feat(styles): split the base layer, absorb four gaps, and prohibit motion flatly` |
| 0.8.0 | `feat(styles): ship the appearance controls as their own entry` |
| 0.9.0 | `feat(styles): move td-strong here, so the table cell pair lives in one place` |
| 0.10.0 | `chore: rename the package and repository to Domico` |

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
