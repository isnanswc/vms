import React, { useState } from 'react';
import type { AiSettings } from '../types/chat';
import { X, Sparkles, Cpu, Key, Sliders, Check } from 'lucide-react';

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
  const [current, setCurrent] = useState<AiSettings>(settings);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(current);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white border-2 border-zinc-900 rounded-3xl p-5 shadow-2xl text-zinc-900">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-yellow-400 text-zinc-950">
              <Cpu className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-zinc-900">
                Pengaturan Model AI
              </h3>
              <p className="text-[11px] text-zinc-500">Kelola kecerdasan buatan & API Provider</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="mt-4 space-y-4 text-xs">
          {/* Pilihan Model AI */}
          <div>
            <label className="block font-bold text-zinc-800 mb-1.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-yellow-500" />
              <span>Pilihan Model AI Engine</span>
            </label>
            <div className="space-y-2">
              {[
                {
                  id: 'gemini-2.5-flash',
                  name: 'Google Gemini 2.5 Flash',
                  badge: 'Rekomendasi (Cepat & Vision)',
                  desc: 'Optimal untuk membaca foto spedometer & struk SPBU dalam hitungan detik.',
                },
                {
                  id: 'gemini-2.5-pro',
                  name: 'Google Gemini 2.5 Pro',
                  badge: 'High Reasoning',
                  desc: 'Analisis mendalam tren kerusakan armada, prediksi TCO, dan diagnosa teknis.',
                },
                {
                  id: 'gemini-flash-lite',
                  name: 'Google Gemini Flash-Lite',
                  badge: 'Ultra Hemat',
                  desc: 'Respon cepat untuk tanya jawab teks ringkas dan pencatatan ringan.',
                },
              ].map((m) => (
                <label
                  key={m.id}
                  onClick={() => setCurrent({ ...current, selectedModel: m.id as any })}
                  className={`block p-3 rounded-2xl border-2 transition cursor-pointer ${
                    current.selectedModel === m.id
                      ? 'border-yellow-400 bg-yellow-50/50 shadow-sm'
                      : 'border-zinc-200 bg-white hover:border-zinc-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-zinc-900 text-xs">{m.name}</span>
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        current.selectedModel === m.id
                          ? 'bg-yellow-400 text-zinc-950'
                          : 'bg-zinc-100 text-zinc-600'
                      }`}
                    >
                      {m.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-1 leading-snug">{m.desc}</p>
                </label>
              ))}
            </div>
          </div>

          {/* API Key (Optional) */}
          <div>
            <label className="block font-bold text-zinc-800 mb-1 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-zinc-600" />
              <span>Google Gemini API Key (Opsional)</span>
            </label>
            <input
              type="password"
              placeholder="Kosongkan untuk menggunakan Default Cloudflare Worker"
              value={current.apiKey}
              onChange={(e) => setCurrent({ ...current, apiKey: e.target.value })}
              className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-zinc-900 font-mono focus:outline-none focus:border-zinc-900"
            />
            <p className="text-[10px] text-zinc-400 mt-1">
              API key Anda disimpan secara aman di browser lokal Anda.
            </p>
          </div>

          {/* Persona / Gaya Respon AI */}
          <div>
            <label className="block font-bold text-zinc-800 mb-1 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-zinc-600" />
              <span>Persona / Karakter AI</span>
            </label>
            <select
              value={current.systemPromptPreset}
              onChange={(e) => setCurrent({ ...current, systemPromptPreset: e.target.value as any })}
              className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-zinc-900 focus:outline-none focus:border-zinc-900 font-medium"
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
              className="w-full py-3 bg-zinc-950 hover:bg-zinc-800 text-white font-extrabold uppercase tracking-wider text-xs rounded-xl transition shadow active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Check className="w-4 h-4 text-yellow-400 stroke-[3]" />
              <span>Simpan Pengaturan AI</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
