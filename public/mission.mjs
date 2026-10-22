// Missions: list, mission detail with jobs/discussion/export, start-a-mission form, and publishing a reviewed local campaign.
import { cleanBody, describeError, toCommunityError } from "/lib/community.mjs";
import { formatSourceDate, sourceRecordUrl } from "/lib/block-ops.mjs";
import {
  MISSION_STATUSES, MISSION_LIMITS, POST_KINDS, NO_RECORDS_LINE, buildMissionMarkdown, cleanMissionFields, isLocalOrigin, missionHash, missionProgress, newMissionHash, parseTaskLines, publishPayloadFromCampaign
} from "/lib/mission.mjs";
import { recurrenceHeadline, areaRecurrence } from "/lib/recurrence.mjs";
import { OBSERVATION_KINDS } from "/lib/campaign.mjs";
import { createCampaignStorage } from "/storage.mjs";
import { renderThreads } from "/posts.mjs";
import {
  announce, app, byId, clearDraft, dayFormat, el, emit, errorFor, focusKey, getDraft, go, hasDraft, isMissionMember, isOrganizer, isSending, membersFor, missionById, plural,
  refreshSoon, sendDraft, setDraft, setError, store, tasksFor, textForm, timeFormat
} from "/shell.mjs";
import { newOperationId } from "/lib/community.mjs";

const ui = { openDetails: new Set(), editOpen: new Set(), editBase: new Map(), conflict: new Set(), busy: new Set(), taskErrors: new Map(), actionErrors: new Map(), exportNote: new Map(), copied: false, leaveConfirm: null, creating: false, createError: "", createFieldErrors: {}, publishing: false, publishError: "", publishFieldErrors: {} };
// emit() renders synchronously, so focus can move right away (keyboard and scripted input both rely on it).
const afterRender = fn => fn();
const shortDay = value => new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "America/New_York" }).format(new Date(value));
const todayLocal = () => new Date().toLocaleDateString("en-CA");

export function renderMissionView(view) {
  if (view === "missions") renderList();
  else if (view === "mission") renderDetail();
  else if (view === "new") renderNew();
  else if (view === "publish") renderPublish();
}

// ---------- small form helpers (all text is a persisted draft) ----------

function draftField({ key, label, type = "text", rows = 0, hint = "", error = "", placeholder = "", maxLength = 0, required = false, fallback = "" }) {
  const id = `f-${key.replace(/[^a-z0-9]/gi, "-")}`;
  const wrap = el("div", "field-block");
  const lab = el("label", "field-label", label);
  lab.htmlFor = id;
  if (required) lab.append(el("span", "optional", " required"));
  const input = rows ? el("textarea") : el("input");
  input.id = id; input.dataset.focusKey = key; input.placeholder = placeholder;
  if (rows) input.rows = rows; else input.type = type;
  if (maxLength) input.maxLength = maxLength;
  input.value = hasDraft(key) ? getDraft(key) : fallback;
  const described = [];
  if (hint) { described.push(`${id}-hint`); }
  if (error) { described.push(`${id}-err`); input.setAttribute("aria-invalid", "true"); }
  if (described.length) input.setAttribute("aria-describedby", described.join(" "));
  input.addEventListener("input", () => setDraft(key, input.value));
  wrap.append(lab, input);
  if (hint) { const h = el("p", "field-hint", hint); h.id = `${id}-hint`; wrap.append(h); }
  if (error) { const e = el("p", "form-error", error); e.id = `${id}-err`; wrap.append(e); }
  return wrap;
}
// A re-render (live update) must not close a disclosure the user opened.
function rememberOpen(details, key) {
  if (ui.openDetails.has(key)) details.open = true;
  // Record the new state on the summary's click (synchronous) rather than the async "toggle" event, so a live re-render
  // that lands right after the click cannot close what the user just opened.
  details.addEventListener("click", event => {
    if (event.target.closest("summary")?.parentElement !== details) return;
    if (details.open) ui.openDetails.delete(key); else ui.openDetails.add(key);
  });
  return details;
}
const heading = (tag, text, className = "") => el(tag, className, text);
const button = (text, handler, className = "button button-secondary", focus = "") => {
  const node = el("button", className, text);
  node.type = "button";
  if (focus) node.dataset.focusKey = focus;
  node.addEventListener("click", handler);
  return node;
};
const statusChip = status => el("span", `badge status-${status}`, MISSION_STATUSES[status]);
const when = value => (value ? dayFormat.format(new Date(value)) : "");
const localInputValue = iso => { if (!iso) return ""; const d = new Date(iso); const p = n => String(n).padStart(2, "0"); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`; };

function progressLine(tasks) {
  const progress = missionProgress(tasks);
  return progress.total ? `${progress.done} of ${plural(progress.total, "job")} done · ${progress.claimed} claimed · ${progress.open} open` : "No jobs yet";
}

// ---------- mission list ----------

function renderList() {
  const host = byId("view-missions");
  const missions = [...app.missions].sort((left, right) => (left.status === "archived") - (right.status === "archived") || right.createdAt.localeCompare(left.createdAt));
  const active = missions.filter(mission => mission.status !== "archived");
  const archived = missions.filter(mission => mission.status === "archived");
  const top = el("div", "page-head");
  const title = heading("h1", "Missions");
  const actions = el("div", "page-actions");
  const start = el("a", "button button-primary", "Start a mission"); start.href = newMissionHash(app.communityId);
  const map = el("a", "button button-secondary", "Share a map campaign"); map.href = "#/map";
  actions.append(start, map);
  top.append(title, actions);
  const intro = el("p", "field-hint", "A mission is a shared effort with a place, a goal, an organizer and jobs people can claim. Discuss first in the conversation, then start a mission from a post, or share a reviewed campaign from the map.");
  const card = mission => {
    const item = el("li", "mission-card");
    const head = el("div", "card-head");
    const link = el("a", "mission-title", mission.title); link.href = missionHash(app.communityId, mission.id);
    head.append(link, statusChip(mission.status));
    if (mission.origin === "local_campaign") head.append(el("span", "badge", mission.source?.mode === "demo" ? "With records (fictional)" : "With 311 records"));
    if (isMissionMember(mission.id)) head.append(el("span", "badge", "You're in"));
    const meta = el("p", "card-meta", `Organized by ${mission.organizerName} · ${mission.location}${mission.startsAt ? ` · ${when(mission.startsAt)}` : ""}`);
    const goal = el("p", "card-objective", mission.objective.length > 160 ? `${[...mission.objective].slice(0, 160).join("")}…` : mission.objective);
    const progress = el("p", "card-meta", `${progressLine(tasksFor(mission.id))} · ${plural(membersFor(mission.id).length, "participant")}`);
    item.append(head, meta, goal, progress);
    return item;
  };
  const list = el("ul", "mission-list");
  list.append(...active.map(card));
  const empty = el("p", "empty-message", "No active missions yet. Start one from a conversation post, or bring a reviewed campaign from the map. Nothing here is sample data.");
  empty.hidden = active.length > 0;
  const nodes = [top, intro, list, empty];
  if (archived.length) {
    const details = el("details", "archived");
    details.append(el("summary", "", `Archived missions (${archived.length})`));
    const olist = el("ul", "mission-list"); olist.append(...archived.map(card));
    details.append(olist);
    nodes.push(details);
  }
  host.replaceChildren(...nodes);
}

// ---------- mission detail ----------

function renderDetail() {
  const host = byId("view-mission");
  const mission = missionById(app.route.missionId);
  if (!mission) {
    const box = el("section", "community-card");
    box.append(heading("h1", "That mission is not available"), el("p", "", app.loading ? "Loading…" : "It may have been removed, or the link may be wrong."));
    const back = el("a", "button button-secondary", "All missions"); back.href = `#/community/${app.communityId}/missions`;
    box.append(back);
    host.replaceChildren(box);
    return;
  }
  const tasks = tasksFor(mission.id);
  const members = membersFor(mission.id);
  const member = isMissionMember(mission.id);
  const organizer = isOrganizer(mission);
  const archived = mission.status === "archived";

  const header = el("header", "mission-head");
  const chips = el("p", "tag");
  chips.append(statusChip(mission.status), document.createTextNode(" "), el("span", "", mission.origin === "local_campaign" ? (mission.source?.mode === "demo" ? "Shared from a campaign · fictional records" : "Shared from a reviewed campaign") : "Started from a discussion"));
  const h1 = heading("h1", mission.title); h1.id = "mission-title"; h1.tabIndex = -1;
  const facts = el("dl", "facts");
  const fact = (term, value) => { const wrap = el("div"); wrap.append(el("dt", "", term), el("dd", "", value)); facts.append(wrap); };
  fact("Organizer", mission.organizerName); fact("Where", mission.location); fact("When", mission.startsAt ? when(mission.startsAt) : "No time set"); fact("Progress", progressLine(tasks));
  const goal = el("p", "mission-goal", mission.objective);
  header.append(chips, h1, goal, facts);

  const actions = el("div", "mission-actions");
  actions.append(...membershipControls(mission, member, organizer, archived));
  const exportBtn = button("Download current plan", () => exportPlan(mission), "button button-secondary", `export:${mission.id}`);
  actions.append(exportBtn);
  const note = el("p", "field-hint", ui.exportNote.get(mission.id) ?? ""); note.setAttribute("role", "status"); note.hidden = !ui.exportNote.get(mission.id);
  const err = ui.actionErrors.get(mission.id);
  const problem = el("p", "form-error", err ?? ""); problem.setAttribute("role", "alert"); problem.hidden = !err;

  const nodes = [header, actions, problem, note, shareBox(mission), jobsSection(mission, tasks, member, organizer, archived), participantsSection(mission, members, member), discussionSection(mission, member, archived), evidenceSection(mission)];
  if (organizer) nodes.push(editSection(mission));
  host.replaceChildren(...nodes);
}

function membershipControls(mission, member, organizer, archived) {
  const out = [];
  if (!member) {
    const join = button(ui.busy.has(`join:${mission.id}`) ? "Joining…" : "Join this mission", () => missionAction(`join:${mission.id}`, mission.id, () => app.api.joinMission(mission.id), "You joined the mission. You can now claim a job."), "button button-primary", `join:${mission.id}`);
    join.disabled = archived || ui.busy.has(`join:${mission.id}`);
    out.push(join);
    if (archived) out.push(el("span", "field-hint", "This mission is archived, so no one can join."));
    return out;
  }
  if (ui.leaveConfirm === mission.id) {
    const box = el("div", "hide-confirm");
    box.append(el("p", "", "Leave this mission? Jobs you claimed that are not done will be released. Jobs you finished keep your name."));
    box.append(button("Leave mission", () => { ui.leaveConfirm = null; void missionAction(`leave:${mission.id}`, mission.id, () => app.api.leaveMission(mission.id), "You left the mission."); }, "button button-primary", `leave-yes:${mission.id}`),
      button("Stay", () => { ui.leaveConfirm = null; emit(); afterRender(() => focusKey(`leave:${mission.id}`)); }, "button button-quiet"));
    out.push(box);
  } else {
    const leave = button("Leave mission", () => { ui.leaveConfirm = mission.id; emit(); afterRender(() => focusKey(`leave-yes:${mission.id}`)); }, "button button-quiet", `leave:${mission.id}`);
    if (organizer && !archived) { leave.disabled = true; leave.title = "Archive the mission before leaving it."; out.push(leave, el("span", "field-hint", "You organize this mission. Archive it (below) before leaving.")); }
    else out.push(leave);
  }
  return out;
}

async function missionAction(busyKey, missionId, run, success) {
  if (ui.busy.has(busyKey)) return;
  ui.busy.add(busyKey); ui.actionErrors.delete(missionId); emit();
  try {
    await run();
    if (success) announce(success);
  } catch (error) {
    const message = describeError(error);
    ui.actionErrors.set(missionId, message);
    announce(message);
  }
  ui.busy.delete(busyKey);
  refreshSoon();
  await refreshNow();
}

async function refreshNow() {
  try {
    const id = app.communityId;
    const [missions, missionMembers, tasks] = await Promise.all([app.api.listMissions(id), app.api.listMissionMembers(id), app.api.listTasks(id)]);
    if (id === app.communityId) Object.assign(app, { missions, missionMembers, tasks });
  } catch { /* the safety refresh will retry */ }
  emit();
}

// ---------- share link and QR ----------

function shareUrl(mission) { return `${location.origin}${location.pathname}${missionHash(app.communityId, mission.id)}`; }

function qrSvg(text) {
  const generator = window.qrcode;
  if (typeof generator !== "function") return el("p", "field-hint", "QR code unavailable in this browser.");
  const qr = generator(0, "M");
  qr.addData(text); qr.make();
  const n = qr.getModuleCount(), quiet = 4, size = n + quiet * 2;
  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("viewBox", `0 0 ${size} ${size}`); svg.setAttribute("role", "img"); svg.setAttribute("aria-label", `QR code for ${text}`); svg.setAttribute("class", "qr");
  const back = document.createElementNS(ns, "rect"); back.setAttribute("width", size); back.setAttribute("height", size); back.setAttribute("fill", "#fff"); svg.append(back);
  let d = "";
  for (let row = 0; row < n; row += 1) for (let col = 0; col < n; col += 1) if (qr.isDark(row, col)) d += `M${col + quiet} ${row + quiet}h1v1h-1z`;
  const path = document.createElementNS(ns, "path"); path.setAttribute("d", d); path.setAttribute("fill", "#302338"); svg.append(path);
  return svg;
}

function shareBox(mission) {
  const url = shareUrl(mission);
  const details = el("details", "share-box");
  details.dataset.focusKey = `share:${mission.id}`;
  rememberOpen(details, `share:${mission.id}`);
  details.append(el("summary", "", "Share this mission: link and QR code"));
  const row = el("div", "inline-form");
  const input = el("input"); input.type = "text"; input.readOnly = true; input.value = url; input.setAttribute("aria-label", "Mission link");
  input.addEventListener("focus", () => input.select());
  const copy = button(ui.copied ? "Copied" : "Copy link", async () => {
    try { await navigator.clipboard.writeText(url); ui.copied = true; announce("Link copied."); } catch { input.select(); ui.copied = false; announce("Press Ctrl+C to copy the selected link."); }
    emit(); setTimeout(() => { ui.copied = false; emit(); }, 2500);
  }, "button button-secondary");
  row.append(input, copy);
  details.append(row);
  if (isLocalOrigin(url)) details.append(el("p", "form-error", "This link points at this computer (localhost). It works for another browser on this computer, but a phone elsewhere cannot open it. A public address is not set up yet, so do not rely on the QR code for a phone on another network."));
  details.append(qrSvg(url));
  return details;
}

// ---------- jobs ----------

function jobsSection(mission, tasks, member, organizer, archived) {
  const section = el("section", "mission-section"); section.setAttribute("aria-labelledby", "jobs-h");
  const h = heading("h2", "Jobs", "section-h"); h.id = "jobs-h"; h.append(el("span", "count-badge", ` ${tasks.length}`));
  section.append(h);
  if (!member && !archived) section.append(el("p", "field-hint", "Join the mission to claim a job."));
  const list = el("ul", "task-list jobs");
  for (const task of tasks) list.append(jobRow(task, mission, member, organizer, archived));
  section.append(list);
  if (!tasks.length) section.append(el("p", "empty-message", organizer ? "No jobs yet. Add the first one below." : "The organizer has not added jobs yet."));
  if (organizer && !archived) section.append(addJobForm(mission));
  return section;
}

function jobRow(task, mission, member, organizer, archived) {
  const item = el("li", `task${task.done ? " is-done" : ""}`);
  item.dataset.taskId = task.id;
  const mine = app.userId != null && task.claimedBy === app.userId;
  const text = el("div", "task-text");
  text.append(el("strong", "", task.description));
  const meta = [];
  if (task.due) meta.push(`due ${task.due}`);
  if (task.imported) meta.push("imported from a campaign (it started unclaimed)");
  if (meta.length) text.append(el("span", "task-meta", meta.join(" · ")));
  const status = el("p", "task-status");
  if (task.done) status.textContent = `✓ Done · reported by ${task.claimedName ?? "someone"}${task.doneAt ? ` · ${timeFormat.format(new Date(task.doneAt))}` : ""}`;
  else if (task.claimedName) status.textContent = mine ? "You claimed this job" : `Claimed by ${task.claimedName}`;
  else status.textContent = "Unclaimed";
  status.dataset.state = task.done ? "done" : task.claimedName ? "claimed" : "open";
  const bar = el("div", "task-actions");
  const busy = ui.busy.has(`task:${task.id}`);
  const act = (label, run, success, primary = false) => {
    const node = button(busy ? "Working…" : label, () => taskAction(task, run, success), primary ? "button button-primary" : "button button-quiet", bar.children.length ? "" : `task:${task.id}`);
    node.disabled = busy; node.setAttribute("aria-label", `${label}: ${task.description}`);
    bar.append(node);
  };
  if (!archived) {
    if (!task.claimedName) { if (member) act("Claim this job", () => app.api.claimTask(task.id), "You claimed the job.", true); }
    else if (task.done) { if (mine || organizer) act("Mark not done", () => app.api.setTaskDone(task.id, false), "Job marked not done."); }
    else {
      if (mine || organizer) act("Mark done", () => app.api.setTaskDone(task.id, true), "Job marked done.", true);
      if (mine || organizer) act(mine ? "Release job" : "Release (organizer)", () => app.api.releaseTask(task.id), "Job released.");
    }
  }
  const error = ui.taskErrors.get(task.id);
  const problem = el("p", "form-error", error ?? ""); problem.setAttribute("role", "alert"); problem.hidden = !error;
  item.append(text, status, bar, problem);
  return item;
}

async function taskAction(task, run, success) {
  const key = `task:${task.id}`;
  if (ui.busy.has(key)) return;
  ui.busy.add(key); ui.taskErrors.delete(task.id); emit();
  try {
    const updated = await run();
    app.tasks = app.tasks.map(item => item.id === updated.id ? updated : item);
    announce(success);
  } catch (error) {
    const known = toCommunityError(error);
    const message = describeError(known);
    const shown = known.code === "already_claimed" ? "Someone else claimed this job first. The list now shows who has it." : message;
    ui.taskErrors.set(task.id, shown);
    announce(shown);
    // A conflict message is about a moment; clear it once it has been read so it never contradicts the list.
    setTimeout(() => { if (ui.taskErrors.get(task.id) === shown) { ui.taskErrors.delete(task.id); emit(); } }, 8000);
  }
  ui.busy.delete(key);
  await refreshNow();
  afterRender(() => focusKey(key));
}

function addJobForm(mission) {
  const form = el("form", "mini-form");
  form.noValidate = true;
  const descKey = `job:${mission.id}:desc`, dueKey = `job:${mission.id}:due`;
  const error = ui.actionErrors.get(`job:${mission.id}`) ?? "";
  form.append(draftField({ key: descKey, label: "New job", placeholder: "Bring gloves and bags", error, maxLength: 0 }));
  form.append(draftField({ key: dueKey, label: "Due (optional)", type: "date" }));
  const submit = el("button", "button button-secondary", ui.busy.has(`addjob:${mission.id}`) ? "Adding…" : "Add job"); submit.type = "submit"; submit.disabled = ui.busy.has(`addjob:${mission.id}`);
  form.append(submit);
  form.addEventListener("submit", async event => {
    event.preventDefault();
    const description = getDraft(descKey).trim();
    if (!description) { ui.actionErrors.set(`job:${mission.id}`, "Describe the job first."); emit(); return; }
    if ([...description].length > MISSION_LIMITS.task) { ui.actionErrors.set(`job:${mission.id}`, `A job can be up to ${MISSION_LIMITS.task} characters.`); emit(); return; }
    ui.busy.add(`addjob:${mission.id}`); ui.actionErrors.delete(`job:${mission.id}`); emit();
    try {
      await app.api.addTask({ missionId: mission.id, description, due: getDraft(dueKey) || null });
      clearDraft(descKey); clearDraft(dueKey); announce("Job added.");
    } catch (failure) { ui.actionErrors.set(`job:${mission.id}`, describeError(failure)); }
    ui.busy.delete(`addjob:${mission.id}`);
    await refreshNow();
    afterRender(() => focusKey(descKey));
  });
  return form;
}

// ---------- participants, discussion ----------

function participantsSection(mission, members, member) {
  const section = el("section", "mission-section"); section.setAttribute("aria-labelledby", "people-h");
  const h = heading("h2", "Participants", "section-h"); h.id = "people-h"; h.append(el("span", "count-badge", ` ${members.length}`));
  const list = el("ul", "member-list");
  for (const item of members) {
    const li = el("li"); li.append(el("span", "member-name", item.displayName));
    if (item.userId === mission.organizerId) li.append(el("span", "badge badge-demo", "organizer"));
    if (item.userId === app.userId) li.append(el("span", "badge", "you"));
    list.append(li);
  }
  section.append(h, list, el("p", "field-hint", "These are accounts that joined the mission, not verified residents."));
  return section;
}

function discussionSection(mission, member, archived) {
  const section = el("section", "mission-section"); section.setAttribute("aria-labelledby", "talk-h");
  const h = heading("h2", "Discussion, progress and follow-up", "section-h"); h.id = "talk-h";
  section.append(h, el("p", "field-hint", "Progress updates are what participants say they did. Site observations are dated notes about conditions. Neither changes the city's ticket status."));
  const posts = app.missionPostsFor === mission.id ? app.missionPosts : null;
  if (posts === null) { section.append(el("p", "empty-message", "Loading the discussion…")); return section; }
  const list = el("ol", "feed"); list.setAttribute("aria-label", "Mission discussion, oldest first"); list.id = "mission-feed";
  const count = renderThreads(list, posts, { missionId: mission.id });
  section.append(list);
  if (!count) section.append(el("p", "empty-message", "Nothing posted here yet."));
  if (archived) { section.append(el("p", "field-hint", "This mission is archived, so the discussion is read-only.")); return section; }
  // composer: kind, optional observation date and fictional flag are drafts like the text
  const kindKey = `mp:${mission.id}:kind`, dateKey = `mp:${mission.id}:date`, fictKey = `mp:${mission.id}:fict`, textKey = `mp:${mission.id}:text`;
  const kind = getDraft(kindKey) || "discussion";
  const extra = el("div", "composer-extra");
  const kindWrap = el("div", "field-block");
  const klabel = el("label", "field-label", "Type of post"); klabel.htmlFor = "mp-kind";
  const select = el("select"); select.id = "mp-kind"; select.dataset.focusKey = kindKey;
  for (const [value, label] of Object.entries(POST_KINDS)) { const option = el("option", "", label); option.value = value; option.disabled = value !== "discussion" && !member; select.append(option); }
  select.value = member || kind === "discussion" ? kind : "discussion";
  select.addEventListener("change", () => { setDraft(kindKey, select.value); emit(); });
  kindWrap.append(klabel, select);
  if (!member) kindWrap.append(el("p", "field-hint", "Join the mission to post progress updates or site observations."));
  extra.append(kindWrap);
  if (select.value === "observation") {
    const dateWrap = el("div", "field-block");
    const dlabel = el("label", "field-label", "Date observed"); dlabel.htmlFor = "mp-date";
    const date = el("input"); date.type = "date"; date.id = "mp-date"; date.value = getDraft(dateKey) || todayLocal(); date.dataset.focusKey = dateKey;
    if (!getDraft(dateKey)) setDraft(dateKey, date.value);
    date.addEventListener("input", () => setDraft(dateKey, date.value));
    dateWrap.append(dlabel, date);
    const fict = el("label", "check-line check-fictional");
    const box = el("input"); box.type = "checkbox"; box.checked = getDraft(fictKey) !== "0"; box.dataset.focusKey = fictKey;
    box.addEventListener("change", () => setDraft(fictKey, box.checked ? "1" : "0"));
    const words = el("span"); words.append(el("strong", "", "Fictional practice entry"), document.createTextNode(" · labeled FICTIONAL for everyone. Uncheck only for a real observation by you."));
    fict.append(box, words);
    extra.append(dateWrap, fict);
  }
  const label = select.value === "update" ? "Post a progress update" : select.value === "observation" ? "Record a dated site observation" : "Write in this mission's discussion";
  section.append(textForm({
    key: textKey, fieldId: "mission-composer", label, rows: 3, submitLabel: select.value === "discussion" ? "Post" : "Post " + POST_KINDS[select.value].toLowerCase(), extra,
    onSubmit: () => sendDraft(textKey, (body, operationId) => {
      const chosen = member ? (getDraft(kindKey) || "discussion") : "discussion";
      return app.api.createPost({ communityId: app.communityId, missionId: mission.id, kind: chosen, observedOn: chosen === "observation" ? (getDraft(dateKey) || todayLocal()) : null, fictional: chosen === "observation" ? getDraft(fictKey) !== "0" : false, body, operationId });
    })
  }));
  return section;
}

// ---------- evidence ----------

function evidenceSection(mission) {
  const section = el("section", "mission-section"); section.setAttribute("aria-labelledby", "records-h");
  const h = heading("h2", "Official 311 records", "section-h"); h.id = "records-h";
  section.append(h);
  if (!mission.evidence.length) {
    section.append(el("p", "no-records", NO_RECORDS_LINE), el("p", "field-hint", "This mission started from a discussion, so it has no official records to show. Nothing here reports a city ticket status."));
    return section;
  }
  const source = mission.source;
  const details = el("details", "evidence-box");
  rememberOpen(details, `evidence:${mission.id}`);
  details.append(el("summary", "", `${plural(mission.evidence.length, "record")} shared from a reviewed campaign (inspect)`));
  details.append(el("p", "field-hint", source?.mode === "demo" ? "Fictional demonstration records; not city data."
    : `${source?.mode === "recorded" ? "Recorded DC 311 snapshot (real data, not live)" : "DC 311 snapshot"}${source?.retrievedAt ? `, retrieved ${new Date(source.retrievedAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}` : ""}${source?.window?.start ? ` · query window ${source.window.start} to ${source.window.endExclusive} (exclusive)` : ""}. The organizer's group reviewed these before sharing${source?.reviewedAt ? ` (${new Date(source.reviewedAt).toLocaleDateString("en-US", { dateStyle: "medium" })})` : ""}; excluded reports were not shared.`));
  const stat = areaRecurrence(mission.evidence);
  details.append(el("p", "headline", recurrenceHeadline(stat, shortDay)), el("p", "caveat", recurrenceHeadline.caveat));
  const list = el("ul", "evidence-list");
  for (const record of [...mission.evidence].sort((a, b) => String(a.date).localeCompare(String(b.date)))) {
    const li = el("li", "evidence-row");
    li.append(el("strong", "", record.address ?? "Address unavailable"));
    li.append(el("span", "task-meta", `${formatSourceDate(record.date)} · ${record.status ?? "Status unavailable"} · request ${record.id ?? "unavailable"}${record.outsideWard ? " · map point outside the Ward 8 boundary" : ""}`));
    const url = sourceRecordUrl(record, source?.mode);
    if (url) { const a = el("a", "", "Original source record"); a.href = url; a.rel = "noopener noreferrer"; a.target = "_blank"; li.append(a); }
    list.append(li);
  }
  details.append(list, el("p", "field-hint", "The city's ticket status, the group's job progress and dated site observations are separate facts. Group progress never changes a city status."));
  section.append(details);
  return section;
}

// ---------- organizer edit (version-checked) ----------

function editSection(mission) {
  const details = el("details", "edit-box"); details.dataset.focusKey = `edit-details:${mission.id}`;
  rememberOpen(details, `edit:${mission.id}`);
  details.append(el("summary", "", "Organizer: edit details and status"));
  // The version an edit is based on is the one on screen when the organizer started typing. Until then it follows the live mission;
  // once any field has a draft it is frozen, so a change made elsewhere meanwhile is detected on save instead of overwritten.
  const k = name => `edit:${mission.id}:${name}`;
  const dirty = ["title", "objective", "location", "when", "status"].some(name => hasDraft(k(name)));
  if (!dirty || !ui.editBase.has(mission.id)) ui.editBase.set(mission.id, { version: mission.version, title: mission.title, objective: mission.objective, location: mission.location, startsAt: mission.startsAt, status: mission.status });
  const base = ui.editBase.get(mission.id);
  const value = name => (hasDraft(k(name)) ? getDraft(k(name)) : { title: base.title, objective: base.objective, location: base.location, when: localInputValue(base.startsAt), status: base.status }[name]);
  const form = el("form", "mini-form"); form.noValidate = true;
  const errors = ui.actionErrors.get(`edit:${mission.id}`);
  if (ui.conflict.has(mission.id)) {
    const box = el("div", "form-error conflict"); box.setAttribute("role", "alert");
    box.append(document.createTextNode("Someone else changed this mission after you started editing. The latest version is shown above; your edits are still here. Review them, then apply them on top of the latest version."));
    box.append(document.createTextNode(" "), button("Apply my edits to the latest version", () => { ui.editBase.set(mission.id, { ...base, version: mission.version }); ui.conflict.delete(mission.id); ui.actionErrors.delete(`edit:${mission.id}`); emit(); afterRender(() => focusKey(`edit-save:${mission.id}`)); }, "button button-secondary", `edit-resolve:${mission.id}`));
    form.append(box);
  } else if (errors) { const p = el("p", "form-error", errors); p.setAttribute("role", "alert"); form.append(p); }
  form.append(draftField({ key: k("title"), label: "Title", required: true, fallback: base.title }), draftField({ key: k("objective"), label: "Goal", rows: 3, required: true, fallback: base.objective }), draftField({ key: k("location"), label: "Public location", required: true, fallback: base.location }), draftField({ key: k("when"), label: "Date and time (optional)", type: "datetime-local", fallback: localInputValue(base.startsAt) }));
  const statusWrap = el("div", "field-block"); const sl = el("label", "field-label", "Status"); sl.htmlFor = "edit-status";
  const select = el("select"); select.id = "edit-status"; select.dataset.focusKey = k("status");
  for (const [value, label] of Object.entries(MISSION_STATUSES)) { const o = el("option", "", label); o.value = value; select.append(o); }
  select.value = value("status");
  select.addEventListener("change", () => setDraft(k("status"), select.value));
  statusWrap.append(sl, select, el("p", "field-hint", "Status is the organizer's statement of where the effort stands. Archive a mission before leaving it; archiving makes it read-only."));
  form.append(statusWrap);
  const save = el("button", "button button-primary", ui.busy.has(`edit:${mission.id}`) ? "Saving…" : "Save changes"); save.type = "submit"; save.dataset.focusKey = `edit-save:${mission.id}`; save.disabled = ui.busy.has(`edit:${mission.id}`);
  form.append(save);
  form.addEventListener("submit", async event => {
    event.preventDefault();
    const fields = cleanMissionFields({ title: value("title"), objective: value("objective"), location: value("location"), startsAt: value("when") });
    if (!fields.ok) { ui.actionErrors.set(`edit:${mission.id}`, Object.values(fields.errors).join(" ")); emit(); return; }
    ui.busy.add(`edit:${mission.id}`); ui.actionErrors.delete(`edit:${mission.id}`); emit();
    try {
      await app.api.updateMission({ missionId: mission.id, expectedVersion: base.version, changes: { title: fields.value.title, objective: fields.value.objective, location: fields.value.location, starts_at: fields.value.startsAt ?? "", status: value("status") } });
      for (const name of ["title", "objective", "location", "when", "status"]) clearDraft(k(name));
      ui.editBase.delete(mission.id); ui.editOpen.delete(mission.id); ui.conflict.delete(mission.id); announce("Mission updated.");
    } catch (failure) {
      const known = toCommunityError(failure);
      if (known.code === "version_conflict") ui.conflict.add(mission.id); else ui.actionErrors.set(`edit:${mission.id}`, describeError(known));
    }
    ui.busy.delete(`edit:${mission.id}`);
    await refreshNow();
  });
  details.append(form);
  return details;
}

async function exportPlan(mission) {
  ui.exportNote.set(mission.id, "Reading the current shared state…"); emit();
  try {
    const bundle = await app.api.getMissionBundle(app.communityId, mission.id);
    const exportedAt = new Date().toISOString();
    const markdown = buildMissionMarkdown({ ...bundle, communityTitle: app.preview?.title ?? "Community", exportedAt });
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = el("a");
    link.href = url; link.download = `block-ops-mission-${mission.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "plan"}.md`;
    document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    ui.exportNote.set(mission.id, `Downloaded the plan as of ${new Date(exportedAt).toLocaleTimeString("en-US")}, read fresh from the shared mission (${plural(bundle.tasks.length, "job")}, ${plural(bundle.members.length, "participant")}).`);
  } catch (error) { ui.exportNote.set(mission.id, `Could not download the plan: ${describeError(error)}`); }
  emit();
}

// ---------- start a mission from a discussion ----------

function renderNew() {
  const host = byId("view-new");
  const post = app.route.postId ? app.posts.find(item => item.id === app.route.postId) ?? null : null;
  const sourceMissing = Boolean(app.route.postId) && !post && app.hasLoadedOnce;
  const k = name => `nm:${name}`;
  if (post && !getDraft(k("post-seen")) && !getDraft(k("objective"))) { setDraft(k("objective"), [...post.body].slice(0, MISSION_LIMITS.objective).join("")); setDraft(k("post-seen"), post.id); }
  const header = el("header", "page-head"); header.append(heading("h1", "Start a mission"));
  const nodes = [header];
  nodes.push(el("p", "field-hint", "A mission turns a conversation into a plan: a goal, a place, and jobs people can claim. You become its organizer. It does not need any official 311 record."));
  if (post) {
    const quote = el("blockquote", "source-quote");
    quote.append(el("p", "", [...post.body].slice(0, 300).join("") + (post.body.length > 300 ? "…" : "")), el("cite", "", `${post.authorName}'s post, ${timeFormat.format(new Date(post.createdAt))}`));
    nodes.push(el("p", "field-hint", "This mission will link back to this discussion:"), quote);
  } else if (sourceMissing) nodes.push(el("p", "form-error", "The post this link points to is not in this community, so the mission will not link to it."));
  const form = el("form", "mission-form"); form.noValidate = true;
  const fe = ui.createFieldErrors;
  form.append(
    draftField({ key: k("title"), label: "Mission title", placeholder: "Clean up the corner of Naylor Rd", error: fe.title, required: true }),
    draftField({ key: k("objective"), label: "Goal", rows: 3, placeholder: "What should be different when this is done?", error: fe.objective, required: true }),
    draftField({ key: k("location"), label: "Public location", placeholder: "1900 block of Naylor Rd SE", hint: "A block, intersection or landmark. Do not enter a home address.", error: fe.location, required: true }),
    draftField({ key: k("when"), label: "Date and time (optional)", type: "datetime-local", error: fe.startsAt }),
    draftField({ key: k("tasks"), label: "Jobs (optional, one per line)", rows: 4, placeholder: "Bring trash bags\nPhotograph the site\nTalk to the property owner", hint: `Up to ${MISSION_LIMITS.tasks} jobs. People claim them after joining.`, error: fe.tasks })
  );
  if (ui.createError) { const p = el("p", "form-error", ui.createError); p.setAttribute("role", "alert"); form.append(p); }
  const submit = el("button", "button button-primary", ui.creating ? "Creating…" : ui.createError && getDraft(k("op")) ? "Try again" : "Create mission"); submit.type = "submit"; submit.disabled = ui.creating; submit.id = "create-mission";
  const cancel = el("a", "button button-quiet", "Cancel"); cancel.href = `#/community/${app.communityId}/missions`;
  form.append(el("div", "form-actions", ""));
  form.lastChild.append(submit, cancel);
  form.addEventListener("submit", event => { event.preventDefault(); void createMission(post); });
  nodes.push(form);
  host.replaceChildren(...nodes);
}

async function createMission(post) {
  if (ui.creating) return;
  const k = name => `nm:${name}`;
  const fields = cleanMissionFields({ title: getDraft(k("title")), objective: getDraft(k("objective")), location: getDraft(k("location")), startsAt: getDraft(k("when")) });
  const tasks = parseTaskLines(getDraft(k("tasks")));
  ui.createFieldErrors = { ...(fields.ok ? {} : fields.errors), ...(tasks.ok ? {} : { tasks: tasks.error }) };
  ui.createError = "";
  if (!fields.ok || !tasks.ok) { emit(); afterRender(() => { const first = Object.keys(ui.createFieldErrors)[0]; if (first) focusKey(k(first === "startsAt" ? "when" : first)); }); return; }
  if (!getDraft(k("op"))) setDraft(k("op"), newOperationId());
  const operationId = getDraft(k("op"));
  const communityId = app.communityId;
  ui.creating = true; emit();
  try {
    const mission = await app.api.createMission({ communityId, title: fields.value.title, objective: fields.value.objective, location: fields.value.location, startsAt: fields.value.startsAt, sourcePostId: post?.id ?? null, tasks: tasks.tasks, operationId });
    for (const name of ["title", "objective", "location", "when", "tasks", "op", "post-seen"]) clearDraft(k(name));
    ui.creating = false;
    await refreshNow();
    announce("Mission created.");
    go(missionHash(communityId, mission.id));
    return;
  } catch (error) {
    const known = toCommunityError(error);
    ui.createError = describeError(known);
    if (!known.retryable) clearDraft(k("op"));
  }
  ui.creating = false; emit();
}

// ---------- publish a reviewed local campaign ----------

function localCampaign(id) {
  const loaded = createCampaignStorage().load();
  if (loaded.status === "error") return { error: loaded.message };
  return { campaign: loaded.store.campaigns.find(item => item.id === id) ?? null };
}

function renderPublish() {
  const host = byId("view-publish");
  const id = app.route.campaignId;
  const header = el("header", "page-head"); header.append(heading("h1", "Share a campaign as a mission"));
  const nodes = [header];
  const found = id ? localCampaign(id) : { campaign: null };
  if (found.error || !found.campaign) {
    const box = el("section", "community-card");
    box.append(el("p", "", found.error ?? "That local campaign was not found in this browser. Campaigns are saved per browser, so open the map in the browser where you made it."));
    const back = el("a", "button button-secondary", "Open the map and campaigns"); back.href = "#/map";
    box.append(back);
    host.replaceChildren(header, box);
    return;
  }
  const campaign = found.campaign;
  const obsKey = `pub:${id}:obs`;
  const selected = new Set(getDraft(obsKey) ? getDraft(obsKey).split(",") : []);
  const k = name => `pub:${id}:${name}`;
  if (!getDraft(k("title"))) setDraft(k("title"), campaign.name);
  if (!getDraft(k("objective"))) setDraft(k("objective"), campaign.objective || campaign.name);
  if (!getDraft(k("location"))) setDraft(k("location"), campaign.name);
  const result = publishPayloadFromCampaign(campaign, { observationIds: [...selected] });
  nodes.push(el("p", "field-hint", `You are copying a reviewed version of “${campaign.name}” into the community as a mission. Your campaign stays exactly as it is in this browser; later changes to either one do not affect the other. Publishing again creates a separate mission.`));
  if (!result.ok) {
    const box = el("div", "form-error"); box.setAttribute("role", "alert"); box.append(document.createTextNode(result.error + " "));
    const back = el("a", "", "Back to the campaign"); back.href = "#/map"; box.append(back);
    nodes.push(box);
    host.replaceChildren(...nodes);
    return;
  }
  const { summary } = result;
  const shared = el("section", "preview-box"); shared.setAttribute("aria-labelledby", "shared-h");
  const sh = heading("h2", "What will be shared", "section-h"); sh.id = "shared-h";
  const sharedList = el("ul");
  sharedList.append(
    el("li", "", `${plural(summary.evidence, "reviewed 311 report")} with their source IDs, dates, statuses and links${campaign.source.mode === "demo" ? " (fictional demo records)" : campaign.source.mode === "recorded" ? " (recorded snapshot, labeled as not live)" : ""}. Reports you excluded in your review are not included.`),
    el("li", "", `${plural(summary.tasks, "job")} as unclaimed, not-done jobs (task text and due dates only).`),
    el("li", "", `${plural(summary.observations, "observation")} you tick below, labeled as imported with the original author unverified.`)
  );
  shared.append(sh, sharedList);
  const priv = el("section", "preview-box"); priv.setAttribute("aria-labelledby", "private-h");
  const ph = heading("h2", "What stays private", "section-h"); ph.id = "private-h";
  const privList = el("ul");
  privList.append(
    el("li", "", `${summary.droppedOwners ? `${plural(summary.droppedOwners, "typed owner name")} (typed names are not accounts and never become commitments)` : "Typed owner names (none entered)"}.`),
    el("li", "", `${summary.droppedDone ? `${plural(summary.droppedDone, "done mark")} (shared jobs start not done)` : "Done marks (none set)"}.`),
    el("li", "", `${summary.unsharedObservations ? `${plural(summary.unsharedObservations, "observation")} you did not tick` : "Observations you did not tick"}, the ask/recipient, the request wording and the local brief.`)
  );
  priv.append(ph, privList);
  nodes.push(shared, priv);

  if (campaign.observations.length) {
    const fieldset = el("fieldset", "obs-pick"); fieldset.append(el("legend", "", "Include these observations (optional)"));
    for (const item of campaign.observations) {
      const label = el("label", "check-line");
      const box = el("input"); box.type = "checkbox"; box.checked = selected.has(item.id); box.dataset.focusKey = `pubobs:${item.id}`;
      box.addEventListener("change", () => { const next = new Set(selected); if (box.checked) next.add(item.id); else next.delete(item.id); setDraft(obsKey, [...next].join(",")); emit(); });
      const words = el("span"); words.append(el("strong", "", `${OBSERVATION_KINDS[item.kind] ?? "Observation"} · ${item.date}${item.fictional ? " · FICTIONAL" : ""}`), document.createTextNode(` — ${item.text}`));
      label.append(box, words); fieldset.append(label);
    }
    nodes.push(fieldset);
  }

  const form = el("form", "mission-form"); form.noValidate = true;
  const fe = ui.publishFieldErrors;
  form.append(
    draftField({ key: k("title"), label: "Mission title", error: fe.title, required: true }),
    draftField({ key: k("objective"), label: "Goal", rows: 3, error: fe.objective, required: true }),
    draftField({ key: k("location"), label: "Public location", hint: "Shown to every community member. Edit it if the campaign name is too specific.", error: fe.location, required: true }),
    draftField({ key: k("when"), label: "Date and time (optional)", type: "datetime-local", error: fe.startsAt })
  );
  if (ui.publishError) { const p = el("p", "form-error", ui.publishError); p.setAttribute("role", "alert"); form.append(p); }
  const submit = el("button", "button button-primary", ui.publishing ? "Sharing…" : ui.publishError && getDraft(k("op")) ? "Try again" : "Share as a mission"); submit.type = "submit"; submit.disabled = ui.publishing; submit.id = "publish-mission";
  const cancel = el("a", "button button-quiet", "Cancel, back to the campaign"); cancel.href = "#/map";
  const actions = el("div", "form-actions"); actions.append(submit, cancel); form.append(actions);
  form.addEventListener("submit", event => { event.preventDefault(); void publish(campaign, result.payload); });
  nodes.push(form);
  host.replaceChildren(...nodes);
}

async function publish(campaign, basePayload) {
  if (ui.publishing) return;
  const k = name => `pub:${campaign.id}:${name}`;
  const fields = cleanMissionFields({ title: getDraft(k("title")), objective: getDraft(k("objective")), location: getDraft(k("location")), startsAt: getDraft(k("when")) });
  ui.publishFieldErrors = fields.ok ? {} : fields.errors; ui.publishError = "";
  if (!fields.ok) { emit(); return; }
  if (!getDraft(k("op"))) setDraft(k("op"), newOperationId());
  const operationId = getDraft(k("op"));
  const communityId = app.communityId;
  const payload = { ...basePayload, ...fields.value };
  ui.publishing = true; emit();
  try {
    const mission = await app.api.publishMission({ communityId, payload, operationId });
    for (const name of ["title", "objective", "location", "when", "op", "obs"]) clearDraft(k(name));
    ui.publishing = false;
    await refreshNow();
    announce("Mission shared with the community.");
    go(missionHash(communityId, mission.id));
    return;
  } catch (error) {
    const known = toCommunityError(error);
    ui.publishError = describeError(known);
    if (!known.retryable) clearDraft(k("op"));
  }
  ui.publishing = false; emit();
}
