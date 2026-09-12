/* AaharWalk — counting steps from the phone's accelerometer.
 *
 * What this can and cannot do, plainly:
 *   • It counts while the walk screen is open and the screen is awake.
 *     The app asks for a wake lock so a pocketed phone keeps counting.
 *   • It CANNOT count in the background. Browsers suspend sensor events once
 *     the page is hidden or the screen locks — there is no web API for
 *     all-day counting. For a whole day's total, share or paste the number
 *     from Step Set Go / Google Fit (see steps-import.js).
 *
 * The detector itself is pure maths over (x, y, z, timestamp) samples, so it
 * runs and is tested without a device.
 */

/* Walking cadence sits around 1.5–2.5 steps/second. */
const MIN_STEP_MS = 260;          // faster than this is a jiggle, not a step
const PENDING_GAP_MS = 2200;      // a gap this long means walking has not begun
const CONFIRM_STEPS = 3;          // hold the first few until it looks like real walking

export const SENSITIVITY = {
  low:    { label: { en: "Less sensitive", mr: "कमी संवेदनशील" }, scale: 1.35 },
  normal: { label: { en: "Normal", mr: "नेहमीसारखं" }, scale: 1 },
  high:   { label: { en: "More sensitive", mr: "जास्त संवेदनशील" }, scale: 0.72 }
};

/**
 * Step detector over a stream of accelerometer samples.
 *
 * Gravity is removed with a slow moving average, the remaining signal is
 * lightly smoothed, and steps are counted as threshold crossings with
 * hysteresis. The threshold adapts to how hard the person is actually moving,
 * so it works for a phone in a pocket and one held in the hand.
 */
export function createDetector({ sensitivity = "normal", onStep = null } = {}) {
  const scale = (SENSITIVITY[sensitivity] || SENSITIVITY.normal).scale;

  let gravity = null;      // slow EMA ≈ the gravity component
  let smooth = 0;          // lightly filtered AC signal
  let above = false;       // inside a peak
  let steps = 0;
  let lastStepAt = 0;
  let pending = [];        // unconfirmed early steps
  let confirmed = false;
  const window = [];       // recent |signal| for the adaptive threshold

  function reset() {
    gravity = null; smooth = 0; above = false;
    steps = 0; lastStepAt = 0; pending = []; confirmed = false;
    window.length = 0;
  }

  /**
   * Feed one sample.
   * @param {number} x @param {number} y @param {number} z  m/s² including gravity
   * @param {number} t  timestamp in ms
   * @returns {number} steps counted so far
   */
  function push(x, y, z, t) {
    const magnitude = Math.sqrt(x * x + y * y + z * z);

    if (gravity == null) { gravity = magnitude; smooth = 0; }
    gravity = gravity * 0.9 + magnitude * 0.1;
    const linear = magnitude - gravity;
    smooth = smooth * 0.7 + linear * 0.3;

    // Adaptive threshold from the recent swing of the signal.
    window.push(Math.abs(smooth));
    if (window.length > 50) window.shift();
    const peak = Math.max(...window);
    const threshold = clamp(peak * 0.45 * scale, 0.45 * scale, 3.2 * scale);

    if (!above && smooth > threshold) {
      above = true;
    } else if (above && smooth < threshold * 0.5) {
      above = false;
      if (t - lastStepAt >= MIN_STEP_MS) {
        lastStepAt = t;
        record(t);
      }
    }
    return steps;
  }

  /* Hold the first couple of detections back: a phone taken out of a pocket
     should not add three steps the user never took. */
  function record(t) {
    if (confirmed) {
      steps += 1;
      if (onStep) onStep(steps);
      return;
    }
    if (pending.length && t - pending[pending.length - 1] > PENDING_GAP_MS) {
      pending = [];
    }
    pending.push(t);
    if (pending.length >= CONFIRM_STEPS) {
      confirmed = true;
      steps += pending.length;
      pending = [];
      if (onStep) onStep(steps);
    }
  }

  /** A long pause means the next few detections need confirming again. */
  function idle(t) {
    if (t - lastStepAt > PENDING_GAP_MS) {
      pending = [];
      confirmed = false;
      window.length = 0;
    }
  }

  return {
    push,
    idle,
    reset,
    get steps() { return steps; },
    get confirmed() { return confirmed; }
  };
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

/* ——— device plumbing ——————————————————————————————————————— */

export function motionSupported() {
  return typeof window !== "undefined" && typeof window.DeviceMotionEvent !== "undefined";
}

/** iOS 13+ will not deliver motion events without an explicit user gesture. */
export function needsMotionPermission() {
  return motionSupported() && typeof DeviceMotionEvent.requestPermission === "function";
}

export async function requestMotionPermission() {
  if (!needsMotionPermission()) return motionSupported() ? "granted" : "unsupported";
  try {
    return await DeviceMotionEvent.requestPermission();
  } catch (err) {
    return "denied";
  }
}

/** Sensors need a secure context — plain http (other than localhost) gets nothing. */
export function secureEnough() {
  return typeof window !== "undefined" && window.isSecureContext;
}

/**
 * Live step counting from the device.
 * @returns {{stop:Function, detector:object}}
 */
export function startCounting({ sensitivity = "normal", onStep = null, onSample = null } = {}) {
  const detector = createDetector({ sensitivity, onStep });
  let samples = 0;

  const handler = event => {
    const a = event.accelerationIncludingGravity || event.acceleration;
    if (!a || a.x == null) return;
    samples += 1;
    const t = event.timeStamp || performance.now();
    detector.push(a.x, a.y, a.z, t);
    detector.idle(t);
    if (onSample) onSample(samples);
  };

  window.addEventListener("devicemotion", handler);
  return {
    detector,
    get samples() { return samples; },
    stop() { window.removeEventListener("devicemotion", handler); }
  };
}

/* ——— keeping the screen awake ————————————————————————————— */

export async function acquireWakeLock() {
  if (!("wakeLock" in navigator)) return null;
  try {
    return await navigator.wakeLock.request("screen");
  } catch (err) {
    return null;
  }
}

/* ——— turning steps into distance and calories ————————————— */

/** Stride length is roughly 0.414 × height for walking. */
export function strideMetres(heightCm = 170) {
  return Math.max(0.45, (heightCm * 0.414) / 100);
}

export function distanceKm(steps, heightCm) {
  return (steps * strideMetres(heightCm)) / 1000;
}

/** Deliberately conservative, and only the walking above resting effort. */
export function walkCalories(steps, weightKg = 70) {
  return Math.floor(steps * weightKg * 0.00045);
}
