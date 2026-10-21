---
'@ekdotico/domico': patch
---

**Changed: the arrow on links in running text.** It sits in a small rounded box and takes the link's own colour again: the paragraph's at rest, the accent on hover and focus. Requested by the owner, who reversed the always-accent arrow of 0.36.0. Box and arrow are one `currentColor` mask at `0.7em`, and forced colours still paint it `LinkText`. Nothing is added or removed.
