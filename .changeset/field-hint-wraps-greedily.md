---
'@ekdotico/domico': patch
---

**Fixed: a field hint fills the width of its control on iPhone.** `.ekd-field-hint` inherited `text-wrap: pretty` from the reset, and WebKit's pretty evens the rag over the whole paragraph rather than only its last line. Under a full-width field every line of a hint therefore ended well short of the field's edge, and the hint read as narrower than its own control: on the alpha site, "Optional. Once you confirm your address…" under the user-testing box. Reported by the owner, 2026-11-02.

The hint now sets `text-wrap: wrap`, so its lines fill the column. Paragraphs elsewhere keep `pretty`. This affects every hint rendered by `TextField`, `TextArea`, `Select`, `PasswordField`, and `Choice`. Nothing is added, renamed or removed, and a consumer has to change nothing.
