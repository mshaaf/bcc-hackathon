// Community section: join, read, post, reply, edit and moderate in the shared community.
// All text from other people reaches the DOM through textContent only. The database enforces every rule; this file only shapes the experience.
import {
  DEMO_COMMUNITY_ID, buildThreads, cleanBody, cleanDisplayName, describeError, isUuid, newOperationId, postActions, toCommunityError
} from "/lib/community.mjs";
import { createCommunityClient } from "/community-api.mjs";

const byId = id => document.getElementById(id);
const el = (tag, className = "", text = "") => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
};
const NAME_KEY = "blockops.displayName";
const DRAFT_KEY = communityId => `blockops.drafts.${communityId}`;
const timeFormat = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
const fullFormat = new Intl.DateTimeFormat("en-US", { dateStyle: "full", timeStyle: "medium" });

const safeStorage = {
  get(key) { try { return localStorage.getItem(key); } catch { return null; } },
  set(key, value) { try { localStorage.setItem(key, value); } catch { /* private mode: drafts stay in memory */ } },
  remove(key) { try { localStorage.removeItem(key); } catch { /* ignore */ } }
};

const state = {
  config: null, configError: null, api: null,
  communityId: null, userId: null, preview: null, community: null, membership: null, members: [], posts: [],
  connection: "idle", loading: true, loadError: null, loadToken: 0, unsubscribe: null,
  drafts: new Map(), pending: new Map(), errors: new Map(), editing: new Set(), replying: new Set(), confirmingHide: null,
  joining: false, joinError: "", nameNote: ""
};

// ---------- routing ----------

function currentRoute() {
  if (location.hash.startsWith("#/map")) return { section: "map" };
  const match = /^#\/community(?:\/([^/?#]+))?/.exec(location.hash);
  return { section: "community", id: match?.[1] ?? null };
}

function applyRoute() {
  const route = currentRoute();
  document.body.dataset.section = route.section;
  for (const link of document.querySelectorAll(".section-nav a")) link.toggleAttribute("aria-current", link.dataset.section === route.section);
  const skip = document.querySelector(".skip-link");
  skip.href = route.section === "map" ? "#panel" : "#community-main";
  skip.textContent = route.section === "map" ? "Skip to the panel" : "Skip to the community";
  if (route.section === "map") { teardown(); return; }
  const wanted = route.id ?? state.config?.communityId ?? DEMO_COMMUNITY_ID;
  if (wanted !== state.communityId) {
    teardown();
    state.communityId = wanted;
    state.drafts = new Map(readDrafts(wanted));
  }
  void load();
}

function readDrafts(communityId) {
  try { return Object.entries(JSON.parse(safeStorage.get(DRAFT_KEY(communityId)) ?? "{}")).filter(([, value]) => typeof value === "string"); } catch { return []; }
}
function saveDrafts() {
  const entries = [...state.drafts].filter(([, value]) => value.trim());
  if (entries.length) safeStorage.set(DRAFT_KEY(state.communityId), JSON.stringify(Object.fromEntries(entries)));
  else safeStorage.remove(DRAFT_KEY(state.communityId));
}
function setDraft(key, value) { state.drafts.set(key, value); saveDrafts(); }
function clearDraft(key) { state.drafts.delete(key); saveDrafts(); }

// ---------- loading ----------

async function ensureApi() {
  if (state.api || state.configError) return;
  try {
    const response = await fetch("/api/community-config", { cache: "no-store" });
    if (response.status === 404) { state.configError = "unconfigured"; return; }
    if (!response.ok) throw new Error("config");
    state.config = await response.json();
    if (!window.supabase?.createClient) throw new Error("sdk");
    state.api = createCommunityClient({ url: state.config.url, publishableKey: state.config.publishableKey, createClient: window.supabase.createClient });
    if (!currentRoute().id) state.communityId = state.config.communityId;
  } catch {
    state.configError = "unavailable";
  }
}

async function load({ quiet = false } = {}) {
  const token = ++state.loadToken;
  if (!quiet) { state.loading = true; render(); }
  await ensureApi();
  if (token !== state.loadToken) return;
  if (!state.api) { state.loading = false; render(); return; }
  if (!isUuid(state.communityId)) { state.loading = false; state.preview = null; render(); return; }
  try {
    const session = await state.api.restoreSession();
    const preview = await state.api.getCommunityPreview(state.communityId);
    const membership = session && preview ? await state.api.getMembership(state.communityId, session.userId) : null;
    let community = null, members = [], posts = [];
    if (membership) [community, members, posts] = await Promise.all([state.api.getCommunity(state.communityId), state.api.listMembers(state.communityId), state.api.listPosts(state.communityId)]);
    if (token !== state.loadToken) return;
    Object.assign(state, { userId: session?.userId ?? null, preview, membership, community, members, posts, loadError: null, loading: false });
    if (membership) subscribe(); else unsubscribeNow();
  } catch (error) {
    if (token !== state.loadToken) return;
    state.loadError = describeError(error);
    state.loading = false;
  }
  render();
}

// Refresh only the shared rows (members + posts) after a realtime event, a reconnect or a send.
let refreshTimer = null;
function refreshSoon() {
  clearTimeout(refreshTimer);
  refreshTimer = setTimeout(async () => {
    if (!state.api || !state.membership) return;
    const token = state.loadToken;
    try {
      const [members, posts, preview] = await Promise.all([state.api.listMembers(state.communityId), state.api.listPosts(state.communityId), state.api.getCommunityPreview(state.communityId)]);
      if (token !== state.loadToken) return;
      Object.assign(state, { members, posts, preview, loadError: null });
      render();
    } catch (error) {
      state.loadError = describeError(error);
      render();
    }
  }, 120);
}

function subscribe() {
  if (state.unsubscribe || !state.api) return;
  let wasLive = false;
  state.connection = "connecting";
  state.unsubscribe = state.api.subscribeCommunity(state.communityId, refreshSoon, status => {
    const next = status === "SUBSCRIBED" ? "live" : status === "CLOSED" || status === "CHANNEL_ERROR" || status === "TIMED_OUT" ? "reconnecting" : state.connection;
    const recovered = next === "live" && wasLive === false && state.connection !== "connecting";
    if (next === "live") wasLive = true;
    if (next === "live" && state.connection === "reconnecting") refreshSoon(); // missed events are not replayed; re-fetch canonical state
    if (recovered) refreshSoon();
    state.connection = next;
    renderConnection();
  });
}
function unsubscribeNow() {
  state.unsubscribe?.();
  state.unsubscribe = null;
  state.connection = "idle";
}
function teardown() {
  unsubscribeNow();
  clearTimeout(refreshTimer);
  state.loadToken += 1; // abandon any in-flight load
}

// ---------- actions ----------

async function join(event) {
  event.preventDefault();
  if (state.joining) return;
  const name = cleanDisplayName(byId("join-name").value);
  if (!name.ok) { state.joinError = name.error; renderJoin(); byId("join-name").focus(); return; }
  state.joining = true; state.joinError = ""; renderJoin();
  try {
    const session = await state.api.ensureSession();
    await state.api.joinCommunity(state.communityId, name.value);
    safeStorage.set(NAME_KEY, name.value);
    state.userId = session.userId;
    state.joining = false;
    await load({ quiet: true });
    byId("composer-body")?.focus();
  } catch (error) {
    state.joining = false;
    state.joinError = describeError(error);
    renderJoin();
  }
}

async function saveName(event) {
  event.preventDefault();
  const name = cleanDisplayName(byId("rename-input").value);
  if (!name.ok) { state.nameNote = name.error; renderSide(); return; }
  try {
    await state.api.joinCommunity(state.communityId, name.value);
    safeStorage.set(NAME_KEY, name.value);
    state.nameNote = "Name updated. Earlier posts keep the name they were posted under.";
    await load({ quiet: true });
  } catch (error) { state.nameNote = describeError(error); renderSide(); }
}

async function leave() {
  try {
    await state.api.leaveCommunity(state.communityId);
    state.unsubscribe && unsubscribeNow();
    await load({ quiet: true });
  } catch (error) { state.loadError = describeError(error); render(); }
}

// One send path for new posts, replies and edits. The operation id survives retries of the same text.
async function send(key, run) {
  const pending = state.pending.get(key);
  if (pending?.sending) return;
  const raw = state.drafts.get(key) ?? "";
  const body = cleanBody(raw);
  if (!body.ok) { state.errors.set(key, body.error); renderFeedOnly(); return; }
  const operationId = pending && pending.body === body.value ? pending.operationId : newOperationId();
  state.pending.set(key, { operationId, body: body.value, sending: true });
  state.errors.delete(key);
  renderFeedOnly();
  const nearBottom = document.documentElement.scrollHeight - window.scrollY - window.innerHeight < 160;
  try {
    await run(body.value, operationId);
    state.pending.delete(key);
    clearDraft(key);
    if (key.startsWith("reply:")) state.replying.delete(key.slice(6));
    if (key.startsWith("edit:")) state.editing.delete(key.slice(5));
    state.posts = await state.api.listPosts(state.communityId);
    renderFeedOnly();
    if (key === "new" || key.startsWith("reply:") || nearBottom) byId("feed-end")?.scrollIntoView({ block: "nearest" });
    if (key === "new") byId("composer-body")?.focus();
  } catch (error) {
    state.pending.set(key, { operationId, body: body.value, sending: false });
    const known = toCommunityError(error);
    state.errors.set(key, describeError(known));
    if (!known.retryable) state.pending.delete(key);
    renderFeedOnly();
  }
}

const sendNew = () => send("new", (body, operationId) => state.api.createPost({ communityId: state.communityId, body, operationId }));
const sendReply = parentId => send(`reply:${parentId}`, (body, operationId) => state.api.createPost({ communityId: state.communityId, parentId, body, operationId }));
const sendEdit = postId => send(`edit:${postId}`, body => state.api.editOwnPost(postId, body));

async function hide(postId) {
  try {
    await state.api.hidePost(postId);
    state.confirmingHide = null;
    state.posts = await state.api.listPosts(state.communityId);
    renderFeedOnly();
  } catch (error) { state.errors.set(`hide:${postId}`, describeError(error)); renderFeedOnly(); }
}

// ---------- rendering ----------

function captureFocus() {
  const active = document.activeElement;
  if (!active?.dataset?.focusKey || !byId("community").contains(active)) return null;
  return { key: active.dataset.focusKey, start: active.selectionStart, end: active.selectionEnd };
}
function restoreFocus(saved) {
  if (!saved) return;
  const target = byId("community").querySelector(`[data-focus-key="${CSS.escape(saved.key)}"]`);
  if (!target) return;
  target.focus({ preventScroll: true });
  if (saved.start != null && target.setSelectionRange) try { target.setSelectionRange(saved.start, saved.end); } catch { /* not a text field */ }
}

function render() {
  const saved = captureFocus();
  const online = Boolean(state.api) && !state.configError;
  byId("community-loading").hidden = !state.loading;
  byId("community-unconfigured").hidden = state.loading || online || state.configError !== "unconfigured";
  byId("community-unavailable").hidden = state.loading || online || state.configError !== "unavailable";
  const found = online && !state.loading && state.preview;
  byId("community-notfound").hidden = state.loading || !online || state.preview !== null || Boolean(state.loadError);
  byId("community-error").hidden = !state.loadError || state.loading;
  byId("community-error-text").textContent = state.loadError ?? "";
  byId("community-body").hidden = !found;
  if (found) {
    byId("community-title").textContent = state.preview.title;
    byId("community-purpose").textContent = state.preview.description;
    byId("community-demo-badge").hidden = !state.preview.isDemo;
    byId("community-count").textContent = `${state.preview.memberCount} ${state.preview.memberCount === 1 ? "member" : "members"}`;
    byId("join-panel").hidden = Boolean(state.membership);
    byId("member-area").hidden = !state.membership;
    renderJoin();
    if (state.membership) { renderSide(); renderFeed(); renderConnection(); }
  }
  restoreFocus(saved);
}

function renderJoin() {
  const form = byId("join-form");
  const input = byId("join-name");
  if (!input.value && !form.dataset.touched) input.value = safeStorage.get(NAME_KEY) ?? "";
  byId("join-button").disabled = state.joining;
  byId("join-button").textContent = state.joining ? "Joining…" : "Join the conversation";
  byId("join-error").hidden = !state.joinError;
  byId("join-error").textContent = state.joinError;
}

function renderConnection() {
  const node = byId("community-connection");
  if (!state.membership) { node.hidden = true; return; }
  node.hidden = false;
  const labels = { live: ["Live", "Updates from other members appear here automatically."], reconnecting: ["Reconnecting…", "Live updates paused. Trying again; what you see may be out of date."], connecting: ["Connecting…", "Setting up live updates."], idle: ["Offline", "Live updates are off."] };
  const [label, detail] = labels[state.connection] ?? labels.idle;
  node.dataset.state = state.connection;
  node.textContent = "";
  node.append(el("span", "dot"), el("strong", "", label), el("span", "visually-hidden", ` ${detail}`));
  node.title = detail;
}

function renderSide() {
  const list = byId("member-list");
  list.replaceChildren(...state.members.map(member => {
    const item = el("li");
    item.append(el("span", "member-name", member.displayName));
    if (member.userId === state.userId) item.append(el("span", "badge", "you"));
    if (member.userId === state.community?.moderatorId) item.append(el("span", "badge badge-demo", "moderator"));
    return item;
  }));
  byId("member-heading-count").textContent = String(state.members.length);
  const mine = state.members.find(member => member.userId === state.userId);
  const rename = byId("rename-input");
  if (!rename.dataset.touched && mine) rename.value = mine.displayName;
  byId("rename-note").textContent = state.nameNote;
  byId("rename-note").hidden = !state.nameNote;
}

function formField(key, { label, rows = 3, submitLabel, onSubmit, onCancel, placeholder = "" }) {
  const form = el("form", "post-form");
  form.noValidate = true;
  const id = `field-${key.replace(/[^a-z0-9]/gi, "-")}`;
  const lab = el("label", "field-label", label);
  lab.htmlFor = id;
  const area = el("textarea");
  area.id = id; area.rows = rows; area.value = state.drafts.get(key) ?? ""; area.placeholder = placeholder;
  area.dataset.focusKey = key;
  area.setAttribute("aria-describedby", `${id}-meta`);
  const meta = el("div", "post-form-meta");
  meta.id = `${id}-meta`;
  const count = el("span", "char-count");
  const sending = state.pending.get(key)?.sending === true;
  const error = state.errors.get(key);
  const updateCount = () => {
    const length = [...area.value.trim()].length;
    count.textContent = `${length.toLocaleString("en-US")} / 2,000`;
    count.classList.toggle("over", length > 2000);
  };
  area.addEventListener("input", () => { setDraft(key, area.value); updateCount(); });
  area.addEventListener("keydown", event => {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") { event.preventDefault(); form.requestSubmit(); }
    if (event.key === "Escape" && onCancel) { event.preventDefault(); onCancel(); }
  });
  updateCount();
  const actions = el("div", "form-actions");
  const submit = el("button", "button button-primary", sending ? "Sending…" : error && state.pending.has(key) ? "Try again" : submitLabel);
  submit.type = "submit"; submit.disabled = sending;
  if (key === "new") submit.id = "composer-submit";
  actions.append(submit);
  if (onCancel) { const cancel = el("button", "button button-quiet", "Cancel"); cancel.type = "button"; cancel.addEventListener("click", onCancel); actions.append(cancel); }
  meta.append(count, actions);
  const problem = el("p", "form-error", error ?? "");
  problem.setAttribute("role", "alert");
  problem.hidden = !error;
  if (error && state.pending.has(key)) problem.append(document.createTextNode(" Nothing was lost."));
  form.append(lab, area, problem, meta);
  form.addEventListener("submit", event => { event.preventDefault(); onSubmit(); });
  return form;
}

function postNode(post, { replyable }) {
  const me = { userId: state.userId, isModerator: state.userId != null && state.userId === state.community?.moderatorId };
  const actions = postActions(post, me);
  const item = el("li", post.parentId ? "post reply" : "post");
  item.dataset.postId = post.id;
  const head = el("header", "post-head");
  head.append(el("strong", "post-author", post.authorName));
  if (post.authorId === state.userId) head.append(el("span", "badge", "you"));
  if (post.authorId === state.community?.moderatorId) head.append(el("span", "badge badge-demo", "moderator"));
  const time = el("time", "post-time", timeFormat.format(new Date(post.createdAt)));
  time.dateTime = post.createdAt;
  time.title = fullFormat.format(new Date(post.createdAt));
  head.append(time);
  if (post.edited && !post.hidden) head.append(el("span", "post-edited", "edited"));
  item.append(head);
  const editing = state.editing.has(post.id) && actions.edit;
  if (post.hidden) item.append(el("p", "post-removed", "This post was hidden by a moderator."));
  else if (!editing) item.append(el("p", "post-body", post.body));
  const bar = el("div", "post-actions");
  const add = (text, handler, label) => {
    const button = el("button", "button button-quiet", text);
    button.type = "button";
    button.setAttribute("aria-label", `${label} ${post.authorName}'s post`);
    button.dataset.focusKey = `${text.toLowerCase()}-btn:${post.id}`;
    button.addEventListener("click", handler);
    bar.append(button);
  };
  if (replyable && actions.reply && !state.replying.has(post.id)) add("Reply", () => { state.replying.add(post.id); renderFeedOnly(); document.querySelector(`[data-focus-key="reply:${CSS.escape(post.id)}"]`)?.focus(); }, "Reply to");
  if (actions.edit && !editing) add("Edit", () => { state.editing.add(post.id); state.drafts.set(`edit:${post.id}`, post.body); renderFeedOnly(); document.querySelector(`[data-focus-key="edit:${CSS.escape(post.id)}"]`)?.focus(); }, "Edit");
  if (actions.hide && state.confirmingHide !== post.id) add("Hide", () => { state.confirmingHide = post.id; renderFeedOnly(); }, "Hide");
  if (bar.children.length) item.append(bar);
  if (editing) {
    item.append(formField(`edit:${post.id}`, { label: "Edit your post", submitLabel: "Save", onSubmit: () => sendEdit(post.id), onCancel: () => { state.editing.delete(post.id); clearDraft(`edit:${post.id}`); state.errors.delete(`edit:${post.id}`); renderFeedOnly(); } }));
  }
  if (actions.hide && state.confirmingHide === post.id) {
    const confirm = el("div", "hide-confirm");
    confirm.append(el("p", "", "Hide this post for everyone? Its text is removed from the conversation."));
    const yes = el("button", "button button-primary", "Hide post"); yes.type = "button"; yes.addEventListener("click", () => hide(post.id));
    const no = el("button", "button button-quiet", "Cancel"); no.type = "button"; no.addEventListener("click", () => { state.confirmingHide = null; renderFeedOnly(); });
    confirm.append(yes, no);
    const problem = state.errors.get(`hide:${post.id}`);
    if (problem) { const alert = el("p", "form-error", problem); alert.setAttribute("role", "alert"); confirm.append(alert); }
    item.append(confirm);
  }
  return item;
}

function renderFeed() {
  const saved = captureFocus();
  const threads = buildThreads(state.posts);
  const feed = byId("feed");
  byId("feed-empty").hidden = threads.length > 0;
  byId("feed-heading-count").textContent = String(state.posts.length);
  feed.replaceChildren(...threads.map(({ post, replies }) => {
    const item = postNode(post, { replyable: true });
    if (replies.length) {
      const list = el("ol", "replies");
      list.setAttribute("aria-label", `Replies to ${post.authorName}`);
      list.append(...replies.map(reply => postNode(reply, { replyable: false })));
      item.append(list);
    }
    if (state.replying.has(post.id) && !post.hidden) {
      item.append(formField(`reply:${post.id}`, { label: `Reply to ${post.authorName}`, rows: 2, submitLabel: "Reply", onSubmit: () => sendReply(post.id), onCancel: () => { state.replying.delete(post.id); state.errors.delete(`reply:${post.id}`); renderFeedOnly(); } }));
    }
    return item;
  }));
  renderComposer();
  restoreFocus(saved);
}

function renderComposer() {
  const host = byId("composer");
  const saved = captureFocus();
  const form = formField("new", { label: "Share an update, question or idea with your neighbors", rows: 3, submitLabel: "Post", onSubmit: sendNew, placeholder: "What is happening on your block?" });
  form.querySelector("textarea").id = "composer-body";
  host.replaceChildren(form);
  restoreFocus(saved);
}

const renderFeedOnly = () => { if (state.membership) renderFeed(); };

// ---------- wiring ----------

byId("join-form").addEventListener("submit", join);
byId("join-name").addEventListener("input", () => { byId("join-form").dataset.touched = "1"; });
byId("rename-form").addEventListener("submit", saveName);
byId("rename-input").addEventListener("input", () => { byId("rename-input").dataset.touched = "1"; });
byId("leave-button").addEventListener("click", () => { byId("leave-confirm").hidden = false; byId("leave-button").hidden = true; byId("leave-yes").focus(); });
byId("leave-no").addEventListener("click", () => { byId("leave-confirm").hidden = true; byId("leave-button").hidden = false; byId("leave-button").focus(); });
byId("leave-yes").addEventListener("click", () => { byId("leave-confirm").hidden = true; byId("leave-button").hidden = false; void leave(); });
byId("community-retry").addEventListener("click", () => { state.configError = null; state.loadError = null; void load(); });
window.addEventListener("hashchange", applyRoute);
window.addEventListener("online", () => { if (state.membership) refreshSoon(); });
document.addEventListener("visibilitychange", () => { if (!document.hidden && state.membership) refreshSoon(); });
// Safety net for a silently dead or slow-to-resume socket: re-fetch canonical state every 10 s while live updates are not
// confirmed, and every 30 s even when they are, so staleness is bounded whatever Realtime does.
let ticks = 0;
setInterval(() => {
  ticks += 1;
  if (!state.membership || document.hidden) return;
  if (state.connection !== "live" || ticks % 3 === 0) refreshSoon();
}, 10000);

applyRoute();
