---
'@ekdotico/domico': minor
---

Expression Guidelines 0.4. Three concepts that the specification and the
documentation site named inconsistently now have canonical terms, and the
Session rationale follows the requirement that governs it.

**Research workspace assistant** — the fifth AI surface. It carried three
labels: "research workspace assistant" in FR-AU-40, "AI-powered query
assistance" in FR-RW-22, and "research assistant" in this document's own §6.2.
The vocabulary held no entry for it, which is how a concept ends up with one
name per module. FR-AU-40 enumerates the five surfaces an institutional AI
policy governs, so its label is the one a policy screen will carry, and it is
the one adopted. §6.2 is corrected in the same change.

**Auto-add** — the highest-confidence tier in task extraction. The tier was
called auto-complete while the task it creates is assigned status "open", so
the name described the opposite of the behaviour, and four pages disagreed
about what the tier does. Renamed by the September 2026 documentation audit;
this records the name.

**Document over project.** FR-AU calls the unit an institution gains read
access to a project; every other module calls it the document, and the data
model has no Project entity. Document is canonical for the concept. FR-AU's
wording is a known residue whose amendment is a specification change rather
than a vocabulary one, so this entry records the decision rather than
pre-empting it.

All three non-canonical forms are `ambiguousVariants` — substantive, asking for
human confirmation — rather than blocking. Each is also correct in a
neighbouring sense: a research assistant is a person, a project is an ordinary
English word, and FR-TK-10 genuinely auto-completes tasks it reassesses, so
"auto-completed tasks" is right there and wrong as a tier name. A rule that
cannot tell the senses apart reports the correct use as often as the wrong one,
and the `copy` precedent on the branch entry is the same judgement.

**Session** — the rationale said a session begins when a document is opened in
a tab with focus. FR-PR-02 requires a qualifying interaction and records
nothing without one; FR-PR-03 adds a 60-second reconnection grace the rationale
omitted. The rationale now follows the requirement and cites it instead of
restating its values, so the two documents cannot drift into disagreeing about
a threshold.

Consumers should expect new substantive findings from `lint:copy` where these
forms appear. That is the point of the release: the queue was previously
invisible.
