# Block Ops — current context checkpoint

Updated October 21, 2026, after B1 review and the user's explicit web-app direction. Inspect `git status --short --branch` and `git log -6 --oneline` first; later changes supersede this snapshot. Current product code is `f36867b` / backend `d52adb2`; `5f0e9d3` recorded the app-form-factor direction. This handoff update follows those commits.

## Selected project and vision

Block Ops is selected for **BCC Hackathon, Track 3 — Community Development**. Two strong generalist engineers have three build days, October 21–23; judging is October 24, 2026, 3–5 PM at MLK Library. The exact library/city and judging rubric were not confirmed. Ward 8, Washington DC is the chosen data/demo setting, not a verified event location.

The user rejected a basic form/brief experience, challenged overlap with Citizen and explicitly wants neighbors to gather, talk and carry out a plan. The core loop is **join community → discuss → organize mission → claim job → post progress**. Maps/public records support the group; adding a map alone is not the product's differentiation.

The latest clarification: **make it an application; a web app is sufficient for the project**. Keep the current code/stack and improve screens in place. Community, Missions, mission/task detail and Map belong to one connected application, with consistent navigation, clear back paths and usable phone/desktop interaction. No framework rewrite, native build or installable packaging is required. [PRODUCT](../PRODUCT.md) and [DESIGN](../DESIGN.md) now describe this directly.

## User preferences

- End every commentary and final message with a super-simple **TL;DR**.
- Sonnet 5.5 in Claude is the user's implementation executor; the label is not a verified API identifier. Implement inline, without automatic subagents/model changes.
- Give larger outcome batches. Internal work orders are checklists, not reasons to stop and ask after every task.
- Conserve usage: no broad research/project-selection restart, redundant tests or speculative features. Resolve routine choices and keep useful work.
- Completed checked increments are committed locally. No push, public deployment, paid provisioning, outreach, agency submission or license selection is implied.

## Built and not built

| Area | Actual state |
|---|---|
| R1–R4 | Ward 8 dumping map, bounded source query/inspection, reviewed exports, browser-local campaigns/tasks/observations, filing-date proximity display and real dated recorded fallback. |
| S1.1 | Filing-date wording repair complete at `9f09667`; original thresholds/counts retained. |
| B1 | Local Supabase Auth/Postgres/Realtime, shared membership, posts/replies, own-post editing, moderator hiding, live updates and retry/reconnect handling. Happy-path evidence passes; four independent-review defects remain open. |
| B2 / S3 | **Built and verified locally**: shared missions from a discussion or a reviewed local campaign, authenticated claims with one winner, progress/follow-up posts, current-state export, and the four B1 repairs. 27/27 backend integration, 68/68 mission browser checks. See the ledger. |
| B3 / S4 and R5 | Remaining readiness, actual phone/public access when authorized, then pitch/release/rehearsal. Unproven. |

B1 uses **real local Supabase via CLI/Docker**, not a mock. SDK 2.118.0 is vendored; CLI 2.121.0 and setup are documented in [COMMUNITY-SETUP](COMMUNITY-SETUP.md). No hosted project exists. Guest accounts are not verified residents; clearing site data/changing device loses that guest identity. Counts are accounts, not unique people.

Local map campaigns still use guarded localStorage. Typed legacy owner names are not authenticated commitments. Shared community state does not automatically turn a local campaign into a shared mission.

## Independent review evidence and open repairs

At `f36867b`, `node --test` discovered 110 tests: **97 passed, 0 failed, 13 skipped**. Explicit local integration invocation then passed **13/13**, including distinct identities, permissions, persistence, moderation and Realtime; measured delivery was 439 ms after a warm-up. Sonnet's full browser driver recorded 51 passes; it was not rerun in the independent review. Fresh join-preview inspection and two isolated UI passes supplemented the stored evidence. Actual phone/public hosting were not tested.

Extra probes established four open issues, with exact source/reproduction/fix contracts in [B1-REVIEW](B1-REVIEW.md) and [evidence](workflow/b1-independent-review.json):

1. Successful send clears newer text typed while the request was pending.
2. An authenticated outsider receives membership identifiers through DELETE events.
3. Replaying an old post operation returns it after leaving, before membership is checked.
4. Renaming the main composer textarea disconnects its visible label.

Keep these in the next implementation batch; they are not already fixed. A concurrent rate probe did not establish a rate-limit bypass. Do not turn its all-author count into an invented finding.

## Next assignment — B3 (S4) then R5

B2 is complete (see [PHASE-STATUS](PHASE-STATUS.md)); the text below is the completed B2 contract, kept for context. **B3** covers what B2 could not prove: a hosted Supabase project and public URL (only when the user authorizes it), a real phone on another network, anonymous-auth abuse protection, pagination/load, and any accessibility/layout gaps found; then **R5** (truthful community-first pitch and rehearsal).

### Completed B2 contract

Use [SONNET-HANDOFF](SONNET-HANDOFF.md) for the complete outcome contract and copyable prompt. Finish all S3.1–S3.3 and the repair gate as one batch. A starts a mission from discussion or reviewed local work; independent B joins, claims a job and posts an update; A sees the persisted responsibility/progress, and reload/reconnect preserve it. Current export reflects shared state.

Preserve both creation paths and source provenance. A discussion-origin mission needs no city ticket and explicitly exports “No official 311 records attached.” Do not weaken the existing evidence-required local export guard. Publication is a deliberately reviewed copy, never an automatic upload; local originals/excluded evidence survive. Imported owners/done flags become unclaimed/not done. Historical observations retain dates/fictional/import provenance and unverified original authorship.

Backend-enforced claims must have a single winner and serialize with membership removal. Leaving releases unfinished work; an active organizer archives before leaving. Organizer metadata uses version checks. Shared progress, source ticket status and dated site observations remain distinct. Use additive migrations and preserve the existing local database; destructive tests use disposable fixtures/stacks.

Check direct API authorization, retry/idempotency, leave/claim races, delayed sends with new text, keyboard and 320/390-pixel layouts, current export and the two-browser mission path. Keep moving through the batch, commit focused increments, and ask only for a genuine missing prerequisite. B3/R5 and public publication are later work.

## Code/run map and cautions

Node 20+ baseline; Node 22+ for integration Realtime tests. Existing server: `http://127.0.0.1:8000/`. Inspect an already-running server before starting another. Full local app: local Supabase stack plus `node --env-file=.env server.mjs`; plain `node server.mjs` supports the map with an unconfigured-community notice. Never print credentials from CLI status output.

- `server.mjs`: explicit assets, browser-safe community config, exact-origin CSP and fixed read-only DC proxies.
- `public/community.mjs`, `public/community-api.mjs`, `lib/community.mjs`: current community UI, SDK wrapper and pure rules.
- `supabase/migrations/`, `supabase/seed.sql`: applied B1 backend. Add new migrations rather than rewriting applied history/resetting user data.
- `public/app.mjs`, `public/map.mjs`, `public/storage.mjs`: map/local UI, Leaflet and guarded local saves.
- `lib/block-ops.mjs`, `lib/campaign.mjs`, `lib/recurrence.mjs`: source normalization/review, local campaign/export and filing-date statistics.
- `data/demo.json`: invented DEMO records. `data/recorded-snapshot.json`: real dated city data, labeled recorded. `scripts/record-snapshot.mjs` mutates that recording; do not run casually.
- `test/`, `scripts/community-browser-check.mjs`, `scripts/browser-check.mjs`: existing proof tools. The community browser script restarts Realtime and writes tracked screenshots; adapt isolated output/fixtures when extending it.

Keep IDs/dates/statuses/unknowns/source links, exclusions, review invalidation, refresh recovery and safe text rendering. The statistic uses report filing dates, not closure dates: another report filed later may predate closure. Nearby does not mean the same pile or failed cleanup. “Closed isn't fixed” is a slogan, not proven remediation failure.

Defer AI, crime/Flock layers, photos, DMs, notifications, multiple neighborhoods and category expansion. No community partnership, completed cleanup, adoption or measured social impact is established. Older direction reviews/pitch/research are dated evidence, not current implementation instructions. R1–R3 were pushed previously; later local commits do not prove public hosting. Git is authoritative for current publication state.

Read order: [Sonnet assignment](SONNET-HANDOFF.md) → [B1 repairs](B1-REVIEW.md) → [scope](specs/community-missions.md)/S3 in [plan](superpowers/plans/2026-10-21-community-missions.md) → relevant code. [Ledger](PHASE-STATUS.md) tracks acceptance; `docs/workflow/*.json` are local records, not Ruflo remote service events.
