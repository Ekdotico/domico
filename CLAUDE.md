# Domico — agent rules for this repository

`AGENTS.md` is written for an agent working in a **consuming** repository and
ships inside the published package. This file is the opposite: it is local to
this checkout, is not published, and holds the process rules that only apply
while working on the package itself. Read `AGENTS.md` for the house style and
the eighteen rules; read this for how this repository is worked in.

## Enforcement

- **PostToolUse hook** at `.claude/hooks/expression-check.sh`, wired in
  `.claude/settings.json`. Fires on `Write | Edit | MultiEdit`, runs the linter
  this package publishes over the scope in `.ekdotico-lint.json`
  (`expression/*.md` and `README.md`), and reports the findings for the file
  just written. At or above `failOn` — `substantive` here, stricter than the
  applications — it exits 2 and the report goes back to the agent; below it,
  the report is advisory.
- It runs `dist/src/lint/cli.js`, not a `node_modules` binary: this repository
  builds the linter it publishes and so has no `.bin` entry for it. **A stale
  `dist` means a stale check.** Run `pnpm build` after changing anything under
  `src/lint/` or `expression/`, or the hook keeps enforcing the previous rules.
- `pnpm check` remains the repository-wide verdict, and CI runs it. The hook
  reports one file and never the backlog.

## Hooks are mirrored across the suite

`.claude/hooks/` is a copy, not a shared directory. `deree`, `docs`,
`internal/praktico`, this repository, and the workspace root above them each
carry their own, because each is a separate git remote and none can read a file
out of a sibling checkout.

**Change a hook here and apply the same change to every other copy in the same
session**, together with the entry in each `.claude/settings.json` that
registers it. An agent in another repository reads that repository's copy and
never this one, so a hook that is right in one place and stale in four teaches
four agents the wrong thing. That is Rule 15 — documentation that contradicts
the code is a defect with a severity — in the form it takes for tooling, and
this repository is the one that wrote the rule.

- `expression-check.sh` is byte-identical in all five places by construction
  and stays that way. It finds the application it is running in by walking up
  to the nearest `.ekdotico-lint.json`, which is why one file serves all of
  them.
- `design-system-reminder.sh` is the PreToolUse design reminder that `docs` and
  `internal/praktico` carry and this repository does not. Its body is
  deliberately repository-specific; its shape — event, matcher, extraction,
  output form — is shared. If one is added here, mirror the shape, not the text.
