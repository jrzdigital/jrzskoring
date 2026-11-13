export interface KudaKuda {
  id: string;
  nama: string;
  kategori: string;
  deskripsi: string;
  distribusiBeban: {
    kiri: number; // percentage
    kanan: number; // percentage
    fokus: 'Kaki Depan' | 'Kaki Belakang' | 'Imbang 50:50' | 'Kaki Samping' | 'Kaki Tumpu Silang';
  };
  sudutLutut: string;
  stabilitas: number; // 1 - 100
  mobilitas: number; // 1 - 100
  tujuanTaktis: string;
  langkah: string[];
  kesalahanUmum: string[];
  posisiKaki: {
    kiriX: number;
    kiriY: number;
    kiriRotasi: number;
    kananX: number;
    kananY: number;
    kananRotasi: number;
    pusatGravitasiX: number;
    pusatGravitasiY: number;
  };
}

export interface PolaLangkah {
  id: string;
  nama: string;
  arti: string;
  deskripsi: string;
  kegunaan: string;
  titikLangkah: { x: number; y: number; urutan: number; label: string }[];
}

export interface TeknikSerangan {
  id: string;
  nama: string;
  kategori: 'pukulan' | 'tendangan' | 'tangkisan' | 'elakan' | 'bantingan';
  namaAlternatif?: string;
  poinIpsi: number;
  deskripsi: string;
  targetSasaran: string;
  langkahGerakan: string[];
  kunciKeberhasilan: string;
}

export interface GerakanJurus {
  nomor: number;
  nama: string;
  kategori: 'Tangan Kosong' | 'Golok' | 'Toya';
  arah: string;
  durasiDetik: number;
  deskripsi: string;
  fokusPoin: string;
  kudaKuda: string;
}

export interface SenjataPusaka {
  id: string;
  nama: string;
  daerahAsal: string;
  deskripsi: string;
  material: string;
  caraGenggam: string;
  filosofi: string;
  karakteristik: string;
}

export interface PerguruanSilat {
  id: string;
  nama: string;
  singkatan: string;
  tahunBerdiri: string;
  pusat: string;
  pendiri: string;
  semboyan: string;
  karakterKhas: string;
  maknaLambang: string;
}

export interface SoalKuis {
  id: number;
  pertanyaan: string;
  pilihan: string[];
  jawabanBenar: number; // 0-based index
  penjelasan: string;
}

// 1. DAFTAR KUDA-KUDA
export const KUDA_KUDA_LIST: KudaKuda[] = [
  {
    id: 'kuda-kuda-depan',
    nama: 'Kuda-Kuda Depan',
    kategori: 'Pondasi Dasar Serang',
    deskripsi: 'Posisi kuda-kuda dengan kaki depan ditekuk membentuk sudut 90 derajat sementara kaki belakang lurus dan kokoh mencengkeram tanah.',
    distribusiBeban: {
      kiri: 70,
      kanan: 30,
      fokus: 'Kaki Depan'
    },
    sudutLutut: '90° pada lutut depan, 160° pada lutut belakang',
    stabilitas: 85,
    mobilitas: 70,
    tujuanTaktis: 'Melancarkan serangan lurus, dorongan tenaga penuh, serta menahan tekanan mendadak dari depan.',
    langkah: [
      'Langkahkan satu kaki ke depan sepanjang 2-3 telapak kaki.',
      'Tekuk lutut kaki depan hingga sejajar dengan ujung jari kaki.',
      'Luruskan kaki belakang dan rapatkan tumit ke lantai menghadap serong 30°.',
      'Condongkan badan sedikit ke depan, pusatkan 70% beban pada paha depan.'
    ],
    kesalahanUmum: [
      'Lutut kaki depan melewati ujung jari kaki sehingga membebani sendi patela.',
      'Tumit kaki belakang terangkat dari lantai mengurangi cengkeraman bumi.',
      'Badan terlalu membungkuk sehingga kehilangan keseimbangan vertikal.'
    ],
    posisiKaki: {
      kiriX: 120,
      kiriY: 60,
      kiriRotasi: 0,
      kananX: 180,
      kananY: 200,
      kananRotasi: 30,
      pusatGravitasiX: 135,
      pusatGravitasiY: 100
    }
  },
  {
    id: 'kuda-kuda-belakang',
    nama: 'Kuda-Kuda Belakang',
    kategori: 'Pondasi Bertahan & Balas',
    deskripsi: 'Posisi bertahan dengan kaki belakang ditekuk menahan mayoritas beban tubuh, kaki depan ringan menyentuh tanah siap mengecoh atau menendang seketika.',
    distribusiBeban: {
      kiri: 30,
      kanan: 70,
      fokus: 'Kaki Belakang'
    },
    sudutLutut: '80° pada lutut belakang, 140° pada lutut depan',
    stabilitas: 80,
    mobilitas: 85,
    tujuanTaktis: 'Menarik diri dari jangkauan serangan lawan tanpa mundur jauh, serta mempersiapkan tendangan sabit/depan mendadak dengan kaki depan.',
    langkah: [
      'Tarik kaki depan mendekat, buka kaki selebar bahu.',
      'Tekuk lutut kaki belakang dan turunkan pinggul ke bawah.',
      'Kaki depan rileks dan hanya bertumpu pada ujung telapak kaki.',
      'Beban 70% berada pada paha belakang untuk menjaga pegas pantul.'
    ],
    kesalahanUmum: [
      'Beban terlalu banyak di depan sehingga kaki depan tidak fleksibel untuk menendang.',
      'Pinggul condong miring keluar merusak pusat keseimbangan.',
      'Punggung bungkuk ke depan.'
    ],
    posisiKaki: {
      kiriX: 130,
      kiriY: 80,
      kiriRotasi: 15,
      kananX: 170,
      kananY: 210,
      kananRotasi: 45,
      pusatGravitasiX: 160,
      pusatGravitasiY: 170
    }
  },
  {
    id: 'kuda-kuda-tengah',
    nama: 'Kuda-Kuda Tengah',
    kategori: 'Pondasi Daya Tahan Terkuat',
    deskripsi: 'Kedua kaki dibuka lebar melebihi bahu, kedua lutut ditekuk sejajar paha membentuk sudut 90 derajat, menyatukan pusat tenaga ke ulu hati dan bumi.',
    distribusiBeban: {
      kiri: 50,
      kanan: 50,
      fokus: 'Imbang 50:50'
    },
    sudutLutut: '90° pada kedua lutut simetris',
    stabilitas: 98,
    mobilitas: 45,
    tujuanTaktis: 'Menahan bantingan, melatih tenaga dalam dan kekuatan otot quadriceps, serta memusatkan kestabilan saat pertarungan jarak rapat.',
    langkah: [
      'Buka kedua kaki selebar dua kali lebar bahu.',
      'Tekuk kedua lutut serentak hingga paha sejajar dengan tanah.',
      'Punggung tegak lurus, pandangan fokus ke depan, kedua tangan siaga.',
      'Beban seimbang 50% di kaki kiri dan 50% di kaki kanan.'
    ],
    kesalahanUmum: [
      'Kedua lutut menekuk ke dalam (valgus) berbahaya bagi ligamen.',
      'Badan membungkuk condong ke depan.',
      'Posisi paha terlalu tinggi (kurang turun).'
    ],
    posisiKaki: {
      kiriX: 70,
      kiriY: 140,
      kiriRotasi: 0,
      kananX: 230,
      kananY: 140,
      kananRotasi: 0,
      pusatGravitasiX: 150,
      pusatGravitasiY: 140
    }
  },
  {
    id: 'kuda-kuda-samping',
    nama: 'Kuda-Kuda Samping',
    kategori: 'Pondasi Menghindar & Sudut',
    deskripsi: 'Satu kaki ditekuk ke samping menopang berat tubuh, sedangkan kaki lainnya lurus menyamping membentuk garis pertahanan diagonal.',
    distribusiBeban: {
      kiri: 80,
      kanan: 20,
      fokus: 'Kaki Samping'
    },
    sudutLutut: '90° pada satu lutut samping, 175° pada kaki lurus',
    stabilitas: 82,
    mobilitas: 78,
    tujuanTaktis: 'Menghindari tusukan atau tendangan lurus lawan dengan menggeser titik berat ke samping sambil mempersiapkan serangan balik.',
    langkah: [
      'Buka kaki ke samping lebar-lebar.',
      'Tekuk salah satu lutut (kiri atau kanan) ke arah samping.',
      'Kaki yang satunya tetap lurus menjejak lantai dengan telapak rapat.',
      'Jaga pinggul sejajar dan tidak terputar secara berlebihan.'
    ],
    kesalahanUmum: [
      'Kaki yang lurus terangkat tepi telapak kakinya.',
      'Tubuh terlalu condong miring ke samping melebihi tumpuan lutut.'
    ],
    posisiKaki: {
      kiriX: 60,
      kiriY: 140,
      kiriRotasi: -30,
      kananX: 240,
      kananY: 140,
      kananRotasi: 15,
      pusatGravitasiX: 95,
      pusatGravitasiY: 140
    }
  },
  {
    id: 'kuda-kuda-silang-depan',
    nama: 'Kuda-Kuda Silang Depan',
    kategori: 'Pola Transisi Penetrasi',
    deskripsi: 'Kaki dilangkahkan menyilang ke depan melewati kaki tumpuan dengan tumpuan berat di kaki depan, memotong ruang gerak lawan.',
    distribusiBeban: {
      kiri: 65,
      kanan: 35,
      fokus: 'Kaki Tumpu Silang'
    },
    sudutLutut: '100° kaki depan menyilang, 120° kaki belakang',
    stabilitas: 70,
    mobilitas: 92,
    tujuanTaktis: 'Manuver terobosan cepat menusuk pertahanan samping lawan atau transisi melancarkan sapuan dan guntingan.',
    langkah: [
      'Langkahkan satu kaki menyilang ke depan di depan kaki tumpuan.',
      'Kedua lutut sedikit tertekuk lentur.',
      'Tumit kaki belakang sedikit terangkat untuk pegas putaran.',
      'Pinggul terkunci fleksibel menghadap sasaran.'
    ],
    kesalahanUmum: [
      'Langkah silang terlalu jauh sehingga kaki mengunci satu sama lain.',
      'Keseimbangan goyah karena kedua telapak sejajar lurus tanpa celah.'
    ],
    posisiKaki: {
      kiriX: 165,
      kiriY: 90,
      kiriRotasi: 20,
      kananX: 135,
      kananY: 170,
      kananRotasi: 40,
      pusatGravitasiX: 155,
      pusatGravitasiY: 115
    }
  },
  {
    id: 'kuda-kuda-silang-belakang',
    nama: 'Kuda-Kuda Silang Belakang',
    kategori: 'Pola Kelit & Kuncian',
    deskripsi: 'Satu kaki menyilang ke belakang kaki tumpuan dengan bertumpu pada ujung telapak kaki, menciptakan poros putaran tubuh 180° instan.',
    distribusiBeban: {
      kiri: 75,
      kanan: 25,
      fokus: 'Kaki Tumpu Silang'
    },
    sudutLutut: '90° pada kaki tumpu depan, 110° kaki silang belakang',
    stabilitas: 68,
    mobilitas: 95,
    tujuanTaktis: 'Melakukan elakan putar (kelit), mengambil sudut mati lawan, atau menyiapkan tendangan belakang berputar (spinning back kick).',
    langkah: [
      'Silangkan satu kaki ke belakang kaki tumpuan.',
      'Kaki depan ditekuk menopang 75% berat badan.',
      'Kaki belakang bertumpu pada jinjit ujung jari kaki.',
      'Tubuh siap memutar badan ke arah punggung lawan.'
    ],
    kesalahanUmum: [
      'Menumpangkan telapak kaki belakang secara penuh sehingga tidak bisa memutar cepat.',
      'Pusat gravitasi jatuh ke belakang.'
    ],
    posisiKaki: {
      kiriX: 140,
      kiriY: 90,
      kiriRotasi: 10,
      kananX: 170,
      kananY: 175,
      kananRotasi: 60,
      pusatGravitasiX: 145,
      pusatGravitasiY: 110
    }
  }
];

// 2. POLA LANGKAH
export const POLA_LANGKAH_LIST: PolaLangkah[] = [
  {
    id: 'langkah-lurus',
    nama: 'Langkah Lurus',
    arti: 'Maju/mundur dalam garis sumbu lurus',
    deskripsi: 'Pola gerak maju lurus atau mundur teratur dengan menjaga jarak kuda-kuda konstan.',
    kegunaan: 'Penetrasi frontal atau menarik lawan ke dalam perangkap serangan balik.',
    titikLangkah: [
      { x: 150, y: 220, urutan: 1, label: 'Posisi Awal' },
      { x: 150, y: 140, urutan: 2, label: 'Langkah 1' },
      { x: 150, y: 60, urutan: 3, label: 'Langkah 2' }
    ]
  },
  {
    id: 'langkah-zigzag',
    nama: 'Langkah Zig-Zag (Gergaji)',
    arti: 'Gerak serong diagonal membentuk gigi gergaji',
    deskripsi: 'Langkah menyudut 45 derajat bergantian ke kiri dan kanan, mengelabui garis bidik lawan.',
    kegunaan: 'Mendekati lawan yang bertipe defensif atau menghindari serangan lurus frontal.',
    titikLangkah: [
      { x: 150, y: 220, urutan: 1, label: 'Mulai' },
      { x: 80, y: 150, urutan: 2, label: 'Serong Kiri' },
      { x: 220, y: 100, urutan: 3, label: 'Serong Kanan' },
      { x: 150, y: 40, urutan: 4, label: 'Tutup Serang' }
    ]
  },
  {
    id: 'langkah-segitiga',
    nama: 'Langkah Segitiga',
    arti: 'Melangkah menyusuri tiga sudut penjuru segitiga',
    deskripsi: 'Gerakan berpijak pada sudut segitiga sama sisi atau siku-siku, sangat kental pada aliran Minang & Betawi.',
    kegunaan: 'Mengunci sudut mati lawan dan meloloskan diri dari kepungan sudut sempit.',
    titikLangkah: [
      { x: 150, y: 60, urutan: 1, label: 'Puncak Depan' },
      { x: 80, y: 200, urutan: 2, label: 'Sudut Kiri' },
      { x: 220, y: 200, urutan: 3, label: 'Sudut Kanan' },
      { x: 150, y: 60, urutan: 4, label: 'Kembali Kunci' }
    ]
  },
  {
    id: 'langkah-ladam',
    nama: 'Langkah Ladam (Huruf U)',
    arti: 'Gerak melengkung seperti tapal kuda',
    deskripsi: 'Langkah memutar melingkari titik tengah pertarungan secara melingkar setengah lingkaran.',
    kegunaan: 'Mengitari pertahanan lawan mencari celah rusuk atau punggung tanpa kontak langsung.',
    titikLangkah: [
      { x: 70, y: 60, urutan: 1, label: 'Titik Awal' },
      { x: 70, y: 180, urutan: 2, label: 'Tarik Bawah' },
      { x: 150, y: 220, urutan: 3, label: 'Lengkung Dasar' },
      { x: 230, y: 180, urutan: 4, label: 'Naik Sisi' },
      { x: 230, y: 60, urutan: 5, label: 'Sudut Sayap' }
    ]
  },
  {
    id: 'langkah-huruf-s',
    nama: 'Langkah Huruf S',
    arti: 'Langkah mengalir dinamis dua kurva berlawanan',
    deskripsi: 'Pola langkah fleksibel berbentuk huruf S dengan memutar poros pinggul secara kontinu.',
    kegunaan: 'Membongkar perangkap kuncian dan mengecoh arah serang dalam tempo cepat.',
    titikLangkah: [
      { x: 90, y: 50, urutan: 1, label: 'Kurva Atas 1' },
      { x: 190, y: 90, urutan: 2, label: 'Kurva Atas 2' },
      { x: 150, y: 140, urutan: 3, label: 'Titik Poros S' },
      { x: 90, y: 180, urutan: 4, label: 'Kurva Bawah 1' },
      { x: 210, y: 220, urutan: 5, label: 'Penyelesaian' }
    ]
  }
];

// 3. TEKNIK SERANGAN & PEMBELAAN
export const TEKNIK_SERANGAN_LIST: TeknikSerangan[] = [
  // Pukulan
  {
    id: 'pukulan-lurus',
    nama: 'Pukulan Lurus (Tinju Depan)',
    kategori: 'pukulan',
    poinIpsi: 1,
    deskripsi: 'Pukulan tangan mengepal yang diluncurkan lurus ke depan sejajar bahu dengan rotasi kepalan saat perkenaan sasaran.',
    targetSasaran: 'Dada lawan, ulu hati, atau pelindung badan (body protector)',
    langkahGerakan: [
      'Mulai dari sikap pasang dengan kepalan di samping pinggang.',
      'Hentakkan tinju lurus ke depan bersama dorongan pinggul.',
      'Putar kepalan 90° tepat sebelum menyentuh sasaran.',
      'Tarik tangan kembali dengan cepat ke posisi siaga.'
    ],
    kunciKeberhasilan: 'Gunakan dorongan pinggul dan putaran poros bahu, bukan hanya otot bisep.'
  },
  {
    id: 'pukulan-bandul',
    nama: 'Pukulan Bandul (Senggol/Uppercut)',
    kategori: 'pukulan',
    poinIpsi: 1,
    deskripsi: 'Lintasan pukulan mengayun dari bawah ke atas dengan siku ditekuk membentuk sudut 90 derajat.',
    targetSasaran: 'Ulu hati atau dagu lawan dalam jarak rapat.',
    langkahGerakan: [
      'Turunkan sedikit kepalan tangan di samping pinggang.',
      'Ayunkan kepalan melengkung dari bawah ke atas.',
      'Kunci sudut siku kokoh saat benturan.',
      'Tangan yang lain melindungi pelipis dan dada.'
    ],
    kunciKeberhasilan: 'Lenturan lutut memberi daya angkat ke atas yang dahsyat.'
  },
  {
    id: 'pukulan-tebak',
    nama: 'Pukulan Tebak (Dorong Telapak Tangan)',
    kategori: 'pukulan',
    poinIpsi: 1,
    deskripsi: 'Serangan menggunakan telapak tangan terbuka dengan tumit tangan menghantam telak.',
    targetSasaran: 'Dada tengah dan pelindung badan.',
    langkahGerakan: [
      'Buka jari-jari rapat melengkung sedikit.',
      'Dorong kuat dengan tumit telapak tangan.',
      'Hentakkan seluruh bobot tubuh ke depan.'
    ],
    kunciKeberhasilan: 'Menghasilkan daya tolak yang mampu menghempaskan keseimbangan lawan.'
  },

  // Tendangan
  {
    id: 'tendangan-lurus',
    nama: 'Tendangan Lurus (Depan)',
    kategori: 'tendangan',
    poinIpsi: 2,
    deskripsi: 'Tendangan dengan hentakan lurus ke depan menggunakan ujung telapak kaki atau tumit.',
    targetSasaran: 'Ulu hati atau dada (body protector).',
    langkahGerakan: [
      'Angkat lutut setinggi dada terlebih dahulu.',
      'Hentakkan tungkai bawah lurus ke depan.',
      'Perkenaan pada pangkal jari kaki atau telapak kaki.',
      'Tarik kaki kembali dengan cepat sebelum ditangkap lawan.'
    ],
    kunciKeberhasilan: 'Chambering (mengangkat lutut terlebih dahulu) mutlak agar tendangan bertenaga dan tidak mudah ditangkap.'
  },
  {
    id: 'tendangan-sabit',
    nama: 'Tendangan Sabit (Busur Melingkar)',
    kategori: 'tendangan',
    poinIpsi: 2,
    deskripsi: 'Tendangan melengkung dari samping seperti sabit dengan perkenaan punggung telapak kaki.',
    targetSasaran: 'Rusuk atau pinggang samping lawan pada pelindung sah.',
    langkahGerakan: [
      'Putar kaki tumpu 90°-135° ke arah luar.',
      'Ayunkan kaki serang melengkung setinggi rusuk.',
      'Hantam sasaran dengan punggung telapak kaki.',
      'Kembali ke posisi pasang.'
    ],
    kunciKeberhasilan: 'Putaran kaki tumpu membuka panggul untuk jangkauan dan kecepatan optimal.'
  },
  {
    id: 'tendangan-t',
    nama: 'Tendangan T (Side Piercing Kick)',
    kategori: 'tendangan',
    poinIpsi: 2,
    deskripsi: 'Ciri khas bela diri Silat, tubuh menyamping membentuk huruf T dengan hentakan pisau kaki atau tumit.',
    targetSasaran: 'Dada dan rusuk lawan, sering digunakan memotong serangan masuk lawan.',
    langkahGerakan: [
      'Angkat lutut menyamping ke arah dada.',
      'Dorong telapak kaki lurus ke samping dengan pisau telapak kaki mencuat.',
      'Luruskan garis pinggul, lutut, dan tumit sejajar.',
      'Tarik kembali ke sikap pasang.'
    ],
    kunciKeberhasilan: 'Pisau kaki (sisi luar telapak kaki) menghunjam tajam menahan laju serang musuh.'
  },
  {
    id: 'tendangan-belakang',
    nama: 'Tendangan Belakang (Back Kick)',
    kategori: 'tendangan',
    poinIpsi: 2,
    deskripsi: 'Tendangan dengan memutar tubuh dan melesakkan tumit ke belakang dengan daya dorong luar biasa.',
    targetSasaran: 'Dada pelindung lawan.',
    langkahGerakan: [
      'Putar badan membelakangi lawan secara sekilas.',
      'Tengok lewat bahu untuk membidik sasaran.',
      'Lontarkan tumit lurus ke belakang.',
      'Mendarat kembali dengan kontrol penuh.'
    ],
    kunciKeberhasilan: 'Kepala menoleh membidik sebelum tendangan lepas agar akurat.'
  },

  // Tangkisan
  {
    id: 'tangkisan-luar',
    nama: 'Tangkisan Luar',
    kategori: 'tangkisan',
    poinIpsi: 1, // Jika dibalas serangan sah
    deskripsi: 'Menangkis serangan lawan dari arah dalam tubuh dibuang ke arah luar.',
    targetSasaran: 'Menepis pukulan lurus atau tebakan lawan.',
    langkahGerakan: [
      'Gerakkan lengan bawah dari dada ke arah luar samping.',
      'Lengan membentuk sudut siku 90 derajat.',
      'Tangan lain tetap menutup pertahanan wajah.'
    ],
    kunciKeberhasilan: 'Gunakan tulang hasta bagian luar sebagai perisai penepis.'
  },
  {
    id: 'tangkisan-dalam',
    nama: 'Tangkisan Dalam',
    kategori: 'tangkisan',
    poinIpsi: 1,
    deskripsi: 'Menangkis serangan lawan dari arah luar tubuh ditarik ke dalam melintasi garis tengah.',
    targetSasaran: 'Menangkis pukulan yang mengarah ke rusuk atau dada samping.',
    langkahGerakan: [
      'Tarik lengan dari samping luar menuju ke dalam dada.',
      'Gunakan putaran pergelangan tangan untuk membelokkan arah hantaman.',
      'Segera siapkan tangan satu lagi untuk serangan balasan.'
    ],
    kunciKeberhasilan: 'Membelokkan arah pukulan lawan alih-alih menabraknya keras.'
  },
  {
    id: 'tangkisan-atas',
    nama: 'Tangkisan Atas',
    kategori: 'tangkisan',
    poinIpsi: 1,
    deskripsi: 'Lengan diangkat ke atas melindungi kepala dari serangan tebasan atau pukulan atas.',
    targetSasaran: 'Menahan serangan kepala dari arah atas.',
    langkahGerakan: [
      'Angkat lengan menyilang naik ke atas kepala.',
      'Posisikan lengan membentuk sudut miring 45° agar serangan lawan meleset meluncur.',
      'Kuda-kuda diperkokoh.'
    ],
    kunciKeberhasilan: 'Sudut kemiringan lengan mencegah benturan langsung tegak lurus pada tulang.'
  },
  {
    id: 'tangkisan-bawah',
    nama: 'Tangkisan Bawah (Gedik)',
    kategori: 'tangkisan',
    poinIpsi: 1,
    deskripsi: 'Menepis tendangan atau pukulan bawah dengan menyapu lengan ke arah bawah.',
    targetSasaran: 'Menepis tendangan lurus atau gejug ke arah perut.',
    langkahGerakan: [
      'Ayunkan lengan lurus ke bawah menyilang paha.',
      'Tepis kaki lawan ke arah samping.',
      'Buka jalan untuk serangan balik.'
    ],
    kunciKeberhasilan: 'Lengan jangan terlalu jauh ke bawah agar muka tidak terbuka.'
  },

  // Bantingan & Guntingan
  {
    id: 'bantingan-tangkapan',
    nama: 'Bantingan Tangkapan Kaki',
    kategori: 'bantingan',
    poinIpsi: 3,
    deskripsi: 'Menangkap tendangan lawan (sabitan/lurus), menjepit kaki lawan di ketiak, lalu menyapu kaki tumpunya hingga roboh sah.',
    targetSasaran: 'Menjatuhkan lawan dalam gelanggang tanpa melanggar batas matras.',
    langkahGerakan: [
      'Sambut tendangan lawan dengan elakan dan jepitan lengan.',
      'Kunci kaki lawan di bawah ketiak dengan erat.',
      'Maju melangkah masuk ke dalam titik tumpu lawan.',
      'Sapu kaki tumpu lawan dengan kaki belakang sambil mendorong bahu lawan hingga jatuh telentang.'
    ],
    kunciKeberhasilan: 'Gerakan menjepit dan menyapu harus dalam satu rangkaian tanpa jeda lebih dari 5 detik.'
  },
  {
    id: 'guntingan-bawah',
    nama: 'Guntingan Bawah',
    kategori: 'bantingan',
    poinIpsi: 3,
    deskripsi: 'Teknik menjatuhkan lawan dengan menjepit kedua kaki pada kaki tumpu lawan menyerupai mekanisme gunting.',
    targetSasaran: 'Kaki lawan untuk menghasilkan jatuhan spektakuler.',
    langkahGerakan: [
      'Jatuhkan tubuh ke lantai dengan tumpuan tangan.',
      'Satu kaki menyilang di depan betis lawan dan satu kaki mengunci di belakang lutut lawan.',
      'Kepit kedua kaki serempak berlawanan arah.',
      'Lawan kehilangan tumpuan dan jatuh ke matras.'
    ],
    kunciKeberhasilan: 'Keberanian dan kecepatan turun ke lantai dengan penempatan kedua kaki yang akurat.'
  }
];

// 4. JURUS TUNGGAL BAKU IPSI (Official movements summary)
export const JURUS_TUNGGAL_LIST: GerakanJurus[] = [
  // Tangan Kosong (7 Jurus)
  {
    nomor: 1,
    nama: 'Sikap Pasang 1 & Hormat Pesilat',
    kategori: 'Tangan Kosong',
    arah: 'Depan (Utara)',
    durasiDetik: 8,
    deskripsi: 'Berdiri tegak menghadap ketua pertandingan, merapatkan kedua telapak tangan di dada menghormat, lalu membuka kuda-kuda depan tegap.',
    fokusPoin: 'Ketegasan sikap, keselarasan nafas, keheningan batin.',
    kudaKuda: 'Kuda-Kuda Depan'
  },
  {
    nomor: 2,
    nama: 'Pukulan Lurus Ganda & Tangkisan Luar',
    kategori: 'Tangan Kosong',
    arah: 'Serong Kanan (Timur Laut)',
    durasiDetik: 10,
    deskripsi: 'Meluncurkan pukulan lurus kanan disusul kiri dengan irama dinamis, dilanjutkan tangkisan luar menepis serangan imajiner.',
    fokusPoin: 'Ketepatan sasaran dan ledakan tenaga (power burst).',
    kudaKuda: 'Kuda-Kuda Tengah & Samping'
  },
  {
    nomor: 3,
    nama: 'Tendangan Depan & Sikap Garuda',
    kategori: 'Tangan Kosong',
    arah: 'Kiri (Barat)',
    durasiDetik: 12,
    deskripsi: 'Tendangan lurus tinggi dengan tarikan cepat, mendarat pada kuda-kuda satu kaki membuka tangan menyerupai sayap garuda.',
    fokusPoin: 'Keseimbangan satu kaki dan kestabilan tubuh tanpa goyang.',
    kudaKuda: 'Kuda-Kuda Khusus Satu Kaki'
  },
  {
    nomor: 4,
    nama: 'Tangkisan Bawah & Pukulan Bandul Ulu Hati',
    kategori: 'Tangan Kosong',
    arah: 'Belakang (Selatan)',
    durasiDetik: 11,
    deskripsi: 'Memutar poros 180 derajat menepis tendangan rendah dengan tangkisan gedik, lalu membalas seketika dengan pukulan bandul dari bawah.',
    fokusPoin: 'Kecepatan putaran poros dan kelenturan pinggul.',
    kudaKuda: 'Kuda-Kuda Belakang'
  },
  {
    nomor: 5,
    nama: 'Tendangan Sabit Busur & Tangkisan Siku',
    kategori: 'Tangan Kosong',
    arah: 'Depan Kanan',
    durasiDetik: 12,
    deskripsi: 'Melesakkan tendangan busur sabit melingkar dengan punggung kaki, mendarat cepat dengan perisai tangkisan siku.',
    fokusPoin: 'Ketinggian tendangan minimal setinggi dada.',
    kudaKuda: 'Kuda-Kuda Samping'
  },
  {
    nomor: 6,
    nama: 'Kuda-Kuda Silang & Sapuan Kaki Rebah',
    kategori: 'Tangan Kosong',
    arah: 'Bawah Lingkar',
    durasiDetik: 14,
    deskripsi: 'Langkah silang merendah ke lantai, melakukan sapuan kaki 360 derajat rebah menyapu lantai dengan keanggunan seni.',
    fokusPoin: 'Kelenturan tungkai dan keindahan aliran gerak.',
    kudaKuda: 'Kuda-Kuda Silang Rebah'
  },
  {
    nomor: 7,
    nama: 'Kuncian Tangan & Penutupan Tangan Kosong',
    kategori: 'Tangan Kosong',
    arah: 'Depan (Utara)',
    durasiDetik: 10,
    deskripsi: 'Merapatkan kedua tangan dalam simulasi mematahkan kuncian, diakhiri dengan sikap pasang tegak dan hembusan nafas pengendapan.',
    fokusPoin: 'Ketegasan akhir dan jeda transisi ke senjata.',
    kudaKuda: 'Kuda-Kuda Depan Tegak'
  },

  // Senjata Golok
  {
    nomor: 8,
    nama: 'Penghormatan & Pengambilan Golok',
    kategori: 'Golok',
    arah: 'Depan',
    durasiDetik: 9,
    deskripsi: 'Mengambil golok dari sarungnya dengan gerakan hormat tanpa mengeluarkan bunyi hentakan kasar, menatap bilah dengan khidmat.',
    fokusPoin: 'Etika senjata tradisi, ketajaman konsentrasi tatapan mata.',
    kudaKuda: 'Kuda-Kuda Tengah'
  },
  {
    nomor: 9,
    nama: 'Tebasan Diagonal & Putaran Bilah Angin',
    kategori: 'Golok',
    arah: 'Serong Kanan & Kiri',
    durasiDetik: 15,
    deskripsi: 'Rangkaian tebasan golok diagonal membentuk angka delapan (lemniscate) dengan desingan angin tajam memotong garis udara.',
    fokusPoin: 'Kekuatan pergelangan tangan mengontrol bilah tanpa tergelincir.',
    kudaKuda: 'Kuda-Kuda Depan Bergerak'
  },
  {
    nomor: 10,
    nama: 'Tusukan Lurus Golok & Tangkisan Punggung Bilah',
    kategori: 'Golok',
    arah: 'Depan Tegak',
    durasiDetik: 14,
    deskripsi: 'Menghunjamkan ujung golok lurus ke depan, kemudian menepis serangan balik dengan punggung bilah golok yang tebal.',
    fokusPoin: 'Akurasi tusukan lurus dan keselamatan tangan pemegang.',
    kudaKuda: 'Kuda-Kuda Belakang'
  },

  // Senjata Toya (Tongkat Rotan)
  {
    nomor: 11,
    nama: 'Sikap Pasang Toya & Putaran Helikopter',
    kategori: 'Toya',
    arah: 'Delapan Arah',
    durasiDetik: 16,
    deskripsi: 'Memutar toya rotan di atas kepala dengan dua tangan bergantian menciptakan perisai putar yang tak tertembus.',
    fokusPoin: 'Kecepatan putaran dan keharmonisan rentang tongkat 1.8 meter.',
    kudaKuda: 'Kuda-Kuda Tengah'
  },
  {
    nomor: 12,
    nama: 'Hentakan Toya ke Bumi & Tusukan Ganda',
    kategori: 'Toya',
    arah: 'Bawah & Depan',
    durasiDetik: 15,
    deskripsi: 'Menghentakkan ujung toya ke lantai hingga berdentang mantap, dilanjutkan tusukan lurus ganda dengan kedua ujung toya bergantian.',
    fokusPoin: 'Kekuatan daya henti toya dan suara gemeretak rotan berkualitas.',
    kudaKuda: 'Kuda-Kuda Depan Kokoh'
  }
];

// 5. SENJATA PUSAKA SILAT
export const SENJATA_PUSAKA_LIST: SenjataPusaka[] = [
  {
    id: 'keris',
    nama: 'Keris',
    daerahAsal: 'Jawa & Seluruh Kepulauan Melayu',
    deskripsi: 'Senjata tikam berbilah kelok (luk) atau lurus berpamor baja meteorik dan nikel, diakui UNESCO sebagai Warisan Budaya Takbenda Dunia.',
    material: 'Besi tempa lipat (pamor), meteorit, gagang kayu cendana/tanduk',
    caraGenggam: 'Digenggam dengan ibu jari menyusuri bilah ganja untuk menyalurkan tenaga dorong tikaman presisi.',
    filosofi: 'Lambang kehormatan, kebijaksanaan kepemimpinan, dan keseimbangan spiritual mikrokosmos-makrokosmos.',
    karakteristik: 'Senjata pertarungan jarak sangat dekat dengan racun pamor mematikan.'
  },
  {
    id: 'kerambit',
    nama: 'Kerambit (Kurambiak)',
    daerahAsal: 'Minangkabau, Sumatera Barat',
    deskripsi: 'Bilah melengkung menyerupai cakar harimau dengan cincin jari telunjuk di pangkal gagang, dinobatkan sebagai salah satu pisau paling mematikan di dunia.',
    material: 'Baja karbon tinggi, gagang kayu sono keling berukir',
    caraGenggam: 'Jari telunjuk dimasukkan ke dalam cincin cincin gagang, bilah keluar dari bawah kelingking (reverse grip).',
    filosofi: 'Terinspirasi dari cakaran harimau Sumatera (Silek Harimau), menyayat dan merobek tanpa bisa dilucuti lawan.',
    karakteristik: 'Sangat sulit direbut karena terkunci di jari dan sangat mematikan di pertarungan jarak rapat.'
  },
  {
    id: 'golok',
    nama: 'Golok / Parang',
    daerahAsal: 'Betawi & Sunda (Jawa Barat)',
    deskripsi: 'Pedang pendek bilah tunggal dengan punggung tebal dan mata pisau cembung tajam, sahabat setia para pendekar jawara.',
    material: 'Baja per pegas tempa, sarung kayu jati atau mahoni',
    caraGenggam: 'Genggaman satu tangan kuat pada gagang berkepala burung garuda atau harimau.',
    filosofi: 'Simbol kejantanan, pelindung kebenaran, dan penopang kerja keras masyarakat adat.',
    karakteristik: 'Kekuatan tebasan tebal yang mampu mematahkan tulang dan menangkis senjata lawan.'
  },
  {
    id: 'toya',
    nama: 'Toya (Tongkat Rotan)',
    daerahAsal: 'Nusantara (Seluruh Aliran)',
    deskripsi: 'Tongkat panjang silindris terbuat dari rotan pilihan yang liat, fleksibel, dan memiliki panjang standar 150 - 180 cm.',
    material: 'Rotan tohiti atau manau pilihan dengan kelenturan tinggi',
    caraGenggam: 'Dipegang dengan dua tangan pada sepertiga panjang tongkat untuk manuver putar ganda.',
    filosofi: 'Kekuatan di balik kelenturan, tidak mudah patah meski ditekuk badai cobaan.',
    karakteristik: 'Jangkauan serang terjauh dengan efek hentakan cambukan rotan yang menyengat.'
  },
  {
    id: 'celurit',
    nama: 'Celurit (Arit)',
    daerahAsal: 'Madura, Jawa Timur',
    deskripsi: 'Senjata tajam melengkung berbentuk bulan sabit dengan ujung yang sangat runcing dan lengkungan dalam yang tajam.',
    material: 'Baja tempa lebur, gagang kayu berikat tali',
    caraGenggam: 'Genggaman kuat condong ke depan untuk memaksimalkan gaya sentrifugal ayunan.',
    filosofi: 'Simbol kehormatan harga diri (Carok) dan pembelaan martabat keluarga.',
    karakteristik: 'Kemampuan mengait leher, rusuk, atau sendi lawan dari sudut yang tidak terduga.'
  },
  {
    id: 'trisula',
    nama: 'Trisula / Cabang',
    daerahAsal: 'Sumatera & Jawa',
    deskripsi: 'Senjata besi berbentuk tombak kecil bercabang tiga dengan dua bilah samping sebagai penangkap pedang.',
    material: 'Besi tempa padat utuh tanpa sambungan',
    caraGenggam: 'Dua cabang samping berfungsi melindungi punggung tangan dan mengunci bilah lawan.',
    filosofi: 'Tiga kebajikan: Kebenaran, Ketegasan, dan Pengabdian.',
    karakteristik: 'Senjata pertahanan terbaik untuk melucuti dan mematahkan pedang atau golok lawan.'
  }
];

// 6. PERGURUAN HISTORIS
export const PERGURUAN_LIST: PerguruanSilat[] = [
  {
    id: 'tapak-suci',
    nama: 'Tapak Suci Putera Muhammadiyah',
    singkatan: 'Tapak Suci',
    tahunBerdiri: '31 Juli 1963',
    pusat: 'Yogyakarta',
    pendiri: 'Pendekar M. Barie Irsjad, Moh. Djundab, dkk',
    semboyan: 'Dengan Iman dan Akhlak Saya Menjadi Kuat, Tanpa Iman dan Akhlak Saya Menjadi Lemah',
    karakterKhas: 'Baju merah khas dengan sabu kuning, teknik murni tanpa tenaga gaib, mengandalkan kecepatan lintasan serangan dan rasionalitas olahraga.',
    maknaLambang: 'Bunga mawar melambangkan keharuman akhlak, kelopak hijau melambangkan kedamaian, dan tapak tangan kanan terbuka melambangkan kejujuran.'
  },
  {
    id: 'psht',
    nama: 'Persaudaraan Setia Hati Terate',
    singkatan: 'PSHT',
    tahunBerdiri: '1922',
    pusat: 'Madiun, Jawa Timur',
    pendiri: 'Ki Hadjar Hardjo Oetomo (Pahlawan Perintis Kemerdekaan)',
    semboyan: 'Selama Matahari Masih Terbit dari Timur, dan Bumi Masih Dihuni Manusia, Selama Itu Pula Setia Hati Terate Tetap Jaya Abadi Selamanya',
    karakterKhas: 'Pakaian hitam sakral dengan mori putih, menekankan persaudaraan sejati yang tulus dari hati, jurus sambung bertenaga batin dan fisik.',
    maknaLambang: 'Bunga terate kuncup, setengah mekar, dan mekar melambangkan proses kedewasaan manusia di tengah lumpur kehidupan.'
  },
  {
    id: 'merpati-putih',
    nama: 'PPS Betako Merpati Putih',
    singkatan: 'Merpati Putih',
    tahunBerdiri: '2 April 1963',
    pusat: 'Yogyakarta',
    pendiri: 'Saring Hadi Poernomo & Poerwoto Hadi Poernomo',
    semboyan: 'Mersudi Patitising Tindak Pusakane Hening (Mencari Sampai Mendapat Kebenaran dalam Hening)',
    karakterKhas: 'Olah pernapasan murni (tenaga dalam bioenergi) tanpa mistik untuk pematahan benda keras beton/baja dan getaran indra keenam.',
    maknaLambang: 'Burung merpati putih dengan sayap mengembang melambangkan ketulusan niat dan kepasrahan kepada Tuhan Yang Maha Esa.'
  },
  {
    id: 'perisai-diri',
    nama: 'Keluarga Silat Nasional Indonesia Perisai Diri',
    singkatan: 'Perisai Diri',
    tahunBerdiri: '2 Juli 1955',
    pusat: 'Surabaya, Jawa Timur',
    pendiri: 'RM Soebandiman Dirdjoatmodjo',
    semboyan: 'Pandai Silat Tanpa Cedera',
    karakterKhas: 'Teknik 156 aliran silat dirangkum dalam teknik murni tanpa bertabrakan tenaga, memanfaatkan tenaga lawan untuk mengalahkan lawan.',
    maknaLambang: 'Bentuk perisai segi lima berdasar putih melambangkan Pancasila dan kemurnian jiwa kesatria.'
  },
  {
    id: 'pagar-nusa',
    nama: 'Pencak Silat Nahdlatul Ulama Pagar Nusa',
    singkatan: 'Pagar Nusa',
    tahunBerdiri: '3 Januari 1986',
    pusat: 'Pondok Pesantren Lirboyo, Kediri',
    pendiri: 'Gus Maksum Jauhari',
    semboyan: 'Pantang Menyerah Membela Kyai, Pesantren, dan Keutuhan NKRI',
    karakterKhas: 'Menyatukan tradisi silat pesantren dengan wirid spiritual dan ketahanan fisik tangguh.',
    maknaLambang: 'Bintang sembilan mengelilingi bola dunia dengan trisula melambangkan pengabdian para ulama nusantara.'
  },
  {
    id: 'ikspi',
    nama: 'IKSPI Kera Sakti',
    singkatan: 'Kera Sakti',
    tahunBerdiri: '15 Januari 1980',
    pusat: 'Madiun, Jawa Timur',
    pendiri: 'R. Totong Kiemdarto',
    semboyan: 'Ke Empat Penjuru Kita Mencari Saudara, Tapi Bila Musuh Menghadang Pantang Tunduk Kepala',
    karakterKhas: 'Kombinasi gerak silat Jawa dengan kelincahan Kungfu aliran Utara dan Selatan (Kera).',
    maknaLambang: 'Sosok kera lincah dengan lingkaran yin-yang melambangkan keseimbangan adaptasi.'
  }
];

// 7. KUIS WAWASAN SILAT
export const SOAL_KUIS: SoalKuis[] = [
  {
    id: 1,
    pertanyaan: 'Berapakah nilai poin sah yang diperoleh pesilat jika berhasil melakukan serangan pukulan masuk ke sasaran yang sah?',
    pilihan: ['1 Poin', '2 Poin', '3 Poin', '4 Poin'],
    jawabanBenar: 0,
    penjelasan: 'Berdasarkan peraturan resmi pertandingan IPSI, serangan tangan (pukulan) yang masuk sah tanpa terhalang tangkisan bernilai 1 poin.'
  },
  {
    id: 2,
    pertanyaan: 'Berapakah nilai poin sah untuk serangan tendangan yang mendarat bersih pada pelindung tubuh lawan?',
    pilihan: ['1 Poin', '2 Poin', '3 Poin', '4 Poin'],
    jawabanBenar: 1,
    penjelasan: 'Tendangan masuk yang mengenai bidang sasaran sah bernilai 2 poin dalam peraturan IPSI.'
  },
  {
    id: 3,
    pertanyaan: 'Berapakah nilai yang diperoleh jika pesilat berhasil melakukan teknik jatuhan / bantingan yang sah terhadap lawan?',
    pilihan: ['2 Poin', '3 Poin', '4 Poin', '5 Poin'],
    jawabanBenar: 1,
    penjelasan: 'Teknik jatuhan atau bantingan yang sah tanpa pesilat yang membanting ikut terjatuh memperoleh 3 poin.'
  },
  {
    id: 4,
    pertanyaan: 'Organisasi resmi tingkat dunia yang menaungi olahraga Pencak Silat internasional bernama...',
    pilihan: ['IPSI', 'PERSILAT', 'WKF', 'KONAS'],
    jawabanBenar: 1,
    penjelasan: 'PERSILAT (Persekutuan Pencak Silat Antarabangsa) didirikan pada tahun 1980 di Jakarta oleh Indonesia, Malaysia, Singapura, dan Brunei Darussalam.'
  },
  {
    id: 5,
    pertanyaan: 'Empat aspek luhur yang terkandung secara utuh di dalam Pencak Silat Indonesia adalah...',
    pilihan: [
      'Mental Spiritual, Seni Budaya, Bela Diri, dan Olahraga',
      'Tenaga Dalam, Mistis, Kebugaran, dan Bisnis',
      'Politik, Agama, Militer, dan Hiburan',
      'Kekuatan Fisik, Senjata Tajam, Kompetisi, dan Hadiah'
    ],
    jawabanBenar: 0,
    penjelasan: 'Pencak Silat secara resmi diakui mencakup 4 aspek: Mental Spiritual, Seni Budaya, Bela Diri, dan Olahraga.'
  },
  {
    id: 6,
    pertanyaan: 'Pada Kuda-kuda Depan, berapakah persentase distribusi beban tubuh yang ideal pada kaki depan?',
    pilihan: ['30%', '50%', '70%', '90%'],
    jawabanBenar: 2,
    penjelasan: 'Pada Kuda-kuda Depan, sekitar 70% beban bertumpu pada kaki depan yang ditekuk, sementara 30% menopang pada kaki belakang yang kokoh menjejak lantai.'
  },
  {
    id: 7,
    pertanyaan: 'Senjata tradisional khas Minangkabau yang menyerupai cakar harimau dan digenggam dengan cincin jari adalah...',
    pilihan: ['Kujang', 'Kerambit', 'Rencong', 'Badik'],
    jawabanBenar: 1,
    penjelasan: 'Kerambit (kurambiak) adalah senjata lengkung khas Minangkabau yang terinspirasi cakar harimau Sumatera.'
  },
  {
    id: 8,
    pertanyaan: 'Jika pesilat melakukan tangkisan lalu berhasil membalas dengan bantingan sah, berapa total poin yang diraih?',
    pilihan: ['3 Poin', '4 Poin (1 tangkisan + 3 bantingan)', '5 Poin', '2 Poin'],
    jawabanBenar: 1,
    penjelasan: 'Pola rangkaian pembelaan disusul serangan: Tangkisan berhasil (+1) disusul bantingan sah (+3) menghasilkan total 4 poin.'
  },
  {
    id: 9,
    pertanyaan: 'Berapakah sanksi pengurangan nilai untuk pesilat yang mendapatkan Peringatan I dalam gelanggang?',
    pilihan: ['Pengurangan -1 Poin', 'Pengurangan -2 Poin', 'Pengurangan -5 Poin', 'Pengurangan -10 Poin'],
    jawabanBenar: 2,
    penjelasan: 'Sanksi Peringatan I mengakibatkan pemotongan -5 poin dari akumulasi total nilai pesilat.'
  },
  {
    id: 10,
    pertanyaan: 'Pada kategori Seni Tunggal Baku IPSI, berapa durasi waktu standar penampilan dari awal hormat hingga selesai?',
    pilihan: ['2 Menit', '3 Menit (Tepat 180 detik)', '4 Menit 30 Detik', '5 Menit'],
    jawabanBenar: 1,
    penjelasan: 'Kategori Tunggal Baku IPSI memiliki toleransi durasi standar 3 menit (180 detik) dengan batas deviasi maksimal sesuai regulasi.'
  }
];
