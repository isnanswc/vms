import React, { useState } from 'react';
import type { Vehicle, FuelLog, SparePart, ServiceRecord, TaxPaymentRecord } from '../types';
import { 
  ChevronLeft, 
  Car, 
  Bike, 
  Truck, 
  Fuel, 
  Wrench, 
  FileText, 
  ShieldCheck, 
  AlertTriangle, 
  Plus, 
  Sparkles, 
  X,
  CreditCard,
  Edit3,
  Check,
  Trash2,
  Layers,
  Gauge,
  TrendingUp,
  MapPin,
  Navigation
} from 'lucide-react';

interface VehicleDetailViewProps {
  vehicle: Vehicle;
  fuelLogs: FuelLog[];
  spareParts: SparePart[];
  serviceRecords: ServiceRecord[];
  onBack: () => void;
  onAddFuelLog: () => void;
  onAddService: () => void;
  onOpenAiChat: (prompt: string) => void;
  onAddTaxPayment: (record: TaxPaymentRecord) => void;
  onUpdateVehicle?: (updated: Vehicle) => void;
  onDeleteVehicle?: (vehicleId: string) => void;
}

export const VehicleDetailView: React.FC<VehicleDetailViewProps> = ({
  vehicle,
  fuelLogs,
  spareParts,
  serviceRecords,
  onBack,
  onAddFuelLog,
  onAddService,
  onOpenAiChat,
  onAddTaxPayment,
  onUpdateVehicle,
  onDeleteVehicle,
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'fuel' | 'parts'>('info');
  const [isTaxModalOpen, setIsTaxModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  // Edit Vehicle Form States
  const [editName, setEditName] = useState(vehicle.name);
  const [editPlateNumber, setEditPlateNumber] = useState(vehicle.plateNumber);
  const [editCategory, setEditCategory] = useState(vehicle.category);
  const [editYear, setEditYear] = useState(vehicle.year);
  const [editOdometer, setEditOdometer] = useState(vehicle.currentOdometerKm);
  const [editFuelType, setEditFuelType] = useState(vehicle.fuelType);
  const [editTankCapacity, setEditTankCapacity] = useState(vehicle.tankCapacityLiters);
  const [editMaxCargo, setEditMaxCargo] = useState(vehicle.maxCargoWeightKg || 150);
  const [editNotes, setEditNotes] = useState(vehicle.notes);
  const [editStnkNumber, setEditStnkNumber] = useState(vehicle.stnkNumber || '');
  const [editChassisNumber, setEditChassisNumber] = useState(vehicle.chassisNumber || '');
  const [editEngineNumber, setEditEngineNumber] = useState(vehicle.engineNumber || '');
  const [editStnkExpiryDate, setEditStnkExpiryDate] = useState(vehicle.stnkExpiryDate);
  const [editStnkFiveYearExpiryDate, setEditStnkFiveYearExpiryDate] = useState(vehicle.stnkFiveYearExpiryDate);
  const [editTaxCostAnnual, setEditTaxCostAnnual] = useState(vehicle.stnkTaxCostAnnual);
  const [editTaxCostFiveYear, setEditTaxCostFiveYear] = useState(vehicle.stnkTaxCostFiveYear);

  // Form states for manual tax record
  const [taxDate, setTaxDate] = useState('2026-10-21');
  const [taxType, setTaxType] = useState<'tahunan' | 'lima_tahunan'>('tahunan');
  const [taxCost, setTaxCost] = useState(vehicle.stnkTaxCostAnnual);
  const [taxValidation, setTaxValidation] = useState('');
  const [taxNotes, setTaxNotes] = useState('');

  const vFuelLogs = fuelLogs.filter((l) => l.vehicleId === vehicle.id);
  const vParts = spareParts.filter((p) => p.vehicleId === vehicle.id);
  const vServices = serviceRecords.filter((s) => s.vehicleId === vehicle.id);

  const totalLiters = vFuelLogs.reduce((acc, l) => acc + l.liters, 0);
  const totalFuelCost = vFuelLogs.reduce((acc, l) => acc + l.totalCost, 0);
  const effLogs = vFuelLogs.filter((l) => l.efficiencyKmPerLiter !== undefined);
  const avgEfficiency = effLogs.length > 0
    ? (effLogs.reduce((a, b) => a + (b.efficiencyKmPerLiter || 0), 0) / effLogs.length).toFixed(1)
    : '0';

  const costPerKm = totalLiters > 0 && vFuelLogs.length > 1
    ? Math.round(totalFuelCost / ((vFuelLogs[0].odometerKm - vFuelLogs[vFuelLogs.length - 1].odometerKm) || 1))
    : 320;

  const today = new Date('2026-10-21');
  const annualExpiry = new Date(vehicle.stnkExpiryDate);
  const fiveYearExpiry = new Date(vehicle.stnkFiveYearExpiryDate);

  const daysToAnnualExpiry = Math.ceil((annualExpiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const isFiveYearDueThisCycle = annualExpiry.getFullYear() === fiveYearExpiry.getFullYear();

  const handleSaveTax = (e: React.FormEvent) => {
    e.preventDefault();
    const newTaxRecord: TaxPaymentRecord = {
      id: `tax-${Date.now()}`,
      vehicleId: vehicle.id,
      paymentDate: taxDate,
      taxType,
      cost: Number(taxCost),
      stnkValidationNumber: taxValidation || undefined,
      notes: taxNotes || undefined,
    };
    onAddTaxPayment(newTaxRecord);
    setIsTaxModalOpen(false);
  };

  const handleSaveVehicleEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim() || !editPlateNumber.trim()) return;

    if (onUpdateVehicle) {
      onUpdateVehicle({
        ...vehicle,
        name: editName.trim(),
        plateNumber: editPlateNumber.trim().toUpperCase(),
        category: editCategory,
        year: Number(editYear),
        currentOdometerKm: Number(editOdometer),
        fuelType: editFuelType,
        tankCapacityLiters: Number(editTankCapacity),
        maxCargoWeightKg: editMaxCargo ? Number(editMaxCargo) : undefined,
        notes: editNotes.trim(),
        stnkNumber: editStnkNumber.trim(),
        chassisNumber: editChassisNumber.trim(),
        engineNumber: editEngineNumber.trim(),
        stnkExpiryDate: editStnkExpiryDate,
        stnkFiveYearExpiryDate: editStnkFiveYearExpiryDate,
        stnkTaxCostAnnual: Number(editTaxCostAnnual),
        stnkTaxCostFiveYear: Number(editTaxCostFiveYear),
      });
    }
    setIsEditModalOpen(false);
  };

  const handleConfirmDelete = () => {
    if (onDeleteVehicle) {
      onDeleteVehicle(vehicle.id);
    }
    setIsDeleteConfirmOpen(false);
    setIsEditModalOpen(false);
    onBack();
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'motor':
        return <Bike className="w-4 h-4 text-zinc-900 dark:text-zinc-100" />;
      case 'truk':
        return <Truck className="w-4 h-4 text-zinc-900 dark:text-zinc-100" />;
      default:
        return <Car className="w-4 h-4 text-zinc-900 dark:text-zinc-100" />;
    }
  };

  return (
    <div className="space-y-6 pb-24 md:pb-8 pt-2 animate-fade-in text-zinc-900 dark:text-zinc-100 transition-colors">
      {/* Top Header / Back Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 py-2 px-3.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-bold transition cursor-pointer border border-zinc-200/80 dark:border-zinc-700"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Kembali ke Garasi</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Edit Button */}
          <button
            onClick={() => {
              setEditName(vehicle.name);
              setEditPlateNumber(vehicle.plateNumber);
              setEditCategory(vehicle.category);
              setEditYear(vehicle.year);
              setEditOdometer(vehicle.currentOdometerKm);
              setEditFuelType(vehicle.fuelType);
              setEditTankCapacity(vehicle.tankCapacityLiters);
              setEditMaxCargo(vehicle.maxCargoWeightKg || 150);
              setEditNotes(vehicle.notes);
              setEditStnkNumber(vehicle.stnkNumber || '');
              setEditChassisNumber(vehicle.chassisNumber || '');
              setEditEngineNumber(vehicle.engineNumber || '');
              setEditStnkExpiryDate(vehicle.stnkExpiryDate);
              setEditStnkFiveYearExpiryDate(vehicle.stnkFiveYearExpiryDate);
              setEditTaxCostAnnual(vehicle.stnkTaxCostAnnual);
              setEditTaxCostFiveYear(vehicle.stnkTaxCostFiveYear);
              setIsEditModalOpen(true);
            }}
            className="flex items-center gap-1.5 py-2 px-3.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 text-xs font-bold transition cursor-pointer border border-zinc-200 dark:border-zinc-700"
          >
            <Edit3 className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300" />
            <span>Edit Informasi Dasar</span>
          </button>

          {/* Delete Button */}
          <button
            onClick={() => setIsDeleteConfirmOpen(true)}
            className="flex items-center gap-1.5 py-2 px-3 rounded-2xl bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 text-xs font-bold transition cursor-pointer border border-red-200 dark:border-red-900"
            title="Hapus Kendaraan dari Garasi"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Hapus Unit</span>
          </button>

          {/* AI Advisor Button */}
          <button
            onClick={() => onOpenAiChat(`Tolong berikan analisa komprehensif untuk kendaraan ${vehicle.name} (${vehicle.plateNumber}) saat ini.`)}
            className="flex items-center gap-1.5 py-2 px-4 rounded-2xl bg-yellow-400 hover:bg-yellow-300 text-zinc-950 text-xs font-black transition cursor-pointer shadow-xs"
          >
            <Sparkles className="w-4 h-4 fill-zinc-950" />
            <span>Tanya AI</span>
          </button>
        </div>
      </div>

      {/* Hero Vehicle Overview Card (Desktop Widescreen) */}
      <div className="bg-white border-2 border-zinc-900 rounded-3xl p-5 md:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="px-3.5 py-1.5 bg-zinc-950 text-white font-mono font-black text-sm tracking-wider rounded-xl shadow-sm">
                {vehicle.plateNumber}
              </div>
              <span className="text-xs px-3 py-1 rounded-full bg-yellow-100 text-zinc-900 font-bold uppercase tracking-wider flex items-center gap-1.5 border border-yellow-300">
                {getCategoryIcon(vehicle.category)}
                {vehicle.category}
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-zinc-900 tracking-tight">
              {vehicle.name} <span className="text-zinc-400 font-normal text-base">({vehicle.year})</span>
            </h1>
            <p className="text-xs text-zinc-500 mt-1">{vehicle.notes}</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-right">
              <span className="text-[10px] text-zinc-400 uppercase font-bold block">Status Kesehatan</span>
              <div className="inline-flex items-center gap-1.5 font-mono font-black text-base text-zinc-950 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></span>
                {vehicle.healthScore}%
              </div>
            </div>
          </div>
        </div>

        {/* Quick Specs Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-zinc-100 text-xs">
          <div className="bg-zinc-50 p-3 rounded-2xl">
            <span className="text-[10px] text-zinc-400 uppercase font-bold block">Odometer</span>
            <span className="font-mono font-bold text-zinc-900 text-sm mt-0.5 block">
              {vehicle.currentOdometerKm.toLocaleString('id-ID')} KM
            </span>
          </div>
          <div className="bg-zinc-50 p-3 rounded-2xl">
            <span className="text-[10px] text-zinc-400 uppercase font-bold block">Kapasitas Tangki</span>
            <span className="font-mono font-bold text-zinc-900 text-sm mt-0.5 block">
              {vehicle.tankCapacityLiters} L ({vehicle.fuelType})
            </span>
          </div>
          <div className="bg-zinc-50 p-3 rounded-2xl">
            <span className="text-[10px] text-zinc-400 uppercase font-bold block">Maksimal Beban</span>
            <span className="font-mono font-bold text-zinc-900 text-sm mt-0.5 block">
              {vehicle.maxCargoWeightKg ? `${vehicle.maxCargoWeightKg} KG` : 'N/A'}
            </span>
          </div>
          <div className="bg-zinc-50 p-3 rounded-2xl">
            <span className="text-[10px] text-zinc-400 uppercase font-bold block">Jatuh Tempo Pajak</span>
            <span className="font-mono font-bold text-zinc-900 text-sm mt-0.5 block">
              {new Date(vehicle.stnkExpiryDate).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}
            </span>
          </div>
        </div>
      </div>

      {/* 3 Main Tabs: Info Dasar & Pajak, BBM & Analitik, Spare Part */}
      <div className="flex p-1.5 bg-zinc-100 rounded-2xl border border-zinc-200 text-xs font-bold w-fit">
        <button
          onClick={() => setActiveTab('info')}
          className={`px-5 py-2.5 rounded-xl transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'info'
              ? 'bg-white text-zinc-950 shadow-xs'
              : 'text-zinc-500 hover:text-zinc-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Informasi Dasar & Pajak</span>
        </button>

        <button
          onClick={() => setActiveTab('fuel')}
          className={`px-5 py-2.5 rounded-xl transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'fuel'
              ? 'bg-white text-zinc-950 shadow-xs'
              : 'text-zinc-500 hover:text-zinc-900'
          }`}
        >
          <Fuel className="w-4 h-4" />
          <span>BBM & Lokasi GPS</span>
        </button>

        <button
          onClick={() => setActiveTab('parts')}
          className={`px-5 py-2.5 rounded-xl transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'parts'
              ? 'bg-white text-zinc-950 shadow-xs'
              : 'text-zinc-500 hover:text-zinc-900'
          }`}
        >
          <Wrench className="w-4 h-4" />
          <span>Spare Part & Keausan</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: INFORMASI DASAR, STNK & PERPANJANGAN PAJAK        */}
      {/* ======================================================== */}
      {activeTab === 'info' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Status Pajak & Identitas Surat (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className={`p-5 rounded-3xl border-2 space-y-3 shadow-sm ${
              isFiveYearDueThisCycle 
                ? 'bg-amber-50 border-amber-400 text-amber-950'
                : 'bg-zinc-50 border-zinc-300 text-zinc-900'
            }`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  {isFiveYearDueThisCycle ? (
                    <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />
                  ) : (
                    <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0" />
                  )}
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider block">
                      Status Perpanjangan Berikutnya:
                    </span>
                    <h3 className="font-black text-base tracking-tight">
                      {isFiveYearDueThisCycle 
                        ? 'PAJAK 5 TAHUNAN (GANTI PLAT / KALENG BARU)'
                        : 'PAJAK TAHUNAN RUTIN (PKB TAHUNAN)'}
                    </h3>
                  </div>
                </div>

                <span className={`px-3 py-1 rounded-full text-xs font-black font-mono uppercase ${
                  daysToAnnualExpiry <= 14 ? 'bg-amber-500 text-white animate-pulse' : 'bg-zinc-200 text-zinc-800'
                }`}>
                  {daysToAnnualExpiry > 0 ? `${daysToAnnualExpiry} Hari Lagi` : 'Jatuh Tempo!'}
                </span>
              </div>

              <p className="text-xs text-zinc-600 leading-relaxed">
                {isFiveYearDueThisCycle 
                  ? 'Kendaraan ini jatuh tempo siklus 5 tahunan. Wajib melakukan cek fisik nomor rangka & mesin di Samsat induk untuk cetak STNK dan Plat Nomor baru.'
                  : 'Pajak tahunan reguler. Dapat dibayarkan secara instan melalui aplikasi SIGNAL / Samsat Keliling tanpa cek fisik.'}
              </p>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-zinc-200 text-xs">
                <div>
                  <span className="text-[10px] text-zinc-500 block uppercase font-bold">Jatuh Tempo PKB</span>
                  <span className="font-mono font-bold text-zinc-900 text-sm">
                    {new Date(vehicle.stnkExpiryDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 block uppercase font-bold">Estimasi Biaya</span>
                  <span className="font-mono font-black text-zinc-950 text-base">
                    Rp {(isFiveYearDueThisCycle ? vehicle.stnkTaxCostFiveYear : vehicle.stnkTaxCostAnnual).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            </div>

            {/* Identitas Registrasi */}
            <div className="bg-white border-2 border-zinc-200 rounded-3xl p-5 shadow-sm space-y-3">
              <h4 className="font-extrabold text-xs uppercase tracking-wider text-zinc-900 flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-zinc-700" />
                <span>Dokumen Registrasi Kendaraan</span>
              </h4>

              <div className="divide-y divide-zinc-100 text-xs">
                <div className="py-2.5 flex justify-between">
                  <span className="text-zinc-500">Nomor Registrasi (Plat)</span>
                  <span className="font-mono font-bold text-zinc-900">{vehicle.plateNumber}</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-zinc-500">Nomor Seri STNK</span>
                  <span className="font-mono font-bold text-zinc-900">{vehicle.stnkNumber || 'Belum diisi'}</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-zinc-500">Nomor Rangka (VIN)</span>
                  <span className="font-mono font-bold text-zinc-900">{vehicle.chassisNumber || 'Belum diisi'}</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-zinc-500">Nomor Mesin</span>
                  <span className="font-mono font-bold text-zinc-900">{vehicle.engineNumber || 'Belum diisi'}</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-zinc-500">Masa Berlaku Plat (5 Tahun)</span>
                  <span className="font-mono font-bold text-zinc-900">
                    s/d {new Date(vehicle.stnkFiveYearExpiryDate).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Riwayat Pembayaran Pajak (5 Cols) */}
          <div className="lg:col-span-5 bg-white border-2 border-zinc-200 rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-extrabold text-xs uppercase tracking-wider text-zinc-900">
                  Riwayat Pembayaran Pajak
                </h4>
                <p className="text-[11px] text-zinc-500">Arsip perpanjangan tahunan & 5 tahunan</p>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setIsTaxModalOpen(true)}
                  className="flex items-center gap-1 py-1.5 px-3 bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-yellow-400 stroke-[3]" />
                  <span>Catat Pajak</span>
                </button>
              </div>
            </div>

            <div className="space-y-2.5">
              {(!vehicle.taxPaymentHistory || vehicle.taxPaymentHistory.length === 0) ? (
                <div className="p-6 bg-zinc-50 rounded-2xl text-center text-zinc-400 text-xs">
                  Belum ada riwayat perpanjangan pajak yang tersimpan.
                </div>
              ) : (
                vehicle.taxPaymentHistory.map((tax) => (
                  <div
                    key={tax.id}
                    className="p-3.5 bg-zinc-50 rounded-2xl border border-zinc-200 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-zinc-900">
                          {tax.taxType === 'lima_tahunan' ? 'Pajak 5 Tahunan (Plat Kaleng)' : 'Pajak Tahunan (PKB)'}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-500 mt-0.5">{tax.notes || tax.stnkValidationNumber}</p>
                      <span className="text-[10px] text-zinc-400 font-mono">{tax.paymentDate}</span>
                    </div>

                    <span className="font-mono font-black text-zinc-950 text-sm">
                      Rp {tax.cost.toLocaleString('id-ID')}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: BBM, ANALITIK KONSUMSI & LOKASI GPS               */}
      {/* ======================================================== */}
      {activeTab === 'fuel' && (
        <div className="space-y-5">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-3xl p-4 border-2 border-zinc-200 border-b-4 border-b-yellow-400 shadow-sm">
              <span className="text-[11px] font-bold text-zinc-500 uppercase flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-yellow-600" />
                <span>Efisiensi Rata-Rata</span>
              </span>
              <div className="mt-2 font-mono font-black text-xl text-zinc-950">
                {avgEfficiency} <span className="text-xs font-normal text-zinc-500">km/L</span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-0.5">Rasio pemakaian</p>
            </div>

            <div className="bg-white rounded-3xl p-4 border-2 border-zinc-200 border-b-4 border-b-zinc-900 shadow-sm">
              <span className="text-[11px] font-bold text-zinc-500 uppercase">Biaya / KM</span>
              <div className="mt-2 font-mono font-black text-xl text-zinc-950">
                Rp {costPerKm}
              </div>
              <p className="text-[11px] text-zinc-400 mt-0.5">Operasional riil BBM</p>
            </div>

            <div className="bg-white rounded-3xl p-4 border-2 border-zinc-200 border-b-4 border-b-zinc-900 shadow-sm">
              <span className="text-[11px] font-bold text-zinc-500 uppercase">Volume Terisi</span>
              <div className="mt-2 font-mono font-black text-xl text-zinc-950">
                {totalLiters.toFixed(1)} <span className="text-xs font-normal text-zinc-500">L</span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-0.5">Bahan bakar tercatat</p>
            </div>
          </div>

          {/* Action Header */}
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-black uppercase tracking-wider text-zinc-900">
              Riwayat Pengisian & Koordinat GPS SPBU
            </h4>
            <button
              onClick={onAddFuelLog}
              className="py-2.5 px-4 bg-yellow-400 hover:bg-yellow-300 text-zinc-950 text-xs font-black rounded-2xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Catat Pengisian BBM</span>
            </button>
          </div>

          {/* Fuel Transactions Grid (Desktop 2 Cols) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {vFuelLogs.map((log) => (
              <div
                key={log.id}
                className="bg-white rounded-3xl p-4.5 border-2 border-zinc-200 shadow-sm space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-xs text-zinc-900">{log.fuelType}</span>
                      <span className="text-[11px] text-zinc-400 font-mono">{log.date}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-zinc-600 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                      <span>{log.stationName}</span>
                    </div>
                    {log.gpsLocation && (
                      <div className="flex items-center gap-1 text-[11px] text-zinc-500 font-mono mt-0.5 ml-4">
                        <Navigation className="w-3 h-3 text-yellow-600" />
                        <span>GPS: {log.gpsLocation.addressDescription || `${log.gpsLocation.latitude}, ${log.gpsLocation.longitude}`}</span>
                      </div>
                    )}
                  </div>

                  <div className="text-right">
                    <span className="font-mono font-black text-base text-zinc-950 block">
                      Rp {log.totalCost.toLocaleString('id-ID')}
                    </span>
                    <span className="text-xs text-zinc-500 font-mono">{log.liters} Liter</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-zinc-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 font-mono text-xs text-zinc-600">
                    <Gauge className="w-4 h-4 text-zinc-400" />
                    <span>Odometer: {log.odometerKm.toLocaleString('id-ID')} KM</span>
                  </div>

                  {log.efficiencyKmPerLiter && (
                    <div className="px-3 py-1 bg-yellow-100 border border-yellow-300 text-zinc-950 font-mono font-bold text-xs rounded-full">
                      {log.efficiencyKmPerLiter} km/L
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: SPARE PART, ESTIMASI AUS & RIWAYAT PERGANTIAN     */}
      {/* ======================================================== */}
      {activeTab === 'parts' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {vParts.map((part) => (
              <div
                key={part.id}
                className="bg-white rounded-3xl p-4.5 border-2 border-zinc-200 shadow-sm space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <h5 className="font-black text-sm text-zinc-900">{part.name}</h5>
                    <span
                      className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                        part.status === 'critical'
                          ? 'bg-red-100 text-red-700 border border-red-300'
                          : part.status === 'warning'
                          ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      }`}
                    >
                      {part.status === 'critical' ? 'Wajib Ganti' : part.status === 'warning' ? 'Perhatian' : 'Optimal'}
                    </span>
                  </div>

                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-zinc-600 mb-1">
                      <span>Masa Pakai:</span>
                      <span className="font-mono font-black text-zinc-950">{part.estimatedLifeRemainingPct}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-zinc-100 rounded-full overflow-hidden p-0.5 border border-zinc-200">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          part.status === 'critical' ? 'bg-red-500' : part.status === 'warning' ? 'bg-yellow-400' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${part.estimatedLifeRemainingPct}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500 font-mono">
                  <span>Ganti: Tiap {part.recommendedIntervalKm.toLocaleString('id-ID')} KM</span>
                  {part.replacementCostEstimate && (
                    <span className="font-bold text-zinc-800">
                      Rp {part.replacementCostEstimate.toLocaleString('id-ID')}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL INPUT MANUAL PAJAK STNK */}
      {isTaxModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white border-2 border-zinc-900 rounded-3xl p-5 shadow-2xl text-zinc-900">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
              <h3 className="font-black text-sm uppercase tracking-wider text-zinc-900">
                Catat Pembayaran Pajak STNK
              </h3>
              <button
                onClick={() => setIsTaxModalOpen(false)}
                className="p-1 rounded-full text-zinc-400 hover:text-zinc-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTax} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-zinc-800 mb-1">Jenis Pembayaran Pajak</label>
                <div className="grid grid-cols-2 p-1 bg-zinc-100 rounded-xl border border-zinc-200 font-bold">
                  <button
                    type="button"
                    onClick={() => {
                      setTaxType('tahunan');
                      setTaxCost(vehicle.stnkTaxCostAnnual);
                    }}
                    className={`py-2 rounded-lg transition ${
                      taxType === 'tahunan' ? 'bg-white text-zinc-950 shadow-xs' : 'text-zinc-500'
                    }`}
                  >
                    Pajak Tahunan (PKB)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTaxType('lima_tahunan');
                      setTaxCost(vehicle.stnkTaxCostFiveYear);
                    }}
                    className={`py-2 rounded-lg transition ${
                      taxType === 'lima_tahunan' ? 'bg-yellow-400 text-zinc-950 shadow-xs' : 'text-zinc-500'
                    }`}
                  >
                    5 Tahunan (Plat Kaleng)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-zinc-800 mb-1">Tanggal Bayar</label>
                  <input
                    type="date"
                    value={taxDate}
                    onChange={(e) => setTaxDate(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-xl text-zinc-900 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-zinc-800 mb-1">Total Biaya (Rp)</label>
                  <input
                    type="number"
                    value={taxCost}
                    onChange={(e) => setTaxCost(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-xl text-zinc-900 font-mono font-bold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-zinc-800 mb-1">Nomor Pengesahan / Notice Pajak</label>
                <input
                  type="text"
                  placeholder="Contoh: PKB-2026-9921"
                  value={taxValidation}
                  onChange={(e) => setTaxValidation(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-xl text-zinc-900 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-800 mb-1">Tempat Bayar / Catatan</label>
                <input
                  type="text"
                  placeholder="Misal: Samsat Keliling Blok M / Aplikasi SIGNAL"
                  value={taxNotes}
                  onChange={(e) => setTaxNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-xl text-zinc-900"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 mt-2 bg-zinc-950 hover:bg-zinc-800 text-white font-black uppercase tracking-wider text-xs rounded-xl transition shadow active:scale-95 cursor-pointer"
              >
                Simpan Pembayaran Pajak
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDIT DATA KENDARAAN (INFORMASI DASAR LENGKAP - EXECUTIVE REDESIGN) */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-zinc-950/75 backdrop-blur-sm animate-fade-in text-zinc-900 dark:text-zinc-100">
          <div className="w-full max-w-2xl bg-white dark:bg-zinc-900 border-2 border-zinc-900 dark:border-zinc-700 rounded-3xl p-6 md:p-7 shadow-2xl max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-yellow-400 text-zinc-950 shadow-xs">
                  <Edit3 className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="font-black text-base uppercase tracking-wider text-zinc-900 dark:text-white">
                    Edit Informasi Dasar Kendaraan
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Kelola identitas armada, spesifikasi teknis mesin, dan administrasi STNK
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-2 rounded-full text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSaveVehicleEdit} className="flex-1 overflow-y-auto py-5 pr-1 space-y-5 no-scrollbar text-xs">
              {/* Bagian 1: Identitas Unit */}
              <div className="p-4 md:p-5 bg-zinc-50 dark:bg-zinc-800/60 rounded-3xl border border-zinc-200/80 dark:border-zinc-700 space-y-4">
                <div className="flex items-center gap-2 text-zinc-900 dark:text-white font-extrabold text-xs uppercase tracking-wider">
                  <Layers className="w-4 h-4 text-yellow-600" />
                  <span>1. Identitas Unit Kendaraan</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">Nama / Merk Kendaraan</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white font-bold focus:ring-2 focus:ring-yellow-400 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">Nomor Registrasi (Plat Nomor)</label>
                    <input
                      type="text"
                      value={editPlateNumber}
                      onChange={(e) => setEditPlateNumber(e.target.value.toUpperCase())}
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white font-mono font-black tracking-wide focus:ring-2 focus:ring-yellow-400 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">Kategori Kendaraan</label>
                    <select
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white font-bold focus:ring-2 focus:ring-yellow-400 focus:outline-none cursor-pointer"
                    >
                      <option value="motor">Sepeda Motor</option>
                      <option value="mobil">Mobil Penumpang / Niaga</option>
                      <option value="truk">Truk / Kendaraan Berat</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">Tahun Pembuatan</label>
                    <input
                      type="number"
                      value={editYear}
                      onChange={(e) => setEditYear(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white font-mono font-bold focus:ring-2 focus:ring-yellow-400 focus:outline-none"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Bagian 2: Spesifikasi Teknis & Odometer */}
              <div className="p-4 md:p-5 bg-zinc-50 dark:bg-zinc-800/60 rounded-3xl border border-zinc-200/80 dark:border-zinc-700 space-y-4">
                <div className="flex items-center gap-2 text-zinc-900 dark:text-white font-extrabold text-xs uppercase tracking-wider">
                  <Gauge className="w-4 h-4 text-yellow-600" />
                  <span>2. Spesifikasi Mesin & Tangki BBM</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">Odometer Terkini (KM)</label>
                    <input
                      type="number"
                      value={editOdometer}
                      onChange={(e) => setEditOdometer(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white font-mono font-bold focus:ring-2 focus:ring-yellow-400 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">Jenis Bahan Bakar</label>
                    <select
                      value={editFuelType}
                      onChange={(e) => setEditFuelType(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white font-bold focus:ring-2 focus:ring-yellow-400 focus:outline-none cursor-pointer"
                    >
                      <option value="Pertalite">Pertalite (RON 90)</option>
                      <option value="Pertamax">Pertamax (RON 92)</option>
                      <option value="Pertamax Turbo">Pertamax Turbo (RON 98)</option>
                      <option value="Solar">Solar</option>
                      <option value="Bio Solar">Bio Solar</option>
                      <option value="Dexlite">Dexlite</option>
                      <option value="Listrik">Listrik (EV)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">Kapasitas Tangki (Liter)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={editTankCapacity}
                      onChange={(e) => setEditTankCapacity(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white font-mono focus:ring-2 focus:ring-yellow-400 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  <div>
                    <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">Maksimal Beban Muatan (KG)</label>
                    <input
                      type="number"
                      value={editMaxCargo}
                      onChange={(e) => setEditMaxCargo(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white font-mono focus:ring-2 focus:ring-yellow-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">Catatan Operasional Kendaraan</label>
                    <input
                      type="text"
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      placeholder="Contoh: Unit operasional antar kota / servis berkala"
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white focus:ring-2 focus:ring-yellow-400 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Bagian 3: Dokumen STNK & Pajak */}
              <div className="p-4 md:p-5 bg-zinc-50 dark:bg-zinc-800/60 rounded-3xl border border-zinc-200/80 dark:border-zinc-700 space-y-4">
                <div className="flex items-center gap-2 text-zinc-900 dark:text-white font-extrabold text-xs uppercase tracking-wider">
                  <CreditCard className="w-4 h-4 text-yellow-600" />
                  <span>3. Dokumen Legalitas STNK & Pajak</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">Nomor Seri STNK</label>
                    <input
                      type="text"
                      value={editStnkNumber}
                      onChange={(e) => setEditStnkNumber(e.target.value)}
                      placeholder="Contoh: 1234567/MJ/2022"
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white font-mono focus:ring-2 focus:ring-yellow-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">Nomor Rangka (VIN)</label>
                    <input
                      type="text"
                      value={editChassisNumber}
                      onChange={(e) => setEditChassisNumber(e.target.value.toUpperCase())}
                      placeholder="Contoh: MH1JF5119EK..."
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white font-mono focus:ring-2 focus:ring-yellow-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">Nomor Mesin</label>
                    <input
                      type="text"
                      value={editEngineNumber}
                      onChange={(e) => setEditEngineNumber(e.target.value.toUpperCase())}
                      placeholder="Contoh: JF51E1123456"
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white font-mono focus:ring-2 focus:ring-yellow-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  <div>
                    <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">Jatuh Tempo Pajak Tahunan (PKB)</label>
                    <input
                      type="date"
                      value={editStnkExpiryDate}
                      onChange={(e) => setEditStnkExpiryDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white font-mono focus:ring-2 focus:ring-yellow-400 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">Jatuh Tempo Plat 5 Tahunan (Kaleng)</label>
                    <input
                      type="date"
                      value={editStnkFiveYearExpiryDate}
                      onChange={(e) => setEditStnkFiveYearExpiryDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white font-mono focus:ring-2 focus:ring-yellow-400 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">Estimasi Biaya Pajak Tahunan (Rp)</label>
                    <input
                      type="number"
                      value={editTaxCostAnnual}
                      onChange={(e) => setEditTaxCostAnnual(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white font-mono font-bold focus:ring-2 focus:ring-yellow-400 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">Estimasi Biaya Ganti Plat 5 Tahun (Rp)</label>
                    <input
                      type="number"
                      value={editTaxCostFiveYear}
                      onChange={(e) => setEditTaxCostFiveYear(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white font-mono font-bold focus:ring-2 focus:ring-yellow-400 focus:outline-none"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer Bar */}
              <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setIsDeleteConfirmOpen(true)}
                  className="w-full sm:w-auto py-3 px-4 rounded-2xl bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 font-bold transition flex items-center justify-center gap-1.5 cursor-pointer border border-red-200 dark:border-red-900"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Hapus Unit Ini</span>
                </button>

                <div className="w-full sm:w-auto flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="flex-1 sm:flex-none py-3 px-5 rounded-2xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold transition cursor-pointer"
                  >
                    Batal
                  </button>

                  <button
                    type="submit"
                    className="flex-1 sm:flex-none py-3 px-6 bg-yellow-400 hover:bg-yellow-300 text-zinc-950 font-black uppercase tracking-wider text-xs rounded-2xl transition shadow-md shadow-yellow-400/20 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Simpan Perubahan</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI HAPUS KENDARAAN (DANGER DIALOG) */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm animate-fade-in text-zinc-900 dark:text-zinc-100">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 border-2 border-red-600 dark:border-red-500 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/80 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="font-black text-base text-zinc-900 dark:text-white">
                  Hapus Kendaraan dari Garasi?
                </h3>
                <span className="text-xs text-red-600 dark:text-red-400 font-bold">
                  Tindakan ini tidak dapat dibatalkan
                </span>
              </div>
            </div>

            <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed bg-zinc-50 dark:bg-zinc-800/60 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-700">
              Unit armada <strong>{vehicle.name}</strong> dengan plat nomor <strong>{vehicle.plateNumber}</strong> akan dihapus permanen dari sistem, termasuk seluruh catatan BBM, suku cadang, dan riwayat servis terkait.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteConfirmOpen(false)}
                className="py-3 px-4 rounded-2xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold text-xs transition cursor-pointer"
              >
                Batalkan
              </button>

              <button
                type="button"
                onClick={handleConfirmDelete}
                className="py-3 px-4 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider transition shadow-md shadow-red-600/20 active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Ya, Hapus</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
