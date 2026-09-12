/* AaharWalk — Home. Answers, within three seconds:
   what can I still eat, how far have I walked, how much water,
   what should I do today, and what should I eat next. */

import { el, fmt, todayISO, round } from "../core/util.js";
import { t, pick, nameOf, lang } from "../core/i18n.js";
import { getState, getDay } from "../core/store.js";
import { currentTargets, nextMealSuggestion, workoutFor } from "../engine/session.js";
import { dayTotals } from "../engine/nutrition.js";
import { coachLines, greeting, daySummary } from "../engine/coach.js";
import { SLOT_LABELS, describeMeal } from "../engine/planner.js";
import { foodById } from "../engine/parser.js";
import { ring, metric, icon, card, cardHead, stat, emptyState } from "./components.js";

export function renderHome(root, app) {
  const state = getState();
  const date = todayISO();
  const day = getDay(date);
  const targets = currentTargets();
  const totals = dayTotals(day);
  const profile = state.profile;

  const remaining = Math.round(targets.kcal - totals.kcal);
  const over = remaining < 0;

  root.append(el("header", { class: "topbar" }, [
    el("div", {}, [
      el("div", { class: "eyebrow", text: new Date().toLocaleDateString(lang() === "mr" ? "mr-IN" : "en-IN", { weekday: "long", day: "numeric", month: "long" }) }),
      el("h1", { text: pick(greeting(profile.name)) })
    ])
  ]));

  const screen = el("div", { class: "stack" });
  root.append(screen);

  /* ——— calories hero ——— */
  const hero = el("div", { class: "card hero-card" });
  hero.append(el("div", { class: "ring-wrap" }, [
    ring({
      value: totals.kcal,
      target: targets.kcal,
      size: 110,
      centerValue: fmt(Math.abs(remaining)),
      label: over ? t("over").toUpperCase() : t("remaining").toUpperCase()
    }),
    el("div", { class: "grow stack", style: "gap:10px" }, [
      el("div", {}, [
        el("div", { class: "tiny", style: "opacity:.75;letter-spacing:.1em;text-transform:uppercase", text: t("calories") }),
        el("div", { class: "nowrap", style: "font-size:clamp(15px,4.7vw,19px);font-weight:680;letter-spacing:-.02em;margin-top:3px;font-variant-numeric:tabular-nums" }, [
          `${fmt(Math.round(totals.kcal))} / ${fmt(targets.kcal)}`,
          el("span", { style: "font-size:12.5px;font-weight:600;opacity:.75;margin-left:4px", text: t("kcal") })
        ])
      ]),
      metric({ name: t("protein"), value: totals.protein, target: targets.protein, unit: "g" }),
      metric({ name: t("fibre"), value: totals.fibre, target: targets.fibre, unit: "g" })
    ])
  ]));
  screen.append(hero);

  /* ——— steps + water ——— */
  screen.append(el("div", { class: "card tight" }, [
    el("button", {
      class: "grow", type: "button", style: "all:unset;display:block;cursor:pointer;width:100%",
      onclick: () => app.go("activity")
    }, [
      el("div", { class: "row between", style: "align-items:baseline;margin-bottom:8px" }, [
        el("span", { class: "metric-name", text: t("steps") }),
        el("span", {}, [
          el("strong", { style: "font-size:17px;letter-spacing:-.02em", text: fmt(day.steps || 0) }),
          el("span", { class: "metric-val", text: ` / ${fmt(targets.steps)}` })
        ])
      ]),
      el("div", { class: "bar sky" }, [el("i", { style: `width:${Math.min(100, ((day.steps || 0) / targets.steps) * 100)}%` })])
    ]),
    el("div", { style: "height:16px" }),
    el("button", {
      type: "button", style: "all:unset;display:block;cursor:pointer;width:100%",
      onclick: () => app.openWater()
    }, [
      el("div", { class: "row between", style: "align-items:baseline;margin-bottom:8px" }, [
        el("span", { class: "metric-name", text: t("water") }),
        el("span", {}, [
          el("strong", { style: "font-size:17px;letter-spacing:-.02em", text: `${round((day.waterMl || 0) / 1000, 2)} L` }),
          el("span", { class: "metric-val", text: ` / ${round(targets.waterMl / 1000, 2)} L` })
        ])
      ]),
      el("div", { class: "bar amber" }, [el("i", { style: `width:${Math.min(100, ((day.waterMl || 0) / targets.waterMl) * 100)}%` })])
    ])
  ]));

  /* ——— quick actions ——— */
  screen.append(card([
    cardHead(t("quick_actions")),
    el("div", { class: "quick-grid" }, [
      quick("plus", t("log_food"), () => app.openFoodLog()),
      quick("drop", t("add_water"), () => app.openWater()),
      quick("shoe", t("log_steps"), () => app.openSteps()),
      quick("dumbbell", t("start_workout"), () => app.openWorkout()),
      quick("scale", t("log_weight"), () => app.openWeight()),
      quick("plan", t("plan_meals"), () => app.go("plan"))
    ])
  ]));

  /* ——— today's workout ——— */
  const workout = workoutFor(date);
  if (workout) {
    const done = day.workout && day.workout.completedAt;
    screen.append(card([
      cardHead(t("todays_workout"), done ? el("span", { class: "tag leaf", text: `${day.workout.minutes} min ✓` }) : null),
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
      cardHead(t("whats_next"), el("span", { class: "tag accent", text: label[lang()] || label.en })),
      el("p", { class: "small muted", text: lang() === "mr"
        ? `तुमच्याकडे अंदाजे ${fmt(remaining)} kcal शिल्लक आहेत.`
        : `You have about ${fmt(remaining)} kcal left today.` }),
      el("div", { style: "height:10px" }),
      el("div", { class: "list" }, suggestion.items.map(item => {
        const food = foodById(item.foodId);
        return el("div", { class: "list-row" }, [
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
    cardHead(t("your_coach"), icon("sparkle", 18)),
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

function quick(name, label, onclick) {
  return el("button", { class: "quick", type: "button", onclick }, [icon(name, 21), el("span", { text: label })]);
}
