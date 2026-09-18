// Pull the Drive file ID out of whatever URL shape is stored, so we can request the image
// through our own /api/image proxy rather than hotlinking Google's CDN (which rate-limits
// per viewer and gives us no cache control).
export function extractDriveId(url) {
  const value = String(url || '');
  const match =
    value.match(/[?&]id=([A-Za-z0-9_-]{10,})/) ||
    value.match(/\/file\/d\/([A-Za-z0-9_-]{10,})/) ||
    value.match(/googleusercontent\.com\/d\/([A-Za-z0-9_-]{10,})/);
  return match ? match[1] : null;
}

export function imageSrc(url, width) {
  const id = extractDriveId(url);
  if (!id) return url || ''; // not a Drive link (e.g. an image hosted elsewhere) — use as-is
  return `/api/image?id=${id}&w=${width}`;
}
