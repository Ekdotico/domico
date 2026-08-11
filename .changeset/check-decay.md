---
'@ekdotico/domico': minor
---

Add `ekdotico-check decay` — the drift a commit-triggered gate cannot see.

`discipline` catches what a change introduces. This catches what rots without one:
a path that was correct until a file moved, a URL that was live until DNS changed, a
version that was current until a release. **No pull request causes any of those, so
no per-pull-request gate can find them.** A dead apex domain sat in this estate for
weeks, feeding every canonical URL and every link-unfurl image, and every character
of the sentence naming it still parsed.

Five checks, chosen because they would have caught roughly twenty of the thirty
findings in the audit that prompted this:

| Check | What it reads |
| --- | --- |
| `paths` | a file path named in an instruction file that does not exist |
| `scripts` | a `pnpm <script>` named in a document that `package.json` lacks |
| `guards` | an `ekdotico-check <guard>` named in a document that does not exist |
| `urls` | an `http(s)` URL in a document that no longer answers |
| `version` | `@ekdotico/domico` not pinned exactly, or out of step with the lockfile |

It reads instruction files — `CLAUDE.md`, `AGENTS.md`, `README.md`, `.impeccable.md`,
and `.claude/{commands,hooks,agents,skills,rules}/` — and skips dated records, for
the same reason `discipline` does: a path that was correct in May is not a defect in
August, and rewriting a record to satisfy a guard falsifies the history it keeps.

### Four exemptions, every one of them found by running it

The first pass reported 27 findings in this package alone and every one was wrong.
Each exemption below is a distinction the guard has to make and could not make
naively:

- **A package specifier is not a path.** `@ekdotico/domico/tokens.css` resolves
  through an exports map; no such file sits at a repository root. Export subpaths are
  read from the manifest — the calling repository's and its installed dependencies' —
  so the list stays current without this guard hardcoding what the package ships.
- **A fenced block illustrates; prose asserts.** An example config naming
  `components/CommandPalette.tsx` describes somebody else's tree.
- **Prose asserting a file is ABSENT is correct documentation.** "There is no
  `src/styles/base.css`" is true and useful. The window spans the line before and
  after, because the negation lands after the reference as often as before it — one
  sentence put the cue on the following line and the two-line version reported
  correct documentation as a stale path.
- **`pnpm` in prose is not an invocation.** "pnpm never installs it transitively"
  and "`pnpm deploy` is a built-in pnpm command" produced findings for scripts named
  `never` and `command`. Only code spans are read now.

Both halves are mutation-tested: a genuinely stale path and a genuinely missing
script are still reported.

**It is deliberately not in `pnpm check`.** The URL half needs the network, and a
gate that goes red when a runner's DNS hiccups gets switched off — network failures
are reported as inconclusive rather than as findings for the same reason. Run it on a
schedule and on a batch of commits, which is what the `audit.yml` workflow added
alongside this does.

And what it cannot do is worth stating plainly, because the gap is where the next
failure will live: **it finds a reference that does not resolve; it cannot find a
sentence that is false.** "The production site is `https://ekdoti.co`" needs a
reader.
