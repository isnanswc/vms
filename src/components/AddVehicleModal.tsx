import React, { useState } from 'react';
import type { Vehicle, VehicleCategory, FuelType } from '../types';
import { X, Sparkles, Car } from 'lucide-react';

interface AddVehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (vehicle: Vehicle) => void;
}

export const AddVehicleModal: React.FC<AddVehicleModalProps> = ({
  isOpen,
  onClose,
  onAdd,
}) => {
  const [name, setName] = useState('');
  const [year, setYear] = useState(2020);
  const [plateNumber, setPlateNumber] = useState('');
  const [category, setCategory] = useState<VehicleCategory>('motor');
  const [fuelType, setFuelType] = useState<FuelType>('Pertamax');
  const [tankCapacityLiters, setTankCapacityLiters] = useState(5.0);
  const [maxCargoWeightKg, setMaxCargoWeightKg] = useState<number | undefined>(150);
  const [currentOdometerKm, setCurrentOdometerKm] = useState(15000);
  const [stnkExpiryDate, setStnkExpiryDate] = useState('2027-10-21');
  const [notes, setNotes] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  if (!isOpen) return null;

  const handleAiLookup = () => {
    setIsAiLoading(true);
    setTimeout(() => {
      setIsAiLoading(false);
      const query = name.toLowerCase();

      if (query.includes('vario')) {
        setName('Honda Vario 125 eSP');
        setYear(2015);
        setCategory('motor');
        setFuelType('Pertamax');
        setTankCapacityLiters(5.5);
        setMaxCargoWeightKg(150);
        setNotes('Motor matic harian injeksi PGM-FI');
      } else if (query.includes('gran max') || query.includes('truk') || query.includes('box')) {
        setName('Daihatsu Gran Max Blind Van 1.3');
        setCategory('truk');
        setFuelType('Pertalite');
        setTankCapacityLiters(43);
        setMaxCargoWeightKg(1000);
        setNotes('Kendaraan niaga logistik distribusi kargo');
      } else if (query.includes('avanza') || query.includes('xenia')) {
        setName('Toyota Avanza 1.3 G');
        setCategory('mobil');
        setFuelType('Pertamax');
        setTankCapacityLiters(45);
        setMaxCargoWeightKg(500);
        setNotes('Mobil operasional armada 7-seater');
      } else if (query.includes('forklift')) {
        setName('Toyota Forklift 3-Ton FD30');
        setCategory('forklift');
        setFuelType('Bio Solar');
        setTankCapacityLiters(60);
        setMaxCargoWeightKg(3000);
        setNotes('Alat berat material handling gudang');
      }
    }, 500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !plateNumber) return;

    const newVehicle: Vehicle = {
      id: `veh-${Date.now()}`,
      name,
      year: Number(year),
      plateNumber: plateNumber.toUpperCase(),
      category,
      fuelType,
      tankCapacityLiters: Number(tankCapacityLiters),
      maxCargoWeightKg: maxCargoWeightKg ? Number(maxCargoWeightKg) : undefined,
      currentOdometerKm: Number(currentOdometerKm),
      healthScore: 100,
      stnkExpiryDate,
      stnkTaxCostAnnual: category === 'motor' ? 280000 : 2500000,
      notes,
    };

    onAdd(newVehicle);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white border-2 border-zinc-900 rounded-3xl p-5 shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar text-zinc-900">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-yellow-400 text-zinc-950">
              <Car className="w-4 h-4" />
            </div>
            <h3 className="font-extrabold text-sm uppercase tracking-wider text-zinc-900">
              Tambah Kendaraan Baru
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* AI Quick Lookup Suggestion Box */}
        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-300 rounded-2xl flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-yellow-600 shrink-0" />
            <span className="text-[11px] text-zinc-800">
              Ketik nama model (misal: <em>"Vario 2015"</em>) lalu tekan AI Autofill.
            </span>
          </div>
          <button
            type="button"
            onClick={handleAiLookup}
            disabled={!name || isAiLoading}
            className="px-2.5 py-1 bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-zinc-950 text-[10px] font-black uppercase rounded-lg transition shrink-0 cursor-pointer shadow-xs"
          >
            {isAiLoading ? 'Mencari...' : 'AI Autofill'}
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-3 text-xs">
          <div>
            <label className="block font-bold text-zinc-800 mb-1">
              Merk & Model Kendaraan <span className="text-yellow-600">*</span>
            </label>
            <input
              type="text"
              placeholder="Contoh: Honda Vario 125, Gran Max Box"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-zinc-900 focus:outline-none focus:border-zinc-900"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-bold text-zinc-800 mb-1">
                Plat Nomor <span className="text-yellow-600">*</span>
              </label>
              <input
                type="text"
                placeholder="B 1234 XYZ"
                value={plateNumber}
                onChange={(e) => setPlateNumber(e.target.value)}
                className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-zinc-900 font-mono uppercase focus:outline-none focus:border-zinc-900"
                required
              />
            </div>
            <div>
              <label className="block font-bold text-zinc-800 mb-1">Tahun Pembuatan</label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-zinc-900 font-mono focus:outline-none focus:border-zinc-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-bold text-zinc-800 mb-1">Kategori</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as VehicleCategory)}
                className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-zinc-900 focus:outline-none focus:border-zinc-900"
              >
                <option value="motor">Motor</option>
                <option value="mobil">Mobil</option>
                <option value="truk">Truk / Logistik</option>
                <option value="forklift">Forklift / Alat Berat</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-zinc-800 mb-1">Tipe BBM</label>
              <select
                value={fuelType}
                onChange={(e) => setFuelType(e.target.value as FuelType)}
                className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-zinc-900 focus:outline-none focus:border-zinc-900"
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
              <label className="block font-bold text-zinc-800 mb-1">Kapasitas Tangki (L)</label>
              <input
                type="number"
                step="0.1"
                value={tankCapacityLiters}
                onChange={(e) => setTankCapacityLiters(Number(e.target.value))}
                className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-zinc-900 font-mono focus:outline-none focus:border-zinc-900"
              />
            </div>
            <div>
              <label className="block font-bold text-zinc-800 mb-1">Max Muatan (KG)</label>
              <input
                type="number"
                placeholder="150"
                value={maxCargoWeightKg || ''}
                onChange={(e) => setMaxCargoWeightKg(Number(e.target.value))}
                className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-zinc-900 font-mono focus:outline-none focus:border-zinc-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-bold text-zinc-800 mb-1">Odometer Terkini (KM)</label>
              <input
                type="number"
                value={currentOdometerKm}
                onChange={(e) => setCurrentOdometerKm(Number(e.target.value))}
                className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-zinc-900 font-mono focus:outline-none focus:border-zinc-900"
              />
            </div>
            <div>
              <label className="block font-bold text-zinc-800 mb-1">Jatuh Tempo STNK</label>
              <input
                type="date"
                value={stnkExpiryDate}
                onChange={(e) => setStnkExpiryDate(e.target.value)}
                className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-zinc-900 font-mono focus:outline-none focus:border-zinc-900"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 bg-zinc-950 hover:bg-zinc-800 text-white font-black uppercase tracking-wider text-xs rounded-xl transition shadow active:scale-95 cursor-pointer"
            >
              Simpan Kendaraan ke Garasi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
