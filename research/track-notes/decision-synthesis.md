# BCC Hacktoberfest: idea decision and three-day build brief

Research date: October 20, 2026, America/New_York. Team: two strong generalist engineers. Build days: October 21–23. This is a researched concept recommendation; customer demand and product outcomes have not been validated.

## The decision

**My recommendation is Reclaim: a patient-owned evidence packet for reviewing historical race-based kidney-transplant waiting-time delays. Enter Track 2.** The healthcare agent called the same concept “Backdate”; Reclaim is the working name used in this synthesis.

The precise intended user is a newly listed adult Black kidney-transplant candidate or their caregiver who has historical lab records from outside providers and wants to bring relevant original pages to the transplant team. The prototype helps organize a review; the transplant program retains responsibility for assessment, determines eligibility and submits any official request.

**BlockBrief is the strongest fallback:** a DC resident or organizer combines recurring 311 records with their own confirmation of present conditions, then produces a sourced ANC/agency follow-up packet. It is the best choice if you prefer a local civic product with public live data and fewer medical-content dependencies.

These are judgment calls about the actual rubric, not predicted winning probabilities. Reclaim has the sharper human story and more distinctive problem. BlockBrief has the easier local demonstration and lower content risk. Second Look and DialectLens are credible Track 1 alternatives, explained below.

## The actual competition changes the strategy

The published criteria are track fit, creativity, functionality/reliability and clean code, and presentation. No weights are published. The stated deliverable is a functioning website or app. This favors a small workflow that actually completes and produces something a person can use. [Official event and rubric](https://bcc-hacktoberfest.devpost.com/).

Devpost lists **October 24, 2026, 12:00 a.m. EDT** as the submission deadline. That is the beginning of Saturday: plan to submit **Friday, October 23, by 10 p.m. Eastern**. The announcement has judging Saturday, October 24, 3–5 p.m. at MLK Library, while Devpost's schedule labels 3 p.m. as the winners announcement. Treat the earlier submission deadline as the operating constraint and have the team verify the event timing with organizers. No one was contacted in this research. [Submission schedule](https://bcc-hacktoberfest.devpost.com/details/dates), [event rules/announcement](https://bcc-hacktoberfest.devpost.com/rules).

Washington, DC is confirmed by the event listing. The Meetup address is 901 G Street NW. The user's announcement specifies teams of 2–4; the current Devpost overview also allows solo entrants. Your actual two-person team fits either description. [Organizer's Meetup listing](https://www.meetup.com/black-code-collective/events/316771410/).

## Finalist comparison

| My order | Idea / primary track | What the judge sees | Best reason to choose it | Main uncertainty |
|---|---|---|---|---|
| 1 | Reclaim / Healthcare | Old lab pages become confirmed, source-linked evidence and a transplant-team review packet | Exceptionally specific community need, existing remedy, visual before/after, no private integration needed | Remaining demand and clinical workflow usefulness are unvalidated |
| 2 | BlockBrief / Community | Recurring public 311 records plus a resident's account become a factual follow-up brief | Local to the event, real public data, demonstrable engineering, manageable scope | Reporting tools and dashboards already exist; agency action remains external |
| 3 | Second Look / AI ethics and access | A screening report and court disposition disagree; the user reviews an evidence-linked correction packet | Reliable document comparison and practical applicant-side action | AI-specific and Black-community-specific claims need careful explanation |
| 4 | DialectLens / AI ethics and access | Meaning-matched inputs receive a fact-preservation evaluation and reproducible test receipt | Most direct AI-ethics fit and strongest developer-tool demo | Existing audit tools, human dialect review, and unpredictable live findings |

All four can be scoped for two people. The differentiator should be a useful action supported by inspectable evidence. A generic conversation box adds little to any of them.

## Reclaim: why this merits the top spot

The issue is a historical clinical equation, not a generative AI hallucination. Race-inclusive eGFR calculations could push a Black patient's reported kidney-function estimate above a threshold relevant to starting transplant waiting time. An existing OPTN process allows programs to seek waiting-time modifications when the required evidence is established. A 2026 national study reported **21,119 modifications during January 2023–June 2025, with a median 1.7 years added**. Those are results of the policy, not an effect this proposed app has achieved. [JAMA Internal Medicine primary abstract](https://pubmed.ncbi.nlm.nih.gov/41801177/).

This is still an ongoing process. An update effective September 10, 2025 strengthened written protocols, documentation and notifications. Its September 2026 catch-up date has already passed; do not pitch an approaching deadline. The documentation task remains a defensible use case, but the research does not establish widespread present-day noncompliance. [Implemented policy notice](https://www.hrsa.gov/sites/default/files/hrsa/optn/mac_monitor-ongoing-egfr-modification-policy-req_pnjune2025.pdf).

The professional FAQ explicitly includes patient-held records among documentation sources. Its evidence example requires a race-inclusive result above 20 and a race-neutral result at or below 20; relevant dates and other eligibility requirements also matter. Use the older FAQ for these evidence details, and the newer policy for updated notification requirements. [HRSA professional FAQ](https://www.hrsa.gov/es/node/30193).

The missing evidence is product demand: we have not interviewed candidates or coordinators, quantified how many eligible people remain unmodified, or established that a packet would save clinical staff time. A 2025 study found center variation, but variation is not the same as missed eligibility. A short conversation with a transplant-informed reviewer is the highest-value validation step tonight or early Wednesday. [2025 primary study](https://pubmed.ncbi.nlm.nih.gov/40327843/).

### The exact product

Working pitch: **“Reclaim helps Black kidney-transplant candidates turn old lab records into a clear, source-linked packet for their transplant team's waiting-time review.”**

Build five steps:

1. Import a text-bearing PDF or enter the report's fields manually. Use clearly fictional records at the public demo.
2. Display dates, original race labels, units and paired reported values alongside their source page. The user confirms or corrects them.
3. Organize only confirmed evidence. The first version supports dual-reported values from the same specimen/report; it never joins unrelated dates or independently recalculates eGFR.
4. Show a chronological index, a “may be relevant for review” explanation, and explicit missing or unclear information. An inconclusive upload never becomes an eligibility denial.
5. Export a readable packet: source-page index, confirmed facts, original references, missing-record checklist and questions for the coordinator.

Keep the original documents easy to inspect. Every finding should lead to its exact supporting page and quoted text. Include “already reviewed / modification already applied / unsure” so the tool can help clarify an existing review rather than presume the institution failed. Exact bounding-box highlights are optional; dependable page navigation and source quotations are enough.

### The 90-second demo

| Time | Action | What it establishes |
|---|---|---|
| 0–15 sec | Introduce a fictional newly listed candidate/caregiver with records from several providers | One person, one task |
| 15–35 sec | Import a synthetic historical report and confirm the source-highlighted values | Real input and inspectable extraction |
| 35–50 sec | Show the same report's race-labeled pair across the threshold | A visible, explainable reason to review this page |
| 50–65 sec | Import a separate modern low result and a document missing its date; the app holds them for clarification | It avoids a misleading conclusion |
| 65–85 sec | Export the packet and open it | A completed, useful output |
| 85–90 sec | State what was measured and what the transplant team decides | A credible finish |

HRSA's patient material already contains a worked pair of **23.3 and 19.2**. Use those numbers in an explicitly fictional sample, not an invented patient success story. Do not display “years recovered,” a new eligibility verdict, or a predicted transplant date. [Official explanation and worked example](https://www.hrsa.gov/optn/patients/resources/kidney/understanding-race-egfr).

### What makes it more than a thin AI wrapper

The hard part is linking values to the right specimen, labels, dates and page; keeping extraction separate from confirmed facts; preserving provenance; and producing a packet that contains only supported statements. A bounded AI extractor can propose fields, but deterministic checks and human confirmation govern the result. The full manual path must also work.

Use your familiar web stack, a PDF viewer, a small structured fact model and browser-print export. A preselected, dated set of public policy sources is enough. There is no need for a vector database, model training, agent orchestration or a hospital API in this prototype.

**Strict cuts:** accounts, EHR connections, lab-provider logins, official OPTN submission, clinical calculations, diagnosis, triage, risk prediction, live record retrieval, automated outreach and a nationwide resource directory. Accept digital-text PDFs first; complex scan OCR is a stretch feature.

**Honest novelty:** KidneyKind already tracks labs and transplant workup, and KT-LLM already describes auditable transplant policy automation. The narrower contribution is a candidate/caregiver-facing historical-document review packet with original pages and conservative uncertainty handling. Do not claim to invent the policy, the threshold check or the first transplant assistant. [KidneyKind](https://kidneykindapp.com/), [KT-LLM primary paper](https://pmc.ncbi.nlm.nih.gov/articles/PMC12891658/).

### The validation you can actually complete

Create a small labeled synthetic set covering an exact threshold value of 20, swapped labels, unrelated specimen dates, missing dates, ambiguous units, wrong patient, duplicates, a modern race-free result, and a record later than the relevant user-entered start date. Measure extraction exactness, page-link correctness, false flags and successful abstention. Report measured counts, not target numbers as achievements.

If 3–5 people are available, time whether they can identify the relevant original page and create the packet with and without the app. That measures the administrative task. It does not validate clinical eligibility, increased transplant access or improved survival. A clinical/policy-informed reviewer is still needed before a patient-facing launch.

## The strongest alternatives

### BlockBrief — the strongest local and lower-risk alternative

User: a DC resident or organizer following up on a recurring neighborhood issue. The flow is **choose a location and issue → inspect relevant public 311 records → confirm which records describe the same problem → add the resident's current observation → export an ANC/agency brief**. Start with one issue type, such as illegal dumping, and one geographic area.

The useful output is a dated timeline with request IDs, responsible agencies, original statuses, a resident-supplied current account and a concrete question/request. An agency's “closed” status and a resident's statement that the issue persists are different facts and must remain visibly separate. Nearby requests are candidate matches until someone confirms them.

Technical substance: bounded geographic queries, pagination, deduplication, transparent candidate grouping, dates/status lineage and a downloadable brief. The researcher tested the DC 2026 public service endpoint without authentication; the detailed Track 3 appendix records the exact endpoint and limits. Cache a timestamped, correctly labeled public-data snapshot for an outage fallback. Never call replayed data a live response.

The strongest demo is one real public record history combined with an explicitly simulated resident observation. Do not fabricate a current photo or label a real block as neglected based on closed records alone. Choose the resident's issue; do not equate high complaint volume with greatest need, or low reporting with good service.

The novelty must be the resident-controlled follow-up workflow. SeeClickFix already supports reporting and DC's To-Do List already provides a 311 dashboard. [SeeClickFix's duplicate workflow](https://www.civicservice.civicplus.help/hc/en-us/articles/360043293074-Mark-a-Request-as-a-Duplicate), [DC's To-Do List](https://viridicity.github.io/dc311/). WABA's January 2026 testimony reports concerns about tickets being closed without action or explanation; that supports investigating the workflow, rather than a citywide estimate of failed service. [WABA testimony](https://waba.org/document/waba-2026-performance-oversight-testimony-on-the-districts-office-of-unified-communications-ouc/). The Track 3 appendix has API details and additional agency evidence.

### Second Look — strongest practical Track 1 alternative

User: a job applicant and the navigator helping them review a screening report. They supply that report and a source court disposition. The app highlights a factual disagreement—such as the same case being “pending” in one source and “dismissed” in the other—then exports user-selected evidence and a correction request draft.

A 2024 study found false-positive errors in regulated background checks for 60% of its selected 101-person sample. That is evidence of a failure class, not a national error rate or evidence that Black applicants have that particular error rate. [Primary research abstract](https://www.researchwithrutgers.org/en/publications/the-problem-with-criminal-records-discrepancies-between-state-rep/).

Keep it to document reconciliation: exact case/court anchors, source spans, confirmed identity, unresolved cases and a packet. A status disagreement is not automatically unlawful reporting. Rasa already addresses record-clearance eligibility; dispute-generation products already exist. The applicant-side evidence comparison is the narrower contribution. [Rasa](https://www.rasa-legal.com/eligibility-tool/), [FTC applicant guidance](https://consumer.ftc.gov/articles/employer-background-checks-and-your-rights).

The main judging weakness is Track 1 specificity: explain how consequential automated dossiers can harm access without claiming this tool proves racial discrimination, identifies a deployed AI system or removes criminal records.

### DialectLens — strongest direct AI-ethics alternative

User: a Black-serving workforce facilitator selecting an AI intake/summary tool. A small human-reviewed set expresses the same job-relevant facts in African American English and mainstream English. Compare preserved facts, contradictions and unsupported judgments, then export model/prompt/version receipts.

The 2024 Nature paper establishes dialect prejudice in tested models. Its code is public, and Promptfoo/Giskard already provide bias testing. The potential contribution is a carefully reviewed local meaning-preservation test pack and understandable evidence. A dialect is neither an error to correct nor a reliable identity classifier. [Nature paper](https://www.nature.com/articles/s41586-024-07856-5), [author repository](https://github.com/valentinhofmann/dialect-prejudice), [Promptfoo prior art](https://www.promptfoo.dev/docs/red-team/plugins/race-bias/).

Use text first, one task and two model adapters. A live pass is a valid finding; do not manipulate the live reveal. A real recorded failure can be shown as a recorded run. If no failure is found, an explicitly labeled artificial output mutation can demonstrate the checker, but says nothing about vendor bias. Without AAE-speaker review, this remains an engineering prototype rather than a validated dialect benchmark.

## Three days for two engineers

Plan around roughly 48 focused person-hours, with a substantial share reserved for reliability and presentation. That is a planning assumption, not a promise about how many hours you can work.

| When | Engineer A | Engineer B | Required end state |
|---|---|---|---|
| Tonight, Tue Oct 20 | Verify the evidence rule and draft labeled positive/negative samples | Sketch the single workflow and packet; identify a reviewer if available | One idea chosen; fixed cuts; a 90-second storyboard |
| Wed Oct 21 | Implement manual facts, PDF text extraction and source references | Implement confirmation flow, evidence index and printable output | Complete manual input-to-packet path in a deployed prototype |
| Thu Oct 22 | Add bounded extraction, source validation and difficult fixtures | Add clear uncertainty states, original-page navigation and accessible layout | Reliable complete core; feature freeze Thursday evening |
| Fri Oct 23 | Run the labeled evaluation, fix substantive failures, verify source/date handling | Run task walkthroughs, tighten pitch, record backup demo and finish Devpost | Submit by 10 p.m. EDT; verify submitted status and public links |
| Sat Oct 24 | Quick smoke check and rehearse | Rehearse and prepare laptop/local fallback | Ready before announced 3–5 p.m. judging |

If the core path is incomplete Wednesday night, cut automatic extraction or OCR before cutting source inspection, confirmation and export. A working manual path plus a reliable bounded extractor is a better demonstration of this concept than an ambitious system with missing provenance.

## Tonight's lock-in rule

Give yourselves **45 minutes**: read the Reclaim demo aloud, inspect the official worked example and evidence criteria, and write the exact packet contents. Try to get one transplant-informed reaction; do not claim a partner or endorsement unless it exists. Commit to the narrow organizer scope if it still feels compelling and understandable to both of you.

If either of you does not want to defend the healthcare assumptions, choose **BlockBrief** tonight and freeze one DC issue type. Do not spend Wednesday building both ideas. For either choice, keep one user, one complete workflow and one inspectable output.

The strongest pitch is specific: a real process is difficult to complete; this prototype makes a defined part of it easier, and the judges can inspect the evidence and the finished result. Novelty, user demand and downstream impact must be described at the level the research and demo actually support.

## Evidence strength and remaining questions

| Finding | Confidence | What it does and does not establish |
|---|---|---|
| Published rubric, deliverable and submission deadline | High | Direct official listing; event-day schedule wording still needs organizer clarification |
| Existing eGFR remedy and historical modifications | High | Official policy and peer-reviewed research; does not establish the proposed app's effectiveness |
| Immediately accessible DC311 data | High | An unauthenticated query and schema were inspected; recurrence and current on-the-ground conditions still require review |
| Advertised competitor overlap | Medium | Primary product documentation demonstrates substantial prior art; does not prove an exhaustive feature or market comparison |
| Complete two-person build in three days | Medium | Engineering judgment conditional on the strict cuts and complete manual path |
| Remaining demand for Reclaim and acceptance of its packet | Low / unvalidated | No interviews or uptake evidence; this is the main question to investigate next |

## How to read the research appendices

Each track memo records additional concepts, competitors, public-data access, scoped demos, evaluation ideas and disqualifiers. Rankings within a track are the researcher's assessment; the cross-track recommendation above is the final synthesis. Product names are working labels, not claims of name availability. Undated live product pages were inspected as current sources on the research date. No community members, clinicians or organizers were contacted.
