# Security policy

`@ekdotico/domico` is the Ekdotico house style in one package: design tokens,
themes, base styles, shared components, brand assets, and the Expression
Guidelines with their machine-readable vocabulary. It is consumed by `docs`,
`deree`, and `internal`, and it runs code in each of them — a `postinstall`
hook, two CLIs, and a blocking script in the document head. That is the surface
worth reporting on.

The repository is private and the package is published to GitHub Packages with
restricted access, under the proprietary licence in `LICENSE`.

## Reporting a vulnerability

Email `stavros.apostolou@acg.edu` with `[security] domico` in the subject line.

Do not open an issue. An issue is visible to every collaborator and remains in
the timeline after the fix, which makes it the wrong place for a defect that is
still exploitable. GitHub's private vulnerability reporting is available for
public repositories only, so email is the channel here.

State the entry point, the input, and what happened. If the finding reaches a
consumer, say which one, because the fix may need a version bump there as well
as a change here.

## In scope

- **The published tarball.** `files` in `package.json` decides what ships, and
  it ships `src` and `scripts` as well as `dist`. Anything reaching the tarball
  that is not in that list, and anything in it that carries a credential, a
  private key, or an internal path, is a finding.
- **`scripts/install-agent-hooks.mjs`.** It runs from a consumer's
  `postinstall`, with that repository's permissions. Any write outside the
  consuming repository, any path derived from data rather than from a constant,
  and any content it executes is a finding.
- **`ekdotico-lint` and `ekdotico-check`.** Both read repository files and
  configuration. A configuration value that becomes a command, a path that
  escapes the project root, or a pattern in `prohibited.json` that hangs on
  ordinary input are findings. The last is the likeliest: these are regular
  expressions run over every file a consumer names.
- **`themeInitScript()`.** It is injected with `dangerouslySetInnerHTML` and
  runs before first paint. Its documented position is that the only
  interpolation is the generated theme vocabulary, so there is no injection
  surface. Anything showing otherwise, including a stored value that reaches
  the document without passing the guards in `src/theme/appearance.ts`, is a
  finding.
- **Components.** Content rendered without escaping, or a
  `dangerouslySetInnerHTML` fed by a value the consumer does not control.
- **Credentials in CI.** A registry token in a workflow file, or one that
  reaches a log.
- A dependency vulnerability reachable from this package's code.

## Out of scope

- Colour contrast, focus handling, and other accessibility defects. They matter,
  and `check-a11y` exists for them, but they belong in an issue.
- False positives and false negatives in the expression rules and the controlled
  vocabulary. A rule firing on correct copy is a rule bug. A rule that hangs on
  correct copy is in scope above.
- Token values, theme choices, and component design.
- The licence granting less than a consumer would like.
- Scanner output with no demonstrated impact on this package.

## What happens next

An acknowledgement within five working days and an assessment within ten. A
valid finding gets a fix, a changeset, and a published version.

There is no bounty programme.

## Supported versions

Pre-1.0, and only the most recent published version is supported. There are no
backports to an earlier minor.

Consumers pin an exact version, so a fix reaches an application only when that
application bumps its pin. The `Consumers` workflow opens an issue against a
consumer left behind. For a security fix, treat that issue as the notification
rather than as a reminder.
