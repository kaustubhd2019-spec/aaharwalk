// Camera + on-device pose detection (Google MediaPipe Pose Landmarker, bundled locally).
import { PoseLandmarker } from "../vendor/mediapipe/vision_bundle.mjs";

const url = p => new URL(p, import.meta.url).href;
const FILESET = {
  wasmLoaderPath: url("../vendor/mediapipe/wasm/vision_wasm_internal.js"),
  wasmBinaryPath: url("../vendor/mediapipe/wasm/vision_wasm_internal.wasm"),
};
const MODEL = url("../models/pose_landmarker_lite.task");

let landmarker = null;
let delegate = null;
let loading = null;

async function create(d) {
  return PoseLandmarker.createFromOptions(FILESET, {
    baseOptions: { modelAssetPath: MODEL, delegate: d },
    runningMode: "VIDEO",
    numPoses: 1,
    minPoseDetectionConfidence: 0.5,
    minPosePresenceConfidence: 0.5,
    minTrackingConfidence: 0.5,
  });
}

/** Loads the pose model once (GPU if possible, else CPU). Safe to call repeatedly. */
export function loadPose() {
  if (landmarker) return Promise.resolve(landmarker);
  if (!loading) {
    loading = (async () => {
      try {
        landmarker = await create("GPU");
        delegate = "GPU";
      } catch (e) {
        console.warn("GPU pose delegate unavailable, using CPU", e);
        landmarker = await create("CPU");
        delegate = "CPU";
      }
      return landmarker;
    })();
    loading.catch(() => { loading = null; });
  }
  return loading;
}

export const poseReady = () => !!landmarker;

async function fallbackToCpu() {
  try { landmarker?.close(); } catch { /* ignore */ }
  landmarker = await create("CPU");
  delegate = "CPU";
}

export async function startCamera(video, facing = "user") {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw Object.assign(new Error("This browser can't use the camera"), { name: "NotSupportedError" });
  }
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: false,
    video: {
      facingMode: facing,
      width: { ideal: 640 },
      height: { ideal: 480 },
      frameRate: { ideal: 30, max: 30 },
    },
  });
  video.srcObject = stream;
  video.muted = true;
  video.setAttribute("playsinline", "");
  await video.play().catch(() => {});
  if (!video.videoWidth) {
    await new Promise(r => video.addEventListener("loadedmetadata", r, { once: true }));
  }
  return stream;
}

export function stopCamera(stream, video) {
  stream?.getTracks().forEach(t => t.stop());
  if (video) video.srcObject = null;
}

/** Asks for camera permission now (e.g. at bedtime) so it doesn't prompt at 6 am. */
export async function checkCamera(facing = "user") {
  const v = document.createElement("video");
  const s = await startCamera(v, facing);
  stopCamera(s, v);
  return true;
}

export function cameraErrorText(e) {
  switch (e?.name) {
    case "NotAllowedError":
    case "SecurityError":
      return "Camera permission was blocked. Allow camera access for this site in your browser settings.";
    case "NotFoundError":
    case "OverconstrainedError":
      return "No camera found.";
    case "NotReadableError":
      return "The camera is being used by another app.";
    case "NotSupportedError":
      return isSecureContext
        ? "The camera isn't available. Check that camera access is allowed for this site."
        : "The camera only works over a secure https:// link. Open RepRise from its https address.";
    default:
      return e?.message || "Unknown camera error.";
  }
}

// Body connections for drawing (BlazePose topology, face points skipped).
const BONES = [
  [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],
  [11, 23], [12, 24], [23, 24],
  [23, 25], [25, 27], [24, 26], [26, 28],
  [27, 31], [28, 32], [27, 29], [28, 30],
];
const FOCUS = {
  squats: new Set([23, 24, 25, 26, 27, 28]),
  pushups: new Set([11, 12, 13, 14, 15, 16]),
  jacks: new Set([11, 12, 13, 14, 15, 16]),
  dance: new Set([13, 14, 15, 16, 25, 26, 27, 28]),
};

/** Runs detection on every new camera frame and reports landmarks. */
export class Tracker {
  constructor({ video, canvas, onFrame, challenge, showSkeleton = true }) {
    this.video = video;
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.onFrame = onFrame;
    this.focus = FOCUS[challenge] || new Set();
    this.showSkeleton = showSkeleton;
    this.running = false;
    this.lastVideoTime = -1;
    this.lastTs = 0;
    this.failures = 0;
    this.loop = this.loop.bind(this);
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.raf = requestAnimationFrame(this.loop);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  async loop() {
    if (!this.running) return;
    const v = this.video;
    if (landmarker && v.readyState >= 2 && v.videoWidth && v.currentTime !== this.lastVideoTime) {
      this.lastVideoTime = v.currentTime;
      let ts = performance.now();
      if (ts <= this.lastTs) ts = this.lastTs + 1;
      this.lastTs = ts;
      let lm = null;
      try {
        const res = landmarker.detectForVideo(v, ts);
        lm = res?.landmarks?.[0] || null;
        this.failures = 0;
      } catch (e) {
        console.warn("Pose detection error", e);
        if (++this.failures > 3 && delegate === "GPU") {
          this.running = false;
          try { await fallbackToCpu(); } catch (err) { console.error(err); }
          this.failures = 0;
          this.running = true;
        }
      }
      const aspect = v.videoWidth / v.videoHeight;
      this.draw(lm);
      try { this.onFrame(lm, ts, aspect); } catch (e) { console.error(e); }
    }
    if (this.running) this.raf = requestAnimationFrame(this.loop);
  }

  draw(lm) {
    const { canvas, ctx, video } = this;
    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!lm || !this.showSkeleton) return;
    const W = canvas.width, H = canvas.height;
    const lw = Math.max(3, W / 110);
    const visible = i => lm[i] && (lm[i].visibility ?? 1) > 0.5;
    ctx.lineCap = "round";
    for (const [a, b] of BONES) {
      if (!visible(a) || !visible(b)) continue;
      const hot = this.focus.has(a) && this.focus.has(b);
      ctx.strokeStyle = hot ? "rgba(255,170,80,0.95)" : "rgba(255,255,255,0.7)";
      ctx.lineWidth = hot ? lw * 1.5 : lw;
      ctx.beginPath();
      ctx.moveTo(lm[a].x * W, lm[a].y * H);
      ctx.lineTo(lm[b].x * W, lm[b].y * H);
      ctx.stroke();
    }
    for (let i = 11; i <= 28; i++) {
      if (!visible(i)) continue;
      ctx.fillStyle = this.focus.has(i) ? "#ffc95c" : "#ffffff";
      ctx.beginPath();
      ctx.arc(lm[i].x * W, lm[i].y * H, lw * (this.focus.has(i) ? 1.4 : 1), 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
