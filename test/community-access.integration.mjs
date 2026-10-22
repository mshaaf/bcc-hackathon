// Real-backend proof for the shared community: Supabase Auth + Postgres RLS/functions + Realtime.
// Run: RUN_COMMUNITY_INTEGRATION=1 COMMUNITY_SUPABASE_URL=... COMMUNITY_SUPABASE_PUBLISHABLE_KEY=... COMMUNITY_SUPABASE_SECRET_KEY=... node --test test/community-access.integration.mjs
// Without RUN_COMMUNITY_INTEGRATION the whole file is skipped. A skip is NOT backend proof. With it set, missing config fails.
// The secret key is used only here, to create throwaway communities, set a moderator and delete test users. It never reaches a browser.
import assert from "node:assert/strict";
import test, { after, before } from "node:test";
import { cleanup, createClient, enabled, hasWebSocket, makeAdmin, newProfile, publishableKey, skip, sleep, tag, url, uuid } from "./support/backend.mjs";

const rejects = (promise, code) => assert.rejects(promise, error => { assert.equal(error.code, code, `expected ${code}, got ${error.code} (${error.message})`); return true; });

let admin, communityX, communityY, a, b, c, aUser, bUser, cUser;
const userIds = [];

before(async () => {
  if (!enabled) return;
  admin = makeAdmin();
  const make = async title => (await admin.from("communities").insert({ title: `${title} ${tag}`, description: "Throwaway community for integration tests." }).select().single()).data;
  communityX = await make("Test X");
  communityY = await make("Test Y");
  a = newProfile(); b = newProfile(); c = newProfile();
  [aUser, bUser, cUser] = await Promise.all([a.api.ensureSession(), b.api.ensureSession(), c.api.ensureSession()]);
  userIds.push(aUser.userId, bUser.userId, cUser.userId);
});

after(async () => {
  if (!enabled || !admin) return;
  await cleanup(admin, [communityX?.id, communityY?.id], userIds);
});

test("two independent browser profiles get different real authenticated identities, and each keeps its own on reload", { skip }, async () => {
  assert.ok(aUser.userId && bUser.userId && cUser.userId);
  assert.equal(new Set([aUser.userId, bUser.userId, cUser.userId]).size, 3, "three profiles, three distinct IDs");
  assert.equal(aUser.isAnonymous, true, "guest sessions are anonymous Auth users");
  const reloaded = newProfile(a.storage);
  assert.equal((await reloaded.api.restoreSession()).userId, aUser.userId, "a new client over the same storage is the same user");
  assert.equal((await reloaded.api.ensureSession()).userId, aUser.userId, "ensureSession reuses, not recreates");
  assert.equal(await newProfile().api.restoreSession(), null, "a profile with no storage has no session until it joins");
});

test("the join preview works without a session and exposes only whitelisted fields", { skip }, async () => {
  const stranger = newProfile();
  const preview = await stranger.api.getCommunityPreview(communityX.id);
  assert.deepEqual(Object.keys(preview).sort(), ["description", "id", "isDemo", "memberCount", "title"]);
  assert.equal(preview.memberCount, 0);
  assert.equal(await stranger.api.restoreSession(), null, "viewing the preview created no account");
  assert.equal(await stranger.api.getCommunityPreview(uuid()), null);
});

test("joining validates the name, is idempotent, and reload or double-join does not grow the count", { skip }, async () => {
  for (const bad of ["", "   ", "\n", "x".repeat(41), "bad\u0007name"]) await rejects(a.api.joinCommunity(communityX.id, bad), "invalid_display_name");
  await rejects(a.api.joinCommunity(uuid(), "Dana"), "community_not_found");
  const first = await a.api.joinCommunity(communityX.id, `Dana ${tag}`);
  assert.equal(first.userId, aUser.userId, "membership belongs to the authenticated user");
  await a.api.joinCommunity(communityX.id, `Dana ${tag}`);
  await newProfile(a.storage).api.joinCommunity(communityX.id, `Dana ${tag}`);
  assert.equal((await a.api.getCommunityPreview(communityX.id)).memberCount, 1);
  const renamed = await a.api.joinCommunity(communityX.id, `Dana R ${tag}`);
  assert.equal(renamed.displayName, `Dana R ${tag}`, "joining again updates only your own display name");
  await a.api.joinCommunity(communityX.id, `Dana ${tag}`);
  assert.equal((await a.api.getCommunityPreview(communityX.id)).memberCount, 1);
  await b.api.joinCommunity(communityX.id, `Bo ${tag}`);
  assert.equal((await a.api.getCommunityPreview(communityX.id)).memberCount, 2);
  assert.deepEqual((await a.api.listMembers(communityX.id)).map(member => member.displayName).sort(), [`Bo ${tag}`, `Dana ${tag}`]);
});

test("a non-member cannot read members, posts or the community, or write a post", { skip }, async () => {
  const post = await a.api.createPost({ communityId: communityX.id, body: "members only", operationId: uuid() });
  assert.deepEqual(await c.api.listPosts(communityX.id), [], "RLS returns nothing to a non-member");
  assert.deepEqual(await c.api.listMembers(communityX.id), []);
  assert.equal(await c.api.getCommunity(communityX.id), null);
  assert.equal(await c.api.getMembership(communityX.id, aUser.userId), null);
  await rejects(c.api.createPost({ communityId: communityX.id, body: "let me in", operationId: uuid() }), "not_member");
  await rejects(c.api.createPost({ communityId: communityX.id, parentId: post.id, body: "reply from outside", operationId: uuid() }), "not_member");
  await rejects(c.api.editOwnPost(post.id, "hijack"), "post_not_found");
  await rejects(c.api.hidePost(post.id), "post_not_found");
});

test("posts: bounded bodies, trimmed text, retries by operation id do not duplicate", { skip }, async () => {
  for (const bad of ["", "  \n ", "\t\r\n", "\u00a0\u3000", "x".repeat(2001)]) await rejects(b.api.createPost({ communityId: communityX.id, body: bad, operationId: uuid() }), "invalid_body");
  const edge = await b.api.createPost({ communityId: communityX.id, body: "x".repeat(2000), operationId: uuid() });
  assert.equal(edge.body.length, 2000);
  const operationId = uuid();
  const sent = await b.api.createPost({ communityId: communityX.id, body: `  Saturday cleanup? ${tag}  `, operationId });
  const retried = await b.api.createPost({ communityId: communityX.id, body: `  Saturday cleanup? ${tag}  `, operationId });
  assert.equal(retried.id, sent.id, "a retried send returns the same post");
  assert.equal(sent.body, `Saturday cleanup? ${tag}`);
  assert.equal(sent.authorId, bUser.userId, "authorship comes from the session");
  assert.equal(sent.authorName, `Bo ${tag}`);
  const matching = (await a.api.listPosts(communityX.id)).filter(post => post.body === sent.body);
  assert.equal(matching.length, 1);
  const concurrent = uuid();
  const results = await Promise.all([1, 2, 3].map(() => b.api.createPost({ communityId: communityX.id, body: `parallel ${tag}`, operationId: concurrent })));
  assert.equal(new Set(results.map(post => post.id)).size, 1, "simultaneous identical retries still make one post");
});

test("replies stay in their community, are one level deep, and cannot target a missing parent", { skip }, async () => {
  const parent = await a.api.createPost({ communityId: communityX.id, body: `parent ${tag}`, operationId: uuid() });
  const reply = await b.api.createPost({ communityId: communityX.id, parentId: parent.id, body: `reply ${tag}`, operationId: uuid() });
  assert.equal(reply.parentId, parent.id);
  await rejects(a.api.createPost({ communityId: communityX.id, parentId: reply.id, body: "nested", operationId: uuid() }), "reply_depth");
  await rejects(a.api.createPost({ communityId: communityX.id, parentId: uuid(), body: "orphan", operationId: uuid() }), "parent_not_found");
  await a.api.joinCommunity(communityY.id, `Dana Y ${tag}`);
  await rejects(a.api.createPost({ communityId: communityY.id, parentId: parent.id, body: "cross-community reply", operationId: uuid() }), "parent_not_found");
  assert.deepEqual(await a.api.listPosts(communityY.id), [], "community Y shows nothing from community X");
});

test("posting rejects forged authors, direct table writes and role changes outside the UI", { skip }, async () => {
  const token = (await b.api.rawClient.auth.getSession()).data.session.access_token;
  const rest = (path, init = {}) => fetch(`${url}/rest/v1/${path}`, { ...init, headers: { apikey: publishableKey, Authorization: `Bearer ${token}`, "Content-Type": "application/json", Prefer: "return=representation", ...init.headers } });
  const forged = await rest("posts", { method: "POST", body: JSON.stringify({ community_id: communityX.id, author_id: aUser.userId, author_name: "Dana", body: "forged", operation_id: uuid() }) });
  assert.ok(forged.status === 401 || forged.status === 403, `direct insert must be denied, got ${forged.status}`);
  const overwrite = await rest(`communities?id=eq.${communityX.id}`, { method: "PATCH", body: JSON.stringify({ moderator_id: bUser.userId }) });
  assert.ok(overwrite.status === 401 || overwrite.status === 403, `moderator self-grant must be denied, got ${overwrite.status}`);
  const rename = await rest(`community_members?community_id=eq.${communityX.id}&user_id=eq.${aUser.userId}`, { method: "PATCH", body: JSON.stringify({ display_name: "Not Dana" }) });
  assert.ok(rename.status === 401 || rename.status === 403, `editing another member must be denied, got ${rename.status}`);
  const removed = await rest("private.post_removed", { headers: { "Accept-Profile": "private" } });
  assert.ok(removed.status >= 400, "the private schema is not exposed");
  const body = await (await rest("posts?select=body_original")).text();
  assert.match(body, /does not exist|permission denied|column/i, "nothing exposes original hidden text");
  const anon = createClient(url, publishableKey, { auth: { persistSession: false } });
  assert.ok((await anon.from("posts").select("id")).error, "a request with no session cannot read posts");
  assert.ok((await anon.rpc("create_post", { p_community: communityX.id, p_parent: null, p_body: "x", p_operation: uuid() })).error, "a request with no session cannot post");
  assert.ok((await anon.rpc("join_community", { p_community: communityX.id, p_display_name: "x" })).error);
});

test("only an author edits their own post; the moderator hides; hidden text never reaches members", { skip }, async () => {
  const mine = await a.api.createPost({ communityId: communityX.id, body: `original ${tag}`, operationId: uuid() });
  await rejects(b.api.editOwnPost(mine.id, "changed by Bo"), "forbidden");
  await rejects(a.api.editOwnPost(mine.id, ""), "invalid_body");
  await rejects(a.api.editOwnPost(mine.id, "y".repeat(2001)), "invalid_body");
  const edited = await a.api.editOwnPost(mine.id, `edited ${tag}`);
  assert.equal(edited.body, `edited ${tag}`);
  assert.equal(edited.edited, true);
  await rejects(a.api.hidePost(mine.id), "forbidden");
  await rejects(b.api.hidePost(mine.id), "forbidden");
  await admin.from("communities").update({ moderator_id: aUser.userId }).eq("id", communityX.id);
  const theirs = await b.api.createPost({ communityId: communityX.id, body: `rude text ${tag}`, operationId: uuid() });
  const hidden = await a.api.hidePost(theirs.id);
  assert.equal(hidden.hidden, true);
  assert.equal(hidden.body, "");
  const seenByBo = (await b.api.listPosts(communityX.id)).find(post => post.id === theirs.id);
  assert.deepEqual([seenByBo.hidden, seenByBo.body], [true, ""]);
  assert.ok(!JSON.stringify(await a.api.listPosts(communityX.id)).includes("rude text"), "even the moderator's feed carries no hidden text");
  await rejects(b.api.editOwnPost(theirs.id, "restored"), "post_hidden");
  await rejects(a.api.createPost({ communityId: communityX.id, parentId: theirs.id, body: "reply to hidden", operationId: uuid() }), "post_hidden");
  await rejects(b.api.hidePost(mine.id), "forbidden");
});

test("posting is rate limited in the database, not just the form", { skip }, async () => {
  const rapid = newProfile();
  const user = await rapid.api.ensureSession();
  userIds.push(user.userId);
  await rapid.api.joinCommunity(communityY.id, `Rapid ${tag}`);
  let failure;
  for (let i = 0; i < 25 && !failure; i += 1) {
    try { await rapid.api.createPost({ communityId: communityY.id, body: `spam ${i}`, operationId: uuid() }); } catch (error) { failure = error; }
  }
  assert.equal(failure?.code, "rate_limited");
  assert.ok((await rapid.api.listPosts(communityY.id)).length <= 20);
});

test("leaving ends access, keeps history, and rejoining restores authorship and access", { skip }, async () => {
  await c.api.joinCommunity(communityX.id, `Cy ${tag}`);
  const note = await c.api.createPost({ communityId: communityX.id, body: `from Cy ${tag}`, operationId: uuid() });
  const before = (await a.api.getCommunityPreview(communityX.id)).memberCount;
  await c.api.leaveCommunity(communityX.id);
  await c.api.leaveCommunity(communityX.id);
  assert.equal((await a.api.getCommunityPreview(communityX.id)).memberCount, before - 1);
  assert.deepEqual(await c.api.listPosts(communityX.id), []);
  await rejects(c.api.createPost({ communityId: communityX.id, body: "after leaving", operationId: uuid() }), "not_member");
  assert.ok((await a.api.listPosts(communityX.id)).some(post => post.id === note.id && post.authorName === `Cy ${tag}`), "history keeps the author name it was posted under");
  await c.api.joinCommunity(communityX.id, `Cy ${tag}`);
  assert.ok((await c.api.listPosts(communityX.id)).some(post => post.id === note.id));
  assert.equal((await c.api.editOwnPost(note.id, `still Cy ${tag}`)).body, `still Cy ${tag}`, "authorship survives leaving and rejoining");
});

test("realtime: B's post reaches A's subscription within five seconds and the canonical re-fetch has the exact text", { skip: skip || (!hasWebSocket && "needs a global WebSocket (Node 22+)") }, async () => {
  const states = [];
  let notify;
  const changed = new Promise(resolve => { notify = resolve; });
  const ready = new Promise(resolve => {
    const stop = a.api.subscribeCommunity(communityX.id, table => notify?.(table), status => { states.push(status); if (status === "SUBSCRIBED") resolve(stop); });
  });
  const stop = await Promise.race([ready, sleep(8000).then(() => { throw new Error(`realtime never subscribed (${states.join(",")})`); })]);
  // Right after `supabase db reset` the Realtime tenant can take a few seconds to start streaming changes. Warm it up first so the
  // measurement below is the steady-state propagation time, and say so in the log rather than hide it.
  let warmups = 0;
  while (warmups < 3) {
    let heard = false;
    notify = () => { heard = true; };
    await b.api.createPost({ communityId: communityX.id, body: `warm-up ${warmups} ${tag}`, operationId: uuid() });
    for (let waited = 0; waited < 6000 && !heard; waited += 100) await sleep(100);
    if (heard) break;
    warmups += 1;
  }
  if (warmups) console.log(`# realtime needed ${warmups} warm-up post(s) before it streamed (cold start)`);
  let received;
  const changedNow = new Promise(resolve => { received = resolve; });
  notify = received;
  const text = `live ${tag} ${Date.now()}`;
  const started = Date.now();
  await b.api.createPost({ communityId: communityX.id, body: text, operationId: uuid() });
  await Promise.race([changedNow, sleep(5000).then(() => { throw new Error("no realtime event within 5 s"); })]);
  const elapsed = Date.now() - started;
  const seen = (await a.api.listPosts(communityX.id)).find(post => post.body === text);
  assert.ok(seen, "A re-fetches the exact persisted text");
  assert.ok(elapsed < 5000, `propagation took ${elapsed} ms`);
  console.log(`# realtime propagation: ${elapsed} ms`);
  stop();
});

test("a non-member's realtime subscription receives no events for the community", { skip: skip || (!hasWebSocket && "needs a global WebSocket (Node 22+)") }, async () => {
  const outsider = newProfile();
  await outsider.api.ensureSession();
  userIds.push((await outsider.api.restoreSession()).userId);
  const events = [];
  const ready = new Promise(resolve => { outsider.api.subscribeCommunity(communityX.id, table => events.push(table), status => { if (status === "SUBSCRIBED") resolve(); }); });
  await Promise.race([ready, sleep(8000)]);
  await a.api.createPost({ communityId: communityX.id, body: `secret ${tag}`, operationId: uuid() });
  await sleep(2500);
  assert.deepEqual(events, [], "RLS also gates realtime delivery");
});

test("realtime: a member leaving notifies the others (row-security does not filter DELETE events, so leave bumps the community row)", { skip: skip || (!hasWebSocket && "needs a global WebSocket (Node 22+)") }, async () => {
  const leaver = newProfile();
  await leaver.api.ensureSession();
  const leaverId = (await leaver.api.restoreSession()).userId;
  userIds.push(leaverId);
  await leaver.api.joinCommunity(communityX.id, `Leaver ${tag}`);
  const tables = [];
  let notify;
  const left = new Promise(resolve => { notify = resolve; });
  const ready = new Promise(resolve => { a.api.subscribeCommunity(communityX.id, table => { tables.push(table); if (table === "communities") notify(); }, status => { if (status === "SUBSCRIBED") resolve(); }); });
  await Promise.race([ready, sleep(8000)]);
  tables.length = 0;
  await leaver.api.leaveCommunity(communityX.id);
  await Promise.race([left, sleep(5000).then(() => { throw new Error(`no leave event within 5 s (saw ${tables.join(",") || "nothing"})`); })]);
  assert.ok(!(await a.api.listMembers(communityX.id)).some(member => member.userId === leaverId), "the canonical re-fetch no longer lists the leaver");
});

test("realtime: a join announces itself to members (membership rows are not published, so join bumps the community row)", { skip: skip || (!hasWebSocket && "needs a global WebSocket (Node 22+)") }, async () => {
  const tables = [];
  let notify;
  const heard = new Promise(resolve => { notify = resolve; });
  const ready = new Promise(resolve => { a.api.subscribeCommunity(communityX.id, table => { tables.push(table); if (table === "communities") notify(); }, status => { if (status === "SUBSCRIBED") resolve(); }); });
  await Promise.race([ready, sleep(8000)]);
  const joiner = newProfile();
  userIds.push((await joiner.api.ensureSession()).userId);
  tables.length = 0;
  await joiner.api.joinCommunity(communityX.id, `Joiner ${tag}`);
  await Promise.race([heard, sleep(5000).then(() => { throw new Error(`no join event within 5 s (saw ${tables.join(",") || "nothing"})`); })]);
  assert.ok((await a.api.listMembers(communityX.id)).some(member => member.displayName === `Joiner ${tag}`), "the re-fetch lists the new member");
});
