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

export function normalizeFeatureSet(featureSet) {
  if (featureSet?.error) throw new Error(`DC 311 returned an error: ${featureSet.error.message || "unknown source error"}`);
  if (featureSet?.exceededTransferLimit === true) throw new Error("DC 311 response exceeded its transfer limit; partial data was rejected.");
  if (!Array.isArray(featureSet?.features)) throw new Error("DC 311 response did not include a feature list.");

  return featureSet.features.map((feature, index) => {
    const attributes = feature?.attributes;
    if (!attributes || typeof attributes !== "object" || Array.isArray(attributes)) {
      throw new Error(`DC 311 record ${index + 1} did not include source attributes.`);
    }
    const id = attributes.SERVICEREQUESTID ?? null;
    const objectId = attributes.OBJECTID ?? null;
    return {
      key: id !== null && String(id).trim() ? `request:${String(id).trim()}` : objectId !== null ? `object:${objectId}` : `unidentified:${index + 1}`,
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
  return [...groups.values()].sort((left, right) => right.records.length - left.records.length || left.label.localeCompare(right.label));
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
    sourceUrl: SERVICE_LAYER_URL,
    retrievedAt: date.toISOString(),
    window: buildQueryWindow(date),
    records: normalizeFeatureSet(featureSet)
  };
}
