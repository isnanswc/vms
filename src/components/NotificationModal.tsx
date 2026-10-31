import React, { useState } from 'react';
import { 
  Bell, 
  X, 
  Wrench, 
  CreditCard, 
  CheckCircle2, 
  ChevronRight, 
  ShieldAlert, 
  Sparkles,
  Calendar,
  CheckCheck
} from 'lucide-react';
import { ModalPortal } from './ModalPortal';
import { triggerHaptic } from '../utils/haptics';
import type { Vehicle, SparePart } from '../types';
import type { UserProfile } from '../types/user';
import { getSystemNotifications, saveReadNotificationIds } from '../utils/notifications';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicles: Vehicle[];
  spareParts: SparePart[];
  userProfile: UserProfile;
  readIds?: string[];
  onUpdateReadIds?: (ids: string[]) => void;
  onNavigateToService?: () => void;
  onNavigateToVehicle?: (vehicleId: string) => void;
  onNavigateToProfile?: () => void;
  onNavigateToAi?: (prompt?: string) => void;
}

export type NotificationCategory = 'all' | 'service' | 'tax' | 'license';

export const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  vehicles,
  spareParts,
  userProfile,
  readIds: parentReadIds,
  onUpdateReadIds,
  onNavigateToService,
  onNavigateToVehicle,
  onNavigateToProfile,
  onNavigateToAi,
}) => {
  const [activeCategory, setActiveCategory] = useState<NotificationCategory>('all');
  const [localReadIds, setLocalReadIds] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('vms_read_notifications');
        return saved ? JSON.parse(saved) : [];
      } catch {
        return [];
      }
    }
    return [];
  });

  const readIds = parentReadIds !== undefined ? parentReadIds : localReadIds;

  if (!isOpen) return null;

  const rawItems = getSystemNotifications(vehicles, spareParts, userProfile);

  const items = rawItems.map((item) => ({
    ...item,
    onAction: () => {
      onClose();
      if (item.category === 'service') {
        onNavigateToService?.();
      } else if (item.category === 'tax') {
        if (item.vehicleId) {
          onNavigateToVehicle?.(item.vehicleId);
        } else {
          onNavigateToService?.();
        }
      } else if (item.category === 'license') {
        onNavigateToProfile?.();
      }
    },
  }));

  // Filter items
  const filteredItems = items.filter((item) => {
    if (activeCategory === 'all') return true;
    return item.category === activeCategory;
  });

  const unreadCount = items.filter((i) => !readIds.includes(i.id)).length;

  const handleMarkAllRead = () => {
    triggerHaptic('success');
    const allIds = items.map((i) => i.id);
    setLocalReadIds(allIds);
    saveReadNotificationIds(allIds);
    onUpdateReadIds?.(allIds);
  };

  const handleDismissOne = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('light');
    const updated = Array.from(new Set([...readIds, id]));
    setLocalReadIds(updated);
    saveReadNotificationIds(updated);
    onUpdateReadIds?.(updated);
  };

  const handleCloseModal = () => {
    triggerHaptic('light');
    onClose();
  };

  return (
    <ModalPortal>
      <div 
        className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-zinc-950/75 backdrop-blur-md animate-fade-in text-zinc-900 dark:text-zinc-100"
        role="dialog"
        aria-modal="true"
        aria-labelledby="notification-modal-title"
      >
        {/* Modal Container */}
        <div className="w-full max-w-2xl max-h-[88vh] bg-white dark:bg-zinc-900 border-2 border-zinc-900 dark:border-zinc-700 rounded-3xl shadow-2xl flex flex-col overflow-hidden transition-all">
          
          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-4 bg-zinc-50/60 dark:bg-zinc-900/60">
            <div className="flex items-center gap-3">
              <div className="relative p-2.5 sm:p-3 rounded-2xl bg-theme-accent text-theme-accent-fg shadow-md">
                <Bell className="w-5 h-5 stroke-[2.5]" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 text-white text-[10px] font-black rounded-full flex items-center justify-center ring-2 ring-white dark:ring-zinc-900 animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div>
                <h3 id="notification-modal-title" className="text-base sm:text-lg font-black tracking-tight uppercase text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <span>Pemberitahuan Sistem</span>
                  {unreadCount > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-theme-accent text-theme-accent-fg font-mono">
                      {unreadCount} Baru
                    </span>
                  )}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Monitoring berkala sparepart, pajak STNK, & lisensi mengemudi
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-xs font-bold text-zinc-700 dark:text-zinc-300 transition cursor-pointer"
                  title="Tandai semua sudah dibaca"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Tandai Semua Dibaca</span>
                </button>
              )}
              <button
                onClick={handleCloseModal}
                className="p-2 sm:p-2.5 rounded-2xl text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                aria-label="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 p-2 px-5 border-b border-zinc-100 dark:border-zinc-800/80 overflow-x-auto no-scrollbar bg-zinc-50/30 dark:bg-zinc-900/30 text-xs">
            <button
              onClick={() => {
                triggerHaptic('selection');
                setActiveCategory('all');
              }}
              className={`px-3.5 py-1.5 rounded-xl font-bold whitespace-nowrap transition cursor-pointer ${
                activeCategory === 'all'
                  ? 'bg-zinc-950 text-white dark:bg-theme-accent dark:text-theme-accent-fg shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              Semua ({items.length})
            </button>
            <button
              onClick={() => {
                triggerHaptic('selection');
                setActiveCategory('service');
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold whitespace-nowrap transition cursor-pointer ${
                activeCategory === 'service'
                  ? 'bg-zinc-950 text-white dark:bg-theme-accent dark:text-theme-accent-fg shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Servis & Part</span>
            </button>
            <button
              onClick={() => {
                triggerHaptic('selection');
                setActiveCategory('tax');
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold whitespace-nowrap transition cursor-pointer ${
                activeCategory === 'tax'
                  ? 'bg-zinc-950 text-white dark:bg-theme-accent dark:text-theme-accent-fg shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Pajak STNK</span>
            </button>
            <button
              onClick={() => {
                triggerHaptic('selection');
                setActiveCategory('license');
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold whitespace-nowrap transition cursor-pointer ${
                activeCategory === 'license'
                  ? 'bg-zinc-950 text-white dark:bg-theme-accent dark:text-theme-accent-fg shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>SIM Pengemudi</span>
            </button>
          </div>

          {/* Notification List Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 no-scrollbar">
            {filteredItems.length === 0 ? (
              <div className="py-12 px-4 text-center space-y-3">
                <div className="w-14 h-14 mx-auto rounded-3xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center ring-8 ring-emerald-50 dark:ring-emerald-950/20">
                  <CheckCircle2 className="w-7 h-7 stroke-[2]" />
                </div>
                <h4 className="font-black text-sm text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                  Semua Dokumen & Armada Terkendali
                </h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto leading-relaxed">
                  Tidak ada sparepart kritis, tagihan pajak mendesak, atau masa berlaku lisensi yang perlu perhatian saat ini.
                </p>
              </div>
            ) : (
              filteredItems.map((item) => {
                const isRead = readIds.includes(item.id);
                const isCrit = item.urgency === 'critical';

                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      triggerHaptic('light');
                      item.onAction();
                    }}
                    className={`group relative p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isRead
                        ? 'bg-zinc-50/70 dark:bg-zinc-800/40 border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 opacity-80'
                        : isCrit
                          ? 'bg-red-50/60 dark:bg-red-950/25 border-red-300 dark:border-red-800/80 text-zinc-900 dark:text-zinc-100 shadow-xs'
                          : 'bg-amber-50/60 dark:bg-amber-950/25 border-amber-300 dark:border-amber-800/80 text-zinc-900 dark:text-zinc-100 shadow-xs'
                    } hover:border-zinc-400 dark:hover:border-zinc-600`}
                  >
                    <div className="flex items-start gap-3.5">
                      <div className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                        isCrit
                          ? 'bg-red-500 text-white shadow-sm'
                          : 'bg-amber-500 text-white shadow-sm'
                      }`}>
                        {item.category === 'service' ? (
                          <Wrench className="w-4 h-4" />
                        ) : item.category === 'tax' ? (
                          <ShieldAlert className="w-4 h-4" />
                        ) : (
                          <CreditCard className="w-4 h-4" />
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            isCrit
                              ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-800'
                              : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                          }`}>
                            {isCrit ? 'Perlu Tindakan' : 'Peringatan'}
                          </span>
                          <span className="text-[11px] font-mono text-zinc-400 dark:text-zinc-500">
                            • {item.timestamp}
                          </span>
                          {!isRead && (
                            <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                          )}
                        </div>

                        <h4 className="text-xs sm:text-sm font-extrabold text-zinc-900 dark:text-zinc-100">
                          {item.title}
                        </h4>

                        <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-lg">
                          {item.description}
                        </p>
                      </div>
                    </div>

                    {/* Action Pill on Right */}
                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0 pt-2 sm:pt-0">
                      <button
                        type="button"
                        onClick={(e) => handleDismissOne(item.id, e)}
                        className="text-[11px] font-bold text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 px-2 py-1 rounded-lg hover:bg-zinc-200/60 dark:hover:bg-zinc-700/60 transition"
                      >
                        {isRead ? 'Sudah Dibaca' : 'Abaikan'}
                      </button>

                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-950 dark:bg-theme-accent text-white dark:text-theme-accent-fg text-xs font-black shadow-xs group-hover:scale-105 transition-transform">
                        <span>{item.actionLabel}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Bar: AI Assistant Advice shortcut */}
          <div className="p-4 sm:p-5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/90 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
              <Sparkles className="w-4 h-4 text-theme-accent" />
              <span>Butuh rekomendasi bengkel atau perhitungan anggaran?</span>
            </div>

            <button
              onClick={() => {
                triggerHaptic('medium');
                onClose();
                onNavigateToAi?.('Tolong rangkum semua peringatan armada saya saat ini dan berikan prioritas tindakan yang paling efisien.');
              }}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-yellow-400 hover:bg-yellow-300 text-zinc-950 font-black rounded-xl transition shadow-xs cursor-pointer active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 fill-zinc-950" />
              <span>Konsultasikan ke Fleet AI</span>
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};
