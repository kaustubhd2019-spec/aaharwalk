/* AaharWalk — turns a parsed item into estimated nutrition.
 *
 * Calories come from the food database, scaled by portion and cooking oil.
 * Nothing here invents numbers, so logging the same meal twice gives the
 * same answer both times.
 */

import { gramsFor } from "../data/units.js";
import { foodById } from "./parser.js";
import { approx, round } from "../core/util.js";

/** How much the stated cooking style scales the oil already in the recipe. */
export const OIL_FACTORS = { low: 0.45, normal: 1, high: 1.8 };
export const OIL_LABELS = {
  low: { en: "Less oil", mr: "कमी तेल" },
  normal: { en: "Normal", mr: "नेहमीसारखं" },
  high: { en: "Extra oil", mr: "जास्त तेल" }
};

const KCAL_PER_G_FAT = 9;

/**
 * @param {{foodId,qty,unit,oil}} item
 * @returns {{kcal,protein,carbs,fat,fibre,grams,food,confidence,note}}
 */
export function nutritionFor(item) {
  const food = foodById(item.foodId);
  if (!food) return null;

  const grams = gramsFor(food, item.qty, item.unit);
  const ratio = food.g > 0 ? grams / food.g : item.qty;

  const oilFactor = OIL_FACTORS[item.oil] ?? 1;
  const oilDeltaG = (food.oilG || 0) * ratio * (oilFactor - 1);

  const kcal = food.kcal * ratio + oilDeltaG * KCAL_PER_G_FAT;
  const fat = food.fat * ratio + oilDeltaG;

  return {
    food,
    grams: round(grams, 0),
    kcal: Math.max(0, kcal),
    protein: Math.max(0, food.protein * ratio),
    carbs: Math.max(0, food.carbs * ratio),
    fat: Math.max(0, fat),
    fibre: Math.max(0, food.fibre * ratio),
    confidence: item.confidence || confidenceFor(item, food),
    note: noteFor(item, food)
  };
}

function confidenceFor(item, food) {
  if (item.unit === "g" || item.unit === "ml") return "high";
  if (food.oilG > 6) return "low";           // heavily fried/oily home dishes vary a lot
  return "medium";
}

function noteFor(item, food) {
  if (item.unit === "g" || item.unit === "ml") return "weighed";
  if (food.oilG >= 8) return "oil-sensitive";
  if (food.cat === "street" || food.cat === "nonveg") return "recipe-varies";
  return "standard-serving";
}

/** Sum a list of logged entries into one nutrition total. */
export function totalNutrition(entries = []) {
  const total = { kcal: 0, protein: 0, carbs: 0, fat: 0, fibre: 0 };
  for (const entry of entries) {
    const n = nutritionFor(entry);
    if (!n) continue;
    total.kcal += n.kcal;
    total.protein += n.protein;
    total.carbs += n.carbs;
    total.fat += n.fat;
    total.fibre += n.fibre;
  }
  return total;
}

export function dayTotals(day) {
  const all = Object.values(day.meals || {}).flat();
  return totalNutrition(all);
}

export function slotTotals(day) {
  const out = {};
  for (const [slot, entries] of Object.entries(day.meals || {})) {
    out[slot] = totalNutrition(entries);
  }
  return out;
}

/** Display helper — we never show false precision. */
export function displayKcal(kcal) {
  if (kcal < 100) return approx(kcal, 5);
  if (kcal < 1000) return approx(kcal, 5);
  return approx(kcal, 10);
}

/**
 * Lighter swaps for a food the user just logged. Supportive, never a lecture.
 * Returns at most 3 suggestions that each save a meaningful number of calories.
 */
export function swapsFor(entry) {
  const n = nutritionFor(entry);
  if (!n) return [];
  const food = n.food;
  const out = [];

  if (entry.qty > 1 && food.cat === "bread") {
    const saved = n.kcal / entry.qty;
    out.push({ saves: saved, en: `${entry.qty - 1} instead of ${entry.qty}`, mr: `${entry.qty} ऐवजी ${entry.qty - 1}` });
  }
  if ((food.oilG || 0) >= 5 && entry.oil !== "low") {
    const saved = (food.oilG * (n.grams / food.g)) * (1 - OIL_FACTORS.low) * KCAL_PER_G_FAT;
    out.push({ saves: saved, en: "cook it with less oil next time", mr: "पुढच्या वेळी कमी तेलात करा" });
  }
  if (food.heart <= 2) {
    out.push({ saves: 0, en: "pair it with salad or koshimbir so the meal still fills you up", mr: "सोबत सॅलड किंवा कोशिंबीर घ्या" });
  }
  if (food.cat === "sweet") {
    out.push({ saves: Math.max(0, n.kcal - 100), en: "curd or a fruit satisfies the same craving for less", mr: "दही किंवा फळ हा हलका पर्याय आहे" });
  }
  return out.filter(s => s.saves >= 40 || s.saves === 0).slice(0, 3);
}
