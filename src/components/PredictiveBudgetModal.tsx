import React, { useState } from 'react';
import type { Vehicle, SparePart, ServiceRecord, FuelLog } from '../types';
import { 
  X, 
  PiggyBank, 
  Calendar, 
  Sparkles
} from 'lucide-react';
import { ModalPortal } from './ModalPortal';
import { triggerHaptic } from '../utils/haptics';

interface PredictiveBudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicles: Vehicle[];
  spareParts: SparePart[];
  serviceRecords: ServiceRecord[];
  fuelLogs: FuelLog[];
  defaultVehicleId?: string;
  onOpenAiChat?: (prompt: string) => void;
}

interface ProjectedExpense {
  monthOffset: number; // 1 = Bulan depan, 2 = 2 bulan lagi, etc.
  monthLabel: string;
  itemName: string;
  vehicleName: string;
  cost: number;
  type: 'sparepart' | 'tax';
  urgency: 'critical' | 'near' | 'later';
}

export const PredictiveBudgetModal: React.FC<PredictiveBudgetModalProps> = ({
  isOpen,
  onClose,
  vehicles,
  spareParts,
  serviceRecords: _serviceRecords,
  fuelLogs,
  defaultVehicleId,
  onOpenAiChat,
}) => {
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(
    defaultVehicleId || 'all'
  );

  if (!isOpen) return null;

  const relevantVehicles = selectedVehicleId === 'all'
    ? vehicles
    : vehicles.filter((v) => v.id === selectedVehicleId);

  const activeParts = selectedVehicleId === 'all'
    ? spareParts
    : spareParts.filter((p) => p.vehicleId === selectedVehicleId);

  // Approximate monthly mileage per vehicle
  const getMonthlyKm = (v: Vehicle) => {
    const vLogs = fuelLogs
      .filter((l) => l.vehicleId === v.id)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    if (vLogs.length >= 2) {
      const first = vLogs[0];
      const last = vLogs[vLogs.length - 1];
      const days = Math.max(1, (new Date(last.date).getTime() - new Date(first.date).getTime()) / (1000 * 60 * 60 * 24));
      const km = Math.max(1, last.odometerKm - first.odometerKm);
      const monthly = (km / days) * 30;
      if (monthly > 100 && monthly < 10000) return monthly;
    }
    return v.category === 'motor' ? 750 : v.category === 'mobil' ? 1200 : 2500;
  };

  // Build projected expenses for next 6 months
  const projectedList: ProjectedExpense[] = [];
  const now = new Date();

  // 1. Project spare parts
  activeParts.forEach((part) => {
    const veh = vehicles.find((v) => v.id === part.vehicleId);
    if (!veh) return;

    const monthlyKm = getMonthlyKm(veh);
    const remainingKm = Math.round(part.recommendedIntervalKm * (part.estimatedLifeRemainingPct / 100));
    const monthsUntilDue = Math.max(0.5, remainingKm / monthlyKm);

    if (monthsUntilDue <= 6) {
      const monthOffset = Math.min(6, Math.max(1, Math.round(monthsUntilDue)));
      const futureDate = new Date();
      futureDate.setMonth(now.getMonth() + monthOffset);
      const monthLabel = futureDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

      projectedList.push({
        monthOffset,
        monthLabel,
        itemName: part.name,
        vehicleName: `${veh.name} (${veh.plateNumber})`,
        cost: part.replacementCostEstimate || 100000,
        type: 'sparepart',
        urgency: part.estimatedLifeRemainingPct <= 20 ? 'critical' : part.estimatedLifeRemainingPct <= 45 ? 'near' : 'later',
      });
    }
  });

  // 2. Project STNK Taxes
  relevantVehicles.forEach((veh) => {
    if (veh.stnkExpiryDate) {
      const taxDate = new Date(veh.stnkExpiryDate);
      const diffMonths = (taxDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30);
      if (diffMonths >= 0 && diffMonths <= 6) {
        const monthOffset = Math.max(1, Math.round(diffMonths));
        const monthLabel = taxDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
        projectedList.push({
          monthOffset,
          monthLabel,
          itemName: `Pajak STNK Tahunan (PKB)`,
          vehicleName: `${veh.name} (${veh.plateNumber})`,
          cost: veh.stnkTaxCostAnnual || 300000,
          type: 'tax',
          urgency: diffMonths <= 1 ? 'critical' : 'near',
        });
      }
    }
  });

  projectedList.sort((a, b) => a.monthOffset - b.monthOffset);

  // Group by month
  const monthlyProjectionMap: Record<number, { label: string; total: number; items: ProjectedExpense[] }> = {};
  for (let m = 1; m <= 6; m++) {
    const futureDate = new Date();
    futureDate.setMonth(now.getMonth() + m);
    monthlyProjectionMap[m] = {
      label: futureDate.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' }),
      total: 0,
      items: [],
    };
  }

  projectedList.forEach((p) => {
    if (monthlyProjectionMap[p.monthOffset]) {
      monthlyProjectionMap[p.monthOffset].total += p.cost;
      monthlyProjectionMap[p.monthOffset].items.push(p);
    }
  });

  const total6MonthProjection = projectedList.reduce((sum, p) => sum + p.cost, 0);
  const recommendedMonthlySinkingFund = Math.round(total6MonthProjection / 6);
  const recommendedDailySinkingFund = Math.round(recommendedMonthlySinkingFund / 30);

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-zinc-950/75 backdrop-blur-md animate-fade-in text-zinc-900 dark:text-zinc-100">
        <div className="w-full max-w-2xl bg-white dark:bg-zinc-900 border-2 border-zinc-900 dark:border-zinc-700 rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden transition-all max-h-[92vh] flex flex-col">
          
          {/* Header */}
          <div className="flex items-center justify-between pb-3.5 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-2xl bg-purple-500/15 text-purple-500 border border-purple-500/30">
                <PiggyBank className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-sm sm:text-base uppercase tracking-wider text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <span>Prediksi Anggaran & Sinking Fund Servis</span>
                </h3>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Proyeksi kebutuhan dana pemeliharaan 6 bulan ke depan agar kas operasional selalu siap
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

          {/* Vehicle Switcher */}
          {vehicles.length > 1 && (
            <div className="pt-3 pb-1 shrink-0">
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                <button
                  onClick={() => {
                    triggerHaptic('light');
                    setSelectedVehicleId('all');
                  }}
                  className={`py-1.5 px-3 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer border ${
                    selectedVehicleId === 'all'
                      ? 'bg-zinc-950 text-white dark:bg-yellow-400 dark:text-zinc-950 border-zinc-950 dark:border-yellow-400 shadow-xs'
                      : 'bg-zinc-50 dark:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-zinc-400'
                  }`}
                >
                  Semua Armada ({vehicles.length})
                </button>
                {vehicles.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => {
                      triggerHaptic('light');
                      setSelectedVehicleId(v.id);
                    }}
                    className={`py-1.5 px-3 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer border ${
                      v.id === selectedVehicleId
                        ? 'bg-zinc-950 text-white dark:bg-yellow-400 dark:text-zinc-950 border-zinc-950 dark:border-yellow-400 shadow-xs'
                        : 'bg-zinc-50 dark:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-zinc-400'
                    }`}
                  >
                    {v.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-4 overflow-y-auto pr-1 flex-1 no-scrollbar mt-3 text-xs">
            
            {/* Primary Sinking Fund Card */}
            <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-purple-500/10 via-indigo-500/5 to-transparent border-2 border-purple-300 dark:border-purple-800 shadow-sm relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[11px] font-black uppercase tracking-wider text-purple-700 dark:text-purple-300 block">
                    💰 Rekomendasi Tabungan Cadangan Servis (Sinking Fund)
                  </span>
                  <div className="mt-1 font-mono font-black text-2xl sm:text-3xl text-zinc-950 dark:text-zinc-100">
                    Rp {recommendedMonthlySinkingFund.toLocaleString('id-ID')}
                    <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 ml-1">/ bulan</span>
                  </div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
                    Atau cukup sisihkan <strong className="text-purple-600 dark:text-purple-300 font-mono">Rp {recommendedDailySinkingFund.toLocaleString('id-ID')} / hari</strong>.
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-white/80 dark:bg-zinc-800/80 border border-purple-200 dark:border-purple-700 text-right shrink-0">
                  <span className="text-[10px] text-zinc-400 block font-bold uppercase">Estimasi 6 Bulan</span>
                  <span className="font-mono font-black text-lg text-purple-600 dark:text-purple-300">
                    Rp {total6MonthProjection.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            </div>

            {/* 6-Month Timeline Bar Chart */}
            <div className="p-4 rounded-3xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-zinc-600 dark:text-zinc-300">Proyeksi Anggaran per Bulan:</span>
                <span className="text-[11px] text-zinc-400 font-mono">Total {projectedList.length} Item Perawatan</span>
              </div>

              <div className="grid grid-cols-6 gap-1.5 pt-2">
                {[1, 2, 3, 4, 5, 6].map((m) => {
                  const data = monthlyProjectionMap[m];
                  const maxCost = Math.max(...Object.values(monthlyProjectionMap).map((d) => d.total), 1);
                  const heightPct = data.total > 0 ? Math.max(18, Math.round((data.total / maxCost) * 100)) : 10;

                  return (
                    <div key={m} className="flex flex-col items-center gap-1.5">
                      <span className="font-mono text-[10px] font-bold text-zinc-500">
                        {data.total > 0 ? `${Math.round(data.total / 1000)}k` : '-'}
                      </span>
                      <div className="w-full h-24 bg-zinc-200 dark:bg-zinc-700 rounded-xl overflow-hidden flex flex-col justify-end p-0.5">
                        <div
                          className={`w-full rounded-lg transition-all duration-500 ${
                            data.total > 0
                              ? m === 1
                                ? 'bg-rose-500'
                                : m <= 3
                                  ? 'bg-amber-400'
                                  : 'bg-purple-500'
                              : 'bg-transparent'
                          }`}
                          style={{ height: `${heightPct}%` }}
                        />
                      </div>
                      <span className="font-mono text-[10px] font-bold text-zinc-700 dark:text-zinc-300">
                        {data.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Upcoming Expense Items List */}
            <div className="space-y-2">
              <h4 className="font-black text-xs uppercase tracking-wider text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-purple-500" />
                <span>Rincian Pengeluaran yang Diperkirakan Jatuh Tempo:</span>
              </h4>

              {projectedList.length === 0 ? (
                <div className="p-6 bg-zinc-50 dark:bg-zinc-800/40 rounded-2xl border border-zinc-200 dark:border-zinc-700 text-center text-zinc-400">
                  Kondisi seluruh suku cadang dan legalitas masih dalam kondisi sangat prima untuk 6 bulan ke depan.
                </div>
              ) : (
                <div className="space-y-2">
                  {projectedList.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex items-center justify-between gap-2 hover:border-purple-400 transition"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl text-white font-mono font-bold text-xs shrink-0 ${
                          item.urgency === 'critical'
                            ? 'bg-rose-500'
                            : item.urgency === 'near'
                              ? 'bg-amber-500'
                              : 'bg-purple-500'
                        }`}>
                          B+{item.monthOffset}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h5 className="font-black text-xs text-zinc-900 dark:text-zinc-100">
                              {item.itemName}
                            </h5>
                            <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                              item.type === 'tax'
                                ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300'
                                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                            }`}>
                              {item.type === 'tax' ? 'Pajak' : 'Sparepart'}
                            </span>
                          </div>
                          <span className="text-[10px] text-zinc-400 block mt-0.5">
                            {item.vehicleName} • Estimasi: {item.monthLabel}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-mono font-black text-xs sm:text-sm text-zinc-950 dark:text-zinc-100 block">
                          Rp {item.cost.toLocaleString('id-ID')}
                        </span>
                        <span className={`text-[9px] font-bold ${
                          item.urgency === 'critical' ? 'text-rose-500' : 'text-zinc-400'
                        }`}>
                          {item.urgency === 'critical' ? 'Segera Ganti' : 'Mendekati Jadwal'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* AI Advisor Button */}
            {onOpenAiChat && (
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  onClose();
                  onOpenAiChat('Bantu buatkan rencana alokasi anggaran bulanan untuk armada saya berdasarkan estimasi biaya servis dan pajak.');
                }}
                className="w-full py-2.5 px-4 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/60 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 font-bold text-xs rounded-2xl flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-purple-500" />
                <span>Konsultasikan Strategi Finansial Armada ke AI</span>
              </button>
            )}

          </div>
        </div>
      </div>
    </ModalPortal>
  );
};
