---
'@ekdotico/domico': minor
---

Labels render in the case they are authored in. `text-transform: uppercase` is
removed from every label role, and rule 17 now forbids the property outright.

Ten declarations applied case: `.theme-header-label` in `styles/appearance.css`;
`.eyebrow` in `styles/type.css`; `.tbl-wrap thead th`, `.tbl-caption`, `.kv-key`,
`.callout-title`, and `.stat-label` in `styles/components.css`; and three more in
the visual ruleset's own stylesheet, which set its labels in capitals while
stating the rule that forbids them.

**This is a visible change on every surface that renders a label.** `Theme` reads
`Theme` rather than `THEME`, and a table header reads `Participant` rather than
`PARTICIPANT`. Nothing else moves: size, weight, tracking, and colour are
untouched, and they are what carried the label role in the first place — case was
the fifth signal on a label that was not struggling to be read as one. Review
across the four themes in both modes before adopting, per rule 14.

Why it is a defect rather than a preference. The Expression Guidelines require
sentence case for every label, heading, and piece of interface copy; §4 states
that rule as universal — "regardless of register", "any copy submitted for
Ekdotico, in any context" — and offers `"PROVENANCE RECORD"` as its
counter-example. Applying `uppercase` in a stylesheet produces that
counter-example from a string that was authored correctly, which is why it
survived: `ekdotico-lint` reads authored strings and never opens a stylesheet,
the style guards read stylesheets and have no string to compare against, and
nothing joined the two. It shipped on three surfaces for fourteen minor versions
in the gap between them.

Two guards close that gap, both mutation-tested by reintroducing the declaration:
`check:styles` fails on `text-transform` in any shipped stylesheet, and
`check:ruleset` holds the ruleset document's own stylesheet to the same
prohibition. All three values are refused, not only `uppercase` — `lowercase`
erases a proper noun and `capitalize` forces title case onto a label the
guidelines require in sentence case, so the property has no compliant value here.

`.smallcaps` is unchanged and is not the alternative. It preserves the authored
casing, but no house family ships the glyphs — Commissioner, Crimson Pro, and Fira
Code all lack `smcp` and `c2sc`, read from the `woff2` a browser is served — so a
browser scales capitals instead, which is rule 5's synthesis failure in a second
costume. The role is retained as a correct instruction that renders properly the
day `--font-sans` carries the feature, and it now says so where it is defined.

Also in this release: the ruleset's `.theme-header-label` stated `0.12em`
directly where `--tr-label` holds that value, which is rule 1 in the document
that states rule 1. It takes the token. The `check:styles` failure header said
the stylesheets "do not parse" for findings that had nothing to do with parsing;
it now says what it means.

Raised from `praktico` as a rule 4 item rather than worked around locally. The
consuming repository could not fix it — overriding a package global breaks the
CSS-Modules rule, restating the styling locally is the defect NFR-Q-04 names, and
rule 6 forbids passing a `label` prop — so it stopped, recommended one change,
and waited. That is the route the rule exists to produce.
