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
  AccessGate, GateSubmitButton, NavDrawer, OnThisPage, InPageLinkDirection, OpeningSequence, DocMeta,
  Button, ButtonLink, TextField, OneTimeCodeField, PasswordField, TextArea, RadioGroup, Checkbox, FormFault, Dialog, Tooltip,
  PageHeading, Select, Toolbar, ToolbarSeparator, ToggleButton, MenuButton, SyncStatus, QrCode,
  Avatar, AvatarStack, avatarInitials,
  OptionList, optionListAttributes, optionListKey, optionListNavigating, optionListOptionId, placeOptionList,
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

  // An Escape that something inside the surface has answered, and prevented
  // the default of to say so, is not the surface's: one key closes one thing.
  const answer = (keydown) => keydown.preventDefault();
  $('last').addEventListener('keydown', answer);
  await act(async () => {
    key($('last'), { key: 'Escape' });
  });
  assert.equal(closed, 0, 'an Escape that a control inside had answered closed the surface too');
  assert.ok($('behind').hasAttribute('inert'), 'the surface let go of the page on an Escape that was not its own');
  $('last').removeEventListener('keydown', answer);

  // An Escape pressed while an input method is composing cancels the
  // composition and is not the surface's. Two ways an event says so.
  for (const init of [{ isComposing: true }, { keyCode: 229 }]) {
    await act(async () => {
      key($('first'), { key: 'Escape', ...init });
    });
    assert.equal(closed, 0, `an Escape during composition closed the surface: ${JSON.stringify(init)}`);
    assert.ok($('behind').hasAttribute('inert'), 'the surface let go of the page on an Escape that was the input method’s');
  }

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

// A row header: the same element as a column header, in the body. The scope
// reaches the DOM, the cell types accept the attributes of their own element,
// and the stylesheet draws a `th` in `tbody` as the header of its row.
await it('TableHeaderCell in a body row is the header of the row', async () => {
  const view = await mount(
    h(Table, { caption: 'Roles' },
      h(TableHead, null, h(TableRow, null,
        h(TableHeaderCell, { scope: 'col' }, 'Role'),
        h(TableHeaderCell, { scope: 'col' }, 'Rename'))),
      h(TableBody, null,
        h(TableRow, null,
          h(TableHeaderCell, { scope: 'row' }, 'Editors'),
          h(TableCell, null, 'Yes')),
        h(TableRow, null, h(TableCell, { colSpan: 2 }, 'No other roles')),
        h(TableRow, null, h(TableHeaderCell, null, 'Viewers'), h(TableCell, null, 'No'))),
    ),
  );
  const [col] = view.container.querySelectorAll('thead th');
  const [rowHeader, bareHeader] = view.container.querySelectorAll('tbody th');
  assert.equal(col.getAttribute('scope'), 'col');
  assert.equal(rowHeader.getAttribute('scope'), 'row', 'scope was not passed to the th');
  assert.equal(view.container.querySelector('tbody td[colspan]')?.getAttribute('colspan'), '2');
  // Nothing is defaulted: a cell does not know where it stands.
  assert.ok(!bareHeader.hasAttribute('scope'), 'a scope was invented for a header cell that was given none');
  await view.unmount();

  // The type is held by the compiler, against the built declarations.
  const { spawnSync } = await import('node:child_process');
  const { fileURLToPath } = await import('node:url');
  const root = fileURLToPath(new URL('..', import.meta.url));
  const tsc = spawnSync(
    process.execPath,
    [
      'node_modules/typescript/bin/tsc', '--noEmit', '--strict', '--skipLibCheck', '--jsx', 'react-jsx',
      '--module', 'esnext', '--moduleResolution', 'bundler', '--target', 'es2022', '--lib', 'es2022,dom',
      'scripts/fixtures/table-types.tsx',
    ],
    { cwd: root, encoding: 'utf8' },
  );
  assert.equal(tsc.status, 0, `scripts/fixtures/table-types.tsx does not compile:\n${tsc.stdout}${tsc.stderr}`);

  // jsdom applies no stylesheet, so the rules are read. A `th` in `tbody` takes
  // each rule a body cell takes, and the weight and ink of a row header.
  const { readFileSync } = await import('node:fs');
  const css = readFileSync(new URL('../dist/styles/table.css', import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  const block = (selector) => {
    const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(?:^|\\})\\s*${escaped}\\s*\\{([^}]*)\\}`).exec(css)?.[1];
  };
  const cells = block('.tbl-wrap tbody :is(td, th)');
  assert.ok(cells, 'table.css does not give a th in tbody the padding of a body cell');
  assert.match(cells, /padding:\s*9px 14px/);
  assert.match(cells, /overflow-wrap:\s*anywhere/);
  for (const selector of [
    '.tbl-wrap tbody tr :is(td, th):first-child',
    '.tbl-wrap tbody tr :is(td, th):last-child',
    '.tbl-wrap tbody tr:last-child :is(td, th)',
    '.tbl-wrap tbody tr:hover :is(td, th)',
  ]) {
    assert.ok(block(selector), `table.css does not carry ${selector}`);
  }
  const header = block('.tbl-wrap tbody th');
  assert.ok(header, 'table.css has no rule for a row header');
  assert.match(header, /font-weight:\s*var\(--fw-semi\)/);
  assert.match(header, /color:\s*var\(--fg-1\)/);
  assert.match(header, /text-align:\s*start/, 'a user agent centres a th');
  assert.ok(!/position:|background:|letter-spacing:/.test(header), 'a row header took the column header’s treatment');
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

// --- The arrow on a link ----------------------------------------------------------
await it('The arrow is drawn on a link in reading text, and on no navigation link, listed title, contents entry or link in an editable surface', async () => {
  const { readFileSync } = await import('node:fs');
  const css = readFileSync(new URL('../dist/styles/reset-only.css', import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  // The rule that makes the box: the one with `content: ""`, whichever selector it has.
  const rule = [...css.matchAll(/([^{}]+)::after\s*\{([^}]*)\}/g)].find((m) => /content:\s*"";/.test(m[2]));
  assert.ok(rule, 'reset.css has no rule that draws the arrow');
  const selector = rule[1].trim();
  assert.ok(!/^a:where\(:not\(\[class\]\)\)$/.test(selector), 'the arrow is back on every unclassed link');

  const host = document.createElement('div');
  host.innerHTML = [
    '<header><nav><a id="nav" href="/guide">Guide</a></nav></header>',
    '<a id="bare-nav" href="/guide">Guide</a>',
    '<ul><li><a id="list" href="/doc/1">A document title</a></li></ul>',
    '<div class="ekd-toc"><ol><li><a id="toc" href="#one">One</a></li></ol></div>',
    '<div class="ekd-toc"><p><a id="toc-p" href="#one">One</a></p></div>',
    '<div contenteditable="true"><p><a id="editable" href="https://example.com">text</a></p><p contenteditable="false"><a id="island" href="/x">x</a></p></div>',
    '<p contenteditable="true"><a id="editable-p" href="/x">x</a></p>',
    '<table><tbody><tr><td><a id="cell" href="/x">x</a></td></tr></tbody></table>',
    '<h2><a id="heading" href="/x">x</a></h2>',
    '<p>Some copy with <a id="copy" href="/x">a link</a>, <a id="copy-out" href="https://example.com">another</a> and <a id="classed" class="x" href="/x">a classed one</a>.</p>',
    '<blockquote><p><a id="quote" href="/x">q</a></p></blockquote>',
    '<div><p>Ordinary copy <a id="page-copy" href="#top">here</a>.</p></div>',
  ].join('');
  document.body.append(host);
  const arrow = (id) => host.querySelector(`#${id}`).matches(selector);
  try {
    for (const id of ['copy', 'copy-out', 'quote', 'page-copy']) assert.ok(arrow(id), `the link ${id} in reading text has no arrow`);
    for (const id of ['nav', 'bare-nav', 'list', 'toc', 'toc-p', 'editable', 'island', 'editable-p', 'cell', 'heading', 'classed']) {
      assert.ok(!arrow(id), `the link ${id} outside reading text has an arrow`);
    }
  } finally {
    host.remove();
  }
});

// --- InPageLinkDirection ----------------------------------------------------------
await it('InPageLinkDirection', async () => {
  const wait = () => act(async () => new Promise((resolve) => setTimeout(resolve, 60)));
  const article = document.createElement('article');
  article.innerHTML = `
    <h2 id="before">Before</h2>
    <section id="here">
      <p><a id="l-up" href="#before">a</a> <a id="l-self" href="#here">b</a>
         <a id="l-down" href="#after">c</a> <a id="l-top" href="#">d</a>
         <a id="l-missing" href="#nowhere" data-link-direction="up">e</a>
         <a id="l-encoded" href="#%C3%A9t%C3%A9">f</a></p>
    </section>
    <h2 id="after">After</h2>
    <h2 id="été">Été</h2>`;
  document.body.appendChild(article);

  const view = await mount(h(InPageLinkDirection, { rescanKey: 1 }));
  await wait();
  const dir = (id) => document.getElementById(id).getAttribute('data-link-direction');
  assert.equal(dir('l-up'), 'up', 'a target above the link is not up');
  assert.equal(dir('l-self'), 'up', 'a section linking to its own top is not up');
  assert.equal(dir('l-down'), 'down', 'a target below the link is not down');
  assert.equal(dir('l-top'), 'up', 'an empty fragment is not the top of the page');
  assert.equal(dir('l-missing'), null, 'a missing target kept a stale direction');
  assert.equal(dir('l-encoded'), 'down', 'a percent-encoded fragment was not decoded');

  // A new route: the links are read again.
  article.innerHTML = '<h2 id="x">X</h2><p><a id="l-again" href="#x">x</a></p>';
  await view.rerender(h(InPageLinkDirection, { rescanKey: 2 }));
  await wait();
  assert.equal(dir('l-again'), 'up');
  assert.equal(view.container.childNodes.length, 0, 'it rendered something');
  await view.unmount();
  article.remove();
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
  // The mark fades in rather than being traced, so it is the ordinary filled
  // glyph: one path, decorative, with no stroke length set on it.
  assert.equal(overlay.querySelectorAll('.opening-sequence-mark path').length, 1);
  assert.equal(overlay.querySelector('.opening-sequence-mark')?.getAttribute('aria-hidden'), 'true');
  assert.equal(overlay.querySelector('path')?.getAttribute('pathLength'), null);
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

await it('ButtonLink', async () => {
  const view = await mount(h(ButtonLink, { href: '/apply', target: '_blank', rel: 'noreferrer', className: 'x' }, 'Apply'));
  const a = view.container.querySelector('a');
  assert.equal(a.getAttribute('href'), '/apply');
  assert.equal(a.getAttribute('target'), '_blank');
  assert.equal(a.getAttribute('rel'), 'noreferrer');
  assert.equal(a.className, 'ekd-button x');
  assert.equal(a.getAttribute('data-variant'), 'secondary');
  await view.rerender(h(ButtonLink, { href: '/a', variant: 'primary' }, 'Apply'));
  assert.equal(a.getAttribute('data-variant'), 'primary');
  assert.ok(!a.hasAttribute('aria-busy') && !a.hasAttribute('aria-disabled'));
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

// A box in a row of a table is named by what the row's header says, and the
// words beside it would repeat that. The label stays, for a screen reader, and
// is the containing block of its own hidden words.
await it('Checkbox labelHidden keeps the label for a screen reader, inside the control', async () => {
  const ref = React.createRef();
  const view = await mount(
    h('div', null,
      h(Checkbox, { id: 'shown', name: 'a', label: 'Shown' }),
      h(Checkbox, { ref, id: 'quiet', name: 'b', label: 'Editors can rename', labelHidden: true, hint: 'Hint.' }),
    ),
  );
  const shown = document.getElementById('shown');
  const quiet = document.getElementById('quiet');
  assert.ok(ref.current === quiet, 'a Checkbox with a hidden label dropped its ref');

  // Still named by its label, which is still the element the box sits in.
  assert.equal(quiet.labels.length, 1);
  assert.equal(quiet.labels[0].textContent, 'Editors can rename');
  assert.equal(quiet.closest('label'), quiet.labels[0]);
  assert.equal(document.getElementById(quiet.getAttribute('aria-describedby'))?.textContent, 'Hint.');

  // The words are .sr-only, and their label is the one that is positioned
  // (`ekd-choice--bare`), so they cannot lie outside an overflow container.
  const words = quiet.labels[0].querySelector('.ekd-choice-label');
  assert.ok(words.classList.contains('sr-only'), 'the label is drawn');
  assert.ok(quiet.labels[0].classList.contains('ekd-choice--bare'), 'the hidden words have no positioned label');

  // And the default is unchanged: a visible label, no modifier.
  assert.ok(!shown.labels[0].classList.contains('ekd-choice--bare'));
  assert.ok(!shown.labels[0].querySelector('.sr-only'), 'a label was hidden that was not asked to be');
  await view.unmount();

  // jsdom lays out nothing, so the rule that holds the words in is read.
  const { readFileSync } = await import('node:fs');
  const css = readFileSync(new URL('../dist/styles/form.css', import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  const bare = /\.ekd-choice--bare\s*\{([^}]*)\}/.exec(css)?.[1];
  assert.ok(bare, 'form.css has no rule for a checkbox with a hidden label');
  assert.match(bare, /position:\s*relative/, 'the hidden words are not contained by their label');
  assert.match(bare, /inline-size:\s*fit-content/, 'the whole line toggles the box');
  assert.match(bare, /min-inline-size:\s*var\(--sp-6\)/, 'the target is under 24px');
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

// --- The avatar -----------------------------------------------------------------
// A person as a picture, and the people who have a document open as a list.
// The letters, the name a screen reader hears, and the colour are each held
// here, because each can be wrong while the picture still draws.
await it('avatarInitials cuts a name by grapheme, in any script', () => {
  assert.equal(avatarInitials('Maria Papadopoulou'), 'MP');
  assert.equal(avatarInitials('Μαρία Παπαδοπούλου'), 'ΜΠ', 'Greek');
  assert.equal(avatarInitials('ηλίας ράπτης'), 'ΗΡ', 'a lower-case Greek name is capitalised');
  assert.equal(avatarInitials('Jean-Luc Picard'), 'JP', 'the first and the last word, not the first two');
  assert.equal(avatarInitials('Ada Augusta King Lovelace'), 'AL');
  assert.equal(avatarInitials('Madonna'), 'M', 'one word is one letter');
  assert.equal(avatarInitials('  Ada   Lovelace '), 'AL', 'space around and inside is not a word');
  assert.equal(avatarInitials(''), '');
  assert.equal(avatarInitials(' \n\t '), '');
  // A grapheme is more than a code unit and more than a code point.
  assert.equal(avatarInitials('Émile Zola'), 'ÉZ');
  assert.equal(avatarInitials('Émile Zola'), 'ÉZ', 'a letter keeps its combining accent');
  assert.equal(avatarInitials('\u{1D49C}da Ng'), '\u{1D49C}N', 'a letter outside the BMP is not cut into surrogates');
  assert.equal(avatarInitials('👩‍💻 Ada'), '👩‍💻A', 'a joined emoji is one character');
  assert.equal(avatarInitials('🇬🇷 Ada'), '🇬🇷A', 'a flag is one character');
  assert.equal(avatarInitials('ΑΘΗΝΑ'), 'Α');
});

await it('Avatar is named or decorative, draws its slot, and its letters or its image', async () => {
  const { renderToStaticMarkup } = await import('react-dom/server');
  const root = (view) => view.container.firstElementChild;

  // Alone: an image with a name. The letters inside it are not read as well.
  let view = await mount(h(Avatar, { name: 'Maria Papadopoulou', collaboratorSlot: 3, label: 'Maria Papadopoulou' }));
  assert.equal(root(view).getAttribute('role'), 'img');
  assert.equal(root(view).getAttribute('aria-label'), 'Maria Papadopoulou');
  assert.ok(!root(view).hasAttribute('aria-hidden'));
  assert.equal(root(view).textContent, 'MP');
  assert.equal(root(view).className, 'ekd-avatar ekd-avatar-slot-3');
  await view.unmount();

  // Beside a name, or in a stack: hidden from a screen reader, no name, no role.
  view = await mount(h(Avatar, { name: 'Μαρία Παπαδοπούλου', collaboratorSlot: 10, size: 'lg', decorative: true, id: 'a', className: 'mine' }));
  assert.equal(root(view).getAttribute('aria-hidden'), 'true');
  assert.ok(!root(view).hasAttribute('role') && !root(view).hasAttribute('aria-label'));
  assert.equal(root(view).textContent, 'ΜΠ');
  assert.equal(root(view).className, 'ekd-avatar ekd-avatar--lg ekd-avatar-slot-10 mine');
  assert.equal(root(view).id, 'a', 'other attributes pass through');
  assert.ok(!root(view).hasAttribute('tabindex'), 'a picture is not a Tab stop');
  await view.unmount();

  // Sizes: medium is the default and has no modifier, the other two have one.
  view = await mount(h('div', null,
    h(Avatar, { initials: 'A', collaboratorSlot: 1, decorative: true }),
    h(Avatar, { initials: 'B', collaboratorSlot: 1, decorative: true, size: 'sm' }),
    h(Avatar, { initials: 'C', collaboratorSlot: 1, decorative: true, size: 'md' })));
  assert.deepEqual([...view.container.querySelectorAll('.ekd-avatar')].map((el) => el.className),
    ['ekd-avatar ekd-avatar-slot-1', 'ekd-avatar ekd-avatar--sm ekd-avatar-slot-1', 'ekd-avatar ekd-avatar-slot-1']);
  await view.unmount();

  // The letters: the caller's initials, cut to two graphemes; the name's when
  // there are none, or they are empty.
  const letters = (props) => renderToStaticMarkup(h(Avatar, { collaboratorSlot: 1, decorative: true, ...props }))
    .match(/<span class="ekd-avatar-letters">([^<]*)<\/span>/)[1];
  assert.equal(letters({ initials: 'ΜΠ' }), 'ΜΠ');
  assert.equal(letters({ initials: 'ΜΠΧΩ' }), 'ΜΠ', 'initials are cut to two');
  assert.equal(letters({ initials: 'ÉŹQ' }), 'ÉŹ', 'by grapheme');
  assert.equal(letters({ initials: 'x', name: 'Ada Lovelace' }), 'x', 'the caller\'s initials are not capitalised or replaced');
  assert.equal(letters({ initials: '', name: 'Ada Lovelace' }), 'AL');
  assert.equal(letters({ initials: '  ', name: 'Ada Lovelace' }), 'AL');
  assert.equal(letters({ name: 'Ada Lovelace' }), 'AL');

  // A slot outside the ten has no colour, and is refused rather than drawn.
  for (const slot of [0, 11, -1, 1.5, NaN, undefined, '3']) {
    assert.throws(
      () => renderToStaticMarkup(h(Avatar, { name: 'Ada', collaboratorSlot: slot, decorative: true })),
      (error) => error instanceof RangeError && /collaboratorSlot/.test(error.message),
      `slot ${String(slot)} was drawn`,
    );
  }
  for (let slot = 1; slot <= 10; slot++) {
    assert.match(renderToStaticMarkup(h(Avatar, { name: 'Ada', collaboratorSlot: slot, decorative: true })), new RegExp(`ekd-avatar-slot-${slot}"`));
  }

  // An image is drawn over the letters, with no alternative text of its own,
  // and the letters are what is left when it fails.
  view = await mount(h(Avatar, { name: 'Ada Lovelace', collaboratorSlot: 2, src: '/a.png', decorative: true }));
  let img = view.container.querySelector('img.ekd-avatar-image');
  assert.equal(img.getAttribute('src'), '/a.png');
  assert.equal(img.getAttribute('alt'), '', 'the picture names no one: the label or the text beside it does');
  assert.equal(root(view).querySelector('.ekd-avatar-letters').textContent, 'AL', 'the letters are not removed for an image');
  assert.ok(!img.hasAttribute('tabindex'));
  await act(async () => img.dispatchEvent(new window.Event('error')));
  assert.equal(view.container.querySelector('img'), null, 'a failed image was left on the picture');
  assert.equal(root(view).textContent, 'AL');
  // A different address is tried afresh.
  await view.rerender(h(Avatar, { name: 'Ada Lovelace', collaboratorSlot: 2, src: '/b.png', decorative: true }));
  img = view.container.querySelector('img');
  assert.equal(img?.getAttribute('src'), '/b.png', 'a new src was not tried after the last one failed');
  await view.rerender(h(Avatar, { name: 'Ada Lovelace', collaboratorSlot: 2, decorative: true }));
  assert.equal(view.container.querySelector('img'), null);
  await view.unmount();
  // Without a document, as a server renders it.
  assert.ok(renderToStaticMarkup(h(Avatar, { name: 'Ada', collaboratorSlot: 1, src: '/a.png', decorative: true })).includes('<img'));
});

await it('AvatarStack is a named list whose items say who and in what role, and are not focusable', async () => {
  const { renderToStaticMarkup } = await import('react-dom/server');
  const people = [
    { id: 'u1', name: 'Maria Papadopoulou', role: 'Editor', collaboratorSlot: 1, you: 'you' },
    { id: 'u2', name: 'Nikos Georgiou', role: 'Viewer', collaboratorSlot: 2 },
    { id: 'u3', name: 'Ελένη Δήμου', collaboratorSlot: 3 },
    { id: 'u4', name: 'Sam Lee', role: 'Editor', collaboratorSlot: 4, initials: 'SL' },
    { id: 'u5', name: 'Ana Ruiz', role: 'Viewer', collaboratorSlot: 5 },
    { id: 'u6', name: 'Tom Kay', role: 'Viewer', collaboratorSlot: 6 },
    { id: 'u7', name: 'Una Fox', role: 'Viewer', collaboratorSlot: 7 },
  ];
  const calls = [];
  const more = (n) => {
    calls.push(n);
    return n === 1 ? 'and 1 more person' : `and ${n} more people`;
  };
  const stack = (props) => h(AvatarStack, { label: 'People in this document', people, more, ...props });

  const view = await mount(stack({ id: 'who', className: 'mine' }));
  const list = view.container.querySelector('ul');
  assert.equal(view.container.children.length, 1);
  assert.equal(list.getAttribute('role'), 'list', 'Safari drops the list when its markers are removed');
  assert.equal(list.getAttribute('aria-label'), 'People in this document');
  assert.equal(list.id, 'who');
  assert.equal(list.className, 'ekd-avatar-stack mine');

  // Four people and the count of the other three, in the order given.
  const items = [...list.children];
  assert.ok(items.every((li) => li.tagName === 'LI' && li.className === 'ekd-avatar-stack-item'));
  assert.equal(items.length, 5);
  const said = (li) => li.querySelector('.ekd-avatar-text').textContent;
  assert.deepEqual(items.map(said), [
    'Maria Papadopoulou (you), Editor',
    'Nikos Georgiou, Viewer',
    'Ελένη Δήμου',
    'Sam Lee, Editor',
    'and 3 more people',
  ]);
  assert.deepEqual(calls.slice(-1), [3]);

  // Every picture is hidden from a screen reader: the text beside it is the
  // name, and a screen reader that read both would say it twice. The hidden
  // words are inside their own item, which is what contains them.
  for (const li of items) {
    assert.equal(li.querySelector('.ekd-avatar').getAttribute('aria-hidden'), 'true');
    assert.ok(li.querySelector('.ekd-avatar-text'), 'an item has no words');
    assert.equal(li.querySelectorAll('.ekd-avatar-text').length, 1);
    assert.ok(li.querySelector('.ekd-avatar-text').parentElement === li, 'the hidden words are not a child of their item');
  }
  assert.deepEqual(
    items.slice(0, 4).map((li) => li.querySelector('.ekd-avatar-letters').textContent),
    ['MP', 'NG', 'ΕΔ', 'SL'], 'letters: derived, derived, Greek, given',
  );
  assert.deepEqual(
    items.slice(0, 4).map((li) => /ekd-avatar-slot-(\d+)/.exec(li.querySelector('.ekd-avatar').className)[1]),
    ['1', '2', '3', '4'],
  );
  // The count is drawn and not read; its words are the application's.
  const last = items[4];
  assert.equal(last.querySelector('.ekd-avatar-letters').textContent, '+3');
  assert.equal(last.querySelector('.ekd-avatar').getAttribute('aria-hidden'), 'true');
  assert.ok(!/ekd-avatar-slot/.test(last.querySelector('.ekd-avatar').className), 'the count took a person\'s colour');

  // The reader is marked by the application's word, in the text and in a
  // hook for the ring. No one else is.
  assert.equal(items[0].getAttribute('data-you'), 'true');
  assert.deepEqual(items.slice(1).map((li) => li.hasAttribute('data-you')), [false, false, false, false]);

  // Nothing in it is a control: read in order, as a list, with no Tab stop.
  assert.equal(list.querySelectorAll('a, button, input, select, textarea, [tabindex], [role="button"], [role="link"]').length, 0);
  // And the one accessible name is the list's: nothing inside is named in a
  // way that would repeat it.
  assert.equal(list.querySelectorAll('[aria-label], [aria-labelledby], img, [role="img"]').length, 0);

  // A smaller picture is a modifier on every picture, the count's included.
  await view.rerender(stack({ size: 'sm' }));
  assert.ok([...view.container.querySelectorAll('.ekd-avatar')].every((el) => el.classList.contains('ekd-avatar--sm')));
  assert.ok(view.container.querySelector('ul').classList.contains('ekd-avatar-stack--sm'), 'the small stack has the small overlap');
  await view.rerender(stack({ size: 'lg' }));
  assert.ok([...view.container.querySelectorAll('.ekd-avatar')].every((el) => el.classList.contains('ekd-avatar--lg')));
  assert.equal(view.container.querySelector('ul').className, 'ekd-avatar-stack');

  // `max` is how many people are drawn; the rest are counted, in the words
  // of the application, and `more` is asked only when someone is not drawn.
  const texts = (props) => {
    calls.length = 0;
    const html = renderToStaticMarkup(stack(props));
    return { html, said: [...html.matchAll(/<span class="ekd-avatar-text">([^<]*)<\/span>/g)].map((m) => m[1]) };
  };
  assert.equal(texts({ max: 2 }).said.length, 3);
  assert.deepEqual(calls, [5]);
  assert.match(texts({ max: 2 }).said[2], /and 5 more people/);
  assert.equal(texts({ max: 6 }).said.slice(-1)[0], 'and 1 more person', 'the count of one is the application\'s to word');
  assert.deepEqual(texts({ max: 7 }).said.length, 7);
  assert.deepEqual(calls, [], 'the words for the others were asked for when no one was left out');
  assert.equal(texts({ max: 100 }).said.length, 7);
  assert.equal(texts({ max: Infinity }).said.length, 7);
  assert.equal(texts({ max: 0 }).said.length, 1, 'max 0 is the count alone');
  assert.deepEqual(texts({ max: 2.9 }).said.length, 3, 'max is a whole number of people');
  assert.equal(texts({}).said.length, 5, 'the default is four');
  assert.equal(texts({ max: NaN }).said.length, 5, 'NaN is not a maximum');
  assert.equal(texts({ max: -3 }).said.length, 5, 'a negative maximum is not one');
  // And what is not drawn is not read: a person past the maximum is not in the list.
  assert.ok(!texts({ max: 2 }).html.includes('Sam Lee'));

  // One person, and none. An empty list is not announced as a list of nothing.
  assert.equal(texts({ people: [people[1]] }).said.length, 1);
  assert.equal(renderToStaticMarkup(stack({ people: [] })), '');
  // A role is absent without a comma, and `you` without a role is not followed by one.
  const only = texts({ people: [{ id: 'a', name: 'Ada', collaboratorSlot: 1, you: 'you' }, { id: 'b', name: 'Bo', collaboratorSlot: 2 }] }).said;
  assert.deepEqual(only, ['Ada (you)', 'Bo']);
  await view.unmount();

  // A slot outside the ten is the application's fault, and the stack says so.
  assert.throws(
    () => renderToStaticMarkup(stack({ people: [{ id: 'x', name: 'Ada', collaboratorSlot: 11 }] })),
    RangeError,
  );

  // A picture is the person's own, and a failed one is not the stack's concern.
  const shown = await mount(stack({ people: [{ id: 'p', name: 'Ada Lovelace', collaboratorSlot: 2, src: '/a.png' }] }));
  assert.equal(shown.container.querySelector('.ekd-avatar img').getAttribute('src'), '/a.png');
  assert.equal(shown.container.querySelector('.ekd-avatar img').getAttribute('alt'), '');
  assert.equal(shown.container.querySelector('li').textContent, 'ALAda Lovelace');
  await shown.unmount();
});

await it('The avatar is typed so that an unnamed picture, a missing colour and a mute stack do not compile', async () => {
  const { spawnSync } = await import('node:child_process');
  const { fileURLToPath } = await import('node:url');
  const root = fileURLToPath(new URL('..', import.meta.url));
  const tsc = spawnSync(
    process.execPath,
    [
      'node_modules/typescript/bin/tsc', '--noEmit', '--strict', '--skipLibCheck', '--jsx', 'react-jsx',
      '--module', 'esnext', '--moduleResolution', 'bundler', '--target', 'es2022', '--lib', 'es2022,dom',
      'scripts/fixtures/avatar-types.tsx',
    ],
    { cwd: root, encoding: 'utf8' },
  );
  assert.equal(tsc.status, 0, `scripts/fixtures/avatar-types.tsx does not compile:\n${tsc.stdout}${tsc.stderr}`);
});

await it('avatar.css maps each slot to its own colour and ink, keeps its ring, wraps, and holds nothing that moves', async () => {
  const { readFileSync } = await import('node:fs');
  const { spawnSync } = await import('node:child_process');
  const { fileURLToPath } = await import('node:url');
  const root = fileURLToPath(new URL('..', import.meta.url));
  const strip = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');
  const css = strip(readFileSync(new URL('../dist/styles/avatar.css', import.meta.url), 'utf8'));
  const block = (selector) => {
    const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(?:^|\\})\\s*${escaped}\\s*\\{([^}]*)\\}`).exec(css)?.[1];
  };

  // Ten slots, each mapped to its own two tokens and to no other: a rule that
  // named slot 7's ink for slot 6 would draw, and would pass nothing that is
  // measured about the pair it actually drew.
  const slotRules = [...css.matchAll(/\.ekd-avatar-slot-(\d+)\s*\{([^}]*)\}/g)];
  assert.deepEqual(slotRules.map((m) => Number(m[1])), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 'avatar.css does not map slots 1 to 10, once each');
  for (const [, n, body] of slotRules) {
    assert.match(body, new RegExp(`--ekd-avatar-solid:\\s*var\\(--collab-${n}\\);`), `slot ${n} is not on --collab-${n}`);
    assert.match(body, new RegExp(`--ekd-avatar-ink:\\s*var\\(--collab-${n}-ink\\);`), `slot ${n} is not in --collab-${n}-ink`);
  }

  // And each of those pairs is one `check:contrast` measures, at its threshold.
  const pairs = JSON.parse(
    spawnSync(process.execPath, ['scripts/check-contrast.mjs', '--pairs'], { cwd: root, encoding: 'utf8' }).stdout,
  );
  const threshold = (fg, bg) => pairs.find(([a, b]) => a === fg && b === bg)?.[2];
  for (let n = 1; n <= 10; n++) {
    assert.ok(threshold(`collab-${n}-ink`, `collab-${n}`) >= 4.5, `check:contrast does not hold the initials of slot ${n} at 4.5:1`);
    assert.ok(threshold(`collab-${n}`, 'bg-surface') >= 3, `check:contrast does not hold slot ${n} against the ring`);
    assert.ok(threshold(`collab-${n}`, 'bg-canvas') >= 3, `check:contrast does not hold slot ${n} against the canvas`);
  }
  // The neutral count, and the ring that marks the reader.
  assert.ok(threshold('fg-1', 'bg-surface-2') >= 4.5, 'the count\'s pair is not measured');
  assert.ok(threshold('fg-1', 'bg-surface') >= 4.5, 'the reader\'s ring is not measured');

  // The picture: a minimum that grows with its letters, a square, the sans
  // (the serif has no Greek), tokens for its ring, and no shadow for it.
  const picture = block('.ekd-avatar');
  assert.ok(picture, 'avatar.css has no rule for a picture');
  assert.match(picture, /min-inline-size:\s*var\(--ekd-avatar-size\)/, 'the circle is a fixed size, and cuts the letters of a reader who raised the text size');
  assert.ok(!/(?:^|[;\s])(?:inline-size|width|block-size|height)\s*:/.test(picture), 'the circle has a fixed size');
  assert.match(picture, /aspect-ratio:\s*1;/);
  assert.match(picture, /font-family:\s*var\(--font-sans\)/, 'the letters are not in the sans, which has Greek');
  assert.match(picture, /border:\s*2px solid var\(--bg-surface\)/, 'the ring is not the border in --bg-surface');
  assert.ok(!/box-shadow/.test(css), 'the ring is a shadow, which forced colours remove');
  assert.match(picture, /border-radius:\s*var\(--radius-pill\)/);
  assert.match(picture, /overflow:\s*hidden/);
  assert.match(picture, /background:\s*var\(--ekd-avatar-solid\)/);
  assert.match(picture, /color:\s*var\(--ekd-avatar-ink\)/);
  assert.match(block('.ekd-avatar--sm'), /--ekd-avatar-size:\s*var\(--sp-6\)/);
  assert.match(picture, /--ekd-avatar-size:\s*var\(--sp-7\)/);
  assert.match(block('.ekd-avatar--lg'), /--ekd-avatar-size:\s*var\(--sp-8\)/);
  for (const sized of ['.ekd-avatar', '.ekd-avatar--sm', '.ekd-avatar--lg']) {
    assert.match(block(sized), /font-size:\s*var\(--fs-(?:2xs|xs|sm)\)/, `${sized} has no type token`);
  }
  assert.match(block('.ekd-avatar-image'), /object-fit:\s*cover/);
  assert.match(block('.ekd-avatar-image'), /background:\s*var\(--bg-surface\)/, 'a transparent image shows the letters through');
  assert.match(css, /@media \(forced-colors: active\)\s*\{\s*\.ekd-avatar\s*\{\s*border-color:\s*CanvasText;/, 'in forced colours the circle has no edge');

  // The stack: it wraps, so ten large pictures at 320px are two lines and not
  // a scroll bar, and each item is positioned, which contains its hidden words.
  const stackRule = block('.ekd-avatar-stack');
  assert.match(stackRule, /flex-wrap:\s*wrap/);
  assert.match(stackRule, /list-style:\s*none/);
  assert.match(stackRule, /max-inline-size:\s*100%/);
  // The overlap is one number, taken by the items as a margin and by the list as
  // the padding that matches it, or the first picture is pulled out of the container.
  assert.match(stackRule, /--ekd-avatar-overlap:\s*var\(--sp-1\)/, 'the overlap is not 4px');
  assert.match(block('.ekd-avatar-stack--sm'), /--ekd-avatar-overlap:\s*calc\(var\(--sp-1\) \/ 2\)/, 'the small overlap is not 2px');
  assert.match(stackRule, /padding-inline-start:\s*var\(--ekd-avatar-overlap\)/, 'the first picture is pulled out of the container by the overlap');
  const item = block('.ekd-avatar-stack-item');
  assert.match(item, /position:\s*relative/, 'the hidden words are not contained by their item');
  assert.match(item, /margin-inline-start:\s*calc\(var\(--ekd-avatar-overlap\) \* -1\)/, 'the pictures do not overlap, or the list does not take the matching padding');
  assert.match(block('.ekd-avatar-stack-item:focus-within'), /z-index:\s*1/, 'a later picture covers the focus ring of an earlier one');
  assert.match(block('.ekd-avatar-stack-item[data-you="true"] .ekd-avatar'), /border-color:\s*var\(--fg-1\)/);
  const words = block('.ekd-avatar-text');
  assert.ok(words, 'the hidden words of an item are not hidden by this entry alone');
  for (const declaration of [/position:\s*absolute/, /width:\s*1px/, /height:\s*1px/, /overflow:\s*hidden/, /clip:\s*rect\(0, 0, 0, 0\)/]) {
    assert.match(words, declaration);
  }

  // Tokens, not literals: no colour, no font size, no font family but a token.
  assert.ok(!/#[0-9a-f]{3,8}\b|\b(?:rgb|hsl|oklch)a?\(/i.test(css), 'avatar.css carries a literal colour');
  assert.ok(!/font-size:\s*[^;]*\d(?:px|pt)\b/.test(css), 'avatar.css sets a type size in pixels');
  assert.ok(!/var\([^)]*,/.test(css), 'avatar.css writes a fallback into var()');
  assert.ok(!/text-transform/.test(css), 'avatar.css applies case');
  // Nothing moves, so there is nothing to reduce; the day something does, the
  // reduced-motion query comes with it.
  if (/transition|animation/.test(css)) {
    assert.match(css, /prefers-reduced-motion:\s*reduce/, 'avatar.css moves and does not respect a request for reduced motion');
  }

  // The same rules are in the two aggregates, and the entry is exported.
  for (const entry of ['base.css', 'components.css']) {
    const shipped = strip(readFileSync(new URL(`../dist/styles/${entry}`, import.meta.url), 'utf8'));
    assert.ok(shipped.includes(picture.trim()), `styles/${entry} does not carry the avatar`);
    assert.ok(shipped.includes(item.trim()), `styles/${entry} does not carry the avatar stack`);
  }
  const manifest = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  assert.equal(manifest.exports['./styles/avatar.css'], './dist/styles/avatar.css');
});

// --- The option list ------------------------------------------------------------
// The list at the text cursor. It never has focus, so half of it is three
// functions the application calls, and those are held first, with no document.
const COMMANDS = [
  { id: 'text', label: 'Text', detail: '/text' },
  { id: 'h1', label: 'Heading 1', detail: '/h1' },
  { id: 'h2', label: 'Heading 2', detail: '/h2' },
  { id: 'h3', label: 'Heading 3', detail: '/h3' },
  { id: 'bullet', label: 'Bulleted list', detail: '/bullet' },
  { id: 'numbered', label: 'Numbered list', detail: '/numbered' },
  { id: 'quote', label: 'Quotation', detail: '/quote' },
  { id: 'table', label: 'Table', detail: '/table' },
  { id: 'code', label: 'Code block', detail: '/code' },
  { id: 'image', label: 'Image', detail: '/image' },
  { id: 'callout', label: 'Callout' },
  { id: 'divider', label: 'Divider', detail: '/divider' },
];

await it('optionListKey answers every key of the list, and leaves the rest to the text', () => {
  const options = COMMANDS;
  const press = (init, activeId, extra) => optionListKey(typeof init === 'string' ? { key: init } : init, { options, activeId, ...extra });

  // Down and Up move by one, and stop at the ends: they do not wrap.
  assert.deepEqual(press('ArrowDown', 'text'), { activeId: 'h1' });
  assert.deepEqual(press('ArrowUp', 'h1'), { activeId: 'text' });
  assert.deepEqual(press('ArrowDown', 'divider'), { activeId: 'divider' }, 'Down wrapped, or gave the key back to the text');
  assert.deepEqual(press('ArrowUp', 'text'), { activeId: 'text' }, 'Up wrapped, or gave the key back to the text');
  // With no active option, and with one that has been filtered away.
  assert.deepEqual(press('ArrowDown', null), { activeId: 'text' });
  assert.deepEqual(press('ArrowUp', null), { activeId: 'divider' });
  assert.deepEqual(press('ArrowDown', 'gone'), { activeId: 'text' });
  // Home and End are the text's: a document has lines, and the keys go to
  // the start and the end of one. With an option active and with none.
  for (const activeId of ['quote', null]) {
    assert.equal(press('Home', activeId), null, 'Home was taken from the text');
    assert.equal(press('End', activeId), null, 'End was taken from the text');
  }
  // A page is maxVisible, eight unless given, and stops at the ends.
  assert.deepEqual(press('PageDown', 'text'), { activeId: 'code' });
  assert.deepEqual(press('PageDown', 'code'), { activeId: 'divider' });
  assert.deepEqual(press('PageUp', 'divider'), { activeId: 'h3' });
  assert.deepEqual(press('PageUp', 'h3'), { activeId: 'text' });
  assert.deepEqual(press('PageDown', 'text', { maxVisible: 3 }), { activeId: 'h3' });
  assert.deepEqual(press('PageUp', 'h3', { maxVisible: 3 }), { activeId: 'text' });
  // With no active option a Page key enters the list as Down and Up do: at
  // the first option and at the last.
  assert.deepEqual(press('PageDown', null), { activeId: 'text' });
  assert.deepEqual(press('PageUp', null), { activeId: 'divider' });
  assert.deepEqual(press('PageDown', 'gone'), { activeId: 'text' });
  assert.deepEqual(press('PageUp', 'gone'), { activeId: 'divider' });
  // Enter chooses the active option, and is the text's where there is none.
  assert.deepEqual(press('Enter', 'h2'), { select: 'h2' });
  assert.equal(press('Enter', null), null);
  assert.equal(press('Enter', 'gone'), null);
  assert.deepEqual(press('Escape', 'h2'), { dismiss: true });

  // Every other key reaches the text, which is what filters the list.
  for (const key of ['a', '/', ' ', 'Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'Tab', 'Shift', 'F1', 'Dead', 'Process']) {
    assert.equal(press(key, 'h2'), null, `${key} was taken from the text`);
  }

  // Which keys are a move in the list: the ones that name an option, and no
  // other. Choosing, dismissing and every key of the text end the moving,
  // and so does a closed list, which the application passes as null.
  // Each is asked with the writer moving before the key and with the writer
  // not: for a key that is not a modifier, what went before does not matter.
  const moving = (init, activeId, previous) => {
    const event = typeof init === 'string' ? { key: init } : init;
    return optionListNavigating(event, press(event, activeId), previous);
  };
  for (const previous of [true, false]) {
    for (const key of ['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp']) {
      assert.equal(moving(key, 'h2', previous), true, `${key} did not begin a move in the list`);
      assert.equal(moving(key, null, previous), true, `${key} from the text did not begin a move in the list`);
    }
    // At an end the key is still a move: the writer is still in the list.
    assert.equal(moving('ArrowDown', 'divider', previous), true);
    for (const key of ['Enter', 'Escape', 'a', 'Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'Tab', 'Process', 'Insert']) {
      assert.equal(moving(key, 'h2', previous), false, `${key} left the writer moving in the list`);
    }
    // A closed list, which the application passes as null.
    assert.equal(optionListNavigating({ key: 'a' }, null, previous), false);
    assert.equal(optionListNavigating({ key: 'ArrowDown' }, null, previous), false, 'a closed list has a move in it');
    assert.equal(moving({ key: 'ArrowDown', isComposing: true }, 'h2', previous), false);
    // A chord is a key of the text's or the platform's, and ends the move.
    assert.equal(moving({ key: 'ArrowDown', shiftKey: true }, 'h2', previous), false);
    assert.equal(moving({ key: 'c', ctrlKey: true }, 'h2', previous), false);
    // A modifier going down by itself is no key of the list's and none of
    // the text's. Control silences a screen reader and CapsLock begins its
    // commands: the writer is where they were, moving or not. Each arrives
    // as a browser sends it, with its own flag set where it has one.
    for (const [key, flag] of [
      ['Control', 'ctrlKey'], ['Shift', 'shiftKey'], ['Alt', 'altKey'], ['Meta', 'metaKey'],
      ['AltGraph'], ['CapsLock'], ['NumLock'], ['ScrollLock'], ['Fn'], ['OS'],
    ]) {
      const event = flag ? { key, [flag]: true } : { key };
      assert.equal(press(event, 'h2'), null, `${key} by itself was taken from the text`);
      assert.equal(moving(event, 'h2', previous), previous, `${key} by itself ${previous ? 'ended' : 'began'} a move in the list`);
      assert.equal(optionListNavigating(event, null, previous), previous, `${key} by itself changed the move with the list closed`);
    }
  }
  // A held modifier is the selection's or the platform's.
  for (const modifier of ['shiftKey', 'altKey', 'ctrlKey', 'metaKey']) {
    for (const key of ['ArrowDown', 'ArrowUp', 'Home', 'End', 'PageDown', 'PageUp', 'Enter']) {
      assert.equal(press({ key, [modifier]: true }, 'h2'), null, `${modifier} with ${key} was taken`);
    }
  }
  // An input method composing: Enter commits its candidate and the arrows
  // move through its window. Three ways an event says so.
  for (const key of ['Enter', 'ArrowDown', 'ArrowUp', 'Escape', 'Home', 'End', 'PageDown', 'PageUp']) {
    assert.equal(press({ key, isComposing: true }, 'h2'), null, `${key} was taken during composition`);
    assert.equal(press({ key, keyCode: 229 }, 'h2'), null, `${key} was taken at keyCode 229`);
    assert.equal(press({ key, nativeEvent: { isComposing: true } }, 'h2'), null, `${key} was taken from a React event`);
  }
  // A real event, as the DOM builds it.
  assert.deepEqual(press(new window.KeyboardEvent('keydown', { key: 'ArrowDown' }), 'text'), { activeId: 'h1' });
  assert.equal(press(new window.KeyboardEvent('keydown', { key: 'Enter', isComposing: true }), 'text'), null);

  // Nothing to move through: only Escape is the list's.
  for (const key of ['ArrowDown', 'ArrowUp', 'Home', 'End', 'PageDown', 'PageUp', 'Enter']) {
    assert.equal(optionListKey({ key }, { options: [], activeId: null }), null, `${key} was taken by an empty list`);
  }
  assert.deepEqual(optionListKey({ key: 'Escape' }, { options: [], activeId: null }), { dismiss: true });
});

await it('optionListAttributes gives the text region two attributes while the list shows, names the active option only during a move, and takes them off', () => {
  // The whole set, and nothing else. Not `aria-autocomplete`, whose value
  // WAI-ARIA 1.2 says is not to be changed to say that a list is showing;
  // not `aria-haspopup`, which was owed to it; not `aria-expanded`, which a
  // textbox does not support; and no role.
  const NAMES = ['aria-activedescendant', 'aria-controls'];
  const open = optionListAttributes('slash', { open: true, options: COMMANDS, activeId: 'h1', navigating: true });
  assert.deepEqual(open, {
    'aria-controls': 'slash',
    'aria-activedescendant': 'slash-option-h1',
  });
  assert.equal(open['aria-activedescendant'], optionListOptionId('slash', 'h1'));
  assert.deepEqual(Object.keys(open).sort(), NAMES);

  // An option is active from the first render, and is not named until the
  // writer has moved in the list: typing the query is not a move.
  assert.deepEqual(optionListAttributes('slash', { open: true, options: COMMANDS, activeId: 'h1', navigating: false }), {
    'aria-controls': 'slash',
    'aria-activedescendant': undefined,
  }, 'the active option was named while the query was being typed');

  // No active option, or one that is not in the list: nothing is named.
  for (const activeId of [null, 'gone']) {
    const none = optionListAttributes('slash', { open: true, options: COMMANDS, activeId, navigating: true });
    assert.equal(none['aria-activedescendant'], undefined, 'an option that is not in the document was named');
    assert.equal(none['aria-controls'], 'slash');
  }
  // Closed, and open with nothing in it: there is no listbox to point at.
  for (const state of [
    { open: false, options: COMMANDS, activeId: 'h1', navigating: true },
    { open: true, options: [], activeId: null, navigating: true },
  ]) {
    const off = optionListAttributes('slash', state);
    // Every key present and undefined, so a spread removes what the last one set.
    assert.deepEqual(Object.keys(off).sort(), NAMES);
    assert.ok(Object.values(off).every((value) => value === undefined), 'an attribute outlived the list');
  }
});

await it('placeOptionList puts the list under the cursor, above it for want of room, and inside the viewport', () => {
  const desktop = { width: 1280, height: 800 };
  const size = { width: 320, height: 266 };
  const caret = (x, y) => ({ x, y, width: 1, height: 20 });

  // Room below: under the cursor, at its start edge, a gap away.
  assert.deepEqual(placeOptionList({ anchor: caret(400, 200), size, viewport: desktop }), {
    x: 400, y: 224, placement: 'below', maxHeight: null,
  });
  // The last place it fits below, to the pixel: 224 + 266 is 784, the viewport less the gutter.
  assert.equal(placeOptionList({ anchor: caret(400, 494), size, viewport: desktop }).placement, 'below');
  // No room below: above, its bottom edge a gap over the cursor.
  assert.deepEqual(placeOptionList({ anchor: caret(400, 495), size, viewport: desktop }), {
    x: 400, y: 225, placement: 'above', maxHeight: null,
  });
  assert.deepEqual(placeOptionList({ anchor: caret(400, 700), size, viewport: desktop }), {
    x: 400, y: 430, placement: 'above', maxHeight: null,
  });

  // Near the right edge: moved in, a gutter from the edge.
  assert.equal(placeOptionList({ anchor: caret(1200, 200), size, viewport: desktop }).x, 1280 - 16 - 320);
  // Near the left edge, as a list that ends at the cursor would be.
  assert.equal(placeOptionList({ anchor: caret(100, 200), size, viewport: desktop, rtl: true }).x, 16);
  // Right to left with room: the list ends where the cursor is.
  assert.equal(placeOptionList({ anchor: caret(900, 200), size, viewport: desktop, rtl: true }).x, 901 - 320);

  // 320 CSS pixels wide. The stylesheet makes the list 288 there; wherever
  // the cursor is, it runs from one gutter to the other and no further.
  const phone = { width: 320, height: 568 };
  const narrow = { width: 288, height: 266 };
  for (const x of [0, 16, 160, 300, 319]) {
    const placed = placeOptionList({ anchor: caret(x, 100), size: narrow, viewport: phone });
    assert.equal(placed.x, 16, `at ${x} the list left the viewport`);
    assert.ok(placed.x + narrow.width <= phone.width - 16);
  }
  // A list wider than the viewport, which the stylesheet prevents: the start edge is kept.
  assert.equal(placeOptionList({ anchor: caret(300, 100), size, viewport: { width: 300, height: 568 } }).x, 16);

  // 200% zoom: 1280 by 720 is 640 by 360 in CSS pixels, and the list fits
  // on neither side of a cursor in the middle. It takes the side with more
  // room and is held to that room, so the line being typed in stays in view.
  const zoomed = { width: 640, height: 360 };
  assert.deepEqual(placeOptionList({ anchor: caret(200, 180), size, viewport: zoomed }), {
    x: 200, y: 16, placement: 'above', maxHeight: 160,
  });
  assert.deepEqual(placeOptionList({ anchor: caret(200, 100), size, viewport: zoomed }), {
    x: 200, y: 124, placement: 'below', maxHeight: 220,
  });
  // A viewport a few lines tall, with under two rows of room on either side:
  // the list takes the viewport's height and covers the cursor.
  assert.deepEqual(placeOptionList({ anchor: caret(200, 65), size, viewport: { width: 640, height: 150 } }), {
    x: 200, y: 16, placement: 'below', maxHeight: 118,
  });
  // In every case the box is inside the viewport, a gutter from each edge.
  for (const viewport of [desktop, phone, zoomed, { width: 320, height: 256 }]) {
    const fits = { width: Math.min(320, viewport.width - 32), height: 266 };
    for (const x of [-500, 0, viewport.width / 2, viewport.width, viewport.width + 500]) {
      for (const y of [-500, 0, viewport.height / 2, viewport.height - 10, viewport.height + 500]) {
        const placed = placeOptionList({ anchor: caret(x, y), size: fits, viewport });
        const height = placed.maxHeight ?? fits.height;
        const where = `cursor ${x},${y} in ${viewport.width}x${viewport.height}`;
        assert.ok(placed.x >= 16 && placed.x + fits.width <= viewport.width - 16, `${where}: off the side`);
        assert.ok(placed.y >= 16 && placed.y + height <= viewport.height - 16, `${where}: off the top or the bottom`);
        assert.ok(height >= Math.min(64, viewport.height - 32), `${where}: a list ${height}px high`);
      }
    }
  }

  // A cursor that has scrolled out of view is treated as on the nearest edge.
  assert.deepEqual(placeOptionList({ anchor: caret(400, -300), size, viewport: desktop }), {
    x: 400, y: 20, placement: 'below', maxHeight: null,
  });
  assert.deepEqual(placeOptionList({ anchor: caret(400, 2000), size, viewport: desktop }), {
    x: 400, y: 514, placement: 'above', maxHeight: null,
  });
  assert.equal(placeOptionList({ anchor: caret(-900, 200), size, viewport: desktop }).x, 16);
  assert.equal(placeOptionList({ anchor: caret(5000, 200), size, viewport: desktop }).x, 944);

  // The viewport is a rectangle: where a person can see, in the anchor's
  // coordinates. A phone of 390 by 844 with an on-screen keyboard over the
  // lower 40%: 506 pixels are left. By the layout viewport the list would go
  // under a cursor at 300, down to 590, behind the keyboard. It fits above.
  const phoneSize = { width: 358, height: 266 };
  const keyboard = { x: 0, y: 0, width: 390, height: 506 };
  assert.deepEqual(placeOptionList({ anchor: caret(40, 300), size: phoneSize, viewport: { width: 390, height: 844 } }), {
    x: 16, y: 324, placement: 'below', maxHeight: null,
  });
  assert.deepEqual(placeOptionList({ anchor: caret(40, 300), size: phoneSize, viewport: keyboard }), {
    x: 16, y: 30, placement: 'above', maxHeight: null,
  }, 'the list went behind the keyboard');
  // The browser has scrolled the visual viewport up the layout viewport to
  // keep the cursor above the keyboard, by 200. The list fits under the
  // cursor inside what shows, and its bottom is above the keyboard's top.
  const pushed = placeOptionList({ anchor: caret(40, 380), size: phoneSize, viewport: { ...keyboard, y: 200 } });
  assert.deepEqual(pushed, { x: 16, y: 404, placement: 'below', maxHeight: null });
  assert.ok(pushed.y + phoneSize.height <= 200 + 506 - 16);
  // Pinch-zoomed to twice the size: 640 by 400 of a 1280 by 800 page shows,
  // starting 500 across and 300 down. Every edge is the visual viewport's.
  const pinched = { x: 500, y: 300, width: 640, height: 400 };
  assert.deepEqual(placeOptionList({ anchor: caret(700, 400), size, viewport: pinched }), {
    x: 700, y: 424, placement: 'below', maxHeight: 260,
  });
  assert.deepEqual(placeOptionList({ anchor: caret(700, 600), size, viewport: pinched }), {
    x: 700, y: 330, placement: 'above', maxHeight: null,
  });
  // A cursor outside what shows is on its nearest edge, and the list is
  // moved in from each side of what shows, not of the page.
  assert.equal(placeOptionList({ anchor: caret(100, 400), size, viewport: pinched }).x, 500 + 16);
  assert.equal(placeOptionList({ anchor: caret(1200, 400), size, viewport: pinched }).x, 500 + 640 - 16 - 320);
  assert.equal(placeOptionList({ anchor: caret(700, 100), size, viewport: pinched }).y, 300 + 16 + 4);
  for (const x of [0, 500, 820, 1140, 1280]) {
    for (const y of [0, 300, 500, 700, 800]) {
      const placed = placeOptionList({ anchor: caret(x, y), size, viewport: pinched });
      const height = placed.maxHeight ?? size.height;
      assert.ok(placed.x >= 516 && placed.x + size.width <= 1124, `cursor ${x},${y}: off the side of what shows`);
      assert.ok(placed.y >= 316 && placed.y + height <= 684, `cursor ${x},${y}: off the top or the bottom of what shows`);
    }
  }
});

await it('OptionList is a listbox that never takes focus: one option active, a press chooses, a press outside dismisses', async () => {
  const log = [];
  const list = (props) =>
    h('div', null,
      h('div', { id: 'text', role: 'textbox', 'aria-multiline': 'true', 'aria-label': 'Document', tabIndex: 0,
        ...optionListAttributes('slash', { open: props.open ?? true, options: props.options ?? COMMANDS, activeId: props.activeId ?? null, navigating: true }) }),
      h(OptionList, {
        id: 'slash', label: 'Blocks', open: true, options: COMMANDS, activeId: null,
        onActiveChange: (id) => log.push(`active ${id}`),
        onSelect: (id) => log.push(`select ${id}`),
        onDismiss: (reason) => log.push(`dismiss ${reason}`),
        anchor: { x: 400, y: 200, width: 1, height: 20 },
        empty: 'No block matches.', status: '12 blocks', announceAfterMs: 40,
        ...props,
      }),
    );

  // Closed: the status region, empty, and nothing else in the document, and
  // the text region says nothing of a list. The region stays because it is
  // what says that the list has closed, and a region that went with the list
  // could not.
  const view = await mount(list({ open: false }));
  const text = document.getElementById('text');
  assert.equal(view.container.querySelector('.ekd-option-list'), null, 'a closed list left an element behind');
  assert.deepEqual([...view.container.querySelectorAll('[role]')].map((el) => el.getAttribute('role')), ['textbox', 'status'], 'a closed list left a role behind');
  assert.ok(!document.getElementById('slash'), 'a closed list left its listbox behind');
  assert.equal(view.container.children[0].children.length, 2);
  const live = view.container.querySelector('[role="status"]');
  assert.equal(live.outerHTML, '<span class="ekd-option-list-announce" role="status"></span>', 'the region of a list that was never open holds something');
  // So nothing of a closed list can be reached: no option, and no popover
  // waiting to be shown.
  assert.equal(document.querySelectorAll('[role="listbox"], [role="option"], [popover], [id^="slash"]').length, 0, 'a closed list left something a reader can reach');
  for (const name of ['aria-controls', 'aria-activedescendant', 'aria-autocomplete', 'aria-haspopup', 'aria-expanded']) {
    assert.ok(!text.hasAttribute(name), `${name} on the text with the list closed`);
  }

  await act(async () => text.focus());
  assert.ok(document.activeElement === text, 'the case lost the focus it is about');

  await view.rerender(list({ activeId: 'h1' }));
  const box = view.container.querySelector('.ekd-option-list');
  const listbox = document.getElementById('slash');
  const options = () => [...listbox.querySelectorAll('[role="option"]')];
  assert.equal(document.activeElement, text, 'opening the list moved focus');

  // A listbox, named, holding options and nothing else.
  assert.equal(listbox.getAttribute('role'), 'listbox');
  assert.equal(listbox.getAttribute('aria-label'), 'Blocks');
  assert.equal(options().length, 12);
  assert.deepEqual([...listbox.children].map((child) => child.getAttribute('role')), Array(12).fill('option'));
  // Each option has the id the application can derive, and no two share one.
  assert.deepEqual(options().map((o) => o.id), COMMANDS.map((c) => `slash-option-${c.id}`));
  assert.deepEqual(options().map((o) => o.id), COMMANDS.map((c) => optionListOptionId('slash', c.id)));
  assert.equal(new Set(options().map((o) => o.id)).size, 12);
  // The label and the detail are both the option's text.
  assert.equal(options()[1].querySelector('.ekd-option-label').textContent, 'Heading 1');
  assert.equal(options()[1].querySelector('.ekd-option-detail').textContent, '/h1');
  assert.equal(options()[10].querySelector('.ekd-option-detail'), null, 'an option with no detail drew an empty one');
  // Exactly one is selected, and it is the active one.
  const selected = () => options().filter((o) => o.getAttribute('aria-selected') === 'true').map((o) => o.id);
  assert.deepEqual(selected(), ['slash-option-h1']);
  assert.ok(options().every((o) => ['true', 'false'].includes(o.getAttribute('aria-selected'))));
  // Nothing in it is a control, and nothing in it is a Tab stop. The listbox
  // says so itself: it scrolls once it holds more than `maxVisible` options,
  // and Chromium and Firefox put a box that scrolls and holds nothing
  // focusable in the Tab order by themselves, so Tab from the text went into
  // the list. jsdom has no Tab order and no layout, so what is held here is
  // the attribute; where Tab goes was read in Chromium, with 13 options.
  assert.equal(box.querySelectorAll('button, a, input, select, textarea, [contenteditable]').length, 0, 'something in the list takes focus');
  assert.equal(listbox.getAttribute('tabindex'), '-1', 'the listbox is a Tab stop where it scrolls');
  assert.deepEqual([...box.querySelectorAll('[tabindex]')], [listbox], 'something else in the list has a tabindex');
  assert.ok(!box.hasAttribute('tabindex'), 'the surface has a tabindex, and it does not scroll');
  // What the text region points at exists, and is what it says it is.
  assert.ok(document.getElementById(text.getAttribute('aria-controls')) === listbox, 'aria-controls does not name the listbox');
  assert.ok(document.getElementById(text.getAttribute('aria-activedescendant')) === options()[1], 'aria-activedescendant does not name the active option');
  assert.equal(text.getAttribute('role'), 'textbox');
  for (const name of ['aria-autocomplete', 'aria-haspopup', 'aria-expanded']) {
    assert.ok(!text.hasAttribute(name), `${name} was set to say that the list is open`);
  }
  // The detail is part of the option's name unless the product takes it out.
  assert.ok(!options()[1].querySelector('.ekd-option-detail').hasAttribute('aria-hidden'), 'the detail was hidden from the name by default');
  await view.rerender(list({ activeId: 'h1', detailInName: false }));
  const details = [...listbox.querySelectorAll('.ekd-option-detail')];
  assert.equal(details.length, 11);
  assert.ok(details.every((detail) => detail.getAttribute('aria-hidden') === 'true'), 'detailInName={false} left a detail in a name');
  assert.equal(options()[1].querySelector('.ekd-option-detail').textContent, '/h1', 'the detail left the page with the name');
  assert.ok(!options()[1].querySelector('.ekd-option-label').hasAttribute('aria-hidden'));
  await view.rerender(list({ activeId: 'h1' }));
  // The live region is after the list and not in it, and it is the element
  // that was there while the list was closed: a region put in the document
  // as the list opens is a new one, and would be a new one again at closing.
  // Elements are compared with `===` inside `assert.ok`, here and below.
  // `assert.equal` of two elements that differ writes both out to say how,
  // and an element of jsdom leads to its whole document: the process ran out
  // of memory and was killed before it could name the assertion.
  assert.equal(view.container.querySelectorAll('[role="status"]').length, 1);
  assert.ok(view.container.querySelector('[role="status"]') === live, 'opening the list replaced the status region: the element that says the closing is not the one that was in the page');
  assert.ok(box.nextElementSibling === live, 'the status region is not the element after the list');
  assert.ok(!live.hasAttribute('aria-live'), 'aria-live restates the role');

  // The active option follows the prop, and none is active when none is given.
  await view.rerender(list({ activeId: 'quote' }));
  assert.deepEqual(selected(), ['slash-option-quote']);
  await view.rerender(list({ activeId: null }));
  assert.deepEqual(selected(), []);
  await view.rerender(list({ activeId: 'h1' }));

  // A press on an option: the default of both events is prevented, which is
  // what keeps focus and the selection in the text, and the click chooses.
  const fire = async (target, type) => {
    const event = new window.Event(type, { bubbles: true, cancelable: true });
    await act(async () => target.dispatchEvent(event));
    return event;
  };
  const row = options()[2];
  assert.ok((await fire(row.querySelector('.ekd-option-label'), 'pointerdown')).defaultPrevented, 'pointerdown on an option would move focus');
  assert.ok((await fire(row.querySelector('.ekd-option-label'), 'mousedown')).defaultPrevented, 'mousedown on an option would move focus');
  assert.deepEqual(log, [], 'a press inside the list dismissed it, or chose before the click');
  await act(async () => row.querySelector('.ekd-option-label').click());
  assert.deepEqual(log, ['select h2']);
  assert.equal(document.activeElement, text, 'choosing an option moved focus out of the text');
  // The padding round the rows and the empty text are the list too.
  assert.ok((await fire(box, 'mousedown')).defaultPrevented, 'a press on the edge of the list would move focus');
  assert.ok((await fire(box, 'pointerdown')).defaultPrevented);
  assert.equal(log.length, 1);
  // Anywhere on the list, the listbox itself among them. `tabindex="-1"`
  // makes the listbox a box a press can focus, on its scrollbar as well,
  // which a box with no tabindex is not: in Chromium such a press took focus
  // from the text unless its default was prevented. A press in jsdom moves no
  // focus, so the prevented default is what is held, on every element.
  for (const target of [box, ...box.querySelectorAll('*')]) {
    const name = target.id || target.className;
    for (const type of ['pointerdown', 'mousedown']) {
      assert.ok((await fire(target, type)).defaultPrevented, `${type} on ${name} would move focus out of the text`);
      assert.equal(document.activeElement, text, `${type} on ${name} moved focus`);
    }
  }
  assert.equal(log.length, 1, 'a press that went down on the list chose an option or dismissed the list');
  // The context menu is the browser's and is not taken: what keeps a
  // right-click from moving the selection is the stylesheet, held below.
  assert.ok(!(await fire(row, 'contextmenu')).defaultPrevented, 'the context menu was prevented on an option');
  assert.equal(log.length, 1, 'a right-click chose an option or dismissed the list');

  // The pointer moving onto another option makes it the active one, through
  // the application. Moving on the active one says nothing.
  log.length = 0;
  await fire(options()[4], 'pointermove');
  assert.deepEqual(log, ['active bullet']);
  await fire(options()[1], 'pointermove');
  assert.deepEqual(log, ['active bullet'], 'the active option reported itself');
  assert.deepEqual(selected(), ['slash-option-h1'], 'the control changed the active option by itself');
  assert.equal(document.activeElement, text, 'hover moved focus');

  // A press outside dismisses, with the reason. The text is outside too.
  log.length = 0;
  await fire(text, 'pointerdown');
  assert.deepEqual(log, ['dismiss press-outside']);
  await fire(document.body, 'pointerdown');
  assert.equal(log.length, 2);
  // A handler that stops the event on its way up does not keep the list open.
  const stop = (event) => event.stopPropagation();
  text.addEventListener('pointerdown', stop);
  await fire(text, 'pointerdown');
  text.removeEventListener('pointerdown', stop);
  assert.equal(log.length, 3, 'an editor that stops pointerdown kept the list open');

  // A finger or a pen outside the list. Going down it may be the start of a
  // pan or a pinch, so it dismisses when it lifts, and not at all where the
  // browser took the gesture and said so with `pointercancel`. These are
  // synthetic events: what a device sends for a pan is not run here.
  const point = (target, type, pointerType, pointerId = 1) => {
    const event = Object.assign(new window.Event(type, { bubbles: true, cancelable: true }), { pointerType, pointerId });
    return act(async () => target.dispatchEvent(event));
  };
  log.length = 0;
  for (const kind of ['touch', 'pen']) {
    // A tap: down, then up.
    await point(text, 'pointerdown', kind);
    assert.deepEqual(log, [], `a ${kind} going down outside dismissed the list before it lifted`);
    await point(text, 'pointerup', kind);
    assert.deepEqual(log, ['dismiss press-outside'], `a ${kind} tap outside did not dismiss the list`);
    await point(text, 'pointerup', kind);
    assert.equal(log.length, 1, `one ${kind} tap dismissed twice`);
    log.length = 0;
    // A pan: down, then the browser takes it. Nothing lifts that went down.
    await point(document.body, 'pointerdown', kind);
    await point(document.body, 'pointercancel', kind);
    await point(document.body, 'pointerup', kind);
    assert.deepEqual(log, [], `a ${kind} that became a pan dismissed the list`);
    // A pinch: two go down, and the browser takes both.
    await point(document.body, 'pointerdown', kind, 1);
    await point(document.body, 'pointerdown', kind, 2);
    await point(document.body, 'pointercancel', kind, 1);
    await point(document.body, 'pointercancel', kind, 2);
    assert.deepEqual(log, [], `a ${kind} pinch dismissed the list`);
    // It is the pointer that went down outside that dismisses, and no other.
    await point(document.body, 'pointerdown', kind, 1);
    await point(document.body, 'pointerup', kind, 2);
    assert.deepEqual(log, [], `a ${kind} that never went down dismissed the list by lifting`);
    await point(document.body, 'pointercancel', kind, 1);
    // One that went down on the list is not a press outside wherever it lifts.
    await point(options()[3], 'pointerdown', kind);
    await point(document.body, 'pointerup', kind);
    assert.deepEqual(log, [], `a ${kind} that went down on the list dismissed it`);
  }
  // A mouse is as it was: it dismisses going down, and once.
  await point(text, 'pointerdown', 'mouse');
  assert.deepEqual(log, ['dismiss press-outside'], 'a mouse press outside waited for the button to come up');
  await point(text, 'pointerup', 'mouse');
  assert.equal(log.length, 1, 'one mouse press dismissed twice');

  // Closed, it listens for nothing.
  log.length = 0;
  await view.rerender(list({ open: false }));
  assert.ok(!document.getElementById('slash'), 'closing left the listbox behind');
  assert.ok(view.container.querySelector('[role="status"]') === live, 'closing the list replaced the status region: a region put in the page as the list closes is not certain to be spoken');
  await fire(document.body, 'pointerdown');
  await point(document.body, 'pointerdown', 'touch');
  await point(document.body, 'pointerup', 'touch');
  assert.deepEqual(log, [], 'a closed list still dismisses');

  // No options: no listbox, since a listbox owes an option, and the empty
  // text in its place. The text region then points at nothing.
  await view.rerender(list({ options: [], activeId: null }));
  assert.ok(!view.container.querySelector('[role="listbox"]'), 'a listbox with no option in it was rendered');
  assert.ok(!view.container.querySelector('[role="option"]'), 'an option was rendered for an empty list');
  assert.equal(view.container.querySelector('.ekd-option-list-empty').textContent, 'No block matches.');
  assert.ok(!text.hasAttribute('aria-controls') && !text.hasAttribute('aria-activedescendant'));
  assert.ok((await fire(view.container.querySelector('.ekd-option-list-empty'), 'mousedown')).defaultPrevented);
  await view.unmount();
});

await it('OptionList is placed at its anchor, placed again on scroll and resize, and keeps the active option in view', async () => {
  // jsdom lays nothing out: every box is 0 by 0 at 0,0 and the viewport is 0
  // wide. The case supplies the geometry a browser would, and holds what the
  // component does with it. A row is 32px, the list shows eight, and the
  // viewport is 1280 by 800.
  const ROW = 32;
  const root = document.documentElement;
  Object.defineProperty(root, 'clientWidth', { value: 1280, configurable: true });
  Object.defineProperty(root, 'clientHeight', { value: 800, configurable: true });
  const scroll = new WeakMap();
  const rectOf = (element) => {
    const rect = (top, height, width = 320) => ({ x: 0, y: top, top, left: 0, width, height, bottom: top + height, right: width });
    if (element.classList.contains('ekd-option-list')) return rect(0, 8 * ROW + 10);
    if (element.getAttribute('role') === 'listbox') return rect(100, 8 * ROW);
    if (element.getAttribute('role') === 'option') {
      const listbox = element.parentElement;
      return rect(100 + [...listbox.children].indexOf(element) * ROW - listbox.scrollTop, ROW);
    }
    return rect(0, 0, 0);
  };
  const native = window.HTMLElement.prototype.getBoundingClientRect;
  window.HTMLElement.prototype.getBoundingClientRect = function patched() { return rectOf(this); };
  // jsdom keeps no scroll position, so the listbox is given one that holds.
  const scrollTop = Object.getOwnPropertyDescriptor(window.Element.prototype, 'scrollTop');
  Object.defineProperty(window.Element.prototype, 'scrollTop', {
    configurable: true,
    get() { return scroll.get(this) ?? 0; },
    set(value) { scroll.set(this, Math.max(0, value)); },
  });

  let cursor = { x: 400, y: 200, width: 1, height: 20 };
  let reads = 0;
  const list = (props) => h(OptionList, {
    id: 'slash', label: 'Blocks', open: true, options: COMMANDS, activeId: 'text',
    onActiveChange() {}, onSelect() {}, onDismiss() {},
    anchor: () => { reads++; return cursor; },
    empty: 'No block matches.', status: '12 blocks', ...props,
  });
  const view = await mount(list({}));
  const box = view.container.querySelector('.ekd-option-list');
  const listbox = document.getElementById('slash');
  const at = () => `${box.style.left} ${box.style.top} ${box.dataset.placement}`;

  // Under the cursor, by the style attribute and nothing else.
  assert.equal(at(), '400px 224px below');
  assert.equal(document.querySelectorAll('style').length, 0, 'the component injected a stylesheet');
  // The page scrolls and the cursor moves with it: the list is placed again, from a fresh reading.
  const before = reads;
  cursor = { x: 400, y: 700, width: 1, height: 20 };
  await act(async () => document.dispatchEvent(new window.Event('scroll')));
  assert.ok(reads > before, 'a scroll did not read the cursor again');
  assert.equal(at(), '400px 430px above', 'a scroll left the list where it was');
  // A container the text is in scrolls: the event does not bubble, and is still heard.
  cursor = { x: 1200, y: 200, width: 1, height: 20 };
  const scroller = document.createElement('div');
  document.body.appendChild(scroller);
  await act(async () => scroller.dispatchEvent(new window.Event('scroll')));
  assert.equal(at(), '944px 224px below', 'a scrolling container left the list where it was');
  scroller.remove();
  // The window changes size.
  Object.defineProperty(root, 'clientWidth', { value: 320, configurable: true });
  await act(async () => window.dispatchEvent(new window.Event('resize')));
  assert.equal(box.style.left, '16px', 'a resize left the list where it was');
  Object.defineProperty(root, 'clientWidth', { value: 1280, configurable: true });
  await act(async () => window.dispatchEvent(new window.Event('resize')));
  assert.equal(at(), '944px 224px below');
  // The list's own scrolling places nothing.
  const quiet = reads;
  await act(async () => listbox.dispatchEvent(new window.Event('scroll')));
  assert.equal(reads, quiet, 'scrolling the list placed it again');
  // A cursor that is gone leaves the list where it is.
  cursor = null;
  Object.defineProperty(root, 'clientWidth', { value: 320, configurable: true });
  await act(async () => window.dispatchEvent(new window.Event('resize')));
  assert.equal(at(), '944px 224px below', 'a cursor that is gone moved the list');
  Object.defineProperty(root, 'clientWidth', { value: 1280, configurable: true });
  cursor = { x: 400, y: 200, width: 1, height: 20 };
  // A plain rectangle is placed too, and again when it changes.
  await view.rerender(list({ anchor: { x: 500, y: 300, width: 1, height: 20 } }));
  assert.equal(at(), '500px 324px below');
  await view.rerender(list({ anchor: { x: 520, y: 300, width: 1, height: 20 } }));
  assert.equal(at(), '520px 324px below');

  // The active option in view. Eight rows show; the ninth is below the fold.
  assert.equal(listbox.scrollTop, 0);
  await view.rerender(list({ activeId: 'table' }));
  assert.equal(listbox.scrollTop, 0, 'the eighth option was in view and the list scrolled');
  await view.rerender(list({ activeId: 'code' }));
  assert.equal(listbox.scrollTop, ROW, 'the ninth option was left under the fold');
  await view.rerender(list({ activeId: 'divider' }));
  assert.equal(listbox.scrollTop, 4 * ROW, 'End left the last option under the fold');
  // Back up: by as little as shows it, so the list does not jump.
  await view.rerender(list({ activeId: 'callout' }));
  assert.equal(listbox.scrollTop, 4 * ROW, 'an option in view scrolled the list');
  await view.rerender(list({ activeId: 'h2' }));
  assert.equal(listbox.scrollTop, 2 * ROW, 'an option above the fold was left there');
  await view.rerender(list({ activeId: 'text' }));
  assert.equal(listbox.scrollTop, 0);
  // A scroll of the page while the list is scrolled does not lose its place.
  await view.rerender(list({ activeId: 'divider' }));
  await act(async () => document.dispatchEvent(new window.Event('scroll')));
  assert.equal(listbox.scrollTop, 4 * ROW, 'placing the list again reset its scroll position');

  // Where the browser has the Popover API the list goes to the top layer,
  // once, as a manual popover: no focus moved, nothing dismissed for it.
  await view.unmount();
  let shown = 0;
  window.HTMLElement.prototype.showPopover = function showPopover() {
    shown++;
    this.setAttribute('data-shown', '');
  };
  const matches = window.Element.prototype.matches;
  window.Element.prototype.matches = function patched(selector) {
    return selector === ':popover-open' ? this.hasAttribute('data-shown') : matches.call(this, selector);
  };
  const top = await mount(list({}));
  assert.equal(top.container.querySelector('.ekd-option-list').getAttribute('popover'), 'manual');
  assert.equal(shown, 1, 'the list was not shown as a popover');
  await top.rerender(list({ activeId: 'h1' }));
  assert.equal(shown, 1, 'an open popover was shown again, which throws');
  await top.unmount();
  delete window.HTMLElement.prototype.showPopover;
  window.Element.prototype.matches = matches;

  // A cursor with no rectangle when the list opens. The list is not left
  // unplaced, which the stylesheet would keep out of sight while the text
  // region went on naming it: it goes to the start of the top of the
  // viewport, and to the cursor as soon as there is one.
  cursor = null;
  const lost = await mount(list({}));
  const lostBox = lost.container.querySelector('.ekd-option-list');
  const lostAt = () => `${lostBox.style.left} ${lostBox.style.top} ${lostBox.dataset.placement}`;
  assert.ok(lostBox.hasAttribute('data-placement'), 'a list with no cursor to place it by was left unplaced, and so invisible');
  assert.equal(lostAt(), '16px 20px below');
  cursor = { x: 400, y: 200, width: 1, height: 20 };
  await act(async () => window.dispatchEvent(new window.Event('resize')));
  assert.equal(lostAt(), '400px 224px below', 'a cursor that came back did not take the list with it');
  // Gone again: now the list has a place, and keeps it.
  cursor = null;
  await act(async () => window.dispatchEvent(new window.Event('resize')));
  assert.equal(lostAt(), '400px 224px below');
  await lost.unmount();
  // Right to left, the start is the right edge.
  document.documentElement.dir = 'rtl';
  const computed = window.getComputedStyle;
  window.getComputedStyle = (element) => ({ direction: element.closest('[dir]')?.getAttribute('dir') ?? 'ltr' });
  const lostRtl = await mount(list({}));
  assert.equal(lostRtl.container.querySelector('.ekd-option-list').style.left, `${1280 - 16 - 320}px`);
  await lostRtl.unmount();
  window.getComputedStyle = computed;
  document.documentElement.removeAttribute('dir');

  // The visual viewport, where the browser has one, is what the list is
  // placed in: the layout viewport is still 1280 by 800, and an on-screen
  // keyboard has left 480 of the 800 showing.
  const visual = Object.assign(new window.EventTarget(), { offsetLeft: 0, offsetTop: 0, width: 1280, height: 480, scale: 1 });
  Object.defineProperty(window, 'visualViewport', { value: visual, configurable: true });
  cursor = { x: 400, y: 300, width: 1, height: 20 };
  const small = await mount(list({}));
  const smallBox = small.container.querySelector('.ekd-option-list');
  const smallAt = () => `${smallBox.style.left} ${smallBox.style.top} ${smallBox.dataset.placement}`;
  // Under the cursor it would end at 590, behind the keyboard. Above: 300 - 4 - 266.
  assert.equal(smallAt(), '400px 30px above', 'the list was placed by the layout viewport, behind the keyboard');
  // The keyboard goes: the visual viewport says so, and the window says nothing.
  visual.height = 800;
  await act(async () => visual.dispatchEvent(new window.Event('resize')));
  assert.equal(smallAt(), '400px 324px below', 'a change of the visual viewport left the list where it was');
  // A pinch-zoomed page is panned: the visual viewport scrolls inside the layout viewport.
  Object.assign(visual, { offsetLeft: 600, offsetTop: 250, width: 640, height: 300 });
  await act(async () => visual.dispatchEvent(new window.Event('scroll')));
  assert.equal(smallAt(), '616px 324px below', 'a pan of the visual viewport left the list where it was');
  assert.equal(smallBox.style.maxBlockSize, `${250 + 300 - 16 - 324}px`, 'the list was not held to what shows under the cursor');
  // Closed, it listens for neither.
  await small.rerender(list({ open: false }));
  const closedReads = reads;
  await act(async () => { visual.dispatchEvent(new window.Event('resize')); visual.dispatchEvent(new window.Event('scroll')); });
  assert.equal(reads, closedReads, 'a closed list still listens to the visual viewport');
  await small.unmount();
  delete window.visualViewport;

  window.HTMLElement.prototype.getBoundingClientRect = native;
  Object.defineProperty(window.Element.prototype, 'scrollTop', scrollTop);
  delete root.clientWidth;
  delete root.clientHeight;
});

await it('OptionList announces its count once it has settled, and not at every key', async () => {
  const wait = (ms) => act(async () => new Promise((resolve) => setTimeout(resolve, ms)));
  const list = (count, extra) => h(OptionList, {
    id: 'slash', label: 'Blocks', open: true, options: COMMANDS.slice(0, count), activeId: null,
    onActiveChange() {}, onSelect() {}, onDismiss() {}, anchor: { x: 0, y: 0, width: 1, height: 20 },
    empty: 'No block matches.', status: count === 1 ? '1 block' : `${count} blocks`, announceAfterMs: 60, ...extra,
  });
  const view = await mount(list(12));
  const live = () => view.container.querySelector('[role="status"]');
  // Every text the region is ever given, in order: what a screen reader hears.
  const said = [];
  let last = '';
  const observer = new window.MutationObserver(() => {
    const text = live()?.textContent ?? '';
    if (text && text !== last) said.push(text);
    last = text;
  });
  observer.observe(view.container, { childList: true, subtree: true, characterData: true });

  // The region is in the document, empty, before it is given anything.
  assert.equal(live().textContent, '', 'the count was said before it could have settled');
  await wait(120);
  assert.equal(live().textContent, '12 blocks');

  // Four keys in quick succession: one announcement, of where the typing stopped.
  for (const count of [7, 4, 2, 1]) {
    await view.rerender(list(count));
    await wait(15);
  }
  assert.equal(live().textContent, '12 blocks', 'the region followed the typing');
  await wait(120);
  assert.deepEqual(said, ['12 blocks', '1 block'], 'a count on the way was announced');

  // A key that leaves the count as it was: the active option moves, the
  // list is rendered again, and nothing is said.
  await view.rerender(list(1, { activeId: 'text' }));
  await view.rerender(list(1, { activeId: null }));
  await wait(120);
  assert.deepEqual(said, ['12 blocks', '1 block'], 'an unchanged count was announced again');

  // Nothing matches: the empty text is what is said, and what is shown.
  await view.rerender(list(0));
  await wait(120);
  assert.equal(live().textContent, 'No block matches.');
  // Closed, the region says so; opened again on the same count, the count is said again.
  await view.rerender(list(0, { open: false }));
  await wait(250);
  assert.equal(live().textContent, 'List closed.');
  await view.rerender(list(0));
  assert.equal(live().textContent, '', 'the last announcement was still in the region on opening');
  await wait(120);
  assert.equal(live().textContent, 'No block matches.');
  assert.deepEqual(said, ['12 blocks', '1 block', 'No block matches.', 'List closed.', 'No block matches.']);
  observer.disconnect();
  await view.unmount();
});

await it('OptionList announces that it has closed, in the region that outlives it, and only where its opening was announced', async () => {
  const wait = (ms) => act(async () => new Promise((resolve) => setTimeout(resolve, ms)));
  const list = (extra) => h(OptionList, {
    id: 'slash', label: 'Blocks', open: true, options: COMMANDS.slice(0, 3), activeId: 'text',
    onActiveChange() {}, onSelect() {}, onDismiss() {}, anchor: { x: 0, y: 0, width: 1, height: 20 },
    empty: 'No block matches.', status: '3 blocks. Text first.', announceAfterMs: 60, ...extra,
  });
  // Mounted closed: there is a region, and it is told nothing.
  const view = await mount(list({ open: false }));
  const live = view.container.querySelector('[role="status"]');
  assert.ok(live, 'a closed list has no region to say that it closed');
  // Every text the region is given, in order: what a screen reader hears.
  const said = [];
  let last = '';
  const observer = new window.MutationObserver(() => {
    const text = live.textContent;
    if (text && text !== last) said.push(text);
    last = text;
  });
  observer.observe(view.container, { childList: true, subtree: true, characterData: true });
  const region = () => view.container.querySelector('[role="status"]');
  await wait(250);
  assert.deepEqual(said, [], 'a list that was never open was announced as closed');

  // Opened, announced, closed: the closing is said, by the same element.
  // After the wait of a move in the list and not at once.
  await view.rerender(list());
  await wait(120);
  await view.rerender(list({ open: false }));
  assert.ok(region() === live, 'the region that says the closing is not the one that said the opening');
  assert.equal(view.container.children.length, 1, 'a closed list left more than its region');
  assert.equal(live.textContent, '3 blocks. Text first.', 'the closing was said before it could have settled');
  await wait(250);
  assert.deepEqual(said, ['3 blocks. Text first.', 'List closed.']);
  // It stays, and a render of the closed list does not take it back or say it again.
  await view.rerender(list({ open: false, options: [], activeId: null, status: '' }));
  await wait(250);
  assert.equal(live.textContent, 'List closed.');
  assert.equal(said.length, 2);

  // A render of the closed list while the closing is waiting does not lose it.
  await view.rerender(list());
  assert.equal(live.textContent, '', 'the last closing was still in the region of an open list');
  await wait(120);
  await view.rerender(list({ open: false }));
  await wait(20);
  await view.rerender(list({ open: false, options: [], activeId: null, status: '' }));
  await wait(250);
  assert.deepEqual(said.slice(2), ['3 blocks. Text first.', 'List closed.'], 'a render after the closing took the announcement back');

  // Closed before the count settled: the opening was never said, so the
  // closing is not. A writer who types " /usr/" hears nothing of a list.
  said.length = 0;
  await view.rerender(list());
  await wait(20);
  await view.rerender(list({ open: false }));
  await wait(250);
  assert.deepEqual(said, [], 'a list that was never announced as open was announced as closed');
  assert.equal(live.textContent, '');

  // Closed and opened again inside the wait: nothing of the closing, and
  // the count again, since closing forgot it.
  await view.rerender(list());
  await wait(120);
  await view.rerender(list({ open: false }));
  await wait(40);
  await view.rerender(list());
  await wait(250);
  assert.deepEqual(said, ['3 blocks. Text first.', '3 blocks. Text first.'], 'a list that opened again at once was announced as closed');

  // That list closes again before its count has settled a second time. The
  // writer was told of it, and the closing that was taken back told them
  // nothing, so this closing is said.
  said.length = 0;
  await view.rerender(list({ open: false }));
  await wait(40);
  await view.rerender(list());
  await wait(20);
  await view.rerender(list({ open: false }));
  await wait(250);
  assert.deepEqual(said, ['List closed.'], 'a list the writer was told of closed without a word, after a closing that was taken back');
  // Said once: the next list, closed before its count, is one nobody was told of.
  said.length = 0;
  await view.rerender(list());
  await wait(20);
  await view.rerender(list({ open: false }));
  await wait(250);
  assert.deepEqual(said, [], 'the closing of one list was owed again by the next');

  // The application's own word for the closing, read on the one render in
  // which `open` becomes false. The render after it gives another, or none.
  await view.rerender(list());
  await wait(120);
  said.length = 0;
  await view.rerender(list({ open: false, closed: 'Blocks closed.' }));
  await view.rerender(list({ open: false }));
  await wait(250);
  assert.deepEqual(said, ['Blocks closed.'], 'the text of the closing was not the one given as the list closed');
  // And a `closed` that arrives a render late is not read, as the README says.
  await view.rerender(list());
  await wait(120);
  said.length = 0;
  await view.rerender(list({ open: false }));
  await view.rerender(list({ open: false, closed: 'Text inserted.' }));
  await wait(250);
  assert.deepEqual(said, ['List closed.'], 'a `closed` given after the list had closed was said');

  // `closed` is not a way to announce a choice, and the README says so: a
  // writer who chooses before the count has settled hears nothing of it,
  // whatever the application gave. Held so that the two do not part.
  said.length = 0;
  await view.rerender(list());
  await wait(20);
  await view.rerender(list({ open: false, closed: 'Text inserted.' }));
  await wait(250);
  assert.deepEqual(said, [], 'a list that closed before its opening was said announced its `closed`: the README says it does not');
  assert.equal(live.textContent, '');
  const readme = (await import('node:fs')).readFileSync(new URL('../README.md', import.meta.url), 'utf8').replace(/\s+/g, ' ');
  for (const sentence of [
    '`closed` is the word for a closing, and not a way to announce a choice.',
    'A `closed` given on a later render is not read.',
    'An application that confirms a choice says so in a status region of its own',
  ]) {
    assert.ok(readme.includes(sentence), `the README no longer says: ${sentence}`);
  }
  assert.ok(!/closed=\{[^}]*inserted/.test(readme), 'the README passes the chosen block as `closed`, which is silent for a choice made at speed');

  // An empty text says nothing, and empties the region of the count.
  await view.rerender(list());
  await wait(120);
  assert.equal(live.textContent, '3 blocks. Text first.');
  said.length = 0;
  await view.rerender(list({ open: false, closed: '' }));
  await wait(250);
  assert.deepEqual(said, [], 'a closing was announced that the application gave no words for');
  assert.equal(live.textContent, '', 'the count of a closed list stayed in the region');
  observer.disconnect();
  await view.unmount();
});

await it('OptionList says the active option in the same region only when asked to, and gives the count and the option as one text where both are due', async () => {
  const wait = (ms) => act(async () => new Promise((resolve) => setTimeout(resolve, ms)));
  const calls = [];
  const announceActive = (option, index, count) => {
    calls.push([option.id, index, count]);
    return `${option.label}, ${index + 1} of ${count}`;
  };
  // The count settles in 400ms; the active option in 150, which is the component's own.
  const list = (ids, activeId, extra) => h(OptionList, {
    id: 'slash', label: 'Blocks', open: true, options: COMMANDS.filter((c) => ids.includes(c.id)), activeId,
    onActiveChange() {}, onSelect() {}, onDismiss() {}, anchor: { x: 0, y: 0, width: 1, height: 20 },
    empty: 'No block matches.', status: ids.length === 1 ? '1 block' : `${ids.length} blocks`, announceAfterMs: 400,
    announceActive, ...extra,
  });
  const HEADINGS = ['h1', 'h2', 'h3'];
  const view = await mount(list(HEADINGS, 'h1'));
  const regions = () => view.container.querySelectorAll('[role="status"]');
  // Every text the one region is given, with when: what a screen reader hears, in order.
  const said = [];
  const started = Date.now();
  let last = '';
  const observer = new window.MutationObserver(() => {
    const text = regions()[0]?.textContent ?? '';
    if (text && text !== last) said.push({ text, at: Date.now() - started });
    last = text;
  });
  observer.observe(view.container, { childList: true, subtree: true, characterData: true });
  const texts = () => said.map((entry) => entry.text);

  // On opening: the count and the active option, the count first, as one
  // text in one write. Two writes close together are two texts, and a polite
  // region is not certain to speak the first once it has been replaced.
  // Two waits, here and below: React renders what happened inside one `act`
  // once, at its end, so a second write would be seen after the second wait.
  assert.equal(regions().length, 1, 'the active option was given a region of its own');
  assert.deepEqual(calls[0], ['h1', 0, 3], 'announceActive was not given the option, its index from 0, and the count');
  await wait(300);
  assert.deepEqual(texts(), [], 'something was said before the count had settled');
  await wait(180);
  assert.deepEqual(texts(), ['3 blocks Heading 1, 1 of 3'], 'the count and the option were not one text, the count first');
  await wait(300);
  assert.deepEqual(texts(), ['3 blocks Heading 1, 1 of 3'], 'the region was written twice on opening: the count could be lost under the option');

  // An arrow: the active option, by itself, soon. The count is not said again.
  said.length = 0;
  let moved = Date.now();
  await view.rerender(list(HEADINGS, 'h2'));
  await wait(60);
  assert.deepEqual(texts(), [], 'the option was said before the key could have been held');
  await wait(160);
  assert.deepEqual(texts(), ['Heading 2, 2 of 3']);
  assert.ok(Date.now() - moved < 400, 'the case took longer than the count takes, and proves nothing about which timer ran');
  // A held arrow: one announcement, of where it stopped.
  said.length = 0;
  for (const id of ['h3', 'h2', 'h1', 'h2', 'h3']) {
    await view.rerender(list(HEADINGS, id));
    await wait(20);
  }
  await wait(250);
  assert.deepEqual(texts(), ['Heading 3, 3 of 3'], 'an option passed on the way was said');
  // Down on the last option names it again, and it is not said again.
  await view.rerender(list(HEADINGS, 'h3'));
  await wait(250);
  assert.deepEqual(texts(), ['Heading 3, 3 of 3']);

  // The filter changes, the count with it and the active option with it:
  // one text, the count first.
  said.length = 0;
  await view.rerender(list(['bullet', 'numbered'], 'bullet'));
  await wait(250);
  assert.deepEqual(texts(), [], 'the new first match was said over the typing, before the count');
  await wait(200);
  assert.deepEqual(texts(), ['2 blocks Bulleted list, 1 of 2'], 'the count and the new first match were not one text');
  await wait(250);
  assert.deepEqual(texts(), ['2 blocks Bulleted list, 1 of 2'], 'the region was written twice after a change of filter');
  // The filter changes and the count does not: the option, once the typing has stopped.
  said.length = 0;
  await view.rerender(list(['h1', 'h2'], 'h1'));
  await wait(250);
  assert.deepEqual(texts(), [], 'a new first match was said at the speed of an arrow, over the typing');
  await wait(300);
  assert.deepEqual(texts(), ['Heading 1, 1 of 2'], 'a count that did not change was said, or the new option was not');
  // The filter changes the count and leaves the active option: the count alone.
  said.length = 0;
  await view.rerender(list(HEADINGS, 'h1'));
  await wait(700);
  assert.deepEqual(texts(), ['3 blocks'], 'an active option that did not change was said again after the count');

  // An arrow while the count is waiting: the count is still said, first, and the option with it.
  said.length = 0;
  await view.rerender(list(['h1', 'h2'], 'h1'));
  await wait(200);
  await view.rerender(list(['h1', 'h2'], 'h2'));
  await wait(250);
  assert.deepEqual(texts(), [], 'an arrow let the option out ahead of a count that was waiting');
  await wait(200);
  assert.deepEqual(texts(), ['2 blocks Heading 2, 2 of 2'], 'an arrow during the wait dropped the count or the option, or parted them');
  await wait(250);
  assert.equal(said.length, 1, 'the region was written twice after an arrow during the wait');

  // Nothing matches: the empty text, and no option to say.
  said.length = 0;
  await view.rerender(list([], null));
  await wait(700);
  assert.deepEqual(texts(), ['No block matches.']);
  // Closed and opened again: both are news again.
  await view.rerender(list(['h1', 'h2'], 'h2', { open: false }));
  said.length = 0;
  await view.rerender(list(['h1', 'h2'], 'h2'));
  await wait(450);
  await wait(250);
  assert.deepEqual(texts(), ['2 blocks Heading 2, 2 of 2']);

  // Off, which is the default: the region never holds an option, at any speed.
  said.length = 0;
  await view.rerender(list(['h1', 'h2'], 'h2', { open: false }));
  await view.rerender(list(['h1', 'h2'], 'h2', { announceActive: undefined }));
  await wait(500);
  await view.rerender(list(['h1', 'h2'], 'h1', { announceActive: undefined }));
  await wait(500);
  assert.deepEqual(texts(), ['2 blocks'], 'the active option was announced without being asked for');
  observer.disconnect();
  await view.unmount();
});

// The README's editor, line for line: the query read from the selection, read
// again when the selection changes, `onBlur`, and the status that names the
// first match. Three things differ and none is behaviour. `insert` records
// the choice and replaces no text, as the README's leaves that to the editor.
// The anchor is a rectangle, since jsdom lays nothing out. And the region
// has a `tabIndex`, because jsdom gives an editable region no Tab stop where
// a browser does, and the surface would put focus elsewhere. jsdom moves no
// caret for a key, so the case moves it as a browser would and jsdom then
// fires `selectionchange` by itself. What is held is the pattern the helpers
// are documented with, inside a modal surface.
await it('The documented pattern names no option while the query is typed, closes when the cursor leaves the query, keeps a dismissed list closed, and lets one Escape close one thing', async () => {
  let surfaceClosed = 0;
  const chosen = [];
  function queryAtCursor(text) {
    const selection = window.getSelection();
    const node = selection?.focusNode;
    if (!selection?.isCollapsed || node?.nodeType !== Node.TEXT_NODE || !text?.contains(node)) return null;
    const before = (node.textContent ?? '').slice(0, selection.focusOffset);
    return /(?:^|\s)\/(\S*)$/.exec(before)?.[1] ?? null;
  }
  function Editor() {
    const text = React.useRef(null);
    const [query, setQuery] = React.useState(null);
    const [dismissed, setDismissed] = React.useState(false);
    const [activeId, setActiveId] = React.useState(null);
    const [navigating, setNavigating] = React.useState(false);

    React.useEffect(() => {
      const onCursorMove = () => {
        const next = queryAtCursor(text.current);
        setQuery((shown) => (shown === null ? null : next));
        setNavigating(false);
      };
      document.addEventListener('selectionchange', onCursorMove);
      return () => document.removeEventListener('selectionchange', onCursorMove);
    }, []);

    const open = query !== null && !dismissed;
    const options = open
      ? COMMANDS.filter((command) => [command.id, ...(command.aliases ?? [])].some((name) => name.startsWith(query.toLowerCase())))
      : [];
    const active = options.some((option) => option.id === activeId) ? activeId : (options[0]?.id ?? null);
    const dismiss = () => { setDismissed(true); setActiveId(null); };
    const insert = (id) => { chosen.push(id); setQuery(null); setActiveId(null); };

    const onInput = (event) => {
      const next = queryAtCursor(text.current);
      setQuery(next);
      setNavigating(false);
      setActiveId(null);
      const typed = event.nativeEvent.data ?? '';
      if (typed.includes('/') || next === null) setDismissed(false);
    };
    const onKeyDown = (event) => {
      const result = open ? optionListKey(event, { options, activeId: active }) : null;
      setNavigating(optionListNavigating(event, result, navigating));
      if (!result) return;
      event.preventDefault();
      if ('activeId' in result) setActiveId(result.activeId);
      else if ('select' in result) insert(result.select);
      else dismiss();
    };

    const count = options.length === 1 ? '1 block' : `${options.length} blocks`;
    const status = options[0] ? `${count}. ${options[0].label} first.` : '';

    return h(React.Fragment, null,
      h('div', {
        ref: text, id: 'text', className: 'ekd-editor', contentEditable: true, suppressContentEditableWarning: true, tabIndex: 0,
        role: 'textbox', 'aria-multiline': 'true', 'aria-label': 'Document',
        ...optionListAttributes('slash', { open, options, activeId: active, navigating }),
        onInput, onKeyDown, onBlur: dismiss,
      }),
      h(OptionList, {
        id: 'slash', label: 'Blocks', open, options, activeId: active,
        onActiveChange: setActiveId, onSelect: insert, onDismiss: dismiss,
        anchor: { x: 0, y: 0, width: 1, height: 20 },
        empty: 'No block matches. Delete a letter to see more.', status,
      }),
    );
  }
  function Surface() {
    const surface = React.useRef(null);
    useModalSurface({ open: true, surfaceRef: surface, onClose: () => surfaceClosed++ });
    return h('div', { ref: surface, role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Note', tabIndex: -1 },
      h(Editor),
      h(MenuButton, { id: 'note-actions', label: 'Note', items: [{ label: 'Delete note', onSelect() {} }] }),
    );
  }
  const view = await mount(h('div', null, h(Surface), h('button', { id: 'elsewhere' }, 'Elsewhere')));
  const text = document.getElementById('text');
  assert.equal(document.activeElement, text, 'the case lost the focus it is about');
  const wait = (ms) => act(async () => new Promise((resolve) => setTimeout(resolve, ms)));
  const press = async (init) => {
    let event;
    await act(async () => { event = key(document.activeElement, typeof init === 'string' ? { key: init } : init); });
    return event;
  };
  // Where the caret is, as an offset in the text, and putting it somewhere:
  // collapsed, or as a range to `extent`. jsdom fires `selectionchange` in a
  // task of its own, so the case waits for it.
  const caret = () => {
    const selection = window.getSelection();
    return text.firstChild && selection.focusNode === text.firstChild ? selection.focusOffset : 0;
  };
  const place = async (offset, extent) => {
    const node = text.firstChild ?? text;
    if (extent == null) window.getSelection().collapse(node, offset);
    else window.getSelection().setBaseAndExtent(node, offset, node, extent);
    await wait(10);
  };
  // Text that changes at the caret, as a browser changes it: the text, the
  // caret after it, the input event, and then `selectionchange`.
  // A browser reports the cursor's move after `input`. jsdom's task for it
  // can run while React settles the input, so it is held at the window until
  // `afterInput` has looked, and the move is then reported once.
  const change = async (inserted, data, afterInput) => {
    const at = caret();
    const value = text.textContent;
    text.textContent = inserted === null ? value.slice(0, at - 1) + value.slice(at) : value.slice(0, at) + inserted + value.slice(at);
    window.getSelection().collapse(text.firstChild ?? text, inserted === null ? at - 1 : at + inserted.length);
    const hold = (event) => event.stopImmediatePropagation();
    window.addEventListener('selectionchange', hold, true);
    await act(async () => text.dispatchEvent(new window.InputEvent('input', { bubbles: true, data })));
    await wait(10);
    afterInput?.();
    window.removeEventListener('selectionchange', hold, true);
    await act(async () => document.dispatchEvent(new window.Event('selectionchange')));
  };
  // A key that changes the text: the keydown, and the change where the key was the text's.
  const type = async (character) => {
    if ((await press(character)).defaultPrevented) return;
    await (character === 'Backspace' ? change(null, null) : change(character, character));
  };
  // Text that arrives with no key at all. A paste into an editable region carries no `data`.
  const paste = (pasted, afterInput) => change(pasted, null, afterInput);
  // A key of the text's that moves the caret: the keydown, and the move a browser makes for it.
  const move = async (name) => {
    const down = await press(name);
    if (down.defaultPrevented) return down;
    const length = text.textContent.length;
    const at = caret();
    await place({ ArrowLeft: Math.max(0, at - 1), ArrowRight: Math.min(length, at + 1), Home: 0, End: length }[name]);
    return down;
  };
  const listbox = () => document.getElementById('slash');
  const marked = () => listbox()?.querySelector('[aria-selected="true"]')?.id ?? null;
  const named = () => text.getAttribute('aria-activedescendant');
  const region = () => view.container.querySelector('[role="status"]')?.textContent ?? null;

  // The query is typed. The first match is marked, and is not named.
  await type('/');
  assert.ok(listbox(), 'the trigger character did not open the list');
  assert.equal(text.getAttribute('aria-controls'), 'slash');
  assert.equal(marked(), 'slash-option-text');
  assert.equal(named(), null, 'the first match was named as the list opened');
  await type('h');
  assert.equal(marked(), 'slash-option-h1');
  assert.equal(named(), null, 'the first match was named over a letter of the query');
  // The query is read back: the keys are the text's, and name nothing. The
  // list follows the cursor while the cursor is in the query.
  assert.ok(!(await move('ArrowLeft')).defaultPrevented, 'Left was taken from the text');
  assert.equal(named(), null, 'Left named an option');
  assert.equal(marked(), 'slash-option-text', 'the list did not follow the cursor back to the "/"');
  assert.ok(!(await move('ArrowRight')).defaultPrevented, 'Right was taken from the text');
  assert.equal(named(), null, 'Right named an option');
  assert.equal(marked(), 'slash-option-h1');
  // A move in the list names the option it reaches.
  assert.ok((await press('ArrowDown')).defaultPrevented);
  assert.equal(named(), 'slash-option-h2', 'Down did not name the option it moved to');
  assert.equal(marked(), 'slash-option-h2');
  // Reading the query again ends the move: the name goes and the mark stays.
  await move('ArrowLeft');
  assert.equal(named(), null, 'Left left an option named, to be said in place of the character');
  assert.equal(marked(), 'slash-option-h2', 'the mark left with the name');
  await move('ArrowRight');
  await press('ArrowUp');
  assert.equal(named(), 'slash-option-h1');
  // So does the next letter, and Backspace.
  await type('2');
  assert.equal(named(), null, 'a letter left an option named');
  assert.equal(marked(), 'slash-option-h2');
  await press('ArrowDown');
  assert.equal(named(), 'slash-option-h2');
  await type('Backspace');
  assert.equal(named(), null, 'Backspace left an option named');

  // A modifier pressed by itself ends nothing. Control silences a screen
  // reader, and a writer who then asks where they are is still on the option.
  // Backspace was a new filter, which starts at its first match: Down is the second.
  await press('ArrowDown');
  assert.equal(named(), 'slash-option-h2');
  for (const modifier of [{ key: 'Control', ctrlKey: true }, { key: 'Shift', shiftKey: true }, { key: 'Alt', altKey: true }, { key: 'CapsLock' }]) {
    assert.ok(!(await press(modifier)).defaultPrevented, `${modifier.key} was taken from the text`);
    assert.equal(named(), 'slash-option-h2', `${modifier.key} by itself took the name off the active option`);
  }
  // Text that arrives with no key ends the move: a paste, dictation.
  // The `input` ends it by itself, before the cursor's move is reported.
  await paste('3', () => {
    assert.equal(named(), null, 'a paste left an option named until the cursor’s move was reported');
  });
  assert.equal(text.textContent, '/h3');
  assert.equal(named(), null, 'a paste left an option named: no keydown came to end the move');
  await type('Backspace');
  // And so does a cursor moved with no key, by a press in the text.
  await press('ArrowDown');
  assert.ok(named(), 'the case is not moving in the list');
  await place(1);
  assert.equal(named(), null, 'a cursor moved by a press left an option named');
  assert.ok(listbox(), 'a cursor moved inside the query closed the list');
  await place(2);

  // The cursor leaves the query by a key of the text's, which fires no
  // `input`. The list closes, and its keys are the text's again: before, it
  // stayed open, and Enter replaced text the cursor was not in.
  await press('ArrowDown');
  assert.ok(listbox() && named(), 'the case is not in the list');
  assert.ok(!(await move('Home')).defaultPrevented, 'Home was taken from the text');
  assert.ok(!listbox(), 'Home took the cursor out of the query and the list stayed open');
  assert.ok(!text.hasAttribute('aria-controls') && !text.hasAttribute('aria-activedescendant'), 'the text still names a list after Home');
  for (const listKey of ['ArrowDown', 'ArrowUp', 'PageDown', 'Enter']) {
    assert.ok(!(await press(listKey)).defaultPrevented, `${listKey} was taken from the text with the cursor outside the query`);
  }
  assert.deepEqual(chosen, [], 'Enter chose an option for a query the cursor is not in');
  assert.equal(surfaceClosed, 0);
  // A cursor that comes back to the query opens nothing: only typing asks.
  await move('End');
  assert.ok(!listbox(), 'a cursor that arrived after a "/" opened the list');
  await type('1');
  assert.ok(listbox(), 'typing in the query did not open the list again');
  assert.equal(marked(), 'slash-option-h1');
  await type('Backspace');
  // A selection that is a range has no cursor in the query either.
  await place(0, 2);
  assert.ok(!listbox(), 'the list stayed open over a selected range');
  await place(2);
  await type('1');
  await type('Backspace');
  assert.ok(listbox());

  // Escape closes the list and nothing else. The "/" and the query stay as text.
  const escape = await press('Escape');
  assert.ok(escape.defaultPrevented);
  assert.ok(!listbox(), 'Escape left the list open');
  assert.equal(surfaceClosed, 0, 'one Escape closed the list and the surface that holds the text');
  assert.equal(text.textContent, '/h');
  assert.ok(!text.hasAttribute('aria-controls') && !text.hasAttribute('aria-activedescendant'));
  // The next letter of the same word does not open it again.
  await type('1');
  assert.equal(text.textContent, '/h1');
  assert.ok(!listbox(), 'a letter typed after Escape put the writer back in the list');
  // With the list closed, Escape is the surface's.
  assert.ok(!(await press('Escape')).defaultPrevented);
  assert.equal(surfaceClosed, 1, 'the second Escape did not reach the surface');
  // The trigger character typed again is a new request.
  await type(' ');
  await type('/');
  assert.ok(listbox(), 'the trigger character did not open the list after a dismissal');
  assert.equal(named(), null);
  // Enter with nothing moved chooses the marked first match, and the status
  // has said which option that is: a writer who cannot see the mark is told
  // what Enter does before pressing it.
  await type('h');
  await wait(600);
  assert.equal(region(), '3 blocks. Heading 1 first.', 'the status did not name the option Enter chooses');
  assert.equal(named(), null);
  assert.ok((await press('Enter')).defaultPrevented);
  assert.deepEqual(chosen, ['h1']);
  assert.ok(!listbox());

  // A press outside while the writer is moving in the list. The dismissal is
  // remembered as Escape's is, and the move is not carried into the next list.
  await type(' ');
  await type('/');
  await press('ArrowDown');
  assert.equal(named(), 'slash-option-h1');
  await act(async () => document.body.dispatchEvent(new window.Event('pointerdown', { bubbles: true })));
  assert.ok(!listbox(), 'a press outside left the list open');
  await type('t');
  assert.ok(!listbox(), 'a letter typed after a press outside opened the list again');
  // Deleting back through the "/" and typing it again is a new request too.
  await type('Backspace');
  await type('Backspace');
  await type('/');
  assert.ok(listbox());
  assert.equal(named(), null, 'the move in the last list was still in force in this one');

  // Focus leaves the text: the list closes, and stays closed when focus
  // comes back, as after Escape.
  const button = document.getElementById('note-actions');
  await act(async () => button.focus());
  assert.ok(!listbox(), 'the list stayed open with focus out of the text');
  await act(async () => text.focus());
  // A browser puts the cursor back where it was; jsdom is told to.
  await place(text.textContent.length);
  assert.ok(!listbox(), 'focus coming back to the text opened the list');
  await type('t');
  assert.equal(text.textContent, '/h1 /h /t', 'the case typed somewhere other than the query');
  assert.ok(!listbox(), 'a letter typed after a blur opened the list again');
  assert.equal(surfaceClosed, 1);

  // A menu in the same surface: its Escape is its own as well.
  await act(async () => button.click());
  assert.equal(button.getAttribute('aria-expanded'), 'true');
  assert.ok((await press('Escape')).defaultPrevented);
  assert.equal(button.getAttribute('aria-expanded'), 'false');
  assert.equal(surfaceClosed, 1, 'one Escape closed the menu and the surface that holds it');
  await press('Escape');
  assert.equal(surfaceClosed, 2);
  await view.unmount();
});

await it('OptionList renders on the server, hydrates without a mismatch, and shows at most maxVisible rows', async () => {
  const { readFileSync } = await import('node:fs');
  const server = await import('react-dom/server');
  const { hydrateRoot } = await import('react-dom/client');
  // This process has jsdom's `window`, so the component takes the layout
  // effect it takes in a browser, and React 18 warns that a server runs none.
  // A real server has no `window` and gets the plain effect and no warning.
  // That one warning is dropped; anything else React says fails the case.
  const renderToString = (element) => {
    const said = [];
    const error = console.error;
    console.error = (...args) => said.push(args.join(' '));
    let html;
    try {
      html = server.renderToString(element);
    } finally {
      console.error = error;
    }
    assert.deepEqual(said.filter((line) => !line.includes('useLayoutEffect does nothing on the server')), []);
    return html;
  };
  const list = (props) => h(OptionList, {
    id: 'slash', label: 'Blocks', open: true, options: COMMANDS, activeId: 'h1',
    onActiveChange() {}, onSelect() {}, onDismiss() {}, anchor: () => ({ x: 400, y: 200, width: 1, height: 20 }),
    empty: 'No block matches.', status: '12 blocks', ...props,
  });

  // Closed: the status region, empty, and nothing else. It is in the server's
  // markup so that the element which says a closing is in the page before
  // the list first opens.
  assert.equal(renderToString(list({ open: false })), '<span class="ekd-option-list-announce" role="status"></span>');
  // Open: the whole list, with the height of eight rows as its most, set on
  // the element. jsdom drops a declaration it does not know, so the style is
  // read from the markup a server sends.
  const html = renderToString(list({}));
  assert.match(html, /^<div popover="manual" class="ekd-option-list">/);
  // With its `tabindex`, which a server's markup needs as much as the
  // hydrated list does: the browser decides the Tab order from the markup.
  assert.match(html, /<div id="slash" role="listbox" aria-label="Blocks" tabindex="-1" class="ekd-option-list-options" style="max-block-size:calc\(8 \* max\(var\(--sp-7\), 1lh \+ 2 \* var\(--sp-1\) \+ 2px\)\)">/);
  // The cap is counted in rows that follow the text size: one line of the
  // row's text, in `lh`, where that is more than the fixed least height.
  // Counted in `--sp-7` alone it is 256px at every text size (WCAG 1.4.4).
  assert.ok(!/max-block-size:calc\(\d+ \* var\(--sp-7\)\)/.test(html), 'the row cap does not follow the text size');
  assert.equal(html.match(/role="option"/g).length, 12);
  assert.equal(html.match(/aria-selected="true"/g).length, 1);
  assert.match(html, /<div id="slash-option-h1" role="option" aria-selected="true"/);
  // The region is after the list and not in it, so it is still there when the list is not.
  assert.match(html, /<\/div><\/div><span class="ekd-option-list-announce" role="status"><\/span>$/);
  assert.ok(!/<style|<script/.test(html), 'the server markup carries a style or a script element');
  // No position from the server, which has no viewport: the stylesheet keeps
  // an unplaced list out of sight until the browser has placed it.
  assert.ok(!/data-placement|top:|left:/.test(html));
  assert.match(renderToString(list({ maxVisible: 5 })), /style="max-block-size:calc\(5 \* max\(var\(--sp-7\), 1lh \+/);
  assert.match(renderToString(list({ maxVisible: 0 })), /style="max-block-size:calc\(1 \* max\(var\(--sp-7\), 1lh \+/);
  assert.match(renderToString(list({ options: [] })), /<p class="ekd-option-list-empty">No block matches\.<\/p>/);

  // Hydration: React reports a mismatch through console.error.
  for (const props of [{}, { open: false }, { options: [] }]) {
    const container = document.createElement('div');
    document.body.appendChild(container);
    container.innerHTML = renderToString(list(props));
    const errors = [];
    const error = console.error;
    console.error = (...args) => errors.push(args.join(' '));
    let root;
    await act(async () => { root = hydrateRoot(container, list(props)); });
    console.error = error;
    assert.deepEqual(errors, [], 'hydration reported a mismatch');
    if (props.open !== false) assert.ok(container.querySelector('.ekd-option-list').hasAttribute('data-placement'), 'a hydrated list was left unplaced');
    await act(async () => root.unmount());
    container.remove();
  }

  // The component is a client module, and the helpers beside it are not.
  const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');
  assert.match(read('../dist/src/components/OptionList.js'), /^['"]use client['"]/);
  const helpers = read('../dist/src/components/optionListHelpers.js');
  assert.ok(!/['"]use client['"]/.test(helpers) && !/\buse[A-Z]\w*\(/.test(helpers), 'the helpers need a client boundary');

  // The stylesheet: the row height the component counts in, the two carriers
  // of the active option, forced colours, and no motion.
  const css = read('../dist/styles/option-list.css').replace(/\/\*[\s\S]*?\*\//g, '');
  assert.match(css, /\.ekd-option \{[^}]*min-block-size:\s*var\(--sp-7\)/);
  assert.match(css, /\.ekd-option-list \{[^}]*position:\s*fixed/);
  assert.match(css, /\.ekd-option-list \{[^}]*inline-size:\s*min\(20rem, calc\(100vw - 2 \* var\(--sp-4\)\)\)/);
  assert.match(css, /\.ekd-option-list-options \{[^}]*overflow-y:\s*auto/);
  assert.match(css, /\.ekd-option-list:not\(\[data-placement\]\) \{ visibility: hidden; \}/);
  // The list's text cannot be selected, so a right-click, a Control-click or
  // a long press on an option cannot move the page's one selection out of
  // the text. jsdom selects nothing on a press, so the rule is held here and
  // the behaviour was read in a browser.
  const surface = css.match(/\.ekd-option-list \{([^}]*)\}/)[1];
  for (const declaration of ['user-select: none;', '-webkit-user-select: none;', '-webkit-touch-callout: none;']) {
    assert.ok(surface.split('\n').some((line) => line.trim() === declaration), `the list does not declare ${declaration}`);
  }
  assert.ok(!/user-select:\s*(auto|text|all)/.test(css), 'part of the list can be selected');
  // One rule's declarations, by its whole selector, as a map. jsdom computes
  // no layout and no cascade worth reading, so each declaration that an
  // accessibility property rests on is held by name and by value. The rules
  // of the forced-colours block are read from that block alone.
  const escaped = (selector) => selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const rule = (source, selector) => {
    const body = source.match(new RegExp(`(?:^|\\n)[ \\t]*${escaped(selector)} \\{([^}]*)\\}`))?.[1];
    assert.ok(body != null, `the stylesheet has no rule for ${selector}`);
    return new Map(body.split(';').map((line) => line.trim()).filter(Boolean).map((line) => {
      const colon = line.indexOf(':');
      return [line.slice(0, colon).trim(), line.slice(colon + 1).trim()];
    }));
  };
  const forced = css.match(/@media \(forced-colors: active\) \{\n([\s\S]*?)\n\}/)?.[1];
  assert.ok(forced, 'the option list has no forced-colours block');
  const base = css.replace(/@media [^{]*\{\n[\s\S]*?\n\}/g, '');
  const holds = (declared, expected, where) => {
    for (const [property, value] of Object.entries(expected)) {
      assert.equal(declared.get(property), value, `${where} does not declare ${property}: ${value}`);
    }
  };

  // The active option: two carriers, and a boundary that has a width. The
  // row's border is what the accent is drawn in, so a border of no width is
  // an active row marked by its wash alone, which is 1.33:1 at most.
  const row = rule(base, '.ekd-option');
  assert.match(row.get('border') ?? '', /^[1-9]\d*px solid transparent$/, 'the row has no border for the active option to colour');
  holds(rule(base, '.ekd-option[aria-selected="true"]'), {
    background: 'var(--accent-soft)',
    'border-color': 'var(--accent)',
    'box-shadow': 'inset 0 0 0 1px var(--accent)',
  }, 'the active option');

  // The label and the detail share the row and both wrap (WCAG 1.4.10). The
  // detail had no limit once, and a citation key of forty characters left
  // the label one letter to a line and the list scrolling sideways at 320px.
  // The detail is as wide as its text up to half the row, and wraps inside
  // that; the label shrinks into the rest and wraps. Read in Chromium at
  // 320px; held here by the declarations.
  const label = rule(base, '.ekd-option-label');
  const detail = rule(base, '.ekd-option-detail');
  holds(label, { flex: '0 1 auto', 'min-inline-size': '0', 'overflow-wrap': 'anywhere' }, 'the label');
  holds(detail, { flex: 'none', 'max-inline-size': '50%', 'overflow-wrap': 'anywhere' }, 'the detail');
  for (const [name, declared] of [['label', label], ['detail', detail], ['row', row]]) {
    assert.ok(!declared.has('white-space'), `the ${name} sets white-space, and may no longer wrap`);
    for (const property of ['flex-shrink', 'flex-basis', 'inline-size', 'width', 'min-width']) {
      assert.ok(!declared.has(property), `the ${name} is held to a width by ${property}`);
    }
  }
  assert.ok(!detail.has('min-inline-size'), 'the detail has a least width, and can take the row from the label');
  // Each takes its direction from its own text, so "/h1" is not "h1/" in a
  // page that reads right to left. Text so marked is aligned by its own
  // direction too, so neither box grows to hold its text away from its edge
  // of the row: `space-between` places them.
  holds(label, { 'unicode-bidi': 'plaintext' }, 'the label');
  holds(detail, { 'unicode-bidi': 'plaintext' }, 'the detail');
  assert.equal(row.get('justify-content'), 'space-between');
  assert.ok(!label.has('text-align') && !detail.has('text-align'));
  // The detail's ink: --fg-2, which `check:contrast` holds at 4.5:1 on the
  // surface and on the active row's wash. --fg-3 does not hold in sepia dark.
  holds(detail, { color: 'var(--fg-2)' }, 'the detail');

  // Forced colours: the active row is taken out of them to be given the
  // system's selection pair, and the detail, which has an ink of its own, is
  // given the same pair's text colour. Without the first declaration the
  // pair is not drawn; without the last the detail keeps an ink chosen for
  // another ground.
  holds(rule(forced, '.ekd-option[aria-selected="true"]'), {
    'forced-color-adjust': 'none',
    background: 'Highlight',
    color: 'HighlightText',
    'border-color': 'Highlight',
    'box-shadow': 'none',
  }, 'the active option in forced colours');
  holds(rule(forced, '.ekd-option[aria-selected="true"] .ekd-option-detail'), { color: 'HighlightText' }, 'the detail of the active option in forced colours');

  assert.ok(!/transition|animation|:hover|:focus|outline|text-overflow|nowrap|white-space:\s*pre/.test(css.replace(/\.ekd-option-list-announce \{[^}]*\}/, '')),
    'the list moves, marks a hover or a focus, or cuts a label short');
  assert.ok(read('../dist/styles/base.css').includes('.ekd-option-list {'), 'styles.css does not carry the option list');
  assert.ok(read('../dist/styles/components.css').includes('.ekd-option-list {'));
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

  // No kerning on the surface. A run with no space in it is broken where the
  // line ends (`overflow-wrap`), and with kerning on Chromium lays such a run
  // out in time that grows with the square of its length: 32,000 asterisks
  // in a paragraph took 430 ms at every key, and 1 ms with kerning off. jsdom
  // lays nothing out, so the declaration is held by name: on the root, whose
  // value every block inherits, with nothing under it turning kerning back
  // on by the property or by the feature. Measured in Chromium.
  const rules = editor.replace(/\/\*[\s\S]*?\*\//g, '');
  const root = rules.match(/(?:^|\n)\.ekd-editor \{([^}]*)\}/)?.[1];
  assert.ok(root, 'editor.css has no rule for the root alone');
  const declared = new Map(root.split(';').map((line) => line.trim()).filter(Boolean).map((line) => {
    const colon = line.indexOf(':');
    return [line.slice(0, colon).trim(), line.slice(colon + 1).trim()];
  }));
  assert.equal(declared.get('font-kerning'), 'none', 'the document surface does not turn kerning off, and a long run with no space in it freezes the page');
  assert.equal(declared.get('overflow-wrap'), 'break-word', 'the document surface no longer wraps a run with no break in it');
  assert.deepEqual(rules.match(/font-kerning:[^;}]*/g), ['font-kerning: none'], 'a rule under the document surface sets kerning again');
  assert.ok(!/["']kern["']/.test(rules), 'a rule under the document surface sets the kerning feature by hand');
  assert.ok(!/text-rendering/.test(rules), 'the document surface sets text-rendering, which changes nothing here');
  for (const entry of ['base.css', 'components.css']) {
    assert.ok(read(`../dist/styles/${entry}`).replace(/\/\*[\s\S]*?\*\//g, '').includes(root), `styles/${entry} does not carry the document surface as editor.css has it`);
  }

  // The prompt of an empty block, and of an empty caption, is drawn and not
  // said. Generated text is read as the text of the element, so a screen
  // reader read an empty caption as "Caption". The stylesheet gives it an
  // empty alternative text. jsdom reads no generated content and computes
  // no accessible name, so the shape is held by name, in two parts and in
  // their order.
  //
  // The plain rule, with the plain declaration and no other: it is what
  // draws the prompt in a browser that does not have the `/`. The
  // alternative text is not a second declaration in it. Where `attr()` is a
  // substitution function, a declaration that holds it is kept whatever
  // else it holds, and fails only when the value is computed: it would win
  // over the plain one and draw nothing.
  const PROMPT = '.ekd-editor [data-placeholder]::before';
  const escaped = PROMPT.replace(/[.[\]]/g, '\\$&');
  const plain = new RegExp(`(?:^|\\n)${escaped} \\{([^}]*)\\}`).exec(rules);
  assert.ok(plain, 'editor.css has no rule of its own that draws the prompt of an empty block');
  const contents = (body) => [...body.matchAll(/(?:^|[;\s])content\s*:\s*([^;}]+)/g)].map(([, value]) => value.trim());
  assert.deepEqual(contents(plain[1]), ['attr(data-placeholder)'],
    'the plain rule for the prompt does not hold the plain declaration alone: without it no prompt is drawn where the alternative text is not known, and with the alternative text beside it a browser that keeps a declaration it cannot compute draws none');
  // The rule that takes the prompt out of what is read: the same selector,
  // inside a query about a string, which a browser answers when it parses
  // the stylesheet. A query about `attr()` would be answered yes by a
  // browser that keeps the declaration and cannot compute it.
  const silent = new RegExp(`@supports \\(content: "a" / ""\\) \\{\\s*${escaped} \\{([^}]*)\\}\\s*\\}`).exec(rules);
  assert.ok(silent, 'the prompt of an empty block has no empty alternative text inside `@supports (content: "a" / "")`: a screen reader reads it as the text of the block');
  assert.deepEqual(contents(silent[1]), ['attr(data-placeholder) / ""'], 'the rule inside `@supports` does not give the prompt an empty alternative text');
  // The same selector, so the later rule wins: the one in `@supports` is the later.
  assert.ok(silent.index > plain.index, 'the plain rule for the prompt comes after the one in `@supports` and wins over it: the prompt is read everywhere');
  // And these two are all: no third rule draws a prompt, read or not.
  assert.equal(rules.match(/content\s*:[^;}]*data-placeholder[^;}]*/g).length, 2, 'another rule draws a prompt from data-placeholder');
  const drawn = [[PROMPT, plain[1]]];
  const guarded = silent[0];
  // The caption has no generated text of its own: its prompt is the rule above.
  assert.ok(!/\.ekd-table-caption[^{]*::?(?:before|after)/.test(rules), 'the caption of a table draws a prompt of its own');
  // In forced colours the prompt is the system's ink for text that is not
  // live: the ink that told it from the writer's text is gone there.
  const forced = [...rules.matchAll(/@media \(forced-colors: active\) \{((?:[^{}]*\{[^{}]*\})*)\s*\}/g)].map(([, body]) => body).join('\n');
  assert.match(forced, /\.ekd-editor \[data-placeholder\]::before \{\s*color:\s*GrayText;?\s*\}/, 'the prompt of an empty block has no colour of its own in forced colours');
  assert.match(drawn[0][1], /color:\s*var\(--fg-3\)/, 'the prompt is not --fg-3, the ink check:contrast holds on the canvas and the two surfaces');
  for (const entry of ['base.css', 'components.css']) {
    const shipped = read(`../dist/styles/${entry}`).replace(/\/\*[\s\S]*?\*\//g, '');
    assert.ok(shipped.includes(drawn[0][1]), `styles/${entry} does not carry the prompt as editor.css has it`);
    assert.ok(shipped.indexOf(guarded) > shipped.indexOf(drawn[0][1]), `styles/${entry} does not carry the prompt's empty alternative text after the plain rule`);
    assert.match(shipped, /\.ekd-editor \[data-placeholder\]::before \{\s*color:\s*GrayText;?\s*\}/, `styles/${entry} does not carry the prompt's colour in forced colours`);
  }

  const manifest = JSON.parse(read('../package.json'));
  const all = { ...manifest.dependencies, ...manifest.peerDependencies, ...manifest.devDependencies };
  const editors = Object.keys(all).filter((name) => /tiptap|prosemirror|lowlight|highlight\.js|^yjs$|^y-/.test(name));
  assert.deepEqual(editors, [], 'the package depends on an editor');
  assert.equal(manifest.dependencies, undefined, 'a runtime dependency was added');
});

// --- The image block ------------------------------------------------------------
// The block is drawn by `styles/editor.css` and its handle is made to work by
// `attachImageResize`. jsdom lays nothing out and applies no stylesheet, so the
// helper is run against a column whose width the test gives it, and the
// stylesheet is read by name, as the editor's other rules are.
const {
  attachImageResize, clampImageWidth, imageWidthForKey, imageWidthForDrag,
  IMAGE_RESIZE_EVENT, IMAGE_WIDTH_PROPERTY, IMAGE_WIDTH_MIN, IMAGE_WIDTH_MAX, IMAGE_WIDTH_STEP, IMAGE_WIDTH_PAGE_STEP,
} = await import('../dist/src/a11y/index.js');

/** A block as an editor writes it, with the column (the figure) 400px wide. */
const imageBlock = (attributes = '', columnPx = 400) => {
  document.body.innerHTML = `
    <figure class="ekd-image" id="block">
      <div class="ekd-image-frame" id="frame">
        <img class="ekd-image-img" alt="A plate" src="data:,">
        <div class="ekd-image-resize" id="handle" ${attributes}></div>
      </div>
      <figcaption class="ekd-image-caption">Plate 3</figcaption>
    </figure>`;
  const $ = (id) => document.getElementById(id);
  Object.defineProperty($('block'), 'clientWidth', { value: columnPx, configurable: true });
  const events = [];
  $('handle').addEventListener(IMAGE_RESIZE_EVENT, (e) => events.push(e.detail));
  return { block: $('block'), frame: $('frame'), handle: $('handle'), events };
};

/** A pointer event. jsdom has the constructor and no pointer capture, so capture is recorded. */
const pointer = (target, type, init) => {
  const event = new window.PointerEvent(type, { bubbles: true, cancelable: true, pointerId: 1, isPrimary: true, button: 0, ...init });
  target.dispatchEvent(event);
  return event;
};
const recordCapture = (handle) => {
  const calls = [];
  const held = new Set();
  handle.setPointerCapture = (id) => { calls.push(['set', id]); held.add(id); };
  handle.hasPointerCapture = (id) => held.has(id);
  handle.releasePointerCapture = (id) => { calls.push(['release', id]); held.delete(id); };
  return calls;
};

await it('attachImageResize makes the handle a named slider and writes the width where the stylesheet reads it', () => {
  const { frame, handle } = imageBlock('aria-label="Image width"');
  const control = attachImageResize({ handle, frame, width: 50 });
  assert.equal(handle.getAttribute('role'), 'slider');
  assert.equal(handle.getAttribute('aria-orientation'), 'horizontal');
  assert.equal(handle.getAttribute('aria-valuemin'), '10');
  assert.equal(handle.getAttribute('aria-valuemax'), '100');
  assert.equal(handle.getAttribute('aria-valuenow'), '50');
  assert.equal(handle.getAttribute('aria-valuetext'), '50%');
  assert.equal(handle.getAttribute('tabindex'), '0', 'a slider that cannot be focused cannot be moved by a keyboard');
  assert.equal(frame.style.getPropertyValue(IMAGE_WIDTH_PROPERTY), '50%');
  assert.equal(IMAGE_WIDTH_PROPERTY, '--ekd-image-width');
  // What it is called is the application's words, and the helper keeps them.
  assert.equal(handle.getAttribute('aria-label'), 'Image width');
  control.destroy();

  // It invents no name for a handle that was given none, and keeps a tabindex it was given.
  const bare = imageBlock('tabindex="-1"');
  attachImageResize({ handle: bare.handle, frame: bare.frame, width: 100 });
  assert.ok(!bare.handle.hasAttribute('aria-label') && !bare.handle.hasAttribute('aria-labelledby'), 'the helper wrote a name of its own');
  assert.equal(bare.handle.getAttribute('tabindex'), '-1');

  // The words for the value are the application's, and are written again at each width.
  const worded = imageBlock();
  const words = attachImageResize({ handle: worded.handle, frame: worded.frame, width: 25, valueText: (w) => `${w} of 100` });
  assert.equal(worded.handle.getAttribute('aria-valuetext'), '25 of 100');
  words.update(75);
  assert.equal(worded.handle.getAttribute('aria-valuetext'), '75 of 100');
});

await it('The handle takes the arrow keys, Page Up and Page Down, Home and End, in steps, and says each as a commit', () => {
  const { block, frame, handle, events } = imageBlock('aria-label="Image width"');
  attachImageResize({ handle, frame, width: 50 });
  const press = (init) => key(handle, init);
  const widthNow = () => handle.getAttribute('aria-valuenow');

  assert.equal([IMAGE_WIDTH_MIN, IMAGE_WIDTH_MAX, IMAGE_WIDTH_STEP, IMAGE_WIDTH_PAGE_STEP].join(), '10,100,5,25');

  let e = press({ key: 'ArrowRight' });
  assert.equal(widthNow(), '55');
  assert.deepEqual(events.at(-1), { width: 55, phase: 'commit', source: 'keyboard' });
  assert.ok(e.defaultPrevented, 'the editor round the block moves its caret as well');
  press({ key: 'ArrowLeft' });
  assert.equal(widthNow(), '50');
  press({ key: 'ArrowUp' });
  assert.equal(widthNow(), '55');
  press({ key: 'ArrowDown' });
  assert.equal(widthNow(), '50');
  press({ key: 'PageUp' });
  assert.equal(widthNow(), '75');
  press({ key: 'PageDown' });
  assert.equal(widthNow(), '50');
  press({ key: 'End' });
  assert.equal(widthNow(), '100');
  press({ key: 'Home' });
  assert.equal(widthNow(), '10');
  assert.equal(frame.style.getPropertyValue(IMAGE_WIDTH_PROPERTY), '10%', 'the stylesheet is not told');
  assert.equal(handle.getAttribute('aria-valuetext'), '10%');

  // At an end the key is still the slider's, and nothing is said.
  const before = events.length;
  e = press({ key: 'ArrowLeft' });
  assert.ok(e.defaultPrevented);
  assert.equal(events.length, before, 'a key that changed nothing sent an event');
  press({ key: 'End' });
  const atEnd = events.length;
  press({ key: 'ArrowRight' });
  assert.equal(events.length, atEnd);

  // A key that is not the slider's, and a chord, are left to the page.
  for (const init of [{ key: 'a' }, { key: 'Tab' }, { key: 'ArrowRight', ctrlKey: true }, { key: 'ArrowRight', metaKey: true }, { key: 'ArrowRight', altKey: true }]) {
    const sent = events.length;
    e = press(init);
    assert.ok(!e.defaultPrevented, `${JSON.stringify(init)} was taken`);
    assert.equal(events.length, sent);
  }

  // The event bubbles, so a node view can listen on its own element.
  let seen = null;
  block.addEventListener(IMAGE_RESIZE_EVENT, (event) => { seen = event.detail; });
  press({ key: 'Home' });
  press({ key: 'ArrowRight' });
  assert.deepEqual(seen, { width: 15, phase: 'commit', source: 'keyboard' });

  // A key stops at the handle: the editor's own key handler is not run.
  let reached = false;
  block.addEventListener('keydown', () => { reached = true; });
  press({ key: 'ArrowRight' });
  assert.ok(!reached, 'an arrow key on the handle went on to the editor');
});

await it('A key lands on a multiple of the step, and in a right to left block Left widens', () => {
  const { frame, handle, events } = imageBlock();
  const control = attachImageResize({ handle, frame, width: 53 });
  key(handle, { key: 'ArrowRight' });
  assert.equal(events.at(-1).width, 55, 'a width of 53 went to 58');
  control.update(53);
  key(handle, { key: 'ArrowLeft' });
  assert.equal(events.at(-1).width, 50, 'a width of 53 went to 48');
  control.update(53);
  key(handle, { key: 'PageUp' });
  assert.equal(events.at(-1).width, 75);

  handle.style.direction = 'rtl';
  control.update(50);
  key(handle, { key: 'ArrowLeft' });
  assert.equal(events.at(-1).width, 55, 'Left does not widen a right to left block');
  key(handle, { key: 'ArrowRight' });
  assert.equal(events.at(-1).width, 50, 'Right does not narrow a right to left block');
  key(handle, { key: 'ArrowUp' });
  assert.equal(events.at(-1).width, 55, 'Up is not the same in both directions');
  key(handle, { key: 'ArrowDown' });
  assert.equal(events.at(-1).width, 50);

  // The same, without a handle.
  assert.equal(imageWidthForKey('ArrowRight', 50, { rtl: true }), 45);
  assert.equal(imageWidthForKey('ArrowRight', 50), 55);
  assert.equal(imageWidthForKey('Home', 50), 10);
  assert.equal(imageWidthForKey('End', 50), 100);
  assert.equal(imageWidthForKey('PageDown', 10), 10);
  assert.equal(imageWidthForKey('PageUp', 90), 100);
  assert.equal(imageWidthForKey('Enter', 50), null);
  assert.equal(imageWidthForKey('ArrowRight', 40, { step: 10, max: 60 }), 50);
  assert.equal(imageWidthForKey('ArrowRight', 60, { step: 10, max: 60 }), 60);
});

await it('A drag along the line sets the width as the share of the column the pointer has moved, and says it only when it ends', () => {
  const { frame, handle, events } = imageBlock('aria-label="Image width"');
  const capture = recordCapture(handle);
  attachImageResize({ handle, frame, width: 50 });
  const widthNow = () => handle.getAttribute('aria-valuenow');

  const down = pointer(handle, 'pointerdown', { clientX: 100 });
  assert.ok(down.defaultPrevented, 'the press selects the text under it');
  assert.deepEqual(capture, [['set', 1]], 'the drag does not follow the pointer off the handle');
  assert.ok(frame.hasAttribute('data-resizing'));
  assert.equal(document.activeElement, handle, 'a press on the handle does not leave focus where it was');

  // 40px of a 400px column is 10 points.
  pointer(handle, 'pointermove', { clientX: 140 });
  assert.equal(widthNow(), '60');
  assert.equal(frame.style.getPropertyValue(IMAGE_WIDTH_PROPERTY), '60%');
  assert.deepEqual(events, [{ width: 60, phase: 'move', source: 'pointer' }]);
  pointer(handle, 'pointermove', { clientX: 140 });
  assert.equal(events.length, 1, 'a move that changed nothing was said');
  pointer(handle, 'pointermove', { clientX: 5000 });
  assert.equal(widthNow(), '100', 'a drag past the column widened the block past it');
  pointer(handle, 'pointermove', { clientX: -5000 });
  assert.equal(widthNow(), '10', 'a drag past the start made the block narrower than a tenth');
  pointer(handle, 'pointermove', { clientX: 160 });
  assert.equal(widthNow(), '65');

  // Another pointer is not this drag.
  pointer(handle, 'pointermove', { clientX: 300, pointerId: 2 });
  pointer(handle, 'pointerup', { clientX: 300, pointerId: 2 });
  assert.equal(widthNow(), '65');
  assert.ok(frame.hasAttribute('data-resizing'));
  // The keys do not move a width that is being dragged, and a remote change does not fight it.
  key(handle, { key: 'ArrowRight' });
  assert.equal(widthNow(), '65');

  pointer(handle, 'pointerup', { clientX: 160 });
  assert.deepEqual(events.at(-1), { width: 65, phase: 'commit', source: 'pointer' });
  assert.equal(events.filter((e) => e.phase === 'commit').length, 1, 'a drag was committed more than once');
  assert.ok(!frame.hasAttribute('data-resizing'));
  assert.deepEqual(capture.at(-1), ['release', 1]);
  const after = events.length;
  pointer(handle, 'pointermove', { clientX: 10 });
  assert.equal(events.length, after, 'the handle follows a pointer that is up');
  assert.equal(widthNow(), '65');

  // The same, without a handle.
  assert.equal(imageWidthForDrag(50, 40, 400), 60);
  assert.equal(imageWidthForDrag(50, -40, 400), 40);
  assert.equal(imageWidthForDrag(50, 40, 400, { rtl: true }), 40);
  assert.equal(imageWidthForDrag(50, 9999, 400), 100);
  assert.equal(imageWidthForDrag(50, -9999, 400), 10);
  assert.throws(() => imageWidthForDrag(50, 10, 0), RangeError);
});

await it('Escape, a cancelled pointer, and a drag that ends where it began put the width back and write nothing', () => {
  const { frame, handle, events } = imageBlock();
  recordCapture(handle);
  const control = attachImageResize({ handle, frame, width: 50 });
  const widthNow = () => handle.getAttribute('aria-valuenow');

  pointer(handle, 'pointerdown', { clientX: 100 });
  pointer(handle, 'pointermove', { clientX: 180 });
  assert.equal(widthNow(), '70');
  const e = key(handle, { key: 'Escape' });
  assert.ok(e.defaultPrevented, 'Escape went on to close what the block is in');
  assert.equal(widthNow(), '50');
  assert.equal(frame.style.getPropertyValue(IMAGE_WIDTH_PROPERTY), '50%');
  assert.ok(!frame.hasAttribute('data-resizing'));
  assert.deepEqual(events.at(-1), { width: 50, phase: 'cancel', source: 'pointer' });
  pointer(handle, 'pointerup', { clientX: 180 });
  assert.ok(!events.some((x) => x.phase === 'commit'), 'a drag that was cancelled was committed');

  pointer(handle, 'pointerdown', { clientX: 100 });
  pointer(handle, 'pointermove', { clientX: 180 });
  pointer(handle, 'pointercancel', { clientX: 180 });
  assert.equal(widthNow(), '50', 'the browser took the pointer and the width stayed where it had got to');
  assert.deepEqual(events.at(-1), { width: 50, phase: 'cancel', source: 'pointer' });

  pointer(handle, 'pointerdown', { clientX: 100 });
  pointer(handle, 'pointermove', { clientX: 180 });
  pointer(handle, 'lostpointercapture', { clientX: 180 });
  assert.equal(widthNow(), '50');
  assert.ok(!frame.hasAttribute('data-resizing'));

  // There and back again is no change, and is not written.
  pointer(handle, 'pointerdown', { clientX: 100 });
  pointer(handle, 'pointermove', { clientX: 180 });
  pointer(handle, 'pointermove', { clientX: 100 });
  pointer(handle, 'pointerup', { clientX: 100 });
  assert.deepEqual(events.at(-1), { width: 50, phase: 'cancel', source: 'pointer' });
  assert.ok(!events.some((x) => x.phase === 'commit'));

  // A remote change is shown between drags and not during one.
  control.update(30);
  assert.equal(widthNow(), '30');
  pointer(handle, 'pointerdown', { clientX: 100 });
  control.update(80);
  assert.equal(widthNow(), '30', 'a change from elsewhere moved the block under the pointer');
  pointer(handle, 'pointerup', { clientX: 100 });
  control.update(80);
  assert.equal(widthNow(), '80');
  control.update(900);
  assert.equal(widthNow(), '100');
  assert.throws(() => control.update(Number.NaN), RangeError);
});

await it('A drag is not begun by a right button, a second finger, or a column with no width, and in a right to left block it runs the other way', () => {
  const { frame, handle } = imageBlock();
  attachImageResize({ handle, frame, width: 50 });
  assert.ok(!pointer(handle, 'pointerdown', { clientX: 100, button: 2 }).defaultPrevented, 'a right button began a drag');
  assert.ok(!pointer(handle, 'pointerdown', { clientX: 100, isPrimary: false, pointerId: 7 }).defaultPrevented, 'a second finger began a drag');
  assert.ok(!frame.hasAttribute('data-resizing'));

  const flat = imageBlock('', 0);
  attachImageResize({ handle: flat.handle, frame: flat.frame, width: 50 });
  assert.ok(!pointer(flat.handle, 'pointerdown', { clientX: 100 }).defaultPrevented, 'a column with no width began a drag');

  const rtl = imageBlock();
  rtl.handle.style.direction = 'rtl';
  attachImageResize({ handle: rtl.handle, frame: rtl.frame, width: 50 });
  pointer(rtl.handle, 'pointerdown', { clientX: 300 });
  pointer(rtl.handle, 'pointermove', { clientX: 260 });
  assert.equal(rtl.handle.getAttribute('aria-valuenow'), '60', 'a drag toward the end of the line, which is the left, does not widen');
  pointer(rtl.handle, 'pointerup', { clientX: 260 });
});

await it('destroy removes every listener, and the limits are held', () => {
  const { frame, handle, events } = imageBlock();
  recordCapture(handle);
  const control = attachImageResize({ handle, frame, width: 50 });
  pointer(handle, 'pointerdown', { clientX: 100 });
  control.destroy();
  assert.ok(!frame.hasAttribute('data-resizing'), 'a drag was left in progress');
  key(handle, { key: 'ArrowRight' });
  pointer(handle, 'pointerdown', { clientX: 100 });
  pointer(handle, 'pointermove', { clientX: 200 });
  assert.equal(events.length, 0, 'a handle that was destroyed still sends');
  assert.equal(handle.getAttribute('aria-valuenow'), '50');

  assert.equal(clampImageWidth(3), 10);
  assert.equal(clampImageWidth(150), 100);
  assert.equal(clampImageWidth(54.6), 55);
  assert.equal(clampImageWidth(20, { min: 25 }), 25);
  assert.throws(() => clampImageWidth(Number.NaN), RangeError);
  assert.throws(() => clampImageWidth(Infinity), RangeError);
  assert.throws(() => clampImageWidth(50, { min: 60, max: 40 }), RangeError, 'a minimum above the maximum');
  assert.throws(() => clampImageWidth(50, { max: 140 }), RangeError, 'a block wider than the column');
  assert.throws(() => clampImageWidth(50, { min: 0 }), RangeError, 'a block no wider than nothing');
  assert.throws(() => imageWidthForKey('ArrowRight', 50, { step: 0 }), RangeError);
  assert.throws(() => attachImageResize({ handle, frame, width: 50, min: 90, max: 20 }), RangeError);
});

await it('The helper has no side effect on load, and its types are held against the built declarations', async () => {
  const { spawnSync } = await import('node:child_process');
  const { fileURLToPath } = await import('node:url');
  const root = fileURLToPath(new URL('..', import.meta.url));

  // Loaded where there is no window or document, as a server module is.
  const bare = spawnSync(
    process.execPath,
    ['--input-type=module', '--eval', "const m = await import('./dist/src/a11y/index.js'); if (typeof m.attachImageResize !== 'function') process.exit(3);"],
    { cwd: root, encoding: 'utf8' },
  );
  assert.equal(bare.status, 0, `the a11y entry does not load without a document:\n${bare.stderr}`);

  const tsc = spawnSync(
    process.execPath,
    [
      'node_modules/typescript/bin/tsc', '--noEmit', '--strict', '--skipLibCheck', '--module', 'esnext',
      '--moduleResolution', 'bundler', '--target', 'es2022', '--lib', 'es2022,dom', 'scripts/fixtures/image-resize-types.ts',
    ],
    { cwd: root, encoding: 'utf8' },
  );
  assert.equal(tsc.status, 0, `scripts/fixtures/image-resize-types.ts does not compile:\n${tsc.stdout}${tsc.stderr}`);
});

await it('The image block is styled by the documented names, in tokens, and holds the target, the focus ring, the states and the media queries', async () => {
  const { readFileSync } = await import('node:fs');
  const { spawnSync } = await import('node:child_process');
  const { fileURLToPath } = await import('node:url');
  const root = fileURLToPath(new URL('..', import.meta.url));
  const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');
  const strip = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');
  const css = strip(read('../dist/styles/editor.css'));
  const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const block = (selector, source = css) => new RegExp(`(?:^|\\})\\s*${escape(selector)}\\s*\\{([^}]*)\\}`).exec(source)?.[1];
  const must = (selector, source) => {
    const body = block(selector, source);
    assert.ok(body !== undefined, `editor.css has no rule for ${selector}`);
    return body;
  };
  /** The body of each `@media (query) { … }`, braces counted. */
  const media = (query) => {
    const bodies = [];
    for (let at = css.indexOf(`@media ${query} {`); at >= 0; at = css.indexOf(`@media ${query} {`, at + 1)) {
      let depth = 0;
      let start = css.indexOf('{', at);
      for (let i = start; i < css.length; i++) {
        if (css[i] === '{') depth++;
        if (css[i] === '}' && --depth === 0) { bodies.push(css.slice(start + 1, i)); break; }
      }
    }
    return bodies.join('\n');
  };

  // The section the rules above are in, for the checks that are about all of it.
  const start = css.indexOf('.ekd-image {');
  const end = css.indexOf('.ekd-editor .callout-body');
  assert.ok(start > 0 && end > start, 'the image block is not in the editor stylesheet');
  const section = css.slice(start, end);

  // The frame: a share of the column, clamped here, with no fallback written into var().
  const frame = must('.ekd-image-frame');
  assert.match(frame, /position:\s*relative;/, 'the handle has nothing to be placed on');
  assert.match(frame, /inline-size:\s*clamp\(max\(10%, var\(--sp-7\)\), var\(--ekd-image-width\), 100%\);/, 'the width is not clamped to a tenth of the column and the room the handle needs, and to the column');
  assert.match(frame, /max-inline-size:\s*100%;/, 'a frame can be wider than the column');
  assert.ok(!/var\(--ekd-image-width\s*,/.test(css), 'the width has a fallback written into var()');
  const img = must('.ekd-image-img');
  assert.match(img, /inline-size:\s*100%;/);
  assert.match(img, /block-size:\s*auto;/, 'a picture is stretched to the height of its box');
  assert.match(img, /max-inline-size:\s*100%;/);
  assert.match(img, /border:\s*1px solid var\(--rule-soft\);/);
  assert.match(img, /border-radius:\s*var\(--radius-lg\);/);
  assert.match(img, /display:\s*block;/);

  // The caption is the table's caption: one rule for both.
  assert.match(css, /\.ekd-table-caption,\s*\.ekd-image-caption\s*\{[^}]*color:\s*var\(--fg-2\);/, 'the image caption is not drawn as the table caption is');

  // The handle: placed at the end edge in logical properties, inside the frame, 24px at the least.
  const handle = must('.ekd-image-resize');
  assert.match(handle, /position:\s*absolute;/);
  assert.match(handle, /inset-inline-end:\s*var\(--sp-1\);/, 'the handle is not on the inline-end edge, inside the frame: at the full width it widens the page');
  assert.match(handle, /inline-size:\s*var\(--sp-6\);/);
  assert.match(handle, /block-size:\s*var\(--sp-7\);/);
  const tokens = read('../tokens/generated/tokens.css');
  const px = (name) => Number(new RegExp(`${escape(name)}:\\s*(\\d+(?:\\.\\d+)?)px`).exec(tokens)?.[1]);
  assert.ok(px('--sp-6') >= 24, 'the handle is narrower than the 24px of WCAG 2.5.8');
  assert.ok(px('--sp-7') >= 24, 'the handle is shorter than the 24px of WCAG 2.5.8');
  assert.match(handle, /touch-action:\s*none;/, 'a touch on the handle scrolls the page instead of dragging it');
  assert.match(handle, /cursor:\s*ew-resize;/);
  assert.match(handle, /background:\s*var\(--bg-raised\);/, 'the handle has no ground of its own, and cannot be seen on every picture');
  assert.match(handle, /color:\s*var\(--fg-2\);/);
  assert.match(handle, /border:\s*1px solid var\(--rule-control\);/);
  assert.match(handle, /user-select:\s*none;/);
  assert.ok(!/(?:^|[;\s])(?:left|right|margin-left|margin-right|padding-left|padding-right)\s*:/.test(section), 'the block uses a physical side, and is wrong in a right to left document');
  // The grip is two lines, a shape, and not a colour.
  assert.match(must('.ekd-image-resize::before'), /border-inline:\s*2px solid currentColor;/, 'the grip is not drawn in lines');
  // Hover and drag, in inks that are measured.
  assert.match(must('.ekd-image-resize:hover,\n.ekd-image-frame[data-resizing] .ekd-image-resize'), /background:\s*var\(--bg-surface-2\);\s*color:\s*var\(--fg-1\);/);
  assert.match(must('.ekd-image-frame[data-resizing] .ekd-image-resize'), /border-color:\s*var\(--fg-1\);/);
  assert.match(must('.ekd-image-frame[data-resizing]'), /outline:\s*2px solid var\(--accent\);/);
  // The focus ring is two rings: the accent, and the ground between it and the handle.
  const focus = must('.ekd-image-resize:focus-visible');
  assert.match(focus, /outline:\s*2px solid var\(--accent\);/, 'the handle has no focus ring');
  assert.match(focus, /outline-offset:\s*2px;/);
  assert.match(focus, /box-shadow:\s*0 0 0 2px var\(--bg-raised\);/, 'the ring has no second edge, and is lost on a picture of its colour');
  assert.ok(!/:focus\s*\{|outline:\s*none|outline:\s*0/.test(section), 'a rule removes the focus ring');

  // The two states with no picture.
  const states = '.ekd-image:is([data-state="uploading"], [data-state="unavailable"])';
  const stated = must(`${states} .ekd-image-frame`);
  assert.match(stated, /background:\s*var\(--bg-surface-2\);/);
  assert.match(stated, /border:\s*1px solid var\(--rule-control\);/);
  assert.match(stated, /min-block-size:\s*var\(--sp-10\);/);
  assert.match(stated, /padding-inline-end:\s*calc\(var\(--sp-6\) \+ var\(--sp-3\)\);/, 'the status runs under the handle');
  assert.match(must('.ekd-image[data-state="unavailable"] .ekd-image-frame'), /border-style:\s*dashed;/, 'uploading and unavailable differ by colour or by nothing');
  assert.match(must(`${states} .ekd-image-img`), /display:\s*none;/, 'a picture that is not there is drawn');
  const status = must('.ekd-image-status');
  assert.match(status, /font-family:\s*var\(--font-sans\);/);
  assert.match(status, /color:\s*var\(--fg-1\);/);
  assert.match(status, /overflow-wrap:\s*anywhere;/, 'a status in a narrow block widens the page');

  // Tokens only, in everything the block draws: no colour literal, and no length
  // but the hairline and the two-pixel ring that the other rules also write.
  assert.ok(!/#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|oklch)\(/.test(section), 'the block writes a colour');
  for (const [length] of section.matchAll(/(?<![\w-])\d+(?:\.\d+)?px/g)) {
    assert.ok(['1px', '2px'].includes(length), `the block writes the length ${length}`);
  }
  assert.ok(!/text-transform|font-size:\s*\d|transition:[^;]*\d+m?s\b|cubic-bezier|var\(--[\w-]+\s*,/.test(section), 'the block writes a literal, or a fallback');
  assert.ok(!/@keyframes|animation\s*:/.test(section), 'the block moves, and has a reduced-motion rule to keep');

  // Reduced motion, forced colours, print.
  assert.match(media('(prefers-reduced-motion: reduce)'), /\.ekd-image-resize\s*\{\s*transition:\s*none;\s*\}/, 'the handle moves for a reader who asked for no motion');
  assert.match(handle, /transition:\s*background var\(--dur-fast\) var\(--ease-soft\);/);
  const forced = media('(forced-colors: active)');
  assert.match(forced, /\.ekd-image-resize\s*\{[^}]*background:\s*Canvas;[^}]*color:\s*ButtonText;[^}]*border-color:\s*ButtonText;/, 'the handle has no ground or border in forced colours');
  assert.match(forced, /\.ekd-image-resize:focus-visible\s*\{[^}]*outline-color:\s*Highlight;[^}]*box-shadow:\s*none;/, 'the ring is not the system\'s in forced colours');
  assert.match(forced, /\.ekd-image-frame\[data-resizing\]\s*\{\s*outline-color:\s*Highlight;/);
  assert.match(forced, /\.ekd-image:is\(\[data-state="uploading"\], \[data-state="unavailable"\]\) \.ekd-image-frame\s*\{\s*border-color:\s*CanvasText;/);
  assert.match(media('print'), /\.ekd-image-resize\s*\{\s*display:\s*none;\s*\}/, 'the handle is printed');

  // Every pair of inks that the block draws is one `check:contrast` measures,
  // at the threshold the use owes: 4.5:1 for text, 3:1 for a boundary or a mark.
  const pairs = JSON.parse(spawnSync(process.execPath, ['scripts/check-contrast.mjs', '--pairs'], { cwd: root, encoding: 'utf8' }).stdout);
  const threshold = (fg, bg) => pairs.find(([a, b]) => a === fg && b === bg)?.[2];
  for (const [fg, bg, owed, what] of [
    ['fg-2', 'bg-raised', 4.5, 'the grip'],
    ['rule-control', 'bg-raised', 3, 'the boundary of the handle'],
    ['accent', 'bg-raised', 3, 'the focus ring against the ground between it and the handle'],
    ['fg-1', 'bg-surface-2', 4.5, 'the handle under the pointer, and the status'],
    ['fg-2', 'bg-canvas', 4.5, 'the caption'],
    ['fg-3', 'bg-canvas', 4.5, 'the prompt of an empty caption'],
    ['rule-control', 'bg-canvas', 3, 'the edge of a block with no picture'],
  ]) {
    assert.ok(threshold(fg, bg) >= owed, `check:contrast does not hold ${what}: --${fg} on --${bg} at ${owed}:1`);
  }

  // The same rules are in every entry that carries the editor.
  for (const entry of ['base.css', 'components.css']) {
    const shipped = strip(read(`../dist/styles/${entry}`));
    for (const selector of ['.ekd-image-frame', '.ekd-image-resize', '.ekd-image-resize:focus-visible']) {
      assert.equal(block(selector, shipped), block(selector), `styles/${entry} does not carry ${selector} as editor.css has it`);
    }
  }

  // The README says what the code does: every class, the state, the property,
  // and every name the helper exports.
  const readme = read('../README.md');
  for (const name of [
    'ekd-image', 'ekd-image-frame', 'ekd-image-img', 'ekd-image-status', 'ekd-image-caption', 'ekd-image-resize',
    'data-state="uploading"', 'data-state="unavailable"', 'data-resizing', '--ekd-image-width',
    'attachImageResize', 'clampImageWidth', 'imageWidthForKey', 'imageWidthForDrag', 'IMAGE_RESIZE_EVENT',
    'ImageResizeDetail', 'ekd-image-resize', 'WCAG 2.5.7', 'WCAG 2.5.8',
  ]) {
    assert.ok(readme.includes(name), `the README does not say ${name}`);
  }
});

await it('Footnotes are styled by the documented names, in tokens, and hold the focus ring, no enlarged target, the numbering, the highlight and the media queries', async () => {
  const { readFileSync } = await import('node:fs');
  const { spawnSync } = await import('node:child_process');
  const { fileURLToPath } = await import('node:url');
  const root = fileURLToPath(new URL('..', import.meta.url));
  const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');
  const strip = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');
  const css = strip(read('../dist/styles/editor.css'));
  const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const block = (selector, source = css) => new RegExp(`(?:^|[{}])\\s*${escape(selector)}\\s*\\{([^}]*)\\}`).exec(source)?.[1];
  const must = (selector, source) => {
    const body = block(selector, source);
    assert.ok(body !== undefined, `editor.css has no rule for ${selector}`);
    return body;
  };
  /** The body of each `@media (query) { … }`, braces counted. */
  const media = (query) => {
    const bodies = [];
    for (let at = css.indexOf(`@media ${query} {`); at >= 0; at = css.indexOf(`@media ${query} {`, at + 1)) {
      let depth = 0;
      const open = css.indexOf('{', at);
      for (let i = open; i < css.length; i++) {
        if (css[i] === '{') depth++;
        if (css[i] === '}' && --depth === 0) { bodies.push(css.slice(open + 1, i)); break; }
      }
    }
    return bodies.join('\n');
  };

  // The section the checks about all of it read: the marker to the end of the
  // stylesheet, which is the editor's last rules (the code block is code.css).
  const start = css.indexOf('.ekd-footnote-ref {');
  assert.ok(start > 0, 'the footnotes are not in the editor stylesheet');
  const section = css.slice(start);

  // The marker reads as a link, and is not given a height in the line.
  const ref = must('.ekd-footnote-ref');
  assert.ok(!/position\s*:/.test(ref), 'the marker is positioned, which only an enlarged target needs');
  assert.match(ref, /color:\s*var\(--accent\);/, 'the marker is not the colour of a link');
  assert.match(ref, /text-decoration:\s*underline;/, 'the marker differs from the text by a hue alone');
  assert.match(ref, /font-weight:\s*var\(--fw-medium\);/);
  assert.ok(!/(?:^|[;\s])(?:display|line-height|height|block-size|padding[\w-]*|margin[\w-]*)\s*:/.test(ref), 'the marker is given a box that can open the line');
  assert.match(must('.ekd-footnote-ref:hover'), /text-decoration-thickness:\s*0\.12em;/);
  assert.match(css, /mark \.ekd-footnote-ref\s*\{\s*color:\s*inherit;/, 'a marker in a highlight takes the accent, which does not hold there');

  // No enlarged target: a marker in a sentence is exempt from 24px (WCAG 2.5.8,
  // Inline), and an invisible square beside the number caught clicks meant for
  // the text. Nothing draws a pseudo-element on the marker, or positions it.
  assert.equal(block('.ekd-footnote-ref::after'), undefined, 'the marker draws an enlarged target again');
  assert.ok(!/\.ekd-footnote-ref[^{}]*::(?:after|before)/.test(section), 'a rule draws a pseudo-element on the marker');

  // The focus ring is the system's, written out, and nothing removes it.
  const focus = must('.ekd-footnote-ref:focus-visible');
  assert.match(focus, /outline:\s*2px solid var\(--accent\);/, 'the marker has no focus ring');
  assert.match(focus, /outline-offset:\s*2px;/);
  assert.match(focus, /border-radius:\s*var\(--radius-xs\);/);
  assert.ok(!/:focus\s*\{|outline:\s*none|outline:\s*0/.test(section), 'a rule removes the focus ring');

  // The list: set apart by the section rule, numbered by the list.
  const list = must('.ekd-footnotes');
  assert.match(list, /border-block-start:\s*1px solid var\(--rule-strong\);/, 'the notes are not set apart by a rule');
  assert.match(list, /margin-block-start:\s*var\(--sp-7\);/);
  assert.match(list, /padding-block-start:\s*var\(--sp-4\);/);
  assert.match(list, /font-size:\s*var\(--fs-base\);/);
  const ol = must('.ekd-footnotes > ol');
  assert.match(ol, /list-style:\s*decimal;/, 'the numbers are not the list\'s own, and can disagree with the markers');
  assert.match(ol, /padding-inline-start:\s*var\(--sp-7\);/, 'the numbers have no room');
  assert.ok(!/counter-(?:reset|increment)/.test(section), 'the notes are numbered by a counter, which can disagree with the markers');
  assert.match(must('.ekd-footnotes > ol > li::marker'), /color:\s*var\(--fg-2\);/);

  // One note: editable text with its line breaks.
  const note = must('.ekd-footnote');
  assert.match(note, /white-space:\s*pre-wrap;/, 'a line break in a note is lost');
  assert.match(note, /overflow-wrap:\s*anywhere;/, 'an address in a note widens the page');
  assert.match(note, /transition:\s*background-color var\(--dur-slow\) var\(--ease-soft\);/);
  assert.match(must('.ekd-footnote + .ekd-footnote'), /margin-block-start:\s*var\(--sp-2\);/);

  // The highlight, and the media queries.
  assert.match(must('.ekd-footnote[data-footnote-target]'), /background-color:\s*var\(--accent-soft\);/, 'the jump is not shown');
  assert.match(media('(prefers-reduced-motion: reduce)'), /\.ekd-footnote\s*\{\s*transition:\s*none;\s*\}/, 'the note fades for a reader who asked for no motion');
  assert.match(media('(forced-colors: active)'), /\.ekd-footnote\[data-footnote-target\]\s*\{[^}]*outline:\s*2px solid Highlight;/, 'the jump is not shown in forced colours, where a wash is not drawn');
  assert.ok(!/@keyframes|animation\s*:/.test(section), 'the highlight moves by a means the reduced-motion rule does not reach');

  // Tokens only: no colour literal, no length but the hairline and the 2px ring,
  // no fallback in a var(), no case change, no physical side.
  assert.ok(!/#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|oklch)\(/.test(section), 'the footnotes write a colour');
  for (const [length] of section.matchAll(/(?<![\w-])\d+(?:\.\d+)?px/g)) {
    assert.ok(['1px', '2px'].includes(length), `the footnotes write the length ${length}`);
  }
  assert.ok(!/text-transform|font-size:\s*\d|transition:[^;]*\d+m?s\b|cubic-bezier|var\(--[\w-]+\s*,/.test(section), 'the footnotes write a literal, or a fallback');
  assert.ok(!/(?:^|[;\s{])(?:left|right|margin-left|margin-right|padding-left|padding-right)\s*:/.test(section), 'the footnotes use a physical side, and are wrong in a right to left document');

  // Every pair of inks that the footnotes draw is one `check:contrast` measures.
  const pairs = JSON.parse(spawnSync(process.execPath, ['scripts/check-contrast.mjs', '--pairs'], { cwd: root, encoding: 'utf8' }).stdout);
  const threshold = (fg, bg) => pairs.find(([a, b]) => a === fg && b === bg)?.[2];
  for (const [fg, bg, what] of [
    ['accent', 'bg-canvas', 'the marker and its focus ring'],
    ['fg-2', 'bg-canvas', 'the numbers of the notes'],
    ['fg-1', 'accent-soft', 'a note that has been jumped to'],
  ]) {
    assert.ok(threshold(fg, bg) >= 4.5, `check:contrast does not hold ${what}: --${fg} on --${bg} at 4.5:1`);
  }

  // The same rules are in every entry that carries the editor.
  for (const entry of ['base.css', 'components.css']) {
    const shipped = strip(read(`../dist/styles/${entry}`));
    for (const selector of ['.ekd-footnote-ref', '.ekd-footnotes', '.ekd-footnote']) {
      assert.equal(block(selector, shipped), block(selector), `styles/${entry} does not carry ${selector} as editor.css has it`);
    }
  }

  // The README says every name, and the ruleset says the footnotes.
  const readme = read('../README.md');
  for (const name of ['ekd-footnote-ref', 'ekd-footnotes', 'ekd-footnote', 'data-footnote-target', 'WCAG 2.5.8']) {
    assert.ok(readme.includes(name), `the README does not say ${name}`);
  }
  assert.ok(read('../docs/visual-ruleset.md').includes('data-footnote-target'), 'the visual ruleset does not say the footnotes');
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
