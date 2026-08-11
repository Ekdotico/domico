---
'@ekdotico/domico': minor
---

Ship the house style as documents consumers receive, and guard the one rule that had no guard.

The package owned the tokens and shipped no catalogue. Two consumers each kept
their own, and they had drifted until 388 of 452 lines differed — two independent
documents describing one token set, neither updated when its application migrated
onto the package. That is the drift that matters most, because enforcement hooks
feed those files to agents on every edit, so a stale copy does not merely mislead
a reader: it instructs a machine to reintroduce the fault it describes.

Three documents now ship, added to `files` and addressable through `exports`:

- `AGENTS.md` — the short form, for an agent about to make an edit. The four hard
  rules, and the eight things that get broken first by someone who has read them.
- `docs/design-tokens.md` — the canonical catalogue. 116 tokens, every value
  verified character-for-character against `tokens/generated/tokens.css`, with the
  when-not-to-use notes that were the most valuable content in either consumer
  copy. Colour values are pointed at rather than transcribed, so the document
  cannot disagree with the palettes.
- `docs/visual-ruleset.md` — the sixteen rules, each naming the guard that
  enforces it.

**Rules and state are now separated, and that is the substantive change rather
than a formatting one.** The first edition interleaved them: every rule carried
the file and line of the violation that motivated it, in the present tense. All
twenty of its factual claims were re-verified a day later and seventeen had been
fixed. A document that reports state inside its rules obliges a reader to
re-verify every rule before trusting any of it. Rules are now timeless; the three
surviving findings sit in one dated section.

Two claims the first edition got wrong are corrected rather than carried:

- The dark twins were described as hand-maintained. They are generated from one
  source, and `check:generated` byte-compares the output, so a hand edit is
  already rejected.
- Taking `fontConfig` from this package without restating it was presented as the
  fix for the italic axis. It cannot be done: `next/font` is a compile-time
  transform that requires explicitly written literals, so both the spread and the
  bare object fail the build while passing typecheck. The rule now says to guard
  the restatement instead of pretending it is removable.

### Rule 15 is now enforced

`ekdotico-check discipline` gains a `docfork` check: a consuming repository fails
if it keeps a local copy of a document this package ships, or if an instruction
file sends an agent to a local catalogue rather than the one in `node_modules`.
It was the only rule in the set with no mechanical enforcement, which is why it
was the one every repository broke.

### Removed: the Greek wordmark

`assets/logo/logo-wordmark-greek.svg` is deleted, and `brandAssets.wordmarkGreek`
goes with it. **This removes a public export**, which in 0.x lands in a minor.
Verified unused: no consumer references either the key or the file.

There is one logo and it is the hand-drawn mark, which is paths throughout. The
Greek wordmark set its letterforms in live `<text>`, so what it drew depended on a
webfont resolving in whatever context it was placed — a rendering of a name rather
than a mark. It was marked `UNFINISHED` in the asset itself and outlining it needed
tooling this repository does not have, so it was deleted rather than carried as a
permanent open finding.

The Latin wordmark has the same fault in two nodes and is kept for now. It is
recorded as the one remaining finding under rule 4 rather than left implicit.

### Also

- `check:contrast` now states two token constraints instead of omitting them. It
  checks `--fg-4` on `--bg-surface-2` at the 3:1 non-text threshold, which is
  where it measures 4.20:1–4.36:1 in the light palettes and is permitted only
  because its single use is icons — an absence could not distinguish "checked and
  permitted" from "never considered". `--fg-5` is recorded as decorative-only in a
  comment for the same reason. 136 pairs now measured across eight palettes.
- `ruleset/` carries the visual edition's source, so the artifact is versioned
  with the tokens it documents. `pnpm build:ruleset` builds it, `pnpm check:ruleset`
  holds it to its own rules and is now part of `pnpm check`.
- The ruleset build derives its typefaces from the docs font output rather than
  from a hand-written table of content hashes. The table had the Crimson Pro
  roman and italic transposed, so every upright serif glyph in the published
  document was drawn from the italic binary — and the document's own twenty-five
  compliance checks passed, because they check CSS patterns rather than which
  file a face resolves to.
