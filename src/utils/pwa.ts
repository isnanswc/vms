/**
 * PWA Helper & Installation Manager for FleetLog
 */

export type DevicePlatform = 'ios' | 'android' | 'desktop';

// Simpan event instalasi native browser
let deferredInstallPrompt: any = null;

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    // Mencegah prompt mini-infobar default browser agar UI custom kita yang menangani
    e.preventDefault();
    deferredInstallPrompt = e;
    window.dispatchEvent(new CustomEvent('pwa-install-ready'));
  });

  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    window.dispatchEvent(new CustomEvent('pwa-installed'));
  });
}

/**
 * Cek apakah aplikasi saat ini berjalan dalam mode Standalone PWA (sudah terinstal)
 */
export const isPwaStandalone = (): boolean => {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    Boolean((window.navigator as any).standalone) ||
    document.referrer.includes('android-app://')
  );
};

/**
 * Deteksi platform perangkat (iOS, Android, atau Desktop)
 */
export const getDevicePlatform = (): DevicePlatform => {
  if (typeof window === 'undefined') return 'desktop';
  const ua = navigator.userAgent || '';
  if (/iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) {
    return 'ios';
  }
  if (/android/i.test(ua)) {
    return 'android';
  }
  return 'desktop';
};

/**
 * Memicu dialog instalasi PWA native
 */
export const triggerPwaInstall = async (): Promise<'accepted' | 'dismissed' | 'manual'> => {
  if (deferredInstallPrompt) {
    try {
      deferredInstallPrompt.prompt();
      const choice = await deferredInstallPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        deferredInstallPrompt = null;
      }
      return choice.outcome;
    } catch (err) {
      console.warn('Gagal memicu install prompt native:', err);
      return 'manual';
    }
  }
  return 'manual';
};

export const hasDeferredPrompt = (): boolean => {
  return Boolean(deferredInstallPrompt);
};
