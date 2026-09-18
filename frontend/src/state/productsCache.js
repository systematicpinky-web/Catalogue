// Module-level cache so navigating list -> detail -> back renders the last-known list
// instantly (stale-while-revalidate) instead of a blank loading state, while a fresh
// fetch still runs in the background. Cleared after any mutation so edits show up promptly.
let cache = null;

export function getCachedProducts() {
  return cache;
}

export function setCachedProducts(data) {
  cache = data;
}

export function clearProductsCache() {
  cache = null;
}
