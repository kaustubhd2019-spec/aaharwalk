// End-to-end check in headless Chromium with a fake camera.
// Usage: serve reprise/ on http://127.0.0.1:8765, then
//   node tests/e2e.cjs <dance.mjpeg> <still.mjpeg> <screenshot-dir>
// The .mjpeg files are a looping video of a person (moving / standing still).
const { chromium } = require("playwright");
const assert = require("assert/strict");

const BASE = "http://127.0.0.1:8765/";
const [, , DANCE, STILL, OUT] = process.argv;

function hhmm(d) {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

async function open(video, { fakeUi = true, autoplay = true, camera = true } = {}) {
  const args = ["--use-fake-device-for-media-stream", `--use-file-for-fake-video-capture=${video}`];
  if (fakeUi) args.push("--use-fake-ui-for-media-stream");
  if (autoplay) args.push("--autoplay-policy=no-user-gesture-required");
  const browser = await chromium.launch({ args });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
    permissions: camera ? ["camera"] : [],
    serviceWorkers: "block",
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", e => errors.push(`pageerror: ${e.message}`));
  page.on("console", m => {
    if (m.type() === "error") errors.push(`console: ${m.text()}`);
    if (/delegate|GPU|CPU/i.test(m.text())) console.log("   [browser]", m.text().slice(0, 140));
  });
  return { browser, context, page, errors };
}

async function shot(page, name) {
  if (OUT) await page.screenshot({ path: `${OUT}/${name}.png` });
}

async function testFullAlarmFlow() {
  console.log("1) Full flow: create alarm -> night mode -> rings -> dance -> stops");
  const { browser, page, errors } = await open(DANCE);
  await page.goto(BASE);
  await page.waitForSelector("#view-home:not([hidden])");
  await shot(page, "01-home-empty");

  await page.click("#btn-add");
  await page.waitForSelector("#view-edit:not([hidden])");
  const ringAt = new Date(Date.now() + 60000);
  await page.fill("#f-time", hhmm(ringAt));
  await page.click(".challenge:has-text('Dance')");
  await page.click(".chip:has-text('10 s')");
  await page.fill("#f-label", "Morning dance <b>party</b>");
  await shot(page, "02-editor");
  await page.click("#edit-save");
  await page.waitForSelector("#view-home:not([hidden])");
  const label = await page.textContent(".alarm-meta");
  assert.ok(label.includes("<b>party</b>"), "label is shown as text, not HTML");
  await page.waitForTimeout(300);
  await shot(page, "03-home-with-alarm");

  await page.click("#btn-night");
  await page.waitForSelector("#view-night:not([hidden])");
  const okCheck = text => [...document.querySelectorAll("#night-checks li.ok")].some(li => li.textContent === text);
  await page.waitForFunction(`(${okCheck})("Camera ready")`, null, { timeout: 30000 });
  await page.waitForFunction(`(${okCheck})("Exercise detector loaded")`, null, { timeout: 60000 });
  await shot(page, "04-night");

  console.log(`   waiting for the alarm at ${hhmm(ringAt)}…`);
  await page.waitForSelector("#view-ring:not([hidden])", { timeout: 80000 });
  const ringStarted = await page.evaluate(() => window.RepRise.state.session.startedAt);
  await page.waitForTimeout(1500);
  const audio = await page.evaluate(() => {
    const s = window.RepRise.state.session;
    return { playing: !!s?.player?.playing, real: s?.real, saved: !!localStorage.getItem("reprise.ringing") };
  });
  console.log("   ringing:", audio);
  assert.equal(audio.playing, true, "alarm sound is playing");
  assert.equal(audio.saved, true, "ringing state persisted (survives reload)");

  // Back button must not escape a real alarm.
  await page.goBack().catch(() => {});
  await page.waitForTimeout(300);
  assert.equal(await page.isVisible("#view-ring"), true, "back button doesn't dismiss the alarm");

  await page.waitForFunction(() => Number(document.getElementById("count-now").textContent) >= 3, null, { timeout: 40000 });
  const mid = await page.evaluate(() => {
    const s = window.RepRise.state.session;
    return { count: s.counter.count, energy: +s.counter.energy.toFixed(2), coach: document.getElementById("coach").textContent, ducked: s.ducked };
  });
  console.log("   mid-challenge:", mid);
  await shot(page, "05-ringing");

  await page.waitForSelector("#view-done:not([hidden])", { timeout: 60000 });
  console.log(`   challenge done ${Math.round((Date.now() - ringStarted) / 1000)} s after ringing started`);
  await shot(page, "06-done");
  const after = await page.evaluate(() => ({
    history: JSON.parse(localStorage.getItem("reprise.history") || "[]"),
    ringing: localStorage.getItem("reprise.ringing"),
    session: !!window.RepRise.state.session,
    camTracks: document.getElementById("cam").srcObject,
  }));
  console.log(`   recorded: ${after.history[0]?.secs} s from ringing to done (dance target 10 s)`);
  assert.ok(after.history[0].secs >= 10, "a 10 s dance can't finish in under 10 s");
  assert.equal(after.history.length, 1, "wake-up recorded");
  assert.equal(after.ringing, null, "ringing state cleared");
  assert.equal(after.session, false);
  assert.equal(after.camTracks, null, "camera released");
  await page.click("#btn-done");
  await page.waitForSelector("#view-home:not([hidden])");
  assert.equal((await page.textContent("#stat-streak")).trim(), "1");
  await shot(page, "07-home-after");
  assert.deepEqual(errors.filter(e => !/favicon/.test(e)), [], "no page errors");
  await browser.close();
}

async function testStillPersonDoesNotStop() {
  console.log("2) Standing still must not finish a dance; reload while ringing resumes the alarm");
  const { browser, page, errors } = await open(STILL);
  await page.goto(BASE);
  await page.waitForSelector("#view-home:not([hidden])");
  // Start a real alarm directly.
  await page.evaluate(() => window.RepRise.startRing({ id: "x", hour: 6, minute: 0, days: [], label: "", enabled: true, challenge: "dance", target: 10, sound: "buzzer", vibrate: false }));
  await page.waitForSelector("#view-ring:not([hidden])");
  await page.waitForFunction(() => window.RepRise.state.session?.tracker, null, { timeout: 60000 });
  await page.waitForTimeout(8000);
  const st = await page.evaluate(() => {
    const s = window.RepRise.state.session;
    return { activeMs: Math.round(s.counter.activeMs), energy: +s.counter.energy.toFixed(3), coach: document.getElementById("coach").textContent, stage: document.getElementById("stage-msg").textContent };
  });
  console.log("   after 8 s standing still:", st);
  assert.ok(st.activeMs < 1500, "standing still barely moves the timer");
  await shot(page, "08-still");

  await page.reload();
  await page.waitForSelector("#view-ring:not([hidden])", { timeout: 10000 });
  console.log("   reload -> alarm view is back:", await page.textContent("#ring-label"));
  assert.deepEqual(errors, [], "no page errors");
  await browser.close();
}

async function testTapToStartWithoutAutoplay() {
  console.log("3) Resumed alarm without autoplay permission shows 'Tap to start'");
  const { browser, context, page } = await open(STILL, { autoplay: false });
  // Headless Chromium lets audio start without a tap; phones don't. Simulate the phone rule:
  // an AudioContext stays suspended until resume() is called during a real tap.
  await context.addInitScript(() => {
    const Orig = window.AudioContext;
    class PhoneLikeAudioContext extends Orig {
      constructor(o) { super(o); this._unlocked = navigator.userActivation.isActive; if (!this._unlocked) super.suspend(); }
      get state() { return this._unlocked ? super.state : "suspended"; }
      resume() {
        if (navigator.userActivation.isActive) { this._unlocked = true; return super.resume(); }
        return new Promise(() => {});
      }
    }
    window.AudioContext = PhoneLikeAudioContext;
  });
  await page.goto(BASE);
  await page.evaluate(() => localStorage.setItem("reprise.ringing", JSON.stringify({
    alarm: { id: "x", hour: 6, minute: 0, days: [], label: "", enabled: true, challenge: "squats", target: 5, sound: "classic", vibrate: false },
    startedAt: Date.now(), progress: 2,
  })));
  await page.reload();
  await page.waitForSelector("#view-ring:not([hidden])");
  await page.waitForSelector("#tap-overlay:not([hidden])", { timeout: 5000 });
  await page.waitForTimeout(6000); // give the sound loader time; overlay must stay
  assert.equal(await page.isVisible("#tap-overlay"), true, "overlay stays until tapped");
  assert.equal(await page.evaluate(() => window.RepRise.state.session.player?.playing ?? false), false, "no sound before tap");
  assert.equal((await page.textContent("#count-now")).trim(), "2", "progress restored after reload");
  await shot(page, "09-tap-to-start");
  await page.click("#tap-overlay");
  await page.waitForTimeout(800);
  const playing = await page.evaluate(() => window.RepRise.state.session.player.playing);
  console.log("   overlay shown until tapped; after tap, sound playing:", playing);
  assert.equal(playing, true);
  assert.equal(await page.isVisible("#tap-overlay"), false);
  await browser.close();
}

async function testCameraBlockedFallback() {
  console.log("4) Camera blocked -> backup maths challenge stops the alarm");
  const { browser, page } = await open(STILL, { fakeUi: false, camera: false });
  await page.goto(BASE);
  await page.evaluate(() => window.RepRise.startRing({ id: "y", hour: 6, minute: 0, days: [], label: "", enabled: true, challenge: "squats", target: 10, sound: "classic", vibrate: false }));
  await page.waitForSelector("#fallback:not([hidden])", { timeout: 15000 });
  console.log("   reason:", await page.textContent("#fallback-reason"));
  await shot(page, "10-fallback");
  for (let i = 0; i < 3; i++) {
    const q = (await page.textContent("#math-q")).replace("= ?", "").replace("×", "*");
    // eslint-disable-next-line no-eval
    const ans = eval(q);
    await page.fill("#math-a", String(ans));
    await page.click("#math-go");
  }
  await page.waitForSelector("#view-done:not([hidden])", { timeout: 5000 });
  console.log("   done:", await page.textContent("#done-detail"));
  await browser.close();
}

async function testSettingsAndPractice() {
  console.log("5) Settings screen and practice mode render");
  const { browser, page, errors } = await open(DANCE);
  await page.goto(BASE);
  await page.click("#btn-settings");
  await page.waitForSelector("#view-settings:not([hidden])");
  await page.click("#s-strictness button[data-v='easy']");
  assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem("reprise.settings")).strictness), "easy");
  await shot(page, "11-settings");
  await page.click("#settings-back");

  // Night mode on/off must really release the screen lock.
  await page.evaluate(() => {
    localStorage.setItem("reprise.alarms", JSON.stringify([{ id: "n", hour: 5, minute: 0, days: [], label: "", enabled: true, challenge: "squats", target: 5, sound: "classic", vibrate: false }]));
  });
  await page.reload();
  await page.click("#btn-night");
  await page.waitForSelector("#view-night:not([hidden])");
  await page.waitForTimeout(1500);
  const awakeOn = await page.evaluate(() => !!document.querySelector("video[src$='keepawake.mp4']") && !document.querySelector("video[src$='keepawake.mp4']").paused);
  await page.click("#btn-night-exit");
  await page.waitForTimeout(800);
  const awakeOff = await page.evaluate(() => { const v = document.querySelector("video[src$='keepawake.mp4']"); return !!v && !v.paused; });
  console.log(`   screen kept awake in night mode: ${awakeOn}, after exit: ${awakeOff}`);
  assert.equal(awakeOn, true);
  assert.equal(awakeOff, false, "exiting night mode releases the keep-awake");

  await page.click(".practice-btn:has-text('Dance')");
  await page.waitForSelector("#view-ring:not([hidden])");
  assert.equal(await page.isVisible("#btn-ring-quit"), true, "practice can be quit");
  await page.waitForSelector("#view-done:not([hidden])", { timeout: 60000 });
  console.log("   practice done:", await page.textContent("#done-detail"));
  assert.deepEqual(errors, [], "no page errors");
  await browser.close();
}

async function testOfflineAfterInstall() {
  console.log("6) Works offline once the service worker has cached everything");
  // Own static server, so we can really switch it off.
  const http = require("http"), fs = require("fs"), path = require("path");
  const root = path.join(__dirname, "..");
  const types = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".wasm": "application/wasm", ".webmanifest": "application/manifest+json", ".svg": "image/svg+xml", ".png": "image/png", ".mp4": "video/mp4" };
  const server = http.createServer((req, res) => {
    let f = path.join(root, decodeURIComponent(new URL(req.url, "http://x").pathname));
    if (f.endsWith("/")) f += "index.html";
    if (!f.startsWith(root) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { "content-type": types[path.extname(f)] || "application/octet-stream" });
    fs.createReadStream(f).pipe(res);
  });
  await new Promise(r => server.listen(8766, "127.0.0.1", r));
  const browser = await chromium.launch({ args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream", `--use-file-for-fake-video-capture=${DANCE}`] });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, permissions: ["camera"] });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", e => errors.push(e.message));
  await page.goto("http://127.0.0.1:8766/");
  await page.waitForFunction(async () => {
    const keys = await caches.keys();
    const k = keys.find(x => x.startsWith("reprise-"));
    return !!navigator.serviceWorker.controller && k && (await (await caches.open(k)).keys()).length >= 21;
  }, null, { timeout: 30000 });
  await page.waitForTimeout(2000); // let the service worker finish activating
  server.closeAllConnections?.();
  await new Promise(r => server.close(r));
  await page.reload();
  await page.waitForSelector("#view-home:not([hidden])");
  await page.click(".practice-btn:has-text('Dance')");
  await page.waitForSelector("#view-done:not([hidden])", { timeout: 60000 });
  console.log("   with the server switched off, practice still works:", await page.textContent("#done-detail"));
  assert.deepEqual(errors, [], "no page errors offline");
  await browser.close();
}

(async () => {
  const which = process.env.ONLY ? process.env.ONLY.split(",").map(Number) : [1, 2, 3, 4, 5, 6];
  const tests = [null, testFullAlarmFlow, testStillPersonDoesNotStop, testTapToStartWithoutAutoplay, testCameraBlockedFallback, testSettingsAndPractice, testOfflineAfterInstall];
  for (const i of which) await tests[i]();
  console.log("All e2e checks passed");
})().catch(e => { console.error("E2E FAILED:", e); process.exit(1); });
