import { relayToGas } from '../server/gasRelay.js';

// Vercel serverless function: same-origin POST relay to the Apps Script Web App.
// See server/gasRelay.js for why this hop exists.
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, error: 'METHOD_NOT_ALLOWED', message: 'Use POST' });
    return;
  }

  const gasUrl = process.env.VITE_API_BASE_URL;
  if (!gasUrl) {
    res.status(500).json({ success: false, error: 'SERVER_ERROR', message: 'VITE_API_BASE_URL is not configured' });
    return;
  }

  const action = req.query.action;
  if (!action) {
    res.status(400).json({ success: false, error: 'VALIDATION_ERROR', message: 'Missing action' });
    return;
  }

  try {
    const { status, body } = await relayToGas(gasUrl, action, req.body);
    res.status(status === 200 ? 200 : status).json(body);
  } catch (err) {
    res.status(502).json({ success: false, error: 'BAD_GATEWAY', message: err.message });
  }
}
