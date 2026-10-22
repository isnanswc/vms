import React, { useState } from 'react';
import type { Vehicle, SparePart, ServiceRecord, ServiceItemDetail } from '../types';
import { 
  Wrench, 
  AlertTriangle, 
  Plus, 
  Download, 
  ChevronRight, 
  Store, 
  Gauge, 
  FileCheck, 
  BarChart3, 
  TrendingUp, 
  Calendar, 
  Wallet, 
  PieChart, 
  X, 
  Trash2, 
  FileText,
  Check
} from 'lucide-react';

interface ServiceViewProps {
  vehicles: Vehicle[];
  spareParts: SparePart[];
  serviceRecords: ServiceRecord[];
  onAddService: () => void;
  onExportPdf: () => void;
  onUpdateService?: (record: ServiceRecord) => void;
  onDeleteService?: (recordId: string) => void;
}

export const ServiceView: React.FC<ServiceViewProps> = ({
  vehicles,
  spareParts,
  serviceRecords,
  onAddService,
  onExportPdf,
  onUpdateService,
  onDeleteService,
}) => {
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('all');
  const [selectedRecordForDetail, setSelectedRecordForDetail] = useState<ServiceRecord | null>(null);
  const [viewMode, setViewMode] = useState<'history_list' | 'analytics'>('history_list');
  const [timeRange, setTimeRange] = useState<'30d' | '3m' | '6m' | '1y' | 'all'>('all');

  const filteredRecords = selectedVehicleId === 'all'
    ? serviceRecords
    : serviceRecords.filter((r) => r.vehicleId === selectedVehicleId);

  // Filtered by selected time range for analytics
  const now = new Date();
  const analyticsRecords = filteredRecords.filter((r) => {
    if (timeRange === 'all') return true;
    const rDate = new Date(r.date);
    const diffDays = (now.getTime() - rDate.getTime()) / (1000 * 60 * 60 * 24);
    if (timeRange === '30d') return diffDays <= 30;
    if (timeRange === '3m') return diffDays <= 90;
    if (timeRange === '6m') return diffDays <= 180;
    if (timeRange === '1y') return diffDays <= 365;
    return true;
  });

  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId);
  const totalExpenseOnService = filteredRecords.reduce((acc, r) => acc + r.cost, 0);
  const registeredPartsCount = (selectedVehicleId === 'all'
    ? spareParts
    : spareParts.filter((p) => p.vehicleId === selectedVehicleId)
  ).length;

  // Analytics Metrics calculations
  const totalAnalyticsCost = analyticsRecords.reduce((acc, r) => acc + r.cost, 0);
  const routineRecords = analyticsRecords.filter((r) => r.type === 'routine');
  const unexpectedRecords = analyticsRecords.filter((r) => r.type === 'unexpected');
  const routineCost = routineRecords.reduce((acc, r) => acc + r.cost, 0);
  const unexpectedCost = unexpectedRecords.reduce((acc, r) => acc + r.cost, 0);
  const routinePct = totalAnalyticsCost > 0 ? Math.round((routineCost / totalAnalyticsCost) * 100) : 0;
  const unexpectedPct = totalAnalyticsCost > 0 ? Math.round((unexpectedCost / totalAnalyticsCost) * 100) : 0;
  const avgCostPerService = analyticsRecords.length > 0 ? Math.round(totalAnalyticsCost / analyticsRecords.length) : 0;

  // Monthly grouping for bar chart
  const monthlyMap: Record<string, { monthLabel: string; routineCost: number; unexpectedCost: number; totalCost: number; count: number }> = {};
  const sortedForMonthly = [...analyticsRecords].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  sortedForMonthly.forEach((r) => {
    const d = new Date(r.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const monthLabel = d.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' });
    if (!monthlyMap[key]) {
      monthlyMap[key] = { monthLabel, routineCost: 0, unexpectedCost: 0, totalCost: 0, count: 0 };
    }
    if (r.type === 'routine') {
      monthlyMap[key].routineCost += r.cost;
    } else {
      monthlyMap[key].unexpectedCost += r.cost;
    }
    monthlyMap[key].totalCost += r.cost;
    monthlyMap[key].count += 1;
  });
  const monthlyData = Object.values(monthlyMap);
  const maxMonthlyCost = monthlyData.length > 0 ? Math.max(...monthlyData.map((m) => m.totalCost), 1) : 1;

  // Top serviced components & labor
  const itemSpendMap: Record<string, { count: number; totalCost: number; category: string }> = {};
  analyticsRecords.forEach((r) => {
    if (r.itemizedDetails && r.itemizedDetails.length > 0) {
      r.itemizedDetails.forEach((item) => {
        const name = item.name.trim();
        if (!itemSpendMap[name]) {
          itemSpendMap[name] = { count: 0, totalCost: 0, category: item.category };
        }
        itemSpendMap[name].count += 1;
        itemSpendMap[name].totalCost += item.cost;
      });
    } else if (r.replacedParts && r.replacedParts.length > 0) {
      const costPerPart = Math.round(r.cost / r.replacedParts.length);
      r.replacedParts.forEach((p) => {
        const name = p.trim();
        if (!itemSpendMap[name]) {
          itemSpendMap[name] = { count: 0, totalCost: 0, category: 'sparepart' };
        }
        itemSpendMap[name].count += 1;
        itemSpendMap[name].totalCost += costPerPart;
      });
    } else {
      const name = r.title.trim();
      if (!itemSpendMap[name]) {
        itemSpendMap[name] = { count: 0, totalCost: 0, category: r.type === 'routine' ? 'jasa' : 'darurat' };
      }
      itemSpendMap[name].count += 1;
      itemSpendMap[name].totalCost += r.cost;
    }
  });

  const topItemsList = Object.entries(itemSpendMap)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.totalCost - a.totalCost)
    .slice(0, 6);

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
                <span>{veh.name}</span>
                <span className="font-mono text-[10px] opacity-70">[{veh.plateNumber}]</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
            Buku Servis Digital & Suku Cadang
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {selectedVehicle
              ? `Riwayat perawatan untuk ${selectedVehicle.name} (${selectedVehicle.plateNumber})`
              : 'Semua riwayat pemeliharaan berkala & penggantian sparepart armada'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onExportPdf}
            className="flex items-center gap-1.5 py-2 px-3 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-bold rounded-2xl transition cursor-pointer shadow-xs"
            title="Download PDF Sertifikat Servis Kendaraan"
          >
            <Download className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
            <span className="hidden sm:inline">Export PDF</span>
          </button>

          <button
            onClick={onAddService}
            className="flex items-center gap-1.5 py-2.5 px-4 bg-yellow-400 hover:bg-yellow-300 text-zinc-950 text-xs font-black rounded-2xl transition shadow-xs cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>CATAT SERVIS</span>
          </button>
        </div>
      </div>

      {/* Service Expense KPI Summary Card */}
      <div className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 rounded-3xl p-5 border-2 border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-4 border-b-yellow-400 transition-colors">
        <div>
          <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">
            Total Biaya Pemeliharaan Armada
          </span>
          <div className="mt-1 font-mono font-black text-2xl md:text-3xl text-zinc-950 dark:text-zinc-100">
            Rp {totalExpenseOnService.toLocaleString('id-ID')}
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Mencakup {filteredRecords.length} transaksi servis berkala & perbaikan darurat
          </p>
        </div>

        {/* View Switcher: List Transaksi Servis vs Sheet Analitik */}
        <div className="grid grid-cols-2 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 text-xs font-bold">
          <button
            onClick={() => setViewMode('history_list')}
            className={`py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
              viewMode === 'history_list'
                ? 'bg-white dark:bg-zinc-900 text-zinc-950 dark:text-zinc-100 shadow-xs'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span>Daftar Servis ({filteredRecords.length})</span>
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
            <span>Sheet Analitik Servis</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: CLEAN LIST OF SERVICE RECORDS (CLICK TO OPEN 2-TAB MODAL) */}
      {viewMode === 'history_list' && (
        <div className="space-y-3">
          {filteredRecords.length === 0 ? (
            <div className="bg-zinc-50 border-2 border-dashed border-zinc-200 rounded-3xl p-10 text-center text-zinc-400 text-xs space-y-2">
              <p>Belum ada riwayat servis untuk unit kendaraan ini.</p>
              <button
                onClick={onAddService}
                className="py-2 px-3.5 bg-yellow-400 hover:bg-yellow-300 text-zinc-950 font-bold text-xs rounded-xl shadow-xs cursor-pointer transition inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Catat Servis Pertama</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
              {filteredRecords.map((record) => {
                const veh = vehicles.find((v) => v.id === record.vehicleId);
                const isUnexpected = record.type === 'unexpected';
                const partsCount = record.itemizedDetails?.length || record.replacedParts?.length || 0;

                return (
                  <div
                    key={record.id}
                    onClick={() => setSelectedRecordForDetail(record)}
                    className="bg-white dark:bg-zinc-900 rounded-3xl border-2 border-zinc-200 dark:border-zinc-800 hover:border-zinc-900 dark:hover:border-yellow-400 transition-all p-4.5 shadow-xs hover:shadow-md cursor-pointer flex flex-col justify-between group active:scale-[0.99]"
                  >
                    <div>
                      {/* Top Plate & Date */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-lg bg-zinc-950 dark:bg-zinc-800 text-white font-mono font-bold text-[11px] border border-zinc-800 dark:border-zinc-700">
                            {veh?.plateNumber || 'Unit'}
                          </span>
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${
                              isUnexpected
                                ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                            }`}
                          >
                            {isUnexpected ? 'Tak Terduga' : 'Berkala'}
                          </span>
                        </div>
                        <span className="text-xs text-zinc-400 dark:text-zinc-500 font-mono">{record.date}</span>
                      </div>

                      {/* Title */}
                      <h4 className="font-extrabold text-sm md:text-base text-zinc-900 dark:text-zinc-100 group-hover:text-black dark:group-hover:text-white leading-snug">
                        {record.title}
                      </h4>

                      {/* Workshop & Odometer */}
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                        <span className="flex items-center gap-1">
                          <Store className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />
                          <span>{record.workshopName}</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 font-mono">
                          <Gauge className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />
                          <span>{record.odometerKm.toLocaleString('id-ID')} KM</span>
                        </span>
                      </div>

                      {/* Parts Pill Preview */}
                      <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                        {record.itemizedDetails && record.itemizedDetails.length > 0 ? (
                          record.itemizedDetails.slice(0, 3).map((item, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-[10px] font-medium rounded-lg border border-zinc-200 dark:border-zinc-700"
                            >
                              {item.name}
                            </span>
                          ))
                        ) : record.replacedParts && record.replacedParts.length > 0 ? (
                          record.replacedParts.slice(0, 3).map((p, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-[10px] font-medium rounded-lg border border-zinc-200 dark:border-zinc-700"
                            >
                              {p}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] text-zinc-400 dark:text-zinc-500 italic">Pemeriksaan umum</span>
                        )}
                        {partsCount > 3 && (
                          <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold">
                            +{partsCount - 3} lainnya
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Bottom Cost & Open Detail Action */}
                    <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase font-bold block">
                          Total Biaya
                        </span>
                        <span className="font-mono font-black text-base text-zinc-950 dark:text-zinc-100">
                          Rp {record.cost.toLocaleString('id-ID')}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 text-xs font-bold text-yellow-600 dark:text-yellow-400 group-hover:text-zinc-950 dark:group-hover:text-white transition-colors">
                        <span>Lihat Rincian & Sparepart</span>
                        <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: SHEET ANALITIK BIAYA & METRIK GRAFIK WAKTU */}
      {viewMode === 'analytics' && (
        <div className="space-y-5 animate-fade-in">
          {/* Filter Rentang Waktu Bar */}
          <div className="bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800 rounded-3xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
              <span className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                Rentang Waktu Analitik
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

          {/* Key Analytics Metric Cards (4 Cards Grid) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            <div className="bg-white dark:bg-zinc-900 rounded-3xl p-4 border-2 border-zinc-200 dark:border-zinc-800 border-b-4 border-b-yellow-400 shadow-sm transition-colors">
              <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-[11px] font-bold uppercase">
                <span>Biaya Servis</span>
                <Wallet className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
              </div>
              <div className="mt-2 font-mono font-black text-lg md:text-xl text-zinc-950 dark:text-zinc-100">
                Rp {totalAnalyticsCost.toLocaleString('id-ID')}
              </div>
              <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">Dalam rentang terpilih</p>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-3xl p-4 border-2 border-zinc-200 dark:border-zinc-800 border-b-4 border-b-zinc-900 dark:border-b-yellow-400 shadow-sm transition-colors">
              <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-[11px] font-bold uppercase">
                <span>Rata-Rata / Kunjungan</span>
                <TrendingUp className="w-4 h-4 text-yellow-500" />
              </div>
              <div className="mt-2 font-mono font-black text-lg md:text-xl text-zinc-950 dark:text-zinc-100">
                Rp {avgCostPerService.toLocaleString('id-ID')}
              </div>
              <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">Nilai rata per nota servis</p>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-3xl p-4 border-2 border-zinc-200 dark:border-zinc-800 border-b-4 border-b-zinc-900 dark:border-b-yellow-400 shadow-sm transition-colors">
              <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-[11px] font-bold uppercase">
                <span>Frekuensi Servis</span>
                <Wrench className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
              </div>
              <div className="mt-2 font-mono font-black text-lg md:text-xl text-zinc-950 dark:text-zinc-100">
                {analyticsRecords.length} <span className="text-xs font-normal text-zinc-500 dark:text-zinc-400">Kunjungan</span>
              </div>
              <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                {routineRecords.length} Rutin • {unexpectedRecords.length} Darurat • {registeredPartsCount} Part Aktif
              </p>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-3xl p-4 border-2 border-zinc-200 dark:border-zinc-800 border-b-4 border-b-zinc-900 dark:border-b-yellow-400 shadow-sm transition-colors">
              <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-[11px] font-bold uppercase">
                <span>Rasio Darurat</span>
                <AlertTriangle className="w-4 h-4 text-amber-500" />
              </div>
              <div className="mt-2 font-mono font-black text-lg md:text-xl text-zinc-950 dark:text-zinc-100">
                {unexpectedPct}% <span className="text-xs font-normal text-zinc-500 dark:text-zinc-400">Biaya Darurat</span>
              </div>
              <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                {unexpectedPct > 35 ? '⚠️ Rasio darurat tinggi' : '✓ Rasio terkendali'}
              </p>
            </div>
          </div>

          {analyticsRecords.length === 0 ? (
            <div className="bg-zinc-50 border-2 border-dashed border-zinc-200 rounded-3xl p-10 text-center text-zinc-400 text-xs space-y-2">
              <p>Belum ada data riwayat servis pada rentang waktu ini.</p>
              <button
                onClick={onAddService}
                className="py-2 px-3.5 bg-yellow-400 hover:bg-yellow-300 text-zinc-950 font-bold text-xs rounded-xl shadow-xs cursor-pointer transition inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>Catat Servis Baru</span>
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Graphic Chart 1: Tren Pengeluaran Servis Bulanan (Bar Chart) */}
              <div className="bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 md:p-6 shadow-sm space-y-4 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-100 dark:border-zinc-800">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-zinc-900 dark:text-yellow-400" />
                      <span>Grafik Tren Pengeluaran Servis Bulanan</span>
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                      Visualisasi pengeluaran servis berkala vs perbaikan darurat per bulan
                    </p>
                  </div>

                  <div className="flex items-center gap-3 text-xs font-bold">
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-md bg-yellow-400"></span>
                      <span className="text-zinc-700 dark:text-zinc-300">Berkala / Rutin</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-md bg-zinc-900 dark:bg-zinc-600"></span>
                      <span className="text-zinc-700 dark:text-zinc-300">Tak Terduga</span>
                    </span>
                  </div>
                </div>

                {/* Vertical Bar Chart Visualizer */}
                <div className="pt-6 pb-2">
                  <div className="h-56 flex items-end gap-3 sm:gap-6 px-2 border-b border-zinc-200 dark:border-zinc-800">
                    {monthlyData.map((item, idx) => {
                      const totalBarPct = Math.max(Math.round((item.totalCost / maxMonthlyCost) * 100), 12);
                      const routineShare = item.totalCost > 0 ? (item.routineCost / item.totalCost) * 100 : 0;
                      const unexpectedShare = item.totalCost > 0 ? (item.unexpectedCost / item.totalCost) * 100 : 0;

                      return (
                        <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group">
                          {/* Value Tooltip Label */}
                          <div className="opacity-80 group-hover:opacity-100 transition-opacity mb-2 text-center">
                            <span className="font-mono font-bold text-[10px] md:text-xs text-zinc-900 dark:text-zinc-100 block whitespace-nowrap">
                              Rp {(item.totalCost / 1000).toLocaleString('id-ID')}k
                            </span>
                            <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-mono hidden sm:block">
                              {item.count}x servis
                            </span>
                          </div>

                          {/* Stacked Bar */}
                          <div
                            className="w-full max-w-[48px] rounded-xl overflow-hidden flex flex-col justify-end bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-xs transition-all duration-300 group-hover:brightness-95"
                            style={{ height: `${totalBarPct}%` }}
                            title={`${item.monthLabel}: Total Rp ${item.totalCost.toLocaleString('id-ID')} (Rutin: Rp ${item.routineCost.toLocaleString('id-ID')}, Darurat: Rp ${item.unexpectedCost.toLocaleString('id-ID')})`}
                          >
                            {item.unexpectedCost > 0 && (
                              <div
                                className="w-full bg-zinc-900 dark:bg-zinc-600 transition-all duration-300"
                                style={{ height: `${unexpectedShare}%` }}
                              />
                            )}
                            {item.routineCost > 0 && (
                              <div
                                className="w-full bg-yellow-400 transition-all duration-300"
                                style={{ height: `${routineShare}%` }}
                              />
                            )}
                          </div>

                          {/* X-axis Label */}
                          <span className="mt-2 text-[10px] md:text-xs font-bold text-zinc-600 dark:text-zinc-400 font-mono uppercase tracking-tight">
                            {item.monthLabel}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Graphic Chart 2: Komposisi Biaya & Breakdown Suku Cadang Terbanyak */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Left: Rasio Rutin vs Tak Terduga */}
                <div className="lg:col-span-5 bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 shadow-sm space-y-4 transition-colors">
                  <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
                    <h4 className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                      <PieChart className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
                      <span>Rasio Jenis Pemeliharaan</span>
                    </h4>
                    <span className="text-[11px] font-mono text-zinc-400">
                      {analyticsRecords.length} Catatan
                    </span>
                  </div>

                  {/* Split Visual Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-zinc-700 flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-yellow-400"></span>
                        Berkala ({routinePct}%)
                      </span>
                      <span className="text-zinc-900 flex items-center gap-1">
                        Tak Terduga ({unexpectedPct}%)
                        <span className="w-2.5 h-2.5 rounded-full bg-zinc-900 dark:bg-zinc-600"></span>
                      </span>
                    </div>

                    <div className="h-4 w-full bg-zinc-100 dark:bg-zinc-800 rounded-xl overflow-hidden p-0.5 border border-zinc-200 dark:border-zinc-700 flex gap-0.5">
                      <div
                        className="h-full bg-yellow-400 rounded-l-lg transition-all duration-500"
                        style={{ width: `${routinePct}%` }}
                        title={`Servis Berkala: Rp ${routineCost.toLocaleString('id-ID')}`}
                      />
                      <div
                        className="h-full bg-zinc-900 dark:bg-zinc-600 rounded-r-lg transition-all duration-500"
                        style={{ width: `${unexpectedPct}%` }}
                        title={`Tak Terduga: Rp ${unexpectedCost.toLocaleString('id-ID')}`}
                      />
                    </div>
                  </div>

                  {/* Breakdown Cards */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="p-3 bg-yellow-50/60 dark:bg-yellow-950/40 border border-yellow-200 dark:border-yellow-800 rounded-2xl">
                      <span className="text-[10px] font-black uppercase text-yellow-800 dark:text-yellow-400 block">
                        Servis Berkala
                      </span>
                      <span className="font-mono font-black text-sm text-zinc-950 dark:text-zinc-100 mt-1 block">
                        Rp {routineCost.toLocaleString('id-ID')}
                      </span>
                      <span className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5 block">
                        {routineRecords.length} kali perawatan
                      </span>
                    </div>

                    <div className="p-3 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl">
                      <span className="text-[10px] font-black uppercase text-zinc-700 dark:text-zinc-300 block">
                        Biaya Darurat
                      </span>
                      <span className="font-mono font-black text-sm text-zinc-950 dark:text-zinc-100 mt-1 block">
                        Rp {unexpectedCost.toLocaleString('id-ID')}
                      </span>
                      <span className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5 block">
                        {unexpectedRecords.length} kali perbaikan
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed bg-zinc-50 dark:bg-zinc-800/60 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-700">
                    💡 <strong>Tips Efisiensi:</strong> Perawatan berkala tepat waktu mencegah kerusakan komponen besar yang memicu lonjakan biaya darurat hingga 3x lipat.
                  </p>
                </div>

                {/* Right: Top 6 Suku Cadang & Biaya Servis Terbesar */}
                <div className="lg:col-span-7 bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 shadow-sm space-y-4 transition-colors">
                  <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
                    <h4 className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                      <Wrench className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
                      <span>Komponen & Pengeluaran Servis Terbanyak</span>
                    </h4>
                    <span className="text-[11px] font-mono text-zinc-400 dark:text-zinc-500">Peringkat Biaya</span>
                  </div>

                  {topItemsList.length === 0 ? (
                    <div className="p-6 text-center text-zinc-400 dark:text-zinc-500 text-xs">
                      Belum ada rincian komponen yang tersimpan.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {topItemsList.map((item, idx) => {
                        const pctOfTotal = totalAnalyticsCost > 0 ? Math.round((item.totalCost / totalAnalyticsCost) * 100) : 0;
                        return (
                          <div key={idx} className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-mono font-black text-[10px] flex items-center justify-center shrink-0">
                                  #{idx + 1}
                                </span>
                                <span className="font-extrabold text-zinc-900 dark:text-zinc-100">{item.name}</span>
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 uppercase font-bold">
                                  {item.category === 'sparepart' ? 'Part' : item.category === 'jasa' ? 'Jasa' : 'Darurat'}
                                </span>
                                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">
                                  ({item.count}x)
                                </span>
                              </div>

                              <div className="text-right">
                                <span className="font-mono font-black text-xs text-zinc-950 dark:text-zinc-100">
                                  Rp {item.totalCost.toLocaleString('id-ID')}
                                </span>
                                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono ml-1.5">
                                  {pctOfTotal}%
                                </span>
                              </div>
                            </div>

                            <div className="w-full h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden p-0.5 border border-zinc-200 dark:border-zinc-700">
                              <div
                                className="h-full rounded-full bg-yellow-400 transition-all duration-500"
                                style={{ width: `${Math.min(pctOfTotal, 100)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL DETAIL SERVIS: 2 TAB (INFORMASI DASAR & SPAREPART) */}
      {/* ======================================================== */}
      {selectedRecordForDetail && (
        <ServiceDetailModal
          isOpen={true}
          onClose={() => setSelectedRecordForDetail(null)}
          record={selectedRecordForDetail}
          vehicle={vehicles.find((v) => v.id === selectedRecordForDetail.vehicleId)}
          onSave={(updated) => {
            onUpdateService?.(updated);
            setSelectedRecordForDetail(null);
          }}
          onDelete={(id) => {
            if (window.confirm('Yakin ingin menghapus catatan servis ini?')) {
              onDeleteService?.(id);
              setSelectedRecordForDetail(null);
            }
          }}
        />
      )}
    </div>
  );
};

/* ================================================================ */
/* COMPONENT: SERVICE DETAIL MODAL DENGAN TAB 1 & TAB 2             */
/* ================================================================ */
interface ServiceDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: ServiceRecord;
  vehicle?: Vehicle;
  onSave: (updated: ServiceRecord) => void;
  onDelete: (recordId: string) => void;
}

const ServiceDetailModal: React.FC<ServiceDetailModalProps> = ({
  isOpen,
  onClose,
  record,
  vehicle,
  onSave,
  onDelete,
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'parts'>('info');

  // Form states for Tab 1 (Informasi Dasar)
  const [title, setTitle] = useState(record.title);
  const [date, setDate] = useState(record.date);
  const [odometerKm, setOdometerKm] = useState(record.odometerKm);
  const [workshopName, setWorkshopName] = useState(record.workshopName);
  const [type, setType] = useState<'routine' | 'unexpected'>(record.type);
  const [notes, setNotes] = useState(record.notes || '');

  // Form states for Tab 2 (Sparepart yang di-service)
  const [items, setItems] = useState<ServiceItemDetail[]>(() => {
    if (record.itemizedDetails && record.itemizedDetails.length > 0) {
      return [...record.itemizedDetails];
    }
    if (record.replacedParts && record.replacedParts.length > 0) {
      const avgCost = Math.round(record.cost / record.replacedParts.length);
      return record.replacedParts.map((p) => ({
        name: p,
        category: 'sparepart' as const,
        cost: avgCost,
      }));
    }
    return [
      { name: record.title || 'Servis & Perawatan', category: 'sparepart', cost: record.cost }
    ];
  });

  // New sparepart input state inside Tab 2
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<'sparepart' | 'jasa' | 'darurat'>('sparepart');
  const [newItemCost, setNewItemCost] = useState<number>(0);

  if (!isOpen) return null;

  const totalCalculatedCost = items.reduce((acc, it) => acc + (Number(it.cost) || 0), 0);
  const partsSubtotal = items.filter((i) => i.category === 'sparepart').reduce((acc, it) => acc + (Number(it.cost) || 0), 0);
  const laborSubtotal = items.filter((i) => i.category !== 'sparepart').reduce((acc, it) => acc + (Number(it.cost) || 0), 0);

  const handleAddItem = () => {
    if (!newItemName.trim()) return;
    setItems([
      ...items,
      {
        name: newItemName.trim(),
        category: newItemCategory,
        cost: Number(newItemCost) || 0,
      },
    ]);
    setNewItemName('');
    setNewItemCost(0);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, idx) => idx !== index));
  };

  const handleUpdateItem = (index: number, field: keyof ServiceItemDetail, val: any) => {
    setItems(
      items.map((item, idx) => (idx === index ? { ...item, [field]: val } : item))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedRecord: ServiceRecord = {
      ...record,
      title,
      date,
      odometerKm: Number(odometerKm),
      workshopName,
      type,
      cost: totalCalculatedCost > 0 ? totalCalculatedCost : record.cost,
      notes: notes.trim() || undefined,
      replacedParts: items.map((i) => i.name),
      itemizedDetails: items,
    };
    onSave(updatedRecord);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-sm animate-fade-in text-zinc-900 dark:text-zinc-100">
      <div className="w-full max-w-2xl bg-white dark:bg-zinc-900 border-2 border-zinc-900 dark:border-zinc-700 rounded-3xl p-5 md:p-6 shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar flex flex-col">
        {/* Header Modal */}
        <div className="flex items-start justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-lg bg-zinc-950 dark:bg-zinc-800 text-white font-mono font-black text-xs border border-zinc-800 dark:border-zinc-700">
                {vehicle?.plateNumber || 'Unit'}
              </span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400 font-bold">{vehicle?.name}</span>
            </div>
            <h3 className="font-black text-base md:text-lg text-zinc-900 dark:text-zinc-100">
              Detail & Formulir Buku Servis
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2 TABS NAVIGATION */}
        <div className="flex p-1 bg-zinc-100 dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 text-xs font-bold my-4">
          <button
            type="button"
            onClick={() => setActiveTab('info')}
            className={`flex-1 py-2.5 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'info'
                ? 'bg-white dark:bg-zinc-900 text-zinc-950 dark:text-zinc-100 shadow-xs'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            <FileText className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
            <span>Tab 1: Informasi Dasar</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('parts')}
            className={`flex-1 py-2.5 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'parts'
                ? 'bg-yellow-400 text-zinc-950 shadow-xs'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            <Wrench className="w-4 h-4 stroke-[2.5]" />
            <span>Tab 2: Sparepart yang Di-Service ({items.length})</span>
          </button>
        </div>

        {/* FORM CONTENT */}
        <form onSubmit={handleSubmit} className="flex-1 space-y-4">
          {/* ======================================================== */}
          {/* TAB 1: INFORMASI DASAR                                   */}
          {/* ======================================================== */}
          {activeTab === 'info' && (
            <div className="space-y-3.5 text-xs animate-fade-in">
              {/* Jenis Servis Switcher */}
              <div>
                <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">Kategori Perawatan</label>
                <div className="grid grid-cols-2 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 font-bold">
                  <button
                    type="button"
                    onClick={() => setType('routine')}
                    className={`py-2 rounded-lg transition ${
                      type === 'routine' ? 'bg-white dark:bg-zinc-900 text-zinc-950 dark:text-zinc-100 shadow-xs' : 'text-zinc-500 dark:text-zinc-400'
                    }`}
                  >
                    Servis Berkala Rutin
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('unexpected')}
                    className={`py-2 rounded-lg transition flex items-center justify-center gap-1.5 ${
                      type === 'unexpected' ? 'bg-yellow-400 text-zinc-950 shadow-xs' : 'text-zinc-500 dark:text-zinc-400'
                    }`}
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Biaya Tak Terduga / Darurat</span>
                  </button>
                </div>
              </div>

              {/* Judul Servis */}
              <div>
                <label className="block font-bold text-zinc-900 dark:text-zinc-100 mb-1">
                  Judul Pekerjaan Servis <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 font-bold focus:outline-none focus:border-zinc-900 dark:focus:border-yellow-400"
                  required
                />
              </div>

              {/* Tanggal & Odometer */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">Tanggal Pengerjaan</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 font-mono focus:outline-none focus:border-zinc-900 dark:focus:border-yellow-400"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">Odometer Terkini (KM)</label>
                  <input
                    type="number"
                    value={odometerKm}
                    onChange={(e) => setOdometerKm(Number(e.target.value))}
                    className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 font-mono font-bold focus:outline-none focus:border-zinc-900 dark:focus:border-yellow-400"
                    required
                  />
                </div>
              </div>

              {/* Bengkel & Biaya Keseluruhan */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">Nama Bengkel / Penyedia</label>
                  <input
                    type="text"
                    value={workshopName}
                    onChange={(e) => setWorkshopName(e.target.value)}
                    placeholder="Contoh: AHASS, Auto2000, Bengkel Mandiri"
                    className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 dark:focus:border-yellow-400"
                  />
                </div>
                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">Grand Total Biaya (Rp)</label>
                  <div className="w-full px-3 py-2.5 bg-yellow-50/60 dark:bg-yellow-950/40 border-2 border-yellow-400 dark:border-yellow-600 rounded-xl text-zinc-950 dark:text-yellow-400 font-mono font-black text-sm">
                    Rp {totalCalculatedCost.toLocaleString('id-ID')}
                  </div>
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5 block">
                    *Terkalkulasi otomatis dari rincian Tab 2
                  </span>
                </div>
              </div>

              {/* Catatan / Keluhan */}
              <div>
                <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">Catatan Teknisi / Kronologi Perbaikan</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Catatan diagnosa mekanik, kendala yang ditemukan, garansi servis..."
                  rows={3}
                  className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 dark:focus:border-yellow-400"
                />
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: SPAREPART YANG DI-SERVICE                         */}
          {/* ======================================================== */}
          {activeTab === 'parts' && (
            <div className="space-y-4 text-xs animate-fade-in">
              {/* Tambah Komponen Baru Bar */}
              <div className="p-3 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-2xl space-y-2">
                <span className="font-extrabold text-xs text-zinc-900 dark:text-zinc-100 block">
                  Tambah Komponen / Suku Cadang yang Diservis
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                  <div className="sm:col-span-5">
                    <input
                      type="text"
                      placeholder="Nama sparepart (misal: Oli Mesin SPX2)"
                      value={newItemName}
                      onChange={(e) => setNewItemName(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 font-bold focus:outline-none focus:border-zinc-900 dark:focus:border-yellow-400"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <select
                      value={newItemCategory}
                      onChange={(e) => setNewItemCategory(e.target.value as any)}
                      className="w-full px-2 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 font-medium focus:outline-none focus:border-zinc-900 dark:focus:border-yellow-400"
                    >
                      <option value="sparepart">Suku Cadang</option>
                      <option value="jasa">Jasa Pasang</option>
                      <option value="darurat">Perbaikan Darurat</option>
                    </select>
                  </div>
                  <div className="sm:col-span-3">
                    <input
                      type="number"
                      placeholder="Biaya (Rp)"
                      value={newItemCost || ''}
                      onChange={(e) => setNewItemCost(Number(e.target.value))}
                      className="w-full px-2 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 font-mono font-bold focus:outline-none focus:border-zinc-900 dark:focus:border-yellow-400"
                    />
                  </div>
                  <div className="sm:col-span-1 flex items-center">
                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="w-full py-2 bg-yellow-400 hover:bg-yellow-300 text-zinc-950 font-black rounded-xl transition flex items-center justify-center cursor-pointer shadow-xs"
                      title="Tambahkan ke daftar"
                    >
                      <Plus className="w-4 h-4 stroke-[3]" />
                    </button>
                  </div>
                </div>
              </div>

              {/* List of Itemized Spareparts */}
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 no-scrollbar">
                {items.length === 0 ? (
                  <div className="p-6 text-center text-zinc-400 dark:text-zinc-500 bg-zinc-50 dark:bg-zinc-800/40 border border-dashed border-zinc-200 dark:border-zinc-700 rounded-2xl">
                    Belum ada sparepart yang dimasukkan. Gunakan formulir di atas untuk merincikan komponen.
                  </div>
                ) : (
                  items.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs"
                    >
                      <div className="flex-1 flex items-center gap-2">
                        <span
                          className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                            item.category === 'sparepart'
                              ? 'bg-yellow-400'
                              : item.category === 'jasa'
                              ? 'bg-zinc-950 dark:bg-zinc-400'
                              : 'bg-red-500'
                          }`}
                        ></span>
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => handleUpdateItem(idx, 'name', e.target.value)}
                          className="font-bold text-zinc-900 dark:text-zinc-100 bg-transparent border-b border-transparent hover:border-zinc-300 dark:hover:border-zinc-600 focus:border-zinc-900 dark:focus:border-yellow-400 focus:outline-none px-1 py-0.5 flex-1"
                        />
                        <span className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 rounded-md text-[10px] uppercase font-mono shrink-0">
                          {item.category}
                        </span>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 pl-4 sm:pl-0">
                        <div className="flex items-center gap-1">
                          <span className="text-zinc-400 font-mono">Rp</span>
                          <input
                            type="number"
                            value={item.cost}
                            onChange={(e) => handleUpdateItem(idx, 'cost', Number(e.target.value))}
                            className="font-mono font-black text-zinc-950 dark:text-zinc-100 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2 py-1 w-28 text-right focus:outline-none focus:border-zinc-900 dark:focus:border-yellow-400"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer"
                          title="Hapus komponen ini"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Subtotal Financial Box */}
              <div className="p-3.5 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-2xl space-y-1.5 font-mono text-xs">
                <div className="flex justify-between text-zinc-500 dark:text-zinc-400">
                  <span>Subtotal Sparepart Fisik:</span>
                  <span>Rp {partsSubtotal.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-zinc-500 dark:text-zinc-400">
                  <span>Subtotal Jasa / Teknisi:</span>
                  <span>Rp {laborSubtotal.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between font-black text-sm text-zinc-950 dark:text-zinc-100 pt-2 border-t border-zinc-200 dark:border-zinc-700">
                  <span>Grand Total Seluruhnya:</span>
                  <span>Rp {totalCalculatedCost.toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>
          )}

          {/* MODAL ACTION BUTTONS */}
          <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => onDelete(record.id)}
              className="py-2.5 px-3 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 font-bold text-xs transition cursor-pointer flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus Servis</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-4 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 font-bold text-xs transition cursor-pointer"
              >
                Batal
              </button>

              <button
                type="submit"
                className="py-2.5 px-5 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-zinc-950 font-black text-xs transition shadow-sm cursor-pointer flex items-center gap-1.5 active:scale-95"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Simpan Perubahan</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
