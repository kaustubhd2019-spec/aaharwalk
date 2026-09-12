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
  secureEnough, acquireWakeLock, distanceKm, walkCalories, SENSITIVITY
} from "../engine/pedometer.js";
import { currentTargets } from "../engine/session.js";
import { nativeIsSource } from "../engine/native-bridge.js";
import { icon, toast, sheet, closeSheet, chipRow, metric } from "./components.js";

export function openWalkMode(app) {
  const profile = getState().profile;
  const sensitivity = getState().settings.walkSensitivity || "normal";

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
      ? (sampleCount > 0 ? t("counting") : t("waiting_for_sensor"))
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
    goalNode.replaceChildren(metric({
      name: t("todays_steps"), value: dayTotal, target: targets.steps, tone: "sky"
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
      sensitivity: getState().settings.walkSensitivity || sensitivity,
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
    updateDay(date, day => {
      day.walkedSteps = (day.walkedSteps || 0) + counted;
      if (nativeOwnsTotal()) return;
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
    sheet({
      title: t("settings_label"),
      body: el("div", { class: "stack" }, [
        el("div", { class: "field" }, [
          el("label", { text: t("step_sensitivity") }),
          chipRow(Object.entries(SENSITIVITY).map(([value, meta]) => ({ value, label: meta.label[lang()] || meta.label.en })), {
            selected: getState().settings.walkSensitivity || "normal",
            onSelect: value => update(s => { s.settings.walkSensitivity = value; })
          }),
          el("span", { class: "hint", text: t("sensitivity_hint") })
        ]),
        el("p", { class: "small muted", text: t("walk_limits") })
      ]),
      footer: [el("button", { class: "btn block", type: "button", text: t("done"), onclick: () => { closeSheet(); paint(); } })]
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
