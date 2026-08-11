---
'@ekdotico/domico': minor
---

One stylesheet entry per component, the appearance controls behind one button, and the guards runnable from a consuming repository.

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
