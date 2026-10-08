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
  PageHeading, Select, Toolbar, ToolbarSeparator, ToggleButton, MenuButton, SyncStatus, QrCode,
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
  // No length limit, which would cut the last digit off a code pasted in two
  // groups. The pattern is tried the way the platform tries it: anchored, and
  // compiled with the `v` flag, under which an unescaped hyphen in a class is
  // a syntax error and the attribute is silently ignored.
  assert.ok(!code.hasAttribute('maxlength'), 'a pasted "123 456" is truncated');
  const accepts = (input, value) => new RegExp(`^(?:${input.getAttribute('pattern')})$`, 'v').test(value);
  for (const value of ['123456', '123 456', '123-456', '1 2 3 4 5 6']) {
    assert.ok(accepts(code, value), `the code pattern refuses "${value}"`);
  }
  for (const value of ['12345', '1234567', '123  456', '12345a', ' 123456', '123456 ']) {
    assert.ok(!accepts(code, value), `the code pattern accepts "${value}"`);
  }
  assert.ok(accepts(short, '12 34') && !accepts(short, '123456'), 'digits did not set the length');
  await view.unmount();
});

await it('the fields hand their element to a ref', async () => {
  const refs = { text: React.createRef(), code: React.createRef(), area: React.createRef(), box: React.createRef() };
  let password = null;
  const view = await mount(
    h('form', null,
      h(TextField, { ref: refs.text, name: 'a', label: 'A' }),
      h(OneTimeCodeField, { ref: refs.code, name: 'b', label: 'B' }),
      h(TextArea, { ref: refs.area, name: 'c', label: 'C' }),
      h(Checkbox, { ref: refs.box, name: 'd', label: 'D' }),
      // A callback ref, the other form a ref takes. The field keeps a ref of
      // its own to this input, and must not keep it instead of this one.
      h(PasswordField, { ref: (el) => { password = el; }, name: 'e', label: 'E', toggleLabel: 'Show password',
        autoComplete: 'new-password' }),
    ),
  );
  const named = (name) => view.container.querySelector(`[name="${name}"]`);
  assert.ok(refs.text.current === named('a'), 'TextField dropped its ref');
  assert.ok(refs.code.current === named('b'), 'OneTimeCodeField dropped its ref');
  assert.ok(refs.area.current === named('c'), 'TextArea dropped its ref');
  assert.ok(refs.box.current === named('d'), 'Checkbox dropped its ref');
  assert.ok(password === named('e'), 'PasswordField dropped its ref');
  // And still has its own: submitting hides the password again.
  await act(async () => view.container.querySelector('button').click());
  assert.equal(password.getAttribute('type'), 'text');
  await act(async () => {
    view.container.querySelector('form').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
  });
  assert.equal(password.getAttribute('type'), 'password', 'the field lost its own ref to the consumer’s');
  await view.unmount();
  assert.ok(password === null && refs.text.current === null, 'a ref was not released on unmount');
});

await it('a read-only field keeps its value, its focus and its place in the form', async () => {
  const view = await mount(
    h('form', null,
      h(TextField, { id: 'ro-email', name: 'email', type: 'email', label: 'Email address', value: 'reader@example.org',
        readOnly: true, hint: 'It cannot be changed here.' }),
      h(PasswordField, { name: 'secret', label: 'Password', toggleLabel: 'Show password', autoComplete: 'current-password',
        defaultValue: 'x', readOnly: true }),
      h(TextArea, { name: 'note', label: 'Note', defaultValue: 'y', readOnly: true }),
      h(TextField, { name: 'both', label: 'Both', defaultValue: 'z', readOnly: true, disabled: true }),
    ),
  );
  const email = document.getElementById('ro-email');
  // The native attribute, which is what the stylesheet reads and what a screen
  // reader states. Not `disabled`, and not `aria-disabled` standing in for it.
  assert.ok(email.readOnly && email.hasAttribute('readonly'), 'readOnly did not reach the input');
  assert.ok(!email.disabled && !email.hasAttribute('aria-disabled'), 'a read-only field was disabled');
  assert.ok(!email.hasAttribute('aria-readonly'), 'aria-readonly restates the native attribute');
  assert.ok(!email.hasAttribute('tabindex'), 'a read-only field was taken out of the Tab order');
  assert.ok(email.classList.contains('ekd-field-input'));
  assert.equal(document.getElementById(email.getAttribute('aria-describedby'))?.textContent, 'It cannot be changed here.');
  email.focus();
  assert.ok(document.activeElement === email, 'a read-only field did not take focus');
  // Submitted with the form, which a disabled field is not.
  const sent = new window.FormData(view.container.querySelector('form'));
  assert.equal(sent.get('email'), 'reader@example.org');
  assert.ok(!sent.has('both'), 'a disabled field was submitted');
  // The same class and the same attribute on the other fields, so one rule draws all of them.
  for (const name of ['secret', 'note']) {
    const field = view.container.querySelector(`[name="${name}"]`);
    assert.ok(field.readOnly && field.classList.contains('ekd-field-input'), `${name} lost readOnly or its class`);
  }
  await view.unmount();
});

// The state is drawn by one rule, and the rule is read here because jsdom
// applies no stylesheet: the attribute and not `:read-only`, which a disabled
// field also matches; no ground of its own; and a boundary with a shape.
await it('the read-only rule is the attribute, without the inset ground, with a dashed boundary', async () => {
  const { readFileSync } = await import('node:fs');
  const css = readFileSync(new URL('../dist/styles/form.css', import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  const rule = /\.ekd-field-input\[readonly\]:not\(:disabled\)\s*\{([^}]*)\}/.exec(css);
  assert.ok(rule, 'form.css has no read-only rule');
  assert.match(rule[1], /background:\s*transparent/);
  assert.match(rule[1], /border-style:\s*dashed/);
  assert.ok(!/(^|[;\s])color:|border-color:|opacity:/.test(rule[1]), 'the read-only rule changes an ink or fades the field');
  assert.ok(!/:read-only/.test(css), ':read-only also matches a disabled field');
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

await it('FormFault outside a form: the role follows announce, and only an alert takes focus', async () => {
  const before = document.createElement('button');
  document.body.appendChild(before);
  const state = async (props) => {
    before.focus();
    const view = await mount(h(FormFault, { title: 'This invitation is not open', ...props }, h('p', null, 'Ask for a new one.')));
    const fault = view.container.querySelector('.ekd-fault');
    return { view, fault, focused: document.activeElement === fault };
  };

  // Inserted after an action, with nothing said about it: an alert, focused.
  const alert = await state({});
  assert.equal(alert.fault.getAttribute('role'), 'alert');
  assert.ok(alert.focused, 'an alert outside a form did not take focus');
  await alert.view.unmount();

  // Beside a button that keeps focus: still an alert, and focus is left alone.
  const beside = await state({ autoFocus: false });
  assert.equal(beside.fault.getAttribute('role'), 'alert');
  assert.ok(!beside.focused);
  await beside.view.unmount();

  // Polite: a status, named by its heading, and no move of focus.
  const status = await state({ announce: 'polite' });
  assert.equal(status.fault.getAttribute('role'), 'status');
  assert.equal(document.getElementById(status.fault.getAttribute('aria-labelledby'))?.textContent, 'This invitation is not open');
  assert.ok(!status.focused, 'a polite statement moved focus, which is an interruption');
  assert.ok(!status.fault.hasAttribute('aria-live'), 'aria-live restates the role');
  await status.view.unmount();

  // Part of the page as served: no live region, so no role, and so no name,
  // which a block without a role may not take. The heading is how it is found.
  const fixed = await state({ announce: 'off' });
  assert.ok(!fixed.fault.hasAttribute('role') && !fixed.fault.hasAttribute('aria-live'), 'a static statement is a live region');
  assert.ok(!fixed.fault.hasAttribute('aria-labelledby'), 'a block with no role was given a name');
  assert.equal(fixed.fault.querySelector('h2')?.textContent, 'This invitation is not open');
  assert.ok(!fixed.focused, 'a static statement took focus on load');
  assert.ok(!fixed.view.container.querySelector('ul'));
  await fixed.view.unmount();

  // Either default gives way to what was asked for.
  const sent = await state({ announce: 'off', autoFocus: true });
  assert.ok(sent.focused, 'autoFocus was ignored on a statement that is not announced');
  assert.equal(sent.fault.getAttribute('tabindex'), '-1');
  await sent.view.unmount();
  before.remove();
});

// --- PageHeading ----------------------------------------------------------------
// The Greek is written as escapes, as it is in the component: a Greek character
// in a source file is read by check:discipline as text that needs a face.
await it('PageHeading is an h1, and sets a Greek run in the sans by itself', async () => {
  const ALPHA = 'α';
  const WORDS = 'Κλειστό α';
  const TONOS = 'ά';
  const ref = React.createRef();
  const runs = (root) => [...root.querySelectorAll('.ekd-page-heading-greek')].map((span) => span.textContent);

  const view = await mount(h(PageHeading, { ref, id: 'title', tabIndex: -1, className: 'mine' }, 'Account settings'));
  const heading = view.container.querySelector('h1');
  assert.ok(heading && ref.current === heading, 'PageHeading dropped its ref');
  assert.equal(heading.className, 'ekd-page-heading mine');
  assert.equal(heading.id, 'title');
  assert.equal(heading.getAttribute('tabindex'), '-1');
  assert.equal(heading.childElementCount, 0, 'a heading with no Greek was given a span');
  heading.focus();
  assert.ok(document.activeElement === heading, 'the heading could not be sent focus');

  // One letter in a Latin title: one span, and the text is what was passed.
  await view.rerender(h(PageHeading, null, `Closed ${ALPHA}`));
  assert.deepEqual(runs(view.container), [ALPHA]);
  assert.equal(view.container.querySelector('h1').textContent, `Closed ${ALPHA}`);

  // Two Greek words are one run, with the space between them; Latin either
  // side stays out. A separate accent stays with its letter.
  await view.rerender(h(PageHeading, null, `The ${WORDS} notice, ${TONOS}.`));
  assert.deepEqual(runs(view.container), [WORDS, TONOS]);
  assert.equal(view.container.querySelector('h1').textContent, `The ${WORDS} notice, ${TONOS}.`);

  // Several children, and text inside an element the application passed:
  // the element is kept, with its attributes, and its text is read.
  await view.rerender(
    h(PageHeading, { level: 2 }, 'Closed ', ALPHA, ' ', h('span', { lang: 'el', id: 'marked' }, WORDS), 7),
  );
  const second = view.container.querySelector('h2');
  assert.ok(second && !view.container.querySelector('h1'), 'level did not change the element');
  assert.equal(second.className, 'ekd-page-heading', 'level changed the class, and so the size');
  assert.deepEqual(runs(second), [ALPHA, WORDS]);
  const marked = document.getElementById('marked');
  assert.equal(marked?.getAttribute('lang'), 'el');
  assert.ok(marked.querySelector('.ekd-page-heading-greek'), 'Greek inside a passed element was left in the serif');
  assert.equal(second.textContent, `Closed ${ALPHA} ${WORDS}7`);

  // A component's own markup is its own: it is rendered and not rewritten.
  const Own = () => h('em', null, ALPHA);
  await view.rerender(h(PageHeading, null, h(Own)));
  assert.equal(view.container.querySelector('h1 em')?.textContent, ALPHA);
  assert.deepEqual(runs(view.container), []);
  await view.unmount();

  // The class the span carries sets the sans, at the size that brings it to
  // the serif's height, and the heading sets the serif.
  const { readFileSync } = await import('node:fs');
  const css = readFileSync(new URL('../dist/styles/page-heading.css', import.meta.url), 'utf8');
  assert.match(css, /\.ekd-page-heading-greek\s*\{\s*font-family:\s*var\(--font-sans\);\s*font-size:\s*var\(--serif-fit\);?\s*\}/);
  assert.match(css, /\.ekd-page-heading\s*\{[^}]*font-family:\s*var\(--font-serif\)/);
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
  // The event is queued, as the platform queues it: it lands after whatever
  // called close() has finished, and after any effect that ran in between.
  // A stub that fires it inside close() hides exactly the fault this guards.
  proto.close = function close() {
    if (!this.hasAttribute('open')) return;
    this.removeAttribute('open');
    setTimeout(() => this.dispatchEvent(new window.Event('close')), 0);
  };
  const settle = () => act(async () => new Promise((resolve) => setTimeout(resolve, 20)));

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

  // A cancel that bubbled up from inside — a file input's picker, a nested
  // dialog — is not this dialog's Escape.
  const inner = new window.Event('cancel', { bubbles: true, cancelable: true });
  await act(async () => document.getElementById('dialog-field').dispatchEvent(inner));
  assert.ok(!inner.defaultPrevented && asked === 2, 'a cancel from inside the dialog was taken for its own');

  await view.rerender(page(false));
  await settle();
  assert.ok(!dialog.open, 'closing did not call close()');
  assert.ok(document.activeElement === opener, 'focus did not return to the opener');
  assert.equal(asked, 2, 'closing from the application called onClose again');

  // The platform closing it on its own is reported. The application did not
  // answer, so `open` is still true, and the dialog is shown again: a dialog
  // that is closed while its owner says open could never be opened.
  await view.rerender(page(true));
  await act(async () => dialog.close());
  await settle();
  assert.equal(asked, 3, 'a close the application did not make went unreported');
  assert.ok(dialog.open, 'the dialog stayed closed while `open` was true');

  // Where the application says focus goes, it goes. The ref is a new object on
  // every render here, which must not close and reopen the dialog.
  await view.rerender(page(false));
  await settle();
  const target = document.getElementById('dialog-field');
  await view.rerender(page(true, { initialFocusRef: { current: target }, closeLabel: undefined }));
  assert.ok(document.activeElement === target, 'initialFocusRef was ignored');
  assert.ok(!dialog.querySelector('.ekd-dialog-close'), 'a close button with no name rendered');
  await view.rerender(page(true, { initialFocusRef: { current: target }, closeLabel: undefined }));
  await settle();
  assert.ok(dialog.open && asked === 3, 'a new ref object closed the dialog');
  await view.unmount();

  // Mounted already open, under StrictMode, which runs the effect, its
  // cleanup, and the effect again. The cleanup's close() queues an event that
  // arrives after the second run; it is the component's own and says nothing.
  let strict = 0;
  const mounted = await mount(
    h(React.StrictMode, null, h(Dialog, { open: true, onClose: () => strict++, title: 'Delete account' }, h('button', null, 'Cancel'))),
  );
  await settle();
  assert.equal(strict, 0, 'a dialog mounted open asked to be closed');
  assert.ok(mounted.container.querySelector('dialog').open, 'a dialog mounted open is closed');
  await mounted.unmount();
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

  // jsdom answers false to :focus-visible for every element, having no input
  // modality to judge by. This stands in for it: focus is "visible" while the
  // case says the keyboard moved it.
  let keyboard = true;
  const matches = window.Element.prototype.matches;
  window.Element.prototype.matches = function patched(selector) {
    if (selector === ':focus-visible') return keyboard && document.activeElement === this;
    return matches.call(this, selector);
  };
  const elsewhere = document.getElementById('elsewhere');

  // Keyboard focus, then Escape with focus still there.
  await act(async () => trigger.focus());
  assert.ok(isOpen(), 'keyboard focus did not show the tooltip');
  await escape();
  assert.ok(!isOpen() && document.activeElement === trigger, 'Escape moved focus, or left the tooltip up');
  await act(async () => elsewhere.focus());
  await act(async () => trigger.focus());
  assert.ok(isOpen());
  await act(async () => elsewhere.focus());
  assert.ok(!isOpen(), 'the tooltip outlived the focus');

  // The focus a mouse press leaves behind is not a reason to show it: on the
  // application's own control the tooltip goes when the pointer does.
  keyboard = false;
  const historyWrapper = wrapped;
  const over = (type) =>
    act(async () => historyWrapper.dispatchEvent(new window.MouseEvent(type, { bubbles: true, relatedTarget: document.body })));
  await over('mouseover');
  await act(async () => { history.focus(); history.click(); });
  assert.ok(historyWrapper.hasAttribute('data-open'));
  await over('mouseout');
  assert.ok(document.activeElement === history, 'the case lost the focus it is about');
  assert.ok(!historyWrapper.hasAttribute('data-open'), 'the tooltip stayed up on the focus a mouse press left');

  // The package's own trigger, pressed with no hover and no keyboard: a touch
  // in an engine that sends neither. The press shows it, the next hides it.
  await act(async () => elsewhere.focus());
  await act(async () => trigger.click());
  assert.ok(isOpen(), 'a press on the trigger did not show the tooltip');
  await act(async () => trigger.click());
  assert.ok(!isOpen(), 'a second press did not hide it');
  // A touch that does send a hover sends it just before the press, and that
  // press must not close what the hover opened.
  await mouse('mouseover', document.body);
  await act(async () => trigger.click());
  assert.ok(isOpen(), 'the tap that opened the tooltip closed it');
  // A press anywhere else releases it, once the sticky hover has gone too.
  await mouse('mouseout', document.body);
  assert.ok(isOpen(), 'a pinned tooltip left with the pointer');
  await act(async () => elsewhere.dispatchEvent(new window.Event('pointerdown', { bubbles: true })));
  assert.ok(!isOpen(), 'a press elsewhere left the tooltip up');

  window.Element.prototype.matches = matches;
  await view.unmount();
});

// --- The editor's controls ------------------------------------------------------
await it('Callout draws its type as an icon, and the label says it in words', async () => {
  const view = await mount(
    h('div', null,
      h(Callout, { type: 'warning', icon: true, label: 'Warning' }, 'Body'),
      h(Callout, { type: 'tip', icon: true, label: 'Tip', title: 'Before you start' }, 'Body'),
      h(Callout, { type: 'note' }, 'Body'),
    ),
  );
  const [warning, titled, plain] = view.container.querySelectorAll('.callout');
  // The editor's name for the type is kept on the attribute the stylesheet reads.
  assert.equal(warning.getAttribute('data-type'), 'warning');
  assert.ok(warning.hasAttribute('data-icon'));
  // No title: the label names the note, and the icon is decoration beside it.
  assert.equal(warning.getAttribute('aria-label'), 'Warning');
  assert.equal(warning.querySelector('.callout-icon svg')?.getAttribute('aria-hidden'), 'true');
  // A title names the note, and the label is then the icon's text alternative.
  assert.ok(titled.hasAttribute('aria-labelledby') && !titled.hasAttribute('aria-label'));
  const icon = titled.querySelector('.callout-icon svg');
  assert.equal(icon?.getAttribute('role'), 'img');
  assert.equal(icon?.getAttribute('aria-label'), 'Tip');
  // Three types, three shapes: the icon is not one glyph in three colours.
  const shape = (callout) => callout.querySelector('.callout-icon svg')?.innerHTML;
  const note = await mount(h(Callout, { type: 'note', icon: true, label: 'Note' }, 'Body'));
  assert.equal(new Set([shape(warning), shape(titled), shape(note.container)]).size, 3);
  await note.unmount();
  // Asked for neither, a callout is what it was at 0.26.0.
  assert.ok(!plain.hasAttribute('data-icon') && !plain.hasAttribute('aria-label') && !plain.querySelector('.callout-icon'));
  await view.unmount();

  const { readFileSync } = await import('node:fs');
  const css = readFileSync(new URL('../dist/styles/callout.css', import.meta.url), 'utf8');
  assert.match(css, /\[data-type="warn"\], \[data-type="warning"\]/, 'warning is not drawn as warn');
});

await it('FormFault has a neutral tone, and states one sentence without a title', async () => {
  const view = await mount(
    h('div', null,
      h(FormFault, { announce: 'off', tone: 'neutral' }, h('p', null, 'Sign-up is by invitation.')),
      h(FormFault, { title: 'The request failed', autoFocus: false }, h('p', null, 'Try again.')),
      h(FormFault, { announce: 'polite', autoFocus: false }, h('p', null, 'The last change was not saved.')),
    ),
  );
  const [neutral, fault, untitled] = view.container.querySelectorAll('.ekd-fault');
  assert.equal(neutral.getAttribute('data-tone'), 'neutral');
  assert.ok(!neutral.hasAttribute('role'), 'a statement that is not announced has a role');
  assert.ok(!neutral.querySelector('h2, h3, h4'), 'a statement with no title rendered a heading');
  assert.equal(neutral.firstElementChild?.className, 'ekd-fault-body');
  assert.equal(neutral.textContent, 'Sign-up is by invitation.');
  // The default is the markup of 0.26.0: no tone attribute at all.
  assert.ok(!fault.hasAttribute('data-tone'));
  assert.equal(fault.getAttribute('role'), 'alert');
  // A live region with no title points at no heading.
  assert.equal(untitled.getAttribute('role'), 'status');
  assert.ok(!untitled.hasAttribute('aria-labelledby'), 'a statement with no title is named by an id that is not there');
  await view.unmount();
});

await it('Select is the native element, named by its label', async () => {
  const ref = React.createRef();
  const view = await mount(
    h('div', null,
      h(Select, { ref, id: 'language', name: 'language', label: 'Language', hint: 'Sets the highlighting.', error: 'Choose a language.', defaultValue: 'python' },
        h('option', { value: '' }, 'Plain text'), h('option', { value: 'python' }, 'Python')),
      h(Select, { label: 'Language', labelHidden: true, size: 'small' }, h('option', null, 'Plain text')),
    ),
  );
  const [full, small] = view.container.querySelectorAll('select');
  assert.ok(ref.current === full, 'Select dropped its ref');
  assert.equal(full.value, 'python');
  assert.equal(view.container.querySelector('label[for="language"]')?.textContent, 'Language');
  assert.equal(full.getAttribute('aria-invalid'), 'true');
  assert.deepEqual(
    full.getAttribute('aria-describedby').split(' ').map((id) => document.getElementById(id)?.textContent),
    ['Sets the highlighting.', 'Choose a language.'],
  );
  assert.ok(!full.hasAttribute('role') && !full.hasAttribute('multiple'));
  // The chevron is decoration and takes no name.
  assert.equal(full.parentElement.querySelector('svg')?.getAttribute('aria-hidden'), 'true');
  // Hidden from the page, the label still names the control.
  const hidden = view.container.querySelector(`label[for="${small.id}"]`);
  assert.equal(hidden?.textContent, 'Language');
  assert.ok(hidden.classList.contains('sr-only') && hidden.classList.contains('ekd-field-label'));
  assert.equal(small.closest('.ekd-field').getAttribute('data-size'), 'small');
  assert.ok(!full.closest('.ekd-field').hasAttribute('data-size'));
  await view.unmount();
});

await it('Toolbar is one Tab stop, and the arrow keys move between its controls', async () => {
  const pressed = [];
  const view = await mount(
    h(Toolbar, { label: 'Formatting', floating: true },
      h(Tooltip, { content: 'Bold, Ctrl+B' }, h(ToggleButton, { id: 'bold', label: 'Bold', pressed: true, onClick: () => pressed.push('bold') }, h('svg'))),
      h(ToggleButton, { id: 'italic', label: 'Italic', pressed: false }, h('svg')),
      h(ToggleButton, { id: 'off', label: 'Underline', pressed: false, disabled: true }, h('svg')),
      h(ToolbarSeparator),
      h(Select, { id: 'style', label: 'Style', labelHidden: true }, h('option', null, 'Paragraph'), h('option', null, 'Heading 1')),
      h(Button, { id: 'copy' }, 'Copy'),
    ),
  );
  const bar = view.container.querySelector('[role="toolbar"]');
  const $ = (id) => document.getElementById(id);
  // A disabled control reports tabIndex 0 and takes no focus, so it is no stop.
  const stops = () =>
    [...bar.querySelectorAll('button, select')].filter((el) => el.tabIndex === 0 && !el.disabled).map((el) => el.id);
  const press = async (init) => {
    let event;
    await act(async () => {
      event = key(document.activeElement, init);
    });
    return event;
  };

  assert.equal(bar.getAttribute('aria-label'), 'Formatting');
  assert.ok(bar.hasAttribute('data-floating'));
  assert.equal(bar.querySelector('[role="separator"]')?.getAttribute('aria-orientation'), 'vertical');

  // The toggle: a button with a state and one name.
  assert.equal($('bold').getAttribute('type'), 'button');
  assert.equal($('bold').getAttribute('aria-pressed'), 'true');
  assert.equal($('italic').getAttribute('aria-pressed'), 'false');
  assert.equal($('bold').getAttribute('aria-label'), 'Bold');
  // Described by its tooltip, which is found inside the toolbar like any control.
  assert.equal(document.getElementById($('bold').getAttribute('aria-describedby'))?.textContent, 'Bold, Ctrl+B');
  await act(async () => $('bold').click());
  assert.deepEqual(pressed, ['bold']);
  assert.equal($('bold').getAttribute('aria-pressed'), 'true', 'a press changed a state the application holds');

  // One stop, on the first control.
  assert.deepEqual(stops(), ['bold']);
  $('bold').focus();
  await press({ key: 'ArrowRight' });
  assert.equal(document.activeElement.id, 'italic');
  assert.deepEqual(stops(), ['italic'], 'the stop did not follow focus');
  // A disabled control is passed over.
  await press({ key: 'ArrowRight' });
  assert.equal(document.activeElement.id, 'style');
  // Up, Down, Home and End are the select's. Left and Right are the row's, and
  // are kept from changing the select's value on the way.
  assert.ok(!(await press({ key: 'ArrowDown' })).defaultPrevented, 'the toolbar took Down from a select');
  assert.ok(!(await press({ key: 'Home' })).defaultPrevented, 'the toolbar took Home from a select');
  assert.equal(document.activeElement.id, 'style');
  assert.ok((await press({ key: 'ArrowRight' })).defaultPrevented);
  assert.equal(document.activeElement.id, 'copy');
  // It wraps at both ends.
  await press({ key: 'ArrowRight' });
  assert.equal(document.activeElement.id, 'bold');
  await press({ key: 'ArrowLeft' });
  assert.equal(document.activeElement.id, 'copy');
  await press({ key: 'Home' });
  assert.equal(document.activeElement.id, 'bold');
  await press({ key: 'End' });
  assert.equal(document.activeElement.id, 'copy');
  // A chord is the browser's or the application's.
  assert.ok(!(await press({ key: 'ArrowLeft', altKey: true })).defaultPrevented);
  assert.equal(document.activeElement.id, 'copy');
  // Focus that arrives by a press makes that control the stop Tab returns to.
  await act(async () => $('italic').focus());
  assert.deepEqual(stops(), ['italic']);

  // A control that goes takes the stop with it, and the row still has one.
  await view.rerender(h(Toolbar, { label: 'Formatting' }, h(Button, { id: 'copy' }, 'Copy'), h(Button, { id: 'paste' }, 'Paste')));
  assert.deepEqual(stops(), ['copy']);
  assert.ok(!bar.hasAttribute('data-floating'));
  await view.unmount();
});

await it('MenuButton opens a menu, moves through it with the arrow keys, and returns focus', async () => {
  const ran = [];
  const items = [
    { label: 'Add row above', onSelect: () => ran.push('above') },
    { label: 'Add row below', onSelect: () => ran.push('below') },
    { label: 'Split cell', onSelect: () => ran.push('split'), disabled: true, separatorBefore: true },
    { label: 'Delete row', onSelect: () => ran.push(`delete, focus on ${document.activeElement?.id}`) },
  ];
  const view = await mount(
    h('div', null,
      h(Toolbar, { label: 'Table' }, h(MenuButton, { id: 'table-actions', label: 'Table', items }), h(Button, { id: 'beside' }, 'Beside')),
      h('button', { id: 'outside' }, 'Outside'),
    ),
  );
  const wrapper = view.container.querySelector('.ekd-menu');
  const button = document.getElementById('table-actions');
  const menu = wrapper.querySelector('[role="menu"]');
  const actions = [...menu.querySelectorAll('[role="menuitem"]')];
  const isOpen = () => wrapper.hasAttribute('data-open');
  const press = async (init) => {
    let event;
    await act(async () => {
      event = key(document.activeElement, init);
    });
    return event;
  };
  const focused = () => document.activeElement?.textContent;

  assert.equal(button.getAttribute('aria-haspopup'), 'menu');
  assert.equal(button.getAttribute('aria-expanded'), 'false');
  assert.equal(button.getAttribute('aria-controls'), menu.id);
  assert.equal(menu.getAttribute('aria-labelledby'), button.id);
  assert.equal(actions.length, 4);
  assert.ok(actions.every((a) => a.tabIndex === -1 && a.getAttribute('type') === 'button'), 'an action is a Tab stop');
  assert.equal(menu.querySelectorAll('[role="separator"]').length, 1);
  assert.equal(actions[2].getAttribute('aria-disabled'), 'true');
  // The actions are not the toolbar's controls: the row has two.
  assert.equal([...view.container.querySelectorAll('[role="toolbar"] button')].filter((b) => b.tabIndex === 0).length, 1);

  // A press opens it on the first action.
  await act(async () => button.click());
  assert.ok(isOpen() && button.getAttribute('aria-expanded') === 'true');
  assert.equal(focused(), 'Add row above');
  // Down and Up move and wrap; Home and End go to the ends. None reaches the toolbar.
  await press({ key: 'ArrowDown' });
  assert.equal(focused(), 'Add row below');
  await press({ key: 'ArrowUp' });
  await press({ key: 'ArrowUp' });
  assert.equal(focused(), 'Delete row', 'Up did not wrap to the last action');
  await press({ key: 'ArrowDown' });
  assert.equal(focused(), 'Add row above', 'Down did not wrap to the first action');
  await press({ key: 'End' });
  assert.equal(focused(), 'Delete row', 'End went to the end of the toolbar');
  await press({ key: 'Home' });
  assert.equal(focused(), 'Add row above');
  await press({ key: 'ArrowRight' });
  assert.equal(focused(), 'Add row above', 'the toolbar moved focus out of an open menu');

  // Escape closes it and puts focus back on the button.
  const escape = await press({ key: 'Escape' });
  assert.ok(escape.defaultPrevented, 'Escape went on to whatever encloses the menu');
  assert.ok(!isOpen() && document.activeElement === button, 'Escape did not return focus to the button');

  // Down opens it on the first action and Up on the last.
  await press({ key: 'ArrowUp' });
  assert.ok(isOpen());
  assert.equal(focused(), 'Delete row');
  // An action closes the menu and returns focus before it runs.
  await act(async () => document.activeElement.click());
  assert.deepEqual(ran, ['delete, focus on table-actions']);
  assert.ok(!isOpen());

  // An unavailable action takes focus and does not run.
  await press({ key: 'ArrowDown' });
  await press({ key: 'ArrowDown' });
  await press({ key: 'ArrowDown' });
  assert.equal(focused(), 'Split cell', 'an unavailable action was skipped, so the list changes shape');
  await act(async () => document.activeElement.click());
  assert.equal(ran.length, 1, 'an unavailable action ran');
  assert.ok(isOpen());

  // Tab is not taken, and the menu goes.
  assert.ok(!(await press({ key: 'Tab' })).defaultPrevented, 'the menu trapped Tab');
  assert.ok(!isOpen());

  // A press outside closes it, and so does focus that goes elsewhere.
  await act(async () => button.click());
  await act(async () => document.getElementById('outside').dispatchEvent(new window.Event('pointerdown', { bubbles: true })));
  assert.ok(!isOpen(), 'a press outside left the menu open');
  await act(async () => button.click());
  await act(async () => document.getElementById('outside').focus());
  assert.ok(!isOpen(), 'the menu outlived its focus');
  // A second press on the button closes what the first opened.
  await act(async () => button.click());
  await act(async () => button.click());
  assert.ok(!isOpen());
  await view.unmount();
});

await it('SyncStatus has three states, and is announced when it settles and not when it flips', async () => {
  let verified = 0;
  const status = (state, label, extra) => h(SyncStatus, { state, label, announceAfterMs: 60, onClick: () => verified++, ...extra });
  const wait = (ms) => act(async () => new Promise((resolve) => setTimeout(resolve, ms)));
  const view = await mount(status('synced', 'Saved'));
  const root = view.container.querySelector('.ekd-sync');
  const live = root.querySelector('[role="status"]');
  const control = () => root.querySelector('.ekd-sync-control');

  assert.equal(root.getAttribute('data-state'), 'synced');
  // A button, named by its words; the mark is decoration beside them.
  assert.equal(control().tagName, 'BUTTON');
  assert.equal(control().getAttribute('type'), 'button');
  assert.equal(control().textContent, 'Saved');
  assert.equal(control().querySelector('svg')?.getAttribute('aria-hidden'), 'true');
  assert.ok(!control().hasAttribute('aria-label'));
  await act(async () => control().click());
  assert.equal(verified, 1);
  // The state a document opens in is not announced.
  assert.ok(!live.hasAttribute('aria-live'), 'aria-live restates the role');
  assert.equal(live.textContent, '');
  assert.ok(!control().contains(live), 'the live region is inside the button it would rename');

  // Typing: syncing and back inside the interval. The page follows; nothing is said.
  const marks = new Set([control().querySelector('svg').innerHTML]);
  await view.rerender(status('syncing', 'Saving'));
  assert.equal(root.getAttribute('data-state'), 'syncing');
  assert.equal(control().textContent, 'Saving');
  marks.add(control().querySelector('svg').innerHTML);
  await wait(20);
  await view.rerender(status('synced', 'Saved'));
  await wait(120);
  assert.equal(live.textContent, '', 'a save that completed at once was announced');

  // A state that stands is announced, once, and so is the way out of it.
  await view.rerender(status('error', 'Not connected. Editing is paused.'));
  marks.add(control().querySelector('svg').innerHTML);
  assert.equal(marks.size, 3, 'two states share a mark, so one of them is carried by colour');
  assert.equal(live.textContent, '', 'the announcement did not wait for the state to settle');
  await wait(120);
  assert.equal(live.textContent, 'Not connected. Editing is paused.');
  // Reconnecting is the syncing state with its own words.
  await view.rerender(status('syncing', 'Reconnecting'));
  await wait(120);
  assert.equal(live.textContent, 'Reconnecting');
  await view.rerender(status('synced', 'Saved'));
  await wait(120);
  assert.equal(live.textContent, 'Saved');

  // With nothing to do it is text, not a control.
  await view.rerender(h(SyncStatus, { state: 'synced', label: 'Saved' }));
  assert.equal(control().tagName, 'SPAN');
  assert.ok(!control().hasAttribute('tabindex') && !control().hasAttribute('role'));
  await view.unmount();
});

// The two entries with no component. What can be held here is the contract:
// the names an application's editor writes, and that the package still needs
// no editor to be installed.
await it('The editor and code stylesheets answer to the documented names, and import no editor', async () => {
  const { readFileSync } = await import('node:fs');
  const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');
  const editor = read('../dist/styles/editor.css');
  const code = read('../dist/styles/code.css');
  for (const name of [
    '.ekd-editor', '[data-placeholder]', '[data-node-selected]', '[data-cell-selected]', '.ekd-table-wrap',
    '.ekd-column-resize', '[data-column-resizing]', '.ekd-table-caption', '.ekd-page-break', '.ekd-toc',
    '.ekd-toc-title', '.ekd-toc-list', '[data-level="3"]', 'var(--hl-mark)', 'var(--measure)', 'var(--serif-fit)',
  ]) {
    assert.ok(editor.includes(name), `editor.css has no rule for ${name}`);
  }
  for (const name of ['.ekd-code', '.ekd-code-header', 'var(--bg-inset)']) {
    assert.ok(code.includes(name), `code.css has no rule for ${name}`);
  }
  // Every syntax token is used, and every scope of highlight.js that carries a
  // colour here is spelt as highlight.js spells it.
  for (const token of ['keyword', 'string', 'number', 'title', 'attr', 'comment']) {
    assert.ok(code.includes(`var(--syntax-${token})`), `code.css does not use --syntax-${token}`);
  }
  for (const scope of [
    'keyword', 'built_in', 'type', 'literal', 'number', 'regexp', 'string', 'symbol', 'variable', 'title', 'comment',
    'doctag', 'meta', 'section', 'name', 'attr', 'attribute', 'bullet', 'quote', 'emphasis', 'strong', 'link',
    'selector-tag', 'selector-id', 'selector-class', 'selector-attr', 'selector-pseudo', 'template-tag',
    'template-variable', 'addition', 'deletion', 'property',
  ]) {
    assert.ok(code.includes(`.hljs-${scope}`), `code.css has no rule for .hljs-${scope}`);
  }
  // A comment and a keyword are not carried by hue alone.
  assert.match(code, /\.hljs-comment[^}]*\{[^}]*font-style:\s*italic/);
  assert.match(code, /\.hljs-keyword[^}]*\{[^}]*font-weight:\s*var\(--fw-medium\)/);
  // A table scrolls in its own wrapper.
  assert.match(editor, /\.ekd-table-wrap[^}]*\{[^}]*overflow-x:\s*auto/);

  const manifest = JSON.parse(read('../package.json'));
  const all = { ...manifest.dependencies, ...manifest.peerDependencies, ...manifest.devDependencies };
  const editors = Object.keys(all).filter((name) => /tiptap|prosemirror|lowlight|highlight\.js|^yjs$|^y-/.test(name));
  assert.deepEqual(editors, [], 'the package depends on an editor');
  assert.equal(manifest.dependencies, undefined, 'a runtime dependency was added');
});

// --- The QR code --------------------------------------------------------------
// The fixture is another encoder's output, and three of them agreed on it. A
// matrix this package wrote for itself would hold nothing.
const qrFixture = async () => {
  const { readFileSync } = await import('node:fs');
  return JSON.parse(readFileSync(new URL('./fixtures/qr-code.json', import.meta.url), 'utf8')).symbols;
};

await it('The QR encoder writes the symbol another encoder writes, in every module', async () => {
  const { encodeQr, QR_MAX_BYTES } = await import('../dist/src/components/qr.js');
  const symbols = await qrFixture();
  assert.ok(symbols.length >= 2, 'the fixture holds fewer than two symbols');

  // A finder: seven by seven, a dark ring, a light ring, a dark three by three.
  const FINDER = ['1111111', '1000001', '1011101', '1011101', '1011101', '1000001', '1111111'];
  for (const { value, rows } of symbols) {
    const mine = encodeQr(value).map((row) => row.map((dark) => (dark ? '1' : '0')).join(''));
    assert.deepEqual(mine, rows, `the symbol for ${value}`);

    const size = mine.length;
    assert.equal((size - 17) % 4, 0, 'a symbol is 17 modules and four for each version');
    for (const [x, y] of [[0, 0], [size - 7, 0], [0, size - 7]]) {
      assert.deepEqual(mine.slice(y, y + 7).map((row) => row.slice(x, x + 7)), FINDER, `the finder at ${x},${y}`);
    }
    // And no fourth, where the alignment pattern stands instead.
    assert.notDeepEqual(mine.slice(size - 7).map((row) => row.slice(size - 7)), FINDER);
    // The separator: a light line on the inner sides of each finder.
    for (let i = 0; i < 8; i++) {
      for (const [x, y] of [[7, i], [i, 7], [size - 8, i], [size - 1 - i, 7], [7, size - 1 - i], [i, size - 8]]) {
        assert.equal(mine[y][x], '0', `the separator at ${x},${y}`);
      }
    }
  }

  // The largest value fits the largest version, and one byte more is refused.
  assert.equal(QR_MAX_BYTES, 2331);
  assert.equal(encodeQr('a'.repeat(QR_MAX_BYTES)).length, 177);
  assert.throws(() => encodeQr('a'.repeat(QR_MAX_BYTES + 1)), RangeError);
  // Bytes, not characters: a Greek letter is two.
  assert.throws(() => encodeQr('α'.repeat(QR_MAX_BYTES / 2 + 1)), /2332 bytes/);
});

await it('QrCode is an image named by its label, dark on light, with a quiet zone of four modules', async () => {
  const { readFileSync } = await import('node:fs');
  const { renderToStaticMarkup } = await import('react-dom/server');
  const [{ value, rows }] = await qrFixture();
  const size = rows.length;
  const label = 'QR code for your authenticator app';

  const view = await mount(h(QrCode, { value, label, className: 'mine', id: 'totp' }));
  const svg = view.container.querySelector('svg');
  assert.equal(svg.getAttribute('role'), 'img');
  assert.equal(svg.getAttribute('aria-label'), label);
  assert.equal(svg.getAttribute('class'), 'ekd-qr mine');
  assert.equal(svg.id, 'totp', 'other attributes pass through');
  assert.equal(view.container.querySelector('img, canvas, image'), null);

  // The plate is the whole image, and the image is the symbol and four
  // modules on each side.
  assert.equal(svg.getAttribute('viewBox'), `0 0 ${size + 8} ${size + 8}`);
  assert.equal(svg.getAttribute('width'), '200');
  assert.equal(svg.getAttribute('height'), '200');
  const plate = svg.querySelector('rect');
  assert.equal(plate.getAttribute('width'), String(size + 8));
  assert.equal(plate.getAttribute('height'), String(size + 8));

  // Paint the path onto a grid. Nothing dark may fall in the quiet zone, and
  // what is inside it has to be the fixture's symbol.
  const d = svg.querySelector('path').getAttribute('d');
  const painted = Array.from({ length: size + 8 }, () => new Array(size + 8).fill('0'));
  const runs = [...d.matchAll(/M(\d+) (\d+)h(\d+)v1h-(\d+)z/g)];
  assert.equal(runs.map((run) => run[0]).join(''), d, 'the path holds something other than runs of modules');
  for (const [, x, y, length, back] of runs) {
    assert.equal(length, back);
    for (let i = 0; i < Number(length); i++) painted[Number(y)][Number(x) + i] = '1';
  }
  const grid = painted.map((row) => row.join(''));
  const empty = '0'.repeat(size + 8);
  for (let i = 0; i < 4; i++) {
    assert.equal(grid[i], empty, 'a dark module above the symbol');
    assert.equal(grid[size + 7 - i], empty, 'a dark module below the symbol');
  }
  for (const row of grid) assert.ok(row.startsWith('0000') && row.endsWith('0000'), 'a dark module beside the symbol');
  assert.deepEqual(grid.slice(4, size + 4).map((row) => row.slice(4, size + 4)), rows);

  await view.rerender(h(QrCode, { value, label, size: 264 }));
  assert.equal(view.container.querySelector('svg').getAttribute('width'), '264');
  await view.unmount();

  // On the server, with no document: the same path, and the two colours as
  // tokens. jsdom drops a declaration it does not know, so the colours are
  // read from the markup a server sends.
  const html = renderToStaticMarkup(h(QrCode, { value, label }));
  assert.match(html, /^<svg [^>]*role="img"/);
  assert.ok(html.includes(`aria-label="${label}"`));
  assert.ok(html.includes(`d="${d}"`), 'the server and the browser draw different paths');
  assert.match(html, /<rect [^>]*style="fill:var\(--scan-plate\)"/);
  assert.match(html, /<path [^>]*style="fill:var\(--scan-ink\)"/);
  assert.match(html, /<svg [^>]*style="forced-color-adjust:none"/);
  assert.ok(!/data:|<img|<canvas|href=/.test(html), 'the image refers to something outside itself');

  // No client boundary, and no hook to need one.
  const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');
  for (const file of ['QrCode.js', 'qr.js']) {
    const source = read(`../dist/src/components/${file}`);
    assert.ok(!/['"]use client['"]/.test(source), `${file} is a client module`);
    assert.ok(!/\buse[A-Z]\w*\(/.test(source), `${file} calls a hook`);
    assert.ok(!/from ['"](?!react\/jsx-runtime['"]|\.\/qr\.js['"])/.test(source), `${file} imports something else`);
  }

  // A value that fits no version is a fault in the application, raised at render.
  assert.throws(() => renderToStaticMarkup(h(QrCode, { value: 'a'.repeat(2332), label })), RangeError);

  // The two colours are the same in every palette: declared once, in no theme.
  const tokens = read('../tokens/generated/tokens.css');
  assert.equal(tokens.match(/--scan-plate:/g).length, 1);
  assert.equal(tokens.match(/--scan-ink:/g).length, 1);
});

console.log(`check:components — ${cases} cases: the a11y helpers, and the components' names, roles and focus, against jsdom`);
