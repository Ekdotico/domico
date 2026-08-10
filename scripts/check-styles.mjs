#!/usr/bin/env node
/**
 * Do the shipped stylesheets parse?
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

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const DIRS = [join(ROOT, 'dist', 'styles'), join(ROOT, 'tokens', 'generated')];

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

for (const dir of DIRS) {
  if (!existsSync(dir)) continue;
  for (const name of readdirSync(dir).filter((f) => f.endsWith('.css'))) {
    const path = join(dir, name);
    const css = readFileSync(path, 'utf8');
    checked++;

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
}

if (failures.length) {
  console.error('check:styles — the shipped stylesheets do not parse:\n');
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}

console.log(`check:styles — ${checked} shipped stylesheets have balanced comments and braces`);
