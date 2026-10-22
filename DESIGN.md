# Block Ops web app experience

## Confirmed direction

The user wants an **application experience**, and a web app is sufficient for this project. Keep the existing stack, name and visual identity. Improve connected screens and interactions in place; a framework rewrite, native build or new design system is not required.

This is an operating app for neighbors carrying out work together. Read [PRODUCT](PRODUCT.md), [community scope](docs/specs/community-missions.md) and [current Sonnet assignment](docs/SONNET-HANDOFF.md). Earlier three-step worktable layouts are baseline context, not the required structure for the whole app.

**Implemented in B1/B2:** the navigation is Community · Missions · Map & campaigns with `aria-current` on the active section; the Community screen has the feed plus an Active-missions card; Missions lists efforts; mission detail leads with title, goal, organizer, place, time and progress, then the viewer's primary action, jobs with named claimants, participants, discussion/progress/dated observations, an inspectable evidence disclosure (or "No official 311 records attached"), a share link with a locally drawn QR code, and organizer controls. Publishing a local campaign goes through a preview of what is and is not copied. Colors are unchanged apart from status chips. Screenshots: `docs/ui-review/b2-run/`.

## One connected application

Use the existing header/navigation as the starting shell. Make Community, Missions and Map easy to reach, with an obvious current section. A mission opens within that same app context and has a clear back path. Keep session and drafts across navigation; avoid reloading the whole application for ordinary actions. Reuse existing components and modules rather than introducing a new router or framework solely for appearance.

| Screen | Main job | Primary actions |
|---|---|---|
| Community | Talk about a concern and discover active efforts | Join, post/reply, start a mission from a discussion, open a mission |
| Missions | Find the community's active plans and current participation | Open a mission, join an effort |
| Mission detail | Agree on responsibility and keep the plan current | Join/leave, claim/release a job, report completion, discuss/post a dated update |
| Map and local campaigns | Inspect public evidence and prepare reviewed material | Choose area/evidence, review, publish a deliberate copy into a mission |

A compact mission list inside the existing community shell is sufficient if it preserves navigation and discoverability; a separate dashboard is not required. Do not add screens or settings to fill the navigation.

## Mission detail hierarchy

Lead with the mission title, objective, location, organizer and optional time. Show participation and available jobs next, with one clear primary action appropriate to the viewer. A claimed task displays its actual member name; completion is a reported action, not independently verified remediation. Keep mission discussion and follow-up nearby. Source records remain inspectable in a secondary evidence disclosure, with their original dates/statuses and uncertainty.

Keep community conversation and mission conversation distinguishable. Publishing a local campaign presents a clear sharing review first and leaves the local original intact. A discussion-origin mission without city data is a legitimate plan, clearly labeled as having no official records.

## Responsive interaction

On desktop, prioritize the feed or current mission; use supporting space for participants/evidence when it helps. On phones, stack the same workflow into readable screens with reachable actions and clear back navigation. Preserve the incumbent navigation pattern where it works. Avoid desktop-only interactions and long forms that combine every task at once.

Check 320/390-pixel layouts and desktop/projection readability. Use labeled controls, visible focus, comfortable targets, correct selected-navigation semantics and concise status announcements. Cancelling a reply/edit returns focus to its trigger. Replies and incoming updates must not steal keyboard focus or erase newer drafts.

## Visual system

- Ground `#f4f1f7`; paper `#fffefd`; ink `#302338`; secondary text `#6b6073`.
- Plum `#5b316b`: identity, selected states and primary actions.
- Sunflower `#f5cd55`: restrained emphasis for useful action/evidence; never a claim that the city fixed a problem.
- Pale plum `#ebe3f0`: secondary selection. Source-closed green `#e0ece3` / `#365c41` describes source status only.
- Keep the Avenir Next/Segoe UI/system font stack. No external font dependency is required.
- Separate tasks and sections with hierarchy and spacing; avoid putting every field inside another card. Use concise in-app copy and progressively disclose supporting evidence.

## Working states and product truth

Show genuine loading, empty, sending, retry, conflict and reconnect states. Preserve text on failure and text typed while an earlier send is pending. A successful response must not clear a newer draft or a different community's draft. Refresh canonical permitted state after events/reconnect; do not assume every event arrived.

Progress reflects persisted task commitments and member/organizer reports. City status, group progress and site observations stay distinct. Demo/sample content is labeled without fabricating neighbors or outcomes. A localhost link/QR is local test access, not proof that a judge's cellular phone can reach the application.

Retain the existing source-review, failed-refresh recovery, guarded local storage and print/export behavior. Evidence changes invalidate review. Print/export contains the reviewed plan and current persisted responsibilities, not the whole navigation/editor shell.
