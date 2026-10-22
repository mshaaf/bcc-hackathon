// Pure mission rules: validation, publishing a reviewed local campaign, routes, progress and the current-state export.
import { formatSourceDate, markdownText, sourceDateValue, sourceRecordUrl } from "./block-ops.mjs";
import { OBSERVATION_KINDS, exportBlocker, isValidDay } from "./campaign.mjs";
import { areaRecurrence, recurrenceHeadline } from "./recurrence.mjs";

export const MISSION_LIMITS = { title: 120, objective: 1000, location: 200, task: 200, tasks: 30, observations: 50 };
export const MISSION_STATUSES = { planning: "Planning", scheduled: "Scheduled", in_progress: "In progress", follow_up: "Follow-up", archived: "Archived" };
export const POST_KINDS = { discussion: "Discussion", update: "Progress update", observation: "Site observation" };
export const NO_RECORDS_LINE = "No official 311 records attached.";

const chars = value => [...String(value ?? "")].length;
const clean = value => String(value ?? "").trim();

export function cleanMissionFields({ title, objective, location, startsAt }) {
  const errors = {};
  const out = { title: clean(title), objective: clean(objective), location: clean(location), startsAt: null };
  if (!out.title) errors.title = "Give the mission a short title.";
  else if (chars(out.title) > MISSION_LIMITS.title) errors.title = `Titles can be up to ${MISSION_LIMITS.title} characters.`;
  if (!out.objective) errors.objective = "Say what the group wants to achieve.";
  else if (chars(out.objective) > MISSION_LIMITS.objective) errors.objective = `The goal can be up to ${MISSION_LIMITS.objective.toLocaleString("en-US")} characters.`;
  if (!out.location) errors.location = "Name the place in public terms, for example a block or intersection.";
  else if (chars(out.location) > MISSION_LIMITS.location) errors.location = `Locations can be up to ${MISSION_LIMITS.location} characters.`;
  if (startsAt) {
    const time = new Date(startsAt);
    if (Number.isNaN(time.getTime())) errors.startsAt = "That date and time is not valid.";
    else out.startsAt = time.toISOString();
  }
  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, value: out };
}

// One job per line; blank lines ignored.
export function parseTaskLines(text) {
  const lines = String(text ?? "").split(/\r?\n/).map(clean).filter(Boolean);
  if (lines.length > MISSION_LIMITS.tasks) return { ok: false, error: `A mission can start with up to ${MISSION_LIMITS.tasks} jobs.` };
  const long = lines.find(line => chars(line) > MISSION_LIMITS.task);
  if (long) return { ok: false, error: `Each job can be up to ${MISSION_LIMITS.task} characters; “${[...long].slice(0, 30).join("")}…” is too long.` };
  return { ok: true, tasks: lines.map(description => ({ description })) };
}

export function missionProgress(tasks) {
  const done = tasks.filter(task => task.done).length;
  const claimed = tasks.filter(task => task.claimedBy || task.claimedName).length;
  return { total: tasks.length, claimed, done, open: tasks.length - claimed };
}

// Add job: read the drafts once, send, then clear only the text that was sent. Text typed while the request was in flight
// (or a draft in another community, after navigation) survives. `clearSent(key, submitted)` is bound to the community the
// form belonged to when it was submitted.
export async function sendJob({ addTask, readDraft, clearSent, missionId, descKey, dueKey }) {
  const rawDescription = readDraft(descKey), rawDue = readDraft(dueKey);
  const description = rawDescription.trim();
  if (!description) return { ok: false, error: "Describe the job first." };
  if (chars(description) > MISSION_LIMITS.task) return { ok: false, error: `A job can be up to ${MISSION_LIMITS.task} characters.` };
  const task = await addTask({ missionId, description, due: rawDue || null });
  clearSent(descKey, rawDescription);
  clearSent(dueKey, rawDue);
  return { ok: true, task };
}

// Claiming and reporting completion are different actions: the claimant is shown separately, and "reported done" does not
// say who reported it (the organizer can report on a claimant's behalf, and the backend stores no reporter).
export function taskStatusText(task, { mine = false, doneTime = "" } = {}) {
  const claimant = task.claimedName ?? "someone";
  if (task.done) return `✓ Reported done · claimed by ${mine ? "you" : claimant}${doneTime ? ` · ${doneTime}` : ""}`;
  if (task.claimedName) return mine ? "You claimed this job" : `Claimed by ${task.claimedName}`;
  return "Unclaimed";
}

// Which actions a viewer is offered on one job, as ids in display order. The database enforces the same rules; this only keeps
// the screen from offering an action it will refuse. Finished jobs keep their historical claimant, so "mine" alone is not enough:
// a former participant (left the mission, still in the community) is refused, while the organizer can always act.
export function taskControls(task, { userId = null, member = false, organizer = false, archived = false } = {}) {
  if (archived) return [];
  if (!task.claimedName) return member ? ["claim"] : [];
  const mine = userId != null && task.claimedBy === userId;
  if (!organizer && !(mine && member)) return [];
  return task.done ? ["reopen"] : ["done", "release"];
}

// Plain-language announcements for changes other people made to one mission between two reads. Edits made by `userId` are
// skipped (their own action already announced itself).
export function describeSharedChanges(before, after, { missionId, userId }) {
  const said = [];
  const quote = text => `“${[...String(text)].slice(0, 40).join("")}${chars(text) > 40 ? "…" : ""}”`;
  const oldTasks = new Map(before.tasks.filter(task => task.missionId === missionId).map(task => [task.id, task]));
  for (const task of after.tasks.filter(item => item.missionId === missionId)) {
    const old = oldTasks.get(task.id);
    if (!old) { said.push(`New job: ${quote(task.description)}.`); continue; }
    if (!old.done && task.done) said.push(`${quote(task.description)} was reported done.`);
    else if (old.done && !task.done) said.push(`${quote(task.description)} was reopened.`);
    else if (!old.claimedName && task.claimedName && task.claimedBy !== userId) said.push(`${task.claimedName} claimed ${quote(task.description)}.`);
    else if (old.claimedName && !task.claimedName && old.claimedBy !== userId) said.push(`${quote(task.description)} is unclaimed again.`);
  }
  const oldMembers = new Map(before.members.filter(member => member.missionId === missionId).map(member => [member.userId, member]));
  const newMembers = new Map(after.members.filter(member => member.missionId === missionId).map(member => [member.userId, member]));
  for (const [id, member] of newMembers) if (!oldMembers.has(id) && id !== userId) said.push(`${member.displayName} joined the mission.`);
  for (const [id, member] of oldMembers) if (!newMembers.has(id) && id !== userId) said.push(`${member.displayName} left the mission.`);
  const oldMission = before.missions.find(item => item.id === missionId), newMission = after.missions.find(item => item.id === missionId);
  if (oldMission && newMission && newMission.version !== oldMission.version && newMission.organizerId !== userId) said.push("The organizer updated the mission details.");
  return said;
}

// ---------- row normalizers (database columns -> app objects) ----------

const text = value => (typeof value === "string" ? value : null);
const finite = value => (typeof value === "number" && Number.isFinite(value) ? value : null);

// Evidence arrives as JSON written by another member's browser: coerce every field to a plain primitive so a hostile or
// malformed record (an object where a string belongs) can never throw while the community loads or the plan exports.
const scalar = value => (typeof value === "string" ? value : finite(value) !== null ? String(value) : null);
const idLike = value => (typeof value === "string" ? value : finite(value));
const dateLike = value => (typeof value === "string" || finite(value) !== null ? value : null);
export function normalizeEvidence(items) {
  return (Array.isArray(items) ? items : []).filter(item => item && typeof item === "object" && typeof item.key === "string").map(item => ({
    key: item.key, id: scalar(item.id), objectId: idLike(item.objectId),
    category: text(item.category), address: text(item.address), date: dateLike(item.date), status: text(item.status), agency: text(item.agency), ward: text(item.ward),
    geo: item.geo && typeof item.geo === "object" && finite(item.geo.lat) !== null && finite(item.geo.lon) !== null ? { lat: item.geo.lat, lon: item.geo.lon } : null,
    outsideWard: item.outsideWard === true, changedSinceReview: item.changedSinceReview === true, previousStatus: text(item.previousStatus)
  }));
}

// One malformed row must never break the whole community load: drop rows that fail to normalize and say so in the console.
export function normalizeRows(rows, normalize, label = "row") {
  const out = [];
  for (const row of Array.isArray(rows) ? rows : []) {
    try { out.push(normalize(row)); } catch (error) { console.warn(`Skipped a malformed shared ${label}:`, error?.message ?? error); }
  }
  return out;
}

export function normalizeSource(source) {
  if (!source || typeof source !== "object") return null;
  const mode = ["live", "recorded", "demo"].includes(source.mode) ? source.mode : null;
  if (!mode) return null;
  const window = source.window && typeof source.window === "object" ? { start: text(source.window.start), endExclusive: text(source.window.endExclusive) } : null;
  return { mode, sourceUrl: text(source.sourceUrl), retrievedAt: text(source.retrievedAt), window, campaignName: text(source.campaignName), reviewedAt: text(source.reviewedAt), radiusM: finite(source.radiusM) };
}

export function normalizeMission(row) {
  return {
    id: row.id, communityId: row.community_id, organizerId: row.organizer_id, organizerName: row.organizer_name,
    title: row.title, objective: row.objective, location: row.location_text, startsAt: row.starts_at ?? null,
    status: MISSION_STATUSES[row.status] ? row.status : "planning", origin: row.origin, sourcePostId: row.source_post_id ?? null,
    source: normalizeSource(row.source), evidence: normalizeEvidence(row.evidence), version: row.version,
    activityAt: row.activity_at, createdAt: row.created_at
  };
}
export const normalizeMissionMember = row => ({ missionId: row.mission_id, communityId: row.community_id, userId: row.user_id, displayName: row.display_name, joinedAt: row.joined_at });
export const normalizeTask = row => ({
  id: row.id, missionId: row.mission_id, communityId: row.community_id, description: row.description, due: row.due_date ?? null, position: row.position,
  claimedBy: row.claimed_by ?? null, claimedName: row.claimed_name ?? null, claimedAt: row.claimed_at ?? null, done: row.done === true, doneAt: row.done_at ?? null,
  imported: row.imported === true, createdAt: row.created_at
});

// ---------- publishing a reviewed local campaign ----------

// A deliberate copy: evidence still in the reviewed campaign, task text (never typed owners or done flags), and only the
// observations the organizer ticks. The local campaign object is read, never changed.
export function publishPayloadFromCampaign(campaign, { observationIds = [] } = {}) {
  const blocker = exportBlocker(campaign);
  if (blocker) return { ok: false, error: `This campaign is not ready to share. ${blocker}` };
  const tasks = campaign.tasks.map(task => ({ description: clean(task.text), due: task.due || "" })).filter(task => task.description);
  if (tasks.length > MISSION_LIMITS.tasks) return { ok: false, error: `A mission can start with up to ${MISSION_LIMITS.tasks} jobs; this campaign has ${tasks.length}.` };
  const longTask = tasks.find(task => chars(task.description) > MISSION_LIMITS.task);
  if (longTask) return { ok: false, error: `A job is longer than ${MISSION_LIMITS.task} characters: “${[...longTask.description].slice(0, 30).join("")}…”. Shorten it in the campaign first.` };
  const wanted = new Set(observationIds);
  const observations = campaign.observations.filter(item => wanted.has(item.id)).sort((left, right) => left.date.localeCompare(right.date)).map(item => ({
    date: item.date, text: clean(item.text), fictional: item.fictional === true, kind: item.kind, kindLabel: OBSERVATION_KINDS[item.kind] ?? "Observation"
  }));
  if (observations.length > MISSION_LIMITS.observations) return { ok: false, error: `At most ${MISSION_LIMITS.observations} observations can be shared.` };
  if (observations.some(item => !item.text || chars(item.text) > 2000 || !isValidDay(item.date))) return { ok: false, error: "A selected observation has no text, is over 2,000 characters, or has an invalid date." };
  const fields = cleanMissionFields({ title: campaign.name, objective: campaign.objective || campaign.name, location: campaign.name });
  if (!fields.ok) return { ok: false, error: Object.values(fields.errors).join(" ") };
  return {
    ok: true,
    payload: {
      origin: "local_campaign", ...fields.value,
      source: {
        mode: campaign.source.mode, sourceUrl: campaign.source.sourceUrl ?? null, retrievedAt: campaign.source.retrievedAt ?? null, window: campaign.source.window ?? null,
        campaignName: campaign.name, reviewedAt: campaign.request.confirmedAt, radiusM: campaign.area?.radiusM ?? null
      },
      evidence: campaign.evidence.map(item => ({
        key: item.key, id: item.id ?? null, objectId: item.objectId ?? null, category: item.category ?? null, address: item.address ?? null, date: item.date ?? null,
        status: item.status ?? null, agency: item.agency ?? null, ward: item.ward ?? null, geo: item.geo ?? null, outsideWard: item.outsideWard === true
      })),
      tasks, observations
    },
    summary: {
      evidence: campaign.evidence.length, tasks: tasks.length, observations: observations.length,
      droppedOwners: campaign.tasks.filter(task => clean(task.owner)).length, droppedDone: campaign.tasks.filter(task => task.done).length,
      unsharedObservations: campaign.observations.length - observations.length
    }
  };
}

// ---------- routes ----------

const UUID_PART = "[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}";
const isId = value => new RegExp(`^${UUID_PART}$`).test(value ?? "");

// #/map | #/missions[/new|/publish] | #/community[/<id>[/missions[/new|/publish]|/mission/<id>]]  (+ ?post=<id> | ?campaign=<local id>)
export function parseRoute(hash) {
  const raw = String(hash ?? "").replace(/^#/, "");
  const [pathPart, query = ""] = raw.split("?");
  const parts = pathPart.split("/").filter(Boolean);
  const params = new URLSearchParams(query);
  const base = { section: "community", view: "feed", communityId: null, missionId: null, postId: null, campaignId: null };
  if (parts[0] === "map") return { section: "map" };
  let rest = parts;
  if (parts[0] === "community") {
    if (parts[1] && !isId(parts[1])) return { ...base, view: "invalid" };
    base.communityId = parts[1] ?? null;
    rest = parts.slice(2);
  } else if (parts[0] !== "missions") return base;
  if (!rest.length) return { ...base, postId: isId(params.get("post")) ? params.get("post") : null };
  if (rest[0] === "missions") {
    const sub = rest[1];
    const view = sub === "new" ? "new" : sub === "publish" ? "publish" : "missions";
    if (sub && !["new", "publish"].includes(sub)) return { ...base, view: "invalid" };
    return { ...base, view, postId: isId(params.get("post")) ? params.get("post") : null, campaignId: params.get("campaign") || null };
  }
  if (rest[0] === "mission") return isId(rest[1]) ? { ...base, view: "mission", missionId: rest[1] } : { ...base, view: "invalid" };
  return { ...base, view: "invalid" };
}

export const communityHash = communityId => `#/community/${communityId}`;
export const postHash = (communityId, postId) => `#/community/${communityId}?post=${postId}`;
export const missionsHash = communityId => `#/community/${communityId}/missions`;
export const newMissionHash = (communityId, postId = null) => `#/community/${communityId}/missions/new${postId ? `?post=${postId}` : ""}`;
export const publishHash = (communityId, campaignId) => `#/community/${communityId}/missions/publish?campaign=${encodeURIComponent(campaignId)}`;
export const missionHash = (communityId, missionId) => `#/community/${communityId}/mission/${missionId}`;
export const isLocalOrigin = value => { try { return ["localhost", "127.0.0.1", "[::1]", "::1", "0.0.0.0"].includes(new URL(value).hostname) || /\.local$/.test(new URL(value).hostname); } catch { return true; } };

// ---------- export of the CURRENT shared state ----------

const shortDay = value => new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "America/New_York" }).format(new Date(value));
const when = value => (value ? new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "America/New_York" }).format(new Date(value)) + " ET" : "Not set");

// `bundle` must come from a fresh read of the permitted rows: { mission, members, tasks, posts, communityTitle, exportedAt }.
export function buildMissionMarkdown(bundle) {
  const { mission, members, tasks, posts, communityTitle } = bundle;
  const progress = missionProgress(tasks);
  const sourced = mission.evidence.length > 0;
  const source = mission.source;
  const lines = [`# ${markdownText(mission.title)}`, "", `**Community:** ${markdownText(communityTitle)}`, `**Organizer:** ${markdownText(mission.organizerName)}`,
    `**Location (as described by the organizer):** ${markdownText(mission.location)}`, `**Time:** ${markdownText(when(mission.startsAt))}`,
    `**Status set by the organizer:** ${MISSION_STATUSES[mission.status]}`, `**Goal:** ${markdownText(mission.objective)}`, "",
    `Exported from the shared mission at ${markdownText(bundle.exportedAt)}. This reflects the shared state at that moment.`];

  lines.push("", "## Jobs and commitments", "");
  if (!tasks.length) lines.push("No jobs have been added yet.");
  for (const task of tasks) {
    const who = task.claimedName ? `claimed by ${markdownText(task.claimedName)}` : "unclaimed";
    lines.push(`- [${task.done ? "x" : " "}] ${markdownText(task.description)} — ${who}${task.done ? " (reported done by the claimant or organizer)" : ""}${task.due ? `; due ${markdownText(task.due)}` : ""}${task.imported ? "; imported from a local campaign (it started unclaimed)" : ""}`);
  }
  lines.push("", `Group progress: ${progress.done} of ${progress.total} jobs reported done; ${progress.claimed} claimed; ${progress.open} unclaimed. A job marked done is a participant's report, not a verified result.`);

  lines.push("", "## Participants", "");
  lines.push(members.length ? members.map(member => `- ${markdownText(member.displayName)}${member.userId === mission.organizerId ? " (organizer)" : ""}`).join("\n") : "No current participants.");
  lines.push("", "Participants are guest or member accounts of this community, not verified residents.");

  const updates = posts.filter(post => post.kind === "update" && !post.hidden);
  lines.push("", "## Progress updates", "");
  lines.push(updates.length ? updates.map(post => `- ${markdownText(post.authorName)} (${markdownText(when(post.createdAt))}): ${markdownText(post.body)}`).join("\n") : "No progress updates yet.");

  const observations = posts.filter(post => post.kind === "observation" && !post.hidden).sort((left, right) => left.observedOn.localeCompare(right.observedOn));
  lines.push("", "## Site observations and follow-ups", "");
  if (observations.length) {
    for (const post of observations) {
      lines.push(`- (${markdownText(post.observedOn)})${post.fictional ? " **[FICTIONAL practice entry]**" : ""}${post.imported ? " **[Imported from a local campaign by the organizer; original author unverified]**" : ""} ${markdownText(post.authorName)}: ${markdownText(post.body)}`);
    }
  } else lines.push("No dated site observation has been recorded; current conditions are unverified.");

  lines.push("", "## Official 311 records", "");
  if (!sourced) {
    lines.push(NO_RECORDS_LINE, "", "This mission started from a discussion. Nothing here reports city ticket status or recurrence.");
  } else {
    const demo = source?.mode === "demo";
    lines.push(demo ? "Fictional demo sample; these are not city records."
      : source?.mode === "recorded" ? `Recorded DC 311 snapshot (real city data${source.retrievedAt ? `, retrieved ${markdownText(source.retrievedAt)}` : ""}); this is not live data.`
        : `DC 311 snapshot${source?.retrievedAt ? ` retrieved ${markdownText(source.retrievedAt)}` : ""}.`);
    if (source?.window?.start) lines.push(`Query window: ${markdownText(source.window.start)} inclusive to ${markdownText(source.window.endExclusive ?? "")} exclusive (America/New_York).`);
    if (source?.reviewedAt) lines.push(`Evidence reviewed by the publishing organizer's group on ${markdownText(source.reviewedAt)} before it was shared. Reports excluded in that review are not included.`);
    const stat = areaRecurrence(mission.evidence);
    lines.push("", markdownText(recurrenceHeadline(stat, shortDay)), "", markdownText(recurrenceHeadline.caveat));
    const counts = new Map();
    for (const record of mission.evidence) counts.set(record.status ?? "Status unavailable", (counts.get(record.status ?? "Status unavailable") ?? 0) + 1);
    lines.push("", `City ticket status as published at the snapshot: ${markdownText([...counts].map(([status, count]) => `${count} ${status}`).join(" · "))}. This is the city's own record status and is kept separate from the group's progress and from site observations.`, "");
    for (const record of [...mission.evidence].sort((left, right) => sourceDateValue(left.date) - sourceDateValue(right.date))) {
      lines.push(`- **Request ID:** ${markdownText(record.id, "Unavailable")}; **Address:** ${markdownText(record.address, "Address unavailable")}; **Date:** ${markdownText(formatSourceDate(record.date))}; **Official status:** ${markdownText(record.status, "Status unavailable")}${record.outsideWard ? "; **Location note:** map point is outside the Ward 8 boundary although the source ward label is Ward 8" : ""}`);
      const url = sourceRecordUrl(record, source?.mode);
      if (url) lines.push(`  - [Original source record](${url})`);
    }
    if (source?.sourceUrl && !demo) lines.push("", `Source layer: ${source.sourceUrl}.`);
    if (!demo) lines.push("", "Map locations are approximate block-level or intersection points, not exact sites.");
  }
  lines.push("", "This plan prepares a group effort. It does not report current conditions, confirm cleanup, or submit anything to an agency.");
  return lines.join("\n");
}
