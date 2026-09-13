/* AaharWalk — the workout player. Feels like a small personal trainer:
   one move on screen, a clear timer, and nothing else to think about. */

import { el, fmt, todayISO } from "../core/util.js";
import { t, nameOf, lang } from "../core/i18n.js";
import { getState, updateDay } from "../core/store.js";
import { workoutFor } from "../engine/session.js";
import { exerciseInfo } from "../engine/workouts.js";
import { icon, toast, sheet, closeSheet, chipRow } from "./components.js";

export function openWorkoutPlayer(app) {
  const date = todayISO();
  const workout = workoutFor(date);
  if (!workout) return;

  const state = getState();
  let index = 0;
  let phase = "work";           // "work" | "rest"
  let secondsLeft = workout.steps[0].workSec;
  let paused = true;
  let started = false;
  let ticker = null;
  let elapsed = 0;

  const host = el("div", { class: "player" });
  const head = el("div", { class: "player-head" });
  const progressBar = el("i", { style: "width:0%" });
  const body = el("div", { class: "player-body" });
  const foot = el("div", { class: "player-foot" });

  head.append(
    el("button", { class: "icon-btn", type: "button", "aria-label": t("cancel"), onclick: quit }, [icon("close", 18)]),
    el("div", { class: "center grow" }, [
      el("div", { class: "tiny muted", text: `${workout.minutes} min` }),
      el("div", { style: "font-weight:620;font-size:14px", text: lang() === "mr" ? workout.titleMr : workout.titleEn })
    ]),
    el("div", { style: "width:38px" })
  );

  host.append(head, el("div", { class: "player-progress" }, [progressBar]), body, foot);
  document.body.append(host);
  document.body.style.overflow = "hidden";

  paint();

  function currentStep() { return workout.steps[index]; }

  function paint() {
    const step = currentStep();
    const exercise = exerciseInfo(step.id) || { name: step.id, cue: "" };
    const next = workout.steps[index + 1];
    const nextExercise = next ? exerciseInfo(next.id) : null;

    host.classList.toggle("resting", phase === "rest");
    body.replaceChildren(
      el("div", { class: "player-phase", text: phase === "rest"
        ? t("rest")
        : `${step.phase === "warmup" ? (lang() === "mr" ? "वॉर्म अप" : "Warm up") : step.phase === "cooldown" ? (lang() === "mr" ? "शांत करा" : "Cool down") : (step.roundNo ? `${t("round")} ${step.roundNo}` : (lang() === "mr" ? "मुख्य" : "Main"))}` }),
      el("div", { class: "player-name", text: phase === "rest"
        ? (nextExercise ? nameOf(nextExercise) : t("finish"))
        : nameOf(exercise) }),
      el("div", { class: "player-timer", text: formatTime(secondsLeft) }),
      el("p", { class: "player-cue", text: phase === "rest"
        ? (nextExercise ? `${t("next_up")}: ${nextExercise.cue}` : "")
        : exercise.cue }),
      el("div", { class: "tiny muted", text: `${index + 1} / ${workout.steps.length}` })
    );

    foot.replaceChildren(
      el("button", { class: "btn subtle", type: "button", onclick: toggle },
        [icon(paused ? "play" : "pause", 16), paused ? (started ? t("resume") : t("start")) : t("pause")]),
      el("button", { class: "btn ghost", type: "button", onclick: advance }, [t("skip"), icon("chevron", 16)])
    );

    const done = workout.steps.slice(0, index).reduce((total, s) => total + s.workSec + s.restSec, 0);
    const totalSec = workout.steps.reduce((total, s) => total + s.workSec + s.restSec, 0);
    progressBar.style.width = `${Math.min(100, (done / totalSec) * 100)}%`;
  }

  function toggle() {
    paused = !paused;
    started = true;
    if (paused) { clearInterval(ticker); ticker = null; }
    else {
      ticker = setInterval(tick, 1000);
    }
    paint();
  }

  function tick() {
    secondsLeft -= 1;
    elapsed += 1;
    if (secondsLeft <= 0) { advance(); return; }
    const timer = host.querySelector(".player-timer");
    if (timer) timer.textContent = formatTime(secondsLeft);
  }

  function advance() {
    const step = currentStep();
    if (phase === "work" && step.restSec > 0 && index < workout.steps.length - 1) {
      phase = "rest";
      secondsLeft = step.restSec;
      paint();
      return;
    }
    if (index >= workout.steps.length - 1) { finish(); return; }
    index += 1;
    phase = "work";
    secondsLeft = currentStep().workSec;
    paint();
  }

  function quit() {
    clearInterval(ticker);
    host.remove();
    document.body.style.overflow = "";
    app.refresh();
  }

  function finish() {
    clearInterval(ticker);
    const minutes = Math.max(1, Math.round(elapsed / 60)) || workout.minutes;
    const kcal = Math.round(workout.estimatedKcal * (minutes / Math.max(1, workout.minutes)));
    host.remove();
    document.body.style.overflow = "";

    let feedback = "just_right";
    sheet({
      title: t("well_done"),
      dismissible: false,
      body: el("div", { class: "stack center" }, [
        el("div", { style: "font-size:42px" }, ["🔥"]),
        el("div", { style: "font-size:20px;font-weight:680", text: t("well_done") }),
        el("p", { class: "small muted", text: `${minutes} min · ${lang() === "mr" ? "अंदाजे" : "approx."} ${kcal} kcal` }),
        el("p", { class: "tiny muted", text: lang() === "mr"
          ? "जळालेल्या कॅलरीज हा अंदाज आहे आणि तो जाणीवपूर्वक कमी धरला आहे."
          : "Calories burned are an estimate, kept deliberately conservative." }),
        el("div", { style: "height:6px" }),
        el("div", { class: "field" }, [
          el("label", { class: "center", text: t("how_was_it") }),
          chipRow(
            [["easy", t("easy")], ["just_right", t("just_right")], ["hard", t("hard")]].map(([value, label]) => ({ value, label })),
            { selected: feedback, onSelect: value => { feedback = value; } }
          )
        ])
      ]),
      footer: [el("button", { class: "btn block", type: "button", text: t("done"), onclick: () => {
        updateDay(date, day => {
          day.workout = {
            id: workout.id,
            title: `${workout.minutes} min ${lang() === "mr" ? workout.titleMr : workout.titleEn}`,
            minutes,
            kcal,
            feedback: feedback === "just_right" ? null : feedback,
            completedAt: new Date().toISOString()
          };
        });
        closeSheet();
        toast(t("saved"));
        app.refresh();
      } })]
    });
  }
}

function formatTime(seconds) {
  const s = Math.max(0, seconds);
  return s >= 60 ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}` : String(s);
}
