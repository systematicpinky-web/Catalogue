// Fetches a Drive image server-side so viewers never hit Google's image CDN directly.
// That CDN rate-limits (429) per client and gives us no cache control; proxying means one
// upstream fetch per image, then our own CDN/browser caching serves everyone else.

// Only ever build the upstream URL from a validated file ID — never from a client-supplied
// URL — so this endpoint can't be pointed at arbitrary hosts (SSRF).
const ID_PATTERN = /^[A-Za-z0-9_-]{10,100}$/;
const ALLOWED_WIDTHS = new Set([400, 1000, 2000]);

const MAX_ATTEMPTS = 3;

async function fetchOnce(id, w) {
  const res = await fetch(`https://drive.google.com/thumbnail?id=${id}&sz=w${w}`);
  if (!res.ok) {
    throw new Error(`Upstream returned ${res.status}`);
  }

  const contentType = res.headers.get('content-type') || '';
  if (!contentType.startsWith('image/')) {
    throw new Error('Upstream did not return an image (is the file shared with "anyone with the link"?)');
  }

  return { buffer: Buffer.from(await res.arrayBuffer()), contentType };
}

export async function fetchDriveImage(id, width) {
  if (!ID_PATTERN.test(String(id || ''))) {
    throw new Error('Invalid file id');
  }

  const w = ALLOWED_WIDTHS.has(Number(width)) ? Number(width) : 1000;

  // Drive's image endpoint rate-limits and blips like the rest of Google's endpoints here,
  // so retry rather than serving a broken image.
  let lastError;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      return await fetchOnce(id, w);
    } catch (err) {
      lastError = err;
      if (attempt < MAX_ATTEMPTS) {
        await new Promise((resolve) => setTimeout(resolve, 300 * attempt));
      }
    }
  }
  throw lastError;
}

// Drive file IDs are immutable and replacing a photo mints a new ID, so these are safe to
// cache hard: a year at the CDN, a day in the browser.
export const IMAGE_CACHE_CONTROL = 'public, max-age=86400, s-maxage=31536000, immutable';
