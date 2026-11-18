---
'@ekdotico/domico': patch
---

fix: the default theme is always on `<html>`, so dark mode applies on a first visit

The dark tokens are keyed on `[data-theme="…"][data-mode="dark"]` and, for
Auto, `[data-theme="…"]:not([data-mode])` inside `prefers-color-scheme`. With
no `ekd-theme` cookie `<html>` had no `data-theme`, so neither matched: choosing
Dark in the menu, or a dark operating system with Auto, still rendered light.
`appearanceAttributes` now returns `data-theme="parchment"` (`DEFAULT_THEME`)
when there is no valid cookie, and `themeInitScript` writes it when the
document has none, so server and client agree. A consumer will notice
`data-theme="parchment"` on `<html>` for a reader who has chosen nothing, where
the attribute was absent; a selector or test that expected it absent needs
updating. `AppearanceAttributes['data-theme']` is now a required key.
