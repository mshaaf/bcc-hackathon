# Three-day implementation plan

**Status:** ready to activate after selection. This plan does not mean an app has been built. Engineer A / Engineer B are provisional work allocations, not named assignments.

**Execution entry point:** use the [Luna phase plan](superpowers/plans/2026-10-21-luna-phase-execution.md) and [phase ledger](PHASE-STATUS.md). Phase 1 turns this high-level outline into exact tasks/files/interfaces for the selected project. The daily outline below remains the time budget, not a second competing phase system.

| Day | Numbered phases | Expected result |
|---|---|---|
| 1 | 1: scope; 2: technical proof; 3: complete loop | A runnable MVP with a changed output |
| 2 | 4: reliability; begin 5: polish | Trustworthy core and a clear judge interaction |
| 3 | Finish 5; 6: presentation and release package | Rehearsed demo and submission materials |

## Before coding

Record the selected project and one-sentence promise in `DECISIONS.md`. Activate its profile under `specs/`. Pick the team's familiar stack, a single demo scenario, and the simplest export. Recheck the event rules that affect eligibility and pre-existing work.

## Day one — prove the idea and complete the loop

| Owner | Work | Exit condition |
|---|---|---|
| Both | Run the project's dependency spike and fix the cut list | Core mechanism demonstrated or fallback chosen |
| A | Implement one input path, source model, and deterministic validation | A bounded, inspectable draft is available |
| B | Implement main interaction and print/export | Reviewed state can become a usable artifact |
| Both | Integrate the entire slice | An input change affects the actual output; one missing-data case is honest |

**Gate:** if the complete loop is absent by the end of day one, cut optional features before expanding scope.

## Day two — make it trustworthy

Engineer A improves source spans, matching/controls, missing-field handling, and bounded dependency failure. Engineer B improves source inspection, correction, export layout, keyboard use, and narrow-screen behavior. Both exercise a small labeled fixture set and review one another's assumptions.

If a relevant community/practitioner reviewer is available, have them assess whether the output answers a real task. Record their actual feedback and permission before quoting it. No outreach is part of the current setup request.

**Gate:** the core interaction, uncertain case, and export must survive repeated rehearsal without hidden manual repair.

## Day three — freeze, rehearse, and submit

Freeze the core early. Fix material defects, prepare dated local fallbacks, record a backup video if useful, and rehearse a short pitch. Create submission copy, screenshots, repository/setup instructions, and the project URL if required. Recheck the clock and submit by the Friday evening operating target.

Keep the last period for reliability and submission, not a new feature or unfamiliar infrastructure.

## Project-specific first gate and split

| Project | First gate | A owns | B owns | Cut first |
|---|---|---|---|---|
| Block Ops | Fetch a bounded real snapshot and reproduce one transparent candidate group | Query, normalized candidates, provenance | Worktable, group review, brief | Map animation, multiplayer, monitoring |
| The Switch | Reviewed pairs and repeat controls produce a meaningful reproducible experiment | Runs, invariant checks, exact source verification | Wording switch, claim challenge, receipt | Audio, extra models, endpoint onboarding |
| Casebreaker | Two text PDFs yield editable source-linked fields; ambiguous joins abstain | Parser, identifiers/dates/status comparison | Evidence viewer, confirmation, packet | Scanned OCR, court lookup, broad legal rules |
| The Room | One short practice flow preserves chosen words and supporter role | Scenario/state and saved wording | Goals, retry, visit card | Voice, avatars, unrestricted AI dialogue |
| Reclaim | A same-report pair and missing-date case produce a conservative packet | Source fields, confirmation, missing-state checks | Evidence desk and packet | OCR, calculations, EHR integration |
| People's Chamber | One notice, one rehearsal question, and edited ask survive export | Notice/source context and rehearsal state | Floor interface, revision, statement | Voice transcription, hearing discovery, submission automation |

## Daily handoff

Each engineer leaves a short note: working path, actual command/check result, unresolved blocker, and next task. Keep state in the selected specification and `TEST-PLAN.md`; do not let chat-only assumptions become the only build documentation.
