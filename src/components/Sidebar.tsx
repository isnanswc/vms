import React from 'react';
import type { TabType } from './BottomNav';
import type { UserProfile } from '../types/user';
import { 
  LayoutDashboard, 
  CarFront, 
  Fuel, 
  Wrench, 
  MessageSquare, 
  Sparkles,
  CreditCard,
  ChevronRight
} from 'lucide-react';

interface SidebarProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
  serviceBadgeCount?: number;
  profile: UserProfile;
  onOpenProfile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onChangeTab,
  serviceBadgeCount = 0,
  profile,
  onOpenProfile,
}) => {
  const navItems: { id: TabType; label: string; icon: React.FC<{ className?: string }>; badge?: number }[] = [
    { id: 'dashboard', label: 'Dashboard Beranda', icon: LayoutDashboard },
    { id: 'vehicles', label: 'Garasi Kendaraan', icon: CarFront },
    { id: 'chat', label: 'Fleet AI Assistant', icon: MessageSquare },
    { id: 'fuel', label: 'Manajemen BBM', icon: Fuel },
    { id: 'service', label: 'Buku Servis Digital', icon: Wrench, badge: serviceBadgeCount },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 lg:w-72 bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 h-screen sticky top-0 shrink-0 z-40 select-none transition-colors">
      {/* Brand Logo Header */}
      <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-2xl bg-yellow-400 text-zinc-950 font-black shadow-md shadow-yellow-400/20">
            <span className="text-lg tracking-tighter">FL</span>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-zinc-950 rounded-full flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-ping"></div>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-base tracking-wider text-zinc-900 dark:text-white uppercase">
                Fleet<span className="text-yellow-500">Log</span>
              </span>
              <span className="px-1.5 py-0.2 bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-[10px] font-mono font-black rounded border border-zinc-200 dark:border-zinc-700">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 flex items-center gap-1 font-medium">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Vehicle & Fleet Management
            </p>
          </div>
        </div>
      </div>

      {/* AI Engine Status Pill */}
      <div className="px-4 py-3">
        <div className="p-3 bg-zinc-900 dark:bg-zinc-900 border border-zinc-800 text-white rounded-2xl flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-yellow-400 text-zinc-950">
              <Sparkles className="w-3.5 h-3.5 fill-zinc-950" />
            </div>
            <div>
              <span className="text-xs font-bold block text-white">Gemini 2.5 Flash</span>
              <span className="text-[10px] text-yellow-400 font-mono">Vision & STT Aktif</span>
            </div>
          </div>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        </div>
      </div>

      {/* Main Navigation Menu */}
      <nav className="flex-1 px-3 space-y-1.5 py-2 overflow-y-auto no-scrollbar">
        <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500 px-3 py-1 block">
          Menu Utama
        </span>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onChangeTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl transition-all font-bold text-xs cursor-pointer group ${
                isActive
                  ? 'bg-zinc-950 dark:bg-yellow-400 text-white dark:text-zinc-950 shadow-md shadow-zinc-900/10'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-xl transition-colors ${
                    isActive
                      ? 'bg-yellow-400 dark:bg-zinc-950 text-zinc-950 dark:text-yellow-400'
                      : 'bg-zinc-100 dark:bg-zinc-800 group-hover:bg-zinc-200 dark:group-hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  <Icon className="w-4 h-4 stroke-[2.4]" />
                </div>
                <span className="text-xs tracking-tight">{item.label}</span>
              </div>

              {item.badge && item.badge > 0 && (
                <span className="px-2 py-0.5 bg-yellow-400 text-zinc-950 text-[10px] font-black rounded-full font-mono shadow-xs">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User Profile Card at Bottom of Sidebar */}
      <div className="p-3 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
        <div
          onClick={onOpenProfile}
          className="p-3 bg-white dark:bg-zinc-900 hover:bg-yellow-50/50 dark:hover:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-800 hover:border-yellow-400 rounded-2xl transition cursor-pointer flex items-center justify-between shadow-xs group"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-zinc-950 dark:bg-zinc-800 text-yellow-400 flex items-center justify-center font-black text-sm">
              {profile.name.charAt(0)}
            </div>
            <div className="text-left">
              <span className="font-extrabold text-xs text-zinc-900 dark:text-white block truncate max-w-[120px]">
                {profile.name}
              </span>
              <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono flex items-center gap-1">
                <CreditCard className="w-3 h-3 text-yellow-600" />
                <span>{profile.licenses.length} SIM Terdaftar</span>
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white transition-transform group-hover:translate-x-0.5" />
        </div>
      </div>
    </aside>
  );
};
