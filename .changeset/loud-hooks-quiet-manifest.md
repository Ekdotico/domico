---
'@ekdotico/domico': patch
---

`install-agent-hooks` reports on stderr, so it cannot corrupt the tarball
manifest it is printed in front of.

The installer announced its work on stdout. It runs as `prepare`, and `npm pack`
runs `prepare` before it prints — so with `--json` that one line was emitted
into the middle of the manifest, and `check:exports`, which parses that manifest,
died on it:

    SyntaxError: Unexpected token 'i', "install-ag"... is not valid JSON

The line is only printed when a hook is actually written, which is the tell that
made this hard to see. On a fresh clone `.claude/hooks/` is absent — it is
gitignored, being a build output — so the first `pnpm check` installed the hook,
said so, and failed; the second had nothing to write, said nothing, and passed.
CI never saw it because `pnpm install` runs `prepare` before `pnpm check` does,
so the write was already spent by the time anything packed. It waits for the
next path that packs before installing.

Fixed at the installer rather than at the parse: any consumer of
`npm pack --json` in this repository shares the exposure, and stdout is the
manifest's channel while a progress note is a diagnostic. `pnpm install` still
shows the line. The parse now carries a comment saying whose channel it is, so
the next lifecycle script prints on the right one.

Verified by driving `check:exports` against the state that produced it — the
hooks directory moved aside, so the install genuinely happens — before and
after: `SyntaxError` before, a parsed manifest after.
