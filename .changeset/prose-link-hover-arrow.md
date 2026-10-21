---
'@ekdotico/domico': minor
---

**Changed: links in running text.** An unclassed anchor, the one an author writes in copy, now:

- turns the theme's primary colour (`--accent`) on hover and on keyboard focus;
- gets a heavier underline on hover and focus, `from-font` at rest and `0.12em` on hover, so the cue is not colour alone;
- carries a small diagonal arrow at its top-right corner, Lucide's arrow-up-right drawn as a `currentColor` mask, so it reads as a link before the pointer reaches it.

Requested by the owner. The arrow follows the link's colour through hover and every theme, takes `LinkText` in forced colours, is not read aloud, and is not underlined.

A link with a class is untouched, as before: navigation, buttons, the table of contents and an application's own styled links keep their look. An application that wants the arrow off a particular unclassed link gives it a class.
