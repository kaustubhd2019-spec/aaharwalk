/* AaharWalk — builds a 15–20 minute home session for the day.
 *
 * The plan rotates through focuses so nothing is trained two days running,
 * and it adapts to level, available equipment, age, and how the last session felt.
 */

import { EXERCISES, EXERCISE_BY_ID } from "../data/exercises.js";
import { shuffle, daysBetween, round } from "../core/util.js";

const ROTATION = [
  { key: "cardio_mobility", en: "Brisk cardio + mobility", mr: "कार्डिओ + मोकळेपणा", blocks: ["cardio", "mobility"] },
  { key: "strength_lower", en: "Lower-body strength", mr: "पायांची ताकद", blocks: ["strength"], focus: "lower" },
  { key: "yoga_mobility", en: "Yoga + mobility", mr: "योगा + मोकळेपणा", blocks: ["yoga"] },
  { key: "cardio_light", en: "Low-impact cardio", mr: "सोपा कार्डिओ", blocks: ["cardio"], easy: true },
  { key: "strength_full", en: "Full-body strength", mr: "संपूर्ण शरीर ताकद", blocks: ["strength"] },
  { key: "yoga_calm", en: "Gentle yoga & breathing", mr: "सौम्य योगा व श्वास", blocks: ["yoga"], easy: true },
  { key: "cardio_strength", en: "Cardio + strength mix", mr: "कार्डिओ + ताकद", blocks: ["cardio", "strength"] }
];

const LOWER = new Set(["squat", "chair_squat", "reverse_lunge", "glute_bridge", "calf_raise", "wall_sit", "band_squat"]);

function levelFor(profile) {
  const experience = profile.exercise || "beginner";
  const base = experience === "regular" ? 3 : experience === "some" ? 2 : 1;
  if ((profile.age || 30) > 60) return Math.min(base, 2);
  return base;
}

function usable(profile, level) {
  const owned = new Set(["none", ...(profile.equipment || [])]);
  return EXERCISES.filter(e => owned.has(e.equip) && e.level <= level);
}

function pick(pool, type, count, seed, filter = null) {
  const candidates = shuffle(pool.filter(e => e.type === type), seed);
  if (!filter) return candidates.slice(0, count);
  // Prefer the focused exercises, then top up from the rest of the same type.
  const focused = candidates.filter(filter);
  const rest = candidates.filter(e => !filter(e));
  return [...focused, ...rest].slice(0, count);
}

/**
 * @param {object} profile
 * @param {{date:string, dayIndex:number, minutes?:number, lastFeedback?:string, steps?:number}} ctx
 */
export function buildWorkout(profile, ctx = {}) {
  const level = levelFor(profile);
  const dayIndex = ctx.dayIndex ?? 0;
  const seed = Number(String(ctx.date || "").replace(/-/g, "")) || dayIndex + 1;

  let template = ROTATION[dayIndex % ROTATION.length];
  // If yesterday felt hard, or they already walked a lot, take the gentler option.
  if (ctx.lastFeedback === "hard" && !template.easy) {
    template = ROTATION.find(r => r.easy && r.blocks[0] === template.blocks[0]) || ROTATION[2];
  }

  const targetMinutes = ctx.minutes || (level === 1 ? 15 : level === 2 ? 18 : 20);
  const pool = usable(profile, level);

  const warmup = pick(pool, "warmup", 2, seed);
  const cooldown = pick(pool, "cooldown", 2, seed + 7);

  const main = [];
  for (const block of template.blocks) {
    const filter = template.focus === "lower" ? e => LOWER.has(e.id) : null;
    const count = template.blocks.length > 1 ? 3 : 5;
    main.push(...pick(pool, block, count, seed + block.length, filter));
  }
  if (main.length < 4) main.push(...pick(pool, "strength", 4 - main.length, seed + 19));

  const workSec = template.blocks.includes("yoga") ? 50 : level === 1 ? 35 : 45;
  const restSec = level === 1 ? 25 : 15;

  const warmupSteps = warmup.map(e => step(e, 40, 10, "warmup"));
  const cooldownSteps = cooldown.map(e => step(e, 40, 5, "cooldown"));
  const bookendSec = [...warmupSteps, ...cooldownSteps].reduce((t, s) => t + s.workSec + s.restSec, 0);

  // Fill the remaining time by cycling through the main exercises, so the
  // session actually lands on the promised 15–20 minutes.
  const perSlot = workSec + restSec;
  const slots = Math.max(main.length, Math.round((targetMinutes * 60 - bookendSec) / perSlot));
  const mainSteps = Array.from({ length: slots }, (_, i) => {
    const exercise = main[i % main.length];
    const roundNo = slots > main.length ? Math.floor(i / main.length) + 1 : null;
    return step(exercise, workSec, restSec, "main", roundNo);
  });

  const sequence = [...warmupSteps, ...mainSteps, ...cooldownSteps];
  const totalSec = sequence.reduce((t, s) => t + s.workSec + s.restSec, 0);
  const rounds = Math.ceil(slots / main.length);

  const minutes = Math.round(totalSec / 60);
  return {
    id: `${ctx.date || "plan"}-${template.key}`,
    date: ctx.date,
    templateKey: template.key,
    titleEn: template.en,
    titleMr: template.mr,
    minutes,
    rounds,
    level,
    steps: sequence,
    estimatedKcal: estimateKcal(sequence, profile.weightKg || 70)
  };
}

function step(exercise, workSec, restSec, phase, roundNo = null) {
  return { id: exercise.id, workSec, restSec, phase, roundNo };
}

/** Conservative: rest periods count at a resting MET, and we round down. */
export function estimateKcal(steps, weightKg) {
  let kcal = 0;
  for (const s of steps) {
    const met = (EXERCISE_BY_ID[s.id] || {}).met || 3;
    kcal += met * 3.5 * weightKg / 200 * (s.workSec / 60);
    kcal += 1.3 * 3.5 * weightKg / 200 * (s.restSec / 60);
  }
  return Math.floor(kcal / 5) * 5;
}

export function exerciseInfo(id) {
  return EXERCISE_BY_ID[id] || null;
}

export function workoutTitle(workout, lang = "en") {
  if (!workout) return "";
  return `${workout.minutes} min ${lang === "mr" ? workout.titleMr : workout.titleEn}`;
}

/** How many workouts were completed in the given days. */
export function workoutStreak(days = []) {
  let streak = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i] && days[i].workout && days[i].workout.completedAt) streak += 1;
    else break;
  }
  return streak;
}
