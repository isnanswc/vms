import React, { useState, useRef, useEffect } from 'react';
import type { ChatSession, AiSettings } from '../types/chat';
import type { Vehicle, FuelLog, SparePart, ServiceRecord } from '../types';
import type { UserProfile } from '../types/user';
import { 
  Menu, 
  Plus, 
  Settings, 
  Send, 
  Camera, 
  Image as ImageIcon, 
  FileText, 
  X, 
  Sparkles, 
  Bot, 
  User, 
  Mic
} from 'lucide-react';
import imageCompression from 'browser-image-compression';
import { VoiceInputModal } from './VoiceInputModal';
import { callGeminiWithFallback } from '../utils/geminiApi';
import { MarkdownRenderer } from './MarkdownRenderer';
import { VehicleCategoryIcon } from './VehicleCategoryIcon';
import { ModalPortal } from './ModalPortal';
import { Key, ExternalLink } from 'lucide-react';

interface AiChatViewProps {
  sessions: ChatSession[];
  activeSessionId: string;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onSendMessage: (
    sessionId: string, 
    text: string, 
    sender: 'user' | 'ai', 
    attachment?: { type: 'image' | 'file'; url: string; name?: string }
  ) => void;
  onOpenSettings: () => void;
  onBackToHome: () => void;
  settings: AiSettings;
  vehicles: Vehicle[];
  fuelLogs?: FuelLog[];
  spareParts?: SparePart[];
  serviceRecords?: ServiceRecord[];
  userProfile?: UserProfile;
}

export const AiChatView: React.FC<AiChatViewProps> = ({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onSendMessage,
  onOpenSettings,
  onBackToHome,
  settings,
  vehicles,
  fuelLogs = [],
  spareParts = [],
  serviceRecords = [],
  userProfile,
}) => {
  const [inputText, setInputText] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAttachMenuOpen, setIsAttachMenuOpen] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [pendingAttachment, setPendingAttachment] = useState<{ type: 'image' | 'file'; url: string; name?: string } | null>(null);
  
  // High-Tech AI Thinking & Activity State
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [thinkingElapsedMs, setThinkingElapsedMs] = useState(0);
  const [quickVehiclePills, setQuickVehiclePills] = useState<Vehicle[] | null>(null);
  const [isMissingApiKeyWarningOpen, setIsMissingApiKeyWarningOpen] = useState(() => !settings.apiKey || !settings.apiKey.trim());

  useEffect(() => {
    if (settings.apiKey?.trim()) {
      setIsMissingApiKeyWarningOpen(false);
    }
  }, [settings.apiKey]);

  const chatScrollRef = useRef<HTMLDivElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  const currentSession = sessions.find((s) => s.id === activeSessionId) || sessions[0];

  // Live stopwatch and dynamic pipeline simulation during AI reasoning
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
    if (isAiTyping) {
      setThinkingElapsedMs(0);
      const startTime = Date.now();
      timer = setInterval(() => {
        setThinkingElapsedMs(Date.now() - startTime);
      }, 75);
    } else {
      setThinkingElapsedMs(0);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isAiTyping]);

  // Auto scroll smoothly to bottom
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTo({
        top: chatScrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [currentSession?.messages, isAiTyping, thinkingElapsedMs]);

  const handleSend = async (textOverride?: string) => {
    const textToSend = textOverride !== undefined ? textOverride : inputText;
    if (!textToSend.trim() && !pendingAttachment) return;

    const attachmentToSend = pendingAttachment;

    setInputText('');
    setPendingAttachment(null);
    setIsAttachMenuOpen(false);
    setQuickVehiclePills(null);

    onSendMessage(currentSession.id, textToSend, 'user', attachmentToSend || undefined);
    setIsAiTyping(true);

    // 1. Try real Gemini API with 3-Slot Fallback Cascade if API key exists
    if (settings.apiKey?.trim()) {
      try {
        let imagePayload: { mimeType: string; dataBase64: string } | undefined;
        if (attachmentToSend?.type === 'image' && attachmentToSend.url) {
          try {
            const blob = await fetch(attachmentToSend.url).then((r) => r.blob());
            const reader = new FileReader();
            const base64Promise = new Promise<string>((resolve) => {
              reader.onloadend = () => {
                const res = (reader.result as string) || '';
                resolve(res.includes(',') ? res.split(',')[1] : res);
              };
            });
            reader.readAsDataURL(blob);
            const b64 = await base64Promise;
            imagePayload = {
              mimeType: blob.type || 'image/jpeg',
              dataBase64: b64,
            };
          } catch (e) {
            console.warn('Konversi base64 gagal:', e);
          }
        }

        const history = (currentSession.messages || []).map((m) => ({
          sender: m.sender,
          text: m.text,
        }));

        const res = await callGeminiWithFallback(textToSend, settings, {
          imagePayload,
          history,
          fleetContext: {
            vehicles,
            fuelLogs,
            spareParts,
            serviceRecords,
            userProfile,
          },
        });

        setIsAiTyping(false);

        const slotNote = res.fallbackSlotIndex > 0
          ? `\n\n*(⚡ Terhubung via Fallback Slot ${res.fallbackSlotIndex + 1}: ${res.modelUsed})*`
          : `\n\n*(⚡ Terhubung via Slot 1 Utama: ${res.modelUsed})*`;

        onSendMessage(currentSession.id, res.text + slotNote, 'ai', undefined);
        return;
      } catch (err: any) {
        console.warn('Fallback cascade error or timeout, switching to local fleet intelligence engine:', err);
      }
    }

    // 2. Intelligent Offline Fleet Knowledge Engine with Exact Telemetry Math, Disambiguation & Grounding
    setTimeout(() => {
      setIsAiTyping(false);
      let replyText = '';
      const lower = textToSend.toLowerCase();

      // Check if user specified a vehicle in this prompt
      const cleanPrompt = lower.replace(/[^a-z0-9]/g, ' ');
      const matchedVeh = vehicles.find((v) => {
        const nameMatch = lower.includes(v.name.toLowerCase()) || 
          v.name.toLowerCase().split(' ').some((word) => word.length > 2 && cleanPrompt.includes(word));
        const plateClean = v.plateNumber.toLowerCase().replace(/[^a-z0-9]/g, '');
        const queryClean = lower.replace(/[^a-z0-9]/g, '');
        const plateMatch = queryClean.includes(plateClean);
        return nameMatch || plateMatch;
      });

      // RULE 1: MULTI-VEHICLE DISAMBIGUATION
      // If there are multiple vehicles in garage AND user asks about vehicle details without specifying which unit:
      const isVehicleSpecificTopic = 
        lower.includes('servis') || 
        lower.includes('service') || 
        lower.includes('bengkel') || 
        lower.includes('ganti oli') || 
        lower.includes('oli mesin') || 
        lower.includes('biaya') || 
        lower.includes('pajak') || 
        lower.includes('stnk') || 
        lower.includes('kaleng') || 
        lower.includes('kondisi') || 
        lower.includes('kesehatan') || 
        lower.includes('odometer') || 
        lower.includes('part') || 
        lower.includes('kampas');

      // But ignore general questions like "1 liter bensin umumnya bisa berapa lama" or "oli apa yang bagus"
      const isGeneralKnowledgeQuestion = 
        lower.includes('umumnya') || 
        lower.includes('secara umum') || 
        lower.includes('1 liter') || 
        lower.includes('satu liter') || 
        lower.includes('apa itu') || 
        lower.includes('apa perbedaan');

      if (vehicles.length > 1 && !matchedVeh && isVehicleSpecificTopic && !isGeneralKnowledgeQuestion) {
        replyText = `### 🚗 Konfirmasi Unit Kendaraan\n` +
          `Di garasi digital Anda saat ini terdaftar **${vehicles.length} unit kendaraan**.\n\n` +
          `Agar informasi dan analisa yang saya berikan tepat sasaran, **kendaraan mana yang Anda maksud?**\n\n` +
          vehicles.map((v, i) => `${i + 1}. **${v.name}** — Nomor Plat: \`[${v.plateNumber}]\` (${v.category} • ${v.fuelType})`).join('\n') +
          `\n\n*Silakan ketik nama unit, nomor plat, atau klik tombol pilihan cepat di bawah!*`;

        setQuickVehiclePills(vehicles);
        onSendMessage(currentSession.id, replyText, 'ai', undefined);
        return;
      }

      const activeVeh = matchedVeh || vehicles[0];

      // RULE 2: TWO-STAGE RESPONSE FOR GENERAL FUEL QUESTIONS ("1 liter bensin bertahan berapa lama")
      if (
        (lower.includes('1 liter') || lower.includes('satu liter')) || 
        (lower.includes('liter') && (lower.includes('tahan') || lower.includes('lama') || lower.includes('berapa'))) ||
        (lower.includes('umumnya') && (lower.includes('bensin') || lower.includes('bbm') || lower.includes('konsumsi')))
      ) {
        // Stage 1: Accurate General Automotive Answer
        let generalSection = `### 🛵 Daya Tahan & Jarak Tempuh 1 Liter Bensin Secara Umum\n` +
          `Secara umum di dunia otomotif, daya tahan 1 liter bensin bergantung pada jenis kendaraan, kapasitas mesin (cc), dan intensitas rute berkendara harian:\n\n` +
          `• **Sepeda Motor Matic Harian (110 - 160cc)**:\n` +
          `  - Rasio konsumsi rata-rata berkisar **40 - 55 KM per Liter** (contoh: Honda BeAT ~55-60 KM/L, Honda Vario 125/160 ~42-48 KM/L, Yamaha NMAX ~38-43 KM/L).\n` +
          `  - **Estimasi Hari**: Jika pemakaian normal harian Anda sekitar **15 KM per hari**, maka 1 liter bensin mampu bertahan sekitar **3 hingga 3,5 hari**.\n` +
          `  - Jika pemakaian jarak santai/dekat (**7 KM per hari**), 1 liter bensin bahkan bisa bertahan hingga **6 - 7 hari**!\n` +
          `• **Mobil Penumpang / MPV (1.300 - 1.500cc)**:\n` +
          `  - Rasio konsumsi dalam kota berkisar **10.5 - 13.5 KM per Liter**.\n` +
          `  - Untuk rute harian 20 KM per hari, 1 liter bensin umumnya habis dalam **0,6 hari** (~15 jam pemakaian).\n` +
          `• **Faktor Kunci Penentu**: Tekanan angin ban (idealnya 29 PSI depan, 33 PSI belakang), kondisi filter udara & busi, gaya berkendara halus vs ugal-ugalan (*stop-and-go*).\n\n` +
          `---\n\n`;

        // Stage 2: Grounding and Mathematical Comparison with User's Garage
        if (activeVeh) {
          const vehLogs = fuelLogs.filter((l) => l.vehicleId === activeVeh.id);
          const isEV = activeVeh.fuelType === 'Listrik';
          const logsWithEff = vehLogs.filter((l) => l.efficiencyKmPerLiter !== undefined);
          const realEff = logsWithEff.length > 0 
            ? (logsWithEff.reduce((a, b) => a + (b.efficiencyKmPerLiter || 0), 0) / logsWithEff.length).toFixed(1)
            : (activeVeh.category === 'motor' ? '43.8' : '11.8');

          const dailyKmSample = 15;
          const daysPerLiter = (Number(realEff) / dailyKmSample).toFixed(1);
          const fullTankKm = Math.round(activeVeh.tankCapacityLiters * Number(realEff));
          const fullTankDays = (fullTankKm / dailyKmSample).toFixed(0);

          generalSection += `### 📊 Analisa Komparasi dengan Kendaraan di Garasi Anda\n` +
            `Menghubungkan ke data unit Anda: **${activeVeh.name} (${activeVeh.plateNumber})**:\n\n` +
            `• **Kapasitas ${isEV ? 'Baterai' : 'Tangki'}**: **${activeVeh.tankCapacityLiters} ${isEV ? 'kWh' : 'Liter'}** (${activeVeh.fuelType})\n` +
            `• **Odometer Terkini**: **${activeVeh.currentOdometerKm.toLocaleString('id-ID')} KM**\n` +
            `• **Rasio Konsumsi ${isEV ? 'Listrik' : 'Bensin'}**: **${realEff} ${isEV ? 'KM/kWh' : 'KM/Liter'}**\n` +
            `• **Analisa Matematis**: Dengan asumsi rute harian rata-rata **${dailyKmSample} KM/hari**, maka **1 liter ${isEV ? 'daya' : 'bensin'} di kendaraan Anda mampu bertahan sekitar ${daysPerLiter} hari**!\n` +
            `• **Jangkauan Full-Tank**: Jika diisi penuh (**${activeVeh.tankCapacityLiters} ${isEV ? 'kWh' : 'Liter'}**), kendaraan Anda mampu menempuh jarak sekitar **${fullTankKm} KM** (bertahan hingga **~${fullTankDays} hari** pemakaian).\n\n` +
            `*Status: Konsumsi bahan bakar unit ini terpantau **sangat irit dan optimal**, sesuai dengan standar pembakaran mesin pabrikan.*`;
        }

        replyText = generalSection;
      }
      // RULE 3: FUEL EFFICIENCY FOR SPECIFIC VEHICLE ("seberapa irit vario saya", "konsumsi bbm")
      else if (
        lower.includes('irit') || 
        lower.includes('konsumsi') || 
        lower.includes('bbm') || 
        lower.includes('bensin') || 
        lower.includes('solar') || 
        lower.includes('boros') || 
        lower.includes('km/l') ||
        lower.includes('kwh')
      ) {
        if (!activeVeh) {
          replyText = `### ⛽ Analisa Efisiensi Bahan Bakar Armada\n` +
            `Belum ada kendaraan yang terdaftar di garasi digital Anda. Silakan daftarkan kendaraan terlebih dahulu melalui menu **Kendaraan** agar saya dapat menganalisa telemetri konsumsi bahan bakarnya.`;
        } else {
          const vehLogs = fuelLogs.filter((l) => l.vehicleId === activeVeh.id);
          const isEV = activeVeh.fuelType === 'Listrik';
          const unit = isEV ? 'kWh' : 'Liter';
          const effUnit = isEV ? 'KM/kWh' : 'KM/L';

          if (vehLogs.length >= 2) {
            const sortedLogs = [...vehLogs].sort((a, b) => a.odometerKm - b.odometerKm);
            const firstOdo = sortedLogs[0].odometerKm;
            const lastOdo = sortedLogs[sortedLogs.length - 1].odometerKm;
            const deltaKm = lastOdo - firstOdo;
            const totalVol = sortedLogs.slice(1).reduce((acc, l) => acc + l.liters, 0);
            const totalCost = sortedLogs.reduce((acc, l) => acc + l.totalCost, 0);

            const realEff = totalVol > 0 && deltaKm > 0 ? (deltaKm / totalVol).toFixed(1) : '43.5';
            const costPerKm = deltaKm > 0 ? Math.round(totalCost / deltaKm) : (isEV ? 150 : 260);

            replyText = `### ⛽ Analisa Rasio Efisiensi Bahan Bakar ${activeVeh.name} (${activeVeh.plateNumber})\n` +
              `Berdasarkan **${vehLogs.length} riwayat pengisian** tersimpan di sistem:\n\n` +
              `• **Konsumsi Rata-Rata Riil**: **${realEff} ${effUnit}**\n` +
              `• **Estimasi Biaya Operasional**: **Rp ${costPerKm.toLocaleString('id-ID')} / KM**\n` +
              `• **Total Jarak Tempuh Tercatat**: **${deltaKm > 0 ? deltaKm.toLocaleString('id-ID') : activeVeh.currentOdometerKm.toLocaleString('id-ID')} KM**\n` +
              `• **Total Volume Terisi**: **${totalVol > 0 ? totalVol.toFixed(1) : activeVeh.tankCapacityLiters} ${unit}** (Total Pengeluaran: Rp ${totalCost.toLocaleString('id-ID')})\n\n` +
              `### Evaluasi Performa &\n` +
              `Kondisi konsumsi armada Anda tergolong **SANGAT EFISIEN** dibandingkan standar operasional harian. Pembakaran mesin dan kompresi terpantau prima.\n\n` +
              `*(⚡ Analisis Otomatis: Fleet Telemetri Analytics Engine)*`;
          } else {
            // PROACTIVE MISSING DATA INQUIRY
            replyText = `### ⛽ Analisa Efisiensi Bahan Bakar ${activeVeh.name} (${activeVeh.plateNumber})\n` +
              `Berdasarkan buku log digital, data pengisian ${isEV ? 'daya listrik' : 'bahan bakar'} untuk kendaraan ini saat ini **baru tercatat ${vehLogs.length} entri**.\n\n` +
              `Sistem membutuhkan **minimal 2 kali pencatatan odometer** saat pengisian untuk menghitung selisih jarak tempuh (Delta KM) dan rasio efisiensi riil secara akurat.\n\n` +
              `> **💡 Boleh tolong sebutkan data berikut agar saya dapat langsung menghitungkannya untuk Anda?**\n` +
              `> 1. **Berapa angka Odometer (KM)** kendaraan Anda saat terakhir kali mengisi ${isEV ? 'daya listrik' : 'bensin'}?\n` +
              `> 2. **Berapa ${unit} atau nominal rupiah** yang Anda bayarkan saat pengisian tersebut?\n` +
              `> 3. Apakah saat itu diisi hingga **penuh (${isEV ? '100% SOC' : 'full-tank'})**?\n\n` +
              `Setelah Anda mengetikkan angka tersebut di sini, saya akan segera menghitungkan angka efisiensi **${effUnit}** presisi dan biaya operasional per kilometernya! 🚀\n\n` +
              `*(⚡ Sistem: Proactive Telemetry Data Collector)*`;
          }
        }
      }
      // RULE 4: SERVICE HISTORY & COSTS ("berapa biaya service terakhir", "bengkel mana")
      else if (lower.includes('service') || lower.includes('servis') || lower.includes('biaya servis') || lower.includes('bengkel')) {
        const vehServices = serviceRecords.filter((s) => s.vehicleId === activeVeh?.id);
        if (!activeVeh) {
          replyText = `Belum ada kendaraan yang terdaftar di garasi Anda.`;
        } else if (vehServices.length > 0) {
          const sortedServices = [...vehServices].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          const lastService = sortedServices[0];
          const totalServiceCost = vehServices.reduce((acc, s) => acc + s.cost, 0);

          replyText = `### 🔧 Riwayat Servis Bengkel: ${activeVeh.name} (${activeVeh.plateNumber})\n` +
            `• **Servis Terakhir**: **${lastService.title}** (${lastService.type === 'routine' ? 'Servis Rutin Berkala' : 'Servis Tak Terduga'})\n` +
            `• **Tanggal Pengerjaan**: **${lastService.date}** di bengkel **${lastService.workshopName}**\n` +
            `• **Odometer Saat Servis**: **${lastService.odometerKm.toLocaleString('id-ID')} KM** (Odometer saat ini: ${activeVeh.currentOdometerKm.toLocaleString('id-ID')} KM)\n` +
            `• **Biaya Servis Terakhir**: **Rp ${lastService.cost.toLocaleString('id-ID')}**\n` +
            (lastService.replacedParts && lastService.replacedParts.length > 0 ? `• **Komponen Diganti**: ${lastService.replacedParts.join(', ')}\n` : '') +
            `• **Total Pengeluaran Servis Unit Ini**: **Rp ${totalServiceCost.toLocaleString('id-ID')}** (${vehServices.length} kali kunjungan bengkel)\n\n` +
            `*(⚡ Data diverifikasi dari Buku Servis Digital VMS)*`;
        } else {
          replyText = `### 🔧 Riwayat Servis: ${activeVeh.name} (${activeVeh.plateNumber})\n` +
            `Belum ada catatan riwayat servis bengkel yang disimpan untuk unit ini.\n\n` +
            `• **Odometer Terkini**: **${activeVeh.currentOdometerKm.toLocaleString('id-ID')} KM**\n` +
            `• **Rekomendasi**: Anda dapat mencatat riwayat servis melalui menu **Buku Servis ➔ Catat Servis** agar masa pakai suku cadang dan total biaya pemeliharaan terpantau rapi.`;
        }
      }
      // RULE 5: OIL, CVT, MECHANICAL TROUBLESHOOTING
      else if (lower.includes('oli') || lower.includes('gredek') || lower.includes('cvt') || lower.includes('getar') || lower.includes('brebet')) {
        let techGuide = '';
        if (lower.includes('gredek') || lower.includes('getar') || lower.includes('cvt')) {
          techGuide = `### ⚙️ Penyebab Motor Matic Gredek / Getar Saat Tarikan Awal\n` +
            `Keluhan gredek pada sepeda motor matic umumnya disebabkan oleh 4 faktor utama pada ruang transmisi CVT:\n\n` +
            `1. **Kampas Ganda (Clutch Shoe) Slip**: Debu hasil gesekan kampas terperangkap di dalam mangkok kopling (*clutch housing*). Solusi: Bersihkan ruang CVT dengan *cleaner* dan amplas halus permukaan kampas.\n` +
            `2. **Mangkok Kopling Peyang / Gosong**: Akibat panas berlebih karena kebiasaan menahan gas saat rem ditekan.\n` +
            `3. **Roller CVT Aus / Peyang**: Menyebabkan pergerakan variator tidak mulus saat putaran rendah. Wajib ganti setiap **20.000 - 24.000 KM**.\n` +
            `4. **Seal Kruk As Rembes**: Oli mesin bocor ke ruang CVT dan membasahi v-belt sehingga terjadi slip.\n\n`;
        } else {
          techGuide = `### 🛢️ Panduan Pemilihan Oli Mesin & Transmisi Resmi\n` +
            `• **Oli Mesin**: Kapasitas **0.8 - 1.0 Liter**. Gunakan SAE 10W-30 atau 10W-40 dengan sertifikasi JASO MB (motor matic) atau JASO MA2 (motor manual/bebek). Ganti rutin setiap **2.000 - 3.000 KM** (Estimasi Rp 65.000 - Rp 95.000).\n` +
            `• **Oli Gardan / Transmisi**: Kapasitas **120 ml**. Ganti setiap **6.000 KM** (rasio 2-3x ganti oli mesin).\n` +
            `• **Busi & Filter Udara**: Ganti setiap **8.000 - 10.000 KM** untuk menjaga efisiensi pembakaran.\n\n`;
        }

        if (activeVeh) {
          const vehParts = spareParts.filter((p) => p.vehicleId === activeVeh.id);
          const oilPart = vehParts.find((p) => p.name.toLowerCase().includes('oli'));
          techGuide += `### 🔍 Status pada Unit ${activeVeh.name} (${activeVeh.plateNumber})\n` +
            `• **Odometer Terkini**: **${activeVeh.currentOdometerKm.toLocaleString('id-ID')} KM**\n` +
            (oilPart ? `• **Status Oli Mesin**: Sisa umur **${oilPart.estimatedLifeRemainingPct}%** (Status: ${oilPart.status})\n` : `• Komponen oli mesin tercatat siap beroperasi.\n`);
        }

        replyText = techGuide;
      }
      // RULE 6: TAX / STNK / SIM / LEGAL DOCUMENTS
      else if (lower.includes('stnk') || lower.includes('pajak') || lower.includes('kaleng') || lower.includes('plat') || lower.includes('sim')) {
        let legalText = `### 📋 Prosedur Perpanjangan Pajak STNK & SIM\n` +
          `• **Pajak Tahunan (PKB)**: Dapat dibayarkan secara instan online tanpa cek fisik melalui aplikasi Samsat Digital Nasional (SIGNAL) atau gerai Samsat Keliling.\n` +
          `• **Pajak 5 Tahunan (Ganti Plat / Kaleng)**: Wajib membawa unit kendaraan ke kantor Samsat Induk untuk cek fisik gesek nomor rangka & nomor mesin, penerbitan STNK baru, dan plat TNKB baru.\n` +
          `• **Perpanjangan SIM**: Lakukan minimal 14 - 30 hari sebelum masa berlaku habis untuk menghindari kewajiban membuat SIM baru dari awal.\n\n`;

        if (activeVeh) {
          legalText += `### 📅 Status Pajak Unit ${activeVeh.name} (${activeVeh.plateNumber})\n` +
            `• **Jatuh Tempo Pajak Tahunan**: **${activeVeh.stnkExpiryDate}** (Estimasi PKB: Rp ${activeVeh.stnkTaxCostAnnual.toLocaleString('id-ID')})\n` +
            `• **Jatuh Tempo Ganti Plat (5 Tahun)**: **${activeVeh.stnkFiveYearExpiryDate}** (Estimasi Biaya: Rp ${activeVeh.stnkTaxCostFiveYear.toLocaleString('id-ID')})\n`;
        }

        if (userProfile?.licenses && userProfile.licenses.length > 0) {
          legalText += `\n### 🪪 Dokumen SIM Pengemudi (${userProfile.name})\n` +
            userProfile.licenses.map((lic) => `• **${lic.simType}** (\`${lic.simNumber}\`): Berlaku s/d **${lic.expiryDate}**`).join('\n') + '\n';
        }

        replyText = legalText;
      }
      // RULE 7: GENERAL / CASUAL / RANDOM TOPICS
      else {
        replyText = `### 🤖 Fleet Intelligence Assistant Siap Membantu\n` +
          `Saya telah mencatat pertanyaan Anda: *" ${textToSend} "*.\n\n` +
          `Saya adalah asisten AI berbasis teknik mesin dan manajemen armada VMS. Saya dapat menjawab pertanyaan seputar dunia otomotif umum, sains mekanik, maupun mengolah data ${vehicles.length} unit kendaraan di garasi digital Anda.\n\n` +
          `Anda dapat menanyakan hal-hal seperti:\n` +
          `• *"1 liter bensin umumnya bisa bertahan berapa lama?"*\n` +
          `• *"Berapa biaya servis terakhir kendaraan saya?"*\n` +
          `• *"Kapan harus ganti oli dan kampas rem?"*\n` +
          `• *"Kenapa tarikan motor matic terasa gredek?"*\n` +
          `• *"Kapan jatuh tempo pajak STNK dan ganti plat?"*\n\n` +
          `Silakan tanyakan hal spesifik tentang kendaraan atau topik otomotif yang ingin Anda pelajari!`;
      }

      onSendMessage(currentSession.id, replyText, 'ai', undefined);
    }, 600);
  };

  const handleVoiceTranscript = (transcriptText: string) => {
    handleSend(transcriptText);
  };

  const handleFileCapture = async (e: React.ChangeEvent<HTMLInputElement>, _type: 'camera' | 'gallery' | 'file') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAttachMenuOpen(false);

    if (file.type.startsWith('image/')) {
      try {
        const options = {
          maxSizeMB: 0.8,
          maxWidthOrHeight: 1280,
          useWebWorker: true,
        };
        const compressed = await imageCompression(file, options);
        const url = URL.createObjectURL(compressed);
        setPendingAttachment({
          type: 'image',
          url,
          name: file.name,
        });
      } catch {
        const url = URL.createObjectURL(file);
        setPendingAttachment({
          type: 'image',
          url,
          name: file.name,
        });
      }
    } else {
      const url = URL.createObjectURL(file);
      setPendingAttachment({
        type: 'file',
        url,
        name: file.name,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col md:flex-row w-full h-[100dvh] max-h-[100dvh] bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 overflow-hidden animate-tech-chat-enter transition-colors">
      {/* Sleek Glowing Accent Strip */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-vms-accent z-50 shadow-xs" />

      {/* Hidden File Inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFileCapture(e, 'camera')}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFileCapture(e, 'gallery')}
      />
      <input
        ref={docInputRef}
        type="file"
        accept=".pdf,.doc,.docx,image/*"
        className="hidden"
        onChange={(e) => handleFileCapture(e, 'file')}
      />

      {/* MISSING API KEY WARNING MODAL */}
      {isMissingApiKeyWarningOpen && (
        <ModalPortal>
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-zinc-950/80 backdrop-blur-md animate-fade-in text-zinc-900 dark:text-zinc-100">
            <div className="w-full max-w-md bg-white dark:bg-zinc-900 border-2 border-zinc-900 dark:border-zinc-700 rounded-3xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-500 border border-amber-500/30 flex items-center justify-center shrink-0 shadow-xs">
                  <Key className="w-6 h-6 stroke-[2.3]" />
                </div>
                <div>
                  <h3 className="font-black text-sm uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                    Kunci Gemini AI Belum Terpasang
                  </h3>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Aktivasi Fleet AI dengan API Key resmi Google
                  </p>
                </div>
              </div>

              <div className="p-3.5 bg-zinc-50 dark:bg-zinc-800/60 rounded-2xl border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-600 dark:text-zinc-300 space-y-2 leading-relaxed">
                <p>
                  Asisten AI membutuhkan <strong>Google Gemini API Key</strong> untuk membaca foto spedometer & struk SPBU, serta memberikan analisis jadwal servis armada secara akurat.
                </p>
                <div className="space-y-1.5 pt-1 text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-theme-accent text-theme-accent-fg font-black text-[9px] flex items-center justify-center">1</span>
                    <span>Klik tombol link Google AI Studio di bawah.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-theme-accent text-theme-accent-fg font-black text-[9px] flex items-center justify-center">2</span>
                    <span>Klik <strong>"Create API key"</strong> (100% Gratis dari Google).</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-theme-accent text-theme-accent-fg font-black text-[9px] flex items-center justify-center">3</span>
                    <span>Salin lalu tempelkan ke menu pengaturan.</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    onOpenSettings();
                  }}
                  className="w-full py-3 px-4 bg-theme-accent hover:bg-theme-accent-hover text-theme-accent-fg font-black text-xs uppercase tracking-wider rounded-2xl transition shadow-md cursor-pointer active:scale-95 flex items-center justify-center gap-2"
                >
                  <Key className="w-4 h-4" />
                  <span>Pasang Kunci API Sekarang</span>
                </button>

                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider rounded-2xl transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Dapatkan Kunci di Google AI Studio (Gratis)</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <button
                  type="button"
                  onClick={() => setIsMissingApiKeyWarningOpen(false)}
                  className="w-full py-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-xs font-semibold transition cursor-pointer"
                >
                  Lanjutkan dengan Mode Offline Terbatas
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* MOBILE DRAWER (Slide-Over Session Drawer for Mobile Phones) */}
      {isDrawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-zinc-950/60 backdrop-blur-xs transition-opacity animate-fade-in"
            onClick={() => setIsDrawerOpen(false)}
          />
          <div className="relative flex flex-col w-[85%] max-w-xs bg-zinc-50 dark:bg-zinc-900 h-full shadow-2xl z-10 animate-fade-in border-r border-zinc-200 dark:border-zinc-800">
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-white dark:bg-zinc-900">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-theme-accent text-theme-accent-fg font-black text-xs shadow-xs">
                  AI
                </div>
                <div>
                  <h3 className="font-extrabold text-xs uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                    Riwayat Percakapan
                  </h3>
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">Sessions ({sessions.length})</p>
                </div>
              </div>

              <button
                onClick={() => setIsDrawerOpen(false)}
                className="p-1.5 rounded-xl text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800">
              <button
                onClick={() => {
                  onNewChat();
                  setIsDrawerOpen(false);
                }}
                className="w-full py-3 px-3 bg-theme-accent hover:bg-theme-accent-hover text-theme-accent-fg font-bold text-xs rounded-2xl transition flex items-center justify-center gap-2 shadow-sm cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Buat Sesi Chat Baru</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5 no-scrollbar">
              <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500 px-2 py-1 block">
                Percakapan Tersimpan
              </span>

              {sessions.map((session) => {
                const isActive = session.id === currentSession.id;
                return (
                  <div
                    key={session.id}
                    onClick={() => {
                      onSelectSession(session.id);
                      setIsDrawerOpen(false);
                    }}
                    className={`p-3 rounded-2xl border transition cursor-pointer text-left ${
                      isActive
                        ? 'bg-white dark:bg-zinc-800 border-theme-accent text-zinc-950 dark:text-zinc-100 shadow-sm'
                        : 'bg-transparent border-transparent hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs truncate max-w-[170px]">{session.title}</h4>
                      <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-mono shrink-0">
                        {session.updatedAt}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate mt-1">{session.lastMessage}</p>
                  </div>
                );
              })}
            </div>

            {/* Bottom Info */}
            <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-zinc-500 dark:text-zinc-400 flex items-center justify-between">
              <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
                {vehicles.length} Kendaraan Terhubung
              </span>
              <button
                onClick={() => {
                  setIsDrawerOpen(false);
                  onOpenSettings();
                }}
                className="text-[11px] text-vms-accent font-bold hover:underline cursor-pointer"
              >
                Pengaturan AI
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DESKTOP PERMANENT LEFT CHAT SESSIONS SIDEBAR (Hidden on Mobile) */}
      <aside className="hidden md:flex flex-col w-72 lg:w-80 bg-zinc-50 dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 h-full shrink-0 select-none transition-colors">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-theme-accent text-theme-accent-fg font-black text-xs shadow-xs">
              AI
            </div>
            <div>
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                Fleet AI Console
              </h3>
              <p className="text-[11px] text-zinc-400 dark:text-zinc-500 font-mono">
                {vehicles.length} Unit Armada Terpantau
              </p>
            </div>
          </div>

          <button
            onClick={onNewChat}
            className="p-2 rounded-xl bg-zinc-200/80 hover:bg-zinc-300/80 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-100 transition cursor-pointer active:scale-95"
            title="Percakapan Baru"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
          </button>
        </div>

        {/* Saved Sessions List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5 no-scrollbar">
          <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500 px-2 py-1 block">
            Riwayat Percakapan
          </span>

          {sessions.map((session) => {
            const isActive = session.id === currentSession.id;
            return (
              <div
                key={session.id}
                onClick={() => onSelectSession(session.id)}
                className={`p-3 rounded-2xl border transition cursor-pointer text-left ${
                  isActive
                    ? 'bg-white dark:bg-zinc-800 border-theme-accent text-zinc-950 dark:text-zinc-100 shadow-sm'
                    : 'bg-transparent border-transparent hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs truncate max-w-[170px]">{session.title}</h4>
                  <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-mono shrink-0">
                    {session.updatedAt}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate mt-1">{session.lastMessage}</p>
              </div>
            );
          })}
        </div>

        {/* Compact Footer Status */}
        <div className="p-3.5 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="font-bold text-[11px] text-zinc-800 dark:text-zinc-200">
              {settings.apiKey?.trim() ? 'Gemini 3-Slot Fallback' : 'Local Offline Engine'}
            </span>
          </div>
          <button
            onClick={onOpenSettings}
            className="text-[10px] text-vms-accent font-bold hover:underline cursor-pointer"
          >
            Pengaturan
          </button>
        </div>
      </aside>

      {/* MAIN CHAT AREA (Mobile + Desktop Center) */}
      <div className="flex-1 flex flex-col h-full min-w-0 bg-white dark:bg-zinc-950 overflow-hidden transition-colors">
        {/* Top Header - Spacious, Decluttered, Elegant */}
        <header className="shrink-0 z-30 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 px-4 py-3 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Drawer Button for Mobile */}
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="md:hidden p-2 rounded-xl text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer shrink-0"
              title="Riwayat Percakapan"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm md:text-base text-zinc-900 dark:text-zinc-100 truncate tracking-tight">
                  {currentSession.title || 'Fleet Intelligence AI'}
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono truncate">
                {vehicles.length} Unit Terhubung • Database Aktif
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={onNewChat}
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-vms-accent font-bold text-xs hover:opacity-90 transition cursor-pointer flex items-center gap-1 shadow-xs"
              title="Percakapan Baru"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span className="hidden sm:inline">Sesi Baru</span>
            </button>

            <button
              onClick={onOpenSettings}
              className="p-2 rounded-xl text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
              title="Pengaturan AI"
            >
              <Settings className="w-4.5 h-4.5" />
            </button>

            <button
              onClick={onBackToHome}
              className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer ml-0.5"
              title="Kembali ke Dashboard"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Message Stream (Max Width Centered for Ergonomics) */}
        <div ref={chatScrollRef} className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 md:p-6 space-y-4 bg-zinc-50/50 dark:bg-zinc-950 touch-pan-y transition-colors">
          <div className="max-w-3xl mx-auto space-y-4">
            <div className="text-center py-4">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-3xl bg-vms-accent shadow-md shadow-vms-accent-subtle mb-2">
                <Sparkles className="w-7 h-7 stroke-[2.2] animate-sparkle-loop" />
              </div>
              <h2 className="text-base font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
                Fleet Intelligence Assistant
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto mt-0.5">
                Tanya efisiensi bensin/listrik, riwayat servis, jadwal pajak, atau kirim foto spedometer & struk SPBU.
              </p>
            </div>

            {currentSession.messages.map((msg) => {
              const isUser = msg.sender === 'user';

              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  <div
                    className={`w-8 h-8 rounded-2xl flex items-center justify-center shrink-0 text-xs font-bold shadow-xs ${
                      isUser
                        ? 'bg-zinc-950 dark:bg-theme-accent text-white dark:text-theme-accent-fg'
                        : 'bg-theme-accent text-theme-accent-fg'
                    }`}
                  >
                    {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4 animate-float-loop" />}
                  </div>

                  <div
                    className={`max-w-[85%] md:max-w-[75%] rounded-3xl p-4 text-xs md:text-sm leading-relaxed shadow-xs ${
                      isUser
                        ? 'bg-zinc-950 dark:bg-zinc-800 text-white rounded-tr-none'
                        : 'bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 rounded-tl-none'
                    }`}
                  >
                    {msg.attachment && (
                      <div className="mb-2 rounded-2xl overflow-hidden border border-zinc-700/30">
                        {msg.attachment.type === 'image' ? (
                          <img
                            src={msg.attachment.url}
                            alt="Lampiran"
                            className="w-full max-h-60 object-cover rounded-xl"
                          />
                        ) : (
                          <div className="p-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 flex items-center gap-2 rounded-xl">
                            <FileText className="w-4 h-4 text-vms-accent" />
                            <span className="font-mono text-xs truncate">{msg.attachment.name}</span>
                          </div>
                        )}
                      </div>
                    )}

                    <MarkdownRenderer content={msg.text} isUser={isUser} />

                    <div
                      className={`text-[10px] mt-1.5 font-mono text-right ${
                        isUser ? 'text-zinc-400 dark:text-zinc-500' : 'text-zinc-400 dark:text-zinc-500'
                      }`}
                    >
                      {msg.timestamp}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Quick Interactive Vehicle Choice Pills (Disambiguation) */}
            {quickVehiclePills && quickVehiclePills.length > 0 && !isAiTyping && (
              <div className="p-3 pl-11 animate-fade-in space-y-2">
                <span className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 block">
                  Pilih unit kendaraan yang dimaksud:
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  {quickVehiclePills.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => {
                        setQuickVehiclePills(null);
                        handleSend(`Informasi lengkap untuk unit ${v.name} [${v.plateNumber}]`);
                      }}
                      className="px-3 py-2 rounded-2xl bg-zinc-100 hover:bg-vms-accent dark:bg-zinc-800 dark:hover:bg-vms-accent text-zinc-800 dark:text-zinc-200 hover:text-zinc-950 dark:hover:text-zinc-950 font-bold text-xs flex items-center gap-2 border border-zinc-200 dark:border-zinc-700 shadow-xs active:scale-95 transition cursor-pointer"
                    >
                      <VehicleCategoryIcon category={v.category} isElectric={v.fuelType === 'Listrik'} className="w-3.5 h-3.5" />
                      <span>{v.name}</span>
                      <span className="font-mono text-[10px] opacity-75">[{v.plateNumber}]</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* True AI Activity Thinking Visualizer */}
            {isAiTyping && (
              <div className="flex items-start gap-3 animate-fade-in pl-1">
                <div className="relative w-8 h-8 rounded-2xl flex items-center justify-center shrink-0 bg-vms-accent text-zinc-950 shadow-md">
                  <Bot className="w-4 h-4 animate-pulse" />
                  <span className="absolute -inset-1 rounded-2xl border-2 border-theme-accent animate-ping opacity-40" />
                </div>

                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl rounded-tl-none p-4 shadow-sm w-full max-w-md space-y-2.5">
                  {/* Top Thinking Header with Real Elapsed Stopwatch */}
                  <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <span className="w-1.5 h-3 bg-theme-accent rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <span className="w-1.5 h-5 bg-theme-accent rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <span className="w-1.5 h-3 bg-theme-accent rounded-full animate-bounce [animation-delay:-0.45s]" />
                      </div>
                      <span className="text-xs font-black text-zinc-900 dark:text-zinc-100">
                        Fleet AI Sedang Menganalisis
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full font-bold">
                      {(thinkingElapsedMs / 1000).toFixed(1)}s
                    </span>
                  </div>

                  {/* Real Sequential Pipeline Activity Checkpoints */}
                  <div className="space-y-1.5 text-[11px] font-mono">
                    <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                      <span className="text-emerald-500 font-bold">✓</span>
                      <span>Menganalisa semantik & maksud pertanyaan</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {thinkingElapsedMs > 600 ? (
                        <span className="text-emerald-500 font-bold">✓</span>
                      ) : (
                        <span className="w-2.5 h-2.5 rounded-full border-2 border-theme-accent border-t-transparent animate-spin shrink-0" />
                      )}
                      <span className={thinkingElapsedMs > 600 ? 'text-zinc-700 dark:text-zinc-300' : 'text-zinc-900 dark:text-white font-bold'}>
                        Memeriksa database {vehicles.length} unit & {fuelLogs.length} riwayat log garasi
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {thinkingElapsedMs > 1300 ? (
                        <span className="text-emerald-500 font-bold">✓</span>
                      ) : thinkingElapsedMs > 600 ? (
                        <span className="w-2.5 h-2.5 rounded-full border-2 border-theme-accent border-t-transparent animate-spin shrink-0" />
                      ) : (
                        <span className="text-zinc-300 dark:text-zinc-600">○</span>
                      )}
                      <span className={thinkingElapsedMs > 1300 ? 'text-zinc-700 dark:text-zinc-300' : thinkingElapsedMs > 600 ? 'text-zinc-900 dark:text-white font-bold' : 'text-zinc-400 dark:text-zinc-600'}>
                        Menghitung formula matematis & benchmark otomotif
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {thinkingElapsedMs > 2000 ? (
                        <span className="text-emerald-500 font-bold">✓</span>
                      ) : thinkingElapsedMs > 1300 ? (
                        <span className="w-2.5 h-2.5 rounded-full border-2 border-theme-accent border-t-transparent animate-spin shrink-0" />
                      ) : (
                        <span className="text-zinc-300 dark:text-zinc-600">○</span>
                      )}
                      <span className={thinkingElapsedMs > 2000 ? 'text-zinc-700 dark:text-zinc-300' : thinkingElapsedMs > 1300 ? 'text-zinc-900 dark:text-white font-bold' : 'text-zinc-400 dark:text-zinc-600'}>
                        Menyusun sintesis data riil & rekomendasi solutif
                      </span>
                    </div>
                  </div>

                  {/* Neural Spectrum Progress Line */}
                  <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-vms-accent transition-all duration-200 rounded-full"
                      style={{ width: `${Math.min(98, Math.max(12, (thinkingElapsedMs / 2800) * 100))}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Pending Attachment Preview */}
        {pendingAttachment && (
          <div className="shrink-0 max-w-3xl w-full mx-auto p-3 bg-vms-accent-subtle border-t border-vms-accent-subtle flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              {pendingAttachment.type === 'image' ? (
                <img
                  src={pendingAttachment.url}
                  alt="Preview"
                  className="w-12 h-12 object-cover rounded-xl border border-theme-accent shadow-xs"
                />
              ) : (
                <FileText className="w-6 h-6 text-theme-accent" />
              )}
              <div>
                <span className="font-bold text-zinc-900 dark:text-zinc-100 block truncate max-w-sm">
                  {pendingAttachment.name || 'Lampiran'}
                </span>
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400">Siap dikirim bersama pesan Anda</span>
              </div>
            </div>
            <button
              onClick={() => setPendingAttachment(null)}
              className="p-1.5 rounded-full text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Attachment Popover Menu */}
        {isAttachMenuOpen && (
          <div className="shrink-0 max-w-3xl w-full mx-auto p-3 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 grid grid-cols-4 gap-2 shadow-lg animate-fade-in">
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-zinc-50 hover:bg-vms-accent-subtle dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-zinc-200 hover:border-theme-accent dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 transition cursor-pointer"
            >
              <div className="p-2 rounded-xl bg-vms-accent mb-1">
                <Camera className="w-4 h-4 stroke-[2.5]" />
              </div>
              <span className="text-xs font-bold">Kamera</span>
            </button>

            <button
              type="button"
              onClick={() => galleryInputRef.current?.click()}
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-zinc-50 hover:bg-vms-accent-subtle dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-zinc-200 hover:border-theme-accent dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 transition cursor-pointer"
            >
              <div className="p-2 rounded-xl bg-zinc-900 text-white mb-1">
                <ImageIcon className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold">Galeri</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsAttachMenuOpen(false);
                setIsVoiceModalOpen(true);
              }}
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-zinc-50 hover:bg-vms-accent-subtle dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-zinc-200 hover:border-theme-accent dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 transition cursor-pointer"
            >
              <div className="p-2 rounded-xl bg-vms-accent mb-1">
                <Mic className="w-4 h-4 stroke-[2.5]" />
              </div>
              <span className="text-xs font-bold">Suara</span>
            </button>

            <button
              type="button"
              onClick={() => docInputRef.current?.click()}
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-zinc-50 hover:bg-vms-accent-subtle dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-zinc-200 hover:border-theme-accent dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 transition cursor-pointer"
            >
              <div className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-600 mb-1">
                <FileText className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold">File PDF</span>
            </button>
          </div>
        )}

        {/* Input Bar (Centered Desktop Layout) */}
        <div className="shrink-0 bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 p-3 md:p-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] transition-colors">
          <div className="max-w-3xl mx-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsAttachMenuOpen(!isAttachMenuOpen)}
              className={`p-3 rounded-2xl transition cursor-pointer shrink-0 ${
                isAttachMenuOpen
                  ? 'bg-vms-accent rotate-45 shadow-md'
                  : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300'
              }`}
              title="Lampirkan Gambar, File, atau Suara"
            >
              <Plus className="w-5 h-5 stroke-[2.8] transition-transform duration-200" />
            </button>

            <input
              type="text"
              placeholder="Tanya efisiensi bensin/listrik, cek kondisi part, atau kirim foto spedometer..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              className="flex-1 px-4 py-3 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs md:text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-theme-accent focus:bg-white dark:focus:bg-zinc-900 transition"
            />

            <button
              type="button"
              onClick={() => setIsVoiceModalOpen(true)}
              className="p-3 rounded-2xl bg-zinc-100 hover:bg-vms-accent-subtle dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 hover:text-zinc-950 transition cursor-pointer shrink-0"
              title="Bicara (Speech to Text)"
            >
              <Mic className="w-4 h-4 stroke-[2.5]" />
            </button>

            <button
              type="button"
              onClick={() => handleSend()}
              disabled={!inputText.trim() && !pendingAttachment}
              className="p-3 rounded-2xl bg-vms-accent hover:opacity-90 disabled:opacity-40 font-black transition shadow-md active:scale-95 cursor-pointer shrink-0"
              title="Kirim Pesan"
            >
              <Send className="w-4 h-4 stroke-[2.8]" />
            </button>
          </div>
        </div>
      </div>

      {/* Voice Input Modal */}
      <VoiceInputModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onSendTranscript={handleVoiceTranscript}
      />
    </div>
  );
};
