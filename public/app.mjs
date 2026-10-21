import {
  buildBriefContent,
  buildBriefMarkdown,
  canExportBrief,
  confirmSourceReview,
  formatSourceDate,
  normalizeStreet,
  normalizeFeatureSet,
  refreshDraft,
  sourceRecordUrl,
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

function displayAddress(value) {
  return sourceText(value).toLocaleLowerCase("en-US")
    .replace(/\b[a-z]/g, letter => letter.toUpperCase())
    .replace(/\b(?:se|sw|ne|nw)\b/gi, direction => direction.toUpperCase());
}

function showView(view, focus = false) {
  if (!["review", "plan", "brief"].includes(view)) return;
  byId("workspace-grid").hidden = view === "brief";
  for (const name of ["review", "plan", "brief"]) {
    byId(`${name}-panel`).hidden = name !== view;
    byId(`${name}-tab`).setAttribute("aria-selected", String(name === view));
  }
  if (focus) {
    byId(`${view}-tab`).focus({ preventScroll: true });
    byId("worktable").scrollIntoView({ block: "start", behavior: "instant" });
  }
}

function syncObservationInputs() {
  byId("observation").value = state.observation;
  byId("observed-on").value = state.observedOn;
}

function renderCompanion() {
  const selected = state.snapshot?.records.filter(record => state.selectedIds.has(record.key)) || [];
  byId("summary-count").textContent = String(selected.length);
  byId("selection-ticks").replaceChildren(...selected.slice(0, 24).map(() => element("span")));
  byId("companion-status").textContent = canExportBrief(state) ? "Ready to share" : state.reviewConfirmed ? "Sources reviewed" : "In review";
  const statuses = new Map();
  for (const record of selected) {
    const status = record.status || "Status unknown";
    statuses.set(status, (statuses.get(status) || 0) + 1);
  }
  byId("official-summary").textContent = selected.length
    ? [...statuses].map(([status, count]) => `${count} ${status}`).join(" · ")
    : "No records selected";
  byId("condition-summary").textContent = state.observation.trim()
    ? (state.observedOn ? `Group observation · ${state.observedOn}` : "Group observation · date needed")
    : "Not yet verified by the group";
}

function renderSnapshotStatus() {
  const demo = state.snapshot?.mode === "demo";
  byId("sample-notice").hidden = !demo;
  byId("sample-notice").textContent = demo
    ? "Practice case · All sample reports and addresses are fictional."
    : "";
  byId("error-notice").hidden = !state.refreshError;
  byId("error-notice").textContent = state.refreshError
    ? `${state.refreshError} The current draft remains unchanged.`
    : "";

  if (loading === "live") byId("snapshot-status").textContent = "Requesting the bounded DC 311 snapshot…";
  else if (loading === "demo") byId("snapshot-status").textContent = "Loading the fictional sample…";
  else if (demo) byId("snapshot-status").textContent = `Fictional practice · ${state.snapshot.records.length} reports`;
  else if (state.snapshot?.mode === "live") {
    byId("snapshot-status").textContent = `${state.snapshot.records.length} public records · retrieved ${formatSourceDate(state.snapshot.retrievedAt)}. Query window: ${state.snapshot.window.start} to ${state.snapshot.window.endExclusive} (end exclusive).`;
  } else byId("snapshot-status").textContent = "No source records loaded.";

  byId("load-live").disabled = Boolean(loading);
  byId("load-demo").disabled = Boolean(loading);
  byId("load-demo").setAttribute("aria-pressed", String(demo));
  byId("load-live").setAttribute("aria-pressed", String(state.snapshot?.mode === "live"));
  byId("worktable").inert = Boolean(loading);
  byId("worktable").setAttribute("aria-busy", String(Boolean(loading)));
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
    byId("case-title").textContent = "No reports to review.";
    return;
  }
  for (const group of state.groups) {
    const street = normalizeStreet(group.records[0]?.address);
    const option = element("option", "", `${street ? displayAddress(street) : group.label} (${group.records.length})`);
    option.value = group.key;
    select.append(option);
  }
  select.value = state.activeGroupKey;
  select.disabled = Boolean(loading);
  const activeGroup = state.groups.find(group => group.key === state.activeGroupKey);
  byId("case-title").textContent = displayAddress(normalizeStreet(activeGroup?.records[0]?.address) || "A history worth checking.");
  byId("group-hint").textContent = "Same street and category. Review each address; a match is not proof of one incident.";
}

function appendSourceField(list, label, value) {
  list.append(element("dt", "", label), element("dd", "", sourceText(value)));
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
    checkbox.id = `record-${container.children.length}`;
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
    const address = element("label", "record-address", displayAddress(record.address || "Address unavailable"));
    address.htmlFor = checkbox.id;
    head.append(address);
    const status = element("span", "status-pill", record.status || "Status unavailable");
    if (String(record.status || "").toLocaleLowerCase("en-US").startsWith("closed")) status.classList.add("status-closed");
    head.append(status);
    content.append(head);

    content.append(element("span", "record-id", `Request ${sourceText(record.id)}`));
    row.append(content);

    const details = element("details", "record-details");
    details.append(element("summary", "", "Show original record"));
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
    const recordUrl = sourceRecordUrl(record, state.snapshot?.mode);
    if (recordUrl) {
      const link = element("a", "source-link", "Open this record at DC 311");
      link.href = recordUrl;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      details.append(link);
    }
    content.append(details);
    container.append(row);
  }
}

function renderReviewStatus() {
  const selectedCount = state.selectedIds.size;
  byId("selected-count").textContent = `${selectedCount} selected`;
  byId("confirm-review").disabled = selectedCount === 0 || Boolean(loading);
  byId("review-check").hidden = !state.reviewConfirmed;
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
  renderCompanion();
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
  brand.append(element("strong", "", "block ops."), element("span", "", "Neighborhood worktable"));
  paper.append(brand);
  paper.append(element("h4", "", "Our neighborhood brief"));
  const metadata = [content.sourceLabel, content.reviewLabel];
  if (content.retrievedAt) metadata.push(`Retrieved ${content.retrievedAt}`);
  if (content.window) metadata.push(`${content.window.start} through ${content.window.endExclusive} (end exclusive)`);
  paper.append(element("p", "paper-meta", metadata.join(" · ")));

  paper.append(element("h5", "", `Selected service requests (${content.records.length})`));
  const recordList = element("ul", "paper-list");
  for (const record of content.records) {
    const item = element("li", "", `${record.address} · ${record.id} · ${record.date} · Official status: ${record.status}`);
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
  syncObservationInputs();
  loading = "";
  render();
  if (!state.refreshError) showView("review");
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
  syncObservationInputs();
  loading = "";
  render();
  if (!state.refreshError) showView("review");
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
  syncObservationInputs();
  renderGroups();
  renderRecords();
  renderReviewStatus();
  renderBrief();
});
byId("confirm-review").addEventListener("click", () => {
  state = confirmSourceReview(state);
  renderReviewStatus();
  renderBrief();
  if (state.reviewConfirmed) showView("plan", true);
});

document.querySelectorAll("[data-view]").forEach(button => {
  button.addEventListener("click", () => showView(button.dataset.view, true));
});
const tabs = [...document.querySelectorAll('.step-button[role="tab"]')];
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
