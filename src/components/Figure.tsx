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
//     description="The browser calls the API tier over HTTPS; the API
//       tier reads and writes the database tier over a private
//       network. No path connects the browser to the database."
//   />
//
// An alt string cannot carry a graph, so an image of one takes
// `description` as well. Rule 18.
//
// `align` is reserved for future breakout layouts; today both values
// render the same width. The prop exists so authors can declare intent
// now and the CSS can grow into wide/full-bleed treatments without a
// signature change.

export type FigureAlign = 'center' | 'wide';

// A stable id for the long description, without useId — deliberately. useId is
// a hook, so it would force 'use client' onto this component (Tabs carries that
// directive for exactly this reason), and an image with a caption would start
// shipping JavaScript. Hashing the source together with the description is
// deterministic, so the server and the client agree on the id, and two figures
// on one page collide only when both the image and its description are
// identical — in which case either target is the right one.
function descriptionId(src: string, description: string): string {
  const input = `${src} ${description}`;
  let h = 5381;
  for (let i = 0; i < input.length; i++) h = ((h << 5) + h + input.charCodeAt(i)) | 0;
  return `figure-desc-${(h >>> 0).toString(36)}`;
}

export function Figure({
  src,
  alt,
  caption,
  credit,
  description,
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
  // Long description, for an image whose content an alt string cannot
  // carry — a chart, a diagram, a graph. Rendered visually hidden and
  // referenced by aria-describedby, so it reaches assistive tech and
  // moves no pixels. `alt` stays the short name and stays required;
  // this is the description, not a replacement for it.
  //
  // Needs `.sr-only`, which ships in this package's reset. An
  // application importing only styles/figure.css and not the base would
  // render this visibly — see Rule 18.
  description?: string;
  // Layout intent — see the file-level comment.
  align?: FigureAlign;
  loading?: ImgHTMLAttributes<HTMLImageElement>['loading'];
  decoding?: ImgHTMLAttributes<HTMLImageElement>['decoding'];
}) {
  const descId = description ? descriptionId(src, description) : undefined;

  return (
    <figure className="figure" data-align={align}>
      <img
        src={src}
        alt={alt}
        aria-describedby={descId}
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
      {description && (
        <p id={descId} className="sr-only">
          {description}
        </p>
      )}
    </figure>
  );
}
