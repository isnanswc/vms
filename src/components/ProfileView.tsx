import React, { useState } from 'react';
import type { UserProfile, DriverLicense } from '../types/user';
import { 
  ChevronLeft, 
  CreditCard, 
  Plus, 
  ShieldCheck, 
  AlertTriangle, 
  Trash2, 
  X, 
  Mail, 
  Phone,
  Edit3,
  User,
  Check,
  Calendar,
  MapPin,
  FileBadge
} from 'lucide-react';

interface ProfileViewProps {
  profile: UserProfile;
  onBack: () => void;
  onUpdateProfile: (updated: UserProfile) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  profile,
  onBack,
  onUpdateProfile,
}) => {
  const [isAddSimModalOpen, setIsAddSimModalOpen] = useState(false);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [simToDelete, setSimToDelete] = useState<DriverLicense | null>(null);

  // Form states for profile edit
  const [profileName, setProfileName] = useState(profile.name);
  const [profileEmail, setProfileEmail] = useState(profile.email);
  const [profilePhone, setProfilePhone] = useState(profile.phone);

  // Form states for new license
  const [simType, setSimType] = useState<DriverLicense['simType']>('SIM C');
  const [simNumber, setSimNumber] = useState('');
  const [holderName, setHolderName] = useState(profile.name.toUpperCase());
  const [expiryDate, setExpiryDate] = useState('2028-05-10');
  const [issuingCity, setIssuingCity] = useState('');

  const today = new Date('2026-10-21');

  const getDaysUntilExpiry = (dateStr: string) => {
    const target = new Date(dateStr);
    const diffTime = target.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const handleAddSim = (e: React.FormEvent) => {
    e.preventDefault();
    if (!simNumber.trim()) return;

    const newSim: DriverLicense = {
      id: `sim-${Date.now()}`,
      simType,
      simNumber: simNumber.trim(),
      holderName: holderName.trim().toUpperCase(),
      expiryDate,
      issuingCity: issuingCity.trim() || 'Satpas Korlantas Polri',
    };

    onUpdateProfile({
      ...profile,
      licenses: [...profile.licenses, newSim],
    });

    setSimNumber('');
    setIsAddSimModalOpen(false);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName.trim()) return;

    onUpdateProfile({
      ...profile,
      name: profileName.trim(),
      email: profileEmail.trim(),
      phone: profilePhone.trim(),
    });
    setIsEditProfileModalOpen(false);
  };

  const handleConfirmDeleteSim = () => {
    if (simToDelete) {
      onUpdateProfile({
        ...profile,
        licenses: profile.licenses.filter((l) => l.id !== simToDelete.id),
      });
      setSimToDelete(null);
    }
  };

  return (
    <div className="space-y-6 pb-24 md:pb-8 pt-1 animate-profile-enter text-zinc-900 dark:text-zinc-100 max-w-5xl transition-colors">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 py-2 px-3.5 rounded-2xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-bold transition cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Kembali</span>
        </button>

        <h2 className="text-sm md:text-base font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
          Kelola Akun & SIM
        </h2>
      </div>

      {/* Profile Overview Card */}
      <div className="bg-white dark:bg-zinc-900 border-2 border-zinc-900 dark:border-zinc-700 rounded-3xl p-6 md:p-7 shadow-sm transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-yellow-400 text-zinc-950 flex items-center justify-center font-black text-2xl shadow-md shrink-0 ring-4 ring-yellow-400/20">
              {profile.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg md:text-xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
                  {profile.name}
                </h3>
                <span className="px-2.5 py-0.5 bg-yellow-100 dark:bg-yellow-950/60 text-zinc-900 dark:text-yellow-400 text-[10px] font-mono font-bold rounded-full border border-yellow-300 dark:border-yellow-800">
                  Personal Owner
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                <p className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />
                  <span>{profile.email}</span>
                </p>
                <p className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />
                  <span>{profile.phone}</span>
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => {
                setProfileName(profile.name);
                setProfileEmail(profile.email);
                setProfilePhone(profile.phone);
                setIsEditProfileModalOpen(true);
              }}
              className="flex items-center gap-2 py-2.5 px-4 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 text-xs font-bold rounded-2xl transition cursor-pointer active:scale-95 shadow-xs"
            >
              <Edit3 className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300" />
              <span>Edit Profil</span>
            </button>

            <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800/80 px-4 py-2 rounded-2xl border border-zinc-200 dark:border-zinc-700">
              <div className="p-2 rounded-xl bg-yellow-400 text-zinc-950 shadow-xs">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 dark:text-zinc-400 uppercase font-bold block">Status Lisensi</span>
                <span className="text-xs font-black text-zinc-900 dark:text-zinc-100 font-mono">
                  {profile.licenses.length} SIM Aktif
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section: Multi-SIM Management */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div>
            <h4 className="text-xs md:text-sm font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-yellow-500" />
              <span>Surat Izin Mengemudi (SIM)</span>
            </h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Pengingat masa berlaku SIM pribadi / operasional Anda
            </p>
          </div>

          <button
            onClick={() => setIsAddSimModalOpen(true)}
            className="flex items-center gap-1.5 py-2.5 px-4 bg-yellow-400 hover:bg-yellow-300 text-zinc-950 text-xs font-black rounded-xl transition shadow-xs cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>TAMBAH SIM</span>
          </button>
        </div>

        {/* List of SIM Cards (2 Columns on Desktop) */}
        {profile.licenses.length === 0 ? (
          <div className="p-10 bg-zinc-50 dark:bg-zinc-900/50 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl text-center text-zinc-400 dark:text-zinc-500 text-xs space-y-2">
            <CreditCard className="w-8 h-8 mx-auto text-zinc-300 dark:text-zinc-600 stroke-[1.5]" />
            <p className="font-bold text-zinc-700 dark:text-zinc-300">Belum Ada Kartu SIM Terdaftar</p>
            <p className="max-w-md mx-auto text-zinc-500 dark:text-zinc-500 text-[11px]">
              Daftarkan lisensi mengemudi Anda (SIM A, B, atau C) untuk mendapatkan notifikasi dan pemantauan masa berlaku otomatis.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {profile.licenses.map((sim) => {
              const daysLeft = getDaysUntilExpiry(sim.expiryDate);
              const isUrgent = daysLeft <= 30;

              return (
                <div
                  key={sim.id}
                  className={`bg-white dark:bg-zinc-900 rounded-3xl p-5 border-2 transition shadow-sm space-y-3.5 relative overflow-hidden ${
                    isUrgent 
                      ? 'border-amber-400 dark:border-amber-600/80 shadow-amber-500/5' 
                      : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700'
                  }`}
                >
                  {/* Top SIM Card Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="px-3 py-1.5 bg-zinc-950 dark:bg-zinc-800 text-yellow-400 font-mono font-black text-xs rounded-xl shadow-sm border border-zinc-800 dark:border-zinc-700">
                        {sim.simType}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 font-mono block">
                          No. {sim.simNumber}
                        </span>
                        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 block flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-zinc-400" />
                          <span>{sim.issuingCity}</span>
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => setSimToDelete(sim)}
                      className="p-2 rounded-xl text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer"
                      title="Hapus SIM"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* License Holder & Expiry details */}
                  <div className="bg-zinc-50 dark:bg-zinc-800/60 p-3 rounded-2xl border border-zinc-200/80 dark:border-zinc-700/60 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-zinc-400 dark:text-zinc-400 block font-medium">Nama Pemilik</span>
                      <span className="font-extrabold text-zinc-900 dark:text-zinc-100">{sim.holderName}</span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-zinc-400 dark:text-zinc-400 block font-medium">Berlaku Sampai</span>
                      <span className="font-mono font-black text-zinc-900 dark:text-zinc-100">
                        {new Date(sim.expiryDate).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Countdown Status Pill */}
                  <div className={`p-2.5 rounded-xl flex items-center justify-between text-[11px] ${
                    isUrgent 
                      ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-950 dark:text-amber-200 border border-amber-300 dark:border-amber-800' 
                      : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800/80'
                  }`}>
                    <div className="flex items-center gap-1.5">
                      {isUrgent ? (
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                      ) : (
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      )}
                      <span className="font-bold">
                        {isUrgent ? 'Masa Berlaku Segera Habis!' : 'Status Masa Berlaku: Aman'}
                      </span>
                    </div>

                    <span className={`font-mono font-black px-2 py-0.5 rounded-full text-[10px] ${
                      isUrgent 
                        ? 'bg-amber-500 text-white animate-pulse' 
                        : 'bg-emerald-200 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-300'
                    }`}>
                      {daysLeft > 0 ? `${daysLeft} Hari Lagi` : 'Kedaluwarsa!'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* MODAL EDIT DATA PROFIL (SPACIOUS & PROFESSIONAL)         */}
      {/* ======================================================== */}
      {isEditProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-sm animate-fade-in text-zinc-900 dark:text-zinc-100">
          <div className="w-full max-w-xl bg-white dark:bg-zinc-900 border-2 border-zinc-900 dark:border-zinc-700 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-yellow-400 text-zinc-950 shadow-sm">
                  <Edit3 className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="font-black text-base md:text-lg uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                    Edit Informasi Profil
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Perbarui identitas pemilik akun dan data kontak operasional
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditProfileModalOpen(false)}
                className="p-2 rounded-xl text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveProfile} className="space-y-5 text-xs">
              <div>
                <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Nama Lengkap Pemilik</span>
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder="Contoh: Isnan SWC"
                  className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-2xl text-zinc-900 dark:text-zinc-100 font-bold focus:outline-none focus:border-zinc-900 dark:focus:border-yellow-400 text-sm transition"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Alamat Email</span>
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    placeholder="nama@domain.com"
                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-2xl text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 dark:focus:border-yellow-400 font-medium transition"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Nomor Telepon / WhatsApp</span>
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    placeholder="+62 812-3456-7890"
                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-2xl text-zinc-900 dark:text-zinc-100 font-mono focus:outline-none focus:border-zinc-900 dark:focus:border-yellow-400 font-medium transition"
                    required
                  />
                </div>
              </div>

              {/* Security Hint */}
              <div className="p-3 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800/60 rounded-2xl flex items-start gap-2.5 text-[11px] text-zinc-600 dark:text-zinc-400">
                <ShieldCheck className="w-4 h-4 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
                <p>
                  Data profil disimpan langsung di IndexedDB lokal perangkat Anda. Tidak ada data pribadi yang disinkronisasi ke server luar tanpa persetujuan Anda.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsEditProfileModalOpen(false)}
                  className="py-3 px-5 rounded-2xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="py-3 px-6 bg-zinc-950 hover:bg-zinc-800 dark:bg-yellow-400 dark:hover:bg-yellow-300 text-white dark:text-zinc-950 font-black uppercase tracking-wider rounded-2xl transition shadow-md active:scale-95 cursor-pointer flex items-center gap-2"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL TAMBAH SIM BARU (SPACIOUS & PROFESSIONAL)          */}
      {/* ======================================================== */}
      {isAddSimModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-sm animate-fade-in text-zinc-900 dark:text-zinc-100">
          <div className="w-full max-w-xl bg-white dark:bg-zinc-900 border-2 border-zinc-900 dark:border-zinc-700 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto no-scrollbar">
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-yellow-400 text-zinc-950 shadow-sm">
                  <CreditCard className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="font-black text-base md:text-lg uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                    Tambah Surat Izin Mengemudi
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Registrasi lisensi SIM untuk pemantauan masa berlaku berkala
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddSimModalOpen(false)}
                className="p-2 rounded-xl text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleAddSim} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
                  <FileBadge className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Golongan / Tipe SIM</span>
                  <span className="text-red-500">*</span>
                </label>
                <select
                  value={simType}
                  onChange={(e) => setSimType(e.target.value as any)}
                  className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-2xl text-zinc-900 dark:text-zinc-100 font-bold focus:outline-none focus:border-zinc-900 dark:focus:border-yellow-400 cursor-pointer"
                >
                  <option value="SIM C">SIM C (Sepeda Motor s/d 250cc)</option>
                  <option value="SIM C1">SIM C1 (Sepeda Motor 250cc - 500cc)</option>
                  <option value="SIM A">SIM A (Mobil Pribadi / Penumpang)</option>
                  <option value="SIM B1">SIM B1 (Truk / Bus / Angkutan Barang)</option>
                  <option value="SIM B2">SIM B2 (Alat Berat / Gandengan)</option>
                  <option value="SIM D">SIM D (Penyandang Disabilitas)</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Nomor SIM <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: 9402-1209-00214"
                    value={simNumber}
                    onChange={(e) => setSimNumber(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-2xl text-zinc-900 dark:text-zinc-100 font-mono focus:outline-none focus:border-zinc-900 dark:focus:border-yellow-400 font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Tanggal Kedaluwarsa SIM</span>
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-2xl text-zinc-900 dark:text-zinc-100 font-mono focus:outline-none focus:border-zinc-900 dark:focus:border-yellow-400 font-bold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Nama Pemilik (Sesuai KTP/SIM) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={holderName}
                    onChange={(e) => setHolderName(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-2xl text-zinc-900 dark:text-zinc-100 font-bold uppercase focus:outline-none focus:border-zinc-900 dark:focus:border-yellow-400"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Polda / Satpas Penerbit (Opsional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Polres Metro Jaksel"
                    value={issuingCity}
                    onChange={(e) => setIssuingCity(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-2xl text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 dark:focus:border-yellow-400"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsAddSimModalOpen(false)}
                  className="py-3 px-5 rounded-2xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="py-3 px-6 bg-zinc-950 hover:bg-zinc-800 dark:bg-yellow-400 dark:hover:bg-yellow-300 text-white dark:text-zinc-950 font-black uppercase tracking-wider rounded-2xl transition shadow-md active:scale-95 cursor-pointer flex items-center gap-2"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Simpan Data SIM</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* CONFIRM DELETE SIM MODAL                                 */}
      {/* ======================================================== */}
      {simToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-sm animate-fade-in text-zinc-900 dark:text-zinc-100">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 border-2 border-red-500 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400">
                  <AlertTriangle className="w-6 h-6 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="font-black text-base uppercase tracking-tight text-red-600 dark:text-red-400">
                    Hapus Kartu SIM?
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Konfirmasi penghapusan data lisensi</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSimToDelete(null)}
                className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-xs space-y-1">
              <div className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100">
                {simToDelete.simType} — No. {simToDelete.simNumber}
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 pt-1 leading-relaxed">
                Kartu SIM ini akan dihapus dari profil dan pengingat tanggal jatuh tempo tidak akan aktif lagi.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSimToDelete(null)}
                className="flex-1 py-3 px-4 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteSim}
                className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-500 text-white font-black text-xs rounded-xl transition shadow active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>Ya, Hapus SIM</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};