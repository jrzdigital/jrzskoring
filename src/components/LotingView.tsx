import React, { useState } from 'react';
import { 
  Shuffle, 
  Printer, 
  RotateCw, 
  Users, 
  Check, 
  Dice5, 
  FileText,
  Sparkles
} from 'lucide-react';
import { Pesilat, KategoriSeni } from '../types/silat';
import { PESILAT_SAMPEL } from '../data/initialData';

export const LotingView: React.FC = () => {
  const [pesilatList, setPesilatList] = useState<Pesilat[]>(PESILAT_SAMPEL);
  const [kategori, setKategori] = useState<KategoriSeni>('TUNGGAL');
  const [isShuffling, setIsShuffling] = useState<boolean>(false);
  const [poolSplit, setPoolSplit] = useState<'AUTO' | 'MANUAL'>('AUTO');

  // Randomize Lot Numbers (Undian Acak)
  const handleShuffleLot = () => {
    setIsShuffling(true);

    setTimeout(() => {
      const numbers = Array.from({ length: pesilatList.length }, (_, i) => i + 1);
      // Fisher-Yates shuffle
      for (let i = numbers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
      }

      const shuffled = pesilatList.map((p, idx) => ({
        ...p,
        nomorUndian: numbers[idx],
      }));

      // Sort by lot number
      shuffled.sort((a, b) => (a.nomorUndian || 0) - (b.nomorUndian || 0));

      setPesilatList(shuffled);
      setIsShuffling(false);
    }, 600);
  };

  // Divide into Pool A and Pool B
  const poolA = pesilatList.filter((_, idx) => idx % 2 === 0);
  const poolB = pesilatList.filter((_, idx) => idx % 2 === 1);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      
      {/* Header Bar */}
      <div className="bg-white border-3 border-zinc-900 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-purple-600 text-white rounded-xl flex items-center justify-center border-2 border-zinc-950 font-black">
            <Shuffle className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold bg-zinc-950 text-white px-2 py-0.5 rounded">
                LOTING & UNDIAN RESMI
              </span>
              <span className="text-xs font-bold text-zinc-500">
                TECHNICAL DELEGATE PERSILAT
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-zinc-950">
              Pengundian Nomor Urut Tampil & Pembagian Pool
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleShuffleLot}
            disabled={isShuffling}
            className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider rounded-xl border-2 border-zinc-950 cursor-pointer flex items-center gap-2 shadow-sm transition-all"
          >
            <Dice5 className={`w-4 h-4 ${isShuffling ? 'animate-spin' : ''}`} />
            <span>{isShuffling ? 'Mengacak...' : 'Undi Acak Otomatis'}</span>
          </button>

          <button
            onClick={() => window.print()}
            className="px-4 py-2.5 bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs rounded-xl border-2 border-zinc-950 cursor-pointer flex items-center gap-2 shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Lembar Undian</span>
          </button>
        </div>
      </div>

      {/* Category selector */}
      <div className="flex gap-2 border-b-2 border-zinc-200 pb-3 overflow-x-auto">
        {(['TUNGGAL', 'GANDA', 'REGU', 'SOLO_KREATIF'] as KategoriSeni[]).map((cat) => (
          <button
            key={cat}
            onClick={() => setKategori(cat)}
            className={`px-4 py-2 text-xs font-black rounded-xl border-2 cursor-pointer transition-all ${
              kategori === cat 
                ? 'bg-zinc-950 text-white border-zinc-950 shadow-sm' 
                : 'bg-white text-zinc-700 border-zinc-300 hover:border-zinc-900'
            }`}
          >
            Kategori {cat}
          </button>
        ))}
      </div>

      {/* Pool Grid Display: Pool A and Pool B */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Pool A Card */}
        <div className="bg-white border-3 border-zinc-900 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b-2 border-zinc-200 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-red-600 rounded-sm"></span>
              <h3 className="font-extrabold text-base text-zinc-950">
                BAGAN POOL A ({poolA.length} Pesilat)
              </h3>
            </div>
            <span className="text-xs font-mono font-bold text-zinc-500">
              Babak Penyisihan
            </span>
          </div>

          <div className="space-y-2">
            {poolA.map((p, idx) => (
              <div
                key={p.id}
                className="p-3 bg-zinc-50 border-2 border-zinc-200 rounded-xl flex items-center justify-between hover:border-zinc-900 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-red-100 border-2 border-red-600 flex items-center justify-center font-mono font-black text-sm text-red-700">
                    {p.nomorUndian || idx * 2 + 1}
                  </div>
                  <div>
                    <div className="font-extrabold text-xs text-zinc-950 truncate max-w-[200px]">
                      {p.nama}
                    </div>
                    <div className="text-[11px] text-zinc-600 font-medium">
                      {p.kontingen}
                    </div>
                  </div>
                </div>

                <span className="text-[10px] font-bold text-zinc-500 uppercase px-2 py-0.5 bg-white border border-zinc-300 rounded">
                  Lot #{p.nomorUndian || idx * 2 + 1}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Pool B Card */}
        <div className="bg-white border-3 border-zinc-900 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b-2 border-zinc-200 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-blue-600 rounded-sm"></span>
              <h3 className="font-extrabold text-base text-zinc-950">
                BAGAN POOL B ({poolB.length} Pesilat)
              </h3>
            </div>
            <span className="text-xs font-mono font-bold text-zinc-500">
              Babak Penyisihan
            </span>
          </div>

          <div className="space-y-2">
            {poolB.map((p, idx) => (
              <div
                key={p.id}
                className="p-3 bg-zinc-50 border-2 border-zinc-200 rounded-xl flex items-center justify-between hover:border-zinc-900 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 border-2 border-blue-600 flex items-center justify-center font-mono font-black text-sm text-blue-700">
                    {p.nomorUndian || (idx + 1) * 2}
                  </div>
                  <div>
                    <div className="font-extrabold text-xs text-zinc-950 truncate max-w-[200px]">
                      {p.nama}
                    </div>
                    <div className="text-[11px] text-zinc-600 font-medium">
                      {p.kontingen}
                    </div>
                  </div>
                </div>

                <span className="text-[10px] font-bold text-zinc-500 uppercase px-2 py-0.5 bg-white border border-zinc-300 rounded">
                  Lot #{p.nomorUndian || (idx + 1) * 2}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
