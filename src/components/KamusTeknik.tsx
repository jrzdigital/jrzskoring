import React, { useState } from 'react';
import { KUDA_KUDA_LIST, POLA_LANGKAH_LIST, TEKNIK_SERANGAN_LIST, KudaKuda, PolaLangkah, TeknikSerangan } from '../data/silatData';
import { Compass, ShieldCheck, Target, CheckCircle2, AlertCircle, Volume2, Move } from 'lucide-react';
import { silatAudio } from '../utils/audio';

export const KamusTeknik: React.FC<{ soundEnabled: boolean }> = ({ soundEnabled }) => {
  const [subTab, setSubTab] = useState<'kuda_kuda' | 'pola_langkah' | 'serangan_tangkisan'>('kuda_kuda');

  // Kuda-kuda state
  const [selectedKuda, setSelectedKuda] = useState<KudaKuda>(KUDA_KUDA_LIST[0]);

  // Pola langkah state
  const [selectedPola, setSelectedPola] = useState<PolaLangkah>(POLA_LANGKAH_LIST[0]);
  const [langkahStep, setLangkahStep] = useState<number>(0);

  // Teknik filter
  const [kategoriTeknik, setKategoriTeknik] = useState<'semua' | 'pukulan' | 'tendangan' | 'tangkisan' | 'bantingan'>('semua');
  const [selectedTeknik, setSelectedTeknik] = useState<TeknikSerangan>(TEKNIK_SERANGAN_LIST[0]);

  const handleSpeak = (text: string) => {
    if (soundEnabled) {
      silatAudio.speak(text);
    }
  };

  const filteredTeknik = kategoriTeknik === 'semua'
    ? TEKNIK_SERANGAN_LIST
    : TEKNIK_SERANGAN_LIST.filter(t => t.kategori === kategoriTeknik);

  return (
    <div className="space-y-6">
      {/* Sub-tab navigation */}
      <div className="flex items-center gap-2 border-b border-stone-800 pb-3">
        <button
          onClick={() => setSubTab('kuda_kuda')}
          className={`px-4 py-2 text-xs font-semibold rounded-md transition-colors ${
            subTab === 'kuda_kuda'
              ? 'bg-amber-400 text-stone-950 shadow-sm'
              : 'text-stone-300 hover:text-stone-100 hover:bg-stone-900'
          }`}
        >
          6 Kuda-Kuda Pokok & Titik Berat
        </button>

        <button
          onClick={() => setSubTab('pola_langkah')}
          className={`px-4 py-2 text-xs font-semibold rounded-md transition-colors ${
            subTab === 'pola_langkah'
              ? 'bg-amber-400 text-stone-950 shadow-sm'
              : 'text-stone-300 hover:text-stone-100 hover:bg-stone-900'
          }`}
        >
          Pola Langkah 8 Penjuru Angin
        </button>

        <button
          onClick={() => setSubTab('serangan_tangkisan')}
          className={`px-4 py-2 text-xs font-semibold rounded-md transition-colors ${
            subTab === 'serangan_tangkisan'
              ? 'bg-amber-400 text-stone-950 shadow-sm'
              : 'text-stone-300 hover:text-stone-100 hover:bg-stone-900'
          }`}
        >
          Serangan, Tangkisan & Bantingan
        </button>
      </div>

      {/* 1. SECTION KUDA-KUDA */}
      {subTab === 'kuda_kuda' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Stance Selector */}
          <div className="lg:col-span-4 space-y-2">
            <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">
              Pilih Sikap Kuda-Kuda
            </div>
            {KUDA_KUDA_LIST.map(item => (
              <button
                key={item.id}
                onClick={() => {
                  setSelectedKuda(item);
                  if (soundEnabled) silatAudio.playWoodClap(520);
                }}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  selectedKuda.id === item.id
                    ? 'bg-stone-900 border-amber-500 shadow-md shadow-amber-950/20'
                    : 'bg-stone-950 border-stone-800 hover:border-stone-700 text-stone-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-stone-100">{item.nama}</span>
                  <span className="text-[11px] text-amber-400">{item.distribusiBeban.fokus}</span>
                </div>
                <div className="text-xs text-stone-400 mt-1 line-clamp-1">
                  {item.kategori}
                </div>
              </button>
            ))}
          </div>

          {/* Right: Interactive Stance Visualizer & Mechanics */}
          <div className="lg:col-span-8 bg-stone-900 border border-stone-800 rounded-xl p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold font-display text-stone-100">
                    {selectedKuda.nama}
                  </h3>
                  <button
                    onClick={() => handleSpeak(selectedKuda.nama)}
                    className="p-1 text-stone-400 hover:text-amber-400 transition-colors"
                    title="Dengarkan Aba-aba"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="text-xs text-amber-400 mt-0.5">
                  {selectedKuda.kategori}
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs bg-stone-950 px-3 py-2 rounded-lg border border-stone-800">
                <div>
                  <span className="text-stone-400">Kaki Depan: </span>
                  <span className="font-bold text-amber-400 font-mono-numbers">{selectedKuda.distribusiBeban.kiri}%</span>
                </div>
                <span aria-hidden="true">·</span>
                <div>
                  <span className="text-stone-400">Kaki Belakang: </span>
                  <span className="font-bold text-amber-400 font-mono-numbers">{selectedKuda.distribusiBeban.kanan}%</span>
                </div>
              </div>
            </div>

            {/* Interactive SVG Stance Stage */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              {/* SVG Top-down Footprint Diagram */}
              <div className="bg-stone-950 rounded-xl border border-stone-800 p-4 flex flex-col items-center justify-center relative overflow-hidden">
                <div className="absolute top-3 left-3 text-[10px] text-stone-500 uppercase font-medium">
                  Perspektif Jejak Kaki (Top-Down)
                </div>

                <svg viewBox="0 0 300 280" className="w-full max-w-[260px] h-64">
                  {/* Grid Lines */}
                  <defs>
                    <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />

                  {/* Axis Crosshair */}
                  <line x1="150" y1="20" x2="150" y2="260" stroke="#333" strokeDasharray="3 3" />
                  <line x1="20" y1="140" x2="280" y2="140" stroke="#333" strokeDasharray="3 3" />

                  {/* Direction Arrow */}
                  <polygon points="150,15 145,25 155,25" fill="#f59e0b" />
                  <text x="160" y="24" fill="#a8a29e" fontSize="9">Arah Serang</text>

                  {/* Left Footprint (Kaki Kiri / Depan) */}
                  <g transform={`translate(${selectedKuda.posisiKaki.kiriX}, ${selectedKuda.posisiKaki.kiriY}) rotate(${selectedKuda.posisiKaki.kiriRotasi})`}>
                    <rect x="-14" y="-28" width="28" height="56" rx="14" fill="#f59e0b" fillOpacity="0.85" stroke="#fbbf24" strokeWidth="2" />
                    <text x="0" y="4" textAnchor="middle" fill="#1c1917" fontSize="10" fontWeight="bold">L</text>
                    <text x="0" y="42" textAnchor="middle" fill="#fbbf24" fontSize="10" fontWeight="bold">{selectedKuda.distribusiBeban.kiri}%</text>
                  </g>

                  {/* Right Footprint (Kaki Kanan / Belakang) */}
                  <g transform={`translate(${selectedKuda.posisiKaki.kananX}, ${selectedKuda.posisiKaki.kananY}) rotate(${selectedKuda.posisiKaki.kananRotasi})`}>
                    <rect x="-14" y="-28" width="28" height="56" rx="14" fill="#78716c" fillOpacity="0.85" stroke="#a8a29e" strokeWidth="2" />
                    <text x="0" y="4" textAnchor="middle" fill="#1c1917" fontSize="10" fontWeight="bold">R</text>
                    <text x="0" y="42" textAnchor="middle" fill="#d6d3d1" fontSize="10" fontWeight="bold">{selectedKuda.distribusiBeban.kanan}%</text>
                  </g>

                  {/* Center of Mass (Pusat Titik Berat) */}
                  <circle
                    cx={selectedKuda.posisiKaki.pusatGravitasiX}
                    cy={selectedKuda.posisiKaki.pusatGravitasiY}
                    r="8"
                    fill="#ef4444"
                    stroke="#fee2e2"
                    strokeWidth="2"
                  />
                  <text
                    x={selectedKuda.posisiKaki.pusatGravitasiX + 12}
                    y={selectedKuda.posisiKaki.pusatGravitasiY + 4}
                    fill="#f87171"
                    fontSize="9"
                    fontWeight="bold"
                  >
                    Titik Berat
                  </text>
                </svg>

                <div className="text-[11px] text-stone-400 mt-2 text-center">
                  Sudut Lutut: <span className="text-stone-200 font-medium">{selectedKuda.sudutLutut}</span>
                </div>
              </div>

              {/* Stance Gauges & Tactical Metrics */}
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-stone-400">Tingkat Stabilitas Fisik</span>
                    <span className="font-bold text-amber-400 font-mono-numbers">{selectedKuda.stabilitas}%</span>
                  </div>
                  <div className="w-full bg-stone-950 h-2 rounded-full overflow-hidden border border-stone-800">
                    <div
                      className="bg-amber-400 h-full rounded-full transition-all duration-500"
                      style={{ width: `${selectedKuda.stabilitas}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-stone-400">Kecepatan Mobilitas & Manuver</span>
                    <span className="font-bold text-emerald-400 font-mono-numbers">{selectedKuda.mobilitas}%</span>
                  </div>
                  <div className="w-full bg-stone-950 h-2 rounded-full overflow-hidden border border-stone-800">
                    <div
                      className="bg-emerald-400 h-full rounded-full transition-all duration-500"
                      style={{ width: `${selectedKuda.mobilitas}%` }}
                    />
                  </div>
                </div>

                <div className="bg-stone-950 p-3.5 rounded-lg border border-stone-800">
                  <div className="text-xs text-amber-400 font-semibold mb-1 flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5" />
                    <span>Tujuan Taktis Dalam Pertarungan</span>
                  </div>
                  <p className="text-xs text-stone-300 leading-relaxed">
                    {selectedKuda.tujuanTaktis}
                  </p>
                </div>
              </div>
            </div>

            {/* Step execution and errors */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-stone-800">
              <div className="bg-stone-950/60 p-4 rounded-lg border border-stone-800/80">
                <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5 mb-2.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Tahapan Eksekusi Yang Benar</span>
                </div>
                <ul className="space-y-1.5 text-xs text-stone-300">
                  {selectedKuda.langkah.map((step, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-amber-400 font-mono-numbers">{idx + 1}.</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-stone-950/60 p-4 rounded-lg border border-stone-800/80">
                <div className="text-xs font-semibold text-rose-400 flex items-center gap-1.5 mb-2.5">
                  <AlertCircle className="w-4 h-4" />
                  <span>Kesalahan Umum yang Sering Terjadi</span>
                </div>
                <ul className="space-y-1.5 text-xs text-stone-300">
                  {selectedKuda.kesalahanUmum.map((err, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-rose-500">✕</span>
                      <span>{err}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. SECTION POLA LANGKAH 8 PENJURU ANGIN */}
      {subTab === 'pola_langkah' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-4 space-y-2">
            <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">
              Pilihan Pola Langkah Silat
            </div>
            {POLA_LANGKAH_LIST.map(pola => (
              <button
                key={pola.id}
                onClick={() => {
                  setSelectedPola(pola);
                  setLangkahStep(0);
                  if (soundEnabled) silatAudio.playWoodClap(600);
                }}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  selectedPola.id === pola.id
                    ? 'bg-stone-900 border-amber-500 shadow-md shadow-amber-950/20'
                    : 'bg-stone-950 border-stone-800 hover:border-stone-700 text-stone-300'
                }`}
              >
                <div className="font-semibold text-sm text-stone-100">{pola.nama}</div>
                <div className="text-xs text-stone-400 mt-1 line-clamp-1">{pola.arti}</div>
              </button>
            ))}
          </div>

          <div className="lg:col-span-8 bg-stone-900 border border-stone-800 rounded-xl p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-800 pb-4">
              <div>
                <h3 className="text-xl font-bold font-display text-stone-100">
                  {selectedPola.nama}
                </h3>
                <div className="text-xs text-amber-400 mt-0.5">
                  {selectedPola.arti}
                </div>
              </div>

              {/* Step Simulator Controller */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setLangkahStep(prev => Math.max(0, prev - 1));
                    if (soundEnabled) silatAudio.playWoodClap(500);
                  }}
                  disabled={langkahStep === 0}
                  className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 disabled:opacity-40 text-xs rounded border border-stone-700 text-stone-200 transition-colors"
                >
                  Langkah Sebelumnya
                </button>
                <button
                  onClick={() => {
                    setLangkahStep(prev => (prev + 1) % selectedPola.titikLangkah.length);
                    if (soundEnabled) silatAudio.playWoodClap(750);
                  }}
                  className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-xs font-semibold rounded text-stone-950 transition-colors"
                >
                  Langkah Maju ({langkahStep + 1}/{selectedPola.titikLangkah.length})
                </button>
              </div>
            </div>

            {/* Pola Compass Canvas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div className="bg-stone-950 rounded-xl border border-stone-800 p-4 flex flex-col items-center justify-center relative">
                <svg viewBox="0 0 300 280" className="w-full max-w-[260px] h-64">
                  {/* Compass Circle */}
                  <circle cx="150" cy="140" r="100" fill="none" stroke="#333" strokeDasharray="2 4" />
                  <circle cx="150" cy="140" r="50" fill="none" stroke="#222" />

                  {/* 8 Directions rays */}
                  {[0, 45, 90, 135, 180, 225, 270, 315].map(deg => {
                    const rad = (deg * Math.PI) / 180;
                    const x2 = 150 + 105 * Math.sin(rad);
                    const y2 = 140 - 105 * Math.cos(rad);
                    return (
                      <line
                        key={deg}
                        x1="150"
                        y1="140"
                        x2={x2}
                        y2={y2}
                        stroke="#292524"
                        strokeWidth="1.5"
                      />
                    );
                  })}

                  {/* Direction Labels */}
                  <text x="150" y="30" textAnchor="middle" fill="#78716c" fontSize="9" fontWeight="bold">U (Utara)</text>
                  <text x="260" y="143" textAnchor="middle" fill="#78716c" fontSize="9" fontWeight="bold">T</text>
                  <text x="150" y="255" textAnchor="middle" fill="#78716c" fontSize="9" fontWeight="bold">S</text>
                  <text x="40" y="143" textAnchor="middle" fill="#78716c" fontSize="9" fontWeight="bold">B</text>

                  {/* Pola Step Connecting Path */}
                  <polyline
                    points={selectedPola.titikLangkah.map(p => `${p.x},${p.y}`).join(' ')}
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="3"
                    strokeDasharray="4 4"
                  />

                  {/* Nodes */}
                  {selectedPola.titikLangkah.map((pt, index) => {
                    const isCurrent = index === langkahStep;
                    return (
                      <g key={index}>
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r={isCurrent ? 12 : 8}
                          fill={isCurrent ? '#f59e0b' : '#44403c'}
                          stroke={isCurrent ? '#fbbf24' : '#78716c'}
                          strokeWidth="2"
                        />
                        <text
                          x={pt.x}
                          y={pt.y + 4}
                          textAnchor="middle"
                          fill={isCurrent ? '#1c1917' : '#f5f5f4'}
                          fontSize="9"
                          fontWeight="bold"
                        >
                          {pt.urutan}
                        </text>
                        <text
                          x={pt.x}
                          y={pt.y - 12}
                          textAnchor="middle"
                          fill={isCurrent ? '#fbbf24' : '#a8a29e'}
                          fontSize="8"
                          fontWeight={isCurrent ? 'bold' : 'normal'}
                        >
                          {pt.label}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>

              <div className="space-y-4">
                <div className="bg-stone-950 p-4 rounded-lg border border-stone-800">
                  <div className="text-xs text-amber-400 font-semibold mb-1 flex items-center gap-1.5">
                    <Compass className="w-4 h-4" />
                    <span>Deskripsi Pola Langkah</span>
                  </div>
                  <p className="text-xs text-stone-300 leading-relaxed">
                    {selectedPola.deskripsi}
                  </p>
                </div>

                <div className="bg-stone-950 p-4 rounded-lg border border-stone-800">
                  <div className="text-xs text-emerald-400 font-semibold mb-1 flex items-center gap-1.5">
                    <Move className="w-4 h-4" />
                    <span>Fungsi & Taktik Bertarung</span>
                  </div>
                  <p className="text-xs text-stone-300 leading-relaxed">
                    {selectedPola.kegunaan}
                  </p>
                </div>

                <div className="text-xs text-stone-400">
                  Posisi Aktif:{' '}
                  <span className="text-amber-400 font-semibold">
                    Titik {selectedPola.titikLangkah[langkahStep]?.urutan} (
                    {selectedPola.titikLangkah[langkahStep]?.label})
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. SECTION SERANGAN, TANGKISAN & BANTINGAN */}
      {subTab === 'serangan_tangkisan' && (
        <div className="space-y-6">
          {/* Category filter */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'semua', label: 'Semua Teknik' },
              { id: 'pukulan', label: 'Pukulan (1 Poin)' },
              { id: 'tendangan', label: 'Tendangan (2 Poin)' },
              { id: 'tangkisan', label: 'Tangkisan & Elakan' },
              { id: 'bantingan', label: 'Bantingan & Guntingan (3 Poin)' }
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setKategoriTeknik(cat.id as typeof kategoriTeknik)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  kategoriTeknik === cat.id
                    ? 'bg-amber-400 text-stone-950 font-semibold'
                    : 'bg-stone-900 text-stone-300 hover:bg-stone-800'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* List */}
            <div className="lg:col-span-5 space-y-2">
              {filteredTeknik.map(t => (
                <button
                  key={t.id}
                  onClick={() => {
                    setSelectedTeknik(t);
                    if (soundEnabled) silatAudio.playWoodClap(650);
                  }}
                  className={`w-full text-left p-3.5 rounded-lg border transition-all ${
                    selectedTeknik.id === t.id
                      ? 'bg-stone-900 border-amber-500 shadow-md shadow-amber-950/20'
                      : 'bg-stone-950 border-stone-800 hover:border-stone-700 text-stone-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-stone-100">{t.nama}</span>
                    <span className="text-[10px] uppercase font-bold text-amber-400">
                      {t.poinIpsi} Poin IPSI
                    </span>
                  </div>
                  <div className="text-xs text-stone-400 mt-1 line-clamp-1">
                    Sasaran: {t.targetSasaran}
                  </div>
                </button>
              ))}
            </div>

            {/* Detail */}
            <div className="lg:col-span-7 bg-stone-900 border border-stone-800 rounded-xl p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold font-display text-stone-100">
                      {selectedTeknik.nama}
                    </h3>
                    <button
                      onClick={() => handleSpeak(selectedTeknik.nama)}
                      className="p-1 text-stone-400 hover:text-amber-400 transition-colors"
                      title="Dengarkan Aba-aba"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="text-xs text-amber-400 uppercase tracking-wider mt-0.5 font-medium">
                    Kategori: {selectedTeknik.kategori} · Poin Resmi: {selectedTeknik.poinIpsi}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-2xl font-black font-mono-numbers text-amber-400">
                    +{selectedTeknik.poinIpsi}
                  </span>
                  <div className="text-[10px] text-stone-400">Skor Sah</div>
                </div>
              </div>

              <div className="text-xs text-stone-300 leading-relaxed bg-stone-950 p-3.5 rounded-lg border border-stone-800">
                {selectedTeknik.deskripsi}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-stone-950 p-3.5 rounded-lg border border-stone-800">
                  <div className="text-amber-400 font-semibold mb-1 flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5" />
                    <span>Bidang Sasaran Sah</span>
                  </div>
                  <p className="text-stone-300">{selectedTeknik.targetSasaran}</p>
                </div>

                <div className="bg-stone-950 p-3.5 rounded-lg border border-stone-800">
                  <div className="text-emerald-400 font-semibold mb-1 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Kunci Keberhasilan</span>
                  </div>
                  <p className="text-stone-300">{selectedTeknik.kunciKeberhasilan}</p>
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold text-stone-200 mb-2">
                  Tahapan Rangkaian Gerakan
                </div>
                <div className="space-y-1.5">
                  {selectedTeknik.langkahGerakan.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-stone-300 bg-stone-950/60 p-2.5 rounded border border-stone-800/80">
                      <span className="text-amber-400 font-mono-numbers font-bold shrink-0">{idx + 1}.</span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
