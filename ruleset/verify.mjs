// Self-compliance check on the built ruleset.
// A document that bans a pattern must not contain it. But a document ABOUT
// prohibitions necessarily quotes them, so each check is scoped to the region
// where a hit would be real:
//   CSS checks    -> the <style> block only
//   markup checks -> the document with <pre> and <code> spans removed
// The first version of this script failed six checks, all of them prose.

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

// Verify whichever exists. The built document inlines typefaces from the docs
// site's next/font output, which CI does not have and should not need — so when
// the build is absent this falls back to the template and skips only the checks
// that are about the inlining itself. Every pattern this ruleset prohibits lives
// in the template's own stylesheet, so the prohibitions are gated either way,
// which is what lets this run inside `pnpm check`.
const HERE = import.meta.dirname;
const BUILT = join(HERE, 'ruleset.html');
const built = existsSync(BUILT);
const html = readFileSync(built ? BUILT : join(HERE, 'ruleset.template.html'), 'utf8');

const styleStart = html.indexOf('<style>') + '<style>'.length;
const css = html.slice(styleStart, html.indexOf('</style>'));
// Strip the base64 payloads: they are megabytes of noise that can contain
// anything as a substring.
// Comments are not declarations. This page's stylesheet explains in a comment
// why it does NOT use a 0.01ms ceiling, and the first version of this check
// counted that explanation as a violation.
const cssNoFonts = css
  .replace(/url\(data:font\/woff2;base64,[^)]*\)/g, 'url(FONT)')
  .replace(/\/\*[\s\S]*?\*\//g, '');
const markup = html
  .slice(html.indexOf('</style>'))
  .replace(/<pre[\s\S]*?<\/pre>/g, '')
  .replace(/<code[\s\S]*?<\/code>/g, '');

let failures = 0;
const rx = (re, hay) => (hay.match(re) || []).length;
const check = (label, actual, expected, note = '') => {
  const ok = actual === expected;
  if (!ok) failures++;
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${label.padEnd(44)} ${String(actual).padStart(5)}  want ${expected} ${note}`);
};

console.log(`\nStructure  —  ${built ? 'built document' : 'template, so font checks do not apply'}`);

if (!built) {
  check('font placeholder intact', rx(/@FONTS@/g, html), 1);
} else {
  check('placeholder consumed', rx(/@FONTS@/g, html), 0);
}

// Not a fixed count, and it used to be. The build derives faces from the docs
// font output, so a new subset there legitimately changes the number — Fira
// Code's Greek face arrived exactly that way and failed this check at 6 want 5.
// A hand-written count is the same defect one layer up. Assert the properties
// that have to hold instead: every rule carries a payload, all three families
// are present, and the two faces the document's own specimens need exist.
if (built) {
  const faceCount = rx(/@font-face/g, cssNoFonts);
  check('every @font-face carries a payload', rx(/url\(data:font\/woff2;base64,/g, css), faceCount);
  check('at least the five required faces', faceCount >= 5 ? 1 : 0, 1, `(${faceCount} inlined)`);
  check(
    'all three families inlined',
    ['Crimson Pro', 'Commissioner', 'Fira Code'].filter((f) =>
      cssNoFonts.includes(`font-family:'${f}'`),
    ).length,
    3,
  );
  check(
    'serif italic inlined',
    /font-family:'Crimson Pro';font-style:italic/.test(cssNoFonts) ? 1 : 0,
    1,
  );
}
check('wrapper tags in markup', rx(/<!doctype|<html[\s>]|<head>|<body[\s>]/gi, markup), 0);
check('<title> present', rx(/<title>[^<]+<\/title>/, html), 1);
check('CSS braces balanced', cssNoFonts.split('{').length - cssNoFonts.split('}').length, 0);

console.log('\nSelf-compliance in the stylesheet — patterns this page prohibits');
check('background-clip:text', rx(/background-clip:\s*text/gi, cssNoFonts), 0);
check('gradients', rx(/(linear|radial|conic)-gradient/gi, cssNoFonts), 0);
check('backdrop-filter', rx(/backdrop-filter/gi, cssNoFonts), 0);
const stripes = cssNoFonts.match(/border-(left|right|inline-start|inline-end):\s*([2-9]|\d\d)px/gi) || [];
check('coloured edge stripes > 1px', stripes.length, 0, stripes.join(' '));
// Bounce/elastic means a control point outside [0,1] on the y axis.
const beziers = cssNoFonts.match(/cubic-bezier\([^)]*\)/g) || [];
const bouncy = beziers.filter((b) => {
  const n = b.match(/-?\d*\.?\d+/g).map(Number);
  return n[1] > 1 || n[1] < 0 || n[3] > 1 || n[3] < 0;
});
check('bounce/elastic easing', bouncy.length, 0, bouncy.join(' '));
check('pure #000 or #fff', rx(/#000\b|#fff\b|#000000|#ffffff/gi, cssNoFonts), 0);
// Rule 17. The page states that case is authored and never applied, and it set
// three of its own labels in uppercase while stating it. Scoped to the <style>
// block, so the rule's own prose quoting `text-transform` is not a hit.
check('applied case transforms', rx(/text-transform:\s*(uppercase|lowercase|capitalize)/gi, cssNoFonts), 0);

console.log('\nRule 04 — Greek must not resolve to the serif');
const greekRule = (cssNoFonts.match(/\.greek\s*\{[^}]*\}/) || [''])[0];
check('.greek sets --font-sans', /--font-sans/.test(greekRule) ? 1 : 0, 1);
check('.greek avoids --font-serif', /--font-serif/.test(greekRule) ? 1 : 0, 0);

console.log('\nRule 11 — reduced motion is the flat prohibition');
check('transition:none !important', rx(/transition:\s*none\s*!important/g, cssNoFonts), 1);
check('0.01ms ceilings in CSS', rx(/0\.01ms/g, cssNoFonts), 0);

console.log('\nAccessibility affordances in the real markup');
check('aria-expanded on trigger', rx(/aria-expanded=/g, markup), 1);
check('aria-controls on trigger', rx(/aria-controls=/g, markup), 1);
check('role=radiogroup', rx(/role="radiogroup"/g, markup), 2);
check('no aria-modal (disclosure, not dialog)', rx(/aria-modal/g, markup), 0);
check(':focus-visible rules in CSS', rx(/:focus-visible/g, cssNoFonts) >= 3 ? 1 : 0, 1);
check('sr-only utility defined', rx(/\.sr-only/g, cssNoFonts), 1);

console.log('\nTheme-awareness');
check('prefers-color-scheme blocks', rx(/prefers-color-scheme:\s*dark/g, cssNoFonts), 2);
check('host data-theme=dark honoured', rx(/:root\[data-theme="dark"\]/g, cssNoFonts) >= 4 ? 1 : 0, 1);
check('wide content scrolls in-container', rx(/overflow-x:\s*auto/g, cssNoFonts) >= 2 ? 1 : 0, 1);

console.log(`\nSize ${Math.round(html.length / 1024)}KB of 16384KB`);
console.log(failures === 0 ? '\nAll checks passed.\n' : `\n${failures} check(s) failed.\n`);
process.exit(failures === 0 ? 0 : 1);
