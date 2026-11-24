---
'@ekdotico/domico': minor
---

`EditableTitle`, a page title that is edited where it stands. It looks like `PageHeading`, is the page's one `<h1>` with a textarea inside it, and wraps and grows with a long title. `label` is its accessible name and has no default; Enter or leaving the field calls `onSave(value)` when the title changed, and Escape puts the saved title back. `pending` sets `aria-busy` and ignores input without disabling the field, `error` draws a field message linked by `aria-describedby`, and `readOnly` draws a `PageHeading`. Its styles are in `styles/page-heading.css`.
