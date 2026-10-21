import assert from "node:assert/strict";
import test from "node:test";
import { createAppServer, isMainModule } from "../server.mjs";

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
    for (const path of ["/", "/app.mjs", "/map.mjs", "/styles.css", "/vendor/leaflet/leaflet.js", "/vendor/leaflet/leaflet.css"]) {
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
