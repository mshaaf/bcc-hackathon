# Implementation phase ledger

This is the canonical phase/work-order ledger. The user selected Sonnet 5.5 in Claude. Current S1–S4 work orders are defined in [the social plan](superpowers/plans/2026-10-21-community-missions.md), with [Sonnet handoff](SONNET-HANDOFF.md). Earlier R/baseline phases preserve history; current scope is in [DECISIONS.md](DECISIONS.md).

**Repository status:** R1–R3 are pushed to the public `https://github.com/mshaaf/bcc-hackathon` (`origin/main`) at the user's instruction. Earlier entries below saying "no push" describe that batch only. Nothing has been deployed or submitted; agents commit locally and the user pushes.

**Active project:** Block Ops — Track 3, Community Development; selected October 21, 2026. **B1 is built and its happy-path checks pass locally, with [four independent-review defects open](B1-REVIEW.md)**. **Next batch: B2**, those repairs plus S3.1–S3.3 shared missions in a connected web app. S1.1 is complete at `9f09667`. No hosted Supabase project, public URL or real phone has been used. **Executor:** Sonnet 5.5 in the user's Claude session. Read [HANDOFF.md](HANDOFF.md) before continuing.

The map/local-campaign revision R1–R4 is implemented. The user now explicitly wants a shared community like a group/group chat, with mission participation and progress. Read [community scope](specs/community-missions.md) and the [social plan](superpowers/plans/2026-10-21-community-missions.md). The current documentation task records the confirmed web-app experience and B2 assignment. Local B1 sharing/provider setup exist; mission implementation and B1 repairs remain open.

## Work-order ledger

| Work order | Deliverable | Status |
|---|---|---|
| S1.1 | Report-date wording/regressions, no provider prerequisite | Complete |
| S1.2 | Shared provider/SDK/Auth proof | Complete (local Supabase; hosted project not tried) |
| S1.3 | Community membership and access | In progress |
| S2.1 | Posts/replies backend | In progress |
| S2.2 | Community feed and cross-browser discussion | In progress |
| S3.1 | Discussion-origin and reviewed-import mission creation | Not started |
| S3.2 | Atomic mission joining/claiming/leaving | Not started |
| S3.3 | Mission UI, links and shared export | Not started |
| S4.1 | Access/recovery/accessible interaction | Not started |
| S4.2 | Deployment prep and authorized real-phone proof | Not started |

Phase rows summarize their child orders. **B1 groups S1.2–S2.2** into one outcome, B2 groups S3.1–S3.3, B3 groups S4.1–S4.2. The user now prefers substantial batches; continue within the authorized batch rather than handing back after every order. S1.1/S1.2 remain complete. S1.3/S2.1/S2.2 are reopened for the confirmed B1 repairs; their built behavior and earlier passing evidence remain valid. Complete those repairs within B2, not separate hand-back batches.

## Social delivery ledger

| Phase | Deliverable | Status |
|---|---|---|
| S1 | Shared backend/identity proof, permissions, truthful recurrence claims | In progress |
| S2 | Community joining, feed, posts and replies across devices | In progress |
| S3 | Shared missions, task commitments and follow-ups | Not started |
| S4 | Recovery, permissions, real phones and authorized deployment proof | Not started |

R5 release/rehearsal follows the social slice; do not skip directly to R5. The existing R phase rows and historical evidence below are preserved.

## Revision ledger

| Phase | Deliverable | Status |
|---|---|---|
| R1 | Scenario, real geospatial data proof, reviewable layout, revised specification/plan | Complete |
| R2 | Real map, source layers/filters, evidence review and chronology | Complete |
| R3 | Saved campaign, owner/date tasks, follow-up and current export | Complete |
| R4 | Recurrence insight ("Closed isn't fixed"), escalation brief, recorded snapshot, stage layout | Complete (local commit; not pushed) |
| R5 | Rehearsal and release/submission package | Not started |

The documentation handoff is prepared. These R phases are proposed batch boundaries; detailed checks and prompts are in the handoff. Keep status evidence-based.

R1 evidence and the R2–R3 specification: [campaign-revision.md](specs/campaign-revision.md).

## Baseline delivery history

| Phase | Deliverable | Status | Evidence |
|---|---|---|---|
| 0 | Research, concepts, and workspace setup | Complete | Initial local commit `92a6cda`; [setup verification](workflow/verification.json). |
| 1 | Selected scope and concrete build plan | Complete | Node.js stack, API contract, files/interfaces, checks, and phase tasks recorded across the decision, README, architecture, implementation plan, Block Ops profile, demo, and test plan. |
| 2 | Reproducible proof of the core mechanism | Complete | `node --test test/data.test.mjs`: 5/5 passed. Live API proof on October 21: 389 records, 389 unique IDs, 67 multi-record street/category candidates, no transfer-limit flag. See [test evidence](TEST-PLAN.md#2026-10-21--phase-2-data-proof). |
| 3 | Complete working MVP and changed output | Complete | Runnable local app, live/fictional inputs, source review, changed brief, and automated/manual checks; see [Phase 3 evidence](TEST-PLAN.md#2026-10-21--phase-3-working-mvp). |
| 4 | Reliable sources, uncertainty, and recovery | In progress | Audit fixes and regression/browser checks below; finish the remaining reliability acceptance criteria. |
| 5 | Polished product and judge interaction | In progress | User requested an early UI correction: three-step worktable, full addresses, live summary, dedicated brief, and responsive/print checks delivered. Final stage rehearsal remains. |
| 6 | Presentation and release package | Not started | Depends on Phase 5. |

Use only **Not started**, **In progress**, **Blocked**, and **Complete** for phase statuses. The baseline rows preserve their last implementation statuses; current continuation is B2, with the confirmed B1 repair gate followed by S3. For the active revision, do not skip an unfinished phase or silently substitute another idea.

## Update after every phase

Change the status row and next phase. Add a short entry below with:

- Date and phase number.
- Deliverable and files changed.
- Commands/checks actually run, observed results, and artifact inspected.
- Remaining limits or exact blocker.
- Local commit if available; do not write a guessed hash.

## Batch history

### 2026-10-21 — Independent B1 findings and B2 web-app handoff

- At `f36867b`, independent checks passed 97 unit tests and 13 explicit local backend tests. Extra probes reproduced loss of newer drafts, membership DELETE metadata exposure, and old-post replay after leaving; manual UI review confirmed the disconnected composer label. [Review](B1-REVIEW.md), [recorded evidence](workflow/b1-independent-review.json). These defects remain open, so affected acceptance rows are reopened; original builder evidence below is preserved.
- User confirmed a web app is sufficient and no framework/native rewrite is required. Updated product/design, scope, handoff/checkpoint and active instructions for connected Community/Missions/Map screens with phone/desktop interaction.
- Next assignment is B2: repair these B1 defects and finish S3.1–S3.3 in one outcome batch. Current task changes documentation only; no app/backend repair, mission implementation, push or deployment is claimed.
- Documentation/link/JSON/consistency checks are recorded under `web_app_b2_handoff` in workflow verification after validation. Product tests were not rerun for this documentation-only change.

### 2026-10-21 — B1: working shared community (S1.2–S2.2)

**Backend actually used:** a local Supabase stack (Supabase CLI 2.121.0 via `npx`, Docker Desktop; Postgres 17, GoTrue, PostgREST, Realtime), anonymous sign-ins enabled. No hosted project was available or created; no cost, no push, no deployment. SDK: `@supabase/supabase-js` 2.118.0 UMD, vendored with its MIT license. Setup and reproduction: [COMMUNITY-SETUP.md](COMMUNITY-SETUP.md).

**Built:** `supabase/migrations/20261021120000_community_posts.sql` + `supabase/seed.sql` (communities, members, posts, one-level replies, RLS select-only, SECURITY DEFINER write functions, idempotent `create_post`, rate limit, member cap, moderator hide with private original text, Realtime publication, join/leave activity bump); `lib/community.mjs` (pure rules, error mapping, threading); `public/community-api.mjs` (SDK wrapper); `public/community.mjs` + HTML/CSS (community feed is the default view, map and campaigns under `#/map`); `server.mjs` (`/api/community-config`, exact provider origins in CSP, refuses a secret key); `.env.example`; `test/community.test.mjs`, `test/community-access.integration.mjs`, extra `test/server.test.mjs` cases; `scripts/community-browser-check.mjs`; `scripts/browser-check.mjs` now opens `#/map`.

**Evidence (all run on this machine, October 21):**
- `node --test`: **110 tests, 97 pass, 0 fail, 13 skipped** (the 13 are the real-backend integration file, skipped without `RUN_COMMUNITY_INTEGRATION=1`; skips are not proof).
- `RUN_COMMUNITY_INTEGRATION=1 … node --test test/community-access.integration.mjs`: **13/13 pass** against the real stack, three times in a row after one cold-start flake (below). Covers distinct anonymous identities and reload persistence, whitelisted preview with no account created, idempotent joins/count, name and body bounds, non-member denial (read, write, edit, hide), cross-community and nested replies, forged-author/role/foreign-membership REST writes denied, author-only edit, moderator-only hide with no hidden text served, DB rate limit, leave/rejoin, Realtime propagation (62–479 ms measured), Realtime isolation from non-members, and leave notification.
- `node scripts/community-browser-check.mjs`: **51/51 pass** with four independent Chrome profiles (A, B, phone-width C, never-joined D): join by keyboard, different user IDs, member list and count update without reload (126 ms), B's post visible in A in 549 ms with exact text, reply grouping, reload keeps session and does not grow the count, markup shown as text, oversize refused with draft kept, offline failure keeps draft and Try again posts once, a send that committed but timed out is not duplicated on retry, own-post edit with label, no Edit/Hide for others, moderator hide removes text for everyone, Realtime container stopped/restarted: A shows "Reconnecting…" then re-fetches the missed post, leaving updates the count, 390 px and 320 px join/post/reply with no horizontal scroll, map section reachable and resized, non-member sees no conversation, no console errors. Screenshots and `results.json`: `docs/ui-review/b1-run/`.
- Existing map/campaign browser driver, run with its entry updated to `#/map`: **75/75 at 1440, 65/65 at 390** (one earlier 390 run had 3 failures caused by DC GIS 503 responses on tiles and the live refresh; it passed on rerun).

**Known limits and findings:**
- Right after `supabase db reset`, or after the Realtime container restarts, Realtime can take roughly 15–20 s to begin streaming. The measured first post after a restart reached A in 21 s, via the client's 10 s/30 s canonical re-fetch, not a live event. The five-second target was measured only in steady state.
- Realtime does not apply row security to DELETE events, so departures are announced by bumping `communities.activity_at` (found by a failing browser check, fixed).
- A blank-looking post (newline/tab only) passed an early `btrim` check; caught by the integration test and fixed with a Unicode-aware trim (migration edited in place; no migration history existed elsewhere).
- Moderator is assigned by an operator in SQL; there is no in-app way to become one (by design).
- Not proven: hosted Supabase, venue/other-network latency, anonymous-auth abuse protection, real phones, simultaneous load. Missions, tasks and claims are not built (B2). Anonymous guests are accounts, not verified people.
- The stale `node server.mjs` that was listening on port 8000 (started 15:25, pre-B1 code) was stopped and replaced by one with the community environment.

### 2026-10-21 — Independent S1.1 review and context checkpoint

- Reviewed code commit `9f09667`, affected callers, UI strings and export. No blocking implementation issue found in the filing-date repair. Corrected the unsupported universal “DC closes every dumping ticket” opener in the historical pitch; a community-first rewrite remains future release work.
- Fresh checks: `node --test` **87 passed, 0 failed, 0 skipped**; syntax checks for `public/app.mjs` and `scripts/browser-check.mjs` passed. Generated/inspected an A-filed-Oct-1/closed-Oct-10, B-filed-Oct-2 brief; asserted filing-date wording, explicit caveat and absence of the old closure claim. Browser driver/visual checks and original red-green run were not repeated.
- Created CONTEXT-CHECKPOINT; refreshed Sonnet assignment, agent entry points, plan, decisions and local tracking. User now wants outcome batches: B1 is S1.2–S2.2 together. Work orders remain internal checklists, not hand-back points.
- S1.1 Complete; aggregate S1 In progress. Shared backend/access is unconfirmed; S1.2–S4.2 are not implemented. No product code, provider setup, push or deployment in this review.
- Documentation link/JSON/consistency and whitespace checks are recorded in `workflow/verification.json` under `s11_review_and_context_checkpoint` after validation.

### 2026-10-21 — S1.1 report-date wording

- Kept the report-creation-date algorithm, radii and windows. Relabeled everything: "followed by another report within 30 days of filing", among reports now marked Closed; the mature subset is "reports filed at least 30 days ago". Caveat now says filing dates, not closure dates, and the later report may predate the closure.
- Changed `lib/recurrence.mjs` (headline, caveat, comments, `recurrenceSummary.matureLabel`), `public/app.mjs` (stat line, busy-spot list), `public/index.html` (legend), `docs/PITCH.md`, README/CLAUDE/HANDOFF pointers, `scripts/browser-check.mjs` expectations. The brief export picks up the new text through `recurrenceHeadline`.
- Added regressions: A filed Oct 1/resolved Oct 10 with B filed Oct 2 is counted but no headline/caveat claims "after closure"; mature-subset label; undated reports excluded. They failed before the fix.
- Checks: `node --test` 87 pass, 0 fail; `git diff --check` clean; generated brief inspected. `scripts/browser-check.mjs` regexes were updated but **not re-run** (needs Chrome, network, writes screenshots). The "Closed isn't fixed" slogan is kept as the product name only.
- Historical measurements (210 of 350, 60%; 26 spots, 56%) are unchanged data, now read as filing-date results. Not touched: provider, SDK, schema, push, deployment.

### 2026-10-21 — Sonnet execution plan refactor

- User selected Sonnet 5.5 for code implementation and requested all scoped documentation committed. Recorded the preference without changing models or assuming an API identifier/performance result.
- Split S1–S4 into ten bounded work orders. S1.1 fixes the confirmed creation-date/closure wording mismatch without waiting for backend access. Deferred schema pieces to their owning work orders.
- Created SONNET-HANDOFF, replaced stale README/current-handoff prompts, and archived the older long handoff with rebased portable links. Retained Claude's formerly untracked DIRECTION-REVIEW as historical input with known factual qualifications.
- Documentation only; no source code, provider setup, deployment or push. Work orders remain Not started. Validation is recorded after document checks.

### 2026-10-21 — Community-first scope and execution plan

- User explicitly requested real group participation: neighbors discuss a concern, agree on a plan, join work and post progress.
- Added the community-missions specification and S1–S4 execution plan, preserving R1–R4 implementation history and deferring R5 release packaging until shared participation works.
- Proposed a single demo community and Supabase Auth/Postgres/Realtime; provider access, project setup, dependencies and hosting remain unconfirmed/unconfigured. No product code or database changed.
- Carried forward the confirmed recurrence-date mismatch as an S1 acceptance item. The old “after closure” pitch cannot be reused as-is. Preserved local campaign data and the untracked DIRECTION-REVIEW document.
- This is planning work. New backend/browser/social checks are specified, not claimed as passed. Documentation checks are recorded after validation.

### 2026-10-21 — R4 complete; R5 next

- **Fixes first:** (1) the follow-up "Fictional practice entry" box is checked by default for every campaign with a visible strong label; unchecking is deliberate and a real entry carries no fictional label (browser check enters one real-labelled entry on purpose). (2) Every "no push" statement now says R1–R3 are on the public `origin/main`; R4 is a local commit only.
- **A. Recurrence (`lib/recurrence.mjs`, tests written first and seen failing):** a record with exact status "Closed" and a point is re-reported if another non-duplicate, non-canceled record with a point is dated after it within 30 days and 150 m. Duplicate/canceled excluded on both sides. Spots = greedy 150 m clusters, densest first. Per-area stats: reports, closed, re-reported, first/latest date, median gap days.
- **Ward-wide stat (live, 2026-10-21T19:17Z; the saved recording from 19:19Z gives the same numbers):** 390 records, 374 countable located; **210 of 350 closed reports (60%) re-reported within 30 days and 150 m**; counting only closures at least 30 days old: 151 of 235 (64%); **26 spots with 5+ reports hold 210 of 374 reports (56%)**. Worst spot: 21 reports, 21 closed, 20 re-reported, median gap 3.5 days. These differ slightly from the rough check in the prompt (62%, 28 spots, 57%) because the rule here excludes duplicates/canceled and requires a point on both sides. Sensitivity on the same data: 100 m → 44% (155/350); 250 m → 79% (278/350); 14-day window at 150 m → 45% (158/350). The pitch says the rule out loud.
- **B. On screen:** header stat line with caveat; busy spots shaded by re-report count (4 tiers, legend entry, keyboard list alternative: the "Jump to a busy spot" select, worst first); campaign headline "21 reports since Jul 27 · 21 closed · 20 re-reported within 30 days of a closure · median gap 3.5 days" plus the "does not mean the same pile / failed cleanup / anyone's fault; block-level" caveat.
- **C. Escalation brief:** campaign fields recipient (free text, no invented contacts) and requested lasting fix (camera, signage, bulk pickup outreach, lighting, scheduled cleanup + check-in, other + text). Brief order: recurrence evidence, the ask, tasks, group progress, follow-ups, city status records, source appendix, caveats. Says "Prepared for the group to send. Nothing has been sent." Old R3 campaigns load with defaults.
- **D. Need check:** findings with source links in [campaign-revision.md section 9](specs/campaign-revision.md). DC already publishes the tickets, a rolling 30-day dumping layer, DPW Cards (heat map, response times) and DumpBusters describes cleanups, signage and enforcement; nothing found that shows a block's closed-then-reported-again pattern or helps residents ask for a lasting fix. Pitch now claims "residents can't see or act on it", not "nobody tracks it".
- **E. Recorded snapshot:** `node scripts/record-snapshot.mjs` writes `data/recorded-snapshot.json` (real Ward 8 records and ward polygon, retrieved 2026-10-21T19:19:19Z, ~307 KB, public data only). Third source button "Recorded DC 311 snapshot (Oct 21)" loads it through a fixed GET-only route; it is labeled RECORDED (not live) everywhere including the brief; official links work; no live reconcile; the fictional practice case stays separate.
- **F. Stage and reliability:** layout checked at 1920x1080 and 1280x720 (stat 17 px / 14 px, title 32 / 20 px, "New campaign here" visible without scrolling after a sticky action bar). Only the Explore panel locks during a refresh, so an open campaign stays editable during a slow API. Tile, API, boundary and 6 s slow-API failures leave the open campaign usable and labeled. Keyboard-only run of the demo path with zero mouse clicks; map dots are no longer tab stops (Leaflet had made 390 of them); focus returns to a sensible control after add/remove; area and save status are `aria-live`.
- **G. `docs/PITCH.md`:** 3-minute script, opens with the stat, judge action, honest Q&A (including "we have not interviewed residents yet"), backup plan.
- **Files:** `lib/recurrence.mjs`, `test/recurrence.test.mjs`, `test/recorded.test.mjs`, `scripts/record-snapshot.mjs`, `data/recorded-snapshot.json`, `lib/block-ops.mjs`, `lib/campaign.mjs`, `public/app.mjs`, `public/index.html`, `public/map.mjs`, `public/styles.css`, `server.mjs`, `scripts/browser-check.mjs`, `test/campaign.test.mjs`, `test/server.test.mjs`, `docs/PITCH.md`, `docs/specs/campaign-revision.md`, `docs/ui-review/r4-run/*`, docs.
- **Checks run:**
  - `node --test`: 85/85 passed (66 prior + 10 recurrence + 4 recorded + 4 campaign + 1 server).
  - `node scripts/browser-check.mjs` against a restarted `node server.mjs`, real Chrome with DevTools device emulation at 1920x1080, 1280x720 (stage checks) and full flows at 1440 and 390 (touch, scale 3), live DC data: **152/152 checks passed**, no console errors, exceptions or CSP violations, no horizontal overflow. Raw results `docs/ui-review/r4-run/results.json`.
  - A4 PDF of the escalation brief (`Page.printToPDF`) inspected by eye: legible, recurrence evidence, recipient, requested fix and "Nothing has been sent" all on page 1.
  - Venue-offline simulation (tiles blocked): recorded snapshot still loads and plots, dots/shading/panel work, map note says tiles failed.
- **Not verified:** real finger/touch; screen reader; the desktop select popup (native, not drivable from CDP; keyboard path uses the select's value change); DPW pages read only through search summaries (dpw.dc.gov returned 403); PDF page size checked by eye, not by an automated MediaBox read; a store near the real localStorage quota.
- **Limits:** the headline depends on the rule (44%–79% across 100–250 m); locations are block-level; a large building or busy street can produce repeat reports that are not a dumping pattern; recurrence does not mean the same pile, a failed cleanup, or anyone's fault; the recorded snapshot is a point-in-time copy (tiles still need internet); one operator, one browser profile; no residents interviewed yet.
- **Cuts (as instructed):** crime layer, pagination, sync, accounts, AI, auto-submission.
- **Unresolved for R5:** freeze, rehearse the pitch out loud, re-record the snapshot on the day, decide README/release wording, license.
- **Local commit:** see `git log`. Not pushed.

### 2026-10-21 — R3 complete; R4 next

- **Fixes first (failing tests written and seen failing before the code):** `updateScope` no longer re-selects a report the user excluded; exclusions persist across radius, date and status changes and clear only when the area centre moves or the source changes. A refresh never moves a saved campaign's area or deletes observations; reviewed reports whose city status changed are flagged "changed since review" and the request confirmation is withdrawn.
- **Deliverable:** saved campaigns (several, listed, one open at a time) from "New campaign here" with the prefilled editable objective; owned tasks with due date and done; typed, dated follow-ups (resident / follow-up / agency) with a fictional label; three separate state tracks; per-campaign brief and Markdown export; localStorage persistence with schema version, temp-write-then-promote, backup, and refusal to overwrite unreadable data. Spec of what was built and the differences from the section 4 sketch: [campaign-revision.md section 8](specs/campaign-revision.md).
- **Files:** `lib/campaign.mjs` (new), `lib/block-ops.mjs` (exclusions, two exports), `public/storage.mjs` (new), `public/app.mjs`, `public/index.html`, `public/styles.css`, `public/map.mjs` (no-animation fits), `server.mjs` (two routes), `scripts/browser-check.mjs` (rewritten for R3; the R2 driver is in commit `b182e9e`), `test/geo.test.mjs`, `test/campaign.test.mjs` (new), `test/storage.test.mjs` (new), `test/server.test.mjs`, `docs/ui-review/r3-run/*`, docs.
- **Checks run:**
  - `node --test`: 66/66 passed (R2's 41 + 25: 2 net new exclusion tests, 15 campaign, 8 storage). The 23 baseline tests are unchanged and pass. The old "manual exclusion survives only until the scope changes" test asserted the bug and was replaced by the three exclusion tests.
  - `node scripts/browser-check.mjs` against the restarted `node server.mjs` on port 8000, real Chrome with DevTools device emulation at 1440x900 and 390x844 (device scale 3, touch emulated), live DC data: **70/70 checks passed (35 per viewport)**, no console errors, exceptions or CSP violations, no horizontal overflow. Raw results `docs/ui-review/r3-run/results.json`; screenshots and an exported brief in the same folder.
    - Flow checked at both sizes: exclude a report, change radius and date, it stays excluded (20 selected before and after) → New campaign here (named "1900 block of Naylor Rd SE", objective "Stop repeat dumping on the 1900 block of Naylor Rd SE", 20 reports, saved) → edit objective, add a fictional resident observation, two tasks with owner and due date, request, mark reviewed → full page reload: campaign reopens with objective, 20 reports, observation, tasks, reviewed state and the area ring on the map → add a fictional follow-up and mark a task done: the review stays, the brief gains the follow-up with "FICTIONAL practice entry" and "[done] Photograph the spot" → downloaded Markdown file contains the follow-up, `- [x]` task, the fictional label and DC 311 source links.
    - Removing a report withdrew the review, blocked export, and removed it from the saved store; re-review restored export.
    - Refresh with a status changed in transit (request intercepted and edited): the row shows "Status changed since review: was Closed", review withdrawn, export blocked, the saved area unchanged, both observations kept. A blocked refresh left the open campaign intact with an error banner.
    - Storage: corrupt JSON and an unknown version each showed an error and turned saving off, a new in-memory campaign worked, and the stored value stayed byte-for-byte unchanged; restoring the last valid value brought the campaign back. A simulated full store (setItem throws QuotaExceededError) showed "storage is full", left the saved value untouched, and the new task still appeared in the page. Disabled storage (localStorage getter throws) was reported, the campaign still worked and exported in memory.
    - Practice case: the campaign is labeled fictional, the brief shows "FICTIONAL PRACTICE CASE", with zero official links.
  - `node scripts/prove-geo.mjs` was not rerun in R3 (R2 run stands; no change to the data path).
- **Not verified:** a real finger/touch gesture; screen-reader behavior; the A4 print/PDF of the campaign brief (print CSS only retargeted); more than one browser tab editing the same store (last write wins); a store near the real localStorage quota (only a simulated error); campaigns created in the practice case after a later live refresh (reconcile intentionally skips them); the busy-spot select by arrow keys on desktop (covered in R2 by type-ahead).
- **Limits:** one operator, one browser profile; `localhost` and `127.0.0.1` have separate stores; clearing site data deletes the campaigns; no sharing or sync; no way to edit an observation or the radius of an existing campaign; unreadable saved data has no in-app reset by design. A judge-facing fictional follow-up depends on ticking the "fictional practice entry" box (it is on by default only for practice campaigns).
- **Cuts:** deleting is a two-step button, not an undo; no export of the raw store.
- **Unresolved:** R4 scope: stable pagination beyond 1,000 records, projector layout, print/PDF inspection, an optional crime layer, and whether the follow-up fictional flag should default on in demos.
- **Local commit:** see `git log` (hash not recorded here).

### 2026-10-21 — R2 complete; R3 next

- **Deliverable:** the map workspace is now `/`: live DC 311 dots on the DC GIS basemap, area by click or busy-spot select, radius 100/150/250 m, date and status filters, oldest-first evidence list with keyboard include/exclude and a source drawer per record, outside-Ward-8 flags, unplaced-record list, three separate state tracks, plan and brief views. `public/prototype.*` deleted. Spec of what was built: [campaign-revision.md section 7](specs/campaign-revision.md).
- **Files:** `lib/block-ops.mjs` (scope/filter/area/block-name/boundary helpers, brief scope + location notes), `server.mjs` (`/map.mjs`, `/api/ward8`; prototype routes removed), `public/index.html`, `public/app.mjs`, `public/map.mjs` (new), `public/styles.css` (rewritten), `scripts/prove-geo.mjs` (reuses lib), `scripts/browser-check.mjs` (new, DevTools-protocol driver), `test/geo.test.mjs` (new), `test/server.test.mjs`, docs.
- **Checks run:**
  - `node --test`: 41/41 passed (23 baseline, 5 from R1, 12 new in `test/geo.test.mjs`, 1 new ward-boundary server test). The 23 baseline checks are unchanged and pass; the 6 audited behaviors are still covered by them (`selectCandidateGroup` and its test are kept though the UI no longer uses street groups).
  - `node scripts/prove-geo.mjs` at 2026-10-21T18:21Z after the refactor: 390 records, 390/390 mapped, 388 inside Ward 8, 2 outside (`26-00601266`, `26-00615737`), boundary check reported as checked; MPD query still 184 records. Saved as `research/evidence/r2-geo-proof-2026-10-21.json`.
  - Real Chrome, DevTools device emulation (not window size): 1440x900 desktop and 390x844 mobile (device scale 3, touch emulated), against the restarted `node server.mjs` on port 8000. Driver: `scripts/browser-check.mjs`; raw results: `docs/ui-review/r2-browser-results.json`; screenshots `docs/ui-review/r2-*.png`.
    - Load: 390 records, 390 markers, tiles loaded, freshness line shows 390 mapped / 0 missing / 0 invalid / 2 outside the boundary, title "1900 block of Naylor Rd SE", 21 reports.
    - Judge actions (both viewports): clicking a different marker changed title, list, tallies; radius 100/150/250 changed rows (desktop 4/5/11 for one spot; mobile 8/11/23); the 30-day filter and unchecking Closed cut rows further (desktop 2 then 0; mobile 4 then 2); resetting restored them. Confirm then open Brief showed the scope line and N records; after changing radius the review check cleared and the brief changed (desktop 5 to 11, mobile 11 to 23).
    - Outside flag: clicking the dashed marker selected "1000 block of New Jersey Ave SE", showed one record with the "Outside Ward 8 boundary" flag (both viewports).
    - Keyboard without the map: Tab reached the first record checkbox in 6 stops, Space toggled it (desktop 11 to 10, mobile 16 to 15; review cleared), ArrowRight on the radius group moved 150 to 250 (mobile rows 16 to 25; on desktop that area had no more reports within 250 m, so rows stayed 11), the busy-spot select changed the area (arrow keys under mobile emulation; type-ahead on desktop, because the desktop native popup cannot be driven through the protocol).
    - Failures: blocking `/api/requests` then clicking Live DC records kept the same area, selection and rows and showed "The data service could not be reached. Your current selection and notes are unchanged." Blocking tile requests left the page usable (21 records, 390 markers) and showed the basemap-outage note. A zoomed-out view with partial tile coverage correctly shows no note. Practice case: 5 fictional rows, 0 map markers, 0 official links in the brief, no outside flags.
    - No console errors, exceptions or CSP violations were logged in any run; no horizontal overflow at 390 or 1440.
- **Not verified:** a real finger/touch gesture on the map (clicks were dispatched under touch emulation); screen-reader announcement of the live region; the A4 print/PDF of the new brief (print CSS was adapted, not re-inspected); a Markdown download from the new UI (covered by unit tests only); behavior with more than 1,000 records (still rejected); performance on a slow device.
- **Limits:** state is memory-only until R3; reload loses selections, review and notes. Points are block-level approximations; proximity is not proof of one incident. The objective text and tasks are placeholders. A basemap-outage note shows only when a whole view loads no tile. DC tile terms: see the spec (district data is CC0; no separate tile terms found).
- **Cuts:** crime, streetlights, resizable radius beyond presets, per-category filters.
- **Unresolved:** R3 persistence UX details (one campaign vs several, how a refreshed status change is shown), the final objective copy, what the judge does after reload.
- **Local commit:** see `git log` (hash not recorded here).

### 2026-10-21 — R1 complete; R2 next

- **Deliverables:** 311 query now returns WGS84 geometry with per-record `geo`/`geoStatus` and snapshot geometry counts; proximity helper; vendored Leaflet 1.9.4; disposable map/campaign page at `/prototype`; separate Ward 8 MPD crime query proof; revised spec, acceptance criteria and file plan in [campaign-revision.md](specs/campaign-revision.md). Files: `lib/block-ops.mjs`, `server.mjs`, `public/prototype.{html,css,mjs}`, `public/vendor/leaflet/{leaflet.js,leaflet.css,LICENSE}`, `scripts/prove-geo.mjs`, `test/data.test.mjs`, `test/server.test.mjs`, `research/evidence/r1-geo-proof-2026-10-21.json`, `docs/ui-review/r1-prototype-1440.png`, README/HANDOFF/this ledger.
- **Checks run:**
  - `node --test`: 28/28 passed (23 baseline + 4 geometry/proximity + 1 server route/CSP). Baseline tests were not weakened; one assertion changed deliberately (`returnGeometry` false to true, plus `outSR=4326`).
  - `node scripts/prove-geo.mjs` at 2026-10-21T17:59Z: 390 dumping records, 390/390 with points (0 missing, 0 invalid), lon -77.0166 to -76.9637, lat 38.8208 to 38.8803 (lon negative, so order is correct); 388/390 inside the official Ward 8 polygon, 2 outside (`26-00601266`, `26-00615737`; source ward label vs point disagree). No transfer limit. Streetlights: 118 "Streetlight Repair Investigation" + 1 "DGS - External Lighting" in Ward 8, last 90 days (counts only, not plotted).
  - MPD layer 39, `WARD='8'`, `outSR=4326`: 184 records, no transfer limit, 184 with points, 1 outside the Ward 8 polygon, report dates 2026-09-21 to 2026-10-21. Not integrated.
  - DC GIS light-gray tile cache fetched at zoom 12/15/17/19 (HTTP 200, 24 h cache header). OSM tile policy read; OSM rejected (Referer requirement vs this app's `no-referrer`).
  - Headless Chrome 1440x900 on `/prototype` served by the current code on port 8001: map, tiles, 390 markers, 150 m area (21 reports), chronology and panel rendered; no CSP/console errors printed. Screenshot: `docs/ui-review/r1-prototype-1440.png`.
- **Not verified:** the prototype at 390 px (headless window was not a true mobile viewport; screenshot discarded); keyboard use of the map; DC GIS written terms for tile reuse; the old baseline UI (`/`) in a browser after the geometry change (its tests pass, and payload gained geometry only); a fresh load from port 8000 (see limits).
- **Limits:** a stale `node server.mjs` (PID started 13:16, old code) still held port 8000 and was not killed; restart it to see `/prototype`. The prototype's objective, tasks and group/resident tracks are mock. Points are block-level. Proximity is not proof of one incident. Pagination still absent. (At the time of this batch nothing was pushed; R1–R3 were pushed to the public `origin/main` afterwards, at the user's instruction.)
- **Cuts:** crime integration, AI, accounts, sync, photos, notifications.
- **Unresolved choices:** listed in section 6 of the revision spec (dumping vs streetlight stage story, radius, flagging boundary mismatches, tile terms, crime yes/no, judge action, objective copy).
- **Local commit:** see `git log` (hash not recorded here).

### 2026-10-21 — Claude documentation handoff and scope revision proposal

- Inspected the current code, Git state, original phase plans, and stale continuation instructions. Existing app tests were rerun: 23/23 passed.
- Added `docs/HANDOFF.md`, a concise `CLAUDE.md` entry point, R1–R5 batch boundaries, and dated aggregate source/competitor evidence. Updated current entry points and workflow state to distinguish the built baseline from the proposed map/campaign product.
- The user authorized documentation only in this batch. No app code, dependencies, hosting, official submission, or outreach was changed, and nothing was pushed in that batch. The account five-hour usage window was not treated as a project deadline or a known remaining allowance.
- Next: R1 after the user directs the next work batch. No map/campaign implementation or new community validation is claimed.

### 2026-10-21 — User-requested UI investigation and repair

- Re-ran the Phase 3 baseline: 17/17 tests passed. The existing UI displayed the source review, all planning fields, and final artifact together, with no clear presentation sequence; full addresses were hidden from the collapsed list. The user requested investigation and a stronger interface, authorizing this targeted reliability and visual work ahead of the earlier batch order.
- Rebuilt the current UI into review → plan → brief, preserving the existing palette and working source/data contracts. Full addresses and original disclosures are visible; the count and status summary reflect the selected evidence; the brief has a distinct paper view and exports.
- Fixed wrong official links for missing object IDs, cross-source/group observation carryover, duplicate-key selection/export disagreement, loading-time edit races, and missing addresses/direct source references in exports. A new source/group clears its observation and date; a failed refresh preserves the reviewed draft.
- Current automated checks: `node --test` passed 23/23. Chromium browser checks exercised changed output, downloaded Markdown, a simulated failed refresh, real live load (389 public records), cleared context, missing observation date, arrow-key tabs, and all three views at 1440, 1024, 768, 390, and 320 pixels. No browser errors or measured horizontal overflow were observed. The fictional sample's A4 PDF was visually inspected.
- An independent visual review found two mobile issues, both fixed and re-inspected: wordmark wrapping at 320 pixels and overlong candidate options at 390 pixels. The mechanical design detector returned no findings. Screenshots and detailed evidence are in [the UI review](ui-review/README.md) and [test plan](TEST-PLAN.md).
- Phases 4 and 5 remain in progress rather than being declared fully complete. Keep the implemented design and finish remaining reliability/acceptance and stage checks in subsequent requested batches. No push, deployment, or official submission occurred in that batch.

### 2026-10-21 — Phase execution handoff prepared

The user chose Luna as the implementation executor and requested numbered phase batches. Phase 0 was verified previously. At handoff creation, no finalist had been selected. The numbered execution plan and resumable ledger were added; no product code was written.

### 2026-10-21 — Block Ops selected

The user explicitly chose Block Ops for Track 3. Its profile is active, the initial MVP and cuts are recorded, and current project documents now agree. Phase 1 remains next: Luna must complete the technical plan before the proof and MVP phases. No implementation phase was marked complete by this selection update.

### 2026-10-21 — Phase 1 complete; Phase 2 started

- **Phase 1 deliverable:** selected Node.js 20+ built-ins, native browser modules, a fixed loopback API proxy, a 90-day Ward 8 / Illegal Dumping query, an explicit fictional offline fixture, in-memory draft state, same-street candidate suggestions, and Markdown/print output. Files: `README.md`, `docs/DECISIONS.md`, `docs/ARCHITECTURE.md`, `docs/IMPLEMENTATION-PLAN.md`, `docs/specs/block-ops.md`, `docs/DEMO-AND-PRESENTATION.md`, `docs/TEST-PLAN.md`, this ledger, and the Luna phase plan.
- **Checks:** read the selected profile and required project documents; inspected the existing ignored 475-row October 20 source snapshot's schema without printing record values; inspected official FeatureServer/21 metadata (field names, 1,000-row cap, and layer timezone). `git diff --check` passed; a local Markdown-link check passed for all nine changed documents. A trial filter using `WARD='8'` returned zero rows; research and the source schema specify `WARD='Ward 8'`. The corrected live query and all product checks are still pending; no data proof is claimed.
- **Limits:** the source grouping is a suggestion by normalized street name and category, not evidence of one incident. Phase 1 documentation only; no product code yet.
- **Local commit:** `433f043` (`docs: finalize Block Ops Phase 1 plan`).

### 2026-10-21 — Phase 2 complete; Phase 3 started

- **Phase 2 deliverable:** bounded live query and source-preserving normalizer, explainable street/category grouping, and a reproducible proof command. Files: `lib/block-ops.mjs`, `scripts/prove-data.mjs`, `test/data.test.mjs`, `docs/TEST-PLAN.md`, this ledger, and the Luna phase plan. Phase 1 local commit: `433f043`.
- **Checks:** test-first run initially failed because `lib/block-ops.mjs` did not exist; then `node --test test/data.test.mjs` passed 5/5. `node scripts/prove-data.mjs` passed against the live API at `2026-10-21T16:44:09.372Z`: 389 records, 389 unique request IDs, 67 multi-record candidate groups, transfer limit false, query window `2026-07-24`–`2026-10-22` (end exclusive). The default sandbox blocked network access; the same proof passed with approved network access. See [test evidence](TEST-PLAN.md#2026-10-21--phase-2-data-proof).
- **Limits:** source outages fail explicitly; app-level draft preservation is unimplemented until Phase 3. Pagination is not implemented; any transfer-limit response is rejected. Candidate grouping is not evidence of one incident or recurrence.
- **Local commit:** recorded in the Phase 3 entry after commit.

### 2026-10-21 — Phase 3 complete; Phase 4 next

- **Phase 3 deliverable:** runnable local worktable with the fixed DC 311 proxy, fictional offline sample, expandable original source fields, record selection and confirmation, resident observation, editable request and two role-based tasks, live preview, Markdown download, and browser print action. Changed selection invalidates review; the current brief omits excluded records. Files: `server.mjs`, `data/demo.json`, `public/index.html`, `public/app.mjs`, `public/styles.css`, `lib/block-ops.mjs`, `test/data.test.mjs`, `test/server.test.mjs`, and `test/workflow.test.mjs`.
- **Checks:** `node --test` passed 17/17 (6 data, 4 server, 7 workflow). `node --check` passed for the server, shared module, and browser module. Manual Chrome checks exercised the fictional sample, excluded `DEMO-102`, saw the brief change from four records to three and confirmation clear, confirmed the revised selection, edited the observation/request/tasks, and opened the downloaded Markdown to verify it matched. Missing date/status stayed unavailable; keyboard Tab/Space selection worked. At a 320-pixel emulated viewport, the stacked interface was visually inspected. The actual UI also loaded live DC data through the proxy on October 21 at `16:55:14.964Z`: 389 records; the largest displayed candidate group had 16 records.
- **Limits:** exact record details require expansion and are not included in the brief. The sample is invented. Drafts are memory-only; pagination is deferred and capped/truncated responses are rejected. Same-street/category matches are candidates, not established incidents or recurrence. A Markdown artifact was inspected; PDF rendering, broader accessibility, and user testing were not performed. No city submission occurs.
- **Local commit:** `bd40645` (`feat: build Block Ops working MVP`).
