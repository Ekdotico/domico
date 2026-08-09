---
'@ekdotico/design-system': minor
---

The server tells its components what it told the document.

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
