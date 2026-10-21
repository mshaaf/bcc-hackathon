// Saved campaigns: pure data functions (no DOM, no storage). A campaign keeps three accounts apart:
// the city's ticket status (source data), the group's progress, and resident verification (dated observations).
import { areaBlockName, formatSourceDate, markdownText, sourceDateValue, sourceRecordUrl, KIND_LABELS } from "./block-ops.mjs";
import { areaRecurrence, recurrenceHeadline } from "./recurrence.mjs";

export const STORE_VERSION = 1;
export const OBSERVATION_KINDS = { resident: "Resident observation", followup: "Follow-up observation", agency: "Agency response" };
export const LASTING_FIXES = {
  camera: "Enforcement camera", signage: "Signage", bulk: "Bulk pickup outreach", lighting: "Lighting",
  cleanup: "Scheduled cleanup + check-in", other: "Other (describe below)"
};
export const DEFAULT_ESCALATION = { recipient: "", fix: "", fixOther: "" };
export const DEFAULT_REQUEST = "Please share a dated update for the reports the group reviewed.";

export const emptyStore = () => ({ version: STORE_VERSION, campaigns: [] });

const iso = now => new Date(now).toISOString();
const newId = () => globalThis.crypto.randomUUID();
const text = value => (typeof value === "string" ? value : "");

export function isValidDay(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function defaultObjective(name) {
  if (!name) return "Stop repeat dumping here";
  const intersection = /^Intersection of (.+)$/.exec(name);
  if (intersection) return `Stop repeat dumping at the intersection of ${intersection[1]}`;
  return /\bblock of\b/.test(name) ? `Stop repeat dumping on the ${name}` : `Stop repeat dumping on ${name}`;
}

function evidenceFrom(record) {
  return {
    key: record.key, id: record.id ?? null, objectId: record.objectId ?? null, category: record.category ?? null,
    address: record.address ?? null, date: record.date ?? null, status: record.status ?? null, agency: record.agency ?? null,
    ward: record.ward ?? null, geo: record.geo ?? null, outsideWard: record.outsideWard ?? null,
    reviewedStatus: null, previousStatus: null, changedSinceReview: false, inLatestSnapshot: true
  };
}

// "New campaign here": the current area, filters and selection become a saved campaign.
export function createCampaign(draft, { now = new Date(), id = newId() } = {}) {
  const selected = (draft.snapshot?.records ?? []).filter(record => draft.selectedIds.has(record.key))
    .sort((left, right) => sourceDateValue(left.date) - sourceDateValue(right.date));
  if (!selected.length) throw new Error("Select at least one report before creating a campaign.");
  const demo = draft.snapshot.mode === "demo";
  const name = demo ? "Practice case (fictional)" : (areaBlockName(draft) ?? "Selected reports");
  return {
    id, name, objective: demo ? "Practice objective (fictional)" : defaultObjective(name),
    createdAt: iso(now), updatedAt: iso(now),
    source: { mode: draft.snapshot.mode, sourceUrl: draft.snapshot.sourceUrl ?? null, retrievedAt: draft.snapshot.retrievedAt ?? null, window: draft.snapshot.window ?? null },
    area: { center: draft.area?.center ?? null, radiusM: draft.area?.radiusM ?? 150 },
    filters: { days: draft.filters?.days ?? null, kinds: [...(draft.filters?.kinds ?? Object.keys(KIND_LABELS))] },
    evidence: selected.map(evidenceFrom),
    observations: [],
    request: { text: DEFAULT_REQUEST, confirmedAt: null },
    escalation: { ...DEFAULT_ESCALATION },
    tasks: []
  };
}

// Campaigns saved before a field existed load with its default.
export const normalizeCampaign = campaign => ({ ...campaign, escalation: { ...DEFAULT_ESCALATION, ...(campaign.escalation ?? {}) } });
export const normalizeStore = store => ({ ...store, campaigns: store.campaigns.map(normalizeCampaign) });

const stamp = (campaign, now) => ({ ...campaign, updatedAt: iso(now) });

export const setObjective = (campaign, value, now = new Date()) => stamp({ ...campaign, objective: text(value) }, now);

// Reworded request: the group has not reviewed the new words.
export const setRequestText = (campaign, value, now = new Date()) =>
  stamp({ ...campaign, request: { text: text(value), confirmedAt: null } }, now);

// Who the group is asking, and for what lasting fix. Nothing is sent; changing the ask withdraws the review.
export function setEscalation(campaign, patch, now = new Date()) {
  const next = { ...DEFAULT_ESCALATION, ...campaign.escalation, ...patch };
  if (next.fix !== "" && !LASTING_FIXES[next.fix]) throw new Error("Choose one of the listed lasting fixes.");
  return stamp({ ...campaign, escalation: { recipient: text(next.recipient), fix: next.fix, fixOther: text(next.fixOther) }, request: { ...campaign.request, confirmedAt: null } }, now);
}

export function removeEvidence(campaign, key, now = new Date()) {
  return stamp({ ...campaign, evidence: campaign.evidence.filter(item => item.key !== key), request: { ...campaign.request, confirmedAt: null } }, now);
}

export function confirmCampaign(campaign, now = new Date()) {
  if (!campaign.evidence.length) throw new Error("A campaign needs at least one report before it can be marked reviewed.");
  if (!campaign.request.text.trim()) throw new Error("Write the request before marking the campaign reviewed.");
  const evidence = campaign.evidence.map(item => ({ ...item, reviewedStatus: item.status, previousStatus: null, changedSinceReview: false }));
  return stamp({ ...campaign, evidence, request: { ...campaign.request, confirmedAt: iso(now) } }, now);
}

export function addObservation(campaign, { kind, date, text: body, fictional = false }, { now = new Date(), id = newId() } = {}) {
  if (!OBSERVATION_KINDS[kind]) throw new Error("Choose what kind of observation this is.");
  if (!isValidDay(date)) throw new Error("Add the date of the observation (YYYY-MM-DD).");
  if (!text(body).trim()) throw new Error("Write what was observed.");
  return stamp({ ...campaign, observations: [...campaign.observations, { id, kind, date, text: body, fictional: Boolean(fictional) }] }, now);
}

export const removeObservation = (campaign, id, now = new Date()) =>
  stamp({ ...campaign, observations: campaign.observations.filter(item => item.id !== id) }, now);

export function addTask(campaign, { text: body, owner = "", due = "" }, { now = new Date(), id = newId() } = {}) {
  if (!text(body).trim()) throw new Error("Describe the task.");
  if (due && !isValidDay(due)) throw new Error("The due date must be a valid date.");
  return stamp({ ...campaign, tasks: [...campaign.tasks, { id, text: body, owner: text(owner), due: due || "", done: false }] }, now);
}

export function updateTask(campaign, id, patch, now = new Date()) {
  if (patch.due && !isValidDay(patch.due)) throw new Error("The due date must be a valid date.");
  return stamp({ ...campaign, tasks: campaign.tasks.map(task => task.id === id ? { ...task, ...patch } : task) }, now);
}

export const removeTask = (campaign, id, now = new Date()) =>
  stamp({ ...campaign, tasks: campaign.tasks.filter(task => task.id !== id) }, now);

// A source refresh may only update evidence status. It never moves the area or touches observations, tasks or
// the objective. A reviewed record whose status changed is flagged and the confirmation is withdrawn.
export function reconcileCampaign(campaign, snapshot, now = new Date()) {
  if (!snapshot?.records || snapshot.mode !== campaign.source.mode || snapshot.mode !== "live") return campaign;
  const byKey = new Map(snapshot.records.map(record => [record.key, record]));
  let anyChanged = false;
  const evidence = campaign.evidence.map(item => {
    const record = byKey.get(item.key);
    if (!record) return { ...item, inLatestSnapshot: false };
    const statusNow = record.status ?? null;
    if (item.reviewedStatus === null) return { ...item, status: statusNow, inLatestSnapshot: true };
    const changed = statusNow !== item.reviewedStatus;
    if (changed) anyChanged = true;
    return { ...item, status: statusNow, inLatestSnapshot: true, changedSinceReview: changed, previousStatus: changed ? item.reviewedStatus : null };
  });
  return {
    ...campaign, evidence,
    source: { ...campaign.source, retrievedAt: snapshot.retrievedAt ?? campaign.source.retrievedAt, window: snapshot.window ?? campaign.source.window },
    request: anyChanged ? { ...campaign.request, confirmedAt: null } : campaign.request,
    updatedAt: anyChanged ? iso(now) : campaign.updatedAt
  };
}

export const reconcileStore = (store, snapshot, now = new Date()) =>
  ({ ...store, campaigns: store.campaigns.map(campaign => reconcileCampaign(campaign, snapshot, now)) });

export function exportBlocker(campaign) {
  if (!campaign.evidence.length) return "Add at least one report to this campaign.";
  if (campaign.evidence.some(item => item.changedSinceReview)) return "A report's city status changed since your review. Review the changes, then mark the campaign reviewed.";
  if (!campaign.request.text.trim()) return "Write the request.";
  if (!campaign.request.confirmedAt) return "Mark the campaign reviewed before downloading or printing.";
  return "";
}
export const canExportCampaign = campaign => exportBlocker(campaign) === "";

const shortDay = value => new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "America/New_York" }).format(new Date(value));

function askLines(escalation) {
  const fix = escalation.fix ? LASTING_FIXES[escalation.fix] : "";
  const other = escalation.fixOther.trim();
  return {
    recipient: escalation.recipient.trim() || "Not chosen yet",
    fix: !fix ? "Not chosen yet" : escalation.fix === "other" ? (other ? `Other: ${other}` : "Other (not described yet)") : (other ? `${fix} (${other})` : fix)
  };
}

export function buildCampaignBriefContent(campaign) {
  const demo = campaign.source.mode === "demo";
  const recorded = campaign.source.mode === "recorded";
  const stat = areaRecurrence(campaign.evidence);
  const records = [...campaign.evidence].sort((left, right) => sourceDateValue(left.date) - sourceDateValue(right.date)).map(item => ({
    id: item.id ?? "Unavailable",
    address: item.address ?? "Address unavailable",
    date: formatSourceDate(item.date),
    status: item.status === null || item.status === undefined || item.status === "" ? "Status unavailable" : item.status,
    previousStatus: item.changedSinceReview ? (item.previousStatus ?? "Status unavailable") : null,
    notInLatestSnapshot: item.inLatestSnapshot === false,
    agency: item.agency ?? "Unavailable", ward: item.ward ?? "Unavailable", category: item.category ?? "Unavailable",
    sourceUrl: sourceRecordUrl(item, campaign.source.mode),
    locationNote: item.outsideWard === true ? "Map point is outside the Ward 8 boundary although the source ward label is Ward 8" : null
  }));
  const counts = new Map();
  for (const record of records) counts.set(record.status, (counts.get(record.status) ?? 0) + 1);
  const observations = [...campaign.observations].sort((left, right) => left.date.localeCompare(right.date))
    .map(item => ({ kind: item.kind, kindLabel: OBSERVATION_KINDS[item.kind] ?? "Observation", date: item.date, text: item.text, fictional: item.fictional === true }));
  const area = campaign.area?.center
    ? `reports within ${campaign.area.radiusM} m of the ${campaign.name}`
    : "reports selected without a map area";
  const kinds = Object.keys(KIND_LABELS).filter(kind => campaign.filters.kinds.includes(kind)).map(kind => KIND_LABELS[kind]).join(", ") || "no statuses";
  return {
    title: campaign.name, objective: campaign.objective, fictional: demo, recorded,
    sourceLabel: demo ? "Fictional demo sample; these are not city records."
      : recorded ? `Recorded DC 311 snapshot (real city data, retrieved ${campaign.source.retrievedAt}); this is not live data` : "Live DC 311 snapshot",
    recurrence: { headline: recurrenceHeadline(stat, shortDay), caveat: recurrenceHeadline.caveat, stat },
    ask: askLines(campaign.escalation ?? DEFAULT_ESCALATION),
    retrievedAt: demo ? null : campaign.source.retrievedAt,
    window: demo ? null : campaign.source.window,
    sourceUrl: demo ? null : campaign.source.sourceUrl,
    scope: `${area}; ${campaign.filters.days ? `last ${campaign.filters.days} days` : "full query window"}; status: ${kinds}`,
    records,
    cityStatus: [...counts].map(([status, count]) => `${count} ${status}`).join(" · "),
    group: {
      reviewedAt: campaign.request.confirmedAt,
      tasksDone: campaign.tasks.filter(task => task.done).length, tasksTotal: campaign.tasks.length
    },
    observations,
    resident: observations.filter(item => item.kind !== "agency").at(-1) ?? null,
    request: campaign.request.text.trim() || "No request entered.",
    tasks: campaign.tasks.map(task => ({ text: task.text, owner: task.owner.trim() || "Owner not assigned", due: task.due || "No due date", done: task.done })),
    locationCaveat: demo ? null : "Map locations are approximate block-level or intersection points, not exact sites.",
    caveat: "This brief prepares a group conversation. It does not report current conditions, confirm cleanup, or submit a request."
  };
}

const observationLine = item => `- **${item.kindLabel}** (${markdownText(item.date)})${item.fictional ? " **[FICTIONAL practice entry]**" : ""}: ${markdownText(item.text)}`;

export function buildCampaignMarkdown(campaign) {
  const content = buildCampaignBriefContent(campaign);
  const lines = [`# ${markdownText(content.title)}`, "", `**Objective:** ${markdownText(content.objective || "Not set")}`, "", `**Source:** ${content.sourceLabel}`];
  if (content.retrievedAt) lines.push(`**${content.recorded ? "Retrieved" : "Last checked"}:** ${content.retrievedAt}`);
  if (content.window) lines.push(`**Query window:** ${content.window.start} inclusive to ${content.window.endExclusive} exclusive (America/New_York)`);
  lines.push(`**Selection scope:** ${markdownText(content.scope)}`);
  lines.push("", "## Recurrence evidence", "", markdownText(content.recurrence.headline), "", markdownText(content.recurrence.caveat), "", `City status as published: ${markdownText(content.cityStatus || "No reports")}. The reports are listed after the follow-up history.`);
  lines.push("", "## The ask", "", `**To:** ${markdownText(content.ask.recipient)}`, `**Requested lasting fix:** ${markdownText(content.ask.fix)}`, "", markdownText(content.request), "", "Prepared for the group to send. Nothing has been sent.");
  lines.push("", "## Tasks", "");
  if (content.tasks.length) for (const task of content.tasks) lines.push(`- [${task.done ? "x" : " "}] ${markdownText(task.text)} — owner: ${markdownText(task.owner)}; due: ${markdownText(task.due)}`);
  else lines.push("No tasks assigned yet.");
  lines.push("", "## Group progress", "", content.group.reviewedAt ? `Evidence and request reviewed by the group on ${markdownText(content.group.reviewedAt)}.` : "Not yet reviewed by the group.", `Tasks done: ${content.group.tasksDone} of ${content.group.tasksTotal}.`);
  lines.push("", "## Resident verification and follow-ups", "");
  if (content.observations.length) for (const item of content.observations) lines.push(observationLine(item));
  else lines.push("No group observation provided; current conditions are unverified.");
  lines.push("", "## City ticket status (as published)", "", `${markdownText(content.cityStatus || "No reports")}. This is the city's own record status, kept separate from the group's progress and from what residents saw.`, "");
  for (const record of content.records) {
    lines.push(`- **Request ID:** ${markdownText(record.id)}; **Address:** ${markdownText(record.address)}; **Date:** ${markdownText(record.date)}; **Official status:** ${markdownText(record.status)}${record.previousStatus ? ` (changed since review; was ${markdownText(record.previousStatus)})` : ""}; **Agency:** ${markdownText(record.agency)}; **Ward:** ${markdownText(record.ward)}; **Category:** ${markdownText(record.category)}${record.notInLatestSnapshot ? "; **Note:** not in the latest 90-day snapshot, status as last seen" : ""}${record.locationNote ? `; **Location note:** ${markdownText(record.locationNote)}` : ""}`);
    if (record.sourceUrl) lines.push(`  - [Original source record](${record.sourceUrl})`);
  }
  lines.push("", "## Source appendix", "");
  lines.push(content.sourceUrl ? `Source layer: ${content.sourceUrl}. Each report is identified by its original service request ID above.` : "Fictional demonstration records only; no official source record is represented.");
  if (content.locationCaveat) lines.push("", content.locationCaveat);
  lines.push("", content.caveat);
  return lines.join("\n");
}

const isObject = value => value !== null && typeof value === "object" && !Array.isArray(value);
const finite = value => typeof value === "number" && Number.isFinite(value);

function campaignProblem(campaign) {
  if (!isObject(campaign)) return "a campaign is not an object";
  for (const field of ["id", "name", "objective", "createdAt", "updatedAt"]) if (typeof campaign[field] !== "string") return `campaign.${field} is not text`;
  if (!campaign.id) return "campaign.id is empty";
  if (!isObject(campaign.source) || !["live", "recorded", "demo"].includes(campaign.source.mode)) return "campaign.source.mode is not live, recorded or demo";
  if (!isObject(campaign.area) || !finite(campaign.area.radiusM) || campaign.area.radiusM <= 0) return "campaign.area.radiusM is invalid";
  const center = campaign.area.center;
  if (center !== null && !(isObject(center) && finite(center.lat) && finite(center.lon))) return "campaign.area.center is invalid";
  if (!isObject(campaign.filters) || !Array.isArray(campaign.filters.kinds)) return "campaign.filters is invalid";
  if (!Array.isArray(campaign.evidence) || campaign.evidence.some(item => !isObject(item) || typeof item.key !== "string" || !item.key)) return "campaign.evidence is invalid";
  if (new Set(campaign.evidence.map(item => item.key)).size !== campaign.evidence.length) return "campaign.evidence has duplicate keys";
  if (!Array.isArray(campaign.observations) || campaign.observations.some(item => !isObject(item) || typeof item.id !== "string" || !OBSERVATION_KINDS[item.kind] || !isValidDay(item.date) || typeof item.text !== "string")) return "campaign.observations is invalid";
  if (!Array.isArray(campaign.tasks) || campaign.tasks.some(task => !isObject(task) || typeof task.id !== "string" || typeof task.text !== "string" || typeof task.owner !== "string" || typeof task.done !== "boolean" || (task.due !== "" && !isValidDay(task.due)))) return "campaign.tasks is invalid";
  if (!isObject(campaign.request) || typeof campaign.request.text !== "string" || !(campaign.request.confirmedAt === null || typeof campaign.request.confirmedAt === "string")) return "campaign.request is invalid";
  if (campaign.escalation !== undefined) {
    const escalation = campaign.escalation;
    if (!isObject(escalation) || typeof escalation.recipient !== "string" || typeof escalation.fixOther !== "string" || !(escalation.fix === "" || LASTING_FIXES[escalation.fix])) return "campaign.escalation is invalid";
  }
  return "";
}

export function validateStore(value) {
  if (!isObject(value)) return { ok: false, reason: "invalid", message: "The saved data is not a campaign store." };
  if (value.version !== STORE_VERSION) return { ok: false, reason: "version", message: `The saved data is version ${String(value.version)}; this app reads version ${STORE_VERSION}.` };
  if (!Array.isArray(value.campaigns)) return { ok: false, reason: "invalid", message: "The saved campaign list is missing." };
  for (const [index, campaign] of value.campaigns.entries()) {
    const problem = campaignProblem(campaign);
    if (problem) return { ok: false, reason: "invalid", message: `Saved campaign ${index + 1}: ${problem}.` };
  }
  if (new Set(value.campaigns.map(campaign => campaign.id)).size !== value.campaigns.length) return { ok: false, reason: "invalid", message: "Saved campaigns share an ID." };
  return { ok: true };
}
