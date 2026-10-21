# Implementation phase ledger

This is the canonical execution status for Luna batches. The [phase plan](superpowers/plans/2026-10-21-luna-phase-execution.md) defines deliverables and checks. Product selection remains recorded in [DECISIONS.md](DECISIONS.md).

**Active project:** Block Ops — Track 3, Community Development; selected by the user October 21, 2026. **Next phase:** 4. **Executor:** Luna terminal.

| Phase | Deliverable | Status | Evidence |
|---|---|---|---|
| 0 | Research, concepts, and workspace setup | Complete | Initial local commit `92a6cda`; [setup verification](workflow/verification.json). |
| 1 | Selected scope and concrete build plan | Complete | Node.js stack, API contract, files/interfaces, checks, and phase tasks recorded across the decision, README, architecture, implementation plan, Block Ops profile, demo, and test plan. |
| 2 | Reproducible proof of the core mechanism | Complete | `node --test test/data.test.mjs`: 5/5 passed. Live API proof on October 21: 389 records, 389 unique IDs, 67 multi-record street/category candidates, no transfer-limit flag. See [test evidence](TEST-PLAN.md#2026-10-21--phase-2-data-proof). |
| 3 | Complete working MVP and changed output | Complete | Runnable local app, live/fictional inputs, source review, changed brief, and automated/manual checks; see [Phase 3 evidence](TEST-PLAN.md#2026-10-21--phase-3-working-mvp). |
| 4 | Reliable sources, uncertainty, and recovery | In progress | Audit fixes and regression/browser checks below; finish the remaining reliability acceptance criteria. |
| 5 | Polished product and judge interaction | In progress | User requested an early UI correction: three-step worktable, full addresses, live summary, dedicated brief, and responsive/print checks delivered. Final stage rehearsal remains. |
| 6 | Presentation and release package | Not started | Depends on Phase 5. |

Use only **Not started**, **In progress**, **Blocked**, and **Complete**. A blocked phase remains the next unfinished phase until resolved; do not skip it or silently substitute another idea.

## Update after every phase

Change the status row and next phase. Add a short entry below with:

- Date and phase number.
- Deliverable and files changed.
- Commands/checks actually run, observed results, and artifact inspected.
- Remaining limits or exact blocker.
- Local commit if available; do not write a guessed hash.

## Batch history

### 2026-10-21 — User-requested UI investigation and repair

- Re-ran the Phase 3 baseline: 17/17 tests passed. The existing UI displayed the source review, all planning fields, and final artifact together, with no clear presentation sequence; full addresses were hidden from the collapsed list. The user requested investigation and a stronger interface, authorizing this targeted reliability and visual work ahead of the earlier batch order.
- Rebuilt the current UI into review → plan → brief, preserving the existing palette and working source/data contracts. Full addresses and original disclosures are visible; the count and status summary reflect the selected evidence; the brief has a distinct paper view and exports.
- Fixed wrong official links for missing object IDs, cross-source/group observation carryover, duplicate-key selection/export disagreement, loading-time edit races, and missing addresses/direct source references in exports. A new source/group clears its observation and date; a failed refresh preserves the reviewed draft.
- Current automated checks: `node --test` passed 23/23. Chromium browser checks exercised changed output, downloaded Markdown, a simulated failed refresh, real live load (389 public records), cleared context, missing observation date, arrow-key tabs, and all three views at 1440, 1024, 768, 390, and 320 pixels. No browser errors or measured horizontal overflow were observed. The fictional sample's A4 PDF was visually inspected.
- An independent visual review found two mobile issues, both fixed and re-inspected: wordmark wrapping at 320 pixels and overlong candidate options at 390 pixels. The mechanical design detector returned no findings. Screenshots and detailed evidence are in [the UI review](ui-review/README.md) and [test plan](TEST-PLAN.md).
- Phases 4 and 5 remain in progress rather than being declared fully complete. Keep the implemented design and finish remaining reliability/acceptance and stage checks in subsequent requested batches. No push, deployment, or official submission occurred.

### 2026-10-21 — Phase execution handoff prepared

The user chose Luna as the implementation executor and requested numbered phase batches. Phase 0 was verified previously. At handoff creation, no finalist had been selected. The numbered execution plan and resumable ledger were added; no product code was written.

### 2026-10-21 — Block Ops selected

The user explicitly chose Block Ops for Track 3. Its profile is active, the initial MVP and cuts are recorded, and current project documents now agree. Phase 1 remains next: Luna must complete the technical plan before the proof and MVP phases. No implementation phase was marked complete by this selection update.

### 2026-10-21 — Phase 1 complete; Phase 2 started

- **Phase 1 deliverable:** selected Node.js 20+ built-ins, native browser modules, a fixed loopback API proxy, a 90-day Ward 8 / Illegal Dumping query, an explicit fictional offline fixture, in-memory draft state, same-street candidate suggestions, and Markdown/print output. Files: `README.md`, `docs/DECISIONS.md`, `docs/ARCHITECTURE.md`, `docs/IMPLEMENTATION-PLAN.md`, `docs/specs/block-ops.md`, `docs/DEMO-AND-PRESENTATION.md`, `docs/TEST-PLAN.md`, this ledger, and the Luna phase plan.
- **Checks:** read the selected profile and required project documents; inspected the existing ignored 475-row October 20 source snapshot's schema without printing record values; inspected official FeatureServer/21 metadata (field names, 1,000-row cap, and layer timezone). `git diff --check` passed; a local Markdown-link check passed for all nine changed documents. A trial filter using `WARD='8'` returned zero rows; research and the source schema specify `WARD='Ward 8'`. The corrected live query and all product checks are still pending; no data proof is claimed.
- **Limits:** the source grouping is a suggestion by normalized street name and category, not evidence of one incident. Phase 1 documentation only; no product code yet.
- **Local commit:** `433f043` (`docs: finalize Block Ops Phase 1 plan`).

### 2026-10-21 — Phase 2 complete; Phase 3 started

- **Phase 2 deliverable:** bounded live query and source-preserving normalizer, explainable street/category grouping, and a reproducible proof command. Files: `lib/block-ops.mjs`, `scripts/prove-data.mjs`, `test/data.test.mjs`, `docs/TEST-PLAN.md`, this ledger, and the Luna phase plan. Phase 1 local commit: `433f043`.
- **Checks:** test-first run initially failed because `lib/block-ops.mjs` did not exist; then `node --test test/data.test.mjs` passed 5/5. `node scripts/prove-data.mjs` passed against the live API at `2026-10-21T16:44:09.372Z`: 389 records, 389 unique request IDs, 67 multi-record candidate groups, transfer limit false, query window `2026-07-24`–`2026-10-22` (end exclusive). The default sandbox blocked network access; the same proof passed with approved network access. See [test evidence](TEST-PLAN.md#2026-10-21--phase-2-data-proof).
- **Limits:** source outages fail explicitly; app-level draft preservation is unimplemented until Phase 3. Pagination is not implemented; any transfer-limit response is rejected. Candidate grouping is not evidence of one incident or recurrence.
- **Local commit:** recorded in the Phase 3 entry after commit.

### 2026-10-21 — Phase 3 complete; Phase 4 next

- **Phase 3 deliverable:** runnable local worktable with the fixed DC 311 proxy, fictional offline sample, expandable original source fields, record selection and confirmation, resident observation, editable request and two role-based tasks, live preview, Markdown download, and browser print action. Changed selection invalidates review; the current brief omits excluded records. Files: `server.mjs`, `data/demo.json`, `public/index.html`, `public/app.mjs`, `public/styles.css`, `lib/block-ops.mjs`, `test/data.test.mjs`, `test/server.test.mjs`, and `test/workflow.test.mjs`.
- **Checks:** `node --test` passed 17/17 (6 data, 4 server, 7 workflow). `node --check` passed for the server, shared module, and browser module. Manual Chrome checks exercised the fictional sample, excluded `DEMO-102`, saw the brief change from four records to three and confirmation clear, confirmed the revised selection, edited the observation/request/tasks, and opened the downloaded Markdown to verify it matched. Missing date/status stayed unavailable; keyboard Tab/Space selection worked. At a 320-pixel emulated viewport, the stacked interface was visually inspected. The actual UI also loaded live DC data through the proxy on October 21 at `16:55:14.964Z`: 389 records; the largest displayed candidate group had 16 records.
- **Limits:** exact record details require expansion and are not included in the brief. The sample is invented. Drafts are memory-only; pagination is deferred and capped/truncated responses are rejected. Same-street/category matches are candidates, not established incidents or recurrence. A Markdown artifact was inspected; PDF rendering, broader accessibility, and user testing were not performed. No city submission occurs.
- **Local commit:** `bd40645` (`feat: build Block Ops working MVP`).
