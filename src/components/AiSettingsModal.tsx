import React, { useState, useEffect } from 'react';
import type { AiSettings } from '../types/chat';
import { 
  X, 
  Cpu, 
  Key, 
  Sliders, 
  Check, 
  RefreshCw, 
  Layers, 
  AlertCircle,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { fetchAvailableGeminiModels, FALLBACK_DEFAULT_MODELS } from '../utils/geminiApi';

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
        message: `✓ Berhasil memuat ${models.length} model aktif dari Gemini API!`,
      });
    } catch {
      setFetchStatus({
        type: 'error',
        message: 'Gagal terhubung ke API. Menggunakan model standar.',
      });
    } finally {
      setIsLoadingModels(false);
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
    onSaveSettings({
      ...current,
      availableModels,
      selectedModel: current.fallbackSlots[0],
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-sm animate-fade-in text-zinc-900 dark:text-zinc-100">
      <div className="w-full max-w-lg bg-white dark:bg-zinc-900 border-2 border-zinc-900 dark:border-zinc-700 rounded-3xl p-5 md:p-6 shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-yellow-400 text-zinc-950 shadow-xs">
              <Cpu className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                Pengaturan AI Engine & Fallback
              </h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Konfigurasi 3 slot prioritas model otomatis</p>
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
          {/* API Key Input */}
          <div className="p-3.5 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-zinc-900 dark:text-zinc-200 flex items-center gap-1.5 text-xs">
                <Key className="w-3.5 h-3.5 text-yellow-500" />
                <span>Google Gemini API Key</span>
              </label>
              <button
                type="button"
                onClick={() => loadModelsFromApi(current.apiKey)}
                disabled={isLoadingModels || !current.apiKey.trim()}
                className="text-[10px] text-zinc-900 hover:text-black font-extrabold flex items-center gap-1 px-2.5 py-1 bg-yellow-400 hover:bg-yellow-300 disabled:opacity-40 rounded-lg cursor-pointer transition shadow-xs"
              >
                <RefreshCw className={`w-3 h-3 ${isLoadingModels ? 'animate-spin' : ''}`} />
                <span>{isLoadingModels ? 'Mengambil...' : 'Muat Model API'}</span>
              </button>
            </div>

            <input
              type="password"
              placeholder="Masukkan API Key Gemini Anda (AI Studio / Cloud)..."
              value={current.apiKey}
              onChange={(e) => setCurrent({ ...current, apiKey: e.target.value })}
              onBlur={() => {
                if (current.apiKey.trim()) {
                  loadModelsFromApi(current.apiKey.trim());
                }
              }}
              className="w-full px-3 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 font-mono focus:outline-none focus:border-zinc-900 dark:focus:border-yellow-400 shadow-2xs"
            />

            {/* Fetch Feedback Status */}
            {fetchStatus.type === 'success' && (
              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>{fetchStatus.message}</span>
              </div>
            )}
            {fetchStatus.type === 'error' && (
              <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-medium text-[11px]">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{fetchStatus.message}</span>
              </div>
            )}
            {fetchStatus.type === 'idle' && (
              <p className="text-[10px] text-zinc-400 dark:text-zinc-400">
                Kunci API disimpan secara lokal di browser Anda. Sistem akan mengambil model aktif dari akun Anda.
              </p>
            )}
          </div>

          {/* 3 MODEL FALLBACK SLOTS */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-black text-xs uppercase tracking-wider text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
                <span>3 Slot Model AI (Fallback Cascade)</span>
              </label>
              <span className="text-[10px] text-zinc-400 dark:text-zinc-400 font-mono">
                {availableModels.length} Model Tersedia
              </span>
            </div>

            {/* Information Banner */}
            <div className="p-3 bg-yellow-50/70 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800/60 rounded-2xl text-[11px] text-zinc-700 dark:text-zinc-300 leading-relaxed flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
              <span>
                <strong>Mekanisme Auto-Fallback:</strong> Jika model di <strong>Slot 1</strong> gagal (kuota habis / rate-limit / server sibuk), request otomatis berpindah ke <strong>Slot 2</strong>, lalu ke <strong>Slot 3</strong>.
              </span>
            </div>

            {/* SLOT 1 */}
            <div className="p-3 bg-white dark:bg-zinc-800/80 border-2 border-yellow-400 rounded-2xl shadow-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-xs text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
                  <span>Slot 1: Model Utama (Primary)</span>
                </span>
                <span className="px-2 py-0.5 rounded-full bg-yellow-100 dark:bg-yellow-950/60 text-yellow-900 dark:text-yellow-400 border border-yellow-300 dark:border-yellow-800 font-mono text-[9px] font-black uppercase">
                  Prioritas 1
                </span>
              </div>
              <select
                value={current.fallbackSlots[0]}
                onChange={(e) => handleSlotChange(0, e.target.value)}
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 font-mono font-bold text-xs focus:outline-none focus:border-zinc-900 dark:focus:border-yellow-400 cursor-pointer"
              >
                {availableModels.map((m) => (
                  <option key={`slot1-${m}`} value={m}>
                    {m} {m.includes('flash') ? '(Cepat & Vision)' : m.includes('pro') ? '(High Reasoning)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* SLOT 2 */}
            <div className="p-3 bg-white dark:bg-zinc-800/80 border-2 border-zinc-200 dark:border-zinc-700 rounded-2xl shadow-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-xs text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-zinc-500"></span>
                  <span>Slot 2: Cadangan Pertama (Fallback 1)</span>
                </span>
                <span className="px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-600 font-mono text-[9px] font-black uppercase">
                  Prioritas 2
                </span>
              </div>
              <select
                value={current.fallbackSlots[1]}
                onChange={(e) => handleSlotChange(1, e.target.value)}
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 font-mono font-bold text-xs focus:outline-none focus:border-zinc-900 dark:focus:border-yellow-400 cursor-pointer"
              >
                {availableModels.map((m) => (
                  <option key={`slot2-${m}`} value={m}>
                    {m} {m.includes('flash') ? '(Cepat & Vision)' : m.includes('pro') ? '(High Reasoning)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* SLOT 3 */}
            <div className="p-3 bg-white dark:bg-zinc-800/80 border-2 border-zinc-200 dark:border-zinc-700 rounded-2xl shadow-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-xs text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-zinc-400"></span>
                  <span>Slot 3: Cadangan Darurat (Fallback 2)</span>
                </span>
                <span className="px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-600 font-mono text-[9px] font-black uppercase">
                  Prioritas 3
                </span>
              </div>
              <select
                value={current.fallbackSlots[2]}
                onChange={(e) => handleSlotChange(2, e.target.value)}
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 font-mono font-bold text-xs focus:outline-none focus:border-zinc-900 dark:focus:border-yellow-400 cursor-pointer"
              >
                {availableModels.map((m) => (
                  <option key={`slot3-${m}`} value={m}>
                    {m} {m.includes('flash') ? '(Cepat & Vision)' : m.includes('pro') ? '(High Reasoning)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Persona / Gaya Respon AI */}
          <div>
            <label className="block font-bold text-zinc-800 dark:text-zinc-200 mb-1 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" />
              <span>Persona / Karakter AI</span>
            </label>
            <select
              value={current.systemPromptPreset}
              onChange={(e) => setCurrent({ ...current, systemPromptPreset: e.target.value as any })}
              className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 dark:focus:border-yellow-400 font-medium"
            >
              <option value="fleet-expert">Ahli Armada & Mekanik Kendaraan (Presisi & Solutif)</option>
              <option value="financial-mechanic">Fokus Efisiensi BBM & Penghematan Biaya</option>
              <option value="casual-assistant">Asisten Santai & Ramah Pemula</option>
            </select>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 bg-zinc-950 hover:bg-zinc-800 dark:bg-yellow-400 dark:hover:bg-yellow-300 text-white dark:text-zinc-950 font-extrabold uppercase tracking-wider text-xs rounded-xl transition shadow active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Check className="w-4 h-4 text-yellow-400 dark:text-zinc-950 stroke-[3]" />
              <span>Simpan Pengaturan AI (3 Slot Aktif)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
