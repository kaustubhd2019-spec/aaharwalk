/* AaharWalk — daily target calculation.
 *
 * Deliberately modular: swap any single function here without touching the UI.
 * Everything returned is an ESTIMATE. The app says so wherever these appear.
 */

import { clamp, round, avg, daysBetween, todayISO } from "../core/util.js";

export const ACTIVITY_LEVELS = {
  sedentary:  { factor: 1.30, en: "Mostly sitting", mr: "बहुतेक बसून", note: "desk job, little walking" },
  light:      { factor: 1.45, en: "Lightly active", mr: "थोडी हालचाल", note: "some walking, light chores" },
  moderate:   { factor: 1.60, en: "Moderately active", mr: "बऱ्यापैकी हालचाल", note: "on your feet often" },
  active:     { factor: 1.75, en: "Very active", mr: "खूप हालचाल", note: "physical work or daily exercise" }
};

export const GOALS = {
  fatloss:     { en: "Lose fat steadily", mr: "वजन हळूहळू कमी करणे" },
  maintain:    { en: "Stay at this weight", mr: "वजन टिकवणे" },
  fitness:     { en: "Get fitter & stronger", mr: "फिटनेस वाढवणे" },
  healthier:   { en: "Just eat healthier", mr: "आरोग्यदायी आहार" }
};

/** Mifflin–St Jeor. The most reliable simple BMR estimate for adults. */
export function bmr({ weightKg, heightCm, age, gender }) {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  if (gender === "female") return base - 161;
  if (gender === "male") return base + 5;
  return base - 78;   // midpoint when unspecified
}

/* A walking step costs roughly 0.00045 kcal per kg of body weight. */
const KCAL_PER_STEP_PER_KG = 0.00045;

/** Extra burn from walking, over and above the activity factor's baseline. */
export function stepCalories(steps, weightKg) {
  const baselineSteps = 3000;               // already priced into the activity factor
  return Math.max(0, steps - baselineSteps) * weightKg * KCAL_PER_STEP_PER_KG;
}

export function maintenanceCalories(profile, recentSteps = null) {
  const base = bmr(profile);
  const factor = (ACTIVITY_LEVELS[profile.activity] || ACTIVITY_LEVELS.light).factor;
  let tdee = base * factor;
  if (Number.isFinite(recentSteps)) {
    const assumed = { sedentary: 3500, light: 5500, moderate: 8000, active: 11000 }[profile.activity] || 5500;
    tdee += (recentSteps - assumed) * profile.weightKg * 0.00045;
  }
  return Math.max(base * 1.15, tdee);
}

/** Never below a safe floor, never a crash diet. */
function safeFloor(profile) {
  const base = bmr(profile);
  const gendered = profile.gender === "female" ? 1200 : 1500;
  return Math.max(gendered, base * 1.05);
}

export function calorieTarget(profile, maintenance) {
  const goal = profile.goal || "healthier";
  let target = maintenance;
  if (goal === "fatloss") {
    // ~0.4 kg/week, capped at 20% below maintenance — sustainable, not aggressive
    target = maintenance - Math.min(500, maintenance * 0.20);
  } else if (goal === "fitness") {
    target = maintenance - Math.min(250, maintenance * 0.10);
  } else if (goal === "healthier") {
    target = maintenance - Math.min(150, maintenance * 0.05);
  }
  return Math.max(safeFloor(profile), target);
}

export function proteinTarget(profile) {
  const reference = Math.min(profile.weightKg, profile.targetWeightKg || profile.weightKg) || profile.weightKg;
  const perKg = profile.goal === "fatloss" ? 1.6 : profile.goal === "fitness" ? 1.7 : 1.2;
  return clamp(Math.round(reference * perKg), 45, 180);
}

export function fibreTarget(kcalTarget) {
  return clamp(Math.round((kcalTarget / 1000) * 14), 22, 45);
}

export function waterTarget(profile, steps = 0) {
  const base = profile.weightKg * 30;                             // ~30 ml per kg
  const activityBonus = Math.min(500, Math.max(0, steps - 6000) / 1000 * 60);
  return clamp(Math.round((base + activityBonus) / 250) * 250, 1500, 4000);
}

export function fatCarbGuidance(kcalTarget, proteinG) {
  const proteinKcal = proteinG * 4;
  const fatKcal = kcalTarget * 0.27;                  // ~27% of energy from fat
  const carbKcal = Math.max(0, kcalTarget - proteinKcal - fatKcal);
  return {
    fatG: Math.round(fatKcal / 9),
    carbsG: Math.round(carbKcal / 4),
    satFatMaxG: Math.round((kcalTarget * 0.08) / 9),  // keep saturated fat modest
    addedSugarMaxG: Math.round((kcalTarget * 0.06) / 4)
  };
}

/**
 * Step goal that ramps from where the person actually is.
 * We do not demand 10,000 on day one.
 */
export function stepTarget(profile, { baselineSteps, weeksIn = 0, recentAverage = null } = {}) {
  if (profile.customStepTarget) return profile.customStepTarget;
  const baseline = baselineSteps || profile.typicalSteps || 4000;
  const ceiling = baseline >= 9000 ? Math.min(14000, baseline + 2000) : 10000;
  const start = Math.max(3000, Math.round(baseline / 500) * 500);
  let target = start + (weeksIn + 1) * 1000;   // week 1 is already a small step up
  // if they are already beating the plan, move the plan up with them
  if (Number.isFinite(recentAverage) && recentAverage > target) {
    target = Math.round((recentAverage + 500) / 500) * 500;
  }
  return clamp(Math.round(target / 500) * 500, 3000, ceiling);
}

export function bmi(weightKg, heightCm) {
  const m = heightCm / 100;
  return m > 0 ? weightKg / (m * m) : NaN;
}

/** Standard adult bands, plus the lower thresholds used for South Asian adults. */
export function bmiBand(value, southAsian = true) {
  const bands = southAsian
    ? [[18.5, "Below healthy range", "low"], [23, "Healthy range", "good"], [25, "Above healthy range", "warn"], [Infinity, "Well above healthy range", "high"]]
    : [[18.5, "Below healthy range", "low"], [25, "Healthy range", "good"], [30, "Above healthy range", "warn"], [Infinity, "Well above healthy range", "high"]];
  const row = bands.find(b => value < b[0]) || bands[bands.length - 1];
  return { label: row[1], tone: row[2] };
}

/**
 * One snapshot of everything the dashboard needs.
 * Recomputed whenever the profile, weight or recent activity changes.
 */
export function computeTargets(profile, history = {}) {
  const { recentSteps = null, weeksIn = 0, recentStepAverage = null } = history;
  const base = bmr(profile);
  const maintenance = maintenanceCalories(profile, recentSteps);
  const kcal = calorieTarget(profile, maintenance);
  const protein = proteinTarget(profile);
  const fibre = fibreTarget(kcal);
  const steps = stepTarget(profile, { baselineSteps: profile.typicalSteps, weeksIn, recentAverage: recentStepAverage });
  const water = waterTarget(profile, steps);
  const macros = fatCarbGuidance(kcal, protein);

  const weeklyDeficit = (maintenance - kcal) * 7;
  const weeklyChangeKg = weeklyDeficit / 7700;

  return {
    bmr: Math.round(base),
    maintenance: Math.round(maintenance),
    kcal: Math.round(kcal / 10) * 10,
    protein,
    fibre,
    steps,
    waterMl: water,
    ...macros,
    bmi: round(bmi(profile.weightKg, profile.heightCm), 1),
    projectedWeeklyKg: round(weeklyChangeKg, 2),
    computedAt: todayISO()
  };
}

/** Weight trend from the last logged weights — smoothed, not day-to-day noise. */
export function weightTrend(weights = []) {
  if (weights.length < 2) return { changeKg: 0, perWeekKg: 0, direction: "flat", points: weights };
  const sorted = [...weights].sort((a, b) => a.date.localeCompare(b.date));
  const firstHalf = sorted.slice(0, Math.ceil(sorted.length / 2));
  const secondHalf = sorted.slice(Math.floor(sorted.length / 2));
  const change = avg(secondHalf, w => w.kg) - avg(firstHalf, w => w.kg);
  const days = Math.max(1, daysBetween(sorted[0].date, sorted[sorted.length - 1].date));
  const perWeek = (change / days) * 7;
  return {
    changeKg: round(sorted[sorted.length - 1].kg - sorted[0].kg, 1),
    perWeekKg: round(perWeek, 2),
    direction: perWeek < -0.1 ? "down" : perWeek > 0.1 ? "up" : "flat",
    points: sorted
  };
}

/**
 * Nudge the calorie target when real-world progress disagrees with the maths.
 * Small, bounded adjustments only.
 */
export function adjustForProgress(targets, profile, trend) {
  if (!trend || Math.abs(trend.perWeekKg) < 0.001) return targets;
  const goal = profile.goal;
  let delta = 0;
  if (goal === "fatloss") {
    if (trend.perWeekKg > -0.1) delta = -100;           // stalled
    else if (trend.perWeekKg < -0.9) delta = +120;      // dropping too fast
  } else if (goal === "maintain") {
    if (trend.perWeekKg > 0.25) delta = -100;
    else if (trend.perWeekKg < -0.25) delta = +100;
  }
  if (!delta) return targets;
  const floorKcal = Math.max(profile.gender === "female" ? 1200 : 1500, targets.bmr * 1.05);
  return { ...targets, kcal: Math.round(Math.max(floorKcal, targets.kcal + delta) / 10) * 10, adjusted: delta };
}
