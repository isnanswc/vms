import React, { useState } from 'react';
import type { Vehicle, FuelLog } from '../types';
import { 
  Fuel, 
  Camera, 
  Plus, 
  TrendingUp, 
  Droplet, 
  MapPin, 
  Gauge, 
  Sparkles,
  Navigation
} from 'lucide-react';

interface FuelViewProps {
  vehicles: Vehicle[];
  fuelLogs: FuelLog[];
  onAddFuelLog: () => void;
  onScanReceipt: () => void;
}

export const FuelView: React.FC<FuelViewProps> = ({
  vehicles,
  fuelLogs,
  onAddFuelLog,
  onScanReceipt,
}) => {
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('all');

  const filteredLogs = selectedVehicleId === 'all'
    ? fuelLogs
    : fuelLogs.filter((log) => log.vehicleId === selectedVehicleId);

  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId);

  const totalLiters = filteredLogs.reduce((acc, log) => acc + log.liters, 0);
  const totalCost = filteredLogs.reduce((acc, log) => acc + log.totalCost, 0);
  const logsWithEff = filteredLogs.filter((l) => l.efficiencyKmPerLiter !== undefined);
  const avgEfficiency = logsWithEff.length > 0
    ? (logsWithEff.reduce((a, b) => a + (b.efficiencyKmPerLiter || 0), 0) / logsWithEff.length).toFixed(1)
    : '-';

  return (
    <div className="space-y-5 pb-24 md:pb-8 pt-2">
      {/* Sticky Vehicle Filter Pill Bar */}
      <div className="bg-white/95 backdrop-blur-md -mx-4 md:mx-0 px-4 md:px-0 py-2 border-b md:border-b-0 border-zinc-200">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
          <button
            onClick={() => setSelectedVehicleId('all')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
              selectedVehicleId === 'all'
                ? 'bg-zinc-950 text-yellow-400 shadow-sm'
                : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border border-zinc-200'
            }`}
          >
            Semua Unit ({vehicles.length})
          </button>

          {vehicles.map((veh) => {
            const isSelected = selectedVehicleId === veh.id;
            return (
              <button
                key={veh.id}
                onClick={() => setSelectedVehicleId(veh.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                  isSelected
                    ? 'bg-zinc-950 text-yellow-400 shadow-sm'
                    : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border border-zinc-200'
                }`}
              >
                <span className="font-mono text-[11px] opacity-80">[{veh.plateNumber}]</span>
                <span>{veh.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Vehicle Headline Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-black uppercase tracking-wider text-zinc-900 flex items-center gap-2">
            <span>Manajemen Bahan Bakar</span>
            {selectedVehicle && (
              <span className="text-zinc-500 font-mono text-sm font-normal">
                — {selectedVehicle.name}
              </span>
            )}
          </h2>
          <p className="text-xs text-zinc-500">
            {filteredLogs.length} catatan pengisian bensin tercatat
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onScanReceipt}
            className="flex items-center gap-1.5 py-2.5 px-3.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 text-xs font-bold rounded-2xl transition cursor-pointer active:scale-95"
            title="Scan Struk SPBU dengan AI"
          >
            <Camera className="w-4 h-4 text-zinc-700" />
            <span>Scan Struk</span>
          </button>
          <button
            onClick={onAddFuelLog}
            className="flex items-center gap-1.5 py-2.5 px-4 bg-yellow-400 hover:bg-yellow-300 text-zinc-950 text-xs font-black rounded-2xl transition shadow-xs active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ CATAT BBM</span>
          </button>
        </div>
      </div>

      {/* Fuel Summary Stats (Desktop 3 Columns) */}
      <div className="grid grid-cols-3 gap-3 md:gap-4">
        <div className="bg-white text-zinc-900 rounded-3xl p-4 shadow-sm border-2 border-zinc-200 border-b-4 border-b-yellow-400">
          <span className="text-[11px] font-bold text-zinc-500 uppercase flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-yellow-600" />
            <span>Rata-Rata Konsumsi</span>
          </span>
          <div className="mt-2 font-mono font-black text-lg md:text-xl text-zinc-950">
            {avgEfficiency} <span className="text-xs font-normal text-zinc-500">km/L</span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-0.5">Rasio efisiensi bahan bakar</p>
        </div>

        <div className="bg-white text-zinc-900 rounded-3xl p-4 shadow-sm border-2 border-zinc-200 border-b-4 border-b-zinc-900">
          <span className="text-[11px] font-bold text-zinc-500 uppercase flex items-center gap-1">
            <Droplet className="w-3.5 h-3.5 text-zinc-700" />
            <span>Volume Terisi</span>
          </span>
          <div className="mt-2 font-mono font-black text-lg md:text-xl text-zinc-950">
            {totalLiters.toFixed(1)} <span className="text-xs font-normal text-zinc-500">L</span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-0.5">Total bahan bakar</p>
        </div>

        <div className="bg-white text-zinc-900 rounded-3xl p-4 shadow-sm border-2 border-zinc-200 border-b-4 border-b-zinc-900">
          <span className="text-[11px] font-bold text-zinc-500 uppercase flex items-center gap-1">
            <Fuel className="w-3.5 h-3.5 text-zinc-700" />
            <span>Total Pengeluaran</span>
          </span>
          <div className="mt-2 font-mono font-black text-lg md:text-xl text-zinc-950">
            Rp {(totalCost / 1000).toLocaleString('id-ID')}k
          </div>
          <p className="text-[11px] text-zinc-400 mt-0.5">Total rupiah BBM</p>
        </div>
      </div>

      {/* Fuel Log Entries List (2 Columns on Desktop) */}
      <div className="space-y-3">
        <span className="text-xs font-black uppercase tracking-wider text-zinc-900 px-1 block">
          Riwayat Pengisian & Transaksi
        </span>

        {filteredLogs.length === 0 ? (
          <div className="bg-zinc-50 border-2 border-dashed border-zinc-200 rounded-3xl p-10 text-center text-zinc-400 text-xs">
            Belum ada riwayat pengisian BBM untuk filter kendaraan ini.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredLogs.map((log) => {
              const veh = vehicles.find((v) => v.id === log.vehicleId);

              return (
                <div
                  key={log.id}
                  className="bg-white text-zinc-900 rounded-3xl p-4.5 shadow-sm border-2 border-zinc-200 hover:border-zinc-300 transition relative overflow-hidden flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="px-2.5 py-0.5 rounded-lg bg-zinc-950 text-white font-mono font-bold text-[11px]">
                            {veh?.plateNumber}
                          </span>
                          <span className="text-xs font-black text-zinc-900">
                            {veh?.name}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 text-xs text-zinc-600 mt-1">
                          <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                          <span>{log.stationName}</span>
                        </div>

                        {log.gpsLocation && (
                          <div className="flex items-center gap-1 text-[11px] text-zinc-500 font-mono mt-0.5 ml-4">
                            <Navigation className="w-3 h-3 text-yellow-600" />
                            <span>{log.gpsLocation.addressDescription || `${log.gpsLocation.latitude}, ${log.gpsLocation.longitude}`}</span>
                          </div>
                        )}
                      </div>

                      <div className="text-right">
                        <div className="font-mono font-black text-base text-zinc-950">
                          Rp {log.totalCost.toLocaleString('id-ID')}
                        </div>
                        <div className="text-xs text-zinc-500 font-mono mt-0.5">
                          {log.liters} L • <span className="font-bold text-zinc-800">{log.fuelType}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-zinc-600 font-mono text-xs">
                      <Gauge className="w-4 h-4 text-zinc-400" />
                      <span>Odometer: {log.odometerKm.toLocaleString('id-ID')} KM</span>
                    </div>

                    {log.efficiencyKmPerLiter && (
                      <div className="flex items-center gap-1 px-3 py-1 bg-yellow-100 border border-yellow-300 text-zinc-950 font-mono font-bold text-xs rounded-full">
                        <span>{log.efficiencyKmPerLiter} km/L</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
