# Verification plan and evidence

## Completed concept checks

The original combined preview was exercised in local desktop Chromium on October 21, 2026. The recorded checks covered:

- Six product variants and 18 presentation beats; no browser errors observed.
- Block Ops record selection and edited observation reflected in the brief.
- People's Chamber edited request reflected in testimony.
- The Switch wording change, source reveal, and preview correction confirmation.
- Casebreaker source review and packet opening.
- The Room chosen words reflected in the card.
- Reclaim confirmation, packet opening, and missing-date record not inheriting another record's confirmation.
- Actual project picker and previous/next navigation.
- Product layouts at viewport widths 1024, 736, 390, and 320; no measured horizontal overflow in those checks. Light/dark desktop and selected mobile screens were visually inspected.

Machine-readable prior layout results: [previews/qa/results.json](../previews/qa/results.json). These checks validate local concept interactions only. PDF parsing, real model calls, official API use inside an app, product persistence, and downstream outcomes are unbuilt or untested.

## Workspace handoff checks

Before reporting setup complete:

1. Compare imported artifacts to source hashes; account for Markdown link normalization.
2. Check every relative Markdown file link and reject old absolute workstation paths.
3. Check JSON parseability and six preview roots with unique IDs.
4. Open the exported standalone preview, exercise its project picker and a changed-output action, and inspect browser errors.
5. Check `git remote get-url origin`, branch, ignored local data, and the working tree/diff.
6. Inspect tracked text for accidental credential material and workstation paths. Keep local raw data excluded.

Final setup results are recorded in [workflow/verification.json](workflow/verification.json). Do not read the plan above as evidence that a check passed; consult the actual result record.

## Selected-product checks

**Active project:** Block Ops. Use its profile and the Block Ops fixture row below for implementation phases; other rows are retained research context. Phase 1 selected Node.js 20+, the built-in test runner, and a same-origin loopback proxy. Phase 3 results are recorded below; Phase 4 reliability checks remain open.

Use a small labeled fixture set rather than tests that merely mirror the implementation. Exercise:

- A clean complete input, edited confirmation, and changed export.
- Missing/invalid input and at least one ambiguous or rejected relationship.
- Source-link correctness and exact quotation validation.
- An external failure/timeout and clearly labeled fallback.
- Keyboard completion and readable 320-pixel layout.
- Print/download content after an input change; no stale or excluded claims.

| Project | Highest-value fixture cases |
|---|---|
| Block Ops | Duplicate ID; different nearby site; missing status/date; no observation; removed report; truncated query; outage |
| The Switch | Valid paired meaning; unchanged-input reruns; actual pass; lost/changed fact; invented quote; controlled mutation; provider failure |
| Casebreaker | Exact ID/court match; same-name ambiguity; stale status; date after report; missing identifier; wrong source quote |
| The Room | Retry; skip; changed goal; supporter removed; original words retained; unanswered clinical question |
| Reclaim | Missing date; swapped labels; unrelated specimens; unclear units; wrong person; modern result; already reviewed |
| People's Chamber | Missing/expired logistics; amended source; timer idle until start; edited ask; no official submission |

## Block Ops commands and current phase evidence

- Run the app: `node server.mjs` (Node.js 20+; no install step).
- Run automated behavior checks: `node --test`.
- Reproduce the bounded public source proof: `node scripts/prove-data.mjs` (network required; prints counts and source window, not raw addresses).
- Check tracked changes: `git diff --check`.

Phase 1 documentation finalized the source filter, field allowlist, review contract, state, output, and file-level tasks. Phase 2 and Phase 3 evidence follows.

### 2026-10-21 — Phase 2 data proof

- `node --test test/data.test.mjs`: passed 5/5 tests for the bounded query, source ID/date/status preservation, missing fields, transfer-limit rejection, same-street candidate suggestions, and a simulated source-fetch failure.
- `node scripts/prove-data.mjs` (live request, retrieved `2026-10-21T16:44:09.372Z`): passed. The 90-day window was `2026-07-24` inclusive to `2026-10-22` exclusive; 389 records and 389 unique request IDs returned; 67 multi-record street/category suggestions; `exceededTransferLimit` was false. No raw addresses or full records were printed or saved.
- The first filter trial used `WARD='8'` and returned zero rows. The source uses the string value `WARD='Ward 8'`; the corrected query returned the counts above. The earlier October 20 saved response remains historical evidence and was not substituted for this live run.
- Offline failure behavior is unit-tested with a rejected fetch. App-level refresh preservation is tested in Phase 3; no outage was forced in the browser during manual checks.
- Limit: a truncated live response is rejected at the 1,000-row cap; paged retrieval is deferred to Phase 4. A candidate group is only a street/category suggestion, not an incident or recurrence finding.

### 2026-10-21 — Phase 3 working MVP

- Runtime: Node.js `v24.0` was available (the app requires Node.js 20+). `node server.mjs` started at `http://127.0.0.1:8000`; the app is dependency-free.
- `node --test`: passed 17/17 (6 source/data, 4 server, and 7 workflow tests). Coverage includes bounded queries and field preservation, malformed/truncated source rejection, fixed-host proxy behavior, read-only routes, source failure, draft preservation after failed refresh, successful refresh reset, excluded-record removal and stale confirmation, missing date/status/current conditions, empty-selection export guard, and literal user wording in Markdown.
- `node --check server.mjs`, `node --check lib/block-ops.mjs`, and `node --check public/app.mjs`: all passed. `git diff --check` passed after the final code and documentation updates.
- Chrome interaction: loaded the labeled fictional sample; unchecked `DEMO-102`; the preview changed from four selected records to three, excluded ID disappeared, and source confirmation cleared. After reconfirming, edits to the group observation, request, and tasks appeared in the preview. Downloaded and opened the Markdown artifact; it contained `DEMO-101`, `DEMO-103`, and `DEMO-104`, omitted `DEMO-102`, and preserved unavailable date/status labels. Keyboard Tab/Space changed selection and updated the preview. A 320-pixel responsive viewport showed the stacked layout without visible horizontal clipping.
- Live UI check: loaded the official DC data through the local proxy at `2026-10-21T16:55:14.964Z`: 389 records in the displayed bounded window; the largest candidate group shown had 16 records. Original values are inspectable on expansion. Exact street addresses are not shown in collapsed summaries or exported briefs.
- Limits: live data is a dated snapshot; user drafts are memory-only. Results are not paged beyond 1,000 and a transfer-limit response is rejected. Same-street/category candidates are not proven relationships. Markdown download was opened and compared; browser print/PDF output, broader screen-reader/accessibility coverage, and user testing remain unverified. Failures are covered by automated tests, not an induced browser outage. Nothing is sent to DC.

Measure actual counts and denominators. Do not report target accuracy as achieved accuracy. User testing may assess task completion or comprehension; it does not establish improved healthcare access, model fairness, or government responsiveness.

## Commands

The concept preview can still be served separately with `python3 -m http.server 8000 --bind 127.0.0.1`; that command does not run the Block Ops app. Current app commands are listed above.
