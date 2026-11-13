import React, { useState, useMemo, useEffect } from 'react';
import { useSilat } from '../context/SilatContext';
import {
  SilatAthlete,
  MatchCategory,
  Gender,
  AgeGroup,
  MatchStage,
  MatchState
} from '../types/silat';
import {
  downloadAthleteTemplateExcel,
  exportAthletesToExcel,
  importAthletesFromExcel
} from '../utils/excelHelper';
import {
  exportBracketToPdf,
  exportScheduleToPdf
} from '../utils/pdfExport';
import {
  getIpsiWeightClasses,
  getDefaultClassGroupForCategory
} from '../utils/ipsiClasses';
import { generateMatchesFromAthletes } from '../utils/scheduleGenerator';
import {
  Users,
  UserPlus,
  FileSpreadsheet,
  Download,
  Upload,
  Trash2,
  Edit2,
  Search,
  X,
  Check,
  Filter,
  Layers,
  Calendar,
  Sparkles,
  GitBranch,
  FileText,
  AlertTriangle,
  Trophy,
  Swords,
  Award,
  CheckCircle2,
  RotateCw,
  BarChart3,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { useScreenAnalyzer } from '../hooks/useScreenAnalyzer';

interface AthleteRegistrationModalProps {
  onClose: () => void;
  initialTab?: 'athletes' | 'bracket' | 'schedule';
}

export const AthleteRegistrationModal: React.FC<AthleteRegistrationModalProps> = ({
  onClose,
  initialTab = 'athletes'
}) => {
  const screen = useScreenAnalyzer();
  const {
    athletes,
    matches,
    config,
    addOrUpdateAthlete,
    bulkAddAthletes,
    deleteAthlete,
    clearAllAthletes,
    setAllMatches
  } = useSilat();

  const [activeTab, setActiveTab] = useState<'athletes' | 'bracket' | 'schedule'>(initialTab);

  // Tab 1: Atlet Form & Search States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenderFilter, setSelectedGenderFilter] = useState<'ALL' | 'PUTRA' | 'PUTRI'>('ALL');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formName, setFormName] = useState('');
  const [formContingent, setFormContingent] = useState('');
  const [formGender, setFormGender] = useState<Gender>('PUTRA');
  const [formCategory, setFormCategory] = useState<MatchCategory>('TANDING');
  const [formClassGroup, setFormClassGroup] = useState('Kelas C (55-60 kg)');
  const [formWeight, setFormWeight] = useState<number>(58);
  const [formAgeGroup, setFormAgeGroup] = useState<AgeGroup>('DEWASA');
  const [formTeamMembers, setFormTeamMembers] = useState('');
  const [formArena, setFormArena] = useState('GELANGGANG A');

  // Toast & Modal Confirmation States (Bypasses any iframe alert/confirm blockages)
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [athleteToDelete, setAthleteToDelete] = useState<SilatAthlete | null>(null);

  // Outer scroll container ref & kontrol scroll layar
  const outerScrollRef = React.useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const el = outerScrollRef.current;
    if (!el) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      const maxScroll = scrollHeight - clientHeight;
      const progress = maxScroll > 0 ? (scrollTop / maxScroll) * 100 : 0;
      setScrollProgress(Math.min(100, Math.max(0, progress)));
    };

    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    // 1. Scroll outer container to top
    if (outerScrollRef.current) {
      outerScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
    // 2. Also scroll any inner scrollable containers to top
    const inners = document.querySelectorAll('.custom-inner-scrollbar');
    inners.forEach((container) => {
      try {
        container.scrollTo({ top: 0, behavior: 'smooth' });
      } catch {}
    });
    // 3. Scroll window fallback
    try {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {}
  };

  const scrollToBottom = () => {
    if (outerScrollRef.current) {
      outerScrollRef.current.scrollTo({
        top: outerScrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  // IPSI 2026 & PERSILAT Dynamic Weight Classes
  const currentIpsiClasses = useMemo(() => {
    return getIpsiWeightClasses(formAgeGroup, formGender);
  }, [formAgeGroup, formGender]);

  const activeClassObj = useMemo(() => {
    return currentIpsiClasses.find((c) => c.label === formClassGroup) || currentIpsiClasses[0];
  }, [currentIpsiClasses, formClassGroup]);

  const handleCategoryChange = (cat: MatchCategory) => {
    setFormCategory(cat);
    if (cat === 'TANDING') {
      const classes = getIpsiWeightClasses(formAgeGroup, formGender);
      const matched = classes.find((c) => c.label === formClassGroup) || classes.find((c) => c.id === 'C') || classes[0];
      setFormClassGroup(matched.label);
      setFormWeight(matched.defaultWeight);
    } else {
      setFormClassGroup(getDefaultClassGroupForCategory(cat, formAgeGroup, formGender));
      setFormWeight(0);
    }
  };

  const handleGenderChange = (gen: Gender) => {
    setFormGender(gen);
    if (formCategory === 'TANDING') {
      const classes = getIpsiWeightClasses(formAgeGroup, gen);
      const code = formClassGroup.match(/Kelas ([A-L]|Bebas)/i)?.[1]?.toUpperCase();
      const matched = classes.find((c) => c.id === code) || classes.find((c) => c.id === 'C') || classes[0];
      setFormClassGroup(matched.label);
      setFormWeight(matched.defaultWeight);
    }
  };

  const handleAgeGroupChange = (age: AgeGroup) => {
    setFormAgeGroup(age);
    if (formCategory === 'TANDING') {
      const classes = getIpsiWeightClasses(age, formGender);
      const code = formClassGroup.match(/Kelas ([A-L]|Bebas)/i)?.[1]?.toUpperCase();
      const matched = classes.find((c) => c.id === code) || classes.find((c) => c.id === 'C') || classes[0];
      setFormClassGroup(matched.label);
      setFormWeight(matched.defaultWeight);
    }
  };

  const handleClassGroupChange = (newClassLabel: string) => {
    setFormClassGroup(newClassLabel);
    const classes = getIpsiWeightClasses(formAgeGroup, formGender);
    const matched = classes.find((c) => c.label === newClassLabel);
    if (matched) {
      setFormWeight(matched.defaultWeight);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setIsEditing(false);
    setFormName('');
    setFormContingent('');
    setFormTeamMembers('');
    setFormCategory('TANDING');
    setFormGender('PUTRA');
    setFormAgeGroup('DEWASA');
    const classes = getIpsiWeightClasses('DEWASA', 'PUTRA');
    const defaultClass = classes.find((c) => c.id === 'C') || classes[0];
    setFormClassGroup(defaultClass.label);
    setFormWeight(defaultClass.defaultWeight);
    setFormArena('GELANGGANG A');
  };

  // Handle Form Submit
  const handleSaveAthlete = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formContingent.trim()) return;

    const finalClassGroup = formCategory === 'TANDING'
      ? formClassGroup.trim()
      : getDefaultClassGroupForCategory(formCategory, formAgeGroup, formGender);

    const athlete: SilatAthlete = {
      id: editingId || `ath-${Date.now()}`,
      name: formName.trim(),
      contingent: formContingent.trim(),
      gender: formGender,
      category: formCategory,
      classGroup: finalClassGroup,
      weight: formCategory === 'TANDING' && formWeight > 0 ? Number(formWeight) : undefined,
      ageGroup: formAgeGroup,
      arena: formArena || 'GELANGGANG A',
      gelanggang: formArena || 'GELANGGANG A',
      teamMembers: (formCategory === 'JURUS_GANDA' || formCategory === 'JURUS_REGU') && formTeamMembers.trim()
        ? formTeamMembers.split(',').map((s) => s.trim()).filter(Boolean)
        : undefined
    };

    addOrUpdateAthlete(athlete);
    const savedName = athlete.name;
    const wasEdit = isEditing;
    handleCancelEdit();
    setSelectedBracketClass(`${athlete.category} - ${athlete.classGroup} (${athlete.gender})`);
    setToastMessage(wasEdit ? `Data atlet "${savedName}" berhasil diperbarui!` : `Atlet "${savedName}" berhasil didaftarkan dan langsung tersinkron ke bagan & jadwal!`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleOpenEdit = (athlete: SilatAthlete) => {
    setEditingId(athlete.id);
    setFormName(athlete.name);
    setFormContingent(athlete.contingent);
    setFormGender(athlete.gender);
    setFormCategory(athlete.category);
    setFormAgeGroup(athlete.ageGroup);
    setFormClassGroup(athlete.classGroup);
    setFormWeight(athlete.weight || 0);
    setFormArena(athlete.arena || athlete.gelanggang || 'GELANGGANG A');
    setFormTeamMembers(athlete.teamMembers ? athlete.teamMembers.join(', ') : '');
    setIsEditing(true);
  };

  // Excel Handlers
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const imported = await importAthletesFromExcel(file);
      bulkAddAthletes(imported);
      if (imported.length > 0) {
        setSelectedBracketClass(`${imported[0].category} - ${imported[0].classGroup} (${imported[0].gender})`);
      }
      setToastMessage(`Berhasil mengimpor ${imported.length} data atlet secara massal dan tersinkron ke bagan & jadwal!`);
      setTimeout(() => setToastMessage(null), 3500);
    } catch (err: any) {
      setToastMessage(`Gagal mengimpor file: ${err.message || 'Format tidak valid'}`);
      setTimeout(() => setToastMessage(null), 4000);
    }
    e.target.value = '';
  };

  const handleClearAll = () => {
    setShowClearConfirm(true);
  };

  const confirmClearAll = () => {
    clearAllAthletes();
    setShowClearConfirm(false);
    if (isEditing) {
      handleCancelEdit();
    }
    setSelectedBracketClass('');
    setToastMessage('Semua data atlet, bagan braket, dan jadwal pertandingan berhasil dikosongkan!');
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleRequestDelete = (ath: SilatAthlete) => {
    setAthleteToDelete(ath);
  };

  const confirmDeleteAthlete = () => {
    if (!athleteToDelete) return;
    deleteAthlete(athleteToDelete.id);
    if (editingId === athleteToDelete.id) {
      handleCancelEdit();
    }
    const deletedName = athleteToDelete.name;
    setAthleteToDelete(null);
    setToastMessage(`Data atlet "${deletedName}" berhasil dihapus.`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Tab 2: Bracket States
  const [bracketCategory, setBracketCategory] = useState<'PEMASALAN' | 'PRESTASI'>('PEMASALAN');
  const [pemasalanFormat, setPemasalanFormat] = useState<'SEMIFINAL' | 'FINAL'>('SEMIFINAL');
  const [prestasiFormat, setPrestasiFormat] = useState<'SINGLE_POOL' | 'POOL_AB'>('SINGLE_POOL');
  const [selectedBracketClass, setSelectedBracketClass] = useState<string>('');
  const [bracketSyncMsg, setBracketSyncMsg] = useState<string>('');

  // Tab 3: Schedule States
  const [generatedSuccessMsg, setGeneratedSuccessMsg] = useState('');

  // Filtered Athletes (Mendukung Pemisahan Kategori Putra & Putri serta Jenis Jurus)
  const filteredAthletes = athletes.filter((ath) => {
    const matchesSearch =
      ath.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ath.contingent.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ath.classGroup.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ath.gender.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGender = selectedGenderFilter === 'ALL' || ath.gender === selectedGenderFilter;
    const matchesCat = selectedCategoryFilter === 'ALL' || ath.category === selectedCategoryFilter;
    return matchesSearch && matchesGender && matchesCat;
  });

  // Extract unique classes for bracket selector (Memoized to prevent unnecessary recomputations)
  const availableClasses = useMemo(() => {
    return Array.from(new Set(athletes.map((a) => `${a.category} - ${a.classGroup} (${a.gender})`)));
  }, [athletes]);

  // Otomatis sinkronkan kelas bagan terpilih ketika daftar atlet bertambah atau berkurang
  useEffect(() => {
    if (availableClasses.length > 0) {
      if (!selectedBracketClass || !availableClasses.includes(selectedBracketClass)) {
        setSelectedBracketClass(availableClasses[0]);
      }
    } else {
      setSelectedBracketClass('');
    }
  }, [availableClasses, selectedBracketClass]);

  // Selected or default active class
  const activeBracketClass = selectedBracketClass && availableClasses.includes(selectedBracketClass)
    ? selectedBracketClass
    : (availableClasses.length > 0 ? availableClasses[0] : '');

  // Generate Bracket Automatically according to IPSI 2026 & PERSILAT Regulations (Pure Memoized Computation)
  // Ketika atlet kosong, bagan strictly kosong ([]), tidak menampilkan atlet bayangan
  const bracketMatches = useMemo(() => {
    if (!activeBracketClass || athletes.length === 0) return [];

    const matchedAthletes = athletes.filter((a) => `${a.category} - ${a.classGroup} (${a.gender})` === activeBracketClass);

    // Deteksi apakah Kategori Tanding atau Jurus Seni
    const isJurusCategory = activeBracketClass.startsWith('JURUS_') || activeBracketClass.startsWith('SOLO_');
    const categoryName = activeBracketClass.split(' - ')[0] as MatchCategory;
    const classDetail = activeBracketClass.split(' - ')[1] || 'Kelas Silat';
    const classGender: Gender = activeBracketClass.includes('(PUTRI)') || activeBracketClass.includes('PUTRI') ? 'PUTRI' : 'PUTRA';
    const cleanClassGroup = classDetail.replace(/\s*\(.*\)/, '').trim();

    // Helper untuk mengambil atlet terdaftar atau fallback pesilat placeholder
    // STRICT RULE: Hanya ambil atlet yang PERSIS sama Kategori & Gender. JANGAN PERNAH campur Putra & Putri atau Tunggal & Ganda!
    const getAthlete = (index: number, fallbackLabel: string) => {
      if (matchedAthletes[index]) return matchedAthletes[index];
      
      const placeholderCategory = categoryName || (isJurusCategory ? 'JURUS_TUNGGAL' : 'TANDING');
      return {
        id: `ath-bracket-${placeholderCategory}-${classGender}-${index + 1}`,
        name: `${fallbackLabel} (${classGender})`,
        contingent: `Kontingen ${String.fromCharCode(65 + index)}`,
        category: placeholderCategory,
        gender: classGender,
        classGroup: cleanClassGroup,
        ageGroup: 'DEWASA' as AgeGroup,
        teamMembers: placeholderCategory === 'JURUS_GANDA'
          ? [`Atlet 1 (${classGender})`, `Atlet 2 (${classGender})`]
          : placeholderCategory === 'JURUS_REGU'
          ? [`Atlet 1 (${classGender})`, `Atlet 2 (${classGender})`, `Atlet 3 (${classGender})`]
          : undefined
      } as SilatAthlete;
    };

    const generated: any[] = [];

    if (bracketCategory === 'PEMASALAN') {
      if (pemasalanFormat === 'SEMIFINAL') {
        // FORMAT PEMASALAN SEMIFINAL: 4 ATLET, 4 PARTAI
        // Semifinal 1 & 2 -> Perebutan Juara 3 -> Babak Final (Juara 1, 2, 3 Tanpa Juara 3 Bersama)
        const a1 = getAthlete(0, 'Pesilat Merah SF1');
        const a2 = getAthlete(1, 'Pesilat Biru SF1');
        const a3 = getAthlete(2, 'Pesilat Merah SF2');
        const a4 = getAthlete(3, 'Pesilat Biru SF2');

        generated.push({
          id: 'b-pem-sf1',
          matchNumber: 1,
          round: 1,
          stage: 'SEMI_FINAL',
          roundName: isJurusCategory ? 'Semifinal 1 (Jurus Seni - Pemasalan)' : 'Semifinal 1 (Tanding - Pemasalan)',
          category: categoryName,
          isJurus: isJurusCategory,
          athlete1: a1,
          athlete2: a2,
          awardNote: 'Pemenang: Lolos Final | Kalah: Masuk Perebutan Juara 3',
          winner: null
        });

        generated.push({
          id: 'b-pem-sf2',
          matchNumber: 2,
          round: 1,
          stage: 'SEMI_FINAL',
          roundName: isJurusCategory ? 'Semifinal 2 (Jurus Seni - Pemasalan)' : 'Semifinal 2 (Tanding - Pemasalan)',
          category: categoryName,
          isJurus: isJurusCategory,
          athlete1: a3,
          athlete2: a4,
          awardNote: 'Pemenang: Lolos Final | Kalah: Masuk Perebutan Juara 3',
          winner: null
        });

        // Perebutan Juara 3 (Playoff Tempat Ketiga - Tanpa Juara 3 Bersama)
        generated.push({
          id: 'b-pem-p3',
          matchNumber: 3,
          round: 2,
          stage: 'PEREBUTAN_JUARA_3',
          roundName: isJurusCategory ? 'Perebutan Juara 3 (Jurus Seni - Pemasalan)' : 'Perebutan Juara 3 (Tanding - Pemasalan)',
          category: categoryName,
          isJurus: isJurusCategory,
          athlete1: {
            name: `Kalah SF 1 (${a1.name})`,
            contingent: a1.contingent,
            category: categoryName,
            gender: classGender,
            teamMembers: a1.teamMembers
          },
          athlete2: {
            name: `Kalah SF 2 (${a3.name})`,
            contingent: a3.contingent,
            category: categoryName,
            gender: classGender,
            teamMembers: a3.teamMembers
          },
          awardNote: 'Memperebutkan: Juara 3 (Medali Perunggu Tunggal) - Tanpa Juara 3 Bersama',
          winner: null
        });

        // Babak Final (Juara 1 & 2)
        generated.push({
          id: 'b-pem-fn',
          matchNumber: 4,
          round: 2,
          stage: 'FINAL',
          roundName: isJurusCategory ? 'Babak Final (Jurus Seni - Pemasalan)' : 'Babak Final (Tanding - Pemasalan)',
          category: categoryName,
          isJurus: isJurusCategory,
          athlete1: {
            name: `Pemenang Semifinal 1 (${a1.name})`,
            contingent: a1.contingent,
            category: categoryName,
            gender: classGender,
            teamMembers: a1.teamMembers
          },
          athlete2: {
            name: `Pemenang Semifinal 2 (${a3.name})`,
            contingent: a3.contingent,
            category: categoryName,
            gender: classGender,
            teamMembers: a3.teamMembers
          },
          awardNote: 'Memperebutkan: Juara 1 (Medali Emas) & Juara 2 (Medali Perak)',
          winner: null
        });
      } else {
        // FORMAT PEMASALAN FINAL: 2 ATLET, 1 PARTAI
        const a1 = getAthlete(0, 'Pesilat Merah Final');
        const a2 = getAthlete(1, 'Pesilat Biru Final');

        generated.push({
          id: 'b-pem-fn-only',
          matchNumber: 1,
          round: 1,
          stage: 'FINAL',
          roundName: isJurusCategory ? 'Babak Final (Jurus Seni - Pemasalan)' : 'Babak Final (Tanding - Pemasalan)',
          category: categoryName,
          isJurus: isJurusCategory,
          athlete1: a1,
          athlete2: a2,
          awardNote: 'Memperebutkan: Juara 1 (Medali Emas) & Juara 2 (Medali Perak)',
          winner: null
        });
      }
    } else {
      // FORMAT PRESTASI (SISTEM GUGUR: PENYISIHAN -> SEMIFINAL -> PEREBUTAN JUARA 3 -> FINAL)
      if (prestasiFormat === 'SINGLE_POOL') {
        const effectiveCount = Math.max(matchedAthletes.length, 4);

        if (effectiveCount <= 2) {
          const a1 = getAthlete(0, 'Pesilat Merah');
          const a2 = getAthlete(1, 'Pesilat Biru');
          generated.push({
            id: 'b-pres-fn-single',
            matchNumber: 1,
            round: 1,
            stage: 'FINAL',
            roundName: isJurusCategory ? 'Babak Final Prestasi (Jurus Seni)' : 'Babak Final Prestasi (Tanding)',
            category: categoryName,
            isJurus: isJurusCategory,
            athlete1: a1,
            athlete2: a2,
            awardNote: 'Memperebutkan: Juara 1 (Medali Emas) & Juara 2 (Medali Perak)',
            winner: null
          });
        } else if (effectiveCount <= 4) {
          const a1 = getAthlete(0, 'Pesilat Merah SF1');
          const a2 = getAthlete(1, 'Pesilat Biru SF1');
          const a3 = getAthlete(2, 'Pesilat Merah SF2');
          const a4 = getAthlete(3, 'Pesilat Biru SF2');

          generated.push({
            id: 'b-pres-sf1',
            matchNumber: 1,
            round: 1,
            stage: 'SEMI_FINAL',
            roundName: isJurusCategory ? 'Semifinal 1 (Jurus Seni)' : 'Semifinal 1 (Tanding)',
            category: categoryName,
            isJurus: isJurusCategory,
            athlete1: a1,
            athlete2: a2,
            awardNote: 'Pemenang ke Final | Kalah: Partai Perebutan Juara 3',
            winner: null
          });

          generated.push({
            id: 'b-pres-sf2',
            matchNumber: 2,
            round: 1,
            stage: 'SEMI_FINAL',
            roundName: isJurusCategory ? 'Semifinal 2 (Jurus Seni)' : 'Semifinal 2 (Tanding)',
            category: categoryName,
            isJurus: isJurusCategory,
            athlete1: a3,
            athlete2: a4,
            awardNote: 'Pemenang ke Final | Kalah: Partai Perebutan Juara 3',
            winner: null
          });

          // PEREBUTAN JUARA 3
          generated.push({
            id: 'b-pres-p3-single',
            matchNumber: 3,
            round: 2,
            stage: 'PEREBUTAN_JUARA_3',
            roundName: isJurusCategory ? 'Perebutan Juara 3 (Jurus Seni)' : 'Perebutan Juara 3 (Tanding)',
            category: categoryName,
            isJurus: isJurusCategory,
            athlete1: { name: `Kalah SF 1 (${a1.name})`, contingent: a1.contingent, category: categoryName, gender: classGender, teamMembers: a1.teamMembers },
            athlete2: { name: `Kalah SF 2 (${a3.name})`, contingent: a3.contingent, category: categoryName, gender: classGender, teamMembers: a3.teamMembers },
            awardNote: 'Memperebutkan: Juara 3 (Medali Perunggu Tunggal) - Tanpa Juara 3 Bersama',
            winner: null
          });

          generated.push({
            id: 'b-pres-final-single',
            matchNumber: 4,
            round: 2,
            stage: 'FINAL',
            roundName: isJurusCategory ? 'Grand Final Prestasi (Jurus Seni)' : 'Grand Final Prestasi (Tanding)',
            category: categoryName,
            isJurus: isJurusCategory,
            athlete1: { name: `Pemenang SF 1 (${a1.name})`, contingent: a1.contingent, category: categoryName, gender: classGender, teamMembers: a1.teamMembers },
            athlete2: { name: `Pemenang SF 2 (${a3.name})`, contingent: a3.contingent, category: categoryName, gender: classGender, teamMembers: a3.teamMembers },
            awardNote: 'Memperebutkan: Juara 1 (Medali Emas) & Juara 2 (Medali Perak)',
            winner: null
          });
        } else {
          // SISTEM GUGUR DIMULAI DARI BABAK PENYISIHAN (4 Partai Penyisihan -> 2 Semifinal -> Perebutan Juara 3 -> Grand Final)
          for (let i = 0; i < 4; i++) {
            const athA = getAthlete(i * 2, `Pesilat Merah Penyisihan ${i + 1}`);
            const athB = getAthlete(i * 2 + 1, `Pesilat Biru Penyisihan ${i + 1}`);
            generated.push({
              id: `b-pres-penyisihan-${i + 1}`,
              matchNumber: i + 1,
              round: 1,
              stage: 'PENYISIHAN',
              roundName: `Babak Penyisihan ${i + 1} (${isJurusCategory ? 'Jurus Seni' : 'Tanding'})`,
              category: categoryName,
              isJurus: isJurusCategory,
              athlete1: athA,
              athlete2: athB,
              awardNote: 'Pemenang lolos ke Babak Semifinal',
              winner: null
            });
          }

          generated.push({
            id: 'b-pres-sf1-8',
            matchNumber: 5,
            round: 2,
            stage: 'SEMI_FINAL',
            roundName: `Semifinal 1 (${isJurusCategory ? 'Jurus Seni' : 'Tanding'})`,
            category: categoryName,
            isJurus: isJurusCategory,
            athlete1: { name: 'Pemenang Penyisihan 1', contingent: 'Pool Atas', category: categoryName, gender: classGender },
            athlete2: { name: 'Pemenang Penyisihan 2', contingent: 'Pool Atas', category: categoryName, gender: classGender },
            awardNote: 'Pemenang ke Final | Kalah ke Partai Perebutan Juara 3',
            winner: null
          });

          generated.push({
            id: 'b-pres-sf2-8',
            matchNumber: 6,
            round: 2,
            stage: 'SEMI_FINAL',
            roundName: `Semifinal 2 (${isJurusCategory ? 'Jurus Seni' : 'Tanding'})`,
            category: categoryName,
            isJurus: isJurusCategory,
            athlete1: { name: 'Pemenang Penyisihan 3', contingent: 'Pool Bawah', category: categoryName, gender: classGender },
            athlete2: { name: 'Pemenang Penyisihan 4', contingent: 'Pool Bawah', category: categoryName, gender: classGender },
            awardNote: 'Pemenang ke Final | Kalah ke Partai Perebutan Juara 3',
            winner: null
          });

          // PARTAI PEREBUTAN JUARA 3 (TEMPAT KETIGA)
          generated.push({
            id: 'b-pres-p3-8',
            matchNumber: 7,
            round: 3,
            stage: 'PEREBUTAN_JUARA_3',
            roundName: `Perebutan Juara 3 (${isJurusCategory ? 'Jurus Seni' : 'Tanding'})`,
            category: categoryName,
            isJurus: isJurusCategory,
            athlete1: { name: 'Kalah Semifinal 1', contingent: 'Pool Atas', category: categoryName, gender: classGender },
            athlete2: { name: 'Kalah Semifinal 2', contingent: 'Pool Bawah', category: categoryName, gender: classGender },
            awardNote: 'Memperebutkan Juara 3 (Medali Perunggu Tunggal) - Tanpa Juara 3 Bersama',
            winner: null
          });

          // PARTAI GRAND FINAL (JUARA 1 & 2)
          generated.push({
            id: 'b-pres-fn-8',
            matchNumber: 8,
            round: 3,
            stage: 'FINAL',
            roundName: `Grand Final Sistem Gugur (${isJurusCategory ? 'Jurus Seni' : 'Tanding'})`,
            category: categoryName,
            isJurus: isJurusCategory,
            athlete1: { name: 'Pemenang Semifinal 1', contingent: 'Pool Atas', category: categoryName, gender: classGender },
            athlete2: { name: 'Pemenang Semifinal 2', contingent: 'Pool Bawah', category: categoryName, gender: classGender },
            awardNote: 'Memperebutkan Juara 1 (Medali Emas) & Juara 2 (Medali Perak)',
            winner: null
          });
        }
      } else {
        // PRESTASI: POOL A & POOL B
        const a1 = getAthlete(0, 'Pesilat Merah Pool A');
        const a2 = getAthlete(1, 'Pesilat Biru Pool A');
        const a3 = getAthlete(2, 'Pesilat Merah Pool B');
        const a4 = getAthlete(3, 'Pesilat Biru Pool B');

        generated.push({
          id: 'b-pres-pool-a',
          matchNumber: 1,
          round: 1,
          stage: 'SEMI_FINAL',
          roundName: isJurusCategory ? 'Final Pool A / Semifinal 1' : 'Final Pool A / Semifinal 1',
          category: categoryName,
          isJurus: isJurusCategory,
          athlete1: a1,
          athlete2: a2,
          awardNote: 'Pemenang lolos Grand Final | Kalah ke Partai Perebutan Juara 3',
          winner: null
        });

        generated.push({
          id: 'b-pres-pool-b',
          matchNumber: 2,
          round: 1,
          stage: 'SEMI_FINAL',
          roundName: isJurusCategory ? 'Final Pool B / Semifinal 2' : 'Final Pool B / Semifinal 2',
          category: categoryName,
          isJurus: isJurusCategory,
          athlete1: a3,
          athlete2: a4,
          awardNote: 'Pemenang lolos Grand Final | Kalah ke Partai Perebutan Juara 3',
          winner: null
        });

        // PEREBUTAN JUARA 3
        generated.push({
          id: 'b-pres-p3-ab',
          matchNumber: 3,
          round: 2,
          stage: 'PEREBUTAN_JUARA_3',
          roundName: isJurusCategory ? 'Perebutan Juara 3: Runner-up Pool A vs Pool B' : 'Perebutan Juara 3: Runner-up Pool A vs Pool B',
          category: categoryName,
          isJurus: isJurusCategory,
          athlete1: { name: `Kalah Pool A (${a2.name})`, contingent: a2.contingent, category: categoryName, gender: classGender, teamMembers: a2.teamMembers },
          athlete2: { name: `Kalah Pool B (${a4.name})`, contingent: a4.contingent, category: categoryName, gender: classGender, teamMembers: a4.teamMembers },
          awardNote: 'Memperebutkan Juara 3 (Medali Perunggu Tunggal) - Tanpa Juara 3 Bersama',
          winner: null
        });

        // GRAND FINAL
        generated.push({
          id: 'b-pres-grand-ab',
          matchNumber: 4,
          round: 2,
          stage: 'FINAL',
          roundName: isJurusCategory ? 'Grand Final: Juara Pool A vs Juara Pool B' : 'Grand Final: Juara Pool A vs Juara Pool B',
          category: categoryName,
          isJurus: isJurusCategory,
          athlete1: { name: `Juara Pool A (${a1.name})`, contingent: a1.contingent, category: categoryName, gender: classGender, teamMembers: a1.teamMembers },
          athlete2: { name: `Juara Pool B (${a3.name})`, contingent: a3.contingent, category: categoryName, gender: classGender, teamMembers: a3.teamMembers },
          awardNote: 'Memperebutkan Juara 1 (Medali Emas) & Juara 2 (Medali Perak)',
          winner: null
        });
      }
    }

    return generated;
  }, [activeBracketClass, athletes, bracketCategory, pemasalanFormat, prestasiFormat]);

  // Handler Sinkronisasi Bagan Langsung ke Jadwal Partai Turnamen
  const handleSyncBracketToMatches = () => {
    if (bracketMatches.length === 0) return;

    const newMatches: MatchState[] = bracketMatches.map((bm, idx) => {
      const isTanding = !bm.isJurus;
      const duration = isTanding ? config.roundDurationTanding : config.roundDurationSeni;
      const ath1: SilatAthlete = bm.athlete1?.name ? bm.athlete1 : athletes[0];
      const ath2: SilatAthlete = bm.athlete2?.name ? bm.athlete2 : (athletes[1] || athletes[0]);

      return {
        id: `match-bracket-${Date.now()}-${idx + 1}`,
        matchNumber: matches.length + idx + 1,
        arena: config.arenaName,
        category: (bm.category || (isTanding ? 'TANDING' : 'JURUS_TUNGGAL')) as MatchCategory,
        gender: (ath1?.gender || 'PUTRA') as Gender,
        ageGroup: (ath1?.ageGroup || 'DEWASA') as AgeGroup,
        classGroup: ath1?.classGroup || 'Kelas Silat',
        stage: (bm.stage || 'SEMI_FINAL') as MatchStage,
        status: 'PENDING',
        activeRound: 1,
        timer: {
          timeRemaining: duration,
          durationTotal: duration,
          isRunning: false,
          isRest: false,
          restTimeRemaining: 60,
          elapsedTime: 0
        },
        tanding: {
          redAthlete: ath1,
          blueAthlete: ath2,
          redScores: { round1: 0, round2: 0, round3: 0, totalPoints: 0, penalties: [], approvedHits: [] },
          blueScores: { round1: 0, round2: 0, round3: 0, totalPoints: 0, penalties: [], approvedHits: [] },
          currentVotes: [],
          lastActionLog: [`Partai #${matches.length + idx + 1} (${bm.roundName}) dijadwalkan dari Bagan`]
        },
        jurus: {
          performer: ath1,
          juryScores: {
            1: { juryNumber: 1, kebenaranBase: 9.90, kesalahanCount: 0, kebenaranFinal: 9.90, kemantapanScore: 0.05, penaltyDeduction: 0, finalScore: 9.95, isSubmitted: false },
            2: { juryNumber: 2, kebenaranBase: 9.90, kesalahanCount: 0, kebenaranFinal: 9.90, kemantapanScore: 0.05, penaltyDeduction: 0, finalScore: 9.95, isSubmitted: false },
            3: { juryNumber: 3, kebenaranBase: 9.90, kesalahanCount: 0, kebenaranFinal: 9.90, kemantapanScore: 0.05, penaltyDeduction: 0, finalScore: 9.95, isSubmitted: false },
            4: { juryNumber: 4, kebenaranBase: 9.90, kesalahanCount: 0, kebenaranFinal: 9.90, kemantapanScore: 0.05, penaltyDeduction: 0, finalScore: 9.95, isSubmitted: false },
            5: { juryNumber: 5, kebenaranBase: 9.90, kesalahanCount: 0, kebenaranFinal: 9.90, kemantapanScore: 0.05, penaltyDeduction: 0, finalScore: 9.95, isSubmitted: false }
          },
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
    });

    const updated = [...matches, ...newMatches];
    setAllMatches(updated);
    setBracketSyncMsg(`Berhasil menambahkan ${newMatches.length} partai bagan ke jadwal turnamen dan tersinkronisasi ke seluruh panel!`);
    setTimeout(() => setBracketSyncMsg(''), 5000);
  };

  // Generate Schedule Automatically from Registered Athletes
  const handleAutoGenerateSchedule = () => {
    if (athletes.length < 2) {
      alert('Dibutuhkan minimal 2 atlet terdaftar untuk membuat jadwal pertandingan otomatis!');
      return;
    }

    const autoMatches = generateMatchesFromAthletes(athletes, config, matches);
    if (autoMatches.length > 0) {
      setAllMatches(autoMatches);
      setGeneratedSuccessMsg(`Berhasil membuat ${autoMatches.length} jadwal partai pertandingan otomatis dan telah tersinkronisasi ke seluruh panel!`);
      setTimeout(() => setGeneratedSuccessMsg(''), 5000);
    }
  };

  return (
    <div 
      ref={outerScrollRef}
      className="fixed inset-0 z-50 overflow-y-scroll overflow-x-hidden bg-slate-950/85 backdrop-blur-md animate-fade-in custom-outer-scrollbar"
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      <div className="min-h-full w-full flex items-start justify-center p-2 sm:p-4 md:p-6 py-4 sm:py-8">
        <div className={`relative w-full mx-auto bg-[#070e1c] border-2 border-cyan-500/40 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.9)] flex flex-col cyber-glass-deep hud-bracket text-slate-100 ${
          screen.isMobile 
            ? 'max-w-[98vw] min-h-[580px]' 
            : screen.isTablet 
              ? 'max-w-5xl min-h-[620px]' 
              : 'max-w-7xl min-h-[680px]'
        }`}>
          
          {/* Top Header with 3 Tabs */}
          <div className="px-4 sm:px-6 py-2.5 sm:py-3.5 border-b border-cyan-500/30 bg-[#040813]/90 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shrink-0">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-white leading-tight font-mono uppercase tracking-wide">
                  REGISTRASI ATLET & JADWAL TURNAMEN
                </h2>
                <span className="hidden md:inline-block text-[10px] text-cyan-400/80 font-mono">
                  · Layar: {screen.width}×{screen.height} px
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 font-medium">
                Pencak Silat IPSI 2026 | Manajemen Atlet, Bagan Braket, & Jadwal Partai
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              {/* 3 Nav Tabs */}
              <div className="flex items-center bg-[#070e1c] border border-cyan-500/30 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab('athletes')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'athletes'
                    ? 'bg-blue-600 text-white shadow-md glow-blue border border-blue-400'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5 text-blue-300" />
                <span>Tambah Atlet</span>
              </button>

              <button
                onClick={() => setActiveTab('bracket')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'bracket'
                    ? 'bg-amber-500 text-slate-950 shadow-md glow-gold border border-amber-300'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <GitBranch className="w-3.5 h-3.5 text-amber-300" />
                <span>Bagan Braket</span>
              </button>

              <button
                onClick={() => setActiveTab('schedule')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'schedule'
                    ? 'bg-emerald-600 text-white shadow-md glow-emerald border border-emerald-400'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Calendar className="w-3.5 h-3.5 text-emerald-300" />
                <span>Jadwal Pertandingan</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-[#091326] border border-cyan-500/20 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5 text-cyan-400" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="flex-1 min-h-0 p-3 sm:p-4 md:p-5 flex flex-col overflow-y-auto custom-inner-scrollbar">
          
          {/* ================= TAB 1: TAMBAH ATLET (EXACT MATCH TO tambah atlet.JPG) ================= */}
          {activeTab === 'athletes' && (
            <div className="w-full lg:h-full grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5 min-h-0 items-stretch">
              
              {/* SISI KIRI: FORMULIR INPUT / EDIT DATA ATLET (lg:col-span-5) */}
              <div className="lg:col-span-5 bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-100 rounded-2xl p-3.5 sm:p-4 shadow-sm space-y-3 lg:h-full overflow-y-auto shrink-0 flex flex-col justify-between custom-inner-scrollbar">
                
                {/* Header Form */}
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                      <UserPlus className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider font-mono">
                        {isEditing ? 'EDIT DATA ATLET' : 'TAMBAH DATA ATLET BARU'}
                      </h3>
                      <p className="text-[11px] text-slate-500 font-medium">
                        {isEditing ? 'Perbarui informasi pesilat terdaftar' : 'Masukkan data atlet secara manual satu per satu'}
                      </p>
                    </div>
                  </div>

                  {isEditing && (
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="text-xs font-bold text-red-600 hover:text-red-700 dark:text-red-400 px-2.5 py-1 rounded-lg border border-red-300 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors"
                    >
                      Batal Edit
                    </button>
                  )}
                </div>

                <form onSubmit={handleSaveAthlete} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                      Nama Lengkap Atlet / Tim *
                    </label>
                    <input
                      type="text"
                      required
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="Contoh: Muhammad Fadli Pratama"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                      Kontingen / Perguruan / Daerah *
                    </label>
                    <input
                      type="text"
                      required
                      value={formContingent}
                      onChange={(e) => setFormContingent(e.target.value)}
                      placeholder="Contoh: Jawa Barat / Tapak Suci"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                        Kategori Pertandingan *
                      </label>
                      <select
                        value={formCategory}
                        onChange={(e) => handleCategoryChange(e.target.value as MatchCategory)}
                        className="w-full px-2.5 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                      >
                        <option value="TANDING">Tanding</option>
                        <option value="JURUS_TUNGGAL">Jurus Tunggal (Seni)</option>
                        <option value="JURUS_GANDA">Jurus Ganda (Seni)</option>
                        <option value="JURUS_REGU">Jurus Regu (Seni)</option>
                        <option value="SOLO_KREATIF">Solo Kreatif (Seni)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                        Jenis Kelamin *
                      </label>
                      <select
                        value={formGender}
                        onChange={(e) => handleGenderChange(e.target.value as Gender)}
                        className="w-full px-2.5 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                      >
                        <option value="PUTRA">PUTRA</option>
                        <option value="PUTRI">PUTRI</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                        Golongan Usia *
                      </label>
                      <select
                        value={formAgeGroup}
                        onChange={(e) => handleAgeGroupChange(e.target.value as AgeGroup)}
                        className="w-full px-2.5 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                      >
                        <option value="PRA_USIA_DINI">Pra Usia Dini (≤ 5 tahun)</option>
                        <option value="USIA_DINI_1">Usia Dini 1 (&gt; 5 s.d. 8 tahun)</option>
                        <option value="USIA_DINI_2">Usia Dini 2 (&gt; 8 s.d. 11 tahun)</option>
                        <option value="PRA_REMAJA">Pra Remaja (&gt; 11 s.d. 14 tahun)</option>
                        <option value="REMAJA">Remaja (&gt; 14 s.d. 17 tahun)</option>
                        <option value="DEWASA">Dewasa (&gt; 17 s.d. 35 tahun)</option>
                        <option value="MASTER_1">Master 1 (&gt; 35 s.d. 45 tahun)</option>
                        <option value="MASTER_2">Master 2 (≥ 45 tahun)</option>
                      </select>
                    </div>

                    {formCategory === 'TANDING' ? (
                      <div>
                        <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                          Kelas Tanding (IPSI 2026) *
                        </label>
                        <select
                          value={formClassGroup}
                          onChange={(e) => handleClassGroupChange(e.target.value)}
                          className="w-full px-2.5 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                        >
                          {currentIpsiClasses.map((cls) => (
                            <option key={cls.id} value={cls.label}>
                              {cls.name} ({cls.weightRange})
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div>
                        <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                          Spesifikasi Jurus
                        </label>
                        <input
                          type="text"
                          disabled
                          value={getDefaultClassGroupForCategory(formCategory, formAgeGroup, formGender)}
                          className="w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 font-semibold cursor-not-allowed"
                        />
                      </div>
                    )}
                  </div>

                  {formCategory === 'TANDING' && (
                    <div>
                      <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                        Berat Badan (kg) *
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        required
                        value={formWeight || ''}
                        onChange={(e) => setFormWeight(parseFloat(e.target.value) || 0)}
                        placeholder="Contoh: 58.2"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                      />
                      {activeClassObj && (
                        <p className="text-[11px] text-blue-600 dark:text-blue-400 mt-1 font-bold">
                          Rentang Sah IPSI 2026: {activeClassObj.weightRange}
                        </p>
                      )}
                    </div>
                  )}

                  {(formCategory === 'JURUS_GANDA' || formCategory === 'JURUS_REGU') && (
                    <div>
                      <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                        Anggota Tim (khusus Ganda/Regu, pisahkan tanda koma)
                      </label>
                      <input
                        type="text"
                        value={formTeamMembers}
                        onChange={(e) => setFormTeamMembers(e.target.value)}
                        placeholder="Contoh: Andika Putra, Fajar Ramadhan, Gilang Prasetyo"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                      Gelanggang Pertandingan *
                    </label>
                    <select
                      value={formArena}
                      onChange={(e) => setFormArena(e.target.value)}
                      className="w-full px-2.5 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-blue-500 shadow-sm cursor-pointer"
                    >
                      <option value="GELANGGANG A">GELANGGANG A</option>
                      <option value="GELANGGANG B">GELANGGANG B</option>
                      <option value="GELANGGANG C">GELANGGANG C</option>
                      <option value="GELANGGANG D">GELANGGANG D</option>
                      <option value="GELANGGANG 1">GELANGGANG 1</option>
                      <option value="GELANGGANG 2">GELANGGANG 2</option>
                      <option value="GELANGGANG 3">GELANGGANG 3</option>
                      <option value="GELANGGANG 4">GELANGGANG 4</option>
                    </select>
                  </div>

                  {/* MENU AKSI EXCEL & KOSONGKAN DATA (MENGGANTIKAN TULISAN & ICON KATEGORI TERDAFTAR) */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    {/* [📥 Import Excel] (Tombol Hijau/Emerald) */}
                    <label className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white shadow cursor-pointer transition-transform text-center">
                      <Upload className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">📥 Import Excel</span>
                      <input
                        type="file"
                        accept=".xlsx, .xls, .csv"
                        className="hidden"
                        onChange={handleFileUpload}
                      />
                    </label>

                    {/* [📄 Template Excel] (Tombol Berkas Spreadsheet) */}
                    <button
                      type="button"
                      onClick={downloadAthleteTemplateExcel}
                      className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-2 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 shadow-sm transition-transform active:scale-95 text-center"
                      title="Unduh format berkas template Excel untuk diisi kontingen"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate">📄 Template Excel</span>
                    </button>

                    {/* [📊 Unduh Excel] (Tombol Biru Rekap Excel) */}
                    <button
                      type="button"
                      onClick={() => exportAthletesToExcel(athletes)}
                      disabled={athletes.length === 0}
                      className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-black bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white shadow transition-transform active:scale-95 text-center"
                      title="Unduh seluruh data atlet terdaftar ke file Excel (.xlsx)"
                    >
                      <Download className="w-3.5 h-3.5 shrink-0 text-white" />
                      <span className="truncate">Unduh Excel</span>
                    </button>

                    {/* [🗑 KOSONGKAN] (Tombol Merah Kontras Tinggi untuk mengosongkan semua data) */}
                    <button
                      type="button"
                      onClick={handleClearAll}
                      disabled={athletes.length === 0}
                      className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-black bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white shadow-md ring-2 ring-red-400/50 transition-transform active:scale-95 text-center"
                      title="Kosongkan seluruh data atlet terdaftar"
                    >
                      <Trash2 className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">🗑 KOSONGKAN</span>
                    </button>
                  </div>

                  {/* Submit Button - Sticky with Background at bottom */}
                  <div className="pt-2 sticky bottom-0 bg-white dark:bg-slate-900 pb-1 z-10 border-t border-slate-100 dark:border-slate-800/80">
                    <button
                      type="submit"
                      className="w-full py-2.5 px-4 rounded-xl text-xs font-black bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                      {isEditing ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Simpan Perubahan Atlet</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4" />
                          <span>Simpan Data Atlet</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* SISI KANAN: DATA ATLET TERDAFTAR (SEARCH, FILTER & TABEL) - INDEPENDENT SCROLL */}
              <div className="lg:col-span-7 bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-100 rounded-2xl p-3.5 sm:p-4 shadow-sm space-y-3 flex flex-col lg:h-full min-h-[380px] lg:min-h-0 overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2 shrink-0">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-600" />
                    <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider font-mono">
                      DATA ATLET TERDAFTAR
                    </h3>
                  </div>
                  <span className="text-[11px] font-bold text-slate-500">
                    Total: {athletes.length} Atlet
                  </span>
                </div>

                  {/* Search & Gender Filter Row */}
                  <div className="flex flex-col sm:flex-row gap-2.5 items-center justify-between">
                    <div className="relative w-full sm:flex-1">
                      <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Cari atlet, kontingen, kelas, putra/putri..."
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                      />
                    </div>

                    <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                      <button
                        onClick={() => setSelectedGenderFilter('ALL')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-black whitespace-nowrap transition-all ${
                          selectedGenderFilter === 'ALL'
                            ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                        }`}
                      >
                        Semua ({athletes.length})
                      </button>
                      <button
                        onClick={() => setSelectedGenderFilter('PUTRA')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-black whitespace-nowrap transition-all ${
                          selectedGenderFilter === 'PUTRA'
                            ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-400'
                            : 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-blue-100'
                        }`}
                      >
                        PUTRA ({athletes.filter((a) => a.gender === 'PUTRA').length})
                      </button>
                      <button
                        onClick={() => setSelectedGenderFilter('PUTRI')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-black whitespace-nowrap transition-all ${
                          selectedGenderFilter === 'PUTRI'
                            ? 'bg-pink-600 text-white shadow-sm ring-2 ring-pink-400'
                            : 'bg-pink-50 dark:bg-pink-950/60 text-pink-700 dark:text-pink-300 hover:bg-pink-100'
                        }`}
                      >
                        PUTRI ({athletes.filter((a) => a.gender === 'PUTRI').length})
                      </button>
                    </div>
                  </div>

                  {/* Sub-Category Filter Pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                    <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    {['ALL', 'TANDING', 'JURUS_TUNGGAL', 'JURUS_GANDA', 'JURUS_REGU', 'SOLO_KREATIF'].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategoryFilter(cat)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-colors ${
                          selectedCategoryFilter === cat
                            ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 shadow-sm'
                            : 'bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                        }`}
                      >
                        {cat === 'ALL' ? 'Semua Disiplin' : cat.replace('_', ' ')}
                      </button>
                    ))}
                  </div>

                {/* Table of Athletes - Scroll strictly inside this area */}
                <div className="flex-1 min-h-0 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 custom-inner-scrollbar">
                  <table className="w-full text-left text-xs">
                    <thead className="sticky top-0 z-10 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-black uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-700 shadow-sm">
                      <tr>
                        <th className="py-2.5 px-3 text-center w-10">No</th>
                        <th className="py-2.5 px-3">Nama Pesilat</th>
                        <th className="py-2.5 px-3">Kontingen</th>
                        <th className="py-2.5 px-3">Kategori & Gender</th>
                        <th className="py-2.5 px-3">Golongan Usia</th>
                        <th className="py-2.5 px-3">Kelas / Berat</th>
                        <th className="py-2.5 px-3 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
                      {filteredAthletes.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                            Belum ada data atlet yang terdaftar atau cocok dengan filter kategori yang dipilih.
                          </td>
                        </tr>
                      ) : (
                        filteredAthletes.map((ath, idx) => (
                          <tr key={ath.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            <td className="py-2 px-3 text-center font-mono text-slate-500 font-bold text-[11px]">
                              {idx + 1}
                            </td>
                            <td className="py-2 px-3 font-bold text-slate-900 dark:text-white">
                              <div>{ath.name}</div>
                              {ath.teamMembers && (
                                <div className="text-[10px] font-normal text-slate-500">
                                  Anggota Tim: {ath.teamMembers.join(', ')}
                                </div>
                              )}
                            </td>
                            <td className="py-2 px-3 font-semibold text-slate-700 dark:text-slate-300">
                              {ath.contingent}
                            </td>
                            <td className="py-2 px-3">
                              <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase border ${
                                ath.gender === 'PUTRA'
                                  ? 'bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950 dark:text-blue-200 dark:border-blue-800'
                                  : 'bg-pink-100 text-pink-900 border-pink-300 dark:bg-pink-950 dark:text-pink-200 dark:border-pink-800'
                              }`}>
                                {ath.category.replace('_', ' ')} · {ath.gender}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-slate-700 dark:text-slate-300">
                              {ath.ageGroup.replace('_', ' ')}
                            </td>
                            <td className="py-2 px-3 font-semibold text-slate-800 dark:text-slate-200">
                              {ath.classGroup} {ath.weight ? `(${ath.weight} kg)` : ''}
                            </td>
                            <td className="py-2 px-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => handleOpenEdit(ath)}
                                  className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors"
                                  title="Edit Atlet"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleRequestDelete(ath)}
                                  className="p-1.5 rounded-lg text-slate-600 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                                  title="Hapus Atlet"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="text-[11px] text-slate-500 font-semibold pt-1 shrink-0">
                  Menampilkan {filteredAthletes.length} dari {athletes.length} atlet terdaftar
                </div>
              </div>

            </div>
          )}

          {/* ================= TAB 2: BAGAN BRAKET ================= */}
          {activeTab === 'bracket' && (
            <div className="h-full overflow-y-auto pr-1 space-y-6">
              
              {/* Bracket Controls & Settings */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <GitBranch className="w-5 h-5 text-amber-500" />
                    <h3 className="font-black text-sm text-slate-900 dark:text-white uppercase tracking-wider">
                      Pengaturan Sistem Bagan Pertandingan (IPSI 2026 & PERSILAT)
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    {/* 1. Pilih Kelas & Kategori Atlet (Tanding maupun Jurus) */}
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Pilih Kelas / Kategori Atlet:
                      </label>
                      <select
                        value={selectedBracketClass || (availableClasses.length > 0 ? availableClasses[0] : '')}
                        onChange={(e) => setSelectedBracketClass(e.target.value)}
                        className="w-full px-2.5 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold"
                      >
                        {availableClasses.map((cls) => {
                          const isPutri = cls.includes('PUTRI');
                          const cat = cls.split(' - ')[0];
                          const rest = cls.split(' - ')[1] || '';
                          return (
                            <option key={cls} value={cls}>
                              [{cat.replace('_', ' ')} · {isPutri ? 'PUTRI' : 'PUTRA'}] {rest.replace(/\s*\(.*\)/, '')}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    {/* 2. Format Bagan Turnamen (Pemasalan vs Prestasi) */}
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Format Bagan Turnamen:
                      </label>
                      <select
                        value={bracketCategory}
                        onChange={(e) => setBracketCategory(e.target.value as 'PEMASALAN' | 'PRESTASI')}
                        className="w-full px-2.5 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold"
                      >
                        <option value="PEMASALAN">Bagan Pemasalan</option>
                        <option value="PRESTASI">Bagan Prestasi</option>
                      </select>
                    </div>

                    {/* 3. Dropdown Dinamis Berdasarkan Format Pilihan */}
                    <div>
                      {bracketCategory === 'PEMASALAN' ? (
                        <>
                          <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Pilihan Format Pemasalan:
                          </label>
                          <select
                            value={pemasalanFormat}
                            onChange={(e) => setPemasalanFormat(e.target.value as 'SEMIFINAL' | 'FINAL')}
                            className="w-full px-2.5 py-2 rounded-lg border border-amber-400 dark:border-amber-600 bg-amber-50/50 dark:bg-slate-900 text-slate-900 dark:text-white font-extrabold"
                          >
                            <option value="SEMIFINAL">
                              Sistem Gugur Semifinal (4 Atlet, 4 Partai: Semifinal, Perebutan Juara 3, & Final)
                            </option>
                            <option value="FINAL">
                              Babak Final (2 Atlet, 1 Partai: Juara 1 & 2)
                            </option>
                          </select>
                        </>
                      ) : (
                        <>
                          <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Pilihan Format Prestasi:
                          </label>
                          <select
                            value={prestasiFormat}
                            onChange={(e) => setPrestasiFormat(e.target.value as 'SINGLE_POOL' | 'POOL_AB')}
                            className="w-full px-2.5 py-2 rounded-lg border border-blue-400 dark:border-blue-600 bg-blue-50/50 dark:bg-slate-900 text-slate-900 dark:text-white font-extrabold"
                          >
                            <option value="SINGLE_POOL">
                              Sistem Gugur Tunggal (Penyisihan, Semifinal, Perebutan Juara 3, & Final)
                            </option>
                            <option value="POOL_AB">
                              Sistem Gugur Pool A & B (Semifinal Pool, Perebutan Juara 3, & Grand Final)
                            </option>
                          </select>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons: Unduh PDF & Sinkronkan ke Jadwal (Tanpa Tombol "Buat Bagan Otomatis") */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0 pt-2 xl:pt-0">
                  <button
                    onClick={() => {
                      const catTitle = bracketCategory === 'PEMASALAN'
                        ? `Pemasalan (${pemasalanFormat === 'SEMIFINAL' ? 'Semifinal' : 'Final'})`
                        : `Prestasi (${prestasiFormat === 'SINGLE_POOL' ? 'Single Pool' : 'Pool A & B'})`;
                      const summaryNote = bracketCategory === 'PEMASALAN'
                        ? (pemasalanFormat === 'SEMIFINAL' ? 'Memperebutkan Juara 1, 2, dan 3 (Tanpa Juara 3 Bersama)' : 'Perebutan Juara 1 & Juara 2')
                        : 'Sistem Gugur: Babak Penyisihan, Semifinal, Perebutan Juara 3, dan Grand Final (Juara 1, 2, 3 - Tanpa Juara 3 Bersama)';
                      exportBracketToPdf(
                        catTitle,
                        selectedBracketClass || (availableClasses.length > 0 ? availableClasses[0] : 'Kelas Silat'),
                        bracketCategory,
                        bracketMatches,
                        config,
                        summaryNote
                      );
                    }}
                    disabled={bracketMatches.length === 0}
                    className="flex items-center justify-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-black text-xs rounded-xl shadow disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-transform"
                    title="Unduh Bagan Resmi ke format PDF A4"
                  >
                    <Download className="w-4 h-4" />
                    <span>Unduh Bagan PDF A4</span>
                  </button>

                  <button
                    onClick={handleSyncBracketToMatches}
                    disabled={bracketMatches.length === 0}
                    className="flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-transform"
                    title="Sinkronkan susunan bagan ini ke jadwal pertandingan gelanggang"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>Sinkronkan ke Jadwal Gelanggang</span>
                  </button>
                </div>
              </div>

              {/* Toast Notifikasi Sinkronisasi */}
              {bracketSyncMsg && (
                <div className="p-3 rounded-xl bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200 border border-emerald-300 font-bold text-xs flex items-center gap-2 animate-fade-in shadow-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{bracketSyncMsg}</span>
                </div>
              )}

              {/* Informative Banner Penjelasan Format Resmi IPSI 2026 */}
              <div className="p-3 sm:p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 text-xs flex flex-col md:flex-row md:items-center justify-between gap-2.5 shadow-xs">
                <div className="space-y-0.5">
                  <div className="font-extrabold text-amber-900 dark:text-amber-300 flex items-center gap-1.5 uppercase tracking-wide text-xs">
                    <Trophy className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>
                      {bracketCategory === 'PEMASALAN'
                        ? (pemasalanFormat === 'SEMIFINAL'
                            ? 'Format Pemasalan: Sistem Gugur Semifinal (4 Atlet · 4 Partai)'
                            : 'Format Pemasalan: Babak Final (2 Atlet · 1 Partai)')
                        : (prestasiFormat === 'SINGLE_POOL'
                            ? 'Format Prestasi: Sistem Gugur Tunggal (Penyisihan, Semifinal, Perebutan Juara 3, & Final)'
                            : 'Format Prestasi: Pool A & Pool B Menuju Grand Final')}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-700 dark:text-slate-300 font-medium">
                    {bracketCategory === 'PEMASALAN'
                      ? (pemasalanFormat === 'SEMIFINAL'
                          ? 'Ketentuan Juara: Juara 1 (Pemenang Final), Juara 2 (Runner-up Final), dan Juara 3 (Pemenang Partai Perebutan Juara 3). Tanpa ada Juara 3 Bersama.'
                          : 'Ketentuan Juara: Memperebutkan Juara 1 (Medali Emas) dan Juara 2 (Medali Perak) secara langsung.')
                      : (prestasiFormat === 'SINGLE_POOL'
                          ? 'Ketentuan Juara: Sistem gugur dimulai dari Babak Penyisihan, Semifinal, Perebutan Juara 3 (Perunggu Tunggal), hingga Grand Final (Juara 1 Emas & Juara 2 Perak). Tanpa ada Juara 3 Bersama.'
                          : 'Ketentuan Juara: Semifinal Pool A & Pool B, dilanjutkan Perebutan Juara 3 (Runner-up Pool A vs B) serta Grand Final memperebutkan Juara 1 (Emas) & Juara 2 (Perak).')}
                  </p>
                </div>
                <div className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 text-[10px] font-black uppercase text-amber-800 dark:text-amber-300 shadow-2xs">
                  <span>Regulasi Resmi IPSI 2026 / PERSILAT</span>
                </div>
              </div>

              {/* Visual Bracket Display */}
              <div className="rounded-2xl border border-slate-300 dark:border-slate-700 p-3 sm:p-4 bg-white dark:bg-slate-900 space-y-2.5 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2 gap-1.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-mono font-black text-xs uppercase text-slate-900 dark:text-white">
                      Bagan: {bracketCategory} ({bracketCategory === 'PEMASALAN' ? pemasalanFormat : prestasiFormat})
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
                      {selectedBracketClass || (availableClasses.length > 0 ? availableClasses[0] : 'Semua Kelas')}
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-slate-500 font-mono">
                    Total: {bracketMatches.length} Pertandingan dalam Bagan
                  </span>
                </div>

                {bracketMatches.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-6 space-y-1.5">
                    <GitBranch className="w-7 h-7 text-slate-400 mx-auto mb-1" />
                    <p className="font-bold text-slate-700 dark:text-slate-300 text-xs">Bagan Pertandingan Kosong</p>
                    <p className="text-[11px]">Data atlet telah dikosongkan. Silakan tambahkan atlet pada menu <strong>Tambah Atlet</strong> untuk otomatis menyusun bagan braket pertandingan.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
                    {bracketMatches.map((bm, index) => {
                      const isJurus = bm.isJurus;

                      return (
                        <div
                          key={bm.id}
                          className="rounded-xl border border-slate-300 dark:border-slate-700 p-2.5 bg-slate-50 dark:bg-slate-800/60 space-y-1.5 relative hover:border-slate-400 dark:hover:border-slate-500 transition-all shadow-2xs"
                        >
                          {/* Match Header */}
                          <div className="flex items-center justify-between text-[10px] font-black text-slate-500 uppercase border-b border-slate-200 dark:border-slate-700 pb-1">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-slate-900 dark:text-white">
                                Partai #{bm.matchNumber || index + 1}
                              </span>
                              <span className={`px-1 py-0.2 rounded text-[8px] font-black uppercase text-white ${
                                isJurus ? 'bg-emerald-600' : 'bg-red-600'
                              }`}>
                                {isJurus ? 'Jurus Seni' : 'Tanding'}
                              </span>
                            </div>
                            <span className="text-amber-600 dark:text-amber-400 font-extrabold text-[9px]">
                              {bm.stage?.replace('_', ' ') || 'BAGAN'}
                            </span>
                          </div>

                          <div className="text-[10px] font-bold text-slate-800 dark:text-slate-200 leading-tight">
                            {bm.roundName}
                          </div>

                          {/* Athlete 1 (Merah / Penampil 1) */}
                          <div className="p-2 rounded-lg bg-red-100/90 dark:bg-red-950/70 border border-red-300 dark:border-red-900 text-xs space-y-0.5">
                            <span className="text-[8px] font-black uppercase text-red-700 dark:text-red-300 block">
                              {isJurus ? 'PENAMPIL SUDUT MERAH' : 'SUDUT MERAH'}
                            </span>
                            <div className="font-black text-red-950 dark:text-red-100 text-xs truncate">
                              {bm.athlete1 ? bm.athlete1.name : 'BYE / Menunggu'}
                            </div>
                            <div className="text-[9px] text-red-800 dark:text-red-300 font-medium truncate">
                              {bm.athlete1?.contingent ? `Kontingen: ${bm.athlete1.contingent}` : '-'}
                            </div>
                            {bm.athlete1?.teamMembers && (
                              <div className="text-[8px] text-red-700 dark:text-red-400 truncate">
                                Tim: {bm.athlete1.teamMembers.join(', ')}
                              </div>
                            )}
                          </div>

                          {/* Pemisah Halus Tanpa Tulisan VS */}
                          <div className="h-px bg-slate-200 dark:bg-slate-700/60 my-0.5" />

                          {/* Athlete 2 (Biru / Penampil 2) */}
                          <div className="p-2 rounded-lg bg-blue-100/90 dark:bg-blue-950/70 border border-blue-300 dark:border-blue-900 text-xs space-y-0.5">
                            <span className="text-[8px] font-black uppercase text-blue-700 dark:text-blue-300 block">
                              {isJurus ? 'PENAMPIL SUDUT BIRU' : 'SUDUT BIRU'}
                            </span>
                            <div className="font-black text-blue-950 dark:text-blue-100 text-xs truncate">
                              {bm.athlete2 ? bm.athlete2.name : 'BYE / Menunggu'}
                            </div>
                            <div className="text-[9px] text-blue-800 dark:text-blue-300 font-medium truncate">
                              {bm.athlete2?.contingent ? `Kontingen: ${bm.athlete2.contingent}` : '-'}
                            </div>
                            {bm.athlete2?.teamMembers && (
                              <div className="text-[8px] text-blue-700 dark:text-blue-400 truncate">
                                Tim: {bm.athlete2.teamMembers.join(', ')}
                              </div>
                            )}
                          </div>

                          {/* Award / Status Footer */}
                          {bm.awardNote && (
                            <div className="pt-1.5 border-t border-slate-200 dark:border-slate-700 text-[9px] font-bold text-amber-700 dark:text-amber-400 flex items-start gap-1">
                              <Award className="w-3 h-3 shrink-0 mt-0.5" />
                              <span className="leading-tight line-clamp-2">{bm.awardNote}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* ================= TAB 3: JADWAL PERTANDINGAN ================= */}
          {activeTab === 'schedule' && (
            <div className="h-full overflow-y-auto pr-1 space-y-6">
              
              {/* Schedule Controls */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <h3 className="font-black text-sm text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-emerald-600" />
                    Manajemen & Sinkronisasi Jadwal Pertandingan
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Buat jadwal partai otomatis dari data atlet dan sinkronkan ke seluruh panel (Dewan, Juri, Timer, Monitor, Laporan).
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleAutoGenerateSchedule}
                    className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow active:scale-95 transition-transform"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Generate Jadwal Otomatis</span>
                  </button>

                  <button
                    onClick={() => exportScheduleToPdf(matches, config)}
                    className="flex items-center gap-1.5 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-black text-xs rounded-xl shadow active:scale-95 transition-transform"
                    title="Unduh jadwal resmi ke format PDF A4"
                  >
                    <Download className="w-4 h-4" />
                    <span>Unduh PDF A4 Jadwal</span>
                  </button>
                </div>
              </div>

              {generatedSuccessMsg && (
                <div className="p-3 rounded-xl bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200 border border-emerald-300 font-bold text-xs flex items-center gap-2 animate-fade-in">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>{generatedSuccessMsg}</span>
                </div>
              )}

              {/* Schedule Table */}
              <div className="rounded-2xl border-2 border-slate-900 dark:border-slate-100 overflow-hidden bg-white dark:bg-slate-900">
                <div className="p-3 bg-slate-100 dark:bg-slate-800 border-b flex justify-between items-center text-xs font-black">
                  <span>DAFTAR PARTAI TERJADWAL GELANGGANG</span>
                  <span>TOTAL: {matches.length} PARTAI</span>
                </div>

                {matches.length === 0 ? (
                  <div className="py-16 text-center text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/40 p-8 space-y-2">
                    <Calendar className="w-8 h-8 text-slate-400 mx-auto mb-1" />
                    <p className="font-bold text-slate-700 dark:text-slate-300 text-sm">Jadwal Pertandingan Kosong</p>
                    <p>Data jadwal pertandingan telah dikosongkan. Tambahkan atlet pada menu <strong>Tambah Atlet</strong> untuk otomatis menyusun jadwal partai pertandingan.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto max-h-96 overflow-y-auto custom-inner-scrollbar">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 dark:bg-slate-800/60 font-black uppercase text-[10px] tracking-wider border-b">
                        <tr>
                          <th className="py-2.5 px-4">Partai</th>
                          <th className="py-2.5 px-4">Kategori</th>
                          <th className="py-2.5 px-4">Babak</th>
                          <th className="py-2.5 px-4">Kelas / Golongan</th>
                          <th className="py-2.5 px-4">Pesilat / Kontingen</th>
                          <th className="py-2.5 px-4 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y font-medium text-slate-800 dark:text-slate-200">
                        {matches.map((m) => {
                          const isTanding = m.category === 'TANDING';
                          return (
                            <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                              <td className="py-2.5 px-4 font-mono font-black">
                                Partai #{m.matchNumber}
                              </td>
                              <td className="py-2.5 px-4">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase text-white ${
                                  isTanding ? 'bg-red-600' : 'bg-emerald-600'
                                }`}>
                                  {m.category.replace('_', ' ')}
                                </span>
                              </td>
                              <td className="py-2.5 px-4 font-semibold">
                                {m.stage.replace('_', ' ')}
                              </td>
                              <td className="py-2.5 px-4">
                                {m.classGroup} ({m.gender})
                              </td>
                              <td className="py-2.5 px-4">
                                {isTanding ? (
                                  <div>
                                    <span className="text-red-600 font-bold">[M]</span> {m.tanding?.redAthlete?.name} ({m.tanding?.redAthlete?.contingent}) <br />
                                    <span className="text-blue-600 font-bold">[B]</span> {m.tanding?.blueAthlete?.name} ({m.tanding?.blueAthlete?.contingent})
                                  </div>
                                ) : (
                                  <div>
                                    <span className="text-emerald-600 font-bold">[Seni]</span> {m.jurus?.performer?.name} ({m.jurus?.performer?.contingent})
                                  </div>
                                )}
                              </td>
                              <td className="py-2.5 px-4 text-center">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                  m.status === 'FINISHED'
                                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                                    : m.status === 'ONGOING'
                                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                      : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                }`}>
                                  {m.status}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex justify-between items-center text-xs text-slate-500">
          <span>Sistem Registrasi Atlet Terintegrasi IPSI 2026 & PERSILAT</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-lg font-bold"
          >
            Tutup
          </button>
        </div>

      </div>

        {/* ================= MENU SCROLL BAR LUAR (UNTUK MENG-SCROLL TAMPILAN LAYAR KE ATAS & KE BAWAH) ================= */}
        <aside 
          aria-label="Menu Scroll Bar Luar Layar"
          className="fixed right-2 sm:right-4 top-1/2 -translate-y-1/2 z-[60] flex flex-col items-center gap-1.5 sm:gap-2 bg-[#070e1c]/95 border-2 border-cyan-400 rounded-2xl p-2 sm:p-2.5 shadow-[0_0_35px_rgba(6,182,212,0.6)] backdrop-blur-xl cyber-glass select-none text-slate-100"
        >
          {/* Header Label Menu */}
          <div className="flex flex-col items-center gap-0.5 pb-1 border-b border-cyan-500/30 w-full text-center">
            <span className="text-[9px] font-mono font-black text-cyan-300 uppercase tracking-widest leading-none">
              MENU
            </span>
            <span className="text-[8px] font-mono font-bold text-slate-400 uppercase tracking-tighter leading-none">
              SCROLL
            </span>
          </div>

          {/* Tombol Utama: Scroll Tampilan Layar Ke Atas */}
          <button
            type="button"
            onClick={scrollToTop}
            title="Klik untuk Scroll Tampilan Layar ke Paling Atas"
            aria-label="Scroll Tampilan Layar ke Atas"
            className="w-full px-2 py-2 sm:py-2.5 rounded-xl bg-gradient-to-b from-cyan-400 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-slate-950 font-black shadow-lg border border-cyan-200 transition-all active:scale-90 flex flex-col items-center justify-center gap-0.5 cursor-pointer group"
          >
            <ChevronUp className="w-5 h-5 text-slate-950 group-hover:-translate-y-1 transition-transform" />
            <span className="text-[9px] font-mono font-black uppercase tracking-tight leading-none text-slate-950">
              KE ATAS
            </span>
          </button>

          {/* Track Visual Scroll Bar Luar Interaktif */}
          <div 
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const clickY = e.clientY - rect.top;
              const ratio = Math.max(0, Math.min(1, clickY / rect.height));
              if (outerScrollRef.current) {
                const maxScroll = outerScrollRef.current.scrollHeight - outerScrollRef.current.clientHeight;
                outerScrollRef.current.scrollTo({ top: maxScroll * ratio, behavior: 'smooth' });
              }
            }}
            className="w-4 h-24 sm:h-32 rounded-full bg-[#040813] border-2 border-cyan-500/40 relative cursor-pointer overflow-hidden my-0.5 shadow-[inset_0_2px_8px_rgba(0,0,0,0.8)]"
            title="Track Scroll Bar Luar: Klik untuk melompat ke posisi layar"
          >
            <div 
              className="w-full bg-gradient-to-b from-cyan-400 via-blue-500 to-indigo-500 rounded-full transition-all duration-150 absolute top-0 shadow-[0_0_8px_rgba(6,182,212,0.8)]"
              style={{ height: `${Math.max(18, scrollProgress)}%` }}
            />
          </div>

          {/* Tombol: Scroll Tampilan Layar Ke Bawah */}
          <button
            type="button"
            onClick={scrollToBottom}
            title="Klik untuk Scroll Tampilan Layar ke Paling Bawah"
            aria-label="Scroll Tampilan Layar ke Bawah"
            className="w-full px-2 py-2 sm:py-2.5 rounded-xl bg-[#040813] hover:bg-[#091326] text-cyan-300 hover:text-white border border-cyan-500/40 shadow transition-all active:scale-90 flex flex-col items-center justify-center gap-0.5 cursor-pointer group"
          >
            <span className="text-[9px] font-mono font-black uppercase tracking-tight leading-none">
              KE BAWAH
            </span>
            <ChevronDown className="w-5 h-5 text-cyan-300 group-hover:translate-y-1 transition-transform" />
          </button>
        </aside>

      </div>

      {/* Toast Notification Banner (Auto-dismiss, works without window.alert) */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-[80] bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 border-2 border-slate-700 dark:border-slate-300 animate-fade-in text-xs font-bold">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 text-slate-400 hover:text-white dark:hover:text-black transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Modal Konfirmasi: Kosongkan Semua Data Atlet */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-[70] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border-2 border-red-600 rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950/80 flex items-center justify-center text-red-600 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white uppercase font-mono">
                  Kosongkan Semua Data Atlet?
                </h4>
                <p className="text-xs text-slate-500">
                  Tindakan ini tidak dapat dibatalkan
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              Apakah Anda yakin ingin mengosongkan seluruh data atlet terdaftar (<strong>{athletes.length} atlet</strong>)? Seluruh data peserta di database turnamen akan dihapus.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmClearAll}
                className="px-4 py-2 rounded-xl text-xs font-black bg-red-600 hover:bg-red-700 text-white shadow transition-transform active:scale-95 flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ya, Kosongkan Semua</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi: Hapus Data Atlet Per Baris */}
      {athleteToDelete && (
        <div className="fixed inset-0 z-[70] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border-2 border-red-600 rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950/80 flex items-center justify-center text-red-600 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white uppercase font-mono">
                  Hapus Data Atlet?
                </h4>
                <p className="text-xs text-slate-500">
                  Konfirmasi penghapusan data peserta
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              Apakah Anda yakin ingin menghapus data atlet <strong>"{athleteToDelete.name}"</strong> ({athleteToDelete.contingent} - {athleteToDelete.category.replace('_', ' ')})?
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setAthleteToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmDeleteAthlete}
                className="px-4 py-2 rounded-xl text-xs font-black bg-red-600 hover:bg-red-700 text-white shadow transition-transform active:scale-95 flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ya, Hapus Atlet</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
