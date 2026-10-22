import React, { useState } from 'react';
import type { Vehicle, ServiceRecord } from '../types';
import { X, Wrench, AlertTriangle } from 'lucide-react';

interface AddServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicles: Vehicle[];
  onAddService: (record: ServiceRecord) => void;
}

export const AddServiceModal: React.FC<AddServiceModalProps> = ({
  isOpen,
  onClose,
  vehicles,
  onAddService,
}) => {
  const [vehicleId, setVehicleId] = useState(vehicles[0]?.id || '');
  const [type, setType] = useState<'routine' | 'unexpected'>('routine');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [odometerKm, setOdometerKm] = useState(vehicles[0]?.currentOdometerKm || 0);
  const [workshopName, setWorkshopName] = useState('');
  const [cost, setCost] = useState(0);
  const [notes, setNotes] = useState('');
  const [replacedPartsStr, setReplacedPartsStr] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    const parts = replacedPartsStr
      ? replacedPartsStr.split(',').map((p) => p.trim()).filter(Boolean)
      : undefined;

    const itemized = parts && parts.length > 0
      ? parts.map((p) => ({
          name: p,
          category: 'sparepart' as const,
          cost: Math.round(Number(cost) / parts.length),
        }))
      : [{ name: title, category: (type === 'routine' ? 'jasa' : 'darurat') as const, cost: Number(cost) }];

    const newRecord: ServiceRecord = {
      id: `srv-${Date.now()}`,
      vehicleId,
      date,
      odometerKm: Number(odometerKm),
      type,
      title,
      workshopName: workshopName || 'Bengkel Mandiri',
      cost: Number(cost),
      notes: notes || undefined,
      replacedParts: parts,
      itemizedDetails: itemized,
    };

    onAddService(newRecord);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 border-2 border-zinc-900 dark:border-zinc-800 rounded-3xl p-5 shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar text-zinc-900 dark:text-zinc-100">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-yellow-400 text-zinc-950">
              <Wrench className="w-4 h-4 stroke-[2.5]" />
            </div>
            <h3 className="font-extrabold text-sm uppercase tracking-wider text-zinc-900 dark:text-white">
              Catat Servis & Pengeluaran
            </h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Routine vs Unexpected switch */}
        <div className="mt-3 grid grid-cols-2 p-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-bold">
          <button
            type="button"
            onClick={() => setType('routine')}
            className={`py-2 rounded-lg transition cursor-pointer ${
              type === 'routine' ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            Servis Berkala
          </button>
          <button
            type="button"
            onClick={() => setType('unexpected')}
            className={`py-2 rounded-lg transition cursor-pointer flex items-center justify-center gap-1 ${
              type === 'unexpected' ? 'bg-yellow-400 text-zinc-950 shadow-xs' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Biaya Tak Terduga</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3 text-xs">
          <div>
            <label className="block font-bold text-zinc-800 dark:text-zinc-200 mb-1">Pilih Kendaraan</label>
            <select
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
              className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white focus:outline-none focus:border-zinc-900 dark:focus:border-yellow-400"
            >
              {vehicles.length === 0 ? (
                <option value="">Belum ada kendaraan di garasi</option>
              ) : (
                vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    [{v.plateNumber}] {v.name}
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className="block font-bold text-zinc-800 dark:text-zinc-200 mb-1">
              Judul Perbaikan / Servis <span className="text-yellow-600">*</span>
            </label>
            <input
              type="text"
              placeholder={type === 'routine' ? 'Contoh: Ganti Oli Mesin + Busi' : 'Contoh: Tambal Ban Belakang Kena Paku, Rantai Putus'}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white focus:outline-none focus:border-zinc-900 dark:focus:border-yellow-400"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-bold text-zinc-800 dark:text-zinc-200 mb-1">Total Biaya (Rp)</label>
              <input
                type="number"
                value={cost}
                onChange={(e) => setCost(Number(e.target.value))}
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white font-mono focus:outline-none focus:border-zinc-900 dark:focus:border-yellow-400"
                required
              />
            </div>
            <div>
              <label className="block font-bold text-zinc-800 dark:text-zinc-200 mb-1">Odometer (KM)</label>
              <input
                type="number"
                value={odometerKm}
                onChange={(e) => setOdometerKm(Number(e.target.value))}
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white font-mono focus:outline-none focus:border-zinc-900 dark:focus:border-yellow-400"
                required
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-zinc-800 dark:text-zinc-200 mb-1">Nama Bengkel / Toko</label>
            <input
              type="text"
              placeholder="Contoh: AHASS Palmerah / Tambal Ban Pak Min"
              value={workshopName}
              onChange={(e) => setWorkshopName(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white focus:outline-none focus:border-zinc-900 dark:focus:border-yellow-400"
            />
          </div>

          {type === 'routine' ? (
            <div>
              <label className="block font-bold text-zinc-800 dark:text-zinc-200 mb-1">Komponen yang Diganti (Pisahkan koma)</label>
              <input
                type="text"
                placeholder="Oli MPX2, Busi NGK, Kampas Rem"
                value={replacedPartsStr}
                onChange={(e) => setReplacedPartsStr(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white focus:outline-none focus:border-zinc-900 dark:focus:border-yellow-400"
              />
            </div>
          ) : (
            <div>
              <label className="block font-bold text-zinc-800 dark:text-zinc-200 mb-1">Kronologi / Penyebab</label>
              <textarea
                rows={2}
                placeholder="Misal: Kena pecahan paku di jalan raya..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white focus:outline-none focus:border-zinc-900 dark:focus:border-yellow-400"
              />
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 mt-2 bg-yellow-400 hover:bg-yellow-300 text-zinc-950 font-black uppercase tracking-wider text-xs rounded-xl transition shadow active:scale-95 cursor-pointer"
          >
            Simpan ke Buku Servis
          </button>
        </form>
      </div>
    </div>
  );
};
