/* AaharWalk — Home. Answers, within three seconds:
   what can I still eat, how far have I walked, how much water,
   what should I do today, and what should I eat next. */

import { el, fmt, todayISO, round } from "../core/util.js";
import { t, pick, nameOf, lang } from "../core/i18n.js";
import { getState, getDay } from "../core/store.js";
import { currentTargets, nextMealSuggestion, workoutFor } from "../engine/session.js";
import { dayTotals } from "../engine/nutrition.js";
import { coachLines, greeting, daySummary } from "../engine/coach.js";
import { recentDays } from "../engine/session.js";
import { SLOT_LABELS, describeMeal } from "../engine/planner.js";
import { foodById } from "../engine/parser.js";
import { activityRings, ringLegend, tile, metricLine, icon, card, cardHead, foodAvatar, cardIcon } from "./components.js";

export function renderHome(root, app) {
  const state = getState();
  const date = todayISO();
  const day = getDay(date);
  const targets = currentTargets();
  const totals = dayTotals(day);
  const profile = state.profile;

  const remaining = Math.round(targets.kcal - totals.kcal);
  const over = remaining < 0;

  const streak = loggingStreak();
  root.append(el("header", { class: "topbar" }, [
    el("div", { class: "grow" }, [
      el("div", { class: "eyebrow", text: new Date().toLocaleDateString(lang() === "mr" ? "mr-IN" : "en-IN", { weekday: "long", day: "numeric", month: "long" }) }),
      el("h1", { text: pick(greeting(profile.name)) })
    ]),
    streak >= 2
      ? el("span", { class: "streak", title: t("streak_help") }, ["🔥", `${streak}`])
      : null
  ]));

  const screen = el("div", { class: "stack" });
  root.append(screen);

  /* ——— today at a glance: three goals, three rings ——— */
  const goals = [
    {
      name: t("calories"), color: "var(--m-cal)",
      value: totals.kcal, target: targets.kcal,
      display: fmt(Math.round(totals.kcal)), displayTarget: fmt(targets.kcal)
    },
    {
      name: t("steps"), color: "var(--m-step)",
      value: day.steps || 0, target: targets.steps,
      display: fmt(day.steps || 0), displayTarget: fmt(targets.steps)
    },
    {
      name: t("water"), color: "var(--m-water)",
      value: day.waterMl || 0, target: targets.waterMl,
      display: `${round((day.waterMl || 0) / 1000, 2)}`, displayTarget: `${round(targets.waterMl / 1000, 2)} L`
    }
  ];

  const hero = el("div", { class: "card hero-card" }, [
    el("div", { class: "hero-row" }, [
      activityRings(goals, {
        size: 128, stroke: 11, gap: 5,
        centre: { value: fmt(Math.abs(remaining)), label: over ? t("over") : t("remaining") }
      }),
      ringLegend(goals)
    ])
  ]);
  screen.append(hero);

  /* ——— what the plate still needs ——— */
  screen.append(card([
    metricLine({ name: t("protein"), value: totals.protein, target: targets.protein, unit: "g", color: "var(--m-protein)" }),
    el("div", { style: "height:14px" }),
    metricLine({ name: t("fibre"), value: totals.fibre, target: targets.fibre, unit: "g", color: "var(--m-fibre)" })
  ], "tight"));

  /* ——— tap-through tiles ——— */
  const week = recentDays(7).filter(Boolean);
  const weekSteps = week.map(d => d.steps || 0).filter(v => v > 0);
  const weekAvg = weekSteps.length ? Math.round(weekSteps.reduce((a, b) => a + b, 0) / weekSteps.length) : 0;

  screen.append(el("div", { class: "tiles" }, [
    tile({
      name: t("steps"), value: fmt(day.steps || 0),
      sub: weekAvg ? `${t("weekly_average")} ${fmt(weekAvg)}` : `${t("target")} ${fmt(targets.steps)}`,
      color: "var(--m-step)", soft: "var(--m-step-soft)", iconName: "shoe",
      onclick: () => app.go("activity")
    }),
    tile({
      name: t("water"), value: round((day.waterMl || 0) / 1000, 2), unit: "L",
      sub: `${t("target")} ${round(targets.waterMl / 1000, 2)} L`,
      color: "var(--m-water)", soft: "var(--m-water-soft)", iconName: "drop",
      onclick: () => app.openWater()
    })
  ]));

  /* ——— quick actions ——— */
  screen.append(card([
    cardHead(t("quick_actions")),
    el("div", { class: "quick-grid" }, [
      quick("plus", t("log_food"), "--m-cal", () => app.openFoodLog()),
      quick("drop", t("add_water"), "--m-water", () => app.openWater()),
      quick("shoe", t("start_walk"), "--m-step", () => app.openWalk()),
      quick("dumbbell", t("start_workout"), "--m-protein", () => app.openWorkout()),
      quick("scale", t("log_weight"), "--m-weight", () => app.openWeight()),
      quick("plan", t("log_steps"), "--m-step", () => app.openSteps())
    ])
  ]));

  /* ——— today's workout ——— */
  const workout = workoutFor(date);
  if (workout) {
    const done = day.workout && day.workout.completedAt;
    screen.append(card([
      el("div", { class: "card-head" }, [
        el("span", { class: "row", style: "gap:9px" }, [cardIcon("dumbbell", "--m-protein"), el("h2", { text: t("todays_workout") })]),
        done ? el("span", { class: "tag leaf", text: `${day.workout.minutes} min ✓` }) : null
      ]),
      el("div", { class: "row between", style: "gap:14px" }, [
        el("div", { class: "grow" }, [
          el("div", { style: "font-size:17px;font-weight:650;letter-spacing:-.015em",
            text: `${workout.minutes} min ${lang() === "mr" ? workout.titleMr : workout.titleEn}` }),
          el("div", { class: "small muted", style: "margin-top:3px",
            text: `${workout.steps.length} ${lang() === "mr" ? "हालचाली" : "moves"} · ${lang() === "mr" ? "अंदाजे" : "approx."} ${workout.estimatedKcal} kcal` })
        ])
      ]),
      el("div", { style: "height:12px" }),
      el("button", {
        class: `btn block ${done ? "soft" : ""}`.trim(),
        type: "button",
        onclick: () => app.openWorkout()
      }, [icon(done ? "refresh" : "play", 17), done ? (lang() === "mr" ? "पुन्हा करा" : "Do it again") : t("start_workout")])
    ]));
  }

  /* ——— what to eat next ——— */
  const suggestion = nextMealSuggestion(date);
  if (suggestion && remaining > 150) {
    const label = SLOT_LABELS[suggestion.slot] || SLOT_LABELS.dinner;
    screen.append(card([
      el("div", { class: "card-head" }, [
        el("span", { class: "row", style: "gap:9px" }, [cardIcon("food", "--m-cal"), el("h2", { text: t("whats_next") })]),
        el("span", { class: "tag accent", text: label[lang()] || label.en })
      ]),
      el("p", { class: "small muted", text: lang() === "mr"
        ? `तुमच्याकडे अंदाजे ${fmt(remaining)} kcal शिल्लक आहेत.`
        : `You have about ${fmt(remaining)} kcal left today.` }),
      el("div", { style: "height:10px" }),
      el("div", { class: "list" }, suggestion.items.map(item => {
        const food = foodById(item.foodId);
        return el("div", { class: "list-row" }, [
          foodAvatar(food),
          el("div", { class: "lead" }, [
            el("div", { class: "title", text: nameOf(food) }),
            el("div", { class: "sub", text: `${item.qty} ${item.unit}` })
          ])
        ]);
      })),
      el("div", { class: "row between", style: "margin-top:12px" }, [
        el("strong", { text: `≈ ${fmt(Math.round(suggestion.nutrition.kcal / 5) * 5)} ${t("kcal")}` }),
        el("button", {
          class: "btn sm soft", type: "button",
          onclick: () => app.openFoodLog({ prefill: suggestion.items, slot: suggestion.slot })
        }, [lang() === "mr" ? "हेच नोंदवा" : "Log this"])
      ])
    ]));
  }

  /* ——— coach ——— */
  const lines = coachLines({ day, targets, profile, suggestion });
  screen.append(card([
    el("div", { class: "card-head" }, [
      el("span", { class: "row", style: "gap:9px" }, [cardIcon("sparkle", "--m-water"), el("h2", { text: t("your_coach") })]),
      null
    ]),
    el("div", { class: "stack", style: "gap:11px" },
      lines.map(line => el("p", {
        class: "small",
        style: `line-height:1.55;color:${line.tone === "good" ? "var(--ink)" : "var(--ink-2)"}`,
        text: pick(line)
      })))
  ]));

  /* ——— evening summary ——— */
  if (new Date().getHours() >= 19 && totals.kcal > 0) {
    const summary = daySummary({ day, targets });
    screen.append(card([
      cardHead(t("end_of_day")),
      el("div", {}, summary.rows.map(row => el("div", { class: "kv" }, [
        el("span", { class: "k", text: t(row.key) || row.key }),
        el("span", { class: "v", text: `${fmt(row.value)}${row.unit ? ` ${row.unit}` : ""} / ${fmt(row.target)}` })
      ]))),
      el("div", { style: "height:12px" }),
      el("div", { class: "stack", style: "gap:8px" },
        summary.notes.map(note => el("p", { class: "small muted", text: `• ${pick(note)}` })))
    ]));
  }

  screen.append(el("p", { class: "disclaimer", text: t("disclaimer") }));
}

/** Consecutive days, ending today or yesterday, with something logged. */
function loggingStreak() {
  const days = recentDays(30);
  let streak = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    const day = days[i];
    const logged = day && (Object.values(day.meals || {}).some(list => list.length) || day.steps > 0 || day.workout);
    if (logged) streak += 1;
    else if (i === days.length - 1) continue;   // today may simply not have started yet
    else break;
  }
  return streak;
}

function quick(name, label, token, onclick) {
  return el("button", { class: "quick", type: "button", onclick }, [
    el("span", { class: "quick-icon", style: `background:var(${token}-soft);color:var(${token})` }, [icon(name, 19, 2)]),
    el("span", { text: label })
  ]);
}
