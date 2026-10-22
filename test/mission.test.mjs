import assert from "node:assert/strict";
import test from "node:test";
import { validateStore } from "../lib/campaign.mjs";
import {
  MISSION_LIMITS, NO_RECORDS_LINE, buildMissionMarkdown, cleanMissionFields, isLocalOrigin, missionHash, missionProgress, normalizeEvidence,
  normalizeMission, normalizeSource, normalizeTask, parseRoute, parseTaskLines, publishPayloadFromCampaign, publishHash
} from "../lib/mission.mjs";

const CID = "b10c0000-0000-4000-8000-000000000001";
const MID = "b10c0000-0000-4000-8000-000000000002";
const PID = "b10c0000-0000-4000-8000-000000000003";

test("mission fields are trimmed and bounded, with a message per field", () => {
  const ok = cleanMissionFields({ title: "  Clean up  ", objective: "Bag litter", location: "Naylor Rd SE", startsAt: "2026-11-01T14:00" });
  assert.equal(ok.ok, true);
  assert.equal(ok.value.title, "Clean up");
  assert.match(ok.value.startsAt, /^2026-11-01T/);
  const bad = cleanMissionFields({ title: " ", objective: "x".repeat(MISSION_LIMITS.objective + 1), location: "" , startsAt: "not a date" });
  assert.deepEqual(Object.keys(bad.errors).sort(), ["location", "objective", "startsAt", "title"]);
  assert.equal(cleanMissionFields({ title: "x".repeat(121), objective: "o", location: "l" }).ok, false);
  assert.equal(cleanMissionFields({ title: "😀".repeat(120), objective: "o", location: "l" }).ok, true, "limits count characters");
});

test("jobs are typed one per line, bounded, and blank lines are ignored", () => {
  assert.deepEqual(parseTaskLines("Bring bags\n\n  Photograph the site  \r\n").tasks, [{ description: "Bring bags" }, { description: "Photograph the site" }]);
  assert.deepEqual(parseTaskLines("").tasks, []);
  assert.equal(parseTaskLines(Array.from({ length: 31 }, (_, i) => `job ${i}`).join("\n")).ok, false);
  assert.match(parseTaskLines("x".repeat(201)).error, /200 characters/);
});

test("progress counts claimed, done and unclaimed jobs separately", () => {
  const tasks = [{ claimedName: "A", done: true }, { claimedName: "B", done: false }, { claimedName: null, done: false }];
  assert.deepEqual(missionProgress(tasks), { total: 3, claimed: 2, done: 1, open: 1 });
  assert.deepEqual(missionProgress([]), { total: 0, claimed: 0, done: 0, open: 0 });
});

const campaign = () => ({
  id: "local-1", name: "1900 block of Naylor Rd SE", objective: "Stop repeat dumping on the 1900 block of Naylor Rd SE", createdAt: "2026-10-21T00:00:00Z", updatedAt: "2026-10-21T00:00:00Z",
  source: { mode: "recorded", sourceUrl: "https://example.test/layer", retrievedAt: "2026-10-21T18:00:00Z", window: { start: "2026-07-24", endExclusive: "2026-10-22" } },
  area: { center: { lon: -76.97, lat: 38.85 }, radiusM: 150 }, filters: { days: null, kinds: ["open", "closed", "other"] },
  evidence: [
    { key: "request:A", id: "A", objectId: 11, category: "Illegal Dumping", address: "1941 NAYLOR ROAD SE", date: 1760000000000, status: "Closed", agency: "DPW", ward: "Ward 8", geo: { lon: -76.97, lat: 38.85 }, outsideWard: false, reviewedStatus: "Closed", previousStatus: null, changedSinceReview: false, inLatestSnapshot: true }
  ],
  observations: [
    { id: "o1", kind: "followup", date: "2026-10-20", text: "Pile still there", fictional: true },
    { id: "o2", kind: "resident", date: "2026-10-21", text: "Private note", fictional: false }
  ],
  request: { text: "Please share a dated update.", confirmedAt: "2026-10-21T19:00:00Z" }, escalation: { recipient: "", fix: "", fixOther: "" },
  tasks: [{ id: "t1", text: "Photograph it", owner: "Dana", due: "2026-10-25", done: true }, { id: "t2", text: "Call the ANC", owner: "", due: "", done: false }]
});

test("publishing copies only reviewed evidence, task text and selected observations, and never touches the local campaign", () => {
  const local = campaign();
  assert.equal(validateStore({ version: 1, campaigns: [local] }).ok, true, "fixture is a valid saved campaign");
  const snapshot = structuredClone(local);
  const result = publishPayloadFromCampaign(local, { observationIds: ["o1"] });
  assert.equal(result.ok, true);
  assert.deepEqual(local, snapshot, "the local original is untouched");
  const { payload, summary } = result;
  assert.deepEqual(payload.evidence.map(item => item.key), ["request:A"]);
  assert.deepEqual(payload.tasks, [{ description: "Photograph it", due: "2026-10-25" }, { description: "Call the ANC", due: "" }], "no owners, no done flags");
  assert.ok(!JSON.stringify(payload).includes("Dana"), "typed owner names are not shared");
  assert.deepEqual(payload.observations.map(item => [item.date, item.fictional, item.text]), [["2026-10-20", true, "Pile still there"]], "only the ticked observation");
  assert.ok(!JSON.stringify(payload).includes("Private note"));
  assert.deepEqual([payload.source.mode, payload.source.retrievedAt, payload.source.reviewedAt, payload.origin], ["recorded", "2026-10-21T18:00:00Z", "2026-10-21T19:00:00Z", "local_campaign"]);
  assert.deepEqual([summary.evidence, summary.tasks, summary.observations, summary.droppedOwners, summary.droppedDone, summary.unsharedObservations], [1, 2, 1, 1, 1, 1]);
  assert.equal(publishPayloadFromCampaign(local).payload.observations.length, 0, "observations are opt-in");
  assert.deepEqual(publishPayloadFromCampaign(local, { observationIds: ["o2", "o1"] }).payload.observations.map(item => item.date), ["2026-10-20", "2026-10-21"], "imported observations are ordered by their observation date");
});

test("an unreviewed, empty, changed or oversize campaign cannot be published (the local export guards still apply)", () => {
  assert.match(publishPayloadFromCampaign({ ...campaign(), request: { text: "x", confirmedAt: null } }).error, /reviewed/);
  assert.match(publishPayloadFromCampaign({ ...campaign(), evidence: [] }).error, /at least one report/);
  const changed = campaign(); changed.evidence[0].changedSinceReview = true; changed.evidence[0].previousStatus = "Open";
  assert.match(publishPayloadFromCampaign(changed).error, /status changed/);
  const long = campaign(); long.tasks.push({ id: "t3", text: "x".repeat(201), owner: "", due: "", done: false });
  assert.match(publishPayloadFromCampaign(long).error, /200 characters/);
  const manyObs = campaign(); manyObs.observations = [{ id: "z", kind: "resident", date: "2026-02-31", text: "bad date", fictional: false }];
  assert.match(publishPayloadFromCampaign(manyObs, { observationIds: ["z"] }).error, /invalid date/);
});

test("routes: community feed, missions, new, publish and mission detail, with invalid ids rejected", () => {
  assert.deepEqual(parseRoute("#/map"), { section: "map" });
  assert.equal(parseRoute("").view, "feed");
  assert.deepEqual([parseRoute(`#/community/${CID}`).communityId, parseRoute(`#/community/${CID}`).view], [CID, "feed"]);
  assert.equal(parseRoute(`#/community/${CID}/missions`).view, "missions");
  assert.deepEqual([parseRoute(`#/community/${CID}/missions/new?post=${PID}`).view, parseRoute(`#/community/${CID}/missions/new?post=${PID}`).postId], ["new", PID]);
  assert.equal(parseRoute(`#/community/${CID}/missions/new?post=nope`).postId, null);
  assert.equal(parseRoute("#/missions/publish?campaign=abc").campaignId, "abc");
  assert.deepEqual([parseRoute(missionHash(CID, MID)).view, parseRoute(missionHash(CID, MID)).missionId], ["mission", MID]);
  assert.equal(parseRoute(publishHash(CID, "x y")).campaignId, "x y");
  for (const bad of ["#/community/zzz", `#/community/${CID}/mission/zzz`, `#/community/${CID}/bogus`, "#/missions/x"]) assert.equal(parseRoute(bad).view, "invalid", bad);
});

test("a link on this computer is flagged as not shareable with a phone elsewhere", () => {
  assert.equal(isLocalOrigin("http://127.0.0.1:8000/#/x"), true);
  assert.equal(isLocalOrigin("http://localhost:8000/"), true);
  assert.equal(isLocalOrigin("http://printer.local/"), true);
  assert.equal(isLocalOrigin("https://block-ops.example.org/#/x"), false);
  assert.equal(isLocalOrigin("not a url"), true);
});

test("evidence and source from another browser are coerced to plain, typed fields", () => {
  const items = normalizeEvidence([{ key: "request:A", id: 5, address: { evil: 1 }, status: "Closed", geo: { lat: "x", lon: 1 }, outsideWard: "yes" }, { nokey: 1 }, null, "text"]);
  assert.equal(items.length, 1);
  assert.deepEqual([items[0].id, items[0].address, items[0].geo, items[0].outsideWard], ["5", null, null, false]);
  assert.equal(normalizeSource({ mode: "weird" }), null);
  assert.equal(normalizeSource({ mode: "live", retrievedAt: 5 }).retrievedAt, null);
  assert.equal(normalizeMission({ id: "m", community_id: "c", organizer_id: "u", organizer_name: "O", title: "T", objective: "o", location_text: "l", status: "bogus", origin: "discussion", evidence: "nope", version: 1 }).status, "planning");
  assert.equal(normalizeTask({ id: "t", claimed_by: null, claimed_name: null, done: false }).done, false);
});

const base = () => ({
  communityTitle: "Ward 8 neighbors (demonstration)", exportedAt: "2026-10-21T20:00:00.000Z",
  mission: { id: MID, title: "Corner cleanup", objective: "Bag litter.", location: "Naylor Rd SE", startsAt: null, status: "scheduled", organizerId: "u1", organizerName: "Ada", origin: "discussion", source: null, evidence: [], version: 3 },
  members: [{ userId: "u1", displayName: "Ada" }, { userId: "u2", displayName: "Ben" }],
  tasks: [
    { description: "Bring bags", claimedName: "Ben", done: true, due: null, imported: false },
    { description: "Photograph the site", claimedName: null, done: false, due: "2026-10-30", imported: false }
  ],
  posts: [
    { kind: "update", authorName: "Ben", body: "Bags delivered", createdAt: "2026-10-21T19:00:00Z", hidden: false },
    { kind: "update", authorName: "Mallory", body: "SECRET HIDDEN", createdAt: "2026-10-21T19:05:00Z", hidden: true },
    { kind: "observation", authorName: "Ada", body: "Pile cleared", observedOn: "2026-10-21", fictional: true, imported: false, createdAt: "2026-10-21T19:10:00Z", hidden: false }
  ]
});

test("an evidence-free shared plan says so, reports current commitments, and keeps the three accounts apart", () => {
  const md = buildMissionMarkdown(base());
  assert.ok(md.includes(NO_RECORDS_LINE));
  assert.match(md, /- \[x\] Bring bags — claimed by Ben/);
  assert.match(md, /- \[ \] Photograph the site — unclaimed; due 2026-10-30/);
  assert.match(md, /1 of 2 jobs reported done; 1 claimed; 1 unclaimed/);
  assert.match(md, /not a verified result/);
  assert.match(md, /\*\*\[FICTIONAL practice entry\]\*\*/);
  assert.ok(!md.includes("SECRET HIDDEN"), "hidden posts stay out");
  assert.ok(!/closed ticket|city ticket status as published/i.test(md), "no city status is invented for a discussion mission");
  assert.match(md, /not verified residents/);
  assert.match(md, /Exported from the shared mission at 2026-10-21T20:00:00\\\.000Z/);
});

test("a published sourced mission exports its reviewed records with source labels, links and filing-date wording", () => {
  const input = base();
  input.mission.origin = "local_campaign";
  input.mission.source = { mode: "recorded", sourceUrl: "https://example.test/layer", retrievedAt: "2026-10-21T18:00:00Z", window: { start: "2026-07-24", endExclusive: "2026-10-22" }, reviewedAt: "2026-10-21T19:00:00Z" };
  input.mission.evidence = [
    { key: "request:A", id: "A", objectId: 11, address: "1941 NAYLOR ROAD SE", date: Date.UTC(2026, 9, 1, 16), status: "Closed", outsideWard: false },
    { key: "request:B", id: "B", objectId: 12, address: "1950 NAYLOR ROAD SE", date: Date.UTC(2026, 9, 2, 16), status: "Open", outsideWard: false }
  ];
  input.posts.push({ kind: "observation", authorName: "Ada", body: "Imported note", observedOn: "2026-10-20", fictional: false, imported: true, createdAt: "2026-10-21T19:20:00Z", hidden: false });
  const md = buildMissionMarkdown(input);
  assert.ok(!md.includes(NO_RECORDS_LINE));
  assert.match(md, /Recorded DC 311 snapshot \(real city data, retrieved 2026-10-21T18:00:00Z\); this is not live data/);
  assert.match(md, /\*\*Request ID:\*\* A;/);
  assert.match(md, /\[Original source record\]\(https:\/\/maps2\.dcgis\.dc\.gov\//);
  assert.match(md, /filing dates, not closure dates/);
  assert.match(md, /Reports excluded in that review are not included/);
  assert.match(md, /Imported from a local campaign by the organizer; original author unverified/);
  assert.match(md, /1 Closed · 1 Open/);
  input.mission.source.mode = "demo";
  const demo = buildMissionMarkdown(input);
  assert.match(demo, /Fictional demo sample/);
  assert.ok(!/Original source record/.test(demo), "fictional records never get official links");
});

test("markdown special characters from members cannot inject structure into the export", () => {
  const input = base();
  input.mission.title = "# Evil [link](http://x) <b>";
  input.tasks[0].description = "- [x] fake\n## heading";
  const md = buildMissionMarkdown(input);
  assert.ok(!/^## heading/m.test(md));
  assert.ok(md.includes("\\[link\\]\\(http://x\\)"));
});
