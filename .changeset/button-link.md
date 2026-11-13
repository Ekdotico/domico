---
'@ekdotico/domico': minor
---

Adds `ButtonLink`, the button's skin on an `<a>`, for navigation. It takes the four `Button` variants and passes anchor attributes through (`href` is required); it has no pending or disabled state. Use `Button` for an action and `ButtonLink` for a control that goes somewhere, rather than putting `.ekd-button` on your own `<a>`.

The skin on an anchor now holds against an application's link rules. `a.ekd-button[data-variant]` states colour, background, all four border sides and `text-decoration: none` in `:link`, `:visited`, `:hover`, `:active` and `:focus-visible`, at specificity (0,3,1), so rules such as `.content-inner a:hover` (0,2,1) no longer turn a primary label into its own fill. The primary variant's hover now also sets its colour. `<button>` rendering is unchanged.

Height stays about 40px for `Button` and `ButtonLink`; an application that needs a 44px target adds `padding-block` to its own class.
