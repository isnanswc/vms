import React, { useState, useRef, useEffect } from 'react';
import { Bell, User, MoreVertical, Moon, Sun, Sparkles, ChevronRight, Palette } from 'lucide-react';
import type { UserProfile } from '../types/user';
import { triggerHaptic } from '../utils/haptics';
import appLogo from '../assets/app-logo.png';

interface HeaderProps {
  urgentCount: number;
  profile: UserProfile;
  theme: 'light' | 'dark';
  onToggleTheme: (e?: React.MouseEvent) => void;
  onOpenAlerts?: () => void;
  onOpenProfile?: () => void;
  onOpenAiSettings?: () => void;
  onOpenThemeAccent?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  urgentCount, 
  profile,
  theme,
  onToggleTheme,
  onOpenAlerts,
  onOpenProfile,
  onOpenAiSettings,
  onOpenThemeAccent,
}) => {
  const [isCornerMenuOpen, setIsCornerMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close corner menu on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsCornerMenuOpen(false);
      }
    };
    if (isCornerMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCornerMenuOpen]);

  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 px-4 md:px-8 py-3.5 shadow-xs transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Left: Mobile Brand / Desktop Title */}
        <div className="flex items-center gap-3">
          {/* Mobile Only Logo */}
          <div className="flex md:hidden items-center gap-2">
            <div className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-white border border-zinc-200 dark:border-zinc-800 p-0.5 shadow-sm overflow-hidden shrink-0">
              <img 
                src={appLogo} 
                alt="FleetLog" 
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.currentTarget.src = `${import.meta.env.BASE_URL}app-logo.png`;
                }}
              />
            </div>
            <span className="font-black text-sm tracking-wider text-zinc-900 dark:text-white uppercase">
              Fleet<span className="text-theme-accent">Log</span>
            </span>
          </div>

          {/* Desktop Breadcrumbs / Welcome Tag */}
          <div className="hidden md:flex items-center gap-2 text-xs">
            <span className="px-2.5 py-1 bg-theme-accent-subtle text-zinc-900 dark:text-zinc-100 font-bold rounded-lg border border-theme-accent-border">
              Workspace Aktif
            </span>
            <span className="text-zinc-400 dark:text-zinc-600">•</span>
            <span className="font-extrabold text-zinc-800 dark:text-zinc-200">
              Fleet & Asset Management Console
            </span>
          </div>
        </div>

        {/* Right Action Icons: Bell on the left of 3-dots */}
        <div className="flex items-center gap-2">
          {/* Urgent Notification Bell */}
          <button
            onClick={() => {
              triggerHaptic('light');
              onOpenAlerts?.();
            }}
            aria-label="Peringatan Operasional"
            className="relative p-2.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800/90 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 transition cursor-pointer active:scale-95 shadow-xs"
          >
            <Bell className={`w-4.5 h-4.5 stroke-[2.2] ${urgentCount > 0 ? 'text-theme-accent animate-wiggle-loop' : 'text-zinc-800 dark:text-zinc-100'}`} />
            {urgentCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4.5 h-4.5 bg-theme-accent text-theme-accent-fg text-[10px] font-black rounded-full flex items-center justify-center shadow-xs animate-heartbeat-loop">
                {urgentCount}
              </span>
            )}
          </button>

          {/* Corner Menu: 3-Dots Button */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => {
                triggerHaptic('light');
                setIsCornerMenuOpen(!isCornerMenuOpen);
              }}
              aria-label="Menu Opsi"
              className={`p-2.5 rounded-2xl border transition cursor-pointer active:scale-95 ${
                isCornerMenuOpen
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 border-zinc-900 dark:border-white shadow-sm'
                  : 'bg-zinc-100 dark:bg-zinc-800/90 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700'
              }`}
              title="Menu Pengaturan & Profil"
            >
              <MoreVertical className="w-4.5 h-4.5 stroke-[2.2]" />
            </button>

            {/* Corner Dropdown Popover */}
            {isCornerMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-zinc-900 border-2 border-zinc-900 dark:border-zinc-700 rounded-3xl p-2 shadow-2xl z-50 animate-fade-in text-zinc-900 dark:text-zinc-100">
                {/* User quick tag header */}
                <div className="px-3.5 py-3 border-b border-zinc-100 dark:border-zinc-800 mb-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500 block">
                    Akun Aktif
                  </span>
                  <p className="font-extrabold text-xs text-zinc-900 dark:text-zinc-100 truncate mt-0.5">
                    {profile.name}
                  </p>
                  <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 truncate block">
                    {profile.email}
                  </span>
                </div>

                <div className="space-y-1 text-xs font-bold">
                  {/* Option 1: Kelola Profil */}
                  <button
                    onClick={() => {
                      triggerHaptic('light');
                      setIsCornerMenuOpen(false);
                      onOpenProfile?.();
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-2xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer text-left group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 group-hover:bg-theme-accent group-hover:text-theme-accent-fg transition-colors">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="block text-zinc-900 dark:text-zinc-100">Kelola Profil</span>
                        <span className="text-[10px] font-normal text-zinc-400 dark:text-zinc-500">
                          Data profil & {profile.licenses.length} SIM
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-400" />
                  </button>

                  {/* Option 2: Kelola AI */}
                  <button
                    onClick={() => {
                      triggerHaptic('light');
                      setIsCornerMenuOpen(false);
                      onOpenAiSettings?.();
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-2xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer text-left group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 group-hover:bg-theme-accent group-hover:text-theme-accent-fg transition-colors">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="block text-zinc-900 dark:text-zinc-100">Kelola AI</span>
                        <span className="text-[10px] font-normal text-zinc-400 dark:text-zinc-500">
                          API Key & 3 Slot Fallback
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-400" />
                  </button>

                  {/* Option 3: Mode Malam Toggle */}
                  <button
                    onClick={(e) => {
                      triggerHaptic('medium');
                      onToggleTheme(e);
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-2xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer text-left group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 group-hover:bg-theme-accent group-hover:text-theme-accent-fg transition-colors">
                        {theme === 'dark' ? <Sun className="w-4 h-4 text-theme-accent" /> : <Moon className="w-4 h-4 text-zinc-800 dark:text-zinc-200" />}
                      </div>
                      <div>
                        <span className="block text-zinc-900 dark:text-zinc-100">
                          {theme === 'dark' ? 'Mode Terang' : 'Mode Malam'}
                        </span>
                        <span className="text-[10px] font-normal text-zinc-400 dark:text-zinc-500">
                          {theme === 'dark' ? 'Tema Gelap Aktif' : 'Tema Terang Aktif'}
                        </span>
                      </div>
                    </div>

                    {/* Interactive Switch Pill */}
                    <div className={`w-9 h-5 rounded-full p-0.5 transition-colors ${
                      theme === 'dark' ? 'bg-theme-accent' : 'bg-zinc-300 dark:bg-zinc-700'
                    }`}>
                      <div className={`w-4 h-4 rounded-full transition-transform ${
                        theme === 'dark' ? 'translate-x-4 bg-zinc-950' : 'translate-x-0 bg-white'
                      }`} />
                    </div>
                  </button>

                  {/* Option 4: Ganti Aksen Warna */}
                  <button
                    onClick={() => {
                      triggerHaptic('light');
                      setIsCornerMenuOpen(false);
                      onOpenThemeAccent?.();
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-2xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer text-left group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 group-hover:bg-vms-accent transition-colors">
                        <Palette className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="block text-zinc-900 dark:text-zinc-100">Warna Aksen Tema</span>
                        <span className="text-[10px] font-normal text-zinc-400 dark:text-zinc-500">
                          9 Pilihan Warna Estetik
                        </span>
                      </div>
                    </div>
                    <div className="w-4 h-4 rounded-full bg-vms-accent shadow-xs border border-zinc-300 dark:border-zinc-700" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
