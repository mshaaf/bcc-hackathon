import {
  SERVICE_LAYER_URL,
  buildBriefContent,
  buildBriefMarkdown,
  canExportBrief,
  confirmSourceReview,
  formatSourceDate,
  normalizeStreet,
  normalizeFeatureSet,
  refreshDraft,
  selectCandidateGroup,
  setRecordIncluded
} from "/lib/block-ops.mjs";

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
  ]
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

function renderSnapshotStatus() {
  const demo = state.snapshot?.mode === "demo";
  byId("sample-notice").hidden = !demo;
  byId("sample-notice").textContent = demo
    ? "Fictional demo data. Every sample ticket and address is invented; none are DC records."
    : "";
  byId("error-notice").hidden = !state.refreshError;
  byId("error-notice").textContent = state.refreshError
    ? `${state.refreshError} The current draft remains unchanged.`
    : "";

  if (loading === "live") byId("snapshot-status").textContent = "Requesting the bounded DC 311 snapshot…";
  else if (loading === "demo") byId("snapshot-status").textContent = "Loading the fictional sample…";
  else if (demo) byId("snapshot-status").textContent = `${state.snapshot.records.length} invented records · offline sample`;
  else if (state.snapshot?.mode === "live") {
    byId("snapshot-status").textContent = `${state.snapshot.records.length} live records · retrieved ${state.snapshot.retrievedAt} · ${state.snapshot.window.start} to ${state.snapshot.window.endExclusive} (end exclusive)`;
  } else byId("snapshot-status").textContent = "No source records loaded.";

  byId("load-live").disabled = Boolean(loading);
  byId("load-demo").disabled = Boolean(loading);
}

function renderGroups() {
  const select = byId("group-select");
  select.replaceChildren();
  if (!state.groups.length) {
    const option = element("option", "", "No candidate groups available");
    option.value = "";
    select.append(option);
    select.disabled = true;
    byId("group-hint").textContent = "Load records to review source history.";
    return;
  }
  for (const group of state.groups) {
    const option = element("option", "", `${group.label} (${group.records.length})`);
    option.value = group.key;
    select.append(option);
  }
  select.value = state.activeGroupKey;
  select.disabled = Boolean(loading);
  const activeGroup = state.groups.find(group => group.key === state.activeGroupKey);
  byId("group-hint").textContent = activeGroup?.explanation || "Inspect the original source fields before including records.";
}

function appendSourceField(list, label, value) {
  list.append(element("dt", "", label), element("dd", "", sourceText(value)));
}

function sourceRecordUrl(record) {
  if (state.snapshot?.mode !== "live") return null;
  const url = new URL(`${SERVICE_LAYER_URL}/query`);
  const objectId = Number(record.objectId);
  if (Number.isSafeInteger(objectId)) url.searchParams.set("where", `OBJECTID=${objectId}`);
  else if (record.id) url.searchParams.set("where", `SERVICEREQUESTID='${String(record.id).replace(/'/g, "''")}'`);
  else return null;
  url.searchParams.set("f", "json");
  url.searchParams.set("returnGeometry", "false");
  url.searchParams.set("outFields", "OBJECTID,SERVICEREQUESTID,SERVICECODE,SERVICECODEDESCRIPTION,ADDDATE,SERVICEDUEDATE,RESOLUTIONDATE,SERVICEORDERSTATUS,ORGANIZATIONACRONYM,WARD,STREETADDRESS");
  return url.toString();
}

function renderRecords() {
  const container = byId("record-list");
  container.replaceChildren();
  const group = state.groups.find(candidate => candidate.key === state.activeGroupKey);
  if (!group) {
    container.append(element("p", "empty-message", "No records are available. Load the sample or request live data."));
    return;
  }

  for (const record of group.records) {
    const row = element("div", "record-choice");
    const checkbox = element("input");
    checkbox.type = "checkbox";
    checkbox.checked = state.selectedIds.has(record.key);
    checkbox.setAttribute("aria-label", `Include service request ${sourceText(record.id)}`);
    checkbox.addEventListener("change", () => {
      state = setRecordIncluded(state, record.key, checkbox.checked);
      renderReviewStatus();
      renderBrief();
    });
    row.append(checkbox);

    const content = element("div", "record-content");
    const head = element("div", "record-head");
    head.append(element("span", "record-id", `Request ${sourceText(record.id)}`));
    const status = element("span", "status-pill", record.status || "Status unavailable");
    if (String(record.status || "").toLocaleLowerCase("en-US").startsWith("closed")) status.classList.add("status-closed");
    head.append(status);
    content.append(head);

    const meta = element("div", "record-meta");
    meta.append(element("span", "", `Date: ${formatSourceDate(record.date)}`));
    meta.append(element("span", "", `Street: ${normalizeStreet(record.address) || "Address unavailable"}`));
    content.append(meta);
    row.append(content);

    const details = element("details", "record-details");
    details.append(element("summary", "", "Inspect original source fields"));
    const fields = element("dl", "source-fields");
    appendSourceField(fields, "Service request ID", record.attributes.SERVICEREQUESTID);
    appendSourceField(fields, "Object ID", record.attributes.OBJECTID);
    appendSourceField(fields, "Add date (source)", record.attributes.ADDDATE);
    appendSourceField(fields, "Service due date", record.attributes.SERVICEDUEDATE);
    appendSourceField(fields, "Resolution date", record.attributes.RESOLUTIONDATE);
    appendSourceField(fields, "Official status", record.attributes.SERVICEORDERSTATUS);
    appendSourceField(fields, "Service code", record.attributes.SERVICECODE);
    appendSourceField(fields, "Service description", record.attributes.SERVICECODEDESCRIPTION);
    appendSourceField(fields, "Organization", record.attributes.ORGANIZATIONACRONYM);
    appendSourceField(fields, "Ward", record.attributes.WARD);
    appendSourceField(fields, "Street address", record.attributes.STREETADDRESS);
    details.append(fields);
    const recordUrl = sourceRecordUrl(record);
    if (recordUrl) {
      const link = element("a", "source-link", "Open this record at DC 311");
      link.href = recordUrl;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      details.append(link);
    }
    row.append(details);
    container.append(row);
  }
}

function renderReviewStatus() {
  const selectedCount = state.selectedIds.size;
  byId("selected-count").textContent = `${selectedCount} selected`;
  byId("confirm-review").disabled = selectedCount === 0 || Boolean(loading);
  byId("review-status").textContent = selectedCount === 0
    ? "Select at least one source record before confirming."
    : state.reviewConfirmed
      ? "Source list confirmed. Any record change will clear this confirmation."
      : "Inspect the source fields, then confirm the records for this draft.";
}

function appendBriefSection(paper, title, content) {
  paper.append(element("h5", "", title));
  const paragraph = element("p", "paper-block", content);
  paper.append(paragraph);
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
  paper.append(element("h4", "", "Block Ops neighborhood brief"));
  const metadata = [content.sourceLabel, content.reviewLabel];
  if (content.retrievedAt) metadata.push(`Retrieved ${content.retrievedAt}`);
  if (content.window) metadata.push(`${content.window.start} through ${content.window.endExclusive} (end exclusive)`);
  paper.append(element("p", "paper-meta", metadata.join(" · ")));

  paper.append(element("h5", "", `Selected service requests (${content.records.length})`));
  const recordList = element("ul", "paper-list");
  for (const record of content.records) {
    recordList.append(element("li", "", `${record.id} · ${record.date} · Official status: ${record.status} · ${record.category}`));
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
  paper.append(element("p", "paper-note", content.caveat));

  byId("export-status").textContent = canExportBrief(state)
    ? "Ready. The download includes the current selected records and plan."
    : state.selectedIds.size && !state.reviewConfirmed
      ? "Confirm the source list before downloading or printing."
      : "Complete the request and both role-based tasks to export.";
}

function render() {
  renderSnapshotStatus();
  renderGroups();
  renderRecords();
  renderReviewStatus();
  renderBrief();
}

async function readJson(url) {
  const response = await fetch(url, { cache: "no-store" });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || `Request failed with HTTP ${response.status}.`);
  return body;
}

async function loadLive() {
  loading = "live";
  render();
  state = await refreshDraft(state, () => readJson("/api/requests"));
  loading = "";
  render();
}

async function loadDemo() {
  loading = "demo";
  render();
  state = await refreshDraft(state, async () => {
    const fixture = await readJson("/api/demo");
    if (fixture.mode !== "demo" || fixture.fictional !== true) throw new Error("The offline sample is not labeled as fictional.");
    return {
      mode: "demo",
      sourceUrl: null,
      retrievedAt: null,
      window: null,
      records: normalizeFeatureSet(fixture)
    };
  });
  loading = "";
  render();
}

byId("observed-on").value = state.observedOn;
byId("observation").value = state.observation;
byId("ask").value = state.ask;
byId("task-one-role").value = state.tasks[0].role;
byId("task-one-action").value = state.tasks[0].task;
byId("task-two-role").value = state.tasks[1].role;
byId("task-two-action").value = state.tasks[1].task;

byId("load-live").addEventListener("click", loadLive);
byId("load-demo").addEventListener("click", loadDemo);
byId("group-select").addEventListener("change", event => {
  state = selectCandidateGroup(state, event.target.value);
  renderRecords();
  renderReviewStatus();
  renderBrief();
});
byId("confirm-review").addEventListener("click", () => {
  state = confirmSourceReview(state);
  renderReviewStatus();
  renderBrief();
});

const updateObservation = () => {
  state.observation = byId("observation").value;
  state.observedOn = byId("observed-on").value;
  renderBrief();
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
loadDemo();
