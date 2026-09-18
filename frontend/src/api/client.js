const BASE_URL = import.meta.env.VITE_API_BASE_URL;

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

export async function apiGet(action, params = {}) {
  const url = new URL(BASE_URL);
  url.searchParams.set('action', action);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v);
  });
  const res = await fetch(url.toString());
  return unwrap(res);
}

export async function apiPost(action, payload) {
  const url = new URL(BASE_URL);
  url.searchParams.set('action', action);
  const res = await fetch(url.toString(), {
    method: 'POST',
    // text/plain avoids a CORS preflight Apps Script cannot answer — do not change this
    // to application/json or add custom headers (e.g. Authorization).
    headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
    body: JSON.stringify(payload),
  });
  return unwrap(res);
}
