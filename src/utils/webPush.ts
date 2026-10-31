/**
 * Web Push & Browser Notification Helper for VMS FleetLog
 * Handles permission requests, status checks, Service Worker showNotification, and desktop fallback.
 */

export interface NotificationStatus {
  isSupported: boolean;
  permission: NotificationPermission; // 'default' | 'granted' | 'denied'
  isSecureContext: boolean;
  isIOS: boolean;
  isStandalone: boolean;
  notes?: string;
}

export interface SendNotificationResult {
  success: boolean;
  method?: 'serviceworker' | 'desktop';
  message: string;
  error?: string;
}

/**
 * Memeriksa kapabilitas browser untuk notifikasi
 */
export const checkNotificationSupport = (): NotificationStatus => {
  if (typeof window === 'undefined') {
    return {
      isSupported: false,
      permission: 'denied',
      isSecureContext: false,
      isIOS: false,
      isStandalone: false,
    };
  }

  // Cek apakah konteks aman (HTTPS atau localhost)
  const isSecure = window.isSecureContext ?? (
    window.location.protocol === 'https:' ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
  );

  const ua = navigator.userAgent || '';
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || Boolean((navigator as any).standalone);
  const hasNotif = 'Notification' in window;

  let permission: NotificationPermission = 'default';
  if (hasNotif) {
    permission = Notification.permission;
  }

  let notes: string | undefined = undefined;
  if (!isSecure) {
    notes = 'Koneksi bukan HTTPS/localhost. Browser memblokir notifikasi sistem pada HTTP biasa.';
  } else if (isIOS && !isStandalone) {
    notes = 'Di iOS/iPhone Safari, silakan "Tambah ke Layar Utama" (PWA) terlebih dahulu agar notifikasi dapat diizinkan.';
  } else if (permission === 'denied') {
    notes = 'Izin notifikasi diblokir. Buka setelan browser di ikon gembok address bar lalu ubah izin ke "Izinkan".';
  }

  return {
    isSupported: hasNotif || (isIOS && isStandalone),
    permission,
    isSecureContext: isSecure,
    isIOS,
    isStandalone,
    notes,
  };
};

/**
 * Meminta izin notifikasi ke browser
 */
export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }

  try {
    // Standard modern Promise API
    const permission = await Notification.requestPermission();
    return permission;
  } catch {
    // Fallback untuk browser versi terdahulu yang menggunakan callback
    return new Promise((resolve) => {
      try {
        Notification.requestPermission((p) => resolve(p));
      } catch {
        resolve('denied');
      }
    });
  }
};

/**
 * Mengirim notifikasi sistem browser ke perangkat
 * Mengutamakan ServiceWorker showNotification (Wajib untuk Chrome Android & mobile PWA)
 * dengan fallback ke desktop window.Notification constructor.
 */
export const sendBrowserNotification = async (
  title: string,
  options?: {
    body?: string;
    icon?: string;
    badge?: string;
    tag?: string;
    data?: any;
  }
): Promise<SendNotificationResult> => {
  if (typeof window === 'undefined') {
    return { success: false, message: 'Window tidak tersedia', error: 'No window' };
  }

  const status = checkNotificationSupport();

  if (!status.isSecureContext) {
    return {
      success: false,
      message: 'Peramban memblokir notifikasi pada koneksi HTTP biasa. Gunakan HTTPS atau localhost.',
      error: 'Insecure context',
    };
  }

  if (status.isIOS && !status.isStandalone) {
    return {
      success: false,
      message: 'Di iOS Safari, silakan pasang ke Layar Utama (PWA) terlebih dahulu via tombol Bagikan.',
      error: 'iOS requires standalone PWA',
    };
  }

  if (!('Notification' in window)) {
    return {
      success: false,
      message: 'Peramban ini tidak mendukung Web Notification API.',
      error: 'Notification API not supported',
    };
  }

  // Jika izin masih default, minta izin sekarang
  let perm = Notification.permission;
  if (perm === 'default') {
    perm = await requestNotificationPermission();
  }

  if (perm !== 'granted') {
    return {
      success: false,
      message: perm === 'denied' 
        ? 'Izin notifikasi diblokir di setelan browser. Buka setelan situs/ikon gembok pada address bar untuk mengizinkan.' 
        : 'Izin notifikasi belum disetujui.',
      error: `Permission is ${perm}`,
    };
  }

  // Tentukan path gambar yang selalu berbentuk URL absolut (wajib untuk Windows Action Center & Android)
  const baseUrl = import.meta.env.BASE_URL || '/';
  const cleanBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  const origin = window.location.origin;

  const iconUrl = options?.icon 
    ? (options.icon.startsWith('http') ? options.icon : new URL(options.icon, window.location.href).href)
    : new URL(`${cleanBase}app-logo.png`, origin).href;

  const badgeUrl = options?.badge 
    ? (options.badge.startsWith('http') ? options.badge : new URL(options.badge, window.location.href).href)
    : new URL(`${cleanBase}favicon.png`, origin).href;

  const tag = options?.tag || `vms-${Date.now()}`;

  const notifOptions: NotificationOptions = {
    body: options?.body || 'Pemberitahuan Armada VMS FleetLog',
    icon: iconUrl,
    badge: badgeUrl,
    tag: tag,
    data: options?.data,
    // Pola getar untuk HP Android [getar, jeda, getar]
    ...({ vibrate: [200, 100, 200] } as any),
  };

  // METODE 1: Service Worker showNotification
  // PENTING: Pada Chrome Android & PWA seluler, 'new Notification()' dilarang dan menimbulkan 'Illegal constructor'.
  // Menampilkan notifikasi wajib melalui registration.showNotification().
  if ('serviceWorker' in navigator) {
    try {
      let reg: ServiceWorkerRegistration | undefined = await navigator.serviceWorker.getRegistration();
      if (!reg) {
        reg = await navigator.serviceWorker.register(`${cleanBase}sw.js`);
      }

      // Tunggu hingga service worker siap / active
      if (reg.installing) {
        await new Promise<void>((resolve) => {
          reg!.installing!.addEventListener('statechange', function onState() {
            if (this.state === 'activated' || this.state === 'redundant') {
              resolve();
            }
          });
          setTimeout(resolve, 1200);
        });
      }

      const activeReg = await navigator.serviceWorker.ready.catch(() => reg);

      if (activeReg && typeof activeReg.showNotification === 'function') {
        await activeReg.showNotification(title, notifOptions);
        return {
          success: true,
          method: 'serviceworker',
          message: 'Notifikasi berhasil dikirim melalui Service Worker!',
        };
      }
    } catch (swErr: any) {
      console.warn('Service Worker showNotification gagal, beralih ke fallback desktop:', swErr);
    }
  }

  // METODE 2: Fallback Desktop constructor
  try {
    const n = new Notification(title, notifOptions);
    n.onclick = () => {
      window.focus();
      n.close();
    };
    return {
      success: true,
      method: 'desktop',
      message: 'Notifikasi berhasil dikirim ke layar Anda!',
    };
  } catch (notifErr: any) {
    console.error('Desktop Notification error:', notifErr);
    const msg = notifErr?.message || String(notifErr);
    return {
      success: false,
      error: msg,
      message: `Gagal memunculkan notifikasi sistem: ${msg}. Jika menggunakan Chrome Android, pastikan Service Worker aktif.`,
    };
  }
};
