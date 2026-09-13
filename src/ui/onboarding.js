/* AaharWalk — first-run setup. Six short steps, plain questions,
   and a clear statement about what the app is and is not. */

import { el, clamp, todayISO, round, fmt } from "../core/util.js";
import { t, lang, setLang } from "../core/i18n.js";
import { update, updateDay } from "../core/store.js";
import { ACTIVITY_LEVELS, GOALS, computeTargets } from "../engine/targets.js";
import { EQUIPMENT } from "../data/exercises.js";
import { icon, toast } from "./components.js";

const CUISINES = [
  ["mh", "Maharashtrian", "महाराष्ट्रीय"],
  ["north", "North Indian", "उत्तर भारतीय"],
  ["south", "South Indian", "दक्षिण भारतीय"],
  ["guj", "Gujarati", "गुजराती"],
  ["punj", "Punjabi", "पंजाबी"],
  ["generic", "Everyday mixed", "मिश्र"]
];

export function renderOnboarding(root, app) {
  const draft = {
    name: "", age: 32, gender: "male",
    heightCm: 170, weightKg: 72, targetWeightKg: 68,
    activity: "light", typicalSteps: 5000,
    goal: "fatloss",
    diet: "veg", cuisines: ["mh"], avoid: [],
    sleepHours: 7, waterNowL: 2,
    exercise: "beginner", equipment: ["mat"],
    heartFocus: true, doctorAdvice: false,
    startedOn: todayISO()
  };

  let step = 0;
  const STEPS = [stepWelcome, stepAbout, stepBody, stepActivity, stepFood, stepExercise, stepReview];

  const host = el("div", { class: "onboard" });
  const progress = el("div", { class: "onboard-progress" });
  const bodyHost = el("div", { class: "stack" });
  const foot = el("div", { class: "onboard-foot" });
  host.append(progress, bodyHost);
  root.append(host, foot);

  paint();

  function paint() {
    progress.replaceChildren(...STEPS.map((_, i) => el("i", { class: i <= step ? "on" : "" })));
    bodyHost.replaceChildren(STEPS[step]());
    foot.replaceChildren(
      step > 0 ? el("button", { class: "btn subtle", type: "button", text: t("back"), style: "flex:0 0 32%", onclick: () => { step -= 1; paint(); window.scrollTo(0, 0); } }) : null,
      el("button", {
        class: "btn", type: "button",
        text: step === STEPS.length - 1 ? t("finish_setup") : t("next"),
        onclick: () => {
          if (!validate()) return;
          if (step === STEPS.length - 1) return finish();
          step += 1;
          paint();
          window.scrollTo(0, 0);
        }
      })
    );
  }

  function validate() {
    if (step === 1 && (!draft.age || draft.age < 13 || draft.age > 100)) {
      toast(lang() === "mr" ? "वय १३ ते १०० दरम्यान असावं." : "Enter an age between 13 and 100.");
      return false;
    }
    if (step === 2) {
      if (draft.heightCm < 120 || draft.heightCm > 220) { toast(lang() === "mr" ? "उंची तपासा." : "Check your height."); return false; }
      if (draft.weightKg < 30 || draft.weightKg > 250) { toast(lang() === "mr" ? "वजन तपासा." : "Check your weight."); return false; }
    }
    return true;
  }

  function finish() {
    const profile = {
      ...draft,
      name: draft.name.trim(),
      avoid: String(draft.avoidRaw || "").split(",").map(s => s.trim()).filter(Boolean)
    };
    delete profile.avoidRaw;
    update(s => {
      s.profile = profile;
      s.settings.reminders.water = true;
    });
    updateDay(todayISO(), day => { day.weightKg = profile.weightKg; });
    foot.remove();
    app.go("home");
  }

  /* ——— steps ——————————————————————————————————————————— */

  function stepWelcome() {
    return el("div", { class: "stack", style: "gap:18px;padding-top:20px" }, [
      el("div", { style: "font-size:44px" }, ["🥗"]),
      el("div", {}, [
        el("div", { class: "step-title", text: t("onboard_welcome") }),
        el("p", { class: "step-sub", text: t("onboard_sub") })
      ]),
      el("div", { class: "field" }, [
        el("label", { text: t("language") }),
        el("div", { class: "segmented" }, [
          el("button", { type: "button", "aria-pressed": lang() === "en" ? "true" : "false", text: "English",
            onclick: () => { setLang("en"); paint(); } }),
          el("button", { type: "button", "aria-pressed": lang() === "mr" ? "true" : "false", text: "मराठी",
            onclick: () => { setLang("mr"); paint(); } })
        ])
      ]),
      el("div", { class: "card flat" }, [
        el("p", { class: "small", style: "line-height:1.6", text: lang() === "mr"
          ? "आहारवॉक तुमचा आहार, चालणं आणि घरचा व्यायाम एकाच ठिकाणी सांभाळतो. सगळी माहिती फक्त याच फोनमध्ये राहते."
          : "AaharWalk keeps your food, walking and home workouts in one place. Everything stays on this device." })
      ]),
      el("p", { class: "disclaimer", text: t("disclaimer") })
    ]);
  }

  function stepAbout() {
    return section(lang() === "mr" ? "थोडं तुमच्याबद्दल" : "A little about you", "", [
      field(t("name"), input({ value: draft.name, placeholder: lang() === "mr" ? "कौस्तुभ" : "Your first name", oninput: e => { draft.name = e.target.value; } })),
      el("div", { class: "input-row" }, [
        field(t("age"), input({ type: "number", value: draft.age, inputmode: "numeric", oninput: e => { draft.age = Number(e.target.value); } })),
        field(t("sleep_q"), input({ type: "number", step: "0.5", value: draft.sleepHours, inputmode: "decimal", oninput: e => { draft.sleepHours = Number(e.target.value); } }))
      ]),
      field(t("gender"), options([
        { value: "male", title: t("male") },
        { value: "female", title: t("female") },
        { value: "other", title: t("other_gender") }
      ], draft.gender, value => { draft.gender = value; }))
    ]);
  }

  function stepBody() {
    const heightField = el("div", { class: "input-row" }, [
      field(`${t("height")} (cm)`, input({ type: "number", value: draft.heightCm, inputmode: "numeric", oninput: e => { draft.heightCm = Number(e.target.value); } })),
      field(`${t("current_weight")} (kg)`, input({ type: "number", step: "0.1", value: draft.weightKg, inputmode: "decimal",
        oninput: e => { draft.weightKg = Number(e.target.value); } }))
    ]);
    return section(lang() === "mr" ? "उंची आणि वजन" : "Height and weight",
      lang() === "mr" ? "यावरून तुमचं रोजचं कॅलरी लक्ष्य ठरतं." : "These set your daily calorie estimate.", [
      heightField,
      field(`${t("target_weight")} (kg)`, input({ type: "number", step: "0.1", value: draft.targetWeightKg, inputmode: "decimal",
        oninput: e => { draft.targetWeightKg = Number(e.target.value); } })),
      field(t("goal_q"), options(Object.entries(GOALS).map(([value, meta]) => ({ value, title: meta[lang()] || meta.en })), draft.goal, value => { draft.goal = value; }))
    ]);
  }

  function stepActivity() {
    return section(lang() === "mr" ? "तुमचा दिवस" : "Your usual day", "", [
      field(t("activity_level"), options(Object.entries(ACTIVITY_LEVELS).map(([value, meta]) => ({
        value, title: meta[lang()] || meta.en, desc: meta.note
      })), draft.activity, value => { draft.activity = value; })),
      field(t("typical_steps"), input({ type: "number", step: "500", value: draft.typicalSteps, inputmode: "numeric",
        oninput: e => { draft.typicalSteps = Number(e.target.value); } }),
        lang() === "mr" ? "अंदाज चालेल. लक्ष्य इथूनच हळूहळू वाढेल." : "A rough guess is fine — the goal ramps up from here."),
      field(t("water_now_q"), input({ type: "number", step: "0.25", value: draft.waterNowL, inputmode: "decimal",
        oninput: e => { draft.waterNowL = Number(e.target.value); } }))
    ]);
  }

  function stepFood() {
    return section(lang() === "mr" ? "तुमचं जेवण" : "How you eat", "", [
      field(t("diet_q"), options([
        { value: "veg", title: t("veg") },
        { value: "egg", title: t("egg") },
        { value: "nonveg", title: t("nonveg") }
      ], draft.diet, value => { draft.diet = value; })),
      field(t("cuisines_q"), multiChips(CUISINES.map(([value, en, mr]) => ({ value, label: lang() === "mr" ? mr : en })),
        draft.cuisines, values => { draft.cuisines = values; })),
      field(t("avoid_q"), input({ placeholder: t("avoid_hint"), value: draft.avoidRaw || "", oninput: e => { draft.avoidRaw = e.target.value; } }), t("avoid_hint")),
      field(t("heart_q"), options([
        { value: "yes", title: t("yes"), desc: lang() === "mr" ? "जास्त तंतुमय, कमी तळलेलं, कमी साखर" : "More fibre, less deep-fried, less sugar" },
        { value: "no", title: t("no") }
      ], draft.heartFocus ? "yes" : "no", value => { draft.heartFocus = value === "yes"; })),
      field(t("doctor_q"), options([
        { value: "no", title: t("no") },
        { value: "yes", title: t("yes"), desc: t("doctor_note") }
      ], draft.doctorAdvice ? "yes" : "no", value => { draft.doctorAdvice = value === "yes"; }))
    ]);
  }

  function stepExercise() {
    return section(lang() === "mr" ? "घरचा व्यायाम" : "Home workouts", "", [
      field(t("exercise_q"), options([
        { value: "beginner", title: t("beginner") },
        { value: "some", title: t("some") },
        { value: "regular", title: t("regular") }
      ], draft.exercise, value => { draft.exercise = value; })),
      field(t("equipment_q"), multiChips(
        Object.entries(EQUIPMENT).filter(([key]) => key !== "none").map(([value, meta]) => ({ value, label: meta[lang()] || meta.en })),
        draft.equipment, values => { draft.equipment = values; }))
    ]);
  }

  function stepReview() {
    const preview = computeTargets({
      weightKg: draft.weightKg, heightCm: draft.heightCm, age: draft.age, gender: draft.gender,
      activity: draft.activity, goal: draft.goal, targetWeightKg: draft.targetWeightKg, typicalSteps: draft.typicalSteps
    }, {});
    return section(lang() === "mr" ? "तुमची सुरुवातीची लक्ष्यं" : "Your starting targets",
      lang() === "mr" ? "ही अंदाजे आहेत आणि तुमच्या प्रगतीनुसार बदलत राहतील." : "These are estimates and will adjust as you go.", [
      el("div", { class: "card" }, [
        kv(`🔥 ${t("calories")}`, `${fmt(preview.kcal)} kcal`),
        kv(`🚶 ${t("steps")}`, fmt(preview.steps)),
        kv(`💧 ${t("water")}`, `${round(preview.waterMl / 1000, 2)} L`),
        kv(`💪 ${t("protein")}`, `${preview.protein} g`),
        kv(`🌾 ${t("fibre")}`, `${preview.fibre} g`),
        kv(lang() === "mr" ? "BMR (विश्रांतीची गरज)" : "BMR (at rest)", `${fmt(preview.bmr)} kcal`),
        kv(lang() === "mr" ? "देखभाल कॅलरीज" : "Maintenance", `${fmt(preview.maintenance)} kcal`)
      ]),
      draft.goal === "fatloss" ? el("p", { class: "small muted", text: lang() === "mr"
        ? `या वेगाने अंदाजे दर आठवड्याला ${Math.abs(preview.projectedWeeklyKg)} किलो कमी होणं अपेक्षित आहे — हा टिकाऊ वेग आहे.`
        : `That works out to roughly ${Math.abs(preview.projectedWeeklyKg)} kg a week — a pace you can keep.` }) : null,
      el("p", { class: "disclaimer", text: t("disclaimer") })
    ]);
  }

  /* ——— tiny builders ——————————————————————————————————— */

  function section(title, subtitle, children) {
    return el("div", { class: "stack", style: "gap:18px" }, [
      el("div", {}, [
        el("div", { class: "step-title", text: title }),
        subtitle ? el("p", { class: "step-sub", text: subtitle }) : null
      ]),
      ...children
    ]);
  }

  function field(label, control, hint) {
    return el("div", { class: "field" }, [
      el("label", { text: label }),
      control,
      hint ? el("span", { class: "hint", text: hint }) : null
    ]);
  }

  function input(attrs) {
    return el("input", { class: "input", ...attrs });
  }

  function options(list, selected, onSelect) {
    const host = el("div", { class: "stack", style: "gap:8px" });
    const paintOptions = () => host.replaceChildren(...list.map(option => el("button", {
      class: "option", type: "button",
      "aria-pressed": option.value === selected ? "true" : "false",
      onclick: () => { selected = option.value; onSelect(option.value); paintOptions(); }
    }, [
      el("span", { class: "grow" }, [
        el("span", { class: "t", style: "display:block", text: option.title }),
        option.desc ? el("span", { class: "d", style: "display:block", text: option.desc }) : null
      ]),
      el("span", { class: "mark" }, option.value === selected ? [icon("check", 13, 2.4)] : [])
    ])));
    paintOptions();
    return host;
  }

  function multiChips(list, selected, onChange) {
    const chosen = new Set(selected);
    const host = el("div", { class: "chips" });
    const paintChips = () => host.replaceChildren(...list.map(option => el("button", {
      class: "chip", type: "button",
      "aria-pressed": chosen.has(option.value) ? "true" : "false",
      text: option.label,
      onclick: () => {
        chosen.has(option.value) ? chosen.delete(option.value) : chosen.add(option.value);
        onChange(Array.from(chosen));
        paintChips();
      }
    })));
    paintChips();
    return host;
  }

  function kv(k, v) {
    return el("div", { class: "kv" }, [el("span", { class: "k", text: k }), el("span", { class: "v", text: v })]);
  }
}
