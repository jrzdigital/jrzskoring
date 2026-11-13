import React, { useState, useEffect } from 'react';
import { 
  GitBranch, 
  Trophy, 
  Medal, 
  Award, 
  ChevronRight, 
  Sparkles,
  RefreshCw,
  Play,
  RotateCcw,
  CheckCircle,
  ExternalLink,
  Users
} from 'lucide-react';
import { BracketMatch, KategoriSeni, Partai, Pesilat } from '../types/silat';
import { INITIAL_BRACKET_MATCHES, PESILAT_SAMPEL } from '../data/initialData';

interface BracketViewProps {
  partaiList?: Partai[];
  onSelectPartai?: (partaiId: string) => void;
}

export const BracketView: React.FC<BracketViewProps> = ({ partaiList = [], onSelectPartai }) => {
  const [kategori, setKategori] = useState<KategoriSeni>('TUNGGAL');
  const [selectedMatch, setSelectedMatch] = useState<BracketMatch | null>(null);

  // Persistent bracket storage by category
  const [categoryMatches, setCategoryMatches] = useState<Record<KategoriSeni, BracketMatch[]>>(() => {
    try {
      const saved = localStorage.getItem('silat_bracket_matches_all');
      if (saved) return JSON.parse(saved);
    } catch (e) {}

    return {
      TUNGGAL: INITIAL_BRACKET_MATCHES,
      GANDA: [
        {
          id: 'bm-g1',
          round: 1,
          matchNumber: 1,
          kategori: 'GANDA',
          gender: 'PUTRA',
          pesilat1: { id: 'pg-1', nama: 'Fadli & Ramadhan', kontingen: 'DKI Jakarta', score: 9.940 },
          pesilat2: { id: 'pg-2', nama: 'Hendra & Wijaya', kontingen: 'Jawa Barat', score: 9.920 },
          winnerId: 'pg-1',
          nextMatchId: 'bm-g3',
        },
        {
          id: 'bm-g2',
          round: 1,
          matchNumber: 2,
          kategori: 'GANDA',
          gender: 'PUTRA',
          pesilat1: { id: 'pg-3', nama: 'Made & Wayan', kontingen: 'Bali', score: 9.950 },
          pesilat2: { id: 'pg-4', nama: 'Bagus & Bayu', kontingen: 'Jawa Timur', score: 9.935 },
          winnerId: 'pg-3',
          nextMatchId: 'bm-g3',
        },
        {
          id: 'bm-g3',
          round: 2,
          matchNumber: 3,
          kategori: 'GANDA',
          gender: 'PUTRA',
          pesilat1: { id: 'pg-1', nama: 'Fadli & Ramadhan', kontingen: 'DKI Jakarta', score: 9.965 },
          pesilat2: { id: 'pg-3', nama: 'Made & Wayan', kontingen: 'Bali', score: 9.955 },
          winnerId: 'pg-1',
        },
      ],
      REGU: [
        {
          id: 'bm-r1',
          round: 1,
          matchNumber: 1,
          kategori: 'REGU',
          gender: 'PUTRA',
          pesilat1: { id: 'pr-1', nama: 'Trio Singa Merapi', kontingen: 'D.I. Yogyakarta', score: 9.970 },
          pesilat2: { id: 'pr-2', nama: 'Trio Pasundan', kontingen: 'Jawa Barat', score: 9.945 },
          winnerId: 'pr-1',
          nextMatchId: 'bm-r3',
        },
        {
          id: 'bm-r2',
          round: 1,
          matchNumber: 2,
          kategori: 'REGU',
          gender: 'PUTRA',
          pesilat1: { id: 'pr-3', nama: 'Trio Majapahit', kontingen: 'Jawa Timur', score: 9.955 },
          pesilat2: { id: 'pr-4', nama: 'Trio Sriwijaya', kontingen: 'Sumatera Selatan', score: 9.930 },
          winnerId: 'pr-3',
          nextMatchId: 'bm-r3',
        },
        {
          id: 'bm-r3',
          round: 2,
          matchNumber: 3,
          kategori: 'REGU',
          gender: 'PUTRA',
          pesilat1: { id: 'pr-1', nama: 'Trio Singa Merapi', kontingen: 'D.I. Yogyakarta', score: 9.980 },
          pesilat2: { id: 'pr-3', nama: 'Trio Majapahit', kontingen: 'Jawa Timur', score: 9.965 },
          winnerId: 'pr-1',
        },
      ],
      SOLO_KREATIF: [
        {
          id: 'bm-s1',
          round: 1,
          matchNumber: 1,
          kategori: 'SOLO_KREATIF',
          gender: 'PUTRA',
          pesilat1: { id: 'ps-1', nama: 'Zainal Abidin', kontingen: 'Sulawesi Selatan', score: 9.935 },
          pesilat2: { id: 'ps-2', nama: 'Rian Hidayat', kontingen: 'Kalimantan Timur', score: 9.910 },
          winnerId: 'ps-1',
          nextMatchId: 'bm-s3',
        },
        {
          id: 'bm-s2',
          round: 1,
          matchNumber: 2,
          kategori: 'SOLO_KREATIF',
          gender: 'PUTRA',
          pesilat1: { id: 'ps-3', nama: 'Galang Perkasa', kontingen: 'Jawa Barat', score: 9.945 },
          pesilat2: { id: 'ps-4', nama: 'Ilham Syahputra', kontingen: 'Sumatera Barat', score: 9.925 },
          winnerId: 'ps-3',
          nextMatchId: 'bm-s3',
        },
        {
          id: 'bm-s3',
          round: 2,
          matchNumber: 3,
          kategori: 'SOLO_KREATIF',
          gender: 'PUTRA',
          pesilat1: { id: 'ps-1', nama: 'Zainal Abidin', kontingen: 'Sulawesi Selatan', score: 9.950 },
          pesilat2: { id: 'ps-3', nama: 'Galang Perkasa', kontingen: 'Jawa Barat', score: 9.960 },
          winnerId: 'ps-3',
        },
      ],
    };
  });

  const matches = categoryMatches[kategori] || [];

  // Automatically update bracket when match scores in partaiList are finished/updated
  useEffect(() => {
    if (!partaiList || partaiList.length === 0) return;

    let updated = false;
    const currentMatches = [...matches];

    partaiList.forEach(partai => {
      if (partai.kategori === kategori && partai.hasilAkhir && (partai.status === 'SELESAI' || partai.status === 'DISAHKAN')) {
        const score = partai.hasilAkhir.skorAkhir;
        const pesilatId = partai.pesilat.id;

        currentMatches.forEach(m => {
          let matchChanged = false;
          if (m.pesilat1 && (m.pesilat1.id === pesilatId || m.pesilat1.nama === partai.pesilat.nama)) {
            if (m.pesilat1.score !== score) {
              m.pesilat1.score = score;
              m.pesilat1.partaiId = partai.id;
              matchChanged = true;
              updated = true;
            }
          } else if (m.pesilat2 && (m.pesilat2.id === pesilatId || m.pesilat2.nama === partai.pesilat.nama)) {
            if (m.pesilat2.score !== score) {
              m.pesilat2.score = score;
              m.pesilat2.partaiId = partai.id;
              matchChanged = true;
              updated = true;
            }
          }

          // If both have scores and winner not set or needs update
          if (matchChanged && m.pesilat1?.score !== undefined && m.pesilat2?.score !== undefined) {
            const winner = m.pesilat1.score >= m.pesilat2.score ? m.pesilat1 : m.pesilat2;
            m.winnerId = winner.id;

            // Advance winner to next match if exists
            if (m.nextMatchId) {
              const nextM = currentMatches.find(nm => nm.id === m.nextMatchId);
              if (nextM) {
                // If odd match number, fills pesilat1, else pesilat2
                if (m.matchNumber % 2 === 1) {
                  nextM.pesilat1 = { ...winner };
                } else {
                  nextM.pesilat2 = { ...winner };
                }
              }
            }
          }
        });
      }
    });

    if (updated) {
      setCategoryMatches(prev => {
        const next = { ...prev, [kategori]: currentMatches };
        try {
          localStorage.setItem('silat_bracket_matches_all', JSON.stringify(next));
        } catch (e) {}
        return next;
      });
    }
  }, [partaiList, kategori]);

  // Persist when matches change
  const updateMatches = (newMatches: BracketMatch[]) => {
    setCategoryMatches(prev => {
      const next = { ...prev, [kategori]: newMatches };
      try {
        localStorage.setItem('silat_bracket_matches_all', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  // Advance winner manually
  const handleSetWinner = (matchId: string, winnerPesilat: Pesilat & { score?: number }) => {
    const updated = matches.map(m => {
      if (m.id === matchId) {
        return {
          ...m,
          winnerId: winnerPesilat.id,
        };
      }
      return m;
    });

    // Advance to next round
    const currentM = updated.find(m => m.id === matchId);
    if (currentM && currentM.nextMatchId) {
      const nextIndex = updated.findIndex(m => m.id === currentM.nextMatchId);
      if (nextIndex !== -1) {
        const nextM = { ...updated[nextIndex] };
        if (currentM.matchNumber % 2 === 1) {
          nextM.pesilat1 = { ...winnerPesilat };
        } else {
          nextM.pesilat2 = { ...winnerPesilat };
        }
        updated[nextIndex] = nextM;
      }
    }

    updateMatches(updated);
    setSelectedMatch(null);
  };

  // Reset category bracket
  const handleResetBracket = () => {
    if (kategori === 'TUNGGAL') {
      updateMatches(INITIAL_BRACKET_MATCHES);
    }
  };

  // Categorize matches by rounds
  const maxRound = Math.max(...matches.map(m => m.round), 1);
  const round1Matches = matches.filter(m => m.round === 1);
  const round2Matches = matches.filter(m => m.round === 2);
  const finalMatch = matches.find(m => m.round === maxRound);

  const champion = finalMatch && finalMatch.winnerId
    ? (finalMatch.winnerId === finalMatch.pesilat1?.id ? finalMatch.pesilat1 : finalMatch.pesilat2)
    : null;

  const runnerUp = finalMatch && finalMatch.winnerId
    ? (finalMatch.winnerId === finalMatch.pesilat1?.id ? finalMatch.pesilat2 : finalMatch.pesilat1)
    : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      
      {/* Header Bar */}
      <div className="bg-white border-3 border-zinc-900 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-cyan-700 text-white rounded-xl flex items-center justify-center border-2 border-zinc-950 font-black">
            <GitBranch className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold bg-zinc-950 text-white px-2 py-0.5 rounded">
                BAGAN INTERAKTIF TERPADU
              </span>
              <span className="text-xs font-bold text-zinc-500">
                OTOMATIS TERSINKRONISASI
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-zinc-950">
              Bagan Bracket Pertandingan & Jalur Juara
            </h2>
          </div>
        </div>

        {/* Category Switcher */}
        <div className="flex flex-wrap gap-2">
          {(['TUNGGAL', 'GANDA', 'REGU', 'SOLO_KREATIF'] as KategoriSeni[]).map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setKategori(cat);
                setSelectedMatch(null);
              }}
              className={`px-3 py-1.5 text-xs font-black rounded-lg border-2 cursor-pointer transition-all ${
                kategori === cat 
                  ? 'bg-zinc-950 text-white border-zinc-950 shadow-sm' 
                  : 'bg-white text-zinc-700 border-zinc-300 hover:border-zinc-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Champion Podium Highlight */}
      {champion && (
        <div className="bg-amber-400 border-4 border-zinc-950 rounded-3xl p-6 shadow-xl text-zinc-950">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-zinc-950 text-amber-400 rounded-2xl flex items-center justify-center border-3 border-zinc-950 shadow-md shrink-0">
                <Trophy className="w-9 h-9" />
              </div>
              <div>
                <span className="text-xs font-black uppercase tracking-widest bg-zinc-950 text-amber-400 px-3 py-0.5 rounded-full inline-block">
                  PERAIH MEDALI EMAS - JUARA 1 ({kategori})
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-zinc-950 mt-1">
                  {champion.nama}
                </h3>
                <p className="text-xs sm:text-sm font-bold text-zinc-900">
                  {champion.kontingen} • Skor Akhir: <strong>{champion.score ? champion.score.toFixed(3) : '-'}</strong>
                </p>
              </div>
            </div>

            {runnerUp && (
              <div className="p-3 bg-white border-2 border-zinc-950 rounded-2xl text-xs space-y-1 shadow-xs">
                <span className="font-bold text-zinc-600 block">Medali Perak (Juara 2):</span>
                <span className="font-black text-sm text-zinc-950 block">{runnerUp.nama}</span>
                <span className="text-zinc-600 font-medium">{runnerUp.kontingen} ({runnerUp.score ? runnerUp.score.toFixed(3) : '-'})</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Visual Tournament Tree Grid */}
      <div className="bg-white border-3 border-zinc-900 rounded-3xl p-6 sm:p-8 shadow-sm overflow-x-auto space-y-4">
        
        {/* Info Strip */}
        <div className="flex items-center justify-between border-b-2 border-zinc-200 pb-3 text-xs">
          <div className="flex items-center gap-2 text-zinc-600 font-medium">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Klik kartu pertandingan untuk melihat detail, pemenang, atau menghubungkan dengan jadwal gelanggang.</span>
          </div>
          <button
            onClick={handleResetBracket}
            className="text-zinc-500 hover:text-zinc-900 flex items-center gap-1 font-bold cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Bagan</span>
          </button>
        </div>

        <div className="min-w-[850px] grid grid-cols-3 gap-8 items-start pt-2">
          
          {/* Column 1: Babak Penyisihan / Perempat Final */}
          <div className="space-y-4">
            <div className="border-b-2 border-zinc-900 pb-2 flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-zinc-900">
                {maxRound === 3 ? 'Perempat Final (8 Besar)' : 'Penyisihan / Semi Final'}
              </h3>
              <span className="text-[10px] font-mono font-bold bg-zinc-100 px-2 py-0.5 rounded border border-zinc-300">
                {round1Matches.length} Partai
              </span>
            </div>

            <div className="space-y-4">
              {round1Matches.map((m) => {
                const isP1Win = m.winnerId === m.pesilat1?.id;
                const isP2Win = m.winnerId === m.pesilat2?.id;

                return (
                  <div
                    key={m.id}
                    onClick={() => setSelectedMatch(m)}
                    className="bg-zinc-50 border-3 border-zinc-900 hover:border-blue-600 rounded-2xl p-3 shadow-xs space-y-2 cursor-pointer transition-all hover:shadow-md"
                  >
                    <div className="text-[10px] font-mono font-bold text-zinc-500 flex justify-between">
                      <span>MATCH #{m.matchNumber}</span>
                      <span className="font-semibold text-blue-700">Detail & Pemenang →</span>
                    </div>

                    {/* Pesilat 1 (Sudut Merah) */}
                    <div className={`p-2.5 rounded-xl border-2 flex items-center justify-between transition-colors ${
                      isP1Win 
                        ? 'bg-emerald-50 border-emerald-600 font-black text-emerald-950 shadow-xs' 
                        : 'bg-white border-zinc-200 font-bold'
                    }`}>
                      <div className="truncate max-w-[150px] text-xs flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0"></span>
                        <span className="truncate">{m.pesilat1?.nama || 'Menunggu Lawan'}</span>
                      </div>
                      <span className="font-mono text-xs font-black">
                        {m.pesilat1?.score !== undefined ? m.pesilat1.score.toFixed(3) : '-'}
                      </span>
                    </div>

                    {/* Pesilat 2 (Sudut Merah) */}
                    <div className={`p-2.5 rounded-xl border-2 flex items-center justify-between transition-colors ${
                      isP2Win 
                        ? 'bg-emerald-50 border-emerald-600 font-black text-emerald-950 shadow-xs' 
                        : 'bg-white border-zinc-200 font-bold'
                    }`}>
                      <div className="truncate max-w-[150px] text-xs flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-600 shrink-0"></span>
                        <span className="truncate">{m.pesilat2?.nama || 'Menunggu Lawan'}</span>
                      </div>
                      <span className="font-mono text-xs font-black">
                        {m.pesilat2?.score !== undefined ? m.pesilat2.score.toFixed(3) : '-'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Column 2: Babak Semi Final */}
          <div className="space-y-4">
            <div className="border-b-2 border-zinc-900 pb-2 flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-zinc-900">
                {maxRound === 3 ? 'Semi Final (4 Besar)' : 'Perebutan Medali'}
              </h3>
              <span className="text-[10px] font-mono font-bold bg-zinc-100 px-2 py-0.5 rounded border border-zinc-300">
                {round2Matches.length} Partai
              </span>
            </div>

            <div className="space-y-12 pt-4">
              {round2Matches.map((m) => {
                const isP1Win = m.winnerId === m.pesilat1?.id;
                const isP2Win = m.winnerId === m.pesilat2?.id;

                return (
                  <div
                    key={m.id}
                    onClick={() => setSelectedMatch(m)}
                    className="bg-zinc-50 border-3 border-zinc-900 hover:border-blue-600 rounded-2xl p-3 shadow-xs space-y-2 cursor-pointer transition-all hover:shadow-md"
                  >
                    <div className="text-[10px] font-mono font-bold text-zinc-500 flex justify-between">
                      <span>SEMI FINAL #{m.matchNumber}</span>
                      <span className="font-semibold text-blue-700">Detail & Pemenang →</span>
                    </div>

                    <div className={`p-2.5 rounded-xl border-2 flex items-center justify-between transition-colors ${
                      isP1Win 
                        ? 'bg-emerald-50 border-emerald-600 font-black text-emerald-950 shadow-xs' 
                        : 'bg-white border-zinc-200 font-bold'
                    }`}>
                      <div className="truncate max-w-[150px] text-xs flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0"></span>
                        <span className="truncate">{m.pesilat1?.nama || 'TBD (Pemenang QF)'}</span>
                      </div>
                      <span className="font-mono text-xs font-black">
                        {m.pesilat1?.score !== undefined ? m.pesilat1.score.toFixed(3) : '-'}
                      </span>
                    </div>

                    <div className={`p-2.5 rounded-xl border-2 flex items-center justify-between transition-colors ${
                      isP2Win 
                        ? 'bg-emerald-50 border-emerald-600 font-black text-emerald-950 shadow-xs' 
                        : 'bg-white border-zinc-200 font-bold'
                    }`}>
                      <div className="truncate max-w-[150px] text-xs flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-600 shrink-0"></span>
                        <span className="truncate">{m.pesilat2?.nama || 'TBD (Pemenang QF)'}</span>
                      </div>
                      <span className="font-mono text-xs font-black">
                        {m.pesilat2?.score !== undefined ? m.pesilat2.score.toFixed(3) : '-'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Column 3: Grand Final */}
          <div className="space-y-4">
            <div className="border-b-2 border-zinc-900 pb-2 flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-amber-600 flex items-center gap-1">
                <Trophy className="w-4 h-4 text-amber-500" />
                <span>Grand Final (Emas)</span>
              </h3>
              <span className="text-[10px] font-mono font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded border border-amber-300">
                Puncak
              </span>
            </div>

            <div className="pt-16">
              {finalMatch && (
                <div
                  onClick={() => setSelectedMatch(finalMatch)}
                  className="bg-amber-50 border-4 border-zinc-950 rounded-3xl p-4 shadow-md space-y-3 cursor-pointer hover:shadow-xl transition-all"
                >
                  <div className="text-[11px] font-mono font-black text-amber-900 flex justify-between">
                    <span>PARTAI PUNCAK FINAL</span>
                    <span className="bg-amber-400 px-2 py-0.5 rounded text-zinc-950">MEDALI EMAS</span>
                  </div>

                  {/* Pesilat 1 */}
                  <div className={`p-3 rounded-2xl border-2 flex items-center justify-between ${
                    finalMatch.winnerId === finalMatch.pesilat1?.id 
                      ? 'bg-amber-300 border-zinc-950 font-black text-zinc-950 shadow-xs' 
                      : 'bg-white border-zinc-300 font-bold text-zinc-800'
                  }`}>
                    <div className="truncate max-w-[150px] text-xs flex items-center gap-1.5">
                      {finalMatch.winnerId === finalMatch.pesilat1?.id ? '🏆 ' : ''}
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0"></span>
                      <span className="truncate">{finalMatch.pesilat1?.nama || 'Finalis 1'}</span>
                    </div>
                    <span className="font-mono text-sm font-black">
                      {finalMatch.pesilat1?.score !== undefined ? finalMatch.pesilat1.score.toFixed(3) : '-'}
                    </span>
                  </div>

                  {/* Pesilat 2 */}
                  <div className={`p-3 rounded-2xl border-2 flex items-center justify-between ${
                    finalMatch.winnerId === finalMatch.pesilat2?.id 
                      ? 'bg-amber-300 border-zinc-950 font-black text-zinc-950 shadow-xs' 
                      : 'bg-white border-zinc-300 font-bold text-zinc-800'
                  }`}>
                    <div className="truncate max-w-[150px] text-xs flex items-center gap-1.5">
                      {finalMatch.winnerId === finalMatch.pesilat2?.id ? '🏆 ' : ''}
                      <span className="w-2.5 h-2.5 rounded-full bg-red-600 shrink-0"></span>
                      <span className="truncate">{finalMatch.pesilat2?.nama || 'Finalis 2'}</span>
                    </div>
                    <span className="font-mono text-sm font-black">
                      {finalMatch.pesilat2?.score !== undefined ? finalMatch.pesilat2.score.toFixed(3) : '-'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Interactive Match Action Modal */}
      {selectedMatch && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border-4 border-zinc-950 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b-2 border-zinc-200 pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold bg-zinc-900 text-white px-2 py-0.5 rounded">
                  ROUND {selectedMatch.round} • MATCH #{selectedMatch.matchNumber}
                </span>
                <h3 className="text-lg font-black text-zinc-950 mt-1">
                  Kontrol Pertandingan Bracket
                </h3>
              </div>
              <button
                onClick={() => setSelectedMatch(null)}
                className="w-8 h-8 rounded-full border-2 border-zinc-900 font-bold hover:bg-zinc-100 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {/* Pesilat 1 Option */}
              {selectedMatch.pesilat1 ? (
                <div className={`p-4 rounded-xl border-3 flex items-center justify-between ${
                  selectedMatch.winnerId === selectedMatch.pesilat1.id 
                    ? 'bg-emerald-50 border-emerald-600' 
                    : 'bg-zinc-50 border-zinc-300'
                }`}>
                  <div>
                    <span className="text-[10px] font-bold text-blue-600 uppercase">SUDUT BIRU</span>
                    <div className="font-black text-sm text-zinc-950">{selectedMatch.pesilat1.nama}</div>
                    <div className="text-xs text-zinc-600">{selectedMatch.pesilat1.kontingen}</div>
                    <div className="text-xs font-mono font-bold mt-1">
                      Skor: {selectedMatch.pesilat1.score !== undefined ? selectedMatch.pesilat1.score.toFixed(3) : 'Belum Ada Skor'}
                    </div>
                  </div>

                  <button
                    onClick={() => handleSetWinner(selectedMatch.id, selectedMatch.pesilat1!)}
                    className="px-3 py-2 bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold rounded-lg cursor-pointer"
                  >
                    {selectedMatch.winnerId === selectedMatch.pesilat1.id ? '✓ Pemenang Terpilih' : 'Pilih Menang'}
                  </button>
                </div>
              ) : (
                <div className="p-4 bg-zinc-100 border-2 border-dashed border-zinc-300 rounded-xl text-center text-xs text-zinc-500">
                  Menunggu pemenang babak sebelumnya...
                </div>
              )}

              {/* Pesilat 2 Option */}
              {selectedMatch.pesilat2 ? (
                <div className={`p-4 rounded-xl border-3 flex items-center justify-between ${
                  selectedMatch.winnerId === selectedMatch.pesilat2.id 
                    ? 'bg-emerald-50 border-emerald-600' 
                    : 'bg-zinc-50 border-zinc-300'
                }`}>
                  <div>
                    <span className="text-[10px] font-bold text-red-600 uppercase">SUDUT MERAH</span>
                    <div className="font-black text-sm text-zinc-950">{selectedMatch.pesilat2.nama}</div>
                    <div className="text-xs text-zinc-600">{selectedMatch.pesilat2.kontingen}</div>
                    <div className="text-xs font-mono font-bold mt-1">
                      Skor: {selectedMatch.pesilat2.score !== undefined ? selectedMatch.pesilat2.score.toFixed(3) : 'Belum Ada Skor'}
                    </div>
                  </div>

                  <button
                    onClick={() => handleSetWinner(selectedMatch.id, selectedMatch.pesilat2!)}
                    className="px-3 py-2 bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold rounded-lg cursor-pointer"
                  >
                    {selectedMatch.winnerId === selectedMatch.pesilat2.id ? '✓ Pemenang Terpilih' : 'Pilih Menang'}
                  </button>
                </div>
              ) : (
                <div className="p-4 bg-zinc-100 border-2 border-dashed border-zinc-300 rounded-xl text-center text-xs text-zinc-500">
                  Menunggu pemenang babak sebelumnya...
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedMatch(null)}
                className="px-4 py-2 bg-zinc-200 hover:bg-zinc-300 font-bold text-xs rounded-xl cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
