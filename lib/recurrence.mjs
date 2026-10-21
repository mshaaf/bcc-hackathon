// "Closed isn't fixed": how often another report is filed near a report that is currently marked Closed.
// Dates are report-creation (filing) dates; no closure date is used, so a later filing may predate the closure.
// Wording is deliberately modest: another report nearby within 30 days of filing. It never says after closure, same pile, failed cleanup, or fault.
import { distanceMeters, sourceDateValue } from "./block-ops.mjs";

export const RECURRENCE_RULE = { days: 30, meters: 150, minSpotReports: 5 };
const DAY = 86400000;

export const isCountable = record => !/duplicate|cancel/i.test(record?.status ?? "");
const timeOf = record => {
  const value = sourceDateValue(record?.date);
  return Number.isFinite(value) ? value : null;
};
const placed = record => Boolean(record?.geo) && Number.isFinite(record.geo.lon) && Number.isFinite(record.geo.lat);
const usable = record => isCountable(record) && placed(record) && timeOf(record) !== null;
const round1 = value => Math.round(value * 10) / 10;

// Keys of reports now marked exactly "Closed" that another countable report was filed after (by creation date) within the rule's days and metres.
export function reReportedKeys(records, rule = RECURRENCE_RULE) {
  const candidates = records.filter(usable).map(record => ({ record, time: timeOf(record) }));
  const keys = new Set();
  for (const closed of candidates) {
    if (closed.record.status !== "Closed") continue;
    const found = candidates.some(other => other !== closed
      && other.time > closed.time && other.time - closed.time <= rule.days * DAY
      && distanceMeters(closed.record.geo, other.record.geo) <= rule.meters);
    if (found) keys.add(closed.record.key);
  }
  return keys;
}

// Greedy clusters: the densest unassigned report seeds a cluster of the unassigned reports within the rule's metres.
export function recurrenceSpots(records, { minReports = RECURRENCE_RULE.minSpotReports, rule = RECURRENCE_RULE } = {}) {
  const located = records.filter(record => isCountable(record) && placed(record));
  const hit = reReportedKeys(records, rule);
  const seeds = located.map((record, index) => ({ record, index, near: located.filter(other => distanceMeters(record.geo, other.geo) <= rule.meters).length }))
    .sort((left, right) => right.near - left.near || left.index - right.index);
  const assigned = new Set();
  const spots = [];
  for (const { record } of seeds) {
    if (assigned.has(record.key)) continue;
    const members = located.filter(other => !assigned.has(other.key) && distanceMeters(record.geo, other.geo) <= rule.meters);
    members.forEach(member => assigned.add(member.key));
    spots.push({
      center: record.geo, records: members, reports: members.length,
      closed: members.filter(member => member.status === "Closed").length,
      reReported: members.filter(member => hit.has(member.key)).length
    });
  }
  return spots.filter(spot => spot.reports >= minReports).sort((left, right) => right.reReported - left.reReported || right.reports - left.reports);
}

// Ward-wide numbers for a snapshot. The "mature" subset is reports filed at least the rule's days before asOf, so they had a full window; it says nothing about when they closed.
export function recurrenceSummary(records, { asOf = Date.now(), rule = RECURRENCE_RULE } = {}) {
  const hit = reReportedKeys(records, rule);
  const closedLocated = records.filter(record => record.status === "Closed" && placed(record) && timeOf(record) !== null);
  const mature = closedLocated.filter(record => timeOf(record) <= asOf - rule.days * DAY);
  const reports = records.filter(record => isCountable(record) && placed(record)).length;
  const spots = recurrenceSpots(records, { rule });
  const spotReports = spots.reduce((sum, spot) => sum + spot.reports, 0);
  const pct = (part, whole) => (whole ? Math.round((part / whole) * 100) : null);
  const matureHit = mature.filter(record => hit.has(record.key)).length;
  return {
    reportsAll: records.length, reports,
    closed: records.filter(record => record.status === "Closed").length,
    closedLocated: closedLocated.length,
    reReported: hit.size, pct: pct(hit.size, closedLocated.length),
    matureClosed: mature.length, matureReReported: matureHit, maturePct: pct(matureHit, mature.length),
    spots: { count: spots.length, reports: spotReports, share: reports ? spotReports / reports : null }
  };
}

// One area or one campaign's evidence.
export function areaRecurrence(records, rule = RECURRENCE_RULE) {
  const times = records.map(timeOf).filter(time => time !== null);
  const gapTimes = records.filter(record => isCountable(record) && timeOf(record) !== null).map(timeOf).sort((left, right) => left - right);
  const gaps = gapTimes.slice(1).map((time, index) => (time - gapTimes[index]) / DAY).sort((left, right) => left - right);
  const middle = Math.floor(gaps.length / 2);
  const median = !gaps.length ? null : round1(gaps.length % 2 ? gaps[middle] : (gaps[middle - 1] + gaps[middle]) / 2);
  const hit = reReportedKeys(records, rule);
  return {
    reports: records.length,
    closed: records.filter(record => record.status === "Closed").length,
    reReported: hit.size,
    first: times.length ? Math.min(...times) : null,
    latest: times.length ? Math.max(...times) : null,
    medianGapDays: median
  };
}

recurrenceSummary.matureLabel = `reports filed at least ${RECURRENCE_RULE.days} days ago`;

export function recurrenceHeadline(stat, formatDay) {
  const plural = (count, word) => `${count} ${word}${count === 1 ? "" : "s"}`;
  const parts = [`${plural(stat.reports, "report")}${stat.first !== null ? ` since ${formatDay(stat.first)}` : ""}`, `${stat.closed} closed`, `${stat.reReported} followed by another report within ${RECURRENCE_RULE.days} days of filing`];
  if (stat.medianGapDays !== null) parts.push(`median gap ${stat.medianGapDays} ${stat.medianGapDays === 1 ? "day" : "days"}`);
  return parts.join(" · ");
}
recurrenceHeadline.caveat = `“Followed by another report” means another report was filed nearby (within ${RECURRENCE_RULE.meters} m) within ${RECURRENCE_RULE.days} days after a report now marked Closed was filed. It uses filing dates, not closure dates, so the later report may have been filed before the closure. It does not mean the same pile, a failed cleanup, or anyone's fault, and locations are block-level.`;
