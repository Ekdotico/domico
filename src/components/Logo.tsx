/**
 * The Ekdotico mark. 512×512 viewBox; path data is byte-identical to the
 * source SVGs under assets/logo/SVG/.
 *
 * This is the only custom SVG icon in the system. Every other icon comes from
 * Lucide at 1.5px stroke, 16px default.
 *
 * Four render modes:
 *   "ink" (default) — stroke uses currentColor and there is no tile, so the
 *     mark adapts to whatever theme surrounds it.
 *   "solid" — a tile that contrasts with whatever canvas it lands on, chosen
 *     by the stylesheet. What `Logo` uses, and the right default for chrome.
 *   "dark-solid" — brand-fixed plum tile with a cream stroke, pinned. For a
 *     surface whose mode is known and fixed regardless of the reader's, such
 *     as an Open Graph image or a print template.
 *   "light-solid" — the inverse, pinned the same way.
 *
 * The solid variants draw from brand tokens rather than theme tokens: the tile
 * must look the same in all four themes, which is the whole point of a mark.
 * Colours are applied through `style` rather than as `fill`/`stroke`
 * attributes because an SVG presentation attribute will not resolve var().
 *
 * "solid" resolves through --logo-tile-bg and --logo-tile-ink, which
 * components.css aliases to one of the two pinned pairs per mode. `Logo` used
 * to make that choice from useRenderedMode, which is the one question no
 * server can answer — Auto defers to a preference that never leaves the
 * reader's machine — so the mark rendered its light-canvas tile on a dark page
 * until hydration. A stylesheet has no such gap: it resolves at paint.
 *
 * Nothing here reads the document any more, so this module is not a client
 * component.
 */

export type LogoMarkVariant = 'ink' | 'solid' | 'dark-solid' | 'light-solid';

const VARIANT_TOKENS: Record<Exclude<LogoMarkVariant, 'ink'>, { fill: string; stroke: string }> = {
  solid: { fill: 'var(--logo-tile-bg)', stroke: 'var(--logo-tile-ink)' },
  'dark-solid': { fill: 'var(--logo-tile-dark-bg)', stroke: 'var(--logo-tile-dark-ink)' },
  'light-solid': { fill: 'var(--logo-tile-light-bg)', stroke: 'var(--logo-tile-light-ink)' },
};

export function LogoMark({
  size = 22,
  className,
  variant = 'ink',
  title = 'Ekdotico mark',
}: {
  size?: number;
  className?: string;
  variant?: LogoMarkVariant;
  /** Accessible name. Pass an empty string to mark the SVG decorative. */
  title?: string;
}) {
  const tile = variant === 'ink' ? null : VARIANT_TOKENS[variant];
  const decorative = title === '';

  return (
    <svg
      viewBox="0 0 512 512"
      width={size}
      height={size}
      className={className}
      role={decorative ? undefined : 'img'}
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : title}
    >
      {tile && <rect width="512" height="512" style={{ fill: tile.fill }} />}
      <g
        fill="none"
        strokeWidth={28}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ stroke: tile ? tile.stroke : 'currentColor' }}
      >
        <path d="M 72 375 C 72 160 200 160 252 320" />
        <path d="M 252 320 L 252 360" />
        <path d="M 252 320 C 304 160 435 160 435 348" />
      </g>
    </svg>
  );
}

/**
 * Mark plus wordmark. The tile contrasts with whatever canvas it lands on,
 * which is a question for the stylesheet rather than for this component.
 */
export function Logo({ size = 22 }: { size?: number }) {
  return (
    <div className="logo">
      <LogoMark size={size} className="logo-mark logo-mark--tile" variant="solid" />
      <span className="logo-wordmark">Ekdotico</span>
    </div>
  );
}
