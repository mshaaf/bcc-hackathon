// Real-backend proof for missions, atomic claims, mission discussion and the B1 repairs (replay authorization, event exposure).
// Run: see docs/COMMUNITY-SETUP.md. Skipped without RUN_COMMUNITY_INTEGRATION=1 (a skip proves nothing). Uses throwaway communities and users only.
import assert from "node:assert/strict";
import test, { after, before } from "node:test";
import { cleanup, enabled, hasWebSocket, makeAdmin, member, newProfile, publishableKey, skip, sleep, tag, url, uuid, waitUntil } from "./support/backend.mjs";

const rejects = (promise, code) => assert.rejects(promise, error => { assert.equal(error.code, code, `expected ${code}, got ${error.code} (${error.message})`); return true; });
const realtimeSkip = skip || (!hasWebSocket && "needs a global WebSocket (Node 22+)");

let admin, X, Y, org, bo, cy, dee, outsider;
const userIds = [];
const missionIds = [];
const mk = async (title = `Clean the corner ${tag}`, extra = {}) => {
  const mission = await org.api.createMission({ communityId: X.id, title, objective: "Bag litter and document the pile.", location: "1900 block of Naylor Rd SE", tasks: [{ description: "Bring bags" }, { description: "Photograph the site" }], operationId: uuid(), ...extra });
  missionIds.push(mission.id);
  return mission;
};
const tasksOf = async (api, communityId, missionId) => (await api.listTasks(communityId)).filter(task => task.missionId === missionId);

before(async () => {
  if (!enabled) return;
  admin = makeAdmin();
  const make = async title => (await admin.from("communities").insert({ title: `${title} ${tag}`, description: "Throwaway community for mission integration tests." }).select().single()).data;
  X = await make("Mission X"); Y = await make("Mission Y");
  [org, bo, cy, dee] = [await member(X.id, "Org", userIds), await member(X.id, "Bo", userIds), await member(X.id, "Cy", userIds), await member(X.id, "Dee", userIds)];
  outsider = newProfile();
  userIds.push((await outsider.api.ensureSession()).userId);
});
after(async () => { if (enabled && admin) await cleanup(admin, [X?.id, Y?.id], userIds); });

test("a discussion-origin mission has no official records, links a same-community source post, and creation is idempotent", { skip }, async () => {
  const source = await bo.api.createPost({ communityId: X.id, body: `We should clean the corner ${tag}`, operationId: uuid() });
  const operationId = uuid();
  const mission = await org.api.createMission({ communityId: X.id, title: `  Corner cleanup ${tag}  `, objective: "Bag litter.", location: "Naylor Rd SE", sourcePostId: source.id, tasks: [{ description: "Bring bags" }, { description: "Photograph", due: "2026-10-30" }], operationId });
  missionIds.push(mission.id);
  assert.equal(mission.title, `Corner cleanup ${tag}`);
  assert.equal(mission.origin, "discussion");
  assert.deepEqual([mission.evidence.length, mission.source], [0, null]);
  assert.equal(mission.sourcePostId, source.id);
  assert.equal(mission.organizerId, org.userId, "the organizer is the authenticated creator");
  assert.equal(mission.version, 1);
  const again = await org.api.createMission({ communityId: X.id, title: "different text", objective: "x", location: "x", operationId });
  assert.equal(again.id, mission.id, "retrying the same operation returns the same mission");
  assert.equal((await org.api.listMissions(X.id)).filter(item => item.id === mission.id).length, 1);
  const members = (await org.api.listMissionMembers(X.id)).filter(item => item.missionId === mission.id);
  assert.deepEqual(members.map(item => item.userId), [org.userId], "only the organizer is a member at first");
  const tasks = await tasksOf(org.api, X.id, mission.id);
  assert.deepEqual(tasks.map(task => [task.description, task.claimedBy, task.done, task.imported]), [["Bring bags", null, false, false], ["Photograph", null, false, false]]);
  assert.equal(tasks[1].due, "2026-10-30");
});

test("mission creation rejects bad bounds, forged origins, other communities' posts and non-members", { skip }, async () => {
  const base = { communityId: X.id, title: "T", objective: "O", location: "L", operationId: uuid() };
  const bad = (over, code) => rejects(org.api.createMission({ ...base, operationId: uuid(), ...over }), code);
  await bad({ title: "  " }, "invalid_title");
  await bad({ title: "x".repeat(121) }, "invalid_title");
  await bad({ objective: "" }, "invalid_objective");
  await bad({ objective: "x".repeat(1001) }, "invalid_objective");
  await bad({ location: "x".repeat(201) }, "invalid_location");
  await bad({ tasks: Array.from({ length: 31 }, (_, i) => ({ description: `job ${i}` })) }, "invalid_tasks");
  await bad({ tasks: [{ description: "x".repeat(201) }] }, "invalid_tasks");
  await bad({ tasks: [{ description: "ok", due: "2026-02-31" }] }, "invalid_tasks");
  await bad({ tasks: [{ description: "ok", due: "tomorrow" }] }, "invalid_tasks");
  const ghost = await bo.api.createPost({ communityId: X.id, body: "a post", operationId: uuid() });
  await bad({ sourcePostId: uuid() }, "source_post_not_found");
  await bad({ communityId: Y.id }, "not_member");
  await rejects(outsider.api.createMission({ ...base, operationId: uuid() }), "not_member");
  const stranger = await member(Y.id, "Yan", userIds);
  await rejects(stranger.api.createMission({ ...base, communityId: Y.id, sourcePostId: ghost.id, operationId: uuid() }), "source_post_not_found");
  const rpc = (args) => org.api.rawClient.rpc("create_mission", { p_community: X.id, p_title: "T", p_objective: "O", p_location: "L", p_starts_at: null, p_source_post: null, p_origin: "discussion", p_source: null, p_evidence: [], p_tasks: [], p_observations: [], p_operation: uuid(), ...args });
  assert.equal((await rpc({ p_evidence: [{ key: "request:1" }] })).error?.message, "invalid_origin", "a discussion mission cannot carry evidence");
  assert.equal((await rpc({ p_source: { mode: "live" } })).error?.message, "invalid_origin");
  assert.equal((await rpc({ p_origin: "local_campaign", p_evidence: [] })).error?.message, "invalid_evidence", "a published campaign needs records");
  assert.equal((await rpc({ p_origin: "local_campaign", p_evidence: [{ key: "a" }], p_source: { mode: "bogus" } })).error?.message, "invalid_evidence");
  assert.equal((await rpc({ p_origin: "nonsense" })).error?.message, "invalid_origin");
});

test("publishing a reviewed local campaign keeps evidence and source, resets tasks to unclaimed, and imports observations with provenance", { skip }, async () => {
  const payload = {
    title: `1900 block of Naylor Rd SE ${tag}`, objective: "Stop repeat dumping", location: "1900 block of Naylor Rd SE",
    source: { mode: "recorded", sourceUrl: "https://example.test/layer", retrievedAt: "2026-10-21T18:00:00Z", window: { start: "2026-07-24", endExclusive: "2026-10-22" }, campaignName: "1900 block", reviewedAt: "2026-10-21T19:00:00Z", radiusM: 150 },
    evidence: [{ key: "request:A", id: "A", address: "1941 NAYLOR ROAD SE", status: "Closed", date: 1760000000000 }, { key: "request:B", id: "B", address: "1950 NAYLOR ROAD SE", status: "Open", date: 1760100000000 }],
    tasks: [{ description: "Photograph it", due: "2026-10-25" }, { description: "Call the ANC" }],
    observations: [{ date: "2026-10-20", text: "Pile still there", fictional: true, kind: "followup" }, { date: "2026-10-21", text: "Real note", fictional: false, kind: "resident" }]
  };
  const mission = await org.api.publishMission({ communityId: X.id, payload, operationId: uuid() });
  missionIds.push(mission.id);
  assert.equal(mission.origin, "local_campaign");
  assert.deepEqual(mission.evidence.map(item => item.key), ["request:A", "request:B"]);
  assert.equal(mission.source.mode, "recorded");
  assert.equal(mission.source.retrievedAt, "2026-10-21T18:00:00Z");
  const tasks = await tasksOf(org.api, X.id, mission.id);
  assert.deepEqual(tasks.map(task => [task.claimedBy, task.claimedName, task.done, task.imported]), [[null, null, false, true], [null, null, false, true]], "imported jobs are unclaimed and not done");
  const posts = await org.api.listPosts(X.id, { missionId: mission.id });
  assert.deepEqual(posts.map(post => [post.kind, post.observedOn, post.fictional, post.imported, post.authorId]), [["observation", "2026-10-20", true, true, org.userId], ["observation", "2026-10-21", false, true, org.userId]]);
  const members = (await org.api.listMissionMembers(X.id)).filter(item => item.missionId === mission.id);
  assert.equal(members.length, 1, "typed owners never become memberships");
  assert.deepEqual((await org.api.listPosts(X.id)).filter(post => post.missionId), [], "imported observations stay out of the community conversation");
  await rejects(org.api.publishMission({ communityId: X.id, payload: { ...payload, observations: [{ date: "2026-13-40", text: "bad" }] }, operationId: uuid() }), "invalid_observations");
  await rejects(org.api.publishMission({ communityId: X.id, payload: { ...payload, observations: [{ date: "2026-10-20", text: "" }] }, operationId: uuid() }), "invalid_observations");
});

test("organizer-only metadata changes with a version check and a recoverable conflict", { skip }, async () => {
  const mission = await mk();
  await rejects(bo.api.updateMission({ missionId: mission.id, expectedVersion: 1, changes: { title: "hijacked" } }), "forbidden");
  await rejects(outsider.api.updateMission({ missionId: mission.id, expectedVersion: 1, changes: { title: "x" } }), "mission_not_found");
  const next = await org.api.updateMission({ missionId: mission.id, expectedVersion: 1, changes: { title: `Renamed ${tag}`, status: "scheduled", starts_at: "2026-11-01T14:00:00Z" } });
  assert.deepEqual([next.title, next.status, next.version, next.startsAt?.slice(0, 10)], [`Renamed ${tag}`, "scheduled", 2, "2026-11-01"]);
  await rejects(org.api.updateMission({ missionId: mission.id, expectedVersion: 1, changes: { objective: "stale write" } }), "version_conflict");
  assert.equal((await org.api.listMissions(X.id)).find(item => item.id === mission.id).objective, "Bag litter and document the pile.", "a conflicting write changed nothing");
  await rejects(org.api.updateMission({ missionId: mission.id, expectedVersion: 2, changes: { organizer_id: bo.userId } }), "invalid_changes");
  await rejects(org.api.updateMission({ missionId: mission.id, expectedVersion: 2, changes: { status: "done" } }), "invalid_status");
  await rejects(org.api.updateMission({ missionId: mission.id, expectedVersion: 2, changes: { title: "" } }), "invalid_title");
  const token = (await bo.api.rawClient.auth.getSession()).data.session.access_token;
  const rest = (path, init = {}) => fetch(`${url}/rest/v1/${path}`, { ...init, headers: { apikey: publishableKey, Authorization: `Bearer ${token}`, "Content-Type": "application/json", Prefer: "return=representation", ...init.headers } });
  for (const [table, body] of [["missions", { title: "direct" }], ["mission_tasks", { claimed_by: bo.userId }], ["mission_members", { display_name: "x" }]]) {
    const patch = await rest(`${table}?community_id=eq.${X.id}`, { method: "PATCH", body: JSON.stringify(body) });
    assert.ok([401, 403].includes(patch.status), `direct PATCH of ${table} must be denied, got ${patch.status}`);
    const del = await rest(`${table}?community_id=eq.${X.id}`, { method: "DELETE" });
    assert.ok([401, 403].includes(del.status), `direct DELETE of ${table} must be denied, got ${del.status}`);
  }
  const insert = await rest("mission_tasks", { method: "POST", body: JSON.stringify({ mission_id: mission.id, community_id: X.id, description: "forged", claimed_by: bo.userId, claimed_name: "Bo" }) });
  assert.ok([401, 403].includes(insert.status), `direct insert of a pre-claimed task must be denied, got ${insert.status}`);
  assert.deepEqual(await outsider.api.listMissions(X.id), [], "RLS hides missions from non-members");
  assert.deepEqual(await outsider.api.listTasks(X.id), []);
});

test("joining a mission is idempotent, needs community membership, and an archived mission cannot be joined", { skip }, async () => {
  const mission = await mk();
  await bo.api.joinMission(mission.id); await bo.api.joinMission(mission.id);
  assert.equal((await bo.api.listMissionMembers(X.id)).filter(item => item.missionId === mission.id).length, 2);
  await rejects(outsider.api.joinMission(mission.id), "mission_not_found");
  const wrong = await member(Y.id, "Wes", userIds);
  await rejects(wrong.api.joinMission(mission.id), "mission_not_found", "another community's member cannot even see the mission");
  await org.api.updateMission({ missionId: mission.id, expectedVersion: 1, changes: { status: "archived" } });
  await rejects(cy.api.joinMission(mission.id), "mission_archived");
  await bo.api.joinMission(mission.id);
});

test("claims: only mission members, exactly one winner under a race, owner-only release/done, no claims on archived missions", { skip }, async () => {
  const mission = await mk();
  const [task] = await tasksOf(org.api, X.id, mission.id);
  await rejects(bo.api.claimTask(task.id), "not_mission_member");
  await rejects(outsider.api.claimTask(task.id), "task_not_found");
  for (const who of [bo, cy, dee]) await who.api.joinMission(mission.id);
  const results = await Promise.allSettled([bo, cy, dee, org].map(who => who.api.claimTask(task.id)));
  const winners = results.filter(result => result.status === "fulfilled");
  const losers = results.filter(result => result.status === "rejected");
  assert.equal(winners.length, 1, "exactly one claimant wins");
  assert.ok(losers.every(result => result.reason.code === "already_claimed"), losers.map(result => result.reason.code).join());
  const stored = (await tasksOf(org.api, X.id, mission.id)).find(item => item.id === task.id);
  assert.equal(stored.claimedBy, winners[0].value.claimedBy);
  const winner = [bo, cy, dee, org].find(who => who.userId === stored.claimedBy);
  assert.equal(stored.claimedName, winner.name);
  assert.equal((await winner.api.claimTask(task.id)).claimedBy, winner.userId, "the winner repeating the claim is idempotent");
  const other = [bo, cy, dee].find(who => who !== winner);
  await rejects(other.api.releaseTask(task.id), "forbidden");
  await rejects(other.api.setTaskDone(task.id, true), "forbidden");
  assert.equal((await winner.api.setTaskDone(task.id, true)).done, true);
  await rejects(winner.api.releaseTask(task.id), "task_done");
  assert.equal((await winner.api.setTaskDone(task.id, false)).done, false);
  assert.equal((await winner.api.releaseTask(task.id)).claimedBy, null);
  assert.equal((await winner.api.releaseTask(task.id)).claimedBy, null, "releasing an unclaimed job is a no-op");
  await rejects(winner.api.setTaskDone(task.id, true), "not_claimed");
  const claimed = await bo.api.claimTask(task.id);
  assert.equal(claimed.claimedBy, bo.userId);
  assert.equal((await org.api.releaseTask(task.id)).claimedBy, null, "the organizer can release anyone's claim");
  const again = await cy.api.claimTask(task.id);
  assert.equal((await org.api.setTaskDone(again.id, true)).done, true, "the organizer can mark a claimed job done");
  await org.api.updateMission({ missionId: mission.id, expectedVersion: 1, changes: { status: "archived" } });
  const [, second] = await tasksOf(org.api, X.id, mission.id);
  await rejects(dee.api.claimTask(second.id), "mission_archived");
});

test("leave versus claim races never leave an unfinished job with a departed member", { skip }, async () => {
  const mission = await mk(`Race ${tag}`);
  for (let round = 0; round < 12; round += 1) {
    const racer = await member(X.id, `Racer${round}`, userIds);
    await racer.api.joinMission(mission.id);
    const added = await org.api.addTask({ missionId: mission.id, description: `race job ${round}` });
    const [claim, leave] = await Promise.allSettled([racer.api.claimTask(added.id), racer.api.leaveMission(mission.id)]);
    assert.equal(leave.status, "fulfilled", `leave round ${round}: ${leave.reason?.code}`);
    if (claim.status === "rejected") assert.ok(["not_mission_member"].includes(claim.reason.code), `claim round ${round}: ${claim.reason.code}`);
    const task = (await tasksOf(org.api, X.id, mission.id)).find(item => item.id === added.id);
    assert.equal(task.claimedBy, null, `round ${round}: the job must be unclaimed after the member left (claim ${claim.status})`);
    assert.equal(task.claimedName, null);
    const left = (await org.api.listMissionMembers(X.id)).some(item => item.missionId === mission.id && item.userId === racer.userId);
    assert.equal(left, false);
    await rejects(racer.api.claimTask(added.id), "not_mission_member");
  }
});

test("leaving a mission releases unfinished jobs but keeps finished attribution; the organizer must archive first", { skip }, async () => {
  const mission = await mk(`Leave ${tag}`);
  const [one, two] = await tasksOf(org.api, X.id, mission.id);
  await bo.api.joinMission(mission.id);
  await bo.api.claimTask(one.id); await bo.api.claimTask(two.id); await bo.api.setTaskDone(one.id, true);
  await rejects(org.api.leaveMission(mission.id), "organizer_active");
  await bo.api.leaveMission(mission.id);
  await bo.api.leaveMission(mission.id);
  const tasks = await tasksOf(org.api, X.id, mission.id);
  const after = Object.fromEntries(tasks.map(task => [task.id, task]));
  assert.deepEqual([after[one.id].done, after[one.id].claimedName, after[one.id].claimedBy], [true, bo.name, bo.userId], "completed work keeps its attribution");
  assert.deepEqual([after[two.id].claimedBy, after[two.id].claimedName], [null, null], "unfinished work is released");
  await org.api.updateMission({ missionId: mission.id, expectedVersion: 1, changes: { status: "archived" } });
  await org.api.leaveMission(mission.id);
});

test("leaving the community also leaves its missions atomically; active organizers must archive first", { skip }, async () => {
  const lone = await member(X.id, "Lena", userIds);
  const mission = await mk(`Community leave ${tag}`);
  const [t1, t2] = await tasksOf(org.api, X.id, mission.id);
  await lone.api.joinMission(mission.id); await lone.api.claimTask(t1.id); await lone.api.claimTask(t2.id); await lone.api.setTaskDone(t2.id, true);
  const own = await lone.api.createMission({ communityId: X.id, title: `Lena's ${tag}`, objective: "o", location: "l", operationId: uuid() });
  missionIds.push(own.id);
  await rejects(lone.api.leaveCommunity(X.id), "organizer_active");
  await lone.api.updateMission({ missionId: own.id, expectedVersion: 1, changes: { status: "archived" } });
  await lone.api.leaveCommunity(X.id);
  const tasks = Object.fromEntries((await tasksOf(org.api, X.id, mission.id)).map(task => [task.id, task]));
  assert.equal(tasks[t1.id].claimedBy, null, "unfinished claim released");
  assert.equal(tasks[t2.id].claimedBy, lone.userId, "finished claim keeps attribution");
  assert.equal((await org.api.listMissionMembers(X.id)).some(item => item.userId === lone.userId), false, "mission memberships removed");
  assert.deepEqual(await lone.api.listMissions(X.id), [], "no access after leaving");
  await rejects(lone.api.claimTask(t1.id), "task_not_found");
});

test("mission discussion: scoped posts, kinds, replies, archived and cross-community denial, organizer moderation", { skip }, async () => {
  const mission = await mk(`Talk ${tag}`);
  const post = (over, who = bo) => who.api.createPost({ communityId: X.id, missionId: mission.id, body: `mission talk ${tag}`, operationId: uuid(), ...over });
  const chat = await post({});
  assert.equal(chat.missionId, mission.id);
  await rejects(post({ kind: "update" }), "not_mission_member");
  await rejects(post({ kind: "observation", observedOn: "2026-10-21" }), "not_mission_member");
  await bo.api.joinMission(mission.id);
  const update = await post({ kind: "update", body: `Bags delivered ${tag}` });
  const obs = await post({ kind: "observation", observedOn: "2026-10-21", fictional: true, body: `Pile gone ${tag}` });
  assert.deepEqual([update.kind, obs.kind, obs.observedOn, obs.fictional, obs.imported], ["update", "observation", "2026-10-21", true, false], "imported cannot be set through create_post");
  await rejects(post({ kind: "observation" }), "invalid_kind");
  await rejects(post({ kind: "update", observedOn: "2026-10-21" }), "invalid_kind");
  await rejects(post({ kind: "discussion", fictional: true }), "invalid_kind");
  await rejects(post({ kind: "banner" }), "invalid_kind");
  await rejects(bo.api.createPost({ communityId: X.id, kind: "update", body: "outside a mission", operationId: uuid() }), "invalid_kind");
  const reply = await post({ parentId: chat.id, body: "a reply" }, cy);
  assert.deepEqual([reply.parentId, reply.missionId], [chat.id, mission.id]);
  const community = await bo.api.createPost({ communityId: X.id, body: "community level", operationId: uuid() });
  await rejects(post({ parentId: community.id }), "parent_not_found");
  await rejects(bo.api.createPost({ communityId: X.id, parentId: chat.id, body: "reply without mission", operationId: uuid() }), "parent_not_found");
  await rejects(bo.api.createPost({ communityId: Y.id, missionId: mission.id, body: "x", operationId: uuid() }), "not_member");
  const yMember = await member(Y.id, "Yvi", userIds);
  await rejects(yMember.api.createPost({ communityId: Y.id, missionId: mission.id, body: "cross", operationId: uuid() }), "mission_not_found");
  assert.deepEqual((await bo.api.listPosts(X.id)).filter(item => item.missionId), [], "the community conversation omits mission posts");
  assert.ok((await bo.api.listPosts(X.id, { missionId: mission.id })).length >= 4);
  assert.ok(!(await bo.api.listPosts(X.id, { missionId: mission.id })).some(item => item.id === community.id));
  await rejects(bo.api.hidePost(chat.id), "forbidden");
  await rejects(cy.api.hidePost(chat.id), "forbidden");
  assert.equal((await org.api.hidePost(chat.id)).hidden, true, "the mission organizer moderates their mission");
  await rejects(org.api.hidePost(community.id), "forbidden", "an organizer has no power over community-level posts");
  await org.api.updateMission({ missionId: mission.id, expectedVersion: 1, changes: { status: "archived" } });
  await rejects(post({ body: "after archive" }), "mission_archived");
});

test("B1 repair: an old operation cannot be replayed after leaving or across communities", { skip }, async () => {
  const guest = await member(Y.id, "Gus", userIds);
  const operationId = uuid();
  const old = await guest.api.createPost({ communityId: Y.id, body: `secret-ish ${tag}`, operationId });
  await guest.api.joinCommunity(X.id, `Gus ${tag}`);
  await rejects(guest.api.createPost({ communityId: X.id, body: "same op elsewhere", operationId }), "operation_conflict");
  await guest.api.leaveCommunity(X.id);
  await guest.api.leaveCommunity(Y.id);
  await rejects(guest.api.createPost({ communityId: Y.id, body: `secret-ish ${tag}`, operationId }), "not_member");
  const raw = await guest.api.rawClient.rpc("create_post", { p_community: Y.id, p_parent: null, p_body: "x", p_operation: operationId });
  assert.equal(raw.error?.message, "not_member");
  assert.equal(raw.data, null, "no post data comes back to a departed member");
  await guest.api.joinCommunity(Y.id, `Gus ${tag}`);
  assert.equal((await guest.api.createPost({ communityId: Y.id, body: `secret-ish ${tag}`, operationId })).id, old.id, "after rejoining, the legitimate retry is idempotent again");
  const missionOp = uuid();
  const mission = await org.api.createMission({ communityId: X.id, title: "op bound", objective: "o", location: "l", operationId: missionOp });
  missionIds.push(mission.id);
  await org.api.joinCommunity(Y.id, `Org ${tag}`);
  await rejects(org.api.createMission({ communityId: Y.id, title: "op bound", objective: "o", location: "l", operationId: missionOp }), "operation_conflict");
  await org.api.leaveCommunity(Y.id).catch(() => {});
});

test("B1 repair: an outsider subscribed to every published and membership table receives none of this activity", { skip: realtimeSkip }, async () => {
  const mission = await mk(`Events ${tag}`);
  const events = [];
  const statuses = {};
  // One channel per group: subscribing to a table that is not published makes Realtime drop the whole channel, so the published tables
  // get their own channel (whose silence is only meaningful if it is live) and each membership table is probed on its own.
  const listen = (name, tables) => {
    const channel = outsider.api.rawClient.channel(`outsider-${name}-${tag}`);
    statuses[name] = [];
    for (const table of tables) channel.on("postgres_changes", { event: "*", schema: "public", table }, payload => events.push({ table, type: payload.eventType, payload }));
    return new Promise(resolve => channel.subscribe((status, error) => { statuses[name].push(error ? `${status}:${error.message}` : status); if (status === "SUBSCRIBED") resolve(); setTimeout(resolve, 8000); }));
  };
  await Promise.all([listen("published", ["posts", "missions", "mission_tasks", "communities"]), listen("community_members", ["community_members"]), listen("mission_members", ["mission_members"])]);
  assert.ok(statuses.published.includes("SUBSCRIBED"), `the outsider's channel on the published tables must be live for this test to mean anything (${statuses.published.join(",")})`);
  // A real member listens too (the canary). Until it sees events the stream is not proven live, so an empty outsider list would prove
  // nothing; warm up until it is (Realtime can take a while after a restart).
  const canary = [];
  let canaryReady;
  const canaryUp = new Promise(resolve => { canaryReady = resolve; });
  org.api.subscribeCommunity(X.id, table => canary.push(table), status => { if (status === "SUBSCRIBED") canaryReady(); });
  await Promise.race([canaryUp, sleep(8000)]);
  for (let i = 0; i < 6 && !canary.length; i += 1) { await bo.api.createPost({ communityId: X.id, body: `warm ${i} ${tag}`, operationId: uuid() }); await sleep(4000); }
  assert.ok(canary.length, "the stream never became live, so this test cannot say anything");
  events.length = 0;
  const watcher = await member(X.id, "Watcher", userIds);
  await watcher.api.joinMission(mission.id);
  const [task] = await tasksOf(org.api, X.id, mission.id);
  await watcher.api.claimTask(task.id);
  await watcher.api.createPost({ communityId: X.id, missionId: mission.id, body: `quiet ${tag}`, operationId: uuid() });
  await watcher.api.leaveMission(mission.id);
  await watcher.api.leaveCommunity(X.id);
  await org.api.updateMission({ missionId: mission.id, expectedVersion: 1, changes: { title: `Events renamed ${tag}` } });
  await sleep(3000);
  assert.ok(canary.includes("communities") && canary.includes("mission_tasks") && canary.includes("missions"), `the member canary must have seen these changes (saw ${[...new Set(canary)].join(",")}), proving events were flowing`);
  assert.ok(!/^(CHANNEL_ERROR|TIMED_OUT|CLOSED)/.test(statuses.published.at(-1) ?? ""), `the outsider's live channel failed mid-test (${statuses.published.join(",")}), so silence proves nothing`);
  const ours = JSON.stringify(events);
  assert.ok(!ours.includes(X.id) && !ours.includes(watcher.userId) && !ours.includes(org.userId) && !ours.includes(mission.id), `an outsider saw our identifiers: ${ours.slice(0, 300)}`);
  assert.deepEqual(events.filter(event => event.type !== "DELETE"), [], "no INSERT/UPDATE reaches a non-member");
  assert.deepEqual(events.filter(event => ["community_members", "mission_members"].includes(event.table)), [], "membership departures are not published to anyone (negative control: with community_members published, this stream delivered the departed member's community_id and user_id)");
});

test("realtime: another member sees a claim, a join and a mission change within five seconds", { skip: realtimeSkip }, async () => {
  const mission = await mk(`Live ${tag}`);
  const seen = [];
  let ready;
  const subscribed = new Promise(resolve => { ready = resolve; });
  org.api.subscribeCommunity(X.id, table => seen.push(table), status => { if (status === "SUBSCRIBED") ready(); });
  await Promise.race([subscribed, sleep(8000)]);
  // Cold-start warm-up (see COMMUNITY-SETUP): wait for the stream to carry something before measuring.
  for (let i = 0; i < 3 && !seen.length; i += 1) { await dee.api.joinMission(mission.id); await dee.api.leaveMission(mission.id); await sleep(5000); }
  seen.length = 0;
  const [task] = await tasksOf(org.api, X.id, mission.id);
  const started = Date.now();
  await dee.api.joinMission(mission.id);
  const joined = await waitUntil(() => seen.includes("missions"), 5000, 50);
  assert.ok(joined !== null, "a mission join must announce itself");
  await dee.api.claimTask(task.id);
  const claimed = await waitUntil(() => seen.includes("mission_tasks"), 5000, 50);
  assert.ok(claimed !== null, "a claim must announce itself");
  const fresh = (await tasksOf(org.api, X.id, mission.id)).find(item => item.id === task.id);
  assert.equal(fresh.claimedName, dee.name);
  console.log(`# realtime join→event ${joined} ms, claim→event ${claimed} ms (total ${Date.now() - started} ms)`);
});
