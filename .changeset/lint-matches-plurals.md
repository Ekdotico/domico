---
'@ekdotico/domico': patch
---

fix(lint): a pluralised variant or prohibited term no longer slips past the copy linter

Controlled-vocabulary variants and `word` and `phrase` prohibitions now match
their regular English plural as well as the form written in the data: "writing
records" is blocking like "writing record", "polishes" like "polish", and
"faculties" is confirmable like "faculty". Before this, three uses of "writing
records" passed the linter in a single proposal. `regex` and `unicode-range`
rules are unchanged. Irregular plurals (analysis, analyses) are not matched;
list them as variants in their own right.

Two generated plurals that ordinarily mean something else are listed under
their term's `notDetectable`, which the linter now honours: "docs"
(documentation, and the name of a repository) and "cites" (a verb). Expect new
findings in consuming repositories where prose already used plurals of
non-canonical terms, such as "paid tiers" or "reviewers".
