import React from 'react';
import { Bell, User, Sparkles } from 'lucide-react';
import type { UserProfile } from '../types/user';

interface HeaderProps {
  urgentCount: number;
  profile: UserProfile;
  onOpenAlerts?: () => void;
  onOpenProfile?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  urgentCount, 
  profile,
  onOpenAlerts,
  onOpenProfile,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-zinc-200 px-4 md:px-8 py-3.5 shadow-xs">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Left: Mobile Brand / Desktop Title */}
        <div className="flex items-center gap-3">
          {/* Mobile Only Logo */}
          <div className="flex md:hidden items-center gap-2">
            <div className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-yellow-400 text-zinc-950 font-black shadow-sm">
              <span className="text-sm tracking-tighter">FL</span>
            </div>
            <span className="font-black text-sm tracking-wider text-zinc-900 uppercase">
              Fleet<span className="text-yellow-500">Log</span>
            </span>
          </div>

          {/* Desktop Breadcrumbs / Welcome Tag */}
          <div className="hidden md:flex items-center gap-2 text-xs">
            <span className="px-2.5 py-1 bg-yellow-100 text-zinc-900 font-bold rounded-lg border border-yellow-300">
              Workspace Aktif
            </span>
            <span className="text-zinc-400">•</span>
            <span className="font-extrabold text-zinc-800">
              Fleet & Asset Management Console
            </span>
          </div>
        </div>

        {/* Right Action Icons */}
        <div className="flex items-center gap-2.5">
          {/* Profil Button (Visible on mobile & desktop header) */}
          <button
            onClick={onOpenProfile}
            className="flex items-center gap-2 px-3 py-1.5 bg-zinc-100 hover:bg-yellow-100 border border-zinc-200 hover:border-yellow-400 rounded-full text-xs text-zinc-800 transition cursor-pointer group"
            title="Kelola Akun Profil & SIM"
          >
            <div className="w-5 h-5 rounded-full bg-zinc-950 text-white flex items-center justify-center text-[10px] font-bold group-hover:bg-yellow-400 group-hover:text-zinc-950 transition-colors">
              <User className="w-3 h-3" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-[11px] text-zinc-900">{profile.name}</span>
              <span className="hidden sm:inline px-1.5 py-0.2 bg-zinc-200 text-zinc-700 text-[9px] font-mono font-bold rounded-full">
                {profile.licenses.length} SIM
              </span>
            </div>
          </button>

          {/* Urgent Notification Bell */}
          <button
            onClick={onOpenAlerts}
            aria-label="Peringatan Operasional"
            className="relative p-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            {urgentCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 text-zinc-950 text-[10px] font-black rounded-full flex items-center justify-center shadow-xs">
                {urgentCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
