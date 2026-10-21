import type { ChatSession, AiSettings } from '../types/chat';

export const DEFAULT_AI_SETTINGS: AiSettings = {
  selectedModel: 'gemini-2.5-flash',
  apiKey: '',
  systemPromptPreset: 'fleet-expert',
};

export const INITIAL_CHAT_SESSIONS: ChatSession[] = [
  {
    id: 'session-1',
    title: 'Analisis Servis Honda Vario 2015',
    lastMessage: 'V-Belt Anda tersisa 12%, segera lakukan penggantian...',
    updatedAt: '10:45 AM',
    messages: [
      {
        id: 'msg-1',
        sender: 'user',
        text: 'Halo, motor saya Honda Vario 125 tahun 2015, odometernya sudah di 42.850 KM. Komponen apa saja yang wajib saya servis sekarang?',
        timestamp: '10:42 AM',
      },
      {
        id: 'msg-2',
        sender: 'ai',
        text: 'Halo! Berdasarkan data armada untuk **Honda Vario 125 eSP (2015)** pada jarak tempuh **42.850 KM**, berikut rekomendasi servis mendesak:\n\n1. ⚠️ **V-Belt & Roller CVT (Kritis - sisa 12%)**: Interval penggantian pabrikan tiap 24.000 KM. Karena terakhir diganti pada 22.000 KM, sekarang sudah berjalan 20.850 KM. Sangat dianjurkan ganti sekarang sebelum putus mendadak di jalan.\n2. 🔧 **Oli Mesin**: Sisa toleransi tinggal ~200 KM lagi (disarankan ganti bersamaan dengan servis CVT).\n3. ✅ **Oli Gardan & Kampas Rem**: Masih dalam kondisi optimal (sisa >45%).\n\nApakah Anda ingin saya catatkan jadwal pengingat ke bengkel akhir pekan ini?',
        timestamp: '10:43 AM',
      },
    ],
  },
  {
    id: 'session-2',
    title: 'Scan Struk BBM & Odometer Gran Max',
    lastMessage: 'Konsumsi tercatat 11.8 km/L (Normal untuk muatan kargo)',
    updatedAt: 'Kemarin',
    messages: [
      {
        id: 'msg-3',
        sender: 'user',
        text: 'Tolong hitungkan konsumsi BBM Gran Max dari struk dan odometer ini.',
        timestamp: 'Kemarin 16:30',
        attachment: {
          type: 'image',
          url: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=600&auto=format&fit=crop&q=80',
          name: 'struk_spbu_pertalite.jpg',
        },
      },
      {
        id: 'msg-4',
        sender: 'ai',
        text: 'Hasil pembacaan struk SPBU:\n• **Jenis BBM**: Pertalite\n• **Volume**: 32.5 Liter\n• **Total Biaya**: Rp 325.000\n• **Odometer Sekarang**: 86.420 KM\n\n📊 **Analisis Rasio Konsumsi**:\nJarak tempuh sejak isi terakhir adalah 383.5 KM. Efisiensi tercatat **11.8 km/Liter**. Angka ini tergolong normal dan hemat untuk kendaraan kargo berbobot 1 ton di rute dalam kota.',
        timestamp: 'Kemarin 16:31',
      },
    ],
  },
  {
    id: 'session-3',
    title: 'Konsultasi Ban Tubeless Bocor',
    lastMessage: 'Pastikan tambal tip top dari dalam jika lubang samping...',
    updatedAt: '15 Okt',
    messages: [
      {
        id: 'msg-5',
        sender: 'user',
        text: 'Ban belakang Vario kena paku di Fatmawati, baiknya ditambal cacing atau diganti ban baru?',
        timestamp: '15 Okt 14:10',
      },
      {
        id: 'msg-6',
        sender: 'ai',
        text: 'Jika lubang paku berada di telapak ban tengah dan ukuran paku kecil, tambal cacing darurat aman untuk sementara. Namun untuk keamanan jangka panjang armada roda dua, disarankan tambal metode **Tip-Top (press dingin dari dalam ban)** agar serat kawat ban tidak putus.',
        timestamp: '15 Okt 14:12',
      },
    ],
  },
];
