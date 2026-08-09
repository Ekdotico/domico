#!/usr/bin/env node
/**
 * WCAG contrast, across every palette.
 *
 * The colour system's accessibility was asserted in prose and checked by hand,
 * which is how `--accent-ink` on Parchment dark shipped at 3.22:1 — white ink
 * on a light lavender accent, below the 4.5:1 a button label needs. Three of
 * the four dark palettes already used dark ink there; the fourth was simply
 * missed, and nothing could notice.
 *
 * Each pair below is a foreground token and the surface it is actually drawn
 * on. Resolution follows the same cascade as the stylesheet, so what is
 * measured is what a reader sees rather than what a single source file
 * declares.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { oklchToHex } from '../tokens/lib/color.mjs';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const THEMES = ['parchment', 'library', 'sepia', 'mono'];
const MODES = ['light', 'dark'];

/** Foreground token, the surface it sits on, and the threshold it must meet. */
const PAIRS = [
  ['fg-1', 'bg-canvas', 4.5],
  ['fg-2', 'bg-canvas', 4.5],
  ['fg-3', 'bg-canvas', 4.5],
  ['fg-4', 'bg-canvas', 4.5],
  ['fg-1', 'bg-surface', 4.5],
  ['fg-3', 'bg-surface', 4.5],
  ['accent', 'bg-canvas', 4.5],
  ['accent-ink', 'accent', 4.5],
  ['gilt', 'bg-canvas', 4.5],
  ['warn', 'bg-canvas', 4.5],
  ['danger', 'bg-canvas', 4.5],
  ['ok', 'bg-canvas', 4.5],
  ['info', 'bg-canvas', 4.5],
  ['fg-xref', 'bg-canvas', 4.5],
];

const read = (theme, mode) => {
  try {
    return JSON.parse(readFileSync(join(ROOT, `tokens/source/color.${theme}.${mode}.json`), 'utf8'));
  } catch {
    return {};
  }
};

/** Parchment light is the complete base; the rest override it, dark last. */
function layer(theme, mode) {
  return {
    ...read('parchment', 'light'),
    ...read(theme, 'light'),
    ...(mode === 'dark' ? { ...read('parchment', 'dark'), ...read(theme, 'dark') } : {}),
  };
}

const toHex = (value) => (value?.startsWith('oklch') ? oklchToHex(value) : value);

function luminance(hex) {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const failures = [];
let checked = 0;

for (const theme of THEMES) {
  for (const mode of MODES) {
    const tokens = layer(theme, mode);
    for (const [fg, bg, threshold] of PAIRS) {
      const fgValue = tokens[fg]?.$value;
      const bgValue = tokens[bg]?.$value;
      // A token absent from every layer is not a contrast failure; the
      // generated-artefact check is what covers missing tokens.
      if (!fgValue || !bgValue) continue;

      const ratio = contrast(toHex(fgValue), toHex(bgValue));
      checked++;
      if (ratio < threshold) {
        failures.push(
          `${theme}/${mode}: --${fg} on --${bg} is ${ratio.toFixed(2)}:1, below ${threshold}:1 ` +
            `(${toHex(fgValue)} on ${toHex(bgValue)})`,
        );
      }
    }
  }
}

if (failures.length > 0) {
  console.error('check:contrast — pairs below their WCAG threshold:\n');
  for (const f of failures) console.error(`  - ${f}`);
  console.error(
    '\nRaise the foreground, or darken the surface. Do not lower the threshold:\n' +
      'the reading measure and the colour system are both inclusive-design\n' +
      'constraints rather than preferences.',
  );
  process.exit(1);
}

console.log(`check:contrast — ${checked} foreground/surface pairs meet WCAG AA across 8 palettes`);
