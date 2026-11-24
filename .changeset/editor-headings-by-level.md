---
'@ekdotico/domico': minor
---

The editor stylesheet styles a heading by `data-level="1"`, `"2"` or `"3"` when the editor sets one, on any heading tag, so an application can draw the text's headings as `h2`, `h3` and `h4` and keep their look. The tag rules stay: an `h1`, `h2` or `h3` with no level looks as it did. One thing changes for a consumer that has one: an `h4`, `h5` or `h6` inside `.ekd-editor` with no `data-level` loses the browser's default margin, because the editor's margin reset now names `h1` to `h6`.
