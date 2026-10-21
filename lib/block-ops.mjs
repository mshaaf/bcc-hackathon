export const SERVICE_LAYER_URL = "https://maps2.dcgis.dc.gov/dcgis/rest/services/DCGIS_DATA/ServiceRequests/FeatureServer/21";

const OUT_FIELDS = [
  "OBJECTID",
  "SERVICEREQUESTID",
  "SERVICECODE",
  "SERVICECODEDESCRIPTION",
  "ADDDATE",
  "SERVICEDUEDATE",
  "RESOLUTIONDATE",
  "SERVICEORDERSTATUS",
  "ORGANIZATIONACRONYM",
  "WARD",
  "STREETADDRESS"
];

function dcDate(date) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date).map(part => [part.type, part.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function shiftDate(dateString, days) {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

export function buildQueryWindow(now = new Date()) {
  const date = new Date(now);
  if (Number.isNaN(date.getTime())) throw new TypeError("A valid query date is required.");
  const today = dcDate(date);
  return { start: shiftDate(today, -89), endExclusive: shiftDate(today, 1) };
}

export function buildArcGisUrl(now = new Date()) {
  const window = buildQueryWindow(now);
  const url = new URL(`${SERVICE_LAYER_URL}/query`);
  url.searchParams.set("f", "json");
  url.searchParams.set("where", `WARD='Ward 8' AND SERVICECODEDESCRIPTION LIKE '%Dump%' AND ADDDATE >= TIMESTAMP '${window.start} 00:00:00' AND ADDDATE < TIMESTAMP '${window.endExclusive} 00:00:00'`);
  url.searchParams.set("outFields", OUT_FIELDS.join(","));
  url.searchParams.set("returnGeometry", "false");
  url.searchParams.set("orderByFields", "OBJECTID");
  url.searchParams.set("resultRecordCount", "1000");
  return url.toString();
}

export function sourceRecordUrl(record, mode) {
  if (mode !== "live") return null;
  const objectId = record.objectId === null || record.objectId === undefined || String(record.objectId).trim() === ""
    ? NaN
    : Number(record.objectId);
  const url = new URL(`${SERVICE_LAYER_URL}/query`);
  if (Number.isSafeInteger(objectId) && objectId > 0) url.searchParams.set("where", `OBJECTID=${objectId}`);
  else if (record.id !== null && record.id !== undefined && String(record.id).trim()) {
    url.searchParams.set("where", `SERVICEREQUESTID='${String(record.id).replace(/'/g, "''")}'`);
  } else return null;
  url.searchParams.set("f", "json");
  url.searchParams.set("returnGeometry", "false");
  url.searchParams.set("outFields", OUT_FIELDS.join(","));
  return url.toString();
}

export function normalizeFeatureSet(featureSet) {
  if (featureSet?.error) throw new Error(`DC 311 returned an error: ${featureSet.error.message || "unknown source error"}`);
  if (featureSet?.exceededTransferLimit === true) throw new Error("DC 311 response exceeded its transfer limit; partial data was rejected.");
  if (!Array.isArray(featureSet?.features)) throw new Error("DC 311 response did not include a feature list.");

  const seenKeys = new Set();
  return featureSet.features.map((feature, index) => {
    const attributes = feature?.attributes;
    if (!attributes || typeof attributes !== "object" || Array.isArray(attributes)) {
      throw new Error(`DC 311 record ${index + 1} did not include source attributes.`);
    }
    const id = attributes.SERVICEREQUESTID ?? null;
    const objectId = attributes.OBJECTID ?? null;
    const key = id !== null && String(id).trim() ? `request:${String(id).trim()}` : objectId !== null ? `object:${objectId}` : `unidentified:${index + 1}`;
    if (seenKeys.has(key)) throw new Error("DC 311 response contained duplicate record identifiers; the snapshot was rejected.");
    seenKeys.add(key);
    return {
      key,
      id,
      objectId,
      category: attributes.SERVICECODEDESCRIPTION ?? null,
      serviceCode: attributes.SERVICECODE ?? null,
      date: attributes.ADDDATE ?? null,
      dueDate: attributes.SERVICEDUEDATE ?? null,
      resolutionDate: attributes.RESOLUTIONDATE ?? null,
      status: attributes.SERVICEORDERSTATUS ?? null,
      agency: attributes.ORGANIZATIONACRONYM ?? null,
      ward: attributes.WARD ?? null,
      address: typeof attributes.STREETADDRESS === "string" && attributes.STREETADDRESS.trim() ? attributes.STREETADDRESS : null,
      attributes
    };
  });
}

export function normalizeStreet(address) {
  if (typeof address !== "string" || !address.trim()) return null;
  const street = address.trim()
    .replace(/^\d+(?:-\d+)?[A-Z]?\s+/, "")
    .replace(/\s+(?:APT|APARTMENT|UNIT|STE|SUITE|#)\s*[\w-]+.*$/i, "")
    .replace(/[.,#]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleUpperCase("en-US");
  return street || null;
}

function sourceDateValue(value) {
  const timestamp = typeof value === "number" ? value : typeof value === "string" ? Date.parse(value) : NaN;
  return Number.isFinite(timestamp) ? timestamp : Infinity;
}

export function suggestStreetGroups(records) {
  const groups = new Map();
  for (const record of records) {
    const street = normalizeStreet(record.address);
    const category = typeof record.category === "string" && record.category.trim() ? record.category.trim().toLocaleUpperCase("en-US") : null;
    const canSuggest = street !== null && category !== null;
    const key = canSuggest ? `${category}\u001f${street}` : `unresolved\u001f${record.key}`;
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        label: canSuggest ? `${street} · ${record.category}` : "Address or category unavailable",
        explanation: canSuggest
          ? "Same normalized street name and category; candidate only. Inspect each original address before including it."
          : "Address or category unavailable; no relationship suggested.",
        records: []
      });
    }
    groups.get(key).records.push(record);
  }
  return [...groups.values()]
    .map(group => ({ ...group, records: group.records.sort((left, right) => sourceDateValue(left.date) - sourceDateValue(right.date)) }))
    .sort((left, right) => right.records.length - left.records.length || left.label.localeCompare(right.label));
}

export async function fetchArcGisSnapshot(fetchImpl = globalThis.fetch, now = new Date()) {
  const date = new Date(now);
  const url = buildArcGisUrl(date);
  let response;
  try {
    response = await fetchImpl(url, { signal: AbortSignal.timeout(15000) });
  } catch (error) {
    throw new Error(`DC 311 request failed: ${error.message}`, { cause: error });
  }
  if (!response.ok) throw new Error(`DC 311 request failed with HTTP ${response.status}.`);
  let featureSet;
  try {
    featureSet = await response.json();
  } catch (error) {
    throw new Error(`DC 311 response was not valid JSON: ${error.message}`, { cause: error });
  }
  return {
    mode: "live",
    sourceUrl: SERVICE_LAYER_URL,
    retrievedAt: date.toISOString(),
    window: buildQueryWindow(date),
    records: normalizeFeatureSet(featureSet)
  };
}

export function setRecordIncluded(draft, key, included) {
  const selectedIds = new Set(draft.selectedIds);
  if (included) selectedIds.add(key);
  else selectedIds.delete(key);
  return { ...draft, selectedIds, reviewConfirmed: false };
}

export function selectCandidateGroup(draft, key) {
  const group = draft.groups.find(candidate => candidate.key === key);
  if (!group) return draft;
  return {
    ...draft,
    activeGroupKey: key,
    selectedIds: new Set(group.records.map(record => record.key)),
    reviewConfirmed: false,
    observation: "",
    observedOn: ""
  };
}

export function confirmSourceReview(draft) {
  return { ...draft, reviewConfirmed: draft.selectedIds.size > 0 };
}

export async function refreshDraft(draft, loadSnapshot) {
  try {
    const snapshot = await loadSnapshot();
    if (!Array.isArray(snapshot?.records)) throw new Error("The source did not provide a record list.");
    const groups = suggestStreetGroups(snapshot.records);
    const firstGroup = groups[0] ?? null;
    return {
      ...draft,
      snapshot,
      groups,
      activeGroupKey: firstGroup?.key ?? null,
      selectedIds: new Set(firstGroup?.records.map(record => record.key) ?? []),
      reviewConfirmed: false,
      observation: "",
      observedOn: "",
      refreshError: ""
    };
  } catch (error) {
    return { ...draft, refreshError: error.message || "The source could not be refreshed." };
  }
}

export function canExportBrief(draft) {
  if (!draft.snapshot || !draft.selectedIds?.size || !draft.reviewConfirmed) return false;
  if (typeof draft.ask !== "string" || !draft.ask.trim()) return false;
  if (!Array.isArray(draft.tasks) || draft.tasks.length !== 2 || draft.tasks.some(task => !task.role?.trim() || !task.task?.trim())) return false;
  if (draft.observation?.trim() && !/^\d{4}-\d{2}-\d{2}$/.test(draft.observedOn || "")) return false;
  return true;
}

function markdownText(value, fallback) {
  return String(value ?? fallback).replace(/[\r\n]+/g, " ").replace(/([\\`*_{}\[\]()#+.!|<>])/g, "\\$1");
}

export function formatSourceDate(value) {
  if (value === null || value === undefined || value === "") return "Date unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date).map(part => [part.type, part.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function buildBriefContent(draft) {
  const selected = draft.snapshot?.records
    ?.filter(record => draft.selectedIds.has(record.key))
    .sort((left, right) => sourceDateValue(left.date) - sourceDateValue(right.date)) ?? [];
  if (!selected.length) throw new Error("There are no source records selected for this brief.");

  const isLive = draft.snapshot.mode === "live";
  return {
    sourceLabel: isLive ? "Live DC 311 snapshot" : "Fictional demo sample; these are not city records.",
    reviewLabel: draft.reviewConfirmed ? "Confirmed" : "Not confirmed; draft only",
    retrievedAt: isLive ? draft.snapshot.retrievedAt ?? null : null,
    window: isLive ? draft.snapshot.window ?? null : null,
    sourceUrl: isLive ? draft.snapshot.sourceUrl || SERVICE_LAYER_URL : null,
    records: selected.map(record => ({
      id: record.id ?? "Unavailable",
      address: record.address ?? "Address unavailable",
      sourceUrl: sourceRecordUrl(record, draft.snapshot.mode),
      date: formatSourceDate(record.date),
      status: record.status === null || record.status === undefined || record.status === "" ? "Status unavailable" : record.status,
      agency: record.agency ?? "Unavailable",
      ward: record.ward ?? "Unavailable",
      category: record.category ?? "Unavailable"
    })),
    observation: draft.observation?.trim()
      ? { date: draft.observedOn || "date unavailable", text: draft.observation }
      : null,
    request: draft.ask?.trim() || "No request entered.",
    tasks: (draft.tasks ?? []).map(task => ({ role: task.role || "Role not assigned", task: task.task || "Task not assigned" })),
    caveat: "This brief prepares a group conversation. It does not report current conditions, confirm cleanup, or submit a request."
  };
}

export function buildBriefMarkdown(draft) {
  const content = buildBriefContent(draft);
  const lines = [
    "# Block Ops neighborhood brief",
    "",
    `**Source:** ${content.sourceLabel}`,
    `**Source review:** ${content.reviewLabel}`
  ];
  if (content.retrievedAt) lines.push(`**Retrieved:** ${content.retrievedAt}`);
  if (content.window) lines.push(`**Query window:** ${content.window.start} inclusive to ${content.window.endExclusive} exclusive (America/New_York)`);
  lines.push("", "## Selected service requests", "");
  for (const record of content.records) {
    lines.push(`- **Request ID:** ${markdownText(record.id)}; **Address:** ${markdownText(record.address)}; **Date:** ${markdownText(record.date)}; **Official status:** ${markdownText(record.status)}; **Agency:** ${markdownText(record.agency)}; **Ward:** ${markdownText(record.ward)}; **Category:** ${markdownText(record.category)}`);
    if (record.sourceUrl) lines.push(`  - [Original source record](${record.sourceUrl})`);
  }
  lines.push("", "## Group observation", "");
  lines.push(content.observation
    ? `Group-provided observation (${markdownText(content.observation.date)}): ${markdownText(content.observation.text)}`
    : "No group observation provided; current conditions are unverified.");
  lines.push("", "## Request", "", markdownText(content.request), "", "## Next-step tasks", "");
  for (const task of content.tasks) lines.push(`- **${markdownText(task.role)}:** ${markdownText(task.task)}`);
  lines.push("", "## Source appendix", "");
  if (content.sourceUrl) {
    lines.push(`Source layer: ${content.sourceUrl}. Each selected request is identified by its original service request ID above.`);
  } else {
    lines.push("Fictional demonstration records only; no official source record is represented.");
  }
  lines.push("", content.caveat);
  return lines.join("\n");
}
