export const APP_VERSION = '1.0.0';

export type VehicleCategory = 'motor' | 'mobil' | 'truk' | 'forklift';
export type FuelType = 'Pertalite' | 'Pertamax' | 'Pertamax Turbo' | 'Bio Solar' | 'Dexlite' | 'Listrik';

export interface TaxPaymentRecord {
  id: string;
  vehicleId: string;
  paymentDate: string; // YYYY-MM-DD
  taxType: 'tahunan' | 'lima_tahunan'; // Pajak Tahunan (PKB) vs Pajak 5 Tahunan (Ganti Kaleng/Plat)
  cost: number;
  stnkValidationNumber?: string;
  notes?: string;
}

export interface Vehicle {
  id: string;
  name: string; // e.g. "Honda Vario 125 eSP"
  year: number; // e.g. 2015
  plateNumber: string; // e.g. "B 3829 KLG"
  category: VehicleCategory;
  fuelType: FuelType;
  tankCapacityLiters: number; // e.g. 5.5
  maxCargoWeightKg?: number; // e.g. 150 for motor, 1000 for Gran Max
  currentOdometerKm: number; // e.g. 42350
  healthScore: number; // 0-100%
  stnkNumber?: string; // No. STNK
  chassisNumber?: string; // No. Rangka
  engineNumber?: string; // No. Mesin
  stnkExpiryDate: string; // Tanggal jatuh tempo pajak tahunan (YYYY-MM-DD)
  stnkFiveYearExpiryDate: string; // Tanggal jatuh tempo pajak 5 tahunan / Ganti Plat Kaleng (YYYY-MM-DD)
  stnkTaxCostAnnual: number; // Estimasi biaya PKB tahunan
  stnkTaxCostFiveYear: number; // Estimasi biaya ganti kaleng (PKB + TNKB + STNK + SWDKLLJ)
  taxPaymentHistory?: TaxPaymentRecord[]; // Riwayat pembayaran pajak
  notes?: string;
}

export interface FuelLog {
  id: string;
  vehicleId: string;
  date: string;
  fuelType: FuelType;
  liters: number;
  totalCost: number;
  odometerKm: number;
  stationName: string; // e.g. "SPBU Pertamina 31.124"
  gpsLocation?: {
    latitude: number;
    longitude: number;
    addressDescription?: string;
  };
  efficiencyKmPerLiter?: number;
  fullTank: boolean;
}

export interface SparePart {
  id: string;
  name: string; // e.g. "Oli Mesin", "Kampas Rem Depan", "V-Belt"
  vehicleId: string;
  recommendedIntervalKm: number; // e.g. 2500 for oil
  lastReplacedOdometerKm: number; // e.g. 40500
  estimatedLifeRemainingPct: number; // 0-100%
  status: 'optimal' | 'warning' | 'critical';
  urgencyDays?: number;
  replacementCostEstimate?: number;
}

export interface ServiceItemDetail {
  name: string;
  category: 'sparepart' | 'jasa' | 'darurat';
  cost: number;
}

export interface ServiceRecord {
  id: string;
  vehicleId: string;
  date: string;
  odometerKm: number;
  type: 'routine' | 'unexpected'; // Servis berkala vs Biaya tak terduga (ban bocor, rantai)
  title: string; // e.g. "Ganti Oli Mesin + Busi" or "Tambal Ban Tubeless Kiri Belakang"
  workshopName: string; // e.g. "AHASS Motorindo"
  cost: number; // Grand total biaya
  notes?: string;
  replacedParts?: string[];
  itemizedDetails?: ServiceItemDetail[]; // Rincian per bagian yang diservis & biayanya
}
