# Block Ops — resume after a context reset

Updated October 21, 2026, after independently reviewing S1.1 at code commit `9f09667`. Inspect `git status --short --branch` and `git log -6 --oneline` before acting; later changes take precedence over this snapshot.

## What we are building and why

Block Ops is selected for **BCC Hackathon, Track 3 — Community Development**. Two strong generalist engineers have three build days, October 21–23; judging is October 24, 2026, 3–5 PM at MLK Library. The exact library/city and judging rubric were not confirmed. Ward 8, Washington DC is the chosen data/demo setting, not a verified event location.

The user wants something memorable, impressive on stage and socially useful. They rejected an ordinary form/brief website, then challenged whether maps and alerts merely recreated Citizen. The confirmed direction is now a neighborhood community: **join → discuss → organize a mission → claim a job → post progress**. Think of a focused neighborhood group that helps people carry out a plan. Maps and public records support that activity; they are not the main interaction or proof of uniqueness.

Dumping is the first proven data category: discarded rubbish, furniture or other material left where it should not be. A mission might coordinate documenting a problem, arranging a service follow-up, or an appropriate cleanup. A dumping ticket alone does not tell volunteers what is safe to handle. The intended benefit is easier community coordination; actual demand, adoption and improved neighborhood conditions remain unvalidated.

## User preferences that must survive the reset

- End **every commentary and final message** with a super-simple **TL;DR**.
- The user uses **Sonnet 5.5 in Claude** for implementation. This is their stated preference, not a verified API model name. Do not change model settings automatically or dispatch subagents by default.
- Give Sonnet **larger outcome-based batches**, not instructions to stop after every small task. Detailed work orders are internal checklists. Resolve routine choices and continue through the authorized batch; stop only at its outcome/boundary or a genuine prerequisite blocker.
- Conserve the account usage window. Avoid rereading the full research archive, repeated broad research and redundant test runs. Keep useful existing work.
- Commit completed, checked increments locally. This request does not authorize a push, public deployment, agency submission, outreach, paid provisioning or license selection.

## Actual implementation state

| Area | State at this review |
|---|---|
| R1–R4 | Built: Ward 8 dumping map, geographic selection, source inspection, reviewed exports, browser-local campaigns, local owner/task text, observations/follow-ups, recurrence display and dated recorded fallback. |
| S1.1 | Complete in `9f09667`: recurrence copy now describes report filing dates. Independent checks below passed. |
| S1.2–S2.2 (B1) | **Built and verified on a local Supabase stack** (anonymous Auth, membership, posts/replies, moderation, Realtime). Two/four independent Chrome profiles, 13/13 backend integration, 51/51 community browser checks. No hosted project or real phone. See [COMMUNITY-SETUP.md](COMMUNITY-SETUP.md) and the ledger. |
| S3 | Unbuilt: shared missions, authenticated commitments, atomic task claims, mission updates and reviewed publication. |
| S4 / R5 | Unbuilt: final recovery/access/real-phone proof, then release rehearsal and presentation package. |

Current local tasks and typed owner names are **not** authenticated people or shared commitments. localStorage is per browser/origin. A second device cannot currently join the same campaign. A successful local map demonstration is not evidence that shared participation works.

At review start, the working tree was clean on `main`, four commits ahead of the locally recorded `origin/main`: R4 `15fb58c`, community plan `878f251`, Sonnet handoff `8a7a873`, S1.1 `9f09667`. R1–R3 were pushed previously by the user. The context/documentation commit follows this snapshot; use Git for its actual hash. Nothing has been deployed or submitted.

## S1.1 review — what was checked

The algorithm uses `record.date`, a report's creation/filing date. Example: A filed October 1 and closed October 10; B filed October 2 nearby. B counts as a later filing, even though it precedes A's closure. Therefore the output must not say “within 30 days after closure.”

Sonnet retained the algorithm, thresholds and counts. `lib/recurrence.mjs` now supplies “followed by another report within 30 days of filing,” a filing-date caveat and “reports filed at least 30 days ago” for the mature subset. UI, legend, export tests and browser-driver expectations were updated. The campaign brief consumes the shared headline helper.

Independent review on October 21:

- Inspected the S1.1 source/test diff and affected UI/export callers.
- `node --test`: **87 passed, 0 failed, 0 skipped**.
- `node --check public/app.mjs` and `node --check scripts/browser-check.mjs`: passed.
- Generated a brief from the A/B counterexample, inspected the actual output and asserted the supported wording and caveat. It counted one later report without claiming it followed closure.
- `git diff --check`: passed at review. Documentation checks for this checkpoint are recorded in the ledger/verification file.

The browser driver was **not rerun**, and visual/mobile behavior was not revalidated in this review. Sonnet's reported failing-before-fix regression run was not independently repeated. The old pitch is explicitly historical; this review also removes its unsupported “DC closes every dumping ticket” opener. It still needs a community-focused rewrite after the shared experience exists. “Closed isn't fixed” is a slogan, not a conclusion established by these statistics.

## Next action — one substantial Sonnet batch

**B1 is done (local backend).** Next is **B2: S3.1–S3.3**, missions on top of the working community. Reuse `lib/community.mjs`, `public/community-api.mjs`, `public/community.mjs` and the migration style (SECURITY DEFINER writes, select-only RLS, operation ids). Do not redo S1.1 or B1. The original B1 contract is kept below for reference.

The finished experience: open a community link, join with a display name, write a post, reply, and see it appear in the other independent browser without a manual reload. Reload preserves the session and persisted conversation. Show authors/times, own-post editing, basic moderator hiding, errors and retry. Make the community feed the default view and keep the existing map/local campaigns reachable. At 320/390 px and with a keyboard, the core flow remains usable.

Provider/Auth/membership, posts/replies, permissions, Realtime/reconnect and interface work belong to this single batch. Sonnet chooses the internal implementation order and makes focused commits without stopping to request approval at each work order. Two independent authenticated sessions and real backend tests are required; mocks/localStorage do not prove sharing. Target propagation is within five seconds on the tested healthy connection, not a universal latency promise.

Supabase Postgres/Auth/Realtime is recommended, **not provisioned or confirmed**. Inspect available configuration/access without printing secrets. If project access or a necessary setting is missing, ask for that specific input and continue independent preparation while waiting. Leave integration-dependent work incomplete and report it honestly. Do not buy infrastructure or replace missing backend proof with fake activity.

After B1 is verified, the next substantial batch is **B2: complete S3.1–S3.3**, turning discussion into missions with authentic commitments and follow-up. Then **B3: S4.1–S4.2**, recovery, deployment preparation and authorized phone proof. R5 follows for presentation/release. B1 does not silently authorize B2/B3 or public publication.

## Implementation contracts worth retaining

Use one labeled Ward 8 demonstration community and the proven dumping source first. Recommended anonymous Auth gives distinct sessions without email/password; names are display labels, not permission credentials or verified residency. Clearing site data or switching devices loses the guest identity. A count of accounts is not a count of unique residents.

Use backend-enforced membership, ownership, constraints and bounded writes. Members read discussion; public join previews whitelist allowed fields. Only authors edit their own posts; the seeded moderator can hide content. Reject forged authors/roles and cross-community replies through direct API requests, not only hidden UI buttons. Keep one-level replies and plain text, with names 1–40 and bodies 1–2,000 characters. Retried writes use operation IDs; reconnect fetches canonical permitted state. Failed sends preserve the draft.

For later S3: an organizer can create a mission from discussion without a 311 ticket, or deliberately publish a reviewed copy of a local campaign. Preserve the local original and excluded evidence. Imported task descriptions become unclaimed/not done; legacy typed names are not memberships. Historical observations retain dates, fictional labels and unverified-original-author/import provenance. Do not weaken the existing evidence-required local export guard; an evidence-free shared mission explicitly exports “No official 311 records attached.”

Task claims must be atomic with a single winner. Membership removal must serialize with claims and release unfinished work. An organizer archives before leaving an active mission. Version checks prevent metadata overwrites. Official ticket status, group task completion and dated site observations remain distinct.

Defer crime layers, Flock cameras, AI, photos, DMs, followers, notifications, multiple neighborhoods and category expansion. Do not restart project selection. The full current contracts are in [community scope](specs/community-missions.md); the [detailed plan](superpowers/plans/2026-10-21-community-missions.md) is a checklist/reference, not a micro-approval protocol.

## Code and evidence map

Node.js 20+ native ES modules, vendored Leaflet. The current baseline needs no install/build/provider key. Start with `node server.mjs`, open `http://127.0.0.1:8000`; inspect an existing server before starting another.

- `server.mjs`: explicit asset routes, fixed read-only public-data proxy. New assets/config/CSP need deliberate additions.
- `lib/block-ops.mjs`: bounded Ward 8 dumping query, normalized source records, geometry and evidence workflow. Preserve identifiers, dates, statuses, unknowns, source links and refresh recovery.
- `lib/recurrence.mjs`: filing-date proximity statistics, headlines and caveats.
- `lib/campaign.mjs`: local campaign/task/observation/review/export rules. Reuse rather than replace.
- `public/app.mjs`, `public/map.mjs`, `public/storage.mjs`: existing UI, Leaflet and guarded browser persistence. Preserve prior valid saves/corruption recovery.
- `data/demo.json`: five invented DEMO records. `data/recorded-snapshot.json`: real dated saved DC data, always labeled recorded, never live.
- `test/`: existing unit suite. `scripts/browser-check.mjs`: browser driver. Source proof scripts use network; `scripts/record-snapshot.mjs` mutates the tracked recording, so do not run casually.

DC public 311 history already exists; don't claim closure erases history. Nearby reports do not prove the same pile or failed cleanup. Citizen already has maps/alerts and related products; no exclusivity claim is established. No community partnership, interviews, completed cleanup or measured social impact is established. Treat older research/review/pitch text as dated evidence, not current instruction.

Read order after reset: this checkpoint → [Sonnet assignment](SONNET-HANDOFF.md) → [ledger](PHASE-STATUS.md) → relevant scope/plan/code. [AGENTS.md](../AGENTS.md) and [CLAUDE.md](../CLAUDE.md) carry repository instructions. [DECISIONS.md](DECISIONS.md) records current versus historical choices. `docs/workflow/*.json` are local tracking, not Ruflo remote events.
