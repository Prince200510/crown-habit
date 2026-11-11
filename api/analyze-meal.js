import { callGeminiVision } from '../server/gemini-proxy.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Crown-Token');

  if (req.method === 'OPTIONS') {
    return res.status(200).json({ ok: true });
  }

  if (req.method === 'GET') {
    return res.status(200).json({
      ok: true,
      configured: Boolean(process.env.GEMINI_API_KEY),
      model: process.env.GEMINI_MODEL || 'gemini-2.5-flash'
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const requiredToken = process.env.AI_PROXY_SHARED_TOKEN;
  if (requiredToken && req.headers['x-crown-token'] !== requiredToken) {
    return res.status(401).json({ error: 'Unauthorized proxy token.' });
  }

  try {
    const { base64Image, mimeType, userHint } = req.body || {};
    if (!base64Image) {
      return res.status(400).json({ error: 'Missing base64Image in request body.' });
    }
    const result = await callGeminiVision({ base64Image, mimeType, userHint });
    return res.status(200).json(result);
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      error: err.message || 'Failed to analyse meal image.'
    });
  }
}
