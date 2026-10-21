# Three-day implementation plan

**Status:** active for Block Ops, selected by the user October 21, 2026. Phase 1 finalized the concrete technical plan. Engineer A / Engineer B remain provisional work allocations, not named assignments.

**Execution entry point:** use the [Luna phase plan](superpowers/plans/2026-10-21-luna-phase-execution.md) and [phase ledger](PHASE-STATUS.md). The daily outline below remains the time budget, not a second competing phase system.

## Phase 1 technical decisions

- **Stack:** Node.js 20+ standard library, ES modules, and native browser HTML/CSS/JavaScript. No frontend framework, dependency install, build step, model, or credentials.
- **Run path:** `node server.mjs` serves the app at `http://127.0.0.1:8000` and exposes one same-origin endpoint that calls the fixed DC 311 layer. Bind to loopback only; do not accept arbitrary URLs or client-supplied SQL.
- **Source contract:** query `FeatureServer/21` for `WARD='Ward 8'`, `SERVICECODEDESCRIPTION LIKE '%Dump%'`, and the trailing 90 days in the layer's `America/New_York` calendar. Request at most 1,000 rows, ordered by `OBJECTID`, with `OBJECTID`, `SERVICEREQUESTID`, `SERVICECODE`, `SERVICECODEDESCRIPTION`, `ADDDATE`, `SERVICEDUEDATE`, `RESOLUTIONDATE`, `SERVICEORDERSTATUS`, `ORGANIZATIONACRONYM`, `WARD`, and `STREETADDRESS`. Exclude `DETAILS`, `INSPECTORNAME`, geometry, and coordinates. Preserve original field values and label the live retrieval time and date window. If the response reports truncation or has an invalid feature-set shape, show an error and do not present partial results.
- **Grouping:** normalize away a leading street number and group by remaining street name plus service category. Explain that this is only a candidate list; show exact source addresses and require human include/exclude review. Do not assert a repeated incident.
- **State/output:** keep the current source, selection, observation, ask, and tasks in memory only. A failed source refresh preserves them. The fictional offline fixture is explicitly labeled and separate from live records. Generate Markdown from current selection; print-to-PDF uses the browser. Excluded IDs never appear in the output. Changing evidence invalidates record-review confirmation; no selected records means no export.

## Concrete tasks by delivery phase

| Phase | Files and interfaces | Behavior check |
|---|---|---|
| 2 — source proof | `lib/block-ops.mjs`: `buildQueryWindow`, `buildArcGisUrl`, `normalizeFeatureSet`, `suggestStreetGroups`; `scripts/prove-data.mjs`; `test/data.test.mjs` | Unit tests prove bounded filters, preservation of ID/date/status, candidate explanation, missing fields, transfer-limit rejection, and network-error handling. Run the proof against the live API; report only returned counts/date window and inspect no raw addresses. |
| 3 — working MVP | `server.mjs`: loopback static server and fixed `/api/requests` proxy; `data/demo.json`; `public/index.html`, `public/app.mjs`, `public/styles.css`; `lib/block-ops.mjs`: `buildBriefMarkdown`; `test/workflow.test.mjs` | Start with `node server.mjs`; inspect live and fictional labels; remove one candidate and verify preview/download change; change source evidence and verify confirmation clears; add an observation, ask, and two role tasks and inspect the generated brief; verify missing date/status stays unknown, empty selection blocks export, and failed refresh preserves the current draft. Test at keyboard and narrow viewport; manually open the downloaded artifact. |
| 4 — reliability | `lib/block-ops.mjs`, `server.mjs`, `public/app.mjs`, `test/data.test.mjs`, `test/workflow.test.mjs` | Add deduplication/unresolved handling for duplicate IDs, stable paged retrieval or explicit bounded failure, timeout/recovery checks, stale-confirmation cases, and malformed/missing source fields. |
| 5 — polish | `public/index.html`, `public/app.mjs`, `public/styles.css`, `data/demo.json`, `docs/DEMO-AND-PRESENTATION.md` | Check the full judge interaction, keyboard access, visible focus, legible light appearance, no horizontal clipping at 320 px, and print layout. |
| 6 — local release package | `README.md`, `docs/DEMO-AND-PRESENTATION.md`, `docs/SUBMISSION-CHECKLIST.md`, `docs/TEST-PLAN.md` | Verify clean startup, source fallback labels, artifact opening, and rehearsal notes. No push, publish, or submission without separate authorization. |

**Commands:** `node server.mjs` (run), `node --test` (automated checks), `node scripts/prove-data.mjs` (live source proof; requires network), and `git diff --check` (repository hygiene). Node.js 20 or newer is required; there is no package installation or build command.

| Day | Numbered phases | Expected result |
|---|---|---|
| 1 | 1: scope; 2: technical proof; 3: complete loop | A runnable MVP with a changed output |
| 2 | 4: reliability; begin 5: polish | Trustworthy core and a clear judge interaction |
| 3 | Finish 5; 6: presentation and release package | Rehearsed demo and submission materials |

## Before coding

The Block Ops selection and initial scope are recorded in `DECISIONS.md`, and `specs/block-ops.md` is active. Use Ward 8 / Illegal Dumping as the initial bounded data scope. In Phase 1, pick the team's familiar stack, exact files/interfaces and checks, and the simplest export. The demo action is rejecting an unrelated candidate report and inspecting the changed brief. Recheck the event rules that affect eligibility and pre-existing work.

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

Other finalist splits remain in the research comparison and their inactive profiles. Do not implement them alongside Block Ops.

## Daily handoff

Each engineer leaves a short note: working path, actual command/check result, unresolved blocker, and next task. Keep state in the selected specification and `TEST-PLAN.md`; do not let chat-only assumptions become the only build documentation.
