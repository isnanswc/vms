import React, { useState, useEffect } from 'react';
import appLogo from '../assets/app-logo.png';
import { 
  Download, 
  Sparkles, 
  Bell, 
  Zap, 
  Smartphone, 
  ShieldCheck, 
  Check, 
  X, 
  Share, 
  PlusSquare,
  ArrowRight
} from 'lucide-react';
import { ModalPortal } from './ModalPortal';
import { triggerHaptic } from '../utils/haptics';
import { 
  getDevicePlatform, 
  triggerPwaInstall, 
  hasDeferredPrompt 
} from '../utils/pwa';

interface InstallPwaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInstallSuccess?: () => void;
}

export const InstallPwaModal: React.FC<InstallPwaModalProps> = ({
  isOpen,
  onClose,
  onInstallSuccess,
}) => {
  const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop'>('desktop');
  const [isInstalling, setIsInstalling] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);
  const [canPromptDirectly, setCanPromptDirectly] = useState(false);

  useEffect(() => {
    setPlatform(getDevicePlatform());
    setCanPromptDirectly(hasDeferredPrompt());

    const handleInstallReady = () => setCanPromptDirectly(true);
    const handleInstalled = () => {
      setInstallSuccess(true);
      onInstallSuccess?.();
    };

    window.addEventListener('pwa-install-ready', handleInstallReady);
    window.addEventListener('pwa-installed', handleInstalled);

    return () => {
      window.removeEventListener('pwa-install-ready', handleInstallReady);
      window.removeEventListener('pwa-installed', handleInstalled);
    };
  }, [onInstallSuccess]);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    triggerHaptic('medium');
    setIsInstalling(true);

    try {
      const outcome = await triggerPwaInstall();
      if (outcome === 'accepted') {
        setInstallSuccess(true);
        setTimeout(() => {
          onClose();
          onInstallSuccess?.();
        }, 2200);
      }
    } finally {
      setIsInstalling(false);
    }
  };

  const benefits = [
    {
      icon: Bell,
      title: 'Notifikasi Asli Berlogo FleetLog',
      desc: 'Bebas logo Chrome! Notifikasi sistem di Windows Action Center & HP berlogo resmi FleetLog.',
      accent: 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-950/60',
    },
    {
      icon: Zap,
      title: 'Akses Instan & Siap Offline',
      desc: 'Buka dalam 0.3 detik langsung dari Desktop Taskbar atau Layar Utama tanpa reload browser.',
      accent: 'text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/60',
    },
    {
      icon: Smartphone,
      title: 'Tampilan Penuh Layar (Full Native)',
      desc: 'Tanpa address bar atau tab yang memenuhi layar. Pengalaman aplikasi mandiri yang imersif.',
      accent: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-950/60',
    },
    {
      icon: ShieldCheck,
      title: 'Penyimpanan Data Lokal Aman',
      desc: 'Basis data armada terenkripsi di IndexedDB perangkat Anda, hemat kuota internet dan stabil.',
      accent: 'text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60',
    },
  ];

  return (
    <ModalPortal>
      <div 
        className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-zinc-950/80 backdrop-blur-md animate-fade-in text-zinc-900 dark:text-zinc-100"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div 
          className="w-full max-w-lg bg-white dark:bg-zinc-900 border-t-2 sm:border-2 border-zinc-900 dark:border-zinc-700 rounded-t-[36px] sm:rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden transition-all max-h-[92vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Ambient Glow Accent Backdrop */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-theme-accent/15 rounded-full blur-3xl pointer-events-none -z-10" />

          {/* Top Pill for mobile pull down */}
          <div className="sm:hidden w-12 h-1.5 bg-zinc-300 dark:bg-zinc-700 rounded-full mx-auto mb-3 shrink-0" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Hero Banner Header */}
          <div className="flex items-center gap-3.5 pb-4 border-b border-zinc-100 dark:border-zinc-800 pr-10 shrink-0">
            <div className="relative w-14 h-14 rounded-2xl bg-zinc-950 dark:bg-zinc-800 border-2 border-theme-accent/60 p-1 flex items-center justify-center shadow-lg shadow-theme-accent/20 shrink-0">
              <img 
                src={appLogo} 
                alt="FleetLog App Icon" 
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.currentTarget.src = `${import.meta.env.BASE_URL}app-logo.png`;
                }}
              />
              <div className="absolute -top-1.5 -right-1.5 p-1 rounded-full bg-theme-accent text-theme-accent-fg shadow-xs">
                <Sparkles className="w-3 h-3 fill-current" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded-md bg-theme-accent text-theme-accent-fg font-black text-[10px] uppercase tracking-wider">
                  Progressive Web App
                </span>
                <span className="text-[10px] font-mono text-zinc-400 font-bold">VMS PRO</span>
              </div>
              <h3 className="font-black text-base sm:text-lg text-zinc-900 dark:text-zinc-100 leading-tight mt-0.5">
                Pasang Aplikasi FleetLog
              </h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Tingkatkan pengalaman armada ke level aplikasi native mandiri
              </p>
            </div>
          </div>

          {/* Scrollable Benefits Content */}
          <div className="space-y-4 overflow-y-auto py-4 flex-1 no-scrollbar text-xs">
            
            {/* Success State */}
            {installSuccess ? (
              <div className="p-6 rounded-3xl bg-emerald-50 dark:bg-emerald-950/50 border-2 border-emerald-500 text-center space-y-3 animate-scale-up">
                <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30">
                  <Check className="w-8 h-8 stroke-[3]" />
                </div>
                <div>
                  <h4 className="font-black text-base text-emerald-900 dark:text-emerald-200">
                    FleetLog Berhasil Dipasang!
                  </h4>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1 max-w-xs mx-auto">
                    Aplikasi sekarang dapat dibuka langsung dari Layar Utama HP atau Menu Desktop Anda dengan logo resmi FleetLog.
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* 4 Premium Benefits Grid */}
                <div className="space-y-2.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500 block px-1">
                    Keuntungan Utama Mode Aplikasi (PWA)
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {benefits.map((b, idx) => {
                      const Icon = b.icon;
                      return (
                        <div 
                          key={idx}
                          className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700/80 space-y-1 hover:border-theme-accent transition"
                        >
                          <div className="flex items-center gap-2">
                            <div className={`p-1.5 rounded-xl ${b.accent}`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <h5 className="font-extrabold text-xs text-zinc-900 dark:text-zinc-100">
                              {b.title}
                            </h5>
                          </div>
                          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed pl-0.5">
                            {b.desc}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Specific Device Installation Guide (if manual required or iOS) */}
                {platform === 'ios' ? (
                  <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200 space-y-2">
                    <div className="flex items-center gap-2 font-black text-xs">
                      <Share className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span>Cara Pasang di Safari iPhone / iPad:</span>
                    </div>
                    <ol className="text-[11px] space-y-1.5 list-decimal list-inside text-blue-800 dark:text-blue-300 font-medium">
                      <li>Ketuk ikon <strong>Bagikan (Share)</strong> di bilah navigasi bawah Safari.</li>
                      <li>Gulir ke bawah dan pilih <strong>"Tambah ke Layar Utama" (Add to Home Screen)</strong>.</li>
                      <li>Ketuk <strong>"Tambah" (Add)</strong> di sudut kanan atas. Selesai!</li>
                    </ol>
                  </div>
                ) : !canPromptDirectly ? (
                  <div className="p-3 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-[11px] space-y-1">
                    <p className="font-bold flex items-center gap-1.5">
                      <PlusSquare className="w-3.5 h-3.5 text-theme-accent" />
                      <span>Alternatif Pemasangan Browser:</span>
                    </p>
                    <p className="text-zinc-500 dark:text-zinc-400">
                      Klik menu peramban Anda (titik tiga <strong>⋮</strong> di sudut kanan atas) lalu pilih <strong>"Instal FleetLog"</strong> atau <strong>"Tambahkan ke Layar Utama"</strong>.
                    </p>
                  </div>
                ) : null}
              </>
            )}

          </div>

          {/* Action Footer */}
          {!installSuccess && (
            <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-4 rounded-xl text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white font-bold text-xs transition cursor-pointer"
              >
                Nanti Saja
              </button>

              {platform === 'ios' ? (
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 px-5 rounded-2xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition active:scale-98 cursor-pointer"
                >
                  <span>Saya Mengerti</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleInstallClick}
                  disabled={isInstalling}
                  className="flex-1 py-3 px-5 rounded-2xl bg-theme-accent hover:bg-theme-accent-hover text-theme-accent-fg font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-theme-accent/25 transition active:scale-98 cursor-pointer disabled:opacity-50"
                >
                  <Download className="w-4 h-4 stroke-[2.5]" />
                  <span>{isInstalling ? 'Memproses...' : 'Pasang Aplikasi Sekarang'}</span>
                </button>
              )}
            </div>
          )}

        </div>
      </div>
    </ModalPortal>
  );
};
