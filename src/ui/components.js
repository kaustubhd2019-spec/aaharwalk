/* AaharWalk — shared UI pieces: icons, rings, bars, sheets, toasts. */

import { el, clamp, fmt } from "../core/util.js";

/* ——— icons (inline, no network) ——————————————————————————————— */

const PATHS = {
  home: "M3 10.5 12 3l9 7.5M5.5 9.5V20h13V9.5",
  food: "M6 3.5v6a2.3 2.3 0 0 0 4.6 0v-6M8.3 11.8V20.5M15.2 3.5c-1.2 1.7-1.8 3.5-1.8 5.3 0 1.8.8 2.9 1.9 2.9h1.6V3.5h-1.7ZM16.8 12V20.5",
  activity: "M4 19c2-6 4-9 6-9s2 5 4 5 3-3 6-9",
  plan: "M9.5 3.5h5v3h-5zM8.5 5.5H6.5A1.5 1.5 0 0 0 5 7v12.5A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5V7a1.5 1.5 0 0 0-1.5-1.5h-2M8.5 11.5h7M8.5 15.5h4.5",
  profile: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4.5 20c.8-3.6 3.8-5.5 7.5-5.5s6.7 1.9 7.5 5.5",
  plus: "M12 5v14M5 12h14",
  drop: "M12 3.5c3 3.8 5.5 6.6 5.5 9.6A5.5 5.5 0 0 1 6.5 13c0-3 2.5-5.8 5.5-9.5Z",
  scale: "M5 5.5h14A1.5 1.5 0 0 1 20.5 7v10a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 17V7A1.5 1.5 0 0 1 5 5.5ZM8.4 10.4a5 5 0 0 1 7.2 0M12 8.6v3.1",
  dumbbell: "M4 9v6M7 7v10M17 7v10M20 9v6M7 12h10",
  shoe: "M8 3.6c1.35 0 2.15 1.2 2.15 2.95S9.35 9.5 8 9.5 5.85 8.3 5.85 6.55 6.65 3.6 8 3.6ZM8 13.4c1 0 1.65.6 1.65 1.5S9 16.4 8 16.4s-1.65-.6-1.65-1.5S7 13.4 8 13.4ZM16 7.6c1.35 0 2.15 1.2 2.15 2.95S17.35 13.5 16 13.5s-2.15-1.2-2.15-2.95S14.65 7.6 16 7.6ZM16 17.4c1 0 1.65.6 1.65 1.5s-.65 1.5-1.65 1.5-1.65-.6-1.65-1.5.65-1.5 1.65-1.5Z",
  sparkle: "M12 3.5 13.7 9l5.3 1.7-5.3 1.8L12 18l-1.7-5.5L5 10.7 10.3 9 12 3.5Z",
  close: "M6 6l12 12M18 6 6 18",
  check: "M4.5 12.5 9 17l10.5-10",
  chevron: "M9 6l6 6-6 6",
  back: "M15 6l-6 6 6 6",
  edit: "M4 20h4L19 9a2.1 2.1 0 0 0-3-3L5 17v3Z",
  trash: "M5 7h14M10 7V5h4v2M6.5 7l.8 12.5h9.4L17.5 7",
  refresh: "M20 12a8 8 0 1 1-2.6-5.9M20 4v4h-4",
  pause: "M9 5v14M15 5v14",
  play: "M7 4.5 19 12 7 19.5V4.5Z",
  flag: "M6 21V4h11l-2 3.5L17 11H6",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 7v5l3.5 2",
  sliders: "M4 7h10M18 7h2M4 12h4M12 12h8M4 17h9M17 17h3M16 7a2 2 0 1 0 0-.1M10 12a2 2 0 1 0 0-.1M15 17a2 2 0 1 0 0-.1"
};

export function icon(name, size = 22, stroke = 1.7) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("width", size);
  svg.setAttribute("height", size);
  svg.setAttribute("fill", "none");
  svg.setAttribute("aria-hidden", "true");
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", PATHS[name] || "");
  path.setAttribute("stroke", "currentColor");
  path.setAttribute("stroke-width", stroke);
  path.setAttribute("stroke-linecap", "round");
  path.setAttribute("stroke-linejoin", "round");
  svg.append(path);
  return svg;
}

/* ——— activity rings ————————————————————————————————————————
   One arc per goal, largest outside. Every ring is also named and numbered in
   the legend beside it, so identity never rests on colour alone. */

export function activityRings(goals, { size = 132, stroke = 9, gap = 4, centre = null } = {}) {
  const wrap = el("div", { class: "rings", style: `width:${size}px;height:${size}px` });
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", size);
  svg.setAttribute("height", size);
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", goals.map(g => `${g.name} ${Math.round(g.value)} of ${Math.round(g.target)}`).join("; "));

  goals.forEach((goal, index) => {
    const radius = (size - stroke) / 2 - index * (stroke + gap);
    if (radius <= stroke) return;
    const circumference = 2 * Math.PI * radius;
    const ratio = goal.target > 0 ? clamp(goal.value / goal.target, 0, 1) : 0;

    for (const kind of ["ring-track", "ring-arc"]) {
      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circle.setAttribute("class", kind);
      circle.setAttribute("cx", size / 2);
      circle.setAttribute("cy", size / 2);
      circle.setAttribute("r", radius);
      circle.setAttribute("stroke-width", stroke);
      if (kind === "ring-arc") {
        circle.setAttribute("stroke", goal.color);
        circle.setAttribute("stroke-dasharray", circumference);
        circle.setAttribute("stroke-dashoffset", circumference);
        requestAnimationFrame(() => {
          circle.setAttribute("stroke-dashoffset", String(circumference * (1 - ratio)));
        });
      }
      svg.append(circle);
    }
  });

  wrap.append(svg);
  if (centre) {
    // The hole is only so wide; long numbers step down rather than collide.
    const digits = String(centre.value).length;
    const fontSize = digits >= 6 ? 17 : digits === 5 ? 19 : digits === 4 ? 22 : 25;
    wrap.append(el("div", { class: "rings-center" }, [
      el("div", { class: "big", style: `font-size:${fontSize}px`, text: centre.value }),
      centre.label ? el("div", { class: "cap", text: centre.label }) : null
    ]));
  }
  return wrap;
}

export function ringLegend(goals) {
  return el("div", { class: "ring-legend" }, goals.map(goal => el("div", { class: "ring-legend-row" }, [
    el("i", { class: "ring-legend-dot", style: `background:${goal.color}` }),
    el("span", { class: "ring-legend-name", text: goal.name }),
    el("span", { class: "ring-legend-val" }, [
      goal.display != null ? String(goal.display) : fmt(Math.round(goal.value)),
      el("small", { text: ` / ${goal.displayTarget != null ? goal.displayTarget : fmt(Math.round(goal.target))}` })
    ])
  ])));
}

/* ——— metric tile ————————————————————————————————————————————— */

export function tile({ name, value, unit, sub, color, soft, iconName, onclick }) {
  return el("button", { class: "tile", type: "button", onclick: onclick || null }, [
    el("div", { class: "tile-top" }, [
      el("span", { class: "tile-icon", style: `background:${soft};color:${color}` }, [icon(iconName, 16, 2)]),
      el("span", { class: "tile-name", text: name })
    ]),
    el("div", { class: "tile-value" }, [String(value), unit ? el("small", { text: ` ${unit}` }) : null]),
    sub ? el("div", { class: "tile-sub", text: sub }) : null
  ]);
}

/* ——— a named, numbered progress line ————————————————————————— */

export function metricLine({ name, value, target, unit = "", color, format = v => fmt(Math.round(v)) }) {
  const ratio = target > 0 ? clamp(value / target, 0, 1) : 0;
  return el("div", { class: "metric-line" }, [
    el("div", { class: "metric-line-top" }, [
      el("span", { class: "metric-line-name" }, [
        el("i", { style: `background:${color}` }),
        name
      ]),
      el("span", { class: "metric-line-val" }, [
        el("strong", { text: format(value) }),
        el("span", { text: ` / ${format(target)}${unit ? ` ${unit}` : ""}` })
      ])
    ]),
    el("div", { class: "databar" }, [el("i", { style: `width:${ratio * 100}%;background:${color}` })])
  ]);
}

export function stat({ k, v, s, onclick }) {
  return el(onclick ? "button" : "div", {
    class: "stat",
    ...(onclick ? { onclick, type: "button", style: "text-align:left;cursor:pointer" } : {})
  }, [
    el("span", { class: "k", text: k }),
    el("span", { class: "v", text: v }),
    s ? el("span", { class: "s", text: s }) : null
  ]);
}

/* ——— bottom sheet ————————————————————————————————————————— */

/* Sheets stack: opening the portion editor from inside the food log must not
   throw away what the user has already typed underneath. */
const sheetStack = [];

export function sheet({ title, body, footer, onClose, dismissible = true }) {
  const below = sheetStack[sheetStack.length - 1];
  if (below) {
    below.scrim.style.display = "none";
    below.panel.style.display = "none";
  }

  const scrim = el("div", { class: "scrim", onclick: () => dismissible && closeSheet() });
  const panel = el("div", { class: "sheet", role: "dialog", "aria-modal": "true" });

  panel.append(el("div", { class: "sheet-grip" }));
  panel.append(el("div", { class: "sheet-head" }, [
    el("h2", { text: title || "" }),
    dismissible ? el("button", { class: "icon-btn", type: "button", "aria-label": "Close", onclick: () => closeSheet() }, [icon("close", 18)]) : null
  ]));
  const bodyEl = el("div", { class: "sheet-body" });
  bodyEl.append(body);
  panel.append(bodyEl);
  if (footer) panel.append(el("div", { class: "sheet-foot" }, footer));

  document.body.append(scrim, panel);
  document.body.style.overflow = "hidden";
  const entry = { scrim, panel, onClose };
  sheetStack.push(entry);
  return { close: closeSheet, body: bodyEl, panel };
}

/** Closes the topmost sheet and reveals whatever was underneath. */
export function closeSheet() {
  const top = sheetStack.pop();
  if (!top) return;
  top.scrim.remove();
  top.panel.remove();
  const below = sheetStack[sheetStack.length - 1];
  if (below) {
    below.scrim.style.display = "";
    below.panel.style.display = "";
  } else {
    document.body.style.overflow = "";
  }
  if (top.onClose) top.onClose();
}

export function closeAllSheets() {
  while (sheetStack.length) closeSheet();
}

/* ——— toast ————————————————————————————————————————————————— */

let toastHost = null;

export function toast(message, ms = 2400) {
  if (!toastHost) {
    toastHost = el("div", { class: "toast-host" });
    document.body.append(toastHost);
  }
  while (toastHost.children.length >= 2) toastHost.firstElementChild.remove();
  const node = el("div", { class: "toast", text: message });
  toastHost.append(node);
  setTimeout(() => {
    node.style.transition = "opacity .25s ease, transform .25s ease";
    node.style.opacity = "0";
    node.style.transform = "translateY(6px)";
    setTimeout(() => node.remove(), 260);
  }, ms);
}

/* ——— food identity ——————————————————————————————————————————
   A glance-level cue for what kind of food a row is. Decorative only — the
   name is always right beside it. */

const CATEGORY_EMOJI = {
  bread: "🫓", rice: "🍚", dal: "🥣", usal: "🫘", sabzi: "🥬",
  breakfast: "🍳", snack: "🍿", street: "🌯", nonveg: "🍗", egg: "🥚",
  dairy: "🥛", fruit: "🍎", salad: "🥗", nuts: "🥜", sweet: "🍮",
  drink: "☕", fat: "🧈", misc: "🧂"
};

export function foodEmoji(food) {
  return (food && CATEGORY_EMOJI[food.cat]) || "🍽️";
}

export function foodAvatar(food) {
  return el("span", { class: "food-avatar", "aria-hidden": "true", text: foodEmoji(food) });
}

/** A coloured icon chip for a card heading. */
export function cardIcon(iconName, token) {
  return el("span", { class: "card-icon", style: `background:var(${token}-soft);color:var(${token})` }, [icon(iconName, 16, 2)]);
}

/* ——— small helpers ————————————————————————————————————————— */

export function card(children, cls = "") {
  return el("div", { class: `card ${cls}`.trim() }, children);
}

export function cardHead(title, action = null) {
  return el("div", { class: "card-head" }, [el("h2", { text: title }), action]);
}

export function emptyState(text) {
  return el("div", { class: "empty", text });
}

export function chipRow(options, { selected, onSelect, multi = false, size = "" }) {
  const chosen = new Set([].concat(selected || []));
  const host = el("div", { class: "chips" });
  for (const option of options) {
    const btn = el("button", {
      type: "button",
      class: `chip ${size}`.trim(),
      "aria-pressed": chosen.has(option.value) ? "true" : "false",
      text: option.label,
      onclick: () => {
        if (multi) {
          chosen.has(option.value) ? chosen.delete(option.value) : chosen.add(option.value);
        } else {
          chosen.clear();
          chosen.add(option.value);
        }
        for (const child of host.children) {
          child.setAttribute("aria-pressed", chosen.has(child.dataset.value) ? "true" : "false");
        }
        onSelect(multi ? Array.from(chosen) : option.value);
      }
    });
    btn.dataset.value = option.value;
    host.append(btn);
  }
  return host;
}

/** Bar chart for 7/14-day trends. */
export function barChart(points, { target = null, labelFor = p => p.label, hitWhen = null, color = "var(--accent)", showValues = true } = {}) {
  const max = Math.max(target || 0, ...points.map(p => p.value), 1);
  // More is better for steps; for calories, staying at or under target is.
  const isHit = hitWhen || (value => Boolean(target) && value >= target);
  const chart = el("div", { class: "chart" });
  points.forEach((point, index) => {
    const height = Math.max(3, (point.value / max) * 100);
    const hit = isHit(point.value);
    const isToday = index === points.length - 1;
    const col = el("div", {
      class: `col ${hit ? "hit" : ""} ${isToday ? "today" : ""}`.trim(),
      title: `${point.label}: ${fmt(point.value)}`
    }, [
      showValues ? el("span", { class: "chart-value", text: point.value ? shortNumber(point.value) : "" }) : null,
      el("i", { style: `height:${height}%;background:${hit ? color : "color-mix(in srgb, " + color + " 22%, transparent)"}` }),
      el("span", { text: labelFor(point) })
    ]);
    chart.append(col);
  });
  return chart;
}

/** 8,452 → "8.5k" so seven labels fit across a phone. */
export function shortNumber(value) {
  if (!Number.isFinite(value) || value === 0) return "";
  if (Math.abs(value) >= 10000) return `${Math.round(value / 1000)}k`;
  if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return String(Math.round(value));
}

/** Simple line chart used for weight. */
export function lineChart(points, { height = 90, color = "var(--m-weight)" } = {}) {
  if (points.length < 2) return emptyState("Log at least two weights to see the trend.");
  const values = points.map(p => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const stepX = 100 / (points.length - 1);
  const coords = points.map((p, i) => [i * stepX, 100 - ((p.value - min) / span) * 100]);
  const path = coords.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const area = `${path} L100 100 L0 100 Z`;

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("class", "spark");
  svg.setAttribute("viewBox", "0 0 100 100");
  svg.setAttribute("preserveAspectRatio", "none");
  svg.style.height = `${height}px`;
  const gradientId = `spark-${Math.random().toString(36).slice(2, 8)}`;
  svg.innerHTML = `
    <defs>
      <linearGradient id="${gradientId}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${color}" stop-opacity=".28"></stop>
        <stop offset="100%" stop-color="${color}" stop-opacity="0"></stop>
      </linearGradient>
    </defs>
    <path d="${area}" fill="url(#${gradientId})"></path>
    <path d="${path}" fill="none" stroke="${color}" stroke-width="2"
      stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"></path>
    ${coords.map(([x, y], i) => i === coords.length - 1
      ? `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3" fill="${color}" stroke="var(--surface)" stroke-width="2" vector-effect="non-scaling-stroke"></circle>`
      : "").join("")}`;
  return svg;
}

/**
 * Only low-confidence estimates get a marker. High and medium ones are simply
 * shown as "≈", which is honest without cluttering every row.
 */
export function confidenceDot(level, lang = "en") {
  if (level !== "low" && level !== "ask") return null;
  return el("span", {
    class: `conf-dot conf-${level}`,
    title: lang === "mr" ? "हा अंदाज ढोबळ आहे — तपासून बदला" : "Rough estimate — worth checking"
  });
}
