import type { Vehicle, OdometerLog, TripLog, FuelLog } from '../types';
import { sendBrowserNotification } from './webPush';

const STORAGE_LAST_REMINDER_DATE = 'vms_odometer_reminder_sent_date';

/**
 * Mendapatkan string tanggal hari ini (YYYY-MM-DD) berdasarkan waktu lokal
 */
export const getTodayDateString = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Mengecek apakah jam saat ini berada di jam Primetime malam (Jam 18:00 - 21:59 / 6 - 9 malam)
 */
export const isPrimetimeNow = (): boolean => {
  const currentHour = new Date().getHours();
  return currentHour >= 18 && currentHour <= 21;
};

/**
 * Mengecek apakah sudah ada pembaruan spedometer hari ini
 * (baik lewat catat spedometer manual, AI scan, trip logbook, ataupun pengisian BBM)
 */
export const hasOdometerUpdatedToday = (
  vehicleId: string | 'all',
  odometerLogs: OdometerLog[],
  tripLogs: TripLog[],
  fuelLogs: FuelLog[]
): boolean => {
  const today = getTodayDateString();

  const matchVeh = (id: string) => vehicleId === 'all' || id === vehicleId;

  const hasOdoLog = odometerLogs.some((l) => matchVeh(l.vehicleId) && l.date === today);
  if (hasOdoLog) return true;

  const hasTripLog = tripLogs.some((t) => matchVeh(t.vehicleId) && t.date === today);
  if (hasTripLog) return true;

  const hasFuelLog = fuelLogs.some((f) => matchVeh(f.vehicleId) && f.date === today);
  if (hasFuelLog) return true;

  return false;
};

/**
 * Fungsi pemeriksaan harian otomatis:
 * Jika di hari ini belum ada pembaruan spedometer dan sekarang jam Primetime (18:00 - 21:00),
 * kirimkan notifikasi 1 kali sehari ke perangkat.
 */
export const checkAndTriggerOdometerReminder = async (
  vehicles: Vehicle[],
  odometerLogs: OdometerLog[],
  tripLogs: TripLog[],
  fuelLogs: FuelLog[]
): Promise<boolean> => {
  if (typeof window === 'undefined' || vehicles.length === 0) return false;

  const today = getTodayDateString();

  // 1. Cek apakah sudah dikirim hari ini
  const lastSentDate = localStorage.getItem(STORAGE_LAST_REMINDER_DATE);
  if (lastSentDate === today) {
    return false; // Sudah diingatkan hari ini
  }

  // 2. Cek apakah saat ini jam primetime (18:00 - 21:00)
  if (!isPrimetimeNow()) {
    return false;
  }

  // 3. Cek apakah ada pembaruan spedometer hari ini
  const isUpdated = hasOdometerUpdatedToday('all', odometerLogs, tripLogs, fuelLogs);
  if (isUpdated) {
    return false; // Sudah diupdate, tidak perlu diingatkan
  }

  // 4. Kirim notifikasi primetime
  try {
    const res = await sendBrowserNotification('Pengingat Spedometer Malam 🛵', {
      body: 'Spedometer armada belum diperbarui hari ini. Yuk catat angka KM malam ini agar riwayat servis & bahan bakar tetap presisi!',
      tag: `vms-odometer-primetime-${today}`,
    });

    if (res.success) {
      localStorage.setItem(STORAGE_LAST_REMINDER_DATE, today);
      return true;
    }
    return false;
  } catch (err) {
    console.warn('Gagal memicu pengingat spedometer primetime:', err);
    return false;
  }
};

/**
 * Uji coba pengingat primetime secara langsung (untuk tombol demo / verifikasi)
 */
export const sendTestPrimetimeReminder = async (): Promise<{ success: boolean; message: string }> => {
  return await sendBrowserNotification('Uji Pengingat Spedometer Primetime (Demo) 🛵', {
    body: 'Spedometer armada belum diperbarui hari ini. Yuk catat angka KM malam ini agar kondisi suku cadang tetap terpantau akurat!',
    tag: `vms-odometer-demo-${Date.now()}`,
  });
};
