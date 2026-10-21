import React from 'react';
import type { Vehicle, ServiceRecord, SparePart } from '../types';
import { X, Printer, ShieldCheck, CheckCircle2, Car, Award } from 'lucide-react';

interface DigitalServicePdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicles: Vehicle[];
  serviceRecords: ServiceRecord[];
  spareParts: SparePart[];
}

export const DigitalServicePdfModal: React.FC<DigitalServicePdfModalProps> = ({
  isOpen,
  onClose,
  vehicles,
  serviceRecords,
  spareParts,
}) => {
  if (!isOpen) return null;

  const targetVehicle = vehicles[0]; // Primary vehicle (Vario 125)
  const targetRecords = serviceRecords.filter((r) => r.vehicleId === targetVehicle.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/90 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-lg bg-zinc-900 border border-zinc-700 rounded-3xl p-5 shadow-2xl max-h-[92vh] overflow-y-auto no-scrollbar">
        {/* Top Controls */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-yellow-400" />
            <h3 className="font-extrabold text-xs uppercase tracking-wider text-white">
              Buku Servis Digital & Sertifikat Perawatan
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-zinc-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Paper Card (White Paper Simulation) */}
        <div className="mt-4 p-5 bg-white text-zinc-950 rounded-2xl shadow-xl font-sans text-xs space-y-4 border-2 border-zinc-200">
          {/* Header */}
          <div className="flex items-start justify-between border-b-2 border-zinc-950 pb-3">
            <div>
              <div className="text-base font-black tracking-tighter uppercase text-zinc-950">
                FLEETLOG <span className="text-yellow-600">CERTIFIED</span>
              </div>
              <p className="text-[10px] text-zinc-500 font-mono">
                Official Digital Maintenance Passport
              </p>
            </div>
            <div className="text-right">
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 border border-emerald-300 font-mono font-bold text-[10px] rounded">
                VERIFIED ASSET
              </span>
              <p className="text-[9px] text-zinc-400 mt-0.5">Tgl Cetak: 21 Okt 2026</p>
            </div>
          </div>

          {/* Vehicle Identity */}
          <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-200 grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <span className="text-zinc-400 text-[10px] block">Unit Kendaraan</span>
              <span className="font-extrabold text-zinc-900 text-xs">{targetVehicle.name}</span>
            </div>
            <div>
              <span className="text-zinc-400 text-[10px] block">Nomor Polisi</span>
              <span className="font-mono font-black text-zinc-950 text-xs">{targetVehicle.plateNumber}</span>
            </div>
            <div>
              <span className="text-zinc-400 text-[10px] block">Tahun / Kategori</span>
              <span className="font-semibold text-zinc-700">{targetVehicle.year} • {targetVehicle.category.toUpperCase()}</span>
            </div>
            <div>
              <span className="text-zinc-400 text-[10px] block">Odometer Terakhir</span>
              <span className="font-mono font-bold text-zinc-900">{targetVehicle.currentOdometerKm.toLocaleString('id-ID')} KM</span>
            </div>
          </div>

          {/* Record Log Table */}
          <div>
            <h4 className="font-bold text-xs uppercase text-zinc-800 mb-2 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-yellow-600" />
              <span>Riwayat Pemeliharaan Berkala</span>
            </h4>

            <div className="divide-y divide-zinc-200 border border-zinc-200 rounded-xl overflow-hidden text-[11px]">
              {targetRecords.map((rec) => (
                <div key={rec.id} className="p-2.5 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-zinc-900">{rec.title}</div>
                    <div className="text-[10px] text-zinc-500">
                      {rec.date} • {rec.workshopName} • {rec.odometerKm.toLocaleString('id-ID')} KM
                    </div>
                  </div>
                  <div className="font-mono font-bold text-zinc-900">
                    Rp {rec.cost.toLocaleString('id-ID')}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stamp & Verification */}
          <div className="pt-2 flex items-center justify-between text-[10px] text-zinc-500 border-t border-zinc-200">
            <div>
              <p className="font-semibold text-zinc-800">Status Kesehatan: {targetVehicle.healthScore}%</p>
              <p>Rekomendasi untuk Nilai Jual Kembali Tinggi.</p>
            </div>
            <div className="border border-dashed border-zinc-400 p-2 rounded text-center font-mono text-[9px] uppercase font-bold text-zinc-600">
              [ DIGITALLY SIGNED ]
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => window.print()}
            className="flex-1 py-3 bg-yellow-400 hover:bg-yellow-300 text-zinc-950 font-black text-xs uppercase rounded-xl transition shadow active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak / Simpan PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
};
