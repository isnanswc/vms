/**
 * Theme Transition Wave Utility
 * Creates a circular wave reveal radiating from the click coordinates (x, y)
 * using the View Transitions API and a visual expanding shockwave ring.
 */

export const executeThemeTransition = (
  event: React.MouseEvent | MouseEvent | undefined,
  currentTheme: 'light' | 'dark',
  applyThemeChange: (newTheme: 'light' | 'dark') => void
) => {
  const isDark = currentTheme === 'dark';
  const newTheme = isDark ? 'light' : 'dark';

  // Determine origin coordinates
  let x = window.innerWidth / 2;
  let y = window.innerHeight / 2;

  if (event && 'clientX' in event && event.clientX !== undefined) {
    x = event.clientX;
    y = event.clientY;
  }

  // Calculate distance to furthest corner for full screen coverage
  const endRadius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y)
  );

  // Spawn visual shockwave ripple element
  createShockwaveRipple(x, y, endRadius, newTheme);

  // Check for View Transitions API support
  const doc = document as any;
  if (doc.startViewTransition && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
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

      document.documentElement.animate(
        {
          clipPath,
        },
        {
          duration: 650,
          easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
          pseudoElement: '::view-transition-new(root)',
        }
      );
    });
  } else {
    // Graceful fallback for non-supporting browsers
    applyThemeChange(newTheme);
  }
};

/**
 * Creates an expanding visual luminous shockwave ring at (x, y)
 */
function createShockwaveRipple(
  x: number,
  y: number,
  endRadius: number,
  targetTheme: 'light' | 'dark'
) {
  if (typeof document === 'undefined') return;

  const ripple = document.createElement('div');
  const size = endRadius * 2.2;

  ripple.style.position = 'fixed';
  ripple.style.left = `${x}px`;
  ripple.style.top = `${y}px`;
  ripple.style.width = `${size}px`;
  ripple.style.height = `${size}px`;
  ripple.style.borderRadius = '50%';
  ripple.style.pointerEvents = 'none';
  ripple.style.zIndex = '999999';
  ripple.style.transform = 'translate(-50%, -50%) scale(0)';
  ripple.style.transition = 'transform 0.65s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.65s ease-out';
  ripple.style.opacity = '0.9';

  // Luminous wave glow styling depending on target mode
  if (targetTheme === 'dark') {
    ripple.style.boxShadow = '0 0 45px 15px rgba(250, 204, 21, 0.6), inset 0 0 30px 10px rgba(255, 255, 255, 0.4)';
    ripple.style.border = '2.5px solid rgba(250, 204, 21, 0.85)';
    ripple.style.background = 'radial-gradient(circle, rgba(9, 9, 11, 0.15) 60%, rgba(250, 204, 21, 0.25) 90%, rgba(255, 255, 255, 0.6) 100%)';
  } else {
    ripple.style.boxShadow = '0 0 45px 15px rgba(255, 255, 255, 0.8), inset 0 0 30px 10px rgba(250, 204, 21, 0.4)';
    ripple.style.border = '2.5px solid rgba(255, 255, 255, 0.95)';
    ripple.style.background = 'radial-gradient(circle, rgba(255, 255, 255, 0.2) 60%, rgba(250, 204, 21, 0.2) 90%, rgba(255, 255, 255, 0.8) 100%)';
  }

  document.body.appendChild(ripple);

  // Trigger animation next frame
  requestAnimationFrame(() => {
    ripple.style.transform = 'translate(-50%, -50%) scale(1)';
    ripple.style.opacity = '0';
  });

  // Remove element after transition completes
  setTimeout(() => {
    ripple.remove();
  }, 750);
}
