#!/usr/bin/env node
/**
 * Fill the generated regions of expression/guidelines.md from the structured
 * expression data.
 *
 * The vocabulary and the prohibited terms are authored once, in JSON, and the
 * prose tables are a projection of that. Two hand-maintained copies of the
 * vocabulary is the same failure mode as two hand-maintained copies of the
 * token list, and this extraction exists because of the second one.
 *
 * `pnpm check:expression` runs this into memory and fails if the file on disk
 * would change, so a hand edit to a generated region is caught in CI.
 */

import { readFileSync, writeFileSync } from 'node:fs';

const HERE = new URL('../expression/', import.meta.url).pathname;

const vocabulary = JSON.parse(readFileSync(HERE + 'vocabulary.json', 'utf8'));
const prohibited = JSON.parse(readFileSync(HERE + 'prohibited.json', 'utf8'));

/** Escape pipes so a value containing one does not break the markdown table. */
const cell = (s) => String(s ?? '').replace(/\|/g, '\\|').replace(/\n+/g, ' ').trim();

const REGISTER_LABELS = {
  functional: 'Functional',
  instructional: 'Instructional',
  'system-feedback': 'System Feedback',
  'provenance-institutional': 'Provenance / Institutional',
  'marketing-awareness': 'Marketing / Awareness',
};

function registerScope(registers) {
  if (registers === 'all') return 'All registers';
  return registers.map((r) => REGISTER_LABELS[r] ?? r).join(', ');
}

// --- Vocabulary table -----------------------------------------------------

function vocabularyTable() {
  const rows = vocabulary.terms.map((t) => {
    const shorthand = t.shorthand ? `\`${t.shorthand}\`` : '—';
    const variants = t.variants.length ? t.variants.map((v) => `"${v}"`).join(', ') : '—';
    return `| ${cell(t.concept)} | **${cell(t.canonical)}** | ${cell(shorthand)} | ${cell(variants)} | ${cell(t.rationale)} |`;
  });

  return [
    `_${vocabulary.terms.length} canonical terms. Generated from \`expression/vocabulary.json\`._`,
    '',
    '| Concept | Canonical term | Shorthand (after first use) | Non-canonical variants | Rationale |',
    '|---|---|---|---|---|',
    ...rows,
  ].join('\n');
}

// --- Prohibited terms tables ---------------------------------------------

function prohibitedTables() {
  const bySeverity = { blocking: [], substantive: [], minor: [] };
  for (const rule of prohibited.rules) bySeverity[rule.severity].push(rule);

  const table = (rules) =>
    [
      '| Term or pattern | Applies in | Reason | Use instead |',
      '|---|---|---|---|',
      ...rules.map((r) => {
        const patterns = r.match.patterns
          .map((p) => (r.match.kind === 'regex' || r.match.kind === 'unicode-range' ? `\`${p}\`` : `"${p}"`))
          .join(' · ');
        const judgement = r.requiresJudgement ? ' _Needs human confirmation._' : '';
        return `| ${cell(patterns)} | ${cell(registerScope(r.registers))} | ${cell(r.reason)}${judgement} | ${cell(r.replacement)} |`;
      }),
    ].join('\n');

  const sections = [
    `_${prohibited.rules.length} rules. Generated from \`expression/prohibited.json\`._`,
    '',
    '### 8.1 Blocking',
    '',
    'A blocking violation contradicts a locked decision. It is never shipped without a recorded override.',
    '',
    table(bySeverity.blocking),
    '',
    '### 8.2 Substantive',
    '',
    'A substantive violation applies the wrong register or breaks a register rule. Several need a human read, because the same word is correct in one sense and prohibited in another.',
    '',
    table(bySeverity.substantive),
    '',
    '### 8.3 Minor',
    '',
    'Typographic. Mechanically detectable, and the highest false-positive rate of the three — review rather than auto-fix.',
    '',
    table(bySeverity.minor),
  ];

  return sections.join('\n');
}

// --- Splice into the document --------------------------------------------

function splice(doc, name, body) {
  const start = new RegExp(`<!-- generated:${name} start[^>]*-->`);
  const end = new RegExp(`<!-- generated:${name} end -->`);
  const startMatch = start.exec(doc);
  const endMatch = end.exec(doc);
  if (!startMatch || !endMatch) {
    throw new Error(`build-expression: markers for "${name}" not found in guidelines.md`);
  }
  const head = doc.slice(0, startMatch.index + startMatch[0].length);
  const tail = doc.slice(endMatch.index);
  return `${head}\n\n${body}\n\n${tail}`;
}

export function render() {
  let doc = readFileSync(HERE + 'guidelines.md', 'utf8');
  doc = splice(doc, 'vocabulary', vocabularyTable());
  doc = splice(doc, 'prohibited', prohibitedTables());
  return doc;
}

/**
 * registers.md — sections 5 and 5.6 on their own.
 *
 * This is the failsafe agent's working reference. It is deliberately prose and
 * deliberately NOT encoded as an automated classifier: register classification
 * needs judgement that pattern matching cannot supply, and a classifier that
 * appears to work while being wrong is worse than no classifier at all.
 */
export function renderRegisters(guidelines) {
  const start = guidelines.indexOf('## 5. The five registers');
  const end = guidelines.indexOf('## 6. Deferred registers and features');
  if (start === -1 || end === -1) {
    throw new Error('build-expression: could not locate section 5 for registers.md');
  }

  return `# Ekdotico registers — reference for the failsafe agent

**Generated from \`expression/guidelines.md\` §5. Do not edit.**
**Version ${vocabulary.version}. Regenerate with \`pnpm build:expression\`.**

This file exists so the failsafe agent and human reviewers work from the same
text as the governing document, without loading the whole of it. It is
reference documentation, not a specification for an automated classifier.

The unit of classification is the copy element, not the page. A single
documentation page routinely carries Marketing/Awareness copy in its
introduction and Instructional copy in the sections beneath it. Classify each
discrete copy unit independently.

---

${guidelines.slice(start, end).trim()}
`;
}

// Running directly writes; importing (the sync check) only renders.
if (import.meta.url === `file://${process.argv[1]}`) {
  const rendered = render();
  writeFileSync(HERE + 'guidelines.md', rendered);
  writeFileSync(HERE + 'registers.md', renderRegisters(rendered));
  console.log(
    `guidelines.md: ${vocabulary.terms.length} vocabulary terms, ${prohibited.rules.length} prohibition rules, ${vocabulary.gaps.concepts.length} recorded gaps`,
  );
  console.log('registers.md: section 5 extracted as failsafe-agent reference');
}
