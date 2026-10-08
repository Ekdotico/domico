#!/usr/bin/env node
/**
 * Assemble the shipped stylesheets.
 *
 * Twenty-six entries, so a consumer can take as much or as little as it needs.
 * Tokens are separate again, so the values can be had without any of the
 * opinions.
 *
 *   styles.css                everything: reset + type + primitives + components
 *   styles/base.css           reset + type utilities
 *   styles/reset.css          reset, document defaults, a11y primitives, scrollbars
 *   styles/type.css           the semantic type utilities alone
 *   styles/components.css     primitives, appearance controls, shared components
 *   styles/appearance.css     the appearance controls alone
 *   styles/primitives.css     Container, Stack, Cluster alone
 *   styles/badge.css          one entry per component, from here down
 *   styles/callout.css
 *   styles/figure.css
 *   styles/keyvalue.css
 *   styles/logo.css
 *   styles/section-rule.css
 *   styles/stat.css
 *   styles/table.css
 *   styles/tabs.css
 *   styles/access-gate.css
 *   styles/nav-drawer.css
 *   styles/on-this-page.css
 *   styles/doc-meta.css
 *   styles/opening-sequence.css
 *   styles/button.css
 *   styles/form.css           the fields, the choices and the form fault together
 *   styles/dialog.css
 *   styles/tooltip.css
 *   styles/page-heading.css
 *
 * The split exists because whole-stylesheet adoption is the wrong granularity
 * for an application that already has a layer of its own. deree wanted the
 * theme switcher and nothing else; importing the combined file would have
 * layered a second reset over its own. praktico wants the reset and not the
 * utilities, because its conventions forbid a global utility layer — and a
 * reset and a set of optional classes are not the same kind of thing, so
 * shipping them welded together made that impossible to express.
 *
 * appearance.css is that argument one level down. praktico renders both
 * switchers and nothing else in the component layer, so its only choices were
 * a dozen classes it never uses or a local restatement of the control. It had
 * silently taken a third: styling class names the package does not emit, which
 * left both switchers bare.
 *
 * The per-component entries are the same argument one level down again, and
 * they are the point at which the package stops asking praktico to choose. A
 * global component layer is exactly what its `conventions/visual` Rule 3
 * forbids, so of roughly ten shared components it could render two — the two
 * whose styles it could import without the other eight. An entry per component
 * means an application imports what it renders and nothing else, and stops
 * having a reason to restate a component locally.
 *
 * The per-component entries are SLICED from src/styles/components.css rather
 * than authored as separate files, and deliberately. A component's styles then
 * still live in exactly one place, the aggregates keep their bytes by
 * construction — they are assembled from the same unsliced text they always
 * were — and the cut lines are the section banners the file already carried.
 * `assertSlicesAreLossless` fails the build if the slices stop accounting for
 * every byte of the source, so a renamed banner cannot silently drop a section
 * out of the entry it belongs to.
 *
 * Every entry that existed before keeps its name and its contents, so nothing
 * that imports one today has to change.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const OUT = join(ROOT, 'dist', 'styles');
mkdirSync(OUT, { recursive: true });

const source = (f) => readFileSync(join(ROOT, 'src', 'styles', f), 'utf8').trim();

// --- Slicing components.css ------------------------------------------------

/** `/* --- Tables ------ *␘/`, with or without its closing delimiter. */
const MARKER = /^\/\* --- (.+?) -{3,}(?: \*\/)?$/;
/** A banner's opening rule: `/* ==============` on a line of its own. */
const BANNER_OPEN = /^\/\* ={10,}$/;
/** The name inside a three-line banner: `   LOGO LOCKUP`. */
const BANNER_NAME = /^ {3}(\S.*?)\s*$/;
/** A banner's closing rule: `   ============== *␘/`. */
const BANNER_CLOSE = /^ {3}={10,} \*\/$/;

/**
 * Cut a stylesheet at the section banners it already declares.
 *
 * Two banner spellings are in the file and both are load-bearing. Most
 * sections open with `/* ===` on one line, a blank line, and then the
 * `/* --- Name --- *␘/` marker whose `*␘/` closes the comment the `/* ===`
 * opened — so that opener has to travel with the section below it or the
 * slice is left holding a comment nobody closes. The remaining sections use a
 * self-contained three-line banner. Recognising both is what lets every slice
 * parse on its own, which `check:styles` then verifies.
 *
 * Returns the sections in source order, plus the leading file header. Each
 * carries both its exact `raw` text — so the slices can be proved to account
 * for every byte of the input — and a `text` trimmed for use as an entry.
 */
function sliceSections(css) {
  const lines = css.split('\n');
  const cuts = [];

  for (let i = 0; i < lines.length; i++) {
    const marker = MARKER.exec(lines[i]);
    if (marker) {
      const banner = i >= 2 && BANNER_OPEN.test(lines[i - 2]) && lines[i - 1].trim() === '';
      cuts.push({ name: marker[1].trim(), start: banner ? i - 2 : i });
      continue;
    }
    if (BANNER_OPEN.test(lines[i]) && BANNER_CLOSE.test(lines[i + 2] ?? '')) {
      const named = BANNER_NAME.exec(lines[i + 1] ?? '');
      if (named) cuts.push({ name: named[1], start: i });
    }
  }

  if (cuts.length === 0) throw new Error('components.css declares no section banners');

  const region = (name, from, to) => {
    const raw = lines.slice(from, to).join('\n');
    return { name, raw, text: raw.trim() };
  };

  const regions = [region('<header>', 0, cuts[0].start)];
  for (let i = 0; i < cuts.length; i++) {
    regions.push(
      region(cuts[i].name, cuts[i].start, i + 1 < cuts.length ? cuts[i + 1].start : lines.length),
    );
  }
  return regions;
}

/**
 * The slices have to add up to the file.
 *
 * Byte equality rather than a rule count, because the whole reason the
 * aggregates can keep shipping unchanged is that they are assembled from the
 * unsliced text. If a banner is renamed into a form the cutter does not
 * recognise, its section silently joins the one above it and lands in the
 * wrong entry — a failure with no symptom until a consumer imports the entry
 * and finds a component unstyled.
 */
function assertSlicesAreLossless(regions, css) {
  const rejoined = regions.map((r) => r.raw).join('\n');
  if (rejoined === css) return;
  throw new Error(
    'build:styles — the section slices do not add up to src/styles/components.css.\n' +
      `  sliced ${rejoined.length} characters from ${css.length}. A section banner was probably\n` +
      '  reformatted: the cutter expects `/* --- Name --- */` or a three-line `/* === */` banner.',
  );
}

const reset = source('reset.css');
const type = source('type.css');
const base = [reset, type].join('\n\n');
const appearance = source('appearance.css');
const primitives = source('primitives.css');

const componentsSource = source('components.css');
const regions = sliceSections(componentsSource);
assertSlicesAreLossless(regions, componentsSource);

const section = (name) => {
  const found = regions.find((r) => r.name === name);
  if (!found) {
    throw new Error(
      `build:styles — components.css has no section named "${name}". ` +
        `Sections found: ${regions.map((r) => r.name).join(', ')}`,
    );
  }
  return found.text;
};

/** The aggregate is still the unsliced file, so its bytes cannot drift. */
const components = [primitives, appearance, componentsSource].join('\n\n');

/**
 * One entry per component: the export name, the sections it is made of, and
 * what to call it in the console line and the file header.
 */
const COMPONENTS = [
  ['badge', ['Badges'], 'the badge'],
  ['callout', ['Callout'], 'the callout'],
  ['figure', ['Figure'], 'the figure and its caption'],
  ['keyvalue', ['Key-value list'], 'the key-value list'],
  ['logo', ['LOGO LOCKUP'], 'the logo lockup'],
  ['section-rule', ['Section rule'], 'the section rule'],
  ['stat', ['Stat and stat grid'], 'the stat and the stat grid'],
  ['table', ['Tables', 'Table caption'], 'the table and its caption'],
  ['tabs', ['Tabs'], 'the tab panel'],
  ['access-gate', ['Access gate'], 'the access gate'],
  ['nav-drawer', ['Navigation drawer'], 'the navigation drawer'],
  ['on-this-page', ['On this page'], 'the on-this-page rail'],
  ['doc-meta', ['Document meta'], 'the document version strip'],
  ['opening-sequence', ['Opening sequence'], 'the opening sequence'],
  ['button', ['Button'], 'the button'],
  // One entry for three sections. The fields, the choices and the fault share
  // the label, the hint and the message, and a form that renders one of them
  // renders the others.
  ['form', ['Form fields', 'Choices', 'Form fault'], 'the form controls and the form fault'],
  ['dialog', ['Dialog'], 'the dialog'],
  ['tooltip', ['Tooltip'], 'the tooltip'],
  ['page-heading', ['Page heading'], 'the page heading'],
];

const header = (what, note) => `/**
 * @ekdotico/domico — ${what}.
 *
 * Import AFTER the tokens, which define every custom property used here:
 *
 *   import '@ekdotico/domico/tokens.css';
 *${note}
 *
 * Assembled from src/styles/. Do not edit this file.
 */
`;

const files = [
  [
    'base.css',
    `${header('base layer and shared components', "   import '@ekdotico/domico/styles.css';")}\n${base}\n\n${components}\n`,
    'base layer + primitives + components',
  ],
  [
    'base-only.css',
    `${header('base layer only', "   import '@ekdotico/domico/styles/base.css';")}\n${base}\n`,
    'base layer only',
  ],
  [
    'reset-only.css',
    `${header('reset layer only', "   import '@ekdotico/domico/styles/reset.css';")}\n${reset}\n`,
    'reset layer only',
  ],
  [
    'type-only.css',
    `${header('semantic type utilities only', "   import '@ekdotico/domico/styles/type.css';")}\n${type}\n`,
    'type utilities only',
  ],
  [
    'components.css',
    `${header('primitives and shared components', "   import '@ekdotico/domico/styles/components.css';")}\n${components}\n`,
    'primitives + appearance + components',
  ],
  [
    'appearance-only.css',
    `${header('appearance controls only', "   import '@ekdotico/domico/styles/appearance.css';")}\n${appearance}\n`,
    'theme switcher + mode switcher + header row + menu',
  ],
  [
    'primitives.css',
    `${header('layout primitives only', "   import '@ekdotico/domico/styles/primitives.css';")}\n${primitives}\n`,
    'Container + Stack + Cluster',
  ],
  ...COMPONENTS.map(([name, sections, what]) => [
    `${name}.css`,
    `${header(`${what} alone`, `   import '@ekdotico/domico/styles/${name}.css';`)}\n${sections.map(section).join('\n\n')}\n`,
    what,
  ]),
];

for (const [name, contents, what] of files) {
  writeFileSync(join(OUT, name), contents);
  console.log(`dist/styles/${name} — ${contents.split('\n').length} lines (${what})`);
}
