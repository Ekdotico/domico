---
'@ekdotico/domico': minor
---

Numbered shortcuts for a navigation. `useNavShortcuts(ref, { enabled, items, delay })` and `attachNavShortcuts(element, options)`, from `@ekdotico/domico/a11y`, number the first nine items of the application's own navigation: Shift and a digit follows the item, and holding Shift alone for 400 ms shows each number as a badge at the end of its row. The badge is drawn by the new `@ekdotico/domico/styles/nav-shortcuts.css` from `data-nav-shortcut` on the item and `data-nav-shortcuts="visible"` on the navigation; each numbered item also carries `aria-keyshortcuts`.

Nothing happens while focus is in a text field, a textarea, a select or an editable region, or with Ctrl, Alt or Meta held, and the digit is matched by its physical key so every keyboard layout answers. WCAG 2.1.4 applies to a shortcut that types a character, so an application that turns this on offers a setting that turns it off and passes it as `enabled`.

Nothing existing changes, and nothing is on until an application calls the hook.
