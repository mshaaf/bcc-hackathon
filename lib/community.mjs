// Pure community rules shared by the browser, the tests and the API wrapper. No network, no DOM.
export const DEMO_COMMUNITY_ID = "b10c0000-0000-4000-8000-000000000001";
export const LIMITS = { displayName: 40, body: 2000 };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const isUuid = value => typeof value === "string" && UUID.test(value);

export function cleanDisplayName(value) {
  const text = String(value ?? "").trim();
  if (!text) return { ok: false, error: "Enter a name to show to other members." };
  if ([...text].length > LIMITS.displayName) return { ok: false, error: `Names can be up to ${LIMITS.displayName} characters.` };
  if (/[\u0000-\u001f\u007f]/.test(text)) return { ok: false, error: "Names cannot contain control characters." };
  return { ok: true, value: text };
}

export function cleanBody(value) {
  const text = String(value ?? "").trim();
  if (!text) return { ok: false, error: "Write something before posting." };
  if ([...text].length > LIMITS.body) return { ok: false, error: `Posts can be up to ${LIMITS.body.toLocaleString("en-US")} characters; this one is ${[...text].length.toLocaleString("en-US")}.` };
  return { ok: true, value: text };
}

export function newOperationId(cryptoImpl = globalThis.crypto) {
  if (cryptoImpl?.randomUUID) return cryptoImpl.randomUUID();
  const bytes = cryptoImpl.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map(byte => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

// Backend error codes (the message of the database exception) mapped to words a neighbor can act on.
const MESSAGES = {
  not_authenticated: "You are not signed in. Join the community first.",
  not_member: "You are not a member of this community. Join first.",
  invalid_display_name: "That name is not allowed. Use 1–40 characters without control characters.",
  invalid_body: "That text is empty or longer than 2,000 characters.",
  parent_not_found: "The post you replied to is no longer available.",
  reply_depth: "Replies go under the original post; you cannot reply to a reply.",
  post_hidden: "A moderator removed that post.",
  post_not_found: "That post is no longer available.",
  forbidden: "You can only change your own posts.",
  rate_limited: "You are posting very quickly. Wait a moment and try again.",
  community_not_found: "That community does not exist.",
  community_full: "This community has reached its member limit.",
  invalid_operation: "The send could not be identified. Try again.",
  operation_conflict: "That send was already used for something else. Copy your text, reload and send again.",
  invalid_kind: "That kind of post is not allowed here.",
  mission_not_found: "That mission is no longer available.",
  mission_archived: "This mission is archived, so it cannot change. Ask the organizer to reopen it.",
  not_mission_member: "Join the mission first.",
  invalid_title: "The title must be 1–120 characters.",
  invalid_objective: "The goal must be 1–1,000 characters.",
  invalid_location: "The location must be 1–200 characters.",
  invalid_origin: "That mission could not be created from this source.",
  invalid_evidence: "The shared evidence was not in the expected form.",
  invalid_tasks: "The job list is not valid (up to 30 jobs, 1–200 characters each, valid dates).",
  invalid_observations: "A shared observation is not valid (text up to 2,000 characters and a valid date).",
  invalid_changes: "Those changes are not valid.",
  invalid_status: "That status is not valid.",
  source_post_not_found: "The discussion this mission came from is no longer available in this community.",
  version_conflict: "Someone else changed this mission first. The latest version is shown; review it and apply your change again.",
  organizer_active: "You organize an active mission. Archive it before leaving.",
  task_not_found: "That job is no longer available.",
  already_claimed: "Someone else already claimed that job.",
  not_claimed: "That job has not been claimed yet.",
  task_done: "Mark the job not done before releasing it.",
  too_many_tasks: "A mission can have up to 30 jobs."
};

export class CommunityError extends Error {
  constructor(code, { retryable = false, cause } = {}) {
    super(code);
    this.name = "CommunityError";
    this.code = code;
    this.retryable = retryable;
    if (cause) this.cause = cause;
  }
}

// Turns whatever the SDK returned into a CommunityError. Unknown errors keep their draft and allow a retry.
export function toCommunityError(error) {
  if (error instanceof CommunityError) return error;
  const raw = String(error?.message ?? error ?? "");
  if (Object.hasOwn(MESSAGES, raw)) return new CommunityError(raw, { cause: error });
  if (!error?.status && /fetch|network|timed out|abort|load failed|ECONN/i.test(raw)) return new CommunityError("network", { retryable: true, cause: error });
  if (error?.status >= 500 || error?.status === 429 || error?.status === 0) return new CommunityError("unavailable", { retryable: true, cause: error });
  return new CommunityError("unknown", { retryable: true, cause: error });
}

export function describeError(error) {
  const known = toCommunityError(error);
  if (known.code === "network") return "Could not reach the shared community. Your text is still here; check your connection and try again.";
  if (known.code === "unavailable" || known.code === "unknown") return "The shared community did not accept that. Your text is still here; try again in a moment.";
  return MESSAGES[known.code];
}

const byTime = (left, right) => (left.createdAt < right.createdAt ? -1 : left.createdAt > right.createdAt ? 1 : left.id < right.id ? -1 : left.id > right.id ? 1 : 0);

// Oldest first, replies grouped under their parent (also oldest first). A reply whose parent is missing stands alone.
export function buildThreads(posts) {
  const ids = new Set(posts.map(post => post.id));
  const replies = new Map();
  const roots = [];
  for (const post of [...posts].sort(byTime)) {
    if (post.parentId && ids.has(post.parentId)) replies.set(post.parentId, [...(replies.get(post.parentId) ?? []), post]);
    else roots.push(post);
  }
  return roots.map(post => ({ post, replies: replies.get(post.id) ?? [] }));
}

export function normalizePost(row) {
  return {
    id: row.id, communityId: row.community_id, missionId: row.mission_id ?? null, parentId: row.parent_id ?? null,
    authorId: row.author_id, authorName: row.author_name, body: row.body, kind: row.kind,
    observedOn: row.observed_on ?? null, fictional: row.fictional === true, imported: row.imported === true,
    hidden: row.hidden_at != null, edited: row.edited_at != null, createdAt: row.created_at
  };
}

export function normalizeMember(row) {
  return { communityId: row.community_id, userId: row.user_id, displayName: row.display_name, joinedAt: row.joined_at };
}

// A post's actions depend on the viewer; the database re-checks all of them.
export function postActions(post, { userId, isModerator }) {
  const own = Boolean(userId) && post.authorId === userId;
  return { edit: own && !post.hidden, hide: Boolean(isModerator) && !post.hidden, reply: !post.hidden && post.parentId == null };
}
