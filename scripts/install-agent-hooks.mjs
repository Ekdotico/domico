#!/usr/bin/env node
/**
 * Install this package's agent hooks into the consuming repository.
 *
 *   node node_modules/@ekdotico/domico/scripts/install-agent-hooks.mjs
 *   node scripts/install-agent-hooks.mjs --target ../some-checkout
 *   node scripts/install-agent-hooks.mjs --check
 *
 * Run from a consumer's postinstall. Every hook under scripts/agent-hooks/ is
 * copied to <target>/.claude/hooks/ and made executable. The installed file is
 * a build output: consumers gitignore it, and it is rewritten on every install,
 * so the only way to change a hook is to change it here and release.
 *
 * Why this exists rather than a copy in each repository: the estate has already
 * paid twice for a document that lived in two places, and a hook is worse than a
 * document because it runs. Four hand-maintained copies of a shell script drift
 * the same way the token catalogue drifted, except the drift is invisible until
 * one repository blocks an edit that another allows. Shipping the hook with the
 * package also version-locks it to the guidelines it enforces.
 *
 * Deliberately not a symlink: consumers install through a package manager into
 * a store the repository does not own, and a symlink into node_modules breaks
 * the moment a fresh install relocates it — which is exactly when the guard is
 * needed and exactly when nobody would notice it had gone.
 *
 * Exit codes: 0 installed (or nothing to do), 1 a fault of its own. --check
 * exits 1 when an installed copy is missing or has been edited by hand, and is
 * for a CI job that wants to assert it; the install path itself never fails a
 * consumer's install over a hook.
 */

import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync, chmodSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const PACKAGE_ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const SOURCE_DIR = join(PACKAGE_ROOT, 'scripts', 'agent-hooks');
const VERSION = JSON.parse(readFileSync(join(PACKAGE_ROOT, 'package.json'), 'utf8')).version;

/**
 * The installed copy says what it is, on the reader's first line after the
 * shebang. Without it the file reads as the source — it opens by explaining
 * where it gets installed — and the first person to fix a bug fixes it in the
 * copy that gets overwritten. The version is in there so a report quoting the
 * hook says which release produced it.
 */
function render(source) {
  const [shebang, ...rest] = source.split('\n');
  return [
    shebang,
    '#',
    `# GENERATED FILE — installed from @ekdotico/domico ${VERSION} by`,
    '# scripts/install-agent-hooks.mjs. Do not edit here: the next `pnpm install`',
    '# overwrites it. The source is scripts/agent-hooks/ in that package.',
    ...rest,
  ].join('\n');
}

const args = process.argv.slice(2);
const check = args.includes('--check');
const targetArg = args.indexOf('--target');

/**
 * Default target: the directory the package manager ran the script from, which
 * for a postinstall is the consumer's root. Falls back to this checkout when
 * run inside the package itself.
 */
const target = resolve(targetArg === -1 ? process.env.INIT_CWD || process.cwd() : args[targetArg + 1]);
const destinationDir = join(target, '.claude', 'hooks');

if (!existsSync(SOURCE_DIR)) {
  // An older published version that predates the hooks. Not an error: the
  // consumer's postinstall must not fail because it is pinned one release back.
  process.exit(0);
}

const hooks = readdirSync(SOURCE_DIR).filter((name) => name.endsWith('.sh'));
if (hooks.length === 0) {
  process.exit(0);
}

if (check) {
  const stale = [];
  for (const name of hooks) {
    const installed = join(destinationDir, name);
    if (!existsSync(installed)) {
      stale.push(`${name}: not installed`);
      continue;
    }
    if (readFileSync(installed, 'utf8') !== render(readFileSync(join(SOURCE_DIR, name), 'utf8'))) {
      stale.push(`${name}: differs from the packaged source`);
    }
  }

  if (stale.length > 0) {
    console.error('Agent hooks are out of step with @ekdotico/domico:');
    for (const line of stale) console.error(`  ${line}`);
    console.error('\nRun: pnpm install   (the hook is installed by postinstall, never edited in place)');
    process.exit(1);
  }

  console.log(
    hooks.length === 1
      ? '1 agent hook matches the packaged source.'
      : `${hooks.length} agent hooks match the packaged source.`,
  );
  process.exit(0);
}

mkdirSync(destinationDir, { recursive: true });

let written = 0;
for (const name of hooks) {
  const contents = render(readFileSync(join(SOURCE_DIR, name), 'utf8'));
  const installed = join(destinationDir, name);

  // Rewrite only on change, so an install does not touch the mtime of a file a
  // running session has already read.
  if (!existsSync(installed) || readFileSync(installed, 'utf8') !== contents) {
    writeFileSync(installed, contents);
    written++;
  }
  chmodSync(installed, 0o755);
}

if (written > 0) {
  console.log(
    `install-agent-hooks: installed ${written} hook${written === 1 ? '' : 's'} into .claude/hooks/ from @ekdotico/domico.`,
  );
}
