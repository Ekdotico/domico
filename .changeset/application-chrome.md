---
'@ekdotico/domico': minor
---

Four pieces of application chrome move into `@ekdotico/domico/components`, each
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
