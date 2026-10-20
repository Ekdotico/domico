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

import { readFileSync, readdirSync, existsSync } from 'node:fs';
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
for (const rel of [
  'src/theme/ModeSwitcher.tsx',
  'src/theme/ThemeSwitcher.tsx',
  'src/theme/AppearanceMenu.tsx',
]) {
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

// The logo mark is one filled path, the epsilon, held in Logo.tsx and repeated
// in every SVG under assets/logo. A file that carried an older or hand-adjusted
// path would ship a different mark under the same name, which is the drift this
// script exists to prevent, so each file's glyph is compared with the
// component's. (The PNGs are rendered from these SVGs, so they follow.)
const logo = readFileSync(join(ROOT, 'src/components/Logo.tsx'), 'utf8');
const epsilon = logo.match(/^ {2}'(M[^']+Z)';$/m)?.[1];
const logoFiles = [
  'assets/logo/logo-mark.svg',
  'assets/logo/logo-mark-branded.svg',
  ...readdirSync(join(ROOT, 'assets/logo/SVG'), { recursive: true })
    .filter((f) => String(f).endsWith('.svg'))
    .map((f) => `assets/logo/SVG/${f}`),
];

if (!epsilon) {
  failures.push(
    'Logo.tsx: expected one EPSILON path. If the mark was restructured, update this check with it.',
  );
} else {
  const drifted = logoFiles.filter(
    (f) => !readFileSync(join(ROOT, f), 'utf8').includes(`d="${epsilon}"`),
  );
  if (drifted.length > 0) {
    failures.push(
      `logo files whose glyph is not Logo.tsx's EPSILON: ${drifted.join(', ')}.\n` +
        '      Every file of the mark has to carry the same mark.',
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
    'and every file of the logo mark carries the same epsilon',
);
