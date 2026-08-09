#!/usr/bin/env node
/**
 * Fail the build if the prose guidelines and the structured expression data
 * disagree.
 *
 * Three checks:
 *   1. The generated regions of guidelines.md match what the JSON renders.
 *   2. registers.md matches section 5 of guidelines.md.
 *   3. The two JSON files declare the same version, and it matches the version
 *      stated in the guidelines header.
 *
 * The third is the one that catches the failure this extraction exists to fix:
 * two documents claiming the same version number while saying different things.
 */

import { readFileSync, existsSync } from 'node:fs';
// Ajv's default entry implements draft-07; the schemas here are 2020-12.
import Ajv from 'ajv/dist/2020.js';
import { render, renderRegisters } from './build-expression.mjs';

const HERE = new URL('../expression/', import.meta.url).pathname;
const failures = [];

// 0. Schema validation --------------------------------------------------------
// Runs first: a malformed rule silently disables itself rather than erroring,
// so a typo in `severity` or a missing `replacement` would quietly reduce
// coverage while every other check still passed.
const ajv = new Ajv({ allErrors: true, strict: false });

for (const name of ['vocabulary', 'prohibited']) {
  const schemaPath = `${HERE}${name}.schema.json`;
  if (!existsSync(schemaPath)) {
    failures.push(`${name}.schema.json is missing, but ${name}.json declares $schema against it.`);
    continue;
  }
  const validate = ajv.compile(JSON.parse(readFileSync(schemaPath, 'utf8')));
  if (!validate(JSON.parse(readFileSync(`${HERE}${name}.json`, 'utf8')))) {
    for (const e of validate.errors ?? []) {
      failures.push(`${name}.json${e.instancePath || ' (root)'} ${e.message}`);
    }
  }
}

// Stop here if the data is malformed. Every check below renders from it, and
// rendering from invalid data produces a crash rather than a diagnosis — the
// schema errors are the useful message, so report them and leave.
if (failures.length > 0) {
  console.error('check:expression failed — the structured data does not match its schema:\n');
  for (const f of failures) console.error(`  - ${f}`);
  console.error('\nFix the data before the sync checks can run.');
  process.exit(1);
}

// 1. Generated regions -----------------------------------------------------
const onDisk = readFileSync(HERE + 'guidelines.md', 'utf8');
const rendered = render();
if (onDisk !== rendered) {
  failures.push(
    'guidelines.md does not match expression/vocabulary.json and expression/prohibited.json.\n' +
      '    A generated region was edited by hand, or the JSON changed without a rebuild.\n' +
      '    Fix with: pnpm build:expression',
  );
}

// 2. registers.md ----------------------------------------------------------
if (!existsSync(HERE + 'registers.md')) {
  failures.push('registers.md is missing. Fix with: pnpm build:expression');
} else if (readFileSync(HERE + 'registers.md', 'utf8') !== renderRegisters(rendered)) {
  failures.push(
    'registers.md does not match section 5 of guidelines.md.\n' +
      '    Fix with: pnpm build:expression',
  );
}

// 3. Versions --------------------------------------------------------------
const vocabulary = JSON.parse(readFileSync(HERE + 'vocabulary.json', 'utf8'));
const prohibited = JSON.parse(readFileSync(HERE + 'prohibited.json', 'utf8'));
const headerVersion = /^\*\*Version:\*\*\s*([\d.]+)/m.exec(onDisk)?.[1];

if (vocabulary.version !== prohibited.version) {
  failures.push(
    `vocabulary.json is version ${vocabulary.version} but prohibited.json is version ${prohibited.version}.\n` +
      '    The two ship together and must always declare the same version.',
  );
}
if (headerVersion !== vocabulary.version) {
  failures.push(
    `guidelines.md declares version ${headerVersion} but the structured data declares ${vocabulary.version}.\n` +
      '    A governing document whose version disagrees with its own rule set is the exact\n' +
      '    failure this package exists to prevent. Reconcile before publishing.',
  );
}

if (failures.length) {
  console.error('check:expression failed:\n');
  for (const f of failures) console.error(`  - ${f}\n`);
  process.exit(1);
}

console.log(
  `check:expression — guidelines.md, registers.md, and the structured data all agree at version ${vocabulary.version}`,
);
