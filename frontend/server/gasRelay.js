// Apps Script Web App responses to doPost are served via a redirect to a
// script.googleusercontent.com "echo" URL. Browsers downgrade a POST to GET when
// following a 301/302 (per the fetch spec), which breaks that echo lookup cross-origin
// and comes back as an HTML error page instead of JSON. Node's fetch follows the same
// redirect but with no Origin/CORS involved, so the same POST->redirect->GET dance
// resolves cleanly here. Relaying writes through this server-side hop is the fix.

import { readCache, writeCache, invalidateOnWrite } from './gasCache.js';

// The exec endpoint fails intermittently at roughly 1 in 3 requests (measured), so a
// single retry isn't enough: 5 attempts puts the odds of a user-visible failure under 1%.
const MAX_ATTEMPTS = 5;

async function postOnce(gasUrl, action, payload) {
  const url = new URL(gasUrl);
  url.searchParams.set('action', action);

  const res = await fetch(url.toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
    body: JSON.stringify(payload),
  });

  return { status: res.status, text: await res.text() };
}

export async function relayToGas(gasUrl, action, payload) {
  const cached = readCache(action, payload);
  if (cached) return { status: 200, body: cached };

  invalidateOnWrite(action);

  let last = null;

  // That echo-URL lookup occasionally fails transiently (Google serves an HTML error page
  // instead of the script's output). Retrying re-runs the request and usually succeeds,
  // which beats failing a login on a blip.
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      last = await postOnce(gasUrl, action, payload);
      const body = JSON.parse(last.text);
      writeCache(action, payload, body);
      return { status: 200, body };
    } catch (err) {
      if (!last) last = { status: 0, text: err.message };
      if (attempt < MAX_ATTEMPTS) {
        await new Promise((resolve) => setTimeout(resolve, 300 * attempt));
      }
    }
  }

  return {
    status: 502,
    body: {
      success: false,
      error: 'BAD_GATEWAY',
      message: `Apps Script returned a non-JSON response (HTTP ${last.status}) after ${MAX_ATTEMPTS} attempts: ${last.text.slice(0, 200)}`,
    },
  };
}
