/* AaharWalk — talking to the Android wrapper, when the app is running inside it.
 *
 * The APK exposes `window.AndroidSteps`, backed by Android's hardware step
 * counter. That sensor is maintained by the OS, so it keeps counting with the
 * screen off and the app closed — the one thing the web build cannot do.
 *
 * In a plain browser none of this exists and every function here says so, so
 * the same code runs in both places.
 */

const EVENT_STEPS = "androidsteps";
const EVENT_PERMISSION = "androidstepspermission";

/** The bridge object, or null when running as an ordinary web page. */
export function bridge() {
  if (typeof window === "undefined" || !window.AndroidSteps) return null;
  try {
    return window.AndroidSteps.isAvailable() ? window.AndroidSteps : null;
  } catch (err) {
    return null;
  }
}

export function hasNativeCounter() {
  return bridge() !== null;
}

/** true when Android has already granted activity-recognition access. */
export function nativePermitted() {
  const api = bridge();
  if (!api) return false;
  try {
    return api.hasPermission();
  } catch (err) {
    return false;
  }
}

/** Ask Android for permission. Resolves once the user answers, or times out. */
export function requestNativePermission({ timeoutMs = 60000 } = {}) {
  const api = bridge();
  if (!api) return Promise.resolve(false);
  if (nativePermitted()) return Promise.resolve(true);

  return new Promise(resolve => {
    let settled = false;
    const finish = value => {
      if (settled) return;
      settled = true;
      window.removeEventListener(EVENT_PERMISSION, handler);
      clearTimeout(timer);
      resolve(value);
    };
    const handler = event => finish(Boolean(event.detail));
    window.addEventListener(EVENT_PERMISSION, handler);
    const timer = setTimeout(() => finish(nativePermitted()), timeoutMs);
    try {
      api.requestPermission();
    } catch (err) {
      finish(false);
    }
  });
}

/**
 * Today's step total from the phone's own counter.
 * @returns {number|null} null when unavailable, -1 while the sensor warms up.
 */
export function readNativeToday() {
  const api = bridge();
  if (!api || !nativePermitted()) return null;
  try {
    const value = api.getTodaySteps();
    return Number.isFinite(value) ? value : null;
  } catch (err) {
    return null;
  }
}

/* ——— saving files out of the app ————————————————————————— */

/** The Android file bridge, or null in a plain browser. */
function fileBridge() {
  if (typeof window === "undefined" || !window.AndroidFiles) return null;
  try {
    return window.AndroidFiles.isAvailable() ? window.AndroidFiles : null;
  } catch (err) {
    return null;
  }
}

export function hasFileBridge() {
  return fileBridge() !== null;
}

/**
 * Write a text file to the phone's Downloads folder.
 * A WebView silently ignores an <a download> link, so inside the Android app
 * this is the only way a backup actually reaches the filesystem.
 * @returns {string|null} where it was saved, or null if unavailable/failed.
 */
export function saveTextFile(filename, text) {
  const api = fileBridge();
  if (!api) return null;
  try {
    const where = api.saveToDownloads(filename, text);
    return where ? String(where) : null;
  } catch (err) {
    return null;
  }
}

/** Subscribe to live updates pushed by the Android side. */
export function onNativeSteps(callback) {
  if (typeof window === "undefined") return () => {};
  const handler = event => callback(Number(event.detail));
  window.addEventListener(EVENT_STEPS, handler);
  return () => window.removeEventListener(EVENT_STEPS, handler);
}

/**
 * Whether the phone's own counter is the authority for today's total.
 *
 * Permission alone is not enough. A granted permission with a sensor that has
 * not reported yet used to hand ownership to a counter reading nothing, which
 * silently threw away steps counted in Walk mode. It has to be really counting.
 */
export function nativeIsSource(settings) {
  if (!settings || settings.stepSource !== "phone_native") return false;
  if (!hasNativeCounter() || !nativePermitted()) return false;
  const value = readNativeToday();
  return Number.isFinite(value) && value >= 0;
}

/**
 * The day's step total from every source we have.
 *
 * Walk-mode steps are already inside the phone's all-day total, so these
 * combine by taking the largest — never by adding, which would double count,
 * and never by replacing, which is how a silent sensor used to erase a walk.
 */
export function dayStepTotal({ phoneTotal = null, walked = 0, entered = 0 } = {}) {
  const candidates = [Number(walked) || 0, Number(entered) || 0];
  if (Number.isFinite(phoneTotal) && phoneTotal >= 0) candidates.push(phoneTotal);
  return Math.max(0, ...candidates);
}

/** What the phone's counter says right now, for showing the user. */
export function nativeStatus() {
  if (!hasNativeCounter()) return { state: "unavailable" };
  if (!nativePermitted()) return { state: "needs-permission" };
  const value = readNativeToday();
  if (!Number.isFinite(value) || value < 0) return { state: "waiting" };
  return { state: "ok", steps: value };
}
