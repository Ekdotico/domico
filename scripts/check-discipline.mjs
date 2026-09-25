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
  // Same category as scripts/, reached from the other direction: ruleset/ holds
  // the visual ruleset's build script and its self-compliance guard. The build
  // EMITS @font-face rules for a standalone document, so it necessarily writes a
  // literal font-family — there is no cascade in an inlined artifact to read a
  // token from — and the guard necessarily contains every pattern it forbids.
  // Not shipped in the package's files array either.
  'ruleset',
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
                       'dist/src/a11y/index.d.ts',
                       'src/components/index.ts', 'src/theme/index.ts', 'src/a11y/index.ts']) {
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

// Class names that a stylesheet sets to a Greek-capable family. Commissioner and
// Fira Code both ship Greek; Crimson Pro does not, which is the whole of rule 4.
//
// Without this, every Greek string in markup warned forever, including the ones
// already set correctly — and a permanent warning is worse than either a pass or
// a failure, because it teaches a reader to skip the column it appears in. Now a
// Greek string warns only when nothing can be shown to give it a face that
// covers the glyphs.
function greekCapableClasses(cssFiles) {
  const names = new Set();
  for (const f of cssFiles) {
    let src;
    try { src = stripCssComments(readFileSync(f, 'utf8')); } catch { continue; }
    for (const rule of src.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      if (!/--font-sans|--font-mono/.test(rule[2])) continue;
      for (const cls of rule[1].matchAll(/\.([A-Za-z0-9_-]+)/g)) names.add(cls[1]);
    }
  }
  return names;
}
const GREEK_OK = greekCapableClasses(files.filter((f) => extname(f) === '.css'));

// A CSS Module is authored kebab-case and reached camelCase through the styles
// object, so both spellings have to resolve to the same class.
const kebab = (s) => s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
function hasGreekCapableClass(line) {
  for (const m of line.matchAll(/[A-Za-z][\w-]*/g)) {
    if (GREEK_OK.has(m[0]) || GREEK_OK.has(kebab(m[0]))) return true;
  }
  return false;
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

    if (GREEK.test(line) && !(!isCss && hasGreekCapableClass(line))) {
      add('greek', file, n, rawLines[i],
        isCss ? 'Greek in CSS — confirm the face' : 'Greek text with no class that sets --font-sans');
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

// -------------------------------------------------------------- 5. doc forks
// Rule 15. The package ships the token catalogue and the ruleset, so a copy in a
// consuming repository is a snapshot of a moving target. This is not a tidiness
// check: enforcement hooks feed these files to agents on every edit, so a stale
// copy does not merely mislead a reader — it instructs a machine to reintroduce
// the fault it describes. Two consumers each kept their own catalogue and drifted
// until 388 of 452 lines differed; neither was updated when the applications
// migrated onto the package.
//
// Markdown is not in WALK_EXT, so this walks separately. The package is where the
// canonical documents live, so it is exempt by the same manifest test as the
// reimplementation check.
const SHIPPED_DOCS = new Set(['design-tokens.md', 'visual-ruleset.md']);
const PACKAGE_DOCS = 'node_modules/@ekdotico/domico/docs';

// Only files that are actually fed to an agent as instructions. A changelog or a
// design note may mention a filename in passing; an instruction file naming a
// local path is what sends the next edit to the wrong document.
//
// Deliberately NOT all of .claude/. That directory also holds archived reviews
// and audit records, which are dated accounts of what was true when they were
// written — a record that named a path correctly in May is not a defect in
// August, and rewriting it to satisfy a guard would falsify the history the
// record exists to keep. Only the directories whose contents are loaded as
// instructions are checked.
const INSTRUCTION_FILE =
  /(^|\/)(CLAUDE|AGENTS)\.md$|\.impeccable\.md$|(^|\/)\.claude\/(commands|hooks|agents|skills|rules)\//;

function walkMarkdown(dir, out = []) {
  let entries;
  try { entries = readdirSync(dir); } catch { return out; }
  for (const e of entries) {
    if (SKIP_DIRS.has(e)) continue;
    const p = join(dir, e);
    let st;
    try { st = statSync(p); } catch { continue; }
    if (st.isDirectory()) walkMarkdown(p, out);
    else if (extname(p) === '.md') out.push(p);
  }
  return out;
}

// Anything under .claude/hooks/, whatever its extension, plus the settings file
// that can carry an inline hook. These INJECT text into a model rather than
// waiting to be read, and that difference is why they need their own rule below.
function walkInjectors(appDir, out = []) {
  const hooks = join(appDir, '.claude', 'hooks');
  const walk = (dir) => {
    let entries;
    try { entries = readdirSync(dir); } catch { return; }
    for (const e of entries) {
      const p = join(dir, e);
      let st;
      try { st = statSync(p); } catch { continue; }
      if (st.isDirectory()) walk(p);
      else out.push(p);
    }
  };
  walk(hooks);
  const settings = join(appDir, '.claude', 'settings.json');
  if (existsSync(settings)) out.push(settings);
  return out;
}

if (!IS_PACKAGE_ITSELF) {
  const markdown = walkMarkdown(APP);
  const DOC_REF = /(design-tokens|visual-ruleset)\.md/g;

  const localCopies = markdown.filter((f) => SHIPPED_DOCS.has(basename(f)));
  for (const file of localCopies) {
    add('docfork', file, 1, relative(APP, file),
      `@ekdotico/domico ships this document — delete it and read ${PACKAGE_DOCS}/${basename(file)}`);
  }

  // The prose half runs ONLY where a local copy actually exists, and that
  // condition is the rule rather than an optimisation. A reference cannot send
  // anyone to a stale catalogue that is not there: with the file deleted, naming
  // it is either a dead link or — far more often — a sentence explaining that it
  // was removed and what to read instead. Documenting a removal is exactly what
  // these files should do, and the first two attempts at this check forbade it.
  //
  // Attempt one looked back 60 characters from each match for the package path,
  // which failed on a sentence that pointed at node_modules and then named the
  // old path while explaining why it went. Attempt two allowed any line
  // mentioning the package, which failed on wrapped markdown, where the package
  // path and the filename land on different lines. Both were guesses at intent
  // from surrounding text. Whether the file exists is not a guess.
  if (localCopies.length > 0) {
    for (const file of markdown) {
      const rel = relative(APP, file);
      if (SHIPPED_DOCS.has(basename(file))) continue;
      if (!INSTRUCTION_FILE.test(rel)) continue;

      readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
        if (line.includes('@ekdotico/domico')) return;
        for (const m of line.matchAll(DOC_REF)) {
          add('docfork', file, i + 1, line, `sends an agent to the local ${m[1]}.md`);
          // One finding per line. A markdown link names the file twice — once as
          // the text and once as the target — so counting matches double-reported
          // every link and inflated the total by roughly half.
          break;
        }
      });
    }
  }

  // Hooks, and the opposite rule, which is the point of treating them separately.
  //
  // A document waits to be read, so a sentence naming a deleted file is usually
  // history and is exempted above. A hook INJECTS its text into a model on every
  // matching edit, so it is never history: it is an instruction being given now.
  // A local path there is wrong whichever way it resolves — if the file exists it
  // is a fork, and if it does not the agent is sent nowhere as the first thing it
  // is told. So this arm fires unconditionally.
  //
  // Both consuming applications shipped exactly this defect and the markdown-only
  // walk could not see it: one hook opened with "Read the catalogue first —
  // docs/design-tokens.md, end to end" for a file that had just been deleted.
  // A shell case arm is a pattern deciding WHETHER the hook fires on the file being
  // edited. It is not text handed to a model, so a document name there is a
  // matcher and not an instruction — the first version of this arm flagged two of
  // them and would have left the hook unfixable, since the arm that matches the
  // package's own catalogue necessarily contains the filename.
  const CASE_ARM = /^\s*[\w*/.\[\]{},-]+\)\s*(?:[\w]+=|;;)/;

  const CORRECT_PREFIX = '@ekdotico/domico/docs/';

  for (const file of walkInjectors(APP)) {
    readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
      if (CASE_ARM.test(line)) return;
      for (const m of line.matchAll(DOC_REF)) {
        // The correct path, verbatim.
        if (line.slice(0, m.index).endsWith(CORRECT_PREFIX)) continue;

        // A glob that also matches the package path. `*/docs/design-tokens.md` is
        // how the hook's own matcher is written and documented, and it resolves
        // against node_modules as readily as against a local copy.
        if (line.slice(0, m.index).endsWith('*/docs/')) continue;

        // A bare mention on a line that ALREADY gives the correct path for the
        // same document. Then the reference is contextual prose — in practice a
        // sentence saying the local copy is deleted and naming what to read
        // instead — rather than a direction to a local file.
        //
        // This is narrower than it looks, and the narrowness is the point. An
        // earlier version allowed any line mentioning `@ekdotico/domico`, which was
        // too loose: the original defect's payload named the package's TOKEN
        // STYLESHEET while sending the agent to a local catalogue, and passed. The
        // test is the package path for THIS document, so that payload still fails
        // and a payload that states both the right path and the history does not.
        if (line.includes(`${CORRECT_PREFIX}${m[1]}.md`)) continue;

        add('docfork', file, i + 1, line,
          `HOOK: injects a local ${m[1]}.md into an agent — must be ${PACKAGE_DOCS}/${m[1]}.md`);
        break;
      }
    });
  }
}

// ------------------------------------------------------------------- report
const ORDER = ['docfork', 'greek', 'dupes', 'fallbacks', 'literals'];
const LABEL = {
  docfork: 'Local copy of a document the package ships (Rule 15)',
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
