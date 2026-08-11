#!/usr/bin/env node
/**
 * Does this repository still describe itself accurately?
 *
 * `check-discipline` catches drift a commit introduces. This catches drift that
 * arrives without one — a path that was correct until a file moved, a URL that
 * was live until DNS changed, a version that was current until a release. Nothing
 * in a per-pull-request gate looks for those, because no pull request causes them.
 *
 * Written after an audit of four repositories found thirty issues, of which these
 * five checks would have caught roughly twenty:
 *
 *   paths    a file path named in an instruction file that does not exist
 *   scripts  a `pnpm <script>` named in a document that package.json lacks
 *   guards   an `ekdotico-check <guard>` named in a document that does not exist
 *   urls     an http(s) URL in a document that no longer answers
 *   version  @ekdotico/domico not pinned exactly, or behind the published latest
 *
 * The judgement half of an audit is not here and cannot be. This finds a path that
 * does not resolve; it cannot find a sentence that is false. "The production site
 * is https://ekdoti.co" was wrong for months and every character of it parsed.
 *
 * Usage:
 *   node check-decay.mjs [dir] [--no-urls] [--quiet] [--json]
 *
 * Exit 0 clean, 1 findings, 2 could not run.
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, relative, extname, dirname } from 'node:path';

const APP = process.argv.find((a, i) => i >= 2 && !a.startsWith('--')) ?? process.cwd();
const QUIET = process.argv.includes('--quiet');
const AS_JSON = process.argv.includes('--json');
const CHECK_URLS = !process.argv.includes('--no-urls');

const SKIP_DIRS = new Set([
  'node_modules', '.next', '.git', 'dist', 'build', '.vercel', '.turbo',
  'coverage', '.wrangler', 'worktrees', '.open-next', 'claude-design',
]);

// Dated records. A path that was correct in May is not a defect in August, and
// rewriting a record to satisfy a guard falsifies the history it exists to keep.
// Same exemption `check-discipline` makes, for the same reason.
const ARCHIVE = /(^|\/)(AUDIT-|CHANGELOG)|\.claude\/PRPs\/|\/plans\/|\/reviews\//;

// Files whose contents are instructions rather than prose about the project.
const INSTRUCTION = /(^|\/)(CLAUDE|AGENTS|README)\.md$|\.impeccable\.md$|(^|\/)\.claude\/(commands|hooks|agents|skills|rules)\//;

const findings = [];
const add = (check, file, line, what, fix) =>
  findings.push({ check, file: relative(APP, file), line, what, fix });

// A fenced block illustrates; prose asserts. An example config naming
// `components/CommandPalette.tsx` is describing somebody else's tree, and the first
// version of this check reported it as a missing file in this one. Blanks the lines
// rather than dropping them, so reported line numbers stay true.
function blankFences(src) {
  const lines = src.split('\n');
  let inFence = false;
  return lines
    .map((l) => {
      if (/^\s*(```|~~~)/.test(l)) { inFence = !inFence; return ''; }
      return inFence ? '' : l;
    })
    .join('\n');
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
    else out.push(p);
  }
  return out;
}

const manifestPath = join(APP, 'package.json');
if (!existsSync(manifestPath)) {
  console.error(`check-decay: no package.json under ${APP}.`);
  process.exit(2);
}
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const scripts = new Set(Object.keys(manifest.scripts ?? {}));

const all = walk(APP);
const docs = all.filter(
  (f) => extname(f) === '.md' || /\.claude\/(commands|hooks|agents|skills|rules)\//.test(relative(APP, f)),
);
const targeted = docs.filter((f) => {
  const rel = relative(APP, f);
  return INSTRUCTION.test(rel) && !ARCHIVE.test(rel);
});

// ------------------------------------------------------------------- 1. paths
// A repo-relative path inside backticks or a markdown link. Deliberately narrow:
// prose mentions filenames constantly, and a guard that flags every one of them
// gets switched off. Requires a directory separator and a known extension, which
// is what distinguishes "src/app/layout.tsx" from "a layout".
const PATH_REF =
  /(?:`|\]\(|"|')((?:\.\/)?(?:[\w.@-]+\/)+[\w.@-]+\.(?:ts|tsx|js|jsx|mjs|cjs|css|json|md|mdx|xml|svg|sh|yml|yaml|toml|jsonc))(?:`|\)|"|')/g;

// A bare package specifier looks exactly like a path and is not one.
// `@ekdotico/domico/tokens.css` is an export subpath resolved by the module
// resolver against the exports map, and no such file sits at the repository root —
// the first version of this check reported twenty-seven of them.
const deps = new Set([
  ...Object.keys(manifest.dependencies ?? {}),
  ...Object.keys(manifest.devDependencies ?? {}),
  ...Object.keys(manifest.peerDependencies ?? {}),
]);
// And a package's own export subpaths look like paths too. `styles/appearance.css`
// is `"./styles/appearance.css"` in this manifest's exports map, which resolves to a
// build output rather than to a source file — so the exports map is the authority on
// whether it is real, not the filesystem. Consulting it beats rewriting every
// mention to carry the full specifier.
const exportSubpaths = new Set(
  Object.keys(manifest.exports ?? {}).map((k) => k.replace(/^\.\//, '')),
);

// And the same for an installed dependency's exports, because a consuming
// repository writes `styles/appearance.css` meaning the package's export and has no
// such file of its own. Reading the installed manifest keeps the list current
// without this guard hardcoding what the package ships.
for (const name of deps) {
  const dm = join(APP, 'node_modules', ...name.split('/'), 'package.json');
  if (!existsSync(dm)) continue;
  try {
    for (const k of Object.keys(JSON.parse(readFileSync(dm, 'utf8')).exports ?? {})) {
      exportSubpaths.add(k.replace(/^\.\//, ''));
    }
  } catch { /* an unreadable manifest is not this guard's problem */ }
}

const isSpecifier = (p) => {
  if (p.startsWith('@')) return true;
  if (exportSubpaths.has(p)) return true;
  const first = p.split('/')[0];
  return deps.has(first) || deps.has(`@types/${first}`);
};

// Prose asserting that a file is ABSENT is correct documentation, not a stale
// reference. `.impeccable.md` says "there is no `src/styles/base.css`" and it is
// right: that name is a build output and never a source. This is the third place the
// same lesson has landed — the drift guard needed it for deleted catalogues, and its
// hook arm needed the inverse — so the shape is worth naming. A document is allowed
// to say what does not exist; the check is for a reference that PRETENDS it does.
//
// Cues are specific rather than a bare "no" or "not", because over-exempting hides
// real stale paths. The window spans the previous line: prose wraps, and the
// sentence that motivated this ended a line on "there is no".
const ABSENCE =
  /\b(there is no|there are no|no longer|does not exist|do not exist|has never existed|never existed|deleted|removed|is gone|are gone|used to|formerly|not authored|instead of|rather than|absent|neither|nor|earlier revision|earlier revisions|pre-v\d|no such|was replaced|superseded)\b/i;

// Collected first, then filtered against .gitignore in one pass, because a path
// that is ignored is EXPECTED to be absent from a checkout. `.vercel/project.json`
// exists on every developer's machine and in no clone, so a document naming it is
// correct — and this check passed locally and failed in CI on exactly that, which is
// what CI is for. git is asked rather than .gitignore parsed, because git handles
// nested ignore files and negations and a hand-rolled matcher would not.
const missing = [];

for (const file of targeted) {
  const src = blankFences(readFileSync(file, 'utf8'));
  const lines = src.split('\n');
  lines.forEach((line, i) => {
    // Previous, current AND next line. The negation lands after the reference as
    // often as before it — "at `src/app/appearance.tsx`. Both that file and its CSS
    // Module are gone" put the cue on the following line, and a two-line window
    // reported correct documentation as a stale path.
    const window = `${lines[i - 1] ?? ''} ${line} ${lines[i + 1] ?? ''}`;
    for (const m of line.matchAll(PATH_REF)) {
      const p = m[1].replace(/^\.\//, '');
      if (ABSENCE.test(window)) continue;
      // Paths into an installed dependency, and paths belonging to another
      // repository in the estate, are not this repository's to resolve.
      if (p.startsWith('node_modules/')) continue;
      if (isSpecifier(p)) continue;
      if (/^(domico|docs|deree|internal)\//.test(p) && !existsSync(join(APP, p))) continue;
      if (existsSync(join(APP, p))) continue;
      // A path relative to the document rather than the repo root.
      if (existsSync(join(dirname(file), p))) continue;
      missing.push({ p, file, line: i + 1 });
    }
  });
}

// One `git check-ignore` for every candidate rather than one per path. If git is
// unavailable or this is not a work tree, every candidate is reported: the check
// degrades to its previous behaviour rather than silently passing, because a guard
// that goes quiet when a tool is missing is worse than one that is noisy.
if (missing.length) {
  let ignored = new Set();
  const res = spawnSync('git', ['-C', APP, 'check-ignore', '--stdin'], {
    input: missing.map((m) => m.p).join('\n'),
    encoding: 'utf8',
  });
  // Exit 0 means at least one path is ignored; 1 means none are; anything else is
  // git failing, and then nothing is exempt.
  if (!res.error && (res.status === 0 || res.status === 1)) {
    ignored = new Set((res.stdout ?? '').split('\n').map((l) => l.trim()).filter(Boolean));
  }
  for (const m of missing) {
    if (ignored.has(m.p)) continue;
    add('paths', m.file, m.line, m.p,
      'the file does not exist — correct or remove the reference');
  }
}

// ----------------------------------------------------------------- 2. scripts
for (const file of targeted) {
  const src = blankFences(readFileSync(file, 'utf8'));
  src.split('\n').forEach((line, i) => {
    // Inside a code span only. Prose says "pnpm never installs it transitively" and
    // "`pnpm deploy` is a built-in pnpm command", and matching bare text turned both
    // into findings for scripts named `never` and `command`. A real invocation in
    // these documents is always written as code.
    const spans = [...line.matchAll(/`([^`]+)`/g)].map((s) => s[1]).join(' ; ');
    for (const m of spans.matchAll(/\bpnpm (?:run )?([a-z][\w:-]*)/g)) {
      const name = m[1];
      // pnpm's own verbs, and package specifiers rather than script names.
      if (['add', 'install', 'exec', 'dlx', 'why', 'config', 'up', 'remove', 'list', 'store', 'link', 'create', 'init', 'publish', 'pack', 'audit', 'outdated', 'deploy', 'test'].includes(name)) continue;
      if (scripts.has(name)) continue;
      add('scripts', file, i + 1, `pnpm ${name}`, 'no such script in package.json');
    }
  });
}

// ------------------------------------------------------------------ 3. guards
const GUARDS = (() => {
  const cli = join(APP, 'node_modules', '@ekdotico', 'domico', 'dist', 'src', 'check', 'cli.js');
  const local = join(APP, 'dist', 'src', 'check', 'cli.js');
  const path = existsSync(cli) ? cli : existsSync(local) ? local : null;
  if (!path) return null;
  const src = readFileSync(path, 'utf8');
  const block = src.slice(src.indexOf('GUARDS'), src.indexOf('DEFAULT_GUARDS'));
  return new Set([...block.matchAll(/^\s{4}([a-z]+):\s*\{/gm)].map((m) => m[1]));
})();

if (GUARDS && GUARDS.size > 0) {
  for (const file of targeted) {
    const src = readFileSync(file, 'utf8');
    src.split('\n').forEach((line, i) => {
      for (const m of line.matchAll(/ekdotico-check\s+([a-z][\w-]*)/g)) {
        if (GUARDS.has(m[1]) || m[1].startsWith('--')) continue;
        add('guards', file, i + 1, `ekdotico-check ${m[1]}`,
          `no such guard — have: ${[...GUARDS].join(', ')}`);
      }
    });
  }
}

// ----------------------------------------------------------------- 4. version
const dep =
  manifest.dependencies?.['@ekdotico/domico'] ?? manifest.devDependencies?.['@ekdotico/domico'];
if (dep) {
  if (/^[\^~>=<]/.test(dep)) {
    add('version', manifestPath, 1, `@ekdotico/domico ${dep}`,
      'pin exactly — a range lets an unreviewed visual change arrive through a routine install');
  }
  const installed = join(APP, 'node_modules', '@ekdotico', 'domico', 'package.json');
  if (existsSync(installed)) {
    const have = JSON.parse(readFileSync(installed, 'utf8')).version;
    if (have !== dep.replace(/^[\^~>=<\s]+/, '')) {
      add('version', manifestPath, 1, `declares ${dep}, installed ${have}`,
        'run pnpm install so the lockfile and the manifest agree');
    }
  }
}

// -------------------------------------------------------------------- 5. urls
// A URL that stopped answering is the decay a commit-triggered gate cannot see.
// Network failures are reported as inconclusive rather than as findings, because a
// gate that goes red when a runner's DNS hiccups gets switched off.
const inconclusive = [];
if (CHECK_URLS) {
  const urls = new Map();
  for (const file of targeted) {
    blankFences(readFileSync(file, 'utf8')).split('\n').forEach((line, i) => {
      for (const m of line.matchAll(/https?:\/\/[\w.-]+(?:\/[\w./#?&=%~+-]*)?/g)) {
        const u = m[0].replace(/[.,)`'"\]]+$/, '');
        // Placeholders, loopback, and hosts that exist to be examples.
        if (/localhost|127\.0\.0\.1|example\.(com|org)|0\.0\.0\.0|<|\$\{/.test(u)) continue;
        if (!urls.has(u)) urls.set(u, { file, line: i + 1 });
      }
    });
  }

  const results = await Promise.all(
    [...urls].map(async ([u, where]) => {
      try {
        const ctl = AbortSignal.timeout(12_000);
        let res = await fetch(u, { method: 'HEAD', redirect: 'follow', signal: ctl });
        // Some hosts refuse HEAD but serve GET.
        if (res.status === 405 || res.status === 501) {
          res = await fetch(u, { method: 'GET', redirect: 'follow', signal: AbortSignal.timeout(12_000) });
        }
        return { u, where, status: res.status };
      } catch (err) {
        return { u, where, error: err.name === 'TimeoutError' ? 'timeout' : err.message };
      }
    }),
  );

  for (const r of results) {
    if (r.error) {
      inconclusive.push(`${r.u} — ${r.error}`);
    } else if (r.status >= 400) {
      add('urls', r.where.file, r.where.line, `${r.u} -> ${r.status}`,
        'the URL no longer answers — correct it or remove the claim');
    }
  }
}

// ------------------------------------------------------------------- report
const ORDER = ['paths', 'scripts', 'guards', 'version', 'urls'];
const LABEL = {
  paths: 'A path named in an instruction file does not exist',
  scripts: 'A pnpm script named in a document does not exist',
  guards: 'An ekdotico-check guard named in a document does not exist',
  version: 'The design-system dependency is not pinned, or is out of step',
  urls: 'A URL named in a document no longer answers',
};

if (AS_JSON) {
  console.log(JSON.stringify({ app: APP, findings, inconclusive }, null, 2));
  process.exit(findings.length ? 1 : 0);
}

console.log(`\ncheck-decay — ${relative(process.cwd(), APP) || APP}  (${targeted.length} instruction files)\n`);
for (const check of ORDER) {
  const hits = findings.filter((f) => f.check === check);
  if (!hits.length) { console.log(`  ok    ${check.padEnd(8)} ${LABEL[check]}`); continue; }
  console.log(`  FAIL  ${check.padEnd(8)} ${hits.length} — ${LABEL[check]}`);
  if (QUIET) continue;
  for (const h of hits.slice(0, 10)) {
    console.log(`          ${h.file}:${h.line}  ${h.what}\n            ${h.fix}`);
  }
  if (hits.length > 10) console.log(`          … and ${hits.length - 10} more`);
}
if (GUARDS === null) console.log('\n  note  guards: @ekdotico/domico is not installed, so guard names were not checked.');
if (inconclusive.length) {
  console.log(`\n  note  ${inconclusive.length} URL(s) were inconclusive, not counted as findings:`);
  for (const i of inconclusive.slice(0, 5)) console.log(`          ${i}`);
}

console.log(`\n  ${findings.length === 0 ? 'PASS' : `${findings.length} finding(s)`}\n`);
process.exit(findings.length === 0 ? 0 : 1);
