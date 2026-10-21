# Historical handoff through R4 — superseded

Historical snapshot. Use [SONNET-HANDOFF.md](../SONNET-HANDOFF.md) and the current social plan for new work. Prompts/status claims below are retained as history, not execution instructions.

## Latest continuation — community participation

The user explicitly wants neighbors to come together like a Facebook group/group chat, agree on a plan, take jobs and post progress. [Community scope](../specs/community-missions.md) and the [S1–S4 plan](../superpowers/plans/2026-10-21-community-missions.md) supersede earlier single-operator continuation instructions in this file. R1–R4 are implemented; shared community, membership, posts and claims are not. S1 is the next proposed build batch; R5 waits until the social slice works.

Reuse the map, source handling, local campaign model and exports. Do not silently upload or overwrite local campaigns. Supabase Auth/Postgres/Realtime is a recommended new shared backend, subject to real access/setup proof; no provider/project or public hosting was configured by this planning task. The current recurrence code measures report-date proximity, so its “after closure” claims must be corrected before presenting. Keep prior phase evidence as history and preserve other assistants' files.

The new plan contains identity/permission rules, public-sharing preview, task-claim concurrency, failure/retry behavior, two-device acceptance and next-phase prompts. Every assistant message must end with a super-simple TL;DR.

Updated October 21, 2026. This is the next-session entry point. It supersedes the old form-first plan as a continuation instruction, while preserving its implementation and verification history. No campaign/map implementation was performed in the handoff batch.

## 1. Read this first

- **Project:** Block Ops, BCC Hackathon, Track 3 — Community Development. Two strong generalist engineers, build window October 21–23. Do not reopen finalist selection.
- **What runs:** a small Node.js / native browser app that reviews DC 311 records and exports a brief. Baseline product commit: `687582a`. This handoff does not represent a completed scope revision.
- **Why the direction changed:** the user rejected both the initial UI and a subsequent cosmetic repair. A checkbox-and-form workflow is insufficient for the intended memorable hackathon demonstration. Passing tests does not resolve that criticism.
- **What the user welcomed:** a stronger map-centered product using real public data; asked about crime data and Flock, then challenged overlap with Citizen.
- **Latest recommendation:** resident-led neighborhood improvement campaigns, with a map as the operating surface, service history and resident evidence, assigned follow-ups, and saved progress. Crime is optional context. This is the current planning proposal, not a claim that every feature or example was explicitly approved.
- **This task's authorization:** inspect and update documentation; prepare a detailed handoff for Claude. Product code, dependencies, hosting, and publication were not changed.
- **Next batch:** R5, below. R1–R4 are complete (R4 added the "Closed isn't fixed" recurrence insight, the escalation brief, a recorded snapshot and stage checks; see [PITCH.md](../PITCH.md) and the revision spec sections 9–10). R1–R3 are complete: see [campaign-revision.md](../specs/campaign-revision.md) for decisions, proofs, acceptance criteria, file plan, section 7 (R2 as built), section 8 (R3 as built), section 9 (does DC already publish hotspots?) and section 10 (R4 as built). Do not automatically continue old Phase 4 polish or interpret baseline Phase 1–3 completion as map/campaign completion.

The user mentioned approaching their account's five-hour usage window and plans to use Claude for further work. Exact remaining allowance/reset is unknown. This is a usage constraint, not a new five-hour project deadline. Keep reads bounded, avoid repeated research and unnecessary agents, and leave resumable increments.

## 2. Commands and startup

Run commands from the repository root. Node.js 20+ is required; the current app has no package manifest, dependencies, API keys, or build step.

```sh
git status --short --branch
git log -4 --oneline
node --test
node server.mjs
```

Open `http://127.0.0.1:8000`. A server may already be running from the previous session. If port 8000 is occupied, inspect it before starting another process; do not kill an unrelated process. `python3 -m http.server` serves historical previews only and does not provide the app API.

Optional existing source proof, only when source behavior is changing or needs a fresh check:

```sh
node scripts/prove-data.mjs
```

Git remote is `https://github.com/mshaaf/bcc-hackathon.git` (a public repository). R1–R3 and their documentation have been pushed to `origin/main` at the user's instruction; this means the history, including `docs/`, `research/` and `data/demo.json`, is public. Nothing has been deployed, submitted, or sent to anyone. Push only when the user asks; agents commit locally. Inspect current Git state because another assistant may have worked since this note.

## 3. Built, demonstrated, and unbuilt

| Capability | Actual status |
|---|---|
| Fixed DC 311 query | Built: Ward 8 / descriptions containing “Dump,” rolling 90-day window, up to 1,000 records, source IDs/dates/statuses retained. |
| Same-street/category suggestions | Built: strips leading address number; this is not spatial matching or incident identification. |
| Source review and brief | Built: include/exclude, original fields, source links, dated observation, ask, two role tasks, current-state Markdown and browser print. |
| Map workspace UI | R2/R3: map-first page at `/` with Explore → Campaign → Brief tabs. Saved campaigns (localStorage, one browser), owned tasks, typed dated follow-ups, per-campaign brief/export. |
| Offline sample | Built: five invented records, clearly labeled fictional. It is not a saved DC response or community research. |
| Maps, spatial filtering, crime layer | Built in R2: Leaflet (vendored) over the DC GIS basemap plots live records with area, radius, date and status controls (the R1 `/prototype` page is deleted). Crime: Ward 8 MPD query proven in `scripts/prove-geo.mjs`, not consumed by the app. |
| Saved campaigns, task owners/due dates, progress and follow-up evidence | R3: built, single operator, `localStorage` (`blockops.campaigns.v1`). No sharing or sync. |
| Recurrence insight, escalation brief, recorded snapshot | R4: built. `lib/recurrence.mjs` (re-report rule), stat line, busy-spot shading, recipient + lasting-fix ask, `data/recorded-snapshot.json` behind a third source button. |
| Photos, AI summary/drafting, agency routing | Unbuilt. No model/provider credentials or verified routing catalog selected. |
| Shared accounts, mobile synchronization, notifications, camera feeds | Unbuilt and outside the recommended first revision. |

### Fictional sample provenance

`data/demo.json` was authored during MVP implementation (`bd40645`), then adjusted during the UI repair (`687582a`). All DEMO identifiers, addresses, dates, agency labels, and statuses are invented. The fixture deliberately covers an unrelated address, a duplicate status, and missing fields. In the current sample, DEMO-102 is at 200 Sample Ave; three other candidates are at 100 Sample Ave. A fifth report is on Fictional Rd. Do not describe these as actual neighborhood incidents or findings.

## 4. Code map and reuse

| File | Responsibility / continuation note |
|---|---|
| `server.mjs` | Node HTTP server on loopback; explicit static-route map; GET-only `/api/requests` and `/api/demo`. Fixed upstream source, no arbitrary URL/SQL proxy. A new module or endpoint must be explicitly served. |
| `lib/block-ops.mjs` | Query/window, source normalization, street suggestions, source URLs, draft review/reset rules, brief builders. Reuse source preservation and export behavior. Avoid forcing crime records into the 311-specific schema/link helper. |
| `public/app.mjs`, `public/map.mjs`, `public/storage.mjs`, `lib/campaign.mjs` | Native browser state, source loading, scope controls, explore list, campaign panel and brief; `map.mjs` wraps vendored Leaflet; `storage.mjs` is the localStorage wrapper; `campaign.mjs` is the pure campaign model, brief builder and store validator. A moved area or a new source clears the exclusions; a failed refresh preserves everything; a successful refresh only updates saved evidence status. |
| `public/index.html`, `public/styles.css` | Current worktable and print styling. Reuse accessible controls and useful identity; the layout may change for the map/campaign workflow. |
| `test/data.test.mjs` | Source filters, normalization, duplicate rejection, source-link fallbacks, date ordering and failure. |
| `test/workflow.test.mjs` | Changed output, excluded evidence, context clearing, review/required fields, literal wording and unknowns. |
| `test/server.test.mjs` | Explicit assets, fixed proxy, source failure, GET-only baseline and startup. Update expectations deliberately if adding new routes. |
| `scripts/prove-data.mjs`, `scripts/prove-geo.mjs`, `scripts/record-snapshot.mjs`, `scripts/browser-check.mjs` | 311 proof; geometry/boundary/crime proof; saves the recorded snapshot; real-Chrome check of the whole flow at 1920, 1280, 1440 and 390 px. |
| `docs/ui-review/` | Actual baseline screenshots/browser evidence. Documents a repair, not user approval of the final design. |
| `previews/`, `research/track-notes/` | Historical concepts/research. Read only when needed; do not build another finalist. |

Do not rewrite the stack solely because the user called the current app a simple HTML website. The criticism concerns usefulness, ambition, and presentation. A map library is a justified new dependency; a full framework migration needs a concrete implementation benefit.

Current CSP allows only same-origin scripts/styles/connects and self/data images. Map tiles, workers, fonts, or provider APIs may require narrow CSP changes. Document required origins, retain attribution, and verify the map provider's actual usage terms. No map provider or library has been installed.

### Preserve these audited behaviors

1. Missing/null/blank object IDs cannot become object ID zero in an official link. `sourceRecordUrl` falls back to an escaped request ID; fictional records have no official record link.
2. Duplicate normalized identities are rejected instead of hiding multiple rows behind one checkbox.
3. Successful context changes clear context-specific observations; failed refresh preserves reviewed work. Editing is locked during an in-flight source refresh.
4. Removing evidence invalidates review and removes it from the preview, appendix, and downloaded output.
5. Original selected addresses and direct source links survive export; unknown date/status/current conditions remain unknown.
6. Source strings and user wording render as text, not executable HTML. Keep new imports and model outputs untrusted.

## 5. Scope proposal and differentiation

**Working promise:** help a block association investigate a place, agree on a specific improvement, and sustain an evidence-backed campaign.

**Primary user:** a block captain or neighborhood group, initially one local demo operator. **Primary unit:** a saved campaign, not an incident-feed item. **Useful finish:** a reviewed request, owned tasks, dated follow-up, and evidence of what the group subsequently checked. The brief supports that workflow.

The user wants memorable identity and meaningful audience participation (“hella aura” / “hella LARP”), a familiar problem that is easy to explain, and actual technical substance. A new color scheme, fake radar animation, or AI label does not supply that substance.

### Proposed minimum vertical slice

1. Select a bounded area on a real map. Load relevant 311 records; show dates, source freshness, and original details. Add optional crime context only after the service/campaign loop works.
2. Inspect and select relevant evidence. Construct a chronology and preserve disagreements and unknowns. Location proximity only suggests a relationship.
3. Create a named improvement campaign with a concrete objective. Add a dated group observation; prepare a specific request using the selected evidence.
4. Assign a task owner and follow-up date. Save locally, reload, and resume the same campaign with its reviewed evidence and wording intact.
5. Add a follow-up observation or agency response. Keep campaign progress, official ticket status, and resident verification distinct. Regenerate the current brief.

**Illustrative scenario, not a verified case or fixed requirement:** “Improve the poorly lit walk to our community center.” Streetlight availability, the selected location, and the relevance of that scenario need proof in R1. The current 311 query covers dumping, not streetlights. Do not fabricate streetlight records to bridge that gap. If necessary, use a coherent dumping campaign first; document the change and why.

### Citizen and Flock: what was learned

- Citizen already documents incident maps, alerts, live video, historical incidents, and custom alert radii. Enterprise adds location monitoring, historical filtering, incident prioritization, and AI-assisted organizational alerts. Therefore maps + AI + teamwork is not an established differentiator. Sources: [Citizen](https://global.citizen.com/), [Premium](https://support.citizen.com/hc/en-us/articles/30408014010007-What-is-Citizen-Premium), [Enterprise changelog](https://business.citizen.com/changelog).
- Our proposed angle is resident-owned improvement campaigns and follow-through. This is a product hypothesis, not proof Citizen lacks every overlapping feature or that the category is new. The paid app was not independently exercised.
- Flock's LPR products collect vehicle evidence for authorized searches. Flock data is not an open public feed we can assume access to. Sources: [LPR product](https://www.flocksafety.com/products/license-plate-readers), [data access](https://www.flocksafety.com/trust/data-privacy).
- Crime data is optional context. Do not imply a service problem caused a nearby crime, infer an exact crime address from an approximate block point, create a neighborhood danger score, or invent a resolved incident.

### Cuts and builder decisions

Keep one ward, one service category, one campaign workflow. Default to one operator and local persistence. Choose one persistence mechanism and document its limitations; a reload must work. Multi-device sharing is a separate scope change, not implied by “group.” Do not add accounts, chat, live video, plate/face searches, automated dispatch, automatic agency submissions, predictive crime, continuous tracking, or general agent infrastructure.

AI summary/request drafting and photo observations are possible additions, not mandatory dependencies for the first end-to-end slice. If used, name the provider and actual cost/access prerequisites, keep keys server-side, validate source references, retain user edits, and provide a clear failure/manual path. Do not silently present a fixed template or recorded result as a live model run.

## 6. Verified sources and exact limits

### DC 311: implemented

- Layer: `https://maps2.dcgis.dc.gov/dcgis/rest/services/DCGIS_DATA/ServiceRequests/FeatureServer/21`.
- Current filter uses `WARD='Ward 8'`, not `'8'`. As of R1 the query sets `returnGeometry=true&outSR=4326`; each record has `geo` (`{lon,lat}`) and `geoStatus`, and the snapshot has geometry counts. Source-link queries still use `returnGeometry=false`.
- October 21 app/source proof returned 389 unique records in `2026-07-24` inclusive to `2026-10-22` exclusive. These are dated results; not current guaranteed counts.
- A transfer-limited response is rejected. Pagination is not implemented. Preserve that error until a complete bounded retrieval is verified.

### MPD crime: separately demonstrated, not integrated

- Rolling 30-day layer: `https://maps2.dcgis.dc.gov/dcgis/rest/services/FEEDS/MPD/FeatureServer/39`.
- 2026 layer: `https://maps2.dcgis.dc.gov/dcgis/rest/services/FEEDS/MPD/FeatureServer/41`.
- Metadata exposes `REPORT_DAT`, `START_DATE`, `END_DATE`, `OFFENSE`, `BLOCK`, `WARD`, and point geometry; pagination/spatial queries are advertised. Verify the actual filtered query before implementing.
- A direct aggregate query during the October 21 conversation returned 2,112 records in layer 39 and latest `REPORT_DAT=1792537297000`, or `2026-10-20T23:01:37.000Z`. That query covered the full feed, not Ward 8. It did not prove a map, paged row retrieval, a refresh interval, or real-time reporting.
- Public crime locations are anonymized to street blocks. Some points have unusable coordinates. Preserve approximate granularity and omit/unmap invalid geometry without losing record counts. [Dataset documentation](https://catalog.data.gov/dataset/crime-incidents-in-2026), [Crime Cards](https://crimecards.dc.gov/).
- Record both report and occurrence dates when available; do not substitute one for the other. Show source retrieval time and coverage window. Label “reported incidents” and “latest published data,” not “happening now.”
- 311 and MPD have different field conventions. In particular, do not assume the 311 ward label is valid in the crime layer. Request geometry in a common coordinate system such as `outSR=4326`; verify longitude/latitude order and bounds. Never plot raw state-plane coordinates as longitude/latitude.

The saved [feasibility evidence](../../research/evidence/campaign-feasibility-2026-10-21.json) contains aggregate observations and source links, not raw incident records or camera data. No refresh cadence or guaranteed API service level was established.

## 7. Revision batches R1–R5

Use these IDs to avoid confusing the revision with historical delivery phases 0–6. A request for “next N phases” starts from the next unfinished R phase in [PHASE-STATUS.md](../PHASE-STATUS.md). Old Phase 1–3 completion remains valid only for the baseline. Do not redo it or mark the revision complete from old checks.

| Batch | Deliverable | Completion evidence |
|---|---|---|
| **R1 — Rebaseline and prove** | Choose one coherent campaign scenario; verify bounded geospatial 311 data and proposed crime context separately; settle map/persistence choices; show a disposable map/campaign layout for the user to assess; write the revised acceptance criteria/file plan. | Real records plot in the correct area; missing geometry/truncation are handled honestly; user can see what the intended product will look like. Mark the throwaway layout as such. Record unresolved product choices, actual provider prerequisites and cuts. |
| **R2 — Map and evidence** | Implement real map navigation, source layers/legend, date/category filters, freshness, source drawer, relevant evidence selection and chronology. | Changing area/filter changes actual queries/results; source dates and approximate crime locations survive; outage preserves reviewed work; keyboard/list alternative works; no decorative fake live events. |
| **R3 — Saved campaign** | Named objective, selected evidence, resident observation, reviewed request, task owner and due date, durable local save/reload, follow-up observation, distinct progress/source/verification states, current export. | Complete create → save → reload → follow up → inspect changed campaign/output. Removed evidence disappears everywhere. Invalid saved data fails without destroying the last valid campaign. The new workflow does useful work beyond the old form. |
| **R4 — Reliability and presentation interaction** | Recoverable source/tile failures, stable bounded retrieval, refresh/review rules, persistence edge cases, accessible map/list controls, desktop projection and mobile layout. | Meaningful automated regressions plus actual browser walkthrough; one missing/ambiguous case and external failure; stage-sized evidence and tasks readable. Capture actual screens, not concept mockups. |
| **R5 — Freeze and release package** | Rehearsed judge interaction, clearly labeled backup, actual screenshots, concise technical explanation, current run/setup instructions and submission materials. | Fresh startup and full rehearsal work; event rules/clock checked; incomplete features removed from claims; external actions accurately listed. Publication still requires the user's instruction. |

The batch order is a recommendation, not an elapsed-time estimate. If the user delegates implementation for a named batch, carry authorized work through that boundary without repeatedly seeking approval for routine choices. Material product questions should be resolved in R1, rather than guessed during a rewrite. Do not interpret this documentation-only request as authorization to start R2.

### First implementation checks to add when appropriate

- Distinct source namespaces prevent a 311 and MPD ID collision.
- Valid geographic filtering, common CRS, invalid/zero geometry, and conservative proximity suggestions.
- Complete bounded retrieval or explicit partial/unavailable state; no silently incomplete counts.
- Saved campaign schema/version, refresh/reload preservation, invalid storage, and explicit evidence re-review after a source change.
- Task owner/date and resident follow-up update the correct campaign, not another selected area.
- Tile/API/model failure preserves the saved case; fake sample data is never substituted silently.

Retain the 23 existing checks where behavior still applies. Update tests that intentionally change, such as GET-only routing or the old memory-only contract, with a documented reason. Do not write tests that merely restate CSS or fixed fixture text.

## 8. Proposed presentation and visual bar

The map should make place and evidence legible immediately. A selected campaign opens a substantial evidence/history panel and a clear action/progress board. Show source freshness, what the group chose, who owns the next task, and when it will be checked. Plum/sunflower identity can survive; preserve no particular layout just because it is implemented.

The example stage story is a neighborhood improvement campaign. The judge chooses relevant evidence or an assigned next step; the operating view changes; save/reload and a follow-up demonstrate continuity. A fictional follow-up may be demonstrated if clearly disclosed. Never suggest the city actually responded or a light was fixed during the demonstration.

Avoid making “exclude a checkbox and download a PDF” the main reveal again. Optional AI needs an inspectable result and sources; optional crime context needs a clear connection to the user's task. If those features do not improve the campaign, cut them before sacrificing a complete workflow.

## 9. Current checks and remaining uncertainty

At the end of R3, `node --test` passes **66/66** (the 23 baseline checks plus geometry, scope, campaign and storage tests), and `node scripts/browser-check.mjs` passes 70/70 in real Chrome at 1440 and 390 px. See [PHASE-STATUS.md](../PHASE-STATUS.md) for dated evidence.

Prior UI repair evidence, linked from [TEST-PLAN.md](../TEST-PLAN.md), includes actual Markdown download, a sample A4 PDF, live loading of 389 records, HTTP 502 recovery, context clearing, keyboard tabs, and 1440/1024/768/390/320-pixel views. Those checks validate the current worktable only. They do not validate a map, campaign persistence, crime integration, AI, projection readability, community demand, or competitive uniqueness.

Original R1 questions (now resolved in the revision spec; kept for history): the first campaign scenario/category; actual geospatial 311 records for it; the exact local-save behavior; the visible judge action; and whether any model adds enough value to justify setup. Routine stack/library choices belong to the builder. Do not reopen the six-finalist research or claim community interviews happened.

## 10. Copy/paste prompts

### Read-only orientation in Claude

```text
Read CLAUDE.md, AGENTS.md, docs/HANDOFF.md, and docs/PHASE-STATUS.md.
Inspect the current Git state and app files listed in the handoff.
Give me a brief account of what exists, the proposed campaign revision,
and the exact R1 decisions/proofs still needed. Do not edit product code,
install dependencies, or re-run the whole research archive.
```

### Start R1 when ready

```text
Use docs/HANDOFF.md and the revision ledger. Execute R1 only.
Keep Block Ops / Track 3 and reuse the current working foundation.
Prove the real data/map path, make the campaign experience reviewable,
and write the concrete revised specification and file-level plan.
Treat campaign examples as proposals; distinguish proven data from fixtures.
Record actual checks, cuts, unresolved decisions, and the next batch.
Stop at R1. Do not push, deploy, submit, or contact anyone.
```

### Continue a later batch

```text
Read CLAUDE.md and the current revision ledger, then execute the next
N unfinished R phases from docs/HANDOFF.md (replace N with a number).
Honor the latest user choices and phase boundary. Preserve unrelated edits.
Update the handoff/ledger and actual verification after the batch.
Do not claim unbuilt features or repeat completed research by default.
Do not push, deploy, submit, or contact anyone unless I explicitly request it.
```

End every batch with: changed files, run command, actual check results, unresolved limitations, next R phase, and local commit if created. Keep the handoff updated so Claude and Luna can exchange work without reconstructing this conversation.
