// Saves a real live DC 311 snapshot (and the Ward 8 boundary) to data/recorded-snapshot.json for venues without network.
// The app loads it only through the "Recorded DC 311 snapshot" button and always labels it recorded, never live.
import { writeFileSync } from "node:fs";
import { RECORDING_FORMAT, fetchArcGisSnapshot, fetchWardBoundary, snapshotFromRecording } from "../lib/block-ops.mjs";

const OUT = new URL("../data/recorded-snapshot.json", import.meta.url);

try {
  const recordedAt = new Date();
  const [snapshot, boundary] = await Promise.all([fetchArcGisSnapshot(globalThis.fetch, recordedAt), fetchWardBoundary(globalThis.fetch, recordedAt)]);
  const recording = {
    format: RECORDING_FORMAT,
    recordedAt: recordedAt.toISOString(),
    retrievedAt: snapshot.retrievedAt,
    window: snapshot.window,
    sourceUrl: snapshot.sourceUrl,
    note: "Real DC 311 service requests (Ward 8, illegal dumping) saved from the live service at the retrieval time above. Not live data.",
    spatialReference: { wkid: 4326 },
    boundary: { retrievedAt: boundary.retrievedAt, rings: boundary.rings },
    features: snapshot.records.map(record => ({ attributes: record.attributes, ...(record.geo ? { geometry: { x: record.geo.lon, y: record.geo.lat } } : {}) }))
  };
  snapshotFromRecording(recording); // prove it loads before saving
  writeFileSync(OUT, `${JSON.stringify(recording)}\n`);
  console.log(JSON.stringify({ saved: "data/recorded-snapshot.json", retrievedAt: recording.retrievedAt, window: recording.window, records: recording.features.length, geometry: snapshot.geometry }, null, 2));
} catch (error) {
  console.error(`Recording failed: ${error.message}`);
  process.exitCode = 1;
}
