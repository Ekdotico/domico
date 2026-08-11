---
'@ekdotico/domico': minor
---

Make the guards match the rules, and teach `docfork` to read hooks.

An audit of the estate against the documents 0.12.1 shipped found that the
document defining rule 15 broke rule 15: three rules cited `check:styles` as their
guard and `check:styles` checked none of them. It proved the shipped stylesheets
parse and nothing more. The claims are now true rather than softened.

`check:styles` additionally rejects:

- **A `0.01ms` motion ceiling** anywhere in the shipped stylesheets. Comments are
  stripped first, because `reset.css` carries a long note explaining why the
  ceiling is wrong, and a guard that cannot tell an explanation from a declaration
  would fail on the one file that gets this right.
- **A coloured edge stripe** — an inline border above 1px whose colour does not come
  from the rule scale. The adjective is the test, and finding that took two
  attempts. One-sidedness was the first, and it failed on six legitimate
  declarations: the table component draws a four-sided outline cell by cell, because
  a table cannot take a border with rounded corners cleanly, and the symmetry lives
  across sibling selectors rather than within one rule. What separates the banned
  pattern from that outline is that a stripe signals tone with an accent while an
  outline is a hairline in `--rule`.

Both were mutation-tested.

### `docfork` now reads hooks, under the opposite rule

The check walked markdown only, and both consuming applications' PreToolUse hooks
were still injecting the deleted local catalogue path into an agent on every
styling edit. One opened with "Read the catalogue first — docs/design-tokens.md,
end to end" for a file that had been deleted. The guard was silent.

Hooks now get their own arm, and the rule there is inverted deliberately. A
document waits to be read, so a sentence naming a deleted file is usually history
and stays exempt. A hook injects its text on every matching edit, so it is never
history: it is an instruction being given now, and a local path is wrong whichever
way it resolves — a fork if the file exists, a dangling instruction if it does not.

Two refinements came from running it. A shell `case` arm is a pattern deciding
whether the hook fires, not text handed to a model, so document names there are
matchers and are exempt — the first version flagged two and would have left the
hook unfixable. And the test is per match rather than per line, because a hook's
payload is one enormous single-line JSON string carrying the correct package
reference and the stale local one at once; a line-level allowance let the real
defect through while still reporting the comments above it.

### `ekdotico-check` forwards flags

`ekdotico-check discipline --quiet` exited 2 with "no guard named --quiet" while
every check underneath it passed. Same fails-green shape as reading a trailing `.`
as a guard name, and just as bad in a pipeline: the gate goes red with nothing
wrong. Unrecognised `--flags` are forwarded to the guard, which owns them.

### Documents

- `AGENTS.md` pointed twice at "rule 14" for the documentation-contradiction rule.
  That is rule 15; rule 14 is contrast. An agent following the pointer landed on
  the wrong rule.
- `docs/visual-ruleset.md` is re-stamped to 0.12.1, and its Current state section is
  down to one finding. Two of the three it shipped with were closed within hours by
  the same work that shipped it, which is recorded there as the argument for keeping
  state out of the rules.
- The Latin wordmark sets **one** node in live `<text>`, not two. The second grep
  hit was the file's own comment.
- Three dead references to the deleted Greek wordmark are gone: the ruleset template
  described it in the present tense, and `logo-wordmark.svg` pointed at a longer note
  inside it. That reasoning is now recorded in `logo-wordmark.svg` itself.
