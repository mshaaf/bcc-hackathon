import {
  DEFAULT_SCOPE,
  applyWardBoundary,
  areaBlockName,
  areaRecords,
  candidateRecords,
  formatSourceDate,
  normalizeFeatureSet,
  refreshWorkspace,
  setRecordIncluded,
  snapshotFromRecording,
  sourceRecordUrl,
  statusKind,
  summarizeGeometry,
  unplacedRecords,
  updateScope,
  visibleRecords
} from "/lib/block-ops.mjs";
import {
  OBSERVATION_KINDS,
  addObservation,
  addTask,
  buildCampaignBriefContent,
  buildCampaignMarkdown,
  canExportCampaign,
  confirmCampaign,
  createCampaign,
  exportBlocker,
  reconcileStore,
  removeEvidence,
  removeObservation,
  removeTask,
  normalizeStore,
  setEscalation,
  setObjective,
  setRequestText,
  updateTask
} from "/lib/campaign.mjs";
import { RECURRENCE_RULE, areaRecurrence, recurrenceHeadline, recurrenceSpots, recurrenceSummary } from "/lib/recurrence.mjs";
import { createCampaignStorage } from "/storage.mjs";
import { createMap } from "/map.mjs";

const byId = id => document.getElementById(id);
const dcDay = date => {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit" })
    .formatToParts(date).map(part => [part.type, part.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
};
const todayInDc = () => dcDay(new Date());
const when = iso => new Date(iso).toLocaleString("en-US", { timeZone: "America/New_York", dateStyle: "medium", timeStyle: "short" });

const storage = createCampaignStorage();
const LAST_OPEN = "blockops.lastOpen";
let loading = "";
let view = "explore";
let busySpots = [];
let busyKey = "";
let plottedSnapshot = null;
let recordedFile = null;
let store = { version: 1, campaigns: [] };
let openId = null;
let deleteArmed = false;
let state = {
  snapshot: null,
  groups: [],
  activeGroupKey: null,
  selectedIds: new Set(),
  excludedIds: new Set(),
  reviewConfirmed: false,
  refreshError: "",
  observation: "",
  observedOn: "",
  area: { ...DEFAULT_SCOPE.area },
  filters: { ...DEFAULT_SCOPE.filters, kinds: new Set(DEFAULT_SCOPE.filters.kinds) }
};

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined && text !== null) node.textContent = String(text);
  return node;
}
const sourceText = value => (value === null || value === undefined || value === "" ? "Unavailable" : String(value));
const displayAddress = value => sourceText(value).toLocaleLowerCase("en-US")
  .replace(/\b[a-z]/g, letter => letter.toUpperCase())
  .replace(/\b(?:se|sw|ne|nw)\b/gi, direction => direction.toUpperCase());
const plural = (count, word) => `${count} ${word}${count === 1 ? "" : "s"}`;
const hasLocations = () => Boolean(state.snapshot?.records.some(record => record.geo));
const openCampaign = () => store.campaigns.find(campaign => campaign.id === openId) ?? null;

function dateBlock(value) {
  const date = element("div", "record-date");
  if (formatSourceDate(value) === "Date unavailable") {
    date.append(element("span", "", "Date"), element("strong", "", "—"));
  } else {
    const parsed = new Date(value);
    date.append(element("strong", "", new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "America/New_York" }).format(parsed)));
    date.append(element("span", "", new Intl.DateTimeFormat("en-US", { year: "numeric", timeZone: "America/New_York" }).format(parsed)));
  }
  return date;
}

function rememberOpen(id) {
  try { if (id) localStorage.setItem(LAST_OPEN, id); else localStorage.removeItem(LAST_OPEN); } catch { /* a convenience only */ }
}
function recallOpen() {
  try { return localStorage.getItem(LAST_OPEN); } catch { return null; }
}

// ---------- map ----------

const map = createMap(byId("map"), {
  onPick: center => {
    if (loading || !hasLocations() || view !== "explore") return;
    state = updateScope(state, { center });
    renderScope();
  },
  onTilesFailed: failed => { byId("map-note").hidden = !failed; }
});

function renderMap(pan = false) {
  if (view === "brief") return;
  if (plottedSnapshot !== state.snapshot) {
    plottedSnapshot = state.snapshot;
    map.setRecords(state.snapshot?.records ?? []);
    map.setSpots(state.snapshot?.mode === "demo" ? [] : recurrenceSpots(state.snapshot?.records ?? []), RECURRENCE_RULE.meters);
    pan = true; // plotting fits the whole ward; go back to the area that matters
  }
  const campaign = view === "campaign" ? openCampaign() : null;
  if (campaign) {
    map.setArea(campaign.area.center, campaign.area.radiusM, { pan });
    map.restyle({ selectedKeys: new Set(campaign.evidence.map(item => item.key)), visibleKeys: new Set((state.snapshot?.records ?? []).map(record => record.key)) });
  } else {
    map.setArea(state.area.center, state.area.radiusM, { pan });
    map.restyle({ selectedKeys: state.selectedIds, visibleKeys: new Set(visibleRecords(state).map(record => record.key)) });
  }
}

// ---------- views ----------

function showView(next, focus = false) {
  if (!["explore", "campaign", "brief"].includes(next)) return;
  const wasBrief = view === "brief";
  view = next;
  byId("workspace").dataset.view = next;
  for (const name of ["explore", "campaign", "brief"]) {
    byId(`${name}-panel`).hidden = name !== next;
    byId(`${name}-tab`).setAttribute("aria-selected", String(name === next));
  }
  if (next === "brief") renderBrief();
  else if (wasBrief) requestAnimationFrame(() => { map.resize(); renderMap(true); });
  else renderMap(true);
  if (focus) {
    byId(`${next}-tab`).focus({ preventScroll: true });
    byId("panel").scrollIntoView({ block: "start", behavior: "instant" });
  }
}

// ---------- saving ----------

function setSaveStatus(text, isError) {
  byId("save-status").textContent = text;
  byId("save-status").classList.toggle("save-error", isError);
}
function persist() {
  const result = storage.save(store);
  if (result.ok) setSaveStatus(`Saved in this browser · ${when(result.savedAt)}`, false);
  else setSaveStatus(result.message, true);
  return result;
}

// ---------- explore ----------

const shortDate = iso => new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "America/New_York" }).format(new Date(iso));
const shortDay = value => shortDate(value);

function renderStatLine() {
  const snapshot = state.snapshot;
  const line = byId("stat-line");
  if (!snapshot || snapshot.mode === "demo") { line.hidden = true; return; }
  const summary = recurrenceSummary(snapshot.records, { asOf: Date.parse(snapshot.retrievedAt) });
  line.replaceChildren();
  if (!summary.closedLocated) { line.hidden = true; return; }
  line.hidden = false;
  const lead = element("strong", "", "Closed isn't fixed. ");
  const main = `${summary.reReported} of ${summary.closedLocated} closed reports (${summary.pct}%) had another report filed nearby within ${RECURRENCE_RULE.days} days of filing · ${summary.spots.count} spots with ${RECURRENCE_RULE.minSpotReports}+ reports hold ${Math.round(summary.spots.share * 100)}% of reports. `;
  const mature = summary.matureClosed ? `Counting only ${recurrenceSummary.matureLabel}: ${summary.matureReReported} of ${summary.matureClosed} (${summary.maturePct}%). ` : "";
  const window = `${shortDate(`${snapshot.window.start}T12:00:00-04:00`)}–${shortDate(Date.parse(snapshot.retrievedAt))}${snapshot.mode === "recorded" ? ", recorded" : ""}. `;
  line.append(lead, `${main}${mature}`, element("span", "stat-caveat", `${window}“Nearby” means within ${RECURRENCE_RULE.meters} m (block-level locations); it is not necessarily the same pile. Filing dates are used, not closure dates, and duplicates and canceled reports are left out.`));
}

function renderFreshness() {
  const snapshot = state.snapshot;
  const demo = snapshot?.mode === "demo";
  const recorded = snapshot?.mode === "recorded";
  const notice = byId("sample-notice");
  notice.hidden = !demo && !recorded;
  notice.classList.toggle("recorded-notice", recorded);
  notice.textContent = demo
    ? "Practice case · All sample reports and addresses are fictional and have no map locations."
    : recorded ? `RECORDED SNAPSHOT · real DC 311 data retrieved ${when(snapshot.retrievedAt)} ET, shown from a saved file. It is not live. Press “Live DC records” to refresh.` : "";
  byId("error-notice").hidden = !state.refreshError;
  byId("error-notice").textContent = state.refreshError
    ? `${state.refreshError} ${snapshot ? "Your current selection and saved campaigns are unchanged." : "No substitute data is shown."}`
    : "";

  let text;
  if (loading === "live") text = "Requesting the bounded DC 311 snapshot… Saved campaigns stay editable meanwhile.";
  else if (loading === "recorded") text = "Loading the recorded snapshot…";
  else if (loading === "demo") text = "Loading the fictional sample…";
  else if (demo) text = `Fictional practice case · ${plural(snapshot.records.length, "report")} · no map locations`;
  else if (snapshot) {
    const geometry = snapshot.geometry ?? summarizeGeometry(snapshot.records);
    const boundary = snapshot.boundary;
    const boundaryText = boundary?.status === "checked"
      ? `${boundary.outside} outside the Ward 8 boundary${boundary.unchecked ? ` · ${boundary.unchecked} not checked (no location)` : ""}`
      : "Ward 8 boundary check unavailable";
    text = `${recorded ? "RECORDED (not live) · " : ""}DC 311 · retrieved ${when(snapshot.retrievedAt)} ET · ${snapshot.window.start} to ${snapshot.window.endExclusive} (end exclusive) · ${plural(snapshot.records.length, "record")} · ${geometry.mapped} mapped, ${geometry.missing} missing, ${geometry.invalid} invalid location · ${boundaryText}`;
  } else text = "No source records loaded.";
  byId("freshness").textContent = text;
  renderStatLine();

  for (const [id, mode] of [["load-live", "live"], ["load-recorded", "recorded"], ["load-demo", "demo"]]) {
    byId(id).disabled = Boolean(loading) || (mode === "recorded" && !recordedFile);
    byId(id).setAttribute("aria-pressed", String(snapshot?.mode === mode));
  }
  // Only the explore draft is locked while a refresh is in flight; saved campaigns and the brief stay usable.
  byId("explore-panel").inert = Boolean(loading);
  byId("panel").setAttribute("aria-busy", String(Boolean(loading)));
}

function renderScopeControls() {
  const placed = hasLocations();
  for (const radio of document.querySelectorAll('input[name="radius"]')) {
    radio.checked = Number(radio.value) === state.area.radiusM;
    radio.disabled = !placed;
  }
  byId("days-select").value = state.filters.days ? String(state.filters.days) : "";
  for (const box of document.querySelectorAll('input[name="kind"]')) box.checked = state.filters.kinds.has(box.value);

  const select = byId("busy-select");
  const key = `${state.snapshot?.mode}|${state.snapshot?.retrievedAt}|${state.snapshot?.records.length}`;
  if (key !== busyKey) {
    busyKey = key;
    busySpots = placed && state.snapshot.mode !== "demo"
      ? recurrenceSpots(state.snapshot.records).slice(0, 10).map(spot => ({ center: spot.center, count: spot.reports, reReported: spot.reReported }))
      : [];
  }
  const center = state.area.center;
  const matching = busySpots.findIndex(spot => center && spot.center.lat === center.lat && spot.center.lon === center.lon);
  const placeholder = element("option", "", center && matching < 0 ? "Custom area from the map" : "Choose a spot (worst first)…");
  placeholder.value = "";
  select.replaceChildren(placeholder, ...busySpots.map((spot, index) => {
    const option = element("option", "", `${areaBlockName({ ...state, area: { center: spot.center, radiusM: state.area.radiusM } })} · ${plural(spot.count, "report")} · ${spot.reReported} followed by another report`);
    option.value = String(index);
    return option;
  }));
  select.value = matching >= 0 ? String(matching) : "";
  select.disabled = !placed;
}

function appendSourceField(list, label, value) {
  list.append(element("dt", "", label), element("dd", "", sourceText(value)));
}

function sourceDrawer(record, mode) {
  const details = element("details", "record-details");
  details.append(element("summary", "", "Show original record"));
  const fields = element("dl", "source-fields");
  for (const [label, value] of [
    ["Service request ID", record.attributes?.SERVICEREQUESTID ?? record.id], ["Object ID", record.attributes?.OBJECTID ?? record.objectId],
    ["Add date (source)", record.attributes?.ADDDATE ?? record.date], ["Service due date", record.attributes?.SERVICEDUEDATE],
    ["Resolution date", record.attributes?.RESOLUTIONDATE], ["Official status", record.attributes?.SERVICEORDERSTATUS ?? record.status],
    ["Service code", record.attributes?.SERVICECODE], ["Service description", record.attributes?.SERVICECODEDESCRIPTION ?? record.category],
    ["Organization", record.attributes?.ORGANIZATIONACRONYM ?? record.agency], ["Ward label (source)", record.attributes?.WARD ?? record.ward],
    ["Street address", record.attributes?.STREETADDRESS ?? record.address]
  ]) appendSourceField(fields, label, value);
  appendSourceField(fields, "Map point", record.geo ? `${record.geo.lat.toFixed(5)}, ${record.geo.lon.toFixed(5)} (approximate)` : record.geoStatus === "invalid" ? "Source point invalid; not mapped" : "No map point in the source");
  details.append(fields);
  const recordUrl = sourceRecordUrl(record, mode);
  if (recordUrl) {
    const link = element("a", "source-link", "Open this record at DC 311");
    link.href = recordUrl;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    details.append(link);
  }
  return details;
}

function recordRow(record, id) {
  const row = element("div", "record-choice");
  row.append(dateBlock(record.date));
  const checkbox = element("input");
  checkbox.id = id;
  checkbox.type = "checkbox";
  checkbox.checked = state.selectedIds.has(record.key);
  checkbox.dataset.key = record.key;
  checkbox.setAttribute("aria-label", `Include service request ${sourceText(record.id)}`);
  checkbox.addEventListener("change", () => {
    state = setRecordIncluded(state, record.key, checkbox.checked);
    renderSelection();
  });
  row.append(checkbox);

  const content = element("div", "record-content");
  const head = element("div", "record-head");
  const address = element("label", "record-address", displayAddress(record.address || "Address unavailable"));
  address.htmlFor = id;
  head.append(address, element("span", `status-pill status-${statusKind(record.status)}`, record.status || "Status unavailable"));
  content.append(head);
  const meta = element("div", "record-meta");
  meta.append(element("span", "record-id", `Request ${sourceText(record.id)}`));
  if (record.outsideWard === true) meta.append(element("span", "flag", "Outside Ward 8 boundary"));
  content.append(meta, sourceDrawer(record, state.snapshot?.mode));
  row.append(content);
  return row;
}

function renderScope() {
  renderScopeControls();
  const candidates = candidateRecords(state);
  const hidden = areaRecords(state).length - candidates.length;
  const demo = state.snapshot?.mode === "demo";
  const block = areaBlockName(state);

  byId("case-title").textContent = !state.snapshot
    ? "Choose an area"
    : demo ? "Practice case · fictional reports"
    : state.area.center ? (block ?? "No reports in this area") : "All loaded reports";

  let status = "";
  if (state.snapshot) {
    if (state.area.center) status = `${plural(candidates.length, "report")} within ${state.area.radiusM} m of the ${block ?? "chosen point"}.`;
    else status = demo ? `${plural(candidates.length, "fictional report")}.` : `Showing ${plural(candidates.length, "report")}; none have a usable map location.`;
    if (hidden > 0) status += ` ${plural(hidden, "more report")} in this scope ${hidden === 1 ? "is" : "are"} hidden by the date or status filters.`;
  }
  byId("scope-status").textContent = status;
  byId("area-headline").textContent = candidates.length && !demo ? recurrenceHeadline(areaRecurrence(candidates), shortDay) : "";

  const counts = { open: 0, closed: 0, other: 0 };
  for (const record of candidates) counts[statusKind(record.status)] += 1;
  byId("tally").textContent = candidates.length
    ? `${counts.open} open · ${counts.closed} closed · ${counts.other} duplicate/canceled/unknown. Nearby is not the same incident; check each record.`
    : "No reports match this area and these filters.";

  byId("record-list").replaceChildren(...candidates.map((record, index) => recordRow(record, `record-${index}`)));
  const unplaced = unplacedRecords(state);
  byId("unplaced").hidden = !unplaced.length;
  byId("unplaced-summary").textContent = `${plural(unplaced.length, "report")} without a usable map point`;
  byId("unplaced-list").replaceChildren(...unplaced.map((record, index) => recordRow(record, `unplaced-${index}`)));
  renderSelection(true);
}

function renderSelection(pan = false) {
  byId("selected-count").textContent = `${state.selectedIds.size} selected`;
  byId("new-campaign").disabled = state.selectedIds.size === 0 || Boolean(loading);
  byId("new-status").textContent = state.selectedIds.size === 0
    ? "Select at least one report to start a campaign."
    : `Starts a saved campaign from ${plural(state.selectedIds.size, "selected report")} in this area.`;
  for (const box of document.querySelectorAll("#record-list input[type=checkbox], #unplaced-list input[type=checkbox]")) box.checked = state.selectedIds.has(box.dataset.key);
  renderMap(pan);
}

// ---------- campaigns ----------

function mutate(change) {
  const campaign = openCampaign();
  if (!campaign) return "";
  let next;
  try { next = change(campaign); } catch (error) { return error.message; }
  store = { ...store, campaigns: store.campaigns.map(item => item.id === campaign.id ? next : item) };
  persist();
  return "";
}

// Re-rendering replaces nodes, which would drop keyboard focus to the top of the page; put it somewhere sensible.
const focusSoon = id => requestAnimationFrame(() => byId(id)?.focus({ preventScroll: false }));

function renderCampaignList() {
  const list = byId("campaign-list");
  const sorted = [...store.campaigns].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  byId("campaign-count").textContent = store.campaigns.length ? ` (${store.campaigns.length})` : "";
  byId("campaign-empty").hidden = sorted.length > 0;
  list.replaceChildren(...sorted.map(campaign => {
    const item = element("li", "campaign-card");
    const head = element("div", "card-head");
    head.append(element("strong", "", campaign.name));
    if (campaign.source.mode === "demo") head.append(element("span", "badge badge-demo", "Practice (fictional)"));
    if (campaign.evidence.some(entry => entry.changedSinceReview)) head.append(element("span", "badge badge-warn", "Status changed since review"));
    else if (!campaign.request.confirmedAt) head.append(element("span", "badge", "Not reviewed"));
    const done = campaign.tasks.filter(task => task.done).length;
    item.append(head, element("p", "card-objective", campaign.objective || "No objective set"),
      element("p", "card-meta", `${plural(campaign.evidence.length, "report")} · ${plural(campaign.observations.length, "observation")} · tasks ${done} of ${campaign.tasks.length} done · updated ${when(campaign.updatedAt)}`));
    const open = element("button", "button button-secondary", "Open");
    open.type = "button";
    open.setAttribute("aria-label", `Open campaign ${campaign.name}`);
    open.addEventListener("click", () => openCampaignById(campaign.id));
    item.append(open);
    return item;
  }));
}

function openCampaignById(id) {
  openId = id;
  rememberOpen(id);
  deleteArmed = false;
  const campaign = openCampaign();
  byId("c-objective").value = campaign.objective;
  byId("c-request").value = campaign.request.text;
  byId("ask-recipient").value = campaign.escalation.recipient;
  byId("ask-fix").value = campaign.escalation.fix;
  byId("ask-other").value = campaign.escalation.fixOther;
  byId("obs-date").value = todayInDc();
  byId("obs-kind").value = campaign.observations.length ? "followup" : "resident";
  byId("obs-fictional").checked = true; // a fictional entry is the default; unchecking is a deliberate act
  renderCampaign();
  showView("campaign", true);
}

function renderCampaign() {
  renderCampaignList();
  const campaign = openCampaign();
  byId("campaign-list-view").hidden = Boolean(campaign);
  byId("campaign-detail-view").hidden = !campaign;
  if (!campaign) { renderBrief(); return; }

  byId("c-tag").textContent = campaign.source.mode === "demo" ? "Practice campaign · fictional" : campaign.source.mode === "recorded" ? "Neighborhood campaign · recorded snapshot" : "Neighborhood campaign";
  byId("c-name").textContent = campaign.name;
  byId("c-headline").textContent = recurrenceHeadline(areaRecurrence(campaign.evidence), shortDay);
  byId("c-caveat").textContent = recurrenceHeadline.caveat;
  byId("delete-campaign").textContent = deleteArmed ? "Confirm delete" : "Delete campaign";
  renderTracks();
  renderCampaignEvidence();
  renderObservations();
  renderTasks();
  renderReviewState();
  renderBrief();
  if (view === "campaign") renderMap(false);
}

function renderTracks() {
  const campaign = openCampaign();
  if (!campaign) return;
  const counts = new Map();
  for (const item of campaign.evidence) counts.set(item.status || "Status unknown", (counts.get(item.status || "Status unknown") || 0) + 1);
  const changed = campaign.evidence.filter(item => item.changedSinceReview).length;
  byId("t-city").textContent = campaign.evidence.length
    ? `${[...counts].map(([status, count]) => `${count} ${status}`).join(" · ")} (as published${campaign.source.retrievedAt ? `, checked ${when(campaign.source.retrievedAt)}` : ""})${changed ? ` · ${plural(changed, "status")} changed since review` : ""}`
    : "No reports in this campaign";
  const done = campaign.tasks.filter(task => task.done).length;
  byId("t-group").textContent = `${campaign.request.confirmedAt ? `Reviewed ${when(campaign.request.confirmedAt)}` : "Not reviewed yet"} · tasks ${done} of ${campaign.tasks.length} done`;
  const latest = [...campaign.observations].filter(item => item.kind !== "agency").sort((left, right) => left.date.localeCompare(right.date)).at(-1);
  byId("t-resident").textContent = latest
    ? `${OBSERVATION_KINDS[latest.kind]} · ${latest.date}${latest.fictional ? " (fictional)" : ""}`
    : "No resident observation yet";
}

function renderCampaignEvidence() {
  const campaign = openCampaign();
  byId("c-evidence-count").textContent = `· ${campaign.evidence.length}`;
  byId("c-evidence").replaceChildren(...campaign.evidence.map(item => {
    const row = element("div", "record-choice evidence-row");
    row.append(dateBlock(item.date), element("span"));
    const content = element("div", "record-content");
    const head = element("div", "record-head");
    head.append(element("span", "record-address", displayAddress(item.address || "Address unavailable")), element("span", `status-pill status-${statusKind(item.status)}`, item.status || "Status unavailable"));
    const meta = element("div", "record-meta");
    meta.append(element("span", "record-id", `Request ${sourceText(item.id)}`));
    if (item.outsideWard === true) meta.append(element("span", "flag", "Outside Ward 8 boundary"));
    if (item.changedSinceReview) meta.append(element("span", "flag flag-warn", `Status changed since review: was ${item.previousStatus ?? "unavailable"}`));
    if (item.inLatestSnapshot === false) meta.append(element("span", "flag", "Not in the latest 90-day snapshot"));
    const remove = element("button", "button button-quiet small", "Remove from campaign");
    remove.type = "button";
    remove.setAttribute("aria-label", `Remove service request ${sourceText(item.id)} from this campaign`);
    remove.addEventListener("click", () => {
      mutate(current => removeEvidence(current, item.key));
      renderCampaign();
      focusSoon("h-evidence");
    });
    content.append(head, meta, sourceDrawer(item, campaign.source.mode), remove);
    row.append(content);
    return row;
  }));
}

function renderObservations() {
  const campaign = openCampaign();
  const sorted = [...campaign.observations].sort((left, right) => left.date.localeCompare(right.date));
  byId("c-observations").replaceChildren(...sorted.map(item => {
    const li = element("li", "obs-item");
    const head = element("div", "obs-head");
    head.append(element("strong", "", OBSERVATION_KINDS[item.kind]), element("span", "", item.date));
    if (item.fictional) head.append(element("span", "badge badge-demo", "Fictional"));
    const remove = element("button", "button button-quiet small", "Remove");
    remove.type = "button";
    remove.setAttribute("aria-label", `Remove ${OBSERVATION_KINDS[item.kind]} dated ${item.date}`);
    remove.addEventListener("click", () => { mutate(current => removeObservation(current, item.id)); renderCampaign(); focusSoon("h-obs"); });
    li.append(head, element("p", "", item.text), remove);
    return li;
  }));
}

function renderTasks() {
  const campaign = openCampaign();
  byId("c-tasks").replaceChildren(...campaign.tasks.map((task, index) => {
    const li = element("li", "task-row");
    const done = element("input");
    done.type = "checkbox";
    done.checked = task.done;
    done.id = `task-done-${index}`;
    done.addEventListener("change", () => { mutate(current => updateTask(current, task.id, { done: done.checked })); renderTracks(); renderReviewState(); renderBrief(); li.classList.toggle("is-done", done.checked); });
    const label = element("label", "task-text", task.text);
    label.htmlFor = done.id;
    const owner = element("input");
    owner.type = "text";
    owner.value = task.owner;
    owner.placeholder = "Owner";
    owner.setAttribute("aria-label", `Owner of task: ${task.text}`);
    owner.addEventListener("change", () => { mutate(current => updateTask(current, task.id, { owner: owner.value })); renderBrief(); });
    const due = element("input");
    due.type = "date";
    due.value = task.due;
    due.setAttribute("aria-label", `Due date of task: ${task.text}`);
    due.addEventListener("change", () => { mutate(current => updateTask(current, task.id, { due: due.value })); renderBrief(); });
    const remove = element("button", "button button-quiet small", "Remove");
    remove.type = "button";
    remove.setAttribute("aria-label", `Remove task: ${task.text}`);
    remove.addEventListener("click", () => { mutate(current => removeTask(current, task.id)); renderCampaign(); focusSoon("h-tasks"); });
    li.classList.toggle("is-done", task.done);
    li.append(done, label, owner, due, remove);
    return li;
  }));
}

function renderReviewState() {
  const campaign = openCampaign();
  if (!campaign) return;
  byId("review-status").textContent = campaign.request.confirmedAt
    ? `Reviewed ${when(campaign.request.confirmedAt)}. Changing the request or removing a report withdraws this.`
    : (exportBlocker(campaign) || "Check the evidence and request, then mark the campaign reviewed.");
  byId("mark-reviewed").disabled = !campaign.evidence.length || Boolean(campaign.request.confirmedAt);
  byId("mark-reviewed").textContent = campaign.request.confirmedAt ? "Reviewed ✓" : "Mark reviewed";
}

// ---------- brief ----------

function renderBrief() {
  const paper = byId("brief-paper");
  paper.replaceChildren();
  const campaign = openCampaign();
  const ok = Boolean(campaign) && canExportCampaign(campaign);
  byId("download-brief").disabled = !ok;
  byId("print-brief").disabled = !ok;
  if (!campaign) {
    paper.append(element("p", "empty-message", "Open a saved campaign to see its brief."));
    byId("export-status").textContent = "A brief belongs to a campaign. Create or open one first.";
    return;
  }

  const content = buildCampaignBriefContent(campaign);
  const section = (title, ...nodes) => { paper.append(element("h5", "", title), ...nodes); };
  const brand = element("div", "paper-brand");
  brand.append(element("strong", "", "block ops."), element("span", "", "Neighborhood brief · escalation"));
  paper.append(brand);
  if (content.fictional) paper.append(element("p", "paper-fictional", "FICTIONAL PRACTICE CASE · not city records"));
  if (content.recorded) paper.append(element("p", "paper-fictional paper-recorded", "RECORDED SNAPSHOT · real city data, not live"));
  paper.append(element("h4", "", content.title), element("p", "paper-block", `Objective: ${content.objective || "Not set"}`));
  const metadata = [content.sourceLabel];
  if (content.retrievedAt) metadata.push(`${content.recorded ? "Retrieved" : "Last checked"} ${content.retrievedAt}`);
  if (content.window) metadata.push(`${content.window.start} through ${content.window.endExclusive} (end exclusive)`);
  paper.append(element("p", "paper-meta", metadata.join(" · ")), element("p", "paper-meta", `Selection scope: ${content.scope}`));

  section("Recurrence evidence", element("p", "paper-lead", content.recurrence.headline), element("p", "paper-note paper-note-first", content.recurrence.caveat), element("p", "paper-block", `City status as published: ${content.cityStatus || "No reports"}. The reports are listed after the follow-up history.`));

  section("The ask", element("p", "paper-block", `To: ${content.ask.recipient}\nRequested lasting fix: ${content.ask.fix}`), element("p", "paper-block paper-request", content.request), element("p", "paper-note paper-note-first", "Prepared for the group to send. Nothing has been sent."));
  section("Tasks", ...(content.tasks.length
    ? content.tasks.map(task => element("p", "paper-task", `${task.done ? "[done]" : "[open]"} ${task.text} — owner: ${task.owner}; due: ${task.due}`))
    : [element("p", "paper-block", "No tasks assigned yet.")]));
  section("Group progress", element("p", "paper-block", `${content.group.reviewedAt ? `Reviewed ${content.group.reviewedAt}` : "Not yet reviewed"} · tasks done ${content.group.tasksDone} of ${content.group.tasksTotal}`));

  const observations = content.observations.length
    ? content.observations.map(item => element("p", "paper-task", `${item.kindLabel} (${item.date})${item.fictional ? " [FICTIONAL practice entry]" : ""}: ${item.text}`))
    : [element("p", "paper-block", "No group observation provided; current conditions are unverified.")];
  section("Resident verification and follow-ups", ...observations);
  const records = element("ul", "paper-list");
  for (const record of content.records) {
    const item = element("li", "", `${record.address} · ${record.id} · ${record.date} · Official status: ${record.status}`);
    if (record.previousStatus) item.append(document.createElement("br"), element("em", "", `Changed since review; was ${record.previousStatus}`));
    if (record.notInLatestSnapshot) item.append(document.createElement("br"), element("em", "", "Not in the latest 90-day snapshot; status as last seen"));
    if (record.locationNote) item.append(document.createElement("br"), element("em", "", record.locationNote));
    if (record.sourceUrl) {
      const link = element("a", "source-link", "Original source record");
      link.href = record.sourceUrl;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      item.append(document.createElement("br"), link);
    }
    records.append(item);
  }
  section(`City ticket status, as published (${content.records.length})`, element("p", "paper-block", content.cityStatus || "No reports"), records);
  section("Source appendix", element("p", "paper-block", content.sourceUrl
    ? `DC 311 FeatureServer/21. Original service request IDs are listed above. ${content.sourceUrl}`
    : "Fictional demonstration records only; no official source record is represented."));
  if (content.locationCaveat) paper.append(element("p", "paper-note", content.locationCaveat));
  paper.append(element("p", "paper-note", content.caveat));

  byId("export-status").textContent = canExportCampaign(campaign) ? "Ready. The download includes the recurrence evidence, the ask, tasks and follow-ups." : exportBlocker(campaign);
}

// ---------- loading ----------

async function readJson(url) {
  let response;
  try { response = await fetch(url, { cache: "no-store" }); } catch { throw new Error("The data service could not be reached."); }
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || `Request failed with HTTP ${response.status}.`);
  return body;
}

async function loadLiveSnapshot() {
  const snapshot = await readJson("/api/requests");
  let boundary = null;
  try { boundary = await readJson("/api/ward8"); } catch { /* flags stay unavailable and are labeled so */ }
  return applyWardBoundary(snapshot, boundary);
}

async function loadDemoSnapshot() {
  const fixture = await readJson("/api/demo");
  if (fixture.mode !== "demo" || fixture.fictional !== true) throw new Error("The offline sample is not labeled as fictional.");
  const records = normalizeFeatureSet(fixture);
  return { mode: "demo", sourceUrl: null, retrievedAt: null, window: null, geometry: summarizeGeometry(records), boundary: { status: "unavailable", inside: 0, outside: 0, unchecked: records.length }, records };
}

async function fetchRecording() {
  const file = await readJson("/api/recorded");
  snapshotFromRecording(file); // refuse a malformed recording before offering it
  return file;
}

async function loadRecordedSnapshot() {
  recordedFile = recordedFile ?? await fetchRecording();
  return snapshotFromRecording(recordedFile);
}

// Start on the worst repeat-report spot: the real data's most telling place.
const worstSpotCenter = records => recurrenceSpots(records)[0]?.center ?? null;

async function load(mode) {
  loading = mode;
  renderFreshness();
  byId("new-campaign").disabled = true;
  const loader = { live: loadLiveSnapshot, recorded: loadRecordedSnapshot, demo: loadDemoSnapshot }[mode];
  state = await refreshWorkspace(state, loader, { pickCenter: worstSpotCenter });
  loading = "";
  renderFreshness();
  if (!state.refreshError && mode === "live") {
    // A refresh only updates evidence status in saved campaigns; areas, observations and tasks are never touched.
    const next = reconcileStore(store, state.snapshot);
    if (JSON.stringify(next) !== JSON.stringify(store)) { store = next; persist(); }
  }
  renderScope();
  renderCampaign();
}

// ---------- events ----------

byId("load-live").addEventListener("click", () => load("live"));
byId("load-recorded").addEventListener("click", () => load("recorded"));
byId("load-demo").addEventListener("click", () => load("demo"));

for (const radio of document.querySelectorAll('input[name="radius"]')) {
  radio.addEventListener("change", () => { state = updateScope(state, { radiusM: Number(radio.value) }); renderScope(); });
}
byId("days-select").addEventListener("change", event => {
  state = updateScope(state, { days: event.target.value ? Number(event.target.value) : null });
  renderScope();
});
for (const box of document.querySelectorAll('input[name="kind"]')) {
  box.addEventListener("change", () => {
    state = updateScope(state, { kinds: [...document.querySelectorAll('input[name="kind"]:checked')].map(checked => checked.value) });
    renderScope();
  });
}
byId("busy-select").addEventListener("change", event => {
  const spot = busySpots[Number(event.target.value)];
  if (!spot) return;
  state = updateScope(state, { center: spot.center });
  renderScope();
});

byId("new-campaign").addEventListener("click", () => {
  let campaign;
  try { campaign = createCampaign(state); } catch (error) { byId("new-status").textContent = error.message; return; }
  store = { ...store, campaigns: [...store.campaigns, campaign] };
  persist();
  openCampaignById(campaign.id);
});

byId("back-to-list").addEventListener("click", () => { openId = null; rememberOpen(null); deleteArmed = false; renderCampaign(); renderMap(true); focusSoon("campaign-tab"); });
byId("delete-campaign").addEventListener("click", () => {
  if (!deleteArmed) {
    deleteArmed = true;
    byId("delete-campaign").textContent = "Confirm delete";
    window.setTimeout(() => { if (deleteArmed) { deleteArmed = false; byId("delete-campaign").textContent = "Delete campaign"; } }, 5000);
    return;
  }
  store = { ...store, campaigns: store.campaigns.filter(campaign => campaign.id !== openId) };
  persist();
  openId = null;
  rememberOpen(null);
  deleteArmed = false;
  renderCampaign();
  renderMap(true);
  focusSoon("campaign-tab");
});

byId("c-objective").addEventListener("input", () => { mutate(campaign => setObjective(campaign, byId("c-objective").value)); renderCampaignList(); renderBrief(); });
byId("c-request").addEventListener("input", () => {
  mutate(campaign => setRequestText(campaign, byId("c-request").value));
  renderReviewState();
  renderTracks();
  renderBrief();
});
const askChanged = () => {
  const message = mutate(campaign => setEscalation(campaign, { recipient: byId("ask-recipient").value, fix: byId("ask-fix").value, fixOther: byId("ask-other").value }));
  byId("review-error").hidden = !message;
  byId("review-error").textContent = message;
  renderReviewState();
  renderTracks();
  renderBrief();
};
for (const id of ["ask-recipient", "ask-fix", "ask-other"]) byId(id).addEventListener(id === "ask-fix" ? "change" : "input", askChanged);
byId("mark-reviewed").addEventListener("click", () => {
  const message = mutate(campaign => confirmCampaign(campaign));
  byId("review-error").hidden = !message;
  byId("review-error").textContent = message;
  renderCampaign();
});

byId("obs-form").addEventListener("submit", event => {
  event.preventDefault();
  const message = mutate(campaign => addObservation(campaign, {
    kind: byId("obs-kind").value, date: byId("obs-date").value, text: byId("obs-text").value, fictional: byId("obs-fictional").checked
  }));
  byId("obs-error").hidden = !message;
  byId("obs-error").textContent = message;
  if (message) return;
  byId("obs-text").value = "";
  byId("obs-kind").value = "followup";
  byId("obs-fictional").checked = true;
  renderCampaign();
  focusSoon("obs-text");
});
byId("task-form").addEventListener("submit", event => {
  event.preventDefault();
  const message = mutate(campaign => addTask(campaign, { text: byId("task-text").value, owner: byId("task-owner").value, due: byId("task-due").value }));
  byId("task-error").hidden = !message;
  byId("task-error").textContent = message;
  if (message) return;
  for (const field of ["task-text", "task-owner", "task-due"]) byId(field).value = "";
  renderCampaign();
  focusSoon("task-text");
});

document.querySelectorAll("[data-view]").forEach(button => {
  button.addEventListener("click", () => showView(button.dataset.view, true));
});
const tabs = [...document.querySelectorAll('.tab[role="tab"]')];
tabs.forEach((tab, index) => tab.addEventListener("keydown", event => {
  let next;
  if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
  else if (event.key === "ArrowLeft") next = (index + tabs.length - 1) % tabs.length;
  else if (event.key === "Home") next = 0;
  else if (event.key === "End") next = tabs.length - 1;
  else return;
  event.preventDefault();
  showView(tabs[next].dataset.view, true);
}));

byId("download-brief").addEventListener("click", () => {
  const campaign = openCampaign();
  if (!campaign || !canExportCampaign(campaign)) return;
  const blob = new Blob([buildCampaignMarkdown(campaign)], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = element("a");
  link.href = url;
  link.download = `block-ops-${campaign.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "campaign"}.md`;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
});
byId("print-brief").addEventListener("click", () => {
  const campaign = openCampaign();
  if (campaign && canExportCampaign(campaign)) window.print();
});

// The map is hidden while the community section is showing; Leaflet needs a nudge when it comes back.
window.addEventListener("hashchange", () => { if (location.hash.startsWith("#/map")) requestAnimationFrame(() => map.resize()); });

// ---------- start ----------

const loaded = storage.load();
store = normalizeStore(loaded.store);
if (loaded.status === "error") setSaveStatus(loaded.message, true);
else if (loaded.status === "ok") setSaveStatus(`${plural(store.campaigns.length, "saved campaign")} loaded from this browser.`, false);
byId("obs-date").value = todayInDc();
renderScope();
renderCampaign();
const last = recallOpen();
if (last && store.campaigns.some(campaign => campaign.id === last)) openCampaignById(last);
// The recorded snapshot is offered only if its file loads and validates; its date goes on the button.
fetchRecording().then(file => {
  recordedFile = file;
  byId("load-recorded").textContent = `Recorded DC 311 snapshot (${shortDate(file.retrievedAt)})`;
  renderFreshness();
}).catch(() => { byId("load-recorded").textContent = "Recorded snapshot unavailable"; });
load("live");
