import {
  Children,
  cloneElement,
  forwardRef,
  isValidElement,
  type HTMLAttributes,
  type ReactNode,
} from 'react';

/**
 * The heading of an application page: "Sign in", "Documents", "Account settings".
 *
 *   <PageHeading>Account settings</PageHeading>
 *
 *   <PageHeading ref={heading} tabIndex={-1}>{notice.title}</PageHeading>
 *
 * An `<h1>` unless `level` says otherwise, in the reading serif at the size of
 * the `AccessGate` title, so a page an application builds and the gate in front
 * of it open the same way. `level` changes the element and not the size: the
 * size says "this page's heading", and the level says where it sits in the
 * document. It is not `.display`, which is the title of a document or a
 * landing page and three steps larger.
 *
 * **A Greek run is set in the sans, by the component.** The reading serif has
 * no Greek (rule 4), so Greek left in it is drawn in whatever face the
 * operating system substitutes. Each run of Greek letters in the text is
 * wrapped in a span that takes `--font-sans`; an application writes the title
 * as a plain string and adds no span and no class of its own. The text inside
 * an HTML element passed as a child is read too, so a run an application has
 * marked with `lang` is still set correctly. The text a component of the
 * application renders is not: that component's markup is its own.
 *
 * The span sets the face and nothing else. A title in Greek still owes its
 * `lang`, which passes through to the heading with every other attribute:
 * `id`, `tabIndex`, `aria-describedby`. `ref` reaches the heading, for a page
 * that moves focus to its title when it is shown. `className` is added to the
 * heading's own.
 *
 * Server-safe: it holds no state and calls no hook.
 *
 * Styles ship in `@ekdotico/domico/styles/page-heading.css`.
 */
export interface PageHeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  /** The heading's level in the document. The size is the same at each. */
  level?: 1 | 2 | 3;
}

// Greek and Coptic, and Greek Extended, which holds the polytonic letters. A
// run begins with one of those and takes any combining mark that follows, so a
// letter with a separate accent is not cut from it. A space between two Greek
// words stays in the run, so a phrase is one span and not one per word.
//
// Written as escapes: `check:discipline` reads a Greek character in a source
// file as text that needs a face.
const LETTER = '[\\u0370-\\u03FF\\u1F00-\\u1FFF][\\u0300-\\u036F\\u0370-\\u03FF\\u1F00-\\u1FFF]*';
const GREEK_RUN = new RegExp(`(${LETTER}(?:\\s+${LETTER})*)`);

function setGreek(node: ReactNode): ReactNode {
  return Children.map(node, (child) => {
    if (typeof child === 'string') {
      if (!GREEK_RUN.test(child)) return child;
      // One capture group, so the runs are the odd entries.
      return child.split(GREEK_RUN).map((part, index) =>
        index % 2 === 1 ? (
          <span key={index} className="ekd-page-heading-greek">
            {part}
          </span>
        ) : (
          part
        ),
      );
    }
    if (isValidElement(child) && typeof child.type === 'string') {
      const inner = (child.props as { children?: ReactNode }).children;
      if (inner != null) return cloneElement(child, undefined, setGreek(inner));
    }
    return child;
  });
}

// `forwardRef` rather than a `ref` prop, as on the fields: the peer range
// starts at React 18.
export const PageHeading = forwardRef<HTMLHeadingElement, PageHeadingProps>(function PageHeading(
  { level = 1, className, children, ...heading },
  ref,
) {
  const Heading = `h${level}` as 'h1';
  return (
    <Heading
      {...heading}
      ref={ref}
      className={['ekd-page-heading', className].filter(Boolean).join(' ')}
    >
      {setGreek(children)}
    </Heading>
  );
});
