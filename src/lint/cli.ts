#!/usr/bin/env node
/**
 * ekdotico-lint — copy compliance against the Ekdotico Expression Guidelines.
 *
 *   ekdotico-lint "app/**\/*.mdx"
 *   ekdotico-lint --format json --fail-on blocking "content/**\/*.md"
 *   ekdotico-lint --warn-only "app/**\/*.mdx"
 *
 * Configuration is optional and lives in `.ekdotico-lint.json`:
 *
 *   {
 *     "files": ["app/**\/*.mdx", "components/**\/*.tsx"],
 *     "failOn": "substantive",
 *     "registers": {
 *       "app/design/**": "instructional",
 *       "components/CommandPalette.tsx": ["functional", "system-feedback"]
 *     },
 *     "overrides": [
 *       { "files": "app/legal/**", "rules": ["controlling-obligation"],
 *         "reason": "Statutory wording, reviewed by counsel 2026-08-01." }
 *     ]
 *   }
 *
 * `registers` maps a path glob to the register its copy is in. Register-scoped
 * rules run only where a register is declared: the linter does not guess, and
 * it reports how many rules it skipped for want of one.
 */

import { readFileSync, existsSync } from 'node:fs';
import { glob } from 'node:fs/promises';
import { relative, resolve } from 'node:path';
import { lintText, shouldFail, type LintResult, type Register, type Severity } from './index.js';
import { formatJson, formatText } from './report.js';
import { matchesGlob, type ConfigOverride } from './overrides.js';

interface Config {
  files?: string[];
  /**
   * Paths with no user-facing copy at all: route handlers, structured-data
   * emitters, DOM mechanics. Excluding them is different in kind from an
   * override — an override says "this rule does not apply here and here is
   * why", whereas these files have nothing for any rule to apply to.
   *
   * Use it only where that is genuinely true. A file with a single aria-label
   * has copy, and belongs in the scan with an override if a rule misfires.
   */
  ignore?: string[];
  failOn?: Severity;
  /**
   * Path glob to the register its copy is in, or to the list of registers it
   * hosts. A list is not a hedge: it is the §5.6 Step 4 case, where one file
   * carries copy from several registers and each register's rules must run.
   */
  registers?: Record<string, Register | Register[]>;
  overrides?: ConfigOverride[];
}

function parseArgs(argv: string[]) {
  const patterns: string[] = [];
  let format: 'text' | 'json' = 'text';
  let failOn: Severity | null = null;
  let warnOnly = false;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === undefined) continue;
    if (arg === '--format') format = argv[++i] === 'json' ? 'json' : 'text';
    else if (arg === '--fail-on') failOn = (argv[++i] ?? 'substantive') as Severity;
    else if (arg === '--warn-only') warnOnly = true;
    else if (arg === '--help' || arg === '-h') {
      console.log(
        [
          'ekdotico-lint — copy compliance against the Ekdotico Expression Guidelines',
          '',
          'Usage: ekdotico-lint [options] [glob...]',
          '',
          '  --format text|json   Output format. Default text.',
          '  --fail-on SEVERITY   blocking | substantive | minor. Default substantive.',
          '  --warn-only          Report findings and exit 0. For a first adoption run.',
          '',
          'Reads .ekdotico-lint.json when present. Globs given on the command line',
          'take precedence over the config file.',
        ].join('\n'),
      );
      process.exit(0);
    } else if (!arg.startsWith('-')) patterns.push(arg);
  }

  return { patterns, format, failOn, warnOnly };
}

const args = parseArgs(process.argv.slice(2));
const cwd = process.cwd();

const configPath = resolve(cwd, '.ekdotico-lint.json');
const config: Config = existsSync(configPath)
  ? JSON.parse(readFileSync(configPath, 'utf8'))
  : {};

const patterns = args.patterns.length > 0 ? args.patterns : (config.files ?? []);
if (patterns.length === 0) {
  console.error(
    'No files to check. Pass a glob, or set "files" in .ekdotico-lint.json.\n' +
      'For example: ekdotico-lint "app/**/*.mdx"',
  );
  process.exit(2);
}

const failOn: Severity = args.failOn ?? config.failOn ?? 'substantive';

/** The declared register(s) for a path, or undefined if none is configured. */
function registerFor(path: string): Register | Register[] | undefined {
  for (const [pattern, register] of Object.entries(config.registers ?? {})) {
    if (matchesGlob(path, pattern)) return register;
  }
  return undefined;
}

const matched: string[] = [];
for (const pattern of patterns) {
  for await (const entry of glob(pattern, { cwd })) matched.push(entry);
}

const ignore = config.ignore ?? [];
const files = matched.filter((f) => !ignore.some((pattern) => matchesGlob(f, pattern)));
const ignoredCount = matched.length - files.length;

if (files.length === 0) {
  console.error(`No files matched: ${patterns.join(', ')}`);
  process.exit(2);
}

const results: LintResult[] = files.sort().map((file) => {
  const path = relative(cwd, resolve(cwd, file));
  return lintText(readFileSync(resolve(cwd, file), 'utf8'), path, {
    register: registerFor(path),
    overrides: config.overrides ?? [],
  });
});

console.log(args.format === 'json' ? formatJson(results) : formatText(results, failOn));

// Reported rather than silent. A file excluded from the scan is a file nobody
// is checking, and that should be visible in every run rather than buried in
// a config nobody rereads.
if (ignoredCount > 0 && args.format !== 'json') {
  console.log(
    `\n${ignoredCount} file${ignoredCount === 1 ? '' : 's'} excluded by "ignore" as containing no user-facing copy.`,
  );
}

if (args.warnOnly) process.exit(0);
process.exit(shouldFail(results, failOn) ? 1 : 0);
