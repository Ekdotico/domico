---
"@ekdotico/design-system": minor
---

Initial extraction of the Ekdotico house style from the `docs` repository.

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
