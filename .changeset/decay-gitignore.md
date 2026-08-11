---
'@ekdotico/domico': patch
---

`decay` no longer reports a path that is gitignored.

A path git is told to ignore is **expected** to be absent from a checkout, so a
document naming one is correct. `.vercel/project.json` exists on every developer's
machine and in no clone.

Found the right way: the check passed on four repositories locally and failed in CI
on exactly that file, which is what a second environment is for. Local-only artefacts
are invisible to a guard that only asks the filesystem, and no amount of running it
in one place would have surfaced it.

git is asked rather than `.gitignore` parsed, because git handles nested ignore files
and negations and a hand-rolled matcher would not. One `git check-ignore --stdin` call
covers every candidate. If git is unavailable or the directory is not a work tree,
every candidate is reported: the check degrades to its previous behaviour rather than
silently passing, because a guard that goes quiet when a tool is missing is worse than
one that is noisy.

Mutation-tested both ways: a path under an ignored directory is exempt, and a
genuinely missing source file beside it is still reported.
