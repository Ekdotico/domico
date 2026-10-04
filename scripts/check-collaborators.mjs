#!/usr/bin/env node
/**
 * The collaborator set, across every palette.
 *
 * `--collab-N`, `--collab-N-ink` and `--collab-N-soft` colour another person's
 * caret, presence label and selection in a shared document. They are the one
 * token group whose obligation is to each other as well as to a surface: a
 * slot that passes every contrast pair and cannot be told from its neighbour
 * has still failed. So this measures four things, in all eight palettes.
 *
 *   label       the ink on its solid, as text, at 4.5:1
 *   caret       the solid on every ground a document is drawn on, as a
 *               graphical object, at 3:1 (WCAG 2.2 SC 1.4.11)
 *   selection   body text over the wash composited onto each of those
 *               grounds, at 4.5:1 — and the wash far enough from the bare
 *               ground to be seen at all
 *   identity    every pair of solids apart in OKLab, for typical vision and
 *               under simulated protanopia and deuteranopia
 *
 * The last is a floor, not a promise. Ten colours inside one lightness band
 * cannot all stay far apart for a reader with two cone types, which is why the
 * label carries the name and the colour is never the only signal. What the
 * floor buys is that no two slots collapse into one.
 *
 *   node scripts/check-collaborators.mjs            the verdict
 *   node scripts/check-collaborators.mjs --report   the measured table as well
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { oklchToHex, parseOklch, contrast } from '../tokens/lib/color.mjs';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const THEMES = ['parchment', 'library', 'sepia', 'mono'];
const MODES = ['light', 'dark'];

/** One slot for each connection a document may hold (NFR-PE-05). */
const CONNECTIONS = 10;
/** Every ground a caret or a selection can land on inside a document. */
const GROUNDS = ['bg-canvas', 'bg-surface', 'bg-surface-2', 'bg-raised', 'bg-inset'];
/** The inks that carry running prose. */
const BODY = ['fg-1', 'fg-2'];

const LABEL = 4.5;
const CARET = 3;
const SELECTION = 4.5;
/** OKLab distance between a wash on its ground and the bare ground. */
const WASH_VISIBLE = 0.03;
/** OKLab distance between any two solids, for typical vision. */
const APART = 0.12;
/** The same, under either simulated dichromacy. */
const APART_CVD = 0.055;
/** The slots assigned first, and the wider distance they owe in every vision. */
const FIRST = 4;
const APART_FIRST = 0.15;

// Machado, Oliveira and Fernandes (2009), severity 1.0, applied in linear RGB.
const VISION = {
  typical: [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
  protanopia: [[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]],
  deuteranopia: [[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.01182, 0.04294, 0.968881]],
};

const read = (theme, mode) =>
  JSON.parse(readFileSync(join(ROOT, `tokens/source/color.${theme}.${mode}.json`), 'utf8'));

/** The cascade check-contrast.mjs resolves through, so both measure one thing. */
function layer(theme, mode) {
  return {
    ...read('parchment', 'light'),
    ...read(theme, 'light'),
    ...(mode === 'dark' ? { ...read('parchment', 'dark'), ...read(theme, 'dark') } : {}),
  };
}

const channels = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const toHex = (rgb) => '#' + rgb.map((c) => Math.round(c).toString(16).padStart(2, '0')).join('');

/** Source-over in gamma-encoded sRGB, which is how a browser paints a wash. */
function composite(over, alpha, under) {
  const [a, b] = [channels(over), channels(under)];
  return toHex(a.map((c, i) => c * alpha + b[i] * (1 - alpha)));
}

function oklab(hex, vision = 'typical') {
  const lin = channels(hex).map((c) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  const [r, g, b] = VISION[vision].map((row) =>
    Math.min(1, Math.max(0, row[0] * lin[0] + row[1] * lin[1] + row[2] * lin[2])),
  );
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

function distance(a, b, vision) {
  const [p, q] = [oklab(a, vision), oklab(b, vision)];
  return Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);
}

const failures = [];
const rows = [];
let checked = 0;
let slotCount = null;

for (const theme of THEMES) {
  for (const mode of MODES) {
    const where = `${theme}/${mode}`;
    const tokens = layer(theme, mode);
    const value = (name) => tokens[name]?.$value;
    const fail = (message) => failures.push(`${where}: ${message}`);

    // Shape. The slots are numbered from 1 with no gap, and each is a triple.
    const slots = Object.keys(tokens)
      .map((k) => /^collab-(\d+)$/.exec(k)?.[1])
      .filter(Boolean)
      .map(Number)
      .sort((a, b) => a - b);
    if (slots.some((n, i) => n !== i + 1)) fail(`slots are not numbered 1 to ${slots.length} without a gap`);
    if (slots.length < CONNECTIONS) {
      fail(`${slots.length} slots, and a document holds ${CONNECTIONS} connections`);
    }
    slotCount ??= slots.length;
    if (slots.length !== slotCount) fail(`${slots.length} slots, where parchment/light has ${slotCount}`);

    const worst = { label: Infinity, caret: Infinity, selection: Infinity, wash: Infinity };
    const solids = [];

    for (const n of slots) {
      const [solid, ink, soft] = [value(`collab-${n}`), value(`collab-${n}-ink`), value(`collab-${n}-soft`)];
      if (!solid || !ink || !soft) {
        fail(`--collab-${n} is not a complete triple (solid, -ink, -soft)`);
        continue;
      }
      const alpha = parseOklch(soft)?.alpha;
      if (!parseOklch(solid) || !parseOklch(ink) || !(alpha > 0 && alpha < 1)) {
        fail(`--collab-${n}: the solid and the ink are opaque oklch(), and the wash carries an alpha`);
        continue;
      }
      const solidHex = oklchToHex(solid);
      solids.push([n, solidHex]);

      const label = contrast(oklchToHex(ink), solidHex);
      checked++;
      worst.label = Math.min(worst.label, label);
      if (label < LABEL) fail(`--collab-${n}-ink on --collab-${n} is ${label.toFixed(2)}:1, below ${LABEL}:1`);

      for (const ground of GROUNDS) {
        const groundHex = oklchToHex(value(ground));

        const caret = contrast(solidHex, groundHex);
        checked++;
        worst.caret = Math.min(worst.caret, caret);
        if (caret < CARET) fail(`--collab-${n} on --${ground} is ${caret.toFixed(2)}:1, below ${CARET}:1`);

        const washed = composite(oklchToHex(soft), alpha, groundHex);
        const seen = distance(washed, groundHex, 'typical');
        checked++;
        worst.wash = Math.min(worst.wash, seen);
        if (seen < WASH_VISIBLE) {
          fail(`--collab-${n}-soft on --${ground} is ${seen.toFixed(3)} from the bare ground, under ${WASH_VISIBLE}`);
        }

        for (const fg of BODY) {
          const selection = contrast(oklchToHex(value(fg)), washed);
          checked++;
          worst.selection = Math.min(worst.selection, selection);
          if (selection < SELECTION) {
            fail(
              `--${fg} over --collab-${n}-soft on --${ground} is ${selection.toFixed(2)}:1, below ${SELECTION}:1`,
            );
          }
        }
      }
    }

    // Identity. Every pair, in every vision; the first few owe more.
    const apart = { typical: Infinity, protanopia: Infinity, deuteranopia: Infinity, first: Infinity };
    for (let i = 0; i < solids.length; i++) {
      for (let j = i + 1; j < solids.length; j++) {
        const [[a, hexA], [b, hexB]] = [solids[i], solids[j]];
        for (const vision of Object.keys(VISION)) {
          const d = distance(hexA, hexB, vision);
          checked++;
          apart[vision] = Math.min(apart[vision], d);
          const floor = vision === 'typical' ? APART : APART_CVD;
          if (d < floor) {
            fail(`--collab-${a} and --collab-${b} are ${d.toFixed(3)} apart under ${vision} vision, under ${floor}`);
          }
          if (b <= FIRST) {
            apart.first = Math.min(apart.first, d);
            if (d < APART_FIRST) {
              fail(
                `--collab-${a} and --collab-${b} are among the first ${FIRST} assigned and are ` +
                  `${d.toFixed(3)} apart under ${vision} vision, under ${APART_FIRST}`,
              );
            }
          }
        }
      }
    }

    rows.push({ where, ...worst, ...apart });
  }
}

if (process.argv.includes('--report')) {
  const f = (x, d) => (Number.isFinite(x) ? x.toFixed(d) : 'n/a');
  console.log('| Palette | Label | Caret | Selection | Wash | Typical | Protanopia | Deuteranopia | First ' + FIRST + ' |');
  console.log('| --- | --- | --- | --- | --- | --- | --- | --- | --- |');
  for (const r of rows) {
    console.log(
      `| ${r.where} | ${f(r.label, 2)}:1 | ${f(r.caret, 2)}:1 | ${f(r.selection, 2)}:1 | ${f(r.wash, 3)} | ` +
        `${f(r.typical, 3)} | ${f(r.protanopia, 3)} | ${f(r.deuteranopia, 3)} | ${f(r.first, 3)} |`,
    );
  }
  console.log('');
}

if (failures.length > 0) {
  console.error('check:collaborators — the collaborator set does not hold:\n');
  for (const f of failures) console.error(`  - ${f}`);
  console.error(
    '\nMove the value, not the threshold. A slot has three obligations at once —\n' +
      'its label, its ground, and its neighbours — and a change that fixes one in\n' +
      'the palette under review usually breaks another in one of the other seven.',
  );
  process.exit(1);
}

console.log(
  `check:collaborators — ${slotCount} slots hold their label, caret, selection and identity ` +
    `obligations across 8 palettes (${checked} measurements)`,
);
