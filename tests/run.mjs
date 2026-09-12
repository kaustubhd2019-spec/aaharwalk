/* AaharWalk — engine tests. No dependencies:  node tests/run.mjs  */

import { parseMeal, matchFood, searchFoods } from "../src/engine/parser.js";
import { nutritionFor, totalNutrition, OIL_FACTORS } from "../src/engine/nutrition.js";
import { computeTargets, stepTarget, bmr, calorieTarget, maintenanceCalories, weightTrend } from "../src/engine/targets.js";
import { planDay, suggestNext, nextSlotByClock, describeMeal } from "../src/engine/planner.js";
import { buildWorkout } from "../src/engine/workouts.js";
import { parseSteps } from "../src/engine/steps-import.js";
import { FOODS, FOOD_BY_ID, AMBIGUOUS } from "../src/data/foods.js";
import { MEAL_IDEAS } from "../src/data/mealIdeas.js";
import { unitsFor, gramsFor } from "../src/data/units.js";

let passed = 0;
const failures = [];

function test(name, fn) {
  try { fn(); passed += 1; }
  catch (err) { failures.push(`${name}\n      ${err.message}`); }
}
function eq(actual, expected, what = "") {
  if (actual !== expected) throw new Error(`${what} expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}
function ok(cond, what) { if (!cond) throw new Error(what || "expected truthy"); }
function near(actual, expected, tolerance, what = "") {
  if (Math.abs(actual - expected) > tolerance) throw new Error(`${what} expected ~${expected} (±${tolerance}), got ${Math.round(actual)}`);
}

/* helper: "2 bhakri" → [{id, qty, unit}] */
const parse = text => parseMeal(text).items.map(i => ({ id: i.foodId, qty: i.qty, unit: i.unit }));

/* ——— parser ————————————————————————————————————————————————— */

test("parses a simple English meal", () => {
  const items = parse("2 bhakri + 1 bowl matki usal");
  eq(items.length, 2, "item count");
  eq(items[0].id, "jowar_bhakri"); eq(items[0].qty, 2); eq(items[0].unit, "piece");
  eq(items[1].id, "matki_usal"); eq(items[1].qty, 1); eq(items[1].unit, "bowl");
});

test("parses Devanagari with Devanagari digits", () => {
  const items = parse("भाकरी २, मटकीची उसळ १ वाटी");
  eq(items.length, 2);
  eq(items[0].qty, 2);
  eq(items[1].id, "matki_usal"); eq(items[1].unit, "bowl");
});

test("strips a whole Marathi sentence around the food", () => {
  const items = parse("आज २ भाकरी आणि एक वाटी मटकीची उसळ खाल्ली");
  eq(items.length, 2, "sentence words must not become extra items");
  eq(items[0].qty, 2); eq(items[1].qty, 1);
});

test("detects the meal slot from mixed-language text", () => {
  const { items, slot, unmatched } = parseMeal("आज lunch ला 2 poli आणि 1 वाटी वरण खाल्लं");
  eq(slot, "lunch");
  eq(items.length, 2);
  eq(unmatched.length, 0, "context words must not be reported as unrecognised food");
});

test("'pav' inside a dish name is not read as a quarter portion", () => {
  eq(parse("vada pav")[0].id, "vada_pav");
  eq(parse("vada pav")[0].qty, 1);
  eq(parse("misal pav")[0].id, "misal_pav");
});

test("'tea' is a drink, not just a meal-time word", () => {
  const items = parse("tea + 2 biscuit");
  eq(items.length, 2);
  eq(items[0].id, "tea_milk_sugar");
});

test("splits two dishes packed into one phrase", () => {
  const items = parse("1 katori rajma 1 bowl brown rice");
  eq(items.length, 2);
  eq(items[0].id, "rajma"); eq(items[1].id, "brown_rice");
});

test("a trailing quantity still belongs to the dish before it", () => {
  const items = parse("मटकीची उसळ १ वाटी");
  eq(items.length, 1);
  eq(items[0].qty, 1); eq(items[0].unit, "bowl");
});

test("understands fractions in both languages", () => {
  eq(parse("half bowl bhendi bhaji")[0].qty, 0.5);
  eq(parse("अर्धी वाटी भेंडीची भाजी")[0].qty, 0.5);
  eq(parse("1/2 bowl varan")[0].qty, 0.5);
});

test("accepts weighed portions", () => {
  const rice = parse("rice 150g")[0];
  eq(rice.unit, "g"); eq(rice.qty, 150);
  eq(parse("milk 200ml")[0].unit, "ml");
});

test("forgives spelling slips", () => {
  eq(parse("bhakari 2")[0].id, "jowar_bhakri");
  eq(parse("chapathi 3")[0].id, "chapati");
});

test("asks which dish when a word genuinely covers several", () => {
  const item = parseMeal("1 bowl usal").items[0];
  ok(item.needsChoice, "'usal' should ask");
  ok(item.options.includes("matki_usal") && item.options.includes("chana_usal"), "offers real variants");
});

test("uses the variant the person usually eats instead of asking again", () => {
  const item = parseMeal("1 bowl usal", { foodStats: { chana_usal: { count: 6, unit: "bowl", qty: 1 } } }).items[0];
  eq(item.needsChoice, false);
  eq(item.foodId, "chana_usal");
});

test("picks up a cooking-oil instruction", () => {
  eq(parseMeal("bhendi bhaji with less oil").items[0].oil, "low");
  eq(parseMeal("कमी तेल भेंडीची भाजी").items[0].oil, "low");
  eq(parseMeal("bhendi bhaji").items[0].oil, "normal");
});

test("reports food it does not know rather than dropping it", () => {
  const { items, unmatched } = parseMeal("1 bowl zzqqxx");
  eq(items.length, 0);
  eq(unmatched.length, 1);
});

test("search finds foods by English, Marathi and alias", () => {
  ok(searchFoods("bhakri").some(f => f.id === "jowar_bhakri"));
  ok(searchFoods("भाकरी").some(f => f.id === "jowar_bhakri"));
  ok(searchFoods("varan").some(f => f.id === "varan"));
});

/* ——— nutrition ——————————————————————————————————————————————— */

test("portion scales calories linearly", () => {
  const one = nutritionFor({ foodId: "jowar_bhakri", qty: 1, unit: "piece", oil: "normal" });
  const two = nutritionFor({ foodId: "jowar_bhakri", qty: 2, unit: "piece", oil: "normal" });
  near(two.kcal, one.kcal * 2, 0.01, "double portion");
});

test("less oil genuinely lowers calories for an oily dish", () => {
  const normal = nutritionFor({ foodId: "bhendi_bhaji", qty: 1, unit: "bowl", oil: "normal" });
  const low = nutritionFor({ foodId: "bhendi_bhaji", qty: 1, unit: "bowl", oil: "low" });
  const high = nutritionFor({ foodId: "bhendi_bhaji", qty: 1, unit: "bowl", oil: "high" });
  ok(low.kcal < normal.kcal, "less oil should be fewer calories");
  ok(high.kcal > normal.kcal, "extra oil should be more calories");
  const expectedDrop = FOOD_BY_ID.bhendi_bhaji.oilG * (1 - OIL_FACTORS.low) * 9;
  near(normal.kcal - low.kcal, expectedDrop, 1, "oil delta");
});

test("oil setting does nothing for a food with no cooking oil", () => {
  const a = nutritionFor({ foodId: "banana", qty: 1, unit: "piece", oil: "normal" });
  const b = nutritionFor({ foodId: "banana", qty: 1, unit: "piece", oil: "low" });
  eq(a.kcal, b.kcal);
});

test("grams and the default serving agree", () => {
  const food = FOOD_BY_ID.cooked_rice;
  const byUnit = nutritionFor({ foodId: "cooked_rice", qty: 1, unit: "bowl", oil: "normal" });
  const byGram = nutritionFor({ foodId: "cooked_rice", qty: food.g, unit: "g", oil: "normal" });
  near(byUnit.kcal, byGram.kcal, 0.01, "bowl vs grams");
});

test("the same meal always costs the same", () => {
  const meal = "2 bhakri, 1 bowl matki usal, half bowl bhendi bhaji";
  const a = totalNutrition(parseMeal(meal).items);
  const b = totalNutrition(parseMeal(meal).items);
  eq(Math.round(a.kcal), Math.round(b.kcal));
  near(a.kcal, 555, 15, "known plate");
});

/* ——— food data integrity ————————————————————————————————————— */

const ALCOHOL = new Set(["beer", "wine", "whisky"]);

test("every food row is complete and self-consistent", () => {
  const problems = [];
  const ids = new Set();
  for (const f of FOODS) {
    if (ids.has(f.id)) problems.push(`${f.id}: duplicate id`);
    ids.add(f.id);
    if (!f.name || !f.unit || !Number.isFinite(f.kcal) || !(f.g > 0)) problems.push(`${f.id}: missing fields`);
    if (!/[ऀ-ॿ]/.test(f.mr || "")) problems.push(`${f.id}: no Marathi name`);
    if (!f.aliases.length) problems.push(`${f.id}: no aliases`);
    if (f.oilG > f.fat + 0.5) problems.push(`${f.id}: more added oil than total fat`);
    if (f.heart < 1 || f.heart > 5) problems.push(`${f.id}: heart score out of range`);
    if (!ALCOHOL.has(f.id) && f.kcal > 30) {
      const macroKcal = f.protein * 4 + f.carbs * 4 + f.fat * 9;
      if (Math.abs(macroKcal - f.kcal) / f.kcal > 0.3) problems.push(`${f.id}: macros ${Math.round(macroKcal)} vs ${f.kcal} kcal`);
    }
    for (const unit of unitsFor(f)) {
      if (!(gramsFor(f, 1, unit) > 0)) problems.push(`${f.id}: unit ${unit} resolves to 0 g`);
    }
  }
  ok(problems.length === 0, problems.join("; "));
});

test("every ambiguous term points at foods that exist", () => {
  for (const [term, ids] of Object.entries(AMBIGUOUS)) {
    for (const id of ids) ok(FOOD_BY_ID[id], `${term} → unknown food ${id}`);
  }
});

test("every meal template references foods that exist", () => {
  for (const idea of MEAL_IDEAS) {
    for (const item of idea.items) {
      ok(FOOD_BY_ID[item.foodId], `${idea.id} → unknown food ${item.foodId}`);
      ok(item.qty > 0, `${idea.id} → ${item.foodId} has no quantity`);
    }
    ok(idea.items.some(i => i.flex), `${idea.id} has nothing the planner can scale`);
  }
});

/* ——— targets ————————————————————————————————————————————————— */

const PROFILE = {
  weightKg: 82, heightCm: 173, age: 34, gender: "male", activity: "light",
  goal: "fatloss", targetWeightKg: 74, typicalSteps: 4800, diet: "nonveg", cuisines: ["mh"], avoid: []
};

test("BMR matches Mifflin–St Jeor", () => {
  near(bmr(PROFILE), 10 * 82 + 6.25 * 173 - 5 * 34 + 5, 0.5, "male BMR");
  near(bmr({ ...PROFILE, gender: "female" }), 10 * 82 + 6.25 * 173 - 5 * 34 - 161, 0.5, "female BMR");
});

test("fat-loss deficit stays sustainable", () => {
  const t = computeTargets(PROFILE, {});
  ok(t.kcal < t.maintenance, "target below maintenance");
  ok(t.maintenance - t.kcal <= 500, "deficit capped at 500 kcal");
  ok(Math.abs(t.projectedWeeklyKg) <= 0.6, "no more than ~0.5 kg a week");
});

test("never recommends a dangerously low intake", () => {
  const tiny = { ...PROFILE, weightKg: 45, heightCm: 150, age: 60, gender: "female", goal: "fatloss", targetWeightKg: 40 };
  const t = computeTargets(tiny, {});
  ok(t.kcal >= 1200, `floor breached: ${t.kcal}`);
  ok(t.kcal >= t.bmr, "never below BMR");
});

test("step goal ramps from the person's own baseline", () => {
  const ramp = [0, 1, 2, 3, 4].map(w => stepTarget(PROFILE, { baselineSteps: 4800, weeksIn: w }));
  eq(ramp[0], 6000, "week 1 is a small step up, not 10,000");
  for (let i = 1; i < ramp.length; i++) ok(ramp[i] >= ramp[i - 1], "goal never goes backwards");
  ok(ramp[ramp.length - 1] <= 10000, "capped at a sustainable ceiling");
});

test("a custom step goal overrides the ramp", () => {
  eq(stepTarget({ ...PROFILE, customStepTarget: 12000 }, { baselineSteps: 4800, weeksIn: 0 }), 12000);
});

test("targets carry protein, fibre and water", () => {
  const t = computeTargets(PROFILE, {});
  ok(t.protein >= 45 && t.protein <= 180, `protein ${t.protein}`);
  ok(t.fibre >= 22, `fibre ${t.fibre}`);
  ok(t.waterMl >= 1500 && t.waterMl % 250 === 0, `water ${t.waterMl}`);
});

test("weight trend reads direction, not daily noise", () => {
  const down = weightTrend([
    { date: "2026-09-01", kg: 82.4 }, { date: "2026-09-05", kg: 82.6 },
    { date: "2026-09-09", kg: 81.9 }, { date: "2026-09-13", kg: 81.5 }
  ]);
  eq(down.direction, "down");
  eq(weightTrend([{ date: "2026-09-01", kg: 82 }]).direction, "flat");
});

/* ——— planner ————————————————————————————————————————————————— */

test("a planned day lands close to the calorie target", () => {
  const targets = computeTargets(PROFILE, {});
  const day = planDay(PROFILE, targets, { seed: 5 });
  near(day.totals.kcal, targets.kcal, targets.kcal * 0.12, "day plan");
  eq(Object.keys(day.plan).length, 4, "four meals");
});

test("suggestions fit the calories that are actually left", () => {
  const targets = computeTargets(PROFILE, {});
  const meal = suggestNext(PROFILE, targets, { kcal: targets.kcal - 750, protein: 60, fibre: 12 }, { slot: "dinner", seed: 5 });
  ok(meal.nutrition.kcal <= 760, `dinner ${Math.round(meal.nutrition.kcal)} kcal should fit in 750`);
  ok(meal.nutrition.kcal >= 450, "and still be a real dinner");
});

test("a mid-morning suggestion is snack-sized, not a full plate", () => {
  const targets = computeTargets(PROFILE, {});
  const meal = suggestNext(PROFILE, targets, { kcal: 300, protein: 10, fibre: 5 }, { slot: "midmorning", seed: 2 });
  ok(meal.nutrition.kcal <= 320, `mid-morning ${Math.round(meal.nutrition.kcal)} kcal`);
});

test("respects vegetarian, eggetarian and allergy lists", () => {
  const targets = computeTargets(PROFILE, {});
  const veg = planDay({ ...PROFILE, diet: "veg", avoid: ["peanut", "curd"] }, targets, { seed: 3 });
  for (const meal of Object.values(veg.plan)) {
    for (const item of meal.items) {
      const food = FOOD_BY_ID[item.foodId];
      eq(food.diet, 1, `${food.name} is not vegetarian`);
      const haystack = [food.name, ...food.aliases].join(" ").toLowerCase();
      ok(!haystack.includes("peanut") && !haystack.includes("curd"), `${food.name} is on the avoid list`);
    }
  }
});

test("does not serve the same plate two days running", () => {
  const targets = computeTargets(PROFILE, {});
  const first = planDay(PROFILE, targets, { seed: 1 });
  const firstIds = Object.values(first.plan).map(m => m.ideaId);
  const second = planDay(PROFILE, targets, { seed: 2, recentIdeaIds: firstIds });
  const repeats = Object.values(second.plan).map(m => m.ideaId).filter(id => firstIds.includes(id));
  eq(repeats.length, 0, `repeated: ${repeats.join(", ")}`);
});

test("picks the next meal from the clock and what's logged", () => {
  eq(nextSlotByClock(8 * 60, {}), "breakfast");
  eq(nextSlotByClock(13 * 60, { breakfast: 2 }), "lunch");
  eq(nextSlotByClock(20 * 60, { breakfast: 2, lunch: 3 }), "dinner");
});

/* ——— workouts ————————————————————————————————————————————————— */

test("every session lands in the 15–20 minute promise", () => {
  for (const exercise of ["beginner", "some", "regular"]) {
    for (let day = 0; day < 7; day++) {
      const w = buildWorkout({ ...PROFILE, exercise, equipment: ["mat"] }, { date: `2026-09-${10 + day}`, dayIndex: day });
      ok(w.minutes >= 13 && w.minutes <= 22, `${exercise} day ${day}: ${w.minutes} min`);
      ok(w.steps.length >= 6, "enough moves");
      ok(w.estimatedKcal > 0 && w.estimatedKcal < 200, `conservative burn: ${w.estimatedKcal}`);
    }
  }
});

test("only uses equipment the person actually has", () => {
  const w = buildWorkout({ ...PROFILE, exercise: "regular", equipment: [] }, { date: "2026-09-12", dayIndex: 4 });
  ok(w.steps.length > 0);
});

test("a hard session yesterday makes today gentler", () => {
  const normal = buildWorkout(PROFILE, { date: "2026-09-12", dayIndex: 1 });
  const eased = buildWorkout(PROFILE, { date: "2026-09-12", dayIndex: 1, lastFeedback: "hard" });
  ok(eased.templateKey !== normal.templateKey, "should switch to an easier focus");
});

/* ——— step import ————————————————————————————————————————————— */

test("reads a step count out of shared or pasted text", () => {
  eq(parseSteps("I walked 7,842 steps today with Step Set Go").steps, 7842);
  eq(parseSteps("Steps: 9310").steps, 9310);
  eq(parseSteps("आज ८४२० पावलं झाली").steps, 8420);
  eq(parseSteps("12k steps today!").steps, 12000);
  eq(parseSteps("StepSetGo: You completed 10,250 steps and earned 12 coins").steps, 10250);
});

test("does not mistake calories, distance or weight for steps", () => {
  eq(parseSteps("5.2 km 420 kcal"), null);
  eq(parseSteps("My weight is 82 kg"), null);
  eq(parseSteps("no numbers here"), null);
  eq(parseSteps("Today 6842 steps · 320 kcal · 4.8 km").steps, 6842);
});

/* ——— report ————————————————————————————————————————————————— */

console.log(`\n  ${passed} passed, ${failures.length} failed\n`);
for (const f of failures) console.log(`  ✗ ${f}\n`);
process.exit(failures.length ? 1 : 0);
