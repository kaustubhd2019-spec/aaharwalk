// Pure alarm-time maths. No DOM access, so it can be unit-tested in Node.

export const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const DAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"];

// How late an alarm may still ring if the phone was asleep / the tab was frozen
// at the exact minute. Beyond this we skip it rather than ring at a random time.
export const MAX_LATE_MS = 30 * 60 * 1000;

/**
 * Next time `alarm` rings strictly after `from`.
 * alarm: { hour, minute, days: number[] (0=Sun..6=Sat, empty = once), enabled }
 * Returns a Date, or null when the alarm is disabled.
 */
export function nextOccurrence(alarm, from) {
  if (!alarm || !alarm.enabled) return null;
  const base = new Date(from.getTime());
  const days = Array.isArray(alarm.days) ? alarm.days : [];
  for (let offset = 0; offset <= 7; offset++) {
    const c = new Date(base.getFullYear(), base.getMonth(), base.getDate() + offset, alarm.hour, alarm.minute, 0, 0);
    if (c.getTime() <= from.getTime()) continue;
    if (days.length === 0 || days.includes(c.getDay())) return c;
  }
  return null;
}

/** The soonest upcoming alarm: { alarm, at } or null. */
export function nextAlarm(alarms, from) {
  let best = null;
  for (const a of alarms) {
    const at = nextOccurrence(a, from);
    if (at && (!best || at < best.at)) best = { alarm: a, at };
  }
  return best;
}

/**
 * Alarms whose ring time falls in (fromMs, toMs]. Sorted oldest first.
 * The window start is clamped so stale alarms (older than MAX_LATE_MS) never fire.
 */
export function dueAlarms(alarms, fromMs, toMs) {
  const start = Math.max(fromMs, toMs - MAX_LATE_MS);
  if (!(toMs > start)) return [];
  const out = [];
  for (const a of alarms) {
    const at = nextOccurrence(a, new Date(start));
    if (at && at.getTime() <= toMs) out.push({ alarm: a, at });
  }
  return out.sort((x, y) => x.at - y.at);
}

export function describeDays(days) {
  const d = [...new Set(days || [])].sort((a, b) => a - b);
  if (d.length === 0) return "Once";
  if (d.length === 7) return "Every day";
  if (d.join() === "1,2,3,4,5") return "Weekdays";
  if (d.join() === "0,6") return "Weekends";
  return d.map(i => DAY_NAMES[i]).join(", ");
}

export function formatTime(hour, minute, use24h = false) {
  const mm = String(minute).padStart(2, "0");
  if (use24h) return `${String(hour).padStart(2, "0")}:${mm}`;
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12}:${mm} ${hour < 12 ? "AM" : "PM"}`;
}

export function formatCountdown(ms) {
  if (ms < 0) ms = 0;
  const totalMin = Math.ceil(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${m} min`;
}

/** Local calendar date key, e.g. "2026-11-25". */
export function dateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Consecutive days (ending today, or yesterday if nothing yet today) with a completed wake-up. */
export function streakDays(history, now) {
  const done = new Set(history.filter(h => !h.practice).map(h => dateKey(new Date(h.ts))));
  let cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (!done.has(dateKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  let n = 0;
  while (done.has(dateKey(cursor))) {
    n++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return n;
}
