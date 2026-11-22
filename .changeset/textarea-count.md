---
'@ekdotico/domico': minor
---

`TextArea` takes `count`, a function from the value to its number, for a field whose server counts otherwise than in
UTF-16 units: code points, or after trimming white space. The remaining number, the invalid state and the announcement
follow it. Left out, the count is the length of the string as before, so nothing changes for a field that does not pass it.
It is read only together with `maximum`.
