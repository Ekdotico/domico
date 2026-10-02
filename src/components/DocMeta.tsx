// DocMeta — a document's own version and the date it last changed.
//
//   <DocMeta version="1.2" updated="2026-09-30" />
//   → Version 1.2 · Last updated 2026-09-30
//
// The documentation site gives every chapter page a version of its own, and
// the institutional site states one for each document it publishes ("version
// 1.3, as submitted on 4 August 2026", written into a subtitle by hand). One
// strip is one sentence shape for both.
//
// The application owns the values and where they come from. Pass them as
// given; nothing here derives a date from a file or a commit, because a
// whitespace commit is not a revision of the document.
//
// `updated` is an ISO date, YYYY-MM-DD, rendered as written: a reader's locale
// does not reformat it. Anything else is treated as missing. A missing value
// is not hidden. The strip says "Version unset" or "Last updated unknown" and
// takes the `doc-meta--incomplete` border, so a forgotten entry shows on the
// page instead of quietly rendering nothing.
//
// Below 360px the words "Last updated" leave the visual rendering and stay in
// the accessible name, so the date keeps its meaning for a screen reader.
//
// Styles: `@ekdotico/domico/styles/doc-meta.css`.

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function DocMeta({ version, updated }: { version?: string; updated?: string }) {
  const date = updated && ISO_DATE.test(updated) ? updated : undefined;
  const complete = Boolean(version) && Boolean(date);
  return (
    <p className={complete ? 'doc-meta' : 'doc-meta doc-meta--incomplete'}>
      <span>Version {version || 'unset'}</span>
      <span aria-hidden="true"> · </span>
      <span>
        <span className="doc-meta-label">Last updated </span>
        {date ? <time dateTime={date}>{date}</time> : 'unknown'}
      </span>
    </p>
  );
}
