// Give a detached SVG the text alternative it needs to stand on its own.
//
// Nothing here is diagram-shaped. It applies to any SVG the design system
// hands a reader as a file: on a page, an accessible name and description can
// live on the wrapper's own elements, because a wrapper carrying role="img"
// prunes the SVG subtree and puts them out of reach. A downloaded file has no
// wrapper to hang them on, so they have to go inside the SVG itself as
// <title> and <desc>.
//
// Rule 18 of the visual ruleset is the rule this exists to serve.

const SVG_NS = 'http://www.w3.org/2000/svg';

/**
 * Insert `<title>` and `<desc>` at the head of an SVG and point the element's
 * ARIA references at them.
 *
 * **This mutates the node it is given.** Pass a clone. The live element is the
 * one the reader is looking at, and an export must not alter it:
 *
 * ```ts
 * const clone = svgEl.cloneNode(true) as SVGSVGElement;
 * annotateSvg(clone, name, title, descr);
 * ```
 *
 * @param idBase Prefix for the generated element ids. One SVG may be exported
 *   beside others in the same document, so the ids have to be distinguishable.
 * @param title The accessible name. Pass '' when there is none.
 * @param descr The long description. Pass '' when there is none.
 */
export function annotateSvg(
  svg: SVGSVGElement,
  idBase: string,
  title: string,
  descr: string,
): void {
  if (!title && !descr) return;

  // Nodes, not concatenated markup. The description is author prose and will
  // eventually hold an ampersand or an angle bracket; building it as a text
  // node means the serialiser escapes it correctly for free, where a template
  // string would emit markup that no longer parses.
  //
  // Inserted in reverse so the final order is <title>, <desc>, then the drawn
  // content — both must precede the content for assistive technology to treat
  // them as the SVG's own.
  if (descr) {
    const descId = `${idBase}-desc`;
    const desc = svg.ownerDocument.createElementNS(SVG_NS, 'desc');
    desc.setAttribute('id', descId);
    desc.textContent = descr;
    svg.insertBefore(desc, svg.firstChild);
    svg.setAttribute('aria-describedby', descId);
  }
  if (title) {
    const titleId = `${idBase}-title`;
    const titleEl = svg.ownerDocument.createElementNS(SVG_NS, 'title');
    titleEl.setAttribute('id', titleId);
    titleEl.textContent = title;
    svg.insertBefore(titleEl, svg.firstChild);
    svg.setAttribute('aria-labelledby', titleId);
    // Only with a name, and the condition is the whole point. role="img" is
    // what makes a standalone file announce as one named image rather than a
    // tree of anonymous shapes — but role="img" with nothing to name it prunes
    // those shapes and puts nothing in their place, which is precisely the
    // failure Rule 18 exists to undo. Description but no title: leave the
    // subtree readable instead.
    svg.setAttribute('role', 'img');
  }
}
