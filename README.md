# Domico

`@ekdotico/domico` — the Ekdotico house style, in one versioned package: the
visual layer and the linguistic layer together.

Domico is the design system's own name. Ekdotico is the company whose house
style it holds, and remains the scope on the package, the `ekd-` prefix on the
appearance cookie and the `.ekd-` class prefix, and the word that appears in the
products. Renaming the system did not rename the company.

The visual layer is the design tokens, the four themes, the base stylesheet,
the shared components, and the brand assets. The linguistic layer is the
Ekdotico Expression Guidelines, with the controlled vocabulary and the
prohibited terms as machine-readable data.

The two ship together because they always change together. Splitting them
would recreate, at the package level, the drift problem this package exists to
solve. Subpath exports mean a consumer takes only what it needs: `deree` and
`internal` can depend on the expression layer for copy linting without pulling
a stylesheet or a component into a browser bundle.

Consumed by `docs`, `deree`, and `internal`. Each keeps its own repository, its
own deployment cadence, and its own dependencies.

---

## Installation

The package is private and published to GitHub Packages, so npm needs to know
where to find the `@ekdotico` scope and how to authenticate.

Add an `.npmrc` at the root of the consuming repository:

```
@ekdotico:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}
```

Set `NODE_AUTH_TOKEN` in the environment rather than writing a token into the
file. Locally that means a personal access token with the `read:packages`
scope, exported from a shell profile or a `.env` file that is not committed:

```bash
export NODE_AUTH_TOKEN=ghp_your_token_here
```

In GitHub Actions the built-in token is sufficient:

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: 20
    registry-url: https://npm.pkg.github.com
- run: pnpm install --frozen-lockfile
  env:
    NODE_AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

On Vercel, add `NODE_AUTH_TOKEN` as an environment variable for every
environment that runs a build, and commit the `.npmrc` above.

Then install:

```bash
pnpm add @ekdotico/domico
```

If `pnpm` reports that it could not replace `${NODE_AUTH_TOKEN}`, the variable
is not set in the current shell. The warning is harmless when only public
packages are being installed, and fatal when this one is.

---

## What each subpath gives you

| Import | Contents |
|---|---|
| `@ekdotico/domico/tokens.css` | Every custom property, for all four themes across both modes |
| `@ekdotico/domico/tokens` | The same values, typed, for use outside a stylesheet |
| `@ekdotico/domico/styles.css` | The base layer and the shared component styles |
| `@ekdotico/domico/styles/base.css` | The reset and the semantic type utilities |
| `@ekdotico/domico/styles/reset.css` | The reset, document defaults, accessibility primitives, scrollbars |
| `@ekdotico/domico/styles/type.css` | The semantic type utilities alone |
| `@ekdotico/domico/styles/components.css` | The layout primitives, the appearance controls, and the shared components |
| `@ekdotico/domico/styles/appearance.css` | The appearance controls alone: the two switchers, the header row, and the menu |
| `@ekdotico/domico/styles/primitives.css` | The layout primitives alone — Container, Stack, and Cluster |
| `@ekdotico/domico/styles/badge.css` | One entry per component. The rest are `callout.css`, `figure.css`, `keyvalue.css`, `logo.css`, `section-rule.css`, `stat.css`, `table.css`, and `tabs.css` |
| `@ekdotico/domico/components` | The shared React components |
| `@ekdotico/domico/theme` | Theme and mode switching, and the first-paint init script |
| `@ekdotico/domico/fonts` | Font loading configuration for the three locked families |
| `@ekdotico/domico/mermaid` | Mermaid `themeVariables` for all eight palettes |
| `@ekdotico/domico/mermaid/accessibility` | Reads `accTitle` and `accDescr` out of a diagram source, and blanks the directive lines in place |
| `@ekdotico/domico/svg` | `annotateSvg` — writes `<title>` and `<desc>` into a detached SVG so a downloaded file names itself |
| `@ekdotico/domico/expression` | The vocabulary and the prohibited terms, typed |
| `@ekdotico/domico/expression/guidelines.md` | The Expression Guidelines, canonical copy |

---

## Consuming the package

### docs

The documentation site takes the whole package. It keeps its own MDX
components, navigation, search, and page layouts; those are documentation
structure, not house style.

```ts
// app/layout.tsx
import '@ekdotico/domico/tokens.css';
import '@ekdotico/domico/styles.css';

import { Crimson_Pro, Commissioner, Fira_Code } from 'next/font/google';
import { fontConfig } from '@ekdotico/domico/fonts';
import { themeInitScript } from '@ekdotico/domico/theme';

const serif = Crimson_Pro(fontConfig.serif);
const sans = Commissioner(fontConfig.sans);
const mono = Fira_Code(fontConfig.mono);

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      data-theme="parchment"
      className={`${serif.variable} ${sans.variable} ${mono.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript() }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

The documentation site pins its sticky table headers below its top bar. Set the
offset token once, in the application's own stylesheet:

```css
:root {
  --table-sticky-offset: var(--topbar-h);
}
```

Below 920px a wide table scrolls inside its card, which stops a native sticky
header from sticking to the page. Render `StickyTableHead` once in the root
layout and it mirrors each table's header at the same offset while the reader
scrolls; pass the route as `rescanKey` so a client-side navigation rebuilds the
mirrors. Its styles are in `styles/table.css`.

```tsx
import { SkipLink, StickyTableHead } from '@ekdotico/domico/components';

<SkipLink />              {/* → #main-content, "Skip to main content" */}
<StickyTableHead rescanKey={pathname} />
```

### deree

The institutional site takes the visual layer and the brand assets. Its content
has not been audited against the Expression Guidelines, so adopt the linter in
warning mode first and read the output before enforcing anything.

```ts
import '@ekdotico/domico/tokens.css';
import '@ekdotico/domico/styles.css';
import { Logo, Callout } from '@ekdotico/domico/components';
```

### internal

The internal tool suite is deployed under `internal.ekdoti.co` behind
path-based routing. Take the tokens, and take the base layer only if the tools
should read as Ekdotico surfaces rather than as utilities. The shared
components are optional.

An internal tool whose conventions forbid a global class layer can still render
the appearance controls: `styles/appearance.css` is exactly the markup
`ThemeSwitcher`, `ModeSwitcher`, and `AppearanceMenu` emit and carries nothing
else.

The same holds for the shared components. Each has its own entry, so a tool
that renders three of them imports three stylesheets rather than a component
layer holding a dozen classes it never uses. A global component layer was the
one thing standing between the internal tools and the shared components, and
`styles/components.css` remains for consumers that want the whole set.

```ts
import '@ekdotico/domico/tokens.css';
import '@ekdotico/domico/styles/reset.css';
import '@ekdotico/domico/styles/appearance.css';
import '@ekdotico/domico/styles/callout.css';
import '@ekdotico/domico/styles/table.css';
import { resolveTokens } from '@ekdotico/domico/tokens';

// Values are available outside CSS, for canvas rendering, chart libraries,
// or a theme-colour meta tag.
const { 'bg-canvas': canvas, accent } = resolveTokens('library', 'dark');
```

---

## Applying a theme

Two attributes on the document element, and nothing else:

```html
<html data-theme="parchment" data-mode="dark">
```

`data-theme` is one of `parchment`, `library`, `sepia`, or `mono`. Parchment is
the default and is applied when the attribute is absent.

`data-mode` is `light` or `dark`. **Leave it off to follow the operating
system.** An absent `data-mode` is not an error state; it is the third,
default option, and the stylesheet handles it through `prefers-color-scheme`.

All four themes share identical token names. A consumer switches theme by
switching values, never by switching names, so no component needs to know which
theme is active.

Ship the switchers rather than reimplementing them, so behaviour stays
consistent across the three applications:

```tsx
import { ThemeSwitcher, ModeSwitcher } from '@ekdotico/domico/theme';
```

Where the chrome has no room for the pair laid out, `AppearanceMenu` puts both
behind one 36px button:

```tsx
import { AppearanceMenu } from '@ekdotico/domico/theme';

<AppearanceMenu />;
```

It is a disclosure button and a non-modal popover, and neither a menu nor a
dialog. A reader picks a theme by comparing each candidate against the page, so
the surface stays open through every activation and never seals off the page it
is being judged against. Escape closes it and returns focus to the button, a
press outside closes it, and Tab leaves. On opening, focus lands on the theme
already selected rather than on the first option, because the theme switcher is
one tab stop parked on the active choice.

Both properties are optional: `label` is the row label inside the panel, which
defaults to "Theme" and is also the accessible name of the theme group beneath
it, and `triggerLabel` is the accessible name on the button, which defaults to
"Appearance". Its styles ship in `styles/appearance.css` alongside the two
controls it composes, and that entry carries its own forced-colours and
reduced-motion rules, so it holds when it is the only package stylesheet an
application takes.

Add `themeInitScript()` to `<head>` as a blocking script. Without it the page
renders one frame in Parchment light before the stored theme applies, which is
a full-page colour flash. Under a strict Content-Security-Policy the script tag
needs the request nonce.

---

## The expression layer

The Expression Guidelines govern all copy produced under the Ekdotico name,
across the product interface, the documentation, marketing materials, and
institutional surfaces. The canonical copy lives here, at
`expression/guidelines.md`, and is versioned and released with the package.

A copy held inside a consuming repository is stale by definition. That is the
point: the guidelines previously existed twice, both copies labelled version
0.2, and they had already diverged on the controlled vocabulary.

The controlled vocabulary and the prohibited terms are also structured data:

```ts
import { vocabulary, prohibited, rulesFor, canonicalFor } from '@ekdotico/domico/expression';

// Only the rules that apply within one register. A prohibition scoped to the
// provenance/institutional register is never fired against marketing copy.
const rules = rulesFor('marketing-awareness');

// Resolve a non-canonical term to the one that should be used instead.
canonicalFor('tasks tab'); // -> { canonical: 'Task tracker', ... }
```

Every prohibition carries its reason and its replacement. A finding that says a
term is prohibited without saying what to use instead is an incomplete error
message, which is itself a System Feedback register violation.

### The copy linter

`ekdotico-lint` reads the structured data and holds no copy of the rules, so
changing a prohibited term means editing one file.

```bash
pnpm add -D @ekdotico/domico
pnpm exec ekdotico-lint "app/**/*.mdx"
```

Configure it in `.ekdotico-lint.json`:

```json
{
  "files": ["app/**/*.mdx", "components/**/*.tsx"],
  "failOn": "substantive",
  "registers": {
    "app/vision/**": "marketing-awareness",
    "app/design/**": "instructional",
    "components/CommandPalette.tsx": ["functional", "system-feedback"]
  },
  "overrides": [
    {
      "files": "app/legal/**",
      "rules": ["controlling-obligation"],
      "reason": "Statutory wording, reviewed by counsel 2026-08-01."
    }
  ]
}
```

`--warn-only` reports findings and exits 0. Use it for a first run against
content that has never been linted, so the size of the problem is visible
before anything blocks.

`registers` maps a path to the register its copy is in. **Register-scoped rules
run only where a register is declared.** The linter does not infer one, and it
reports how many rules it skipped for want of one — a wrong register would fire
provenance rules at marketing copy, which is worse than not firing them.

A path may declare a **list** of registers. This is not a hedge; it is the case
§5.6 Step 4 describes as ordinary, where one file carries copy from several
registers at once. A command palette is Functional in its labels and System
Feedback in its empty and error states, and declaring only the first means the
three blocking System Feedback rules never run against the error copy they were
written for. Every declared register's rules run, so a list only ever widens
what is checked.

The one combination to avoid is pairing `provenance-institutional` with any
other register in the same file. That register is defined by what it forbids —
second person, hedging — rather than by what it names, so pairing it with
Instructional copy flags every legitimate "you". If a file genuinely holds both,
§5.6 Step 4.4 already classifies that as a structural problem to resolve by
splitting the file, not by tuning the linter.

First match wins, so order entries from most specific to least. A trailing
`"app/**"` catch-all is worth keeping: an undeclared file silently skips nine
rules, and the report counts them but does not name the file.

Findings are written in the System Feedback register, because that is the
register they belong to. Each states what was found, where, why it is a
violation, and what to use instead:

```
  app/vision/page.mdx:22:67  blocking  [vocabulary/pdf-reader]
    Found: "PDF annotator"
    Why:   "PDF annotator" is a non-canonical term for the PDF reading and
           annotation surface. Every concept has exactly one canonical term.
    Use:   Use "PDF reader".
```

<!-- eg:cite -->
Some findings carry `Note: This pattern is not conclusive on its own.` Those
are variants that are also ordinary English — "faculty", "works cited",
"paper". They report as substantive and ask for confirmation rather than
blocking, because a faculty dashboard is a faculty dashboard.

### Overrides

The failsafe process permits an override with recorded rationale. It does not
permit a bare suppression, so **an override without a reason fails the build**,
and it fails louder than the finding it was silencing. A silent suppression is
worse than an unfixed violation, because it removes the evidence that anything
was ever wrong.

Inline, for one occurrence:

```html
<!-- ekd-lint-disable-next-line controlling-obligation — statutory wording, reviewed by counsel 2026-08-01 -->
```

Or by path, in the `overrides` block above. Both forms require a rationale of
at least eight characters, and overridden findings stay visible in reports so
they can be audited rather than forgotten.

### What is exempt automatically

A prohibited term inside a code fence, an inline code span, a prohibited-terms
table, or a quoted counter-example is data, not copy. Those are exempt
structurally, along with frontmatter, URLs, and the allowlisted identifiers
(`SHA-256`, `Ed25519`, DOIs, requirement IDs, `Chicago Notes-Bibliography`).

A quoted span is exempt only when its line also carries a contrast marker —
"not", "never", "rather than", "instead of". `The button reads "Please wait"`
is still a finding.

For anything else quoted as an example, mark it:

```html
<!-- eg:cite -->
```

### What the linter does not check

Stated plainly, because a linter that implies full coverage produces false
confidence, which is worse than no linter.

Mechanically checkable: prohibited terms, non-canonical vocabulary where a
canonical term is defined, product name spelling, emoji, exclamation marks,
contractions, hyphens where a dash is required, and unsubstantiated
superlatives.

**Not checkable, and never claimed:**

- Register classification. This needs judgement that pattern matching cannot
  supply, and a classifier that appears to work while being wrong is worse than
  no classifier.
- Evaluative inference. "Relevant results" and "ranked results" are lexically
  near-identical; only one of them is evaluative.
- Comparative inference beyond a handful of fixed phrases.
- Deficit framing.
- Anthropomorphism. "The research workspace searches" is correct; "Ekdotico
  learns your preferences" is not.
- Error message completeness, and the confirmation dialog formula.
- Whether a claim can be substantiated by the product or the provenance record.
- Factual currency, meaning whether copy describes an architecture that still
  exists.

These remain the responsibility of the failsafe agent and of human review. The
full list is machine-readable under `notEnforced` in
`expression/prohibited.json`, and the register diagnostic framework the agent
works from is at `expression/registers.md`.

### Quoted examples

The guidelines necessarily contain every term they prohibit, always as cited
counter-examples. Those citations are data, not copy. The linter exempts them
structurally, and any other document quoting a prohibited term for the same
reason marks it with `<!-- eg:cite -->`.

---

## Proposing a change

### A token change

1. Confirm no existing token covers the need. Search `tokens/source/` end to
   end.
2. Open a proposal stating the name, the value for every theme and mode,
   when to use it, when not to use it, and the related tokens considered.
3. Wait for core team approval. A new design need becomes a new token, never a
   literal in a component.
4. Add it to `tokens/source/`, across all eight combinations for a colour
   token.
5. Run `pnpm build:tokens`. Never edit anything under `tokens/generated/` by
   hand — `pnpm check:generated` rebuilds and compares, and a hand edit fails
   the build.
6. Add a changeset: `pnpm exec changeset`.
7. Verify visually at all four themes across both modes.

Colour values are authored in OKLCH. Convert exactly rather than by eye, and
keep the accessible value where a contrast remediation has already been
applied; `--gilt` is darker than the original brand value for exactly that
reason.

### Typography

The three families are Crimson Pro, Commissioner, and Fira Code, wired through
the `--font-serif`, `--font-sans`, and `--font-mono` tokens.

Reference the token, never the family. This applies to prose rules as much as
to stylesheets: the Expression Guidelines rule requiring a monospace face for
cryptographic identifiers names `--font-mono`, so it survives a change of face.
It previously named a family, and that put a language rule in conflict with the
design system the moment typography was revisited.

### A vocabulary addition

The process is in the guidelines at §7.5. In short:

1. Propose the term with a one-sentence rationale.
2. The core team reviews it against four criteria: unambiguous in the Ekdotico
   product context, not overlapping an existing term, compliant with the
   applicable register rule, and not a metaphor.
3. On approval, add it to `expression/vocabulary.json` with its rationale, its
   known non-canonical variants, and the version introducing it.
4. Run `pnpm build:expression`. The prose table in the guidelines and the
   linter rule set regenerate together, so they cannot fall out of sync.
5. Add a changeset.

If a concept recurs in the content but has no canonical term, that is a gap in
the guidelines, not a failure of the content. Record it under `gaps` in
`expression/vocabulary.json` rather than inventing a rule. Gaps route to the
core team.

---

## Working on this package

```bash
pnpm install
pnpm build          # tokens, expression, types, styles
pnpm check          # drift gates and type check
```

| Command | Purpose |
|---|---|
| `pnpm build:tokens` | Regenerate the token artefacts from `tokens/source/` |
| `pnpm build:expression` | Regenerate the guidelines tables and `registers.md` from the JSON |
| `pnpm check:generated` | Fail if a generated token artefact was edited by hand |
| `pnpm check:expression` | Fail if the prose and the structured data disagree |
| `pnpm check:consumers` | Report which repositories in the organisation are behind the published version |

`check:consumers` is deliberately outside the `pnpm check` aggregate. It reads
the GitHub API rather than this working tree, so it needs a network and a token
that can see the organisation — `EKDOTICO_SUITE_TOKEN`, with Metadata and
Contents read across the organisation's repositories. Putting it in the
aggregate would make every pull request depend on an external service to
answer a question that has nothing to do with the change under review.

It runs on its own in `.github/workflows/consumers.yml`, on every published
release and monthly as a backstop, and opens one reused issue when a consumer
is behind. **It does not open a pull request bumping anybody's pin, and that is
the point rather than a limitation.** Every consumer pins exactly so that an
unreviewed visual change cannot reach an application through a routine install,
and their specifications require an upgrade to be reviewed across four themes in
both modes. A bot that bumps the pin automates past the gate the exact pin
exists to hold. The issue is the notification; a person does the review and
raises the bump.

A pin carrying a caret or a tilde is reported more urgently than one that is
behind: a range means the next install in that repository moves the design
system with nobody deciding to.

### Running the guards from a consuming repository

The drift gates were unavailable outside this repository, so no consuming
application could make any of them a blocking check. `ekdotico-check` exposes
them:

```bash
pnpm exec ekdotico-check              # every guard a consumer can run, except decay
pnpm exec ekdotico-check contrast
pnpm exec ekdotico-check decay        # the monthly audit, on its own clock
pnpm exec ekdotico-check --list
```

A command rather than a documented path into `node_modules`. A consumer
invoking a script file by path depends on this package's internal layout, which
then cannot change without breaking every pipeline that was never told it was
coupled to it.

**The no-argument form is derived from the guard table, not listed.** It named
`contrast`, `styles` and `appearance` while this section claimed it ran
everything a consumer could, so the shortest invocation was also the one that
checked the least — neither `discipline` nor `a11y`, the two guards written for
consumers, was in it. Deriving it is what makes a guard added here arm itself in
every application at its next pin bump, rather than waiting for a workflow edit
in each that nobody remembers is owed. Run `--list` for the set, which prints it
from the same table rather than restating it.

`decay` is the one guard a consumer can run that the no-argument form leaves
out. It reads instruction documents, which do not change on most commits, so it
belongs to a monthly audit workflow; running it per-change makes it noise, and
noise is how a gate stops being read.

Five guards run only here, and say so rather than failing on a missing import:
`generated` rebuilds the tokens, `expression` validates the authoring schemas,
`exports` packs this package, `svg` builds a DOM with jsdom, and `icons`
compares against `lucide-static`. Each needs a development dependency that is
never published. `icons` was the odd one out until the default set stopped being
a hand-written list — it noted the dependency in its description and nowhere
else, which was survivable while nothing picked it up automatically and would
have been a red pipeline in three applications the moment something did.

The guards that audit the calling repository rather than this one are
`discipline`, `a11y`, `copy`, `styles` and `decay`, so each takes a directory —
though every one of them defaults to the working directory, which is the form
with nothing to get wrong:

```bash
pnpm exec ekdotico-check a11y .
```

`copy` wraps the `ekdotico-lint` binary, so the copy check reaches a consumer
from the same place as every other gate. Where a repository ships no
`.ekdotico-lint.json` it says on stdout that it checked nothing and exits 0: a
skip nobody can see in the log is the fails-green shape this CLI refuses
elsewhere.


Everything under `tokens/generated/` and both generated regions of
`expression/guidelines.md` are build output. They are committed so a consumer
can read them without building, and both drift gates run in CI.

`pnpm check:expression` also fails when `vocabulary.json`, `prohibited.json`,
and the guidelines header do not declare the same version. That check exists
because the specific failure that prompted this package was two documents
claiming the same version number while saying different things.

---

## Licence

Proprietary. See [LICENSE](./LICENSE). The Ekdotico writing platform is
separately licensed under AGPL-3.0; this package is not part of that codebase
and is not covered by that licence.

The three typefaces are each licensed under the SIL Open Font License 1.1. The
package ships loading configuration, not font files.
