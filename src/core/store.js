/* AaharWalk — state container backed by localStorage.
   Everything stays on this device; nothing is sent anywhere. */

import { todayISO, uid } from "./util.js";

const KEY = "aaharwalk.v3";
const SCHEMA = 3;

/** Shape of a fresh install. */
function emptyState() {
  return {
    schema: SCHEMA,
    profile: null,          // set by onboarding
    targets: null,          // computed snapshot, refreshed on profile/weight change
    days: {},               // { "2026-09-12": DayLog }
    favorites: [],          // saved meal combos
    foodStats: {},          // { foodId: { count, lastUsed, unit, qty } }
    customFoods: [],
    plans: {},              // { date: generated day plan }
    workouts: {},           // { date: generated workout }
    settings: {
      lang: "en",
      reminders: { water: true, wakeTime: "07:00", sleepTime: "22:30", everyMinutes: 120 },
      stepSource: "manual",
      walkCalibration: 1
    },
    meta: { createdAt: new Date().toISOString(), demoLoaded: false, walkedStepsRepaired: false }
  };
}

export function emptyDay(date) {
  return {
    date,
    meals: { breakfast: [], midmorning: [], lunch: [], snack: [], dinner: [], other: [] },
    waterMl: 0,
    steps: 0,
    stepsSource: "manual",
    walkedSteps: 0,       // the portion this phone counted in Walk mode
    weightKg: null,
    workout: null,          // { id, title, minutes, kcal, completedAt }
    notes: ""
  };
}

export const MEAL_SLOTS = ["breakfast", "midmorning", "lunch", "snack", "dinner", "other"];

let state = load();
const listeners = new Set();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw);
    return migrate(parsed);
  } catch (err) {
    console.warn("AaharWalk: could not read saved data, starting fresh.", err);
    return emptyState();
  }
}

function migrate(parsed) {
  const base = emptyState();
  const merged = { ...base, ...parsed };
  merged.settings = { ...base.settings, ...(parsed.settings || {}) };
  merged.settings.reminders = { ...base.settings.reminders, ...((parsed.settings || {}).reminders || {}) };
  merged.meta = { ...base.meta, ...(parsed.meta || {}) };
  merged.schema = SCHEMA;
  return merged;
}

let saveTimer = null;
function persist() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (err) {
      console.warn("AaharWalk: could not save.", err);
    }
  }, 80);
}

export function getState() {
  return state;
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function emit() {
  for (const fn of listeners) fn(state);
}

/** Mutate state through a function, then persist + notify. */
export function update(mutator) {
  const result = mutator(state);
  persist();
  emit();
  return result;
}

export function getDay(date = todayISO()) {
  return state.days[date] || emptyDay(date);
}

export function updateDay(date, mutator) {
  return update(s => {
    if (!s.days[date]) s.days[date] = emptyDay(date);
    return mutator(s.days[date]);
  });
}

export function addFoodEntries(date, slot, entries) {
  updateDay(date, day => {
    for (const entry of entries) {
      day.meals[slot].push({ ...entry, id: entry.id || uid("e"), loggedAt: new Date().toISOString() });
      const stat = state.foodStats[entry.foodId] || { count: 0, lastUsed: null, unit: entry.unit, qty: entry.qty };
      stat.count += 1;
      stat.lastUsed = date;
      stat.unit = entry.unit;
      stat.qty = entry.qty;
      state.foodStats[entry.foodId] = stat;
    }
  });
}

export function removeFoodEntry(date, slot, entryId) {
  updateDay(date, day => {
    day.meals[slot] = day.meals[slot].filter(e => e.id !== entryId);
  });
}

export function updateFoodEntry(date, slot, entryId, patch) {
  updateDay(date, day => {
    const entry = day.meals[slot].find(e => e.id === entryId);
    if (entry) Object.assign(entry, patch);
  });
}

export function saveFavorite(name, slot, entries) {
  update(s => {
    s.favorites.unshift({ id: uid("fav"), name, slot, entries, createdAt: new Date().toISOString() });
    s.favorites = s.favorites.slice(0, 40);
  });
}

export function removeFavorite(id) {
  update(s => { s.favorites = s.favorites.filter(f => f.id !== id); });
}

export function exportJSON() {
  return JSON.stringify(state, null, 2);
}

export function importJSON(text) {
  const parsed = JSON.parse(text);
  if (!parsed || typeof parsed !== "object") throw new Error("Not an AaharWalk backup file.");
  state = migrate(parsed);
  persist();
  emit();
}

export function resetAll() {
  state = emptyState();
  persist();
  emit();
}

export function replaceState(next) {
  state = migrate(next);
  persist();
  emit();
}
