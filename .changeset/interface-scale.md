---
"@ekdotico/domico": minor
---

Add `--scale`, the interface scale. It is one factor, 1 by default, that an application sets on `:root` (for example `:root { --scale: 1.5 }` under a media query) for an interface half as large again on a very wide screen. It replaces `zoom`, which displaced the positions scripts write from `getBoundingClientRect`.

The factor applies to:

- the type, spacing, radius and layout tokens, including the fluid middle term of `--fs-display` and `--fs-lede`;
- every `rem` length in the stylesheets, and every `px` length above 3px that is not a line or a shadow;
- icons, through a new reset rule and an `--ekd-icon-size` custom property each icon writes.

Icon props are unchanged. An icon given its own `width` or `height` does not take the factor.

At 1, every computed value is unchanged; `check:scale` holds the sources, tokens and icons to that. Shadows, hairlines and breakpoints do not take the factor.
