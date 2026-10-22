// Preflight for a hosted deploy. Reads the environment the host will provide (never prints a key) and says what is wrong.
//   node --env-file=.env scripts/check-deploy-config.mjs [--probe]
// --probe makes one read-only call to the configured Supabase project (community_preview) to confirm the migrations are applied.
import { readdirSync } from "node:fs";
import { communityConfigFrom, isMainModule, listenSettings } from "../server.mjs";

const isLocalHost = hostname => ["localhost", "127.0.0.1", "::1", "[::1]", "0.0.0.0"].includes(hostname) || hostname.endsWith(".local");

// Pure: returns { errors, warnings, info, config } so it can be tested without a network.
export function checkDeployEnv(env = process.env) {
  const errors = [], warnings = [], info = [];
  let config = null;
  try { config = communityConfigFrom(env); } catch (error) { errors.push(error.message); }
  if (!config && !errors.length) errors.push("COMMUNITY_SUPABASE_URL and COMMUNITY_SUPABASE_PUBLISHABLE_KEY are not set, so the hosted app would serve only the map and local campaigns.");
  if (config) {
    const url = new URL(config.url);
    if (isLocalHost(url.hostname)) warnings.push(`${config.url} is the local test stack, not a hosted project. Phones on other networks cannot reach it.`);
    else if (url.protocol !== "https:") errors.push("A hosted Supabase URL must be https.");
    else info.push(`Supabase origin ${config.url} (https). Browser connections allowed: ${config.connectSources.join(", ")}.`);
    const key = env.COMMUNITY_SUPABASE_PUBLISHABLE_KEY.trim();
    if (key.startsWith("sb_publishable_")) info.push("Key format: publishable.");
    else warnings.push("The key is not in the sb_publishable_… format; make sure it is the project's publishable (anon) key.");
    info.push(`Default community: ${config.communityId}${config.communityId === "b10c0000-0000-4000-8000-000000000001" ? " (the seeded demonstration community; supabase/seed.sql must be run once on a hosted project)" : ""}.`);
  }
  if (env.COMMUNITY_SUPABASE_SECRET_KEY) warnings.push("COMMUNITY_SUPABASE_SECRET_KEY is set. Only the integration tests use it; do not set it on the host.");
  try { const { host, port } = listenSettings(env); info.push(`Will listen on ${host}:${port}${host === "127.0.0.1" ? " (this computer only; set HOST=0.0.0.0 on a host)" : ""}.`); } catch (error) { errors.push(error.message); }
  return { errors, warnings, info, config };
}

export const migrationFiles = () => readdirSync(new URL("../supabase/migrations/", import.meta.url)).filter(name => name.endsWith(".sql")).sort();

async function probe(config, fetchImpl = fetch) {
  const response = await fetchImpl(`${config.url}/rest/v1/rpc/community_preview`, {
    method: "POST", headers: { apikey: config.publishableKey, "Content-Type": "application/json" }, body: JSON.stringify({ p_id: config.communityId })
  });
  if (!response.ok) return { ok: false, message: `community_preview answered ${response.status}. Are all migrations applied?` };
  const rows = await response.json();
  return Array.isArray(rows) && rows.length ? { ok: true, message: `community_preview found "${rows[0].title}". The migrations and the default community are in place.` } : { ok: false, message: "The migrations answer, but the default community does not exist. Run supabase/seed.sql once or set COMMUNITY_ID." };
}

if (isMainModule(import.meta.url, process.argv[1])) {
  const result = checkDeployEnv();
  for (const line of result.info) console.log(`ok     ${line}`);
  for (const line of result.warnings) console.log(`WARN   ${line}`);
  for (const line of result.errors) console.log(`ERROR  ${line}`);
  console.log(`info   ${migrationFiles().length} migrations must be applied in order: ${migrationFiles().join(", ")}`);
  console.log("manual Supabase dashboard checks (not detectable from here): anonymous sign-ins enabled; CAPTCHA/rate limits chosen for anonymous sign-ins; Realtime publication contains posts, missions, mission_tasks, communities and NOT community_members.");
  if (process.argv.includes("--probe") && result.config) {
    try { const outcome = await probe(result.config); console.log(`${outcome.ok ? "ok    " : "ERROR "} ${outcome.message}`); if (!outcome.ok) result.errors.push(outcome.message); } catch (error) { console.log(`ERROR  Could not reach the project: ${error.message}`); result.errors.push("unreachable"); }
  }
  process.exitCode = result.errors.length ? 1 : 0;
}
