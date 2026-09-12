/* AaharWalk — Plan: today's suggested meals and the weekly report. */

import { el, fmt, round, todayISO, addDays, avg, weekdayShort, lastNDays } from "../core/util.js";
import { t, pick, nameOf, lang, localeCode } from "../core/i18n.js";
import { getState, addFoodEntries } from "../core/store.js";
import { currentTargets, planFor, recentDays, weightHistory } from "../engine/session.js";
import { SLOT_LABELS } from "../engine/planner.js";
import { foodById } from "../engine/parser.js";
import { totalNutrition, displayKcal } from "../engine/nutrition.js";
import { weeklyReport } from "../engine/coach.js";
import { qtyLabel, unitLabel } from "../data/units.js";
import { card, cardHead, stat, icon, toast, barChart, emptyState } from "./components.js";

export function renderPlan(root, app) {
  const date = todayISO();
  const targets = currentTargets();
  const state = getState();

  root.append(el("header", { class: "topbar" }, [
    el("div", {}, [
      el("div", { class: "eyebrow", text: t("today") }),
      el("h1", { text: t("plan_title") })
    ]),
    el("button", { class: "icon-btn", type: "button", "aria-label": t("regenerate"),
      onclick: () => { planFor(date, { regenerate: true }); toast(t("saved")); app.refresh(); } }, [icon("refresh", 18)])
  ]));

  const screen = el("div", { class: "stack" });
  root.append(screen);

  /* ——— today's plan ——— */
  const plan = planFor(date);
  if (!plan) {
    screen.append(emptyState(t("nothing_logged")));
  } else {
    const planCard = card([
      cardHead(t("view_plan"), el("span", { class: "tag accent", text: `≈ ${fmt(displayKcal(plan.totals.kcal))} kcal` }))
    ]);

    for (const [slot, meal] of Object.entries(plan.plan)) {
      const block = el("div", { class: "meal-block" }, [
        el("div", { class: "row between", style: "margin-bottom:6px" }, [
          el("span", { class: "card-title", text: (SLOT_LABELS[slot] || {})[lang()] || t(slot) }),
          el("span", { class: "small", style: "font-weight:620", text: `≈ ${fmt(displayKcal(meal.nutrition.kcal))} ${t("kcal")}` })
        ])
      ]);
      for (const item of meal.items) {
        const food = foodById(item.foodId);
        if (!food) continue;
        block.append(el("div", { class: "list-row" }, [
          el("div", { class: "lead" }, [
            el("div", { class: "title", text: nameOf(food) }),
            el("div", { class: "sub", text: `${qtyLabel(item.qty)} ${unitLabel(item.unit, lang(), item.qty)}` })
          ])
        ]));
      }
      block.append(el("div", { class: "row", style: "gap:8px;margin-top:10px;flex-wrap:wrap" }, [
        el("span", { class: "small muted grow",
          text: `${t("protein")} ${Math.round(meal.nutrition.protein)} g · ${t("fibre")} ${Math.round(meal.nutrition.fibre)} g` }),
        el("button", { class: "chip sm", type: "button", text: lang() === "mr" ? "नोंदवा" : "Log it",
          onclick: () => {
            addFoodEntries(date, slot, meal.items.map(i => ({ foodId: i.foodId, qty: i.qty, unit: i.unit, oil: "normal", confidence: "medium" })));
            toast(t("saved"));
            app.refresh();
          } }),
        el("button", { class: "chip sm", type: "button", text: t("edit"),
          onclick: () => app.openFoodLog({ prefill: meal.items, slot }) })
      ]));
      planCard.append(block);
    }

    planCard.append(el("div", { class: "meal-block" }, [
      el("div", { class: "kv" }, [el("span", { class: "k", text: t("total") }), el("span", { class: "v", text: `≈ ${fmt(displayKcal(plan.totals.kcal))} ${t("kcal")}` })]),
      el("div", { class: "kv" }, [el("span", { class: "k", text: t("target") }), el("span", { class: "v", text: `${fmt(targets.kcal)} ${t("kcal")}` })]),
      el("div", { class: "kv" }, [el("span", { class: "k", text: t("protein") }), el("span", { class: "v", text: `${Math.round(plan.totals.protein)} / ${targets.protein} g` })]),
      el("div", { class: "kv" }, [el("span", { class: "k", text: t("fibre") }), el("span", { class: "v", text: `${Math.round(plan.totals.fibre)} / ${targets.fibre} g` })])
    ]));

    planCard.append(el("button", {
      class: "btn ghost block", type: "button", style: "margin-top:14px",
      onclick: () => { planFor(date, { regenerate: true }); app.refresh(); }
    }, [icon("refresh", 16), t("regenerate")]));

    screen.append(planCard);
  }

  /* ——— weekly report ——— */
  const week = recentDays(7);
  const previous = recentDays(7, addDays(date, -7));
  const report = weeklyReport({ days: week, targets, weights: weightHistory(30), previousDays: previous });

  const weights = weightHistory(30).filter(w => w.date >= addDays(date, -7));
  const firstWeight = weights[0];
  const lastWeight = weights[weights.length - 1];

  screen.append(card([
    cardHead(t("this_week")),
    el("div", { class: "stat-grid" }, [
      stat({ k: t("avg_calories"), v: fmt(report.avgKcal), s: `${t("target")} ${fmt(targets.kcal)}` }),
      stat({ k: t("avg_steps"), v: fmt(report.avgSteps), s: `${t("target")} ${fmt(targets.steps)}` }),
      stat({ k: t("avg_water"), v: `${round(report.avgWaterMl / 1000, 2)} L`, s: `${t("target")} ${round(targets.waterMl / 1000, 2)} L` }),
      stat({ k: t("workouts_done"), v: `${report.workouts} / 7`, s: `${report.daysLogged} ${lang() === "mr" ? "दिवस नोंदवले" : "days logged"}` })
    ]),
    el("div", { style: "height:14px" }),
    el("div", { class: "card-title", style: "margin-bottom:8px", text: t("calories") }),
    barChart(
      lastNDays(7).map((iso, i) => ({
        label: weekdayShort(iso, localeCode()),
        value: week[i] ? Math.round(totalNutrition(Object.values(week[i].meals || {}).flat()).kcal) : 0
      })),
      { target: targets.kcal, hitWhen: value => value > 0 && value <= targets.kcal * 1.05 }
    ),
    firstWeight && lastWeight && firstWeight.date !== lastWeight.date
      ? el("div", { class: "kv", style: "margin-top:14px" }, [
          el("span", { class: "k", text: t("weight") }),
          el("span", { class: "v", text: `${firstWeight.kg} → ${lastWeight.kg} kg` })
        ])
      : null,
    report.insights.length ? el("div", { class: "stack", style: "gap:8px;margin-top:14px" }, [
      el("span", { class: "card-title", text: t("your_coach") }),
      ...report.insights.map(insight => el("p", { class: "small muted", text: `• ${pick(insight)}` }))
    ]) : null
  ]));

  screen.append(el("p", { class: "disclaimer", text: t("disclaimer") }));
}
