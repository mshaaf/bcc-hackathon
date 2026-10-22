# Block Ops — Sonnet assignments

> **B2 is complete (October 21, local Supabase stack)** — results, findings and limits in [PHASE-STATUS.md](PHASE-STATUS.md) and [TEST-PLAN.md](TEST-PLAN.md). **The next assignment is B3 (S4)**; write its prompt from the plan's S4 section when the user asks. Everything below is the completed B2 contract, kept for reference.

Updated October 21, 2026. **Next batch: B2 (S3.1–S3.3), including the open B1 repairs.** Build one complete web app experience using the existing implementation. The user selected Sonnet 5.5 in Claude and wants a substantial outcome, not repeated hand-backs after small work orders.

## Read only what matters

Read [AGENTS](../AGENTS.md), [CLAUDE](../CLAUDE.md), [PRODUCT](../PRODUCT.md), [DESIGN](../DESIGN.md), [B1 review](B1-REVIEW.md), [community scope](specs/community-missions.md) and S3 in [the detailed plan](superpowers/plans/2026-10-21-community-missions.md). Consult [ledger](PHASE-STATUS.md) and [setup](COMMUNITY-SETUP.md) for current state. The [checkpoint](CONTEXT-CHECKPOINT.md) explains the history after a context reset. No broad research restart or automatic subagents.

## Actual starting point

R1–R4 map/source/local campaigns exist. B1 community joining, posts/replies and live updates run on local Supabase CLI/Docker; SDK and backend access are already established locally. Independent review at `f36867b` passed 97 unit tests and 13 explicit integration tests, then reproduced four gaps. These are open repairs, not a reason to rebuild B1 or change frameworks. S1.1 filing-date wording is complete. S3 missions/claims are unbuilt. No hosted project, public URL or real phone proof exists.

## Outcome — discussion becomes shared action

Repair the B1 defects and finish all of S3 in one batch. A member starts a mission from a discussion or deliberately publishes a reviewed copy of a local campaign. Another independently authenticated browser joins the same mission, claims a named job, posts an update and reports its job done. The organizer sees the persisted responsibility/progress without manual reload. Reload and reconnect preserve the same plan and commitments. Current export reflects shared state.

The interface must feel like **one web application**: consistent navigation, community conversation, discoverable active missions, mission detail/task controls and the existing map/campaign view. Keep the plum/sunflower identity and existing Node/native-browser/Leaflet/Supabase stack. Make focused component/layout changes in place. A new framework, native shell, PWA packaging, separate marketing site or broad refactor is not required.

The mission screen should make the goal, public location, organizer, optional time and available/claimed jobs immediately understandable. Keep join/claim/release/complete actions distinct, show who committed, and provide discussion and dated follow-up. Evidence is inspectable supporting detail. Desktop and phone users need clear back paths, useful empty/error/sending/conflict states, keyboard access and drafts that survive navigation. A compact mission list in the existing shell is enough; avoid extra dashboards/settings.

## Repair gate inside this batch

Use [B1-REVIEW](B1-REVIEW.md) for reproduction and affected code. Preserve newer drafts while a send completes, including after navigation; stop membership DELETE metadata reaching outsiders through actual event/publication rules; authorize old-operation replay before returning results and bind it to the correct community; repair the main composer label and adjacent focus/status/navigation semantics. Add regressions for the confirmed failures. Do not mark these resolved from happy-path tests alone.

Use new migrations for changes to the applied backend. Preserve existing community/post data and browser-local campaigns; do not reset the running user's database to implement a migration. Use explicitly disposable test fixtures/stacks for destructive test setup. Keep credentials out of files served to browsers, logs, screenshots and Git.

## Mission contracts

- Support both creation paths: discussion-origin with zero official records, and deliberate reviewed local publication with the local original untouched. Preserve excluded evidence, source dates/modes and unknowns. Imported typed owners/done flags become unclaimed/not done; historical observations retain dates/fictional labels and imported/unverified-original-author provenance.
- Mission discussion reuses community posts with explicit mission scope. Same-community source/reply links only. Organizer metadata updates use a version check, with a recoverable conflict rather than silently overwriting changes.
- Membership and task claims are real shared rows with backend authorization. Join/retry is idempotent. Exactly one claimant wins a simultaneous race. Leaving releases unfinished claims; serialize leave/claim so no unfinished task belongs to a departed member. Active organizers archive before leaving. Preserve historical completion attribution.
- Only permitted participants/organizers can change tasks, metadata and moderation. Test direct backend requests, not only disabled buttons. Group progress, official ticket status and site observations remain different facts.
- Use shareable mission hash routes and a locally generated QR of the actual URL. Localhost links/QRs are local test access, not proof that a phone on cellular can join. No external QR service or invented public URL.
- An evidence-free shared plan exports “No official 311 records attached.” Keep the existing evidence-required local campaign export guard. Fetch current permitted mission/member/task/post state before export; keep rejected evidence out.

## Acceptance evidence

Demonstrate two genuinely separate authenticated browser sessions: A creates/publishes, B joins/claims/posts, A sees the exact persisted changes, and reload preserves the winner. Target normal propagation within five seconds on the tested healthy connection; record cold-start/reconnect limits honestly. Demonstrate exactly one winner under concurrent claims, no orphan assignment under leave/claim races, and denial of cross-community/forged-ownership operations. Exercise new drafts during sends, retry after timeout, recovery and version conflicts.

Check the community → mission → claim → update path with keyboard and at 320/390 pixels plus desktop. Inspect actual current export/download and source fidelity. Reuse existing browser helpers and isolated fixtures rather than replacing the test framework. Run focused repair/domain checks, explicit real-backend integration and browser evidence, then the full applicable suite at the batch boundary. Skips/mocks are not backend proof; report exact commands, counts and unverified items.

## Execution and boundary

Choose the internal implementation order and make focused local commits at meaningful completed increments. Keep working across the whole batch; no approval request after each internal work order. Ask only for a concrete missing prerequisite and continue independent work where possible. Update the ledger, checkpoint, setup/test evidence and run instructions to the actual final state. Leave incomplete acceptance open.

Stop at this complete outcome or a genuine blocker. No push, public deployment, paid provisioning, outreach, official submission or license selection. B3 handles remaining readiness and authorized real-phone/public access; R5 handles final pitch/rehearsal. Defer AI, crime layers, photos, DMs, notifications, extra communities and category expansion. End **every message** with a super-simple **TL;DR**.

## Copy into Sonnet

```text
Read AGENTS.md, CLAUDE.md and docs/SONNET-HANDOFF.md, including
its required scope/design/review references. Execute B2 in full:
repair the four confirmed B1 issues and complete S3.1–S3.3.

Build Block Ops as a connected web app using the current stack
and visual identity. No framework rewrite or native build is
needed. Deliver community discussion → create/publish mission
→ join → claim a job → post progress/follow-up, with clear
navigation and usable phone/desktop screens.

Keep existing data and local campaigns intact. Verify real
shared state across independent browsers, permissions, atomic
claims, leave/claim races, newer drafts during sends and current
exports. Use the handoff's acceptance checks; do not stop after
each small work order. Update docs/evidence and commit locally.
No push or public deployment. End every message with a simple
TL;DR, and report exactly what passed and what remains open.
```
