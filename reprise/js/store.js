// Local persistence: alarms/settings/history in localStorage, custom sounds in IndexedDB.

const K = {
  alarms: "reprise.alarms",
  settings: "reprise.settings",
  history: "reprise.history",
  ringing: "reprise.ringing",
  lastTick: "reprise.lastTick",
};

export const DEFAULT_SETTINGS = {
  strictness: "normal",
  camera: "user",
  ramp: true,
  duck: true,
  skeleton: true,
  use24h: false,
};

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw == null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}
function write(key, value) {
  try {
    if (value == null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn("Storage write failed", key, e);
  }
}

export const loadAlarms = () => read(K.alarms, []);
export const saveAlarms = alarms => write(K.alarms, alarms);
export const loadSettings = () => ({ ...DEFAULT_SETTINGS, ...read(K.settings, {}) });
export const saveSettings = s => write(K.settings, s);
export const loadHistory = () => read(K.history, []);
export function addHistory(entry) {
  const h = loadHistory();
  h.push(entry);
  write(K.history, h.slice(-400));
  return h;
}
export const getRinging = () => read(K.ringing, null);
export const setRinging = r => write(K.ringing, r);
export const getLastTick = () => read(K.lastTick, null);
export const setLastTick = t => write(K.lastTick, t);

export function uid() {
  return (crypto.randomUUID?.() || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`);
}

// ---------- IndexedDB for user-uploaded alarm sounds ----------

let dbPromise = null;
function db() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open("reprise", 1);
      req.onupgradeneeded = () => req.result.createObjectStore("sounds", { keyPath: "id" });
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    dbPromise.catch(() => { dbPromise = null; });
  }
  return dbPromise;
}

function tx(mode, fn) {
  return db().then(d => new Promise((resolve, reject) => {
    const t = d.transaction("sounds", mode);
    const store = t.objectStore("sounds");
    const req = fn(store);
    t.oncomplete = () => resolve(req?.result);
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error);
  }));
}

export const putSound = sound => tx("readwrite", s => s.put(sound));
export const getSound = id => tx("readonly", s => s.get(id));
export const deleteSound = id => tx("readwrite", s => s.delete(id));
export async function listSounds() {
  try {
    const all = await tx("readonly", s => s.getAll());
    return (all || []).map(({ id, name, size }) => ({ id, name, size }));
  } catch {
    return [];
  }
}
