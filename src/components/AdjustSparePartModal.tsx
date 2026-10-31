import React, { useState, useEffect } from 'react';
import type { SparePart, Vehicle } from '../types';
import { 
  X, 
  Wrench, 
  Check, 
  Calendar,
  History,
  Info
} from 'lucide-react';
import { ModalPortal } from './ModalPortal';
import { triggerHaptic } from '../utils/haptics';

interface AdjustSparePartModalProps {
  isOpen: boolean;
  onClose: () => void;
  part: SparePart | null;
  vehicle?: Vehicle;
  onUpdateSparePart: (updatedPart: SparePart) => void;
}

export const AdjustSparePartModal: React.FC<AdjustSparePartModalProps> = ({
  isOpen,
  onClose,
  part,
  vehicle,
  onUpdateSparePart,
}) => {
  const [newPct, setNewPct] = useState<number>(50);
  const [reasonCategory, setReasonCategory] = useState<string>('Pemasangan part lawas / bekas');
  const [notes, setNotes] = useState<string>('');
  const [date, setDate] = useState<string>(() => new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (part) {
      setNewPct(part.estimatedLifeRemainingPct);
      setNotes('');
    }
  }, [part]);

  if (!isOpen || !part) return null;

  const currentOdo = vehicle?.currentOdometerKm || part.lastReplacedOdometerKm || 0;
  const interval = part.recommendedIntervalKm || 5000;

  // Real-time recalculation of last replaced odometer and remaining km
  const usedKm = Math.round(interval * (1 - newPct / 100));
  const remainingKm = Math.round(interval * (newPct / 100));
  const recalculatedLastReplacedKm = Math.max(0, currentOdo - usedKm);

  const newStatus: 'optimal' | 'warning' | 'critical' = 
    newPct <= 20 ? 'critical' : newPct <= 40 ? 'warning' : 'optimal';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic('medium');

    const updatedPart: SparePart = {
      ...part,
      estimatedLifeRemainingPct: newPct,
      lastReplacedOdometerKm: recalculatedLastReplacedKm,
      status: newStatus,
      lastAdjustment: {
        date,
        previousPct: part.estimatedLifeRemainingPct,
        newPct,
        reason: notes ? `${reasonCategory} (${notes})` : reasonCategory,
        odometerKm: currentOdo,
        notes: notes || undefined,
      },
    };

    onUpdateSparePart(updatedPart);
    onClose();
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-zinc-950/75 backdrop-blur-md animate-fade-in text-zinc-900 dark:text-zinc-100">
        <div className="w-full max-w-lg bg-white dark:bg-zinc-900 border-2 border-zinc-900 dark:border-zinc-700 rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden transition-all max-h-[92vh] flex flex-col">
          
          {/* Header */}
          <div className="flex items-center justify-between pb-3.5 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-2xl bg-amber-500/15 text-amber-500 border border-amber-500/30">
                <Wrench className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-sm sm:text-base uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                  Penyesuaian Kondisi Suku Cadang
                </h3>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  {vehicle ? `${vehicle.name} (${vehicle.plateNumber})` : 'Komponen Armada'}
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

          <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs overflow-y-auto pr-1 flex-1 no-scrollbar">
            
            {/* Component Name Badge */}
            <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">
                  Komponen Terpilih
                </span>
                <h4 className="font-black text-sm sm:text-base text-zinc-950 dark:text-zinc-100 mt-0.5">
                  {part.name}
                </h4>
                <span className="text-[11px] text-zinc-500 font-mono mt-0.5 block">
                  Interval Rekomendasi: Tiap {interval.toLocaleString('id-ID')} KM
                </span>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-bold text-zinc-400 block mb-0.5">Kondisi Sebelumnya</span>
                <span className={`px-2.5 py-1 rounded-xl text-xs font-mono font-black border ${
                  part.status === 'critical'
                    ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-300'
                    : part.status === 'warning'
                      ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300'
                      : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300'
                }`}>
                  {part.estimatedLifeRemainingPct}%
                </span>
              </div>
            </div>

            {/* Previous Adjustment History Note if any */}
            {part.lastAdjustment && (
              <div className="p-2.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60 text-[11px] text-zinc-600 dark:text-zinc-400 flex items-start gap-2">
                <History className="w-3.5 h-3.5 text-zinc-500 mt-0.5 shrink-0" />
                <div>
                  <span className="font-bold text-zinc-800 dark:text-zinc-200">Penyesuaian Terakhir: </span>
                  <span>{part.lastAdjustment.reason} ({part.lastAdjustment.date}) • dari {part.lastAdjustment.previousPct}% menjadi {part.lastAdjustment.newPct}%</span>
                </div>
              </div>
            )}

            {/* Quick Presets */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-bold text-zinc-700 dark:text-zinc-300">
                  Tentukan Kondisi Riil Saat Ini:
                </label>
                <span className={`font-mono font-black text-sm px-2.5 py-0.5 rounded-xl border ${
                  newStatus === 'critical'
                    ? 'bg-rose-500 text-white border-rose-600'
                    : newStatus === 'warning'
                      ? 'bg-amber-500 text-zinc-950 border-amber-600'
                      : 'bg-emerald-500 text-white border-emerald-600'
                }`}>
                  {newPct}% ({newStatus === 'critical' ? 'Kritis / Wajib Ganti' : newStatus === 'warning' ? 'Waspada' : 'Optimal'})
                </span>
              </div>

              {/* Slider */}
              <div className="space-y-2 p-3 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-2xl">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={newPct}
                  onChange={(e) => setNewPct(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer h-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg"
                />

                <div className="grid grid-cols-4 gap-1.5 pt-1">
                  {[
                    { label: '🟢 100% Baru', val: 100 },
                    { label: '🟡 75% Baik', val: 75 },
                    { label: '🟠 50% Sedang', val: 50 },
                    { label: '🔴 20% Kritis', val: 20 },
                  ].map((p) => (
                    <button
                      key={p.val}
                      type="button"
                      onClick={() => {
                        triggerHaptic('light');
                        setNewPct(p.val);
                      }}
                      className={`py-1.5 px-2 rounded-xl text-center font-bold text-[10px] border transition cursor-pointer ${
                        newPct === p.val
                          ? 'bg-zinc-950 text-white dark:bg-yellow-400 dark:text-zinc-950 border-zinc-950 dark:border-yellow-400 shadow-xs'
                          : 'bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-zinc-400'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Impact Calculation Preview */}
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-2xl space-y-1.5 text-[11px]">
              <div className="flex items-center gap-1.5 font-bold text-amber-900 dark:text-amber-300">
                <Info className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>Simulasi Dampak Telematika:</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-zinc-700 dark:text-zinc-300 font-mono">
                <div>
                  <span className="text-zinc-400 block text-[10px]">Odo Terakhir Diganti:</span>
                  <span className="font-bold text-xs">KM {recalculatedLastReplacedKm.toLocaleString('id-ID')}</span>
                </div>
                <div>
                  <span className="text-zinc-400 block text-[10px]">Estimasi Sisa Pakai:</span>
                  <span className="font-bold text-xs">± {remainingKm.toLocaleString('id-ID')} KM lagi</span>
                </div>
              </div>
            </div>

            {/* Reason Selector */}
            <div>
              <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Alasan / Penyebab Penyesuaian
              </label>
              <div className="space-y-1.5">
                {[
                  'Pemasangan part lawas / bekas (kesalahan pasang)',
                  'Hasil inspeksi fisik (aus lebih cepat dari jadwal)',
                  'Kerusakan dini / deformasi / macet',
                  'Koreksi pencatatan kilometer',
                ].map((reason, idx) => (
                  <label
                    key={idx}
                    onClick={() => setReasonCategory(reason)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border transition cursor-pointer text-xs ${
                      reasonCategory === reason
                        ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-400 text-amber-950 dark:text-amber-200 font-bold'
                        : 'bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="adjustmentReason"
                      checked={reasonCategory === reason}
                      onChange={() => setReasonCategory(reason)}
                      className="accent-amber-500"
                    />
                    <span>{reason}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Detail Memo */}
            <div>
              <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                Catatan Tambahan (Opsional)
              </label>
              <input
                type="text"
                placeholder="Contoh: Kampas rem bawaan bengkel lama aus tidak rata, dipasang part cadangan bekas"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 dark:focus:border-yellow-400"
              />
            </div>

            {/* Date */}
            <div>
              <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                Tanggal Penyesuaian
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-zinc-400">
                  <Calendar className="w-3.5 h-3.5" />
                </div>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-8 pr-2.5 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl font-mono text-zinc-900 dark:text-zinc-100"
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3.5 bg-theme-accent hover:bg-theme-accent-hover text-theme-accent-fg font-black uppercase tracking-wider text-xs rounded-2xl transition shadow-md active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Simpan Penyesuaian Suku Cadang</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </ModalPortal>
  );
};
