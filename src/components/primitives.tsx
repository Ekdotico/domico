import type { ElementType, ReactNode } from 'react';

/**
 * Layout primitives.
 *
 * Three, deliberately. Every layout in the three applications is some
 * composition of "constrain the width", "stack with consistent rhythm", and
 * "lay out in a row that wraps". A larger primitive vocabulary would mostly be
 * aliases, and aliases are how a design system starts drifting from itself.
 *
 * All three take spacing from the `--sp-*` scale by step number rather than by
 * value, so a caller cannot introduce an off-scale gap without noticing.
 */

/** Steps on the spacing scale: 0, 4, 8, 12, 16, 20, 24, 32, 40, 56, 72, 96, 128px. */
export type SpaceStep = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

/**
 * Width constraint.
 *
 * - `page` — the full page width, rails included.
 * - `content` — the content column. Tables, code, and diagrams use all of it.
 * - `measure` — running prose, capped at roughly 68 characters.
 *
 * Use `measure` for prose and `content` for everything else. A page that puts
 * a table inside `measure` will scroll horizontally on narrow viewports for no
 * reason, and prose set to the full `content` width is tiring to read.
 */
export function Container({
  width = 'content',
  gutter = true,
  as: Component = 'div',
  className,
  children,
}: {
  width?: 'page' | 'content' | 'measure';
  /** Horizontal padding at narrow viewports. Off for a nested container. */
  gutter?: boolean;
  as?: ElementType;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Component
      className={['ekd-container', gutter ? 'ekd-container--gutter' : null, className]
        .filter(Boolean)
        .join(' ')}
      data-width={width}
    >
      {children}
    </Component>
  );
}

/**
 * Vertical rhythm. Applies the gap between children, not around them, so a
 * stack composes without collapsing-margin surprises.
 *
 * Common steps: 4 between paragraphs, 7 between sections, 9 or 10 for a major
 * break.
 */
export function Stack({
  gap = 4,
  as: Component = 'div',
  className,
  children,
}: {
  gap?: SpaceStep;
  as?: ElementType;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Component className={['ekd-stack', className].filter(Boolean).join(' ')} data-gap={gap}>
      {children}
    </Component>
  );
}

/**
 * Horizontal group that wraps. For badge rows, metadata lines, button groups,
 * and anything else that should reflow rather than overflow.
 */
export function Cluster({
  gap = 2,
  align = 'center',
  justify = 'start',
  as: Component = 'div',
  className,
  children,
}: {
  gap?: SpaceStep;
  align?: 'start' | 'center' | 'end' | 'baseline';
  justify?: 'start' | 'center' | 'end' | 'between';
  as?: ElementType;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Component
      className={['ekd-cluster', className].filter(Boolean).join(' ')}
      data-gap={gap}
      data-align={align}
      data-justify={justify}
    >
      {children}
    </Component>
  );
}
