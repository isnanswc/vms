import React, { useState } from 'react';
import type { Vehicle } from '../types';
import { 
  Plus, 
  Bike, 
  Car, 
  Truck, 
  Gauge, 
  Fuel, 
  Weight, 
  ShieldCheck, 
  AlertCircle,
  Trash2,
  AlertTriangle,
  X
} from 'lucide-react';

interface VehiclesViewProps {
  vehicles: Vehicle[];
  onAddVehicle: () => void;
  onSelectVehicle: (vehicle: Vehicle) => void;
  onDeleteVehicle?: (vehicleId: string) => void;
}

export const VehiclesView: React.FC<VehiclesViewProps> = ({
  vehicles,
  onAddVehicle,
  onSelectVehicle,
  onDeleteVehicle,
}) => {
  const [vehicleToDelete, setVehicleToDelete] = useState<Vehicle | null>(null);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'motor':
        return <Bike className="w-4 h-4 text-zinc-900 dark:text-zinc-100" />;
      case 'truk':
        return <Truck className="w-4 h-4 text-zinc-900 dark:text-zinc-100" />;
      default:
        return <Car className="w-4 h-4 text-zinc-900 dark:text-zinc-100" />;
    }
  };

  const getDaysUntilExpiry = (dateStr: string) => {
    const today = new Date('2026-10-21');
    const target = new Date(dateStr);
    const diffTime = target.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const handleConfirmDelete = () => {
    if (vehicleToDelete && onDeleteVehicle) {
      onDeleteVehicle(vehicleToDelete.id);
    }
    setVehicleToDelete(null);
  };

  return (
    <div className="space-y-5 pb-24 md:pb-8 pt-2 text-zinc-900 dark:text-zinc-100 transition-colors">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
            Garasi Kendaraan
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Total {vehicles.length} unit armada & kendaraan terkelola
          </p>
        </div>

        <button
          onClick={onAddVehicle}
          className="flex items-center justify-center gap-2 py-2.5 px-4 bg-yellow-400 hover:bg-yellow-300 text-zinc-950 text-xs font-black rounded-2xl transition shadow-sm active:scale-95 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>TAMBAH KENDARAAN (AI)</span>
        </button>
      </div>

      {/* Vehicle Cards Responsive Grid (1 col on mobile, 2 cols on tablet, 3 cols on desktop) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {vehicles.length === 0 ? (
          <div className="col-span-full p-12 bg-zinc-50 dark:bg-zinc-900/50 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl text-center text-zinc-500 dark:text-zinc-400 text-xs space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-yellow-400 text-zinc-950 flex items-center justify-center mx-auto shadow-sm">
              <Car className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100">Garasi Anda Masih Kosong</h4>
              <p className="text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto">
                Daftarkan kendaraan pertama Anda menggunakan AI. Cukup ketik nama model (misal: Vario, Avanza, Gran Max) dan spesifikasi pabrikan akan terisi otomatis.
              </p>
            </div>
            <button
              onClick={onAddVehicle}
              className="py-3 px-5 bg-yellow-400 hover:bg-yellow-300 text-zinc-950 font-black text-xs rounded-xl shadow-xs cursor-pointer transition inline-flex items-center gap-2 active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>TAMBAH KENDARAAN PERTAMA (AI)</span>
            </button>
          </div>
        ) : (
          vehicles.map((veh) => {
            const daysToExpiry = getDaysUntilExpiry(veh.stnkExpiryDate);
            const isStnkUrgent = daysToExpiry <= 14;

            return (
              <div
                key={veh.id}
                onClick={() => onSelectVehicle(veh)}
                className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 rounded-3xl p-5 shadow-sm border-2 border-zinc-200 dark:border-zinc-800 hover:border-zinc-900 dark:hover:border-yellow-400 transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between group hover:shadow-md"
              >
                <div>
                  {/* Header inside card: Plate & Category & Delete Quick Button */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="px-3 py-1 rounded-lg bg-zinc-950 dark:bg-zinc-800 text-white font-mono font-black text-xs tracking-wider shadow-sm border border-zinc-800 dark:border-zinc-700">
                        {veh.plateNumber}
                      </div>
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-yellow-100 dark:bg-yellow-950/60 text-zinc-900 dark:text-yellow-400 font-bold uppercase tracking-wider flex items-center gap-1 border border-yellow-300 dark:border-yellow-800">
                        {getCategoryIcon(veh.category)}
                        {veh.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-200 text-[11px] font-mono font-bold">
                        <span className="text-zinc-500 dark:text-zinc-400">Kondisi:</span>
                        <span className="text-zinc-950 dark:text-yellow-400 font-black">{veh.healthScore}%</span>
                      </div>

                      {onDeleteVehicle && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setVehicleToDelete(veh);
                          }}
                          className="p-1.5 rounded-xl text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 transition cursor-pointer"
                          title="Hapus Unit dari Garasi"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Title & Notes */}
                  <div>
                    <h3 className="font-extrabold text-base text-zinc-900 dark:text-zinc-100 tracking-tight group-hover:text-black dark:group-hover:text-white">
                      {veh.name} <span className="text-zinc-400 dark:text-zinc-500 font-normal text-xs">({veh.year})</span>
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1 mt-1">{veh.notes}</p>
                  </div>

                  {/* Metric Chips Grid */}
                  <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 text-xs">
                    <div className="bg-zinc-50 dark:bg-zinc-800/60 rounded-2xl p-2.5 border border-zinc-200/80 dark:border-zinc-700/60">
                      <div className="text-[10px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                        <Gauge className="w-3 h-3 text-zinc-700 dark:text-zinc-300" />
                        <span>Odometer</span>
                      </div>
                      <div className="font-mono font-bold text-zinc-900 dark:text-zinc-100 text-xs mt-0.5 truncate">
                        {veh.currentOdometerKm.toLocaleString('id-ID')} KM
                      </div>
                    </div>

                    <div className="bg-zinc-50 dark:bg-zinc-800/60 rounded-2xl p-2.5 border border-zinc-200/80 dark:border-zinc-700/60">
                      <div className="text-[10px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                        <Fuel className="w-3 h-3 text-zinc-700 dark:text-zinc-300" />
                        <span>Tangki</span>
                      </div>
                      <div className="font-mono font-bold text-zinc-900 dark:text-zinc-100 text-xs mt-0.5 truncate">
                        {veh.tankCapacityLiters} L
                      </div>
                    </div>

                    <div className="bg-zinc-50 dark:bg-zinc-800/60 rounded-2xl p-2.5 border border-zinc-200/80 dark:border-zinc-700/60">
                      <div className="text-[10px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                        <Weight className="w-3 h-3 text-zinc-700 dark:text-zinc-300" />
                        <span>Max Beban</span>
                      </div>
                      <div className="font-mono font-bold text-zinc-900 dark:text-zinc-100 text-xs mt-0.5 truncate">
                        {veh.maxCargoWeightKg ? `${veh.maxCargoWeightKg} KG` : 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Legalitas STNK Info Strip */}
                <div className={`mt-4 p-2.5 rounded-2xl flex items-center justify-between text-xs ${
                  isStnkUrgent 
                    ? 'bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-950 dark:text-amber-200' 
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                }`}>
                  <div className="flex items-center gap-2">
                    {isStnkUrgent ? (
                      <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    ) : (
                      <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    )}
                    <div>
                      <span className="font-bold text-[11px]">Pajak STNK: </span>
                      <span className="font-mono text-[11px]">
                        {new Date(veh.stnkExpiryDate).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>

                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                    isStnkUrgent 
                      ? 'bg-yellow-400 text-zinc-950 shadow-xs' 
                      : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200'
                  }`}>
                    {daysToExpiry > 0 ? `${daysToExpiry} Hari Lagi` : 'Jatuh Tempo!'}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* CONFIRM DELETE VEHICLE MODAL */}
      {vehicleToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-sm animate-fade-in text-zinc-900 dark:text-zinc-100">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 border-2 border-red-500 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400">
                  <AlertTriangle className="w-6 h-6 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="font-black text-base uppercase tracking-tight text-red-600 dark:text-red-400">
                    Hapus Unit Kendaraan?
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Tindakan ini permanen dan tidak dapat dibatalkan</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setVehicleToDelete(null)}
                className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-xs space-y-1">
              <div className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100">
                {vehicleToDelete.name} ({vehicleToDelete.year})
              </div>
              <div className="font-mono text-zinc-600 dark:text-zinc-300 font-bold">
                Plat: {vehicleToDelete.plateNumber}
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 pt-1 leading-relaxed">
                Seluruh catatan riwayat pengisian BBM, buku servis, dan suku cadang yang terdaftar untuk unit ini akan terhapus otomatis dari penyimpanan sistem.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setVehicleToDelete(null)}
                className="flex-1 py-3 px-4 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-500 text-white font-black text-xs rounded-xl transition shadow active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>Ya, Hapus Unit</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
