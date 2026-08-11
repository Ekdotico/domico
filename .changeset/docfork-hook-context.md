---
'@ekdotico/domico': patch
---

`docfork` no longer reports a hook that states the correct path and the history together.

Two exemptions, both found by running the guard against the repositories it governs
rather than by reasoning about it.

**A glob that also matches the package path.** `*/docs/design-tokens.md` is how a
hook matcher is written and documented, and it resolves against `node_modules` as
readily as against a local copy.

**A bare mention on a line that already gives the correct path for the same
document.** Then the reference is contextual prose — in practice a sentence saying
the local copy is deleted and naming what to read instead — rather than a direction
to a local file.

The second exemption is deliberately narrower than the one it replaces. An earlier
version allowed any line mentioning `@ekdotico/domico`, which was too loose: the
original defect's payload named the package's token *stylesheet* while sending the
agent to a local *catalogue*, and passed. Keying on the package path for that
specific document keeps the original failing — verified by reconstructing it — while
letting a payload that states both the right path and the history through.
