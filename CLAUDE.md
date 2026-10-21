# Block Ops — Claude context

**Executor preference:** the user selected Sonnet 5.5 for implementation. Do not change models automatically or infer an API identifier. Implement inline; no automatic subagents.

**Product form:** the user explicitly wants an application, and a web app is sufficient for the project. Keep the existing Node/native-browser/Leaflet/Supabase stack; shape community, missions, map and task details as connected app screens with consistent navigation and responsive phone/desktop interaction. A framework rewrite or broad refactor is not required. Make focused improvements in place.

Read [AGENTS.md](AGENTS.md), [context checkpoint](docs/CONTEXT-CHECKPOINT.md), [Sonnet handoff](docs/SONNET-HANDOFF.md), [B1 repairs](docs/B1-REVIEW.md), [community scope](docs/specs/community-missions.md), and the requested work order in [the plan](docs/superpowers/plans/2026-10-21-community-missions.md). Use [PHASE-STATUS.md](docs/PHASE-STATUS.md) as the execution ledger. Do not read the full archive by default.

## Current state and next action

- Block Ops / Track 3 is selected. The user wants a neighborhood community: join → discuss → organize a mission → claim work → post progress.
- R1–R4 built a real DC map and browser-local campaigns. B1 adds local Supabase identity, membership, posts/replies and live updates. Shared missions/commitments and public hosting remain unbuilt.
- **S1.1 complete at `9f09667`**, independently reviewed: 87 tests passed; export wording checked. **B1 built locally, with four open review repairs. Next batch: B2 (those repairs plus S3.1–S3.3 shared missions)**, then B3 (S4 readiness) and R5 release. The user explicitly wants substantial batches; do not stop after every small work order.
- The scope was committed as `878f251`; R4 code as `15fb58c`. `git log` and `git status` supersede stale notes. The current Sonnet assignment is the B2 web-app outcome in `docs/SONNET-HANDOFF.md`; completed B1 instructions are history, not the next task.
- Supabase runs locally via CLI/Docker; no hosted project exists. Independent review passed 97 unit tests plus 13 explicit backend tests, but found open repairs: newer drafts erased after a send, membership DELETE metadata exposed to non-members, old-operation replay returning a post after leaving, and a disconnected composer label. Repair these within the existing design. Do not treat fakes, localStorage or skipped tests as shared-backend proof.
- Preserve other assistants' work, historical source evidence and existing local campaigns. DIRECTION-REVIEW is historical context with qualifications; the social spec governs the current scope.
- End every commentary/final message with a **very simple TL;DR**.

## Commands and traps

Node.js 20+, repository root:

```sh
git status --short --branch
node --test test/recurrence.test.mjs
node server.mjs                      # map/campaigns only; community needs the env below
npx supabase@2.121.0 start           # local shared backend (Docker); then see docs/COMMUNITY-SETUP.md
node --env-file=.env server.mjs      # with COMMUNITY_SUPABASE_URL / _PUBLISHABLE_KEY set
```

Current app: `http://127.0.0.1:8000`. Check an existing server before starting another. No baseline install/build or provider credentials required. Run `node --test` at relevant phase boundaries; no need to re-run the full browser/research suite for a documentation edit.

`server.mjs` has explicit assets and GET-only source routes. `public/app.mjs`, `public/map.mjs`, `public/storage.mjs`, `lib/block-ops.mjs`, `lib/campaign.mjs` are the existing browser/data/campaign modules. `lib/recurrence.mjs` uses report filing dates, not closure dates; all copy must say “followed by another report within 30 days of filing”, never “after a closure”.

Preserve IDs/dates/statuses, unknowns, excluded evidence, source links, failed-refresh recovery and safe text rendering. Local campaigns publish only through a reviewed copy; typed owner names are not authenticated commitments. New shared writes need real backend permissions and claim concurrency checks. Never expose secret/service-role keys. Keep the existing stack unless a requirement warrants change.

Commit focused completed increments locally; no push, deployment, official submission, outreach or license selection without the user's instruction. Keep the ledger honest; stop at the requested boundary or actual blocker, without repeated approval for routine choices.
