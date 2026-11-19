---
'@ekdotico/domico': minor
---

A wide-screen frame, as a stylesheet an application takes by importing it:
`@ekdotico/domico/styles/frame.css`.

Above 1440 CSS pixels the body is capped at 1440px at the interface scale and
centred, with a one-pixel rule on each side. The ground beside it is the
theme's page colour under a 3% layer of black. It is not part of `styles.css`,
so nothing changes for an application that does not import it. An application
that enlarges its page with `zoom` on body sets `--frame-zoom` to that factor.
