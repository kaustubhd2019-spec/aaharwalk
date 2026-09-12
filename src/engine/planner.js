/* AaharWalk — meal planning and "what should I eat next".
 *
 * Plans are built from real plates (mealIdeas.js), then the flexible item —
 * the bhakri, poli or rice — is scaled so the plate lands near the calorie
 * budget. Nothing gets invented; every number traces back to the food database.
 */

import { MEAL_IDEAS, IDEAS_BY_SLOT } from "../data/mealIdeas.js";
import { nutritionFor, totalNutrition } from "./nutrition.js";
import { foodById } from "./parser.js";
import { norm, shuffle, clamp, round } from "../core/util.js";

/** How the day's calories are usually spread across meals. */
export const SLOT_SHARE = { breakfast: 0.25, midmorning: 0.06, lunch: 0.33, snack: 0.11, dinner: 0.25 };
const SLOT_ORDER = ["breakfast", "midmorning", "lunch", "snack", "dinner"];

/** Calories to hold back for the meals that still come after this one. */
function reserveAfter(slot, kcalTarget) {
  const index = SLOT_ORDER.indexOf(slot);
  if (index < 0) return kcalTarget * 0.2;
  return SLOT_ORDER.slice(index + 1).reduce((total, key) => total + SLOT_SHARE[key], 0) * kcalTarget;
}

export const SLOT_LABELS = {
  breakfast: { en: "Breakfast", mr: "न्याहारी" },
  midmorning: { en: "Mid-morning", mr: "मधल्या वेळेत" },
  lunch: { en: "Lunch", mr: "दुपारचे जेवण" },
  snack: { en: "Evening snack", mr: "संध्याकाळचा नाश्ता" },
  dinner: { en: "Dinner", mr: "रात्रीचे जेवण" },
  other: { en: "Other", mr: "इतर" }
};

function dietAllows(profileDiet, ideaDiet) {
  if (ideaDiet === 1) return true;
  if (ideaDiet === 2) return profileDiet === "egg" || profileDiet === "nonveg";
  return profileDiet === "nonveg";
}

/** Allergy/dislike strings are matched against food names and aliases. */
function blockedBy(food, avoidTerms) {
  if (!avoidTerms.length) return false;
  const haystack = [food.name, food.mr, ...(food.aliases || [])].map(norm).join(" ");
  return avoidTerms.some(term => term && haystack.includes(term));
}

function ideaBlocked(idea, avoidTerms) {
  return idea.items.some(item => {
    const food = foodById(item.foodId);
    return !food || blockedBy(food, avoidTerms);
  });
}

/** Scale the flexible item so the plate lands near `targetKcal`. */
function fitToBudget(idea, targetKcal) {
  const items = idea.items.map(item => ({ ...item, oil: "normal" }));
  const flexIndex = items.findIndex(item => item.flex);
  const base = totalNutrition(items).kcal;
  if (flexIndex < 0 || !targetKcal) return { items, kcal: base };

  const flex = items[flexIndex];
  const flexUnitKcal = nutritionFor({ ...flex, qty: 1 }).kcal;
  const fixedKcal = base - nutritionFor(flex).kcal;
  if (flexUnitKcal <= 0) return { items, kcal: base };

  const wanted = (targetKcal - fixedKcal) / flexUnitKcal;
  const food = foodById(flex.foodId);
  const wholeOnly = food && (food.cat === "bread" || flex.unit === "piece");
  // Portions people actually serve: whole rotis, half bowls, quarter spoons.
  const stepSize = wholeOnly ? 1 : (flex.unit === "tsp" || flex.unit === "tbsp") ? 0.25 : 0.5;
  let qty = Math.round(wanted / stepSize) * stepSize;
  qty = clamp(qty, wholeOnly ? 1 : 0.5, flex.qty * 2);
  items[flexIndex] = { ...flex, qty: round(qty, 2) };
  return { items, kcal: totalNutrition(items).kcal };
}

/**
 * Score a candidate plate. Lower is better.
 * Balances calorie fit against protein, fibre, heart-friendliness, the user's
 * own food habits, and not repeating what they just ate.
 */
/** Stable pseudo-random offset so different days get different plates. */
function jitter(id, seed) {
  let h = 2166136261 ^ (seed || 0);
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 1000) / 1000;
}

function scoreIdea(idea, fitted, ctx) {
  const { targetKcal, needProtein, needFibre, recentIdeaIds = [], recentFoodIds = new Set(), favouriteFoodIds = new Set(), preferredCuisines = [] } = ctx;
  const n = totalNutrition(fitted.items);

  let score = Math.abs(n.kcal - targetKcal) / Math.max(120, targetKcal * 0.15);

  if (needProtein > 0) score -= Math.min(2.8, (n.protein / Math.max(1, needProtein)) * 2.1);
  if (needFibre > 0) score -= Math.min(1.5, (n.fibre / Math.max(1, needFibre)) * 1.2);

  const hearts = fitted.items.map(item => (foodById(item.foodId) || {}).heart || 3);
  const heartAvg = hearts.reduce((a, b) => a + b, 0) / hearts.length;
  score -= (heartAvg - 3) * 0.45;

  // Variety: recently planned plates and recently eaten foods get pushed down.
  const recentRank = recentIdeaIds.indexOf(idea.id);
  if (recentRank >= 0) score += 4 - recentRank * 0.6;
  const repeats = fitted.items.filter(item => recentFoodIds.has(item.foodId)).length;
  score += repeats * 0.28;

  // Personalisation: plates built from foods they actually eat feel right.
  const familiar = fitted.items.filter(item => favouriteFoodIds.has(item.foodId)).length;
  score -= familiar * 0.5;
  if (preferredCuisines.length && preferredCuisines.includes(idea.cuisine)) score -= 0.7;

  // A small, stable nudge so the plan rotates day to day instead of
  // serving the same winning plate every morning.
  score += jitter(idea.id, ctx.seed) * 1.1;

  return score;
}

/* Slots without a library of their own borrow the closest one. */
const SLOT_SOURCE = { midmorning: "snack", other: "snack" };

function candidatesFor(slot, ctx) {
  const avoidTerms = (ctx.avoid || []).map(norm).filter(Boolean);
  const source = IDEAS_BY_SLOT[slot] || IDEAS_BY_SLOT[SLOT_SOURCE[slot]] || MEAL_IDEAS;
  return source
    .filter(idea => dietAllows(ctx.diet, idea.diet))
    .filter(idea => !ideaBlocked(idea, avoidTerms));
}

/**
 * Suggest one meal for a slot within a calorie budget.
 * @returns {{idea, items, nutrition}|null}
 */
export function suggestMeal(slot, ctx) {
  const pool = candidatesFor(slot, ctx);
  if (!pool.length) return null;
  const targetKcal = ctx.targetKcal || 500;

  const ranked = shuffle(pool, ctx.seed || 1)
    .map(idea => {
      const fitted = fitToBudget(idea, targetKcal);
      return { idea, fitted, score: scoreIdea(idea, fitted, { ...ctx, targetKcal }) };
    })
    .sort((a, b) => a.score - b.score);

  const best = ranked[0];
  if (!best) return null;
  return {
    ideaId: best.idea.id,
    slot,
    tags: best.idea.tags,
    cuisine: best.idea.cuisine,
    items: best.fitted.items,
    nutrition: totalNutrition(best.fitted.items),
    alternatives: ranked.slice(1, 4).map(r => r.idea.id)
  };
}

/**
 * Build a full day's plan inside the calorie target.
 * Slots are planned in order so later slots see what is actually left.
 */
export function planDay(profile, targets, ctx = {}) {
  const slots = ["breakfast", "lunch", "snack", "dinner"];
  const plan = {};
  let remaining = targets.kcal;
  let proteinLeft = targets.protein;
  let fibreLeft = targets.fibre;
  const usedFoodIds = new Set(ctx.recentFoodIds || []);

  const shares = { breakfast: 0.27, lunch: 0.35, snack: 0.11, dinner: 0.27 };
  let slotsLeft = slots.length;

  for (const slot of slots) {
    const share = shares[slot];
    const targetKcal = Math.round(Math.min(remaining - (slotsLeft - 1) * 150, targets.kcal * share));
    const meal = suggestMeal(slot, {
      ...ctx,
      diet: profile.diet,
      avoid: profile.avoid || [],
      preferredCuisines: profile.cuisines || [],
      targetKcal: Math.max(120, targetKcal),
      needProtein: proteinLeft * share,
      needFibre: fibreLeft * share,
      recentFoodIds: usedFoodIds,
      favouriteFoodIds: ctx.favouriteFoodIds || new Set(),
      seed: (ctx.seed || 1) + slot.length * 7
    });
    if (!meal) { slotsLeft -= 1; continue; }
    plan[slot] = meal;
    remaining -= meal.nutrition.kcal;
    proteinLeft -= meal.nutrition.protein;
    fibreLeft -= meal.nutrition.fibre;
    slotsLeft -= 1;
    for (const item of meal.items) usedFoodIds.add(item.foodId);
  }

  const totals = Object.values(plan).reduce((acc, meal) => ({
    kcal: acc.kcal + meal.nutrition.kcal,
    protein: acc.protein + meal.nutrition.protein,
    carbs: acc.carbs + meal.nutrition.carbs,
    fat: acc.fat + meal.nutrition.fat,
    fibre: acc.fibre + meal.nutrition.fibre
  }), { kcal: 0, protein: 0, carbs: 0, fat: 0, fibre: 0 });

  return { date: ctx.date, plan, totals, targetKcal: targets.kcal };
}

/**
 * "You have ~750 kcal left — here's a dinner that fits."
 * Used on the home screen and by the coach.
 */
export function suggestNext(profile, targets, consumed, ctx = {}) {
  const remainingKcal = Math.max(0, targets.kcal - consumed.kcal);
  const slot = ctx.slot || nextSlotByClock(ctx.minutesNow ?? 12 * 60, ctx.loggedSlots || {});
  if (!slot) return null;

  // Keep enough back for the meals still to come, and never propose a plate
  // far larger than that slot normally is.
  const reserve = reserveAfter(slot, targets.kcal);
  const ceiling = targets.kcal * (SLOT_SHARE[slot] ?? 0.3) * 1.3;
  const budget = clamp(Math.min(remainingKcal - reserve, ceiling), 120, 900);

  return suggestMeal(slot, {
    ...ctx,
    diet: profile.diet,
    avoid: profile.avoid || [],
    preferredCuisines: profile.cuisines || [],
    targetKcal: budget,
    needProtein: Math.max(0, targets.protein - consumed.protein),
    needFibre: Math.max(0, targets.fibre - consumed.fibre),
    recentFoodIds: new Set(ctx.recentFoodIds || []),
    favouriteFoodIds: ctx.favouriteFoodIds || new Set(),
    seed: ctx.seed || 3
  });
}

/** Which meal is realistically next, given the clock and what's already logged. */
export function nextSlotByClock(minutes, loggedSlots = {}) {
  const order = [
    ["breakfast", 0, 11 * 60],
    ["midmorning", 10 * 60, 12 * 60 + 30],
    ["lunch", 11 * 60, 16 * 60],
    ["snack", 15 * 60, 19 * 60 + 30],
    ["dinner", 18 * 60, 24 * 60]
  ];
  for (const [slot, from, to] of order) {
    if (minutes < to && minutes >= from - 120 && !(loggedSlots[slot] > 0)) return slot;
  }
  const pending = order.map(o => o[0]).find(slot => !(loggedSlots[slot] > 0));
  return pending || "dinner";
}

export function describeMeal(meal, lang = "en") {
  if (!meal) return "";
  return meal.items.map(item => {
    const food = foodById(item.foodId);
    const name = lang === "mr" && food.mr ? food.mr : food.name;
    return `${item.qty} ${item.unit === food.unit ? "" : item.unit} ${name}`.replace(/\s+/g, " ").trim();
  }).join(", ");
}
