/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  ShieldCheck, 
  Users, 
  Plus, 
  Trash2, 
  KeyRound, 
  Eye, 
  EyeOff, 
  Search, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw,
  UserPlus,
  Shield,
  Save,
  UserCheck,
  Lock,
  Clock,
  Globe
} from "lucide-react";
import { UserAccount, UserRole, UserStatus } from "../types";
import { authService, DEFAULT_USERS } from "../services/authService";
import { subscribeToUsers } from "../services/firebase";
import { sound } from "../utils/sound";

interface SuperAdminUserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount | null;
}

export function SuperAdminUserManagementModal({
  isOpen,
  onClose,
  currentUser
}: SuperAdminUserManagementModalProps) {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Visible passwords map
  const [visiblePasswords, setVisiblePasswords] = useState<{ [userId: string]: boolean }>({});

  // Add User Form Modal/Drawer State
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newFullName, setNewFullName] = useState("");
  const [newRole, setNewRole] = useState<UserRole>("admin");
  const [newOrganization, setNewOrganization] = useState("IPSI Gelanggang");

  // Edit / Reset Password Form Modal State
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editNewPassword, setEditNewPassword] = useState("");

  const playClick = () => {
    try { sound.playClick(); } catch {}
  };
  const playSuccess = () => {
    try { sound.playBell(); } catch {}
  };
  const playError = () => {
    try { sound.playBuzzer(); } catch {}
  };

  const loadUsers = async (silent = false) => {
    if (!silent) setLoading(true);
    setErrorMsg("");
    try {
      const list = await authService.getAllUsers();
      setUsers(list);
    } catch (err) {
      if (!silent) setUsers(DEFAULT_USERS);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    loadUsers();

    // 1. Subscribe ke Firebase Realtime Database untuk sinkronisasi instan antar-perangkat & jaringan
    const unsubscribe = subscribeToUsers((cloudUsers) => {
      if (Array.isArray(cloudUsers) && cloudUsers.length > 0) {
        setUsers((prev) => {
          const map = new Map<string, UserAccount>();
          prev.forEach((u) => {
            if (u && u.username) map.set(u.username.toLowerCase().trim(), u);
          });
          cloudUsers.forEach((u) => {
            if (u && u.username) {
              const key = u.username.toLowerCase().trim();
              const existing = map.get(key);
              map.set(key, { ...existing, ...u });
            }
          });
          return Array.from(map.values());
        });
      }
    });

    // 2. Polling otomatis berkala (setiap 3.5 detik) agar data dari laptop lain langsung masuk tanpa perlu tutup-buka modal
    const interval = setInterval(() => {
      loadUsers(true);
    }, 3500);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const togglePasswordVisibility = (userId: string) => {
    playClick();
    setVisiblePasswords(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    playClick();
    setErrorMsg("");
    setSuccessMsg("");

    const cleanUser = newUsername.trim();
    const cleanPass = newPassword.trim();
    if (!cleanUser || !cleanPass) {
      playError();
      setErrorMsg("Username dan Kata Sandi wajib diisi!");
      return;
    }

    try {
      const res = await authService.createUser({
        username: cleanUser,
        password: cleanPass,
        fullName: newFullName.trim() || cleanUser,
        role: newRole,
        organization: newOrganization.trim() || "IPSI",
        createdBy: "jaka Oktorian (Super Admin)"
      });

      if (res.success) {
        playSuccess();
        setSuccessMsg(`Akun login "${cleanUser}" berhasil ditambahkan!`);
        setNewUsername("");
        setNewPassword("");
        setNewFullName("");
        setShowAddForm(false);
        await loadUsers();
      } else {
        playError();
        setErrorMsg(res.error || "Gagal membuat akun.");
      }
    } catch (err: any) {
      playError();
      setErrorMsg("Gagal membuat user: " + err.message);
    }
  };

  const handleResetPasswordSubmit = async (userId: string) => {
    playClick();
    if (!editNewPassword.trim()) {
      playError();
      setErrorMsg("Kata sandi baru tidak boleh kosong!");
      return;
    }

    try {
      const res = await authService.resetPassword(userId, editNewPassword.trim());
      if (res.success) {
        playSuccess();
        setSuccessMsg("Kata sandi pengguna berhasil diperbarui!");
        setEditingUserId(null);
        setEditNewPassword("");
        await loadUsers();
      } else {
        playError();
        setErrorMsg(res.error || "Gagal mengubah kata sandi.");
      }
    } catch (err: any) {
      playError();
      setErrorMsg("Terjadi kesalahan: " + err.message);
    }
  };

  const handleApproveUser = async (user: UserAccount) => {
    playClick();
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const res = await authService.approveUser(user.id || user.username, "jaka Oktorian (Super Admin)");
      if (res.success) {
        playSuccess();
        setSuccessMsg(`Akun "${user.username}" (${user.fullName || "Pengguna"}) berhasil DISETUJUI & DIAKTIFKAN!`);
        setUsers(prev => prev.map(u => (u.id === user.id || u.username === user.username) ? { ...u, status: "APPROVED", approvedAt: Date.now(), approvedBy: "jaka Oktorian (Super Admin)" } : u));
        await loadUsers();
      } else {
        playError();
        setErrorMsg(res.error || "Gagal menyetujui akun.");
      }
    } catch (err: any) {
      playError();
      setErrorMsg("Gagal menyetujui akun: " + err.message);
    }
  };

  const handleDeleteUser = async (user: UserAccount) => {
    playClick();
    setErrorMsg("");
    setSuccessMsg("");
    const isSuper = user.role === "superadmin" || 
      user.username.toLowerCase().replace(/\s+/g, "") === "jakaoktorian";
    
    if (isSuper) {
      playError();
      setErrorMsg("Akun Super Admin utama tidak dapat dihapus!");
      return;
    }

    if (!window.confirm(`Hapus data akun login "${user.username}" (${user.fullName || "Pengguna"}) secara permanen dari sistem?`)) {
      return;
    }

    try {
      // Optimistically update UI so user disappears immediately
      setUsers(prev => prev.filter(u => u.id !== user.id && (u.username || "").toLowerCase().trim() !== (user.username || "").toLowerCase().trim()));

      const res = await authService.deleteUser(user.id, user.username);
      if (res.success) {
        playSuccess();
        setSuccessMsg(`Akun "${user.username}" berhasil dihapus secara permanen dari sistem.`);
        await loadUsers();
      } else {
        playError();
        setErrorMsg(res.error || "Gagal menghapus user.");
        await loadUsers();
      }
    } catch (err: any) {
      playError();
      setErrorMsg("Gagal menghapus user: " + err.message);
      await loadUsers();
    }
  };

  const handleToggleStatus = async (user: UserAccount) => {
    playClick();
    setErrorMsg("");
    setSuccessMsg("");
    const isSuper = user.role === "superadmin";
    if (isSuper) return;

    if (user.status === "PENDING") {
      await handleApproveUser(user);
      return;
    }

    const nextStatus: UserStatus = user.status === "APPROVED" ? "SUSPENDED" : "APPROVED";
    try {
      await authService.updateUser({
        id: user.id,
        status: nextStatus
      });
      playSuccess();
      setSuccessMsg(`Status akun "${user.username}" diubah menjadi ${nextStatus === "APPROVED" ? "Aktif" : "Dinonaktifkan"}.`);
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: nextStatus } : u));
      await loadUsers();
    } catch (err: any) {
      playError();
      setErrorMsg("Gagal memperbarui status user.");
    }
  };

  const filteredUsers = users.filter(u => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      (u.username && u.username.toLowerCase().includes(q)) ||
      (u.fullName && u.fullName.toLowerCase().includes(q)) ||
      (u.role && u.role.toLowerCase().includes(q))
    );
  });

  const pendingUsersCount = users.filter(u => u.status === "PENDING" && u.role !== "superadmin").length;

  return (
    <div className="fixed inset-0 z-[99999] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 select-none font-sans overflow-y-auto">
      {/* Modal Card Banner */}
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[92vh] text-slate-100">
        
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 px-5 py-4 flex items-center justify-between text-slate-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-950/20 backdrop-blur-sm border border-slate-950/20 flex items-center justify-center text-slate-950">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black uppercase tracking-wide">
                  Kelola Data Login Pengguna Aplikasi
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-slate-950 text-amber-400 uppercase tracking-wider">
                  Super Admin
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-slate-950/30 text-slate-950 border border-slate-950/20 backdrop-blur-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-700 animate-pulse" />
                  <Globe className="w-3 h-3" />
                  Cloud Realtime: Multi-Laptop & Beda Jaringan
                </span>
              </div>
              <p className="text-xs text-slate-900/90 font-medium">
                Kredensial Aktif: <strong className="underline">jaka Oktorian</strong> — Sinkronisasi Otomatis Seluruh Perangkat Jarak Jauh
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              playClick();
              onClose();
            }}
            className="w-9 h-9 rounded-xl bg-slate-950/20 hover:bg-slate-950/30 text-slate-950 flex items-center justify-center transition cursor-pointer"
            title="Tutup Menu Kelola"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Toolbar */}
        <div className="p-4 bg-slate-800/60 border-b border-slate-700/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-grow max-w-md">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari berdasarkan username, nama, atau role..."
                className="w-full bg-slate-900/90 border border-slate-700 focus:border-amber-500 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none"
              />
            </div>
            <button
              onClick={loadUsers}
              disabled={loading}
              title="Segarkan Data"
              className="p-2 rounded-xl bg-slate-700/80 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                playClick();
                setShowAddForm(true);
                setErrorMsg("");
                setSuccessMsg("");
              }}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              Tambah Akun Baru
            </button>
            <button
              onClick={() => {
                playClick();
                onClose();
              }}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition cursor-pointer"
            >
              <UserCheck className="w-4 h-4" />
              Masuk ke Aplikasi
            </button>
          </div>
        </div>

        {/* Banner Peringatan Pendaftaran Baru Menunggu Persetujuan */}
        {pendingUsersCount > 0 && (
          <div className="mx-4 mt-3 p-3 rounded-xl bg-amber-500/20 border border-amber-500/50 text-amber-200 text-xs flex items-center justify-between gap-3 shadow-lg shadow-amber-950/40">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/30 border border-amber-400/50 flex items-center justify-center text-amber-300 shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-amber-300 block text-sm">
                  {pendingUsersCount} Akun Pendaftaran Baru Menunggu Persetujuan!
                </span>
                <span className="text-[11px] text-amber-200/90">
                  Pengguna tidak dapat mengakses aplikasi sebelum disetujui. Klik tombol <strong className="text-emerald-400">"Setujui"</strong> pada baris akun di bawah untuk mengaktifkannya.
                </span>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-amber-400 text-slate-950 font-black text-[10.5px] uppercase tracking-wider shrink-0">
              Perlu Tindakan
            </span>
          </div>
        )}

        {/* Alert Notifications */}
        {errorMsg && (
          <div className="mx-4 mt-3 p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="mx-4 mt-3 p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Content Body: Table of Users */}
        <div className="p-4 overflow-y-auto flex-grow max-h-[58vh]">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 text-xs gap-2">
              <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
              <span>Memuat database akun pengguna...</span>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              Tidak ada akun yang sesuai dengan pencarian "{searchQuery}".
            </div>
          ) : (
            <div className="border border-slate-700/80 rounded-xl overflow-hidden bg-slate-900/60">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-800/90 text-slate-300 uppercase tracking-wider font-semibold border-b border-slate-700 text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3">Username</th>
                    <th className="py-2.5 px-3">Nama Lengkap</th>
                    <th className="py-2.5 px-3">Role / Peran</th>
                    <th className="py-2.5 px-3">Kata Sandi</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-200">
                  {filteredUsers.map((u) => {
                    const isSuper = u.role === "superadmin" || 
                      (u.username && u.username.toLowerCase().replace(/\s+/g, '') === "jakaoktorian");
                    const isPasswordShown = !!visiblePasswords[u.id];
                    const isEditingThisUser = editingUserId === u.id;

                    return (
                      <tr key={u.id} className="hover:bg-slate-800/40 transition">
                        {/* Username */}
                        <td className="py-2.5 px-3 font-semibold text-white">
                          <div className="flex items-center gap-1.5">
                            {isSuper && (
                              <span className="w-2 h-2 rounded-full bg-amber-400 ring-2 ring-amber-400/30" />
                            )}
                            <span>{u.username}</span>
                          </div>
                        </td>

                        {/* Nama Lengkap */}
                        <td className="py-2.5 px-3 text-slate-300">
                          {u.fullName || "-"}
                        </td>

                        {/* Role */}
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            isSuper
                              ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                              : u.role === "admin"
                              ? "bg-blue-500/20 text-blue-300 border border-blue-500/40"
                              : "bg-slate-700 text-slate-300"
                          }`}>
                            {u.role || "umum"}
                          </span>
                        </td>

                        {/* Kata Sandi */}
                        <td className="py-2.5 px-3 font-mono">
                          {isEditingThisUser ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                value={editNewPassword}
                                onChange={(e) => setEditNewPassword(e.target.value)}
                                placeholder="Sandi baru"
                                className="bg-slate-800 border border-amber-500 rounded px-2 py-1 text-xs text-white w-28 outline-none"
                              />
                              <button
                                onClick={() => handleResetPasswordSubmit(u.id)}
                                className="p-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
                                title="Simpan Sandi"
                              >
                                <Save className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  setEditingUserId(null);
                                  setEditNewPassword("");
                                }}
                                className="p-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-300"
                                title="Batal"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="text-slate-200">
                                {isPasswordShown ? (u.password || "******") : "••••••••"}
                              </span>
                              <button
                                onClick={() => togglePasswordVisibility(u.id)}
                                className="text-slate-400 hover:text-white p-0.5 transition"
                                title={isPasswordShown ? "Sembunyikan sandi" : "Lihat sandi"}
                              >
                                {isPasswordShown ? (
                                  <EyeOff className="w-3.5 h-3.5" />
                                ) : (
                                  <Eye className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-2.5 px-3">
                          {u.status === "PENDING" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40">
                              <Clock className="w-3 h-3 text-amber-400 shrink-0" />
                              <span>Menunggu Approval</span>
                            </span>
                          ) : u.status === "APPROVED" ? (
                            <button
                              onClick={() => handleToggleStatus(u)}
                              disabled={isSuper}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase transition ${
                                !isSuper ? "hover:opacity-80 cursor-pointer" : "cursor-default"
                              } bg-emerald-500/20 text-emerald-300 border border-emerald-500/30`}
                              title={isSuper ? "Super Admin Aktif" : "Klik untuk menonaktifkan akun"}
                            >
                              <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                              <span>Aktif</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleToggleStatus(u)}
                              disabled={isSuper}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase transition hover:opacity-80 cursor-pointer bg-rose-500/20 text-rose-300 border border-rose-500/30"
                              title="Klik untuk mengaktifkan kembali akun"
                            >
                              <X className="w-3 h-3 text-rose-400 shrink-0" />
                              <span>Dinonaktifkan</span>
                            </button>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Tombol Setujui / Approve untuk status PENDING */}
                            {u.status === "PENDING" && !isSuper && (
                              <button
                                onClick={() => handleApproveUser(u)}
                                title="Setujui pendaftaran & aktifkan akun pengguna ini"
                                className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 shadow-md shadow-emerald-950/40 transition cursor-pointer active:scale-95"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                                <span>Setujui</span>
                              </button>
                            )}

                            {!isEditingThisUser && (
                              <button
                                onClick={() => {
                                  playClick();
                                  setEditingUserId(u.id);
                                  setEditNewPassword(u.password || "");
                                }}
                                title="Ubah Kata Sandi"
                                className="p-1 rounded bg-slate-700/60 hover:bg-slate-700 text-slate-300 hover:text-amber-400 transition cursor-pointer"
                              >
                                <KeyRound className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {!isSuper && (
                              <button
                                onClick={() => handleDeleteUser(u)}
                                title="Hapus Akun Pengguna Secara Permanen"
                                className="p-1 rounded bg-rose-500/10 hover:bg-rose-500/30 text-rose-400 hover:text-rose-300 transition cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Add User Modal Dialog Overlay (when showAddForm is true) */}
        {showAddForm && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4 z-10">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 w-full max-w-md shadow-2xl text-slate-100">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-amber-400" />
                  <h3 className="font-bold text-sm">Tambah Akun Login Baru</h3>
                </div>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Username *</label>
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="Contoh: juri1, operator_b"
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Kata Sandi *</label>
                  <input
                    type="text"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimal 4 karakter"
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Nama Lengkap</label>
                  <input
                    type="text"
                    value={newFullName}
                    onChange={(e) => setNewFullName(e.target.value)}
                    placeholder="Nama operator / petugas"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-amber-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Peran / Role</label>
                    <select
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value as UserRole)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-amber-500"
                    >
                      <option value="admin">Operator Gelanggang (Admin)</option>
                      <option value="juri">Juri Penilai</option>
                      <option value="dewan">Ketua Dewan Juri</option>
                      <option value="sekretaris">Sekretaris Pertandingan</option>
                      <option value="umum">Pengunjung / Umum</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Instansi / Unit</label>
                    <input
                      type="text"
                      value={newOrganization}
                      onChange={(e) => setNewOrganization(e.target.value)}
                      placeholder="IPSI / Gelanggang A"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 mt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
                  >
                    Simpan Akun
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Footer info */}
        <div className="px-5 py-3 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span>Semua kredensial tersinkronisasi aman pada sistem & database lokal.</span>
          </div>
          <button
            onClick={() => {
              playClick();
              onClose();
            }}
            className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition cursor-pointer"
          >
            Tutup & Buka Aplikasi
          </button>
        </div>

      </div>
    </div>
  );
}
