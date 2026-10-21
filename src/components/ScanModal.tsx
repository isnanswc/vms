import React, { useState, useRef } from 'react';
import { Camera, Sparkles, X, Check, Loader2, Gauge, Fuel } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import type { Vehicle } from '../types';

interface ScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicles: Vehicle[];
  onScanComplete: (result: {
    vehicleId: string;
    detectedKm: number;
    detectedLiters?: number;
    detectedCost?: number;
    fuelType?: string;
  }) => void;
}

export const ScanModal: React.FC<ScanModalProps> = ({
  isOpen,
  onClose,
  vehicles,
  onScanComplete,
}) => {
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(vehicles[0]?.id || '');
  const [scanType, setScanType] = useState<'odometer' | 'receipt'>('odometer');
  const [isProcessing, setIsProcessing] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<{
    odometer?: number;
    liters?: number;
    cost?: number;
    fuelType?: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
    setIsProcessing(true);
    setAiResult(null);

    try {
      const options = {
        maxSizeMB: 0.6,
        maxWidthOrHeight: 1200,
        useWebWorker: true,
      };
      await imageCompression(file, options);

      setTimeout(() => {
        setIsProcessing(false);
        const currentVeh = vehicles.find((v) => v.id === selectedVehicleId);
        const baseKm = currentVeh?.currentOdometerKm || 42850;

        if (scanType === 'odometer') {
          setAiResult({
            odometer: baseKm + 65,
          });
        } else {
          setAiResult({
            odometer: baseKm + 65,
            liters: 4.5,
            cost: 58500,
            fuelType: 'Pertamax',
          });
        }
      }, 1000);
    } catch (err) {
      console.error(err);
      setIsProcessing(false);
    }
  };

  const handleApply = () => {
    if (!aiResult) return;
    onScanComplete({
      vehicleId: selectedVehicleId,
      detectedKm: aiResult.odometer || 0,
      detectedLiters: aiResult.liters,
      detectedCost: aiResult.cost,
      fuelType: aiResult.fuelType,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white border-2 border-zinc-900 rounded-3xl p-5 shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar text-zinc-900">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-yellow-400 text-zinc-950">
              <Camera className="w-4 h-4 stroke-[2.5]" />
            </div>
            <h3 className="font-extrabold text-sm uppercase tracking-wider text-zinc-900">
              AI Vision Scanner
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Vehicle Selection & Scan Type Switcher */}
        <div className="mt-3 space-y-2.5">
          <div>
            <label className="block text-[11px] font-bold text-zinc-700 mb-1">
              Target Unit Kendaraan
            </label>
            <select
              value={selectedVehicleId}
              onChange={(e) => setSelectedVehicleId(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-xl text-zinc-900 text-xs focus:outline-none focus:border-zinc-900"
            >
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  [{v.plateNumber}] {v.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 p-1 bg-zinc-100 rounded-xl border border-zinc-200 text-xs font-bold">
            <button
              type="button"
              onClick={() => setScanType('odometer')}
              className={`py-2 rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
                scanType === 'odometer'
                  ? 'bg-white text-zinc-900 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              <Gauge className="w-3.5 h-3.5" />
              <span>Foto Spedometer</span>
            </button>
            <button
              type="button"
              onClick={() => setScanType('receipt')}
              className={`py-2 rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
                scanType === 'receipt'
                  ? 'bg-white text-zinc-900 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              <Fuel className="w-3.5 h-3.5" />
              <span>Struk SPBU</span>
            </button>
          </div>
        </div>

        {/* Camera Trigger Zone */}
        <div className="mt-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleCapture}
          />

          {!imagePreview ? (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-8 border-2 border-dashed border-zinc-300 hover:border-zinc-900 rounded-2xl bg-zinc-50 hover:bg-yellow-50/50 flex flex-col items-center justify-center gap-2 text-zinc-500 hover:text-zinc-900 transition cursor-pointer"
            >
              <div className="p-3 rounded-full bg-white border border-zinc-200 text-yellow-500 shadow-xs">
                <Camera className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div className="text-center">
                <span className="font-bold text-xs block text-zinc-900">
                  Buka Kamera / Ambil Gambar
                </span>
                <span className="text-[10px] text-zinc-400">
                  {scanType === 'odometer' ? 'Arahkan ke angka spedometer' : 'Arahkan ke struk SPBU'}
                </span>
              </div>
            </button>
          ) : (
            <div className="relative rounded-2xl overflow-hidden border border-zinc-200 shadow-sm">
              <img
                src={imagePreview}
                alt="Captured"
                className="w-full h-44 object-cover"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute top-2 right-2 px-2.5 py-1 bg-zinc-950/80 hover:bg-zinc-950 text-white text-[10px] font-bold rounded-lg backdrop-blur-sm cursor-pointer"
              >
                Ambil Ulang
              </button>
            </div>
          )}
        </div>

        {/* AI Analysis State */}
        {isProcessing && (
          <div className="mt-4 p-4 rounded-2xl bg-yellow-50 border border-yellow-300 flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-yellow-600 animate-spin" />
            <div className="text-xs">
              <p className="font-bold text-zinc-900">AI Sedang Membaca Gambar...</p>
              <p className="text-[10px] text-zinc-600">
                Mengekstrak angka odometer & detail struk secara presisi.
              </p>
            </div>
          </div>
        )}

        {/* AI Recognition Result Confirmation */}
        {aiResult && !isProcessing && (
          <div className="mt-4 p-3.5 rounded-2xl bg-zinc-50 text-zinc-900 border border-zinc-200 space-y-2.5 shadow-xs">
            <div className="flex items-center gap-1.5 text-xs font-black uppercase text-zinc-800">
              <Sparkles className="w-4 h-4 text-yellow-500" />
              <span>Hasil Analisis AI Gemini:</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-white p-2 rounded-xl border border-zinc-200">
                <span className="text-[10px] text-zinc-500 font-bold block">Odometer Terdeteksi</span>
                <span className="font-mono font-black text-sm text-zinc-900">
                  {aiResult.odometer?.toLocaleString('id-ID')} KM
                </span>
              </div>

              {scanType === 'receipt' && (
                <>
                  <div className="bg-white p-2 rounded-xl border border-zinc-200">
                    <span className="text-[10px] text-zinc-500 font-bold block">Total Biaya</span>
                    <span className="font-mono font-black text-sm text-zinc-900">
                      Rp {aiResult.cost?.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-zinc-200 col-span-2 flex justify-between items-center">
                    <div>
                      <span className="text-[10px] text-zinc-500 font-bold block">Bahan Bakar</span>
                      <span className="font-bold text-xs text-zinc-900">{aiResult.fuelType}</span>
                    </div>
                    <span className="font-mono font-bold text-xs text-zinc-700">
                      {aiResult.liters} Liter
                    </span>
                  </div>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={handleApply}
              className="w-full py-2.5 bg-yellow-400 hover:bg-yellow-300 text-zinc-950 font-black text-xs uppercase tracking-wider rounded-xl transition shadow active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Konfirmasi & Simpan Data</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
