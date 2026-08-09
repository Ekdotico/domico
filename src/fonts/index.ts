/**
 * Font loading configuration.
 *
 * The package ships configuration, not font files. All three families are
 * SIL OFL 1.1 and redistributable, but `next/font/google` fetches and
 * self-hosts them at build time, emitting preload hints and a size-adjust
 * fallback automatically. Vendoring the binaries would give up that pipeline
 * and gain nothing.
 *
 * Each family exposes the CSS variable that the token layer expects. Wire all
 * three at the application root, then the `--font-serif`, `--font-sans`, and
 * `--font-mono` tokens resolve:
 *
 *   import { Crimson_Pro, Commissioner, Fira_Code } from 'next/font/google';
 *   import { fontConfig } from '@ekdotico/design-system/fonts';
 *
 *   const serif = Crimson_Pro(fontConfig.serif);
 *   const sans  = Commissioner(fontConfig.sans);
 *   const mono  = Fira_Code(fontConfig.mono);
 *
 *   <html className={`${serif.variable} ${sans.variable} ${mono.variable}`}>
 *
 * For a non-Next consumer, `fontFaceUrls` gives the equivalent stylesheet
 * hrefs; define the same three CSS variables yourself.
 *
 * Amended 2026-08-09. The earlier specification named Source Serif 4, Inter
 * Tight, and JetBrains Mono. The families below are canonical.
 */

export const fontVariables = {
  serif: '--font-crimson-pro',
  sans: '--font-commissioner',
  mono: '--font-fira-code',
} as const;

/** Roles, and the family that fills each. Never mix roles. */
export const fontFamilies = {
  serif: 'Crimson Pro',
  sans: 'Commissioner',
  mono: 'Fira Code',
} as const;

/**
 * Options objects for `next/font/google`.
 *
 * `display: 'swap'` is deliberate. The fallback stacks in the token source are
 * chosen to be metric-sympathetic, so a swap does not reflow the reading
 * column, and showing text immediately matters more than avoiding one repaint.
 *
 * The serif requests italic as well as normal: the `.lede` utility and MDX
 * emphasis both use it, and a synthesised oblique is visibly worse.
 */
export const fontConfig = {
  serif: {
    subsets: ['latin'],
    display: 'swap',
    variable: fontVariables.serif,
    style: ['normal', 'italic'],
  },
  sans: {
    subsets: ['latin'],
    display: 'swap',
    variable: fontVariables.sans,
  },
  mono: {
    subsets: ['latin'],
    display: 'swap',
    variable: fontVariables.mono,
  },
} as const;

/** Google Fonts stylesheet URLs, for consumers outside the Next font pipeline. */
export const fontFaceUrls = {
  serif:
    'https://fonts.googleapis.com/css2?family=Crimson+Pro:ital,wght@0,200..900;1,200..900&display=swap',
  sans: 'https://fonts.googleapis.com/css2?family=Commissioner:wght@400;500;600;700&display=swap',
  mono: 'https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500&display=swap',
} as const;

/** SPDX identifiers, so a consumer can generate an attribution page. */
export const fontLicences = {
  'Crimson Pro': 'OFL-1.1',
  Commissioner: 'OFL-1.1',
  'Fira Code': 'OFL-1.1',
} as const;
