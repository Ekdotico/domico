/**
 * Types for color.mjs, published as `@ekdotico/domico/color`: the package's
 * OKLCH <-> sRGB maths, for a surface that cannot paint oklch(). Mermaid's
 * palette is generated with it; a consumer reaches for it where a renderer
 * takes no CSS custom properties and no oklch(), such as an Open Graph image
 * drawn by Satori. The colours stay the tokens'; only their notation changes.
 */

/** Parse `oklch(L% C H)` or `oklch(L% C H / A)`. Null for anything else. */
export function parseOklch(
  value: string,
): { L: number; C: number; H: number; alpha: number | null } | null;

/** OKLCH -> sRGB hex. Out-of-gamut channels clip. Null for anything that is not oklch(). */
export function oklchToHex(value: string): string | null;

/** WCAG relative luminance of an sRGB hex colour. */
export function luminance(hex: string): number;

/** WCAG contrast ratio between two sRGB hex colours. */
export function contrast(a: string, b: string): number;

/** sRGB hex -> OKLCH string. */
export function hexToOklch(hex: string): string;
