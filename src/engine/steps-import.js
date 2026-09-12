/* AaharWalk — getting today's step count in from another app.
 *
 * A web app cannot read another Android app's data directly: Step Set Go,
 * Google Fit, Samsung Health and Health Connect have no browser API. What does
 * work today, without an account or a server, is text:
 *
 *   1. Android share sheet — AaharWalk registers as a share target, so
 *      Step Set Go → Share → AaharWalk lands here with the step text.
 *   2. Paste — copy anything containing the number and paste it in.
 *
 * Both end up in the same place: pull the step count out of a piece of text.
 */

import { latinDigits } from "../core/util.js";

export const STEP_SOURCES = {
  manual: { en: "Type it myself", mr: "स्वतः लिहितो" },
  stepsetgo: {
    en: "Step Set Go", mr: "Step Set Go",
    howEn: "Open Step Set Go → tap Share on today's steps → choose AaharWalk. Or copy the number and paste it here.",
    howMr: "Step Set Go उघडा → आजच्या पावलांवर Share दाबा → AaharWalk निवडा. किंवा आकडा कॉपी करून इथे पेस्ट करा."
  },
  googlefit: {
    en: "Google Fit", mr: "Google Fit",
    howEn: "Open Google Fit, share or copy today's step count, then paste it here.",
    howMr: "Google Fit उघडा, आजची पावलं शेअर किंवा कॉपी करा आणि इथे पेस्ट करा."
  },
  samsung: {
    en: "Samsung Health", mr: "Samsung Health",
    howEn: "Open Samsung Health, copy today's step count, then paste it here.",
    howMr: "Samsung Health उघडा, आजची पावलं कॉपी करा आणि इथे पेस्ट करा."
  },
  phone: {
    en: "Phone health app", mr: "फोनचं हेल्थ अ‍ॅप",
    howEn: "Copy today's step count from your phone's health app and paste it here.",
    howMr: "फोनच्या हेल्थ अ‍ॅपमधून आजची पावलं कॉपी करून इथे पेस्ट करा."
  }
};

/* Numbers that are plainly not a step count (dates, times, calories, km). */
const NOISE_PATTERN = /\b(kcal|cal|calories|km|kms|kilometre|kilometer|mile|miles|min|mins|hour|hrs|bpm|kg|%|rs|₹|coin|coins)\b/i;

/**
 * Pull a step count out of shared or pasted text.
 * Handles "7,842 steps", "आज ८४२० पावलं", "Steps: 9310", "I walked 12k steps".
 * @returns {{steps:number, matchedOn:string}|null}
 */
export function parseSteps(text) {
  if (!text) return null;
  const clean = latinDigits(String(text)).replace(/ /g, " ");

  const candidates = [];
  const push = (value, matchedOn, weight) => {
    if (Number.isFinite(value) && value >= 100 && value <= 120000) {
      candidates.push({ steps: Math.round(value), matchedOn, weight });
    }
  };

  // "12k steps" / "12.5k"
  for (const m of clean.matchAll(/(\d+(?:\.\d+)?)\s*k\b/gi)) push(Number(m[1]) * 1000, m[0], 2);

  // A number sitting next to the word "steps" / "पावलं" / "कदम", either side.
  const stepWord = "(?:steps?|step|पावल[ेंाी]?|पाऊल[ें]?|कदम|चरण)";
  for (const m of clean.matchAll(new RegExp(`([\\d,.\\s]{1,12}?)\\s*${stepWord}`, "gi"))) push(toNumber(m[1]), m[0], 5);
  for (const m of clean.matchAll(new RegExp(`${stepWord}\\s*[:\\-–]?\\s*([\\d,.]{1,12})`, "gi"))) push(toNumber(m[1]), m[0], 5);

  // Otherwise the largest plausible standalone number that isn't obviously
  // something else on the same line.
  for (const line of clean.split(/[\n·|]/)) {
    if (NOISE_PATTERN.test(line)) continue;
    for (const m of line.matchAll(/\b\d{1,3}(?:,\d{3})+\b|\b\d{3,6}\b/g)) push(toNumber(m[0]), m[0], 1);
  }

  if (!candidates.length) return null;
  candidates.sort((a, b) => b.weight - a.weight || b.steps - a.steps);
  const best = candidates[0];
  return { steps: best.steps, matchedOn: best.matchedOn.trim() };
}

function toNumber(raw) {
  const cleaned = String(raw).replace(/[\s,]/g, "");
  // "8.420" from some locales means 8420, not 8.42
  if (/^\d{1,3}\.\d{3}$/.test(cleaned)) return Number(cleaned.replace(".", ""));
  return Number(cleaned);
}

/** Text handed to us by the Android share sheet, if any. */
export function sharedStepText() {
  const params = new URLSearchParams(location.search);
  const parts = [params.get("share_title"), params.get("share_text"), params.get("share_url")].filter(Boolean);
  return parts.length ? parts.join(" ") : null;
}

export function clearSharedParams() {
  const url = new URL(location.href);
  for (const key of ["share_title", "share_text", "share_url"]) url.searchParams.delete(key);
  history.replaceState(null, "", url.pathname + (url.searchParams.toString() ? `?${url.searchParams}` : "") + url.hash);
}
