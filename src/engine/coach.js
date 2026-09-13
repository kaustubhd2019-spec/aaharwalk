/* AaharWalk — the coaching voice.
 *
 * Rules, not randomness: the same day always produces the same advice.
 * Tone rules we hold to — never shame, never diagnose, never promise outcomes.
 */

import { dayTotals } from "./nutrition.js";
import { nextSlotByClock, SLOT_LABELS } from "./planner.js";
import { avg, sum, round, minutesNow, fmt } from "../core/util.js";

const L = (en, mr) => ({ en, mr });

export function greeting(name, date = new Date()) {
  const hour = date.getHours();
  const who = name ? `, ${name}` : "";
  if (hour < 12) return L(`Good morning${who}.`, `सुप्रभात${who}.`);
  if (hour < 17) return L(`Good afternoon${who}.`, `नमस्कार${who}.`);
  return L(`Good evening${who}.`, `शुभ संध्याकाळ${who}.`);
}

/**
 * The Your Coach panel: 2–4 short, specific lines about today.
 * @returns {Array<{en:string, mr:string, tone:string}>}
 */
export function coachLines({ day, targets, profile, suggestion, minutes = minutesNow() }) {
  const totals = dayTotals(day);
  const lines = [];
  const remaining = Math.round(targets.kcal - totals.kcal);
  const eatenAnything = totals.kcal > 0;

  // — calories —
  if (!eatenAnything) {
    lines.push({ ...L(
      `Nothing logged yet today. Your target is about ${fmt(targets.kcal)} kcal.`,
      `आज अजून काही नोंदवलेलं नाही. आजचं लक्ष्य अंदाजे ${fmt(targets.kcal)} kcal आहे.`
    ), tone: "neutral" });
  } else if (remaining > 150) {
    lines.push({ ...L(
      `You've had about ${fmt(Math.round(totals.kcal))} kcal, so roughly ${fmt(remaining)} kcal are still yours today.`,
      `तुम्ही आतापर्यंत सुमारे ${fmt(Math.round(totals.kcal))} kcal घेतलं आहे, आजसाठी अंदाजे ${fmt(remaining)} kcal शिल्लक आहे.`
    ), tone: "good" });
  } else if (remaining >= -100) {
    lines.push({ ...L(
      `You're right on your calorie target for today. Nicely judged.`,
      `आजचं कॅलरी लक्ष्य तुम्ही अगदी नीट सांभाळलं आहे.`
    ), tone: "good" });
  } else {
    lines.push({ ...L(
      `You're about ${fmt(Math.abs(remaining))} kcal past today's estimate. One day rarely changes the trend — a walk this evening balances most of it.`,
      `आजच्या अंदाजापेक्षा सुमारे ${fmt(Math.abs(remaining))} kcal जास्त झालं आहे. एका दिवसाने फार फरक पडत नाही — संध्याकाळी चालल्यास बरंचसं भरून निघेल.`
    ), tone: "warn" });
  }

  // — protein —
  const proteinGap = targets.protein - totals.protein;
  const dayProgress = Math.min(1, minutes / (21 * 60));
  if (eatenAnything && proteinGap > targets.protein * 0.25 && dayProgress > 0.4) {
    lines.push({ ...L(
      `Protein is running low (${Math.round(totals.protein)} of ${targets.protein} g). Dal, usal, curd, eggs or a lean non-veg dish at the next meal closes most of that gap.`,
      `प्रथिनं कमी पडत आहेत (${targets.protein} पैकी ${Math.round(totals.protein)} ग्रॅम). पुढच्या जेवणात डाळ, उसळ, दही, अंडी किंवा हलकं मांसाहारी घेतलं तर बरीच भरपाई होईल.`
    ), tone: "warn" });
  } else if (totals.protein >= targets.protein * 0.9) {
    lines.push({ ...L(
      `Protein is well covered today (${Math.round(totals.protein)} g).`,
      `आज प्रथिनं चांगली मिळाली आहेत (${Math.round(totals.protein)} ग्रॅम).`
    ), tone: "good" });
  }

  // — fibre —
  if (eatenAnything && totals.fibre < targets.fibre * 0.5 && dayProgress > 0.5) {
    lines.push({ ...L(
      `Fibre is on the low side. An extra bowl of bhaji, a koshimbir or a fruit helps more than you'd think.`,
      `तंतुमय पदार्थ (fibre) कमी आहेत. एक वाटी भाजी, कोशिंबीर किंवा एखादं फळ घेतलं तर चांगला फरक पडतो.`
    ), tone: "neutral" });
  }

  // — steps —
  const stepGap = targets.steps - (day.steps || 0);
  if (day.steps > 0 && stepGap > 500) {
    const walkMinutes = Math.max(5, Math.round(stepGap / 110));
    lines.push({ ...L(
      `You're at ${fmt(day.steps)} steps. About a ${walkMinutes}-minute walk would take you to today's goal.`,
      `तुमची ${fmt(day.steps)} पावलं झाली आहेत. सुमारे ${walkMinutes} मिनिटं चालल्यास आजचं लक्ष्य पूर्ण होईल.`
    ), tone: "neutral" });
  } else if (day.steps >= targets.steps && targets.steps > 0) {
    lines.push({ ...L(
      `Step goal done — ${fmt(day.steps)} steps.`,
      `पावलांचं लक्ष्य पूर्ण — ${fmt(day.steps)} पावलं.`
    ), tone: "good" });
  }

  // — water —
  const waterLeft = targets.waterMl - (day.waterMl || 0);
  if (waterLeft > 600 && minutes > 14 * 60) {
    lines.push({ ...L(
      `Water is at ${(day.waterMl / 1000).toFixed(1)} L of ${(targets.waterMl / 1000).toFixed(1)} L. Keep a glass on your desk.`,
      `पाणी ${(targets.waterMl / 1000).toFixed(1)} लिटरपैकी ${(day.waterMl / 1000).toFixed(1)} लिटर झालं आहे. समोर एक ग्लास ठेवा.`
    ), tone: "neutral" });
  }

  // — what's next —
  if (suggestion && remaining > 200) {
    const label = SLOT_LABELS[suggestion.slot] || SLOT_LABELS.dinner;
    lines.push({ ...L(
      `For ${label.en.toLowerCase()}, something around ${Math.round(suggestion.nutrition.kcal / 10) * 10} kcal fits well.`,
      `${label.mr}साठी अंदाजे ${Math.round(suggestion.nutrition.kcal / 10) * 10} kcal चं जेवण योग्य ठरेल.`
    ), tone: "neutral" });
  }

  // — workout —
  if (!day.workout || !day.workout.completedAt) {
    lines.push({ ...L(
      `Today's session is still waiting — 15–20 minutes is enough.`,
      `आजचा व्यायाम बाकी आहे — १५–२० मिनिटं पुरेशी आहेत.`
    ), tone: "neutral" });
  }

  return lines.slice(0, 4);
}

/** Evening wrap-up: the numbers, then two or three plain observations. */
export function daySummary({ day, targets }) {
  const totals = dayTotals(day);
  const rows = [
    { key: "calories", value: Math.round(totals.kcal), target: targets.kcal, unit: "kcal", lowerIsBetter: true },
    { key: "steps", value: day.steps || 0, target: targets.steps, unit: "" },
    { key: "water", value: round((day.waterMl || 0) / 1000, 1), target: round(targets.waterMl / 1000, 1), unit: "L" },
    { key: "protein", value: Math.round(totals.protein), target: targets.protein, unit: "g" },
    { key: "fibre", value: Math.round(totals.fibre), target: targets.fibre, unit: "g" },
    { key: "workout", value: day.workout && day.workout.completedAt ? day.workout.minutes : 0, target: 15, unit: "min" }
  ];

  const notes = [];
  const kcalDiff = totals.kcal - targets.kcal;
  if (totals.kcal === 0) {
    notes.push(L("No food logged today.", "आज जेवण नोंदवलेलं नाही."));
  } else if (Math.abs(kcalDiff) <= targets.kcal * 0.06) {
    notes.push(L("Excellent calorie control today.", "आज कॅलरीजवर उत्तम नियंत्रण."));
  } else if (kcalDiff < 0) {
    notes.push(L(`You finished about ${fmt(Math.round(-kcalDiff))} kcal under target.`, `लक्ष्यापेक्षा सुमारे ${fmt(Math.round(-kcalDiff))} kcal कमी झालं.`));
  } else {
    notes.push(L(`About ${fmt(Math.round(kcalDiff))} kcal above the estimate — worth noting, not worth worrying about.`, `अंदाजापेक्षा सुमारे ${fmt(Math.round(kcalDiff))} kcal जास्त — लक्षात ठेवा, पण काळजी करू नका.`));
  }

  if (totals.protein < targets.protein * 0.85) {
    notes.push(L("Protein was a little below target.", "प्रथिनं लक्ष्यापेक्षा थोडी कमी राहिली."));
  } else {
    notes.push(L("Protein target met.", "प्रथिनांचं लक्ष्य पूर्ण."));
  }

  const stepGap = targets.steps - (day.steps || 0);
  if (day.steps > 0 && stepGap > 0 && stepGap <= 1200) {
    notes.push(L(`You were only ${fmt(stepGap)} steps short of the goal.`, `लक्ष्यापासून फक्त ${fmt(stepGap)} पावलं कमी पडली.`));
  } else if (day.steps >= targets.steps) {
    notes.push(L("Step goal reached.", "पावलांचं लक्ष्य पूर्ण."));
  }

  if (day.workout && day.workout.completedAt) {
    notes.push(L(`${day.workout.minutes} minutes of movement done.`, `${day.workout.minutes} मिनिटं व्यायाम झाला.`));
  }

  return { rows, notes: notes.slice(0, 3), totals };
}

/** Weekly dashboard numbers plus one honest insight. */
export function weeklyReport({ days, targets, weights = [], previousDays = [] }) {
  const logged = days.filter(d => d);
  const kcals = logged.map(d => dayTotals(d).kcal).filter(v => v > 0);
  const steps = logged.map(d => d.steps || 0).filter(v => v > 0);
  const water = logged.map(d => d.waterMl || 0).filter(v => v > 0);
  const proteins = logged.map(d => dayTotals(d).protein).filter(v => v > 0);
  const fibres = logged.map(d => dayTotals(d).fibre).filter(v => v > 0);
  const workouts = logged.filter(d => d.workout && d.workout.completedAt).length;

  const prevSteps = previousDays.map(d => (d && d.steps) || 0).filter(v => v > 0);
  const stepAvg = avg(steps);
  const prevStepAvg = avg(prevSteps);

  const onTarget = kcals.filter(k => k <= targets.kcal * 1.05).length;

  const insights = [];
  if (prevStepAvg > 0 && stepAvg > 0) {
    const change = Math.round(((stepAvg - prevStepAvg) / prevStepAvg) * 100);
    if (change >= 5) insights.push(L(`Your average steps went up ${change}% on last week. That's the habit forming.`, `गेल्या आठवड्यापेक्षा सरासरी पावलं ${change}% ने वाढली. हीच सवय तयार होते आहे.`));
    else if (change <= -5) insights.push(L(`Steps were ${Math.abs(change)}% lower than last week. A fixed walking time helps more than willpower.`, `पावलं गेल्या आठवड्यापेक्षा ${Math.abs(change)}% कमी झाली. ठरलेली चालण्याची वेळ ठरवल्यास सोपं जातं.`));
  }
  if (kcals.length >= 4) {
    const share = Math.round((onTarget / kcals.length) * 100);
    insights.push(L(`You stayed within target on ${onTarget} of ${kcals.length} logged days (${share}%).`, `नोंदवलेल्या ${kcals.length} पैकी ${onTarget} दिवस तुम्ही लक्ष्यात राहिलात (${share}%).`));
  }
  if (workouts >= 5) insights.push(L(`${workouts} workouts this week — strong consistency.`, `या आठवड्यात ${workouts} वेळा व्यायाम — उत्तम सातत्य.`));
  else if (workouts <= 2) insights.push(L(`${workouts} workouts this week. Even three short sessions make a difference.`, `या आठवड्यात ${workouts} वेळा व्यायाम. तीन छोटी सत्रंसुद्धा फरक घडवतात.`));
  if (avg(proteins) < targets.protein * 0.8 && proteins.length >= 3) {
    insights.push(L("Protein averaged below target. Adding dal, usal or curd to one more meal a day is the easiest fix.", "प्रथिनं सरासरी कमी राहिली. दिवसातल्या आणखी एका जेवणात डाळ, उसळ किंवा दही घालणं सर्वात सोपा उपाय."));
  }

  return {
    avgKcal: Math.round(avg(kcals)),
    avgSteps: Math.round(stepAvg),
    avgWaterMl: Math.round(avg(water)),
    avgProtein: Math.round(avg(proteins)),
    avgFibre: Math.round(avg(fibres)),
    workouts,
    daysLogged: kcals.length,
    onTargetDays: onTarget,
    targets,
    weights,
    insights: insights.slice(0, 3)
  };
}

/** Weight is noisy day to day. Say so, rather than reacting to it. */
export function weightNote(trend, goal) {
  if (!trend || trend.points.length < 2) {
    return L("Log your weight a couple of times a week. The trend matters, not any single morning.",
             "आठवड्यातून दोनदा वजन नोंदवा. एका दिवसाच्या आकड्यापेक्षा कल महत्त्वाचा.");
  }
  if (trend.direction === "flat") {
    return L("Weight is holding steady. Day-to-day swings come from water, salt and digestion, not fat.",
             "वजन स्थिर आहे. रोजचे चढउतार पाणी, मीठ आणि पचनामुळे होतात, चरबीमुळे नाही.");
  }
  if (trend.direction === "down") {
    return goal === "fatloss"
      ? L(`Trending down about ${Math.abs(trend.perWeekKg)} kg a week. That is a sustainable pace.`,
          `दर आठवड्याला सुमारे ${Math.abs(trend.perWeekKg)} किलो कमी होत आहे. हा टिकाऊ वेग आहे.`)
      : L("Weight is drifting down. If that isn't the aim, eat a little more at meals.",
          "वजन हळूहळू कमी होत आहे. हे उद्दिष्ट नसेल तर जेवण थोडं वाढवा.");
  }
  return L("Weight is trending up slightly. Check portions of rice, oil and sweets before changing anything else.",
           "वजन थोडं वाढत आहे. इतर काही बदलण्याआधी भात, तेल आणि गोड पदार्थांचं प्रमाण तपासा.");
}

export { nextSlotByClock };
