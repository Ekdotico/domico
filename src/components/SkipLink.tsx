import type { ReactNode } from 'react';

// SkipLink — the first stop in the Tab order, and the way past the chrome.
//
//   <SkipLink />
//   <main id="main-content">…</main>
//
// WCAG 2.2 §2.4.1 Bypass Blocks. The class and its styling have shipped in the
// reset layer for a long time; the anchor was left to each application, and
// the three wrote three of them: "Skip to main content" to #main-content,
// "Skip to content" to #main-content, and "Skip to content" to #main. A reader
// moving between the suite's surfaces met a different sentence on each, and an
// application renaming its landmark had nothing to keep its link in step. One
// component is one sentence and one default target.
//
// `target` is the id of the element to land on, without the `#`. Pass it when
// the landmark carries a different id; change the children only where the
// destination is not the main content, because the sentence is the name a
// screen reader announces for the link.
//
// Styled by `.skip-link` in `styles/reset.css`, so it needs no component
// stylesheet: every application that renders HTML takes the reset already.

export function SkipLink({
  target = 'main-content',
  children = 'Skip to main content',
}: {
  target?: string;
  children?: ReactNode;
}) {
  return (
    <a className="skip-link" href={`#${target}`}>
      {children}
    </a>
  );
}
