import React, { useState, useRef, useEffect } from 'react';
import { 
  LayoutDashboard, 
  CarFront, 
  Fuel, 
  Wrench, 
  MessageSquarePlus, 
  Camera, 
  Sliders, 
  Sparkles, 
  X 
} from 'lucide-react';
import { AiChatLineIcon } from './AiChatLineIcon';
import { triggerHaptic } from '../utils/haptics';

export type TabType = 'dashboard' | 'vehicles' | 'fuel' | 'service' | 'chat';

interface BottomNavProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
  serviceBadgeCount?: number;
  onOpenQuickScan?: () => void;
  onOpenAiSettings?: () => void;
  onNewChat?: () => void;
  onOpenAiWithPrompt?: (prompt: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onChangeTab,
  serviceBadgeCount = 0,
  onOpenQuickScan,
  onOpenAiSettings,
  onNewChat,
  onOpenAiWithPrompt,
}) => {
  const [isQuickAiMenuOpen, setIsQuickAiMenuOpen] = useState(false);
  const [isHoldingAi, setIsHoldingAi] = useState(false);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didTriggerHoldRef = useRef(false);

  const navItems: { id: TabType; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'dashboard', label: 'Beranda', icon: LayoutDashboard },
    { id: 'vehicles', label: 'Kendaraan', icon: CarFront },
    { id: 'chat', label: 'Fleet AI', icon: () => null }, // Special center circular frame
    { id: 'fuel', label: 'Bahan Bakar', icon: Fuel },
    { id: 'service', label: 'Buku Servis', icon: Wrench },
  ];

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    };
  }, []);

  // Long press handlers for AI Center Button
  const handleAiTouchStart = () => {
    didTriggerHoldRef.current = false;
    setIsHoldingAi(true);

    holdTimerRef.current = setTimeout(() => {
      didTriggerHoldRef.current = true;
      setIsHoldingAi(false);
      triggerHaptic('heavy');
      setIsQuickAiMenuOpen(true);
    }, 450); // 450ms hold threshold
  };

  const handleAiTouchEnd = () => {
    setIsHoldingAi(false);
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  };

  const handleAiClick = () => {
    if (didTriggerHoldRef.current) {
      didTriggerHoldRef.current = false;
      return;
    }
    triggerHaptic('light');
    onChangeTab('chat');
  };

  return (
    <>
      {/* QUICK AI ACTIONS SHEET (TRIGGERED BY LONG-PRESS HOLD) */}
      {isQuickAiMenuOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 bg-zinc-950/60 backdrop-blur-sm animate-fade-in"
          onClick={() => {
            triggerHaptic('light');
            setIsQuickAiMenuOpen(false);
          }}
        >
          <div 
            className="w-full max-w-sm bg-white dark:bg-zinc-900 border-2 border-zinc-900 dark:border-zinc-700 rounded-3xl p-5 shadow-2xl mb-20 sm:mb-0 space-y-4 animate-scale-up text-zinc-900 dark:text-zinc-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-theme-accent text-theme-accent-fg flex items-center justify-center shadow-[0_0_12px_rgba(255,255,255,0.7)] font-black">
                  <Sparkles className="w-4 h-4 fill-current" />
                </div>
                <div>
                  <h4 className="font-black text-xs uppercase tracking-wider text-zinc-900 dark:text-white">
                    Aksi Cepat AI
                  </h4>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                    Menu pintas Fleet AI assistant
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  triggerHaptic('light');
                  setIsQuickAiMenuOpen(false);
                }}
                className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Action Options */}
            <div className="grid grid-cols-1 gap-2 text-xs font-bold">
              {/* Option 1: Mulai Chat Baru */}
              <button
                onClick={() => {
                  triggerHaptic('medium');
                  setIsQuickAiMenuOpen(false);
                  onNewChat?.();
                  onChangeTab('chat');
                }}
                className="flex items-center gap-3 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/80 hover:bg-theme-accent hover:text-theme-accent-fg dark:hover:bg-theme-accent dark:hover:text-theme-accent-fg border border-zinc-200 dark:border-zinc-700/80 transition cursor-pointer text-left group"
              >
                <div className="p-2 rounded-xl bg-white dark:bg-zinc-900 text-theme-accent group-hover:bg-zinc-950 group-hover:text-theme-accent transition shadow-xs">
                  <MessageSquarePlus className="w-4 h-4" />
                </div>
                <div>
                  <span className="block font-black">Percakapan Baru</span>
                  <span className="text-[10px] font-normal text-zinc-500 dark:text-zinc-400 group-hover:text-inherit">
                    Buka sesi tanya jawab AI segar
                  </span>
                </div>
              </button>

              {/* Option 2: Scan Cepat AI Vision */}
              <button
                onClick={() => {
                  triggerHaptic('medium');
                  setIsQuickAiMenuOpen(false);
                  onOpenQuickScan?.();
                }}
                className="flex items-center gap-3 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/80 hover:bg-theme-accent hover:text-theme-accent-fg dark:hover:bg-theme-accent dark:hover:text-theme-accent-fg border border-zinc-200 dark:border-zinc-700/80 transition cursor-pointer text-left group"
              >
                <div className="p-2 rounded-xl bg-white dark:bg-zinc-900 text-theme-accent group-hover:bg-zinc-950 group-hover:text-theme-accent transition shadow-xs">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <span className="block font-black">Pindai Struk BBM Cepat</span>
                  <span className="text-[10px] font-normal text-zinc-500 dark:text-zinc-400 group-hover:text-inherit">
                    Otomatis deteksi liter, biaya & KM
                  </span>
                </div>
              </button>

              {/* Option 3: Analisis Armada AI */}
              <button
                onClick={() => {
                  triggerHaptic('medium');
                  setIsQuickAiMenuOpen(false);
                  onOpenAiWithPrompt?.('Tolong buatkan analisis kondisi seluruh armada dan rekomendasi servis yang paling mendesak hari ini.');
                }}
                className="flex items-center gap-3 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/80 hover:bg-theme-accent hover:text-theme-accent-fg dark:hover:bg-theme-accent dark:hover:text-theme-accent-fg border border-zinc-200 dark:border-zinc-700/80 transition cursor-pointer text-left group"
              >
                <div className="p-2 rounded-xl bg-white dark:bg-zinc-900 text-theme-accent group-hover:bg-zinc-950 group-hover:text-theme-accent transition shadow-xs">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <span className="block font-black">Analisis Armada Mandiri</span>
                  <span className="text-[10px] font-normal text-zinc-500 dark:text-zinc-400 group-hover:text-inherit">
                    Cek efisiensi bbm & kesehatan suku cadang
                  </span>
                </div>
              </button>

              {/* Option 4: Kelola Model AI */}
              <button
                onClick={() => {
                  triggerHaptic('medium');
                  setIsQuickAiMenuOpen(false);
                  onOpenAiSettings?.();
                }}
                className="flex items-center gap-3 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/80 hover:bg-theme-accent hover:text-theme-accent-fg dark:hover:bg-theme-accent dark:hover:text-theme-accent-fg border border-zinc-200 dark:border-zinc-700/80 transition cursor-pointer text-left group"
              >
                <div className="p-2 rounded-xl bg-white dark:bg-zinc-900 text-theme-accent group-hover:bg-zinc-950 group-hover:text-theme-accent transition shadow-xs">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <span className="block font-black">Setelan Model Gemini</span>
                  <span className="text-[10px] font-normal text-zinc-500 dark:text-zinc-400 group-hover:text-inherit">
                    Konfigurasi API Key & slot model fallback
                  </span>
                </div>
              </button>
            </div>

            <p className="text-[10px] text-center text-zinc-400 dark:text-zinc-500 italic">
              Tips: Tahan tombol Chat AI kapan saja untuk membuka menu pintas ini.
            </p>
          </div>
        </div>
      )}

      {/* ANIMATED BOTTOM NAVIGATION BAR */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-xl border-t border-zinc-200/80 dark:border-zinc-800/80 pb-[max(env(safe-area-inset-bottom),6px)] pt-1 px-1.5 shadow-2xl transition-colors">
        <div className="max-w-md mx-auto grid grid-cols-5 px-1 py-1 relative items-center">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const isChatCenter = item.id === 'chat';

            /* ======================================================== */
            /* SPECIAL CENTER AI BUTTON: GLOWING COSMIC PULSE ORB       */
            /* ======================================================== */
            if (isChatCenter) {
              return (
                <div key={item.id} className="relative flex flex-col items-center justify-center">
                  <button
                    onClick={handleAiClick}
                    onMouseDown={handleAiTouchStart}
                    onMouseUp={handleAiTouchEnd}
                    onMouseLeave={handleAiTouchEnd}
                    onTouchStart={handleAiTouchStart}
                    onTouchEnd={handleAiTouchEnd}
                    aria-label="Fleet Chat AI (Tahan untuk menu pintas)"
                    title="Klik untuk Chat AI, atau tahan untuk Menu Pintas"
                    className={`relative -top-5 w-13 h-13 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 ring-4 ring-white dark:ring-zinc-950 ${
                      isHoldingAi ? 'scale-120' : 'hover:scale-105 active:scale-95'
                    } ${
                      isActive
                        ? 'bg-zinc-950 dark:bg-zinc-900 text-theme-accent border-2 border-theme-accent animate-nav-glow shadow-xl'
                        : 'bg-theme-accent text-theme-accent-fg hover:opacity-95 shadow-lg shadow-theme-accent/30 animate-nav-glow'
                    }`}
                  >
                    {/* Holding Expanding Radar Wave */}
                    {isHoldingAi && (
                      <span className="absolute inset-0 rounded-full border-2 border-theme-accent animate-ping opacity-75" />
                    )}

                    {/* Ambient Center Glow */}
                    <span className="absolute inset-1 rounded-full bg-theme-accent/20 filter blur-xs -z-10" />

                    {/* AI Icon */}
                    <div className="w-full h-full rounded-full flex items-center justify-center">
                      <AiChatLineIcon isActive={isActive} className="w-6 h-6" />
                    </div>
                  </button>

                  <span className={`text-[10px] tracking-tight -mt-4 transition-all duration-200 ${
                    isActive ? 'font-black text-theme-accent scale-105' : 'font-bold text-zinc-600 dark:text-zinc-400'
                  }`}>
                    Chat AI
                  </span>
                </div>
              );
            }

            /* STANDARD ANIMATED BOTTOM NAV BUTTONS */
            return (
              <button
                key={item.id}
                onClick={() => {
                  triggerHaptic('selection');
                  onChangeTab(item.id);
                }}
                className={`relative flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition-all duration-200 cursor-pointer group ${
                  isActive
                    ? 'text-theme-accent font-black'
                    : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
                }`}
              >
                {/* Active Soft Pill Capsule Backdrop */}
                {isActive && (
                  <div className="absolute inset-x-1 inset-y-0.5 bg-theme-accent/15 dark:bg-theme-accent/20 rounded-2xl border border-theme-accent/30 -z-10 animate-nav-pop shadow-xs" />
                )}

                {/* Glowing Top Pip Indicator */}
                {isActive && (
                  <div className="absolute -top-1 w-6 h-[3px] bg-theme-accent rounded-full shadow-[0_0_10px_var(--theme-accent)] animate-nav-pop" />
                )}

                <div className="relative">
                  <Icon
                    className={`w-5 h-5 transition-all duration-300 ${
                      isActive 
                        ? 'scale-115 -translate-y-0.5 stroke-[2.5] text-theme-accent ease-[cubic-bezier(0.34,1.56,0.64,1)]' 
                        : 'stroke-[2] scale-100 translate-y-0 group-hover:scale-105 transition-transform'
                    }`}
                  />

                  {/* Service Badge with Heartbeat animation */}
                  {item.id === 'service' && serviceBadgeCount > 0 && (
                    <span className="absolute -top-1.5 -right-2 px-1 min-w-[15px] h-[15px] bg-theme-accent text-theme-accent-fg text-[9px] font-black rounded-full flex items-center justify-center shadow-xs animate-heartbeat-loop">
                      {serviceBadgeCount}
                    </span>
                  )}
                </div>

                <span className={`text-[10px] tracking-tight mt-1 transition-all duration-200 ${
                  isActive 
                    ? 'font-black text-theme-accent scale-105' 
                    : 'font-semibold text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-800 dark:group-hover:text-zinc-200'
                }`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
