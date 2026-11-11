import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { getStoredSettings } from '../localStorage/storageService';
import { calculateItemsTotals } from '../nutrition/nutritionService';

let lastAnalysedSignature = null;
let lastAnalysedResult = null;

const NUTRITION_RESPONSE_SCHEMA = {
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

const NUTRITION_SYSTEM_PROMPT = `You are CROWN AI NUTRITION, an expert Indian and global nutritionist.
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

function getEnvGeminiKey() {
  const settings = getStoredSettings();
  if (settings.geminiApiKey) return settings.geminiApiKey.trim();
  if (typeof __APP_GEMINI_KEY__ !== 'undefined' && __APP_GEMINI_KEY__) {
    return String(__APP_GEMINI_KEY__).trim();
  }
  return (import.meta.env.VITE_GEMINI_API_KEY || '').trim();
}

function getEnvGeminiModel() {
  if (typeof __APP_GEMINI_MODEL__ !== 'undefined' && __APP_GEMINI_MODEL__) {
    return String(__APP_GEMINI_MODEL__).trim();
  }
  return import.meta.env.VITE_GEMINI_MODEL || 'gemini-2.5-flash';
}

export async function captureOrPickMealImage(mode = 'camera') {
  try {
    const photo = await Camera.getPhoto({
      quality: 82,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
      source: mode === 'camera' ? CameraSource.Camera : CameraSource.Photos,
      width: 1024,
      height: 1024
    });

    if (photo && photo.dataUrl) {
      return await compressDataUrl(photo.dataUrl, 1024, 0.78);
    }
    throw new Error('No image captured.');
  } catch (err) {
    if (err?.message && err.message.toLowerCase().includes('cancelled')) {
      return null;
    }
    throw err;
  }
}

export function compressDataUrl(dataUrl, maxDimension = 1024, quality = 0.78) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxDimension || height > maxDimension) {
        if (width >= height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
      const base64Image = compressedDataUrl.split(',')[1] || '';

      const thumbCanvas = document.createElement('canvas');
      const thumbSize = 160;
      thumbCanvas.width = thumbSize;
      thumbCanvas.height = Math.round((height / width) * thumbSize) || thumbSize;
      const thumbCtx = thumbCanvas.getContext('2d');
      thumbCtx.drawImage(img, 0, 0, thumbCanvas.width, thumbCanvas.height);
      const thumbnailDataUrl = thumbCanvas.toDataURL('image/jpeg', 0.6);

      resolve({
        dataUrl: compressedDataUrl,
        thumbnailDataUrl,
        base64Image,
        mimeType: 'image/jpeg',
        width,
        height
      });
    };
    img.onerror = () => reject(new Error('Could not process selected image file.'));
    img.src = dataUrl;
  });
}

export function readFileAsCompressedImage(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('No file selected'));
      return;
    }
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const result = await compressDataUrl(e.target.result, 1024, 0.78);
        resolve(result);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.readAsDataURL(file);
  });
}

export function validateAiNutritionResponse(payload) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Malformed AI response: expected a structured JSON object.');
  }
  if (!Array.isArray(payload.food_items) || payload.food_items.length === 0) {
    throw new Error('AI response did not include any detected food_items.');
  }

  const sanitizedItems = payload.food_items.map((item, idx) => ({
    id: item.id || `ai_item_${Date.now()}_${idx}`,
    name: String(item.name || `Detected Item ${idx + 1}`).trim(),
    quantity: Math.max(0.25, Number(item.quantity) || 1),
    unit: String(item.unit || 'serving').trim(),
    estimated_weight_g: Math.max(1, Math.round(Number(item.estimated_weight_g) || 100)),
    calories_kcal: Math.max(0, Math.round(Number(item.calories_kcal) || 0)),
    protein_g: Math.max(0, Math.round((Number(item.protein_g) || 0) * 10) / 10),
    carbs_g: Math.max(0, Math.round((Number(item.carbs_g) || 0) * 10) / 10),
    fat_g: Math.max(0, Math.round((Number(item.fat_g) || 0) * 10) / 10),
    fibre_g: Math.max(0, Math.round((Number(item.fibre_g) || 0) * 10) / 10),
    sugar_g: Math.max(0, Math.round((Number(item.sugar_g) || 0) * 10) / 10),
    sodium_mg: Math.max(0, Math.round(Number(item.sodium_mg) || 0))
  }));

  const totals = calculateItemsTotals(sanitizedItems);

  return {
    meal_name: String(payload.meal_name || 'Analysed Meal').trim(),
    suggested_category: payload.suggested_category || 'Lunch',
    is_likely_outside_food: Boolean(payload.is_likely_outside_food),
    food_items: sanitizedItems,
    totals,
    confidence: ['high', 'medium', 'low'].includes(payload.confidence) ? payload.confidence : 'medium',
    uncertainties:
      Array.isArray(payload.uncertainties) && payload.uncertainties.length > 0
        ? payload.uncertainties.map(String)
        : ['Cooking oil, ghee, butter or hidden ingredients cannot be visually confirmed from a photograph.']
  };
}

async function callGeminiDirectOnDevice({ base64Image, mimeType, userHint }) {
  const apiKey = getEnvGeminiKey();
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in .env.');
  }

  const model = getEnvGeminiModel();
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const promptText = userHint
    ? `${NUTRITION_SYSTEM_PROMPT}\n\nUser preparation note / context: ${String(userHint).slice(0, 400)}`
    : NUTRITION_SYSTEM_PROMPT;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
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
    })
  });

  const rawBody = await response.text();
  if (!response.ok) {
    let detail = rawBody.slice(0, 250);
    try {
      const errObj = JSON.parse(rawBody);
      if (errObj?.error?.message) detail = errObj.error.message;
    } catch {
      void 0;
    }
    throw new Error(`Gemini API error (${response.status}): ${detail}`);
  }

  const data = JSON.parse(rawBody);
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) {
    throw new Error('Gemini returned an empty response. Please try a clearer food photograph.');
  }

  let parsed;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    parsed = JSON.parse(rawText.replace(/```json|```/g, '').trim());
  }

  return validateAiNutritionResponse(parsed);
}

export async function analyseMealWithGemini({ base64Image, mimeType = 'image/jpeg', userHint = '' }) {
  if (!navigator.onLine) {
    throw new Error('You are currently offline. AI Food Recognition requires an active internet connection.');
  }

  if (!base64Image) {
    throw new Error('Please capture or select a meal image first.');
  }

  const signature = `${base64Image.slice(0, 64)}_${base64Image.length}_${userHint}`;
  if (signature === lastAnalysedSignature && lastAnalysedResult) {
    return lastAnalysedResult;
  }

  const directKey = getEnvGeminiKey();
  if (directKey) {
    const validated = await callGeminiDirectOnDevice({ base64Image, mimeType, userHint });
    lastAnalysedSignature = signature;
    lastAnalysedResult = validated;
    return validated;
  }

  const settings = getStoredSettings();
  const proxyUrl = settings.aiProxyUrl || import.meta.env.VITE_AI_PROXY_URL || '/api/analyze-meal';
  const headers = { 'Content-Type': 'application/json' };
  const token = settings.aiProxyToken || import.meta.env.VITE_AI_PROXY_SHARED_TOKEN || '';
  if (token) {
    headers['X-Crown-Token'] = token;
  }

  const response = await fetch(proxyUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      base64Image,
      mimeType,
      userHint
    })
  });

  const textBody = await response.text();
  const parsedJson = textBody ? JSON.parse(textBody) : null;
  if (!response.ok || !parsedJson) {
    throw new Error(parsedJson?.error || 'AI analysis failed.');
  }

  const validated = validateAiNutritionResponse(parsedJson);
  lastAnalysedSignature = signature;
  lastAnalysedResult = validated;
  return validated;
}

export async function checkGeminiProxyStatus() {
  if (!navigator.onLine) {
    return { online: false, configured: false, message: 'Device offline' };
  }
  const directKey = getEnvGeminiKey();
  if (directKey) {
    return {
      online: true,
      configured: true,
      model: getEnvGeminiModel(),
      message: `Ready (${getEnvGeminiModel()})`
    };
  }
  return {
    online: true,
    configured: false,
    message: 'Add GEMINI_API_KEY in .env'
  };
}
