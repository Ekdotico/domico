#!/usr/bin/env node
/**
 * Regression test for the linter.
 *
 * A linter is only worth having if it fails when it should, so this asserts
 * both directions against a fixture whose every violation is deliberate:
 * findings that must be raised, and constructs that must NOT be raised.
 *
 * The negative assertions matter more than the positive ones. False positives
 * are what get a linter switched off, and the structural exemptions — code
 * fences, prohibited-terms tables, quoted counter-examples — are exactly the
 * machinery that would rot silently without a test.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { lintText } from '../dist/src/lint/index.js';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const fixture = join(ROOT, 'src/lint/__fixtures__/violations.md');
const result = lintText(readFileSync(fixture, 'utf8'), 'violations.md', {
  register: 'system-feedback',
});

const active = result.findings.filter((f) => !f.overriddenBy);
const has = (ruleId, line) =>
  active.some((f) => f.ruleId === ruleId && (line === undefined || f.line === line));

const failures = [];
const assert = (condition, message) => {
  if (!condition) failures.push(message);
};

// --- Must be caught ------------------------------------------------------
assert(has('product-name-spelling'), 'missed the superseded product-name spelling');
assert(has('unsubstantiated-superlative'), 'missed an unsubstantiated superlative');
assert(has('unverifiable-ease-claim'), 'missed an unverifiable ease claim');
assert(has('dont-forget'), 'missed controlling "Don\'t forget to"');
assert(has('surveillance-framing'), 'missed surveillance framing');
assert(has('please-wait'), 'missed "Please wait"');
assert(has('vocabulary/task-tracker'), 'missed the non-canonical "tasks tab"');
assert(has('vocabulary/pdf-reader'), 'missed the non-canonical "PDF annotator"');
assert(has('contraction'), 'missed a contraction');
assert(has('hyphen-in-numeric-range'), 'missed a hyphen in a numeric range');

// Register-scoped: only reachable because a register was declared above.
assert(has('something-went-wrong'), 'missed a register-scoped System Feedback rule');

// --- Code-aware scanning: JSX text against arithmetic ---------------------
// Comparison operators bracket a run of code that reads exactly like JSX text.
// This is the deree case: `idx > 0 ? flat[idx - 1] : null,` followed by
// `idx < flat.length` had its subtraction reported as a hyphen where an em
// dash belongs. Both halves are asserted, because a scan that finds nothing
// anywhere would pass the negative test on its own.
{
  const arithmetic = [
    'export function neighbours(flat, idx) {',
    '  return {',
    '    prev: idx > 0 ? flat[idx - 1] : null,',
    '    next: idx < flat.length - 1 ? flat[idx + 1] : null,',
    '  };',
    '}',
  ].join('\n');

  for (const file of ['nav.ts', 'nav.tsx']) {
    const found = lintText(arithmetic, file, { register: 'functional' })
      .findings.filter((f) => !f.overriddenBy);
    assert(
      found.length === 0,
      `scanned arithmetic as copy in ${file}: ${found.map((f) => f.ruleId).join(', ')}`,
    );
  }

  // Real JSX text in a .tsx file must still be scanned, or the fix above would
  // have bought its silence by turning the scan off.
  const jsx = '<p>The export could not be completed - try again.</p>';
  assert(
    lintText(jsx, 'Panel.tsx', { register: 'system-feedback' }).findings.length > 0,
    'stopped scanning genuine JSX text',
  );
  // ...and must not be scanned in a .ts file, which cannot contain JSX at all.
  assert(
    lintText(jsx, 'Panel.ts', { register: 'system-feedback' }).findings.length === 0,
    'scanned JSX text in a .ts file, where TypeScript forbids JSX',
  );
}

// --- Multi-register declaration ------------------------------------------
// §5.6 Step 4: one file routinely carries copy from several registers. A list
// must run every declared register's rules, and must not quietly run none.
// Asserted by difference rather than by count — a rule that never runs at all
// also leaves counts unchanged, which is how a broken register map hides.
{
  const source = readFileSync(fixture, 'utf8');
  const caught = (register) =>
    new Set(
      lintText(source, 'violations.md', { register })
        .findings.filter((f) => !f.overriddenBy)
        .map((f) => f.ruleId),
    );

  const functionalOnly = caught('functional');
  const both = caught(['functional', 'system-feedback']);

  assert(
    !functionalOnly.has('something-went-wrong'),
    'a System Feedback rule ran on a file declared Functional only',
  );
  assert(
    both.has('something-went-wrong'),
    'a list of registers did not run the second register\'s rules',
  );
  assert(
    [...functionalOnly].every((id) => both.has(id)),
    'declaring an extra register lost coverage; a list must only ever widen',
  );
}

// --- Must NOT be caught --------------------------------------------------
const exemptLines = active.filter((f) => f.line >= 30 && f.line <= 50);
assert(
  exemptLines.length === 0,
  `reported ${exemptLines.length} findings inside exempt regions: ` +
    exemptLines.map((f) => `${f.ruleId}@${f.line}`).join(', '),
);

assert(
  !active.some((f) => f.ruleId === 'controlling-obligation'),
  'reported a finding that carries a valid inline override',
);

assert(
  !active.some((f) => f.ruleId === 'spaced-hyphen-interruption'),
  'flagged markdown list bullets as interruption dashes',
);

// --- Overrides -----------------------------------------------------------
assert(
  result.findings.some((f) => f.overriddenBy?.source === 'inline'),
  'the valid inline override was not recorded on its finding',
);

assert(
  result.invalidOverrides.length === 1 &&
    result.invalidOverrides[0].rule === 'unsubstantiated-superlative',
  'an override with no recorded reason was accepted',
);

assert(
  has('unsubstantiated-superlative', 57),
  'an override without a reason suppressed its finding; it must not',
);

// --- Finding shape -------------------------------------------------------
for (const f of active) {
  assert(
    f.reason.length > 0 && f.replacement.length > 0,
    `finding [${f.ruleId}] is incomplete: every finding states why and what to use instead`,
  );
}

if (failures.length > 0) {
  console.error('lint fixture regression failed:\n');
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}

console.log(
  `lint:fixture — ${active.length} findings raised, exemptions and overrides behaved as specified`,
);
