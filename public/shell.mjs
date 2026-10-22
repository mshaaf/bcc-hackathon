// App shell for the shared side of Block Ops: routing, shared state, loading, live updates, drafts and the send path.
// Views (community.mjs, mission.mjs) render from `app` and re-render on `onChange`. Everything from other people reaches the DOM through textContent.
import { DEMO_COMMUNITY_ID, cleanBody, describeError, isUuid, newOperationId, toCommunityError } from "/lib/community.mjs";
import { describeSharedChanges, parseRoute } from "/lib/mission.mjs";
import { clearIfUnchanged, readDrafts, writeDrafts } from "/lib/drafts.mjs";
import { createCommunityClient } from "/community-api.mjs";

export const byId = id => document.getElementById(id);
export const el = (tag, className = "", text = "") => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
};
export const timeFormat = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
export const fullFormat = new Intl.DateTimeFormat("en-US", { dateStyle: "full", timeStyle: "medium" });
export const dayFormat = new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
export const plural = (count, word) => `${count} ${word}${count === 1 ? "" : "s"}`;

export const store = {
  getItem(key) { try { return localStorage.getItem(key); } catch { return null; } },
  setItem(key, value) { try { localStorage.setItem(key, value); } catch { /* private mode: drafts stay in memory */ } },
  removeItem(key) { try { localStorage.removeItem(key); } catch { /* ignore */ } },
  get(key) { return this.getItem(key); },
  set(key, value) { this.setItem(key, value); },
  remove(key) { this.removeItem(key); }
};
export const NAME_KEY = "blockops.displayName";
const LAST_KEY = "blockops.lastCommunity";
// Links without a community id (#/community, #/missions, a campaign share link) mean "the community I was last in".
const defaultCommunity = () => { const last = store.get(LAST_KEY); return isUuid(last) ? last : (app.config?.communityId ?? DEMO_COMMUNITY_ID); };

export const app = {
  route: { section: "community", view: "feed" },
  config: null, configError: null, api: null,
  communityId: null, userId: null, preview: null, community: null, membership: null,
  members: [], posts: [], missions: [], missionMembers: [], tasks: [], missionPosts: [], missionPostsFor: null,
  connection: "idle", loading: true, loadError: null, loadToken: 0, unsubscribe: null, hasLoadedOnce: false,
  drafts: new Map(), pending: new Map(), errors: new Map(), routeFocus: false
};
export const BASE_TITLE = document.title;

const listeners = new Set();
export const onChange = fn => { listeners.add(fn); };
export const emit = () => { for (const fn of listeners) fn(); };
export const announce = message => { const node = byId("community-announce"); if (node) { node.textContent = ""; setTimeout(() => { node.textContent = message; }, 30); } };
export const go = hash => { if (location.hash === hash) applyRoute(); else location.hash = hash; };

// ---------- derived helpers ----------

export const isModerator = () => app.userId != null && app.userId === app.community?.moderatorId;
export const missionById = id => app.missions.find(mission => mission.id === id) ?? null;
export const tasksFor = missionId => app.tasks.filter(task => task.missionId === missionId);
export const membersFor = missionId => app.missionMembers.filter(member => member.missionId === missionId);
export const isMissionMember = missionId => app.userId != null && membersFor(missionId).some(member => member.userId === app.userId);
export const isOrganizer = mission => app.userId != null && mission?.organizerId === app.userId;

// ---------- drafts: kept per community, saved as you type, cleared only if unchanged when a send succeeds ----------

export const getDraft = key => app.drafts.get(key) ?? "";
export const hasDraft = key => app.drafts.has(key);
export function setDraft(key, value) {
  app.drafts.set(key, value);
  writeDrafts(store, app.communityId, Object.fromEntries(app.drafts));
}
export function clearDraft(key) {
  app.drafts.delete(key);
  writeDrafts(store, app.communityId, Object.fromEntries(app.drafts));
}
// A completed send clears only the text it sent (see lib/drafts.mjs).
export const clearDraftIfUnchanged = (communityId, key, submitted) => clearIfUnchanged({ storage: store, activeCommunityId: app.communityId, memory: app.drafts, communityId, key, submitted });
const loadDrafts = communityId => { app.drafts = new Map(Object.entries(readDrafts(store, communityId))); };

// ---------- routing ----------

export function applyRoute() {
  const route = parseRoute(location.hash);
  app.route = route;
  document.body.dataset.section = route.section;
  for (const link of document.querySelectorAll(".section-nav a")) {
    const current = link.dataset.section === route.section && (route.section === "map" || (link.dataset.view === "missions" ? ["missions", "mission", "new", "publish"].includes(route.view) : !["missions", "mission", "new", "publish"].includes(route.view)));
    if (current) link.setAttribute("aria-current", "page"); else link.removeAttribute("aria-current");
  }
  const skip = document.querySelector(".skip-link");
  skip.href = route.section === "map" ? "#panel" : "#community-main";
  skip.textContent = route.section === "map" ? "Skip to the panel" : "Skip to the community";
  if (route.section === "map") { teardown(); document.title = BASE_TITLE; return; }
  const wanted = route.communityId ?? defaultCommunity();
  if (wanted !== app.communityId) {
    teardown();
    app.communityId = wanted;
    app.preview = null; app.membership = null; app.community = null; app.members = []; app.posts = []; app.missions = []; app.missionMembers = []; app.tasks = []; app.missionPosts = []; app.missionPostsFor = null;
    app.hasLoadedOnce = false;
    loadDrafts(wanted);
    void load();
    return;
  }
  if (!app.api && !app.configError) { void load(); return; }
  if (route.view === "mission") void refreshMissionPosts();
  emit();
}

// ---------- loading ----------

async function ensureApi() {
  if (app.api || app.configError) return;
  try {
    const response = await fetch("/api/community-config", { cache: "no-store" });
    if (response.status === 404) { app.configError = "unconfigured"; return; }
    if (!response.ok) throw new Error("config");
    app.config = await response.json();
    if (!window.supabase?.createClient) throw new Error("sdk");
    app.api = createCommunityClient({ url: app.config.url, publishableKey: app.config.publishableKey, createClient: window.supabase.createClient });
    const wanted = parseRoute(location.hash).communityId ?? defaultCommunity();
    if (wanted !== app.communityId) { app.communityId = wanted; loadDrafts(wanted); }
  } catch {
    app.configError = "unavailable";
  }
}

async function fetchShared() {
  const id = app.communityId;
  const [members, posts, missions, missionMembers, tasks, preview] = await Promise.all([
    app.api.listMembers(id), app.api.listPosts(id), app.api.listMissions(id), app.api.listMissionMembers(id), app.api.listTasks(id), app.api.getCommunityPreview(id)
  ]);
  return { members, posts, missions, missionMembers, tasks, preview };
}

export async function load({ quiet = false } = {}) {
  const token = ++app.loadToken;
  if (!quiet) { app.loading = true; emit(); }
  await ensureApi();
  if (token !== app.loadToken) return;
  if (!app.api) { app.loading = false; emit(); return; }
  if (!isUuid(app.communityId)) { app.loading = false; app.preview = null; emit(); return; }
  try {
    const session = await app.api.restoreSession();
    const preview = await app.api.getCommunityPreview(app.communityId);
    const membership = session && preview ? await app.api.getMembership(app.communityId, session.userId) : null;
    let extra = {};
    if (membership) {
      const [community, shared] = await Promise.all([app.api.getCommunity(app.communityId), fetchShared()]);
      extra = { community, ...shared };
    }
    if (token !== app.loadToken) return;
    Object.assign(app, { userId: session?.userId ?? null, preview, membership, loadError: null, loading: false, community: null, members: [], posts: [], missions: [], missionMembers: [], tasks: [], ...extra });
    app.hasLoadedOnce = true;
    if (membership) { store.set(LAST_KEY, app.communityId); subscribe(); } else unsubscribeNow();
    if (membership && app.route.view === "mission") await refreshMissionPosts(true);
  } catch (error) {
    if (token !== app.loadToken) return;
    app.loadError = describeError(error);
    app.loading = false;
  }
  emit();
}

export async function refreshMissionPosts(silent = false) {
  const missionId = app.route.view === "mission" ? app.route.missionId : null;
  if (!missionId || !app.api || !app.membership) return;
  const communityId = app.communityId;
  try {
    const posts = await app.api.listPosts(communityId, { missionId });
    if (communityId !== app.communityId || app.route.missionId !== missionId) return;
    app.missionPosts = posts; app.missionPostsFor = missionId;
    if (!silent) emit();
  } catch (error) { app.loadError = describeError(error); emit(); }
}

// Re-fetch the shared rows after a realtime event, a reconnect, focus/online, a send or a safety tick.
let refreshTimer = null;
export function refreshSoon() {
  clearTimeout(refreshTimer);
  refreshTimer = setTimeout(async () => {
    if (!app.api || !app.membership) return;
    const token = app.loadToken;
    const before = new Set(app.posts.map(post => post.id));
    const beforeMission = new Set(app.missionPosts.map(post => post.id)), missionFor = app.missionPostsFor;
    const was = { tasks: app.tasks, members: app.missionMembers, missions: app.missions };
    try {
      const shared = await fetchShared();
      if (token !== app.loadToken) return;
      const fresh = shared.posts.filter(post => !before.has(post.id) && post.authorId !== app.userId);
      Object.assign(app, shared, { loadError: null });
      await refreshMissionPosts(true);
      if (app.hasLoadedOnce) {
        const inMission = app.route.view === "mission";
        const freshMission = inMission && app.missionPostsFor === missionFor ? app.missionPosts.filter(post => !beforeMission.has(post.id) && post.authorId !== app.userId) : [];
        const changes = inMission ? describeSharedChanges(was, { tasks: shared.tasks, members: shared.missionMembers, missions: shared.missions }, { missionId: app.route.missionId, userId: app.userId }) : [];
        const said = [
          ...(fresh.length ? [`${plural(fresh.length, "new post")} in the conversation.`] : []),
          ...(freshMission.length ? [`${plural(freshMission.length, "new post")} in this mission's discussion.`] : []),
          ...changes.slice(0, 3), ...(changes.length > 3 ? [`${changes.length - 3} more changes.`] : [])
        ];
        if (said.length) announce(said.join(" "));
      }
      emit();
    } catch (error) {
      app.loadError = describeError(error);
      emit();
    }
  }, 120);
}

function subscribe() {
  if (app.unsubscribe || !app.api) return;
  let wasLive = false;
  app.connection = "connecting";
  app.unsubscribe = app.api.subscribeCommunity(app.communityId, refreshSoon, status => {
    const next = status === "SUBSCRIBED" ? "live" : status === "CLOSED" || status === "CHANNEL_ERROR" || status === "TIMED_OUT" ? "reconnecting" : app.connection;
    if (next === "live" && (app.connection === "reconnecting" || (wasLive && app.connection !== "live"))) refreshSoon(); // missed events are not replayed
    if (next !== app.connection) {
      if (next === "live") announce(wasLive ? "Live updates are back." : "Live updates connected.");
      if (next === "reconnecting") announce("Live updates paused. Trying to reconnect.");
    }
    if (next === "live") wasLive = true;
    app.connection = next;
    emit();
  });
}
function unsubscribeNow() {
  app.unsubscribe?.();
  app.unsubscribe = null;
  app.connection = "idle";
}
function teardown() {
  unsubscribeNow();
  clearTimeout(refreshTimer);
  app.loadToken += 1;
}

// ---------- membership actions ----------

export async function joinCommunity(name) {
  const session = await app.api.ensureSession();
  await app.api.joinCommunity(app.communityId, name);
  store.set(NAME_KEY, name);
  app.userId = session.userId;
  await load({ quiet: true });
}
export async function leaveCommunity() {
  await app.api.leaveCommunity(app.communityId);
  unsubscribeNow();
  await load({ quiet: true });
}

// ---------- the send path (posts, replies, edits, updates) ----------

const pkey = key => `${app.communityId}|${key}`;
export const isSending = key => app.pending.get(pkey(key))?.sending === true;
export const hasFailedSend = key => app.pending.has(pkey(key)) && !isSending(key);
export const errorFor = key => app.errors.get(pkey(key)) ?? "";
export const setError = (key, message) => { if (message) app.errors.set(pkey(key), message); else app.errors.delete(pkey(key)); };

// `run(body, operationId)` performs the write. The operation id survives retries of the same text, so a send that committed but
// timed out returns the same post instead of making a second one. `validate` may transform/replace the plain body check.
export async function sendDraft(key, run, { validate = cleanBody, onDone } = {}) {
  const communityId = app.communityId;
  const slot = `${communityId}|${key}`;
  const current = app.pending.get(slot);
  if (current?.sending) return;
  const raw = getDraft(key);
  const checked = validate(raw);
  if (!checked.ok) { app.errors.set(slot, checked.error); emit(); return; }
  const operationId = current && current.body === checked.value ? current.operationId : newOperationId();
  app.pending.set(slot, { operationId, body: checked.value, sending: true });
  app.errors.delete(slot);
  emit();
  try {
    const result = await run(checked.value, operationId);
    app.pending.delete(slot);
    clearDraftIfUnchanged(communityId, key, raw);
    if (communityId === app.communityId) {
      await onDone?.(result);
      app.posts = await app.api.listPosts(communityId);
      await refreshMissionPosts(true);
    }
  } catch (error) {
    const known = toCommunityError(error);
    app.pending.set(slot, { operationId, body: checked.value, sending: false });
    app.errors.set(slot, describeError(known));
    if (!known.retryable) app.pending.delete(slot);
  }
  emit();
}

// ---------- rendering helpers ----------

export function captureFocus() {
  const active = document.activeElement;
  if (!active?.dataset?.focusKey || !byId("community").contains(active)) return null;
  return { key: active.dataset.focusKey, start: active.selectionStart, end: active.selectionEnd };
}
export function restoreFocus(saved) {
  if (!saved) return;
  const target = byId("community").querySelector(`[data-focus-key="${CSS.escape(saved.key)}"]`);
  if (!target) return;
  target.focus({ preventScroll: true });
  if (saved.start != null && target.setSelectionRange) try { target.setSelectionRange(saved.start, saved.end); } catch { /* not a text field */ }
}
export const focusKey = key => byId("community").querySelector(`[data-focus-key="${CSS.escape(key)}"]`)?.focus();

let fieldCounter = 0;
// A labelled textarea form whose text is a persisted draft. `fieldId` keeps label and field paired.
export function textForm({ key, label, rows = 3, submitLabel, onSubmit, onCancel, placeholder = "", fieldId = `field-${++fieldCounter}`, extra = null }) {
  const form = el("form", "post-form");
  form.noValidate = true;
  const lab = el("label", "field-label", label);
  lab.htmlFor = fieldId;
  const area = el("textarea");
  area.id = fieldId; area.rows = rows; area.value = getDraft(key); area.placeholder = placeholder;
  area.dataset.focusKey = key;
  area.setAttribute("aria-describedby", `${fieldId}-meta`);
  const meta = el("div", "post-form-meta");
  meta.id = `${fieldId}-meta`;
  const count = el("span", "char-count");
  const sending = isSending(key);
  const error = errorFor(key);
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
  const submit = el("button", "button button-primary", sending ? "Sending…" : hasFailedSend(key) ? "Try again" : submitLabel);
  submit.type = "submit"; submit.disabled = sending; submit.dataset.focusKey = `${key}:submit`;
  actions.append(submit);
  if (onCancel) { const cancel = el("button", "button button-quiet", "Cancel"); cancel.type = "button"; cancel.addEventListener("click", onCancel); actions.append(cancel); }
  meta.append(count, actions);
  const problem = el("p", "form-error", error);
  problem.setAttribute("role", "alert");
  problem.hidden = !error;
  if (error && hasFailedSend(key)) problem.append(document.createTextNode(" Nothing was lost."));
  form.append(lab);
  if (extra) form.append(extra);
  form.append(area, problem, meta);
  form.addEventListener("submit", event => { event.preventDefault(); onSubmit(); });
  return form;
}

// ---------- wiring ----------

// A navigation (not a live update) moves keyboard and screen-reader focus to the new screen's heading; community.mjs consumes the flag.
window.addEventListener("hashchange", () => { app.routeFocus = true; applyRoute(); });
window.addEventListener("online", () => { if (app.membership && app.route.section === "community") refreshSoon(); });
document.addEventListener("visibilitychange", () => { if (!document.hidden && app.membership && app.route.section === "community") refreshSoon(); });
// Bound staleness whatever Realtime does: every 10 s while live updates are not confirmed, every 30 s when they are.
let ticks = 0;
setInterval(() => {
  ticks += 1;
  if (!app.membership || document.hidden || app.route.section !== "community") return;
  if (app.connection !== "live" || ticks % 3 === 0) refreshSoon();
}, 10000);
