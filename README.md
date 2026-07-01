# AaharWalk

A local-first browser app for three daily tracking needs:

1. BMI-based walking target for a desired weight goal.
2. Calories burned from daily steps, with saved history.
3. Indian meal calorie estimates from count-based servings such as `2 chapati`, `1 bowl dal`, `1 वाटी भात`, `ek kela`, or `1 कटोरी rajma`.

## How to run

Open `index.html` in any modern browser for testing.

For normal mobile installation, host this folder on HTTPS and follow `INSTALL_MOBILE.md`.

No server, login, database, or internet connection is required. Data is saved in the same browser using `localStorage`.

## What is included

- Height in feet/inches, current weight kg, target weight kg.
- Current and target BMI.
- Standard adult BMI categories and an optional Indian/South-Asian risk view.
- Daily walking target in steps and minutes.
- Daily steps calorie calculator.
- Step history table, 14-log bar chart, CSV export.
- Meal parser for English, Hindi, Marathi/Devanagari names and common transliterations.
- Built-in database of common Indian dals, sabzi/bhaji, breads, rice dishes, salads, fruits, snacks, dairy, and sweets.
- Custom food entries with aliases.
- Meal history and CSV export.
- Full JSON backup/restore.

## Calculation notes

- BMI = weight in kg / height in m².
- Step calories use: `Calories = MET × 3.5 × body weight kg / 200 × minutes`.
- Steps are converted to minutes using a practical cadence assumption by pace.
- Weight-loss planning uses the common approximation of 7,700 kcal per kg of body weight change. This is useful for planning, but real weight change is not perfectly linear.
- Meal calories are approximate per common home-style serving. Oil, ghee, sugar, recipe, and bowl size can change calories a lot.

## Safety notes

This app is for estimates and habit tracking. It is not medical advice. For pregnancy, chronic medical conditions, eating disorder history, pain, injury, dizziness, or aggressive weight-loss targets, consult a qualified clinician.

## Files

- `index.html` — app interface.
- `styles.css` — responsive styling.
- `food-data.js` — editable built-in Indian food database.
- `app.js` — app logic, parser, calculations, local storage, exports.
- `manifest.webmanifest` and `assets/icon.svg` — install metadata/icon.


## Mobile app package

This version includes `manifest.webmanifest`, PNG app icons, `sw.js`, and `pwa.js` so it can be installed as a PWA after hosting on HTTPS.
