/**
 * Structural exemptions.
 *
 * A prohibited term inside a code fence, an inline code span, or a
 * prohibited-terms table is data, not copy. The Expression Guidelines
 * necessarily contain every term they prohibit, always as cited
 * counter-examples — without these exemptions the one document that must pass
 * cleanest would fail hardest, and the linter would be unusable against its
 * own source.
 *
 * Everything here works on character spans over the raw source, so a finding's
 * offset can be tested against them before it is reported.
 */

export interface Span {
  start: number;
  end: number;
  reason: string;
}

const FENCE = /^[ \t]*(`{3,}|~{3,})[^\n]*\n[\s\S]*?^[ \t]*\1[^\n]*$/gm;
const INLINE_CODE = /`[^`\n]+`/g;
const HTML_COMMENT = /<!--[\s\S]*?-->/g;
const FRONTMATTER = /^---\n[\s\S]*?\n---/;
const CITE_MARKER = /<!--\s*eg:cite\s*-->/g;
const URL = /\bhttps?:\/\/\S+|\b[\w.-]+\/[\w./-]+\.(?:mdx?|tsx?|css|json)\b/g;

/**
 * Markdown table blocks whose header announces that the table catalogues
 * prohibited or incorrect forms. The whole block is exempt: both the
 * prohibited column and the corrected column, since a "correct form" cell
 * routinely quotes the wrong form to contrast against.
 */
function prohibitionTables(source: string): Span[] {
  const spans: Span[] = [];
  const lines = source.split('\n');
  let offset = 0;
  let tableStart: number | null = null;
  let tableIsExempt = false;

  /**
   * A table is exempt when its header shows it catalogues terminology rather
   * than using it. That covers the prohibited-terms tables and the controlled
   * vocabulary table, whose "Non-canonical variants" column exists precisely to
   * enumerate the forms that are not allowed.
   */
  const HEADER_SIGNAL =
    /\b(prohibited|incorrect|correct form|term or pattern|use instead|do not use|replacement|non-canonical|canonical term|variants)\b/i;

  for (const line of lines) {
    const isTableRow = /^\s*\|.*\|\s*$/.test(line);

    if (isTableRow && tableStart === null) {
      tableStart = offset;
      tableIsExempt = HEADER_SIGNAL.test(line);
    } else if (isTableRow && tableStart !== null && !tableIsExempt) {
      // A separator or second row can still carry the signal.
      tableIsExempt = tableIsExempt || HEADER_SIGNAL.test(line);
    } else if (!isTableRow && tableStart !== null) {
      if (tableIsExempt) {
        spans.push({ start: tableStart, end: offset, reason: 'prohibited-terms table' });
      }
      tableStart = null;
      tableIsExempt = false;
    }

    offset += line.length + 1;
  }

  if (tableStart !== null && tableIsExempt) {
    spans.push({ start: tableStart, end: source.length, reason: 'prohibited-terms table' });
  }

  return spans;
}

/**
 * Quoted counter-examples in running prose.
 *
 * The house convention for citing a prohibited form is to quote it and set it
 * against the correct form: `"Document sealed." — not "Great work!"`. Both
 * quoted spans are data. Tagging each of the hundred-odd instances in the
 * guidelines with an explicit marker would be noise, so the convention itself
 * is recognised.
 *
 * The test is deliberately narrow: a quoted span is exempt only when its own
 * line also carries a contrast marker. `The button reads "Please wait"` is
 * still a finding, because nothing on that line signals a counter-example.
 */
function quotedCounterExamples(source: string): Span[] {
  const spans: Span[] = [];
  const CONTRAST =
    /\b(not|never|rather than|instead of|avoid|prohibited|incorrect|wrong|violat\w+|do not use)\b/i;
  const QUOTED = /"[^"\n]{1,200}"|“[^”\n]{1,200}”/g;

  let offset = 0;
  for (const line of source.split('\n')) {
    if (CONTRAST.test(line)) {
      for (const m of line.matchAll(QUOTED)) {
        spans.push({
          start: offset + m.index,
          end: offset + m.index + m[0].length,
          reason: 'quoted counter-example',
        });
      }
    }
    offset += line.length + 1;
  }

  return spans;
}

/** A paragraph or block immediately following an `<!-- eg:cite -->` marker. */
function citedBlocks(source: string): Span[] {
  const spans: Span[] = [];
  for (const m of source.matchAll(CITE_MARKER)) {
    const from = m.index + m[0].length;
    // To the end of the following block, or the end of the document.
    const blank = source.indexOf('\n\n', from + 1);
    spans.push({
      start: m.index,
      end: blank === -1 ? source.length : blank,
      reason: 'marked as a cited example',
    });
  }
  return spans;
}

function collect(source: string, pattern: RegExp, reason: string): Span[] {
  return [...source.matchAll(pattern)].map((m) => ({
    start: m.index,
    end: m.index + m[0].length,
    reason,
  }));
}

/**
 * In a source file, only string literals and JSX text are copy. Everything else
 * — identifiers, comments, imports, operators — is code, and scanning it
 * produces findings against things no reader will ever see: `document.title`
 * reported as non-canonical vocabulary, `a - b` as a missing em dash, and
 * "doesn't" in a code comment as a contraction.
 *
 * So the exemption is inverted here: the scannable spans are computed, and
 * everything outside them is exempt. It is a heuristic rather than a parse,
 * which is the right trade — a missed string in a component is a far cheaper
 * error than a hundred findings against source code, which is what the first
 * run against `components/` produced.
 */
function codeExemptions(source: string): Span[] {
  const scannable: Array<[number, number]> = [];

  // Comments are found first and excluded from the string scan. Backticks are
  // common inside comments — `remark-doc-jsonld` and the like — and without
  // this they parse as template literals, so the comment prose becomes
  // scannable copy and every code comment gets linted.
  const COMMENT = /\/\/[^\n]*|\/\*[\s\S]*?\*\//g;
  const comments = [...source.matchAll(COMMENT)].map(
    (m) => [m.index, m.index + m[0].length] as [number, number],
  );
  const inComment = (index: number) => comments.some(([s, e]) => index >= s && index < e);

  // Attributes whose value is machinery rather than copy. A class name, a
  // route, or a key is a string literal like any other, and `className="doc-
  // footer"` was reported as non-canonical vocabulary until these were
  // excluded. The inverse list is short and worth stating: aria-label, title,
  // alt, and placeholder ARE copy, and stay scannable.
  const NOT_COPY_ATTR =
    /\b(className|class|href|id|key|src|srcSet|role|type|name|htmlFor|rel|target|slug|path|as|width|height|viewBox|d|fill|stroke|xmlns|style|variant|tone|code|lang|charSet|property|content|itemProp|method|action|encType|accept|pattern|autoComplete|inputMode|enterKeyHint|data-[\w-]+|aria-(?!label|description)[\w-]+)\s*=\s*\{?\s*$/;

  // String literals of all three kinds. The escape handling matters: an
  // apostrophe inside a double-quoted string is common in copy.
  const STRING = /'(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"|`(?:[^`\\]|\\.)*`/g;
  for (const m of source.matchAll(STRING)) {
    if (inComment(m.index)) continue;
    const before = source.slice(Math.max(0, m.index - 40), m.index);
    if (NOT_COPY_ATTR.test(before)) continue;
    scannable.push([m.index + 1, m.index + m[0].length - 1]);
  }

  // JSX text: the run between a closing angle bracket and the next opening
  // one, with no braces (which would make it an expression, not text).
  const JSX_TEXT = />([^<>{}]+)</g;
  for (const m of source.matchAll(JSX_TEXT)) {
    if (m[1] && /[A-Za-z]{2}/.test(m[1])) {
      scannable.push([m.index + 1, m.index + 1 + m[1].length]);
    }
  }

  scannable.sort((a, b) => a[0] - b[0]);

  // Invert: everything between the scannable spans is exempt.
  const exempt: Span[] = [];
  let cursor = 0;
  for (const [start, end] of scannable) {
    if (start > cursor) exempt.push({ start: cursor, end: start, reason: 'code, not copy' });
    cursor = Math.max(cursor, end);
  }
  if (cursor < source.length) {
    exempt.push({ start: cursor, end: source.length, reason: 'code, not copy' });
  }

  return exempt;
}

/** True for files whose copy is embedded in source rather than being the file. */
export function isSourceFile(path: string): boolean {
  return /\.(ts|tsx|js|jsx|mjs|cjs)$/.test(path);
}

/** Every span in `source` that the linter must not report findings inside. */
export function exemptSpans(source: string, allowlist: string[], path = ''): Span[] {
  if (isSourceFile(path)) {
    return [
      ...codeExemptions(source),
      // Import specifiers and the like are string literals, so they survive the
      // inversion above and still need the allowlist and URL exemptions.
      ...collect(source, URL, 'URL or file path'),
      ...allowlistSpans(source, allowlist),
    ];
  }

  return exemptSpansForProse(source, allowlist);
}

function allowlistSpans(source: string, allowlist: string[]): Span[] {
  const spans: Span[] = [];
  for (const pattern of allowlist) {
    let re: RegExp;
    try {
      re = new RegExp(pattern, 'g');
    } catch {
      re = new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    }
    spans.push(...collect(source, re, 'allowlisted identifier'));
  }
  return spans;
}

function exemptSpansForProse(source: string, allowlist: string[]): Span[] {
  const spans: Span[] = [
    ...collect(source, FENCE, 'fenced code block'),
    ...collect(source, INLINE_CODE, 'inline code'),
    ...collect(source, HTML_COMMENT, 'HTML comment'),
    ...collect(source, URL, 'URL or file path'),
    ...prohibitionTables(source),
    ...quotedCounterExamples(source),
    ...citedBlocks(source),
  ];

  const frontmatter = FRONTMATTER.exec(source);
  if (frontmatter) {
    spans.push({ start: 0, end: frontmatter[0].length, reason: 'frontmatter' });
  }

  for (const pattern of allowlist) {
    // Allowlist entries are either literals or regular expressions. A literal
    // containing regex metacharacters would throw, so fall back to an escaped
    // literal match rather than dropping the entry silently.
    let re: RegExp;
    try {
      re = new RegExp(pattern, 'g');
    } catch {
      re = new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    }
    spans.push(...collect(source, re, 'allowlisted identifier'));
  }

  return spans;
}

export function isExempt(index: number, spans: Span[]): Span | null {
  for (const span of spans) {
    if (index >= span.start && index < span.end) return span;
  }
  return null;
}

/** 1-indexed line and column for a character offset. */
export function locate(source: string, index: number): { line: number; column: number } {
  let line = 1;
  let lastBreak = -1;
  for (let i = 0; i < index; i++) {
    if (source[i] === '\n') {
      line++;
      lastBreak = i;
    }
  }
  return { line, column: index - lastBreak };
}
