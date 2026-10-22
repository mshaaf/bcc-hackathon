import assert from "node:assert/strict";
import test from "node:test";
import {
  CommunityError, DEMO_COMMUNITY_ID, LIMITS, buildThreads, cleanBody, cleanDisplayName, describeError, isUuid,
  newOperationId, normalizePost, postActions, toCommunityError
} from "../lib/community.mjs";

test("display names are trimmed and bounded to 1–40 characters", () => {
  assert.deepEqual(cleanDisplayName("  Dana  "), { ok: true, value: "Dana" });
  assert.equal(cleanDisplayName("").ok, false);
  assert.equal(cleanDisplayName("   ").ok, false);
  assert.equal(cleanDisplayName(null).ok, false);
  assert.equal(cleanDisplayName("x".repeat(LIMITS.displayName)).ok, true);
  assert.equal(cleanDisplayName("x".repeat(LIMITS.displayName + 1)).ok, false);
  assert.equal(cleanDisplayName("😀".repeat(LIMITS.displayName)).ok, true, "limits count characters, not UTF-16 units");
  assert.equal(cleanDisplayName("bad\u0007name").ok, false, "control characters are refused");
});

test("post bodies are trimmed and bounded to 1–2,000 characters, and keep markup as plain text", () => {
  assert.equal(cleanBody("  hello  ").value, "hello");
  assert.equal(cleanBody("<b>hi</b>").value, "<b>hi</b>", "no markup interpretation; rendering uses textContent");
  assert.equal(cleanBody("").ok, false);
  assert.equal(cleanBody(" \n ").ok, false);
  assert.equal(cleanBody("x".repeat(LIMITS.body)).ok, true);
  const over = cleanBody("x".repeat(LIMITS.body + 1));
  assert.equal(over.ok, false);
  assert.match(over.error, /2,000 characters.*2,001/);
});

test("operation ids are UUIDs and differ per send", () => {
  const first = newOperationId();
  assert.ok(isUuid(first));
  assert.notEqual(first, newOperationId());
  const fallback = newOperationId({ getRandomValues: bytes => bytes.fill(7) });
  assert.ok(isUuid(fallback), fallback);
  assert.ok(isUuid(DEMO_COMMUNITY_ID));
  assert.equal(isUuid("not-a-uuid"), false);
});

const post = (id, createdAt, over = {}) => ({ id, communityId: "c", parentId: null, authorId: "u1", authorName: "A", body: id, kind: "discussion", hidden: false, edited: false, createdAt, ...over });

test("threads are oldest first, ties broken by id, replies grouped under their parent", () => {
  const posts = [
    post("p2", "2026-10-21T12:00:00Z"),
    post("r1", "2026-10-21T12:05:00Z", { parentId: "p1" }),
    post("p1", "2026-10-21T11:00:00Z"),
    post("p3b", "2026-10-21T13:00:00Z"),
    post("p3a", "2026-10-21T13:00:00Z"),
    post("r0", "2026-10-21T11:30:00Z", { parentId: "p1" })
  ];
  const threads = buildThreads(posts);
  assert.deepEqual(threads.map(thread => thread.post.id), ["p1", "p2", "p3a", "p3b"]);
  assert.deepEqual(threads[0].replies.map(reply => reply.id), ["r0", "r1"]);
  assert.deepEqual(threads[1].replies, []);
  assert.equal(posts[0].id, "p2", "input is not reordered");
});

test("a reply whose parent is not in the list stands alone instead of disappearing", () => {
  const threads = buildThreads([post("r", "2026-10-21T11:00:00Z", { parentId: "gone" })]);
  assert.equal(threads.length, 1);
  assert.equal(threads[0].post.id, "r");
});

test("normalizePost maps database columns and marks hidden/edited posts", () => {
  const row = { id: "i", community_id: "c", parent_id: null, author_id: "u", author_name: "N", body: "", kind: "discussion", hidden_at: "2026-10-21T00:00:00Z", edited_at: null, created_at: "2026-10-21T00:00:00Z" };
  assert.deepEqual(normalizePost(row), { id: "i", communityId: "c", missionId: null, parentId: null, authorId: "u", authorName: "N", body: "", kind: "discussion", observedOn: null, fictional: false, imported: false, hidden: true, edited: false, createdAt: "2026-10-21T00:00:00Z" });
  const observation = normalizePost({ ...row, hidden_at: null, mission_id: "m", kind: "observation", observed_on: "2026-10-20", fictional: true, imported: true });
  assert.deepEqual([observation.missionId, observation.observedOn, observation.fictional, observation.imported], ["m", "2026-10-20", true, true]);
});

test("actions: authors edit their own posts, moderators hide, replies only on visible top-level posts", () => {
  const mine = post("a", "t", { authorId: "me" });
  const theirs = post("b", "t", { authorId: "them" });
  assert.deepEqual(postActions(mine, { userId: "me", isModerator: false }), { edit: true, hide: false, reply: true });
  assert.deepEqual(postActions(theirs, { userId: "me", isModerator: false }), { edit: false, hide: false, reply: true });
  assert.deepEqual(postActions(theirs, { userId: "me", isModerator: true }), { edit: false, hide: true, reply: true });
  assert.deepEqual(postActions(post("c", "t", { authorId: "me", hidden: true }), { userId: "me", isModerator: true }), { edit: false, hide: false, reply: false });
  assert.equal(postActions(post("d", "t", { parentId: "a" }), { userId: "me" }).reply, false, "one level of replies");
  assert.equal(postActions(mine, { userId: null }).edit, false, "signed-out viewers get no actions");
});

test("backend error codes become plain messages; network and server failures are retryable", () => {
  assert.equal(toCommunityError({ message: "not_member" }).code, "not_member");
  assert.equal(toCommunityError({ message: "not_member" }).retryable, false);
  assert.match(describeError({ message: "forbidden" }), /only change your own posts/);
  const network = toCommunityError(new TypeError("Failed to fetch"));
  assert.equal(network.code, "network");
  assert.equal(network.retryable, true);
  assert.match(describeError(new TypeError("Failed to fetch")), /Your text is still here/);
  assert.equal(toCommunityError({ message: "boom", status: 503 }).retryable, true);
  assert.equal(toCommunityError({ message: "boom", status: 500 }).code, "unavailable");
  assert.equal(toCommunityError({ message: "mystery" }).retryable, true, "unknown failures keep the draft and allow retry");
  const same = new CommunityError("forbidden");
  assert.equal(toCommunityError(same), same);
});
