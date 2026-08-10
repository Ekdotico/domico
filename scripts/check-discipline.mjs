#!/usr/bin/env node
// Design-system discipline guard for @ekdotico/domico consumers.
//
// Four checks the existing package guards do not cover. They all walk the same
// files, so they are one script rather than four:
//
//   literals   a design value written as a literal instead of a token
//   fallbacks  var(--token, literal) — a second source of truth
//   greek      Greek glyphs resolving to --font-serif, which has no Greek
//   dupes      an app reimplementing something the package exports
//
// Exit 1 on any violation. Intended to run in CI for docs, deree, and praktico.
//
// A note on false positives, learned the hard way: a design-system document
// necessarily QUOTES the patterns it bans. So prose is excluded — CSS comments
// are stripped, and markdown is not walked at all.
//
// Usage: node check-discipline.mjs [appDir] [--quiet]

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, extname, basename } from 'node:path';

const APP = process.argv[2] ?? process.cwd();
const QUIET = process.argv.includes('--quiet');

const SKIP_DIRS = new Set([
  'node_modules', '.next', '.git', 'dist', 'build', '.vercel',
  '.turbo', 'coverage', '.wrangler', 'worktrees', '.open-next',
  // Build tooling and the guards themselves. A guard that searches for a
  // pattern necessarily contains that pattern, and this script flagged its own
  // source on the first run.
  'scripts',
  // The pre-package design system, kept as reference material. It is superseded
  // by @ekdotico/domico and is not app code; auditing it reports 143 literals
  // that are correct in their own context and actionable in none.
  'claude-design',
]);
// Files permitted to contain literals, each for a stated reason:
//   token source     — where values are authored
//   generated output — must not be hand-edited anyway
//   OG image routes  — satori rasterises without a CSS custom-property scope,
//                      so a literal is the only thing that can work there
//   tokens/lib       — the colour maths that EMITS oklch strings; a generator of
//                      colour values necessarily contains colour functions
const TOKEN_FILES =
  /(tokens?\.css|tokens\/source\/|tokens\/generated\/|tokens\/lib\/|\.generated\.|app\/og\/|opengraph-image|\/og\/route\.)/;
const WALK_EXT = new Set(['.css', '.tsx', '.ts', '.jsx', '.js', '.mjs']);

// REGIONS permitted to contain literals, for the same reason app/og/ is above.
// A hand-written HTML document inside a source file — everything from
// <!doctype html> to </html>, written into a window.open() popup or an iframe
// — is a NEW document. Nothing links the token sheet into it and no :root of
// the application is in scope, so var(--token) resolves to nothing there and a
// literal is the only thing that can work. Same situation as satori, reached by
// a different route.
//
// Exempt by line range and not by file, deliberately. A component that opens a
// popup almost always renders in-page as well, and that half must stay checked:
// docs/components/docs/Mermaid.tsx is 1226 lines of which 100 are the two popup
// templates, and the other 1100 style the inline figure with tokens.
function docTemplateLines(lines) {
  const exempt = new Set();
  for (let i = 0; i < lines.length; i++) {
    if (!/<!doctype html/i.test(lines[i])) continue;
    const end = lines.findIndex((l, j) => j > i && /<\/html>/i.test(l));
    if (end < 0) continue; // unterminated: not a document, so not exempt
    for (let n = i; n <= end; n++) exempt.add(n + 1);
    i = end;
  }
  return exempt;
}

function walk(dir, out = []) {
  let entries;
  try { entries = readdirSync(dir); } catch { return out; }
  for (const e of entries) {
    if (SKIP_DIRS.has(e)) continue;
    const p = join(dir, e);
    let st;
    try { st = statSync(p); } catch { continue; }
    if (st.isDirectory()) walk(p, out);
    else if (WALK_EXT.has(extname(p))) out.push(p);
  }
  return out;
}

const stripCssComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
const stripJsComments = (s) =>
  s.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
   .replace(/(^|[^:])\/\/[^\n]*/g, (m) => m.replace(/[^\n]/g, ' '));

const findings = [];
const add = (check, file, line, text, note = '') =>
  findings.push({ check, file: relative(APP, file), line, text: text.trim().slice(0, 110), note });

const files = walk(APP);
if (files.length === 0) {
  console.error(`check-discipline: no source files found under ${APP}`);
  process.exit(2);
}

// ---------------------------------------------------------------- 1. literals
const LITERAL_RULES = [
  // Colour written directly. oklch()/rgb() belong in the token source only.
  [/(^|[^\w-])#[0-9a-fA-F]{3,8}\b/, 'hex colour'],
  [/\b(rgba?|hsla?|oklch|oklab|lab|lch)\s*\(/, 'colour function'],
  // A px font-size defeats the rem scale a reader relies on when they raise
  // their browser font size.
  [/font-size:\s*\d*\.?\d+px/, 'px font-size'],
  [/font-family:\s*(?!var\()['"a-zA-Z]/, 'literal font-family'],
  [/transition[^;:]*:\s*[^;]*\b\d+m?s\b/, 'literal duration'],
  [/cubic-bezier\s*\(/, 'literal easing'],
  [/border-radius:\s*\d*\.?\d+px/, 'literal radius'],
  [/letter-spacing:\s*-?\d*\.?\d+(em|px|rem)/, 'literal letter-spacing'],
  [/font-weight:\s*\d{3}/, 'literal font-weight'],
];
// COVERAGE BOUNDARY, stated so nobody assumes this is exhaustive.
// Not checked: max-width, padding/margin/gap, line-height, width/height. Each
// has too many legitimate non-token uses (100%, 0, auto, ch units, intrinsic
// sheet geometry) for a regex to separate signal from noise, and a guard that
// cries wolf gets switched off. Those stay a review-time concern.

// ------------------------------------------------------------- 2. fallbacks
// var(--x, anything) — the comma is the tell.
//
// But only when --x is a token the system actually defines. Two legitimate uses
// look identical to a regex and must not be flagged:
//
//   repeat(var(--theme-count, 4), 1fr)      an OPTIONAL property a consumer may
//                                          set; the fallback is the only value,
//                                          not a restatement of a second source
//   var(--table-sticky-offset, 0px)        a token with a sensible default for
//                                          consumers that do not position it
//
// The violation is restating a value var() can already resolve. So the check
// needs to know which properties the token layer defines, and reads them.
const FALLBACK = /var\(\s*(--[\w-]+)\s*,/g;

function definedTokens(appDir) {
  const candidates = [
    join(appDir, 'node_modules/@ekdotico/domico/tokens/generated/tokens.css'),
    join(appDir, 'tokens/generated/tokens.css'),
    join(appDir, '..', 'domico', 'tokens', 'generated', 'tokens.css'),
  ];
  for (const p of candidates) {
    if (!existsSync(p)) continue;
    const names = new Set();
    for (const m of readFileSync(p, 'utf8').matchAll(/^\s*(--[\w-]+)\s*:/gm)) names.add(m[1]);
    if (names.size > 0) return names;
  }
  return null;
}
const TOKENS = definedTokens(APP);

// ----------------------------------------------------------------- 3. greek
const GREEK = /[Ͱ-Ͽἀ-῿]/;

// ------------------------------------------------------------------ 4. dupes
// An app defining its own copy of a package export is a reimplementation —
// unless the file is a one-line re-export shim, which is a documented pattern
// here for keeping import paths stable while the implementation moves.
//
// The list is DERIVED from the installed package's own barrel files, not
// hardcoded. A hardcoded list is the same defect this guard exists to catch: it
// falls behind the package silently, and the day AppearanceMenu is added the
// guard stops covering it with nobody noticing. Same reasoning the package uses
// for its theme vocabulary, which comes from the generated token export rather
// than a hand-written union.
function derivePackageExports(appDir) {
  const roots = [
    join(appDir, 'node_modules/@ekdotico/domico'),
    // Running from inside the package itself, e.g. its own CI.
    join(appDir, '..', 'domico'),
    appDir,
  ];
  const names = new Set();
  for (const root of roots) {
    for (const rel of ['dist/src/components/index.d.ts', 'dist/src/theme/index.d.ts',
                       'src/components/index.ts', 'src/theme/index.ts']) {
      const p = join(root, rel);
      if (!existsSync(p)) continue;
      const txt = readFileSync(p, 'utf8');
      // export { A, B as C } from '...'  |  export declare const A
      for (const m of txt.matchAll(/export\s*\{([^}]+)\}/g)) {
        for (const part of m[1].split(',')) {
          const name = part.trim().split(/\s+as\s+/).pop().trim();
          if (/^[A-Za-z_$][\w$]*$/.test(name) && !/^type$/.test(name)) names.add(name);
        }
      }
      for (const m of txt.matchAll(/export\s+(?:declare\s+)?(?:function|const|class)\s+([A-Za-z_$][\w$]*)/g)) {
        names.add(m[1]);
      }
    }
    if (names.size > 0) break;
  }
  // Types are not implementations; a consumer redeclaring a prop type is not
  // duplicating a component.
  for (const n of [...names]) if (/^(Theme|Mode|RenderedMode|.*Props|.*Variant)$/.test(n)) names.delete(n);
  // SCREAMING_CASE constants are dropped deliberately. MODES, DEFAULT_THEME and
  // the storage keys are names an app could plausibly reach for about something
  // else entirely, and a false positive is what gets a guard switched off. The
  // drift this check exists to catch is a reimplemented component or hook, and
  // those are PascalCase or use-prefixed.
  for (const n of [...names]) if (/^[A-Z0-9_]+$/.test(n)) names.delete(n);
  return [...names];
}

// Auditing the package itself: it necessarily defines everything it exports, so
// the reimplementation check is a category error there and is skipped. Detected
// from the manifest rather than a path, so a rename cannot silently re-enable it.
const IS_PACKAGE_ITSELF = (() => {
  const p = join(APP, 'package.json');
  if (!existsSync(p)) return false;
  try { return JSON.parse(readFileSync(p, 'utf8')).name === '@ekdotico/domico'; }
  catch { return false; }
})();

const PACKAGE_EXPORTS = IS_PACKAGE_ITSELF ? [] : derivePackageExports(APP);
if (process.argv.includes('--list-exports')) {
  console.log(`${PACKAGE_EXPORTS.length} exports derived from @ekdotico/domico:`);
  console.log('  ' + PACKAGE_EXPORTS.join(', '));
  process.exit(0);
}
if (!IS_PACKAGE_ITSELF && PACKAGE_EXPORTS.length === 0) {
  console.error(
    'check-discipline: could not read @ekdotico/domico exports, so the ' +
    'reimplementation check cannot run. Install dependencies first.',
  );
  process.exit(2);
}

for (const file of files) {
  const raw = readFileSync(file, 'utf8');
  const isCss = extname(file) === '.css';
  const src = isCss ? stripCssComments(raw) : stripJsComments(raw);
  const lines = src.split('\n');
  const rawLines = raw.split('\n');
  const inTokenFile = TOKEN_FILES.test(file);
  // Line numbers that fall inside a written-out HTML document, if any.
  const inDocTemplate = docTemplateLines(lines);

  // A one-line re-export is not a duplicate implementation.
  const isReExport = /^\s*export\s*\{[^}]*\}\s*from\s*['"]@ekdotico\/domico/m.test(src);

  lines.forEach((line, i) => {
    const n = i + 1;
    if (!line.trim()) return;

    if (!inTokenFile) {
      // The literal check only. A var(--token, literal) fallback inside a
      // written-out document is still a second source of truth — the token
      // does not resolve there, so the fallback is the ONLY value and the
      // var() is dead weight — so the fallback check below stays on.
      if (!inDocTemplate.has(n)) {
        for (const [re, label] of LITERAL_RULES) {
          // Data URIs and SVG viewBox/path data are not design values.
          if (/url\(data:|viewBox=|\bd="/.test(line)) continue;
          if (re.test(line)) add('literals', file, n, rawLines[i], label);
        }
      }
      for (const m of line.matchAll(FALLBACK)) {
        // Unknown token layer: report everything rather than silently passing.
        if (TOKENS === null || TOKENS.has(m[1])) {
          add('fallbacks', file, n, rawLines[i], `restates ${m[1]}`);
        }
      }
    }

    if (GREEK.test(line)) {
      add('greek', file, n, rawLines[i],
        isCss ? 'Greek in CSS — confirm the face' : 'Greek text — must not resolve to --font-serif');
    }
  });

  // A CSS rule whose selector mentions greek must not reach for the serif.
  if (isCss) {
    for (const m of src.matchAll(/([^{}]*greek[^{}]*)\{([^}]*)\}/gi)) {
      if (/--font-serif/.test(m[2])) {
        const n = src.slice(0, m.index).split('\n').length;
        add('greek', file, n, m[1] + '{ … --font-serif … }',
          'HARD FAIL: Crimson Pro ships no Greek subset');
      }
    }
  }

  if (!isCss && !isReExport && !inTokenFile && !IS_PACKAGE_ITSELF) {
    for (const name of PACKAGE_EXPORTS) {
      const re = new RegExp(`(export\\s+(?:default\\s+)?(?:function|const|class)\\s+${name}\\b)`);
      const m = src.match(re);
      if (m) {
        const n = src.slice(0, src.indexOf(m[0])).split('\n').length;
        add('dupes', file, n, m[0], `@ekdotico/domico already exports ${name}`);
      }
    }
  }
}

// ------------------------------------------------------------------- report
const ORDER = ['greek', 'dupes', 'fallbacks', 'literals'];
const LABEL = {
  greek: 'Greek glyphs must never resolve to --font-serif',
  dupes: 'App reimplements a package export',
  fallbacks: 'var(--token, literal) — a second source of truth',
  literals: 'Design value written as a literal instead of a token',
};

console.log(`\ncheck-discipline — ${relative(process.cwd(), APP) || APP}  (${files.length} files)\n`);
let hard = 0;
for (const check of ORDER) {
  const hits = findings.filter((f) => f.check === check);
  if (hits.length === 0) { console.log(`  ok    ${check.padEnd(10)} ${LABEL[check]}`); continue; }
  const isHard = check !== 'greek' || hits.some((h) => h.note.startsWith('HARD FAIL'));
  if (isHard) hard += hits.length;
  console.log(`  ${isHard ? 'FAIL' : 'warn'}  ${check.padEnd(10)} ${hits.length} — ${LABEL[check]}`);
  if (QUIET) continue;
  const shown = hits.slice(0, 12);
  for (const h of shown) console.log(`          ${h.file}:${h.line}  ${h.note}\n            ${h.text}`);
  if (hits.length > shown.length) console.log(`          … and ${hits.length - shown.length} more`);
}
if (process.argv.includes('--by-file')) {
  const tally = new Map();
  for (const f of findings) {
    const k = `${f.check}  ${f.file}`;
    tally.set(k, (tally.get(k) ?? 0) + 1);
  }
  console.log('\n  by file:');
  for (const [k, n] of [...tally.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20)) {
    console.log(`    ${String(n).padStart(4)}  ${k}`);
  }
  const notes = new Map();
  for (const f of findings) notes.set(f.note, (notes.get(f.note) ?? 0) + 1);
  console.log('\n  by kind:');
  for (const [k, n] of [...notes.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`    ${String(n).padStart(4)}  ${k}`);
  }
}

console.log(`\n  ${hard === 0 ? 'PASS' : `${hard} violation(s)`}\n`);
process.exit(hard === 0 ? 0 : 1);
