# BCC Hackathon 2026

**Latest scope:** the user wants a community where neighbors discuss local concerns, join shared missions, claim jobs and post follow-ups. The existing map/campaign app is reusable but browser-local. Shared social features are not implemented. Start with [community-missions.md](docs/specs/community-missions.md), the [S1–S4 execution plan](docs/superpowers/plans/2026-10-21-community-missions.md), and the [current ledger](docs/PHASE-STATUS.md). R5 release work waits for that social slice. Supabase is a proposed provider, not configured infrastructure.

Block Ops — Track 3, Community Development. **Current planning direction:** a map-centered workspace for resident-led neighborhood improvement campaigns. The final scenario and detailed revised scope remain to be settled in R1.

**What actually runs:** a DC 311 review → plan → brief app, completed through baseline phases 1–3 with additional reliability/UI repairs. The user rejected that experience as the final hackathon presentation. The map workspace with saved campaigns (R2–R3) is the main page; crime integration and AI are not implemented. Start with the [Claude / Luna handoff](docs/HANDOFF.md); revision batches **R1–R4** are done (see [campaign revision spec](docs/specs/campaign-revision.md)); **R5** (freeze and release package) is next; the draft pitch is [docs/PITCH.md](docs/PITCH.md). The earlier concept previews are historical reference material.

Repository: [mshaaf/bcc-hackathon](https://github.com/mshaaf/bcc-hackathon).

## Start here

1. [Detailed Claude / Luna handoff](docs/HANDOFF.md): actual code, scope proposal, source evidence, revision phases R1–R5, and copy/paste prompts. [CLAUDE.md](CLAUDE.md) is the concise entry point.
2. [Phase status](docs/PHASE-STATUS.md): baseline phases 1–3 are complete; revision R1 is next. [Block Ops specification](docs/specs/block-ops.md) distinguishes the baseline contract from the revision proposal.
3. [Decision log](docs/DECISIONS.md): confirmed choice, initial scope, and remaining technical decisions.
4. [Project brief](docs/PROJECT-BRIEF.md): event, team, constraints, and success criteria.
5. Run the current app with `node server.mjs` and open `http://127.0.0.1:8000`. The [six concept previews](previews/finalists.html) are the earlier comparison, not the implemented app.

## Research shortlist — reference

| Track | Idea | Product promise |
|---|---|---|
| AI: Ethics and Access | The Switch | Inspect whether an AI intake summary preserved the applicant's facts and challenge each claim against its source. |
| AI: Ethics and Access | Casebreaker | Trace a background-report disagreement to supplied source documents and prepare a correction request. |
| Modern Healthcare Outcomes | The Room | Practice a patient-chosen communication goal and carry the preferred words into a visit. |
| Modern Healthcare Outcomes | Reclaim | Organize historical kidney records for a transplant-team waiting-time review conversation. |
| Community Development | Block Ops | Turn reviewed service-request history and resident observations into a group brief and next-step plan. |
| Community Development | People's Chamber | Rehearse public testimony and sharpen a resident-owned request using sourced hearing context. |

## Build handoff

- **Start the next session here:** [detailed handoff](docs/HANDOFF.md) and [current phase status](docs/PHASE-STATUS.md). Revision phases R1–R5 replace automatic continuation of baseline phases 4–6. The [old Luna plan](docs/superpowers/plans/2026-10-21-luna-phase-execution.md) is retained for baseline history.
- [Specification](docs/SPECIFICATION.md) and [six conditional project specifications](docs/specs/README.md).
- [Goal plan](docs/GOAL-PLAN.md), [three-day implementation plan](docs/IMPLEMENTATION-PLAN.md), and [proposed architecture](docs/ARCHITECTURE.md).
- [Test plan and preview verification](docs/TEST-PLAN.md).
- [Demo and presentation plan](docs/DEMO-AND-PRESENTATION.md) and [submission checklist](docs/SUBMISSION-CHECKLIST.md).
- [Open questions](docs/OPEN-QUESTIONS.md) and [agent instructions](AGENTS.md).
- [Repository setup and publishing status](docs/REPOSITORY.md).

## Research archive

The [research index](research/README.md) links the full original research, the earlier decision brief, the aura reassessment, track reports, source index, and public-data evidence. Earlier recommendations are retained as history; use the current decision log to understand their status.

The original chat files remain intact. The import manifest records the source-to-repository mapping. Markdown links were normalized for portability.

## Local preview

No application install or API key is needed for the concept previews. Open `previews/finalists.html` directly, or serve this folder with:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Then visit `http://127.0.0.1:8000/previews/finalists.html`. The preview has local interactions and may request web fonts; fallback fonts work without them. See [preview notes](previews/README.md).

## Block Ops MVP (Phases 2–3)

Requires Node.js 20 or newer. There are no package installs, API keys, or environment variables.

```sh
node server.mjs
```

Open `http://127.0.0.1:8000`. **Practice case** uses clearly fictional offline data; **Live DC records** requests a bounded Ward 8 / Illegal Dumping snapshot from the official source. Review the history, use the selected records, plan the group's request and tasks, then open the brief. The app keeps drafts in memory and exports the current reviewed state as Markdown; use the print dialog to save a PDF.

Baseline visual rules are in [DESIGN.md](DESIGN.md), with [product context](PRODUCT.md) and [review screenshots](docs/ui-review/README.md). They document the current app; the user did not approve this as the final presentation experience. See the handoff for the proposed revision. Changing source or candidate street starts a fresh observation; a failed refresh preserves the current draft.

Run the checks with `node --test`. Reproduce the live data proof with `node scripts/prove-data.mjs` (requires network access).

See [the baseline Block Ops specification](docs/specs/block-ops.md), [architecture](docs/ARCHITECTURE.md), [implementation plan](docs/IMPLEMENTATION-PLAN.md), and [verification evidence](docs/TEST-PLAN.md). The app does not submit tickets or establish whether a reported condition remains present.
