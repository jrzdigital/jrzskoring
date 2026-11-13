/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Lock, 
  User, 
  KeyRound, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  CheckCircle2, 
  ArrowLeft,
  UserPlus,
  RotateCcw
} from "lucide-react";
import { UserAccount } from "../types";
import { authService } from "../services/authService";
import { sound } from "../utils/sound";

interface AppLoginModalProps {
  isOpen: boolean;
  onLoginSuccess: (user: UserAccount, isSuperAdmin: boolean) => void;
}

export function AppLoginModal({ isOpen, onLoginSuccess }: AppLoginModalProps) {
  const [view, setView] = useState<"LOGIN" | "REGISTER" | "FORGOT">("LOGIN");
  
  // Login State
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  // Register State
  const [regFullName, setRegFullName] = useState("");
  const [regUsername, setRegUsername] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);
  
  // Forgot Password State
  const [forgotUsername, setForgotUsername] = useState("");
  const [forgotNewPassword, setForgotNewPassword] = useState("");
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState("");
  const [showForgotPass, setShowForgotPass] = useState(false);

  // Status feedback
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  // Sound triggers
  const playClick = () => {
    try { sound.playClick(); } catch {}
  };
  const playSuccess = () => {
    try { sound.playBell(); } catch {}
  };
  const playError = () => {
    try { sound.playBuzzer(); } catch {}
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    playClick();
    setErrorMsg("");
    setSuccessMsg("");

    const cleanUser = username.trim();
    const cleanPass = password.trim();

    if (!cleanUser || !cleanPass) {
      playError();
      setErrorMsg("Mohon isi username dan kata sandi!");
      return;
    }

    setIsLoading(true);

    try {
      // 1. Direct check for Superadmin Account:
      // username: jaka Oktorian
      // password: Abuyaku21*
      const cleanNormalized = cleanUser.toLowerCase().replace(/\s+/g, "");
      const isSuperCreds = 
        (cleanUser === "jaka Oktorian" || cleanNormalized === "jakaoktorian") && 
        cleanPass === "Abuyaku21*";

      if (isSuperCreds) {
        const superAdminUser: UserAccount = {
          id: "usr_superadmin",
          username: "jaka Oktorian",
          password: "Abuyaku21*",
          fullName: "Jaka Oktorian (Super Admin)",
          role: "superadmin",
          status: "APPROVED",
          organization: "Pengurus Besar IPSI",
          emailOrPhone: "jakaoktorian2@gmail.com",
          createdAt: 1700000000000,
          approvedAt: 1700000000000,
          approvedBy: "System Root",
          ipLockEnabled: false
        };

        authService.setCurrentUser(superAdminUser);
        playSuccess();
        setIsLoading(false);
        // Direct superadmin access -> will pop up user management banner
        onLoginSuccess(superAdminUser, true);
        return;
      }

      // 2. Regular user authentication via authService
      const res = await authService.login(cleanUser, cleanPass);
      if (res.success && res.user) {
        authService.setCurrentUser(res.user);
        playSuccess();
        setIsLoading(false);
        const isSuper = res.user.role === "superadmin";
        onLoginSuccess(res.user, isSuper);
      } else {
        playError();
        setErrorMsg(res.error || "Username atau Kata Sandi salah!");
        setIsLoading(false);
      }
    } catch (err: any) {
      playError();
      setErrorMsg("Terjadi kendala saat login. Silakan coba lagi.");
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    playClick();
    setErrorMsg("");
    setSuccessMsg("");

    const cleanUser = regUsername.trim();
    const cleanPass = regPassword.trim();

    if (!cleanUser || !cleanPass) {
      playError();
      setErrorMsg("Username dan Kata Sandi wajib diisi!");
      return;
    }
    if (cleanUser.length < 3) {
      playError();
      setErrorMsg("Username minimal 3 karakter!");
      return;
    }
    if (cleanPass.length < 4) {
      playError();
      setErrorMsg("Kata sandi minimal 4 karakter!");
      return;
    }
    if (cleanPass !== regConfirmPassword.trim()) {
      playError();
      setErrorMsg("Konfirmasi kata sandi tidak cocok!");
      return;
    }

    setIsLoading(true);

    try {
      const res = await authService.register({
        username: cleanUser,
        fullName: regFullName.trim() || cleanUser,
        password: cleanPass,
        role: "admin",
        tier: "FULL"
      });

      if (res.success) {
        playSuccess();
        setSuccessMsg(
          res.message ||
          "Pendaftaran berhasil! Akun Anda sedang menunggu persetujuan (approval) dari Super Admin agar bisa digunakan untuk masuk."
        );
        setUsername(cleanUser);
        setPassword(cleanPass);
        setRegFullName("");
        setRegUsername("");
        setRegPassword("");
        setRegConfirmPassword("");
        setTimeout(() => {
          setView("LOGIN");
          setSuccessMsg("");
        }, 3200);
      } else {
        playError();
        setErrorMsg(res.error || "Gagal membuat akun.");
      }
    } catch (err: any) {
      playError();
      setErrorMsg("Gagal membuat akun: " + (err?.message || "Kesalahan jaringan"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    playClick();
    setErrorMsg("");
    setSuccessMsg("");

    const cleanUser = forgotUsername.trim();
    const cleanNewPass = forgotNewPassword.trim();

    if (!cleanUser || !cleanNewPass) {
      playError();
      setErrorMsg("Username dan Kata Sandi Baru wajib diisi!");
      return;
    }
    if (cleanNewPass.length < 4) {
      playError();
      setErrorMsg("Kata sandi baru minimal 4 karakter!");
      return;
    }
    if (cleanNewPass !== forgotConfirmPassword.trim()) {
      playError();
      setErrorMsg("Konfirmasi kata sandi baru tidak sesuai!");
      return;
    }

    setIsLoading(true);

    try {
      const allUsers = await authService.getAllUsers();
      const user = allUsers.find(
        (u) => (u.username || "").toLowerCase().replace(/\s+/g, "") === cleanUser.toLowerCase().replace(/\s+/g, "")
      );

      if (!user) {
        playError();
        setErrorMsg("Username akun tidak ditemukan!");
        setIsLoading(false);
        return;
      }

      await authService.resetPassword(user.id, cleanNewPass);
      playSuccess();
      setSuccessMsg("Kata sandi berhasil diperbarui! Silakan login.");
      setUsername(user.username);
      setPassword(cleanNewPass);
      setForgotUsername("");
      setForgotNewPassword("");
      setForgotConfirmPassword("");

      setTimeout(() => {
        setView("LOGIN");
        setSuccessMsg("");
      }, 1200);
    } catch (err: any) {
      playError();
      setErrorMsg("Gagal mereset kata sandi: " + (err?.message || "Kesalahan jaringan"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 select-none font-sans overflow-y-auto">
      {/* Background glow effects */}
      <div className="fixed top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-1/4 left-1/2 -translate-x-1/2 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* 
        Compact Popup Banner Container 
        Ukuran skala kecil sesuai login standar aplikasi (max-w-[360px])
      */}
      <div className="relative w-full max-w-[360px] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.7)] p-6 sm:p-7 text-slate-100 flex flex-col items-center">
        
        {/* ======================================================== */}
        {/* VIEW 1: TAMPILAN LOGIN UTAMA (SESUAI SPESIFIKASI PERSIS) */}
        {/* ======================================================== */}
        {view === "LOGIN" && (
          <div className="w-full flex flex-col items-center">
            {/* 1. Paling atas icon gembok */}
            <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/35 flex items-center justify-center text-amber-400 mb-2.5 shadow-[0_0_25px_rgba(245,158,11,0.25)]">
              <Lock className="w-7 h-7" strokeWidth={2.2} />
            </div>

            {/* 2. Dibawahnya tulisan "Login" */}
            <h2 className="text-2xl font-bold tracking-tight text-white mb-4">
              Login
            </h2>

            {/* Error / Success Feedback */}
            {errorMsg && (
              <div className="w-full mb-3.5 p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2 text-left">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span className="leading-tight">{errorMsg}</span>
              </div>
            )}
            {successMsg && (
              <div className="w-full mb-3.5 p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 text-left">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span className="leading-tight">{successMsg}</span>
              </div>
            )}

            {/* Form Otentikasi */}
            <form onSubmit={handleLoginSubmit} className="w-full space-y-3.5">
              {/* 3. Dibawahnya terdapat kotak dialog untuk username */}
              <div className="text-left w-full">
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Username
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Masukkan username"
                    autoFocus
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    className="w-full bg-slate-800/90 border border-slate-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 outline-none transition"
                  />
                </div>
              </div>

              {/* 4. Dan dibawahnya Kata sandi */}
              <div className="text-left w-full">
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Kata Sandi
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan kata sandi"
                    className="w-full bg-slate-800/90 border border-slate-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl pl-9 pr-10 py-2 text-sm text-white placeholder-slate-500 outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/25 active:scale-[0.99] transition duration-150 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    Memverifikasi...
                  </span>
                ) : (
                  <span>Login / Masuk</span>
                )}
              </button>
            </form>

            {/* 5. Dibawahnya sebelah kiri menu buat akun baru dan kanannya menu lupa sandi */}
            <div className="flex items-center justify-between w-full mt-4 pt-3.5 border-t border-slate-800/90 text-xs">
              <button
                type="button"
                onClick={() => {
                  playClick();
                  setErrorMsg("");
                  setSuccessMsg("");
                  setView("REGISTER");
                }}
                className="text-amber-400 hover:text-amber-300 font-semibold transition hover:underline cursor-pointer"
              >
                Buat Akun Baru
              </button>

              <button
                type="button"
                onClick={() => {
                  playClick();
                  setErrorMsg("");
                  setSuccessMsg("");
                  setView("FORGOT");
                }}
                className="text-slate-400 hover:text-slate-200 transition hover:underline cursor-pointer"
              >
                Lupa Sandi?
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW 2: BUAT AKUN BARU                                   */}
        {/* ======================================================== */}
        {view === "REGISTER" && (
          <div className="w-full flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/15 border border-cyan-500/35 flex items-center justify-center text-cyan-400 mb-2.5 shadow-[0_0_25px_rgba(6,182,212,0.25)]">
              <UserPlus className="w-7 h-7" strokeWidth={2.2} />
            </div>

            <h2 className="text-xl font-bold tracking-tight text-white mb-3">
              Buat Akun Baru
            </h2>

            {errorMsg && (
              <div className="w-full mb-3 p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2 text-left">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span className="leading-tight">{errorMsg}</span>
              </div>
            )}
            {successMsg && (
              <div className="w-full mb-3 p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 text-left">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span className="leading-tight">{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleRegisterSubmit} className="w-full space-y-3">
              <div className="text-left w-full">
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nama Lengkap (Opsional)
                </label>
                <input
                  type="text"
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  placeholder="Nama lengkap pengguna"
                  className="w-full bg-slate-800/90 border border-slate-700 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 outline-none transition"
                />
              </div>

              <div className="text-left w-full">
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Username <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  placeholder="Pilih username baru"
                  required
                  autoCapitalize="none"
                  className="w-full bg-slate-800/90 border border-slate-700 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 outline-none transition"
                />
              </div>

              <div className="text-left w-full">
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Kata Sandi <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showRegPassword ? "text" : "password"}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Minimal 4 karakter"
                    required
                    className="w-full bg-slate-800/90 border border-slate-700 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl pl-3 pr-10 py-2 text-sm text-white placeholder-slate-500 outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition"
                  >
                    {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="text-left w-full">
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Konfirmasi Kata Sandi <span className="text-rose-400">*</span>
                </label>
                <input
                  type={showRegPassword ? "text" : "password"}
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  placeholder="Ulangi kata sandi"
                  required
                  className="w-full bg-slate-800/90 border border-slate-700 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 outline-none transition"
                />
              </div>

              {/* Catatan Persetujuan Super Admin */}
              <div className="w-full p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-[11px] text-amber-300 text-left flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                <span className="leading-tight">
                  Pendaftaran akun baru wajib disetujui (di-approve) oleh Super Admin sebelum dapat digunakan untuk masuk ke aplikasi.
                </span>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm shadow-lg shadow-cyan-500/25 active:scale-[0.99] transition duration-150 disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? "Mendaftarkan..." : "Daftar Akun Baru"}
              </button>
            </form>

            <div className="w-full mt-4 pt-3 border-t border-slate-800/90 text-center">
              <button
                type="button"
                onClick={() => {
                  playClick();
                  setErrorMsg("");
                  setSuccessMsg("");
                  setView("LOGIN");
                }}
                className="text-xs text-slate-400 hover:text-amber-400 flex items-center justify-center gap-1 mx-auto transition cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Sudah punya akun? Masuk
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW 3: LUPA KATA SANDI                                  */}
        {/* ======================================================== */}
        {view === "FORGOT" && (
          <div className="w-full flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/15 border border-rose-500/35 flex items-center justify-center text-rose-400 mb-2.5 shadow-[0_0_25px_rgba(244,63,94,0.25)]">
              <RotateCcw className="w-7 h-7" strokeWidth={2.2} />
            </div>

            <h2 className="text-xl font-bold tracking-tight text-white mb-3">
              Lupa Kata Sandi
            </h2>

            {errorMsg && (
              <div className="w-full mb-3 p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2 text-left">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span className="leading-tight">{errorMsg}</span>
              </div>
            )}
            {successMsg && (
              <div className="w-full mb-3 p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 text-left">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span className="leading-tight">{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleForgotSubmit} className="w-full space-y-3">
              <div className="text-left w-full">
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Username Akun
                </label>
                <input
                  type="text"
                  value={forgotUsername}
                  onChange={(e) => setForgotUsername(e.target.value)}
                  placeholder="Masukkan username Anda"
                  required
                  autoCapitalize="none"
                  className="w-full bg-slate-800/90 border border-slate-700 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 outline-none transition"
                />
              </div>

              <div className="text-left w-full">
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Kata Sandi Baru
                </label>
                <div className="relative">
                  <input
                    type={showForgotPass ? "text" : "password"}
                    value={forgotNewPassword}
                    onChange={(e) => setForgotNewPassword(e.target.value)}
                    placeholder="Minimal 4 karakter"
                    required
                    className="w-full bg-slate-800/90 border border-slate-700 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 rounded-xl pl-3 pr-10 py-2 text-sm text-white placeholder-slate-500 outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowForgotPass(!showForgotPass)}
                    tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition"
                  >
                    {showForgotPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="text-left w-full">
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Konfirmasi Sandi Baru
                </label>
                <input
                  type={showForgotPass ? "text" : "password"}
                  value={forgotConfirmPassword}
                  onChange={(e) => setForgotConfirmPassword(e.target.value)}
                  placeholder="Ulangi kata sandi baru"
                  required
                  className="w-full bg-slate-800/90 border border-slate-700 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 outline-none transition"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 text-white font-bold text-sm shadow-lg shadow-rose-500/25 active:scale-[0.99] transition duration-150 disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? "Menyimpan..." : "Reset Kata Sandi"}
              </button>
            </form>

            <div className="w-full mt-4 pt-3 border-t border-slate-800/90 text-center">
              <button
                type="button"
                onClick={() => {
                  playClick();
                  setErrorMsg("");
                  setSuccessMsg("");
                  setView("LOGIN");
                }}
                className="text-xs text-slate-400 hover:text-amber-400 flex items-center justify-center gap-1 mx-auto transition cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Kembali ke Login
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
