#!/usr/bin/env node
/**
 * Do the shipped stylesheets parse, and do they keep the house rules?
 *
 * The second half was added because `docs/visual-ruleset.md` named this script as
 * the guard for rules 11 and 13 while it checked neither — a rule citing a guard
 * that does not enforce it is exactly the defect rule 15 describes, so the claim
 * was made true instead of softened. It now also rejects a 0.01ms motion ceiling
 * and a coloured edge stripe. Both assertions were mutation-tested.
 *
 * Rule 17 was added here at 0.15.0 for the opposite reason: not a rule whose
 * guard did not enforce it, but a defect no guard could see. `text-transform`
 * rewrites copy from inside the design system, where the copy linter — which
 * reads authored strings and never opens a stylesheet — cannot reach it.
 *
 * The original purpose, unchanged:
 *
 * They did not. `components.css` carried eight comment blocks whose opening
 * delimiter had been stripped by the extraction script, leaving prose in
 * statement position followed by a stray `*␘/`. Every release from 0.1.0
 * shipped it, and nothing noticed, because no consumer had ever imported the
 * file — docs takes only the tokens. The first application to import it
 * refused to build.
 *
 * This is the cheapest possible guard against that class of defect: a
 * stylesheet nobody imports is a stylesheet nobody validates, so the package
 * has to validate its own.
 */

import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));

/**
 * With a directory argument, audit that repository's own stylesheets instead of
 * this package's.
 *
 * Rule 17 was added to this guard at 0.15.0 and the package cleaned itself in
 * the same release — and every consumer went on shipping the declaration,
 * because this script read `dist/styles` and `tokens/generated` whatever
 * directory it was invoked from. A consumer running `ekdotico-check styles`
 * got a pass that said nothing about its own CSS. Thirty-five declarations
 * across two applications survived that way, rendering "PRE-LAUNCH",
 * "ACCESS CODE" and "THE PLATFORM" from correctly authored strings.
 *
 * That is the same gap rule 17 describes one level up: the copy linter reads
 * authored strings and never opens a stylesheet, the style guard read
 * stylesheets and only ever its own. Nothing joined the two across the
 * package boundary either.
 *
 * The parse checks stay package-only. A consumer's stylesheet is compiled by
 * its own bundler, which reports a syntax error far better than this does; what
 * a consumer needs from here are the house rules its bundler has no opinion
 * about.
 */
/**
 * `resolve`, not `join`. The bin hands each consumer-targeting guard an already
 * absolute path, while a developer running the script by hand passes `.` — and
 * joining an absolute path onto the working directory produces the working
 * directory twice.
 */
const TARGET = process.argv.slice(2).find((a) => !a.startsWith('-'));
const CONSUMER = TARGET ? resolve(process.cwd(), TARGET) : null;

/**
 * `worktrees` earns its place beside the build directories: a stale checkout
 * somebody left under `.claude/` carries its own copy of every stylesheet, and
 * findings from it are not facts about this working tree. praktico's
 * `.prettierignore` and eslint config exclude the same path for the same
 * reason.
 */
const SKIP = new Set([
  'node_modules',
  '.next',
  '.open-next',
  '.git',
  'dist',
  '.vercel',
  'coverage',
  'worktrees',
]);

/** Every .css and .module.css under a consuming repository, build output aside. */
function consumerStylesheets(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    if (SKIP.has(entry)) continue;
    const path = join(dir, entry);
    let s;
    try {
      s = statSync(path);
    } catch {
      continue;
    }
    if (s.isDirectory()) consumerStylesheets(path, out);
    else if (entry.endsWith('.css')) out.push(path);
  }
  return out;
}

const failures = [];
let checked = 0;

/** Walk the comment state, reporting any close that occurs outside one. */
function strayClosers(css) {
  const lines = css.split('\n');
  const found = [];
  let inComment = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let idx = 0;
    while (idx < line.length) {
      if (!inComment) {
        const open = line.indexOf('/*', idx);
        const close = line.indexOf('*/', idx);
        if (close !== -1 && (open === -1 || close < open)) {
          found.push(i + 1);
          idx = close + 2;
          continue;
        }
        if (open === -1) break;
        inComment = true;
        idx = open + 2;
      } else {
        const close = line.indexOf('*/', idx);
        if (close === -1) break;
        inComment = false;
        idx = close + 2;
      }
    }
  }
  return { found, unterminated: inComment };
}

/** Braces, ignoring anything inside a comment or a string. */
function braceBalance(css) {
  let depth = 0;
  let min = 0;
  let inComment = false;
  let quote = '';

  for (let i = 0; i < css.length; i++) {
    const c = css[i];
    const next = css[i + 1];

    if (inComment) {
      if (c === '*' && next === '/') {
        inComment = false;
        i++;
      }
      continue;
    }
    if (quote) {
      if (c === '\\') i++;
      else if (c === quote) quote = '';
      continue;
    }
    if (c === '/' && next === '*') {
      inComment = true;
      i++;
      continue;
    }
    if (c === '"' || c === "'") {
      quote = c;
      continue;
    }
    if (c === '{') depth++;
    if (c === '}') {
      depth--;
      min = Math.min(min, depth);
    }
  }
  return { depth, min };
}

const SHEETS = CONSUMER
  ? consumerStylesheets(CONSUMER).map((path) => ({ path, name: relative(CONSUMER, path), parse: false }))
  : [join(ROOT, 'dist', 'styles'), join(ROOT, 'tokens', 'generated')]
      .filter((dir) => existsSync(dir))
      .flatMap((dir) =>
        readdirSync(dir)
          .filter((f) => f.endsWith('.css'))
          .map((name) => ({ path: join(dir, name), name, parse: true })),
      );

{
  for (const { path, name, parse } of SHEETS) {
    const css = readFileSync(path, 'utf8');
    checked++;

    if (parse) {
      const { found, unterminated } = strayClosers(css);
      if (found.length) {
        failures.push(
          `${name}: comment closed while not inside a comment, at line${found.length === 1 ? '' : 's'} ${found.join(', ')}. ` +
            'A banner lost its opening delimiter.',
        );
      }
      if (unterminated) failures.push(`${name}: a comment is never closed.`);

      const { depth, min } = braceBalance(css);
      if (depth !== 0) failures.push(`${name}: ${depth > 0 ? depth + ' unclosed' : -depth + ' extra closing'} brace(s).`);
      if (min < 0) failures.push(`${name}: a closing brace appears before its opener.`);
    }

    // Two house rules, asserted here rather than merely written down. The ruleset
    // named `check:styles` as the guard for both and this script did not check
    // either — it only proved the stylesheets parse. A rule citing a guard that
    // does not enforce it is precisely the defect rule 15 describes, so the claim
    // is made true rather than softened.
    //
    // Comments are stripped first: reset.css carries a long comment EXPLAINING why
    // the 0.01ms ceiling is wrong, and a guard that cannot tell an explanation from
    // a declaration would fail on the very file that gets this right.
    const decl = css.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));

    const ceilings = [...decl.matchAll(/0\.01ms/g)].map(
      (m) => decl.slice(0, m.index).split('\n').length,
    );
    if (ceilings.length) {
      failures.push(
        `${name}: a 0.01ms duration ceiling at line${ceilings.length === 1 ? '' : 's'} ${ceilings.join(', ')}. ` +
          'Reduced motion is a flat `transition: none` prohibition here. A ceiling sets ' +
          'duration but does not stop an animation already running, so a pulsing ' +
          'indicator freezes at whatever opacity the frame caught instead of resting visible.',
      );
    }

    // Rule 17. Case is authored, never applied.
    //
    // `text-transform` is the one design property that overwrites copy. Every
    // other declaration in this file changes how a string looks; this one
    // changes what the string says, and it does it in a layer no copy guard
    // reads. `ekdotico-lint` is handed the authored `Theme` and passes it,
    // correctly; the stylesheet then renders `THEME`, and §4.1 of the
    // Expression Guidelines — universal, no register exempt — gives an
    // all-capitals label as its counter-example.
    //
    // That gap is why this shipped in seven declarations across three
    // stylesheets and survived every guard in the suite, on three surfaces, for
    // fourteen minor versions. No assertion anywhere joined an authored string
    // to the case treatment applied to it. This is that assertion.
    //
    // All three values are refused, not just `uppercase`: `lowercase` erases a
    // proper noun, and `capitalize` forces title case onto a label §4.1 requires
    // in sentence case. The property has no compliant value, so the test is its
    // presence rather than its argument.
    for (const m of decl.matchAll(/text-transform:\s*(uppercase|lowercase|capitalize)/g)) {
      const line = decl.slice(0, m.index).split('\n').length;
      failures.push(
        `${name}: \`text-transform: ${m[1]}\` at line ${line}. Case is authored, never ` +
          'applied: this rewrites the rendered string and leaves the authored one ' +
          'correct in the DOM, so no copy guard can see the result. The Expression ' +
          'Guidelines require sentence case for every label and heading (\u00a74.1, ' +
          'universal). Delete the declaration and let size, weight, tracking, and ' +
          'colour carry the role; if the label needs to read as a label at a glance, ' +
          'that is a job for --fs-3xs and --tr-label, not for case.',
      );
    }

    // No stylesheet the package ships loads an image, a file or a data address.
    //
    // A `url()` in a default stylesheet is a request an application's Content
    // Security Policy gets a say in, and the Ekdotico application's `img-src`
    // allows only itself and its image store, as its specification requires.
    // From 0.35.0 the arrow on a link in running text was a `mask` over an
    // inline `data:` SVG: the policy blocked it, the arrow did not draw, and every
    // page with such a link reported a violation. Nothing here read for it, because
    // the stylesheet is valid and the arrow looks right wherever `data:` is allowed.
    //
    // Package only. An application's own stylesheets are its business, and a
    // consumer's `url()` is no finding. `image-set()` and `@import` are the same
    // request by another name, so they are refused with it. Comments are stripped
    // first so that a comment may say why.
    if (parse) {
      for (const m of decl.matchAll(/\burl\s*\(|\bimage-set\s*\(|@import\b/gi)) {
        const line = decl.slice(0, m.index).split('\n').length;
        failures.push(
          `${name}: \`${m[0].trim()}\` at line ${line}. A shipped stylesheet may not load an ` +
            'image, a file or a `data:` address: an application whose Content Security ' +
            'Policy leaves `data:` out of `img-src` blocks it, and a path would not ' +
            'resolve from a package. Draw it with borders, gradients and `currentColor`; ' +
            'the arrow on a link in running text (reset.css) is the worked example.',
        );
      }
    }

    // The rule is "no COLOURED edge stripe", and the adjective is the test.
    //
    // One-sidedness was the first attempt and it was the wrong shape: the table
    // component draws a four-sided outline cell by cell, because a table cannot
    // take a border with rounded corners cleanly, and the symmetry lives ACROSS
    // sibling selectors — `th:first-child` carries the start edge and
    // `th:last-child` the end edge — so every one of those rules is one-sided when
    // read alone. Six legitimate declarations failed.
    //
    // What separates the banned pattern from that outline is the colour it is drawn
    // in. A stripe signals tone with an accent or a state tint; an outline is a
    // hairline in the neutral rule colour. So a thick inline border is a finding
    // only when it is painted in something other than the rule scale.
    const NEUTRAL = /var\(\s*--rule(?:-strong|-soft)?\s*\)|transparent|currentColor/;

    /**
     * Rule 13's one written exception, with its ceiling named here so it is not
     * an unwritten one: "A bare `blockquote` rule with no card surface is
     * typographic convention rather than decoration and is permitted."
     *
     * The ceiling is *bare*. A blockquote that has grown a background, a
     * radius, or a shadow is a card, and a card signalling tone with a coloured
     * edge is the banned pattern whatever the selector is called. So the
     * exemption is withdrawn the moment any of those three appears in the same
     * rule — which is the line between a quotation mark set in the margin and a
     * tinted callout wearing a blockquote's name.
     */
    const isBareBlockquote = (rule) =>
      /blockquote/i.test(rule) && !/(?:^|[\s;{])(?:background|box-shadow|border-radius)\s*:/.test(rule);

    for (const m of decl.matchAll(/border-(?:inline-start|inline-end|left|right):\s*(?:[2-9]|\d\d)px[^;}]*/g)) {
      if (NEUTRAL.test(m[0])) continue;
      const ruleStart = decl.lastIndexOf('}', m.index) + 1;
      let ruleEnd = decl.indexOf('}', m.index);
      if (ruleEnd === -1) ruleEnd = decl.length;
      if (isBareBlockquote(decl.slice(ruleStart, ruleEnd))) continue;
      const line = decl.slice(0, m.index).split('\n').length;
      failures.push(
        `${name}: a coloured inline border above 1px at line ${line} — "${m[0].trim()}". ` +
          'That is the edge stripe the house style bans, and the ban is on the pattern ' +
          'rather than the property, so a tinted ::before evades the letter and not the ' +
          'rule. Use a full hairline and a background wash: a card that needs to signal ' +
          'tone already carries a title and a role. A thick border in the neutral rule ' +
          'colour is an outline and is permitted.',
      );
    }
  }
}

const WHOSE = CONSUMER ? `${relative(process.cwd(), CONSUMER) || '.'}` : 'the shipped stylesheets';

if (failures.length) {
  console.error(`check:styles — ${WHOSE} carries findings:\n`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}

console.log(
  CONSUMER
    ? `check:styles — ${checked} stylesheets in ${WHOSE} carry no 0.01ms motion ceiling, ` +
        'draw no coloured edge stripe, and apply no case transform'
    : `check:styles — ${checked} shipped stylesheets parse, carry no 0.01ms motion ceiling, ` +
        'draw no coloured edge stripe, apply no case transform, and load no image through `url()`',
);
