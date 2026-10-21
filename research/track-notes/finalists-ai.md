# Track 1 finalists: THE SWITCH and CASEBREAKER

Concept/presentation specification only, October 20, 2026. No application or backend has been built. All people, documents, and sample outputs below are fictional or illustrative. Any preview containing an AI-style result must visibly say **“Illustrative output — not a measured model finding.”** No fairness scores or invented performance metrics.

The three-minute presentation structures below are planning assumptions, **not a published event requirement**. They describe what to present after the corresponding features work and the checks have actually run.

## 1. THE SWITCH

**Actual product promise:** Test whether an AI intake assistant preserves the same qualifications when somebody's wording changes, and require evidence for every claim it puts into their summary.

**Primary user:** A facilitator at a Black-serving workforce program or library choosing an AI job-intake tool; the applicant reviews the resulting summary. The subject of the test is the AI's behavior, never whether a person's dialect sounds employable.

**The product picture:** A community-run evidence studio. Warm paper background, oversized editorial title, one saturated accent color, original speaker wording given as much visual weight as the machine output. The central control resembles a substantial physical switch. No avatars, race sliders, mugshots, or police-control-room styling.

### Main-screen layout

- **Header:** THE SWITCH. Below: **“Same person. Same qualifications. What changed?”** Right corner: run mode (“Preview specimen,” “Live run,” or “Recorded run”) and model/config access.
- **Fixed fact strip:** Jordan Ellis / Shift lead / 3 years / Trained 5 people / Weekends available / Tuesday evenings unavailable / CPR current. This is the user-confirmed comparison contract, not a model score.
- **Left and middle:** Two equally sized wording panels, labeled A and B, with a large **Switch wording** control between them. Show the text in full; neither is labeled better or correct.
- **Right:** The summary's individual claims as cards. Each has **Show me where** and a state: Supported, Contradicts source, or Needs review. State uses text and shape as well as color.
- **Lower drawer:** Required facts, repeated-identical-input control, processing policy (“Free-form summary” / “Evidence-only fields”), run manifest, and **Download test receipt**. The applicant-approved summary has a separate **Confirm summary** action.

### Three meaningful screens/states

1. **LOCK THE MEANING:** Both inputs and the shared fact contract are visible. User confirms equivalence before testing. Primary action: **Lock facts and run both**. If they disagree on meaning, the case cannot be treated as a matched test.
2. **CHALLENGE THE CLAIM:** Outputs appear as inspectable claims. Judge taps a claim and **Show me where**; its source words light up or the claim remains unresolved. Primary action: **Use evidence-only fields and rerun**. A passing pair explicitly shows **“This pair preserved the required facts.”**
3. **RELEASE A RECORD YOU CAN DEFEND:** Applicant accepts or edits supported facts; unresolved content cannot silently join the confirmed summary. Primary actions: **Confirm summary** and **Download test receipt**. Receipt includes exact inputs, output, source references, model/config, timestamp, and test limits.

### Exact fictional preview specimen

**Person:** Jordan Ellis. **Purpose:** Workforce-intake demonstration. **No real hiring decision.**

**Wording A:** “Three years running closing shifts. Trained five new folks. Weekends work for me; Tuesday nights don't. My CPR card's current.”

**Wording B:** “I have managed closing shifts for three years and trained five new employees. I am available on weekends, but not on Tuesday evenings. My CPR certification is current.”

This is a simple wording specimen for the visual concept. **It is not a validated AAE benchmark.** A build claiming dialect coverage needs reviewed, meaning-matched examples; do not invent stereotyped dialect text for screenshots.

**Illustrative supported card:** “Three years managing closing shifts.” Button: **Show me where**. Source highlight: “Three years running closing shifts.”

**Illustrative checker-test card:** “Available Tuesday evenings.” Label: **“Controlled test mutation — not a model finding.”** State: **Contradicts source.** Source highlight: “Tuesday nights don't.” Subcopy: **“This sample deliberately changes one fact so you can see how the check behaves.”**

**Empty/live-ready state:** “No run yet. Lock the shared facts, then test both versions.” Never populate a preview with a vendor name next to a fabricated failure.

### Planned three-minute presentation

**Opening — 0:00–0:30**

“If an AI helps record your qualifications, its summary can travel farther than your original words. A missing certification or changed availability can become the version another person sees. THE SWITCH gives workforce staff and applicants a simple power: change the wording, keep the facts fixed, and ask the machine to show its evidence.”

**Live demo — 0:30–2:00**

“This is Jordan, a fictional applicant. Here are the facts we've agreed both versions contain. Judge, throw the switch. Now we run both versions through the same intake task. You can select any claim and press ‘Show me where.’ The original words appear beside it. If the source doesn't support a claim, it needs review before it enters Jordan's confirmed summary.

“Next, choose evidence-only fields and rerun. We inspect what actually happens; the software doesn't assume this setting will fix everything. Jordan can accept the supported facts and download a summary with a reproducible test receipt.”

**Live-result branch:** If the pair passes: “This pair passed. That is useful evidence about this test, not a certificate that the model is fair.” If a real failure appears, name the exact lost/changed fact. A recorded example must display its date and replay label. A deliberate checker-test mutation must be introduced explicitly as such.

**Technical proof — 2:00–2:40**

“The check begins with human-reviewed shared facts. Model-generated quotes have to exist in the original source. We also rerun identical input, because ordinary model instability can look like a wording effect. The receipt preserves the inputs, configuration, outputs, and controls so somebody else can reproduce the result. We measure concrete fact preservation and contradictions on labeled examples. We aren't guessing somebody's race or issuing a fairness score.”

**Closing — 2:40–3:00**

“The useful outcome is a record the applicant can inspect and approve. Our contribution is an evidence challenge and a human release gate around an AI summary. Before a machine's version of your story travels, you should be able to ask: show me where.”

**Judge action:** Throw the switch, choose a claim, demand its source, and optionally change the processing policy.

**Final usable output:** A candidate-confirmed fact summary plus downloadable HTML/JSON test receipt. A library or workforce facilitator can reproduce the test before recommending that configuration.

**Honest differentiation:** Academic probing code, Promptfoo, and Giskard already test bias. The distinctive product experience is shared meaning locked by a human, ordinary-instability controls, source challenges, and an applicant-readable release gate. This does not establish model-wide fairness or institutional discrimination.

**Biggest risk:** In three days, the team may fail to find a repeatable meaningful issue on valid reviewed pairs. A passing experiment is honest but may produce a quieter presentation. Do not fish for inflammatory responses or fake a reveal.

**Hard two-engineer/three-day cut:** One intake task, 12–20 reviewed paired text fixtures, one provider and one fixed model initially, baseline versus evidence-only processing, repeated-input control, exact source verification, one page of claim review, and HTML/JSON export. A second fixed model is optional only after the core works. No audio, generated dialect impersonation, custom training, arbitrary endpoint onboarding, real ATS, accounts, or public incident feed. Day one proves the experiment; day two builds the interaction; day three validates and prepares the demo/submission.

## 2. CASEBREAKER

**Actual product promise:** Compare a background-screening report with a source document, show the exact facts that disagree, and help the applicant prepare an evidence-backed correction request.

**Primary user:** A job applicant, especially someone working with a Black-serving workforce or returning-citizen navigator, who needs to challenge an inaccurate report. The product never assumes that a Black applicant has a criminal record.

**The product picture:** A civic evidence desk with an interactive case map. Paper-like documents, bold file tabs, and one connected thread that the user follows to a source. The satisfaction comes from turning an opaque entry into a source-backed, reviewable discrepancy. No detective cosplay aimed at the applicant, “guilty/innocent” light, or promise of clearing a record.

### Main-screen layout

- **Header:** CASEBREAKER. Below: **“A report is a claim. Follow it to the source.”** Always show **Fictional demonstration case** on the preview.
- **Left rail:** Applicant card, supplied documents, and a short timeline. Documents have their own date and page count.
- **Center:** Compact evidence map: Applicant → Screening entry → Case identifier → Source disposition. Selecting a link opens the two fields being compared. This is the app's comparison map, not a claimed reconstruction of the vendor's secret process.
- **Right:** Two source excerpts stacked, with case number, court, status, and date highlighted. Beneath: **What disagrees**, **What matches**, and **What still needs review**.
- **Bottom review tray:** Proposed correction with the applicant's checkbox: **“I reviewed the source and want to include this discrepancy.”** Actions: **Confirm discrepancy** and **Preview correction packet**.

### Three meaningful screens/states

1. **OPEN THE FILE:** Upload a text-bearing report and disposition or load the fictional example. State: **“Two documents loaded. No conclusion yet.”** Extracted fields remain editable suggestions until source-linked verification.
2. **FOLLOW THE CONNECTION:** Click the screening entry. The same case identifier and court connect its “Pending” status to a later “Dismissed” disposition. Show exact pages and dates. For mismatched or absent identifiers, use **“Needs manual review”**, not a forced join.
3. **MAKE A PRECISE REQUEST:** Applicant confirms one discrepancy. Show a printable comparison packet with original excerpts, the confirmed factual difference, supporting-document list, a reviewed draft request, and official next-step links. State: **“Correction packet ready for your review.”**

### Exact fictional preview specimen

Use deliberately fictional institutional names and identifiers; do not impersonate a real court document.

**Applicant:** Jordan Ellis. **Applicant reference:** DEMO-JE-01. **Applicant-entered birth year:** 1993.

**Screening report:** “Northstar Demo Screening — fictional sample.” Report date: **October 12, 2026**. Subject: Jordan Ellis. Court: **Training Court — fictional jurisdiction**. Case identifier: **DEMO-2024-017**. Listed status: **Pending**. Citation in the app: **Screening report, page 1**.

**Source disposition:** “Training Court — fictional demonstration document.” Case identifier: **DEMO-2024-017**. Disposition: **Dismissed**. Disposition date: **October 3, 2026**. Citation: **Source disposition, page 1**.

**Discrepancy copy:** **“The supplied documents list different statuses for the same case identifier and court.”** Fields: Report says **Pending** / Source says **Dismissed**. Note: **“Review this source disagreement before requesting a correction.”** Do not say the report is automatically illegal, that dismissal establishes innocence, or that the record must disappear.

**Illustrative extraction label:** **“Illustrative field suggestions — not measured extraction results.”** This label applies to all preview fields attributed to an AI extractor.

**Optional ambiguity specimen:** A second sample entry says Jordan Ellis, birth year 1984, without a matching case identifier. Copy: **“Same name is not enough to connect these records.”** This demonstrates abstention, not a conclusion that a real person's record belongs to somebody else.

**Reviewed draft copy:** “I am requesting review of the status reported for case DEMO-2024-017. The supplied report lists Pending. The attached source document lists Dismissed, dated October 3, 2026. Please investigate this discrepancy and advise me of the result.” Label **Draft for applicant review**; nothing is automatically sent.

### Planned three-minute presentation

**Opening — 0:00–0:30**

“A background report can turn scattered data into a story about somebody. When a status is stale or records are mismatched, the applicant faces the consequences and the paperwork. CASEBREAKER lets that person follow a disputed entry to its source and make a precise correction request with the evidence attached.”

**Live demo — 0:30–2:00**

“Jordan and both documents here are fictional. The screening report lists a case as pending. Judge, choose that entry and follow its connection. CASEBREAKER finds the same case identifier and court in this source document. The source says dismissed, dated before the report. We can see both excerpts, not just trust a generated explanation.

“Now review this same-name entry with a different birth year and no matching case identifier. We don't merge it automatically. The applicant decides what needs review. For the status disagreement, confirm the supporting source. The result is a short factual request with the excerpts and dates attached. It gives Jordan something usable to take to the reporting company or a navigator.”

**Technical proof — 2:00–2:40**

“The extractor proposes fields with source references. Our comparison uses identifiers, court, dates, and normalized status terms; a name alone isn't enough. Uncertain matches stay unresolved. We test known fictional cases for incorrect joins, missed contradictions, and invented source quotes. The export includes only discrepancies the applicant reviewed. We compare documents; we don't predict guilt, determine expungement rights, or pretend to access an employer's system.”

**Closing — 2:40–3:00**

“The useful outcome is a correction packet somebody can actually review and use. CASEBREAKER puts the applicant in control of the evidence around an automated screening record. The final click doesn't pronounce a verdict. It turns a vague problem into a precise question backed by source documents.”

**Judge action:** Choose the disputed entry, follow its connection, inspect the source, and confirm which discrepancy belongs in the packet.

**Final usable output:** A downloadable, printable source-comparison packet with a reviewed draft request and official next-step links. It prepares a request; it does not modify court, screener, or employer records.

**Honest differentiation:** Rasa already addresses record-clearance eligibility; dispute-letter products already exist. CASEBREAKER focuses on the currently blocking report and traces a factual correction to supplied source evidence. It needs no private court API or employer cooperation to demonstrate this workflow.

**Biggest risk:** Document agreement does not establish legal truth, and an LLM can extract or match fields incorrectly. Provenance, conservative matching, editable suggestions, and explicit unresolved states are essential. The racial-equity case is applicant-side access to a remedy; this MVP cannot demonstrate a reduction in racial disparities.

**Hard two-engineer/three-day cut:** Two text-bearing PDFs, one applicant-entered identity card, case number/court/date/status extraction with source spans, status-conflict and identity-ambiguity checks, a small evidence map, applicant confirmation, and HTML/print export. Twelve–twenty fictional labeled pairs, including clean and ambiguous cases. No scanned-document OCR until core works, court lookup, background-check acquisition, expungement engine, automatic sending, real employer integration, national rules engine, or accounts. Engineer A owns extraction/matching/provenance; engineer B owns source viewer/review/export. Day one proves comparison; day two completes the loop; day three tests edge cases and prepares submission.

## Which picture should lead the shortlist?

Lead with **THE SWITCH** when the desired feeling is a bold public experiment that the judge can operate. Lead with **CASEBREAKER** when the desired feeling is uncovering a concrete source contradiction and leaving with a useful artifact. Both remain finalists. The concept previews should depict their interactions and outputs without presenting illustrative cases as measured AI results or existing institutional integrations.
