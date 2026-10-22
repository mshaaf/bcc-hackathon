// Browser-side client for the shared community (Supabase Auth + Postgres + Realtime).
// Only the project URL and publishable key are used here; every permission is enforced by the database.
import { CommunityError, normalizeMember, normalizePost, toCommunityError } from "../lib/community.mjs";
import { normalizeMission, normalizeMissionMember, normalizeTask } from "../lib/mission.mjs";

const POST_COLUMNS = "id,community_id,mission_id,parent_id,author_id,author_name,body,kind,observed_on,fictional,imported,hidden_at,edited_at,created_at";
const MISSION_COLUMNS = "id,community_id,organizer_id,organizer_name,title,objective,location_text,starts_at,status,origin,source_post_id,source,evidence,version,activity_at,created_at";
const MISSION_MEMBER_COLUMNS = "mission_id,community_id,user_id,display_name,joined_at";
const TASK_COLUMNS = "id,mission_id,community_id,description,due_date,position,claimed_by,claimed_name,claimed_at,done,done_at,imported,created_at";
const MEMBER_COLUMNS = "community_id,user_id,display_name,joined_at";
const COMMUNITY_COLUMNS = "id,title,description,is_demo,moderator_id,created_at";
const POST_LIMIT = 1000;

// `createClient` comes from the vendored SDK (window.supabase.createClient in the browser).
export function createCommunityClient({ url, publishableKey, createClient, authOptions = {} }) {
  if (!url || !publishableKey || typeof createClient !== "function") throw new CommunityError("not_configured");
  const client = createClient(url, publishableKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, ...authOptions } });

  const unwrap = ({ data, error }) => { if (error) throw toCommunityError(error); return data; };
  const call = async work => { try { return await work(); } catch (error) { throw toCommunityError(error); } };
  const sessionUser = session => (session?.user ? { userId: session.user.id, isAnonymous: session.user.is_anonymous === true } : null);

  return {
    // Existing session only; never creates an account (used to render the join preview without signing anyone in).
    restoreSession: () => call(async () => sessionUser(unwrap(await client.auth.getSession()).session)),
    // Reuses the stored session or creates an anonymous guest session.
    ensureSession: () => call(async () => {
      const existing = sessionUser(unwrap(await client.auth.getSession()).session);
      if (existing) return existing;
      return sessionUser(unwrap(await client.auth.signInAnonymously()).session);
    }),
    signOut: () => call(async () => { await client.auth.signOut({ scope: "local" }); }),
    getCommunityPreview: id => call(async () => {
      const row = unwrap(await client.rpc("community_preview", { p_id: id }))?.[0];
      return row ? { id: row.id, title: row.title, description: row.description, isDemo: row.is_demo, memberCount: row.member_count } : null;
    }),
    getCommunity: id => call(async () => {
      const row = unwrap(await client.from("communities").select(COMMUNITY_COLUMNS).eq("id", id).maybeSingle());
      return row ? { id: row.id, title: row.title, description: row.description, isDemo: row.is_demo, moderatorId: row.moderator_id } : null;
    }),
    getMembership: (communityId, userId) => call(async () => {
      const row = unwrap(await client.from("community_members").select(MEMBER_COLUMNS).eq("community_id", communityId).eq("user_id", userId).maybeSingle());
      return row ? normalizeMember(row) : null;
    }),
    joinCommunity: (communityId, displayName) => call(async () => normalizeMember(unwrap(await client.rpc("join_community", { p_community: communityId, p_display_name: displayName })))),
    leaveCommunity: communityId => call(async () => { unwrap(await client.rpc("leave_community", { p_community: communityId })); }),
    listMembers: communityId => call(async () => unwrap(await client.from("community_members").select(MEMBER_COLUMNS).eq("community_id", communityId).order("joined_at", { ascending: true }).order("user_id", { ascending: true })).map(normalizeMember)),
    // Community conversation (missionId omitted) or one mission's discussion.
    listPosts: (communityId, { missionId = null } = {}) => call(async () => {
      let query = client.from("posts").select(POST_COLUMNS).eq("community_id", communityId);
      query = missionId ? query.eq("mission_id", missionId) : query.is("mission_id", null);
      return unwrap(await query.order("created_at", { ascending: true }).order("id", { ascending: true }).limit(POST_LIMIT)).map(normalizePost);
    }),
    listMissions: communityId => call(async () => unwrap(await client.from("missions").select(MISSION_COLUMNS).eq("community_id", communityId).order("created_at", { ascending: false }).order("id", { ascending: true }).limit(100)).map(normalizeMission)),
    listMissionMembers: communityId => call(async () => unwrap(await client.from("mission_members").select(MISSION_MEMBER_COLUMNS).eq("community_id", communityId).order("joined_at", { ascending: true }).order("user_id", { ascending: true }).limit(2000)).map(normalizeMissionMember)),
    listTasks: communityId => call(async () => unwrap(await client.from("mission_tasks").select(TASK_COLUMNS).eq("community_id", communityId).order("position", { ascending: true }).order("created_at", { ascending: true }).limit(1500)).map(normalizeTask)),
    // A fresh read of everything the export needs, from the database, not from the page's cached state.
    getMissionBundle: (communityId, missionId) => call(async () => {
      const [mission, members, tasks, posts] = await Promise.all([
        client.from("missions").select(MISSION_COLUMNS).eq("id", missionId).eq("community_id", communityId).maybeSingle(),
        client.from("mission_members").select(MISSION_MEMBER_COLUMNS).eq("mission_id", missionId).order("joined_at", { ascending: true }),
        client.from("mission_tasks").select(TASK_COLUMNS).eq("mission_id", missionId).order("position", { ascending: true }),
        client.from("posts").select(POST_COLUMNS).eq("mission_id", missionId).order("created_at", { ascending: true }).order("id", { ascending: true }).limit(POST_LIMIT)
      ]);
      const row = unwrap(mission);
      if (!row) throw new CommunityError("mission_not_found");
      return { mission: normalizeMission(row), members: unwrap(members).map(normalizeMissionMember), tasks: unwrap(tasks).map(normalizeTask), posts: unwrap(posts).map(normalizePost) };
    }),
    // `operationId` must be reused on retry so a send that committed but timed out never duplicates.
    createPost: ({ communityId, parentId = null, missionId = null, kind = "discussion", observedOn = null, fictional = false, body, operationId }) => call(async () => normalizePost(unwrap(await client.rpc("create_post", {
      p_community: communityId, p_parent: parentId, p_body: body, p_operation: operationId, p_mission: missionId, p_kind: kind, p_observed_on: observedOn, p_fictional: fictional
    })))),
    editOwnPost: (postId, body) => call(async () => normalizePost(unwrap(await client.rpc("edit_post", { p_post: postId, p_body: body })))),
    hidePost: postId => call(async () => normalizePost(unwrap(await client.rpc("hide_post", { p_post: postId })))),
    // payload: {title, objective, location, startsAt, sourcePostId?, tasks:[{description,due?}]}. Discussion-origin: no records.
    createMission: ({ communityId, title, objective, location, startsAt = null, sourcePostId = null, tasks = [], operationId }) => call(async () => normalizeMission(unwrap(await client.rpc("create_mission", {
      p_community: communityId, p_title: title, p_objective: objective, p_location: location, p_starts_at: startsAt, p_source_post: sourcePostId, p_origin: "discussion",
      p_source: null, p_evidence: [], p_tasks: tasks, p_observations: [], p_operation: operationId
    })))),
    // payload comes from publishPayloadFromCampaign(); a reviewed local copy, never the local original.
    publishMission: ({ communityId, payload, sourcePostId = null, operationId }) => call(async () => normalizeMission(unwrap(await client.rpc("create_mission", {
      p_community: communityId, p_title: payload.title, p_objective: payload.objective, p_location: payload.location, p_starts_at: payload.startsAt ?? null, p_source_post: sourcePostId,
      p_origin: "local_campaign", p_source: payload.source, p_evidence: payload.evidence, p_tasks: payload.tasks, p_observations: payload.observations, p_operation: operationId
    })))),
    updateMission: ({ missionId, expectedVersion, changes }) => call(async () => normalizeMission(unwrap(await client.rpc("update_mission", { p_mission: missionId, p_expected_version: expectedVersion, p_changes: changes })))),
    joinMission: missionId => call(async () => normalizeMissionMember(unwrap(await client.rpc("join_mission", { p_mission: missionId })))),
    leaveMission: missionId => call(async () => { unwrap(await client.rpc("leave_mission", { p_mission: missionId })); }),
    addTask: ({ missionId, description, due = null }) => call(async () => normalizeTask(unwrap(await client.rpc("add_task", { p_mission: missionId, p_description: description, p_due: due })))),
    claimTask: taskId => call(async () => normalizeTask(unwrap(await client.rpc("claim_task", { p_task: taskId })))),
    releaseTask: taskId => call(async () => normalizeTask(unwrap(await client.rpc("release_task", { p_task: taskId })))),
    setTaskDone: (taskId, done) => call(async () => normalizeTask(unwrap(await client.rpc("set_task_done", { p_task: taskId, p_done: done })))),
    // onChange fires for any permitted change; callers re-fetch canonical state rather than trusting the payload.
    subscribeCommunity(communityId, onChange, onStatus = () => {}) {
      const channel = client.channel(`community:${communityId}:${Math.random().toString(36).slice(2)}`);
      // Only tables whose events are row-security checked and carry a single-uuid key. Membership is deliberately NOT subscribed:
      // joins and leaves bump communities.activity_at / missions.activity_at (an UPDATE), which is what announces them.
      for (const table of ["posts", "missions", "mission_tasks"]) {
        channel.on("postgres_changes", { event: "*", schema: "public", table, filter: `community_id=eq.${communityId}` }, () => onChange(table));
      }
      channel.on("postgres_changes", { event: "UPDATE", schema: "public", table: "communities", filter: `id=eq.${communityId}` }, () => onChange("communities"));
      channel.subscribe(status => onStatus(status));
      return () => { client.removeChannel(channel); };
    },
    // Test/debug access only; the UI never uses it.
    rawClient: client
  };
}
