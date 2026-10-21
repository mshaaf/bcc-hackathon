import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_SCOPE,
  applyWardBoundary,
  areaBlockName,
  blockName,
  buildBriefContent,
  buildBriefMarkdown,
  candidateRecords,
  describeScope,
  fetchWardBoundary,
  filterRecords,
  findBusySpots,
  pointInRings,
  refreshWorkspace,
  setRecordIncluded,
  sinceForDays,
  statusKind,
  unplacedRecords,
  updateScope
} from "../lib/block-ops.mjs";

const NOW = new Date("2026-10-21T16:00:00.000Z");
const day = (offset, hour = 12) => Date.UTC(2026, 9, 21 + offset, hour + 4); // noon America/New_York (EDT)

// Three reports within ~60 m on one block, one far away, one with no usable point, one with no date.
const make = (id, over) => ({ key: `request:${id}`, id, objectId: id.length, category: "Illegal Dumping", agency: "DPW", ward: "Ward 8", attributes: { SERVICEREQUESTID: id }, geoStatus: "ok", ...over });
const records = [
  make("A", { address: "1941 NAYLOR ROAD SE", status: "Closed", date: day(-40), geo: { lon: -76.9719, lat: 38.8478 } }),
  make("B", { address: "1950 NAYLOR ROAD SE", status: "Open", date: day(-5), geo: { lon: -76.9722, lat: 38.8479 } }),
  make("C", { address: "1900 - 1999 BLOCK OF NAYLOR ROAD SE", status: "Closed (Duplicate)", date: day(-2), geo: { lon: -76.9716, lat: 38.8477 } }),
  make("D", { address: "300 FAR ST SE", status: "Closed", date: day(-3), geo: { lon: -76.9400, lat: 38.8300 } }),
  make("E", { address: "SOMEWHERE SE", status: "Open", date: day(-1), geo: null, geoStatus: "missing" }),
  make("F", { address: "1960 NAYLOR ROAD SE", status: null, date: null, geo: { lon: -76.9720, lat: 38.8478 } })
];
const snapshot = { mode: "live", sourceUrl: "https://example.test/layer", retrievedAt: NOW.toISOString(), window: { start: "2026-07-24", endExclusive: "2026-10-22" }, records };
const base = { snapshot, ...structuredClone({ area: DEFAULT_SCOPE.area }), filters: { days: null, kinds: new Set(["open", "closed", "other"]) }, selectedIds: new Set(), reviewConfirmed: false, observation: "", observedOn: "", ask: "Please share a dated update.", tasks: [{ role: "Lead", task: "Bring it." }, { role: "Keeper", task: "Check it." }] };
const center = { lon: -76.9720, lat: 38.8478 };

test("point-in-polygon honours holes and rejects outside points", () => {
  const outer = [[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]];
  const hole = [[4, 4], [6, 4], [6, 6], [4, 6], [4, 4]];
  assert.equal(pointInRings([outer], 5, 5), true);
  assert.equal(pointInRings([outer, hole], 5, 5), false);
  assert.equal(pointInRings([outer, hole], 2, 2), true);
  assert.equal(pointInRings([outer], 11, 5), false);
});

test("ward boundary flags outside points, leaves unmapped unchecked, and counts them", () => {
  const rings = [[[-76.975, 38.845], [-76.968, 38.845], [-76.968, 38.850], [-76.975, 38.850], [-76.975, 38.845]]];
  const flagged = applyWardBoundary(snapshot, { retrievedAt: "t", rings });
  const byId = Object.fromEntries(flagged.records.map(record => [record.id, record.outsideWard]));

  assert.deepEqual(byId, { A: false, B: false, C: false, D: true, E: null, F: false });
  assert.deepEqual({ ...flagged.boundary, retrievedAt: undefined }, { status: "checked", retrievedAt: undefined, inside: 4, outside: 1, unchecked: 1 });
  assert.equal(snapshot.records[3].outsideWard, undefined, "source snapshot is not mutated");

  const unavailable = applyWardBoundary(snapshot, null);
  assert.equal(unavailable.boundary.status, "unavailable");
  assert.ok(unavailable.records.every(record => record.outsideWard !== true));
});

test("ward boundary fetch accepts one valid polygon and rejects anything else", async () => {
  const good = { spatialReference: { wkid: 4326 }, features: [{ geometry: { rings: [[[-76.99, 38.83], [-76.95, 38.83], [-76.95, 38.88], [-76.99, 38.88], [-76.99, 38.83]]] } }] };
  let requested;
  const boundary = await fetchWardBoundary(async url => { requested = new URL(url); return { ok: true, json: async () => good }; }, NOW);
  assert.equal(requested.hostname, "maps2.dcgis.dc.gov");
  assert.equal(requested.searchParams.get("where"), "WARD=8");
  assert.equal(requested.searchParams.get("outSR"), "4326");
  assert.equal(boundary.rings.length, 1);

  const reject = body => assert.rejects(fetchWardBoundary(async () => ({ ok: true, json: async () => body }), NOW), /Ward 8 polygon|spatial reference|returned an error/);
  await reject({ features: [] });
  await reject({ features: [good.features[0], good.features[0]] });
  await reject({ features: [{ geometry: { rings: [[[402438, 131109], [402500, 131109], [402500, 131200], [402438, 131109]]] } }] });
  await reject({ spatialReference: { wkid: 3857 }, features: good.features });
  await reject({ error: { message: "boom" } });
  await assert.rejects(fetchWardBoundary(async () => { throw new Error("offline"); }, NOW), /Ward boundary request failed/);
});

test("status kinds and filters: open, closed, and everything else; unknown dates leave date-limited views", () => {
  assert.deepEqual(records.map(record => statusKind(record.status)), ["closed", "open", "other", "closed", "open", "other"]);
  const since30 = sinceForDays(30, NOW);
  assert.equal(since30, "2026-09-22");
  assert.deepEqual(filterRecords(records, { since: since30 }).map(record => record.id), ["B", "C", "D", "E"]);
  assert.deepEqual(filterRecords(records, { kinds: new Set(["open"]) }).map(record => record.id), ["B", "E"]);
  assert.equal(filterRecords(records, {}).length, records.length, "no filter keeps undated records");
  assert.equal(sinceForDays(null, NOW), null);
});

test("block names use the block, never a single house address", () => {
  assert.equal(blockName("1941 NAYLOR ROAD SE"), "1900 block of Naylor Rd SE");
  assert.equal(blockName("1900 - 1999 BLOCK OF NAYLOR ROAD SE"), "1900 block of Naylor Rd SE");
  assert.equal(blockName("25TH STREET SE AND MINNESOTA AVENUE SE"), "Intersection of 25th St SE and Minnesota Ave SE");
  assert.equal(blockName("MARTIN LUTHER KING JR AVENUE SE"), "Martin Luther King Jr Ave SE");
  assert.equal(blockName(null), null);
  assert.equal(blockName("  "), null);
});

test("busy spots rank dense places and do not overlap", () => {
  const spots = findBusySpots(records, 150, 5);
  assert.equal(spots[0].count, 4);
  assert.ok(["A", "B", "C", "F"].includes(spots[0].record.id));
  assert.equal(spots.length, 2, "the far record is the only other non-overlapping spot");
  assert.equal(spots[1].record.id, "D");
});

test("changing the area changes candidates, selection, brief inputs, and clears the site observation", () => {
  const near = updateScope({ ...base, observation: "We checked.", observedOn: "2026-10-20", reviewConfirmed: true }, { center });
  assert.deepEqual(candidateRecords(near).map(record => record.id), ["A", "B", "C", "F"], "oldest first, undated last");
  assert.equal(candidateRecords(near).length, 4);
  assert.equal(near.selectedIds.size, 4);
  assert.equal(near.reviewConfirmed, false);
  assert.equal(near.observation, "");
  assert.equal(areaBlockName(near), "1900 block of Naylor Rd SE");
  assert.match(buildBriefMarkdown(near), /A\b/);

  const far = updateScope(near, { center: { lon: -76.9400, lat: 38.8300 } });
  assert.deepEqual([...far.selectedIds], ["request:D"]);
  assert.doesNotMatch(buildBriefMarkdown(far), /NAYLOR/);
  assert.match(buildBriefMarkdown(far), /300 FAR ST SE/);
});

test("changing radius or filters changes the evidence, invalidates review, and keeps the observation", () => {
  const start = updateScope(base, { center: { lon: -76.9719, lat: 38.8478 }, radiusM: 10 });
  const confirmed = { ...start, reviewConfirmed: true, observation: "We checked.", observedOn: "2026-10-20" };
  assert.ok(candidateRecords(confirmed).length < 4);

  const wider = updateScope(confirmed, { radiusM: 250 });
  assert.equal(candidateRecords(wider).length, 4);
  assert.equal(wider.reviewConfirmed, false);
  assert.equal(wider.observation, "We checked.");

  const openOnly = updateScope(wider, { kinds: ["open"] });
  assert.deepEqual(candidateRecords(openOnly).map(record => record.id), ["B"]);
  assert.deepEqual([...openOnly.selectedIds], ["request:B"]);

  const recent = updateScope(wider, { days: 30 });
  assert.ok(!candidateRecords(recent).some(record => record.id === "A" || record.id === "F"));
  const brief = buildBriefContent(recent);
  assert.match(brief.scope, /last 30 days/);
  assert.match(brief.scope, /within 250 m of the 1900 block of Naylor Rd SE/);
});

test("a record the user excluded stays excluded across radius, date and status changes", () => {
  const scoped = updateScope(base, { center, radiusM: 250 });
  const excluded = setRecordIncluded(scoped, "request:B", false);

  const wider = updateScope(excluded, { radiusM: 150 });
  assert.equal(wider.selectedIds.has("request:B"), false, "radius change");
  assert.equal(updateScope(wider, { radiusM: 250 }).selectedIds.has("request:B"), false, "radius back");
  assert.equal(updateScope(wider, { days: 60 }).selectedIds.has("request:B"), false, "date change");

  const closedOnly = updateScope(wider, { kinds: ["closed"] }); // B is open, so it is filtered out here
  const allKinds = updateScope(closedOnly, { kinds: ["open", "closed", "other"] });
  assert.equal(allKinds.selectedIds.has("request:B"), false, "status filter off and on");
  assert.ok(allKinds.selectedIds.has("request:A"), "other records are still re-selected");
  assert.ok(!buildBriefMarkdown(allKinds).includes("1950 NAYLOR ROAD SE"));

  const reincluded = setRecordIncluded(allKinds, "request:B", true);
  assert.equal(updateScope(reincluded, { radiusM: 150 }).selectedIds.has("request:B"), true, "an explicit include is kept too");
});

test("exclusions are cleared when the area center moves or the source changes", async () => {
  const excluded = setRecordIncluded(updateScope(base, { center, radiusM: 250 }), "request:B", false);
  const moved = updateScope(excluded, { center: { lon: -76.9719, lat: 38.8478 } });
  assert.equal(moved.selectedIds.has("request:B"), true, "moving the area starts a fresh selection");

  const refreshed = await refreshWorkspace(excluded, async () => snapshot);
  assert.equal(refreshed.excludedIds.size, 0);
  assert.equal(refreshed.selectedIds.has("request:B"), true);
});

test("unplaced reports the user added survive scope changes while they still match the filters", () => {
  const added = setRecordIncluded(updateScope(base, { center, radiusM: 250 }), "request:E", true);
  assert.equal(updateScope(added, { radiusM: 100 }).selectedIds.has("request:E"), true);
  assert.equal(updateScope(added, { kinds: ["closed"] }).selectedIds.has("request:E"), false, "E is open, so the filter hides it");
});

test("reports without a usable point stay reachable and are never dropped", () => {
  const scoped = updateScope(base, { center, radiusM: 250 });
  assert.deepEqual(unplacedRecords(scoped).map(record => record.id), ["E"]);
  assert.ok(!candidateRecords(scoped).some(record => record.id === "E"));
  assert.equal(scoped.snapshot.records.length, 6);
  const included = setRecordIncluded(scoped, "request:E", true);
  assert.match(buildBriefMarkdown(included), /SOMEWHERE SE/);
  assert.deepEqual(unplacedRecords({ ...scoped, area: { center: null, radiusM: 150 } }), [], "with no area, everything is already a candidate");
});

test("brief marks outside-boundary points and states that locations are approximate", () => {
  const rings = [[[-76.975, 38.845], [-76.968, 38.845], [-76.968, 38.850], [-76.975, 38.850], [-76.975, 38.845]]];
  const flagged = applyWardBoundary(snapshot, { retrievedAt: "t", rings });
  const draft = updateScope({ ...base, snapshot: flagged }, { center: { lon: -76.9400, lat: 38.8300 } });
  const markdown = buildBriefMarkdown(draft);
  assert.match(markdown, /Location note:\*\* Map point is outside the Ward 8 boundary/);
  assert.match(markdown, /approximate block-level or intersection points/);
  assert.match(describeScope(draft), /within 150 m of the 300 block of Far St SE/);
});

test("refreshing the workspace starts on the busiest spot, and a failed refresh keeps the work", async () => {
  const loaded = await refreshWorkspace(base, async () => snapshot);
  assert.ok(loaded.area.center);
  assert.equal(loaded.selectedIds.size, 4);
  assert.equal(loaded.reviewConfirmed, false);

  const kept = { ...loaded, reviewConfirmed: true, observation: "Seen Tuesday", observedOn: "2026-10-20" };
  const failed = await refreshWorkspace(kept, async () => { throw new Error("outage"); });
  assert.equal(failed.snapshot, kept.snapshot);
  assert.equal(failed.selectedIds, kept.selectedIds);
  assert.equal(failed.area, kept.area);
  assert.equal(failed.reviewConfirmed, true);
  assert.equal(failed.observation, "Seen Tuesday");
  assert.match(failed.refreshError, /outage/);

  const noPoints = await refreshWorkspace(base, async () => ({ ...snapshot, records: records.map(record => ({ ...record, geo: null, geoStatus: "missing" })) }));
  assert.equal(noPoints.area.center, null, "no coordinates: no area, all records stay candidates");
  assert.equal(noPoints.selectedIds.size, 6);
});
