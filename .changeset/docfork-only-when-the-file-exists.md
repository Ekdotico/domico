---
'@ekdotico/domico': patch
---

`docfork` no longer reports a reference to a local catalogue that does not exist.

The prose half of the check now runs only where a local copy is actually present,
and that condition is the rule rather than an optimisation: a reference cannot
send anyone to a stale catalogue that is not there. With the file deleted, naming
it is either a dead link or — far more often — a sentence explaining that it was
removed and what to read instead. Documenting a removal is exactly what an
instruction file should do, and the first two attempts at this check forbade it.

Attempt one looked back 60 characters from each match for the package path. It
failed on the first sentence written to satisfy it: one that points at
`node_modules` and then names the old path while explaining why it went. Attempt
two allowed any line mentioning the package, and failed on wrapped markdown, where
the package path and the filename land on different lines. Both were guesses at
intent from surrounding text. Whether the file exists is not a guess.

Mutation-tested: reintroducing a local copy fires the file finding and both prose
references, and removing it returns to a pass — so the prose findings reactivate
precisely when they mean something.
