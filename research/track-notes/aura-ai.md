# Track 1 through the LARP + aura lens

October 20, 2026. Two engineers; October 21–23 build; Friday-night submission. This changes the product ranking. Here, LARP means taking a consequential role with meaningful controls; aura means an immediately recognizable identity and a reveal people remember. Scores below are subjective design judgments, not official rubric weights or research findings. Existing evidence, legal corrections, competitors, and API checks remain in `track-ai.md`; no new API or competitor capability is assumed.

## New force ranking

**1. THE SWITCH / SAME PERSON (DialectLens). 2. CASEBREAKER (Second Look). 3. INCIDENT ROOM (Community AI Receipts), preferably folded into The Switch. 4. SHORTLIST UNDER PRESSURE (FairScreen Sandbox). 5. THE MISSING REASON (Denial Decoded). 6. KEEP MY WORDS (CareFacts).**

**Pick THE SWITCH.** It has the clearest one-sentence hook and judge-controlled action: “Same qualifications. Different wording. Should the machine change its story?” The judge can flip the input, challenge a claim, inspect its evidence, change the processing policy, and rerun. This becomes an instrument the judge operates, rather than a report they watch somebody explain. Casebreaker remains the stronger fallback for a guaranteed evidence reveal, but its core AI-ethics connection is less immediate.

| Original idea | Aura as originally framed / reworked potential (1–5) | Verdict | One noncosmetic interaction upgrade | Actually runs within 72 hours | Must be labeled simulation or outside scope |
|---|---|---|---|---|---|
| DialectLens | 3 / **5** | **Rework; lead** | Judge locks shared qualification facts, switches between two reviewed language versions, then presses **“Show me where”** on a model claim; unsupported claims cannot enter the confirmed summary | Two API calls, structured facts and exact source spans, paired invariant checks, one processing-policy toggle, reproducible run receipt | Candidate/application scenario is fictional; no actual employer decision, no automatic claim of racial discrimination, no fairness certificate |
| Second Look | 2 / **4** | **Rework; runner-up** | **Casebreaker:** follow a disputed case/identity link through an evidence graph; open its two source spans, confirm the correction, and replay the applicant-side report with an exact field diff | Two text PDFs, case-level matching, source-linked status contradictions, user confirmation, corrected-view export | Fictional demo records; graph is the app's comparison, not a forensic reconstruction of a vendor's hidden pipeline; employer record is not changed |
| Denial Decoded | 2 / **3** | **Drop from winning shortlist** | **The Missing Reason:** user selects a statement on the notice, reveals what it actually says versus what remains unknown, and chooses a source-backed information request; the next step changes with confirmed notice type/date | Notice extraction, evidence anchors, small rule-based branch, request preview | No lender-system access, no recovered secret explanation, no claim that AI made the decision or that the letter is automatically illegal |
| CareFacts | 2 / **3** | **Drop for this sprint** | **Keep My Words:** patient chooses the facts that must survive; a summary cannot be released until each has a supporting quote or an explicit unresolved flag | Synthetic transcript/summary comparison, omission/negation checking, confirmation gate | No clinical safety validation, diagnosis, triage, EHR action, or staged patient suffering; a demo is not proof of better health outcomes |
| Community AI Receipts | 2 / **4** | **Rework as a module, drop standalone** | **Incident Room:** judge promotes a report from observation to reproducible finding by rerunning one variable at a time; a hypothesis board separates what was observed from what remains unproven | Import own/public transcript, log model/config, rerun a supported API, save redacted evidence bundle and control results | No automatic report to AJL/regulators, no vendor takedown, no agreement from a partner; public accusations are outside the MVP |
| FairScreen Sandbox | 2 / **4** | **Rework only if hiring expertise exists; otherwise drop** | **Shortlist Under Pressure:** freeze the applicant pool and let the judge remove one irrelevant input or change the evidence-only rubric; animate rank movement with the exact input change and source facts visible | Synthetic pool, toy retrieval/ranking pipeline, fixed input toggles, rank-sensitivity trace | Entire hiring system is the team's sandbox; it reveals sensitivity in that system, not wrongdoing by a real ATS; names/zip codes are not ground-truth race |

## THE SWITCH: the version worth building

### The role and the power

The judge is a community reviewer deciding whether a proposed AI job-intake assistant is ready to be recommended. Their power is to **stop an unsupported claim from becoming somebody's record**. The software should never ask the audience to rate whose dialect sounds more employable. The object under examination is the AI's behavior.

The main view has one candidate, a fixed strip of qualification facts, a large physical-looking switch, and two output panes. Each factual claim has an evidence attachment. Clicking the attachment lights up the words supporting it. Missing support remains visibly unresolved. This is both the memorable interaction and the quality-control mechanism.

Choose one task: extract experience, availability, certifications, and requested support from a short applicant statement. Use 12–20 human-reviewed pairs with annotated shared facts. Add two useful controls: rerun the **identical** input to estimate ordinary output instability, and compare an evidence-only schema with the unconstrained baseline. A dialect difference matters less if the model also varies that much on the same input. This control is a technically substantive reveal that most simplistic “bias toggles” omit.

### Ninety seconds

1. **0–15s:** Show the person and four locked qualification facts. “Only the wording changes.” Let the judge throw the switch.
2. **15–35s:** Both calls run and claims appear. The app shows preservation of required facts and any unsupported addition. No fake score countdown or predetermined failure.
3. **35–55s:** Judge selects a claim and hits **Show me where**. Its supporting words illuminate, or the absence of support is exposed. Explain the consequence through one concrete missing qualification rather than an abstract fairness number.
4. **55–75s:** Judge turns on evidence-only extraction and reruns. Show the actual result; do not promise improvement. Confirmed facts become the applicant-controlled record.
5. **75–90s:** Expand the receipt: exact inputs, model/config, repeated-input control, paired result, and limits. “You can reproduce this test. You can challenge the record.”

### An honest no-bias result still needs to work

If both versions preserve the facts, show **“This pair passed.”** Passing is a real output, not a failed demo. A known development failure can be replayed with conspicuous date/model/replay labeling. If no real failure is found, an explicitly labeled test mutation can demonstrate that the checker detects a missing fact; it cannot be attributed to a vendor. Do not build a theatrical verdict that requires the machine to fail every time.

**Kill gate:** by the end of build-day one, the team should have a repeatable, documented technical finding—meaning loss, unsupported inference, or a meaningful instability difference—on reviewed fixtures. If it does not, choose Casebreaker, where a source contradiction provides an honest, dependable reveal. Do not spend the remaining sprint fishing for an inflammatory model response.

### What makes the product distinctive, and what does not

Research probing code, Promptfoo, and Giskard already cover bias testing. The distinction is an **affected-person-readable test with locked meaning, ordinary-variance controls, evidence challenges, and a human release gate**. A giant switch alone is styling. A switch that produces a controlled, inspectable experiment is a product interaction.

For cultural identity, use the language of a community-run evidence studio: warm paper, strong editorial typography, a confident accent color, and one tactile instrument. Let original speaker wording remain prominent. Avoid mugshots, police-surveillance theater, caricatured voices, race/skin-tone sliders, “good/bad person” lights, or rewarding spectators for catching racism. The memorable moment should be somebody gaining the ability to demand evidence.

### Two-engineer cut

Engineer A: fixtures, shared facts, two model adapters, repeated-input controls, exact-span verification, run manifests. Engineer B: switch and evidence interaction, source highlighting, human confirmation, receipt export, accessible keyboard flow. Day one proves the experiment. Day two builds the instrument. Day three makes it reliable, validates labels, records a transparent fallback, and submits. Cut audio, avatars, voice imitation, custom model training, arbitrary endpoint onboarding, accounts, public report feeds, and institutional integrations.

## How the official rubric changes the choice

- **Meets Criteria:** The Switch directly examines a documented AI access/harm issue involving dialect; Casebreaker needs a more carefully explained link to automated screening harm.
- **Creativity:** The Switch's reviewed input, ordinary-variance control, and evidence challenge offer a stronger contribution than a bias score or prettier report. Community AI Receipts gets much stronger when it supplies this reproducibility workflow inside The Switch.
- **Functionality:** Casebreaker is easiest to make deterministic and reliable. The Switch must accept passes, unknowns, API failures, and noisy model responses as designed outcomes.
- **Presentation:** The Switch gives the judge one visible action and one understandable question. Casebreaker has a satisfying source-contradiction reveal. Neither should impersonate institutional power it does not possess.
