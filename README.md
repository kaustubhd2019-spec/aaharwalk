# AaharWalk

A private, offline-first coach for **Indian and Maharashtrian eating, daily walking, water and short home workouts**.

It is not a generic calorie counter. You type what you ate the way you'd say it —
`2 bhakri, 1 वाटी मटकीची उसळ, half bowl bhendi` — and it works out the plate.

Everything runs in the browser on your own device. No account, no server, nothing uploaded.

---

## What it does

**Daily targets from your own numbers.** BMR (Mifflin–St Jeor) → maintenance calories →
a *sustainable* calorie target with hard safety floors, plus protein, fibre, water and a
step goal that ramps up from where you actually are instead of demanding 10,000 on day one.

**Food logging in the language you think in.** English, Marathi, Devanagari, or a mix:

| You type | It understands |
| --- | --- |
| `2 bhakri + 1 bowl matki usal` | 2 × Jowar Bhakri, 1 bowl Matki Usal |
| `आज २ भाकरी आणि एक वाटी मटकीची उसळ खाल्ली` | same, plus strips the sentence around it |
| `आज lunch ला 2 poli आणि 1 वाटी वरण खाल्लं` | also files it under lunch |
| `1 katori rajma 1 bowl brown rice` | splits two dishes out of one phrase |
| `rice 150g` · `bhakri 120g` | weighed portions |
| `bhakari 2` | forgives the spelling |
| `1 bowl usal` | asks *which* usal — unless it already knows yours |

Portions in pieces, bowls, वाटी, katori, plates, glasses, spoons, slices or grams.
Cooking oil is a first-class input: **less oil / normal / extra oil** genuinely changes
the number, because each dish records how much oil a usual recipe carries.

**240 foods with full macros** — Maharashtrian (bhakri, thalipeeth, usal, pithla, zunka,
bharli vangi, misal, puran poli, modak…), the rest of India, plus everyday fruit, dairy,
nuts, eggs, chicken, fish and sweets. Each row has calories, protein, carbs, fat, fibre,
serving weight, typical oil, a heart-friendliness score, a Marathi name and alias lists.

**A meal planner that eats what you eat.** It builds real plates from 45 templates,
scales the bhakri/poli/rice to fit the calories left, avoids what you had yesterday,
respects vegetarian / eggetarian / non-vegetarian and your allergy list, and leans toward
the cuisines you actually cook. It will not keep suggesting oats and quinoa.

**15–20 minute home workouts.** A 7-day rotation across cardio, strength, yoga and mobility,
adapted to your level, age, equipment and how the last session felt, with a full-screen
timer, cues for every move and deliberately conservative calorie estimates.

**Step counting on the phone itself** (see below), plus water, weight and a weekly report, plus a coach panel that says something
specific about today rather than cheering. Never any shaming language.

**English and Marathi** throughout, switchable at any time.

---

## Steps: three ways in

**1. The app counts them itself.** Tap **Count my walk** and the phone's accelerometer
counts your steps live — distance, time and calories alongside, with progress toward
today's goal. It takes a screen wake lock, so you can pocket the phone and keep walking.
There is a sensitivity setting if it over- or under-counts for the way you carry it.

The honest limit: **a web app cannot count in the background.** Browsers suspend sensor
events the moment the page is hidden or the screen locks — there is no API around this
short of a native app. So Walk mode covers deliberate walks, not your whole day.

Motion sensors also need a secure page, so this works on `https://` or `localhost`.
On iPhone the browser asks permission the first time you tap Start.

**2. Share from the app you already use.** Once AaharWalk is installed to your home screen
it registers as an Android share target. In **Step Set Go**, tap Share on today's steps →
choose AaharWalk. The count is read out of the shared text and pre-filled. Google Fit and
Samsung Health work the same way.

**3. Paste or type.** Copy anything containing the number — `Today · 11,208 steps · 5.4 km`,
`आज ८४२० पावलं` — and paste it into the steps sheet; the number gets picked out. Or just
type it. Pick your source once and the right instructions stick.

Steps the app counted itself are credited separately on the Activity screen, so you can
see how much of the day's total came from Walk mode.

## Tests

```
node tests/run.mjs
```

49 checks over the parser, the oil model, food-data integrity, target maths, the planner,
workout generation, step import and the pedometer (against synthetic accelerometer
traces at several walking cadences). No dependencies.

## Running it

Because the app is built from ES modules, it needs to be served over http — browsers block
modules on `file://` pages. From this folder:

```
python3 -m http.server 8000
```

then open `http://localhost:8000`. (If you open `index.html` directly, the app tells you this.)

For a phone, host the folder on any HTTPS static host — Netlify, GitHub Pages, Vercel,
Firebase Hosting — then follow [`INSTALL_MOBILE.md`](INSTALL_MOBILE.md). It installs as a PWA
with its own icon and works offline.

Add `?demo=1` to the URL on a fresh install to load a realistic sample fortnight.

---

## How it is put together

Plain ES modules, no build step, no dependencies.

```
index.html · styles.css · sw.js · pwa.js · manifest.webmanifest
src/
  core/     util.js  store.js (localStorage + migrations)  i18n.js (en/mr)
  data/     foods.js (240 foods)   units.js   exercises.js (53 moves)
            mealIdeas.js (45 plates)   demo.js
  engine/   parser.js       natural language → structured items
            nutrition.js    items → calories, with the oil model
            targets.js      BMR, TDEE, calorie/protein/fibre/water/step targets
            planner.js      meal suggestions and the day plan
            workouts.js     daily session builder
            coach.js        the coaching voice (bilingual)
            session.js      assembles "what does today look like"
            steps-import.js reading a step count out of shared or pasted text
            pedometer.js    counting steps from the accelerometer
  ui/       components.js  onboarding.js  home.js  food.js
            activity.js  plan.js  profile.js  workout.js  walk.js
  main.js   routing and the app shell
```

The split that matters: **the parser decides *what* and *how much*; the database decides
*how many calories*.** Logging the same meal twice always gives the same number.

### How the numbers are worked out

- **BMR** — Mifflin–St Jeor.
- **Maintenance** — BMR × an activity factor, adjusted by your recent daily steps
  (≈ 0.00045 kcal per step per kg).
- **Calorie target** — maintenance minus at most 20% (and never more than 500 kcal) for fat
  loss, with a floor of the higher of BMR × 1.05 or 1,200 / 1,500 kcal. No crash diets.
  Nudged by ±100–120 kcal if your weight trend disagrees with the maths.
- **Protein** 1.2–1.7 g per kg (of target weight) · **fibre** 14 g per 1,000 kcal ·
  **water** ~30 ml per kg plus an allowance for walking.
- **Steps** — start from your own baseline and add 1,000 a week toward a sustainable ceiling.
  Today's own steps never move today's goal.
- **Step detection** — gravity removed with a slow moving average, an adaptive threshold
  from the recent swing of the signal, and peak counting with hysteresis and a 260 ms
  minimum gap. The first few detections are held back until the cadence looks like real
  walking, so picking the phone up does not add steps. Distance uses a stride of
  0.414 × height.
- **Food** — per-serving values from common Indian food-composition references. The oil
  slider scales the fat already in the recipe (0.45× / 1× / 1.8×) at 9 kcal per gram.
- **Workouts** — MET-based, counting rest at a resting MET and rounding *down*.

Everything is rounded to avoid false precision: you see `≈ 350 kcal`, never `347 kcal`.
Estimates the app is genuinely unsure about are marked, and you can correct any of them.

---

## Your data

Stored in this browser's `localStorage` and nowhere else. No account, no analytics, no network
calls. **Profile → Your data** exports a full JSON backup and restores one — do that before
changing phones or clearing browser data.

---

## Important

AaharWalk gives **estimates**, not medical advice, and does not diagnose anything.
If you have a medical condition, take medication, are pregnant, have a history of disordered
eating, or your doctor has set you specific dietary limits, follow your doctor's advice.
