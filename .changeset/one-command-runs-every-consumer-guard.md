---
'@ekdotico/domico': minor
---

`ekdotico-check` with no arguments now runs every guard a consumer can run, and the copy linter is one of them.

The no-argument set was the literal `contrast, styles, appearance`, while this file's own docstring said it ran everything a consumer could. Both `discipline` and `a11y` — the two guards written specifically for consumers — were outside it, so the shortest invocation was also the one that checked the least. It is now derived from the guard table, which means a guard added here arms itself in every application at its next pin bump rather than waiting for three workflow edits that nobody remembers are owed.

`copy` is a new guard, wrapping the `ekdotico-lint` binary through `scripts/check-copy.mjs`. The wrapper exists because the two take their target differently: every guard reads an application directory from argv, and the linter is driven by `process.cwd()` and reads a positional argument as a glob, so handing it a directory would have linted one path instead of the configured set. Where a repository ships no `.ekdotico-lint.json` the guard says on stdout that it checked nothing and exits 0 — a skip nobody can see in the log is the fails-green shape this CLI already refuses elsewhere.

`icons` is now marked `developmentOnly`. It compares against `lucide-static`, a devDependency only this repository installs, and exits 2 without it. That was survivable while the default set was a hand-written list and stopped mattering the moment the list was derived: a guard that cannot run outside this repository, and does not declare it, becomes a red pipeline in three applications as soon as it is picked up automatically.

Two exclusions remain from the no-argument set. `developmentOnly` guards, structurally. And `decay`, because it reads instruction documents, which do not change on most commits — it belongs to the monthly audit workflow, and running it per-change would make it noise.
