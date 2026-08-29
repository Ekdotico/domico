---
'@ekdotico/domico': minor
---

Ship the Expression Guidelines PostToolUse hook with the package, and install it into consumers.

`scripts/agent-hooks/expression-check.sh` runs `ekdotico-lint` over the file an agent has just written, in whichever application owns it, and reports that file's findings against the `failOn` threshold in its own `.ekdotico-lint.json`. `scripts/install-agent-hooks.mjs` copies it into `<consumer>/.claude/hooks/` from the consumer's postinstall; the installed file is a build output, gitignored and rewritten on every install, so a hook is changed here and carried by the pin bump.

It lived as four hand-maintained copies for a day, which is three too many and the same shape as the token catalogue that drifted 388 lines from its twin. A hook also has to agree with the version of the guidelines installed beside it: distributed separately it can enforce this release's rules against last release's package, which is Rule 15 with an exit code.
