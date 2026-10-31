import React from 'react';
import type { Vehicle, FuelLog } from '../types';
import { 
  Fuel, 
  Droplet, 
  Gauge, 
  Calendar, 
  Plus, 
  Zap, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles,
  Info
} from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

interface LiquidFuelCardProps {
  vehicle: Vehicle;
  fuelLogs: FuelLog[];
  onAddFuel: (vehicleId: string) => void;
  onOpenAiChat?: (prompt: string) => void;
}

export const LiquidFuelCard: React.FC<LiquidFuelCardProps> = ({
  vehicle,
  fuelLogs,
  onAddFuel,
  onOpenAiChat,
}) => {
  const isElectric = vehicle.fuelType === 'Listrik';
  const vLogs = fuelLogs
    .filter((l) => l.vehicleId === vehicle.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || b.odometerKm - a.odometerKm);

  const lastFuelLog = vLogs[0];
  const hasFuelData = Boolean(lastFuelLog);

  // Default efficiency based on vehicle category (KM / L or KM / kWh) used ONLY when fuel logs exist
  const defaultEfficiency = isElectric
    ? 6.5
    : vehicle.category === 'motor'
      ? 42.0
      : vehicle.category === 'mobil'
        ? 12.5
        : vehicle.category === 'truk'
          ? 7.0
          : 20.0;

  // Calculate efficiency from logs if available
  const logsWithEff = vLogs.filter((l) => l.efficiencyKmPerLiter && l.efficiencyKmPerLiter > 0);
  const avgEfficiency = logsWithEff.length > 0
    ? (logsWithEff.reduce((sum, l) => sum + (l.efficiencyKmPerLiter || 0), 0) / logsWithEff.length)
    : defaultEfficiency;

  // KM since last fill-up (0 if no fuel logs exist yet)
  const kmSinceLastFill = lastFuelLog
    ? Math.max(0, vehicle.currentOdometerKm - lastFuelLog.odometerKm)
    : 0;

  // Tank capacity
  const capacity = vehicle.tankCapacityLiters > 0 ? vehicle.tankCapacityLiters : (isElectric ? 40 : 5.5);

  let startingLiters = 0;
  let estimatedRemainingLiters = 0;
  let fuelPct = 0;
  let remainingRangeKm = 0;
  let usableKmBeforeRefill = 0;
  let recommendedRefillOdometerKm = 0;

  if (hasFuelData && lastFuelLog) {
    if (lastFuelLog.fullTank) {
      startingLiters = capacity;
    } else {
      // If not full tank, starting liters was the recorded liters filled
      startingLiters = Math.min(capacity, lastFuelLog.liters);
    }
    const fuelConsumedLiters = kmSinceLastFill > 0 ? kmSinceLastFill / avgEfficiency : 0;
    estimatedRemainingLiters = Math.max(0, Math.min(capacity, startingLiters - fuelConsumedLiters));
    fuelPct = Math.max(2, Math.min(100, Math.round((estimatedRemainingLiters / capacity) * 100)));
    remainingRangeKm = Math.round(estimatedRemainingLiters * avgEfficiency);

    const reserveThresholdLiters = capacity * 0.15;
    usableKmBeforeRefill = Math.max(0, (estimatedRemainingLiters - reserveThresholdLiters) * avgEfficiency);
    recommendedRefillOdometerKm = vehicle.currentOdometerKm + Math.round(usableKmBeforeRefill);
  }

  // Status Level
  const isCritical = hasFuelData && fuelPct <= 15;
  const isWarning = hasFuelData && fuelPct > 15 && fuelPct <= 30;

  // Dynamic Liquid Palette based on Fuel Type
  const getLiquidColors = () => {
    if (!hasFuelData) {
      return {
        gradient: 'from-zinc-700/60 via-zinc-800/70 to-zinc-900',
        waveFront: 'text-zinc-600/60',
        waveBack: 'text-zinc-700/40',
        glow: '',
        badgeBg: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-300 dark:border-zinc-700',
        textColor: 'text-zinc-400',
      };
    }
    if (isCritical) {
      return {
        gradient: 'from-rose-500/90 via-red-600/95 to-red-700',
        waveFront: 'text-rose-500/95',
        waveBack: 'text-rose-400/60',
        glow: 'shadow-[0_0_30px_rgba(244,63,94,0.45)]',
        badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
        textColor: 'text-rose-400',
      };
    }
    if (isWarning) {
      return {
        gradient: 'from-amber-400/90 via-amber-500/95 to-yellow-600',
        waveFront: 'text-amber-500/95',
        waveBack: 'text-amber-400/60',
        glow: 'shadow-[0_0_25px_rgba(245,158,11,0.35)]',
        badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        textColor: 'text-amber-400',
      };
    }
    if (isElectric) {
      return {
        gradient: 'from-cyan-400/90 via-teal-500/95 to-emerald-600',
        waveFront: 'text-cyan-500/95',
        waveBack: 'text-teal-400/60',
        glow: 'shadow-[0_0_30px_rgba(6,182,212,0.4)]',
        badgeBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
        textColor: 'text-cyan-400',
      };
    }
    switch (vehicle.fuelType) {
      case 'Pertamax':
        return {
          gradient: 'from-sky-400/90 via-blue-600/95 to-indigo-700',
          waveFront: 'text-blue-600/95',
          waveBack: 'text-sky-400/60',
          glow: 'shadow-[0_0_25px_rgba(37,99,235,0.35)]',
          badgeBg: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
          textColor: 'text-blue-400',
        };
      case 'Pertamax Turbo':
        return {
          gradient: 'from-rose-500/90 via-red-600/95 to-rose-800',
          waveFront: 'text-red-600/95',
          waveBack: 'text-rose-400/60',
          glow: 'shadow-[0_0_25px_rgba(225,29,72,0.35)]',
          badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
          textColor: 'text-rose-400',
        };
      case 'Bio Solar':
      case 'Dexlite':
        return {
          gradient: 'from-amber-400/90 via-amber-600/95 to-amber-800',
          waveFront: 'text-amber-600/95',
          waveBack: 'text-amber-400/60',
          glow: 'shadow-[0_0_25px_rgba(217,119,6,0.35)]',
          badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          textColor: 'text-amber-400',
        };
      case 'Pertalite':
      default:
        return {
          gradient: 'from-emerald-400/90 via-emerald-600/95 to-teal-800',
          waveFront: 'text-emerald-600/95',
          waveBack: 'text-emerald-400/60',
          glow: 'shadow-[0_0_25px_rgba(16,185,129,0.35)]',
          badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          textColor: 'text-emerald-400',
        };
    }
  };

  const colors = getLiquidColors();

  return (
    <div className="relative overflow-hidden bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-md transition-all">
      {/* Background Glow */}
      <div className="absolute -top-16 -right-16 w-56 h-56 bg-theme-accent/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <div className="flex items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs border border-zinc-200/80 dark:border-zinc-700/80">
            {isElectric ? <Zap className="w-5 h-5 text-cyan-400" /> : <Fuel className="w-5 h-5 text-theme-accent" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-black uppercase tracking-tight text-zinc-900 dark:text-zinc-100">
                {isElectric ? 'Telematika Baterai & Daya' : 'Telematika Bahan Bakar'}
              </h3>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${colors.badgeBg}`}>
                {vehicle.fuelType}
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              {hasFuelData 
                ? 'Estimasi sisa cairan tangki riil & rekomendasi pengisian' 
                : 'Menunggu pencatatan pengisian bahan bakar pertama'}
            </p>
          </div>
        </div>

        {/* Quick Action Button */}
        <button
          onClick={() => {
            triggerHaptic('light');
            onAddFuel(vehicle.id);
          }}
          className="flex items-center gap-1.5 px-3 py-2 bg-zinc-950 hover:bg-zinc-800 dark:bg-theme-accent dark:hover:bg-theme-accent-hover text-white dark:text-theme-accent-fg text-xs font-black rounded-xl transition cursor-pointer shadow-xs active:scale-95 shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Catat BBM</span>
        </button>
      </div>

      {/* Main Content: Left Column (Liquid Tank) + Right Column (Telemetry Insights) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
        
        {/* Left Column: Liquid Fuel Tank Vessel (5 Cols) */}
        <div className="md:col-span-5 flex flex-col items-center justify-center">
          <div className="relative w-44 sm:w-48 h-56 rounded-[32px] bg-gradient-to-b from-zinc-900 via-zinc-950 to-black p-2 border-2 border-zinc-700/80 shadow-2xl overflow-hidden flex flex-col justify-end">
            
            {/* Top Gloss Reflection Bezel */}
            <div className="absolute top-2 inset-x-4 h-6 rounded-full bg-gradient-to-b from-white/20 to-transparent pointer-events-none z-20" />
            
            {/* Glass Curvature Side Highlights */}
            <div className="absolute inset-y-4 left-2 w-1.5 rounded-full bg-white/10 blur-[1px] pointer-events-none z-20" />
            <div className="absolute inset-y-4 right-2 w-1.5 rounded-full bg-white/10 blur-[1px] pointer-events-none z-20" />

            {/* Measurement Graduation Ticks */}
            <div className="absolute inset-y-4 right-3 flex flex-col justify-between items-end text-[9px] font-mono font-bold text-zinc-500 z-20 pointer-events-none select-none">
              <span className="flex items-center gap-1"><span>F</span><span className="w-2.5 h-[1.5px] bg-zinc-500" /></span>
              <span className="flex items-center gap-1"><span>¾</span><span className="w-1.5 h-[1px] bg-zinc-600" /></span>
              <span className="flex items-center gap-1"><span>½</span><span className="w-2.5 h-[1.5px] bg-zinc-500" /></span>
              <span className="flex items-center gap-1"><span>¼</span><span className="w-1.5 h-[1px] bg-zinc-600" /></span>
              <span className="flex items-center gap-1 text-rose-400"><span>E</span><span className="w-2.5 h-[1.5px] bg-rose-400" /></span>
            </div>

            {/* Rising Bubbles inside the liquid (only active if fuel data exists) */}
            {hasFuelData && (
              <div className="absolute inset-x-0 bottom-0 top-12 overflow-hidden pointer-events-none z-10">
                <span className="absolute bottom-2 left-8 w-1.5 h-1.5 rounded-full bg-white/40 animate-bubble-rise-1" />
                <span className="absolute bottom-4 left-16 w-2 h-2 rounded-full bg-white/50 animate-bubble-rise-2" />
                <span className="absolute bottom-1 left-24 w-1.5 h-1.5 rounded-full bg-white/30 animate-bubble-rise-3" />
              </div>
            )}

            {/* LIQUID BODY CONTAINER with dynamic height */}
            {hasFuelData ? (
              <div
                className={`relative w-full rounded-b-[24px] overflow-hidden transition-all duration-700 ease-out ${colors.glow}`}
                style={{ height: `${fuelPct}%` }}
              >
                {/* Animated Liquid Waves Header */}
                <div className="absolute top-0 inset-x-0 -mt-3.5 h-5 w-[200%] pointer-events-none overflow-hidden">
                  <svg
                    className={`absolute top-0 left-0 w-[200%] h-full animate-liquid-wave-2 ${colors.waveBack}`}
                    viewBox="0 0 1200 120"
                    preserveAspectRatio="none"
                  >
                    <path
                      d="M 0,30 C 150,60 350,0 500,30 C 650,60 850,0 1000,30 C 1150,60 1350,0 1500,30 L 1500,120 L 0,120 Z"
                      fill="currentColor"
                    />
                  </svg>

                  <svg
                    className={`absolute top-0 left-0 w-[200%] h-full animate-liquid-wave-1 ${colors.waveFront}`}
                    viewBox="0 0 1200 120"
                    preserveAspectRatio="none"
                  >
                    <path
                      d="M 0,40 C 200,10 400,70 600,40 C 800,10 1000,70 1200,40 L 1200,120 L 0,120 Z"
                      fill="currentColor"
                    />
                  </svg>

                  <div className="absolute top-1 inset-x-0 h-[1.5px] bg-white/40 blur-[0.5px]" />
                </div>

                {/* Liquid Volume Gradient Fill */}
                <div className={`w-full h-full bg-gradient-to-b ${colors.gradient} opacity-95`} />
              </div>
            ) : (
              /* Empty Standby Tank State (Zero dummy data) */
              <div className="relative w-full h-6 rounded-b-[24px] bg-zinc-800/40 border-t border-dashed border-zinc-700/60" />
            )}

            {/* Central Digital Readout Overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center z-20 pointer-events-none text-center px-2">
              {hasFuelData ? (
                <>
                  <span className="text-3xl font-black font-mono tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                    {fuelPct}%
                  </span>
                  <div className="flex items-center gap-1 text-[11px] font-bold text-white/90 drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)] mt-0.5">
                    <Droplet className="w-3 h-3 fill-white/80" />
                    <span>
                      ± {estimatedRemainingLiters.toFixed(1)} / {capacity} {isElectric ? 'kWh' : 'L'}
                    </span>
                  </div>

                  {isCritical && (
                    <div className="mt-2 px-2 py-0.5 rounded-full bg-rose-500 text-white text-[9px] font-black uppercase tracking-wider animate-bounce shadow-md">
                      Bensin Menipis!
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-1">
                  <div className="w-8 h-8 rounded-full bg-zinc-800/80 border border-zinc-700 flex items-center justify-center mx-auto text-zinc-400">
                    <Fuel className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-black font-mono tracking-tight text-zinc-400 block">
                    Belum Terdata
                  </span>
                  <span className="text-[10px] text-zinc-500 block">
                    Kapasitas: {capacity} {isElectric ? 'kWh' : 'L'}
                  </span>
                </div>
              )}
            </div>
          </div>

          <span className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-2 font-medium">
            Kapasitas Tangki: <span className="font-bold text-zinc-800 dark:text-zinc-200">{capacity} {isElectric ? 'kWh' : 'Liter'}</span>
          </span>
        </div>

        {/* Right Column: Telematics Insights */}
        <div className="md:col-span-7 space-y-3">
          
          {/* 1. Kapan Terakhir Isi Bensin & di KM Berapa */}
          <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-bold uppercase tracking-wider text-[10px] text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                <span>Pengisian Terakhir</span>
              </span>
              {lastFuelLog && (
                <span className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
                  {new Date(lastFuelLog.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              )}
            </div>

            {hasFuelData && lastFuelLog ? (
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                <div>
                  <span className="text-base sm:text-lg font-black font-mono text-zinc-950 dark:text-zinc-100">
                    KM {lastFuelLog.odometerKm.toLocaleString('id-ID')}
                  </span>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    {lastFuelLog.stationName || 'SPBU'} • +{lastFuelLog.liters} L (Rp {lastFuelLog.totalCost.toLocaleString('id-ID')})
                  </p>
                </div>
                <div className="text-xs font-bold text-theme-accent">
                  {lastFuelLog.fullTank ? '✓ Full Tank' : 'Sebagian'}
                </div>
              </div>
            ) : (
              <div className="space-y-1 py-0.5">
                <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300 block">
                  Belum Ada Catatan BBM
                </span>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Kendaraan baru didaftarkan. Belum ada catatan pengisian bensin yang tersimpan di sistem.
                </p>
              </div>
            )}
          </div>

          {/* 2. Sudah Menghabiskan Berapa KM Sejak Terakhir Isi */}
          <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-bold uppercase tracking-wider text-[10px] text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 text-zinc-500" />
                <span>Jarak Sejak Pengisian Terakhir</span>
              </span>
              <span className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
                Odometer: {vehicle.currentOdometerKm.toLocaleString('id-ID')} KM
              </span>
            </div>

            {hasFuelData ? (
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-base sm:text-lg font-black font-mono text-zinc-950 dark:text-zinc-100">
                    +{kmSinceLastFill.toLocaleString('id-ID')} KM
                  </span>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Konsumsi BBM estimasi: ~{((kmSinceLastFill > 0 ? kmSinceLastFill / avgEfficiency : 0)).toFixed(1)} Liter terpakai
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300">
                    Rasio: {avgEfficiency.toFixed(1)} km/L
                  </span>
                </div>
              </div>
            ) : (
              <div className="py-0.5">
                <span className="text-base font-black font-mono text-zinc-400 dark:text-zinc-500 block">
                  - KM
                </span>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Jarak konsumsi akan dihitung otomatis saat pengisian BBM pertama dicatat.
                </p>
              </div>
            )}
          </div>

          {/* 3. Estimasi Kapan Harus Isi Bensin & Status Tangki */}
          {hasFuelData ? (
            <div className={`p-4 rounded-2xl border-2 transition-all ${
              isCritical
                ? 'bg-rose-50/70 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800'
                : isWarning
                  ? 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800'
                  : 'bg-theme-accent-subtle/40 border-theme-accent-border'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  {isCritical ? (
                    <AlertTriangle className="w-4 h-4 text-rose-500 animate-pulse" />
                  ) : isWarning ? (
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  )}
                  <span className="text-[11px] font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                    {isCritical
                      ? 'Kritis — Wajib Segera Isi Ulang'
                      : isWarning
                        ? 'Perhatian — Bensin Mendekati Cadangan'
                        : 'Kapasitas Bensin Aman'}
                  </span>
                </div>

                <span className="text-xs font-black font-mono text-zinc-900 dark:text-zinc-100">
                  Sisa ± {remainingRangeKm} KM
                </span>
              </div>

              <div className="space-y-1 text-xs text-zinc-600 dark:text-zinc-300">
                <p>
                  Rekomendasi isi ulang sebelum spedometer mencapai{' '}
                  <strong className="text-zinc-900 dark:text-zinc-100 font-mono">
                    KM {recommendedRefillOdometerKm.toLocaleString('id-ID')}
                  </strong>{' '}
                  (saat cadangan 15%).
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700/60 space-y-2">
              <div className="flex items-center gap-2 text-zinc-800 dark:text-zinc-200">
                <Info className="w-4 h-4 text-theme-accent shrink-0" />
                <span className="text-xs font-bold">Cara Kerja Estimasi Bahan Bakar</span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Sistem menghitung sisa bensin secara matematis: <em>(Liter Isi Terakhir) − (Jarak Ditempuh ÷ Rasio KM/L)</em>. Karena belum ada riwayat pengisian BBM, data sisa bensin belum dapat dikalkulasi.
              </p>
              <button
                onClick={() => {
                  triggerHaptic('light');
                  onAddFuel(vehicle.id);
                }}
                className="w-full py-2.5 px-4 bg-theme-accent hover:bg-theme-accent-hover text-theme-accent-fg font-black text-xs uppercase tracking-wider rounded-xl transition cursor-pointer active:scale-95 shadow-xs flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Catat Pengisian BBM Pertama Sekarang</span>
              </button>
            </div>
          )}

          {hasFuelData && onOpenAiChat && (
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                onOpenAiChat(`Analisis konsumsi BBM dan efisiensi untuk ${vehicle.name} (${vehicle.plateNumber}).`);
              }}
              className="w-full py-2 px-3 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-theme-accent" />
              <span>Konsultasi Efisiensi BBM ke AI</span>
            </button>
          )}

        </div>
      </div>
    </div>
  );
};
