/**
 * Application Accent Theme Configuration & Persistence
 * Allows dynamic customization of the primary accent color across the app.
 * Synchronizes selected theme accent with Android notification bar (status bar) & Android navbar.
 */

export type AccentColorId = 
  | 'yellow' 
  | 'red' 
  | 'blue' 
  | 'silver' 
  | 'black' 
  | 'green' 
  | 'cyan' 
  | 'purple' 
  | 'orange';

export interface AccentColorPreset {
  id: AccentColorId;
  name: string;
  tagline: string;
  primaryHex: string;
  ringHex: string;
  previewBg: string;
  dotClass: string;
}

export const ACCENT_PRESETS: AccentColorPreset[] = [
  {
    id: 'yellow',
    name: 'Kuning Amber',
    tagline: 'Warna standar armada VMS yang kontras dan berenergi',
    primaryHex: '#facc15',
    ringHex: 'rgba(250, 204, 21, 0.45)',
    previewBg: 'bg-yellow-400',
    dotClass: 'bg-yellow-400 text-zinc-950',
  },
  {
    id: 'red',
    name: 'Merah Racing',
    tagline: 'Karakter sporty, agresif, dan tajam',
    primaryHex: '#ef4444',
    ringHex: 'rgba(239, 68, 68, 0.45)',
    previewBg: 'bg-red-500',
    dotClass: 'bg-red-500 text-white',
  },
  {
    id: 'blue',
    name: 'Biru Samudera',
    tagline: 'Kesan korporat, profesional, dan tenang',
    primaryHex: '#3b82f6',
    ringHex: 'rgba(59, 130, 246, 0.45)',
    previewBg: 'bg-blue-500',
    dotClass: 'bg-blue-500 text-white',
  },
  {
    id: 'silver',
    name: 'Silver Titanium',
    tagline: 'Modern, minimalis, dan futuristik elegan',
    primaryHex: '#94a3b8',
    ringHex: 'rgba(148, 163, 184, 0.45)',
    previewBg: 'bg-slate-400',
    dotClass: 'bg-slate-400 text-zinc-950',
  },
  {
    id: 'black',
    name: 'Hitam Onyx',
    tagline: 'Monokromatik eksklusif & stealth executive',
    primaryHex: '#27272a',
    ringHex: 'rgba(39, 39, 42, 0.45)',
    previewBg: 'bg-zinc-800 dark:bg-zinc-200',
    dotClass: 'bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-950',
  },
  {
    id: 'green',
    name: 'Hijau Emerald',
    tagline: 'Nuansa ramah lingkungan, eco-drive, dan segar',
    primaryHex: '#10b981',
    ringHex: 'rgba(16, 185, 129, 0.45)',
    previewBg: 'bg-emerald-500',
    dotClass: 'bg-emerald-500 text-white',
  },
  {
    id: 'cyan',
    name: 'Cyan Cyberpunk',
    tagline: 'Vibes electric EV dan teknologi mutakhir',
    primaryHex: '#06b6d4',
    ringHex: 'rgba(6, 182, 212, 0.45)',
    previewBg: 'bg-cyan-400',
    dotClass: 'bg-cyan-400 text-zinc-950',
  },
  {
    id: 'purple',
    name: 'Ungu Royal',
    tagline: 'Nuansa mewah, kreatif, dan berkelas tinggi',
    primaryHex: '#8b5cf6',
    ringHex: 'rgba(139, 92, 246, 0.45)',
    previewBg: 'bg-purple-500',
    dotClass: 'bg-purple-500 text-white',
  },
  {
    id: 'orange',
    name: 'Oranye Sunset',
    tagline: 'Dinamis, hangat, dan mudah terlihat di malam hari',
    primaryHex: '#f97316',
    ringHex: 'rgba(249, 115, 22, 0.45)',
    previewBg: 'bg-orange-500',
    dotClass: 'bg-orange-500 text-white',
  },
];

const ACCENT_STORAGE_KEY = 'vms_accent_theme';

export function getSavedAccent(): AccentColorId {
  if (typeof window === 'undefined') return 'yellow';
  const saved = localStorage.getItem(ACCENT_STORAGE_KEY) as AccentColorId;
  const exists = ACCENT_PRESETS.some((p) => p.id === saved);
  return exists ? saved : 'yellow';
}

/**
 * Updates HTML attributes and meta tags for Android Status Bar & Navbar.
 * Modern Android Chrome (v93+) and PWAs dynamically apply `theme-color` to both
 * the top notification status bar and the bottom system navigation bar.
 */
export function applyAccentToDocument(accentId: AccentColorId) {
  if (typeof document === 'undefined') return;

  // 1. Set data attribute on documentElement
  document.documentElement.setAttribute('data-accent', accentId);
  localStorage.setItem(ACCENT_STORAGE_KEY, accentId);

  // 2. Lookup hex code for chosen accent
  const preset = ACCENT_PRESETS.find((p) => p.id === accentId);
  const themeHex = preset ? preset.primaryHex : '#facc15';

  // 3. Update or create meta[name="theme-color"] (Controls Android Status Bar & Navbar)
  let metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (!metaThemeColor) {
    metaThemeColor = document.createElement('meta');
    metaThemeColor.setAttribute('name', 'theme-color');
    document.head.appendChild(metaThemeColor);
  }
  metaThemeColor.setAttribute('content', themeHex);

  // 4. Update or create Windows Phone / Edge navbutton color
  let metaNavColor = document.querySelector('meta[name="msapplication-navbutton-color"]');
  if (!metaNavColor) {
    metaNavColor = document.createElement('meta');
    metaNavColor.setAttribute('name', 'msapplication-navbutton-color');
    document.head.appendChild(metaNavColor);
  }
  metaNavColor.setAttribute('content', themeHex);

  // 5. Update apple-mobile-web-app-status-bar-style
  let metaAppleStatus = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
  if (!metaAppleStatus) {
    metaAppleStatus = document.createElement('meta');
    metaAppleStatus.setAttribute('name', 'apple-mobile-web-app-status-bar-style');
    document.head.appendChild(metaAppleStatus);
  }
  metaAppleStatus.setAttribute('content', 'default');

  // 6. Broadcast event for reactive listeners
  window.dispatchEvent(new CustomEvent('vms-accent-change', { detail: { accentId, themeHex } }));
}

// Automatically sync Android bar on initial script execution
if (typeof window !== 'undefined') {
  try {
    const initialAccent = getSavedAccent();
    applyAccentToDocument(initialAccent);
  } catch {
    // Ignore during SSR or static analysis
  }
}
