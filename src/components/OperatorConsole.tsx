import React from 'react';
import {
  TandingMatch,
  Corner,
  RoundNumber,
  VictoryType,
} from '../types/silat';
import {
  calculateTotalScore,
  calculateRoundNetScore,
  formatTimer,
} from '../utils/silatCalculations';
import {
  Play,
  Pause,
  RotateCcw,
  Undo2,
  Bell,
  Clock,
  ShieldAlert,
  Award,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import {
  playGong,
  playWhistle,
  playBuzzer,
  playPointSound,
  playPenaltySound,
} from '../utils/audio';

interface OperatorConsoleProps {
  match: TandingMatch;
  onUpdateMatch: (updater: (prev: TandingMatch) => TandingMatch) => void;
  onDeclareWinnerModal: () => void;
}

export const OperatorConsole: React.FC<OperatorConsoleProps> = ({
  match,
  onUpdateMatch,
  onDeclareWinnerModal,
}) => {
  // Point addition handler
  const handleAddPoints = (
    corner: Corner,
    actionType: 'PUKULAN' | 'TENDANGAN' | 'JATUHAN' | 'KUNCIAN',
    points: number
  ) => {
    playPointSound(points >= 3);
    const round = match.currentRound;

    onUpdateMatch((prev) => {
      const fighterKey = corner === 'MERAH' ? 'merah' : 'biru';
      const currentDetail = { ...prev[fighterKey].roundScores[round] };

      if (actionType === 'PUKULAN') currentDetail.pukulan += 1;
      if (actionType === 'TENDANGAN') currentDetail.tendangan += 1;
      if (actionType === 'JATUHAN') currentDetail.jatuhan += 1;
      if (actionType === 'KUNCIAN') currentDetail.kuncian += 1;

      const log = {
        id: 'log-' + Date.now(),
        timestamp: new Date().toLocaleTimeString('id-ID'),
        round,
        corner,
        action: actionType,
        pointsDelta: points,
        label: `${actionType.charAt(0) + actionType.slice(1).toLowerCase()} (+${points})`,
      };

      return {
        ...prev,
        [fighterKey]: {
          ...prev[fighterKey],
          roundScores: {
            ...prev[fighterKey].roundScores,
            [round]: currentDetail,
          },
        },
        actionLogs: [...prev.actionLogs, log],
        updatedAt: new Date().toISOString(),
      };
    });
  };

  // Point deduction / correction handler
  const handleCorrectionPoints = (
    corner: Corner,
    actionType: 'PUKULAN' | 'TENDANGAN' | 'JATUHAN' | 'KUNCIAN',
    points: number
  ) => {
    playPenaltySound();
    const round = match.currentRound;

    onUpdateMatch((prev) => {
      const fighterKey = corner === 'MERAH' ? 'merah' : 'biru';
      const currentDetail = { ...prev[fighterKey].roundScores[round] };

      if (actionType === 'PUKULAN' && currentDetail.pukulan > 0) currentDetail.pukulan -= 1;
      else if (actionType === 'TENDANGAN' && currentDetail.tendangan > 0) currentDetail.tendangan -= 1;
      else if (actionType === 'JATUHAN' && currentDetail.jatuhan > 0) currentDetail.jatuhan -= 1;
      else if (actionType === 'KUNCIAN' && currentDetail.kuncian > 0) currentDetail.kuncian -= 1;
      else return prev; // nothing to deduct

      const log = {
        id: 'log-' + Date.now(),
        timestamp: new Date().toLocaleTimeString('id-ID'),
        round,
        corner,
        action: 'KOREKSI_MINUS' as const,
        pointsDelta: -points,
        label: `Koreksi ${actionType.charAt(0) + actionType.slice(1).toLowerCase()} (-${points})`,
      };

      return {
        ...prev,
        [fighterKey]: {
          ...prev[fighterKey],
          roundScores: {
            ...prev[fighterKey].roundScores,
            [round]: currentDetail,
          },
        },
        actionLogs: [...prev.actionLogs, log],
        updatedAt: new Date().toISOString(),
      };
    });
  };

  // Penalty handler
  const handleTogglePenalty = (
    corner: Corner,
    penaltyType: 'binaan' | 'teguran1' | 'teguran2' | 'peringatan1' | 'peringatan2' | 'disqualified'
  ) => {
    playPenaltySound();
    const round = match.currentRound;

    onUpdateMatch((prev) => {
      const fighterKey = corner === 'MERAH' ? 'merah' : 'biru';
      const currentPenalties = { ...prev[fighterKey].penalties };
      let delta = 0;
      let label = '';

      if (penaltyType === 'binaan') {
        const nextCount = (currentPenalties.binaanCount + 1) % 3;
        currentPenalties.binaanCount = nextCount;
        label = `Binaan (${nextCount}/2)`;
      } else if (penaltyType === 'teguran1') {
        currentPenalties.teguran1 = !currentPenalties.teguran1;
        delta = currentPenalties.teguran1 ? -1 : 1;
        label = currentPenalties.teguran1 ? 'Teguran I (-1)' : 'Batal Teguran I';
      } else if (penaltyType === 'teguran2') {
        currentPenalties.teguran2 = !currentPenalties.teguran2;
        delta = currentPenalties.teguran2 ? -2 : 2;
        label = currentPenalties.teguran2 ? 'Teguran II (-2)' : 'Batal Teguran II';
      } else if (penaltyType === 'peringatan1') {
        currentPenalties.peringatan1 = !currentPenalties.peringatan1;
        delta = currentPenalties.peringatan1 ? -5 : 5;
        label = currentPenalties.peringatan1 ? 'Peringatan I (-5)' : 'Batal Peringatan I';
      } else if (penaltyType === 'peringatan2') {
        currentPenalties.peringatan2 = !currentPenalties.peringatan2;
        delta = currentPenalties.peringatan2 ? -10 : 10;
        label = currentPenalties.peringatan2 ? 'Peringatan II (-10)' : 'Batal Peringatan II';
      } else if (penaltyType === 'disqualified') {
        currentPenalties.disqualified = !currentPenalties.disqualified;
        label = currentPenalties.disqualified ? 'DISKUALIFIKASI (DQ)' : 'Batal Diskualifikasi';
      }

      const log = {
        id: 'log-' + Date.now(),
        timestamp: new Date().toLocaleTimeString('id-ID'),
        round,
        corner,
        action: 'PERINGATAN_1' as const,
        pointsDelta: delta,
        label,
      };

      // If disqualified, opponent automatically declared winner
      let newWinner = prev.winner;
      let newVictoryType = prev.victoryType;
      if (currentPenalties.disqualified) {
        newWinner = corner === 'MERAH' ? 'BIRU' : 'MERAH';
        newVictoryType = 'MENANG_DISKUALIFIKASI';
      }

      return {
        ...prev,
        [fighterKey]: {
          ...prev[fighterKey],
          penalties: currentPenalties,
        },
        winner: newWinner,
        victoryType: newVictoryType,
        actionLogs: [...prev.actionLogs, log],
        updatedAt: new Date().toISOString(),
      };
    });
  };

  // Undo last action
  const handleUndo = () => {
    if (match.actionLogs.length === 0) return;
    onUpdateMatch((prev) => {
      const last = prev.actionLogs[prev.actionLogs.length - 1];
      const fighterKey = last.corner === 'MERAH' ? 'merah' : 'biru';
      const roundDetail = { ...prev[fighterKey].roundScores[last.round] };

      if (last.action === 'PUKULAN' && roundDetail.pukulan > 0) roundDetail.pukulan -= 1;
      else if (last.action === 'TENDANGAN' && roundDetail.tendangan > 0) roundDetail.tendangan -= 1;
      else if (last.action === 'JATUHAN' && roundDetail.jatuhan > 0) roundDetail.jatuhan -= 1;
      else if (last.action === 'KUNCIAN' && roundDetail.kuncian > 0) roundDetail.kuncian -= 1;

      return {
        ...prev,
        [fighterKey]: {
          ...prev[fighterKey],
          roundScores: {
            ...prev[fighterKey].roundScores,
            [last.round]: roundDetail,
          },
        },
        actionLogs: prev.actionLogs.slice(0, -1),
        updatedAt: new Date().toISOString(),
      };
    });
  };

  // Timer controls
  const handleToggleTimer = () => {
    onUpdateMatch((prev) => ({
      ...prev,
      isTimerRunning: !prev.isTimerRunning,
    }));
  };

  const handleAdjustTime = (seconds: number) => {
    onUpdateMatch((prev) => ({
      ...prev,
      timeRemainingSeconds: Math.max(0, prev.timeRemainingSeconds + seconds),
    }));
  };

  const handleSetRound = (r: RoundNumber) => {
    onUpdateMatch((prev) => ({
      ...prev,
      currentRound: r,
      timeRemainingSeconds: prev.roundDurationSeconds,
      isTimerRunning: false,
      isBreakTime: false,
    }));
  };

  const handleTriggerBreak = () => {
    onUpdateMatch((prev) => ({
      ...prev,
      isBreakTime: true,
      timeRemainingSeconds: prev.breakDurationSeconds,
      isTimerRunning: true,
    }));
  };

  const merahTotal = calculateTotalScore(match.merah);
  const biruTotal = calculateTotalScore(match.biru);

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-4 select-none">
      {/* Top Match Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-athletic text-xl font-bold text-amber-400">
              MEJA DEWAN & WASIT
            </span>
            <span className="text-slate-500">·</span>
            <span className="text-sm font-semibold text-white">
              {match.gelanggang} - PARTAI {match.partai}
            </span>
            <span className="text-slate-500">·</span>
            <span className="text-xs text-slate-300 font-medium">
              {match.kelasTanding} ({match.gender})
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Gunakan tombol di bawah untuk memasukkan poin pukulan (+1), tendangan (+2), jatuhan (+3), kuncian (+5), dan hukuman resmi.
          </p>
        </div>

        {/* Master Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleUndo}
            disabled={match.actionLogs.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors"
          >
            <Undo2 className="w-4 h-4" />
            <span>Batalkan Aksi Terakhir</span>
          </button>

          <button
            onClick={onDeclareWinnerModal}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl shadow-md transition-colors"
          >
            <Award className="w-4 h-4" />
            <span>Putusan Pemenang</span>
          </button>
        </div>
      </div>

      {/* Timer & Round Master Strip */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-slate-950 border border-slate-800 rounded-2xl p-4 items-center">
        {/* Round Switcher */}
        <div className="md:col-span-4 flex items-center gap-1.5">
          <span className="text-xs text-slate-400 font-semibold mr-1">Babak:</span>
          {[1, 2, 3].map((r) => {
            const rNum = r as RoundNumber;
            const isCurrent = match.currentRound === r && !match.isBreakTime;
            return (
              <button
                key={r}
                onClick={() => handleSetRound(rNum)}
                className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all ${
                  isCurrent
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md font-extrabold'
                    : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border-slate-800'
                }`}
              >
                Babak {r}
              </button>
            );
          })}
          <button
            onClick={handleTriggerBreak}
            className={`px-3 py-2 text-xs font-bold rounded-xl border transition-all ${
              match.isBreakTime
                ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-extrabold'
                : 'bg-slate-900 text-cyan-300 hover:bg-slate-800 border-slate-800'
            }`}
          >
            Istirahat
          </button>
        </div>

        {/* Digital Timer & Play/Pause */}
        <div className="md:col-span-4 flex items-center justify-center gap-3">
          <div className="text-center">
            <div
              className={`font-led text-4xl sm:text-5xl font-black ${
                match.isBreakTime
                  ? 'text-cyan-400'
                  : match.isTimerRunning
                  ? 'text-emerald-400 glow-green'
                  : 'text-white'
              }`}
            >
              {formatTimer(match.timeRemainingSeconds)}
            </div>
          </div>

          <button
            onClick={handleToggleTimer}
            className={`p-3 rounded-xl font-bold flex items-center justify-center transition-all ${
              match.isTimerRunning
                ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg'
            }`}
            title={match.isTimerRunning ? 'Jeda Timer' : 'Jalankan Timer'}
          >
            {match.isTimerRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
          </button>

          <div className="flex flex-col gap-1">
            <button
              onClick={() => handleAdjustTime(10)}
              className="px-2 py-1 text-[10px] font-bold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded"
              title="Tambah 10 detik"
            >
              +10s
            </button>
            <button
              onClick={() => handleAdjustTime(-10)}
              className="px-2 py-1 text-[10px] font-bold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded"
              title="Kurang 10 detik"
            >
              -10s
            </button>
          </div>
        </div>

        {/* Sound & Arena Tools */}
        <div className="md:col-span-4 flex items-center justify-end gap-2">
          <button
            onClick={() => playBuzzer()}
            className="flex-1 py-2 px-3 text-xs font-bold bg-amber-950/70 hover:bg-amber-900 text-amber-300 border border-amber-700/60 rounded-xl flex items-center justify-center gap-1.5"
          >
            <Bell className="w-4 h-4 text-amber-400" />
            <span>Sound Buzzer</span>
          </button>
          <button
            onClick={() => playWhistle()}
            className="flex-1 py-2 px-3 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-xl flex items-center justify-center gap-1.5"
          >
            <span>Peluit</span>
          </button>
          <button
            onClick={() => playBuzzer()}
            className="flex-1 py-2 px-3 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-red-300 border border-slate-700 rounded-xl flex items-center justify-center gap-1.5"
          >
            <span>Bel Buzzer</span>
          </button>
        </div>
      </div>

      {/* DUAL OPERATOR PADS: SUDUT MERAH & SUDUT BIRU */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* SUDUT MERAH CONTROL PANEL */}
        <div className="bg-gradient-to-b from-red-950/60 to-slate-950 border-2 border-red-800/80 rounded-2xl p-5 shadow-xl space-y-4">
          {/* Header Corner Merah */}
          <div className="flex items-center justify-between border-b border-red-800/50 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-red-600" />
                <span className="font-athletic text-xl font-black text-red-200 uppercase">
                  SUDUT MERAH
                </span>
              </div>
              <h3 className="font-bold text-lg text-white truncate max-w-xs sm:max-w-md">
                {match.merah.name}
              </h3>
              <p className="text-xs text-red-300/80 truncate">
                {match.merah.kontingen}
              </p>
            </div>

            {/* Score Big Display */}
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-red-400">Total Skor</span>
              <div className="font-led text-5xl font-black text-red-500 glow-red">
                {merahTotal}
              </div>
            </div>
          </div>

          {/* Point Input Matrix (+1, +2, +3, +5) */}
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Input Nilai Sah (Babak {match.currentRound})
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {/* +1 PUKULAN */}
              <button
                onClick={() => handleAddPoints('MERAH', 'PUKULAN', 1)}
                className="py-3 px-2 bg-red-700 hover:bg-red-600 active:scale-95 text-white rounded-xl font-athletic font-bold text-center border border-red-500 shadow-md transition-all flex flex-col items-center justify-center"
              >
                <span className="text-xs font-medium text-red-200">PUKULAN</span>
                <span className="text-2xl font-black font-led">+1</span>
              </button>

              {/* +2 TENDANGAN */}
              <button
                onClick={() => handleAddPoints('MERAH', 'TENDANGAN', 2)}
                className="py-3 px-2 bg-red-700 hover:bg-red-600 active:scale-95 text-white rounded-xl font-athletic font-bold text-center border border-red-500 shadow-md transition-all flex flex-col items-center justify-center"
              >
                <span className="text-xs font-medium text-red-200">TENDANGAN</span>
                <span className="text-2xl font-black font-led">+2</span>
              </button>

              {/* +3 JATUHAN */}
              <button
                onClick={() => handleAddPoints('MERAH', 'JATUHAN', 3)}
                className="py-3 px-2 bg-red-800 hover:bg-red-700 active:scale-95 text-white rounded-xl font-athletic font-bold text-center border border-red-500 shadow-md transition-all flex flex-col items-center justify-center"
              >
                <span className="text-xs font-medium text-red-200">JATUHAN</span>
                <span className="text-2xl font-black font-led">+3</span>
              </button>

              {/* +5 KUNCIAN */}
              <button
                onClick={() => handleAddPoints('MERAH', 'KUNCIAN', 5)}
                className="py-3 px-2 bg-red-900 hover:bg-red-800 active:scale-95 text-amber-300 rounded-xl font-athletic font-bold text-center border border-amber-500/60 shadow-md transition-all flex flex-col items-center justify-center"
              >
                <span className="text-xs font-medium text-red-200">KUNCIAN</span>
                <span className="text-2xl font-black font-led">+5</span>
              </button>
            </div>
          </div>

          {/* Koreksi / Deduct Strike Buttons */}
          <div className="bg-slate-950/70 border border-red-950 rounded-xl p-2.5">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 mb-1.5">
              <span>Koreksi Serangan (Kurangi Hit):</span>
              <span className="text-[10px] text-slate-500">Babak {match.currentRound}</span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              <button
                onClick={() => handleCorrectionPoints('MERAH', 'PUKULAN', 1)}
                className="py-1 px-1 text-[11px] font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded transition-colors"
              >
                -1 Pukulan
              </button>
              <button
                onClick={() => handleCorrectionPoints('MERAH', 'TENDANGAN', 2)}
                className="py-1 px-1 text-[11px] font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded transition-colors"
              >
                -2 Tendangan
              </button>
              <button
                onClick={() => handleCorrectionPoints('MERAH', 'JATUHAN', 3)}
                className="py-1 px-1 text-[11px] font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded transition-colors"
              >
                -3 Jatuhan
              </button>
              <button
                onClick={() => handleCorrectionPoints('MERAH', 'KUNCIAN', 5)}
                className="py-1 px-1 text-[11px] font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded transition-colors"
              >
                -5 Kuncian
              </button>
            </div>
          </div>

          {/* Penalties & Fouls (PERSILAT Rules) */}
          <div className="bg-slate-950/80 border border-red-900/50 rounded-xl p-3 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>Hukuman & Sanksi Wasit</span>
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {/* Binaan */}
              <button
                onClick={() => handleTogglePenalty('MERAH', 'binaan')}
                className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-left"
              >
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Binaan Lisan</div>
                <div className="font-bold text-amber-400 text-xs mt-0.5">
                  Binaan {match.merah.penalties.binaanCount} / 2
                </div>
              </button>

              {/* Teguran 1 */}
              <button
                onClick={() => handleTogglePenalty('MERAH', 'teguran1')}
                className={`p-2 border rounded-lg text-left transition-all ${
                  match.merah.penalties.teguran1
                    ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
                }`}
              >
                <div className="text-[10px] uppercase font-semibold">Teguran I</div>
                <div className="text-xs font-bold mt-0.5">-1 Poin</div>
              </button>

              {/* Teguran 2 */}
              <button
                onClick={() => handleTogglePenalty('MERAH', 'teguran2')}
                className={`p-2 border rounded-lg text-left transition-all ${
                  match.merah.penalties.teguran2
                    ? 'bg-amber-600 text-white border-amber-500 font-bold'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
                }`}
              >
                <div className="text-[10px] uppercase font-semibold">Teguran II</div>
                <div className="text-xs font-bold mt-0.5">-2 Poin</div>
              </button>

              {/* Peringatan 1 */}
              <button
                onClick={() => handleTogglePenalty('MERAH', 'peringatan1')}
                className={`p-2 border rounded-lg text-left transition-all ${
                  match.merah.penalties.peringatan1
                    ? 'bg-red-600 text-white border-red-500 font-bold'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
                }`}
              >
                <div className="text-[10px] uppercase font-semibold">Peringatan I</div>
                <div className="text-xs font-bold mt-0.5">-5 Poin</div>
              </button>

              {/* Peringatan 2 */}
              <button
                onClick={() => handleTogglePenalty('MERAH', 'peringatan2')}
                className={`p-2 border rounded-lg text-left transition-all ${
                  match.merah.penalties.peringatan2
                    ? 'bg-red-700 text-white border-red-600 font-bold'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
                }`}
              >
                <div className="text-[10px] uppercase font-semibold">Peringatan II</div>
                <div className="text-xs font-bold mt-0.5">-10 Poin</div>
              </button>

              {/* Diskualifikasi */}
              <button
                onClick={() => handleTogglePenalty('MERAH', 'disqualified')}
                className={`p-2 border rounded-lg text-left transition-all ${
                  match.merah.penalties.disqualified
                    ? 'bg-red-950 text-red-300 border-red-500 font-black animate-pulse'
                    : 'bg-slate-900 hover:bg-slate-800 text-red-400 border-slate-800'
                }`}
              >
                <div className="text-[10px] uppercase font-semibold">Diskualifikasi</div>
                <div className="text-xs font-bold mt-0.5">Sanksi DQ</div>
              </button>
            </div>
          </div>
        </div>

        {/* SUDUT BIRU CONTROL PANEL */}
        <div className="bg-gradient-to-b from-blue-950/60 to-slate-950 border-2 border-blue-800/80 rounded-2xl p-5 shadow-xl space-y-4">
          {/* Header Corner Biru */}
          <div className="flex items-center justify-between border-b border-blue-800/50 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-blue-600" />
                <span className="font-athletic text-xl font-black text-blue-200 uppercase">
                  SUDUT BIRU
                </span>
              </div>
              <h3 className="font-bold text-lg text-white truncate max-w-xs sm:max-w-md">
                {match.biru.name}
              </h3>
              <p className="text-xs text-blue-300/80 truncate">
                {match.biru.kontingen}
              </p>
            </div>

            {/* Score Big Display */}
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-blue-400">Total Skor</span>
              <div className="font-led text-5xl font-black text-blue-500 glow-blue">
                {biruTotal}
              </div>
            </div>
          </div>

          {/* Point Input Matrix (+1, +2, +3, +5) */}
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Input Nilai Sah (Babak {match.currentRound})
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {/* +1 PUKULAN */}
              <button
                onClick={() => handleAddPoints('BIRU', 'PUKULAN', 1)}
                className="py-3 px-2 bg-blue-700 hover:bg-blue-600 active:scale-95 text-white rounded-xl font-athletic font-bold text-center border border-blue-500 shadow-md transition-all flex flex-col items-center justify-center"
              >
                <span className="text-xs font-medium text-blue-200">PUKULAN</span>
                <span className="text-2xl font-black font-led">+1</span>
              </button>

              {/* +2 TENDANGAN */}
              <button
                onClick={() => handleAddPoints('BIRU', 'TENDANGAN', 2)}
                className="py-3 px-2 bg-blue-700 hover:bg-blue-600 active:scale-95 text-white rounded-xl font-athletic font-bold text-center border border-blue-500 shadow-md transition-all flex flex-col items-center justify-center"
              >
                <span className="text-xs font-medium text-blue-200">TENDANGAN</span>
                <span className="text-2xl font-black font-led">+2</span>
              </button>

              {/* +3 JATUHAN */}
              <button
                onClick={() => handleAddPoints('BIRU', 'JATUHAN', 3)}
                className="py-3 px-2 bg-blue-800 hover:bg-blue-700 active:scale-95 text-white rounded-xl font-athletic font-bold text-center border border-blue-500 shadow-md transition-all flex flex-col items-center justify-center"
              >
                <span className="text-xs font-medium text-blue-200">JATUHAN</span>
                <span className="text-2xl font-black font-led">+3</span>
              </button>

              {/* +5 KUNCIAN */}
              <button
                onClick={() => handleAddPoints('BIRU', 'KUNCIAN', 5)}
                className="py-3 px-2 bg-blue-900 hover:bg-blue-800 active:scale-95 text-amber-300 rounded-xl font-athletic font-bold text-center border border-amber-500/60 shadow-md transition-all flex flex-col items-center justify-center"
              >
                <span className="text-xs font-medium text-blue-200">KUNCIAN</span>
                <span className="text-2xl font-black font-led">+5</span>
              </button>
            </div>
          </div>

          {/* Koreksi / Deduct Strike Buttons */}
          <div className="bg-slate-950/70 border border-blue-950 rounded-xl p-2.5">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 mb-1.5">
              <span>Koreksi Serangan (Kurangi Hit):</span>
              <span className="text-[10px] text-slate-500">Babak {match.currentRound}</span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              <button
                onClick={() => handleCorrectionPoints('BIRU', 'PUKULAN', 1)}
                className="py-1 px-1 text-[11px] font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded transition-colors"
              >
                -1 Pukulan
              </button>
              <button
                onClick={() => handleCorrectionPoints('BIRU', 'TENDANGAN', 2)}
                className="py-1 px-1 text-[11px] font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded transition-colors"
              >
                -2 Tendangan
              </button>
              <button
                onClick={() => handleCorrectionPoints('BIRU', 'JATUHAN', 3)}
                className="py-1 px-1 text-[11px] font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded transition-colors"
              >
                -3 Jatuhan
              </button>
              <button
                onClick={() => handleCorrectionPoints('BIRU', 'KUNCIAN', 5)}
                className="py-1 px-1 text-[11px] font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded transition-colors"
              >
                -5 Kuncian
              </button>
            </div>
          </div>

          {/* Penalties & Fouls (PERSILAT Rules) */}
          <div className="bg-slate-950/80 border border-blue-900/50 rounded-xl p-3 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>Hukuman & Sanksi Wasit</span>
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {/* Binaan */}
              <button
                onClick={() => handleTogglePenalty('BIRU', 'binaan')}
                className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-left"
              >
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Binaan Lisan</div>
                <div className="font-bold text-amber-400 text-xs mt-0.5">
                  Binaan {match.biru.penalties.binaanCount} / 2
                </div>
              </button>

              {/* Teguran 1 */}
              <button
                onClick={() => handleTogglePenalty('BIRU', 'teguran1')}
                className={`p-2 border rounded-lg text-left transition-all ${
                  match.biru.penalties.teguran1
                    ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
                }`}
              >
                <div className="text-[10px] uppercase font-semibold">Teguran I</div>
                <div className="text-xs font-bold mt-0.5">-1 Poin</div>
              </button>

              {/* Teguran 2 */}
              <button
                onClick={() => handleTogglePenalty('BIRU', 'teguran2')}
                className={`p-2 border rounded-lg text-left transition-all ${
                  match.biru.penalties.teguran2
                    ? 'bg-amber-600 text-white border-amber-500 font-bold'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
                }`}
              >
                <div className="text-[10px] uppercase font-semibold">Teguran II</div>
                <div className="text-xs font-bold mt-0.5">-2 Poin</div>
              </button>

              {/* Peringatan 1 */}
              <button
                onClick={() => handleTogglePenalty('BIRU', 'peringatan1')}
                className={`p-2 border rounded-lg text-left transition-all ${
                  match.biru.penalties.peringatan1
                    ? 'bg-red-600 text-white border-red-500 font-bold'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
                }`}
              >
                <div className="text-[10px] uppercase font-semibold">Peringatan I</div>
                <div className="text-xs font-bold mt-0.5">-5 Poin</div>
              </button>

              {/* Peringatan 2 */}
              <button
                onClick={() => handleTogglePenalty('BIRU', 'peringatan2')}
                className={`p-2 border rounded-lg text-left transition-all ${
                  match.biru.penalties.peringatan2
                    ? 'bg-red-700 text-white border-red-600 font-bold'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
                }`}
              >
                <div className="text-[10px] uppercase font-semibold">Peringatan II</div>
                <div className="text-xs font-bold mt-0.5">-10 Poin</div>
              </button>

              {/* Diskualifikasi */}
              <button
                onClick={() => handleTogglePenalty('BIRU', 'disqualified')}
                className={`p-2 border rounded-lg text-left transition-all ${
                  match.biru.penalties.disqualified
                    ? 'bg-red-950 text-red-300 border-red-500 font-black animate-pulse'
                    : 'bg-slate-900 hover:bg-slate-800 text-red-400 border-slate-800'
                }`}
              >
                <div className="text-[10px] uppercase font-semibold">Diskualifikasi</div>
                <div className="text-xs font-bold mt-0.5">Sanksi DQ</div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Keyboard Shortcuts Helper Bar */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
        <span className="font-semibold text-slate-300">Pintasan Keyboard Cepat:</span>
        <div className="flex flex-wrap items-center gap-3">
          <span>
            <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-200 font-mono">
              Spasi
            </kbd>{' '}
            Mulai/Jeda Timer
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-200 font-mono">
              1
            </kbd>{' '}
            Pukulan Merah
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-200 font-mono">
              2
            </kbd>{' '}
            Tendangan Merah
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-200 font-mono">
              3
            </kbd>{' '}
            Jatuhan Merah
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-200 font-mono">
              7
            </kbd>{' '}
            Pukulan Biru
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-200 font-mono">
              8
            </kbd>{' '}
            Tendangan Biru
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-200 font-mono">
              9
            </kbd>{' '}
            Jatuhan Biru
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-200 font-mono">
              G
            </kbd>{' '}
            Gong
          </span>
        </div>
      </div>
    </div>
  );
};
