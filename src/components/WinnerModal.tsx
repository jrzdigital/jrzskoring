import React, { useState } from 'react';
import { TandingMatch, Corner, VictoryType } from '../types/silat';
import { calculateTotalScore } from '../utils/silatCalculations';
import { Award, X, Check, Shield, FileText } from 'lucide-react';

interface WinnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: TandingMatch;
  onConfirmWinner: (corner: Corner, victoryType: VictoryType, notes: string) => void;
  onPrintSheet: () => void;
}

const VICTORY_OPTIONS: { type: VictoryType; title: string; desc: string }[] = [
  {
    type: 'MENANG_ANGKA',
    title: 'Menang Angka',
    desc: 'Pesilat unggul dalam perolehan total nilai sah setelah babak 3 selesai.',
  },
  {
    type: 'MENANG_MUTLAK',
    title: 'Menang Mutlak',
    desc: 'Lawan jatuh tidak dapat bangkit setelah hitungan ke-10 atau dinyatakan tidak mampu oleh dokter.',
  },
  {
    type: 'MENANG_WKO',
    title: 'Menang WKO (Wasit Menghentikan Pertandingan)',
    desc: 'Wasit menghentikan pertandingan demi keselamatan pesilat karena perbedaan kemampuan mencolok.',
  },
  {
    type: 'MENANG_TEKNIK',
    title: 'Menang Teknik',
    desc: 'Lawan cedera akibat serangan sah dan tidak dapat melanjutkan pertandingan.',
  },
  {
    type: 'MENANG_DISKUALIFIKASI',
    title: 'Menang Diskualifikasi (DQ)',
    desc: 'Lawan melakukan pelanggaran berat tingkat 3 atau akumulasi hukuman.',
  },
  {
    type: 'MENANG_UNDUR_DIRI',
    title: 'Menang Undur Diri',
    desc: 'Lawan menyatakan menyerah atau melempar handuk.',
  },
];

export const WinnerModal: React.FC<WinnerModalProps> = ({
  isOpen,
  onClose,
  match,
  onConfirmWinner,
  onPrintSheet,
}) => {
  const merahTotal = calculateTotalScore(match.merah);
  const biruTotal = calculateTotalScore(match.biru);

  const defaultWinner: any = merahTotal >= biruTotal ? 'MERAH' : 'BIRU';
  const [selectedWinner, setSelectedWinner] = useState<any>(match.winner && match.winner !== 'DRAW' ? match.winner : defaultWinner);
  const [selectedVictory, setSelectedVictory] = useState<VictoryType>(match.victoryType || 'MENANG_ANGKA');
  const [notes, setNotes] = useState(match.winnerNotes || '');

  if (!isOpen) return null;

  const winnerData = selectedWinner === 'MERAH' ? match.merah : match.biru;
  const loserData = selectedWinner === 'MERAH' ? match.biru : match.merah;
  const winnerScore = selectedWinner === 'MERAH' ? merahTotal : biruTotal;
  const loserScore = selectedWinner === 'MERAH' ? biruTotal : merahTotal;

  const handleConfirm = () => {
    onConfirmWinner(selectedWinner, selectedVictory, notes);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Award className="w-6 h-6 text-amber-400" />
            <div>
              <h2 className="font-athletic text-xl font-bold uppercase text-white">
                Keputusan Resmi Pemenang Pertandingan
              </h2>
              <p className="text-xs text-slate-400">
                {match.gelanggang} · PARTAI {match.partai} · {match.kelasTanding}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
          {/* Winner Corner Selection */}
          <div>
            <label className="block text-slate-400 font-semibold mb-2 uppercase tracking-wider text-[11px]">
              Pilih Sudut Pemenang:
            </label>
            <div className="grid grid-cols-2 gap-3">
              {/* Sudut Merah */}
              <button
                type="button"
                onClick={() => setSelectedWinner('MERAH')}
                className={`p-4 rounded-2xl border-2 text-left transition-all ${
                  selectedWinner === 'MERAH'
                    ? 'bg-red-950/80 border-red-500 shadow-lg shadow-red-950/50'
                    : 'bg-slate-950/50 border-slate-800 opacity-60 hover:opacity-100'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-athletic text-lg font-black text-red-300 uppercase">
                    SUDUT MERAH
                  </span>
                  <span className="font-led font-black text-2xl text-red-400">
                    {merahTotal}
                  </span>
                </div>
                <div className="font-bold text-white text-sm truncate">{match.merah.name}</div>
                <div className="text-[11px] text-red-200/70 truncate">{match.merah.kontingen}</div>
              </button>

              {/* Sudut Biru */}
              <button
                type="button"
                onClick={() => setSelectedWinner('BIRU')}
                className={`p-4 rounded-2xl border-2 text-left transition-all ${
                  selectedWinner === 'BIRU'
                    ? 'bg-blue-950/80 border-blue-500 shadow-lg shadow-blue-950/50'
                    : 'bg-slate-950/50 border-slate-800 opacity-60 hover:opacity-100'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-athletic text-lg font-black text-blue-300 uppercase">
                    SUDUT BIRU
                  </span>
                  <span className="font-led font-black text-2xl text-blue-400">
                    {biruTotal}
                  </span>
                </div>
                <div className="font-bold text-white text-sm truncate">{match.biru.name}</div>
                <div className="text-[11px] text-blue-200/70 truncate">{match.biru.kontingen}</div>
              </button>
            </div>
          </div>

          {/* Victory Decision Category */}
          <div>
            <label className="block text-slate-400 font-semibold mb-2 uppercase tracking-wider text-[11px]">
              Jenis Keputusan Kemenangan (Standar PERSILAT):
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {VICTORY_OPTIONS.map((opt) => (
                <button
                  key={opt.type}
                  type="button"
                  onClick={() => setSelectedVictory(opt.type)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    selectedVictory === opt.type
                      ? 'bg-amber-500/10 border-amber-500 text-amber-200'
                      : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <div className="font-bold text-white text-xs mb-0.5">{opt.title}</div>
                  <div className="text-[10px] text-slate-400 leading-tight">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-slate-400 font-semibold mb-1">
              Catatan Dewan / Wasit (Opsional):
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Menang angka mutlak dengan selisih 8 poin pada babak ke-3."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
            />
          </div>

          {/* Decision Summary Card */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-center">
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">
              Pengumuman Dewan Pertandingan
            </span>
            <div className="font-athletic text-xl font-black text-amber-400 uppercase mt-1">
              {winnerData.name} ({selectedWinner})
            </div>
            <div className="text-xs text-slate-300 font-medium">
              Dinyatakan sebagai PEMENANG dengan status{' '}
              <span className="font-bold text-white uppercase underline">
                {selectedVictory.replace(/_/g, ' ')}
              </span>{' '}
              (Skor {winnerScore} vs {loserScore})
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <button
            onClick={onPrintSheet}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
          >
            <FileText className="w-4 h-4 text-amber-400" />
            <span>Cetak Lembar Nilai</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:bg-slate-800 rounded-xl transition-colors"
            >
              Batal
            </button>
            <button
              onClick={handleConfirm}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl shadow-lg transition-transform active:scale-95"
            >
              <Check className="w-4 h-4" />
              Sahkan Keputusan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
