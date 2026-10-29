import React from 'react';
import type { Vehicle } from '../types';
import { VehicleCategoryIcon } from './VehicleCategoryIcon';
import { Layers } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

interface VehicleSlideSelectorProps {
  vehicles: Vehicle[];
  selectedVehicleId: string;
  onSelectVehicle: (id: string) => void;
}

export const VehicleSlideSelector: React.FC<VehicleSlideSelectorProps> = ({
  vehicles,
  selectedVehicleId,
  onSelectVehicle,
}) => {
  return (
    <div className="bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl -mx-4 md:mx-0 px-4 md:px-0 py-2.5 border-b md:border-b-0 border-zinc-200/80 dark:border-zinc-800/80 transition-colors">
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 scroll-smooth snap-x">
        {/* 'Semua Unit' All Vehicles Option */}
        <button
          onClick={() => {
            triggerHaptic('selection');
            onSelectVehicle('all');
          }}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-black whitespace-nowrap transition-all duration-200 cursor-pointer snap-start shrink-0 ${
            selectedVehicleId === 'all'
              ? 'bg-theme-accent text-theme-accent-fg shadow-md shadow-theme-accent/25 ring-2 ring-theme-accent/50 scale-[1.02]'
              : 'bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 hover:text-zinc-950 dark:hover:text-white border border-zinc-200 dark:border-zinc-800 hover:border-theme-accent/50 shadow-xs'
          }`}
        >
          <div className={`p-1 rounded-lg ${
            selectedVehicleId === 'all' 
              ? 'bg-black/15 text-inherit' 
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
          }`}>
            <Layers className="w-3.5 h-3.5 stroke-[2.5]" />
          </div>
          <span>Semua Unit</span>
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
            selectedVehicleId === 'all'
              ? 'bg-black/20 text-inherit'
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
          }`}>
            {vehicles.length}
          </span>
        </button>

        {/* Individual Vehicle Pills */}
        {vehicles.map((veh) => {
          const isSelected = selectedVehicleId === veh.id;
          return (
            <button
              key={veh.id}
              onClick={() => {
                triggerHaptic('selection');
                onSelectVehicle(veh.id);
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs whitespace-nowrap transition-all duration-200 cursor-pointer snap-start shrink-0 ${
                isSelected
                  ? 'bg-theme-accent text-theme-accent-fg font-black shadow-md shadow-theme-accent/25 ring-2 ring-theme-accent/50 scale-[1.02]'
                  : 'bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 hover:text-zinc-950 dark:hover:text-white border border-zinc-200 dark:border-zinc-800 hover:border-theme-accent/50 shadow-xs font-bold'
              }`}
            >
              {/* Vehicle Category Icon with Chip */}
              <div className={`w-5.5 h-5.5 rounded-full flex items-center justify-center shrink-0 ${
                isSelected
                  ? 'bg-black/15 text-inherit'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
              }`}>
                <VehicleCategoryIcon
                  category={veh.category}
                  isElectric={veh.fuelType === 'Listrik'}
                  className="w-3.5 h-3.5"
                />
              </div>

              {/* License Plate Badge - High Contrast & Monospace */}
              <span className={`font-mono text-[11px] px-1.5 py-0.5 rounded-md tracking-wider border ${
                isSelected
                  ? 'bg-black/20 text-inherit border-black/10 font-black'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border-zinc-200 dark:border-zinc-700 font-bold'
              }`}>
                {veh.plateNumber}
              </span>

              {/* Vehicle Name */}
              <span className="tracking-tight">{veh.name}</span>

              {/* Active Selection Indicator */}
              {isSelected && (
                <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse shrink-0 ml-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
