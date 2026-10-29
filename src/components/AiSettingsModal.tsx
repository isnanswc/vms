import React, { useState, useEffect } from 'react';
import type { AiSettings } from '../types/chat';
import {
  X,
  Key, 
  Check, 
  RefreshCw, 
  Layers, 
  AlertCircle,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Eye,
  EyeOff,
  Clipboard,
  Sparkles,
  HelpCircle
} from 'lucide-react';
import { fetchAvailableGeminiModels, FALLBACK_DEFAULT_MODELS } from '../utils/geminiApi';
import { ModalPortal } from './ModalPortal';
import { triggerHaptic } from '../utils/haptics';

interface AiSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AiSettings;
  onSaveSettings: (settings: AiSettings) => void;
}

export const AiSettingsModal: React.FC<AiSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
}) => {
  const [current, setCurrent] = useState<AiSettings>(() => ({
    ...settings,
    fallbackSlots: settings.fallbackSlots || [
      settings.selectedModel || 'gemini-2.5-flash',
      'gemini-2.0-flash',
      'gemini-1.5-flash',
    ],
  }));

  const [availableModels, setAvailableModels] = useState<string[]>(
    settings.availableModels && settings.availableModels.length > 0
      ? settings.availableModels
      : FALLBACK_DEFAULT_MODELS
  );

  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [copiedSuccess, setCopiedSuccess] = useState(false);
  const [fetchStatus, setFetchStatus] = useState<{ type: 'idle' | 'success' | 'error'; message?: string }>({
    type: 'idle',
  });

  // Re-sync on modal open
  useEffect(() => {
    if (isOpen) {
      setCurrent({
        ...settings,
        fallbackSlots: settings.fallbackSlots || [
          settings.selectedModel || 'gemini-2.5-flash',
          'gemini-2.0-flash',
          'gemini-1.5-flash',
        ],
      });
      if (settings.apiKey?.trim()) {
        loadModelsFromApi(settings.apiKey.trim());
      }
    }
  }, [isOpen, settings]);

  const loadModelsFromApi = async (key: string) => {
    if (!key.trim()) {
      setAvailableModels(FALLBACK_DEFAULT_MODELS);
      setFetchStatus({ type: 'idle' });
      return;
    }

    setIsLoadingModels(true);
    setFetchStatus({ type: 'idle' });

    try {
      const models = await fetchAvailableGeminiModels(key.trim());
      setAvailableModels(models);
      setFetchStatus({
        type: 'success',
        message: `✓ Kunci API valid! Berhasil memuat ${models.length} model aktif dari Google Gemini.`,
      });
    } catch {
      setFetchStatus({
        type: 'error',
        message: 'Kunci belum valid atau koneksi internet terputus. Pastikan kunci disalin lengkap.',
      });
    } finally {
      setIsLoadingModels(false);
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text && text.trim()) {
          setCurrent({ ...current, apiKey: text.trim() });
          loadModelsFromApi(text.trim());
          triggerHaptic('medium');
          setCopiedSuccess(true);
          setTimeout(() => setCopiedSuccess(false), 2000);
        }
      }
    } catch (e) {
      console.warn('Clipboard read error:', e);
    }
  };

  if (!isOpen) return null;

  const handleSlotChange = (slotIndex: 0 | 1 | 2, modelValue: string) => {
    const updatedSlots: [string, string, string] = [
      current.fallbackSlots[0],
      current.fallbackSlots[1],
      current.fallbackSlots[2],
    ];
    updatedSlots[slotIndex] = modelValue;

    setCurrent({
      ...current,
      fallbackSlots: updatedSlots,
      selectedModel: updatedSlots[0], // Slot 1 is always primary
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic('medium');
    onSaveSettings({
      ...current,
      availableModels,
      selectedModel: current.fallbackSlots[0],
    });
    onClose();
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-zinc-950/75 backdrop-blur-md animate-fade-in text-zinc-900 dark:text-zinc-100">
        <div className="w-full max-w-lg bg-white dark:bg-zinc-900 border-2 border-zinc-900 dark:border-zinc-700 rounded-3xl p-5 md:p-6 shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-2xl bg-theme-accent text-theme-accent-fg shadow-xs">
                <Sparkles className="w-5 h-5 fill-current" />
              </div>
              <div>
                <h3 className="font-black text-sm uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                  Pengaturan Kunci Google Gemini AI
                </h3>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Panduan mudah aktivasi kecerdasan buatan armada
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSave} className="mt-4 space-y-4 text-xs">
            {/* STEP-BY-STEP USER FRIENDLY GUIDE FOR NON-TECH USERS */}
            <div className="bg-gradient-to-br from-theme-accent-subtle/50 to-transparent p-4 rounded-3xl border-2 border-theme-accent-border space-y-3">
              <div className="flex items-center gap-2 text-theme-accent">
                <HelpCircle className="w-4 h-4 stroke-[2.5]" />
                <h4 className="font-black text-xs uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                  Cara Mudah Mendapatkan Kunci API (100% Gratis)
                </h4>
              </div>

              <div className="grid grid-cols-1 gap-2 text-[11px] text-zinc-700 dark:text-zinc-300">
                <div className="flex items-start gap-2.5 p-2 rounded-xl bg-white/70 dark:bg-zinc-800/70 border border-zinc-200/60 dark:border-zinc-700/60">
                  <span className="w-5 h-5 rounded-full bg-theme-accent text-theme-accent-fg font-black text-[10px] flex items-center justify-center shrink-0">1</span>
                  <span>Klik tombol <strong>"Buka Google AI Studio"</strong> di bawah (membuka tab baru).</span>
                </div>
                <div className="flex items-start gap-2.5 p-2 rounded-xl bg-white/70 dark:bg-zinc-800/70 border border-zinc-200/60 dark:border-zinc-700/60">
                  <span className="w-5 h-5 rounded-full bg-theme-accent text-theme-accent-fg font-black text-[10px] flex items-center justify-center shrink-0">2</span>
                  <span>Masuk dengan akun Google/Gmail Anda, lalu klik tombol biru <strong>"Create API key"</strong>.</span>
                </div>
                <div className="flex items-start gap-2.5 p-2 rounded-xl bg-white/70 dark:bg-zinc-800/70 border border-zinc-200/60 dark:border-zinc-700/60">
                  <span className="w-5 h-5 rounded-full bg-theme-accent text-theme-accent-fg font-black text-[10px] flex items-center justify-center shrink-0">3</span>
                  <span>Klik tombol <strong>Salin (Copy)</strong>, lalu kembali ke sini dan klik tombol <strong>"Tempel"</strong>.</span>
                </div>
              </div>

              {/* Direct External Link Button */}
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Buka Google AI Studio (Gratis Resmi Google)</span>
                <ExternalLink className="w-4 h-4 stroke-[2.5]" />
              </a>

              <p className="text-[10px] text-center text-zinc-500 dark:text-zinc-400">
                ✓ Tanpa kartu kredit • Gratis selamanya dari Google • Kunci disimpan aman hanya di browser HP Anda.
              </p>
            </div>

            {/* API Key Input Box */}
            <div className="p-4 bg-zinc-50 dark:bg-zinc-800/60 border-2 border-zinc-200 dark:border-zinc-700 rounded-3xl space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="font-extrabold text-zinc-900 dark:text-zinc-200 flex items-center gap-1.5 text-xs">
                  <Key className="w-4 h-4 text-theme-accent" />
                  <span>Tempelkan Kunci API Gemini Anda di Sini:</span>
                </label>
                
                <button
                  type="button"
                  onClick={handlePasteFromClipboard}
                  className="text-[10px] font-black flex items-center gap-1 px-2.5 py-1 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-800 dark:text-zinc-200 rounded-xl cursor-pointer transition shadow-2xs"
                  title="Otomatis menempelkan kunci dari clipboard"
                >
                  <Clipboard className="w-3 h-3" />
                  <span>{copiedSuccess ? '✓ Tertempel!' : 'Tempel Otomatis'}</span>
                </button>
              </div>

              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  placeholder="Contoh: AIzaSyD..."
                  value={current.apiKey}
                  onChange={(e) => setCurrent({ ...current, apiKey: e.target.value })}
                  onBlur={() => {
                    if (current.apiKey.trim()) {
                      loadModelsFromApi(current.apiKey.trim());
                    }
                  }}
                  className="w-full pl-3 pr-24 py-3 bg-white dark:bg-zinc-900 border-2 border-zinc-300 dark:border-zinc-700 focus:border-zinc-900 dark:focus:border-theme-accent rounded-2xl text-zinc-900 dark:text-zinc-100 font-mono text-xs focus:outline-none transition shadow-2xs"
                />

                <div className="absolute inset-y-0 right-1.5 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition cursor-pointer"
                    title={showApiKey ? 'Sembunyikan Kunci' : 'Tampilkan Kunci'}
                  >
                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => loadModelsFromApi(current.apiKey)}
                    disabled={isLoadingModels || !current.apiKey.trim()}
                    className="px-2.5 py-1.5 rounded-xl bg-theme-accent hover:bg-theme-accent-hover text-theme-accent-fg font-black text-[10px] disabled:opacity-40 transition shadow-xs flex items-center gap-1"
                    title="Uji koneksi ke Google Gemini"
                  >
                    <RefreshCw className={`w-3 h-3 ${isLoadingModels ? 'animate-spin' : ''}`} />
                    <span>Cek</span>
                  </button>
                </div>
              </div>

              {/* Status Feedback */}
              {fetchStatus.type === 'success' && (
                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-[11px] p-2 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{fetchStatus.message}</span>
                </div>
              )}
              {fetchStatus.type === 'error' && (
                <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-medium text-[11px] p-2 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{fetchStatus.message}</span>
                </div>
              )}
            </div>

            {/* 3 MODEL FALLBACK SLOTS */}
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between">
                <label className="font-black text-xs uppercase tracking-wider text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-theme-accent" />
                  <span>Slot Model AI Cadangan (Auto-Fallback)</span>
                </label>
                <span className="text-[10px] text-zinc-500 font-mono">
                  {availableModels.length} Model Siap
                </span>
              </div>

              <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/80 rounded-2xl text-[11px] text-zinc-600 dark:text-zinc-300 leading-relaxed flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Anti-Error Tanpa Putus:</strong> Jika kuota model di <strong>Slot 1</strong> habis atau sibuk, asisten otomatis beralih ke <strong>Slot 2</strong> lalu <strong>Slot 3</strong>.
                </span>
              </div>

              {/* SLOT 1 */}
              <div className="p-3 bg-white dark:bg-zinc-800/80 border-2 border-theme-accent rounded-2xl shadow-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-black text-xs text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>Slot 1: Model Utama</span>
                  </span>
                  <span className="text-[10px] px-2 py-0.5 bg-theme-accent text-theme-accent-fg font-black rounded-full">
                    Prioritas Utama
                  </span>
                </div>
                <select
                  value={current.fallbackSlots[0]}
                  onChange={(e) => handleSlotChange(0, e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 font-bold text-xs focus:outline-none"
                >
                  {availableModels.map((m) => (
                    <option key={m} value={m}>{m} {m.includes('2.5') ? '⚡ Paling Cerdas & Cepat' : ''}</option>
                  ))}
                </select>
              </div>

              {/* SLOT 2 */}
              <div className="p-3 bg-white dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-2xl shadow-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-zinc-800 dark:text-zinc-200">
                    Slot 2: Cadangan Pertama
                  </span>
                  <span className="text-[10px] px-2 py-0.5 bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 font-bold rounded-full">
                    Auto-Switch
                  </span>
                </div>
                <select
                  value={current.fallbackSlots[1]}
                  onChange={(e) => handleSlotChange(1, e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 font-bold text-xs focus:outline-none"
                >
                  {availableModels.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              {/* SLOT 3 */}
              <div className="p-3 bg-white dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-2xl shadow-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-zinc-800 dark:text-zinc-200">
                    Slot 3: Cadangan Darurat
                  </span>
                  <span className="text-[10px] px-2 py-0.5 bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 font-bold rounded-full">
                    High Stability
                  </span>
                </div>
                <select
                  value={current.fallbackSlots[2]}
                  onChange={(e) => handleSlotChange(2, e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 font-bold text-xs focus:outline-none"
                >
                  {availableModels.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-4 rounded-xl text-xs font-bold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="py-2.5 px-6 rounded-xl text-xs font-black bg-theme-accent hover:bg-theme-accent-hover text-theme-accent-fg transition shadow-md cursor-pointer active:scale-95 flex items-center gap-1.5"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Simpan Pengaturan</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </ModalPortal>
  );
};
