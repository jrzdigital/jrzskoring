import React, { useState } from 'react';
import { CornerColor } from '../types/silat';
import { Video, Check, X, AlertTriangle } from 'lucide-react';

interface VarChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  corner: CornerColor;
  fighterName: string;
  remainingCards: number;
  onResolveChallenge: (corner: CornerColor, accepted: boolean, reason: string) => void;
}

export const VarChallengeModal: React.FC<VarChallengeModalProps> = ({
  isOpen,
  onClose,
  corner,
  fighterName,
  remainingCards,
  onResolveChallenge,
}) => {
  const [reason, setReason] = useState<string>('Tinjauan Jatuhan Sah');
  const [customNote, setCustomNote] = useState<string>('');

  if (!isOpen) return null;

  const isRed = corner === 'red';

  const reasonsList = [
    'Tinjauan Jatuhan Sah (Bantingan/Sapuan)',
    'Tinjauan Pelanggaran / Serangan Terlarang',
    'Tinjauan Pukulan / Tendangan Masuk Sasaran',
    'Tinjauan Serangan Setelah Aba-Aba "Ti"',
    'Tinjauan Kuncian / Jatuhan Sendiri',
  ];

  const handleDecision = (accepted: boolean) => {
    const finalReason = customNote.trim() ? `${reason} (${customNote.trim()})` : reason;
    onResolveChallenge(corner, accepted, finalReason);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-neutral-200 max-w-lg w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-neutral-400 hover:text-neutral-700 rounded-full hover:bg-neutral-100"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-2 mb-4">
          <div className="inline-flex p-3 rounded-2xl bg-indigo-50 text-indigo-600 mb-1">
            <Video className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-neutral-900">
            Tinjauan Video / VAR Challenge (Kartu Protes)
          </h2>
          <p className="text-xs text-neutral-500">
            Permintaan peninjauan tayangan ulang oleh pelatih sudut kepada Dewan Wasit Juri.
          </p>
          <div
            className={`inline-block font-extrabold text-sm px-3 py-1 rounded-full ${
              isRed ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
            }`}
          >
            {isRed ? 'Sudut Merah' : 'Sudut Biru'} : {fighterName} (Sisa Kartu: {remainingCards})
          </div>
        </div>

        {remainingCards <= 0 ? (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-bold flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
            <span>Kuota Kartu Protes VAR sudut ini sudah habis (0 kartu tersisa).</span>
          </div>
        ) : (
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-2">
                Pilih Objek Tinjauan Video:
              </label>
              <div className="space-y-1.5">
                {reasonsList.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setReason(item)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
                      reason === item
                        ? 'bg-neutral-900 text-white border-neutral-900 shadow-sm'
                        : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-700 border-neutral-200'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-600 mb-1">
                Catatan Tambahan (Opsional):
              </label>
              <input
                type="text"
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                placeholder="Contoh: Tangisan tidak menempel, serangan bersih..."
                className="w-full text-xs px-3 py-2 rounded-lg border border-neutral-300 focus:outline-hidden focus:border-neutral-900"
              />
            </div>
          </div>
        )}

        {/* Decision by Technical Delegate / Dewan Juri */}
        <div className="pt-2 border-t border-neutral-100">
          <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2 text-center">
            Keputusan Dewan Wasit / VAR
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleDecision(true)}
              className="py-3 px-4 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center justify-center gap-2 transition-transform active:scale-98"
            >
              <Check className="w-4 h-4" />
              <span>Protes SAH / Diterima (Kartu Utuh)</span>
            </button>

            <button
              onClick={() => handleDecision(false)}
              className="py-3 px-4 rounded-xl font-bold text-xs bg-neutral-900 hover:bg-neutral-800 text-white shadow-sm flex items-center justify-center gap-2 transition-transform active:scale-98"
            >
              <X className="w-4 h-4" />
              <span>Protes Ditolak (Kartu Hangus -1)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
