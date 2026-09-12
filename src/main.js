/* AaharWalk — app shell: routing, screen rendering and shared actions. */

import { el, todayISO, minutesNow } from "./core/util.js";
import { t, lang, setLang } from "./core/i18n.js";
import { getState, subscribe, getDay, updateDay, update } from "./core/store.js";
import { refreshFoodIndex, currentTargets } from "./engine/session.js";
import { renderOnboarding } from "./ui/onboarding.js";
import { renderHome } from "./ui/home.js";
import { renderFood, openFoodLogSheet } from "./ui/food.js";
import { renderActivity, openWaterSheet, openStepsSheet, openWeightSheet } from "./ui/activity.js";
import { renderPlan } from "./ui/plan.js";
import { renderProfile } from "./ui/profile.js";
import { openWorkoutPlayer } from "./ui/workout.js";
import { openWalkMode } from "./ui/walk.js";
import { loadDemoData } from "./data/demo.js";
import { sharedStepText, parseSteps, clearSharedParams } from "./engine/steps-import.js";
import { hasNativeCounter, nativePermitted, readNativeToday, onNativeSteps } from "./engine/native-bridge.js";
import { icon, closeSheet, toast } from "./ui/components.js";

const ROUTES = {
  home: { render: renderHome, icon: "home", label: "nav_home" },
  food: { render: renderFood, icon: "food", label: "nav_food" },
  activity: { render: renderActivity, icon: "activity", label: "nav_activity" },
  plan: { render: renderPlan, icon: "plan", label: "nav_plan" },
  profile: { render: renderProfile, icon: "profile", label: "nav_profile" }
};

const root = document.getElementById("app");
let route = (location.hash || "#home").slice(1);
if (!ROUTES[route]) route = "home";

export const app = {
  date: todayISO(),
  go(next) {
    route = ROUTES[next] ? next : "home";
    history.replaceState(null, "", `#${route}`);
    render();
    window.scrollTo(0, 0);
  },
  refresh() { render(); },
  refreshQuiet() { /* state already persisted; screens repaint on next render */ },
  openFoodLog(options) { openFoodLogSheet(app, options); },
  openWater() { openWaterSheet(app); },
  openSteps(options) { openStepsSheet(app, options); },
  openWeight() { openWeightSheet(app); },
  openWorkout() { openWorkoutPlayer(app); },
  openWalk() { openWalkMode(app); }
};

function render() {
  refreshFoodIndex();
  const state = getState();
  document.documentElement.lang = lang() === "mr" ? "mr" : "en";
  root.replaceChildren();

  if (!state.profile) {
    document.body.classList.add("onboarding");
    renderOnboarding(root, app);
    return;
  }
  document.body.classList.remove("onboarding");

  const screen = el("main", { class: "screen" });
  root.append(screen);
  (ROUTES[route] || ROUTES.home).render(screen, app);
  root.append(navBar());
}

function navBar() {
  const nav = el("nav", { class: "nav", "aria-label": "Sections" });
  const inner = el("div", { class: "nav-inner" });
  for (const [key, meta] of Object.entries(ROUTES)) {
    inner.append(el("button", {
      type: "button",
      "aria-current": key === route ? "page" : null,
      onclick: () => app.go(key)
    }, [icon(meta.icon, 21, key === route ? 2 : 1.7), el("span", { text: t(meta.label) })]));
  }
  nav.append(inner);
  return nav;
}

/* ——— water reminders while the app is open ——————————————————— */

function startWaterReminders() {
  let lastNudge = 0;
  setInterval(() => {
    const state = getState();
    if (!state.profile || !state.settings.reminders.water) return;
    const { wakeTime, sleepTime, everyMinutes } = state.settings.reminders;
    const now = minutesNow();
    const wake = toMinutes(wakeTime), sleep = toMinutes(sleepTime);
    if (now < wake || now > sleep) return;
    if (Date.now() - lastNudge < everyMinutes * 60000) return;

    const targets = currentTargets();
    const day = getDay(todayISO());
    const elapsed = Math.max(0, now - wake) / Math.max(1, sleep - wake);
    const expected = targets.waterMl * Math.min(1, elapsed);
    if ((day.waterMl || 0) >= expected - 200) return;

    lastNudge = Date.now();
    const message = lang() === "mr" ? "थोडं पाणी प्या 💧" : "Time for a glass of water 💧";
    toast(message, 4000);
    if ("Notification" in window && Notification.permission === "granted") {
      try { new Notification("AaharWalk", { body: message, icon: "assets/icon-192.png", tag: "aaharwalk-water" }); } catch (err) { /* ignore */ }
    }
  }, 60000);
}

function toMinutes(hhmm) {
  const [h, m] = String(hhmm || "07:00").split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

/* ——— boot ——————————————————————————————————————————————— */

window.addEventListener("hashchange", () => {
  const next = location.hash.slice(1);
  if (ROUTES[next] && next !== route) { route = next; render(); }
});

// Roll over to the new day if the app is left open overnight.
setInterval(() => {
  const today = todayISO();
  if (app.date !== today) { app.date = today; render(); }
}, 60000);

subscribe(() => { /* screens re-render explicitly via app.refresh() */ });

if (new URLSearchParams(location.search).get("demo") === "1" && !getState().profile) {
  loadDemoData();
}

window.__AW_BOOTED = true;
render();
startWaterReminders();

/* Inside the Android app the phone counts steps all day on its own. Adopt that
   as the source of truth and keep today's total in step with it. */
function startNativeStepSync() {
  if (!hasNativeCounter()) return;

  const applyTotal = value => {
    if (!Number.isFinite(value) || value < 0) return;
    const state = getState();
    if (!state.profile) return;
    if (state.settings.stepSource !== "phone_native") return;
    const date = todayISO();
    if ((getDay(date).steps || 0) === value) return;
    updateDay(date, day => {
      day.steps = value;
      day.stepsSource = "phone_native";
    });
    render();
  };

  // First run inside the APK, with permission already granted: take it over.
  if (nativePermitted() && getState().settings.stepSource === "manual") {
    update(s => { s.settings.stepSource = "phone_native"; });
  }

  onNativeSteps(applyTotal);
  applyTotal(readNativeToday());
  setInterval(() => applyTotal(readNativeToday()), 60000);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") applyTotal(readNativeToday());
  });
}

startNativeStepSync();

/* Arrived via the Android share sheet (Step Set Go, Google Fit, …)? */
(function handleSharedSteps() {
  const shared = sharedStepText();
  if (!shared) return;
  clearSharedParams();
  if (!getState().profile) return;
  const found = parseSteps(shared);
  setTimeout(() => openStepsSheet(app, { prefill: found ? found.steps : null, sharedText: shared }), 350);
})();
