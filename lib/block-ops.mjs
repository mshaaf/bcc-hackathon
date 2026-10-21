export const SERVICE_LAYER_URL = "https://maps2.dcgis.dc.gov/dcgis/rest/services/DCGIS_DATA/ServiceRequests/FeatureServer/21";

export const WARD_LAYER_URL = "https://maps2.dcgis.dc.gov/dcgis/rest/services/DCGIS_DATA/Administrative_Other_Boundaries_WebMercator/MapServer/53";

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
  url.searchParams.set("returnGeometry", "true");
  url.searchParams.set("outSR", "4326");
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

// Rough DC bounding box (WGS84). A point outside it is treated as invalid, which also catches
// swapped lon/lat and state-plane coordinates mistaken for degrees.
export const DC_BOUNDS = { west: -77.12, east: -76.90, south: 38.78, north: 39.00 };

export function normalizeGeometry(geometry) {
  if (geometry === null || geometry === undefined) return { geo: null, geoStatus: "missing" };
  const { x: lon, y: lat } = geometry;
  const inBounds = lon >= DC_BOUNDS.west && lon <= DC_BOUNDS.east && lat >= DC_BOUNDS.south && lat <= DC_BOUNDS.north;
  if (!Number.isFinite(lon) || !Number.isFinite(lat) || !inBounds) return { geo: null, geoStatus: "invalid" };
  return { geo: { lon, lat }, geoStatus: "ok" };
}

export function distanceMeters(a, b) {
  const rad = degrees => (degrees * Math.PI) / 180;
  const h = Math.sin(rad(b.lat - a.lat) / 2) ** 2
    + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lon - a.lon) / 2) ** 2;
  return 2 * 6371008.8 * Math.asin(Math.sqrt(h));
}

// Proximity only suggests a relationship; it does not establish one incident or recurrence.
export function recordsWithin(records, center, meters) {
  return records.filter(record => record.geo && distanceMeters(record.geo, center) <= meters);
}

export function summarizeGeometry(records) {
  const summary = { total: records.length, mapped: 0, missing: 0, invalid: 0 };
  for (const record of records) {
    if (record.geoStatus === "ok") summary.mapped += 1;
    else if (record.geoStatus === "invalid") summary.invalid += 1;
    else summary.missing += 1;
  }
  return summary;
}

export function normalizeFeatureSet(featureSet) {
  if (featureSet?.error) throw new Error(`DC 311 returned an error: ${featureSet.error.message || "unknown source error"}`);
  if (featureSet?.exceededTransferLimit === true) throw new Error("DC 311 response exceeded its transfer limit; partial data was rejected.");
  if (!Array.isArray(featureSet?.features)) throw new Error("DC 311 response did not include a feature list.");
  const wkid = featureSet.spatialReference?.wkid;
  if (wkid !== undefined && wkid !== 4326) throw new Error(`DC 311 response used spatial reference ${wkid}, not WGS84 (4326); coordinates were rejected.`);

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
      ...normalizeGeometry(feature.geometry),
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

export function sourceDateValue(value) {
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

async function fetchJson(fetchImpl, url, label) {
  let response;
  try {
    response = await fetchImpl(url, { signal: AbortSignal.timeout(15000) });
  } catch (error) {
    throw new Error(`${label} request failed: ${error.message}`, { cause: error });
  }
  if (!response.ok) throw new Error(`${label} request failed with HTTP ${response.status}.`);
  try {
    return await response.json();
  } catch (error) {
    throw new Error(`${label} response was not valid JSON: ${error.message}`, { cause: error });
  }
}

export async function fetchArcGisSnapshot(fetchImpl = globalThis.fetch, now = new Date()) {
  const date = new Date(now);
  const featureSet = await fetchJson(fetchImpl, buildArcGisUrl(date), "DC 311");
  const records = normalizeFeatureSet(featureSet);
  return {
    mode: "live",
    sourceUrl: SERVICE_LAYER_URL,
    retrievedAt: date.toISOString(),
    window: buildQueryWindow(date),
    geometry: summarizeGeometry(records),
    records
  };
}

export function buildWardBoundaryUrl() {
  const url = new URL(`${WARD_LAYER_URL}/query`);
  url.searchParams.set("f", "json");
  url.searchParams.set("where", "WARD=8");
  url.searchParams.set("outFields", "WARD");
  url.searchParams.set("returnGeometry", "true");
  url.searchParams.set("outSR", "4326");
  return url.toString();
}

function validRings(rings) {
  const wide = { west: DC_BOUNDS.west - 0.1, east: DC_BOUNDS.east + 0.1, south: DC_BOUNDS.south - 0.1, north: DC_BOUNDS.north + 0.1 };
  return Array.isArray(rings) && rings.length > 0 && rings.every(ring => Array.isArray(ring) && ring.length >= 4 && ring.every(point =>
    Array.isArray(point) && Number.isFinite(point[0]) && Number.isFinite(point[1])
    && point[0] >= wide.west && point[0] <= wide.east && point[1] >= wide.south && point[1] <= wide.north));
}

export async function fetchWardBoundary(fetchImpl = globalThis.fetch, now = new Date()) {
  const featureSet = await fetchJson(fetchImpl, buildWardBoundaryUrl(), "Ward boundary");
  if (featureSet?.error) throw new Error(`Ward boundary returned an error: ${featureSet.error.message || "unknown source error"}`);
  const wkid = featureSet?.spatialReference?.wkid;
  if (wkid !== undefined && wkid !== 4326) throw new Error(`Ward boundary used spatial reference ${wkid}, not WGS84 (4326).`);
  const features = featureSet?.features;
  if (!Array.isArray(features) || features.length !== 1 || !validRings(features[0]?.geometry?.rings)) {
    throw new Error("Ward boundary response was not exactly one valid Ward 8 polygon.");
  }
  return { sourceUrl: WARD_LAYER_URL, retrievedAt: new Date(now).toISOString(), rings: features[0].geometry.rings };
}

export function pointInRings(rings, lon, lat) {
  let inside = false; // even-odd rule, so holes are respected
  for (const ring of rings) {
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i];
      const [xj, yj] = ring[j];
      if ((yi > lat) !== (yj > lat) && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
    }
  }
  return inside;
}

// The source WARD label and the geocoded point can disagree near a boundary. Keep the record and flag it.
export function applyWardBoundary(snapshot, boundary) {
  if (!boundary) return { ...snapshot, boundary: { status: "unavailable", inside: 0, outside: 0, unchecked: snapshot.records.length } };
  const counts = { inside: 0, outside: 0, unchecked: 0 };
  const records = snapshot.records.map(record => {
    if (!record.geo) { counts.unchecked += 1; return { ...record, outsideWard: null }; }
    const outside = !pointInRings(boundary.rings, record.geo.lon, record.geo.lat);
    counts[outside ? "outside" : "inside"] += 1;
    return { ...record, outsideWard: outside };
  });
  return { ...snapshot, records, boundary: { status: "checked", retrievedAt: boundary.retrievedAt, ...counts } };
}

// excludedIds remembers what the user removed, so a radius/date/status change cannot quietly bring it back.
export function setRecordIncluded(draft, key, included) {
  const selectedIds = new Set(draft.selectedIds);
  const excludedIds = new Set(draft.excludedIds ?? []);
  if (included) { selectedIds.add(key); excludedIds.delete(key); }
  else { selectedIds.delete(key); excludedIds.add(key); }
  return { ...draft, selectedIds, excludedIds, reviewConfirmed: false };
}

export function selectCandidateGroup(draft, key) {
  const group = draft.groups.find(candidate => candidate.key === key);
  if (!group) return draft;
  return {
    ...draft,
    activeGroupKey: key,
    selectedIds: new Set(group.records.map(record => record.key)),
    excludedIds: new Set(),
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
      excludedIds: new Set(),
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

export const KIND_LABELS = { open: "Open", closed: "Closed", other: "Duplicate / canceled / unknown" };
export const DEFAULT_SCOPE = {
  area: { center: null, radiusM: 150 },
  filters: { days: null, kinds: new Set(Object.keys(KIND_LABELS)) }
};
export const RADIUS_PRESETS = [100, 150, 250];
export const DAY_PRESETS = [30, 60];

export function statusKind(status) {
  return status === "Open" ? "open" : status === "Closed" ? "closed" : "other";
}

export function sinceForDays(days, now = new Date()) {
  return days ? shiftDate(dcDate(new Date(now)), -(days - 1)) : null;
}

// A record with no usable date cannot be placed in a date-limited view, so it is hidden there, never guessed.
export function filterRecords(records, { since = null, kinds = null } = {}) {
  return records.filter(record => {
    if (kinds && !kinds.has(statusKind(record.status))) return false;
    if (since) {
      const day = formatSourceDate(record.date);
      if (day === "Date unavailable" || day < since) return false;
    }
    return true;
  });
}

const STREET_ABBREVIATIONS = { STREET: "St", AVENUE: "Ave", ROAD: "Rd", TERRACE: "Ter", PLACE: "Pl", DRIVE: "Dr", BOULEVARD: "Blvd", COURT: "Ct", LANE: "Ln", CIRCLE: "Cir", PARKWAY: "Pkwy" };

function titleStreet(text) {
  return text.trim().split(/\s+/).map(word => {
    const upper = word.toUpperCase();
    if (/^(?:NE|NW|SE|SW|N|S|E|W)$/.test(upper)) return upper;
    if (STREET_ABBREVIATIONS[upper]) return STREET_ABBREVIATIONS[upper];
    const lower = word.toLowerCase();
    return lower[0].toUpperCase() + lower.slice(1);
  }).join(" ");
}

// "1941 NAYLOR ROAD SE" -> "1900 block of Naylor Rd SE". A campaign is named for a block, never one house.
export function blockName(address) {
  if (typeof address !== "string" || !address.trim()) return null;
  const text = address.trim();
  const hundred = value => Math.floor(Number(value) / 100) * 100;
  const range = /^(\d+)\s*-\s*\d+\s+BLOCK OF\s+(.+)$/i.exec(text);
  if (range) return `${hundred(range[1])} block of ${titleStreet(range[2])}`;
  const parts = text.split(/\s+(?:AND|&)\s+/i);
  if (parts.length === 2 && !/^\d+[A-Z]?\s/i.test(parts[0])) return `Intersection of ${titleStreet(parts[0])} and ${titleStreet(parts[1])}`;
  const house = /^(\d+)[A-Z]?\s+(.+)$/i.exec(text);
  if (house) return `${hundred(house[1])} block of ${titleStreet(house[2])}`;
  return titleStreet(text);
}

function referenceDate(draft) {
  return draft.snapshot?.retrievedAt ? new Date(draft.snapshot.retrievedAt) : new Date();
}

export function areaRecords(draft) {
  const records = draft.snapshot?.records ?? [];
  return draft.area?.center ? recordsWithin(records, draft.area.center, draft.area.radiusM) : records;
}

function activeFilters(draft) {
  const filters = draft.filters ?? DEFAULT_SCOPE.filters;
  return { since: sinceForDays(filters.days, referenceDate(draft)), kinds: filters.kinds };
}

// Everything the date/status filters allow, anywhere on the map (used to dim the rest).
export function visibleRecords(draft) {
  return filterRecords(draft.snapshot?.records ?? [], activeFilters(draft));
}

export function candidateRecords(draft) {
  return filterRecords(areaRecords(draft), activeFilters(draft))
    .sort((left, right) => sourceDateValue(left.date) - sourceDateValue(right.date));
}

// Reports with no usable point cannot be in a map area; they stay reachable from their own list.
export function unplacedRecords(draft) {
  if (!draft.area?.center) return [];
  return filterRecords((draft.snapshot?.records ?? []).filter(record => !record.geo), activeFilters(draft));
}

export function areaBlockName(draft) {
  const center = draft.area?.center;
  const inArea = areaRecords(draft).filter(record => record.geo);
  if (!center || !inArea.length) return null;
  const nearest = inArea.reduce((best, record) => distanceMeters(record.geo, center) < distanceMeters(best.geo, center) ? record : best);
  return blockName(nearest.address);
}

export function describeScope(draft) {
  if (!draft.area || !draft.filters) return null;
  const place = draft.area.center
    ? `reports within ${draft.area.radiusM} m of the ${areaBlockName(draft) ?? "chosen point"}`
    : "all loaded reports";
  const days = draft.filters.days ? `last ${draft.filters.days} days` : "full query window";
  const kinds = Object.keys(KIND_LABELS).filter(kind => draft.filters.kinds.has(kind)).map(kind => KIND_LABELS[kind]).join(", ") || "no statuses";
  return `${place}; ${days}; status: ${kinds}`;
}

export function findBusySpots(records, radiusM, limit = 8) {
  const mapped = records.filter(record => record.geo);
  const scored = mapped.map(record => ({ record, center: record.geo, count: recordsWithin(mapped, record.geo, radiusM).length }))
    .sort((left, right) => right.count - left.count);
  const picked = [];
  for (const spot of scored) {
    if (picked.length >= limit) break;
    if (picked.every(other => distanceMeters(other.center, spot.center) > radiusM * 2)) picked.push(spot);
  }
  return picked;
}

// Moving the area is a context change: review confirmation, the site observation and the user's exclusions are cleared.
// Radius and filter changes keep the observation and the exclusions (review is still invalidated, since the evidence
// changed). Reports the user added from the unplaced list stay while they still match the filters.
export function updateScope(draft, change) {
  const area = { ...draft.area, ...(change.center !== undefined ? { center: change.center } : {}), ...(change.radiusM !== undefined ? { radiusM: change.radiusM } : {}) };
  const filters = { ...draft.filters, ...(change.days !== undefined ? { days: change.days } : {}), ...(change.kinds !== undefined ? { kinds: new Set(change.kinds) } : {}) };
  const moved = change.center !== undefined && (change.center?.lat !== draft.area.center?.lat || change.center?.lon !== draft.area.center?.lon);
  const excludedIds = moved ? new Set() : new Set(draft.excludedIds ?? []);
  const next = { ...draft, area, filters, excludedIds, reviewConfirmed: false, ...(moved ? { observation: "", observedOn: "" } : {}) };
  const unplacedKeys = new Set(unplacedRecords(next).map(record => record.key));
  const keptUnplaced = moved ? [] : [...draft.selectedIds].filter(key => unplacedKeys.has(key));
  const candidates = candidateRecords(next).filter(record => !excludedIds.has(record.key));
  return { ...next, selectedIds: new Set([...candidates.map(record => record.key), ...keptUnplaced]) };
}

export async function refreshWorkspace(draft, loadSnapshot) {
  const refreshed = await refreshDraft(draft, loadSnapshot);
  if (refreshed.refreshError) return refreshed;
  const spot = findBusySpots(refreshed.snapshot.records, refreshed.area.radiusM, 1)[0];
  return updateScope({ ...refreshed, area: { ...refreshed.area, center: null } }, { center: spot?.center ?? null });
}

export function markdownText(value, fallback) {
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
      category: record.category ?? "Unavailable",
      locationNote: record.outsideWard === true ? "Map point is outside the Ward 8 boundary although the source ward label is Ward 8" : null
    })),
    scope: describeScope(draft),
    locationCaveat: isLive ? "Map locations are approximate block-level or intersection points, not exact sites." : null,
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
  if (content.scope) lines.push(`**Selection scope:** ${markdownText(content.scope)}`);
  lines.push("", "## Selected service requests", "");
  for (const record of content.records) {
    lines.push(`- **Request ID:** ${markdownText(record.id)}; **Address:** ${markdownText(record.address)}; **Date:** ${markdownText(record.date)}; **Official status:** ${markdownText(record.status)}; **Agency:** ${markdownText(record.agency)}; **Ward:** ${markdownText(record.ward)}; **Category:** ${markdownText(record.category)}${record.locationNote ? `; **Location note:** ${markdownText(record.locationNote)}` : ""}`);
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
  if (content.locationCaveat) lines.push("", content.locationCaveat);
  lines.push("", content.caveat);
  return lines.join("\n");
}
