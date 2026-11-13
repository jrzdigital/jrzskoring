import { useState, useEffect, useMemo } from 'react';

export type DeviceClass = 'mobile' | 'tablet' | 'laptop' | 'desktop' | 'ultrawide';
export type ScreenOrientation = 'portrait' | 'landscape';

export interface ScreenAnalysis {
  width: number;
  height: number;
  areaPixels: number; // Lebar x Tinggi dalam piksel
  areaMegaPixels: number; // Luas dalam Megapiksel (MP)
  aspectRatio: number; // width / height
  aspectRatioFormatted: string; // e.g. "16:9", "4:3", "21:9", "9:16"
  orientation: ScreenOrientation;
  deviceClass: DeviceClass;
  deviceCategoryLabel: string;
  scaleFactor: number;
  isTouch: boolean;
  pixelRatio: number;
  isMobile: boolean;
  isTablet: boolean;
  isLaptop: boolean;
  isDesktop: boolean;
  isUltrawide: boolean;
  isPortrait: boolean;
  isLandscape: boolean;
}

/**
 * Mendapatkan representasi format rasio aspek yang paling mendekati (e.g. 16:9, 4:3, dll)
 */
function getApproximateAspectRatio(ratio: number): string {
  if (ratio >= 2.3) return '21:9 (Ultrawide)';
  if (ratio >= 1.7 && ratio <= 1.85) return '16:9 (Widescreen)';
  if (ratio >= 1.55 && ratio <= 1.68) return '16:10 (Monitor)';
  if (ratio >= 1.45 && ratio <= 1.55) return '3:2';
  if (ratio >= 1.3 && ratio <= 1.4) return '4:3 (Standar)';
  if (ratio >= 0.95 && ratio <= 1.05) return '1:1 (Persegi)';
  if (ratio >= 0.52 && ratio <= 0.6) return '9:16 (Vertikal)';
  if (ratio >= 0.65 && ratio <= 0.8) return '3:4 (Vertikal)';
  return `${ratio.toFixed(2)}:1`;
}

/**
 * Menghitung analisis luas layar perangkat secara komprehensif
 */
function analyzeScreen(): ScreenAnalysis {
  const width = typeof window !== 'undefined' ? window.innerWidth : 1280;
  const height = typeof window !== 'undefined' ? window.innerHeight : 800;
  const areaPixels = width * height;
  const areaMegaPixels = parseFloat((areaPixels / 1_000_000).toFixed(2));
  const aspectRatio = parseFloat((width / (height || 1)).toFixed(3));
  const orientation: ScreenOrientation = width >= height ? 'landscape' : 'portrait';
  const pixelRatio = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1;
  const isTouch = typeof window !== 'undefined' ? ('ontouchstart' in window || navigator.maxTouchPoints > 0) : false;

  // Analisis kelas perangkat berdasarkan dimensi dan luas layar
  let deviceClass: DeviceClass = 'laptop';
  let deviceCategoryLabel = 'Laptop / Layar Standar';
  let scaleFactor = 1.0;

  if (width < 640) {
    deviceClass = 'mobile';
    deviceCategoryLabel = orientation === 'portrait' ? 'Smartphone (Vertikal)' : 'Smartphone (Horizontal)';
    scaleFactor = 0.85;
  } else if (width < 1024) {
    deviceClass = 'tablet';
    deviceCategoryLabel = orientation === 'portrait' ? 'Tablet Juri / Dewan (Vertikal)' : 'Tablet Juri / Dewan (Horizontal)';
    scaleFactor = 0.95;
  } else if (width < 1440) {
    deviceClass = 'laptop';
    deviceCategoryLabel = 'Laptop Sekretariat';
    scaleFactor = 1.0;
  } else if (width < 1920) {
    deviceClass = 'desktop';
    deviceCategoryLabel = 'Monitor Full HD / PC Dewan';
    scaleFactor = 1.05;
  } else {
    deviceClass = 'ultrawide';
    deviceCategoryLabel = 'Monitor TV Gelanggang / Layar Lebar';
    scaleFactor = 1.15;
  }

  const aspectRatioFormatted = getApproximateAspectRatio(aspectRatio);

  return {
    width,
    height,
    areaPixels,
    areaMegaPixels,
    aspectRatio,
    aspectRatioFormatted,
    orientation,
    deviceClass,
    deviceCategoryLabel,
    scaleFactor,
    isTouch,
    pixelRatio,
    isMobile: deviceClass === 'mobile',
    isTablet: deviceClass === 'tablet',
    isLaptop: deviceClass === 'laptop',
    isDesktop: deviceClass === 'desktop',
    isUltrawide: deviceClass === 'ultrawide',
    isPortrait: orientation === 'portrait',
    isLandscape: orientation === 'landscape'
  };
}

/**
 * Hook reaktif untuk membaca, menganalisis, dan memperbarui luas dan ukuran layar perangkat secara otomatis
 */
export function useScreenAnalyzer(): ScreenAnalysis {
  const [screen, setScreen] = useState<ScreenAnalysis>(analyzeScreen);

  useEffect(() => {
    let timeoutId: any = null;

    const handleResize = () => {
      // Debounce frame-friendly
      if (timeoutId) cancelAnimationFrame(timeoutId);
      timeoutId = requestAnimationFrame(() => {
        const next = analyzeScreen();
        setScreen(next);

        // Sematkan atribut ke html element agar styling CSS/Tailwind dapat merespons secara otomatis
        if (typeof document !== 'undefined') {
          const root = document.documentElement;
          root.setAttribute('data-device-class', next.deviceClass);
          root.setAttribute('data-orientation', next.orientation);
          root.style.setProperty('--screen-width', `${next.width}px`);
          root.style.setProperty('--screen-height', `${next.height}px`);
          root.style.setProperty('--screen-scale', String(next.scaleFactor));
          root.style.setProperty('--screen-area-mp', `${next.areaMegaPixels}MP`);
        }
      });
    };

    // Jalankan sekali di awal mount
    handleResize();

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      if (timeoutId) cancelAnimationFrame(timeoutId);
    };
  }, []);

  return screen;
}
