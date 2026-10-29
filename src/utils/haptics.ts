/**
 * Haptic Vibration Feedback Utility
 * Provides subtle tactile vibration for supported mobile/touch devices.
 */
export type HapticStyle = 'light' | 'medium' | 'heavy' | 'selection' | 'success' | 'warning';

export const triggerHaptic = (style: HapticStyle = 'light'): void => {
  if (typeof window === 'undefined' || !('vibrate' in navigator)) {
    return;
  }

  try {
    switch (style) {
      case 'selection':
        navigator.vibrate(10);
        break;
      case 'light':
        navigator.vibrate(18);
        break;
      case 'medium':
        navigator.vibrate(35);
        break;
      case 'heavy':
        navigator.vibrate([45, 30, 45]);
        break;
      case 'success':
        navigator.vibrate([15, 40, 25]);
        break;
      case 'warning':
        navigator.vibrate([30, 30, 60]);
        break;
      default:
        navigator.vibrate(18);
    }
  } catch {
    // Graceful fallback if permission or platform disallows
  }
};
