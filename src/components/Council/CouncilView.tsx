import React, { useState } from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  Video, 
  CheckCircle, 
  XCircle, 
  Award, 
  Clock, 
  Users, 
  Flame,
  Plus,
  Minus,
  Sparkles,
  Zap,
  Scale
} from 'lucide-react';
import { useTournament } from '../../context/TournamentContext';
import { Corner, WinType } from '../../types/scoring';

export const CouncilView: React.FC = () => {
  const {
    match,
    activeJudgeId,
    addCouncilPoints,
    adjustScoreDirect,
    applyFoul,
    requestVideoReplay,
    resolveVideoReplay,
    declareWinner,
    language,
  } = useTournament();

  const [selectedWinner, setSelectedWinner] = useState<'red' | 'blue' | 'draw' | null>(null);
  const [winType, setWinType] = useState<WinType>('angka');
  const [winNotes, setWinNotes] = useState<string>('');

  const winTypes: { id: WinType; label: string; desc: string }[] = [
    { id: 'angka', label: 'Menang Angka', desc: 'Unggul perolehan poin akhir babak 3' },
    { id: 'mutlak', label: 'Menang Mutlak', desc: 'Keputusan bulat seluruh dewan juri' },
    { id: 'wpo', label: 'Menang W.P.O', desc: 'Wasit Menghentikan Pertandingan (RSC)' },
    { id: 'tko', label: 'Menang T.K.O', desc: 'Technical Knockout / Jatuh hitungan 10' },
    { id: 'teknik', label: 'Menang Teknik', desc: 'Lawan cedera / undur diri / kuncian' },
    { id: 'diskualifikasi', label: 'Menang Diskualifikasi', desc: 'Lawan terkena peringatan 3 / pelanggaran fatal' },
  ];

  const handleDeclareWinner = () => {
    if (!selectedWinner) return;
    declareWinner(selectedWinner, winType, winNotes);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Top Header: Dewan & Live Match Overview */}
      <div className="bg-gradient-to-r from-emerald-950/70 via-black to-emerald-950/70 border border-emerald-500/40 rounded-2xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-900/60 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shadow">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-chakra text-lg font-black text-emerald-300 uppercase tracking-wider">
              {language === 'id' ? 'DEWAN PENDEKAR / KETUA PERTANDINGAN' : 'MATCH COUNCIL & JURY PRESIDENT'}
            </h2>
            <p className="text-xs text-gray-300">
              {match.arena} • {match.matchNumber} • {match.category.toUpperCase()} • {match.classPool}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-xs text-gray-400 block">Status Partai:</span>
            <span className="font-chakra font-bold text-sm uppercase text-amber-300">
              {match.status} (Babak {match.currentRound})
            </span>
          </div>

          <div className="flex items-center gap-2 bg-black/60 px-4 py-2 rounded-xl border border-emerald-500/30">
            <Clock className="w-4 h-4 text-emerald-400" />
            <span className="font-chakra text-xl font-bold text-white">
              {Math.floor(match.timerSeconds / 60).toString().padStart(2, '0')}:
              {(match.timerSeconds % 60).toString().padStart(2, '0')}
            </span>
          </div>
        </div>
      </div>

      {/* Realtime Judge Consensus Matrix (Live Lights) */}
      <div className="bg-black/60 border border-purple-500/30 rounded-2xl p-4 shadow-xl backdrop-blur-md">
        <div className="flex items-center justify-between mb-3">
          <span className="font-chakra text-xs font-bold text-purple-300 uppercase tracking-widest flex items-center gap-1.5">
            <Users className="w-4 h-4 text-amber-400" />
            MONITOR KONSENSUS JURI REALTIME (PERSILAT 2026 MATRIX)
          </span>
          <span className="text-[11px] text-gray-400">
            Kuorum Sah: <strong>{match.activeJudgeCount === 5 ? '3 dari 5 Juri' : '2 dari 3 Juri'}</strong>
          </span>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5].slice(0, match.activeJudgeCount).map((jId) => {
            // Find recent strike by this judge in the last 3 seconds
            const recent = match.recentJudgeVotes.find(
              (v) => v.judgeId === jId && v.timestamp >= Date.now() - 3000
            );

            return (
              <div
                key={jId}
                className={`p-3 rounded-xl border transition-all text-center ${
                  recent
                    ? recent.corner === 'red'
                      ? 'bg-red-900/60 border-red-400 glow-red scale-105'
                      : 'bg-blue-900/60 border-blue-400 glow-blue scale-105'
                    : 'bg-purple-950/20 border-purple-500/20 text-gray-400'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold mb-1">
                  <span>JURI {jId}</span>
                  {recent && (
                    <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                  )}
                </div>

                <div className="h-8 flex items-center justify-center">
                  {recent ? (
                    <span className="font-chakra font-black text-sm text-white uppercase tracking-wider">
                      {recent.action} (+{recent.points})
                    </span>
                  ) : (
                    <span className="text-[11px] text-gray-500 font-medium">Siap</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Two Corners Command: Red vs Blue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ================= RED CORNER COUNCIL ================= */}
        <div className="bg-gradient-to-br from-red-950/60 via-black to-red-950/30 border-2 border-red-500/50 rounded-2xl p-5 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-red-500/30 pb-3">
            <div>
              <span className="font-chakra font-black text-base text-red-400 uppercase tracking-widest flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                SUDUT MERAH
              </span>
              <h3 className="font-chakra text-lg font-bold text-white">
                {match.redCorner.athleteName}
              </h3>
              <p className="text-xs text-red-300">
                {match.redCorner.contingent} ({match.redCorner.countryOrCity})
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-gray-400 block">Total Skor</span>
              <span className="font-chakra text-4xl font-black text-red-400 led-score">
                {match.redCorner.score}
              </span>
            </div>
          </div>

          {/* Quick Point Adjustments & Jatuhan Sah */}
          <div>
            <span className="text-xs font-bold text-gray-300 uppercase tracking-wider block mb-2">
              Validasi Serangan & Jatuhan Sah:
            </span>
            <div className="grid grid-cols-4 gap-2">
              <button
                onClick={() => addCouncilPoints('red', 1, 'pukulan')}
                className="py-2 bg-red-900/60 hover:bg-red-800 border border-red-500/40 rounded-xl text-xs font-bold text-white transition-all active:scale-95"
              >
                +1 Pukulan
              </button>
              <button
                onClick={() => addCouncilPoints('red', 2, 'tendangan')}
                className="py-2 bg-red-800/80 hover:bg-red-700 border border-red-400/50 rounded-xl text-xs font-bold text-white transition-all active:scale-95"
              >
                +2 Tendangan
              </button>
              <button
                onClick={() => addCouncilPoints('red', 3, 'jatuhan')}
                className="py-2 bg-gradient-to-r from-amber-600 to-red-600 hover:from-amber-500 rounded-xl text-xs font-bold text-white shadow glow-gold transition-all active:scale-95 col-span-2 flex items-center justify-center gap-1"
              >
                <Award className="w-3.5 h-3.5" />
                Sahkan Jatuhan (+3)
              </button>
            </div>
          </div>

          {/* Hukuman & Pelanggaran Persilat 2026 */}
          <div>
            <span className="text-xs font-bold text-gray-300 uppercase tracking-wider block mb-2">
              Hukuman & Pelanggaran Wasit:
            </span>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <button
                onClick={() => applyFoul('red', 'binaan')}
                className="py-2 bg-black/60 hover:bg-red-950/50 border border-red-500/30 rounded-xl font-semibold text-gray-200"
              >
                Binaan ({match.redCorner.fouls.binaan})
              </button>
              <button
                onClick={() => applyFoul('red', 'teguran1')}
                className={`py-2 rounded-xl font-bold transition-all ${
                  match.redCorner.fouls.teguran1
                    ? 'bg-amber-600 text-black shadow'
                    : 'bg-black/60 hover:bg-amber-950/40 border border-amber-500/30 text-amber-200'
                }`}
              >
                Teguran 1 (-1)
              </button>
              <button
                onClick={() => applyFoul('red', 'teguran2')}
                className={`py-2 rounded-xl font-bold transition-all ${
                  match.redCorner.fouls.teguran2
                    ? 'bg-amber-600 text-black shadow'
                    : 'bg-black/60 hover:bg-amber-950/40 border border-amber-500/30 text-amber-200'
                }`}
              >
                Teguran 2 (-2)
              </button>
              <button
                onClick={() => applyFoul('red', 'peringatan1')}
                className={`py-2 rounded-xl font-bold transition-all ${
                  match.redCorner.fouls.peringatan1
                    ? 'bg-orange-600 text-white shadow'
                    : 'bg-black/60 hover:bg-orange-950/40 border border-orange-500/30 text-orange-200'
                }`}
              >
                Peringatan 1 (-5)
              </button>
              <button
                onClick={() => applyFoul('red', 'peringatan2')}
                className={`py-2 rounded-xl font-bold transition-all ${
                  match.redCorner.fouls.peringatan2
                    ? 'bg-red-600 text-white shadow glow-red'
                    : 'bg-black/60 hover:bg-red-950/40 border border-red-500/30 text-red-200'
                }`}
              >
                Peringatan 2 (-10)
              </button>
              <button
                onClick={() => {
                  if (window.confirm('Diskualifikasi sudut MERAH? Sudut Biru akan langsung memenangkan partai.')) {
                    applyFoul('red', 'diskualifikasi');
                  }
                }}
                className="py-2 bg-red-950/80 hover:bg-red-900 border border-red-500 rounded-xl font-bold text-red-300"
              >
                DISKUALIFIKASI
              </button>
            </div>
          </div>

          {/* Video Replay (VR Challenge) */}
          <div className="bg-black/50 border border-red-500/30 rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-red-300 uppercase flex items-center gap-1.5">
                <Video className="w-3.5 h-3.5" />
                Video Replay (VR) Sudut Merah
              </span>
              <span className="text-xs text-amber-300 font-bold">
                Sisa Kartu: {match.redCorner.vrQuota}/2
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => requestVideoReplay('red')}
                disabled={match.redCorner.vrQuota <= 0}
                className="flex-1 py-1.5 bg-purple-900/50 hover:bg-purple-800 disabled:opacity-40 border border-purple-500/40 rounded-lg text-xs font-semibold text-purple-200"
              >
                Ajukan Review VR
              </button>
              <button
                onClick={() => resolveVideoReplay('red', true)}
                className="py-1.5 px-3 bg-emerald-700 hover:bg-emerald-600 rounded-lg text-xs font-bold text-white flex items-center gap-1"
                title="Terima / Sukses (Kartu tidak berkurang)"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                Terima
              </button>
              <button
                onClick={() => resolveVideoReplay('red', false)}
                className="py-1.5 px-3 bg-red-800 hover:bg-red-700 rounded-lg text-xs font-bold text-white flex items-center gap-1"
                title="Tolak (Kartu berkurang 1)"
              >
                <XCircle className="w-3.5 h-3.5" />
                Tolak
              </button>
            </div>
          </div>
        </div>

        {/* ================= BLUE CORNER COUNCIL ================= */}
        <div className="bg-gradient-to-br from-blue-950/60 via-black to-blue-950/30 border-2 border-blue-500/50 rounded-2xl p-5 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-blue-500/30 pb-3">
            <div>
              <span className="font-chakra font-black text-base text-blue-400 uppercase tracking-widest flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
                SUDUT BIRU
              </span>
              <h3 className="font-chakra text-lg font-bold text-white">
                {match.blueCorner.athleteName}
              </h3>
              <p className="text-xs text-blue-300">
                {match.blueCorner.contingent} ({match.blueCorner.countryOrCity})
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-gray-400 block">Total Skor</span>
              <span className="font-chakra text-4xl font-black text-blue-400 led-score">
                {match.blueCorner.score}
              </span>
            </div>
          </div>

          {/* Quick Point Adjustments & Jatuhan Sah */}
          <div>
            <span className="text-xs font-bold text-gray-300 uppercase tracking-wider block mb-2">
              Validasi Serangan & Jatuhan Sah:
            </span>
            <div className="grid grid-cols-4 gap-2">
              <button
                onClick={() => addCouncilPoints('blue', 1, 'pukulan')}
                className="py-2 bg-blue-900/60 hover:bg-blue-800 border border-blue-500/40 rounded-xl text-xs font-bold text-white transition-all active:scale-95"
              >
                +1 Pukulan
              </button>
              <button
                onClick={() => addCouncilPoints('blue', 2, 'tendangan')}
                className="py-2 bg-blue-800/80 hover:bg-blue-700 border border-blue-400/50 rounded-xl text-xs font-bold text-white transition-all active:scale-95"
              >
                +2 Tendangan
              </button>
              <button
                onClick={() => addCouncilPoints('blue', 3, 'jatuhan')}
                className="py-2 bg-gradient-to-r from-amber-600 to-blue-600 hover:from-amber-500 rounded-xl text-xs font-bold text-white shadow glow-gold transition-all active:scale-95 col-span-2 flex items-center justify-center gap-1"
              >
                <Award className="w-3.5 h-3.5" />
                Sahkan Jatuhan (+3)
              </button>
            </div>
          </div>

          {/* Hukuman & Pelanggaran Persilat 2026 */}
          <div>
            <span className="text-xs font-bold text-gray-300 uppercase tracking-wider block mb-2">
              Hukuman & Pelanggaran Wasit:
            </span>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <button
                onClick={() => applyFoul('blue', 'binaan')}
                className="py-2 bg-black/60 hover:bg-blue-950/50 border border-blue-500/30 rounded-xl font-semibold text-gray-200"
              >
                Binaan ({match.blueCorner.fouls.binaan})
              </button>
              <button
                onClick={() => applyFoul('blue', 'teguran1')}
                className={`py-2 rounded-xl font-bold transition-all ${
                  match.blueCorner.fouls.teguran1
                    ? 'bg-amber-600 text-black shadow'
                    : 'bg-black/60 hover:bg-amber-950/40 border border-amber-500/30 text-amber-200'
                }`}
              >
                Teguran 1 (-1)
              </button>
              <button
                onClick={() => applyFoul('blue', 'teguran2')}
                className={`py-2 rounded-xl font-bold transition-all ${
                  match.blueCorner.fouls.teguran2
                    ? 'bg-amber-600 text-black shadow'
                    : 'bg-black/60 hover:bg-amber-950/40 border border-amber-500/30 text-amber-200'
                }`}
              >
                Teguran 2 (-2)
              </button>
              <button
                onClick={() => applyFoul('blue', 'peringatan1')}
                className={`py-2 rounded-xl font-bold transition-all ${
                  match.blueCorner.fouls.peringatan1
                    ? 'bg-orange-600 text-white shadow'
                    : 'bg-black/60 hover:bg-orange-950/40 border border-orange-500/30 text-orange-200'
                }`}
              >
                Peringatan 1 (-5)
              </button>
              <button
                onClick={() => applyFoul('blue', 'peringatan2')}
                className={`py-2 rounded-xl font-bold transition-all ${
                  match.blueCorner.fouls.peringatan2
                    ? 'bg-red-600 text-white shadow glow-red'
                    : 'bg-black/60 hover:bg-red-950/40 border border-red-500/30 text-red-200'
                }`}
              >
                Peringatan 2 (-10)
              </button>
              <button
                onClick={() => {
                  if (window.confirm('Diskualifikasi sudut BIRU? Sudut Merah akan langsung memenangkan partai.')) {
                    applyFoul('blue', 'diskualifikasi');
                  }
                }}
                className="py-2 bg-red-950/80 hover:bg-red-900 border border-red-500 rounded-xl font-bold text-red-300"
              >
                DISKUALIFIKASI
              </button>
            </div>
          </div>

          {/* Video Replay (VR Challenge) */}
          <div className="bg-black/50 border border-blue-500/30 rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-blue-300 uppercase flex items-center gap-1.5">
                <Video className="w-3.5 h-3.5" />
                Video Replay (VR) Sudut Biru
              </span>
              <span className="text-xs text-amber-300 font-bold">
                Sisa Kartu: {match.blueCorner.vrQuota}/2
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => requestVideoReplay('blue')}
                disabled={match.blueCorner.vrQuota <= 0}
                className="flex-1 py-1.5 bg-purple-900/50 hover:bg-purple-800 disabled:opacity-40 border border-purple-500/40 rounded-lg text-xs font-semibold text-purple-200"
              >
                Ajukan Review VR
              </button>
              <button
                onClick={() => resolveVideoReplay('blue', true)}
                className="py-1.5 px-3 bg-emerald-700 hover:bg-emerald-600 rounded-lg text-xs font-bold text-white flex items-center gap-1"
                title="Terima / Sukses (Kartu tidak berkurang)"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                Terima
              </button>
              <button
                onClick={() => resolveVideoReplay('blue', false)}
                className="py-1.5 px-3 bg-red-800 hover:bg-red-700 rounded-lg text-xs font-bold text-white flex items-center gap-1"
                title="Tolak (Kartu berkurang 1)"
              >
                <XCircle className="w-3.5 h-3.5" />
                Tolak
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Official Winner Decision Panel */}
      <div className="bg-gradient-to-r from-purple-950/80 via-black to-purple-950/80 border-2 border-purple-500/40 rounded-2xl p-5 shadow-2xl space-y-4">
        <h3 className="font-chakra text-base font-black text-amber-300 uppercase tracking-wider flex items-center gap-2">
          <Award className="w-5 h-5" />
          PENETAPAN KEPUTUSAN PEMENANG PARTAI (BERITA ACARA RESMI)
        </h3>

        {/* Winner Selector Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => setSelectedWinner('red')}
            className={`p-3 rounded-xl border-2 font-chakra font-black text-sm tracking-wider uppercase transition-all flex items-center justify-center gap-2 ${
              selectedWinner === 'red'
                ? 'bg-red-600 border-red-300 text-white shadow-lg glow-red scale-[1.02]'
                : 'bg-black/50 border-red-500/30 text-red-300 hover:bg-red-950/40'
            }`}
          >
            <span className="w-3 h-3 rounded-full bg-red-500" />
            PEMENANG SUDUT MERAH
          </button>

          <button
            onClick={() => setSelectedWinner('blue')}
            className={`p-3 rounded-xl border-2 font-chakra font-black text-sm tracking-wider uppercase transition-all flex items-center justify-center gap-2 ${
              selectedWinner === 'blue'
                ? 'bg-blue-600 border-blue-300 text-white shadow-lg glow-blue scale-[1.02]'
                : 'bg-black/50 border-blue-500/30 text-blue-300 hover:bg-blue-950/40'
            }`}
          >
            <span className="w-3 h-3 rounded-full bg-blue-500" />
            PEMENANG SUDUT BIRU
          </button>

          <button
            onClick={() => setSelectedWinner('draw')}
            className={`p-3 rounded-xl border-2 font-chakra font-black text-sm tracking-wider uppercase transition-all flex items-center justify-center gap-2 ${
              selectedWinner === 'draw'
                ? 'bg-amber-600 border-amber-300 text-black shadow-lg glow-gold scale-[1.02]'
                : 'bg-black/50 border-amber-500/30 text-amber-300 hover:bg-amber-950/40'
            }`}
          >
            SERI / DRAW
          </button>
        </div>

        {/* Win Type Selection */}
        <div>
          <span className="text-xs font-bold text-purple-300 uppercase block mb-2">
            Klasifikasi Kemenangan Persilat / IPSI:
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {winTypes.map((t) => (
              <button
                key={t.id}
                onClick={() => setWinType(t.id)}
                className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                  winType === t.id
                    ? 'bg-purple-600 border-purple-300 text-white font-bold shadow'
                    : 'bg-black/40 border-purple-500/20 text-gray-300 hover:bg-purple-950/40'
                }`}
              >
                <div className="font-chakra font-bold">{t.label}</div>
                <div className="text-[10px] text-purple-200/70 truncate">{t.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Notes & Submit */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <input
            type="text"
            placeholder="Catatan tambahan keputusan dewan (opsional)..."
            value={winNotes}
            onChange={(e) => setWinNotes(e.target.value)}
            className="w-full sm:flex-1 bg-black/60 border border-purple-500/40 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-400"
          />

          <button
            onClick={handleDeclareWinner}
            disabled={!selectedWinner}
            className="w-full sm:w-auto py-2.5 px-6 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 disabled:opacity-40 font-chakra font-black text-sm tracking-wider uppercase text-black rounded-xl shadow-lg glow-gold transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Sahkan Pemenang & Bunyikan Gong
          </button>
        </div>
      </div>
    </div>
  );
};
