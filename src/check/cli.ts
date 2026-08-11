#!/usr/bin/env node
/**
 * ekdotico-check — run the package's drift gates from a consuming repository.
 *
 *   ekdotico-check                 # every guard a consumer can run
 *   ekdotico-check contrast        # one of them
 *   ekdotico-check contrast styles
 *   ekdotico-check --list
 *
 * The guards existed only inside this repository: `scripts/` was excluded from
 * the published `files`, so docs, deree and praktico had no way to make any of
 * them a blocking check. They asserted the house style for the package and for
 * nobody who consumes it.
 *
 * A bin rather than a documented path into `node_modules`. A consumer reaching
 * for `node node_modules/@ekdotico/domico/scripts/check-contrast.mjs` is
 * depending on this package's internal layout, which then cannot be changed
 * without breaking three CI pipelines that were never told they were coupled to
 * it.
 *
 * Three guards regenerate or validate the authoring inputs and need this
 * repository's devDependencies, so they are refused with the reason rather than
 * offered and then failing on a missing import. A guard that cannot run is more
 * useful as a clear refusal than as a stack trace.
 */

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Package root, from dist/src/check/cli.js. */
const ROOT = fileURLToPath(new URL('../../../', import.meta.url));

interface Guard {
  /** The script under scripts/, without the check- prefix or the extension. */
  script: string;
  what: string;
  /** Stated when the guard cannot run outside this repository. */
  developmentOnly?: string;
  /**
   * Audits the calling repository's own source rather than this package's
   * artefacts, so it is handed the working directory. Every other guard reads
   * the token set and needs no argument.
   */
  targetsConsumer?: boolean;
}

const GUARDS: Record<string, Guard> = {
  contrast: {
    script: 'check-contrast',
    what: 'every foreground/surface pair meets its WCAG threshold, across all eight palettes',
  },
  discipline: {
    script: 'check-discipline',
    what:
      'no literal where a token exists, no var() fallback, no Greek resolving to ' +
      '--font-serif, and nothing reimplemented that this package already exports',
    targetsConsumer: true,
  },
  styles: {
    script: 'check-styles',
    what: 'every shipped stylesheet has balanced comments and braces',
  },
  appearance: {
    script: 'check-appearance',
    what: 'appearance resolution, the server-rendered attributes and state, and the bootstrap',
  },
  icons: {
    script: 'check-icons',
    what: 'every vendored icon matches its Lucide original (needs lucide-static)',
  },
  generated: {
    script: 'check-generated',
    what: 'no generated token artefact was edited by hand',
    developmentOnly: 'it rebuilds the tokens, which needs style-dictionary',
  },
  expression: {
    script: 'check-expression-sync',
    what: 'the guidelines prose and the structured data agree',
    developmentOnly: 'it validates the authoring schemas, which needs ajv',
  },
  exports: {
    script: 'check-exports',
    what: 'every export path is inside the published tarball',
    developmentOnly: 'it packs this package, which only means anything in its own repository',
  },
};

/** What `ekdotico-check` with no arguments runs. */
const DEFAULT_GUARDS = ['contrast', 'styles', 'appearance'] as const;

function list(): void {
  console.log('ekdotico-check — drift gates from @ekdotico/domico\n');
  for (const [name, guard] of Object.entries(GUARDS)) {
    const note = guard.developmentOnly ? '  [development only]' : '';
    console.log(`  ${name.padEnd(12)} ${guard.what}${note}`);
  }
  console.log(`\nWith no arguments: ${DEFAULT_GUARDS.join(', ')}.`);
}

function run(name: string, target: string): number {
  const guard = GUARDS[name];
  if (!guard) {
    console.error(`ekdotico-check: no guard named "${name}". Run ekdotico-check --list.`);
    return 2;
  }
  if (guard.developmentOnly) {
    console.error(
      `ekdotico-check: "${name}" runs only inside the domico repository, because ${guard.developmentOnly}.`,
    );
    return 2;
  }

  const script = join(ROOT, 'scripts', `${guard.script}.mjs`);
  if (!existsSync(script)) {
    console.error(
      `ekdotico-check: ${script} is missing from the installed package. ` +
        'This is a packaging fault — please report it.',
    );
    return 2;
  }

  const args = guard.targetsConsumer ? [script, target] : [script];
  const result = spawnSync(process.execPath, args, { stdio: 'inherit' });
  if (result.error) {
    console.error(`ekdotico-check: could not run "${name}": ${result.error.message}`);
    return 2;
  }
  return result.status ?? 1;
}

const argv = process.argv.slice(2);

if (argv.includes('--help') || argv.includes('-h') || argv.includes('--list')) {
  list();
  process.exit(0);
}

// Guard names and an optional target directory, in any order. The target is
// only meaningful to a guard that audits the calling repository, and defaults to
// the working directory — but `ekdotico-check discipline .` is the form a person
// reaches for, and reading the `.` as a guard name made the CLI exit 2 while
// every check underneath it passed. A gate that fails green is worse than no
// gate, so a path is recognised as a path.
//
// A token is a path only if it looks like one or exists. Anything else is a
// mistyped guard name and is reported, rather than being silently swallowed as a
// directory that does not exist.
const names: string[] = [];
let target: string | undefined;

for (const arg of argv) {
  if (arg in GUARDS) {
    names.push(arg);
  } else if (arg === '.' || arg === '..' || /^[.~/]/.test(arg) || existsSync(arg)) {
    if (target !== undefined) {
      console.error(`ekdotico-check: more than one directory given ("${target}", "${arg}").`);
      process.exit(2);
    }
    target = arg;
  } else {
    console.error(`ekdotico-check: no guard named "${arg}". Run ekdotico-check --list.`);
    process.exit(2);
  }
}

const requested = names.length > 0 ? names : [...DEFAULT_GUARDS];
const resolvedTarget = resolve(target ?? process.cwd());
let worst = 0;
for (const name of requested) {
  const status = run(name, resolvedTarget);
  if (status > worst) worst = status;
}
process.exit(worst);
