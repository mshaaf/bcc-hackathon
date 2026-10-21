# Shared project context

Read [AGENTS.md](AGENTS.md) for repository instructions and [README.md](README.md) for the document map. They are the shared source of project context for coding assistants.

The current product choice and constraints live in [docs/DECISIONS.md](docs/DECISIONS.md). Do not treat a research recommendation as the team's selected project.

## Start a fresh session here

Read [docs/HANDOFF.md](docs/HANDOFF.md), then [docs/PHASE-STATUS.md](docs/PHASE-STATUS.md). Do not read the full research archive by default.

- Block Ops / Track 3 is selected. Two engineers, three build days. The user wants meaningful judge participation and a convincing product; the current form/brief UI was rejected as the final experience.
- Baseline phases 1–3 are complete; audited baseline commit is `687582a`. The app is now a map workspace over live DC 311 records with an evidence/plan/brief flow; campaigns are saved in the browser's localStorage (one operator, no sync).
- **R1–R4 are complete** (see [docs/specs/campaign-revision.md](docs/specs/campaign-revision.md), sections 7–10, and [docs/PITCH.md](docs/PITCH.md)); next is **R5**, freeze and release package. Pitch line: "Closed isn't fixed." A resident-led campaign is the recommended direction; final scenario and detailed implementation choices remain open. Do not silently resume old Phase 4 styling.
- The last request authorized a detailed documentation handoff only. Follow the user's next implementation instruction and requested R-phase boundary.
- The user is conserving account usage and moving some work to Claude. Keep context reads and checks focused; do not create agents or orchestration infrastructure by default.

## Current commands

From this repository root, using Node.js 20+:

```sh
git status --short --branch
node --test
node server.mjs
```

Open `http://127.0.0.1:8000`. No install, build step, or credentials are needed for the current app. Inspect an existing server before starting another on port 8000. `node scripts/prove-data.mjs` is the optional live 311 proof, not a crime/map test. Latest run: 85/85 tests passed. `node scripts/record-snapshot.mjs` refreshes the recorded snapshot (needs network). `node scripts/prove-geo.mjs` is the live geometry/crime proof; `scripts/browser-check.mjs` drives real Chrome with device emulation through the whole create-save-reload-follow-up-export flow.

## Architecture and traps

- `server.mjs`: explicit same-origin assets and GET-only fixed-source routes. New files/endpoints must be added deliberately. CSP allows only same-origin scripts/styles/connects plus `img-src https://maps2.dcgis.dc.gov` for basemap tiles; Leaflet is vendored.
- `lib/block-ops.mjs`: 311 query, normalization, source links, review state, brief builders. `public/app.mjs` + `public/map.mjs` + `public/storage.mjs` + `lib/campaign.mjs`: browser UI/state, Leaflet wrapper, localStorage wrapper, pure campaign model. No package manifest or frontend framework exists.
- 311 filter uses `WARD='Ward 8'`; geometry is requested as WGS84 (`outSR=4326`, `geo`/`geoStatus` per record). Street grouping is still not spatial; `recordsWithin` is the proximity helper. Rejects truncation above the bounded response; no pagination.
- `data/demo.json` is entirely invented, not a cached public source. Never attach official record links to fictional DEMO IDs.
- Preserve source IDs/dates/statuses, unknowns, rejected-evidence exclusion, context clearing, failed-refresh recovery, safe text rendering, and export fidelity. Tests are in `test/`.
- Crime source access was checked separately. It has approximate block locations and reporting lag. The app has no crime layer, Flock access, AI, map, campaigns, or saved cases yet.
- Avoid a generic Citizen clone: map/AI/team alerts overlap existing products. Proposed value is sustained neighborhood improvement campaigns, which remains unvalidated.

Keep the existing stack unless a concrete new requirement warrants change. Preserve unrelated edits. Update the ledger and actual evidence after a batch. Local commits are useful; no push, deployment, official submission, or outreach without the user's instruction (R1–R3 are already on the public `origin/main`; the user pushes later batches). No license has been selected.
