> **Updated direction:** Following the new LARP/aura preference, Block Ops is now the overall recommendation and The Switch is the higher-variance challenger. See the [October 20 aura reassessment](aura-reassessment.md). The original analysis below is retained for its evidence and earlier scope.

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

## How to read the full research

Each track memo records additional concepts, competitors, public-data access, scoped demos, evaluation ideas and disqualifiers. Rankings within a track are the researcher's assessment; the cross-track recommendation above is the final synthesis. Product names are working labels, not claims of name availability. Undated live product pages were inspected as current sources on the research date. No community members, clinicians or organizers were contacted.


---

# Full track research

The three research memos below examine **17 concepts**: six in AI ethics/access, six in healthcare, and five in community development. The decision brief above incorporates a fourth agent’s independent challenge of the finalists. Research results establish evidence, prior art and build feasibility; they are separate from customer validation and prototype test results.

---

# Track 1: AI Ethics and Access in Black Communities

Research cut-off: October 20, 2026. Decision context: two strong generalist engineers, three build days (October 21–23), submission by the published October 24 12:00 a.m. EDT deadline, judging October 24 afternoon in Washington, DC. No assumed community partner, proprietary dataset, institutional API access, or new model training. Research only; nothing installed or built.

## Decision

**My force-ranked pick is Second Look: an evidence-linked background-screening error checker for a job seeker and the community navigator helping them.** It turns two documents the person already has—a screening report and a court disposition—into a precise, reviewable correction packet. Its success is measurable without needing an employer to expose an algorithm or a model to produce a racist answer on stage. The technically meaningful core is provenance-preserving document extraction and constrained record reconciliation, with ambiguity handled explicitly.

**Runner-up: DialectLens, a regression tester for whether an AI job-intake assistant preserves the same facts across meaning-matched AAE and mainstream-English inputs.** This is more obviously AI-native, and the evidence base is strong. It wins only if narrowed to observable errors and a reproducible evidence receipt. A generic model-bias dashboard has major prior art and an unreliable live reveal.

**Third: Denial Decoded, a source-linked adverse-action notice navigator.** Very buildable and useful, but crowded letter-generation space, limited ability to establish that AI was used, and careful legal branching needed. Do not mistake a credit-score reason for a lender's actual decision reason.

| Rank | Concept | Actual user and painful moment | 72-hour cut | Distinctive technical element | Main weakness |
|---|---|---|---|---|---|
| 1 | Second Look | Black job seeker/reentry navigator receives an adverse-action notice and finds a criminal charge misreported | Two supplied PDFs, five factual discrepancy checks, evidence-linked correction packet | Case-level entity resolution and contradiction detection that abstains on uncertain matches | Does not prove racial bias or remove a record; applicant must obtain source documents |
| 2 | DialectLens | Black-serving workforce/library staff choose an AI job-intake assistant and need to know whether it distorts applicants' meaning | 20 annotated paired statements, two models, fact-preservation metrics, replayable receipts | Metamorphic testing with invariants and paired uncertainty, rather than an LLM saying another LLM is biased | Human-reviewed equivalence required; live models may show no gap |
| 3 | Denial Decoded | Borrower gets a confusing credit denial and does not know which information or explanation to request | One notice type, notice-field extraction, source-backed checklist and draft request | Distinguishes notice contents, missing information, and user-confirmed next actions | Mature competitors; no access to actual underwriting rationale |
| 4 | CareFacts | Patient sees an AI visit summary omit or change something they said | User-provided transcript + summary, facts/negation/dose comparison | Omission and contradiction ledger anchored to original words | Clinical validation, real data/privacy, and crowded scribe market make this harder than it appears |
| 5 | Community AI Receipts | Organizer hears that a model treated someone unfairly but cannot reproduce or route the report | Local report builder with redaction, prompt/model/version evidence, reproducibility package | Minimal reproducible incident bundle with confidence and consent controls | AJL/AIID/AIAAIC already address reporting; no demonstrated route to remedy |
| 6 | FairScreen Sandbox | Small employer wants to understand proxy effects in an AI shortlist | Synthetic resumes, name/dialect perturbations, rank/score difference plots | Controlled sensitivity and rank-stability tests | Highly saturated; synthetic names are race proxies; mock screening is not evidence about deployed ATS |

These ranks are my judgment against the published criteria—track fit, creativity, functioning reliable code, and presentation—not an invented official weighted score.

## Evidence that changes the design

1. **Background-report accuracy is a concrete failure mode.** Lageson and Stewart's February **2024** peer-reviewed study compared state records with regulated and unregulated private checks for **101 people**. In that sample, 60% had at least one false-positive error in the regulated check; missing dispositions and mismatched records were recurring problems. This is a small selected sample involving people with criminal legal histories, **not a national error-rate estimate**. [Research abstract and publication details](https://www.researchwithrutgers.org/en/publications/the-problem-with-criminal-records-discrepancies-between-state-rep/), [paper](https://doi.org/10.1111/1745-9125.12359).

2. In **September 2023**, the FTC announced a **$5.8 million settlement** with TruthFinder and Instant Checkmate over background-report accuracy claims and FCRA allegations. The complaint described criminal-record alerts triggered by material as slight as a traffic ticket. This supports a real problem in automated dossiers; it does not establish that every screener uses modern generative AI. [FTC enforcement announcement](https://www.ftc.gov/news-events/news/press-releases/2023/09/ftc-says-truthfinder-instant-checkmate-deceived-users-about-background-report-accuracy-violated-fcra).

3. **Dialect is a consequential AI issue, not incorrect English to fix.** Hofmann et al.'s **2024 Nature** study found covert prejudice against African American English in tested language models, including hypothetical employment and criminal-justice decisions. Those were controlled experiments on particular models, not measurements of actual employers or courts. [Paper](https://www.nature.com/articles/s41586-024-07856-5), [author code and sample paired data](https://github.com/valentinhofmann/dialect-prejudice).

4. **Recognition gaps are real but historical rates cannot be recycled as current vendor rankings.** Koenecke et al.'s **2020 PNAS** study found substantially higher word-error rates for Black than white speakers in the five systems tested then. A **2024** reexamination specifically identifies recording provenance as a potential confound. A new hackathon evaluation should control microphone, room, speaker, and meaning rather than compare unrelated recordings. [Original study](https://doi.org/10.1073/pnas.1915768117), [2024 reexamination](https://arxiv.org/abs/2407.13982).

5. **Resume-name audits need more care than a toggle.** Wilson and Caliskan's **2024** study tested embedding-based retrieval for simulated hiring across nine occupations. It found substantial differences, but also showed effects from document length and name frequency. A name-swap demo cannot certify discrimination or generalize to an actual ATS. [Paper](https://arxiv.org/abs/2407.20371).

6. **Lending disparities are not proof of AI causation.** FFIEC's **2023 lending data**, published in **2024**, showed a 16.6% denial rate for Black applicants in its specified conventional home-purchase loan slice. Loan characteristics, geography, income, credit information, selection, and reporting exclusions matter. HMDA alone cannot establish that an algorithm discriminated. [Official release](https://www.consumerfinance.gov/archive/newsroom/ffiec-publishes-2023-data-on-mortgage-lending/).

7. **Important legal correction:** CFPB Circulars **2022-03** and **2023-03**, commonly cited about AI credit-denial explanations, were **withdrawn May 12, 2025**. CFPB's present Regulation B §1002.9 still describes specific-principal-reason requirements and the alternative notice of the right to request reasons. Build against current regulation and carefully scoped consumer education; do not present withdrawn circulars as current authority. [Withdrawal list](https://www.consumerfinance.gov/compliance/guidance/withdrawn-guidance/), [current §1002.9](https://www.consumerfinance.gov/rules-policy/regulations/1002/9/).

## Pick 1: Second Look

### Product and honest novelty

Pitch: **“A background check can be wrong. Second Look shows exactly where two records disagree, so you can ask for a correction with evidence.”**

Focus on a job applicant working with a Black-serving workforce or returning-citizen organization; do not imply all Black applicants have criminal records. The harm is a consequential automated data-matching error. The tool serves the person affected rather than sells another opaque risk score to the employer. The Black-community equity case should be framed as reducing barriers for affected residents, not claiming a subgroup error disparity that this MVP cannot measure.

Prior art is substantial: [Rasa's eligibility tool](https://www.rasa-legal.com/eligibility-tool/) analyzes records for expungement/sealing, with state-specific law and record access. [DisputeBee](https://disputebee.com/) already generates and tracks credit disputes. [Solo](https://www.solosuit.com/) already offers debt-document/legal-AI workflows. Second Look's credible distinction is **one currently blocking screening report reconciled to one applicant-supplied source disposition, with every suggested correction traceable to a page**. Do not claim invention of record clearing or dispute letters.

### Ninety-second demo

- 0–15 seconds: “Jordan is offered a job, then gets this background report.” Open a clearly labeled fictional report. It lists case 2022-CF-104 as pending.
- 15–35 seconds: Upload a clearly labeled fictional court disposition with the same case number, dismissed on a specific date. Show the source pages side by side. The application identifies a status disagreement and exact supporting spans.
- 35–55 seconds: Open another record with an identical name but different birth year. The app refuses to merge it automatically and asks the user to confirm or exclude it. This abstention is a visible technical strength.
- 55–75 seconds: Select the one discrepancy the applicant confirms. Export a factual correction packet containing the original report excerpt, source-document excerpt, user-approved description, and official next-step links. No accusations or automatically sent letter.
- 75–90 seconds: Run a second fixture where records agree. Show “no discrepancy detected in supported fields,” and the small evaluation panel: field extraction accuracy, discrepancy precision/recall, unresolved cases.

This demo is truthful even if no current LLM is biased: the tool is reconciling documented facts, not trying to elicit prejudice. Synthetic fixtures demonstrate functionality, while published research establishes that the class of failure exists; keep those roles separate.

### Minimum feature cut for two engineers

Accept **text-bearing PDF or pasted text only first**; OCR for scans is optional after the core works. Extract case number, court, person identifiers, filing/disposition date, charge label, and disposition. Preserve page/character offsets. Normalize date and disposition terminology with a tiny documented dictionary. Apply **five checks**: conflicting case status, inconsistent key identity field, duplicate case/charge, mismatched case number/court, and absent disposition needing manual review. Exact case number plus court anchors a match; a name alone never does.

Use an LLM for bounded extraction into a schema, with each value required to quote a matching source span. Use deterministic rules for comparisons and a safe “unresolved” result. The schema must allow null/unknown and multiple candidates. Treat “pending vs dismissed” as a source disagreement, not a legal conclusion that reporting it is forbidden. Produce only a downloadable packet, user-reviewed text, and a short checklist.

Cut: criminal-history lookup, scraping court sites, expungement eligibility, automatic legal advice, employer integration, background-report acquisition, sending letters, accounts, payments, national policy engine, and public accusation database.

### Data, access, and tests

No private institutional API needed. Author **12–20 fictional paired reports** spanning clean matches, conflicting status, same-name different-person, OCR-like noise, multiple charges in one case, missing dates, and ambiguous identity. Labels are hand-reviewed. Real documents are optional only with explicit owner consent and privacy controls; do not collect them for the hackathon.

[FTC applicant guidance](https://consumer.ftc.gov/articles/employer-background-checks-and-your-rights) explains pre-adverse-action report rights and dispute steps. Do not convert its 60-day free-copy provision into a universal 60-day dispute deadline. [DC Courts' legal-services listing](https://www.dccourts.gov/get-legal-help/legal-services-providers) provides a plausible local referral, **not an agreed partnership or guaranteed eligibility**.

Technical checks: field exact-match accuracy on labeled fixtures; every extracted quote is an exact substring of the source; discrepancy precision and recall by error type; zero auto-merges on same-name/different-DOB fixtures; unknown/missing fields never silently become a finding; generated packet references only user-selected discrepancies. Report actual measured numbers; success thresholds are engineering targets, not fabricated results.

Two-person split: engineer A owns extraction, provenance, normalization, fixture labels; engineer B owns side-by-side viewer, discrepancy review, packet export, and accessibility. Build all core paths by Thursday; Friday is adversarial fixtures, deployment, video, pitch, and submission.

## Pick 2: DialectLens

### Product and novelty

Pitch: **“Before your organization recommends an AI job coach, test whether it understands the same qualifications in different dialects.”** User: a library or workforce facilitator choosing an AI intake/summary tool. Task: summarize objective availability, experience, qualifications, and requested support. This avoids building a new hiring-risk scorer.

The open [Dialect Prejudice research repository](https://github.com/valentinhofmann/dialect-prejudice) already implements matched-guise probing. [Promptfoo](https://www.promptfoo.dev/docs/red-team/plugins/race-bias/) already tests racial bias; [Giskard](https://docs.giskard.ai/oss/scan/explanation/how-scan-works) already scans for stereotypes/discrimination. Novelty is **a Black-community-specific annotated meaning contract, source-evidence checks, and a receipt understandable by the affected applicant**. A dashboard that scores models “fair/unfair” is weak and misleading.

### Ninety-second demo, including a no-bias result

Show two human-reviewed statements expressing the same job-relevant facts. User approves the shared gold facts before running. Execute both through a chosen API and render extracted facts with source spans. Highlight a missed qualification, invented professionalism judgment, or changed availability if actually observed. Show paired fact recall and unsupported-inference counts across the saved pack.

**If the live pair shows no difference, say so plainly:** “This pair passed; it does not prove the system is fair.” Then open a visibly labeled, timestamped recorded run from development, if a real failure exists. If none exists, demonstrate the checker by applying an explicitly labeled test mutation—remove a required qualification from a sample output—and show the invariant fail. The mutation tests the checker; it must never be presented as a vendor result. This still provides a legitimate working-demo story: the team built a quality gate that can pass or fail honestly.

### Technical minimum

Twenty paired, hand-reviewed examples; one clearly defined summarization/intake task; two fixed model adapters; five repetitions per pair where quota permits; source span evidence; machine-readable run manifest (model ID, prompt, generation parameters, timestamp, sample hash); source facts and one-click JSON/HTML evidence receipt. Keep a held-out half of the fixtures so mitigation is not tuned on the full set.

Measure **fact recall**, **contradiction rate**, **unsupported trait inference**, and **paired differences** with counts and intervals. For binary failures, display paired discordance and an exact paired/binomial test when sample size supports it. Do not call a score gap a causal finding about race: dialect is manipulated, dialect can vary in nuance, and dialect does not determine a person's race. Do not rely on an LLM judge alone; a second LLM can share the same bias. Gold facts and source quotes provide a more defensible measure.

Optional mitigation: require an evidence-only fact schema and let the applicant confirm the summary before it is used. Never require the speaker to erase their dialect or convert to a supposed “correct” English. No automatic dialect or race classifier. No fairness certificate, legal compliance badge, bias elimination claim, or model-wide fairness ranking.

Audio is a stretch. [CORAAL](https://lingtools.uoregon.edu/coraal/userguide/CORAALUserGuide_current.pdf) is publicly downloadable research material, but recording conditions and terms need care. The fastest reliable MVP is text with self-authored, human-reviewed fixtures. Without actual AAE speaker/linguist review, label it an engineering prototype rather than a valid dialect benchmark.

## Pick 3: Denial Decoded

Pitch: “Turn a confusing credit-denial notice into the exact information you need to request and a source-backed next-step checklist.” One product type only, preferably consumer credit, not combined mortgage, insurance, employment, and housing law.

Demo: upload a fictional notice; locate lender, notice date, decision, listed reasons, reporting company, and explanation-request route. User corrects uncertain fields. Tool identifies that the notice offers a request-for-reasons route and prepares a user-reviewed factual request. Display the applicable current rule next to each step; clearly distinguish what was extracted from what was inferred.

Technical minimum: notice schema + page citations + deterministic date calculation after user confirms date/type + bounded educational explanation + downloadable request. The current Regulation B allows different notice paths, and statement timing differs by context. Absence of reasons in one uploaded page is not automatically unlawful. A letter cannot reveal whether AI was used or whether the stated reasons are faithful to an unseen model. A credit-score-factor list is not necessarily the complete lender decision reason.

Prior art: DisputeBee and Solo; free CFPB/FTC educational templates and existing credit-dispute products. The useful distinction is interpreting **the actual notice** and producing a verified next-action packet rather than selling “AI credit repair.” Avoid score-improvement promises, predictions of approval, invented rights, and automated disputes of accurate records.

## Lower-ranked concepts: viable but weaker bets

**CareFacts:** Compare patient-provided visit transcript and AI summary; flag negation, dosage, duration, and omitted concerns with quotes. The **2019 Obermeyer et al. Science** study establishes how a cost proxy can produce racial inequity, but **does not validate this summary-checking intervention**. [Paper abstract](https://pubmed.ncbi.nlm.nih.gov/31649194/). [Heidi](https://www.heidihealth.com/solutions/medical-scribe-software) already creates structured notes with review; other ambient scribes are well established. No diagnosis or triage. Clinical harms and lack of clinician validation make it a poor two-engineer sprint pick.

**Community AI Receipts:** Redact identity from a report, record exact model/prompt/response, rerun where allowed, produce a minimal reproducible evidence bundle with consent and uncertainty. [AJL already collects harm reports](https://www.ajl.org/harms), its [CRASH project](https://www.ajl.org/crash-project) explicitly considers routing to organizers/lawyers/journalists, and [AIAAIC](https://www.aiaaic.org/aiaaic-repository) already maintains a grassroots incident repository. Differentiate as a local evidence-capture utility, not a new incident database. An accusation log without redaction/moderation is a liability, not a remedy.

**FairScreen Sandbox:** Controlled synthetic resume testing with names, dialect, employment gaps, and zip codes; show rank stability and evidence-grounded rubric evaluation. Fairlearn, Promptfoo, Giskard, academic audits, and commercial auditing firms make this crowded. Names and zip codes are imperfect race proxies. Showing that removing a name changes a score is a sensitivity result, not evidence that an actual employer discriminated. Do not use protected attributes to decide who gets hired.

## API/data feasibility checked October 20, 2026

| Resource | Verified access/cost/gate | Recommended use |
|---|---|---|
| Gemini Developer API | Official pricing lists `gemini-3.1-flash-lite`: free input/output with quotas; paid text input $0.25/million tokens and output $1.50/million. API key/Google account required; paid tier needs billing. Free-tier content may be used to improve products. | Synthetic/public fixtures only on free tier; one constrained extractor or comparison model. Keep model ID fixed and log it. [Pricing](https://ai.google.dev/gemini-api/docs/pricing) |
| Groq speech-to-text | Official docs list `whisper-large-v3-turbo` $0.04/audio hour and `whisper-large-v3` $0.111/hour; free-plan file limit 25 MB. API key/account required; quotas are organization-specific. | Optional audio comparison, not needed for text MVP. Two Whisper variants are not independent model families. [ASR docs](https://console.groq.com/docs/speech-to-text), [limits](https://console.groq.com/docs/rate-limits) |
| AssemblyAI | Pricing page advertises no-credit-card free account, up to 185 hours prerecorded/333 hours streaming; paid Universal-2 $0.15/hour and Universal-3.5 Pro $0.21/hour. Exact free eligibility/account quotas must be checked during signup; older FAQ credit amounts differ. | Optional second ASR family after core demo works. [Pricing](https://www.assemblyai.com/pricing/) |
| Author's dialect-prejudice repo | Public GitHub code, example pairs, and reproduction instructions. Large original corpora are separately referenced; don't assume sample-code licensing grants every corpus right. | Prior art and method reference, not a reason to train a new model. [Repository](https://github.com/valentinhofmann/dialect-prejudice) |
| HMDA Data Browser API | Public documented GET endpoints provide JSON aggregates or CSV filtered by year/geography/race/action; no key shown in documentation. Queries may be slow/large. Public data lacks important underwriting information. | Optional context graphic only; no live dependency and no causal discrimination verdict. [Docs](https://ffiec.cfpb.gov/documentation/api/data-browser/) |

Illustrative budget, not measured spend: 200 Gemini calls at 1,500 input + 300 output tokens each cost about **$0.165** at the listed paid rates, excluding hidden/reasoning tokens, retries, other APIs, and hosting. Credits and account access matter more than raw token cost. Never assume a consumer chatbot subscription includes developer API credits. Precompute a labeled demonstration run and keep a deployed app/recorded demo available for outages, while clearly showing when a result is replayed.

## Claims to avoid in pitch and UI

- “We proved this employer is racist,” “race caused the denial,” or “this model is certified fair.”
- Presenting synthetic fixtures, deliberately mutated outputs, or recorded runs as live institutional results.
- Claiming that a statistical disparity is automatically unlawful discrimination, or that equal aggregate rates solve fairness.
- Treating a name, dialect, neighborhood, or inferred skin tone as ground-truth race.
- Claiming a model is safe because one current test pair passes; claiming bias on one noisy model response.
- Claiming a record was expunged, legally unreportable, or belongs to someone else based on an LLM guess.
- Citing withdrawn 2021/2024 CFPB background-screening advisory opinions or 2022/2023 circulars as current legal requirements. Historical publications can document past concern, but legal authority must be checked separately.
- Assuming no harm because protected attributes were removed: proxies and surrounding systems still matter.

## The twelve links I would put in a compact parent-facing research brief

1. [2024 background-record discrepancy study](https://doi.org/10.1111/1745-9125.12359)
2. [FTC applicant background-check rights](https://consumer.ftc.gov/articles/employer-background-checks-and-your-rights)
3. [FTC 2023 background-report accuracy enforcement](https://www.ftc.gov/news-events/news/press-releases/2023/09/ftc-says-truthfinder-instant-checkmate-deceived-users-about-background-report-accuracy-violated-fcra)
4. [2024 Nature dialect-prejudice study](https://www.nature.com/articles/s41586-024-07856-5)
5. [Dialect-prejudice author code and examples](https://github.com/valentinhofmann/dialect-prejudice)
6. [Promptfoo race-bias testing, direct prior art](https://www.promptfoo.dev/docs/red-team/plugins/race-bias/)
7. [Rasa record-clearance tool, adjacent prior art](https://www.rasa-legal.com/eligibility-tool/)
8. [DisputeBee, letter-generation prior art](https://disputebee.com/)
9. [Current Regulation B notice requirements](https://www.consumerfinance.gov/rules-policy/regulations/1002/9/)
10. [CFPB withdrawn guidance list](https://www.consumerfinance.gov/compliance/guidance/withdrawn-guidance/)
11. [Gemini API cost and data-use rules](https://ai.google.dev/gemini-api/docs/pricing)
12. [DC Courts local legal-service referrals](https://www.dccourts.gov/get-legal-help/legal-services-providers)


---

# Track 2 research: modern healthcare outcomes in Black communities

Research cutoff: October 20, 2026. Location confirmed by parent: MLK Memorial Library, Washington, DC. **Team: exactly two strong generalist engineers.** Three full build days October 21–23; submit Friday night before the Devpost October 24 12:00 a.m. EDT deadline. Ranking uses the actual unweighted rubric: track fit, creativity, functionality/reliability, presentation. Rankings and product hypotheses below are judgments, not clinical evidence.

## Decision

**1. Backdate: a patient-owned historical kidney-record evidence packet.** Best distinctive story and most auditable 90-second demonstration. Its narrow purpose is to help a Black kidney transplant candidate or caregiver find and organize old lab evidence for a conversation with the transplant team about an existing corrective policy. No diagnosis, new eGFR calculation, eligibility decision, or promise of more waiting time. Remaining unmet need is plausible but has not been quantified: this is the main uncertainty.

**2. My Words, My Visit: a maternal concern and advocate handoff.** Best fallback for a team that can deliver an excellent mobile interaction and recruit a Black mother, doula, or community reviewer for design feedback. It preserves the patient's own language, structures concerns and questions, and lets an invited support person carry the same agenda. Stronger community fit than most administrative tools, weaker novelty because federal tools and maternal platforms already provide birth plans and questions.

**3. Getting There DC: a plan-specific appointment readiness and transportation call packet.** Safest deterministic local product, using actual DC benefits, lead times, and required information. It helps complete the human call rather than displaying another directory or pretending to dispatch a ride. Narrower originality; broker portals already book rides for eligible members.

Reject a generic therapy chatbot, broad patient navigator, hospital-rating app, disease-risk map, or insurance appeal letter generator for this weekend. Established products already cover much of that ground, and there is no plausible path to proving health outcome improvements in 72 hours.

## 1. Backdate — strongest contender

**Exact user and painful moment.** A Black kidney transplant candidate newly listed in 2025/2026, or their caregiver, has lab PDFs from several old providers and is unsure whether earlier race-adjusted eGFR results were included in their transplant team's review. They need to ask a precise question and supply the relevant original pages. Avoid a pitch that implies every Black kidney patient is entitled to a credit or every unmodified candidate was overlooked.

**Evidence and current relevance.** The original January 2024 list-review deadline has passed, but ongoing requirements remain. A policy approved June 2025 and effective **September 10, 2025** strengthened protocols, documentation, and notifications. The September 2026 retrospective-notification catch-up date is also in the past at this event; never market it as an upcoming deadline. The notice is stronger evidence of implementation friction than a general racial disparity statistic. [2025 implemented policy notice](https://www.hrsa.gov/sites/default/files/hrsa/optn/mac_monitor-ongoing-egfr-modification-policy-req_pnjune2025.pdf).

The current professional FAQ says supporting documentation must show race-inclusive eGFR **over 20** and a race-neutral value **20 or less**, and permits submissions when documents are found after January 3, 2024. It explicitly includes searching the program's records, referring nephrologists' records, and patient-held records. For people already on dialysis, relevant records must predate dialysis; for those qualifying by eGFR, predate the existing waiting-time start. [HRSA professional FAQ, last updated March 11, 2024](https://www.hrsa.gov/es/node/30193).

A quasi-experimental study published **March 9, 2026** found 21,119 candidates received modifications during January 2023–June 2025, adding a median 1.7 years of accrued waiting time. This evaluates the policy, **not this proposed software**. It does not establish the number of currently missed eligible people. [Khazanchi et al., JAMA Internal Medicine, primary abstract](https://pubmed.ncbi.nlm.nih.gov/41801177/).

**Honest novelty check.** HRSA already has patient FAQs, professional toolkits, and a transplant-program modification process. NIDDK and NKF already have eGFR calculators; ordinary lab trackers already visualize values. **KidneyKind is a real substitute:** it tracks transplant workup, listing/wait-time dates, lab results, and coordinator contacts. Its inspected product page does not advertise historical race-correction evidence packets; that is only a bounded difference in the described features, not proof it lacks the capability. [KidneyKind](https://kidneykindapp.com/), [NIDDK calculator](https://www.niddk.nih.gov/health-information/professionals/clinical-tools-patient-management/kidney-disease/laboratory-evaluation/estimated-gfr-calculators/adults-pediatrics.).

**Automation is prior art.** The January 10, 2026 **KT-LLM** paper describes an auditable transplant policy/rule framework and Policy-Ops agent. The exact threshold rule is also in that research; do not claim the first automation, rule engine, or auditable policy assistant. It is a research/clinical framework rather than an advertised consumer historical-record organizer. [Primary paper](https://pmc.ncbi.nlm.nih.gov/articles/PMC12891658/). **Paramerge's case file is a governance model/case analysis, not a patient application:** it explicitly says no individual's waiting time, qualifying date, offer, or transplant outcome is computed. Its page identifies an August 28, 2026 verification snapshot, before this event. It therefore limits novelty of the explanatory story but is not a direct functional competitor. [Paramerge case file](https://www.paramerge.com/domains/cases/optn-egfr-race-correction). The defensible difference is a patient-owned, original-page-linked evidence packet with conservative uncertainty handling. Existing transplant coordinators, portals, and folders of PDFs remain strong substitutes.

**Stronger evidence of implementation variation, with a caveat.** Schold et al. (online May 6, 2025) studied 2023 Black candidate listings and found significant center-level variation (center median modification proportion 31%, interquartile range 11%–45%). This supports uneven implementation in that period. It does not identify which unmodified candidates should have qualified or establish persistent gaps after the 2025 strengthening. [Primary JASN abstract](https://pubmed.ncbi.nlm.nih.gov/40327843/).

**Vivid 90-second live demo.** 0–15 seconds: introduce a clearly fictional caregiver and three sample historical lab PDFs. 15–40: import them; show each extracted date, value, original race label, unit, and source-page highlight; require a human confirmation. Use HRSA's own example pair, **23.3 versus 19.2**, in a conspicuously synthetic lab record. 40–60: a timeline shows the old document date relative to a user-entered current waiting-time/dialysis start; text says, “This document may be worth discussing with your transplant team.” 60–75: the second document lacks a date and is visibly held for clarification; the modern race-free document is not treated as historical evidence. 75–90: export an evidence index, original page references, missing-record checklist, and three questions for the coordinator. No dramatic “you recovered four years” animation. [HRSA worked example and explanation](https://www.hrsa.gov/optn/patients/resources/kidney/understanding-race-egfr).

**Strict MVP.** Adult user flow only; manual entry plus text PDF import for three known synthetic layouts; original-page reference; explicit user confirmation; chronological evidence table; missing-document request template; printable/downloadable packet. A manual form is the complete non-AI path. Optional AI may propose extraction, never decide evidence sufficiency. Keep only session memory or local device storage with a clear delete control. Do not invite real medical documents at the public demo unless the privacy architecture has actually been implemented and reviewed.

**Cuts.** No serum-creatinine calculator, CKD stage/risk assessment, waitlist prediction, transplant center ranking, EHR/FHIR, national patient database, official OPTN submission, faxing, advocacy marketplace, or automated accusation of noncompliance. Do not use a new race-free eGFR calculation as a substitute for the exact documentation process the transplant team must determine.

**Immediately available material.** All policy documents, worked examples, and templates are public HTTP documents, with no integration approval needed. Demo records must be invented and labeled; there is no public deidentified historical patient corpus assumed. Patient-held medical records are an input, not an accessible public dataset. Record access can take up to 30 days (with a possible extension), so a real correction cannot be promised this weekend. [HHS record-access timing](https://www.hhs.gov/hipaa/for-professionals/faq/right-to-access-and-research/index.html).

**Minimal measurable evaluation.** Build 20–30 synthetic documents covering decimal transcription, swapped race labels, exact threshold 20, >20, missing date, mismatched patient, units, modern race-free results, and evidence after an earlier dialysis/start date. Report exact extraction accuracy and number of unsupported “discuss this” flags; require human review for every field. Separately time 3–5 people finding the relevant page and producing the packet with/without the app. Claim only an organized, source-checkable packet and measured task completion. If no transplant-informed reviewer is available, be explicit that clinical/policy usability is unvalidated.

**Harm and kill conditions.** Main risks: false hope, wrong historical formula interpretation, mixing patients, decimal/OCR errors, disclosure of health data, and shifting mandated hospital work onto patients. The interface must never say “ineligible” on missing evidence. If the team cannot reliably preserve source pages and distinguish evidence from inference by Thursday, switch to the maternal or transport fallback. If a transplant-informed interview establishes that this packet duplicates an existing easy and universally completed workflow, do not continue on novelty alone.

## 2. My Words, My Visit — maternal concern / advocate handoff

**User/moment.** A Black pregnant or postpartum person has a scheduled visit and three concerns they worry will be minimized; their chosen friend, partner, or doula needs to help them communicate without taking over. Focus on preparation for an existing care contact, not deciding whether it is safe to wait.

**Evidence.** CDC's April 2023 maternity survey documents mistreatment, discrimination, and holding back concerns; the report identifies ignoring/refusing help as the most frequently reported mistreatment. It is a retrospective, nonprobability survey, not proof that a digital agenda reduces mortality. [CDC MMWR, August 2023](https://www.cdc.gov/mmwr/volumes/72/wr/mm7235e1.htm). The most recent final national rate available here is 2024: 44.8 maternal deaths per 100,000 live births among Black non-Hispanic women versus 14.2 among White non-Hispanic women. This metric covers pregnancy through 42 days, unlike pregnancy-related mortality through one year; do not mix the two. [CDC NCHS, March 2026](https://www.cdc.gov/nchs/data/hestat/hestat113.htm).

**Novelty/competitors.** AHRQ QuestionBuilder already prepares questions and permits sharing. CDC Hear Her already provides patient/partner conversation guides. Mae already offers a birth plan creator, provider questions, doula and coordinator support; Wolomi provides maternal companions and support; Irth already offers reviews by Black and brown parents. Do not pitch “the first Black maternal advocacy app.” A defensible wedge is preserving exact patient wording, showing the support person's agreed role, and tracking “asked / answered / still unclear” across one visit. [AHRQ](https://www.ahrq.gov/questions/question-builder/index.html), [Mae features](https://meetmae.com/faq), [Irth](https://irthapp.com/get-the-app/), [Wolomi](https://www.wolomi.com/san-diego-and-imperial-maternal-support).

**90-second demo.** A fictional mother types “I get brushed off when I mention how tired I am” and adds an existing appointment. The app retains that sentence, asks what she most wants answered, lets her pick two evidence-based question prompts, and assigns a support person “help me ask; do not answer for me.” Switch to the advocate view and show the same three-item agenda. In a simulated visit, mark one item answered and another still unclear; export a one-page follow-up question sheet. Show a permanent shortcut to the complete official urgent-warning guidance before any entry flow, without a symptom score or reassuring green badge.

**MVP/cuts/data.** Four screens: concerns in the user's words; priority questions; chosen advocate permissions/role; visit/follow-up card. Manual text and print are sufficient without AI. A read-aloud button is optional. Use public CDC conversation guides and AHRQ question prompts as a small reviewed content set, with source and review date. Cut symptom interpretation, normal/abnormal classification, obstetric triage, medication advice, visit recording/transcription, clinician messaging, crowdsourced hospital reviews, and doula matching. [CDC partner conversation guide, May 2024](https://www.cdc.gov/hearher/campaign-resources/conversation-guide-partners.html).

**Evaluation/safety.** In 5 consented usability sessions, measure whether people can set a three-item agenda, keep their original wording, and produce an advocate card in under three minutes; ask whether the wording feels respectful and useful. Use synthetic scenarios for any AI: 100% preservation of patient numbers/negations, no fabricated facts, no delay-of-care advice. Do not claim fewer deaths or detect preeclampsia. Static urgent-warning information must link directly to the official complete guidance; an incomplete keyword detector is dangerous because a missed phrase can falsely reassure. [CDC urgent maternal warning signs](https://www.cdc.gov/hearher/maternal-warning-signs/index.html).

**Principal disqualifier.** Without community feedback and a sharply better workflow than QuestionBuilder + Hear Her, this is a polished repackaging. An app cannot make an institution trustworthy; name institutional responsibility and avoid framing mothers as responsible for overcoming discrimination by speaking better.

## 3. Getting There DC — transport and appointment readiness

**User/moment.** A DC Medicaid member has a confirmed chronic-care or postpartum appointment but does not know who to call, how early, or what details the ride broker needs. Their plan type changes the rule. This is an administrative completion tool, not a ride-booking service.

**Evidence/data.** AmeriHealth Caritas DC's official page requires routine ride requests at least **48 hours ahead excluding weekends/holidays**, with a separate **3–5 business day** mailing lead time for a new SmarTrip card. DC fee-for-service's 2025 handbook says request **three days excluding Saturday/Sunday**. A generic “three days for everyone” rule is wrong. DC Healthy Start serves residents of Wards 5, 7, and 8 and lists care coordination, doula support, and free transport to perinatal appointments. These are useful public rules, not live capacity or guaranteed eligibility. [AmeriHealth transportation](https://www.amerihealthcaritasdc.com/member/transportation), [DC FFS 2025 handbook](https://dhcf.dc.gov/sites/default/files/dc/sites/dhcf/release_content/attachments/FFS%20Handbook%20vs%202025%20%282%29.pdf), [DC Healthy Start](https://dchealth.dc.gov/am/service/dc-healthy-start).

**Competitors/novelty.** Modivcare already lets participating plan members book and manage rides; broker portals are the appropriate destination when available. DC LinkU already finds medical/food/housing resources. The wedge is calculating the correct request date from a verified plan rule, assembling the call information, and letting a user record what the broker actually said. It cannot claim a completed referral or confirmed ride because the user tapped a button. [Modivcare](https://www.modivcare.com/login/), [DC LinkU listing](https://dchealth.dc.gov/page/resources-01).

**90-second demo.** Choose AmeriHealth, enter a future Monday morning appointment and “I do not yet have a SmarTrip card.” The app surfaces the mailing constraint and exact official source, prepares the call script and missing clinic details, and exports an .ics reminder. Switch to fee-for-service and show the rule change. Move the appointment too close: show “routine notice requirement may not be met; contact the broker to ask about available options,” never “ride booked” or “you cannot get care.” Fill a mock call result with a confirmation number entered manually and a return-trip question still unresolved.

**MVP/cuts/evaluation.** Support exactly two plan pathways with a conspicuous “other / unsure” fallback; one type of routine appointment; fixed, versioned official rules; appointment details checklist; printable call packet; local reminder export; manual status (“not called / called / confirmed by broker”). No booking API assumed. Cut dynamic routing, automated phone agents, dispatch, rideshare reimbursements, eligibility determination, provider availability, and citywide directories. Test at least 20 date/holiday/time-zone cases against the written rules; because language such as “48 hours excluding days” can be ambiguous, show the original policy and conservatively label the computed time an early planning reminder, not an official cutoff. Measure packet completion/time in 5 tests. Safety: no emergency-transport substitution, no false assurance of benefit or vehicle availability; do not store member IDs unless necessary.

**Disqualifier.** Weak originality unless the two pathways and unresolved-call workflow are visibly better than plan sites. It improves preparedness; there is no weekend evidence of improved appointment attendance or hypertension outcomes.

## 4. First Call — culturally responsive mental-health intake preparation

**User/moment.** A Black adult has decided to seek therapy but is anxious about explaining racism-related stress, pricing, confidentiality, and provider fit during a short intake call. Product builds a private, optional preference card and exact questions to ask; the user carries it to a directory/provider of their choice.

**Evidence.** In 2023, among adults with past-year any mental illness, 43.8% of Black adults received treatment versus 58.7% of White adults. This measures receipt, not why a particular person did not get care. [SAMHSA 2023 national report, released 2024](https://www.samhsa.gov/data/sites/default/files/reports/rpt47095/National%20Report/National%20Report/2023-nsduh-annual-national.htm).

**Competitors.** Therapy for Black Girls already has a therapist directory and getting-started guide; Inclusive Therapists and other culturally specific directories are established. No assumption of provider scheduling or verified insurance/availability. [Therapy for Black Girls](https://providers.therapyforblackgirls.com/).

**90-second demo/MVP.** User picks “want to discuss racial stress,” “evenings,” and “need price certainty”; app creates five questions and a short editable opening script. They log a simulated intake call as “waitlist; confirm fee,” then print the next-call card. Store only user preferences and user-entered call results; use three reviewed official access links. No chatbot relationship, diagnosis, screening score, matching algorithm, crisis triage, or booked appointment. Evaluate comprehension and time to a usable call script, not mental-health improvement. Principal harm: sensitive data exposure, implying racial concordance guarantees quality, and routing crisis needs through a slow routine-care flow. **Rank 4: feasible, useful, limited novelty.**

## 5. BP Visit Receipt — chronic-condition log to focused visit agenda

**User/moment.** A Black adult already diagnosed with hypertension has home readings, a medication access problem, and a short follow-up appointment. They need a factual, chronological one-page log and a clear question about their access barrier.

**Evidence.** CDC documents disparities in hypertension control and supports team-based care including for Black patients; that does not validate a standalone app. [CDC hypertension facts](https://www.cdc.gov/high-blood-pressure/data-research/facts-stats/index.html), [CDC team-based care, December 2024](https://www.cdc.gov/high-blood-pressure/php/data-research/team-based-care/).

**Competitors.** Hello Heart already offers connected blood pressure readings, medication support, trends, guidance, and clinical reports. Many monitor manufacturers and general health apps do logs. [Hello Heart FAQ](https://www.helloheart.com/faq).

**90-second demo/MVP.** Import a small synthetic CSV of readings, preserve the raw numbers and timestamps, add “could not refill because of cost,” generate an unclassified table and three patient-selected questions, and print. No risk colors, medication dose suggestions, predictions, device integration, or silent missing-data imputation. Evaluation: exact number preservation, duplicate detection, readable output. Main harm: wrong numbers, advice from a graph, and interpreting absent readings as good control. **Rank 5: crowded; do not choose without a real community health-worker partner and a specific unmet handoff problem.**

## 6. Denial Desk — insurance denial document checklist

**User/moment.** A patient managing chronic disease receives a denial and cannot tell what documents are missing or which office to contact. Narrow product to extracting source-linked denial reason, dates, contact instructions, and provider-document request questions; no unsupported legal deadlines.

**Evidence/competitors.** HealthCare.gov describes internal appeal and external review pathways, but rights and timelines vary by plan and jurisdiction. Fight Health Insurance already generates tailored appeal letters and searches PubMed; Counterforce and Claimable are further established products. A generic AI appeal writer has poor novelty. [HealthCare.gov](https://www.healthcare.gov/using-marketplace-coverage/appealing-insurance-company-decisions/), [Fight Health Insurance's own product explanation](https://fighthealthinsurance.com/about-ai).

**90-second demo/MVP.** A synthetic denial contains a visible missing-document reason; show every extracted field beside its source, mark a missing deadline as “not found,” and export a provider call checklist. Manual entry must work. Cut automated filing, insurer integrations, invented medical-necessity arguments, guaranteed reversals, or scraping someone else's appeal database. Evaluate 20 synthetic notices for field accuracy and false deadline invention. Main harm: missed deadline, wrong plan rights, privacy disclosure, and false confidence. **Rank 6: can build, but crowded and Black-community specificity is weak unless grounded in a real local workflow.**

## Data/API reality check

- **Available immediately:** public federal/DC policy pages and PDFs, hand-curated rules with checked dates, synthetic documents/CSV, user-entered data, browser print/PDF and .ics export. These are enough for a useful complete prototype.
- **Not assumed available:** EHR/FHIR, historical lab databases, claims, OPTN computer-system submission forms, insurer adjudication, therapist schedules, Medicaid member verification, ride-broker dispatch, closed-loop community referral, real program capacity, or clinical partner sign-off.
- **Findhelp is not a free open-data backend:** its customer terms condition API access on the contracted service and restrict scraping, caching, and use of its data. Link users to existing public services rather than treating the directory as a downloadable commons. [Findhelp customer/API terms](https://go.findhelp.com/hubfs/OnlineCustomerTerms.pdf).
- PLACES, NHANES, and broad SDOH maps can establish background context but do not provide the patient-specific permissions, eligibility, availability, or service completion required for these products. Do not let mapping consume the build.

## Team and build gate

For exactly two engineers: A owns document import/source display plus the synthetic regression corpus; B owns patient/advocate flow, source-backed packet export, deployment, and demo. Both review policy wording and spend one fixed hour on usability, rather than building another feature. Wednesday: complete the manual entry-to-packet path and frozen sample records. Thursday: add text-PDF extraction only if source referencing remains reliable; test uncertainty cases. Friday: defects, citations/date check, 3–5 task tests if feasible, backup recording, submission before midnight. Cut arbitrary photo/scanned OCR, accounts, cloud medical storage, multi-user synchronization, and automated messages before cutting the source-backed packet. No partner or API is a dependency for this reduced scope.

Winning claim: “We make a hard, existing health-system process easier to complete, and we can show exactly what our prototype does.” Do not claim clinical validation or improved health outcomes from administrative usability tests.

## Primary-source shortlist for parent synthesis (12)

1. [Implemented 2025 OPTN eGFR policy notice](https://www.hrsa.gov/sites/default/files/hrsa/optn/mac_monitor-ongoing-egfr-modification-policy-req_pnjune2025.pdf): continuing policy, September 10, 2025 effective date.
2. [HRSA professional FAQ](https://www.hrsa.gov/es/node/30193): evidence threshold, patient-held records, submissions after January 2024.
3. [HRSA patient explanation/worked example](https://www.hrsa.gov/optn/patients/resources/kidney/understanding-race-egfr): 23.3/19.2 example and clinician/team role.
4. [2026 primary JAMA abstract](https://pubmed.ncbi.nlm.nih.gov/41801177/): national policy results; remaining missed-eligibility prevalence unknown.
5. [CDC 2023 maternity-care experiences](https://www.cdc.gov/mmwr/volumes/72/wr/mm7235e1.htm): direct communication/mistreatment need.
6. [CDC March 2026 final 2024 mortality report](https://www.cdc.gov/nchs/data/hestat/hestat113.htm): most recent final rate found before cutoff; metric definition matters.
7. [CDC 2024 support-person guide](https://www.cdc.gov/hearher/campaign-resources/conversation-guide-partners.html): existing non-AI intervention/substitute.
8. [AHRQ QuestionBuilder](https://www.ahrq.gov/questions/question-builder/index.html): existing patient preparation competitor.
9. [DC Healthy Start](https://dchealth.dc.gov/am/service/dc-healthy-start): real local case management, doulas and transport, geographic restriction.
10. [AmeriHealth Caritas DC transportation](https://www.amerihealthcaritasdc.com/member/transportation): plan-specific lead times and SmarTrip constraints.
11. [DC 2025 fee-for-service handbook](https://dhcf.dc.gov/sites/default/files/dc/sites/dhcf/release_content/attachments/FFS%20Handbook%20vs%202025%20%282%29.pdf): different transportation pathway.
12. [SAMHSA 2023 national report](https://www.samhsa.gov/data/sites/default/files/reports/rpt47095/National%20Report/National%20Report/2023-nsduh-annual-national.htm): Black/White mental-health treatment gap, not mechanism or app efficacy.

All dated materials above predate October 20, 2026. Undated live product/benefit pages were inspected as current sources; operational details need rechecking before real-world use. No users or organizations were contacted. No patient documents were collected. No clinical outcome or remaining-market-size claim is verified by this research.

---

# Track 3: Community Development — DC, research as of October 20, 2026

## Decision

**Build BlockBrief: turn repeat DC 311 reports and a resident's current observations into a concise, sourced follow-up packet for a neighborhood group.** Start with illegal dumping in one DC ward. The hero artifact is an editable one-page brief with the exact public request history, the resident's explicitly labeled observations, and a clear request for an agency response. Two strong engineers can finish this in three days without a partner, private data, a map vendor, or an API approval.

**Strongest alternate: FirstBid Preflight**, a narrow DC small-business paperwork and solicitation preflight. It has a more direct economic-mobility story, but much heavier competitive overlap. GovDash already produces cited compliance matrices and outlines, including state/local contracting. Do not describe that core capability as new.

This research establishes need and feasibility, **not user validation**. No residents, organizations, or agencies were contacted. The event location and deadline were supplied by the parent researcher: DC MLK Library; two engineers; build October 21–23; submit before the Devpost October 24 12:00 a.m. EDT deadline, meaning Friday night, ahead of Saturday afternoon judging. The actual rubric has four unweighted dimensions: track fit, creativity, functionality, presentation. The rankings below are judgment, not official judging weights.

## Force ranking for two engineers

| Rank | Concept | Why this position | Biggest weakness |
|---|---|---|---|
| 1 | **BlockBrief** — repeat 311 issue → organizer-owned evidence packet | Public API actually tested; concrete DC need; visible transformation in 90 seconds; useful finished artifact; no external approvals | Dashboards and reporting already exist; must deliver resident verification and an actionable brief, not merely a map |
| 2 | **FirstBid Preflight** — solicitation + business documents → missing-items checklist | Clear money/time consequence; public official documents; highly testable extraction | GovDash is direct prior art; special DC microbusiness workflow is an access/distribution wedge, not technical invention |
| 3 | **Family House Ready** — inherited-home situation → legal-aid consultation packet | Specific generational-wealth need; emotionally compelling; local service handoff exists | Sensitive family/legal information; usefulness to actual intake staff is unvalidated; no legal determinations permitted |
| 4 | **Hearing-to-Voice** — hearing notice + resident's experience → own-voice testimony | Civic agency, clear output, can work from uploaded public notices | LIMS developer key signup; existing HMS already handles finding hearings and submissions; generic AI summary is crowded |
| 5 | **Corridor Launch Packet** — one business activity → permit/document dependency plan | Easy to understand and possible with curated public rules | DC Business Portal already has checklists, costs, timelines, and dashboard; broad version has weak novelty |

## 1. BlockBrief — recommended

**User and painful moment.** A neighborhood volunteer preparing for an ANC meeting has several request IDs and remembers the same dumping location returning after closure. They need to establish what was reported, when, and what remains visible without turning a meeting into a pile of screenshots. The user decides the priority and the ask.

**Need, with dates.** DC DPW's 2025 performance-oversight responses report **1,515 illegal-dumping service requests in Ward 8 in FY2024, 966 closed within the SLA window, and 65 closed with no action/work order**. These figures do not mean all other reports remained unresolved. DPW explicitly says its no-action metric was produced by manual analysis of comments and was being improved. [Official DPW responses, PDF pp. 1–2](https://dccouncil.gov/wp-content/uploads/2026/01/25.03.25-DPW-POH-Post-Hearing-Questions_3.24.25_FINAL-2.pdf).

On January 28, 2026, WABA independently told the Council it was concerned about tickets closed without action or explanation. This is a community organization's account, not a measured citywide prevalence estimate. [WABA testimony](https://waba.org/document/waba-2026-performance-oversight-testimony-on-the-districts-office-of-unified-communications-ouc/).

Community stewardship already exists. The National Park Service credits Ward 8 Woods with identifying a dump of more than 3,000 tires in December 2022; NPS crews removed them in January 2023. This is evidence of community agency and cross-agency work, not a claim that a new app would have caused that cleanup. [NPS, February 10, 2023](https://www.nps.gov/anac/learn/news/national-park-service-removes-thousands-of-tires-from-anacostia-park.htm). [Ward 8 Woods' own website](https://ward8woods.org/) describes its programs and already has a cleanup tracker. It is a potential future learning source, **not a project partner**.

**Honest prior art.** DC's official 311 map already displays service requests, including recent requests by ward. [Official data catalog](https://catalog.data.gov/dataset/311-city-service-requests-in-2026). [DC's To-Do List](https://viridicity.github.io/dc311/) is an existing independent SLA dashboard, announced in June 2026; do not rebuild late-ticket charts as the headline. SeeClickFix already supports reporting and duplicate merging. [SeeClickFix duplicate workflow](https://www.civicservice.civicplus.help/hc/en-us/articles/360043293074-Mark-a-Request-as-a-Duplicate).

**Differentiated wedge.** A small group selects related records, adds its own current observation, and gets an accountable, reviewable case history. Public status and resident observation remain separate: “Official record: Closed January 9” and “Resident observation, October 20: dumping visible again.” A nearby later report is only a suggested relationship until the user confirms. Closure reason absent from the public dataset must say **not provided**, never “no action” inferred by the model. No claim that the software verifies a cleanup.

**Vivid 90-second demo.** 0–15s: “Our block has reported this location repeatedly. Before the next meeting, can we show the whole history?” Pick an area and the Illegal Dumping category. 15–35s: a chronological stack of actual public request IDs, dates, statuses, and due dates appears; click one to inspect its source fields. 35–55s: select three candidate records, unselect one unrelated nearby request, and add a clearly synthetic current-condition observation. 55–75s: generate an editable brief with a short timeline, provenance, the resident's own requested action, and a source appendix. 75–90s: download the actual PDF and show the deliberately separate “official status” and “resident observation” columns. Final line: “The community chooses the issue. BlockBrief makes the evidence easier to carry into the room.”

**Exact MVP and cuts.** One ward, one service category initially; 90–180 days of records; simple block/area selection; chronological ticket list; manually confirmed groupings; one current-condition text input; editable request; PDF/print and JSON/CSV source appendix. Only add a second category if first is complete. Exclude accounts, automated complaint submission, social feed, photo recognition, neighborhood scores, race inference, prediction, real-time streaming, email delivery, push notifications, a multi-city architecture, and location-based eligibility. A lightweight plotted overview is sufficient; the demo does not require paid geocoding or map tiles.

**Immediately available data/API — verified, not assumed.**

- Official endpoint: `https://maps2.dcgis.dc.gov/dcgis/rest/services/DCGIS_DATA/ServiceRequests/FeatureServer/21` (All Service Requests — 2026).
- [API layer metadata](https://maps2.dcgis.dc.gov/dcgis/rest/services/DCGIS_DATA/ServiceRequests/FeatureServer/21?f=pjson) retrieved successfully with unauthenticated `curl` on October 20. Metadata: `capabilities: Query,Extract`, `maxRecordCount: 1000`, `supportsPagination: true`, statistics and ordered queries supported. **1,000 is a per-response record cap, not a requests/second rate.** No public requests/second quota was found; keep query volume low and cache.
- A second unauthenticated query returned three genuine Ward 8 Illegal Dumping records, `SERVICECODE=S0181`, agency `DPW`, dates and statuses, and `exceededTransferLimit:true` when deliberately capped at three. This proves access and relevant rows; it is not a product prototype or a measure of recurrence.
- Fields available include `SERVICEREQUESTID`, `SERVICECODE`, `SERVICECODEDESCRIPTION`, `ADDDATE`, `SERVICEDUEDATE`, `RESOLUTIONDATE`, `SERVICEORDERSTATUS`, `ORGANIZATIONACRONYM`, `WARD`, `LATITUDE`, `LONGITUDE`, `STREETADDRESS`, `OBJECTID`. Exclude `DETAILS` and `INSPECTORNAME`; avoid reprinting unnecessary individual addresses in the public demo.
- The [federal catalog](https://catalog.data.gov/dataset/311-city-service-requests-in-2026) marks access public and license CC BY 4.0 and offers CSV/GeoJSON downloads. It was updated October 20, 2026. **No key, signup, fee, or approval was needed in the actual query.** This is not a paid ArcGIS Online account requirement. No model API is required for the core workflow; deterministic templates can create the brief. Optional AI may condense only user-reviewed text, with numeric facts inserted from structured data.

Reproducible minimal read command (the successful research query used these fields and filter):

```sh
curl -sS --get \
  'https://maps2.dcgis.dc.gov/dcgis/rest/services/DCGIS_DATA/ServiceRequests/FeatureServer/21/query' \
  --data-urlencode 'f=json' \
  --data-urlencode "where=WARD='Ward 8' AND SERVICECODEDESCRIPTION LIKE '%Dump%' AND ADDDATE < TIMESTAMP '2026-10-21 00:00:00'" \
  --data-urlencode 'outFields=SERVICEREQUESTID,SERVICECODE,SERVICECODEDESCRIPTION,ADDDATE,SERVICEDUEDATE,RESOLUTIONDATE,SERVICEORDERSTATUS,ORGANIZATIONACRONYM,WARD' \
  --data-urlencode 'returnGeometry=false' \
  --data-urlencode 'resultRecordCount=3'
```

For production-like collection, page with the metadata-supported pagination parameters and stable `OBJECTID` ordering; deduplicate by record ID. Freeze a dated snapshot for the stage demo and show the snapshot date. Filter data to the October 20 research cutoff when evaluating tonight; local calendar date and UTC cutoffs should be explicitly distinguished in the build.

**Meaningful evaluation.** Hand-check 20 exported ticket facts against source rows: IDs, dates, statuses, agency must be 100% correct. Label 20 candidate pairs as “same site/possibly related” versus “different issue” and measure false merges; err toward keeping separate. Confirm that missing due dates never become overdue and closed status never becomes confirmed resolution. On 3–5 synthetic task runs, measure time to find the desired record, reject a false match, and export a complete brief; target under two minutes. If actual residents test later, report their actual results separately. Do not claim usability or cleanup outcomes before testing.

**Risks and go/no-go.** Reporting volume reflects who reports and which channels are used, not total neighborhood need. Do not rank communities by raw complaints. Do not identify alleged dumpers, compile faces/plates, or build enforcement surveillance. The packet asks for service or explanation. Some parks have federal rather than DC ownership; do not automatically assert DPW jurisdiction from geography. If public records contain no useful repeat examples after one hour of exploration, demo user-selected case histories rather than inventing recurrence. **GO** if a dated subset loads and the whole selection → review → export path works by the end of October 21. **NO-GO** if the team ends day one with only a dashboard and no finished brief.

**Three-day division for two people.** Engineer A owns data fetch, caching, schema handling, grouping suggestions, factual tests. Engineer B owns selection/review interface, the brief, accessibility, print/PDF, demo flow. Day 1: complete an ugly vertical slice on one category and a frozen snapshot. Day 2: source inspection, user-confirmed relationships, editing and exports. Day 3: failure cases, mobile/keyboard QA, 90-second demo and submission Friday night. Use deterministic data calculations; do not introduce an agent framework.

## 2. FirstBid Preflight — strongest alternate

**User/moment.** A two-person Black-owned service business sees a DC contract but cannot quickly tell which requirements are genuine blockers, which documents it already has, and which business-profile prerequisites are separate from the response itself.

**Evidence.** DC's disparity study, released April 2023, examined FY2017–FY2020. It identifies prequalification, licenses, bid criteria, and short lead times among reported barriers. The study gives Black-owned firms a DC government subcontract disparity index of **47**, where 100 is parity relative to estimated availability; this is an old-period procurement metric, not today's business success rate. [Full study, chapters 4, 8 and 10](https://dmped.dc.gov/sites/default/files/dc/sites/dmped/page_content/attachments/Government%20of%20the%20District%20of%20Columbia%20Disparity%20Study.pdf), [official study context](https://dmped.dc.gov/page/district-columbia-disparity-study).

**Prior art/novelty.** [GovDash's actual documentation](https://support.govdash.com/v1/docs/compliance-matrix-and-review-mode) already describes line-by-line shreds, citations, document viewer, and Excel compliance exports. [GovDash's November 2025 SLED expansion](https://www.govdash.com/blog/govdash-expands-platform-to-include-state-local-and-education-%28sled%29-contracting) eliminates “it only does federal” as a differentiation claim. [Green Book DC](https://greenbook.dslbd.dc.gov/) already has searchable spend data and a worksheet; [CBE Connect](https://dslbd.dc.gov/page/cbe-connect-0) covers discovery; [DC APEX](https://dslbd.dc.gov/page/dc-apex-your-success-our-success) provides assistance at no cost. The plausible wedge is a small, accessible **first-bid preflight and human-adviser handoff**, not a new RFP writer or contract finder.

**Demo.** Upload one historical official solicitation plus a deliberately synthetic business document inventory. Show required attachments with exact page evidence; flag an absent past-performance reference; separate “solicitation requirement,” “vendor profile prerequisite,” and “ask adviser.” Mark two items obtained; export checklist and a short APEX consultation summary. A truthful “you cannot establish this requirement from current evidence” is a better reveal than a fabricated compliant proposal.

**MVP/cuts.** One DC service category, text-readable PDFs only, manually verified extraction schema, document inventory metadata, missing/unknown/present states, citations and downloadable checklist. No auto-bidding, signatures, tax documents, SSNs/EINs, legal assurance, pricing, probability of winning, broad crawler, certification claim, or full proposal drafting. Use synthetic document metadata in the demo.

**Data/gates/cost.** Public [OCP solicitation documents](https://ocp.dc.gov/page/solicitation-documents) and an official [2026 DCPS RFQ with amendment and attachments](https://dcps.dc.gov/page/gaga-2026-q-0030-dcps-security-services) are readable without payment. The latter closed in April 2026: label it a practice case, not an open opportunity. Another source is [UDC's 2025 janitorial RFP](https://docs.udc.edu/procurement/RFP-No-GF-2025-R-0012-Janitorial-Services.pdf). Static downloads have no documented rate quota; cache once, no API subscription needed. OCP's live portal relies on JavaScript and directs bidders into Ariba/eSourcing; registration is a real bid gate, not something the prototype can remove. **Specific caution:** the OCP W-9 “within 90 days” rule is for creating/updating a PASS profile; do not present it as a blanket bid rule. CBE certification itself requires registration in DES; the [official CBE Wizard already provides eligibility guidance and a document checklist](https://dslbd.dc.gov/page/new-applicants).

**Evaluation/risk/go-no-go.** Two engineers independently label 25 must-do requirements in one complete solicitation+amendment; compare extraction precision/recall and verify every citation. Critical deadlines and required attachments should have zero omissions before demo. Treat conflicting amendments and unreadable scans as stop/review conditions. GO if an entire real packet is obtainable tonight and yields 20+ meaningful requirements with citations. NO-GO if only contract titles and summaries are accessible. Do not promise contract awards or legal compliance.

## 3. Family House Ready — bolder, more sensitive option

**User/moment.** A DC family member wants to preserve an inherited home but is unsure what is known about the title, prior family deaths, and missing documents before calling legal aid.

**Evidence.** DC's [Heirs Property Assistance Program](https://dhcd.dc.gov/page/heirs-property-assistance-program) launched October 2, 2023 for low-income households with potential claims to residential property in probate or with unclear title after an owner's death, administered by DC Affordable Law Firm and Legal Counsel for the Elderly. [DCALF's current probate page](https://www.dcaffordablelaw.org/probate-and-estate-planning) describes free intake, property checkups, community workshops, and a May 2026 coordinated homeownership/wealth initiative. These are real resources, not proof of app demand. [October 1, 2026 community event](https://www.dcaffordablelaw.org/dcalf-events) establishes contemporary local activity.

**Prior art/novelty.** [HeirShares' founder, May 28, 2026](https://heirshares.beehiiv.com/p/let-s-clear-the-dirt-what-heirshares-actually-does-and-why-it-matters) says it pivoted from a family-tree app toward specialized parcel data and consulting. [Mississippi State's curriculum](https://srdc.msstate.edu/heir_property/understanding-heirs-property-curriculum) already includes family-tree and landowner-intake tools. The differentiator could be an accessible, user-controlled **DC consultation packet with unknowns visible**, not automatic heir identification or title clearing.

**90-second demo/MVP.** A fictional resident says “the house is still in Grandma's name.” Add four fictional relatives and mark uncertain facts; add document-presence labels (not uploads); answer what the family hopes to achieve; export a factual chronology, questions for counsel, document inventory and source-linked local intake paths. Show a missing/unknown branch without guessing who owns anything. Browser-local, ephemeral state; large text and print; sample case included. Cut court forms, ownership fractions, legal deadlines, legal advice, property searching, scraping probate cases, real deeds, financial eligibility decisions, and automatic referrals/messages.

**Data/gates/cost/evaluation.** Public program pages and educational worksheets only, zero paid API or signup for reading; legal representation has eligibility and intake gates and is not guaranteed. Test 10 fictional family scenarios for exact transcription, explicit unknowns, and zero ownership/legal conclusions; measure whether the exported packet contains each user-supplied fact. User testing with counsel would strengthen it but no partner is assumed. GO only if the team accepts the narrow preparation role; NO-GO if the pitch depends on “AI clears your title,” attorneys adopting it by Saturday, or collecting real family records.

## 4. Hearing-to-Voice

**User/moment.** A renter, shop owner, or neighborhood organizer learns of a relevant DC hearing and wants to connect their own experience to an actual agenda item and submit a coherent comment before the real deadline.

**Evidence/prior art.** [DC Council's testimony instructions](https://dccouncil.gov/how-to-testify-before-the-council/) make clear that each hearing has its own notice and record deadline; written-only submissions are supported. [HMS/LIMS already provide hearing discovery, registration, submission, bill tracking, and documents](https://dccouncil.gov/tips-and-resources-for-being-informed-about-the-council/). [ANC Digest](https://ancdigest.org/) already advertises AI summaries of ANC resolutions; [Documenters](https://www.documenters.org/about/) already organizes paid, fact-checked community meeting coverage. Basic agenda summarization has weak novelty.

**Demo/MVP.** Upload a public hearing notice; extract date, topic, source and explicit deadline; user selects an item, writes three facts from lived experience, edits a two-minute statement, downloads it and follows the official submission link themselves. All positions and requested action come from the user. A source panel shows exactly which hearing notice supports each logistical claim. Cut automated political persuasion, emailing officials, mass comments, translations beyond tested languages, and broad all-ANC crawling.

**Data/gates/cost/evaluation.** [LIMS official API help](https://lims.dccouncil.gov/api/help/index.html) explicitly links developer-key signup; approval latency, price, and quota were not verified. Do not make API access a deadline dependency. Public notice upload and cached official examples cost no data-access fee. Do not carry NYC's 72-hour rule into DC: the DC notice governs. Evaluate 10 notices for exact dates, topic, deadline, and appropriate abstention when a deadline is absent. GO with upload-first path and actual document export; NO-GO if it remains a generic chatbot or requires an unapproved API key.

## 5. Corridor Launch Packet — deprioritize

**User/moment.** A neighborhood microbusiness wants to start one narrowly defined activity and keeps losing track of prerequisites across tax registration, occupancy, business licensing and sector requirements.

**Evidence/prior art.** [DLCP's 2023 oversight testimony](https://dlcp.dc.gov/sites/default/files/dc/sites/DLCP/release_content/attachments/Department%20of%20Licensing%20and%20Consumer%20Protection%20FY24%20Budget%20Oversight%20Hearing%20Testimony%20FINAL.pdf) explains the problem and explicitly states its Business Portal already offers to-do checklists, estimated costs, processing times, and a dashboard. The [live contracting-business checklist](https://business.dc.gov/en-US/checklist/?business-type=0590c269-0f9e-ed11-aad0-001dd804ff6e) and [licensing FAQs](https://dlcp.dc.gov/page/business-licensing-faqs) show substantial existing coverage. A generic permit navigator largely recreates government tooling.

**Demo/MVP/data.** If pursued, pick one activity and one “what am I missing before my appointment?” outcome. User enters non-sensitive activity facts, receives a source-linked dependency plan, checks off document-presence states, prints an appointment packet. Public DLCP pages are free, no public transactional API was verified, and actual applications require the official system. Rules must be manually curated and dated; no claims of issuing permits or exact fees unless verified on the current activity page. Test 10 input profiles against the current official checklist. NO-GO for broad licensing, dynamic legal interpretation, or a pitch that does not explain why the existing portal is insufficient.

## Source quality and unresolved questions

- High-confidence: official 311 endpoint and record access; metadata record cap/pagination; DPW's published historic counts with caveat; OCP forms and exact scope of W-9 rule; existence of government and community service workflows.
- Medium-confidence: community organizations' accounts establish lived operational concerns but not causal evidence that these concepts will improve outcomes. Product documentation establishes advertised features, not product quality or market share.
- Unvalidated: actual residents' willingness to use BlockBrief; whether an ANC or agency would find its packet useful; frequency of true same-site recurrence; present procurement-readiness pain for a particular DC owner; legal-aid intake staff's preferred format.
- No future-only events or post–October 20, 2026 evidence was used to justify a concept. An apparent February 2027 heirs workshop search result was discarded. Existing sites can change; freeze the sources used in the demo and show dates.

**Tonight's choice:** Pick BlockBrief if the goal is the best balance of track fit, distinctive workflow, independently obtainable data and a complete two-person build. Pick FirstBid only if the team already understands contracting and can explain its narrow public-access preflight wedge honestly. Family House Ready has strong human stakes but should remain a careful alternative until the desired consultation artifact is validated.
