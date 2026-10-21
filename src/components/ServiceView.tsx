import React, { useState } from 'react';
import type { Vehicle, SparePart, ServiceRecord } from '../types';
import { 
  Wrench, 
  AlertTriangle, 
  Plus, 
  CheckCircle2, 
  Download, 
  AlertOctagon,
  ChevronDown,
  ChevronUp,
  Store,
  Gauge,
  FileCheck,
  Layers
} from 'lucide-react';

interface ServiceViewProps {
  vehicles: Vehicle[];
  spareParts: SparePart[];
  serviceRecords: ServiceRecord[];
  onAddService: () => void;
  onExportPdf: () => void;
}

export const ServiceView: React.FC<ServiceViewProps> = ({
  vehicles,
  spareParts,
  serviceRecords,
  onAddService,
  onExportPdf,
}) => {
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('all');
  const [expandedRecordId, setExpandedRecordId] = useState<string | null>(serviceRecords[0]?.id || null);
  const [viewMode, setViewMode] = useState<'history_list' | 'parts_health'>('history_list');

  const filteredRecords = selectedVehicleId === 'all'
    ? serviceRecords
    : serviceRecords.filter((r) => r.vehicleId === selectedVehicleId);

  const filteredParts = selectedVehicleId === 'all'
    ? spareParts
    : spareParts.filter((p) => p.vehicleId === selectedVehicleId);

  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId);

  const toggleExpand = (id: string) => {
    setExpandedRecordId(expandedRecordId === id ? null : id);
  };

  const totalExpenseOnService = filteredRecords.reduce((acc, r) => acc + r.cost, 0);

  const getStatusBadge = (status: SparePart['status'], pct: number) => {
    switch (status) {
      case 'critical':
        return (
          <span className="px-2.5 py-1 rounded-full bg-red-100 text-red-700 border border-red-300 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
            <AlertOctagon className="w-3.5 h-3.5" />
            Wajib Ganti ({pct}%)
          </span>
        );
      case 'warning':
        return (
          <span className="px-2.5 py-1 rounded-full bg-yellow-100 text-yellow-800 border border-yellow-300 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            Perhatian ({pct}%)
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Optimal ({pct}%)
          </span>
        );
    }
  };

  const getProgressColor = (status: SparePart['status']) => {
    switch (status) {
      case 'critical':
        return 'bg-red-500';
      case 'warning':
        return 'bg-yellow-400';
      default:
        return 'bg-emerald-500';
    }
  };

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

      {/* Top Headline & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-black uppercase tracking-wider text-zinc-900">
            Buku Servis Digital
          </h2>
          <p className="text-xs text-zinc-500">
            {selectedVehicle ? selectedVehicle.name : 'Daftar riwayat pemeliharaan & rincian biaya per bagian'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onExportPdf}
            className="flex items-center gap-1.5 py-2.5 px-3.5 bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 text-zinc-800 text-xs font-bold rounded-2xl transition cursor-pointer"
            title="Download / Cetak Buku Servis Digital"
          >
            <Download className="w-4 h-4 text-zinc-600" />
            <span className="hidden sm:inline">Cetak PDF</span>
          </button>
          <button
            onClick={onAddService}
            className="flex items-center gap-1.5 py-2.5 px-4 bg-yellow-400 hover:bg-yellow-300 text-zinc-950 text-xs font-black rounded-2xl transition shadow-xs active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ CATAT SERVIS</span>
          </button>
        </div>
      </div>

      {/* View Switcher & Total Cost Banner (Desktop 2-Col or Row) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex p-1 bg-zinc-100 rounded-2xl border border-zinc-200 text-xs font-bold">
          <button
            onClick={() => setViewMode('history_list')}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'history_list'
                ? 'bg-white text-zinc-950 shadow-xs'
                : 'text-zinc-500 hover:text-zinc-900'
            }`}
          >
            <FileCheck className="w-4 h-4" />
            <span>Riwayat Servis ({filteredRecords.length})</span>
          </button>

          <button
            onClick={() => setViewMode('parts_health')}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'parts_health'
                ? 'bg-white text-zinc-950 shadow-xs'
                : 'text-zinc-500 hover:text-zinc-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Masa Pakai Komponen ({filteredParts.length})</span>
          </button>
        </div>

        {/* Highlight Summary Card */}
        <div className="px-5 py-3 bg-zinc-900 text-white rounded-2xl flex items-center justify-between gap-4 shadow-sm">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-yellow-400 block">
              Total Pengeluaran Servis
            </span>
            <span className="text-lg font-black font-mono mt-0.5 block">
              Rp {totalExpenseOnService.toLocaleString('id-ID')}
            </span>
          </div>
          <span className="text-xs text-zinc-400 font-mono">
            {filteredRecords.length} Invoice
          </span>
        </div>
      </div>

      {/* VIEW 1: EXPANDABLE LIST OF SERVICE RECORDS */}
      {viewMode === 'history_list' && (
        <div className="space-y-3">
          {filteredRecords.length === 0 ? (
            <div className="bg-zinc-50 border-2 border-dashed border-zinc-200 rounded-3xl p-10 text-center text-zinc-400 text-xs">
              Belum ada riwayat servis untuk unit kendaraan ini.
            </div>
          ) : (
            filteredRecords.map((record) => {
              const veh = vehicles.find((v) => v.id === record.vehicleId);
              const isExpanded = expandedRecordId === record.id;
              const isUnexpected = record.type === 'unexpected';

              return (
                <div
                  key={record.id}
                  className={`bg-white rounded-3xl border-2 transition-all shadow-sm overflow-hidden ${
                    isExpanded ? 'border-zinc-900 shadow-md' : 'border-zinc-200 hover:border-zinc-400'
                  }`}
                >
                  {/* Collapsible Header */}
                  <div
                    onClick={() => toggleExpand(record.id)}
                    className="p-4 sm:p-5 flex items-center justify-between cursor-pointer select-none bg-white hover:bg-zinc-50/50 transition-colors"
                  >
                    <div className="flex-1 pr-4">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="px-2.5 py-0.5 rounded-lg bg-zinc-950 text-white font-mono font-bold text-[11px]">
                          {veh?.plateNumber}
                        </span>
                        <span className="text-xs text-zinc-400 font-mono">{record.date}</span>
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${
                            isUnexpected
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-zinc-100 text-zinc-700'
                          }`}
                        >
                          {isUnexpected ? 'Tak Terduga' : 'Berkala'}
                        </span>
                      </div>

                      <h4 className="font-extrabold text-sm md:text-base text-zinc-900 leading-snug">
                        {record.title}
                      </h4>

                      <div className="flex items-center gap-3 mt-1.5 text-xs text-zinc-500">
                        <span className="flex items-center gap-1">
                          <Store className="w-3.5 h-3.5 text-zinc-400" />
                          <span>{record.workshopName}</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 font-mono">
                          <Gauge className="w-3.5 h-3.5 text-zinc-400" />
                          <span>{record.odometerKm.toLocaleString('id-ID')} KM</span>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-right">
                      <div>
                        <span className="text-[10px] text-zinc-400 block font-medium">Total</span>
                        <span className="font-mono font-black text-base md:text-lg text-zinc-950 block">
                          Rp {record.cost.toLocaleString('id-ID')}
                        </span>
                      </div>
                      <div
                        className={`p-2 rounded-full transition-colors ${
                          isExpanded ? 'bg-yellow-400 text-zinc-950' : 'bg-zinc-100 text-zinc-400'
                        }`}
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 stroke-[3]" />
                        ) : (
                          <ChevronDown className="w-4 h-4 stroke-[2.5]" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content: Rincian Bagian yang Diservis */}
                  {isExpanded && (
                    <div className="px-5 pb-5 pt-3 border-t border-zinc-100 bg-zinc-50/70 text-xs animate-fade-in space-y-4">
                      <div>
                        <span className="text-[11px] font-black uppercase tracking-wider text-zinc-700 block mb-2">
                          Rincian Bagian yang Di-Servis / Diganti:
                        </span>

                        {record.itemizedDetails && record.itemizedDetails.length > 0 ? (
                          <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden divide-y divide-zinc-100 shadow-xs">
                            {record.itemizedDetails.map((item, idx) => (
                              <div
                                key={idx}
                                className="p-3 flex items-center justify-between text-xs"
                              >
                                <div className="flex items-center gap-2.5">
                                  <span
                                    className={`w-2 h-2 rounded-full ${
                                      item.category === 'sparepart'
                                        ? 'bg-yellow-400'
                                        : item.category === 'jasa'
                                        ? 'bg-zinc-900'
                                        : 'bg-red-500'
                                    }`}
                                  ></span>
                                  <span className="font-bold text-zinc-900">{item.name}</span>
                                  <span className="text-[10px] px-2 py-0.5 bg-zinc-100 text-zinc-500 rounded uppercase font-mono">
                                    {item.category}
                                  </span>
                                </div>
                                <span className="font-mono font-black text-zinc-900">
                                  Rp {item.cost.toLocaleString('id-ID')}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {record.replacedParts?.map((part, idx) => (
                              <span
                                key={idx}
                                className="px-3 py-1.5 bg-white border border-zinc-200 rounded-xl text-zinc-800 text-xs font-medium"
                              >
                                ✓ {part}
                              </span>
                            )) || <span className="text-zinc-400 italic">Pemeriksaan rutin umum</span>}
                          </div>
                        )}
                      </div>

                      {record.notes && (
                        <div className="p-3 bg-yellow-50/80 border border-yellow-200 rounded-2xl text-xs text-zinc-800">
                          <span className="font-bold text-yellow-900 block mb-0.5">
                            Catatan Teknisi / Kronologi:
                          </span>
                          <p className="italic leading-relaxed">"{record.notes}"</p>
                        </div>
                      )}

                      <div className="pt-3 border-t border-zinc-200 flex items-center justify-between">
                        <span className="text-xs font-bold text-zinc-600">
                          Grand Total Pembayaran Servis:
                        </span>
                        <span className="text-base font-black font-mono text-zinc-950 px-3 py-1.5 bg-yellow-400 rounded-xl shadow-xs">
                          Rp {record.cost.toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* VIEW 2: MASA PAKAI KOMPONEN (2-3 Cols on Desktop) */}
      {viewMode === 'parts_health' && (
        <div className="space-y-3">
          {filteredParts.length === 0 ? (
            <div className="bg-zinc-50 border-2 border-dashed border-zinc-200 rounded-3xl p-10 text-center text-zinc-400 text-xs">
              Tidak ada data komponen untuk filter ini.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredParts.map((part) => {
                const veh = vehicles.find((v) => v.id === part.vehicleId);

                return (
                  <div
                    key={part.id}
                    className="bg-white text-zinc-900 rounded-3xl p-4.5 shadow-sm border-2 border-zinc-200 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <span className="px-2 py-0.5 rounded bg-zinc-950 text-white font-mono text-[9px] font-bold">
                              {veh?.plateNumber}
                            </span>
                            <span className="text-[11px] text-zinc-500 font-semibold">{veh?.name}</span>
                          </div>
                          <h4 className="font-black text-sm text-zinc-900">{part.name}</h4>
                        </div>
                        {getStatusBadge(part.status, part.estimatedLifeRemainingPct)}
                      </div>

                      <div className="mt-4">
                        <div className="flex items-center justify-between text-xs text-zinc-600 mb-1">
                          <span>Masa Pakai Tersisa:</span>
                          <span className="font-mono font-bold text-zinc-950">{part.estimatedLifeRemainingPct}%</span>
                        </div>
                        <div className="w-full h-2.5 bg-zinc-100 rounded-full overflow-hidden p-0.5 border border-zinc-200">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${getProgressColor(part.status)}`}
                            style={{ width: `${part.estimatedLifeRemainingPct}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500 font-mono">
                      <span>Interval: {part.recommendedIntervalKm.toLocaleString('id-ID')} KM</span>
                      <span>Ganti: {part.lastReplacedOdometerKm.toLocaleString('id-ID')} KM</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
