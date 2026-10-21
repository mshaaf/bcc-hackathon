# BCC Hackathon 2026

Block Ops: a neighborhood worktable that turns reviewed service-request history and resident observations into a group brief and next-step plan.

**Selected by the user: Block Ops, Track 3 — Community Development.** Implementation will run in the user's Luna terminal. Phase 0 is complete; Phase 1 is next and will finalize the technical plan. No production application has been built. The research and six fictional concept previews remain available as reference.

Repository: [mshaaf/bcc-hackathon](https://github.com/mshaaf/bcc-hackathon).

## Start here

1. [Block Ops specification](docs/specs/block-ops.md): the active user, workflow, output, and acceptance criteria.
2. [Luna phase plan](docs/superpowers/plans/2026-10-21-luna-phase-execution.md) and [phase status](docs/PHASE-STATUS.md): execute phases 1–3 first.
3. [Decision log](docs/DECISIONS.md): confirmed choice, initial scope, and remaining technical decisions.
4. [Project brief](docs/PROJECT-BRIEF.md): event, team, constraints, and success criteria.
5. Open [the interactive product and presentation previews](previews/finalists.html) and select Block Ops. All six concepts remain available for historical comparison.

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

There is no app framework, package manifest, deployment, automated product test suite, or product license yet. Luna should resolve the technical plan in Phase 1 using the selected Block Ops scope.
