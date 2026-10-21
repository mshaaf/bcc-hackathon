import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { snapshotFromRecording, sourceRecordUrl } from "../lib/block-ops.mjs";

const real = () => JSON.parse(readFileSync(new URL("../data/recorded-snapshot.json", import.meta.url), "utf8"));
const ring = [[-76.99, 38.83], [-76.95, 38.83], [-76.95, 38.88], [-76.99, 38.88], [-76.99, 38.83]];
const tiny = extra => ({
  format: 1, recordedAt: "2026-10-21T19:00:00.000Z", retrievedAt: "2026-10-21T18:59:00.000Z", window: { start: "2026-07-24", endExclusive: "2026-10-22" },
  spatialReference: { wkid: 4326 }, boundary: { retrievedAt: "2026-10-21T18:59:00.000Z", rings: [ring] },
  features: [
    { attributes: { OBJECTID: 1, SERVICEREQUESTID: "REQ-1", SERVICEORDERSTATUS: "Closed", STREETADDRESS: "100 TEST ST SE", WARD: "Ward 8" }, geometry: { x: -76.97, y: 38.85 } },
    { attributes: { OBJECTID: 2, SERVICEREQUESTID: "REQ-2", SERVICEORDERSTATUS: "Open", STREETADDRESS: "200 TEST ST SE", WARD: "Ward 8" }, geometry: { x: -76.90, y: 38.85 } },
    { attributes: { OBJECTID: 3, SERVICEREQUESTID: "REQ-3", STREETADDRESS: null } }
  ], ...extra
});

test("a recording loads as mode recorded, never live, with the original retrieval time and boundary flags", () => {
  const snapshot = snapshotFromRecording(tiny());
  assert.equal(snapshot.mode, "recorded");
  assert.equal(snapshot.retrievedAt, "2026-10-21T18:59:00.000Z");
  assert.equal(snapshot.recordedAt, "2026-10-21T19:00:00.000Z");
  assert.deepEqual(snapshot.geometry, { total: 3, mapped: 2, missing: 1, invalid: 0 });
  assert.deepEqual(snapshot.records.map(record => record.outsideWard), [false, true, null]);
  assert.deepEqual({ ...snapshot.boundary, retrievedAt: undefined }, { status: "checked", retrievedAt: undefined, inside: 1, outside: 1, unchecked: 1 });
});

test("recorded real records keep their official source links; fictional ones still never do", () => {
  const [record] = snapshotFromRecording(tiny()).records;
  assert.match(sourceRecordUrl(record, "recorded"), /maps2\.dcgis\.dc\.gov.*OBJECTID%3D1/);
  assert.equal(sourceRecordUrl(record, "demo"), null);
});

test("a malformed or unknown recording is refused instead of shown", () => {
  assert.throws(() => snapshotFromRecording(tiny({ format: 2 })), /format/i);
  assert.throws(() => snapshotFromRecording(tiny({ recordedAt: "nope" })), /retrieval time/i);
  assert.throws(() => snapshotFromRecording(tiny({ window: null })), /window/i);
  assert.throws(() => snapshotFromRecording(tiny({ boundary: { rings: [[[1, 2]]] } })), /boundary/i);
  assert.throws(() => snapshotFromRecording(tiny({ features: null })), /feature list/i);
  const duplicate = tiny();
  duplicate.features.push(duplicate.features[0]);
  assert.throws(() => snapshotFromRecording(duplicate), /duplicate record identifiers/i);
  assert.throws(() => snapshotFromRecording(null), /format/i);
});

test("the committed real recording loads: 390-ish real records, all mapped, boundary checked", () => {
  const snapshot = snapshotFromRecording(real());
  assert.equal(snapshot.mode, "recorded");
  assert.ok(snapshot.records.length > 300);
  assert.equal(snapshot.geometry.invalid, 0);
  assert.equal(snapshot.boundary.status, "checked");
  assert.ok(snapshot.records.every(record => record.ward === "Ward 8" && /dump/i.test(record.category ?? "")));
});
