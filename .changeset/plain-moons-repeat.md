---
'@ekdotico/domico': patch
---

`check-a11y`'s focus-ring check no longer accepts a selector that merely shares
a prefix with the one it is looking for.

`hasFocusReplacement` asked whether any focus-styled selector in the repository
*contained* the base as a substring. So a rule for `.cmdk-input-row` cleared the
finding for `.cmdk-input`, and a rule for `.icon-button` cleared it for a bare
`button` — different elements that happen to share a prefix or a suffix. The
failure is in the direction that matters: a control whose ring really was
removed, reported as fine because of an unrelated rule elsewhere in the sheet.
It was found on a consumer where the coincidence went the other way and the
guard passed for the right reason by accident.

The base must now appear as a whole token: the character after it cannot
continue the identifier, and for a base that is not class- or id-prefixed
neither can the character before it. Compound (`.a.b`), descendant (`.a .b`)
and `:has()` forms still count.

Where an ancestor carries the indicator, name the descendant so the
relationship is legible to a reader and checkable here — `.row:has(.field:focus)`
rather than a bare `.row:focus-within`, which says nothing about which control
it stands in for.
