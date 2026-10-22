import React, { useState, useRef, useEffect } from 'react';
import { Bell, User, MoreVertical, Moon, Sun, Sparkles, ChevronRight } from 'lucide-react';
import type { UserProfile } from '../types/user';

interface HeaderProps {
  urgentCount: number;
  profile: UserProfile;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onOpenAlerts?: () => void;
  onOpenProfile?: () => void;
  onOpenAiSettings?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  urgentCount, 
  profile,
  theme,
  onToggleTheme,
  onOpenAlerts,
  onOpenProfile,
  onOpenAiSettings,
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
            <div className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-yellow-400 text-zinc-950 font-black shadow-sm animate-sparkle-loop">
              <span className="text-sm tracking-tighter">FL</span>
            </div>
            <span className="font-black text-sm tracking-wider text-zinc-900 dark:text-white uppercase">
              Fleet<span className="text-yellow-500">Log</span>
            </span>
          </div>

          {/* Desktop Breadcrumbs / Welcome Tag */}
          <div className="hidden md:flex items-center gap-2 text-xs">
            <span className="px-2.5 py-1 bg-yellow-100 dark:bg-yellow-950/60 text-zinc-900 dark:text-yellow-400 font-bold rounded-lg border border-yellow-300 dark:border-yellow-800">
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
            onClick={onOpenAlerts}
            aria-label="Peringatan Operasional"
            className="relative p-2.5 rounded-2xl bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-200/80 dark:border-zinc-800 transition cursor-pointer"
          >
            <Bell className={`w-4 h-4 ${urgentCount > 0 ? 'text-zinc-900 dark:text-yellow-400 animate-wiggle-loop' : ''}`} />
            {urgentCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 text-zinc-950 text-[10px] font-black rounded-full flex items-center justify-center shadow-xs animate-heartbeat-loop">
                {urgentCount}
              </span>
            )}
          </button>

          {/* Corner Menu: 3-Dots Button */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsCornerMenuOpen(!isCornerMenuOpen)}
              aria-label="Menu Opsi"
              className={`p-2.5 rounded-2xl border transition cursor-pointer ${
                isCornerMenuOpen
                  ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 border-zinc-900 dark:border-white shadow-sm'
                  : 'bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border-zinc-200/80 dark:border-zinc-800'
              }`}
              title="Menu Pengaturan & Profil"
            >
              <MoreVertical className="w-4 h-4" />
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
                      setIsCornerMenuOpen(false);
                      onOpenProfile?.();
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-2xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer text-left group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 group-hover:bg-yellow-400 group-hover:text-zinc-950 transition-colors">
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
                      setIsCornerMenuOpen(false);
                      onOpenAiSettings?.();
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-2xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer text-left group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 group-hover:bg-yellow-400 group-hover:text-zinc-950 transition-colors">
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
                    onClick={() => {
                      onToggleTheme();
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-2xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer text-left group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 group-hover:bg-yellow-400 group-hover:text-zinc-950 transition-colors">
                        {theme === 'dark' ? <Sun className="w-4 h-4 text-yellow-400" /> : <Moon className="w-4 h-4 text-zinc-800" />}
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
                      theme === 'dark' ? 'bg-yellow-400' : 'bg-zinc-300'
                    }`}>
                      <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                        theme === 'dark' ? 'translate-x-4 bg-zinc-950' : 'translate-x-0'
                      }`} />
                    </div>
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
