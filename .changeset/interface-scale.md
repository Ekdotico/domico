---
"@ekdotico/domico": minor
---

Add `--scale`, the interface scale: one factor, 1 by default, in the type, spacing and layout tokens and in every stylesheet length above 3px that is not a line or a shadow. An application sets `:root { --scale: 1.5 }` under a media query for an interface half as large again on a very wide screen, in place of `zoom`, which displaced the positions scripts write from `getBoundingClientRect`. At 1 every computed value is unchanged; `check:scale` holds the sources and tokens to that. Radii, shadows, hairlines, breakpoints and icon sizes do not take the factor.
