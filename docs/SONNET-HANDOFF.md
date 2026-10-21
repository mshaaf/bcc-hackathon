# Block Ops — Sonnet's next batch

> **B1 is complete (October 21, local Supabase stack).** Results and limits: [PHASE-STATUS.md](PHASE-STATUS.md), [COMMUNITY-SETUP.md](COMMUNITY-SETUP.md). **The next assignment is B2 (S3.1–S3.3)**; write its prompt from the plan's S3 section when the user asks. The B1 text below is kept as the completed contract.

Updated October 21, 2026. **S1.1 is complete and independently reviewed at `9f09667`. Do not redo it.** The user selected Sonnet 5.5 in Claude and now wants larger outcome-based assignments, not a pause after each small work order.

Read [CONTEXT-CHECKPOINT.md](CONTEXT-CHECKPOINT.md), [the ledger](PHASE-STATUS.md), [community scope](specs/community-missions.md), and relevant code. The [detailed plan](superpowers/plans/2026-10-21-community-missions.md) supplies implementation contracts/checklists. No broad research restart or automatic subagents. Every message ends with a super-simple **TL;DR**.

## B1 — ship a working shared community

Complete **S1.2, S1.3, S2.1 and S2.2 as one batch**. The result is one community where people join, post and reply from independent browsers and see each other's persisted activity. Choose the internal work sequence and resolve routine choices. Focused checks/commits are checkpoints, not reasons to hand control back before the outcome works.

The community feed becomes the default experience: clear purpose, join with a chosen display name, members, chronological posts/replies with author and time, own-post editing and moderator hiding. Keep the existing map, local campaigns, source inspection and export reachable and intact. Provide a clean, readable mobile layout and keyboard interaction. An empty mission area must be honest; do not fill it with fake participation or prematurely build S3.

Supabase Auth/Postgres/Realtime is recommended, but no actual project/access/hosting/SDK has been established. Prove real access and two distinct authenticated sessions, pin the selected SDK and keep only publishable configuration in the browser. Use anonymous Auth for the first demo if actual provider settings permit it, with clear guest-identity limits. No service-role/secret browser key or wildcard CSP.

Community membership and posts/replies require database-enforced permissions, validation and bounded writes. Test ownership and community isolation outside UI controls. Use idempotent retries and canonical re-fetch on Realtime events/reconnect. Show failure/retry states and preserve unsent text. Keep source facts, demo content and user observations distinct.

### Done means demonstrated

- Two isolated browser profiles have different authenticated IDs, join the same real persisted demo community, and keep their session on reload. Joining twice/reloading does not grow membership counts.
- B posts/replies; A sees the exact persisted content without manual reload within five seconds on the tested healthy connection. Reconnect restores current permitted state and retried sends do not duplicate posts.
- Backend requests reject forged authors/moderator roles, edits to others' posts, non-member access and cross-community replies. Empty/oversized bodies fail at the write boundary, not just the form.
- Failed sends keep the draft. Own edit/moderator hide behavior is tested. Keyboard and 320/390-pixel layouts support joining, reading, posting and replying.
- Existing map, reviewed evidence, local saves and exports still work. Run focused new checks, real provider integration and browser proof, then the existing suite at the meaningful batch boundary. Record actual results and skips separately.
- Setup/reproduction instructions contain placeholders only. Update [PHASE-STATUS.md](PHASE-STATUS.md), the checkpoint and setup/test docs; commit completed increments locally. Report the outcome, evidence and exact remaining limits.

If access/configuration is missing, ask for the **specific missing input**, continue independent safe preparation, and leave dependent checks incomplete. Do not claim a mock/localStorage/shared tab is cross-browser backend proof. Do not create paid infrastructure, push, deploy publicly, submit anything, contact others or choose a license. Stop at B1's completed outcome or a genuine blocker; do not silently add mission implementation.

## Copy into Sonnet

```text
Read AGENTS.md, CLAUDE.md, docs/CONTEXT-CHECKPOINT.md and
docs/SONNET-HANDOFF.md. S1.1 is done at 9f09667; don't redo it.

Execute B1: finish the remaining S1 work and all of S2
(S1.2–S2.2) as one outcome-based batch. Build a real shared
community where two independent browser sessions join, post,
reply and see persisted updates without manual reload.

Use the community spec and detailed plan as contracts, choose
your internal implementation order, and keep working through
the whole batch without stopping after each work order.
Preserve the map, source fidelity and browser-local campaigns.
Make the community UI clear, mobile-friendly and presentable.

Inspect actual backend access first. Ask only for a specific
missing prerequisite; continue independent preparation while
waiting. Don't replace real backend proof with mocks. Verify
permissions, retry/reconnect behavior and two-browser updates.

Update the ledger, checkpoint and setup/test evidence; make
focused local commits. No push, public deployment, paid
provisioning or S3 implementation in this batch. Report what
works and what remains unverified. End every message with a
super-simple TL;DR.
```

## What follows

**B2: S3.1–S3.3**, after B1 passes: turn discussion into a mission, deliberately publish reviewed local work, join/leave, claim/release/complete tasks atomically, share a mission link and export its current plan with honest provenance.

**B3: S4.1–S4.2**, after B2: access/recovery and full participation hardening, deploy preparation and actual phone-on-another-network proof when publication is authorized. Then **R5**: truthful community-first pitch, stage rehearsal and release package.

These are subsequent outcome batches, not instructions to stop after every internal checkbox or to execute beyond B1 without a new batch instruction.
