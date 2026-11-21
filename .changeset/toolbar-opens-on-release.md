---
'@ekdotico/domico': patch
---

docs: a floating toolbar over a text selection opens once the selection is complete

The guidance for `Toolbar` with `floating`, in its JSDoc and in the README's
"The toolbar and the toggle button", now says when an application shows it.
While a pointer button is held down to drag a selection the toolbar stays
hidden, and it opens when the button is released, wherever that happens. A
selection made by keyboard shows it at once. A toolbar that appeared and moved
during the drag would cover the text being selected and pull the eye away. The
application still places the toolbar and owns showing it, because the package
cannot see the editor's pointer state. No behaviour, prop or style changes.
