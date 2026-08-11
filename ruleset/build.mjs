// Assembles the Domico visual ruleset artifact.
//
// Inlines the three canonical typefaces as data URIs, because the Artifact CSP
// blocks font CDNs and a silent fallback in a document *about* typography would
// be self-refuting. Faces are lifted from the docs site's own next/font build
// output, so the specimen renders the exact binaries the reference app ships.
//
// THE FACES ARE DERIVED, NOT LISTED, and that is the whole point of this file.
// The first version carried a hand-written table of five content-hashed
// filenames with a family and a style beside each. Two of them were wrong: the
// Crimson Pro roman and italic were transposed, so every upright serif glyph in
// the published document was drawn from the italic binary. It shipped, and the
// artifact's own twenty-five compliance checks passed, because they check CSS
// patterns rather than which file a face resolves to. A hand-maintained mapping
// between a hash and a meaning is exactly the kind of second source of truth the
// ruleset itself prohibits; next/font already emits the mapping, so read it.
//
// Refreshing after a docs rebuild now needs nothing: the hashes change, this
// script follows them.

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';

const HERE = import.meta.dirname;

// The docs site's build output. Overridable, because the default assumes the
// estate's sibling layout and CI may not have it.
const STATIC = process.env.DOMICO_DOCS_STATIC
  ? resolve(process.env.DOMICO_DOCS_STATIC)
  : resolve(HERE, '..', '..', 'docs', '.next', 'static');

const FAMILIES = ['Crimson Pro', 'Commissioner', 'Fira Code'];

// Basic Latin, and the Greek block. A face is inlined if it covers either; the
// document sets Latin prose and one Greek specimen, and nothing else.
const COVERS_LATIN = /u\+00\?\?|u\+0000-00ff/i;
const COVERS_GREEK = /u\+0370/i;

function readFaces() {
  const cssDir = join(STATIC, 'css');
  let files;
  try {
    files = readdirSync(cssDir).filter((f) => f.endsWith('.css'));
  } catch (err) {
    throw new Error(
      `Cannot read ${cssDir}: ${err.code}.\n` +
        `The ruleset inlines the typefaces from the docs site's next/font output, so that\n` +
        `build has to exist. Run \`pnpm build\` in the docs repository, or point\n` +
        `DOMICO_DOCS_STATIC at an existing .next/static directory.`,
    );
  }

  const css = files.map((f) => readFileSync(join(cssDir, f), 'utf8')).join('\n');
  const blocks = css.match(/@font-face\{[^}]*\}/g) ?? [];

  const field = (block, name) => {
    const m = block.match(new RegExp(`${name}:\\s*([^;}]+)`));
    return m ? m[1].trim().replace(/^['"]|['"]$/g, '') : null;
  };

  // next/font emits the same @font-face set into every route stylesheet that
  // uses it, so the blocks arrive duplicated across files. Key on the face
  // itself: inlining one twice would double a 40KB binary in the output for no
  // reason, and the first run of this rewrite produced 605KB instead of 350KB
  // exactly that way.
  const faces = [];
  const seen = new Set();
  for (const block of blocks) {
    const family = field(block, 'font-family');
    // next/font emits a metrics-matched "<Family> Fallback" alongside each real
    // family. It names a local face and has no src to inline.
    if (!family || !FAMILIES.includes(family)) continue;

    const src = block.match(/url\(([^)]+)\)/);
    if (!src) continue;

    const range = field(block, 'unicode-range') ?? '';
    const coverage = COVERS_GREEK.test(range)
      ? 'greek'
      : COVERS_LATIN.test(range)
        ? 'latin'
        : null;
    if (!coverage) continue;

    const face = {
      family,
      style: field(block, 'font-style') ?? 'normal',
      weight: field(block, 'font-weight') ?? '400',
      range,
      coverage,
      // /_next/static/media/x.woff2 -> <STATIC>/media/x.woff2
      file: join(STATIC, src[1].replace(/^.*\/static\//, '')),
    };

    const key = `${face.family}|${face.style}|${face.weight}|${face.file}`;
    if (seen.has(key)) continue;
    seen.add(key);
    faces.push(face);
  }
  return faces;
}

const faces = readFaces();

// Two assertions about coverage, because the ruleset states both as rules and a
// document that contradicts its own specimen is the defect it warns about.
const crimsonGreek = faces.some((f) => f.family === 'Crimson Pro' && f.coverage === 'greek');
if (crimsonGreek) {
  throw new Error(
    'A Crimson Pro face now covers the Greek block.\n' +
      'Rule 04 exists because it does not. Verify against the face, then rewrite the\n' +
      'rule — do not silently inline a face that refutes the document.',
  );
}
const commissionerGreek = faces.some(
  (f) => f.family === 'Commissioner' && f.coverage === 'greek',
);
if (!commissionerGreek) {
  throw new Error(
    'No Commissioner face covering the Greek block was found.\n' +
      'Rule 04 tells consumers to set Greek in --font-sans, and the specimen that\n' +
      'demonstrates it would fall back to a system face. Check the docs font build.',
  );
}
for (const f of FAMILIES) {
  if (!faces.some((x) => x.family === f)) {
    throw new Error(`No face found for ${f}. The specimen would render in a system fallback.`);
  }
}

const css = faces
  .map(
    ({ family, style, weight, range, file }) =>
      `@font-face{font-family:'${family}';font-style:${style};font-weight:${weight};` +
      `font-display:swap;unicode-range:${range};` +
      `src:url(data:font/woff2;base64,${readFileSync(file).toString('base64')}) format('woff2')}`,
  )
  .join('\n');

const template = readFileSync(join(HERE, 'ruleset.template.html'), 'utf8');
if (!template.includes('/*@FONTS@*/')) {
  throw new Error('template is missing the /*@FONTS@*/ placeholder — fonts would silently not inline');
}
const out = template.replace('/*@FONTS@*/', css);
writeFileSync(join(HERE, 'ruleset.html'), out);

const kb = (n) => `${Math.round(n / 1024)}KB`;
console.log(`${faces.length} faces inlined from ${STATIC}:`);
for (const f of faces) {
  console.log(
    `  ${f.family.padEnd(13)} ${f.style.padEnd(7)} ${f.coverage.padEnd(6)} ${basename(f.file)}`,
  );
}
console.log(`template ${kb(template.length)} -> ruleset.html ${kb(out.length)}`);
