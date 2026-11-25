---
"@ekdotico/domico": patch
---

A key-value row fits its own column. It stacked the value under the key only below a 760px viewport, so in a column about 420px wide on a wide screen the value track shrank to nothing and the text ran one character to a line, outside its card. The row now wraps by its own width: the key keeps its track, the value needs at least 240px, and a row narrower than both stacks. Long unbroken values such as paths wrap at the edge. A row wide enough looks as before.
