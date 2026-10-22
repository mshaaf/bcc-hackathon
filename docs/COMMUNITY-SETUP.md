# Shared community and missions — setup, tests and limits

Placeholders only. No real credential is committed. For a hosted deployment see [DEPLOYMENT](DEPLOYMENT.md). The shared community and missions use Supabase (Postgres, Auth, Realtime). B1 and B2 were verified against a **local** Supabase stack started with the Supabase CLI and Docker. **No hosted Supabase project exists or has been tested** (see "What is not proven").

## What runs where

| Piece | Where | Notes |
|---|---|---|
| Node app (`server.mjs`) | `http://127.0.0.1:8000` | Serves the pages and read-only DC 311 proxies. Also serves `GET /api/community-config` (URL + **publishable** key + default community id) and the CSP. |
| Browser SDK | `public/vendor/supabase/supabase.js` | `@supabase/supabase-js` **2.118.0** UMD bundle, MIT, license beside it. Loaded as a same-origin script; no CDN. |
| QR code | `public/vendor/qrcode/qrcode.js` | `qrcode-generator` **1.4.4** (MIT). Draws the mission QR in the browser; no request leaves the page. |
| App modules | `public/shell.mjs` (routing, state, live updates, drafts, send path), `community.mjs` (feed), `mission.mjs` (missions, jobs, publish), `posts.mjs` (threads), `lib/community.mjs`, `lib/mission.mjs`, `lib/drafts.mjs` | Native ES modules; no build step. |
| Database, Auth, Realtime | Supabase | Schema in `supabase/migrations/`, seed in `supabase/seed.sql`, local settings in `supabase/config.toml`. |

The browser only ever receives the project URL and the publishable key. `server.mjs` refuses to start if the key looks like a secret or service-role key. All permissions are enforced in Postgres, not in the page.

## Run it locally

Needs Node 20+ (Node 22+ for the Realtime tests, which use the global `WebSocket`), Docker Desktop and Google Chrome for the browser check. The CLI is run with `npx supabase@2.121.0` (nothing is added to the repo's dependencies).

```sh
npx supabase@2.121.0 start          # first run pulls Docker images (a few GB)
npx supabase@2.121.0 db reset       # FIRST-TIME or disposable stacks only: wipes the local database, then applies migrations + seed
npx supabase@2.121.0 migration up   # an existing stack: applies only new migrations and keeps its data
npx supabase@2.121.0 status -o env  # prints API_URL, PUBLISHABLE_KEY and SECRET_KEY for this machine

cp .env.example .env                # fill COMMUNITY_SUPABASE_URL and COMMUNITY_SUPABASE_PUBLISHABLE_KEY (ignored by Git)
node --env-file=.env server.mjs     # open http://127.0.0.1:8000
```

Without those two variables the Community page says the shared community is not configured; nothing is faked. The map and local campaigns work either way, under `#/map`.

`supabase/config.toml` is for the **local stack only**: it enables anonymous sign-ins and sets the local anonymous limit to 500/hour per IP for testing. Never `supabase config push` it to a hosted project (it would overwrite the dashboard's real limits). **Before any public exposure** set a real per-IP limit in the hosted dashboard and test the venue's shared-IP behavior. Do **not** turn CAPTCHA on for anonymous sign-ins yet: the app sends no CAPTCHA token, so every guest would be refused until a widget and `captchaToken` are added (a feature decision; see [DEPLOYMENT](DEPLOYMENT.md#open-risk-anonymous-sign-ins)).

## Guest identity (anonymous Auth)

Joining creates a Supabase **anonymous** user. A display name is a label, not a credential and not a residency check. The session lives in that browser's `localStorage`; clearing site data or switching device loses the identity (and its posts stay under the old, now unreachable, account). Counts are **accounts**, not unique people. Anonymous users share the `authenticated` database role, so every policy checks membership or ownership explicitly instead of trusting the role.

## Migrations (applied in order; never edit an applied one)

| File | What |
|---|---|
| `20261021120000_community_posts.sql` | B1: communities, members, posts, RLS, join/leave/post/edit/hide functions, Realtime publication |
| `20261021200000_missions_and_b1_repairs.sql` | B2: missions, mission members, tasks, claims, mission-scoped posts; B1 repairs: drop `community_members` from the Realtime publication, authorize before replaying an operation |
| `20261021210000_join_mission_hides_existence.sql` | A non-member gets `mission_not_found` for joining, never confirming an id exists |
| `20261021220000_join_community_announces.sql` | Join bumps `communities.activity_at` (membership is no longer published) |
| `20261021230000_import_order.sql` | Imported observations keep the organizer's order |
| `20261022100000_b3_evidence_and_reopen_repairs.sql` | B3 repairs: `create_mission` validates every shared evidence/source/observation field at the write boundary; `set_task_done` keeps the membership/assignment invariant when finished work is reopened. **Written and syntax-checked without a running backend; not yet applied or tested** (apply with `migration up`, then run both integration suites) |

## Data model and rules (B1)

`communities`, `community_members`, `posts` (replies are posts with a parent in the same community, one level deep), plus `private.post_removed` (original text of moderator-hidden posts; not exposed through the API).

- Clients have **SELECT only** on the three tables, limited by row-level security to members of that community. Column grants omit nothing sensitive; `private` is not an exposed schema.
- Every write is a `SECURITY DEFINER` function that takes the actor from `auth.uid()`: `join_community`, `leave_community`, `create_post`, `edit_post`, `hide_post`. There are no author/role parameters to forge.
- `community_preview(id)` is callable with no session and returns only id, title, description, demo flag and member count.
- Bounds enforced in the database: display name 1–40 characters (no control characters), post body 1–2,000 (blank-looking text counts as empty), 20 posts per member per minute, 500 members per community.
- `create_post` is idempotent per `(author, operation_id)`: a retried send returns the existing post.
- Only the author edits a post. Only the community's moderator (`communities.moderator_id`, set by an operator, never by a client) hides one; hiding blanks the visible text.
- Join and leave bump `communities.activity_at`. Realtime does not apply row security to DELETE events, so members learn of a departure from that row's UPDATE event, then re-fetch.

Make someone a moderator (operator action, local example):

```sh
docker exec supabase_db_blockops psql -U postgres -c "update public.communities set moderator_id = '<user uuid>' where id = 'b10c0000-0000-4000-8000-000000000001'"
```

A member's user id is visible to that member only via the browser's stored session; the Community page does not show it. Use the Supabase Studio/SQL or `auth.users` locally.

## Missions, jobs and claims (B2)

`missions` (organizer, title 1–120, goal 1–1,000, public location 1–200, optional time, status planning/scheduled/in progress/follow-up/archived, `origin` discussion or local campaign, optional same-community source post, `version`, evidence/source JSON for a published campaign), `mission_members`, `mission_tasks` (description 1–200, optional due date, at most one claimant, done flag), and `posts` gain `mission_id`, `kind` (discussion / update / observation), `observed_on`, `fictional`, `imported`.

- All writes are `SECURITY DEFINER` functions again: `create_mission` (both creation paths, idempotent per `(organizer, operation)`), `update_mission` (organizer only, `expected version` or `version_conflict`), `join_mission`, `leave_mission`, `add_task`, `claim_task`, `release_task`, `set_task_done`; `create_post`, `hide_post` and `leave_community` were extended. Tables stay SELECT-only under RLS for community members.
- **One winner:** `claim_task` locks the claimant's mission-membership row `FOR SHARE` and the task row `FOR UPDATE`; a second claimant gets `already_claimed`. `leave_mission` deletes the membership first (needing that same lock), then releases unfinished claims, so a leave/claim race cannot leave an unfinished job with a departed member. Finished jobs keep `claimed_by`/`claimed_name`. Leaving the community leaves its missions the same way; an organizer of a non-archived mission must archive first.
- **Publishing a local campaign** sends only reviewed evidence, job text/due dates (never owners or done flags), and the observations the organizer ticks (stored as `imported` observations by the publisher, original author unverified). The local campaign in the browser is only read.
- **Realtime** publishes `posts`, `missions`, `mission_tasks` and `communities` (single-uuid keys, row-security checked). Membership tables are not published; join/leave bump `communities.activity_at` / `missions.activity_at`.
- Evidence and source JSON written by one member is validated field by field at the write boundary (B3 migration) and, because older rows are not covered, also coerced to plain primitives on read (a row that still fails is skipped, not fatal) and rendered with `textContent`.
- Limits: 100 missions, 1,500 job rows and 2,000 mission-membership rows are read per community by the page; 1,000 posts per list. A large community needs pagination (not built).

## Tests

```sh
node --test                                         # unit suite; the integration file is skipped without the flag below
RUN_COMMUNITY_INTEGRATION=1 \
COMMUNITY_SUPABASE_URL=http://127.0.0.1:54321 \
COMMUNITY_SUPABASE_PUBLISHABLE_KEY=<publishable key> \
COMMUNITY_SUPABASE_SECRET_KEY=<secret key> \
node --test test/community-access.integration.mjs test/community-mission.integration.mjs   # real Auth + Postgres + Realtime

# app must be running with the community env (node --env-file=.env server.mjs); Docker is used to stop/start Realtime and to run psql
COMMUNITY_SUPABASE_URL=... COMMUNITY_SUPABASE_SECRET_KEY=... node scripts/community-browser-check.mjs   # B1: community, 51 checks
COMMUNITY_SUPABASE_URL=... COMMUNITY_SUPABASE_SECRET_KEY=... node scripts/mission-browser-check.mjs     # B2: missions end to end
node scripts/browser-check.mjs 1440   # existing map and campaign driver (opens #/map); also 390 (set OUT=<dir> so it does not overwrite earlier screenshots)

# needs only Chrome: the real app and server with the SDK replaced by an in-page fake. Interface behavior only; NOT backend proof.
node scripts/ui-fixture-check.mjs
```

**Order after a pause with the stack stopped:** the stack is started by the person at the keyboard (assistants must not start Docker unless asked, see [HANDOFF](SONNET-HANDOFF.md)). Then `migration up` (the B3 migration), `node --test` for the unit suite, both integration files, `mission-browser-check.mjs`, `community-browser-check.mjs`.

- A skipped integration run is **not** backend proof. With `RUN_COMMUNITY_INTEGRATION=1` and missing variables the file fails with a message naming them.
- The secret key is used only by those two test programs (to create throwaway communities, set a moderator, delete test users). It is never sent to a browser.
- Right after `supabase db reset`, Realtime can need a few seconds before it streams; the integration test warms it up first and prints a note when it did.
- The integration tests use throwaway communities and users in whatever stack you point them at and delete them afterwards; they never `db reset`. Run the two integration files one after the other if you also watch for stray events: other tests' cleanup emits DELETE events carrying only a row id.
- Realtime stops streaming for roughly 15–20 s after its container starts (measured). The page re-fetches on reconnect and at most every 30 s regardless, so staleness is bounded.
- The browser checks launch independent Chrome instances with separate profiles, creates a throwaway community, stops and restarts the local Realtime container to exercise reconnect, writes screenshots and `results.json` to `docs/ui-review/b1-run/`, and cleans up its data.

## What is not proven

- No hosted Supabase project, hosting target, public URL or real phone on another network. The runbook and the acceptance checklist, including the two-phone test, are in [DEPLOYMENT](DEPLOYMENT.md); none of it has been done.
- Abuse protection for anonymous sign-ins on a public project (per-IP limit; CAPTCHA would need a client change) is not configured or tested.
- Propagation timings are from one machine over localhost, not from a venue network.
- Mission links and QR codes pointing at `127.0.0.1` work only on this computer. A phone on another network needs a public HTTPS address (the link and QR are built from the address the page was opened at), which does not exist yet.
- No pagination, notifications, photo uploads, direct messages, ownership transfer or second community.
