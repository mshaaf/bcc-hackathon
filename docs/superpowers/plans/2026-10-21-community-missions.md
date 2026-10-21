# Community Missions Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans for the user's Claude/Luna phase batches. Subagent-driven development is optional only if explicitly requested. Steps use checkboxes. No product implementation was authorized or performed by the planning task that created this file.

**Goal:** neighbors join a community, discuss a local concern, commit to mission tasks, and share progress across their own devices.

**Architecture:** preserve Node/native browser/Leaflet and the audited source/campaign logic. Add a managed shared backend, authenticated participants and row-level permissions. Keep posts, membership and claims independently writable; publish a reviewed copy of a local campaign instead of synchronizing its whole local store.

**Tech Stack:** existing Node.js 20+ ES modules and Leaflet; recommended Supabase Postgres/Auth/Realtime, subject to actual project access and dependency proof in S1. No project, SDK, migrations or hosting have been provisioned. Pin the chosen SDK version when implementing.

**Spec:** [community-missions.md](../../specs/community-missions.md). The user's community-first intent is confirmed; named provider, one-group/guest defaults and detailed interfaces below are builder proposals to review against the user's next execution instruction.

## Global constraints

- One Ward 8 demonstration community and the proven dumping source first; no all-category or crime expansion before shared participation works.
- Display names are 1–40 characters; mission titles 1–120; post bodies 1–2,000. Source facts, user observations and demo entries stay distinct.
- One claimant per task; one membership per authenticated user per group/mission. Counts represent participant accounts, not verified humans or residents.
- Retain local campaigns; publish only a reviewed copy. No automatic upload, migration, overwrite or deletion of browser data.
- No service-role/secret browser key, client-only authorization, fake live activity, automatic agency submission, or unrequested public deployment.
- Every assistant message ends in a super-simple TL;DR. Preserve unrelated work, including the untracked `docs/DIRECTION-REVIEW.md`.

## Review focus

1. Two sessions claim the same task simultaneously: database-enforced single winner, clear loser response.
2. A participant bypasses the UI: backend rejects forged authors, role changes and edits to others' missions.
3. A send times out after committing: retry is idempotent and keeps the user's text.
4. Realtime disconnect/reconnect: re-fetch current permitted state; no stale counts, duplicate events or permanent spinner.
5. Existing private/local campaign notes: publication is deliberate and selective; local original survives unchanged.

## S1 — Shared foundation and truthful evidence

**Files:** modify `lib/recurrence.mjs`, `test/recurrence.test.mjs`, `docs/PITCH.md`, affected UI copy and `server.mjs`; create `public/community-api.mjs`, `lib/community.mjs`, `test/community.test.mjs`, `test/community-access.integration.mjs`, and setup instructions `docs/COMMUNITY-SETUP.md`. Add migration files using the selected Supabase workflow only after checking the current CLI/project. Do not invent a migration history or claim setup before applying/verifying it.

**Interfaces:** `createCommunityClient(config)` returns `ensureSession() -> {userId}`, `getCommunity(id)`, `joinCommunity(id, displayName)`, `leaveCommunity(id)`, and later methods named below. Client configuration contains only the project URL/publishable key. Database entities, bounds and authorization follow the spec. Pure domain validation lives in `lib/community.mjs`; database constraints/permissions remain authoritative.

- [ ] Add the recurrence counterexample: A created Oct 1, resolved Oct 10; B created Oct 2 at the same point. A closure-based count must not treat B as after closure. If retaining the creation-date algorithm, change every UI/pitch/export claim to that supported meaning and assert the wording. Never infer the closure timestamp from report date.
- [ ] Run `node --test test/recurrence.test.mjs` and observe the regression fail under the selected contract; implement the minimal correction and rerun it. Keep unknown closure dates unknown.
- [ ] Inspect actual Supabase/hosting access and current docs/changelog. Record prerequisite account access and actual costs/limits; do not claim a free or configured service. Retain the existing stack; add only the SDK packaging needed by this feature.
- [ ] Implement/apply the minimum shared entities, foreign keys, uniqueness, RLS and bounded write validation from the spec. Configure anonymous Auth and seed one clearly labeled demo community with a controlled moderator identity. No user-editable authorization metadata.
- [ ] Write/run access tests with independent sessions A and B plus unauthenticated requests: duplicate membership idempotent; forged creator/author rejected; cross-community read/write denied; secret keys absent from client responses. Use actual backend responses as evidence. Make backend tests opt-in for the default unit run; explicit invocation is `RUN_COMMUNITY_INTEGRATION=1 node --test test/community-access.integration.mjs` with the configured environment from COMMUNITY-SETUP. An explicit integration invocation must fail clearly if configuration is missing. Record skips as unverified, never as an access-control pass.
- [ ] Verify session reload and identity limits, explicit asset/config routes and narrow HTTPS/WSS CSP. Record the exact reproducible integration-test command/configuration in COMMUNITY-SETUP; no credentials in Git or output.
- [ ] Run the applicable unit and backend integration checks, record results/remaining prerequisites, update the ledger, and make a focused local commit. Stop if backend proof fails; do not substitute localStorage and call it shared.

**Exit:** two independent sessions can access the permitted shared group; access tests pass; unsupported recurrence copy corrected. No feed or mission participation is claimed yet.

## S2 — Join the community and talk

**Files:** create `public/community.mjs` and `test/community-feed.test.mjs`; modify `public/index.html`, `public/styles.css`, `public/community-api.mjs`, `server.mjs`, backend migrations/permissions and `scripts/browser-check.mjs` as needed.

**Interfaces:** `listPosts(communityId) -> Post[]`, `createPost({communityId, missionId?, parentId?, body, operationId}) -> Post`, `editOwnPost(postId, body)`, `hidePost(postId)`, `subscribeCommunity(communityId, onChange) -> unsubscribe`. Posts are sorted by created time then ID; one-level replies remain in their parent's group/mission. Domain types/limits match the spec. A server-generated authenticated user ID supplies authorship; never accept a display name as authority.

- [ ] Add focused tests for bounded plain-text bodies, same-group replies, own-post edits, moderator hiding and idempotent post retries. Add backend tests that bypass UI controls and fail unauthorized actions.
- [ ] Implement the API methods and database enforcement; verify the tests against the real shared backend.
- [ ] Make the default screen the community feed: purpose, join action, members, chronological posts, replies, and active-mission area. Keep the existing map reachable as discovery. Label seeded/sample content accurately.
- [ ] Implement immediate cross-device update using permitted Realtime subscriptions plus canonical re-fetch. Show sending/error/reconnect states and preserve unsent text. Clean up subscriptions when changing views.
- [ ] Extend the browser driver to use two independent profiles: B joins and posts, A sees the exact text/count within five seconds on the tested healthy connection; reload keeps the session; retry does not duplicate. A can see no unauthorized/private fields. Check mobile and keyboard paths.
- [ ] Record unit/integration/browser evidence and a focused local commit. Do not claim real community adoption from demo accounts.

**Exit:** neighbors can genuinely gather and converse from separate browsers. This must work before adding more categories or optional social features.

## S3 — Turn discussion into a shared mission

**Files:** create `public/mission.mjs`, `test/community-mission.test.mjs`; modify `public/community-api.mjs`, `lib/community.mjs`, `lib/campaign.mjs`, `public/app.mjs`, `public/index.html`, `public/styles.css`, backend migrations/permissions and the browser driver. Keep `public/storage.mjs` for local drafts; do not replace every local save with a whole shared JSON write.

**Interfaces:** `createMission({communityId, title, objective, location, sourcePostId?, operationId}) -> Mission` creates a discussion-origin mission with optional evidence added later; `publishMission({communityId, campaign, operationId}) -> Mission` publishes a reviewed local campaign copy; `getMission(id) -> {mission,members,tasks,posts}`, `joinMission(id)`, `leaveMission(id)`, `claimTask(taskId)`, `releaseTask(taskId)`, `setTaskDone(taskId, done)`, `updateMission({id, expectedVersion, changes})`, `subscribeMission(id, onChange) -> unsubscribe`. Mission discussion reuses S2 posts with `missionId`. Atomic task claims derive their mission from the stored task. Joining/retries use database uniqueness; metadata version conflicts show a recoverable conflict.

- [ ] Add failing tests for a discussion-origin mission with zero official records and a same-group source-post link; deliberate local publication with original untouched; excluded evidence absent; imported task owners/done flags reset to unclaimed/not done; historical observations marked imported/original author unverified; fictional labels preserved; duplicate joins; concurrent claims with exactly one winner; cross-community writes denied; and leave/claim races with no orphan claim.
- [ ] Implement the shared mission model/permissions, both creation paths, and atomic claim/release/complete/leave operations. Leaving releases unfinished claims; the active organizer must archive before leaving; community departure removes all mission memberships/unfinished claims atomically. Serialize membership removal with claims. Reuse campaign builders for sourced missions; add an evidence-free shared plan export that clearly says “No official 311 records attached” without weakening existing local campaign export guards. Fetch current task/member/post state separately before export.
- [ ] Add a reviewed local-publication preview and a “Start a mission” action on a discussion. Use `/#/community/<uuid>/mission/<uuid>` deep links and one locally generated QR representation of the real reachable URL. QR generation may use one pinned small library; no external QR service gets participant data.
- [ ] Build the mission page: objective/location/organizer/time, source evidence disclosure, join button, named jobs, member commitments, discussion and follow-up updates. Let members report their own job complete; organizer controls mission metadata/progress. Source status is unchanged by group progress.
- [ ] Verify browser A publishes; B joins via the link, claims a task and posts an update; A sees both; after reload the same responsibility remains; downloaded brief reflects current persisted task state and omits excluded evidence.
- [ ] Run the concurrency, ownership, save/reload, offline/retry and browser checks; update the ledger and make a focused local commit.

**Exit:** a group can organize and carry out a plan. A rising join count alone does not satisfy this phase.

## S4 — Phone readiness, recovery and demo preparation

**Files:** modify the community/mission UI and backend rules only where checks expose issues; extend `scripts/browser-check.mjs`, `docs/COMMUNITY-SETUP.md`, `docs/PITCH.md`, `README.md`, `docs/HANDOFF.md`, and `docs/PHASE-STATUS.md`.

- [ ] Exercise real-backend abuse/ownership checks, anonymous-auth limits and the chosen protection, oversize text, escaped markup, duplicate sends, simultaneous claims, version conflicts and provider disconnect/reconnect. Don't relax permissions to pass the demo.
- [ ] Verify readable desktop projection and 390/320-pixel join → post → claim → update; keyboard completion, focus and error states; inspect current download/print after shared-state changes. Reuse relevant old tests and add checks for new risks only.
- [ ] Prepare a deployable existing Node app: explicit host/PORT configuration, documented environment, browser-safe config and required routes/CSP. Choose the actual hosting target and record price/access prerequisites. No public deployment is implied by this planning request; deploy when the user explicitly directs it.
- [ ] After authorized deployment, test one real phone on cellular and the organizer laptop through the public HTTPS URL. Verify QR opens the same mission and a claimed task/update appears across devices. Do not mark phone readiness complete from two local tabs alone.
- [ ] Rehearse: map finds the place → organizer opens a mission → judge scans and commits to a job → laptop shows the commitment → a clearly labeled sample follow-up demonstrates return use. Keep an honest backup recording; never label a local/recorded interaction as a live phone session.
- [ ] Update acceptance results and limits, commit locally, then return to **R5** for freeze/release/submission packaging. If deployment/access is unresolved, leave S4 incomplete and report the exact missing prerequisite.

## Handoff protocol

Execute only the user-requested S-phase range/count, starting at the next unfinished S phase. R1–R4 remain historical completed increments; R5 waits for this social workflow. Preserve unrelated edits and never stage `docs/DIRECTION-REVIEW.md` merely because it is untracked. Keep every phase's command/results, current run instructions, cuts, and next step in the ledger. Ask only for material missing access or product decisions; continue routine authorized work within a batch.

Copy/paste next prompt:

```text
Read CLAUDE.md, docs/specs/community-missions.md, and
docs/superpowers/plans/2026-10-21-community-missions.md.
Execute S1 only. Preserve the existing app and local campaigns.
Prove the shared backend and fix the unsupported recurrence claim.
Record actual tests and prerequisites, then stop at the phase boundary.
Do not deploy, push, contact anyone, or implement later phases.
End each message with a very simple TL;DR.
```

## Planning review record

One read-only builder review checked the specification, plan and relevant existing code. Three issues were resolved in the documents: discussion-origin missions can start without official evidence; imported local owner names/completion flags cannot become authenticated commitments; and leaving/claiming has an atomic membership contract. The reviewer made no changes and ran no product checks. No additional user decision was required to honor the stated community workflow. Backend access and actual social behavior remain unverified until implementation.
