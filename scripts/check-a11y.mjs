#!/usr/bin/env node
// Accessibility guard for @ekdotico/domico consumers.
//
// Twelve checks, over the failure classes this estate has actually shipped. They
// walk the same files, so they are one script rather than twelve:
//
//   diagramalt      a Mermaid fence with no text alternative, or a placeholder one
//   focusrole       one element carrying both a non-operable role and tabIndex
//   modaltrap       aria-modal claimed without a focus trap or an inert background
//   danglingid      aria-labelledby / aria-describedby naming an id that is not there
//   focusring       outline removed with no outline restoring a focus indicator
//   inputring       the same, on a form control, where :focus-within cannot stand in
//   unnamedcontrol  a button whose only content is an icon, with no accessible name
//   unnamedfocus    a generic element put in the Tab order with no role or no name
//   placeholder     placeholder text in --fg-4 or --fg-5, neither of them text-safe
//   controlborder   a form control bordered with a hairline rather than --rule-control
//   tooltipcontent  a role="tooltip" holding a link or a button nobody can reach
//   menukeys        role="menu" in a file with no arrow-key handling
//
// Exit 1 on any violation. Rule 18 of the visual ruleset is the rule this
// enforces; `ekdotico-check a11y` is how a consumer runs it.
//
// A note on false positives, learned by the discipline guard before this one: a
// guard that cries wolf gets switched off. Every check below states its own
// coverage boundary, and each one is written to under-report rather than to
// guess. Where a static read genuinely cannot decide, the check says nothing.
//
// Usage: node check-a11y.mjs [appDir] [--quiet] [--by-file]

import assert from 'node:assert/strict';
import { readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, extname } from 'node:path';
import { extractAccessibility } from '../dist/src/mermaid/accessibility.js';

const APP = process.argv[2] ?? process.cwd();
const QUIET = process.argv.includes('--quiet');

const SKIP_DIRS = new Set([
  'node_modules', '.next', '.git', 'dist', 'build', '.vercel',
  '.turbo', 'coverage', '.wrangler', 'worktrees', '.open-next',
  // A guard that searches for a pattern necessarily contains that pattern.
  // Same exclusion, and the same reason, as the discipline guard's.
  'scripts',
  'ruleset',
  'claude-design',
]);

const JSX_EXT = new Set(['.tsx', '.jsx']);
const DOC_EXT = new Set(['.md', '.mdx']);
const CSS_EXT = new Set(['.css']);
const WALK_EXT = new Set([...JSX_EXT, ...DOC_EXT, ...CSS_EXT]);

function walk(dir, out = []) {
  let entries;
  try { entries = readdirSync(dir); } catch { return out; }
  for (const e of entries) {
    if (SKIP_DIRS.has(e)) continue;
    const p = join(dir, e);
    let st;
    try { st = statSync(p); } catch { continue; }
    if (st.isDirectory()) walk(p, out);
    else if (WALK_EXT.has(extname(p))) out.push(p);
  }
  return out;
}

const lineOf = (src, index) => src.slice(0, index).split('\n').length;

// ------------------------------------------------------------ routed content
// Rule 18 is about a diagram that gets rendered. A fence inside an archived
// plan or a repository README is never wrapped in role="img" by this estate,
// and failing a pipeline over one is how a guard earns its way into somebody's
// skip list — the first run of this check reported twelve of them, all in
// planning documents nobody serves.
//
// So the diagram check is scoped to the routed tree, which is the same scope
// the docs application's own validator settled on. When a repository has no
// recognisable routed root, nothing is assumed and every document is read.
//
// COVERAGE BOUNDARY: a diagram in an unrouted document goes unreported here.
// GitHub renders those fences, so they are worth writing directives for; this
// guard is not the thing that will tell you about them.
const ROUTED_ROOTS = ['app', 'src/app', 'pages', 'src/pages', 'content', 'src/content'];

function routedPrefixes(appDir) {
  const found = ROUTED_ROOTS.map((r) => join(appDir, r)).filter((p) => {
    try { return statSync(p).isDirectory(); } catch { return false; }
  });
  return found.length > 0 ? found : null;
}

const findings = [];
const add = (check, file, line, text, note = '') =>
  findings.push({ check, file: relative(APP, file), line, text: String(text).trim().slice(0, 110), note });

// ---------------------------------------------------------------- JSX tags
// Return every JSX opening tag as {name, attrs, start, end}.
//
// A regex cannot do this. `tabIndex={a > b ? 0 : -1}` and `style={{...}}` both
// put characters inside a tag that end it when read naively, and an attribute
// string may contain anything at all. So: scan, tracking brace depth and the
// quote state, and end the tag at the first `>` that is outside both.
//
// COVERAGE BOUNDARY: this reads source text, not a syntax tree. A tag written
// inside a template literal or a comment is read as a tag. That direction is
// the safe one — it over-reads structure rather than missing an element — and
// comments are stripped before this runs.
export function jsxOpenTags(src) {
  const tags = [];
  for (let i = 0; i < src.length; i++) {
    if (src[i] !== '<') continue;
    const nameMatch = /^<([A-Za-z][\w.-]*)/.exec(src.slice(i, i + 60));
    if (!nameMatch) continue;
    let depth = 0;
    let quote = '';
    let j = i + nameMatch[0].length;
    for (; j < src.length; j++) {
      const c = src[j];
      if (quote) {
        if (c === quote) quote = '';
        continue;
      }
      if (c === '"' || c === "'" || c === '`') { quote = c; continue; }
      if (c === '{') { depth++; continue; }
      if (c === '}') { depth--; continue; }
      if (c === '>' && depth === 0) break;
    }
    if (j >= src.length) continue; // unterminated: not a tag
    tags.push({
      name: nameMatch[1],
      attrs: src.slice(i + nameMatch[0].length, j),
      start: i,
      end: j,
    });
    i = j;
  }
  return tags;
}

const stripJsComments = (s) =>
  s.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
   .replace(/(^|[^:])\/\/[^\n]*/g, (m) => m.replace(/[^\n]/g, ' '));

const stripCssComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));

// ----------------------------------------------------------- mermaid fences
// Every ```mermaid block, with the 1-based line of its opening fence.
export function mermaidFences(src) {
  const blocks = [];
  const lines = src.split('\n');
  let inBlock = false;
  let blockLines = [];
  let startLine = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!inBlock && line.trim() === '```mermaid') {
      inBlock = true;
      blockLines = [];
      startLine = i + 1;
      continue;
    }
    if (inBlock && line.trim() === '```') {
      blocks.push({ code: blockLines.join('\n'), startLine });
      inBlock = false;
      continue;
    }
    if (inBlock) blockLines.push(line);
  }
  if (inBlock) blocks.push({ code: blockLines.join('\n'), startLine, unclosed: true });
  return blocks;
}

// A description short enough to fit under this is a label, not a description:
// it restates the title and adds nothing. The floor exists so the gate cannot
// be satisfied with "A diagram." It was set against real content whose shortest
// legitimate description ran to 572 characters, so the margin is wide.
const MIN_ACC_DESCR = 60;

// Roles that prune their subtree or are otherwise not operable. An element with
// one of these takes no tabIndex.
const NON_OPERABLE_ROLES = new Set(['img', 'presentation', 'none']);

// -------------------------------------------------------------- the checks

function checkDiagramAlt(file, src) {
  for (const block of mermaidFences(src)) {
    if (block.unclosed) continue; // a broken fence is a Markdown fault, not this guard's
    const { accTitle, accDescr } = extractAccessibility(block.code);
    const at = block.startLine;
    if (!accTitle) add('diagramalt', file, at, '```mermaid', NOTE.diagramalt.noTitle);
    if (!accDescr) add('diagramalt', file, at, '```mermaid', NOTE.diagramalt.noDescr);
    else if (accDescr.length < MIN_ACC_DESCR) {
      add('diagramalt', file, at, accDescr, NOTE.diagramalt.thinDescr(accDescr.length));
    }
  }
}

function checkFocusRole(file, src) {
  for (const tag of jsxOpenTags(src)) {
    const role = /\brole\s*=\s*["']([\w-]+)["']/.exec(tag.attrs);
    if (!role || !NON_OPERABLE_ROLES.has(role[1])) continue;
    if (!/\btabIndex\s*=/.test(tag.attrs)) continue;
    add('focusrole', file, lineOf(src, tag.start), `<${tag.name} … role="${role[1]}" tabIndex=…>`,
      NOTE.focusrole(role[1]));
  }
}

// Anything that indicates the promise is kept. Deliberately generous: the check
// asks whether a focus trap was attempted anywhere in the file, not whether it
// is correct. Proving a trap correct is a review question, not a regex one.
// `useModalSurface` and `inertOutside` are the package's own, from
// `@ekdotico/domico/a11y`: a file that calls either has kept the promise by
// construction, and neither name contains the word the first alternative looks
// for as a whole word.
const TRAP_EVIDENCE = /\binert\b|\.focus\s*\(|['"`]Tab['"`]|[Ff]ocus[- ]?[Tt]rap|focusTrap|trapFocus|\buseModalSurface\b|\binertOutside\b/;

function checkModalTrap(file, src) {
  const m = /\baria-modal\s*=\s*(["']true["']|\{\s*true\s*\})/.exec(src);
  if (!m) return;
  if (TRAP_EVIDENCE.test(src)) return;
  add('modaltrap', file, lineOf(src, m.index), m[0], NOTE.modaltrap);
}

function checkDanglingId(file, src) {
  const declared = new Set();
  for (const m of src.matchAll(/\bid\s*=\s*["']([^"'{}]+)["']/g)) declared.add(m[1]);
  for (const m of src.matchAll(/\baria-(labelledby|describedby)\s*=\s*["']([^"'{}]+)["']/g)) {
    for (const id of m[2].trim().split(/\s+/)) {
      if (declared.has(id)) continue;
      add('danglingid', file, lineOf(src, m.index), m[0], NOTE.danglingid[m[1]](id));
    }
  }
}

// ------------------------------------------------------------- focus rings
// Does a declaration block put an outline back?
//
// An outline, and not any visible change, because the change has to survive
// forced colours. Under Windows High Contrast the engine repaints background,
// box-shadow and border-color from the reader's own short palette, so a ring
// drawn as a box-shadow, or a focus shown as a background tint, vanishes for
// exactly the readers who asked for more contrast (WCAG 2.4.7, 1.4.11). An
// outline is kept, and repainted in a system colour. `outline: 2px solid
// transparent` beside a box-shadow is the idiom: invisible normally, and the
// ring the forced palette draws when the shadow is gone.
//
// The negative lookahead sits after the colon, not after `\s*`. Placed after
// the whitespace, `\s*` backtracks to nothing and the lookahead then reads
// " none", which is not "none" — so `outline: none` counted as putting an
// outline back, and every :focus rule that removed the ring passed. It did,
// until this was rewritten.
const RESTORES_OUTLINE =
  /\boutline\s*:(?!\s*(?:none|0)\s*(?:!important\s*)?(?:;|$))|\boutline-style\s*:(?!\s*none\b)/m;

// Collect, across every stylesheet in the repository, the selector text of
// every rule that styles a focused state with an outline.
function focusSelectors(cssFiles) {
  const styled = new Set();
  for (const file of cssFiles) {
    const css = stripCssComments(readFileSync(file, 'utf8'));
    for (const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      const sel = m[1].trim();
      if (!/:focus\b|:focus-visible\b|:focus-within\b/.test(sel)) continue;
      if (!RESTORES_OUTLINE.test(m[2])) continue;
      for (const part of sel.split(',')) styled.add(part.trim());
    }
  }
  return styled;
}

const IDENT_CHAR = /[A-Za-z0-9_-]/;

// Does anything restore a focus indicator for this selector?
//
// The base has to appear as a whole token, not merely as a substring. A plain
// `includes` reads `.cmdk-input-row:focus-within` as restoring the ring for
// `.cmdk-input`, and `.icon-button:focus` as restoring it for `button` — two
// different elements that happen to share a prefix or a suffix. That is a
// false negative in the direction that matters: a real missing ring, silently
// cleared by an unrelated rule somewhere else in the stylesheet.
//
// A base beginning with `.` or `#` is bounded on the left by construction, so
// `.a.b` still counts as styling `.b`. On the right the next character must
// not continue the identifier.
//
// COVERAGE BOUNDARY: this asks whether the base is *named* in a focus rule,
// which is all a static read can establish. Where an ancestor carries the
// indicator, name the descendant so the relationship is visible —
// `.row:has(.field:focus)` is checkable, `.row:focus-within` is not.
const hasFocusReplacement = (styled, base) => {
  const b = base.trim();
  if (!b) return false;
  const leftFree = /^[.#]/.test(b);
  for (const sel of styled) {
    for (let i = sel.indexOf(b); i !== -1; i = sel.indexOf(b, i + 1)) {
      const before = i === 0 ? '' : sel[i - 1];
      const after = sel[i + b.length] ?? '';
      if (!leftFree && before !== '' && IDENT_CHAR.test(before)) continue;
      if (after !== '' && IDENT_CHAR.test(after)) continue;
      return true;
    }
  }
  return false;
};

// `outline: none` or `outline: 0`, as the whole value. `\b` after the 0 would
// also match `outline: 0.125rem solid`, which is a ring.
const OUTLINE_NONE = /\boutline\s*:\s*(?:none|0)\s*(?:!important\s*)?(?:;|$)/m;

// Is the selector's subject a form control? The last compound decides, so
// `.form input` is a control and `input + label` is not. An element name, or a
// class that ends in `input` or `textarea` — `.search-input`, `.unlock-input` —
// which is how the applications name the fields they style.
//
// COVERAGE BOUNDARY: a field styled only by a class with some other name is
// not recognised as one. That under-reports, which is the safe direction.
function isControlSelector(sel) {
  const subject = sel.trim().split(/\s*[\s>+~]\s*/).pop() ?? '';
  const bare = subject.replace(/::?[\w-]+(\([^)]*\))?/g, '');
  return /^(?:input|textarea|select)(?![\w-])/.test(bare) || /\.[\w-]*(?:input|textarea)(?![\w-])/i.test(bare);
}

/** A focus selector that names the element itself, not an ancestor's :focus-within. */
const directFocus = (styled) => new Set([...styled].filter((s) => /:focus(?:-visible)?\b(?!-)/.test(s)));

function checkFocusRingCss(file, src, styled) {
  const css = stripCssComments(src);
  for (const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const sel = m[1].trim();
    const body = m[2];
    if (!OUTLINE_NONE.test(body)) continue;
    // `:focus:not(:focus-visible)` is the correct idiom, not a violation. It
    // suppresses the user-agent ring in exactly the state where the system's
    // own :focus-visible ring does not match, so an engine that still paints
    // one does not show two. This package's reset defines it; a guard that
    // flagged the file establishing the right pattern would be reporting the
    // fix as the fault.
    if (/:focus\b[^,]*:not\(\s*:focus-visible\s*\)/.test(sel)) continue;
    const at = lineOf(css, m.index);
    const parts = sel.split(',').map((s) => s.trim()).filter(Boolean);
    for (const part of parts) {
      if (/:focus/.test(part)) {
        // A rule that removes the outline inside a focus selector has to put
        // one back in the same block — a box-shadow or a tint is not enough,
        // for the forced-colours reason above.
        if (RESTORES_OUTLINE.test(body.replace(OUTLINE_NONE, ''))) continue;
        // A plain `:focus` rule may drop the ring for pointer focus where the
        // same element's :focus-visible rule draws it: :focus-visible matches
        // whenever the ring is owed, and wins by order at equal specificity.
        if (/:focus\b(?!-)/.test(part) && !/:focus-(?:visible|within)\b/.test(part)) {
          const base = part.replace(/:focus\b(?!-)/g, '');
          const visible = new Set([...styled].filter((s) => s.includes(':focus-visible')));
          if (hasFocusReplacement(visible, base)) continue;
        }
        add('focusring', file, at, `${sel} { … outline: none … }`, NOTE.focusring.rule(part));
        break;
      }
      // A base rule. A form control is inputring's to report, with its
      // stricter replacement test; everything else is checked here.
      if (isControlSelector(part)) {
        if (hasFocusReplacement(directFocus(styled), part)) continue;
        add('inputring', file, at, `${sel} { … outline: none … }`, NOTE.inputring(part));
        break;
      }
      if (hasFocusReplacement(styled, part)) continue;
      add('focusring', file, at, `${sel} { … outline: none … }`, NOTE.focusring.rule(part));
      break;
    }
  }
}

function checkFocusRingJsx(file, src, styled) {
  for (const tag of jsxOpenTags(src)) {
    if (!/outline\s*:\s*['"](none|0)['"]/.test(tag.attrs)) continue;
    // Only an element that can hold focus can lose a focus indicator.
    const focusable = /\btabIndex\s*=/.test(tag.attrs)
      || ['button', 'a', 'input', 'select', 'textarea'].includes(tag.name);
    if (!focusable) continue;
    const cls = /\bclassName\s*=\s*["']([^"']+)["']/.exec(tag.attrs);
    const replaced = cls
      ? cls[1].split(/\s+/).some((c) => hasFocusReplacement(styled, `.${c}`))
      : false;
    if (replaced) continue;
    add('focusring', file, lineOf(src, tag.start), `<${tag.name} … outline: 'none' …>`, NOTE.focusring.inline);
  }
}

// ------------------------------------------------------- placeholder colour
// Placeholder text is text, and 1.4.3 does not exempt it. --fg-5 is decoration
// in every palette, at 1.41:1 to 2.01:1, and the catalogue says in as many
// words that it is never placeholder text; --fg-4 is under 4.5:1 on
// --bg-surface-2 in all four light palettes, and a field is exactly the kind of
// tinted surface it gets drawn on. A placeholder that is legible only to some
// readers is a hint that is missing for the rest, which is worse than none,
// because it looks present.
const PLACEHOLDER = /::?(?:-webkit-input-|-moz-|-ms-input-)?placeholder\b/;

function checkPlaceholderCss(file, src) {
  const css = stripCssComments(src);
  for (const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (!PLACEHOLDER.test(m[1])) continue;
    const ink = /(?:^|[;\s])color\s*:[^;]*var\(\s*(--fg-[45])\s*\)/.exec(m[2]);
    if (!ink) continue;
    add('placeholder', file, lineOf(css, m.index), `${m[1].trim()} { color: var(${ink[1]}) }`, NOTE.placeholder(ink[1]));
  }
}

// ----------------------------------------------------------- control border
// The visible edge of a text field is what identifies it as a field, and 1.4.11
// asks 3:1 of it. The three hairlines measure 1.6:1 to 1.9:1 on every canvas,
// which a divider wants and a field may not have; --rule-control exists for
// exactly this and measures at least 3.3:1 on every surface. A field bordered
// with --rule or --rule-soft reads as a box drawn round nothing.
//
// COVERAGE BOUNDARY: a control is recognised by its selector (see
// isControlSelector). --rule-strong is not reported: it is not the control
// token either, but it is the one hairline a reviewer might defensibly choose
// for a heavy boundary, and this check reports only the two that cannot be.
const HAIRLINE_BORDER = /\bborder(?:-(?:top|right|bottom|left|block|inline)(?:-(?:start|end))?)?(?:-color)?\s*:[^;]*var\(\s*(--rule(?:-soft)?)\s*\)/;

function checkControlBorderCss(file, src) {
  const css = stripCssComments(src);
  for (const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const parts = m[1].split(',').map((s) => s.trim()).filter(Boolean);
    const control = parts.find((p) => isControlSelector(p) && !PLACEHOLDER.test(p));
    if (!control) continue;
    const hit = HAIRLINE_BORDER.exec(m[2]);
    if (!hit) continue;
    add('controlborder', file, lineOf(css, m.index), `${m[1].trim()} { border: … var(${hit[1]}) }`,
      NOTE.controlborder(hit[1]));
  }
}

// --------------------------------------------------------- unnamed controls
// A button whose content is only an icon. Narrow on purpose: an expression
// child may well render text ({label}, {t('save')}), and a check that cannot
// tell those apart would report every one of them. So the content must be
// nothing but icon-shaped elements and whitespace.
const ICON_ONLY = /^(?:\s|<svg[\s\S]*?<\/svg>|<[A-Z][\w.]*Icon\b[^>]*\/>|<Icon\b[^>]*\/>)+$/;

//
// The opening tag comes from jsxOpenTags, not a regex. `<button([^>]*)>` ended
// the tag at the `>` of `onClick={() => close()}`, so the rest of the attributes
// were read as the button's content, which is never icon-only — and every
// icon-only button with an arrow-function handler, which is most of them,
// passed unexamined.
//
// COVERAGE BOUNDARY: a spread ({...props}) may carry the name, so a tag
// containing one is not read, as in unnamedfocus.
function checkUnnamedControl(file, src) {
  for (const tag of jsxOpenTags(src)) {
    if (tag.name !== 'button') continue;
    if (/\/\s*$/.test(tag.attrs)) continue; // self-closing: no content to read
    if (/\{\s*\.\.\./.test(tag.attrs)) continue;
    if (/\baria-label(ledby)?\s*=/.test(tag.attrs) || /\btitle\s*=/.test(tag.attrs)) continue;
    const close = src.indexOf('</button>', tag.end);
    if (close === -1) continue;
    if (!ICON_ONLY.test(src.slice(tag.end + 1, close))) continue;
    add('unnamedcontrol', file, lineOf(src, tag.start), `<button${tag.attrs.slice(0, 60)}>`, NOTE.unnamedcontrol);
  }
}

// ---------------------------------------------------------- unnamed tab stops
// A generic element given a tab stop. `tabIndex={0}` on a <div> is how a
// scrollable table wrapper is reached from the keyboard, and that part is
// right; but a tab stop is a user interface component, and one owes a role and
// a name (WCAG 4.1.2). Without them a screen reader lands on the element and
// says nothing. Five table wrappers across two applications shipped this way.
//
// Only a literal, non-negative tabIndex counts. -1 is a programmatic focus
// target — a main region focused after a route change — which is never in the
// Tab order; and an expression (`tabIndex={selected ? 0 : -1}`) is a roving
// tab stop whose element already carries a widget role.
//
// COVERAGE BOUNDARY: a spread ({...props}) may carry the role and the name, so
// a tag containing one is not read. A role that takes its name from its own
// content — button, link, tab, option — needs no aria-label and is not asked
// for one; every other role is, since group, region and dialog name nothing on
// their own.
const GENERIC_TAGS = new Set(['div', 'span', 'section', 'article']);
const NAMED_FROM_CONTENT = new Set([
  'button', 'link', 'tab', 'menuitem', 'menuitemcheckbox', 'menuitemradio', 'option',
  'checkbox', 'radio', 'switch', 'treeitem', 'row', 'cell', 'gridcell', 'columnheader',
  'rowheader', 'heading', 'tooltip',
]);

function checkUnnamedFocus(file, src) {
  for (const tag of jsxOpenTags(src)) {
    if (!GENERIC_TAGS.has(tag.name)) continue;
    const ti = /\btabIndex\s*=\s*(?:\{\s*(-?\d+)\s*\}|["'](-?\d+)["'])/.exec(tag.attrs);
    if (!ti) continue;
    const value = ti[1] ?? ti[2];
    if (Number(value) < 0) continue;
    if (/\{\s*\.\.\./.test(tag.attrs)) continue;
    const role = /\brole\s*=\s*["']([\w-]+)["']/.exec(tag.attrs);
    if (!role) {
      add('unnamedfocus', file, lineOf(src, tag.start), `<${tag.name} … tabIndex={${value}} …>`, NOTE.unnamedfocus.noRole);
      continue;
    }
    if (NAMED_FROM_CONTENT.has(role[1])) continue;
    if (/\baria-label(ledby)?\s*=/.test(tag.attrs)) continue;
    add('unnamedfocus', file, lineOf(src, tag.start), `<${tag.name} … role="${role[1]}" tabIndex={${value}} …>`,
      NOTE.unnamedfocus.noName(role[1]));
  }
}

// ---------------------------------------------------------- tooltip content
// A tooltip is shown on hover and focus of something else and vanishes when
// either moves, so nothing inside it can be reached: the pointer leaving the
// trigger for the link closes it, and Tab from the trigger goes to the next
// control in the page rather than into the tooltip. A link or a button inside
// one is a control that exists only for a reader who never needs to operate it
// (WCAG 2.1.1, 1.4.13). Content that needs a control is a disclosure or a
// non-modal dialog, which can be entered.
function checkTooltipContent(file, src) {
  const tags = jsxOpenTags(src);
  for (const tag of tags) {
    if (!/\brole\s*=\s*(?:["']tooltip["']|\{\s*["']tooltip["']\s*\})/.test(tag.attrs)) continue;
    if (/\/\s*$/.test(tag.attrs)) continue;
    // The matching close tag, counting nested elements of the same name.
    const open = new RegExp(`<${tag.name}\\b`, 'g');
    const close = `</${tag.name}>`;
    let depth = 1;
    let at = tag.end + 1;
    let end = -1;
    while (depth > 0) {
      const nextClose = src.indexOf(close, at);
      if (nextClose === -1) break;
      open.lastIndex = at;
      const nextOpen = open.exec(src);
      if (nextOpen && nextOpen.index < nextClose) {
        depth++;
        at = nextOpen.index + 1;
        continue;
      }
      depth--;
      at = nextClose + close.length;
      if (depth === 0) end = nextClose;
    }
    if (end === -1) continue;
    const inner = /<(a|button)\b/.exec(src.slice(tag.end + 1, end));
    if (!inner) continue;
    add('tooltipcontent', file, lineOf(src, tag.start), `<${tag.name} role="tooltip">…<${inner[1]}…`,
      NOTE.tooltipcontent(inner[1]));
  }
}

// ---------------------------------------------------------------- menu keys
// `role="menu"` is a promise about the keyboard, as `radiogroup` is: the menu
// is one tab stop, and the arrow keys move between its items. A menu that
// answers only to Tab tells a screen reader user to press keys that do nothing,
// and hides every item but the first from anyone who believes it. The appearance
// control is not a menu for this reason; a component that does claim the role
// owes the arrows.
//
// Advisory, like modaltrap and for the same reason: the evidence is looked for
// across the file, so a handler in an imported hook reads as absent.
const MENU_ROLE = /\brole\s*=\s*(?:["']menu["']|\{\s*["']menu["']\s*\})/;

function checkMenuKeys(file, src) {
  const m = MENU_ROLE.exec(src);
  if (!m) return;
  if (/ArrowDown|ArrowUp/.test(src)) return;
  add('menukeys', file, lineOf(src, m.index), m[0], NOTE.menukeys);
}

// ------------------------------------------------------------------- notes
// Filled from the Expression Guidelines' system feedback register: state what
// holds and what to do, describe the process rather than any person, and never
// evaluate the reader.
const NOTE = {
  diagramalt: {
    noTitle: 'no accTitle — role="img" prunes the SVG, so add accTitle: <short name>',
    noDescr: 'no accDescr — add accDescr { … } naming what the diagram shows',
    thinDescr: (n) => `accDescr is ${n} characters — describe what the diagram shows, ${MIN_ACC_DESCR} or more`,
  },
  focusrole: (role) => `tabIndex puts focus on role="${role}" — move it to a role="group" wrapper`,
  modaltrap: 'aria-modal="true" — no Tab cycle and no inert background in this file; both are owed',
  danglingid: {
    labelledby: (id) => `no id="${id}" in this file — the element has no name; define the id or use aria-label`,
    describedby: (id) => `no id="${id}" in this file — the description is absent; define the id or drop the attribute`,
  },
  focusring: {
    rule: (sel) =>
      `no :focus-visible outline for ${sel} — add outline: 2px solid var(--accent), ` +
      'or outline: 2px solid transparent beside a box-shadow ring',
    inline: 'outline removed inline — add a :focus-visible rule with outline: 2px solid var(--accent)',
  },
  inputring: (sel) =>
    `no :focus-visible outline for the control ${sel} — add one; a border or shadow change vanishes in forced colours`,
  placeholder: (token) =>
    `placeholder text in ${token}, which is not a text colour on a field — use var(--fg-3)`,
  controlborder: (token) =>
    `a control bordered in ${token}, which measures under 3:1 — use var(--rule-control)`,
  tooltipcontent: (el) =>
    `a <${el}> inside a tooltip cannot be reached by pointer or keyboard — use a disclosure`,
  menukeys: 'role="menu" with no ArrowDown or ArrowUp handling in this file — add the arrow keys, or drop the role',
  unnamedcontrol: 'a screen reader announces "button" alone — add aria-label matching the tooltip',
  unnamedfocus: {
    noRole: 'a tab stop with no role announces nothing — add role="group" and aria-label, or drop tabIndex',
    noName: (role) => `role="${role}" names nothing on its own — add aria-label, or drop tabIndex`,
  },
};

// -------------------------------------------------------------- self-check
// The parsers above are the part with branches, so they carry the assertions.
// The cases came from the docs application's validator, where the fence forms
// were exercised against real content.
function selfCheck() {
  const block = extractAccessibility(
    'erDiagram\n  accTitle: T\n  accDescr {\n    first\n    second\n  }\n  USER { string id PK }',
  );
  assert.equal(block.accTitle, 'T');
  assert.equal(block.accDescr, 'first second');
  // Blanked in place: seven lines in, seven lines out, entity line still last.
  assert.equal(block.source.split('\n').length, 7);
  assert.equal(block.source.split('\n')[6], '  USER { string id PK }');
  // `accDescr {` must not be read by the `accDescr:` branch.
  assert.ok(!block.accDescr.includes('{'));

  const inline = extractAccessibility('graph LR\n  accDescr: one line\n  A --> B');
  assert.equal(inline.accDescr, 'one line');
  assert.equal(inline.accTitle, '');

  const oneLineBlock = extractAccessibility('graph LR\n  accDescr { all on one line }\n  A --> B');
  assert.equal(oneLineBlock.accDescr, 'all on one line');

  const none = extractAccessibility('graph LR\n  A --> B');
  assert.equal(none.accTitle, '');
  assert.equal(none.accDescr, '');
  assert.equal(none.source, 'graph LR\n  A --> B');

  // Fence extraction.
  const fences = mermaidFences('text\n```mermaid\ngraph LR\n  A --> B\n```\nmore\n');
  assert.equal(fences.length, 1);
  assert.equal(fences[0].startLine, 2);
  assert.equal(fences[0].code, 'graph LR\n  A --> B');

  // Tag scanning: a `>` inside an expression must not end the tag, and the
  // attribute span must still carry the role. This is the exact shape of the
  // element the rule was written about.
  const tags = jsxOpenTags('<div role="img" tabIndex={a > b ? 0 : -1} style={{ x: 1 }}>hi</div>');
  assert.equal(tags.length, 1);
  assert.ok(tags[0].attrs.includes('role="img"'));
  assert.ok(tags[0].attrs.includes('tabIndex'));

  // A quoted `>` must not end it either.
  const quoted = jsxOpenTags('<a title="a > b" href="/x">y</a>');
  assert.equal(quoted[0].name, 'a');
  assert.ok(quoted[0].attrs.includes('href="/x"'));

  // Icon-only detection, both directions.
  assert.ok(ICON_ONLY.test('<svg viewBox="0 0 1 1"><path d="M0 0"/></svg>'));
  assert.ok(!ICON_ONLY.test('Save'));
  assert.ok(!ICON_ONLY.test('{label}'));

  // --- detection, end to end ------------------------------------------
  // A guard that has never caught anything is a guard nobody has tested. Each
  // check runs against the shape it exists to find and against the shape it
  // must leave alone, and the findings are discarded before the real walk.
  const at = findings.length;
  const caught = (fn) => {
    const before = findings.length;
    fn();
    const n = findings.length - before;
    return n;
  };

  // The original defect, verbatim in shape: one element, non-operable role,
  // focusable, with keys bound to it.
  assert.equal(caught(() => checkFocusRole('t', '<div role="img" tabIndex={0} aria-label="Diagram" />')), 1);
  // The correction: two elements, and neither is a violation.
  assert.equal(
    caught(() => checkFocusRole('t', '<div role="group" tabIndex={0}><div role="img" aria-label="x" /></div>')),
    0,
  );

  // A fence with no directives at all, and one whose description is a label.
  assert.equal(caught(() => checkDiagramAlt('t', '```mermaid\ngraph LR\n  A --> B\n```')), 2);
  assert.equal(
    caught(() => checkDiagramAlt('t', '```mermaid\ngraph LR\n  accTitle: T\n  accDescr: A diagram.\n  A --> B\n```')),
    1,
  );
  // A fence carrying both, with a description past the floor, is clean.
  assert.equal(
    caught(() => checkDiagramAlt('t',
      '```mermaid\ngraph LR\n  accTitle: Request path\n  accDescr { The browser calls the API tier, which reads the database tier over a private network. }\n  A --> B\n```')),
    0,
  );

  assert.equal(caught(() => checkDanglingId('t', '<p aria-describedby="gone">x</p>')), 1);
  assert.equal(caught(() => checkDanglingId('t', '<p aria-describedby="here">x</p><i id="here" />')), 0);

  assert.equal(caught(() => checkModalTrap('t', '<div aria-modal="true" role="dialog">x</div>')), 1);
  assert.equal(
    caught(() => checkModalTrap('t', '<div aria-modal="true" role="dialog">x</div>\nel.focus();')),
    0,
  );

  assert.equal(caught(() => checkUnnamedControl('t', '<button onClick={f}><svg><path d="M0"/></svg></button>')), 1);
  assert.equal(caught(() => checkUnnamedControl('t', '<button aria-label="Close"><svg><path d="M0"/></svg></button>')), 0);
  // The shape the regex missed: an arrow function's `>` ended the tag early.
  assert.equal(caught(() => checkUnnamedControl('t', '<button onClick={() => close()}><XIcon /></button>')), 1);
  assert.equal(
    caught(() => checkUnnamedControl('t', '<button onClick={() => close()} aria-label="Close"><XIcon /></button>')),
    0,
  );
  assert.equal(caught(() => checkUnnamedControl('t', '<button onClick={() => go()}>Save</button>')), 0);
  assert.equal(caught(() => checkUnnamedControl('t', '<button {...rest}><XIcon /></button>')), 0);

  // The table wrapper as it shipped, and as corrected.
  assert.equal(caught(() => checkUnnamedFocus('t', '<div className="tbl-wrap" tabIndex={0}><table /></div>')), 1);
  assert.equal(
    caught(() => checkUnnamedFocus('t', '<div className="tbl-wrap" tabIndex={0} role="group" aria-label="Table" />')),
    0,
  );
  // A role that names nothing from content still owes a name.
  assert.equal(caught(() => checkUnnamedFocus('t', '<div role="group" tabIndex={0} />')), 1);
  // Left alone: a programmatic target, a roving stop, a spread that may name
  // it, a role named from content, and a labelled widget.
  assert.equal(caught(() => checkUnnamedFocus('t', '<div tabIndex={-1} />')), 0);
  assert.equal(caught(() => checkUnnamedFocus('t', '<div tabIndex={selected ? 0 : -1} />')), 0);
  assert.equal(caught(() => checkUnnamedFocus('t', '<div tabIndex={0} {...rest} />')), 0);
  assert.equal(caught(() => checkUnnamedFocus('t', '<div role="button" tabIndex={0}>Save</div>')), 0);
  assert.equal(caught(() => checkUnnamedFocus('t', '<div role="tabpanel" tabIndex={0} aria-labelledby="t1" />')), 0);
  assert.equal(caught(() => checkUnnamedFocus('t', '<button tabIndex={0} />')), 0);

  // The focus-ring exemption. `:focus:not(:focus-visible) { outline: none }` is
  // the correct idiom and must not be reported; a bare removal with nothing
  // restoring it must be.
  const noStyled = new Set();
  assert.equal(caught(() => checkFocusRingCss('t', ':focus:not(:focus-visible) { outline: none; }', noStyled)), 0);
  assert.equal(caught(() => checkFocusRingCss('t', '.b { outline: none; }', noStyled)), 1);
  assert.equal(
    caught(() => checkFocusRingCss('t', '.b { outline: none; }', new Set(['.b:focus-visible']))),
    0,
  );
  // A ring drawn as a box-shadow or a tint vanishes in forced colours, so a
  // focus rule that removes the outline must put one back — and the lookahead
  // bug that read `outline: none` as a restoration must stay fixed.
  assert.equal(caught(() => checkFocusRingCss('t', '.b:focus-visible { outline: none; box-shadow: 0 0 0 2px red; }', noStyled)), 1);
  assert.equal(caught(() => checkFocusRingCss('t', '.b:focus { outline: none; background: red; }', noStyled)), 1);
  assert.equal(
    caught(() => checkFocusRingCss('t', '.b:focus-visible { outline: 2px solid transparent; box-shadow: 0 0 0 2px red; }', noStyled)),
    0,
  );
  assert.ok(!RESTORES_OUTLINE.test('outline: none;'), 'outline: none read as a restoration');
  assert.ok(!RESTORES_OUTLINE.test('outline:0'), 'outline: 0 read as a restoration');
  assert.ok(RESTORES_OUTLINE.test('outline: 2px solid transparent'));
  assert.ok(RESTORES_OUTLINE.test('outline: 0.125rem solid var(--accent)'));
  assert.ok(!OUTLINE_NONE.test('outline: 0.125rem solid var(--accent)'), 'a 0.125rem ring read as a removal');
  // Pointer focus may drop the ring where :focus-visible draws it.
  assert.equal(caught(() => checkFocusRingCss('t', '.b:focus { outline: none; }', new Set(['.b:focus-visible']))), 0);
  assert.equal(caught(() => checkFocusRingCss('t', '.b:focus { outline: none; }', noStyled)), 1);
  // The collected set holds only rules that restore an outline.
  const tmpCss = join(process.env.TMPDIR ?? '/tmp', `check-a11y-${process.pid}.css`);
  writeFileSync(tmpCss, '.s:focus-visible { box-shadow: 0 0 0 2px red; }\n.o:focus-visible { outline: 2px solid red; }');
  const collected = focusSelectors([tmpCss]);
  rmSync(tmpCss);
  assert.ok(!collected.has('.s:focus-visible') && collected.has('.o:focus-visible'), 'a shadow ring counted as a replacement');

  // inputring: a control's replacement must be its own :focus or
  // :focus-visible outline, not an ancestor's :focus-within.
  assert.ok(isControlSelector('.form input') && isControlSelector('.search-input') && isControlSelector('textarea'));
  assert.ok(!isControlSelector('input + label') && !isControlSelector('.inputs-row') && !isControlSelector('::selection'));
  assert.equal(caught(() => checkFocusRingCss('t', '.search-input { outline: none; }', noStyled)), 1);
  assert.equal(
    caught(() => checkFocusRingCss('t', '.search-input { outline: none; }', new Set(['.search-input:focus-visible']))),
    0,
  );
  assert.equal(
    caught(() => checkFocusRingCss('t', '.search-input { outline: none; }', new Set(['.search-input-row:focus-within']))),
    1,
  );

  // placeholder and controlborder, both directions.
  assert.equal(caught(() => checkPlaceholderCss('t', '.f::placeholder { color: var(--fg-5); }')), 1);
  assert.equal(caught(() => checkPlaceholderCss('t', 'input::placeholder { color: var(--fg-4); }')), 1);
  assert.equal(caught(() => checkPlaceholderCss('t', 'input::placeholder { color: var(--fg-3); }')), 0);
  assert.equal(caught(() => checkPlaceholderCss('t', '.hint { color: var(--fg-4); }')), 0);
  assert.equal(caught(() => checkControlBorderCss('t', 'input { border: 1px solid var(--rule); }')), 1);
  assert.equal(caught(() => checkControlBorderCss('t', '.unlock-input { border-bottom: 1px solid var(--rule-soft); }')), 1);
  assert.equal(caught(() => checkControlBorderCss('t', 'input { border: 1px solid var(--rule-control); }')), 0);
  assert.equal(caught(() => checkControlBorderCss('t', '.card { border: 1px solid var(--rule); }')), 0);
  assert.equal(caught(() => checkControlBorderCss('t', 'input::placeholder { border-color: var(--rule); }')), 0);

  // tooltipcontent and menukeys.
  assert.equal(caught(() => checkTooltipContent('t', '<div role="tooltip">See <a href="/x">more</a></div>')), 1);
  assert.equal(caught(() => checkTooltipContent('t', '<span role="tooltip">Plain text</span><a href="/x">after</a>')), 0);
  assert.equal(
    caught(() => checkTooltipContent('t', '<div role="tooltip"><div>nested</div> text</div><button>after</button>')),
    0,
  );
  assert.equal(caught(() => checkMenuKeys('t', '<ul role="menu"><li role="menuitem">A</li></ul>')), 1);
  assert.equal(
    caught(() => checkMenuKeys('t', '<ul role="menu" onKeyDown={(e) => e.key === "ArrowDown" && next()} />')),
    0,
  );
  // aria-modal evidence from the package's own helpers.
  assert.equal(
    caught(() => checkModalTrap('t', '<div aria-modal="true" role="dialog">x</div>\nuseModalSurface({ open });')),
    0,
  );

  // Token boundaries. A longer name that merely starts or ends with the base
  // is a different element and must not clear the finding — this is the false
  // negative a plain substring test allows.
  assert.equal(hasFocusReplacement(new Set(['.b:focus-visible']), '.b'), true);
  assert.equal(hasFocusReplacement(new Set(['.b-row:focus-within']), '.b'), false);
  assert.equal(hasFocusReplacement(new Set(['.icon-button:focus']), 'button'), false);
  assert.equal(hasFocusReplacement(new Set(['button:focus']), 'button'), true);
  // Still true for the shapes that genuinely style the base: a descendant, a
  // compound, and an ancestor that names it through :has().
  assert.equal(hasFocusReplacement(new Set(['.a .b:focus']), '.b'), true);
  assert.equal(hasFocusReplacement(new Set(['.a.b:focus']), '.b'), true);
  assert.equal(hasFocusReplacement(new Set(['.row:has(.b:focus)']), '.b'), true);
  // And the finding survives when only the longer name is styled.
  assert.equal(
    caught(() => checkFocusRingCss('t', '.b { outline: none; }', new Set(['.b-row:focus-within']))),
    1,
  );

  findings.length = at;
}

// ------------------------------------------------------------------- main
selfCheck();

const files = walk(APP);
if (files.length === 0) {
  console.error(`check-a11y: no source files found under ${APP}`);
  process.exit(2);
}

const cssFiles = files.filter((f) => CSS_EXT.has(extname(f)));
const styled = focusSelectors(cssFiles);
const routed = routedPrefixes(APP);
const isRouted = (f) => routed === null || routed.some((p) => f.startsWith(p + '/'));

for (const file of files) {
  const ext = extname(file);
  const raw = readFileSync(file, 'utf8');
  if (DOC_EXT.has(ext)) {
    if (isRouted(file)) checkDiagramAlt(file, raw);
    continue;
  }
  if (CSS_EXT.has(ext)) {
    checkFocusRingCss(file, raw, styled);
    checkPlaceholderCss(file, raw);
    checkControlBorderCss(file, raw);
    continue;
  }
  const src = stripJsComments(raw);
  checkFocusRole(file, src);
  checkModalTrap(file, src);
  checkDanglingId(file, src);
  checkFocusRingJsx(file, src, styled);
  checkUnnamedControl(file, src);
  checkUnnamedFocus(file, src);
  checkTooltipContent(file, src);
  checkMenuKeys(file, src);
}

// ------------------------------------------------------------------ report
const ORDER = [
  'diagramalt', 'focusrole', 'modaltrap', 'danglingid', 'focusring', 'inputring', 'unnamedcontrol',
  'unnamedfocus', 'placeholder', 'controlborder', 'tooltipcontent', 'menukeys',
];
const LABEL = {
  diagramalt: 'Mermaid diagram with no text alternative (WCAG 2.2 §1.1.1)',
  focusrole: 'Non-operable role holding tabIndex (WCAG 2.2 §4.1.2)',
  modaltrap: 'aria-modal with no focus trap or inert background',
  danglingid: 'aria reference resolving to no element (WCAG 2.2 §4.1.2)',
  focusring: 'outline removed with no :focus-visible outline (WCAG 2.2 §2.4.7)',
  inputring: 'Form control outline removed with no :focus-visible outline (WCAG 2.2 §2.4.7)',
  unnamedcontrol: 'Icon-only button with no accessible name (WCAG 2.2 §4.1.2)',
  unnamedfocus: 'Generic element in the Tab order with no role or name (WCAG 2.2 §4.1.2)',
  placeholder: 'Placeholder text in --fg-4 or --fg-5 (WCAG 2.2 §1.4.3)',
  controlborder: 'Form control bordered with a hairline, not --rule-control (WCAG 2.2 §1.4.11)',
  tooltipcontent: 'Link or button inside a role="tooltip" (WCAG 2.2 §2.1.1)',
  menukeys: 'role="menu" with no arrow-key handling (WCAG 2.2 §2.1.1)',
};

// modaltrap warns rather than fails, following the discipline guard's handling
// of `greek`. It is the one check here that reads a whole file for evidence
// rather than an element for structure, so a trap living in an imported hook
// reads as absent. A heuristic that blocks a pipeline is a heuristic somebody
// switches off; one that reports is one somebody acts on.
const ADVISORY = new Set(['modaltrap', 'menukeys']);

console.log(`\ncheck-a11y — ${relative(process.cwd(), APP) || APP}  (${files.length} files)\n`);
let hard = 0;
for (const check of ORDER) {
  const hits = findings.filter((f) => f.check === check);
  if (hits.length === 0) { console.log(`  ok    ${check.padEnd(14)} ${LABEL[check]}`); continue; }
  const isHard = !ADVISORY.has(check);
  if (isHard) hard += hits.length;
  console.log(`  ${isHard ? 'FAIL' : 'warn'}  ${check.padEnd(14)} ${hits.length} — ${LABEL[check]}`);
  if (QUIET) continue;
  const shown = hits.slice(0, 12);
  for (const h of shown) console.log(`          ${h.file}:${h.line}  ${h.note}\n            ${h.text}`);
  if (hits.length > shown.length) console.log(`          … and ${hits.length - shown.length} more`);
  if (check === 'modaltrap' || check === 'menukeys') {
    console.log('          note  read one file at a time; a trap or a key handler in an imported hook reads as absent.');
  }
}

if (process.argv.includes('--by-file')) {
  const tally = new Map();
  for (const f of findings) {
    const k = `${f.check}  ${f.file}`;
    tally.set(k, (tally.get(k) ?? 0) + 1);
  }
  console.log('\n  by file:');
  for (const [k, n] of [...tally.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20)) {
    console.log(`    ${String(n).padStart(4)}  ${k}`);
  }
}

console.log(`\n  ${hard === 0 ? 'PASS' : `${hard} violation(s)`}\n`);
process.exit(hard === 0 ? 0 : 1);
