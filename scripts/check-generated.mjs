#!/usr/bin/env node
/**
 * Fail the build if any generated file has been edited by hand.
 *
 * Regenerates the token artefacts into a scratch directory and compares them
 * byte for byte with what is committed. A hand edit to tokens.css survives
 * silently until someone next runs the build and wonders why their change
 * vanished; this turns that into a CI failure with the offending file named.
 */

import { execFileSync } from 'node:child_process';
import { readFileSync, cpSync, rmSync, mkdtempSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const GENERATED = ['tokens/generated/tokens.css', 'tokens/generated/tokens.ts', 'tokens/generated/mermaid.ts'];

const missing = GENERATED.filter((f) => !existsSync(join(ROOT, f)));
if (missing.length) {
  console.error(`Generated files are missing: ${missing.join(', ')}`);
  console.error('Run: pnpm build:tokens');
  process.exit(1);
}

const before = Object.fromEntries(GENERATED.map((f) => [f, readFileSync(join(ROOT, f), 'utf8')]));
const backup = mkdtempSync(join(tmpdir(), 'ekd-generated-'));
for (const f of GENERATED) cpSync(join(ROOT, f), join(backup, f.replace(/\//g, '_')));

let failures = [];
try {
  execFileSync('node', [join(ROOT, 'tokens', 'build.mjs')], { stdio: 'pipe' });
  for (const f of GENERATED) {
    if (readFileSync(join(ROOT, f), 'utf8') !== before[f]) failures.push(f);
  }
} finally {
  // Restore whatever was committed, so a failing check never leaves the tree
  // in a different state than it found it.
  for (const f of GENERATED) cpSync(join(backup, f.replace(/\//g, '_')), join(ROOT, f));
  rmSync(backup, { recursive: true, force: true });
}

if (failures.length) {
  console.error('Generated files are out of sync with tokens/source/:');
  for (const f of failures) console.error(`  ${f}`);
  console.error('\nEither a generated file was edited by hand, or the token source changed');
  console.error('without a rebuild. Fix with: pnpm build:tokens');
  process.exit(1);
}

console.log(`check:generated — ${GENERATED.length} artefacts match tokens/source/`);
