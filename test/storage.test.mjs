import assert from "node:assert/strict";
import test from "node:test";
import { createCampaignStorage, STORE_KEY } from "../public/storage.mjs";
import { emptyStore } from "../lib/campaign.mjs";

class FakeStorage {
  constructor(initial = {}) { this.data = new Map(Object.entries(initial)); this.failKey = null; this.quota = false; }
  getItem(key) { return this.data.has(key) ? this.data.get(key) : null; }
  setItem(key, value) {
    if (this.quota || key === this.failKey) { const error = new Error("full"); error.name = "QuotaExceededError"; throw error; }
    this.data.set(key, String(value));
  }
  removeItem(key) { this.data.delete(key); }
}

const campaign = (id, extra = {}) => ({
  id, name: "1900 block of Naylor Rd SE", objective: "Stop repeat dumping", createdAt: "2026-10-21T18:00:00.000Z", updatedAt: "2026-10-21T18:00:00.000Z",
  source: { mode: "live", sourceUrl: null, retrievedAt: null, window: null }, area: { center: { lat: 38.8, lon: -76.9 }, radiusM: 150 },
  filters: { days: null, kinds: ["open", "closed", "other"] }, evidence: [{ key: "request:A", id: "A" }], observations: [], tasks: [],
  request: { text: "Please share an update.", confirmedAt: null }, ...extra
});
const store = (...campaigns) => ({ version: 1, campaigns });

test("saves, then reloads the same campaigns", () => {
  const storage = new FakeStorage();
  const api = createCampaignStorage(() => storage);
  assert.equal(api.load().status, "empty");
  const saved = api.save(store(campaign("one", { objective: "Keep this wording" })));
  assert.equal(saved.ok, true);
  assert.equal(storage.getItem(`${STORE_KEY}.tmp`), null, "temp key is cleaned up");

  const loaded = createCampaignStorage(() => storage).load();
  assert.equal(loaded.status, "ok");
  assert.equal(loaded.store.campaigns[0].objective, "Keep this wording");
});

test("the previous valid save is kept as a backup when a newer one replaces it", () => {
  const storage = new FakeStorage();
  const api = createCampaignStorage(() => storage);
  api.save(store(campaign("one")));
  api.save(store(campaign("one"), campaign("two")));
  assert.equal(JSON.parse(storage.getItem(`${STORE_KEY}.backup`)).campaigns.length, 1);
  assert.equal(JSON.parse(storage.getItem(STORE_KEY)).campaigns.length, 2);
});

test("a full browser store reports an error and leaves the last valid save alone", () => {
  const storage = new FakeStorage();
  const api = createCampaignStorage(() => storage);
  api.save(store(campaign("one")));
  const before = storage.getItem(STORE_KEY);

  for (const failing of ["tmp", "main", "all"]) {
    storage.failKey = failing === "tmp" ? `${STORE_KEY}.tmp` : failing === "main" ? STORE_KEY : null;
    storage.quota = failing === "all";
    const result = api.save(store(campaign("one"), campaign("two")));
    assert.equal(result.ok, false);
    assert.equal(result.reason, "quota");
    assert.match(result.message, /storage is full/i);
    assert.equal(storage.getItem(STORE_KEY), before, `last valid save untouched (${failing})`);
    assert.equal(storage.getItem(`${STORE_KEY}.tmp`), null);
  }
  storage.failKey = null; storage.quota = false;
  assert.equal(api.save(store(campaign("one"), campaign("two"))).ok, true, "saving works again once space is available");
});

test("corrupt saved data shows an error, is not overwritten, and turns saving off", () => {
  const storage = new FakeStorage({ [STORE_KEY]: "{not json" });
  const api = createCampaignStorage(() => storage);
  const loaded = api.load();
  assert.equal(loaded.status, "error");
  assert.equal(loaded.reason, "corrupt");
  assert.match(loaded.message, /not overwritten/i);
  assert.deepEqual(loaded.store, emptyStore());

  const result = api.save(store(campaign("new")));
  assert.equal(result.ok, false);
  assert.equal(result.reason, "locked");
  assert.equal(storage.getItem(STORE_KEY), "{not json");
  assert.equal(storage.getItem(`${STORE_KEY}.backup`), null);
});

test("an unknown version or a malformed campaign is refused without touching storage", () => {
  const newer = JSON.stringify({ version: 2, campaigns: [] });
  const badCampaign = JSON.stringify({ version: 1, campaigns: [{ id: "x" }] });
  for (const raw of [newer, badCampaign, "[]", "null", JSON.stringify({ version: 1, campaigns: [campaign("a"), campaign("a")] })]) {
    const storage = new FakeStorage({ [STORE_KEY]: raw });
    const api = createCampaignStorage(() => storage);
    const loaded = api.load();
    assert.equal(loaded.status, "error", raw);
    assert.equal(api.save(store(campaign("z"))).ok, false);
    assert.equal(storage.getItem(STORE_KEY), raw, "stored value is byte-for-byte unchanged");
  }
  assert.equal(createCampaignStorage(() => new FakeStorage({ [STORE_KEY]: newer })).load().reason, "version");
});

test("disabled browser storage is reported and does not throw", () => {
  const api = createCampaignStorage(() => { throw new Error("denied"); });
  const loaded = api.load();
  assert.equal(loaded.status, "error");
  assert.equal(loaded.reason, "unavailable");
  assert.equal(api.save(store(campaign("one"))).ok, false);
});

test("a store that fails validation is never written", () => {
  const storage = new FakeStorage();
  const api = createCampaignStorage(() => storage);
  const result = api.save({ version: 1, campaigns: [{ id: "broken" }] });
  assert.equal(result.ok, false);
  assert.equal(result.reason, "invalid");
  assert.equal(storage.getItem(STORE_KEY), null);
});

test("a copy that does not read back correctly is not promoted", () => {
  const storage = new FakeStorage();
  const api = createCampaignStorage(() => storage);
  api.save(store(campaign("one")));
  const before = storage.getItem(STORE_KEY);
  const original = storage.getItem.bind(storage);
  storage.getItem = key => key.endsWith(".tmp") ? "garbled" : original(key);
  const result = api.save(store(campaign("one"), campaign("two")));
  assert.equal(result.ok, false);
  assert.equal(storage.data.get(STORE_KEY), before);
});
