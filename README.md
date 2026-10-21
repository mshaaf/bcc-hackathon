# BCC Hackathon 2026

Research, six project finalists, product previews, and the specification and delivery plan for a two-engineer team.

**Status: choosing one project.** Block Ops is the current recommendation, The Switch is the experimental challenger, and Casebreaker is the strongest document-focused alternative. The team has not selected a winner or started a production application. The interactive concepts use fictional examples.

Repository: [mshaaf/bcc-hackathon](https://github.com/mshaaf/bcc-hackathon).

## Start here

1. [Project brief](docs/PROJECT-BRIEF.md): event, team, constraints, and what success means.
2. [Six finalists](docs/FINALISTS.md): every product, presentation, scope, and risk.
3. [Research synthesis](docs/RESEARCH-SYNTHESIS.md): evidence grades and recommendations.
4. [Decision log](docs/DECISIONS.md): what is decided, proposed, and still open.
5. Open [the interactive product and presentation previews](previews/finalists.html) in a browser. Use the bottom project picker and the Product / Presentation buttons.

## Two finalists per track

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

There is no app framework, package manifest, deployment, automated product test suite, or product license yet. Choose the project before adding those.
