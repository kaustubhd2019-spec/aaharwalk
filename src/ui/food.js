/* AaharWalk — Food screen and the natural-language logging sheet. */

import { el, fmt, todayISO, addDays, uid, round } from "../core/util.js";
import { t, pick, nameOf, lang } from "../core/i18n.js";
import { getState, getDay, addFoodEntries, removeFoodEntry, updateFoodEntry, saveFavorite, removeFavorite, MEAL_SLOTS } from "../core/store.js";
import { parseMeal, searchFoods, foodById } from "../engine/parser.js";
import { nutritionFor, totalNutrition, displayKcal, swapsFor, OIL_LABELS } from "../engine/nutrition.js";
import { unitsFor, unitLabel, qtyLabel } from "../data/units.js";
import { AMBIGUOUS } from "../data/foods.js";
import { currentTargets } from "../engine/session.js";
import { SLOT_LABELS } from "../engine/planner.js";
import { dayTotals } from "../engine/nutrition.js";
import { card, cardHead, sheet, closeSheet, closeAllSheets, toast, icon, emptyState, metricLine, confidenceDot, chipRow, foodAvatar, cardIcon } from "./components.js";

/* ——————————————————————————— Food screen ——————————————————————————— */

export function renderFood(root, app) {
  const date = app.date || todayISO();
  const day = getDay(date);
  const targets = currentTargets();
  const totals = dayTotals(day);
  const state = getState();

  root.append(el("header", { class: "topbar" }, [
    el("div", {}, [
      el("div", { class: "eyebrow", text: t("today") }),
      el("h1", { text: t("nav_food") })
    ]),
    el("button", { class: "btn sm", type: "button", onclick: () => app.openFoodLog() }, [icon("plus", 16), t("log_food")])
  ]));

  const screen = el("div", { class: "stack" });
  root.append(screen);

  screen.append(card([
    el("div", { class: "row between", style: "align-items:baseline" }, [
      el("div", { class: "row", style: "gap:10px;align-items:baseline" }, [
        el("span", { class: "dot-lg", style: "background:var(--m-cal)" }),
        el("span", { style: "font-size:25px;font-weight:730;letter-spacing:-.03em",
          text: `${fmt(Math.round(totals.kcal))} ${t("kcal")}` })
      ]),
      el("span", { class: "small muted", text: `${t("target")} ${fmt(targets.kcal)}` })
    ]),
    el("div", { style: "height:12px" }),
    metricLine({ name: t("protein"), value: totals.protein, target: targets.protein, unit: "g", color: "var(--m-protein)" }),
    el("div", { style: "height:12px" }),
    metricLine({ name: t("fibre"), value: totals.fibre, target: targets.fibre, unit: "g", color: "var(--m-fibre)" })
  ]));

  /* meals */
  const mealsCard = card([cardHead(t("today"))]);
  const anyLogged = MEAL_SLOTS.some(slot => day.meals[slot].length);
  if (!anyLogged) {
    mealsCard.append(emptyState(t("no_food_yet")));
  } else {
    for (const slot of MEAL_SLOTS) {
      const entries = day.meals[slot];
      if (!entries.length) continue;
      const slotTotal = totalNutrition(entries);
      const block = el("div", { class: "meal-block" }, [
        el("div", { class: "row between", style: "margin-bottom:6px" }, [
          el("span", { class: "card-title", text: (SLOT_LABELS[slot] || {})[lang()] || t(slot) }),
          el("span", { class: "small", style: "font-weight:620", text: `${fmt(displayKcal(slotTotal.kcal))} ${t("kcal")}` })
        ])
      ]);
      for (const entry of entries) {
        const n = nutritionFor(entry);
        if (!n) continue;
        block.append(el("div", { class: "list-row" }, [
          foodAvatar(n.food),
          el("div", { class: "lead" }, [
            el("div", { class: "title", text: nameOf(n.food) }),
            el("div", { class: "sub row", style: "gap:6px" }, [
              confidenceDot(n.confidence, lang()),
              `${qtyLabel(entry.qty)} ${unitLabel(entry.unit, lang(), entry.qty)}${entry.oil && entry.oil !== "normal" ? ` · ${OIL_LABELS[entry.oil][lang()]}` : ""}`
            ])
          ]),
          el("span", { class: "value", text: `≈ ${fmt(displayKcal(n.kcal))}` }),
          el("button", { class: "icon-btn", type: "button", "aria-label": t("edit"),
            onclick: () => openEntryEditor(app, date, slot, entry) }, [icon("edit", 15)])
        ]));
      }
      block.append(el("div", { class: "row", style: "gap:8px;margin-top:8px" }, [
        el("button", { class: "chip sm", type: "button", text: t("save_as_favourite"),
          onclick: () => promptSaveFavourite(app, slot, entries) })
      ]));
      mealsCard.append(block);
    }
  }
  screen.append(mealsCard);

  /* repeat & favourites */
  const yesterday = getDay(addDays(date, -1));
  const yesterdayHasFood = MEAL_SLOTS.some(slot => yesterday.meals[slot].length);
  const shortcuts = el("div", { class: "chips" });
  if (yesterdayHasFood) {
    for (const slot of MEAL_SLOTS) {
      if (!yesterday.meals[slot].length) continue;
      shortcuts.append(el("button", {
        class: "chip", type: "button",
        text: `${t("repeat_yesterday")} ${((SLOT_LABELS[slot] || {})[lang()] || t(slot)).toLowerCase()}`,
        onclick: () => {
          addFoodEntries(date, slot, yesterday.meals[slot].map(e => ({ ...e, id: uid("e") })));
          toast(t("saved"));
          app.refresh();
        }
      }));
    }
  }
  for (const fav of state.favorites) {
    shortcuts.append(el("button", {
      class: "chip", type: "button", text: fav.name,
      onclick: () => {
        addFoodEntries(date, fav.slot, fav.entries.map(e => ({ ...e, id: uid("e") })));
        toast(t("saved"));
        app.refresh();
      },
      oncontextmenu: event => { event.preventDefault(); removeFavorite(fav.id); app.refresh(); }
    }));
  }
  if (shortcuts.children.length) {
    screen.append(card([cardHead(t("favourites")), shortcuts]));
  }

  /* frequently eaten */
  const frequent = Object.entries(state.foodStats || {})
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 8)
    .map(([id, meta]) => ({ food: foodById(id), meta }))
    .filter(x => x.food);
  if (frequent.length >= 3) {
    screen.append(card([
      cardHead(t("frequently_eaten")),
      el("div", { class: "chips" }, frequent.map(({ food, meta }) =>
        el("button", {
          class: "chip", type: "button", text: nameOf(food),
          onclick: () => app.openFoodLog({ prefill: [{ foodId: food.id, qty: meta.qty || 1, unit: meta.unit || food.unit, oil: "normal", confidence: "medium" }] })
        })))
    ]));
  }

  screen.append(el("p", { class: "disclaimer", text: t("estimate_note") + " " + t("disclaimer") }));
}

/* ——————————————————————— logging sheet ——————————————————————————— */

export function openFoodLogSheet(app, { prefill = null, slot = null, date = null } = {}) {
  const logDate = date || app.date || todayISO();
  const state = getState();
  let items = prefill ? prefill.map(normaliseItem) : [];
  let chosenSlot = slot || guessSlot();

  const body = el("div", { class: "stack" });

  /* meal slot picker */
  const slotRow = el("div", { class: "chips" });
  const paintSlots = () => {
    slotRow.replaceChildren(...MEAL_SLOTS.map(key => el("button", {
      class: "chip sm", type: "button",
      "aria-pressed": key === chosenSlot ? "true" : "false",
      text: (SLOT_LABELS[key] || {})[lang()] || t(key),
      onclick: () => { chosenSlot = key; paintSlots(); }
    })));
  };
  paintSlots();

  /* text input */
  const input = el("textarea", {
    class: "input",
    rows: 3,
    placeholder: t("food_input_hint"),
    "aria-label": t("what_did_you_eat")
  });

  const resultHost = el("div", { class: "stack" });

  const parseButton = el("button", { class: "btn soft", type: "button", onclick: runParse }, [icon("sparkle", 16), t("parse")]);

  const searchBox = el("input", { class: "input", type: "search", placeholder: t("search_foods") });
  const searchResults = el("div", { class: "chips" });
  searchBox.addEventListener("input", () => {
    const found = searchFoods(searchBox.value, 14);
    searchResults.replaceChildren(...found.map(food => el("button", {
      class: "chip sm", type: "button", text: nameOf(food),
      onclick: () => {
        items.push(normaliseItem({ foodId: food.id, qty: 1, unit: food.unit, oil: "normal", confidence: "high" }));
        searchBox.value = "";
        searchResults.replaceChildren();
        paintResults();
      }
    })));
  });

  body.append(
    el("div", { class: "field" }, [
      el("label", { text: t("what_did_you_eat") }),
      input,
      el("span", { class: "hint", text: lang() === "mr"
        ? "मराठी, इंग्रजी किंवा दोन्ही मिसळून लिहिलं तरी चालेल."
        : "Marathi, English or a mix of both — all work." })
    ]),
    el("div", { class: "row", style: "gap:8px" }, [parseButton]),
    el("div", { class: "field" }, [el("label", { text: t("add_manually") }), searchBox, searchResults]),
    el("div", { class: "field" }, [el("label", { text: t("which_meal") }), slotRow]),
    resultHost
  );

  const totalNode = el("strong", { text: `0 ${t("kcal")}` });
  const addButton = el("button", { class: "btn", type: "button", disabled: true, onclick: commit }, [t("add_to_log")]);

  const handle = sheet({
    title: t("log_food"),
    body,
    footer: [
      el("div", { class: "row", style: "flex:1;align-items:center" }, [totalNode]),
      addButton
    ]
  });

  setTimeout(() => input.focus(), 120);
  if (items.length) paintResults();

  function runParse() {
    const text = input.value.trim();
    if (!text) return;
    const parsed = parseMeal(text, { foodStats: state.foodStats });
    items = [...items, ...parsed.items.map(normaliseItem)];
    if (parsed.slot) { chosenSlot = parsed.slot; paintSlots(); }
    if (parsed.unmatched.length) {
      toast(`${t("not_recognised")}: ${parsed.unmatched.join(", ")}`, 3600);
    }
    if (!parsed.items.length && !parsed.unmatched.length) toast(t("not_recognised"));
    input.value = "";
    paintResults();
  }

  function paintResults() {
    resultHost.replaceChildren();
    if (!items.length) {
      addButton.disabled = true;
      totalNode.textContent = `0 ${t("kcal")}`;
      return;
    }
    const list = el("div", { class: "card tight" });
    items.forEach((item, index) => {
      const n = nutritionFor(item);
      if (!n) return;
      const row = el("div", { class: "list-row" }, [
        foodAvatar(n.food),
        el("div", { class: "lead" }, [
          el("div", { class: "title row", style: "gap:6px" }, [confidenceDot(n.confidence, lang()), nameOf(n.food)]),
          el("div", { class: "sub", text: `${qtyLabel(item.qty)} ${unitLabel(item.unit, lang(), item.qty)} · ${n.grams} g${item.oil !== "normal" ? ` · ${OIL_LABELS[item.oil][lang()]}` : ""}` })
        ]),
        el("span", { class: "value", text: `≈ ${fmt(displayKcal(n.kcal))}` }),
        el("button", { class: "icon-btn", type: "button", "aria-label": t("edit"),
          onclick: () => openItemEditor(item, updated => { items[index] = updated; paintResults(); }) }, [icon("edit", 15)]),
        el("button", { class: "icon-btn", type: "button", "aria-label": t("remove"),
          onclick: () => { items.splice(index, 1); paintResults(); } }, [icon("close", 15)])
      ]);
      list.append(row);

      /* "Which usal?" — asked only when the app genuinely can't tell */
      if (item.needsChoice && item.options) {
        const choices = el("div", { class: "chips", style: "padding:2px 0 10px" }, [
          el("span", { class: "tiny muted", style: "align-self:center;margin-right:2px", text: t("which_one") }),
          ...item.options.map(id => {
            const option = foodById(id);
            return option ? el("button", {
              class: "chip sm", type: "button",
              "aria-pressed": id === item.foodId ? "true" : "false",
              text: nameOf(option),
              onclick: () => {
                items[index] = { ...item, foodId: id, unit: option.unit === item.unit ? item.unit : item.unit, needsChoice: false, confidence: "high" };
                paintResults();
              }
            }) : null;
          })
        ]);
        list.append(choices);
      }
    });

    const totals = totalNutrition(items);
    list.append(el("div", { class: "row between", style: "padding-top:12px;border-top:1px solid var(--line-2);margin-top:6px" }, [
      el("span", { class: "small muted", text: `${t("protein")} ${Math.round(totals.protein)} g · ${t("fibre")} ${Math.round(totals.fibre)} g` }),
      el("strong", { text: `≈ ${fmt(displayKcal(totals.kcal))} ${t("kcal")}` })
    ]));
    resultHost.append(list);

    /* supportive swaps, never a lecture */
    const heavy = items.map(i => ({ i, n: nutritionFor(i) })).sort((a, b) => b.n.kcal - a.n.kcal)[0];
    if (heavy && heavy.n.kcal > 260) {
      const swaps = swapsFor(heavy.i);
      if (swaps.length) {
        resultHost.append(el("div", { class: "card flat tight" }, [
          el("p", { class: "small", style: "font-weight:600;margin-bottom:6px",
            text: lang() === "mr" ? "हवं असल्यास हलका पर्याय" : "You can still enjoy this" }),
          ...swaps.map(swap => el("p", { class: "small muted",
            text: `• ${swap[lang()] || swap.en}${swap.saves >= 40 ? ` (≈ ${Math.round(swap.saves / 10) * 10} kcal)` : ""}` }))
        ]));
      }
    }

    totalNode.textContent = `≈ ${fmt(displayKcal(totals.kcal))} ${t("kcal")}`;
    addButton.disabled = false;
  }

  function commit() {
    addFoodEntries(logDate, chosenSlot, items.map(item => ({
      foodId: item.foodId, qty: item.qty, unit: item.unit, oil: item.oil, confidence: item.confidence
    })));
    const added = displayKcal(totalNutrition(items).kcal);
    closeAllSheets();
    const targets = currentTargets();
    const left = Math.round(targets.kcal - dayTotals(getDay(logDate)).kcal);
    toast(`≈ ${fmt(added)} ${t("kcal")} ${lang() === "mr" ? "जोडलं" : "added"} · ${fmt(Math.abs(left))} ${lang() === "mr" ? (left < 0 ? "जास्त" : "शिल्लक") : (left < 0 ? "over" : "left")}`, 3200);
    app.refresh();
  }
}

/* ——————————————————————— editors ——————————————————————————— */

function openItemEditor(item, onSave, { onDelete = null } = {}) {
  const food = foodById(item.foodId);
  let draft = { ...item };

  const qtyInput = el("input", { class: "input", type: "number", step: "0.25", min: "0.25", value: String(draft.qty) });
  const unitSelect = el("select", { class: "input" }, unitsFor(food).map(unitKey =>
    el("option", { value: unitKey, text: unitLabel(unitKey, lang(), 2), selected: unitKey === draft.unit })));
  const preview = el("strong", {});

  const repaint = () => {
    draft.qty = Math.max(0.05, Number(qtyInput.value) || 1);
    draft.unit = unitSelect.value;
    const n = nutritionFor(draft);
    preview.textContent = `≈ ${fmt(displayKcal(n.kcal))} kcal · ${n.grams} g`;
  };
  qtyInput.addEventListener("input", repaint);
  unitSelect.addEventListener("change", repaint);

  const oilRow = chipRow(
    ["low", "normal", "high"].map(value => ({ value, label: OIL_LABELS[value][lang()] })),
    { selected: draft.oil, onSelect: value => { draft.oil = value; repaint(); } }
  );
  repaint();

  const variants = variantOptionsFor(food);

  sheet({
    title: nameOf(food),
    body: el("div", { class: "stack" }, [
      el("div", { class: "input-row" }, [
        el("div", { class: "field grow" }, [el("label", { text: t("portion") }), qtyInput]),
        el("div", { class: "field grow" }, [el("label", { text: " " }), unitSelect])
      ]),
      el("div", { class: "field" }, [
        el("label", { text: t("cooking_oil") }),
        oilRow,
        el("span", { class: "hint", text: food.oilG
          ? (lang() === "mr" ? `नेहमीच्या कृतीत अंदाजे ${food.oilG} ग्रॅम तेल धरलं आहे.` : `Assumes about ${food.oilG} g of oil in a usual recipe.`)
          : (lang() === "mr" ? "या पदार्थात वेगळं तेल धरलेलं नाही." : "No cooking oil counted for this item.") })
      ]),
      variants.length ? el("div", { class: "field" }, [
        el("label", { text: t("which_one") }),
        chipRow(variants, { selected: draft.foodId, onSelect: id => { draft.foodId = id; repaint(); } })
      ]) : null,
      el("div", { class: "card flat tight center" }, [preview])
    ]),
    footer: [
      onDelete
        ? el("button", { class: "btn danger", type: "button", style: "flex:0 0 auto", "aria-label": t("remove"),
            onclick: () => { closeSheet(); onDelete(); } }, [icon("trash", 16)])
        : el("button", { class: "btn subtle", type: "button", onclick: () => closeSheet(), text: t("cancel") }),
      el("button", { class: "btn", type: "button", text: t("save"), onclick: () => {
        onSave({ ...draft, needsChoice: false, confidence: draft.confidence === "ask" ? "high" : draft.confidence });
        closeSheet();
      } })
    ]
  });
}

function variantOptionsFor(food) {
  for (const ids of Object.values(AMBIGUOUS)) {
    if (ids.includes(food.id)) {
      return ids.map(id => ({ value: id, label: nameOf(foodById(id)) })).filter(o => o.label);
    }
  }
  return [];
}

function openEntryEditor(app, date, slot, entry) {
  openItemEditor(entry, updated => {
    updateFoodEntry(date, slot, entry.id, {
      qty: updated.qty, unit: updated.unit, oil: updated.oil,
      foodId: updated.foodId, confidence: updated.confidence
    });
    app.refresh();
  }, {
    onDelete: () => { removeFoodEntry(date, slot, entry.id); app.refresh(); }
  });
}

function promptSaveFavourite(app, slot, entries) {
  const nameInput = el("input", { class: "input", placeholder: lang() === "mr" ? "उदा. नेहमीचं दुपारचं जेवण" : "e.g. My usual lunch" });
  sheet({
    title: t("save_as_favourite"),
    body: el("div", { class: "stack" }, [
      el("div", { class: "field" }, [el("label", { text: lang() === "mr" ? "नाव" : "Name" }), nameInput]),
      el("p", { class: "small muted", text: entries.map(e => `${qtyLabel(e.qty)} ${nameOf(foodById(e.foodId))}`).join(", ") })
    ]),
    footer: [
      el("button", { class: "btn subtle", type: "button", text: t("cancel"), onclick: () => closeSheet() }),
      el("button", { class: "btn", type: "button", text: t("save"), onclick: () => {
        const name = nameInput.value.trim() || ((SLOT_LABELS[slot] || {})[lang()] || slot);
        saveFavorite(name, slot, entries.map(e => ({ foodId: e.foodId, qty: e.qty, unit: e.unit, oil: e.oil })));
        closeSheet();
        toast(t("saved"));
        app.refresh();
      } })
    ]
  });
}

/* ——————————————————————— helpers ——————————————————————————— */

function normaliseItem(item) {
  const food = foodById(item.foodId);
  return {
    foodId: item.foodId,
    qty: Number(item.qty) || 1,
    unit: item.unit || (food ? food.unit : "serving"),
    oil: item.oil || "normal",
    confidence: item.confidence || "medium",
    needsChoice: Boolean(item.needsChoice),
    options: item.options || null
  };
}

function guessSlot() {
  const hour = new Date().getHours();
  if (hour < 10.5) return "breakfast";
  if (hour < 12) return "midmorning";
  if (hour < 16) return "lunch";
  if (hour < 19.5) return "snack";
  return "dinner";
}
