import { SilatAthlete, MatchState, TournamentConfig } from '../types/silat';
import { generateMatchesFromAthletes } from '../utils/scheduleGenerator';

export const initialTournamentConfig: TournamentConfig = {
  tournamentName: 'KEJUARAAN PENCAK SILAT NASIONAL TAHUN 2026',
  location: 'Padepokan Pencak Silat Indonesia, TMII Jakarta',
  date: '12 Oktober 2026',
  arenaName: 'Gelanggang 1',
  leadRefereeName: 'Drs. H. Suwandi, M.Pd (Dewan Wasit Juri Internasional)',
  secretaryName: 'Ahmad Fauzan, S.Or (Sekretaris Pertandingan)',
  dewanNames: ['Drs. H. Suwandi, M.Pd', 'Ir. Bambang Trihatmojo', 'M. Irfan, S.Pd'],
  jurorsCountTanding: 3,
  jurorsCountSeni: 5,
  roundDurationTanding: 120,
  roundDurationSeni: 180,
  highContrast: true,
  theme: 'light',
  cityCreated: 'Jakarta',
  dateCreated: '12 Oktober 2026',
  eventTime: '08:00 - 18:00 WIB',
  leftLogoUrl: './jrzscoreutama.png',
  rightLogoUrl: '',
  leadRefereeSignature: 'Drs. H. Suwandi, M.Pd',
  secretarySignature: 'Ahmad Fauzan, S.Or',
  autoAdvanceMatch: false
};

export const initialAthletes: SilatAthlete[] = [
  // 1. TANDING PUTRA
  {
    id: 'ath-1',
    name: 'Muhammad Fadli Pratama',
    contingent: 'Jawa Barat',
    gender: 'PUTRA',
    category: 'TANDING',
    classGroup: 'Kelas C (55-60 kg)',
    weight: 58.2,
    ageGroup: 'DEWASA'
  },
  {
    id: 'ath-2',
    name: 'Bagus Setyawan',
    contingent: 'Jawa Timur',
    gender: 'PUTRA',
    category: 'TANDING',
    classGroup: 'Kelas C (55-60 kg)',
    weight: 57.8,
    ageGroup: 'DEWASA'
  },

  // 2. TANDING PUTRI
  {
    id: 'ath-3',
    name: 'Dewi Anggraini',
    contingent: 'Sumatera Utara',
    gender: 'PUTRI',
    category: 'TANDING',
    classGroup: 'Kelas C (55-60 kg)',
    weight: 56.4,
    ageGroup: 'DEWASA'
  },
  {
    id: 'ath-4',
    name: 'Rina Marlina',
    contingent: 'DKI Jakarta',
    gender: 'PUTRI',
    category: 'TANDING',
    classGroup: 'Kelas C (55-60 kg)',
    weight: 57.1,
    ageGroup: 'DEWASA'
  },

  // 3. JURUS TUNGGAL PUTRA
  {
    id: 'ath-5',
    name: 'Ilham Ramadhan',
    contingent: 'Sumatera Barat',
    gender: 'PUTRA',
    category: 'JURUS_TUNGGAL',
    classGroup: 'Tunggal Putra Baku',
    ageGroup: 'DEWASA'
  },
  {
    id: 'ath-6',
    name: 'Reza Kurniawan',
    contingent: 'Banten',
    gender: 'PUTRA',
    category: 'JURUS_TUNGGAL',
    classGroup: 'Tunggal Putra Baku',
    ageGroup: 'DEWASA'
  },

  // 4. JURUS TUNGGAL PUTRI
  {
    id: 'ath-7',
    name: 'Siti Nurhaliza Rahayu',
    contingent: 'DKI Jakarta',
    gender: 'PUTRI',
    category: 'JURUS_TUNGGAL',
    classGroup: 'Tunggal Putri Baku',
    ageGroup: 'DEWASA'
  },
  {
    id: 'ath-8',
    name: 'Putri Ayu Lestari',
    contingent: 'Jawa Barat',
    gender: 'PUTRI',
    category: 'JURUS_TUNGGAL',
    classGroup: 'Tunggal Putri Baku',
    ageGroup: 'DEWASA'
  },

  // 5. JURUS GANDA PUTRA
  {
    id: 'ath-9',
    name: 'Rian Ardiansyah & Dimas Bayu',
    contingent: 'Bali',
    gender: 'PUTRA',
    category: 'JURUS_GANDA',
    classGroup: 'Ganda Putra Senjata',
    ageGroup: 'DEWASA',
    teamMembers: ['Rian Ardiansyah', 'Dimas Bayu']
  },
  {
    id: 'ath-10',
    name: 'Hendra Pratama & Fikri Alamsyah',
    contingent: 'Jawa Tengah',
    gender: 'PUTRA',
    category: 'JURUS_GANDA',
    classGroup: 'Ganda Putra Senjata',
    ageGroup: 'DEWASA',
    teamMembers: ['Hendra Pratama', 'Fikri Alamsyah']
  },

  // 6. JURUS GANDA PUTRI
  {
    id: 'ath-11',
    name: 'Ratna Sari & Wulan Dari',
    contingent: 'Jawa Timur',
    gender: 'PUTRI',
    category: 'JURUS_GANDA',
    classGroup: 'Ganda Putri Senjata',
    ageGroup: 'DEWASA',
    teamMembers: ['Ratna Sari', 'Wulan Dari']
  },
  {
    id: 'ath-12',
    name: 'Melati Sukma & Dinda Kirana',
    contingent: 'Sumatera Selatan',
    gender: 'PUTRI',
    category: 'JURUS_GANDA',
    classGroup: 'Ganda Putri Senjata',
    ageGroup: 'DEWASA',
    teamMembers: ['Melati Sukma', 'Dinda Kirana']
  },

  // 7. JURUS REGU PUTRA
  {
    id: 'ath-13',
    name: 'Tim Regu Tapak Suci',
    contingent: 'DI Yogyakarta',
    gender: 'PUTRA',
    category: 'JURUS_REGU',
    classGroup: 'Regu Baku Putra',
    ageGroup: 'DEWASA',
    teamMembers: ['Andika Putra', 'Fajar Ramadhan', 'Gilang Prasetyo']
  },
  {
    id: 'ath-14',
    name: 'Tim Regu Merpati Putih',
    contingent: 'Jawa Barat',
    gender: 'PUTRA',
    category: 'JURUS_REGU',
    classGroup: 'Regu Baku Putra',
    ageGroup: 'DEWASA',
    teamMembers: ['Bayu Saputra', 'Galih Wicaksono', 'Dodi Kurnia']
  },

  // 8. JURUS REGU PUTRI
  {
    id: 'ath-15',
    name: 'Tim Regu Srikandi Nusantara',
    contingent: 'DKI Jakarta',
    gender: 'PUTRI',
    category: 'JURUS_REGU',
    classGroup: 'Regu Baku Putri',
    ageGroup: 'DEWASA',
    teamMembers: ['Nadia Safitri', 'Annisa Zahra', 'Tiara Maharani']
  },
  {
    id: 'ath-16',
    name: 'Tim Regu Melati Emas',
    contingent: 'Bali',
    gender: 'PUTRI',
    category: 'JURUS_REGU',
    classGroup: 'Regu Baku Putri',
    ageGroup: 'DEWASA',
    teamMembers: ['Ni Putu Sintia', 'Ni Kadek Arini', 'Ni Komang Ayu']
  },

  // 9. SOLO KREATIF PUTRA
  {
    id: 'ath-17',
    name: 'Arya Bima Perkasa',
    contingent: 'Kalimantan Timur',
    gender: 'PUTRA',
    category: 'SOLO_KREATIF',
    classGroup: 'Solo Kreatif Putra',
    ageGroup: 'DEWASA'
  },
  {
    id: 'ath-18',
    name: 'Gilang Ramadan',
    contingent: 'Sulawesi Selatan',
    gender: 'PUTRA',
    category: 'SOLO_KREATIF',
    classGroup: 'Solo Kreatif Putra',
    ageGroup: 'DEWASA'
  },

  // 10. SOLO KREATIF PUTRI
  {
    id: 'ath-19',
    name: 'Anisa Maharani',
    contingent: 'Jawa Tengah',
    gender: 'PUTRI',
    category: 'SOLO_KREATIF',
    classGroup: 'Solo Kreatif Putri',
    ageGroup: 'REMAJA'
  },
  {
    id: 'ath-20',
    name: 'Cindy Claudia',
    contingent: 'Papua',
    gender: 'PUTRI',
    category: 'SOLO_KREATIF',
    classGroup: 'Solo Kreatif Putri',
    ageGroup: 'REMAJA'
  }
];

export const initialMatches: MatchState[] = (() => {
  const generated = generateMatchesFromAthletes(initialAthletes, initialTournamentConfig);
  if (generated.length > 0) {
    generated[0].status = 'ONGOING';
  }
  return generated;
})();

export const INITIAL_BRACKET_MATCHES: any[] = [];
export const PESILAT_SAMPEL: any[] = [];
