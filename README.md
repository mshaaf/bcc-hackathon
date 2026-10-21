# BCC Hackathon 2026 — Block Ops

**Track 3 — Community Development.** The user wants a neighborhood community where people discuss a concern, organize a mission, claim jobs and post progress. The map and evidence brief support that shared work.

**Built:** R1–R4 provide a real Ward 8 / dumping map, source review, browser-local saved campaigns, tasks/follow-ups, exports and a recorded backup. **Unbuilt:** shared membership, discussions, authenticated commitments and public phone access. Supabase is the recommended shared provider; project/access/hosting are unconfirmed.

**Executor:** Sonnet 5.5 in the user's Claude session. **Next work order:** S1.1, correcting report-date claims before backend setup. S1–S4 add the shared workflow; R5 release waits until it works. No project selection or broad research restart is needed.

Repository: [mshaaf/bcc-hackathon](https://github.com/mshaaf/bcc-hackathon).

## Start here

1. [Sonnet handoff](docs/SONNET-HANDOFF.md): code map, constraints, exact first prompt and reporting protocol.
2. [Community scope](docs/specs/community-missions.md) and [work-order plan](docs/superpowers/plans/2026-10-21-community-missions.md): named increments, interfaces and acceptance checks.
3. [Phase/work-order ledger](docs/PHASE-STATUS.md): completed history and next work; [current decisions](docs/DECISIONS.md).
4. [CLAUDE.md](CLAUDE.md) / [AGENTS.md](AGENTS.md): shared instructions, including a simple TL;DR after every message.

## Run the current app

Requires Node.js 20+. No baseline package install or provider key is required.

```sh
node server.mjs
```

Open `http://127.0.0.1:8000`. Inspect an already-running process before starting a second server. Live and recorded DC data retain source references; the practice case is invented and clearly labeled. Campaigns currently save only in this browser, not across neighbors' devices.

Focused recurrence checks: `node --test test/recurrence.test.mjs`. Full unit suite at a phase boundary: `node --test`. The latest R4 evidence reports 85 tests; that is historical, not a claim about future changes. [Test evidence](docs/TEST-PLAN.md).

**Known claim issue:** recurrence uses report creation dates; current “after closure” wording is unsupported. S1.1 corrects UI/pitch/export claims while preserving the existing calculation and data. The earlier [pitch](docs/PITCH.md) is not ready for use unchanged.

## Reference and history

[Research index](research/README.md), [finalists](docs/FINALISTS.md), [source index](research/SOURCES.md), [project brief](docs/PROJECT-BRIEF.md), [baseline architecture](docs/ARCHITECTURE.md), and [repository state](docs/REPOSITORY.md). These are evidence/history, not alternative active scope.

The [old detailed handoff](docs/archive/2026-10-21-handoff-through-r4.md) and [earlier Luna plan](docs/superpowers/plans/2026-10-21-luna-phase-execution.md) remain archived guidance. Use the Sonnet work orders for new edits. [Claude's direction review](docs/DIRECTION-REVIEW.md) is retained with correction notes.

Historical concept previews are in [previews/finalists.html](previews/finalists.html); [preview instructions](previews/README.md) explain how to serve them separately. A static Python server does not run the app's Node API.

## Research shortlist — reference

| Track | Idea | Product promise |
|---|---|---|
| AI: Ethics and Access | The Switch | Inspect whether an AI intake summary preserved the applicant's facts and challenge each claim against its source. |
| AI: Ethics and Access | Casebreaker | Trace a background-report disagreement to supplied source documents and prepare a correction request. |
| Modern Healthcare Outcomes | The Room | Practice a patient-chosen communication goal and carry the preferred words into a visit. |
| Modern Healthcare Outcomes | Reclaim | Organize historical kidney records for a transplant-team waiting-time review conversation. |
| Community Development | Block Ops | Turn reviewed service-request history and resident observations into a group brief and next-step plan. |
| Community Development | People's Chamber | Rehearse public testimony and sharpen a resident-owned request using sourced hearing context. |


No push, deployment, official submission or license selection is implied by a local documentation/implementation commit. Check `git status` and `git log`; current remote publication history is recorded in the ledger.
