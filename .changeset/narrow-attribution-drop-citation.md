---
'@ekdotico/domico': patch
---

Two corrections to the Expression Guidelines, both about a claim the cited
source does not carry.

**The `special needs` prohibition attributed its reason too widely.** The rule
said the term is "perceived as patronising by autistic and disabled
communities (Bottema-Beutel et al., 2021)". The paper is *Avoiding ableist
language: Suggestions for autism researchers*, and its full text says "many
autistic people find terms such as 'special interests' and 'special needs'
patronizing". It reports on autistic people; it does not speak for disabled
communities generally. The reason now reads "perceived as patronising by many
autistic people", which is what the citation supports. The prohibition itself
is unchanged: the term stays blocking in every register, with the same
replacement.

**P6's grounding named a work that cannot be resolved.** The principle cited
"Frontiers in Education (2023); Eaton (2025)". No Frontiers in Education
article matching the claim was located during the September 2026 documentation
audit — the citation carried no author, title, or DOI, and searching the
journal produced no candidate. The grounding is now "Eaton (2025)" alone, which
is verifiable and sufficient for the principle. The documentation site removed
the same citation from its copy of P6; this brings the canonical copy into
agreement.

The change is to `expression/prohibited.json` and the hand-written prose of
`expression/guidelines.md`. Section 8's table is a generated region, so
`pnpm build:expression` regenerated it from the data; prose and data still
agree and the build-time check passes.
