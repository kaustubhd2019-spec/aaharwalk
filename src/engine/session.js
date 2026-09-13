/* AaharWalk — the one place that assembles "what does today look like".
 * Screens read from here so every screen agrees on the numbers.
 */

import { getState, getDay, update } from "../core/store.js";
import { todayISO, addDays, lastNDays, daysBetween, avg, minutesNow } from "../core/util.js";
import { computeTargets, adjustForProgress, weightTrend } from "./targets.js";
import { dayTotals } from "./nutrition.js";
import { buildWorkout } from "./workouts.js";
import { planDay, suggestNext, nextSlotByClock } from "./planner.js";
import { buildIndex } from "./parser.js";

export function refreshFoodIndex() {
  buildIndex(getState().customFoods || []);
}

export function recentDays(count = 7, endISO = todayISO()) {
  const state = getState();
  return lastNDays(count, endISO).map(date => state.days[date] || null);
}

export function weightHistory(limit = 60) {
  const state = getState();
  return Object.values(state.days)
    .filter(d => d && Number.isFinite(d.weightKg))
    .map(d => ({ date: d.date, kg: d.weightKg }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-limit);
}

/** Targets, recalculated from the live profile and the last week of activity. */
export function currentTargets() {
  const state = getState();
  const profile = state.profile;
  if (!profile) return null;

  // Yesterday and back: today is still in progress, and a goal that climbs
  // the moment you log your morning walk just moves the goalposts.
  const completed = recentDays(8, addDays(todayISO(), -1)).filter(Boolean);
  const stepValues = completed.map(d => d.steps).filter(v => v > 0);
  const recentStepAverage = stepValues.length ? avg(stepValues) : null;

  const weeksIn = profile.startedOn
    ? Math.max(0, Math.floor(daysBetween(profile.startedOn, todayISO()) / 7))
    : 0;

  const base = computeTargets(profile, {
    recentSteps: recentStepAverage,
    weeksIn,
    recentStepAverage
  });

  const trend = weightTrend(weightHistory(21));
  return adjustForProgress(base, profile, trend);
}

/** The most-used foods, used for personalising suggestions. */
export function favouriteFoodIds(limit = 25) {
  const stats = getState().foodStats || {};
  return new Set(
    Object.entries(stats)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, limit)
      .map(([id]) => id)
  );
}

export function recentFoodIds(days = 3) {
  const ids = new Set();
  for (const day of recentDays(days)) {
    if (!day) continue;
    for (const entries of Object.values(day.meals || {})) {
      for (const entry of entries) ids.add(entry.foodId);
    }
  }
  return ids;
}

function seedFor(date) {
  return Number(String(date).replace(/-/g, "")) % 100000;
}

/** Today's workout, generated once per day and then remembered. */
export function workoutFor(date = todayISO()) {
  const state = getState();
  if (state.workouts[date]) return state.workouts[date];
  if (!state.profile) return null;

  const start = state.profile.startedOn || date;
  const dayIndex = Math.max(0, daysBetween(start, date));
  const yesterday = state.days[addDays(date, -1)];
  const workout = buildWorkout(state.profile, {
    date,
    dayIndex,
    lastFeedback: yesterday && yesterday.workout ? yesterday.workout.feedback : null
  });
  update(s => { s.workouts[date] = workout; });
  return workout;
}

/** Today's meal plan, generated on demand and then remembered. */
export function planFor(date = todayISO(), { regenerate = false } = {}) {
  const state = getState();
  if (state.plans[date] && !regenerate) return state.plans[date];
  const targets = currentTargets();
  if (!targets || !state.profile) return null;

  const recentIdeaIds = Object.keys(state.plans)
    .sort()
    .slice(-4)
    .flatMap(key => Object.values(state.plans[key].plan || {}).map(m => m.ideaId))
    .reverse();

  const plan = planDay(state.profile, targets, {
    date,
    seed: seedFor(date) + (regenerate ? Date.now() % 997 : 0),
    recentIdeaIds,
    recentFoodIds: recentFoodIds(2),
    favouriteFoodIds: favouriteFoodIds()
  });
  update(s => { s.plans[date] = plan; });
  return plan;
}

/** "What should I eat next" for the home screen. */
export function nextMealSuggestion(date = todayISO()) {
  const state = getState();
  const targets = currentTargets();
  if (!targets || !state.profile) return null;
  const day = getDay(date);
  const consumed = dayTotals(day);

  const loggedSlots = Object.fromEntries(
    Object.entries(day.meals || {}).map(([slot, entries]) => [slot, entries.length])
  );

  const recentIdeaIds = Object.keys(state.plans).sort().slice(-3)
    .flatMap(key => Object.values(state.plans[key].plan || {}).map(m => m.ideaId));

  return suggestNext(state.profile, targets, consumed, {
    minutesNow: minutesNow(),
    loggedSlots,
    recentIdeaIds,
    recentFoodIds: recentFoodIds(2),
    favouriteFoodIds: favouriteFoodIds(),
    seed: seedFor(date)
  });
}

export { nextSlotByClock, dayTotals, getDay, todayISO };
