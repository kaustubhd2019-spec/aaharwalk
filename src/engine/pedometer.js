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

/*
 * Walking sits between roughly 1.3 and 2.6 steps per second. Everything below
 * that is body sway and gravity drift; everything above is impact ringing,
 * engine vibration and the phone rattling in a pocket. Keeping only that band
 * is what stops a single stride being counted twice.
 */
const HIGHPASS_HZ = 0.5;      // drop gravity and slow lean
const LOWPASS_HZ = 2.9;       // drop the sharp impact content above cadence
const MIN_REFRACTORY_MS = 340;   // faster than ~2.9 steps/s is not walking
const CADENCE_REFRACTORY = 0.6;   // …or 60% of the stride we are actually seeing
const PENDING_GAP_MS = 2200;
const CONFIRM_STEPS = 4;      // a run this long must look rhythmic before it counts
const RHYTHM_TOLERANCE = 0.4; // how far those intervals may stray from their mean
const ENVELOPE_TAU = 1.6;     // seconds for the adaptive threshold to relax

/*
 * Timing alone cannot tell walking from a bus. The refractory window rejects
 * anything arriving too soon, so broadband road vibration comes out the other
 * side looking evenly spaced — rhythm manufactured from noise.
 *
 * Walking is genuinely periodic: the signal a second ago resembles the signal
 * now, shifted by one stride. Road noise does not repeat. So the signal is
 * resampled into fixed bins and autocorrelated across the plausible stride
 * lags, and steps only count while that similarity is strong.
 */
const BIN_MS = 40;            // 25 Hz, fixed regardless of what the phone sends
const BUFFER_BINS = 100;      // four seconds of history
const MIN_LAG = 9;            // 25/9  ≈ 2.8 steps per second
const MAX_LAG = 20;           // 25/20 ≈ 1.25 steps per second
const PERIODIC_ENOUGH = 0.45; // normalised autocorrelation needed to count
const CHECK_EVERY_BINS = 6;

/**
 * Step detector over a stream of accelerometer samples.
 *
 * Gravity goes via a slow high-pass, then a two-pole low-pass leaves one clean
 * oscillation per stride. Steps are threshold crossings with hysteresis, and a
 * refractory window that adapts to the cadence actually being walked — which is
 * what rejects the second bounce inside a stride rather than counting it.
 *
 * Everything is computed from the real time between samples, so a phone
 * delivering 20 Hz and one delivering 200 Hz behave the same.
 */
export function createDetector({ onStep = null } = {}) {
  let lastT = null;
  let gravity = null;
  let lowpass1 = 0;
  let lowpass2 = 0;
  let envelope = 0;
  let above = false;

  let steps = 0;
  let lastStepAt = 0;
  let intervals = [];
  let pending = [];
  let confirmed = false;
  let warmup = [];      // crossings seen before the rhythm was established

  const bins = new Array(BUFFER_BINS).fill(0);
  let binIndex = 0;
  let binFill = 0;
  let binAccum = 0;
  let binCount = 0;
  let binClock = 0;
  let binsSinceCheck = 0;
  let periodicity = 0;
  let looksPeriodic = false;

  function reset() {
    lastT = null; gravity = null; lowpass1 = 0; lowpass2 = 0; envelope = 0;
    above = false; steps = 0; lastStepAt = 0; intervals = []; pending = []; confirmed = false;
    warmup = [];
    bins.fill(0); binIndex = 0; binFill = 0; binAccum = 0; binCount = 0;
    binClock = 0; binsSinceCheck = 0; periodicity = 0; looksPeriodic = false;
  }

  /** Strongest normalised self-similarity across plausible stride lags. */
  function measurePeriodicity() {
    if (binFill < BUFFER_BINS) return 0;
    const series = new Array(BUFFER_BINS);
    let mean = 0;
    for (let i = 0; i < BUFFER_BINS; i++) {
      series[i] = bins[(binIndex + i) % BUFFER_BINS];
      mean += series[i];
    }
    mean /= BUFFER_BINS;

    let energy = 0;
    for (let i = 0; i < BUFFER_BINS; i++) {
      series[i] -= mean;
      energy += series[i] * series[i];
    }
    if (energy <= 1e-6) return 0;

    let best = 0;
    for (let lag = MIN_LAG; lag <= MAX_LAG; lag++) {
      let sum = 0;
      for (let i = 0; i + lag < BUFFER_BINS; i++) sum += series[i] * series[i + lag];
      const overlap = BUFFER_BINS - lag;
      const normalised = sum / (energy * (overlap / BUFFER_BINS));
      if (normalised > best) best = normalised;
    }
    return best;
  }

  /**
   * Proving the rhythm takes a few seconds, but those steps were real. Once the
   * signal is confirmed periodic, credit the crossings already seen inside the
   * window the proof was built from — otherwise a short walk loses its start.
   */
  function creditWarmup(now) {
    const window = BIN_MS * BUFFER_BINS;
    const recent = warmup.filter(time => now - time <= window);
    warmup = [];
    if (recent.length < 3) return;

    // Only credit crossings that were themselves evenly spaced. Road noise can
    // briefly look periodic in aggregate while its individual peaks are not.
    const gaps = [];
    for (let i = 1; i < recent.length; i++) gaps.push(recent[i] - recent[i - 1]);
    const mean = gaps.reduce((total, gap) => total + gap, 0) / gaps.length;
    if (!gaps.every(gap => Math.abs(gap - mean) <= mean * RHYTHM_TOLERANCE)) return;

    // Never credit more than a plausible cadence could have produced.
    const most = Math.ceil((window / 1000) * 2.8);
    const credited = Math.min(recent.length, most);
    steps += credited;
    confirmed = true;
    pending = [];
    lastStepAt = recent[recent.length - 1];
    if (onStep) onStep(steps);
  }

  function feedBuffer(signal, dt, t) {
    binAccum += Math.abs(signal);
    binCount += 1;
    binClock += dt * 1000;
    if (binClock < BIN_MS) return;

    bins[binIndex] = binCount > 0 ? binAccum / binCount : 0;
    binIndex = (binIndex + 1) % BUFFER_BINS;
    if (binFill < BUFFER_BINS) binFill += 1;
    binAccum = 0;
    binCount = 0;
    binClock = 0;

    binsSinceCheck += 1;
    if (binsSinceCheck >= CHECK_EVERY_BINS) {
      binsSinceCheck = 0;
      periodicity = measurePeriodicity();
      const wasPeriodic = looksPeriodic;
      // A little hysteresis so a single soft stride does not stop the count.
      looksPeriodic = periodicity >= (wasPeriodic ? PERIODIC_ENOUGH * 0.8 : PERIODIC_ENOUGH);

      if (!wasPeriodic && looksPeriodic) {
        creditWarmup(t);
      } else if (wasPeriodic && !looksPeriodic) {
        pending = [];
        confirmed = false;
        intervals = [];
      }
    }
  }

  /** One-pole coefficient for a cutoff, from the real gap between samples. */
  function coefficient(hz, dt) {
    return 1 - Math.exp(-2 * Math.PI * hz * dt);
  }

  function medianInterval() {
    if (intervals.length < 3) return 0;
    const sorted = intervals.slice().sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length / 2)];
  }

  /**
   * Feed one sample.
   * @param {number} x @param {number} y @param {number} z  m/s² including gravity
   * @param {number} t  timestamp in ms
   * @returns {number} steps counted so far
   */
  function push(x, y, z, t) {
    const magnitude = Math.sqrt(x * x + y * y + z * z);

    if (lastT == null || gravity == null) {
      lastT = t;
      gravity = magnitude;
      return steps;
    }

    const dt = (t - lastT) / 1000;
    lastT = t;
    // A pause, a clock jump or a duplicated timestamp tells us nothing.
    if (!(dt > 0) || dt > 0.5) return steps;

    gravity += (magnitude - gravity) * coefficient(HIGHPASS_HZ, dt);
    const linear = magnitude - gravity;

    const lp = coefficient(LOWPASS_HZ, dt);
    lowpass1 += (linear - lowpass1) * lp;
    lowpass2 += (lowpass1 - lowpass2) * lp;
    const signal = lowpass2;

    feedBuffer(signal, dt, t);

    envelope = Math.max(Math.abs(signal), envelope * Math.exp(-dt / ENVELOPE_TAU));
    const threshold = clamp(envelope * 0.4, 0.15, 2.5);

    // Not yet proven to be walking: keep detecting, but hold the count back.
    if (!looksPeriodic) {
      if (!above && signal > threshold) {
        above = true;
      } else if (above && signal < threshold * 0.4) {
        above = false;
        if (t - lastStepAt >= MIN_REFRACTORY_MS) {
          lastStepAt = t;
          warmup.push(t);
          if (warmup.length > 40) warmup.shift();
        }
      }
      return steps;
    }

    if (!above && signal > threshold) {
      above = true;
    } else if (above && signal < threshold * 0.4) {
      above = false;
      const median = medianInterval();
      const refractory = Math.max(MIN_REFRACTORY_MS, median * CADENCE_REFRACTORY);
      const gap = t - lastStepAt;
      if (gap >= refractory) {
        if (lastStepAt > 0 && gap < 2000) {
          intervals.push(gap);
          if (intervals.length > 8) intervals.shift();
        }
        lastStepAt = t;
        record(t);
      }
    }
    return steps;
  }

  /**
   * Nothing counts until the beat looks like walking.
   *
   * Walking is strikingly regular; road vibration, a jostled pocket and a phone
   * being picked up are not. Holding the first few detections back until their
   * spacing is even is what separates the two — amplitude alone cannot, because
   * a gentle walk is quieter than a bumpy bus.
   */
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
    if (pending.length < CONFIRM_STEPS) return;

    const gaps = [];
    for (let i = 1; i < pending.length; i++) gaps.push(pending[i] - pending[i - 1]);
    const mean = gaps.reduce((total, gap) => total + gap, 0) / gaps.length;
    const rhythmic = gaps.every(gap => Math.abs(gap - mean) <= mean * RHYTHM_TOLERANCE);

    if (!rhythmic) {
      pending.shift();          // slide the window and keep looking
      return;
    }
    confirmed = true;
    steps += pending.length;
    pending = [];
    if (onStep) onStep(steps);
  }

  /** A long pause means the next few detections need confirming again. */
  function idle(t) {
    if (t - lastStepAt > PENDING_GAP_MS) {
      pending = [];
      confirmed = false;
      intervals = [];
    }
  }

  return {
    push,
    idle,
    reset,
    get steps() { return steps; },
    get confirmed() { return confirmed; },
    get cadence() {
      const median = medianInterval();
      return median > 0 ? 1000 / median : 0;
    },
    get periodicity() { return periodicity; },
    get walking() { return looksPeriodic; }
  };
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

/* ——— correcting for how this phone counts ————————————————— */

/**
 * How far a correction factor may stray from 1. Outside this range the
 * calibration walk was almost certainly mis-entered rather than the phone
 * being genuinely that far out.
 */
export const CALIBRATION_RANGE = { min: 0.5, max: 2 };

export function clampCalibration(factor) {
  const value = Number(factor);
  if (!Number.isFinite(value) || value <= 0) return 1;
  return clamp(value, CALIBRATION_RANGE.min, CALIBRATION_RANGE.max);
}

/**
 * Turn a calibration walk into a correction factor.
 * @param {number} counted what the app counted
 * @param {number} actual how many steps were really taken
 */
export function calibrationFrom(counted, actual) {
  if (!(counted > 0) || !(actual > 0)) return 1;
  return clampCalibration(actual / counted);
}

/** "counts about 15% high" — plain language for a factor. */
export function calibrationDrift(factor) {
  const value = clampCalibration(factor);
  return Math.round((1 / value - 1) * 100);
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
export function startCounting({ calibration = 1, onStep = null, onSample = null } = {}) {
  const factor = clampCalibration(calibration);
  let reported = 0;
  const detector = createDetector({
    onStep: raw => {
      reported = Math.round(raw * factor);
      if (onStep) onStep(reported);
    }
  });
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
    /** Raw detector count, before the user's correction factor. */
    get rawSteps() { return detector.steps; },
    /** What the user sees: corrected for how their phone counts. */
    get steps() { return reported; },
    get walking() { return detector.walking; },
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
