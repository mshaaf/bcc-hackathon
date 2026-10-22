# Hosted deployment — preparation and runbook

**Status: prepared, not performed.** Nothing has been provisioned, hosted or published. Creating a Supabase project, creating a host service, any paid plan, a public URL and a real-phone test each need the user's explicit instruction. Until then the app runs locally ([COMMUNITY-SETUP](COMMUNITY-SETUP.md)).

## What is hosted

| Piece | What it needs |
|---|---|
| The app | Any host that runs Node 20+ and a start command. No build step, no dependencies to install: `node server.mjs`. |
| The shared community | One Supabase project (Postgres, Auth, Realtime). The browser talks to it directly with the project URL and **publishable** key only. |
| DC data | The app server fetches the city's public layers on request (`/api/requests`, `/api/ward8`). The host needs outbound HTTPS. |

## Server settings (environment)

| Variable | Meaning |
|---|---|
| `COMMUNITY_SUPABASE_URL` | `https://<project-ref>.supabase.co` (a plain https origin). |
| `COMMUNITY_SUPABASE_PUBLISHABLE_KEY` | The project's publishable (anon) key. `server.mjs` refuses to start with a secret/service-role key. |
| `COMMUNITY_ID` | Optional UUID of the community the app opens by default (the seeded demonstration community if unset). |
| `PORT` | Port to listen on. Hosts set this. Defaults to 8000. |
| `HOST` | Interface to listen on. Defaults to `127.0.0.1` (this computer only). Set `0.0.0.0` on a host so its proxy can reach the app. |

Never set `COMMUNITY_SUPABASE_SECRET_KEY` on the host; only the integration tests use it, from a developer machine.

`GET /healthz` answers `{"ok":true}` without calling Supabase or the city, for a host's health check. When a proxy sends `X-Forwarded-Proto: https` the app adds `Strict-Transport-Security`. The CSP already limits browser connections to the app itself plus the configured Supabase origin (`https` and `wss`) and the DC tile host; the page loads no third-party script or font.

**Preflight** (reads the environment, never prints a key). The probe does **not** prove that every migration is applied (it only calls the first migration's `community_preview`); that is checked separately with `supabase migration list --linked` in the acceptance list below.

```sh
node --env-file=.env scripts/check-deploy-config.mjs            # checks the settings and lists the migrations to apply
node --env-file=.env scripts/check-deploy-config.mjs --probe    # also makes one read-only call: the project is reachable and the default community exists
```

## Steps, when authorized

1. **Supabase project.** Create it in the dashboard (the user decides plan and region). Check the plan's current connection, Realtime and inactivity-pause limits before relying on it for a demo.
2. **Migrations.** From a machine with the Supabase CLI: `npx supabase@2.121.0 link --project-ref <ref>` then `npx supabase@2.121.0 db push`. All files in `supabase/migrations/` apply in name order (the preflight lists them). Migrations are forward-only; never edit an applied one. **Do not run `supabase db reset` or `supabase config push` against the hosted project**: `config.toml` carries the local-only anonymous limit of 500/hour and would overwrite the dashboard's real settings.
3. **Seed.** Run `supabase/seed.sql` once in the SQL editor (it inserts the labeled demonstration community with a fixed id; it is idempotent).
4. **Auth settings (dashboard).** Enable anonymous sign-ins (the app creates a guest account on joining). Set a real per-IP limit for anonymous sign-ins. See "Open risk: anonymous sign-ins" below before enabling CAPTCHA.
5. **Realtime.** Confirm the publication contains `posts`, `missions`, `mission_tasks`, `communities` and **not** `community_members` (a departed member's id would leak to outsiders through DELETE events). The migrations set this; it is a dashboard-visible check.
6. **Moderator.** `communities.moderator_id` is set by an operator in SQL, never by a client. Leave it unset or assign the demo organizer deliberately.
7. **Host the app.** Create the service from this repository with start command `node server.mjs` and no build step; set the variables above in the host's dashboard (not in a file). Set `HOST=0.0.0.0`, point its health check at `/healthz`, and serve it over HTTPS (the QR code and share link are built from the address people actually open, so a public HTTPS address makes them real).
8. **Verify** (see below), and only then describe anything as publicly working.

## What still needs you (nothing below has been done)

| Needed | Why an assistant cannot do it |
|---|---|
| Authorize and create the hosted Supabase project (plan, region) | Provisioning; possible cost; needs your account. |
| Authorize and create the host service and its HTTPS address | Provisioning and public exposure. |
| Start the local stack (Docker) when you want the database checks run | Assistants must not start Docker. Until then every database/integration check is **unverified**. |
| Two phones, one on **cellular** (Wi-Fi off), and a second person or device | Real-device proof cannot be simulated. |
| Decide on anonymous-sign-in abuse protection (see below) | A feature decision: CAPTCHA needs a client change. |

## Acceptance checklist for "hosted works" (record each result in the ledger; an unrun item stays open)

**A. Local database checks first (needs the local stack started by you).** `npx supabase@2.121.0 migration up` (never `db reset`); `node --test`; both integration files with `RUN_COMMUNITY_INTEGRATION=1`; `scripts/mission-browser-check.mjs`; `scripts/community-browser-check.mjs`. These cover the B3 migration (`20261022100000`) that has never been applied.

**B. Hosted project.**
1. `npx supabase@2.121.0 migration list --linked` shows **every** file in `supabase/migrations/` as applied (this is the migration check; it needs `supabase login`/`link` but no Docker).
2. `node --env-file=.env scripts/check-deploy-config.mjs --probe` has no errors. It proves only that the project is reachable and the default community exists, not that migrations are applied (step 1 does that).
3. The hosted dashboard shows anonymous sign-ins enabled, a real per-IP limit, and the Realtime publication with `posts`, `missions`, `mission_tasks`, `communities` and not `community_members`.
4. The host's `/healthz` answers and the public address is HTTPS.

**C. Two-phone test (A = phone on cellular, B = a second phone).**
1. A opens the public address, joins with a name, reads the conversation, posts a message. B opens the same address, joins, sees A's post.
2. A starts a mission from that post with two jobs. B opens it from the **QR code on A's screen** (or the share link), joins the mission.
3. A and B both tap **Claim this job** on the same job at the same moment. Exactly one holds it; the other sees "Someone else claimed this job first" and the list shows the winner.
4. B claims the other job, marks it done, posts a progress update. A sees all of it without reloading. Record the delay.
5. B leaves the mission: B's unfinished jobs return to unclaimed; B's finished job keeps B's name and offers B no undo; A (organizer) can still reopen it, and it comes back unclaimed.
6. Both reload and rejoin the page: the same plan, winner and posts are there. A downloads the plan; it matches the screen.
7. Repeat on the venue's Wi-Fi if it will be used (anonymous sign-in limits are per IP and a venue is one IP).

Do not run the integration suites against a project holding real data: they create and delete throwaway communities and users with the service key. Use a disposable test project for them.

## Open risk: anonymous sign-ins

Joining creates a Supabase anonymous user, so anyone who can reach the project can create guest accounts at the configured per-IP rate. The database bounds what an account can do (post rate, member cap, field sizes, row security), but account creation itself is only limited by the Auth rate limit. Supabase can require a CAPTCHA token (Turnstile or hCaptcha) for anonymous sign-ins, **but the app does not send one yet**: turning CAPTCHA on today would stop every guest from joining. Adding it means a widget, a CSP entry for the provider and passing `captchaToken` to `signInAnonymously`. That is a feature decision for the user; until then rely on the per-IP limit and keep the project private to the event.

## Known limits of the hosted app

- `/api/requests` and `/api/ward8` are public GET proxies to the city's service with no caching or rate limit in this server. Put the host's rate limiting in front if the address is public.
- Lists are capped per read (100 missions, 1,500 jobs, 1,000 posts per community); there is no pagination.
- No monitoring, backups or alerts are configured; use the Supabase dashboard's.
- Realtime streaming can take 15–25 s to resume after the service restarts; the page re-fetches on reconnect and at least every 30 s.
- Guest accounts are not verified residents, and clearing site data loses the identity.
