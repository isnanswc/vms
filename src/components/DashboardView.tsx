import React from 'react';
import type { Vehicle, FuelLog, SparePart, ServiceRecord } from '../types';
import { 
  Sparkles, 
  MessageSquare, 
  Camera, 
  Fuel, 
  Wrench, 
  ChevronRight, 
  Gauge, 
  AlertTriangle,
  Wallet,
  TrendingUp
} from 'lucide-react';

interface DashboardViewProps {
  vehicles: Vehicle[];
  fuelLogs: FuelLog[];
  spareParts: SparePart[];
  serviceRecords: ServiceRecord[];
  onNavigateTab: (tab: 'vehicles' | 'fuel' | 'service') => void;
  onOpenQuickScan: () => void;
  onOpenAddFuel: () => void;
  onOpenAiChat: (initialPrompt?: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  vehicles,
  fuelLogs,
  spareParts,
  serviceRecords,
  onNavigateTab,
  onOpenQuickScan,
  onOpenAddFuel,
  onOpenAiChat,
}) => {
  // Calculations
  const totalFuelCostThisMonth = fuelLogs.reduce((acc, log) => acc + log.totalCost, 0);
  const totalServiceCost = serviceRecords.reduce((acc, s) => acc + s.cost, 0);
  const totalExpense = totalFuelCostThisMonth + totalServiceCost;

  const logsWithEff = fuelLogs.filter((l) => l.efficiencyKmPerLiter !== undefined);
  const avgEfficiency = logsWithEff.length > 0
    ? (logsWithEff.reduce((a, b) => a + (b.efficiencyKmPerLiter || 0), 0) / logsWithEff.length).toFixed(1)
    : '0';

  const criticalParts = spareParts.filter((p) => p.status === 'critical');

  return (
    <div className="space-y-6 pb-24 md:pb-8 pt-2 text-zinc-900 dark:text-zinc-100 transition-colors">
      {/* 1. Desktop Top Bar: Greeting & Key Metric Cards */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-yellow-400 text-zinc-950 text-[10px] font-black uppercase tracking-wider rounded-md shadow-xs">
              Fleet Console
            </span>
            <span className="text-xs text-zinc-400 dark:text-zinc-500 font-mono">Bulan Oktober 2026</span>
          </div>
          <h1 className="text-xl md:text-2xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight mt-1">
            Ringkasan Operasional Armada
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Total {vehicles.length} unit kendaraan terkelola dengan AI monitoring aktif.
          </p>
        </div>

        {/* Desktop Quick Action Buttons */}
        <div className="hidden md:flex items-center gap-2.5">
          <button
            onClick={onOpenQuickScan}
            className="flex items-center gap-2 py-2.5 px-4 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 text-xs font-bold rounded-2xl transition cursor-pointer active:scale-95 group shadow-xs"
          >
            <Camera className="w-4 h-4 text-zinc-700 dark:text-zinc-300 group-hover:scale-110 transition-transform animate-radar-loop" />
            <span>Scan Spedometer / Struk</span>
          </button>
          <button
            onClick={onOpenAddFuel}
            className="flex items-center gap-2 py-2.5 px-4 bg-zinc-950 hover:bg-zinc-800 dark:bg-yellow-400 dark:hover:bg-yellow-300 text-white dark:text-zinc-950 text-xs font-black rounded-2xl transition cursor-pointer shadow-sm active:scale-95 group"
          >
            <Fuel className="w-4 h-4 text-yellow-400 dark:text-zinc-950 group-hover:scale-110 transition-transform animate-float-loop" />
            <span>Catat Pengisian BBM</span>
          </button>
        </div>
      </div>

      {/* 2. Key Metrics Grid (4 Cards in a Row on Desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {/* Card 1: Total Pengeluaran */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-4 border-2 border-zinc-200 dark:border-zinc-800 border-b-4 border-b-zinc-900 dark:border-b-yellow-400 shadow-sm transition-colors">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-[11px] font-bold uppercase">
            <span>Total Biaya</span>
            <Wallet className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
          </div>
          <div className="mt-2">
            <span className="text-lg md:text-xl font-black font-mono tracking-tight text-zinc-950 dark:text-zinc-100">
              Rp {(totalExpense / 1000).toLocaleString('id-ID')}k
            </span>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">BBM + Pemeliharaan</p>
          </div>
        </div>

        {/* Card 2: Rata-rata Efisiensi */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-4 border-2 border-zinc-200 dark:border-zinc-800 border-b-4 border-b-yellow-400 shadow-sm transition-colors">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-[11px] font-bold uppercase">
            <span>Rata-Rata BBM</span>
            <Gauge className="w-4 h-4 text-yellow-500" />
          </div>
          <div className="mt-2">
            <span className="text-lg md:text-xl font-black font-mono tracking-tight text-zinc-950 dark:text-zinc-100">
              {avgEfficiency} <span className="text-xs font-normal text-zinc-500 dark:text-zinc-400">km/L</span>
            </span>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">Rasio efisiensi armada</p>
          </div>
        </div>

        {/* Card 3: Biaya Operasional Riil per KM */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-4 border-2 border-zinc-200 dark:border-zinc-800 border-b-4 border-b-zinc-900 dark:border-b-yellow-400 shadow-sm transition-colors">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-[11px] font-bold uppercase">
            <span>Cost per KM</span>
            <TrendingUp className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
          </div>
          <div className="mt-2">
            <span className="text-lg md:text-xl font-black font-mono tracking-tight text-zinc-950 dark:text-zinc-100">
              Rp 480 <span className="text-xs font-normal text-zinc-500 dark:text-zinc-400">/km</span>
            </span>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">Estimasi beban riil</p>
          </div>
        </div>

        {/* Card 4: Status Sparepart Kritis */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-4 border-2 border-zinc-200 dark:border-zinc-800 border-b-4 border-b-amber-400 shadow-sm transition-colors">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-[11px] font-bold uppercase">
            <span>Suku Cadang</span>
            <Wrench className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2">
            <span className="text-lg md:text-xl font-black font-mono tracking-tight text-zinc-950 dark:text-zinc-100">
              {criticalParts.length} <span className="text-xs font-normal text-zinc-500 dark:text-zinc-400">Kritis</span>
            </span>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">Wajib segera ganti</p>
          </div>
        </div>
      </div>

      {/* 3. Middle Desktop Section: 2 Columns Layout (AI Assistant + Alerts) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Big Prominent AI Chat Card (7 Cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-zinc-900 border-2 border-zinc-900 dark:border-zinc-700 rounded-3xl p-6 shadow-md hover:border-yellow-400 dark:hover:border-yellow-400 transition-all space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-yellow-400 text-zinc-950 flex items-center justify-center shadow-md shadow-yellow-400/20 shrink-0">
                <MessageSquare className="w-7 h-7 stroke-[2.4]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base md:text-lg font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
                    Fleet AI Assistant
                  </h2>
                  <span className="px-2 py-0.5 bg-yellow-100 dark:bg-yellow-950/60 text-zinc-900 dark:text-yellow-400 text-[10px] font-bold rounded-full border border-yellow-300 dark:border-yellow-800">
                    Multimodal
                  </span>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Tanya jadwal servis, kirim foto spedometer, atau bicara lewat suara (*Speech to Text*).
                </p>
              </div>
            </div>

            <button
              onClick={() => onOpenAiChat()}
              className="py-3 px-5 bg-zinc-950 hover:bg-zinc-800 dark:bg-yellow-400 dark:hover:bg-yellow-300 text-white dark:text-zinc-950 font-extrabold text-xs uppercase tracking-wider rounded-2xl transition shadow-md shadow-zinc-900/10 active:scale-95 flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              <Sparkles className="w-4 h-4 text-yellow-400 dark:text-zinc-950 fill-current animate-sparkle-loop" />
              <span>Buka Chat AI</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Prompt Pills */}
          <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 block mb-2">
              Pertanyaan Cepat untuk Armada Anda:
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => onOpenAiChat('Kapan Vario 125 2015 saya harus ganti oli & V-Belt?')}
                className="px-3 py-2 rounded-xl bg-zinc-50 hover:bg-yellow-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 hover:text-zinc-950 text-xs font-medium border border-zinc-200 dark:border-zinc-700 transition cursor-pointer"
              >
                🛵 Kapan Vario servis CVT?
              </button>
              <button
                onClick={() => onOpenAiChat('Berapa konsumsi BBM rata-rata armada saya saat ini?')}
                className="px-3 py-2 rounded-xl bg-zinc-50 hover:bg-yellow-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 hover:text-zinc-950 text-xs font-medium border border-zinc-200 dark:border-zinc-700 transition cursor-pointer"
              >
                ⛽ Cek efisiensi bensin
              </button>
              <button
                onClick={() => onOpenAiChat('Apakah ada pajak STNK yang mendekati jatuh tempo?')}
                className="px-3 py-2 rounded-xl bg-zinc-50 hover:bg-yellow-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 hover:text-zinc-950 text-xs font-medium border border-zinc-200 dark:border-zinc-700 transition cursor-pointer"
              >
                📄 Cek jatuh tempo STNK
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Urgent Alerts & AI Intelligence Summary (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Urgent Alert Banner */}
          <div className="bg-yellow-50 dark:bg-yellow-950/40 border-2 border-yellow-400 dark:border-yellow-700 rounded-3xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 animate-heartbeat-loop" />
                <h4 className="font-extrabold text-xs uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                  Peringatan Mendesak
                </h4>
              </div>
              <button
                onClick={() => onNavigateTab('service')}
                className="text-xs font-bold text-zinc-950 dark:text-yellow-400 underline hover:text-black cursor-pointer"
              >
                Lihat Detail
              </button>
            </div>

            <div className="space-y-2 text-xs">
              {criticalParts.length === 0 && vehicles.length === 0 ? (
                <div className="p-3 bg-white/80 dark:bg-zinc-900/80 rounded-2xl border border-yellow-200/60 dark:border-yellow-800/60 text-zinc-500 dark:text-zinc-400">
                  Belum ada unit terdaftar. Daftarkan kendaraan pertama Anda untuk mengaktifkan pemantauan suku cadang otomatis.
                </div>
              ) : criticalParts.length === 0 ? (
                <div className="p-3 bg-white dark:bg-zinc-900 rounded-2xl border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span className="font-bold">Semua unit armada dalam kondisi prima!</span>
                </div>
              ) : (
                criticalParts.slice(0, 3).map((part) => {
                  const veh = vehicles.find((v) => v.id === part.vehicleId);
                  return (
                    <div key={part.id} className="p-3 bg-white dark:bg-zinc-900 rounded-2xl border border-red-200 dark:border-red-800/80">
                      <span className="font-bold text-zinc-900 dark:text-zinc-100 block">
                        {veh ? `${veh.name} (${veh.plateNumber})` : 'Unit Terdaftar'}
                      </span>
                      <p className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-0.5">
                        {part.name} tersisa {part.estimatedLifeRemainingPct}%. Segera lakukan pemeriksaan atau penggantian.
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Bottom Section: Unit Kendaraan Garasi Showcase (Grid on Desktop) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
              Unit Kendaraan Terdaftar ({vehicles.length})
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Klik pada unit untuk melihat rincian detail, BBM, & sparepart</p>
          </div>

          <button
            onClick={() => onNavigateTab('vehicles')}
            className="text-xs font-extrabold text-zinc-900 dark:text-yellow-400 hover:text-yellow-600 flex items-center gap-1 cursor-pointer transition"
          >
            <span>Buka Semua Garasi</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* 3 Columns Desktop Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vehicles.length === 0 ? (
            <div className="col-span-full p-8 bg-zinc-50 dark:bg-zinc-900/50 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl text-center text-zinc-500 dark:text-zinc-400 text-xs space-y-3">
              <p>Belum ada kendaraan yang didaftarkan ke dalam sistem garasi.</p>
              <button
                onClick={() => onNavigateTab('vehicles')}
                className="py-2.5 px-4 bg-yellow-400 hover:bg-yellow-300 text-zinc-950 font-black text-xs rounded-xl shadow-xs cursor-pointer transition inline-flex items-center gap-1.5"
              >
                <span>Daftarkan Kendaraan Pertama (AI)</span>
              </button>
            </div>
          ) : (
            vehicles.map((veh) => (
              <div
                key={veh.id}
                onClick={() => onNavigateTab('vehicles')}
                className="bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800 hover:border-zinc-900 dark:hover:border-yellow-400 rounded-3xl p-4.5 shadow-sm hover:shadow-md transition-all cursor-pointer space-y-3 group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="px-2.5 py-1 bg-zinc-950 dark:bg-zinc-800 text-white font-mono font-black text-xs rounded-lg shadow-sm border border-zinc-800 dark:border-zinc-700">
                      {veh.plateNumber}
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold uppercase">
                      {veh.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-zinc-900 dark:text-zinc-200">
                    <span className="w-2 h-2 rounded-full bg-yellow-400 animate-heartbeat-loop"></span>
                    <span>{veh.healthScore}%</span>
                  </div>
                </div>

                <div>
                  <h4 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100 group-hover:text-black dark:group-hover:text-white">
                    {veh.name} <span className="text-zinc-400 dark:text-zinc-500 font-normal">({veh.year})</span>
                  </h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1 mt-0.5">{veh.notes}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800 text-xs">
                  <div className="bg-zinc-50 dark:bg-zinc-800/60 p-2 rounded-xl border border-zinc-200/60 dark:border-zinc-700/60">
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-400 block">Odometer</span>
                    <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                      {veh.currentOdometerKm.toLocaleString('id-ID')} KM
                    </span>
                  </div>
                  <div className="bg-zinc-50 dark:bg-zinc-800/60 p-2 rounded-xl border border-zinc-200/60 dark:border-zinc-700/60">
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-400 block">Tangki BBM</span>
                    <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                      {veh.tankCapacityLiters} L ({veh.fuelType})
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};