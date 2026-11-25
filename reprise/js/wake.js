// Keeps the screen on (night mode and while ringing).
// Uses the Screen Wake Lock API, with a silent looping video as a fallback for
// browsers that don't support it (older iPhones, some home-screen web apps).

let sentinel = null;
let wanted = false;
let video = null;
let onChange = () => {};

export function onWakeChange(fn) { onChange = fn; }
export function wakeActive() { return !!sentinel || !!(video && !video.paused); }

async function acquire() {
  if ("wakeLock" in navigator) {
    try {
      sentinel = await navigator.wakeLock.request("screen");
      sentinel.addEventListener("release", () => { sentinel = null; onChange(); });
      onChange();
      return true;
    } catch (e) {
      console.warn("Wake lock refused, using video fallback", e);
    }
  }
  return startVideo();
}

function startVideo() {
  if (!video) {
    video = document.createElement("video");
    video.setAttribute("playsinline", "");
    video.setAttribute("muted", "");
    video.muted = true;
    video.loop = true;
    video.src = new URL("../assets/keepawake.mp4", import.meta.url).href;
    Object.assign(video.style, { position: "fixed", width: "1px", height: "1px", opacity: "0.01", pointerEvents: "none", left: "0", top: "0" });
    document.body.appendChild(video);
  }
  return video.play().then(() => { onChange(); return true; }).catch(() => { onChange(); return false; });
}

/** Call from a user tap so the request is allowed. */
export async function keepAwake(on) {
  wanted = on;
  if (on) {
    if (!wakeActive()) await acquire();
  } else {
    if (sentinel) { try { await sentinel.release(); } catch { /* ignore */ } sentinel = null; }
    if (video) video.pause();
    onChange();
  }
  return wakeActive();
}

// The lock is dropped whenever the page is hidden; take it back when visible again.
document.addEventListener("visibilitychange", () => {
  if (wanted && document.visibilityState === "visible" && !wakeActive()) acquire();
});
