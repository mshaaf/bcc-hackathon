# Block Ops — Sonnet implementation handoff

Updated October 21, 2026. The user selected **Sonnet 5.5 in Claude** to edit the code. This records their executor preference; it does not set a model, assert an API identifier, or claim a speed benchmark.

## Start here

**S1.1 is done** (report-date wording corrected). **Next work order: S1.2** (provider/Auth proof; needs real access). The community feature set is already specified; do not restart project selection or broad research.

Read [community scope](specs/community-missions.md), [the requested work order](superpowers/plans/2026-10-21-community-missions.md), and [the ledger](PHASE-STATUS.md). `CLAUDE.md` and `AGENTS.md` carry shared rules. The [older detailed handoff](archive/2026-10-21-handoff-through-r4.md) and [direction review](DIRECTION-REVIEW.md) are historical evidence, not the next instructions.

## What the user wants

Block Ops / Track 3: neighbors come together like a Facebook group/group chat, discuss a concern, agree on a mission, claim work, and post progress. The community/feed is the main experience; map/source records help discover and investigate a place. One demonstration community, text discussion and the proven dumping source first. No crime/AI/DM/photo/destination expansion before the shared participation loop works.

Every assistant message, including progress updates, ends with a **super-simple TL;DR**. Keep reads and checks focused to conserve usage. Implement inline in the user's Sonnet session; no automatic multi-agent work. A specific batch instruction authorizes that batch's local edits and checks without repeated approval for routine choices.

## Actual repository state

- R1–R4 built the real map, geographic selection, source review, browser-local campaigns, owned task text, follow-ups, export, recurrence display and recorded backup. Existing R4 code commit: `15fb58c`.
- The community scope/plan was committed as `878f251`. This refactor adds smaller work orders and removes stale continuation text. `git log` and `git status` are authoritative if another assistant has worked since.
- Shared community membership, discussions, authenticated commitments, Supabase and public phone access are **not built**. Typed local owner names are not authenticated users.
- Supabase is the recommended new shared provider; project access/configuration and hosting are unconfirmed. S1.1 can finish without them. S1.2 must report a real access prerequisite instead of pretending a mock is the shared backend.
- R1–R3 were pushed previously; R4 and later documentation commits were local when recorded. No deployment or submission is claimed. Do not push as part of an ordinary local implementation batch.

## Current commands

From the hackathon repository root, Node.js 20+:

```sh
git status --short --branch
git log -4 --oneline
node --test test/recurrence.test.mjs
node server.mjs
```

Open `http://127.0.0.1:8000`. Inspect an already-running server before starting another on port 8000. No install/build/provider key is needed for the current baseline. The last R4 record reports 85 tests; that is historical evidence, not a fresh result for your changes. Run relevant checks and report what actually passed.

At a phase boundary: `node --test` and `git diff --check`. Source proof scripts need network and should be rerun only when their data path changes. `scripts/record-snapshot.mjs` writes the recorded snapshot, so do not run it casually during a wording fix.

## S1.1 — exact issue and boundaries

`lib/recurrence.mjs` uses `record.date` (report creation), not `resolutionDate`. Example: report A filed Oct 1, resolved Oct 10; B filed Oct 2 at the same point. Current matching includes B, which is a later **filing**, but predates closure.

Keep that creation-date computation and make UI, caveats, current pitch and export describe it accurately. The subset now called mature closures is reports filed at least 30 days ago that are currently marked Closed. Do not invent verified closure dates or change radii/windows to improve numbers.

Search every caller of `reReportedKeys`, `recurrenceSummary`, `recurrenceHeadline` and closure wording before editing. Known files: `lib/recurrence.mjs`, `public/app.mjs`, `lib/campaign.mjs`, `test/recurrence.test.mjs`, `docs/PITCH.md`. Correct the shared helper and affected caller text, not only one visible string. Preserve historical measurements with their qualifications. Avoid unrelated refactors.

Deliver: failing regression first; supported wording throughout current output; focused tests; inspected brief; work-order ledger entry; local commit; stop. No SDK, schema, account, model, source refresh or hosting setup in this order.

## Later work — do not implement ahead of the batch

The plan splits S1–S4 into ten named work orders. S1.2–S1.3 prove Auth/community membership; S2 adds posts, replies and live discussion; S3 adds discussion-origin missions, reviewed local publication, atomic commitments and mission UI; S4 proves recovery and real-phone access. Then R5 freezes and rehearses the release.

Each order lists files, interfaces, regressions and an exit. A request for S1 covers its three orders; a request for S1.1 stops after one. A phase remains incomplete until all child orders and exit checks pass. Do not reuse old R1/R5 prompts from archived documents.

## Reuse contracts

- `server.mjs` serves an explicit route list and fixed read-only public-data proxies. New browser modules/config need deliberate routes. CSP currently permits DC map images; a shared provider needs narrow HTTPS/WSS allowances, not wildcards.
- `public/app.mjs`, `public/map.mjs`, `public/storage.mjs` and `lib/campaign.mjs` are the existing UI/map/local-state model. Preserve source IDs/dates/statuses, failed-refresh recovery, manual exclusions and current export behavior.
- Keep local campaigns local until a reviewed publish action copies selected content. Never auto-upload all browser notes or overwrite the local original.
- Imported task descriptions can be copied, but old typed owners/done flags become unclaimed/not done. Imported observations keep dates/fictional flags and original authorship-unverified labels.
- Shared membership, posts and claims are separate rows. Do not synchronize a whole JSON campaign on every keystroke. One task has one claimant; database transactions/uniqueness enforce race behavior. Permission checks must work outside UI controls.
- A discussion-origin mission may have zero 311 records. Its export clearly says that; preserve the baseline guard against an empty authoritative evidence brief.
- Join counts describe participant accounts; a judge joining is not neighborhood adoption. Official ticket status, reported group progress and dated site observations stay separate.

## Return at each boundary

Report the exact work order completed, changed files, actual check commands/results, missing access or failed checks, local commit, and next order. Update [PHASE-STATUS.md](PHASE-STATUS.md) and relevant test/setup notes. Do not mark future checkboxes complete or claim real devices from a local mock.

Copy/paste first prompt:

```text
Use Sonnet 5.5 in this Claude session. Read CLAUDE.md,
docs/SONNET-HANDOFF.md, and the S1.1 work order in
docs/superpowers/plans/2026-10-21-community-missions.md.
Execute S1.1 only. Preserve unrelated work and local campaigns.
Keep the report-creation-date algorithm; correct all unsupported
closure claims and add meaningful regressions. Run focused checks,
inspect the generated brief, update the ledger and commit locally.
Stop after S1.1. No provider setup, push, deployment or later orders.
End every message with a very simple TL;DR.
```
