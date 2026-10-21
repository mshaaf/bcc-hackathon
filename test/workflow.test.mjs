import assert from "node:assert/strict";
import test from "node:test";
import {
  buildBriefContent,
  buildBriefMarkdown,
  canExportBrief,
  confirmSourceReview,
  refreshDraft,
  selectCandidateGroup,
  sourceRecordUrl,
  suggestStreetGroups,
  setRecordIncluded
} from "../lib/block-ops.mjs";

const records = [
  { key: "request:REQ-1", id: "REQ-1", date: 1790870400000, status: "Closed", agency: "DPW", ward: "Ward 8", category: "Illegal Dumping", address: "100 SAMPLE AVE SE", attributes: { SERVICEREQUESTID: "REQ-1" } },
  { key: "request:REQ-2", id: "REQ-2", date: 1791043200000, status: "Open", agency: "DPW", ward: "Ward 8", category: "Illegal Dumping", address: "200 SAMPLE AVE SE", attributes: { SERVICEREQUESTID: "REQ-2" } }
];

const draft = {
  snapshot: {
    mode: "live",
    sourceUrl: "https://maps2.dcgis.dc.gov/dcgis/rest/services/DCGIS_DATA/ServiceRequests/FeatureServer/21",
    retrievedAt: "2026-10-21T16:00:00.000Z",
    window: { start: "2026-07-24", endExclusive: "2026-10-22" },
    records
  },
  selectedIds: new Set(records.map(record => record.key)),
  reviewConfirmed: true,
  refreshError: "",
  observation: "The group checked the corner and did not see the pile.",
  observedOn: "2026-10-20",
  ask: "Please share a dated update.",
  tasks: [
    { role: "Coordinator", task: "Bring the brief to the meeting." },
    { role: "Records keeper", task: "Check the next public update." }
  ]
};

test("removing a source record changes the brief and invalidates review", () => {
  const changedDraft = setRecordIncluded(draft, "request:REQ-2", false);
  const brief = buildBriefMarkdown(changedDraft);

  assert.equal(changedDraft.reviewConfirmed, false);
  assert.match(brief, /REQ-1/);
  assert.doesNotMatch(brief, /REQ-2/);
  assert.match(brief, /Please share a dated update/);
  assert.match(brief, /Bring the brief to the meeting/);
  assert.equal(canExportBrief(changedDraft), false);
});

test("export retains selected addresses and direct sources while excluding removed evidence", () => {
  const changed = setRecordIncluded(draft, records[1].key, false);
  const content = buildBriefContent(changed);
  const markdown = buildBriefMarkdown(changed);
  const keptUrl = sourceRecordUrl(records[0], "live");
  const removedUrl = sourceRecordUrl(records[1], "live");

  assert.equal(content.records.length, 1);
  assert.equal(content.records[0].address, "100 SAMPLE AVE SE");
  assert.equal(content.records[0].sourceUrl, keptUrl);
  assert.ok(markdown.includes("100 SAMPLE AVE SE"));
  assert.ok(markdown.includes(`[Original source record](${keptUrl})`));
  assert.ok(!markdown.includes("REQ-2"));
  assert.ok(!markdown.includes("200 SAMPLE AVE SE"));
  assert.ok(!markdown.includes(removedUrl));

  const demoDraft = { ...changed, snapshot: { ...changed.snapshot, mode: "demo" } };
  assert.equal(buildBriefContent(demoDraft).records[0].sourceUrl, null);
  assert.doesNotMatch(buildBriefMarkdown(demoDraft), /maps2\.dcgis\.dc\.gov/);
});

test("a failed refresh preserves the current reviewed draft", async () => {
  const refreshed = await refreshDraft(draft, async () => { throw new Error("network down"); });

  assert.equal(refreshed.snapshot, draft.snapshot);
  assert.equal(refreshed.selectedIds, draft.selectedIds);
  assert.equal(refreshed.reviewConfirmed, true);
  assert.equal(refreshed.observation, draft.observation);
  assert.equal(refreshed.observedOn, draft.observedOn);
  assert.equal(refreshed.ask, draft.ask);
  assert.match(refreshed.refreshError, /network down/);
});

test("a successful refresh resets source selection, review, and context-specific observation", async () => {
  const nextSnapshot = { ...draft.snapshot, records: [records[1]] };
  const refreshed = await refreshDraft(draft, async () => nextSnapshot);

  assert.equal(refreshed.snapshot, nextSnapshot);
  assert.equal(refreshed.reviewConfirmed, false);
  assert.equal(refreshed.selectedIds.size, 1);
  assert.equal(refreshed.selectedIds.has("request:REQ-2"), true);
  assert.equal(refreshed.observation, "");
  assert.equal(refreshed.observedOn, "");
  assert.doesNotMatch(buildBriefMarkdown(refreshed), /The group checked the corner/);
});

test("switching candidate groups clears the previous location's observation and date", () => {
  const otherRecord = { ...records[1], key: "request:REQ-OTHER", id: "REQ-OTHER", address: "100 OTHER ST SE" };
  const allRecords = [...records, otherRecord];
  const groupedDraft = { ...draft, snapshot: { ...draft.snapshot, records: allRecords }, groups: suggestStreetGroups(allRecords) };
  const otherGroup = groupedDraft.groups.find(group => group.records.some(record => record.key === otherRecord.key));
  const changed = selectCandidateGroup(groupedDraft, otherGroup.key);

  assert.equal(changed.reviewConfirmed, false);
  assert.deepEqual([...changed.selectedIds], [otherRecord.key]);
  assert.equal(changed.observation, "");
  assert.equal(changed.observedOn, "");
  assert.equal(changed.ask, draft.ask);
  assert.equal(groupedDraft.observation, draft.observation);
  assert.doesNotMatch(buildBriefMarkdown(changed), /The group checked the corner/);
});

test("exports only after source review and required plan fields are complete", () => {
  assert.equal(canExportBrief(draft), true);
  assert.equal(canExportBrief({ ...draft, selectedIds: new Set() }), false);
  assert.equal(canExportBrief({ ...draft, ask: " " }), false);
  assert.equal(canExportBrief({ ...draft, tasks: [draft.tasks[0]] }), false);
  assert.equal(canExportBrief({ ...draft, reviewConfirmed: false }), false);
  assert.equal(canExportBrief(confirmSourceReview({ ...draft, selectedIds: new Set() })), false);
});

test("keeps missing source date, status, and current conditions unknown", () => {
  const incompleteDraft = {
    ...draft,
    snapshot: { ...draft.snapshot, records: [{ ...records[0], date: null, status: null }] },
    selectedIds: new Set([records[0].key]),
    observation: ""
  };
  const brief = buildBriefMarkdown(incompleteDraft);

  assert.match(brief, /Date unavailable/);
  assert.match(brief, /Status unavailable/);
  assert.match(brief, /current conditions are unverified/i);
});

test("keeps user wording literal in the downloadable Markdown", () => {
  const unsafeText = "[link](javascript:alert(1))";
  const brief = buildBriefMarkdown({ ...draft, observation: unsafeText });

  assert.doesNotMatch(brief, /\[link\]\(javascript:/i);
  assert.match(brief, /javascript:alert/);
});

test("does not create a brief with no selected source records", () => {
  assert.throws(() => buildBriefMarkdown({ ...draft, selectedIds: new Set() }), /no source records/i);
});
