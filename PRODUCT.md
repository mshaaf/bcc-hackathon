# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Confirmed product and form factor

Block Ops is a **web application for BCC Hackathon, Track 3 — Community Development**. A browser-based project is sufficient. The user explicitly wants an app experience and does not require a framework rewrite, native build or installable packaging.

The central loop is **join community → discuss → organize a mission → claim a job → post progress**. Community, mission details, tasks and map discovery are connected app screens with consistent navigation. Preserve the current Node/native browser/Leaflet/Supabase stack and improve the implementation in place. Read [current scope](docs/specs/community-missions.md) and [Sonnet assignment](docs/SONNET-HANDOFF.md).

## Users and operating context

A neighborhood organizer brings people together around a local concern. Neighbors discuss, join an effort, take responsibility and return with updates. In the hackathon demonstration, a judge participates as a clearly labeled guest, claims a real shared task and sees the organizer's screen update.

Two engineers have three build days, October 21–23, 2026. One labeled Ward 8 demonstration community and dumping as the first proven data category keep the project bounded. No verified residency, community partnership or neighborhood adoption is claimed.

## Current implementation

- R1–R4: Ward 8 map and source inspection, reviewed browser-local campaigns, local task/observation text, exports, filing-date statistics and a dated recorded fallback.
- B1: Supabase Auth/Postgres/Realtime running locally via CLI/Docker; shared membership, posts/replies, own-post editing and moderator hiding. Independent review passed 97 unit tests and 13 explicitly enabled backend tests at `f36867b`.
- B1 review repairs (draft preservation, membership event exposure, operation replay authorization, composer label and focus/announcement semantics): fixed in B2; see [review](docs/B1-REVIEW.md).
- B2 (complete locally): shared missions from a discussion or a deliberately reviewed local campaign, authenticated job claims with one winner, progress updates and dated follow-up observations, a current-state export, and the four B1 repairs. See [the ledger](docs/PHASE-STATUS.md).
- Hosted Supabase, a public URL and actual phone access on another network remain unproven. They belong to B3 readiness; B2 does not publish the app.

## The app experience to deliver

Community is the default working screen: conversation and active missions, with a clear action to organize a discussion into a mission. Mission detail contains a goal, public location, organizer, optional time, participants, available/claimed jobs and discussion/follow-up. Map and local campaigns remain reachable for finding evidence and deliberately publishing reviewed work.

Desktop and phone layouts support the same core actions. Keep navigation context, clear back paths and unsent drafts across view changes. Show useful loading, empty, sending, conflict and reconnect states. A task claim must visibly change responsibility in the other participant's session; a counter alone is insufficient.

## Capabilities and constraints

Retain reviewed source IDs, dates, statuses, links, excluded evidence, unknowns and recorded/fictional labels. Official ticket closure, a participant marking a job done and a dated observation of site conditions are different statements. Nearby reports do not prove the same pile or failed cleanup.

A mission may start from discussion without official records, or from a deliberately reviewed copy of a local campaign. Keep the local original. Imported typed owner names and done flags do not become authenticated commitments. An evidence-free shared plan says “No official 311 records attached”; existing local export guards remain.

Shared persistence and permissions are enforced in the backend. Concurrent claims have one winner; leaving cannot leave unfinished claims assigned to a non-member. Guest names are display labels. Clearing browser data or changing device loses that guest identity. Counts are accounts, not unique residents.

## Brand and accessibility

Keep the Block Ops name and established plum/sunflower identity. Use readable hierarchy, compact task controls, clear focus, explicit labels, keyboard completion and layouts that work at 320/390 pixels and desktop widths. Keep technical setup instructions in operator documentation rather than routine member flows.

## Cuts and evidence

Defer AI, crime layers, photos, DMs, followers, notifications, extra neighborhoods and source-category expansion. No automatic agency submission, fake activity, fabricated cleanup or measured social-impact claim. Source research, fixtures and dated checks are in `research/`, `data/` and [TEST-PLAN](docs/TEST-PLAN.md). The demonstration proves coordination; community demand and downstream outcomes remain to be measured.
