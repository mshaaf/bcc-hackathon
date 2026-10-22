# Block Ops — community missions scope

Date: October 21, 2026. Status: B1 and B2 are built and were verified on local Supabase: shared discussion, missions, authenticated claims, progress/follow-up, reviewed local publication and current exports. B1 review defects were fixed in B2. B3 repairs and its mobile follow-up are implemented; the latest migration, hosted access and real-phone proof remain open, so S4 is In progress and R5 has not started. [Latest independent review](../B3-FOLLOWUP-REVIEW.md). The user explicitly requested community participation like a Facebook group or group chat, where neighbors agree to address dumping or another local concern. This replaces single-operator campaign work as the product's main workflow. Existing R1–R4 implementation remains useful baseline work.

## Purpose and product picture

**Promise:** find a local concern, bring neighbors together, agree on a plan, and keep each other updated while carrying it out.

The main experience is a neighborhood group with an activity feed and active missions. A mission is a concrete shared effort, with a location, goal, organizer, optional scheduled time, discussion, available jobs, and follow-up. The map helps find supporting public records. The brief helps communicate the group's request. Neither is the main social interaction.

Example, entirely illustrative: someone starts “Clean up our corner on Saturday,” neighbors discuss the plan, one claims “Bring bags,” another claims “Document the site,” and the organizer posts a follow-up. For a streetlight problem, the mission instead coordinates documentation and a service follow-up. A ticket category does not establish that volunteers can safely handle material at a site. Plans and participant commitments are not completed work.

## Confirmed web app experience

The user explicitly wants an application, and a **web app is sufficient for this project**. Keep the existing stack and improve the current screens in place. Use one consistent navigation shell for Community, discoverable Missions/mission detail, task actions and Map/local campaigns. Community is the working default. Preserve session, back paths and newer unsent drafts across screen changes. A compact mission list in the current shell is sufficient; no extra dashboard, native build, installable packaging or framework rewrite is required.

On a mission, prioritize goal/location/organizer/time, current participants, available or claimed jobs, and discussion/follow-up; supporting source history is inspectable secondary detail. Phone and desktop support the same join → claim → update flow with accessible controls and honest loading/empty/error/conflict states. [PRODUCT](../../PRODUCT.md) and [DESIGN](../../DESIGN.md) specify the app experience. [B1 review defects](../B1-REVIEW.md) are repaired; preserve those regressions.

## Confirmed intent and proposed defaults

Confirmed: Block Ops / Track 3, meaningful group participation and social impact, reuse existing work, phased execution, detailed Claude handoffs, conserve account usage. Every assistant message must end with a very simple TL;DR.

Builder's proposed defaults, open to user revision: one Ward 8 demonstration community; joining by link with a chosen display name; text posts and one-level replies; a shared mission with single-owner tasks; in-app updates across devices; a community-first landing view. No production community, organizer partnership, or verified residency is implied. The user did not select a backend or hosting provider.

## The first complete experience

1. Open a community link and understand its purpose and open missions. Join with a display name. Joining creates a real authenticated session; a typed name alone is not authorization.
2. Post to the community feed or reply to a discussion. Every post has an author and timestamp. This is where people propose an effort or ask for help.
3. A member starts a mission from the existing map/campaign or a discussion. A discussion-origin mission can begin with no 311 evidence; it records a descriptive public location or selected map point and explicitly says no official records are attached. They review what will be shared, choose an objective, location, time if relevant, and a short task list. The creator is that mission's organizer.
4. Neighbors open its share link/QR code, join the mission, discuss logistics, and claim a job. Their commitment appears on the organizer's laptop and other participants' phones.
5. Participants post updates and mark their own jobs done. The organizer can report the group's progress and set a follow-up. Official 311 status and resident observations remain separate.
6. Reload or return later and see the same shared mission, discussion, and responsibilities. A dated group observation supports any claim about conditions after the activity.

## Must ship and cut list

| Must ship | Reason |
|---|---|
| One shared community, membership and display names | People need a persistent place to gather. |
| Chronological feed, text posts, one-level replies | People can talk and propose action without a full messaging product. |
| Shared mission page with objective, location, organizer and schedule | Discussion becomes an actual plan. |
| Join/leave and claim/release a task | Participation changes the plan, not only a counter. |
| Dated updates and group follow-up | Members can return and see what happened. |
| Shared durable state and cross-device refresh | Two browsers must see the same work. |
| Shareable URL and locally generated QR code | The judge can participate from their phone. |
| Ownership checks, basic moderation, honest demo labels | Shared writing needs clear boundaries. |

Defer private messages, group-directory search, followers/friends, algorithmic feeds, video, photo uploads, push/email notifications, typing indicators, multiple neighborhoods, petitions/signature verification, automated agency submissions, AI, crime layers, and destination catalogs. Text updates and existing evidence links are enough for the first slice. No stack rewrite for its own sake.

Keep dumping as the first proven source category; the product's promise is broader. Add a second category only after the complete shared workflow works. Do not ship all 94 categories just to change the headline.

## Shared architecture — established locally; hosting unproven

Keep the Node server, native browser modules, Leaflet map, source inspection, reviewed campaign model, exports, and recorded data fallback. B1 added **Supabase Postgres + Auth + Realtime** locally via CLI/Docker, including the vendored SDK, schema and community write operations. Reuse this implementation and add migrations for B2; preserve existing community data. No hosted project or public app URL exists. [Setup and limits](../COMMUNITY-SETUP.md).

Use anonymous Auth for the first demo so participants need no email/password; retain a session through ordinary reloads. Make the limit explicit: clearing browser data or switching devices loses access to that guest identity. This is not residency verification or a count of unique humans. Organizer recovery or permanent accounts can follow later. Supabase's authenticated database role also includes anonymous Auth users, so role alone is not authorization. [Anonymous Auth documentation](https://supabase.com/docs/guides/auth/auth-anonymous)

Browser modules may write directly through the authenticated Supabase Data API **only with database-enforced permissions and validation**. Node can keep its fixed read-only 311 proxy; adding shared writes does not inherently require rewriting that proxy. Realtime subscriptions notify the client to re-fetch the permitted current state. On reconnect, re-fetch; do not assume every event was delivered. [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [Postgres Changes](https://supabase.com/docs/guides/realtime/postgres-changes)

Use publishable browser configuration only. Never expose service-role/secret keys. Pin and locally bundle/vendor the selected SDK, retain its license, and add only the required HTTPS/WSS origins to CSP. No broad wildcard CSP. Local provider access and the pinned SDK/CLI were established in B1; verify current provider documentation before database/Auth changes and preserve the narrow CSP. Hosting is unselected; prepare a deployable Node application, then publish only when the user instructs it. A public URL is necessary for unrelated phones on venue Wi-Fi/cellular; a localhost QR code will not work.

### Data and ownership contract

The following is the minimum shared model; actual SQL belongs to the owning work order (community/membership in S1.3, posts in S2.1, missions/tasks in S3.1–S3.2). Use UUID identifiers, timestamped rows, foreign keys and database uniqueness constraints. Enable RLS on exposed tables and test with real independent user sessions, not only an admin client.

| Entity | Essential data / ownership |
|---|---|
| communities | One seeded demonstration community, title, description, moderator user ID. Clients cannot grant themselves moderation. |
| community_members | Community ID + authenticated user ID unique; display name (1–40 characters), joined time. User manages their own membership/name. |
| missions | Community, creator/organizer user ID, title (1–120), objective/request, selected evidence snapshot, optional schedule/meeting point, progress, version. Any community member may create; organizer controls mission metadata and reviewed evidence. |
| mission_members | Mission + user ID unique, joined time. Join/leave is idempotent; names never act as permission credentials. |
| mission_tasks | Mission, description, optional due date, nullable claimant user ID, done flag. One claimant per task. Claims are atomic and require mission membership; only claimant or organizer may release/complete. |
| posts | Community, optional mission, optional parent post, authenticated author, body (1–2,000), created time, type (discussion/update/observation), optional observation date and fictional flag, moderation state. Replies remain in the same community/mission as their parent. |

All group discussions are member-readable in the first slice. The public join preview shows community purpose and mission summary, not private draft notes or membership identifiers. Public views must whitelist fields, not serialize whole database rows. Members can edit their own posts. The seeded community moderator can hide abusive content; a mission organizer can moderate their mission discussion. Authorization must be checked on the write path, not only by hiding buttons.

Reject empty/oversized bodies, forged author/creator IDs, cross-community replies/claims and changes to another user's account. Enforce bounded posting/joining through the database/API write path; do not rely on client throttling. Enable the provider's recommended anonymous-auth abuse protection before public exposure and test the venue's shared-IP behavior rather than globally disabling protections. There is no need for phone numbers, home addresses, or exact live participant locations.

### Preserve local work and prevent lost updates

Existing localStorage campaigns stay local until an organizer deliberately publishes a reviewed copy. Show a sharing preview and confirm the selected content through the publish action. Do not silently upload every existing note, migrate all local data, or delete the local version. The shared mission receives its own ID and retains the source snapshot date/mode. Community and mission links use root hash routes (`/#/community/<uuid>` and `/#/community/<uuid>/mission/<uuid>`) so the existing Node root route can serve them. Source-post links must remain within the same community.

When publishing a local campaign, copy selected task descriptions/due dates as **unclaimed and not done**. Legacy typed owner names are not authenticated commitments and must never create memberships or claims. Copy only deliberately selected historical observations, mark them as imported by the organizer with original authorship unverified, preserve dates/fictional labels, and distinguish them from new authenticated posts. Do not silently attribute an old observation to the publishing user as its original author.

Leaving a mission atomically releases unfinished claims and removes membership; completed work retains its historical attribution. A mission organizer cannot leave an active mission until archiving it (ownership transfer is deferred). Leaving the community requires no active owned missions, then atomically releases unfinished claims, removes mission memberships and removes community membership. Future reads/writes require current community membership. Claim transactions must serialize with membership removal so a leave/claim race cannot leave an orphan claim.

Keep membership, posts and task claims as separate shared rows. Do not synchronize the entire campaign JSON on every keystroke; that would overwrite another person's activity. Organizer metadata updates use a version check and show a conflict instead of silently replacing newer changes. Failed sends keep the typed text and report that it has not been posted. Retries use an operation ID so a timeout does not create duplicate posts or joins. Subscription reconnects re-fetch state and derive counts from persisted rows.

## Progress and impact claims

Mission progress: planning → scheduled → in progress → follow-up → archived. A task marked done means its claimant/organizer reported it done. An observation has an author/date. “The group completed its plan,” “the city closed a ticket,” and “someone checked the site” remain different statements.

Show actual participant sessions joined, tasks claimed/completed and follow-up entries. Label judging participants/demo entries accurately. Never turn judge signup counts into claimed neighborhood adoption, fabricated cleanups, verified residency, or reduced dumping. This slice demonstrates coordination; downstream social impact remains to be measured.

S1.1 corrected the recurrence headline at `9f09667`: `reReportedKeys` compares report creation dates, and current copy now describes filing dates rather than “after closure.” The original algorithm remains, with a regression for a later report filed before the earlier ticket closed. The current “60% after closure” story must not be reused unchanged.

## Acceptance criteria

1. Organizer browser A and independent browser B use the same shared community. B joins, posts, and claims a job; A sees the persisted change without manual reload within five seconds on the tested healthy connection.
2. Two independent people race to claim the same task. Exactly one succeeds, the other gets a clear already-claimed response, and reconnect/reload preserves the winner.
3. A duplicate join or retried post does not duplicate a membership or message. Refreshing the page does not increment the participant count.
4. A member cannot impersonate another author, edit someone else's mission metadata, forge a moderator role, or write across an unauthorized community. Test outside the UI against the actual backend.
5. A local campaign publishes only after deliberate review. The local original remains; selected evidence, rejected evidence, source freshness, unknowns, and fictional labels remain accurate.
6. Failed/offline sends preserve the draft text with a retry. Reconnect restores canonical state without lost posts or duplicate claims. Provider outage is not silently replaced with fake live participants.
7. Keyboard and 390/320-pixel phone layouts support join → discussion → claim → update. A real phone on another network opens the shared URL before claiming stage readiness.
8. Group progress, city status and site observations remain distinct throughout the mission and exported brief. An evidence-free discussion-origin mission can organize work and export a plan labeled “No official 311 records attached”; it cannot manufacture a sourced conclusion. Existing evidence-required local brief guards remain intact. The recurrence-date counterexample is fixed or the unsupported closure copy removed.
9. Publishing old local tasks creates no authenticated commitments or done counts. Imported observations retain provenance labels. Leaving and a simultaneous claim cannot leave unfinished work assigned to a non-member.
10. Community, missions/tasks and map remain connected app screens with clear current navigation/back paths; core actions work on phone and desktop. Newer draft text survives successful sends and navigation. No native build/install step is needed for the project.

## Delivery order

Use [the social implementation plan](../superpowers/plans/2026-10-21-community-missions.md). S1 shared foundation and claim repair; S2 community joining/feed; S3 mission participation and follow-up; S4 hardening and phone/deployment proof. Then return to R5 release/rehearsal. Existing R1–R4 completion does not prove these new requirements.

First cut under time pressure: second category, photos, extra reaction types, elaborate styling and automatic notifications. Keep the two-device shared participation path, permission checks and truthful progress.
