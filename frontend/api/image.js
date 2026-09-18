import { fetchDriveImage, IMAGE_CACHE_CONTROL } from '../server/driveImage.js';

// Vercel serverless function: same-origin image proxy in front of Drive.
// See server/driveImage.js for why this exists.
export default async function handler(req, res) {
  try {
    const { buffer, contentType } = await fetchDriveImage(req.query.id, req.query.w);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', IMAGE_CACHE_CONTROL);
    res.status(200).send(buffer);
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
}
