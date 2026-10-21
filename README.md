# BCC Hackathon 2026

Block Ops: a neighborhood worktable that turns reviewed service-request history and resident observations into a group brief and next-step plan.

**Selected by the user: Block Ops, Track 3 — Community Development.** Phases 1–3 are complete. The current app has a three-step worktable, inspectable full addresses, a changing evidence summary, and a dedicated printable brief. Targeted reliability fixes and visual work are in progress under Phases 4–5; see the ledger. The six original concept previews remain historical reference material.

Repository: [mshaaf/bcc-hackathon](https://github.com/mshaaf/bcc-hackathon).

## Start here

1. [Block Ops specification](docs/specs/block-ops.md): the active user, workflow, output, and acceptance criteria.
2. [Luna phase plan](docs/superpowers/plans/2026-10-21-luna-phase-execution.md) and [phase status](docs/PHASE-STATUS.md): phases 1–3 are complete; Phase 4 is next.
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

- **Start implementation here:** [Luna phase plan](docs/superpowers/plans/2026-10-21-luna-phase-execution.md) and [current phase status](docs/PHASE-STATUS.md). Phase 0 is done; phases 1–6 cover selection through the release package. The plan includes copy/paste batch prompts.
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

Current visual rules are in [DESIGN.md](DESIGN.md), with [product context](PRODUCT.md) and [review screenshots](docs/ui-review/README.md). Changing source or candidate street starts a fresh observation; a failed refresh preserves the current draft.

Run the checks with `node --test`. Reproduce the live data proof with `node scripts/prove-data.mjs` (requires network access).

See [the active Block Ops specification](docs/specs/block-ops.md), [architecture](docs/ARCHITECTURE.md), [implementation plan](docs/IMPLEMENTATION-PLAN.md), and [verification evidence](docs/TEST-PLAN.md). The app does not submit tickets or establish whether a reported condition remains present.
