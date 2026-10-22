const DB_NAME = 'FleetLogVMS_DB';
const DB_VERSION = 1;
const STORE_NAME = 'fleet_data';

// Bersihkan cache dummy lama dari browser pengguna secara otomatis (sekali saja)
if (typeof window !== 'undefined') {
  if (localStorage.getItem('vms_dummy_purged_v1') !== 'true') {
    ['vms_vehicles', 'vms_fuelLogs', 'vms_spareParts', 'vms_serviceRecords', 'vms_userProfile', 'vms_chatSessions'].forEach((k) => {
      localStorage.removeItem(k);
    });
    if (window.indexedDB) {
      try {
        indexedDB.deleteDatabase(DB_NAME);
      } catch {}
    }
    localStorage.setItem('vms_dummy_purged_v1', 'true');
  }
}

function getDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported in this environment'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Membaca data awal secara sinkron dari localStorage
 * (mencegah flickering / layar kosong saat first paint)
 */
export function loadInitialData<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const raw = localStorage.getItem(`vms_${key}`);
    if (!raw) return defaultValue;
    return JSON.parse(raw) as T;
  } catch {
    return defaultValue;
  }
}

/**
 * Menyimpan data secara persistens ganda:
 * 1. Ke localStorage (akses cepat & sinkron)
 * 2. Ke IndexedDB (kapasitas besar, standar PWA & offline-first)
 */
export async function saveToStorage<T>(key: string, value: T): Promise<void> {
  if (typeof window === 'undefined') return;

  // 1. Simpan ke localStorage
  try {
    localStorage.setItem(`vms_${key}`, JSON.stringify(value));
  } catch (err) {
    console.warn(`localStorage quota limit atau error untuk key ${key}:`, err);
  }

  // 2. Simpan ke IndexedDB
  try {
    const db = await getDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(value, key);
  } catch (err) {
    console.warn(`IndexedDB save error untuk key ${key}:`, err);
  }
}

/**
 * Membaca data dari IndexedDB (untuk sinkronisasi startup)
 */
export async function loadFromIndexedDB<T>(key: string, defaultValue: T): Promise<T> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return loadInitialData(key, defaultValue);
  }

  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => {
        if (req.result !== undefined) {
          resolve(req.result as T);
        } else {
          resolve(loadInitialData(key, defaultValue));
        }
      };
      req.onerror = () => {
        resolve(loadInitialData(key, defaultValue));
      };
    });
  } catch {
    return loadInitialData(key, defaultValue);
  }
}

/**
 * Reset data kembali ke mock data awal
 */
export async function resetAllDataToDefault(): Promise<void> {
  if (typeof window === 'undefined') return;
  const keys = ['vehicles', 'fuelLogs', 'spareParts', 'serviceRecords', 'userProfile', 'chatSessions', 'aiSettings'];
  keys.forEach((k) => localStorage.removeItem(`vms_${k}`));

  try {
    const db = await getDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).clear();
  } catch {}
}
