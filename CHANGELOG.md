# Change log

## 2026-10-21 — Community-first scope and social delivery plan

- Recorded the user's explicit group/community intent: join, discuss, organize a mission, claim tasks and post progress across devices.
- Added a bounded social specification and S1–S4 plan with proposed shared backend, access rules, local publication preview, concurrency/retry checks and phone demo requirements.
- Redirected current agent entry points and ledger from R5 to S1; preserved completed R1–R4 history and existing local campaigns. Added the requested super-simple TL;DR preference.
- Planning only. No SDK, schema, provider project, hosting or product code created. The recurrence-date mismatch is recorded for correction during S1.

## 2026-10-21 — R4: "Closed isn't fixed"

- New `lib/recurrence.mjs`: a closed report is re-reported if another non-duplicate, non-canceled report follows within 30 days and 150 m. Real result: 210 of 350 closed reports (60%); 26 spots with 5+ reports hold 56% of reports. The stat line, busy-spot shading and worst-first spot list show it; the rule's sensitivity (44% at 100 m, 79% at 250 m) is documented.
- Campaigns gain a recipient and a lasting-fix ask; the brief now leads with recurrence evidence. Nothing is sent.
- Recorded real snapshot (`scripts/record-snapshot.mjs`, `GET /api/recorded`) behind a third, always-labeled source button.
- Fictional follow-up default on; open campaigns stay editable during a slow refresh; focus management; projector sizes; A4 brief inspected.
- Need check recorded in the revision spec (section 9). `docs/PITCH.md` drafted.

## 2026-10-21 — R1–R3: map workspace and saved campaigns

- R1: 311 query returns WGS84 geometry with per-record geo status; Leaflet vendored; DC GIS basemap; Ward 8 MPD query proven separately (not integrated); revision spec.
- R2: map-first page with area, radius (100/150/250 m), date and status filters, keyboard evidence list, outside-Ward-8 flags, `/api/ward8`, block-name titles.
- R3: saved campaigns (localStorage), owned tasks, typed dated follow-ups, per-campaign brief and Markdown export; fixed user exclusions being re-selected on radius/filter changes; storage never overwrites unreadable data.
- Checks: 66/66 unit tests; 70/70 browser checks at 1440 and 390 px (see PHASE-STATUS.md). Nothing pushed or deployed before the R3 push.

## 2026-10-21 — Claude handoff and campaign revision proposal

- Added a detailed built-versus-proposed handoff, source/competitor findings, code map, reuse constraints, R1–R5 batches, acceptance checks, and copy/paste prompts.
- Expanded CLAUDE.md and corrected stale instructions that would send another agent back to form/brief polish. Retained historical baseline phases and research.
- Saved aggregate MPD feasibility evidence and Citizen/Flock limitations without raw incident records.
- Reran the unchanged app baseline: 23/23 tests passed. Documentation-only work; no dependencies, map, campaign implementation, or publication added.

## 2026-10-21 — MVP audit and interface repair

- Investigated Luna's completed phases and verified the 17-test baseline.
- Rebuilt the current interface as review → plan → brief, with visible addresses, a current-evidence summary, and a distinct printable artifact.
- Fixed source-link fallback, cross-context observation carryover, duplicate record identities, loading-time edit races, and missing address/direct-source details in exports.
- Added regressions; 23 tests pass. Checked live loading, failure preservation, export content, keyboard navigation, responsive views, and a sample A4 PDF.
- Recorded current product/design guidance and evidence for Luna's remaining phases. No external publication occurred.

## 2026-10-21 — Block Ops selected

- Recorded the user's explicit Block Ops choice for Track 3 — Community Development.
- Activated its MVP profile and aligned the agent instructions, current plans, architecture, presentation, and workflow state.
- Kept Phase 1 next for Luna's technical planning. No product implementation, remote push, deployment, or submission occurred.

## 2026-10-21 — Luna phase handoff

- Added delivery phases 0–6, concrete completion checks, batch execution rules, and copy/paste prompts.
- Added a canonical phase ledger for resume and “next N unfinished phases” requests.
- Linked existing instructions and plans to the phase workflow. Product choice remains open; no implementation phase was started.

## 2026-10-21 — Project workspace setup

- Imported the full research, original decision brief, aura reassessment, six-finalist comparison, and supporting track reports.
- Saved the six product/presentation concepts as a portable browser preview, with editable source fragments and recorded QA.
- Added shared agent instructions, evidence-graded synthesis, project specifications, architecture options, implementation and test plans, demo guidance, and submission checklist.
- Connected the local folder to the supplied empty GitHub repository.
- Kept product selection open. No production app or deployment was created.
