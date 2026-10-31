import React, { useState } from 'react';
import type { Vehicle, TripLog, TripPurpose, FuelLog } from '../types';
import { 
  X, 
  MapPin, 
  Navigation, 
  Plus, 
  CheckCircle2, 
  Clock, 
  Check,
  Trash2
} from 'lucide-react';
import { ModalPortal } from './ModalPortal';
import { triggerHaptic } from '../utils/haptics';

interface TripLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicles: Vehicle[];
  tripLogs: TripLog[];
  fuelLogs: FuelLog[];
  onAddTrip: (trip: TripLog) => void;
  onToggleReimburse: (tripId: string) => void;
  onDeleteTrip?: (tripId: string) => void;
  defaultVehicleId?: string;
}

export const TripLogModal: React.FC<TripLogModalProps> = ({
  isOpen,
  onClose,
  vehicles,
  tripLogs,
  fuelLogs,
  onAddTrip,
  onToggleReimburse,
  onDeleteTrip,
  defaultVehicleId,
}) => {
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(
    defaultVehicleId || (vehicles.length > 0 ? vehicles[0].id : '')
  );
  const [tab, setTab] = useState<'history' | 'add'>('history');

  // New Trip Form States
  const [purpose, setPurpose] = useState<TripPurpose>('operasional');
  const [origin, setOrigin] = useState<string>('');
  const [destination, setDestination] = useState<string>('');
  const [startKm, setStartKm] = useState<number>(0);
  const [endKm, setEndKm] = useState<number>(0);
  const [date, setDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [driverName, setDriverName] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const activeVehicle = vehicles.find((v) => v.id === selectedVehicleId) || vehicles[0];

  // Initialize startKm from vehicle's current odometer when activeVehicle changes
  React.useEffect(() => {
    if (activeVehicle) {
      setStartKm(activeVehicle.currentOdometerKm);
      setEndKm(activeVehicle.currentOdometerKm + 15);
    }
  }, [activeVehicle?.id]);

  if (!isOpen || !activeVehicle) return null;

  const filteredTrips = tripLogs.filter((t) => t.vehicleId === activeVehicle.id);

  const totalDistance = filteredTrips.reduce((sum, t) => sum + t.distanceKm, 0);
  const totalCost = filteredTrips.reduce((sum, t) => sum + t.estimatedCost, 0);
  const pendingReimbursement = filteredTrips
    .filter((t) => t.purpose !== 'pribadi' && !t.isReimbursed)
    .reduce((sum, t) => sum + t.estimatedCost, 0);

  // Dynamic fuel price and efficiency
  const isElectric = activeVehicle.fuelType === 'Listrik';
  const pricePerLiter = 
    activeVehicle.fuelType === 'Pertalite' ? 10000 :
    activeVehicle.fuelType === 'Pertamax' ? 12950 :
    activeVehicle.fuelType === 'Pertamax Turbo' ? 14400 :
    activeVehicle.fuelType === 'Bio Solar' ? 6800 :
    activeVehicle.fuelType === 'Dexlite' ? 13700 : 1699;

  const logsWithEff = fuelLogs.filter((l) => l.vehicleId === activeVehicle.id && l.efficiencyKmPerLiter);
  const avgEff = logsWithEff.length > 0
    ? (logsWithEff.reduce((sum, l) => sum + (l.efficiencyKmPerLiter || 0), 0) / logsWithEff.length)
    : (activeVehicle.category === 'motor' ? 42.0 : activeVehicle.category === 'mobil' ? 12.0 : 7.0);

  const calcDistance = Math.max(0, endKm - startKm);
  const calcEstimatedCost = Math.round((calcDistance / (avgEff || 1)) * pricePerLiter);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (endKm <= startKm) {
      alert('KM Akhir harus lebih besar daripada KM Awal!');
      return;
    }
    if (!origin.trim() || !destination.trim()) {
      alert('Mohon isi lokasi asal dan tujuan!');
      return;
    }

    triggerHaptic('medium');

    const newTrip: TripLog = {
      id: `trip-${Date.now()}`,
      vehicleId: activeVehicle.id,
      date,
      purpose,
      origin: origin.trim(),
      destination: destination.trim(),
      startOdometerKm: Number(startKm),
      endOdometerKm: Number(endKm),
      distanceKm: calcDistance,
      estimatedCost: calcEstimatedCost,
      driverName: driverName.trim() || undefined,
      notes: notes.trim() || undefined,
      isReimbursed: purpose === 'pribadi', // personal trips don't need reimbursement
    };

    onAddTrip(newTrip);
    setOrigin('');
    setDestination('');
    setNotes('');
    setTab('history');
  };

  const getPurposeBadge = (p: TripPurpose) => {
    switch (p) {
      case 'operasional':
        return { label: 'Operasional', bg: 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-300' };
      case 'antar_barang':
        return { label: 'Antar Barang', bg: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300' };
      case 'meeting':
        return { label: 'Meeting Klien', bg: 'bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border-purple-300' };
      case 'dinas':
        return { label: 'Dinas Luar Kota', bg: 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300' };
      case 'pribadi':
      default:
        return { label: 'Pribadi', bg: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-300' };
    }
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-zinc-950/75 backdrop-blur-md animate-fade-in text-zinc-900 dark:text-zinc-100">
        <div className="w-full max-w-2xl bg-white dark:bg-zinc-900 border-2 border-zinc-900 dark:border-zinc-700 rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden transition-all max-h-[92vh] flex flex-col">
          
          {/* Header */}
          <div className="flex items-center justify-between pb-3.5 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-2xl bg-theme-accent text-theme-accent-fg shadow-xs">
                <Navigation className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-sm sm:text-base uppercase tracking-wider text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <span>Logbook Perjalanan & Reimbursement</span>
                </h3>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  {activeVehicle.name} ({activeVehicle.plateNumber}) • Hitung biaya bensin riil tiap trip
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Vehicle Switcher if multiple */}
          {vehicles.length > 1 && (
            <div className="pt-3 pb-1 shrink-0">
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {vehicles.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => {
                      triggerHaptic('light');
                      setSelectedVehicleId(v.id);
                    }}
                    className={`py-1.5 px-3 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer border ${
                      v.id === activeVehicle.id
                        ? 'bg-zinc-950 text-white dark:bg-yellow-400 dark:text-zinc-950 border-zinc-950 dark:border-yellow-400 shadow-xs'
                        : 'bg-zinc-50 dark:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-zinc-400'
                    }`}
                  >
                    {v.name} ({v.plateNumber})
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* View Tab Switcher */}
          <div className="grid grid-cols-2 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 text-xs font-bold my-3 shrink-0">
            <button
              onClick={() => setTab('history')}
              className={`py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                tab === 'history'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-950 dark:text-zinc-100 shadow-xs'
                  : 'text-zinc-500 dark:text-zinc-400'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Riwayat Trip ({filteredTrips.length})</span>
            </button>

            <button
              onClick={() => setTab('add')}
              className={`py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                tab === 'add'
                  ? 'bg-theme-accent text-theme-accent-fg shadow-xs'
                  : 'text-zinc-500 dark:text-zinc-400'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Catat Trip Baru</span>
            </button>
          </div>

          {/* TAB 1: HISTORY & REIMBURSEMENT */}
          {tab === 'history' && (
            <div className="space-y-3 overflow-y-auto pr-1 flex-1 no-scrollbar">
              {/* Summary KPIs */}
              <div className="grid grid-cols-3 gap-2">
                <div className="p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-2xl border border-zinc-200 dark:border-zinc-700">
                  <span className="text-[10px] text-zinc-400 block font-bold uppercase">Total Jarak</span>
                  <span className="text-base font-black font-mono text-zinc-900 dark:text-zinc-100">
                    {totalDistance.toLocaleString('id-ID')} KM
                  </span>
                </div>
                <div className="p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-2xl border border-zinc-200 dark:border-zinc-700">
                  <span className="text-[10px] text-zinc-400 block font-bold uppercase">Biaya Bensin</span>
                  <span className="text-base font-black font-mono text-zinc-900 dark:text-zinc-100">
                    Rp {totalCost.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-300 dark:border-amber-800">
                  <span className="text-[10px] text-amber-800 dark:text-amber-400 block font-bold uppercase">Pending Klaim</span>
                  <span className="text-base font-black font-mono text-amber-900 dark:text-amber-200">
                    Rp {pendingReimbursement.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {filteredTrips.length === 0 ? (
                <div className="p-10 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl text-center space-y-2 text-xs text-zinc-400">
                  <p>Belum ada catatan perjalanan untuk unit {activeVehicle.name}.</p>
                  <button
                    onClick={() => setTab('add')}
                    className="py-2 px-3.5 bg-theme-accent text-theme-accent-fg font-bold rounded-xl shadow-xs transition cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Catat Perjalanan Pertama</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {filteredTrips.map((trip) => {
                    const badge = getPurposeBadge(trip.purpose);
                    return (
                      <div
                        key={trip.id}
                        className="p-3.5 bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-2 hover:border-zinc-400 transition"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`px-2 py-0.2 rounded-md text-[10px] font-bold border ${badge.bg}`}>
                                {badge.label}
                              </span>
                              <span className="text-xs font-mono text-zinc-400">{trip.date}</span>
                              {trip.driverName && (
                                <span className="text-xs text-zinc-500">• Supir: {trip.driverName}</span>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5 text-xs font-black text-zinc-900 dark:text-zinc-100">
                              <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                              <span>{trip.origin}</span>
                              <span className="text-zinc-400">→</span>
                              <span>{trip.destination}</span>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="font-mono font-black text-sm text-zinc-950 dark:text-zinc-100 block">
                              Rp {trip.estimatedCost.toLocaleString('id-ID')}
                            </span>
                            <span className="text-[11px] font-mono text-zinc-500">
                              {trip.distanceKm} KM ({trip.startOdometerKm} → {trip.endOdometerKm})
                            </span>
                          </div>
                        </div>

                        {trip.notes && (
                          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 italic">
                            "{trip.notes}"
                          </p>
                        )}

                        {onDeleteTrip && (
                          <div className="flex justify-end pt-1">
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm('Hapus riwayat perjalanan trip ini?')) {
                                  triggerHaptic('light');
                                  onDeleteTrip(trip.id);
                                }
                              }}
                              className="text-[10px] text-zinc-400 hover:text-rose-500 flex items-center gap-1 transition cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Hapus Trip</span>
                            </button>
                          </div>
                        )}

                        {/* Reimbursement Toggle */}
                        {trip.purpose !== 'pribadi' && (
                          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs">
                            <span className="text-[11px] text-zinc-500">Status Penggantian (Reimburse):</span>
                            <button
                              type="button"
                              onClick={() => {
                                triggerHaptic('light');
                                onToggleReimburse(trip.id);
                              }}
                              className={`py-1 px-2.5 rounded-lg text-[10px] font-bold border transition cursor-pointer flex items-center gap-1 ${
                                trip.isReimbursed
                                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300'
                                  : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 hover:bg-amber-200'
                              }`}
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>{trip.isReimbursed ? 'Sudah Diganti (Lunas)' : 'Tandai Sudah Klaim'}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CATAT TRIP BARU */}
          {tab === 'add' && (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs overflow-y-auto pr-1 flex-1 no-scrollbar">
              
              {/* Purpose Selector */}
              <div>
                <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Tujuan / Keperluan Perjalanan
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                  {[
                    { id: 'operasional', label: 'Operasional' },
                    { id: 'antar_barang', label: 'Antar Barang' },
                    { id: 'meeting', label: 'Meeting' },
                    { id: 'dinas', label: 'Dinas Luar' },
                    { id: 'pribadi', label: 'Pribadi' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        triggerHaptic('light');
                        setPurpose(p.id as TripPurpose);
                      }}
                      className={`p-2 rounded-xl text-center border font-bold text-[11px] transition cursor-pointer ${
                        purpose === p.id
                          ? 'bg-zinc-950 text-white dark:bg-yellow-400 dark:text-zinc-950 border-zinc-950 dark:border-yellow-400 shadow-xs'
                          : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-zinc-400'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Origin & Destination */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Titik Keberangkatan (Asal)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Kantor Pusat, Rumah, Garasi"
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl font-bold focus:outline-none focus:border-zinc-900 dark:focus:border-yellow-400"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Titik Tujuan
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Gudang Cakung, Klien Sudirman"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl font-bold focus:outline-none focus:border-zinc-900 dark:focus:border-yellow-400"
                    required
                  />
                </div>
              </div>

              {/* Odometer Start & End */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Odometer Awal (KM)
                  </label>
                  <input
                    type="number"
                    value={startKm}
                    onChange={(e) => setStartKm(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl font-mono font-bold focus:outline-none focus:border-zinc-900 dark:focus:border-yellow-400"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Odometer Akhir (KM)
                  </label>
                  <input
                    type="number"
                    value={endKm}
                    onChange={(e) => setEndKm(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl font-mono font-bold focus:outline-none focus:border-zinc-900 dark:focus:border-yellow-400"
                    required
                  />
                </div>
              </div>

              {/* Live Calculation Banner */}
              <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-2xl flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-emerald-900 dark:text-emerald-300 block">
                    Kalkulasi Jarak & Biaya Bensin:
                  </span>
                  <span className="text-emerald-800 dark:text-emerald-400 text-[11px]">
                    Jarak: <strong>{calcDistance} KM</strong> (Rasio {avgEff.toFixed(1)} km/{isElectric ? 'kWh' : 'L'} @ Rp {pricePerLiter.toLocaleString('id-ID')})
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-400 uppercase font-bold block">Biaya Trip</span>
                  <span className="font-mono font-black text-base text-emerald-950 dark:text-emerald-200">
                    Rp {calcEstimatedCost.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {/* Date & Driver */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Tanggal Perjalanan
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Nama Pengemudi / PIC
                  </label>
                  <input
                    type="text"
                    placeholder="Nama Supir"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Catatan Tambahan (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Keterangan pengantaran dokumen, meeting klien, dll."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl"
                />
              </div>

              {/* Submit */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3.5 bg-theme-accent hover:bg-theme-accent-hover text-theme-accent-fg font-black uppercase tracking-wider text-xs rounded-2xl transition shadow-md active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Simpan Catatan Perjalanan</span>
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </ModalPortal>
  );
};
