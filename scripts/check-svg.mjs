#!/usr/bin/env node
/**
 * annotateSvg, against a real DOM.
 *
 * A downloaded SVG is the one place a text alternative cannot be delegated to
 * a wrapper, so `annotateSvg` writes <title> and <desc> into the file itself.
 * Every decision in it is about document order or about a conditional
 * attribute, and neither can be asserted without a document — which is why the
 * function shipped in the docs application with its runtime behaviour marked
 * unverified. This is the check that removes that caveat.
 *
 * Development-only. jsdom is a devDependency of this repository and is absent
 * from a consumer's node_modules, so `ekdotico-check` refuses this guard with
 * a reason rather than offering it and failing on a missing import.
 */

import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { annotateSvg } from '../dist/src/svg/annotate.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

/** A fresh <svg> with one drawn child, as Mermaid would hand one over. */
function freshSvg() {
  const dom = new JSDOM('<!doctype html><body></body>');
  const doc = dom.window.document;
  const svg = doc.createElementNS(SVG_NS, 'svg');
  const g = doc.createElementNS(SVG_NS, 'g');
  g.setAttribute('class', 'drawn');
  svg.appendChild(g);
  return { svg, dom };
}

const serialise = (dom, svg) => new dom.window.XMLSerializer().serializeToString(svg);

// --- insertion order ------------------------------------------------------
// The acceptance criterion: <title>, then <desc>, then the drawn content.
// Both must precede the content for a screen reader to treat them as the
// SVG's own. The function inserts in reverse to achieve this, which is the
// part most likely to be "tidied" into the wrong order later.
{
  const { svg, dom } = freshSvg();
  annotateSvg(svg, 'fig', 'Request path', 'The browser calls the API tier.');
  const order = [...svg.children].map((el) => el.tagName);
  assert.deepEqual(order, ['title', 'desc', 'g'], `wrong document order: ${order.join(', ')}`);
  assert.equal(svg.getAttribute('aria-labelledby'), 'fig-title');
  assert.equal(svg.getAttribute('aria-describedby'), 'fig-desc');
  assert.equal(svg.getAttribute('role'), 'img');
  assert.equal(svg.querySelector('title').textContent, 'Request path');
  assert.equal(svg.querySelector('desc').textContent, 'The browser calls the API tier.');
  assert.ok(serialise(dom, svg).includes('<title id="fig-title">'));
}

// --- role="img" only with a name -----------------------------------------
// The conditional is the whole point. role="img" prunes the subtree; with a
// name that is the correct trade, and with nothing to name the image it
// removes the shapes and puts nothing in their place — the exact failure
// Rule 18 exists to undo. Description but no title leaves the subtree
// readable instead.
{
  const { svg } = freshSvg();
  annotateSvg(svg, 'fig', '', 'A description with no title beside it.');
  assert.equal(svg.getAttribute('role'), null, 'role="img" was set with nothing to name it');
  assert.equal(svg.getAttribute('aria-describedby'), 'fig-desc');
  assert.equal(svg.getAttribute('aria-labelledby'), null);
  assert.deepEqual([...svg.children].map((el) => el.tagName), ['desc', 'g']);
}

// A title and no description: named, and no dangling aria-describedby.
{
  const { svg } = freshSvg();
  annotateSvg(svg, 'fig', 'Request path', '');
  assert.equal(svg.getAttribute('role'), 'img');
  assert.equal(svg.getAttribute('aria-describedby'), null, 'aria-describedby pointed at nothing');
  assert.deepEqual([...svg.children].map((el) => el.tagName), ['title', 'g']);
}

// Neither: the SVG is left exactly as it arrived.
{
  const { svg } = freshSvg();
  annotateSvg(svg, 'fig', '', '');
  assert.equal(svg.children.length, 1);
  assert.equal(svg.attributes.length, 0);
}

// --- prose survives serialisation ----------------------------------------
// The reason the nodes are built with createElementNS and textContent rather
// than concatenated markup. A description is author prose and will eventually
// hold an ampersand or an angle bracket; a template string would emit markup
// that no longer parses, and the fault would appear only in the downloaded
// file, which nothing looks at.
{
  const { svg, dom } = freshSvg();
  const prose = 'Reads & writes; a < b, and 5 > 4 — "quoted" too.';
  annotateSvg(svg, 'fig', 'A & B', prose);
  const xml = serialise(dom, svg);
  assert.ok(!xml.includes('a < b'), 'a bare < reached the serialised output');
  assert.ok(xml.includes('&amp;'), 'the ampersand was not escaped');

  // Round-trip: what was written is what parses back out.
  const reparsed = new dom.window.DOMParser().parseFromString(xml, 'image/svg+xml');
  assert.equal(reparsed.querySelector('parsererror'), null, 'the annotated SVG no longer parses');
  assert.equal(reparsed.querySelector('desc').textContent, prose);
  assert.equal(reparsed.querySelector('title').textContent, 'A & B');
}

// --- the caller's obligation ----------------------------------------------
// It mutates the node it is given. That is documented rather than defended
// against, because cloning inside would allocate a second copy of every
// diagram on every export. Pinning it here means the contract is checked
// rather than merely stated.
{
  const { svg } = freshSvg();
  const clone = svg.cloneNode(true);
  annotateSvg(clone, 'fig', 'Named', 'Described at sufficient length to be useful.');
  assert.equal(svg.children.length, 1, 'the source element was mutated through its clone');
  assert.equal(svg.getAttribute('role'), null);
  assert.equal(clone.children.length, 3);
}

console.log('check-svg — annotateSvg: document order, conditional role, prose escaping, mutation contract.');
console.log('\n  PASS\n');
