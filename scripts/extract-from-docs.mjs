#!/usr/bin/env node
/**
 * One-shot extraction of the token source from the docs site's globals.css.
 *
 * This runs once, at extraction time. After the package owns the tokens, the
 * JSON under tokens/source/ is the authored source and this script is history
 * — it is kept only so the provenance of the initial values is auditable.
 *
 * Cascade model, preserved exactly as the docs site had it:
 *   - `:root, [data-theme="parchment"]` is the complete base set.
 *   - Every other theme block is a PARTIAL override; unlisted tokens inherit
 *     from the base. Mono, for instance, declares no shadows and inherits the
 *     warm-brown parchment shadows. That is existing behaviour and is carried
 *     forward unchanged rather than silently "fixed".
 *
 * Usage: node scripts/extract-from-docs.mjs <path-to-globals.css>
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

// Comments are stripped before parsing: the selector regex below captures
// everything between the previous `}` and the next `{`, which would otherwise
// include any comment block sitting above the rule.
const src = readFileSync(process.argv[2], 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const OUT = new URL('../tokens/source/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

/** Pull `--name: value;` pairs out of one declaration body. */
function declarations(body) {
  const out = {};
  for (const m of body.matchAll(/--([a-z0-9-]+)\s*:\s*([^;]+);/gi)) {
    out[m[1]] = m[2].trim();
  }
  return out;
}

/**
 * Find the body of the first rule whose selector list matches `test`.
 * Brace-counts rather than regex-matching so nested blocks (@media) are safe.
 */
function ruleBody(test, from = 0) {
  const re = /([^{}]+)\{/g;
  re.lastIndex = from;
  let m;
  while ((m = re.exec(src))) {
    const selector = m[1].trim();
    if (!test(selector)) continue;
    let depth = 1;
    let i = re.lastIndex;
    while (i < src.length && depth > 0) {
      if (src[i] === '{') depth++;
      else if (src[i] === '}') depth--;
      i++;
    }
    return { selector, body: src.slice(re.lastIndex, i - 1), end: i };
  }
  return null;
}

const THEMES = ['parchment', 'library', 'sepia', 'mono'];

// --- light palettes -------------------------------------------------------
const palettes = {};
palettes['parchment.light'] = declarations(
  ruleBody((s) => s.includes(':root') && s.includes('[data-theme="parchment"]')).body,
);
for (const t of THEMES.slice(1)) {
  palettes[`${t}.light`] = declarations(
    ruleBody((s) => s === `[data-theme="${t}"]`).body,
  );
}

// --- dark palettes --------------------------------------------------------
for (const t of THEMES) {
  palettes[`${t}.dark`] = declarations(
    ruleBody((s) => s === `[data-theme="${t}"][data-mode="dark"]`).body,
  );
}

// --- verify the auto-dark @media duplicates are byte-equal ----------------
// The docs site authored each dark palette twice: once for the explicit
// [data-mode="dark"] override and once inside a prefers-color-scheme block.
// The generated output emits both from one source, so confirm they agree
// before collapsing them — a silent divergence here would be a real bug.
const mediaStart = src.indexOf('@media (prefers-color-scheme: dark)');
for (const t of THEMES) {
  const auto = ruleBody((s) => s === `[data-theme="${t}"]:not([data-mode])`, mediaStart);
  if (!auto) throw new Error(`auto-dark block missing for ${t}`);
  const a = declarations(auto.body);
  const b = palettes[`${t}.dark`];
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const k of keys) {
    if (a[k] !== b[k]) {
      throw new Error(`auto-dark drift in ${t}: --${k} is "${b[k]}" (explicit) vs "${a[k]}" (auto)`);
    }
  }
}
console.log('auto-dark blocks verified identical to explicit dark blocks for all 4 themes');

// --- structural set (type, space, radius, motion) -------------------------
// The second bare `:root` carries the theme-invariant scales.
const firstRoot = ruleBody((s) => s.includes(':root'));
const structural = declarations(ruleBody((s) => s.trim() === ':root', firstRoot.end).body);

// Layout variables are documentation-site geometry, not house style. They stay
// behind in the docs repo; the audit's extraction boundary excludes them.
const LAYOUT = ['page-w', 'content-w', 'measure', 'sidebar-w', 'topbar-h', 'chat-panel-w'];
const FONT_STACKS = ['font-serif', 'font-sans', 'font-mono'];

const buckets = { type: {}, space: {}, radius: {}, motion: {}, font: {} };
for (const [k, v] of Object.entries(structural)) {
  if (LAYOUT.includes(k)) continue;
  if (FONT_STACKS.includes(k)) { buckets.font[k] = v; continue; }
  if (/^fs-|^lh-|^tr-|^fw-/.test(k)) { buckets.type[k] = v; continue; }
  if (/^sp-/.test(k)) { buckets.space[k] = v; continue; }
  if (/^radius-|^badge-cap-/.test(k)) { buckets.radius[k] = v; continue; }
  if (/^dur-|^ease-/.test(k)) { buckets.motion[k] = v; continue; }
  buckets.type[k] = v; // anything unclassified lands with type rather than vanishing
}

/** Wrap a flat name->value map as DTCG tokens at the document root. */
function toDtcg(map, type) {
  const out = {};
  for (const [k, v] of Object.entries(map)) out[k] = { $value: v, $type: type };
  return out;
}

function typeOf(name) {
  if (/^shadow-/.test(name)) return 'shadow';
  if (/^overlay-scrim$/.test(name)) return 'color';
  return 'color';
}

for (const [key, map] of Object.entries(palettes)) {
  const out = {};
  for (const [k, v] of Object.entries(map)) out[k] = { $value: v, $type: typeOf(k) };
  writeFileSync(join(OUT, `color.${key}.json`), JSON.stringify(out, null, 2) + '\n');
}

writeFileSync(join(OUT, 'font.json'), JSON.stringify(toDtcg(buckets.font, 'fontFamily'), null, 2) + '\n');
writeFileSync(join(OUT, 'type.json'), JSON.stringify(toDtcg(buckets.type, 'dimension'), null, 2) + '\n');
writeFileSync(join(OUT, 'space.json'), JSON.stringify(toDtcg(buckets.space, 'dimension'), null, 2) + '\n');
writeFileSync(join(OUT, 'radius.json'), JSON.stringify(toDtcg(buckets.radius, 'dimension'), null, 2) + '\n');
writeFileSync(join(OUT, 'motion.json'), JSON.stringify(toDtcg(buckets.motion, 'duration'), null, 2) + '\n');

const counts = Object.entries(palettes).map(([k, v]) => `${k}=${Object.keys(v).length}`);
console.log('palettes:', counts.join(' '));
console.log(
  'structural:',
  `font=${Object.keys(buckets.font).length}`,
  `type=${Object.keys(buckets.type).length}`,
  `space=${Object.keys(buckets.space).length}`,
  `radius=${Object.keys(buckets.radius).length}`,
  `motion=${Object.keys(buckets.motion).length}`,
);
