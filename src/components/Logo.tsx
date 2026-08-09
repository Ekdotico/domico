'use client';

import { useRenderedMode } from '../theme/useAppearance.js';

/**
 * The Ekdotico mark. 512×512 viewBox; path data is byte-identical to the
 * source SVGs under assets/logo/SVG/.
 *
 * This is the only custom SVG icon in the system. Every other icon comes from
 * Lucide at 1.5px stroke, 16px default.
 *
 * Three render modes:
 *   "ink" (default) — stroke uses currentColor and there is no tile, so the
 *     mark adapts to whatever theme surrounds it.
 *   "dark-solid" — brand-fixed plum tile with a cream stroke. Self-contained
 *     on a light canvas.
 *   "light-solid" — the inverse. Used on a dark canvas so the mark reads as a
 *     discrete element rather than dissolving into the background.
 *
 * The two solid variants draw from brand tokens rather than theme tokens: the
 * tile must look the same in all four themes, which is the whole point of a
 * mark. Colours are applied through `style` rather than as `fill`/`stroke`
 * attributes because an SVG presentation attribute will not resolve var().
 */

export type LogoMarkVariant = 'ink' | 'dark-solid' | 'light-solid';

const VARIANT_TOKENS: Record<Exclude<LogoMarkVariant, 'ink'>, { fill: string; stroke: string }> = {
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
 * Mark plus wordmark. Picks whichever solid variant contrasts with the
 * rendered mode, so the tile stays legible on either canvas.
 */
export function Logo({ size = 22 }: { size?: number }) {
  const mode = useRenderedMode();
  const variant: LogoMarkVariant = mode === 'dark' ? 'light-solid' : 'dark-solid';

  return (
    <div className="logo">
      <LogoMark size={size} className="logo-mark logo-mark--tile" variant={variant} />
      <span className="logo-wordmark">Ekdotico</span>
    </div>
  );
}
