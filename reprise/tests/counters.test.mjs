// Run: node --test reprise/tests/
import { test } from "node:test";
import assert from "node:assert/strict";
import { createCounter, angleDeg, LM } from "../js/counters.js";

const rad = d => (d * Math.PI) / 180;

function blank() {
  return Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5, z: 0, visibility: 0.01 }));
}
function set(lm, i, p) { lm[i] = { x: p.x, y: p.y, z: 0, visibility: 0.98 }; }

/** Side-view standing/squatting person with the given knee angle. */
function squatPose(kneeDeg) {
  const lm = blank();
  const phi = rad((180 - kneeDeg) / 2);
  for (const [side, dx] of [["L", -0.01], ["R", 0.01]]) {
    const A = { x: 0.5 + dx, y: 0.92 };
    const K = { x: A.x + 0.2 * Math.sin(phi), y: A.y - 0.2 * Math.cos(phi) };
    const H = { x: K.x - 0.2 * Math.sin(phi), y: K.y - 0.2 * Math.cos(phi) };
    const lean = 0.4 * phi;
    const S = { x: H.x + 0.28 * Math.sin(lean), y: H.y - 0.28 * Math.cos(lean) };
    const E = { x: S.x, y: S.y + 0.13 };
    const W = { x: E.x + 0.02, y: E.y + 0.12 };
    set(lm, LM[`${side}_ANKLE`], A); set(lm, LM[`${side}_KNEE`], K); set(lm, LM[`${side}_HIP`], H);
    set(lm, LM[`${side}_SHOULDER`], S); set(lm, LM[`${side}_ELBOW`], E); set(lm, LM[`${side}_WRIST`], W);
  }
  return lm;
}

/** Side-view push-up with the given elbow angle (body horizontal). */
function pushupPose(elbowDeg) {
  const lm = blank();
  const th = rad(elbowDeg);
  for (const [side, dy] of [["L", -0.005], ["R", 0.005]]) {
    const W = { x: 0.3, y: 0.8 + dy };
    const E = { x: W.x, y: W.y - 0.13 };
    const S = { x: E.x - 0.13 * Math.sin(th), y: E.y + 0.13 * Math.cos(th) };
    const H = { x: S.x + 0.32, y: S.y + 0.03 };
    const K = { x: H.x + 0.2, y: H.y + 0.02 };
    const A = { x: K.x + 0.2, y: K.y + 0.02 };
    set(lm, LM[`${side}_WRIST`], W); set(lm, LM[`${side}_ELBOW`], E); set(lm, LM[`${side}_SHOULDER`], S);
    set(lm, LM[`${side}_HIP`], H); set(lm, LM[`${side}_KNEE`], K); set(lm, LM[`${side}_ANKLE`], A);
  }
  return lm;
}

/** Standing person doing an arm curl (the push-up cheat). */
function curlPose(elbowDeg) {
  const lm = blank();
  const a = rad(180 - elbowDeg);
  for (const [side, dx] of [["L", -0.06], ["R", 0.06]]) {
    const S = { x: 0.5 + dx, y: 0.35 };
    const E = { x: S.x, y: 0.48 };
    const W = { x: E.x + 0.13 * Math.sin(a), y: E.y + 0.13 * Math.cos(a) };
    set(lm, LM[`${side}_SHOULDER`], S); set(lm, LM[`${side}_ELBOW`], E); set(lm, LM[`${side}_WRIST`], W);
    set(lm, LM[`${side}_HIP`], { x: S.x * 0.9 + 0.05, y: 0.65 });
    set(lm, LM[`${side}_KNEE`], { x: S.x, y: 0.8 });
    set(lm, LM[`${side}_ANKLE`], { x: S.x, y: 0.95 });
  }
  return lm;
}

/** Standing person, arms at angle `armDeg` away from the body (0 = down, 180 = overhead). */
function jackPose(armDeg, extra = {}) {
  const lm = blank();
  const a = rad(armDeg);
  for (const [side, sgn] of [["L", -1], ["R", 1]]) {
    const S = { x: 0.5 + sgn * 0.06, y: 0.35 };
    const E = { x: S.x + sgn * 0.15 * Math.sin(a), y: S.y + 0.15 * Math.cos(a) };
    const W = { x: S.x + sgn * 0.3 * Math.sin(a), y: S.y + 0.3 * Math.cos(a) };
    set(lm, LM[`${side}_SHOULDER`], S); set(lm, LM[`${side}_ELBOW`], E); set(lm, LM[`${side}_WRIST`], W);
    set(lm, LM[`${side}_HIP`], { x: 0.5 + sgn * 0.045, y: 0.65 });
    set(lm, LM[`${side}_KNEE`], { x: 0.5 + sgn * 0.05 + (extra.knee || 0), y: 0.8 });
    set(lm, LM[`${side}_ANKLE`], { x: 0.5 + sgn * 0.05 + (extra.ankle || 0), y: 0.95 });
  }
  return lm;
}

/** Rotate a pose 90° (person lying down in the image). */
function lyingDown(lm) {
  return lm.map(p => ({ ...p, x: 0.5 + (p.y - 0.5), y: 0.5 - (p.x - 0.5) }));
}

/** Feed a sequence of angles (one per frame at 30 fps) into a counter. */
function run(counter, angles, poseFn, t0 = 0) {
  let t = t0, last;
  for (const a of angles) {
    last = counter.update(poseFn(a), t, 1);
    t += 1000 / 30;
  }
  return { last, t };
}

/** Smooth up-down-up cycles between `hi` and `lo`, `n` times, ~2 s each. */
function cycles(hi, lo, n, framesPerHalf = 30) {
  const out = [];
  for (let i = 0; i < 20; i++) out.push(hi); // hold at start
  for (let k = 0; k < n; k++) {
    for (let f = 0; f <= framesPerHalf; f++) out.push(hi + (lo - hi) * (f / framesPerHalf));
    for (let f = 0; f <= framesPerHalf; f++) out.push(lo + (hi - lo) * (f / framesPerHalf));
  }
  for (let i = 0; i < 10; i++) out.push(hi);
  return out;
}

test("geometry: synthetic poses have the joint angles we asked for", () => {
  const p = squatPose(100);
  const a = angleDeg(p[LM.L_HIP], p[LM.L_KNEE], p[LM.L_ANKLE]);
  assert.ok(Math.abs(a - 100) < 0.5, `knee ${a}`);
  const q = pushupPose(90);
  const b = angleDeg(q[LM.L_SHOULDER], q[LM.L_ELBOW], q[LM.L_WRIST]);
  assert.ok(Math.abs(b - 90) < 0.5, `elbow ${b}`);
});

test("squats: 10 real squats count to exactly 10 and finish", () => {
  const c = createCounter("squats", 10, "normal");
  const { last } = run(c, cycles(172, 85, 10), squatPose);
  assert.equal(c.count, 10);
  assert.equal(last.done, true);
});

test("squats: counting stops at the target", () => {
  const c = createCounter("squats", 5, "normal");
  run(c, cycles(172, 85, 8), squatPose);
  assert.equal(c.count, 5);
});

test("squats: half squats don't count on normal, do count on easy", () => {
  const normal = createCounter("squats", 10, "normal");
  run(normal, cycles(172, 128, 5), squatPose);
  assert.equal(normal.count, 0);
  const easy = createCounter("squats", 10, "easy");
  run(easy, cycles(172, 120, 5), squatPose);
  assert.equal(easy.count, 5);
});

test("squats: shallow attempt triggers 'go lower' coaching", () => {
  const c = createCounter("squats", 10, "normal");
  const { last } = run(c, cycles(172, 130, 1), squatPose);
  assert.equal(c.count, 0);
  assert.match(last.message, /lower/i);
});

test("squats: bending knees while lying in bed does not count (normal), counts on easy", () => {
  const normal = createCounter("squats", 10, "normal");
  const r = run(normal, cycles(172, 85, 5), a => lyingDown(squatPose(a)));
  assert.equal(normal.count, 0);
  assert.match(r.last.message, /stand up/i);
  const easy = createCounter("squats", 10, "easy");
  run(easy, cycles(172, 85, 5), a => lyingDown(squatPose(a)));
  assert.equal(easy.count, 5);
});

test("squats: jitter around a single position never counts", () => {
  const c = createCounter("squats", 10, "normal");
  const seq = [];
  for (let i = 0; i < 600; i++) seq.push(165 + Math.sin(i) * 6);
  run(c, seq, squatPose);
  assert.equal(c.count, 0);
});

test("squats: not visible when legs are missing", () => {
  const c = createCounter("squats", 10, "normal");
  const lm = squatPose(170);
  for (const i of [LM.L_ANKLE, LM.R_ANKLE]) lm[i].visibility = 0.1;
  const s = c.update(lm, 0, 1);
  assert.equal(s.visible, false);
});

test("push-ups: 10 real push-ups count to 10", () => {
  const c = createCounter("pushups", 10, "normal");
  run(c, cycles(172, 80, 10), pushupPose);
  assert.equal(c.count, 10);
  assert.equal(c.done, true);
});

test("push-ups: standing arm curls don't count on normal, do on easy", () => {
  const normal = createCounter("pushups", 10, "normal");
  const r = run(normal, cycles(172, 60, 6), curlPose);
  assert.equal(normal.count, 0);
  assert.match(r.last.message, /push-up position|straighten/i);
  const easy = createCounter("pushups", 10, "easy");
  run(easy, cycles(172, 60, 6), curlPose);
  assert.equal(easy.count, 6);
});

test("push-ups: work whichever way the phone is rotated", () => {
  const c = createCounter("pushups", 5, "normal");
  run(c, cycles(172, 80, 5), a => lyingDown(pushupPose(a)));
  assert.equal(c.count, 5);
});

test("jumping jacks: 10 jacks count to 10", () => {
  const c = createCounter("jacks", 10, "normal");
  run(c, cycles(10, 170, 10, 12), jackPose);
  assert.equal(c.count, 10);
});

test("jumping jacks: arms only to shoulder height don't count on normal", () => {
  const c = createCounter("jacks", 10, "normal");
  run(c, cycles(10, 95, 6, 12), jackPose);
  assert.equal(c.count, 0);
});

test("jumping jacks: lying down waving arms doesn't count on normal", () => {
  const c = createCounter("jacks", 10, "normal");
  run(c, cycles(10, 170, 6, 12), a => lyingDown(jackPose(a)));
  assert.equal(c.count, 0);
});

test("reps faster than humanly possible are ignored", () => {
  const c = createCounter("jacks", 30, "normal");
  // full cycle every 4 frames (~133 ms): far too fast
  run(c, cycles(10, 170, 20, 2), jackPose);
  assert.ok(c.count <= 8, `counted ${c.count}`);
});

test("dance: 15 s of real movement completes a 15 s dance", () => {
  const c = createCounter("dance", 15, "normal");
  let t = 0, s;
  for (let f = 0; f < 30 * 18; f++) {
    const ph = (f / 30) * 2 * Math.PI * 1.5;
    const lm = jackPose(60 + 50 * Math.sin(ph), { knee: 0.04 * Math.sin(ph), ankle: 0.05 * Math.sin(ph) });
    s = c.update(lm, t, 1);
    t += 1000 / 30;
  }
  assert.equal(s.done, true);
  assert.equal(c.count, 15);
});

test("dance: standing still (with camera jitter) never completes", () => {
  const c = createCounter("dance", 10, "normal");
  let t = 0, s;
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647 - 0.5);
  for (let f = 0; f < 30 * 30; f++) {
    const lm = jackPose(15).map(p => ({ ...p, x: p.x + rnd() * 0.008, y: p.y + rnd() * 0.008 }));
    s = c.update(lm, t, 1);
    t += 1000 / 30;
  }
  assert.equal(s.done, false);
  assert.ok(c.activeMs < 1000, `accumulated ${c.activeMs} ms while still`);
});

test("dance: timer pauses when you stop and resumes when you move", () => {
  const c = createCounter("dance", 20, "normal");
  let t = 0;
  const step = moving => {
    for (let f = 0; f < 30 * 5; f++) {
      const ph = (t / 1000) * 2 * Math.PI * 1.5;
      c.update(jackPose(moving ? 60 + 50 * Math.sin(ph) : 15), t, 1);
      t += 1000 / 30;
    }
  };
  step(true);
  const afterMove = c.activeMs;
  step(false);
  const afterStop = c.activeMs;
  step(true);
  assert.ok(afterMove > 3500, `moved ${afterMove}`);
  assert.ok(afterStop - afterMove < 800, `kept counting while still: ${afterStop - afterMove}`);
  assert.ok(c.activeMs - afterStop > 3500);
});
