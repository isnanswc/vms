import React from 'react';
import { Palette, Check, X, Sparkles } from 'lucide-react';
import { ACCENT_PRESETS, applyAccentToDocument, type AccentColorId } from '../utils/themeAccent';
import { ModalPortal } from './ModalPortal';
import { triggerHaptic } from '../utils/haptics';

interface ThemeAccentModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAccent: AccentColorId;
  onSelectAccent: (accent: AccentColorId) => void;
}

export const ThemeAccentModal: React.FC<ThemeAccentModalProps> = ({
  isOpen,
  onClose,
  currentAccent,
  onSelectAccent,
}) => {
  if (!isOpen) return null;

  const handleSelect = (id: AccentColorId) => {
    triggerHaptic('medium');
    applyAccentToDocument(id);
    onSelectAccent(id);
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/75 backdrop-blur-md animate-fade-in">
        <div className="w-full max-w-md bg-white dark:bg-zinc-900 border-2 border-zinc-900 dark:border-zinc-800 rounded-3xl p-5 shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar text-zinc-900 dark:text-zinc-100 flex flex-col justify-between">
          <div>
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-vms-accent shadow-xs">
                  <Palette className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm uppercase tracking-wider text-zinc-900 dark:text-white">
                    Pilih Warna Aksen Tema
                  </h3>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Kustomisasi nuansa visual dan estetika aplikasi VMS
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Accent Presets Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-4">
              {ACCENT_PRESETS.map((preset) => {
                const isSelected = preset.id === currentAccent;
                return (
                  <button
                    key={preset.id}
                    onClick={() => handleSelect(preset.id)}
                    className={`p-3 rounded-2xl border-2 text-left transition flex items-start justify-between cursor-pointer active:scale-98 ${
                      isSelected
                        ? 'border-zinc-900 dark:border-white bg-zinc-100 dark:bg-zinc-800 shadow-sm'
                        : 'border-zinc-200 dark:border-zinc-800/80 hover:border-zinc-400 dark:hover:border-zinc-600 bg-zinc-50/60 dark:bg-zinc-900/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-8 h-8 rounded-xl shadow-xs shrink-0 flex items-center justify-center border border-black/10 dark:border-white/10"
                        style={{ backgroundColor: preset.primaryHex }}
                      >
                        {isSelected && (
                          <Check
                            className="w-4 h-4 stroke-[3]"
                            style={{
                              color: preset.id === 'yellow' || preset.id === 'silver' || preset.id === 'cyan' ? '#09090b' : '#ffffff',
                            }}
                          />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-xs text-zinc-900 dark:text-zinc-100 truncate">
                            {preset.name}
                          </span>
                        </div>
                        <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block truncate">
                          {preset.tagline}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Live Interactive Preview Box */}
            <div className="mt-4 p-3 rounded-2xl bg-vms-accent-subtle border border-vms-accent-subtle flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-vms-accent" />
                <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                  Pratinjau Tombol Aksen:
                </span>
              </div>
              <button className="px-3 py-1.5 rounded-xl bg-vms-accent font-extrabold text-[11px] shadow-xs cursor-pointer active:scale-95 transition">
                AKSEN AKTIF
              </button>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-zinc-200 dark:border-zinc-800 flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-extrabold text-xs rounded-xl shadow cursor-pointer transition active:scale-95"
            >
              SELESAI
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};
