# Six finalists: the product, the pitch, and the three-day cut

Prepared October 21, 2026 for a team of two engineers. These are six alternatives; choose one to build. The accompanying interactive previews use fictional people and records. They demonstrate proposed interactions, not completed integrations or measured outcomes.

**My pick is Block Ops.** It combines a familiar problem, a distinctive group decision, accessible public data, and an output the judge can inspect. **The Switch is the higher-risk challenger:** its stage moment is stronger if an early, honest experiment establishes something worth showing. **Casebreaker is the strongest alternative if you prefer document engineering over civic data.**

The balance between generic and obscure is the same across all six: a familiar problem, one specific moment where a person needs help, and one memorable action that changes the result. We cannot guarantee that another team will not choose a related idea. We can make our execution precise enough that it has a clear identity.

## Track 1 — AI: Ethics and Access

### The Switch

**The one-sentence pitch:** Change the wording, keep the qualifications fixed, and make an AI summary show where its claims came from.

**Who uses it and why:** A workforce counselor and an applicant review a short AI-generated intake summary before other people rely on it. The applicant should be able to spot a lost certification, changed availability, or unsupported judgment. Dialect-related prejudice in language models is a documented research concern; our own test still needs evidence rather than an assumed result. [Research in Nature](https://www.nature.com/articles/s41586-024-07856-5).

**Picture the finished product:** A bold two-column experiment desk. On the left are the applicant's original words and a large wording switch. A short row shows facts both versions must preserve. On the right, each generated claim has **Show me where**. Clicking it reveals the exact supporting words. The applicant reviews the final summary before releasing it.

**The presentation:** “Same person. Same qualifications. What survives the summary?” A judge flips between reviewed wording versions, challenges one claim, and checks the source. We then show the applicant-approved summary and a receipt containing the exact inputs, outputs, model configuration, and repeated-input controls. If both versions pass, we say so. The current preview deliberately reverses one availability fact to demonstrate the checker; it is labeled as a controlled mutation, not a real model failure.

**What somebody takes away:** A source-linked summary they approved and a reproducible test receipt.

**The three-day version:** One intake task; 12–20 human-reviewed, meaning-matched text pairs; one fixed model; identical-input reruns; exact source checks; one review screen; export. Engineer A owns experiments and verification; B owns the interaction and receipt.

**Why it could win:** The judge operates an experiment and can demand evidence. The technical work is visible. Academic probing tools and products such as [Promptfoo](https://www.promptfoo.dev/docs/red-team/plugins/race-bias/) already test bias; our proposed distinction is the applicant-facing evidence challenge and approval step.

**The decision gate:** Prove a worthwhile, repeatable experiment early on day one. Do not commit the whole build to finding a dramatic failure later. A small test cannot establish model-wide fairness or discrimination, and the preview wording pair is not a validated dialect benchmark.

### Casebreaker

**The one-sentence pitch:** Follow a disputed background-report entry to its source and prepare a precise correction request.

**Who uses it and why:** An applicant working alone or with a workforce navigator has a screening report and a source document that disagree. The task is to make the discrepancy understandable and reviewable. The [FTC explains applicants' background-check rights and dispute routes](https://consumer.ftc.gov/articles/employer-background-checks-and-your-rights).

**Picture the finished product:** An evidence desk with a small connection map: applicant → screening entry → case identifier → source disposition. Two document excerpts sit beside each other. Matching identifiers, court names, dates, and the conflicting status are easy to inspect. An unresolved match stays unresolved.

**The presentation:** “One case. Two stories.” A fictional screening report says **Pending**; a supplied later disposition says **Dismissed**, dated before the report. The judge follows the connection, checks both pages, and confirms the factual disagreement. A second example with only a matching name demonstrates why the system refuses to merge uncertain records. The final click produces the reviewed packet.

**What somebody takes away:** A source comparison, original-page references, and a draft request asking the reporting company to investigate the discrepancy.

**The three-day version:** Two text-bearing PDFs; identifier/court/date/status extraction; source highlights; conservative comparison; human confirmation; print/export. Engineer A owns extraction and matching; B owns the evidence viewer and packet. Use labeled fictional cases, including clean and ambiguous examples, to check incorrect joins and invented quotations.

**Why it could win:** The reveal is concrete and the final output is useful. Its identity is tracing a specific report claim to supplied evidence. Its Track 1 pitch must clearly explain how this supports people affected by automated screening; otherwise it may read as general document software.

**The main risk:** A document comparison does not establish legal truth. The product prepares a request; it does not clear a record or modify an employer's system.

## Track 2 — Modern Healthcare Outcomes

### The Room

**The one-sentence pitch:** Practice the question you want heard at a healthcare visit, then take your own words into the room.

**Who uses it and why:** A Black pregnant or postpartum patient, optionally with a chosen supporter, prepares for a routine visit. The narrow problem is communicating a concern or asking what happens next. The patient controls whether to practice and which words to keep.

**Picture the finished product:** A calm three-part screen. Left: choose **Clarify the next step**, **Finish my point**, or **Ask for plain language**, and decide how a supporter may help. Center: one short practice prompt, a response, and retry. Right: a visit card that preserves the original concern and the patient's chosen question.

**The presentation:** “I want to leave knowing what happens next.” The judge chooses the fictional patient's goal. One engineer plays the patient, tries a question, then retries or switches into the agreed supporter role. The card updates with the preferred words and **Help me ask; let me answer**. An unanswered clinical question stays unanswered.

**What somebody takes away:** A one-page visit agenda: original concern, chosen question, and supporter agreement.

**The three-day version:** Two short fictional scenarios, three communication goals, a small deterministic conversation tree, text input, retry, supporter choice, and print/export. Engineer A owns the branching and saved wording; B owns the interface and card.

**Why it could win:** It creates an immediate human scene. The judge can feel the difference between arriving with a vague concern and leaving with a question they chose. However, roleplay products already exist—[Yoodli supports custom scenarios](https://support.yoodli.ai/en/articles/11565137-how-to-build-and-customize-roleplays)—so supporter consent and preserving the patient's words need to be central.

**The main risk:** It can feel like a communication coach with a healthcare theme. We need community feedback to establish usefulness. It should never grade a patient on accent, confidence, or whether they performed a “good patient” role, and it should not generate medical answers.

### Reclaim

**The one-sentence pitch:** Turn old kidney records into a clear evidence packet for a transplant waiting-time review conversation.

**Who uses it and why:** A Black kidney transplant candidate or caregiver has historical lab pages from multiple providers. An existing policy addresses waiting time affected by race-inclusive eGFR calculations. The app helps organize the original evidence and unanswered questions for the transplant team. [HRSA's patient explanation](https://www.hrsa.gov/optn/patients/resources/kidney/understanding-race-egfr).

**Picture the finished product:** A source viewer with highlighted lab fields, confirmed dates and specimen information, and a packet panel. Selecting a value points to its original line. A second report with a missing date makes the missing evidence visible. The screen never displays an eligibility award or a years-recovered counter.

**The presentation:** “An old record may matter today.” The judge opens a fictional historical page, inspects the reported **23.3 / 19.2** pair, and checks its source fields. Those illustrative numbers come from HRSA's worked example; the person and record are invented. The judge switches to the undated page and sees the unresolved question appear in the packet.

**What somebody takes away:** An original-page index, a chronological evidence table, missing-record questions, and a draft request for transplant-team review.

**The three-day version:** Manual entry plus three text-PDF examples; source highlights; confirmation; missing-field states; timeline; export. Engineer A owns source fields and checks; B owns the packet and interface. The build compares reported historical values; it does not calculate kidney function.

**Why it could win:** The problem is specific, consequential, and tied to a real remedy. The output has a clear recipient. Prior work exists, including [KT-LLM](https://pmc.ncbi.nlm.nih.gov/articles/PMC12891658/); the proposed angle is a patient-facing evidence organizer.

**The main risk:** The policy takes longer to explain than the other ideas, and we have not established how much unmet demand remains. A coordinator's feedback would be especially valuable. Eligibility and any official request remain with the transplant program; no waiting-time credit is promised.

## Track 3 — Community Development

### Block Ops

**The one-sentence pitch:** Turn scattered service tickets and a neighborhood's own observations into one brief and a next-step plan.

**Who uses it and why:** A neighborhood group is preparing for a meeting about a recurring concern. It has ticket numbers, different dates, and questions about what happened. The group needs a checked history and a specific request it agrees on.

**Picture the finished product:** A civic worktable. Left: dated public records and a timeline. Right: the group's observation, chosen request, and two practical tasks. The app suggests candidate records for review; the group decides which belong together. Official ticket status stays separate from what residents actually observed.

**The presentation:** “We have several ticket numbers and a meeting tomorrow. Help us make the history clear.” The judge becomes records keeper, spots a report from another site, and removes it. The timeline and source appendix change. The group selects its request and previews a one-page brief with its plan. A separate real cached public record demonstrates that dates and statuses are preserved.

**What somebody takes away:** A reviewed history, attributed observation, concrete request, two role-based tasks, and source references.

**The three-day version:** One ward, one request category, a dated public-data snapshot, candidate grouping with human review, one observation, two tasks, and print/export. Engineer A owns data and grouping; B owns the worktable and brief. The earlier research verified access to the [official DC service-request source](https://maps2.dcgis.dc.gov/dcgis/rest/services/DCGIS_DATA/ServiceRequests/FeatureServer/21).

**Why it could win:** It has the clearest combination of participation, credible engineering, local relevance, and a useful finish. The distinctive part must be collective review and a chosen next action. [DC's To-Do List](https://viridicity.github.io/dc311/) already demonstrates the dashboard approach, so a map alone would be weak differentiation.

**The main risk:** Nearby reports may describe different incidents, and a closed ticket does not prove either remediation or failure. Keep those distinctions in the data model and the story. The prototype prepares a plan; it does not claim the city responded or the neighborhood issue was resolved.

### People's Chamber

**The one-sentence pitch:** Rehearse your public testimony, sharpen your request, and leave with a statement in your own words.

**Who uses it and why:** A resident wants to speak about a community issue but needs help connecting personal experience to a specific public request and the right hearing context.

**Picture the finished product:** A small practice chamber: source context on the left, a large **Take the floor** area in the center, and a timer with a practice chair's question on the right. The resident writes **My experience** and **My request**. One focused question prompts a revision, which appears in the final statement.

**The presentation:** One judge plays chair, one engineer plays the resident. The resident starts a timed rehearsal. The chair asks, “What specific action are you asking for?” The resident revises a vague ask into a concrete one. The finished statement visibly reflects that change. The preview uses a fictional notice; the real build should use one clearly dated official source. [DC Council's testimony guidance](https://dccouncil.gov/how-to-testify-before-the-council/).

**What somebody takes away:** An editable statement, rehearsal notes, cited hearing context, and a handoff to the official submission process.

**The three-day version:** One official notice, a structured testimony form, a two-minute rehearsal timer, fixed human-chair prompts, revision, and print/export. Engineer A owns source context and state; B owns the chamber and output. Voice transcription is optional after the text flow works.

**Why it could win:** It is the easiest concept to stage as a memorable live scene. The judge's question improves a real output. Its distinction needs to be source-backed preparation and preserving the resident's voice, since generic speech practice is already available.

**The main risk:** Theatre can outrun the engineering. The revised statement, source citations, and export must work. The product is practice; it should never impersonate an official hearing or suggest testimony was submitted.

## What our actual presentation should look like

Use the same simple spine for whichever idea we choose. This is a proposed three-minute format, not a confirmed event time limit.

1. **30 seconds: a person and a specific problem.** One sentence explains who needs help. Show the messy starting point.
2. **90 seconds: the judge makes a consequential choice.** One engineer narrates; the other operates the product. The choice changes the actual result.
3. **40 seconds: show why the result is trustworthy.** Open a source, demonstrate one uncertain or rejected case, and inspect the finished output.
4. **20 seconds: leave the judge with the useful thing.** Show the brief, summary, statement, or packet. State the next validation step plainly.

Use three sparse slides: **the problem → the live decision → the finished result**. Spend the middle of the pitch inside the functioning product. A local, clearly labeled replay can back up an external dependency; the successful live interaction should remain the main event.

## The choice tonight

**Choose Block Ops if we want the strongest overall bet.** Keep its ambition focused on a group reviewing evidence and choosing its next move. The polish should make that moment feel like a neighborhood taking control of its preparation.

**Choose The Switch if the experiment is what excites us most—and we can prove it early.** It has the strongest AI-specific hook, with more uncertainty around the result.

**Choose Casebreaker if we want a concrete reveal and a strong document-processing build.** The status disagreement is easy to explain and the packet is easy to inspect.

The Room and People's Chamber offer the strongest live roleplay. Reclaim offers the most specific policy-based story. They remain credible finalists, with the validation and explanation burdens described above.

For any choice: day one proves the entire input → decision → output path; day two makes source inspection and revision reliable; day three is for edge cases, polish, rehearsal, and submission. The [event page](https://bcc-hacktoberfest.devpost.com/) should remain the source of truth for the submission clock and judging rules.
