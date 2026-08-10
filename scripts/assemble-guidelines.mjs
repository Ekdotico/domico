#!/usr/bin/env node
/**
 * One-shot assembly of expression/guidelines.md from the docs repository's
 * v0.2 markdown, reconciled against the published MDX and bumped to 0.3.
 *
 * Two copies of the Expression Guidelines existed, both labelled v0.2: the
 * single-file markdown and the nine published MDX pages. They agreed on
 * everything except section 7, where the MDX had introduced a provenance
 * record / provenance report distinction and reassigned a term the markdown
 * had already locked. The specification content uses the newer MDX model, so
 * the MDX is authoritative and the difference is a real version increment.
 *
 * Sections 7 and 8 become generated regions here, filled from vocabulary.json
 * and prohibited.json by scripts/build-expression.mjs. Prose stays hand-written.
 *
 * Usage: node scripts/assemble-guidelines.mjs <path-to-v0.2-markdown>
 */

import { readFileSync, writeFileSync } from 'node:fs';

let doc = readFileSync(process.argv[2], 'utf8');

/** Replace exactly once, and fail loudly if the anchor is not found. */
function replaceOnce(haystack, needle, replacement, label) {
  const index = haystack.indexOf(needle);
  if (index === -1) throw new Error(`assemble-guidelines: anchor not found for ${label}`);
  if (haystack.indexOf(needle, index + 1) !== -1) {
    throw new Error(`assemble-guidelines: anchor is ambiguous for ${label}`);
  }
  return haystack.slice(0, index) + replacement + haystack.slice(index + needle.length);
}

// --- 1. Header ------------------------------------------------------------
doc = replaceOnce(
  doc,
  `**Version:** 0.2 (working draft)
**Status:** Active development
**Last updated:** May 2026
**Audience:** Core team, contractors, open-source contributors, automated failsafe review agent`,
  `**Version:** 0.3
**Status:** Active development
**Last updated:** August 2026
**Audience:** Core team, contractors, open-source contributors, automated failsafe review agent
**Owner:** \`@ekdotico/domico\` — this document is versioned and released with the package. It is the single canonical copy. Any copy held inside a consuming repository is stale by definition.`,
  'header',
);

// --- 2. Changelog ---------------------------------------------------------
doc = replaceOnce(
  doc,
  '**v0.2 (May 2026):**',
  `**v0.3 (August 2026):** Extracted into \`@ekdotico/domico\` as the single canonical copy, replacing the two divergent copies that both carried the version number 0.2. Reconciled §7 on the newer of the two: **provenance record** now names the captured data and **provenance report** names its human-readable rendering, which is what the specification content already used. Section 7 and §8 became generated regions, filled from \`expression/vocabulary.json\` and \`expression/prohibited.json\`; the structured data is now the single source for every mechanical rule and a build-time check fails if the prose and the data disagree. Recorded eight vocabulary gaps surfaced by the extraction audit against the §7.5 additions process.

**v0.2 (May 2026):**`,
  'changelog',
);

// --- 3. Section 7 becomes a generated region ------------------------------
const sevenStart = doc.indexOf('## 7. Controlled vocabulary');
const eightStart = doc.indexOf('## 8. Prohibited terms');
const nineStart = doc.indexOf('## 9. Failsafe process');
if (sevenStart === -1 || eightStart === -1 || nineStart === -1) {
  throw new Error('assemble-guidelines: could not locate sections 7, 8, and 9');
}

const sectionSeven = `## 7. Controlled vocabulary

Every concept in Ekdotico has exactly one canonical term. Once defined in this section, that term is used consistently across all registers, all surfaces, all documentation, and all contributor submissions. Synonyms are not permitted for defined concepts.

<!-- generated:vocabulary start — edit expression/vocabulary.json, then run pnpm build:expression -->
<!-- generated:vocabulary end -->

### 7.5 Process for adding new terms

When a contributor introduces a concept that requires a canonical term, the following process applies:

1. The contributor proposes the term in a pull request comment or issue with a one-sentence rationale.
2. The core team reviews the proposal against four criteria:
   - The term is unambiguous in the Ekdotico product context.
   - The term does not overlap with any existing defined term.
   - The term complies with the applicable register rule (functional terms: maximum three words, two preferred).
   - The term is not a metaphor.
3. If approved, the term is added to \`expression/vocabulary.json\` with its rationale and the version in which it was introduced, and the changeset records the addition.
4. Running \`pnpm build:expression\` regenerates the table above and the linter's rule set together. There is no second place to update, so the agent's list and this document cannot fall out of sync.

### 7.6 Recorded gaps

Some concepts recur in Ekdotico content without a canonical term. They are recorded under \`gaps\` in \`expression/vocabulary.json\` rather than left implicit. A gap is not a violation: the content is not at fault, the guidelines are incomplete. Gaps route to the process in §7.5, and the linter does not flag them.

`;

const sectionEight = `## 8. Prohibited terms

Every prohibition carries the reason it exists and the correct replacement. A rule that says a term is prohibited without saying what to use instead is an incomplete error message, which is itself a System Feedback register violation.

Prohibitions are scoped. A rule that applies only to the provenance/institutional register is never applied to marketing copy.

<!-- generated:prohibited start — edit expression/prohibited.json, then run pnpm build:expression -->
<!-- generated:prohibited end -->

### 8.4 What is not mechanically checked

Several rules in this document require judgement that pattern matching cannot supply. They are recorded under \`notEnforced\` in \`expression/prohibited.json\` and they remain the responsibility of the failsafe agent (§9) and of human review. The list is deliberately explicit: a linter that implies full coverage produces false confidence, which is a worse outcome than no linter.

### 8.5 Quoted examples

This document necessarily contains every term it prohibits, always as a cited counter-example. Those citations are data, not copy, and the linter exempts them structurally — see \`allowlist.contexts\` in \`expression/prohibited.json\`. Any other document quoting a prohibited term for the same reason marks it with \`<!-- eg:cite -->\`.

`;

doc = doc.slice(0, sevenStart) + sectionSeven + '---\n\n' + sectionEight + '---\n\n' + doc.slice(nineStart);

writeFileSync(new URL('../expression/guidelines.md', import.meta.url).pathname, doc);
console.log(`guidelines.md assembled: ${doc.split('\n').length} lines, 2 generated regions`);
