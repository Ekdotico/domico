#!/usr/bin/env node
/**
 * One-shot extraction of the extracted components' styles from the docs site.
 *
 * Like scripts/extract-from-docs.mjs, this runs once. After extraction the
 * package owns src/styles/components.css and this script is provenance only.
 *
 * Ranges are explicit rather than pattern-matched so the split between
 * "generic component chrome" and "documentation site chrome" is a recorded
 * decision, not an inference. The table block, for instance, stops before the
 * sticky-header clone: that clone belongs to StickyTableHead, which Phase 1
 * classified as docs chrome.
 *
 * Usage: node scripts/extract-component-css.mjs <path-to-globals.css>
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const src = readFileSync(process.argv[2], 'utf8').split('\n');

/** [firstLine, lastLine] inclusive, 1-indexed, matching the source file. */
const SECTIONS = [
  ['Section rule', 1073, 1084],
  // Tables split in two. The gap (1162-1267) holds the fixed column widths for
  // RequirementTable / RiskTable / StakeholderTable and the .req-* sub-content
  // rules — all three components are docs-specific, so their chrome stays put.
  ['Tables', 1085, 1161],
  ['Table caption', 1268, 1296],
  ['Badges', 1339, 1383],
  ['Key-value list', 1444, 1547],
  ['Callout', 1630, 1723],
  ['Figure', 2150, 2194],
  ['Tabs', 2195, 2263],
  ['Stat and stat grid', 2264, 2317],
  ['Theme switcher', 2486, 2555],
  ['Mode switcher', 2556, 2600],
  ['Logo lockup', 2601, 2623],
];

const parts = SECTIONS.map(([name, from, to]) => src.slice(from - 1, to).join('\n').trim()).map(
  // The sticky table header parked against the docs site's top bar. The package
  // cannot know a consumer's sticky chrome height, so this becomes a token that
  // defaults to no offset. Docs sets --table-sticky-offset: var(--topbar-h).
  (part) => part.replace('top: var(--topbar-h);', 'top: var(--table-sticky-offset, 0px);'),
);

// Layout variables are documentation-site geometry and stay behind in docs.
// If an extracted rule references one, the package would ship a dangling
// var() that silently resolves to nothing in a consumer. Fail loudly instead.
const DOCS_ONLY = ['--topbar-h', '--sidebar-w', '--content-w', '--page-w', '--measure', '--chat-panel-w'];
const body = parts.join('\n\n');
const leaked = DOCS_ONLY.filter((v) => body.includes(v));
if (leaked.length) {
  console.error(`Extracted CSS references documentation-site layout variables: ${leaked.join(', ')}`);
  console.error('Either the range is wrong, or the rule needs a token that the package owns.');
  process.exit(1);
}

const header = `/* ===========================================================================
   Ekdotico shared components.

   Styles for the components exported from @ekdotico/domico/components.
   Import after the tokens and the base layer:

     import '@ekdotico/domico/tokens.css';
     import '@ekdotico/domico/styles.css';

   Every colour, type, radius, and motion value resolves to a token.

   Known debt: a number of calibrated pixel dimensions survive as literals —
   table cell padding (10px 14px, 9px 14px), the section rule's 52px lead,
   the 480px table min-width, and 1px/2px hairlines. They were carried across
   byte-faithful rather than remapped, because an extraction that quietly
   changes values is how visual regressions get introduced. Several map exactly
   onto the spacing scale and can be migrated in a later release with a visual
   diff to prove no movement; the rest are off-scale and need a design decision
   before they become tokens.
   =========================================================================== */
`;

mkdirSync(new URL('../src/styles/', import.meta.url).pathname, { recursive: true });
writeFileSync(
  new URL('../src/styles/components.css', import.meta.url).pathname,
  header + '\n' + SECTIONS.map(([name], i) => `/* --- ${name} ${'-'.repeat(Math.max(0, 68 - name.length))} */\n\n${parts[i]}`).join('\n\n') + '\n',
);

console.log(`components.css: ${SECTIONS.length} sections, ${body.split('\n').length} lines, no layout-variable leakage`);
