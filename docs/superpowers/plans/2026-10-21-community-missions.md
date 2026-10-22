# Community Missions Implementation Plan

> **For agentic workers:** The user selected Sonnet 5.5 for implementation in Claude. Use superpowers:executing-plans if available for the named work-order batch; the checklists remain sufficient without that skill. Subagent-driven development is optional only if explicitly requested. Steps use checkboxes. The original planning task did not implement product changes. S1–S3 are complete locally; B1 review defects were repaired in B2. B3/S4 repairs and preparation are implemented, with database and real-device acceptance still open. The dated checklists below preserve the original work breakdown; [PHASE-STATUS](../../PHASE-STATUS.md) is authoritative for completion.

**Goal:** neighbors join a community, discuss a local concern, commit to mission tasks, and share progress across their own devices.

**Architecture:** preserve Node/native browser/Leaflet and the audited source/campaign logic. Add a managed shared backend, authenticated participants and row-level permissions. Keep posts, membership and claims independently writable; publish a reviewed copy of a local campaign instead of synchronizing its whole local store.

**Tech Stack:** existing Node.js 20+ ES modules, Leaflet and B1 local Supabase Auth/Postgres/Realtime with vendored SDK. Reuse the current web app; no framework/native rewrite is required. Use additive migrations and preserve existing data. Hosted project/public access remain unproven.

**Spec:** [community-missions.md](../../specs/community-missions.md). The user's community-first intent is confirmed; named provider, one-group/guest defaults and detailed interfaces below are builder proposals to review against the user's next execution instruction.

## Current outcome batches

The user wants larger outcome batches and an **app experience; a web app is sufficient**. **Current: finish B3/S4 acceptance.** B2 delivered the [B1 repair gate](../../B1-REVIEW.md) plus S3.1–S3.3. The B3 follow-up passed independent unit and fake-backend interface checks; the latest migration and real-device behavior are unverified. [SONNET-HANDOFF](../../SONNET-HANDOFF.md) is the current assignment; [CONTEXT-CHECKPOINT](../../CONTEXT-CHECKPOINT.md) is the reset reference; [independent review](../../B3-FOLLOWUP-REVIEW.md) records the latest evidence.

B2 delivers discussion → mission → authenticated job commitment → progress/follow-up within one connected Community/Missions/Map app. Retain the existing stack/identity, phone and desktop support, current navigation/back paths and drafts. Apply [PRODUCT](../../../PRODUCT.md) and [DESIGN](../../../DESIGN.md). Do not redo B1 wholesale or stop after each internal work order.

B3 groups S4.1–S4.2 into remaining recovery/phone readiness, with public publication only when authorized; R5 follows for presentation/release. No implementation is performed by this documentation update.

## Sonnet execution protocol

**Executor preference:** Sonnet 5.5, as named by the user. This documents their choice; no model setting, availability check, speed comparison or API model identifier is implied.

Read [SONNET-HANDOFF.md](../../SONNET-HANDOFF.md), the [spec](../../specs/community-missions.md), the current ledger, and only the requested work order/code. Do not reread all historical research. Implement inline in the user's Sonnet session; no automatic agents or full framework rewrite.

| Work order | Small complete increment | Depends on |
|---|---|---|
| S1.1 | Correct report-date claims everywhere; no backend needed | Current R4 app |
| S1.2 | Prove provider access, pinned SDK and two real Auth sessions | S1.1 |
| S1.3 | Shared community membership and permissions | S1.2 |
| S2.1 | Posts/replies API, constraints and authorization | S1.3 |
| S2.2 | Community UI and cross-browser discussion | S2.1 |
| S3.1 | Discussion-origin missions and reviewed local publication | S2.2 |
| S3.2 | Atomic joining, claiming, leaving and progress | S3.1 |
| S3.3 | Mission UI, deep links and current export | S3.2 |
| S4.1 | Cross-device recovery, permissions and accessible flow | S3.3 |
| S4.2 | Deploy preparation and authorized real-phone proof | S4.1 |

“Execute S1” includes S1.1–S1.3; “execute S1.1 only” stops after that work order; “next N work orders” starts at the first unfinished one. A phase is complete only when all its work orders and exit checks pass. Use focused checks, ledger updates and local commits at meaningful completed increments; do not turn every checkbox into a new approval gate. Continue through the authorized batch unless actual access or a failing prerequisite prevents it.

The original request created documentation only. A user instruction to execute an outcome batch authorizes its local implementation/checks; historical planning-only notes do not prohibit that work. Paid provisioning, publication and outreach remain outside a local-code batch unless specifically requested.

Before editing, inspect Git and the named callers/tests. Fix the shared root cause, retain existing contracts and run focused checks first. Run the broader existing suite at a meaningful phase boundary; repeat only after new changes/failures justify it. Distinguish real backend/browser evidence from fakes and skipped integration checks. Leave a short plain-language TL;DR every message.

## Global constraints

- One Ward 8 demonstration community and the proven dumping source first; no all-category or crime expansion before shared participation works.
- Display names are 1–40 characters; mission titles 1–120; post bodies 1–2,000. Source facts, user observations and demo entries stay distinct.
- One claimant per task; one membership per authenticated user per group/mission. Counts represent participant accounts, not verified humans or residents.
- Retain local campaigns; publish only a reviewed copy. No automatic upload, migration, overwrite or deletion of browser data.
- No service-role/secret browser key, client-only authorization, fake live activity, automatic agency submission, or unrequested public deployment.
- Every assistant message ends in a super-simple TL;DR. Preserve unrelated work, including `docs/DIRECTION-REVIEW.md`, retained as a historical review with correction notes.

## Review focus

1. Two sessions claim the same task simultaneously: database-enforced single winner, clear loser response.
2. A participant bypasses the UI: backend rejects forged authors, role changes and edits to others' missions.
3. A send times out after committing: retry is idempotent and keeps the user's text.
4. Realtime disconnect/reconnect: re-fetch current permitted state; no stale counts, duplicate events or permanent spinner.
5. Existing private/local campaign notes: publication is deliberate and selective; local original survives unchanged.

## S1 — Shared foundation and truthful evidence

### S1.1 — Correct the report-date claims first

**Status:** Complete at `9f09667`. Independent review passed 87 tests and inspected the generated counterexample brief; browser driver not rerun. Original failing-before-fix evidence is Sonnet-reported. See the ledger.

**Files:** `lib/recurrence.mjs`, `public/app.mjs`, `test/recurrence.test.mjs`, `docs/PITCH.md`; inspect `lib/campaign.mjs` and other callers of `recurrenceHeadline` for affected export wording. Preserve historical numerical results as dated records, with their corrected interpretation.

**Decision:** keep the existing report-creation-date algorithm. Relabel its result consistently: another report nearby within 30 days **after the earlier report was filed**, among records currently marked Closed. The mature subset is reports filed at least 30 days ago, not closures at least 30 days old. Do not invent a closure timestamp, change thresholds to improve the percentage, or require provider setup for this order.

- [x] Add the counterexample: A filed Oct 1, resolved Oct 10; B filed Oct 2 nearby. The algorithm can count a later filing; no headline/caveat/export may describe B as after A closed. Add assertions for the mature-subset labels and unknown dates. Run `node --test test/recurrence.test.mjs` and observe the new wording assertions fail before fixing them.
- [x] Correct misleading copy/comments across the actual callers and active pitch. Keep IDs, counts, radii, date windows and source links intact. Avoid a wholesale recurrence/model refactor.
- [x] Run the focused tests and relevant campaign/export checks; inspect the actual visible strings and one generated brief. Record commands/results and commit this increment locally. Update the work-order row only when the checks pass.

**Exit:** supported report-date wording in UI, caveats, current pitch and export; regression prevents the closure inference. This order is not blocked by Supabase access.

### S1.2 — Prove the shared provider and identity

**Status:** Complete (B1, local Supabase stack; hosted project not tried). SDK `@supabase/supabase-js` 2.118.0 UMD vendored; routes/CSP via `/api/community-config`. Evidence in the ledger and [COMMUNITY-SETUP.md](../../COMMUNITY-SETUP.md). Deviation: the test file lives at `test/community-access.integration.mjs` as planned; the migration also holds S1.3/S2.1 tables because they shipped together.

**Files:** create `public/community-api.mjs`, `test/community-access.integration.mjs`, `docs/COMMUNITY-SETUP.md`; modify explicit asset/config routes and CSP in `server.mjs` only as needed; pin/local-bundle the SDK using the smallest suitable packaging. Configuration files contain placeholders only.

**Interface:** `createCommunityClient(config).ensureSession() -> {userId}`. Configuration exposes only project URL/publishable key. No shared tables are required to establish two independent authenticated identities.

- [ ] Inspect actual project/hosting access and current Supabase docs/changelog; record selected SDK/runtime and actual cost/access prerequisites. Do not assume a configured or free project. If credentials/access are missing, ask for that specific prerequisite and leave this order incomplete; do not redesign the backend to conceal a failed proof.
- [ ] Implement pinned SDK/Auth setup with two isolated sessions and reload persistence. Verify IDs differ, secrets are absent from browser responses and guest identity limits are explained. Use provider-backed checks, not a fake sign-in object.
- [ ] Document `RUN_COMMUNITY_INTEGRATION=1 node --test test/community-access.integration.mjs` and the required environment. Explicit integration invocation fails clearly if configuration is missing. Default unit runs may skip provider tests, but skips never count as backend proof. Verify narrow HTTPS/WSS CSP and actual explicit asset serving.
- [ ] Record results, unresolved access and local commit. Do not create shared tables for later features in this order.

### S1.3 — Shared community membership and access

**Status:** Built locally in B1; acceptance reopened for the confirmed permission/event repairs. Join/leave as SQL functions (`join_community`, `leave_community`, `community_preview`) rather than the planned `getCommunity(id)` alone; `getCommunityPreview`/`getCommunity` exist in `public/community-api.mjs`.

**Files:** create `lib/community.mjs`, `test/community.test.mjs`; extend `public/community-api.mjs` and `test/community-access.integration.mjs`; add community/membership migrations using the verified provider workflow. Do not invent applied migration history.

**Interfaces:** `getCommunity(id)`, `joinCommunity(id, displayName)`, `leaveCommunity(id)` and `ensureSession` from S1.2. Group/member bounds and authorization follow the spec. Post/mission/task tables arrive in their owning orders, not in a premature all-feature schema.

- [ ] Write meaningful domain/backend regressions for name bounds, unique/idempotent membership, self-owned membership changes, controlled moderator authority and cross-community isolation.
- [ ] Implement/apply the community/member entities, uniqueness, RLS and write validation; seed one clearly labeled demonstration community. Public previews whitelist fields; private rows require current membership. Never authorize from user-editable display-name metadata.
- [ ] Run access tests with sessions A/B and unauthenticated/direct API requests. Verify duplicate joins do not grow counts, role/creator forgery is denied and read permissions match the spec. Document how to reproduce the proof.
- [ ] Run relevant unit/integration checks plus the existing suite at this phase boundary; record results, update ledger, commit locally.

**S1 exit:** corrected claim and two genuine sessions joining the same permitted shared community. No feed or shared missions are claimed yet.

## S2 — Join the community and talk

**Files:** create `public/community.mjs` and `test/community-feed.test.mjs`; modify `public/index.html`, `public/styles.css`, `public/community-api.mjs`, `server.mjs`, backend migrations/permissions and `scripts/browser-check.mjs` as needed.

**Interfaces:** `listPosts(communityId) -> Post[]`, `createPost({communityId, missionId?, parentId?, body, operationId}) -> Post`, `editOwnPost(postId, body)`, `hidePost(postId)`, `subscribeCommunity(communityId, onChange) -> unsubscribe`. Posts are sorted by created time then ID; one-level replies remain in their parent's group/mission. Domain types/limits match the spec. A server-generated authenticated user ID supplies authorship; never accept a display name as authority.

### S2.1 — Posts and replies backend

**Status:** Built locally in B1; acceptance reopened for operation-replay authorization repair. Implemented as `create_post`, `edit_post`, `hide_post` functions; `editOwnPost`, `hidePost`, `createPost`, `listPosts`, `subscribeCommunity` in the API wrapper.

Create post/reply entities and their permissions in this order.

- [ ] Add focused tests for bounded plain-text bodies, same-group replies, own-post edits, moderator hiding and idempotent post retries. Add backend tests that bypass UI controls and fail unauthorized actions.
- [ ] Implement the API methods and database enforcement; verify the tests against the real shared backend.
- [ ] Record the S2.1 checks and a focused local commit before moving to UI.

### S2.2 — Community UI and cross-browser discussion

**Status:** Built locally in B1; acceptance reopened for draft and accessibility repairs. Earlier browser proof used `scripts/community-browser-check.mjs` (51/51) instead of extending `scripts/browser-check.mjs`, which only gained a `#/map` entry. Real phones are not tested.

- [ ] Make the default screen the community feed: purpose, join action, members, chronological posts, replies, and active-mission area. Keep the existing map reachable as discovery. Label seeded/sample content accurately.
- [ ] Implement immediate cross-device update using permitted Realtime subscriptions plus canonical re-fetch. Show sending/error/reconnect states and preserve unsent text. Clean up subscriptions when changing views.
- [ ] Extend the browser driver to use two independent profiles: B joins and posts, A sees the exact text/count within five seconds on the tested healthy connection; reload keeps the session; retry does not duplicate. A can see no unauthorized/private fields. Check mobile and keyboard paths.
- [ ] Record unit/integration/browser evidence and a focused local commit. Do not claim real community adoption from demo accounts.

**Exit:** neighbors can genuinely gather and converse from separate browsers. This must work before adding more categories or optional social features.

## S3 — Turn discussion into a shared mission

**B2 entry/exit:** repair [the confirmed B1 defects](../../B1-REVIEW.md), then complete S3.1–S3.3 in the same authorized batch. Add regressions for delayed sends with newer drafts/navigation, outsider DELETE events, leave/replay/cross-community operations and the rendered composer label. Update selected-navigation/status/focus semantics in place. Evidence must confirm these repairs before acceptance; existing passing happy-path tests do not establish them.

Deliver the mission UI as part of the existing web app shell. A compact discoverable mission list, mission detail/task controls, clear back paths and the reachable map are sufficient. No separate site, native build or framework rewrite is required. Use new migrations for applied schema changes; do not reset the user's existing database.

**Files:** create `public/mission.mjs`, `test/community-mission.test.mjs`; modify `public/community-api.mjs`, `lib/community.mjs`, `lib/campaign.mjs`, `public/app.mjs`, `public/index.html`, `public/styles.css`, backend migrations/permissions and the browser driver. Keep `public/storage.mjs` for local drafts; do not replace every local save with a whole shared JSON write.

**Interfaces:** `createMission({communityId, title, objective, location, sourcePostId?, operationId}) -> Mission` creates a discussion-origin mission with optional evidence added later; `publishMission({communityId, campaign, operationId}) -> Mission` publishes a reviewed local campaign copy; `getMission(id) -> {mission,members,tasks,posts}`, `joinMission(id)`, `leaveMission(id)`, `claimTask(taskId)`, `releaseTask(taskId)`, `setTaskDone(taskId, done)`, `updateMission({id, expectedVersion, changes})`, `subscribeMission(id, onChange) -> unsubscribe`. Mission discussion reuses S2 posts with `missionId`. Atomic task claims derive their mission from the stored task. Joining/retries use database uniqueness; metadata version conflicts show a recoverable conflict.

### S3.1 — Create/publish missions with provenance

**Status:** Complete (B2). `create_mission` handles both paths; the publish preview is `#/missions/publish?campaign=<local id>`.

Add mission/member/task entities here, with claims denied until the S3.2 operations and permissions exist.

- [ ] Add failing tests for a discussion-origin mission with zero official records and a same-group source-post link; deliberate local publication with original untouched; excluded evidence absent; imported owners/done flags reset to unclaimed/not done; historical observations marked imported/original author unverified; fictional labels preserved; and cross-community creation denied.
- [ ] Implement the two creation paths and ownership/version rules. Keep local originals and source fidelity. Run the focused publication/ownership checks and commit before expanding task operations.

### S3.2 — Membership, claims and progress

**Status:** Complete (B2). Atomic claim/release/done/leave with real-backend race tests.

- [ ] Add direct-backend tests for idempotent joins; two simultaneous task claims with exactly one winner; own-task release/completion; another user's unauthorized edit; and leave/claim races with no orphan assignment.
- [ ] Implement the shared mission model/permissions, both creation paths, and atomic claim/release/complete/leave operations. Leaving releases unfinished claims; the active organizer must archive before leaving; community departure removes all mission memberships/unfinished claims atomically. Serialize membership removal with claims. Reuse campaign builders for sourced missions; add an evidence-free shared plan export that clearly says “No official 311 records attached” without weakening existing local campaign export guards. Fetch current task/member/post state separately before export.
- [ ] Run the focused backend/concurrency checks and commit S3.2.

### S3.3 — Mission UI, sharing and export

**Status:** Complete locally (B2). Real phones on another network are not tested (B3).

- [ ] Add a reviewed local-publication preview and a “Start a mission” action on a discussion. Use `/#/community/<uuid>/mission/<uuid>` deep links and one locally generated QR representation of the real reachable URL. QR generation may use one pinned small library; no external QR service gets participant data.
- [ ] Build the mission page: objective/location/organizer/time, source evidence disclosure, join button, named jobs, member commitments, discussion and follow-up updates. Let members report their own job complete; organizer controls mission metadata/progress. Source status is unchanged by group progress.
- [ ] Verify browser A publishes; B joins via the link, claims a task and posts an update; A sees both; after reload the same responsibility remains; downloaded brief reflects current persisted task state and omits excluded evidence.
- [ ] Run the concurrency, ownership, save/reload, offline/retry and browser checks; update the ledger and make a focused local commit.

**Exit:** a group can organize and carry out a plan. A rising join count alone does not satisfy this phase.

## S4 — Phone readiness, recovery and demo preparation

**Files:** modify the community/mission UI and backend rules only where checks expose issues; extend `scripts/browser-check.mjs`, `docs/COMMUNITY-SETUP.md`, `docs/PITCH.md`, `README.md`, `docs/HANDOFF.md`, and `docs/PHASE-STATUS.md`.

### S4.1 — Hardening and accessible two-browser proof

- [ ] Exercise real-backend abuse/ownership checks, anonymous-auth limits and the chosen protection, oversize text, escaped markup, duplicate sends, simultaneous claims, version conflicts and provider disconnect/reconnect. Don't relax permissions to pass the demo.
- [ ] Verify readable desktop projection and 390/320-pixel join → post → claim → update; keyboard completion, focus and error states; inspect current download/print after shared-state changes. Reuse relevant old tests and add checks for new risks only.
- [ ] Record S4.1 browser/backend results and commit before publishing work.

### S4.2 — Deployment preparation and real phones

- [ ] Prepare a deployable existing Node app: explicit host/PORT configuration, documented environment, browser-safe config and required routes/CSP. Choose the actual hosting target and record price/access prerequisites. No public deployment is implied by this planning request; deploy when the user explicitly directs it.
- [ ] After authorized deployment, test one real phone on cellular and the organizer laptop through the public HTTPS URL. Verify QR opens the same mission and a claimed task/update appears across devices. Do not mark phone readiness complete from two local tabs alone.
- [ ] Rehearse: map finds the place → organizer opens a mission → judge scans and commits to a job → laptop shows the commitment → a clearly labeled sample follow-up demonstrates return use. Keep an honest backup recording; never label a local/recorded interaction as a live phone session.
- [ ] Update acceptance results and limits, commit locally, then return to **R5** for freeze/release/submission packaging. If deployment/access is unresolved, leave S4 incomplete and report the exact missing prerequisite.

## Handoff protocol

Execute the user-requested outcome batch, starting at its first unfinished order. **B2 (B1 review repairs plus S3.1–S3.3) is next; S1.1 is complete.** R1–R4 remain historical completed increments; R5 waits for the shared workflow. Preserve unrelated edits. DIRECTION-REVIEW is a committed historical input with corrections, not the active execution plan.

Keep actual commands/results, current run instructions, cuts and next action in the ledger. Ask only for material missing access or product decisions; continue routine authorized work across internal orders. The single current copy/paste assignment lives in [SONNET-HANDOFF.md](../../SONNET-HANDOFF.md), avoiding a second stale prompt here.

## Planning review record

One read-only builder review checked the specification, plan and relevant existing code. Three issues were resolved in the documents: discussion-origin missions can start without official evidence; imported local owner names/completion flags cannot become authenticated commitments; and leaving/claiming has an atomic membership contract. The reviewer made no changes and ran no product checks. No additional user decision was required to honor the stated community workflow. Backend access and actual social behavior remain unverified until implementation.
