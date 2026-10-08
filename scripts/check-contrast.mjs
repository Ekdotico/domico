#!/usr/bin/env node
/**
 * WCAG contrast, across every palette.
 *
 * The colour system's accessibility was asserted in prose and checked by hand,
 * which is how `--accent-ink` on Parchment dark shipped at 3.22:1 — white ink
 * on a light lavender accent, below the 4.5:1 a button label needs. Three of
 * the four dark palettes already used dark ink there; the fourth was simply
 * missed, and nothing could notice.
 *
 * Each pair below is a foreground token and the surface it is actually drawn
 * on. Resolution follows the same cascade as the stylesheet, so what is
 * measured is what a reader sees rather than what a single source file
 * declares.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { oklchToHex, contrast } from '../tokens/lib/color.mjs';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const THEMES = ['parchment', 'library', 'sepia', 'mono'];
const MODES = ['light', 'dark'];

/** Foreground token, the surface it sits on, and the threshold it must meet. */
const PAIRS = [
  ['fg-1', 'bg-canvas', 4.5],
  ['fg-2', 'bg-canvas', 4.5],
  ['fg-3', 'bg-canvas', 4.5],
  ['fg-4', 'bg-canvas', 4.5],
  ['fg-1', 'bg-surface', 4.5],
  ['fg-3', 'bg-surface', 4.5],
  // Surfaces the consumers actually draw text on, found by the September 2026
  // accessibility review and previously unlisted: a typed value in an inset
  // field, the in-flight submit button, an error message inside a card, and a
  // hovered primary action. All four pass today; listed so they stay checked.
  ['fg-1', 'bg-inset', 4.5],
  // --fg-3 as text on --bg-surface-2: the table header row, the table caption,
  // and the non-critical and unpublished badges, all in the shared components.
  // Unlisted, sepia light shipped it at 4.32:1. Its --fg-3 now sits at the
  // lightness that first clears 4.6:1 there, a hue- and chroma-preserving move
  // of 1.6 points, and the other seven palettes already cleared 4.7:1.
  //
  // Also the mark of a checked checkbox or radio that is disabled, since
  // 0.25.0. A graphical object, which owes 3:1, held here at the stricter
  // figure the pair already carried.
  ['fg-3', 'bg-surface-2', 4.5],
  ['fg-1', 'accent-soft', 4.5],
  ['danger', 'bg-surface', 4.5],
  ['accent-ink', 'accent-hover', 4.5],
  // --rule-control is the boundary of a control — a text field, a quiet
  // button — and WCAG 2.2 SC 1.4.11 asks 3:1 of a visible boundary, against
  // every surface a control sits on. The three hairlines are unlisted on
  // purpose: a divider claims no threshold, and measured they sit at 1.6:1 to
  // 1.9:1, which is why a control drawn with one was invisible as a control.
  ['rule-control', 'bg-canvas', 3],
  ['rule-control', 'bg-surface', 3],
  ['rule-control', 'bg-surface-2', 3],
  ['rule-control', 'bg-inset', 3],
  ['rule-control', 'bg-raised', 3],
  // The form controls, the dialog and the tooltip, added at 0.25.0. A dialog
  // and a tooltip sit on --bg-raised, which no pair here had measured, and
  // three inks the rest of the system uses as text do not hold there: --fg-3
  // is 4.40:1 in sepia dark, --accent 4.42:1 and --danger 4.27:1 in parchment
  // dark. So the controls draw text on it in --fg-1 and --fg-2 alone, and use
  // --accent and --danger there as boundaries and marks, which owe 3:1. The
  // pairs are listed so that choice stays measured rather than remembered.
  ['fg-1', 'bg-raised', 4.5],
  ['fg-2', 'bg-raised', 4.5],
  ['accent', 'bg-raised', 3],
  ['danger', 'bg-raised', 3],
  // The hint under a label, on a card. On the canvas it is already listed.
  ['fg-2', 'bg-surface', 4.5],
  // The field message and the form fault: --fg-1 on the danger wash.
  ['fg-1', 'danger-soft', 4.5],
  // A hovered secondary button and the dialog's close button.
  ['fg-1', 'bg-surface-2', 4.5],
  // The read-only field, added at 0.26.0. It has no ground of its own, so
  // its value and its boundary are drawn on whichever surface the form sits
  // on. The value is --fg-1 and the boundary --rule-control, and each is
  // listed above against --bg-canvas, --bg-surface, --bg-surface-2 and
  // --bg-raised. What that leaves is the boundary of a read-only field that
  // has focus or is invalid, on the two surfaces where --accent and --danger
  // had not been measured as boundaries. Graphical objects, so 3:1.
  ['accent', 'bg-surface', 3],
  ['accent', 'bg-surface-2', 3],
  ['danger', 'bg-surface-2', 3],
  ['accent', 'bg-canvas', 4.5],
  ['accent-ink', 'accent', 4.5],
  ['gilt', 'bg-canvas', 4.5],
  // Gilt text on the gilt wash — the preview banner and the LIS field labels.
  // Absent from this list, a consumer forked a darker gilt of its own to pass,
  // and that fork then failed on every dark palette. A surface a consumer
  // actually draws on belongs here.
  ['gilt', 'gilt-soft', 4.5],
  ['warn', 'bg-canvas', 4.5],
  ['danger', 'bg-canvas', 4.5],
  ['ok', 'bg-canvas', 4.5],
  ['info', 'bg-canvas', 4.5],
  ['fg-xref', 'bg-canvas', 4.5],
  // Diagram edges, on the surface Mermaid is handed as its `background`. A
  // graphical object rather than text, so WCAG 2.2 SC 1.4.11 applies at 3:1
  // rather than 4.5:1. Listed because --diagram-edge is per-theme: four
  // separate hues, each of which has to stay visible on its own canvas, is
  // exactly the shape of thing that passes on the theme it was picked against
  // and fails on one of the other three.
  ['diagram-edge', 'bg-surface', 3],
  // --fg-4 on --bg-surface-2 at the NON-TEXT threshold, and the threshold is the
  // whole point of the entry. Measured, it is 4.20:1 to 4.36:1 across the four
  // light palettes: short of 4.5:1, and not a violation, because its only use is
  // the appearance control's mode pill where the content is icons and SC 1.4.11
  // applies at 3:1.
  //
  // Listed rather than omitted so the constraint is executable. The pair used to
  // be simply absent, and an absence cannot distinguish "checked and permitted"
  // from "never considered" — so the day someone reaches for --fg-4 as a muted
  // body text colour on that surface, nothing here would have objected. At 3:1
  // this entry keeps the token honest for the use it has, and the catalogue
  // records that it is icon-only. Raising this to 4.5 is the correct change if
  // the token ever carries prose; darkening the light sources by about 3%
  // lightness is what that would take.
  ['fg-4', 'bg-surface-2', 3],
  // --fg-5 is decorative only — hairlines and separators — at 1.41:1 to 2.01:1.
  // No text threshold applies and none is claimed; 1.4.11 does not cover purely
  // decorative graphics either, so this is deliberately not in the list. Stated
  // here because the catalogue says it is decorative, and a reader checking
  // whether that claim is enforced should find the answer rather than silence.
];

const read = (theme, mode) => {
  try {
    return JSON.parse(readFileSync(join(ROOT, `tokens/source/color.${theme}.${mode}.json`), 'utf8'));
  } catch {
    return {};
  }
};

/** Parchment light is the complete base; the rest override it, dark last. */
function layer(theme, mode) {
  return {
    ...read('parchment', 'light'),
    ...read(theme, 'light'),
    ...(mode === 'dark' ? { ...read('parchment', 'dark'), ...read(theme, 'dark') } : {}),
  };
}

const toHex = (value) => (value?.startsWith('oklch') ? oklchToHex(value) : value);

const failures = [];
let checked = 0;

for (const theme of THEMES) {
  for (const mode of MODES) {
    const tokens = layer(theme, mode);
    for (const [fg, bg, threshold] of PAIRS) {
      const fgValue = tokens[fg]?.$value;
      const bgValue = tokens[bg]?.$value;
      // A token absent from every layer is not a contrast failure; the
      // generated-artefact check is what covers missing tokens.
      if (!fgValue || !bgValue) continue;

      const ratio = contrast(toHex(fgValue), toHex(bgValue));
      checked++;
      if (ratio < threshold) {
        failures.push(
          `${theme}/${mode}: --${fg} on --${bg} is ${ratio.toFixed(2)}:1, below ${threshold}:1 ` +
            `(${toHex(fgValue)} on ${toHex(bgValue)})`,
        );
      }
    }
  }
}

if (failures.length > 0) {
  console.error('check:contrast — pairs below their WCAG threshold:\n');
  for (const f of failures) console.error(`  - ${f}`);
  console.error(
    '\nRaise the foreground, or darken the surface. Do not lower the threshold:\n' +
      'the reading measure and the colour system are both inclusive-design\n' +
      'constraints rather than preferences.',
  );
  process.exit(1);
}

console.log(`check:contrast — ${checked} foreground/surface pairs meet WCAG AA across 8 palettes`);
