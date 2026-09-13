/* AaharWalk — Activity: steps, water, weight and recent sessions. */

import { el, fmt, round, todayISO, lastNDays, weekdayShort, avg, prettyDate } from "../core/util.js";
import { t, pick, lang, localeCode } from "../core/i18n.js";
import { getState, getDay, updateDay, update } from "../core/store.js";
import { currentTargets, recentDays, weightHistory } from "../engine/session.js";
import { weightTrend } from "../engine/targets.js";
import { weightNote } from "../engine/coach.js";
import { card, cardHead, sheet, closeSheet, toast, icon, barChart, lineChart, metricLine, emptyState, chipRow, cardIcon } from "./components.js";
import { STEP_SOURCES, availableSources, parseSteps } from "../engine/steps-import.js";
import { hasNativeCounter, nativePermitted, requestNativePermission, readNativeToday, nativeStatus } from "../engine/native-bridge.js";

export function renderActivity(root, app) {
  const date = todayISO();
  const day = getDay(date);
  const targets = currentTargets();
  const state = getState();
  const week = recentDays(7);

  root.append(el("header", { class: "topbar" }, [
    el("div", {}, [
      el("div", { class: "eyebrow", text: t("today") }),
      el("h1", { text: t("activity_title") })
    ])
  ]));

  const screen = el("div", { class: "stack" });
  root.append(screen);

  /* —— steps —— */
  const stepValues = week.map(d => (d && d.steps) || 0);
  const weekAvg = avg(stepValues.filter(v => v > 0));

  screen.append(card([
    cardHead(t("todays_steps"), el("button", {
      class: "btn sm subtle", type: "button", text: t("log_steps"), onclick: () => openStepsSheet(app)
    })),
    el("div", { class: "row between", style: "align-items:baseline" }, [
      el("div", { style: "font-size:30px;font-weight:720;letter-spacing:-.03em", text: fmt(day.steps || 0) }),
      el("span", { class: "small muted", text: `${t("target")} ${fmt(targets.steps)}` })
    ]),
    day.walkedSteps ? el("div", { class: "small muted", style: "margin-top:2px",
      text: `${fmt(day.walkedSteps)} ${t("counted_by_app")}` }) : null,
    el("div", { style: "height:12px" }),
    metricLine({ name: t("step_goal"), value: day.steps || 0, target: targets.steps, color: "var(--m-step)" }),
    el("div", { style: "height:14px" }),
    el("button", { class: "btn block", type: "button", onclick: () => app.openWalk() },
      [icon("shoe", 17), t("start_walk")]),
    el("div", { style: "height:16px" }),
    el("div", { class: "card-title", style: "margin-bottom:8px", text: t("last_7_days") }),
    stepValues.some(v => v > 0)
      ? barChart(
          lastNDays(7).map((iso, i) => ({ label: weekdayShort(iso, localeCode()), value: stepValues[i] })),
          { target: targets.steps, color: "var(--m-step)" }
        )
      : emptyState(t("no_steps_history")),
    el("div", { class: "row between", style: "margin-top:10px" }, [
      el("span", { class: "small muted", text: t("weekly_average") }),
      el("span", { class: "small", style: "font-weight:620", text: fmt(Math.round(weekAvg)) })
    ]),
    el("p", { class: "small muted", style: "margin-top:10px", text: lang() === "mr"
      ? "लक्ष्य हळूहळू वाढतं — आत्ताच १०,००० ची सक्ती नाही. प्रोफाईलमधून तुम्ही ते बदलू शकता."
      : "The goal climbs gradually — no jumping straight to 10,000. You can override it in Profile." })
  ]));

  /* —— water —— */
  screen.append(card([
    cardHead(t("water"), el("span", {}, [
      el("strong", { style: "font-size:16px", text: `${round((day.waterMl || 0) / 1000, 2)} L` }),
      el("span", { class: "metric-val", text: ` / ${round(targets.waterMl / 1000, 2)} L` })
    ])),
    el("div", { class: "databar" }, [
      el("i", { style: `width:${Math.min(100, ((day.waterMl || 0) / targets.waterMl) * 100)}%;background:var(--m-water)` })
    ]),
    el("div", { style: "height:14px" }),
    el("div", { class: "chips" }, [250, 500, 750, 1000].map(ml => el("button", {
      class: "chip", type: "button", text: `+${ml >= 1000 ? "1 L" : `${ml} ml`}`,
      onclick: () => { addWater(date, ml); app.refresh(); }
    })).concat([
      el("button", { class: "chip", type: "button", text: "−250 ml",
        onclick: () => { addWater(date, -250); app.refresh(); } })
    ]))
  ]));

  /* —— weight —— */
  const history = weightHistory();
  const trend = weightTrend(history.map(h => ({ date: h.date, kg: h.kg })));
  screen.append(card([
    cardHead(t("weight"), el("button", {
      class: "btn sm soft", type: "button", text: t("log_weight"), onclick: () => openWeightSheet(app)
    })),
    history.length ? el("div", {}, [
      el("div", { class: "row between", style: "align-items:baseline;margin-bottom:10px" }, [
        el("div", { style: "font-size:26px;font-weight:700;letter-spacing:-.025em",
          text: `${history[history.length - 1].kg} kg` }),
        el("span", { class: `tag ${trend.direction === "down" ? "leaf" : trend.direction === "up" ? "amber" : ""}`.trim(),
          text: `${trend.perWeekKg > 0 ? "+" : ""}${trend.perWeekKg} kg / ${lang() === "mr" ? "आठवडा" : "week"}` })
      ]),
      lineChart(history.map(h => ({ label: h.date, value: h.kg })), { color: "var(--m-weight)" }),
      el("div", { class: "row between", style: "margin-top:6px" }, [
        el("span", { class: "tiny muted", text: prettyDate(history[0].date, localeCode()) }),
        el("span", { class: "tiny muted", text: prettyDate(history[history.length - 1].date, localeCode()) })
      ])
    ]) : emptyState(lang() === "mr" ? "अजून वजन नोंदवलेलं नाही." : "No weight logged yet."),
    el("p", { class: "small muted", style: "margin-top:12px", text: pick(weightNote(trend, state.profile.goal)) })
  ]));

  /* —— sessions —— */
  const sessions = recentDays(14).filter(d => d && d.workout && d.workout.completedAt);
  screen.append(card([
    cardHead(t("workout_history"), el("span", { class: "tag accent", text: `${sessions.length} / 14` })),
    sessions.length
      ? el("div", { class: "list" }, sessions.slice().reverse().map(d => el("div", { class: "list-row" }, [
          el("div", { class: "lead" }, [
            el("div", { class: "title", text: d.workout.title }),
            el("div", { class: "sub", text: prettyDate(d.date, localeCode()) })
          ]),
          el("span", { class: "value", text: `${d.workout.minutes} min · ≈${d.workout.kcal} kcal` })
        ])))
      : emptyState(lang() === "mr" ? "अजून व्यायाम नोंदवलेला नाही." : "No sessions completed yet."),
    el("div", { style: "height:12px" }),
    el("button", { class: "btn block", type: "button", onclick: () => app.openWorkout() }, [icon("play", 16), t("start_workout")])
  ]));
}

/* ——————————————————— sheets ——————————————————— */

export function addWater(date, ml) {
  updateDay(date, day => {
    day.waterMl = Math.max(0, (day.waterMl || 0) + ml);
  });
}

export function openWaterSheet(app) {
  const date = todayISO();
  const targets = currentTargets();
  const body = el("div", { class: "stack" });
  const readout = el("div", { class: "center", style: "font-size:34px;font-weight:720;letter-spacing:-.03em" });
  const bar = el("div", {});

  const repaint = () => {
    const day = getDay(date);
    readout.textContent = `${round((day.waterMl || 0) / 1000, 2)} L`;
    bar.replaceChildren(metricLine({
      name: t("water"), value: day.waterMl || 0, target: targets.waterMl, unit: "L",
      color: "var(--m-water)", format: v => round(v / 1000, 2)
    }));
  };

  body.append(
    readout,
    bar,
    el("div", { class: "chips", style: "justify-content:center" }, [250, 500, 750, 1000].map(ml =>
      el("button", { class: "chip", type: "button", text: `+${ml >= 1000 ? "1 L" : `${ml} ml`}`,
        onclick: () => { addWater(date, ml); repaint(); app.refreshQuiet(); } }))),
    el("div", { class: "chips", style: "justify-content:center" }, [
      el("button", { class: "chip sm", type: "button", text: "−250 ml", onclick: () => { addWater(date, -250); repaint(); app.refreshQuiet(); } })
    ]),
    el("p", { class: "small muted center", text: lang() === "mr"
      ? "जागं झाल्यापासून झोपेपर्यंत थोडं थोडं पाणी प्या."
      : "Spread it through the day rather than all at once." })
  );
  repaint();

  sheet({
    title: t("water"),
    body,
    footer: [el("button", { class: "btn block", type: "button", text: t("done"), onclick: () => { closeSheet(); app.refresh(); } })]
  });
}

export function openStepsSheet(app, { prefill = null, sharedText = null } = {}) {
  const date = todayISO();
  const day = getDay(date);
  const state = getState();
  let source = state.settings.stepSource || "manual";

  const input = el("input", {
    class: "input", type: "number", inputmode: "numeric", min: "0", step: "100",
    value: String(prefill ?? day.steps ?? "")
  });

  const pasteBox = el("textarea", {
    class: "input", rows: 2,
    placeholder: lang() === "mr"
      ? "इथे पेस्ट करा — उदा. “Today 7,842 steps”"
      : "Paste anything here — e.g. “Today 7,842 steps”"
  });
  const pasteNote = el("span", { class: "hint" });

  function readPaste(text) {
    const found = parseSteps(text);
    if (!found) {
      pasteNote.textContent = lang() === "mr"
        ? "यात पावलांचा आकडा सापडला नाही."
        : "Couldn't find a step count in that.";
      return;
    }
    input.value = String(found.steps);
    pasteNote.textContent = lang() === "mr"
      ? `“${found.matchedOn}” मधून ${fmt(found.steps)} पावलं घेतली.`
      : `Read ${fmt(found.steps)} steps from “${found.matchedOn}”.`;
  }
  pasteBox.addEventListener("input", () => readPaste(pasteBox.value));
  pasteBox.addEventListener("paste", event => {
    const text = (event.clipboardData || window.clipboardData).getData("text");
    setTimeout(() => readPaste(text || pasteBox.value), 0);
  });

  const pasteField = el("div", { class: "field" }, [
    el("label", { text: t("paste_steps") }),
    pasteBox,
    pasteNote
  ]);

  const liveNote = el("p", { class: "small", style: "font-weight:560" });
  let liveTimer = null;

  const paintLive = () => {
    if (source !== "phone_native") { liveNote.hidden = true; return; }
    liveNote.hidden = false;
    const status = nativeStatus();
    if (status.state === "ok") {
      liveNote.textContent = `${t("phone_counter_now")}: ${fmt(status.steps)}`;
      liveNote.style.color = "var(--leaf)";
    } else if (status.state === "waiting") {
      liveNote.textContent = t("phone_counter_waiting");
      liveNote.style.color = "var(--amber)";
    } else {
      liveNote.textContent = t("phone_counter_unavailable");
      liveNote.style.color = "var(--ink-3)";
    }
  };

  const howNote = el("p", { class: "small muted" });
  const paintHow = () => {
    const meta = STEP_SOURCES[source] || STEP_SOURCES.manual;
    howNote.textContent = lang() === "mr" ? (meta.howMr || "") : (meta.howEn || "");
    howNote.hidden = !howNote.textContent;
    pasteField.hidden = source === "manual" || source === "phone_native";
    paintLive();
  };
  paintHow();

  if (sharedText) {
    readPaste(sharedText);
    pasteBox.value = sharedText;
  }

  liveTimer = setInterval(paintLive, 1500);

  sheet({
    title: t("log_steps"),
    onClose: () => clearInterval(liveTimer),
    body: el("div", { class: "stack" }, [
      el("button", { class: "btn soft block", type: "button",
        onclick: () => { closeSheet(); app.openWalk(); } }, [icon("shoe", 17), t("start_walk")]),
      el("p", { class: "small muted", style: "margin-top:-4px", text: t("walk_note") }),
      el("div", { class: "divider" }),
      el("div", { class: "field" }, [
        el("label", { text: t("todays_steps") }),
        input
      ]),
      el("div", { class: "chips" }, [1000, 2000, 3000, 5000].map(add => el("button", {
        class: "chip sm", type: "button", text: `+${fmt(add)}`,
        onclick: () => { input.value = String((Number(input.value) || 0) + add); }
      }))),
      el("div", { class: "field" }, [
        el("label", { text: t("step_source") }),
        chipRow(Object.entries(availableSources(hasNativeCounter())).map(([value, meta]) => ({ value, label: meta[lang()] || meta.en })), {
          selected: source, size: "sm",
          onSelect: async value => {
            source = value;
            if (value === "phone_native" && !nativePermitted()) {
              const granted = await requestNativePermission();
              if (!granted) {
                toast(t("native_denied"), 4200);
                source = "manual";
                update(s => { s.settings.stepSource = "manual"; });
                paintHow();
                return;
              }
            }
            update(s => { s.settings.stepSource = value; });
            if (value === "phone_native") {
              const live = readNativeToday();
              if (live != null && live >= 0) input.value = String(live);
            }
            paintHow();
          }
        }),
        howNote,
        liveNote
      ]),
      pasteField,
      el("p", { class: "small muted", text: lang() === "mr"
        ? "अ‍ॅप होम स्क्रीनवर इन्स्टॉल केलं असेल, तर Step Set Go मधल्या Share मधून थेट AaharWalk निवडता येतं."
        : "Once AaharWalk is installed to your home screen, Step Set Go's Share button can send the count straight here." })
    ]),
    footer: [
      el("button", { class: "btn subtle", type: "button", text: t("cancel"), onclick: () => closeSheet() }),
      el("button", { class: "btn", type: "button", text: t("save"), onclick: () => {
        updateDay(date, d => {
          d.steps = Math.max(0, Math.round(Number(input.value) || 0));
          d.stepsSource = source;
        });
        closeSheet();
        toast(t("saved"));
        app.refresh();
      } })
    ]
  });
}

export function openWeightSheet(app) {
  const date = todayISO();
  const day = getDay(date);
  const state = getState();
  const input = el("input", {
    class: "input", type: "number", inputmode: "decimal", step: "0.1", min: "20", max: "300",
    value: String(day.weightKg ?? state.profile.weightKg ?? "")
  });

  sheet({
    title: t("log_weight"),
    body: el("div", { class: "stack" }, [
      el("div", { class: "field" }, [el("label", { text: `${t("weight")} (kg)` }), input]),
      el("p", { class: "small muted", text: lang() === "mr"
        ? "रोजचं वजन पाणी, मीठ, कर्बोदकं आणि पचनामुळे बदलतं. एका दिवसाच्या आकड्याकडे नको, कलाकडे बघा."
        : "Daily weight moves with water, salt, carbohydrates and digestion. Watch the trend, not any one morning." })
    ]),
    footer: [
      el("button", { class: "btn subtle", type: "button", text: t("cancel"), onclick: () => closeSheet() }),
      el("button", { class: "btn", type: "button", text: t("save"), onclick: () => {
        const kg = Number(input.value);
        if (!Number.isFinite(kg) || kg < 20 || kg > 300) { toast("Enter a weight between 20 and 300 kg."); return; }
        updateDay(date, d => { d.weightKg = round(kg, 1); });
        update(s => { s.profile.weightKg = round(kg, 1); });
        closeSheet();
        toast(t("saved"));
        app.refresh();
      } })
    ]
  });
}
