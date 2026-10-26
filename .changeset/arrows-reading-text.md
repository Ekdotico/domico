---
"@ekdotico/domico": minor
---

**Changed: the arrow on a link appears in reading text only.** Since 0.35.0 every link without a class had one, which put it on navigation links, on the titles in a list of documents, on the entries of a table of contents and on links inside the text a writer is editing. Decided by the owner, 2026-10-26.

- **A link has the arrow when it is inside a paragraph or a quotation** (`p`, `blockquote`): a link in a sentence of ordinary page copy, as before, in the same box and the same direction by `href`.
- **A link has no arrow** when it is a navigation link, an entry in a list of titles, a table of contents entry (`.ekd-toc`), a link in a table cell or a heading, anything inside a `nav`, or anything inside an editable surface (`[contenteditable="true"]` and its descendants), even where a paragraph surrounds it.

The underline, the colour on hover and focus, and the direction rules are unchanged; only the box is drawn in fewer places. Nothing is added, renamed or removed, and a consumer has to change nothing: a link in a paragraph keeps its arrow. A link in bare text outside any `p` (a list item or a `div` of prose) no longer has one; wrap the text in a `p` if it should.

**Changed: the footnote marker no longer draws an enlarged target.** `.ekd-footnote-ref::after`, the invisible 24 by 24 square centred on the number, is removed, along with the `position: relative` it needed. In an editor it caught clicks 4 to 8px beside the number that were meant for the text. A marker is inside a sentence, which WCAG 2.2 SC 2.5.8 exempts from the 24px minimum (the Inline exception). The marker is still a link, keeps its colour, underline and focus ring, and takes no room in the line. A consumer that styled `.ekd-footnote-ref::after` itself should drop that rule.
