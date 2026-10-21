import assert from "node:assert/strict";
import test from "node:test";
import {
  buildArcGisUrl,
  distanceMeters,
  fetchArcGisSnapshot,
  normalizeFeatureSet,
  normalizeGeometry,
  recordsWithin,
  sourceRecordUrl,
  summarizeGeometry,
  suggestStreetGroups
} from "../lib/block-ops.mjs";

const featureSet = {
  exceededTransferLimit: false,
  features: [
    { attributes: { OBJECTID: 1, SERVICEREQUESTID: "REQ-1", SERVICECODEDESCRIPTION: "Illegal Dumping", ADDDATE: 1780000000000, SERVICEORDERSTATUS: "Closed", WARD: "Ward 8", STREETADDRESS: "1200 SAMPLE AVE SE" } },
    { attributes: { OBJECTID: 2, SERVICEREQUESTID: "REQ-2", SERVICECODEDESCRIPTION: "Illegal Dumping", ADDDATE: 1780100000000, SERVICEORDERSTATUS: "Open", WARD: "Ward 8", STREETADDRESS: "1250 Sample Ave SE" } },
    { attributes: { OBJECTID: 3, SERVICEREQUESTID: "REQ-3", SERVICECODEDESCRIPTION: "Illegal Dumping", ADDDATE: null, SERVICEORDERSTATUS: null, WARD: "Ward 8", STREETADDRESS: "44 OAK ST SE" } },
    { attributes: { OBJECTID: 4, SERVICEREQUESTID: "REQ-4", SERVICECODEDESCRIPTION: "Illegal Dumping", ADDDATE: 1780200000000, SERVICEORDERSTATUS: "Open", WARD: "Ward 8", STREETADDRESS: null } }
  ]
};

test("builds a bounded Ward 8 query with an explicit field allowlist", () => {
  const url = new URL(buildArcGisUrl(new Date("2026-10-21T16:00:00.000Z")));
  const where = url.searchParams.get("where");
  const fields = url.searchParams.get("outFields").split(",");

  assert.match(where, /WARD='Ward 8'/);
  assert.match(where, /SERVICECODEDESCRIPTION LIKE '%Dump%'/);
  assert.match(where, /ADDDATE >= TIMESTAMP '2026-07-24 00:00:00'/);
  assert.match(where, /ADDDATE < TIMESTAMP '2026-10-22 00:00:00'/);
  assert.equal(url.searchParams.get("resultRecordCount"), "1000");
  assert.equal(url.searchParams.get("orderByFields"), "OBJECTID");
  assert.equal(url.searchParams.get("returnGeometry"), "true");
  assert.equal(url.searchParams.get("outSR"), "4326");
  assert.ok(fields.includes("SERVICEREQUESTID"));
  assert.ok(fields.includes("ADDDATE"));
  assert.ok(fields.includes("SERVICEORDERSTATUS"));
  assert.ok(fields.includes("STREETADDRESS"));
  assert.ok(!fields.includes("DETAILS"));
  assert.ok(!fields.includes("INSPECTORNAME"));
  assert.ok(!fields.includes("LATITUDE"));
});

test("source links fall back to the quoted request ID when object ID is absent", () => {
  for (const objectId of [null, undefined, "", "   "]) {
    const url = new URL(sourceRecordUrl({ objectId, id: "REQ-'17" }, "live"));
    assert.equal(url.searchParams.get("where"), "SERVICEREQUESTID='REQ-''17'");
    assert.equal(url.hostname, "maps2.dcgis.dc.gov");
  }
});

test("source links prefer a positive integer object ID", () => {
  const url = new URL(sourceRecordUrl({ objectId: 123, id: "REQ-1" }, "live"));
  assert.equal(url.searchParams.get("where"), "OBJECTID=123");
  assert.equal(url.searchParams.get("returnGeometry"), "false");
  assert.ok(url.searchParams.get("outFields").split(",").includes("SERVICEREQUESTID"));
});

test("fictional records and missing identities do not receive official source links", () => {
  assert.equal(sourceRecordUrl({ objectId: 123, id: "DEMO-1" }, "demo"), null);
  assert.equal(sourceRecordUrl({ objectId: null, id: " " }, "live"), null);
});

test("preserves source IDs, dates, statuses, and missing values", () => {
  const records = normalizeFeatureSet(featureSet);

  assert.equal(records[0].id, "REQ-1");
  assert.equal(records[0].date, 1780000000000);
  assert.equal(records[0].status, "Closed");
  assert.equal(records[0].attributes.STREETADDRESS, "1200 SAMPLE AVE SE");
  assert.equal(records[2].date, null);
  assert.equal(records[2].status, null);
  assert.equal(records[3].address, null);
});

test("rejects truncated and malformed feature sets", () => {
  assert.throws(() => normalizeFeatureSet({ ...featureSet, exceededTransferLimit: true }), /transfer limit/i);
  assert.throws(() => normalizeFeatureSet({ features: null }), /feature list/i);
});

test("rejects duplicate record identities instead of hiding rows behind one selection key", () => {
  assert.throws(() => normalizeFeatureSet({ features: [
    featureSet.features[0],
    { attributes: { ...featureSet.features[1].attributes, SERVICEREQUESTID: "REQ-1" } }
  ] }), /duplicate record identifiers/i);

  assert.throws(() => normalizeFeatureSet({ features: [
    { attributes: { ...featureSet.features[0].attributes, SERVICEREQUESTID: null } },
    { attributes: { ...featureSet.features[1].attributes, SERVICEREQUESTID: null, OBJECTID: 1 } }
  ] }), /duplicate record identifiers/i);
});

test("suggests same-street records for review without grouping missing addresses", () => {
  const groups = suggestStreetGroups(normalizeFeatureSet(featureSet));
  const grouped = groups.find(group => group.records.some(record => record.id === "REQ-1"));
  const missingAddress = groups.find(group => group.records.some(record => record.id === "REQ-4"));

  assert.equal(grouped.records.length, 2);
  assert.match(grouped.explanation, /candidate only/i);
  assert.equal(missingAddress.records.length, 1);
  assert.match(missingAddress.explanation, /unavailable/i);
});

test("orders candidate history by source date with undated records last", () => {
  const reversed = normalizeFeatureSet({ ...featureSet, features: [...featureSet.features].reverse() });
  const group = suggestStreetGroups(reversed).find(candidate => candidate.records.length > 1);

  assert.deepEqual(group.records.map(record => record.id), ["REQ-1", "REQ-2"]);
});

test("reports source fetch failure for the caller to recover from", async () => {
  await assert.rejects(
    fetchArcGisSnapshot(async () => { throw new Error("offline"); }, new Date("2026-10-21T16:00:00.000Z")),
    /DC 311 request failed/i
  );
});

test("keeps valid WGS84 points as lon/lat and counts missing and invalid geometry", () => {
  const withGeometry = geometries => normalizeFeatureSet({
    spatialReference: { wkid: 4326 },
    features: geometries.map((geometry, index) => ({ attributes: { OBJECTID: index + 1, SERVICEREQUESTID: `G-${index}` }, geometry }))
  });
  const records = withGeometry([
    { x: -76.9719, y: 38.8478 },
    undefined,
    { x: 38.8478, y: -76.9719 },
    { x: 402438.66, y: 131109.08 },
    { x: 0, y: 0 },
    { x: "NaN", y: "NaN" }
  ]);

  assert.deepEqual(records[0].geo, { lon: -76.9719, lat: 38.8478 });
  assert.deepEqual(records.slice(1).map(record => record.geoStatus), ["missing", "invalid", "invalid", "invalid", "invalid"]);
  assert.ok(records.slice(1).every(record => record.geo === null));
  assert.deepEqual(summarizeGeometry(records), { total: 6, mapped: 1, missing: 1, invalid: 4 });
  assert.equal(records.length, 6, "records without usable geometry stay in the list");
  assert.equal(normalizeGeometry({ x: -77.2, y: 38.9 }).geoStatus, "invalid");
});

test("rejects coordinates that are not WGS84 instead of plotting them", () => {
  assert.throws(() => normalizeFeatureSet({ spatialReference: { wkid: 3857 }, features: [] }), /not WGS84/i);
});

test("live snapshot reports geometry counts alongside the records", async () => {
  const fetchImpl = async () => ({ ok: true, json: async () => ({
    spatialReference: { wkid: 4326 },
    features: [
      { attributes: { OBJECTID: 1, SERVICEREQUESTID: "A" }, geometry: { x: -76.97, y: 38.85 } },
      { attributes: { OBJECTID: 2, SERVICEREQUESTID: "B" } }
    ]
  }) });
  const snapshot = await fetchArcGisSnapshot(fetchImpl, new Date("2026-10-21T16:00:00.000Z"));
  assert.deepEqual(snapshot.geometry, { total: 2, mapped: 1, missing: 1, invalid: 0 });
});

test("proximity selection uses real distance and skips records without a usable point", () => {
  const center = { lon: -76.9719, lat: 38.8478 };
  const near = { key: "near", geo: { lon: -76.9725, lat: 38.8478 } }; // ~52 m west
  const far = { key: "far", geo: { lon: -76.9650, lat: 38.8478 } }; // ~600 m east
  const unmapped = { key: "none", geo: null };

  assert.ok(Math.abs(distanceMeters(center, near.geo) - 52) < 3);
  assert.deepEqual(recordsWithin([near, far, unmapped], center, 150).map(record => record.key), ["near"]);
});
