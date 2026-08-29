#!/usr/bin/env node
// Expression Guidelines guard for @ekdotico/domico consumers.
//
// A thin wrapper around the `ekdotico-lint` binary, so that the copy check is
// reachable from the same place as every other gate. Before this existed the
// linter was a second entry point a consumer had to know about separately, and
// the result was the predictable one: three applications each shipped a
// .ekdotico-lint.json, and one of the three ran it. A gate nobody invokes is a
// config file with opinions.
//
// The wrapper is needed rather than pointing the CLI straight at the lint
// binary, because the two take their target differently. Every guard here reads
// an application directory from argv; the linter is driven entirely by
// process.cwd(), and reads any positional argument as a glob. Handing it a
// directory the way the other guards are handed one would silently lint that
// one path instead of the configured set.
//
// Usage: node check-copy.mjs [appDir] [--format json] [--fail-on <severity>]

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const APP = process.argv[2] && !process.argv[2].startsWith('-') ? process.argv[2] : process.cwd();
const FLAGS = process.argv.slice(2).filter((a) => a.startsWith('-'));

const CLI = join(ROOT, 'dist', 'src', 'lint', 'cli.js');
const CONFIG = join(APP, '.ekdotico-lint.json');

// A consumer with no copy to check is not a failure — a package of pure
// utilities has nothing for this to read, and forcing it to write an empty
// config to stay green would teach people that the file is ceremony.
//
// Announced rather than silent, though, and on the same line the guard would
// otherwise report on. The CLI's own docstring calls a gate that passes without
// checking anything worse than no gate at all, and a skip nobody can see in the
// log is exactly that shape.
if (!existsSync(CONFIG)) {
  console.log(
    'copy  skipped: no .ekdotico-lint.json in this repository, so no copy was checked.\n' +
      '      Add one to put the Expression Guidelines under this gate.',
  );
  process.exit(0);
}

if (!existsSync(CLI)) {
  console.error(
    `check-copy: ${CLI} is missing from the installed package. ` +
      'This is a packaging fault — please report it.',
  );
  process.exit(2);
}

// cwd rather than an argument: see the note at the top. The linter resolves its
// config, its globs and every reported path against the working directory.
const result = spawnSync(process.execPath, [CLI, ...FLAGS], { cwd: APP, stdio: 'inherit' });
if (result.error) {
  console.error(`check-copy: could not run the linter: ${result.error.message}`);
  process.exit(2);
}
process.exit(result.status ?? 1);
