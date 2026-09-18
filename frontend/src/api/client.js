export class ApiError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

// Fires whenever any request comes back SESSION_EXPIRED, so AuthContext can react
// (clear state, redirect to /login) without every call site handling it individually.
let onSessionExpired = () => {};
export function setSessionExpiredHandler(handler) {
  onSessionExpired = handler;
}

async function unwrap(res) {
  const json = await res.json();
  if (!json.success) {
    if (json.error === 'SESSION_EXPIRED') onSessionExpired();
    throw new ApiError(json.error, json.message);
  }
  return json.data;
}

// Every call goes through our own same-origin /api/gas relay rather than hitting Apps
// Script directly, for two reasons:
//   1. Apps Script serves doPost responses via a redirect that browsers can't follow
//      correctly cross-origin (they downgrade POST to GET), which breaks writes.
//   2. The exec endpoint intermittently returns 404/HTML instead of the script's output
//      (measured at roughly 1 in 3 requests). The relay retries, so a blip doesn't
//      surface as a failed login or a missing product.
// Reads and writes share this path so both get that retry behaviour.
async function call(action, payload) {
  const res = await fetch(`/api/gas?action=${encodeURIComponent(action)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return unwrap(res);
}

export async function apiGet(action, params = {}) {
  return call(action, params);
}

export async function apiPost(action, payload) {
  return call(action, payload);
}
