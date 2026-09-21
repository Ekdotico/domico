---
"@ekdotico/domico": patch
---

`LICENSE` clause 4 names the three typefaces the package actually references: Crimson Pro, Commissioner, and Fira Code. It still named Source Serif 4, Inter Tight, and JetBrains Mono, the families the 2026-08-09 amendment retired. That amendment reached the tokens, `src/fonts`, and the Expression Guidelines, and did not reach the licence, so the one document that states what third-party components the software depends on described a font set the package had not loaded for six weeks.

All three canonical families are under the SIL Open Font License 1.1, as the three they replaced were, so the rest of the clause stands unchanged. The remaining mentions of the retired names in `src/fonts/index.ts`, `tokens/source/font.json`, and `expression/guidelines.md` are history, written in the past tense, and are left alone.

Found from Praktico, whose specification carried the same stale name in FR-AR-11 and FR-AU-16 until its amendment 1.12.
