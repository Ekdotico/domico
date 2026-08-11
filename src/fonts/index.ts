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
 * `--font-mono` tokens resolve.
 *
 * IMPORTANT, and it is not a style preference: `next/font` is a COMPILE-TIME
 * transform, and it requires every option to be an explicitly written literal
 * at the call site. It cannot be handed this object.
 *
 *     const serif = Crimson_Pro(fontConfig.serif);   // Font loader values must
 *                                                   // be explicitly written
 *                                                   // literals
 *     const serif = Crimson_Pro({ ...fontConfig.serif });          // Unexpected
 *                                                                 // spread
 *
 * Both forms fail the build, and neither fails typecheck — which is how they
 * reached a branch that had passed typecheck, lint and tests. So the options are
 * retyped at the call site, and `fontConfig` below is the statement of what they
 * must say rather than a value to pass:
 *
 *   import { Crimson_Pro, Commissioner, Fira_Code } from 'next/font/google';
 *
 *   const serif = Crimson_Pro({
 *     subsets: ['latin'], display: 'swap',
 *     variable: '--font-crimson-pro', style: ['normal', 'italic'],
 *   });
 *   const sans = Commissioner({
 *     subsets: ['latin'], display: 'swap', variable: '--font-commissioner',
 *   });
 *   const mono = Fira_Code({
 *     subsets: ['latin'], display: 'swap', variable: '--font-fira-code',
 *   });
 *
 *   <html className={`${serif.variable} ${sans.variable} ${mono.variable}`}>
 *
 * Because that duplication cannot be removed, it should be guarded. praktico
 * asserts in `src/app/layout.test.ts` that every option `fontConfig` declares is
 * present at the call site, deriving the expected set from this module — so the
 * copy stays honest even though it is a copy. Do the same in any consumer.
 *
 * The serif MUST request the italic axis. `.theme-btn.active .theme-name` and
 * the `.lede` utility both set `font-style: italic` on `--font-serif`, so an
 * application that omits it renders a browser-synthesised oblique on every page.
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
