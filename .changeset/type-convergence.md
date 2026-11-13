---
'@ekdotico/domico': patch
---

Type is now consistent across components. Values change; no class or token is added or removed.

What a reader will see:

- **Key-value values and callout bodies are larger.** `.kv-val` and `.callout-body` (and a paragraph inside one) move from 13px to 17px (`--fs-md`), the serif reading size, so a fact or a note reads at the size of the page's long-form text. `KeyValueList` cards and inline lists wrap onto more lines; both still fit at 360px.
- **Data labels share one style.** Table headers and captions, `KeyValue` keys, `Stat` labels, `Callout` titles and `.badge` are all 11px (`--fs-2xs`), semibold, at `--tr-label`. Table headers and captions grew from 10px; stat labels shrank from 13px; callout titles and badges changed tracking (callout titles `--tr-wider` to `--tr-label`, badges `--tr-wide` to `--tr-label`, medium to semibold).
- **Section eyebrows share one style.** `.eyebrow` was already 13px, `--tr-widest`, medium; the `OnThisPage` eyebrow now matches it (it was 10px).
- **Inline `code`, `kbd` and `samp` outside a code block are set at `--serif-fit`** (0.84em), so mono beside serif no longer looks oversized. Code blocks (`pre`) are unchanged.
- Table cell and badge line-heights use `--lh-normal` (1.5) instead of 1.45 and 1.4. The key-value card padding and bottom margin, and the row gap, use space tokens where one matches.

`Stat` sub-lines stay 13px: they are a short italic caption, not running text.
