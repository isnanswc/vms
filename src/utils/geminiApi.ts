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
      let systemInstructionText = 'Anda adalah Fleet Intelligence Assistant profesional untuk sistem manajemen armada dan kendaraan VMS.';
      if (settings.systemPromptPreset === 'financial-mechanic') {
        systemInstructionText += ' Prioritaskan analisis efisiensi pengeluaran rupiah BBM, estimasi biaya servis, dan rekomendasi hemat anggaran.';
      } else if (settings.systemPromptPreset === 'casual-assistant') {
        systemInstructionText += ' Berikan respon santai, ramah, dan mudah dipahami oleh pemilik kendaraan non-teknis.';
      } else {
        systemInstructionText += ' Berikan diagnosa teknis presisi tinggi, interval kilometer perawatan berkala, dan panduan suku cadang.';
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
          temperature: 0.4,
          maxOutputTokens: 1200,
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
