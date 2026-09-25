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
  AccessGate, GateSubmitButton, NavDrawer,
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
  assert.equal(document.activeElement, button, 'focus left the button');

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
  assert.equal(document.activeElement, trigger, 'focus did not return to the trigger');

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

console.log(`check:components — ${cases} cases: the a11y helpers, and the components' names, roles and focus, against jsdom`);
