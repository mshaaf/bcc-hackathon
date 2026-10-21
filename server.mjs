import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { fetchArcGisSnapshot, fetchWardBoundary } from "./lib/block-ops.mjs";
import { DEMO_COMMUNITY_ID, isUuid } from "./lib/community.mjs";

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
  ["/community.mjs", ["public/community.mjs", "text/javascript; charset=utf-8"]],
  ["/community-api.mjs", ["public/community-api.mjs", "text/javascript; charset=utf-8"]],
  ["/lib/community.mjs", ["lib/community.mjs", "text/javascript; charset=utf-8"]],
  ["/vendor/supabase/supabase.js", ["public/vendor/supabase/supabase.js", "text/javascript; charset=utf-8"]],
  ["/api/recorded", ["data/recorded-snapshot.json", "application/json; charset=utf-8"]],
  ["/api/demo", ["data/demo.json", "application/json; charset=utf-8"]]
]);

// Browser-safe shared-community settings from the environment: the project URL and the *publishable* key only.
// Returns null when unset. Throws on a secret/service-role key so it can never be served to a browser.
export function communityConfigFrom(env = process.env) {
  const url = env.COMMUNITY_SUPABASE_URL?.trim().replace(/\/+$/, "");
  const publishableKey = env.COMMUNITY_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!url && !publishableKey) return null;
  if (!url || !publishableKey) throw new Error("Set both COMMUNITY_SUPABASE_URL and COMMUNITY_SUPABASE_PUBLISHABLE_KEY, or neither.");
  const parsed = new URL(url);
  if (!["http:", "https:"].includes(parsed.protocol) || parsed.username || parsed.password || parsed.pathname !== "/" || parsed.search || parsed.hash) {
    throw new Error("COMMUNITY_SUPABASE_URL must be a plain http(s) origin such as https://abcd.supabase.co.");
  }
  let jwtRole = null;
  try { jwtRole = JSON.parse(Buffer.from(publishableKey.split(".")[1] ?? "", "base64url").toString()).role; } catch { /* not a JWT */ }
  if (/^sb_secret_/.test(publishableKey) || jwtRole === "service_role") throw new Error("COMMUNITY_SUPABASE_PUBLISHABLE_KEY looks like a secret/service-role key. Only the publishable (anon) key may be served to browsers.");
  const communityId = env.COMMUNITY_ID?.trim() || DEMO_COMMUNITY_ID;
  if (!isUuid(communityId)) throw new Error("COMMUNITY_ID must be a UUID.");
  const wsOrigin = parsed.origin.replace(/^http/, "ws");
  return { url: parsed.origin, publishableKey, communityId, connectSources: [parsed.origin, wsOrigin] };
}

function setHeaders(response, community) {
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("Referrer-Policy", "no-referrer");
  response.setHeader("X-Frame-Options", "DENY");
  response.setHeader("Cache-Control", "no-store");
  response.setHeader("Content-Security-Policy", `default-src 'self'; connect-src ${["'self'", ...(community?.connectSources ?? [])].join(" ")}; script-src 'self'; style-src 'self'; img-src 'self' data: https://maps2.dcgis.dc.gov; base-uri 'none'; form-action 'self'; frame-ancestors 'none'`);
}

function sendJson(response, status, value) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(value));
}

export function createAppServer({ fetchImpl = globalThis.fetch, community = null } = {}) {
  return createServer(async (request, response) => {
    setHeaders(response, community);
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

    if (pathname === "/api/community-config") {
      if (!community) { sendJson(response, 404, { error: "The shared community is not configured on this server." }); return; }
      sendJson(response, 200, { url: community.url, publishableKey: community.publishableKey, communityId: community.communityId });
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
  createAppServer({ community: communityConfigFrom() }).listen(PORT, HOST, () => {
    console.log(`Block Ops is running at http://${HOST}:${PORT}`);
  });
}
