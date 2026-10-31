import React, { useState, useEffect } from 'react';
import type { Vehicle, FuelLog } from '../types';
import { 
  X, 
  Droplet, 
  Gauge, 
  Calendar, 
  Check, 
  Info
} from 'lucide-react';
import { ModalPortal } from './ModalPortal';
import { triggerHaptic } from '../utils/haptics';

interface AdjustFuelModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicles: Vehicle[];
  fuelLogs: FuelLog[];
  onAddFuelLog: (log: FuelLog) => void;
  defaultVehicleId?: string;
}

export const AdjustFuelModal: React.FC<AdjustFuelModalProps> = ({
  isOpen,
  onClose,
  vehicles,
  fuelLogs,
  onAddFuelLog,
  defaultVehicleId,
}) => {
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(
    defaultVehicleId || (vehicles.length > 0 ? vehicles[0].id : '')
  );

  const [incidentType, setIncidentType] = useState<'adjustment_loss' | 'drain' | 'calibration'>('adjustment_loss');
  const [lostLiters, setLostLiters] = useState<number>(1.5);
  const [date, setDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [odometerKm, setOdometerKm] = useState<number>(0);
  const [reasonCategory, setReasonCategory] = useState<string>('Kebocoran Selang BBM');
  const [notes, setNotes] = useState<string>('');
  const [pricePerLiter, setPricePerLiter] = useState<number>(12950);

  const activeVehicle = vehicles.find((v) => v.id === selectedVehicleId) || vehicles[0];

  // Calculate current tank liters from fuelLogs
  const vLogs = fuelLogs
    .filter((l) => l.vehicleId === activeVehicle?.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || b.odometerKm - a.odometerKm);
  const lastLog = vLogs[0];

  const tankCapacity = activeVehicle?.tankCapacityLiters || 5.0;

  // Approximate current liters in tank before incident
  let currentEstimatedLiters = tankCapacity * 0.5; // fallback
  if (lastLog) {
    if (lastLog.totalLitersAfterFill !== undefined && lastLog.totalLitersAfterFill > 0) {
      currentEstimatedLiters = lastLog.totalLitersAfterFill;
    } else if (lastLog.fullTank) {
      currentEstimatedLiters = tankCapacity;
    } else {
      currentEstimatedLiters = Math.min(tankCapacity, lastLog.liters);
    }
    // approximate consumption
    const kmDiff = Math.max(0, (activeVehicle?.currentOdometerKm || 0) - lastLog.odometerKm);
    const eff = lastLog.efficiencyKmPerLiter || (activeVehicle?.category === 'motor' ? 42 : 12);
    if (kmDiff > 0 && eff > 0) {
      currentEstimatedLiters = Math.max(0, currentEstimatedLiters - (kmDiff / eff));
    }
  }
  currentEstimatedLiters = Number(currentEstimatedLiters.toFixed(1));

  useEffect(() => {
    if (activeVehicle) {
      setOdometerKm(activeVehicle.currentOdometerKm);
      // Auto-set reasonable fuel price per liter
      if (activeVehicle.fuelType === 'Pertalite') setPricePerLiter(10000);
      else if (activeVehicle.fuelType === 'Pertamax') setPricePerLiter(12950);
      else if (activeVehicle.fuelType === 'Pertamax Turbo') setPricePerLiter(14400);
      else if (activeVehicle.fuelType === 'Bio Solar') setPricePerLiter(6800);
      else if (activeVehicle.fuelType === 'Dexlite') setPricePerLiter(13700);
      else if (activeVehicle.fuelType === 'Listrik') setPricePerLiter(1699);
    }
  }, [activeVehicle]);

  useEffect(() => {
    if (defaultVehicleId) {
      setSelectedVehicleId(defaultVehicleId);
    }
  }, [defaultVehicleId]);

  if (!isOpen || !activeVehicle) return null;

  const isElectric = activeVehicle.fuelType === 'Listrik';
  const unitLabel = isElectric ? 'kWh' : 'Liter';

  // New tank level after loss
  const newTankLiters = Math.max(0, Number((currentEstimatedLiters - lostLiters).toFixed(1)));
  const newTankPct = Math.round((newTankLiters / tankCapacity) * 100);
  const financialLoss = Math.round(lostLiters * pricePerLiter);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (lostLiters <= 0) {
      alert(`Jumlah ${unitLabel} yang berkurang harus lebih dari 0!`);
      return;
    }

    triggerHaptic('medium');

    const incidentTitles = {
      adjustment_loss: `Anomali: ${reasonCategory}`,
      drain: `Kuras Tangki: ${reasonCategory}`,
      calibration: `Kalibrasi Level: ${reasonCategory}`,
    };

    const newLog: FuelLog = {
      id: `fl-adj-${Date.now()}`,
      vehicleId: activeVehicle.id,
      date,
      fuelType: activeVehicle.fuelType,
      liters: lostLiters,
      totalCost: 0,
      lossCostEstimate: financialLoss,
      odometerKm: Number(odometerKm) || activeVehicle.currentOdometerKm,
      stationName: incidentTitles[incidentType],
      efficiencyKmPerLiter: undefined, // Non-driving loss does NOT reduce engine efficiency
      fullTank: false,
      remainingLitersBeforeFill: currentEstimatedLiters,
      totalLitersAfterFill: newTankLiters,
      isInitialCalibration: false,
      logType: incidentType,
      adjustmentReason: notes ? `${reasonCategory} - ${notes}` : reasonCategory,
    };

    onAddFuelLog(newLog);
    onClose();
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-zinc-950/75 backdrop-blur-md animate-fade-in text-zinc-900 dark:text-zinc-100">
        <div className="w-full max-w-lg bg-white dark:bg-zinc-900 border-2 border-zinc-900 dark:border-zinc-700 rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden transition-all max-h-[92vh] flex flex-col">
          
          {/* Header */}
          <div className="flex items-center justify-between pb-3.5 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-2xl bg-rose-500/15 text-rose-500 border border-rose-500/30">
                <Droplet className="w-5 h-5 fill-current" />
              </div>
              <div>
                <h3 className="font-black text-sm sm:text-base uppercase tracking-wider text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <span>Catat Penyesuaian / Kebocoran BBM</span>
                </h3>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Koreksi level tangki tanpa merusak rumus efisiensi pembakaran mesin
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
            
            {/* Vehicle Selector if multiple */}
            {vehicles.length > 1 && (
              <div>
                <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Pilih Kendaraan
                </label>
                <select
                  value={selectedVehicleId}
                  onChange={(e) => setSelectedVehicleId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl font-bold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 dark:focus:border-yellow-400"
                >
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.plateNumber}) • Tangki {v.tankCapacityLiters} L
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Current Estimated Tank Condition Banner */}
            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>Kondisi Tangki Saat Ini (Sebelum Insiden):</span>
                </span>
                <span className="font-mono font-black text-amber-950 dark:text-amber-200">
                  ± {currentEstimatedLiters} / {tankCapacity} {unitLabel} ({Math.round((currentEstimatedLiters / tankCapacity) * 100)}%)
                </span>
              </div>

              {/* Progress visual before vs after */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                  <span>Sisa Sebelum: {currentEstimatedLiters} {unitLabel}</span>
                  <span className="text-rose-600 dark:text-rose-400 font-bold">
                    Sisa Baru: {newTankLiters} {unitLabel} ({newTankPct}%)
                  </span>
                </div>
                <div className="w-full h-3 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden p-0.5 relative">
                  <div 
                    className="h-full bg-amber-400/50 rounded-full"
                    style={{ width: `${Math.min(100, (currentEstimatedLiters / tankCapacity) * 100)}%` }}
                  />
                  <div 
                    className="h-full bg-rose-500 rounded-full absolute top-0.5 left-0.5"
                    style={{ width: `${Math.min(100, (newTankLiters / tankCapacity) * 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Incident Type Selector */}
            <div>
              <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Kategori Insiden / Penyesuaian
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setIncidentType('adjustment_loss');
                    setReasonCategory('Kebocoran Selang BBM');
                  }}
                  className={`p-2.5 rounded-xl border-2 text-center transition cursor-pointer font-bold text-[11px] ${
                    incidentType === 'adjustment_loss'
                      ? 'bg-rose-500 text-white border-rose-500 shadow-xs'
                      : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-zinc-400'
                  }`}
                >
                  <span className="block text-xs">💧 Bocor / Rembes</span>
                  <span className="text-[10px] opacity-80 font-normal">Selang / klem</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setIncidentType('drain');
                    setReasonCategory('Kuras Tangki / Servis Pompa');
                  }}
                  className={`p-2.5 rounded-xl border-2 text-center transition cursor-pointer font-bold text-[11px] ${
                    incidentType === 'drain'
                      ? 'bg-orange-500 text-white border-orange-500 shadow-xs'
                      : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-zinc-400'
                  }`}
                >
                  <span className="block text-xs">🛢️ Kuras Tangki</span>
                  <span className="text-[10px] opacity-80 font-normal">Servis / kemasukan air</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setIncidentType('calibration');
                    setReasonCategory('Koreksi Pelampung Spedometer');
                  }}
                  className={`p-2.5 rounded-xl border-2 text-center transition cursor-pointer font-bold text-[11px] ${
                    incidentType === 'calibration'
                      ? 'bg-zinc-900 text-white dark:bg-yellow-400 dark:text-zinc-950 border-zinc-900 dark:border-yellow-400 shadow-xs'
                      : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-zinc-400'
                  }`}
                >
                  <span className="block text-xs">⚙️ Kalibrasi Level</span>
                  <span className="text-[10px] opacity-80 font-normal">Koreksi sensor</span>
                </button>
              </div>
            </div>

            {/* Liters Lost and Quick Buttons */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-zinc-700 dark:text-zinc-300">
                  Jumlah {unitLabel} yang Hilang / Dikurangi
                </label>
                <span className="font-mono font-bold text-rose-600 dark:text-rose-400 text-xs">
                  -{lostLiters} {unitLabel}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max={currentEstimatedLiters}
                  value={lostLiters}
                  onChange={(e) => setLostLiters(Math.max(0.1, Math.min(currentEstimatedLiters, Number(e.target.value) || 0.1)))}
                  className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800 border-2 border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 font-mono font-black text-sm focus:outline-none focus:border-rose-500"
                  required
                />
                <span className="font-bold text-zinc-400 shrink-0">{unitLabel}</span>
              </div>

              {/* Quick loss pills */}
              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                <span className="text-[10px] text-zinc-400 font-bold">Pilih Cepat:</span>
                {[0.5, 1.0, 1.5, 2.0, 3.0, currentEstimatedLiters].map((val, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      setLostLiters(Math.min(currentEstimatedLiters, val));
                    }}
                    className={`px-2 py-0.5 rounded-lg border text-[10px] font-mono font-bold transition cursor-pointer ${
                      lostLiters === val
                        ? 'bg-rose-500 text-white border-rose-500 shadow-xs'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-rose-400'
                    }`}
                  >
                    {val === currentEstimatedLiters ? 'Kuras Habis' : `-${val}L`}
                  </button>
                ))}
              </div>
            </div>

            {/* Financial Loss Calculation */}
            <div className="grid grid-cols-2 gap-2.5 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60">
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 mb-1">
                  Harga Satuan BBM ({activeVehicle.fuelType})
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-[10px] text-zinc-400 font-mono">Rp</span>
                  <input
                    type="number"
                    value={pricePerLiter}
                    onChange={(e) => setPricePerLiter(Number(e.target.value))}
                    className="w-full pl-8 pr-2 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg font-mono font-bold text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 mb-1">
                  Estimasi Kerugian Finansial
                </label>
                <div className="py-1.5 px-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-lg text-rose-700 dark:text-rose-300 font-mono font-black text-xs">
                  Rp {financialLoss.toLocaleString('id-ID')}
                </div>
              </div>
            </div>

            {/* Odometer & Date */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Odometer Saat Insiden (KM)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-zinc-400">
                    <Gauge className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="number"
                    value={odometerKm}
                    onChange={(e) => setOdometerKm(Number(e.target.value))}
                    className="w-full pl-8 pr-2.5 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl font-mono font-bold text-zinc-900 dark:text-zinc-100"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Tanggal Kejadian
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
            </div>

            {/* Specific Reason & Notes */}
            <div>
              <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                Keterangan Detail / Penyebab
              </label>
              <input
                type="text"
                placeholder="Contoh: Selang bensin retak di dekat sambungan injektor, sudah diganti baru di bengkel"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 dark:focus:border-yellow-400"
              />
            </div>

            {/* Telematics Impact Banner */}
            <div className="p-3 bg-zinc-100 dark:bg-zinc-800/80 rounded-2xl text-[11px] text-zinc-600 dark:text-zinc-400 space-y-1">
              <span className="font-bold text-zinc-800 dark:text-zinc-200 block">
                🛡️ Transparansi Data Telematika:
              </span>
              <p>
                Penyesuaian ini akan langsung memperbarui level bensin di Dashboard menjadi{' '}
                <strong className="text-zinc-900 dark:text-zinc-100 font-mono">{newTankLiters} {unitLabel}</strong>,{' '}
                namun <strong>TIDAK AKAN</strong> dihitung sebagai bensin boros oleh mesin pada grafik efisiensi KM/L.
              </p>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3.5 bg-rose-600 hover:bg-rose-500 text-white font-black uppercase tracking-wider text-xs rounded-2xl transition shadow-md shadow-rose-600/20 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Simpan Penyesuaian & Potong Level Bensin</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </ModalPortal>
  );
};
