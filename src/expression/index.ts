/**
 * Typed access to the expression layer.
 *
 * This subpath carries no visual layer. `deree` and `internal` can depend on it
 * as a devDependency for copy linting without pulling a single stylesheet,
 * component, or font into a browser bundle.
 *
 * The JSON is the single source for every mechanical rule. Nothing here
 * restates a rule — if a term or a prohibition needs changing, the JSON is the
 * only file to edit, and the prose tables in guidelines.md regenerate from it.
 */

import vocabularyData from '../../expression/vocabulary.json' with { type: 'json' };
import prohibitedData from '../../expression/prohibited.json' with { type: 'json' };

export type Register =
  | 'functional'
  | 'instructional'
  | 'system-feedback'
  | 'provenance-institutional'
  | 'marketing-awareness';

export type Severity = 'blocking' | 'substantive' | 'minor';

export type MatchKind = 'word' | 'phrase' | 'regex' | 'unicode-range';

export interface VocabularyTerm {
  id: string;
  concept: string;
  /** The one permitted term for this concept. */
  canonical: string;
  /** Permitted only after the canonical term has appeared once in the same document or screen. */
  shorthand: string | null;
  /** Known non-canonical forms. A match on any of these is a vocabulary violation. */
  variants: string[];
  /**
   * Non-canonical forms that are also ordinary English or legitimate domain
   * terms. A match is necessary but not sufficient, so these report as
   * substantive and ask for confirmation rather than blocking.
   */
  ambiguousVariants?: string[];
  rationale: string;
  since: string;
  /** Longer forms that remain correct, typically a module title rather than a product surface. */
  allowedCompounds?: string[];
  /**
   * Known non-canonical forms the linter deliberately does not match, because
   * the false-positive rate would drown the signal. Not an exemption from the
   * rule — reviewers still catch these — only from automation.
   */
  notDetectable?: string[];
  notDetectableReason?: string;
  /**
   * `specification-only` marks a term that is canonical in specification,
   * architecture, and engineering contexts but is not a user-facing label.
   */
  scope?: 'specification-only';
  scopeNote?: string;
}

export interface ProhibitionRule {
  id: string;
  match: { kind: MatchKind; patterns: string[]; caseSensitive?: boolean };
  /** `'all'`, or the specific registers this rule applies within. */
  registers: 'all' | Register[];
  severity: Severity;
  reason: string;
  /** What to use instead. Never omitted: a finding without a replacement is an incomplete error message. */
  replacement: string;
  note?: string;
  /** True where a pattern match is necessary but not sufficient and a human must confirm. */
  requiresJudgement?: boolean;
}

export const vocabulary = vocabularyData as unknown as {
  version: string;
  terms: VocabularyTerm[];
  gaps: { description: string; concepts: Array<{ concept: string; observed: string[]; modules: string[]; note?: string }> };
};

export const prohibited = prohibitedData as unknown as {
  version: string;
  registers: Register[];
  rules: ProhibitionRule[];
  allowlist: { patterns: string[]; contexts: { skip: string[]; marker: string } };
  notEnforced: { description: string; rules: string[] };
};

/** The version both files share. They are released together and never diverge. */
export const expressionVersion = vocabulary.version;

/** Rules that apply when linting copy in a given register. */
export function rulesFor(register: Register): ProhibitionRule[] {
  return prohibited.rules.filter((r) => r.registers === 'all' || r.registers.includes(register));
}

/** Look up the canonical term for a non-canonical variant. Returns null if the word is not governed. */
export function canonicalFor(word: string): VocabularyTerm | null {
  const needle = word.trim().toLowerCase();
  for (const term of vocabulary.terms) {
    if (term.canonical.toLowerCase() === needle) return null; // already canonical
    if (term.variants.some((v) => v.toLowerCase() === needle)) return term;
  }
  return null;
}

/**
 * Rules the tooling cannot check. Exposed so a consumer's report can state its
 * own coverage honestly rather than implying the linter caught everything.
 */
export const notMechanicallyChecked: string[] = prohibited.notEnforced.rules;
