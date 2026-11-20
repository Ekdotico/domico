#!/usr/bin/env node
/**
 * check:scale — the interface scale holds, and at 1 it changes nothing.
 *
 *   1. Every stylesheet source is in the form `scaleCss` writes: a length that
 *      should grow carries the factor, and nothing else does. `--write`
 *      rewrites the sources into that form.
 *   2. Removing the factor leaves exactly the text the factor was added to:
 *      the only difference the scale makes to a stylesheet is
 *      `calc(<length> * var(--scale))` around a length, which at
 *      `--scale: 1` computes to that length.
 *   3. tokens.css declares `--scale: 1`, and each scaled token, unwrapped, is
 *      the value in its source file.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { scaleCss, unscaleCss } from './lib/scale.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCES = ['src/styles/reset.css', 'src/styles/appearance.css', 'src/styles/components.css', 'src/styles/frame.css'];
const write = process.argv.includes('--write');
const failures = [];

for (const rel of SOURCES) {
  const path = join(ROOT, rel);
  const text = readFileSync(path, 'utf8');
  const scaled = scaleCss(text);
  if (write) {
    writeFileSync(path, scaled);
    continue;
  }
  if (scaled !== text) {
    const a = text.split('\n');
    const b = scaled.split('\n');
    const n = a.findIndex((line, k) => line !== b[k]);
    failures.push(`${rel}:${n + 1}: not in scaled form\n    is:     ${a[n]?.trim()}\n    wants:  ${b[n]?.trim()}`);
  }
  if (scaleCss(unscaleCss(scaled)) !== scaled) failures.push(`${rel}: scaling is not idempotent`);
}

// 3. Tokens.
const css = readFileSync(join(ROOT, 'tokens/generated/tokens.css'), 'utf8');
if (!/--scale: 1;/.test(css)) failures.push('tokens.css: --scale: 1 is not declared');
for (const file of ['space.json', 'type.json', 'radius.json', 'layout.json']) {
  const source = JSON.parse(readFileSync(join(ROOT, 'tokens/source', file), 'utf8'));
  for (const [name, token] of Object.entries(source)) {
    if (name.startsWith('$') || typeof token?.$value !== 'string') continue;
    const m = css.match(new RegExp(`--${name}: ([^;]+);`));
    if (!m) continue;
    if (unscaleCss(m[1]) !== token.$value) failures.push(`tokens.css --${name}: ${m[1]} is not ${token.$value} at --scale: 1`);
  }
}

// 4. Icons: at --scale: 1 the reset's size equals the attributes' size, and a
// caller that sizes the icon itself is left alone.
const reset = readFileSync(join(ROOT, 'src/styles/reset.css'), 'utf8');
if (!/:where\(svg\[data-ekd-icon\]\) \{\s*inline-size: calc\(var\(--ekd-icon-size\) \* var\(--scale\)\);\s*block-size: calc\(var\(--ekd-icon-size\) \* var\(--scale\)\);/.test(reset)) {
  failures.push('reset.css: the icon rule is missing or changed');
}
const { renderToStaticMarkup } = await import('react-dom/server');
const { createElement: h } = await import('react');
const { XIcon } = await import(join(ROOT, 'dist/src/components/icons.js'));
const icon = (props) => renderToStaticMarkup(h(XIcon, props));
for (const [props, size] of [[{}, 16], [{ size: 18 }, 18], [{ size: 20, style: { color: 'red' } }, 20]]) {
  const html = icon(props);
  const attrs = html.includes(`width="${size}"`) && html.includes(`height="${size}"`);
  const variable = html.includes(`--ekd-icon-size:${size}px`) && html.includes('data-ekd-icon=""');
  if (!attrs || !variable) failures.push(`icons: ${JSON.stringify(props)} does not draw ${size}px by both the attributes and --ekd-icon-size: ${html.slice(0, 200)}`);
  if (props.style && !html.includes('color:red')) failures.push('icons: a caller\'s style was dropped');
}
if (icon({ width: 24 }).includes('data-ekd-icon')) failures.push('icons: an icon given its own width still takes the scale');

if (write) {
  console.log('check:scale --write: sources rewritten.');
} else if (failures.length) {
  console.error(`check:scale: ${failures.length} failure(s)\n${failures.join('\n')}`);
  process.exit(1);
} else {
  console.log('check:scale: sources in scaled form; every scaled value equals its unscaled source at --scale: 1.');
}
