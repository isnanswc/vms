import React, { useState, useEffect } from 'react';
import appLogo from '../assets/app-logo.png';
import { Download, Sparkles, X, ChevronRight, Smartphone } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';
import { isPwaStandalone, triggerPwaInstall, hasDeferredPrompt, getDevicePlatform } from '../utils/pwa';

interface InstallPwaBannerProps {
  onOpenDetailedModal: () => void;
}

const DISMISS_KEY = 'vms_pwa_dismissed_time';
const DISMISS_DURATION_MS = 24 * 60 * 60 * 1000; // 24 jam

export const InstallPwaBanner: React.FC<InstallPwaBannerProps> = ({
  onOpenDetailedModal,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // 1. Jika aplikasi sudah terinstal sebagai PWA standalone, jangan pernah munculkan
    if (isPwaStandalone()) {
      return;
    }

    // 2. Cek apakah pengguna sempat menutup banner dalam 24 jam terakhir
    const lastDismissed = localStorage.getItem(DISMISS_KEY);
    if (lastDismissed) {
      const timePassed = Date.now() - parseInt(lastDismissed, 10);
      if (timePassed < DISMISS_DURATION_MS) {
        return;
      }
    }

    // 3. Tampilkan dengan jeda elegan 1.8 detik setelah load
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 1800);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    triggerHaptic('light');
    setIsVisible(false);
    setIsDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, Date.now().toString());
    } catch {}
  };

  const handleQuickInstall = async (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('medium');

    const platform = getDevicePlatform();
    if (platform === 'ios' || !hasDeferredPrompt()) {
      // Pada iOS atau peramban yang butuh panduan manual, buka modal detail
      onOpenDetailedModal();
      return;
    }

    const outcome = await triggerPwaInstall();
    if (outcome === 'accepted') {
      setIsVisible(false);
    } else {
      onOpenDetailedModal();
    }
  };

  if (!isVisible || isDismissed) return null;

  return (
    <aside 
      aria-label="Pemasangan Aplikasi PWA"
      className="fixed bottom-20 md:bottom-6 right-3 md:right-6 z-40 max-w-sm w-[calc(100%-1.5rem)] animate-slide-up select-none"
    >
      <div 
        onClick={() => {
          triggerHaptic('light');
          onOpenDetailedModal();
        }}
        className="p-3.5 bg-zinc-950/95 dark:bg-zinc-900/95 text-white border-2 border-theme-accent/60 rounded-3xl shadow-[0_12px_40px_rgba(0,0,0,0.45)] backdrop-blur-xl transition hover:border-theme-accent cursor-pointer group relative overflow-hidden"
      >
        {/* Subtle Ambient Shimmer */}
        <div className="absolute inset-0 bg-gradient-to-r from-theme-accent/10 via-transparent to-theme-accent/5 pointer-events-none" />

        <div className="flex items-center justify-between gap-3 relative">
          {/* App Icon with glowing pulse */}
          <div className="relative w-11 h-11 rounded-2xl bg-zinc-900 dark:bg-zinc-800 border border-theme-accent/40 p-1 flex items-center justify-center shrink-0 shadow-md">
            <img 
              src={appLogo} 
              alt="FleetLog" 
              className="w-full h-full object-contain"
              onError={(e) => {
                e.currentTarget.src = `${import.meta.env.BASE_URL}app-logo.png`;
              }}
            />
            <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-theme-accent rounded-full border-2 border-zinc-950 flex items-center justify-center">
              <Sparkles className="w-2 h-2 text-theme-accent-fg fill-current" />
            </span>
          </div>

          {/* Text Content */}
          <div className="flex-1 min-w-0 pr-1">
            <div className="flex items-center gap-1.5">
              <span className="font-black text-xs text-white uppercase tracking-wider block truncate">
                Pasang FleetLog PRO
              </span>
              <span className="px-1.5 py-0.2 rounded bg-theme-accent text-theme-accent-fg font-black text-[9px]">
                PWA
              </span>
            </div>
            <p className="text-[11px] text-zinc-300 dark:text-zinc-400 truncate mt-0.5 font-medium">
              Notifikasi berlogo asli & akses instan
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleQuickInstall}
              className="py-2 px-3 bg-theme-accent hover:bg-theme-accent-hover text-theme-accent-fg rounded-xl font-black text-xs uppercase tracking-tight flex items-center gap-1.5 shadow-md shadow-theme-accent/30 transition active:scale-95 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="hidden xs:inline">Instal</span>
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleDismiss();
              }}
              title="Tutup pengingat ini"
              className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Bottom Micro Pill Link */}
        <div className="mt-2 pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[10px] text-zinc-400">
          <span className="flex items-center gap-1">
            <Smartphone className="w-3 h-3 text-theme-accent" />
            <span>Mode aplikasi mandiri di perangkat</span>
          </span>
          <span className="text-theme-accent font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
            <span>Lihat Benefit</span>
            <ChevronRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </aside>
  );
};
