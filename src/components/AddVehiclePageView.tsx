import React, { useState } from 'react';
import type { Vehicle, VehicleCategory, FuelType, SparePart } from '../types';
import { 
  ChevronLeft, 
  Sparkles, 
  Search, 
  Car, 
  Bike, 
  Truck, 
  Wrench, 
  Plus, 
  Trash2, 
  Check, 
  ArrowRight,
  HelpCircle,
  CheckCircle2,
  Sliders,
  Gauge,
  Fuel,
  Weight
} from 'lucide-react';

interface PresetVehicleSpec {
  name: string;
  year: number;
  category: VehicleCategory;
  fuelType: FuelType;
  tankCapacityLiters: number;
  maxCargoWeightKg?: number;
  notes: string;
  defaultParts: {
    name: string;
    intervalKm: number;
    costEstimate: number;
  }[];
}

const AI_KNOWLEDGE_BASE: Record<string, PresetVehicleSpec[]> = {
  vario: [
    {
      name: 'Honda Vario 125 eSP',
      year: 2015,
      category: 'motor',
      fuelType: 'Pertamax',
      tankCapacityLiters: 5.5,
      maxCargoWeightKg: 150,
      notes: 'Motor matic injeksi PGM-FI harian perkotaan',
      defaultParts: [
        { name: 'Oli Mesin AHM MPX2/SPX2 (0.8L)', intervalKm: 2000, costEstimate: 65000 },
        { name: 'V-Belt & Roller CVT Set', intervalKm: 24000, costEstimate: 195000 },
        { name: 'Oli Transmisi Gardan (120ml)', intervalKm: 6000, costEstimate: 20000 },
        { name: 'Busi Injeksi CPR9EA', intervalKm: 8000, costEstimate: 30000 },
        { name: 'Kampas Rem Depan Cakram', intervalKm: 12000, costEstimate: 75000 },
        { name: 'Saringan Filter Udara', intervalKm: 10000, costEstimate: 60000 },
      ],
    },
    {
      name: 'Honda Vario 150 eSP Exclusive',
      year: 2018,
      category: 'motor',
      fuelType: 'Pertamax',
      tankCapacityLiters: 5.5,
      maxCargoWeightKg: 150,
      notes: 'Motor matic 150cc Smart Key System',
      defaultParts: [
        { name: 'Oli Mesin AHM SPX2 Full Synthetic', intervalKm: 2500, costEstimate: 75000 },
        { name: 'V-Belt & Roller CVT 150cc', intervalKm: 24000, costEstimate: 215000 },
        { name: 'Oli Transmisi Gardan', intervalKm: 6000, costEstimate: 20000 },
        { name: 'Kampas Rem Depan & Belakang', intervalKm: 12000, costEstimate: 95000 },
      ],
    },
    {
      name: 'Honda Vario 160 ABS',
      year: 2022,
      category: 'motor',
      fuelType: 'Pertamax',
      tankCapacityLiters: 5.5,
      maxCargoWeightKg: 160,
      notes: 'Mesin eSP+ 4 katup dengan rem ABS',
      defaultParts: [
        { name: 'Oli Mesin SPX2 (0.8L)', intervalKm: 2500, costEstimate: 75000 },
        { name: 'V-Belt eSP+ 160cc', intervalKm: 24000, costEstimate: 235000 },
        { name: 'Oli Transmisi Gardan', intervalKm: 6000, costEstimate: 20000 },
        { name: 'Minyak Rem DOT 4 ABS', intervalKm: 20000, costEstimate: 45000 },
      ],
    },
    {
      name: 'Honda Vario 110 CW Karburator',
      year: 2010,
      category: 'motor',
      fuelType: 'Pertalite',
      tankCapacityLiters: 3.6,
      maxCargoWeightKg: 130,
      notes: 'Generasi awal Vario radiator mesin karburator',
      defaultParts: [
        { name: 'Oli Mesin MPX2 (0.8L)', intervalKm: 1500, costEstimate: 55000 },
        { name: 'Air Radiator Coolant', intervalKm: 10000, costEstimate: 35000 },
        { name: 'Busi Standar Denso', intervalKm: 6000, costEstimate: 25000 },
        { name: 'V-Belt & Roller Vario 110', intervalKm: 20000, costEstimate: 165000 },
      ],
    },
  ],
  gran: [
    {
      name: 'Daihatsu Gran Max Blind Van 1.3',
      year: 2021,
      category: 'truk',
      fuelType: 'Pertalite',
      tankCapacityLiters: 43,
      maxCargoWeightKg: 1000,
      notes: 'Kendaraan logistik tertutup kapasitas muatan 1 ton',
      defaultParts: [
        { name: 'Oli Mesin 10W-40 (3.5L)', intervalKm: 5000, costEstimate: 385000 },
        { name: 'Filter Oli Original Gran Max', intervalKm: 10000, costEstimate: 45000 },
        { name: 'Kampas Kopling (Clutch Disc)', intervalKm: 40000, costEstimate: 950000 },
        { name: 'Kampas Rem Depan & Belakang', intervalKm: 20000, costEstimate: 320000 },
        { name: 'Air Radiator Super Coolant', intervalKm: 20000, costEstimate: 95000 },
      ],
    },
    {
      name: 'Daihatsu Gran Max Pick Up 1.5 AC PS',
      year: 2022,
      category: 'truk',
      fuelType: 'Pertalite',
      tankCapacityLiters: 43,
      maxCargoWeightKg: 1200,
      notes: 'Pikap bak terbuka muatan kargo berat',
      defaultParts: [
        { name: 'Oli Mesin 10W-40 (3.5L)', intervalKm: 5000, costEstimate: 385000 },
        { name: 'Filter Udara & Busi', intervalKm: 10000, costEstimate: 180000 },
        { name: 'Oli Gardan & Transmisi Manual', intervalKm: 20000, costEstimate: 220000 },
        { name: 'Kampas Kopling Set', intervalKm: 40000, costEstimate: 980000 },
      ],
    },
  ],
  avanza: [
    {
      name: 'Toyota Avanza 1.3 G M/T',
      year: 2018,
      category: 'mobil',
      fuelType: 'Pertamax',
      tankCapacityLiters: 45,
      maxCargoWeightKg: 500,
      notes: 'Mobil operasional keluarga & kantor 7-seater',
      defaultParts: [
        { name: 'Oli Mesin TMO 5W-30 Synthetic (4L)', intervalKm: 10000, costEstimate: 450000 },
        { name: 'Filter Oli Toyota', intervalKm: 10000, costEstimate: 40000 },
        { name: 'Minyak Rem DOT 4', intervalKm: 20000, costEstimate: 85000 },
        { name: 'Filter Udara Mesin', intervalKm: 20000, costEstimate: 120000 },
        { name: 'Busi Iridium Toyota (4 pcs)', intervalKm: 40000, costEstimate: 360000 },
      ],
    },
  ],
  forklift: [
    {
      name: 'Toyota Forklift 3-Ton FD30 (Diesel)',
      year: 2020,
      category: 'forklift',
      fuelType: 'Bio Solar',
      tankCapacityLiters: 60,
      maxCargoWeightKg: 3000,
      notes: 'Alat berat material handling gudang & bongkar muat kontainer',
      defaultParts: [
        { name: 'Oli Mesin Diesel 15W-40 (6L)', intervalKm: 250, costEstimate: 450000 }, // in Hour Meter
        { name: 'Filter Oli Mesin Diesel', intervalKm: 500, costEstimate: 120000 },
        { name: 'Filter Solar / Bahan Bakar', intervalKm: 500, costEstimate: 150000 },
        { name: 'Oli Hidrolik Forklift (ISO 46)', intervalKm: 1000, costEstimate: 950000 },
      ],
    },
  ],
};

interface AddVehiclePageViewProps {
  onBack: () => void;
  onSaveVehicle: (newVehicle: Vehicle, initialParts: SparePart[]) => void;
}

export const AddVehiclePageView: React.FC<AddVehiclePageViewProps> = ({
  onBack,
  onSaveVehicle,
}) => {
  // Step 1 states: Search & AI suggestion
  const [searchQuery, setSearchQuery] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState<PresetVehicleSpec[]>([]);
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [hasSelectedModel, setHasSelectedModel] = useState(false);

  // Step 2 states: Editable form fields
  const [name, setName] = useState('');
  const [year, setYear] = useState(2020);
  const [plateNumber, setPlateNumber] = useState('');
  const [category, setCategory] = useState<VehicleCategory>('motor');
  const [fuelType, setFuelType] = useState<FuelType>('Pertamax');
  const [tankCapacityLiters, setTankCapacityLiters] = useState(5.0);
  const [maxCargoWeightKg, setMaxCargoWeightKg] = useState<number | undefined>(150);
  const [currentOdometerKm, setCurrentOdometerKm] = useState(15000);
  const [stnkExpiryDate, setStnkExpiryDate] = useState('2027-10-21');
  const [stnkFiveYearExpiryDate, setStnkFiveYearExpiryDate] = useState('2030-10-21');
  const [stnkNumber, setStnkNumber] = useState('');
  const [chassisNumber, setChassisNumber] = useState('');
  const [engineNumber, setEngineNumber] = useState('');
  const [notes, setNotes] = useState('');

  // Editable parts mapped by AI
  const [parts, setParts] = useState<{
    id: string;
    name: string;
    intervalKm: number;
    costEstimate: number;
  }[]>([]);

  // Real-time AI Query Analyzer
  const handleQueryChange = (val: string) => {
    setSearchQuery(val);
    setHasSelectedModel(false);

    if (!val.trim()) {
      setAiSuggestions([]);
      return;
    }

    setIsAiSearching(true);

    setTimeout(() => {
      setIsAiSearching(false);
      const q = val.toLowerCase();
      let matched: PresetVehicleSpec[] = [];

      for (const key of Object.keys(AI_KNOWLEDGE_BASE)) {
        if (q.includes(key) || key.includes(q)) {
          matched = [...matched, ...AI_KNOWLEDGE_BASE[key]];
        }
      }

      // If user typed something specific but not in default keys, create dynamic suggestion
      if (matched.length === 0 && val.length >= 3) {
        matched = [
          {
            name: val.trim(),
            year: 2021,
            category: q.includes('truk') || q.includes('box') ? 'truk' : q.includes('motor') ? 'motor' : 'mobil',
            fuelType: q.includes('diesel') || q.includes('solar') ? 'Bio Solar' : 'Pertamax',
            tankCapacityLiters: q.includes('motor') ? 4.5 : 45,
            maxCargoWeightKg: q.includes('motor') ? 150 : 800,
            notes: `Unit kustom teridentifikasi oleh AI: ${val}`,
            defaultParts: [
              { name: 'Oli Mesin Berkala', intervalKm: 3000, costEstimate: 85000 },
              { name: 'Pemeriksaan Sistem Rem & Busi', intervalKm: 8000, costEstimate: 120000 },
            ],
          },
        ];
      }

      setAiSuggestions(matched);
    }, 300);
  };

  // User chooses a model suggested by AI
  const handleSelectModel = (spec: PresetVehicleSpec) => {
    setName(spec.name);
    setYear(spec.year);
    setCategory(spec.category);
    setFuelType(spec.fuelType);
    setTankCapacityLiters(spec.tankCapacityLiters);
    setMaxCargoWeightKg(spec.maxCargoWeightKg);
    setNotes(spec.notes);

    // Map AI default parts
    setParts(
      spec.defaultParts.map((p, idx) => ({
        id: `p-${idx}-${Date.now()}`,
        name: p.name,
        intervalKm: p.intervalKm,
        costEstimate: p.costEstimate,
      }))
    );

    setHasSelectedModel(true);
  };

  // Parts management by user
  const handleDeletePart = (id: string) => {
    setParts(parts.filter((p) => p.id !== id));
  };

  const handleUpdatePart = (id: string, field: 'name' | 'intervalKm' | 'costEstimate', value: any) => {
    setParts(parts.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  };

  const handleAddCustomPart = () => {
    setParts([
      ...parts,
      {
        id: `custom-part-${Date.now()}`,
        name: 'Komponen Baru',
        intervalKm: 5000,
        costEstimate: 100000,
      },
    ]);
  };

  // Submit and save
  const handleFinalSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !plateNumber) {
      alert('Mohon isi Nomor Polisi kendaraan!');
      return;
    }

    const vehicleId = `veh-${Date.now()}`;

    const newVehicle: Vehicle = {
      id: vehicleId,
      name,
      year: Number(year),
      plateNumber: plateNumber.toUpperCase(),
      category,
      fuelType,
      tankCapacityLiters: Number(tankCapacityLiters),
      maxCargoWeightKg: maxCargoWeightKg ? Number(maxCargoWeightKg) : undefined,
      currentOdometerKm: Number(currentOdometerKm),
      healthScore: 100,
      stnkNumber: stnkNumber || undefined,
      chassisNumber: chassisNumber || undefined,
      engineNumber: engineNumber || undefined,
      stnkExpiryDate,
      stnkFiveYearExpiryDate,
      stnkTaxCostAnnual: category === 'motor' ? 285000 : 2200000,
      stnkTaxCostFiveYear: category === 'motor' ? 435000 : 2850000,
      notes,
    };

    const initialParts: SparePart[] = parts.map((p) => ({
      id: `sp-${Date.now()}-${Math.random()}`,
      vehicleId,
      name: p.name,
      recommendedIntervalKm: Number(p.intervalKm),
      lastReplacedOdometerKm: Number(currentOdometerKm),
      estimatedLifeRemainingPct: 100,
      status: 'optimal',
      replacementCostEstimate: Number(p.costEstimate),
    }));

    onSaveVehicle(newVehicle, initialParts);
  };

  return (
    <div className="space-y-6 pb-24 md:pb-8 pt-1 animate-fade-in text-zinc-900 max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 py-2 px-3 rounded-2xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-bold transition cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Batal & Kembali</span>
        </button>

        <h2 className="text-sm md:text-base font-black uppercase tracking-wider text-zinc-900 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-yellow-500 fill-yellow-400" />
          <span>Tambah Unit Armada (AI Assisted)</span>
        </h2>
      </div>

      {/* ======================================================== */}
      {/* STEP 1: INITIAL SEARCH / PROMPT BAR                      */}
      {/* ======================================================== */}
      <div className="bg-white border-2 border-zinc-900 rounded-3xl p-5 shadow-sm space-y-3">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block">
            Langkah 1: Identifikasi Kendaraan
          </span>
          <h3 className="text-sm font-black text-zinc-900 mt-0.5">
            Ketik nama atau model kendaraan Anda
          </h3>
          <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">
            AI akan menganalisa spesifikasi, tangki, dan memetakan suku cadang bawaan pabrik secara otomatis.
          </p>
        </div>

        {/* Big Search Input */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
            <Search className="w-5 h-5 text-yellow-600" />
          </div>
          <input
            type="text"
            placeholder="Ketik 'Vario', 'Gran Max', 'Avanza', atau 'Forklift'..."
            value={searchQuery}
            onChange={(e) => handleQueryChange(e.target.value)}
            className="w-full pl-11 pr-4 py-3.5 bg-zinc-50 border-2 border-zinc-300 focus:border-zinc-900 rounded-2xl text-xs text-zinc-900 font-bold placeholder-zinc-400 focus:outline-none transition shadow-xs"
          />
        </div>

        {/* AI Suggestions / Recommendations when ambiguous */}
        {aiSuggestions.length > 0 && !hasSelectedModel && (
          <div className="pt-2 border-t border-zinc-100 space-y-2 animate-fade-in">
            <div className="flex items-center justify-between text-xs text-zinc-600 font-bold px-1">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-yellow-500" />
                <span>AI Menemukan Beberapa Model. Pilih yang sesuai:</span>
              </span>
              <span className="text-[10px] text-zinc-400 font-mono">
                {aiSuggestions.length} Opsi
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {aiSuggestions.map((spec, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSelectModel(spec)}
                  className="p-3.5 bg-zinc-50 hover:bg-yellow-50/70 border-2 border-zinc-200 hover:border-yellow-400 rounded-2xl transition cursor-pointer flex items-center justify-between group active:scale-98"
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-xs text-zinc-900 group-hover:text-black truncate">
                        {spec.name} ({spec.year})
                      </h4>
                      <span className="text-[9px] px-2 py-0.2 bg-zinc-200 group-hover:bg-yellow-200 text-zinc-800 font-bold rounded-full uppercase shrink-0">
                        {spec.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-500 mt-0.5 line-clamp-1">{spec.notes}</p>
                    <span className="text-[10px] font-mono text-zinc-400 mt-0.5 block truncate">
                      Tangki: {spec.tankCapacityLiters}L • {spec.fuelType} • {spec.defaultParts.length} Komponen
                    </span>
                  </div>

                  <div className="p-2 rounded-xl bg-white group-hover:bg-yellow-400 text-zinc-900 transition-colors shadow-xs shrink-0">
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* STEP 2: EXPANDED EDITABLE FORM (AFTER MODEL SELECTED)    */}
      {/* ======================================================== */}
      {hasSelectedModel && (
        <form onSubmit={handleFinalSave} className="space-y-4 animate-fade-in">
          {/* AI Success Banner */}
          <div className="p-3.5 bg-yellow-50 border border-yellow-300 rounded-3xl flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-yellow-700 shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-bold text-zinc-900 block">
                Model Teridentifikasi: {name}
              </span>
              <p className="text-[11px] text-zinc-600 mt-0.5">
                Spesifikasi dasar dan suku cadang pabrik telah dimuat. Anda bebas mengubah data di bawah sebelum menyimpannya ke garasi.
              </p>
            </div>
          </div>

          {/* Responsive 2-Column Grid on Desktop */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Section 1: Informasi Dasar Kendaraan */}
            <div className="lg:col-span-6 bg-white border-2 border-zinc-200 rounded-3xl p-5 shadow-sm space-y-4">
              <h4 className="font-black text-xs uppercase tracking-wider text-zinc-900 flex items-center gap-1.5 pb-2 border-b border-zinc-100">
                <Car className="w-4 h-4 text-zinc-800" />
                <span>1. Informasi Dasar & Legalitas</span>
              </h4>

              <div className="space-y-3.5 text-xs">
                {/* Merk & Model & Tahun */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <label className="block font-bold text-zinc-700 mb-1">Merk & Model</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-zinc-900 font-bold focus:outline-none focus:border-zinc-900"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-zinc-700 mb-1">Tahun</label>
                    <input
                      type="number"
                      value={year}
                      onChange={(e) => setYear(Number(e.target.value))}
                      className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-zinc-900 font-mono focus:outline-none focus:border-zinc-900"
                    />
                  </div>
                </div>

                {/* Plat Nomor & Odometer Awal */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-zinc-900 mb-1">
                      Nomor Polisi <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: B 3829 KLG"
                      value={plateNumber}
                      onChange={(e) => setPlateNumber(e.target.value)}
                      className="w-full px-3 py-2.5 bg-yellow-50/50 border-2 border-yellow-400 rounded-xl text-zinc-900 font-mono font-black uppercase tracking-wider focus:outline-none focus:border-zinc-900"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-zinc-700 mb-1">Odometer Terkini (KM)</label>
                    <input
                      type="number"
                      value={currentOdometerKm}
                      onChange={(e) => setCurrentOdometerKm(Number(e.target.value))}
                      className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-zinc-900 font-mono focus:outline-none focus:border-zinc-900"
                      required
                    />
                  </div>
                </div>

                {/* Kategori & Bahan Bakar */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-zinc-700 mb-1">Kategori Kendaraan</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as any)}
                      className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-zinc-900 font-medium focus:outline-none focus:border-zinc-900"
                    >
                      <option value="motor">Motor</option>
                      <option value="mobil">Mobil</option>
                      <option value="truk">Truk / Logistik</option>
                      <option value="forklift">Forklift / Alat Berat</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-zinc-700 mb-1">Tipe Bahan Bakar</label>
                    <select
                      value={fuelType}
                      onChange={(e) => setFuelType(e.target.value as any)}
                      className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-zinc-900 font-medium focus:outline-none focus:border-zinc-900"
                    >
                      <option value="Pertalite">Pertalite</option>
                      <option value="Pertamax">Pertamax</option>
                      <option value="Pertamax Turbo">Pertamax Turbo</option>
                      <option value="Bio Solar">Bio Solar</option>
                      <option value="Dexlite">Dexlite</option>
                      <option value="Listrik">Listrik (EV)</option>
                    </select>
                  </div>
                </div>

                {/* Kapasitas Tangki & Max Beban */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-zinc-700 mb-1">Kapasitas Tangki (Liter)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={tankCapacityLiters}
                      onChange={(e) => setTankCapacityLiters(Number(e.target.value))}
                      className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-zinc-900 font-mono focus:outline-none focus:border-zinc-900"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-zinc-700 mb-1">Max Muatan Kargo (KG)</label>
                    <input
                      type="number"
                      value={maxCargoWeightKg || ''}
                      onChange={(e) => setMaxCargoWeightKg(Number(e.target.value))}
                      className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-zinc-900 font-mono focus:outline-none focus:border-zinc-900"
                    />
                  </div>
                </div>

                {/* Legalitas: Pajak Tahunan & 5 Tahunan */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-zinc-700 mb-1">Jatuh Tempo Pajak Tahunan</label>
                    <input
                      type="date"
                      value={stnkExpiryDate}
                      onChange={(e) => setStnkExpiryDate(e.target.value)}
                      className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-zinc-900 font-mono focus:outline-none focus:border-zinc-900"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-zinc-700 mb-1">Jatuh Tempo 5 Tahun (Plat)</label>
                    <input
                      type="date"
                      value={stnkFiveYearExpiryDate}
                      onChange={(e) => setStnkFiveYearExpiryDate(e.target.value)}
                      className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-zinc-900 font-mono focus:outline-none focus:border-zinc-900"
                    />
                  </div>
                </div>

                {/* No STNK & Rangka (Opsional) */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-zinc-700 mb-1">No. STNK (Opsional)</label>
                    <input
                      type="text"
                      placeholder="Contoh: 08392104-JKT"
                      value={stnkNumber}
                      onChange={(e) => setStnkNumber(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-xl text-zinc-900 font-mono text-[11px] focus:outline-none focus:border-zinc-900"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-zinc-700 mb-1">No. Rangka / VIN (Opsional)</label>
                    <input
                      type="text"
                      placeholder="MH1JF31..."
                      value={chassisNumber}
                      onChange={(e) => setChassisNumber(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-xl text-zinc-900 font-mono text-[11px] focus:outline-none focus:border-zinc-900"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Pemetaan Sparepart oleh AI (Bisa Diedit / Dikelola) */}
            <div className="lg:col-span-6 bg-white border-2 border-zinc-200 rounded-3xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
                <div>
                  <h4 className="font-black text-xs uppercase tracking-wider text-zinc-900 flex items-center gap-1.5">
                    <Wrench className="w-4 h-4 text-yellow-600" />
                    <span>2. Suku Cadang yang Dipetakan AI ({parts.length})</span>
                  </h4>
                  <p className="text-[11px] text-zinc-500">
                    Ubah interval KM atau estimasi biaya penggantian.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleAddCustomPart}
                  className="flex items-center gap-1 py-1.5 px-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-[11px] font-bold rounded-xl transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-zinc-900" />
                  <span>Tambah Komponen</span>
                </button>
              </div>

              {/* List Editable Parts */}
              <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
                {parts.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 bg-zinc-50 border border-zinc-200 rounded-2xl space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        value={p.name}
                        onChange={(e) => handleUpdatePart(p.id, 'name', e.target.value)}
                        className="flex-1 font-bold text-zinc-900 bg-white border border-zinc-200 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-zinc-900"
                      />
                      <button
                        type="button"
                        onClick={() => handleDeletePart(p.id)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 transition cursor-pointer"
                        title="Hapus komponen ini"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-zinc-500 block mb-0.5">Interval Ganti (KM)</span>
                        <input
                          type="number"
                          value={p.intervalKm}
                          onChange={(e) => handleUpdatePart(p.id, 'intervalKm', Number(e.target.value))}
                          className="w-full bg-white border border-zinc-200 rounded-lg px-2 py-1 font-mono font-bold text-zinc-800 focus:outline-none focus:border-zinc-900"
                        />
                      </div>
                      <div>
                        <span className="text-zinc-500 block mb-0.5">Estimasi Biaya (Rp)</span>
                        <input
                          type="number"
                          value={p.costEstimate}
                          onChange={(e) => handleUpdatePart(p.id, 'costEstimate', Number(e.target.value))}
                          className="w-full bg-white border border-zinc-200 rounded-lg px-2 py-1 font-mono font-bold text-zinc-800 focus:outline-none focus:border-zinc-900"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* FINAL SUBMIT BUTTON */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-4 bg-yellow-400 hover:bg-yellow-300 text-zinc-950 font-black uppercase tracking-wider text-xs rounded-2xl transition shadow-md shadow-yellow-400/20 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Check className="w-5 h-5 stroke-[3]" />
              <span>Simpan Kendaraan & Komponen ke Garasi</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
