/* AaharWalk — realistic sample data so the app is worth looking at on day one.
   Loaded only when the user asks for it from Profile, or on the demo route. */

import { getState, update, emptyDay } from "../core/store.js";
import { todayISO, addDays, uid } from "../core/util.js";
import { buildWorkout } from "../engine/workouts.js";

const DEMO_PROFILE = {
  name: "Kaustubh",
  age: 34, gender: "male",
  heightCm: 173, weightKg: 82, targetWeightKg: 74,
  activity: "light", typicalSteps: 4800,
  goal: "fatloss",
  diet: "nonveg", cuisines: ["mh", "generic"], avoid: [],
  sleepHours: 7, waterNowL: 2,
  exercise: "beginner", equipment: ["mat"],
  heartFocus: true, doctorAdvice: false,
  startedOn: addDays(todayISO(), -16)
};

/* A believable week of Maharashtrian eating. */
const PATTERNS = [
  {
    breakfast: [["kanda_poha", 1, "bowl"], ["tea_milk_sugar", 1, "cup"], ["banana", 1, "piece"]],
    lunch: [["jowar_bhakri", 3, "piece"], ["matki_usal", 1, "bowl"], ["bhendi_bhaji", 1, "bowl"], ["kachumber", 1, "bowl"], ["curd", 1, "bowl"]],
    snack: [["tea_milk_sugar", 1, "cup"], ["biscuit_marie", 2, "piece"], ["peanuts", 1, "tbsp"]],
    dinner: [["chapati", 2, "piece"], ["varan", 1, "bowl"], ["kobi_bhaji", 1, "bowl"], ["cooked_rice", 0.5, "bowl"]]
  },
  {
    breakfast: [["upma", 1, "bowl"], ["buttermilk", 1, "glass"], ["boiled_egg", 2, "piece"]],
    lunch: [["chapati", 3, "piece"], ["chana_usal", 1, "bowl"], ["palak_bhaji", 1, "bowl"], ["curd", 1, "bowl"], ["cooked_rice", 0.5, "bowl"]],
    snack: [["peanuts", 2, "tbsp"], ["tea_no_sugar", 1, "cup"], ["apple", 1, "piece"]],
    dinner: [["jowar_bhakri", 2, "piece"], ["pithla", 1, "bowl"], ["onion_salad", 1, "plate"], ["papad_roasted", 1, "piece"]]
  },
  {
    breakfast: [["idli", 4, "piece"], ["sambar", 1, "bowl"], ["coconut_chutney", 1, "tbsp"]],
    lunch: [["cooked_rice", 1, "bowl"], ["fish_curry", 1, "bowl"], ["dodka_bhaji", 1, "bowl"], ["kakdi", 1, "bowl"], ["chapati", 1, "piece"]],
    snack: [["banana", 1, "piece"], ["tea_milk_sugar", 1, "cup"], ["chivda", 1, "bowl"]],
    dinner: [["chapati", 3, "piece"], ["moong_dal", 1, "bowl"], ["gajar_beans", 1, "bowl"], ["curd", 1, "bowl"]]
  },
  {
    breakfast: [["thalipeeth", 2, "piece"], ["curd", 1, "bowl"], ["tea_milk_sugar", 1, "cup"]],
    lunch: [["jowar_bhakri", 2, "piece"], ["chicken_curry", 1, "bowl"], ["onion_salad", 1, "plate"], ["cooked_rice", 0.5, "bowl"]],
    snack: [["sprouts_salad", 1, "bowl"], ["tea_no_sugar", 1, "cup"]],
    dinner: [["khichdi", 1, "bowl"], ["curd", 1, "bowl"], ["kachumber", 1, "bowl"], ["papad_roasted", 2, "piece"]]
  },
  {
    breakfast: [["kanda_poha", 1, "bowl"], ["boiled_egg", 2, "piece"], ["tea_milk_sugar", 1, "cup"]],
    lunch: [["chapati", 2, "piece"], ["rajma", 1, "bowl"], ["cooked_rice", 1, "bowl"], ["green_salad", 1, "plate"]],
    snack: [["tea_milk_sugar", 1, "cup"], ["chivda", 1, "bowl"]],
    dinner: [["nachni_bhakri", 2, "piece"], ["methi_bhaji", 1, "bowl"], ["varan", 1, "bowl"], ["curd", 1, "bowl"]]
  },
  {
    breakfast: [["oats_porridge", 1, "bowl"], ["banana", 1, "piece"], ["almonds", 10, "piece"], ["milk_toned", 1, "glass"]],
    lunch: [["veg_pulao", 1, "bowl"], ["raita", 1, "bowl"], ["papad_roasted", 1, "piece"], ["chapati", 1, "piece"]],
    snack: [["vada_pav", 1, "piece"], ["tea_milk_sugar", 1, "cup"]],
    dinner: [["chapati", 2, "piece"], ["bhendi_bhaji", 1, "bowl"], ["toor_dal", 1, "bowl"], ["cooked_rice", 0.5, "bowl"]]
  },
  {
    breakfast: [["misal_pav", 1, "plate"], ["tea_milk_sugar", 1, "cup"]],
    lunch: [["cooked_rice", 1, "bowl"], ["amti", 1, "bowl"], ["batata_bhaji", 1, "bowl"], ["koshimbir", 1, "bowl"], ["chapati", 1, "piece"]],
    snack: [["apple", 1, "piece"], ["almonds", 10, "piece"]],
    dinner: [["jowar_bhakri", 2, "piece"], ["mixed_usal", 1, "bowl"], ["kobi_bhaji", 1, "bowl"], ["buttermilk", 1, "glass"]]
  }
];

const STEPS = [4820, 6140, 5310, 8452, 7180, 9260, 6890, 5940, 7720, 8130, 6410, 9050, 7460, 8240];
const WEIGHTS = { 13: 82.4, 10: 82.1, 7: 81.8, 4: 81.5, 2: 81.2, 0: 81.0 };

export function loadDemoData() {
  const today = todayISO();

  update(state => {
    state.profile = { ...DEMO_PROFILE };
    state.settings.reminders.water = true;
    state.days = {};
    state.foodStats = {};
    state.workouts = {};
    state.plans = {};

    for (let back = 13; back >= 0; back--) {
      const date = addDays(today, -back);
      const day = emptyDay(date);
      const pattern = PATTERNS[(13 - back) % PATTERNS.length];

      for (const [slot, rows] of Object.entries(pattern)) {
        // Today is only partly done — the app should look "mid-day", not finished.
        if (back === 0 && (slot === "dinner" || (new Date().getHours() < 17 && slot === "snack"))) continue;
        day.meals[slot] = rows.map(([foodId, qty, unit]) => ({
          id: uid("e"), foodId, qty, unit, oil: "normal",
          confidence: "medium", loggedAt: `${date}T12:00:00.000Z`
        }));
        for (const [foodId, qty, unit] of rows) {
          const stat = state.foodStats[foodId] || { count: 0, lastUsed: null, unit, qty };
          stat.count += 1;
          stat.lastUsed = date;
          stat.unit = unit;
          stat.qty = qty;
          state.foodStats[foodId] = stat;
        }
      }

      day.steps = back === 0 ? Math.round(STEPS[13] * 0.72) : STEPS[13 - back];
      day.waterMl = back === 0 ? 1750 : 2000 + ((13 - back) % 3) * 250;
      if (WEIGHTS[back] != null) day.weightKg = WEIGHTS[back];

      if (back > 0 && (13 - back) % 7 !== 6 && (13 - back) % 7 !== 2) {
        const workout = buildWorkout(state.profile, { date, dayIndex: 13 - back });
        day.workout = {
          id: workout.id,
          title: `${workout.minutes} min ${workout.titleEn}`,
          minutes: workout.minutes,
          kcal: workout.estimatedKcal,
          feedback: null,
          completedAt: `${date}T07:30:00.000Z`
        };
      }

      state.days[date] = day;
    }

    state.favorites = [
      {
        id: uid("fav"), name: "Usual lunch", slot: "lunch",
        entries: [
          { foodId: "jowar_bhakri", qty: 2, unit: "piece", oil: "normal" },
          { foodId: "matki_usal", qty: 1, unit: "bowl", oil: "normal" },
          { foodId: "bhendi_bhaji", qty: 1, unit: "bowl", oil: "normal" }
        ],
        createdAt: new Date().toISOString()
      },
      {
        id: uid("fav"), name: "Light dinner", slot: "dinner",
        entries: [
          { foodId: "chapati", qty: 2, unit: "piece", oil: "normal" },
          { foodId: "varan", qty: 1, unit: "bowl", oil: "normal" },
          { foodId: "palak_bhaji", qty: 1, unit: "bowl", oil: "low" }
        ],
        createdAt: new Date().toISOString()
      }
    ];

    state.meta.demoLoaded = true;
  });
}

export function hasProfile() {
  return Boolean(getState().profile);
}
