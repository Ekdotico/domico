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
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveRenderedMode, isTheme, isMode, MODES } from '../dist/src/theme/appearance.js';
import { themeInitScript } from '../dist/src/theme/init.js';
import { themeNames } from '../dist/tokens/generated/tokens.js';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const CONTROLS = ['ThemeSwitcher', 'ModeSwitcher', 'AppearanceMenu'];

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

// --- server-rendered state ------------------------------------------------
// What appearance-aware components are told during the render that produces
// the markup. A mistake here is a control that contradicts the page it sits
// on, and a roving tab stop parked on an option the reader did not choose.
{
  const { appearanceAttributes, appearanceState } = await import('../dist/src/theme/server.js');
  const store = (values) => ({ get: (name) => (name in values ? { value: values[name] } : undefined) });

  assert.deepEqual(
    appearanceState(store({})),
    { theme: 'parchment', mode: 'auto' },
    'a reader with no cookie did not get the defaults',
  );

  for (const theme of themeNames) {
    assert.equal(
      appearanceState(store({ 'ekd-theme': theme })).theme,
      theme,
      `the server did not report "${theme}" to its components`,
    );
  }

  for (const mode of MODES) {
    assert.equal(
      appearanceState(store({ 'ekd-mode': mode })).mode,
      mode,
      `the server did not report mode "${mode}" to its components`,
    );
  }

  // Auto survives as a value here, unlike in the attributes, where its whole
  // mechanism is being absent. A component has to be able to render Auto as
  // the selected option; the document has to omit it.
  assert.equal(appearanceState(store({ 'ekd-mode': 'auto' })).mode, 'auto');
  assert.deepEqual(appearanceAttributes(store({ 'ekd-mode': 'auto' })), {});

  // The two must agree on every valid cookie, or the page and the control that
  // reports it disagree — which is the defect this pair exists to close.
  for (const theme of themeNames) {
    for (const mode of MODES) {
      const cookies = store({ 'ekd-theme': theme, 'ekd-mode': mode });
      const attributes = appearanceAttributes(cookies);
      const state = appearanceState(cookies);

      assert.equal(attributes['data-theme'], state.theme, `theme disagreed for ${theme}/${mode}`);
      assert.equal(
        attributes['data-mode'] ?? 'auto',
        state.mode,
        `mode disagreed for ${theme}/${mode}`,
      );
    }
  }

  // A corrupted cookie degrades to the default in both directions at once. If
  // only one of the pair fell back, the page and the control would disagree
  // precisely when the stored value was junk.
  for (const junk of ['', 'PARCHMENT', 'sepia; DROP', 'nonsense']) {
    const state = appearanceState(store({ 'ekd-theme': junk, 'ekd-mode': junk }));
    assert.deepEqual(state, { theme: 'parchment', mode: 'auto' }, `junk cookie leaked: ${junk}`);
  }
}

// --- the controls and their stylesheet ------------------------------------
// styles/appearance.css exists so an application can style exactly the markup
// these components emit. That promise is only kept if the two lists agree, and
// they have not before: praktico styled class names the package does not emit
// and both switchers rendered bare. A class in the markup with no rule in the
// entry is the same defect from the other side.
{
  const css = readFileSync(join(ROOT, 'src/styles/appearance.css'), 'utf8');
  const emitted = new Map();

  for (const name of CONTROLS) {
    const source = readFileSync(join(ROOT, `src/theme/${name}.tsx`), 'utf8');
    for (const match of source.matchAll(/className=(?:"([^"]*)"|\{`([^`]*)`\})/g)) {
      // Interpolations are either a conditional modifier or the caller's own
      // placement class; neither is the package's to style.
      const literal = (match[1] ?? match[2]).replace(/\$\{[^}]*\}/g, ' ');
      for (const cls of literal.split(/\s+/).filter(Boolean)) {
        if (!emitted.has(cls)) emitted.set(cls, name);
      }
    }
  }

  assert.ok(emitted.size > 0, 'no class names were found in the appearance controls');
  for (const [cls, from] of emitted) {
    assert.ok(
      css.includes(`.${cls}`),
      `${from} renders .${cls}, which src/styles/appearance.css does not style. ` +
        'An application taking only that entry would render the control bare.',
    );
  }

  // Nothing in the appearance layer may wait on a transition or animation
  // event. reset.css sets `transition: none !important` under
  // prefers-reduced-motion, so neither event fires for those readers and a
  // component gating unmount on one never unmounts.
  // Comments are stripped throughout: every rule below is about what the
  // component does, and the files explain themselves in prose that necessarily
  // names the things they avoid.
  const code = (rel) =>
    readFileSync(join(ROOT, 'src/theme', rel), 'utf8').replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, '');

  for (const rel of [
    'ThemeSwitcher.tsx',
    'ModeSwitcher.tsx',
    'AppearanceMenu.tsx',
    'AppearanceProvider.tsx',
    'useAppearance.ts',
    'useRadioGroup.ts',
  ]) {
    assert.ok(
      !/\b(transitionend|animationend)\b/.test(code(rel)),
      `src/theme/${rel} waits on a transition or animation event, which never fires under prefers-reduced-motion`,
    );
  }

  // The appearance menu is a disclosure. A reader picks a theme by comparing it
  // against the page, so the surface may not be modal and may not close on
  // activation the way a menu role requires.
  const menu = code('AppearanceMenu.tsx');
  for (const promise of ['aria-expanded', 'aria-controls']) {
    assert.ok(menu.includes(promise), `AppearanceMenu's trigger is missing ${promise}`);
  }
  for (const forbidden of ['aria-modal', 'role="menu"', 'role="dialog"']) {
    assert.ok(!menu.includes(forbidden), `AppearanceMenu declares ${forbidden}; it is a non-modal disclosure`);
  }
}

console.log(
  `check:appearance — resolution, guards, server attributes and state, a bootstrap covering ${themeNames.length} generated themes, ` +
    `and ${CONTROLS.length} controls whose classes all resolve in styles/appearance.css`,
);
