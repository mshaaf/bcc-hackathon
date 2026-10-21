// R1 proof: 311 geometry (via the app's own query) checked against the official Ward 8 polygon,
// plus a separate filtered MPD crime query. Nothing here is wired into the app.
import assert from "node:assert/strict";
import { fetchArcGisSnapshot, DC_BOUNDS } from "../lib/block-ops.mjs";

const WARD_LAYER = "https://maps2.dcgis.dc.gov/dcgis/rest/services/DCGIS_DATA/Administrative_Other_Boundaries_WebMercator/MapServer/53";
const MPD_LAYER = "https://maps2.dcgis.dc.gov/dcgis/rest/services/FEEDS/MPD/FeatureServer/39";
const SR_LAYER = "https://maps2.dcgis.dc.gov/dcgis/rest/services/DCGIS_DATA/ServiceRequests/FeatureServer/21";

async function query(layer, params) {
  const url = new URL(`${layer}/query`);
  for (const [key, value] of Object.entries({ f: "json", ...params })) url.searchParams.set(key, value);
  const response = await fetch(url, { signal: AbortSignal.timeout(20000) });
  assert.ok(response.ok, `HTTP ${response.status} from ${layer}`);
  const body = await response.json();
  assert.ok(!body.error, `Source error: ${body.error?.message}`);
  return body;
}

function inRings(rings, lon, lat) {
  let inside = false; // even-odd rule handles holes
  for (const ring of rings) {
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i];
      const [xj, yj] = ring[j];
      if ((yi > lat) !== (yj > lat) && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
    }
  }
  return inside;
}

try {
  const ward = await query(WARD_LAYER, { where: "WARD=8", outFields: "WARD", returnGeometry: "true", outSR: "4326" });
  assert.equal(ward.features.length, 1, "Expected exactly one Ward 8 polygon.");
  const rings = ward.features[0].geometry.rings;

  const snapshot = await fetchArcGisSnapshot();
  const mapped = snapshot.records.filter(record => record.geo);
  const outside = mapped.filter(record => !inRings(rings, record.geo.lon, record.geo.lat));
  const lons = mapped.map(record => record.geo.lon);
  const lats = mapped.map(record => record.geo.lat);

  const since = new Date(Date.parse(snapshot.retrievedAt) - 90 * 864e5).toISOString().slice(0, 10);
  const lighting = await query(SR_LAYER, {
    where: `WARD='Ward 8' AND ADDDATE >= TIMESTAMP '${since} 00:00:00' AND (SERVICECODEDESCRIPTION LIKE '%Streetlight%' OR SERVICECODEDESCRIPTION LIKE '%Lighting%')`,
    groupByFieldsForStatistics: "SERVICECODEDESCRIPTION",
    outStatistics: JSON.stringify([{ statisticType: "count", onStatisticField: "OBJECTID", outStatisticFieldName: "n" }])
  });

  const crime = await query(MPD_LAYER, { where: "WARD='8'", outFields: "OFFENSE,BLOCK,WARD,REPORT_DAT,START_DATE,END_DATE", returnGeometry: "true", outSR: "4326", resultRecordCount: "2000" });
  const crimeMapped = crime.features.filter(feature => Number.isFinite(feature.geometry?.x) && Number.isFinite(feature.geometry?.y));
  const crimeOutside = crimeMapped.filter(feature => !inRings(rings, feature.geometry.x, feature.geometry.y));
  const reported = crime.features.map(feature => feature.attributes.REPORT_DAT).filter(Number.isFinite);

  assert.ok(snapshot.records.length > 0 && mapped.length > 0, "311 returned no mappable records.");
  assert.ok(lons.every(lon => lon < 0), "Longitudes must be negative; lon/lat may be swapped.");

  console.log(JSON.stringify({
    retrievedAt: snapshot.retrievedAt,
    window: snapshot.window,
    dumping311: {
      records: snapshot.records.length,
      geometry: snapshot.geometry,
      lonRange: [Math.min(...lons), Math.max(...lons)],
      latRange: [Math.min(...lats), Math.max(...lats)],
      insideDcBounds: mapped.length,
      insideWard8Polygon: mapped.length - outside.length,
      outsideWard8Polygon: outside.map(record => ({ id: record.id, address: record.address, geo: record.geo }))
    },
    lighting311Last90Days: lighting.features.map(feature => feature.attributes),
    mpdLayer39Ward8: {
      exceededTransferLimit: crime.exceededTransferLimit === true,
      records: crime.features.length,
      withPoint: crimeMapped.length,
      withoutUsablePoint: crime.features.length - crimeMapped.length,
      outsideWard8Polygon: crimeOutside.length,
      latestReportDate: reported.length ? new Date(Math.max(...reported)).toISOString() : null,
      oldestReportDate: reported.length ? new Date(Math.min(...reported)).toISOString() : null,
      offenseCounts: Object.entries(crime.features.reduce((counts, feature) => ({ ...counts, [feature.attributes.OFFENSE]: (counts[feature.attributes.OFFENSE] ?? 0) + 1 }), {})).sort((a, b) => b[1] - a[1]),
      note: "Block-level approximate locations; report date is not occurrence date. Not integrated into the app."
    },
    dcBoundsUsed: DC_BOUNDS
  }, null, 2));
} catch (error) {
  console.error(`Geo proof failed: ${error.message}`);
  process.exitCode = 1;
}
