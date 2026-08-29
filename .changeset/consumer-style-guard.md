---
'@ekdotico/domico': minor
---

`check:styles` audits a consuming repository's own stylesheets, and the
Expression Guidelines stop contradicting themselves about their own version.

**The style guard now targets consumers.** `ekdotico-check styles .` reads the
calling repository's `.css` and `.module.css` files instead of this package's,
the way `discipline`, `a11y` and `decay` already did. Without a directory
argument it behaves exactly as before.

This is the second half of rule 17. The package removed `text-transform` from
every label role in 0.15.0 and added the guard in the same release — and every
consumer went on shipping the declaration, because the guard read `dist/styles`
whatever directory it was invoked from. An application running it got a passing
result about somebody else's CSS. Thirty-five declarations survived that way
across two applications, rendering `PRE-LAUNCH`, `ACCESS CODE`, `THE PLATFORM`
and every section eyebrow from strings that were authored in sentence case. The
gap rule 17 names — a copy linter that never opens a stylesheet, a style guard
with no string to compare against, and nothing joining the two — had a second
instance one level up, across the package boundary, and closing the first did
not close the second.

The parse checks stay package-only: a consumer's stylesheet is compiled by its
own bundler, which reports a syntax error better than this does. What a consumer
gets from here are the three house rules a bundler has no opinion about — no
0.01ms motion ceiling, no coloured edge stripe, no case transform.

**Rule 13's blockquote exception is now the guard's exception**, with its
ceiling where the code can hold it. The rule permitted "a bare `blockquote` rule
with no card surface" and warned that an unwritten exception is how a ban
erodes; the guard could not see the distinction and would have failed two
correct blockquote rules on the first consumer it audited. A rule whose selector
names `blockquote` and which declares no `background`, `box-shadow` or
`border-radius` is bare and passes. Any of the three makes it a card, and a card
signalling tone with a coloured edge is the banned pattern whatever the selector
is called.

**`check:expression` now checks the closing line as well as the header.**
`guidelines.md` opened at 0.3 and closed at `*End of Expression Guidelines
v0.2*` for the whole of 0.3 — the single canonical copy contradicting itself, in
the one file whose purpose is to be the copy that cannot. The version check read
the header and stopped, so the footer sat outside the only guard built to
prevent exactly this. A version stated twice is now checked twice.

Both new assertions were mutation-tested by reintroducing the defect and
confirming the failure.
