// DISPOSABLE R1 layout prototype. Real 311 records via /api/requests; campaign text is mock.
import { distanceMeters, recordsWithin, formatSourceDate, sourceRecordUrl } from "/lib/block-ops.mjs";

const RADIUS = 150;
const $ = id => document.getElementById(id);
const kind = status => status === "Open" ? "open" : status === "Closed" ? "closed" : "other";
const STYLE = {
  open: { radius: 7, color: "#5b316b", fillColor: "#5b316b", fillOpacity: .9, weight: 2 },
  closed: { radius: 5, color: "#8c7a99", fillColor: "#cdbfd6", fillOpacity: .85, weight: 1.5 },
  other: { radius: 5, color: "#8c7a99", fillColor: "#ffffff", fillOpacity: .9, weight: 1.5 }
};
const HIGHLIGHT = { color: "#5b316b", fillColor: "#f5cd55", fillOpacity: 1, weight: 3 };

const map = L.map("map", { zoomControl: true }).setView([38.85, -76.99], 13);
L.tileLayer("https://maps2.dcgis.dc.gov/dcgis/rest/services/DCGIS_DATA/DC_Basemap_LightGray_WebMercator/MapServer/tile/{z}/{y}/{x}", {
  maxZoom: 19, attribution: "Basemap: DC GIS · Reports: DC 311 (DC Open Data)"
}).addTo(map);
map.attributionControl.setPrefix('<a href="https://leafletjs.com">Leaflet</a>');

function text(tag, value, className) {
  const element = document.createElement(tag);
  element.textContent = value;
  if (className) element.className = className;
  return element;
}

function showArea(records, markers, center) {
  const near = recordsWithin(records, center, RADIUS).sort((a, b) => (a.date ?? Infinity) - (b.date ?? Infinity));
  markers.forEach(({ record, layer }) => layer.setStyle({ ...STYLE[kind(record.status)], ...(near.includes(record) ? HIGHLIGHT : {}) }));
  if (near.length) markers.filter(({ record }) => near.includes(record)).forEach(({ layer }) => layer.bringToFront());

  const nearest = near.reduce((best, r) => !best || distanceMeters(r.geo, center) < distanceMeters(best.geo, center) ? r : best, null);
  $("place").textContent = nearest?.address
    ? nearest.address.replace(/^\d+\s*-\s*\d+\s+BLOCK OF /i, "").toLowerCase().replace(/\b\w+/g, w => /^(se|sw|ne|nw)$/.test(w) ? w.toUpperCase() : w[0].toUpperCase() + w.slice(1))
    : "this area";
  $("count").textContent = `· ${near.length} report${near.length === 1 ? "" : "s"} within ${RADIUS} m`;
  const dated = near.filter(r => r.date);
  $("span").textContent = dated.length ? `First report ${formatSourceDate(dated[0].date)} · latest ${formatSourceDate(dated.at(-1).date)}` : "No dated reports in this area.";
  const open = near.filter(r => r.status === "Open").length;
  const closed = near.filter(r => r.status === "Closed").length;
  $("tally").textContent = `${open} open · ${closed} closed · ${near.length - open - closed} duplicate/canceled. Nearby is not the same incident; check each record.`;
  $("t-city").textContent = near.length ? `${open} open, ${closed} closed (source status, as published)` : "—";
  $("t-n").textContent = near.length;

  const list = $("chrono");
  list.replaceChildren(...near.map(record => {
    const item = document.createElement("li");
    item.className = kind(record.status);
    const head = text("b", `${formatSourceDate(record.date)} · ${record.address ?? "Address unavailable"}`);
    const meta = document.createElement("span");
    meta.append(text("span", record.status ?? "Status unavailable", `chip ${kind(record.status)}`), ` ${record.id ?? "ID unavailable"} · ${record.agency ?? "agency unavailable"} `);
    const href = sourceRecordUrl(record, "live");
    if (href) { const a = text("a", "source record"); a.href = href; a.target = "_blank"; a.rel = "noopener noreferrer"; meta.append(a); }
    item.append(head, meta);
    return item;
  }));
  return near;
}

async function start() {
  let snapshot;
  try {
    const response = await fetch("/api/requests");
    if (!response.ok) throw new Error((await response.json()).error);
    snapshot = await response.json();
  } catch (error) {
    $("fresh").textContent = "Live DC 311 records unavailable.";
    $("error").hidden = false;
    $("error").textContent = `${error.message} No substitute data is shown.`;
    return;
  }
  const { records, geometry, window: range, retrievedAt } = snapshot;
  $("fresh").textContent = `DC 311 · retrieved ${new Date(retrievedAt).toLocaleString("en-US", { timeZone: "America/New_York", dateStyle: "medium", timeStyle: "short" })} ET · ${range.start} to ${range.endExclusive} (end exclusive) · ${records.length} records, ${geometry.mapped} mapped, ${geometry.missing} missing, ${geometry.invalid} invalid location`;

  const mapped = records.filter(r => r.geo);
  const markers = mapped.map(record => ({
    record,
    layer: L.circleMarker([record.geo.lat, record.geo.lon], STYLE[kind(record.status)]).addTo(map)
  }));
  if (mapped.length) map.fitBounds(L.latLngBounds(mapped.map(r => [r.geo.lat, r.geo.lon])).pad(.05));

  // Start on the densest 150 m neighbourhood so the first view tells a story.
  const densest = mapped.reduce((best, r) => {
    const n = recordsWithin(mapped, r.geo, RADIUS).length;
    return n > best.n ? { n, r } : best;
  }, { n: 0, r: null });
  let ring = null;
  const select = center => {
    ring?.remove();
    ring = L.circle([center.lat, center.lon], { radius: RADIUS, color: "#5b316b", weight: 2, dashArray: "6 5", fill: false }).addTo(map);
    showArea(mapped, markers, center);
  };
  map.on("click", event => select({ lat: event.latlng.lat, lon: event.latlng.lng }));
  if (densest.r) { select(densest.r.geo); map.setView([densest.r.geo.lat, densest.r.geo.lon], 16); }
}
start();
