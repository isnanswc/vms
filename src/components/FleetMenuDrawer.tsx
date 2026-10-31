import React, { useState, useRef } from 'react';
import type { Vehicle, TabType } from '../types';
import { 
  Wrench, 
  Navigation, 
  PiggyBank, 
  Bell, 
  Droplet, 
  Camera, 
  FileText, 
  Sparkles, 
  ChevronRight, 
  X, 
  Check, 
  AlertCircle,
  Download
} from 'lucide-react';
import { ModalPortal } from './ModalPortal';
import { triggerHaptic } from '../utils/haptics';
import { isPwaStandalone } from '../utils/pwa';
import { 
  checkNotificationSupport, 
  requestNotificationPermission, 
  sendBrowserNotification 
} from '../utils/webPush';

interface FleetMenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  vehicles: Vehicle[];
  serviceBadgeCount?: number;
  onNavigateTab: (tab: TabType) => void;
  onOpenTripLog: () => void;
  onOpenPredictiveBudget: () => void;
  onOpenScanReceipt: () => void;
  onOpenAdjustFuel: () => void;
  onOpenServicePdf: () => void;
  onOpenAiChat: (prompt?: string) => void;
  onOpenInstallPwa?: () => void;
}

export const FleetMenuDrawer: React.FC<FleetMenuDrawerProps> = ({
  isOpen,
  onClose,
  vehicles,
  serviceBadgeCount = 0,
  onNavigateTab,
  onOpenTripLog,
  onOpenPredictiveBudget,
  onOpenScanReceipt,
  onOpenAdjustFuel,
  onOpenServicePdf,
  onOpenAiChat,
  onOpenInstallPwa,
}) => {
  // Swipe to dismiss gestures
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const touchStartY = useRef(0);

  // Web Push Status
  const [pushStatus, setPushStatus] = useState(() => checkNotificationSupport());
  const [isSendingNotif, setIsSendingNotif] = useState(false);
  const [testNotificationNotice, setTestNotificationNotice] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStartY.current;
    if (diff > 0) {
      setDragY(diff);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    if (dragY > 120) {
      triggerHaptic('light');
      onClose();
    }
    setDragY(0);
  };

  const handleEnablePush = async () => {
    triggerHaptic('medium');
    setIsSendingNotif(true);
    try {
      const perm = await requestNotificationPermission();
      const current = checkNotificationSupport();
      setPushStatus(current);

      if (perm === 'granted') {
        const res = await sendBrowserNotification('Notifikasi VMS Aktif! 🚀', {
          body: 'Sistem pengingat otomatis servis & pajak STNK armada Anda siap bekerja.',
        });
        if (res.success) {
          setTestNotificationNotice({
            type: 'success',
            text: '✓ Izin aktif! Notifikasi sistem berhasil dikirim ke perangkat.',
          });
        } else {
          setTestNotificationNotice({
            type: 'error',
            text: res.message || 'Izin diberikan, namun notifikasi sistem gagal ditampilkan.',
          });
        }
      } else if (perm === 'denied') {
        setTestNotificationNotice({
          type: 'error',
          text: 'Izin notifikasi diblokir di browser. Buka setelan izin situs di address bar untuk mengizinkan.',
        });
      } else {
        setTestNotificationNotice({
          type: 'info',
          text: 'Izin notifikasi belum disetujui.',
        });
      }
    } finally {
      setIsSendingNotif(false);
      setTimeout(() => setTestNotificationNotice(null), 6000);
    }
  };

  const handleSendTestPush = async () => {
    triggerHaptic('light');
    setIsSendingNotif(true);
    try {
      const res = await sendBrowserNotification('Uji Coba Pengingat Armada VMS', {
        body: 'Pengingat otomatis STNK dan suku cadang kritis siap muncul di layar Anda.',
      });

      if (res.success) {
        setTestNotificationNotice({
          type: 'success',
          text: `✓ Notifikasi berhasil dikirim via ${res.method === 'serviceworker' ? 'Service Worker' : 'Desktop'}!`,
        });
      } else {
        setTestNotificationNotice({
          type: 'error',
          text: res.message || 'Gagal mengirim. Periksa izin di setelan browser atau status Jangan Ganggu (Focus Assist).',
        });
      }
    } finally {
      setIsSendingNotif(false);
      setTimeout(() => setTestNotificationNotice(null), 6000);
    }
  };

  return (
    <ModalPortal>
      <div 
        className="fixed inset-0 z-[100] flex items-end justify-center bg-zinc-950/75 backdrop-blur-md animate-fade-in text-zinc-900 dark:text-zinc-100"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div 
          className="w-full max-w-xl bg-white dark:bg-zinc-900 border-t-2 sm:border-2 border-zinc-900 dark:border-zinc-700 rounded-t-[36px] sm:rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden transition-transform duration-200 max-h-[88vh] flex flex-col"
          style={{
            transform: `translateY(${dragY}px)`,
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Top Swipe Drag Handle Bar */}
          <div className="w-12 h-1.5 bg-zinc-300 dark:bg-zinc-700 rounded-full mx-auto mb-3 cursor-grab shrink-0 active:scale-95" />

          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-theme-accent text-theme-accent-fg font-black text-[10px] uppercase tracking-wider">
                  Fleet Hub
                </span>
                <span className="text-xs text-zinc-400">•</span>
                <span className="text-xs text-zinc-500 font-bold">
                  {vehicles.length} Unit Armada Terdaftar
                </span>
              </div>
              <h3 className="font-black text-base sm:text-lg uppercase tracking-tight text-zinc-900 dark:text-zinc-100 mt-0.5">
                Pusat Layanan & Menu Armada
              </h3>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-full text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="space-y-4 overflow-y-auto pr-1 flex-1 no-scrollbar mt-3 text-xs">
            
            {/* ======================================================== */}
            {/* GROUP 1: FITUR UNGGULAN & BARU                          */}
            {/* ======================================================== */}
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500 block mb-2 px-1">
                Layanan Utama & Analitik Pintar
              </span>

              <div className="space-y-2">
                {/* 1. BUKU SERVIS DIGITAL (The original service tab) */}
                <div
                  onClick={() => {
                    triggerHaptic('light');
                    onClose();
                    onNavigateTab('service');
                  }}
                  className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/80 hover:bg-theme-accent-subtle/50 dark:hover:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700 hover:border-theme-accent transition cursor-pointer flex items-center justify-between group active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-theme-accent text-theme-accent-fg shadow-xs shrink-0">
                      <Wrench className="w-5 h-5 stroke-[2.2]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-black text-sm text-zinc-900 dark:text-zinc-100 group-hover:text-black dark:group-hover:text-white">
                          Buku Servis Digital & Suku Cadang
                        </h4>
                        {serviceBadgeCount > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white font-mono font-black text-[10px] animate-pulse">
                            {serviceBadgeCount} Kritis
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                        Riwayat perawatan berkala, klaim bengkel, dan kalibrasi keausan suku cadang
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-950 dark:group-hover:text-white transition-transform group-hover:translate-x-0.5 shrink-0" />
                </div>

                {/* 2. LOGBOOK PERJALANAN (FITUR #1) */}
                <div
                  onClick={() => {
                    triggerHaptic('light');
                    onClose();
                    onOpenTripLog();
                  }}
                  className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/80 hover:bg-blue-50/80 dark:hover:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700 hover:border-blue-400 transition cursor-pointer flex items-center justify-between group active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-blue-500 text-white shadow-xs shrink-0">
                      <Navigation className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-black text-sm text-zinc-900 dark:text-zinc-100 group-hover:text-blue-900 dark:group-hover:text-blue-300">
                          Logbook Perjalanan & Reimbursement
                        </h4>
                        <span className="px-1.5 py-0.2 rounded bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 text-[9px] font-bold uppercase">
                          Fitur Baru
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                        Catat KM rute dinas/operasional dan hitung biaya bensin trip secara otomatis
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-blue-600 transition-transform group-hover:translate-x-0.5 shrink-0" />
                </div>

                {/* 3. PREDIKSI ANGGARAN & SINKING FUND (FITUR #2) */}
                <div
                  onClick={() => {
                    triggerHaptic('light');
                    onClose();
                    onOpenPredictiveBudget();
                  }}
                  className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/80 hover:bg-purple-50/80 dark:hover:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700 hover:border-purple-400 transition cursor-pointer flex items-center justify-between group active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-purple-500 text-white shadow-xs shrink-0">
                      <PiggyBank className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-black text-sm text-zinc-900 dark:text-zinc-100 group-hover:text-purple-900 dark:group-hover:text-purple-300">
                          Prediksi Anggaran & Sinking Fund
                        </h4>
                        <span className="px-1.5 py-0.2 rounded bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 text-[9px] font-bold uppercase">
                          Cerdas
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                        Proyeksi kebutuhan dana servis 6 bulan ke depan & tabungan cadangan harian
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-purple-600 transition-transform group-hover:translate-x-0.5 shrink-0" />
                </div>
              </div>
            </div>

            {/* ======================================================== */}
            {/* GROUP PWA: PASANG APLIKASI (JIKA BELUM PWA STANDALONE)  */}
            {/* ======================================================== */}
            {!isPwaStandalone() && onOpenInstallPwa && (
              <div 
                onClick={() => {
                  triggerHaptic('medium');
                  onClose();
                  onOpenInstallPwa();
                }}
                className="p-3.5 rounded-3xl bg-gradient-to-r from-theme-accent/20 via-theme-accent/10 to-transparent border-2 border-theme-accent hover:border-theme-accent cursor-pointer transition flex items-center justify-between group active:scale-[0.99] shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-theme-accent text-theme-accent-fg shadow-xs shrink-0">
                    <Download className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-black text-sm text-zinc-900 dark:text-zinc-100 group-hover:text-black dark:group-hover:text-white">
                        Pasang Aplikasi FleetLog (PWA)
                      </h4>
                      <span className="px-1.5 py-0.2 rounded bg-theme-accent text-theme-accent-fg font-black text-[9px] uppercase">
                        Rekomendasi
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                      Dapatkan notifikasi sistem resmi berlogo FleetLog & akses offline instan di layar utama
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-theme-accent group-hover:translate-x-0.5 transition-transform shrink-0" />
              </div>
            )}

            {/* ======================================================== */}
            {/* GROUP 2: WEB PUSH NOTIFICATION (FITUR #5)               */}
            {/* ======================================================== */}
            <div className="p-4 rounded-3xl bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-2xl ${
                    pushStatus.permission === 'granted'
                      ? 'bg-emerald-500 text-white'
                      : 'bg-zinc-300 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200'
                  }`}>
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-zinc-900 dark:text-zinc-100">
                      Web Push Notification Browser
                    </h5>
                    <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      {pushStatus.permission === 'granted' 
                        ? '🟢 Pengingat otomatis aktif (STNK & servis darurat)'
                        : '⚪ Dapatkan notifikasi jatuh tempo pajak & servis di HP/PC'}
                    </span>
                  </div>
                </div>

                <div className="shrink-0">
                  {pushStatus.permission === 'granted' ? (
                    <button
                      type="button"
                      onClick={handleSendTestPush}
                      disabled={isSendingNotif}
                      className="py-1.5 px-3 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 disabled:opacity-50 text-zinc-800 dark:text-zinc-200 rounded-xl font-bold text-[10px] transition cursor-pointer"
                    >
                      Tes Notif
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleEnablePush}
                      disabled={isSendingNotif}
                      className="py-1.5 px-3 bg-theme-accent hover:bg-theme-accent-hover disabled:opacity-50 text-theme-accent-fg rounded-xl font-black text-[10px] uppercase tracking-wider transition cursor-pointer active:scale-95 shadow-xs"
                    >
                      Aktifkan
                    </button>
                  )}
                </div>
              </div>

              {/* Detailed diagnostic notice if permission denied or insecure context */}
              {pushStatus.notes && pushStatus.permission !== 'granted' && (
                <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-[11px] font-medium border border-amber-200 dark:border-amber-800/60 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                  <span>{pushStatus.notes}</span>
                </div>
              )}

              {/* Action Feedback Result */}
              {testNotificationNotice && (
                <div className={`p-2.5 rounded-xl text-[11px] font-bold flex items-start gap-2 animate-fade-in ${
                  testNotificationNotice.type === 'success'
                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                    : testNotificationNotice.type === 'error'
                    ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                    : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200'
                }`}>
                  {testNotificationNotice.type === 'success' ? (
                    <Check className="w-4 h-4 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  )}
                  <span className="leading-snug">{testNotificationNotice.text}</span>
                </div>
              )}
            </div>

            {/* ======================================================== */}
            {/* GROUP 3: ALAT OPERASIONAL & TELEMATIKA                   */}
            {/* ======================================================== */}
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500 block mb-2 px-1">
                Alat Cepat & Operasional
              </span>

              <div className="grid grid-cols-2 gap-2">
                {/* Lapor Kebocoran BBM */}
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    onClose();
                    onOpenAdjustFuel();
                  }}
                  className="p-3 bg-zinc-50 dark:bg-zinc-800/80 hover:bg-rose-50 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:border-rose-400 rounded-2xl text-left transition cursor-pointer active:scale-98"
                >
                  <div className="flex items-center gap-2 mb-1 text-rose-600 dark:text-rose-400">
                    <Droplet className="w-4 h-4 fill-current" />
                    <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100">Koreksi / Bocor BBM</span>
                  </div>
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400 line-clamp-1">
                    Catat kebocoran selang & kuras
                  </span>
                </button>

                {/* Scan Struk AI */}
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    onClose();
                    onOpenScanReceipt();
                  }}
                  className="p-3 bg-zinc-50 dark:bg-zinc-800/80 hover:bg-yellow-50 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:border-yellow-400 rounded-2xl text-left transition cursor-pointer active:scale-98"
                >
                  <div className="flex items-center gap-2 mb-1 text-yellow-600 dark:text-yellow-400">
                    <Camera className="w-4 h-4" />
                    <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100">AI Scan Struk</span>
                  </div>
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400 line-clamp-1">
                    Deteksi struk SPBU & odometer
                  </span>
                </button>

                {/* Export PDF */}
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    onClose();
                    onOpenServicePdf();
                  }}
                  className="p-3 bg-zinc-50 dark:bg-zinc-800/80 hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-left transition cursor-pointer active:scale-98"
                >
                  <div className="flex items-center gap-2 mb-1 text-zinc-700 dark:text-zinc-300">
                    <FileText className="w-4 h-4" />
                    <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100">Export PDF Servis</span>
                  </div>
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400 line-clamp-1">
                    Cetak buku sertifikat servis
                  </span>
                </button>

                {/* Fleet AI Assistant */}
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    onClose();
                    onOpenAiChat();
                  }}
                  className="p-3 bg-zinc-50 dark:bg-zinc-800/80 hover:bg-theme-accent-subtle/50 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:border-theme-accent rounded-2xl text-left transition cursor-pointer active:scale-98"
                >
                  <div className="flex items-center gap-2 mb-1 text-theme-accent">
                    <Sparkles className="w-4 h-4" />
                    <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100">Fleet AI Chat</span>
                  </div>
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400 line-clamp-1">
                    Tanya jawab teknis & armada
                  </span>
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </ModalPortal>
  );
};
