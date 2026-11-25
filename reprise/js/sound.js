// Alarm sound engine (Web Audio). Built-in sounds are synthesized once into
// AudioBuffers, so no audio files are needed; uploaded files are decoded the same way.
import { getSound } from "./store.js";

export const BUILTIN_SOUNDS = [
  { id: "classic", name: "Classic beeps" },
  { id: "fanfare", name: "Morning fanfare" },
  { id: "chimes", name: "Chimes" },
  { id: "digital", name: "Digital watch" },
  { id: "siren", name: "Siren" },
  { id: "buzzer", name: "Loud buzzer (heavy sleepers)" },
];

let ctx = null;
const bufferCache = new Map();

export function audioCtx() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    ctx = new AC({ latencyHint: "playback" });
  }
  return ctx;
}

export function audioRunning() {
  return !!ctx && ctx.state === "running";
}

/** Must be called from a tap/click at least once so later sounds can play by themselves. */
export async function unlockAudio() {
  try {
    // iOS 17+: play even when the ring/silent switch is on silent.
    if (navigator.audioSession) navigator.audioSession.type = "playback";
  } catch { /* not supported */ }
  const c = audioCtx();
  if (c.state !== "running") {
    try { await c.resume(); } catch { /* ignore */ }
  }
  try {
    const b = c.createBuffer(1, 1, 22050);
    const s = c.createBufferSource();
    s.buffer = b;
    s.connect(c.destination);
    s.start(0);
  } catch { /* ignore */ }
  return c.state === "running";
}

// ---------- synthesis ----------

const NOTE = n => 440 * Math.pow(2, (n - 69) / 12); // MIDI note -> Hz

function env(g, t, dur, peak, attack = 0.005, release = 0.03) {
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(peak, t + attack);
  g.gain.setValueAtTime(peak, Math.max(t + attack, t + dur - release));
  g.gain.linearRampToValueAtTime(0, t + dur);
}

function osc(oc, dest, { type = "sine", freq, start, dur, gain = 0.5, attack, release, freqEnd, glide = "exp" }) {
  const o = oc.createOscillator();
  const g = oc.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, start);
  if (freqEnd) {
    if (glide === "exp") o.frequency.exponentialRampToValueAtTime(freqEnd, start + dur);
    else o.frequency.linearRampToValueAtTime(freqEnd, start + dur);
  }
  env(g, start, dur, gain, attack, release);
  o.connect(g).connect(dest);
  o.start(start);
  o.stop(start + dur + 0.02);
}

function bell(oc, dest, freq, start, dur = 1.6, gain = 0.5) {
  // Inharmonic partials with exponential decay: a simple bell.
  for (const [ratio, amp] of [[1, 1], [2.76, 0.45], [5.4, 0.25], [8.93, 0.12]]) {
    const o = oc.createOscillator();
    const g = oc.createGain();
    o.frequency.value = freq * ratio;
    g.gain.setValueAtTime(0, start);
    g.gain.linearRampToValueAtTime(gain * amp, start + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur / ratio ** 0.4);
    o.connect(g).connect(dest);
    o.start(start);
    o.stop(start + dur);
  }
}

const RECIPES = {
  classic: { len: 1.4, build(oc, out) {
    const lp = oc.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 5000; lp.connect(out);
    for (let i = 0; i < 4; i++) osc(oc, lp, { type: "square", freq: 1046, start: i * 0.2, dur: 0.12, gain: 0.35 });
  } },
  fanfare: { len: 2.8, build(oc, out) {
    const seq = [[67, 0, 0.16], [72, 0.17, 0.16], [76, 0.34, 0.16], [79, 0.51, 0.3], [76, 0.84, 0.14], [79, 1.0, 0.6]];
    for (const [n, t, d] of seq) {
      osc(oc, out, { type: "triangle", freq: NOTE(n), start: t, dur: d, gain: 0.55, release: 0.05 });
      osc(oc, out, { type: "square", freq: NOTE(n - 12), start: t, dur: d, gain: 0.08, release: 0.05 });
    }
  } },
  chimes: { len: 3.4, build(oc, out) {
    [88, 84, 86, 79].forEach((n, i) => bell(oc, out, NOTE(n), i * 0.45, 1.8, 0.42));
  } },
  digital: { len: 1.0, build(oc, out) {
    for (const t of [0, 0.12, 0.24, 0.36]) osc(oc, out, { type: "square", freq: 3900, start: t, dur: 0.06, gain: 0.22, attack: 0.002, release: 0.005 });
  } },
  siren: { len: 1.6, build(oc, out) {
    osc(oc, out, { type: "sawtooth", freq: 620, freqEnd: 1450, start: 0, dur: 0.8, gain: 0.28, attack: 0.02, release: 0.001 });
    osc(oc, out, { type: "sawtooth", freq: 1450, freqEnd: 620, start: 0.8, dur: 0.8, gain: 0.28, attack: 0.001, release: 0.02 });
  } },
  buzzer: { len: 0.75, build(oc, out) {
    osc(oc, out, { type: "sawtooth", freq: 147, start: 0, dur: 0.48, gain: 0.5, attack: 0.004, release: 0.01 });
    osc(oc, out, { type: "square", freq: 294, start: 0, dur: 0.48, gain: 0.25, attack: 0.004, release: 0.01 });
  } },
};

function normalize(buffer, peakTarget = 0.95) {
  let peak = 0;
  for (let c = 0; c < buffer.numberOfChannels; c++) {
    const d = buffer.getChannelData(c);
    for (let i = 0; i < d.length; i++) peak = Math.max(peak, Math.abs(d[i]));
  }
  if (peak > 0) {
    const k = peakTarget / peak;
    for (let c = 0; c < buffer.numberOfChannels; c++) {
      const d = buffer.getChannelData(c);
      for (let i = 0; i < d.length; i++) d[i] *= k;
    }
  }
  return buffer;
}

async function renderBuiltin(id) {
  const r = RECIPES[id] || RECIPES.classic;
  const sr = 44100;
  const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  const oc = new OAC(1, Math.ceil(r.len * sr), sr);
  r.build(oc, oc.destination);
  return normalize(await oc.startRendering());
}

/** Decodes an uploaded audio Blob. Throws if the browser can't read it. */
export async function decodeBlob(blob) {
  const data = await blob.arrayBuffer();
  const c = audioCtx();
  return await new Promise((resolve, reject) => {
    const p = c.decodeAudioData(data, resolve, reject); // callback form for older Safari
    if (p && p.then) p.then(resolve, reject);
  });
}

/** AudioBuffer for a sound id ("classic", or "custom:<uuid>"). Falls back to classic. */
export async function loadSound(id) {
  if (bufferCache.has(id)) return bufferCache.get(id);
  let buf = null;
  if (id && id.startsWith("custom:")) {
    try {
      const rec = await getSound(id);
      if (rec?.blob) buf = await decodeBlob(rec.blob);
    } catch (e) {
      console.warn("Custom sound failed, using built-in", e);
    }
  }
  if (!buf) buf = await renderBuiltin(BUILTIN_SOUNDS.some(s => s.id === id) ? id : "classic");
  bufferCache.set(id, buf);
  return buf;
}

export function forgetSound(id) { bufferCache.delete(id); }

// ---------- playback ----------

/** Looping alarm. Volume ramps up (optional) and can be "ducked" while the user exercises. */
export class AlarmPlayer {
  constructor(buffer, { ramp = true } = {}) {
    this.buffer = buffer;
    this.ramp = ramp;
    this.src = null;
  }
  start() {
    const c = audioCtx();
    this.stop();
    const now = c.currentTime;
    this.src = c.createBufferSource();
    this.src.buffer = this.buffer;
    this.src.loop = true;
    this.vol = c.createGain();
    this.duckGain = c.createGain();
    this.vol.gain.setValueAtTime(this.ramp ? 0.35 : 1, now);
    if (this.ramp) this.vol.gain.linearRampToValueAtTime(1, now + 25);
    this.src.connect(this.vol).connect(this.duckGain).connect(c.destination);
    this.src.start(now + 0.05);
  }
  duck(level) {
    if (!this.duckGain) return;
    const c = audioCtx();
    this.duckGain.gain.cancelScheduledValues(c.currentTime);
    this.duckGain.gain.setTargetAtTime(level, c.currentTime, 0.3);
  }
  get playing() { return !!this.src; }
  stop() {
    if (this.src) {
      try { this.src.stop(); } catch { /* already stopped */ }
      try { this.src.disconnect(); } catch { /* ignore */ }
    }
    this.src = null;
  }
}

let preview = null;
/** Plays a sound for a few seconds; calling again stops it. Returns true if now playing. */
export async function togglePreview(id) {
  if (preview) { stopPreview(); return false; }
  await unlockAudio();
  const buf = await loadSound(id);
  const c = audioCtx();
  const src = c.createBufferSource();
  src.buffer = buf;
  src.loop = true;
  const g = c.createGain();
  g.gain.value = 0.8;
  src.connect(g).connect(c.destination);
  src.start();
  const timer = setTimeout(stopPreview, Math.max(3500, Math.min(buf.duration * 1000, 6000)));
  preview = { src, timer };
  return true;
}
export function stopPreview() {
  if (!preview) return;
  clearTimeout(preview.timer);
  try { preview.src.stop(); } catch { /* ignore */ }
  preview = null;
}

/** Short "ding" for each rep. */
export function ding(high = false) {
  if (!audioRunning()) return;
  const c = audioCtx();
  const t = c.currentTime;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = "sine";
  o.frequency.setValueAtTime(high ? 1568 : 1175, t);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(0.5, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
  o.connect(g).connect(c.destination);
  o.start(t);
  o.stop(t + 0.4);
}

/** Little victory jingle. */
export function successJingle() {
  if (!audioRunning()) return;
  const c = audioCtx();
  const t = c.currentTime + 0.05;
  [72, 76, 79, 84].forEach((n, i) => {
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = "triangle";
    o.frequency.value = NOTE(n);
    const s = t + i * 0.12;
    g.gain.setValueAtTime(0, s);
    g.gain.linearRampToValueAtTime(0.4, s + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, s + (i === 3 ? 0.9 : 0.3));
    o.connect(g).connect(c.destination);
    o.start(s);
    o.stop(s + 1);
  });
}
