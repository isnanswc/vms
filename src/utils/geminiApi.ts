import type { AiSettings } from '../types/chat';

export const FALLBACK_DEFAULT_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.5-pro',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-1.5-flash',
  'gemini-1.5-pro',
];

interface GeminiModelItem {
  name: string;
  supportedGenerationMethods?: string[];
  displayName?: string;
  description?: string;
}

/**
 * Fetch available generative models from Google Gemini API
 */
export async function fetchAvailableGeminiModels(apiKey: string): Promise<string[]> {
  const cleanKey = apiKey.trim();
  if (!cleanKey) {
    return FALLBACK_DEFAULT_MODELS;
  }

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${cleanKey}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error(`Gagal membaca model dari API (HTTP ${res.status})`);
    }

    const data = await res.json();
    if (data.models && Array.isArray(data.models)) {
      const filtered = data.models
        .filter((m: GeminiModelItem) => {
          const name = m.name || '';
          const methods = m.supportedGenerationMethods || [];
          const isContentGen = methods.includes('generateContent');
          const isExcluded = name.includes('embedding') || name.includes('aqa') || name.includes('imagen') || name.includes('text-bison');
          return isContentGen && !isExcluded;
        })
        .map((m: GeminiModelItem) => m.name.replace(/^models\//, ''));

      if (filtered.length > 0) {
        return filtered;
      }
    }
    return FALLBACK_DEFAULT_MODELS;
  } catch (err) {
    console.warn('Gagal memuat model dari Gemini API, menggunakan daftar fallback:', err);
    return FALLBACK_DEFAULT_MODELS;
  }
}

/**
 * Execute Gemini API request with 3-slot fallback cascade
 */
export async function callGeminiWithFallback(
  prompt: string,
  settings: AiSettings,
  imagePayload?: { mimeType: string; dataBase64: string }
): Promise<{ text: string; modelUsed: string; fallbackSlotIndex: number }> {
  const cleanKey = settings.apiKey?.trim();
  if (!cleanKey) {
    throw new Error('NO_API_KEY');
  }

  // Ensure 3 fallback slots
  const slots = [
    settings.fallbackSlots?.[0] || settings.selectedModel || 'gemini-2.5-flash',
    settings.fallbackSlots?.[1] || 'gemini-2.0-flash',
    settings.fallbackSlots?.[2] || 'gemini-1.5-flash',
  ];

  let lastError: Error | null = null;

  for (let i = 0; i < slots.length; i++) {
    const model = slots[i];
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${cleanKey}`;
      
      const contentsParts: any[] = [];
      if (imagePayload) {
        contentsParts.push({
          inlineData: {
            mimeType: imagePayload.mimeType,
            data: imagePayload.dataBase64,
          },
        });
      }
      contentsParts.push({ text: prompt });

      // Persona system instruction
      let systemInstructionText = 'Anda adalah Fleet Intelligence Assistant & Chief Mechanical Engineer terpercaya untuk platform manajemen kendaraan VMS di Indonesia. Berikan penjelasan yang komprehensif, terstruktur, mendalam, dan sangat solutif. Format jawaban Anda dengan rapi: gunakan heading (### Judul Bagian), poin-poin terperinci (•), penjelasan teknis yang mendalam namun mudah dipahami, rekomendasi suku cadang & interval kilometer presisi, estimasi rupiah realistis, serta langkah pencegahan keausan. Hindari jawaban singkat 1-2 kalimat; berikan edukasi dan analisa berbobot bagi pemilik armada.';
      if (settings.systemPromptPreset === 'financial-mechanic') {
        systemInstructionText += ' Berikan penekanan ekstra pada analisa efisiensi pengeluaran rupiah BBM, rasio KM/Liter, perbandingan oli murah vs awet, serta cara menekan biaya servis tak terduga.';
      } else if (settings.systemPromptPreset === 'casual-assistant') {
        systemInstructionText += ' Berikan penjelasan yang ramah, analogi sederhana untuk pengguna awam, langkah demi langkah, dan tetap lengkap.';
      } else {
        systemInstructionText += ' Utamakan akurasi toleransi mekanik, kode part, spesifikasi viskositas oli (SAE & API/JASO), torsi, dan interval servis berkala resmi pabrikan.';
      }

      const body = {
        contents: [
          {
            parts: contentsParts,
          },
        ],
        systemInstruction: {
          parts: [{ text: systemInstructionText }],
        },
        generationConfig: {
          temperature: 0.35,
          maxOutputTokens: 2400,
        },
      };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        throw new Error(`Model ${model} gagal (HTTP ${res.status}): ${errText}`);
      }

      const resData = await res.json();
      const generatedText = resData.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!generatedText) {
        throw new Error(`Model ${model} mengembalikan respons kosong.`);
      }

      return {
        text: generatedText,
        modelUsed: model,
        fallbackSlotIndex: i,
      };
    } catch (err: any) {
      console.warn(`[VMS Fallback] Slot ${i + 1} (${model}) gagal:`, err?.message || err);
      lastError = err;
      // Continue to next slot in array
    }
  }

  throw lastError || new Error('Semua slot model AI gagal memberikan respon.');
}

export interface AnalyzedVehicleResult {
  name: string;
  brand: string;
  model: string;
  year: number;
  category: 'motor' | 'mobil' | 'truk';
  fuelType: 'Pertalite' | 'Pertamax' | 'Pertamax Turbo' | 'Solar' | 'Bio Solar' | 'Dexlite' | 'Listrik';
  tankCapacityLiters: number;
  maxCargoWeightKg?: number;
  notes: string;
  stnkTaxCostAnnual: number;
  stnkTaxCostFiveYear: number;
  defaultParts: {
    name: string;
    intervalKm: number;
    costEstimate: number;
  }[];
}

/**
 * Dynamically analyze any vehicle brand/model using Gemini AI
 * Returns full vehicle specifications and a comprehensive list of OEM spare parts
 */
export async function analyzeVehicleWithAI(
  query: string,
  apiKey?: string
): Promise<AnalyzedVehicleResult | null> {
  const cleanKey = apiKey?.trim();
  if (!cleanKey) return null;

  const prompt = `Analisa spesifikasi teknis dan suku cadang lengkap untuk kendaraan: "${query}".
Kembalikan HANYA sebuah JSON valid (RFC 8259) tanpa komentar dan tanpa format markdown backtick (\`\`\`json).
Gunakan skema JSON berikut:
{
  "name": "Nama lengkap resmi kendaraan (contoh: Yamaha NMAX 155 Connected / Toyota All New Avanza 1.5 G)",
  "brand": "Merk kendaraan",
  "model": "Model kendaraan",
  "year": 2022,
  "category": "motor" atau "mobil" atau "truk",
  "fuelType": "Pertalite" atau "Pertamax" atau "Pertamax Turbo" atau "Solar" atau "Bio Solar" atau "Dexlite" atau "Listrik",
  "tankCapacityLiters": 5.5,
  "maxCargoWeightKg": 150,
  "notes": "Ringkasan teknis mesin, rekomendasi oli mesin resmi, dan karakteristik pemakaian",
  "stnkTaxCostAnnual": 350000,
  "stnkTaxCostFiveYear": 650000,
  "defaultParts": [
    {
      "name": "Nama komponen spesifik beserta spesifikasi teknisnya",
      "intervalKm": 3000,
      "costEstimate": 75000
    }
  ]
}
Catatan wajib: Sediakan DAFTAR LENGKAP 8 hingga 12 suku cadang esensial pabrikan (misal: Oli Mesin, Oli Transmisi/Gardan, Filter Oli, Filter Udara, Busi, V-Belt/Timing Chain, Kampas Rem Depan, Kampas Rem Belakang, Minyak Rem, Radiator Coolant, Aki/Baterai, Ban). Estimasi biaya adalah harga suku cadang OEM + ongkos pasang bengkel standar di Indonesia (Rupiah).`;

  try {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${cleanKey}`;
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 2000,
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!res.ok) {
      throw new Error(`AI Spec fetch failed with HTTP ${res.status}`);
    }

    const data = await res.json();
    let rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) return null;

    // Clean JSON formatting if markdown wraps it
    rawText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(rawText) as AnalyzedVehicleResult;

    if (parsed && parsed.name && Array.isArray(parsed.defaultParts) && parsed.defaultParts.length > 0) {
      return parsed;
    }
  } catch (err) {
    console.warn('[VMS AI Vehicle Discovery] Gagal query Gemini API:', err);
  }

  return null;
}
