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
                <div className="w-8 h-8 rounded-full bg-yellow-400 text-zinc-950 flex items-center justify-center shadow-[0_0_12px_rgba(255,255,255,0.7)] font-black">
                  <Sparkles className="w-4 h-4 fill-zinc-950" />
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
                className="flex items-center gap-3 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/80 hover:bg-yellow-400 hover:text-zinc-950 dark:hover:bg-yellow-400 dark:hover:text-zinc-950 border border-zinc-200 dark:border-zinc-700/80 transition cursor-pointer text-left group"
              >
                <div className="p-2 rounded-xl bg-white dark:bg-zinc-900 text-yellow-500 group-hover:bg-zinc-950 group-hover:text-yellow-400 transition shadow-xs">
                  <MessageSquarePlus className="w-4 h-4" />
                </div>
                <div>
                  <span className="block font-black">Percakapan Baru</span>
                  <span className="text-[10px] font-normal text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-900">
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
                className="flex items-center gap-3 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/80 hover:bg-yellow-400 hover:text-zinc-950 dark:hover:bg-yellow-400 dark:hover:text-zinc-950 border border-zinc-200 dark:border-zinc-700/80 transition cursor-pointer text-left group"
              >
                <div className="p-2 rounded-xl bg-white dark:bg-zinc-900 text-yellow-500 group-hover:bg-zinc-950 group-hover:text-yellow-400 transition shadow-xs">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <span className="block font-black">Pindai Struk BBM Cepat</span>
                  <span className="text-[10px] font-normal text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-900">
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
                className="flex items-center gap-3 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/80 hover:bg-yellow-400 hover:text-zinc-950 dark:hover:bg-yellow-400 dark:hover:text-zinc-950 border border-zinc-200 dark:border-zinc-700/80 transition cursor-pointer text-left group"
              >
                <div className="p-2 rounded-xl bg-white dark:bg-zinc-900 text-yellow-500 group-hover:bg-zinc-950 group-hover:text-yellow-400 transition shadow-xs">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <span className="block font-black">Analisis Armada Mandiri</span>
                  <span className="text-[10px] font-normal text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-900">
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
                className="flex items-center gap-3 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/80 hover:bg-yellow-400 hover:text-zinc-950 dark:hover:bg-yellow-400 dark:hover:text-zinc-950 border border-zinc-200 dark:border-zinc-700/80 transition cursor-pointer text-left group"
              >
                <div className="p-2 rounded-xl bg-white dark:bg-zinc-900 text-yellow-500 group-hover:bg-zinc-950 group-hover:text-yellow-400 transition shadow-xs">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <span className="block font-black">Setelan Model Gemini</span>
                  <span className="text-[10px] font-normal text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-900">
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

      {/* BOTTOM NAVIGATION BAR */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border-t border-zinc-200 dark:border-zinc-800 pb-[env(safe-area-inset-bottom)] shadow-lg transition-colors">
        <div className="max-w-md mx-auto grid grid-cols-5 px-1 py-1 relative">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const isChatCenter = item.id === 'chat';

            /* ======================================================== */
            /* SPECIAL CENTER AI BUTTON: PERFECT CIRCLE & PURE WHITE GLOW */
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
                    className={`relative -top-4 w-13 h-13 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 ring-4 ring-white dark:ring-zinc-950 ${
                      isHoldingAi ? 'scale-115' : 'hover:scale-105 active:scale-95'
                    } ${
                      isActive
                        ? 'bg-zinc-950 dark:bg-zinc-900 text-yellow-400 border-2 border-yellow-400 shadow-[0_0_20px_rgba(255,255,255,0.7)] dark:shadow-[0_0_25px_rgba(255,255,255,0.45)]'
                        : 'bg-yellow-400 text-zinc-950 hover:bg-yellow-300 shadow-[0_0_18px_rgba(255,255,255,0.75)] dark:shadow-[0_0_22px_rgba(255,255,255,0.4)]'
                    }`}
                  >
                    {/* Holding Pulse Ring Indicator */}
                    {isHoldingAi && (
                      <span className="absolute inset-0 rounded-full border-2 border-yellow-400 animate-ping opacity-75" />
                    )}

                    {/* Perfect Circle Inner Core */}
                    <div className="w-full h-full rounded-full flex items-center justify-center">
                      <AiChatLineIcon isActive={isActive} className="w-6 h-6" />
                    </div>
                  </button>

                  <span className={`text-[10px] tracking-tight -mt-3 ${
                    isActive ? 'font-black text-zinc-950 dark:text-yellow-400' : 'font-bold text-zinc-600 dark:text-zinc-400'
                  }`}>
                    Chat AI
                  </span>
                </div>
              );
            }

            /* STANDARD BOTTOM NAV BUTTONS */
            return (
              <button
                key={item.id}
                onClick={() => {
                  triggerHaptic('selection');
                  onChangeTab(item.id);
                }}
                className={`relative flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all cursor-pointer ${
                  isActive
                    ? 'text-zinc-950 dark:text-zinc-100 font-black'
                    : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                }`}
              >
                {isActive && (
                  <div className="absolute top-0 w-8 h-[2.5px] bg-yellow-400 rounded-full shadow-xs"></div>
                )}

                <div className="relative">
                  <Icon
                    className={`w-5 h-5 transition-transform duration-200 ${
                      isActive ? 'scale-110 stroke-[2.5] text-zinc-950 dark:text-yellow-400' : 'stroke-[1.8]'
                    }`}
                  />

                  {item.id === 'service' && serviceBadgeCount > 0 && (
                    <span className="absolute -top-1 -right-2 px-1 min-w-[14px] h-[14px] bg-yellow-400 text-zinc-950 text-[9px] font-black rounded-full flex items-center justify-center shadow-xs animate-heartbeat-loop">
                      {serviceBadgeCount}
                    </span>
                  )}
                </div>

                <span className={`text-[10px] tracking-tight mt-1 ${isActive ? 'font-bold text-zinc-950 dark:text-yellow-400' : ''}`}>
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
