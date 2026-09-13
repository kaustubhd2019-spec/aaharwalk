/* AaharWalk — natural-language food parser.
 *
 * Turns "2 bhakri, 1 वाटी मटकीची उसळ, half bowl bhendi" into structured items.
 * The parser only decides WHAT and HOW MUCH. Calories always come from the
 * database (see nutrition.js) so the same meal never gets two different numbers.
 */

import { FOODS, FOOD_BY_ID, AMBIGUOUS, DEFAULT_FOR } from "../data/foods.js";
import { UNIT_LOOKUP } from "../data/units.js";
import { norm, latinDigits, editDistance } from "../core/util.js";

const NUMBER_WORDS = new Map(Object.entries({
  one: 1, ek: 1, eka: 1, aik: 1, "एक": 1, "एका": 1,
  two: 2, do: 2, don: 2, doan: 2, "दोन": 2, "दो": 2,
  three: 3, teen: 3, tin: 3, "तीन": 3,
  four: 4, char: 4, chaar: 4, "चार": 4,
  five: 5, panch: 5, paanch: 5, pach: 5, "पाच": 5, "पांच": 5,
  six: 6, saha: 6, chhe: 6, "सहा": 6, "छह": 6,
  seven: 7, saat: 7, sat: 7, "सात": 7,
  eight: 8, aath: 8, ath: 8, "आठ": 8,
  nine: 9, nau: 9, "नऊ": 9, "नौ": 9,
  ten: 10, daha: 10, das: 10, dus: 10, "दहा": 10, "दस": 10,
  twelve: 12, bara: 12, "बारा": 12
}));

const FRACTION_WORDS = new Map(Object.entries({
  half: 0.5, aadha: 0.5, adha: 0.5, adhi: 0.5, adha: 0.5, ardha: 0.5, ardhi: 0.5, ardhe: 0.5,
  "अर्धा": 0.5, "अर्धी": 0.5, "अर्धे": 0.5, "आधा": 0.5, "आधी": 0.5,
  quarter: 0.25, pav: 0.25, paav: 0.25, "पाव": 0.25, "चौथाई": 0.25,
  dedh: 1.5, "दीड": 1.5, "देड": 1.5,
  adich: 2.5, "अडीच": 2.5,
  paun: 0.75, "पाऊण": 0.75, "पौन": 0.75
}));

/* Words that carry no food meaning — dropped before matching. */
const NOISE = new Set([
  "aaj", "today", "aj", "आज", "kal", "yesterday", "काल",
  "i", "ate", "had", "eat", "eaten", "ravlo", "khalla", "khalle", "khalli", "khal",
  "खाल्ल", "खाल्ले", "खाल्ला", "खाल्ली", "खाल्लं", "खाल्लय", "खाल्लंय",
  "khalla", "khaalle", "khadlo", "my", "me", "some", "a", "an", "the",
  "of", "with", "and", "plus", "ka", "ki", "ke", "cha", "chi", "che", "chya",
  "चा", "ची", "चे", "च्या", "का", "की", "के", "ने", "मी", "होते", "होता",
  "la", "ला", "madhe", "मध्ये", "var", "वर", "for", "at", "in", "on",
  "ani", "आणि", "आणी", "aani", "aur", "और",
  "was", "were", "is", "one", "just", "only", "fakt", "फक्त"
]);

const MEAL_HINTS = [
  ["breakfast", ["breakfast", "nashta", "nasta", "nyahari", "न्याहारी", "नाश्ता", "सकाळी", "morning"]],
  ["lunch", ["lunch", "dupar", "dupari", "जेवण", "दुपारी", "दुपारचे", "लंच", "afternoon"]],
  ["dinner", ["dinner", "ratri", "रात्री", "रात्रीचे", "डिनर", "night", "evening meal"]],
  ["snack", ["snack", "nashtha", "स्नॅक", "चहासोबत", "teatime", "tea time", "संध्याकाळी", "evening"]],
  ["midmorning", ["midmorning", "mid morning", "मधल्या वेळेत"]]
];

const OIL_HINTS = [
  ["low", ["less oil", "kami tel", "low oil", "kam tel", "कमी तेल", "बिन तेल", "no oil", "without oil", "less ghee", "thoda tel"]],
  ["high", ["extra oil", "jasta tel", "more oil", "जास्त तेल", "तुपात", "lot of oil", "oily", "deep fried"]]
];

/* ---------- alias index ------------------------------------------------- */

const aliasIndex = new Map();   // normalized alias -> [foodId]
const tokenIndex = new Map();   // token -> Set(foodId)

function indexFood(food) {
  const phrases = [food.name, food.mr, ...food.aliases];
  for (const phrase of phrases) {
    const key = norm(phrase);
    if (!key) continue;
    if (!aliasIndex.has(key)) aliasIndex.set(key, []);
    if (!aliasIndex.get(key).includes(food.id)) aliasIndex.get(key).push(food.id);
    for (const token of key.split(" ")) {
      if (token.length < 2 || NOISE.has(token)) continue;
      if (!tokenIndex.has(token)) tokenIndex.set(token, new Set());
      tokenIndex.get(token).add(food.id);
    }
  }
}

let indexedCustom = [];
export function buildIndex(customFoods = []) {
  aliasIndex.clear();
  tokenIndex.clear();
  indexedCustom = customFoods;
  for (const food of [...FOODS, ...customFoods]) indexFood(food);
}
buildIndex();

export function allFoods() {
  return [...FOODS, ...indexedCustom];
}

export function foodById(id) {
  return FOOD_BY_ID[id] || indexedCustom.find(f => f.id === id) || null;
}

/* Aliases sorted longest-first so "matki usal" beats "usal". */
function sortedAliases() {
  return Array.from(aliasIndex.keys()).sort((a, b) => b.length - a.length);
}
let SORTED = sortedAliases();
const refreshSorted = () => { SORTED = sortedAliases(); };

/* ---------- tokenising -------------------------------------------------- */

/* \b is ASCII-only in JS regex, so Devanagari joiners get their own pattern. */
const SEPARATOR = /\s*(?:[,+&;]|\n|।|\band\b|\bplus\b|\bani\b|\baur\b|\bwith\b)\s*|\s+(?:आणि|आणी|और|तसेच)\s+/gi;

const QTY_TOKEN = token =>
  /^\d+(\.\d+)?$/.test(token) || /^\d+\/\d+$/.test(token) ||
  NUMBER_WORDS.has(token) || FRACTION_WORDS.has(token);

/**
 * Split a segment that packs two dishes together, e.g.
 * "1 katori rajma 1 bowl brown rice". We only split at a quantity that still
 * has a real food word after it — so "मटकीची उसळ १ वाटी" stays in one piece.
 */
function splitPackedSegment(segment) {
  const tokens = norm(segment).split(" ").filter(Boolean);
  const isFiller = t => QTY_TOKEN(t) || UNIT_LOOKUP.has(t) || NOISE.has(t);
  const cuts = [];
  for (let i = 1; i < tokens.length; i++) {
    if (!QTY_TOKEN(tokens[i])) continue;
    const hasFoodBefore = tokens.slice(cuts.length ? cuts[cuts.length - 1] : 0, i).some(t => !isFiller(t));
    const hasFoodAfter = tokens.slice(i + 1).some(t => !isFiller(t));
    if (hasFoodBefore && hasFoodAfter) cuts.push(i);
  }
  if (!cuts.length) return [segment];
  const parts = [];
  let start = 0;
  for (const cut of [...cuts, tokens.length]) {
    parts.push(tokens.slice(start, cut).join(" "));
    start = cut;
  }
  return parts.filter(Boolean);
}

/* norm() strips punctuation, which would turn "1/2" into "1 2" — and then into 3.
   Convert written fractions to decimals before anything else touches the text. */
function decimalFractions(text) {
  return String(text).replace(/\b(\d{1,2})\s*\/\s*(\d{1,2})\b/g, (whole, a, b) => {
    const top = Number(a), bottom = Number(b);
    // Only real cooking fractions — so a date like 12/09 is left alone.
    if (!bottom || top >= bottom || bottom > 16) return whole;
    return String(top / bottom);
  });
}

function splitSegments(text) {
  return decimalFractions(latinDigits(text))
    .split(SEPARATOR)
    .filter(Boolean)
    .flatMap(s => splitPackedSegment(s.trim()))
    .map(s => s.trim())
    .filter(Boolean);
}

function detectMealSlot(text) {
  const n = norm(text);
  for (const [slot, words] of MEAL_HINTS) {
    if (words.some(word => n.includes(norm(word)))) return slot;
  }
  return null;
}

const MEAL_WORDS = new Set(MEAL_HINTS.flatMap(([, words]) => words.flatMap(w => norm(w).split(" "))));

/** A leftover phrase that is only "lunch"/"आज"/"ला" is context, not food. */
function isContextOnly(phrase) {
  const tokens = phrase.split(" ").filter(Boolean);
  return tokens.length > 0 && tokens.every(t => MEAL_WORDS.has(t) || NOISE.has(t));
}

function detectOil(text) {
  const n = norm(text);
  for (const [level, phrases] of OIL_HINTS) {
    if (phrases.some(p => n.includes(norm(p)))) return level;
  }
  return null;
}

/** Pull quantity + unit out of one segment, returning the leftover food phrase. */
function extractQuantity(segment) {
  const tokens = norm(segment).split(" ").filter(Boolean);
  let qty = null;
  let unit = null;
  const rest = [];

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    // "1/2", "3/4"
    const fractionMatch = token.match(/^(\d+)\/(\d+)$/);
    if (fractionMatch) {
      qty = (qty || 0) + Number(fractionMatch[1]) / Number(fractionMatch[2]);
      continue;
    }
    // "150g", "200ml", "2kg"
    const glued = token.match(/^(\d+(?:\.\d+)?)(g|gm|gms|gram|grams|kg|ml|l)$/);
    if (glued) {
      const value = Number(glued[1]);
      const suffix = glued[2];
      qty = suffix === "kg" ? value * 1000 : suffix === "l" ? value * 1000 : value;
      unit = suffix === "ml" || suffix === "l" ? "ml" : "g";
      continue;
    }
    if (/^\d+(\.\d+)?$/.test(token)) {
      qty = qty == null ? Number(token) : qty + Number(token);
      continue;
    }
    if (NUMBER_WORDS.has(token)) { qty = (qty ?? 0) + NUMBER_WORDS.get(token); continue; }
    if (FRACTION_WORDS.has(token)) { qty = (qty ?? 0) + FRACTION_WORDS.get(token); continue; }
    if (UNIT_LOOKUP.has(token) && !unit) { unit = UNIT_LOOKUP.get(token); continue; }
    // two-word units such as "मोठा चमचा"
    if (i + 1 < tokens.length && UNIT_LOOKUP.has(`${token} ${tokens[i + 1]}`) && !unit) {
      unit = UNIT_LOOKUP.get(`${token} ${tokens[i + 1]}`);
      i += 1;
      continue;
    }
    rest.push(token);
  }

  const phrase = rest.filter(token => !NOISE.has(token)).join(" ").trim();
  return { qty, unit, phrase, rawPhrase: rest.join(" ").trim() };
}

/* ---------- food matching ----------------------------------------------- */

function scoreByTokens(phrase) {
  const tokens = phrase.split(" ").filter(t => t.length > 1);
  if (!tokens.length) return [];
  const scores = new Map();
  for (const token of tokens) {
    const hits = tokenIndex.get(token);
    if (!hits) continue;
    const weight = 1 / Math.log2(hits.size + 2);   // rarer tokens matter more
    for (const id of hits) scores.set(id, (scores.get(id) || 0) + weight);
  }
  return Array.from(scores.entries())
    .map(([id, score]) => ({ id, score }))
    .sort((a, b) => b.score - a.score);
}

function fuzzyMatch(phrase) {
  if (phrase.length < 4) return null;
  let best = null;
  const limit = phrase.length <= 6 ? 1 : 2;
  for (const alias of SORTED) {
    if (Math.abs(alias.length - phrase.length) > limit) continue;
    const distance = editDistance(phrase, alias, limit);
    if (distance <= limit && (!best || distance < best.distance)) {
      best = { alias, distance, id: aliasIndex.get(alias)[0] };
      if (distance === 0) break;
    }
  }
  return best;
}

/**
 * Resolve a food phrase.
 * @returns {{foodId, confidence, matchedOn, options?}|null}
 */
export function matchFood(phrase) {
  const key = norm(phrase);
  if (!key) return null;

  // 1. exact alias
  if (aliasIndex.has(key)) {
    const ids = aliasIndex.get(key);
    const ambiguous = AMBIGUOUS[key];
    if (ambiguous && ambiguous.length > 1) {
      return { foodId: DEFAULT_FOR[key] || ambiguous[0], confidence: "ask", matchedOn: key, options: ambiguous };
    }
    return { foodId: ids[0], confidence: ids.length > 1 ? "medium" : "high", matchedOn: key };
  }

  // 2. an ambiguous head word used on its own, e.g. "usal", "भाजी"
  if (AMBIGUOUS[key]) {
    return { foodId: DEFAULT_FOR[key] || AMBIGUOUS[key][0], confidence: "ask", matchedOn: key, options: AMBIGUOUS[key] };
  }

  // 3. longest alias contained in the phrase ("gharcha matki usal")
  for (const alias of SORTED) {
    if (alias.length < 3) continue;
    if (key === alias || key.includes(` ${alias} `) || key.startsWith(`${alias} `) || key.endsWith(` ${alias}`)) {
      return { foodId: aliasIndex.get(alias)[0], confidence: "medium", matchedOn: alias };
    }
  }

  // 4. token overlap
  const scored = scoreByTokens(key);
  if (scored.length) {
    const top = scored[0];
    const runnerUp = scored[1];
    const decisive = !runnerUp || top.score >= runnerUp.score * 1.35;
    if (top.score >= 0.4) {
      return {
        foodId: top.id,
        confidence: decisive ? "medium" : "low",
        matchedOn: key,
        options: decisive ? undefined : scored.slice(0, 4).map(s => s.id)
      };
    }
  }

  // 5. spelling slips ("bhakari", "matki usall")
  const fuzzy = fuzzyMatch(key);
  if (fuzzy) return { foodId: fuzzy.id, confidence: "low", matchedOn: fuzzy.alias };

  // 6. last chance: fuzzy on the most distinctive single token
  const tokens = key.split(" ").filter(t => t.length > 3).sort((a, b) => b.length - a.length);
  for (const token of tokens) {
    const hit = fuzzyMatch(token);
    if (hit) return { foodId: hit.id, confidence: "low", matchedOn: hit.alias };
  }
  return null;
}

/* ---------- public API --------------------------------------------------- */

/**
 * Parse a free-text meal description.
 * @returns {{items: Array, unmatched: string[], slot: string|null}}
 */
export function parseMeal(text, { foodStats = {} } = {}) {
  refreshSorted();
  const slot = detectMealSlot(text);
  const globalOil = detectOil(text);
  const segments = splitSegments(text);
  const items = [];
  const unmatched = [];

  for (const segment of segments) {
    const oil = detectOil(segment) || globalOil;
    const cleaned = stripOilPhrases(segment);

    // Some dish names contain words that also mean a quantity ("pav" = quarter,
    // "ek" in "ekadashi"). Try the whole segment as a dish name first.
    const wholeKey = norm(decimalFractions(cleaned));
    const wholeMatch = aliasIndex.has(wholeKey) && !AMBIGUOUS[wholeKey] ? matchFood(wholeKey) : null;

    const { qty, unit, phrase } = wholeMatch
      ? { qty: null, unit: null, phrase: wholeKey }
      : extractQuantity(cleaned);
    if (!phrase) continue;

    const match = wholeMatch || matchFood(phrase);
    if (!match) {
      // "आज lunch ला" is context, not a dish we failed to recognise.
      if (!isContextOnly(phrase)) unmatched.push(segment.trim());
      continue;
    }

    const food = foodById(match.foodId);
    if (!food) { unmatched.push(segment.trim()); continue; }

    // If they have picked one of these variants before, quietly use that one.
    let chosen = food;
    let needsChoice = match.confidence === "ask";
    if (needsChoice && match.options) {
      const known = match.options
        .map(id => ({ id, count: (foodStats[id] || {}).count || 0 }))
        .filter(o => o.count > 0)
        .sort((a, b) => b.count - a.count)[0];
      if (known) {
        chosen = foodById(known.id) || food;
        needsChoice = false;
      }
    }

    const remembered = foodStats[chosen.id];
    const resolvedUnit = unit || (remembered && remembered.unit) || chosen.unit;
    let resolvedQty = qty ?? (unit ? 1 : (remembered && remembered.qty) || 1);
    // Stray digits in a sentence can pile up ("12/09"), so keep counted
    // portions in a believable range. Weights are left alone.
    if (resolvedUnit !== "g" && resolvedUnit !== "ml") resolvedQty = Math.min(resolvedQty, 30);
    if (resolvedQty <= 0) resolvedQty = 1;

    items.push({
      foodId: chosen.id,
      name: chosen.name,
      qty: resolvedQty,
      unit: resolvedUnit,
      oil: oil || "normal",
      confidence: unit === "g" || unit === "ml" ? "high" : (needsChoice ? "ask" : match.confidence === "ask" ? "medium" : match.confidence),
      needsChoice,
      options: match.options || null,
      source: segment.trim()
    });
  }

  return { items, unmatched, slot };
}

function stripOilPhrases(segment) {
  let out = segment;
  for (const [, phrases] of OIL_HINTS) {
    for (const phrase of phrases) {
      out = out.replace(new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), " ");
    }
  }
  return out;
}

/** Type-ahead search used by the food picker. */
export function searchFoods(query, limit = 25) {
  const key = norm(query);
  if (!key) return [];
  const pool = allFoods();
  const results = [];
  for (const food of pool) {
    const haystack = [food.name, food.mr, ...food.aliases].map(norm);
    let rank = 99;
    for (const entry of haystack) {
      if (!entry) continue;
      if (entry === key) { rank = Math.min(rank, 0); break; }
      if (entry.startsWith(key)) rank = Math.min(rank, 1);
      else if (entry.includes(key)) rank = Math.min(rank, 2);
    }
    if (rank < 99) results.push({ food, rank });
  }
  results.sort((a, b) => a.rank - b.rank || a.food.name.localeCompare(b.food.name));
  return results.slice(0, limit).map(r => r.food);
}
