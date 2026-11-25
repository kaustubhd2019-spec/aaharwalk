// RepRise: main controller (views, alarm scheduling, ringing session).
import * as store from "./store.js";
import { nextAlarm, dueAlarms, describeDays, formatTime, formatCountdown, streakDays, DAY_LETTERS, DAY_NAMES } from "./schedule.js";
import { CHALLENGES, createCounter, describeChallenge, doneText } from "./counters.js";
import { BUILTIN_SOUNDS, unlockAudio, audioRunning, loadSound, AlarmPlayer, togglePreview, stopPreview, ding, successJingle, decodeBlob, forgetSound } from "./sound.js";
import { loadPose, poseReady, startCamera, stopCamera, checkCamera, cameraErrorText, Tracker } from "./pose.js";
import { keepAwake, wakeActive, onWakeChange } from "./wake.js";

const $ = id => document.getElementById(id);
const el = (tag, props = {}, ...kids) => {
  const n = Object.assign(document.createElement(tag), props);
  for (const k of kids) if (k != null) n.append(k);
  return n;
};

const state = {
  alarms: store.loadAlarms(),
  settings: store.loadSettings(),
  history: store.loadHistory(),
  view: "home",
  night: false,
  draft: null,
  draftIsNew: false,
  session: null,
  customSounds: [],
  nightChecks: {},
};

// ---------------- helpers ----------------

function show(view) {
  for (const v of document.querySelectorAll(".view")) v.hidden = v.id !== `view-${view}`;
  if (view === "night" || view === "ring") $("toast").hidden = true;
  state.view = view;
  window.scrollTo(0, 0);
}

let toastTimer = null;
function toast(msg, ms = 2800) {
  const t = $("toast");
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.hidden = true; }, ms);
}

const fmt = (h, m) => formatTime(h, m, state.settings.use24h);
function timeParts(h, m) {
  const s = fmt(h, m);
  const [main, suffix = ""] = s.split(" ");
  return { main, suffix };
}
function nowClock() {
  const d = new Date();
  return fmt(d.getHours(), d.getMinutes());
}
function dayLabel(at) {
  const now = new Date();
  const d0 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const d1 = new Date(at.getFullYear(), at.getMonth(), at.getDate());
  const diff = Math.round((d1 - d0) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  return DAY_NAMES[at.getDay()];
}
function fmtDuration(secs) {
  if (secs < 60) return `${secs} s`;
  const m = Math.floor(secs / 60), s = secs % 60;
  return s ? `${m} min ${s} s` : `${m} min`;
}
function soundName(id) {
  return BUILTIN_SOUNDS.find(s => s.id === id)?.name || state.customSounds.find(s => s.id === id)?.name || "Classic beeps";
}
function saveAlarms() { store.saveAlarms(state.alarms); }
function exitFullscreen() {
  if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
}
function requestFullscreen() {
  try {
    const p = document.documentElement.requestFullscreen?.({ navigationUI: "hide" });
    p?.catch?.(() => {});
  } catch { /* unsupported (iPhone) */ }
}
const withTimeout = (p, ms) => Promise.race([p, new Promise(r => setTimeout(r, ms))]);

// ---------------- home ----------------

function renderHome() {
  renderHero();
  const real = state.history.filter(h => !h.practice);
  $("stat-streak").textContent = streakDays(state.history, new Date());
  $("stat-total").textContent = real.length;
  $("stat-reps").textContent = real.reduce((s, h) => s + (h.target || 0), 0);

  const list = $("alarm-list");
  list.replaceChildren();
  const sorted = [...state.alarms].sort((a, b) => a.hour * 60 + a.minute - (b.hour * 60 + b.minute));
  for (const a of sorted) {
    const { main, suffix } = timeParts(a.hour, a.minute);
    const c = CHALLENGES[a.challenge];
    const meta = describeDays(a.days) + (a.label ? ` · ${a.label}` : "");
    const btn = el("button", { type: "button", className: "alarm-main", ariaLabel: `Edit ${main} ${suffix} alarm` },
      el("div", { className: "alarm-time" }, main, suffix ? el("small", { textContent: suffix }) : null),
      el("div", { className: "alarm-meta", textContent: meta }),
      el("div", { className: "chip-challenge", textContent: `${c.emoji} ${describeChallenge(a.challenge, a.target)}` }),
    );
    btn.addEventListener("click", () => openEditor(a));
    const toggle = el("input", { type: "checkbox", className: "switch", checked: a.enabled, ariaLabel: `Turn ${main} ${suffix} alarm on or off` });
    toggle.addEventListener("change", () => {
      a.enabled = toggle.checked;
      saveAlarms();
      renderHome();
      if (a.enabled) announceNext(a);
    });
    list.append(el("li", { className: `alarm${a.enabled ? "" : " off"}` }, btn, toggle));
  }
  $("empty-alarms").hidden = state.alarms.length > 0;
}

function renderHero() {
  const now = new Date();
  const next = nextAlarm(state.alarms, now);
  if (next) {
    $("next-time").textContent = fmt(next.alarm.hour, next.alarm.minute);
    $("next-sub").textContent = `${dayLabel(next.at)} · in ${formatCountdown(next.at - now)} · ${describeChallenge(next.alarm.challenge, next.alarm.target)}`;
  } else {
    $("next-time").textContent = "No alarm";
    $("next-sub").textContent = state.alarms.length ? "All alarms are off" : "Add an alarm below to get started";
  }
  $("btn-night").disabled = !next;
}

function announceNext(alarm) {
  const n = nextAlarm([alarm], new Date());
  if (n) toast(`Alarm set for ${dayLabel(n.at).toLowerCase()} ${fmt(alarm.hour, alarm.minute)}, in ${formatCountdown(n.at - new Date())}`);
}

function renderPracticeGrid() {
  const grid = $("practice-grid");
  grid.replaceChildren();
  for (const [type, c] of Object.entries(CHALLENGES)) {
    const b = el("button", { type: "button", className: "practice-btn" },
      el("span", { textContent: c.emoji, ariaHidden: "true" }), el("span", { textContent: c.label }));
    b.addEventListener("click", () => {
      unlockAudio();
      const target = type === "dance" ? 10 : 5;
      startRing({ id: "practice", label: "", challenge: type, target, sound: "classic", vibrate: false, days: [] }, { practice: true, returnTo: "home" });
    });
    grid.append(b);
  }
}

// ---------------- editor ----------------

function newAlarm() {
  return { id: store.uid(), hour: 6, minute: 30, days: [0, 1, 2, 3, 4, 5, 6], label: "", enabled: true, challenge: "squats", target: 10, sound: "classic", vibrate: true };
}

function openEditor(alarm) {
  state.draftIsNew = !alarm;
  state.draft = alarm ? structuredClone(alarm) : newAlarm();
  const d = state.draft;
  $("edit-title").textContent = alarm ? "Edit alarm" : "New alarm";
  $("f-time").value = `${String(d.hour).padStart(2, "0")}:${String(d.minute).padStart(2, "0")}`;
  $("f-label").value = d.label || "";
  $("f-vibrate").checked = d.vibrate !== false;
  $("edit-delete").hidden = !alarm;
  renderDays();
  renderChallenges();
  renderAmounts();
  renderSoundSelect();
  show("edit");
}

function renderDays() {
  const wrap = $("f-days");
  wrap.replaceChildren();
  // Start the week on Monday.
  for (const i of [1, 2, 3, 4, 5, 6, 0]) {
    const b = el("button", { type: "button", className: "day", textContent: DAY_LETTERS[i], ariaLabel: DAY_NAMES[i] });
    b.setAttribute("aria-pressed", String(state.draft.days.includes(i)));
    b.addEventListener("click", () => {
      const days = new Set(state.draft.days);
      days.has(i) ? days.delete(i) : days.add(i);
      state.draft.days = [...days].sort();
      renderDays();
    });
    wrap.append(b);
  }
}

function renderChallenges() {
  const wrap = $("f-challenge");
  wrap.replaceChildren();
  const desc = { squats: "Legs & glutes", pushups: "Phone on the floor, side-on", jacks: "Arms overhead and back", dance: "Keep moving to fill the timer" };
  for (const [type, c] of Object.entries(CHALLENGES)) {
    const b = el("button", { type: "button", className: "challenge" },
      el("span", { className: "c-emoji", textContent: c.emoji, ariaHidden: "true" }),
      el("span", { className: "c-name", textContent: c.label }),
      el("span", { className: "c-desc", textContent: desc[type] }));
    b.setAttribute("role", "radio");
    b.setAttribute("aria-checked", String(state.draft.challenge === type));
    b.addEventListener("click", () => {
      if (state.draft.challenge === type) return;
      state.draft.challenge = type;
      const counts = CHALLENGES[type].counts;
      if (!counts.includes(state.draft.target)) state.draft.target = counts[1];
      state.draft.customAmount = false;
      renderChallenges();
      renderAmounts();
    });
    wrap.append(b);
  }
}

function renderAmounts() {
  const d = state.draft;
  const c = CHALLENGES[d.challenge];
  const isDance = d.challenge === "dance";
  $("f-amount-label").textContent = isDance ? "For how many seconds?" : `How many ${c.verb}?`;
  const wrap = $("f-amount");
  wrap.replaceChildren();
  const custom = d.customAmount || !c.counts.includes(d.target);
  const mk = (label, checked, onClick) => {
    const b = el("button", { type: "button", className: "chip", textContent: label });
    b.setAttribute("role", "radio");
    b.setAttribute("aria-checked", String(checked));
    b.addEventListener("click", onClick);
    wrap.append(b);
  };
  for (const n of c.counts) {
    mk(isDance ? `${n} s` : String(n), !custom && d.target === n, () => { d.target = n; d.customAmount = false; renderAmounts(); });
  }
  mk("Custom", custom, () => { d.customAmount = true; renderAmounts(); $("f-custom").focus(); });
  $("f-custom-wrap").hidden = !custom;
  $("f-custom").max = isDance ? 300 : 200;
  $("f-custom-unit").textContent = isDance ? "seconds" : c.verb;
  if (custom) $("f-custom").value = d.target;
}

function renderSoundSelect() {
  const sel = $("f-sound");
  sel.replaceChildren();
  const g1 = el("optgroup", { label: "Built-in" });
  for (const s of BUILTIN_SOUNDS) g1.append(el("option", { value: s.id, textContent: s.name }));
  sel.append(g1);
  if (state.customSounds.length) {
    const g2 = el("optgroup", { label: "My sounds" });
    for (const s of state.customSounds) g2.append(el("option", { value: s.id, textContent: s.name }));
    sel.append(g2);
  }
  const known = [...sel.options].some(o => o.value === state.draft.sound);
  sel.value = known ? state.draft.sound : "classic";
}

/** Reads the form into the draft. Returns an error message or null. */
function readForm() {
  const d = state.draft;
  const t = $("f-time").value;
  if (!/^\d{2}:\d{2}/.test(t)) return "Pick a time";
  d.hour = Number(t.slice(0, 2));
  d.minute = Number(t.slice(3, 5));
  d.label = $("f-label").value.trim();
  d.vibrate = $("f-vibrate").checked;
  d.sound = $("f-sound").value || "classic";
  if (d.customAmount || !CHALLENGES[d.challenge].counts.includes(d.target)) {
    const n = Math.round(Number($("f-custom").value));
    const max = d.challenge === "dance" ? 300 : 200;
    if (!(n >= 1 && n <= max)) return `Enter an amount between 1 and ${max}`;
    d.target = n;
  }
  return null;
}

function saveDraft() {
  const err = readForm();
  if (err) return toast(err);
  stopPreview();
  const d = { ...state.draft, enabled: true };
  delete d.customAmount;
  const i = state.alarms.findIndex(a => a.id === d.id);
  if (i >= 0) state.alarms[i] = d; else state.alarms.push(d);
  saveAlarms();
  show("home");
  renderHome();
  announceNext(d);
}

async function onUpload(file) {
  if (!file) return;
  if (file.size > 25 * 1024 * 1024) return toast("That file is too big (max 25 MB)");
  try {
    await unlockAudio();
    await decodeBlob(file); // make sure this browser can actually play it
  } catch {
    return toast("Couldn't read that audio file. Try an MP3 or M4A.");
  }
  const id = `custom:${store.uid()}`;
  const name = file.name.replace(/\.[^.]+$/, "").slice(0, 40) || "My sound";
  try {
    await store.putSound({ id, name, blob: file, size: file.size });
  } catch {
    return toast("Couldn't save the sound (storage full?)");
  }
  state.customSounds = await store.listSounds();
  state.draft.sound = id;
  renderSoundSelect();
  toast(`Added "${name}"`);
}

// ---------------- settings ----------------

const STRICT_HELP = {
  easy: "Shallower reps count and the anti-cheat checks are off. Use this if the camera has trouble with your room.",
  normal: "Proper reps. Exercise done lying in bed doesn't count.",
  strict: "Full-depth reps only. Hard mode.",
};

function renderSettings() {
  const s = state.settings;
  for (const [id, key] of [["s-strictness", "strictness"], ["s-camera", "camera"]]) {
    for (const b of $(id).querySelectorAll("button")) {
      b.setAttribute("role", "radio");
      b.setAttribute("aria-checked", String(b.dataset.v === s[key]));
    }
  }
  $("s-strictness-help").textContent = STRICT_HELP[s.strictness];
  $("s-ramp").checked = s.ramp;
  $("s-duck").checked = s.duck;
  $("s-skeleton").checked = s.skeleton;
  $("s-24h").checked = s.use24h;

  const sl = $("s-sounds");
  sl.replaceChildren();
  if (!state.customSounds.length) sl.append(el("li", { className: "empty-li", textContent: "No uploaded sounds. Add one when editing an alarm." }));
  for (const snd of state.customSounds) {
    const del = el("button", { type: "button", className: "btn small danger", textContent: "Delete" });
    del.addEventListener("click", async () => {
      if (!confirm(`Delete "${snd.name}"?`)) return;
      await store.deleteSound(snd.id);
      forgetSound(snd.id);
      for (const a of state.alarms) if (a.sound === snd.id) a.sound = "classic";
      saveAlarms();
      state.customSounds = await store.listSounds();
      renderSettings();
    });
    sl.append(el("li", {}, el("span", { textContent: `🎵 ${snd.name}` }), del));
  }

  const hl = $("s-history");
  hl.replaceChildren();
  const recent = state.history.filter(h => !h.practice).slice(-14).reverse();
  if (!recent.length) hl.append(el("li", { className: "empty-li", textContent: "Nothing yet. Your first morning is coming!" }));
  for (const h of recent) {
    const d = new Date(h.ts);
    const when = `${DAY_NAMES[d.getDay()]} ${d.getDate()}/${d.getMonth() + 1} · ${fmt(d.getHours(), d.getMinutes())}`;
    const what = h.fallback ? "Backup maths challenge" : `${doneText(h.challenge, h.target)} in ${fmtDuration(h.secs)}`;
    hl.append(el("li", {}, el("span", { textContent: when }), el("span", { className: "muted", textContent: what })));
  }
}

function setSetting(key, value) {
  state.settings[key] = value;
  store.saveSettings(state.settings);
  renderSettings();
}

// ---------------- night mode ----------------

let dimTimer = null;
let shiftTimer = null;

async function enterNight() {
  const next = nextAlarm(state.alarms, new Date());
  if (!next) return toast("Add an alarm first");
  // All three need the tap's user activation, so start them together.
  const pAudio = unlockAudio();
  const pWake = keepAwake(true);
  requestFullscreen();
  state.night = true;
  state.nightChecks = { audio: null, wake: null, camera: null, pose: poseReady() ? true : null, charging: null };
  show("night");
  renderNight();
  wakeNightScreen();
  shiftTimer = setInterval(shiftClock, 60000);

  // Don't let a slow/pending unlock (seen on some iPhones) block the warm-up below.
  state.nightChecks.audio = (await withTimeout(pAudio, 1500)) ?? audioRunning();
  state.nightChecks.wake = (await withTimeout(pWake, 1500)) ?? wakeActive();
  renderNight();
  // Warm everything up now so the alarm starts instantly in the morning.
  for (const a of state.alarms.filter(x => x.enabled)) loadSound(a.sound).catch(() => {});
  loadPose().then(() => { state.nightChecks.pose = true; }, () => { state.nightChecks.pose = false; }).finally(renderNight);
  checkCamera(state.settings.camera)
    .then(() => { state.nightChecks.camera = true; }, e => { state.nightChecks.camera = cameraErrorText(e); })
    .finally(renderNight);
  try {
    const bat = await navigator.getBattery?.();
    if (bat) {
      const upd = () => { state.nightChecks.charging = bat.charging; renderNight(); };
      bat.addEventListener("chargingchange", upd);
      upd();
    }
  } catch { /* no battery API (iPhone) */ }
}

function exitNight() {
  state.night = false;
  clearTimeout(dimTimer);
  clearInterval(shiftTimer);
  keepAwake(false);
  exitFullscreen();
  show("home");
  renderHome();
}

function renderNight() {
  if (state.view !== "night") return;
  const now = new Date();
  const { main, suffix } = timeParts(now.getHours(), now.getMinutes());
  $("night-clock").replaceChildren(main, suffix ? el("span", { className: "night-suffix", textContent: suffix }) : "");
  $("night-date").textContent = now.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });
  const next = nextAlarm(state.alarms, now);
  $("night-next").textContent = next
    ? `⏰ ${fmt(next.alarm.hour, next.alarm.minute)} · ${describeChallenge(next.alarm.challenge, next.alarm.target)} · in ${formatCountdown(next.at - now)}`
    : "No alarm set";
  const c = state.nightChecks;
  const items = [];
  const add = (ok, good, bad) => items.push(el("li", { className: ok === true ? "ok" : ok === null ? "" : "bad", textContent: ok === true ? good : ok === null ? `${good}…` : bad }));
  add(c.wake ?? (wakeActive() || null), "Screen stays on", "Screen may turn off. Set Auto-Lock/Screen timeout to the longest option");
  add(c.audio ?? null, "Alarm sound ready", "Tap the screen once to enable sound");
  add(c.pose, "Exercise detector loaded", "Exercise detector failed to load. Check your connection and reload");
  add(c.camera === true ? true : c.camera == null ? null : false, "Camera ready", typeof c.camera === "string" ? c.camera : "Camera not available");
  if (c.charging != null) add(c.charging, "Charging", "Plug in your charger");
  $("night-checks").replaceChildren(...items);
}

function wakeNightScreen() {
  $("view-night").classList.remove("dim");
  clearTimeout(dimTimer);
  dimTimer = setTimeout(() => $("view-night").classList.add("dim"), 10000);
}

function shiftClock() {
  // Nudge the clock a little each minute to avoid screen burn-in.
  const x = Math.round((Math.random() - 0.5) * 30);
  const y = Math.round((Math.random() - 0.5) * 40);
  $("night-inner").style.transform = `translate(${x}px, ${y}px)`;
}

// ---------------- ringing session ----------------

function ringingRecord(s) {
  return { alarm: s.alarm, startedAt: s.startedAt, progress: s.counter.type === "dance" ? s.counter.activeMs : s.counter.count };
}

function startRing(alarm, opts = {}) {
  const { practice = false, test = false, resumed = null } = opts;
  if (state.session) endSession(state.session);
  stopPreview();
  const s = {
    alarm,
    practice,
    test,
    real: !practice && !test,
    counter: createCounter(alarm.challenge, alarm.target, state.settings.strictness),
    startedAt: resumed?.startedAt || Date.now(),
    lastBodyAt: -1e9,
    ducked: false,
    done: false,
    returnTo: opts.returnTo || "home",
    ui: {},
  };
  if (resumed?.progress) {
    if (s.counter.type === "dance") {
      s.counter.activeMs = Math.min(resumed.progress, s.counter.target * 1000 - 1000);
      s.counter.count = Math.floor(s.counter.activeMs / 1000);
    }
    else s.counter.count = Math.min(resumed.progress, s.counter.target - 1);
  }
  state.session = s;
  if (s.real) {
    store.setRinging(ringingRecord(s));
    history.pushState({ ring: 1 }, "");
  }

  const c = CHALLENGES[alarm.challenge];
  $("ring-label").textContent = practice ? `Practice: ${c.label}` : test ? "Test alarm" : alarm.label || "Time to get up!";
  $("ring-clock").textContent = nowClock();
  $("count-target").textContent = s.counter.target;
  $("count-unit").textContent = alarm.challenge === "dance" ? "seconds" : c.verb;
  $("ring-note").textContent = practice
    ? "Practice mode: no alarm sound. Find a spot where the camera sees your whole body."
    : `The alarm stops when you finish.${state.settings.duck ? " It gets quieter while you move." : ""}`;
  $("btn-ring-quit").hidden = s.real;
  $("btn-ring-quit").textContent = practice ? "Quit practice" : "Stop test";
  $("fallback").hidden = true;
  $("tap-overlay").hidden = true;
  $("coach").textContent = practice ? "Get ready…" : "Wake up! 🌅";
  $("coach").className = "coach";
  $("stage-msg").textContent = "";
  renderCounter(s, null);
  show("ring");
  keepAwake(true);

  if (!practice) startAlarmSound(s);
  startVision(s);
}

async function startAlarmSound(s) {
  // If sound isn't unlocked yet (e.g. the app was reopened while ringing), ask for a
  // tap straight away; it's hidden again below if the browser lets us play anyway.
  if (!audioRunning()) $("tap-overlay").hidden = false;
  let buf;
  try { buf = await loadSound(s.alarm.sound); } catch { buf = await loadSound("classic"); }
  if (state.session !== s || s.done) return;
  s.player = new AlarmPlayer(buf, { ramp: state.settings.ramp });
  if (!audioRunning()) await withTimeout(unlockAudio(), 700).catch(() => {});
  if (state.session !== s || s.done) return;
  if (audioRunning()) {
    if (!s.player.playing) s.player.start();
    $("tap-overlay").hidden = true;
  } else {
    $("tap-overlay").hidden = false; // browser needs a tap before it may play sound
  }
  if (s.alarm.vibrate && navigator.vibrate) {
    const v = () => navigator.vibrate([800, 400, 800]);
    v();
    s.vib = setInterval(v, 2400);
  }
}

async function startVision(s) {
  const video = $("cam");
  const msg = $("stage-msg");
  $("stage").classList.toggle("mirror", state.settings.camera === "user");
  msg.textContent = "Starting camera…";
  let stage = "camera";
  try {
    const poseP = loadPose();
    poseP.catch(() => {}); // handled below
    s.stream = await startCamera(video, state.settings.camera);
    if (state.session !== s) return stopCamera(s.stream);
    stage = "pose";
    if (!poseReady()) msg.textContent = "Loading exercise detector…";
    await poseP;
    if (state.session !== s) return;
    msg.textContent = "Step back so your whole body is in view";
    s.tracker = new Tracker({
      video,
      canvas: $("overlay"),
      challenge: s.alarm.challenge,
      showSkeleton: state.settings.skeleton,
      onFrame: (lm, ts, aspect) => onPoseFrame(s, lm, ts, aspect),
    });
    s.tracker.start();
  } catch (e) {
    console.error(e);
    if (state.session !== s) return;
    showFallback(s, stage === "camera" ? cameraErrorText(e) : "The exercise detector couldn't load. Check your internet connection once, then it works offline.");
  }
}

function onPoseFrame(s, lm, ts, aspect) {
  if (s.done || state.session !== s) return;
  let st;
  if (lm) st = s.counter.update(lm, ts, aspect);
  else st = { count: s.counter.count, target: s.counter.target, progress: s.counter.progress, visible: false, tone: "warn", message: "I can't see you. Step into the frame", rep: false };
  if (st.visible) s.lastBodyAt = ts;

  if (s.player && state.settings.duck) {
    const active = ts - s.lastBodyAt < 2500;
    if (active !== s.ducked) {
      s.ducked = active;
      s.player.duck(active ? 0.3 : 1);
    }
  }
  renderCounter(s, st);
  if (st.rep) {
    ding(s.counter.done);
    const n = $("count-now");
    n.classList.remove("bump"); void n.offsetWidth; n.classList.add("bump");
    const f = $("rep-flash");
    f.classList.remove("on"); void f.offsetWidth; f.classList.add("on");
    if (s.real) store.setRinging(ringingRecord(s));
  }
  if (s.counter.done) finishRing(s);
}

function renderCounter(s, st) {
  const u = s.ui;
  const count = s.counter.count;
  if (u.count !== count) { $("count-now").textContent = count; u.count = count; }
  const pct = Math.round(s.counter.progress * 1000) / 10;
  if (u.pct !== pct) { $("progress-bar").style.width = `${pct}%`; u.pct = pct; }
  if (!st) return;
  const stageMsg = st.visible ? "" : st.message;
  if (u.stageMsg !== stageMsg) { $("stage-msg").textContent = stageMsg; u.stageMsg = stageMsg; }
  const coach = st.visible ? st.message : "Waiting for you…";
  const tone = st.visible ? st.tone : "warn";
  if (u.coach !== coach || u.tone !== tone) {
    const c = $("coach");
    c.textContent = coach;
    c.className = `coach ${tone}`;
    u.coach = coach; u.tone = tone;
  }
}

function teardown(s) {
  s.player?.stop();
  clearInterval(s.vib);
  try { navigator.vibrate?.(0); } catch { /* ignore */ }
  s.tracker?.stop();
  stopCamera(s.stream, $("cam"));
  clearInterval(s.mathTimer);
}

function endSession(s) {
  teardown(s);
  if (state.session === s) state.session = null;
}

function finishRing(s, { fallback = false } = {}) {
  if (s.done) return;
  s.done = true;
  const secs = Math.max(1, Math.round((Date.now() - s.startedAt) / 1000));
  endSession(s);
  if (s.real) {
    store.setRinging(null);
    state.history = store.addHistory({ ts: Date.now(), alarmId: s.alarm.id, challenge: s.alarm.challenge, target: s.alarm.target, secs, fallback });
    const a = state.alarms.find(x => x.id === s.alarm.id);
    if (a && (!a.days || a.days.length === 0)) { a.enabled = false; saveAlarms(); }
    // A real alarm ends the night.
    state.night = false;
    clearInterval(shiftTimer);
    keepAwake(false);
    exitFullscreen();
  } else {
    keepAwake(state.night);
  }
  successJingle();

  const what = doneText(s.alarm.challenge, s.alarm.target);
  $("done-title").textContent = s.real ? greeting() : s.practice ? "Nice work!" : "Test passed!";
  $("done-detail").textContent = fallback ? "You solved the backup challenge." : `You did ${what} in ${fmtDuration(secs)}.`;
  const streak = streakDays(state.history, new Date());
  $("done-streak").textContent = s.real && streak > 0 ? `🔥 ${streak}-day streak` : s.practice ? "You're ready for tomorrow morning." : "";
  $("btn-done").textContent = s.returnTo === "edit" ? "Back to alarm" : "Back to alarms";
  $("btn-done").onclick = () => {
    if (s.returnTo === "edit" && state.draft) show("edit");
    else { show("home"); renderHome(); }
  };
  show("done");
}

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning!" : h < 17 ? "Good afternoon!" : "Good evening!";
}

function quitSession() {
  const s = state.session;
  if (!s || s.real) return;
  endSession(s);
  keepAwake(state.night);
  if (s.returnTo === "edit" && state.draft) show("edit");
  else { show("home"); renderHome(); }
}

// Backup challenge when the camera can't be used.
function showFallback(s, reason) {
  $("stage-msg").textContent = "Camera unavailable";
  $("coach").textContent = s.practice ? "Practice needs the camera" : "Backup challenge below 👇";
  $("coach").className = "coach warn";
  $("fallback").hidden = false;
  $("fallback-reason").textContent = reason;
  const showMath = !s.practice;
  $("math-q").hidden = $("math-a").parentElement.hidden = $("math-progress").hidden = !showMath;
  $("fallback").querySelector(".small-text").hidden = !showMath;
  if (showMath) newMathRound(s);
  setTimeout(() => $("fallback").scrollIntoView({ behavior: "smooth", block: "center" }), 100);
}

function newMathRound(s) {
  s.math = { solved: 0, need: 3 };
  nextMathProblem(s);
}
function nextMathProblem(s) {
  const r = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const kind = r(0, 1);
  let q, ans;
  if (kind === 0) { const a = r(13, 29), b = r(3, 9); q = `${a} × ${b}`; ans = a * b; }
  else { const a = r(120, 899), b = r(23, 99); q = `${a} + ${b}`; ans = a + b; }
  s.math.ans = ans;
  $("math-q").textContent = `${q} = ?`;
  $("math-a").value = "";
  $("math-progress").textContent = `${s.math.solved} of ${s.math.need} solved`;
}
function checkMath() {
  const s = state.session;
  if (!s?.math) return;
  if (Number($("math-a").value) === s.math.ans) {
    s.math.solved++;
    if (s.math.solved >= s.math.need) return finishRing(s, { fallback: true });
    nextMathProblem(s);
  } else {
    toast("Not quite, try again");
    nextMathProblem(s);
  }
}

// ---------------- clock tick ----------------

function tick() {
  const now = Date.now();
  let last = store.getLastTick();
  if (typeof last !== "number" || last > now) last = now - 1000;
  if (!state.session?.real) {
    const due = dueAlarms(state.alarms, last, now);
    if (due.length) {
      store.setLastTick(now);
      startRing({ ...due[0].alarm }, { returnTo: "home" });
      return;
    }
  }
  store.setLastTick(now);
  if (state.view === "home") renderHero();
  else if (state.view === "night") renderNight();
  else if (state.view === "ring") $("ring-clock").textContent = nowClock();
}

// ---------------- events ----------------

function bind() {
  $("btn-add").addEventListener("click", () => openEditor(null));
  $("btn-night").addEventListener("click", enterNight);
  $("btn-settings").addEventListener("click", () => { renderSettings(); show("settings"); });
  $("settings-back").addEventListener("click", () => { show("home"); renderHome(); });

  $("edit-cancel").addEventListener("click", () => { stopPreview(); show("home"); renderHome(); });
  $("edit-save").addEventListener("click", saveDraft);
  $("edit-form").addEventListener("submit", e => { e.preventDefault(); saveDraft(); });
  $("edit-delete").addEventListener("click", () => {
    if (!confirm("Delete this alarm?")) return;
    state.alarms = state.alarms.filter(a => a.id !== state.draft.id);
    saveAlarms();
    show("home");
    renderHome();
  });
  $("edit-test").addEventListener("click", () => {
    const err = readForm();
    if (err) return toast(err);
    unlockAudio();
    startRing({ ...state.draft }, { test: true, returnTo: "edit" });
  });
  for (const b of document.querySelectorAll(".quick-days button")) {
    b.addEventListener("click", () => {
      state.draft.days = b.dataset.days ? b.dataset.days.split(",").map(Number) : [];
      renderDays();
    });
  }
  $("f-custom").addEventListener("input", () => {
    const n = Math.round(Number($("f-custom").value));
    if (n > 0) state.draft.target = n;
  });
  $("f-sound").addEventListener("change", () => { state.draft.sound = $("f-sound").value; stopPreview(); $("f-preview").textContent = "▶ Play"; });
  $("f-preview").addEventListener("click", async () => {
    const playing = await togglePreview($("f-sound").value);
    $("f-preview").textContent = playing ? "■ Stop" : "▶ Play";
    if (playing) setTimeout(() => { $("f-preview").textContent = "▶ Play"; }, 6000);
  });
  $("f-upload").addEventListener("click", () => $("f-file").click());
  $("f-file").addEventListener("change", e => { onUpload(e.target.files?.[0]); e.target.value = ""; });

  $("s-strictness").addEventListener("click", e => { const v = e.target.closest("button")?.dataset.v; if (v) setSetting("strictness", v); });
  $("s-camera").addEventListener("click", e => { const v = e.target.closest("button")?.dataset.v; if (v) setSetting("camera", v); });
  $("s-ramp").addEventListener("change", e => setSetting("ramp", e.target.checked));
  $("s-duck").addEventListener("change", e => setSetting("duck", e.target.checked));
  $("s-skeleton").addEventListener("change", e => setSetting("skeleton", e.target.checked));
  $("s-24h").addEventListener("change", e => setSetting("use24h", e.target.checked));

  $("view-night").addEventListener("click", e => {
    if (!state.night || e.target.closest("#btn-night-exit")) return;
    unlockAudio().then(ok => { if (ok && state.nightChecks.audio !== true) { state.nightChecks.audio = true; renderNight(); } });
    keepAwake(true);
    wakeNightScreen();
  });
  $("btn-night-exit").addEventListener("click", exitNight);

  $("btn-ring-quit").addEventListener("click", quitSession);
  $("tap-overlay").addEventListener("click", () => {
    // Unlock audio first, while the tap still counts as a user gesture;
    // fullscreen goes last because it uses the gesture up.
    const unlocked = unlockAudio();
    keepAwake(true);
    $("tap-overlay").hidden = true;
    const s = state.session;
    if (s?.player && !s.player.playing && !s.done) s.player.start(); // plays as soon as audio is unlocked
    $("cam").play().catch(() => {});
    requestFullscreen();
    unlocked.then(ok => { if (!ok && state.session === s && s && !s.done && !s.practice) $("tap-overlay").hidden = false; });
  });
  $("btn-cam-retry").addEventListener("click", () => {
    const s = state.session;
    if (!s) return;
    $("fallback").hidden = true;
    startVision(s);
  });
  $("math-go").addEventListener("click", checkMath);
  $("math-a").addEventListener("keydown", e => { if (e.key === "Enter") checkMath(); });

  // While a real alarm rings, the back button and closing the page don't get you out.
  window.addEventListener("popstate", () => { if (state.session?.real) history.pushState({ ring: 1 }, ""); });
  window.addEventListener("beforeunload", e => {
    if (state.session?.real) { e.preventDefault(); e.returnValue = ""; }
  });
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") tick(); });
  onWakeChange(() => { if (state.view === "night") renderNight(); });
}

// ---------------- install (PWA) ----------------

function setupInstall() {
  const standalone = matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
  if ("serviceWorker" in navigator && isSecureContext) {
    navigator.serviceWorker.register("./sw.js").catch(e => console.warn("SW registration failed", e));
  }
  if (standalone) return;
  let deferred = null;
  window.addEventListener("beforeinstallprompt", e => {
    e.preventDefault();
    deferred = e;
    $("install-card").hidden = false;
  });
  window.addEventListener("appinstalled", () => { $("install-card").hidden = true; });
  if (/iphone|ipad|ipod/i.test(navigator.userAgent)) {
    $("install-card").hidden = false;
    $("install-help").textContent = "In Safari, tap Share, then Add to Home Screen.";
    $("btn-install").hidden = true;
  }
  $("btn-install").addEventListener("click", async () => {
    if (!deferred) return toast("Use your browser menu → Install app / Add to Home screen");
    deferred.prompt();
    await deferred.userChoice;
    deferred = null;
  });
}

// ---------------- start ----------------

async function init() {
  bind();
  renderPracticeGrid();
  setupInstall();
  state.customSounds = await store.listSounds();

  const r = store.getRinging();
  if (r?.alarm && Date.now() - r.startedAt < 3 * 3600e3) {
    // The page was closed or reloaded while ringing: ring again.
    store.setLastTick(Date.now());
    startRing(r.alarm, { resumed: r, returnTo: "home" });
  } else {
    if (r) store.setRinging(null);
    show("home");
    renderHome();
  }
  tick();
  setInterval(tick, 1000);
}

init();

// Handy for debugging from the browser console.
window.RepRise = { state, startRing, tick };
