/* AaharWalk — small shared helpers. No dependencies. */

export const DEV_DIGITS = {
  "०": "0", "१": "1", "२": "2", "३": "3", "४": "4",
  "५": "5", "६": "6", "७": "7", "८": "8", "९": "9"
};

export function latinDigits(value) {
  return String(value ?? "").replace(/[०-९]/g, d => DEV_DIGITS[d] ?? d);
}

const DECIMAL_MARK = "";

/**
 * Lowercase, strip accents and punctuation, collapse spaces.
 * Devanagari passes through. A decimal point between digits survives, so
 * "0.5 bowl" is not quietly turned into "0 5" and then read as 5.
 */
export function norm(value) {
  return latinDigits(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[’'`]/g, "")
    .replace(/(\d),(\d{3})\b/g, "$1$2")                 // 1,500 g → 1500 g
    .replace(/(\d)\.(\d)/g, `$1${DECIMAL_MARK}$2`)      // protect a real decimal point
    .replace(/[|/\\()[\]{}:;!?*"“”]+/g, " ")
    .replace(/[.,]+/g, " ")
    .replace(new RegExp(DECIMAL_MARK, "g"), ".")
    .replace(/\s+/g, " ")
    .trim();
}

export function uid(prefix = "id") {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function round(value, digits = 0) {
  const f = 10 ** digits;
  return Math.round((value + Number.EPSILON) * f) / f;
}

export function num(value, fallback = 0) {
  const n = Number(String(value ?? "").replace(/,/g, "").trim());
  return Number.isFinite(n) ? n : fallback;
}

/** Round to the nearest step — used so we never show false precision like "347 kcal". */
export function approx(value, step = 5) {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value / step) * step;
}

export function fmt(value, digits = 0) {
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits
  }).format(value);
}

export function todayISO(date = new Date()) {
  const d = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return d.toISOString().slice(0, 10);
}

export function addDays(iso, delta) {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + delta);
  return todayISO(d);
}

export function daysBetween(fromISO, toISO) {
  const a = new Date(`${fromISO}T00:00:00`).getTime();
  const b = new Date(`${toISO}T00:00:00`).getTime();
  return Math.round((b - a) / 86400000);
}

export function lastNDays(n, endISO = todayISO()) {
  return Array.from({ length: n }, (_, i) => addDays(endISO, -(n - 1 - i)));
}

export function weekdayShort(iso, locale = "en-IN") {
  return new Date(`${iso}T00:00:00`).toLocaleDateString(locale, { weekday: "short" });
}

export function prettyDate(iso, locale = "en-IN") {
  return new Date(`${iso}T00:00:00`).toLocaleDateString(locale, { day: "numeric", month: "short" });
}

export function minutesNow(date = new Date()) {
  return date.getHours() * 60 + date.getMinutes();
}

export function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

export function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value == null || value === false) continue;
    if (key === "class") node.className = value;
    else if (key === "html") node.innerHTML = value;
    else if (key === "text") node.textContent = value;
    else if (key.startsWith("on") && typeof value === "function") node.addEventListener(key.slice(2), value);
    else if (key === "dataset") Object.assign(node.dataset, value);
    else node.setAttribute(key, value === true ? "" : String(value));
  }
  for (const child of [].concat(children)) {
    if (child == null || child === false) continue;
    node.append(child.nodeType ? child : document.createTextNode(String(child)));
  }
  return node;
}

/** Levenshtein distance, bounded so long non-matches bail out early. */
export function editDistance(a, b, limit = 3) {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > limit) return limit + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    let best = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      row[j] = Math.min(prev[j] + 1, row[j - 1] + 1, prev[j - 1] + cost);
      best = Math.min(best, row[j]);
    }
    if (best > limit) return limit + 1;
    prev = row;
  }
  return prev[b.length];
}

export function shuffle(list, seed = Date.now()) {
  const out = list.slice();
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  const rand = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function sum(list, pick = x => x) {
  return list.reduce((total, item) => total + (Number(pick(item)) || 0), 0);
}

export function avg(list, pick = x => x) {
  const valid = list.map(pick).filter(Number.isFinite);
  return valid.length ? sum(valid) / valid.length : 0;
}
