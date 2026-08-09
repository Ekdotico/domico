import type { ImgHTMLAttributes } from 'react';

// Figure — image with caption and optional credit line, rendered as a
// semantic <figure>/<figcaption> pair. Uses a bare <img> rather than
// Next.js <Image> to keep the component self-contained: the docs site
// images are mostly local SVGs, and switching to <Image> would require
// either per-image width/height props or a next.config.mjs rewrite to
// allow `unoptimized`. Per the Phase 2 plan stop conditions, those
// config changes are deferred to a separate decision.
//
//   <Figure
//     src="/diagrams/architecture.svg"
//     alt="Three-tier architecture diagram"
//     caption="Architecture, cross-section."
//     credit="Internal reference, 2026."
//   />
//
// `align` is reserved for future breakout layouts; today both values
// render the same width. The prop exists so authors can declare intent
// now and the CSS can grow into wide/full-bleed treatments without a
// signature change.

export type FigureAlign = 'center' | 'wide';

export function Figure({
  src,
  alt,
  caption,
  credit,
  align = 'center',
  loading = 'lazy',
  decoding = 'async',
  ...rest
}: {
  // Image source. Local paths preferred; remote paths fine (no Next
  // optimisation pipeline applied).
  src: string;
  // Required for accessibility. Use empty string ("") for purely
  // decorative images that should be skipped by assistive tech.
  alt: string;
  // Plain-text or short prose; rendered as the figcaption.
  caption?: string;
  // Source / attribution / provenance line. Rendered small + italic
  // beneath the caption.
  credit?: string;
  // Layout intent — see the file-level comment.
  align?: FigureAlign;
  loading?: ImgHTMLAttributes<HTMLImageElement>['loading'];
  decoding?: ImgHTMLAttributes<HTMLImageElement>['decoding'];
}) {
  return (
    <figure className="figure" data-align={align}>
      <img
        src={src}
        alt={alt}
        loading={loading}
        decoding={decoding}
        className="figure-img"
        {...rest}
      />
      {(caption || credit) && (
        <figcaption className="figure-caption">
          {caption && <span className="figure-caption-text">{caption}</span>}
          {credit && <span className="figure-credit">{credit}</span>}
        </figcaption>
      )}
    </figure>
  );
}
