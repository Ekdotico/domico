#!/usr/bin/env node
/**
 * Token build. Reads tokens/source/*.json and emits every consumable artefact.
 *
 * Never edit anything under tokens/generated/ by hand. `pnpm check:generated`
 * regenerates into a temporary directory and fails the build on any difference,
 * so a hand edit is caught in CI rather than surviving as invisible drift.
 *
 * Transform note: the build deliberately does NOT use Style Dictionary's `css`
 * transform group. That group includes `color/css`, which would parse each
 * value and re-serialise it as hex or rgb — silently undoing the OKLCH source.
 * Only `name/kebab` is applied; values pass through verbatim, which is correct
 * here because the source is already authored in final CSS syntax.
 */

import StyleDictionary from 'style-dictionary';
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { oklchToHex, hexToOklch, parseOklch } from './lib/color.mjs';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const SRC = join(ROOT, 'tokens', 'source');
const OUT = join(ROOT, 'tokens', 'generated');
mkdirSync(OUT, { recursive: true });

const THEMES = ['parchment', 'library', 'sepia', 'mono'];
const MODES = ['light', 'dark'];
const BANNER = `/**\n * GENERATED FILE — DO NOT EDIT.\n * Source: tokens/source/*.json · Regenerate: pnpm build:tokens\n * Hand edits are rejected by pnpm check:generated.\n */\n`;

/** Emit `--name: value;` lines, indented, in source order. */
function declarations(dictionary, indent) {
  return dictionary.allTokens
    .map((t) => `${indent}--${t.name}: ${t.$value ?? t.value};`)
    .join('\n');
}

StyleDictionary.registerFormat({
  name: 'ekd/declarations',
  format: ({ dictionary, options }) => declarations(dictionary, options.indent ?? '  '),
});

/** Run Style Dictionary over one source file and return its declaration block. */
async function block(file, indent = '  ') {
  const sd = new StyleDictionary({
    source: [join(SRC, file)],
    log: { verbosity: 'silent', warnings: 'disabled' },
    platforms: {
      css: {
        transforms: ['name/kebab'],
        files: [{ destination: 'x', format: 'ekd/declarations', options: { indent } }],
      },
    },
  });
  const built = await sd.formatPlatform('css');
  return built[0].output.replace(/\n$/, '');
}

// ---------------------------------------------------------------------------
// 1. tokens.css — the eight palettes plus the theme-invariant scales
// ---------------------------------------------------------------------------

const light = {};
const dark = {};
for (const t of THEMES) {
  light[t] = await block(`color.${t}.light.json`);
  dark[t] = await block(`color.${t}.dark.json`);
}
const structural = [
  await block('font.json'),
  await block('type.json'),
  await block('space.json'),
  await block('radius.json'),
  await block('motion.json'),
  await block('layout.json'),
  await block('brand.json'),
].join('\n\n');

const css = `${BANNER}
/* ===========================================================================
   Themes. Four palettes, two modes, one set of token names.

   A consumer switches theme by switching values, never by switching names.
   Parchment is both the default and the complete base set: the other three
   light palettes declare only what they override and inherit the rest.

   Shadows are the exception, and every light palette declares its own complete
   set. Elevation reads as light falling on the page, so its colour has to come
   from the same place the page does: warm brown under Parchment, green under
   Library, red-brown under Sepia, neutral under Mono. Inheriting any part of
   that set put a warm-brown hairline on a monochrome canvas, and left Library
   and Sepia tinting their three elevation shadows while their ring and inset
   stayed parchment — one light source rendered in two colours.
   =========================================================================== */

:root,
[data-theme="parchment"] {
${light.parchment}

  color-scheme: light;
}

[data-theme="library"] {
${light.library}
}

[data-theme="sepia"] {
${light.sepia}
}

[data-theme="mono"] {
${light.mono}
}

/* ===========================================================================
   Dark mode. Each theme is calibrated separately rather than sharing one
   dark palette. Every block below is emitted twice from a single source: once
   for an explicit [data-mode="dark"] choice, and once inside a
   prefers-color-scheme block for consumers who have expressed no preference.
   =========================================================================== */

${THEMES.map((t) => `[data-theme="${t}"][data-mode="dark"] {\n${dark[t]}\n\n  color-scheme: dark;\n}`).join('\n\n')}

@media (prefers-color-scheme: dark) {
${THEMES.map((t) => `  [data-theme="${t}"]:not([data-mode]) {\n${dark[t].replace(/^ {2}/gm, '    ')}\n\n    color-scheme: dark;\n  }`).join('\n\n')}
}

/* ===========================================================================
   Theme-invariant scales. Type, spacing, radius, and motion do not change
   between themes or modes.
   =========================================================================== */

:root {
${structural}
}
`;

writeFileSync(join(OUT, 'tokens.css'), css);

// ---------------------------------------------------------------------------
// 2. tokens.ts — typed access to every value, for consumers that need a token
//    outside a stylesheet (canvas, meta[name=theme-color], SVG, email)
// ---------------------------------------------------------------------------

const read = (f) => JSON.parse(readFileSync(join(SRC, f), 'utf8'));
const values = (f) =>
  Object.fromEntries(
    Object.entries(read(f))
      .filter(([k, v]) => !k.startsWith('$') && v && typeof v === 'object' && '$value' in v)
      .map(([k, v]) => [k, v.$value]),
  );

const palettes = {};
for (const t of THEMES) {
  palettes[t] = { light: values(`color.${t}.light.json`), dark: values(`color.${t}.dark.json`) };
}
const scales = {
  font: values('font.json'),
  type: values('type.json'),
  space: values('space.json'),
  radius: values('radius.json'),
  motion: values('motion.json'),
  layout: values('layout.json'),
  brand: values('brand.json'),
};

const ts = `${BANNER}
/** The four theme names. Parchment is the default. */
export const themeNames = ${JSON.stringify(THEMES)} as const;
export type ThemeName = (typeof themeNames)[number];

/** The two colour modes. Absence of an explicit mode means "follow the system". */
export const modeNames = ${JSON.stringify(MODES)} as const;
export type ModeName = (typeof modeNames)[number];

/**
 * Every colour token, by theme and mode.
 *
 * Only Parchment is complete. The other light palettes carry just their
 * overrides, mirroring the CSS cascade — resolve through \`resolveTokens\`
 * rather than indexing these directly if you need a guaranteed value.
 */
export const palettes = ${JSON.stringify(palettes, null, 2)} as const;

/** Theme-invariant scales: type, spacing, radius, motion, and the font stacks. */
export const scales = ${JSON.stringify(scales, null, 2)} as const;

/** Canonical colour token names, taken from the complete Parchment set. */
export const colorTokenNames = Object.keys(palettes.parchment.light) as ColorToken[];
export type ColorToken = keyof typeof palettes.parchment.light;

/**
 * Resolve the full colour set for a theme and mode, applying the same
 * inheritance the stylesheet applies: a partial palette falls back to
 * Parchment light for anything it does not declare.
 */
export function resolveTokens(
  theme: ThemeName = 'parchment',
  mode: ModeName = 'light',
): Record<ColorToken, string> {
  const base = palettes.parchment.light as Record<string, string>;
  const layer = palettes[theme][mode] as Record<string, string>;
  return { ...base, ...layer } as Record<ColorToken, string>;
}
`;

writeFileSync(join(OUT, 'tokens.ts'), ts);

// ---------------------------------------------------------------------------
// 3. mermaid.ts — the same palettes, converted to hex
// ---------------------------------------------------------------------------

// Round-trip self-check. Every colour in the source must survive
// oklch -> hex -> oklch unchanged to 2 decimal places of hue, which confirms
// the conversion below is not quietly shifting the palette.
let checked = 0;
for (const t of THEMES) {
  for (const m of MODES) {
    for (const [name, value] of Object.entries(palettes[t][m])) {
      if (!parseOklch(value)) continue;
      const hex = oklchToHex(value);
      const back = hexToOklch(hex);
      const a = parseOklch(value);
      const b = parseOklch(back);
      const drift = Math.max(Math.abs(a.L - b.L) * 100, Math.abs(a.C - b.C) * 100);
      if (drift > 0.6) {
        throw new Error(`round-trip drift on ${t}.${m} --${name}: ${value} -> ${hex} -> ${back}`);
      }
      checked++;
    }
  }
}

const pick = (theme, mode) => {
  const r = { ...palettes.parchment.light, ...palettes[theme][mode] };
  const hex = (n) => (parseOklch(r[n]) ? oklchToHex(r[n]) : r[n]);
  // Mapped onto Mermaid's themeVariables contract. Grouped by what Mermaid
  // uses each slot for, not alphabetically, so a missing slot is obvious.
  return {
    background: hex('bg-surface'),
    primaryColor: hex('bg-surface'),
    primaryTextColor: hex('fg-1'),
    primaryBorderColor: hex('rule-strong'),
    // Diagram edges are per-theme, and --gilt is not the token for them. This
    // slot read hex('gilt'), which flattened all four themes to the same warm
    // gold — a gilt arrow on the Library canvas and on the Mono canvas alike.
    // The documentation site had already diverged on exactly this, giving each
    // theme its own edge colour in a 216-literal fork of this file, and that
    // treatment is the one being adopted: gilt under Parchment, forest under
    // Library, terracotta under Sepia, and ink or paper under Mono. It is a
    // token rather than a branch here, so the same colour is available to CSS.
    lineColor: hex('diagram-edge'),
    secondaryColor: hex('bg-surface-2'),
    secondaryTextColor: hex('fg-1'),
    secondaryBorderColor: hex('rule'),
    tertiaryColor: hex('hl-quote'),
    tertiaryTextColor: hex('fg-1'),
    tertiaryBorderColor: hex('rule'),
    noteBkgColor: hex('gilt-soft'),
    noteTextColor: hex('fg-1'),
    noteBorderColor: hex('rule-strong'),
    actorBkg: hex('bg-surface'),
    actorBorder: hex('rule-strong'),
    actorTextColor: hex('fg-1'),
    signalColor: hex('fg-2'),
    signalTextColor: hex('fg-1'),
    labelBoxBkgColor: hex('bg-surface-2'),
    labelBoxBorderColor: hex('rule'),
    labelTextColor: hex('fg-1'),
    loopTextColor: hex('fg-2'),
    attributeBackgroundColorOdd: hex('bg-surface'),
    attributeBackgroundColorEven: hex('bg-surface-2'),
    rowOdd: hex('bg-surface'),
    rowEven: hex('bg-surface-2'),
  };
};

const mermaid = {};
for (const t of THEMES) mermaid[t] = { light: pick(t, 'light'), dark: pick(t, 'dark') };

const mermaidTs = `${BANNER}
/**
 * Mermaid themeVariables for all four themes in both modes.
 *
 * Emitted as hex rather than OKLCH: Mermaid derives shades and contrast pairs
 * from these values, so it is handed the format its theming engine is known to
 * accept. The values are generated from the OKLCH token source, so this file is
 * a projection of the palette, never a second place a colour is authored.
 *
 * Usage:
 *   mermaid.initialize({ theme: 'base', themeVariables: mermaidTheme('parchment', 'dark') })
 */
import type { ThemeName, ModeName } from './tokens.js';

export const mermaidThemes = ${JSON.stringify(mermaid, null, 2)} as const;

export function mermaidTheme(theme: ThemeName = 'parchment', mode: ModeName = 'light') {
  return mermaidThemes[theme][mode];
}
`;

writeFileSync(join(OUT, 'mermaid.ts'), mermaidTs);

const count = Object.keys(palettes.parchment.light).length;
console.log(`tokens.css   ${count} base colour tokens · 4 themes × 2 modes · ${Object.keys(scales).flatMap((k) => Object.keys(scales[k])).length} scale tokens`);
console.log(`tokens.ts    typed palettes + resolveTokens()`);
console.log(`mermaid.ts   8 palettes, hex-projected · ${checked} colours round-trip verified`);
