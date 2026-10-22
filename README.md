# BCC Hackathon 2026 — Block Ops

**Track 3 — Community Development.** The user wants a neighborhood community where people discuss a concern, organize a mission, claim jobs and post progress. The map and evidence brief support that shared work.

**Web app for the project:** keep the existing stack and build connected Community, Missions, task-detail and Map screens. No framework rewrite, native build or installable packaging is required. [Product](PRODUCT.md) and [app experience](DESIGN.md).

**Built locally:** R1–R4 map/source/local campaigns and B1 Supabase identity, membership, posts/replies and live updates. **Open:** [B1 review repairs](docs/B1-REVIEW.md), shared missions/commitments and public phone access. No hosted project or public deployment exists.

**Executor:** Sonnet 5.5 in the user's Claude session. **B1 and B2 are complete locally** (shared community, missions, claims and progress across independent browsers, verified on a local Supabase stack; see [setup](docs/COMMUNITY-SETUP.md)). **B3 repair batch** (independent B2 review findings and hosted-deployment preparation, see [DEPLOYMENT](docs/DEPLOYMENT.md)) is coded and committed locally; its migration and real-backend checks are **unverified** until the local stack is started. Hosted project and real-phone proof need the user's authorization. S1.1 is complete at `9f09667`. A hosted Supabase project, a public URL and real phones are not yet proven. S1–S4 add the shared workflow; R5 release waits until it works. No project selection or broad research restart is needed.

Repository: [mshaaf/bcc-hackathon](https://github.com/mshaaf/bcc-hackathon).

## Start here

1. [Context checkpoint](docs/CONTEXT-CHECKPOINT.md) for a fresh session; [Sonnet handoff](docs/SONNET-HANDOFF.md) for the completed B2 contract; B3 is next.
2. [Community scope](docs/specs/community-missions.md) and [work-order plan](docs/superpowers/plans/2026-10-21-community-missions.md): named increments, interfaces and acceptance checks.
3. [Phase/work-order ledger](docs/PHASE-STATUS.md): completed history and next work; [current decisions](docs/DECISIONS.md).
4. [CLAUDE.md](CLAUDE.md) / [AGENTS.md](AGENTS.md): shared instructions, including a simple TL;DR after every message.

## Run the current app

Requires Node.js 20+. No baseline package install or provider key is required.

```sh
node server.mjs
```

Open `http://127.0.0.1:8000`. Inspect an already-running process before starting a second server. Live and recorded DC data retain source references; the practice case is invented and clearly labeled. Local campaigns save only in this browser. Community conversation is shared through local Supabase; full setup is in [COMMUNITY-SETUP](docs/COMMUNITY-SETUP.md). Run `node --env-file=.env server.mjs` with the configured local backend for that experience.

Focused recurrence checks: `node --test test/recurrence.test.mjs`. Full unit suite at a phase boundary: `node --test`. The independent S1.1 review passed 87 tests on October 21; browser checks were not rerun in that review. [Test evidence](docs/TEST-PLAN.md).

**Recurrence claim:** the statistic uses report filing dates, not closure dates; S1.1 corrected the UI, export and [pitch](docs/PITCH.md) wording to say so. Measured numbers are unchanged historical results.

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
