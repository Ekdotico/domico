/**
 * Brand asset manifest.
 *
 * The files live under `assets/` in the published package. This module makes
 * them addressable and typed, so a consumer resolves an asset by intent rather
 * than by guessing at a path, and a missing size is a type error instead of a
 * broken image.
 *
 * Resolve a URL with the bundler's own mechanism:
 *
 *   import { logoAssetPath } from '@ekdotico/domico/assets';
 *   const src = new URL(logoAssetPath('branded', 'transparent', 120, 'SVG'),
 *                       import.meta.url).href;
 *
 * For React, prefer the `LogoMark` component: it draws from tokens, scales to
 * any size, and adapts to the active theme. Reach for a file only where an SVG
 * element will not do — a favicon, an Open Graph image, an email signature, or
 * a document template.
 */

/**
 * - `original` — the mark in oxford plum.
 * - `dark` — the mark in white, for dark grounds.
 * - `branded` — the mark on a filled accent tile.
 */
export type LogoVariant = 'original' | 'dark' | 'branded';

/** `solid` carries an opaque background; `transparent` does not. */
export type LogoFill = 'solid' | 'transparent';

/** Every size present. 16 is the favicon grade; 520 is the largest raster. */
export const logoSizes = [16, 32, 120, 250, 360, 460, 520] as const;
export type LogoSize = (typeof logoSizes)[number];

export type LogoFormat = 'SVG' | 'PNG';

export const logoVariants: LogoVariant[] = ['original', 'dark', 'branded'];
export const logoFills: LogoFill[] = ['solid', 'transparent'];

/**
 * Package-relative path to one mark file.
 *
 * Prefer SVG at every size. The PNG set exists for surfaces that cannot take
 * vector artwork: email clients, some document formats, and older OG scrapers.
 */
export function logoAssetPath(
  variant: LogoVariant,
  fill: LogoFill,
  size: LogoSize,
  format: LogoFormat = 'SVG',
): string {
  return `../assets/logo/${format}/${size}x/mark-${variant}-${fill}.${format.toLowerCase()}`;
}

/**
 * Standalone marks and wordmarks, outside the sized grid.
 *
 * The Greek wordmark is the Ekdotico name set in Greek characters. It is a
 * brand asset in its own right, not a localisation of the Latin wordmark, and
 * it is not interchangeable with it — check before using either.
 */
export const brandAssets = {
  mark: '../assets/logo/logo-mark.svg',
  markBranded: '../assets/logo/logo-mark-branded.svg',
  wordmark: '../assets/logo/logo-wordmark.svg',
  wordmarkGreek: '../assets/logo/logo-wordmark-greek.svg',
} as const;

/**
 * Usage rules. These are constraints, not suggestions: the mark is the only
 * custom icon in the system, and its consistency is most of what makes it read
 * as a mark rather than as decoration.
 */
export const logoRules = [
  'The mark is the only custom SVG icon in the system. Every other icon is Lucide at 1.5px stroke, 16px default.',
  'Do not recolour the mark outside the three variants. The tile colours are brand-fixed tokens and do not follow the theme.',
  'Do not stretch, rotate, outline, or add effects. No shadow, no glow, no gradient.',
  'Keep clear space around the mark of at least a quarter of its width.',
  'Below 32px use the solid tile variants: the stroke weight is too fine to read on a busy ground at smaller sizes.',
  'Never reconstruct the mark from the path data in LogoMark. Use the component or a file.',
] as const;
