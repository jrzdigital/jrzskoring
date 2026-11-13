import React, { useState } from 'react';
import { useSilat } from '../../context/SilatContext';
import {
  MatchState,
  MatchCategory,
  Gender,
  AgeGroup,
  MatchStage
} from '../../types/silat';
import { exportMatchToPdf, exportAllFinishedMatchesToPdf } from '../../utils/pdfExport';
import {
  Plus,
  RotateCcw,
  CheckCircle2,
  Trash2,
  Users,
  Award,
  Layers,
  Clock,
  Swords,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  Upload,
  Image as ImageIcon,
  Check,
  ToggleLeft,
  ToggleRight,
  Trophy,
  History,
  Calendar,
  MapPin,
  UserPlus,
  ArrowLeft,
  Sliders,
  X
} from 'lucide-react';
import { AthleteRegistrationModal } from '../AthleteRegistrationModal';

interface SecretaryPanelProps {
  onBack?: () => void;
}

export const SecretaryPanel: React.FC<SecretaryPanelProps> = ({ onBack }) => {
  const {
    config,
    matches,
    athletes,
    activeMatchId,
    activeMatch,
    selectActiveMatch,
    addOrUpdateMatch,
    deleteMatch,
    updateTournamentConfig,
    resetAllToDefault
  } = useSilat();

  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [showParameterModal, setShowParameterModal] = useState(false);
  const [isCreatingMatch, setIsCreatingMatch] = useState(false);
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);
  const [resetToast, setResetToast] = useState(false);
  const [parameterToast, setParameterToast] = useState(false);


  // Tournament Info State (Sesuai Permintaan)
  const [tournamentName, setTournamentName] = useState(config.tournamentName || '');
  const [location, setLocation] = useState(config.location || '');
  const [cityCreated, setCityCreated] = useState(config.cityCreated || 'Jakarta');
  const [dateCreated, setDateCreated] = useState(config.dateCreated || config.date || '12 Oktober 2026');
  const [eventTime, setEventTime] = useState(config.eventTime || '08:00 - 18:00 WIB');
  const [arenaName, setArenaName] = useState(config.arenaName || 'Gelanggang 1');
  const [leftLogoUrl, setLeftLogoUrl] = useState(config.leftLogoUrl || '');
  const [rightLogoUrl, setRightLogoUrl] = useState(config.rightLogoUrl || '');
  const [leadRefereeSignature, setLeadRefereeSignature] = useState(config.leadRefereeSignature || config.leadRefereeName || '');
  const [secretarySignature, setSecretarySignature] = useState(config.secretarySignature || config.secretaryName || '');
  const [autoAdvance, setAutoAdvance] = useState(config.autoAdvanceMatch || false);
  const [roundDurationTanding, setRoundDurationTanding] = useState(config.roundDurationTanding || 120);
  const [roundDurationSeni, setRoundDurationSeni] = useState(config.roundDurationSeni || 180);
  const [totalRoundsSetting, setTotalRoundsSetting] = useState(config.totalRounds || 3);
  const [jurorsCountSeni, setJurorsCountSeni] = useState(config.jurorsCountSeni || 5);

  // Sync inputs dynamically when config is updated or reset
  React.useEffect(() => {
    setTournamentName(config.tournamentName || '');
    setLocation(config.location || '');
    setCityCreated(config.cityCreated || 'Jakarta');
    setDateCreated(config.dateCreated || config.date || '12 Oktober 2026');
    setEventTime(config.eventTime || '08:00 - 18:00 WIB');
    setArenaName(config.arenaName || 'Gelanggang 1');
    setLeftLogoUrl(config.leftLogoUrl || '');
    setRightLogoUrl(config.rightLogoUrl || '');
    setLeadRefereeSignature(config.leadRefereeSignature || config.leadRefereeName || '');
    setSecretarySignature(config.secretarySignature || config.secretaryName || '');
    setAutoAdvance(config.autoAdvanceMatch || false);
    setRoundDurationTanding(config.roundDurationTanding || 120);
    setRoundDurationSeni(config.roundDurationSeni || 180);
    setTotalRoundsSetting(config.totalRounds || 3);
    setJurorsCountSeni(config.jurorsCountSeni || 5);
  }, [config]);

  // Handler Ganti Jumlah Juri Seni (3, 5, 10 Juri)
  const handleSelectJuryCount = (count: number) => {
    setJurorsCountSeni(count);
    updateTournamentConfig({ jurorsCountSeni: count });
    setParameterToast(true);
    setTimeout(() => {
      setParameterToast(false);
    }, 3000);
  };

  // New Match Form State
  const [matchNumber, setMatchNumber] = useState<number>(matches.length + 1);
  const [matchCategory, setMatchCategory] = useState<MatchCategory>('TANDING');
  const [matchGender, setMatchGender] = useState<Gender>('PUTRA');
  const [matchAgeGroup, setMatchAgeGroup] = useState<AgeGroup>('DEWASA');
  const [matchClassGroup, setMatchClassGroup] = useState('Kelas C (55-60 kg)');
  const [matchStage, setMatchStage] = useState<MatchStage>('PENYISIHAN');
  const [matchTotalRounds, setMatchTotalRounds] = useState<number>(3);
  const [redAthleteId, setRedAthleteId] = useState<string>('');
  const [blueAthleteId, setBlueAthleteId] = useState<string>('');
  const [performerId, setPerformerId] = useState<string>('');

  // Indexing for Prev / Next Navigation
  const currentMatchIndex = matches.findIndex((m) => m.id === activeMatchId);
  const hasPrev = currentMatchIndex > 0;
  const hasNext = currentMatchIndex >= 0 && currentMatchIndex < matches.length - 1;
  const nextMatch = hasNext ? matches[currentMatchIndex + 1] : null;

  const handlePrevMatch = () => {
    if (hasPrev) {
      selectActiveMatch(matches[currentMatchIndex - 1].id);
    }
  };

  const handleNextMatch = () => {
    if (hasNext) {
      selectActiveMatch(matches[currentMatchIndex + 1].id);
    }
  };

  const handleToggleAutoAdvance = () => {
    const nextVal = !autoAdvance;
    setAutoAdvance(nextVal);
    updateTournamentConfig({ autoAdvanceMatch: nextVal });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, side: 'left' | 'right') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          if (side === 'left') setLeftLogoUrl(reader.result);
          else setRightLogoUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    updateTournamentConfig({
      tournamentName,
      location,
      cityCreated,
      dateCreated,
      eventTime,
      arenaName,
      leftLogoUrl,
      rightLogoUrl,
      leadRefereeSignature,
      leadRefereeName: leadRefereeSignature,
      secretarySignature,
      secretaryName: secretarySignature,
      autoAdvanceMatch: autoAdvance,
      roundDurationTanding: Number(roundDurationTanding),
      roundDurationSeni: Number(roundDurationSeni),
      totalRounds: Number(totalRoundsSetting),
      jurorsCountSeni: Number(jurorsCountSeni)
    });
    setParameterToast(true);
    setShowParameterModal(false);
    setTimeout(() => {
      setParameterToast(false);
    }, 4000);
  };

  const handleCreateMatch = (e: React.FormEvent) => {
    e.preventDefault();

    const redAth = athletes.find((a) => a.id === redAthleteId) || athletes[0];
    const blueAth = athletes.find((a) => a.id === blueAthleteId) || athletes[1] || athletes[0];
    const perfAth = athletes.find((a) => a.id === performerId) || athletes[0];

    const isTanding = matchCategory === 'TANDING';
    const duration = isTanding ? config.roundDurationTanding : config.roundDurationSeni;

    const newMatch: MatchState = {
      id: `match-${Date.now()}`,
      matchNumber: Number(matchNumber),
      arena: arenaName,
      category: matchCategory,
      gender: matchGender,
      ageGroup: matchAgeGroup,
      classGroup: matchClassGroup,
      stage: matchStage,
      status: 'PENDING',
      activeRound: 1,
      totalRounds: matchTotalRounds,
      timer: {
        timeRemaining: duration,
        durationTotal: duration,
        isRunning: false,
        isRest: false,
        restTimeRemaining: 60,
        elapsedTime: 0
      },
      tanding: {
        redAthlete: redAth,
        blueAthlete: blueAth,
        redScores: { round1: 0, round2: 0, round3: 0, totalPoints: 0, penalties: [], approvedHits: [] },
        blueScores: { round1: 0, round2: 0, round3: 0, totalPoints: 0, penalties: [], approvedHits: [] },
        currentVotes: [],
        lastActionLog: [`Partai Baru #${matchNumber} dibuat`]
      },
      jurus: {
        performer: perfAth,
        juryScores: (() => {
          const count = config.jurorsCountSeni || 5;
          const scores: Record<number, any> = {};
          for (let j = 1; j <= count; j++) {
            scores[j] = { juryNumber: j, kebenaranBase: 9.90, kesalahanCount: 0, kebenaranFinal: 9.90, kemantapanScore: 0.05, penaltyDeduction: 0, finalScore: 9.95, isSubmitted: false };
          }
          return scores;
        })(),
        penalties: {
          timeToleranceViolation: 0,
          weaponDropped: 0,
          weaponBroken: 0,
          outOfArena: 0,
          attireViolation: 0,
          unauthorizedSound: 0,
          totalPenalties: 0
        },
        finalMedianScore: 9.95,
        isFinished: false
      },
      updatedAt: new Date().toISOString()
    };

    addOrUpdateMatch(newMatch);
    setIsCreatingMatch(false);
    selectActiveMatch(newMatch.id);
  };

  // Finished Matches for History & Batch PDF Export
  const finishedMatches = matches.filter((m) => m.status === 'FINISHED' || m.result);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-6 animate-fade-in font-sans">
      
      {/* Top Bar Actions & Header Nama Event Kejuaraan */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 cyber-glass border border-cyan-500/30 rounded-2xl p-4 shadow-xl hud-bracket text-slate-100">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 sm:p-2.5 rounded-xl bg-[#040813] hover:bg-[#091326] border border-cyan-500/40 text-cyan-400 hover:text-white transition-all active:scale-95 flex items-center justify-center cursor-pointer shrink-0 shadow-sm hover:glow-cyan"
              title="Kembali ke Halaman Utama (Landing Page)"
              aria-label="Kembali ke Landing Page"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="text-lg sm:text-xl font-black text-white leading-tight font-mono uppercase">
              PANEL SEKRETARIS PERTANDINGAN
            </h1>
            <p className="text-xs text-slate-400 font-medium font-sans">
              Kendali Kejuaraan, Jadwal Partai, Atlet, & Histori Hasil Pertandingan
            </p>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          <button
            onClick={() => setShowRegistrationModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-mono font-black bg-blue-600 hover:bg-blue-500 text-white shadow-md border border-blue-400 transition-transform active:scale-95 cursor-pointer"
            title="Buka Menu Tambah Atlet, Import Excel, Bagan Braket, & Jadwal Pertandingan"
          >
            <UserPlus className="w-4 h-4" />
            <span>Tambah Atlet</span>
          </button>

          {/* Menu Navbar Parameter tepat di tengah-tengah antara Tambah Atlet dan Reset Data */}
          <button
            onClick={() => setShowParameterModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-mono font-black bg-purple-700 hover:bg-purple-600 text-white border border-purple-400 transition-transform active:scale-95 cursor-pointer shadow-md"
            title="Buka Menu Pop Up Konfigurasi Gelanggang & Event Kejuaraan"
          >
            <Sliders className="w-4 h-4 text-purple-200" />
            <span>Parameter</span>
          </button>

          <button
            onClick={() => setShowResetConfirmModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-mono font-bold bg-[#040813] hover:bg-[#091326] text-amber-400 hover:text-amber-300 border border-amber-500/40 transition-all active:scale-95 cursor-pointer shadow-sm"
            title="Pulihkan data turnamen awal (default seed data)"
          >
            <RotateCcw className="w-4 h-4 text-amber-400" />
            <span>Reset Data</span>
          </button>
        </div>
      </div>

      {/* 2-COLUMN MAIN LAYOUT (SISI KIRI & SISI KANAN) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        
        {/* ================= SISI KIRI (COLUMN 1) ================= */}
        <div className="space-y-6">
          
          {/* MENU 2 & 3: ATLET AKTIF BERTANDING, MODE OTOMATIS/MANUAL, & KONTROL CEK PARTAI (PREV/NEXT) */}
          <div className="cyber-glass border border-cyan-500/30 rounded-2xl p-5 shadow-xl space-y-4 hud-bracket text-slate-100">
            
            {/* Header Box */}
            <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3">
              <div>
                <span className="text-[10px] font-mono font-black uppercase tracking-wider text-cyan-400 block">
                  STATUS PERTANDINGAN BERJALAN
                </span>
                <h2 className="text-base font-black text-white font-mono uppercase">
                  Atlet Sedang Bertanding
                </h2>
              </div>

              {/* Toggle Aktifkan Manual vs Otomatis Berurutan */}
              <button
                onClick={handleToggleAutoAdvance}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer ${
                  autoAdvance
                    ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 glow-emerald shadow-sm'
                    : 'bg-[#040813] border-cyan-500/30 text-slate-400'
                }`}
                title="Beralih antara perpindahan partai manual atau otomatis berurutan"
              >
                {autoAdvance ? <ToggleRight className="w-4 h-4 text-emerald-400" /> : <ToggleLeft className="w-4 h-4" />}
                <span>{autoAdvance ? 'Mode: Otomatis Berurutan' : 'Mode: Manual'}</span>
              </button>
            </div>

            {/* Current Active Match Detail Card */}
            {activeMatch ? (
              <div className="rounded-xl border border-cyan-500/30 p-4 bg-[#040813]/90 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-[#070e1c] text-cyan-300 border border-cyan-500/40 font-mono font-black text-xs">
                      PARTAI #{activeMatch.matchNumber}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-black uppercase text-white ${
                      activeMatch.category === 'TANDING' ? 'bg-red-600 glow-red' : 'bg-emerald-600 glow-emerald'
                    }`}>
                      {activeMatch.category.replace('_', ' ')}
                    </span>
                  </div>
                  <span className="text-xs font-mono font-semibold text-cyan-400">
                    {activeMatch.classGroup} · {activeMatch.stage.replace('_', ' ')}
                  </span>
                </div>

                {activeMatch.category === 'TANDING' ? (
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    {/* Sudut Biru - Electric Royal Blue (Kiri) */}
                    <div className="p-3 rounded-xl bg-[#071326]/90 border border-blue-500/60 text-xs glow-blue">
                      <span className="px-1.5 py-0.5 rounded bg-blue-600 text-white text-[9px] font-mono font-black uppercase">
                        SUDUT BIRU
                      </span>
                      <div className="font-extrabold text-white text-sm mt-1 truncate">
                        {activeMatch.tanding?.blueAthlete?.name || 'Sudut Biru'}
                      </div>
                      <div className="text-[11px] text-cyan-300 font-semibold truncate mt-0.5">
                        Kontingen: {activeMatch.tanding?.blueAthlete?.contingent || '-'}
                      </div>
                      <div className="mt-1 font-mono text-base font-black text-cyan-400 text-glow-blue">
                        Poin: {activeMatch.tanding?.blueScores?.totalPoints || 0}
                      </div>
                    </div>

                    {/* Sudut Merah - Crimson Scarlet (Kanan) */}
                    <div className="p-3 rounded-xl bg-[#1D080F]/90 border border-red-500/60 text-xs glow-red">
                      <span className="px-1.5 py-0.5 rounded bg-red-600 text-white text-[9px] font-mono font-black uppercase">
                        SUDUT MERAH
                      </span>
                      <div className="font-extrabold text-white text-sm mt-1 truncate">
                        {activeMatch.tanding?.redAthlete?.name || 'Sudut Merah'}
                      </div>
                      <div className="text-[11px] text-red-300 font-semibold truncate mt-0.5">
                        Kontingen: {activeMatch.tanding?.redAthlete?.contingent || '-'}
                      </div>
                      <div className="mt-1 font-mono text-base font-black text-red-400 text-glow-red">
                        Poin: {activeMatch.tanding?.redScores?.totalPoints || 0}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="p-3 rounded-xl bg-[#051a14]/90 border border-emerald-500/60 text-xs glow-emerald">
                      <span className="px-1.5 py-0.5 rounded bg-emerald-600 text-white text-[9px] font-mono font-black uppercase">
                        PESILAT SENI
                      </span>
                      <div className="font-extrabold text-white text-sm mt-1 truncate">
                        {activeMatch.jurus?.performer?.name || 'Pesilat Seni'}
                      </div>
                      <div className="text-[11px] text-emerald-300 font-semibold truncate mt-0.5">
                        Kontingen: {activeMatch.jurus?.performer?.contingent || '-'}
                      </div>
                      <div className="mt-1 font-mono text-base font-black text-emerald-400 text-glow-emerald">
                        Nilai Akhir: {activeMatch.jurus?.finalMedianScore?.toFixed(3) || '9.900'}
                      </div>
                    </div>

                    {/* MENU PILIHAN JUMLAH JURI BERTUGAS (KATEGORI JURUS: 3 JURI, 5 JURI, 10 JURI) */}
                    <div className="p-3.5 rounded-xl bg-[#071326] border-2 border-cyan-400/80 space-y-2.5 shadow-xl">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-mono font-black uppercase text-cyan-300 tracking-wider flex items-center gap-1.5">
                          <Users className="w-4 h-4 text-cyan-400" />
                          Jumlah Juri Bertugas (Kategori Jurus)
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/50 font-black">
                          Aktif: {config.jurorsCountSeni || 5} Juri
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        {[3, 5, 10].map((count) => {
                          const isSelected = (config.jurorsCountSeni || 5) === count;
                          return (
                            <button
                              key={count}
                              type="button"
                              onClick={() => handleSelectJuryCount(count)}
                              className={`py-2 px-2 rounded-xl font-mono font-black text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                                isSelected
                                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg border-2 border-cyan-300 ring-2 ring-cyan-400/50 scale-[1.02]'
                                  : 'bg-[#040813] text-slate-300 border border-cyan-500/30 hover:border-cyan-400 hover:bg-[#091326]'
                              }`}
                              title={`Pilih ${count} Juri bertugas untuk kategori jurus`}
                            >
                              <CheckCircle2 className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-slate-600'}`} />
                              <span>{count} Juri</span>
                            </button>
                          );
                        })}
                      </div>

                      <p className="text-[10px] text-cyan-400/90 font-mono">
                        *Tersinkronisasi otomatis ke Dewan, Monitor, dan Panel Juri (Regulasi Resmi IPSI 2026).
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-dashed border-cyan-500/30 text-center text-slate-400 font-mono text-xs">
                Belum ada partai aktif terpilih.
              </div>
            )}

            {/* Navigasi Prev / Next Partai & Cek Partai Selanjutnya */}
            <div className="space-y-3 pt-2 border-t border-cyan-500/20">
              <div className="flex items-center justify-between gap-2">
                <button
                  onClick={handlePrevMatch}
                  disabled={!hasPrev}
                  className="flex-1 py-2 px-3 rounded-xl text-xs font-mono font-bold bg-[#040813] hover:bg-[#091326] disabled:opacity-40 disabled:cursor-not-allowed border border-cyan-500/30 text-cyan-300 flex items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Prev Partai</span>
                </button>

                <button
                  onClick={handleNextMatch}
                  disabled={!hasNext}
                  className="flex-1 py-2 px-3 rounded-xl text-xs font-mono font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 disabled:opacity-40 disabled:cursor-not-allowed shadow-md glow-gold border border-amber-300 flex items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer"
                >
                  <span>Next Partai</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Review Nama Atlet Partai Selanjutnya */}
              <div className="p-3 rounded-xl bg-[#040813]/80 border border-amber-500/40 text-xs">
                <span className="text-[10px] font-mono font-black uppercase text-amber-400 tracking-wider flex items-center gap-1 mb-1">
                  <Clock className="w-3.5 h-3.5" />
                  Review Nama Atlet Partai Selanjutnya:
                </span>

                {nextMatch ? (
                  <div className="space-y-1 text-slate-200 font-medium">
                    <div className="flex items-center justify-between font-mono font-bold">
                      <span className="text-white">Partai #{nextMatch.matchNumber} ({nextMatch.category.replace('_', ' ')})</span>
                      <span className="text-[11px] text-cyan-400">{nextMatch.classGroup}</span>
                    </div>
                    {nextMatch.category === 'TANDING' ? (
                      <div className="text-[11px] text-slate-300 font-sans">
                        <strong className="text-blue-400 font-mono">[Biru]</strong> {nextMatch.tanding?.blueAthlete?.name} ({nextMatch.tanding?.blueAthlete?.contingent}) <br />
                        <strong className="text-red-400 font-mono">[Merah]</strong> {nextMatch.tanding?.redAthlete?.name} ({nextMatch.tanding?.redAthlete?.contingent})
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-300 font-sans">
                        <strong className="text-emerald-400 font-mono">[Seni]</strong> {nextMatch.jurus?.performer?.name} ({nextMatch.jurus?.performer?.contingent})
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-500 italic font-mono">
                    Ini adalah partai terakhir dalam jadwal saat ini.
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* HISTORI HASIL PERTANDINGAN YANG TELAH SELESAI & UNDUH PDF */}
          <div className="cyber-glass border border-cyan-500/30 rounded-2xl p-5 shadow-xl space-y-4 hud-bracket text-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-cyan-500/20 pb-3">
              <div>
                <h2 className="text-base font-black text-white flex items-center gap-2 font-mono uppercase">
                  <History className="w-4 h-4 text-purple-400" />
                  Histori Hasil Pertandingan Selesai
                </h2>
                <p className="text-xs text-slate-400 font-sans">
                  Daftar partai yang telah berakhir dengan hasil keputusan sah.
                </p>
              </div>

              {/* Tombol Unduh Semua Partai Selesai */}
              <button
                onClick={() => exportAllFinishedMatchesToPdf(finishedMatches, config)}
                disabled={finishedMatches.length === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-black bg-purple-600 hover:bg-purple-500 text-white disabled:opacity-40 disabled:cursor-not-allowed shadow-md border border-purple-400 transition-transform active:scale-95 cursor-pointer"
                title="Unduh seluruh rekapitulasi partai yang telah selesai dalam 1 PDF"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh Semua Selesai (PDF)</span>
              </button>
            </div>

            {/* List of Finished Matches */}
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {finishedMatches.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 font-mono border border-dashed border-cyan-500/30 rounded-xl">
                  Belum ada partai pertandingan yang berstatus selesai.
                </div>
              ) : (
                finishedMatches.map((fm) => {
                  const isTanding = fm.category === 'TANDING';
                  const winnerName = fm.result?.winnerCorner === 'RED'
                    ? fm.tanding?.redAthlete?.name
                    : fm.result?.winnerCorner === 'BLUE'
                      ? fm.tanding?.blueAthlete?.name
                      : fm.category !== 'TANDING'
                        ? fm.jurus?.performer?.name
                        : 'Selesai';

                  return (
                    <div
                      key={fm.id}
                      className="p-3 rounded-xl border border-cyan-500/30 bg-[#040813] flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-black text-cyan-300">
                            Partai #{fm.matchNumber}
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-[#070e1c] text-cyan-400 border border-cyan-500/30">
                            {fm.category.replace('_', ' ')}
                          </span>
                        </div>

                        <div className="text-[11px] font-medium text-slate-300 font-sans">
                          {isTanding ? (
                            <span className="inline-flex items-center gap-1">
                              <span>{fm.tanding?.blueAthlete?.name} ({fm.tanding?.blueScores?.totalPoints})</span>
                              <img src="/vs.png" alt="VS" className="h-3 w-auto object-contain select-none" draggable={false} />
                              <span>{fm.tanding?.redAthlete?.name} ({fm.tanding?.redScores?.totalPoints})</span>
                            </span>
                          ) : (
                            `${fm.jurus?.performer?.name} (Nilai: ${fm.jurus?.finalMedianScore?.toFixed(3)})`
                          )}
                        </div>

                        <div className="text-[10px] font-mono font-bold text-amber-400">
                          Pemenang: {winnerName} ({fm.result?.winType || 'Resmi'})
                        </div>
                      </div>

                      {/* Tombol Unduh PDF per partai */}
                      <button
                        onClick={() => exportMatchToPdf(fm, config)}
                        className="px-2.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-mono font-bold text-[11px] shadow-sm border border-red-400 flex items-center gap-1 shrink-0 active:scale-95 transition-transform cursor-pointer"
                        title="Unduh Berita Acara PDF untuk partai ini"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Unduh PDF</span>
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

        {/* ================= SISI KANAN (COLUMN 2) ================= */}
        <div className="space-y-6">

          {/* JADWAL SEMUA PARTAI & BUAT PARTAI BARU */}
          <div className="cyber-glass border border-cyan-500/30 rounded-2xl p-5 shadow-xl space-y-4 hud-bracket text-slate-100">
            <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3">
              <div>
                <h2 className="text-base font-black text-white flex items-center gap-2 font-mono uppercase">
                  <Layers className="w-4 h-4 text-red-500" />
                  Jadwal Partai & Pemilihan Kategori Aktif
                </h2>
                <p className="text-xs text-slate-400 font-mono">
                  Total {matches.length} Partai Terjadwal di Gelanggang.
                </p>
              </div>

              <button
                onClick={() => setIsCreatingMatch(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-mono font-black shadow-lg glow-emerald border border-emerald-400 transition-transform active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Buat Partai</span>
              </button>
            </div>

            {/* Inline Create Match Form if toggled */}
            {isCreatingMatch && (
              <form onSubmit={handleCreateMatch} className="bg-[#040813] p-4 rounded-xl border-2 border-dashed border-emerald-500 space-y-3 text-xs">
                <div className="flex justify-between items-center">
                  <h3 className="font-mono font-black text-emerald-400 uppercase tracking-wider">
                    Formulir Jadwal Partai Baru
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsCreatingMatch(false)}
                    className="text-[11px] font-mono font-bold text-slate-400 hover:text-white cursor-pointer"
                  >
                    Batal
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1 font-mono">
                      No. Partai
                    </label>
                    <input
                      type="number"
                      required
                      value={matchNumber}
                      onChange={(e) => setMatchNumber(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-cyan-500/30 bg-[#070e1c] text-white font-mono focus:border-cyan-400 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 mb-1 font-mono">
                      Kategori *
                    </label>
                    <select
                      value={matchCategory}
                      onChange={(e) => setMatchCategory(e.target.value as MatchCategory)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-cyan-500/30 bg-[#070e1c] text-white font-mono font-bold focus:border-cyan-400 focus:outline-hidden"
                    >
                      <option value="TANDING">Kategori Tanding</option>
                      <option value="JURUS_TUNGGAL">Jurus Tunggal (Seni)</option>
                      <option value="JURUS_GANDA">Jurus Ganda (Seni)</option>
                      <option value="JURUS_REGU">Jurus Regu (Seni)</option>
                      <option value="SOLO_KREATIF">Solo Kreatif (Seni)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 mb-1 font-mono">
                      Babak
                    </label>
                    <select
                      value={matchStage}
                      onChange={(e) => setMatchStage(e.target.value as MatchStage)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-cyan-500/30 bg-[#070e1c] text-white font-mono focus:border-cyan-400 focus:outline-hidden"
                    >
                      <option value="PENYISIHAN">Penyisihan</option>
                      <option value="PEREMPAT_FINAL">Perempat Final</option>
                      <option value="SEMI_FINAL">Semi Final</option>
                      <option value="PEREBUTAN_JUARA_3">Perebutan Juara 3</option>
                      <option value="FINAL">Final</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 mb-1 font-mono">
                      Pilihan Babak
                    </label>
                    <select
                      value={matchTotalRounds}
                      onChange={(e) => setMatchTotalRounds(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-cyan-500/30 bg-[#070e1c] text-amber-300 font-mono font-bold focus:border-cyan-400 focus:outline-hidden"
                    >
                      <option value={2}>2 Babak</option>
                      <option value={3}>3 Babak</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 mb-1 font-mono">
                      Kelas
                    </label>
                    <input
                      type="text"
                      value={matchClassGroup}
                      onChange={(e) => setMatchClassGroup(e.target.value)}
                      placeholder="Contoh: Kelas C (55-60 kg)"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-cyan-500/30 bg-[#070e1c] text-white font-mono focus:border-cyan-400 focus:outline-hidden"
                    />
                  </div>

                  {matchCategory === 'TANDING' ? (
                    <>
                      <div>
                        <label className="block font-bold text-blue-400 mb-1 font-mono">
                          Pesilat Biru (Sudut Kiri)
                        </label>
                        <select
                          value={blueAthleteId}
                          onChange={(e) => setBlueAthleteId(e.target.value)}
                          className="w-full px-2 py-1.5 rounded-lg border border-blue-500/50 bg-[#070e1c] text-white focus:border-blue-400 focus:outline-hidden font-sans"
                        >
                          <option value="">Pilih dari Database</option>
                          {athletes.map((a) => (
                            <option key={a.id} value={a.id}>{a.name} ({a.contingent})</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-red-400 mb-1 font-mono">
                          Pesilat Merah (Sudut Kanan)
                        </label>
                        <select
                          value={redAthleteId}
                          onChange={(e) => setRedAthleteId(e.target.value)}
                          className="w-full px-2 py-1.5 rounded-lg border border-red-500/50 bg-[#070e1c] text-white focus:border-red-400 focus:outline-hidden font-sans"
                        >
                          <option value="">Pilih dari Database</option>
                          {athletes.map((a) => (
                            <option key={a.id} value={a.id}>{a.name} ({a.contingent})</option>
                          ))}
                        </select>
                      </div>
                    </>
                  ) : (
                    <div className="col-span-2">
                      <label className="block font-bold text-emerald-400 mb-1 font-mono">
                        Pesilat / Tim Seni
                      </label>
                      <select
                        value={performerId}
                        onChange={(e) => setPerformerId(e.target.value)}
                        className="w-full px-2 py-1.5 rounded-lg border border-emerald-500/50 bg-[#070e1c] text-white focus:border-emerald-400 focus:outline-hidden font-sans"
                      >
                        <option value="">Pilih dari Database</option>
                        {athletes.map((a) => (
                          <option key={a.id} value={a.id}>{a.name} ({a.contingent}) - {a.category}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-mono font-bold shadow-md glow-emerald border border-emerald-400 cursor-pointer"
                  >
                    Simpan & Aktifkan
                  </button>
                </div>
              </form>
            )}

            {/* Match List in Right Column */}
            <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
              {matches.map((m) => {
                const isActive = m.id === activeMatchId;
                const isTanding = m.category === 'TANDING';

                return (
                  <div
                    key={m.id}
                    className={`p-3 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                      isActive
                        ? 'border-cyan-400 bg-[#070e1c] shadow-lg glow-cyan'
                        : 'border-cyan-500/20 bg-[#040813] hover:border-cyan-500/50'
                    }`}
                  >
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-black text-white">
                          Partai #{m.matchNumber}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-black uppercase text-white ${
                          isTanding ? 'bg-red-600 glow-red' : 'bg-emerald-600 glow-emerald'
                        }`}>
                          {m.category.replace('_', ' ')}
                        </span>
                        <span className="text-[10px] text-cyan-400/80 font-mono font-semibold">
                          {m.stage.replace('_', ' ')}
                        </span>
                      </div>

                      <div className="text-[11px] font-bold text-slate-200 font-sans">
                        {isTanding ? (
                          <span className="inline-flex items-center gap-1">
                            <span className="text-blue-400">[B] {m.tanding?.blueAthlete?.name}</span>
                            <img src="/vs.png" alt="VS" className="h-3 w-auto object-contain select-none" draggable={false} />
                            <span className="text-red-400">[M] {m.tanding?.redAthlete?.name}</span>
                          </span>
                        ) : (
                          `[Seni] ${m.jurus?.performer?.name} (${m.jurus?.performer?.contingent})`
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {isActive ? (
                        <div className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-mono font-extrabold text-[10px] flex items-center gap-1 glow-emerald border border-emerald-400">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Aktif</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => selectActiveMatch(m.id)}
                          className="px-2.5 py-1 rounded-lg bg-[#070e1c] hover:bg-[#091326] text-cyan-300 hover:text-white border border-cyan-500/30 font-mono font-bold text-[10px] transition-all active:scale-95 cursor-pointer"
                        >
                          Aktifkan
                        </button>
                      )}

                      <button
                        onClick={() => {
                          if (confirm(`Hapus partai #${m.matchNumber}?`)) {
                            deleteMatch(m.id);
                          }
                        }}
                        className="p-1 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-950/60 transition-colors cursor-pointer"
                        title="Hapus Partai"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>

        </div>

      </div>

      {/* ================= MODAL POP UP PARAMETER: KONFIGURASI GELANGGANG & EVENT ================= */}
      {showParameterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div className="relative w-full max-w-3xl my-auto bg-[#070e1c] border-2 border-purple-500/50 rounded-3xl shadow-2xl overflow-hidden p-5 sm:p-7 cyber-glass-deep text-slate-100 font-sans max-h-[92vh] flex flex-col animate-scale-up">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-purple-500/30 pb-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-600/20 border border-purple-400 text-purple-400 flex items-center justify-center">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-white font-mono uppercase tracking-wide flex items-center gap-2">
                    Konfigurasi Gelanggang & Event Kejuaraan
                  </h2>
                  <p className="text-xs text-slate-400 font-sans">
                    Pengaturan parameter turnamen, arena gelanggang, babak, logo monitor, dan pejabat kejuaraan.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowParameterModal(false)}
                className="p-2 rounded-xl bg-[#040813] hover:bg-[#091326] border border-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
                title="Tutup Menu Parameter"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSaveConfig} className="space-y-4 pt-4 overflow-y-auto pr-1 flex-1 text-xs">
              
              {/* Section 1: Informasi Umum Event & Gelanggang */}
              <div>
                <span className="text-[10px] font-mono font-black uppercase text-purple-400 tracking-wider block mb-2">
                  1. IDENTITAS TURNAMEN & GELANGGANG
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1 font-mono">
                      Nama Turnamen / Kejuaraan
                    </label>
                    <input
                      type="text"
                      value={tournamentName}
                      onChange={(e) => setTournamentName(e.target.value)}
                      placeholder="Contoh: KEJUARAAN PENCAK SILAT NASIONAL 2026"
                      className="w-full px-3 py-2 rounded-xl border border-purple-500/30 bg-[#040813] text-white focus:border-purple-400 focus:outline-hidden"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 mb-1 font-mono">
                      Nama Gelanggang
                    </label>
                    <input
                      type="text"
                      value={arenaName}
                      onChange={(e) => setArenaName(e.target.value)}
                      placeholder="Contoh: Gelanggang 1"
                      className="w-full px-3 py-2 rounded-xl border border-purple-500/30 bg-[#040813] text-white focus:border-purple-400 focus:outline-hidden font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 mb-1 font-mono">
                      Tempat Pelaksanaan
                    </label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Contoh: Padepokan TMII Jakarta"
                      className="w-full px-3 py-2 rounded-xl border border-purple-500/30 bg-[#040813] text-white focus:border-purple-400 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 mb-1 font-mono">
                      Kota / Tempat Dibuat
                    </label>
                    <input
                      type="text"
                      value={cityCreated}
                      onChange={(e) => setCityCreated(e.target.value)}
                      placeholder="Contoh: Jakarta"
                      className="w-full px-3 py-2 rounded-xl border border-purple-500/30 bg-[#040813] text-white focus:border-purple-400 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 mb-1 font-mono">
                      Tanggal Pelaksanaan
                    </label>
                    <input
                      type="text"
                      value={dateCreated}
                      onChange={(e) => setDateCreated(e.target.value)}
                      placeholder="Contoh: 12 Oktober 2026"
                      className="w-full px-3 py-2 rounded-xl border border-purple-500/30 bg-[#040813] text-white focus:border-purple-400 focus:outline-hidden font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 mb-1 font-mono">
                      Waktu Pelaksanaan
                    </label>
                    <input
                      type="text"
                      value={eventTime}
                      onChange={(e) => setEventTime(e.target.value)}
                      placeholder="Contoh: 08:00 - 18:00 WIB"
                      className="w-full px-3 py-2 rounded-xl border border-purple-500/30 bg-[#040813] text-white focus:border-purple-400 focus:outline-hidden font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Pilihan Babak & Durasi Pertandingan */}
              <div className="pt-3 border-t border-purple-500/20">
                <span className="text-[10px] font-mono font-black uppercase text-purple-400 tracking-wider block mb-2">
                  2. PARAMETER BABAK & DURASI WAKTU
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1 font-mono">
                      Pilihan Jumlah Babak
                    </label>
                    <select
                      value={totalRoundsSetting}
                      onChange={(e) => setTotalRoundsSetting(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-purple-500/30 bg-[#040813] text-white focus:border-purple-400 focus:outline-hidden font-mono"
                    >
                      <option value={2}>2 Babak</option>
                      <option value={3}>3 Babak</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 mb-1 font-mono">
                      Durasi Babak Tanding (detik)
                    </label>
                    <input
                      type="number"
                      min={30}
                      max={300}
                      value={roundDurationTanding}
                      onChange={(e) => setRoundDurationTanding(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-purple-500/30 bg-[#040813] text-white focus:border-purple-400 focus:outline-hidden font-mono"
                    />
                    <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">120 detik = 2 menit</span>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 mb-1 font-mono">
                      Durasi Babak Seni (detik)
                    </label>
                    <input
                      type="number"
                      min={60}
                      max={300}
                      value={roundDurationSeni}
                      onChange={(e) => setRoundDurationSeni(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-purple-500/30 bg-[#040813] text-white focus:border-purple-400 focus:outline-hidden font-mono"
                    />
                    <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">180 detik = 3 menit</span>
                  </div>

                  <div className="sm:col-span-3 pt-2">
                    <label className="block font-bold text-slate-300 mb-1 font-mono">
                      Pilihan Jumlah Juri Bertugas (Kategori Jurus / Seni)
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[3, 5, 10].map((count) => {
                        const isSelected = jurorsCountSeni === count;
                        return (
                          <button
                            key={count}
                            type="button"
                            onClick={() => setJurorsCountSeni(count)}
                            className={`py-2 px-3 rounded-xl font-mono font-black text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                              isSelected
                                ? 'bg-purple-600 text-white shadow-md border-2 border-purple-300 ring-2 ring-purple-400/40'
                                : 'bg-[#040813] text-slate-300 border border-purple-500/30 hover:border-purple-400 hover:bg-[#071326]'
                            }`}
                          >
                            <CheckCircle2 className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-slate-600'}`} />
                            <span>{count} Juri</span>
                          </button>
                        );
                      })}
                    </div>
                    <span className="text-[10px] text-purple-300 font-mono mt-1 block">
                      Tersedia: 3 Juri, 5 Juri, dan 10 Juri. Tersinkronisasi ke Dewan, Monitor, dan Juri.
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 3: Input Logo Sisi Kiri & Kanan Monitor */}
              <div className="pt-3 border-t border-purple-500/20">
                <span className="text-[10px] font-mono font-black uppercase text-purple-400 tracking-wider block mb-2">
                  3. LOGO MONITOR GELANGGANG
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Logo Kiri */}
                  <div className="space-y-1.5 p-3 rounded-xl bg-[#040813]/60 border border-purple-500/20">
                    <label className="block font-bold text-slate-300 font-mono">
                      Input Logo Sisi Kiri Monitor:
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={leftLogoUrl}
                        onChange={(e) => setLeftLogoUrl(e.target.value)}
                        placeholder="URL Gambar Logo Kiri"
                        className="flex-1 px-2.5 py-1.5 rounded-lg border border-purple-500/30 bg-[#040813] text-white text-xs focus:border-purple-400 focus:outline-hidden"
                      />
                      <label className="p-1.5 rounded-lg bg-[#040813] hover:bg-[#091326] border border-purple-500/40 cursor-pointer text-purple-300 hover:text-white" title="Upload berkas gambar lokal">
                        <Upload className="w-4 h-4" />
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'left')} />
                      </label>
                    </div>
                    {leftLogoUrl && (
                      <div className="w-12 h-12 rounded-lg border border-purple-500/40 p-1 bg-[#040813] flex items-center justify-center">
                        <img src={leftLogoUrl} alt="Logo Kiri" className="max-h-full max-w-full object-contain" />
                      </div>
                    )}
                  </div>

                  {/* Logo Kanan */}
                  <div className="space-y-1.5 p-3 rounded-xl bg-[#040813]/60 border border-purple-500/20">
                    <label className="block font-bold text-slate-300 font-mono">
                      Input Logo Sisi Kanan Monitor:
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={rightLogoUrl}
                        onChange={(e) => setRightLogoUrl(e.target.value)}
                        placeholder="URL Gambar Logo Kanan"
                        className="flex-1 px-2.5 py-1.5 rounded-lg border border-purple-500/30 bg-[#040813] text-white text-xs focus:border-purple-400 focus:outline-hidden"
                      />
                      <label className="p-1.5 rounded-lg bg-[#040813] hover:bg-[#091326] border border-purple-500/40 cursor-pointer text-purple-300 hover:text-white" title="Upload berkas gambar lokal">
                        <Upload className="w-4 h-4" />
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'right')} />
                      </label>
                    </div>
                    {rightLogoUrl && (
                      <div className="w-12 h-12 rounded-lg border border-purple-500/40 p-1 bg-[#040813] flex items-center justify-center">
                        <img src={rightLogoUrl} alt="Logo Kanan" className="max-h-full max-w-full object-contain" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Section 4: Tanda Tangan & Pejabat */}
              <div className="pt-3 border-t border-purple-500/20">
                <span className="text-[10px] font-mono font-black uppercase text-purple-400 tracking-wider block mb-2">
                  4. PENGESAHAN & PEJABAT PERTANDINGAN
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1 font-mono">
                      Ttd Ketua Dewan Pertandingan:
                    </label>
                    <input
                      type="text"
                      value={leadRefereeSignature}
                      onChange={(e) => setLeadRefereeSignature(e.target.value)}
                      placeholder="Nama Lengkap & Gelar Ketua Dewan"
                      className="w-full px-3 py-2 rounded-xl border border-purple-500/30 bg-[#040813] text-white focus:border-purple-400 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 mb-1 font-mono">
                      Ttd Sekretaris Pertandingan:
                    </label>
                    <input
                      type="text"
                      value={secretarySignature}
                      onChange={(e) => setSecretarySignature(e.target.value)}
                      placeholder="Nama Lengkap & Gelar Sekretaris"
                      className="w-full px-3 py-2 rounded-xl border border-purple-500/30 bg-[#040813] text-white focus:border-purple-400 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Section 5: Mode Otomatis Berurutan */}
              <div className="pt-3 border-t border-purple-500/20 flex items-center justify-between p-3 rounded-xl bg-[#040813]/60 border border-purple-500/20">
                <div>
                  <span className="font-bold text-white block font-mono">
                    Mode Otomatis Berurutan (Auto-Advance)
                  </span>
                  <span className="text-slate-400 text-[11px]">
                    Otomatis beralih ke partai berikutnya saat keputusan pemenang disahkan dewan.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setAutoAdvance(!autoAdvance)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer ${
                    autoAdvance
                      ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
                      : 'bg-[#040813] border-slate-700 text-slate-400'
                  }`}
                >
                  {autoAdvance ? <ToggleRight className="w-4 h-4 text-emerald-400" /> : <ToggleLeft className="w-4 h-4" />}
                  <span>{autoAdvance ? 'Aktif' : 'Nonaktif'}</span>
                </button>
              </div>

              {/* Modal Footer / Submit */}
              <div className="pt-3 border-t border-purple-500/30 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowParameterModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-xs font-bold text-slate-300 hover:bg-[#091326] transition-colors cursor-pointer"
                >
                  Batal / Tutup
                </button>

                <button
                  type="submit"
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-mono font-black text-xs shadow-md border border-amber-300 flex items-center gap-1.5 cursor-pointer active:scale-95 transition-transform"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan Konfigurasi Gelanggang</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {showRegistrationModal && (
        <AthleteRegistrationModal onClose={() => setShowRegistrationModal(false)} />
      )}

      {/* Modal Konfirmasi Reset Data Turnamen */}
      {showResetConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-100 rounded-3xl shadow-2xl p-6 space-y-4 animate-scale-up">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 flex items-center justify-center mx-auto">
              <RotateCcw className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-base font-black text-slate-900 dark:text-white font-mono tracking-wide">
                RESET SELURUH DATA TURNAMEN?
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Tindakan ini akan memulihkan data atlet default, bagan pertandingan, jadwal partai, skor, serta pengaturan gelanggang ke kondisi awal. Seluruh perubahan akan otomatis disinkronkan ke seluruh panel (Dewan, Juri, Timer, Monitor, Laporan).
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowResetConfirmModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={() => {
                  resetAllToDefault();
                  setShowResetConfirmModal(false);
                  setResetToast(true);
                  setTimeout(() => setResetToast(false), 4000);
                }}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-black shadow transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Ya, Reset Sekarang</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifikasi Berhasil Reset */}
      {resetToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 animate-slide-up text-xs font-bold border border-emerald-400">
          <CheckCircle2 className="w-5 h-5 text-emerald-200" />
          <span>Data turnamen berhasil direset ke pengaturan awal & disinkronkan ke seluruh panel!</span>
        </div>
      )}

      {/* Toast Notifikasi Berhasil Simpan Parameter */}
      {parameterToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-purple-700 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 animate-slide-up text-xs font-bold border border-purple-400">
          <CheckCircle2 className="w-5 h-5 text-purple-200" />
          <span>Konfigurasi Gelanggang & Event Kejuaraan berhasil disimpan dan disinkronkan ke seluruh panel!</span>
        </div>
      )}
    </div>
  );
};
