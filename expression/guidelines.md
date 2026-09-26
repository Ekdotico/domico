# Ekdotico Expression Guidelines
**Version:** 0.4
**Status:** Active development
**Last updated:** September 2026
**Audience:** Core team, contractors, open-source contributors, automated failsafe review agent
**Owner:** `@ekdotico/domico` — this document is versioned and released with the package. It is the single canonical copy. Any copy held inside a consuming repository is stale by definition.

---

## Changelog

**v0.4 (September 2026):** Closed the terminology conflicts the September 2026 documentation audit raised against `docs.ekdoti.co`. Three concepts were named inconsistently across the specification and the site, and the vocabulary was silent on all three.

**Research workspace assistant** is now the canonical name for the fifth AI surface, which had been carrying three labels across four pages while holding no entry here. **Auto-add** is now the canonical name for the highest-confidence task-extraction tier, renamed from auto-complete because the tier creates a task with status open — the old name described the opposite of the behaviour. **Document** is recorded as canonical for the unit FR-AU calls a project; the two name the same thing, the data model has no Project entity, and FR-AU's wording is a known residue whose amendment is a specification change rather than a vocabulary one. All three non-canonical forms are confirmable rather than blocking: each is also correct in a neighbouring sense — a research assistant is a person, FR-TK-10 genuinely auto-completes tasks, and a project is an ordinary English word — and a rule that cannot tell the senses apart would report the correct use as often as the wrong one.

Amended the **Session** rationale, which described a session as beginning when a document is opened with focus. FR-PR-02 requires a qualifying interaction and records nothing without one, and FR-PR-03 adds a reconnection grace period the rationale omitted. The rationale now follows the requirement and cites it rather than restating its values, so the two documents cannot drift into disagreeing about a threshold.

Two corrections where a citation did not carry the claim made in its name. The **`special needs`** prohibition attributed its reason to "autistic and disabled communities"; Bottema-Beutel and colleagues (2021) reports that many autistic people find the term patronising, and the reason now says that. **P6's grounding** cited a Frontiers in Education (2023) work with no author, title, or DOI that the audit could not resolve; the grounding is now Eaton (2025) alone.

**v0.3 (August 2026):** Extracted into `@ekdotico/domico` as the single canonical copy, replacing the two divergent copies that both carried the version number 0.2. Reconciled §7 on the newer of the two: **provenance record** now names the captured data and **provenance report** names its human-readable rendering, which is what the specification content already used. Section 7 and §8 became generated regions, filled from `expression/vocabulary.json` and `expression/prohibited.json`; the structured data is now the single source for every mechanical rule and a build-time check fails if the prose and the data disagree. Recorded eight vocabulary gaps surfaced by the extraction audit against the §7.5 additions process.

Amended §5.4 rule 5. It previously named JetBrains Mono directly; it now names the `--font-mono` role token. The core team confirmed Crimson Pro, Commissioner, and Fira Code as the canonical typefaces, which would have put the rule in direct conflict with the design system it depends on. A language rule that hard-codes a family breaks every time typography is revisited, so the rule follows the role instead. This is the general principle: where the Expression Guidelines depend on the design system, they reference tokens, never values.

**v0.2 (May 2026):** Expanded §5 register rules with additional rules, edge cases, and register-specific templates. Added §5.6 (Register diagnostic framework). Developed §7 from placeholder to full canonical term list with process for additions. Expanded §8 from partial to comprehensive list with universal and register-specific categories. Flagged cross-document inconsistency in §5.4 regarding comparative language in the provenance record template — since verified as already satisfied in the current `02-provenance-system.md` template; no amendment required.

**v0.1 (May 2026):** Initial working draft.

---

## Table of contents

1. [Purpose and scope](#1-purpose-and-scope)
2. [Foundational principles](#2-foundational-principles)
3. [Audience](#3-audience)
4. [Universal rules](#4-universal-rules)
5. [The five registers](#5-the-five-registers)
   - 5.1 [Functional](#51-functional-register)
   - 5.2 [Instructional](#52-instructional-register)
   - 5.3 [System feedback](#53-system-feedback-register)
   - 5.4 [Provenance / institutional](#54-provenance--institutional-register)
   - 5.5 [Marketing / awareness](#55-marketing--awareness-register)
   - 5.6 [Register diagnostic framework](#56-register-diagnostic-framework)
6. [Deferred registers and features](#6-deferred-registers-and-features)
   - 6.1 [Supportive register](#61-supportive-register--deferred-v11)
   - 6.2 [AI output registers](#62-ai-output-registers--deferred-post-mvp)
   - 6.3 [Opt-in guidance mode](#63-opt-in-guidance-mode--feature-srs-amendment-required)
7. [Controlled vocabulary](#7-controlled-vocabulary)
8. [Prohibited terms](#8-prohibited-terms)
9. [Failsafe process](#9-failsafe-process)
10. [Future scope — extended product line](#10-future-scope--extended-product-line)

---

## 1. Purpose and scope

### 1.1 What this document is

The Ekdotico Expression Guidelines define the voice, register model, and language rules for all copy produced under the Ekdotico name — across the product interface, documentation, marketing materials, and institutional surfaces. They are the language counterpart to the Design System: where the Design System governs visual tokens, the Expression Guidelines govern linguistic ones.

These guidelines exist because Ekdotico is built for an audience that includes a significant proportion of neurodivergent writers — ADHD, dyslexia, autism spectrum, developmental language disorder, and other cognitive profiles are all substantially represented in the graduate and advanced undergraduate population. The decisions made here are not stylistic preferences. They are design decisions with measurable user impact, grounded in peer-reviewed research on cognitive load, motivational language, and inclusive communication.

### 1.2 Who this document is for

These guidelines apply to:

- The core founding team (all written product output)
- Contractors contributing UI copy, documentation, or marketing materials
- Open-source contributors submitting copy changes to the codebase
- The automated failsafe review agent (§9)

The guidelines are a public document consistent with the AGPL-3.0 licence of the codebase. Any copy submitted to the Ekdotico repository is subject to these rules, regardless of contributor status.

### 1.3 Relationship to other documentation

| Document | Governs |
|---|---|
| Expression Guidelines (this document) | Language, voice, register |
| Design System | Visual tokens, typography, colour, spacing, iconography |
| Software Requirements Specification (SRS) | Functional and non-functional requirements |
| Provenance System (02-provenance-system.md) | The provenance record template and verify.ekdoti.co output |

Where a conflict exists between this document and the Design System, the core team resolves it. Where a conflict exists between this document and the SRS, the SRS governs on functional matters; this document governs on language matters.

### 1.4 How this document is enforced

A specialised Claude Code agent, deployed as a Hook within the Cursor implementation environment, reviews all copy in a new screen against these guidelines. The agent fires automatically whenever a new screen or UI component is prepared. Any violation is a blocking issue. See §9 for full specification.

---

## 2. Foundational principles

These principles are the "why" behind every rule. When a specific rule does not exist for a novel situation, these principles are the decision-making framework.

### P1 — Low extraneous cognitive load
*Grounding: Sweller (1988), Cognitive Load Theory*

Working memory has finite capacity. Cognitive load generated by the interface itself — by ambiguous labels, inconsistent terminology, metaphorical language, unexpected tone shifts — competes directly with the cognitive load of the writing task. Every word Ekdotico displays is either helping the user focus on their work or pulling them away from it. The Expression Guidelines treat minimising extraneous load as a hard constraint, not a preference.

### P2 — Informational, not evaluative
*Grounding: Deci & Ryan (1987); Ryan (1982)*

The product describes processes and states. It never evaluates the person using it. "4h 12min active this session" is informational — it states a fact about the session. "You've been working hard!" is evaluative — it implies an authority making a judgement. This distinction governs every register. The informational principle applies even when the intent is positive: positive evaluative language is as prohibited as negative evaluative language because both frame the product as a judge rather than a tool.

### P3 — Autonomy-supportive, not controlling
*Grounding: Deci & Ryan (1985, 2000); Merchan Tamayo et al. (2022)*

Language that implies surveillance, creates urgency without basis, or issues instructions without rationale undermines intrinsic motivation. Language that offers choice, provides rationale, and acknowledges user agency supports it. This principle has direct consequences for error messages (never blame the user), empty states (never imply failure), and instructional copy (always explain why, not only what).

Controlling language markers to avoid:
- Pressure-inducing phrasing ("You need to...", "You must...", "Don't forget to...")
- Surveillance framing ("We've noticed you...", "You haven't yet...")
- Urgency without basis ("Your session is about to expire")
- Impatience signals ("Please wait while we process...")

### P4 — Non-deficit framing
*Grounding: Hamilton & Petty (2023); Milton (2012)*

Ekdotico does not imply a correct way to write. Writing in many short sessions is not worse than writing in a few long ones. Using Prose Refine frequently is not a sign of weaker writing. Producing citations from API lookup rather than manual entry is not less rigorous. The product records process; it does not rank it. All copy must be compatible with the neurodiversity paradigm framing of cognitive difference as variation, not deficit.

### P5 — Assistive by design
*Grounding: Internal design principle — never user-facing*

Ekdotico is designed with the working patterns of neurodivergent writers as foundational constraints, not as exceptions to accommodate. This principle is invisible to users. It is the standard by which every copy decision is evaluated internally. The word "assistive" does not appear in the product.

### P6 — Process describes; the person does not appear
*Grounding: Eaton (2025)*

The product records and presents writing process data. It does not characterise the writer. "14 sessions across 23 days" describes the document's history. "You've been consistent" describes the person. The second formulation is prohibited across all registers, including the marketing register.

### P7 — Consistency is a reliability contract
*Grounding: WCAG 2.2 §3.2.3, §3.2.4; W3C COGA (2021)*

For many neurodivergent users, consistent terminology is not a stylistic preference — it is a cognitive dependency. When the same concept appears under two different labels, the user must spend working memory resolving the discrepancy. Every concept in Ekdotico has exactly one canonical term. Once defined in §7, that term does not change between surfaces, registers, or contexts.

---

## 3. Audience

### Primary audience (current product scope)

- 3rd and 4th year undergraduate students writing substantial independent research papers or dissertations
- Master's students writing theses or research papers
- Doctoral students writing dissertations, publications, or chapters
- Postdoctoral researchers and independent scholars writing for academic publication

Technical proficiency assumed: browser-comfortable. No LaTeX, cryptography, or version control knowledge assumed. A significant proportion of non-native English writers. A significant and non-trivial proportion of neurodivergent writers, including those without formal diagnosis.

### Institutional audience (Team Plan)

Faculty supervisors, research supervisors, and academic integrity officers accessing provenance records and faculty dashboards. They receive output in the Provenance/Institutional register (§5.4). They are not the primary product audience and do not interact with the authoring interface.

### Future audience (extended product line — not in current scope)

Elementary through high school students. The Expression Guidelines are designed with extensibility in mind — the five registers and foundational principles will carry forward; the specific rules within each register will require separate calibration for younger audiences. See §10.

---

## 4. Universal rules

These rules apply regardless of register. Any copy submitted for Ekdotico, in any context, must comply with all of the following.

### 4.1 Tone and typography

| Rule | Correct | Incorrect |
|---|---|---|
| Sentence case for all labels, headings, and UI copy | "New document", "Provenance record" | "New Document", "PROVENANCE RECORD" |
| Title case for proper nouns and the product name only | "Ekdotico", "Prose Refine" | "the Provenance System" |
| No contractions in primary UI copy or formal documentation | "Do not" | "Don't" |
| No emoji anywhere in the product | — | 🎉 ✓ ✨ |
| No exclamation marks in product-facing copy | "Document sealed." | "Document sealed!" |
| Oxford comma in all lists | "research, writing, and provenance" | "research, writing and provenance" |
| Em dash (—) for interruption | "The record — once sealed — cannot be modified." | "The record - once sealed - cannot be modified." |
| En dash (–) for ranges | "Sessions 1–5" | "Sessions 1-5" |
| "Prose Refine" — never "humanize" | "Use Prose Refine to refine selected text." | "Humanize this paragraph." |
| Product name: Ekdotico or ekdoti.co | "Ekdotico", "ekdoti.co" | "Ekdotiko" |

### 4.2 Structure and cognitive accessibility

- Short sentences. One idea per sentence.
- Active voice. Passive voice only when the actor is genuinely unknown or irrelevant.
- No double negatives. ("Save before closing" not "Do not close without saving.")
- No idiomatic expressions, figures of speech, or sarcasm.
- Technical terms defined on first use in every context. Do not assume a term explained in onboarding is retained later.
- No time-pressure language unless the time constraint is real and user-initiated.
- No urgency language ("immediately," "right now," "before it's too late") unless the urgency is accurate.

### 4.3 Product integrity rules

- No claims that cannot be substantiated by the provenance record or demonstrated product behaviour.
- No language that implies institutional surveillance of the student through Ekdotico's interface.
- No framing that positions Ekdotico as an academic integrity enforcement tool. The product is a writing environment with a student-controlled provenance system.
- In product copy, describe the provenance system as "student-controlled" — a claim about demonstrated product behaviour. "Student-owned" is reserved for market and competitive positioning, where it is the intended category differentiator, not a product-copy claim.

---

## 5. The five registers

A register is a mode of communication calibrated to a specific context and purpose. The same foundational voice runs through all five registers; what changes is the functional purpose each register serves, and the rules that follow from that purpose.

For the method of determining which register applies to a given piece of copy, see §5.6 (Register diagnostic framework).

---

### 5.1 Functional register

**Definition:** The taxonomy of the product. Labels, navigation items, button text, section headers, status indicators, and any text whose primary function is identification or navigation.

**Purpose:** Enable the user to predict what something does from its label, without needing to interact with it. The functional register is the skeleton of the interface — it must be maximally reliable.

**Rules:**

1. Maximum three words. Two words preferred. One word where possible.
2. Use only controlled vocabulary terms (§7). When §7 is incomplete, the core team locks the term before shipping.
3. Never metaphorical. Use only functional verbs that describe the action precisely.
4. Never decorative. No alliteration, rhyme, or wordplay in labels.
5. Identical actions receive identical labels across all surfaces and contexts. The "Save" button in the editor and the "Save" button in settings use the same word.
6. Status indicators name states, not evaluations.
7. No punctuation in labels (no periods, question marks, or exclamation marks).
8. No articles in short labels. ("Save" not "Save the document" — the context provides the object.)
9. Destructive actions use a two-word pattern: verb + object noun. When the target of an action is ambiguous from the button label alone, the object noun is required. ("Delete document" not "Delete" on a document-level control; "Delete citation" not "Delete" on a citation-level control.)
10. Reversible and irreversible actions are distinguished by vocabulary, not only by confirmation dialogs. Reversible actions use standard verbs (Save, Remove, Rename, Archive). Irreversible actions use vocabulary that signals permanence (Seal, Delete, Revoke). "Remove" is reversible. "Delete" is not. This distinction must be applied consistently.
11. Toggle controls label the current state, not the action that would change it. A document set to private carries the label "Private." After toggling, the label reads "Shared." The label does not say "Make private" or "Switch to shared."
12. Compound actions (two operations in one button) are permitted only when the two operations are always performed together and no user scenario exists where performing only one is useful. ("Save and export" is valid where saving is a prerequisite for export and cannot be separated. "Save and open settings" is not valid — these are independent operations.)
13. Icon-only interactive elements must have an accessible label (`aria-label`) using the same controlled vocabulary term that would appear on a labelled version of the same element. The accessible label and the tooltip text must be identical.

**Good examples:**
- Save
- Export
- New document
- Provenance record
- Seal
- Research workspace
- Citation panel
- Session history
- Unsaved changes
- Delete document
- Rename

**Prohibited:**
- "Forge your draft" (metaphorical)
- "Quick save!" (urgency, exclamation mark)
- "Polish" as a writing action label (metaphorical)
- "Boost" (evaluative, metaphorical)
- "Oops, not saved" (evaluative)
- "Almost done" as a status indicator (evaluative)
- "Make private" on a toggle that is already private (labels state, not action)
- "Delete" alone on a document-level action where the target is ambiguous

---

### 5.2 Instructional register

**Definition:** Onboarding, tooltips, empty states, help text, guided actions, and modal explanations. Tells the user what is possible or what to do next.

**Purpose:** Orientation without assumed knowledge. A user encountering any feature for the first time — regardless of prior product experience or technical background — should be able to understand it from the copy alone.

**Rules:**

1. Explicit over implicit. State what will happen, not what could happen.
2. Sequential where sequence matters. "First open the citation panel, then search by DOI" — not "The citation panel and DOI search are available."
3. Action descriptions rather than commands. "Selecting a passage activates Prose Refine in the right panel" — preferred over "Click here to use Prose Refine."
4. No assumed knowledge. Define all acronyms. Explain what icons do, not only what they are.
5. Progressive disclosure. Surface the minimum needed at the moment. Do not explain features the user has not yet encountered.
6. Empty states must orient, not rebuke. They describe what the space is for and offer a starting action.
7. COGA clear language patterns apply most strongly in this register: clear words, simple tense, active voice, short sentences.
8. One idea per sentence.
9. Define technical terms on first use in every instructional context.
10. No idiom or metaphor.
11. Do not assume the user has read prior instructional copy from the same session or document.
12. For multi-step workflows, number steps only when sequence is strictly required and cannot be inferred from context. If the user can perform steps in any order, use prose or a bulleted list, not numbered steps. Numbered steps imply a required sequence; use them only when that is true.
13. Instructional copy for features involving data loss or irreversibility must appear before the triggering action, not after it. Explanation of what sealing means must precede the Seal button, not follow from a confirmation dialog alone.
14. Where a feature has two modes (for example, the PDF reader with and without annotations enabled), write instructional copy for the more commonly encountered mode. Provide a single-line note for the alternate mode. Do not write full instructional copy for every permutation.
15. Never anthropomorphise the system in instructional copy. "The research workspace searches connected sources and returns ranked results" is acceptable. "Ekdotico learns your preferences over time" is not — it implies continuous surveillance and anthropomorphised intelligence. Describing what the system does (function) is not the same as describing the system as if it thinks or watches (anthropomorphism).
16. Instructional copy that describes provenance features must avoid evaluative inference. "The provenance record captures the number of sessions in which the document was worked on" is correct. "The provenance record shows how much effort went into the document" is prohibited — it infers meaning from data, which is an evaluative act.

**Templates:**

*Empty state formula:*
> [What this area is for]. [How to start.]

Example: "No citations yet. Open the research workspace to find and add sources."
Not: "You haven't added any citations." (rebuke framing)
Not: "Citations will appear here when added." (passive; no next action)

For provenance-related empty states, add: who can see this area and on what surfaces.
Example: "Session history is recorded here as you write. Session data is visible to you and, on Team Plan, to your supervisor."

*Tooltip formula:*
> [What this does]. [What happens as a result, where relevant.]

Example: "Seals this document and creates a permanent provenance record. Sealing cannot be undone."
Not: "Click to seal!" (command; exclamation mark)
Not: "This button seals things." (vague)

*Warning-within-instruction formula* (for instructional copy that must include an irreversibility notice):
> [What this does]. [Specific consequence of proceeding]. [What to do if not ready to proceed.]

Example: "Sealing creates a permanent, unmodifiable provenance record for this document. The provenance record cannot be modified or deleted after sealing. Save a draft copy if you want to continue editing before sealing."

---

### 5.3 System feedback register

**Definition:** Error messages, validation notices, success confirmations, warnings, loading states, and any copy generated by a system event rather than a user navigation action.

**Purpose:** Close the feedback loop. Tell the user exactly what happened and, where relevant, what to do next. Never leave the user in uncertainty about the state of their work.

**Rules:**

1. Every error message must contain both: (1) what happened, in plain language; (2) what to do next. Both components are required. An error message without a path forward is incomplete.
2. Active voice. Never use passive voice to obscure agency. "The export could not complete because the document has unsaved changes" — not "The export could not be completed."
3. Never use "invalid," "error," or "failed" as standalone descriptors. Each must be followed immediately by a plain-language explanation.
4. Error messages address the problem, not the person. "The DOI could not be resolved" — not "You entered an invalid DOI."
5. Success confirmations describe the completed action. They do not praise. "Document sealed. Provenance record created." — not "Great work! Your document is sealed."
6. Warnings describe consequences, not feelings. "Sealing this document is permanent. The provenance record cannot be modified after sealing. Proceed?" — not "Are you sure?"
7. No urgency language unless the urgency is accurate and user-initiated.
8. Loading states describe what is happening. "Creating provenance record..." — not "Working on it..." or "Almost there..."
9. WCAG 2.2 §3.3.1 (Error Identification) and §3.3.3 (Error Suggestion) are minimum compliance thresholds for all error messages. Non-compliance is a blocking failsafe violation.
10. Tense must be accurate. Use past tense for events that have completed ("The document could not be saved"). Use present tense for states that are currently true ("The document has unsaved changes"). Do not use present tense to describe a past failure.
11. Loading state copy scales with elapsed time:
    - Under 1 second: no text copy — use a progress indicator only
    - 1 to 5 seconds: action description in present continuous ("Creating provenance record...")
    - Over 5 seconds: action description with factual context ("Creating provenance record. Documents with more than 50 sessions may take up to 30 seconds.")
    - Over 60 seconds (asynchronous jobs only): action description, factual ceiling, and explicit status ("Rendering session replay. Video generation for long documents may take several minutes. A notification will appear when complete.")
12. Where the same error condition can occur in multiple locations (for example, a network failure during save, during export, or during citation lookup), the description of the problem must be consistent across all locations. The path-forward component may vary by location and context.
13. Confirmation dialogs for irreversible actions follow a three-component formula:
    > [What will happen — specific and factual]. [What cannot be undone]. [Two options: the confirm action (verb + object, from the controlled vocabulary) and Cancel.]

    Example: "Sealing this document creates a permanent provenance record. The provenance record cannot be modified or deleted after sealing. [Seal document] [Cancel]"

    The confirm button uses the controlled vocabulary action verb. It is never "Yes," "OK," or "Confirm." The cancel option is always labelled "Cancel."

14. Success confirmations for asynchronous operations that complete in the background — export jobs, video rendering — must appear as persistent notifications rather than transient toasts when the user may have navigated away from the originating surface. A toast dismissed before the user notices the result is a lost confirmation.

**Error classification:**

Three classes of error require different templates. The class determines the template; the template determines what information must appear.

*Class A — Validation errors:* User input did not meet a requirement.
> [What the input requires]. [Why, if non-obvious]. [Example of correct format, where applicable.]

Example: "DOI format requires a prefix of 10. followed by the registrant code and suffix — for example, 10.1007/s40979-026-00213-1. Check the DOI printed on the source and try again."

*Class B — System errors:* A system operation failed despite valid input.
> [What operation failed, in plain language]. [Likely cause]. [What to try]. [Status of the user's work.]

Example: "The provenance record could not be created. A connection error occurred during export. Check your connection and try again. Your draft is saved."

*Class C — Environmental errors:* An external dependency is unavailable.
> [What is unavailable]. [What still works]. [What to try instead, or when to retry.]

Example: "Semantic Scholar is not responding. CrossRef and OpenAlex are available. Search those sources now, or try Semantic Scholar again in a few minutes."

**Prohibited / correct reference table:**

| Prohibited | Correct form |
|---|---|
| "Invalid DOI." | "The DOI entered could not be resolved. Check the format (10.XXXX/XXXXX) and try again." |
| "Something went wrong." | "The export could not complete because the document has unsaved changes. Save the document and try again." |
| "Error saving." | "The document could not be saved. Your connection may have been interrupted. Check your connection and try again." |
| "Oops!" | [Never use in system feedback] |
| "Session expired!" | "Your session has ended. Sign in again to continue — your work is saved." |
| "Please wait..." | "Creating provenance record..." |
| "Almost there..." | "Creating provenance record. This may take up to 30 seconds." |
| "Great! Document sealed." | "Document sealed. Provenance record created." |
| "Are you sure?" | [Use confirmation dialog formula — see Rule 13] |

---

### 5.4 Provenance / institutional register

**Definition:** The provenance record displayed to students on their dashboard, the output at verify.ekdoti.co, and all text on supervisor-facing surfaces (Team Plan faculty dashboard). This register also covers the AI detector exclusion note, the signature chain display, and any GDPR-related disclosure text embedded in the record.

**Purpose:** Provide a formally structured, factual record of document history that is defensible in academic integrity contexts and legible to a reviewer with no prior product knowledge.

**Rules:**

1. Strictly factual. No interpretive language. No inferences about intent, effort, or quality.
2. No warmth markers of any kind. No product voice. No UI idiom.
3. Present tense for current state ("Signature valid"). Past tense for recorded events ("14 sessions recorded").
4. Numbers, dates, and timestamps are precise. Dates use ISO 8601 format (YYYY-MM-DD). Times to the nearest minute.
5. The monospace face — the `--font-mono` token from the design system — for all cryptographic identifiers, hashes, public keys, and server-issued timestamps. This rule names the role, not a family. Which face fills the monospace role is a design system decision, and a language rule must not break when that decision changes.
6. No evaluation of the student or their work, ever. Not even implicitly positive evaluation.
7. The record describes what happened. It does not interpret why it happened.
8. All product-internal terms are defined on first use within the record. The record is a self-contained document; a reviewer with no Ekdotico product knowledge must be able to read it without external reference. A brief glossary of product-specific terms (session, Prose Refine, planning canvas, document hash) must appear at the end of every provenance record.
9. The AI detector exclusion note follows the established template from `02-provenance-system.md`. It is part of every record.
10. The record is the student's document. Copy in this register does not frame it as an institution-controlled or compliance report. Do not assert ownership or control beyond what the product demonstrably provides.
11. Comparative language is prohibited. The record does not compare the document's writing process to a reference population, a norm, or an expected profile. "2,847 pauses recorded; median 4.2 seconds" is correct. "Pause distribution consistent with human composition" is prohibited — it is a comparative inference, not a factual statement. See cross-document amendment note below.
12. Statistical data in the provenance record uses the pattern: plain-language label, followed by a precise value with units. Units are spelled out on first use within a section and may be abbreviated thereafter within that section.
13. The provenance record does not address the student in the second person ("you"). It describes the document's history in the third person or in passive constructions. "14 sessions were recorded" not "You worked in 14 sessions."

**Cross-document amendment — resolved:**

An earlier reference design was noted as potentially carrying the phrase "Distribution consistent with human composition" under the Pauses section, which would violate Rule 11 above. The current provenance record template in `02-provenance-system.md` does not contain this phrase: the Pauses section reports factual data alone — pause count, median length, and location distribution (within-word, between-sentence, between-paragraph) — with no comparative framing. No amendment is required. This note is retained for traceability.

**Prohibited in this register:**

- "The author worked diligently..." (evaluation)
- "Excellent writing process shown..." (evaluation)
- "Writing fluency: high" (inference from data)
- "You've been consistent" (evaluation + wrong-audience address)
- "Consistent with human composition" (comparative inference)
- "Indicates authentic authorship" (evaluative inference; the record cannot make this claim)
- Any emoji, exclamation marks, or warmth markers

**Reference design:** See `02-provenance-system.md` for the full verify.ekdoti.co output template. The register rules above apply to all text in that template and to any extension of it.

---

### 5.5 Marketing / awareness register

**Definition:** Landing pages, institutional pitch materials, email communications, documentation site introductions (non-technical), and any copy whose primary purpose is communicating Ekdotico's value to prospective users or partners.

**Purpose:** Communicate Ekdotico's proposition clearly and compellingly to an audience that has not yet used the product. This is the only register where persuasive framing is permitted.

**Rules:**

1. All universal rules (§4) apply without exception. Sentence case, no exclamation marks, no emoji, no contractions in primary copy.
2. More latitude for rhythm, sentence variation, and structural framing than other registers. Complex sentence structures are permitted.
3. Still never evaluates the user or implies a single correct way to write.
4. Controlled vocabulary (§7) is consistent with the product itself. Terms used in marketing match terms used in the product.
5. Pre-launch status must be named explicitly. It is not softened, deferred, or implied. The correct form is: "Ekdotico is in pre-launch development." Do not use "Coming soon" (indefinite), "Beta" (implies a maturity level not yet defined), or "Early access" (implies exclusivity pricing).
6. Competitor references are factual and sourced. No unverifiable comparative claims.
7. No claims that cannot be substantiated by the product or the provenance record.
8. The product is described as what it is: an academic writing environment with a cryptographic provenance system. It is not described as an AI detection tool, a compliance platform, or a surveillance system.
9. The assistive design principle (P5) is never named in marketing copy. The product is not described as "assistive technology" in any user-facing context.
10. When describing the provenance system to a prospective user, describe what the record contains and what the student does with it — not what it proves about authorship. "The provenance record documents your writing sessions, revision patterns, and AI tool usage" is correct. "The provenance record proves you wrote the work yourself" is not — this is a claim the record cannot make about intent or attribution.
11. When citing data about competitors or the broader market (AI detector false positive rates, pricing comparisons, feature gaps), include the source and access date. Marketing copy that cannot be sourced is not shippable.

---

### 5.6 Register diagnostic framework

**Purpose:** Provide a deterministic method for identifying which register applies to any piece of copy. Used by the failsafe agent (§9) for automated classification, and by contributors and reviewers for manual classification.

**Key principle:** The unit of analysis is the copy element, not the surface. A single screen may contain copy from multiple registers. A provenance panel contains data labels (Functional), a tooltip explaining what a metric means (Instructional), and the provenance data itself (Provenance/Institutional). Each element is classified independently.

---

**Step 1: Surface default**

Start with the surface where the copy appears. Most surfaces have a default register:

| Surface | Default register |
|---|---|
| Navigation labels, button text, menu items, status badges, tab labels | Functional |
| Tooltips, onboarding flows, empty states, feature introductions, help text | Instructional |
| Error messages, success confirmations, loading states, validation notices, warnings | System Feedback |
| Provenance record sections, verify.ekdoti.co, faculty dashboard data fields, AI detector exclusion note, GDPR disclosures within the record | Provenance/Institutional |
| Landing pages, pitch decks, documentation site introductions, external email communications | Marketing/Awareness |

If the surface default is unambiguous, the classification is done. If the surface hosts multiple register types — or the copy does not fit the surface default — proceed to Step 2.

---

**Step 2: Primary function test**

Apply these five questions in order. Answer the first question that applies:

1. Is the primary function to identify or navigate — to name something so the user can find or act on it? → **Functional**
2. Is the primary function to explain what something does, how to start, or what will happen next — to orient a user who has not yet interacted with this feature? → **Instructional**
3. Was this copy triggered by a system event (operation completed, operation failed, background processing, state change)? Is its primary function to report what happened? → **System Feedback**
4. Is the primary function to present a formal, factual record for institutional or verification purposes? Would this copy appear on verify.ekdoti.co to a reviewer with no Ekdotico account? → **Provenance/Institutional**
5. Is the primary function to communicate Ekdotico's value to someone who has not yet used the product — to persuade or introduce? → **Marketing/Awareness**

---

**Step 3: Edge case resolution table**

When Step 2 does not resolve the classification unambiguously, consult this table:

| Edge case | Classification | Reasoning |
|---|---|---|
| A tooltip on a metric in the provenance record | Instructional (if explaining what the metric means to a first-time viewer); Functional (if labelling a value that is already visible) | Test: does this tooltip orient a new user, or does it name something? |
| Body text in a confirmation dialog for sealing | System Feedback | The dialog is system-triggered; its body reports what will happen and what cannot be undone. Apply System Feedback Rule 13 (confirmation dialog formula). |
| Button labels within a confirmation dialog | Functional | Labels within any dialog are Functional regardless of dialog register. |
| An explanatory paragraph on the faculty dashboard about how to interpret the record | Instructional | The faculty dashboard is a product surface; the explanation is orienting a new user to what they are seeing. The provenance data fields on the same page remain Provenance/Institutional. |
| The AI detector exclusion note on verify.ekdoti.co | Provenance/Institutional | It is part of the provenance record and must read as a self-contained, formal explanation without product voice. |
| A help article on the documentation site explaining how sessions are counted | Instructional | The documentation site is a product support surface, not a marketing surface, even though it is publicly accessible. |
| An error message that also contains a next-action step | System Feedback (primary); the instructional component is subordinate | The presence of instructional content within a System Feedback element does not change the element's register. The System Feedback formula governs; the instructional component is applied within that framework. |
| The "What is Ekdotico?" introductory section on the documentation site | Marketing/Awareness | The primary function is to introduce the product's value to a new visitor. |
| A feature explanation section within the same documentation page | Instructional | Within the same page, register can shift per section when function shifts. |
| A legal disclosure about GDPR consent displayed in the registration flow | Instructional (if orienting the user); Provenance/Institutional (if embedded in the provenance record itself) | Test: is this disclosure part of the onboarding flow (Instructional) or embedded in the formal record (Provenance/Institutional)? |
| The session-count number in the provenance record | Provenance/Institutional | A data value in the record is always Provenance/Institutional, even if it appears on a surface that also has Instructional copy. |

---

**Step 4: Multi-register surfaces**

When a surface confirmed to contain multiple registers is being reviewed, the failsafe agent must:

1. Identify each discrete copy unit (label, sentence, paragraph, tooltip text).
2. Classify each unit independently using Steps 1–3.
3. Apply the rules of the classified register to each unit.
4. Flag any unit where a single copy element applies rules from two registers simultaneously — this is a structural problem requiring redesign, not a classification judgment call.

---

## 6. Deferred registers and features

Sections in this part of the document are formally deferred. Each deferred item includes: the reason for deferral, the current best hypothesis where one exists, the SRS implication, and the conditions under which deferral ends.

---

### 6.1 Supportive register — DEFERRED v1.1+

**Status:** Concept accepted. Rules not yet defined. Not present in v1.0.

**What the supportive register would do:** Surface factual, non-evaluative process information at moments of high emotional or cognitive need — the end of a long session, a first document creation, a return after an extended gap — in a way that normalises the user's experience without evaluating it.

**Reason for deferral:**
No existing research literature addresses the precise intersection of Ekdotico's context: a student-controlled, provenance-based writing environment used by graduate and advanced undergraduate students, including a neurodivergent cohort, at the point of thesis and research paper writing. The supportive register requires empirical validation with actual users before the copy rules can be written with confidence. Deploying an untested version risks causing the exact harm (patronising, controlling, evaluation-signalling language) it is designed to prevent.

**Current best hypothesis (not yet validated):**
The informational-plus-affordance pattern. A factual statement about the writing process paired with an offered next action, with no evaluative language. The user reads what happened; the user is offered what to do next; no judgement is rendered.

Example (provisional — not approved for v1.0):
> "4h 12min active this session. Save and close?"

This combination: states a fact about the session (informational) and offers the obvious completion action (affordance), without evaluating the work, evaluating the writer, or implying that stopping is a failure.

**Behavioural detection connection:**
The supportive register will draw on behavioural signals from the provenance layer — pause distribution, session duration, active time. This connection is accepted in principle. Implementation is deferred alongside the register itself.

**SRS implication:**
A placeholder requirement must be added to the SRS specifying that the interface architecture must accommodate a future behavioural-signal-to-interface-experience connection, without requiring structural change at implementation. The architecture must support this capability from v1.0 even though it is not activated.

**Conditions for ending deferral:**
User research with the primary audience produces validated findings on which copy patterns are experienced as supportive vs. patronising for this specific population. A minimum of one usability study with neurodivergent participants is required before the supportive register rules are finalised.

---

### 6.2 AI output registers — DEFERRED post-MVP

**Status:** Concept accepted. Rules not yet defined. Not present in MVP AI surfaces.

**What AI output registers would govern:** The text generated by Prose Refine, the research workspace assistant, the source chat, and the auto-generated research journal. These surfaces produce text within the user's writing environment. That text must comply with the Expression Guidelines — but because it is generated rather than authored, compliance is achieved through system prompt design, not copy review.

**Reason for deferral:**
AI output is a separate design domain from static UI copy. Each AI surface (Prose Refine, research workspace assistant, research journal, source chat) likely requires its own register calibration, and the mapping between output type and register is not yet validated. A dedicated working session is required to design the system prompt constraints for each surface and to validate them against the Expression Guidelines.

**Current best hypothesis (not yet validated):**

| AI surface | Likely register |
|---|---|
| Prose Refine suggestions | Instructional (when explaining a change) + Functional (when labelling actions) |
| Research workspace assistant results | Instructional |
| Research journal auto-generation | Provenance / Institutional |
| Source chat responses | Instructional |

These mappings are provisional. They will be validated and locked in the dedicated AI output register session.

**SRS implication:**
The architecture for AI surface system prompts must be designed with Expression Guidelines compliance as a parameterisable constraint. Each AI surface system prompt must include an Expression Guidelines reference section that can be updated when the AI output register is formalised.

**Conditions for ending deferral:**
A dedicated working session produces validated register mappings for each AI surface, produces the system prompt constraints for each, and confirms that the generated output passes the same failsafe criteria as static copy.

---

### 6.3 Opt-in guidance mode — FEATURE, SRS amendment required

**Status:** Confirmed as a product feature. Not an Expression Guidelines concept. Routes to the SRS.

**Description:**
An opt-in mode, selectable at account creation or in user settings, that increases the depth and frequency of instructional copy. Users who activate this mode receive more explicit step-by-step guidance at key moments in the product. Users who do not activate it experience the default instructional register depth.

**Why this is a feature, not an Expression Guidelines concept:**
The Expression Guidelines define the quality and character of copy in each register. Whether a user sees a lot or a little of the instructional register is a product behaviour question — it requires a user preference model, a settings surface, and conditional display logic. That is functional requirement territory. Once the feature is specified in the SRS, the Expression Guidelines will define the two intensity levels for the instructional register (standard and guided).

**SRS action required:**
Add as a new functional requirement to the FR-AU (Authentication and access control) or FR-ED (Collaborative block editor) module. The requirement must specify: the setting surface (account creation + settings), the default state (off — standard instructional depth), and the scope (which surfaces and which copy are affected by the toggle).

**Expression Guidelines amendment required (future):**
Once the feature is specified, §5.2 (Instructional register) will be extended with a "guided depth" subsection defining the additional copy rules that apply when the guidance mode is active.

---

## 7. Controlled vocabulary

Every concept in Ekdotico has exactly one canonical term. Once defined in this section, that term is used consistently across all registers, all surfaces, all documentation, and all contributor submissions. Synonyms are not permitted for defined concepts.

<!-- generated:vocabulary start — edit expression/vocabulary.json, then run pnpm build:expression -->

_36 canonical terms. Generated from `expression/vocabulary.json`._

| Concept | Canonical term | Shorthand (after first use) | Non-canonical variants | Rationale |
|---|---|---|---|---|
| The document the user is working on | **Document** | — | "doc" | Format-agnostic; applies equally to thesis, journal article, research paper, and conference paper. "Paper" implies a specific physical format. "Manuscript" implies an unpublished state. "Work" is too general for functional contexts. "Manuscript" is also standard academic usage for a paper under submission, so it is confirmable rather than blocking. "Project" names the same thing from the other side: FR-AU used it for the unit an institution gains read access to — a document together with its source library, planning canvas, research journal, and task list — while every other module called that unit the document, and the data model has no Project entity. FR-AU was amended in September 2026 to say document, so no requirement now uses the term. Document is canonical for the concept, and "project" stays confirmable rather than blocking because it is also an ordinary English word. |
| The action of permanently committing the provenance record | **Seal** | — | "finalise", "finalize" | Captures the metaphor of a physical seal on a legal document — closure, integrity, authenticity — without requiring users to understand the technical mechanism. "Lock" implies reversibility. "Finalise" is too generic. Sealing is what the writer does; export lock is the mechanism that carries it out, and the two are separate entries rather than synonyms. |
| The mechanism that seals the provenance record at export | **Export lock** | `Lock` | — | The established name in the specification, where it is used throughout FR-EX, FR-PR, and FR-VR. It names a mechanism, not an action the writer takes: the writer exports, and the export lock is what seals the record as part of that. Distinct from Seal, which is the user-facing action. |
| The state of a document after sealing | **Sealed** | — | "finalised", "finalized" | Past participle and adjective form of the canonical verb. |
| The complete collection of captured provenance data | **Provenance record** | `Record` | "writing record", "certificate", "provenance certificate", "audit trail" | The record is the complete, structured collection of all data the provenance system captures for a document; its human-readable rendering is the provenance report. Established throughout the SRS. "Record" alone is too generic in other contexts. "Certificate" implies third-party issuance. "Writing record" omits the integrity dimension. |
| The human-readable rendering of the provenance record | **Provenance report** | `Report` | "provenance view", "record view", "verification report" | The report is the legible presentation of the provenance record, returned on verify.ekdoti.co and in the faculty dashboard. The record is the data; the report is the view of it. A report is always a rendering of a record, never a separate artefact. |
| The AI-assisted prose editing tool | **Prose Refine** | `/refine` | "humanize", "humanise", "inline chat", "rewrite tool", "polish" | Locked. Title case; two words. Never "humanize" or "humanise". |
| The mind map and planning feature | **Planning canvas** | `Canvas` | "mind map", "mindmap", "concept map" | Specific to Ekdotico; distinguishes from the generic "mind map" methodology and from the LMS named Canvas. Communicates the purpose. "Canvas" alone is acceptable shorthand after "planning canvas" has appeared once in the same document or screen — the LMS ambiguity is resolved by first use rather than by avoiding the short form throughout. |
| A continuous unit of writing activity | **Session** | — | "work session", "writing period" | Shortest, most functional term. A session begins when an authenticated user opens or activates a document and performs a qualifying interaction; opening or activating a document without one begins nothing, and no provenance data is recorded for activity consisting solely of non-qualifying events. It ends when the document tab is closed or navigated away from, when the collaboration connection is lost and is not re-established within the grace period, or after a continuous absence of qualifying interactions exceeding the inactivity threshold. The grace period and the threshold are specified in the SRS (FR-PR-02, FR-PR-03), which governs; naming the values here would put two documents in a position to disagree about them. "Writing session" is acceptable in instructional prose on first use; "session" is the canonical term for functional and provenance contexts. |
| A main-line document version created from an existing sealed document | **Revision** | — | "new version", "iteration" | Established in the branching specification. |
| The action of creating a main-line revision | **Revise** | — | "create version", "iterate" | Established in the branching specification. Available on main-line (.0) documents only. |
| A derived document based on a sealed document | **Branch** | — | "derivative" | Established in the branching specification. Noun and verb. "Fork" is also the ordinary software sense — a forked dependency, or forking the open-source repository — so it is confirmable rather than blocking. |
| The two-component version identifier | **Version** | `v1.0` | — | Always followed by major.minor format, for example Version 1.0. Established in the branching specification. Always two-component. |
| The SHA-256 hash identifying a sealed export | **Document hash** | `Hash` | "checksum", "fingerprint", "digest" | Technical term; displayed in monospace. Not user-facing in plain prose. |
| The Ed25519 signature appended at the end of each session | **Session signature** | `Signature` | "sig", "session key" | Distinguishes the per-session signing event from the export-level hash. |
| The AI-powered search and source discovery surface | **Research workspace** | — | "research panel", "discovery panel", "search workspace" | Established in SRS module naming. |
| The AI query-assistance surface inside the research workspace | **Research workspace assistant** | — | — | The fifth AI surface, and the last one to be named. It carried three labels — "research workspace assistant" in FR-AU-40, "AI-powered query assistance" in FR-RW-22, and "research assistant" on the deferred-registers page — while the vocabulary held no entry for it at all, which is how a concept ends up with one name per module. FR-AU-40 enumerates the five surfaces an institutional AI policy governs, so its label is the one the policy screen will carry and the one adopted here. The surface reads the document and suggests search queries; it does not conduct the search, which the research workspace does, and the two are separate entries rather than one. "Research assistant" is a person in an academic setting and is confirmable rather than blocking; "query assistance" remains correct as a description of what the surface does, and is a breach only when used as its name. |
| The PDF reading and annotation surface | **PDF reader** | — | "PDF annotator", "document reader" | Simple and functional. "PDF annotator" is secondary. The compound module title "PDF reader and annotator" is permitted where it names the FR-PD module rather than the product surface. "PDF viewer" also means a third-party application reading an exported file — the metadata entry visible in Acrobat's properties panel, for instance — so it is confirmable rather than blocking. |
| The AI-powered source interaction surface | **Source chat** | — | "document chat", "paper chat", "RAG chat" | Established in SRS module naming. |
| The AI-maintained writing journal | **Research journal** | — | "writing journal", "process journal", "lab notebook" | Established in SRS module naming. |
| The task management surface | **Task tracker** | — | "tasks tab", "to-do list", "todo list" | Established in SRS module naming. "Task panel" names the panel within the tracker rather than the tracker itself, and the specification uses it that way throughout FR-TK. |
| The highest-confidence tier in task extraction, which creates a task without a confirmation step | **Auto-add** | — | — | The tier was called auto-complete while the task it creates is assigned status "open", so the name described the opposite of the behaviour and four pages disagreed about what the tier does. Renamed by the September 2026 documentation audit: the tier is named for what it does, which is add the task. "Auto-complete" is confirmable rather than blocking because it is also correct English for a different mechanism in the same module — FR-TK-10 reassesses existing tasks and genuinely marks them complete, and "auto-completed tasks" there is right. The tier name and the completion action are two concepts that happen to share a word; only the first is this entry. |
| The citation resolution subsystem | **Citation engine** | — | "auto-citation engine", "auto-citation", "automatic citation engine" | Resolves academic identifiers — DOIs, arXiv IDs, PMIDs, ISBNs — against external bibliographic sources and returns structured metadata. Consistent with the FR-CI module. "Auto-" was dropped in 0.3: the engine does not generate citations, it retrieves and validates them, and the prefix implied an automation the subsystem does not perform. Three forms were in circulation before the term was locked. |
| The bibliography display and management surface | **Bibliography manager** | — | "citation manager" | Established in SRS module naming. "Reference manager" is also the product category occupied by Zotero and Mendeley; naming a competitor category is not a vocabulary breach. |
| An individual reference entry in the bibliography | **Citation** | — | "reference entry" | Standard academic term; consistent with the FR-CI module. |
| The formatted list of all citations | **Bibliography** | — | — | Standard academic term. Note that "Works Cited" and "Reference list" remain correct when naming the style-specific output of MLA and APA respectively. |
| An inline block of typeset mathematical content | **LaTeX block** | — | "math block" | Consistent with the FR-LX module. "Equation block" is also a document structure term, used when describing exported output and numbering rather than the editor feature. |
| An inline block diagram | **Mermaid diagram** | `diagram block` | "chart block", "flowchart block" | Consistent with the FR-MD module. |
| The public endpoint for record verification | **verify.ekdoti.co** | — | "the verification portal", "the verify portal" | Always lowercase; no "the" or "portal" prefix. "The verifier" was removed as a variant: it names the person performing verification, not the endpoint. |
| The free individual plan | **Student Plan** | — | "free plan", "basic plan" | Established in the SRS and product documentation. "Free tier" is also the general term for competitor pricing, which the market analysis has to use. |
| The paid individual plan | **Individual Pro** | — | "pro plan", "premium plan", "paid tier" | Established in the SRS and product documentation. |
| The institutional plan with supervisor access | **Team Plan** | — | "institutional plan", "enterprise plan", "faculty plan" | Established in the SRS and product documentation. |
| A user on the Team Plan with supervisor access rights | **Supervisor** | — | — | Used in the SRS. Not "faculty" (too specific to one context) and not "reviewer" (too generic). "Advisor" is not a synonym here: in Ekdotico it names the Prose Refine writing advisor. "Faculty dashboard" is the established surface name and is unaffected. "Reviewer" is also one of the four document permission roles in FR-ED and is used generically for a person reading a record, so it is confirmable rather than blocking. "Instructor" is also used generically when enumerating who might verify a record, so it is confirmable rather than blocking. |
| Edits not yet saved to the server | **Unsaved changes** | — | "dirty state", "unsaved work" | Standard UI term; unambiguous. "Pending changes" also describes queued synchronisation state in the planning canvas, which is a different concept from the unsaved-changes indicator. |
| The action of producing a file from the document | **Export** | — | "save as", "generate file" | Standard term. Verb and noun. |
| Creating a new document | **New document** | — | "create document", "add document" | Functional label; matches the action button label. |

<!-- generated:vocabulary end -->

### 7.5 Process for adding new terms

When a contributor introduces a concept that requires a canonical term, the following process applies:

1. The contributor proposes the term in a pull request comment or issue with a one-sentence rationale.
2. The core team reviews the proposal against four criteria:
   - The term is unambiguous in the Ekdotico product context.
   - The term does not overlap with any existing defined term.
   - The term complies with the applicable register rule (functional terms: maximum three words, two preferred).
   - The term is not a metaphor.
3. If approved, the term is added to `expression/vocabulary.json` with its rationale and the version in which it was introduced, and the changeset records the addition.
4. Running `pnpm build:expression` regenerates the table above and the linter's rule set together. There is no second place to update, so the agent's list and this document cannot fall out of sync.

### 7.6 Recorded gaps

Some concepts recur in Ekdotico content without a canonical term. They are recorded under `gaps` in `expression/vocabulary.json` rather than left implicit. A gap is not a violation: the content is not at fault, the guidelines are incomplete. Gaps route to the process in §7.5, and the linter does not flag them.

---

## 8. Prohibited terms

Every prohibition carries the reason it exists and the correct replacement. A rule that says a term is prohibited without saying what to use instead is an incomplete error message, which is itself a System Feedback register violation.

Prohibitions are scoped. A rule that applies only to the provenance/institutional register is never applied to marketing copy.

<!-- generated:prohibited start — edit expression/prohibited.json, then run pnpm build:expression -->

_33 rules. Generated from `expression/prohibited.json`._

### 8.1 Blocking

A blocking violation contradicts a locked decision. It is never shipped without a recorded override.

| Term or pattern | Applies in | Reason | Use instead |
|---|---|---|---|
| "humanize" · "humanise" · "humanized" · "humanised" · "humanizing" · "humanising" | All registers | Founder decision. Implies AI-generated content is the default state of the text. | Prose Refine, or /refine for the slash command form. |
| "Ekdotiko" · "Ekdotiko's" · "ekdotiko" | All registers | Superseded spelling of the product name. | Ekdotico |
| "special needs" | All registers | Deficit framing, and perceived as patronising by many autistic people (Bottema-Beutel et al., 2021). | Describe the specific relevant need. |
| "Are you sure?" | All registers | Provides no information about consequences. Violates System Feedback rule 6. | A warning that describes the specific, factual consequence, using the confirmation dialog formula. |
| "Oops" · "Uh oh" · "Hmm" · "Whoops" | System Feedback | Trivialises errors and is inconsistent with a measured, precise tone. | A plain-language description of what happened. |
| "assistive" | All registers | The assistive-by-design principle (P5) is internal only and is never named in the product. | Describe the specific feature or capability. |
| "Don't forget to" · "Do not forget to" · "Remember to" | All registers | Controlling language. Implies surveillance of the user's omissions. | State the action directly, for example "Save before closing". |
| "You need to" · "You must" · "You have to" · "You should" | All registers | Controlling language that undermines autonomy (Deci & Ryan, 1985, 2000). Legally required compliance contexts are the sole exception and must be recorded as an override. | State the consequence, for example "Saving is required before exporting". |
| "We've noticed" · "We have noticed" · "We can see" · "We detected" · "We've detected" | All registers | Surveillance framing. Violates principle P3. | Describe the state directly, for example "This document has unsaved changes". |
| "Please wait" | All registers | Impatience framing. Implies the user is an inconvenience. | An action description, for example "Creating provenance record...". |
| "Something went wrong" · "An error occurred" · "Unknown error" | System Feedback | Provides no information about what failed. | A specific description of what could not complete, followed by what to do next. |
| "Great!" · "Excellent!" · "Well done!" · "Perfect!" · "Nice work!" · "Awesome!" | System Feedback | Praise in system feedback. Controlling positive feedback undermines intrinsic motivation (Ryan, 1982). | Describe the completed action, for example "Document sealed. Provenance record created.". |
| "Almost there" · "Almost done" · "Nearly there" | All registers | Inaccurate unless the system knows the completion percentage. | An action description with factual time context. |
| "Your session is about to expire" · "Session expiring" | All registers | Urgency without basis. | "For security, sessions end after [duration of inactivity]. Your work is saved." |
| "Writing fluency" · "writing quality score" · "effort score" · "engagement score" | All registers | Inferences from process data presented as facts. Violates provenance/institutional rule 7. | Report the underlying data, for example "Production rate: [value] words per hour of active time". |
| "consistent with human composition" · "consistent with human writing" | All registers | Comparative inference, not a factual statement. Violates provenance/institutional rule 11. | Report the underlying data without the comparison. |
| "proves you wrote" · "proves authorship" · "proof of authorship" · "indicates authentic authorship" | All registers | A claim the provenance record cannot make. The record documents process, not authorship intent. | "Documents your writing sessions, revision history, and AI tool usage". |
| "powerful" · "robust" · "best-in-class" · "world-class" · "cutting-edge" · "state-of-the-art" · "revolutionary" · "seamless" | All registers | Unsubstantiated superlatives. | Describe the specific capability and its limits. |
| "intuitive" · "easy to use" · "user-friendly" · "effortless" · "no learning curve" | All registers | Unverifiable claims. Also implies that users who struggle are at fault. | Describe what the feature does and what it requires of the user. |
| `1F300-1FAFF` · `2600-27BF` · `2B00-2BFF` · `FE0F` · `1F000-1F02F` | All registers | No emoji anywhere in the product or its documentation. | Remove it. Where a status marker is needed, use a Badge. |

### 8.2 Substantive

A substantive violation applies the wrong register or breaks a register rule. Several need a human read, because the same word is correct in one sense and prohibited in another.

| Term or pattern | Applies in | Reason | Use instead |
|---|---|---|---|
| "AI-generated" | All registers | Prohibited where applied to student work as an accusation or characterisation. Inconsistent with Ekdotico's position that AI-assisted writing is a process to disclose, not a charge. Acceptable when describing generated output in a neutral technical context, so this needs a human read. _Needs human confirmation._ | AI-assisted, with disclosure context. |
| "simply" · "just" · "easily" · "quickly" · "merely" | Instructional, System Feedback, Functional, Marketing / Awareness | Condescending. Implies the user is failing if they find it difficult. W3C COGA (2021) guidance. _Needs human confirmation._ | Remove the modifier. The instruction is clear without it. |
| "obviously" · "of course" · "as you know" · "needless to say" | All registers | Implies prior knowledge and can make the user feel inadequate. | Remove it and provide the information directly. |
| "normal" | All registers | Prohibited as a baseline for writing behaviour. Non-deficit framing violation; implies abnormality. Permitted in unrelated technical senses such as "normal form" or CSS "normal". _Needs human confirmation._ | "Typical" with a specific description, or remove the comparison. |
| "Click here" · "Click this" · "Tap here" | Instructional | Provides no orientation and does not help the user predict the outcome of an action. Also a link-text accessibility failure. | Describe the action and its result, for example "Selecting a passage activates Prose Refine in the right panel". |
| `\bMake (private\|public\|shared\|visible\|hidden)\b` | Functional | Toggles label the current state, not the action that would change it. Functional rule 11. | Label the current state, for example "Private". |
| `\b(you\|your\|you're\|yours)\b` | Provenance / Institutional | The record is a formal document and does not address the student directly. Provenance/institutional rule 13. _Needs human confirmation._ | Third person or a passive construction, for example "14 sessions were recorded". |
| "we think" · "it appears" · "it seems" · "probably" · "likely indicates" | Provenance / Institutional | The record is strictly factual; hedging undermines its defensibility in integrity proceedings. | State the fact, or omit the claim. |
| "Coming soon" · "Beta" · "Early access" | Marketing / Awareness | Pre-launch status is named explicitly, not softened, deferred, or implied. "Coming soon" is indefinite, "Beta" implies a maturity level not yet defined, and "Early access" implies exclusivity pricing. | "Ekdotico is in pre-launch development." |

### 8.3 Minor

Typographic. Mechanically detectable, and the highest false-positive rate of the three — review rather than auto-fix.

| Term or pattern | Applies in | Reason | Use instead |
|---|---|---|---|
| `[a-z0-9)\]"']!` | All registers | No exclamation marks in product-facing copy. | A full stop. |
| `\b\w+n't\b` · `\b(I\|you\|we\|they\|it\|he\|she\|that\|there\|here\|what\|who\|let)'(s\|re\|ve\|ll\|d\|m)\b` | All registers | No contractions in primary UI copy or formal documentation. | Expand the contraction, for example "do not" rather than "don't". |
| `(?<![\w.-])\d{1,3}-\d{1,3}(?![\w.-])` | All registers | En dash, not hyphen, for ranges. _Needs human confirmation._ | An en dash, for example "Sessions 1–5". |
| `(?<=\S) - (?=\S)` | All registers | Em dash, not hyphen, for interruption. | An em dash, for example "The record — once sealed — cannot be modified." |

<!-- generated:prohibited end -->

### 8.4 What is not mechanically checked

Several rules in this document require judgement that pattern matching cannot supply. They are recorded under `notEnforced` in `expression/prohibited.json` and they remain the responsibility of the failsafe agent (§9) and of human review. The list is deliberately explicit: a linter that implies full coverage produces false confidence, which is a worse outcome than no linter.

### 8.5 Quoted examples

This document necessarily contains every term it prohibits, always as a cited counter-example. Those citations are data, not copy, and the linter exempts them structurally — see `allowlist.contexts` in `expression/prohibited.json`. Any other document quoting a prohibited term for the same reason marks it with `<!-- eg:cite -->`.

---

## 9. Failsafe process

**Status:** Defined. Implementation specification to follow in a dedicated engineering session.

### 9.1 Mechanism

A specialised Claude Code agent, deployed as a Hook within the Cursor implementation environment. The agent fires automatically whenever a new screen or UI component containing copy is prepared. It reviews all copy in the screen against the Expression Guidelines before the screen is considered shippable.

### 9.2 Review scope

The agent reviews against all of the following:

1. **Universal rules (§4):** All copy complies with tone, typography, structure, and product integrity rules.
2. **Register identification:** The copy in each context correctly identifies and applies the appropriate register, using the diagnostic framework in §5.6.
3. **Register rules:** The copy complies with the specific rules of its identified register.
4. **Controlled vocabulary (§7):** All copy uses canonical terms for all defined concepts. Synonyms are flagged.
5. **Prohibited terms (§8):** No prohibited terms appear in any copy, in either the universally prohibited list (§8.1) or the register-specific list (§8.2).

### 9.3 Pass / fail criteria

Any violation is a blocking issue. The screen is not shippable until the violation is resolved or the core team records an explicit override with documented rationale. Overrides are tracked and reviewed; a pattern of overrides in the same category signals a rule that requires revision.

### 9.4 Contributor scope

The failsafe applies to all copy submissions. Open-source contributor pull requests that include copy changes in any surface — UI strings, documentation pages, error messages, tooltips — are subject to the same automated review as core team work. Pull requests that fail the review are returned with the specific violation identified.

### 9.5 Escalation

Violations that cannot be resolved by applying the existing rules are escalated to the core team for a rule decision. If the new situation reveals a gap in the guidelines, the gap is filled with a new rule and the guidelines are updated. The agent's rule set is versioned in sync with the Expression Guidelines version.

---

## 10. Future scope — extended product line

**Status:** Placeholder for future product line extension.

### 10.1 Planned extension

Ekdotico's long-term product vision extends the product line to elementary through high school students. This represents a substantially different primary audience with different cognitive, developmental, and emotional needs in a writing environment.

### 10.2 Expression Guidelines extensibility

The five registers and the seven foundational principles are not age-specific and will carry forward to the extended product line. The specific rules within each register — particularly the Instructional register — will require significant revision for younger audiences. The controlled vocabulary will require a separate, age-appropriate term list. The prohibited terms list will require extension.

When the product line extension is initiated, a dedicated Expression Guidelines amendment document will be produced. The current guidelines and their amendment will be maintained as separate versioned documents.

### 10.3 Architectural constraint

The Expression Guidelines version for the primary (graduate/advanced undergraduate) audience must not be modified to accommodate younger users. The two audiences require separate specification. Any copy, component, or screen that is shared across product lines must comply with the more restrictive of the two sets of rules applicable.

---

*End of Expression Guidelines v0.4*

*Next version will include: completed controlled vocabulary additions from open-source contributor submissions (§7.5 process), completed AI output register specification (§6.2 — post-MVP), and guided depth copy rules for opt-in guidance mode (§6.3 — post-SRS amendment).*
