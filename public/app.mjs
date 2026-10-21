import {
  DEFAULT_SCOPE,
  KIND_LABELS,
  applyWardBoundary,
  areaBlockName,
  areaRecords,
  buildBriefContent,
  buildBriefMarkdown,
  candidateRecords,
  canExportBrief,
  confirmSourceReview,
  findBusySpots,
  formatSourceDate,
  normalizeFeatureSet,
  refreshWorkspace,
  setRecordIncluded,
  sourceRecordUrl,
  statusKind,
  summarizeGeometry,
  unplacedRecords,
  updateScope,
  visibleRecords
} from "/lib/block-ops.mjs";
import { createMap } from "/map.mjs";

const byId = id => document.getElementById(id);
const todayInDc = () => {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date()).map(part => [part.type, part.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
};

let loading = "";
let busySpots = [];
let busyKey = "";
let plottedSnapshot = null;
let state = {
  snapshot: null,
  groups: [],
  activeGroupKey: null,
  selectedIds: new Set(),
  reviewConfirmed: false,
  refreshError: "",
  observation: "",
  observedOn: todayInDc(),
  ask: "Please share a dated update for the reports the group reviewed.",
  tasks: [
    { role: "Meeting lead", task: "Bring the reviewed brief to the next group meeting." },
    { role: "Records keeper", task: "Check the public source again on the agreed follow-up date." }
  ],
  area: { ...DEFAULT_SCOPE.area },
  filters: { ...DEFAULT_SCOPE.filters, kinds: new Set(DEFAULT_SCOPE.filters.kinds) }
};

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined && text !== null) node.textContent = String(text);
  return node;
}

function sourceText(value) {
  return value === null || value === undefined || value === "" ? "Unavailable" : String(value);
}

function displayAddress(value) {
  return sourceText(value).toLocaleLowerCase("en-US")
    .replace(/\b[a-z]/g, letter => letter.toUpperCase())
    .replace(/\b(?:se|sw|ne|nw)\b/gi, direction => direction.toUpperCase());
}

const hasLocations = () => Boolean(state.snapshot?.records.some(record => record.geo));
const plural = (count, word) => `${count} ${word}${count === 1 ? "" : "s"}`;

const map = createMap(byId("map"), {
  onPick: center => {
    if (loading || !hasLocations()) return;
    state = updateScope(state, { center });
    syncObservationInputs();
    renderScope();
  },
  onTilesFailed: failed => { byId("map-note").hidden = !failed; }
});

function showView(view, focus = false) {
  if (!["evidence", "plan", "brief"].includes(view)) return;
  const wasBrief = byId("workspace").dataset.view === "brief";
  byId("workspace").dataset.view = view;
  for (const name of ["evidence", "plan", "brief"]) {
    byId(`${name}-panel`).hidden = name !== view;
    byId(`${name}-tab`).setAttribute("aria-selected", String(name === view));
  }
  if (wasBrief && view !== "brief") requestAnimationFrame(() => map.resize());
  if (focus) {
    byId(`${view}-tab`).focus({ preventScroll: true });
    byId("panel").scrollIntoView({ block: "start", behavior: "instant" });
  }
}

function syncObservationInputs() {
  byId("observation").value = state.observation;
  byId("observed-on").value = state.observedOn;
}

function renderFreshness() {
  const snapshot = state.snapshot;
  const demo = snapshot?.mode === "demo";
  byId("sample-notice").hidden = !demo;
  byId("error-notice").hidden = !state.refreshError;
  byId("error-notice").textContent = state.refreshError
    ? `${state.refreshError} ${snapshot ? "Your current selection and notes are unchanged." : "No substitute data is shown."}`
    : "";

  let text;
  if (loading === "live") text = "Requesting the bounded DC 311 snapshot…";
  else if (loading === "demo") text = "Loading the fictional sample…";
  else if (demo) text = `Fictional practice case · ${plural(snapshot.records.length, "report")} · no map locations`;
  else if (snapshot) {
    const geometry = snapshot.geometry ?? summarizeGeometry(snapshot.records);
    const boundary = snapshot.boundary;
    const boundaryText = boundary?.status === "checked"
      ? `${boundary.outside} outside the Ward 8 boundary${boundary.unchecked ? ` · ${boundary.unchecked} not checked (no location)` : ""}`
      : "Ward 8 boundary check unavailable";
    const retrieved = new Date(snapshot.retrievedAt).toLocaleString("en-US", { timeZone: "America/New_York", dateStyle: "medium", timeStyle: "short" });
    text = `DC 311 · retrieved ${retrieved} ET · ${snapshot.window.start} to ${snapshot.window.endExclusive} (end exclusive) · ${plural(snapshot.records.length, "record")} · ${geometry.mapped} mapped, ${geometry.missing} missing, ${geometry.invalid} invalid location · ${boundaryText}`;
  } else text = "No source records loaded.";
  byId("freshness").textContent = text;

  byId("load-live").disabled = Boolean(loading);
  byId("load-demo").disabled = Boolean(loading);
  byId("load-live").setAttribute("aria-pressed", String(snapshot?.mode === "live"));
  byId("load-demo").setAttribute("aria-pressed", String(demo));
  byId("panel").inert = Boolean(loading);
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
  const key = `${state.snapshot?.retrievedAt}|${state.snapshot?.records.length}|${state.area.radiusM}`;
  if (key !== busyKey) {
    busyKey = key;
    busySpots = placed ? findBusySpots(state.snapshot.records, state.area.radiusM, 8) : [];
  }
  const center = state.area.center;
  const matching = busySpots.findIndex(spot => center && spot.center.lat === center.lat && spot.center.lon === center.lon);
  const placeholder = element("option", "", center && matching < 0 ? "Custom area from the map" : "Choose a spot…");
  placeholder.value = "";
  select.replaceChildren(placeholder, ...busySpots.map((spot, index) => {
    const option = element("option", "", `${areaBlockName({ ...state, area: { center: spot.center, radiusM: state.area.radiusM } })} · ${plural(spot.count, "report")}`);
    option.value = String(index);
    return option;
  }));
  select.value = matching >= 0 ? String(matching) : "";
  select.disabled = !placed;
}

function appendSourceField(list, label, value) {
  list.append(element("dt", "", label), element("dd", "", sourceText(value)));
}

function recordRow(record, id) {
  const row = element("div", "record-choice");
  const date = element("div", "record-date");
  if (formatSourceDate(record.date) === "Date unavailable") {
    date.append(element("span", "", "Date"), element("strong", "", "—"));
  } else {
    const parsed = new Date(record.date);
    date.append(element("strong", "", new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "America/New_York" }).format(parsed)));
    date.append(element("span", "", new Intl.DateTimeFormat("en-US", { year: "numeric", timeZone: "America/New_York" }).format(parsed)));
  }
  row.append(date);

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
  head.append(address);
  const status = element("span", `status-pill status-${statusKind(record.status)}`, record.status || "Status unavailable");
  head.append(status);
  content.append(head);
  const meta = element("div", "record-meta");
  meta.append(element("span", "record-id", `Request ${sourceText(record.id)}`));
  if (record.outsideWard === true) meta.append(element("span", "flag", "Outside Ward 8 boundary"));
  content.append(meta);

  const details = element("details", "record-details");
  details.append(element("summary", "", "Show original record"));
  const fields = element("dl", "source-fields");
  for (const [label, value] of [
    ["Service request ID", record.attributes.SERVICEREQUESTID], ["Object ID", record.attributes.OBJECTID],
    ["Add date (source)", record.attributes.ADDDATE], ["Service due date", record.attributes.SERVICEDUEDATE],
    ["Resolution date", record.attributes.RESOLUTIONDATE], ["Official status", record.attributes.SERVICEORDERSTATUS],
    ["Service code", record.attributes.SERVICECODE], ["Service description", record.attributes.SERVICECODEDESCRIPTION],
    ["Organization", record.attributes.ORGANIZATIONACRONYM], ["Ward label (source)", record.attributes.WARD],
    ["Street address", record.attributes.STREETADDRESS]
  ]) appendSourceField(fields, label, value);
  appendSourceField(fields, "Map point", record.geo ? `${record.geo.lat.toFixed(5)}, ${record.geo.lon.toFixed(5)} (approximate)` : record.geoStatus === "invalid" ? "Source point invalid; not mapped" : "No map point in the source");
  details.append(fields);
  const recordUrl = sourceRecordUrl(record, state.snapshot?.mode);
  if (recordUrl) {
    const link = element("a", "source-link", "Open this record at DC 311");
    link.href = recordUrl;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    details.append(link);
  }
  content.append(details);
  row.append(content);
  return row;
}

function renderScope() {
  renderScopeControls();
  const candidates = candidateRecords(state);
  const inScope = areaRecords(state);
  const hidden = inScope.length - candidates.length;
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

  if (plottedSnapshot !== state.snapshot) {
    plottedSnapshot = state.snapshot;
    map.setRecords(state.snapshot?.records ?? []);
  }
  map.setArea(state.area.center, state.area.radiusM, { pan: !loading });
  renderSelection();
}

function renderSelection() {
  const selected = state.snapshot?.records.filter(record => state.selectedIds.has(record.key)) ?? [];
  byId("selected-count").textContent = `${state.selectedIds.size} selected`;
  byId("confirm-review").disabled = state.selectedIds.size === 0 || Boolean(loading);
  byId("review-check").hidden = !state.reviewConfirmed;
  byId("review-status").textContent = state.selectedIds.size === 0
    ? "Select at least one report before confirming."
    : state.reviewConfirmed
      ? "Source list confirmed. Any change to the evidence clears this confirmation."
      : "Inspect the source fields, then confirm the records for this draft.";

  const statuses = new Map();
  for (const record of selected) statuses.set(record.status || "Status unknown", (statuses.get(record.status || "Status unknown") || 0) + 1);
  byId("t-city").textContent = selected.length ? `${[...statuses].map(([status, count]) => `${count} ${status}`).join(" · ")} (as published)` : "No reports selected";
  byId("t-group").textContent = state.reviewConfirmed ? `Source list confirmed · ${plural(selected.length, "report")}` : "Source list not confirmed yet";
  byId("t-resident").textContent = state.observation.trim()
    ? (state.observedOn ? `Group observation · ${state.observedOn}` : "Group observation · date needed")
    : "No resident observation yet";

  for (const box of document.querySelectorAll("#record-list input[type=checkbox], #unplaced-list input[type=checkbox]")) box.checked = state.selectedIds.has(box.dataset.key);
  map.restyle({
    selectedKeys: state.selectedIds,
    visibleKeys: new Set(visibleRecords(state).map(record => record.key))
  });
  renderBrief();
}

function appendBriefSection(paper, title, content) {
  paper.append(element("h5", "", title));
  paper.append(element("p", "paper-block", content));
}

function renderBrief() {
  const paper = byId("brief-paper");
  paper.replaceChildren();
  const hasSelected = Boolean(state.snapshot && state.selectedIds.size);
  byId("download-brief").disabled = !canExportBrief(state) || Boolean(loading);
  byId("print-brief").disabled = !canExportBrief(state) || Boolean(loading);

  if (!hasSelected) {
    paper.append(element("p", "empty-message", "Select at least one source report to prepare a brief."));
    byId("export-status").textContent = "A brief needs at least one selected source record.";
    return;
  }

  const content = buildBriefContent(state);
  const brand = element("div", "paper-brand");
  brand.append(element("strong", "", "block ops."), element("span", "", "Neighborhood brief"));
  paper.append(brand);
  paper.append(element("h4", "", state.area.center ? (areaBlockName(state) ?? "Our neighborhood brief") : "Our neighborhood brief"));
  const metadata = [content.sourceLabel, content.reviewLabel];
  if (content.retrievedAt) metadata.push(`Retrieved ${content.retrievedAt}`);
  if (content.window) metadata.push(`${content.window.start} through ${content.window.endExclusive} (end exclusive)`);
  paper.append(element("p", "paper-meta", metadata.join(" · ")));
  if (content.scope) paper.append(element("p", "paper-meta", `Selection scope: ${content.scope}`));

  paper.append(element("h5", "", `Selected service requests (${content.records.length})`));
  const recordList = element("ul", "paper-list");
  for (const record of content.records) {
    const item = element("li", "", `${record.address} · ${record.id} · ${record.date} · Official status: ${record.status}`);
    if (record.locationNote) item.append(document.createElement("br"), element("em", "", record.locationNote));
    if (record.sourceUrl) {
      const link = element("a", "source-link", "Original source record");
      link.href = record.sourceUrl;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      item.append(document.createElement("br"), link);
    }
    recordList.append(item);
  }
  paper.append(recordList);
  appendBriefSection(paper, "Group observation", content.observation
    ? `Group-provided observation (${content.observation.date}): ${content.observation.text}`
    : "No group observation provided; current conditions are unverified.");
  appendBriefSection(paper, "Request", content.request);
  paper.append(element("h5", "", "Next-step tasks"));
  for (const task of content.tasks) paper.append(element("p", "paper-task", `${task.role}: ${task.task}`));
  appendBriefSection(paper, "Source appendix", content.sourceUrl
    ? `DC 311 FeatureServer/21. Original service request IDs are listed above. ${content.sourceUrl}`
    : "Fictional demonstration records only; no official source record is represented.");
  if (content.locationCaveat) paper.append(element("p", "paper-note", content.locationCaveat));
  paper.append(element("p", "paper-note", content.caveat));

  byId("export-status").textContent = canExportBrief(state)
    ? "Ready. The download includes the current selected records and plan."
    : state.selectedIds.size && !state.reviewConfirmed
      ? "Confirm the source list before downloading or printing."
      : state.observation.trim() && !state.observedOn
        ? "Add the observation date, or leave the observation blank if it is unknown."
        : "Complete the request and both role-based tasks to export.";
}

function render() {
  renderFreshness();
  renderScope();
}

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

async function load(mode) {
  loading = mode;
  renderFreshness();
  byId("confirm-review").disabled = true;
  state = await refreshWorkspace(state, mode === "live" ? loadLiveSnapshot : loadDemoSnapshot);
  syncObservationInputs();
  loading = "";
  render();
  if (!state.refreshError) showView("evidence");
}

byId("observed-on").value = state.observedOn;
byId("observation").value = state.observation;
byId("ask").value = state.ask;
byId("task-one-role").value = state.tasks[0].role;
byId("task-one-action").value = state.tasks[0].task;
byId("task-two-role").value = state.tasks[1].role;
byId("task-two-action").value = state.tasks[1].task;

byId("load-live").addEventListener("click", () => load("live"));
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
  syncObservationInputs();
  renderScope();
});

byId("confirm-review").addEventListener("click", () => {
  state = confirmSourceReview(state);
  renderSelection();
  if (state.reviewConfirmed) showView("plan", true);
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

const updateObservation = () => {
  state.observation = byId("observation").value;
  state.observedOn = byId("observed-on").value;
  renderSelection();
};
byId("observation").addEventListener("input", updateObservation);
byId("observed-on").addEventListener("input", updateObservation);
byId("ask").addEventListener("input", () => { state.ask = byId("ask").value; renderBrief(); });
byId("task-one-role").addEventListener("input", () => { state.tasks[0].role = byId("task-one-role").value; renderBrief(); });
byId("task-one-action").addEventListener("input", () => { state.tasks[0].task = byId("task-one-action").value; renderBrief(); });
byId("task-two-role").addEventListener("input", () => { state.tasks[1].role = byId("task-two-role").value; renderBrief(); });
byId("task-two-action").addEventListener("input", () => { state.tasks[1].task = byId("task-two-action").value; renderBrief(); });

byId("download-brief").addEventListener("click", () => {
  if (!canExportBrief(state)) return;
  const blob = new Blob([buildBriefMarkdown(state)], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = element("a");
  link.href = url;
  link.download = "block-ops-brief.md";
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
});
byId("print-brief").addEventListener("click", () => {
  if (canExportBrief(state)) window.print();
});

render();
load("live");
