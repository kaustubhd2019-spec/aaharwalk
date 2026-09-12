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

/** Subscribe to live updates pushed by the Android side. */
export function onNativeSteps(callback) {
  if (typeof window === "undefined") return () => {};
  const handler = event => callback(Number(event.detail));
  window.addEventListener(EVENT_STEPS, handler);
  return () => window.removeEventListener(EVENT_STEPS, handler);
}

/** Whether the phone's own counter is the authority for today's total. */
export function nativeIsSource(settings) {
  return settings && settings.stepSource === "phone_native" && hasNativeCounter() && nativePermitted();
}
