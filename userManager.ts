import fs from "fs";
import path from "path";

export interface UserRecord {
  id: string;
  username: string;
  password?: string;
  name: string;
  role: "superadmin" | "sekretaris" | "dewan" | "juri" | "operator" | "monitor";
  arenaAccess: string;
  isApproved: boolean;
  boundIp?: string;
  isIpLocked: boolean;
  createdAt: number;
}

const DEFAULT_USERS_DATA: UserRecord[] = [
  {
    id: "usr-admin-1",
    username: "superadmin",
    password: "ipsi2026admin",
    name: "Ketua Dewan & Pertandingan",
    role: "superadmin",
    arenaAccess: "SEMUA",
    isApproved: true,
    isIpLocked: false,
    createdAt: Date.now()
  },
  {
    id: "usr-dewan-1",
    username: "dewan",
    password: "dewan2026",
    name: "Ketua Pertandingan Arena A",
    role: "dewan",
    arenaAccess: "ARENA A",
    isApproved: true,
    isIpLocked: false,
    createdAt: Date.now()
  },
  {
    id: "usr-sekretaris-1",
    username: "sekretaris",
    password: "sekretaris2026",
    name: "Sekretaris Pertandingan",
    role: "sekretaris",
    arenaAccess: "SEMUA",
    isApproved: true,
    isIpLocked: false,
    createdAt: Date.now()
  },
  {
    id: "usr-juri-1",
    username: "juri1",
    password: "juri2026",
    name: "Juri 1 Arena A",
    role: "juri",
    arenaAccess: "ARENA A",
    isApproved: true,
    isIpLocked: false,
    createdAt: Date.now()
  },
  {
    id: "usr-operator-1",
    username: "operator",
    password: "operator2026",
    name: "Operator Tanding",
    role: "operator",
    arenaAccess: "ARENA A",
    isApproved: true,
    isIpLocked: false,
    createdAt: Date.now()
  },
  {
    id: "usr-monitor-1",
    username: "monitor",
    password: "monitor2026",
    name: "Layar Scoreboard Arena",
    role: "monitor",
    arenaAccess: "ARENA A",
    isApproved: true,
    isIpLocked: false,
    createdAt: Date.now()
  }
];

let users: UserRecord[] = [...DEFAULT_USERS_DATA];
let activityLogs: any[] = [];
let passwordResetRequests: any[] = [];
let ipUnlockRequests: any[] = [];

export function loginUser(username?: string, password?: string, ip?: string) {
  if (!username) return { success: false, message: "Username wajib diisi" };
  const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
  if (!user) {
    return { success: false, message: "Pengguna tidak ditemukan" };
  }
  if (user.password && password && user.password !== password) {
    return { success: false, message: "Password salah" };
  }
  if (!user.isApproved) {
    return { success: false, message: "Akun belum disetujui oleh Administrator" };
  }
  if (user.isIpLocked && user.boundIp && user.boundIp !== ip) {
    return { success: false, message: `Akun terkunci pada IP ${user.boundIp}. IP Anda: ${ip}` };
  }
  if (ip && !user.boundIp) {
    user.boundIp = ip;
  }
  return {
    success: true,
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      arenaAccess: user.arenaAccess,
      boundIp: user.boundIp
    }
  };
}

export function registerUser(data: any, ip?: string) {
  const username = data?.username?.trim();
  if (!username) return { success: false, message: "Username wajib diisi" };
  if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
    return { success: false, message: "Username sudah terdaftar" };
  }
  const newUser: UserRecord = {
    id: `usr-${Date.now()}`,
    username,
    password: data.password || "ipsi2026",
    name: data.name || username,
    role: data.role || "juri",
    arenaAccess: data.arenaAccess || "ARENA A",
    isApproved: false,
    boundIp: ip,
    isIpLocked: false,
    createdAt: Date.now()
  };
  users.push(newUser);
  return { success: true, user: newUser };
}

export function getAllUsers() {
  return users.map(u => ({
    id: u.id,
    username: u.username,
    name: u.name,
    role: u.role,
    arenaAccess: u.arenaAccess,
    isApproved: u.isApproved,
    boundIp: u.boundIp,
    isIpLocked: u.isIpLocked
  }));
}

export function approveUser(targetKey: string, approvedBy: string, ip?: string) {
  const user = users.find(u => u.id === targetKey || u.username === targetKey);
  if (!user) return { success: false, message: "Pengguna tidak ditemukan" };
  user.isApproved = true;
  return { success: true, user };
}

export function rejectUser(targetKey: string, rejectedBy: string, ip?: string) {
  users = users.filter(u => u.id !== targetKey && u.username !== targetKey);
  return { success: true };
}

export function createUserByAdmin(data: any, createdBy: string, ip?: string) {
  return registerUser(data, ip);
}

export function updateUserByAdmin(data: any, updatedBy: string, ip?: string) {
  const user = users.find(u => u.id === data.id || u.username === data.username);
  if (!user) return { success: false, message: "Pengguna tidak ditemukan" };
  if (data.name) user.name = data.name;
  if (data.role) user.role = data.role;
  if (data.arenaAccess) user.arenaAccess = data.arenaAccess;
  if (data.password) user.password = data.password;
  return { success: true, user };
}

export function resetPasswordByAdmin(data: any, resetBy: string, ip?: string) {
  const user = users.find(u => u.id === data.id || u.username === data.username);
  if (!user) return { success: false, message: "Pengguna tidak ditemukan" };
  user.password = data.newPassword || "ipsi2026";
  return { success: true };
}

export function deleteUserByAdmin(data: any, deletedBy: string, ip?: string) {
  const id = data?.id || data;
  users = users.filter(u => u.id !== id && u.username !== id);
  return { success: true };
}

export function getActivityLogs() {
  return activityLogs;
}

export function createPasswordResetRequest(data: any, ip?: string) {
  const req = { id: `reset-${Date.now()}`, ...data, ip, timestamp: Date.now() };
  passwordResetRequests.push(req);
  return { success: true, request: req };
}

export function getPasswordResetRequests() {
  return passwordResetRequests;
}

export function approvePasswordResetRequest(id: string, approvedBy: string, ip?: string) {
  passwordResetRequests = passwordResetRequests.filter(r => r.id !== id);
  return { success: true };
}

export function rejectPasswordResetRequest(id: string, rejectedBy: string, ip?: string) {
  passwordResetRequests = passwordResetRequests.filter(r => r.id !== id);
  return { success: true };
}

export function verifyResetToken(token: string) {
  return { valid: true };
}

export function resetPasswordWithToken(data: any) {
  return { success: true };
}

export function createIpUnlockRequest(data: any, ip?: string) {
  const req = { id: `unlock-${Date.now()}`, ...data, ip, timestamp: Date.now() };
  ipUnlockRequests.push(req);
  return { success: true, request: req };
}

export function getIpUnlockRequests() {
  return ipUnlockRequests;
}

export function approveIpUnlockRequest(id: string, approvedBy: string, ip?: string) {
  ipUnlockRequests = ipUnlockRequests.filter(r => r.id !== id);
  return { success: true };
}

export function rejectIpUnlockRequest(id: string, rejectedBy: string, ip?: string) {
  ipUnlockRequests = ipUnlockRequests.filter(r => r.id !== id);
  return { success: true };
}

export function resetUserBoundIp(userId: string, resetBy: string, ip?: string) {
  const user = users.find(u => u.id === userId || u.username === userId);
  if (user) user.boundIp = undefined;
  return { success: true };
}

export function updateUserBoundIp(userId: string, newIp: string, updatedBy: string, ip?: string) {
  const user = users.find(u => u.id === userId || u.username === userId);
  if (user) user.boundIp = newIp;
  return { success: true };
}

export function toggleUserIpLock(userId: string, isLocked: boolean, updatedBy: string, ip?: string) {
  const user = users.find(u => u.id === userId || u.username === userId);
  if (user) user.isIpLocked = isLocked;
  return { success: true };
}

export async function syncUsersWithCloudRtdb() {
  return true;
}
