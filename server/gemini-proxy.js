import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

function loadEnvFile() {
  const envPath = path.resolve(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, 'utf8');
  content.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) return;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^['"]|['"]$/g, '');
    process.env[key] = val;
  });
}

loadEnvFile();

const PORT = Number(process.env.AI_PROXY_PORT || 8787);
const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

export const NUTRITION_RESPONSE_SCHEMA = {
  type: 'OBJECT',
  required: ['meal_name', 'food_items', 'totals', 'confidence', 'uncertainties'],
  properties: {
    meal_name: { type: 'STRING' },
    suggested_category: {
      type: 'STRING',
      enum: ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Drink', 'Outside food']
    },
    is_likely_outside_food: { type: 'BOOLEAN' },
    food_items: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        required: [
          'name',
          'quantity',
          'unit',
          'estimated_weight_g',
          'calories_kcal',
          'protein_g',
          'carbs_g',
          'fat_g',
          'fibre_g'
        ],
        properties: {
          name: { type: 'STRING' },
          quantity: { type: 'NUMBER' },
          unit: { type: 'STRING' },
          estimated_weight_g: { type: 'NUMBER' },
          calories_kcal: { type: 'NUMBER' },
          protein_g: { type: 'NUMBER' },
          carbs_g: { type: 'NUMBER' },
          fat_g: { type: 'NUMBER' },
          fibre_g: { type: 'NUMBER' },
          sugar_g: { type: 'NUMBER' },
          sodium_mg: { type: 'NUMBER' }
        }
      }
    },
    totals: {
      type: 'OBJECT',
      required: ['calories_kcal', 'protein_g', 'carbs_g', 'fat_g', 'fibre_g'],
      properties: {
        calories_kcal: { type: 'NUMBER' },
        protein_g: { type: 'NUMBER' },
        carbs_g: { type: 'NUMBER' },
        fat_g: { type: 'NUMBER' },
        fibre_g: { type: 'NUMBER' },
        sugar_g: { type: 'NUMBER' },
        sodium_mg: { type: 'NUMBER' }
      }
    },
    confidence: {
      type: 'STRING',
      enum: ['high', 'medium', 'low']
    },
    uncertainties: {
      type: 'ARRAY',
      items: { type: 'STRING' }
    }
  }
};

export const NUTRITION_SYSTEM_PROMPT = `You are CROWN AI NUTRITION, an expert Indian and global nutritionist.
Analyse the provided meal photograph and return a structured JSON nutrition estimate.

Requirements:
1. Identify each distinct visible food item.
2. Give special attention to Indian cuisine and authentic regional names:
   - Breakfast: Oats, Poha, Upma, Idli, Dosa, Paratha, Thepla, Sandwich, Chilla, Uttapam, Medu Vada.
   - Indian meals: Roti, Chapati, Phulka, Dal (Tadka, Fry, Makhani), Rice, Jeera Rice, Khichdi, Sabzi, Rajma, Chole, Paneer dishes, Curd/Raita, Kadhi, Sambhar.
   - Street food: Vada pav, Pav bhaji, Samosa, Pani puri, Bhel puri, Dabeli, Misal pav, Kachori, Pakora, Chaat.
   - Restaurant food: Biryani, Naan, Butter chicken, Paneer butter masala, Thali, Fried rice, Hakka Noodles, Manchurian.
   - Beverages, fruits, snacks, Indian sweets, and packaged foods.
3. Estimate portion quantities in realistic household units (pieces, bowl, katori, plate, cup, glass, tbsp) and estimated_weight_g in grams.
4. Estimate calories_kcal, protein_g, carbs_g, fat_g, fibre_g, and where reasonably possible sugar_g and sodium_mg.
5. Never claim exact laboratory accuracy from a photograph.
6. Explicitly list uncertainties in the "uncertainties" array whenever portion depth, hidden cooking oil, ghee, butter, cream, sugar syrup, or stuffing cannot be visually verified, and mention that the user may adjust preparation details.
7. Do not invent unseen ingredients.
8. Ensure totals equal the sum of all food_items.`;

function normalizeAndValidateResult(parsed) {
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('AI response is not a valid JSON object.');
  }
  if (!Array.isArray(parsed.food_items) || parsed.food_items.length === 0) {
    throw new Error('No recognizable food items were returned by the AI model.');
  }

  const normalizedItems = parsed.food_items.map((item, idx) => {
    const calories = Math.max(0, Math.round(Number(item.calories_kcal) || 0));
    const protein = Math.max(0, Math.round((Number(item.protein_g) || 0) * 10) / 10);
    const carbs = Math.max(0, Math.round((Number(item.carbs_g) || 0) * 10) / 10);
    const fat = Math.max(0, Math.round((Number(item.fat_g) || 0) * 10) / 10);
    const fibre = Math.max(0, Math.round((Number(item.fibre_g) || 0) * 10) / 10);
    const sugar = Math.max(0, Math.round((Number(item.sugar_g) || 0) * 10) / 10);
    const sodium = Math.max(0, Math.round(Number(item.sodium_mg) || 0));
    const weight = Math.max(1, Math.round(Number(item.estimated_weight_g) || 100));
    const quantity = Math.max(0.25, Number(item.quantity) || 1);

    return {
      id: `item_${Date.now()}_${idx}`,
      name: String(item.name || `Food Item ${idx + 1}`).trim(),
      quantity,
      unit: String(item.unit || 'serving').trim(),
      estimated_weight_g: weight,
      calories_kcal: calories,
      protein_g: protein,
      carbs_g: carbs,
      fat_g: fat,
      fibre_g: fibre,
      sugar_g: sugar,
      sodium_mg: sodium
    };
  });

  const totals = normalizedItems.reduce(
    (acc, item) => ({
      calories_kcal: Math.round(acc.calories_kcal + item.calories_kcal),
      protein_g: Math.round((acc.protein_g + item.protein_g) * 10) / 10,
      carbs_g: Math.round((acc.carbs_g + item.carbs_g) * 10) / 10,
      fat_g: Math.round((acc.fat_g + item.fat_g) * 10) / 10,
      fibre_g: Math.round((acc.fibre_g + item.fibre_g) * 10) / 10,
      sugar_g: Math.round((acc.sugar_g + (item.sugar_g || 0)) * 10) / 10,
      sodium_mg: Math.round(acc.sodium_mg + (item.sodium_mg || 0))
    }),
    { calories_kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fibre_g: 0, sugar_g: 0, sodium_mg: 0 }
  );

  const confidence = ['high', 'medium', 'low'].includes(parsed.confidence)
    ? parsed.confidence
    : 'medium';

  const uncertainties = Array.isArray(parsed.uncertainties) && parsed.uncertainties.length > 0
    ? parsed.uncertainties.map((u) => String(u))
    : ['Cooking oil, ghee, or hidden preparation ingredients cannot be determined solely from a photograph.'];

  return {
    meal_name: String(parsed.meal_name || 'Analysed Meal').trim(),
    suggested_category: parsed.suggested_category || 'Lunch',
    is_likely_outside_food: Boolean(parsed.is_likely_outside_food),
    food_items: normalizedItems,
    totals,
    confidence,
    uncertainties
  };
}

export async function callGeminiVision({ base64Image, mimeType, userHint, apiKey, modelName }) {
  loadEnvFile();
  const key = (apiKey || process.env.GEMINI_API_KEY || '').trim();
  if (!key) {
    const err = new Error('GEMINI_API_KEY is not configured in .env.');
    err.statusCode = 503;
    throw err;
  }

  const model = modelName || process.env.GEMINI_MODEL || DEFAULT_MODEL;
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`;

  const promptText = userHint
    ? `${NUTRITION_SYSTEM_PROMPT}\n\nUser preparation note / context: ${String(userHint).slice(0, 400)}`
    : NUTRITION_SYSTEM_PROMPT;

  const payload = {
    contents: [
      {
        role: 'user',
        parts: [
          { text: promptText },
          {
            inlineData: {
              mimeType: mimeType || 'image/jpeg',
              data: base64Image
            }
          }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.2,
      responseMimeType: 'application/json',
      responseSchema: NUTRITION_RESPONSE_SCHEMA
    }
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const rawBodyText = await response.text();
  if (!response.ok) {
    let apiErrorMsg = rawBodyText.slice(0, 300);
    try {
      const errJson = JSON.parse(rawBodyText);
      if (errJson?.error?.message) {
        apiErrorMsg = errJson.error.message;
      }
    } catch {
      void 0;
    }
    const err = new Error(
      `Gemini API error (${response.status}): ${apiErrorMsg}. Please verify that GEMINI_API_KEY in .env is a valid Google AI Studio API key (starts with "AIza...").`
    );
    err.statusCode = response.status;
    throw err;
  }

  let data;
  try {
    data = JSON.parse(rawBodyText);
  } catch {
    throw new Error('Gemini API returned non-JSON response payload.');
  }

  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) {
    throw new Error('Gemini returned an empty response. Please try a clearer food photograph.');
  }

  let parsed;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    const cleaned = rawText.replace(/```json|```/g, '').trim();
    parsed = JSON.parse(cleaned);
  }

  return normalizeAndValidateResult(parsed);
}

function sendJson(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Crown-Token'
  });
  res.end(JSON.stringify(data));
}

function isLocalhostRequest(req) {
  const remote = req.socket?.remoteAddress || '';
  const host = req.headers?.host || '';
  return (
    remote === '127.0.0.1' ||
    remote === '::1' ||
    remote === '::ffff:127.0.0.1' ||
    host.startsWith('localhost') ||
    host.startsWith('127.0.0.1')
  );
}

const currentFilePath = fileURLToPath(import.meta.url);
const executedFilePath = process.argv[1] ? path.resolve(process.argv[1]) : '';

if (executedFilePath && path.resolve(currentFilePath) === executedFilePath) {
  const server = http.createServer(async (req, res) => {
    const pathname = new URL(req.url || '/', `http://localhost:${PORT}`).pathname;

    if (req.method === 'OPTIONS') {
      sendJson(res, 200, { ok: true });
      return;
    }

    if (req.method === 'GET' && (pathname === '/api/health' || pathname === '/')) {
      loadEnvFile();
      sendJson(res, 200, {
        ok: true,
        configured: Boolean(process.env.GEMINI_API_KEY),
        model: process.env.GEMINI_MODEL || DEFAULT_MODEL
      });
      return;
    }

    if (req.method === 'POST' && pathname === '/api/analyze-meal') {
      loadEnvFile();
      const requiredToken = process.env.AI_PROXY_SHARED_TOKEN;
      const clientToken = req.headers['x-crown-token'];

      if (requiredToken && !isLocalhostRequest(req) && clientToken !== requiredToken) {
        sendJson(res, 401, { error: 'Unauthorized proxy token.' });
        return;
      }

      let body = '';
      req.on('data', (chunk) => {
        body += chunk;
        if (body.length > 12 * 1024 * 1024) {
          req.destroy();
        }
      });

      req.on('end', async () => {
        try {
          const parsedBody = body ? JSON.parse(body) : {};
          const { base64Image, mimeType, userHint } = parsedBody;
          if (!base64Image || typeof base64Image !== 'string') {
            sendJson(res, 400, { error: 'Missing base64Image in request payload.' });
            return;
          }
          const result = await callGeminiVision({ base64Image, mimeType, userHint });
          sendJson(res, 200, result);
        } catch (err) {
          sendJson(res, err.statusCode || 500, {
            error: err.message || 'Failed to analyse meal image.'
          });
        }
      });
      return;
    }

    sendJson(res, 404, { error: 'Endpoint not found' });
  });

  server.listen(PORT, () => {
    console.log(`CROWN HABIT Gemini Proxy listening on http://localhost:${PORT}`);
  });
}
