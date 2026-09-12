/* AaharWalk — offline shell.
   App files are cached on install; everything else is network-first
   with a cache fallback so the app still opens with no connection. */

const CACHE = "aaharwalk-v3";

const SHELL = [
  "./", "./index.html", "./styles.css", "./pwa.js", "./manifest.webmanifest",
  "./src/main.js",
  "./src/core/util.js", "./src/core/store.js", "./src/core/i18n.js",
  "./src/data/foods.js", "./src/data/units.js", "./src/data/exercises.js",
  "./src/data/mealIdeas.js", "./src/data/demo.js",
  "./src/engine/parser.js", "./src/engine/nutrition.js", "./src/engine/targets.js",
  "./src/engine/planner.js", "./src/engine/workouts.js", "./src/engine/coach.js",
  "./src/engine/session.js", "./src/engine/steps-import.js",
  "./src/ui/components.js", "./src/ui/onboarding.js", "./src/ui/home.js",
  "./src/ui/food.js", "./src/ui/activity.js", "./src/ui/plan.js",
  "./src/ui/profile.js", "./src/ui/workout.js", "./src/ui/walk.js",
  "./src/engine/pedometer.js",
  "./assets/icon.svg", "./assets/icon-192.png", "./assets/icon-512.png",
  "./assets/maskable-512.png", "./assets/apple-touch-icon.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET" || new URL(request.url).origin !== location.origin) return;

  event.respondWith(
    fetch(request)
      .then(response => {
        const copy = response.clone();
        caches.open(CACHE).then(cache => cache.put(request, copy));
        return response;
      })
      .catch(() => caches.match(request).then(cached => cached || caches.match("./index.html")))
  );
});
