/**
 * Theme Transition Wave Utility (Ultra-Smooth 60/120fps)
 * Radiates a smooth circular wave from the click coordinate (x, y)
 * using the native View Transitions API with zero layout thrash.
 */

export const executeThemeTransition = (
  event: React.MouseEvent | MouseEvent | undefined,
  currentTheme: 'light' | 'dark',
  applyThemeChange: (newTheme: 'light' | 'dark') => void
) => {
  const isDark = currentTheme === 'dark';
  const newTheme = isDark ? 'light' : 'dark';

  // Determine origin coordinates: prioritize exact center of the triggering button/element
  let x = window.innerWidth / 2;
  let y = window.innerHeight / 2;

  if (event) {
    const rawEvt = event as any;
    // Prefer the button/element that received the click
    const targetEl = (rawEvt.currentTarget || rawEvt.target) as HTMLElement | null;

    if (targetEl && typeof targetEl.getBoundingClientRect === 'function') {
      const rect = targetEl.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        x = Math.round(rect.left + rect.width / 2);
        y = Math.round(rect.top + rect.height / 2);
      }
    } else if (typeof rawEvt.clientX === 'number' && rawEvt.clientX > 0) {
      x = rawEvt.clientX;
      y = rawEvt.clientY;
    }
  }

  // Calculate distance to furthest screen corner for full circular reveal
  const endRadius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y)
  );

  const doc = document as any;

  // Check for native View Transitions API support
  if (doc.startViewTransition && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    // Suppress child transitions to prevent compositing thrash
    document.documentElement.classList.add('theme-transitioning');

    const transition = doc.startViewTransition(() => {
      applyThemeChange(newTheme);
      if (newTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    });

    transition.ready.then(() => {
      const clipPath = [
        `circle(0px at ${x}px ${y}px)`,
        `circle(${endRadius}px at ${x}px ${y}px)`,
      ];

      const anim = document.documentElement.animate(
        {
          clipPath,
        },
        {
          duration: 380,
          easing: 'cubic-bezier(0.2, 0, 0, 1)',
          pseudoElement: '::view-transition-new(root)',
        }
      );

      anim.onfinish = () => {
        document.documentElement.classList.remove('theme-transitioning');
      };
    }).catch(() => {
      document.documentElement.classList.remove('theme-transitioning');
    });

    transition.finished.finally(() => {
      document.documentElement.classList.remove('theme-transitioning');
    });
  } else {
    // Instant fallback
    applyThemeChange(newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
};
