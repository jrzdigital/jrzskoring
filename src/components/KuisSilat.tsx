import React, { useState } from 'react';
import { SOAL_KUIS, PERGURUAN_LIST } from '../data/silatData';
import { Award, CheckCircle, XCircle, RotateCcw, Printer, Shield, ChevronRight } from 'lucide-react';
import { silatAudio } from '../utils/audio';

export const KuisSilat: React.FC<{ soundEnabled: boolean }> = ({ soundEnabled }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [qId: number]: number }>({});
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState<boolean>(false);
  const [quizFinished, setQuizFinished] = useState<boolean>(false);

  // Certificate personalization
  const [studentName, setStudentName] = useState<string>('Pendekar Muda Nusantara');
  const [studentSchool, setStudentSchool] = useState<string>('Ikatan Pencak Silat Indonesia (IPSI)');

  const currentQ = SOAL_KUIS[currentQuestionIndex];

  const handleSelectOption = (optIndex: number) => {
    if (isAnswerSubmitted) return;
    setSelectedAnswers({
      ...selectedAnswers,
      [currentQ.id]: optIndex
    });
  };

  const handleCheckAnswer = () => {
    setIsAnswerSubmitted(true);
    const isCorrect = selectedAnswers[currentQ.id] === currentQ.jawabanBenar;
    if (soundEnabled) {
      if (isCorrect) silatAudio.playWoodClap(880);
      else silatAudio.playWhistle();
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < SOAL_KUIS.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setIsAnswerSubmitted(false);
    } else {
      setQuizFinished(true);
      if (soundEnabled) silatAudio.playGong();
    }
  };

  const calculateScore = () => {
    let score = 0;
    SOAL_KUIS.forEach(q => {
      if (selectedAnswers[q.id] === q.jawabanBenar) {
        score += 10;
      }
    });
    return score;
  };

  const finalScore = calculateScore();

  const getRankTitle = (score: number) => {
    if (score >= 90) return 'Pendekar Utama (Lulus Istimewa)';
    if (score >= 70) return 'Pendekar Madya (Lulus Baik)';
    if (score >= 50) return 'Pendekar Pratama (Cukup)';
    return 'Pesilat Taruna (Perlu Pemantapan Teori)';
  };

  const resetQuiz = () => {
    setSelectedAnswers({});
    setCurrentQuestionIndex(0);
    setIsAnswerSubmitted(false);
    setQuizFinished(false);
  };

  return (
    <div className="space-y-6">
      {!quizFinished ? (
        <div className="max-w-2xl mx-auto bg-stone-900 border border-stone-800 rounded-xl p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-stone-800 pb-4">
            <div>
              <span className="text-xs uppercase font-bold text-amber-400">
                Uji Teori & Pemahaman Silat
              </span>
              <h3 className="text-lg font-bold font-display text-stone-100 mt-0.5">
                Soal {currentQuestionIndex + 1} dari {SOAL_KUIS.length}
              </h3>
            </div>
            <div className="text-xs text-stone-400 font-mono-numbers">
              Skor Berjalan:{' '}
              <span className="text-amber-400 font-bold">
                {Object.keys(selectedAnswers).filter(k => selectedAnswers[Number(k)] === SOAL_KUIS.find(q => q.id === Number(k))?.jawabanBenar).length * 10}
              </span>
            </div>
          </div>

          {/* Question Text */}
          <div className="text-sm md:text-base font-semibold text-stone-100 leading-relaxed">
            {currentQ.pertanyaan}
          </div>

          {/* Options */}
          <div className="space-y-2.5">
            {currentQ.pilihan.map((pilihan, idx) => {
              const isSelected = selectedAnswers[currentQ.id] === idx;
              const isCorrect = currentQ.jawabanBenar === idx;

              let btnClass = 'bg-stone-950 border-stone-800 hover:border-stone-700 text-stone-300';
              if (isAnswerSubmitted) {
                if (isCorrect) btnClass = 'bg-emerald-950/70 border-emerald-500 text-emerald-200';
                else if (isSelected && !isCorrect) btnClass = 'bg-rose-950/70 border-rose-500 text-rose-200';
              } else if (isSelected) {
                btnClass = 'bg-stone-800 border-amber-500 text-amber-300';
              }

              return (
                <button
                  key={idx}
                  disabled={isAnswerSubmitted}
                  onClick={() => handleSelectOption(idx)}
                  className={`w-full text-left p-3.5 rounded-lg border text-xs transition-all flex items-center justify-between ${btnClass}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-full bg-stone-900 border border-stone-700 flex items-center justify-center font-mono-numbers text-[11px] font-bold">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span>{pilihan}</span>
                  </div>
                  {isAnswerSubmitted && isCorrect && (
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  )}
                  {isAnswerSubmitted && isSelected && !isCorrect && (
                    <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Explanation if submitted */}
          {isAnswerSubmitted && (
            <div className="p-3.5 rounded-lg bg-stone-950 border border-stone-800 text-xs text-stone-300 space-y-1">
              <span className="font-semibold text-amber-400">Penjelasan Resmi:</span>
              <p className="leading-relaxed text-stone-400">{currentQ.penjelasan}</p>
            </div>
          )}

          {/* Action Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-stone-800">
            <span className="text-xs text-stone-500">
              Pilih satu jawaban terbaik
            </span>

            {!isAnswerSubmitted ? (
              <button
                disabled={selectedAnswers[currentQ.id] === undefined}
                onClick={handleCheckAnswer}
                className="px-6 py-2 bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-stone-950 font-bold text-xs rounded-md transition-colors"
              >
                Kunci Jawaban
              </button>
            ) : (
              <button
                onClick={handleNextQuestion}
                className="px-6 py-2 bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs rounded-md transition-colors flex items-center gap-1.5"
              >
                <span>{currentQuestionIndex === SOAL_KUIS.length - 1 ? 'Lihat Hasil Akhir' : 'Soal Selanjutnya'}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Final Score & Digital Certificate */
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Result Card */}
          <div className="bg-stone-900 border border-stone-800 rounded-xl p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
              <Award className="w-8 h-8" />
            </div>

            <div>
              <span className="text-xs text-stone-400 uppercase font-semibold">
                Hasil Ujian Teori Silat
              </span>
              <div className="text-4xl md:text-5xl font-black font-mono-numbers text-amber-400 mt-1">
                {finalScore} <span className="text-lg text-stone-500 font-normal">/ 100</span>
              </div>
              <div className="text-base font-bold text-stone-100 font-display mt-2">
                Gelar: {getRankTitle(finalScore)}
              </div>
            </div>

            {/* Customizer */}
            <div className="max-w-md mx-auto grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-left text-xs">
              <div>
                <label className="text-stone-400 block mb-1">Nama Pesilat:</label>
                <input
                  type="text"
                  value={studentName}
                  onChange={e => setStudentName(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded px-2.5 py-1.5 text-stone-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-stone-400 block mb-1">Perguruan / Aliran:</label>
                <select
                  value={studentSchool}
                  onChange={e => setStudentSchool(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded px-2.5 py-1.5 text-stone-200 focus:outline-none focus:border-amber-500"
                >
                  <option>Ikatan Pencak Silat Indonesia (IPSI)</option>
                  {PERGURUAN_LIST.map(p => (
                    <option key={p.id} value={p.nama}>
                      {p.singkatan}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Printable Digital Certificate */}
          <div
            id="silat-certificate"
            className="bg-gradient-to-br from-stone-900 via-stone-950 to-stone-900 border-4 border-amber-600/80 rounded-2xl p-8 shadow-2xl relative overflow-hidden"
          >
            {/* Certificate Decorative Corners */}
            <div className="absolute top-2 left-2 text-amber-500/40 font-display text-2xl font-black select-none">❖</div>
            <div className="absolute top-2 right-2 text-amber-500/40 font-display text-2xl font-black select-none">❖</div>
            <div className="absolute bottom-2 left-2 text-amber-500/40 font-display text-2xl font-black select-none">❖</div>
            <div className="absolute bottom-2 right-2 text-amber-500/40 font-display text-2xl font-black select-none">❖</div>

            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-2 text-amber-500 font-bold uppercase tracking-widest text-xs">
                <Shield className="w-4 h-4" />
                <span>PIAGAM PENGAKUAN PENDEKAR</span>
                <Shield className="w-4 h-4" />
              </div>

              <h2 className="text-2xl md:text-3xl font-display font-bold text-amber-200 tracking-wide">
                SERTIFIKAT KELULUSAN SILAT NUSANTARA
              </h2>

              <p className="text-xs text-stone-400 max-w-lg mx-auto">
                Diberikan sebagai bukti kelulusan uji wawasan, aturan gelanggang, filosofi bela diri, dan pemahaman jurus resmi:
              </p>

              <div className="py-2">
                <div className="text-2xl md:text-3xl font-bold font-display text-stone-100 border-b-2 border-amber-500/40 inline-block px-8 pb-1">
                  {studentName || 'Pendekar Muda'}
                </div>
                <div className="text-xs text-amber-400 mt-2 font-medium">
                  {studentSchool}
                </div>
              </div>

              <div className="text-xs text-stone-300 max-w-md mx-auto">
                Telah dinyatakan berhak menyandang predikat kehormatan:
                <div className="text-sm font-bold text-amber-300 mt-1 font-display">
                  « {getRankTitle(finalScore)} »
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-stone-800/80 flex items-center justify-between text-xs text-stone-400 px-4">
                <div className="text-left">
                  <div>Tanggal Pengesahan:</div>
                  <div className="text-stone-200 font-medium">
                    {new Date().toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </div>
                </div>

                <div className="text-center">
                  <div className="w-12 h-12 rounded-full border-2 border-amber-500/50 flex items-center justify-center mx-auto text-amber-400 text-[10px] font-bold uppercase">
                    SAH
                  </div>
                </div>

                <div className="text-right">
                  <div>Verifikasi Digital:</div>
                  <div className="text-amber-400 font-mono-numbers">
                    PS-IPSI-{(finalScore * 137).toString().padStart(6, '0')}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={resetQuiz}
              className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Ulangi Kuis</span>
            </button>

            <button
              onClick={() => window.print()}
              className="px-6 py-2 bg-amber-400 hover:bg-amber-300 text-stone-950 text-xs font-bold rounded-md transition-colors flex items-center gap-1.5 shadow-md"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / Simpan Piagam</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
