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
