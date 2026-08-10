#!/usr/bin/env node
/**
 * Assert every vendored icon still matches its Lucide original.
 *
 * Vendoring buys a small bundle and one fewer dependency, and the price is
 * that conformance becomes a convention rather than something the package
 * manager enforces. `icons.tsx` states the rule — "Do not redraw by eye and do
 * not adjust coordinates to taste" — but a comment cannot fail a build.
 *
 * This is what makes the rule enforceable. It found the case it was written
 * for on its first run: `ModeSwitcher` carried its own hand-drawn sun, monitor
 * and moon, at different radii and rectangles from the Lucide ones sitting in
 * `icons.tsx`, so the same three concepts shipped as two different sets.
 *
 * Comparison is on geometry only. Stroke, size and viewBox live on the shared
 * `Icon` wrapper by design — the house weight is 1.5 against Lucide's 2 — so
 * presentation attributes are deliberately not compared.
 */

import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const ICONS = join(ROOT, 'src/components/icons.tsx');
const LUCIDE = join(ROOT, 'node_modules/lucide-static/icons');

if (!existsSync(LUCIDE)) {
  console.error(
    'lucide-static is not installed, so vendored icons cannot be verified.\n' +
      'Run `pnpm install`. It is a devDependency and is never published.',
  );
  process.exit(2);
}

/** SunIcon -> sun, ChevronLeftIcon -> chevron-left. */
const lucideNameFor = (component) =>
  component
    .replace(/Icon$/, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase();

/**
 * Reduce markup to a comparable shape: an ordered list of shapes, each with
 * its geometry attributes sorted. Attribute order and formatting differ
 * between the JSX and the SVG source without any difference in what is drawn.
 */
const PRESENTATION = new Set([
  'stroke', 'fill', 'stroke-width', 'strokewidth', 'stroke-linecap', 'strokelinecap',
  'stroke-linejoin', 'strokelinejoin', 'class', 'classname', 'xmlns', 'width',
  'height', 'viewbox', 'aria-hidden', 'role',
]);

function shapes(markup) {
  const out = [];
  const tag = /<(circle|path|rect|line|polyline|polygon|ellipse)\b([^>]*?)\/?>/g;
  let m;
  while ((m = tag.exec(markup)) !== null) {
    const attrs = {};
    const attr = /([\w-]+)\s*=\s*"([^"]*)"/g;
    let a;
    while ((a = attr.exec(m[2])) !== null) {
      const key = a[1].toLowerCase();
      if (PRESENTATION.has(key)) continue;
      // Collapse whitespace inside path data so formatting is not a difference.
      attrs[key] = a[2].replace(/\s+/g, ' ').trim();
    }
    out.push(
      `${m[1]}(${Object.keys(attrs).sort().map((k) => `${k}=${attrs[k]}`).join(',')})`,
    );
  }
  return out;
}

const source = readFileSync(ICONS, 'utf8');
const failures = [];
let checked = 0;

// Each `export function NameIcon(...) { ... }` up to the next export.
const component = /export function (\w+Icon)\s*\([\s\S]*?\n}/g;
let match;
while ((match = component.exec(source)) !== null) {
  const name = match[1];
  const lucide = lucideNameFor(name);
  const file = join(LUCIDE, `${lucide}.svg`);

  if (!existsSync(file)) {
    failures.push(`${name}: no Lucide icon named "${lucide}". Rename the component or vendor the right glyph.`);
    continue;
  }

  const ours = shapes(match[0]);
  const theirs = shapes(readFileSync(file, 'utf8'));
  checked++;

  if (ours.length === 0) {
    failures.push(`${name}: no geometry found. The parser expected circle/path/rect/line/polyline/polygon/ellipse.`);
  } else if (JSON.stringify(ours) !== JSON.stringify(theirs)) {
    failures.push(
      `${name} has drifted from lucide-static/icons/${lucide}.svg\n` +
        `      vendored: ${ours.join(' ')}\n` +
        `      upstream: ${theirs.join(' ')}`,
    );
  }
}

// A stray inline SVG outside icons.tsx is how the drift got in last time: the
// geometry has to live in one module or the set stops being a set.
const strays = [];
for (const rel of ['src/theme/ModeSwitcher.tsx', 'src/theme/ThemeSwitcher.tsx']) {
  const path = join(ROOT, rel);
  if (!existsSync(path)) continue;
  const text = readFileSync(path, 'utf8');
  if (/<(circle|rect|polyline|polygon|ellipse)\b/.test(text) || /<path\b/.test(text)) {
    strays.push(rel);
  }
}

if (strays.length > 0) {
  failures.push(
    `inline SVG geometry outside icons.tsx: ${strays.join(', ')}.\n` +
      '      Import from src/components/icons.tsx instead — an icon defined twice drifts.',
  );
}

// The logo mark is drawn twice: as three subpaths for every static rendering,
// and as one continuous path for the stroke-draw animation, which needs a
// single element for getTotalLength to measure. Two spellings of one mark is
// precisely the drift this script exists to prevent, so the continuous form is
// derived-and-compared rather than trusted. It must be the subpaths in order,
// with the descender retraced so the pen returns to the junction rather than
// lifting.
const logo = readFileSync(join(ROOT, 'src/components/Logo.tsx'), 'utf8');
const subpaths = [...logo.matchAll(/^ {2}'(M [^']+)',$/gm)].map((m) => m[1]);
const continuous = logo.match(/^ {2}'(M 72 375[^']+)';$/m)?.[1];

if (subpaths.length !== 3 || !continuous) {
  failures.push(
    `Logo.tsx: expected three SUBPATHS and one CONTINUOUS path, found ${subpaths.length} and ` +
      `${continuous ? 'one' : 'none'}. If they were restructured, update this check with them.`,
  );
} else {
  // Each subpath after the first begins with a moveto to a point the pen has
  // already reached, so only the drawing commands carry over.
  const drop = (d) => d.replace(/^M [\d.]+ [\d.]+\s*/, '');
  const [, stem, close] = subpaths;
  const expected = `${subpaths[0]} ${drop(stem)} L 252 320 ${drop(close)}`;
  const flat = (s) => s.replace(/\s+/g, ' ').trim();
  if (flat(continuous) !== flat(expected)) {
    failures.push(
      'Logo.tsx: CONTINUOUS is not the concatenation of SUBPATHS.\n' +
        `      continuous: ${continuous}\n` +
        `      expected:   ${expected}\n` +
        '      The animated mark and the static mark have to be the same mark.',
    );
  }
}

if (failures.length > 0) {
  console.error('check:icons — vendored icons do not match their Lucide originals:\n');
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}

console.log(
  `check:icons — ${checked} vendored icons match lucide-static verbatim, ` +
    'and the logo mark is identical in both its forms',
);
