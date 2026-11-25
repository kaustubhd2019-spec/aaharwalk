// Exercise detectors. Each takes MediaPipe pose landmarks (33 normalized points)
// and decides when a rep is done. Pure logic, no DOM: unit-tested in Node.
//
// Coordinates: MediaPipe gives x in [0,1] of the frame width and y in [0,1] of the
// frame height. We multiply x by the frame aspect ratio (width/height) so angles
// and distances are measured in real proportions.

export const LM = {
  NOSE: 0,
  L_SHOULDER: 11, R_SHOULDER: 12,
  L_ELBOW: 13, R_ELBOW: 14,
  L_WRIST: 15, R_WRIST: 16,
  L_HIP: 23, R_HIP: 24,
  L_KNEE: 25, R_KNEE: 26,
  L_ANKLE: 27, R_ANKLE: 28,
};

export const CHALLENGES = {
  squats:  { label: "Squats",        emoji: "🏋️", unit: "reps",    counts: [5, 10, 15, 20], verb: "squats" },
  pushups: { label: "Push-ups",      emoji: "💪", unit: "reps",    counts: [5, 10, 15, 20], verb: "push-ups" },
  jacks:   { label: "Jumping jacks", emoji: "🤸", unit: "reps",    counts: [10, 15, 20, 30], verb: "jumping jacks" },
  dance:   { label: "Dance",         emoji: "💃", unit: "seconds", counts: [10, 15, 20, 30], verb: "seconds of dancing" },
};

// Thresholds per strictness level. "easy" also switches off the anti-cheat checks.
const PROFILES = {
  squats: {
    easy:   { down: 125, up: 148, uprightDeg: null },
    normal: { down: 110, up: 155, uprightDeg: 50 },
    strict: { down: 95,  up: 162, uprightDeg: 35 },
  },
  pushups: {
    easy:   { down: 120, up: 140, armTorsoMin: null },
    normal: { down: 105, up: 148, armTorsoMin: 40 },
    strict: { down: 90,  up: 158, armTorsoMin: 55 },
  },
  jacks: {
    easy:   { open: 115, closed: 65, uprightDeg: null },
    normal: { open: 135, closed: 50, uprightDeg: 50 },
    strict: { open: 155, closed: 40, uprightDeg: 35 },
  },
  dance: {
    easy:   { energy: 0.30, uprightDeg: null },
    normal: { energy: 0.45, uprightDeg: 55 },
    strict: { energy: 0.70, uprightDeg: 40 },
  },
};

const VIS = 0.5;            // minimum landmark visibility
const MIN_REP_MS = 450;     // ignore impossibly fast "reps" (jitter)
const NICE_MS = 700;        // how long "Nice!" stays on screen

// ---------- geometry helpers ----------

function hasVisibilityInfo(lm) {
  return lm.some(p => typeof p.visibility === "number" && p.visibility > 0);
}

/** Converts landmarks into {x, y, ok} points in aspect-corrected units. */
export function toPoints(lm, aspect = 1) {
  const useVis = hasVisibilityInfo(lm);
  return lm.map(p => {
    const inFrame = p.x > -0.08 && p.x < 1.08 && p.y > -0.08 && p.y < 1.08;
    const vis = useVis ? (p.visibility ?? 0) : 1;
    return { x: p.x * aspect, y: p.y, ok: inFrame && vis >= VIS };
  });
}

export function angleDeg(a, b, c) {
  const v1x = a.x - b.x, v1y = a.y - b.y;
  const v2x = c.x - b.x, v2y = c.y - b.y;
  const n = Math.hypot(v1x, v1y) * Math.hypot(v2x, v2y);
  if (n === 0) return 180;
  const cos = Math.max(-1, Math.min(1, (v1x * v2x + v1y * v2y) / n));
  return (Math.acos(cos) * 180) / Math.PI;
}

const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, ok: a.ok && b.ok });

/** Mid-shoulder and mid-hip if visible (either side is enough). */
function torso(P) {
  const ls = P[LM.L_SHOULDER], rs = P[LM.R_SHOULDER], lh = P[LM.L_HIP], rh = P[LM.R_HIP];
  const sh = ls.ok && rs.ok ? mid(ls, rs) : ls.ok ? ls : rs.ok ? rs : null;
  const hip = lh.ok && rh.ok ? mid(lh, rh) : lh.ok ? lh : rh.ok ? rh : null;
  if (!sh || !hip) return null;
  const len = dist(sh, hip);
  if (len < 0.04) return null;
  // Angle of hip->shoulder from straight up in the image (0 = standing tall).
  const tilt = (Math.atan2(Math.abs(sh.x - hip.x), hip.y - sh.y) * 180) / Math.PI;
  return { sh, hip, len, tilt };
}

/** Average a joint angle over the visible sides. Returns null if neither side is visible. */
function sideAngles(P, triples) {
  const angles = [];
  for (const [a, b, c] of triples) {
    if (P[a].ok && P[b].ok && P[c].ok) angles.push(angleDeg(P[a], P[b], P[c]));
  }
  if (!angles.length) return null;
  return angles.reduce((s, v) => s + v, 0) / angles.length;
}

// ---------- base class ----------

class Counter {
  constructor(type, target, strictness = "normal") {
    this.type = type;
    this.target = Math.max(1, Math.round(target));
    this.strictness = PROFILES[type][strictness] ? strictness : "normal";
    this.cfg = PROFILES[type][this.strictness];
    this.count = 0;
    this.phase = "init";
    this.lastRepAt = -1e9;
    this.lastSeenAt = -1e9;
    this.smoothed = null;
    this.hint = null;      // temporary coaching message { text, until }
  }
  get done() { return this.count >= this.target; }
  get progress() { return Math.min(1, this.count / this.target); }

  smooth(v, t) {
    // Reset smoothing after a gap so an old value doesn't leak into a new attempt.
    if (this.smoothed == null || t - this.lastSeenAt > 800) this.smoothed = v;
    else this.smoothed = this.smoothed * 0.45 + v * 0.55;
    this.lastSeenAt = t;
    return this.smoothed;
  }

  flash(text, t, ms = 1500) { this.hint = { text, until: t + ms }; }

  activeHint(t) { return this.hint && t < this.hint.until ? this.hint.text : null; }

  tryCount(t) {
    if (t - this.lastRepAt < MIN_REP_MS) return false;
    this.count = Math.min(this.target, this.count + 1);
    this.lastRepAt = t;
    return true;
  }

  status(extra) {
    return {
      count: this.count,
      target: this.target,
      progress: this.progress,
      done: this.done,
      rep: false,
      visible: true,
      tone: "info",
      message: "",
      ...extra,
    };
  }

  notVisible(message) {
    return this.status({ visible: false, tone: "warn", message });
  }
}

// ---------- squats: knee angle (hip-knee-ankle) ----------

export class SquatCounter extends Counter {
  constructor(target, strictness) { super("squats", target, strictness); this.attemptMin = 180; }

  update(lm, t, aspect = 1) {
    const P = toPoints(lm, aspect);
    const raw = sideAngles(P, [
      [LM.L_HIP, LM.L_KNEE, LM.L_ANKLE],
      [LM.R_HIP, LM.R_KNEE, LM.R_ANKLE],
    ]);
    if (raw == null) return this.notVisible("Step back so your hips, knees and feet are in view");
    const a = this.smooth(raw, t);
    const { down, up, uprightDeg } = this.cfg;

    if (uprightDeg != null && this.phase !== "down") {
      const T = torso(P);
      if (T && T.tilt > uprightDeg) {
        this.phase = "init";
        return this.status({ tone: "warn", message: "Stand up! Squats only count when you're upright", metric: a });
      }
    }

    let rep = false;
    if (this.phase === "init") {
      if (a >= up) this.phase = "up";
    } else if (this.phase === "up") {
      if (a < up - 12) this.attemptMin = Math.min(this.attemptMin, a);
      if (a <= down) {
        this.phase = "down";
      } else if (a >= up && this.attemptMin < up - 12) {
        // Came back up without going deep enough.
        this.flash("Go a little lower ⬇️", t);
        this.attemptMin = 180;
      }
    } else if (this.phase === "down") {
      if (a >= up) {
        this.phase = "up";
        this.attemptMin = 180;
        rep = this.tryCount(t);
      }
    }

    let message;
    if (rep) { message = "Nice! 💪"; this.flash(message, t, NICE_MS); }
    else message = this.activeHint(t) ||
      (this.phase === "init" ? "Stand up straight to start"
        : this.phase === "down" ? "Now stand up ⬆️"
        : a < up - 12 ? "Lower…" : "Squat down ⬇️");
    return this.status({ rep, tone: rep ? "good" : "info", message, metric: a });
  }
}

// ---------- push-ups: elbow angle (shoulder-elbow-wrist) ----------

export class PushupCounter extends Counter {
  constructor(target, strictness) { super("pushups", target, strictness); }

  armTorsoAngle(P) {
    // Angle between upper arm and torso at the shoulder. ~90° in a push-up plank,
    // ~0-20° when standing with arms hanging (blocks "arm curl" cheating).
    const T = torso(P);
    if (!T) return null;
    const vals = [];
    for (const [s, e] of [[LM.L_SHOULDER, LM.L_ELBOW], [LM.R_SHOULDER, LM.R_ELBOW]]) {
      if (P[s].ok && P[e].ok) {
        const upperArm = dist(P[s], P[e]);
        if (T.len < upperArm * 0.6) continue; // torso foreshortened (camera in front): can't judge
        vals.push(angleDeg(P[e], P[s], T.hip));
      }
    }
    return vals.length ? Math.max(...vals) : null;
  }

  update(lm, t, aspect = 1) {
    const P = toPoints(lm, aspect);
    const raw = sideAngles(P, [
      [LM.L_SHOULDER, LM.L_ELBOW, LM.L_WRIST],
      [LM.R_SHOULDER, LM.R_ELBOW, LM.R_WRIST],
    ]);
    if (raw == null) return this.notVisible("Show your arms — put the phone on the floor, side-on, 1.5–2 m away");
    const a = this.smooth(raw, t);
    const { down, up, armTorsoMin } = this.cfg;

    let rep = false;
    if (this.phase === "init" || this.phase === "up") {
      if (a >= up) {
        const at = armTorsoMin != null ? this.armTorsoAngle(P) : null;
        if (at != null && at < armTorsoMin) {
          this.phase = "init";
          return this.status({ tone: "warn", message: "Get into push-up position (hands on the floor)", metric: a });
        }
        this.phase = "up";
      } else if (this.phase === "up" && a <= down) {
        this.phase = "down";
      }
    } else if (this.phase === "down") {
      if (a >= up) {
        this.phase = "up";
        rep = this.tryCount(t);
      }
    }

    let message;
    if (rep) { message = "Nice! 💪"; this.flash(message, t, NICE_MS); }
    else message = this.activeHint(t) ||
      (this.phase === "init" ? "Straighten your arms to start"
        : this.phase === "down" ? "Push up ⬆️" : "Lower your chest ⬇️");
    return this.status({ rep, tone: rep ? "good" : "info", message, metric: a });
  }
}

// ---------- jumping jacks: arm angle vs torso (arms down <-> overhead) ----------

export class JumpingJackCounter extends Counter {
  constructor(target, strictness) { super("jacks", target, strictness); }

  update(lm, t, aspect = 1) {
    const P = toPoints(lm, aspect);
    const T = torso(P);
    const arms = [];
    if (T) {
      for (const [s, w] of [[LM.L_SHOULDER, LM.L_WRIST], [LM.R_SHOULDER, LM.R_WRIST]]) {
        if (P[s].ok && P[w].ok) arms.push(angleDeg(P[w], P[s], T.hip));
      }
    }
    if (!T || arms.length === 0) return this.notVisible("Step back so your arms and hips are in view");
    const { open, closed, uprightDeg } = this.cfg;

    if (uprightDeg != null && T.tilt > uprightDeg) {
      this.phase = "init";
      return this.status({ tone: "warn", message: "Stand up! Jumping jacks only count when you're upright" });
    }

    // Both arms must go up (lowest arm decides) and both must come down (highest arm decides).
    const lowArm = this.smooth(Math.min(...arms), t);
    const highArm = Math.max(...arms);
    let rep = false;
    if (this.phase === "init") {
      if (highArm <= closed) this.phase = "closed";
    } else if (this.phase === "closed") {
      if (lowArm >= open) this.phase = "open";
    } else if (this.phase === "open") {
      if (highArm <= closed) {
        this.phase = "closed";
        rep = this.tryCount(t);
      }
    }

    let message;
    if (rep) { message = "Nice! 🤸"; this.flash(message, t, NICE_MS); }
    else message = this.activeHint(t) ||
      (this.phase === "init" ? "Arms down by your sides to start"
        : this.phase === "open" ? "Arms down ⬇️" : "Jump — arms overhead ⬆️");
    return this.status({ rep, tone: rep ? "good" : "info", message, metric: lowArm });
  }
}

// ---------- dance: seconds of real movement ----------

const DANCE_POINTS = [
  LM.L_SHOULDER, LM.R_SHOULDER, LM.L_ELBOW, LM.R_ELBOW, LM.L_WRIST, LM.R_WRIST,
  LM.L_HIP, LM.R_HIP, LM.L_KNEE, LM.R_KNEE, LM.L_ANKLE, LM.R_ANKLE,
];

export class DanceTimer extends Counter {
  constructor(targetSeconds, strictness) {
    super("dance", targetSeconds, strictness);
    this.activeMs = 0;
    this.energy = 0;
    this.history = [];      // [{t, pts, scale}] last ~1 s
    this.lastT = null;
  }

  get progress() { return Math.min(1, this.activeMs / (this.target * 1000)); }
  get done() { return this.activeMs >= this.target * 1000; }

  update(lm, t, aspect = 1) {
    const P = toPoints(lm, aspect);
    const T = torso(P);
    const dt = this.lastT == null ? 0 : (t - this.lastT) / 1000;
    this.lastT = t;
    if (!T) {
      this.history = [];
      this.energy = 0;
      return this.notVisible("Step back so your whole upper body is in view");
    }
    if (dt > 0.6) this.history = []; // camera stalled: don't treat the jump as movement

    // Compare with a frame ~250 ms ago: much less sensitive to landmark jitter
    // than frame-to-frame differences.
    this.history.push({ t, P, scale: T.len });
    while (this.history.length > 2 && t - this.history[1].t >= 250) this.history.shift();
    const ref = this.history[0];
    let raw = 0;
    const span = (t - ref.t) / 1000;
    if (span >= 0.15) {
      const speeds = [];
      for (const i of DANCE_POINTS) {
        if (P[i].ok && ref.P[i].ok) speeds.push(dist(P[i], ref.P[i]) / span / T.len);
      }
      if (speeds.length >= 4) raw = speeds.reduce((s, v) => s + v, 0) / speeds.length;
    }
    const alpha = dt > 0 ? 1 - Math.exp(-dt / 0.3) : 1;
    this.energy = this.energy + (raw - this.energy) * alpha;

    const { energy: thresh, uprightDeg } = this.cfg;
    if (uprightDeg != null && T.tilt > uprightDeg) {
      return this.status({ tone: "warn", message: "Stand up and dance! Lying down doesn't count", metric: this.energy });
    }

    const moving = this.energy >= thresh;
    const before = Math.floor(this.activeMs / 1000);
    if (moving && dt > 0) this.activeMs += Math.min(dt, 0.25) * 1000;
    this.count = Math.min(this.target, Math.floor(this.activeMs / 1000));
    const tick = Math.floor(this.activeMs / 1000) > before;

    return this.status({
      rep: tick,
      tone: moving ? "good" : "warn",
      message: moving ? "Keep dancing! 💃🕺" : "Move more! The timer pauses when you stop",
      metric: this.energy,
      moving,
    });
  }
}

export function createCounter(type, target, strictness = "normal") {
  switch (type) {
    case "squats": return new SquatCounter(target, strictness);
    case "pushups": return new PushupCounter(target, strictness);
    case "jacks": return new JumpingJackCounter(target, strictness);
    case "dance": return new DanceTimer(target, strictness);
    default: throw new Error(`Unknown challenge: ${type}`);
  }
}

export function describeChallenge(type, target) {
  const c = CHALLENGES[type];
  if (!c) return "";
  return type === "dance" ? `Dance ${target} s` : `${target} ${c.label.toLowerCase()}`;
}

/** Phrase for "You did ___". */
export function doneText(type, target) {
  if (type === "dance") return `${target} seconds of dancing`;
  return `${target} ${CHALLENGES[type]?.verb || "reps"}`;
}
