---
'@ekdotico/domico': minor
---

Add `CircleQuestionMarkIcon` to the vendored icon set.

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
