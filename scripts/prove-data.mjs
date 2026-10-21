import assert from "node:assert/strict";
import { fetchArcGisSnapshot, suggestStreetGroups } from "../lib/block-ops.mjs";

try {
  const snapshot = await fetchArcGisSnapshot();
  const requestIds = snapshot.records.map(record => record.id).filter(Boolean);
  const candidateGroups = suggestStreetGroups(snapshot.records).filter(group => group.records.length > 1);

  assert.ok(snapshot.records.length > 0, "The bounded query must return records.");
  assert.equal(requestIds.length, snapshot.records.length, "Every returned record must retain its service request ID.");
  assert.equal(new Set(requestIds).size, requestIds.length, "Service request IDs must be unique in the returned set.");
  assert.ok(snapshot.records.every(record => record.ward === "Ward 8" && /dump/i.test(record.category || "")), "Every returned record must match the requested ward and category.");
  assert.ok(candidateGroups.length > 0, "The query must demonstrate at least one explainable candidate group.");

  console.log(JSON.stringify({
    source: snapshot.sourceUrl,
    retrieval: "live",
    retrievedAt: snapshot.retrievedAt,
    window: snapshot.window,
    records: snapshot.records.length,
    uniqueRequestIds: requestIds.length,
    multiRecordStreetCandidates: candidateGroups.length,
    transferLimit: false,
    interpretation: "Candidate groups share a normalized street name and category; they do not establish one incident or recurrence."
  }, null, 2));
} catch (error) {
  console.error(`Live DC 311 proof failed: ${error.message}`);
  process.exitCode = 1;
}
