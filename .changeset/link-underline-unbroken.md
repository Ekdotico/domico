---
"@ekdotico/domico": patch
---

**Fixed: a link's underline no longer breaks around descenders.** The browser's default, `text-decoration-skip-ink: auto`, lifts the underline wherever a letter drops below the line, so at the package's 0.15em offset every g, j, p, q and y cut it: on the alpha site "How your address is kept" was underlined in three pieces and read as clipped. Reported by the owner, 2026-10-28.

Every link underline the package draws now sets `text-decoration-skip-ink: none` and runs unbroken from the first letter to the last: the unclassed link in the reset, `.ekd-fault-list a`, a link in `.ekd-editor`, `.ekd-toc-list a:hover` and `.ekd-footnote-ref`. The offset, thickness, colour and arrow are unchanged. Nothing is added, renamed or removed, and a consumer has to change nothing.
