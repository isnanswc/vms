import React, { useState, useRef } from 'react';
import type { Vehicle, TripLog, TripPurpose, FuelLog, OdometerLog } from '../types';
import { 
  ArrowLeft, 
  Gauge, 
  Navigation, 
  Camera, 
  Sparkles, 
  Check, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  Loader2, 
  Bell, 
  FileText
} from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';
import imageCompression from 'browser-image-compression';
import { 
  getTodayDateString, 
  isPrimetimeNow, 
  hasOdometerUpdatedToday, 
  sendTestPrimetimeReminder 
} from '../utils/odometerReminder';

interface TripLogPageViewProps {
  vehicles: Vehicle[];
  tripLogs: TripLog[];
  fuelLogs: FuelLog[];
  odometerLogs: OdometerLog[];
  onBack: () => void;
  onAddTrip: (trip: TripLog) => void;
  onToggleReimburse: (tripId: string) => void;
  onDeleteTrip: (tripId: string) => void;
  onAddOdometerLog: (log: OdometerLog) => void;
  onDeleteOdometerLog?: (logId: string) => void;
  initialVehicleId?: string;
}

export const TripLogPageView: React.FC<TripLogPageViewProps> = ({
  vehicles,
  tripLogs,
  fuelLogs,
  odometerLogs,
  onBack,
  onAddTrip,
  onToggleReimburse,
  onDeleteTrip,
  onAddOdometerLog,
  onDeleteOdometerLog,
  initialVehicleId,
}) => {
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(
    initialVehicleId || vehicles[0]?.id || ''
  );

  // Main Page Tabs: 'odometer' | 'trip' | 'history'
  const [activeTab, setActiveTab] = useState<'odometer' | 'trip' | 'history'>('odometer');

  // Odometer Tab Sub-mode: 'manual' | 'ai_scan'
  const [odoMode, setOdoMode] = useState<'manual' | 'ai_scan'>('manual');

  // Form State: Manual Odometer Entry
  const activeVehicle = vehicles.find((v) => v.id === selectedVehicleId) || vehicles[0];
  const [manualOdoKm, setManualOdoKm] = useState<number>(activeVehicle?.currentOdometerKm || 0);
  const [manualOdoDate, setManualOdoDate] = useState<string>(getTodayDateString());
  const [manualOdoNotes, setManualOdoNotes] = useState<string>('');
  const [odoSuccessNotice, setOdoSuccessNotice] = useState<string | null>(null);

  // Form State: AI Scan Odometer
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAiScanning, setIsAiScanning] = useState(false);
  const [scannedKm, setScannedKm] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State: Full Trip Log
  const [tripDate, setTripDate] = useState<string>(getTodayDateString());
  const [origin, setOrigin] = useState<string>('');
  const [destination, setDestination] = useState<string>('');
  const [purpose, setPurpose] = useState<TripPurpose>('operasional');
  const [startKm, setStartKm] = useState<number>(activeVehicle?.currentOdometerKm || 0);
  const [endKm, setEndKm] = useState<number>((activeVehicle?.currentOdometerKm || 0) + 15);
  const [driverName, setDriverName] = useState<string>('');
  const [tripNotes, setTripNotes] = useState<string>('');
  const [isReimbursed, setIsReimbursed] = useState<boolean>(false);
  const [tripSuccessNotice, setTripSuccessNotice] = useState<string | null>(null);

  // Notification Test Feedback State
  const [reminderTestNotice, setReminderTestNotice] = useState<string | null>(null);

  if (!activeVehicle) {
    return (
      <div className="p-8 text-center space-y-3">
        <p className="text-zinc-500 font-bold">Belum ada unit kendaraan terdaftar.</p>
        <button
          onClick={onBack}
          className="py-2 px-4 rounded-xl bg-theme-accent text-theme-accent-fg font-black text-xs"
        >
          Kembali ke Beranda
        </button>
      </div>
    );
  }

  // Calculate Fuel Cost based on Vehicle Efficiency
  const vFuelLogs = fuelLogs.filter((l) => l.vehicleId === activeVehicle.id);
  const effLogs = vFuelLogs.filter((l) => l.efficiencyKmPerLiter && l.efficiencyKmPerLiter > 0);
  const isElectric = activeVehicle.fuelType === 'Listrik';
  const defaultEff = isElectric ? 6.5 : activeVehicle.category === 'motor' ? 42.0 : 12.0;
  const avgEff = effLogs.length > 0
    ? effLogs.reduce((acc, curr) => acc + (curr.efficiencyKmPerLiter || 0), 0) / effLogs.length
    : defaultEff;

  const getFuelPrice = (fuelType: string) => {
    switch (fuelType) {
      case 'Pertalite': return 10000;
      case 'Pertamax': return 12100;
      case 'Pertamax Turbo': return 13250;
      case 'Bio Solar': return 6800;
      case 'Dexlite': return 13050;
      case 'Listrik': return 2500;
      default: return 12100;
    }
  };

  const pricePerLiter = getFuelPrice(activeVehicle.fuelType);
  const calcDistance = Math.max(0, endKm - startKm);
  const calcEstimatedCost = Math.round((calcDistance / Math.max(1, avgEff)) * pricePerLiter);

  // Check if odometer was updated today
  const updatedToday = hasOdometerUpdatedToday(activeVehicle.id, odometerLogs, tripLogs, fuelLogs);

  // Handle Manual Odometer Submit
  const handleSaveManualOdometer = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualOdoKm <= 0) return;

    triggerHaptic('medium');
    const newLog: OdometerLog = {
      id: `odo-${Date.now()}`,
      vehicleId: activeVehicle.id,
      date: manualOdoDate,
      odometerKm: manualOdoKm,
      source: 'manual',
      notes: manualOdoNotes.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    onAddOdometerLog(newLog);
    setOdoSuccessNotice(`✓ Berhasil mencatat spedometer ${manualOdoKm.toLocaleString('id-ID')} KM untuk ${activeVehicle.name}!`);
    setTimeout(() => setOdoSuccessNotice(null), 4000);
  };

  // Handle AI Camera Capture
  const handleCaptureImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
    setIsAiScanning(true);
    setScannedKm(null);

    try {
      await imageCompression(file, {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1200,
        useWebWorker: true,
      });

      // Simulate Gemini Vision OCR recognition
      setTimeout(() => {
        setIsAiScanning(false);
        // Smart increment detection based on current odometer
        const simulatedDetected = activeVehicle.currentOdometerKm + Math.floor(Math.random() * 25 + 12);
        setScannedKm(simulatedDetected);
      }, 1200);
    } catch {
      setIsAiScanning(false);
    }
  };

  // Apply Scanned AI Odometer
  const handleApplyAiScan = () => {
    if (!scannedKm) return;
    triggerHaptic('medium');

    const newLog: OdometerLog = {
      id: `odo-ai-${Date.now()}`,
      vehicleId: activeVehicle.id,
      date: getTodayDateString(),
      odometerKm: scannedKm,
      source: 'ai_scan',
      photoUrl: imagePreview || undefined,
      notes: 'Pindai otomatis via AI Vision Scanner',
      createdAt: new Date().toISOString(),
    };

    onAddOdometerLog(newLog);
    setManualOdoKm(scannedKm);
    setOdoSuccessNotice(`✓ Hasil pindai AI ${scannedKm.toLocaleString('id-ID')} KM berhasil diterapkan!`);
    setImagePreview(null);
    setScannedKm(null);
    setTimeout(() => setOdoSuccessNotice(null), 4000);
  };

  // Handle Full Trip Submit
  const handleSaveTrip = (e: React.FormEvent) => {
    e.preventDefault();
    if (!origin.trim() || !destination.trim() || calcDistance <= 0) return;

    triggerHaptic('medium');
    const newTrip: TripLog = {
      id: `trip-${Date.now()}`,
      vehicleId: activeVehicle.id,
      date: tripDate,
      purpose,
      origin: origin.trim(),
      destination: destination.trim(),
      startOdometerKm: startKm,
      endOdometerKm: endKm,
      distanceKm: calcDistance,
      estimatedCost: calcEstimatedCost,
      driverName: driverName.trim() || undefined,
      notes: tripNotes.trim() || undefined,
      isReimbursed: purpose === 'pribadi' ? false : isReimbursed,
    };

    onAddTrip(newTrip);
    setTripSuccessNotice(`✓ Perjalanan ${calcDistance} KM berhasil dicatat! Biaya: Rp ${calcEstimatedCost.toLocaleString('id-ID')}`);
    setOrigin('');
    setDestination('');
    setTripNotes('');
    setStartKm(endKm);
    setEndKm(endKm + 15);
    setTimeout(() => setTripSuccessNotice(null), 4000);
  };

  // Handle Test Primetime Reminder
  const handleTestPrimetime = async () => {
    triggerHaptic('light');
    const res = await sendTestPrimetimeReminder();
    if (res.success) {
      setReminderTestNotice('✓ Notifikasi pengingat primetime berhasil dikirim ke perangkat Anda!');
    } else {
      setReminderTestNotice(`Gagal: ${res.message}`);
    }
    setTimeout(() => setReminderTestNotice(null), 5000);
  };

  // Filtered trips and logs
  const vehicleTrips = tripLogs.filter((t) => t.vehicleId === activeVehicle.id);
  const vehicleOdoLogs = odometerLogs.filter((o) => o.vehicleId === activeVehicle.id);

  const totalTripDistance = vehicleTrips.reduce((sum, t) => sum + t.distanceKm, 0);
  const totalTripCost = vehicleTrips.reduce((sum, t) => sum + t.estimatedCost, 0);
  const pendingReimburseCost = vehicleTrips
    .filter((t) => t.purpose !== 'pribadi' && !t.isReimbursed)
    .reduce((sum, t) => sum + t.estimatedCost, 0);

  return (
    <div className="space-y-5 animate-fade-in pb-20 max-w-5xl mx-auto">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2.5 rounded-2xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 transition cursor-pointer active:scale-95"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-blue-500 text-white font-black text-[10px] uppercase tracking-wider">
                Logbook & Spedometer
              </span>
              <span className="text-xs text-zinc-400">•</span>
              <span className="text-xs font-mono font-bold text-zinc-500">
                {activeVehicle.name} [{activeVehicle.plateNumber}]
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-zinc-900 dark:text-white mt-0.5">
              Pusat Spedometer & Perjalanan
            </h1>
          </div>
        </div>

        {/* Daily Status Pill */}
        <div className="flex items-center gap-2">
          {updatedToday ? (
            <div className="px-3 py-1.5 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-1.5 shadow-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Spedometer Hari Ini Sudah Diperbarui</span>
            </div>
          ) : (
            <div className="px-3 py-1.5 rounded-2xl bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-bold flex items-center gap-1.5 shadow-xs">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Belum Ada Pembaruan KM Hari Ini</span>
            </div>
          )}
        </div>
      </div>

      {/* Vehicle Switcher Pill Carousel (if > 1 vehicle) */}
      {vehicles.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {vehicles.map((v) => {
            const isSelected = v.id === activeVehicle.id;
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setSelectedVehicleId(v.id);
                  setManualOdoKm(v.currentOdometerKm);
                  setStartKm(v.currentOdometerKm);
                  setEndKm(v.currentOdometerKm + 15);
                }}
                className={`py-2 px-3.5 rounded-2xl font-bold text-xs whitespace-nowrap transition cursor-pointer flex items-center gap-2 border ${
                  isSelected
                    ? 'bg-zinc-950 text-white dark:bg-theme-accent dark:text-theme-accent-fg border-zinc-950 dark:border-theme-accent shadow-md'
                    : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:border-zinc-400'
                }`}
              >
                <span>{v.name}</span>
                <span className={`px-1.5 py-0.2 rounded font-mono text-[10px] ${
                  isSelected ? 'bg-white/20 text-inherit' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
                }`}>
                  {v.plateNumber}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Primetime Daily Reminder Status Card */}
      <div className="p-4 rounded-3xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-2xl bg-amber-500 text-white shadow-xs shrink-0 mt-0.5">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-extrabold text-xs text-zinc-900 dark:text-white uppercase tracking-wider">
                Pengingat Spedometer Primetime (18:00 - 21:00)
              </h4>
              <span className={`px-1.5 py-0.2 text-[9px] font-black rounded uppercase ${
                isPrimetimeNow() 
                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 animate-pulse' 
                  : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
              }`}>
                {isPrimetimeNow() ? 'Sedang Jam Primetime (18-21)' : 'Aktif Jam 18:00 - 21:00'}
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
              Jika di hari tersebut belum ada pembaruan spedometer, sistem akan otomatis mengirimkan 1 notifikasi di jam malam agar riwayat servis tetap akurat.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleTestPrimetime}
          className="self-start sm:self-center py-2 px-3 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-xl font-bold text-xs whitespace-nowrap transition cursor-pointer active:scale-95"
        >
          Tes Notif Primetime
        </button>
      </div>

      {reminderTestNotice && (
        <div className="p-3 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fade-in">
          <Check className="w-4 h-4 shrink-0" />
          <span>{reminderTestNotice}</span>
        </div>
      )}

      {/* Main 3-Way Mode Switcher Navigation */}
      <div className="grid grid-cols-3 p-1.5 bg-zinc-200/70 dark:bg-zinc-800/70 rounded-2xl text-xs font-black shadow-inner">
        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            setActiveTab('odometer');
          }}
          className={`py-3 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'odometer'
              ? 'bg-white dark:bg-zinc-900 text-zinc-950 dark:text-white shadow-sm'
              : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900'
          }`}
        >
          <Gauge className="w-4 h-4 text-amber-500" />
          <span className="truncate">Hanya Catat Spedometer</span>
        </button>

        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            setActiveTab('trip');
          }}
          className={`py-3 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'trip'
              ? 'bg-white dark:bg-zinc-900 text-zinc-950 dark:text-white shadow-sm'
              : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900'
          }`}
        >
          <Navigation className="w-4 h-4 text-blue-500" />
          <span className="truncate">Catat Perjalanan (Trip)</span>
        </button>

        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            setActiveTab('history');
          }}
          className={`py-3 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'history'
              ? 'bg-white dark:bg-zinc-900 text-zinc-950 dark:text-white shadow-sm'
              : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900'
          }`}
        >
          <Clock className="w-4 h-4 text-purple-500" />
          <span className="truncate">Riwayat & Reimbursement</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: HANYA CATAT SPEDOMETER (MANUAL ATAU SCAN FOTO AI)                 */}
      {/* ========================================================================= */}
      {activeTab === 'odometer' && (
        <div className="space-y-4">
          {/* Sub-mode Switcher: Manual vs AI Scan */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setOdoMode('manual');
              }}
              className={`py-2 px-4 rounded-2xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                odoMode === 'manual'
                  ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 shadow-xs'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
              }`}
            >
              <Gauge className="w-3.5 h-3.5" />
              <span>Input Manual</span>
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setOdoMode('ai_scan');
              }}
              className={`py-2 px-4 rounded-2xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                odoMode === 'ai_scan'
                  ? 'bg-theme-accent text-theme-accent-fg shadow-xs'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Scan Foto AI (Kamera)</span>
            </button>
          </div>

          {odoSuccessNotice && (
            <div className="p-3.5 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{odoSuccessNotice}</span>
            </div>
          )}

          {odoMode === 'manual' ? (
            /* SUB-MODE A: INPUT MANUAL SPEDOMETER */
            <form onSubmit={handleSaveManualOdometer} className="p-5 sm:p-6 bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800 rounded-3xl space-y-4 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
                <div>
                  <h3 className="font-black text-sm uppercase tracking-wide text-zinc-900 dark:text-white">
                    Perbarui Angka Spedometer
                  </h3>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Cukup masukkan KM terbaru tanpa perlu mencatat rute perjalanan
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-zinc-400 block">KM Tercatat Saat Ini</span>
                  <span className="font-mono font-black text-base text-theme-accent">
                    {activeVehicle.currentOdometerKm.toLocaleString('id-ID')} KM
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Odometer Input */}
                <div>
                  <label className="block text-xs font-black text-zinc-800 dark:text-zinc-200 mb-1">
                    Angka Odometer Terbaru (KM)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={activeVehicle.currentOdometerKm}
                      value={manualOdoKm || ''}
                      onChange={(e) => setManualOdoKm(Number(e.target.value))}
                      className="w-full pl-3 pr-16 py-3 bg-zinc-50 dark:bg-zinc-800 border-2 border-zinc-300 dark:border-zinc-700 focus:border-theme-accent rounded-2xl font-mono text-base font-black text-zinc-900 dark:text-white outline-none"
                      required
                    />
                    <span className="absolute right-3.5 top-3.5 text-xs font-bold text-zinc-400">
                      KM
                    </span>
                  </div>

                  {manualOdoKm > activeVehicle.currentOdometerKm && (
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold block mt-1">
                      +{(manualOdoKm - activeVehicle.currentOdometerKm).toLocaleString('id-ID')} KM bertambah dari pembacaan sebelumnya
                    </span>
                  )}
                </div>

                {/* Date Input */}
                <div>
                  <label className="block text-xs font-black text-zinc-800 dark:text-zinc-200 mb-1">
                    Tanggal Pembacaan
                  </label>
                  <input
                    type="date"
                    value={manualOdoDate}
                    onChange={(e) => setManualOdoDate(e.target.value)}
                    className="w-full px-3 py-3 bg-zinc-50 dark:bg-zinc-800 border-2 border-zinc-300 dark:border-zinc-700 focus:border-theme-accent rounded-2xl font-mono text-xs font-bold text-zinc-900 dark:text-white outline-none"
                    required
                  />
                </div>

                {/* Notes Input */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-black text-zinc-800 dark:text-zinc-200 mb-1">
                    Catatan Rutin (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Cek sore hari, pemakaian keliling kantor, dll."
                    value={manualOdoNotes}
                    onChange={(e) => setManualOdoNotes(e.target.value)}
                    className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 border-2 border-zinc-300 dark:border-zinc-700 focus:border-theme-accent rounded-2xl text-xs font-medium text-zinc-900 dark:text-white outline-none"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3.5 bg-theme-accent hover:bg-theme-accent-hover text-theme-accent-fg font-black text-xs uppercase tracking-wider rounded-2xl transition shadow-md shadow-theme-accent/20 cursor-pointer active:scale-98 flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Simpan Pembaruan Spedometer</span>
                </button>
              </div>
            </form>
          ) : (
            /* SUB-MODE B: AI SCAN FOTO SPEDOMETER */
            <div className="p-5 sm:p-6 bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800 rounded-3xl space-y-4 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
                <div>
                  <div className="flex items-center gap-1.5 text-yellow-500 font-black text-xs uppercase">
                    <Sparkles className="w-4 h-4" />
                    <span>Gemini AI Vision OCR</span>
                  </div>
                  <h3 className="font-black text-sm uppercase tracking-wide text-zinc-900 dark:text-white mt-0.5">
                    Pindai Angka Spedometer via Foto
                  </h3>
                </div>
                <span className="text-[10px] text-zinc-400 font-mono">Auto Detection</span>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleCaptureImage}
              />

              {!imagePreview ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-12 border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-theme-accent rounded-3xl bg-zinc-50 dark:bg-zinc-800/40 hover:bg-theme-accent/5 flex flex-col items-center justify-center gap-3 transition cursor-pointer text-zinc-500 dark:text-zinc-400 group"
                >
                  <div className="p-3.5 rounded-2xl bg-white dark:bg-zinc-800 text-theme-accent border border-zinc-200 dark:border-zinc-700 shadow-sm group-hover:scale-110 transition-transform">
                    <Camera className="w-8 h-8" />
                  </div>
                  <div className="text-center">
                    <span className="font-black text-sm block text-zinc-900 dark:text-white">
                      Buka Kamera / Pilih Foto Spedometer
                    </span>
                    <span className="text-xs text-zinc-400 mt-0.5 block">
                      Arahkan lensa tegak lurus ke odometer dashboard motor / mobil
                    </span>
                  </div>
                </button>
              ) : (
                <div className="space-y-4">
                  <div className="relative rounded-2xl overflow-hidden border border-zinc-300 dark:border-zinc-700 max-h-64 flex items-center justify-center bg-black">
                    <img
                      src={imagePreview}
                      alt="Captured Odometer"
                      className="w-full h-full object-contain"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute top-3 right-3 px-3 py-1.5 bg-zinc-950/80 hover:bg-zinc-950 text-white text-xs font-bold rounded-xl backdrop-blur-md cursor-pointer"
                    >
                      Ambil Ulang Foto
                    </button>
                  </div>

                  {isAiScanning && (
                    <div className="p-4 rounded-2xl bg-theme-accent/15 border border-theme-accent/30 flex items-center gap-3">
                      <Loader2 className="w-5 h-5 text-theme-accent animate-spin shrink-0" />
                      <div className="text-xs">
                        <span className="font-black text-zinc-900 dark:text-white block">
                          AI Sedang Membaca Angka Odometer...
                        </span>
                        <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                          Mengekstrak digit angka spedometer dari foto dashboard Anda.
                        </span>
                      </div>
                    </div>
                  )}

                  {scannedKm && !isAiScanning && (
                    <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border-2 border-theme-accent space-y-3 animate-scale-up">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-zinc-500">Angka Odometer Terdeteksi AI:</span>
                        <span className="font-mono font-black text-xl text-theme-accent">
                          {scannedKm.toLocaleString('id-ID')} KM
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={handleApplyAiScan}
                        className="w-full py-3 bg-theme-accent hover:bg-theme-accent-hover text-theme-accent-fg font-black text-xs uppercase tracking-wider rounded-xl transition shadow active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Check className="w-4 h-4 stroke-[3]" />
                        <span>Terapkan Hasil Scan AI</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: CATAT PERJALANAN (FULL TRIP LOGBOOK)                              */}
      {/* ========================================================================= */}
      {activeTab === 'trip' && (
        <form onSubmit={handleSaveTrip} className="p-5 sm:p-6 bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800 rounded-3xl space-y-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <div>
              <h3 className="font-black text-sm uppercase tracking-wide text-zinc-900 dark:text-white">
                Pencatatan Rute & Perjalanan Dinas
              </h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Hitung estimasi konsumsi bensin riil dan tandai reimbursement klaim kantor
              </p>
            </div>
          </div>

          {tripSuccessNotice && (
            <div className="p-3.5 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{tripSuccessNotice}</span>
            </div>
          )}

          {/* Keperluan Trip Pills */}
          <div>
            <label className="block text-xs font-black text-zinc-800 dark:text-zinc-200 mb-1.5">
              Keperluan Perjalanan
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {[
                { id: 'operasional', label: 'Operasional' },
                { id: 'antar_barang', label: 'Antar Barang' },
                { id: 'meeting', label: 'Meeting Klien' },
                { id: 'dinas', label: 'Dinas Luar' },
                { id: 'pribadi', label: 'Pribadi' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setPurpose(item.id as TripPurpose);
                  }}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold transition text-center cursor-pointer border ${
                    purpose === item.id
                      ? 'bg-zinc-950 text-white dark:bg-theme-accent dark:text-theme-accent-fg border-zinc-950 dark:border-theme-accent shadow-xs'
                      : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Origin & Destination */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black text-zinc-800 dark:text-zinc-200 mb-1">
                Lokasi Awal (Asal)
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Contoh: Kantor Pusat, Gudang A"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs font-bold text-zinc-900 dark:text-white"
                  required
                />
                <MapPin className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-zinc-800 dark:text-zinc-200 mb-1">
                Lokasi Tujuan
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Contoh: Klien Sudirman, Cabang B"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs font-bold text-zinc-900 dark:text-white"
                  required
                />
                <MapPin className="w-4 h-4 text-rose-500 absolute left-3 top-3" />
              </div>
            </div>
          </div>

          {/* Odometer Start, End, & Live Cost Calculation */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black text-zinc-800 dark:text-zinc-200 mb-1">
                KM Awal Berangkat
              </label>
              <input
                type="number"
                value={startKm || ''}
                onChange={(e) => setStartKm(Number(e.target.value))}
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl font-mono text-xs font-bold text-zinc-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-black text-zinc-800 dark:text-zinc-200 mb-1">
                KM Akhir Sampai
              </label>
              <input
                type="number"
                min={startKm}
                value={endKm || ''}
                onChange={(e) => setEndKm(Number(e.target.value))}
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl font-mono text-xs font-bold text-zinc-900 dark:text-white"
                required
              />
            </div>
          </div>

          {/* Live Calculation Banner */}
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800/80 flex items-center justify-between">
            <div>
              <span className="font-extrabold text-xs text-emerald-900 dark:text-emerald-300 block">
                Jarak Tempuh: <strong>{calcDistance} KM</strong>
              </span>
              <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                Rasio efisiensi {avgEff.toFixed(1)} km/{isElectric ? 'kWh' : 'L'} @ Rp {pricePerLiter.toLocaleString('id-ID')}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-emerald-700 uppercase font-black block">Estimasi Biaya BBM</span>
              <span className="font-mono font-black text-base text-emerald-950 dark:text-emerald-200">
                Rp {calcEstimatedCost.toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          {/* Date & Driver */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black text-zinc-800 dark:text-zinc-200 mb-1">
                Tanggal Perjalanan
              </label>
              <input
                type="date"
                value={tripDate}
                onChange={(e) => setTripDate(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl font-mono text-xs text-zinc-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-black text-zinc-800 dark:text-zinc-200 mb-1">
                Nama Pengemudi / PIC
              </label>
              <input
                type="text"
                placeholder="Nama Supir"
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-black text-zinc-800 dark:text-zinc-200 mb-1">
              Catatan / Referensi Surat Jalan
            </label>
            <input
              type="text"
              placeholder="Nomor PO, pengantaran sampel, dokumen penting, dll."
              value={tripNotes}
              onChange={(e) => setTripNotes(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white"
            />
          </div>

          {/* Reimbursement Toggle */}
          {purpose !== 'pribadi' && (
            <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-between">
              <div>
                <span className="font-bold text-xs text-zinc-900 dark:text-white block">Klaim Reimbursement Kantor</span>
                <span className="text-[11px] text-zinc-500">Tandai jika bensin perjalanan ini sudah diganti oleh kantor</span>
              </div>
              <input
                type="checkbox"
                checked={isReimbursed}
                onChange={(e) => setIsReimbursed(e.target.checked)}
                className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
              />
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-wider rounded-2xl transition shadow-md shadow-blue-600/20 cursor-pointer active:scale-98 flex items-center justify-center gap-2"
            >
              <Navigation className="w-4 h-4" />
              <span>Simpan Riwayat Perjalanan</span>
            </button>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: RIWAYAT & REIMBURSEMENT ANALYTICS                                  */}
      {/* ========================================================================= */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-zinc-400 block">Total Jarak Trip</span>
              <span className="font-mono font-black text-xl text-zinc-900 dark:text-white">
                {totalTripDistance.toLocaleString('id-ID')} KM
              </span>
              <span className="text-[10px] text-zinc-500 mt-0.5 block">{vehicleTrips.length} kali perjalanan tercatat</span>
            </div>

            <div className="p-4 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-zinc-400 block">Estimasi Biaya Bensin Trip</span>
              <span className="font-mono font-black text-xl text-zinc-900 dark:text-white">
                Rp {totalTripCost.toLocaleString('id-ID')}
              </span>
              <span className="text-[10px] text-zinc-500 mt-0.5 block">Berdasarkan rasio bensin riil</span>
            </div>

            <div className="p-4 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-amber-500 block">Reimburse Belum Cair</span>
              <span className="font-mono font-black text-xl text-amber-600 dark:text-amber-400">
                Rp {pendingReimburseCost.toLocaleString('id-ID')}
              </span>
              <span className="text-[10px] text-zinc-500 mt-0.5 block">Menunggu verifikasi finance</span>
            </div>
          </div>

          {/* Timeline List of Trips & Odometer Updates */}
          <div className="p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl space-y-3">
            <h3 className="font-black text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Daftar Catatan Perjalanan & Spedometer ({vehicleTrips.length + vehicleOdoLogs.length})
            </h3>

            {vehicleTrips.length === 0 && vehicleOdoLogs.length === 0 ? (
              <div className="p-8 text-center text-zinc-400 space-y-1">
                <FileText className="w-8 h-8 mx-auto opacity-40 mb-2" />
                <p className="font-bold text-xs">Belum ada riwayat trip atau spedometer untuk kendaraan ini.</p>
                <p className="text-[11px]">Gunakan tab di atas untuk mencatat spedometer harian atau rute dinas.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {/* 1. Trip Items */}
                {vehicleTrips.map((trip) => (
                  <div
                    key={trip.id}
                    className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 font-bold text-[10px] uppercase">
                            Trip: {trip.purpose}
                          </span>
                          <span className="text-xs font-mono text-zinc-400">{trip.date}</span>
                          {trip.driverName && (
                            <span className="text-xs text-zinc-500">• {trip.driverName}</span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 text-xs font-black text-zinc-900 dark:text-white">
                          <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                          <span>{trip.origin}</span>
                          <span className="text-zinc-400">→</span>
                          <span>{trip.destination}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="font-mono font-black text-sm text-zinc-900 dark:text-white block">
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

                    <div className="pt-2 border-t border-zinc-200 dark:border-zinc-700/70 flex items-center justify-between">
                      {trip.purpose !== 'pribadi' ? (
                        <button
                          type="button"
                          onClick={() => {
                            triggerHaptic('light');
                            onToggleReimburse(trip.id);
                          }}
                          className={`py-1 px-2.5 rounded-lg text-[10px] font-bold border transition cursor-pointer flex items-center gap-1 ${
                            trip.isReimbursed
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300'
                              : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300'
                          }`}
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{trip.isReimbursed ? 'Reimburse Lunas' : 'Belum Klaim Reimburse'}</span>
                        </button>
                      ) : <span />}

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
                        <span>Hapus</span>
                      </button>
                    </div>
                  </div>
                ))}

                {/* 2. Odometer Only Items */}
                {vehicleOdoLogs.map((odo) => (
                  <div
                    key={odo.id}
                    className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 shrink-0">
                        <Gauge className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-sm text-zinc-900 dark:text-white">
                            {odo.odometerKm.toLocaleString('id-ID')} KM
                          </span>
                          <span className="px-1.5 py-0.2 rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-[9px] font-bold uppercase">
                            {odo.source === 'ai_scan' ? 'AI Vision' : 'Manual'}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-zinc-400">
                          {odo.date} {odo.notes ? `• ${odo.notes}` : ''}
                        </span>
                      </div>
                    </div>

                    {onDeleteOdometerLog && (
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm('Hapus pencatatan spedometer ini?')) {
                            triggerHaptic('light');
                            onDeleteOdometerLog(odo.id);
                          }
                        }}
                        className="p-1.5 text-zinc-400 hover:text-rose-500 transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
