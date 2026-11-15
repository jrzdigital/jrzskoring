import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ErrorBoundary } from "./components/ErrorBoundary";
import "./index.css";
import { app as firebaseApp, firebaseConfig } from "./services/firebase";
import { installStaticApiFetchGuard } from "./utils/networkHost";

// Pastikan Firebase terinisialisasi pada entry index aplikasi
if (typeof window !== "undefined") {
  installStaticApiFetchGuard();
  (window as any).__JRZ_BOOTED__ = true;
  (window as any).__JRZ_FIREBASE_APP__ = firebaseApp;
  (window as any).__JRZ_FIREBASE_CONFIG__ = firebaseConfig;

  // Tangani Vite preloadError (ketika chunk hash lama dicache setelah deploy baru)
  window.addEventListener("vite:preloadError", (event) => {
    event.preventDefault();
    window.location.reload();
  });

  // Hapus registrasi Service Worker offline lama agar aplikasi selalu online langsung ke Firebase
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .getRegistrations()
      .then((registrations) => {
        registrations.forEach((registration) => {
          registration.unregister().catch(() => {});
        });
      })
      .catch(() => {});
  }
}

const rootElement = document.getElementById("root");
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );
}
