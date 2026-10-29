/**
 * Application Accent Theme Configuration & Persistence
 * Allows dynamic customization of the primary accent color across the app.
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

export function applyAccentToDocument(accentId: AccentColorId) {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-accent', accentId);
  localStorage.setItem(ACCENT_STORAGE_KEY, accentId);
  window.dispatchEvent(new CustomEvent('vms-accent-change', { detail: accentId }));
}
