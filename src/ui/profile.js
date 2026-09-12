/* AaharWalk — Profile: targets, personal details, language, reminders, data. */

import { el, fmt, round, todayISO } from "../core/util.js";
import { t, lang, setLang } from "../core/i18n.js";
import { getState, update, exportJSON, importJSON, resetAll } from "../core/store.js";
import { currentTargets } from "../engine/session.js";
import { ACTIVITY_LEVELS, GOALS, bmiBand } from "../engine/targets.js";
import { EQUIPMENT } from "../data/exercises.js";
import { loadDemoData } from "../data/demo.js";
import { card, cardHead, sheet, closeSheet, toast, icon, chipRow } from "./components.js";

export function renderProfile(root, app) {
  const state = getState();
  const profile = state.profile;
  const targets = currentTargets();
  const band = bmiBand(targets.bmi, true);

  root.append(el("header", { class: "topbar" }, [
    el("div", {}, [
      el("div", { class: "eyebrow", text: profile.name || t("profile_title") }),
      el("h1", { text: t("profile_title") })
    ])
  ]));

  const screen = el("div", { class: "stack" });
  root.append(screen);

  /* —— targets —— */
  screen.append(card([
    cardHead(t("your_targets"), el("span", { class: "tag accent", text: (GOALS[profile.goal] || {})[lang()] || profile.goal })),
    kv(`🔥 ${t("calories")}`, `${fmt(targets.kcal)} kcal`),
    kv(`🚶 ${t("steps")}`, fmt(targets.steps)),
    kv(`💧 ${t("water")}`, `${round(targets.waterMl / 1000, 2)} L`),
    kv(`💪 ${t("protein")}`, `${targets.protein} g`),
    kv(`🌾 ${t("fibre")}`, `${targets.fibre} g`),
    kv(lang() === "mr" ? "चरबी (मार्गदर्शक)" : "Fat (guide)", `${targets.fatG} g`),
    kv(lang() === "mr" ? "कर्बोदकं (मार्गदर्शक)" : "Carbs (guide)", `${targets.carbsG} g`),
    kv(lang() === "mr" ? "वाढीव साखर — कमाल" : "Added sugar — keep under", `${targets.addedSugarMaxG} g`),
    kv("BMR", `${fmt(targets.bmr)} kcal`),
    kv(lang() === "mr" ? "देखभाल" : "Maintenance", `${fmt(targets.maintenance)} kcal`),
    kv("BMI", `${targets.bmi} · ${band.label}`),
    targets.adjusted ? el("p", { class: "small muted", style: "margin-top:10px", text: lang() === "mr"
      ? `तुमच्या वजनाच्या कलानुसार लक्ष्य ${targets.adjusted > 0 ? "+" : ""}${targets.adjusted} kcal ने बदललं आहे.`
      : `Adjusted by ${targets.adjusted > 0 ? "+" : ""}${targets.adjusted} kcal based on your weight trend.` }) : null,
    el("p", { class: "disclaimer", style: "margin-top:12px", text: t("disclaimer") })
  ]));

  /* —— details —— */
  screen.append(card([
    cardHead(t("edit_profile"), el("button", { class: "btn sm soft", type: "button", text: t("edit"), onclick: () => openProfileEditor(app) })),
    kv(t("age"), `${profile.age}`),
    kv(t("height"), `${profile.heightCm} cm`),
    kv(t("current_weight"), `${profile.weightKg} kg`),
    kv(t("target_weight"), `${profile.targetWeightKg} kg`),
    kv(t("activity_level"), (ACTIVITY_LEVELS[profile.activity] || {})[lang()] || profile.activity),
    kv(t("diet_q"), t(profile.diet === "veg" ? "veg" : profile.diet === "egg" ? "egg" : "nonveg")),
    kv(t("exercise_q"), t(profile.exercise)),
    kv(t("equipment_q"), (profile.equipment || []).map(key => (EQUIPMENT[key] || {})[lang()] || key).join(", ") || "—"),
    profile.avoid && profile.avoid.length ? kv(t("avoid_q"), profile.avoid.join(", ")) : null,
    profile.doctorAdvice ? el("p", { class: "small muted", style: "margin-top:10px", text: t("doctor_note") }) : null
  ]));

  /* —— step goal override —— */
  screen.append(card([
    cardHead(t("step_goal")),
    el("p", { class: "small muted", text: lang() === "mr"
      ? "आपोआप ठरणारं लक्ष्य दर आठवड्याला वाढतं. हवं असल्यास स्वतःचं ठरवा."
      : "The automatic goal climbs each week. Set your own if you prefer." }),
    el("div", { style: "height:10px" }),
    chipRow(
      [{ value: "auto", label: lang() === "mr" ? "आपोआप" : "Automatic" }, ...[6000, 8000, 10000, 12000].map(v => ({ value: String(v), label: fmt(v) }))],
      {
        selected: profile.customStepTarget ? String(profile.customStepTarget) : "auto",
        onSelect: value => {
          update(s => { s.profile.customStepTarget = value === "auto" ? null : Number(value); });
          toast(t("saved"));
          app.refresh();
        }
      }
    )
  ]));

  /* —— language & reminders —— */
  screen.append(card([
    cardHead(t("language")),
    el("div", { class: "segmented" }, [
      el("button", { type: "button", "aria-pressed": lang() === "en" ? "true" : "false", text: "English", onclick: () => { setLang("en"); app.refresh(); } }),
      el("button", { type: "button", "aria-pressed": lang() === "mr" ? "true" : "false", text: "मराठी", onclick: () => { setLang("mr"); app.refresh(); } })
    ])
  ]));

  const reminders = state.settings.reminders;
  screen.append(card([
    cardHead(t("reminders")),
    el("div", { class: "row between" }, [
      el("span", { class: "small", text: lang() === "mr" ? "पाण्याची आठवण" : "Water reminders" }),
      el("button", {
        class: `chip sm ${reminders.water ? "on" : ""}`.trim(), type: "button",
        text: reminders.water ? t("yes") : t("no"),
        onclick: () => { update(s => { s.settings.reminders.water = !s.settings.reminders.water; }); app.refresh(); }
      })
    ]),
    el("div", { style: "height:12px" }),
    el("div", { class: "input-row" }, [
      timeField(lang() === "mr" ? "उठण्याची वेळ" : "Wake time", reminders.wakeTime, value => update(s => { s.settings.reminders.wakeTime = value; })),
      timeField(lang() === "mr" ? "झोपण्याची वेळ" : "Sleep time", reminders.sleepTime, value => update(s => { s.settings.reminders.sleepTime = value; }))
    ]),
    el("div", { style: "height:12px" }),
    el("div", { class: "field" }, [
      el("label", { text: lang() === "mr" ? "किती वेळाने आठवण" : "Remind me every" }),
      chipRow([90, 120, 180].map(v => ({ value: String(v), label: `${v / 60 === Math.round(v / 60) ? v / 60 : (v / 60).toFixed(1)} h` })), {
        selected: String(reminders.everyMinutes),
        onSelect: value => { update(s => { s.settings.reminders.everyMinutes = Number(value); }); toast(t("saved")); }
      })
    ]),
    el("p", { class: "small muted", style: "margin-top:10px", text: lang() === "mr"
      ? "आठवणी अॅप उघडं असताना दिसतात. परवानगी दिल्यास फोनवरही सूचना येतील."
      : "Reminders show while the app is open, and as phone notifications if you allow them." }),
    "Notification" in window && Notification.permission === "default"
      ? el("button", { class: "btn ghost block", type: "button", style: "margin-top:10px",
          text: lang() === "mr" ? "सूचनांना परवानगी द्या" : "Allow notifications",
          onclick: () => Notification.requestPermission().then(() => app.refresh()) })
      : null
  ]));

  /* —— data —— */
  screen.append(card([
    cardHead(t("data_privacy")),
    el("p", { class: "small muted", text: lang() === "mr"
      ? "तुमची सगळी माहिती याच फोनमध्ये साठवली जाते. कुठलंही खातं नाही, कुठेही पाठवली जात नाही. फोन बदलण्याआधी बॅकअप घ्या."
      : "Everything is stored on this device only. No account, nothing uploaded. Take a backup before you change phones." }),
    el("div", { style: "height:12px" }),
    el("div", { class: "stack", style: "gap:8px" }, [
      el("button", { class: "btn ghost block", type: "button", text: t("export_backup"), onclick: doExport }),
      el("button", { class: "btn ghost block", type: "button", text: t("import_backup"), onclick: doImport }),
      state.meta.demoLoaded ? null : el("button", { class: "btn ghost block", type: "button", text: t("demo_data"), onclick: () => {
        loadDemoData();
        toast(t("saved"));
        app.refresh();
      } }),
      el("button", { class: "btn danger block", type: "button", text: t("reset_app"), onclick: confirmReset })
    ])
  ]));

  screen.append(el("p", { class: "tiny muted center", style: "padding:6px 0 10px",
    text: `AaharWalk · ${lang() === "mr" ? "तुमच्या फोनवरच चालणारं" : "runs entirely on your device"}` }));

  /* —— handlers —— */

  function doExport() {
    const blob = new Blob([exportJSON()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = el("a", { href: url, download: `aaharwalk-backup-${todayISO()}.json` });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  function doImport() {
    const picker = el("input", { type: "file", accept: "application/json,.json", style: "display:none" });
    picker.addEventListener("change", async () => {
      const file = picker.files && picker.files[0];
      if (!file) return;
      try {
        importJSON(await file.text());
        toast(t("saved"));
        app.refresh();
      } catch (err) {
        toast(lang() === "mr" ? "फाईल वाचता आली नाही." : "That file could not be read.");
      }
      picker.remove();
    });
    document.body.append(picker);
    picker.click();
  }

  function confirmReset() {
    sheet({
      title: t("reset_app"),
      body: el("div", { class: "stack" }, [
        el("p", { class: "small", text: lang() === "mr"
          ? "सगळी नोंदवलेली माहिती कायमची पुसली जाईल. हे पूर्ववत करता येणार नाही."
          : "This permanently erases everything you have logged. It cannot be undone." }),
        el("p", { class: "small muted", text: lang() === "mr" ? "आधी बॅकअप घेतलेला बरा." : "Consider exporting a backup first." })
      ]),
      footer: [
        el("button", { class: "btn subtle", type: "button", text: t("cancel"), onclick: () => closeSheet() }),
        el("button", { class: "btn danger", type: "button", text: t("reset_app"), onclick: () => { resetAll(); closeSheet(); app.go("home"); } })
      ]
    });
  }
}

function openProfileEditor(app) {
  const profile = { ...getState().profile };
  const numberField = (label, key, attrs = {}) => el("div", { class: "field" }, [
    el("label", { text: label }),
    el("input", { class: "input", type: "number", value: String(profile[key] ?? ""), ...attrs,
      oninput: e => { profile[key] = Number(e.target.value); } })
  ]);

  sheet({
    title: t("edit_profile"),
    body: el("div", { class: "stack" }, [
      el("div", { class: "field" }, [
        el("label", { text: t("name") }),
        el("input", { class: "input", value: profile.name || "", oninput: e => { profile.name = e.target.value; } })
      ]),
      el("div", { class: "input-row" }, [
        numberField(t("age"), "age", { min: "13", max: "100" }),
        numberField(`${t("height")} (cm)`, "heightCm", { min: "120", max: "220" })
      ]),
      el("div", { class: "input-row" }, [
        numberField(`${t("current_weight")} (kg)`, "weightKg", { step: "0.1" }),
        numberField(`${t("target_weight")} (kg)`, "targetWeightKg", { step: "0.1" })
      ]),
      el("div", { class: "field" }, [
        el("label", { text: t("activity_level") }),
        chipRow(Object.entries(ACTIVITY_LEVELS).map(([value, meta]) => ({ value, label: meta[lang()] || meta.en })),
          { selected: profile.activity, onSelect: value => { profile.activity = value; } })
      ]),
      el("div", { class: "field" }, [
        el("label", { text: t("goal_q") }),
        chipRow(Object.entries(GOALS).map(([value, meta]) => ({ value, label: meta[lang()] || meta.en })),
          { selected: profile.goal, onSelect: value => { profile.goal = value; } })
      ]),
      el("div", { class: "field" }, [
        el("label", { text: t("diet_q") }),
        chipRow([{ value: "veg", label: t("veg") }, { value: "egg", label: t("egg") }, { value: "nonveg", label: t("nonveg") }],
          { selected: profile.diet, onSelect: value => { profile.diet = value; } })
      ]),
      el("div", { class: "field" }, [
        el("label", { text: t("equipment_q") }),
        chipRow(Object.entries(EQUIPMENT).filter(([key]) => key !== "none").map(([value, meta]) => ({ value, label: meta[lang()] || meta.en })),
          { selected: profile.equipment || [], multi: true, onSelect: values => { profile.equipment = values; } })
      ]),
      el("div", { class: "field" }, [
        el("label", { text: t("avoid_q") }),
        el("input", { class: "input", value: (profile.avoid || []).join(", "), placeholder: t("avoid_hint"),
          oninput: e => { profile.avoid = e.target.value.split(",").map(s => s.trim()).filter(Boolean); } })
      ])
    ]),
    footer: [
      el("button", { class: "btn subtle", type: "button", text: t("cancel"), onclick: () => closeSheet() }),
      el("button", { class: "btn", type: "button", text: t("save"), onclick: () => {
        update(s => { s.profile = { ...s.profile, ...profile }; });
        closeSheet();
        toast(t("saved"));
        app.refresh();
      } })
    ]
  });
}

function kv(k, v) {
  return el("div", { class: "kv" }, [el("span", { class: "k", text: k }), el("span", { class: "v", text: v })]);
}

function timeField(label, value, onChange) {
  return el("div", { class: "field grow" }, [
    el("label", { text: label }),
    el("input", { class: "input", type: "time", value, onchange: e => onChange(e.target.value) })
  ]);
}
