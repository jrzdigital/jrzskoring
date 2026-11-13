import { AgeGroup, Gender, MatchCategory } from '../types/silat';

export interface IpsiWeightClass {
  id: string; // e.g. 'A', 'B', 'BEBAS'
  name: string; // e.g. 'Kelas A'
  weightRange: string; // e.g. '55-60 kg' or '>95 kg'
  label: string; // e.g. 'Kelas C (55-60 kg)'
  minWeight: number;
  maxWeight: number;
  defaultWeight: number;
}

/**
 * Daftar Kelas Tanding IPSI 2026 & PERSILAT berdasarkan Golongan Usia dan Jenis Kelamin
 */
export const getIpsiWeightClasses = (ageGroup: AgeGroup, gender: Gender = 'PUTRA'): IpsiWeightClass[] => {
  switch (ageGroup as any) {
    case 'PRA_USIA_DINI':
    case 'USIA_DINI_1':
    case 'USIA_DINI_2':
    case 'USIA_DINI':
      return [
        { id: 'A', name: 'Kelas A', weightRange: '26-28 kg', label: 'Kelas A (26-28 kg)', minWeight: 26, maxWeight: 28, defaultWeight: 27 },
        { id: 'B', name: 'Kelas B', weightRange: '28-30 kg', label: 'Kelas B (28-30 kg)', minWeight: 28.1, maxWeight: 30, defaultWeight: 29 },
        { id: 'C', name: 'Kelas C', weightRange: '30-32 kg', label: 'Kelas C (30-32 kg)', minWeight: 30.1, maxWeight: 32, defaultWeight: 31 },
        { id: 'D', name: 'Kelas D', weightRange: '32-34 kg', label: 'Kelas D (32-34 kg)', minWeight: 32.1, maxWeight: 34, defaultWeight: 33 },
        { id: 'E', name: 'Kelas E', weightRange: '34-36 kg', label: 'Kelas E (34-36 kg)', minWeight: 34.1, maxWeight: 36, defaultWeight: 35 },
        { id: 'F', name: 'Kelas F', weightRange: '36-38 kg', label: 'Kelas F (36-38 kg)', minWeight: 36.1, maxWeight: 38, defaultWeight: 37 },
        { id: 'G', name: 'Kelas G', weightRange: '38-40 kg', label: 'Kelas G (38-40 kg)', minWeight: 38.1, maxWeight: 40, defaultWeight: 39 },
        { id: 'H', name: 'Kelas H', weightRange: '40-42 kg', label: 'Kelas H (40-42 kg)', minWeight: 40.1, maxWeight: 42, defaultWeight: 41 },
        { id: 'I', name: 'Kelas I', weightRange: '42-44 kg', label: 'Kelas I (42-44 kg)', minWeight: 42.1, maxWeight: 44, defaultWeight: 43 },
        { id: 'J', name: 'Kelas J', weightRange: '44-46 kg', label: 'Kelas J (44-46 kg)', minWeight: 44.1, maxWeight: 46, defaultWeight: 45 },
        { id: 'BEBAS', name: 'Kelas Bebas', weightRange: '>46 kg', label: 'Kelas Bebas (>46 kg)', minWeight: 46.1, maxWeight: 60, defaultWeight: 48 }
      ];

    case 'PRA_REMAJA':
      return [
        { id: 'A', name: 'Kelas A', weightRange: '30-33 kg', label: 'Kelas A (30-33 kg)', minWeight: 30, maxWeight: 33, defaultWeight: 31.5 },
        { id: 'B', name: 'Kelas B', weightRange: '33-36 kg', label: 'Kelas B (33-36 kg)', minWeight: 33.1, maxWeight: 36, defaultWeight: 34.5 },
        { id: 'C', name: 'Kelas C', weightRange: '36-39 kg', label: 'Kelas C (36-39 kg)', minWeight: 36.1, maxWeight: 39, defaultWeight: 37.5 },
        { id: 'D', name: 'Kelas D', weightRange: '39-42 kg', label: 'Kelas D (39-42 kg)', minWeight: 39.1, maxWeight: 42, defaultWeight: 40.5 },
        { id: 'E', name: 'Kelas E', weightRange: '42-45 kg', label: 'Kelas E (42-45 kg)', minWeight: 42.1, maxWeight: 45, defaultWeight: 43.5 },
        { id: 'F', name: 'Kelas F', weightRange: '45-48 kg', label: 'Kelas F (45-48 kg)', minWeight: 45.1, maxWeight: 48, defaultWeight: 46.5 },
        { id: 'G', name: 'Kelas G', weightRange: '48-51 kg', label: 'Kelas G (48-51 kg)', minWeight: 48.1, maxWeight: 51, defaultWeight: 49.5 },
        { id: 'H', name: 'Kelas H', weightRange: '51-54 kg', label: 'Kelas H (51-54 kg)', minWeight: 51.1, maxWeight: 54, defaultWeight: 52.5 },
        { id: 'I', name: 'Kelas I', weightRange: '54-57 kg', label: 'Kelas I (54-57 kg)', minWeight: 54.1, maxWeight: 57, defaultWeight: 55.5 },
        { id: 'J', name: 'Kelas J', weightRange: '57-60 kg', label: 'Kelas J (57-60 kg)', minWeight: 57.1, maxWeight: 60, defaultWeight: 58.5 },
        { id: 'K', name: 'Kelas K', weightRange: '60-63 kg', label: 'Kelas K (60-63 kg)', minWeight: 60.1, maxWeight: 63, defaultWeight: 61.5 },
        { id: 'L', name: 'Kelas L', weightRange: '63-66 kg', label: 'Kelas L (63-66 kg)', minWeight: 63.1, maxWeight: 66, defaultWeight: 64.5 },
        { id: 'BEBAS', name: 'Kelas Bebas', weightRange: '>66 kg', label: 'Kelas Bebas (>66 kg)', minWeight: 66.1, maxWeight: 80, defaultWeight: 68 }
      ];

    case 'REMAJA':
      if (gender === 'PUTRI') {
        return [
          { id: 'A', name: 'Kelas A', weightRange: '39-43 kg', label: 'Kelas A (39-43 kg)', minWeight: 39, maxWeight: 43, defaultWeight: 41 },
          { id: 'B', name: 'Kelas B', weightRange: '43-47 kg', label: 'Kelas B (43-47 kg)', minWeight: 43.1, maxWeight: 47, defaultWeight: 45 },
          { id: 'C', name: 'Kelas C', weightRange: '47-51 kg', label: 'Kelas C (47-51 kg)', minWeight: 47.1, maxWeight: 51, defaultWeight: 49 },
          { id: 'D', name: 'Kelas D', weightRange: '51-55 kg', label: 'Kelas D (51-55 kg)', minWeight: 51.1, maxWeight: 55, defaultWeight: 53 },
          { id: 'E', name: 'Kelas E', weightRange: '55-59 kg', label: 'Kelas E (55-59 kg)', minWeight: 55.1, maxWeight: 59, defaultWeight: 57 },
          { id: 'F', name: 'Kelas F', weightRange: '59-63 kg', label: 'Kelas F (59-63 kg)', minWeight: 59.1, maxWeight: 63, defaultWeight: 61 },
          { id: 'G', name: 'Kelas G', weightRange: '63-67 kg', label: 'Kelas G (63-67 kg)', minWeight: 63.1, maxWeight: 67, defaultWeight: 65 },
          { id: 'H', name: 'Kelas H', weightRange: '67-71 kg', label: 'Kelas H (67-71 kg)', minWeight: 67.1, maxWeight: 71, defaultWeight: 69 },
          { id: 'BEBAS', name: 'Kelas Bebas', weightRange: '>71 kg', label: 'Kelas Bebas (>71 kg)', minWeight: 71.1, maxWeight: 90, defaultWeight: 74 }
        ];
      }
      return [
        { id: 'A', name: 'Kelas A', weightRange: '39-43 kg', label: 'Kelas A (39-43 kg)', minWeight: 39, maxWeight: 43, defaultWeight: 41 },
        { id: 'B', name: 'Kelas B', weightRange: '43-47 kg', label: 'Kelas B (43-47 kg)', minWeight: 43.1, maxWeight: 47, defaultWeight: 45 },
        { id: 'C', name: 'Kelas C', weightRange: '47-51 kg', label: 'Kelas C (47-51 kg)', minWeight: 47.1, maxWeight: 51, defaultWeight: 49 },
        { id: 'D', name: 'Kelas D', weightRange: '51-55 kg', label: 'Kelas D (51-55 kg)', minWeight: 51.1, maxWeight: 55, defaultWeight: 53 },
        { id: 'E', name: 'Kelas E', weightRange: '55-59 kg', label: 'Kelas E (55-59 kg)', minWeight: 55.1, maxWeight: 59, defaultWeight: 57 },
        { id: 'F', name: 'Kelas F', weightRange: '59-63 kg', label: 'Kelas F (59-63 kg)', minWeight: 59.1, maxWeight: 63, defaultWeight: 61 },
        { id: 'G', name: 'Kelas G', weightRange: '63-67 kg', label: 'Kelas G (63-67 kg)', minWeight: 63.1, maxWeight: 67, defaultWeight: 65 },
        { id: 'H', name: 'Kelas H', weightRange: '67-71 kg', label: 'Kelas H (67-71 kg)', minWeight: 67.1, maxWeight: 71, defaultWeight: 69 },
        { id: 'I', name: 'Kelas I', weightRange: '71-75 kg', label: 'Kelas I (71-75 kg)', minWeight: 71.1, maxWeight: 75, defaultWeight: 73 },
        { id: 'J', name: 'Kelas J', weightRange: '75-79 kg', label: 'Kelas J (75-79 kg)', minWeight: 75.1, maxWeight: 79, defaultWeight: 77 },
        { id: 'BEBAS', name: 'Kelas Bebas', weightRange: '>79 kg', label: 'Kelas Bebas (>79 kg)', minWeight: 79.1, maxWeight: 100, defaultWeight: 82 }
      ];

    case 'DEWASA':
      if (gender === 'PUTRI') {
        return [
          { id: 'A', name: 'Kelas A', weightRange: '45-50 kg', label: 'Kelas A (45-50 kg)', minWeight: 45, maxWeight: 50, defaultWeight: 48 },
          { id: 'B', name: 'Kelas B', weightRange: '50-55 kg', label: 'Kelas B (50-55 kg)', minWeight: 50.1, maxWeight: 55, defaultWeight: 52.5 },
          { id: 'C', name: 'Kelas C', weightRange: '55-60 kg', label: 'Kelas C (55-60 kg)', minWeight: 55.1, maxWeight: 60, defaultWeight: 57.5 },
          { id: 'D', name: 'Kelas D', weightRange: '60-65 kg', label: 'Kelas D (60-65 kg)', minWeight: 60.1, maxWeight: 65, defaultWeight: 62.5 },
          { id: 'E', name: 'Kelas E', weightRange: '65-70 kg', label: 'Kelas E (65-70 kg)', minWeight: 65.1, maxWeight: 70, defaultWeight: 67.5 },
          { id: 'F', name: 'Kelas F', weightRange: '70-75 kg', label: 'Kelas F (70-75 kg)', minWeight: 70.1, maxWeight: 75, defaultWeight: 72.5 },
          { id: 'BEBAS', name: 'Kelas Bebas', weightRange: '>75 kg', label: 'Kelas Bebas (>75 kg)', minWeight: 75.1, maxWeight: 100, defaultWeight: 78 }
        ];
      }
      return [
        { id: 'A', name: 'Kelas A', weightRange: '45-50 kg', label: 'Kelas A (45-50 kg)', minWeight: 45, maxWeight: 50, defaultWeight: 48 },
        { id: 'B', name: 'Kelas B', weightRange: '50-55 kg', label: 'Kelas B (50-55 kg)', minWeight: 50.1, maxWeight: 55, defaultWeight: 52.5 },
        { id: 'C', name: 'Kelas C', weightRange: '55-60 kg', label: 'Kelas C (55-60 kg)', minWeight: 55.1, maxWeight: 60, defaultWeight: 57.5 },
        { id: 'D', name: 'Kelas D', weightRange: '60-65 kg', label: 'Kelas D (60-65 kg)', minWeight: 60.1, maxWeight: 65, defaultWeight: 62.5 },
        { id: 'E', name: 'Kelas E', weightRange: '65-70 kg', label: 'Kelas E (65-70 kg)', minWeight: 65.1, maxWeight: 70, defaultWeight: 67.5 },
        { id: 'F', name: 'Kelas F', weightRange: '70-75 kg', label: 'Kelas F (70-75 kg)', minWeight: 70.1, maxWeight: 75, defaultWeight: 72.5 },
        { id: 'G', name: 'Kelas G', weightRange: '75-80 kg', label: 'Kelas G (75-80 kg)', minWeight: 75.1, maxWeight: 80, defaultWeight: 77.5 },
        { id: 'H', name: 'Kelas H', weightRange: '80-85 kg', label: 'Kelas H (80-85 kg)', minWeight: 80.1, maxWeight: 85, defaultWeight: 82.5 },
        { id: 'I', name: 'Kelas I', weightRange: '85-90 kg', label: 'Kelas I (85-90 kg)', minWeight: 85.1, maxWeight: 90, defaultWeight: 87.5 },
        { id: 'J', name: 'Kelas J', weightRange: '90-95 kg', label: 'Kelas J (90-95 kg)', minWeight: 90.1, maxWeight: 95, defaultWeight: 92.5 },
        { id: 'BEBAS', name: 'Kelas Bebas', weightRange: '>95 kg', label: 'Kelas Bebas (>95 kg)', minWeight: 95.1, maxWeight: 120, defaultWeight: 98 }
      ];

    case 'MASTER_1':
    case 'MASTER_2':
    case 'MASTER':
      return [
        { id: 'A', name: 'Kelas A', weightRange: '50-55 kg', label: 'Kelas A (50-55 kg)', minWeight: 50, maxWeight: 55, defaultWeight: 52.5 },
        { id: 'B', name: 'Kelas B', weightRange: '55-60 kg', label: 'Kelas B (55-60 kg)', minWeight: 55.1, maxWeight: 60, defaultWeight: 57.5 },
        { id: 'C', name: 'Kelas C', weightRange: '60-65 kg', label: 'Kelas C (60-65 kg)', minWeight: 60.1, maxWeight: 65, defaultWeight: 62.5 },
        { id: 'D', name: 'Kelas D', weightRange: '65-70 kg', label: 'Kelas D (65-70 kg)', minWeight: 65.1, maxWeight: 70, defaultWeight: 67.5 },
        { id: 'E', name: 'Kelas E', weightRange: '70-75 kg', label: 'Kelas E (70-75 kg)', minWeight: 70.1, maxWeight: 75, defaultWeight: 72.5 },
        { id: 'BEBAS', name: 'Kelas Bebas', weightRange: '>75 kg', label: 'Kelas Bebas (>75 kg)', minWeight: 75.1, maxWeight: 100, defaultWeight: 78 }
      ];

    default:
      return [
        { id: 'A', name: 'Kelas A', weightRange: '45-50 kg', label: 'Kelas A (45-50 kg)', minWeight: 45, maxWeight: 50, defaultWeight: 48 },
        { id: 'B', name: 'Kelas B', weightRange: '50-55 kg', label: 'Kelas B (50-55 kg)', minWeight: 50.1, maxWeight: 55, defaultWeight: 52.5 },
        { id: 'C', name: 'Kelas C', weightRange: '55-60 kg', label: 'Kelas C (55-60 kg)', minWeight: 55.1, maxWeight: 60, defaultWeight: 57.5 },
        { id: 'D', name: 'Kelas D', weightRange: '60-65 kg', label: 'Kelas D (60-65 kg)', minWeight: 60.1, maxWeight: 65, defaultWeight: 62.5 },
        { id: 'BEBAS', name: 'Kelas Bebas', weightRange: 'Bebas', label: 'Kelas Bebas', minWeight: 65.1, maxWeight: 120, defaultWeight: 70 }
      ];
  }
};

/**
 * Nilai default nama grup kelas sesuai kategori
 */
export const getDefaultClassGroupForCategory = (
  category: MatchCategory,
  ageGroup: AgeGroup = 'DEWASA',
  gender: Gender = 'PUTRA'
): string => {
  if (category === 'TANDING') {
    const classes = getIpsiWeightClasses(ageGroup, gender);
    // Cari kelas C sebagai default jika ada, jika tidak pilih kelas pertama
    const classC = classes.find((c) => c.id === 'C');
    return classC ? classC.label : classes[0].label;
  }
  if (category === 'JURUS_TUNGGAL') {
    return 'Tunggal Baku';
  }
  if (category === 'JURUS_GANDA') {
    return 'Ganda Senjata';
  }
  if (category === 'JURUS_REGU') {
    return 'Regu Baku';
  }
  if (category === 'SOLO_KREATIF') {
    return 'Solo Kreatif';
  }
  return 'Jurus Seni';
};
