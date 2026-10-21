# Luna Phase Execution Implementation Plan

> **For agentic workers:** Execute this plan in the user's Luna terminal. Use `superpowers:executing-plans` if available; the local phase protocol and checklists below remain sufficient when that skill is absent. Steps use checkbox syntax. Do not require an orchestration service or spawn other agents by default.

**Goal:** Let the user request an exact range or number of phases and receive a verified, resumable increment of one hackathon product.

**Architecture:** Use the existing documents as context and one phase ledger as the execution record. Phase 1 resolves the project-specific stack, files, interfaces, and commands; later phases implement that concrete plan in dependency order. Keep research, source evidence, review state, and export responsibilities distinct.

**Tech Stack:** Not selected. Phase 1 chooses the team's familiar stack, records the decision, and defines real commands before product dependencies or scaffolding are introduced. This phase plan itself is Markdown and needs no runtime.

**Spec:** [Foundation specification](../../SPECIFICATION.md), [conditional profiles](../../specs/README.md), and [current decisions](../../DECISIONS.md).

**Current selection:** Block Ops, Track 3 — Community Development, explicitly chosen by the user October 21, 2026. Read `docs/specs/block-ops.md`; the selection prerequisite is satisfied. Phases 1–3 are complete; Phase 4 is next.

## Global constraints

- One core workflow, two engineers, three days; prefer the team's familiar stack and available dependencies.
- Preserve source dates, identifiers, status terms, units, and quotations. Validate model-proposed source spans against the actual source text.
- Keyboard-operable native controls, visible focus, clear labels, legible light/dark appearance, and no horizontal clipping at a 320-pixel viewport.
- Synthetic demo identities, no real sensitive records in Git, no secrets in the client or committed configuration, minimal data retention.
- Record source/run dates and configuration needed to reproduce important results. Distinguish live, cached, replayed, and synthetic material.
- Block Ops is the user's selected project. Implement its active profile; do not substitute another finalist without the user's direction.

## Review focus

1. Changing evidence after confirmation must invalidate dependent approval. Pin the behavior in Phase 3 and exercise it again in Phase 4.
2. Missing fields or uncertain matches must remain unresolved instead of becoming confident claims. Pin the basic case in Phase 3 and expand it in Phase 4.
3. An API/model/parser failure must preserve reviewed work and identify its fallback accurately. Prove the dependency in Phase 2; check recovery in Phase 4.
4. An export must reflect current included evidence and user wording. Verify a changed export in Phase 3 and rejected/stale cases in Phase 4.
5. A resumed batch must preserve unrelated edits and avoid repeating completed work. Check the ledger and Git state at the start of every batch.

## How a batch works

Read `AGENTS.md`, `README.md`, `docs/DECISIONS.md`, this file, and `docs/PHASE-STATUS.md`. Then read only the active project's profile and the documents needed by the requested phase. Do not reread the entire research archive by default.

- **“Execute phases 1–3”** means those exact numbered phases. Verify completed predecessors rather than redoing them. Stop after Phase 3.
- **“Execute the next 2 unfinished phases”** means start with the first phase that is not complete in the ledger, resolve it, then complete the following unfinished phase. An in-progress or blocked phase counts toward the requested number; do not skip it.
- Continue automatically between phases included in the batch when checks pass. Do not ask for approval after every phase or routine implementation choice.
- Repair failures within the current phase. Stop only for the requested batch boundary or a genuine blocker such as an absent project choice, required credential, or impossible core requirement. State the exact blocker and keep the phase incomplete.
- Do not switch to a different finalist without the user's direction. Offer evidence and a fallback if the selected idea fails its core test.
- A phase is complete only after its deliverable and checks pass. Starting a scaffold, writing a plan, or making a commit is not sufficient evidence by itself.
- At each phase boundary, update the ledger, the relevant implementation checkboxes, and `docs/TEST-PLAN.md` with commands and observed results. Make a focused local commit containing only the phase's work when Git identity is available. Record its hash in the ledger during the next phase update or batch handoff; avoid self-referential commit hashes.
- If the working tree contains unrelated edits, preserve them. Stage explicit paths; do not amend or force-push unrelated history.
- Finish each batch with: completed phases, current run command, what was checked, remaining limitations, and the next phase.

Phase numbers below are delivery phases. They are separate from the Ruflo SPARC method's internal numbering and the completed workspace-setup plan.

## Phase 0 — Research and workspace setup

**Status: complete.** The full research, six finalist profiles, concept previews, source evidence, shared instructions, and local Git checkout already exist. Initial commit: `92a6cda`.

- [x] Preserve research and concepts in the repository.
- [x] Record recommendations separately from user selection.
- [x] Verify portable previews, source imports, and repository connection.

Do not repeat Phase 0 as an implementation task.

## Phase 1 — Lock the project and write the concrete build plan

**Deliverable:** one selected project, fixed MVP, resolved technical choices, and file-level implementation tasks. This phase creates no product scaffold.

**Entry:** user names the project in the execution prompt, or `docs/DECISIONS.md` already records their selection. If neither is true, ask for that one decision and stop Phase 1 before coding. Use judgment for routine technical choices and record them as builder decisions.

**Files to update:** `docs/DECISIONS.md`, `README.md`, `docs/ARCHITECTURE.md`, `docs/IMPLEMENTATION-PLAN.md`, the chosen existing profile below, and the phase ledger.

| User's selection | Active profile |
|---|---|
| Block Ops | `docs/specs/block-ops.md` |
| The Switch | `docs/specs/switch.md` |
| Casebreaker | `docs/specs/casebreaker.md` |
| The Room | `docs/specs/room.md` |
| Reclaim | `docs/specs/reclaim.md` |
| People's Chamber | `docs/specs/peoples-chamber.md` |

- [x] Record the chosen track, user, one-sentence promise, demo scenario, judge action, output, and cut list.
- [x] Choose the smallest familiar stack, input limits, source dependency, export mechanism, and fallback. Explain material builder choices plainly.
- [x] Replace the high-level implementation outline with selected-project tasks grouped under Phases 2–6. For each code task, name exact files, functions/types or interfaces, and the behavior check that proves it.
- [x] Define actual development, build, and test commands the selected stack will support. Do not report them as passed before the commands exist and run.
- [x] Assign each shared requirement and selected-profile acceptance criterion to a task. Include the five review-focus cases above in the owning tasks.
- [x] Check consistency across the decision, profile, architecture, and plan. Record Phase 1 evidence in the ledger.

**Completion check:** an implementer can start Phase 2 without choosing the product, inventing a second architecture, or guessing the output contract. Open nonessential decisions are explicitly cut or delegated, not blockers.

## Phase 2 — Prove the core mechanism

**Deliverable:** a small reproducible technical proof of the selected idea's riskiest dependency. Fold minimal configuration into this proof; avoid building a large app shell first.

**Entry:** Phase 1 complete. **Files:** the exact spike, fixtures, configuration, and checks named in Phase 1, plus `docs/TEST-PLAN.md` and the ledger.

- [x] Run the project's proof below using real source access where essential and clearly labeled fictional inputs where appropriate.
- [x] Record input, output, source/run date, assumptions, and commands. Do not replace a failed test with a fabricated successful result.
- [x] Exercise the simplest missing/failure case and define the path Phase 3 can consume.
- [x] Reuse the proof's useful code in the product if appropriate; keep throwaway code labeled. Stop for evidence-based replanning if the core promise is not viable.

| Project | Required proof |
|---|---|
| Block Ops | A bounded current API query or correctly dated saved response loads; preserve IDs/dates/statuses; reproduce an explainable candidate group without claiming recurrence. |
| The Switch | Human-reviewed paired meaning, real fixed-model outputs, identical-input controls, and exact source checks establish a worthwhile reproducible experiment. A controlled mutation is never the model finding. |
| Casebreaker | Two text documents produce source-linked editable fields, an exact status disagreement, and an ambiguous record that remains unjoined. |
| The Room | A short deterministic goal/practice/retry flow preserves original and chosen words plus a supporter choice. No clinical model is required. |
| Reclaim | One same-report historical pair and one incomplete report retain source fields and independent confirmation; no eligibility award or new medical calculation. |
| People's Chamber | One dated source context, practice question, and revised ask produce a faithful statement draft with no official-submission claim. |

**Completion check:** the proof is reproducible, its limits are explicit, and Phase 3 has a demonstrated input/state contract. A failing essential mechanism blocks completion; visual polish cannot substitute for it.

## Phase 3 — Build the complete working product loop

**Deliverable:** a runnable MVP that completes input → source inspection → human choice → changed output.

**Entry:** Phase 2 complete. **Files:** the application, fixtures, behavior checks, export, and configuration named in the concrete plan.

- [x] Integrate the proved mechanism into the smallest usable interface. Make the judge's consequential choice work on actual state.
- [x] Implement source access, human correction/confirmation, and a readable print/download output.
- [x] Prove that changing or removing evidence changes the actual output and invalidates affected review state.
- [x] Prove one incomplete or ambiguous input remains unresolved. Verify the clean end-to-end path and current run command.
- [x] Open the exported artifact and compare it with current reviewed state. Record actual checks and remaining limitations.

**Completion check:** another person can run the MVP, complete its one main scenario, change a relevant input, and inspect the corresponding output. It is more than a static replica of the concept preview.

**Day-one target:** Phases 1–3 complete. Cut optional features if the loop is at risk.

## Phase 4 — Make the workflow reliable

**Deliverable:** accurate source handling, conservative uncertainty, and recoverable errors, checked against the selected profile.

**Entry:** Phase 3 complete. **Files:** existing core modules and meaningful behavior tests from the concrete plan; `docs/TEST-PLAN.md` and the ledger.

- [ ] Exercise the selected project's labeled fixture cases from `docs/TEST-PLAN.md`.
- [ ] Verify source quotations/IDs/dates/units, incorrect-match rejection, stale-confirmation invalidation, and no invented facts.
- [ ] Exercise unavailable or malformed dependencies, finite timeout where relevant, preserved reviewed state, and accurately labeled fallback.
- [ ] Check no-selection/empty input and current export content. Fix material errors before proceeding.
- [ ] Run the real build and relevant tests. Record counts and outcomes actually observed; do not claim downstream impact.

**Completion check:** the main path, uncertain case, and dependency failure behave consistently without hidden manual repair. High-impact correctness failures remain blockers rather than deferred polish.

## Phase 5 — Add the visual identity and judge interaction

**Deliverable:** a cohesive, readable product with a clear stage moment.

**Entry:** Phase 4 complete. **Files:** the selected UI components/styles, print layout, and demo fixture; preserve core behavior.

- [ ] Apply the selected concept's visual direction, hierarchy, and plain-language copy. Make the judge's action and its consequence immediately visible.
- [ ] Check desktop and 320-pixel layouts, keyboard completion, visible focus, readable appearance, loading/error/empty states, and print/export layout.
- [ ] Use restrained motion only to explain a meaningful state change; honor reduced-motion preferences.
- [ ] Recheck the working loop and export after styling. Avoid tests that simply duplicate CSS or implementation details.
- [ ] Capture real screenshots of the working product and update the ledger with inspected views and any remaining limits.

**Completion check:** the product is visually consistent and the stage interaction is understandable, while the same verified output loop still works.

## Phase 6 — Prepare the presentation and release package

**Deliverable:** a demo-ready local/release build, a short rehearsable pitch, run instructions, and submission-ready materials.

**Entry:** Phase 5 complete. **Files:** `README.md`, `docs/DEMO-AND-PRESENTATION.md`, `docs/SUBMISSION-CHECKLIST.md`, required screenshots/demo materials, and the ledger.

- [ ] Produce the real build and verify its startup and artifact-opening path. Document exact setup and environment-variable names without secrets.
- [ ] Prepare the opening, judge action, evidence reveal, and useful finish. Use the actual presentation limit if known; otherwise keep the three-minute script labeled as a proposed format.
- [ ] Rehearse the clean path and clearly labeled fallback. Capture backup material where useful.
- [ ] Draft the project description, technical explanation, actual verification results, credits, and screenshots. Recheck the official clock and rules before claiming submission readiness.
- [ ] List remaining external actions and their status accurately. Push, public deployment, official submission, or outreach happen only when authorized by the user's instruction; this phase can prepare the complete local package without them.
- [ ] Mark completion only when the release package and rehearsal checks pass. Distinguish product completion from external submission.

**Completion check:** someone can run the project and present its functioning scenario from the documentation, with an inspectable output and an honest backup. No deployment or submission is claimed unless it occurred.

## Suggested batches

1. **Phases 1–3:** decide and build a working MVP. This is the first useful implementation batch after the user names a project.
2. **Phases 4–5:** strengthen correctness and make the product look and feel intentional.
3. **Phase 6:** package and rehearse the demo and release materials.

For a riskier idea such as The Switch, request **Phases 1–2 first** so the experiment is visible before spending the remainder of the build window. A batch boundary is an inspection opportunity, not a requirement to repeat approval for work already requested.

## Copy/paste prompts

The first prompt is ready for the confirmed Block Ops selection. The second resumes subsequent phase batches.

```text
We are building Block Ops for the BCC hackathon.
Read AGENTS.md, README.md, docs/DECISIONS.md, docs/PHASE-STATUS.md,
and docs/superpowers/plans/2026-10-21-luna-phase-execution.md.
Execute phases 1–3 in order. Use the recorded Block Ops selection.
Continue automatically within this batch when phase checks pass.
Update the phase ledger and actual verification results, make focused local
commits, and stop after Phase 3. Do not push, publish, or submit anything.
Report how to run the MVP, what passed, and the next phase.
```

```text
Read AGENTS.md, docs/PHASE-STATUS.md, and the Luna phase execution plan.
Execute the next 2 unfinished phases in dependency order.
Resume in-progress work; verify completed predecessors without redoing them.
Fix issues within the current phase, record actual checks, update the ledger,
and make focused local commits. Stop after the requested batch.
Do not push, publish, or submit anything. Report remaining blockers honestly.
```
