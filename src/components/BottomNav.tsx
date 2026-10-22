import React from 'react';
import { LayoutDashboard, CarFront, Fuel, Wrench, MessageSquare } from 'lucide-react';
import { AiChatLineIcon } from './AiChatLineIcon';

export type TabType = 'dashboard' | 'vehicles' | 'fuel' | 'service' | 'chat';

interface BottomNavProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
  serviceBadgeCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onChangeTab,
  serviceBadgeCount = 0,
}) => {
  const navItems: { id: TabType; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'dashboard', label: 'Beranda', icon: LayoutDashboard },
    { id: 'vehicles', label: 'Kendaraan', icon: CarFront },
    { id: 'chat', label: 'Chat AI', icon: MessageSquare },
    { id: 'fuel', label: 'Bahan Bakar', icon: Fuel },
    { id: 'service', label: 'Buku Servis', icon: Wrench },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border-t border-zinc-200 dark:border-zinc-800 pb-[env(safe-area-inset-bottom)] shadow-lg transition-colors">
      <div className="max-w-md mx-auto grid grid-cols-5 px-1 py-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const isChatCenter = item.id === 'chat';

          if (isChatCenter) {
            return (
              <button
                key={item.id}
                onClick={() => onChangeTab(item.id)}
                className="relative flex flex-col items-center justify-center py-1 px-1 cursor-pointer group"
              >
                <div className={`p-2 rounded-2xl transition-all shadow-md ${
                  isActive
                    ? 'bg-zinc-950 dark:bg-zinc-900 text-yellow-400 scale-110 shadow-zinc-900/30 border border-yellow-400/40'
                    : 'bg-yellow-400 text-zinc-950 hover:bg-yellow-300'
                }`}>
                  <AiChatLineIcon isActive={isActive} className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold text-zinc-900 dark:text-zinc-200 mt-1">
                  Chat AI
                </span>
              </button>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => onChangeTab(item.id)}
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
  );
};
