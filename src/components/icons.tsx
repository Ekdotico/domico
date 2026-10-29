import type { SVGProps } from 'react';

/**
 * The Ekdotico icon set.
 *
 * domico's own set, built on Tabler and vendored: the path data lives here
 * rather than a package being installed. An icon set ships thousands of glyphs
 * to serve a few dozen, and vendoring avoids that weight, an extra
 * supply-chain surface, and a version to track — for a set that changes
 * perhaps twice a year.
 *
 * Most icons are Tabler outline icons, copied verbatim from `@tabler/icons`.
 * The rest are drawn to Tabler's construction — the 24-unit grid, the 1.5
 * stroke, round caps and joins — so the set reads as one: seven are Phosphor
 * regular icons redrawn as strokes with Phosphor's design kept, and the quote
 * is drawn after MingCute's with its heads filled. `scripts/icon-sources.json`
 * records where every icon comes from, and `check:icons` holds each Tabler one
 * to its original.
 *
 * The cost of vendoring is that conformance is a convention rather than
 * something the package manager enforces. This module is how that cost is
 * paid: the geometry lives in exactly one place, at one stroke weight, on one
 * viewBox, so an icon cannot drift in a single consumer without the drift
 * being visible here.
 *
 * **Adding an icon:** take a Tabler outline icon when one fits. Copy the inner
 * markup from `node_modules/@tabler/icons/icons/outline/<name>.svg` unchanged,
 * less the invisible bounding path, and add a component below and its line in
 * `icon-sources.json`. Do not adjust coordinates to taste — a set that has
 * been individually tuned stops reading as a set. An icon drawn here instead
 * is the exception, keeps to the construction above, and names what it was
 * drawn from.
 *
 * The Ekdotico logo mark is the only icon in the system outside this set.
 */

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'children'> {
  /** Rendered size in pixels, applied to both axes. Defaults to 16. */
  size?: number;
  /**
   * Accessible name. Omit for a decorative icon sitting beside a text label —
   * the icon is then hidden from assistive technology, which is correct when
   * the adjacent text already carries the meaning.
   */
  title?: string;
}

/**
 * Shared chrome for every icon.
 *
 * Stroke is 1.5 rather than Tabler's own 2: the house style is hairlines, and
 * a 2px stroke reads heavy against the type. At the 16px default it draws at
 * one pixel. It is set here rather than per-icon so it cannot vary between
 * them.
 */
function Icon({ size = 16, title, children, ...rest }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      {...rest}
    >
      {children}
    </svg>
  );
}

export function SunIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M8 12a4 4 0 1 0 8 0a4 4 0 1 0 -8 0" />
      <path d="M3 12h1m8 -9v1m8 8h1m-9 8v1m-6.4 -15.4l.7 .7m12.1 -.7l-.7 .7m0 11.4l.7 .7m-12.1 -.7l-.7 .7" />
    </Icon>
  );
}

export function MonitorIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3" y="4.5" width="18" height="13.5" rx="1.5" />
      <path d="M9 21h6" />
    </Icon>
  );
}

export function MoonIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M10.135 2.635A9.008 9.008 0 0 0 21.365 13.865A9 9 0 1 1 10.135 2.635Z" />
    </Icon>
  );
}

/**
 * The appearance menu's trigger. Each of the four dots is a circle of 0.375
 * units drawn by the stroke alone: at 1.5 the stroke closes it into a solid
 * dot of 1.125, so the dots keep the set's weight rather than carrying a fill.
 */
export function PaletteIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M21 12A8.825 8.825 0 0 1 20.782 13.957A2.25 2.25 0 0 1 18.582 15.75L14.25 15.75A2.25 2.25 0 0 0 12 18A2.25 2.25 0 0 1 8.981 20.119C5.443 18.866 3 15.87 3 12A9 9 0 0 1 11.906 3C16.892 2.95 21 6.961 21 12Z" />
      <circle cx="12" cy="7.125" r=".375" />
      <circle cx="7.875" cy="9.375" r=".375" />
      <circle cx="7.875" cy="14.625" r=".375" />
      <circle cx="16.125" cy="9.375" r=".375" />
    </Icon>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="10.5" cy="10.5" r="7.5" />
      <path d="M15.803 15.803L21 21" />
    </Icon>
  );
}

export function MessageSquareIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M8 9h8" />
      <path d="M8 13h6" />
      <path d="M18 4a3 3 0 0 1 3 3v8a3 3 0 0 1 -3 3h-5l-5 3v-3h-2a3 3 0 0 1 -3 -3v-8a3 3 0 0 1 3 -3h12" />
    </Icon>
  );
}

export function MenuIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 6l16 0" />
      <path d="M4 12l16 0" />
      <path d="M4 18l16 0" />
    </Icon>
  );
}

export function XIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M18 6l-12 12" />
      <path d="M6 6l12 12" />
    </Icon>
  );
}

export function ChevronLeftIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M15 6l-6 6l6 6" />
    </Icon>
  );
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6 9l6 6l6 -6" />
    </Icon>
  );
}

export function DownloadIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2" />
      <path d="M7 11l5 5l5 -5" />
      <path d="M12 4l0 12" />
    </Icon>
  );
}

export function TableIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3 5a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v14a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-14" />
      <path d="M3 10h18" />
      <path d="M10 3v18" />
    </Icon>
  );
}

export function MaximizeIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 8v-2a2 2 0 0 1 2 -2h2" />
      <path d="M4 16v2a2 2 0 0 0 2 2h2" />
      <path d="M16 4h2a2 2 0 0 1 2 2v2" />
      <path d="M16 20h2a2 2 0 0 0 2 -2v-2" />
    </Icon>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 5l0 14" />
      <path d="M5 12l14 0" />
    </Icon>
  );
}

export function MinusIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5 12l14 0" />
    </Icon>
  );
}

export function PencilIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 20h4l10.5 -10.5a2.828 2.828 0 1 0 -4 -4l-10.5 10.5v4" />
      <path d="M13.5 6.5l4 4" />
    </Icon>
  );
}

export function ArrowUpRightIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M17 7l-10 10" />
      <path d="M8 7l9 0l0 9" />
    </Icon>
  );
}

export function CircleQuestionMarkIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 13.5v-.75c1.657 0 3-1.176 3-2.625s-1.343-2.625-3-2.625S9 8.676 9 10.125v.375" />
      <circle cx="12" cy="16.875" r=".375" />
    </Icon>
  );
}

// --- The nine marks of the editor ------------------------------------------
// One for each mark a writer applies to a selection, in the order the
// selection toolbar shows them. Each is the only content of a `ToggleButton`,
// which names it: an icon here carries no `title` of its own.

export function BoldIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M7 5h6a3.5 3.5 0 0 1 0 7h-6l0 -7" />
      <path d="M13 12h1a3.5 3.5 0 0 1 0 7h-7v-7" />
    </Icon>
  );
}

export function ItalicIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M11 5l6 0" />
      <path d="M7 19l6 0" />
      <path d="M14 5l-4 14" />
    </Icon>
  );
}

export function UnderlineIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M7 5v5a5 5 0 0 0 10 0v-5" />
      <path d="M5 19h14" />
    </Icon>
  );
}

export function StrikethroughIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5 12l14 0" />
      <path d="M16 6.5a4 2 0 0 0 -4 -1.5h-1a3.5 3.5 0 0 0 0 7h2a3.5 3.5 0 0 1 0 7h-1.5a4 2 0 0 1 -4 -1.5" />
    </Icon>
  );
}

export function CodeIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M7 8l-4 4l4 4" />
      <path d="M17 8l4 4l-4 4" />
      <path d="M14 4l-4 16" />
    </Icon>
  );
}

export function SuperscriptIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5 7l8 10m-8 0l8 -10" />
      <path d="M21 11h-4l3.5 -4a1.73 1.73 0 0 0 -3.5 -2" />
    </Icon>
  );
}

export function SubscriptIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5 7l8 10m-8 0l8 -10" />
      <path d="M21 20h-4l3.5 -4a1.73 1.73 0 0 0 -3.5 -2" />
    </Icon>
  );
}

export function LinkIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M9 15l6 -6" />
      <path d="M11 6l.463 -.536a5 5 0 0 1 7.071 7.072l-.534 .464" />
      <path d="M13 18l-.397 .534a5.068 5.068 0 0 1 -7.127 0a4.972 4.972 0 0 1 0 -7.071l.524 -.463" />
    </Icon>
  );
}

export function HighlighterIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M13.286 3.96L8.786 8.46L16.5 16.174L21 11.674" />
      <path d="M9.429 9.103L6.857 11.674L13.286 18.103L15.857 15.531" />
      <path d="M8.143 12.96L3 18.103L8.786 20.031L12 16.817" />
    </Icon>
  );
}

// --- The callout's six types -----------------------------------------------
// `Callout` draws one of these when it is asked for an icon: a note, a tip and
// a warning are the three the editor offers, and the other three types take
// one too, so the option does not work for half of them.

export function StickyNoteIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M13 20l7 -7" />
      <path d="M13 20v-6a1 1 0 0 1 1 -1h6v-7a2 2 0 0 0 -2 -2h-12a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h7" />
    </Icon>
  );
}

export function LightbulbIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M8.538 17.019A2.077 2.077 0 0 0 7.734 15.375A6.923 6.923 0 1 1 16.266 15.375A2.077 2.077 0 0 0 15.462 17.019L15.462 17.538A0.692 0.692 0 0 1 14.769 18.231L9.231 18.231A0.692 0.692 0 0 1 8.538 17.538Z" />
      <path d="M8.538 21L15.462 21" />
      <path d="M12.692 5.769C14.431 6.063 15.86 7.495 16.154 9.231" />
    </Icon>
  );
}

export function TriangleAlertIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 9v4" />
      <path d="M10.363 3.591l-8.106 13.534a1.914 1.914 0 0 0 1.636 2.871h16.214a1.914 1.914 0 0 0 1.636 -2.87l-8.106 -13.536a1.914 1.914 0 0 0 -3.274 0" />
      <path d="M12 16h.01" />
    </Icon>
  );
}

export function InfoIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0" />
      <path d="M12 9h.01" />
      <path d="M11 12h1v4h1" />
    </Icon>
  );
}

export function OctagonAlertIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3 9.101v5.798c0 .53 .211 1.039 .586 1.415l4.1 4.1c.375 .375 .884 .586 1.415 .586h5.799c.53 0 1.039 -.211 1.414 -.586l4.1 -4.1c.375 -.375 .586 -.884 .586 -1.415v-5.798c0 -.53 -.211 -1.039 -.586 -1.415l-4.1 -4.1c-.375 -.375 -.884 -.586 -1.414 -.586l-5.799 0c-.53 0 -1.039 .211 -1.415 .586l-4.1 4.1c-.375 .375 -.586 .884 -.586 1.415" />
      <path d="M12 8v4" />
      <path d="M12 16h.01" />
    </Icon>
  );
}

/**
 * Drawn after MingCute's `quote-left-line` with the heads filled. The two
 * circles carry `fill="currentColor"` against the wrapper's `fill="none"`; the
 * stroke still runs round them, so the heads grow with the weight like the rest
 * of the set.
 */
export function QuoteIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="7.5" cy="14.5" r="2.5" fill="currentColor" />
      <path d="M5 14.5C4.833 13 5 10 9 7" />
      <circle cx="16.5" cy="14.5" r="2.5" fill="currentColor" />
      <path d="M14 14.5C13.833 13 14 10 18 7" />
    </Icon>
  );
}

// --- The three states of the sync status -----------------------------------

export function CircleCheckIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
      <path d="M9 12l2 2l4 -4" />
    </Icon>
  );
}

export function RefreshCwIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />
      <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
    </Icon>
  );
}

export function CircleAlertIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0" />
      <path d="M12 8v4" />
      <path d="M12 16h.01" />
    </Icon>
  );
}
