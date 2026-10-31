import React from 'react';
import type { Vehicle, ServiceRecord, SparePart } from '../types';
import { 
  Wrench, 
  Gauge, 
  Calendar, 
  Plus, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles,
  Info
} from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

interface ServiceStatusCardProps {
  vehicle: Vehicle;
  serviceRecords: ServiceRecord[];
  spareParts: SparePart[];
  onAddService: (vehicleId: string) => void;
  onOpenAiChat?: (prompt: string) => void;
}

export const ServiceStatusCard: React.FC<ServiceStatusCardProps> = ({
  vehicle,
  serviceRecords,
  spareParts,
  onAddService,
  onOpenAiChat,
}) => {
  const vRecords = serviceRecords
    .filter((r) => r.vehicleId === vehicle.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || b.odometerKm - a.odometerKm);

  const lastService = vRecords[0];
  const hasServiceData = Boolean(lastService);

  const vParts = spareParts.filter((p) => p.vehicleId === vehicle.id);

  // Recommended service interval based on category or spare parts
  const defaultIntervalKm = vehicle.category === 'motor' 
    ? 3000 
    : vehicle.category === 'mobil' 
      ? 10000 
      : vehicle.category === 'truk' 
        ? 15000 
        : 3000;

  // KM since last service (0 if never serviced yet)
  const lastServiceKm = lastService ? lastService.odometerKm : 0;
  const kmSinceLastService = lastService 
    ? Math.max(0, vehicle.currentOdometerKm - lastServiceKm) 
    : 0;

  // Target next service KM
  const targetNextServiceKm = lastService
    ? lastServiceKm + defaultIntervalKm
    : (Math.floor(vehicle.currentOdometerKm / defaultIntervalKm) + 1) * defaultIntervalKm;

  const kmUntilNextService = targetNextServiceKm - vehicle.currentOdometerKm;
  const cycleProgressPct = hasServiceData
    ? Math.min(100, Math.max(0, Math.round((kmSinceLastService / defaultIntervalKm) * 100)))
    : 0;

  // Urgency
  const isOverdue = hasServiceData && kmUntilNextService <= 0;
  const isNear = hasServiceData && kmUntilNextService > 0 && kmUntilNextService <= 500;

  // Core components health from real registered spare parts (NO fake dummy numbers!)
  const oilPart = vParts.find((p) => p.name.toLowerCase().includes('oli'));
  const brakePart = vParts.find((p) => p.name.toLowerCase().includes('rem'));
  const cvtPart = vParts.find((p) => p.name.toLowerCase().includes('belt') || p.name.toLowerCase().includes('rantai') || p.name.toLowerCase().includes('transmisi'));
  const plugPart = vParts.find((p) => p.name.toLowerCase().includes('busi') || p.name.toLowerCase().includes('filter'));

  return (
    <div className="relative overflow-hidden bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-md transition-all">
      {/* Background Ambient Glow */}
      <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <div className="flex items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-amber-500/15 text-amber-500 shadow-xs border border-amber-500/30">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-black uppercase tracking-tight text-zinc-900 dark:text-zinc-100">
                Diagnostik & Jadwal Servis
              </h3>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                !hasServiceData
                  ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-300 dark:border-zinc-700'
                  : isOverdue
                    ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                    : isNear
                      ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                      : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
              }`}>
                {!hasServiceData ? 'Belum Ada Servis' : isOverdue ? 'Jatuh Tempo' : isNear ? 'Siap Servis' : 'Kondisi Prima'}
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              {hasServiceData 
                ? 'Monitoring interval servis berkala & kesehatan komponen mesin' 
                : 'Menunggu pencatatan servis berkala pertama'}
            </p>
          </div>
        </div>

        {/* Quick Action Button */}
        <button
          onClick={() => {
            triggerHaptic('light');
            onAddService(vehicle.id);
          }}
          className="flex items-center gap-1.5 px-3 py-2 bg-zinc-950 hover:bg-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white text-xs font-black rounded-xl transition cursor-pointer shadow-xs active:scale-95 shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Catat Servis</span>
        </button>
      </div>

      {/* Main Content Grid: Left Diagnostic Illustration + Right Telemetry */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
        
        {/* Left Column: Interactive Vehicle Chassis Diagnostic Blueprint (5 Cols) */}
        <div className="md:col-span-5 flex flex-col items-center">
          <div className="relative w-full max-w-[240px] h-56 rounded-3xl bg-gradient-to-b from-zinc-900 via-zinc-950 to-black p-3 border-2 border-zinc-700/80 shadow-2xl overflow-hidden flex items-center justify-center">
            
            {/* Blueprint Grid Lines Background */}
            <div className="absolute inset-0 bg-[radial-gradient(#3f3f46_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />

            {/* Glowing Holographic Scanner Beam Sweeping Vertically */}
            <div className="absolute inset-x-2 h-1 bg-gradient-to-r from-transparent via-theme-accent to-transparent blur-[1px] opacity-80 animate-scan-sweep pointer-events-none z-10" />

            {/* Vehicle Category Schematic Illustration */}
            <div className="relative z-10 w-full h-full flex items-center justify-center p-2">
              {vehicle.category === 'mobil' ? (
                <svg viewBox="0 0 200 320" className="w-32 h-48 stroke-zinc-400 fill-none stroke-[2.2] overflow-visible drop-shadow-[0_0_12px_rgba(250,204,21,0.2)]">
                  <rect x="35" y="40" width="130" height="240" rx="30" className="stroke-zinc-500 fill-zinc-900/60" strokeDasharray="4 2" />
                  <path d="M 45 90 L 155 90 M 45 220 L 155 220" className="stroke-zinc-700" strokeWidth="1.5" />
                  <path d="M 55 100 Q 100 85 145 100 L 140 130 Q 100 125 60 130 Z" className="stroke-theme-accent/70 fill-theme-accent/10" />
                  <path d="M 60 190 Q 100 195 140 190 L 145 215 Q 100 225 55 215 Z" className="stroke-theme-accent/70 fill-theme-accent/10" />
                  <rect x="22" y="60" width="14" height="34" rx="4" className="stroke-zinc-400 fill-zinc-800" />
                  <rect x="164" y="60" width="14" height="34" rx="4" className="stroke-zinc-400 fill-zinc-800" />
                  <rect x="22" y="210" width="14" height="34" rx="4" className="stroke-zinc-400 fill-zinc-800" />
                  <rect x="164" y="210" width="14" height="34" rx="4" className="stroke-zinc-400 fill-zinc-800" />
                </svg>
              ) : (
                <svg viewBox="0 0 160 300" className="w-28 h-48 stroke-zinc-400 fill-none stroke-[2.2] overflow-visible drop-shadow-[0_0_12px_rgba(250,204,21,0.2)]">
                  <line x1="80" y1="40" x2="80" y2="260" strokeWidth="4" className="stroke-zinc-700" />
                  <path d="M 30 75 Q 80 85 130 75" strokeWidth="4" className="stroke-zinc-400" />
                  <circle cx="30" cy="75" r="4" className="fill-theme-accent stroke-none" />
                  <circle cx="130" cy="75" r="4" className="fill-theme-accent stroke-none" />
                  <rect x="72" y="25" width="16" height="42" rx="6" className="stroke-zinc-400 fill-zinc-800" />
                  <path d="M 60 110 Q 80 95 100 110 Q 105 140 80 145 Q 55 140 60 110 Z" className="stroke-theme-accent/80 fill-theme-accent/15" />
                  <rect x="62" y="155" width="36" height="40" rx="8" className="stroke-amber-400/90 fill-amber-500/20" />
                  <rect x="72" y="225" width="16" height="48" rx="6" className="stroke-zinc-400 fill-zinc-800" />
                </svg>
              )}

              {/* Pulsing Diagnostic Nodes */}
              <div 
                className="absolute top-[48%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-amber-500/30 border border-amber-400 flex items-center justify-center animate-diagnostic-pulse z-20"
                title="Pemeriksaan Ruang Mesin & Oli"
              >
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm" />
              </div>

              <div 
                className="absolute top-[20%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-theme-accent/30 border border-theme-accent flex items-center justify-center z-20"
                title="Pemeriksaan Pengereman Depan"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-theme-accent" />
              </div>

              <div 
                className="absolute top-[78%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-emerald-500/30 border border-emerald-400 flex items-center justify-center z-20"
                title="Pemeriksaan CVT & Suspensi Belakang"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              </div>
            </div>

            {/* Watermark Status */}
            <div className="absolute bottom-2 inset-x-2 flex items-center justify-between text-[8px] font-mono text-zinc-500 uppercase px-1 pointer-events-none z-20">
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Telemetry
              </span>
              <span>Health: {vehicle.healthScore}%</span>
            </div>
          </div>

          <span className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-2 font-medium">
            Skematik Garasi: <strong className="text-zinc-800 dark:text-zinc-200 uppercase">{vehicle.category}</strong>
          </span>
        </div>

        {/* Right Column: Key Service Telematics Cards (7 Cols) */}
        <div className="md:col-span-7 space-y-3">
          
          {/* 1. Kapan Terakhir Servis & di KM Berapa */}
          <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-bold uppercase tracking-wider text-[10px] text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                <span>Servis Terakhir</span>
              </span>
              {lastService && (
                <span className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
                  {new Date(lastService.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              )}
            </div>

            {hasServiceData && lastService ? (
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                <div>
                  <span className="text-base sm:text-lg font-black font-mono text-zinc-950 dark:text-zinc-100">
                    KM {lastService.odometerKm.toLocaleString('id-ID')}
                  </span>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    {lastService.title} • {lastService.workshopName || 'Bengkel Rekanan'}
                  </p>
                </div>
                <div className="text-xs font-bold text-zinc-700 dark:text-zinc-300 font-mono">
                  Rp {lastService.cost.toLocaleString('id-ID')}
                </div>
              </div>
            ) : (
              <div className="space-y-1 py-0.5">
                <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300 block">
                  Belum Ada Riwayat Servis
                </span>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Kendaraan belum memiliki buku servis tercatat di sistem garasi.
                </p>
              </div>
            )}
          </div>

          {/* 2. Sudah Menghabiskan Berapa KM Sejak Servis Terakhir */}
          <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-bold uppercase tracking-wider text-[10px] text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 text-zinc-500" />
                <span>Jarak Sejak Servis Terakhir</span>
              </span>
              <span className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
                Interval Rekomendasi: {defaultIntervalKm.toLocaleString('id-ID')} KM
              </span>
            </div>

            {hasServiceData ? (
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-base sm:text-lg font-black font-mono text-zinc-950 dark:text-zinc-100">
                    +{kmSinceLastService.toLocaleString('id-ID')} KM
                  </span>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Siklus terpakai: {cycleProgressPct}% dari rekomendasi berkala
                  </p>
                </div>

                <div className="w-28 text-right">
                  <div className="w-full bg-zinc-200 dark:bg-zinc-700 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        cycleProgressPct >= 90 ? 'bg-rose-500' : cycleProgressPct >= 70 ? 'bg-amber-400' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${cycleProgressPct}%` }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-0.5">
                <span className="text-base font-black font-mono text-zinc-400 dark:text-zinc-500 block">
                  - KM
                </span>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Jarak siklus servis akan dihitung otomatis saat catatan servis pertama ditambahkan.
                </p>
              </div>
            )}
          </div>

          {/* 3. Estimasi Kapan Harus Servis Berikutnya */}
          {hasServiceData ? (
            <div className={`p-4 rounded-2xl border-2 transition-all ${
              isOverdue
                ? 'bg-rose-50/70 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800'
                : isNear
                  ? 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800'
                  : 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  {isOverdue ? (
                    <AlertTriangle className="w-4 h-4 text-rose-500 animate-pulse" />
                  ) : isNear ? (
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  )}
                  <span className="text-[11px] font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                    {isOverdue
                      ? 'Jatuh Tempo Servis — Segera Rawat'
                      : isNear
                        ? 'Waktunya Jadwalkan Servis'
                        : 'Kondisi Mesin Masih Prima'}
                  </span>
                </div>

                <span className="text-xs font-black font-mono text-zinc-900 dark:text-zinc-100">
                  {isOverdue 
                    ? `Lewat ${Math.abs(kmUntilNextService)} KM` 
                    : `Sisa ${kmUntilNextService.toLocaleString('id-ID')} KM`}
                </span>
              </div>

              <div className="text-xs text-zinc-600 dark:text-zinc-300 space-y-1">
                <p>
                  Rekomendasi servis berikutnya di spedometer{' '}
                  <strong className="text-zinc-900 dark:text-zinc-100 font-mono">
                    KM {targetNextServiceKm.toLocaleString('id-ID')}
                  </strong>{' '}
                  (Ganti oli mesin & cek pengereman).
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700/60 space-y-2">
              <div className="flex items-center gap-2 text-zinc-800 dark:text-zinc-200">
                <Info className="w-4 h-4 text-amber-500 shrink-0" />
                <span className="text-xs font-bold">Rekomendasi Servis Awal</span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Jadwalkan pemeriksaan awal atau servis berkala berikutnya pada target spedometer{' '}
                <strong className="text-zinc-900 dark:text-zinc-100 font-mono">
                  KM {targetNextServiceKm.toLocaleString('id-ID')}
                </strong>.
              </p>
              <button
                onClick={() => {
                  triggerHaptic('light');
                  onAddService(vehicle.id);
                }}
                className="w-full py-2.5 px-4 bg-zinc-950 hover:bg-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white font-black text-xs uppercase tracking-wider rounded-xl transition cursor-pointer active:scale-95 shadow-xs flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Catat Riwayat Servis Pertama Sekarang</span>
              </button>
            </div>
          )}

          {/* Component Breakdown: Only real data, no fake percentages */}
          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 block mb-2">
              Status Suku Cadang Terpantau:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
              <div className="p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-700/60">
                <span className="text-[10px] text-zinc-400 block font-medium">Oli Mesin</span>
                <span className="font-mono font-black text-zinc-900 dark:text-zinc-100">
                  {oilPart ? `${oilPart.estimatedLifeRemainingPct}%` : '-'}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-700/60">
                <span className="text-[10px] text-zinc-400 block font-medium">Kampas Rem</span>
                <span className="font-mono font-black text-zinc-900 dark:text-zinc-100">
                  {brakePart ? `${brakePart.estimatedLifeRemainingPct}%` : '-'}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-700/60">
                <span className="text-[10px] text-zinc-400 block font-medium">CVT / Rantai</span>
                <span className="font-mono font-black text-zinc-900 dark:text-zinc-100">
                  {cvtPart ? `${cvtPart.estimatedLifeRemainingPct}%` : '-'}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-700/60">
                <span className="text-[10px] text-zinc-400 block font-medium">Busi & Filter</span>
                <span className="font-mono font-black text-zinc-900 dark:text-zinc-100">
                  {plugPart ? `${plugPart.estimatedLifeRemainingPct}%` : '-'}
                </span>
              </div>
            </div>
          </div>

          {hasServiceData && onOpenAiChat && (
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                onOpenAiChat(`Rekomendasikan jadwal servis berkala & pemeriksaan suku cadang untuk ${vehicle.name} (${vehicle.plateNumber}).`);
              }}
              className="w-full py-2 px-3 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Konsultasi Jadwal Servis ke AI</span>
            </button>
          )}

        </div>
      </div>
    </div>
  );
};
