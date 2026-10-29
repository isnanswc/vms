import type { AiSettings } from '../types/chat';
import type { Vehicle, FuelLog, SparePart, ServiceRecord } from '../types';
import type { UserProfile } from '../types/user';

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

export interface FleetDataContext {
  vehicles: Vehicle[];
  fuelLogs: FuelLog[];
  spareParts: SparePart[];
  serviceRecords: ServiceRecord[];
  userProfile?: UserProfile;
}

export interface ChatHistoryMessage {
  sender: 'user' | 'ai';
  text: string;
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
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${cleanKey}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

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
 * Builds a structured, compact text snapshot of the entire fleet data
 * including automatic detection of anomalies (drop in efficiency, overdue parts, expired taxes/SIM).
 */
export function buildFleetContextPrompt(fleet?: FleetDataContext): string {
  if (!fleet) return '';

  const { vehicles, fuelLogs, spareParts, serviceRecords, userProfile } = fleet;

  let out = '=== DATA TERPADU SISTEM ARMADA (VMS KNOWLEDGE BASE) ===\n\n';

  // 1. Profil Pemilik & SIM
  if (userProfile) {
    out += `[PROFIL PENGGUNA / PEMILIK]\n`;
    out += `• Nama: ${userProfile.name} | Kontak: ${userProfile.phone} (${userProfile.email})\n`;
    if (userProfile.licenses && userProfile.licenses.length > 0) {
      out += `• Dokumen Surat Izin Mengemudi (SIM):\n`;
      userProfile.licenses.forEach((lic) => {
        out += `  - ${lic.simType} (No: ${lic.simNumber}): Berlaku s/d ${lic.expiryDate}\n`;
      });
    }
    out += '\n';
  }

  // 2. Daftar Unit Kendaraan
  out += `[UNIT KENDARAAN TERSIMPAN (${vehicles.length} UNIT)]\n`;
  if (vehicles.length === 0) {
    out += '• Belum ada unit kendaraan yang didaftarkan di garasi.\n';
  } else {
    vehicles.forEach((v) => {
      const isEV = v.fuelType === 'Listrik';
      out += `• ID: ${v.id} | [${v.plateNumber}] ${v.name} (${v.year})\n`;
      out += `  - Kategori: ${v.category} | Tipe Bahan Bakar/Energi: ${v.fuelType}\n`;
      out += `  - Odometer Saat Ini: ${v.currentOdometerKm.toLocaleString('id-ID')} KM | Skor Kesehatan: ${v.healthScore}%\n`;
      out += `  - Kapasitas: ${v.tankCapacityLiters} ${isEV ? 'kWh (Baterai)' : 'Liter (Tangki)'}\n`;
      out += `  - Pajak Tahunan: ${v.stnkExpiryDate} (Biaya: Rp ${v.stnkTaxCostAnnual.toLocaleString('id-ID')})\n`;
      out += `  - Pajak 5 Tahunan (Ganti Plat): ${v.stnkFiveYearExpiryDate} (Biaya: Rp ${v.stnkTaxCostFiveYear.toLocaleString('id-ID')})\n`;
    });
  }
  out += '\n';

  // 3. Log Bahan Bakar / Charging Terkini
  out += `[LOG TRANSAKSI BBM & PENGISIAN DAYA (${fuelLogs.length} CATATAN)]\n`;
  if (fuelLogs.length === 0) {
    out += '• Belum ada catatan pengisian bahan bakar/daya yang tersimpan.\n';
  } else {
    // Show up to 10 most recent logs
    const recentLogs = [...fuelLogs].slice(-10);
    recentLogs.forEach((l) => {
      const targetVeh = vehicles.find((v) => v.id === l.vehicleId);
      const vehName = targetVeh ? `${targetVeh.name} (${targetVeh.plateNumber})` : l.vehicleId;
      const isEV = l.fuelType === 'Listrik';
      const effText = l.efficiencyKmPerLiter ? ` | Efisiensi: ${l.efficiencyKmPerLiter} ${isEV ? 'KM/kWh' : 'KM/L'}` : '';
      out += `• Tanggal: ${l.date} | Unit: ${vehName} | ${l.liters} ${isEV ? 'kWh' : 'L'} (${l.fuelType}) | Biaya: Rp ${l.totalCost.toLocaleString('id-ID')} | Odo: ${l.odometerKm} KM | Lokasi: ${l.stationName} | Full: ${l.fullTank ? 'Ya' : 'Tidak'}${effText}\n`;
    });
  }
  out += '\n';

  // 4. Suku Cadang & Tingkat Keausan
  out += `[STATUS SUKU CADANG & WEAR LOG (${spareParts.length} KOMPONEN)]\n`;
  if (spareParts.length === 0) {
    out += '• Belum ada data suku cadang terdaftar.\n';
  } else {
    spareParts.forEach((sp) => {
      const targetVeh = vehicles.find((v) => v.id === sp.vehicleId);
      const vehName = targetVeh ? `${targetVeh.name} [${targetVeh.plateNumber}]` : sp.vehicleId;
      const wearPct = 100 - sp.estimatedLifeRemainingPct;
      out += `• Unit: ${vehName} | Komponen: ${sp.name} | Interval: ${sp.recommendedIntervalKm} KM | Sisa Umur: ${sp.estimatedLifeRemainingPct}% (Keausan: ${wearPct}%) | Status: ${sp.status}\n`;
    });
  }
  out += '\n';

  // 5. Riwayat Servis & Bengkel
  out += `[RIWAYAT SERVIS & PEMELIHARAAN (${serviceRecords.length} CATATAN)]\n`;
  if (serviceRecords.length === 0) {
    out += '• Belum ada catatan riwayat servis bengkel.\n';
  } else {
    const recentServices = [...serviceRecords].slice(-8);
    recentServices.forEach((sr) => {
      const targetVeh = vehicles.find((v) => v.id === sr.vehicleId);
      const vehName = targetVeh ? `${targetVeh.name} [${targetVeh.plateNumber}]` : sr.vehicleId;
      out += `• Tanggal: ${sr.date} | Unit: ${vehName} | Servis: ${sr.title} (${sr.type}) | Bengkel: ${sr.workshopName} | Odo: ${sr.odometerKm} KM | Biaya: Rp ${sr.cost.toLocaleString('id-ID')}\n`;
    });
  }
  out += '\n';

  // 6. Ringkasan Deteksi Anomali Otomatis
  const anomalies: string[] = [];
  const today = new Date('2026-10-21');

  // Check spare parts critical wear
  spareParts.forEach((sp) => {
    const wearPct = 100 - sp.estimatedLifeRemainingPct;
    if (wearPct >= 80 || sp.status === 'critical') {
      const v = vehicles.find((veh) => veh.id === sp.vehicleId);
      anomalies.push(`Komponen "${sp.name}" pada unit ${v?.name || sp.vehicleId} keausan sudah mencapai ${wearPct}% (Sisa: ${sp.estimatedLifeRemainingPct}%, Status: ${sp.status}, perlu segera diservis).`);
    }
  });

  // Check STNK annual & 5-year expiry
  vehicles.forEach((v) => {
    const d1 = new Date(v.stnkExpiryDate);
    const diff1 = Math.ceil((d1.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diff1 <= 30) {
      anomalies.push(`Pajak tahunan STNK untuk ${v.name} (${v.plateNumber}) akan jatuh tempo dalam ${diff1} hari (${v.stnkExpiryDate})!`);
    }
    if (v.healthScore < 70) {
      anomalies.push(`Indeks kesehatan unit ${v.name} (${v.plateNumber}) berada di level rendah (${v.healthScore}%).`);
    }
  });

  // Check SIM licenses
  if (userProfile?.licenses) {
    userProfile.licenses.forEach((lic) => {
      const d = new Date(lic.expiryDate);
      const diff = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (diff <= 30) {
        anomalies.push(`SIM ${lic.simType} milik ${userProfile.name} akan kedaluwarsa dalam ${diff} hari (${lic.expiryDate})!`);
      }
    });
  }

  if (anomalies.length > 0) {
    out += `[⚠️ PERHATIAN: ANOMALI SISTEM TERDETEKSI]\n`;
    anomalies.forEach((a, idx) => {
      out += `${idx + 1}. ${a}\n`;
    });
    out += '\n';
  }

  return out;
}

/**
 * Creates rolling summary of older conversation turns if conversation exceeds 6 turns,
 * ensuring high contextual memory without hitting token limits or truncation.
 */
export function buildConversationTurns(
  history: ChatHistoryMessage[],
  currentPrompt: string,
  imagePayload?: { mimeType: string; dataBase64: string }
): Array<{ role: 'user' | 'model'; parts: any[] }> {
  const contents: Array<{ role: 'user' | 'model'; parts: any[] }> = [];

  // Filter out any messages without text
  const validHistory = history.filter((m) => m.text && m.text.trim().length > 0);

  if (validHistory.length > 6) {
    // Summarize older messages
    const olderSlice = validHistory.slice(0, validHistory.length - 6);
    const recentSlice = validHistory.slice(validHistory.length - 6);

    const summaryText = olderSlice
      .map((m) => `${m.sender === 'user' ? 'Pengguna' : 'AI'}: ${m.text.slice(0, 140)}...`)
      .join(' | ');

    contents.push({
      role: 'user',
      parts: [
        {
          text: `[RANGKUMAN TOPIK PERCAKAPAN SEBELUMNYA DALAM SESI INI: ${summaryText}]`,
        },
      ],
    });

    contents.push({
      role: 'model',
      parts: [
        {
          text: 'Dipahami. Saya mengingat seluruh konteks percakapan kita sebelumnya dan siap melanjutkan.',
        },
      ],
    });

    // Add recent messages as multi-turn
    recentSlice.forEach((m) => {
      contents.push({
        role: m.sender === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }],
      });
    });
  } else {
    validHistory.forEach((m) => {
      contents.push({
        role: m.sender === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }],
      });
    });
  }

  // Add the final user message with optional image
  const currentParts: any[] = [];
  if (imagePayload) {
    currentParts.push({
      inlineData: {
        mimeType: imagePayload.mimeType,
        data: imagePayload.dataBase64,
      },
    });
  }
  currentParts.push({ text: currentPrompt });

  contents.push({
    role: 'user',
    parts: currentParts,
  });

  return contents;
}

/**
 * Execute Gemini API request with 3-slot fallback cascade,
 * full multi-turn conversation context, live fleet telemetry, and strict timeout resilience.
 */
export async function callGeminiWithFallback(
  prompt: string,
  settings: AiSettings,
  options?: {
    imagePayload?: { mimeType: string; dataBase64: string };
    history?: ChatHistoryMessage[];
    fleetContext?: FleetDataContext;
  }
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

  // Prepare system instructions with full fleet context and behavioral requirements
  const fleetSnapshot = buildFleetContextPrompt(options?.fleetContext);

  let systemInstructionText = `Anda adalah Fleet Intelligence AI & Chief Automotive Engineer terpercaya untuk platform manajemen kendaraan VMS di Indonesia. 
Berikan penjelasan yang komprehensif, terstruktur, berbasis data riil, dan sangat solutif. Format jawaban Anda dengan rapi: gunakan heading (### Judul Bagian), poin-poin terperinci (•), penjelasan teknis yang mendalam namun mudah dipahami, rekomendasi suku cadang & interval kilometer presisi, estimasi rupiah realistis, serta langkah pencegahan keausan.

PEDOMAN KHUSUS ANALISA FLEET & KONSUMSI BAHAN BAKAR:
1. Akses Seluruh Data Tersimpan: Anda dibekali data lengkap seluruh armada, riwayat pengisian BBM/charging, log suku cadang, riwayat servis, serta profil pengemudi & SIM pada konteks sistem di bawah.
2. Analisa Konsumsi Bahan Bakar / Listrik (Irit vs Boros):
   - Jika pengguna menanyakan seberapa irit pemakaian kendaraan tertentu atau efisiensi armada, hitung berdasarkan riwayat pengisian BBM (Fuel Logs) tersimpan (rumus: selisih KM dibagi Liter atau kWh).
   - Biaya per KM: total rupiah dibagi total KM perjalanan.
   - JIKA DATA BELUM LENGKAP atau belum ada selisih 2 kali pencatatan odometer pengisian penuh:
     MEMBERANIKAN DIRI MEMINTA DATA TERTENTU SECARA SPESIFIK DAN POLITE kepada pengguna:
     Minta angka odometer saat isi terakhir, jumlah liter/daya atau nominal rupiah yang diisi, dan konfirmasi apakah pengisian full-tank/100% SOC.
3. Deteksi Anomali:
   - Sampaikan peringatan jika ada penurunan efisiensi bensin/daya yang drastis, suku cadang dengan tingkat keausan tinggi (>=80%), atau STNK / SIM yang masa berlakunya kurang dari 30 hari atau telah lewat.
4. Pertanyaan Umum Tetap Terlayani:
   - Anda tetap siap dan mampu menjawab semua pertanyaan umum di luar data garasi (misal: penyebab motor brebet/gredek, perbandingan viskositas oli SAE 10W-30 vs 10W-40, tips merawat mobil bekas, tips berkendara hemat BBM, maupun sapaan kasual).

${fleetSnapshot}`;

  if (settings.systemPromptPreset === 'financial-mechanic') {
    systemInstructionText += '\n[FOKUS TAMBAHAN]: Berikan penekanan ekstra pada analisa efisiensi pengeluaran rupiah BBM, rasio KM/Liter, perbandingan oli murah vs awet, serta cara menekan biaya servis tak terduga.';
  } else if (settings.systemPromptPreset === 'casual-assistant') {
    systemInstructionText += '\n[FOKUS TAMBAHAN]: Berikan penjelasan yang ramah, analogi sederhana untuk pengguna awam, langkah demi langkah, dan tetap lengkap.';
  } else {
    systemInstructionText += '\n[FOKUS TAMBAHAN]: Utamakan akurasi toleransi mekanik, kode part, spesifikasi viskositas oli (SAE & API/JASO), torsi, dan interval servis berkala resmi pabrikan.';
  }

  // Construct multi-turn contents with rolling summary
  const contents = buildConversationTurns(
    options?.history || [],
    prompt,
    options?.imagePayload
  );

  let lastError: Error | null = null;

  for (let i = 0; i < slots.length; i++) {
    const model = slots[i];
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${cleanKey}`;
      
      const body = {
        contents,
        systemInstruction: {
          parts: [{ text: systemInstructionText }],
        },
        generationConfig: {
          temperature: 0.35,
          maxOutputTokens: 8192,
        },
      };

      // 12-second timeout per slot to prevent app hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        throw new Error(`Model ${model} gagal (HTTP ${res.status}): ${errText}`);
      }

      const resData = await res.json();
      const partsArray = resData.candidates?.[0]?.content?.parts || [];
      const generatedText = partsArray
        .map((p: any) => p.text || '')
        .join('')
        .trim();

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
      // Cascade to next slot in array
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
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${cleanKey}`;
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 8192,
          responseMimeType: 'application/json',
        },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`AI Spec fetch failed with HTTP ${res.status}`);
    }

    const data = await res.json();
    const partsArray = data.candidates?.[0]?.content?.parts || [];
    let rawText = partsArray.map((p: any) => p.text || '').join('').trim();
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
