# Shared project context

Read [AGENTS.md](AGENTS.md) for repository instructions and [README.md](README.md) for the document map. They are the shared source of project context for coding assistants.

The current product choice and constraints live in [docs/DECISIONS.md](docs/DECISIONS.md). Do not treat a research recommendation as the team's selected project.

## Start a fresh session here

Read [docs/HANDOFF.md](docs/HANDOFF.md), then [docs/PHASE-STATUS.md](docs/PHASE-STATUS.md). Do not read the full research archive by default.

- Block Ops / Track 3 is selected. Two engineers, three build days. The user wants meaningful judge participation and a convincing product; the current form/brief UI was rejected as the final experience.
- Baseline phases 1–3 are complete; audited baseline commit is `687582a`. The app is a DC 311 record-review/brief builder, not a live map or saved campaign product.
- **R1 is complete** (see [docs/specs/campaign-revision.md](docs/specs/campaign-revision.md)); next is **R2**, map and evidence. A resident-led campaign is the recommended direction; final scenario and detailed implementation choices remain open. Do not silently resume old Phase 4 styling.
- The last request authorized a detailed documentation handoff only. Follow the user's next implementation instruction and requested R-phase boundary.
- The user is conserving account usage and moving some work to Claude. Keep context reads and checks focused; do not create agents or orchestration infrastructure by default.

## Current commands

From this repository root, using Node.js 20+:

```sh
git status --short --branch
node --test
node server.mjs
```

Open `http://127.0.0.1:8000`. No install, build step, or credentials are needed for the current app. Inspect an existing server before starting another on port 8000. `node scripts/prove-data.mjs` is the optional live 311 proof, not a crime/map test. Latest run: 28/28 tests passed. The disposable map layout is at `/prototype`; `node scripts/prove-geo.mjs` is the live geometry/crime proof.

## Architecture and traps

- `server.mjs`: explicit same-origin assets and GET-only fixed-source routes. New files/endpoints must be added deliberately. CSP currently blocks external map tiles/scripts/API origins.
- `lib/block-ops.mjs`: 311 query, normalization, source links, review state, brief builders. `public/app.mjs`: native browser UI/state; no persistence. No package manifest or frontend framework exists.
- 311 filter uses `WARD='Ward 8'`; coordinates/geometry are excluded. Current street grouping is not spatial matching. Rejects truncation above the bounded response; no pagination.
- `data/demo.json` is entirely invented, not a cached public source. Never attach official record links to fictional DEMO IDs.
- Preserve source IDs/dates/statuses, unknowns, rejected-evidence exclusion, context clearing, failed-refresh recovery, safe text rendering, and export fidelity. Tests are in `test/`.
- Crime source access was checked separately. It has approximate block locations and reporting lag. The app has no crime layer, Flock access, AI, map, campaigns, or saved cases yet.
- Avoid a generic Citizen clone: map/AI/team alerts overlap existing products. Proposed value is sustained neighborhood improvement campaigns, which remains unvalidated.

Keep the existing stack unless a concrete new requirement warrants change. Preserve unrelated edits. Update the ledger and actual evidence after a batch. Local commits are useful; no push, deployment, official submission, or outreach without the user's instruction. No license has been selected.
