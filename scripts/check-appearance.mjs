#!/usr/bin/env node
/**
 * Appearance resolution and bootstrap.
 *
 * `resolveRenderedMode` decides what the reader is actually looking at, and it
 * is the one piece of appearance logic with branches. It is deliberately free
 * of browser globals so it can be asserted here without a DOM.
 *
 * The bootstrap assertions matter more. That script runs before React and
 * before any stylesheet, so a defect in it shows up as a full-page colour
 * flash or an unstyled document — and it is a string, so nothing else would
 * catch a mistake in it. The vocabulary check exists because the previous
 * version hardcoded the four theme names: adding a fifth theme to the token
 * source would have left the bootstrap silently unable to restore it.
 */

import assert from 'node:assert/strict';
import { resolveRenderedMode, isTheme, isMode, MODES } from '../dist/src/theme/appearance.js';
import { themeInitScript } from '../dist/src/theme/init.js';
import { themeNames } from '../dist/tokens/generated/tokens.js';

// --- resolveRenderedMode --------------------------------------------------
// An explicit choice wins over the operating system in BOTH directions. The
// asymmetric case is the one worth pinning: a reader who chose Light on a
// machine set to dark must get light.
assert.equal(resolveRenderedMode('light', true), 'light', 'explicit light lost to a dark OS');
assert.equal(resolveRenderedMode('dark', false), 'dark', 'explicit dark lost to a light OS');
assert.equal(resolveRenderedMode('light', false), 'light');
assert.equal(resolveRenderedMode('dark', true), 'dark');

// Auto is the absence of the attribute, so the OS decides.
assert.equal(resolveRenderedMode(null, true), 'dark', 'Auto ignored a dark OS');
assert.equal(resolveRenderedMode(null, false), 'light', 'Auto ignored a light OS');

// Anything outside the vocabulary reads as Auto rather than throwing or
// applying a broken value. A stale or corrupted attribute must degrade to the
// system preference, not to an unstyled page.
assert.equal(resolveRenderedMode('sepia', true), 'dark', 'a junk data-mode did not fall through');
assert.equal(resolveRenderedMode('', false), 'light');

// --- guards ---------------------------------------------------------------
for (const t of themeNames) assert.ok(isTheme(t), `isTheme rejected the generated theme ${t}`);
for (const m of MODES) assert.ok(isMode(m), `isMode rejected ${m}`);
for (const junk of ['', 'PARCHMENT', 'parchment ', null, undefined, 0, {}]) {
  assert.ok(!isTheme(junk), `isTheme accepted ${JSON.stringify(junk)}`);
  assert.ok(!isMode(junk), `isMode accepted ${JSON.stringify(junk)}`);
}

// --- bootstrap ------------------------------------------------------------
const script = themeInitScript();

// Every generated theme must be restorable. This is the drift the hardcoded
// list allowed: a theme could exist in the stylesheet and not in the bootstrap.
for (const theme of themeNames) {
  assert.ok(
    script.includes(`"${theme}"`),
    `themeInitScript cannot restore "${theme}", which the token source defines`,
  );
}

assert.ok(script.includes('ekd-theme') && script.includes('ekd-mode'), 'bootstrap lost a storage key');
assert.ok(/try\{/.test(script) && /catch\(e\)\{\}/.test(script), 'bootstrap is not guarded');
assert.ok(script.includes('data-theme') && script.includes('data-mode'), 'bootstrap writes the wrong attributes');

// Auto must not be written as an attribute value: its absence is the mechanism
// that lets the prefers-color-scheme block apply.
assert.ok(!script.includes('"auto"'), 'bootstrap writes data-mode="auto", which disables Auto');

// It is injected inline in <head>, so it must be one self-contained statement
// with no imports, no template holes, and nothing that needs a bundler.
assert.ok(!/import|require\(|\$\{/.test(script), 'bootstrap is not self-contained');

// --- server-rendered attributes -------------------------------------------
// These decide what <html> carries before any JavaScript runs, so a mistake
// here is a wrong theme on first paint for every reader with a cookie.
{
  const { appearanceAttributes } = await import('../dist/src/theme/server.js');
  const store = (values) => ({ get: (name) => (name in values ? { value: values[name] } : undefined) });

  assert.deepEqual(appearanceAttributes(store({})), {}, 'a reader with no cookie got attributes');

  for (const theme of themeNames) {
    assert.deepEqual(
      appearanceAttributes(store({ 'ekd-theme': theme })),
      { 'data-theme': theme },
      `the server did not restore "${theme}"`,
    );
  }

  assert.deepEqual(
    appearanceAttributes(store({ 'ekd-theme': 'parchment', 'ekd-mode': 'dark' })),
    { 'data-theme': 'parchment', 'data-mode': 'dark' },
    'an explicit mode was not restored',
  );

  // Auto must emit no data-mode at all: its absence is what re-arms the
  // prefers-color-scheme block, so writing it would disable Auto entirely.
  assert.deepEqual(
    appearanceAttributes(store({ 'ekd-mode': 'auto' })),
    {},
    'the server wrote data-mode="auto", which disables Auto',
  );

  // A corrupted or stale cookie degrades to the default, never to an applied
  // junk value that no stylesheet matches.
  for (const junk of ['', 'PARCHMENT', 'sepia; DROP', 'auto', 'nonsense']) {
    assert.ok(
      !('data-theme' in appearanceAttributes(store({ 'ekd-theme': junk }))),
      `the server applied an out-of-vocabulary theme cookie: ${JSON.stringify(junk)}`,
    );
  }
  for (const junk of ['', 'DARK', 'light-ish']) {
    assert.ok(
      !('data-mode' in appearanceAttributes(store({ 'ekd-mode': junk }))),
      `the server applied an out-of-vocabulary mode cookie: ${JSON.stringify(junk)}`,
    );
  }
}

console.log(
  `check:appearance — resolution, guards, server attributes, and a bootstrap covering ${themeNames.length} generated themes`,
);
