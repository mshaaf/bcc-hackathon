# Decision log

## Latest continuation — October 21

The user rejected the current form/brief experience, welcomed real maps and public crime-data exploration, and challenged overlap with Citizen. The assistant recommended resident-led improvement campaigns with a map, source-linked evidence, owned follow-ups, and saved progress; crime would be optional context. This is the current proposal, not blanket approval of a final scenario, AI provider, library, or every feature.

The latest user request authorizes **documentation and a detailed Claude handoff**, with account usage conservation. That handoff is complete in [HANDOFF.md](HANDOFF.md); **R1** is the next revision batch. No revised product code or dependency was added. Baseline phases 1–3 and the audited app at `687582a` remain valid history. Do not resume old Phase 4 polish as the next step.

The decision table and confirmed scope below describe the original baseline unless explicitly stated otherwise. The project/track choice remains confirmed. New API access, crime-data caveats, Flock limitations, Citizen overlap, and pending builder decisions are documented in the handoff and [feasibility evidence](../research/evidence/campaign-feasibility-2026-10-21.json).

Updated October 21, 2026. Use this file for current status when older reports disagree.

| Decision | Status | Rationale |
|---|---|---|
| Team size: two strong generalists | Confirmed by user | Scope must fit two people, even though the event permits larger teams. |
| Three build days, October 21–23 | Planning constraint | Core workflow must work on day one. |
| Compare all three tracks | Research complete | Two finalists per track were compared before the user's selection. |
| Judge participation and memorable identity | Confirmed preference | The user asked for “hella LARP” and “hella aura.” Interpret this as meaningful agency and a memorable reveal. |
| Familiar problem plus a specific moment | Agreed design direction | Avoid generic tools and ideas that take too long to explain. |
| Show final product and presentation before building | Confirmed by user | Six interactive concepts and pitch storyboards were prepared. |
| Create this workspace and configure supplied GitHub remote | Authorized October 21 | Preserve research and create a concrete handoff. |
| Luna terminal executes numbered phase batches | Confirmed by user October 21 | Use the phase plan and ledger; continue through requested phases when checks pass. |
| Select Block Ops / Track 3 — Community Development | Confirmed by user October 21 | User: “we are going forth with Block Ops.” This is the active implementation scope. |
| Select The Switch | Alternative, not selected | Stronger AI-specific spectacle; requires early experimental validation. |
| Select Casebreaker | Alternative, not selected | Clear document discrepancy and useful packet; track story needs care. |
| Product stack | Builder decision, October 21, 2026 | Node.js 20+ built-ins, ES modules, and native browser HTML/CSS/JavaScript. No package dependencies or model provider. A small local Node server serves the app and proxies one fixed public-data query. |
| Public-data query | Builder decision, October 21, 2026 | DC 311 FeatureServer/21; Ward 8, service description containing “Dump,” rolling 90-day window in the layer's America/New_York calendar, 1,000-row maximum. Request only IDs, category, dates, official status, ward, organization, address, and OBJECTID; exclude details, inspector names, coordinates, and geometry. Fail closed on a transfer-limit flag. |
| Candidate grouping | Builder decision, October 21, 2026 | Group by normalized street name and category as a review suggestion. Show each original address in the source inspector; require a human to include/exclude every proposed record. Shared street is not evidence of one incident or recurrence. |
| Local state and fallback | Builder decision, October 21, 2026 | Keep draft state in browser memory only. Bundle a clearly fictional sample for offline operation; it is not a cached public response. A failed refresh keeps the current draft and reports the failure. Bind the server to 127.0.0.1. |
| Export | Builder decision, October 21, 2026 | Generate current-state Markdown for download and use browser print for PDF. Include selected source IDs, original dates/statuses, snapshot metadata, user wording, explicit unknowns, and the two tasks. Never export excluded records. |
| Runtime and checks | Builder decision, October 21, 2026 | Node.js 20+; `node server.mjs`, `node --test`, and `node scripts/prove-data.mjs`. No install step or secrets. |
| License | Open | Do not choose a legal license as a setup default. |

## Recommendation history

The original synthesis recommended **Reclaim** for its specific policy-based story. After the user emphasized participation and aura, **Block Ops** became the overall recommendation and **The Switch** became the higher-variance challenger. This is a change in design priorities, not new evidence that Reclaim is ineffective.

The latest six-finalist document also identified **Casebreaker** as the strongest alternative for a team preferring document processing over civic data. The user subsequently selected **Block Ops**. The earlier comparisons remain research history, not competing implementation instructions.

## Names across the research

| Current name | Earlier name(s) | Track |
|---|---|---|
| The Switch | DialectLens | AI |
| Casebreaker | Second Look | AI |
| The Room | My Words My Visit | Healthcare |
| Reclaim | Backdate | Healthcare |
| Block Ops | BlockBrief | Community |
| People's Chamber | Hearing-to-Voice | Community |

## Confirmed Block Ops scope

**Selection:** Block Ops, October 21, 2026, explicitly chosen by the user. **Primary track:** Community Development. **Promise:** a neighborhood group turns reviewed service-request history, its own observations, and a chosen next move into a usable brief.

**Initial build scope from the researched MVP:** one DC ward and one service category, starting with Ward 8 / Illegal Dumping; a bounded dated snapshot; source inspection; manual include/exclude review of candidate records; a dated resident observation or explicit unknown; a concrete ask; two role-based tasks; and a printable brief with source appendix. These operational defaults narrow the build; the user did not separately prescribe the ward or category.

**Judge action:** reject a report from another site and see the timeline and exported brief change. **First technical gate:** reproduce the bounded public-data load, preserve original fields, and demonstrate explainable candidate grouping without asserting recurrence.

**Cuts:** accounts, multiplayer, monitoring, automatic complaints/dispatch, neighborhood scoring, predictions of resolution, and privileged government integrations. Keep real public data separate from explicitly fictional stage observations.

**Current implementation:** Phase 1 finalized the stack and file-level plan. Phases 2–3 prove the public-data path and build the working loop. No model, database, login, official ticket submission, push, deployment, or external submission is in scope.
