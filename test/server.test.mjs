import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync, readdirSync } from "node:fs";
import { communityConfigFrom, createAppServer, isMainModule, listenSettings } from "../server.mjs";

async function withServer(server, run) {
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  try {
    await run(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
}

test("serves the app and fictional fixture from the explicit route list", async () => {
  const server = createAppServer();
  await withServer(server, async baseUrl => {
    const page = await fetch(baseUrl);
    assert.equal(page.status, 200);
    assert.match(await page.text(), /Block Ops/);

    const demo = await fetch(`${baseUrl}/api/demo`);
    const fixture = await demo.json();
    assert.equal(demo.status, 200);
    assert.equal(fixture.mode, "demo");
    assert.equal(fixture.fictional, true);

    const privateFile = await fetch(`${baseUrl}/README.md`);
    assert.equal(privateFile.status, 404);
  });
});

test("serves the map workspace and vendored Leaflet explicitly, with only the DC GIS tile origin added", async () => {
  const server = createAppServer();
  await withServer(server, async baseUrl => {
    for (const path of ["/", "/app.mjs", "/map.mjs", "/storage.mjs", "/lib/campaign.mjs", "/lib/recurrence.mjs", "/lib/block-ops.mjs", "/styles.css", "/vendor/leaflet/leaflet.js", "/vendor/leaflet/leaflet.css"]) {
      assert.equal((await fetch(`${baseUrl}${path}`)).status, 200, path);
    }
    for (const path of ["/prototype", "/prototype.mjs", "/vendor/leaflet/LICENSE", "/vendor/../server.mjs"]) {
      assert.equal((await fetch(`${baseUrl}${path}`)).status, 404, path);
    }

    const csp = (await fetch(baseUrl)).headers.get("content-security-policy");
    assert.match(csp, /img-src 'self' data: https:\/\/maps2\.dcgis\.dc\.gov;/);
    assert.match(csp, /script-src 'self';/);
    assert.match(csp, /connect-src 'self';/);
  });
});

test("serves only the fixed Ward 8 boundary, and reports a boundary outage", async () => {
  let requestedUrl;
  const ring = [[-76.99, 38.83], [-76.95, 38.83], [-76.95, 38.88], [-76.99, 38.88], [-76.99, 38.83]];
  const server = createAppServer({ fetchImpl: async url => { requestedUrl = new URL(url); return { ok: true, json: async () => ({ features: [{ geometry: { rings: [ring] } }] }) }; } });
  await withServer(server, async baseUrl => {
    const response = await fetch(`${baseUrl}/api/ward8?where=1=1`);
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(requestedUrl.searchParams.get("where"), "WARD=8");
    assert.equal(body.rings.length, 1);
    assert.equal((await fetch(`${baseUrl}/api/ward8`, { method: "POST" })).status, 405);
  });

  const failed = createAppServer({ fetchImpl: async () => { throw new Error("offline"); } });
  await withServer(failed, async baseUrl => {
    const response = await fetch(`${baseUrl}/api/ward8`);
    assert.equal(response.status, 502);
    assert.match((await response.json()).error, /boundary could not be loaded/i);
  });
});

test("serves the recorded snapshot from a fixed GET route", async () => {
  const server = createAppServer();
  await withServer(server, async baseUrl => {
    const response = await fetch(`${baseUrl}/api/recorded?file=../server.mjs`);
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.format, 1);
    assert.ok(Array.isArray(body.features) && body.features.length > 0);
    assert.equal((await fetch(`${baseUrl}/api/recorded`, { method: "POST" })).status, 405);
  });
});

test("proxies only the fixed public query and rejects source outages", async () => {
  let requestedUrl;
  const server = createAppServer({
    fetchImpl: async url => {
      requestedUrl = new URL(url);
      return { ok: true, json: async () => ({ exceededTransferLimit: false, features: [] }) };
    }
  });
  await withServer(server, async baseUrl => {
    const response = await fetch(`${baseUrl}/api/requests?url=https://example.com`);
    assert.equal(response.status, 200);
    assert.equal(requestedUrl.hostname, "maps2.dcgis.dc.gov");
    assert.match(requestedUrl.searchParams.get("where"), /WARD='Ward 8'/);
    assert.doesNotMatch(requestedUrl.searchParams.get("where"), /example\.com/);
  });

  const failedServer = createAppServer({ fetchImpl: async () => { throw new Error("offline"); } });
  await withServer(failedServer, async baseUrl => {
    const response = await fetch(`${baseUrl}/api/requests`);
    const body = await response.json();
    assert.equal(response.status, 502);
    assert.match(body.error, /could not be refreshed/i);
  });
});

test("accepts reads only", async () => {
  const server = createAppServer();
  await withServer(server, async baseUrl => {
    const response = await fetch(`${baseUrl}/api/requests`, { method: "POST" });
    assert.equal(response.status, 405);
  });
});

test("recognizes the documented relative Node entrypoint", () => {
  assert.equal(isMainModule(new URL("../server.mjs", import.meta.url).href, "server.mjs"), true);
  assert.equal(isMainModule(new URL("../server.mjs", import.meta.url).href, "test/server.test.mjs"), false);
});

const CONFIG_ENV = { COMMUNITY_SUPABASE_URL: "http://127.0.0.1:54321/", COMMUNITY_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_example" };

test("shared community settings are optional, browser-safe, and add only the exact provider origins to the CSP", async () => {
  assert.equal(communityConfigFrom({}), null);
  await withServer(createAppServer(), async baseUrl => {
    const missing = await fetch(`${baseUrl}/api/community-config`);
    assert.equal(missing.status, 404, "unset configuration is reported, not faked");
    assert.match((await fetch(baseUrl)).headers.get("content-security-policy"), /connect-src 'self';/);
  });
  const community = communityConfigFrom(CONFIG_ENV);
  await withServer(createAppServer({ community }), async baseUrl => {
    const response = await fetch(`${baseUrl}/api/community-config`);
    assert.deepEqual(await response.json(), { url: "http://127.0.0.1:54321", publishableKey: "sb_publishable_example", communityId: "b10c0000-0000-4000-8000-000000000001" });
    const csp = (await fetch(baseUrl)).headers.get("content-security-policy");
    assert.match(csp, /connect-src 'self' http:\/\/127\.0\.0\.1:54321 ws:\/\/127\.0\.0\.1:54321;/);
    assert.doesNotMatch(csp, /\*/, "no wildcard sources");
    assert.match(csp, /script-src 'self';/);
    for (const path of ["/community.mjs", "/community-api.mjs", "/lib/community.mjs", "/lib/mission.mjs", "/lib/drafts.mjs", "/shell.mjs", "/posts.mjs", "/mission.mjs", "/vendor/supabase/supabase.js", "/vendor/qrcode/qrcode.js"]) {
      assert.equal((await fetch(`${baseUrl}${path}`)).status, 200, path);
    }
    assert.equal((await fetch(`${baseUrl}/vendor/supabase/LICENSE`)).status, 404, "only listed files are served");
    assert.equal((await fetch(`${baseUrl}/vendor/qrcode/README.txt`)).status, 404);
    assert.equal((await fetch(`${baseUrl}/supabase/config.toml`)).status, 404);
  });
});

test("a secret or service-role key, a partial setup, or a bad URL is refused instead of served to browsers", () => {
  assert.throws(() => communityConfigFrom({ ...CONFIG_ENV, COMMUNITY_SUPABASE_PUBLISHABLE_KEY: "sb_secret_abc" }), /secret/i);
  const serviceRole = `x.${Buffer.from(JSON.stringify({ role: "service_role" })).toString("base64url")}.y`;
  assert.throws(() => communityConfigFrom({ ...CONFIG_ENV, COMMUNITY_SUPABASE_PUBLISHABLE_KEY: serviceRole }), /secret|service-role/i);
  const anon = `x.${Buffer.from(JSON.stringify({ role: "anon" })).toString("base64url")}.y`;
  assert.equal(communityConfigFrom({ ...CONFIG_ENV, COMMUNITY_SUPABASE_PUBLISHABLE_KEY: anon }).publishableKey, anon);
  assert.throws(() => communityConfigFrom({ COMMUNITY_SUPABASE_URL: "http://127.0.0.1:54321" }), /both/i);
  assert.throws(() => communityConfigFrom({ ...CONFIG_ENV, COMMUNITY_SUPABASE_URL: "javascript:alert(1)" }), /http/i);
  assert.throws(() => communityConfigFrom({ ...CONFIG_ENV, COMMUNITY_SUPABASE_URL: "https://user:pw@x.supabase.co" }), /origin/i);
  assert.throws(() => communityConfigFrom({ ...CONFIG_ENV, COMMUNITY_ID: "not-a-uuid" }), /UUID/);
});


test("hosting settings: local-only by default, PORT and HOST from the environment, bad ports refused", () => {
  assert.deepEqual(listenSettings({}), { host: "127.0.0.1", port: 8000 });
  assert.deepEqual(listenSettings({ PORT: "10000", HOST: "0.0.0.0" }), { host: "0.0.0.0", port: 10000 });
  assert.deepEqual(listenSettings({ PORT: " ", HOST: " " }), { host: "127.0.0.1", port: 8000 });
  for (const PORT of ["abc", "-1", "70000", "80.5"]) assert.throws(() => listenSettings({ PORT }), /PORT must be/);
});

test("a health check answers without touching any outside service, and HSTS is sent only behind an HTTPS proxy", async () => {
  const server = createAppServer({ fetchImpl: async () => { throw new Error("health must not call out"); } });
  await withServer(server, async baseUrl => {
    const health = await fetch(`${baseUrl}/healthz`);
    assert.equal(health.status, 200);
    assert.deepEqual(await health.json(), { ok: true });
    assert.equal(health.headers.get("strict-transport-security"), null, "plain local http gets no HSTS");
    const proxied = await fetch(`${baseUrl}/healthz`, { headers: { "x-forwarded-proto": "https" } });
    assert.match(proxied.headers.get("strict-transport-security"), /max-age=\d+/);
    assert.equal((await fetch(`${baseUrl}/healthz`, { method: "POST" })).status, 405);
  });
});

test("every module the pages import is served (a missing route would break a hosted deploy)", async () => {
  const server = createAppServer();
  const files = [...readdirSync(new URL("../public/", import.meta.url)).filter(name => name.endsWith(".mjs")).map(name => `public/${name}`), ...readdirSync(new URL("../lib/", import.meta.url)).filter(name => name.endsWith(".mjs")).map(name => `lib/${name}`)];
  const wanted = new Set(["/app.mjs", "/shell.mjs", "/community.mjs", "/mission.mjs", "/posts.mjs", "/community-api.mjs", "/map.mjs", "/storage.mjs"]);
  for (const file of files) for (const match of readFileSync(new URL(`../${file}`, import.meta.url), "utf8").matchAll(/from\s+"(\/[^"]+\.mjs)"/g)) wanted.add(match[1]);
  const html = readFileSync(new URL("../public/index.html", import.meta.url), "utf8");
  for (const match of html.matchAll(/(?:src|href)="(\/[^"#?]+)"/g)) wanted.add(match[1]);
  await withServer(server, async baseUrl => {
    for (const path of wanted) assert.equal((await fetch(`${baseUrl}${path}`)).status, 200, `${path} must be served`);
  });
});

test("deploy preflight reports local stacks, plain-http hosts, secret keys and missing settings without printing keys", async () => {
  const { checkDeployEnv } = await import("../scripts/check-deploy-config.mjs");
  const hosted = checkDeployEnv({ COMMUNITY_SUPABASE_URL: "https://abcd.supabase.co", COMMUNITY_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_abc", PORT: "10000", HOST: "0.0.0.0" });
  assert.deepEqual(hosted.errors, []);
  assert.deepEqual(hosted.warnings, []);
  assert.ok(!JSON.stringify(hosted.info).includes("sb_publishable_abc"), "the key is never printed");
  assert.match(checkDeployEnv({ COMMUNITY_SUPABASE_URL: "http://127.0.0.1:54321", COMMUNITY_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_abc" }).warnings.join(" "), /local test stack/);
  assert.match(checkDeployEnv({ COMMUNITY_SUPABASE_URL: "http://abcd.supabase.co", COMMUNITY_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_abc" }).errors.join(" "), /must be https/);
  assert.match(checkDeployEnv({ COMMUNITY_SUPABASE_URL: "https://abcd.supabase.co", COMMUNITY_SUPABASE_PUBLISHABLE_KEY: "sb_secret_abc" }).errors.join(" "), /secret/);
  assert.match(checkDeployEnv({}).errors.join(" "), /not set/);
  assert.match(checkDeployEnv({ COMMUNITY_SUPABASE_URL: "https://abcd.supabase.co", COMMUNITY_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_abc", COMMUNITY_SUPABASE_SECRET_KEY: "sb_secret_x" }).warnings.join(" "), /do not set it on the host/);
  assert.match(checkDeployEnv({ COMMUNITY_SUPABASE_URL: "https://abcd.supabase.co", COMMUNITY_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_abc", PORT: "x" }).errors.join(" "), /PORT/);
});
