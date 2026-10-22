import assert from "node:assert/strict";
import test from "node:test";
import { clearIfUnchanged, draftStoreKey, readDrafts, writeDrafts } from "../lib/drafts.mjs";

const memoryStorage = () => { const map = new Map(); return { getItem: key => map.get(key) ?? null, setItem: (key, value) => map.set(key, value), removeItem: key => map.delete(key), map }; };
const X = "community-x", Y = "community-y";

test("drafts round-trip per community and blank drafts are not kept", () => {
  const storage = memoryStorage();
  writeDrafts(storage, X, { new: "hello", "reply:1": "   ", other: "kept" });
  assert.deepEqual(readDrafts(storage, X), { new: "hello", other: "kept" });
  assert.deepEqual(readDrafts(storage, Y), {});
  writeDrafts(storage, X, { new: " " });
  assert.equal(storage.getItem(draftStoreKey(X)), null, "an empty store removes its key");
});

test("corrupt or hostile saved drafts read as empty", () => {
  const storage = memoryStorage();
  storage.setItem(draftStoreKey(X), "{not json");
  assert.deepEqual(readDrafts(storage, X), {});
  storage.setItem(draftStoreKey(X), JSON.stringify(["a"]));
  assert.deepEqual(readDrafts(storage, X), {});
  storage.setItem(draftStoreKey(X), JSON.stringify({ a: 1, b: "ok", c: null }));
  assert.deepEqual(readDrafts(storage, X), { b: "ok" });
});

test("B1 repair: a successful send clears the sent text but keeps newer text typed while it was pending", () => {
  const storage = memoryStorage();
  const memory = new Map([["new", "first message"]]);
  const submitted = memory.get("new");
  memory.set("new", "first message, and then the next thing I started typing");
  writeDrafts(storage, X, Object.fromEntries(memory));
  const cleared = clearIfUnchanged({ storage, activeCommunityId: X, memory, communityId: X, key: "new", submitted });
  assert.equal(cleared, false);
  assert.equal(memory.get("new"), "first message, and then the next thing I started typing");
  assert.deepEqual(readDrafts(storage, X), { new: "first message, and then the next thing I started typing" });
});

test("a successful send whose text is unchanged clears the draft in memory and in storage", () => {
  const storage = memoryStorage();
  const memory = new Map([["new", "send me"], ["reply:9", "keep me"]]);
  writeDrafts(storage, X, Object.fromEntries(memory));
  assert.equal(clearIfUnchanged({ storage, activeCommunityId: X, memory, communityId: X, key: "new", submitted: "send me" }), true);
  assert.deepEqual([...memory], [["reply:9", "keep me"]]);
  assert.deepEqual(readDrafts(storage, X), { "reply:9": "keep me" });
});

test("B1 repair: a send that finishes after navigating to another community never touches the draft now on screen", () => {
  const storage = memoryStorage();
  writeDrafts(storage, X, { new: "sent from X", "reply:2": "other X draft" });
  writeDrafts(storage, Y, { new: "sent from X" });
  const onScreen = new Map([["new", "sent from X"]]); // same key and text in the community now showing
  const cleared = clearIfUnchanged({ storage, activeCommunityId: Y, memory: onScreen, communityId: X, key: "new", submitted: "sent from X" });
  assert.equal(cleared, true, "X's saved draft is cleared");
  assert.deepEqual(readDrafts(storage, X), { "reply:2": "other X draft" });
  assert.equal(onScreen.get("new"), "sent from X", "Y's on-screen draft is untouched");
  assert.deepEqual(readDrafts(storage, Y), { new: "sent from X" });
});

test("navigating away: newer saved text in the finished community survives its late completion", () => {
  const storage = memoryStorage();
  writeDrafts(storage, X, { new: "second message, typed during the send" });
  assert.equal(clearIfUnchanged({ storage, activeCommunityId: Y, memory: new Map(), communityId: X, key: "new", submitted: "first message" }), false);
  assert.deepEqual(readDrafts(storage, X), { new: "second message, typed during the send" });
});

test("a storage that throws does not break draft handling", () => {
  const broken = { getItem() { throw new Error("denied"); }, setItem() { throw new Error("denied"); }, removeItem() { throw new Error("denied"); } };
  assert.deepEqual(readDrafts(broken, X), {});
  assert.doesNotThrow(() => writeDrafts(broken, X, { a: "b" }));
  const memory = new Map([["a", "b"]]);
  assert.equal(clearIfUnchanged({ storage: broken, activeCommunityId: X, memory, communityId: X, key: "a", submitted: "b" }), true);
});
