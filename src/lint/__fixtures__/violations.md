---
title: Linter fixture
label: Should not be scanned
---

# Linter fixture

This file exercises the linter. Every violation below is deliberate.

## Should be reported

Ekdotiko is a superseded spelling of the product name.

The bibliography manager has powerful formatting and is intuitive to use.

Don't forget to seal the document before you export it.

We've noticed that you haven't added any citations yet.

Open the tasks tab to review extracted work items, then check the PDF annotator.

Please wait while the provenance record is created.

Something went wrong.

Sessions 1-5 are recorded in the report.

## Should NOT be reported

Inline code such as `humanize` and `Ekdotiko` is data, not copy.

```ts
// A fenced block may contain anything: humanize, Ekdotiko, "Please wait"
const label = 'Something went wrong';
```

Identifiers are allowlisted: SHA-256, Ed25519, FR-AI-24, NFR-DP-06, and the DOI
10.1007/s40979-026-00213-1 all contain hyphens between digits.

Chicago Notes-Bibliography and Chicago Author-Date are citation style names.

| Prohibited | Correct form |
|---|---|
| "Something went wrong." | "The export could not complete because the document has unsaved changes." |
| "Please wait..." | "Creating provenance record..." |

<!-- eg:cite -->
The guidelines prohibit "Oops" and "Almost there" in system feedback, and this
paragraph quotes them as counter-examples rather than using them.

## Overrides

<!-- ekd-lint-disable-next-line controlling-obligation — statutory wording, reviewed by counsel 2026-08-01 -->
You must retain the record for six years under the applicable regulation.

<!-- ekd-lint-disable-next-line unsubstantiated-superlative -->
The export pipeline is robust.
