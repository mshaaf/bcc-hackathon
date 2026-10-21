// Browser-side client for the shared community (Supabase Auth + Postgres + Realtime).
// Only the project URL and publishable key are used here; every permission is enforced by the database.
import { CommunityError, normalizeMember, normalizePost, toCommunityError } from "../lib/community.mjs";

const POST_COLUMNS = "id,community_id,parent_id,author_id,author_name,body,kind,hidden_at,edited_at,created_at";
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
    listPosts: communityId => call(async () => unwrap(await client.from("posts").select(POST_COLUMNS).eq("community_id", communityId).order("created_at", { ascending: true }).order("id", { ascending: true }).limit(POST_LIMIT)).map(normalizePost)),
    // `operationId` must be reused on retry so a send that committed but timed out never duplicates.
    createPost: ({ communityId, parentId = null, body, operationId }) => call(async () => normalizePost(unwrap(await client.rpc("create_post", { p_community: communityId, p_parent: parentId, p_body: body, p_operation: operationId })))),
    editOwnPost: (postId, body) => call(async () => normalizePost(unwrap(await client.rpc("edit_post", { p_post: postId, p_body: body })))),
    hidePost: postId => call(async () => normalizePost(unwrap(await client.rpc("hide_post", { p_post: postId })))),
    // onChange fires for any permitted change; callers re-fetch canonical state rather than trusting the payload.
    subscribeCommunity(communityId, onChange, onStatus = () => {}) {
      const channel = client.channel(`community:${communityId}:${Math.random().toString(36).slice(2)}`);
      for (const table of ["posts", "community_members"]) {
        channel.on("postgres_changes", { event: "*", schema: "public", table, filter: `community_id=eq.${communityId}` }, () => onChange(table));
      }
      // Join/leave bump this row; a DELETE on community_members would not reach other members through row security.
      channel.on("postgres_changes", { event: "UPDATE", schema: "public", table: "communities", filter: `id=eq.${communityId}` }, () => onChange("communities"));
      channel.subscribe(status => onStatus(status));
      return () => { client.removeChannel(channel); };
    },
    // Test/debug access only; the UI never uses it.
    rawClient: client
  };
}
