# RepRise ⏰💪

A free wake-up alarm that **won't stop ringing until you exercise in front of your phone's camera**: squats, push-ups, jumping jacks or dancing. You pick the exercise and how many (5, 10, 15, 20 or any custom number). The camera counts your reps on the phone itself, and the alarm stops only when you're done.

No account, no subscription, no ads. The camera video never leaves your phone.

## Features

- **Alarms**: any time, repeat on chosen days (or once), label, on/off switch.
- **Challenges**:
  - 🏋️ **Squats**: counts full reps from your knee angle; half squats don't count.
  - 💪 **Push-ups**: counts from your elbow angle (put the phone on the floor, side-on).
  - 🤸 **Jumping jacks**: arms down by your sides ↔ arms overhead.
  - 💃 **Dance**: a timer that only runs while you're really moving.
  - Amounts: 5 / 10 / 15 / 20 reps (10–30 s for dance) or a custom number.
- **Anti-snooze**: no dismiss or snooze button. The back button does nothing while it rings. If you close the app, it starts ringing again as soon as you reopen it, with your progress saved.
- **Anti-cheat** (Normal and Strict modes): bending your knees or waving your arms while lying in bed doesn't count, and standing arm curls don't count as push-ups.
- **Sounds**: six built-in alarm sounds (classic, fanfare, chimes, digital, siren, loud buzzer) or **your own audio file** (MP3/M4A/WAV). The volume can start softer and build up. It gets quieter while you're exercising and loud again if you stop or walk out of frame.
- **Night mode**: a dim bedside clock that keeps the screen awake, checks that the camera, sound and charger are ready, and slowly shifts position to prevent screen burn-in.
- **Practice mode**: try any challenge without the alarm to find the best spot for your phone.
- **Streaks and history** of your wake-ups.
- **Works offline** after the first load (installable as a home-screen app).
- **Backup**: if the camera fails (broken or permission blocked), you have to solve 3 maths problems instead.

## How to use it every night

1. Open RepRise, tap **+ Add alarm**, pick the time, exercise and amount, then **Save**.
2. Do a **Practice** run once to find a spot where the camera sees your whole body (1.5–2 m away, phone propped up).
3. At bedtime tap **🌙 Start night mode**, **plug in your charger**, and leave RepRise open. The screen goes nearly black.
4. When it rings: stand in front of the camera and do your reps. The alarm stops when you finish.

**Important:** phones don't let websites wake themselves up from sleep, so RepRise has to stay open on screen (night mode handles this). If you lock the phone or switch apps, the alarm can't ring.

## Put it on your phone (free hosting with GitHub Pages)

The camera only works over **https**, so the app needs to be hosted. GitHub Pages is free for this public repo:

1. On GitHub open **kaustubhd2019-spec/aaharwalk → Settings → Pages**.
2. Under **Build and deployment** choose **Source: Deploy from a branch**. Pick the branch that has the `reprise/` folder (`main` after merging, or `ccr-da27c825-ffmpyj`), folder **/ (root)**, then **Save**.
3. After a minute or two the app is live at
   **https://kaustubhd2019-spec.github.io/aaharwalk/reprise/**
   (your AaharWalk app will be at `…/aaharwalk/` too).
4. On your phone, open that link and **install** it:
   - **Android (Chrome)**: menu ⋮ → **Install app** / **Add to Home screen**.
   - **iPhone (Safari)**: Share → **Add to Home Screen**.
5. Open RepRise from the home-screen icon and allow camera access when asked.

### Phone settings that help

- Turn **media volume** up. On iPhone, also check that Settings → Safari → Camera is set to **Allow** so it doesn't ask every morning.
- If the screen still turns off in night mode, set Auto-Lock / Screen timeout to the longest option.
- If reps aren't being counted, improve the lighting, step back so your whole body is in view, or switch **Settings → Form strictness → Easy**.

## Privacy

Everything runs on your device. Pose detection uses Google's MediaPipe Pose Landmarker (Apache 2.0), bundled in `vendor/` and `models/`. Camera frames are processed in memory and never uploaded or saved. Alarms, history and your sound files are stored only in your browser.

## For developers

Plain HTML, CSS and JavaScript modules. No build step.

```
reprise/
  index.html, styles.css, manifest.webmanifest, sw.js
  js/app.js        UI, alarm scheduling, ringing session
  js/counters.js   rep counting for each exercise (pure logic)
  js/schedule.js   alarm time maths (pure logic)
  js/sound.js      synthesized alarm sounds, custom files, playback
  js/pose.js       camera + MediaPipe pose detection, skeleton drawing
  js/wake.js       keep the screen awake
  vendor/mediapipe @mediapipe/tasks-vision 0.10.35 (bundle + wasm)
  models/          pose_landmarker_lite.task
  tests/           unit tests (node --test) and a Playwright end-to-end script
```

- Run locally: `python3 -m http.server 8765` inside `reprise/`, then open http://localhost:8765 (localhost counts as secure, so the camera works).
- Unit tests: `node --test tests/*.test.mjs`
- End-to-end (headless Chromium with a fake camera video): see the header of `tests/e2e.cjs`.
- After changing any app file, bump `CACHE` in `sw.js` so installed copies update.
