// Community screen (the default view): header, join gate, conversation, active missions, members. Other screens live in mission.mjs.
import { cleanDisplayName, describeError } from "/lib/community.mjs";
import { MISSION_STATUSES, missionHash, missionProgress, newMissionHash } from "/lib/mission.mjs";
import { renderThreads } from "/posts.mjs";
import { renderMissionView } from "/mission.mjs";
import {
  NAME_KEY, app, applyRoute, byId, captureFocus, el, emit, isSending, joinCommunity, leaveCommunity, load, onChange, plural, restoreFocus, sendDraft, store, tasksFor, textForm
} from "/shell.mjs";

const VIEWS = ["feed", "missions", "mission", "new", "publish"];
let joining = false, joinError = "", renameNote = "", leaveError = "";

function render() {
  const saved = captureFocus();
  const route = app.route;
  if (route.section !== "community") return;
  const online = Boolean(app.api) && !app.configError;
  const invalid = route.view === "invalid";
  byId("community-loading").hidden = !app.loading;
  byId("community-unconfigured").hidden = app.loading || online || app.configError !== "unconfigured";
  byId("community-unavailable").hidden = app.loading || online || app.configError !== "unavailable";
  byId("community-invalid").hidden = app.loading || !invalid;
  byId("community-notfound").hidden = app.loading || invalid || !online || app.preview !== null || Boolean(app.loadError);
  byId("community-error").hidden = !app.loadError || app.loading;
  byId("community-error-text").textContent = app.loadError ?? "";
  const found = online && !app.loading && app.preview && !invalid;
  byId("community-body").hidden = !found;
  if (!found) return;
  const member = Boolean(app.membership);
  const feed = route.view === "feed";
  byId("community-title").hidden = !feed; byId("community-purpose").hidden = !feed;
  byId("community-title").textContent = app.preview.title;
  byId("community-purpose").textContent = app.preview.description;
  byId("community-head").classList.toggle("compact", !feed);
  const link = byId("community-link");
  link.textContent = feed ? "" : app.preview.title; link.hidden = feed; link.href = `#/community/${app.communityId}`;
  byId("community-demo-badge").hidden = !app.preview.isDemo;
  byId("community-count").textContent = plural(app.preview.memberCount, "member");
  byId("join-panel").hidden = member;
  byId("member-area").hidden = !member;
  renderJoin();
  renderConnection();
  if (member) {
    renderCrumbs();
    for (const view of VIEWS) byId(`view-${view}`).hidden = view !== route.view;
    if (feed) renderFeedView(); else renderMissionView(route.view);
  }
  restoreFocus(saved);
}

function renderJoin() {
  const form = byId("join-form");
  const input = byId("join-name");
  if (!input.value && !form.dataset.touched) input.value = store.get(NAME_KEY) ?? "";
  const route = app.route;
  byId("join-heading").textContent = route.view === "mission" ? "Join the community to see this mission" : route.view === "publish" ? "Join to share a campaign" : "Join to read and post";
  byId("join-button").disabled = joining;
  byId("join-button").textContent = joining ? "Joining…" : "Join the conversation";
  byId("join-error").hidden = !joinError;
  byId("join-error").textContent = joinError;
}

function renderConnection() {
  const node = byId("community-connection");
  if (!app.membership) { node.hidden = true; return; }
  node.hidden = false;
  const labels = { live: ["Live", "Updates from other members appear here automatically."], reconnecting: ["Reconnecting…", "Live updates paused. Trying again; what you see may be out of date."], connecting: ["Connecting…", "Setting up live updates."], idle: ["Offline", "Live updates are off."] };
  const [label, detail] = labels[app.connection] ?? labels.idle;
  node.dataset.state = app.connection;
  node.textContent = "";
  node.append(el("span", "dot"), el("strong", "", label), el("span", "visually-hidden", ` ${detail}`));
  node.title = detail;
}

function renderCrumbs() {
  const nav = byId("crumbs");
  const route = app.route;
  nav.hidden = route.view === "feed";
  if (nav.hidden) return;
  const items = [["Community", `#/community/${app.communityId}`]];
  if (route.view !== "missions") items.push(["Missions", `#/community/${app.communityId}/missions`]);
  const current = route.view === "missions" ? "Missions" : route.view === "new" ? "Start a mission" : route.view === "publish" ? "Share a campaign" : (app.missions.find(item => item.id === route.missionId)?.title ?? "Mission");
  if (route.view === "missions") items.length = 1;
  const list = el("ol");
  for (const [label, href] of items) { const li = el("li"); const a = el("a", "", label); a.href = href; li.append(a); list.append(li); }
  const last = el("li", "", current); last.setAttribute("aria-current", "page"); list.append(last);
  nav.replaceChildren(list);
}

// ---------- feed view ----------

function renderFeedView() {
  const feed = byId("feed");
  const count = renderThreads(feed, app.posts, { linkMissions: true, offerMission: true });
  byId("feed-empty").hidden = count > 0;
  byId("feed-heading-count").textContent = String(app.posts.length);
  renderComposer();
  renderSide();
}

function renderComposer() {
  const host = byId("composer");
  const saved = captureFocus();
  const form = textForm({
    key: "new", fieldId: "composer-body", label: "Share an update, question or idea with your neighbors", rows: 3, submitLabel: "Post", placeholder: "What is happening on your block?",
    onSubmit: () => sendDraft("new", (body, operationId) => app.api.createPost({ communityId: app.communityId, body, operationId }), { onDone: () => byId("feed-end")?.scrollIntoView({ block: "nearest" }) })
  });
  form.querySelector("button[type=submit]").id = "composer-submit";
  host.replaceChildren(form);
  restoreFocus(saved);
}

function renderSide() {
  const mini = byId("mission-mini");
  const active = app.missions.filter(mission => mission.status !== "archived").slice(0, 3);
  byId("mission-mini-empty").hidden = active.length > 0;
  mini.replaceChildren(...active.map(mission => {
    const item = el("li");
    const link = el("a", "", mission.title); link.href = missionHash(app.communityId, mission.id);
    const progress = missionProgress(tasksFor(mission.id));
    item.append(link, el("span", "mini-meta", `${MISSION_STATUSES[mission.status]} · ${progress.done}/${progress.total} jobs done`));
    return item;
  }));
  byId("mission-all-link").href = `#/community/${app.communityId}/missions`;
  byId("mission-new-link").href = newMissionHash(app.communityId);
  byId("member-list").replaceChildren(...app.members.map(member => {
    const item = el("li");
    item.append(el("span", "member-name", member.displayName));
    if (member.userId === app.userId) item.append(el("span", "badge", "you"));
    if (member.userId === app.community?.moderatorId) item.append(el("span", "badge badge-demo", "moderator"));
    return item;
  }));
  byId("member-heading-count").textContent = String(app.members.length);
  const mine = app.members.find(member => member.userId === app.userId);
  const rename = byId("rename-input");
  if (!rename.dataset.touched && mine) rename.value = mine.displayName;
  byId("rename-note").textContent = renameNote;
  byId("rename-note").hidden = !renameNote;
  byId("leave-error").textContent = leaveError;
  byId("leave-error").hidden = !leaveError;
}

// ---------- wiring ----------

byId("join-form").addEventListener("submit", async event => {
  event.preventDefault();
  if (joining) return;
  const name = cleanDisplayName(byId("join-name").value);
  if (!name.ok) { joinError = name.error; render(); byId("join-name").focus(); return; }
  joining = true; joinError = ""; render();
  try {
    await joinCommunity(name.value);
    joining = false;
    render();
    const target = byId("composer-body");
    if (app.route.view === "feed" && target) target.focus();
  } catch (error) { joining = false; joinError = describeError(error); render(); }
});
byId("join-name").addEventListener("input", () => { byId("join-form").dataset.touched = "1"; });
byId("rename-form").addEventListener("submit", async event => {
  event.preventDefault();
  const name = cleanDisplayName(byId("rename-input").value);
  if (!name.ok) { renameNote = name.error; render(); return; }
  try {
    await app.api.joinCommunity(app.communityId, name.value);
    store.set(NAME_KEY, name.value);
    renameNote = "Name updated. Earlier posts keep the name they were posted under.";
    await load({ quiet: true });
  } catch (error) { renameNote = describeError(error); render(); }
});
byId("rename-input").addEventListener("input", () => { byId("rename-input").dataset.touched = "1"; });
byId("leave-button").addEventListener("click", () => { byId("leave-confirm").hidden = false; byId("leave-button").hidden = true; byId("leave-yes").focus(); });
byId("leave-no").addEventListener("click", () => { byId("leave-confirm").hidden = true; byId("leave-button").hidden = false; byId("leave-button").focus(); });
byId("leave-yes").addEventListener("click", async () => {
  byId("leave-confirm").hidden = true; byId("leave-button").hidden = false;
  leaveError = "";
  try { await leaveCommunity(); } catch (error) { leaveError = describeError(error); render(); }
});
byId("community-retry").addEventListener("click", () => { app.configError = null; app.loadError = null; void load(); });

onChange(render);
applyRoute();
