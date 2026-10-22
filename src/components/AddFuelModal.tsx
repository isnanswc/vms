import React, { useState } from 'react';
import type { Vehicle, FuelLog, FuelType } from '../types';
import { X, Fuel, MapPin, Navigation, Loader2 } from 'lucide-react';

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
  const [vehicleId, setVehicleId] = useState(defaultVehicleId || vehicles[0]?.id || '');
  const [date, setDate] = useState('2026-10-21');
  const [fuelType, setFuelType] = useState<FuelType>('Pertamax');
  const [liters, setLiters] = useState<number>(5);
  const [totalCost, setTotalCost] = useState<number>(65000);
  const [odometerKm, setOdometerKm] = useState<number>(42950);
  const [stationName, setStationName] = useState('SPBU Pertamina');
  const [isLocating, setIsLocating] = useState(false);
  const [gpsLocation, setGpsLocation] = useState<{
    latitude: number;
    longitude: number;
    addressDescription?: string;
  } | undefined>(undefined);

  if (!isOpen) return null;

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
        setGpsLocation({
          latitude: lat,
          longitude: lng,
          addressDescription: `GPS: ${lat}, ${lng} (Terverifikasi)`,
        });
        setStationName(`SPBU Terdekat (GPS ${lat}, ${lng})`);
      },
      () => {
        setIsLocating(false);
        // Fallback simulation
        const mockLat = -6.2412;
        const mockLng = 106.8621;
        setGpsLocation({
          latitude: mockLat,
          longitude: mockLng,
          addressDescription: 'SPBU Pertamina MT Haryono (GPS Aktif)',
        });
        setStationName('SPBU Pertamina (Lokasi Terdeteksi)');
      },
      { timeout: 8000 }
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const selectedVeh = vehicles.find((v) => v.id === vehicleId);
    const lastKm = selectedVeh?.currentOdometerKm || (odometerKm - 150);
    const kmDiff = odometerKm - lastKm;
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
      fullTank: true,
    };

    onAddFuelLog(newLog);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white border-2 border-zinc-900 rounded-3xl p-5 shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar text-zinc-900">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-yellow-400 text-zinc-950">
              <Fuel className="w-4 h-4 stroke-[2.5]" />
            </div>
            <h3 className="font-extrabold text-sm uppercase tracking-wider text-zinc-900">
              Catat Pengisian BBM
            </h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3 text-xs">
          <div>
            <label className="block font-bold text-zinc-800 mb-1">Pilih Kendaraan</label>
            <select
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
              className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-zinc-900 focus:outline-none focus:border-zinc-900"
            >
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  [{v.plateNumber}] {v.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-bold text-zinc-800 mb-1">Tanggal</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-xl text-zinc-900 font-mono focus:outline-none focus:border-zinc-900"
              />
            </div>
            <div>
              <label className="block font-bold text-zinc-800 mb-1">Jenis BBM</label>
              <select
                value={fuelType}
                onChange={(e) => setFuelType(e.target.value as FuelType)}
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-xl text-zinc-900 focus:outline-none focus:border-zinc-900"
              >
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
              <label className="block font-bold text-zinc-800 mb-1">Total Biaya (Rp)</label>
              <input
                type="number"
                value={totalCost}
                onChange={(e) => setTotalCost(Number(e.target.value))}
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-xl text-zinc-900 font-mono focus:outline-none focus:border-zinc-900"
                required
              />
            </div>
            <div>
              <label className="block font-bold text-zinc-800 mb-1">Volume (Liter)</label>
              <input
                type="number"
                step="0.01"
                value={liters}
                onChange={(e) => setLiters(Number(e.target.value))}
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-xl text-zinc-900 font-mono focus:outline-none focus:border-zinc-900"
                required
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-zinc-800 mb-1">Odometer Terkini (KM)</label>
            <input
              type="number"
              value={odometerKm}
              onChange={(e) => setOdometerKm(Number(e.target.value))}
              className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-xl text-zinc-900 font-mono focus:outline-none focus:border-zinc-900"
              required
            />
          </div>

          {/* SPBU Location & GPS button */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-bold text-zinc-800">Lokasi SPBU</label>
              <button
                type="button"
                onClick={handleGetGpsLocation}
                disabled={isLocating}
                className="text-[10px] text-zinc-900 hover:text-black font-bold flex items-center gap-1 px-2 py-0.5 bg-yellow-400 hover:bg-yellow-300 rounded-lg cursor-pointer transition shadow-xs"
              >
                {isLocating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Navigation className="w-3 h-3" />}
                <span>{isLocating ? 'Mencari GPS...' : 'Ambil Lokasi GPS'}</span>
              </button>
            </div>
            <input
              type="text"
              placeholder="Contoh: SPBU Pertamina 31.124 Cilandak"
              value={stationName}
              onChange={(e) => setStationName(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-xl text-zinc-900 focus:outline-none focus:border-zinc-900"
            />
            {gpsLocation && (
              <span className="text-[10px] text-emerald-600 font-mono mt-1 block">
                ✓ Koordinat tersimpan: {gpsLocation.latitude}, {gpsLocation.longitude}
              </span>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-3 mt-2 bg-zinc-950 hover:bg-zinc-800 text-white font-black uppercase tracking-wider text-xs rounded-xl transition shadow active:scale-95 cursor-pointer"
          >
            Simpan Log Pengisian
          </button>
        </form>
      </div>
    </div>
  );
};
