import React, { useState } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  AlertTriangle, 
  Gavel, 
  Video, 
  Award, 
  Trash2, 
  Clock, 
  ShieldAlert,
  Sliders,
  Check
} from 'lucide-react';
import { MatchData, Corner, ScoreActionType, WinType } from '../types/silat';
import { calculateMatchSummary, formatTime } from '../utils/rules';
import { silatAudio } from '../utils/audio';

interface DewanControlProps {
  match: MatchData;
  onUpdateMatch: (match: MatchData) => void;
  onDeclareWinner: () => void;
}

export const DewanControl: React.FC<DewanControlProps> = ({
  match,
  onUpdateMatch,
  onDeclareWinner,
}) => {
  const summary = calculateMatchSummary(match);
  const [varReason, setVarReason] = useState<string>('Verifikasi Jatuhan Sah');
  const [targetCornerVar, setTargetCornerVar] = useState<Corner>('merah');

  // Timer actions
  const toggleTimer = () => {
    if (match.timerStatus === 'RUNNING') {
      onUpdateMatch({ ...match, timerStatus: 'PAUSED' });
      // Sesuai instruksi: jeda / pause TANPA SUARA
    } else {
      const isResuming = match.timeRemaining < match.roundDurationSeconds && match.timeRemaining > 0;
      onUpdateMatch({ ...match, timerStatus: 'RUNNING' });
      // Sound buzzer hanya berbunyi saat MULAI babak (bukan saat lanjutkan/resume dari jeda)
      if (!isResuming) {
        silatAudio.playBuzzer();
      }
    }
  };

  const resetRoundTime = () => {
    onUpdateMatch({
      ...match,
      timerStatus: 'STOPPED',
      timeRemaining: match.roundDurationSeconds,
    });
  };

  const changeRound = (roundNum: number) => {
    onUpdateMatch({
      ...match,
      currentRound: roundNum,
      timeRemaining: match.roundDurationSeconds,
      timerStatus: 'STOPPED',
    });
  };

  const startRestPeriod = () => {
    onUpdateMatch({
      ...match,
      timerStatus: 'REST',
      timeRemaining: match.restDurationSeconds,
    });
    silatAudio.playBuzzer();
  };

  const adjustDuration = (seconds: number) => {
    onUpdateMatch({
      ...match,
      roundDurationSeconds: seconds,
      timeRemaining: seconds,
      timerStatus: 'STOPPED',
    });
  };

  // Penalties
  const addPenalty = (corner: Corner, action: ScoreActionType, points: number, note: string) => {
    const entry = {
      id: `penalty-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now(),
      matchId: match.id,
      round: match.currentRound,
      corner,
      action,
      points,
      judgeId: 0 as const, // Dewan / Wasit
      note,
    };

    onUpdateMatch({
      ...match,
      scores: [...match.scores, entry],
    });

    silatAudio.playPenaltyTone();
  };

  // Trigger VAR Challenge
  const handleTriggerVAR = (corner: Corner) => {
    const isRed = corner === 'merah';
    const remaining = isRed ? match.redCardsRemaining : match.blueCardsRemaining;
    if (remaining <= 0) {
      alert(`Kartu VAR Sudut ${corner.toUpperCase()} sudah habis!`);
      return;
    }

    onUpdateMatch({
      ...match,
      timerStatus: 'PAUSED',
      videoChallenge: {
        corner,
        round: match.currentRound,
        timeRemaining: match.timeRemaining,
        status: 'PENDING',
        reason: varReason,
      },
    });
    silatAudio.playWhistle();
  };

  // Official Jatuhan from Referee
  const handleRefereeJatuhan = (corner: Corner) => {
    const entry = {
      id: `ref-jatuhan-${Date.now()}`,
      timestamp: Date.now(),
      matchId: match.id,
      round: match.currentRound,
      corner,
      action: 'JATUHAN' as const,
      points: 3,
      judgeId: 0 as const,
      note: 'Jatuhan disahkan oleh Wasit / Dewan',
    };

    onUpdateMatch({
      ...match,
      scores: [...match.scores, entry],
    });
    silatAudio.playScoreBeep(corner);
  };

  // Clear all scores of current match
  const handleClearScores = () => {
    if (window.confirm('Reset seluruh nilai dan riwayat untuk partai ini?')) {
      onUpdateMatch({
        ...match,
        scores: [],
        currentRound: 1,
        timeRemaining: match.roundDurationSeconds,
        timerStatus: 'STOPPED',
        winner: null,
        winType: null,
        videoChallenge: null,
        redCardsRemaining: 2,
        blueCardsRemaining: 2,
      });
      silatAudio.playWhistle();
    }
  };

  return (
    <div className="w-full flex flex-col gap-5 py-2">
      {/* Top Banner: Master Control */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl px-5 py-3.5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Gavel className="w-5 h-5 text-amber-400" />
            <span>Kontrol Dewan & Wasit Pertandingan</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Pengendali waktu resmi, input hukuman wasit, verifikasi jatuhan, dan keputusan VAR
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onDeclareWinner}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold transition-colors"
          >
            <Award className="w-4 h-4" />
            <span>Sahkan Pemenang</span>
          </button>
          <button
            onClick={handleClearScores}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-red-950 hover:text-red-300 text-slate-400 border border-slate-700 rounded-lg text-xs font-semibold transition-colors"
            title="Reset Seluruh Poin Pertandingan"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset Nilai</span>
          </button>
        </div>
      </div>

      {/* Row 1: Arena Timer & Round Management Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-bold text-white">PENGATUR WAKTU GELANGGANG</span>
          </div>
          <div className="text-xs font-mono text-slate-400">
            Waktu Aktif: <strong className="text-white">{formatTime(match.timeRemaining)}</strong> · Status: {match.timerStatus}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
          {/* Big Start/Stop & Reset buttons */}
          <div className="md:col-span-2 flex flex-wrap items-center gap-2">
            <button
              onClick={toggleTimer}
              className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all ${
                match.timerStatus === 'RUNNING'
                  ? 'bg-amber-600 hover:bg-amber-500 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              {match.timerStatus === 'RUNNING' ? (
                <>
                  <Pause className="w-4 h-4" />
                  <span>Jeda Waktu (Pause)</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>Jalankan Waktu (Mulai)</span>
                </>
              )}
            </button>

            <button
              onClick={resetRoundTime}
              className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset Waktu</span>
            </button>

            <button
              onClick={startRestPeriod}
              className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <span>Istirahat (1 Menit)</span>
            </button>
          </div>

          {/* Babak Switcher */}
          <div>
            <div className="text-[11px] font-semibold text-slate-400 mb-1.5 uppercase">
              Pilih Babak Pertandingan
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {[1, 2, 3].map((r) => (
                <button
                  key={r}
                  onClick={() => changeRound(r)}
                  className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                    match.currentRound === r
                      ? 'bg-amber-500 text-slate-950 border-amber-400 font-extrabold shadow-sm'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  Babak {r}
                </button>
              ))}
            </div>
          </div>

          {/* Preset Duration Selector */}
          <div>
            <div className="text-[11px] font-semibold text-slate-400 mb-1.5 uppercase">
              Durasi Ronde (Standar IPSI)
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { label: '1:30', sec: 90 },
                { label: '2:00', sec: 120 },
                { label: '3:00', sec: 180 },
              ].map((dur) => (
                <button
                  key={dur.sec}
                  onClick={() => adjustDuration(dur.sec)}
                  className={`py-2 text-xs font-mono font-bold rounded-lg border transition-all ${
                    match.roundDurationSeconds === dur.sec
                      ? 'bg-blue-600 text-white border-blue-400'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  {dur.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Official Penalties & Sanctions (Hukuman Wasit) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* SUDUT MERAH PENALTIES */}
        <div className="bg-gradient-to-b from-red-950/60 to-slate-900 border border-red-800/80 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-red-800/60 pb-2.5 mb-3">
              <span className="text-xs font-extrabold uppercase tracking-widest text-red-400 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                HUKUMAN WASIT · SUDUT MERAH
              </span>
              <span className="text-xs font-mono text-red-300">
                Total Poin: {summary.redTotal}
              </span>
            </div>

            <div className="text-xs text-slate-300 font-semibold mb-3">
              {match.redFighter.name} ({match.redFighter.contingent})
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                onClick={() => addPenalty('merah', 'BINAAN_1', 0, 'Binaan 1')}
                className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium text-center"
              >
                <div>Binaan I</div>
                <div className="text-[10px] text-slate-400 font-mono">0 Poin (Catatan)</div>
              </button>

              <button
                onClick={() => addPenalty('merah', 'BINAAN_2', 0, 'Binaan 2')}
                className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium text-center"
              >
                <div>Binaan II</div>
                <div className="text-[10px] text-slate-400 font-mono">0 Poin (Catatan)</div>
              </button>

              <button
                onClick={() => addPenalty('merah', 'TEGURAN_1', -1, 'Teguran 1')}
                className="p-2.5 bg-amber-950/70 hover:bg-amber-900 text-amber-200 border border-amber-800 rounded-lg text-xs font-bold text-center"
              >
                <div>Teguran I</div>
                <div className="text-[10px] font-mono text-amber-300">-1 Poin</div>
              </button>

              <button
                onClick={() => addPenalty('merah', 'TEGURAN_2', -2, 'Teguran 2')}
                className="p-2.5 bg-amber-900/80 hover:bg-amber-800 text-amber-100 border border-amber-700 rounded-lg text-xs font-bold text-center"
              >
                <div>Teguran II</div>
                <div className="text-[10px] font-mono text-amber-200">-2 Poin</div>
              </button>

              <button
                onClick={() => addPenalty('merah', 'PERINGATAN_1', -5, 'Peringatan 1')}
                className="p-2.5 bg-red-900/80 hover:bg-red-800 text-white border border-red-600 rounded-lg text-xs font-bold text-center"
              >
                <div>Peringatan I</div>
                <div className="text-[10px] font-mono text-red-200">-5 Poin</div>
              </button>

              <button
                onClick={() => addPenalty('merah', 'PERINGATAN_2', -10, 'Peringatan 2')}
                className="p-2.5 bg-red-900/90 hover:bg-red-700 text-white border border-red-500 rounded-lg text-xs font-bold text-center"
              >
                <div>Peringatan II</div>
                <div className="text-[10px] font-mono text-red-200">-10 Poin</div>
              </button>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-red-900/60 flex flex-wrap gap-2">
            <button
              onClick={() => handleRefereeJatuhan('merah')}
              className="flex-1 py-2 px-3 bg-red-800 hover:bg-red-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Sahkan Jatuhan Merah (+3)</span>
            </button>
            <button
              onClick={() => {
                if (window.confirm('Diskualifikasi Sudut Merah? Kemenangan otomatis diberikan kepada Sudut Biru.')) {
                  addPenalty('merah', 'DISKUALIFIKASI', 0, 'Diskualifikasi');
                  onUpdateMatch({
                    ...match,
                    winner: 'biru',
                    winType: 'DISKUALIFIKASI',
                    winReason: 'Sudut Merah terkena Hukuman Diskualifikasi oleh Wasit',
                  });
                }
              }}
              className="py-2 px-3 bg-red-950 hover:bg-red-900 text-red-300 border border-red-800 rounded-lg text-xs font-bold flex items-center justify-center gap-1"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Diskualifikasi</span>
            </button>
          </div>
        </div>

        {/* SUDUT BIRU PENALTIES */}
        <div className="bg-gradient-to-b from-blue-950/60 to-slate-900 border border-blue-800/80 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-blue-800/60 pb-2.5 mb-3">
              <span className="text-xs font-extrabold uppercase tracking-widest text-blue-400 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                HUKUMAN WASIT · SUDUT BIRU
              </span>
              <span className="text-xs font-mono text-blue-300">
                Total Poin: {summary.blueTotal}
              </span>
            </div>

            <div className="text-xs text-slate-300 font-semibold mb-3">
              {match.blueFighter.name} ({match.blueFighter.contingent})
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                onClick={() => addPenalty('biru', 'BINAAN_1', 0, 'Binaan 1')}
                className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium text-center"
              >
                <div>Binaan I</div>
                <div className="text-[10px] text-slate-400 font-mono">0 Poin (Catatan)</div>
              </button>

              <button
                onClick={() => addPenalty('biru', 'BINAAN_2', 0, 'Binaan 2')}
                className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium text-center"
              >
                <div>Binaan II</div>
                <div className="text-[10px] text-slate-400 font-mono">0 Poin (Catatan)</div>
              </button>

              <button
                onClick={() => addPenalty('biru', 'TEGURAN_1', -1, 'Teguran 1')}
                className="p-2.5 bg-amber-950/70 hover:bg-amber-900 text-amber-200 border border-amber-800 rounded-lg text-xs font-bold text-center"
              >
                <div>Teguran I</div>
                <div className="text-[10px] font-mono text-amber-300">-1 Poin</div>
              </button>

              <button
                onClick={() => addPenalty('biru', 'TEGURAN_2', -2, 'Teguran 2')}
                className="p-2.5 bg-amber-900/80 hover:bg-amber-800 text-amber-100 border border-amber-700 rounded-lg text-xs font-bold text-center"
              >
                <div>Teguran II</div>
                <div className="text-[10px] font-mono text-amber-200">-2 Poin</div>
              </button>

              <button
                onClick={() => addPenalty('biru', 'PERINGATAN_1', -5, 'Peringatan 1')}
                className="p-2.5 bg-red-900/80 hover:bg-red-800 text-white border border-red-600 rounded-lg text-xs font-bold text-center"
              >
                <div>Peringatan I</div>
                <div className="text-[10px] font-mono text-red-200">-5 Poin</div>
              </button>

              <button
                onClick={() => addPenalty('biru', 'PERINGATAN_2', -10, 'Peringatan 2')}
                className="p-2.5 bg-red-900/90 hover:bg-red-700 text-white border border-red-500 rounded-lg text-xs font-bold text-center"
              >
                <div>Peringatan II</div>
                <div className="text-[10px] font-mono text-red-200">-10 Poin</div>
              </button>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-blue-900/60 flex flex-wrap gap-2">
            <button
              onClick={() => handleRefereeJatuhan('biru')}
              className="flex-1 py-2 px-3 bg-blue-800 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Sahkan Jatuhan Biru (+3)</span>
            </button>
            <button
              onClick={() => {
                if (window.confirm('Diskualifikasi Sudut Biru? Kemenangan otomatis diberikan kepada Sudut Merah.')) {
                  addPenalty('biru', 'DISKUALIFIKASI', 0, 'Diskualifikasi');
                  onUpdateMatch({
                    ...match,
                    winner: 'merah',
                    winType: 'DISKUALIFIKASI',
                    winReason: 'Sudut Biru terkena Hukuman Diskualifikasi oleh Wasit',
                  });
                }
              }}
              className="py-2 px-3 bg-red-950 hover:bg-red-900 text-red-300 border border-red-800 rounded-lg text-xs font-bold flex items-center justify-center gap-1"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Diskualifikasi</span>
            </button>
          </div>
        </div>
      </div>

      {/* Row 3: Video Replay (VAR) Challenge Controller */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Video className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-bold text-white">
              SISTEM VIDEO ASSISTANT REFEREE (VAR) PERSILAT 2022
            </span>
          </div>
          <div className="text-xs text-slate-400">
            Sisa Kartu: Merah ({match.redCardsRemaining}/2) · Biru ({match.blueCardsRemaining}/2)
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Sudut Pemohon VAR
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setTargetCornerVar('merah')}
                className={`py-2 px-3 rounded-lg text-xs font-bold border transition-colors ${
                  targetCornerVar === 'merah'
                    ? 'bg-red-600 text-white border-red-500'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                Sudut Merah ({match.redCardsRemaining})
              </button>
              <button
                onClick={() => setTargetCornerVar('biru')}
                className={`py-2 px-3 rounded-lg text-xs font-bold border transition-colors ${
                  targetCornerVar === 'biru'
                    ? 'bg-blue-600 text-white border-blue-500'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                Sudut Biru ({match.blueCardsRemaining})
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Alasan Video Replay
            </label>
            <select
              value={varReason}
              onChange={(e) => setVarReason(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
            >
              <option value="Verifikasi Jatuhan Sah">Verifikasi Jatuhan Sah</option>
              <option value="Verifikasi Pelanggaran Leher / Kepala">Verifikasi Pelanggaran Leher / Kepala</option>
              <option value="Verifikasi Pukulan / Tendangan Masuk">Verifikasi Pukulan / Tendangan Masuk</option>
              <option value="Verifikasi Serangan Setelah Aba-Aba Ti">Verifikasi Serangan Setelah Aba-Aba Ti</option>
              <option value="Verifikasi Jatuh Bersama">Verifikasi Jatuh Bersama</option>
            </select>
          </div>

          <div>
            <button
              onClick={() => handleTriggerVAR(targetCornerVar)}
              className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 shadow transition-colors"
            >
              <Video className="w-4 h-4" />
              <span>Ajukan Kartu VAR di Layar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
