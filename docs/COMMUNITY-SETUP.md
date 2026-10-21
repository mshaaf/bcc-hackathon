# Shared community — setup, tests and limits

Placeholders only. No real credential is committed. The shared community uses Supabase (Postgres, Auth, Realtime). B1 was verified against a **local** Supabase stack started with the Supabase CLI and Docker. **No hosted Supabase project exists or has been tested** (see "What is not proven").

## What runs where

| Piece | Where | Notes |
|---|---|---|
| Node app (`server.mjs`) | `http://127.0.0.1:8000` | Serves the pages and read-only DC 311 proxies. Also serves `GET /api/community-config` (URL + **publishable** key + default community id) and the CSP. |
| Browser SDK | `public/vendor/supabase/supabase.js` | `@supabase/supabase-js` **2.118.0** UMD bundle, MIT, license beside it. Loaded as a same-origin script; no CDN. |
| Database, Auth, Realtime | Supabase | Schema in `supabase/migrations/`, seed in `supabase/seed.sql`, local settings in `supabase/config.toml`. |

The browser only ever receives the project URL and the publishable key. `server.mjs` refuses to start if the key looks like a secret or service-role key. All permissions are enforced in Postgres, not in the page.

## Run it locally

Needs Node 20+ (Node 22+ for the Realtime tests, which use the global `WebSocket`), Docker Desktop and Google Chrome for the browser check. The CLI is run with `npx supabase@2.121.0` (nothing is added to the repo's dependencies).

```sh
npx supabase@2.121.0 start          # first run pulls Docker images (a few GB)
npx supabase@2.121.0 db reset       # applies supabase/migrations and supabase/seed.sql
npx supabase@2.121.0 status -o env  # prints API_URL, PUBLISHABLE_KEY and SECRET_KEY for this machine

cp .env.example .env                # fill COMMUNITY_SUPABASE_URL and COMMUNITY_SUPABASE_PUBLISHABLE_KEY (ignored by Git)
node --env-file=.env server.mjs     # open http://127.0.0.1:8000
```

Without those two variables the Community page says the shared community is not configured; nothing is faked. The map and local campaigns work either way, under `#/map`.

`supabase/config.toml` enables anonymous sign-ins and sets the local anonymous limit to 500/hour per IP for testing. **Before any public exposure** set a real per-IP limit and enable the provider's CAPTCHA/abuse protection, then test the venue's shared-IP behavior; do not just leave the testing value.

## Guest identity (anonymous Auth)

Joining creates a Supabase **anonymous** user. A display name is a label, not a credential and not a residency check. The session lives in that browser's `localStorage`; clearing site data or switching device loses the identity (and its posts stay under the old, now unreachable, account). Counts are **accounts**, not unique people. Anonymous users share the `authenticated` database role, so every policy checks membership or ownership explicitly instead of trusting the role.

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

## Tests

```sh
node --test                                         # unit suite; the integration file is skipped without the flag below
RUN_COMMUNITY_INTEGRATION=1 \
COMMUNITY_SUPABASE_URL=http://127.0.0.1:54321 \
COMMUNITY_SUPABASE_PUBLISHABLE_KEY=<publishable key> \
COMMUNITY_SUPABASE_SECRET_KEY=<secret key> \
node --test test/community-access.integration.mjs   # real Auth + Postgres + Realtime

COMMUNITY_SUPABASE_URL=... COMMUNITY_SUPABASE_SECRET_KEY=... node scripts/community-browser-check.mjs   # app must be running with the community env
```

- A skipped integration run is **not** backend proof. With `RUN_COMMUNITY_INTEGRATION=1` and missing variables the file fails with a message naming them.
- The secret key is used only by those two test programs (to create throwaway communities, set a moderator, delete test users). It is never sent to a browser.
- Right after `supabase db reset`, Realtime can need a few seconds before it streams; the integration test warms it up first and prints a note when it did.
- The browser check launches independent Chrome instances with separate profiles, creates a throwaway community, stops and restarts the local Realtime container to exercise reconnect, writes screenshots and `results.json` to `docs/ui-review/b1-run/`, and cleans up its data.

## What is not proven

- No hosted Supabase project, hosting target, public URL or real phone on another network (that is B3/S4.2).
- Abuse protection for anonymous sign-ins on a public project (CAPTCHA, per-IP limits) is not configured or tested.
- Propagation timings are from one machine over localhost, not from a venue network.
- Missions, tasks, claims and mission updates are not built (B2).
