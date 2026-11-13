/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from "react";

interface MobileViewportScalerProps {
  children: React.ReactNode;
}

export const MobileViewportScaler: React.FC<MobileViewportScalerProps> = ({ children }) => {
  const [windowDim, setWindowDim] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 1280,
    height: typeof window !== "undefined" ? window.innerHeight : 800,
  });

  const [isMobileOrTablet, setIsMobileOrTablet] = useState(false);
  const [nativeMobileFit, setNativeMobileFit] = useState<boolean>(() => {
    if (typeof document !== "undefined") {
      return document.documentElement.hasAttribute("data-native-mobile-fit");
    }
    return false;
  });

  // Listen for native mobile fit overrides from responsive panels (e.g. iOS/Android Slider Jury Pad)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const syncOverride = () => {
      setNativeMobileFit(document.documentElement.hasAttribute("data-native-mobile-fit"));
    };
    syncOverride();
    window.addEventListener("jrz_scaler_override", syncOverride);
    return () => window.removeEventListener("jrz_scaler_override", syncOverride);
  }, []);

  // Check device type and update dimensions
  useEffect(() => {
    if (typeof window === "undefined") return;

    const checkDevice = () => {
      const ua = navigator.userAgent || "";
      const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
      const isAndroid = /Android/i.test(ua);
      const isTouch = navigator.maxTouchPoints > 0;
      const isSmallScreen = window.innerWidth < 1140;

      setIsMobileOrTablet(isIOS || isAndroid || (isTouch && isSmallScreen) || isSmallScreen);
      setWindowDim({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    checkDevice();

    const handleResize = () => {
      setWindowDim({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
    };
  }, []);

  // Calculate proportional scale to shrink and fit iOS / Android screens
  const { scale, baseWidth, baseHeight, isLandscape } = useMemo(() => {
    const { width, height } = windowDim;
    const isLand = width > height;

    // Ideal layout dimensions where full 3-column / 12-column layouts remain intact without wrapping
    const targetWidth = 1140;
    const targetHeight = isLand ? 660 : 860;

    if (!isMobileOrTablet && width >= targetWidth && height >= 650) {
      return { scale: 1, baseWidth: targetWidth, baseHeight: targetHeight, isLandscape: isLand };
    }

    // Width-based scale factor
    const scaleW = width / targetWidth;

    // In mobile landscape (e.g. phone held horizontally): fit BOTH width and height so nothing is clipped
    let autoScale: number;
    if (isLand && height < 680) {
      const scaleH = (height - 8) / targetHeight;
      autoScale = Math.min(scaleW, scaleH);
    } else {
      // In portrait: fit width precisely
      autoScale = Math.min(scaleW, 1.0);
    }

    // Clamp safe scale between 0.25 and 1.05
    const finalScale = Math.min(1.05, Math.max(0.25, Number(autoScale.toFixed(3))));

    return {
      scale: finalScale,
      baseWidth: targetWidth,
      baseHeight: targetHeight,
      isLandscape: isLand,
    };
  }, [windowDim, isMobileOrTablet]);

  // Support for CSS zoom detection (natively supported in modern iOS Safari 15.4+ and Android Chrome)
  const supportsZoom = useMemo(() => {
    if (typeof document === "undefined") return true;
    return typeof (document.body.style as any).zoom !== "undefined";
  }, []);

  const isScaled = !nativeMobileFit && isMobileOrTablet && scale < 0.99;

  return (
    <div className="relative w-full min-h-screen overflow-x-hidden mobile-scaler-wrapper">
      {isScaled ? (
        <div
          id="jrz-mobile-fit-container"
          style={
            supportsZoom
              ? {
                  zoom: scale,
                  minWidth: `${baseWidth}px`,
                  width: "100%",
                }
              : {
                  transform: `scale(${scale})`,
                  transformOrigin: "top center",
                  width: `${baseWidth}px`,
                  minHeight: `${windowDim.height / scale}px`,
                  marginLeft: "auto",
                  marginRight: "auto",
                }
          }
        >
          {children}
        </div>
      ) : (
        children
      )}
    </div>
  );
};
