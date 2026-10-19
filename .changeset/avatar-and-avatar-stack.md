---
'@ekdotico/domico': minor
---

`Avatar` and `AvatarStack`: a person's picture, and the people who have a document open as a row of them. Requested by the Ekdotico application (register row PR-1, Ekdotico/ekdotico#49). Nothing is renamed, removed or changed in meaning: two components, one helper, one stylesheet entry and no token.

**Added: `Avatar`.** The picture is the person's initials on their collaborator colour, `--collab-N` with `--collab-N-ink`, so one person is one colour in the caret, the selection and the header. An image path is ready and nothing uploads: `src` is drawn over the letters, with no alternative text of its own, and the letters are what is left if it fails to load.

- Props: `collaboratorSlot` (1 to 10, required; anything else is a `RangeError` at render), `name` or `initials` (one is required), `label` or `decorative` (one is required, not both), `src`, `size` (`'sm' | 'md' | 'lg'`, 24, 32 and 40 pixels at least: `--sp-6`, `--sp-7`, `--sp-8`).
- **Every call says whether the picture is named.** `label` makes it an image with that name, for an avatar that stands alone. `decorative` hides it from a screen reader, for one beside the person's name or in a stack. There is no default and the types refuse a call that gives neither, because an unnamed picture draws exactly as a named one.
- **Initials are cut by grapheme.** `avatarInitials(name)` is exported: the first grapheme of the first and of the last word, capitalised with `toUpperCase` (locale-independent, so the server and the browser agree). `Μαρία Παπαδοπούλου` is `ΜΠ`; an accent, a combining mark, a letter outside the BMP, a flag and a joined emoji are each one character. `initials`, where passed, are drawn as given, cut to two graphemes. The letters are `--font-sans`, which has Greek.
- The circle is a minimum (`min-inline-size`, `aspect-ratio: 1`) and grows with its letters, so a larger text size is a larger picture and not clipped letters (WCAG 1.4.4). At the default size every picture in a row is the same size.
- The ring is a 2px border in `--bg-surface`, not a shadow, so forced colours keep it; there it is `CanvasText`.

**Added: `AvatarStack`.** A `<ul role="list">` named by `label`. Each person is an item holding the picture (`aria-hidden`) and a line of text, hidden from the page and kept inside the item, that reads the name, the `you` words in parentheses and then the role: "Maria Papadopoulou (you), Editor". The item is `position: relative`, so the hidden words cannot escape a scroll container (the 0.30.0 lesson); the stylesheet carries its own copy of the technique.

- Props: `label`, `people` (`{ id, name, collaboratorSlot, role?, initials?, src?, you? }`), `max` (people drawn, 4 unless set), `more` (`(hidden: number) => string`, required, called only when someone is left out), `size`. Every word a screen reader hears is the application's: the package has no default for `label`, `more`, `you` or `role`.
- Past `max`, one more item counts the rest. It draws `+3` (`aria-hidden`) and reads `more(3)`, "and 3 more people" in the application's words. It is the one picture with no person's colour: `--fg-1` on `--bg-surface-2`.
- **Not focusable, deliberately.** A person in the stack has nothing to do today, and a Tab stop that does nothing is one the reader must pass and a control that is not one (WCAG 4.1.2). It is read in reading order, as a list. When a person gets an action it is a new prop and a button in the item; the stylesheet already raises an item with focus above its neighbours, so the overlap will not hide its ring.
- A person with `you` has a ring in `--fg-1` as well as the words. Colour is never the only signal: the name is text in the item.
- Each picture overlaps the one before by 4px (2px at `sm`), short of the second letter; the row wraps, so ten large pictures at 320px are two lines and not a horizontal scroll bar. Nothing moves, so there is no motion to reduce.

**Added: `@ekdotico/domico/styles/avatar.css`**, sliced from `components.css` like the other entries and carried by `styles.css` and `styles/components.css`. Classes: `ekd-avatar`, `ekd-avatar--sm`, `ekd-avatar--lg`, `ekd-avatar-slot-1` to `-10`, `ekd-avatar-letters`, `ekd-avatar-image`, `ekd-avatar-stack`, `ekd-avatar-stack--sm`, `ekd-avatar-stack-item`, `ekd-avatar-text`. `build:styles` now writes thirty-three entries.

**Contrast.** `check:contrast` lists, for each of the ten slots, `--collab-N-ink` on `--collab-N` at 4.5:1 and `--collab-N` on `--bg-surface` and on `--bg-canvas` at 3:1, in all eight palettes (240 measurements more; 704 in all). The worst initials are 4.68:1 (light) and 5.22:1 (dark); the worst edge against the ring 4.37:1 and against the canvas 4.15:1. `check-contrast.mjs --pairs` prints the list.

**Documentation.** The README has a new section, The avatar and the avatar stack, and the subpath table lists `avatar.css`; `docs/visual-ruleset.md` and the Collaborator section of `docs/design-tokens.md` say what the picture is and how it is measured.

`check:components` holds each part: the letters of Greek, accented, combining, astral and emoji names; `label` and `decorative` and the `RangeError`; the image replacing and then yielding to the letters; the list's role, name, order, hidden words inside their items, the count and its words, `max`, `you`, and that nothing in it is focusable; the types by compiling `scripts/fixtures/avatar-types.tsx` against the built declarations; and `dist/styles/avatar.css`, for the slot-to-token mapping of each of the ten slots, the pairs `check:contrast` measures for them, the minimum size, the sans, the border ring, the wrap, the positioned item, the focus raise and the absence of motion. Each fails if its part is reverted.
