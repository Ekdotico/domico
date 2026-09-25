/**
 * Make everything outside `node` inert for as long as a modal surface is open.
 *
 * `aria-modal="true"` is a promise to a screen reader that the rest of the
 * document is unavailable; `inert` is what keeps it — for the keyboard, the
 * pointer, and the accessibility tree alike (WCAG 2.4.3, 2.4.11, 4.1.2). The
 * research area in deree shipped two dialogs that declared the promise and
 * kept neither half of it: Tab walked out of the drawer into links behind an
 * opaque scrim. This is its helper, moved here because the documentation site
 * and praktico owe the same promise and would otherwise each write their own.
 *
 * Walks up from `node` and marks each ancestor's other children, so the
 * surface's own ancestor chain stays live and nothing has to be portalled.
 * Elements already inert — a page covered by a splash overlay — are left to
 * whoever inerted them, and are not released by the returned function either.
 * `keep` exempts elements that must stay interactive, such as a backdrop whose
 * click dismisses the surface.
 *
 * Returns the restore function. Call it before moving focus back to a trigger:
 * an inert element cannot take focus, so a focus() the other way round lands
 * nowhere.
 *
 * Browser-only. Call it from an effect or an event handler, never during
 * render.
 */
export function inertOutside(node: HTMLElement, keep: readonly (Element | null)[] = []): () => void {
  const body = node.ownerDocument.body;
  const covered: Element[] = [];
  for (let el: Element | null = node; el?.parentElement; el = el.parentElement) {
    for (const sibling of Array.from(el.parentElement.children)) {
      if (sibling === el || keep.includes(sibling) || sibling.hasAttribute('inert')) continue;
      covered.push(sibling);
    }
    if (el.parentElement === body) break;
  }
  for (const el of covered) el.setAttribute('inert', '');
  return () => {
    for (const el of covered) el.removeAttribute('inert');
  };
}
