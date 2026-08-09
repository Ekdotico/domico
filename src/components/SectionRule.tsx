// Decorative gilt + hairline rule between major sections.
// Use sparingly — only for top-level section breaks.

export function SectionRule() {
  return (
    <div className="sect-rule" aria-hidden>
      <div className="sect-rule-gilt" />
      <div className="sect-rule-line" />
    </div>
  );
}
