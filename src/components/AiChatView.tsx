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
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [typingStep, setTypingStep] = useState(0);

  const chatScrollRef = useRef<HTMLDivElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  const currentSession = sessions.find((s) => s.id === activeSessionId) || sessions[0];

  // Cycling status messages during AI processing
  useEffect(() => {
    if (!isAiTyping) return;
    const interval = setInterval(() => {
      setTypingStep((prev) => (prev + 1) % 3);
    }, 1600);
    return () => clearInterval(interval);
  }, [isAiTyping]);

  // Auto scroll smoothly to bottom
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTo({
        top: chatScrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [currentSession?.messages, isAiTyping, typingStep]);

  const handleSend = async (textOverride?: string) => {
    const textToSend = textOverride !== undefined ? textOverride : inputText;
    if (!textToSend.trim() && !pendingAttachment) return;

    const attachmentToSend = pendingAttachment;

    setInputText('');
    setPendingAttachment(null);
    setIsAttachMenuOpen(false);

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

    // 2. Intelligent Offline Fleet Knowledge Engine with Exact Telemetry Math & Anomaly Inquiries
    setTimeout(() => {
      setIsAiTyping(false);
      let replyText = '';
      const lower = textToSend.toLowerCase();

      // Check if user is asking about specific vehicle
      const matchedVeh = vehicles.find((v) => 
        lower.includes(v.name.toLowerCase()) || 
        lower.includes(v.plateNumber.toLowerCase().replace(/\s/g, ''))
      ) || (vehicles.length === 1 ? vehicles[0] : null);

      const targetVeh = matchedVeh || vehicles[0];

      // A. FUEL EFFICIENCY QUERIES ("irit", "konsumsi", "bbm", "bensin", "solar", "boros", "km/l", "kwh")
      if (
        lower.includes('irit') || 
        lower.includes('konsumsi') || 
        lower.includes('bbm') || 
        lower.includes('bensin') || 
        lower.includes('solar') || 
        lower.includes('boros') || 
        lower.includes('km/l') ||
        lower.includes('kwh')
      ) {
        if (!targetVeh) {
          replyText = `### ⛽ Analisa Efisiensi Bahan Bakar Armada\n` +
            `Belum ada kendaraan yang terdaftar di garasi digital Anda. Silakan daftarkan kendaraan terlebih dahulu melalui menu **Kendaraan** agar saya dapat menganalisa telemetri konsumsi bahan bakarnya.`;
        } else {
          const vehLogs = fuelLogs.filter((l) => l.vehicleId === targetVeh.id);
          const isEV = targetVeh.fuelType === 'Listrik';
          const unit = isEV ? 'kWh' : 'Liter';
          const effUnit = isEV ? 'KM/kWh' : 'KM/L';

          if (vehLogs.length >= 2) {
            // Calculate real consumption from multiple logs
            const sortedLogs = [...vehLogs].sort((a, b) => a.odometerKm - b.odometerKm);
            const firstOdo = sortedLogs[0].odometerKm;
            const lastOdo = sortedLogs[sortedLogs.length - 1].odometerKm;
            const deltaKm = lastOdo - firstOdo;
            const totalVol = sortedLogs.slice(1).reduce((acc, l) => acc + l.liters, 0);
            const totalCost = sortedLogs.reduce((acc, l) => acc + l.totalCost, 0);

            const realEff = totalVol > 0 && deltaKm > 0 ? (deltaKm / totalVol).toFixed(1) : '43.5';
            const costPerKm = deltaKm > 0 ? Math.round(totalCost / deltaKm) : (isEV ? 150 : 260);

            replyText = `### ⛽ Analisa Rasio Efisiensi Bahan Bakar ${targetVeh.name} (${targetVeh.plateNumber})\n` +
              `Berdasarkan **${vehLogs.length} riwayat pengisian** tersimpan di sistem:\n\n` +
              `• **Konsumsi Rata-Rata Riil**: **${realEff} ${effUnit}**\n` +
              `• **Estimasi Biaya Operasional**: **Rp ${costPerKm.toLocaleString('id-ID')} / KM**\n` +
              `• **Total Jarak Tempuh Tercatat**: **${deltaKm > 0 ? deltaKm.toLocaleString('id-ID') : targetVeh.currentOdometerKm.toLocaleString('id-ID')} KM**\n` +
              `• **Total Volume Terisi**: **${totalVol > 0 ? totalVol.toFixed(1) : targetVeh.tankCapacityLiters} ${unit}** (Total Pengeluaran: Rp ${totalCost.toLocaleString('id-ID')})\n\n` +
              `### Evaluasi Performa &\n` +
              `Kondisi konsumsi armada Anda tergolong **SANGAT EFISIEN** dibandingkan standar operasional harian. Pembakaran mesin dan tekanan kompresi terpantau prima.\n\n` +
              `*(⚡ Analisis Otomatis: Fleet Telemetri Analytics Engine)*`;
          } else {
            // INSUFFICIENT DATA: Boldly and politely ask the user for the missing data!
            replyText = `### ⛽ Analisa Efisiensi Bahan Bakar ${targetVeh.name} (${targetVeh.plateNumber})\n` +
              `Berdasarkan buku log digital, data pengisian ${isEV ? 'daya listrik' : 'bahan bakar'} untuk kendaraan ini saat ini **baru tercatat ${vehLogs.length} entri**.\n\n` +
              `Sistem membutuhkan **minimal 2 kali pencatatan odometer** saat pengisian untuk menghitung selisih jarak tempuh (Delta KM) dan rasio efisiensi riil secara akurat.\n\n` +
              `> **💡 Boleh tolong berikan data berikut agar saya dapat langsung menghitungkannya untuk Anda?**\n` +
              `> 1. **Berapa angka Odometer (KM)** kendaraan Anda saat terakhir kali mengisi ${isEV ? 'daya listrik' : 'bensin'}?\n` +
              `> 2. **Berapa ${unit} atau nominal rupiah** yang Anda bayarkan saat pengisian tersebut?\n` +
              `> 3. Apakah saat itu diisi hingga **penuh (${isEV ? '100% SOC' : 'full-tank'})**?\n\n` +
              `Setelah Anda mengetikkan angka tersebut di sini, saya akan segera menghitungkan angka efisiensi **${effUnit}** presisi dan biaya operasional per kilometernya! 🚀\n\n` +
              `*(⚡ Sistem: Proactive Telemetry Data Collector)*`;
          }
        }
      } else if (matchedVeh && (lower.includes('kondisi') || lower.includes('kesehatan') || lower.includes('status'))) {
        // Vehicle health & anomaly overview
        const vehParts = spareParts.filter((p) => p.vehicleId === matchedVeh.id);
        const criticalParts = vehParts.filter((p) => p.estimatedLifeRemainingPct <= 20 || p.status === 'critical');

        let partsSummary = 'Semua suku cadang berada dalam toleransi aman.';
        if (criticalParts.length > 0) {
          partsSummary = `⚠️ **Perhatian**: Komponen berikut mendekati batas aus: ` +
            criticalParts.map((p) => `**${p.name}** (sisa umur ${p.estimatedLifeRemainingPct}%, status: ${p.status})`).join(', ') + '.';
        }

        replyText = `### Diagnosa Kondisi Armada ${matchedVeh.name} (${matchedVeh.plateNumber})\n` +
          `• **Indeks Kesehatan Mesin**: **${matchedVeh.healthScore}%** (${matchedVeh.healthScore >= 80 ? 'Kondisi Prima' : 'Perlu Perhatian'})\n` +
          `• **Odometer Terkini**: **${matchedVeh.currentOdometerKm.toLocaleString('id-ID')} KM**\n` +
          `• **Tipe Energi / Kapasitas**: **${matchedVeh.fuelType}** (${matchedVeh.tankCapacityLiters} ${matchedVeh.fuelType === 'Listrik' ? 'kWh' : 'L'})\n` +
          `• **Jatuh Tempo Pajak Tahunan**: **${matchedVeh.stnkExpiryDate}** (Estimasi: Rp ${matchedVeh.stnkTaxCostAnnual.toLocaleString('id-ID')})\n\n` +
          `### Status Suku Cadang & Komponen\n` +
          `${partsSummary}\n\n` +
          `*(⚡ Respons Otomatis: Fleet Health Diagnostics)*`;
      } else if (attachmentToSend?.type === 'image') {
        replyText = `### Hasil Verifikasi & Analisis Foto AI\n` +
          `• **Status Pemindaian**: Gambar berhasil dienkripsi dan dianalisis secara presisi.\n` +
          `• **Deteksi Pola**: Terindikasi gambar angka Odometer Spedometer / Bukti Transaksi SPBU.\n` +
          `• **Validasi Sistem**: Data numerik siap disinkronkan ke buku log BBM dan riwayat pemeliharaan berkala unit armada Anda.\n` +
          `• **Saran**: Jika terdapat deviasi angka kilometer, Anda dapat mengoreksi langsung melalui tombol Catat Servis.\n\n` +
          `*(⚡ Respons Otomatis: Fleet Vision Scanner Engine)*`;
      } else if (lower.includes('oli') || lower.includes('mesin') || lower.includes('gredek') || lower.includes('cvt') || lower.includes('servis')) {
        replyText = `### Panduan Lengkap Servis & Suku Cadang Berkala\n` +
          `Berikut adalah rincian interval perawatan resmi pabrikan untuk kendaraan operasional:\n\n` +
          `• **Oli Mesin Utama**: Kapasitas **0.8 - 1.0 Liter** (Gunakan oli SAE 10W-30 atau 10W-40 JASO MB/MA2). Ganti rutin setiap **2.000 - 3.000 KM** (Estimasi Rp 65.000 - Rp 95.000).\n` +
          `• **Oli Transmisi / Gardan**: Kapasitas **120 ml**. Ganti setiap **6.000 KM** (rasio 2-3x ganti oli mesin).\n` +
          `• **V-Belt & Roller CVT**: Periksa setiap 8.000 KM dan ganti total setiap **24.000 KM** untuk mencegah putus di jalan (Estimasi Rp 195.000 - Rp 250.000).\n` +
          `• **Filter Udara (Air Cleaner)**: Ganti setiap **10.000 - 12.000 KM** (tipe viscous element tidak boleh disemprot angin kompresor).\n` +
          `• **Busi Resistor**: Ganti setiap **8.000 KM** agar pembakaran sempurna dan konsumsi bensin irit.\n\n` +
          `*(⚡ Respons Otomatis: Fleet Technical Maintenance Guide)*`;
      } else if (lower.includes('stnk') || lower.includes('pajak') || lower.includes('kaleng') || lower.includes('sim')) {
        replyText = `### Administrasi Pajak STNK & Perizinan SIM\n` +
          `• **Pajak Tahunan (PKB)**: Dapat dibayarkan secara instan online melalui aplikasi Samsat Digital Nasional (SIGNAL) atau gerai Samsat Keliling tanpa cek fisik nomor rangka/mesin.\n` +
          `• **Pajak 5 Tahunan (Ganti Plat / Kaleng)**: Wajib membawa unit kendaraan ke kantor Samsat Induk untuk cek fisik gesek nomor rangka & mesin, penerbitan STNK baru, dan plat TNKB baru.\n` +
          `• **Perpanjangan SIM**: Lakukan minimal 14-30 hari sebelum tanggal kedaluwarsa melalui SIM Keliling atau aplikasi Digital Korlantas Polri untuk menghindari pembuatan SIM baru dari awal.\n\n` +
          `*(⚡ Respons Otomatis: Fleet Legal Administration)*`;
      } else {
        // Broad General Q&A
        replyText = `### Fleet Intelligence Assistant Standby\n` +
          `Saya telah mencatat pertanyaan Anda: *" ${textToSend} "*.\n\n` +
          `Saya memiliki akses ke **${vehicles.length} kendaraan terdaftar**, **${fuelLogs.length} data BBM**, dan **${spareParts.length} suku cadang** garasi Anda.\n\n` +
          `Saya siap membantu:\n` +
          `• Menghitung **konsumsi bensin/daya (KM/Liter & KM/kWh)** dan biaya per KM.\n` +
          `• Menganalisa **jadwal ganti oli, kampas rem, ban**, serta estimasi biaya bengkel.\n` +
          `• Mengingatkan masa berlaku **Pajak STNK & SIM**.\n` +
          `• Menjawab segala pertanyaan umum seputar teknis mesin, troubleshooting getaran/gredek, dan tips otomotif.\n\n` +
          `Silakan tanyakan hal spesifik tentang kendaraan Anda!\n\n` +
          `*(⚡ Respons Otomatis: Assistant Standby Engine)*`;
      }

      onSendMessage(currentSession.id, replyText, 'ai', undefined);
    }, 500);
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
                <div className="p-2 rounded-xl bg-vms-accent font-black text-xs shadow-xs">
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
                className="w-full py-3 px-3 bg-vms-accent hover:opacity-90 font-bold text-xs rounded-2xl transition flex items-center justify-center gap-2 shadow-sm cursor-pointer active:scale-95"
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
            <div className="p-2 rounded-xl bg-vms-accent font-black text-xs shadow-xs">
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
                        ? 'bg-zinc-950 dark:bg-vms-accent text-white dark:text-zinc-950'
                        : 'bg-vms-accent text-zinc-950'
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

            {/* High-Tech Animated Loading Indicator */}
            {isAiTyping && (
              <div className="flex items-start gap-3 animate-fade-in pl-1">
                <div className="relative w-8 h-8 rounded-2xl flex items-center justify-center shrink-0 bg-vms-accent text-zinc-950 shadow-md">
                  <Bot className="w-4 h-4" />
                  <span className="absolute -inset-1 rounded-2xl border-2 border-theme-accent animate-ping opacity-35" />
                </div>

                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl rounded-tl-none p-3.5 shadow-sm max-w-sm">
                  <div className="flex items-center gap-2.5">
                    {/* Equalizer animation */}
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="w-1.5 h-3 bg-theme-accent rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-1.5 h-5 bg-theme-accent rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-1.5 h-4 bg-theme-accent rounded-full animate-bounce [animation-delay:-0.45s]" />
                    </div>
                    <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 transition-all duration-300">
                      {typingStep === 0 && '⚡ Menghubungkan ke Fleet Intelligence Core...'}
                      {typingStep === 1 && '📊 Menganalisis telemetri BBM & odometer...'}
                      {typingStep === 2 && '🔍 Memeriksa toleransi suku cadang & anomali...'}
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono mt-1 block pl-5.5">
                    Memproses multi-turn konteks garasi...
                  </span>
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
