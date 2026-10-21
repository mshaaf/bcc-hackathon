# Direction review — October 21, 2026

## Current reading note

Historical review before the user's explicit community-first instruction. No longer a selection/implementation gate: the current [scope](specs/community-missions.md) and [Sonnet handoff](SONNET-HANDOFF.md) govern continuation. The original discussion below is preserved.

Corrections found afterwards: the current recurrence code compares report creation dates, not verified closure dates; do not present these rates as events after closure. The [current DPW Helping Hand page](https://dpw.dc.gov/helpinghand) states March 1–November 1 and a minimum two-week application lead time, rather than the October 1/off-season claim below. Public 311 maps expose date/status history, so “history disappears at closure” is too broad. These are qualifications to the review's conclusions, not evidence of community adoption.

Record of a review-and-discussion session after R3, before rewriting R4. **No new direction has been chosen yet.** This file captures findings and options; [DECISIONS.md](DECISIONS.md) and [PHASE-STATUS.md](PHASE-STATUS.md) remain the record of what was decided and built.

At the time of writing, the original dumping-focused R4 prompt had been sent to a Sonnet session and was running. Whether the later "all categories" addendum was also sent is not recorded here.

## 1. State of the build (R1–R3 review)

- R1–R3 are complete, independently re-checked in this session: `node --test` 66/66; live load of 390 Ward 8 dumping records, all mapped; Chrome checks at 1440 / 390 / 320 px with no console or CSP errors and no horizontal overflow; create campaign → add task → reload → campaign intact; task text containing an HTML tag rendered as text.
- The R2 bug (an excluded report re-selected after a radius/filter change) was fixed in R3 and re-verified with a probe script.
- Open R3 items: the "fictional practice entry" box defaults off for live campaigns (demo-honesty risk); objective/request save on every keystroke, so the backup copy is only the previous keystroke; two tabs on one browser overwrite each other.
- **Git/GitHub:** R1 was pushed at 14:03 and R2–R3 plus a docs commit at 14:57 on October 21. `github.com/mshaaf/bcc-hackathon` is **public** and has **no license**. A scan of the pushed range found no keys or tokens. The R1 ledger entry still says "No push", which is now inaccurate.

## 2. Honest assessment against the published criteria

Criteria from the event research: track fit, creativity, functionality/reliability and clean code, presentation. No weights were found.

| Criterion | Assessment |
|---|---|
| Functionality / reliability / clean code | Strong: real public data, 66 tests, honest failure states, saved campaigns survive reload. |
| Track fit | Good if pitched as civic engagement in Ward 8; not yet said on screen or in a pitch. |
| Creativity | Medium: a map of 311 reports is not new (DC 311 mapping, SeeClickFix, Nextdoor). The new part — recurrence plus organized follow-through — is not yet visible in the app. |
| Presentation | Not built: no pitch, no hook, no rehearsal. Judge interaction exists but still feels like filling in forms. |

**Biggest product weakness found:** the app is a single-operator tool on one laptop (browser storage only). Nobody else can join a campaign, so the claim "increases civic engagement" is weak as built. Engagement needs a low-friction way for other people to join from their own phones.

The user also asked whether it is lame for the whole product to be about closed dumping reports. Agreed: dumping alone is too narrow a headline. It was only the first category wired up; the engine is category-agnostic.

## 3. Data findings (live public data, October 21)

All counts are dated observations, not guaranteed current values. Points are block-level approximations.

### Recurrence in Ward 8 dumping reports

Snapshot retrieved about 18:04Z; window 2026-07-24 inclusive to 2026-10-22 exclusive; 390 records, 350 with status exactly "Closed".

- **217 of 350 closed reports (62%)** had another dumping report dated after them, within 30 days and within 150 m. This rough rule counted any status as the later report, including duplicates, so it may count a second neighbor reporting the same pile. Safe wording: "another report nearby within 30 days" — never "the same pile", "a failed cleanup" or "city fault". The R4 prompt asks for a stricter rule that excludes duplicate and canceled statuses; use whatever number that rule produces.
- **28 spots with 5+ reports within 150 m** hold **222 of 390 reports (57%)**. The five busiest spots have 21, 16, 14, 11 and 11 reports. The busiest is the 1900 block of Naylor Rd SE: 21 reports since July 27, all closed.

### Ward 8 311 volume by category

Aggregate count query on the same 90-day window: **12,205 Ward 8 requests across 94 categories**; no transfer limit. Dumping (390) is about 3% of the total.

Largest categories: DC Government Information 2,626; Parking Enforcement 1,612; Bulk Collection 1,512; Trash Collection – Missed 435; Illegal Dumping 390; Abandoned Vehicle – On Public Property 380; Sanitation Enforcement 333.

Place-based, repeatable problems relevant to the ideas below: Illegal Dumping 390; Abandoned Vehicle – On Public Property 380; Sanitation Enforcement 333; DC Health Rodent & Vector Control 194; DOB – Vacant Private Property Inspection 170; Traffic Lights and Pedestrian Walk Signals 127; Streetlight Repair Investigation 118; Street Cleaning 112; Alley Cleaning 83; Pothole 81; Sidewalk Repair 57; Bus Stop Issues (count not captured).

Not a good fit: DC Government Information and parking enforcement are not block problems; Bulk Collection is a scheduled service and exceeds the 1,000-record single-query cap.

### Where 311 requests come from

From the DC 311 layer description: requests are received by the Office of Unified Communications through the Mayor's Call Center (311), web intake at 311.dc.gov, electronic and US mail, and other methods; the DC311 mobile app is another intake channel. They route to city agencies (DPW, DDOT, DC Health, DOB, and others). **They are not police reports**; crime goes through 911 / MPD, which is the Citizen app's territory.

The layer also exposes `SERVICECALLCOUNT`, `PRIORITY`, `DETAILS`, `INSPECTIONFLAG`, `INSPECTIONDATE` and `RESOLUTIONDATE`. Their meaning and usefulness were not verified.

### Other DC layers checked

DC GIS `DCGIS_DATA/Education_WebMercator/MapServer` exists, with layer 25 "Public and Charter Schools" (also 5 "Public Schools", 1 "Charter Schools"). Fields, Ward 8 coverage and geometry were not inspected. Metro stations, rec centers and libraries were **not** checked.

## 4. Existing tools (quick search, not exhaustive)

| Tool | What it does | Relevance |
|---|---|---|
| DC311 app (official) | Report about 80 problem types with photo and GPS, track your own request, email on closure. | Reporting is solved; we should not build another reporter. |
| SeeClickFix (used by many cities) | Report, comment and vote on issues, watch areas, reopen issues closed prematurely. | Closest competitor. A public thread is titled "hartford311 closing issues that are not fixed", so "closed isn't fixed" is a known frustration, and reopening already exists. |
| Nextdoor | Neighborhood discussion. | Talk, not structured follow-through. |
| Citizen | Crime and safety alerts, incident maps, video. | Different domain (police and crime). |
| Volunteer platforms (e.g. VolunteerMatch) | Volunteer listings. | Not researched; not tied to city data about where help is needed. |

**Differentiation hypothesis (unverified):** existing tools work one issue at a time (report → ticket → closed). We found none that turns the city's whole record for a place into an organized group effort with recurrence evidence, assigned jobs, sign-ons and an escalation letter. Say "we didn't find a tool that does this", not "nothing exists".

## 5. DC volunteer programs

- **DPW Helping Hand:** for community groups organizing Saturday neighborhood cleanups. DPW lends tool kits (five rakes and brooms, two shovels, 20 bags; $20 refundable deposit), sends trucks to collect the bagged trash, and a SWEEP inspector collects the kit. Apply by calling 311. **Seasonal: March 1 to October 1**, so it is off-season as of October 21. A Ward 8 neighborhood blog (Congress Heights on the Rise) has a guide to using it.
- **Adopt-a-Block:** administered by DPW (Office of the Clean City / Office of Waste Diversion), with ongoing support for groups that adopt a block.

## 6. Track 3 fit

Track text: "Black neighborhoods and small businesses are often under-resourced and overlooked by traditional economic and civic infrastructure. Build a solution that strengthens economic mobility, civic engagement, **or** resource access within Black communities."

- Only one of the three outcomes is required; small businesses are part of the framing, not a requirement.
- **Civic engagement:** residents use the city's own records to organize and act as a group.
- **Resource access:** the goal is lasting fixes and city services delivered to the neighborhood.
- **"Overlooked by civic infrastructure":** a place marked "closed" many times while the problem returns is a concrete, data-backed example of being overlooked.
- Ward 8 is predominantly Black. Take the exact census figure from an official source before using it; an in-chat remark that it is "DC's most heavily Black ward" was not verified (Ward 7 may be comparable or higher).
- Optional small-business angle: a corner-store owner on a commercial corridor facing the same problems out front could start a campaign. Do not claim economic damage figures without a source.
- Optional equity stat: compare Ward 8's re-report rate with a wealthier ward (e.g. Ward 3) using the same rule. A difference may reflect reporting behavior, so present it as a question worth asking, not proof of unequal treatment.

## 7. Directions discussed

| Option | Idea | Notes |
|---|---|---|
| A. Dumping only | Current R4: recurrence on screen, escalation brief, venue backup snapshot. | Technically ready, but the user considers it too narrow ("lame"). |
| B. Repeat problems, all categories | Fixed allowlist (dumping, rodents, abandoned vehicles, vacant property, streetlights) plus a merged view; one bounded query per category. | Addendum drafted. Still single-operator. |
| C. "Fix the Walk" | Pick a place people walk to (school first; Metro stations, bus stops, rec centers, libraries, grocery stores, clinics) and see every reported problem within walking distance and how often it came back; people sign on and the group sends one letter. | Clarified that **no new reporting is needed**: 311 already holds the reports. The user noted that "walk to school" is too narrow (high schoolers, college students, adults), so the anchor became any destination. |
| D. "Fix it or push for it" | Each problem becomes a mission. **Volunteer missions** for what residents can safely do (litter and small bagged dumping, weeds, leaves, storm drains): a scheduled cleanup with sign-up slots, a reminder to request a Helping Hand kit via 311 when in season, and later data showing whether it came back. **City missions** for what only the city can do (streetlights, signals, abandoned cars, vacant houses, rodents, potholes and sidewalks, large or hazardous dumping): neighbors sign a group escalation letter backed by recurrence evidence. | Latest recommendation. It answers "why should residents clean up for free?": fix what we can, and push the city with its own records for what we can't. It fits the "Block Ops / missions" identity. C's destination anchors could be layered on top. |

**Judge moment for C or D:** judges scan a QR code and join a cleanup or sign a letter on their phones; counts climb on the projector and the letter updates.

**Pitch lines drafted:**

- "Closed isn't fixed."
- "Those apps help one person report one problem. We help a whole neighborhood use the city's own records to organize and push for fixes that stick."
- "We fix what we can, and we use the city's own records to push for what only the city can fix."

## 8. Clarifications from the discussion

- **Resident interviews are not required** for a three-day hackathon. Answer "how do you know there's a need?" with the city's own data and the public sources above, and do not claim community validation that did not happen.
- **Plain-language purpose:** a resident sees that a problem on their block keeps coming back despite being marked fixed, gets neighbors organized with jobs and dates, sends one strong evidence-backed request to someone who can act, and keeps checking whether it stuck.
- **Why not just use 311 alone:** 311 handles one person and one ticket, the history disappears from view at closure, and nobody sees the others who complained. A group campaign shows the full history and a head count.
- **In a production version** people could report through the app, but reports should flow into DC311 (the official channel) rather than a separate silo. Block Ops sits on top of 311.

## 9. Cost and risk of C or D (versus the current build)

- **Reuse:** about 80% — map, 311 data path, recurrence logic, campaigns, brief/escalation output.
- **New:** a category allowlist (and destinations for C), a volunteer-vs-city sorting rule (D), cleanup missions with slots (D), and phone sign-on.
- **Sign-on changes the architecture:** the server must accept writes (it is GET-only today) and keep shared state server-side (today: browser storage only). Judges' phones must reach the app, which means a **public deployment** — an external action that needs the user's explicit approval. A same-WiFi fallback is unreliable (venue client isolation).
- **Privacy and safety:** collect the minimum (first name or initials and the campaign; nothing about children). Basic abuse limits on a public form. Volunteer tasks must exclude hazardous items, needles, private property and traffic work.
- **Schedule:** build window October 21–23, judging October 24. C or D is feasible but tight; R4 must be redirected before the dumping-focused work goes further.

## 10. Open decisions for the user

1. Direction: A, B, C, D, or D with C's destination anchors.
2. Whether to deploy publicly for phone sign-on, and where.
3. Which categories count as volunteer missions versus city missions.
4. Whether to stop the running R4 now and send a rewritten prompt.
5. Whether to add a license to the public repository.

## Sources

- DC 311 dataset description: [ServiceRequests FeatureServer/21](https://maps2.dcgis.dc.gov/dcgis/rest/services/DCGIS_DATA/ServiceRequests/FeatureServer/21)
- [DC311 mobile app (OUC)](https://ouc.dc.gov/page/dc311-mobile-app) · [DC 311 mapping (OCTO)](https://octo.dc.gov/service/dc-311-mapping)
- DC GIS education layers: [Education_WebMercator MapServer](https://maps2.dcgis.dc.gov/dcgis/rest/services/DCGIS_DATA/Education_WebMercator/MapServer)
- SeeClickFix: [Albany announcement](https://albanyny.gov/CivicAlerts.aspx?AID=628) · [Raleigh neighborhoods post](https://theraleighcommons.org/raleighdla/?p=96) · ["hartford311 closing issues that are not fixed"](https://www.seeclickfix.com/issues/157752-hartford311-closing-issues-that-are-not-fixed)
- DPW: [Helping Hand](https://dpw.dc.gov/helpinghand) · [Helping Hand neighborhood cleanup](https://dpw.dc.gov/page/dpw-helping-hand-neighborhood-cleanup) · [Adopt-a-Block / Office of the Clean City](https://dpw.dc.gov/node/1824711)
- [Organize a community cleanup with DC's Helping Hand program (Congress Heights on the Rise)](https://www.congressheightsontherise.com/blog/organize-a-community-cleanup-with-dcs-helping-hand-program)
- Citizen and Flock sources: see [HANDOFF.md](HANDOFF.md) section 5.
