import assert from "node:assert/strict";
import test from "node:test";
import { validateStore } from "../lib/campaign.mjs";
import { clearIfUnchanged, readDrafts, writeDrafts } from "../lib/drafts.mjs";
import {
  describeSharedChanges, normalizeRows, postHash, sendJob, taskControls, taskStatusText, MISSION_LIMITS, NO_RECORDS_LINE, buildMissionMarkdown, cleanMissionFields, isLocalOrigin, missionHash, missionProgress, normalizeEvidence,
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


// ---------- B3 repairs from the independent B2 review ----------

const hostile = () => JSON.parse('{"toString":null,"valueOf":null}'); // what a hostile client can store in a JSON column

test("B3 repair: malformed stored evidence normalizes to unknowns and never throws (the reviewed crash)", () => {
  const stored = [{ key: "review:fixture", id: hostile(), objectId: hostile(), date: hostile(), address: 7, status: true, geo: "x", category: [] }];
  assert.doesNotThrow(() => normalizeEvidence(stored));
  const [item] = normalizeEvidence(stored);
  assert.deepEqual([item.key, item.id, item.objectId, item.date, item.address, item.status, item.geo, item.category], ["review:fixture", null, null, null, null, null, null, null]);
  // numbers from the city's data keep their meaning
  const [number] = normalizeEvidence([{ key: "k", id: 25000123, objectId: 77, date: 1760000000000 }]);
  assert.deepEqual([number.id, number.objectId, number.date], ["25000123", 77, 1760000000000]);
  assert.equal(normalizeEvidence([{ key: "k", date: Number.NaN, objectId: Infinity }])[0].date, null);
});

test("B3 repair: a hostile record cannot break the export or the evidence ordering either", () => {
  const mission = normalizeMission({ id: MID, community_id: CID, organizer_id: "u1", organizer_name: "Ada", title: "T", objective: "o", location_text: "l", status: "planning", origin: "local_campaign",
    source: { mode: "recorded", window: "nonsense", radiusM: "x", retrievedAt: hostile() }, evidence: [{ key: "a", id: hostile(), objectId: hostile(), date: hostile(), status: hostile() }, { key: "b", id: "B", date: "2026-10-01" }], version: 1 });
  const bundle = { ...base(), mission };
  assert.doesNotThrow(() => buildMissionMarkdown(bundle));
  assert.match(buildMissionMarkdown(bundle), /Date unavailable/);
});

test("B3 repair: one bad row is skipped without hiding the others", () => {
  const warnings = [];
  const original = console.warn; console.warn = message => warnings.push(message);
  try {
    const rows = normalizeRows([{ n: 1 }, null, { n: 3 }], row => { if (!row) throw new TypeError("boom"); return row.n; }, "mission");
    assert.deepEqual(rows, [1, 3]);
    assert.equal(warnings.length, 1);
    assert.deepEqual(normalizeRows("not a list", x => x), []);
  } finally { console.warn = original; }
});

// Models the shell: drafts live in memory for the on-screen community and in storage for every community.
function draftHarness(active = "X") {
  const map = new Map();
  const storage = { getItem: key => map.get(key) ?? null, setItem: (key, value) => map.set(key, value), removeItem: key => map.delete(key) };
  const memory = new Map();
  const state = { active };
  const api = {
    storage, memory, state,
    set(key, value) { memory.set(key, value); writeDrafts(storage, state.active, Object.fromEntries(memory)); },
    get: key => memory.get(key) ?? "",
    clearFor: communityId => (key, submitted) => clearIfUnchanged({ storage, activeCommunityId: state.active, memory, communityId, key, submitted })
  };
  return api;
}
const deferred = () => { let resolve, reject; const promise = new Promise((a, b) => { resolve = a; reject = b; }); return { promise, resolve, reject }; };

test("B3 repair: a newer Add job draft typed while the save is pending survives the save", async () => {
  const h = draftHarness();
  h.set("job:m:desc", "Bring gloves"); h.set("job:m:due", "2026-11-01");
  const pending = deferred();
  const sending = sendJob({ addTask: () => pending.promise, readDraft: h.get, clearSent: h.clearFor("X"), missionId: "m", descKey: "job:m:desc", dueKey: "job:m:due" });
  h.set("job:m:desc", "Bring gloves and a second job I just started typing"); // the field stays editable during the request
  h.set("job:m:due", "2026-11-09");
  pending.resolve({ id: "t1" });
  const result = await sending;
  assert.equal(result.ok, true);
  assert.equal(h.get("job:m:desc"), "Bring gloves and a second job I just started typing", "newer description kept");
  assert.equal(h.get("job:m:due"), "2026-11-09", "newer due date kept");
  assert.deepEqual(readDrafts(h.storage, "X"), { "job:m:desc": "Bring gloves and a second job I just started typing", "job:m:due": "2026-11-09" });
});

test("B3 repair: an unchanged Add job draft is cleared once the job is saved, and a failed save keeps it", async () => {
  const h = draftHarness();
  h.set("job:m:desc", "Photograph the site"); h.set("job:m:due", "2026-11-01");
  const sent = [];
  const done = await sendJob({ addTask: async input => { sent.push(input); return { id: "t" }; }, readDraft: h.get, clearSent: h.clearFor("X"), missionId: "m", descKey: "job:m:desc", dueKey: "job:m:due" });
  assert.deepEqual(sent, [{ missionId: "m", description: "Photograph the site", due: "2026-11-01" }]);
  assert.equal(done.ok, true);
  assert.deepEqual([h.get("job:m:desc"), h.get("job:m:due")], ["", ""]);
  h.set("job:m:desc", "Second job");
  await assert.rejects(sendJob({ addTask: async () => { throw new Error("offline"); }, readDraft: h.get, clearSent: h.clearFor("X"), missionId: "m", descKey: "job:m:desc", dueKey: "job:m:due" }), /offline/);
  assert.equal(h.get("job:m:desc"), "Second job", "nothing is lost when the save fails");
});

test("B3 repair: an Add job save that finishes after navigating to another community leaves that community's drafts alone", async () => {
  const h = draftHarness("X");
  h.set("job:m:desc", "Job typed in X");
  const pending = deferred();
  const sending = sendJob({ addTask: () => pending.promise, readDraft: h.get, clearSent: h.clearFor("X"), missionId: "m", descKey: "job:m:desc", dueKey: "job:m:due" });
  // navigate to Y, which has its own (identical-looking) draft in memory; X's saved text is what was sent
  const yMemory = new Map([["job:m:desc", "Job typed in X"]]);
  h.state.active = "Y"; h.memory.clear(); for (const [key, value] of yMemory) h.memory.set(key, value);
  pending.resolve({ id: "t" });
  await sending;
  assert.equal(h.get("job:m:desc"), "Job typed in X", "the on-screen community's draft is not cleared by X's completion");
  assert.deepEqual(readDrafts(h.storage, "X"), {}, "X's own saved copy of the sent text is cleared");
});

test("B3 repair: Add job validates before sending", async () => {
  const h = draftHarness();
  const never = () => { throw new Error("should not send"); };
  h.set("job:m:desc", "   ");
  assert.deepEqual(await sendJob({ addTask: never, readDraft: h.get, clearSent: h.clearFor("X"), missionId: "m", descKey: "job:m:desc", dueKey: "job:m:due" }), { ok: false, error: "Describe the job first." });
  h.set("job:m:desc", "x".repeat(MISSION_LIMITS.task + 1));
  assert.match((await sendJob({ addTask: never, readDraft: h.get, clearSent: h.clearFor("X"), missionId: "m", descKey: "job:m:desc", dueKey: "job:m:due" })).error, /up to 200 characters/);
});

test("B3 repair: completion is not attributed to the claimant as its reporter", () => {
  const organizerMarked = { description: "Bring bags", claimedName: "Ben", claimedBy: "u2", done: true };
  const text = taskStatusText(organizerMarked, { mine: false, doneTime: "Oct 21, 3:02 PM" });
  assert.match(text, /Reported done/);
  assert.match(text, /claimed by Ben/);
  assert.doesNotMatch(text, /reported by/i);
  assert.match(taskStatusText(organizerMarked, { mine: true }), /claimed by you/);
  assert.equal(taskStatusText({ claimedName: "Ben", done: false }, {}), "Claimed by Ben");
  assert.equal(taskStatusText({ claimedName: "Ben", done: false }, { mine: true }), "You claimed this job");
  assert.equal(taskStatusText({ claimedName: null, done: false }, {}), "Unclaimed");
});

test("remote changes to the open mission are described in plain words, skipping the viewer's own", () => {
  const task = (id, over = {}) => ({ id, missionId: MID, description: `job ${id}`, claimedBy: null, claimedName: null, done: false, ...over });
  const member = (userId, displayName) => ({ missionId: MID, userId, displayName });
  const before = { tasks: [task("a"), task("b", { claimedBy: "u2", claimedName: "Ben" }), task("c", { claimedBy: "u2", claimedName: "Ben", done: true })], members: [member("u1", "Ada"), member("u2", "Ben")], missions: [{ id: MID, version: 1, organizerId: "u1" }] };
  const after = {
    tasks: [task("a", { claimedBy: "u3", claimedName: "Cy" }), task("b"), task("c", { claimedBy: "u2", claimedName: "Ben" }), task("d")],
    members: [member("u1", "Ada"), member("u3", "Cy")], missions: [{ id: MID, version: 2, organizerId: "u1" }]
  };
  const said = describeSharedChanges(before, after, { missionId: MID, userId: "u9" });
  assert.deepEqual(said.sort(), [
    "Ben left the mission.", "Cy claimed “job a”.", "Cy joined the mission.", "New job: “job d”.", "The organizer updated the mission details.", "“job b” is unclaimed again.", "“job c” was reopened."
  ].sort());
  const mine = describeSharedChanges(before, after, { missionId: MID, userId: "u3" });
  assert.ok(!mine.some(line => /Cy/.test(line)), "the viewer's own claim and join are not announced to them");
  assert.deepEqual(describeSharedChanges(before, before, { missionId: MID, userId: "u9" }), []);
  assert.deepEqual(describeSharedChanges(before, after, { missionId: "another", userId: "u9" }), [], "other missions are ignored");
});

test("a mission started from a discussion links back to its source post by route", () => {
  assert.equal(postHash(CID, PID), `#/community/${CID}?post=${PID}`);
  assert.deepEqual(parseRoute(postHash(CID, PID)), { section: "community", view: "feed", communityId: CID, missionId: null, postId: PID, campaignId: null });
  assert.equal(parseRoute(`#/community/${CID}?post=not-an-id`).postId, null);
});


test("B3 review: a participant who left the mission is not offered an action the database refuses; the organizer keeps access", () => {
  const finished = { claimedBy: "u2", claimedName: "Ben", done: true };
  const unfinished = { claimedBy: "u2", claimedName: "Ben", done: false };
  const open = { claimedBy: null, claimedName: null, done: false };
  const view = over => ({ userId: "u2", member: true, organizer: false, archived: false, ...over });
  // current participant: full control of their own jobs
  assert.deepEqual(taskControls(finished, view()), ["reopen"]);
  assert.deepEqual(taskControls(unfinished, view()), ["done", "release"]);
  assert.deepEqual(taskControls(open, view()), ["claim"]);
  // the reviewed case: finished the job, left the mission, still in the community
  assert.deepEqual(taskControls(finished, view({ member: false })), [], "no Mark not done for a former participant");
  assert.deepEqual(taskControls(open, view({ member: false })), [], "and nothing to claim without joining");
  // the organizer can act on anyone's job, including a departed claimant's
  assert.deepEqual(taskControls(finished, view({ userId: "u1", member: true, organizer: true })), ["reopen"]);
  assert.deepEqual(taskControls(finished, view({ userId: "u1", member: false, organizer: true })), ["reopen"]);
  assert.deepEqual(taskControls(unfinished, view({ userId: "u1", organizer: true })), ["done", "release"]);
  // someone else's job, a signed-out viewer and archived missions
  assert.deepEqual(taskControls(finished, view({ userId: "u3" })), []);
  assert.deepEqual(taskControls(unfinished, view({ userId: null })), []);
  assert.deepEqual(taskControls(unfinished, view({ organizer: true, archived: true })), []);
});
