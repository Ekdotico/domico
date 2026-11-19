---
'@ekdotico/domico': patch
---

docs: a label above a title is avoided as common practice

The owner decided on 2026-11-19 that a heading stands without a small label
above it. Nothing is removed: the `.eyebrow` role and the `eyebrow` prop of
`AccessGate` remain for the rare case with a stated reason. `AGENTS.md` gains
"Labels above titles", the role and the prop say to avoid them, and the
`AccessGate` examples no longer pass the prop.
