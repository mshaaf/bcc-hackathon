import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_SCOPE, setRecordIncluded, sourceRecordUrl, updateScope } from "../lib/block-ops.mjs";
import {
  addObservation, addTask, buildCampaignBriefContent, buildCampaignMarkdown, canExportCampaign, confirmCampaign, createCampaign,
  defaultObjective, emptyStore, exportBlocker, reconcileCampaign, reconcileStore, removeEvidence, removeObservation, removeTask,
  setObjective, setRequestText, updateTask, validateStore
} from "../lib/campaign.mjs";

const NOW = new Date("2026-10-21T18:00:00.000Z");
const LATER = new Date("2026-10-23T18:00:00.000Z");
const day = offset => Date.UTC(2026, 9, 21 + offset, 16);
const make = (id, over) => ({ key: `request:${id}`, id, objectId: 100 + id.charCodeAt(0), category: "Illegal Dumping", agency: "DPW", ward: "Ward 8", attributes: { SERVICEREQUESTID: id }, geoStatus: "ok", outsideWard: false, ...over });
const records = [
  make("A", { address: "1941 NAYLOR ROAD SE", status: "Closed", date: day(-40), geo: { lon: -76.9719, lat: 38.8478 } }),
  make("B", { address: "1950 NAYLOR ROAD SE", status: "Open", date: day(-5), geo: { lon: -76.9722, lat: 38.8479 } }),
  make("C", { address: "1900 - 1999 BLOCK OF NAYLOR ROAD SE", status: "Closed", date: day(-2), geo: { lon: -76.9716, lat: 38.8477 } }),
  make("D", { address: "300 FAR ST SE", status: "Closed", date: day(-3), geo: { lon: -76.9400, lat: 38.8300 }, outsideWard: true })
];
const snapshot = { mode: "live", sourceUrl: "https://example.test/layer", retrievedAt: NOW.toISOString(), window: { start: "2026-07-24", endExclusive: "2026-10-22" }, records };
const base = { snapshot, area: { ...DEFAULT_SCOPE.area }, filters: { days: null, kinds: new Set(["open", "closed", "other"]) }, selectedIds: new Set(), excludedIds: new Set() };
const draft = updateScope(base, { center: { lon: -76.9720, lat: 38.8478 }, radiusM: 250 });
const fresh = () => createCampaign(draft, { now: NOW, id: "c1" });

test("new campaign takes the current area, filters and selection, named for the block", () => {
  const withoutB = setRecordIncluded(draft, "request:B", false);
  const campaign = createCampaign(withoutB, { now: NOW, id: "c1" });
  assert.equal(campaign.name, "1900 block of Naylor Rd SE");
  assert.equal(campaign.objective, "Stop repeat dumping on the 1900 block of Naylor Rd SE");
  assert.deepEqual(campaign.evidence.map(item => item.id), ["A", "C"]);
  assert.deepEqual(campaign.area, { center: { lon: -76.9720, lat: 38.8478 }, radiusM: 250 });
  assert.deepEqual(campaign.filters, { days: null, kinds: ["open", "closed", "other"] });
  assert.equal(campaign.evidence[0].address, "1941 NAYLOR ROAD SE", "full source address is kept");
  assert.equal(campaign.evidence[0].objectId, records[0].objectId);
  assert.equal(campaign.request.confirmedAt, null);
  assert.equal(validateStore({ version: 1, campaigns: [campaign] }).ok, true);
  assert.throws(() => createCampaign({ ...draft, selectedIds: new Set() }), /at least one report/i);
});

test("default objectives read naturally for blocks, intersections and plain street names", () => {
  assert.equal(defaultObjective("Intersection of 25th St SE and Minnesota Ave SE"), "Stop repeat dumping at the intersection of 25th St SE and Minnesota Ave SE");
  assert.equal(defaultObjective("Martin Luther King Jr Ave SE"), "Stop repeat dumping on Martin Luther King Jr Ave SE");
  assert.equal(defaultObjective(null), "Stop repeat dumping here");
});

test("a refresh keeps the saved area, objective, observations and tasks exactly as they were", () => {
  let campaign = fresh();
  campaign = setObjective(campaign, "Get the lot cleared and fenced", NOW);
  campaign = addObservation(campaign, { kind: "resident", date: "2026-10-20", text: "Pile still there." }, { now: NOW, id: "o1" });
  campaign = addTask(campaign, { text: "Photograph it", owner: "Dana", due: "2026-10-25" }, { now: NOW, id: "t1" });
  campaign = confirmCampaign(campaign, NOW);

  const refreshed = { ...snapshot, retrievedAt: LATER.toISOString(), records: records.map(record => record.id === "B" ? { ...record, status: "Closed" } : record) };
  const next = reconcileCampaign(campaign, refreshed, LATER);

  assert.deepEqual(next.area, campaign.area);
  assert.equal(next.objective, "Get the lot cleared and fenced");
  assert.deepEqual(next.observations, campaign.observations);
  assert.deepEqual(next.tasks, campaign.tasks);
  assert.equal(next.source.retrievedAt, LATER.toISOString());
});

test("a status change after review is flagged and withdraws the request confirmation", () => {
  const confirmed = confirmCampaign(fresh(), NOW);
  assert.ok(confirmed.request.confirmedAt);
  const refreshed = { ...snapshot, retrievedAt: LATER.toISOString(), records: records.map(record => record.id === "B" ? { ...record, status: "Closed" } : record) };
  const next = reconcileCampaign(confirmed, refreshed, LATER);
  const b = next.evidence.find(item => item.id === "B");

  assert.equal(b.status, "Closed");
  assert.equal(b.changedSinceReview, true);
  assert.equal(b.previousStatus, "Open");
  assert.equal(next.evidence.find(item => item.id === "A").changedSinceReview, false);
  assert.equal(next.request.confirmedAt, null);
  assert.equal(canExportCampaign(next), false);
  assert.match(exportBlocker(next), /changed since your review/i);
  assert.match(buildCampaignMarkdown(next), /changed since review; was Open/);

  const reviewedAgain = confirmCampaign(next, LATER);
  assert.equal(canExportCampaign(reviewedAgain), true);
  assert.equal(reviewedAgain.evidence.find(item => item.id === "B").changedSinceReview, false);
});

test("status flags clear if the status returns to what was reviewed, and unchanged refreshes keep the confirmation", () => {
  const confirmed = confirmCampaign(fresh(), NOW);
  const same = reconcileCampaign(confirmed, { ...snapshot, retrievedAt: LATER.toISOString() }, LATER);
  assert.equal(same.request.confirmedAt, confirmed.request.confirmedAt);
  assert.equal(same.updatedAt, confirmed.updatedAt);

  const flipped = reconcileCampaign(confirmed, { ...snapshot, records: records.map(record => record.id === "A" ? { ...record, status: "Open" } : record) }, LATER);
  const reverted = reconcileCampaign(flipped, snapshot, LATER);
  assert.equal(reverted.evidence.find(item => item.id === "A").changedSinceReview, false);
});

test("a campaign record that left the snapshot window keeps its last seen status and is labeled", () => {
  const next = reconcileCampaign(confirmCampaign(fresh(), NOW), { ...snapshot, records: records.filter(record => record.id !== "A") }, LATER);
  const a = next.evidence.find(item => item.id === "A");
  assert.equal(a.status, "Closed");
  assert.equal(a.inLatestSnapshot, false);
  assert.ok(next.request.confirmedAt, "absence alone does not change the reviewed status");
  assert.match(buildCampaignMarkdown(next), /not in the latest 90-day snapshot/);
});

test("practice campaigns are not reconciled with live data and carry no official links", () => {
  const demoSnapshot = { ...snapshot, mode: "demo", records: records.map(record => ({ ...record, key: `request:DEMO-${record.id}` })) };
  const demoDraft = updateScope({ ...base, snapshot: demoSnapshot }, { center: null });
  const campaign = createCampaign(demoDraft, { now: NOW, id: "demo" });
  assert.equal(campaign.name, "Practice case (fictional)");
  assert.equal(reconcileCampaign(campaign, snapshot, LATER), campaign);
  const markdown = buildCampaignMarkdown(campaign);
  assert.doesNotMatch(markdown, /maps2\.dcgis\.dc\.gov/);
  assert.match(markdown, /Fictional demo sample/);
  assert.equal(sourceRecordUrl(campaign.evidence[0], "demo"), null);
});

test("removing evidence withdraws confirmation and removes the record from the brief, appendix and download", () => {
  const confirmed = confirmCampaign(fresh(), NOW);
  const next = removeEvidence(confirmed, "request:B", NOW);
  const markdown = buildCampaignMarkdown(next);

  assert.equal(next.request.confirmedAt, null);
  assert.equal(canExportCampaign(next), false);
  assert.ok(!markdown.includes("1950 NAYLOR ROAD SE"));
  assert.ok(!markdown.includes(sourceRecordUrl(records[1], "live")));
  assert.ok(markdown.includes("1941 NAYLOR ROAD SE"));
  assert.ok(markdown.includes(sourceRecordUrl(records[0], "live")));
  assert.equal(buildCampaignBriefContent(next).records.length, 2);
  assert.throws(() => confirmCampaign(removeEvidence(removeEvidence(removeEvidence(next, "request:A"), "request:C"), "request:D"), NOW), /at least one report/i);
});

test("editing the request withdraws confirmation; observations and tasks do not", () => {
  const confirmed = confirmCampaign(fresh(), NOW);
  assert.equal(setRequestText(confirmed, "New wording", NOW).request.confirmedAt, null);
  const withFollowUp = addObservation(confirmed, { kind: "followup", date: "2026-10-22", text: "Checked again." }, { now: NOW, id: "o" });
  assert.equal(withFollowUp.request.confirmedAt, confirmed.request.confirmedAt);
  assert.equal(addTask(withFollowUp, { text: "Call 311" }, { now: NOW, id: "t" }).request.confirmedAt, confirmed.request.confirmedAt);
  assert.throws(() => confirmCampaign(setRequestText(confirmed, "  ", NOW), NOW), /write the request/i);
});

test("observations are typed, dated and kept apart from city status", () => {
  let campaign = fresh();
  assert.throws(() => addObservation(campaign, { kind: "rumor", date: "2026-10-20", text: "x" }), /kind/i);
  assert.throws(() => addObservation(campaign, { kind: "resident", date: "2026-13-40", text: "x" }), /date/i);
  assert.throws(() => addObservation(campaign, { kind: "resident", date: "", text: "x" }), /date/i);
  assert.throws(() => addObservation(campaign, { kind: "resident", date: "2026-10-20", text: "   " }), /observed/i);

  campaign = addObservation(campaign, { kind: "followup", date: "2026-10-22", text: "Second visit: cleared." }, { now: NOW, id: "o2" });
  campaign = addObservation(campaign, { kind: "resident", date: "2026-10-20", text: "First visit: pile at the corner." }, { now: NOW, id: "o1" });
  campaign = addObservation(campaign, { kind: "agency", date: "2026-10-21", text: "DPW says crew scheduled.", fictional: true }, { now: NOW, id: "o3" });
  const content = buildCampaignBriefContent(campaign);

  assert.deepEqual(content.observations.map(item => item.kindLabel), ["Resident observation", "Agency response", "Follow-up observation"]);
  assert.equal(content.resident.text, "Second visit: cleared.", "latest resident-side entry; agency responses do not count as verification");
  assert.equal(content.records.every(record => record.status !== "Cleared"), true, "an observation never rewrites the official status");
  const markdown = buildCampaignMarkdown(campaign);
  assert.match(markdown, /## City ticket status \(as published\)/);
  assert.match(markdown, /## Resident verification and follow-ups/);
  assert.match(markdown, /Agency response\*\* \(2026-10-21\) \*\*\[FICTIONAL practice entry\]\*\*: DPW says crew scheduled/);
  assert.doesNotMatch(markdown.split("## Resident")[0], /Second visit/);
  assert.equal(removeObservation(campaign, "o1", NOW).observations.length, 2);
});

test("tasks have text, owner, due date and done, and changing them touches only that task", () => {
  let campaign = addTask(fresh(), { text: "Photograph the spot", owner: "Dana", due: "2026-10-25" }, { now: NOW, id: "t1" });
  campaign = addTask(campaign, { text: "Call 311" }, { now: NOW, id: "t2" });
  assert.throws(() => addTask(campaign, { text: "   " }), /task/i);
  assert.throws(() => addTask(campaign, { text: "x", due: "next week" }), /due date/i);
  campaign = updateTask(campaign, "t1", { done: true }, NOW);
  campaign = updateTask(campaign, "t2", { owner: "Sam", due: "2026-10-30" }, NOW);

  assert.deepEqual(campaign.tasks.map(task => [task.id, task.owner, task.due, task.done]), [["t1", "Dana", "2026-10-25", true], ["t2", "Sam", "2026-10-30", false]]);
  const content = buildCampaignBriefContent(campaign);
  assert.deepEqual(content.group, { reviewedAt: null, tasksDone: 1, tasksTotal: 2 });
  const markdown = buildCampaignMarkdown(campaign);
  assert.match(markdown, /- \[x\] Photograph the spot — owner: Dana; due: 2026-10-25/);
  assert.match(markdown, /- \[ \] Call 311 — owner: Sam; due: 2026-10-30/);
  assert.equal(removeTask(campaign, "t1", NOW).tasks.length, 1);
  assert.match(buildCampaignMarkdown(addTask(fresh(), { text: "No owner" }, { now: NOW, id: "x" })), /owner: Owner not assigned; due: No due date/);
});

test("changes apply to the campaign they target and leave the others alone", () => {
  const other = { ...fresh(), id: "c2", name: "Other" };
  const store = { ...emptyStore(), campaigns: [fresh(), other] };
  const updated = { ...store, campaigns: store.campaigns.map(campaign => campaign.id === "c2" ? addObservation(campaign, { kind: "resident", date: "2026-10-20", text: "Only here." }, { now: NOW, id: "o" }) : campaign) };
  assert.equal(updated.campaigns[0].observations.length, 0);
  assert.equal(updated.campaigns[1].observations.length, 1);
  const reconciled = reconcileStore(store, { ...snapshot, records: records.map(record => ({ ...record, status: "Open" })) }, LATER);
  assert.equal(reconciled.campaigns.length, 2);
  assert.equal(validateStore(reconciled).ok, true);
});

test("an export needs reviewed evidence and a request, then includes follow-ups and done tasks", () => {
  let campaign = fresh();
  assert.equal(canExportCampaign(campaign), false);
  assert.match(exportBlocker(campaign), /mark the campaign reviewed/i);
  campaign = confirmCampaign(campaign, NOW);
  assert.equal(canExportCampaign(campaign), true);
  const before = buildCampaignMarkdown(campaign);
  campaign = addObservation(campaign, { kind: "followup", date: "2026-10-22", text: "Group re-checked; pile gone." }, { now: NOW, id: "o" });
  campaign = addTask(campaign, { text: "Thank the crew", owner: "Dana" }, { now: NOW, id: "t" });
  campaign = updateTask(campaign, "t", { done: true }, NOW);
  const after = buildCampaignMarkdown(campaign);
  assert.notEqual(after, before);
  assert.match(after, /Group re-checked; pile gone/);
  assert.match(after, /Tasks done: 1 of 1/);
  assert.equal(canExportCampaign(campaign), true, "a follow-up does not undo the evidence review");
});

test("brief keeps source IDs, addresses, links, unknowns and literal user wording", () => {
  const unsafe = "[link](javascript:alert(1)) <img src=x>";
  let campaign = fresh();
  campaign = { ...campaign, evidence: campaign.evidence.map(item => item.id === "A" ? { ...item, status: null, date: null, id: null } : item) };
  campaign = addObservation(campaign, { kind: "resident", date: "2026-10-20", text: unsafe }, { now: NOW, id: "o" });
  campaign = setObjective(campaign, unsafe, NOW);
  const markdown = buildCampaignMarkdown(campaign);
  assert.match(markdown, /Status unavailable/);
  assert.match(markdown, /Date unavailable/);
  assert.match(markdown, /Request ID:\*\* Unavailable/);
  assert.doesNotMatch(markdown, /\[link\]\(javascript:/);
  assert.match(markdown, /javascript:alert/);
  assert.ok(markdown.includes(sourceRecordUrl(records[1], "live")));
  assert.equal(buildCampaignBriefContent(campaign).records.find(record => record.address === "1941 NAYLOR ROAD SE").sourceUrl, sourceRecordUrl({ objectId: records[0].objectId, id: null }, "live"));
});

test("validation rejects stores that would break reload", () => {
  const good = { ...emptyStore(), campaigns: [fresh()] };
  assert.equal(validateStore(good).ok, true);
  assert.equal(validateStore({ version: 2, campaigns: [] }).reason, "version");
  for (const mutate of [
    c => { c.area.radiusM = 0; }, c => { c.area.center = { lat: "x" }; }, c => { c.observations = [{ id: "o", kind: "resident", date: "bad", text: "t" }]; },
    c => { c.tasks = [{ id: "t", text: "x", owner: "", due: "nope", done: false }]; }, c => { c.evidence = [{ key: "a" }, { key: "a" }]; },
    c => { c.request = { text: 5, confirmedAt: null }; }, c => { c.source.mode = "other"; }
  ]) {
    const copy = structuredClone(good);
    mutate(copy.campaigns[0]);
    assert.equal(validateStore(copy).ok, false);
  }
});
