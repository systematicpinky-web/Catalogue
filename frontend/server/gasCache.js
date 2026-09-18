// Short-lived read cache in front of Apps Script.
//
// Every read otherwise costs a full round trip to a backend that reads the entire sheet and
// intermittently fails, so repeat reads (tab reloads, several tabs, navigating back to the
// list) are the cheapest thing to eliminate.
//
// Entries are keyed by session token as well as action/params. Sharing one cache entry
// across users would be a bigger win, but serving a cached list to a caller whose token was
// never validated upstream would be an auth bypass — so the token stays part of the key.
//
// This lives in serverless instance memory, so it is per-instance and vanishes on cold
// start. That is fine: it is a latency/reliability optimization, never a source of truth.

const TTL_MS = 30_000;
const MAX_ENTRIES = 500;

const CACHEABLE_ACTIONS = new Set(['listProducts', 'getProduct']);
const INVALIDATING_ACTIONS = new Set([
  'addProduct',
  'updateProduct',
  'deleteProduct',
  'uploadImage',
  'logout',
  'changePassword',
]);

const cache = new Map();

function keyFor(action, payload) {
  const { token, ...rest } = payload || {};
  return `${token || 'anon'}::${action}::${JSON.stringify(rest)}`;
}

export function readCache(action, payload) {
  if (!CACHEABLE_ACTIONS.has(action)) return null;

  const entry = cache.get(keyFor(action, payload));
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    cache.delete(keyFor(action, payload));
    return null;
  }
  return entry.body;
}

export function writeCache(action, payload, body) {
  if (!CACHEABLE_ACTIONS.has(action)) return;
  if (!body || body.success !== true) return; // never cache errors

  if (cache.size >= MAX_ENTRIES) {
    cache.clear(); // crude, but this is a small bounded cache, not an LRU workload
  }
  cache.set(keyFor(action, payload), { expires: Date.now() + TTL_MS, body });
}

// Any write makes every cached read potentially stale. The catalogue is small and writes are
// rare, so dropping everything is simpler and safer than tracking dependencies.
export function invalidateOnWrite(action) {
  if (INVALIDATING_ACTIONS.has(action)) cache.clear();
}
