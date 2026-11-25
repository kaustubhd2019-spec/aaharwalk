import { test } from "node:test";
import assert from "node:assert/strict";
import { nextOccurrence, nextAlarm, dueAlarms, describeDays, formatTime, formatCountdown, streakDays, MAX_LATE_MS } from "../js/schedule.js";

const at = (y, mo, d, h = 0, mi = 0, s = 0) => new Date(y, mo - 1, d, h, mi, s);
const alarm = (hour, minute, days = [], enabled = true) => ({ id: `${hour}:${minute}`, hour, minute, days, enabled });

test("one-time alarm later today rings today", () => {
  const n = nextOccurrence(alarm(6, 30), at(2026, 11, 25, 5, 0));
  assert.deepEqual(n, at(2026, 11, 25, 6, 30));
});

test("one-time alarm already passed today rings tomorrow", () => {
  const n = nextOccurrence(alarm(6, 30), at(2026, 11, 25, 23, 0));
  assert.deepEqual(n, at(2026, 11, 26, 6, 30));
});

test("exact current minute is not 'next' (strictly after)", () => {
  const n = nextOccurrence(alarm(6, 30), at(2026, 11, 25, 6, 30, 0));
  assert.deepEqual(n, at(2026, 11, 26, 6, 30));
});

test("weekday alarm on Friday night skips to Monday", () => {
  // 2026-11-27 is a Friday
  assert.equal(at(2026, 11, 27).getDay(), 5);
  const n = nextOccurrence(alarm(7, 0, [1, 2, 3, 4, 5]), at(2026, 11, 27, 22, 0));
  assert.deepEqual(n, at(2026, 11, 30, 7, 0));
});

test("disabled alarm never rings", () => {
  assert.equal(nextOccurrence(alarm(7, 0, [], false), at(2026, 11, 25)), null);
});

test("nextAlarm picks the soonest", () => {
  const a = alarm(7, 0), b = alarm(6, 15);
  const r = nextAlarm([a, b], at(2026, 11, 25, 1, 0));
  assert.equal(r.alarm, b);
});

test("dueAlarms finds an alarm inside the tick window", () => {
  const a = alarm(6, 30);
  const from = at(2026, 11, 25, 6, 29, 59).getTime();
  const to = at(2026, 11, 25, 6, 30, 0).getTime();
  assert.equal(dueAlarms([a], from, to).length, 1);
  assert.equal(dueAlarms([a], to, to + 1000).length, 0, "same occurrence must not fire twice");
});

test("dueAlarms catches up after the phone slept for 10 minutes", () => {
  const a = alarm(6, 30);
  const from = at(2026, 11, 25, 6, 25).getTime();
  const to = at(2026, 11, 25, 6, 35).getTime();
  assert.equal(dueAlarms([a], from, to).length, 1);
});

test("dueAlarms ignores alarms more than 30 minutes stale", () => {
  const a = alarm(6, 30);
  const from = at(2026, 11, 24, 23, 0).getTime();
  const to = at(2026, 11, 25, 6, 30).getTime() + MAX_LATE_MS + 60000;
  assert.equal(dueAlarms([a], from, to).length, 0);
});

test("labels", () => {
  assert.equal(describeDays([]), "Once");
  assert.equal(describeDays([0, 1, 2, 3, 4, 5, 6]), "Every day");
  assert.equal(describeDays([5, 1, 2, 3, 4]), "Weekdays");
  assert.equal(describeDays([6, 0]), "Weekends");
  assert.equal(describeDays([1, 3]), "Mon, Wed");
  assert.equal(formatTime(0, 5), "12:05 AM");
  assert.equal(formatTime(13, 45), "1:45 PM");
  assert.equal(formatTime(6, 30, true), "06:30");
  assert.equal(formatCountdown(7 * 3600e3 + 12 * 60e3), "7 h 12 min");
  assert.equal(formatCountdown(59 * 1000), "1 min");
});

test("streak counts consecutive days, ignoring practice", () => {
  const now = at(2026, 11, 25, 8, 0);
  const h = [
    { ts: at(2026, 11, 25, 6, 31).getTime() },
    { ts: at(2026, 11, 24, 6, 31).getTime() },
    { ts: at(2026, 11, 23, 6, 31).getTime() },
    { ts: at(2026, 11, 21, 6, 31).getTime() },
    { ts: at(2026, 11, 22, 9, 0).getTime(), practice: true },
  ];
  assert.equal(streakDays(h, now), 3);
  // Before today's alarm: streak still shows yesterday's run.
  assert.equal(streakDays(h.slice(1), now), 2);
  assert.equal(streakDays([], now), 0);
});
