import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { app as firebaseApp, firebaseConfig } from "./services/firebase";

// Pastikan Firebase terinisialisasi pada entry index aplikasi
if (typeof window !== "undefined") {
  (window as any).__JRZ_BOOTED__ = true;
  (window as any).__JRZ_FIREBASE_APP__ = firebaseApp;
  (window as any).__JRZ_FIREBASE_CONFIG__ = firebaseConfig;

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
      <App />
    </React.StrictMode>
  );
}
