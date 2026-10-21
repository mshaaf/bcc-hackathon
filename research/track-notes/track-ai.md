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
