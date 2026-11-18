---
'@ekdotico/domico': patch
---

fix: an empty block grows to hold a prompt that wraps

The editor's prompt was a float with no height, so on a narrow editor or with a
wide `--ekd-editor-placeholder-offset` its second line was drawn outside the
block and over what came after. It is now an inline box as wide as the line,
whose end margin takes that width back, and as tall as its text: a prompt that
wraps makes its line, and so its block, as tall as the wrapped text, whether
`data-placeholder` is on the block or on an element inside it. A prompt of one
line, the caret at the start of the line and the offset are unchanged.
