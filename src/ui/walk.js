/* AaharWalk — Walk mode: the phone counts your steps itself.
 *
 * Honest about its limits. This counts while the screen is open; the app asks
 * for a wake lock so you can pocket the phone and keep walking, but no browser
 * can count in the background. For a whole day's total, share or paste from
 * Step Set Go / Google Fit instead.
 */

import { el, fmt, round, todayISO } from "../core/util.js";
import { t, lang } from "../core/i18n.js";
import { getState, updateDay, update, getDay } from "../core/store.js";
import {
  startCounting, motionSupported, needsMotionPermission, requestMotionPermission,
  secureEnough, acquireWakeLock, distanceKm, walkCalories,
  calibrationFrom, calibrationDrift, clampCalibration
} from "../engine/pedometer.js";
import { currentTargets } from "../engine/session.js";
import { nativeIsSource, dayStepTotal, readNativeToday } from "../engine/native-bridge.js";
import { icon, toast, sheet, closeSheet, chipRow, metricLine } from "./components.js";

export function openWalkMode(app) {
  const profile = getState().profile;

  if (!motionSupported() || !secureEnough()) {
    return explainUnavailable(app);
  }

  let counter = null;
  let wakeLock = null;
  let running = false;
  let startedAt = 0;
  let elapsedMs = 0;
  let baseSteps = 0;          // steps banked from earlier segments of this walk
  let liveSteps = 0;
  let sampleCount = 0;
  let sensorWarned = false;
  let clockTimer = null;

  const host = el("div", { class: "player walk" });
  const head = el("div", { class: "player-head" });
  const body = el("div", { class: "player-body" });
  const foot = el("div", { class: "player-foot" });

  const stepsNode = el("div", { class: "walk-count", text: "0" });
  const statusNode = el("div", { class: "player-phase" });
  const statsNode = el("div", { class: "walk-stats" });
  const goalNode = el("div", { style: "width:100%;max-width:340px;margin-top:14px" });
  const noteNode = el("p", { class: "small muted center", style: "max-width:320px" });

  head.append(
    el("button", { class: "icon-btn", type: "button", "aria-label": t("cancel"), onclick: quit }, [icon("close", 18)]),
    el("div", { class: "center grow" }, [
      el("div", { class: "tiny muted", text: t("walk_mode") }),
      el("div", { style: "font-weight:620;font-size:14px", text: t("counting_on_phone") })
    ]),
    el("button", { class: "icon-btn", type: "button", "aria-label": t("settings_label"), onclick: openSettings }, [icon("sliders", 17)])
  );

  body.append(
    statusNode,
    stepsNode,
    el("div", { class: "tiny muted", style: "letter-spacing:.1em;text-transform:uppercase", text: t("steps") }),
    statsNode,
    goalNode,
    noteNode
  );

  host.append(head, body, foot);
  document.body.append(host);
  document.body.style.overflow = "hidden";

  paint();
  document.addEventListener("visibilitychange", onVisibility);

  /* ——— rendering ——————————————————————————————————————— */

  function totalSteps() { return baseSteps + liveSteps; }

  function paint() {
    stepsNode.textContent = fmt(totalSteps());
    statusNode.textContent = running
      ? (sampleCount === 0 ? t("waiting_for_sensor")
        : counter && counter.walking ? t("walking_detected")
        : t("watching_for_walking"))
      : (startedAt || baseSteps ? t("paused_label") : t("ready_to_walk"));

    const minutes = Math.floor(totalMs() / 60000);
    const seconds = Math.floor((totalMs() % 60000) / 1000);
    statsNode.replaceChildren(
      walkStat(t("duration"), `${minutes}:${String(seconds).padStart(2, "0")}`),
      walkStat(t("distance"), `${round(distanceKm(totalSteps(), profile.heightCm), 2)} km`),
      walkStat(t("calories"), `≈ ${walkCalories(totalSteps(), profile.weightKg)}`)
    );

    const targets = currentTargets();
    const dayTotal = (getDay(todayISO()).steps || 0) + totalSteps();
    goalNode.replaceChildren(metricLine({
      name: t("todays_steps"), value: dayTotal, target: targets.steps, color: "var(--m-step)"
    }));

    noteNode.textContent = running && sampleCount === 0 && sensorWarned
      ? t("sensor_silent")
      : t("walk_note");

    foot.replaceChildren(
      el("button", { class: `btn ${running ? "subtle" : ""}`.trim(), type: "button", onclick: toggle },
        [icon(running ? "pause" : "play", 16), running ? t("pause") : (baseSteps || startedAt ? t("resume") : t("start"))]),
      (baseSteps || liveSteps || startedAt)
        ? el("button", { class: "btn ghost", type: "button", onclick: finish }, [t("finish"), icon("check", 16)])
        : null
    );
  }

  function totalMs() {
    return elapsedMs + (running && startedAt ? Date.now() - startedAt : 0);
  }

  /* ——— control ——————————————————————————————————————— */

  async function toggle() {
    if (running) return pause();

    if (needsMotionPermission()) {
      const result = await requestMotionPermission();
      if (result !== "granted") {
        toast(t("motion_denied"), 4200);
        return;
      }
    }

    counter = startCounting({
      calibration: getState().settings.walkCalibration,
      onStep: count => { liveSteps = count; stepsNode.textContent = fmt(totalSteps()); },
      onSample: n => {
        sampleCount = n;
        if (n === 1) paint();
      }
    });

    wakeLock = await acquireWakeLock();
    running = true;
    startedAt = Date.now();
    sampleCount = 0;
    sensorWarned = false;
    clockTimer = setInterval(() => {
      paint();
      if (running && sampleCount === 0 && Date.now() - startedAt > 4000 && !sensorWarned) {
        sensorWarned = true;
        paint();
      }
    }, 1000);
    paint();
  }

  function pause() {
    if (!running) return;
    running = false;
    elapsedMs += Date.now() - startedAt;
    startedAt = 0;
    baseSteps += liveSteps;
    liveSteps = 0;
    stopSensors();
    paint();
  }

  function stopSensors() {
    if (counter) { counter.stop(); counter = null; }
    clearInterval(clockTimer);
    clockTimer = null;
    if (wakeLock) { wakeLock.release().catch(() => {}); wakeLock = null; }
  }

  /* The wake lock is dropped when the page is hidden; take it back on return. */
  async function onVisibility() {
    if (document.visibilityState === "visible" && running && !wakeLock) {
      wakeLock = await acquireWakeLock();
    }
  }

  function quit() {
    const counted = totalSteps();
    pause();
    teardown();
    if (counted > 0) confirmSave(counted);
    else app.refresh();
  }

  function finish() {
    const counted = totalSteps();
    pause();
    teardown();
    if (counted <= 0) { app.refresh(); return; }
    saveSteps(counted);
    showSummary(counted);
  }

  function teardown() {
    stopSensors();
    document.removeEventListener("visibilitychange", onVisibility);
    host.remove();
    document.body.style.overflow = "";
  }

  /**
   * Inside the Android app the phone's own counter already includes this walk,
   * so adding it again would double count. There we only record that the walk
   * happened; the day's total stays owned by the hardware counter.
   */
  function nativeOwnsTotal() {
    return nativeIsSource(getState().settings);
  }

  function saveSteps(counted) {
    const date = todayISO();
    const ownedByPhone = nativeOwnsTotal();
    updateDay(date, day => {
      day.walkedSteps = (day.walkedSteps || 0) + counted;
      if (ownedByPhone) {
        // The phone's counter already includes this walk, so don't add it again —
        // but the day's total must never sit below what we actually counted.
        day.steps = dayStepTotal({
          phoneTotal: readNativeToday(),
          walked: day.walkedSteps,
          entered: day.steps
        });
        return;
      }
      day.steps = Math.max(0, (day.steps || 0) + counted);
      day.stepsSource = "walk";
    });
  }

  function confirmSave(counted) {
    sheet({
      title: t("keep_these_steps"),
      body: el("div", { class: "stack center" }, [
        el("div", { style: "font-size:32px;font-weight:720;letter-spacing:-.03em", text: fmt(counted) }),
        el("p", { class: "small muted", text: t("steps") })
      ]),
      footer: [
        el("button", { class: "btn subtle", type: "button", text: t("discard"), onclick: () => { closeSheet(); app.refresh(); } }),
        el("button", { class: "btn", type: "button", text: t("save"), onclick: () => { saveSteps(counted); closeSheet(); showSummary(counted); } })
      ]
    });
  }

  function showSummary(counted) {
    const day = getState().days[todayISO()] || { steps: counted };
    sheet({
      title: t("walk_done"),
      body: el("div", { class: "stack center" }, [
        el("div", { style: "font-size:38px" }, ["🚶"]),
        el("div", { style: "font-size:30px;font-weight:720;letter-spacing:-.03em", text: `${fmt(counted)} ${t("steps").toLowerCase()}` }),
        el("p", { class: "small muted", text: `${round(distanceKm(counted, profile.heightCm), 2)} km · ≈ ${walkCalories(counted, profile.weightKg)} kcal · ${Math.round(totalMs() / 60000)} min` }),
        el("div", { class: "divider" }),
        el("p", { class: "small", text: `${t("todays_steps")}: ${fmt(day.steps || counted)}` }),
        nativeOwnsTotal() ? el("p", { class: "tiny muted", text: t("native_already_counted") }) : null
      ]),
      footer: [el("button", { class: "btn block", type: "button", text: t("done"), onclick: () => { closeSheet(); app.refresh(); } })]
    });
  }

  function openSettings() {
    const factor = clampCalibration(getState().settings.walkCalibration);
    const drift = calibrationDrift(factor);

    sheet({
      title: t("check_counting"),
      body: el("div", { class: "stack" }, [
        el("p", { class: "small", text: t("calibrate_why") }),
        factor !== 1
          ? el("div", { class: "card flat tight" }, [
              el("p", { class: "small", style: "font-weight:600",
                text: drift > 0 ? t("calibrated_high").replace("{n}", drift)
                    : drift < 0 ? t("calibrated_low").replace("{n}", Math.abs(drift))
                    : t("calibrated_exact") })
            ])
          : null,
        el("button", { class: "btn block", type: "button",
          onclick: () => { closeSheet(); startCalibration(); } }, [icon("shoe", 17), t("calibrate_start")]),
        factor !== 1
          ? el("button", { class: "btn subtle block", type: "button", text: t("calibrate_reset"),
              onclick: () => {
                update(s => { s.settings.walkCalibration = 1; });
                closeSheet();
                toast(t("saved"));
              } })
          : null,
        el("p", { class: "small muted", text: t("walk_limits") })
      ]),
      footer: [el("button", { class: "btn subtle block", type: "button", text: t("done"), onclick: () => { closeSheet(); paint(); } })]
    });
  }

  /**
   * Walk a known number of steps and tell the app the real figure. Everything
   * counted from then on is scaled to match how this phone, in this pocket,
   * with this gait, actually behaves.
   */
  function startCalibration() {
    const TARGET = 20;
    let session = null;
    let counted = 0;

    const readout = el("div", { style: "font-size:46px;font-weight:730;letter-spacing:-.03em;line-height:1", text: "0" });
    const hint = el("p", { class: "small muted center", text: t("calibrate_walk_now").replace("{n}", TARGET) });
    const actualInput = el("input", {
      class: "input", type: "number", inputmode: "numeric", min: "1", max: "500", value: String(TARGET)
    });
    const step2 = el("div", { class: "stack", hidden: true }, [
      el("div", { class: "field" }, [
        el("label", { text: t("calibrate_how_many") }),
        actualInput
      ])
    ]);

    const startButton = el("button", { class: "btn", type: "button" }, [icon("play", 16), t("start")]);
    const doneButton = el("button", { class: "btn", type: "button", text: t("save"), hidden: true });

    startButton.addEventListener("click", async () => {
      if (session) return;
      if (needsMotionPermission()) {
        const result = await requestMotionPermission();
        if (result !== "granted") { toast(t("motion_denied"), 4000); return; }
      }
      // Count raw here: we are measuring the phone, not applying an old guess.
      session = startCounting({ calibration: 1, onStep: n => { counted = n; readout.textContent = String(n); } });
      startButton.hidden = true;
      doneButton.hidden = false;
      hint.textContent = t("calibrate_counting").replace("{n}", TARGET);
    });

    doneButton.addEventListener("click", () => {
      if (session) { session.stop(); session = null; }
      if (!step2.hidden) {
        const actual = Math.round(Number(actualInput.value) || 0);
        if (!(actual > 0)) { toast(t("calibrate_need_number")); return; }
        const next = calibrationFrom(counted, actual);
        update(s => { s.settings.walkCalibration = next; });
        const drift = calibrationDrift(next);
        closeSheet();
        toast(drift === 0 ? t("calibrated_exact")
            : drift > 0 ? t("calibrated_high").replace("{n}", drift)
            : t("calibrated_low").replace("{n}", Math.abs(drift)), 5000);
        return;
      }
      if (counted < 3) { toast(t("calibrate_too_few"), 4000); return; }
      step2.hidden = false;
      hint.textContent = t("calibrate_confirm").replace("{n}", counted);
      doneButton.textContent = t("save");
    });

    sheet({
      title: t("check_counting"),
      onClose: () => { if (session) { session.stop(); session = null; } },
      body: el("div", { class: "stack center" }, [
        el("p", { class: "small", text: t("calibrate_how") }),
        readout,
        el("div", { class: "tiny muted", style: "letter-spacing:.1em;text-transform:uppercase", text: t("steps") }),
        hint,
        step2
      ]),
      footer: [startButton, doneButton]
    });
  }

}

function walkStat(label, value) {
  return el("div", { class: "walk-stat" }, [
    el("span", { class: "k", text: label }),
    el("span", { class: "v", text: value })
  ]);
}

/** Sensors need HTTPS and a device that actually has an accelerometer. */
function explainUnavailable(app) {
  const reason = !secureEnough() ? t("walk_needs_https") : t("walk_no_sensor");
  sheet({
    title: t("walk_mode"),
    body: el("div", { class: "stack" }, [
      el("p", { class: "small", text: reason }),
      el("p", { class: "small muted", text: t("walk_alternative") })
    ]),
    footer: [
      el("button", { class: "btn subtle", type: "button", text: t("cancel"), onclick: () => closeSheet() }),
      el("button", { class: "btn", type: "button", text: t("log_steps"), onclick: () => { closeSheet(); app.openSteps(); } })
    ]
  });
}
