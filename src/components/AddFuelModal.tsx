import React, { useState } from 'react';
import type { Vehicle, FuelLog, FuelType } from '../types';
import { X, Fuel, Navigation, Loader2, Zap, Gauge } from 'lucide-react';
import { ModalPortal } from './ModalPortal';
import { triggerHaptic } from '../utils/haptics';

interface AddFuelModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicles: Vehicle[];
  onAddFuelLog: (log: FuelLog) => void;
  defaultVehicleId?: string;
}

export const AddFuelModal: React.FC<AddFuelModalProps> = ({
  isOpen,
  onClose,
  vehicles,
  onAddFuelLog,
  defaultVehicleId,
}) => {
  const initialVeh = vehicles.find((v) => v.id === (defaultVehicleId || vehicles[0]?.id)) || vehicles[0];
  const [vehicleId, setVehicleId] = useState(initialVeh?.id || '');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [fuelType, setFuelType] = useState<FuelType>(initialVeh?.fuelType || 'Pertamax');
  const [liters, setLiters] = useState<number>(initialVeh?.fuelType === 'Listrik' ? 20 : 10);
  const [totalCost, setTotalCost] = useState<number>(initialVeh?.fuelType === 'Listrik' ? 50000 : 100000);
  const [odometerKm, setOdometerKm] = useState<number>(initialVeh?.currentOdometerKm || 0);
  const [isFullCharge, setIsFullCharge] = useState(true);
  
  // Partial Fill & Tank Level Before Fill State
  const [tankLevelPreset, setTankLevelPreset] = useState<'reserve' | 'quarter' | 'half' | 'three_quarter' | 'custom'>('quarter');
  const [customRemainingLiters, setCustomRemainingLiters] = useState<number>(1.0);

  const [stationName, setStationName] = useState(
    initialVeh?.fuelType === 'Listrik' ? 'SPKLU PLN Gambir' : 'SPBU Pertamina'
  );
  const [isLocating, setIsLocating] = useState(false);
  const [gpsLocation, setGpsLocation] = useState<{
    latitude: number;
    longitude: number;
    addressDescription?: string;
  } | undefined>(undefined);

  if (!isOpen) return null;

  if (vehicles.length === 0) {
    return (
      <ModalPortal>
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/75 backdrop-blur-md animate-fade-in text-zinc-900 dark:text-zinc-100">
          <div className="w-full max-w-sm bg-white dark:bg-zinc-900 border-2 border-zinc-900 dark:border-zinc-700 rounded-3xl p-6 shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-theme-accent-subtle text-theme-accent border border-theme-accent-border flex items-center justify-center mx-auto shadow-xs">
              <Fuel className="w-7 h-7 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="font-black text-base text-zinc-900 dark:text-zinc-100">Belum Ada Kendaraan</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 leading-relaxed">
                Pencatatan BBM memerlukan kendaraan terdaftar di garasi. Silakan daftarkan kendaraan terlebih dahulu.
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-full py-3 bg-theme-accent hover:bg-theme-accent-hover text-theme-accent-fg font-black text-xs uppercase tracking-wider rounded-2xl transition shadow-xs cursor-pointer active:scale-95"
            >
              Tutup
            </button>
          </div>
        </div>
      </ModalPortal>
    );
  }

  const currentVehicle = vehicles.find((v) => v.id === vehicleId);
  const isElectric = fuelType === 'Listrik' || currentVehicle?.fuelType === 'Listrik';
  const tankCapacity = currentVehicle?.tankCapacityLiters || (isElectric ? 40 : 5.5);

  // Calculate remaining liters before fill
  const calculateRemainingBeforeFill = (): number => {
    switch (tankLevelPreset) {
      case 'reserve':
        return Number((tankCapacity * 0.15).toFixed(1));
      case 'quarter':
        return Number((tankCapacity * 0.25).toFixed(1));
      case 'half':
        return Number((tankCapacity * 0.50).toFixed(1));
      case 'three_quarter':
        return Number((tankCapacity * 0.75).toFixed(1));
      case 'custom':
        return customRemainingLiters;
      default:
        return Number((tankCapacity * 0.25).toFixed(1));
    }
  };

  const effectiveRemainingBefore = calculateRemainingBeforeFill();
  const totalAfterFill = isFullCharge 
    ? tankCapacity 
    : Math.min(tankCapacity, Number((effectiveRemainingBefore + Number(liters)).toFixed(2)));
  const pctAfterFill = Math.min(100, Math.round((totalAfterFill / tankCapacity) * 100));

  const handleVehicleChange = (newVehId: string) => {
    setVehicleId(newVehId);
    const targetVeh = vehicles.find((v) => v.id === newVehId);
    if (targetVeh) {
      setFuelType(targetVeh.fuelType);
      setOdometerKm(targetVeh.currentOdometerKm);
      if (targetVeh.fuelType === 'Listrik') {
        setStationName('SPKLU PLN / Home Charger');
        setLiters(20);
        setTotalCost(50000);
      } else {
        setStationName('SPBU Pertamina');
        setLiters(10);
        setTotalCost(100000);
      }
    }
  };

  // Handle GPS detection
  const handleGetGpsLocation = () => {
    if (!navigator.geolocation) {
      alert('Browser Anda tidak mendukung Geolocation GPS.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const lat = parseFloat(pos.coords.latitude.toFixed(4));
        const lng = parseFloat(pos.coords.longitude.toFixed(4));
        const locationType = isElectric ? 'SPKLU' : 'SPBU';
        setGpsLocation({
          latitude: lat,
          longitude: lng,
          addressDescription: `GPS: ${lat}, ${lng} (Terverifikasi)`,
        });
        setStationName(`${locationType} Terdekat (GPS ${lat}, ${lng})`);
      },
      () => {
        setIsLocating(false);
        setGpsLocation(undefined);
      },
      { timeout: 8000 }
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const selectedVeh = vehicles.find((v) => v.id === vehicleId);
    const lastKm = selectedVeh?.currentOdometerKm;
    const kmDiff = lastKm !== undefined && odometerKm > lastKm ? odometerKm - lastKm : 0;
    const eff = kmDiff > 0 && liters > 0 ? Number((kmDiff / liters).toFixed(1)) : undefined;

    const newLog: FuelLog = {
      id: `fl-${Date.now()}`,
      vehicleId,
      date,
      fuelType,
      liters: Number(liters),
      totalCost: Number(totalCost),
      odometerKm: Number(odometerKm),
      stationName,
      gpsLocation,
      efficiencyKmPerLiter: eff,
      fullTank: isFullCharge,
      remainingLitersBeforeFill: isFullCharge ? undefined : effectiveRemainingBefore,
      totalLitersAfterFill: totalAfterFill,
    };

    onAddFuelLog(newLog);
    onClose();
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/75 backdrop-blur-md animate-fade-in">
        <div className="w-full max-w-md bg-white dark:bg-zinc-900 border-2 border-zinc-900 dark:border-zinc-800 rounded-3xl p-5 shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar text-zinc-900 dark:text-zinc-100">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-lg ${isElectric ? 'bg-cyan-400 text-zinc-950' : 'bg-theme-accent text-theme-accent-fg'}`}>
                {isElectric ? <Zap className="w-4 h-4 stroke-[2.5]" /> : <Fuel className="w-4 h-4 stroke-[2.5]" />}
              </div>
              <div>
                <h3 className="font-extrabold text-sm uppercase tracking-wider text-zinc-900 dark:text-white">
                  {isElectric ? 'Catat Pengisian Baterai Listrik (EV)' : 'Catat Pengisian BBM'}
                </h3>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                  {isElectric ? 'Log pengisian daya SPKLU / Home Charger' : 'Log transaksi bensin & kalibrasi level tangki'}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
            {/* Vehicle Selector */}
            <div>
              <label className="block font-bold text-zinc-800 dark:text-zinc-200 mb-1">Pilih Kendaraan</label>
              <select
                value={vehicleId}
                onChange={(e) => handleVehicleChange(e.target.value)}
                className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white focus:outline-none focus:border-zinc-900 dark:focus:border-theme-accent font-bold"
              >
                {vehicles.length === 0 ? (
                  <option value="">Belum ada kendaraan di garasi</option>
                ) : (
                  vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      [{v.plateNumber}] {v.name} ({v.fuelType} - Tangki {v.tankCapacityLiters}L)
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Date & Fuel Type */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-bold text-zinc-800 dark:text-zinc-200 mb-1">Tanggal</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white font-mono focus:outline-none focus:border-zinc-900 dark:focus:border-theme-accent"
                />
              </div>
              <div>
                <label className="block font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                  {isElectric ? 'Tipe Pengisian' : 'Jenis BBM'}
                </label>
                <select
                  value={fuelType}
                  onChange={(e) => setFuelType(e.target.value as FuelType)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white focus:outline-none focus:border-zinc-900 dark:focus:border-theme-accent font-medium"
                >
                  <option value="Listrik">Listrik (SPKLU / Charger)</option>
                  <option value="Pertalite">Pertalite</option>
                  <option value="Pertamax">Pertamax</option>
                  <option value="Pertamax Turbo">Pertamax Turbo</option>
                  <option value="Bio Solar">Bio Solar</option>
                  <option value="Dexlite">Dexlite</option>
                </select>
              </div>
            </div>

            {/* Total Cost & Liters Filled */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-bold text-zinc-800 dark:text-zinc-200 mb-1">Total Biaya (Rp)</label>
                <input
                  type="number"
                  value={totalCost}
                  onChange={(e) => setTotalCost(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white font-mono font-bold focus:outline-none focus:border-zinc-900 dark:focus:border-theme-accent"
                  required
                />
              </div>
              <div>
                <label className="block font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                  {isElectric ? 'Energi Masuk (kWh)' : 'Volume Diisi (Liter)'}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={liters}
                  onChange={(e) => setLiters(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white font-mono font-bold focus:outline-none focus:border-zinc-900 dark:focus:border-theme-accent"
                  required
                />
              </div>
            </div>

            {/* Current Odometer */}
            <div>
              <label className="block font-bold text-zinc-800 dark:text-zinc-200 mb-1">Odometer Terkini (KM)</label>
              <input
                type="number"
                value={odometerKm}
                onChange={(e) => setOdometerKm(Number(e.target.value))}
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white font-mono focus:outline-none focus:border-zinc-900 dark:focus:border-theme-accent"
                required
              />
            </div>

            {/* Mode Pengisian: Full Tank vs Partial Fill */}
            <div className="space-y-2 pt-1 border-t border-zinc-100 dark:border-zinc-800">
              <label className="block font-bold text-zinc-800 dark:text-zinc-200">
                Mode Pengisian
              </label>
              
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('selection');
                    setIsFullCharge(true);
                  }}
                  className={`p-2.5 rounded-xl border-2 text-left transition cursor-pointer ${
                    isFullCharge
                      ? 'border-theme-accent bg-theme-accent-subtle/50 text-zinc-900 dark:text-zinc-100 ring-1 ring-theme-accent'
                      : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 text-zinc-500'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-extrabold text-xs">Isi Penuh (Full)</span>
                    {isFullCharge && <span className="w-2 h-2 rounded-full bg-theme-accent" />}
                  </div>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                    Otomatis 100% ({tankCapacity} {isElectric ? 'kWh' : 'L'})
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('selection');
                    setIsFullCharge(false);
                  }}
                  className={`p-2.5 rounded-xl border-2 text-left transition cursor-pointer ${
                    !isFullCharge
                      ? 'border-theme-accent bg-theme-accent-subtle/50 text-zinc-900 dark:text-zinc-100 ring-1 ring-theme-accent'
                      : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 text-zinc-500'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-extrabold text-xs">Isi Sebagian</span>
                    {!isFullCharge && <span className="w-2 h-2 rounded-full bg-theme-accent" />}
                  </div>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                    Akumulasi bensin sisa + baru
                  </p>
                </button>
              </div>

              {/* Conditional Partial Fill Panel: Tank Level Before Fill */}
              {!isFullCharge && (
                <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 space-y-2.5 animate-page-enter">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-[11px] text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                      <Gauge className="w-3.5 h-3.5 text-theme-accent" />
                      <span>Kondisi Tangki Sebelum Diisi:</span>
                    </span>
                    <span className="font-mono font-bold text-xs text-theme-accent">
                      ~{effectiveRemainingBefore} {isElectric ? 'kWh' : 'L'}
                    </span>
                  </div>

                  {/* Preset Balok Spedometer */}
                  <div className="grid grid-cols-4 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setTankLevelPreset('reserve')}
                      className={`py-1.5 px-2 rounded-lg border text-center transition cursor-pointer ${
                        tankLevelPreset === 'reserve'
                          ? 'bg-rose-500 text-white font-bold border-rose-600'
                          : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700'
                      }`}
                    >
                      <span className="text-[10px] block">🔴 Kedip</span>
                      <span className="text-[9px] opacity-80 font-mono">~15%</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTankLevelPreset('quarter')}
                      className={`py-1.5 px-2 rounded-lg border text-center transition cursor-pointer ${
                        tankLevelPreset === 'quarter'
                          ? 'bg-amber-500 text-white font-bold border-amber-600'
                          : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700'
                      }`}
                    >
                      <span className="text-[10px] block">🟡 1-2 Bar</span>
                      <span className="text-[9px] opacity-80 font-mono">25%</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTankLevelPreset('half')}
                      className={`py-1.5 px-2 rounded-lg border text-center transition cursor-pointer ${
                        tankLevelPreset === 'half'
                          ? 'bg-theme-accent text-theme-accent-fg font-bold border-theme-accent-hover'
                          : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700'
                      }`}
                    >
                      <span className="text-[10px] block">🟢 3 Bar</span>
                      <span className="text-[9px] opacity-80 font-mono">50%</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTankLevelPreset('custom')}
                      className={`py-1.5 px-2 rounded-lg border text-center transition cursor-pointer ${
                        tankLevelPreset === 'custom'
                          ? 'bg-zinc-950 text-white font-bold border-zinc-800'
                          : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700'
                      }`}
                    >
                      <span className="text-[10px] block">⚪ Manual</span>
                      <span className="text-[9px] opacity-80 font-mono">Ketik L</span>
                    </button>
                  </div>

                  {/* Manual input if custom */}
                  {tankLevelPreset === 'custom' && (
                    <div className="flex items-center gap-2 pt-1">
                      <label className="text-[11px] text-zinc-500 whitespace-nowrap">Ketik Sisa Sebelum Isi:</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max={tankCapacity}
                        value={customRemainingLiters}
                        onChange={(e) => setCustomRemainingLiters(Number(e.target.value))}
                        className="w-24 px-2 py-1 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg font-mono font-bold text-center focus:outline-none"
                      />
                      <span className="text-xs text-zinc-400">{isElectric ? 'kWh' : 'Liter'}</span>
                    </div>
                  )}

                  {/* Real-time Math Summary & Visual Progress */}
                  <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-700 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-zinc-500">Kalkulasi Tangki Baru:</span>
                      <span className="font-mono font-black text-zinc-900 dark:text-zinc-100">
                        {effectiveRemainingBefore} L (Sisa) + {liters} L (Baru) = <span className="text-theme-accent font-bold">{totalAfterFill} L ({pctAfterFill}%)</span>
                      </span>
                    </div>

                    <div className="w-full bg-zinc-200 dark:bg-zinc-700 h-2.5 rounded-full overflow-hidden flex">
                      {/* Portion 1: Remaining fuel */}
                      <div 
                        className="bg-amber-400 h-full"
                        style={{ width: `${Math.round((effectiveRemainingBefore / tankCapacity) * 100)}%` }}
                        title={`Sisa Sebelum Isi: ${effectiveRemainingBefore} L`}
                      />
                      {/* Portion 2: Newly filled fuel */}
                      <div 
                        className="bg-emerald-500 h-full"
                        style={{ width: `${Math.round((Number(liters) / tankCapacity) * 100)}%` }}
                        title={`Baru Diisi: ${liters} L`}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* SPBU / SPKLU Location */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-bold text-zinc-800 dark:text-zinc-200">
                  {isElectric ? 'Lokasi SPKLU / Stasiun Pengisian' : 'Lokasi SPBU'}
                </label>
                <button
                  type="button"
                  onClick={handleGetGpsLocation}
                  disabled={isLocating}
                  className="text-[10px] text-zinc-950 font-bold flex items-center gap-1 px-2 py-0.5 bg-theme-accent hover:opacity-90 rounded-lg cursor-pointer transition shadow-xs"
                >
                  {isLocating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Navigation className="w-3 h-3" />}
                  <span>{isLocating ? 'Mencari GPS...' : 'Ambil Lokasi GPS'}</span>
                </button>
              </div>
              <input
                type="text"
                placeholder={isElectric ? 'Contoh: SPKLU PLN Gambir / Home Charger' : 'Contoh: SPBU Pertamina 31.124 Cilandak'}
                value={stationName}
                onChange={(e) => setStationName(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white focus:outline-none focus:border-zinc-900 dark:focus:border-theme-accent"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 mt-2 bg-theme-accent hover:bg-theme-accent-hover text-theme-accent-fg font-black uppercase tracking-wider text-xs rounded-xl transition shadow active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
            >
              {isElectric ? <Zap className="w-4 h-4" /> : <Fuel className="w-4 h-4" />}
              <span>{isElectric ? 'SIMPAN PENGISIAN DAYA' : 'SIMPAN PENGISIAN BBM'}</span>
            </button>
          </form>
        </div>
      </div>
    </ModalPortal>
  );
};
