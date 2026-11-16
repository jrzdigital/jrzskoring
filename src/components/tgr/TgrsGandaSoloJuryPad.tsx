import React, { useState, useEffect, useRef } from "react";
import { 
  TgrsMatchState, 
  TgrsJudgeState, 
  SKOR_DASAR_GANDA_SOLO,
  computeJudgeScore,
  computeTgrsFinalResult,
  saveTgrsLiveState
} from "../../utils/tgrsScoringEngine";
import { soundEffects } from "../../utils/audio";
import { 
  ArrowLeft, 
  Maximize2, 
  CheckCircle2, 
  Send,
  Minus,
  Plus,
  Lock
} from "lucide-react";

interface TgrsGandaSoloJuryPadProps {
  state: TgrsMatchState;
  activeJudgeId?: number;
  onUpdateState: (updater: (prev: TgrsMatchState) => TgrsMatchState) => void;
  onBackToLanding?: () => void;
  onSwitchToTanding?: () => void;
  onToggleFullscreen?: () => void;
  isFullscreen?: boolean;
}

// 30 Tombol Tuning (0.01 sampai 0.30) untuk tampilan Desktop
const TUNING_BUTTON_VALUES: number[] = [
  0.01, 0.02, 0.03, 0.04, 0.05, 0.06, 0.07, 0.08, 0.09, 0.10,
  0.11, 0.12, 0.13, 0.14, 0.15, 0.16, 0.17, 0.18, 0.19, 0.20,
  0.21, 0.22, 0.23, 0.24, 0.25, 0.26, 0.27, 0.28, 0.29, 0.30
];

interface AspectSliderProps {
  title: string;
  value: number;
  accent: "cyan" | "amber";
  disabled: boolean;
  compactLandscape: boolean;
  onChange: (val: number) => void;
}

const AspectTouchSlider: React.FC<AspectSliderProps> = ({
  title,
  value,
  accent,
  disabled,
  compactLandscape,
  onChange,
}) => {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const clampedValue = Math.max(0, Math.min(0.3, Number(value.toFixed(2))));
  const stepInt = Math.round(clampedValue * 100);
  const percent = (stepInt / 30) * 100;

  const updateFromClientX = (clientX: number) => {
    if (disabled || !trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    if (rect.width <= 0) return;
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const nextStep = Math.round(ratio * 30);
    const nextVal = Number((nextStep / 100).toFixed(2));
    if (Math.abs(nextVal - clampedValue) >= 0.005) {
      onChange(nextVal);
    }
  };

  const handleStep = (deltaStep: number) => {
    if (disabled) return;
    const nextStep = Math.max(0, Math.min(30, stepInt + deltaStep));
    const nextVal = Number((nextStep / 100).toFixed(2));
    if (Math.abs(nextVal - clampedValue) >= 0.005) {
      onChange(nextVal);
    }
  };

  const isAmber = accent === "amber";
  const titleColor = isAmber ? "text-amber-400" : "text-cyan-400";
  const subColor = isAmber ? "text-amber-400/75" : "text-cyan-400/75";
  const scoreColor = isAmber
    ? "text-[#f59e0b] drop-shadow-[0_0_10px_rgba(245,158,11,0.65)]"
    : "text-[#38bdf8] drop-shadow-[0_0_10px_rgba(56,189,248,0.65)]";
  const fillGradient = isAmber
    ? "from-amber-600 via-amber-500 to-amber-300 shadow-[0_0_14px_rgba(245,158,11,0.55)]"
    : "from-cyan-600 via-cyan-500 to-sky-300 shadow-[0_0_14px_rgba(56,189,248,0.55)]";
  const thumbBorder = isAmber
    ? "border-amber-200 bg-amber-400 shadow-[0_0_16px_rgba(245,158,11,0.9)]"
    : "border-cyan-100 bg-cyan-400 shadow-[0_0_16px_rgba(56,189,248,0.9)]";
  const cardBorder = isAmber
    ? "border-amber-500/25 bg-[#060d22]/95"
    : "border-cyan-500/25 bg-[#060d22]/95";

  if (compactLandscape) {
    return (
      <div className={`flex-1 min-h-0 rounded-xl border ${cardBorder} px-2.5 py-1 flex items-center gap-2.5 shadow-lg`}>
        {/* Label Kiri */}
        <div className="w-[26%] min-w-0 shrink-0">
          <div className={`font-sans font-black text-[11px] leading-tight uppercase tracking-wide truncate ${titleColor}`}>
            {title}
          </div>
          <div className={`font-mono font-bold text-[9px] ${subColor}`}>
            (0.00 - 0.30)
          </div>
        </div>

        {/* Kontrol Slider Kiri-Kanan */}
        <div className="flex-1 flex items-center gap-2 min-w-0">
          <button
            type="button"
            disabled={disabled || stepInt <= 0}
            onClick={() => handleStep(-1)}
            aria-label={`Kurangi ${title}`}
            className="w-8 h-8 shrink-0 rounded-lg bg-[#0d1a3a] active:scale-95 border border-[#1e356d] text-slate-200 flex items-center justify-center disabled:opacity-30 cursor-pointer touch-manipulation"
          >
            <Minus className="w-4 h-4" />
          </button>

          <div className="flex-1 flex flex-col justify-center min-w-0">
            <div
              ref={trackRef}
              role="slider"
              aria-label={title}
              aria-valuemin={0}
              aria-valuemax={0.3}
              aria-valuenow={clampedValue}
              tabIndex={disabled ? -1 : 0}
              onPointerDown={(e) => {
                if (disabled) return;
                try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
                setIsDragging(true);
                updateFromClientX(e.clientX);
              }}
              onPointerMove={(e) => {
                if (!isDragging || disabled) return;
                updateFromClientX(e.clientX);
              }}
              onPointerUp={(e) => {
                if (isDragging) {
                  try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {}
                  setIsDragging(false);
                }
              }}
              onPointerCancel={() => setIsDragging(false)}
              className={`relative h-8 flex items-center select-none ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
              style={{ touchAction: "none" }}
            >
              {/* Track background */}
              <div className="w-full h-3 rounded-full bg-[#0b1634] border border-[#1b2f61] overflow-hidden relative">
                <div
                  className={`h-full bg-gradient-to-r ${fillGradient} transition-[width] duration-75`}
                  style={{ width: `${percent}%` }}
                />
              </div>

              {/* Tick marks */}
              {[0, 10, 20, 30].map((tick) => (
                <div
                  key={tick}
                  className="absolute top-1/2 -translate-y-1/2 w-[1px] h-4 bg-white/20 pointer-events-none"
                  style={{ left: `${(tick / 30) * 100}%` }}
                />
              ))}

              {/* Thumb */}
              <div
                className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full border-2 ${thumbBorder} pointer-events-none flex items-center justify-center transition-transform ${
                  isDragging ? "scale-115" : ""
                }`}
                style={{ left: `${percent}%` }}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />
              </div>
            </div>
          </div>

          <button
            type="button"
            disabled={disabled || stepInt >= 30}
            onClick={() => handleStep(1)}
            aria-label={`Tambah ${title}`}
            className="w-8 h-8 shrink-0 rounded-lg bg-[#0d1a3a] active:scale-95 border border-[#1e356d] text-slate-200 flex items-center justify-center disabled:opacity-30 cursor-pointer touch-manipulation"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Nilai Skor Kanan */}
        <div className="w-14 shrink-0 text-right">
          <div className={`text-xl font-mono font-black leading-none ${scoreColor}`}>
            {clampedValue.toFixed(2)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex-1 min-h-0 rounded-xl border ${cardBorder} px-3 py-2 sm:px-4 sm:py-2.5 flex flex-col justify-center gap-1.5 sm:gap-2 shadow-lg`}>
      {/* Baris Atas Card: Nama Kategori & Nilai Skor */}
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className={`font-sans font-black text-xs sm:text-sm uppercase tracking-wide truncate ${titleColor}`}>
            {title}
          </div>
          <div className={`font-mono font-bold text-[10px] sm:text-xs ${subColor}`}>
            Geser Kiri / Kanan (0.00 - 0.30)
          </div>
        </div>

        <div className="flex items-baseline gap-1.5 shrink-0 bg-[#030716]/80 px-2.5 py-1 rounded-lg border border-[#142344]">
          <span className="text-[9px] font-mono font-bold text-slate-400 uppercase">SKOR</span>
          <span className={`text-xl sm:text-2xl font-mono font-black leading-none ${scoreColor}`}>
            {clampedValue.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Baris Bawah Card: Tombol [-] + Slider Kiri-Kanan + Tombol [+] */}
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          disabled={disabled || stepInt <= 0}
          onClick={() => handleStep(-1)}
          aria-label={`Kurangi ${title}`}
          className="w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-lg bg-[#0d1a3a] hover:bg-[#132652] active:scale-95 border border-[#1e356d] text-slate-100 flex items-center justify-center disabled:opacity-30 cursor-pointer touch-manipulation"
        >
          <Minus className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        <div className="flex-1 flex flex-col min-w-0 px-1">
          <div
            ref={trackRef}
            role="slider"
            aria-label={title}
            aria-valuemin={0}
            aria-valuemax={0.3}
            aria-valuenow={clampedValue}
            tabIndex={disabled ? -1 : 0}
            onPointerDown={(e) => {
              if (disabled) return;
              try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
              setIsDragging(true);
              updateFromClientX(e.clientX);
            }}
            onPointerMove={(e) => {
              if (!isDragging || disabled) return;
              updateFromClientX(e.clientX);
            }}
            onPointerUp={(e) => {
              if (isDragging) {
                try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {}
                setIsDragging(false);
              }
            }}
            onPointerCancel={() => setIsDragging(false)}
            className={`relative h-10 flex items-center select-none ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
            style={{ touchAction: "none" }}
          >
            {/* Track background */}
            <div className="w-full h-3.5 sm:h-4 rounded-full bg-[#0b1634] border border-[#1d346b] overflow-hidden relative shadow-inner">
              <div
                className={`h-full bg-gradient-to-r ${fillGradient} transition-[width] duration-75`}
                style={{ width: `${percent}%` }}
              />
            </div>

            {/* Tick marks */}
            {[0, 5, 10, 15, 20, 25, 30].map((tick) => (
              <div
                key={tick}
                className={`absolute top-1/2 -translate-y-1/2 w-[1px] pointer-events-none ${
                  tick % 10 === 0 ? "h-5 bg-white/30" : "h-3 bg-white/15"
                }`}
                style={{ left: `${(tick / 30) * 100}%` }}
              />
            ))}

            {/* Thumb */}
            <div
              className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 ${thumbBorder} pointer-events-none flex items-center justify-center transition-transform ${
                isDragging ? "scale-115" : ""
              }`}
              style={{ left: `${percent}%` }}
            >
              <div className="w-2 h-2 rounded-full bg-slate-950" />
            </div>
          </div>

          {/* Skala Angka di Bawah Slider */}
          <div className="flex items-center justify-between text-[9px] sm:text-[10px] font-mono font-bold text-slate-400 px-0.5 -mt-1">
            <span>0.00</span>
            <span>0.10</span>
            <span>0.20</span>
            <span>0.30</span>
          </div>
        </div>

        <button
          type="button"
          disabled={disabled || stepInt >= 30}
          onClick={() => handleStep(1)}
          aria-label={`Tambah ${title}`}
          className="w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-lg bg-[#0d1a3a] hover:bg-[#132652] active:scale-95 border border-[#1e356d] text-slate-100 flex items-center justify-center disabled:opacity-30 cursor-pointer touch-manipulation"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>
    </div>
  );
};

export const TgrsGandaSoloJuryPad: React.FC<TgrsGandaSoloJuryPadProps> = ({
  state,
  activeJudgeId: initialJudgeId = 1,
  onUpdateState,
  onBackToLanding,
  onToggleFullscreen,
}) => {
  const [judgeId, setJudgeId] = useState<number>(initialJudgeId || 1);
  const [submittedMessage, setSubmittedMessage] = useState<string | null>(null);
  const lastSoundRef = useRef<number>(0);

  const [viewport, setViewport] = useState<{ width: number; height: number; isMobileDevice: boolean }>(() => {
    if (typeof window === "undefined") {
      return { width: 1280, height: 800, isMobileDevice: false };
    }
    const ua = navigator.userAgent || "";
    const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const isAndroid = /Android/i.test(ua);
    const isTouch = navigator.maxTouchPoints > 0;
    const isSmallOrMedium = window.innerWidth < 1024;
    return {
      width: window.innerWidth,
      height: window.innerHeight,
      isMobileDevice: isIOS || isAndroid || isSmallOrMedium || (isTouch && window.innerWidth <= 1280),
    };
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleResize = () => {
      const ua = navigator.userAgent || "";
      const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
      const isAndroid = /Android/i.test(ua);
      const isTouch = navigator.maxTouchPoints > 0;
      const isSmallOrMedium = window.innerWidth < 1024;
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
        isMobileDevice: isIOS || isAndroid || isSmallOrMedium || (isTouch && window.innerWidth <= 1280),
      });
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
    };
  }, []);

  // Matikan zoom paksa 1140px di MobileViewportScaler saat panel slider mobile/tablet aktif
  // agar slider pas 100% di layar iOS / Android dengan koordinat sentuh 1:1 akurat
  useEffect(() => {
    if (typeof document === "undefined") return;
    const prevAttr = document.documentElement.getAttribute("data-native-mobile-fit");
    const nextAttr = viewport.isMobileDevice ? "true" : null;
    if (prevAttr !== nextAttr) {
      if (nextAttr) {
        document.documentElement.setAttribute("data-native-mobile-fit", nextAttr);
      } else {
        document.documentElement.removeAttribute("data-native-mobile-fit");
      }
      window.dispatchEvent(new Event("jrz_scaler_override"));
    }

    return () => {
      if (document.documentElement.hasAttribute("data-native-mobile-fit")) {
        document.documentElement.removeAttribute("data-native-mobile-fit");
        window.dispatchEvent(new Event("jrz_scaler_override"));
      }
    };
  }, [viewport.isMobileDevice]);

  useEffect(() => {
    if (initialJudgeId && initialJudgeId >= 1 && initialJudgeId <= 10) {
      setJudgeId(initialJudgeId);
    }
  }, [initialJudgeId]);

  const activeCorner = state.activeCorner || "BLUE";
  const currentPerformer = activeCorner === "BLUE" ? state.bluePerformer : state.redPerformer;
  const contingent = currentPerformer?.contingent || state.contingent || (activeCorner === "BLUE" ? "SINGAPORE" : "INDONESIA");
  const athleteName = currentPerformer?.athleteName || state.athleteName || (activeCorner === "BLUE" ? "ATLIT BIRU" : "ATLIT MERAH");

  const currentJudge: TgrsJudgeState = currentPerformer?.judges?.[judgeId] || state.judges?.[judgeId] || {
    id: judgeId,
    name: `Juri ${judgeId}`,
    errorsCount: 0,
    errorHistory: [],
    kebenaranScore: 0.00,
    kemantapanScore: 0.00,
    serangBelaScore: 0.00,
    penjiwaanScore: 0.00,
    teknikScore: 0.00,
    koreografiScore: 0.00,
    totalScore: SKOR_DASAR_GANDA_SOLO,
    isSubmitted: false
  };

  const isSolo = state.category === "SOLO_KREATIF" || (state.category as string) === "TUNGGAL_BEBAS";

  // Nilai Aspek Juri
  const techniqueScore = currentJudge.serangBelaScore ?? currentJudge.teknikScore ?? 0.00;
  const firmnessScore = currentJudge.kemantapanScore ?? 0.00;
  const soulfulnessScore = currentJudge.penjiwaanScore ?? currentJudge.koreografiScore ?? 0.00;

  // Kombinasi ketiga aspek (0.00 s/d 0.90)
  const combinedScore = Number((techniqueScore + firmnessScore + soulfulnessScore).toFixed(2));

  // Akumulasi total skor juri (9.10 + akumulasi ketiga aspek)
  const totalAccumulation = Number((SKOR_DASAR_GANDA_SOLO + combinedScore).toFixed(2));

  const applyScoreValue = (
    field: "serangBelaScore" | "kemantapanScore" | "penjiwaanScore",
    safeVal: number
  ) => {
    onUpdateState((prev) => {
      const corner = prev.activeCorner || "BLUE";
      const isBlue = corner === "BLUE";
      const activeJudges = isBlue ? { ...prev.bluePerformer.judges } : { ...prev.redPerformer.judges };
      const j = activeJudges[judgeId] || prev.judges[judgeId] || currentJudge;

      const updatedFields: TgrsJudgeState = {
        ...j,
        [field]: safeVal
      };

      if (field === "serangBelaScore") updatedFields.teknikScore = safeVal;
      if (field === "penjiwaanScore") updatedFields.koreografiScore = safeVal;

      const computed = computeJudgeScore(prev.category, updatedFields);
      const updatedJudge: TgrsJudgeState = {
        ...updatedFields,
        kebenaranScore: computed.kebenaranScore,
        totalScore: computed.totalScore,
        lastPressedAt: Date.now()
      };

      const updatedActiveJudges = {
        ...activeJudges,
        [judgeId]: updatedJudge
      };

      const activePerformer = isBlue ? prev.bluePerformer : prev.redPerformer;
      const penalties = activePerformer?.dewanPenalties || prev.dewanPenalties;
      const res = computeTgrsFinalResult(prev.category, updatedActiveJudges, penalties, prev.judgesCount);

      const updatedPerformer = {
        ...activePerformer,
        judges: updatedActiveJudges,
        finalScore: res.finalScore,
        averageScore: res.averageScore,
        totalPenaltiDewan: res.totalPenaltiDewan,
        discardedHigh: res.discardedHigh,
        discardedLow: res.discardedLow,
        validScores: res.validScores
      };

      const nextState = {
        ...prev,
        judges: updatedActiveJudges,
        finalScore: res.finalScore,
        averageScore: res.averageScore,
        totalPenaltiDewan: res.totalPenaltiDewan,
        bluePerformer: isBlue ? updatedPerformer : prev.bluePerformer,
        redPerformer: !isBlue ? updatedPerformer : prev.redPerformer
      };

      saveTgrsLiveState(nextState);
      return nextState;
    });
  };

  // Handler tombol tuning desktop (Toggle jika diklik ulang, update ke nilai baru jika berbeda)
  const handleSelectTuning = (
    field: "serangBelaScore" | "kemantapanScore" | "penjiwaanScore",
    val: number
  ) => {
    if (currentJudge.isSubmitted) return;
    try { soundEffects.playClick(); } catch {}

    const curr = currentJudge[field] ?? 0;
    const nextVal = Math.abs(curr - val) < 0.005 ? 0.00 : val;
    applyScoreValue(field, Math.max(0, Math.min(0.3, Number(nextVal.toFixed(2)))));
  };

  // Handler slider mobile iOS/Android (langsung set nilai 0.00 - 0.30 tanpa toggle ke 0)
  const handleSliderChange = (
    field: "serangBelaScore" | "kemantapanScore" | "penjiwaanScore",
    val: number
  ) => {
    if (currentJudge.isSubmitted) return;
    const now = Date.now();
    if (now - lastSoundRef.current > 75) {
      lastSoundRef.current = now;
      try { soundEffects.playClick(); } catch {}
    }
    applyScoreValue(field, Math.max(0, Math.min(0.3, Number(val.toFixed(2)))));
  };

  // Kirim dan kunci nilai juri
  const handleSubmitScore = () => {
    if (currentJudge.isSubmitted) return;
    try { soundEffects.playGong(); } catch {}

    onUpdateState((prev) => {
      const corner = prev.activeCorner || "BLUE";
      const isBlue = corner === "BLUE";
      const activeJudges = isBlue ? { ...prev.bluePerformer.judges } : { ...prev.redPerformer.judges };
      const j = activeJudges[judgeId] || prev.judges[judgeId] || currentJudge;

      const updatedJudge: TgrsJudgeState = {
        ...j,
        isSubmitted: true,
        submittedAt: Date.now()
      };

      const updatedActiveJudges = {
        ...activeJudges,
        [judgeId]: updatedJudge
      };

      const activePerformer = isBlue ? prev.bluePerformer : prev.redPerformer;
      const penalties = activePerformer?.dewanPenalties || prev.dewanPenalties;
      const res = computeTgrsFinalResult(prev.category, updatedActiveJudges, penalties, prev.judgesCount);

      const updatedPerformer = {
        ...activePerformer,
        judges: updatedActiveJudges,
        finalScore: res.finalScore,
        averageScore: res.averageScore,
        totalPenaltiDewan: res.totalPenaltiDewan,
        discardedHigh: res.discardedHigh,
        discardedLow: res.discardedLow,
        validScores: res.validScores
      };

      const nextState = {
        ...prev,
        judges: updatedActiveJudges,
        finalScore: res.finalScore,
        averageScore: res.averageScore,
        totalPenaltiDewan: res.totalPenaltiDewan,
        bluePerformer: isBlue ? updatedPerformer : prev.bluePerformer,
        redPerformer: !isBlue ? updatedPerformer : prev.redPerformer
      };

      saveTgrsLiveState(nextState);
      return nextState;
    });

    setSubmittedMessage(`NILAI JURI ${judgeId} BERHASIL DIKUNCI (SKOR: ${totalAccumulation.toFixed(2)})`);
    setTimeout(() => setSubmittedMessage(null), 3000);
  };

  const categoryTitle = isSolo
    ? "PENILAIAN KATEGORI TUNGGAL BEBAS / SOLO KREATIF"
    : "PENILAIAN KATEGORI GANDA / DOUBLE";

  const categoryRightBadge = isSolo ? "SOLO KREATIF" : "GANDA/DOUBLE";
  const firstAspectTitle = isSolo ? "TEKNIK GERAKAN" : "TEKNIK SERANG BELA";

  // =========================================================================
  // TAMPILAN KHUSUS iOS / ANDROID (SLIDER KIRI-KANAN & FIT 100% LAYAR)
  // =========================================================================
  if (viewport.isMobileDevice) {
    const isCompactLandscape = viewport.width > viewport.height && viewport.height < 520;
    const isNarrowPortrait = viewport.width < 520 && viewport.height >= viewport.width;

    return (
      <div
        className="fixed inset-0 w-full h-[100dvh] max-h-[100dvh] bg-[#030716] text-slate-100 flex flex-col justify-between font-sans select-none overflow-hidden"
        style={{
          paddingTop: "max(0.45rem, env(safe-area-inset-top))",
          paddingBottom: "max(0.45rem, env(safe-area-inset-bottom))",
          paddingLeft: "max(0.5rem, env(safe-area-inset-left))",
          paddingRight: "max(0.5rem, env(safe-area-inset-right))",
        }}
      >
        {/* TOP HEADER COMPACT (FIT 100% LEBAR LAYAR) */}
        {isNarrowPortrait ? (
          <div className="shrink-0 flex flex-col gap-1 pb-1.5 border-b border-[#0e1c3c]">
            {/* Row 1: Back, Corner Badge, Judge & Fullscreen */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                {onBackToLanding && (
                  <button
                    type="button"
                    onClick={onBackToLanding}
                    className="p-1.5 rounded-lg bg-[#091430] border border-[#172b58] text-slate-300 active:scale-95 cursor-pointer shrink-0"
                    title="Kembali ke Menu Utama"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                )}
                <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#08122c] border border-amber-500/50 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  <span className="text-[11px] font-mono font-black text-amber-300 uppercase">
                    JURI {judgeId}
                  </span>
                </div>
              </div>

              {activeCorner === "BLUE" ? (
                <div className="px-3.5 py-1 rounded bg-[#1860ec] text-white font-sans font-black text-[11px] tracking-widest uppercase shadow-[0_0_12px_rgba(24,96,236,0.6)] flex items-center gap-1.5 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-300 animate-pulse" />
                  <span>SUDUT BIRU</span>
                </div>
              ) : (
                <div className="px-3.5 py-1 rounded bg-[#dc2626] text-white font-sans font-black text-[11px] tracking-widest uppercase shadow-[0_0_12px_rgba(220,38,38,0.6)] flex items-center gap-1.5 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-300 animate-pulse" />
                  <span>SUDUT MERAH</span>
                </div>
              )}

              <div className="flex items-center gap-1 shrink-0">
                {onToggleFullscreen && (
                  <button
                    type="button"
                    onClick={onToggleFullscreen}
                    className="p-1.5 rounded-lg bg-[#091430] border border-[#172b58] text-slate-300 active:scale-95 cursor-pointer"
                    title="Layar Penuh"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Row 2: Contingent / Athlete & Category */}
            <div className="flex items-center justify-between gap-2 px-0.5">
              <div className="min-w-0 flex-1">
                <div className="text-[10px] text-[#8899b0] font-bold uppercase truncate">
                  {contingent} • GLG {state.gelanggang || "1"} / P{state.partai || "1"}
                </div>
                <div className={`text-sm font-black uppercase truncate leading-tight ${activeCorner === "RED" ? "text-[#ef4444]" : "text-[#38bdf8]"}`}>
                  {athleteName}
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="text-xs font-black text-[#f59e0b] uppercase tracking-wider">
                  {categoryRightBadge}
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* Tablet / Phone Landscape Single-Row Header */
          <div className="shrink-0 grid grid-cols-3 items-center gap-2 pb-1 border-b border-[#0e1c3c]">
            <div className="flex items-center gap-1.5 min-w-0">
              {onBackToLanding && (
                <button
                  type="button"
                  onClick={onBackToLanding}
                  className="p-1.5 rounded-lg bg-[#091430] border border-[#172b58] text-slate-300 active:scale-95 cursor-pointer shrink-0"
                  title="Kembali ke Menu Utama"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
              )}
              <div className="min-w-0">
                <div className="text-[10px] text-[#8899b0] font-bold uppercase truncate leading-none">
                  {contingent}
                </div>
                <div className={`text-xs sm:text-sm font-black uppercase truncate leading-tight mt-0.5 ${activeCorner === "RED" ? "text-[#ef4444]" : "text-[#38bdf8]"}`}>
                  {athleteName}
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center min-w-0">
              {activeCorner === "BLUE" ? (
                <div className="px-4 py-0.5 rounded bg-[#1860ec] text-white font-black text-[10px] sm:text-xs tracking-widest uppercase shadow-[0_0_12px_rgba(24,96,236,0.6)] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-300 animate-pulse" />
                  <span>SUDUT BIRU</span>
                </div>
              ) : (
                <div className="px-4 py-0.5 rounded bg-[#dc2626] text-white font-black text-[10px] sm:text-xs tracking-widest uppercase shadow-[0_0_12px_rgba(220,38,38,0.6)] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-300 animate-pulse" />
                  <span>SUDUT MERAH</span>
                </div>
              )}
              <div className="text-[9px] sm:text-[10px] font-bold text-slate-300 uppercase tracking-wider truncate mt-0.5">
                {categoryRightBadge}
              </div>
            </div>

            <div className="flex items-center justify-end gap-1.5 min-w-0">
              <div className="text-right min-w-0 hidden sm:block">
                <div className="text-[10px] text-[#8899b0] font-bold uppercase truncate leading-none">
                  GLG {state.gelanggang || "1"} • PARTAI {state.partai || "1"}
                </div>
                <div className="text-xs font-black text-[#f59e0b] uppercase truncate mt-0.5">
                  {categoryRightBadge}
                </div>
              </div>
              <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#08122c] border border-amber-500/50 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-[10px] sm:text-xs font-mono font-black text-amber-300 uppercase">
                  JURI {judgeId}
                </span>
              </div>
              {onToggleFullscreen && (
                <button
                  type="button"
                  onClick={onToggleFullscreen}
                  className="p-1.5 rounded-lg bg-[#091430] border border-[#172b58] text-slate-300 active:scale-95 cursor-pointer shrink-0"
                  title="Layar Penuh"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* 3 SLIDER PENILAIAN KIRI-KANAN (OTOMATIS MUAT PENUH DI LAYAR) */}
        <div className={`flex-1 min-h-0 flex flex-col justify-evenly ${isCompactLandscape ? "gap-1 py-1" : "gap-2 py-1.5 sm:gap-3 sm:py-2.5"}`}>
          <AspectTouchSlider
            title={firstAspectTitle}
            value={techniqueScore}
            accent="cyan"
            disabled={currentJudge.isSubmitted}
            compactLandscape={isCompactLandscape}
            onChange={(val) => handleSliderChange("serangBelaScore", val)}
          />

          <AspectTouchSlider
            title="KEMANTAPAN & HARMONISASI"
            value={firmnessScore}
            accent="amber"
            disabled={currentJudge.isSubmitted}
            compactLandscape={isCompactLandscape}
            onChange={(val) => handleSliderChange("kemantapanScore", val)}
          />

          <AspectTouchSlider
            title="PENJIWAAN & PENGHAYATAN"
            value={soulfulnessScore}
            accent="cyan"
            disabled={currentJudge.isSubmitted}
            compactLandscape={isCompactLandscape}
            onChange={(val) => handleSliderChange("penjiwaanScore", val)}
          />
        </div>

        {/* BOTTOM FOOTER: KOMBINASI + TOTAL AKUMULASI + TOMBOL KIRIM & KUNCI */}
        <div className={`shrink-0 border-t border-[#142344] bg-[#020512] rounded-xl px-3 ${isCompactLandscape ? "py-1.5" : "py-2 sm:py-2.5"} flex items-center justify-between gap-2 shadow-inner`}>
          <div className="flex items-center gap-3 sm:gap-5 min-w-0">
            <div className="flex flex-col leading-tight shrink-0">
              <span className="text-[9px] sm:text-[10px] font-mono font-bold text-slate-400 uppercase">
                KOMBINASI
              </span>
              <span className="text-sm sm:text-lg font-mono font-black text-[#38bdf8]">
                +{combinedScore.toFixed(2)}
              </span>
            </div>

            <div className="w-[1px] h-7 bg-[#16274e] shrink-0" />

            <div className="flex flex-col leading-tight min-w-0">
              <span className="text-[9px] sm:text-[10px] font-sans font-black text-[#f59e0b] uppercase tracking-wider truncate">
                TOTAL JURI {judgeId}
              </span>
              <span className="text-xl sm:text-3xl font-mono font-black text-[#f59e0b] drop-shadow-[0_0_12px_rgba(245,158,11,0.55)] leading-none">
                {totalAccumulation.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="shrink-0">
            {currentJudge.isSubmitted ? (
              <span className="px-3 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-400/40 text-[10px] sm:text-xs font-mono font-black uppercase flex items-center gap-1.5 shadow-[0_0_12px_rgba(16,185,129,0.25)]">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <span>TERKUNCI (SAH)</span>
              </span>
            ) : (
              <button
                type="button"
                onClick={handleSubmitScore}
                className="px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-[11px] sm:text-xs font-mono font-black uppercase flex items-center gap-1.5 cursor-pointer shadow-[0_0_14px_rgba(16,185,129,0.45)] transition-all touch-manipulation"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Kirim &amp; Kunci</span>
              </button>
            )}
          </div>
        </div>

        {/* TOAST NOTIFIKASI */}
        {submittedMessage && (
          <div className="fixed top-12 left-1/2 -translate-x-1/2 bg-emerald-600 text-white px-4 py-2 rounded-xl shadow-2xl border border-emerald-300 flex items-center gap-2 z-50 font-bold text-[11px] uppercase whitespace-nowrap">
            <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
            <span>{submittedMessage}</span>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // TAMPILAN DESKTOP / LAPTOP BESAR (30 TOMBOL TUNING)
  // =========================================================================
  return (
    <div 
      className="bg-[#030716] text-slate-100 flex flex-col justify-between font-sans select-none p-2 sm:p-4 relative overflow-x-auto min-h-screen"
      style={{ minHeight: "100dvh" }}
    >
      <div className="w-full max-w-[1440px] mx-auto flex flex-col justify-between flex-1">
        
        {/* TOP BAR: HEADER */}
        <div className="grid grid-cols-3 items-center gap-2 mb-3 px-1 pt-1 shrink-0">
          
          {/* KOLOM KIRI: KONTINGEN (ATAS) & NAMA ATLIT (BAWAH) */}
          <div className="flex flex-col justify-center text-left min-w-0">
            <div className="flex items-center gap-1.5">
              {onBackToLanding && (
                <button
                  type="button"
                  onClick={onBackToLanding}
                  className="p-1 -ml-1 text-slate-500 hover:text-white rounded transition-colors cursor-pointer"
                  title="Kembali ke Menu Utama"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
              )}
              <span className="text-[11px] sm:text-xs font-sans text-[#8899b0] font-bold uppercase tracking-wider truncate">
                {contingent}
              </span>
            </div>
            <span className={`text-base sm:text-lg md:text-xl font-sans font-black uppercase tracking-wide truncate ${activeCorner === "RED" ? "text-[#ef4444]" : "text-[#38bdf8]"}`}>
              {athleteName}
            </span>
          </div>

          {/* KOLOM TENGAH: BADGE SUDUT AKTIF & JUDUL KATEGORI */}
          <div className="flex flex-col items-center justify-center">
            <div className="mb-1.5">
              {activeCorner === "BLUE" ? (
                <div className="px-6 sm:px-8 py-1 rounded bg-[#1860ec] text-white font-sans font-black text-xs sm:text-sm tracking-widest uppercase shadow-[0_0_15px_rgba(24,96,236,0.6)] flex items-center justify-center gap-1.5 select-none">
                  <span className="w-2 h-2 rounded-full bg-cyan-300 animate-pulse" />
                  <span>SUDUT BIRU</span>
                </div>
              ) : (
                <div className="px-6 sm:px-8 py-1 rounded bg-[#dc2626] text-white font-sans font-black text-xs sm:text-sm tracking-widest uppercase shadow-[0_0_15px_rgba(220,38,38,0.6)] flex items-center justify-center gap-1.5 select-none">
                  <span className="w-2 h-2 rounded-full bg-amber-300 animate-pulse" />
                  <span>SUDUT MERAH</span>
                </div>
              )}
            </div>

            <div className="w-full text-center">
              <span className="text-[10px] sm:text-xs md:text-sm font-sans font-bold text-slate-200 tracking-[0.2em] uppercase">
                {categoryTitle}
              </span>
            </div>
          </div>

          {/* KOLOM KANAN: GELANGGANG/PARTAI & BADGE KATEGORI */}
          <div className="flex flex-col justify-center text-right min-w-0">
            <div className="flex items-center justify-end gap-1.5">
              <div className="flex items-center gap-1.5 mr-2 px-2.5 py-1 rounded-lg bg-[#08122c] border border-amber-500/50 shadow-sm shrink-0">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
                <span className="text-xs font-mono font-black text-amber-300 uppercase tracking-wider">
                  JURI {judgeId}
                </span>
              </div>

              {onToggleFullscreen && (
                <button
                  type="button"
                  onClick={onToggleFullscreen}
                  className="p-1 text-slate-500 hover:text-white rounded transition-colors cursor-pointer mr-1"
                  title="Layar Penuh"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              )}
              <span className="text-[11px] sm:text-xs font-sans text-[#8899b0] font-bold uppercase tracking-wider truncate">
                GELANGGANG {state.gelanggang || "1"}, Partai {state.partai || "2"}
              </span>
            </div>
            <span className="text-sm sm:text-base md:text-lg font-sans font-black text-[#f59e0b] tracking-wider uppercase truncate">
              {categoryRightBadge}
            </span>
          </div>

        </div>

        {/* TABEL PENILAIAN UTAMA */}
        <div className="flex-1 flex flex-col justify-center my-auto">
          <div className="border border-[#0e1c3c] rounded-xl bg-[#04091a]/95 overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse min-w-[920px]">
                
                {/* TABLE HEADER */}
                <thead>
                  <tr className="border-b border-[#0e1c3c] bg-[#071026]/90 text-[#8899b0]">
                    <th className="w-[20%] py-3.5 px-4 text-left font-sans font-black text-xs uppercase tracking-wider">
                      KATEGORI PENILAIAN
                    </th>
                    <th className="w-[52%] py-3.5 px-4 text-center font-sans font-black text-xs uppercase tracking-wider">
                      KONTROL PENILAIAN (TUNING BUTTONS)
                    </th>
                    <th className="w-[12%] py-3.5 px-4 text-center font-sans font-black text-xs uppercase tracking-wider">
                      NILAI SKOR
                    </th>
                    <th className="w-[16%] py-3.5 px-4 text-center font-sans font-black text-xs uppercase tracking-wider border-l border-[#0e1c3c]">
                      TOTAL SCORE (COMBINED)
                    </th>
                  </tr>
                </thead>

                {/* TABLE BODY */}
                <tbody>
                  
                  {/* BARIS 1: TEKNIK SERANG BELA / TEKNIK GERAKAN (0.01 - 0.30) */}
                  <tr className="border-b border-[#0e1c3c]">
                    <td className="py-4 px-4 align-middle">
                      <div className="font-sans font-black text-xs sm:text-sm text-cyan-400 uppercase tracking-wide leading-tight">
                        {firstAspectTitle}
                      </div>
                      <div className="font-mono font-bold text-[10px] sm:text-xs text-cyan-400/80 mt-1">
                        (0.01 - 0.30)
                      </div>
                    </td>

                    <td className="py-3 px-3 align-middle">
                      <div className="grid grid-cols-10 gap-1.5 sm:gap-2">
                        {TUNING_BUTTON_VALUES.map((val) => {
                          const isSelected = Math.abs(techniqueScore - val) < 0.005;
                          return (
                            <button
                              key={`serang-bela-${val}`}
                              type="button"
                              disabled={currentJudge.isSubmitted}
                              onClick={() => handleSelectTuning("serangBelaScore", val)}
                              className={`py-2 px-1 rounded-lg font-mono font-bold text-xs sm:text-sm transition-all cursor-pointer text-center select-none ${
                                isSelected
                                  ? "bg-cyan-500 text-slate-950 font-black shadow-[0_0_16px_rgba(6,182,212,0.95)] border-2 border-cyan-200 scale-105 z-10"
                                  : "bg-[#0c1735] hover:bg-[#13234d] text-white border border-[#172b58] hover:border-cyan-500/50"
                              } disabled:opacity-40 disabled:cursor-not-allowed`}
                            >
                              {val.toFixed(2)}
                            </button>
                          );
                        })}
                      </div>
                    </td>

                    <td className="py-4 px-3 text-center align-middle">
                      <div className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                        SCORE
                      </div>
                      <div className="text-xl sm:text-2xl md:text-3xl font-mono font-black text-[#38bdf8] drop-shadow-[0_0_12px_rgba(56,189,248,0.7)]">
                        {techniqueScore.toFixed(2)}
                      </div>
                    </td>

                    {/* TOTAL SCORE (COMBINED) - MERENTANG DARI BARIS 1 S/D 3 */}
                    <td rowSpan={3} className="py-6 px-4 text-center align-middle border-l border-[#0e1c3c] bg-[#030716]/80">
                      <div className="flex flex-col items-center justify-center space-y-1">
                        <span className="font-sans font-black text-xs sm:text-sm text-slate-300 uppercase tracking-wider mb-1">
                          TOTAL SCORE
                        </span>
                        <span className="font-mono font-bold text-[11px] sm:text-xs text-slate-400">
                          - Technique
                        </span>
                        <span className="font-mono font-bold text-[11px] sm:text-xs text-slate-400">
                          - Firmness
                        </span>
                        <span className="font-mono font-bold text-[11px] sm:text-xs text-slate-400">
                          - Soulfulness
                        </span>
                        <div className="mt-3 text-2xl sm:text-3xl md:text-4xl font-mono font-black text-[#38bdf8] drop-shadow-[0_0_16px_rgba(56,189,248,0.85)]">
                          {combinedScore.toFixed(2)}
                        </div>
                      </div>
                    </td>
                  </tr>

                  {/* BARIS 2: KEMANTAPAN & HARMONISASI (0.01 - 0.30) */}
                  <tr className="border-b border-[#0e1c3c]">
                    <td className="py-4 px-4 align-middle">
                      <div className="font-sans font-black text-xs sm:text-sm text-amber-400 uppercase tracking-wide leading-tight">
                        KEMANTAPAN & HARMONISASI
                      </div>
                      <div className="font-mono font-bold text-[10px] sm:text-xs text-amber-400/80 mt-1">
                        (0.01 - 0.30)
                      </div>
                    </td>

                    <td className="py-3 px-3 align-middle">
                      <div className="grid grid-cols-10 gap-1.5 sm:gap-2">
                        {TUNING_BUTTON_VALUES.map((val) => {
                          const isSelected = Math.abs(firmnessScore - val) < 0.005;
                          return (
                            <button
                              key={`kemantapan-${val}`}
                              type="button"
                              disabled={currentJudge.isSubmitted}
                              onClick={() => handleSelectTuning("kemantapanScore", val)}
                              className={`py-2 px-1 rounded-lg font-mono font-bold text-xs sm:text-sm transition-all cursor-pointer text-center select-none ${
                                isSelected
                                  ? "bg-[#f59e0b] text-slate-950 font-black shadow-[0_0_16px_rgba(245,158,11,0.95)] border-2 border-amber-200 scale-105 z-10"
                                  : "bg-[#0c1735] hover:bg-[#13234d] text-white border border-[#172b58] hover:border-amber-500/50"
                              } disabled:opacity-40 disabled:cursor-not-allowed`}
                            >
                              {val.toFixed(2)}
                            </button>
                          );
                        })}
                      </div>
                    </td>

                    <td className="py-4 px-3 text-center align-middle">
                      <div className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                        SCORE
                      </div>
                      <div className="text-xl sm:text-2xl md:text-3xl font-mono font-black text-[#f59e0b] drop-shadow-[0_0_12px_rgba(245,158,11,0.7)]">
                        {firmnessScore.toFixed(2)}
                      </div>
                    </td>
                  </tr>

                  {/* BARIS 3: PENJIWAAN & PENGHAYATAN (0.01 - 0.30) */}
                  <tr>
                    <td className="py-4 px-4 align-middle">
                      <div className="font-sans font-black text-xs sm:text-sm text-cyan-400 uppercase tracking-wide leading-tight">
                        PENJIWAAN & PENGHAYATAN
                      </div>
                      <div className="font-mono font-bold text-[10px] sm:text-xs text-cyan-400/80 mt-1">
                        (0.01 - 0.30)
                      </div>
                    </td>

                    <td className="py-3 px-3 align-middle">
                      <div className="grid grid-cols-10 gap-1.5 sm:gap-2">
                        {TUNING_BUTTON_VALUES.map((val) => {
                          const isSelected = Math.abs(soulfulnessScore - val) < 0.005;
                          return (
                            <button
                              key={`penjiwaan-${val}`}
                              type="button"
                              disabled={currentJudge.isSubmitted}
                              onClick={() => handleSelectTuning("penjiwaanScore", val)}
                              className={`py-2 px-1 rounded-lg font-mono font-bold text-xs sm:text-sm transition-all cursor-pointer text-center select-none ${
                                isSelected
                                  ? "bg-cyan-500 text-slate-950 font-black shadow-[0_0_16px_rgba(6,182,212,0.95)] border-2 border-cyan-200 scale-105 z-10"
                                  : "bg-[#0c1735] hover:bg-[#13234d] text-white border border-[#172b58] hover:border-cyan-500/50"
                              } disabled:opacity-40 disabled:cursor-not-allowed`}
                            >
                              {val.toFixed(2)}
                            </button>
                          );
                        })}
                      </div>
                    </td>

                    <td className="py-4 px-3 text-center align-middle">
                      <div className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                        SCORE
                      </div>
                      <div className="text-xl sm:text-2xl md:text-3xl font-mono font-black text-[#38bdf8] drop-shadow-[0_0_12px_rgba(56,189,248,0.7)]">
                        {soulfulnessScore.toFixed(2)}
                      </div>
                    </td>
                  </tr>

                </tbody>
              </table>
            </div>

            {/* BARIS BAWAH: TOTAL AKUMULASI SCORE JURI X & NILAI AKHIR DASAR 9.10 */}
            <div className="border-t border-[#0e1c3c] bg-[#020512] px-6 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="font-sans font-black text-xs sm:text-sm md:text-base text-[#f59e0b] tracking-[0.2em] uppercase">
                  TOTAL AKUMULASI SCORE JURI {judgeId}
                </span>

                {currentJudge.isSubmitted ? (
                  <span className="px-3 py-1 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-400/40 text-[11px] font-mono font-black uppercase flex items-center gap-1.5 shadow-[0_0_12px_rgba(16,185,129,0.3)]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    NILAI TERKIRIM &amp; TERKUNCI (SAH)
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmitScore}
                    className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-mono font-black uppercase flex items-center gap-1.5 cursor-pointer shadow-[0_0_12px_rgba(16,185,129,0.4)] transition-all active:scale-95 ml-2"
                  >
                    <Send className="w-3 h-3" />
                    Kirim &amp; Kunci Nilai
                  </button>
                )}
              </div>

              <div className="font-mono font-black text-2xl sm:text-3xl md:text-4xl text-[#f59e0b] drop-shadow-[0_0_18px_rgba(245,158,11,0.6)]">
                {totalAccumulation.toFixed(2)}
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* TOAST NOTIFIKASI SAAT NILAI BERHASIL DIKIRIM */}
      {submittedMessage && (
        <div className="fixed bottom-6 right-6 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-2xl border-2 border-emerald-300 flex items-center gap-2 animate-bounce z-50 font-bold text-xs uppercase">
          <CheckCircle2 className="w-5 h-5 text-white" />
          <span>{submittedMessage}</span>
        </div>
      )}
    </div>
  );
};

export default TgrsGandaSoloJuryPad;
