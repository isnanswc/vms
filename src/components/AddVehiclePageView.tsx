import React, { useState } from 'react';
import type { Vehicle, VehicleCategory, FuelType, SparePart } from '../types';
import type { AiSettings } from '../types/chat';
import { 
  ChevronLeft, 
  Sparkles, 
  Search, 
  Wrench, 
  Plus, 
  Trash2, 
  Check, 
  ArrowRight,
  CheckCircle2,
  RefreshCw,
  Cpu,
  Layers
} from 'lucide-react';
import { analyzeVehicleWithAI } from '../utils/geminiApi';

interface PresetVehicleSpec {
  name: string;
  year: number;
  category: VehicleCategory;
  fuelType: FuelType;
  tankCapacityLiters: number;
  maxCargoWeightKg?: number;
  notes: string;
  stnkTaxCostAnnual?: number;
  stnkTaxCostFiveYear?: number;
  defaultParts: {
    name: string;
    intervalKm: number;
    costEstimate: number;
  }[];
}

// Comprehensive Indonesian Vehicle Database (with full 8-12 OEM spare parts each)
const EXTENDED_VEHICLE_CATALOG: Record<string, PresetVehicleSpec[]> = {
  // HONDA MOTOR
  beat: [
    {
      name: 'Honda Beat eSP / Deluxe',
      year: 2023,
      category: 'motor',
      fuelType: 'Pertamax',
      tankCapacityLiters: 4.2,
      maxCargoWeightKg: 130,
      notes: 'Matic 110cc eSP eSAF harian paling populer di Indonesia',
      stnkTaxCostAnnual: 245000,
      stnkTaxCostFiveYear: 420000,
      defaultParts: [
        { name: 'Oli Mesin AHM MPX2 0.8L (SAE 10W-30)', intervalKm: 2000, costEstimate: 62000 },
        { name: 'Oli Transmisi Gardan 120ml', intervalKm: 6000, costEstimate: 18000 },
        { name: 'Busi Resistor NGK MR9C-9N', intervalKm: 8000, costEstimate: 35000 },
        { name: 'Saringan Udara (Viscous Air Filter)', intervalKm: 10000, costEstimate: 65000 },
        { name: 'Kampas Rem Depan Cakram OEM', intervalKm: 12000, costEstimate: 70000 },
        { name: 'Kampas Rem Belakang Tromol', intervalKm: 15000, costEstimate: 60000 },
        { name: 'V-Belt & Roller CVT Beat Set', intervalKm: 24000, costEstimate: 185000 },
        { name: 'Minyak Rem DOT 4 Honda', intervalKm: 20000, costEstimate: 35000 },
        { name: 'Aki Kering GTZ5S / MTZ5S', intervalKm: 30000, costEstimate: 240000 },
        { name: 'Ban Luar Tubeless Depan 80/90-14', intervalKm: 20000, costEstimate: 220000 },
        { name: 'Ban Luar Tubeless Belakang 90/90-14', intervalKm: 18000, costEstimate: 265000 },
      ],
    },
  ],
  vario: [
    {
      name: 'Honda Vario 125 CBS ISS',
      year: 2022,
      category: 'motor',
      fuelType: 'Pertamax',
      tankCapacityLiters: 5.5,
      maxCargoWeightKg: 150,
      notes: 'Motor matic 125cc eSP radiator liquid cooled serbaguna',
      stnkTaxCostAnnual: 290000,
      stnkTaxCostFiveYear: 480000,
      defaultParts: [
        { name: 'Oli Mesin AHM SPX2 Full Synthetic 0.8L', intervalKm: 2500, costEstimate: 72000 },
        { name: 'Oli Transmisi Gardan 120ml', intervalKm: 6000, costEstimate: 20000 },
        { name: 'Busi Injeksi CPR9EA-9', intervalKm: 8000, costEstimate: 35000 },
        { name: 'Filter Udara Basah OEM Honda', intervalKm: 10000, costEstimate: 65000 },
        { name: 'Kampas Rem Depan Cakram Nissin', intervalKm: 12000, costEstimate: 80000 },
        { name: 'Kampas Rem Belakang Tromol', intervalKm: 15000, costEstimate: 65000 },
        { name: 'V-Belt & Roller CVT 125cc Set', intervalKm: 24000, costEstimate: 195000 },
        { name: 'Air Radiator Coolant Pre-mix', intervalKm: 12000, costEstimate: 40000 },
        { name: 'Minyak Rem Depan DOT 4', intervalKm: 20000, costEstimate: 35000 },
        { name: 'Aki Kering 12V 5Ah GTZ6V', intervalKm: 30000, costEstimate: 280000 },
        { name: 'Ban Luar Tubeless Depan 90/80-14', intervalKm: 20000, costEstimate: 250000 },
        { name: 'Ban Luar Tubeless Belakang 100/80-14', intervalKm: 18000, costEstimate: 310000 },
      ],
    },
    {
      name: 'Honda Vario 160 ABS',
      year: 2023,
      category: 'motor',
      fuelType: 'Pertamax',
      tankCapacityLiters: 5.5,
      maxCargoWeightKg: 160,
      notes: 'Mesin eSP+ 4-Valve 160cc dengan rem cakram ganda ABS',
      stnkTaxCostAnnual: 340000,
      stnkTaxCostFiveYear: 530000,
      defaultParts: [
        { name: 'Oli Mesin SPX2 0.8L (10W-30)', intervalKm: 2500, costEstimate: 75000 },
        { name: 'Oli Transmisi Gardan 120ml', intervalKm: 6000, costEstimate: 20000 },
        { name: 'V-Belt eSP+ 160 4-Valve & Roller', intervalKm: 24000, costEstimate: 235000 },
        { name: 'Busi Laser Iridium CPR9EA', intervalKm: 10000, costEstimate: 55000 },
        { name: 'Kampas Rem Depan ABS OEM', intervalKm: 12000, costEstimate: 95000 },
        { name: 'Kampas Rem Belakang Cakram', intervalKm: 12000, costEstimate: 85000 },
        { name: 'Filter Udara eSP+ 160', intervalKm: 12000, costEstimate: 75000 },
        { name: 'Radiator Coolant Honda Pro', intervalKm: 15000, costEstimate: 45000 },
        { name: 'Minyak Rem ABS DOT 4', intervalKm: 20000, costEstimate: 45000 },
        { name: 'Aki Kering Maintenance Free 6Ah', intervalKm: 30000, costEstimate: 310000 },
      ],
    },
  ],
  scoopy: [
    {
      name: 'Honda Scoopy Prestige / Stylish',
      year: 2022,
      category: 'motor',
      fuelType: 'Pertamax',
      tankCapacityLiters: 4.2,
      maxCargoWeightKg: 130,
      notes: 'Skutik retro modern 110cc velg 12 inci Smart Key',
      stnkTaxCostAnnual: 255000,
      stnkTaxCostFiveYear: 430000,
      defaultParts: [
        { name: 'Oli Mesin MPX2 0.8L', intervalKm: 2000, costEstimate: 62000 },
        { name: 'Oli Gardan 120ml', intervalKm: 6000, costEstimate: 18000 },
        { name: 'Busi NGK MR9C-9N', intervalKm: 8000, costEstimate: 35000 },
        { name: 'Filter Udara Scoopy', intervalKm: 10000, costEstimate: 65000 },
        { name: 'Kampas Rem Depan Cakram', intervalKm: 12000, costEstimate: 70000 },
        { name: 'Kampas Rem Belakang', intervalKm: 15000, costEstimate: 60000 },
        { name: 'V-Belt & Roller CVT Set', intervalKm: 24000, costEstimate: 190000 },
        { name: 'Ban Tubeless Depan 100/90-12', intervalKm: 20000, costEstimate: 260000 },
        { name: 'Ban Tubeless Belakang 110/90-12', intervalKm: 18000, costEstimate: 310000 },
      ],
    },
  ],
  pcx: [
    {
      name: 'Honda PCX 160 ABS',
      year: 2023,
      category: 'motor',
      fuelType: 'Pertamax',
      tankCapacityLiters: 8.1,
      maxCargoWeightKg: 170,
      notes: 'Maxi scooter premium touring 160cc eSP+ 4 katup HSTC',
      stnkTaxCostAnnual: 420000,
      stnkTaxCostFiveYear: 620000,
      defaultParts: [
        { name: 'Oli Mesin SPX2 Full Synthetic 0.8L', intervalKm: 3000, costEstimate: 75000 },
        { name: 'Oli Transmisi Gardan', intervalKm: 6000, costEstimate: 20000 },
        { name: 'V-Belt eSP+ & Slider Roller Set', intervalKm: 24000, costEstimate: 245000 },
        { name: 'Busi Honda NGK Laser Iridium', intervalKm: 12000, costEstimate: 65000 },
        { name: 'Kampas Rem Depan ABS', intervalKm: 12000, costEstimate: 95000 },
        { name: 'Kampas Rem Belakang Cakram', intervalKm: 12000, costEstimate: 85000 },
        { name: 'Air Radiator Coolant', intervalKm: 15000, costEstimate: 45000 },
        { name: 'Filter Udara PCX 160', intervalKm: 12000, costEstimate: 85000 },
        { name: 'Ban Luar Depan 110/70-14', intervalKm: 22000, costEstimate: 380000 },
        { name: 'Ban Luar Belakang 130/70-13', intervalKm: 20000, costEstimate: 460000 },
      ],
    },
  ],
  // YAMAHA MOTOR
  nmax: [
    {
      name: 'Yamaha All New NMAX 155 Connected',
      year: 2022,
      category: 'motor',
      fuelType: 'Pertamax',
      tankCapacityLiters: 7.1,
      maxCargoWeightKg: 165,
      notes: 'Maxi scooter 155cc VVA Liquid Cooled Smart Motor Generator',
      stnkTaxCostAnnual: 410000,
      stnkTaxCostFiveYear: 610000,
      defaultParts: [
        { name: 'Oli Mesin Yamalube Super Matic 1.0L (10W-40)', intervalKm: 2500, costEstimate: 78000 },
        { name: 'Oli Gardan Yamalube Gear Motor 150ml', intervalKm: 6000, costEstimate: 22000 },
        { name: 'Busi NGK CPR8EA-9', intervalKm: 8000, costEstimate: 35000 },
        { name: 'Saringan Udara Air Filter Element', intervalKm: 10000, costEstimate: 65000 },
        { name: 'V-Belt & Roller CVT NMAX 155 Set', intervalKm: 24000, costEstimate: 215000 },
        { name: 'Kampas Rem Depan Cakram OEM', intervalKm: 12000, costEstimate: 85000 },
        { name: 'Kampas Rem Belakang Cakram', intervalKm: 12000, costEstimate: 85000 },
        { name: 'Cairan Radiator Coolant Yamacoolant', intervalKm: 12000, costEstimate: 45000 },
        { name: 'Minyak Rem DOT 4 Yamalube', intervalKm: 20000, costEstimate: 35000 },
        { name: 'Aki Kering Yuasa YTZ7V 12V 6.3Ah', intervalKm: 30000, costEstimate: 340000 },
        { name: 'Ban Luar Tubeless Depan 110/70-13', intervalKm: 20000, costEstimate: 375000 },
        { name: 'Ban Luar Tubeless Belakang 130/70-13', intervalKm: 18000, costEstimate: 450000 },
      ],
    },
  ],
  aerox: [
    {
      name: 'Yamaha All New Aerox 155 Connected',
      year: 2022,
      category: 'motor',
      fuelType: 'Pertamax',
      tankCapacityLiters: 5.5,
      maxCargoWeightKg: 160,
      notes: 'Super Sport Scooter 155cc Blue Core VVA desain agresif',
      stnkTaxCostAnnual: 385000,
      stnkTaxCostFiveYear: 580000,
      defaultParts: [
        { name: 'Oli Mesin Yamalube Super Matic 1.0L', intervalKm: 2500, costEstimate: 78000 },
        { name: 'Oli Gardan Yamalube 150ml', intervalKm: 6000, costEstimate: 22000 },
        { name: 'V-Belt & Roller CVT Aerox Set', intervalKm: 24000, costEstimate: 220000 },
        { name: 'Busi Resistor NGK CPR8EA', intervalKm: 8000, costEstimate: 35000 },
        { name: 'Kampas Rem Depan Cakram', intervalKm: 12000, costEstimate: 85000 },
        { name: 'Kampas Rem Belakang Tromol', intervalKm: 15000, costEstimate: 65000 },
        { name: 'Filter Udara Element Basah', intervalKm: 10000, costEstimate: 65000 },
        { name: 'Air Radiator Yamacoolant', intervalKm: 12000, costEstimate: 45000 },
        { name: 'Ban Tubeless Depan 110/80-14', intervalKm: 20000, costEstimate: 390000 },
        { name: 'Ban Tubeless Belakang 140/70-14', intervalKm: 18000, costEstimate: 480000 },
      ],
    },
  ],
  // TOYOTA MOBIL
  avanza: [
    {
      name: 'Toyota All New Avanza 1.5 G CVT',
      year: 2022,
      category: 'mobil',
      fuelType: 'Pertamax',
      tankCapacityLiters: 43,
      maxCargoWeightKg: 650,
      notes: 'MPV sejuta umat 1.5L Dual VVT-i 2NR-VE transmisi D-CVT FWD',
      stnkTaxCostAnnual: 2750000,
      stnkTaxCostFiveYear: 3450000,
      defaultParts: [
        { name: 'Oli Mesin TMO Full Synthetic 0W-20 (3.5L)', intervalKm: 5000, costEstimate: 390000 },
        { name: 'Filter Oli Mesin Toyota OEM', intervalKm: 5000, costEstimate: 55000 },
        { name: 'Filter Udara Mesin 2NR-VE', intervalKm: 15000, costEstimate: 140000 },
        { name: 'Filter AC Kabin Karbon', intervalKm: 10000, costEstimate: 95000 },
        { name: 'Busi Iridium Twin Tip (4 pcs)', intervalKm: 40000, costEstimate: 380000 },
        { name: 'Kampas Rem Depan (Brake Pad) OEM', intervalKm: 25000, costEstimate: 450000 },
        { name: 'Kampas Rem Belakang (Brake Shoe)', intervalKm: 40000, costEstimate: 350000 },
        { name: 'Oli Transmisi CVT Fluid FE (4L)', intervalKm: 40000, costEstimate: 460000 },
        { name: 'Minyak Rem Toyota DOT 3', intervalKm: 20000, costEstimate: 80000 },
        { name: 'Radiator Coolant Super Long Life', intervalKm: 40000, costEstimate: 160000 },
        { name: 'Aki Kering 12V 35Ah (NS40ZL)', intervalKm: 35000, costEstimate: 850000 },
        { name: 'Ban Luar 195/60 R16 Bridgestone/Dunlop', intervalKm: 40000, costEstimate: 780000 },
      ],
    },
  ],
  innova: [
    {
      name: 'Toyota Kijang Innova Reborn 2.4 G Diesel',
      year: 2021,
      category: 'mobil',
      fuelType: 'Bio Solar',
      tankCapacityLiters: 55,
      maxCargoWeightKg: 850,
      notes: 'MPV Diesel 2.4L 2GD-FTV Variable Nozzle Turbo Intercooler',
      stnkTaxCostAnnual: 4200000,
      stnkTaxCostFiveYear: 5100000,
      defaultParts: [
        { name: 'Oli Mesin Diesel TMO 5W-30 ACEA C2 (7.5L)', intervalKm: 5000, costEstimate: 780000 },
        { name: 'Filter Oli Mesin Diesel 2GD', intervalKm: 5000, costEstimate: 85000 },
        { name: 'Filter Solar / Bahan Bakar OEM', intervalKm: 10000, costEstimate: 195000 },
        { name: 'Filter Udara Mesin Reborn Diesel', intervalKm: 15000, costEstimate: 180000 },
        { name: 'Filter AC Kabin Double Blower', intervalKm: 10000, costEstimate: 110000 },
        { name: 'Kampas Rem Depan Akebono OEM', intervalKm: 25000, costEstimate: 580000 },
        { name: 'Kampas Rem Belakang Tromol', intervalKm: 40000, costEstimate: 420000 },
        { name: 'Oli Gardan Diferensial SAE 90 GL-5 (2.5L)', intervalKm: 20000, costEstimate: 220000 },
        { name: 'Oli Transmisi Otomatis ATF WS (4L)', intervalKm: 40000, costEstimate: 480000 },
        { name: 'Radiator Coolant Toyota Pink', intervalKm: 40000, costEstimate: 180000 },
        { name: 'Aki Kering Heavy Duty 80Ah (31-1000)', intervalKm: 35000, costEstimate: 1350000 },
        { name: 'Ban Luar 205/65 R16 Dunlop Enasave', intervalKm: 40000, costEstimate: 890000 },
      ],
    },
  ],
  // DAIHATSU & LOGISTIK
  'gran max': [
    {
      name: 'Daihatsu Gran Max Pick Up 1.5 AC PS',
      year: 2021,
      category: 'mobil',
      fuelType: 'Pertalite',
      tankCapacityLiters: 43,
      maxCargoWeightKg: 1000,
      notes: 'Mobil pick up angkutan barang kargo niaga mesin 1.5L 2NR-VE',
      stnkTaxCostAnnual: 1850000,
      stnkTaxCostFiveYear: 2450000,
      defaultParts: [
        { name: 'Oli Mesin Daihatsu Genuine Oil 10W-40 (3.5L)', intervalKm: 5000, costEstimate: 280000 },
        { name: 'Filter Oli Mesin Gran Max', intervalKm: 5000, costEstimate: 45000 },
        { name: 'Filter Udara Mesin', intervalKm: 15000, costEstimate: 95000 },
        { name: 'Busi Standard Denso K20PR-U (4 pcs)', intervalKm: 15000, costEstimate: 120000 },
        { name: 'Kampas Rem Depan Cakram Niaga', intervalKm: 20000, costEstimate: 280000 },
        { name: 'Kampas Rem Belakang Tromol Heavy Load', intervalKm: 30000, costEstimate: 260000 },
        { name: 'Oli Gardan SAE 90 (2L)', intervalKm: 20000, costEstimate: 140000 },
        { name: 'Oli Transmisi Manual 75W-90 (2L)', intervalKm: 20000, costEstimate: 150000 },
        { name: 'Plat Kopling & Dekrup Clutch Set', intervalKm: 40000, costEstimate: 850000 },
        { name: 'Air Radiator Coolant', intervalKm: 30000, costEstimate: 95000 },
        { name: 'Ban Niaga 8 PR 175 R13C Kargo', intervalKm: 35000, costEstimate: 620000 },
      ],
    },
    {
      name: 'Daihatsu Gran Max Blind Van 1.3',
      year: 2020,
      category: 'mobil',
      fuelType: 'Pertalite',
      tankCapacityLiters: 43,
      maxCargoWeightKg: 800,
      notes: 'Mobil van kargo tertutup ekspedisi logistik paket dalam kota',
      stnkTaxCostAnnual: 1750000,
      stnkTaxCostFiveYear: 2350000,
      defaultParts: [
        { name: 'Oli Mesin 10W-40 (3L)', intervalKm: 5000, costEstimate: 260000 },
        { name: 'Filter Oli Mesin', intervalKm: 5000, costEstimate: 45000 },
        { name: 'Filter Udara', intervalKm: 15000, costEstimate: 95000 },
        { name: 'Busi Denso K20PR-U', intervalKm: 15000, costEstimate: 120000 },
        { name: 'Kampas Rem Depan', intervalKm: 20000, costEstimate: 280000 },
        { name: 'Kampas Rem Belakang', intervalKm: 30000, costEstimate: 250000 },
        { name: 'Oli Gardan & Transmisi Manual', intervalKm: 20000, costEstimate: 280000 },
        { name: 'Ban Kargo 165 R13 8PR', intervalKm: 35000, costEstimate: 590000 },
      ],
    },
  ],
  // MITSUBISHI NIAGA
  l300: [
    {
      name: 'Mitsubishi Colt L300 Euro 4 Pick Up',
      year: 2023,
      category: 'mobil',
      fuelType: 'Bio Solar',
      tankCapacityLiters: 47,
      maxCargoWeightKg: 1200,
      notes: 'Legenda niaga Indonesia mesin 2.2L 4N14 Common Rail Turbo Intercooler',
      stnkTaxCostAnnual: 2150000,
      stnkTaxCostFiveYear: 2850000,
      defaultParts: [
        { name: 'Oli Mesin Diesel CF-4 15W-40 (6L)', intervalKm: 5000, costEstimate: 420000 },
        { name: 'Filter Oli Mesin L300 Euro 4', intervalKm: 5000, costEstimate: 75000 },
        { name: 'Filter Solar Bahan Bakar Common Rail', intervalKm: 10000, costEstimate: 165000 },
        { name: 'Filter Udara Tabung Heavy Duty', intervalKm: 15000, costEstimate: 135000 },
        { name: 'Kampas Rem Depan Cakram L300', intervalKm: 20000, costEstimate: 320000 },
        { name: 'Kampas Rem Belakang Tromol Muatan Berat', intervalKm: 30000, costEstimate: 350000 },
        { name: 'Oli Gardan SAE 140 Heavy Duty (2.5L)', intervalKm: 20000, costEstimate: 180000 },
        { name: 'Oli Transmisi Manual (2.5L)', intervalKm: 20000, costEstimate: 180000 },
        { name: 'Kopling Set (Clutch Disc & Cover)', intervalKm: 40000, costEstimate: 950000 },
        { name: 'Aki Basah 12V 65Ah (N50Z)', intervalKm: 30000, costEstimate: 920000 },
        { name: 'Ban Niaga Kargo 185 R14C 8PR', intervalKm: 35000, costEstimate: 720000 },
      ],
    },
  ],
  // SUZUKI
  carry: [
    {
      name: 'Suzuki New Carry Pick Up Wide Deck',
      year: 2022,
      category: 'mobil',
      fuelType: 'Pertalite',
      tankCapacityLiters: 43,
      maxCargoWeightKg: 1000,
      notes: 'Rajanya Pick Up mesin 1.5L K15B-C bak ekstra lebar',
      stnkTaxCostAnnual: 1800000,
      stnkTaxCostFiveYear: 2400000,
      defaultParts: [
        { name: 'Oli Mesin Suzuki Genuine 5W-30 (3.5L)', intervalKm: 5000, costEstimate: 310000 },
        { name: 'Filter Oli Mesin New Carry', intervalKm: 5000, costEstimate: 45000 },
        { name: 'Filter Udara Mesin K15B', intervalKm: 15000, costEstimate: 95000 },
        { name: 'Busi Nickel K16PR-U (4 pcs)', intervalKm: 15000, costEstimate: 120000 },
        { name: 'Kampas Rem Depan Cakram', intervalKm: 20000, costEstimate: 290000 },
        { name: 'Kampas Rem Belakang Tromol', intervalKm: 30000, costEstimate: 270000 },
        { name: 'Oli Gardan & Transmisi Manual (4L)', intervalKm: 20000, costEstimate: 260000 },
        { name: 'Kopling Set Suzuki OEM', intervalKm: 40000, costEstimate: 880000 },
        { name: 'Ban Kargo 165 R13C', intervalKm: 35000, costEstimate: 610000 },
      ],
    },
  ],
  // TRUK LOGISTIK
  canter: [
    {
      name: 'Mitsubishi Canter FE 74 HD 136PS',
      year: 2022,
      category: 'truk',
      fuelType: 'Bio Solar',
      tankCapacityLiters: 100,
      maxCargoWeightKg: 7500,
      notes: 'Truk 6 roda Colt Diesel angkutan logistik antar provinsi mesin 3.9L 4D34',
      stnkTaxCostAnnual: 3400000,
      stnkTaxCostFiveYear: 4300000,
      defaultParts: [
        { name: 'Oli Mesin Diesel Heavy Duty 15W-40 (8.5L)', intervalKm: 5000, costEstimate: 680000 },
        { name: 'Filter Oli Mesin Canter Ganda', intervalKm: 5000, costEstimate: 140000 },
        { name: 'Filter Solar Atas & Bawah (2 pcs)', intervalKm: 10000, costEstimate: 180000 },
        { name: 'Water Separator Solar', intervalKm: 15000, costEstimate: 95000 },
        { name: 'Filter Udara Truk Cyclone Drum', intervalKm: 15000, costEstimate: 280000 },
        { name: 'Kampas Rem Truk Roda Depan (Brake Lining)', intervalKm: 25000, costEstimate: 520000 },
        { name: 'Kampas Rem Truk Roda Belakang Ganda', intervalKm: 25000, costEstimate: 680000 },
        { name: 'Oli Gardan SAE 140 HD (5L)', intervalKm: 20000, costEstimate: 360000 },
        { name: 'Oli Transmisi Truk 5-Speed (4L)', intervalKm: 20000, costEstimate: 310000 },
        { name: 'Gemuk Roda / Wheel Grease Chassis', intervalKm: 10000, costEstimate: 150000 },
        { name: 'Aki Truk 24V (2 x 12V 100Ah N100)', intervalKm: 40000, costEstimate: 2400000 },
        { name: 'Ban Truk 7.50-16 Giti/Bridgestone', intervalKm: 45000, costEstimate: 1450000 },
      ],
    },
  ],
};

interface AddVehiclePageViewProps {
  onBack: () => void;
  onSaveVehicle: (newVehicle: Vehicle, initialParts: SparePart[]) => void;
  aiSettings?: AiSettings;
}

export const AddVehiclePageView: React.FC<AddVehiclePageViewProps> = ({
  onBack,
  onSaveVehicle,
  aiSettings,
}) => {
  // Step 1 states: Search & AI suggestion
  const [searchQuery, setSearchQuery] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState<PresetVehicleSpec[]>([]);
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [isDeepAiAnalyzing, setIsDeepAiAnalyzing] = useState(false);
  const [aiMessageNotice, setAiMessageNotice] = useState<string | null>(null);
  const [hasSelectedModel, setHasSelectedModel] = useState(false);

  // Step 2 states: Editable form fields
  const [name, setName] = useState('');
  const [year, setYear] = useState(2022);
  const [plateNumber, setPlateNumber] = useState('');
  const [category, setCategory] = useState<VehicleCategory>('motor');
  const [fuelType, setFuelType] = useState<FuelType>('Pertamax');
  const [tankCapacityLiters, setTankCapacityLiters] = useState(5.0);
  const [maxCargoWeightKg, setMaxCargoWeightKg] = useState<number | undefined>(150);
  const [currentOdometerKm, setCurrentOdometerKm] = useState(15000);
  const [stnkExpiryDate, setStnkExpiryDate] = useState('2027-10-21');
  const [stnkFiveYearExpiryDate, setStnkFiveYearExpiryDate] = useState('2030-10-21');
  const [stnkTaxCostAnnual, setStnkTaxCostAnnual] = useState(300000);
  const [stnkTaxCostFiveYear, setStnkTaxCostFiveYear] = useState(550000);
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

  // Algorithmic heuristic generator for any vehicle not in catalog
  const generateDynamicHeuristicSpec = (q: string): PresetVehicleSpec => {
    const lower = q.toLowerCase();
    const isTruck = lower.includes('truk') || lower.includes('canter') || lower.includes('dutro') || lower.includes('elf') || lower.includes('fuso') || lower.includes('hino') || lower.includes('dump') || lower.includes('box giga');
    const isBike = lower.includes('motor') || lower.includes('vario') || lower.includes('beat') || lower.includes('scoopy') || lower.includes('pcx') || lower.includes('adv') || lower.includes('nmax') || lower.includes('aerox') || lower.includes('mio') || lower.includes('fazzio') || lower.includes('ninja') || lower.includes('cbr') || lower.includes('r15') || lower.includes('vespa') || lower.includes('matic');
    const isDiesel = lower.includes('diesel') || lower.includes('solar') || lower.includes('dakar') || lower.includes('vrz') || lower.includes('reborn') || lower.includes('panther') || lower.includes('traga') || lower.includes('l300');
    const isEV = lower.includes('ev') || lower.includes('listrik') || lower.includes('ioniq') || lower.includes('air ev') || lower.includes('binguo') || lower.includes('byd');

    const cat: VehicleCategory = isTruck ? 'truk' : isBike ? 'motor' : 'mobil';
    const fuel: FuelType = isEV ? 'Listrik' : isDiesel ? 'Bio Solar' : isTruck ? 'Bio Solar' : isBike ? 'Pertamax' : 'Pertamax';

    let defaultPartsList: { name: string; intervalKm: number; costEstimate: number }[] = [];

    if (isBike) {
      defaultPartsList = [
        { name: 'Oli Mesin 4-Tak SAE 10W-30 / 10W-40 (0.8L - 1.0L)', intervalKm: 2500, costEstimate: 70000 },
        { name: 'Oli Gardan / Transmisi Matic', intervalKm: 6000, costEstimate: 20000 },
        { name: 'Busi Resistor OEM', intervalKm: 8000, costEstimate: 35000 },
        { name: 'Saringan Filter Udara Basah', intervalKm: 10000, costEstimate: 65000 },
        { name: 'Kampas Rem Depan Cakram OEM', intervalKm: 12000, costEstimate: 75000 },
        { name: 'Kampas Rem Belakang Tromol / Cakram', intervalKm: 15000, costEstimate: 65000 },
        { name: 'V-Belt & Roller CVT / Rantai Gir Set', intervalKm: 24000, costEstimate: 220000 },
        { name: 'Air Radiator Coolant Pre-mix', intervalKm: 15000, costEstimate: 45000 },
        { name: 'Minyak Rem DOT 4', intervalKm: 20000, costEstimate: 40000 },
        { name: 'Aki Kering Maintenance Free 12V', intervalKm: 30000, costEstimate: 280000 },
        { name: 'Ban Tubeless Depan OEM', intervalKm: 20000, costEstimate: 260000 },
        { name: 'Ban Tubeless Belakang OEM', intervalKm: 18000, costEstimate: 320000 },
      ];
    } else if (isTruck) {
      defaultPartsList = [
        { name: 'Oli Mesin Diesel HD 15W-40 (8L - 10L)', intervalKm: 5000, costEstimate: 650000 },
        { name: 'Filter Oli Mesin Truk OEM', intervalKm: 5000, costEstimate: 120000 },
        { name: 'Filter Solar Atas & Bawah Set', intervalKm: 10000, costEstimate: 175000 },
        { name: 'Filter Udara Tabung Cyclone', intervalKm: 15000, costEstimate: 260000 },
        { name: 'Kampas Rem Truk Roda Depan (Brake Lining)', intervalKm: 25000, costEstimate: 520000 },
        { name: 'Kampas Rem Truk Roda Belakang', intervalKm: 25000, costEstimate: 650000 },
        { name: 'Oli Gardan SAE 140 (5L)', intervalKm: 20000, costEstimate: 340000 },
        { name: 'Oli Transmisi Truk (4L)', intervalKm: 20000, costEstimate: 290000 },
        { name: 'Gemuk Roda Grease Chassis', intervalKm: 10000, costEstimate: 140000 },
        { name: 'Aki Heavy Duty 24V Set', intervalKm: 40000, costEstimate: 2200000 },
        { name: 'Ban Truk Niaga Kargo', intervalKm: 45000, costEstimate: 1400000 },
      ];
    } else {
      defaultPartsList = [
        { name: isDiesel ? 'Oli Mesin Diesel 5W-30 Full Synthetic (6L)' : 'Oli Mesin Bensin 0W-20 / 5W-30 (4L)', intervalKm: 5000, costEstimate: isDiesel ? 620000 : 380000 },
        { name: 'Filter Oli Mesin OEM', intervalKm: 5000, costEstimate: 65000 },
        { name: isDiesel ? 'Filter Solar / Bahan Bakar Diesel' : 'Filter Udara Mesin OEM', intervalKm: isDiesel ? 10000 : 15000, costEstimate: isDiesel ? 180000 : 130000 },
        { name: 'Filter AC Kabin Karbon', intervalKm: 10000, costEstimate: 95000 },
        { name: isDiesel ? 'Glow Plug Set' : 'Busi Iridium Twin Tip (4 pcs)', intervalKm: 40000, costEstimate: 360000 },
        { name: 'Kampas Rem Depan (Brake Pad)', intervalKm: 25000, costEstimate: 450000 },
        { name: 'Kampas Rem Belakang (Brake Shoe/Pad)', intervalKm: 40000, costEstimate: 350000 },
        { name: 'Oli Transmisi (CVT / ATF / MTF)', intervalKm: 40000, costEstimate: 450000 },
        { name: 'Minyak Rem DOT 3 / DOT 4', intervalKm: 20000, costEstimate: 85000 },
        { name: 'Radiator Coolant Long Life', intervalKm: 40000, costEstimate: 150000 },
        { name: 'Aki Kering 12V Maintenance Free', intervalKm: 35000, costEstimate: 950000 },
        { name: 'Ban Luar Kendaraan OEM (1 pcs)', intervalKm: 40000, costEstimate: 820000 },
      ];
    }

    return {
      name: q.trim(),
      year: 2022,
      category: cat,
      fuelType: fuel,
      tankCapacityLiters: isTruck ? 100 : isBike ? 5.0 : isDiesel ? 60 : 45,
      maxCargoWeightKg: isTruck ? 7500 : isBike ? 150 : 700,
      notes: `Analisa komprehensif AI untuk unit armada: ${q.trim()}`,
      stnkTaxCostAnnual: isTruck ? 3200000 : isBike ? 285000 : 2500000,
      stnkTaxCostFiveYear: isTruck ? 4200000 : isBike ? 475000 : 3200000,
      defaultParts: defaultPartsList,
    };
  };

  // Real-time Query Filter & Catalog Search
  const handleQueryChange = (val: string) => {
    setSearchQuery(val);
    setHasSelectedModel(false);
    setAiMessageNotice(null);

    if (!val.trim()) {
      setAiSuggestions([]);
      return;
    }

    setIsAiSearching(true);

    setTimeout(() => {
      setIsAiSearching(false);
      const q = val.toLowerCase();
      let matched: PresetVehicleSpec[] = [];

      for (const key of Object.keys(EXTENDED_VEHICLE_CATALOG)) {
        if (q.includes(key) || key.includes(q)) {
          matched = [...matched, ...EXTENDED_VEHICLE_CATALOG[key]];
        }
      }

      // If user typed at least 3 letters and not found in catalog, generate complete dynamic spec
      if (matched.length === 0 && val.length >= 2) {
        matched = [generateDynamicHeuristicSpec(val)];
      }

      setAiSuggestions(matched);
    }, 200);
  };

  // Deep Gemini AI Analysis Button
  const handleDeepAiAnalysis = async () => {
    if (!searchQuery.trim()) return;

    setIsDeepAiAnalyzing(true);
    setAiMessageNotice(null);

    try {
      const aiResult = await analyzeVehicleWithAI(searchQuery.trim(), aiSettings?.apiKey);

      if (aiResult) {
        const spec: PresetVehicleSpec = {
          name: aiResult.name,
          year: aiResult.year || 2022,
          category: aiResult.category,
          fuelType: aiResult.fuelType as any,
          tankCapacityLiters: aiResult.tankCapacityLiters || 45,
          maxCargoWeightKg: aiResult.maxCargoWeightKg,
          notes: aiResult.notes || `Analisa resmi Gemini AI untuk ${aiResult.name}`,
          stnkTaxCostAnnual: aiResult.stnkTaxCostAnnual || 2500000,
          stnkTaxCostFiveYear: aiResult.stnkTaxCostFiveYear || 3200000,
          defaultParts: aiResult.defaultParts.map((p) => ({
            name: p.name,
            intervalKm: p.intervalKm || 5000,
            costEstimate: p.costEstimate || 100000,
          })),
        };

        setAiSuggestions([spec, ...aiSuggestions]);
        handleSelectModel(spec);
        setAiMessageNotice(`✓ Gemini AI berhasil menganalisa ${spec.name} dengan ${spec.defaultParts.length} suku cadang pabrikan!`);
      } else {
        // Fallback heuristic
        const dynamicSpec = generateDynamicHeuristicSpec(searchQuery.trim());
        setAiSuggestions([dynamicSpec]);
        handleSelectModel(dynamicSpec);
        setAiMessageNotice(`✓ AI menganalisa ${dynamicSpec.name} dengan ${dynamicSpec.defaultParts.length} suku cadang standar operasional.`);
      }
    } catch {
      const dynamicSpec = generateDynamicHeuristicSpec(searchQuery.trim());
      setAiSuggestions([dynamicSpec]);
      handleSelectModel(dynamicSpec);
    } finally {
      setIsDeepAiAnalyzing(false);
    }
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
    if (spec.stnkTaxCostAnnual) setStnkTaxCostAnnual(spec.stnkTaxCostAnnual);
    if (spec.stnkTaxCostFiveYear) setStnkTaxCostFiveYear(spec.stnkTaxCostFiveYear);

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
        name: 'Komponen Suku Cadang Tambahan',
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
      stnkTaxCostAnnual: Number(stnkTaxCostAnnual),
      stnkTaxCostFiveYear: Number(stnkTaxCostFiveYear),
      notes,
    };

    const initialParts: SparePart[] = parts.map((p) => ({
      id: `sp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
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
    <div className="space-y-6 pb-24 md:pb-8 pt-1 animate-fade-in text-zinc-900 dark:text-zinc-100 max-w-6xl mx-auto transition-colors">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 py-2 px-3 rounded-2xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-bold transition cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Batal & Kembali</span>
        </button>

        <h2 className="text-sm md:text-base font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-yellow-500 fill-yellow-400" />
          <span>Tambah Unit Armada (AI Assisted)</span>
        </h2>
      </div>

      {/* ======================================================== */}
      {/* STEP 1: INITIAL SEARCH / PROMPT BAR                      */}
      {/* ======================================================== */}
      <div className="bg-white dark:bg-zinc-900 border-2 border-zinc-900 dark:border-zinc-700 rounded-3xl p-5 shadow-sm space-y-4 transition-colors">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500 block">
            Langkah 1: Identifikasi Kendaraan
          </span>
          <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-100 mt-0.5">
            Ketik nama atau model kendaraan apapun di dunia
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
            AI akan menganalisa spesifikasi teknis, tangki BBM, serta memetakan daftar lengkap 8-12 suku cadang resmi bawaan pabrik.
          </p>
        </div>

        {/* Big Search Input with Gemini Action Button */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
              <Search className="w-5 h-5 text-yellow-500" />
            </div>
            <input
              type="text"
              placeholder="Contoh: 'Yamaha NMAX 2022', 'Innova Reborn', 'Pajero Sport', 'Gran Max', 'Canter'..."
              value={searchQuery}
              onChange={(e) => handleQueryChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleDeepAiAnalysis()}
              className="w-full pl-11 pr-4 py-3.5 bg-zinc-50 dark:bg-zinc-800 border-2 border-zinc-300 dark:border-zinc-700 focus:border-zinc-900 dark:focus:border-yellow-400 rounded-2xl text-xs text-zinc-900 dark:text-zinc-100 font-bold placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none transition shadow-xs"
            />
          </div>

          <button
            type="button"
            onClick={handleDeepAiAnalysis}
            disabled={isDeepAiAnalyzing || !searchQuery.trim()}
            className="py-3.5 px-5 bg-zinc-950 hover:bg-zinc-800 dark:bg-yellow-400 dark:hover:bg-yellow-300 disabled:opacity-40 text-white dark:text-zinc-950 font-extrabold text-xs uppercase tracking-wider rounded-2xl transition flex items-center justify-center gap-2 shadow-sm cursor-pointer shrink-0"
          >
            {isDeepAiAnalyzing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-yellow-400 dark:text-zinc-950" />
                <span>AI Menganalisa...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-yellow-400 dark:text-zinc-950 fill-current" />
                <span>Analisis dengan Gemini AI</span>
              </>
            )}
          </button>
        </div>

        {/* AI Notice Badge */}
        {aiMessageNotice && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{aiMessageNotice}</span>
          </div>
        )}

        {/* AI Suggestions / Recommendations */}
        {aiSuggestions.length > 0 && !hasSelectedModel && (
          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 space-y-2 animate-fade-in">
            <div className="flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-300 font-bold px-1">
              <span className="flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-yellow-500" />
                <span>AI Menemukan Spesifikasi & Suku Cadang Terkait. Pilih model Anda:</span>
              </span>
              <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">
                {aiSuggestions.length} Opsi
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {aiSuggestions.map((spec, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSelectModel(spec)}
                  className="p-3.5 bg-zinc-50 dark:bg-zinc-800/80 hover:bg-yellow-50/80 dark:hover:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700 hover:border-yellow-400 dark:hover:border-yellow-400 rounded-2xl transition cursor-pointer flex items-center justify-between group active:scale-98"
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-xs text-zinc-900 dark:text-zinc-100 group-hover:text-black dark:group-hover:text-white truncate">
                        {spec.name} ({spec.year})
                      </h4>
                      <span className="text-[9px] px-2 py-0.2 bg-zinc-200 dark:bg-zinc-700 group-hover:bg-yellow-200 text-zinc-800 dark:text-zinc-200 font-bold rounded-full uppercase shrink-0">
                        {spec.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 line-clamp-1">{spec.notes}</p>
                    <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-600 dark:text-zinc-400 mt-1 flex-wrap">
                      <span>⛽ {spec.tankCapacityLiters}L ({spec.fuelType})</span>
                      <span>•</span>
                      <span className="font-bold text-yellow-800 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-950/60 px-1.5 py-0.2 rounded border border-yellow-200 dark:border-yellow-800">
                        ⚡ {spec.defaultParts.length} Suku Cadang Lengkap
                      </span>
                    </div>
                  </div>

                  <div className="p-2 rounded-xl bg-white dark:bg-zinc-700 group-hover:bg-yellow-400 text-zinc-900 dark:text-zinc-100 group-hover:text-zinc-950 transition-colors shadow-xs shrink-0">
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
          <div className="p-4 bg-yellow-50 dark:bg-yellow-950/40 border-2 border-yellow-400 dark:border-yellow-700 rounded-3xl flex items-center justify-between gap-3 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-2xl bg-yellow-400 text-zinc-950">
                <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div className="text-xs">
                <span className="font-black text-sm text-zinc-900 dark:text-zinc-100 block">
                  Model Berhasil Dianalisa: {name} ({year})
                </span>
                <span className="text-zinc-500 dark:text-zinc-400">
                  {parts.length} komponen suku cadang pabrikan telah dipetakan secara otomatis. Anda dapat mengedit field di bawah.
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setHasSelectedModel(false)}
              className="text-xs font-bold text-zinc-800 dark:text-yellow-400 hover:text-black dark:hover:text-yellow-300 underline cursor-pointer shrink-0"
            >
              Ganti Model
            </button>
          </div>

          {/* Form Fields: 2 Columns on Desktop */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Section 1: Data Identitas & STNK (6 Cols) */}
            <div className="lg:col-span-6 bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 shadow-sm space-y-4 transition-colors">
              <h4 className="font-black text-xs uppercase tracking-wider text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5 pb-2 border-b border-zinc-100 dark:border-zinc-800">
                <Layers className="w-4 h-4 text-yellow-500" />
                <span>1. Identitas Kendaraan & Legalitas</span>
              </h4>

              <div className="space-y-3 text-xs">
                {/* Nama Model */}
                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">Nama / Merk Kendaraan</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 font-bold focus:outline-none focus:border-zinc-900 dark:focus:border-yellow-400"
                    required
                  />
                </div>

                {/* Plat Nomor & Tahun */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">Nomor Polisi (Plat)</label>
                    <input
                      type="text"
                      placeholder="B 1234 XYZ"
                      value={plateNumber}
                      onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
                      className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 font-mono font-black focus:outline-none focus:border-zinc-900 dark:focus:border-yellow-400"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">Tahun Perakitan</label>
                    <input
                      type="number"
                      value={year}
                      onChange={(e) => setYear(Number(e.target.value))}
                      className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 font-mono focus:outline-none focus:border-zinc-900 dark:focus:border-yellow-400"
                      required
                    />
                  </div>
                </div>

                {/* Kategori & BBM */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">Kategori Kendaraan</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as any)}
                      className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 font-bold focus:outline-none focus:border-zinc-900 dark:focus:border-yellow-400"
                    >
                      <option value="motor">Sepeda Motor</option>
                      <option value="mobil">Mobil Penumpang / Niaga</option>
                      <option value="truk">Truk / Kendaraan Berat</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">Jenis Bahan Bakar</label>
                    <select
                      value={fuelType}
                      onChange={(e) => setFuelType(e.target.value as any)}
                      className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 font-bold focus:outline-none focus:border-zinc-900 dark:focus:border-yellow-400"
                    >
                      <option value="Pertalite">Pertalite</option>
                      <option value="Pertamax">Pertamax</option>
                      <option value="Pertamax Turbo">Pertamax Turbo</option>
                      <option value="Solar">Solar</option>
                      <option value="Bio Solar">Bio Solar</option>
                      <option value="Dexlite">Dexlite</option>
                      <option value="Listrik">Listrik (EV)</option>
                    </select>
                  </div>
                </div>

                {/* Odometer Saat Ini & Kapasitas Tangki */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">Odometer Terkini (KM)</label>
                    <input
                      type="number"
                      value={currentOdometerKm}
                      onChange={(e) => setCurrentOdometerKm(Number(e.target.value))}
                      className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 font-mono font-bold focus:outline-none focus:border-zinc-900 dark:focus:border-yellow-400"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">Kapasitas Tangki (Liter)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={tankCapacityLiters}
                      onChange={(e) => setTankCapacityLiters(Number(e.target.value))}
                      className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 font-mono focus:outline-none focus:border-zinc-900 dark:focus:border-yellow-400"
                      required
                    />
                  </div>
                </div>

                {/* Legalitas Pajak STNK */}
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-zinc-100 dark:border-zinc-800">
                  <div>
                    <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">Jatuh Tempo Pajak Tahunan (PKB)</label>
                    <input
                      type="date"
                      value={stnkExpiryDate}
                      onChange={(e) => setStnkExpiryDate(e.target.value)}
                      className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 font-mono focus:outline-none focus:border-zinc-900 dark:focus:border-yellow-400"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">Jatuh Tempo Plat 5 Tahun (Kaleng)</label>
                    <input
                      type="date"
                      value={stnkFiveYearExpiryDate}
                      onChange={(e) => setStnkFiveYearExpiryDate(e.target.value)}
                      className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 font-mono focus:outline-none focus:border-zinc-900 dark:focus:border-yellow-400"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">Estimasi Biaya Pajak Tahunan (Rp)</label>
                    <input
                      type="number"
                      value={stnkTaxCostAnnual}
                      onChange={(e) => setStnkTaxCostAnnual(Number(e.target.value))}
                      className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 font-mono font-bold focus:outline-none focus:border-zinc-900 dark:focus:border-yellow-400"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">Biaya Plat 5 Tahun (Rp)</label>
                    <input
                      type="number"
                      value={stnkTaxCostFiveYear}
                      onChange={(e) => setStnkTaxCostFiveYear(Number(e.target.value))}
                      className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 font-mono font-bold focus:outline-none focus:border-zinc-900 dark:focus:border-yellow-400"
                    />
                  </div>
                </div>

                {/* No STNK & Rangka (Opsional) */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">Nomor Seri STNK (Opsional)</label>
                    <input
                      type="text"
                      placeholder="Contoh: 08392104-JKT"
                      value={stnkNumber}
                      onChange={(e) => setStnkNumber(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 font-mono text-[11px] focus:outline-none focus:border-zinc-900 dark:focus:border-yellow-400"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">Nomor Rangka / VIN (Opsional)</label>
                    <input
                      type="text"
                      placeholder="MH1JF31..."
                      value={chassisNumber}
                      onChange={(e) => setChassisNumber(e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 font-mono text-[11px] focus:outline-none focus:border-zinc-900 dark:focus:border-yellow-400"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Pemetaan Sparepart Lengkap oleh AI (6 Cols) */}
            <div className="lg:col-span-6 bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 shadow-sm space-y-4 transition-colors">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
                <div>
                  <h4 className="font-black text-xs uppercase tracking-wider text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                    <Wrench className="w-4 h-4 text-yellow-500" />
                    <span>2. Suku Cadang Lengkap Hasil Analisa AI ({parts.length})</span>
                  </h4>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Semua komponen ini dapat Anda ubah interval kilometer atau estimasi harganya.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleAddCustomPart}
                  className="flex items-center gap-1 py-1.5 px-3 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-[11px] font-bold rounded-xl transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-zinc-900 dark:text-zinc-100" />
                  <span>+ Tambah Part</span>
                </button>
              </div>

              {/* List Editable Parts */}
              <div className="space-y-2.5 max-h-[560px] overflow-y-auto pr-1 no-scrollbar">
                {parts.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-2xl space-y-2 text-xs hover:border-yellow-400 dark:hover:border-yellow-400 transition"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        value={p.name}
                        onChange={(e) => handleUpdatePart(p.id, 'name', e.target.value)}
                        className="flex-1 font-bold text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-zinc-900 dark:focus:border-yellow-400"
                      />
                      <button
                        type="button"
                        onClick={() => handleDeletePart(p.id)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer"
                        title="Hapus komponen ini"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-zinc-500 dark:text-zinc-400 block mb-0.5">Interval Ganti (KM)</span>
                        <input
                          type="number"
                          value={p.intervalKm}
                          onChange={(e) => handleUpdatePart(p.id, 'intervalKm', Number(e.target.value))}
                          className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2 py-1 font-mono font-bold text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-zinc-900 dark:focus:border-yellow-400"
                        />
                      </div>
                      <div>
                        <span className="text-zinc-500 dark:text-zinc-400 block mb-0.5">Estimasi Biaya (Rp)</span>
                        <input
                          type="number"
                          value={p.costEstimate}
                          onChange={(e) => handleUpdatePart(p.id, 'costEstimate', Number(e.target.value))}
                          className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2 py-1 font-mono font-bold text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-zinc-900 dark:focus:border-yellow-400"
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
              <span>Simpan Kendaraan & {parts.length} Komponen Suku Cadang ke Garasi</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
    </div>
  );
};
