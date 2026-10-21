import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { fetchArcGisSnapshot, fetchWardBoundary } from "./lib/block-ops.mjs";

const ROOT = dirname(fileURLToPath(import.meta.url));
const HOST = "127.0.0.1";
const PORT = 8000;
const ASSETS = new Map([
  ["/", ["public/index.html", "text/html; charset=utf-8"]],
  ["/app.mjs", ["public/app.mjs", "text/javascript; charset=utf-8"]],
  ["/styles.css", ["public/styles.css", "text/css; charset=utf-8"]],
  ["/lib/block-ops.mjs", ["lib/block-ops.mjs", "text/javascript; charset=utf-8"]],
  ["/storage.mjs", ["public/storage.mjs", "text/javascript; charset=utf-8"]],
  ["/lib/recurrence.mjs", ["lib/recurrence.mjs", "text/javascript; charset=utf-8"]],
  ["/lib/campaign.mjs", ["lib/campaign.mjs", "text/javascript; charset=utf-8"]],
  ["/map.mjs", ["public/map.mjs", "text/javascript; charset=utf-8"]],
  ["/vendor/leaflet/leaflet.js", ["public/vendor/leaflet/leaflet.js", "text/javascript; charset=utf-8"]],
  ["/vendor/leaflet/leaflet.css", ["public/vendor/leaflet/leaflet.css", "text/css; charset=utf-8"]],
  ["/api/recorded", ["data/recorded-snapshot.json", "application/json; charset=utf-8"]],
  ["/api/demo", ["data/demo.json", "application/json; charset=utf-8"]]
]);

function setHeaders(response) {
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("Referrer-Policy", "no-referrer");
  response.setHeader("X-Frame-Options", "DENY");
  response.setHeader("Cache-Control", "no-store");
  response.setHeader("Content-Security-Policy", "default-src 'self'; connect-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: https://maps2.dcgis.dc.gov; base-uri 'none'; form-action 'self'; frame-ancestors 'none'");
}

function sendJson(response, status, value) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(value));
}

export function createAppServer({ fetchImpl = globalThis.fetch } = {}) {
  return createServer(async (request, response) => {
    setHeaders(response);
    if (request.method !== "GET") {
      response.setHeader("Allow", "GET");
      sendJson(response, 405, { error: "This local app accepts read requests only." });
      return;
    }

    const pathname = new URL(request.url || "/", "http://127.0.0.1").pathname;
    if (pathname === "/api/requests") {
      try {
        sendJson(response, 200, await fetchArcGisSnapshot(fetchImpl));
      } catch {
        sendJson(response, 502, { error: "Live DC 311 data could not be refreshed. Your current draft remains available." });
      }
      return;
    }

    if (pathname === "/api/ward8") {
      try {
        sendJson(response, 200, await fetchWardBoundary(fetchImpl));
      } catch {
        sendJson(response, 502, { error: "The Ward 8 boundary could not be loaded, so boundary flags are unavailable." });
      }
      return;
    }

    const asset = ASSETS.get(pathname);
    if (!asset) {
      sendJson(response, 404, { error: "Page not found." });
      return;
    }
    try {
      const body = await readFile(join(ROOT, asset[0]));
      response.writeHead(200, { "Content-Type": asset[1] });
      response.end(body);
    } catch {
      sendJson(response, 500, { error: "The local app file could not be read." });
    }
  });
}

export function isMainModule(moduleUrl, entryPath) {
  return Boolean(entryPath) && fileURLToPath(moduleUrl) === resolve(entryPath);
}

if (isMainModule(import.meta.url, process.argv[1])) {
  createAppServer().listen(PORT, HOST, () => {
    console.log(`Block Ops is running at http://${HOST}:${PORT}`);
  });
}
