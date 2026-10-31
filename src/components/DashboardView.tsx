import React, { useState } from 'react';
import { AnimatedWalletIcon, AnimatedSpeedometerIcon, AnimatedArrowRiseIcon, AnimatedWrenchIcon } from './DashboardAnimatedIcons';
import type { Vehicle, FuelLog, SparePart, ServiceRecord } from '../types';
import { 
  Sparkles, 
  MessageSquare, 
  Camera, 
  Fuel, 
  ChevronRight, 
  AlertTriangle,
  Plus
} from 'lucide-react';
import { VehicleSlideSelector } from './VehicleSlideSelector';
import { LiquidFuelCard } from './LiquidFuelCard';
import { ServiceStatusCard } from './ServiceStatusCard';
import { triggerHaptic } from '../utils/haptics';

interface DashboardViewProps {
  vehicles: Vehicle[];
  fuelLogs: FuelLog[];
  spareParts: SparePart[];
  serviceRecords: ServiceRecord[];
  onNavigateTab: (tab: 'vehicles' | 'fuel' | 'service') => void;
  onOpenQuickScan: () => void;
  onOpenAddFuel: (vehicleId?: string) => void;
  onOpenAddService?: (vehicleId?: string) => void;
  onOpenAiChat: (initialPrompt?: string) => void;
  onNavigateToVehicle?: (vehicleId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  vehicles,
  fuelLogs,
  spareParts,
  serviceRecords,
  onNavigateTab,
  onOpenQuickScan,
  onOpenAddFuel,
  onOpenAddService,
  onOpenAiChat,
  onNavigateToVehicle,
}) => {
  // Vehicle Selection Filter: 'all' or specific vehicleId
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('all');

  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId);

  // Filter logs and parts based on vehicle selection
  const currentFuelLogs = selectedVehicleId === 'all'
    ? fuelLogs
    : fuelLogs.filter((l) => l.vehicleId === selectedVehicleId);

  const currentServiceRecords = selectedVehicleId === 'all'
    ? serviceRecords
    : serviceRecords.filter((s) => s.vehicleId === selectedVehicleId);

  const currentSpareParts = selectedVehicleId === 'all'
    ? spareParts
    : spareParts.filter((p) => p.vehicleId === selectedVehicleId);

  // Financial & Efficiency Calculations
  const totalFuelCost = currentFuelLogs.reduce((acc, log) => acc + log.totalCost, 0);
  const totalServiceCost = currentServiceRecords.reduce((acc, s) => acc + s.cost, 0);
  const totalExpense = totalFuelCost + totalServiceCost;

  const logsWithEff = currentFuelLogs.filter((l) => l.efficiencyKmPerLiter !== undefined && (l.efficiencyKmPerLiter || 0) > 0);
  const avgEfficiency = logsWithEff.length > 0
    ? (logsWithEff.reduce((a, b) => a + (b.efficiencyKmPerLiter || 0), 0) / logsWithEff.length).toFixed(1)
    : selectedVehicle
      ? (selectedVehicle.category === 'motor' ? '42.0' : selectedVehicle.category === 'mobil' ? '12.5' : '10.0')
      : '0';

  const criticalParts = currentSpareParts.filter((p) => p.status === 'critical');

  // Dynamic Cost per KM calculation
  let totalTrackedDistanceKm = 0;
  if (selectedVehicleId === 'all') {
    vehicles.forEach((veh) => {
      const vehLogs = fuelLogs.filter((l) => l.vehicleId === veh.id && l.odometerKm > 0);
      if (vehLogs.length >= 2) {
        const sorted = [...vehLogs].sort((a, b) => a.odometerKm - b.odometerKm);
        totalTrackedDistanceKm += (sorted[sorted.length - 1].odometerKm - sorted[0].odometerKm);
      }
    });
  } else if (selectedVehicle) {
    const vehLogs = fuelLogs.filter((l) => l.vehicleId === selectedVehicle.id && l.odometerKm > 0);
    if (vehLogs.length >= 2) {
      const sorted = [...vehLogs].sort((a, b) => a.odometerKm - b.odometerKm);
      totalTrackedDistanceKm = sorted[sorted.length - 1].odometerKm - sorted[0].odometerKm;
    }
  }

  const costPerKm = totalTrackedDistanceKm > 0 && totalExpense > 0
    ? Math.round(totalExpense / totalTrackedDistanceKm)
    : 0;

  // Active showcase vehicle for telematics cards: either the selected vehicle or the first available vehicle
  const showcaseVehicle = selectedVehicle || vehicles[0];

  return (
    <div className="space-y-6 pb-24 md:pb-8 pt-2 text-zinc-900 dark:text-zinc-100 transition-colors animate-page-enter">
      
      {/* 1. Desktop Top Bar: Greeting & Key Metric Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-theme-accent text-theme-accent-fg text-[10px] font-black uppercase tracking-wider rounded-md shadow-xs">
              Fleet Console
            </span>
            <span className="text-xs text-zinc-400 dark:text-zinc-500 font-mono">
              {selectedVehicle ? `Unit: ${selectedVehicle.name}` : `Armada (${vehicles.length} Kendaraan)`}
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight mt-1">
            {selectedVehicle ? selectedVehicle.name : 'Ringkasan Operasional Armada'}
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {selectedVehicle ? (
              <span>
                Nomor Polisi: <strong className="font-mono text-zinc-800 dark:text-zinc-200">{selectedVehicle.plateNumber}</strong> • Odometer: <strong className="font-mono text-zinc-800 dark:text-zinc-200">{selectedVehicle.currentOdometerKm.toLocaleString('id-ID')} KM</strong>
              </span>
            ) : (
              <span>Total {vehicles.length} unit kendaraan terkelola dengan AI monitoring & telematika aktif.</span>
            )}
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              triggerHaptic('light');
              onOpenQuickScan();
            }}
            className="flex items-center gap-2 py-2 px-3 sm:px-4 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 text-xs font-bold rounded-2xl transition cursor-pointer active:scale-95 group shadow-xs"
          >
            <Camera className="w-4 h-4 text-zinc-700 dark:text-zinc-300 group-hover:scale-110 transition-transform animate-radar-loop" />
            <span className="hidden sm:inline">Scan Spedometer / Struk</span>
            <span className="sm:hidden">Scan AI</span>
          </button>
          <button
            onClick={() => {
              triggerHaptic('light');
              onOpenAddFuel(selectedVehicle?.id);
            }}
            className="flex items-center gap-2 py-2 px-3 sm:px-4 bg-zinc-950 hover:bg-zinc-800 dark:bg-theme-accent dark:hover:bg-theme-accent-hover text-white dark:text-theme-accent-fg text-xs font-black rounded-2xl transition cursor-pointer shadow-sm active:scale-95 group"
          >
            <Fuel className="w-4 h-4 text-theme-accent dark:text-theme-accent-fg group-hover:scale-110 transition-transform animate-float-loop" />
            <span>Catat BBM</span>
          </button>
        </div>
      </div>

      {/* 2. Interactive Vehicle Slide Selector: Allows selecting 1 vehicle or all vehicles */}
      {vehicles.length > 0 && (
        <div className="pt-1">
          <VehicleSlideSelector
            vehicles={vehicles}
            selectedVehicleId={selectedVehicleId}
            onSelectVehicle={(id) => {
              setSelectedVehicleId(id);
            }}
          />
        </div>
      )}

      {/* 3. Key Metrics Grid (Calculated for selected vehicle or whole fleet) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {/* Card 1: Total Pengeluaran */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-4 border-2 border-zinc-200 dark:border-zinc-800 border-b-4 border-b-zinc-900 dark:border-b-theme-accent shadow-sm transition-colors">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-[11px] font-bold uppercase">
            <span>{selectedVehicle ? 'Biaya Unit Ini' : 'Total Biaya'}</span>
            <div className="p-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 shadow-xs">
              <AnimatedWalletIcon className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-lg md:text-xl font-black font-mono tracking-tight text-zinc-950 dark:text-zinc-100">
              Rp {(totalExpense / 1000).toLocaleString('id-ID')}k
            </span>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">
              BBM (Rp {(totalFuelCost / 1000).toLocaleString('id-ID')}k) + Servis
            </p>
          </div>
        </div>

        {/* Card 2: Rata-rata Efisiensi */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-4 border-2 border-zinc-200 dark:border-zinc-800 border-b-4 border-b-theme-accent shadow-sm transition-colors">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-[11px] font-bold uppercase">
            <span>{selectedVehicle ? 'Efisiensi BBM' : 'Rata-Rata BBM'}</span>
            <div className="p-1.5 rounded-xl bg-theme-accent-subtle text-theme-accent shadow-xs">
              <AnimatedSpeedometerIcon className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-lg md:text-xl font-black font-mono tracking-tight text-zinc-950 dark:text-zinc-100">
              {avgEfficiency} <span className="text-xs font-normal text-zinc-500 dark:text-zinc-400">km/L</span>
            </span>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">
              {selectedVehicle ? `Kapasitas: ${selectedVehicle.tankCapacityLiters}L` : 'Rasio efisiensi armada'}
            </p>
          </div>
        </div>

        {/* Card 3: Biaya Operasional Riil per KM */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-4 border-2 border-zinc-200 dark:border-zinc-800 border-b-4 border-b-zinc-900 dark:border-b-theme-accent shadow-sm transition-colors">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-[11px] font-bold uppercase">
            <span>Cost per KM</span>
            <div className="p-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 shadow-xs">
              <AnimatedArrowRiseIcon className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-lg md:text-xl font-black font-mono tracking-tight text-zinc-950 dark:text-zinc-100">
              {costPerKm > 0 ? `Rp ${costPerKm.toLocaleString('id-ID')}` : 'Rp 0'} <span className="text-xs font-normal text-zinc-500 dark:text-zinc-400">/km</span>
            </span>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">
              {costPerKm > 0 ? 'Beban riil biaya / KM' : 'Jarak & biaya operasional'}
            </p>
          </div>
        </div>

        {/* Card 4: Status Suku Cadang Kritis */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-4 border-2 border-zinc-200 dark:border-zinc-800 border-b-4 border-b-amber-400 shadow-sm transition-colors">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-[11px] font-bold uppercase">
            <span>Suku Cadang</span>
            <div className="p-1.5 rounded-xl bg-amber-500/15 text-amber-500 shadow-xs">
              <AnimatedWrenchIcon className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-lg md:text-xl font-black font-mono tracking-tight text-zinc-950 dark:text-zinc-100">
              {criticalParts.length} <span className="text-xs font-normal text-zinc-500 dark:text-zinc-400">Kritis</span>
            </span>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">
              {criticalParts.length > 0 ? 'Perlu penggantian segera' : 'Kondisi komponen prima'}
            </p>
          </div>
        </div>
      </div>

      {/* 4. FLAGSHIP TELEMATICS SECTION: LIQUID FUEL TANK & SERVICE DIAGNOSTICS */}
      {showcaseVehicle ? (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-theme-accent animate-pulse" />
              <h2 className="text-sm font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                Telematika Aktif: {showcaseVehicle.name} ({showcaseVehicle.plateNumber})
              </h2>
            </div>
            
            {selectedVehicleId === 'all' && vehicles.length > 1 && (
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                Pilih kendaraan pada tab di atas untuk berganti unit
              </span>
            )}

            {selectedVehicle && onNavigateToVehicle && (
              <button
                onClick={() => {
                  triggerHaptic('light');
                  onNavigateToVehicle(selectedVehicle.id);
                }}
                className="text-xs font-extrabold text-theme-accent hover:underline flex items-center gap-1 cursor-pointer self-start sm:self-auto"
              >
                <span>Buka Detail Kendaraan</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Two Prominent Cards Side-by-Side: Liquid Fuel Tank & Service Diagnostics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Card A: Liquid Fuel Wave Chamber & Refill Estimation */}
            <LiquidFuelCard
              vehicle={showcaseVehicle}
              fuelLogs={fuelLogs}
              onAddFuel={(vehId) => onOpenAddFuel(vehId)}
              onOpenAiChat={onOpenAiChat}
            />

            {/* Card B: Service Status & Chassis Diagnostic Blueprint */}
            <ServiceStatusCard
              vehicle={showcaseVehicle}
              serviceRecords={serviceRecords}
              spareParts={spareParts}
              onAddService={(vehId) => onOpenAddService ? onOpenAddService(vehId) : onOpenAddFuel(vehId)}
              onOpenAiChat={onOpenAiChat}
            />
          </div>
        </div>
      ) : (
        /* Empty Garage Banner */
        <div className="p-8 bg-white dark:bg-zinc-900 border-2 border-dashed border-zinc-300 dark:border-zinc-800 rounded-3xl text-center space-y-3">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-theme-accent-subtle text-theme-accent flex items-center justify-center shadow-xs">
            <Fuel className="w-7 h-7 stroke-[2.2]" />
          </div>
          <div>
            <h3 className="font-black text-base text-zinc-900 dark:text-zinc-100">
              Garasi Masih Kosong
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-md mx-auto mt-1 leading-relaxed">
              Daftarkan kendaraan pertama Anda untuk mengaktifkan telematika tangki bensin dengan efek gelombang cairan riil dan pemantauan jadwal servis otomatis.
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('vehicles')}
            className="py-2.5 px-5 bg-theme-accent hover:bg-theme-accent-hover text-theme-accent-fg font-black text-xs uppercase tracking-wider rounded-xl shadow-xs cursor-pointer transition active:scale-95 inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Daftarkan Kendaraan Sekarang</span>
          </button>
        </div>
      )}

      {/* 5. Middle Desktop Section: AI Assistant & Urgent Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: AI Assistant (7 Cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-zinc-900 border-2 border-zinc-900 dark:border-zinc-700 rounded-3xl p-6 shadow-md hover:border-theme-accent dark:hover:border-theme-accent transition-all space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-theme-accent text-theme-accent-fg flex items-center justify-center shadow-md shrink-0">
                <MessageSquare className="w-7 h-7 stroke-[2.4]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base md:text-lg font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
                    Fleet AI Assistant
                  </h2>
                  <span className="px-2 py-0.5 bg-theme-accent-subtle text-zinc-900 dark:text-zinc-100 text-[10px] font-bold rounded-full border border-theme-accent-border">
                    Multimodal
                  </span>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Tanya jadwal servis, kirim foto spedometer, atau analisis konsumsi bensin riil.
                </p>
              </div>
            </div>

            <button
              onClick={() => onOpenAiChat()}
              className="py-3 px-5 bg-zinc-950 hover:bg-zinc-800 dark:bg-theme-accent dark:hover:bg-theme-accent-hover text-white dark:text-theme-accent-fg font-extrabold text-xs uppercase tracking-wider rounded-2xl transition shadow-md shadow-zinc-900/10 active:scale-95 flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              <Sparkles className="w-4 h-4 text-theme-accent dark:text-theme-accent-fg fill-current animate-sparkle-loop" />
              <span>Buka Chat AI</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Dynamic Quick Prompt Pills based on selected vehicle */}
          <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 block mb-2">
              {selectedVehicle ? `Konsultasi Cepat untuk ${selectedVehicle.name}:` : 'Pertanyaan Cepat untuk Armada Anda:'}
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => onOpenAiChat(
                  selectedVehicle 
                    ? `Kapan jadwal servis rutin dan ganti oli berikutnya untuk ${selectedVehicle.name}?`
                    : 'Kapan jadwal ganti oli dan servis rutin untuk armada saya?'
                )}
                className="px-3 py-2 rounded-xl bg-zinc-50 hover:bg-theme-accent-subtle dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 hover:text-zinc-950 text-xs font-medium border border-zinc-200 dark:border-zinc-700 transition cursor-pointer"
              >
                🛠️ Cek rekomendasi servis
              </button>
              <button
                onClick={() => onOpenAiChat(
                  selectedVehicle
                    ? `Berapa konsumsi BBM dan estimasi jarak tempuh tersisa untuk ${selectedVehicle.name}?`
                    : 'Berapa efisiensi konsumsi BBM rata-rata armada saya?'
                )}
                className="px-3 py-2 rounded-xl bg-zinc-50 hover:bg-theme-accent-subtle dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 hover:text-zinc-950 text-xs font-medium border border-zinc-200 dark:border-zinc-700 transition cursor-pointer"
              >
                ⛽ Estimasi sisa bensin & jarak
              </button>
              <button
                onClick={() => onOpenAiChat('Apakah ada pajak STNK atau dokumen yang mendekati jatuh tempo?')}
                className="px-3 py-2 rounded-xl bg-zinc-50 hover:bg-theme-accent-subtle dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 hover:text-zinc-950 text-xs font-medium border border-zinc-200 dark:border-zinc-700 transition cursor-pointer"
              >
                📄 Cek jatuh tempo STNK
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Urgent Alerts & Condition Summary (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-theme-accent-subtle border-2 border-theme-accent-border rounded-3xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-theme-accent animate-heartbeat-loop" />
                <h4 className="font-extrabold text-xs uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                  Peringatan Perawatan
                </h4>
              </div>
              <button
                onClick={() => onNavigateTab('service')}
                className="text-xs font-bold text-theme-accent underline hover:opacity-80 cursor-pointer"
              >
                Buku Servis
              </button>
            </div>

            <div className="space-y-2 text-xs">
              {criticalParts.length === 0 && vehicles.length === 0 ? (
                <div className="p-3 bg-white/80 dark:bg-zinc-900/80 rounded-2xl border border-yellow-200/60 dark:border-yellow-800/60 text-zinc-500 dark:text-zinc-400">
                  Belum ada unit terdaftar. Daftarkan kendaraan pertama Anda untuk mengaktifkan pemantauan otomatis.
                </div>
              ) : criticalParts.length === 0 ? (
                <div className="p-3 bg-white dark:bg-zinc-900 rounded-2xl border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="font-bold">
                    {selectedVehicle ? `${selectedVehicle.name} dalam kondisi prima!` : 'Semua komponen unit dalam kondisi prima!'}
                  </span>
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

      {/* 6. Garasi Armada Unit Showcase Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
              Unit Kendaraan Terdaftar ({vehicles.length})
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Pilih kartu untuk melihat fokus telematika atau buka manajemen penuh
            </p>
          </div>

          <button
            onClick={() => onNavigateTab('vehicles')}
            className="text-xs font-extrabold text-theme-accent hover:underline flex items-center gap-1 cursor-pointer transition"
          >
            <span>Buka Semua Garasi</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* 3 Columns Responsive Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vehicles.length === 0 ? (
            <div className="col-span-full p-8 bg-zinc-50 dark:bg-zinc-900/50 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl text-center text-zinc-500 dark:text-zinc-400 text-xs space-y-3">
              <p>Belum ada kendaraan yang didaftarkan ke dalam sistem garasi.</p>
              <button
                onClick={() => onNavigateTab('vehicles')}
                className="py-2.5 px-4 bg-theme-accent hover:bg-theme-accent-hover text-theme-accent-fg font-black text-xs rounded-xl shadow-xs cursor-pointer transition inline-flex items-center gap-1.5"
              >
                <span>Daftarkan Kendaraan Pertama</span>
              </button>
            </div>
          ) : (
            vehicles.map((veh) => {
              const isSelected = selectedVehicleId === veh.id;
              // Vehicle last fuel log
              const vFuel = fuelLogs
                .filter((l) => l.vehicleId === veh.id)
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
              // Vehicle last service
              const vServ = serviceRecords
                .filter((s) => s.vehicleId === veh.id)
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

              return (
                <div
                  key={veh.id}
                  onClick={() => {
                    triggerHaptic('selection');
                    setSelectedVehicleId(veh.id);
                  }}
                  className={`bg-white dark:bg-zinc-900 border-2 rounded-3xl p-4.5 shadow-sm hover:shadow-md transition-all cursor-pointer space-y-3 group ${
                    isSelected
                      ? 'border-theme-accent ring-2 ring-theme-accent/40 shadow-theme-accent/10'
                      : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600'
                  }`}
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
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-heartbeat-loop" />
                      <span>{veh.healthScore}%</span>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100 group-hover:text-theme-accent transition-colors">
                      {veh.name} <span className="text-zinc-400 dark:text-zinc-500 font-normal">({veh.year})</span>
                    </h4>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1 mt-0.5">
                      {veh.notes || `${veh.fuelType} • Tangki ${veh.tankCapacityLiters}L`}
                    </p>
                  </div>

                  {/* Telematics summary pills */}
                  <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-zinc-100 dark:border-zinc-800 text-xs">
                    <div className="bg-zinc-50 dark:bg-zinc-800/60 p-2 rounded-xl border border-zinc-200/60 dark:border-zinc-700/60">
                      <span className="text-[9px] text-zinc-400 dark:text-zinc-400 block">Odometer</span>
                      <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100 text-[11px] truncate block">
                        {veh.currentOdometerKm.toLocaleString('id-ID')} KM
                      </span>
                    </div>
                    <div className="bg-zinc-50 dark:bg-zinc-800/60 p-2 rounded-xl border border-zinc-200/60 dark:border-zinc-700/60">
                      <span className="text-[9px] text-zinc-400 dark:text-zinc-400 block">Terakhir BBM</span>
                      <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100 text-[11px] truncate block">
                        {vFuel ? `KM ${vFuel.odometerKm.toLocaleString('id-ID')}` : '-'}
                      </span>
                    </div>
                    <div className="bg-zinc-50 dark:bg-zinc-800/60 p-2 rounded-xl border border-zinc-200/60 dark:border-zinc-700/60">
                      <span className="text-[9px] text-zinc-400 dark:text-zinc-400 block">Terakhir Servis</span>
                      <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100 text-[11px] truncate block">
                        {vServ ? `KM ${vServ.odometerKm.toLocaleString('id-ID')}` : '-'}
                      </span>
                    </div>
                  </div>

                  {/* Action Link to Detail */}
                  <div className="flex items-center justify-between pt-1 text-xs">
                    <span className={`text-[11px] font-bold ${isSelected ? 'text-theme-accent' : 'text-zinc-400'}`}>
                      {isSelected ? '✓ Sedang Ditampilkan' : 'Klik untuk Fokus'}
                    </span>
                    {onNavigateToVehicle && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          triggerHaptic('light');
                          onNavigateToVehicle(veh.id);
                        }}
                        className="text-xs font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 flex items-center gap-1"
                      >
                        <span>Kelola</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

    </div>
  );
};
