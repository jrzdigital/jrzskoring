import React from 'react';
import { CornerColor, CornerState, TechniqueType, PenaltyType } from '../types/silat';
import { 
  Undo2, 
  Video, 
  HeartPulse, 
  TimerReset, 
  AlertCircle, 
  ShieldAlert, 
  Swords,
  Footprints,
  Flame
} from 'lucide-react';

interface ScoringControlPanelProps {
  activeCorner: CornerColor;
  onSelectCorner: (color: CornerColor) => void;
  redState: CornerState;
  blueState: CornerState;
  onAddTechnique: (corner: CornerColor, technique: TechniqueType) => void;
  onAddPenalty: (corner: CornerColor, penalty: PenaltyType) => void;
  onUndoLastAction: (corner: CornerColor) => void;
  onOpenRefereeCount: (corner: CornerColor) => void;
  onOpenMedicalTimer: (corner: CornerColor) => void;
  onOpenVarChallenge: (corner: CornerColor) => void;
}

export const ScoringControlPanel: React.FC<ScoringControlPanelProps> = ({
  activeCorner,
  onSelectCorner,
  redState,
  blueState,
  onAddTechnique,
  onAddPenalty,
  onUndoLastAction,
  onOpenRefereeCount,
  onOpenMedicalTimer,
  onOpenVarChallenge,
}) => {
  const isRed = activeCorner === 'red';
  const currentState = isRed ? redState : blueState;

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-sm space-y-5">
      {/* Corner Selector Segmented Bar */}
      <div className="flex items-center justify-between gap-4 border-b border-neutral-100 pb-4">
        <div className="flex items-center gap-2 p-1 bg-neutral-100 rounded-xl w-full max-w-md">
          <button
            onClick={() => onSelectCorner('blue')}
            className={`flex-1 py-2.5 px-4 rounded-lg font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 ${
              !isRed
                ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-700'
                : 'text-neutral-600 hover:text-blue-700'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-white shrink-0" />
            <span className="truncate">SUDUT BIRU ({blueState.name.split(' ')[0]})</span>
          </button>

          <button
            onClick={() => onSelectCorner('red')}
            className={`flex-1 py-2.5 px-4 rounded-lg font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 ${
              isRed
                ? 'bg-red-600 text-white shadow-sm ring-1 ring-red-700'
                : 'text-neutral-600 hover:text-red-700'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-white shrink-0" />
            <span className="truncate">SUDUT MERAH ({redState.name.split(' ')[0]})</span>
          </button>
        </div>

        {/* Undo Action Button */}
        <button
          onClick={() => onUndoLastAction(activeCorner)}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors shrink-0"
          title={`Batalkan aksi nilai terakhir ${isRed ? 'Sudut Merah' : 'Sudut Biru'}`}
        >
          <Undo2 className="w-4 h-4 text-neutral-600" />
          <span>Batalkan (Undo)</span>
        </button>
      </div>

      {/* Primary Scoring Pads: Nilai Serangan Sah (Points) */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
            <Swords className="w-3.5 h-3.5 text-neutral-600" />
            <span>Nilai Serangan Sah (IPSI / PERSILAT)</span>
          </h3>
          <span className="text-[11px] text-neutral-400 font-medium">
            Untuk: <strong className={isRed ? 'text-red-600' : 'text-blue-600'}>{currentState.name}</strong>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {/* Pukulan (+1) */}
          <button
            onClick={() => onAddTechnique(activeCorner, 'pukulan')}
            className={`p-3.5 rounded-xl border-2 font-bold text-left transition-all active:scale-[0.98] ${
              isRed
                ? 'border-red-200 hover:border-red-600 hover:bg-red-50/50 bg-white'
                : 'border-blue-200 hover:border-blue-600 hover:bg-blue-50/50 bg-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-700">Pukulan Sah</span>
              <span
                className={`font-mono text-xl font-black ${
                  isRed ? 'text-red-600' : 'text-blue-600'
                }`}
              >
                +1
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 font-normal mt-0.5 line-clamp-1">
              Serangan tangan bertenaga
            </p>
          </button>

          {/* Tendangan (+2) */}
          <button
            onClick={() => onAddTechnique(activeCorner, 'tendangan')}
            className={`p-3.5 rounded-xl border-2 font-bold text-left transition-all active:scale-[0.98] ${
              isRed
                ? 'border-red-200 hover:border-red-600 hover:bg-red-50/50 bg-white'
                : 'border-blue-200 hover:border-blue-600 hover:bg-blue-50/50 bg-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-700">Tendangan Sah</span>
              <span
                className={`font-mono text-xl font-black ${
                  isRed ? 'text-red-600' : 'text-blue-600'
                }`}
              >
                +2
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 font-normal mt-0.5 line-clamp-1">
              Tendangan lurus / sabit / T
            </p>
          </button>

          {/* Jatuhan Sah (+3) */}
          <button
            onClick={() => onAddTechnique(activeCorner, 'jatuhan')}
            className={`p-3.5 rounded-xl border-2 font-bold text-left transition-all active:scale-[0.98] ${
              isRed
                ? 'border-red-400 bg-red-50/40 hover:bg-red-100/60 text-red-950'
                : 'border-blue-400 bg-blue-50/40 hover:bg-blue-100/60 text-blue-950'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold">Jatuhan Sah</span>
              <span
                className={`font-mono text-xl font-black ${
                  isRed ? 'text-red-700' : 'text-blue-700'
                }`}
              >
                +3
              </span>
            </div>
            <p className="text-[11px] text-neutral-500 font-normal mt-0.5 line-clamp-1">
              Bantingan / sapuan sah
            </p>
          </button>

          {/* Tangkis + Pukul (+1) */}
          <button
            onClick={() => onAddTechnique(activeCorner, 'tangkis_pukulan')}
            className="p-3 rounded-xl border border-neutral-200 hover:border-neutral-400 bg-white text-left transition-all active:scale-[0.98]"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-800">Tangkis + Pukul</span>
              <span className="font-mono text-base font-bold text-neutral-700">+1</span>
            </div>
            <p className="text-[10px] text-neutral-400 font-normal mt-0.5">Elakan/tangkisan teratur</p>
          </button>

          {/* Tangkis + Tendang (+2) */}
          <button
            onClick={() => onAddTechnique(activeCorner, 'tangkis_tendangan')}
            className="p-3 rounded-xl border border-neutral-200 hover:border-neutral-400 bg-white text-left transition-all active:scale-[0.98]"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-800">Tangkis + Tendang</span>
              <span className="font-mono text-base font-bold text-neutral-700">+2</span>
            </div>
            <p className="text-[10px] text-neutral-400 font-normal mt-0.5">Tangkis balas tendangan</p>
          </button>

          {/* Kuncian Sah (+3) */}
          <button
            onClick={() => onAddTechnique(activeCorner, 'kuncian')}
            className="p-3 rounded-xl border border-neutral-200 hover:border-neutral-400 bg-white text-left transition-all active:scale-[0.98]"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-800">Kuncian Sah</span>
              <span className="font-mono text-base font-bold text-neutral-700">+3</span>
            </div>
            <p className="text-[10px] text-neutral-400 font-normal mt-0.5">Kuncian sah 5 detik</p>
          </button>
        </div>
      </div>

      {/* Penalties & Disciplinary Sanksi Section */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-neutral-600" />
            <span>Hukuman & Pelanggaran (Pengurangan Nilai)</span>
          </h3>
          <span className="text-[11px] text-neutral-400 font-medium">Sanksi bertingkat wasit</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {/* Binaan */}
          <button
            onClick={() => {
              const penalty: PenaltyType = currentState.binaanCount === 0 ? 'binaan_1' : 'binaan_2';
              onAddPenalty(activeCorner, penalty);
            }}
            className="p-2.5 rounded-lg border border-yellow-200 bg-yellow-50/50 hover:bg-yellow-100/60 text-left transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-yellow-900">Binaan</span>
              <span className="text-[11px] font-bold text-yellow-700">0 Poin</span>
            </div>
            <p className="text-[10px] text-yellow-800/80 mt-0.5">Peringatan lisan wasit</p>
          </button>

          {/* Teguran 1 */}
          <button
            onClick={() => onAddPenalty(activeCorner, 'teguran_1')}
            className="p-2.5 rounded-lg border border-orange-200 bg-orange-50/50 hover:bg-orange-100/60 text-left transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-orange-900">Teguran I</span>
              <span className="font-mono text-xs font-black text-orange-700">-1</span>
            </div>
            <p className="text-[10px] text-orange-800/80 mt-0.5">Pelanggaran ringan 1</p>
          </button>

          {/* Teguran 2 */}
          <button
            onClick={() => onAddPenalty(activeCorner, 'teguran_2')}
            className="p-2.5 rounded-lg border border-orange-300 bg-orange-50 hover:bg-orange-100 text-left transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-orange-950">Teguran II</span>
              <span className="font-mono text-xs font-black text-orange-800">-2</span>
            </div>
            <p className="text-[10px] text-orange-900/80 mt-0.5">Pelanggaran ringan 2</p>
          </button>

          {/* Peringatan 1 */}
          <button
            onClick={() => onAddPenalty(activeCorner, 'peringatan_1')}
            className="p-2.5 rounded-lg border border-amber-400 bg-amber-50 hover:bg-amber-100 text-left transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-950">Peringatan I</span>
              <span className="font-mono text-xs font-black text-amber-800">-5</span>
            </div>
            <p className="text-[10px] text-amber-900/80 mt-0.5">Kartu Kuning 1</p>
          </button>

          {/* Peringatan 2 */}
          <button
            onClick={() => onAddPenalty(activeCorner, 'peringatan_2')}
            className="p-2.5 rounded-lg border border-red-300 bg-red-50/70 hover:bg-red-100 text-left transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-red-950">Peringatan II</span>
              <span className="font-mono text-xs font-black text-red-800">-10</span>
            </div>
            <p className="text-[10px] text-red-900/80 mt-0.5">Kartu Kuning 2</p>
          </button>

          {/* Diskualifikasi */}
          <button
            onClick={() => onAddPenalty(activeCorner, 'diskualifikasi')}
            className="p-2.5 rounded-lg border border-red-600 bg-red-600 hover:bg-red-700 text-white text-left transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black">DISKUALIFIKASI</span>
              <ShieldAlert className="w-3.5 h-3.5 text-white" />
            </div>
            <p className="text-[10px] text-red-100 mt-0.5">Kartu Merah / P3</p>
          </button>
        </div>
      </div>

      {/* Special Referee Tools: Hitungan Wasit, VAR Challenge, Medis */}
      <div className="pt-2 border-t border-neutral-100 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => onOpenRefereeCount(activeCorner)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg transition-colors"
          >
            <TimerReset className="w-3.5 h-3.5 text-amber-400" />
            <span>Hitungan Wasit (1 s/d 10)</span>
          </button>

          <button
            onClick={() => onOpenVarChallenge(activeCorner)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-lg transition-colors border border-neutral-200"
          >
            <Video className="w-3.5 h-3.5 text-neutral-600" />
            <span>Tinjauan Video VAR (Sisa: {currentState.varCards})</span>
          </button>

          <button
            onClick={() => onOpenMedicalTimer(activeCorner)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-800 rounded-lg transition-colors border border-rose-200"
          >
            <HeartPulse className="w-3.5 h-3.5 text-rose-600" />
            <span>Waktu Dokter / Medis</span>
          </button>
        </div>

        <div className="text-[11px] text-neutral-400 font-medium">
          Peraturan Standar IPSI & PERSILAT 2026
        </div>
      </div>
    </div>
  );
};
