# Block Ops — current context checkpoint

Updated October 21, 2026, after the independent B2 review and the B3 repair batch. Inspect `git status --short --branch` and `git log -8 --oneline` first; later changes supersede this snapshot. B2 shipped as `a53f3c0` (backend) and `f03cd46` (UI); the B3 repair batch follows them. **Standing rule: do not open, start or restart Docker or any container; use only services already running, and mark any check that cannot run as unverified.**

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
| B1 | Local Supabase Auth/Postgres/Realtime, shared membership, posts/replies, own-post editing, moderator hiding, live updates and retry/reconnect handling. Its four review defects were fixed in B2. |
| B2 / S3 | **Built and verified locally**: shared missions from a discussion or a reviewed local campaign, authenticated claims with one winner, progress/follow-up posts, current-state export, and the four B1 repairs. 27/27 backend integration, 68/68 mission browser checks. See the ledger. |
| B3 repair batch + follow-up (S4, partly) | Independent B2 and B3 review findings repaired in code (the follow-up: departed participant's undo button, deploy-probe wording, jobs-first mobile layout, two-phone checklist). B2 items (malformed evidence, reopened jobs, completion label, Add job drafts, announcements/focus, error clearing, source-post link) plus hosted-deployment preparation ([DEPLOYMENT](DEPLOYMENT.md)). **Committed locally; the migration and all real-backend checks are UNVERIFIED** (Docker was off and must not be started by an assistant). |
| Still to do | Run the unverified checks when the user starts the stack; hosted project and real phones only when authorized; then R5 pitch/release/rehearsal. |

B1 uses **real local Supabase via CLI/Docker**, not a mock. SDK 2.118.0 is vendored; CLI 2.121.0 and setup are documented in [COMMUNITY-SETUP](COMMUNITY-SETUP.md). No hosted project exists. Guest accounts are not verified residents; clearing site data/changing device loses that guest identity. Counts are accounts, not unique people.

Local map campaigns still use guarded localStorage. Typed legacy owner names are not authenticated commitments. Shared community state does not automatically turn a local campaign into a shared mission.

## Independent review history

- **B1 review** at `f36867b` found four defects (late send erasing newer drafts, membership DELETE metadata reaching outsiders, old-operation replay after leaving, a disconnected composer label). B2 fixed them with regressions; see [B1-REVIEW](B1-REVIEW.md).
- **B2 review** at `f03cd46` ([B2-REVIEW](B2-REVIEW.md)) confirmed the web app and mission loop (143 unit tests, 27/27 backend on that run) and found four more: a malformed imported evidence record that broke community loading for everyone, a finished job that could be reopened into an assignment to a departed member, a "reported by <claimant>" label for organizer-marked jobs, and Add job erasing newer drafts. The B3 repair batch fixed all four in code plus three smaller app/accessibility items.
- **B3 review** at `f5fbfaa` ([B3-REVIEW](B3-REVIEW.md)) found two small gaps, both fixed in code in a follow-up: a departed participant was offered "Mark not done" (now `taskControls`), and the deploy probe claimed migrations were verified (now it says what it checked and points to `migration list --linked`). The same follow-up compacted the phone mission layout (jobs first) and wrote the two-phone checklist in [DEPLOYMENT](DEPLOYMENT.md).

**Backend-dependent evidence for those repairs is unverified**, because the local stack was not running and an assistant must not start it. Unit tests (163 discovered: 132 pass, 0 fail, 31 skipped), an interface-only fake-backend browser check (34/34) and a syntax-only parse of the migration pass; read the B3 entry in [PHASE-STATUS](PHASE-STATUS.md) for exact counts and what remains unrun.

## Next assignment

1. When the user starts the local stack: `npx supabase@2.121.0 migration up` (never `db reset`), then both integration files, `scripts/mission-browser-check.mjs` and `scripts/community-browser-check.mjs`; record real counts. Fix whatever the new migration reveals.
2. Only when the user authorizes it: a hosted Supabase project and public URL following [DEPLOYMENT](DEPLOYMENT.md), a real phone on cellular, an anonymous-sign-in abuse decision (CAPTCHA needs a client change), pagination/load.
3. **R5** (truthful community-first pitch and rehearsal).

The text below is the completed B2 contract, kept for context.

### Completed B2 contract

Use [SONNET-HANDOFF](SONNET-HANDOFF.md) for the complete outcome contract and copyable prompt. Finish all S3.1–S3.3 and the repair gate as one batch. A starts a mission from discussion or reviewed local work; independent B joins, claims a job and posts an update; A sees the persisted responsibility/progress, and reload/reconnect preserve it. Current export reflects shared state.

Preserve both creation paths and source provenance. A discussion-origin mission needs no city ticket and explicitly exports “No official 311 records attached.” Do not weaken the existing evidence-required local export guard. Publication is a deliberately reviewed copy, never an automatic upload; local originals/excluded evidence survive. Imported owners/done flags become unclaimed/not done. Historical observations retain dates/fictional/import provenance and unverified original authorship.

Backend-enforced claims must have a single winner and serialize with membership removal. Leaving releases unfinished work; an active organizer archives before leaving. Organizer metadata uses version checks. Shared progress, source ticket status and dated site observations remain distinct. Use additive migrations and preserve the existing local database; destructive tests use disposable fixtures/stacks.

Check direct API authorization, retry/idempotency, leave/claim races, delayed sends with new text, keyboard and 320/390-pixel layouts, current export and the two-browser mission path. Keep moving through the batch, commit focused increments, and ask only for a genuine missing prerequisite. B3/R5 and public publication are later work.

## Code/run map and cautions

Node 20+ baseline; Node 22+ for integration Realtime tests. Existing server: `http://127.0.0.1:8000/` (may predate the latest code; a Node server reads files per request but needs a restart for `server.mjs` changes). Inspect an already-running server before starting another. `node scripts/check-deploy-config.mjs` checks hosting settings; `node scripts/ui-fixture-check.mjs` checks the interface with a fake backend and needs only Chrome. Full local app: local Supabase stack plus `node --env-file=.env server.mjs`; plain `node server.mjs` supports the map with an unconfigured-community notice. Never print credentials from CLI status output.

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
