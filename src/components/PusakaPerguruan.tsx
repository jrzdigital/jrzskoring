import React, { useState } from 'react';
import { SENJATA_PUSAKA_LIST, PERGURUAN_LIST, SenjataPusaka, PerguruanSilat } from '../data/silatData';
import { Shield, Sparkles, MapPin, Calendar, HeartHandshake, BookOpen } from 'lucide-react';

export const PusakaPerguruan: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'senjata' | 'perguruan'>('senjata');
  const [selectedSenjata, setSelectedSenjata] = useState<SenjataPusaka>(SENJATA_PUSAKA_LIST[0]);
  const [selectedPerguruan, setSelectedPerguruan] = useState<PerguruanSilat>(PERGURUAN_LIST[0]);

  return (
    <div className="space-y-6">
      {/* Switcher */}
      <div className="flex items-center gap-2 border-b border-stone-800 pb-3">
        <button
          onClick={() => setActiveSection('senjata')}
          className={`px-4 py-2 text-xs font-semibold rounded-md transition-colors ${
            activeSection === 'senjata'
              ? 'bg-amber-400 text-stone-950 font-bold shadow-sm'
              : 'text-stone-300 hover:text-stone-100 hover:bg-stone-900'
          }`}
        >
          Senjata Pusaka Tradisional Nusantara
        </button>

        <button
          onClick={() => setActiveSection('perguruan')}
          className={`px-4 py-2 text-xs font-semibold rounded-md transition-colors ${
            activeSection === 'perguruan'
              ? 'bg-amber-400 text-stone-950 font-bold shadow-sm'
              : 'text-stone-300 hover:text-stone-100 hover:bg-stone-900'
          }`}
        >
          Ensiklopedi Perguruan Historis Silat
        </button>
      </div>

      {/* 1. SENJATA PUSAKA */}
      {activeSection === 'senjata' && (
        <div className="space-y-6">
          {/* Visual Showcase Banner */}
          <div className="relative rounded-xl overflow-hidden border border-stone-800 bg-stone-900">
            <div className="grid grid-cols-1 lg:grid-cols-12 items-center">
              <div className="lg:col-span-6 p-6 lg:p-8 space-y-4">
                <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                  Khasanah Pusaka Bela Diri
                </span>
                <h3 className="text-2xl font-bold font-display text-stone-100">
                  Senjata Tradisi Pencak Silat Nusantara
                </h3>
                <p className="text-xs text-stone-300 leading-relaxed">
                  Dalam Pencak Silat, senjata bukan sekadar alat membunuh, melainkan perpanjangan dari raga dan cerminan budi pekerti pesilat. Setiap bilah membawa filosofi perlindungan keluarga, tanah air, dan kearifan spiritual para leluhur.
                </p>
                <div className="flex items-center gap-2 text-xs text-stone-400 pt-2 border-t border-stone-800">
                  <span>Keris</span>
                  <span aria-hidden="true">·</span>
                  <span>Kerambit</span>
                  <span aria-hidden="true">·</span>
                  <span>Golok Betawi</span>
                  <span aria-hidden="true">·</span>
                  <span>Toya Rotan</span>
                </div>
              </div>

              <div className="lg:col-span-6 h-64 lg:h-80 overflow-hidden relative">
                <img
                  src="/src/assets/images/pencak_silat_weapons_1791865192656.jpg"
                  alt="Koleksi Senjata Tradisional Pencak Silat Nusantara"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-stone-900 via-transparent to-transparent opacity-80" />
              </div>
            </div>
          </div>

          {/* Grid Selection */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left List */}
            <div className="lg:col-span-4 space-y-2">
              <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">
                Daftar Senjata Tradisi
              </div>
              {SENJATA_PUSAKA_LIST.map(senjata => (
                <button
                  key={senjata.id}
                  onClick={() => setSelectedSenjata(senjata)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    selectedSenjata.id === senjata.id
                      ? 'bg-stone-900 border-amber-500 shadow-md shadow-amber-950/20'
                      : 'bg-stone-950 border-stone-800 hover:border-stone-700 text-stone-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-stone-100">{senjata.nama}</span>
                    <span className="text-[10px] text-amber-400">{senjata.daerahAsal.split(',')[0]}</span>
                  </div>
                  <div className="text-xs text-stone-400 mt-1 line-clamp-1">
                    {senjata.karakteristik}
                  </div>
                </button>
              ))}
            </div>

            {/* Right Detail */}
            <div className="lg:col-span-8 bg-stone-900 border border-stone-800 rounded-xl p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                <div>
                  <h3 className="text-2xl font-bold font-display text-stone-100">
                    {selectedSenjata.nama}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-amber-400 mt-1">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Daerah Asal: {selectedSenjata.daerahAsal}</span>
                  </div>
                </div>
              </div>

              <div className="text-xs text-stone-300 leading-relaxed bg-stone-950 p-4 rounded-lg border border-stone-800">
                {selectedSenjata.deskripsi}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="bg-stone-950 p-4 rounded-lg border border-stone-800">
                  <div className="text-amber-400 font-semibold mb-1 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" />
                    <span>Material & Metalurgi Bilah</span>
                  </div>
                  <p className="text-stone-300 leading-relaxed">{selectedSenjata.material}</p>
                </div>

                <div className="bg-stone-950 p-4 rounded-lg border border-stone-800">
                  <div className="text-emerald-400 font-semibold mb-1 flex items-center gap-1.5">
                    <Shield className="w-4 h-4" />
                    <span>Teknik Genggam (Grip)</span>
                  </div>
                  <p className="text-stone-300 leading-relaxed">{selectedSenjata.caraGenggam}</p>
                </div>
              </div>

              <div className="bg-stone-950 p-4 rounded-lg border border-stone-800">
                <div className="text-xs text-amber-300 font-semibold mb-1 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4" />
                  <span>Filosofi & Nilai Luhur</span>
                </div>
                <p className="text-xs text-stone-300 leading-relaxed italic">
                  "{selectedSenjata.filosofi}"
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. PERGURUAN HISTORIS */}
      {activeSection === 'perguruan' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* List */}
          <div className="lg:col-span-4 space-y-2">
            <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">
              Perguruan Silat Nusantara
            </div>
            {PERGURUAN_LIST.map(p => (
              <button
                key={p.id}
                onClick={() => setSelectedPerguruan(p)}
                className={`w-full text-left p-3.5 rounded-lg border transition-all ${
                  selectedPerguruan.id === p.id
                    ? 'bg-stone-900 border-amber-500 shadow-md shadow-amber-950/20'
                    : 'bg-stone-950 border-stone-800 hover:border-stone-700 text-stone-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-stone-100">{p.singkatan}</span>
                  <span className="text-[11px] text-stone-400 font-mono-numbers">{p.tahunBerdiri.split(' ').slice(-1)[0]}</span>
                </div>
                <div className="text-xs text-stone-400 mt-1 line-clamp-1">{p.nama}</div>
              </button>
            ))}
          </div>

          {/* Details */}
          <div className="lg:col-span-8 bg-stone-900 border border-stone-800 rounded-xl p-6 space-y-5">
            <div className="border-b border-stone-800 pb-4">
              <h3 className="text-2xl font-bold font-display text-stone-100">
                {selectedPerguruan.nama}
              </h3>
              <div className="flex flex-wrap items-center gap-3 text-xs text-stone-400 mt-1.5">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  <span>Berdiri: {selectedPerguruan.tahunBerdiri}</span>
                </div>
                <span aria-hidden="true">·</span>
                <div className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  <span>Pusat: {selectedPerguruan.pusat}</span>
                </div>
                <span aria-hidden="true">·</span>
                <span>Pendiri: {selectedPerguruan.pendiri}</span>
              </div>
            </div>

            {/* Semboyan Banner */}
            <div className="bg-stone-950 p-4 rounded-lg border border-amber-500/30">
              <div className="text-[11px] text-amber-400 uppercase font-semibold">
                Semboyan & Falsafah Luhur
              </div>
              <div className="text-sm font-semibold text-stone-100 italic mt-1 font-display">
                "{selectedPerguruan.semboyan}"
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="bg-stone-950 p-4 rounded-lg border border-stone-800">
                <div className="text-amber-400 font-semibold mb-1 flex items-center gap-1.5">
                  <Shield className="w-4 h-4" />
                  <span>Karakteristik & Ciri Gerak Khas</span>
                </div>
                <p className="text-stone-300 leading-relaxed">{selectedPerguruan.karakterKhas}</p>
              </div>

              <div className="bg-stone-950 p-4 rounded-lg border border-stone-800">
                <div className="text-emerald-400 font-semibold mb-1 flex items-center gap-1.5">
                  <HeartHandshake className="w-4 h-4" />
                  <span>Makna Lambang & Filosofi</span>
                </div>
                <p className="text-stone-300 leading-relaxed">{selectedPerguruan.maknaLambang}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
