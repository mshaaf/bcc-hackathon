# Block Ops — 3-minute pitch (draft, finalized in R5)

**Scope changed; this R4 script is historical.** The user now wants a community that joins and carries out shared missions. The new demo should show a real phone join, discussion, task commitment and cross-device update; see [community scope](specs/community-missions.md). Shared features remain unbuilt. S1.1 corrected the wording: the statistic compares report **filing** dates, not closure dates, so it must never be described as happening after a closure. The measured numbers below are unchanged historical results; their interpretation is "another report filed nearby within 30 days of the earlier report being filed, among reports now marked Closed."

Pitch line: **"Closed isn't fixed."**

Status: R4 draft. Numbers below were true on the live data at 2026-10-21 19:17Z (and in the saved recording). **Say whatever the stat line on screen says at the time**; do not recite these from memory. Re-time the script out loud before use and change anything that does not sound like the presenter.

## What the audience should leave with

1. A real number from real public data: most dumping tickets in Ward 8 that are now marked Closed had another report filed within about a block and a month of their own filing.
2. That residents can see it, on a map, in seconds, for any block.
3. That the output is not "another ticket" but a short escalation to someone who can approve a lasting fix, with the group's tasks and follow-ups attached.

## Script (about 3:00)

**0:00 – The number (20 s).** Screen: the app already loaded on live data, purple stat line visible.

> "DC closes every dumping ticket. So how often does a ticket that is now closed have another report filed right next to it soon after? In Ward 8 over the last 90 days: **[210 of 350 — 60%]** of closed reports had another report filed within 150 meters within 30 days of their own filing. **[26]** spots with five or more reports hold **[56%]** of everything reported. Closed isn't fixed."

Say the caveat in one breath: "'Nearby' means within 150 meters, block-level locations. We compare filing dates, not closure dates, so the later report may have come before the ticket closed. It is not proof of the same pile, and we leave out duplicates and cancelled tickets."

**0:20 – Why it matters (20 s).** Point at the shaded map.

> "DC publishes every ticket, a citywide heat map of counts, and response-time reports. What it doesn't show a neighborhood is that a spot keeps coming back, and nothing helps a group ask for a lasting fix. The darker the shading, the more closed tickets had another one filed nearby soon after."

**0:40 – Pick the worst spot (25 s).** Action: open "Jump to a busy spot" (keyboard works), choose the top entry, or click a dark spot. The list and headline change.

> "Here is the worst one: **[21 reports, all closed, 20 followed by another report filed nearby within 30 days of filing, median gap about 3½ days]**. Every dot is an official 311 record; this list opens each original record."

**1:05 – Start a campaign (25 s).** Action: remove one report that does not belong (shows the group controls the evidence), press **New campaign here**. The campaign opens, named for the block, with the objective prefilled.

> "A campaign belongs to the neighborhood, not to a ticket. It's saved in this browser."

**1:30 – The ask (30 s).** Action: type a recipient ("ANC commissioner"), pick **Scheduled cleanup + check-in**, add the detail, add a task with an owner and due date, mark reviewed. Open **Brief**.

> "The brief leads with the recurrence evidence, then the ask, who's doing what by when, and the follow-up history. Nothing is sent from the app. The group takes it to the person who can approve a camera, signage, or a scheduled cleanup."

**2:00 – The judge's turn (40 s).** Invite a judge to take a task: type their name as an owner or tick a task done. Then **reload the page**: the campaign comes back, the area and the evidence intact. Add a follow-up observation (the **Fictional practice entry** box is checked by default and says so). Open the brief again.

> "Reload — still here. Now add a follow-up: 'checked Thursday, pile gone.' This one is a labeled fictional entry, because we did not actually go out. Open the brief: the follow-up and the task are in it, labeled. The city's ticket status didn't change, because a resident's note is not a city record; the brief keeps three accounts apart: what the city says, what the group did, and what residents saw."

**2:40 – Close (20 s).**

> "311 closes tickets. Neighbors need to see when a spot keeps getting reported, and to ask for a lasting fix. That's Block Ops."

## Honest Q&A

- **Have you talked to residents?** No, not yet. "We built from public data and the product idea; the first thing we'd do next is take this to a block association or an ANC commissioner and see whether the ask is something they'd send." (Change only if the team has actually done interviews.)
- **Does DC already publish this?** We checked: DC publishes the tickets, a rolling 30-day dumping layer, DPW Cards with a citywide heat map and response-time reports, and DumpBusters describes cleanups, signage and enforcement. We found nothing that shows a block's pattern of closed reports followed by more reports or helps residents ask for a lasting fix. DPW says publicly that repeat locations matter, and it may track them internally; we don't know. Our claim is that residents can't see or act on it. Sources are in `docs/specs/campaign-revision.md` section 9.
- **Is it the same pile?** We can't know and don't claim it. The data only says another report was filed nearby. The label always says "followed by another report within 30 days of filing"; we do not have verified closure dates.
- **Isn't 60% just reports about a big building or a busy street?** Possibly for some spots, which is why the map shows where, the list shows every record, and the group decides what belongs. And the number depends on the rule: at 100 meters it is 44%, at 250 meters 79%, with a 14-day window 45% on the same data. We chose 150 m and 30 days and say so.
- **Is it a failure of DPW?** We don't say that. A ticket can be correctly closed and the same corner can still keep getting dumped on. The ask is for a lasting fix, not blame.
- **Where does the data come from?** DC's public 311 service-request layer (FeatureServer/21) and the public Ward boundary. Locations are block-level or intersection points. Duplicates and cancelled tickets are excluded from the recurrence numbers.
- **What about crime data, cameras, or AI?** Not in this build, on purpose. We cut them to finish one loop well. A camera is one of the *options* a group can ask for.
- **Does it send anything?** No. It prepares the brief; the group sends it.
- **Where is the data saved? What about privacy?** In the browser's localStorage on one computer; no account, no server storage. The campaign only contains public 311 fields and what the group types. Clearing site data deletes it.
- **Is the follow-up real?** In the demo it's a labeled fictional entry. For a real group the box is unchecked and the entry carries no fictional label.
- **What if the data is stale?** The header shows when it was retrieved, and a refresh flags any ticket whose city status changed since the group reviewed it, and asks for a re-review.

## Backup plan

- **Network or the live service is down:** press **Recorded DC 311 snapshot (Oct 21)**. It is real city data saved from the live service, labeled RECORDED, with working official links. Say: "This is a saved copy of today's data, not live." Without internet the street basemap will not load; the dots, shading and the whole panel still work.
- **Everything else is down:** the **Practice case (fictional)** button is clearly labeled fictional and has no map; use it only to show the flow, and say so.
- **Saved campaign missing after reload:** localStorage is per address. Always use the same address (`http://127.0.0.1:8000`), not `localhost`; a private window or cleared site data starts empty. Create the campaign again (about 20 seconds).
- **Storage error banner:** saving is off by design, the page still works and the brief still downloads.
- **Projector:** the layout is checked at 1920×1080 and 1280×720. Browser zoom 100%.
- **Before going on stage:** start `node server.mjs`, load the page on live data, check the stat line, open a campaign once and delete it, check the Recorded button shows today's date, and keep the repo's `data/recorded-snapshot.json` current with `node scripts/record-snapshot.mjs` (needs network).
