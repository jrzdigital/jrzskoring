import React, { useState } from 'react';
import { CornerColor, CornerState, DecisionType, MatchSettings } from '../types/silat';
import { calculateTotalScore } from '../utils/rules';
import { Trophy, CheckCircle, ShieldAlert, Award, X, Printer } from 'lucide-react';

interface WinnerDecisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  redState: CornerState;
  blueState: CornerState;
  settings: MatchSettings;
  currentRound: number;
  onConfirmWinner: (winner: CornerColor | null, type: DecisionType, reason: string) => void;
  onOpenScoreSheet: () => void;
}

export const WinnerDecisionModal: React.FC<WinnerDecisionModalProps> = ({
  isOpen,
  onClose,
  redState,
  blueState,
  settings,
  currentRound,
  onConfirmWinner,
  onOpenScoreSheet,
}) => {
  const scoreRed = calculateTotalScore(redState);
  const scoreBlue = calculateTotalScore(blueState);

  // Auto determine preliminary winner based on scores
  const defaultWinner: CornerColor | null =
    scoreRed > scoreBlue ? 'red' : scoreBlue > scoreRed ? 'blue' : null;

  const [selectedWinner, setSelectedWinner] = useState<CornerColor | null>(defaultWinner);
  const [decisionType, setDecisionType] = useState<DecisionType>('menang_angka');
  const [customReason, setCustomReason] = useState<string>('');

  if (!isOpen) return null;

  const decisions: { type: DecisionType; label: string; desc: string }[] = [
    {
      type: 'menang_angka',
      label: 'Menang Angka',
      desc: 'Pesilat unggul akumulasi nilai akhir setelah 3 babak penuh',
    },
    {
      type: 'menang_mutlak',
      label: 'Menang Mutlak',
      desc: 'Keunggulan mutlak seluruh juri atas pesilat lawan',
    },
    {
      type: 'menang_wmp',
      label: 'Menang W.M.P (Wasit Menghentikan Pertandingan)',
      desc: 'Lawan tidak mampu melanjutkan, terkena hitungan 10, atau RSC',
    },
    {
      type: 'menang_diskualifikasi',
      label: 'Menang Diskualifikasi',
      desc: 'Lawan terkena Peringatan 3 (Kartu Merah) atau pelanggaran berat',
    },
    {
      type: 'menang_wo',
      label: 'Menang W.O (Walkover)',
      desc: 'Lawan tidak hadir di gelanggang setelah 3x pemanggilan resmi',
    },
    {
      type: 'menang_teknik',
      label: 'Menang Teknik / Cedera',
      desc: 'Lawan dinyatakan tidak layak tanding oleh Dokter Pertandingan',
    },
  ];

  const handleFinalize = () => {
    const defaultReason = decisions.find((d) => d.type === decisionType)?.label || '';
    const finalReason = customReason.trim() ? `${defaultReason} - ${customReason.trim()}` : defaultReason;
    onConfirmWinner(selectedWinner, decisionType, finalReason);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#040813]/85 backdrop-blur-md flex items-center justify-center p-4 font-sans">
      <div className="bg-[#070e1c] rounded-3xl border-2 border-cyan-500/40 max-w-xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto animate-fade-in cyber-glass-deep hud-bracket text-slate-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-[#091326] border border-cyan-500/20 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5 text-cyan-400" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-1 mb-5">
          <div className="inline-flex p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/40 glow-gold mb-1">
            <Trophy className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-mono font-black text-white uppercase tracking-wide">
            Penetapan Keputusan Pemenang Pertandingan
          </h2>
          <p className="text-xs text-cyan-400 font-mono">
            {settings.arena} · {settings.matchNumber} · {settings.category} {settings.weightClass}
          </p>
        </div>

        {/* Scoreboard Summary Card */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {/* Blue Side (Left) */}
          <div
            onClick={() => setSelectedWinner('blue')}
            className={`p-4 rounded-2xl border-2 text-center cursor-pointer transition-all ${
              selectedWinner === 'blue'
                ? 'border-blue-500 bg-[#071326] shadow-lg ring-2 ring-blue-500/40 glow-blue'
                : 'border-blue-950 bg-[#040813] hover:border-blue-500/50'
            }`}
          >
            <span className="text-[10px] font-mono font-black uppercase text-cyan-400 tracking-wider">
              Sudut Biru
            </span>
            <h4 className="font-extrabold text-sm text-white truncate mt-0.5">
              {blueState.name}
            </h4>
            <p className="text-[11px] text-cyan-300 font-semibold">{blueState.contingent}</p>
            <div className="font-mono text-4xl font-black text-cyan-400 text-glow-cyan mt-2 tabular-nums">
              {scoreBlue}
            </div>
            {selectedWinner === 'blue' && (
              <span className="inline-flex items-center gap-1 mt-2 text-xs font-mono font-bold text-cyan-300">
                <CheckCircle className="w-3.5 h-3.5" /> Pemenang Terpilih
              </span>
            )}
          </div>

          {/* Red Side (Right) */}
          <div
            onClick={() => setSelectedWinner('red')}
            className={`p-4 rounded-2xl border-2 text-center cursor-pointer transition-all ${
              selectedWinner === 'red'
                ? 'border-red-500 bg-[#1D080F] shadow-lg ring-2 ring-red-500/40 glow-red'
                : 'border-red-950 bg-[#040813] hover:border-red-500/50'
            }`}
          >
            <span className="text-[10px] font-mono font-black uppercase text-red-400 tracking-wider">
              Sudut Merah
            </span>
            <h4 className="font-extrabold text-sm text-white truncate mt-0.5">
              {redState.name}
            </h4>
            <p className="text-[11px] text-red-300 font-semibold">{redState.contingent}</p>
            <div className="font-mono text-4xl font-black text-red-400 text-glow-red mt-2 tabular-nums">
              {scoreRed}
            </div>
            {selectedWinner === 'red' && (
              <span className="inline-flex items-center gap-1 mt-2 text-xs font-mono font-bold text-red-300">
                <CheckCircle className="w-3.5 h-3.5" /> Pemenang Terpilih
              </span>
            )}
          </div>
        </div>

        {/* Decision Types */}
        <div className="space-y-3 mb-5">
          <label className="block text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">
            Jenis Keputusan Wasit / Dewan Juri:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {decisions.map((item) => (
              <button
                key={item.type}
                type="button"
                onClick={() => setDecisionType(item.type)}
                className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                  decisionType === item.type
                    ? 'bg-[#040813] text-white border-amber-400 glow-gold shadow-md'
                    : 'bg-[#040813] hover:bg-[#091326] text-slate-300 border-cyan-500/30'
                }`}
              >
                <div className="text-xs font-mono font-bold text-amber-300">{item.label}</div>
                <div
                  className={`text-[10px] mt-0.5 line-clamp-1 font-sans ${
                    decisionType === item.type ? 'text-slate-200' : 'text-slate-400'
                  }`}
                >
                  {item.desc}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Custom notes */}
        <div className="mb-5">
          <label className="block text-xs font-mono font-bold text-slate-300 mb-1">
            Keterangan / Catatan Dewan Pertandingan (Opsional):
          </label>
          <input
            type="text"
            value={customReason}
            onChange={(e) => setCustomReason(e.target.value)}
            placeholder="Contoh: Lawan cedera dislokasi bahu pada babak 2..."
            className="w-full text-xs px-3 py-2 rounded-xl border border-cyan-500/30 bg-[#040813] text-white focus:outline-hidden focus:border-cyan-400 font-sans"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-3 border-t border-cyan-500/20">
          <button
            onClick={onOpenScoreSheet}
            className="px-4 py-2.5 rounded-xl font-mono font-bold text-xs bg-[#040813] hover:bg-[#091326] text-cyan-300 hover:text-white border border-cyan-500/30 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-cyan-400" />
            <span>Lihat Lembar Nilai</span>
          </button>

          <button
            onClick={handleFinalize}
            className="flex-1 py-3 px-4 rounded-xl font-mono font-black text-sm bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg glow-gold border border-amber-300 flex items-center justify-center gap-2 transition-transform active:scale-98 cursor-pointer"
          >
            <Award className="w-4 h-4 fill-current" />
            <span>
              Tetapkan Pemenang:{' '}
              {selectedWinner === 'red' ? 'Sudut Merah' : selectedWinner === 'blue' ? 'Sudut Biru' : 'Belum Ditentukan'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
