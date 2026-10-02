# Domico — agent rules for this repository

`AGENTS.md` is written for an agent working in a **consuming** repository and
ships inside the published package. This file is the opposite: it is local to
this checkout, is not published, and holds the process rules that only apply
while working on the package itself. Read `AGENTS.md` for the house style and
the eighteen rules; read this for how this repository is worked in.

## This repository owns the agent hooks the estate runs

`scripts/agent-hooks/` is the source. `scripts/install-agent-hooks.mjs` copies
every `.sh` file in it into a consumer's `.claude/hooks/`, prefixing a generated
banner that names the version, and every consumer calls that installer from its
`postinstall`. The installed copies are gitignored there and here — including
this repository's own, which `prepare` writes on `pnpm install`.

**A hook is changed here and nowhere else.** The four applications cannot edit
theirs: the banner says so and the next install proves it. That is the whole
point — the hook lived as five hand-maintained copies for a day, which is the
shape of the token catalogue that drifted 388 lines from its twin, except a
hook runs, so its drift shows up as one repository blocking an edit another
allows.

The second reason it lives here rather than in a repository of its own: a hook
that enforces the Expression Guidelines has to agree with the guidelines
installed beside it. Ship it separately and it can enforce this release's rules
against last release's package, which is Rule 15 with an exit code.

Releasing a hook change is releasing the package — changeset, the approval on
the changesets pull request, merge, then the pin bump in each application.
Slow on purpose, and the same gate a token change passes.

`pnpm hooks:install` writes this repository's copy, `pnpm hooks:check` asserts
it matches the source. `.gitignore` ignores `/.claude/hooks/*`, so a second
installed hook needs no new entry, and a hook genuinely local to a repository
is exempted there by name.

## Enforcement here

- The installed **PostToolUse hook** fires on `Write | Edit | MultiEdit`, runs
  the linter this package publishes over the scope in `.ekdotico-lint.json`
  (`expression/*.md` and `README.md`), and reports the findings for the file
  just written. At or above `failOn` — `substantive` here, stricter than the
  applications — it exits 2 and the report goes back to the agent; below it,
  the report is advisory.
- In this checkout it runs `dist/src/lint/cli.js`, not a `node_modules` binary:
  this repository builds the linter it publishes and so has no `.bin` entry for
  it. **A stale `dist` means a stale check.** Run `pnpm build` after changing
  anything under `src/lint/` or `expression/`, or the hook keeps enforcing the
  previous rules.
- `pnpm check` remains the repository-wide verdict, and CI runs it. The hook
  reports one file and never the backlog.
