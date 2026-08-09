/**
 * The Ekdotico copy linter.
 *
 * Reads its rules from `expression/prohibited.json` and
 * `expression/vocabulary.json` and holds no copy of them. Changing a
 * prohibited term means editing one file; the linter needs no release to pick
 * it up beyond the one that ships the data.
 *
 * What it checks and what it cannot check is stated in the README and, in
 * machine-readable form, under `notEnforced` in the prohibitions data. Register
 * classification is not attempted: it needs judgement pattern matching cannot
 * supply, and a classifier that appears to work while being wrong is worse than
 * no classifier.
 */

import { prohibited, vocabulary, type Register, type Severity } from '../expression/index.js';
import { exemptSpans, isExempt, locate, type Span } from './context.js';
import {
  configOverrideFor,
  invalidConfigOverrides,
  invalidOverrides,
  isOverridden,
  parseInlineOverrides,
  type ConfigOverride,
} from './overrides.js';

export interface Finding {
  ruleId: string;
  severity: Severity;
  file: string;
  line: number;
  column: number;
  /** The text that matched, so the finding names what was found. */
  found: string;
  /** Why it is a violation. */
  reason: string;
  /** What to use instead. Never empty. */
  replacement: string;
  /** True where a match is necessary but not sufficient and a human must confirm. */
  needsConfirmation: boolean;
  /** Present when an override applied, so overrides remain visible in reports. */
  overriddenBy?: { reason: string; source: 'inline' | 'config' };
}

export interface LintOptions {
  /**
   * The register this copy is in. Register-scoped rules run only when this is
   * supplied — guessing would be worse than skipping, and a skip is reported.
   *
   * A list declares that the file hosts more than one register, which §5.6
   * Step 4 treats as the normal case rather than the exception: a command
   * palette is Functional in its labels and System Feedback in its empty and
   * error states. Every declared register's rules run. Declaring more
   * registers therefore only ever widens what is checked.
   */
  register?: Register | Register[];
  overrides?: ConfigOverride[];
  /** Report overridden findings rather than dropping them. Default true. */
  includeOverridden?: boolean;
}

export interface LintResult {
  file: string;
  findings: Finding[];
  /** Overrides that carry no rationale. These fail regardless of severity. */
  invalidOverrides: Array<{ rule: string; line: number; scope: 'inline' | 'config' }>;
  /** Rules skipped because no register was declared for this file. */
  skippedRegisterRules: string[];
}

/** Compile one rule's patterns into a single regular expression. */
function compile(match: { kind: string; patterns: string[]; caseSensitive?: boolean }): RegExp {
  const flags = match.caseSensitive === true ? 'g' : 'gi';
  const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  switch (match.kind) {
    case 'word':
      return new RegExp(`\\b(?:${match.patterns.map(escape).join('|')})\\b`, flags);
    case 'phrase':
      return new RegExp(match.patterns.map(escape).join('|'), flags);
    case 'regex':
      return new RegExp(match.patterns.join('|'), flags);
    case 'unicode-range': {
      const cls = match.patterns
        .map((r) => {
          const [from, to] = r.split('-');
          return to ? `\\u{${from}}-\\u{${to}}` : `\\u{${from}}`;
        })
        .join('');
      return new RegExp(`[${cls}]`, 'gu');
    }
    default:
      throw new Error(`Unknown match kind: ${match.kind}`);
  }
}

/**
 * Non-canonical vocabulary, where a canonical term is defined.
 *
 * Variants come in two grades. An unambiguous variant ("tasks tab") is a
 * blocking finding. An ambiguous one ("faculty", "works cited", "copy") is also
 * ordinary English or a legitimate domain term, so it reports as substantive
 * and asks for confirmation. A faculty dashboard is a faculty dashboard, and an
 * MLA Works Cited list really is called that.
 */
function vocabularyFindings(source: string, file: string, spans: Span[]): Finding[] {
  const findings: Finding[] = [];

  // Longest first, so the widest enclosing phrase is tested before a narrower
  // one that would also match.
  const allCanonical = vocabulary.terms
    .map((t) => t.canonical)
    .sort((a, b) => b.length - a.length);

  for (const term of vocabulary.terms) {
    const graded: Array<[string, boolean]> = [
      ...term.variants.map((v) => [v, false] as [string, boolean]),
      ...(term.ambiguousVariants ?? []).map((v) => [v, true] as [string, boolean]),
    ];

    for (const [variant, ambiguous] of graded) {
      // A variant that is a substring of a permitted longer form is not a
      // violation: "PDF reader and annotator" is an approved module title even
      // though "PDF annotator" is not a permitted surface name.
      const re = new RegExp(`\\b${variant.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');

      for (const m of source.matchAll(re)) {
        if (isExempt(m.index, spans)) continue;

        // A variant that is a substring of a longer correct phrase is not a
        // violation. "canvas" is the non-canonical form on its own, but it also
        // sits inside "planning canvas"; "lock" sits inside "export lock",
        // which is a different term's canonical entirely. Every canonical form
        // is checked, not just this term's, because the enclosing phrase is
        // often owned by another entry. Without this the linter reports
        // canonical terms as breaches of themselves — 185 of 479 findings on
        // the first real run against the documentation site.
        const enclosing = [...allCanonical, ...(term.allowedCompounds ?? [])];
        const covered = enclosing.some((phrase) => {
          if (phrase.toLowerCase() === m[0].toLowerCase()) return false;
          const haystack = source.toLowerCase();
          const needle = phrase.toLowerCase();
          let at = haystack.indexOf(needle, Math.max(0, m.index - needle.length));
          while (at !== -1 && at <= m.index) {
            if (at + needle.length >= m.index + m[0].length) return true;
            at = haystack.indexOf(needle, at + 1);
          }
          return false;
        });
        if (covered) continue;

        const { line, column } = locate(source, m.index);
        findings.push({
          ruleId: `vocabulary/${term.id}`,
          severity: ambiguous ? 'substantive' : 'blocking',
          file,
          line,
          column,
          found: m[0],
          reason: ambiguous
            ? `"${m[0]}" is the non-canonical term for ${lowerFirst(term.concept)}, but it is also an ordinary word. Check which sense is meant.`
            : `"${m[0]}" is a non-canonical term for ${lowerFirst(term.concept)}. Every concept has exactly one canonical term, and a second label costs the reader working memory to reconcile.`,
          replacement: ambiguous
            ? `If it refers to ${lowerFirst(term.concept)}, use "${term.canonical}". Otherwise leave it.`
            : `Use "${term.canonical}".`,
          needsConfirmation: ambiguous,
        });
      }
    }
  }

  return findings;
}

function lowerFirst(s: string): string {
  return s.charAt(0).toLowerCase() + s.slice(1);
}

/** Lint one document. */
export function lintText(source: string, file: string, options: LintOptions = {}): LintResult {
  const { register, overrides = [], includeOverridden = true } = options;
  const registers = register === undefined ? [] : [register].flat();
  const spans = exemptSpans(source, prohibited.allowlist.patterns, file);
  const inline = parseInlineOverrides(source);

  const findings: Finding[] = [];
  const skippedRegisterRules: string[] = [];

  for (const rule of prohibited.rules) {
    const scoped = rule.registers !== 'all';

    if (scoped && registers.length === 0) {
      skippedRegisterRules.push(rule.id);
      continue;
    }
    if (scoped && !registers.some((r) => (rule.registers as Register[]).includes(r))) continue;

    let re: RegExp;
    try {
      re = compile(rule.match);
    } catch (error) {
      throw new Error(`Rule "${rule.id}" has an uncompilable pattern: ${(error as Error).message}`);
    }

    for (const m of source.matchAll(re)) {
      if (isExempt(m.index, spans)) continue;

      const { line, column } = locate(source, m.index);
      findings.push({
        ruleId: rule.id,
        severity: rule.severity,
        file,
        line,
        column,
        found: m[0],
        reason: rule.reason,
        replacement: rule.replacement,
        needsConfirmation: rule.requiresJudgement === true,
      });
    }
  }

  findings.push(...vocabularyFindings(source, file, spans));

  // Overrides are applied in one pass over every finding, whatever produced it.
  // Applying them only to the prohibition rules would leave vocabulary findings
  // unsuppressable, which is precisely the case a controlled-vocabulary
  // document needs.
  const annotated = findings
    .map((finding) => {
      const inlineOverride = isOverridden(finding.ruleId, finding.line, inline);
      const config = configOverrideFor(finding.ruleId, file, overrides);
      if (!inlineOverride && !config) return finding;

      return {
        ...finding,
        overriddenBy: inlineOverride
          ? { reason: inlineOverride.reason as string, source: 'inline' as const }
          : { reason: (config as { reason: string }).reason, source: 'config' as const },
      };
    })
    .filter((finding) => includeOverridden || !finding.overriddenBy);

  findings.length = 0;
  findings.push(...annotated);
  findings.sort((a, b) => a.line - b.line || a.column - b.column);

  return {
    file,
    findings,
    invalidOverrides: [
      ...invalidOverrides(inline).map((o) => ({
        rule: o.rule,
        line: o.declaredOnLine,
        scope: 'inline' as const,
      })),
      ...invalidConfigOverrides(overrides).map((o) => ({
        rule: o.rules.join(', '),
        line: 0,
        scope: 'config' as const,
      })),
    ],
    skippedRegisterRules,
  };
}

/** True where the result should fail a build. */
export function shouldFail(
  results: LintResult[],
  failOn: Severity = 'substantive',
): boolean {
  const order: Severity[] = ['minor', 'substantive', 'blocking'];
  const threshold = order.indexOf(failOn);

  return results.some(
    (r) =>
      r.invalidOverrides.length > 0 ||
      r.findings.some((f) => !f.overriddenBy && order.indexOf(f.severity) >= threshold),
  );
}

export { type Register, type Severity } from '../expression/index.js';
export type { ConfigOverride } from './overrides.js';
