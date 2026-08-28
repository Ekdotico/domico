// Mermaid's accessibility directives, read out of a diagram source.
//
// `accTitle:` and `accDescr:` (plus the `accDescr { … }` block form) are
// Mermaid's own documented directives rather than anything invented here, so a
// fence carrying them stays valid Mermaid wherever it is pasted.
//
// This module is deliberately dependency-free and framework-free, because its
// callers cannot share a runtime. In a consuming application one caller is the
// component that renders the diagram, which needs these values to build the
// figure's accessible name and description; the other is a build-time gate —
// `ekdotico-check a11y`, and any repository-local validator beside it — which
// needs the same parse to enforce that every diagram carries them. One parser,
// so a CI gate and a rendered page can never disagree about what a diagram
// declares.
//
// Rule 18 of the visual ruleset is the rule this exists to serve.

export type MermaidAccessibility = {
  /** The `accTitle:` value, or '' when the diagram declares none. */
  accTitle: string;
  /** The `accDescr` value with block-form line breaks collapsed, or ''. */
  accDescr: string;
  /**
   * The diagram source with each directive line blanked — emptied in place,
   * not deleted. Every consumer of this string reports errors by line number
   * (Mermaid's own parser, and every grammar check a repository runs over a
   * fence), and deleting lines would slide those numbers out of step with the
   * fence the author is looking at. Blank lines are skipped by all of them.
   *
   * Blanking also defuses the block form, whose braces would otherwise be
   * counted as structure: `accDescr {` ends in `{`, which an ER-diagram check
   * reads as an entity opening, and a description whose text happens to begin
   * "end …" or "opt …" would move a sequence check's nesting depth. The
   * directives would otherwise break the very checker they exist to satisfy.
   */
  source: string;
};

export function extractAccessibility(chart: string): MermaidAccessibility {
  const lines = chart.split('\n');
  const kept: string[] = [];
  let accTitle = '';
  const descParts: string[] = [];
  let inDescBlock = false;

  for (const line of lines) {
    if (inDescBlock) {
      const close = line.indexOf('}');
      descParts.push(close === -1 ? line : line.slice(0, close));
      if (close !== -1) inDescBlock = false;
      kept.push('');
      continue;
    }
    // `?? ''` throughout, not defensiveness: this package compiles under
    // noUncheckedIndexedAccess, which types a matched group as possibly
    // undefined. A `(.*)` group always participates in a match that succeeded,
    // so the coalesce never fires at runtime and the behaviour is the docs
    // app's, unchanged.
    const titleMatch = /^\s*accTitle\s*:\s*(.*)$/.exec(line);
    if (titleMatch) {
      accTitle = (titleMatch[1] ?? '').trim();
      kept.push('');
      continue;
    }
    // Block form is tested first — `accDescr {` must not fall through to the
    // `accDescr:` branch, which would read `{ …` as the description text.
    const blockMatch = /^\s*accDescr\s*\{(.*)$/.exec(line);
    if (blockMatch) {
      const rest = blockMatch[1] ?? '';
      const close = rest.indexOf('}');
      descParts.push(close === -1 ? rest : rest.slice(0, close));
      inDescBlock = close === -1;
      kept.push('');
      continue;
    }
    const descMatch = /^\s*accDescr\s*:\s*(.*)$/.exec(line);
    if (descMatch) {
      descParts.push(descMatch[1] ?? '');
      kept.push('');
      continue;
    }
    kept.push(line);
  }

  return {
    accTitle,
    // Collapse the block form's line breaks and indentation into the single
    // run of prose a screen reader will read out.
    accDescr: descParts.join(' ').replace(/\s+/g, ' ').trim(),
    source: kept.join('\n'),
  };
}
