/**
 * Capa de experimentos: ÚNICO punto que cambia entre plataformas.
 * Las páginas solo usan initExperiment(clave) y track(clave, evento, props).
 *
 * Experimento 1 "signup_flow" (página de registro, #/)
 *   - one_step / two_steps. Métrica principal: signup_completed.
 * Experimento 2 "catalog_order" (catálogo de talleres, #/catalogo)
 *   - by_popularity / by_interest. Métrica principal: workshop_reserved.
 *
 * Cada experimento tiene su propia asignación, su página y su métrica,
 * así que no se solapan. Para cada plataforma, completa el proveedor
 * correspondiente siguiendo SU documentación oficial.
 */
import posthog from "posthog-js";

export const EXPERIMENTS = {
  signup_flow: { variants: ["one_step", "two_steps"] },
  catalog_order: { variants: ["by_popularity", "by_interest"] },
};

// Cambia este valor al probar cada plataforma:
// "local" | "growthbook" | "posthog" | "statsig" | "ablyft" | "vwo"
const ACTIVE_PROVIDER = "posthog";

const USER_KEY = "ab_demo_user"; // { <experimento>: <variante> }
const LOG_KEY = "ab_demo_events";

const listeners = new Set();
export const onEvent = (fn) => (listeners.add(fn), () => listeners.delete(fn));

function readLog() {
  try { return JSON.parse(localStorage.getItem(LOG_KEY)) || []; } catch { return []; }
}
function writeLog(log) {
  try { localStorage.setItem(LOG_KEY, JSON.stringify(log.slice(-300))); } catch { /* sin almacenamiento */ }
}
export const getEventLog = readLog;

/** Registro local de eventos: sirve de "verdad" para contrastar con cada plataforma. */
function logLocally(experiment, name, props) {
  const entry = { t: new Date().toISOString(), experiment, name, provider: ACTIVE_PROVIDER, ...props };
  writeLog([...readLog(), entry]);
  listeners.forEach((fn) => fn(entry));
  console.info("[ab-demo]", entry);
}

/* ------------------------------ Proveedores ------------------------------ */

const local = {
  async init(key) {
    const variants = EXPERIMENTS[key].variants;
    const forced = new URLSearchParams(location.search).get(key); // ?signup_flow=two_steps
    if (variants.includes(forced)) return forced;
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem(USER_KEY)) || {}; } catch { /* ignorar */ }
    if (variants.includes(saved[key])) return saved[key];
    saved[key] = variants[crypto.getRandomValues(new Uint8Array(1))[0] % 2];
    try { localStorage.setItem(USER_KEY, JSON.stringify(saved)); } catch { /* ignorar */ }
    return saved[key];
  },
  track() { /* el registro local ya se hace en track() */ },
};

const pending = (name) => ({
  async init() {
    throw new Error(`Proveedor "${name}" pendiente de integrar: ver comentarios en experiment.js`);
  },
  track() {},
});

posthog.init(import.meta.env.VITE_POSTHOG_PROJECT_TOKEN, {
  api_host: import.meta.env.VITE_POSTHOG_HOST,
  defaults: "2026-08-30",
});

const posthogProvider = {
  init(key) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error(`PostHog no devolvió el flag "${key}"`)), 5000);
      posthog.onFeatureFlags(() => {
        const v = posthog.getFeatureFlag(key);
        if (!v) return;
        clearTimeout(timer);
        resolve(v === "control" ? EXPERIMENTS[key].variants[0] : v);
      });
    });
  },
  track(key, name, props) {
    posthog.capture(name, { experiment: key, ...props });
  },
};

const providers = {
  local,
  growthbook: pending("growthbook"), // SDK JS + clave de cliente + experimento
  posthog: posthogProvider,       // posthog-js + feature flag multivariante
  statsig: pending("statsig"),       // SDK cliente + experimento
  ablyft: pending("ablyft"),         // script en index.html + editor/código de variante
  vwo: pending("vwo"),               // script SmartCode en index.html
};

const provider = providers[ACTIVE_PROVIDER];

/* --------------------------------- API ----------------------------------- */

export function initExperiment(key) {
  return provider.init(key);
}

export function track(experiment, name, props = {}) {
  logLocally(experiment, name, props);
  provider.track(experiment, name, props);
}

export function resetUser() {
  try { 
    localStorage.removeItem(USER_KEY);
    posthog.reset()
  } catch { /* ignorar */ }
  const params = new URLSearchParams(location.search);
  Object.keys(EXPERIMENTS).forEach((k) => params.delete(k));
  const q = params.toString();
  location.href = location.pathname + (q ? `?${q}` : "") + location.hash;
  location.reload();
}
export const activeProvider = ACTIVE_PROVIDER;
