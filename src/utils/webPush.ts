/**
 * Web Push & Browser Notification Helper for VMS FleetLog
 * Handles permission requests, status checks, and local system notifications.
 */

export interface NotificationStatus {
  isSupported: boolean;
  permission: NotificationPermission; // 'default' | 'granted' | 'denied'
}

export const checkNotificationSupport = (): NotificationStatus => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return { isSupported: false, permission: 'denied' };
  }
  return {
    isSupported: true,
    permission: Notification.permission,
  };
};

export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.error('Failed to request notification permission:', err);
    return 'denied';
  }
};

export const sendBrowserNotification = (
  title: string,
  options?: {
    body?: string;
    icon?: string;
    badge?: string;
    tag?: string;
    data?: any;
  }
): boolean => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  if (Notification.permission !== 'granted') {
    return false;
  }

  try {
    const n = new Notification(title, {
      body: options?.body || 'Pemberitahuan Armada VMS FleetLog',
      icon: options?.icon || '/app-logo.png',
      badge: options?.badge || '/app-logo.png',
      tag: options?.tag || `vms-${Date.now()}`,
    });

    n.onclick = () => {
      window.focus();
      n.close();
    };

    return true;
  } catch (err) {
    console.error('Error dispatching browser notification:', err);
    return false;
  }
};
