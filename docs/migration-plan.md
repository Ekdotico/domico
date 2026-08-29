# Migration and remediation plan

**Prepared:** 2026-08-09 · **Target:** `docs` (`ekdotico-docs`) · **Package:** `@ekdotico/domico@0.1.0`

> **This plan was executed. It is a record, not instructions.**
>
> Tracks 1 to 3 completed on 2026-08-09, as their own step notes record. `docs`
> has consumed the package ever since and now pins a version many minors beyond
> the `0.1.0` named above. Do not re-run any step: the stylesheet ranges, source
> files, and asset directories named below were deleted at the time, so the line
> numbers no longer resolve and an agent following them would be editing by
> coordinates into a file that has moved on.
>
> The header line is left at `0.1.0` deliberately. It is what the plan was
> written against, and correcting it would turn a dated record into a document
> that looks current.

Four tracks. They are independent and can be sequenced separately, which is the
point: the visual migration is mostly mechanical and should not wait on the
currency decisions, and the currency decisions should not be rushed to unblock
a dependency bump.

Each step states whether it is mechanical or needs judgement, so the risky ones
got reviewed rather than assumed safe.

---

## Track 1 — Visual migration

Moving `docs` onto the package. The largest track by file count and the
smallest by risk, because the package was extracted from this repository and
ships the same values.

**Typography is a no-op.** The package and `docs` now name the same three
families through the same CSS variables (`--font-crimson-pro`,
`--font-commissioner`, `--font-fira-code`). This was the single largest
regression risk in the migration and the core team's decision on 2026-08-09
removed it entirely.

### 1.1 Dependency and authentication — mechanical

1. Add `.npmrc` at the repository root pointing the `@ekdotico` scope at GitHub
   Packages.
2. Add `NODE_AUTH_TOKEN` to Vercel for Production, Preview, and Development.
   **This is the step most likely to break the deploy**, and it fails at
   install time with a 401 rather than anything descriptive. Verify on a
   preview deployment before merging anything else in this track.
3. `pnpm add @ekdotico/domico`.

### 1.2 Token layer — mechanical, verifiable by diff

Replace lines 14–350 of `app/globals.css` (the four light palettes, the four
dark palettes, the two auto-dark duplicates, and the type, space, radius,
motion, and layout scales) with:

```ts
import '@ekdotico/domico/tokens.css';
```

The generated `tokens.css` was produced from those exact declarations, so this
is provably equivalent rather than approximately so. Confirm by building both
and diffing the computed custom properties on `:root` for each of the eight
palettes.

**Two deliberate differences to expect:**

- `--gilt` is unchanged in value but the auto-dark blocks now come from one
  source rather than two hand-maintained copies. The extraction verified they
  were byte-identical, so no visual change.
- `--chat-panel-w` is **not** in the package. It is chat-feature geometry and
  stays in `docs`. Keep it in the local `:root`.

Add the sticky-header offset, which the package defaults to zero:

```css
:root {
  --table-sticky-offset: var(--topbar-h);
}
```

### 1.3 Base and component styles — mechanical, needs a visual check

Delete from `app/globals.css`:

| Lines | Content |
|---|---|
| 354–438 | Reset, base, skip link, focus ring, type utilities |
| 1073–1084 | Section rule |
| 1085–1161, 1268–1296 | Table chrome and caption |
| 1339–1383 | Badges |
| 1444–1547 | Key-value list |
| 1630–1723 | Callout |
| 2150–2317 | Figure, tabs, stat |
| 2486–2623 | Theme switcher, mode switcher, logo lockup |
| 3161–3196 | Scrollbars |

Replace with `import '@ekdotico/domico/styles.css';`, ordered after the
token import.

**Keep** lines 1162–1267 (the fixed column widths for `RequirementTable`,
`RiskTable`, and `StakeholderTable`, and the `.req-*` sub-content rules) and
1297–1338 (the sticky-header clone for `StickyTableHead`). All four components
are docs-specific and stay.

Line numbers are as of this plan; take them from the extraction scripts
(`scripts/extract-component-css.mjs` in the package) rather than by hand.

### 1.4 Import rewrites — mechanical

| From | To |
|---|---|
| `@/components/docs/Badge` | `@ekdotico/domico/components` |
| `@/components/docs/Callout` | same |
| `@/components/docs/Table` | same |
| `@/components/docs/Stat` | same |
| `@/components/docs/KeyValue` | same |
| `@/components/docs/Tabs` | same |
| `@/components/docs/Figure` | same |
| `@/components/SectionRule` | same |
| `@/components/Logo` | same |
| `@/components/ThemeSwitcher` | `@ekdotico/domico/theme` |
| `@/components/ModeSwitcher` | same |
| `@/lib/useRenderedMode` | same |

`mdx-components.tsx` is the highest-value single edit: most MDX pages resolve
these through it and need no change themselves.

Then delete the eleven source files and `lib/useRenderedMode.ts`.

### 1.5 Mermaid — needs judgement

`components/docs/Mermaid.tsx` carries 216 hex literals across `themeVars`.
Replace with:

```ts
import { mermaidTheme } from '@ekdotico/domico/mermaid';
```

**This is the only step in Track 1 that changes rendered output**, and it does
so deliberately: the current parchment `lineColor` is `#8b6f3a` against a
`--gilt` of `#6f5826`, so diagram rules are visibly a different gold from page
rules. After migration they match.

Check every diagram type against the eight palettes — flowchart, sequence,
class, ER, state, and pie use different subsets of `themeVariables`, and a slot
the package does not populate falls back to a Mermaid default rather than
failing loudly.

### 1.6 Assets — mechanical

Delete `public/logo/` (84 files). Resolve from
`@ekdotico/domico/assets` instead. Keep `public/favicon.png`,
`app/icon.svg`, and `app/apple-icon.png`: Next resolves those by convention
from fixed paths and they cannot come from a package.

### 1.7 Verification — needs judgement

1. `pnpm typecheck` and `pnpm build`. Mechanical.
2. Diff computed custom properties on `:root` across all eight palettes.
   Mechanical, and the strongest single check in this track.
3. Visual pass across four themes × two modes on: the homepage, an FR
   catalogue page, the glossary, a page with a Mermaid diagram, a page with a
   `Compare` table, and the chat panel open. Judgement.
4. Keyboard pass: skip link, focus rings, tab keyboard model, command palette.
   Judgement.
5. Print stylesheet. Frequently missed, and `globals.css` has a print block
   that references classes moving into the package.

### 1.8 Rollback

Every step through 1.4 is additive until the deletions land, so the rollback is
`git revert` of the migration commit plus `pnpm install`. Once published, the
package version is pinned, so a bad release does not reach `docs` until the
dependency is bumped.

The one non-revertible risk is the GitHub Packages token: if it is removed or
expires, `docs` cannot install at all. Set a calendar reminder for the token's
expiry, or use a GitHub App installation token instead of a personal one.

---

## Track 2 — Copy remediation

**All 16 blocking locations were corrected on 2026-08-09.** Nothing in the
blocking tier remains. What follows is the substantive tier and the vocabulary
gaps.

Vocabulary corrections are batched by term rather than by page, so a term is
corrected everywhere at once. Batching by page is how a term ends up half
migrated.

### Batch A — substantive, register and framing. Needs judgement throughout.

Seven findings. Each is an evaluative or comparative inference that a linter
cannot detect, so each needs a human decision on the replacement, not just the
rule.

**Six of seven applied on 2026-08-09.** The seventh is blocked on a vocabulary
decision rather than on effort.

| Location | Was | Now |
|---|---|---|
| `app/vision/page.mdx:26` | "a scored AI contribution breakdown" | "an itemised record of AI tool usage", with the signal list corrected to what FR-PR actually records. See C-1. |
| `app/vision/page.mdx:28` | "makes responsible AI use demonstrable" | "makes AI use demonstrable" — "responsible" implied a correct way to use AI, against principle P4. |
| `app/vision/page.mdx:17` | "the same painful context-switching" | "the same repeated context-switching" — factual rather than emotive. Also "academic paper" to "academic document", per the controlled vocabulary. |
| `app/discovery/functional-requirements/page.mdx:36` | "to surface relevant academic literature" | "and returns ranked academic literature" — "relevant" was an evaluative claim about results. |
| `app/define/problem-opportunity/page.mdx:38` | "confidence-scored auto-completion" | "routed through a three-tier confidence model" — names the FR-TK-06 mechanism rather than implying the system judges completion. |
| `app/design/design-system/page.mdx:16` | "Deviations require explicit justification." | "The core team reviews any deviation before it ships." — supplies the agent, and states a process rather than an obligation. |
| `app/vision/page.mdx:22` | "auto-citation engine" | **Open.** Blocked on vocabulary gap V-2: the citation resolution subsystem has no canonical term, and three forms are in circulation. Rewriting now would add a fourth. Routes to §7.5. |

### Batch B — vocabulary, global by term. Mechanical.

Already applied on 2026-08-09: `Tasks tab` → `Task tracker` (5 sites),
`PDF annotator` → `PDF reader`, `RAG-powered source chat` → `source chat`.

One decision remains, and it is a guidelines change rather than a content
change: **"PDF reader and annotator"** as the FR-PD module title. The
recommendation is to keep it and record it as an approved compound, which is
already encoded as `allowedCompounds` in `vocabulary.json`. Ratify or reject.

### Batch C — vocabulary gaps. Needs judgement, routes to §7.5.

Eight concepts recur with no canonical term. They are gaps in the guidelines,
not failures of the content, and the linter does not flag them. Two should be
escalated ahead of the rest:

- **`export lock`** — §7.1 calls it "a technical implementation term that is
  not user-facing", yet the specification uses it as the primary name
  throughout FR-EX, FR-PR, and FR-VR. The guidelines contradict themselves.
- **The writer** — "writer", "student", "user", "author", and "document Owner"
  all appear for the same person. Five labels for the primary user is the
  reliability-contract failure principle P7 exists to prevent, and it compounds
  with every page added.

The remaining six (`block`, `citation engine`, `source library`, `workspace`,
`confidence tier`, `provenance signal`) can go through §7.5 at normal cadence.

---

## Track 3 — Currency remediation

Sequenced separately from Track 2 because **each finding needs a factual
decision about what is currently true before any rewriting can happen.** These
are not copy problems. Compliant copy can describe an architecture that no
longer exists.

### 3.1 Correctable directly from the specification content — mechanical once confirmed

| Finding | Location | The specification says |
|---|---|---|
| **C-3** | design-system page, "Load: Google Fonts" | `app/layout.tsx:19–21` — self-hosted via `next/font`; the Google Fonts import was removed for PERF-2. **Corrected 2026-08-09.** |

### 3.2 Resolved on 2026-08-09 — core team decisions applied

| Finding | Decision and outcome |
|---|---|
| **C-1** | Corrected. The proposal was to change "scored" to "measured", which fixes the weakest of three problems in that sentence: "keystrokes" and "rewrite ratios" appear **nowhere** in FR-PR or FR-AI, so two of the four named signals were fabricated. Rewritten to what the record actually contains — session history, paste events, the edit-distance trajectory (FR-PR-20), and per-surface AI activity (FR-PR-24 through FR-PR-33) — which also satisfies marketing rule 10. |
| **C-4** | Corrected. Seven sizes, both fills, and both wordmarks now listed. |
| **C-6** | Corrected, by replacement rather than deletion. Every missing token turned out to be a stale **alias** for one that does exist: `--bg-overlay` → `--bg-raised`, `--success` → `--ok`, `--warning` → `--warn`, `--border` → `--rule`, `--shadow` → the `--shadow-*` scale, `--text-*` → `--fs-*`, `--space-*` → `--sp-*`, `--reading-column` → `--measure`, `--sidebar-width` → `--sidebar-w`. No capability was missing, so deleting the rows would have left the page with no colour reference at all. `--panel-width` was the one genuine removal: slide-in panel geometry is per-application. |
| **C-7** | Corrected in the code. `--measure` is now `72ch` in both the package and `docs`, matching the design system page and the accessibility rationale, which both said 72. |

| **C-5** | Corrected. Lucide is the icon source but is deliberately **not installed**: the SVG path data is vendored inline. The documentation stated a dependency that never existed; it now states the vendoring policy. |
| **C-8** | Corrected. The `ModuleIndex` hover no longer applies a 1px translate; the border and shadow lift carry the affordance. Its transition timings were also literals (`0.15s ease`) and are now `--dur-fast` and `--ease-soft`. |

### 3.3 Opened by the C-5 and C-8 work — needs a decision

Neither was in the Phase 1 audit. Both surfaced while correcting the findings
above, and both are recorded rather than fixed, because fixing either changes
behaviour a user would notice.

| Finding | Detail |
|---|---|
| **Icon conformance** | **Resolved 2026-08-09.** All eleven icons replaced with authoritative Lucide geometry, extracted from `lucide-static` rather than written from memory, at 1.5 stroke on a 24×24 viewBox. The package now ships the set on the `/icons` subpath, so conformance is enforced by a shared module rather than left to convention. At migration, `docs` deletes its local copies and imports from there. |
| **Two remaining transform motions** | **Resolved by amending the principle, 2026-08-09.** Motion is now: fades at `--dur-base`, with transform permitted only where a surface enters or leaves the viewport, and prohibited on any surface already on screen — no movement on hover, focus, selection, or state change. The command palette's `cmdk-rise` and the mobile nav drawer's slide are both compliant under the amended rule and were left as they are. The `ModuleIndex` hover translate remains a violation under the amended rule too, and stays removed. Amended in the design system page, the accessibility page, the design brief, its skill entry point, and the package's motion token source. |

---

## Track 4 — Tooling adoption

The `docs` content has never been linted. A first run in blocking mode would
produce a wall of findings against content that is, by the Phase 1 audit's
measure, in unusually good mechanical shape — and a wall of findings on day one
is how a linter gets switched off in week two.

**Recommendation: warning mode first, for one full content cycle, then enforce.**

The reasoning is specific rather than general caution. Two things are genuinely
unknown until the first run:

1. **The false-positive rate on real content.** The exemption machinery was
   tuned against the guidelines document, which quotes prohibited terms
   constantly. Docs content has a different shape — requirement catalogues,
   generated MDX, tables of SRS text. The `hyphen-in-numeric-range` and
   `minimising-modifiers` rules in particular are marked as needing
   confirmation and will need an allowlist pass.
2. **Which registers apply where.** Register-scoped rules do not run until a
   register is declared per path, and that mapping is a judgement call that has
   to be made once, carefully, for the whole site.

### Sequence

1. **Add the dependency and a config, warn-only.** Mechanical.
   ```bash
   pnpm add -D @ekdotico/domico
   pnpm exec ekdotico-lint --warn-only "app/**/*.mdx"
   ```
2. **Read the output and tune the allowlist.** Judgement. Expect additions for
   SRS identifiers, amendment markers (`D-S4-05`), and citation style names.
   Every addition is a change to `expression/prohibited.json` in the package,
   released as a patch.
3. **Declare registers per path.** Judgement, and the highest-value single
   step, because it is what unlocks the register-scoped rules. A first cut:

   | Path | Register |
   |---|---|
   | `app/vision/**`, `app/discovery/market-analysis/**`, `app/discovery/competitive-analysis/**` | `marketing-awareness` |
   | `app/discovery/**` (remainder), `app/define/**`, `app/design/**`, `app/implementation/**`, `app/specification/**` | `instructional` |
   | `app/error.tsx`, `app/global-error.tsx`, `app/not-found.tsx`, `lib/chat-errors.ts` | `system-feedback` |
   | `lib/nav*`, sidebar and top bar labels | `functional` |

   Classify per copy unit where a page mixes registers — most notably
   `app/vision/page.mdx`, whose prose is Marketing/Awareness and whose
   `KeyValue` labels are Functional.
4. **Remediate Batch A and Batch B.** Judgement, per Track 2.
5. **Enable in CI at `--fail-on blocking`.** Mechanical. Blocking only, at
   first: substantive findings need human confirmation by design, and failing
   a build on a finding that says "confirm before changing" trains people to
   override rather than read.
6. **Move to `--fail-on substantive` once the substantive backlog is clear.**

Add to `.github/workflows/` alongside the existing typecheck. Also worth a
pre-push hook, since `docs` already installs hooks via `scripts/install-hooks.mjs`.

---

## Applying this to `deree` and `internal`

The plan above assumes the extraction source. Neither of the other two
repositories is, and that changes the work in four ways.

**Their content has not been audited.** Everything in Tracks 2 and 3 here rests
on a full read of all 55 `docs` pages. For `deree` and `internal` the
equivalent audit has not happened, so the first linter run is a discovery
exercise rather than a remediation checklist. Expect a materially higher
finding count: `docs` had zero emoji, zero stray exclamation marks, and clean
sentence case across the whole site, which is not the normal starting state.

**`deree` is institutional-facing, which raises the register stakes.** It is
the repository most likely to carry Marketing/Awareness copy making claims
about the provenance system — exactly where marketing rules 7, 10, and 11 bite,
and exactly where the linter is weakest, because substantiability is not
mechanically checkable. Budget human review there, not tooling.

**`internal` may not want the visual layer at all.** It is a tool suite behind
path-based routing. Taking the tokens without the base layer is a legitimate
choice, and the expression layer can be a devDependency with no browser bundle
impact. Do not migrate it wholesale by analogy with `docs`.

**Neither has a token layer to delete.** Track 1 here is dominated by removing
things. For `deree` and `internal` the visual work is adoption rather than
replacement, which is lower risk but needs a decision about what their existing
styles become. If either has its own colours, the migration is a redesign, and
it should be scoped as one rather than smuggled in as a dependency bump.

One thing transfers unchanged: the expression layer is the same document with
the same rules, and adopting it is the same three steps — dependency,
warn-only run, register map.
