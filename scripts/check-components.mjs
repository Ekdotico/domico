#!/usr/bin/env node
/**
 * The shared components and the accessibility helpers, against a real DOM.
 *
 * Everything asserted here is a name, a role, an attribute, or where focus
 * goes — and none of it can be read off source text. `check-a11y` reads a
 * consumer's source for the shapes a static read can decide; this renders the
 * package's own components and runs its own helpers, which is the only way to
 * know that a caption names its table's tab stop or that closing a modal
 * surface puts focus back on the trigger.
 *
 * Development-only, for the reason `check-svg` is: jsdom is a devDependency of
 * this repository and is absent from a consumer's node_modules, so
 * `ekdotico-check` refuses this guard with a reason rather than offering it and
 * failing on a missing import.
 */

import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

// --- a document, installed before React is imported -------------------------
// react-dom reads `window` and `document` when it loads, and the helpers test
// `instanceof HTMLElement` against whichever constructor is global. Both have
// to be jsdom's, so the globals go in first and React comes in after.
const dom = new JSDOM('<!doctype html><html><body></body></html>', {
  pretendToBeVisual: true,
  url: 'http://localhost/',
});
const { window } = dom;
for (const name of [
  'window', 'document', 'HTMLElement', 'HTMLTableElement', 'HTMLTableSectionElement',
  'Node', 'Element', 'MutationObserver', 'KeyboardEvent', 'getComputedStyle',
  'requestAnimationFrame', 'cancelAnimationFrame', 'HTMLInputElement', 'HTMLButtonElement',
  'MouseEvent', 'Event', 'SVGElement',
]) {
  Object.defineProperty(globalThis, name, {
    value: name === 'window' ? window : window[name],
    configurable: true,
    writable: true,
  });
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// jsdom lays nothing out, so every element reports no box. The Tab cycle skips
// an element with no box — a link inside a collapsed section — so without this
// every stop would be skipped. `data-nobox` marks the one that should be.
window.HTMLElement.prototype.getClientRects = function getClientRects() {
  return this.closest('[data-nobox]') ? [] : [{ width: 1, height: 1 }];
};

// Node 22 ships a global navigator whose platform is the host's. The shortcut
// helpers read it, so each case sets the platform it is about.
const setPlatform = (platform) =>
  Object.defineProperty(globalThis.navigator, 'platform', { value: platform, configurable: true });

const React = await import('react');
const { createRoot } = await import('react-dom/client');
const act = React.act ?? (await import('react-dom/test-utils')).act;
const h = React.createElement;

const { inertOutside, useModalSurface, isShortcut, shortcutLabel } = await import('../dist/src/a11y/index.js');
const {
  Callout, Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell, Tabs, Tab, SkipLink, StickyTableHead,
  AccessGate, GateSubmitButton, NavDrawer, OnThisPage, OpeningSequence, DocMeta,
  Button, TextField, OneTimeCodeField, PasswordField, TextArea, RadioGroup, Checkbox, FormFault, Dialog, Tooltip,
} = await import('../dist/src/components/index.js');
const { AppearanceMenu, ThemeSwitcher } = await import('../dist/src/theme/index.js');

/** Mount into a fresh container; returns it with a rerender and an unmount. */
async function mount(element) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => root.render(element));
  return {
    container,
    rerender: (next) => act(async () => root.render(next)),
    unmount: async () => {
      await act(async () => root.unmount());
      container.remove();
    },
  };
}

const key = (target, init) => {
  const event = new window.KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init });
  target.dispatchEvent(event);
  return event;
};

let cases = 0;
const it = async (name, fn) => {
  try {
    await fn();
    cases++;
  } catch (error) {
    error.message = `${name}: ${error.message}`;
    throw error;
  }
};

// --- inertOutside -----------------------------------------------------------
await it('inertOutside', () => {
  document.body.innerHTML = `
    <header id="head"><a href="/">Home</a></header>
    <main id="main">
      <p id="para">Text</p>
      <div id="surface"><button>Inside</button></div>
    </main>
    <div id="backdrop"></div>
    <div id="covered" inert></div>`;
  const $ = (id) => document.getElementById(id);
  const restore = inertOutside($('surface'), [$('backdrop')]);

  // The surface's siblings and its ancestors' siblings, and nothing on the
  // ancestor chain itself — that is what spares a surface nested in the page.
  assert.ok($('head').hasAttribute('inert'), 'a sibling of an ancestor stayed live');
  assert.ok($('para').hasAttribute('inert'), 'a sibling of the surface stayed live');
  assert.ok(!$('main').hasAttribute('inert'), 'the surface’s own ancestor was inerted');
  assert.ok(!$('surface').hasAttribute('inert'), 'the surface was inerted');
  assert.ok(!$('backdrop').hasAttribute('inert'), 'a kept element was inerted');

  restore();
  assert.ok(!$('head').hasAttribute('inert') && !$('para').hasAttribute('inert'), 'restore left the page inert');
  // Somebody else's inert is somebody else's to release.
  assert.ok($('covered').hasAttribute('inert'), 'restore released an element it did not inert');
  document.body.innerHTML = '';
});

// --- shortcuts --------------------------------------------------------------
await it('isShortcut and shortcutLabel', () => {
  const ev = (init) => new window.KeyboardEvent('keydown', init);

  setPlatform('MacIntel');
  assert.deepEqual(shortcutLabel('k'), { label: '⌘K', aria: 'Meta+K' });
  assert.ok(isShortcut(ev({ key: 'k', code: 'KeyK', metaKey: true }), 'k'));
  // Each platform answers to its own chord alone: Ctrl+K deletes to the end
  // of the line in a macOS text field and must be left to it.
  assert.ok(!isShortcut(ev({ key: 'k', code: 'KeyK', ctrlKey: true }), 'k'), 'Ctrl+K taken on a Mac');
  // A Greek layout types κ at the K position; the physical key still counts.
  assert.ok(isShortcut(ev({ key: 'κ', code: 'KeyK', metaKey: true }), 'k'), 'the Greek layout missed');
  // But a Latin letter elsewhere is that letter, not K.
  assert.ok(!isShortcut(ev({ key: 'x', code: 'KeyK', metaKey: true }), 'k'), 'a remapped letter matched by position');
  assert.ok(!isShortcut(ev({ key: 'k', code: 'KeyK', metaKey: true, shiftKey: true }), 'k'), 'Shift did not disqualify');

  setPlatform('Win32');
  assert.deepEqual(shortcutLabel('k'), { label: 'Ctrl+K', aria: 'Control+K' });
  assert.ok(isShortcut(ev({ key: 'K', code: 'KeyK', ctrlKey: true }), 'k'));
  assert.ok(!isShortcut(ev({ key: 'k', code: 'KeyK', metaKey: true }), 'k'), 'Meta+K taken off Apple');
  assert.ok(isShortcut(ev({ key: '/', code: 'Slash', ctrlKey: true }), '/'), 'a non-letter key missed');
});

// --- useModalSurface --------------------------------------------------------
await it('useModalSurface', async () => {
  let closed = 0;
  function Harness({ open }) {
    const surface = React.useRef(null);
    const trigger = React.useRef(null);
    const [isOpen, setOpen] = React.useState(open);
    React.useEffect(() => setOpen(open), [open]);
    useModalSurface({
      open: isOpen,
      surfaceRef: surface,
      triggerRef: trigger,
      lockScroll: true,
      onClose: () => {
        closed++;
        setOpen(false);
      },
    });
    return h(
      'div',
      null,
      h('button', { ref: trigger, id: 'trigger' }, 'Open'),
      h('a', { href: '/elsewhere', id: 'behind' }, 'Behind'),
      h(
        'div',
        { ref: surface, id: 'surface', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Menu', tabIndex: -1 },
        h('button', { id: 'first' }, 'First'),
        h('button', { id: 'last' }, 'Last'),
        h('div', { 'data-nobox': '' }, h('a', { href: '/collapsed', id: 'collapsed' }, 'Collapsed')),
      ),
    );
  }

  const view = await mount(h(Harness, { open: false }));
  const $ = (id) => document.getElementById(id);
  $('trigger').focus();

  await view.rerender(h(Harness, { open: true }));
  assert.equal(document.activeElement?.id, 'first', 'focus did not move into the surface');
  assert.ok($('trigger').hasAttribute('inert') && $('behind').hasAttribute('inert'), 'the page behind stayed live');
  assert.equal(document.body.style.overflow, 'hidden', 'lockScroll did not lock');

  // The cycle, both ways. `collapsed` has no box, so `last` is the last stop.
  $('last').focus();
  let event = key($('last'), { key: 'Tab' });
  assert.ok(event.defaultPrevented && document.activeElement?.id === 'first', 'Tab left the last stop');
  event = key($('first'), { key: 'Tab', shiftKey: true });
  assert.ok(event.defaultPrevented && document.activeElement?.id === 'last', 'Shift+Tab left the first stop');
  // A chord is the browser's, not the cycle's.
  event = key($('last'), { key: 'Tab', ctrlKey: true });
  assert.ok(!event.defaultPrevented, 'Ctrl+Tab was taken from the browser');

  await act(async () => {
    key($('first'), { key: 'Escape' });
  });
  assert.equal(closed, 1, 'Escape did not call onClose');
  assert.ok(!$('trigger').hasAttribute('inert') && !$('behind').hasAttribute('inert'), 'closing left the page inert');
  assert.equal(document.activeElement?.id, 'trigger', 'focus did not return to the trigger');
  assert.equal(document.body.style.overflow, '', 'closing left the page scroll-locked');

  await view.unmount();
});

// --- Callout ----------------------------------------------------------------
await it('Callout', async () => {
  const view = await mount(
    h('div', null, h(Callout, { type: 'tip', title: 'Before you start' }, 'Body'), h(Callout, { type: 'danger' }, 'Body')),
  );
  const [titled, untitled] = view.container.querySelectorAll('.callout');
  // Every type is a note — a bare aside is an unnamed complementary landmark.
  assert.equal(titled.getAttribute('role'), 'note');
  assert.equal(untitled.getAttribute('role'), 'note');
  const ref = titled.getAttribute('aria-labelledby');
  assert.ok(ref, 'a titled callout is not named by its title');
  assert.equal(document.getElementById(ref)?.textContent, 'Before you start');
  assert.ok(!untitled.hasAttribute('aria-labelledby'), 'an untitled callout points at nothing');
  await view.unmount();
});

// --- Table ------------------------------------------------------------------
await it('Table', async () => {
  const body = h(TableHead, null, h(TableRow, null, h(TableHeaderCell, null, 'Name')));
  const view = await mount(
    h(
      'div',
      null,
      h(Table, { caption: 'Risk register' }, body),
      h(Table, { label: 'Stakeholders', caption: 'Shown' }, body),
      h(Table, { 'aria-label': 'Requirements' }, body),
      h(Table, { label: 'Wrapper', 'aria-label': 'Grid' }, body),
      h(Table, null, body),
    ),
  );
  const [captioned, labelled, moved, distinct, bare] = view.container.querySelectorAll('.tbl-wrap');

  // The caption names the tab stop, and is drawn as the caption row.
  const ref = captioned.getAttribute('aria-labelledby');
  assert.equal(document.getElementById(ref)?.textContent, 'Risk register');
  assert.ok(document.getElementById(ref)?.classList.contains('tbl-caption'));
  assert.ok(!captioned.hasAttribute('aria-label'));
  assert.ok(!captioned.querySelector('table').hasAttribute('aria-label'), 'the table repeats the wrapper’s name');

  assert.equal(labelled.getAttribute('aria-label'), 'Stakeholders', 'label did not override the caption');
  assert.ok(!labelled.hasAttribute('aria-labelledby'));

  // An aria-label passed for the table names the wrapper, and is not repeated.
  assert.equal(moved.getAttribute('aria-label'), 'Requirements');
  assert.ok(!moved.querySelector('table').hasAttribute('aria-label'), 'the aria-label was copied, not moved');

  // One that differs from the wrapper's name stays where it was put.
  assert.equal(distinct.getAttribute('aria-label'), 'Wrapper');
  assert.equal(distinct.querySelector('table').getAttribute('aria-label'), 'Grid');

  assert.equal(bare.getAttribute('aria-label'), 'Table');
  for (const wrap of [captioned, labelled, moved, distinct, bare]) {
    assert.equal(wrap.getAttribute('role'), 'group');
    assert.equal(wrap.getAttribute('tabindex'), '0');
  }
  await view.unmount();
});

// --- Tabs -------------------------------------------------------------------
await it('Tabs', async () => {
  const view = await mount(
    h('div', null,
      h(Tabs, { label: 'Views' }, h(Tab, { label: 'One' }, 'a'), h(Tab, { label: 'Two' }, 'b')),
      h(Tabs, null, h(Tab, { label: 'One' }, 'a')),
    ),
  );
  const [named, unnamed] = view.container.querySelectorAll('[role="tablist"]');
  assert.equal(named.getAttribute('aria-label'), 'Views');
  assert.ok(!unnamed.hasAttribute('aria-label'), 'an unlabelled tab list invented a name');
  await view.unmount();
});

// --- SkipLink ---------------------------------------------------------------
await it('SkipLink', async () => {
  const view = await mount(h('div', null, h(SkipLink), h(SkipLink, { target: 'main' }, 'Skip to the results')));
  const [plain, custom] = view.container.querySelectorAll('a');
  assert.equal(plain.getAttribute('href'), '#main-content');
  assert.equal(plain.textContent, 'Skip to main content');
  assert.equal(plain.className, 'skip-link');
  assert.equal(custom.getAttribute('href'), '#main');
  assert.equal(custom.textContent, 'Skip to the results');
  await view.unmount();
});

// --- DocMeta ----------------------------------------------------------------
await it('DocMeta states both values, and says which one is missing', async () => {
  const view = await mount(
    h('div', null,
      h(DocMeta, { version: '1.2', updated: '2026-09-30' }),
      h(DocMeta, { version: '1.0' }),
      h(DocMeta, { updated: '30/09/2026' }),
    ),
  );
  const [full, noDate, badDate] = view.container.querySelectorAll('p');
  assert.equal(full.textContent, 'Version 1.2 · Last updated 2026-09-30');
  assert.equal(full.className, 'doc-meta');
  assert.equal(full.querySelector('time')?.getAttribute('dateTime'), '2026-09-30');
  assert.equal(noDate.textContent, 'Version 1.0 · Last updated unknown');
  assert.ok(noDate.classList.contains('doc-meta--incomplete'), 'a missing date rendered as complete');
  assert.ok(!noDate.querySelector('time'), 'a missing date still rendered a <time>');
  // Anything but YYYY-MM-DD is treated as missing, not echoed.
  assert.equal(badDate.textContent, 'Version unset · Last updated unknown');
  // The separator is decoration; the label stays in the text at every width.
  assert.equal(full.querySelector('[aria-hidden="true"]')?.textContent, ' · ');
  assert.equal(full.querySelector('.doc-meta-label')?.textContent, 'Last updated ');
  await view.unmount();
});

// --- The theme group's name -------------------------------------------------
await it('AppearanceMenu names the theme group by its visible label', async () => {
  const view = await mount(h('div', null, h(AppearanceMenu), h(ThemeSwitcher)));
  const groups = view.container.querySelectorAll('.theme-switcher[role="radiogroup"]');
  const inMenu = groups[0];
  const ref = inMenu.getAttribute('aria-labelledby');
  assert.ok(ref, 'the theme group inside the menu is not named by the label beside it');
  assert.equal(document.getElementById(ref)?.textContent, 'Theme');
  assert.ok(!inMenu.hasAttribute('aria-label'), 'the group carries two names');
  // Standalone, it still names itself.
  assert.equal(groups[1].getAttribute('aria-label'), 'Colour theme');
  await view.unmount();
});

// --- StickyTableHead --------------------------------------------------------
await it('StickyTableHead', async () => {
  let narrow = true;
  const listeners = new Set();
  window.matchMedia = () => ({
    get matches() { return narrow; },
    addEventListener: (_type, fn) => listeners.add(fn),
    removeEventListener: (_type, fn) => listeners.delete(fn),
  });

  const table = h(
    Table,
    { caption: 'Risks' },
    h(TableHead, null, h(TableRow, null, h(TableHeaderCell, { id: 'col-name' }, 'Name'))),
    h(TableBody, null, h(TableRow, null, h(TableCell, null, 'Value'))),
  );
  const view = await mount(h('div', null, h(StickyTableHead), table));
  const clones = () => document.querySelectorAll('.tbl-sticky-clone');

  // One mirror per table — the mirror carries .tbl-wrap too, and must not be
  // mirrored in turn when the observer sees it arrive.
  await act(async () => {});
  assert.equal(clones().length, 1, `expected one mirror, found ${clones().length}`);
  const clone = clones()[0];
  assert.equal(clone.getAttribute('aria-hidden'), 'true');
  assert.ok(clone.hasAttribute('inert'), 'the mirror can take focus');
  assert.equal(document.querySelectorAll('#col-name').length, 1, 'the mirror duplicated an id');
  assert.ok(clone.querySelector('thead th'), 'the mirror has no header');

  // A table added after mount is picked up.
  await view.rerender(h('div', null, h(StickyTableHead), table, table));
  await act(async () => {});
  assert.equal(clones().length, 2, 'a table added after mount was not mirrored');

  // Leaving the narrow range tears every mirror down.
  narrow = false;
  await act(async () => listeners.forEach((fn) => fn({ matches: false })));
  assert.equal(clones().length, 0, 'the mirrors outlived the narrow viewport');

  narrow = true;
  await act(async () => listeners.forEach((fn) => fn({ matches: true })));
  assert.equal(clones().length, 2);
  await view.unmount();
  assert.equal(clones().length, 0, 'unmounting left mirrors in the document');
});

// --- AccessGate --------------------------------------------------------------
// Elements are compared with assert.ok rather than assert.equal throughout the
// cases below: a failing equal inspects both sides for its message, and
// inspecting a jsdom element walks the whole window, which exhausts memory
// before it prints anything.
await it('AccessGate', async () => {
  const gate = (extra) =>
    h(AccessGate, { title: 'Enter the access code', lede: 'Restricted.', action: '/unlock', from: '/next', ...extra });

  // A wrong code: the field is invalid and described by the message on screen.
  let view = await mount(gate({ digits: 6, error: 'The access code is incorrect.' }));
  const $ = (sel) => view.container.querySelector(sel);
  assert.ok($('main'), 'the gate renders no main landmark');
  assert.ok(!$('[role="dialog"]') && !$('[aria-modal]'), 'the gate claims to be a dialog');
  let input = $('input[name="code"]');
  assert.equal(document.querySelector(`label[for="${input.id}"]`)?.textContent, 'Access code');
  assert.equal(input.getAttribute('inputmode'), 'numeric');
  assert.equal(input.getAttribute('autocomplete'), 'one-time-code');
  assert.equal(input.getAttribute('pattern'), '[0-9]{6}');
  assert.equal(input.getAttribute('maxlength'), '6');
  assert.equal(input.getAttribute('aria-invalid'), 'true');
  let described = document.getElementById(input.getAttribute('aria-describedby'));
  assert.equal(described?.textContent, 'The access code is incorrect.');
  assert.equal(described?.getAttribute('role'), 'alert');
  assert.equal($('input[name="from"]')?.value, '/next');
  await view.unmount();

  // A rate limit: described by the notice, and the field is not judged. With
  // both passed, the code was never checked, so the error does not render.
  view = await mount(gate({ error: 'Incorrect.', notice: 'The limit has been reached. Try again in about a minute.' }));
  input = view.container.querySelector('input[name="code"]');
  described = document.getElementById(input.getAttribute('aria-describedby'));
  assert.equal(described?.textContent, 'The limit has been reached. Try again in about a minute.',
    'the rendered notice is not what the field names');
  assert.ok(!input.hasAttribute('aria-invalid'), 'a rate limit marked the code invalid');
  assert.equal(view.container.querySelectorAll('[role="alert"]').length, 1);
  assert.equal(input.getAttribute('pattern'), '[0-9]{4}', 'the default is not four digits');
  await view.unmount();

  // Nothing to say: nothing named.
  view = await mount(gate({ idPrefix: 'research' }));
  input = view.container.querySelector('input[name="code"]');
  assert.equal(input.id, 'research-code');
  assert.ok(!input.hasAttribute('aria-describedby') && !input.hasAttribute('aria-invalid'));
  await view.unmount();
});

// --- GateSubmitButton ---------------------------------------------------------
await it('GateSubmitButton', async () => {
  const view = await mount(h(GateSubmitButton, { pending: true }));
  const button = view.container.querySelector('button');
  // Focusable while in flight: `disabled` would drop focus to <body>.
  assert.ok(!button.disabled, 'the pending button is disabled, which drops focus');
  assert.equal(button.getAttribute('aria-disabled'), 'true');
  assert.equal(button.getAttribute('aria-busy'), 'true');
  assert.equal(button.textContent, 'Checking the code…');
  button.focus();
  const click = new window.MouseEvent('click', { bubbles: true, cancelable: true });
  await act(async () => button.dispatchEvent(click));
  assert.ok(click.defaultPrevented, 'a second press was not refused');
  assert.ok(document.activeElement === button, 'focus left the button');

  await view.rerender(h(GateSubmitButton, { pending: false }, 'Continue'));
  assert.ok(!button.hasAttribute('aria-disabled'));
  assert.equal(button.textContent, 'Continue');
  const again = new window.MouseEvent('click', { bubbles: true, cancelable: true });
  await act(async () => button.dispatchEvent(again));
  assert.ok(!again.defaultPrevented, 'a press at rest was refused');
  await view.unmount();
});

// --- NavDrawer ------------------------------------------------------------------
await it('NavDrawer', async () => {
  window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
  const page = (key) =>
    h('div', null,
      h('a', { href: '/behind', id: 'behind' }, 'Behind'),
      h(NavDrawer, { label: 'Site navigation', closeKey: key },
        h('nav', null, h('a', { href: '/one', id: 'one' }, 'One'))),
    );
  const view = await mount(page('/a'));
  const trigger = view.container.querySelector('.mobile-nav-trigger');
  const drawer = view.container.querySelector('[role="dialog"]');
  const $ = (id) => document.getElementById(id);

  assert.equal(trigger.getAttribute('aria-label'), 'Open navigation menu');
  assert.equal(trigger.getAttribute('aria-controls'), drawer.id);
  assert.equal(drawer.getAttribute('aria-label'), 'Site navigation');
  assert.ok(drawer.hasAttribute('inert'), 'the closed drawer is reachable');

  trigger.focus();
  await act(async () => trigger.click());
  assert.equal(trigger.getAttribute('aria-expanded'), 'true');
  assert.ok(!drawer.hasAttribute('inert'), 'the open drawer is inert');
  assert.ok(drawer.contains(document.activeElement), 'focus did not move into the drawer');
  assert.ok($('behind').hasAttribute('inert'), 'the page behind the drawer stayed live');
  assert.ok(!view.container.querySelector('.mobile-nav-backdrop').hasAttribute('inert'), 'the backdrop was inerted');

  await act(async () => {
    key(document.activeElement, { key: 'Escape' });
  });
  assert.equal(trigger.getAttribute('aria-expanded'), 'false');
  assert.ok(drawer.hasAttribute('inert'));
  assert.ok(!$('behind').hasAttribute('inert'), 'closing left the page inert');
  assert.ok(document.activeElement === trigger, 'focus did not return to the trigger');

  // A change of route closes it; the first render is not a change.
  await act(async () => trigger.click());
  await view.rerender(page('/b'));
  assert.equal(trigger.getAttribute('aria-expanded'), 'false', 'a new closeKey left the drawer open');
  await view.unmount();

  // Controlled: the drawer asks, and the owner decides.
  const asked = [];
  const controlled = await mount(
    h(NavDrawer, { label: 'Menu', open: true, onOpenChange: (v) => asked.push(v) }, h('a', { href: '/x' }, 'X')),
  );
  const closeButton = controlled.container.querySelector('.mobile-nav-close');
  assert.equal(closeButton.getAttribute('aria-label'), 'Close navigation menu');
  await act(async () => closeButton.click());
  assert.deepEqual(asked, [false]);
  assert.equal(controlled.container.querySelector('.mobile-nav-trigger').getAttribute('aria-expanded'), 'true',
    'a controlled drawer closed itself');
  await controlled.unmount();
});

// --- OnThisPage -----------------------------------------------------------------
await it('OnThisPage', async () => {
  const observed = [];
  let report = null;
  globalThis.IntersectionObserver = class {
    constructor(callback) { report = callback; }
    observe(el) { observed.push(el); }
    disconnect() {}
  };
  const wait = () => act(async () => new Promise((resolve) => setTimeout(resolve, 60)));

  const article = document.createElement('article');
  article.className = 'content-inner';
  article.innerHTML = `
    <h2 id="scope">Scope</h2>
    <h3>Terms</h3>
    <h2>Risks <span class="badge badge-warn">Draft</span></h2>
    <h2>Terms</h2>
    <h2 id="terms-1">Taken</h2>`;
  document.body.appendChild(article);

  const view = await mount(h(OnThisPage, { root: '.content-inner', rescanKey: 1 }));
  await wait();
  const nav = view.container.querySelector('nav');
  assert.ok(nav, 'the rail is not a nav');
  assert.equal(document.getElementById(nav.getAttribute('aria-labelledby'))?.textContent, 'On this page');

  const links = [...nav.querySelectorAll('a')];
  const hrefs = links.map((a) => a.getAttribute('href'));
  // A real id is read; made-up ones are de-duplicated against the document,
  // including an id a later heading already carries.
  assert.equal(hrefs[0], '#scope');
  assert.equal(new Set(hrefs).size, hrefs.length, `two entries share an id: ${hrefs.join(' ')}`);
  for (const href of hrefs) assert.equal(document.querySelectorAll(href).length, 1, `${href} is not one element`);
  assert.equal(nav.querySelectorAll('li.otp-l3').length, 1, 'the h3 is not a second-level entry');

  // The badge keeps its classes and leaves the name to the heading's text.
  const risks = links[2];
  assert.ok(risks.querySelector('.badge.badge-warn[aria-hidden="true"]'), 'the badge was flattened');
  assert.equal(risks.getAttribute('aria-label'), 'Risks Draft');

  assert.ok(!nav.querySelector('[aria-current]'));
  assert.equal(observed.length, links.length);
  await act(async () => report([{ isIntersecting: true, target: observed[2], boundingClientRect: { top: 10 } }]));
  assert.equal(risks.getAttribute('aria-current'), 'location', 'the heading being read is not marked');
  assert.equal(nav.querySelectorAll('[aria-current]').length, 1);

  // A new route: the rail reads the new page.
  article.innerHTML = '<h2 id="only">Only</h2>';
  await view.rerender(h(OnThisPage, { root: '.content-inner', rescanKey: 2 }));
  await wait();
  assert.deepEqual([...view.container.querySelectorAll('nav a')].map((a) => a.getAttribute('href')), ['#only']);

  article.innerHTML = '';
  await view.rerender(h(OnThisPage, { root: '.content-inner', rescanKey: 3 }));
  await wait();
  assert.ok(!view.container.querySelector('nav'), 'an empty rail rendered');
  await view.unmount();
  article.remove();
  delete globalThis.IntersectionObserver;
});

// --- OpeningSequence ------------------------------------------------------------
await it('OpeningSequence', async () => {
  let reduce = true;
  window.matchMedia = (q) => ({ matches: q.includes('reduced-motion') && reduce, addEventListener() {}, removeEventListener() {} });
  window.sessionStorage.clear();
  // A short sequence, read back through the computed animation as the
  // component reads the stylesheet's.
  const style = document.createElement('style');
  style.textContent = '.opening-sequence.is-playing { animation-delay: 20ms; animation-duration: 20ms; }';
  document.head.appendChild(style);
  const tree = () => h('div', null, h(OpeningSequence), h('a', { href: '/page', id: 'page' }, 'Page'));

  // Reduced motion: nothing is painted, nothing is covered, nothing is remembered.
  let view = await mount(tree());
  assert.ok(!view.container.querySelector('.opening-sequence'), 'the sequence rendered under reduced motion');
  assert.ok(!document.getElementById('page').hasAttribute('inert'));
  assert.equal(window.sessionStorage.getItem('ekd:intro-shown'), null);
  await view.unmount();

  reduce = false;
  view = await mount(tree());
  const overlay = view.container.querySelector('.opening-sequence');
  assert.equal(overlay?.getAttribute('aria-hidden'), 'true');
  assert.ok(overlay.classList.contains('is-covering'));
  assert.ok(document.getElementById('page').hasAttribute('inert'), 'the covered page is reachable');
  assert.equal(overlay.querySelector('path')?.getAttribute('pathLength'), '1');
  assert.equal(window.sessionStorage.getItem('ekd:intro-shown'), '1');
  // The font wait is capped at 400ms, and the sequence then runs 40ms.
  await act(async () => new Promise((resolve) => setTimeout(resolve, 600)));
  assert.ok(!view.container.querySelector('.opening-sequence'), 'the overlay outlived its sequence');
  assert.ok(!document.getElementById('page').hasAttribute('inert'), 'the page stayed inert');
  await view.unmount();

  // Once per session.
  view = await mount(tree());
  assert.ok(!view.container.querySelector('.opening-sequence'), 'the sequence played twice in a session');
  await view.unmount();

  // Released once: the unmount does not release what another surface — an
  // open drawer — has inerted since the sequence ended.
  window.sessionStorage.clear();
  const outside = document.createElement('p');
  document.body.appendChild(outside);
  view = await mount(tree());
  assert.ok(outside.hasAttribute('inert'), 'the page outside the layout is reachable');
  await act(async () => new Promise((resolve) => setTimeout(resolve, 600)));
  assert.ok(!outside.hasAttribute('inert'));
  outside.setAttribute('inert', '');
  await view.unmount();
  assert.ok(outside.hasAttribute('inert'), 'unmounting released an inert it no longer owned');
  outside.remove();
  style.remove();
});

// --- Button ---------------------------------------------------------------------
await it('Button', async () => {
  let pressed = 0;
  const view = await mount(h(Button, { onClick: () => pressed++ }, 'Cancel'));
  const button = view.container.querySelector('button');
  // Not the platform's default: a button dropped into a form must not submit it.
  assert.equal(button.getAttribute('type'), 'button');
  assert.equal(button.className, 'ekd-button');
  assert.equal(button.getAttribute('data-variant'), 'secondary');
  assert.ok(!button.hasAttribute('aria-live'), 'a button with no pending label is a live region');
  await act(async () => button.click());
  assert.equal(pressed, 1);

  await view.rerender(
    h(Button, { variant: 'primary', type: 'submit', pending: true, pendingLabel: 'Signing in…', onClick: () => pressed++ }, 'Sign in'),
  );
  assert.equal(button.getAttribute('data-variant'), 'primary');
  assert.equal(button.getAttribute('type'), 'submit');
  assert.ok(!button.disabled, 'the pending button is disabled, which drops focus');
  assert.equal(button.getAttribute('aria-disabled'), 'true');
  assert.equal(button.getAttribute('aria-busy'), 'true');
  assert.equal(button.getAttribute('aria-live'), 'polite');
  assert.equal(button.textContent, 'Signing in…');
  const click = new window.MouseEvent('click', { bubbles: true, cancelable: true });
  await act(async () => button.dispatchEvent(click));
  assert.ok(click.defaultPrevented, 'a press in flight was not refused');
  assert.equal(pressed, 1, 'a press in flight reached the handler');

  // In flight with no label of its own: the label stays.
  await view.rerender(h(Button, { pending: true }, 'Save'));
  assert.equal(button.textContent, 'Save');
  await view.unmount();
});

// --- The fields -------------------------------------------------------------------
await it('TextField and OneTimeCodeField', async () => {
  const view = await mount(
    h('div', null,
      h(TextField, { id: 'email', name: 'email', type: 'email', label: 'Email address', autoComplete: 'username',
        required: true, hint: 'The address of the account.', error: 'Enter an email address.' }),
      h(TextField, { name: 'name', label: 'Name', disabled: true }),
      h(OneTimeCodeField, { id: 'code', name: 'code', label: 'Code' }),
      h(OneTimeCodeField, { name: 'short', label: 'Short code', digits: 4 }),
    ),
  );
  const [email, plain, code, short] = view.container.querySelectorAll('input');
  assert.equal(document.querySelector('label[for="email"]')?.textContent, 'Email address');
  assert.equal(email.getAttribute('type'), 'email');
  assert.equal(email.getAttribute('autocomplete'), 'username');
  assert.ok(email.required);
  assert.equal(email.getAttribute('aria-invalid'), 'true');
  // Hint first, then the message, and each id is an element on the page.
  const described = email.getAttribute('aria-describedby').split(' ').map((id) => document.getElementById(id)?.textContent);
  assert.deepEqual(described, ['The address of the account.', 'Enter an email address.']);
  assert.ok(!view.container.querySelector('[role="alert"]'), 'a field message is an alert, beside the form fault');
  assert.ok(!email.hasAttribute('placeholder'));

  // Nothing to say: nothing named. And an id of its own, which its label uses.
  assert.ok(!plain.hasAttribute('aria-describedby') && !plain.hasAttribute('aria-invalid'));
  assert.ok(plain.id && document.querySelector(`label[for="${plain.id}"]`)?.textContent === 'Name');
  assert.ok(plain.disabled);

  assert.equal(view.container.querySelectorAll('input').length, 4, 'a code field is more than one input');
  assert.equal(code.getAttribute('inputmode'), 'numeric');
  assert.equal(code.getAttribute('autocomplete'), 'one-time-code');
  assert.equal(code.getAttribute('pattern'), '[0-9]{6}', 'the default is not six digits');
  assert.equal(code.getAttribute('maxlength'), '6');
  assert.equal(short.getAttribute('pattern'), '[0-9]{4}');
  await view.unmount();
});

await it('PasswordField shows and hides what is typed', async () => {
  const view = await mount(
    h('form', null,
      h(PasswordField, { id: 'password', name: 'password', label: 'Password', toggleLabel: 'Show password',
        autoComplete: 'current-password' })),
  );
  const input = view.container.querySelector('input');
  const toggle = view.container.querySelector('button');
  assert.equal(input.getAttribute('type'), 'password');
  assert.equal(input.getAttribute('autocomplete'), 'current-password');
  // A real button that cannot submit the form, named, with its state.
  assert.equal(toggle.getAttribute('type'), 'button');
  assert.equal(toggle.textContent, 'Show password');
  assert.equal(toggle.getAttribute('aria-pressed'), 'false');
  assert.equal(toggle.getAttribute('aria-controls'), 'password');

  await act(async () => toggle.click());
  assert.equal(input.getAttribute('type'), 'text', 'the toggle did not show the password');
  assert.equal(toggle.getAttribute('aria-pressed'), 'true');
  assert.equal(toggle.textContent, 'Show password', 'the name changed with the state');
  assert.ok(document.getElementById('password') === input, 'the field was replaced, and lost what was typed');

  // Submitting hides it again.
  await act(async () => {
    view.container.querySelector('form').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
  });
  assert.equal(input.getAttribute('type'), 'password', 'the password went to the form as plain text');
  assert.equal(toggle.getAttribute('aria-pressed'), 'false');
  await view.unmount();
});

await it('TextArea counts against a maximum, and announces after typing stops', async () => {
  const remaining = (n) => (n >= 0 ? `${n} characters remaining` : `${-n} characters over the limit`);
  const view = await mount(
    h(TextArea, { id: 'message', name: 'message', label: 'Message', maximum: 10, remainingLabel: remaining }),
  );
  const area = view.container.querySelector('textarea');
  const shown = view.container.querySelector('.ekd-field-count');
  const live = document.getElementById('message-count');
  const type = (text) =>
    act(async () => {
      Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set.call(area, text);
      area.dispatchEvent(new window.Event('input', { bubbles: true }));
    });

  assert.equal(shown.textContent, '10 characters remaining');
  assert.equal(shown.getAttribute('aria-hidden'), 'true');
  assert.equal(live.getAttribute('aria-live'), 'polite');
  assert.ok(area.getAttribute('aria-describedby').split(' ').includes('message-count'));
  // maxlength truncates a paste in silence.
  assert.ok(!area.hasAttribute('maxlength'));

  await type('abcd');
  assert.equal(shown.textContent, '6 characters remaining');
  assert.equal(live.textContent, '10 characters remaining', 'the count was announced on the keystroke');
  await act(async () => new Promise((resolve) => setTimeout(resolve, 1100)));
  assert.equal(live.textContent, '6 characters remaining', 'the count was never announced');

  await type('abcdefghijkl');
  assert.equal(shown.textContent, '2 characters over the limit');
  assert.ok(shown.hasAttribute('data-over'));
  assert.equal(area.getAttribute('aria-invalid'), 'true', 'a message over the maximum is not marked');
  await view.unmount();

  // Without a maximum there is no count and no live region.
  const plain = await mount(h(TextArea, { name: 'note', label: 'Note' }));
  assert.ok(!plain.container.querySelector('[aria-live]') && !plain.container.querySelector('.ekd-field-count'));
  await plain.unmount();
});

await it('RadioGroup and Checkbox', async () => {
  const options = [
    { value: 'problem', label: 'Problem' },
    { value: 'idea', label: 'Idea' },
    { value: 'other', label: 'Other' },
  ];
  const chosen = [];
  const view = await mount(
    h('div', null,
      h(RadioGroup, { id: 'kind', name: 'kind', legend: 'Kind of feedback', options, required: true,
        error: 'Choose a kind.', onChange: (v) => chosen.push(v) }),
      h(RadioGroup, { name: 'other', legend: 'Other', options, defaultValue: 'idea' }),
      h(Checkbox, { id: 'rename', name: 'rename', label: 'Editors can rename the document', error: 'Not available.' }),
    ),
  );
  const [group, preset] = view.container.querySelectorAll('fieldset');
  assert.equal(group.querySelector('legend')?.textContent, 'Kind of feedback');
  const radios = [...group.querySelectorAll('input[type="radio"]')];
  assert.equal(radios.length, 3);
  assert.ok(radios.every((r) => !r.checked), 'an answer was chosen for the reader');
  assert.ok(radios.every((r) => r.name === 'kind' && r.required));
  // The group's id is on a control that can take focus, for the form fault's link.
  assert.ok(document.getElementById('kind') === radios[0]);
  assert.equal(new Set(radios.map((r) => r.id)).size, 3);
  assert.ok(radios.every((r) => r.closest('label')?.textContent), 'a radio has no label');
  assert.equal(document.getElementById(group.getAttribute('aria-describedby'))?.textContent, 'Choose a kind.');
  assert.ok(group.hasAttribute('data-invalid'));
  await act(async () => radios[1].click());
  assert.deepEqual(chosen, ['idea']);
  assert.ok(radios[1].checked);

  assert.deepEqual([...preset.querySelectorAll('input')].map((r) => r.checked), [false, true, false]);
  assert.ok(!preset.hasAttribute('aria-describedby') && !preset.hasAttribute('data-invalid'));

  const box = document.getElementById('rename');
  assert.equal(box.getAttribute('type'), 'checkbox');
  assert.equal(box.closest('label')?.textContent, 'Editors can rename the document');
  assert.equal(box.getAttribute('aria-invalid'), 'true');
  assert.equal(document.getElementById(box.getAttribute('aria-describedby'))?.textContent, 'Not available.');
  await view.unmount();
});

// --- FormFault ------------------------------------------------------------------
await it('FormFault takes focus, and its links move focus to the field', async () => {
  const page = (attempt) =>
    h('div', null,
      h(FormFault, { title: 'The form has one fault', focusKey: attempt,
        faults: [{ fieldId: 'fault-email', message: 'Enter an email address' }] }),
      h(TextField, { id: 'fault-email', name: 'email', label: 'Email address' }),
    );
  const view = await mount(page(1));
  const fault = view.container.querySelector('.ekd-fault');
  assert.equal(fault.getAttribute('role'), 'alert');
  assert.equal(fault.getAttribute('tabindex'), '-1');
  const heading = document.getElementById(fault.getAttribute('aria-labelledby'));
  assert.equal(heading?.textContent, 'The form has one fault');
  assert.equal(heading?.tagName, 'H2');
  assert.ok(document.activeElement === fault, 'focus did not move to the statement');

  const link = fault.querySelector('a');
  assert.equal(link.getAttribute('href'), '#fault-email');
  const click = new window.MouseEvent('click', { bubbles: true, cancelable: true });
  await act(async () => link.dispatchEvent(click));
  assert.ok(document.activeElement === document.getElementById('fault-email'), 'the link left focus behind');
  assert.ok(click.defaultPrevented);

  // A second failed attempt is met from the statement again.
  await view.rerender(page(2));
  assert.ok(document.activeElement === fault, 'a new focusKey did not return focus to the statement');
  await view.unmount();

  // A fault that is about no one field: no list, and focus left alone on request.
  const general = await mount(h(FormFault, { title: 'The request failed', autoFocus: false, headingLevel: 3 }, h('p', null, 'Try again.')));
  assert.ok(!general.container.querySelector('ul'));
  assert.ok(general.container.querySelector('h3'));
  assert.ok(document.activeElement !== general.container.querySelector('.ekd-fault'));
  await general.unmount();
});

// --- Dialog ---------------------------------------------------------------------
// jsdom has no showModal() and no close(). The two below are the least that
// stands in for them, so what this case asserts is the component's own half:
// that it calls them when `open` changes, that Escape asks the application
// rather than closing, and that focus is put back. The platform's half — the
// top layer, the inert page, the Tab cycle — is the browser's and is not
// something a DOM without layout can show.
await it('Dialog opens, asks before it closes, and returns focus', async () => {
  const proto = window.HTMLDialogElement.prototype;
  proto.showModal = function showModal() {
    this.setAttribute('open', '');
    this.querySelector('button, input, textarea, select, a[href]')?.focus();
  };
  proto.close = function close() {
    this.removeAttribute('open');
    this.dispatchEvent(new window.Event('close'));
  };

  let asked = 0;
  const page = (open, extra) =>
    h('div', null,
      h('button', { id: 'opener' }, 'Send feedback'),
      h(Dialog, { open, onClose: () => asked++, title: 'Send feedback', closeLabel: 'Close', ...extra },
        h('input', { id: 'dialog-field' })),
    );
  const view = await mount(page(false));
  const dialog = view.container.querySelector('dialog');
  const opener = document.getElementById('opener');
  assert.ok(!dialog.open);
  assert.ok(!dialog.hasAttribute('aria-modal') && !dialog.hasAttribute('role'), 'the native element restated its role');
  assert.equal(document.getElementById(dialog.getAttribute('aria-labelledby'))?.textContent, 'Send feedback');
  assert.equal(dialog.querySelector('.ekd-dialog-close')?.getAttribute('aria-label'), 'Close');

  opener.focus();
  await view.rerender(page(true));
  assert.ok(dialog.open, 'open did not call showModal()');
  assert.ok(dialog.contains(document.activeElement), 'focus did not move into the dialog');

  // Escape: the application is asked, and the dialog waits for its answer.
  const cancel = new window.Event('cancel', { cancelable: true });
  await act(async () => dialog.dispatchEvent(cancel));
  assert.ok(cancel.defaultPrevented, 'Escape closed the dialog without asking');
  assert.equal(asked, 1, 'Escape did not call onClose');
  assert.ok(dialog.open);

  await act(async () => dialog.querySelector('.ekd-dialog-close').click());
  assert.equal(asked, 2, 'the close button did not call onClose');

  await view.rerender(page(false));
  assert.ok(!dialog.open, 'closing did not call close()');
  assert.ok(document.activeElement === opener, 'focus did not return to the opener');
  assert.equal(asked, 2, 'closing from the application called onClose again');

  // The platform closing it on its own is followed.
  await view.rerender(page(true));
  await act(async () => dialog.close());
  assert.equal(asked, 3, 'a close the application did not make went unreported');

  // Where the application says focus goes, it goes.
  await view.rerender(page(false));
  const field = { current: document.getElementById('dialog-field') };
  await view.rerender(page(true, { initialFocusRef: field, closeLabel: undefined }));
  assert.ok(document.activeElement === field.current, 'initialFocusRef was ignored');
  assert.ok(!dialog.querySelector('.ekd-dialog-close'), 'a close button with no name rendered');

  // Unmounted while open: focus is not left on nothing.
  await view.unmount();
  assert.ok(document.activeElement === opener || !opener.isConnected);
  delete proto.showModal;
  delete proto.close;
});

// --- Tooltip --------------------------------------------------------------------
await it('Tooltip shows on hover and on focus, and Escape dismisses it', async () => {
  const view = await mount(
    h('div', null,
      h(Tooltip, { id: 'tip', content: 'Created without provenance recording.' }, 'Not recorded'),
      h(Tooltip, { content: 'Opens the list of past versions' }, h(Button, { 'aria-describedby': 'other' }, 'History')),
      h('button', { id: 'elsewhere' }, 'Elsewhere'),
    ),
  );
  const [wrapper, wrapped] = view.container.querySelectorAll('.ekd-tooltip');
  const trigger = wrapper.querySelector('button');
  const tip = document.getElementById('tip');
  const isOpen = () => wrapper.hasAttribute('data-open');
  const mouse = (type, relatedTarget) =>
    act(async () => wrapper.dispatchEvent(new window.MouseEvent(type, { bubbles: true, relatedTarget })));
  const escape = async () => {
    let event;
    await act(async () => {
      event = key(document.activeElement ?? document.body, { key: 'Escape' });
    });
    return event;
  };

  // Text alone gets a trigger that takes focus, described by the tooltip.
  assert.equal(trigger.getAttribute('type'), 'button');
  assert.equal(trigger.textContent, 'Not recorded');
  assert.equal(trigger.getAttribute('aria-describedby'), 'tip');
  assert.equal(tip.getAttribute('role'), 'tooltip');
  assert.ok(wrapper.contains(tip), 'the content is outside the element the pointer is tracked on');
  // An element is described in place, and keeps the description it had.
  const history = wrapped.querySelector('button');
  assert.equal(wrapped.querySelectorAll('button').length, 1, 'a control was wrapped in a second control');
  assert.equal(history.getAttribute('aria-describedby'), `other ${wrapped.querySelector('[role="tooltip"]').id}`);

  // Closed: Escape is not the tooltip's, and is left for whatever encloses it.
  assert.ok(!isOpen());
  assert.ok(!(await escape()).defaultPrevented, 'a closed tooltip took Escape');

  // Hover, then Escape with the pointer still there.
  await mouse('mouseover', document.body);
  assert.ok(isOpen(), 'hover did not show the tooltip');
  assert.ok((await escape()).defaultPrevented, 'Escape reached the dialog behind an open tooltip');
  assert.ok(!isOpen(), 'Escape did not dismiss the tooltip');
  // It stays dismissed until the pointer arrives again.
  await mouse('mouseout', document.body);
  await mouse('mouseover', document.body);
  assert.ok(isOpen(), 'a dismissed tooltip never came back');
  await mouse('mouseout', document.body);
  assert.ok(!isOpen(), 'the tooltip outlived the hover');

  // Focus, then Escape with focus still there.
  await act(async () => trigger.focus());
  assert.ok(isOpen(), 'keyboard focus did not show the tooltip');
  await escape();
  assert.ok(!isOpen() && document.activeElement === trigger, 'Escape moved focus, or left the tooltip up');
  await act(async () => document.getElementById('elsewhere').focus());
  await act(async () => trigger.focus());
  assert.ok(isOpen());
  await act(async () => document.getElementById('elsewhere').focus());
  assert.ok(!isOpen(), 'the tooltip outlived the focus');
  await view.unmount();
});

console.log(`check:components — ${cases} cases: the a11y helpers, and the components' names, roles and focus, against jsdom`);
