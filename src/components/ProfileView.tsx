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
  Edit3
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
    if (!simNumber) return;

    const newSim: DriverLicense = {
      id: `sim-${Date.now()}`,
      simType,
      simNumber,
      holderName: holderName.toUpperCase(),
      expiryDate,
      issuingCity: issuingCity || 'Satpas Korlantas Polri',
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

  const handleDeleteSim = (simId: string) => {
    if (confirm('Hapus kartu SIM ini dari profil?')) {
      onUpdateProfile({
        ...profile,
        licenses: profile.licenses.filter((l) => l.id !== simId),
      });
    }
  };

  return (
    <div className="space-y-6 pb-24 md:pb-8 pt-1 animate-profile-enter text-zinc-900 max-w-5xl">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 py-2 px-3 rounded-2xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-bold transition cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Kembali</span>
        </button>

        <h2 className="text-sm md:text-base font-black uppercase tracking-wider text-zinc-900">
          Kelola Akun & SIM
        </h2>
      </div>

      {/* Profile Overview Card */}
      <div className="bg-white border-2 border-zinc-900 rounded-3xl p-5 md:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-yellow-400 text-zinc-950 flex items-center justify-center font-black text-2xl shadow-md shrink-0">
              {profile.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-zinc-900">{profile.name}</h3>
                <span className="px-2.5 py-0.5 bg-yellow-100 text-zinc-900 text-[10px] font-mono font-bold rounded-full border border-yellow-300">
                  Personal Owner
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-zinc-500">
                <p className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-zinc-400" />
                  <span>{profile.email}</span>
                </p>
                <p className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-zinc-400" />
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
              className="flex items-center gap-1.5 py-2.5 px-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 text-xs font-bold rounded-2xl transition cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5 text-zinc-700" />
              <span>Edit Profil</span>
            </button>

            <div className="flex items-center gap-2 bg-zinc-50 px-4 py-2.5 rounded-2xl border border-zinc-200">
              <div className="p-2 rounded-xl bg-yellow-400 text-zinc-950">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 uppercase font-bold block">Status Lisensi</span>
                <span className="text-xs font-black text-zinc-900 font-mono">
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
            <h4 className="text-xs md:text-sm font-black uppercase tracking-wider text-zinc-900 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-yellow-600" />
              <span>Surat Izin Mengemudi (SIM)</span>
            </h4>
            <p className="text-xs text-zinc-500">
              Pengingat masa berlaku SIM pribadi / operasional Anda
            </p>
          </div>

          <button
            onClick={() => setIsAddSimModalOpen(true)}
            className="flex items-center gap-1.5 py-2 px-3.5 bg-yellow-400 hover:bg-yellow-300 text-zinc-950 text-xs font-black rounded-xl transition shadow-xs cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>TAMBAH SIM</span>
          </button>
        </div>

        {/* List of SIM Cards (2 Columns on Desktop) */}
        {profile.licenses.length === 0 ? (
          <div className="p-8 bg-zinc-50 border-2 border-dashed border-zinc-200 rounded-3xl text-center text-zinc-400 text-xs">
            Belum ada data SIM terdaftar. Tekan tombol "+ Tambah SIM" untuk memasukkan SIM A, B, atau C.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {profile.licenses.map((sim) => {
              const daysLeft = getDaysUntilExpiry(sim.expiryDate);
              const isUrgent = daysLeft <= 30;

              return (
                <div
                  key={sim.id}
                  className={`bg-white rounded-3xl p-4 border-2 transition shadow-sm space-y-3 relative overflow-hidden ${
                    isUrgent ? 'border-amber-400' : 'border-zinc-200'
                  }`}
                >
                  {/* Top SIM Card Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="px-3 py-1 bg-zinc-950 text-yellow-400 font-mono font-black text-xs rounded-lg shadow-sm">
                        {sim.simType}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-zinc-900 font-mono block">
                          No. {sim.simNumber}
                        </span>
                        <span className="text-[10px] text-zinc-400 block">{sim.issuingCity}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteSim(sim.id)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 transition cursor-pointer"
                      title="Hapus SIM"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* License Holder & Expiry details */}
                  <div className="bg-zinc-50 p-2.5 rounded-2xl border border-zinc-200/80 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-zinc-400 block font-medium">Nama Pemilik</span>
                      <span className="font-extrabold text-zinc-900">{sim.holderName}</span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-zinc-400 block font-medium">Berlaku Sampai</span>
                      <span className="font-mono font-black text-zinc-900">
                        {new Date(sim.expiryDate).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Countdown Status Pill */}
                  <div className={`p-2 rounded-xl flex items-center justify-between text-[11px] ${
                    isUrgent ? 'bg-amber-50 text-amber-950 border border-amber-300' : 'bg-emerald-50 text-emerald-950 border border-emerald-200'
                  }`}>
                    <div className="flex items-center gap-1.5">
                      {isUrgent ? (
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      ) : (
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      )}
                      <span className="font-bold">
                        {isUrgent ? 'Masa Berlaku Segera Habis!' : 'Status Masa Berlaku: Aman'}
                      </span>
                    </div>

                    <span className={`font-mono font-black px-2 py-0.5 rounded-full text-[10px] ${
                      isUrgent ? 'bg-amber-500 text-white animate-pulse' : 'bg-emerald-200 text-emerald-900'
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

      {/* MODAL TAMBAH SIM BARU */}
      {isAddSimModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white border-2 border-zinc-900 rounded-3xl p-5 shadow-2xl text-zinc-900">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-yellow-400 text-zinc-950">
                  <CreditCard className="w-4 h-4 stroke-[2.5]" />
                </div>
                <h3 className="font-black text-sm uppercase tracking-wider text-zinc-900">
                  Tambah Surat Izin Mengemudi
                </h3>
              </div>
              <button
                onClick={() => setIsAddSimModalOpen(false)}
                className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSim} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-zinc-800 mb-1">Tipe SIM</label>
                <select
                  value={simType}
                  onChange={(e) => setSimType(e.target.value as any)}
                  className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-zinc-900 font-bold focus:outline-none focus:border-zinc-900"
                >
                  <option value="SIM C">SIM C (Sepeda Motor s/d 250cc)</option>
                  <option value="SIM C1">SIM C1 (Sepeda Motor 250cc - 500cc)</option>
                  <option value="SIM A">SIM A (Mobil Pribadi / Penumpang)</option>
                  <option value="SIM B1">SIM B1 (Truk / Bus / Angkutan Barang)</option>
                  <option value="SIM B2">SIM B2 (Alat Berat / Gandengan)</option>
                  <option value="SIM D">SIM D (Penyandang Disabilitas)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-zinc-800 mb-1">Nomor SIM</label>
                <input
                  type="text"
                  placeholder="Contoh: 9402-1209-00214"
                  value={simNumber}
                  onChange={(e) => setSimNumber(e.target.value)}
                  className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-zinc-900 font-mono focus:outline-none focus:border-zinc-900"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-800 mb-1">Nama Pemilik (Sesuai KTP/SIM)</label>
                <input
                  type="text"
                  value={holderName}
                  onChange={(e) => setHolderName(e.target.value)}
                  className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-zinc-900 font-bold uppercase focus:outline-none focus:border-zinc-900"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-800 mb-1">Tanggal Kedaluwarsa SIM</label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-zinc-900 font-mono focus:outline-none focus:border-zinc-900"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-800 mb-1">Polda / Satpas Penerbit (Opsional)</label>
                <input
                  type="text"
                  placeholder="Contoh: Polda Metro Jaya / Polres Jaksel"
                  value={issuingCity}
                  onChange={(e) => setIssuingCity(e.target.value)}
                  className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-zinc-900 focus:outline-none focus:border-zinc-900"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 bg-zinc-950 hover:bg-zinc-800 text-white font-black uppercase tracking-wider text-xs rounded-xl transition shadow active:scale-95 cursor-pointer"
                >
                  Simpan Data SIM
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDIT DATA PROFIL */}
      {isEditProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white border-2 border-zinc-900 rounded-3xl p-5 shadow-2xl text-zinc-900">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-yellow-400 text-zinc-950">
                  <Edit3 className="w-4 h-4 stroke-[2.5]" />
                </div>
                <h3 className="font-black text-sm uppercase tracking-wider text-zinc-900">
                  Edit Informasi Profil
                </h3>
              </div>
              <button
                onClick={() => setIsEditProfileModalOpen(false)}
                className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-900 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-zinc-800 mb-1">Nama Lengkap Pemilik</label>
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder="Nama Lengkap Pemilik Akun"
                  className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-zinc-900 font-bold focus:outline-none focus:border-zinc-900"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-800 mb-1">Alamat Email</label>
                <input
                  type="email"
                  value={profileEmail}
                  onChange={(e) => setProfileEmail(e.target.value)}
                  placeholder="contoh@domain.com"
                  className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-zinc-900 focus:outline-none focus:border-zinc-900"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-800 mb-1">Nomor Telepon / WhatsApp</label>
                <input
                  type="text"
                  value={profilePhone}
                  onChange={(e) => setProfilePhone(e.target.value)}
                  placeholder="+62 812-3456-7890"
                  className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-zinc-900 font-mono focus:outline-none focus:border-zinc-900"
                  required
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 bg-zinc-950 hover:bg-zinc-800 text-white font-black uppercase tracking-wider text-xs rounded-xl transition shadow active:scale-95 cursor-pointer"
                >
                  Simpan Perubahan Profil
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
