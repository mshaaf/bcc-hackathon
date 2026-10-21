# Track 3, reconsidered for “hella LARP” and “hella aura”

Research/design assessment: October 20, 2026. Exactly two engineers, three build days (October 21–23), submit Friday night before October 24 12:00 a.m. EDT. Existing source research and successful DC311 API tests remain valid. This is concept design, not product implementation or claimed user validation.

## Verdict

**Block Ops wins the combined shipping-and-stage recommendation. People's Chamber is the strongest challenger if the team enjoys performing in front of the judges.** The new preference substantially upgrades Hearing-to-Voice and moves FirstBid down: an efficient procurement product has less natural theater than residents taking the floor or organizing a block.

Interpret “LARP” as the audience taking a meaningful role in an operating workflow. Interpret “aura” as a clear identity, stakes, an audience decision that changes the product, and a reveal the audience can inspect. A new name and a dark map do not meet that bar. All scores below are subjective stage-potential judgments, not official judging weights.

| Overall rank | Earlier idea → reworked concept | Aura / 5 | Decision | Audience's consequential role | Real artifact at the reveal |
|---|---|---:|---|---|---|
| **1** | BlockBrief → **Block Ops** | **5** | **Rework; recommended** | Records keeper rejects a false grouping; group chooses a follow-up action within its stated availability | Source-backed issue timeline, resident observation and a small action plan, exported together |
| **2** | Hearing-to-Voice → **People's Chamber** | **5** | **Rework; stage favorite** | Judge plays the chair; resident takes the floor, answers one practice question, revises their own request | Actual editable testimony, rehearsal notes and official submission handoff |
| **3** | Family House Ready → **The Legacy Room** | **4** | **Rework; emotionally powerful, narrower** | Family archivist selects which fact is known and which question belongs with counsel | Factual family/property chronology, known/unknown inventory, counsel questions and verified aid routes |
| **4** | FirstBid Preflight → **The Bid Room** | **3** | **Keep as practical alternate** | Judge is the reviewer who challenges the evidence behind a requirement | Actual document manifest and missing/unknown checklist with exact source citations |
| **5** | Corridor Launch Packet → **Open for Business** | **2** | **Drop as the main entry** | Founder chooses an activity and resolves one prerequisite | Activity-specific preparation plan; existing DC portal already covers much of the value |

The actual event rubric remains track fit, creativity, functionality, and presentation. No official weights were provided. “Aura” is a way to improve creativity and presentation while leaving the other two dimensions fully testable.

## 1. Block Ops: a neighborhood runs its own situation room

**Role fantasy:** “We are the neighbors who keep the record and decide the next move.” The room is about service follow-through, meeting preparation and community stewardship. Participants play neighbor, records keeper and meeting speaker. There are no suspects, patrols, police dashboards, enforcement targets or surveillance roles.

**Substantive interaction upgrade.** Replace the browsing dashboard with one active **case table**. A group opens an issue, inspects proposed related requests, confirms which belong together, adds a dated current observation, chooses an ask, and places two or three tasks in an ordered plan. Suggested tasks are concrete: check the public record; confirm present conditions safely; prepare a request for a closure explanation; bring the packet to the group's chosen meeting. The group states its own availability and assigns role labels. The app flags an overfull plan or missing dependency and lets the group reduce scope. This is a functioning small planning tool with evidence, not an autonomous organizer.

**Stage sequence, 90 seconds.**

1. **0–15s:** “Our neighborhood group has a meeting tomorrow. We have several ticket IDs and one minute to make the history legible.” Open a dated public-data case.
2. **15–35s:** Ask a judge, “You're our records keeper: does this nearby request belong to the same issue?” The judge removes an intentionally questionable grouping. The timeline and counts immediately update.
3. **35–55s:** The second engineer, playing a fictional neighbor, adds an observation clearly labeled **Demo resident observation**. The screen places official status and the resident's observation side by side, each with its provenance.
4. **55–70s:** The judge chooses between “request a closure explanation” and “bring this history to our meeting.” Give the group a simple availability constraint; rearrange two real plan cards.
5. **70–90s:** Export the actual one-page brief and task plan. Open the resulting file. The payoff is the group's evidence and chosen action made portable.

**Visual identity.** A civic workshop table: warm off-white canvas, deep plum headings, sunflower task tabs, large request IDs, stamped dates, and clear paper-like evidence cards. One projected case table replaces a wall of charts. Minimal motion should follow meaningful events: removing a false grouping, confirming an observation, assembling the brief. Use a simple area schematic if needed; skip a geographic map as the visual centerpiece.

**Executable core in 72 hours.** Existing verified DC311 query, cached snapshot, one ward/category, manually confirmed relationships, observation input, locally editable action cards, factual timeline and print/PDF export. Role labels and same-screen handoff create participation without multiplayer. Engineer A owns data and correctness; Engineer B owns the case table, plan and export. AI may condense the group's own reviewed text, but structured fields drive all counts and dates.

**Disclosed simulation.** The participant roles, current-condition observation and availability constraint are a fictional workshop scenario. City records and the selected plan/export operate for real. The city does not respond during the demo. A closed ticket never becomes proof of a fixed condition. No fake live city integration, fake cleanup success or implied endorsement.

**Why it could win.** The audience performs an important decision, sees a correction propagate, and inspects a useful output. The verified public API reduces integration risk. Existing dashboards and SeeClickFix make a generic ticket map unoriginal; this version adds a community-owned operational workflow. **Kill criterion:** if day one ends with a map and no editable, exported case brief, cut the map immediately.

## 2. People's Chamber: residents rehearse taking the floor

**Role fantasy:** “This is our practice chamber. I can bring my own experience into the public record.” It is a rehearsal space with a clear **Practice session — not an official Council proceeding** label. It does not impersonate a named official or claim to represent public opinion.

**Substantive interaction upgrade.** A source-backed hearing context sits beside a **floor card** containing the resident's own experience, impact and requested action. A visible timer gives the resident floor time. After the first attempt, a participant acting as chair selects one practice question. The resident chooses whether and how to revise their ask. Government facts have notice citations; personal experience remains explicitly user-supplied. The tool can flag a missing request, an unsupported institutional claim or a statement that exceeds the user's chosen length. It must not score accents, confidence, ideology or emotional delivery.

**Stage sequence, 90 seconds.** 0–15s: show the actual public hearing notice and its date; label a historical notice as historical if used. 15–30s: the resident enters two short lived-experience facts and an ask. 30–45s: “Chair, give me the floor.” A judge activates the floor token and timer. 45–60s: the judge picks a practice question such as “What specific action are you asking for?” 60–75s: the resident edits their own answer, and the app rebuilds the testimony with source-backed context. 75–90s: download actual testimony and open the official handoff page, showing the notice-specific submission deadline or “not stated” when absent.

**Visual identity.** Warm ivory, oxblood, restrained brass accents, a very large speaker timer and a typography-led lectern view. The source notice remains visible as a document at the side. The floor card is the hero, not an avatar. No official seals, fake government branding or manufactured applause.

**Executable core.** One manually verified hearing context with source document; resident-input form; editable draft; timer; one practice-question interaction; revision history; download; official portal link. All can run on one laptop. A human playing chair works better than adding a fragile voice agent. If AI is included, generate a real practice question grounded in that hearing and the user's draft, and label it as practice. A small fixed question set is also legitimate if presented as fixed prompts. Recording, speech recognition, streaming voice, avatars, live multiplayer and all-hearing ingestion are cuts.

**Disclosed simulation.** The chair and follow-up question simulate rehearsal; they are not a real Council response. The testimony artifact and document evidence are real functions. “Submission handoff” means the user reviews and submits in the official system; no submission occurred in the demo. The LIMS API's developer-key signup remains a gate, so the build uses public uploaded/cached notices.

**Tradeoff versus Block Ops.** Stronger natural theater and a direct audience role; weaker data moat and greater risk of becoming “ChatGPT writes testimony.” It earns second place only if the revision loop, source traceability and timed floor interaction are fully working. This is the best pick for a team comfortable speaking as part of the demo.

## 3. The Legacy Room: a family makes its history usable

**Role fantasy:** “We are the stewards of this family's story. We can arrive at a legal-aid conversation with our facts and unknowns organized.” Ownership, eligibility and legal outcomes remain for qualified professionals.

**Substantive interaction upgrade.** Turn a linear questionnaire into an **archive table**: a fictional house, family relationships explicitly entered by the user, a chronology, and document-presence cards. Selecting a relationship reveals the source of the information: known by the user, document present, or unknown. The user can correct a date or mark uncertainty, then assign a family task such as locating an existing document or writing a question for counsel. A missing connection becomes a visible question, never an inferred heir or ownership percentage.

**Stage sequence.** Present one entirely fictional multigeneration family. The judge chooses which of two uncertain facts the family knows. The timeline updates and a new counsel question appears. Add one simulated document-presence card, show the corresponding known/unknown change, then export the consultation packet with real DC aid links. End with what the family now has organized, not a verdict that the home has been saved.

**Visual identity.** Indigo, copper and warm paper; an archive rather than a game board. Family connections use readable threads and explicit labels. No ghost ancestor, simulated voice of a deceased relative, sensational “lost house” animation or ownership victory stamp.

**Real core and cuts.** Browser-local fictional demo; typed relationships and dates; document inventory without uploads; counsel-question list; program information; print/export. Cut actual deeds, probate scraping, AI extraction of family records, title search, ownership calculations, legal form preparation, tax deadlines, auto-referrals and collaboration invitations. The narrative and family are disclosed simulation. The organization/export and public service resources function for real. A family can stop or leave an unknown without being penalized by a readiness score.

**Why third.** It has a stronger emotional reveal than procurement, and the DC assistance program is real. The missing piece is evidence that the packet matches legal-aid intake needs. An unvalidated legal-adjacent workflow and very sensitive information make it a less reliable three-day winner. An impressive family tree alone is insufficient; the useful export is mandatory.

## 4. The Bid Room: small-business paperwork gets a live evidence review

**Role fantasy:** “We are the bid team with a deadline, and every requirement needs a receipt.” A judge becomes the reviewer, not the procurement officer granting approval.

**Substantive upgrade.** Give the user a **submission manifest** with Present, Missing and Unknown states. Each requirement opens its exact source location. Business-profile prerequisites and solicitation-specific requirements remain visibly distinct because that distinction affects what the owner should do. A reviewer can challenge an item, correct its state and add an adviser question. Updating the inventory updates the actual export.

**Stage sequence.** Load one historical official solicitation and a synthetic small-business document inventory. Ask the judge to challenge a highlighted requirement. Open its source, find the evidence, mark a missing attachment, and export a packet for a DC APEX conversation. Use a mock deadline only when labeled scenario time; do not display an expired April deadline as if it is current. Do not invent an amendment change for drama. If amendment handling is demonstrated, the actual change must have been independently checked beforehand.

**Visual identity.** A clean bid-room wall: large deadline label, stamped document tabs, precise type, and a prominent “Show source” interaction. The reveal is a complete manifest of knowns and gaps. Avoid a green “compliant,” “approved” or “ready to win” stamp.

**Real core/simulation.** Source-grounded requirement extraction, corrections, inventory states and manifest download are real. Company profile and document inventory are fictional. There is no real bid submission, certification or award. Core product overlap with GovDash is substantial; the defensible story remains accessible DC first-bid preparation and human-adviser handoff. No auto-bidding or proposal-writing suite.

**Why fourth now.** Useful and testable, but the user's new preference exposes the limits of its theater. A stopwatch and dark UI do not make document checking audacious. Keep it if economic mobility matters most or the team already knows procurement.

## 5. Open for Business: attractive interaction, insufficient differentiation

**Role fantasy:** “I'm opening a neighborhood business and can see what has to happen next.” The tempting immersive treatment is a small storefront whose preparation stations unlock as prerequisites are recorded.

**Substantive upgrade, if retained.** One activity only; show a source-linked dependency path; user records that a prerequisite is obtained, missing or uncertain; the appointment checklist changes. The audience chooses one legitimate business scenario and resolves one blocker. A visual storefront can reflect the checklist state, but it must not imply the city has granted permission to open.

**Real core/simulation.** A curated dependency graph and downloadable plan can work. The storefront, opening sequence, founder profile and any timeline assumptions are scenario elements. Official licenses, permits, inspections, fees and actual applications remain outside the app. Do not add a fictional “permit granted” ending.

**Visual identity.** A daylight storefront notice wall with a clear activity path; warm physical signage and practical document cards. Avoid generic “License Quest” keys, coins and levels that trivialize compliance burdens.

**Why drop.** DC's existing Business Portal already provides checklists, processing-time estimates, costs and a dashboard. A staged storefront opening adds presentation, but it does not close the novelty gap. The activity-specific rules also create more source-maintenance work than two engineers need. If kept, it belongs as a later module in a larger business-support product, not this entry.

## Shared implementation ceiling and demo honesty

- **One laptop, one scene, one hero artifact.** Audience participation is a same-screen decision with visible consequences. No live room infrastructure is necessary.
- **Day 1:** obtain and date the source snapshot, finish the full input → decision → export path. **Day 2:** source inspection, revision/confirmation and the audience action. **Day 3:** factual edge cases, keyboard/mobile access, stage polish, rehearsal and Friday submission. Source availability is already proven for Block Ops.
- **Functional evidence:** a judge can change an input, watch derived facts update, open the source and inspect the resulting export. A prerecorded happy path is backup only and must be labeled.
- **No pretend integration:** simulated people, stories and institutional responses are explicitly marked. Public records and user-triggered computations can be genuinely live or clearly dated snapshots. AI outputs, if used, should be actual executions or disclosed saved examples.
- **No implied adoption:** agencies, DCALF, ANCs, WABA and Ward 8 Woods have not partnered with this team or validated these artifacts. Community members choose their purpose and retain control over the account of their experience.

## Existing evidence supporting these choices

No new API dependency or new competitor functionality was introduced, so no additional browsing was necessary. See `research/track-notes/track-community.md` for the research and verified query details.

- [Verified public DC311 layer and metadata](https://maps2.dcgis.dc.gov/dcgis/rest/services/DCGIS_DATA/ServiceRequests/FeatureServer/21?f=pjson): no key needed in tests; 1,000 records per response; pagination supported; no published requests/second quota verified.
- [DPW's official 2025 oversight responses](https://dccouncil.gov/wp-content/uploads/2026/01/25.03.25-DPW-POH-Post-Hearing-Questions_3.24.25_FINAL-2.pdf): historical service counts and important closure-data caveats.
- [WABA's January 2026 testimony](https://waba.org/document/waba-2026-performance-oversight-testimony-on-the-districts-office-of-unified-communications-ouc/): concerns about closed tickets without explanation.
- [DC Council's actual testimony process](https://dccouncil.gov/how-to-testify-before-the-council/): hearing-specific deadlines and official submission options.
- [DC heirs-property assistance](https://dhcd.dc.gov/page/heirs-property-assistance-program) and [DCALF probate services](https://www.dcaffordablelaw.org/probate-and-estate-planning): real service pathways; no promise of legal eligibility or representation.
- [GovDash's compliance-matrix documentation](https://support.govdash.com/v1/docs/compliance-matrix-and-review-mode): direct overlap that must remain acknowledged in The Bid Room.

**Recommendation to the team:** Choose **Block Ops** for the strongest combination of a working core, public data, community agency and an audience decision with consequences. Choose **People's Chamber** if you want the audience to remember the moment a resident takes the floor, and are willing to perform the rehearsal live. Both can have real aura without pretending to possess institutional authority.
