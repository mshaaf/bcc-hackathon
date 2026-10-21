// Leaflet map for the workspace. Source strings are shown only through textContent nodes.
import { formatSourceDate, statusKind } from "/lib/block-ops.mjs";

const TILES = "https://maps2.dcgis.dc.gov/dcgis/rest/services/DCGIS_DATA/DC_Basemap_LightGray_WebMercator/MapServer/tile/{z}/{y}/{x}";
const BASE = {
  open: { radius: 7, color: "#5b316b", fillColor: "#5b316b", fillOpacity: .9, weight: 2 },
  closed: { radius: 5, color: "#8c7a99", fillColor: "#cdbfd6", fillOpacity: .85, weight: 1.5 },
  other: { radius: 5, color: "#8c7a99", fillColor: "#ffffff", fillOpacity: .9, weight: 1.5 }
};
const SELECTED = { color: "#5b316b", fillColor: "#f5cd55", fillOpacity: 1, weight: 3 };
const HIDDEN = { fillOpacity: .12, opacity: .25 };

function tooltipNode(record) {
  const node = document.createElement("div");
  const lines = [record.address ?? "Address unavailable", `${formatSourceDate(record.date)} · ${record.status ?? "Status unavailable"}`];
  if (record.outsideWard === true) lines.push("Outside Ward 8 boundary");
  lines.forEach((line, index) => {
    if (index) node.append(document.createElement("br"));
    node.append(document.createTextNode(line));
  });
  return node;
}

export function createMap(container, { onPick, onTilesFailed }) {
  const map = L.map(container, { zoomControl: true }).setView([38.85, -76.99], 13);
  const tiles = L.tileLayer(TILES, { maxZoom: 19, attribution: "Basemap: DC GIS · Reports: DC 311 (DC Open Data)" }).addTo(map);
  map.attributionControl.setPrefix('<a href="https://leafletjs.com">Leaflet</a>');
  // Only report an outage when a whole view loaded no tile at all; a missing edge tile is not an outage.
  let loaded = 0;
  let failed = 0;
  tiles.on("loading", () => { loaded = 0; failed = 0; });
  tiles.on("tileload", () => { loaded += 1; });
  tiles.on("tileerror", () => { failed += 1; });
  tiles.on("load", () => onTilesFailed(loaded === 0 && failed > 0));

  let markers = [];
  let ring = null;
  map.on("click", event => onPick({ lat: event.latlng.lat, lon: event.latlng.lng }));

  return {
    setRecords(records) {
      markers.forEach(({ layer }) => layer.remove());
      markers = records.filter(record => record.geo).map(record => {
        const layer = L.circleMarker([record.geo.lat, record.geo.lon], BASE[statusKind(record.status)]).addTo(map);
        layer.bindTooltip(() => tooltipNode(record));
        layer.on("click", event => { L.DomEvent.stopPropagation(event); onPick(record.geo); });
        return { record, layer };
      });
      if (markers.length) map.fitBounds(L.latLngBounds(markers.map(({ record }) => [record.geo.lat, record.geo.lon])).pad(.05));
    },
    restyle({ selectedKeys, visibleKeys }) {
      for (const { record, layer } of markers) {
        const style = { ...BASE[statusKind(record.status)] };
        if (record.outsideWard === true) style.dashArray = "2 3";
        Object.assign(style, visibleKeys.has(record.key) ? {} : HIDDEN, selectedKeys.has(record.key) ? SELECTED : {});
        layer.setStyle({ opacity: 1, ...style });
        if (selectedKeys.has(record.key)) layer.bringToFront();
      }
    },
    setArea(center, radiusM, { pan = false } = {}) {
      ring?.remove();
      ring = null;
      if (!center) return;
      ring = L.circle([center.lat, center.lon], { radius: radiusM, color: "#5b316b", weight: 2, dashArray: "6 5", fill: false, interactive: false }).addTo(map);
      if (pan) map.fitBounds(ring.getBounds().pad(.6), { maxZoom: 17 });
    },
    resize() { map.invalidateSize(); },
    container: map.getContainer()
  };
}
