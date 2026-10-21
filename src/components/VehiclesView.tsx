import React from 'react';
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
  AlertCircle 
} from 'lucide-react';

interface VehiclesViewProps {
  vehicles: Vehicle[];
  onAddVehicle: () => void;
  onSelectVehicle: (vehicle: Vehicle) => void;
}

export const VehiclesView: React.FC<VehiclesViewProps> = ({
  vehicles,
  onAddVehicle,
  onSelectVehicle,
}) => {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'motor':
        return <Bike className="w-4 h-4 text-zinc-900" />;
      case 'truk':
        return <Truck className="w-4 h-4 text-zinc-900" />;
      default:
        return <Car className="w-4 h-4 text-zinc-900" />;
    }
  };

  const getDaysUntilExpiry = (dateStr: string) => {
    const today = new Date('2026-10-21');
    const target = new Date(dateStr);
    const diffTime = target.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="space-y-5 pb-24 md:pb-8 pt-2">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-black uppercase tracking-wider text-zinc-900">
            Garasi Kendaraan
          </h2>
          <p className="text-xs text-zinc-500">
            Total {vehicles.length} unit armada & kendaraan terkelola
          </p>
        </div>

        <button
          onClick={onAddVehicle}
          className="flex items-center justify-center gap-2 py-2.5 px-4 bg-yellow-400 hover:bg-yellow-300 text-zinc-950 text-xs font-black rounded-2xl transition shadow-sm active:scale-95 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>+ TAMBAH KENDARAAN (AI)</span>
        </button>
      </div>

      {/* Vehicle Cards Responsive Grid (1 col on mobile, 2 cols on tablet, 3 cols on desktop) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {vehicles.map((veh) => {
          const daysToExpiry = getDaysUntilExpiry(veh.stnkExpiryDate);
          const isStnkUrgent = daysToExpiry <= 14;

          return (
            <div
              key={veh.id}
              onClick={() => onSelectVehicle(veh)}
              className="bg-white text-zinc-900 rounded-3xl p-5 shadow-sm border-2 border-zinc-200 hover:border-zinc-900 transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between group hover:shadow-md"
            >
              <div>
                {/* Header inside card: Plate & Category */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="px-3 py-1 rounded-lg bg-zinc-950 text-white font-mono font-black text-xs tracking-wider shadow-sm">
                      {veh.plateNumber}
                    </div>
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-yellow-100 text-zinc-900 font-bold uppercase tracking-wider flex items-center gap-1 border border-yellow-300">
                      {getCategoryIcon(veh.category)}
                      {veh.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-900 text-[11px] font-mono font-bold">
                    <span className="text-zinc-500">Kondisi:</span>
                    <span className="text-zinc-950 font-black">{veh.healthScore}%</span>
                  </div>
                </div>

                {/* Title & Notes */}
                <div>
                  <h3 className="font-extrabold text-base text-zinc-900 tracking-tight group-hover:text-black">
                    {veh.name} <span className="text-zinc-400 font-normal text-xs">({veh.year})</span>
                  </h3>
                  <p className="text-xs text-zinc-500 line-clamp-1 mt-1">{veh.notes}</p>
                </div>

                {/* Metric Chips Grid */}
                <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-zinc-100 text-xs">
                  <div className="bg-zinc-50 rounded-2xl p-2.5 border border-zinc-200/80">
                    <div className="text-[10px] text-zinc-500 flex items-center gap-1">
                      <Gauge className="w-3 h-3 text-zinc-700" />
                      <span>Odometer</span>
                    </div>
                    <div className="font-mono font-bold text-zinc-900 text-xs mt-0.5 truncate">
                      {veh.currentOdometerKm.toLocaleString('id-ID')} KM
                    </div>
                  </div>

                  <div className="bg-zinc-50 rounded-2xl p-2.5 border border-zinc-200/80">
                    <div className="text-[10px] text-zinc-500 flex items-center gap-1">
                      <Fuel className="w-3 h-3 text-zinc-700" />
                      <span>Tangki</span>
                    </div>
                    <div className="font-mono font-bold text-zinc-900 text-xs mt-0.5 truncate">
                      {veh.tankCapacityLiters} L
                    </div>
                  </div>

                  <div className="bg-zinc-50 rounded-2xl p-2.5 border border-zinc-200/80">
                    <div className="text-[10px] text-zinc-500 flex items-center gap-1">
                      <Weight className="w-3 h-3 text-zinc-700" />
                      <span>Max Beban</span>
                    </div>
                    <div className="font-mono font-bold text-zinc-900 text-xs mt-0.5 truncate">
                      {veh.maxCargoWeightKg ? `${veh.maxCargoWeightKg} KG` : 'N/A'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Legalitas STNK Info Strip */}
              <div className={`mt-4 p-2.5 rounded-2xl flex items-center justify-between text-xs ${
                isStnkUrgent ? 'bg-amber-50 border border-amber-300 text-amber-950' : 'bg-zinc-100 text-zinc-700'
              }`}>
                <div className="flex items-center gap-2">
                  {isStnkUrgent ? (
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  ) : (
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
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
                  isStnkUrgent ? 'bg-yellow-400 text-zinc-950 shadow-xs' : 'bg-zinc-200 text-zinc-700'
                }`}>
                  {daysToExpiry > 0 ? `${daysToExpiry} Hari Lagi` : 'Jatuh Tempo!'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
