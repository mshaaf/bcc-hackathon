import assert from "node:assert/strict";
import test from "node:test";
import {
  RECURRENCE_RULE, areaRecurrence, isCountable, recurrenceHeadline, recurrenceSpots, recurrenceSummary, reReportedKeys
} from "../lib/recurrence.mjs";
import { distanceMeters } from "../lib/block-ops.mjs";

const DAY = 86400000;
const T0 = Date.UTC(2026, 8, 1, 16);
const at = days => T0 + days * DAY;
const lonStep = meters => meters / (111320 * Math.cos((38.85 * Math.PI) / 180)); // degrees of longitude per metre at this latitude
const base = { lon: -76.97, lat: 38.85 };
const rec = (id, { days = 0, status = "Closed", meters = 0, geo, date } = {}) => ({
  key: `request:${id}`, id, status, date: date === undefined ? at(days) : date,
  geo: geo === undefined ? { lon: base.lon + lonStep(meters), lat: base.lat } : geo, address: `${id} TEST ST SE`
});
const keys = records => [...reReportedKeys(records)].sort();

test("a closed report is re-reported when another report follows within 30 days and 150 m", () => {
  const records = [rec("A", { days: 0 }), rec("B", { days: 10, status: "Open", meters: 100 })];
  assert.deepEqual(keys(records), ["request:A"]);
  assert.equal(RECURRENCE_RULE.days, 30);
  assert.equal(RECURRENCE_RULE.meters, 150);
});

test("the boundaries are inclusive and the rule looks forward only", () => {
  assert.ok(Math.abs(distanceMeters(rec("a").geo, rec("b", { meters: 150 }).geo) - 150) < 0.5, "fixture sanity");
  assert.deepEqual(keys([rec("A"), rec("B", { days: 30, meters: 149 })]), ["request:A"], "30 days exactly, just inside 150 m");
  assert.deepEqual(keys([rec("A"), rec("B", { days: 30.01, meters: 100 })]), [], "just over 30 days");
  assert.deepEqual(keys([rec("A"), rec("B", { days: 5, meters: 152 })]), [], "just over 150 m");
  assert.deepEqual(keys([rec("A", { days: 10 }), rec("B", { days: 0, status: "Open", meters: 20 })]), [], "an earlier report is not followed by a later-filed one");
  assert.deepEqual(keys([rec("A"), rec("B", { days: 0, status: "Open", meters: 20 })]), [], "same timestamp is not after");
  assert.deepEqual(keys([rec("A")]), [], "a report never re-reports itself");
});

test("only an exact Closed status can be re-reported", () => {
  const later = rec("L", { days: 3, status: "Open", meters: 10 });
  for (const status of ["Open", "Closed (Duplicate)", "Open (Duplicate)", "Canceled", null]) {
    assert.deepEqual(keys([rec("A", { status }), later]), [], String(status));
  }
});

test("duplicate and canceled reports never count on either side", () => {
  for (const status of ["Closed (Duplicate)", "Open (Duplicate)", "Canceled", "Cancelled", "Duplicate", "closed (duplicate)"]) {
    assert.equal(isCountable({ status }), false, status);
    assert.deepEqual(keys([rec("A"), rec("D", { days: 3, status, meters: 10 })]), [], `later ${status}`);
  }
  assert.equal(isCountable({ status: "Open" }), true);
  assert.equal(isCountable({ status: "Closed" }), true);
  assert.equal(isCountable({ status: null }), true, "an unknown status is not a duplicate");
});

test("reports without a usable date or point are left out of the rule", () => {
  const closed = rec("A");
  assert.deepEqual(keys([closed, rec("B", { days: 3, geo: null })]), []);
  assert.deepEqual(keys([closed, rec("B", { date: null })]), []);
  assert.deepEqual(keys([closed, rec("B", { date: "not a date", meters: 5 })]), []);
  assert.deepEqual(keys([rec("X", { geo: null }), rec("B", { days: 3, status: "Open" })]), [], "a closed report with no point cannot be matched");
  assert.deepEqual(keys([rec("X", { date: null }), rec("B", { days: 3, status: "Open" })]), []);
});

test("ward-wide summary counts closed, re-reported, and busy spots", () => {
  // Spot 1: five reports on one block over a month, four closed, three of those followed by another report.
  const spot1 = [rec("a", { days: 0 }), rec("b", { days: 5, meters: 20 }), rec("c", { days: 12, meters: 30 }), rec("d", { days: 20, meters: 10, status: "Open" }), rec("e", { days: 70, meters: 5 })];
  // Two isolated closed reports far away, and a duplicate beside spot 1 that must not count.
  const alone = [rec("f", { days: 1, meters: 5000 }), rec("g", { days: 2, meters: 9000 })];
  const duplicate = rec("dup", { days: 4, meters: 10, status: "Closed (Duplicate)" });
  const records = [...spot1, ...alone, duplicate];
  const summary = recurrenceSummary(records, { asOf: at(75) });

  assert.deepEqual(keys(records), ["request:a", "request:b", "request:c"].sort(), "a, b, c each have a later report within 30 d and 150 m");
  assert.equal(summary.closed, 6, "exact Closed only: a, b, c, e, f, g");
  assert.equal(summary.closedLocated, 6);
  assert.equal(summary.reReported, 3);
  assert.equal(summary.pct, 50);
  assert.equal(summary.reports, 7, "countable located reports; the duplicate is excluded");
  assert.equal(summary.reportsAll, 8);
  assert.deepEqual(summary.spots, { count: 1, reports: 5, share: 5 / 7 });
  // Closed reports dated 30+ days before asOf have had a full window to be re-reported: a, b, c, f, g (e is day 70, too recent).
  assert.equal(summary.matureClosed, 5);
  assert.equal(summary.matureReReported, 3);
  assert.equal(summary.maturePct, 60);
});

test("an empty or unmappable snapshot gives zeros, not NaN", () => {
  const summary = recurrenceSummary([], { asOf: at(0) });
  assert.deepEqual([summary.closed, summary.reReported, summary.pct, summary.spots.count, summary.spots.share], [0, 0, null, 0, null]);
  assert.equal(recurrenceSummary([rec("a", { geo: null })], { asOf: at(0) }).pct, null);
});

test("busy spots rank by re-reported closures, each report in one spot only", () => {
  const quiet = [0, 1, 2, 3, 4].map(i => rec(`q${i}`, { days: i * 40, meters: 3000 })); // five reports, 40 days apart: no re-reports
  const hot = [0, 1, 2, 3, 4].map(i => rec(`h${i}`, { days: i * 2, meters: 6000 + i }));
  const spots = recurrenceSpots([...quiet, ...hot]);
  assert.equal(spots.length, 2);
  assert.equal(spots[0].reReported, 4);
  assert.equal(spots[1].reReported, 0);
  assert.equal(new Set(spots.flatMap(spot => spot.records.map(item => item.key))).size, 10, "no report is counted twice");
  assert.deepEqual(recurrenceSpots([...quiet.slice(0, 4)], { minReports: 5 }), []);
});

test("area recurrence: reports, closed, re-reported, first and latest date, median gap", () => {
  const stat = areaRecurrence([rec("a", { days: 0 }), rec("b", { days: 4, meters: 10 }), rec("c", { days: 10, meters: 10, status: "Open" }), rec("d", { days: 11, status: "Canceled" })]);
  assert.equal(stat.reports, 4);
  assert.equal(stat.closed, 2);
  assert.equal(stat.reReported, 2);
  assert.equal(stat.first, at(0));
  assert.equal(stat.latest, at(11));
  assert.equal(stat.medianGapDays, 5, "gaps of 4 and 6 days between countable reports; the canceled one is ignored");

  assert.equal(areaRecurrence([rec("a")]).medianGapDays, null);
  assert.equal(areaRecurrence([]).first, null);
  assert.equal(areaRecurrence([rec("a", { days: 0 }), rec("b", { days: 3 }), rec("c", { days: 4 })]).medianGapDays, 2, "even count of gaps (3, 1): median 2");
  assert.equal(areaRecurrence([rec("a", { days: 0 }), rec("b", { days: 1 }), rec("c", { days: 3 })]).medianGapDays, 1.5);
});

test("headline wording stays 'another report nearby' and never claims the same pile or a failed cleanup", () => {
  const stat = areaRecurrence([rec("a", { days: 0 }), rec("b", { days: 4, meters: 10 }), rec("c", { days: 10, meters: 10, status: "Open" })]);
  const line = recurrenceHeadline(stat, value => `D${Math.round((value - T0) / DAY)}`);
  assert.match(line, /3 reports since D0 · 2 closed · 2 followed by another report within 30 days of filing · median gap 5 days/);
  assert.match(recurrenceHeadline.caveat, /another report .*nearby/i);
  assert.match(recurrenceHeadline.caveat, /not .*same pile/i, "the caveat names what the number does NOT mean");
  assert.doesNotMatch(line, /same pile|failed|fault|negligen|broken/i, "the headline itself makes none of those claims");
  assert.match(recurrenceHeadline({ reports: 1, closed: 1, reReported: 0, first: at(0), latest: at(0), medianGapDays: null }, () => "D0"), /1 report since D0 · 1 closed · 0 followed by another report within 30 days of filing$/);
});

test("a later filing is counted, but no wording says it came after the closure", () => {
  // A filed day 0 and resolved day 9; B filed day 1 nearby, before A closed. The algorithm counts B (it only sees filing dates).
  const a = { ...rec("A", { days: 0 }), resolutionDate: at(9) };
  const b = rec("B", { days: 1, status: "Open", meters: 20 });
  assert.deepEqual(keys([a, b]), ["request:A"]);
  const line = recurrenceHeadline(areaRecurrence([a, b]), () => "D0");
  assert.match(line, /1 followed by another report within 30 days of filing/);
  const closureClaim = /(after|following|of|since) (a |the |its )?(closure|closed)|re-reported/i;
  assert.doesNotMatch(line, closureClaim);
  assert.doesNotMatch(recurrenceHeadline.caveat, closureClaim);
  assert.match(recurrenceHeadline.caveat, /filing dates, not closure dates/i);
  assert.match(recurrenceHeadline.caveat, /may have been filed before the closure/i);
});

test("summary 'mature' subset means filed 30+ days before asOf, and reports with unknown dates are left out", () => {
  const old = rec("old", { days: 0 });
  const recent = rec("recent", { days: 60, meters: 5000 });
  const undated = rec("undated", { date: null, meters: 9000 });
  const summary = recurrenceSummary([old, recent, undated], { asOf: at(75) });
  assert.equal(summary.closedLocated, 2, "the undated report cannot be placed in time");
  assert.equal(summary.matureClosed, 1, "only the report filed 75 days ago is mature; the one filed 15 days ago is not");
  assert.equal(recurrenceSummary.matureLabel, "reports filed at least 30 days ago");
});
