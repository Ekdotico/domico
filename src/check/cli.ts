#!/usr/bin/env node
/**
 * ekdotico-check — run the package's drift gates from a consuming repository.
 *
 *   ekdotico-check                 # every guard a consumer can run, except decay
 *   ekdotico-check contrast        # one of them
 *   ekdotico-check contrast styles
 *   ekdotico-check decay           # the monthly audit, run on its own clock
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
 * Some guards regenerate or validate the authoring inputs, or compare against a
 * devDependency only this repository installs, so they are refused with the
 * reason rather than offered and then failing on a missing import. A guard that
 * cannot run is more useful as a clear refusal than as a stack trace. They carry
 * `developmentOnly`, and the no-argument set is derived so that they cannot be
 * picked up by it — see DEFAULT_GUARDS. Counting them here would be a fact with
 * nothing keeping it true; `--list` marks each one.
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
  collaborators: {
    script: 'check-collaborators',
    what:
      'every collaborator slot holds its label, its caret and its selection wash against ' +
      'every ground, and stays apart from every other slot, across all eight palettes',
  },
  discipline: {
    script: 'check-discipline',
    what:
      'no literal where a token exists, no var() fallback, no Greek resolving to ' +
      '--font-serif, and nothing reimplemented that this package already exports',
    targetsConsumer: true,
  },
  a11y: {
    script: 'check-a11y',
    what:
      'every Mermaid diagram carries accTitle and accDescr, no non-operable role takes ' +
      'focus, aria-modal keeps its Tab cycle and inert background, every aria reference ' +
      'resolves, every removed outline returns as an outline on :focus-visible, every ' +
      'icon-only button carries a name, every generic element in the Tab order carries ' +
      'a role and a name, no placeholder is set in --fg-4 or --fg-5, no form control is ' +
      'bordered with a hairline, no tooltip holds a link or a button, and every ' +
      'role="menu" answers to the arrow keys',
    targetsConsumer: true,
  },
  copy: {
    script: 'check-copy',
    what:
      'the mechanical subset of the Expression Guidelines, over the copy this ' +
      'repository ships (skipped where there is no .ekdotico-lint.json)',
    targetsConsumer: true,
  },
  decay: {
    script: 'check-decay',
    what:
      'no path, pnpm script, guard name or URL named in an instruction file has ' +
      'stopped resolving, and the design system is pinned exactly',
    targetsConsumer: true,
  },
  styles: {
    script: 'check-styles',
    what:
      'no 0.01ms motion ceiling, no coloured edge stripe, and no case transform, ' +
      'in this repository’s own stylesheets',
    /**
     * Consumer-targeting since the Rule 17 sweep. Before that this guard read
     * the package's `dist/styles` whatever directory it was invoked from, so a
     * consumer running it got a pass about somebody else's CSS — which is how
     * thirty-five `text-transform` declarations survived in two applications
     * across the release that removed the same declaration from the package.
     */
    targetsConsumer: true,
  },
  appearance: {
    script: 'check-appearance',
    what: 'appearance resolution, the server-rendered attributes and state, and the bootstrap',
  },
  icons: {
    script: 'check-icons',
    what: 'every vendored icon matches its Lucide original',
    /**
     * Declared rather than merely documented in `what`. The guard reads
     * node_modules/lucide-static/icons inside THIS package, and exits 2 when it
     * is absent — which it is in every consumer, because lucide-static is a
     * devDependency here and consumers are told not to install Lucide at all.
     *
     * It mattered once the default guard set stopped being a hand-written list:
     * a guard that cannot run outside this repository, and does not say so, is
     * a red pipeline in three applications the moment it is picked up
     * automatically.
     */
    developmentOnly: 'it compares against lucide-static, which only this repository installs',
  },
  svg: {
    script: 'check-svg',
    what: 'annotateSvg writes <title> and <desc> in document order and names the image only when it can',
    developmentOnly: 'it builds a DOM with jsdom, which only this repository installs',
  },
  components: {
    script: 'check-components',
    what:
      'the shared components and the a11y helpers name, label, inert and return focus ' +
      'as documented, rendered against a real DOM',
    developmentOnly: 'it renders React into jsdom, which only this repository installs',
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

/**
 * What `ekdotico-check` with no arguments runs: every guard a consumer can run.
 *
 * Derived from GUARDS rather than listed, and that is the whole point of it. A
 * hand-kept list here is a second place to remember, and it is the one that gets
 * forgotten: the previous literal named contrast, styles and appearance, so a
 * consumer that trusted the no-argument form — which this file's own docstring
 * told it ran everything — got neither `discipline` nor `a11y`, the two guards
 * written specifically for consumers. Deriving it means a guard added to this
 * package arms itself in all three applications at their next pin bump, with no
 * change to any of their workflows.
 *
 * Two exclusions, both structural rather than by name:
 *
 *   developmentOnly   needs this repository's devDependencies. Refused with the
 *                     reason rather than run, so it cannot be picked up here.
 *   decay             runs on a different clock. It reads instruction documents,
 *                     which do not change on most commits, so it belongs to the
 *                     monthly audit workflow rather than to every pull request.
 *                     Running it per-change would make it noise, and noise is
 *                     how a gate stops being read.
 */
const DEFAULT_GUARDS: string[] = Object.entries(GUARDS)
  .filter(([name, guard]) => !guard.developmentOnly && name !== 'decay')
  .map(([name]) => name);

function list(): void {
  console.log('ekdotico-check — drift gates from @ekdotico/domico\n');
  for (const [name, guard] of Object.entries(GUARDS)) {
    const note = guard.developmentOnly ? '  [development only]' : '';
    console.log(`  ${name.padEnd(14)} ${guard.what}${note}`);
  }
  console.log(`\nWith no arguments: ${DEFAULT_GUARDS.join(', ')}.`);
}

function run(name: string, target: string, extra: string[] = []): number {
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

  const args = guard.targetsConsumer ? [script, target, ...extra] : [script, ...extra];
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
const flags: string[] = [];
let target: string | undefined;

for (const arg of argv) {
  if (arg in GUARDS) {
    names.push(arg);
  } else if (arg.startsWith('--')) {
    // Forwarded, not interpreted. `ekdotico-check discipline --quiet` used to exit
    // 2 with "no guard named --quiet" while every check underneath it passed — the
    // same fails-green shape as reading a trailing `.` as a guard name, and just as
    // bad in a pipeline, because the gate goes red with nothing wrong. The guards
    // own their own flags; this CLI has no business vetting them, so an unknown one
    // is the guard's to reject.
    flags.push(arg);
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
  const status = run(name, resolvedTarget, flags);
  if (status > worst) worst = status;
}
process.exit(worst);
