
/* AaharWalk — local-first browser app */
(function () {
  "use strict";

  const STORAGE = {
    profile: "aaharwalk.profile.v1",
    steps: "aaharwalk.steps.v1",
    meals: "aaharwalk.meals.v1",
    customFoods: "aaharwalk.customFoods.v1"
  };

  const PACE = {
    slow: { label: "Slow", met: 2.8, cadence: 80, description: "easy stroll" },
    moderate: { label: "Moderate", met: 3.8, cadence: 100, description: "normal walk" },
    brisk: { label: "Brisk", met: 4.8, cadence: 115, description: "exercise walk" },
    verybrisk: { label: "Very brisk", met: 5.5, cadence: 125, description: "fast walk" }
  };

  const BMI_STANDARD = [
    { max: 18.5, label: "Underweight", tone: "warn" },
    { max: 25, label: "Healthy weight", tone: "good" },
    { max: 30, label: "Overweight", tone: "warn" },
    { max: 35, label: "Obesity class I", tone: "danger" },
    { max: 40, label: "Obesity class II", tone: "danger" },
    { max: Infinity, label: "Obesity class III", tone: "danger" }
  ];

  const BMI_INDIAN_RISK = [
    { max: 18.5, label: "Underweight", tone: "warn" },
    { max: 23, label: "Lower-risk range", tone: "good" },
    { max: 25, label: "Increased-risk range", tone: "warn" },
    { max: Infinity, label: "Higher-risk range", tone: "danger" }
  ];

  const DIGITS = {
    "०": "0", "१": "1", "२": "2", "३": "3", "४": "4",
    "५": "5", "६": "6", "७": "7", "८": "8", "९": "9",
    "٠": "0", "١": "1", "٢": "2", "٣": "3", "٤": "4",
    "٥": "5", "٦": "6", "٧": "7", "٨": "8", "٩": "9"
  };

  const NUMBER_WORDS = new Map(Object.entries({
    "one": 1, "ek": 1, "eka": 1, "aik": 1, "एक": 1, "१": 1,
    "two": 2, "do": 2, "don": 2, "दोन": 2, "दो": 2,
    "three": 3, "teen": 3, "तीन": 3,
    "four": 4, "char": 4, "chaar": 4, "चार": 4,
    "five": 5, "panch": 5, "paanch": 5, "pach": 5, "पांच": 5, "पाँच": 5, "पाच": 5,
    "six": 6, "chhe": 6, "che": 6, "saha": 6, "छह": 6, "छे": 6, "सहा": 6,
    "seven": 7, "saat": 7, "सात": 7,
    "eight": 8, "aath": 8, "आठ": 8,
    "nine": 9, "nau": 9, "नौ": 9, "नऊ": 9,
    "ten": 10, "dus": 10, "das": 10, "daha": 10, "दस": 10, "दहा": 10
  }));

  const HALF_WORDS = ["half", "aadha", "adha", "adhi", "ardha", "ardhi", "आधा", "आधी", "अर्धा", "अर्धी", "अर्धे"];
  const QUARTER_WORDS = ["quarter", "paav", "pav", "पाव", "चौथाई", "चतुर्थांश"];
  const UNIT_WORDS = [
    "bowl", "bowls", "katori", "katoris", "vati", "wati", "watis", "vaati", "cup", "cups",
    "plate", "plates", "piece", "pieces", "pcs", "glass", "glasses", "serving", "servings",
    "medium", "small", "large", "big", "little", "कटोरी", "कटोरा", "वाटी", "वाती", "कप",
    "प्लेट", "ग्लास", "टुकड़ा", "तुकडा", "वाट्या", "बाउल", "मध्यम", "छोटा", "छोटी", "मोठा", "मोठी", "बड़ा", "बडी", "बड़ी"
  ];
  const FILLER_WORDS = [
    "of", "and", "with", "without", "ka", "ki", "ke", "cha", "chi", "che", "चा", "ची", "चे", "का", "की", "के", "एक", "एका"
  ];

  const qs = (selector, root = document) => root.querySelector(selector);
  const qsa = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  const state = {
    profile: {},
    steps: [],
    meals: [],
    customFoods: [],
    foods: [],
    indexedFoods: [],
    lastMealEstimate: null
  };

  function readJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (err) {
      console.warn("Storage read failed", key, err);
      return fallback;
    }
  }

  function writeJSON(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function uid() {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }

  function escapeHTML(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function toNumber(value, fallback = 0) {
    const n = Number(String(value ?? "").replace(/,/g, ""));
    return Number.isFinite(n) ? n : fallback;
  }

  function round(value, digits = 0) {
    const f = Math.pow(10, digits);
    return Math.round((value + Number.EPSILON) * f) / f;
  }

  function formatNumber(value, digits = 0) {
    if (!Number.isFinite(value)) return "—";
    return new Intl.NumberFormat("en-IN", {
      maximumFractionDigits: digits,
      minimumFractionDigits: digits
    }).format(value);
  }

  function todayISO() {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    return new Date(now.getTime() - offset * 60_000).toISOString().slice(0, 10);
  }

  function replaceLocaleDigits(value) {
    return String(value ?? "").replace(/[०-९٠-٩]/g, d => DIGITS[d] ?? d);
  }

  function normalizeText(value) {
    return replaceLocaleDigits(value)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[’'`]/g, "")
      .replace(/[|/\\()[\]{}:;!?]+/g, " ")
      .replace(/[.,]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function tokenize(value) {
    const normalized = normalizeText(value);
    return normalized ? normalized.split(/\s+/).filter(Boolean) : [];
  }

  function stripForFoodMatch(value) {
    const tokens = tokenize(value);
    const removable = new Set([...UNIT_WORDS, ...FILLER_WORDS, ...HALF_WORDS, ...QUARTER_WORDS]);
    return tokens
      .filter(token => !/^\d+(\.\d+)?$/.test(token))
      .filter(token => !NUMBER_WORDS.has(token))
      .filter(token => !removable.has(token))
      .join(" ")
      .trim();
  }

  function classifyBMI(bmi, indianRisk = false) {
    const table = indianRisk ? BMI_INDIAN_RISK : BMI_STANDARD;
    return table.find(row => bmi < row.max) ?? table[table.length - 1];
  }

  function heightMeters(feet, inches) {
    const totalInches = toNumber(feet) * 12 + toNumber(inches);
    return totalInches > 0 ? totalInches * 0.0254 : 0;
  }

  function bmi(weightKg, meters) {
    return meters > 0 ? weightKg / (meters * meters) : NaN;
  }

  function caloriesFromSteps(steps, weightKg, paceKey) {
    const pace = PACE[paceKey] || PACE.moderate;
    const minutes = steps / pace.cadence;
    const calories = pace.met * 3.5 * weightKg / 200 * minutes;
    return { calories, minutes, pace };
  }

  function stepsForCalories(kcal, weightKg, paceKey) {
    const pace = PACE[paceKey] || PACE.moderate;
    const kcalPerStep = caloriesFromSteps(1000, weightKg, paceKey).calories / 1000;
    const steps = kcalPerStep > 0 ? kcal / kcalPerStep : NaN;
    const minutes = steps / pace.cadence;
    return { steps, minutes, kcalPerStep, pace };
  }

  function buildFoodsIndex() {
    const baseFoods = Array.isArray(window.BASE_FOODS) ? window.BASE_FOODS : [];
    state.foods = [...baseFoods, ...state.customFoods];
    state.indexedFoods = state.foods.map(food => {
      const aliases = new Set([food.name, ...(food.aliases || [])]);
      const normAliases = Array.from(aliases)
        .map(alias => normalizeText(alias))
        .filter(Boolean)
        .sort((a, b) => b.length - a.length);
      return { ...food, normAliases };
    });
  }

  function levenshtein(a, b) {
    if (a === b) return 0;
    if (!a || !b) return Math.max(a.length, b.length);
    const dp = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
    for (let i = 0; i <= a.length; i++) dp[i][0] = i;
    for (let j = 0; j <= b.length; j++) dp[0][j] = j;
    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,
          dp[i][j - 1] + 1,
          dp[i - 1][j - 1] + cost
        );
      }
    }
    return dp[a.length][b.length];
  }

  function scoreFoodMatch(cleaned, original, food) {
    const line = normalizeText(original);
    const clean = normalizeText(cleaned);
    if (!clean) return { score: 0, alias: "" };

    let best = { score: 0, alias: "" };
    for (const alias of food.normAliases) {
      if (!alias || alias.length < 2) continue;
      let score = 0;

      if (clean === alias) score = 1200 + alias.length;
      else if (clean.includes(alias)) score = 950 + alias.length;
      else if (alias.includes(clean) && clean.length >= 3) score = 650 + clean.length;
      else if (line.includes(alias)) score = 700 + alias.length;
      else {
        const cleanTokens = new Set(clean.split(/\s+/));
        const aliasTokens = alias.split(/\s+/);
        const overlap = aliasTokens.filter(t => cleanTokens.has(t)).length;
        if (overlap) score = 300 + overlap * 80 + alias.length;

        if (clean.length >= 4 && alias.length >= 4) {
          const dist = levenshtein(clean, alias);
          const ratio = dist / Math.max(clean.length, alias.length);
          if (ratio <= 0.28) score = Math.max(score, 520 - Math.round(ratio * 300) + alias.length);
        }
      }

      if (score > best.score) best = { score, alias };
    }

    return best;
  }

  function findFood(line) {
    const cleaned = stripForFoodMatch(line);
    const candidates = state.indexedFoods
      .map(food => ({ food, match: scoreFoodMatch(cleaned, line, food) }))
      .filter(item => item.match.score > 0)
      .sort((a, b) => {
        if (b.match.score !== a.match.score) return b.match.score - a.match.score;
        return (b.match.alias?.length || 0) - (a.match.alias?.length || 0);
      });

    const best = candidates[0];
    if (!best || best.match.score < 300) {
      return { food: null, cleaned, confidence: "none", alternatives: candidates.slice(0, 3) };
    }

    let confidence = "high";
    if (best.match.score < 600) confidence = "low";
    else if (best.match.score < 900) confidence = "medium";

    return {
      food: best.food,
      cleaned,
      confidence,
      alternatives: candidates.slice(1, 4)
    };
  }

  function parseQuantity(line) {
    const rawForFractions = replaceLocaleDigits(line).toLowerCase();
    const norm = normalizeText(line);
    const tokens = tokenize(norm);
    let quantity = null;

    const fraction = rawForFractions.match(/(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)/);
    if (fraction) {
      const numerator = Number(fraction[1]);
      const denominator = Number(fraction[2]);
      if (denominator) quantity = numerator / denominator;
    }

    if (quantity === null) {
      const mixed = norm.match(/(\d+(?:\.\d+)?)\s*(?:and|aur|आणि|और)\s*(?:half|aadha|adha|आधा|अर्धा|अर्धी)/);
      if (mixed) quantity = Number(mixed[1]) + 0.5;
    }

    if (quantity === null) {
      const numeric = norm.match(/\b(\d+(?:\.\d+)?)\b/);
      if (numeric) quantity = Number(numeric[1]);
    }

    if (quantity === null) {
      for (const token of tokens) {
        if (NUMBER_WORDS.has(token)) {
          quantity = NUMBER_WORDS.get(token);
          break;
        }
      }
    }

    if (quantity === null) {
      if (tokens.some(t => HALF_WORDS.includes(t))) quantity = 0.5;
      else if (tokens.some(t => QUARTER_WORDS.includes(t))) quantity = 0.25;
    }

    if (quantity === null || !Number.isFinite(quantity) || quantity <= 0) quantity = 1;

    let sizeFactor = 1;
    if (tokens.some(t => ["small", "छोटा", "छोटी", "लहान"].includes(t))) sizeFactor *= 0.75;
    if (tokens.some(t => ["large", "big", "मोठा", "मोठी", "बड़ा", "बडी", "बड़ी"].includes(t))) sizeFactor *= 1.35;
    if (tokens.some(t => HALF_WORDS.includes(t)) && !norm.match(/\b(\d+(?:\.\d+)?)\b/) && quantity !== 0.5) sizeFactor *= 0.5;

    return { quantity: quantity * sizeFactor, rawQuantity: quantity, sizeFactor };
  }

  function splitMealInput(text) {
    return String(text || "")
      .split(/\n|,/)
      .map(line => line.trim())
      .filter(Boolean);
  }

  function estimateMeal(text) {
    const lines = splitMealInput(text);
    const items = lines.map(line => {
      const qty = parseQuantity(line);
      const found = findFood(line);
      const calories = found.food ? qty.quantity * found.food.calories : 0;
      return {
        input: line,
        quantity: qty.quantity,
        rawQuantity: qty.rawQuantity,
        sizeFactor: qty.sizeFactor,
        food: found.food,
        cleaned: found.cleaned,
        confidence: found.confidence,
        alternatives: found.alternatives,
        calories
      };
    });

    const total = items.reduce((sum, item) => sum + item.calories, 0);
    return { items, total };
  }

  function renderPill(text, tone = "") {
    return `<span class="pill ${tone ? "pill-" + escapeHTML(tone) : ""}">${escapeHTML(text)}</span>`;
  }

  function renderGoal() {
    const feet = toNumber(qs("#heightFeet").value);
    const inches = toNumber(qs("#heightInches").value);
    const current = toNumber(qs("#currentWeight").value);
    const target = toNumber(qs("#targetWeight").value);
    const weeks = toNumber(qs("#targetWeeks").value);
    const paceKey = qs("#goalPace").value;
    const indianRisk = qs("#indianRisk").checked;
    const meters = heightMeters(feet, inches);
    const out = qs("#goal-output");

    if (!meters || current <= 0 || target <= 0 || weeks <= 0) {
      out.innerHTML = `<div class="empty-state">Enter height, current weight, target weight, and goal duration to calculate your walking target.</div>`;
      return;
    }

    state.profile = { feet, inches, current, target, weeks, paceKey, indianRisk };
    writeJSON(STORAGE.profile, state.profile);
    qs("#stepsWeight").value = current || "";

    const currentBMI = bmi(current, meters);
    const targetBMI = bmi(target, meters);
    const currentCat = classifyBMI(currentBMI, indianRisk);
    const targetCat = classifyBMI(targetBMI, indianRisk);
    const lossKg = current - target;
    const days = weeks * 7;
    const avgWeight = lossKg > 0 ? (current + target) / 2 : current;

    let cards = `
      <div class="metric-card">
        <span>Current BMI</span>
        <strong>${formatNumber(currentBMI, 1)}</strong>
        ${renderPill(currentCat.label, currentCat.tone)}
      </div>
      <div class="metric-card">
        <span>Target BMI</span>
        <strong>${formatNumber(targetBMI, 1)}</strong>
        ${renderPill(targetCat.label, targetCat.tone)}
      </div>
    `;

    let guidance = "";
    if (lossKg <= 0) {
      guidance = `<div class="notice notice-good">Your target is not lower than your current weight. The app can still track walking and food logs, but no weight-loss walking target is needed for this goal.</div>`;
    } else {
      const totalKcal = lossKg * 7700;
      const dailyKcal = totalKcal / days;
      const stepPlan = stepsForCalories(dailyKcal, avgWeight, paceKey);
      const weeklyLoss = lossKg / weeks;
      const pace = stepPlan.pace;

      cards += `
        <div class="metric-card">
          <span>Total estimated energy gap</span>
          <strong>${formatNumber(totalKcal, 0)} kcal</strong>
          <small>${formatNumber(lossKg, 1)} kg × 7,700 kcal/kg</small>
        </div>
        <div class="metric-card emphasis">
          <span>Daily walk-only target</span>
          <strong>${formatNumber(stepPlan.steps, 0)} steps/day</strong>
          <small>≈ ${formatNumber(stepPlan.minutes, 0)} min/day at ${escapeHTML(pace.label.toLowerCase())} pace</small>
        </div>
        <div class="metric-card">
          <span>Daily energy gap</span>
          <strong>${formatNumber(dailyKcal, 0)} kcal/day</strong>
          <small>${formatNumber(weeklyLoss, 2)} kg/week planned</small>
        </div>
      `;

      const warnings = [];
      if (weeklyLoss > 0.9) {
        warnings.push("This is faster than a gradual 1–2 lb/week style goal. Consider increasing weeks or combining a smaller calorie deficit with walking.");
      }
      if (targetBMI < 18.5) {
        warnings.push("Your target BMI is below 18.5. Please review this goal with a qualified clinician before pursuing it.");
      }
      if (stepPlan.steps > 20000) {
        warnings.push("The walking-only target is very high. The more mortal-friendly path is usually walking plus diet changes, sleep, and strength training.");
      }

      guidance = warnings.length
        ? `<div class="notice notice-warn">${warnings.map(escapeHTML).join("<br>")}</div>`
        : `<div class="notice notice-good">This walking estimate is within a practical range for many adults. Keep it gradual and adjust based on how your body responds.</div>`;
    }

    const riskNote = indianRisk
      ? "Indian/South-Asian risk view is selected. BMI is still only a screening tool; waist size, medical history, and body composition matter."
      : "Standard adult BMI view is selected.";

    out.innerHTML = `
      <div class="result-grid">${cards}</div>
      ${guidance}
      <p class="microcopy">${escapeHTML(riskNote)} Walking calories use the MET formula and pace assumptions shown below.</p>
    `;
    renderFormula();
  }

  function renderFormula() {
    const paceRows = Object.entries(PACE)
      .map(([key, pace]) => `<tr><td>${escapeHTML(pace.label)}</td><td>${pace.met}</td><td>${pace.cadence} steps/min</td><td>${escapeHTML(pace.description)}</td></tr>`)
      .join("");
    qs("#formula-box").innerHTML = `
      <details>
        <summary>How estimates are calculated</summary>
        <div class="formula-grid">
          <div><strong>BMI</strong><br>BMI = weight kg ÷ height m²</div>
          <div><strong>Step calories</strong><br>Calories = MET × 3.5 × kg ÷ 200 × minutes</div>
          <div><strong>Weight loss energy</strong><br>Approx. 7,700 kcal per kg is used for planning, not prophecy.</div>
        </div>
        <table class="mini-table"><thead><tr><th>Pace</th><th>MET</th><th>Cadence</th><th>Meaning</th></tr></thead><tbody>${paceRows}</tbody></table>
      </details>
    `;
  }

  function renderStepResult(save = false) {
    const date = qs("#stepsDate").value || todayISO();
    const steps = Math.max(0, toNumber(qs("#stepsCount").value));
    const weight = toNumber(qs("#stepsWeight").value || state.profile.current);
    const paceKey = qs("#stepsPace").value;
    const notes = qs("#stepsNotes").value.trim();
    const out = qs("#steps-output");

    if (!steps || !weight) {
      out.innerHTML = `<div class="empty-state">Enter today’s steps and weight to estimate calories burned.</div>`;
      return;
    }

    const result = caloriesFromSteps(steps, weight, paceKey);
    out.innerHTML = `
      <div class="result-grid">
        <div class="metric-card emphasis">
          <span>Calories burned</span>
          <strong>${formatNumber(result.calories, 0)} kcal</strong>
          <small>${formatNumber(steps, 0)} steps · ${formatNumber(result.minutes, 0)} min · ${escapeHTML(result.pace.label)} pace</small>
        </div>
        <div class="metric-card">
          <span>Calories / 1,000 steps</span>
          <strong>${formatNumber(result.calories / steps * 1000, 0)} kcal</strong>
          <small>At ${formatNumber(weight, 1)} kg</small>
        </div>
      </div>
    `;

    if (save) {
      const entry = {
        id: uid(), date, steps, weight, paceKey, paceLabel: result.pace.label,
        minutes: round(result.minutes, 1), calories: round(result.calories, 0), notes
      };
      state.steps.unshift(entry);
      state.steps = state.steps.slice(0, 1000);
      writeJSON(STORAGE.steps, state.steps);
      renderStepHistory();
      qs("#stepsNotes").value = "";
      toast("Step log saved.");
    }
  }

  function renderStepHistory() {
    const tbody = qs("#steps-history-body");
    const totalSteps = state.steps.reduce((sum, item) => sum + item.steps, 0);
    const totalKcal = state.steps.reduce((sum, item) => sum + item.calories, 0);
    const last7Cutoff = new Date();
    last7Cutoff.setDate(last7Cutoff.getDate() - 6);
    const last7 = state.steps.filter(item => new Date(item.date + "T00:00:00") >= new Date(last7Cutoff.toDateString()));
    const last7Steps = last7.reduce((sum, item) => sum + item.steps, 0);
    const last7Kcal = last7.reduce((sum, item) => sum + item.calories, 0);

    qs("#steps-summary").innerHTML = `
      <span>${state.steps.length} saved days</span>
      <span>${formatNumber(totalSteps, 0)} total steps</span>
      <span>${formatNumber(totalKcal, 0)} total kcal</span>
      <span>Last 7 days: ${formatNumber(last7Steps, 0)} steps · ${formatNumber(last7Kcal, 0)} kcal</span>
    `;

    if (!state.steps.length) {
      tbody.innerHTML = `<tr><td colspan="7" class="empty-cell">No step history yet.</td></tr>`;
      renderStepChart();
      return;
    }

    tbody.innerHTML = state.steps.slice(0, 60).map(item => `
      <tr>
        <td>${escapeHTML(item.date)}</td>
        <td>${formatNumber(item.steps, 0)}</td>
        <td>${formatNumber(item.calories, 0)}</td>
        <td>${formatNumber(item.minutes, 0)}</td>
        <td>${escapeHTML(item.paceLabel || item.paceKey)}</td>
        <td>${escapeHTML(item.notes || "")}</td>
        <td><button class="ghost danger" data-delete-step="${escapeHTML(item.id)}" title="Delete">Delete</button></td>
      </tr>
    `).join("");
    renderStepChart();
  }

  function renderStepChart() {
    const container = qs("#steps-chart");
    if (!state.steps.length) {
      container.innerHTML = "";
      return;
    }
    const data = state.steps.slice(0, 14).reverse();
    const maxSteps = Math.max(...data.map(d => d.steps), 1);
    container.innerHTML = `
      <div class="chart-title">Last ${data.length} saved step logs</div>
      <div class="bar-chart">
        ${data.map(d => {
          const h = Math.max(8, Math.round((d.steps / maxSteps) * 120));
          return `<div class="bar-wrap" title="${escapeHTML(d.date)} · ${formatNumber(d.steps, 0)} steps">
            <div class="bar" style="height:${h}px"></div>
            <span>${escapeHTML(d.date.slice(5))}</span>
          </div>`;
        }).join("")}
      </div>
    `;
  }

  function renderMealEstimate(save = false) {
    const text = qs("#mealInput").value;
    const estimate = estimateMeal(text);
    state.lastMealEstimate = estimate;
    const out = qs("#meal-output");

    if (!estimate.items.length) {
      out.innerHTML = `<div class="empty-state">Enter foods like “2 chapati, 1 bowl dal, 1 katori bhat, 1 kela”.</div>`;
      return;
    }

    const rows = estimate.items.map(item => {
      if (!item.food) {
        const suggestions = item.alternatives?.length
          ? `<small>Maybe: ${item.alternatives.map(a => escapeHTML(a.food.name)).join(", ")}</small>`
          : `<small>Add this as custom food below.</small>`;
        return `<tr class="unmatched">
          <td>${escapeHTML(item.input)}</td>
          <td>—</td>
          <td>Not matched<br>${suggestions}</td>
          <td>—</td>
          <td>0</td>
        </tr>`;
      }

      const confidence = item.confidence === "high"
        ? renderPill("high", "good")
        : item.confidence === "medium"
          ? renderPill("check", "warn")
          : renderPill("low", "danger");

      return `<tr>
        <td>${escapeHTML(item.input)}</td>
        <td>${formatNumber(item.quantity, 2)}</td>
        <td>
          <strong>${escapeHTML(item.food.name)}</strong><br>
          <small>${escapeHTML(item.food.serving)} · ${escapeHTML(item.food.category)}</small>
        </td>
        <td>${confidence}</td>
        <td>${formatNumber(item.calories, 0)}</td>
      </tr>`;
    }).join("");

    out.innerHTML = `
      <div class="metric-card emphasis meal-total">
        <span>Estimated meal calories</span>
        <strong>${formatNumber(estimate.total, 0)} kcal</strong>
        <small>${estimate.items.filter(i => i.food).length}/${estimate.items.length} items matched</small>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Your input</th><th>Qty</th><th>Matched food</th><th>Confidence</th><th>kcal</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <p class="microcopy">Home cooking varies sharply with oil, ghee, sugar, and actual bowl size. Adjust custom foods to match your household.</p>
    `;

    if (save) {
      const mealName = qs("#mealName").value.trim() || "Meal";
      const date = qs("#mealDate").value || todayISO();
      const entry = {
        id: uid(),
        date,
        name: mealName,
        input: text.trim(),
        total: round(estimate.total, 0),
        items: estimate.items.map(item => ({
          input: item.input,
          quantity: round(item.quantity, 2),
          foodName: item.food?.name || null,
          calories: round(item.calories, 0),
          confidence: item.confidence
        }))
      };
      state.meals.unshift(entry);
      state.meals = state.meals.slice(0, 1000);
      writeJSON(STORAGE.meals, state.meals);
      renderMealHistory();
      toast("Meal log saved.");
    }
  }

  function renderMealHistory() {
    const tbody = qs("#meal-history-body");
    const total = state.meals.reduce((sum, item) => sum + item.total, 0);
    const byDate = new Map();
    state.meals.forEach(item => byDate.set(item.date, (byDate.get(item.date) || 0) + item.total));
    const avgPerLoggedDay = byDate.size ? total / byDate.size : 0;

    qs("#meal-summary").innerHTML = `
      <span>${state.meals.length} saved meals</span>
      <span>${formatNumber(total, 0)} logged kcal</span>
      <span>${byDate.size} logged days</span>
      <span>Avg/day logged: ${formatNumber(avgPerLoggedDay, 0)} kcal</span>
    `;

    if (!state.meals.length) {
      tbody.innerHTML = `<tr><td colspan="5" class="empty-cell">No meal history yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = state.meals.slice(0, 80).map(item => `
      <tr>
        <td>${escapeHTML(item.date)}</td>
        <td>${escapeHTML(item.name)}</td>
        <td>${formatNumber(item.total, 0)}</td>
        <td>${escapeHTML(item.items.map(i => `${i.quantity}× ${i.foodName || i.input}`).join("; "))}</td>
        <td><button class="ghost danger" data-delete-meal="${escapeHTML(item.id)}">Delete</button></td>
      </tr>
    `).join("");
  }

  function renderFoodBrowser() {
    const query = normalizeText(qs("#foodSearch").value);
    const category = qs("#categoryFilter").value;
    const categories = Array.from(new Set(state.foods.map(f => f.category))).sort();

    qs("#categoryFilter").innerHTML = `<option value="">All categories</option>` +
      categories.map(c => `<option value="${escapeHTML(c)}" ${c === category ? "selected" : ""}>${escapeHTML(c)}</option>`).join("");

    const filtered = state.indexedFoods.filter(food => {
      const hay = normalizeText([food.name, food.category, food.serving, ...(food.aliases || [])].join(" "));
      return (!query || hay.includes(query)) && (!category || food.category === category);
    });

    qs("#food-count").textContent = `${filtered.length} foods`;
    qs("#food-browser").innerHTML = filtered.slice(0, 120).map(food => `
      <div class="food-chip">
        <strong>${escapeHTML(food.name)}</strong>
        <span>${escapeHTML(food.serving)} · ${formatNumber(food.calories, 0)} kcal</span>
      </div>
    `).join("") || `<div class="empty-state">No matching foods. Add a custom item below.</div>`;
  }

  function addCustomFood() {
    const name = qs("#customFoodName").value.trim();
    const calories = toNumber(qs("#customFoodCalories").value);
    const serving = qs("#customFoodServing").value.trim() || "1 serving";
    const aliases = qs("#customFoodAliases").value.split(",").map(x => x.trim()).filter(Boolean);
    const category = qs("#customFoodCategory").value.trim() || "Custom";

    if (!name || calories <= 0) {
      toast("Enter a food name and calories.", true);
      return;
    }

    const item = {
      id: "custom_" + uid(),
      name,
      category,
      serving,
      calories,
      aliases
    };
    state.customFoods.unshift(item);
    writeJSON(STORAGE.customFoods, state.customFoods);
    buildFoodsIndex();
    renderFoodBrowser();
    qs("#custom-food-form").reset();
    toast("Custom food added.");
  }

  function exportCSV(filename, rows) {
    if (!rows.length) {
      toast("Nothing to export.", true);
      return;
    }
    const headers = Object.keys(rows[0]);
    const csv = [
      headers.join(","),
      ...rows.map(row => headers.map(h => `"${String(row[h] ?? "").replaceAll('"', '""')}"`).join(","))
    ].join("\n");
    downloadText(filename, csv, "text/csv;charset=utf-8");
  }

  function downloadText(filename, text, type = "text/plain") {
    const blob = new Blob([text], { type });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(a.href);
      a.remove();
    }, 100);
  }

  function exportBackup() {
    const backup = {
      version: 1,
      createdAt: new Date().toISOString(),
      profile: state.profile,
      steps: state.steps,
      meals: state.meals,
      customFoods: state.customFoods
    };
    downloadText(`aaharwalk-backup-${todayISO()}.json`, JSON.stringify(backup, null, 2), "application/json;charset=utf-8");
  }

  function restoreBackup(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!data || typeof data !== "object") throw new Error("Invalid backup.");
        state.profile = data.profile || {};
        state.steps = Array.isArray(data.steps) ? data.steps : [];
        state.meals = Array.isArray(data.meals) ? data.meals : [];
        state.customFoods = Array.isArray(data.customFoods) ? data.customFoods : [];
        writeJSON(STORAGE.profile, state.profile);
        writeJSON(STORAGE.steps, state.steps);
        writeJSON(STORAGE.meals, state.meals);
        writeJSON(STORAGE.customFoods, state.customFoods);
        buildFoodsIndex();
        applyProfile();
        renderGoal();
        renderStepHistory();
        renderMealHistory();
        renderFoodBrowser();
        toast("Backup restored.");
      } catch (err) {
        console.error(err);
        toast("Could not restore this backup file.", true);
      }
    };
    reader.readAsText(file);
  }

  let toastTimeout = null;
  function toast(message, error = false) {
    const el = qs("#toast");
    el.textContent = message;
    el.className = error ? "toast toast-error show" : "toast show";
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => el.className = "toast", 2500);
  }

  function applyProfile() {
    const p = state.profile || {};
    if (p.feet) qs("#heightFeet").value = p.feet;
    if (p.inches !== undefined) qs("#heightInches").value = p.inches;
    if (p.current) {
      qs("#currentWeight").value = p.current;
      qs("#stepsWeight").value = p.current;
    }
    if (p.target) qs("#targetWeight").value = p.target;
    if (p.weeks) qs("#targetWeeks").value = p.weeks;
    if (p.paceKey) {
      qs("#goalPace").value = p.paceKey;
      qs("#stepsPace").value = p.paceKey;
    }
    qs("#indianRisk").checked = Boolean(p.indianRisk);
  }

  function installEventHandlers() {
    qs("#goal-form").addEventListener("submit", event => {
      event.preventDefault();
      renderGoal();
    });
    qsa("#goal-form input, #goal-form select").forEach(input => input.addEventListener("input", renderGoal));

    qs("#stepsDate").value = todayISO();
    qs("#mealDate").value = todayISO();

    qs("#steps-calc").addEventListener("click", () => renderStepResult(false));
    qs("#steps-save").addEventListener("click", () => renderStepResult(true));
    qs("#steps-history-body").addEventListener("click", event => {
      const id = event.target?.dataset?.deleteStep;
      if (!id) return;
      state.steps = state.steps.filter(item => item.id !== id);
      writeJSON(STORAGE.steps, state.steps);
      renderStepHistory();
      toast("Step log deleted.");
    });
    qs("#exportSteps").addEventListener("click", () => {
      exportCSV(`aaharwalk-steps-${todayISO()}.csv`, state.steps.map(item => ({
        date: item.date, steps: item.steps, calories: item.calories, minutes: item.minutes,
        weight_kg: item.weight, pace: item.paceLabel || item.paceKey, notes: item.notes || ""
      })));
    });
    qs("#clearSteps").addEventListener("click", () => {
      if (!state.steps.length || confirm("Clear all step history on this browser?")) {
        state.steps = [];
        writeJSON(STORAGE.steps, state.steps);
        renderStepHistory();
      }
    });

    qs("#meal-estimate").addEventListener("click", () => renderMealEstimate(false));
    qs("#meal-save").addEventListener("click", () => renderMealEstimate(true));
    qs("#mealInput").addEventListener("input", () => {
      if (qs("#liveMealToggle").checked) renderMealEstimate(false);
    });
    qs("#mealExamples").addEventListener("click", () => {
      qs("#mealInput").value = "2 chapati, 1 bowl varan, 1 bowl bhat, 1 kachumber, 1 kela\n1 वाटी डाळ, 1 पोळी, 1 भाजी\nएक कटोरी राजमा, 1 bowl rice";
      renderMealEstimate(false);
    });
    qs("#meal-history-body").addEventListener("click", event => {
      const id = event.target?.dataset?.deleteMeal;
      if (!id) return;
      state.meals = state.meals.filter(item => item.id !== id);
      writeJSON(STORAGE.meals, state.meals);
      renderMealHistory();
      toast("Meal log deleted.");
    });
    qs("#exportMeals").addEventListener("click", () => {
      exportCSV(`aaharwalk-meals-${todayISO()}.csv`, state.meals.map(item => ({
        date: item.date,
        meal: item.name,
        calories: item.total,
        input: item.input,
        matched_items: item.items.map(i => `${i.quantity}x ${i.foodName || i.input}`).join("; ")
      })));
    });
    qs("#clearMeals").addEventListener("click", () => {
      if (!state.meals.length || confirm("Clear all meal history on this browser?")) {
        state.meals = [];
        writeJSON(STORAGE.meals, state.meals);
        renderMealHistory();
      }
    });

    qs("#foodSearch").addEventListener("input", renderFoodBrowser);
    qs("#categoryFilter").addEventListener("change", renderFoodBrowser);
    qs("#custom-food-form").addEventListener("submit", event => {
      event.preventDefault();
      addCustomFood();
    });

    qs("#exportBackup").addEventListener("click", exportBackup);
    qs("#restoreBackup").addEventListener("change", event => restoreBackup(event.target.files[0]));
    qs("#printPage").addEventListener("click", () => window.print());
  }

  function seedInterface() {
    const paceOptions = Object.entries(PACE).map(([key, pace]) => `<option value="${key}">${pace.label} (${pace.met} MET)</option>`).join("");
    qs("#goalPace").innerHTML = paceOptions;
    qs("#stepsPace").innerHTML = paceOptions;
    qs("#targetWeeks").value = 12;

    state.profile = readJSON(STORAGE.profile, {});
    state.steps = readJSON(STORAGE.steps, []);
    state.meals = readJSON(STORAGE.meals, []);
    state.customFoods = readJSON(STORAGE.customFoods, []);
    buildFoodsIndex();
    applyProfile();

    renderFormula();
    renderGoal();
    renderStepHistory();
    renderMealHistory();
    renderFoodBrowser();
  }

  document.addEventListener("DOMContentLoaded", () => {
    seedInterface();
    installEventHandlers();
  });
})();
