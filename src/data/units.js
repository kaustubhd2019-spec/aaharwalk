/* AaharWalk — portion units.
 *
 * A "bowl" is not one fixed weight: a bowl of dal and a bowl of rice differ.
 * So gram weight resolves in this order:
 *   1. the food's own default serving (when the user uses that unit)
 *   2. a per-category weight for that unit
 *   3. a generic fallback
 */

export const UNITS = {
  piece:   { key: "piece",   en: "piece",    mr: "नग",     short: "pc" },
  bowl:    { key: "bowl",    en: "bowl",     mr: "वाटी",   short: "bowl" },
  plate:   { key: "plate",   en: "plate",    mr: "प्लेट",  short: "plate" },
  glass:   { key: "glass",   en: "glass",    mr: "ग्लास",  short: "glass" },
  cup:     { key: "cup",     en: "cup",      mr: "कप",     short: "cup" },
  slice:   { key: "slice",   en: "slice",    mr: "स्लाईस", short: "slice" },
  tbsp:    { key: "tbsp",    en: "tablespoon", mr: "मोठा चमचा", short: "tbsp" },
  tsp:     { key: "tsp",     en: "teaspoon", mr: "चमचा",   short: "tsp" },
  serving: { key: "serving", en: "serving",  mr: "सर्व्हिंग", short: "srv" },
  g:       { key: "g",       en: "grams",    mr: "ग्रॅम",  short: "g" },
  ml:      { key: "ml",      en: "ml",       mr: "मिली",   short: "ml" }
};

/** Words the parser accepts for each unit (English + transliterated + Devanagari). */
export const UNIT_ALIASES = {
  bowl: ["bowl", "bowls", "katori", "katoris", "vati", "vaati", "wati", "watis", "vatya", "वाटी", "वाट्या", "कटोरी", "बाउल", "कटोरा"],
  plate: ["plate", "plates", "thali", "प्लेट", "ताट", "थाळी"],
  glass: ["glass", "glasses", "ग्लास", "पेला"],
  cup: ["cup", "cups", "कप"],
  slice: ["slice", "slices", "स्लाईस", "तुकडा", "टुकड़ा"],
  tbsp: ["tbsp", "tablespoon", "tablespoons", "tblsp", "मोठा चमचा", "टेबलस्पून", "मोठे चमचे"],
  tsp: ["tsp", "teaspoon", "teaspoons", "chamcha", "chamche", "चमचा", "चमचे", "छोटा चमचा", "टीस्पून"],
  piece: ["piece", "pieces", "pcs", "pc", "nos", "no", "nag", "नग", "तुकडे"],
  serving: ["serving", "servings", "helping", "सर्व्हिंग"],
  g: ["g", "gm", "gms", "gram", "grams", "ग्रॅम", "ग्राम"],
  ml: ["ml", "mls", "millilitre", "milliliter", "मिली", "एमएल"]
};

/** Gram weight of one unit, by food category. */
const CATEGORY_UNIT_GRAMS = {
  dal:    { bowl: 150, plate: 200, cup: 180, tbsp: 18, tsp: 6 },
  usal:   { bowl: 150, plate: 200, cup: 180, tbsp: 18, tsp: 6 },
  sabzi:  { bowl: 120, plate: 160, cup: 140, tbsp: 15, tsp: 5 },
  rice:   { bowl: 150, plate: 220, cup: 170, tbsp: 18, tsp: 6 },
  breakfast: { bowl: 180, plate: 200, cup: 160, tbsp: 18, tsp: 6 },
  salad:  { bowl: 120, plate: 100, cup: 120, tbsp: 15, tsp: 5 },
  dairy:  { bowl: 150, glass: 200, cup: 150, tbsp: 15, tsp: 5 },
  drink:  { glass: 200, cup: 150, bowl: 200, tbsp: 15, tsp: 5 },
  fruit:  { bowl: 150, plate: 150, cup: 140, piece: 120 },
  nuts:   { bowl: 30, tbsp: 12, tsp: 4, plate: 30 },
  snack:  { bowl: 30, plate: 80, tbsp: 12, tsp: 4 },
  sweet:  { bowl: 100, plate: 100, tbsp: 20, tsp: 7 },
  street: { plate: 250, bowl: 200 },
  nonveg: { bowl: 150, plate: 200, piece: 100 },
  egg:    { bowl: 120, plate: 120, piece: 50 },
  bread:  { piece: 45, plate: 90 },
  fat:    { tsp: 5, tbsp: 14, bowl: 100 },
  misc:   { tsp: 6, tbsp: 15, bowl: 60 }
};

const GENERIC_UNIT_GRAMS = {
  bowl: 150, plate: 180, glass: 200, cup: 150, slice: 30,
  tbsp: 15, tsp: 5, piece: 60, serving: 150, g: 1, ml: 1
};

/** Units offered in the editor for a given food, most natural first. */
export function unitsFor(food) {
  const base = [food.unit];
  const byCat = {
    bread: ["piece", "g"],
    rice: ["bowl", "plate", "g"],
    dal: ["bowl", "cup", "g"],
    usal: ["bowl", "cup", "g"],
    sabzi: ["bowl", "plate", "g"],
    breakfast: ["bowl", "plate", "piece", "g"],
    snack: ["piece", "bowl", "g"],
    street: ["plate", "piece"],
    nonveg: ["bowl", "piece", "g"],
    egg: ["piece", "bowl"],
    dairy: ["bowl", "glass", "cup", "g"],
    drink: ["glass", "cup", "ml"],
    fruit: ["piece", "bowl", "g"],
    salad: ["bowl", "plate", "g"],
    nuts: ["piece", "tbsp", "g"],
    sweet: ["piece", "bowl", "g"],
    fat: ["tsp", "tbsp"],
    misc: ["tsp", "tbsp", "bowl"]
  }[food.cat] || ["serving", "g"];
  return [...new Set([...base, ...byCat, "g"])];
}

/** Grams contained in `qty` of `unit` for this food. */
export function gramsFor(food, qty, unit) {
  if (unit === "g" || unit === "ml") return qty;
  if (unit === food.unit || unit === "serving") return qty * food.g;
  const perUnit = (CATEGORY_UNIT_GRAMS[food.cat] || {})[unit] ?? GENERIC_UNIT_GRAMS[unit] ?? food.g;
  return qty * perUnit;
}

export function unitLabel(unitKey, lang = "en", qty = 1) {
  const unit = UNITS[unitKey];
  if (!unit) return unitKey;
  if (lang === "mr") return unit.mr;
  if (unitKey === "g" || unitKey === "ml") return unitKey;
  return qty <= 1 ? unit.en : `${unit.en}s`;
}

/** "2 bhakri" → "2 pieces"; "0.5 bowl" → "½ bowl" */
export function qtyLabel(qty) {
  const fractions = { 0.25: "¼", 0.5: "½", 0.75: "¾", 1.5: "1½", 2.5: "2½" };
  if (fractions[qty]) return fractions[qty];
  return String(Math.round(qty * 100) / 100);
}

export const UNIT_LOOKUP = (() => {
  const map = new Map();
  for (const [key, words] of Object.entries(UNIT_ALIASES)) {
    for (const word of words) map.set(word, key);
  }
  return map;
})();
