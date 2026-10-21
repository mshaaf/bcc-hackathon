# Track 2 finalist pictures

**CONCEPT PREVIEWS: fictional examples; neither product is implemented.** Presentation timings below describe what a finished three-day prototype should demonstrate. Exactly two generalist engineers; October 21–23 build.

## THE ROOM

**Promise and person.** A Black pregnant or postpartum person and their chosen supporter practice one communication move, then leave with a visit card in the patient's own words.

**Picture the main screen.** Three spacious panels. Left: “What do you want heard?” and the selected goal/supporter role. Center: one neutral prompt, response box, and **Pause / Try that again / Continue**. Right: **My visit card**, showing confirmed words and choices, plus expandable sources. No clinician avatar, risk colors, performance score, or clinical interpretation.

**Three meaningful states.**

1. **Set the room:** choose “Clarify the next step,” “Finish my point,” or “Ask for a plain-language explanation.” Choose self/supporter, comfortable pace, or skip practice.
2. **Practice and retry:** fixed neutral prompt: “Before the conversation ends, what would you like clarified?” The user responds, pauses, and chooses their preferred wording. A supporter can select “Help me finish my question”; the patient's goal stays visible.
3. **Take it with you:** review/edit the card, mark one question still unanswered, and print/download. Practice can be skipped without losing the useful card.

**Safe fictional preview content.** Name: Maya [fictional]. Appointment: Routine prenatal visit, October 28. Goal: Clarify the next step. Original words: “I want to leave knowing what happens next.” Chosen question: “Can we write down who I contact and by when?” Supporter role: “Help me ask; let me answer.” Clinical next step: **Not recorded—ask your real care team.**

**Three-minute presentation.** Opening **30s:** “The hardest sentence is sometimes the one we never get to say. Here, the patient chooses the goal.” Invite the judge to pick one of the three goal cards using Maya's fictional scenario. Live **90s:** respond to two actual prompts; judge chooses retry or clarification; switch to supporter mode; show the preserved original wording and export the completed visit card. Technical proof **40s:** show the short deterministic scenario tree and a source card; demonstrate that the tool offers no medical answer, and that an unanswered question stays unanswered in the export. Close **20s:** “Practice is optional. The artifact is yours: your question, your words, your chosen support.”

**Useful output:** one-page patient agenda and supporter agreement, not a simulated care plan.

**Honest distinction:** [Tender Health](https://www.tenderhealth.ca/practice-room) already advertises patient appointment rehearsal; [Yoodli](https://support.yoodli.ai/en/articles/11565137-how-to-build-and-customize-roleplays) offers custom roleplay. Our proposed difference is patient-selected goals, supporter consent, controllable retry, and a source-backed original-language handoff. Novelty and effectiveness remain unproven.

**Main risk:** teaching people that they must perform confidence to deserve care. No accent, emotion, assertiveness, or “good patient” grading; institutional responsibility stays explicit.

**Hard cut:** two fictional routine-visit scenarios, three turns, text input, retry, role switching, local card export. Engineer A owns branching/state; B owns interface/export/accessibility. Cut unrestricted AI dialogue, avatars, clinical advice, real visit recording, accounts, live collaboration, and voice unless everything else works.

## RECLAIM

**Promise and person.** A Black kidney transplant candidate or caregiver turns scattered historical records into a source-checkable packet to ask their transplant team about an existing waiting-time review policy.

**Picture the main screen.** An evidence desk. Left: fictional lab page with highlighted lines. Center: confirmed date, specimen, reported values, and units; a timeline marks the unknown start date. Right: **Review packet**, with evidence and missing-proof rows. Header: **For discussion with your transplant team**. No eligibility badge, prediction, or years-recovered counter.

**Three meaningful states.**

1. **Inspect:** select a sample text PDF; each field opens its original line. Confirm or correct every field.
2. **See the gap:** switch to a report with a missing formula label or date. Its question remains visible; the app does not infer the missing fact.
3. **Prepare the request:** assemble the original-page index, chronological table, unresolved items, and coordinator questions; export a packet.

**Safe fictional record fields.** Jordan Ellis [fictional]; specimen DEMO-019; date June 12, 2019; reported eGFR with Black variable **23.3**; reported value without Black variable **19.2**; units mL/min/1.73m²; source Demo lab, page 1. Caption: **Illustrative numbers from HRSA's worked example; this patient and record are invented.** Current waiting-time/dialysis start: **Not supplied.** Result copy: “This reported pair may be worth discussing. Your transplant team must review the evidence.”

**Three-minute presentation.** Opening **30s:** explain that an old equation could change when waiting time began, and that a corrective policy already exists. Live **90s:** inspect the fictional pair; judge clicks a value to demand its source; confirm fields; judge opens the incomplete report; show the missing-proof row; export questions and original-page references. Technical proof **40s:** show deterministic checks around the published >20 / ≤20 comparison, required human confirmation, and a missing-field case. No new kidney-function calculation occurs. Close **20s:** “We do not award time. We help a person bring the right evidence and a precise question.”

**Useful output:** a patient-owned evidence index and transplant-team review request—not the official modification form.

**Honest distinction:** [KidneyKind](https://kidneykindapp.com/) already tracks transplant dates/labs; [KT-LLM](https://pmc.ncbi.nlm.nih.gov/articles/PMC12891658/) is policy-automation prior art. This is a narrow patient-facing organizer. [HRSA](https://www.hrsa.gov/optn/patients/resources/kidney/understanding-race-egfr) supplies the example and policy context; remaining missed eligibility is unquantified.

**Main risk:** false hope from incomplete or mistranscribed evidence. Missing information stays visible; only the transplant team determines eligibility and submits a request.

**Hard cut:** manual entry plus three text-PDF fixtures, source links, confirmation, timeline, export. Engineer A owns fields/source viewer/checks; B owns packet/interface. Cut arbitrary scanned OCR, medical calculations, EHR access, accounts, cloud medical storage, official submissions, and any time-credit estimate.
