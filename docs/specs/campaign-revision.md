# Block Ops campaign revision — R1 decisions, R2–R3 specification

Written at the end of R1, October 21, 2026. Supersedes the baseline form flow as the target experience; the baseline contract in [block-ops.md](block-ops.md) still describes what runs at `/`. The disposable R1 look-and-feel page was deleted when R2 started; R2 is built (section 7).

## 1. Decisions made in R1 (and the evidence behind them)

| Decision | Choice | Why / evidence |
|---|---|---|
| Scenario | **Ward 8 illegal-dumping improvement campaign**, existing query (`WARD='Ward 8'`, description `LIKE '%Dump%'`, 90 days). | Default held. Recurrence is visible in the data: the densest 150 m area has 21 reports in 90 days, all closed, i.e. reports keep returning after closure. That is the campaign story. |
| Streetlights | **Exist; not used in R1.** 118 "Streetlight Repair Investigation" + 1 "DGS - External Lighting" records in Ward 8 over the same 90 days (aggregate count, 2026-10-21 17:59Z). Geometry for them was not fetched or plotted. | Reported, nothing fabricated. A lighting campaign needs a second category in the query and its own proof. Left as an unresolved choice (section 6). |
| Geometry | 311 query now sets `returnGeometry=true&outSR=4326`; `x` is longitude, `y` latitude. | Live: 390/390 records have a point; lon −77.0166…−76.9637, lat 38.8208…38.8803; 0 missing, 0 invalid; 388/390 fall inside the official Ward 8 polygon (layer `Administrative_Other_Boundaries_WebMercator/MapServer/53`, `WARD=8`). The 2 outside points (IDs `26-00601266`, `26-00615737`) are on or near the boundary; the source `WARD` label and the geocoded point disagree. Keep them, flag them. |
| Address precision | Public 311 addresses are mostly **block-level** (`100 - 199 BLOCK OF ATLANTIC STREET SE`) or intersections, so points are block/centerline locations. | Never present a point as the exact site. Wording: "reported near". |
| Grouping | The baseline same-street grouping is too coarse (one street name can span kilometres). **Proximity (150 m radius) replaces it as the primary selection**; it is a suggestion, not proof of one incident. | `recordsWithin` in `lib/block-ops.mjs`; prototype selects 21 records across P St / 19th St / Young St that street grouping would split. |
| Map | **Leaflet 1.9.4, vendored** in `public/vendor/leaflet/` (BSD-2, license kept at `LICENSE`, not served). Plain `circleMarker`s, so no marker images are needed. | sha256 of `leaflet.js` `db49d009…641a`, of `leaflet.css` `a7837102…d04c6`. |
| Tiles | **DC GIS `DC_Basemap_LightGray_WebMercator`** tile cache (`…/MapServer/tile/{z}/{y}/{x}`, 256 px, standard web-mercator XYZ, `Cache-Control: max-age=86400`). OSM tiles **rejected**. | OSM's tile policy forbids a restrictive `Referrer-Policy` and requires a valid Referer; this app sets `no-referrer` deliberately and a `127.0.0.1` Referer is a poor identity. DC tiles are same host as the data, light-gray suits overlays, and need no new origin beyond `img-src`. DC GIS terms (checked in R2): the basemap service description points to [Terms and Conditions of Use for District Data](https://dc.gov/page/terms-and-conditions-use-district-data), which dedicates *data* to the public domain (CC0 1.0), allows copying and commercial use without permission, makes attribution optional but requested, and disclaims warranties. It defines "data" as non-copyrightable facts and map coordinates and does not mention rendered tile caches specifically; no separate tile terms or rate limit were found. Treat reuse as permitted for this demo, keep the attribution, and re-check before any wider release. Attribution is shown on the map ("Basemap: DC GIS · Reports: DC 311"). |
| CSP | One change: `img-src 'self' data: https://maps2.dcgis.dc.gov`. `script-src`, `style-src`, `connect-src` unchanged (Leaflet is local; tiles are images; data goes through our proxy). | `test/server.test.mjs` asserts this. No CSP violations seen in headless Chrome on `/prototype`. |
| Persistence (for R3) | **`localStorage`, one operator, schema-versioned.** Details in section 4. | No server writes; keeps `GET`-only server. Limits: per browser profile and per origin (`127.0.0.1:8000` and `localhost:8000` are different stores), lost if site data is cleared. |
| AI | None in R1 or R2–R3. | Per brief. |
| Crime | **Proven separately, not integrated.** | See section 3. |

## 2. Target product (what R2–R3 build)

A map-first workspace. Left: the Ward 8 map with 311 dots coloured by official status and a selectable 150 m area. Right: the campaign panel — objective, evidence chronology, three separate state tracks (city ticket status / group progress / resident verification), owned tasks with due dates, and the brief. The judge picks an area or evidence and the whole panel (chronology, tallies, brief) changes. Save, reload, add a follow-up, and the campaign is intact.

State tracks are never merged: **city ticket status** is source data as published; **group progress** is what the group reviewed/decided; **resident verification** is dated observations by people. "Closed" in 311 never becomes "fixed".

## 3. Crime context proof (not integrated)

Run `node scripts/prove-geo.mjs` (aggregate output saved in `research/evidence/r1-geo-proof-2026-10-21.json`). MPD layer 39 (`FEEDS/MPD/FeatureServer/39`), filter `WARD='8'`, `outSR=4326`, `resultRecordCount=2000`:

- 184 records, `exceededTransferLimit` not set, so the 30-day feed for Ward 8 fits in one response (2,112 records for all wards earlier the same day).
- 184/184 have a point; 1 of 184 falls outside the Ward 8 polygon (block-anonymized location).
- `REPORT_DAT` range 2026-09-21T14:20Z to 2026-10-21T02:47Z. `REPORT_DAT` is the report date, not occurrence (`START_DATE`/`END_DATE`); keep both. No claim of real-time or refresh cadence.
- The MPD `WARD` value is `'8'`, the 311 value is `'Ward 8'`.
- Offense mix includes theft, vehicle theft, assault, robbery, burglary, sex abuse and homicide. Showing these on a dumping map is sensitive; if added, aggregate by block, show counts with the approximate-location caveat, no per-incident pins, no danger score, no causal language.

Recommendation: **defer to R4 as optional**, only if R3 is complete. It does not help the dumping loop.

## 4. Data and persistence contract

Source record (already implemented): `{ key, id, objectId, category, date, status, agency, ward, address, geo: {lon,lat} | null, geoStatus: 'ok'|'missing'|'invalid', attributes }`. Snapshot: `{ mode, sourceUrl, retrievedAt, window, geometry: {total,mapped,missing,invalid}, records }`. Source namespace is part of the key (`request:` / `object:`); any future MPD key is `mpd:`.

Saved store (R3), key `blockops.campaigns.v1`:

```
{ version: 1, savedAt, campaigns: [{
    id, name, objective, createdAt, updatedAt,
    area: { center: {lat, lon}, radiusM },
    evidence: [{ key, id, address, date, status, agency, geo, retrievedAt, reviewed }],   // snapshot of source fields
    observations: [{ id, kind: 'resident'|'followup'|'agency', date, text }],
    request: { text, confirmedAt },
    tasks: [{ id, text, owner, due, done }]
}] }
```

Rules: evidence is stored as a field snapshot so a reload works offline and shows what the group actually reviewed; a refresh that changes an evidence record's status marks it "changed since review" and clears `request.confirmedAt`. Writes go to a temp key, are read back and validated, then promoted; the previous valid value is kept at `blockops.campaigns.v1.backup`. On load, invalid JSON/schema/version shows an error and leaves both keys untouched (no overwrite, no silent reset). Quota/storage-disabled errors surface in the UI and the in-memory campaign stays editable and exportable.

## 5. Acceptance criteria and file-level plan

### R2 — Map and evidence

Acceptance:

1. `/` is the map workspace; clicking the map re-selects records from the already loaded snapshot (no new query); changing the date window or status filter changes the displayed and selected records, tallies, and brief inputs.
2. Every plotted record is a real 311 record; `geometry` counts are shown (mapped / missing / invalid); unmapped records stay reachable from a list and are never dropped from counts. Records outside the Ward 8 polygon are flagged (needs the polygon, fetched once server-side; see plan).
3. A record list/chronology with keyboard-operable select/exclude works with no map interaction at all (map is not the only input). Selected-area changes are announced.
4. Source drawer for a record shows original fields, unknowns as unknown, and the source link (existing `sourceRecordUrl` rules).
5. Freshness line (retrieved time, window, counts) always visible. Source or tile failure: reviewed selection and notes stay; error says so; no sample data is substituted silently. Demo mode stays fictional and labeled, with no official links.
6. Evidence exclusion still invalidates review and removes the record from preview/export (audited behavior 4). All six HANDOFF section 4 behaviors still pass.
7. No external origin beyond `maps2.dcgis.dc.gov` images; `/prototype` removed.

Files: `public/index.html`, `public/styles.css`, `public/app.mjs` (rework into map workspace; or split `public/map.mjs`), `lib/block-ops.mjs` (date/status filters, polygon flag, area helpers), `server.mjs` (explicit routes; fixed `/api/ward8` boundary route, GET only), `test/geo.test.mjs` (proximity, polygon-membership, filters), updates to `test/server.test.mjs` and `test/workflow.test.mjs`. Delete `public/prototype.*`.

### R3 — Saved campaign

Acceptance:

1. Create → name/objective → select evidence → dated resident observation → reviewed request → task owner and due date → save → full page reload → same campaign, evidence review, wording intact.
2. Add a follow-up observation and a source refresh; the changed campaign and current brief reflect both; progress/source/verification stay distinct.
3. Removing evidence removes it from panel, brief, appendix, saved store and download.
4. Corrupt/unknown-version storage, quota failure and disabled storage: error shown, last valid campaign untouched, work continues in memory.
5. Task owner/date and follow-up apply to the open campaign, not the currently highlighted map area.
6. Export (Markdown + print) keeps IDs, dates, statuses, addresses, unknowns, links; includes follow-up history.

Files: `lib/campaign.mjs` (schema, validate, migrate, evidence diff, brief inputs — pure, no DOM), `public/storage.mjs` (thin `localStorage` wrapper, injectable for tests), `public/app.mjs` and `public/index.html` (campaign panel), `lib/block-ops.mjs` (brief builders take a campaign), tests `test/campaign.test.mjs`, `test/storage.test.mjs` (fake storage, corrupt/quota cases), `test/workflow.test.mjs` updates.

## 6. Cuts and unresolved choices

Cut in R1: accounts, sync, AI, photos, crime integration, notifications, pagination (still rejected on transfer limit; 390 of 1,000 now).

Unresolved for the user: (1) dumping vs streetlight as the stage story (both exist in Ward 8; streetlights need their own query and proof); (2) whether the 150 m radius default is right and whether to let users resize it; (3) whether the two source-label/point disagreements should be shown to users or only counted; (4) DC GIS tile terms (not read); (5) whether crime appears at all; (6) the visible judge action in the demo (proposed: judge picks an area, the panel and brief change; then reload shows it saved); (7) the mock campaign objective copy. The prototype's objective, tasks, and group/resident tracks are placeholders, not decisions.

## 7. R2 as built (October 21, 2026)

User decisions applied: dumping stays the stage story; radius presets 100 / 150 / 250 m (default 150); outside-boundary points are flagged on the record, dashed on the map, and counted in the freshness line; crime is out; campaign title is the block name; objective text is a placeholder.

- **Scope model** (`lib/block-ops.mjs`): `updateScope` is the single place scope changes. Moving the area clears review confirmation and the site observation (context change). Changing radius or a filter invalidates review and re-selects every candidate, but keeps the observation. A scope change discards manual exclusions and re-derives the selection from the candidates.
- **Filters:** date (full 90-day window / last 60 / last 30 days, in America/New_York days) and status (Open / Closed / Duplicate-canceled-unknown). A record with no usable date is hidden by a date-limited view, never guessed into it. Filtered-out records are dimmed on the map and the status line reports how many in the scope the filters hide.
- **Area selection:** click the map or a marker, or use the "Jump to a busy spot" select (non-overlapping dense spots at the current radius). On load the busiest spot is selected. Reports with no usable point are never in a map area; they are listed in a separate disclosure with their own checkboxes and stay in every count.
- **Block names:** `blockName()` gives "1900 block of Naylor Rd SE" from block ranges, house numbers, or intersections ("Intersection of 25th St SE and Minnesota Ave SE"); the area title uses the nearest report's block, never one house address.
- **Ward boundary:** `GET /api/ward8` (fixed query, GET only, validated single polygon) is fetched by the client in parallel; `applyWardBoundary` flags records. If it fails the freshness line says the boundary check is unavailable and no flags are shown.
- **Brief:** adds a selection-scope line, a per-record location note for outside-boundary points, and an approximate-location caveat. Planning fields and tasks are unchanged from the baseline (R3 replaces them).
- **Demo / practice case:** fictional records, no coordinates, no map points, no official links; filters work, area controls are disabled. It is only loaded on request. The page loads live data and shows an error, not sample data, when the source is down.
- **Intentionally left for R3 or later:** persistence (state is memory only), task owners/dates, follow-ups, resizable radius beyond the presets, crime.

## 8. R3 as built (October 21, 2026)

User decisions applied: several saved campaigns in a simple list with one open at a time; "New campaign here" creates a campaign from the current area and selection with the objective prefilled ("Stop repeat dumping on the 1900 block of Naylor Rd SE") and editable; tasks have text, owner, due date and done; follow-up observations are dated and typed (resident / follow-up / agency response) and never change the city status; after a reload the campaign reopens intact, a follow-up and a done task change the brief, and any invented entry carries a "fictional" label.

**Bug fixed first (failing tests written before the fix):** `updateScope` used to re-select every candidate on a radius or filter change, so an excluded report silently returned. The draft now remembers `excludedIds`; they survive radius, date and status changes (even while a filter hides the report) and are cleared only when the area centre moves or the source changes. Reports the user added from the unplaced list are kept while they still match the filters.

**Files:** `lib/campaign.mjs` (pure model: create, objective, request, evidence removal, review, observations, tasks, reconcile, export rules, brief content and Markdown, store validation), `public/storage.mjs` (localStorage wrapper), `public/app.mjs`, `public/index.html`, `public/styles.css`, `server.mjs` (`/storage.mjs`, `/lib/campaign.mjs`), tests `test/campaign.test.mjs`, `test/storage.test.mjs`, and the driver `scripts/browser-check.mjs`.

**Differences from the section 4 sketch:**

- Evidence items store the source fields plus `objectId`, `reviewedStatus`, `previousStatus`, `changedSinceReview` and `inLatestSnapshot` instead of `reviewed`/`retrievedAt`. The campaign also stores `source` (mode, layer, retrieved time, window), the area, the filters, and the name.
- The saved file may carry a `savedAt` field; the validator ignores unknown extras.
- A second convenience key, `blockops.lastOpen`, remembers which campaign was open so a reload reopens it. It is optional and losing it only means returning to the list.
- `request.confirmedAt` is "the group reviewed the evidence and the request". Editing the request, removing a report, or a refresh that changes a reviewed report's status withdraws it. Adding observations or tasks does not.
- Reconcile only applies to live campaigns against live snapshots. A report that has left the rolling 90-day window keeps its last seen status and is labeled "not in the latest snapshot"; absence alone does not withdraw the review.

**Storage rules (as tested):** writes go to `blockops.campaigns.v1.tmp`, are read back and compared, the previous valid value is copied to `.backup`, then the main key is written. A full or disabled store, or a failed read-back, shows an error and leaves the last valid save untouched. Corrupt JSON, an unknown version or a malformed campaign at load shows an error, turns saving off for the session, and never overwrites the stored value; the app keeps working in memory and can still export. There is no "reset" button on purpose: clearing site data or restoring the value by hand is the recovery path.

**Cuts and limits:** one operator on one browser profile (a different origin such as `localhost` versus `127.0.0.1`, a private window, or cleared site data shows a different store); no sync or sharing; no editing of existing observations or evidence snapshots beyond remove; the radius of a saved campaign is fixed at creation; a practice (fictional) campaign can be created and is labeled everywhere; no photos, AI, or crime layer.

## 9. Need check: does DC already publish dumping hotspots? (R4, October 21, 2026)

Method: five web searches plus fetching the DC Open Data hub records and the DumpBusters page. DPW's own pages (`dpw.dc.gov/...`) returned HTTP 403 to my fetch, and the DPW Cards app is script-rendered, so those were read through search summaries and the hub's item description, not in a browser. Absence of evidence is not proof; this is a desk check, not a conversation with DPW.

What exists:

- **DPW Cards** ([dpwcards.dc.gov](https://dpwcards.dc.gov), hub record [opendata.dc.gov/content/9cfe53f4d4d84fde8a28ccdfdbbf3c7d](https://opendata.dc.gov/content/9cfe53f4d4d84fde8a28ccdfdbbf3c7d), last modified 2025-11-21). The hub description: users "explore and download data about the agency's top ten service requests. The app includes summary statistics by service request type, a date range search, a city heat map of requests and a SLA Report by service request." So DC publishes counts, a citywide density map, and response-time reporting.
- **"Illegal Dumping in Last 30 Days"** ([hub record](https://adoptablock.dc.gov/datasets/DCGIS::illegal-dumping-in-last-30-days/about); feature service [SR_30days_Open/MapServer/4](https://maps2.dcgis.dc.gov/dcgis/rest/services/DCGIS_APPS/SR_30days_Open/MapServer/4), modified 2025-04-28). A rolling 30-day map layer of the same 311 dumping requests.
- **DumpBusters** ([doee.dc.gov/service/dumpbusters](https://doee.dc.gov/service/dumpbusters)). An interagency DOEE, MPD and DPW program (water-quality focus) with a "three pronged intervention": cleanups, community outreach and signage, and enforcement. The page lists no map, hotspot list or repeat-location data; residents report through 311 or 311.dc.gov.
- **DPW enforcement.** The [Illegal Dumping Investigation page](https://dpw.dc.gov/service/illegal-dumping-investigation) (read via a search summary) says SWEEP inspectors patrol assigned areas daily and residents report by calling 311. A DPW post on X, seen only in a search result (not fetched), says: ["Illegal dumping, especially in repeat locations, is taken seriously by DPW. SWEEP investigators are actively working to identify violators..."](https://x.com/DCDPW/status/2029255837043015727); the same result describes Office of Clean City work removing material from a recurring Ward 8 hotspot. Treat both as secondhand.
- **Cameras.** A trade article about DC using portable motion-sensor cameras against dumpers dates from the early 2000s ([securityinfowatch](https://www.securityinfowatch.com/video-surveillance/news/10592395/cctv-cameras-monitor-illegal-dumping-in-dc)); I found no current DC camera program.

What I did not find: any DC publication that shows, per block or area, whether a closed dumping ticket is followed by another report nearby, any public hotspot ranking, or any tool that helps residents turn such a pattern into a request for a lasting fix (camera, signage, scheduled cleanup).

**How the pitch changes.** Do not say "nobody tracks it": DPW publicly says repeat locations matter, and it may well track them internally; we do not know. Say instead: "The city publishes every ticket and a citywide heat map of counts. It does not show residents that a closed spot keeps coming back, and nothing helps a neighborhood group ask for a lasting fix." The claim is "residents can't see or act on it", not "the city is ignoring it". If a judge from DC government says DPW already has an internal repeat-location list, the answer is that this app is the resident-facing side of it, and we would want to compare.

## 10. R4 as built (October 21, 2026)

**The re-report rule** (`lib/recurrence.mjs`, tested in `test/recurrence.test.mjs`): a report with status exactly "Closed", a usable date and a map point is *re-reported* if another report with a point and a date is dated strictly after it, at most 30 days later and at most 150 m away. Any status containing "Duplicate" or "Cancel" is excluded on both sides, and so are reports missing a date or point. Wording in the app is always "another report nearby within 30 days"; the caveat says this does not mean the same pile, a failed cleanup, or anyone's fault, and that locations are block-level.

**Ward-wide result on the real data** (live snapshot retrieved 2026-10-21 19:17Z; the saved recording retrieved 19:19Z gives identical numbers):

| Measure | Value |
|---|---|
| Closed reports (exact "Closed", with date and point) | 350 |
| Followed by another report within 30 days and 150 m | **210, 60%** |
| Only closures at least 30 days old (a full window to be followed) | 151 of 235, 64% |
| Countable located reports (duplicates and canceled left out) | 374 of 390 |
| Spots with 5+ reports (greedy 150 m clusters, densest first) | **26 spots holding 210 of 374 reports, 56%** |
| Worst spot | 21 reports, 21 closed, 20 followed by another report (about the 1900 block of Naylor Rd SE / 1800 block of P St SE) |

Your earlier rough check (duplicates included) gave 62% (217/350), 28 spots, 57%; the stricter rule gives 60%, 26 and 56%. **Sensitivity matters and should be said out loud:** with the same data, a 100 m radius gives 44% (155/350), 250 m gives 79% (278/350), and a 14-day window at 150 m gives 45% (158/350). The headline number is a property of the stated rule, not a law of nature. The window also starts 90 days ago, so reports before it are invisible, and the busiest blocks can include large buildings with many units.

**What the screens show:** a purple stat line under the header ("Closed isn't fixed. 210 of 350 closed reports (60%) had another report nearby within 30 days ..."); busy-spot shading on the map (spots with 5+ reports, shaded by how many closed reports were followed by another, four tiers, legend explains); the "busy spot" list ranked worst first with re-report counts (the keyboard alternative); an area headline in Explore and a campaign headline ("21 reports since Jul 27 · 21 closed · 20 re-reported within 30 days of a closure · median gap 3.5 days") with the caveat beneath it.

**Escalation brief:** each campaign has a free-text recipient and a lasting-fix choice (enforcement camera, signage, bulk pickup outreach, lighting, scheduled cleanup + check-in, other with text). No names or contacts are suggested. The brief order is: recurrence evidence, the city ticket list, the ask (to, requested fix, request wording, "Nothing has been sent"), tasks, group progress, follow-up history, appendix. Changing the ask withdraws the review.

**Recorded snapshot:** `node scripts/record-snapshot.mjs` writes `data/recorded-snapshot.json` (real live records plus the ward polygon, with their retrieval time). `GET /api/recorded` serves it; a third source button "Recorded DC 311 snapshot (Oct 21)" loads it through the same normalization and boundary check as live data. It is always labeled RECORDED, never live; official record links still work; campaigns made from it are marked recorded; it is never reconciled as live data. The fictional practice case is separate. Without internet the basemap tiles do not load, but the dots, the shading and the whole panel do.

**Other changes:** the fictional-practice-entry box is checked by default for every campaign (unchecking is deliberate); only the Explore panel is locked while a refresh runs, so an open campaign stays editable (a slow API no longer freezes it); keyboard focus returns to the form or heading after adding or removing items; stage sizes (a 1600 px+ scale-up and a short-screen layout for 1280x720).
