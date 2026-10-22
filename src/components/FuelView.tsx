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
  Navigation,
  BarChart3,
  Calendar,
  Wallet,
  Activity
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
  const [viewMode, setViewMode] = useState<'transactions' | 'analytics'>('transactions');
  const [timeRange, setTimeRange] = useState<'30d' | '3m' | '6m' | '1y' | 'all'>('all');

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

  // Analytics Filtered by Time
  const now = new Date();
  const analyticsLogs = filteredLogs.filter((log) => {
    if (timeRange === 'all') return true;
    const d = new Date(log.date);
    const diffDays = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
    if (timeRange === '30d') return diffDays <= 30;
    if (timeRange === '3m') return diffDays <= 90;
    if (timeRange === '6m') return diffDays <= 180;
    if (timeRange === '1y') return diffDays <= 365;
    return true;
  });

  const totalRangeCost = analyticsLogs.reduce((acc, log) => acc + log.totalCost, 0);
  const totalRangeLiters = analyticsLogs.reduce((acc, log) => acc + log.liters, 0);
  const analyticsWithEff = analyticsLogs.filter((l) => l.efficiencyKmPerLiter !== undefined);
  const avgRangeEff = analyticsWithEff.length > 0
    ? (analyticsWithEff.reduce((a, b) => a + (b.efficiencyKmPerLiter || 0), 0) / analyticsWithEff.length).toFixed(1)
    : '-';
  const avgCostPerFill = analyticsLogs.length > 0 ? Math.round(totalRangeCost / analyticsLogs.length) : 0;

  // Monthly Aggregation for Fuel Bar Chart
  const fuelMonthlyMap: Record<string, { monthLabel: string; totalCost: number; totalLiters: number; count: number }> = {};
  const sortedLogs = [...analyticsLogs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  sortedLogs.forEach((log) => {
    const d = new Date(log.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const monthLabel = d.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' });
    if (!fuelMonthlyMap[key]) {
      fuelMonthlyMap[key] = { monthLabel, totalCost: 0, totalLiters: 0, count: 0 };
    }
    fuelMonthlyMap[key].totalCost += log.totalCost;
    fuelMonthlyMap[key].totalLiters += log.liters;
    fuelMonthlyMap[key].count += 1;
  });
  const fuelMonthlyData = Object.values(fuelMonthlyMap);
  const maxFuelMonthlyCost = fuelMonthlyData.length > 0 ? Math.max(...fuelMonthlyData.map((m) => m.totalCost), 1) : 1;

  // Breakdown by Fuel Type
  const fuelTypeMap: Record<string, { count: number; totalCost: number; totalLiters: number; efficiencies: number[] }> = {};
  analyticsLogs.forEach((log) => {
    const type = log.fuelType || 'Lainnya';
    if (!fuelTypeMap[type]) {
      fuelTypeMap[type] = { count: 0, totalCost: 0, totalLiters: 0, efficiencies: [] };
    }
    fuelTypeMap[type].count += 1;
    fuelTypeMap[type].totalCost += log.totalCost;
    fuelTypeMap[type].totalLiters += log.liters;
    if (log.efficiencyKmPerLiter) {
      fuelTypeMap[type].efficiencies.push(log.efficiencyKmPerLiter);
    }
  });

  const fuelTypeList = Object.entries(fuelTypeMap).map(([type, data]) => {
    const avgEff = data.efficiencies.length > 0
      ? (data.efficiencies.reduce((a, b) => a + b, 0) / data.efficiencies.length).toFixed(1)
      : '-';
    const pctCost = totalRangeCost > 0 ? Math.round((data.totalCost / totalRangeCost) * 100) : 0;
    return { type, ...data, avgEff, pctCost };
  }).sort((a, b) => b.totalCost - a.totalCost);

  // Top SPBU Stations
  const stationMap: Record<string, { count: number; totalCost: number; totalLiters: number }> = {};
  analyticsLogs.forEach((log) => {
    const station = log.stationName?.trim() || 'SPBU Pertamina';
    if (!stationMap[station]) {
      stationMap[station] = { count: 0, totalCost: 0, totalLiters: 0 };
    }
    stationMap[station].count += 1;
    stationMap[station].totalCost += log.totalCost;
    stationMap[station].totalLiters += log.liters;
  });
  const topStations = Object.entries(stationMap)
    .map(([station, data]) => ({ station, ...data }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);

  return (
    <div className="space-y-5 pb-24 md:pb-8 pt-2 text-zinc-900 dark:text-zinc-100 transition-colors">
      {/* Sticky Vehicle Filter Pill Bar */}
      <div className="bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md -mx-4 md:mx-0 px-4 md:px-0 py-2 border-b md:border-b-0 border-zinc-200 dark:border-zinc-800 transition-colors">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
          <button
            onClick={() => setSelectedVehicleId('all')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
              selectedVehicleId === 'all'
                ? 'bg-zinc-950 text-yellow-400 dark:bg-yellow-400 dark:text-zinc-950 shadow-sm'
                : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700'
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
                    ? 'bg-zinc-950 text-yellow-400 dark:bg-yellow-400 dark:text-zinc-950 shadow-sm'
                    : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700'
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
          <h2 className="text-xl font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <span>Manajemen Bahan Bakar</span>
            {selectedVehicle && (
              <span className="text-zinc-500 dark:text-zinc-400 font-mono text-sm font-normal">
                — {selectedVehicle.name}
              </span>
            )}
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {filteredLogs.length} catatan pengisian bensin tercatat
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onScanReceipt}
            className="flex items-center gap-1.5 py-2.5 px-3.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 text-xs font-bold rounded-2xl transition cursor-pointer active:scale-95 shadow-xs"
            title="Scan Struk SPBU dengan AI"
          >
            <Camera className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
            <span>Scan Struk</span>
          </button>
          <button
            onClick={onAddFuelLog}
            className="flex items-center gap-1.5 py-2.5 px-4 bg-yellow-400 hover:bg-yellow-300 text-zinc-950 text-xs font-black rounded-2xl transition shadow-xs active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>CATAT BBM</span>
          </button>
        </div>
      </div>

      {/* Fuel KPI Summary Card with View Switcher */}
      <div className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 rounded-3xl p-5 border-2 border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-4 border-b-yellow-400 transition-colors">
        <div>
          <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">
            Total Konsumsi & Pengeluaran Bahan Bakar
          </span>
          <div className="mt-1 font-mono font-black text-2xl md:text-3xl text-zinc-950 dark:text-zinc-100">
            Rp {totalCost.toLocaleString('id-ID')}
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Total {totalLiters.toFixed(1)} Liter bensin terisi • Rata-rata efisiensi {avgEfficiency} km/L
          </p>
        </div>

        {/* View Switcher: Log Transaksi vs Sheet Analitik */}
        <div className="grid grid-cols-2 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 text-xs font-bold">
          <button
            onClick={() => setViewMode('transactions')}
            className={`py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
              viewMode === 'transactions'
                ? 'bg-white dark:bg-zinc-900 text-zinc-950 dark:text-zinc-100 shadow-xs'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            <Fuel className="w-3.5 h-3.5" />
            <span>Log Transaksi ({filteredLogs.length})</span>
          </button>

          <button
            onClick={() => setViewMode('analytics')}
            className={`py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
              viewMode === 'analytics'
                ? 'bg-yellow-400 text-zinc-950 shadow-xs'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Sheet Analitik BBM</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: LOG TRANSAKSI BBM */}
      {viewMode === 'transactions' && (
        <div className="space-y-4 animate-fade-in">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 gap-3 md:gap-4">
            <div className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 rounded-3xl p-4 shadow-sm border-2 border-zinc-200 dark:border-zinc-800 border-b-4 border-b-yellow-400 transition-colors">
              <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-yellow-500" />
                <span>Rata-Rata Konsumsi</span>
              </span>
              <div className="mt-2 font-mono font-black text-lg md:text-xl text-zinc-950 dark:text-zinc-100">
                {avgEfficiency} <span className="text-xs font-normal text-zinc-500 dark:text-zinc-400">km/L</span>
              </div>
              <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">Rasio efisiensi bensin</p>
            </div>

            <div className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 rounded-3xl p-4 shadow-sm border-2 border-zinc-200 dark:border-zinc-800 border-b-4 border-b-zinc-900 dark:border-b-yellow-400 transition-colors">
              <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase flex items-center gap-1">
                <Droplet className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300" />
                <span>Volume Terisi</span>
              </span>
              <div className="mt-2 font-mono font-black text-lg md:text-xl text-zinc-950 dark:text-zinc-100">
                {totalLiters.toFixed(1)} <span className="text-xs font-normal text-zinc-500 dark:text-zinc-400">L</span>
              </div>
              <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">Total bahan bakar</p>
            </div>

            <div className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 rounded-3xl p-4 shadow-sm border-2 border-zinc-200 dark:border-zinc-800 border-b-4 border-b-zinc-900 dark:border-b-yellow-400 transition-colors">
              <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase flex items-center gap-1">
                <Fuel className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300" />
                <span>Total Biaya</span>
              </span>
              <div className="mt-2 font-mono font-black text-lg md:text-xl text-zinc-950 dark:text-zinc-100">
                Rp {(totalCost / 1000).toLocaleString('id-ID')}k
              </div>
              <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">Biaya operasional BBM</p>
            </div>
          </div>

          <div className="space-y-3">
            <span className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100 px-1 block">
              Riwayat Pengisian & Lokasi SPBU
            </span>

            {filteredLogs.length === 0 ? (
              <div className="bg-zinc-50 dark:bg-zinc-900/50 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl p-10 text-center text-zinc-400 dark:text-zinc-500 text-xs">
                Belum ada riwayat pengisian BBM untuk filter kendaraan ini.
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredLogs.map((log) => {
                  const veh = vehicles.find((v) => v.id === log.vehicleId);

                  return (
                    <div
                      key={log.id}
                      className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 rounded-3xl p-4.5 shadow-sm border-2 border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 transition relative overflow-hidden flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                              <span className="px-2.5 py-0.5 rounded-lg bg-zinc-950 dark:bg-zinc-800 text-white font-mono font-bold text-[11px] border border-zinc-800 dark:border-zinc-700">
                                {veh?.plateNumber}
                              </span>
                              <span className="text-xs font-black text-zinc-900 dark:text-zinc-100">
                                {veh?.name}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                              <MapPin className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 shrink-0" />
                              <span>{log.stationName}</span>
                            </div>

                            {log.gpsLocation && (
                              <div className="flex items-center gap-1 text-[11px] text-zinc-500 dark:text-zinc-400 font-mono mt-0.5 ml-4">
                                <Navigation className="w-3 h-3 text-yellow-500" />
                                <span>{log.gpsLocation.addressDescription || `${log.gpsLocation.latitude}, ${log.gpsLocation.longitude}`}</span>
                              </div>
                            )}
                          </div>

                          <div className="text-right">
                            <div className="font-mono font-black text-base text-zinc-950 dark:text-zinc-100">
                              Rp {log.totalCost.toLocaleString('id-ID')}
                            </div>
                            <div className="text-xs text-zinc-500 dark:text-zinc-400 font-mono mt-0.5">
                              {log.liters} L • <span className="font-bold text-zinc-800 dark:text-zinc-200">{log.fuelType}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400 font-mono text-xs">
                          <Gauge className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
                          <span>Odometer: {log.odometerKm.toLocaleString('id-ID')} KM</span>
                        </div>

                        {log.efficiencyKmPerLiter && (
                          <div className="flex items-center gap-1 px-3 py-1 bg-yellow-100 dark:bg-yellow-950/60 border border-yellow-300 dark:border-yellow-800 text-zinc-950 dark:text-yellow-400 font-mono font-bold text-xs rounded-full">
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
      )}

      {/* VIEW 2: SHEET ANALITIK BBM & GRAFIK WAKTU */}
      {viewMode === 'analytics' && (
        <div className="space-y-5 animate-fade-in">
          {/* Time Filter Bar */}
          <div className="bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800 rounded-3xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
              <span className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                Rentang Waktu Analitik BBM
              </span>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              {[
                { id: '30d', label: '30 Hari' },
                { id: '3m', label: '3 Bulan' },
                { id: '6m', label: '6 Bulan' },
                { id: '1y', label: '1 Tahun' },
                { id: 'all', label: 'Semua Waktu' },
              ].map((pill) => {
                const isSelected = timeRange === pill.id;
                return (
                  <button
                    key={pill.id}
                    onClick={() => setTimeRange(pill.id as any)}
                    className={`py-1.5 px-3 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                      isSelected
                        ? 'bg-zinc-950 text-yellow-400 dark:bg-yellow-400 dark:text-zinc-950 shadow-xs'
                        : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300'
                    }`}
                  >
                    {pill.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4 Analytics Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            <div className="bg-white dark:bg-zinc-900 rounded-3xl p-4 border-2 border-zinc-200 dark:border-zinc-800 border-b-4 border-b-yellow-400 shadow-sm transition-colors">
              <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-[11px] font-bold uppercase">
                <span>Pengeluaran BBM</span>
                <Wallet className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
              </div>
              <div className="mt-2 font-mono font-black text-lg md:text-xl text-zinc-950 dark:text-zinc-100">
                Rp {totalRangeCost.toLocaleString('id-ID')}
              </div>
              <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">{analyticsLogs.length} transaksi isi bensin</p>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-3xl p-4 border-2 border-zinc-200 dark:border-zinc-800 border-b-4 border-b-zinc-900 dark:border-b-yellow-400 shadow-sm transition-colors">
              <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-[11px] font-bold uppercase">
                <span>Total Volume</span>
                <Droplet className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
              </div>
              <div className="mt-2 font-mono font-black text-lg md:text-xl text-zinc-950 dark:text-zinc-100">
                {totalRangeLiters.toFixed(1)} <span className="text-xs font-normal text-zinc-500 dark:text-zinc-400">Liter</span>
              </div>
              <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">BBM terpakai armada</p>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-3xl p-4 border-2 border-zinc-200 dark:border-zinc-800 border-b-4 border-b-yellow-400 shadow-sm transition-colors">
              <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-[11px] font-bold uppercase">
                <span>Efisiensi Rata-Rata</span>
                <TrendingUp className="w-4 h-4 text-yellow-500" />
              </div>
              <div className="mt-2 font-mono font-black text-lg md:text-xl text-zinc-950 dark:text-zinc-100">
                {avgRangeEff} <span className="text-xs font-normal text-zinc-500 dark:text-zinc-400">km/L</span>
              </div>
              <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">Rasio efisiensi konsumsi</p>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-3xl p-4 border-2 border-zinc-200 dark:border-zinc-800 border-b-4 border-b-zinc-900 dark:border-b-yellow-400 shadow-sm transition-colors">
              <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-[11px] font-bold uppercase">
                <span>Rata-Rata / Pengisian</span>
                <Fuel className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
              </div>
              <div className="mt-2 font-mono font-black text-lg md:text-xl text-zinc-950 dark:text-zinc-100">
                Rp {avgCostPerFill.toLocaleString('id-ID')}
              </div>
              <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">Biaya rata sekali ke SPBU</p>
            </div>
          </div>

          {analyticsLogs.length === 0 ? (
            <div className="bg-zinc-50 dark:bg-zinc-900/50 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl p-10 text-center text-zinc-400 dark:text-zinc-500 text-xs space-y-2">
              <p>Belum ada data pengisian BBM pada rentang waktu ini.</p>
              <button
                onClick={onAddFuelLog}
                className="py-2 px-3.5 bg-yellow-400 hover:bg-yellow-300 text-zinc-950 font-bold text-xs rounded-xl shadow-xs cursor-pointer transition inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>Catat Pengisian BBM Baru</span>
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Graphic Chart 1: Tren Pengeluaran & Konsumsi BBM Bulanan */}
              <div className="bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 md:p-6 shadow-sm space-y-4 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-100 dark:border-zinc-800">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-zinc-900 dark:text-yellow-400" />
                      <span>Grafik Tren Pengeluaran & Konsumsi BBM Bulanan</span>
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                      Visualisasi total anggaran dan volume liter bensin per bulan
                    </p>
                  </div>

                  <div className="flex items-center gap-3 text-xs font-bold">
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-md bg-yellow-400"></span>
                      <span className="text-zinc-700 dark:text-zinc-300">Total Biaya (Rp)</span>
                    </span>
                  </div>
                </div>

                {/* Vertical Bar Chart Visualizer */}
                <div className="pt-6 pb-2">
                  <div className="h-56 flex items-end gap-3 sm:gap-6 px-2 border-b border-zinc-200 dark:border-zinc-800">
                    {fuelMonthlyData.map((item, idx) => {
                      const barPct = Math.max(Math.round((item.totalCost / maxFuelMonthlyCost) * 100), 14);

                      return (
                        <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group">
                          {/* Value Tooltip Label */}
                          <div className="opacity-80 group-hover:opacity-100 transition-opacity mb-2 text-center">
                            <span className="font-mono font-bold text-[10px] md:text-xs text-zinc-900 dark:text-zinc-100 block whitespace-nowrap">
                              Rp {(item.totalCost / 1000).toLocaleString('id-ID')}k
                            </span>
                            <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-mono hidden sm:block">
                              {item.totalLiters.toFixed(1)} L • {item.count}x
                            </span>
                          </div>

                          {/* Bar */}
                          <div
                            className="w-full max-w-[48px] rounded-xl bg-yellow-400 border border-yellow-500/30 shadow-xs transition-all duration-300 group-hover:bg-yellow-300"
                            style={{ height: `${barPct}%` }}
                            title={`${item.monthLabel}: Rp ${item.totalCost.toLocaleString('id-ID')} (${item.totalLiters.toFixed(1)} Liter, ${item.count} transaksi)`}
                          />

                          {/* X-axis Month Label */}
                          <span className="mt-2 text-[10px] md:text-xs font-bold text-zinc-600 dark:text-zinc-400 font-mono uppercase tracking-tight">
                            {item.monthLabel}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Graphic Chart 2: Komparasi Jenis BBM & Efisiensi */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Left: Proporsi Jenis Bahan Bakar */}
                <div className="lg:col-span-6 bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 shadow-sm space-y-4 transition-colors">
                  <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
                    <h4 className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                      <Fuel className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
                      <span>Distribusi Jenis Bahan Bakar</span>
                    </h4>
                    <span className="text-[11px] font-mono text-zinc-400 dark:text-zinc-500">
                      {fuelTypeList.length} Varian
                    </span>
                  </div>

                  <div className="space-y-3.5">
                    {fuelTypeList.map((f, idx) => (
                      <div key={idx} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400"></span>
                            <span className="font-extrabold text-zinc-900 dark:text-zinc-100">{f.type}</span>
                            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">
                              ({f.totalLiters.toFixed(1)} L • {f.count}x)
                            </span>
                          </div>

                          <div className="text-right">
                            <span className="font-mono font-black text-xs text-zinc-950 dark:text-zinc-100">
                              Rp {f.totalCost.toLocaleString('id-ID')}
                            </span>
                            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono ml-1.5">
                              {f.pctCost}%
                            </span>
                          </div>
                        </div>

                        <div className="w-full h-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden p-0.5 border border-zinc-200 dark:border-zinc-700 flex justify-between">
                          <div
                            className="h-full rounded-full bg-zinc-950 dark:bg-yellow-400 transition-all duration-500"
                            style={{ width: `${Math.min(f.pctCost, 100)}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 font-mono pt-0.5">
                          <span>Efisiensi Rata-Rata:</span>
                          <span className="font-bold text-zinc-900 dark:text-zinc-100">{f.avgEff} km/L</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right: Riwayat Efisiensi per Pengisian & SPBU Terbanyak */}
                <div className="lg:col-span-6 space-y-5">
                  {/* Efisiensi Log Trend Points */}
                  <div className="bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 shadow-sm space-y-3 transition-colors">
                    <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
                      <h4 className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                        <Activity className="w-4 h-4 text-yellow-500" />
                        <span>Riwayat Efisiensi (km/L)</span>
                      </h4>
                      <span className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
                        Target: {avgRangeEff} km/L
                      </span>
                    </div>

                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1 no-scrollbar">
                      {analyticsWithEff.length === 0 ? (
                        <div className="p-4 text-center text-zinc-400 dark:text-zinc-500 text-xs">
                          Belum ada data efisiensi km/L yang tercatat.
                        </div>
                      ) : (
                        analyticsWithEff.map((log) => (
                          <div
                            key={log.id}
                            className="p-2.5 bg-zinc-50 dark:bg-zinc-800/60 rounded-2xl border border-zinc-200 dark:border-zinc-700/60 flex items-center justify-between text-xs"
                          >
                            <div>
                              <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">{log.date}</span>
                              <span className="text-[11px] text-zinc-500 dark:text-zinc-400 ml-2">
                                {log.fuelType} ({log.liters} L)
                              </span>
                            </div>

                            <span className="px-2.5 py-0.5 bg-yellow-100 dark:bg-yellow-950/60 border border-yellow-300 dark:border-yellow-800 text-zinc-950 dark:text-yellow-400 font-mono font-bold rounded-lg">
                              {log.efficiencyKmPerLiter} km/L
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* SPBU Favorit / Langganan */}
                  <div className="bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 shadow-sm space-y-3 transition-colors">
                    <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
                      <h4 className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
                        <span>SPBU Langganan Armada</span>
                      </h4>
                      <span className="text-[11px] font-mono text-zinc-400 dark:text-zinc-500">Frekuensi</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {topStations.map((st, idx) => (
                        <div key={idx} className="p-2.5 bg-zinc-50 dark:bg-zinc-800/60 rounded-2xl border border-zinc-200 dark:border-zinc-700/60">
                          <span className="font-extrabold text-zinc-900 dark:text-zinc-100 line-clamp-1 block">
                            {st.station}
                          </span>
                          <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono mt-0.5 block">
                            {st.count}x pengisian • Rp {st.totalCost.toLocaleString('id-ID')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};