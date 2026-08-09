# Ekdotico registers — reference for the failsafe agent

**Generated from `expression/guidelines.md` §5. Do not edit.**
**Version 0.3. Regenerate with `pnpm build:expression`.**

This file exists so the failsafe agent and human reviewers work from the same
text as the governing document, without loading the whole of it. It is
reference documentation, not a specification for an automated classifier.

The unit of classification is the copy element, not the page. A single
documentation page routinely carries Marketing/Awareness copy in its
introduction and Instructional copy in the sections beneath it. Classify each
discrete copy unit independently.

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
