# B3 follow-up — independent review and publication record

Reviewed October 21, 2026. Code commit: `a12ff11`; builder documentation: `f2cede1`. Comparison base: `f5fbfaa`. The user requested review, detailed documentation, commit and push of the existing work to [mshaaf/bcc-hackathon](https://github.com/mshaaf/bcc-hackathon).

## What this change does

The follow-up removes task controls that a departed participant cannot use, makes the deployment probe describe its actual checks, and puts mission jobs ahead of sharing/export tools. It preserves the current Node/native-browser/Leaflet/Supabase stack and the plum/sunflower identity.

**Verdict: the latest follow-up is suitable to publish as source with the verification limits below.** No new blocking defect was found in the reviewed diff and connected callers. This is not a claim that S4 is complete or the app is deployed.

## Confirmed repairs

### 1. Departed participant's completion undo

Previous behavior: someone could finish a job, leave the mission, and still see **Mark not done** because the completed job intentionally retained their historical claimant. The B3 backend contract rejects that action once the participant has left.

`lib/mission.mjs:taskControls` now requires current mission membership for a claimant's actions. The organizer keeps access; archived missions expose no task actions. `public/mission.mjs:jobRow` uses that same tested decision function to render the controls.

Fresh unit checks cover current/departed participants, organizer access, other users, signed-out users and archived missions. A fresh browser fixture run completed a participant's job and then left the mission: attribution remained visible and the task action list was empty. A current participant still received the undo control.

### 2. Deployment probe's migration claim

Previous behavior: a successful `community_preview` response was described as proof that all migrations were installed, although the RPC predates the mission schema and B3 repairs.

`scripts/check-deploy-config.mjs:probe` now reports project reachability and default-community existence. It explicitly states that mission migrations and later repairs are not verified, and directs the operator to compare the linked migration ledger with the local files. The success, empty-result and HTTP-error cases are covered by the default tests. The deployment runbook uses the same distinction.

### 3. Mission layout on phones

The mission goal, organizer/location/time/progress and membership controls remain at the top. Jobs now precede QR/share/download tools. The phone header, navigation, facts and source-post excerpt are more compact; the full original discussion remains available through its link. Task focus keys, navigation focus and status announcements are preserved.

Fresh measurements for the illustrative organizer mission:

| Browser viewport | Jobs heading, pixels from top | Bottom of first job title | Result |
|---|---:|---:|---|
| 390 × 844 | 411 | 476 | First job title visible without scrolling |
| 320 × 640 | 479 | 544 | First job title visible without scrolling |

These measurements apply to the tested fixture content, not every possible title or goal length. Both layouts had no horizontal overflow. The existing scripted tap-target checks passed; this does not establish a full accessibility audit or physical-device support.

## Fresh independent verification

| Check | Result | What it establishes |
|---|---|---|
| `node --test` | 163 discovered; **132 passed, 0 failed, 31 skipped** | Default-suite behavior, including both new regressions; skips are not backend passes |
| Runtime | Node **v22.13.1** | Version used for the fresh default and browser checks |
| `OUT=docs/ui-review/b3-independent-run node scripts/ui-fixture-check.mjs` | **34/34 passed**, exit 0 | Actual app interface in headless Chrome with an in-page fake Supabase SDK |
| Read-only `GET http://127.0.0.1:54321/auth/v1/health` | Connection refused | Local backend unavailable; no attempt to start it |
| Remote fetch and ancestry check before publication | `origin/main` was 16 commits behind HEAD, with no remote-only commits | Existing work can be published without rewriting history |
| Outgoing-history credential-pattern check | 16 commits checked; no matching secret patterns or unexpected tracked private paths | Limited prepublication check, not a full security audit |
| Documentation consistency | 15 updated/new Markdown files; **188 relative file/anchor links checked, zero failures** | Current handoffs/specification/status links resolve locally |
| Whitespace check | Updated working diff and `f5fbfaa..f2cede1` follow-up pass | No new whitespace errors in this documentation update or the reviewed follow-up |

The interface run covers join/post/create mission, source-post navigation, validation recovery, remote claim announcements, completion wording, newer drafts surviving a held save, task focus retention, departed-participant controls and both phone widths. Results: [fixture-results.json](ui-review/b3-independent-run/fixture-results.json). Screenshots: [desktop](ui-review/b3-independent-run/fixture-mission-desktop.png), [390px](ui-review/b3-independent-run/fixture-mission-390.png), [320px](ui-review/b3-independent-run/fixture-mission-320.png). Screenshots were visually inspected. Fixture people and actions are illustrative, not evidence of community adoption or a completed cleanup.

## Unverified and known limits

- The migration `20261022100000_b3_evidence_and_reopen_repairs.sql` has not been applied or exercised in this review. Docker/containers were not opened, started or restarted.
- All 31 real-backend integration tests remain unrun against the B3 functions. Permission, row locking, write-boundary rejection and leave/reopen race behavior need a real database.
- The real-backend community and mission browser drivers were not rerun. The fake-backend run cannot establish authentication, database permissions, persistence across independent users or real streaming.
- No hosted project, public app URL, actual phone/cellular test or venue-network proof exists. GitHub publication is source publication, not deployment.
- The older map/campaign browser driver was not rerun during this independent review. The builder's recent runs were not fully clean; their failures remain recorded in [TEST-PLAN](TEST-PLAN.md), not silently converted to passes.
- No full screen-reader, Safari/Firefox, load or anonymous-account abuse assessment was performed. Existing list caps and CAPTCHA limitations remain in [DEPLOYMENT](DEPLOYMENT.md).

## Documentation changes and publication scope

The README, architecture, selected specification, plan status, agent context, handoffs, phase ledger and test evidence now distinguish implemented missions from outstanding acceptance. Historical B2 contracts and earlier test runs remain labeled history. No framework rewrite or product scope expansion was performed during this review.

The publication includes the existing local commits from R4 through the B3 follow-up, plus this review, updated documentation and independent interface evidence. Preserve their commit history and push normally to `origin/main`; do not force-push or change repository permissions. [Repository notes](REPOSITORY.md) explain how to verify synchronization. The user authorized this push; hosting, paid resources, official submissions and Docker startup remain separate from it.

## Remaining outcome gates

1. With the backend available and explicit migration authorization, apply the forward migration without resetting data. Run both integration files and both real-backend browser drivers; investigate failures and record exact results.
2. Follow the authorized hosted-deployment runbook. Verify the actual migration ledger, guest Auth and Realtime configuration. Do not treat the preview probe as a migration check.
3. Complete the [two-phone checklist](DEPLOYMENT.md#what-still-needs-you-nothing-below-has-been-done): cellular access, QR join, one winning claim, shared progress and reload persistence. Keep S4 open until those checks are evidenced.
4. Then finish R5: community-first pitch, projector rehearsal, truthful data labels and a clearly labeled fallback if a live dependency fails.

**TL;DR:** Both small fixes and the phone layout passed independent checks. Publish the source and documentation; database, hosted and real-phone proof are still open.
