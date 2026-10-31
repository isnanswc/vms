import type { Vehicle, SparePart } from '../types';
import type { UserProfile } from '../types/user';

export interface SystemNotificationItem {
  id: string;
  category: 'service' | 'tax' | 'license';
  title: string;
  description: string;
  urgency: 'critical' | 'warning' | 'info';
  daysLeft?: number;
  actionLabel: string;
  vehicleId?: string;
  timestamp: string;
}

/**
 * Computes all current actionable system notifications:
 * - Critical & warning spare parts
 * - STNK annual tax expirations within 60 days
 * - Driver licenses (SIM) expirations within 60 days
 */
export const getSystemNotifications = (
  vehicles: Vehicle[],
  spareParts: SparePart[],
  userProfile?: UserProfile
): SystemNotificationItem[] => {
  const items: SystemNotificationItem[] = [];
  const today = new Date();

  const getDaysDiff = (dateStr?: string) => {
    if (!dateStr) return 999;
    const target = new Date(dateStr);
    const diff = target.getTime() - today.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  // 1. Critical & Warning Spare Parts
  spareParts.forEach((part) => {
    if (part.status === 'critical' || part.status === 'warning') {
      const veh = vehicles.find((v) => v.id === part.vehicleId);
      const isCrit = part.status === 'critical';
      items.push({
        id: `part-${part.id}`,
        category: 'service',
        urgency: isCrit ? 'critical' : 'warning',
        title: `${isCrit ? 'Penggantian Mendesak' : 'Perhatian Servis'}: ${part.name}`,
        description: `${veh ? veh.name + ' (' + veh.plateNumber + ')' : 'Armada'} — Sisa masa pakai ${part.estimatedLifeRemainingPct}%. Rekomendasi servis tiap ${part.recommendedIntervalKm.toLocaleString('id-ID')} KM.`,
        actionLabel: 'Buka Buku Servis',
        vehicleId: part.vehicleId,
        timestamp: isCrit ? 'Perlu tindakan hari ini' : 'Dalam minggu ini',
      });
    }
  });

  // 2. Tax / STNK Expiry
  vehicles.forEach((veh) => {
    if (veh.stnkExpiryDate) {
      const days = getDaysDiff(veh.stnkExpiryDate);
      if (days <= 60) {
        const isUrgent = days <= 14;
        items.push({
          id: `tax-annual-${veh.id}`,
          category: 'tax',
          urgency: isUrgent ? 'critical' : 'warning',
          daysLeft: days,
          title: `Pajak Tahunan STNK: ${veh.plateNumber}`,
          description: `${veh.name} — Jatuh tempo pada ${new Date(veh.stnkExpiryDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} (${days > 0 ? `${days} hari lagi` : 'Sudah lewat!'}).`,
          actionLabel: 'Kelola Pajak',
          vehicleId: veh.id,
          timestamp: days <= 0 ? 'Kedaluwarsa' : `${days} hari lagi`,
        });
      }
    }
  });

  // 3. Driver Licenses (SIM) Expiry
  (userProfile?.licenses || []).forEach((sim) => {
    const days = getDaysDiff(sim.expiryDate);
    if (days <= 60) {
      const isUrgent = days <= 14;
      items.push({
        id: `sim-${sim.id}`,
        category: 'license',
        urgency: isUrgent ? 'critical' : 'warning',
        daysLeft: days,
        title: `Masa Berlaku ${sim.simType}`,
        description: `No. ${sim.simNumber} a.n. ${sim.holderName} — Berakhir ${new Date(sim.expiryDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}.`,
        actionLabel: 'Lihat Data SIM',
        timestamp: days <= 0 ? 'Kedaluwarsa' : `${days} hari lagi`,
      });
    }
  });

  return items;
};

export const getReadNotificationIds = (): string[] => {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem('vms_read_notifications');
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

export const saveReadNotificationIds = (ids: string[]): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('vms_read_notifications', JSON.stringify(ids));
  } catch {
    // ignore
  }
};
