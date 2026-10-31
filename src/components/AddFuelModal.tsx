import React, { useState } from 'react';
import type { Vehicle, FuelLog, FuelType } from '../types';
import { X, Fuel, Navigation, Loader2, Zap } from 'lucide-react';
import { ModalPortal } from './ModalPortal';

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
            <div className={`p-1.5 rounded-lg ${isElectric ? 'bg-cyan-400 text-zinc-950' : 'bg-vms-accent text-zinc-950'}`}>
              {isElectric ? <Zap className="w-4 h-4 stroke-[2.5]" /> : <Fuel className="w-4 h-4 stroke-[2.5]" />}
            </div>
            <div>
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-zinc-900 dark:text-white">
                {isElectric ? 'Catat Pengisian Baterai Listrik (EV)' : 'Catat Pengisian BBM'}
              </h3>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                {isElectric ? 'Log pengisian daya SPKLU / Home Charger' : 'Log transaksi bensin & efisiensi armada'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3 text-xs">
          <div>
            <label className="block font-bold text-zinc-800 dark:text-zinc-200 mb-1">Pilih Kendaraan</label>
            <select
              value={vehicleId}
              onChange={(e) => handleVehicleChange(e.target.value)}
              className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white focus:outline-none focus:border-zinc-900 dark:focus:border-theme-accent"
            >
              {vehicles.length === 0 ? (
                <option value="">Belum ada kendaraan di garasi</option>
              ) : (
                vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    [{v.plateNumber}] {v.name} ({v.fuelType})
                  </option>
                ))
              )}
            </select>
          </div>

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
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white focus:outline-none focus:border-zinc-900 dark:focus:border-theme-accent"
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

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-bold text-zinc-800 dark:text-zinc-200 mb-1">Total Biaya (Rp)</label>
              <input
                type="number"
                value={totalCost}
                onChange={(e) => setTotalCost(Number(e.target.value))}
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white font-mono focus:outline-none focus:border-zinc-900 dark:focus:border-theme-accent"
                required
              />
            </div>
            <div>
              <label className="block font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                {isElectric ? 'Energi Masuk (kWh)' : 'Volume (Liter)'}
              </label>
              <input
                type="number"
                step="0.01"
                value={liters}
                onChange={(e) => setLiters(Number(e.target.value))}
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white font-mono focus:outline-none focus:border-zinc-900 dark:focus:border-theme-accent"
                required
              />
            </div>
          </div>

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

          {/* SPBU / SPKLU Location & GPS button */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-bold text-zinc-800 dark:text-zinc-200">
                {isElectric ? 'Lokasi SPKLU / Stasiun Pengisian' : 'Lokasi SPBU'}
              </label>
              <button
                type="button"
                onClick={handleGetGpsLocation}
                disabled={isLocating}
                className="text-[10px] text-zinc-950 font-bold flex items-center gap-1 px-2 py-0.5 bg-vms-accent hover:opacity-90 rounded-lg cursor-pointer transition shadow-xs"
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

          {/* Full Tank / 100% SOC Toggle */}
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
            <input
              type="checkbox"
              id="fullChargeCheckbox"
              checked={isFullCharge}
              onChange={(e) => setIsFullCharge(e.target.checked)}
              className="w-4 h-4 rounded text-zinc-900 focus:ring-0 cursor-pointer"
            />
            <label htmlFor="fullChargeCheckbox" className="font-bold text-[11px] text-zinc-800 dark:text-zinc-200 cursor-pointer">
              {isElectric ? 'Pengisian Penuh (100% SOC / Full Battery Charge)' : 'Pengisian Tangki Penuh (Full Tank)'}
            </label>
          </div>

          <button
            type="submit"
            className="w-full py-3 mt-2 bg-vms-accent hover:opacity-90 text-zinc-950 font-black uppercase tracking-wider text-xs rounded-xl transition shadow active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
          >
            {isElectric ? <Zap className="w-4 h-4" /> : <Fuel className="w-4 h-4" />}
            <span>{isElectric ? 'SIMPAN DATA CHARGING (KWH)' : 'SIMPAN PENGISIAN BBM'}</span>
          </button>
        </form>
      </div>
      </div>
    </ModalPortal>
  );
};
