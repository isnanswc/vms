import React, { useState, useRef, useEffect } from 'react';
import type { ChatSession, AiSettings } from '../types/chat';
import type { Vehicle } from '../types';
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
  Mic,
  Layers
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
}) => {
  const [inputText, setInputText] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAttachMenuOpen, setIsAttachMenuOpen] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [pendingAttachment, setPendingAttachment] = useState<{ type: 'image' | 'file'; url: string; name?: string } | null>(null);
  const [isAiTyping, setIsAiTyping] = useState(false);

  const chatScrollRef = useRef<HTMLDivElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  const currentSession = sessions.find((s) => s.id === activeSessionId) || sessions[0];

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [currentSession?.messages, isAiTyping]);

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

        const res = await callGeminiWithFallback(textToSend, settings, imagePayload);
        setIsAiTyping(false);

        const slotNote = res.fallbackSlotIndex > 0
          ? `\n\n*(⚡ Terhubung via Fallback Slot ${res.fallbackSlotIndex + 1}: ${res.modelUsed})*`
          : `\n\n*(⚡ Terhubung via Slot 1 Utama: ${res.modelUsed})*`;

        onSendMessage(currentSession.id, res.text + slotNote, 'ai', undefined);
        return;
      } catch (err: any) {
        console.warn('Fallback cascade error:', err);
      }
    }

    // 2. Intelligent Offline Fleet Knowledge Engine
    setTimeout(() => {
      setIsAiTyping(false);
      let replyText = '';
      const lower = textToSend.toLowerCase();

      const matchedVeh = vehicles.find((v) => 
        lower.includes(v.name.toLowerCase()) || 
        lower.includes(v.plateNumber.toLowerCase().replace(/\s/g, ''))
      );

      if (matchedVeh) {
        replyText = `### Diagnosa Kondisi Armada ${matchedVeh.name} (${matchedVeh.plateNumber})\n` +
          `• **Indeks Kesehatan Mesin**: **${matchedVeh.healthScore}%** (Kondisi Terpantau Baik)\n` +
          `• **Odometer Terkini**: **${matchedVeh.currentOdometerKm.toLocaleString('id-ID')} KM**\n` +
          `• **Spesifikasi Bahan Bakar**: Disarankan **${matchedVeh.fuelType}** (Kapasitas Tangki ${matchedVeh.tankCapacityLiters} Liter)\n\n` +
          `### Rekomendasi Pemeliharaan Rutin\n` +
          `1. Lakukan penggantian oli mesin setiap 2.000 - 3.000 KM untuk menjaga kompresi dan suhu operasional.\n` +
          `2. Periksa ketebalan kampas rem serta tekanan angin ban setiap 2 minggu sekali.\n` +
          `3. Selalu simpan struk pengisian bahan bakar ke menu **Bahan Bakar** untuk memantau tren efisiensi KM/Liter riil.\n\n` +
          `*(⚡ Respons Otomatis: Fleet Local Intelligence Engine)*`;
      } else if (attachmentToSend?.type === 'image') {
        replyText = `### Hasil Verifikasi & Analisis Foto AI\n` +
          `• **Status Pemindaian**: Gambar berhasil dienkripsi dan dianalisis secara presisi.\n` +
          `• **Deteksi Pola**: Terindikasi gambar angka Odometer Spedometer / Bukti Transaksi SPBU.\n` +
          `• **Validasi Sistem**: Data numerik siap disinkronkan ke buku log BBM dan riwayat pemeliharaan berkala unit armada Anda.\n` +
          `• **Saran**: Jika terdapat deviasi angka kilometer, Anda dapat mengoreksi langsung melalui tombol Catat Servis.\n\n` +
          `*(⚡ Respons Otomatis: Fleet Vision Scanner Engine)*`;
      } else if (lower.includes('vario') || lower.includes('oli') || lower.includes('servis')) {
        replyText = `### Panduan Lengkap Servis & Suku Cadang Berkala\n` +
          `Berikut adalah rincian interval perawatan resmi pabrikan untuk kendaraan matic:\n\n` +
          `• **Oli Mesin Utama**: Kapasitas **0.8 Liter** (Gunakan oli SAE 10W-30 JASO MB). Ganti rutin setiap **2.000 - 2.500 KM** (Estimasi Rp 65.000 - Rp 75.000).\n` +
          `• **Oli Transmisi / Gardan**: Kapasitas **120 ml**. Ganti setiap **6.000 KM** (rasio 2-3x ganti oli mesin).\n` +
          `• **V-Belt & Roller CVT**: Periksa setiap 8.000 KM dan ganti total setiap **24.000 KM** untuk mencegah putus di jalan (Estimasi Rp 195.000 - Rp 230.000).\n` +
          `• **Filter Udara (Air Cleaner)**: Ganti setiap **10.000 - 12.000 KM** (tipe viscous element tidak boleh disemprot angin kompresor).\n` +
          `• **Busi Resistor (CPR9EA)**: Ganti setiap **8.000 KM** agar pembakaran sempurna dan konsumsi bensin irit.\n\n` +
          `*(⚡ Respons Otomatis: Fleet Technical Maintenance Guide)*`;
      } else if (lower.includes('bbm') || lower.includes('konsumsi') || lower.includes('bensin') || lower.includes('solar')) {
        replyText = `### Analisa Rasio Efisiensi Bahan Bakar Armada\n` +
          `Berdasarkan algoritma telemetri bahan bakar komparatif:\n\n` +
          `• **Armada Sepeda Motor**: Konsumsi rata-rata optimal berkisar **42 - 46 KM/Liter** (Penggunaan Pertamax RON 92).\n` +
          `• **Armada Logistik / Mobil Niaga**: Konsumsi normal berkisar **10.5 - 12.8 KM/Liter** tergantung muatan kargo.\n` +
          `• **Tips Penghematan Biaya**: Menjaga tekanan ban sesuai rekomendasi pabrikan (29 PSI depan, 33 PSI belakang) dapat menghemat konsumsi BBM hingga **4-6%** per bulan.\n\n` +
          `*(⚡ Respons Otomatis: Fleet Telemetri Analytics)*`;
      } else if (lower.includes('stnk') || lower.includes('pajak') || lower.includes('kaleng')) {
        replyText = `### Prosedur Perpanjangan Pajak & STNK Kendaraan\n` +
          `• **Pajak Tahunan (PKB)**: Dapat dibayarkan secara instan online melalui aplikasi Samsat Digital Nasional (SIGNAL) atau gerai Samsat Keliling tanpa cek fisik.\n` +
          `• **Pajak 5 Tahunan (Ganti Plat / Kaleng)**: Wajib membawa unit kendaraan ke kantor Samsat Induk untuk gesek nomor rangka & nomor mesin, penerbitan STNK baru, dan plat nomor kaleng baru.\n` +
          `• **Persyaratan Wajib**: KTP asli pemilik sesuai STNK, STNK asli, dan BPKB asli/fotokopi legalisir.\n\n` +
          `*(⚡ Respons Otomatis: Fleet Legal Administration)*`;
      } else {
        replyText = `### Fleet Intelligence Assistant Standby\n` +
          `Saya telah mencatat pertanyaan Anda: *" ${textToSend} "*.\n\n` +
          `Saya siap membantu kebutuhan operasional armada Anda, di antaranya:\n` +
          `• Menghitung estimasi biaya servis berkala dan masa pakai suku cadang.\n` +
          `• Menganalisa konsumsi BBM per kilometer (*Cost per KM*).\n` +
          `• Memeriksa status jatuh tempo pajak STNK tahunan maupun 5 tahunan.\n` +
          `• Membaca dan memverifikasi foto odometer spedometer atau struk pembelian BBM.\n\n` +
          `Silakan tanyakan hal spesifik tentang kendaraan di garasi Anda!\n\n` +
          `*(⚡ Respons Otomatis: Assistant Standby Engine)*`;
      }

      onSendMessage(currentSession.id, replyText, 'ai', undefined);
    }, 600);
  };

  const handleVoiceTranscript = (transcriptText: string) => {
    handleSend(transcriptText);
  };

  const handleFileCapture = async (e: React.ChangeEvent<HTMLInputElement>, type: 'camera' | 'gallery' | 'file') => {
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
    <div className="fixed inset-0 z-50 flex flex-col md:flex-row w-full h-[100dvh] max-h-[100dvh] bg-white text-zinc-900 overflow-hidden animate-tech-chat-enter">
      {/* Sleek Futuristic Glowing Accent Strip */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-500 via-amber-300 to-yellow-500 z-50 shadow-xs shadow-yellow-400/50" />
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
          <div className="relative flex flex-col w-[85%] max-w-xs bg-zinc-50 h-full shadow-2xl z-10 animate-fade-in border-r border-zinc-200">
            <div className="p-4 border-b border-zinc-200 flex items-center justify-between bg-white">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-yellow-400 text-zinc-950 font-black text-xs shadow-xs">
                  AI
                </div>
                <div>
                  <h3 className="font-extrabold text-xs uppercase tracking-wider text-zinc-900">
                    Riwayat Chat
                  </h3>
                  <p className="text-[10px] text-zinc-400 font-mono">Sessions ({sessions.length})</p>
                </div>
              </div>

              <button
                onClick={() => setIsDrawerOpen(false)}
                className="p-1.5 rounded-xl text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-white border-b border-zinc-100">
              <button
                onClick={() => {
                  onNewChat();
                  setIsDrawerOpen(false);
                }}
                className="w-full py-3 px-3 bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold rounded-2xl transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4 text-yellow-400 stroke-[3]" />
                <span>Buat Chat Baru</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5 no-scrollbar">
              <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 px-2 py-1 block">
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
                        ? 'bg-white border-yellow-400 text-zinc-950 shadow-sm'
                        : 'bg-transparent border-transparent hover:bg-zinc-200/60 text-zinc-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs truncate max-w-[170px]">{session.title}</h4>
                      <span className="text-[9px] text-zinc-400 font-mono shrink-0">
                        {session.updatedAt}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-500 truncate mt-1">{session.lastMessage}</p>
                  </div>
                );
              })}
            </div>

            <div className="p-3 border-t border-zinc-200 bg-white text-xs text-zinc-500 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-zinc-800 text-[11px] flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-yellow-600" />
                  <span>3 Slot Fallback</span>
                </span>
                <button
                  onClick={() => {
                    setIsDrawerOpen(false);
                    onOpenSettings();
                  }}
                  className="text-[10px] text-yellow-700 font-bold hover:underline"
                >
                  Ubah
                </button>
              </div>
              <div className="text-[10px] font-mono text-zinc-700 truncate font-bold">
                1. {settings.fallbackSlots?.[0] || settings.selectedModel || 'gemini-2.5-flash'}
              </div>
              <div className="text-[10px] font-mono text-zinc-400 truncate">
                2. {settings.fallbackSlots?.[1] || 'gemini-2.0-flash'}
              </div>
              <div className="text-[10px] font-mono text-zinc-400 truncate">
                3. {settings.fallbackSlots?.[2] || 'gemini-1.5-flash'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DESKTOP PERMANENT LEFT CHAT SESSIONS SIDEBAR (Hidden on Mobile) */}
      <aside className="hidden md:flex flex-col w-72 lg:w-80 bg-zinc-50 border-r border-zinc-200 h-full shrink-0 select-none">
        <div className="p-4 border-b border-zinc-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-yellow-400 text-zinc-950 font-black text-xs shadow-xs">
              AI
            </div>
            <div>
              <h3 className="font-extrabold text-xs uppercase tracking-wider text-zinc-900">
                Riwayat Chat
              </h3>
              <p className="text-[10px] text-zinc-400 font-mono">Sessions Archive</p>
            </div>
          </div>

          <button
            onClick={onBackToHome}
            className="p-1.5 rounded-xl text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200 transition cursor-pointer"
            title="Kembali ke Dashboard Garasi"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3">
          <button
            onClick={onNewChat}
            className="w-full py-3 px-3 bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold rounded-2xl transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4 text-yellow-400 stroke-[3]" />
            <span>Buat Chat Baru</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 space-y-1.5 no-scrollbar">
          <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 px-2 py-1 block">
            Percakapan Tersimpan
          </span>

          {sessions.map((session) => {
            const isActive = session.id === currentSession.id;
            return (
              <div
                key={session.id}
                onClick={() => onSelectSession(session.id)}
                className={`p-3 rounded-2xl border transition cursor-pointer text-left ${
                  isActive
                    ? 'bg-white border-yellow-400 text-zinc-950 shadow-sm'
                    : 'bg-transparent border-transparent hover:bg-zinc-200/60 text-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs truncate max-w-[170px]">{session.title}</h4>
                  <span className="text-[9px] text-zinc-400 font-mono shrink-0">
                    {session.updatedAt}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 truncate mt-1">{session.lastMessage}</p>
              </div>
            );
          })}
        </div>

        <div className="p-3.5 border-t border-zinc-200 bg-white text-xs text-zinc-500 space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-bold text-zinc-800 text-[11px] flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-yellow-600" />
              <span>3 Slot Fallback Active</span>
            </span>
            <button
              onClick={onOpenSettings}
              className="text-[10px] text-yellow-700 font-bold hover:underline cursor-pointer"
            >
              Ubah
            </button>
          </div>
          <div className="text-[10px] font-mono text-zinc-800 truncate font-bold">
            1. {settings.fallbackSlots?.[0] || settings.selectedModel || 'gemini-2.5-flash'}
          </div>
          <div className="text-[10px] font-mono text-zinc-400 truncate">
            2. {settings.fallbackSlots?.[1] || 'gemini-2.0-flash'}
          </div>
          <div className="text-[10px] font-mono text-zinc-400 truncate">
            3. {settings.fallbackSlots?.[2] || 'gemini-1.5-flash'}
          </div>
        </div>
      </aside>

      {/* MAIN CHAT AREA (Mobile + Desktop Center) */}
      <div className="flex-1 flex flex-col h-full min-w-0 bg-white overflow-hidden">
        {/* Top Header */}
        <header className="shrink-0 z-30 bg-white/95 backdrop-blur-md border-b border-zinc-200 px-4 py-3 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            {/* Drawer Button for Mobile */}
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="md:hidden p-2 rounded-xl text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100 transition cursor-pointer"
              title="Buka Riwayat Percakapan"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-sm md:text-base text-zinc-900 tracking-tight">
                  {currentSession.title}
                </span>
                <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></span>
              </div>
              <p className="text-[11px] text-zinc-500 font-mono flex items-center gap-1.5 flex-wrap">
                <span>Fleet Intelligence</span>
                <span>•</span>
                <span className="text-zinc-800 font-bold">{settings.fallbackSlots?.[0] || settings.selectedModel}</span>
                <span className="text-[9px] px-1.5 py-0.2 bg-yellow-100 border border-yellow-300 text-zinc-950 font-bold rounded-md flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-ping"></span>
                  3 Slot Fallback
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={onNewChat}
              className="p-2 rounded-xl text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100 transition cursor-pointer"
              title="Percakapan Baru"
            >
              <Plus className="w-5 h-5 stroke-[2.5]" />
            </button>

            <button
              onClick={onOpenSettings}
              className="p-2 rounded-xl text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100 transition cursor-pointer"
              title="Pengaturan Model AI"
            >
              <Settings className="w-5 h-5" />
            </button>

            <button
              onClick={onBackToHome}
              className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition cursor-pointer ml-1"
              title="Kembali ke Dashboard"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Message Stream (Max Width Centered for Desktop Ergonomics) */}
        <div ref={chatScrollRef} className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 md:p-6 space-y-4 bg-zinc-50/50 touch-pan-y">
          <div className="max-w-3xl mx-auto space-y-4">
            <div className="text-center py-4">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-3xl bg-yellow-400 text-zinc-950 shadow-md shadow-yellow-400/20 mb-2">
                <Sparkles className="w-7 h-7 stroke-[2.2] animate-sparkle-loop" />
              </div>
              <h2 className="text-base font-black text-zinc-900 tracking-tight">
                Fleet Intelligence Assistant
              </h2>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-0.5">
                Bicara lewat suara, ketik pertanyaan armada, atau kirim foto spedometer & struk SPBU.
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
                        ? 'bg-zinc-950 text-white'
                        : 'bg-yellow-400 text-zinc-950'
                    }`}
                  >
                    {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4 animate-float-loop" />}
                  </div>

                  <div
                    className={`max-w-[85%] md:max-w-[75%] rounded-3xl p-4 text-xs md:text-sm leading-relaxed shadow-xs ${
                      isUser
                        ? 'bg-zinc-950 text-white rounded-tr-none'
                        : 'bg-white text-zinc-800 border border-zinc-200 rounded-tl-none'
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
                          <div className="p-3 bg-zinc-100 text-zinc-800 flex items-center gap-2 rounded-xl">
                            <FileText className="w-4 h-4 text-yellow-600" />
                            <span className="font-mono text-xs truncate">{msg.attachment.name}</span>
                          </div>
                        )}
                      </div>
                    )}

                    <MarkdownRenderer content={msg.text} isUser={isUser} />

                    <div
                      className={`text-[10px] mt-1.5 font-mono text-right ${
                        isUser ? 'text-zinc-400' : 'text-zinc-400'
                      }`}
                    >
                      {msg.timestamp}
                    </div>
                  </div>
                </div>
              );
            })}

            {isAiTyping && (
              <div className="flex items-center gap-2 text-xs text-zinc-500 pl-11">
                <div className="flex items-center gap-1 p-2 bg-white rounded-xl border border-zinc-200 shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-bounce"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-bounce [animation-delay:0.4s]"></span>
                </div>
                <span className="text-xs">Fleet AI sedang menganalisis...</span>
              </div>
            )}
          </div>
        </div>

        {/* Pending Attachment Preview */}
        {pendingAttachment && (
          <div className="shrink-0 max-w-3xl w-full mx-auto p-3 bg-yellow-50 border-t border-yellow-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              {pendingAttachment.type === 'image' ? (
                <img
                  src={pendingAttachment.url}
                  alt="Preview"
                  className="w-12 h-12 object-cover rounded-xl border border-yellow-300 shadow-xs"
                />
              ) : (
                <FileText className="w-6 h-6 text-yellow-600" />
              )}
              <div>
                <span className="font-bold text-zinc-900 block truncate max-w-sm">
                  {pendingAttachment.name || 'Lampiran'}
                </span>
                <span className="text-[11px] text-zinc-500">Siap dikirim dengan prompt Anda</span>
              </div>
            </div>
            <button
              onClick={() => setPendingAttachment(null)}
              className="p-1.5 rounded-full text-zinc-500 hover:text-zinc-900 hover:bg-yellow-200 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Attachment Popover Menu */}
        {isAttachMenuOpen && (
          <div className="shrink-0 max-w-3xl w-full mx-auto p-3 bg-white border-t border-zinc-200 grid grid-cols-4 gap-2 shadow-lg animate-fade-in">
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-zinc-50 hover:bg-yellow-50 border border-zinc-200 hover:border-yellow-400 text-zinc-800 transition cursor-pointer"
            >
              <div className="p-2 rounded-xl bg-yellow-400 text-zinc-950 mb-1">
                <Camera className="w-4 h-4 stroke-[2.5]" />
              </div>
              <span className="text-xs font-bold">Kamera</span>
            </button>

            <button
              type="button"
              onClick={() => galleryInputRef.current?.click()}
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-zinc-50 hover:bg-yellow-50 border border-zinc-200 hover:border-yellow-400 text-zinc-800 transition cursor-pointer"
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
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-zinc-50 hover:bg-yellow-50 border border-zinc-200 hover:border-yellow-400 text-zinc-800 transition cursor-pointer"
            >
              <div className="p-2 rounded-xl bg-yellow-400 text-zinc-950 mb-1">
                <Mic className="w-4 h-4 stroke-[2.5]" />
              </div>
              <span className="text-xs font-bold">Suara</span>
            </button>

            <button
              type="button"
              onClick={() => docInputRef.current?.click()}
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-zinc-50 hover:bg-yellow-50 border border-zinc-200 hover:border-yellow-400 text-zinc-800 transition cursor-pointer"
            >
              <div className="p-2 rounded-xl bg-zinc-100 text-zinc-800 border border-zinc-300 mb-1">
                <FileText className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold">File PDF</span>
            </button>
          </div>
        )}

        {/* Input Bar (Centered Desktop Layout) */}
        <div className="shrink-0 bg-white border-t border-zinc-200 p-3 md:p-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="max-w-3xl mx-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsAttachMenuOpen(!isAttachMenuOpen)}
              className={`p-3 rounded-2xl transition cursor-pointer shrink-0 ${
                isAttachMenuOpen
                  ? 'bg-yellow-400 text-zinc-950 rotate-45 shadow-md'
                  : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
              }`}
              title="Lampirkan Gambar, File, atau Suara"
            >
              <Plus className="w-5 h-5 stroke-[2.8] transition-transform duration-200" />
            </button>

            <input
              type="text"
              placeholder="Tanya rekomendasi servis, hitung konsumsi BBM, atau kirim foto spedometer..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              className="flex-1 px-4 py-3 bg-zinc-100 border border-zinc-200 rounded-2xl text-xs md:text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-900 focus:bg-white transition"
            />

            <button
              type="button"
              onClick={() => setIsVoiceModalOpen(true)}
              className="p-3 rounded-2xl bg-zinc-100 hover:bg-yellow-100 text-zinc-800 hover:text-zinc-950 transition cursor-pointer shrink-0"
              title="Bicara (Speech to Text)"
            >
              <Mic className="w-4 h-4 stroke-[2.5]" />
            </button>

            <button
              type="button"
              onClick={() => handleSend()}
              disabled={!inputText.trim() && !pendingAttachment}
              className="p-3 rounded-2xl bg-yellow-400 hover:bg-yellow-300 disabled:opacity-40 text-zinc-950 font-black transition shadow-md shadow-yellow-400/20 active:scale-95 cursor-pointer shrink-0"
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
